
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from utils.ai_client import AgriAIClient
import time

# Load env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

URI = os.getenv("MONGODB_URI") or "mongodb+srv://student:student123@cluster0.e6a4b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(URI)
db = client.agri_trend_dashboard

def reanalyze():
    ai = AgriAIClient()
    
    if not ai.sentiment_pipe:
        print("❌ CRITICAL: Local sentiment model failed to load. Aborting re-analysis to prevent data corruption.")
        return

    print("🚀 Starting Sentiment Re-Analysis (DistilBERT Local)...")
    
    # Fetch all posts that have been analyzed but might have wrong sentiment
    # Or just fetch all.
    # Fetch ALL posts that have content, regardless of 'analysis' field
    print("⏳ Fetching ALL posts from MongoDB...")
    cursor = db['posts'].find({"content": {"$exists": True}}, {"_id": 1, "title": 1, "content": 1, "analysis": 1})
    docs = list(cursor)
    total = len(docs)
    print(f"📊 Found {total} posts to process.")
    
    # IMPORTANT: Reduce workers for local inference to avoid CPU thrashing
    MAX_WORKERS = 4 
    
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    updated_count = 0
    processed_count = 0

    def process_doc(doc):
        text = f"{doc.get('title', '')} {doc.get('content', '')}"[:1000]
        try:
            # OPTIMIZATION: Local Inference
            sent_label = "Neutral"
            sent_score = 0.0
            
            if ai.sentiment_pipe:
                 # Local Pipe
                 res = ai.sentiment_pipe(text[:512], truncation=True, top_k=1)
                 if res:
                     top = res[0]
                     sent_label = top['label']
                     sent_score = top['score']
            
            # Normalize Label
            sent_label = sent_label.lower()
            if sent_label == "positive":
                final_label = "Positive"
                final_score = sent_score
            elif sent_label == "negative":
                final_label = "Negative"
                final_score = -sent_score
            else:
                final_label = "Neutral"
                final_score = 0.0

            # Apply Confidence Threshold
            SENTIMENT_THRESHOLD = 0.2
            if final_label != "Neutral" and abs(sent_score) < SENTIMENT_THRESHOLD:
                 final_label = "Neutral"
                 final_score = 0.0
            
            # Construct updated analysis object
            existing_analysis = doc.get('analysis', {})
            existing_analysis['sentiment_class'] = final_label
            existing_analysis['sentiment_score'] = round(final_score, 4)
            if 'is_relevant' not in existing_analysis: existing_analysis['is_relevant'] = True
            if 'category' not in existing_analysis: existing_analysis['category'] = "General Agriculture"
            
            return (doc['_id'], existing_analysis)
            
        except Exception as e:
            return None

    print(f"🚀 Starting optimized analysis (Local CPU) with {MAX_WORKERS} workers...")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_doc, doc): doc for doc in docs}
        
        for future in as_completed(futures):
            processed_count += 1
            if processed_count % 50 == 0:
                print(f"   Processed {processed_count}/{total}...")
                
            result = future.result()
            if result:
                 _id, res = result
                 db['posts'].update_one(
                    {"_id": _id},
                    {"$set": {
                        "analysis": res,
                        "sentiment_score": res['sentiment_score']
                    }}
                 )
                 updated_count += 1

    print(f"✅ Fast Re-analysis complete. Total Updated: {updated_count}")

if __name__ == "__main__":
    reanalyze()
