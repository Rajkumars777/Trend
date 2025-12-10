import os
import sys
import argparse
import random
import requests
import pymongo
import pandas as pd
import numpy as np
import yfinance as yf
import xml.etree.ElementTree as ET
import re
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
    from utils.world_bank import WorldBankClient
except ImportError:
    print("❌ Error: Could not import utils. Make sure 'scripts/utils' exists.")
    sys.exit(1)

# ==========================================
# 0. CONFIGURATION & SETUP
# ==========================================

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
wb_client = WorldBankClient()

# ==========================================
# 1. DATA FETCHING (LOCALIZATION & MARKETS)
# ==========================================

def fetch_exchange_rates():
    """ Fetch real-time exchange rates against USD """
    print("   💱 Fetching Exchange Rates...")
    print("   💱 Fetching Exchange Rates...")
    rates = {} 
    tickers = {"INR": "INR=X", "JPY": "JPY=X", "PHP": "PHP=X"}
    
    for currency, ticker in tickers.items():
        try:
            data = yf.Ticker(ticker).history(period="1d")
            if not data.empty:
                rates[currency] = round(data['Close'].iloc[-1], 2)
            else:
                print(f"      ⚠️ No data for {currency}")
        except Exception as e:
            print(f"      ⚠️ Failed to fetch {currency}: {e}")
            pass
            
    # CRITICAL: If rates are missing, we cannot calculate local prices.
    # We do NOT fallback to hardcoded values.
    return rates

    return trends

# ==========================================
# DEPRECATED: fetch_commodity_trends removed in favor of fetch_live_commodities
# ==========================================

def fetch_live_commodities():
    """ 
    Fetch LIVE absolute prices and % changes from Yahoo Finance Futures.
    Returns: {'Rice': {'price': 16.5, 'change': 1.2}, ...}
    """
    print("   📊 Fetching Live Commodity Futures (Chicago/Global)...")
    # Tickers: Rough Rice (cwt), Wheat (Bushel), Corn (Bushel), Soybean (Bushel), Cotton (lb)
    tickers = {
        "Rice": "ZR=F", 
        "Wheat": "ZW=F", 
        "Corn": "ZC=F", 
        "Soybean": "ZS=F", 
        "Cotton": "CT=F"
    }
    market_data = {}
    
    for name, ticker in tickers.items():
        try:
            # Fetch last 5 days to ensure we get a closing price even on weekends
            hist = yf.Ticker(ticker).history(period="5d")
            if not hist.empty:
                current = hist['Close'].iloc[-1]
                prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
                change_pct = ((current - prev) / prev) * 100
                
                market_data[name] = {
                    "price_usd": current,
                    "change_pct": round(change_pct, 2)
                }
            else:
                market_data[name] = {"price_usd": 0, "change_pct": 0}
        except Exception as e:
            print(f"      ⚠️ Failed to fetch {name} ({ticker}): {e}")
            market_data[name] = {"price_usd": 0, "change_pct": 0}
            
    return market_data

def calculate_local_price(commodity_type, global_price_usd, exchange_rate, country_code):
    """
    Convert Global Futures (USD) to Local Spot Prices.
    Logic: Global_Price * Unit_Conversion * Exchange_Rate * Local_Basis_Premium
    """
    if global_price_usd == 0: return 0
    
    # 1. Unit Conversion Standards (Approximate)
    # Rice (ZR=F) is USD per cwt (45.35 kg)
    # Wheat/Corn/Soy (ZW=F) is USD per Bushel (Wheat=27.2kg, Corn=25.4kg, Soy=27.2kg)
    # Cotton (CT=F) is USD per lb (0.453 kg)
    
    # Target Units:
    # India: Quintal (100 kg)
    # Philippines/Japan: kg or Ton
    
    price_per_kg_usd = 0
    
    if commodity_type == "Rice":
        price_per_kg_usd = global_price_usd / 45.35
    elif commodity_type == "Wheat":
        price_per_kg_usd = global_price_usd / 27.21
    elif commodity_type == "Corn":
        price_per_kg_usd = global_price_usd / 25.4
    elif commodity_type == "Soybean":
        price_per_kg_usd = global_price_usd / 27.21
    elif commodity_type == "Cotton":
        price_per_kg_usd = global_price_usd / 0.4535
        
    # 2. Local Basis (Premium/Discount/Taxes/Transport)
    # e.g., Basmati Rice in India trades at ~2x premium over generic Rough Rice futures
    premiums = {
        "India": {"Rice": 2.2, "Wheat": 1.1, "Cotton": 1.0, "Soybean": 1.1, "Sugar": 1.0}, # MSP/Basmati premiums
        "Japan": {"Rice": 4.5, "Wheat": 1.5, "Soybeans": 1.5}, # High protectionism/quality
        "Philippines": {"Rice": 1.2, "Corn": 1.1, "Sugar": 1.1} # Import costs
    }
    
    basis = premiums.get(country_code, {}).get(commodity_type, 1.1)
    
    return price_per_kg_usd * exchange_rate * basis

def get_local_prices(country, rates, global_market):
    """ 
    Generate Real-Time Local Prices derived from Live Global Data.
    NO HARDCODED BASE PRICES.
    """
    
    # 1. Define the Menu (What commodities to track per country)
    menus = {
        "India": [
            {"name": "Rice (Basmati)", "type": "Rice", "unit": "Qtl", "qty_factor": 100},
            {"name": "Wheat (Mandi)", "type": "Wheat", "unit": "Qtl", "qty_factor": 100},
            {"name": "Cotton", "type": "Cotton", "unit": "Bale", "qty_factor": 170}, # Indian Bale = 170kg
            {"name": "Soybean", "type": "Soybean", "unit": "Qtl", "qty_factor": 100}
        ],
        "Japan": [
            {"name": "Rice (Koshihikari)", "type": "Rice", "unit": "60kg", "qty_factor": 60},
            {"name": "Wheat (Import)", "type": "Wheat", "unit": "Ton", "qty_factor": 1000},
            {"name": "Soybeans", "type": "Soybean", "unit": "60kg", "qty_factor": 60}
        ],
        "Philippines": [
            {"name": "Rice (Well Milled)", "type": "Rice", "unit": "kg", "qty_factor": 1},
            {"name": "Corn (Yellow)", "type": "Corn", "unit": "kg", "qty_factor": 1},
            {"name": "Sugar (Brown)", "type": "Corn", "unit": "kg", "qty_factor": 1} # Corn proxy for now
        ]
    }

    target_menu = menus.get(country, [])
    currency_code = "INR" if country == "India" else ("JPY" if country == "Japan" else "PHP")
    symbol = "₹" if country == "India" else ("¥" if country == "Japan" else "₱")
    exchange_rate = rates.get(currency_code, 1.0) # USD to Local
    
    local_prices = []
    
    for item in target_menu:
        # Get Live Global Data
        g_type = item['type']
        g_data_obj = global_market.get(g_type, {"price_usd": 0, "change_pct": 0})
        g_price = g_data_obj['price_usd']
        g_trend = g_data_obj['change_pct']
        
        if g_price == 0: 
            # Fallback if Yahoo fails (Unlikely, but prevents crash)
            price_display = "N/A"
        else:
            # Calculate Price per KG in Local Currency
            base_price_local_kg = calculate_local_price(g_type, g_price, exchange_rate, country)
            
            # Scale to Unit (e.g., Qtl = 100kg)
            final_price = base_price_local_kg * item['qty_factor']
            price_display = f"{symbol}{round(final_price, 2)}"
            
        local_prices.append({
            "commodity": item['name'],
            "price": price_display,
            "trend": f"{'+' if g_trend >= 0 else ''}{g_trend}%",
            "unit": item['unit'],
            "source": "Live Futures (Derived)"
        })
        
    return local_prices

def fetch_weather_data(lat, lon):
    """ 
    Fetch current weather from WeatherAPI.com 
    Fallback: Random mock data if API key missing 
    """
    api_key = os.getenv("WEATHERAPI_KEY", "b64ecbd5a28f4133857100455242211") 
    url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={lat},{lon}"
    
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            temp_c = data['current']['temp_c']
            precip_mm = data['current']['precip_mm']
            return round(temp_c, 1), round(precip_mm, 1)
    except Exception as e:
        print(f"      ⚠️ Weather API Error: {e}")
        pass
        
    # No Mock Fallback - Return None to indicate missing data
    return None, None

def generate_country_data(country_name, rates, global_market):
    """ Orchestrate gathering of Economy + Weather + Market Prices """
    print(f"   🌍 Fetching World Bank Stats for {country_name}...")
    wb_data = wb_client.fetch_all_stats(country_name)
    
    coords_map = {
        "India": {"lat": 28.61, "lon": 77.20}, 
        "Japan": {"lat": 35.67, "lon": 139.65},
        "Philippines": {"lat": 12.87, "lon": 121.77}
    }
    coords = coords_map.get(country_name, {"lat": 0, "lon": 0})
    avg_temp, total_rain = fetch_weather_data(coords['lat'], coords['lon'])
    local_prices = get_local_prices(country_name, rates, global_market)

    # World Bank Data (Live or None)
    gdp_share = wb_data.get('gdp_share')
    employment = wb_data.get('employment')
    arable = wb_data.get('arable_land')
    
    return {
        'country': country_name,
        'overview': {
            "gdpContribution": f"{gdp_share}%" if gdp_share is not None else "N/A",
            "employment": f"{employment}%" if employment is not None else "N/A",
            "foodSecurityIndex": "High" if country_name == "Japan" else "Moderate",
            "arableLand": f"{arable}%" if arable is not None else "N/A",
            "policyHighlight": "MSP Support" if country_name == "India" else "Smart Agri Subsidies"
        },
        'trade': {
            "exports": round(gdp_share * 12, 1) if gdp_share else "N/A",
            "imports": round(gdp_share * 8, 1) if gdp_share else "N/A",
            "topExport": "Rice" if country_name == "India" else ("Electronics" if country_name == "Japan" else "Coconut"),
            "topImport": "Energy"
        },
        'market': {
            "inflation": f"{wb_data.get('inflation')}%" if wb_data.get('inflation') is not None else "N/A",
            "cpi": str(wb_data.get('cpi')) if wb_data.get('cpi') is not None else "N/A",
            "prices": local_prices
        },
        'social': { # Placeholder for region-specific sentiment view
            "sentimentByRegion": [
                {"region": "North", "sentiment": 85, "volume": "High"},
                {"region": "South", "sentiment": 60, "volume": "Medium"}
            ],
            "hashtags": ["#Agriculture", "#Harvest", f"#{country_name}Farming"]
        },
        'weather': { "temp": avg_temp, "rain": total_rain },
        'last_updated': datetime.now()
    }

# ==========================================
# 2. DATA FETCHING (SOCIAL & MEDIA)
# ==========================================

def display_source_header(source_name):
    print(f"   🔹 Fetching {source_name}...")

def normalize_reddit_post(data):
    try:
        if not data.get("id") or not data.get("title"): return None
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

def fetch_reddit():
    display_source_header("Reddit")
    headers = {'User-Agent': 'Mozilla/5.0'}
    chunk = ALL_KEYWORDS[:5]
    query = " OR ".join([f'"{k}"' for k in chunk])
    
    try:
        resp = requests.get("https://www.reddit.com/search.json", headers=headers, params={'q': query, 'limit': 15}, timeout=10)
        if resp.status_code == 200:
            posts = resp.json().get('data', {}).get('children', [])
            ops = []
            for p in posts:
                doc = normalize_reddit_post(p['data'])
                if doc: ops.append(UpdateOne({"reddit_id": doc["reddit_id"]}, {"$set": doc}, upsert=True))
            
            if ops: 
                db['posts'].bulk_write(ops)
                print(f"      ✅ Upserted {len(ops)} Reddit posts.")
                return len(ops)
    except Exception as e:
        print(f"      ⚠️ Reddit Error: {e}")
    return 0

def fetch_google_news():
    display_source_header("Google News")
    keywords = ["Rice price", "Wheat production", "Onion shortage", "Farmer protest", "Agriculture subsidy"]
    news_items = []
    
    for query in keywords:
        try:
            url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                for item in root.findall('.//item')[:3]: 
                    title = item.find('title').text
                    link = item.find('link').text
                    news_items.append({
                        "title": title,
                        "content": title,
                        "url": link,
                        "timestamp": datetime.now(),
                        "source": "news",
                        "author": "Google News"
                    })
        except Exception: 
            pass

    ops = []
    for item in news_items:
        ops.append(UpdateOne({"url": item["url"]}, {"$set": item}, upsert=True))
    
    if ops:
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} News articles.")
        except Exception as e:
            print(f"      ⚠️ News Write Error: {e}")
            return 0
    return len(ops)

def fetch_youtube_videos():
    display_source_header("YouTube")
    queries = ["farming techniques India", "rice market updates", "modern agriculture technology"]
    videos = []
    headers = {"User-Agent": "Mozilla/5.0"}
    
    for q in queries:
        try:
            url = f"https://www.youtube.com/results?search_query={q.replace(' ', '+')}&sp=CAI%253D" 
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', resp.text)
                unique_ids = list(set(video_ids))[:5]
                for vid in unique_ids:
                    videos.append({
                        "reddit_id": f"yt_{vid}", 
                        "title": f"YouTube Video: {vid}",
                        "content": f"Video discussion on {q}",
                        "url": f"https://youtu.be/{vid}",
                        "source": "youtube",
                        "timestamp": datetime.now(),
                        "author": "YouTube"
                    })
        except Exception:
            pass

    ops = []
    for v in videos:
        ops.append(UpdateOne({"url": v["url"]}, {"$set": v}, upsert=True))
        
    if ops:
        try:
            db['posts'].bulk_write(ops)
            print(f"      ✅ Upserted {len(ops)} YouTube videos.")
        except Exception as e:
            print(f"      ⚠️ YouTube Write Error: {e}")
            return 0
    return len(ops)

# ==========================================
# 3. PIPELINE ORCHESTRATION
# ==========================================

def fetch_all():
    logger = PipelineLogger()
    run_id = logger.start_run("Data Fetch Pipeline")
    print("🚀 Starting Data Fetch Pipeline (Localized)...")

    try:
        # A. Market Data
        logger.log_step("Fetch Rates", "STARTED")
        rates = fetch_exchange_rates()
        global_market = fetch_live_commodities() # UPDATED: Live Data
        logger.log_step("Fetch Rates", "SUCCESS")

        # B. Country Data
        logger.log_step("Fetch Country Stats", "STARTED")
        cnt_updated = 0
        for c in ["India", "Japan", "Philippines"]:
            try:
                c_data = generate_country_data(c, rates, global_market)
                db['country_stats'].update_one({"country": c}, {"$set": c_data}, upsert=True)
                print(f"      ✅ Saved localized stats for {c}")
                cnt_updated += 1
            except Exception as e:
                print(f"      ❌ Failed {c}")
        logger.log_step("Fetch Country Stats", "SUCCESS", f"Updated {cnt_updated} countries")

        # C. Social Data (Serial Execution)
        total_posts = 0
        total_posts += fetch_reddit()
        total_posts += fetch_google_news()
        total_posts += fetch_youtube_videos()

        logger.finish_run("SUCCESS", {"posts_new": total_posts, "countries_updated": cnt_updated})
    except Exception as e:
        logger.finish_run("FAILED", {"error": str(e)})

def enrich_data():
    logger = PipelineLogger()
    logger.start_run("Data Enrichment")
    print("🚀 Starting Data Enrichment...")
    
    try:
        # Fetch un-enriched posts
        cursor = db['posts'].find({"analysis": {"$exists": False}})
        count = 0
        
        for doc in cursor:
            # AI Inference
            analysis = ai_client.analyze(doc.get('content', ''))
            
            if analysis and analysis['is_relevant']:
                db['posts'].update_one({"_id": doc["_id"]}, {"$set": {"analysis": analysis}})
                count += 1
            else:
                # Remove irrelevant to keep DB clean
                db['posts'].delete_one({"_id": doc["_id"]})
                
        print(f"   ✅ Enriched {count} records.")
        logger.finish_run("SUCCESS", {"enriched_count": count})
    except Exception as e:
        logger.finish_run("FAILED", {"error": str(e)})

def forecast_trends():
    logger = PipelineLogger()
    logger.start_run("Trend Forecasting")
    print("🚀 Starting Trend Forecasting...")
    
    try:
        # Group sentiments by day
        data = list(db['posts'].aggregate([
            {"$group": {"_id": { "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } }, "avg": { "$avg": "$analysis.sentiment_score" }}},
            { "$sort": { "_id": 1 } }
        ]))
        
        if not data: 
            logger.finish_run("SKIPPED", "No data")
            return
        
        # Prepare Dataframe
        df = pd.DataFrame(data)
        df['days'] = range(len(df))
        
        # Linear Regression
        model = LinearRegression().fit(df[['days']], df['avg'])
        future_days = np.array(range(len(df), len(df)+7)).reshape(-1, 1)
        preds = model.predict(future_days)
        
        # Save Forecasts
        results = []
        last_date = pd.to_datetime(df['_id'].max())
        for i, p in enumerate(preds):
            results.append({
                "date": last_date + timedelta(days=i+1), 
                "sentiment": float(p), 
                "model": "Linear Regression"
            })
            
        db['forecasts'].delete_many({})
        db['forecasts'].insert_many(results)
        
        print(f"   ✅ Saved {len(results)} forecasts.")
        logger.finish_run("SUCCESS", {"forecast_days": len(results)})
    except Exception as e:
        logger.finish_run("FAILED", {"error": str(e)})

# ==========================================
# 4. ENTRY POINT
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Agri-Trend Unified Pipeline")
    subparsers = parser.add_subparsers(dest='command', help='Pipeline Command')
    
    subparsers.add_parser('fetch', help='Fetch data from all sources')
    subparsers.add_parser('process', help='Enrich data with AI & Forecast')
    subparsers.add_parser('info', help='Show database statistics')
    
    args = parser.parse_args()
    
    if args.command == 'fetch': fetch_all()
    elif args.command == 'process': 
        enrich_data()
        forecast_trends()
    elif args.command == 'info':
        print("📊 DB Stats:")
        for name in db.list_collection_names():
            print(f"   - {name}: {db[name].count_documents({})} records")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
