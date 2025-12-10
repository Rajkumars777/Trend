import os

# Force usage of PyTorch and disable TF/Keras 3 conflicts
os.environ["USE_TORCH"] = "True"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

import requests
import time
from dotenv import load_dotenv

# Load Environment Variables
# Resolve path relative to THIS script file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# .env.local is in project root, so ../../.env.local
ENV_PATH = os.path.join(BASE_DIR, '../../.env.local')
load_dotenv(ENV_PATH)

class AgriAIClient:
    def __init__(self):
        print("🤖 Initializing AI (Hybrid Implementation)...")
        
        self.api_token = os.getenv("HF_TOKEN")
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        
        # Endpoints (Keep for Zero-Shot checks if needed, but we will rely on local for sentiment)
        self.classifier_url = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

        # Categories for Zero-Shot
        self.agri_labels = ["agriculture", "not_agriculture"]
        self.topic_labels = [
            "Market Prices", "Weather", "Pests & Disease", "Farming Technology", "Government Policy"
        ]

        # Initialize Local Sentiment Pipeline
        try:
            from transformers import pipeline
            
            # Local model path
            local_model_path = os.path.join(BASE_DIR, '../../models/sentiment-model')
            
            if os.path.exists(local_model_path):
                print(f"   📂 Loading local model from {local_model_path}...")
                self.sentiment_pipe = pipeline("sentiment-analysis", model=local_model_path, device=-1)
                print("   ✅ Local model loaded successfully.")
            else:
                print("   ⚠️ Local model not found. Attempting to load from Hugging Face Hub (slower)...")
                # Fallback to HF Hub
                self.sentiment_pipe = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student", device=-1) # CPU
                print("   ✅ Model loaded from Hub.")
                
        except Exception as e:
            print(f"   ⚠️ Could not load local model: {e}")
            self.sentiment_pipe = None

    def _query(self, url, payload, retries=3):
        # Keep existing query method for other checks
        for i in range(retries):
            try:
                response = requests.post(url, headers=self.headers, json=payload, timeout=20)
                if response.status_code == 503:
                    time.sleep(5)
                    continue 
                if response.status_code != 200:
                    return None
                return response.json()
            except Exception:
                time.sleep(1)
        return None

    def analyze(self, text):
        if not text or len(text) < 5: return None

        try:
            # 1. Relevance Check (Is this Agriculture?)
            payload_rel = {
                "inputs": text,
                "parameters": {"candidate_labels": self.agri_labels, "multi_class": False}
            }
            rel_data = self._query(self.classifier_url, payload_rel)
            
            if not rel_data: return None
            
            # Parse Zero Shot
            if isinstance(rel_data, list): 
                rel_data.sort(key=lambda x: x.get('score', 0), reverse=True)
                top_item = rel_data[0]
                top_label = top_item['label']
                top_score = top_item['score']
            elif isinstance(rel_data, dict) and 'labels' in rel_data:
                top_label = rel_data['labels'][0]
                top_score = rel_data['scores'][0]
            else:
                return None
            
            is_relevant = (top_label == "agriculture" and top_score > 0.5)
            
            if not is_relevant:
                return {
                    "is_relevant": False,
                    "reason": f"Classified as {top_label} ({top_score:.2f})"
                }
                
            # 2. Topic Categorization (If Relevant)
            payload_topic = {
                 "inputs": text,
                 "parameters": {"candidate_labels": self.topic_labels, "multi_class": False}
            }
            topic_data = self._query(self.classifier_url, payload_topic)
            category = "General Agriculture"
            if topic_data:
                 if isinstance(topic_data, list):
                     topic_data.sort(key=lambda x: x.get('score', 0), reverse=True)
                     category = topic_data[0]['label']
                 elif isinstance(topic_data, dict) and 'labels' in topic_data:
                     category = topic_data['labels'][0]

            # 3. Sentiment Analysis
            payload_sent = {"inputs": text}
            sent_data = self._query(self.sentiment_url, payload_sent)
            
            # 3. Sentiment Analysis (LOCAL)
            sent_label = "Neutral"
            sent_score = 0.0

            if self.sentiment_pipe:
                 # Local Inference
                 # Output format: [{'label': 'positive', 'score': 0.9}]
                 result = self.sentiment_pipe(text[:512], truncation=True, top_k=1) # Limit length for BERT
                 if result:
                     top = result[0] # top_k=1 returns list
                     sent_label = top['label']
                     sent_score = top['score']
            else:
                 # Fallback (though likely won't work if quota exceeded)
                 pass

            # Normalize Label (DistilBERT might return 'positive', 'negative', 'neutral' lowercased)
            sent_label = sent_label.lower()
            if sent_label == "positive":
                final_label = "Positive"
                final_score = sent_score
            elif sent_label == "negative":
                final_label = "Negative"
                final_score = -sent_score
            else:
                final_label = "Neutral"
                final_score = 0.0

            # Apply Confidence Threshold (Reduce "weak" positive/negative)
            # Lowered to 0.2 to ensure we capture Positive sentiments which often have lower confidence
            SENTIMENT_THRESHOLD = 0.2
            if final_label != "Neutral" and abs(sent_score) < SENTIMENT_THRESHOLD:
                 final_label = "Neutral"
                 final_score = 0.0

            # 4. Keyword Extraction
            detected_keywords = ["Agriculture"]
            try:
                from utils.agri_keywords import ALL_KEYWORDS, HASHTAGS
                found_keywords = []
                text_lower = text.lower()
                
                # Check predefined agri keywords
                for k in ALL_KEYWORDS:
                    if k.lower() in text_lower:
                        found_keywords.append(k) 
                
                # Check hashtags
                words = text.split()
                for w in words:
                    if w.startswith("#"):
                        clean_tag = w[1:].lower()
                        if clean_tag in HASHTAGS:
                            found_keywords.append(clean_tag)
                
                # Deduplicate and limit
                detected_keywords = list(set(found_keywords))[:5]
                # Filter out garbage (1-2 chars unless valid)
                detected_keywords = [k for k in detected_keywords if len(k) > 2]
                
                if not detected_keywords:
                     if category != "General Agriculture":
                         detected_keywords = [category]
                     else:
                         detected_keywords = ["Agriculture"]

            except ImportError:
                 detected_keywords = ["Agriculture"]

            return {
                "is_relevant": True,
                "category": category,
                "sentiment_class": final_label,
                "sentiment_score": round(final_score, 4),
                "confidence": round(top_score, 4),
                "detected_keywords": detected_keywords
            }

        except Exception as e:
            print(f"      ⚠️ Parsing Error: {e}")
            return None

if __name__ == "__main__":
    ai = AgriAIClient()
    print("\n🔬 Testing AI Analysis...")
    
    samples = [
        "Use npm install react for your frontend.",
        "Wheat prices are dropping dangerously low.",
        "Government announced new MSP for farmers.",
        "I love watching movies on Netflix.",
        "Monsoon delay causing panic among rice farmers in Punjab."
    ]
    
    for s in samples:
        print(f"\nText: {s}")
        res = ai.analyze(s)
        if res and res['is_relevant']:
             print(f"✅ RELEVANT | {res['category']} | {res['detected_keywords']}")
        else:
             print(f"❌ IRRELEVANT | {res.get('reason') if res else 'None'}")
