import requests
import os
import sys
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

# DB Setup
try:
    MONGO_URI = os.getenv('MONGODB_URI')
    if not MONGO_URI:
        raise ValueError("MONGODB_URI not found in .env.local")
    client = MongoClient(MONGO_URI)
    db = client.get_database('agri_trend_dashboard')
    print("✅ Connected to MongoDB (agri_trend_dashboard)")
except Exception as e:
    print(f"❌ Database Connection Failed: {e}")
    sys.exit(1)

# Countries to fetch
COUNTRIES = {
    'India': {'code': 'IND', 'currency': '₹'},
    'Japan': {'code': 'JPN', 'currency': '¥'},
    'Philippines': {'code': 'PHL', 'currency': '₱'}
}

# World Bank Indicators
INDICATORS = {
    'gdp_ag': 'NV.AGR.TOTL.ZS', # Agriculture, forestry, and fishing, value added (% of GDP)
    'employment': 'SL.AGR.EMPL.ZS', # Employment in agriculture (% of total employment) (modeled ILO estimate)
    'land': 'AG.LND.ARBL.ZS', # Arable land (% of land area)
    'food_security': 'SN.ITK.DEFC.ZS' # Prevalence of undernourishment (% of population) - Proxy for food security inverse
}

def fetch_world_bank_data(country_code, indicator):
    """Fetch latest available value from World Bank API"""
    try:
        url = f"http://api.worldbank.org/v2/country/{country_code}/indicator/{indicator}?format=json&per_page=1"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        
        if len(data) > 1 and data[1]:
            latest_entry = data[1][0]
            val = latest_entry.get('value')
            date = latest_entry.get('date')
            if val is not None:
                return round(val, 2), date
    except Exception as e:
        print(f"   ⚠️ WB Error ({country_code} - {indicator}): {e}")
    return None, None

def get_static_prices(country_name, currency_symbol):
    """Fallback/Static prices for demo purposes if scraping fails or for stability"""
    # Real-ish market values as of late 2024/2025
    if country_name == 'India':
        return [
            {"commodity": "Rice (Basmati)", "price": f"{currency_symbol}3800", "trend": "+1.2%", "unit": "Quintal"},
            {"commodity": "Wheat", "price": f"{currency_symbol}2450", "trend": "-0.5%", "unit": "Quintal"},
            {"commodity": "Cotton", "price": f"{currency_symbol}5800", "trend": "+2.1%", "unit": "Bale"},
            {"commodity": "Soybean", "price": f"{currency_symbol}4200", "trend": "-1.0%", "unit": "Quintal"},
            {"commodity": "Onion", "price": f"{currency_symbol}1800", "trend": "+5.5%", "unit": "Quintal"}
        ]
    elif country_name == 'Japan':
        return [
            {"commodity": "Rice (Koshihikari)", "price": f"{currency_symbol}14500", "trend": "+0.8%", "unit": "60kg"},
            {"commodity": "Wheat", "price": f"{currency_symbol}3200", "trend": "+1.5%", "unit": "Bushel eq"}, # Imported mostly
            {"commodity": "Soybean", "price": f"{currency_symbol}5500", "trend": "-0.2%", "unit": "60kg"},
            {"commodity": "Beef (Wagyu)", "price": f"{currency_symbol}2800", "trend": "+3.0%", "unit": "kg"},
            {"commodity": "Cabbage", "price": f"{currency_symbol}150", "trend": "-5.0%", "unit": "kg"}
        ]
    elif country_name == 'Philippines':
        return [
            {"commodity": "Rice (Palay)", "price": f"{currency_symbol}19.50", "trend": "+1.2%", "unit": "kg"},
            {"commodity": "Corn (Yellow)", "price": f"{currency_symbol}14.20", "trend": "-1.8%", "unit": "kg"},
            {"commodity": "Coconut Oil", "price": f"{currency_symbol}85.00", "trend": "+4.5%", "unit": "Liter"},
            {"commodity": "Sugar", "price": f"{currency_symbol}3200", "trend": "+0.5%", "unit": "50kg"},
            {"commodity": "Banana", "price": f"{currency_symbol}45.00", "trend": "-2.0%", "unit": "kg"}
        ]
    return []

def main():
    print("🚀 Starting Country Stats Fetcher...")
    
    updates = []
    
    for country, info in COUNTRIES.items():
        print(f"\n🌍 Processing {country}...")
        
        # 1. Fetch Economy Stats
        gdp, _ = fetch_world_bank_data(info['code'], INDICATORS['gdp_ag'])
        empl, _ = fetch_world_bank_data(info['code'], INDICATORS['employment'])
        land, _ = fetch_world_bank_data(info['code'], INDICATORS['land'])
        food, _ = fetch_world_bank_data(info['code'], INDICATORS['food_security'])
        
        # Build Overview
        overview = {
            "gdpContribution": f"{gdp}%" if gdp else "N/A",
            "employment": f"{empl}%" if empl else "N/A",
            "arableLand": f"{land}%" if land else "N/A",
            "foodSecurityIndex": f"{100-food}% ( calc )" if food else "High", # Inverse logic for display
            "policyHighlight": "Focus on sustainable farming." # Placeholder/Static for now
        }
        
        # 2. Get Prices (Using Static for Reliability in Demo, can swap for scraping later)
        prices = get_static_prices(country, info['currency'])
        
        # 3. Trends/Market Info
        market = {
            "inflation": "4.5%", # Could fetch from WB too: FP.CPI.TOTL.ZG
            "cpi": "158.2",
            "prices": prices
        }
        
        # 4. Social (Mocked for now or aggregated from DB if we had region tags)
        social = {
            "sentimentByRegion": [
                {"region": "North", "sentiment": 65, "volume": "High"},
                {"region": "South", "sentiment": 45, "volume": "Med"},
                {"region": "East", "sentiment": 55, "volume": "Low"},
                {"region": "West", "sentiment": 72, "volume": "High"}
            ],
            "hashtags": ["#Agriculture", f"#{country}Farming", "#Harvest2024"]
        }
        
        # 5. Trade (Static/Mock for demo)
        trade = {
            "exports": 45000000000,
            "imports": 32000000000,
            "topExport": "Rice" if country == 'India' or country == 'Philippines' else "Machinery",
            "topImport": "Oil" if country == 'India' else "Wheat"
        }

        doc = {
            "country": country,
            "overview": overview,
            "trade": trade,
            "market": market,
            "social": social,
            "last_updated": datetime.now()
        }
        
        updates.append(UpdateOne(
            {"country": country},
            {"$set": doc},
            upsert=True
        ))
        
        print(f"   ✅ Prepared data for {country}")

    # Write to DB
    if updates:
        try:
            result = db['country_stats'].bulk_write(updates)
            print(f"\n💾 Bulk Write Result: Matched={result.matched_count}, Modified={result.modified_count}, Upserted={result.upserted_count}")
        except Exception as e:
            print(f"❌ DB Write Error: {e}")

if __name__ == "__main__":
    main()
