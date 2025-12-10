import os
from pymongo import MongoClient
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

def check():
    try:
        URI = os.getenv("MONGODB_URI")
        client = MongoClient(URI)
        db = client.get_database('agri_trend_dashboard')
        
        print("\n📊 Checking Country Stats Collection...")
        countries = ["India", "Japan", "Philippines"]
        
        for c in countries:
            doc = db['country_stats'].find_one({"country": c})
            if doc:
                print(f"   ✅ Found {c}")
                print(f"      - GDP Ag: {doc.get('overview', {}).get('gdpContribution')}")
                print(f"      - Inflation: {doc.get('market', {}).get('inflation')}")
                prices = doc.get('market', {}).get('prices', [])
                print(f"      - Prices Count: {len(prices)}")
                if prices:
                    p1 = prices[0]
                    print(f"      - Sample Price: {p1['commodity']} = {p1['price']} ({p1['trend']})")
            else:
                print(f"   ❌ Missing {c}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
