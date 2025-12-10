
import os
from pymongo import MongoClient
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), '../.env.local')
load_dotenv(ENV_PATH)

URI = os.getenv("MONGODB_URI") or "mongodb+srv://student:student123@cluster0.e6a4b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(URI)
db = client.agri_trend_dashboard

def check_stats():
    total = db['posts'].count_documents({})
    positive = db['posts'].count_documents({"analysis.sentiment_class": "Positive"})
    negative = db['posts'].count_documents({"analysis.sentiment_class": "Negative"})
    neutral = db['posts'].count_documents({"analysis.sentiment_class": "Neutral"})
    
    print(f"Total: {total}")
    print(f"Positive: {positive}")
    print(f"Negative: {negative}")
    print(f"Neutral: {neutral}")

if __name__ == "__main__":
    check_stats()
