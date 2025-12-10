
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json
from datetime import datetime

class CustomEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        if hasattr(o, '__str__'):
             return str(o)
        return super().default(o)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

URI = os.getenv("MONGODB_URI")
client = MongoClient(URI)
db = client.agri_trend_dashboard

def inspect():
    # Get one regular pos
    doc = db['posts'].find_one({})
    print("--- RAW DOC ---")
    print(json.dumps(doc, indent=2, cls=CustomEncoder))

    # Get one with analysis if possible (we know 432 exist)
    doc_analyzed = db['posts'].find_one({"analysis": {"$exists": True}})
    print("\n--- ANALYZED DOC ---")
    print(json.dumps(doc_analyzed, indent=2, cls=CustomEncoder))
    
    # Check if there's any other field like 'sentiment' or 'prediction'
    print("\n--- SCHEMA CHECK ---")
    keys = set()
    for d in db['posts'].find({}, limit=50):
        keys.update(d.keys())
    print(f"All Top Level Keys found: {keys}")

if __name__ == "__main__":
    inspect()
