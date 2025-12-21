
import time
import random
import os
import sys
import pandas as pd
from datetime import datetime, timedelta

# Import our new advanced modules
try:
    from advanced_analytics.nlp_engine import NLPEngine
    from advanced_analytics.forecasting_engine import ForecastingEngine
    from advanced_analytics.drift_monitor import DriftDetector
    from advanced_analytics.relevance_gate import RelevanceGate
    from advanced_analytics.graph_engine import GraphEngine
except ImportError:
    import sys
    import os
    # Fix path if running from root or scripts dir
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from advanced_analytics.nlp_engine import NLPEngine
    from advanced_analytics.forecasting_engine import ForecastingEngine
    from advanced_analytics.drift_monitor import DriftDetector
    from advanced_analytics.relevance_gate import RelevanceGate
    from advanced_analytics.graph_engine import GraphEngine

class CognitivePipeline:
    """
    Real-Time 'Kappa' Architecture Pipeline.
    Simulates Kafka consumption and Flink-style windowed processing.
    """
    
    def __init__(self):
        print("🚀 Initializing Real-Time Cognitive Architecture...")
        self.nlp = NLPEngine()
        self.forecaster = ForecastingEngine()
        self.drift_detector = DriftDetector(sensitivity=0.01)
        self.relevance_gate = RelevanceGate()
        self.graph_engine = GraphEngine()
        
        # Flink-style State
        self.window_buffer = []
        self.window_size = 5 # Process every 5 events
        self.global_state = {"last_price": 2500, "sentiment_index": 0}

    def _real_data_stream(self):
        """ Fetches REAL data from Social Media Pipeline """
        try:
            from social_media_pipeline import fetch_reddit, fetch_google_news, fetch_youtube_videos, fetch_mastodon, fetch_hacker_news, fetch_medium, fetch_lemmy, fetch_social_proxy, fetch_web_scrape
        except ImportError:
            # Fallback path if running from subdir
            sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
            from social_media_pipeline import fetch_reddit, fetch_google_news, fetch_youtube_videos, fetch_mastodon, fetch_hacker_news, fetch_medium, fetch_lemmy, fetch_social_proxy, fetch_web_scrape

        print("   📡 Fetching fresh data batches from Social Sources...")
        
        # Batch Fetch
        all_items = []
        all_items.extend(fetch_reddit(dry_run=True))
        all_items.extend(fetch_google_news(dry_run=True))
        all_items.extend(fetch_youtube_videos(dry_run=True))
        all_items.extend(fetch_mastodon(dry_run=True))
        all_items.extend(fetch_hacker_news(dry_run=True))
        all_items.extend(fetch_medium(dry_run=True))
        all_items.extend(fetch_lemmy(dry_run=True))
        all_items.extend(fetch_social_proxy(dry_run=True))
        all_items.extend(fetch_web_scrape(dry_run=True))
        
        random.shuffle(all_items) # Simulate interleaved stream
        
        for item in all_items:
            yield {
                "timestamp": item.get('timestamp', datetime.now()),
                "text": item.get('title', '') + " " + item.get('content', ''),
                "base_price": 2500, # Mock price sync (complex to do real-time without paid API)
                "true_sentiment": 0.0, # Unknown initially
                "raw_doc": item
            }

    def process_stream(self, max_events=100):
        """ Main Processing Loop (Consumer) """
        print("📡 Connecting to Cognitive Data Stream...")
        
        # Connect to DB for Storage
        import pymongo
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/agri_trend_dashboard')
        client = pymongo.MongoClient(mongo_uri)
        print(f"🔌 [Social] Connecting to URI: {mongo_uri.split('@')[-1] if '@' in mongo_uri else mongo_uri}")
        db = client.get_database('agri_trend_dashboard')
        print(f"🔌 [Social] Connected. Current Post Count: {db['posts'].count_documents({})}")
        
        stream = self._real_data_stream()
        
        event_count = 0
        try:
            for event in stream:
                if event_count >= max_events: break
                
                print(f"   📨 Incoming: {event['text'][:40]}...")
                
                # 0. The Gatekeeper (Semantic Relevance Filter)
                if not self.relevance_gate.is_relevant(event['text']):
                    print("      🗑️ [IRRELEVANT] Discarded by Semantic Gate.")
                    continue

                # 1. Advanced NLP (AgriBERT + ABSA)
                aspects = self.nlp.aspect_based_sentiment(event['text'])
                entities = self.nlp.detect_entities(event['text'])
                
                # 2. Graph Neural Network (Risk Propagation - TGN)
                gnn_risk = self.graph_engine.propagate_risk(
                    topic=entities[0]['entity'] if entities else "General",
                    sentiment_score=sum(aspects.values()),
                    user_influence_score=random.uniform(0.1, 0.9),
                    timestamp=event['timestamp']
                )
                
                if "CRITICAL" in gnn_risk['viral_risk']:
                     print(f"      🕸️ [GNN-TGN ALERT] Viral Spike! Velocity: {gnn_risk['influence_velocity']} | Impact: {gnn_risk['supply_chain_impact_prob']}")
                
                # 3. Drift Detection
                sentiment_score = sum(aspects.values()) / 3
                is_drift = self.drift_detector.check_distribution_shift(sentiment_score)
                
                if is_drift:
                    print(f"   ⚠️ [DRIFT DETECTED] Triggering Retraining...")
                
                # 4. STORE ENRICHED DATA (The "Sink")
                enriched_doc = event['raw_doc']
                enriched_doc['analysis'] = {
                    "aspects": aspects, 
                    "entities": entities,
                    "gnn_risk": gnn_risk,
                    "sentiment_score": sentiment_score
                }
                # Upsert to DB
                db['posts'].update_one(
                    {"url": enriched_doc.get("url")}, 
                    {"$set": enriched_doc}, 
                    upsert=True
                )
                
                # 5. Window Aggregation
                self.window_buffer.append({
                    "ds": event['timestamp'],
                    "sentiment": sentiment_score,
                    "price": event['base_price']
                })
                
                print(f"      ✅ Processed & Stored | Sent: {round(sentiment_score, 2)}")
                
                # 6. Trigger Forecast on Window Close
                if len(self.window_buffer) >= self.window_size:
                    self._trigger_enterprise_forecast()
                    self.window_buffer = [] 
                
                event_count += 1
                
        except KeyboardInterrupt:
            print("🛑 Stream Stopped.")

    def _trigger_enterprise_forecast(self):
        """ Run Enterprise-Grade Conformal Prediction """
        df = pd.DataFrame(self.window_buffer)
        df['y'] = df['price']
        
        print("   ⏱️ Window Closed. Running Conformal Prediction (Risk Interval)...")
        
        # Prepare Covariates
        self.forecaster.prepare_tft_tensors(df, "price", "ds", ["Mandi_ID"], ["Holiday"])
        
        # Conformal Forecast
        # 1. Get Point Prediction
        forecast = self.forecaster.forecast_neural_prophet(df, periods=3)
        pred_point = forecast['yhat1'].iloc[-1]
        
        # 2. Get Uncertainty Interval
        risk_profile = self.forecaster.explain_forecast_conformal(pred_point, confidence=0.9)
        
        print(f"      🔮 Forecast (T+3): ₹{risk_profile['lower_bound']} - ₹{risk_profile['upper_bound']} ({risk_profile['confidence_level']} Conf)")
        print(f"         Point: ₹{risk_profile['point_forecast']} | Drivers: {risk_profile['drivers']}")

if __name__ == "__main__":
    pipeline = CognitivePipeline()
    pipeline.process_stream(max_events=15)
