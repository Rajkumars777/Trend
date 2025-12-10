import os
import sys
import argparse
import random
import requests
import pymongo
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import UpdateOne
from sklearn.linear_model import LinearRegression

# Add script dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Utils
try:
    from utils.ai_client import AgriAIClient
    from utils.agri_keywords import ALL_KEYWORDS
    from utils.logger import PipelineLogger
except ImportError:
    print("❌ Error: Could not import utils. Make sure 'scripts/utils' exists.")
    sys.exit(1)

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv('MONGODB_URI')
if not MONGO_URI:
    MONGO_URI = 'mongodb://localhost:27017/agri_trend_dashboard'

print(f"🔌 Connecting to MongoDB...")
client = pymongo.MongoClient(MONGO_URI)
db = client.get_database('agri_trend_dashboard')
ai_client = AgriAIClient()

# ==========================================
# PART 1: DATA FETCHING
# ==========================================

# ==========================================
# PART 1b: LOCALIZATION HELPERS
# ==========================================

def fetch_exchange_rates():
    """ Fetch real-time exchange rates against USD """
    print("   💱 Fetching Exchange Rates...")
    rates = {"USD": 1.0, "INR": 83.5, "JPY": 150.0, "PHP": 56.0} # Fallbacks
    tickers = {"INR": "INR=X", "JPY": "JPY=X", "PHP": "PHP=X"}
    
    for currency, ticker in tickers.items():
        try:
            data = yf.Ticker(ticker).history(period="1d")
            if not data.empty:
                rates[currency] = round(data['Close'].iloc[-1], 2)
        except Exception:
            pass
    return rates

def get_local_prices(country, rates, global_trends):
    """ 
    Generate realistic local prices based on benchmarks + global trends 
    country: Target Country
    rates: Dict of exchange rates (USD base)
    global_trends: Dict of {commodity: percent_change} from Yahoo
    """
    
    # Configuration for specific markets
    # Baseline: Approximate market price in local currency per local unit
    config = {
        "India": {
            "currency": "₹", "code": "INR",
            "commodities": [
                {"name": "Rice (Basmati)", "base": 3600, "unit": "Qtl", "global_proxy": "Rice"},
                {"name": "Wheat (Mandi)", "base": 2400, "unit": "Qtl", "global_proxy": "Wheat"},
                {"name": "Cotton", "base": 5800, "unit": "Bale", "global_proxy": "Cotton"},
                {"name": "Soybean", "base": 4600, "unit": "Qtl", "global_proxy": "Soybean"},
                {"name": "Sugar", "base": 3800, "unit": "Qtl", "global_proxy": "Corn"} # Proxy for general agri
            ]
        },
        "Japan": {
            "currency": "¥", "code": "JPY",
            "commodities": [
                {"name": "Rice (Koshihikari)", "base": 14000, "unit": "60kg", "global_proxy": "Rice"},
                {"name": "Wheat (Import)", "base": 6000, "unit": "Ton", "global_proxy": "Wheat"}, 
                {"name": "Soybeans", "base": 9000, "unit": "60kg", "global_proxy": "Soybean"}
            ]
        },
        "Philippines": {
            "currency": "₱", "code": "PHP",
            "commodities": [
                {"name": "Rice (Well Milled)", "base": 45, "unit": "kg", "global_proxy": "Rice"},
                {"name": "Corn (Yellow)", "base": 28, "unit": "kg", "global_proxy": "Corn"},
                {"name": "Sugar (Brown)", "base": 65, "unit": "kg", "global_proxy": "Corn"}
            ]
        }
    }
    
    target = config.get(country)
    if not target: return []
    
    local_prices = []
    for item in target['commodities']:
        # Base price
        price = item['base']
        
        # Apply Global Trend Impact (Partial transmission)
        # If US futures are up 2%, local market might be up 0.5-1% depending on policies
        trend_name = item.get('global_proxy')
        trend_pct = global_trends.get(trend_name, 0)
        
        # Add some local daily volatility/noise (simulating local supply/demand)
        local_noise = random.uniform(-0.5, 0.5)
        final_change_pct = (trend_pct * 0.4) + local_noise
        
        # Calculate current price
        current_price = price * (1 + final_change_pct / 100)
        
        local_prices.append({
            "commodity": item['name'],
            "price": f"{target['currency']}{round(current_price, 2)}",
            "trend": f"{'+' if final_change_pct >= 0 else ''}{round(final_change_pct, 2)}%",
            "unit": item['unit']
        })
        
    return local_prices

def fetch_commodity_trends():
    """ Get just the % change from Yahoo to drive local trends """
    trends = {}
    tickers = {"Rice": "ZR=F", "Wheat": "ZW=F", "Corn": "ZC=F", "Soybean": "ZS=F", "Cotton": "CT=F"}
    for name, ticker in tickers.items():
        try:
            hist = yf.Ticker(ticker).history(period="2d")
            if len(hist) >= 2:
                change = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100
                trends[name] = change
        except:
            trends[name] = 0
    return trends

def generate_country_data(country_name, rates, global_trends):
    # 1. Fetch World Bank Stats
    print(f"   🌍 Fetching World Bank Stats for {country_name}...")
    wb_data = wb_client.fetch_all_stats(country_name)
    
    # 2. Weather
    coords_map = {
        "India": {"lat": 28.61, "lon": 77.20}, "Japan": {"lat": 35.67, "lon": 139.65},
        "Philippines": {"lat": 12.87, "lon": 121.77}
    }
    coords = coords_map.get(country_name, {"lat": 0, "lon": 0})
    avg_temp, total_rain = fetch_weather_data(coords['lat'], coords['lon'])

    # 3. Market Data (LOCALIZED)
    local_prices = get_local_prices(country_name, rates, global_trends)

    # Overview
    gdp_share = wb_data.get('gdp_share') or 5.0
    
    overview = {
        "gdpContribution": f"{gdp_share}%",
        "employment": f"{wb_data.get('employment') or 25}%",
        "foodSecurityIndex": "High" if country_name == "Japan" else "Moderate",
        "arableLand": f"{wb_data.get('arable_land') or 30}%",
        "policyHighlight": "MSP Support" if country_name == "India" else "Smart Agri Subsidies"
    }
    
    trade = {
        "exports": round(gdp_share * 12, 1),
        "imports": round(gdp_share * 8, 1),
        "topExport": "Rice" if country_name == "India" else ("Electronics" if country_name == "Japan" else "Coconut"),
        "topImport": "Energy"
    }
    
    market = {
        "inflation": f"{wb_data.get('inflation') or 4}%",
        "cpi": str(wb_data.get('cpi') or 120),
        "prices": local_prices
    }
    
    social = {
        "sentimentByRegion": [
            {"region": "Region A", "sentiment": 85, "volume": "High"},
            {"region": "Region B", "sentiment": 60, "volume": "Medium"}
        ],
        "hashtags": ["#Agriculture", "#Harvest", f"#{country_name}Farming"]
    }

    return {
        'country': country_name,
        'overview': overview,
        'trade': trade,
        'market': market,
        'social': social,
        'last_updated': datetime.now()
    }

def normalize_reddit_post(data):
    try:
        # Basic validation
        if not data.get("id") or not data.get("title"):
            return None
            
        return {
            "reddit_id": data.get("id"),
            "title": data.get("title"),
            "content": data.get("selftext") or data.get("title"),
            "url": data.get("url"),
            "author": data.get("author"),
            "timestamp": datetime.fromtimestamp(data.get("created_utc")),
            "subreddit": data.get("subreddit"),
            "score": data.get("score"),
            "num_comments": data.get("num_comments"),
            "source": "reddit"
        }
    except Exception:
        return None

def fetch_all():
    logger = PipelineLogger()
    run_id = logger.start_run("Data Fetch Pipeline")
    
    try:
        print("🚀 Starting Data Fetch Pipeline (Localized)...")
        logger.log_step("Fetch Rates", "STARTED")
        
        # 1. Globals
        rates = fetch_exchange_rates()
        input_trends = fetch_commodity_trends()
        logger.log_step("Fetch Rates", "SUCCESS")

        # 2. Country Stats
        logger.log_step("Fetch Country Stats", "STARTED")
        COUNTRIES = ["India", "Japan", "Philippines"]
        
        success_count = 0
        for c in COUNTRIES:
            try:
                c_data = generate_country_data(c, rates, input_trends)
                
                # Upsert
                db['country_stats'].update_one(
                    {"country": c},
                    {"$set": c_data},
                    upsert=True
                )
                print(f"      ✅ Saved localized stats for {c}")
                success_count += 1
            except Exception as e:
                print(f"      ❌ Failed {c}: {e}")
                logger.log_step(f"Stats for {c}", "ERROR", str(e))
        
        logger.log_step("Fetch Country Stats", "SUCCESS", f"Updated {success_count}/{len(COUNTRIES)} countries")
        print(f"   ✅ Stats update process complete.")
        
        # 2. Reddit (Keep existing)
        logger.log_step("Fetch Reddit", "STARTED")
        print("   🔹 Fetching Reddit...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        chunk = ALL_KEYWORDS[:5]
        query = " OR ".join([f'"{k}"' for k in chunk])
        posts_count = 0
        try:
            resp = requests.get("https://www.reddit.com/search.json", headers=headers, params={'q': query, 'limit': 10}, timeout=10)
            if resp.status_code == 200:
                posts = resp.json().get('data', {}).get('children', [])
                ops = []
                for p in posts:
                    doc = normalize_reddit_post(p['data'])
                    if doc: ops.append(UpdateOne({"reddit_id": doc["reddit_id"]}, {"$set": doc}, upsert=True))
                if ops: 
                    db['posts'].bulk_write(ops)
                    print(f"   ✅ Upserted {len(ops)} Reddit posts.")
                    posts_count = len(ops)
            logger.log_step("Fetch Reddit", "SUCCESS", f"Upserted {posts_count} posts")
        except Exception as e:
            print(f"      ⚠️ Reddit Error: {e}")
            logger.log_step("Fetch Reddit", "WARNING", str(e))
            
        logger.finish_run("SUCCESS", {"posts_new": posts_count, "countries_updated": success_count})

    except Exception as e:
        logger.log_step("Pipeline Error", "CRITICAL", str(e))
        logger.finish_run("FAILED", {"error": str(e)})

# ==========================================
# PART 2: DATA PROCESSING
# ==========================================

def enrich_data():
    logger = PipelineLogger()
    logger.start_run("Data Enrichment")
    try:
        print("🚀 Starting Data Enrichment...")
        print("🚀 Starting Data Enrichment...")
        cursor = db['posts'].find({"analysis": {"$exists": False}})
        # cursor = db['posts'].find({}).sort("timestamp", -1).limit(50) # Force update last 50
        count = 0
        logger.log_step("Enrich Posts", "STARTED")
        for doc in cursor:
            analysis = ai_client.analyze(doc.get('content', ''))
            if analysis and analysis['is_relevant']:
                db['posts'].update_one({"_id": doc["_id"]}, {"$set": {"analysis": analysis}})
                count += 1
            else:
                db['posts'].delete_one({"_id": doc["_id"]})
        print(f"   ✅ Enriched {count} records.")
        logger.log_step("Enrich Posts", "SUCCESS", f"Enriched {count} posts")
        logger.finish_run("SUCCESS", {"enriched_count": count})
    except Exception as e:
        logger.finish_run("FAILED", {"error": str(e)})

def forecast_trends():
    logger = PipelineLogger()
    logger.start_run("Trend Forecasting")
    try:
        print("🚀 Starting Trend Forecasting...")
        data = list(db['posts'].aggregate([
            {"$group": {"_id": { "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } }, "avg": { "$avg": "$analysis.sentiment_score" }}},
            { "$sort": { "_id": 1 } }
        ]))
        if not data: 
            logger.log_step("Forecast", "SKIPPED", "No data available")
            logger.finish_run("SKIPPED")
            return
        
        df = pd.DataFrame(data)
        df['days'] = range(len(df))
        model = LinearRegression().fit(df[['days']], df['avg'])
        preds = model.predict(np.array(range(len(df), len(df)+7)).reshape(-1, 1))
        
        results = [{"date": pd.to_datetime(df['_id'].max()) + timedelta(days=i+1), "sentiment": float(p), "model": "Linear Regression"} for i, p in enumerate(preds)]
        db['forecasts'].delete_many({})
        db['forecasts'].insert_many(results)
        print(f"   ✅ Saved {len(results)} forecasts.")
        logger.log_step("Forecast", "SUCCESS", f"Generated {len(results)} days forecast")
        logger.finish_run("SUCCESS", {"forecast_days": len(results)})
    except Exception as e:
        logger.finish_run("FAILED", {"error": str(e)})

def show_info():
    print("📊 DB Stats:")
    for name in db.list_collection_names():
        print(f"   - {name}: {db[name].count_documents({})} records")

# ==========================================
# MAIN
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Agri-Trend Unified Pipeline")
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    subparsers.add_parser('fetch', help='Fetch all data')
    subparsers.add_parser('process', help='Enrich and Forecast data')
    subparsers.add_parser('info', help='Show DB info')
    
    args = parser.parse_args()
    
    if args.command == 'fetch':
        fetch_all()
    elif args.command == 'process':
        enrich_data()
        forecast_trends()
    elif args.command == 'info':
        show_info()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
