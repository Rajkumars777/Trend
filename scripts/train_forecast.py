import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

# Try importing TensorFlow
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
    from sklearn.preprocessing import MinMaxScaler
    HAS_TF = True
    print("✅ TensorFlow imported successfully.")
except ImportError:
    HAS_TF = False
    print("⚠️ TensorFlow not found. Fallback to basic regression (Not Implemented in this v1 strict mode).")
    # For now, we will exit if no TF, or perform a mock if enforced. 
    # But user asked for REAL model.

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '../.env.local')
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client.get_database('agri_trend_dashboard')

def get_data(country, commodity):
    cursor = db['price_history'].find(
        {"country": country, "commodity": commodity}
    ).sort("date", 1)
    df = pd.DataFrame(list(cursor))
    if df.empty: return None
    return df

def train_and_predict(country, commodity):
    print(f"\n🧠 Training LSTM for {country} - {commodity}...")
    
    df = get_data(country, commodity)
    if df is None or len(df) < 100:
        print("   ⚠️ Not enough data.")
        return

    # Prepare data
    data = df['price'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences
    SEQ_LEN = 60
    X, y = [], []
    for i in range(SEQ_LEN, len(scaled_data)):
        X.append(scaled_data[i-SEQ_LEN:i, 0])
        y.append(scaled_data[i, 0])
        
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    # LSTM Model
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=(X.shape[1], 1)))
    model.add(LSTM(units=50))
    model.add(Dense(1))
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(X, y, epochs=5, batch_size=32, verbose=0) # Fast training for demo
    
    # Predict next 180 days (6 months)
    # Start with last valid sequence
    curr_seq = scaled_data[-SEQ_LEN:].reshape(1, SEQ_LEN, 1)
    predictions = []
    
    for _ in range(180):
        pred = model.predict(curr_seq, verbose=0)
        predictions.append(pred[0][0])
        
        # Update sequence with prediction
        curr_seq = np.append(curr_seq[:, 1:, :], [[pred[0]]], axis=1)
        
    # Inverse transform
    true_predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
    
    # Save to DB
    last_date_str = df.iloc[-1]['date']
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
    
    forecast_docs = []
    for i, price in enumerate(true_predictions):
        f_date = last_date + timedelta(days=i+1)
        forecast_docs.append({
            "country": country,
            "commodity": commodity,
            "date": f_date.strftime("%Y-%m-%d"),
            "price": float(price[0]),
            "model": "LSTM"
        })
        
    # Overwrite old forecasts for this combo
    db['market_forecasts'].delete_many({"country": country, "commodity": commodity})
    if forecast_docs:
        db['market_forecasts'].insert_many(forecast_docs)
        print(f"   ✅ Saved {len(forecast_docs)} day forecast.")

def main():
    if not HAS_TF:
        print("❌ Cannot run LSTM without TensorFlow. Please install it.")
        return

    # Iterate unique combos
    combos = db['price_history'].aggregate([
        {"$group": {"_id": {"country": "$country", "commodity": "$commodity"}}}
    ])
    
    for c in combos:
        meta = c['_id']
        train_and_predict(meta['country'], meta['commodity'])

if __name__ == "__main__":
    main()
