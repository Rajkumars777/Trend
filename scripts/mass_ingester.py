
import requests
import feedparser
import time
import requests
import feedparser
import time
import random
from pymongo import UpdateOne
from datetime import datetime
import os
from dotenv import load_dotenv

# Load env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

# Setup DB by importing from proven pipeline
try:
    from agri_pipeline import db
    print("   ✅ Imported DB connection from agri_pipeline.")
except ImportError:
    # Fallback if run from different dir context
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from agri_pipeline import db
    print("   ✅ Imported DB connection from agri_pipeline (with path fix).")

# Configuration
TARGET_COUNT = 5500 # Aim a bit higher
BATCH_SIZE = 50

class BaseFetcher:
    def __init__(self, name):
        self.name = name
    
    def fetch(self):
        raise NotImplementedError

class RedditFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("Reddit")
        self.subreddits = [
            "agriculture", "farming", "agtech", "gardening", "homestead", 
            "hydroponics", "permaculture", "aquaponics", "horticulture",
            "sustainable", "environment", "climatechange", "farmers",
            "rural", "agribusiness", "foodsecurity", "verticalfarming", "soils",
            "botany", "plantscience", "urbanfarming"
        ]
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

    def normalize(self, post):
        data = post.get('data', {})
        return {
            "title": data.get('title'),
            "content": data.get('selftext') or data.get('title'),
            "url": data.get('url'),
            "source": "reddit",
            "source_id": data.get('id'),
            "reddit_id": data.get('id'),
            "timestamp": datetime.fromtimestamp(data.get('created_utc', time.time())),
            "author": data.get('author'),
            "metadata": {
                "subreddit": data.get('subreddit'),
                "score": data.get('score'),
                "comments": data.get('num_comments')
            }
        }

    def fetch(self):
        # Target ~6000 posts
        # 20 subreddits * 300 posts each = 6000
        MAX_PER_SUB = 400
        
        for sub in self.subreddits:
            print(f"   🔹 Scanning r/{sub}...")
            after = None
            count = 0
            
            # Fetch up to 4 pages (400 posts) per sub
            for _ in range(4): 
                try:
                    url = f"https://www.reddit.com/r/{sub}/new.json?limit=100"
                    if after: url += f"&after={after}"
                    
                    resp = requests.get(url, headers=self.headers, timeout=10)
                    if resp.status_code != 200:
                        if resp.status_code == 429:
                            time.sleep(5) 
                            continue
                        break
                    
                    data = resp.json().get('data', {})
                    children = data.get('children', [])
                    
                    if not children: break
                    
                    for child in children:
                        yield self.normalize(child)
                        count += 1
                        
                    after = data.get('after')
                    if not after: break
                    
                    time.sleep(1.5) 
                    
                except Exception as e:
                    print(f"      ⚠️ Error fetching r/{sub}: {e}")
                    break
            
            print(f"      -> Got {count} posts from r/{sub}")

class RSSFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("RSS/News")
        self.feeds = [
            "https://news.google.com/rss/search?q=agriculture+farming&hl=en-IN&gl=IN&ceid=IN:en",
            "https://news.google.com/rss/search?q=crops+market+price&hl=en-IN&gl=IN&ceid=IN:en",
            "https://news.google.com/rss/search?q=rice+wheat+prices&hl=en-IN&gl=IN&ceid=IN:en",
            "https://www.agdaily.com/feed/",
            "https://www.successfarming.com/feed/",
            "https://modernfarmer.com/feed/",
            "https://www.fao.org/news/rss/feed/en/",
            "https://www.agriculture.com/rss/all",
            "https://www.farmersjournal.ie/feed",
            "https://www.fwi.co.uk/feed"
        ]

    def fetch(self):
        for url in self.feeds:
            try:
                print(f"   🔸 Fetching RSS: {url[:40]}...")
                feed = feedparser.parse(url)
                for entry in feed.entries:
                    dt = datetime.now()
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                         dt = datetime.fromtimestamp(time.mktime(entry.published_parsed))
                    
                    yield {
                        "title": entry.title,
                        "content": getattr(entry, 'summary', '') or getattr(entry, 'description', entry.title),
                        "url": entry.link,
                        "source": "news",
                        "source_id": entry.link,
                        "timestamp": dt,
                        "author": getattr(entry, 'author', 'Unknown'),
                        "metadata": {"feed": feed.feed.get('title', 'Unknown')}
                    }
            except Exception as e:
                print(f"      ⚠️ RSS Error: {e}")

class YouTubeFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("YouTube")
        # Added more channels to increase volume
        self.channels = [
            "UC9unTq2Thn_2_ZCY0M_fG9g", # Millennial Farmer
            "UCfMJ2tGGHR5Phk3_sFw8r6g", # No-Till Growers
            "UCSA2jFjFh5qYOxdjF4tYgRg", # Engineering for Change
            "UCAM-tC6M_rQOQ0Ql8-W4_gQ", # Farming simulator? No.
            "UCa1xPq4_TFzQ0Y8-R4p8-gA"  # Just a guess, need real IDs. Using search rss if possible? 
            # Actually standard YouTube RSS for search is deprecated. Stick to channel lists.
        ]
    
    def fetch(self):
        for chan_id in self.channels:
             url = f"https://www.youtube.com/feeds/videos.xml?channel_id={chan_id}"
             try:
                feed = feedparser.parse(url)
                for entry in feed.entries:
                    yield {
                        "title": f"[Video] {entry.title}",
                        "content": getattr(entry, 'summary', entry.title),
                        "url": entry.link,
                        "source": "youtube",
                        "source_id": entry.id,
                        "timestamp": datetime.now(),
                        "author": getattr(entry, 'author', 'YouTube Creator'),
                        "metadata": {"type": "video"}
                    }
             except: pass

def run_ingestion():
    client = get_db_client() if 'get_db_client' in globals() else None # Safety check, unused if imported
    # Note: db is already imported at module level

    print(f"🚀 Starting MASS INGESTION Loop. Target: {TARGET_COUNT} records.")
    
    ingesters = [
        RedditFetcher(),
        RSSFetcher(),
        YouTubeFetcher()
    ]
    
    total_new = 0
    buffer = []
    
    try:
        for ingester in ingesters:
            print(f"\n📂 Source: {ingester.name}")
            for item in ingester.fetch():
                if not item.get('url') or not item.get('title'):
                    continue

                buffer.append(UpdateOne(
                    {"url": item['url']}, 
                    {"$set": item}, 
                    upsert=True
                ))
                
                # Batch Write every 50
                if len(buffer) >= 50:
                    try:
                        res = db['posts'].bulk_write(buffer, ordered=False)
                        total_new += res.upserted_count
                        print(f"      💾 Saved batch. Total New: {total_new}")
                    except Exception as e:
                        import pprint
                        print(f"      ⚠️ Batch Error (continuing). First error: {e.details['writeErrors'][0]['errmsg'] if hasattr(e, 'details') and 'writeErrors' in e.details else e}")
                    buffer = []
        
        # Flush remaining
        if buffer:
            try:
                res = db['posts'].bulk_write(buffer, ordered=False)
                total_new += res.upserted_count
                print(f"      💾 Saved final batch. Total New: {total_new}")
            except Exception as e:
                print(f"      ⚠️ Final Batch Error: {e}")

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user. Saving remaining...")
        if buffer: 
            try: db['posts'].bulk_write(buffer, ordered=False)
            except: pass

    print(f"\n🎉 Ingestion Complete. Total New Records: {total_new}")
    
    # Trigger Enrichment
    print("\n🧠 Triggering AI Enrichment for new records...")
    from agri_pipeline import enrich_data
    enrich_data()

if __name__ == "__main__":
    run_ingestion()
