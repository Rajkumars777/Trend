import requests
import os
import time
import random
import xml.etree.ElementTree as ET
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Load Environment Variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    print("❌ Error: MONGODB_URI not found in .env.local")
    exit(1)

print(f"🔌 Connecting to MongoDB...")
client = MongoClient(MONGODB_URI)
db = client.get_database('agri_trend_dashboard') # Explicitly specify DB name
collection = db['posts']

# --- Reddit Configuration ---
REDDIT_SUBREDDITS = ['farming', 'agriculture', 'tractors', 'gardening']
REDDIT_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# --- Google News Configuration ---
NEWS_URL = "https://news.google.com/rss/search?q=agriculture+farming+crops+prices&hl=en-US&gl=US&ceid=US:en"

# --- YouTube Configuration ---
YOUTUBE_QUERIES = ['agriculture technology', 'farming innovation', 'crop prices', 'tractor review']

# --- Twitter (Nitter) Configuration ---
NITTER_INSTANCES = ['https://nitter.poast.org', 'https://nitter.lucabased.xyz']
TWITTER_TAGS = ['agriculture', 'farming', 'agtech']

# Initialize VADER analyzer
analyzer = SentimentIntensityAnalyzer()

def analyze_locally(text):
    """ VADER-based sentiment analysis """
    text_lower = text.lower()
    
    # Category detection (keep existing logic)
    category = 'General'
    if any(w in text_lower for w in ['tractor', 'combine', 'gear', 'repair', 'engine']): category = 'Machinery'
    elif any(w in text_lower for w in ['pest', 'disease', 'fungus', 'spray', 'worm']): category = 'Pest/Disease'
    elif any(w in text_lower for w in ['price', 'market', 'cost', 'trade', 'economy']): category = 'Economics'
    
    # VADER Sentiment Analysis
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    # Classify sentiment
    if compound >= 0.05:
        sentiment_class = 'Positive'
    elif compound <= -0.05:
        sentiment_class = 'Negative'
    else:
        sentiment_class = 'Neutral'
    
    return {
        "sentiment_score": compound, # Use compound score (-1 to 1)
        "sentiment_class": sentiment_class,
        "category": category,
        "detected_keywords": [w for w in text_lower.split() if len(w) > 6][:5],
        "vader_details": scores
    }

def fetch_reddit():
    ops = []
    print("   🔹 Fetching Reddit...")
    for sub in REDDIT_SUBREDDITS:
        try:
            url = f"https://www.reddit.com/r/{sub}/new.json?limit=10"
            resp = requests.get(url, headers=REDDIT_HEADERS)
            if resp.status_code != 200: continue
            
            data = resp.json()
            for child in data['data']['children']:
                d = child['data']
                post_doc = {
                    "reddit_id": f"reddit_{d['id']}",
                    "source": "reddit",
                    "url": f"https://www.reddit.com{d['permalink']}",
                    "content": d['title'],
                    "author": d['author'],
                    "timestamp": datetime.fromtimestamp(d['created_utc']), # MongoDB stores as Date object
                    "metrics": {"upvotes": d['ups'], "comments": d['num_comments']},
                    "analysis": analyze_locally(d['title'] + " " + d.get('selftext', ''))
                }
                # Upsert: Update if exists, Insert if not
                ops.append(UpdateOne({'reddit_id': post_doc['reddit_id']}, {'$set': post_doc}, upsert=True))
            time.sleep(1)
        except Exception as e:
            print(f"      ⚠️ Error fetching r/{sub}: {e}")
    return ops

def fetch_google_news():
    ops = []
    print("   🔹 Fetching Google News...")
    try:
        resp = requests.get(NEWS_URL)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            for item in root.findall('.//item')[:20]:
                title = item.find('title').text
                link = item.find('link').text
                pubDate = item.find('pubDate').text
                
                try:
                    dt = datetime.strptime(pubDate, "%a, %d %b %Y %H:%M:%S %Z")
                except:
                    dt = datetime.now()

                post_doc = {
                    "reddit_id": f"news_{hash(title)}",
                    "source": "news",
                    "url": link,
                    "content": title,
                    "author": item.find('source').text if item.find('source') is not None else "Google News",
                    "timestamp": dt,
                    "metrics": {"upvotes": 0, "comments": 0},
                    "analysis": analyze_locally(title)
                }
                ops.append(UpdateOne({'reddit_id': post_doc['reddit_id']}, {'$set': post_doc}, upsert=True))
    except Exception as e:
        print(f"      ⚠️ Error fetching News: {e}")
    return ops

def fetch_youtube():
    ops = []
    print("   🔹 Fetching YouTube...")
    for query in YOUTUBE_QUERIES:
        try:
            # Search query URL
            url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
            resp = requests.get(url, headers=REDDIT_HEADERS) # Reuse headers
            
            if resp.status_code != 200: continue
            
            # Extract ytInitialData
            soup = BeautifulSoup(resp.text, 'html.parser')
            scripts = soup.find_all('script')
            
            for script in scripts:
                if script.string and 'ytInitialData' in script.string:
                    # Very rough extraction of JSON data
                    json_str = re.search(r'var ytInitialData = ({.*?});', script.string)
                    if json_str:
                        import json
                        data = json.loads(json_str.group(1))
                        
                        # Navigate deep JSON structure (fragile, but works for demo)
                        try:
                            contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
                            
                            for item in contents:
                                if 'videoRenderer' in item:
                                    video = item['videoRenderer']
                                    video_id = video['videoId']
                                    title = video['title']['runs'][0]['text']
                                    view_text = video.get('viewCountText', {'simpleText': '0 views'}).get('simpleText', '0 views')
                                    views = int(re.sub(r'\D', '', view_text)) if view_text else 0
                                    
                                    post_doc = {
                                        "reddit_id": f"yt_{video_id}",
                                        "source": "youtube",
                                        "url": f"https://www.youtube.com/watch?v={video_id}",
                                        "content": title,
                                        "author": video.get('ownerText', {'runs': [{'text': 'Unknown'}]})['runs'][0]['text'],
                                        "timestamp": datetime.now(), # YouTube search doesn't easily give exact timestamp
                                        "metrics": {"upvotes": views, "comments": 0},
                                        "analysis": analyze_locally(title)
                                    }
                                    ops.append(UpdateOne({'reddit_id': post_doc['reddit_id']}, {'$set': post_doc}, upsert=True))
                        except Exception as e:
                            pass # JSON structure might vary
                    break
            time.sleep(1)
        except Exception as e:
            print(f"      ⚠️ Error fetching YouTube for {query}: {e}")
    return ops

def fetch_twitter():
    ops = []
    print("   🔹 Fetching Twitter (via Nitter)...")
    instance = random.choice(NITTER_INSTANCES)
    
    for tag in TWITTER_TAGS:
        try:
            url = f"{instance}/search?f=tweets&q=%23{tag}"
            resp = requests.get(url, headers=REDDIT_HEADERS)
            
            if resp.status_code != 200: 
                print(f"      ⚠️ Nitter instance {instance} returned {resp.status_code}")
                continue
                
            soup = BeautifulSoup(resp.text, 'html.parser')
            tweets = soup.find_all('div', class_='timeline-item')
            
            for tweet in tweets:
                try:
                    link_tag = tweet.find('a', class_='tweet-link')
                    if not link_tag: continue
                    
                    tweet_link = link_tag['href']
                    tweet_id = tweet_link.split('/')[-1].split('#')[0]
                    
                    content = tweet.find('div', class_='tweet-content').get_text(strip=True)
                    author = tweet.find('a', class_='username').get_text(strip=True)
                    date_str = tweet.find('span', class_='tweet-date').find('a')['title']
                    
                    # Parse date: "Sep 25, 2023 · 10:30 AM UTC"
                    try:
                        dt = datetime.strptime(date_str, "%b %d, %Y · %I:%M %p UTC")
                    except:
                        dt = datetime.now()
                        
                    stats = tweet.find('div', class_='tweet-stats')
                    likes = 0
                    comments = 0
                    if stats:
                        likes_span = stats.find('span', class_='icon-heart')
                        if likes_span and likes_span.parent.text.strip():
                            likes = int(likes_span.parent.text.strip().replace(',', ''))
                            
                    post_doc = {
                        "reddit_id": f"tw_{tweet_id}",
                        "source": "twitter",
                        "url": f"https://twitter.com{tweet_link}", # Point to real Twitter
                        "content": content,
                        "author": author,
                        "timestamp": dt,
                        "metrics": {"upvotes": likes, "comments": comments},
                        "analysis": analyze_locally(content)
                    }
                    ops.append(UpdateOne({'reddit_id': post_doc['reddit_id']}, {'$set': post_doc}, upsert=True))
                except Exception as e:
                    continue
            time.sleep(1)
        except Exception as e:
            print(f"      ⚠️ Error fetching Twitter for #{tag}: {e}")
    return ops

def generate_synthetic_data(target_count):
    """ Generate synthetic posts to reach target count """
    print(f"   🔹 Generating synthetic data to reach {target_count} records...")
    
    current_count = collection.count_documents({})
    needed = target_count - current_count
    
    if needed <= 0:
        print("      ✅ Target count already reached.")
        return []

    print(f"      Need {needed} more records. Generating...")
    
    templates = [
        "I think {crop} prices are going {direction} because of {reason}.",
        "Has anyone tried the new {tech} for {crop} farming?",
        "The {weather} in {location} is really affecting my {crop} yield.",
        "Just bought a new {machinery}, hope it pays off.",
        "Market analysis suggests {crop} will be {sentiment} this season.",
        "Worried about the {pest} outbreak in {location}.",
        "Government policy on {crop} export is {sentiment} for farmers.",
        "Looking for advice on {crop} irrigation systems.",
        "Best fertilizer for {crop} in {weather} conditions?",
        "{crop} harvest is looking {quality} this year."
    ]
    
    crops = ["Rice", "Wheat", "Corn", "Soybean", "Cotton", "Coffee", "Barley"]
    directions = ["up", "down", "sideways", "sky high", "to the moon"]
    reasons = ["drought", "heavy rain", "export ban", "high demand", "supply chain issues", "inflation"]
    techs = ["drone", "sensor", "AI model", "automated tractor", "hydroponics"]
    weather = ["drought", "flood", "heatwave", "frost", "monsoon"]
    locations = ["India", "USA", "Brazil", "China", "Europe", "Australia", "Punjab", "California"]
    machinery = ["John Deere", "Kubota", "Harvester", "Planter", "Drone"]
    sentiments_adj = ["good", "bad", "terrible", "excellent", "uncertain"]
    qualities = ["great", "poor", "average", "record-breaking"]
    pests = ["locust", "fungus", "beetle", "worm"]
    
    ops = []
    for i in range(needed):
        template = random.choice(templates)
        text = template.format(
            crop=random.choice(crops),
            direction=random.choice(directions),
            reason=random.choice(reasons),
            tech=random.choice(techs),
            weather=random.choice(weather),
            location=random.choice(locations),
            machinery=random.choice(machinery),
            sentiment=random.choice(sentiments_adj),
            pest=random.choice(pests),
            quality=random.choice(qualities)
        )
        
        # Add some random noise/hashtags
        if random.random() > 0.7:
            text += f" #{random.choice(crops)} #{random.choice(['farming', 'agtech', 'prices'])}"
            
        dt = datetime.now()
        
        post_doc = {
            "reddit_id": f"syn_{int(time.time())}_{i}",
            "source": random.choice(["twitter", "reddit", "youtube"]),
            "url": "", # Will be populated below
            "content": text,
            "author": f"user_{random.randint(1000, 99999)}",
            "timestamp": dt,
            "metrics": {"upvotes": random.randint(0, 500), "comments": random.randint(0, 50)},
            "analysis": analyze_locally(text)
        }
        
        # Generate functional search URL based on content
        import urllib.parse
        query = urllib.parse.quote(text[:100])
        if post_doc['source'] == 'twitter':
            post_doc['url'] = f"https://twitter.com/search?q={query}&src=typed_query"
        elif post_doc['source'] == 'youtube':
            post_doc['url'] = f"https://www.youtube.com/results?search_query={query}"
        elif post_doc['source'] == 'reddit':
            post_doc['url'] = f"https://www.reddit.com/search/?q={query}"
        else:
            post_doc['url'] = f"https://www.google.com/search?q={query}"
        ops.append(UpdateOne({'reddit_id': post_doc['reddit_id']}, {'$set': post_doc}, upsert=True))
        
        if len(ops) >= 1000:
            collection.bulk_write(ops)
            ops = []
            print(f"      ... Generated {i+1}/{needed}")
            
    if ops:
        collection.bulk_write(ops)
        
    return [] # Already written

def main():
    print("🚀 Starting Multi-Source Scraper & Mass Ingestion...")
    
    # 1. Real Data (Aggressive)
    all_ops = []
    # Increase Reddit limit temporarily for this run
    global REDDIT_SUBREDDITS
    REDDIT_SUBREDDITS = ['farming', 'agriculture', 'tractors', 'gardening', 'homestead', 'agtech', 'hydroponics']
    
    all_ops.extend(fetch_reddit())
    all_ops.extend(fetch_google_news())
    all_ops.extend(fetch_youtube())
    all_ops.extend(fetch_twitter())
    
    if all_ops:
        print(f"💾 Writing {len(all_ops)} real records to MongoDB...")
        try:
            result = collection.bulk_write(all_ops)
            print(f"✅ Real Data: Matched {result.matched_count}, Modified {result.modified_count}, Upserted {result.upserted_count}")
        except Exception as e:
            print(f"❌ Bulk write failed: {e}")
            
    # 2. Synthetic Augmentation to reach 10k
    generate_synthetic_data(10000)
    
    total = collection.count_documents({})
    print(f"🎉 Total Records in DB: {total}")

if __name__ == "__main__":
    main()
