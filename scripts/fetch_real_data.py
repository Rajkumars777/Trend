import requests
import json
import os
import time
from datetime import datetime

# Configuration
# Resolve path relative to THIS script file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(BASE_DIR, '../src/data/posts.json')
SUBREDDITS = ['farming', 'agriculture', 'tractors', 'gardening']
LIMIT = 25  # Number of posts per subreddit

# Headers are CRITICAL. Reddit blocks requests without a User-Agent.
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_subreddit_data(subreddit):
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit={LIMIT}"
    print(f"Fetching r/{subreddit}...")
    
    try:
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code == 429:
            print(f"⚠️ Rate limited on r/{subreddit}. Waiting 5 seconds...")
            time.sleep(5)
            return []
            
        if response.status_code != 200:
            print(f"❌ Error {response.status_code} fetching r/{subreddit}")
            return []

        data = response.json()
        posts = []
        
        for child in data['data']['children']:
            post_data = child['data']
            
            # Extract relevant fields
            posts.append({
                "reddit_id": post_data.get('id'),
                "url": f"https://www.reddit.com{post_data.get('permalink')}",
                "content": post_data.get('title') + " " + post_data.get('selftext', ''),
                "author": post_data.get('author'),
                "timestamp": datetime.fromtimestamp(post_data.get('created_utc')).isoformat(),
                "metrics": {
                    "upvotes": post_data.get('ups'),
                    "comments": post_data.get('num_comments')
                },
                # We will still need to analyze this locally since Reddit doesn't give sentiment
                "analysis": analyze_locally(post_data.get('title') + " " + post_data.get('selftext', ''))
            })
            
        return posts
        
    except Exception as e:
        print(f"❌ Exception fetching r/{subreddit}: {e}")
        return []

def analyze_locally(text):
    """
    Simple rule-based analysis since we are in Python.
    In a real app, you might use NLTK or TextBlob here.
    """
    text = text.lower()
    
    # Categories
    category = 'General'
    if any(w in text for w in ['tractor', 'combine', 'harvester', 'repair', 'engine']):
        category = 'Machinery'
    elif any(w in text for w in ['pest', 'worm', 'bug', 'disease', 'fungus', 'spray']):
        category = 'Pest/Disease'
    elif any(w in text for w in ['price', 'cost', 'market', 'sell', 'buy', 'money']):
        category = 'Economics'
        
    # Sentiment (Very basic keyword matching)
    sentiment = 0
    sentiment += sum(1 for w in ['good', 'great', 'happy', 'best', 'love', 'profit'] if w in text)
    sentiment -= sum(1 for w in ['bad', 'hate', 'broken', 'fail', 'loss', 'expensive'] if w in text)
    sentiment = max(-5, min(5, sentiment))

    # Keywords
    keywords = [w for w in text.split() if len(w) > 5][:5]
    
    return {
        "sentiment_score": sentiment,
        "category": category,
        "detected_keywords": keywords,
        "detected_location": None # Hard to do without a library like spaCy
    }

def main():
    all_posts = []
    
    for sub in SUBREDDITS:
        posts = fetch_subreddit_data(sub)
        all_posts.extend(posts)
        time.sleep(2) # Be nice to Reddit's servers
        
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_posts, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Successfully saved {len(all_posts)} REAL posts to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
