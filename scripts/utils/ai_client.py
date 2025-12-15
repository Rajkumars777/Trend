
import os
import time
from dotenv import load_dotenv

# Force usage of PyTorch and disable TF/Keras 3 conflicts
os.environ["USE_TORCH"] = "True"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

import requests

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
        
        # Default Attributes
        self.sentiment_pipe = None
        self.feature_extractor = None
        self.agri_anchor = None
        
        # Endpoints
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
                self.sentiment_pipe = pipeline("sentiment-analysis", model="lxyuan/distilbert-base-multilingual-cased-sentiments-student", device=-1)
                print("   ✅ Model loaded from Hub.")
                
        except Exception as e:
            print(f"   ⚠️ Could not load local model: {e}")
            self.sentiment_pipe = None

        # Initialize Feature Extraction for Content Understanding (Relevance)
        try:
            import torch
            import torch.nn.functional as F
            self.torch = torch
            self.F = F
            
            print("   🧠 Loading Feature Extractor for Content Relevance...")
            # Re-define path in this scope
            local_model_path = os.path.join(BASE_DIR, '../../models/sentiment-model')
            model_name_or_path = local_model_path if os.path.exists(local_model_path) else "lxyuan/distilbert-base-multilingual-cased-sentiments-student"
            
            self.feature_extractor = pipeline("feature-extraction", model=model_name_or_path, device=-1)
            
            # Compute Anchor Vector for "Agriculture"
            # This represents the "Concept" of Agriculture in the model's latent space
            anchor_text = "agriculture farming crops harvest wheat rice market prices farmers soil weather monsoon fertilizer pesticide government policy rural"
            anchor_feats = self.feature_extractor(anchor_text, return_tensors="pt")[0]
            self.agri_anchor = torch.mean(anchor_feats, dim=0) # Mean pooling
            
            print("   ✅ Relevance Engine Initialized (Embedding-based).")
        except Exception as e:
            print(f"   ⚠️ Feature Extractor Error: {e}")
            self.feature_extractor = None


    def _query(self, url, payload, retries=3):
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
        print(f"DEBUG: Analyzing '{text[:20]}...'")
        if not text or len(text) < 5: return None

        try:
            # 1. Relevance Check (Concept Matching Strategy)
            # Replaces Embedding check (bias issue) and Simple Keyword check (too broad).
            # Rule: Text must contain specific Agricultural Concepts (Crops, Markets) 
            # OR multiple Generic Contexts to be considered relevant.
            
            # Import Lists
            try:
                from utils.agri_keywords import (
                    AGRI_POS_WORDS, AGRI_NEG_WORDS, GENERIC_AGRI_WORDS,
                    CROP_KEYWORDS, PEST_DISEASE_KEYWORDS, INPUT_KEYWORDS,
                    POLICY_KEYWORDS, TECH_KEYWORDS, OPERATION_KEYWORDS
                )
                MARKET_TERMS = ["price", "prices", "market", "markets", "msp", "mandi", "mandis", "rate", "rates", "rupee", "dollar", "export", "import", "trade", "inflation"]
                WEATHER_TERMS = ["rain", "rains", "monsoon", "drought", "droughts", "flood", "floods", "weather", "temperature", "humid", "heatwave", "cyclone", "cyclones"]
            except ImportError:
                try:
                    from .agri_keywords import (
                         AGRI_POS_WORDS, AGRI_NEG_WORDS, GENERIC_AGRI_WORDS,
                         CROP_KEYWORDS, PEST_DISEASE_KEYWORDS, INPUT_KEYWORDS,
                         POLICY_KEYWORDS, TECH_KEYWORDS, OPERATION_KEYWORDS
                    )
                    MARKET_TERMS = ["price", "prices", "market", "markets", "msp", "mandi", "mandis", "rate", "rates", "rupee", "dollar", "export", "import", "trade", "inflation"]
                    WEATHER_TERMS = ["rain", "rains", "monsoon", "drought", "droughts", "flood", "floods", "weather", "temperature", "humid", "heatwave", "cyclone", "cyclones"]
                except ImportError:
                    GENERIC_AGRI_WORDS = ["farming", "agriculture"]
                    AGRI_POS_WORDS = ["good", "great", "excellent", "profit", "record", "bumper", "high", "boost", "happy", "opportunity", "good rain", "subsidy", "subsidies"]
                    AGRI_NEG_WORDS = ["bad", "poor", "loss", "drought", "flood", "crash", "damage", "destroy", "shortage", "anxiety", "protest", "threat", "drop", "pest", "attack", "low"]
                    CROP_KEYWORDS = ["rice", "wheat", "corn", "soybean", "soybeans", "cotton", "coffee", "sugarcane", "tomato", "onion", "potato", "paddy"]
                    PEST_DISEASE_KEYWORDS = ["locust", "locusts", "pest", "pests", "attack", "attacks", "disease", "infestation"]
                    INPUT_KEYWORDS = ["fertilizer", "fertilizers", "urea", "pesticide", "pesticides", "seed", "seeds"]
                    POLICY_KEYWORDS = ["subsidy", "subsidies", "loan", "govt", "bill"]
                    TECH_KEYWORDS = ["drone", "drones", "ai", "tech", "technology"]
                    OPERATION_KEYWORDS = ["yield", "yields", "sowing", "harvest", "harvests", "irrigation"]
                    MARKET_TERMS = ["price", "prices", "market", "markets"]
                    WEATHER_TERMS = ["rain", "rains", "flood", "floods"]

            # Compile all keywords for later use
            all_keywords = AGRI_POS_WORDS + AGRI_NEG_WORDS + GENERIC_AGRI_WORDS

            # Split Generic into Strong and Weak
            # "Agriculture", "Farming", "Farm", "Crop" are Weak (too generic, could be gaming)
            # "Harvest", "Sowing", "Yield", "Mandi", "MSP" are Strong
            truly_generic = ["agriculture", "farming", "farmers", "farm", "crop", "rural"]
            specific_generic = [w for w in GENERIC_AGRI_WORDS if w.lower() not in truly_generic]

            # Flatten Concept Lists (taking care to split phrases like "fertilizer shortage" into "fertilizer", "shortage")
            raw_concept_list = (
                CROP_KEYWORDS + MARKET_TERMS + WEATHER_TERMS + 
                PEST_DISEASE_KEYWORDS + INPUT_KEYWORDS + POLICY_KEYWORDS + 
                TECH_KEYWORDS + OPERATION_KEYWORDS + specific_generic
            )
            
            strong_concepts = set()
            for phrase in raw_concept_list:
                for word in phrase.lower().split():
                    if len(word) > 2: # Avoid tiny words like "in", "of"
                        strong_concepts.add(word)

            weak_concepts = set([w.lower() for w in truly_generic])
            
            text_lower = text.lower()
            tokens = text_lower.replace('.', ' ').replace(',', ' ').split()
            
            strong_count = sum(1 for t in tokens if t in strong_concepts)
            weak_count = sum(1 for t in tokens if t in weak_concepts)
            
            # Debug Relevance
            # print(f"DEBUG: Rel check - Strong={strong_count} ({[t for t in tokens if t in strong_concepts]}), Weak={weak_count}")

            
            is_relevant = False
            
            if strong_count >= 1:
                is_relevant = True
                reason = "Strong Context Match (Crop/Market/Weather)"
            elif weak_count >= 2:
                is_relevant = True
                reason = "Multiple Generic Contexts"
            else:
                 is_relevant = False
                 reason = "Insufficient Agricultural Context"

            if not is_relevant:
                 return {
                     "is_relevant": False,
                     "reason": reason
                 }





            # 2. Topic Categorization (Simplified)
            # Default to General since we removed the external Zero-Shot API.
            category = "General Agriculture"
            
            # Optional: Simple keyword-based topic deduction
            if any(w in text_lower for w in ["price", "market", "msp", "rupee", "dollar"]):
                category = "Market Prices"
            elif any(w in text_lower for w in ["rain", "monsoon", "drought", "flood", "weather"]):
                category = "Weather"
            elif any(w in text_lower for w in ["pest", "locust", "disease", "attack"]):
                category = "Pest & Disease"
            elif any(w in text_lower for w in ["govt", "government", "policy", "subsidy", "bill"]):
                category = "Government Policy"


            # 3. Sentiment Analysis (HYBRID: Keywords + Model)
            sent_label = "Neutral"
            sent_score = 0.0
            
            has_pos = any(w in text_lower for w in AGRI_POS_WORDS)
            has_neg = any(w in text_lower for w in AGRI_NEG_WORDS)
            
            # A. Heuristic Override
            if has_pos and not has_neg:
                sent_label = "POSITIVE" 
                sent_score = 0.95
            elif has_neg and not has_pos:
                sent_label = "NEGATIVE"
                sent_score = 0.95
            else:
                # B. Model Inference (Fallback)
                if self.sentiment_pipe:
                     # Output format: [{'label': 'positive', 'score': 0.9}]
                     result = self.sentiment_pipe(text[:512], truncation=True, top_k=1)
                     if result:
                         top = result[0]
                         sent_label = top['label']
                         sent_score = top['score']
            
            # Normalize Label
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

            # Apply Confidence Threshold (Reduce "weak" predictions if not keyword-backed)
            SENTIMENT_THRESHOLD = 0.7 
            if final_label != "Neutral" and abs(final_score) < SENTIMENT_THRESHOLD:
                 final_label = "Neutral"
                 final_score = 0.0

            # 4. Keyword Extraction (Simple Fallback)
            detected_keywords = []
            words = text.split()
            for w in words:
                clean = w.lower().strip(".,!?")
                if clean in all_keywords and len(clean) > 3:
                    detected_keywords.append(clean.capitalize())
            
            if not detected_keywords:
                detected_keywords = [category]
            else:
                detected_keywords = list(set(detected_keywords))[:5]


            return {
                "is_relevant": True,
                "category": category,
                "sentiment_class": final_label,
                "sentiment_score": round(final_score, 4),
                "confidence": round(sent_score, 4) if 'sent_score' in locals() else 0.0,
                "detected_keywords": detected_keywords
            }

        except Exception as e:
            print(f"      ⚠️ Parsing Error: {e}")
            import traceback
            traceback.print_exc()
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
             print(f"✅ RELEVANT | {res['category']} | {res['sentiment_class']} | {res['detected_keywords']}")
        else:
             print(f"❌ IRRELEVANT | {res.get('reason') if res else 'None'}")
