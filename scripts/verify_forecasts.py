import os
import sys
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
        
        print("\n🔮 Checking Forecasts Collection...")
        count = db['market_forecasts'].count_documents({})
        print(f"   Total Forecasts: {count}")
        
        if count == 0:
            print("   ⚠️ No forecasts found. Model training might have failed or not run.")
            return

        countries = ["India", "Japan", "Philippines"]
        for c in countries:
            sample = db['market_forecasts'].find_one({"country": c})
            if sample:
                print(f"   ✅ Found forecast for {c}: {sample.get('commodity')} - {sample.get('price')} (Model: {sample.get('model')})")
            else:
                print(f"   ❌ No forecast for {c}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
