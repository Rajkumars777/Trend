import os
import pymongo
from datetime import datetime
import random

import os
import pymongo
from datetime import datetime
import random

# Helper to load .env.local manually since we might not have python-dotenv
def load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env_local()

# Connect to MongoDB
MONGO_URI = os.getenv('MONGODB_URI')
if not MONGO_URI:
    print("Warning: MONGODB_URI not found in .env.local, defaulting to localhost")
    MONGO_URI = 'mongodb://localhost:27017/agri_trend_dashboard'

print(f"Connecting to MongoDB...") # Don't print the full URI for security/logs
client = pymongo.MongoClient(MONGO_URI)
db = client.get_database('agri_trend_dashboard') # Explicitly use the db name from dbConnect.ts
collection = db['country_stats']

import yfinance as yf
import requests

# ... (Previous imports)

# Country Coordinates for Weather API (Capital Cities)
COUNTRY_COORDS = {
    "India": {"lat": 28.61, "lon": 77.20}, # New Delhi
    "United States": {"lat": 38.90, "lon": -77.03}, # Washington DC
    "Brazil": {"lat": -15.78, "lon": -47.92}, # Brasilia
    "China": {"lat": 39.90, "lon": 116.40}, # Beijing
    "Russia": {"lat": 55.75, "lon": 37.61}, # Moscow
    "Australia": {"lat": -35.28, "lon": 149.13}, # Canberra
    "Canada": {"lat": 45.42, "lon": -75.69}, # Ottawa
    "Argentina": {"lat": -34.60, "lon": -58.38}, # Buenos Aires
    "France": {"lat": 48.85, "lon": 2.35}, # Paris
    "Ukraine": {"lat": 50.45, "lon": 30.52} # Kyiv
}

# Crop Tickers (Futures)
CROP_TICKERS = {
    "Rice": "ZR=F",
    "Wheat": "ZW=F",
    "Corn": "ZC=F",
    "Soybean": "ZS=F",
    "Cotton": "CT=F",
    "Coffee": "KC=F"
}

def fetch_commodity_prices():
    """ Fetch real-time commodity prices from Yahoo Finance """
    print("   🔹 Fetching Real Commodity Prices...")
    prices = []
    for crop, ticker in CROP_TICKERS.items():
        try:
            ticker_obj = yf.Ticker(ticker)
            # Get fast info or history
            hist = ticker_obj.history(period="5d")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
                prev_price = hist['Close'].iloc[-2]
                change = current_price - prev_price
                prices.append({
                    "name": crop,
                    "price": round(current_price, 2),
                    "change": round(change, 2),
                    "unit": "contract" # Simplified unit
                })
        except Exception as e:
            print(f"      ⚠️ Failed to fetch {crop}: {e}")
            
    return prices

def fetch_weather_data(lat, lon):
    """ Fetch historical weather from Open-Meteo """
    # Get last year's data for "Current" stats
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "daily": "temperature_2m_mean,rain_sum",
        "timezone": "auto"
    }
    try:
        res = requests.get(url, params=params)
        data = res.json()
        if 'daily' in data:
            temp = data['daily']['temperature_2m_mean']
            rain = data['daily']['rain_sum']
            
            avg_temp = sum(temp) / len(temp) if temp else 0
            total_rain = sum(rain) if rain else 0
            
            return round(avg_temp, 1), round(total_rain, 1)
    except Exception as e:
        print(f"      ⚠️ Weather fetch failed: {e}")
    
    return 20.0, 500.0 # Fallback

def generate_country_data(country_name):
    # ... (Existing random logic as fallback or base) ...
    base_yield = random.randint(80, 120)
    
    # Real Weather Data
    coords = COUNTRY_COORDS.get(country_name, {"lat": 0, "lon": 0})
    avg_temp, total_rain = fetch_weather_data(coords['lat'], coords['lon'])
    
    # Generate yield growth over last 4 years
    yield_growth = []
    for i, year in enumerate(['2020', '2021', '2022', '2023']):
        val = base_yield + random.randint(-5, 10) + (i * 2)
        yield_growth.append({'year': year, 'val': val})
    
    current_val = yield_growth[-1]['val']
    global_avg = 95
    
    comparison = [
        {'name': country_name, 'val': current_val},
        {'name': 'Global Avg', 'val': global_avg}
    ]
    
    crops_pool = ["Rice", "Wheat", "Corn", "Soybean"]
    top_crops = random.sample(crops_pool, 3)
    
    sentiments = ["Positive", "Neutral", "Negative", "Very Positive"]
    sentiment = random.choice(sentiments)
    
    alerts = ["None", "Drought warning", "Flood risk", "Pest outbreak", "None", "None"]
    alert = random.choice(alerts)
    
    # Detailed Crop History (Enhanced)
    crop_history = []
    for crop in crops_pool:
        history = []
        base = random.randint(3, 10)
        for year in range(2015, 2025):
            growth_factor = 1 + (year - 2015) * 0.015
            weather_noise = random.uniform(-0.5, 0.5)
            val = base * growth_factor + weather_noise
            history.append({'year': year, 'yield': round(max(0, val), 2)})
        crop_history.append({'crop': crop, 'history': history})

    return {
        'country': country_name,
        'yield_growth': yield_growth,
        'comparison': comparison,
        'top_crops': top_crops,
        'crop_history': crop_history,
        'sentiment': sentiment,
        'alert': alert,
        'avg_temp': avg_temp, # New Real Data
        'total_rain': total_rain, # New Real Data
        'pesticide_usage': random.randint(500, 2000), # Mock for now
        'last_updated': datetime.now()
    }

COUNTRIES = [
    "India", "United States", "Brazil", "China", "Russia", 
    "Australia", "Canada", "Argentina", "France", "Ukraine"
]

def main():
    print("Fetching global agricultural data...")
    
    # 1. Update Commodity Prices
    real_prices = fetch_commodity_prices()
    if real_prices:
        db['commodity_prices'].delete_many({})
        db['commodity_prices'].insert_many(real_prices)
        print(f"✅ Updated {len(real_prices)} commodity prices.")
    
    # 2. Update Country Stats
    collection.delete_many({})
    print("Cleared existing country stats.")
    
    new_data = []
    for country in COUNTRIES:
        print(f"   Generating data for {country}...")
        data = generate_country_data(country)
        new_data.append(data)
        
    if new_data:
        collection.insert_many(new_data)
        print(f"✅ Successfully inserted {len(new_data)} country records.")
    
    print("Data population complete.")

if __name__ == "__main__":
    main()
