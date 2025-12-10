
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def reset():
    uri = os.getenv("MONGODB_URI")
    if not uri:
        # Fallback to local hardcoded just in case, but rely on env
        uri = "mongodb+srv://student:student123@cluster0.e6a4b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    print(f"Connecting to {uri[:20]}...")
    client = MongoClient(uri)
    db = client.agri_trend_dashboard
    
    result = db.posts.update_many({}, {"$unset": {"analysis": ""}})
    print(f"Reset {result.modified_count} posts for re-analysis.")

if __name__ == "__main__":
    reset()
