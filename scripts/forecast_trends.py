import os
import numpy as np
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# Load Environment Variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("❌ Error: MONGODB_URI not found")
    exit(1)

client = MongoClient(MONGODB_URI)
db = client.get_database('agri_trend_dashboard')
posts_collection = db['posts']
forecasts_collection = db['forecasts']

def fetch_data():
    """ Fetch and aggregate daily sentiment data """
    print("   🔹 Fetching historical data...")
    pipeline = [
        {
            "$group": {
                "_id": { 
                    "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } 
                },
                "avg_sentiment": { "$avg": "$analysis.sentiment_score" },
                "count": { "$sum": 1 }
            }
        },
        { "$sort": { "_id": 1 } }
    ]
    data = list(posts_collection.aggregate(pipeline))
    
    if not data:
        return pd.DataFrame()
        
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['_id'])
    df.set_index('date', inplace=True)
    df.sort_index(inplace=True)
    
    # Fill missing dates
    idx = pd.date_range(df.index.min(), df.index.max())
    df = df.reindex(idx, fill_value=0)
    
    return df

def train_linear_model(df):
    """ Train Linear Regression for simple trend """
    print("   🔹 Training Linear Regression...")
    df['days_ordinal'] = df.index.map(pd.Timestamp.toordinal)
    
    X = df[['days_ordinal']]
    y = df['avg_sentiment']
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Forecast next 7 days
    future_dates = [df.index.max() + timedelta(days=x) for x in range(1, 8)]
    future_ordinals = [[d.toordinal()] for d in future_dates]
    predictions = model.predict(future_ordinals)
    
    return [{"date": d, "sentiment": p, "model": "Linear Regression"} for d, p in zip(future_dates, predictions)]

def train_lstm_model(df):
    """ Train LSTM for complex time-series """
    print("   🔹 Training LSTM Model...")
    
    data = df['avg_sentiment'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences
    look_back = 3
    X, y = [], []
    if len(scaled_data) <= look_back:
        print("      ⚠️ Not enough data for LSTM")
        return []
        
    for i in range(look_back, len(scaled_data)):
        X.append(scaled_data[i-look_back:i, 0])
        y.append(scaled_data[i, 0])
        
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    # Build LSTM
    model = Sequential()
    model.add(LSTM(50, return_sequences=True, input_shape=(look_back, 1)))
    model.add(LSTM(50))
    model.add(Dense(1))
    model.compile(loss='mean_squared_error', optimizer='adam')
    
    # Train (verbose=0 to reduce noise)
    model.fit(X, y, epochs=20, batch_size=1, verbose=0)
    
    # Forecast next 7 days
    inputs = scaled_data[-look_back:]
    forecasts = []
    current_batch = inputs.reshape((1, look_back, 1))
    
    future_dates = [df.index.max() + timedelta(days=x) for x in range(1, 8)]
    
    for i in range(7):
        pred = model.predict(current_batch, verbose=0)[0]
        forecasts.append(pred)
        current_batch = np.append(current_batch[:, 1:, :], [[pred]], axis=1)
        
    predictions = scaler.inverse_transform(np.array(forecasts).reshape(-1, 1))
    
    return [{"date": d, "sentiment": float(p[0]), "model": "LSTM"} for d, p in zip(future_dates, predictions)]

def train_yield_model():
    """ Train Linear Regression for Crop Yields """
    print("   🔹 Training Yield Models...")
    
    country_stats = db['country_stats']
    yield_forecasts = db['yield_forecasts']
    
    countries = list(country_stats.find())
    all_forecasts = []
    
    for country_doc in countries:
        country_name = country_doc.get('country')
        crop_history = country_doc.get('crop_history', [])
        
        for crop_data in crop_history:
            crop_name = crop_data['crop']
            history = crop_data['history']
            
            if not history: continue
            
            df = pd.DataFrame(history)
            X = df[['year']]
            y = df['yield']
            
            model = LinearRegression()
            model.fit(X, y)
            
            # Forecast next 3 years
            future_years = [[y] for y in range(2025, 2028)]
            predictions = model.predict(future_years)
            
            forecast_data = []
            for year, val in zip(range(2025, 2028), predictions):
                forecast_data.append({'year': year, 'yield': round(val, 2)})
                
            all_forecasts.append({
                'country': country_name,
                'crop': crop_name,
                'history': history,
                'forecast': forecast_data,
                'last_updated': datetime.now()
            })
            
    if all_forecasts:
        yield_forecasts.delete_many({})
        yield_forecasts.insert_many(all_forecasts)
        print(f"      Saved forecasts for {len(all_forecasts)} country/crop pairs.")

def main():
    print("🚀 Starting ML Forecasting...")
    
    # 1. Sentiment Forecasting
    df = fetch_data()
    if not df.empty:
        forecasts = []
        try:
            lr_forecasts = train_linear_model(df)
            forecasts.extend(lr_forecasts)
        except Exception as e:
            print(f"❌ Linear Regression failed: {e}")

        try:
            lstm_forecasts = train_lstm_model(df)
            forecasts.extend(lstm_forecasts)
        except Exception as e:
            print(f"❌ LSTM failed: {e}")
            
        if forecasts:
            print(f"💾 Saving {len(forecasts)} sentiment predictions...")
            forecasts_collection.delete_many({})
            forecasts_collection.insert_many(forecasts)
    else:
        print("⚠️ No sentiment data available.")

    # 2. Yield Forecasting
    try:
        train_yield_model()
    except Exception as e:
        print(f"❌ Yield Forecasting failed: {e}")
        
    print("✅ Forecasting complete!")

if __name__ == "__main__":
    main()
