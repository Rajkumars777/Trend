import os
import sys
import requests
import pymongo
import xml.etree.ElementTree as ET
import re
import hashlib
from datetime import datetime
from dotenv import load_dotenv
from pymongo import UpdateOne
import random
import time

# Add script dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load Environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv('MONGODB_URI')
if not MONGO_URI:
    MONGO_URI = 'mongodb://localhost:27017/agri_trend_dashboard'

print(f"🔌 [Social] Connecting to MongoDB...")
client = pymongo.MongoClient(MONGO_URI)
db = client.get_database('agri_trend_dashboard')

# ==========================================
# ENTERPRISE GATEKEEPER & KEYWORDS
# ==========================================
try:
    from utils.ai_client import AgriAIClient
    print("🧠 [INIT] Initializing AgriAIClient for Real-Time Analysis...")
    AI = AgriAIClient()
except ImportError:
    print("⚠️ [INIT] AgriAIClient NOT FOUND. Aborting.")
    sys.exit(1)

# Import Centralized Keywords (Robust Path Finding)
SEARCH_KEYWORDS = []
HASHTAGS = []

try:
    # Direct absolute path import to guarantee it works
    utils_path = os.path.join(BASE_DIR, 'utils')
    sys.path.insert(0, utils_path)
    
    import agri_keywords
    SEARCH_KEYWORDS = list(set(agri_keywords.ALL_KEYWORDS))
    HASHTAGS = agri_keywords.HASHTAGS
    print(f"📚 [INIT] Loaded {len(SEARCH_KEYWORDS)} Agri-Keywords (Absolute Import).")
except ImportError:
    print("⚠️ [INIT] agri_keywords.py NOT FOUND. Using fallback list.")
    SEARCH_KEYWORDS = ["agriculture", "farming", "crop yield", "rice farming", "wheat harvest"]
    HASHTAGS = ["agriculture", "farming"]

# ==========================================
# DATA FETCHING
# ==========================================

def display_source_header(source_name):
    print(f"   🔹 Fetching {source_name}...")

def fetch_reddit(dry_run=False):
    display_source_header("Reddit (Deep Fetch)")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    
    if not SEARCH_KEYWORDS: return 0

    # Randomly select a subset to ensure variety per run
    # (Since we loop 500 times, we can cover a lot)
    selected_keywords = random.sample(SEARCH_KEYWORDS, min(len(SEARCH_KEYWORDS), 20))
    chunks = [selected_keywords[i:i + 3] for i in range(0, len(selected_keywords), 3)]
    
    total_upserted = 0
    MAX_LOOPS = 500 
    
    for chunk in chunks:
        query = " OR ".join([f'"{k}"' for k in chunk])
        import urllib.parse
        encoded_query = urllib.parse.quote(query)
        after = None
        
        for i in range(MAX_LOOPS):
            page_posts = []
            try:
                url = f"https://www.reddit.com/search.json?q={encoded_query}&sort=new&limit=100"
                if after: url += f"&after={after}"
                
                print(f"      📡 Reddit Page {i+1} (Query: {chunk[0]}...)...")
                resp = requests.get(url, headers=headers, timeout=10)
                
                if resp.status_code != 200:
                    print(f"      ⚠️ Reddit Block (Page {i+1}): {resp.status_code}")
                    break
                    
                data = resp.json()
                children = data.get('data', {}).get('children', [])
                
                if not children: break
                    
                for child in children:
                    item = child['data']
                    title = item.get('title', '')
                    content = item.get('selftext', '') or title
                    combined_text = f"{title} {content}"
                    
                    # [AI ANALYSIS]
                    analysis = AI.analyze(combined_text)

                    if not analysis or not analysis['is_relevant']:
                        # [LOG WHY]
                        if i < 2: 
                             reason = analysis.get('reason') if analysis else "Low Score"
                             print(f"      🗑️ [REJECTED] {title[:40]}... ({reason})")
                        continue 
                    
                    print(f"      ✅ [ACCEPTED] {title[:50]}... ({analysis['sentiment_class']})")
                    
                    doc = {
                        "reddit_id": f"rd_{item.get('id')}",
                        "title": title,
                        "content": content,
                        "url": f"https://reddit.com{item.get('permalink')}",
                        "author": item.get('author', 'Unknown'),
                        "timestamp": datetime.fromtimestamp(item.get('created_utc', 0)),
                        "subreddit": item.get('subreddit'),
                        "score": item.get('score', 0),
                        "num_comments": item.get('num_comments', 0),
                        "source": "reddit",
                        "analysis": analysis
                    }
                    page_posts.append(doc)
                
                # Upsert Immediately
                if page_posts:
                    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in page_posts]
                    if not dry_run:
                        try:
                            # Re-verify DB connection if needed
                            db['posts'].bulk_write(ops)
                            total_upserted += len(ops)
                            print(f"          💾 Saved {len(ops)} agri-posts.")
                        except Exception as e:
                             print(f"          ⚠️ Save Error: {e}")

                after = data.get('data', {}).get('after')
                if not after: break
                time.sleep(2) 
                
            except Exception as e:
                print(f"      ⚠️ Error in Reddit Loop: {e}")
                break
                
    return total_upserted

def fetch_social_proxy(dry_run=False):
    display_source_header("Web Proxy (Deep Time Machine)")
    platforms = [
        {"name": "Facebook", "domain": "facebook.com"},
        {"name": "Instagram", "domain": "instagram.com"}
    ]
    
    current_keywords = SEARCH_KEYWORDS[:]
    random.shuffle(current_keywords)
    start_year = datetime.now().year
    end_year = 2005
    
    total_fetched = 0
    
    for plat in platforms:
        print(f"      🗓️  Mining History for {plat['name']} (2025-{end_year})...")
        for year in range(start_year, end_year - 1, -1):
            year_posts = []
            after_date = f"{year}-01-01"
            before_date = f"{year}-12-31"
            
            for kw in current_keywords[:10]: 
                try:
                    query = f"site:{plat['domain']} {kw} after:{after_date} before:{before_date}"
                    
                    # Log progress every request so user knows it's not stuck
                    print(f"        -> Scanning {plat['name']} ({year}) for '{kw}'...")

                    url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
                    
                    resp = requests.get(url, timeout=10)
                    if resp.status_code == 200:
                        root = ET.fromstring(resp.content)
                        items = root.findall('.//item')
                        
                        for item in items:
                            title = item.find('title').text
                            link = item.find('link').text
                            description = item.find('description').text if item.find('description') is not None else ""
                            clean_desc = re.sub('<[^<]+?>', '', description)
                            clean_title = title.split(' - ')[0]
                            
                            text_check = f"{clean_title} {clean_desc}"
                            analysis = AI.analyze(text_check)

                            if not analysis or not analysis['is_relevant']:
                                continue
                            
                            doc_id = hashlib.md5(link.encode()).hexdigest()
                            year_posts.append({
                                "reddit_id": f"proxy_{doc_id}",
                                "title": f"[{plat['name']} {year}] {clean_title}",
                                "content": clean_desc if clean_desc else f"Archived content from {year}",
                                "url": link,
                                "source": plat['name'].lower(),
                                "analysis": analysis,
                                "timestamp": datetime(year, 6, 15), 
                                "author": "Public User"
                            })
                    time.sleep(1.0) 
                except Exception: continue
                
            if year_posts:
                ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in year_posts]
                if not dry_run:
                    try:
                        db['posts'].bulk_write(ops)
                        total_fetched += len(ops)
                        print(f"          💾 Saved {len(ops)} historical posts ({year}).")
                    except: pass

    return total_fetched

def fetch_web_scrape(dry_run=False):
    """
    [USER REQUEST]: "Selenium & BeautifulSoup" Technique.
    (Using Requests + BS4 for stability in this environment).
    Target: ModernFarmer / Agriculture.com
    """
    display_source_header("Web Scraper (BS4)")
    from bs4 import BeautifulSoup
    
    posts = []
    # Target: Modern Farmer
    url = "https://modernfarmer.com/category/politics-and-policy/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, 'html.parser')
            # Extract Articles (Specific to ModernFarmer site structure, robust query)
            articles = soup.select('article')[:5] 
            
            for art in articles:
                try:
                    title_elem = art.select_one('h2 a')
                    if not title_elem: continue
                    
                    title = title_elem.get_text(strip=True)
                    link = title_elem['href']
                    
                    # [AI ANALYSIS]
                    analysis = AI.analyze(title)
                    if not analysis or not analysis['is_relevant']:
                         continue

                    doc_id = hashlib.md5(link.encode()).hexdigest()
                    
                    posts.append({
                        "reddit_id": f"bs4_{doc_id}",
                        "title": f"[Web] {title}",
                        "content": "Scraped via BeautifulSoup from Modern Farmer",
                        "url": link,
                        "source": "modern_farmer",
                        "analysis": analysis,
                        "timestamp": datetime.now(),
                        "author": "Modern Farmer"
                    })
                except: continue
    except Exception: pass

    # Upsert
    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in posts]
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} Scraped Articles (BS4).")
        except Exception: return 0
    return [] if dry_run else 0

def fetch_google_news(dry_run=False):
    display_source_header("Google News (2005-2025)")
    
    # Use Full Centralized List (or large subset)
    if not SEARCH_KEYWORDS:
         # Hard failover if import failed again
         keywords = ["Rice price", "Wheat production"]
    else:
         keywords = SEARCH_KEYWORDS[:20]

    news_items = []
    start_year = datetime.now().year
    end_year = 2005
    
    total_fetched = 0
    
    for year in range(start_year, end_year - 1, -1):
        year_items = []
        after_d = f"{year}-01-01"
        before_d = f"{year}-12-31"
        
        print(f"      🗞️  Fetcing News Archives: {year}...")
        
        for query in keywords:
            try:
                url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}+after:{after_d}+before:{before_d}&hl=en-IN&gl=IN&ceid=IN:en"
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.content)
                    
                    for item in root.findall('.//item')[:10]: 
                        title = item.find('title').text
                        link = item.find('link').text
                        
                        analysis = AI.analyze(title)
                        if not analysis or not analysis['is_relevant']:
                             continue

                        news_id = hashlib.md5(link.encode()).hexdigest()
                        year_items.append({
                            "reddit_id": f"news_{news_id}", 
                            "title": title,
                            "content": title,
                            "url": link,
                            "timestamp": datetime(year, 1, 1), 
                            "source": "news",
                            "analysis": analysis,
                            "author": "Google News Archive"
                        })
                time.sleep(0.5)
            except Exception: pass

        if year_items:
            ops = [UpdateOne({"url": item["url"]}, {"$set": item}, upsert=True) for item in year_items]
            try:
                db['posts'].bulk_write(ops)
                total_fetched += len(ops)
                print(f"          💾 Saved {len(ops)} news items ({year}).")
            except: pass
    
    return total_fetched

def fetch_youtube_videos(dry_run=False):
    """ Fetches YouTube videos (Restored) """
    display_source_header("YouTube")
    # Use Centralized Keywords
    queries = SEARCH_KEYWORDS[:10] if SEARCH_KEYWORDS else ["farming"]
    
    videos = []
    headers = {"User-Agent": "Mozilla/5.0"}
    
    for q in queries:
        try:
            url = f"https://www.youtube.com/results?search_query={q.replace(' ', '+')}&sp=CAI%253D" 
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', resp.text)
                unique_ids = list(set(video_ids))[:20] 
                for vid in unique_ids:
                    # [AI ANALYSIS]
                    full_title = f"YouTube Video {vid} about {q}"
                    analysis = AI.analyze(full_title)

                    if not analysis or not analysis['is_relevant']:
                        continue
                        
                    videos.append({
                        "reddit_id": f"yt_{vid}", 
                        "title": f"YouTube Video: {vid}",
                        "content": f"Video discussion on {q}",
                        "url": f"https://youtu.be/{vid}",
                        "source": "youtube",
                        "timestamp": datetime.now(),
                        "analysis": analysis,
                        "author": "YouTube"
                    })
        except Exception:
            pass

    ops = []
    for v in videos:
        ops.append(UpdateOne({"url": v["url"]}, {"$set": v}, upsert=True))
        
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} YouTube videos.")
        except Exception as e:
            print(f"      ⚠️ YouTube Write Error: {e}")
            return 0
    return [] if dry_run else len(ops)

def fetch_mastodon(dry_run=False):
    """ Fetches posts from Mastodon (Fediverse) via public Tag Timeline API """
    display_source_header("Mastodon (Fediverse)")
    
    # Use HASHTAGS from Centralized File
    tags = HASHTAGS[:10] if HASHTAGS else ["farming"]
    posts = []
    
    # Instance URL (mastodon.social is the largest general instance)
    base_url = "https://mastodon.social/api/v1/timelines/tag"
    
    for tag in tags:
        try:
            url = f"{base_url}/{tag.replace('#','')}?limit=40"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                for status in data:
                    content_clean = re.sub('<[^<]+?>', '', status['content']) 
                    if not content_clean: continue
                    
                    # [AI ANALYSIS]
                    analysis = AI.analyze(content_clean)
                    if not analysis or not analysis['is_relevant']:
                        continue
                    
                    doc_id = str(status['id'])
                    posts.append({
                        "reddit_id": f"mstdn_{doc_id}",
                        "title": content_clean[:80] + "...",
                        "content": content_clean,
                        "url": status['url'],
                        "source": "mastodon",
                        "timestamp": datetime.now(),
                        "analysis": analysis,
                        "author": status['account']['display_name'] or status['account']['username']
                    })
        except Exception:
            continue
            
    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in posts]
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} Mastodon posts.")
        except Exception: return 0
    return [] if dry_run else len(ops)

def fetch_hacker_news(dry_run=False):
    """ Fetches AgTech discussions from Hacker News via Algolia """
    display_source_header("Hacker News (AgTech)")
    # Construct OR Query
    query = " OR ".join(SEARCH_KEYWORDS[:5]) if SEARCH_KEYWORDS else "agriculture"
    posts = []
    
    url = f"http://hn.algolia.com/api/v1/search?query={query}&tags=story&hitsPerPage=50"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            hits = resp.json().get('hits', [])
            for hit in hits:
                doc_id = str(hit.get('objectID'))
                title = hit.get('title', '')
                
                # [AI ANALYSIS]
                analysis = AI.analyze(title)
                if not analysis or not analysis['is_relevant']:
                    continue
                    
                posts.append({
                    "reddit_id": f"hn_{doc_id}",
                    "title": title,
                    "content": hit.get('url', 'No Content'),
                    "url": f"https://news.ycombinator.com/item?id={doc_id}",
                    "source": "hackernews",
                    "timestamp": datetime.now(),
                    "analysis": analysis,
                    "author": hit.get('author', 'HN')
                })
    except Exception: pass
        
    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in posts]
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} HN posts.")
        except Exception: return 0
    return [] if dry_run else len(ops)

def fetch_medium(dry_run=False):
    display_source_header("Medium (Blogs)")
    # Loop first 5 keywords as tags
    posts = []
    tags = SEARCH_KEYWORDS[:5] if SEARCH_KEYWORDS else ["agriculture"]
    
    for tag in tags:
        url = f"https://medium.com/feed/tag/{tag.replace(' ','-')}"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200: continue
            
            root = ET.fromstring(resp.content)
            items = root.findall('./channel/item')[:20]
            
            for item in items:
                link = item.find('link').text
                title = item.find('title').text
                
                # [AI ANALYSIS]
                analysis = AI.analyze(title)
                if not analysis or not analysis['is_relevant']:
                    continue
                    
                creator = item.find('{http://purl.org/dc/elements/1.1/}creator')
                author = creator.text if creator is not None else "Medium Writer"
                
                post_id = hashlib.md5(link.encode()).hexdigest()
                doc = {
                    "reddit_id": f"med_{post_id}",
                    "title": title,
                    "content": f"Medium Article: {title}",
                    "url": link,
                    "source": "medium",
                    "timestamp": datetime.now(),
                    "analysis": analysis,
                    "author": author
                }
                posts.append(doc)
        except: continue
            
    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in posts]
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} Medium posts.")
        except Exception: return 0
    return [] if dry_run else 0

def fetch_lemmy(dry_run=False):
    display_source_header("Lemmy (Fediverse)")
    communities = ["farming", "agriculture", "gardening"]
    posts = []
    
    base_url = "https://lemmy.world/api/v3/post/list"
    
    for comm in communities:
        try:
            url = f"{base_url}?community_name={comm}&sort=New&limit=40"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                for post_view in data.get('posts', []):
                    post = post_view.get('post', {})
                    if not post: continue
                    
                    doc_id = str(post.get('id'))
                    title = post.get('name', '')
                    body = post.get('body', '')
                    
                    # [AI ANALYSIS]
                    analysis = AI.analyze(title + " " + body)
                    if not analysis or not analysis['is_relevant']:
                        continue
                    
                    posts.append({
                        "reddit_id": f"lemmy_{doc_id}",
                        "title": title,
                        "content": body or title,
                        "url": post.get('ap_id') or post.get('url'),
                        "source": "lemmy",
                        "timestamp": datetime.now(),
                        "analysis": analysis,
                        "author": f"Lemmy_User_{post.get('creator_id')}"
                    })
        except Exception:
            continue
            
    ops = [UpdateOne({"reddit_id": p["reddit_id"]}, {"$set": p}, upsert=True) for p in posts]
    if ops:
        if dry_run: return [op._doc["$set"] for op in ops]
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} Lemmy posts.")
        except Exception: return 0
    return [] if dry_run else 0

def run_social_pipeline(dry_run=False):
    """ 
    Runs all social media fetchers.
    """
    print("\n🚀 Starting Social Media Pipeline...")
    
    if dry_run:
        all_docs = []
        all_docs.extend(fetch_reddit(dry_run=True))
        all_docs.extend(fetch_google_news(dry_run=True))
        all_docs.extend(fetch_youtube_videos(dry_run=True))
        all_docs.extend(fetch_mastodon(dry_run=True))
        all_docs.extend(fetch_hacker_news(dry_run=True))
        all_docs.extend(fetch_medium(dry_run=True))
        all_docs.extend(fetch_lemmy(dry_run=True))
        all_docs.extend(fetch_social_proxy(dry_run=True))
        all_docs.extend(fetch_web_scrape(dry_run=True))
        print(f"      📦 Buffered {len(all_docs)} items for processing.")
        return all_docs
    else:
        total_posts = 0
        # total_posts += fetch_reddit(dry_run=False)
        # total_posts += fetch_google_news(dry_run=False)
        # total_posts += fetch_youtube_videos(dry_run=False)
        # total_posts += fetch_mastodon(dry_run=False)
        # total_posts += fetch_hacker_news(dry_run=False)
        # total_posts += fetch_medium(dry_run=False)
        # total_posts += fetch_lemmy(dry_run=False)
        total_posts += fetch_social_proxy(dry_run=False)
        # total_posts += fetch_web_scrape(dry_run=False)
        print(f"🏁 Social Pipeline Finished. Total Items: {total_posts}\n")
        return total_posts

if __name__ == "__main__":
    run_social_pipeline()
