import os
import random
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

try:
    MONGO_URI = os.getenv('MONGODB_URI')
    client = MongoClient(MONGO_URI)
    db = client.get_database('agri_trend_dashboard')
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ DB Error: {e}")
    sys.exit(1)

# Usage:
# We need ~730 days of data for each commodity in each country to train a decent LSTM.

CONFIG = {
    "India": {
        "commodities": {
            "Rice": {"start": 3500, "volatility": 0.02, "seasonality": 0.1, "trend": 0.0001},
            "Wheat": {"start": 2300, "volatility": 0.015, "seasonality": 0.15, "trend": 0.0002},
            "Cotton": {"start": 5600, "volatility": 0.03, "seasonality": 0.0, "trend": 0.0003},
            "Soybean": {"start": 4100, "volatility": 0.025, "seasonality": 0.1, "trend": 0.0001},
            "Onion": {"start": 1500, "volatility": 0.08, "seasonality": 0.4, "trend": 0.0005} # High volatility
        }
    },
    "Japan": {
        "commodities": {
            "Rice": {"start": 14000, "volatility": 0.01, "seasonality": 0.05, "trend": 0.00005},
            "Wheat": {"start": 3100, "volatility": 0.02, "seasonality": 0.02, "trend": 0.0001},
            "Soybean": {"start": 5400, "volatility": 0.015, "seasonality": 0.05, "trend": 0.0001},
            "Beef": {"start": 2700, "volatility": 0.01, "seasonality": 0.05, "trend": 0.0002}
        }
    },
    "Philippines": {
        "commodities": {
            "Rice": {"start": 18.0, "volatility": 0.02, "seasonality": 0.1, "trend": 0.00015},
            "Corn": {"start": 13.5, "volatility": 0.025, "seasonality": 0.1, "trend": 0.0002},
            "Coconut Oil": {"start": 80.0, "volatility": 0.03, "seasonality": 0.05, "trend": 0.0001},
            "Sugar": {"start": 3100, "volatility": 0.02, "seasonality": 0.15, "trend": 0.0001}
        }
    }
}

def generate_series(start_grid, days=730):
    prices = []
    current = start_grid['start']
    
    # Seasonality curve (sine wave)
    x = np.linspace(0, 4*np.pi, days) # 2 years approx
    seasonal = np.sin(x)
    
    for i in range(days):
        # 1. Trend
        current = current * (1 + start_grid['trend'])
        
        # 2. Seasonality impact
        seas_effect = seasonal[i] * start_grid['seasonality'] * 0.01 * current
        
        # 3. Random noise
        noise = random.normalvariate(0, start_grid['volatility']) * 0.01 * current
        
        final_price = current + seas_effect + noise
        prices.append(round(final_price, 2))
        
    return prices

def main():
    print("🌱 Seeding Historical Price Data...")
    
    ops = []
    start_date = datetime.now() - timedelta(days=730)
    
    for country, data in CONFIG.items():
        print(f"   Processing {country}...")
        for commodity, params in data['commodities'].items():
            series = generate_series(params)
            
            # Create daily records
            for i, price in enumerate(series):
                date_str = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                
                # Check for uniqueness to avoid huge dupes if re-run often
                ops.append(UpdateOne(
                    {"country": country, "commodity": commodity, "date": date_str},
                    {"$set": {
                        "price": price,
                        "currency": "₹" if country == 'India' else ("¥" if country == 'Japan' else "₱")
                    }},
                    upsert=True
                ))
    
    print(f"📦 Preparing to write {len(ops)} records...")
    
    # Batch write
    BATCH = 1000
    for i in range(0, len(ops), BATCH):
        batch = ops[i:i+BATCH]
        try:
            db['price_history'].bulk_write(batch, ordered=False)
            print(f"   Saved batch {i} - {i+len(batch)}")
        except Exception as e:
            print(f"   ⚠️ Batch error: {e}")

    print("✅ Seeding Complete!")

if __name__ == "__main__":
    main()
