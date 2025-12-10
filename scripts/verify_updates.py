
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

URI = os.getenv("MONGODB_URI")
client = MongoClient(URI)
db = client.agri_trend_dashboard

def check():
    total = db['posts'].count_documents({})
    neutral = db['posts'].count_documents({"analysis.sentiment_class": "Neutral"})
    positive = db['posts'].count_documents({"analysis.sentiment_class": "Positive"})
    negative = db['posts'].count_documents({"analysis.sentiment_class": "Negative"})
    
    print(f"Total: {total}")
    print(f"Neutral: {neutral}")
    print(f"Positive: {positive}")
    print(f"Negative: {negative}")
    
    print("\nSample Neutral Posts:")
    for doc in db['posts'].find({"analysis.sentiment_class": "Neutral"}).limit(5):
        print(f"- {doc.get('title')[:50]}... (Score: {doc.get('analysis', {}).get('sentiment_score')})")

if __name__ == "__main__":
    check()
