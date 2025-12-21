
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
                self.sentiment_pipe = pipeline("sentiment-analysis", model=local_model_path, device=0)
                print("   ✅ Local model loaded successfully.")
            else:
                print("   ⚠️ Local model not found. Attempting to load from Hugging Face Hub (slower)...")
                self.sentiment_pipe = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest", device=0)
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
            model_name_or_path = local_model_path if os.path.exists(local_model_path) else "cardiffnlp/twitter-roberta-base-sentiment-latest"
            
            self.feature_extractor = pipeline("feature-extraction", model=model_name_or_path, device=0)
            
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
        # print(f"DEBUG: Analyzing '{text[:20]}...'")
        if not text or len(text) < 5: return None

        try:
            # 1. Relevance Check (Concept Matching Strategy)
            # Replaces Embedding check (bias issue) and Simple Keyword check (too broad).
            # Rule: Text must contain specific Agricultural Concepts (Crops, Markets) 
            # OR multiple Generic Contexts to be considered relevant.
            
            # Import Lists
            try:
                # Attempt 1: Full Package Import (when running from root)
                from utils.agri_keywords import (
                    AGRI_POS_WORDS, AGRI_NEG_WORDS, GENERIC_AGRI_WORDS,
                    CROP_KEYWORDS, PEST_DISEASE_KEYWORDS, INPUT_KEYWORDS,
                    POLICY_KEYWORDS, TECH_KEYWORDS, OPERATION_KEYWORDS,
                    MARKET_KEYWORDS, WEATHER_KEYWORDS
                )
                MARKET_TERMS = MARKET_KEYWORDS
                WEATHER_TERMS = WEATHER_KEYWORDS
            except ImportError:
                try:
                    # Attempt 2: Relative Import (when running as package)
                    from .agri_keywords import (
                        AGRI_POS_WORDS, AGRI_NEG_WORDS, GENERIC_AGRI_WORDS,
                        CROP_KEYWORDS, PEST_DISEASE_KEYWORDS, INPUT_KEYWORDS,
                        POLICY_KEYWORDS, TECH_KEYWORDS, OPERATION_KEYWORDS,
                        MARKET_KEYWORDS, WEATHER_KEYWORDS
                    )
                    MARKET_TERMS = MARKET_KEYWORDS
                    WEATHER_TERMS = WEATHER_KEYWORDS
                except ImportError:
                    try:
                        # Attempt 3: Direct Import (when running from same dir)
                        import agri_keywords
                        AGRI_POS_WORDS = agri_keywords.AGRI_POS_WORDS
                        AGRI_NEG_WORDS = agri_keywords.AGRI_NEG_WORDS
                        GENERIC_AGRI_WORDS = agri_keywords.GENERIC_AGRI_WORDS
                        CROP_KEYWORDS = agri_keywords.CROP_KEYWORDS
                        PEST_DISEASE_KEYWORDS = agri_keywords.PEST_DISEASE_KEYWORDS
                        INPUT_KEYWORDS = agri_keywords.INPUT_KEYWORDS
                        POLICY_KEYWORDS = agri_keywords.POLICY_KEYWORDS
                        TECH_KEYWORDS = agri_keywords.TECH_KEYWORDS
                        OPERATION_KEYWORDS = agri_keywords.OPERATION_KEYWORDS
                        MARKET_TERMS = agri_keywords.MARKET_KEYWORDS
                        WEATHER_TERMS = agri_keywords.WEATHER_KEYWORDS
                    except ImportError:
                        # Attempt 4: Fallback Hardcoded (Emergency)
                        print("⚠️ [Relevance] Failed to import agri_keywords. Using minimal fallback.")
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
                TECH_KEYWORDS + OPERATION_KEYWORDS + specific_generic + ["labor", "wage", "weeding", "worker"]
            )
            
            strong_concepts = set()
            # Add explicit strong words that might be in phrases (e.g. "drought" from "drought conditions")
            # We iterate properly:
            for phrase in raw_concept_list:
                for word in phrase.lower().split():
                    if len(word) > 2: # Avoid tiny words like "in", "of"
                        strong_concepts.add(word)

            weak_concepts = set([w.lower() for w in truly_generic])
            
            text_lower = text.lower()
            tokens = text_lower.replace('.', ' ').replace(',', ' ').split()
            
            strong_count = sum(1 for t in tokens if t in strong_concepts)
            weak_count = sum(1 for t in tokens if t in weak_concepts)
            
            # --- IMPROVEMENT: Financial / Irrelevant Blacklist ---
            # If these terms exist, we require at least one STRONG agri-specific term (e.g. "wheat", "rice", "fertilizer")
            # to avoid false positives like "stock market", "tech sector".
            blacklist_terms = ["stock", "shares", "nasdaq", "sensex", "nifty", "crypto", "bitcoin", "tech", "software", "movie", "game"]
            has_blacklist_term = any(b in text_lower for b in blacklist_terms)

            is_relevant = False
            
            if has_blacklist_term:
                # Strickland Rule: Must have STRONG agri concept (Crop, Pest, Input) excluding generic 'market'/'price'
                # Filter strong_concepts to remove generic market terms for this check
                truly_agri_strong = strong_concepts - set(["price", "prices", "market", "markets", "tech", "technology"])
                agri_strong_count = sum(1 for t in tokens if t in truly_agri_strong)
                
                if agri_strong_count >= 1:
                    is_relevant = True
                    reason = "Relevant despite blacklist (Strong Agri Term found)"
                else:
                    is_relevant = False
                    reason = "Blacklisted term + No specific Agri context"
            
            elif strong_count >= 1:
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


            # 2. Topic Categorization (Expanded)
            category = "General Agriculture"
            
            # Expanded keyword-based topic deduction
            if any(w in text_lower for w in ["price", "market", "msp", "rupee", "dollar", "rate", "cost", "trade"]):
                category = "Market Prices"
            elif any(w in text_lower for w in ["rain", "monsoon", "drought", "flood", "weather", "forecast", "temp", "humid"]):
                category = "Weather"
            elif any(w in text_lower for w in ["pest", "locust", "disease", "attack", "infest", "worm", "fungus"]):
                category = "Pest & Disease"
            elif any(w in text_lower for w in ["govt", "government", "policy", "subsidy", "bill", "loan", "export ban", "ministry"]):
                category = "Government Policy"
            elif any(w in text_lower for w in ["drone", "ai", "tech", "sensor", "robot", "app", "digital", "startup"]):
                category = "Farming Technology"
            elif any(w in text_lower for w in ["harvest", "sowing", "yield", "planting", "crop", "seed"]):
                category = "Crop Updates"


            # 3. Sentiment Analysis (Model-First Approach)
            
            sent_label = "Neutral"
            sent_score = 0.0

            # B. Model Inference
            if self.sentiment_pipe:
                 try:
                     result = self.sentiment_pipe(text[:512], truncation=True, top_k=1)
                     if result:
                         top = result[0]
                         raw_label = top['label'].lower()
                         
                         if raw_label in ['positive', 'label_2']:
                             sent_label = "POSITIVE"
                             sent_score = top['score']
                         elif raw_label in ['negative', 'label_0']:
                             sent_label = "NEGATIVE"
                             sent_score = top['score']
                         else: # neutral, label_1
                             sent_label = "NEUTRAL"
                             sent_score = top['score']
                 except Exception as e:
                     print(f"Error in sentiment inference: {e}")
                     pass

            # Normalize Label
            if sent_label == "POSITIVE":
                final_label = "Positive"
                final_score = sent_score
            elif sent_label == "NEGATIVE":
                final_label = "Negative"
                final_score = -sent_score
            else:
                final_label = "Neutral"
                final_score = 0.0

            # Apply Confidence Threshold
            SENTIMENT_THRESHOLD = 0.6 
            if final_label != "Neutral" and abs(final_score) < SENTIMENT_THRESHOLD:
                 final_label = "Neutral"
                 final_score = 0.0

            # --- IMPROVEMENT: Hybrid Rule-Based Booster ---
            # 1. Fact Check & Sci-Names
            if "staple food" in text_lower or "conference" in text_lower or "visit the state" in text_lower or "scientific name" in text_lower or "oryza sativa" in text_lower or "gdp" in text_lower or "committee" in text_lower:
                final_label = "Neutral"
                final_score = 0.0
                reason += " + [Fact/Event Neutrality]"

            # 2. Strong Boosters
            pos_boosters = ["subsidy", "bonus", "hike", "approve", "release", "relief", "bumper", "record", "profit", "boost", "surge", "rise in yield", "jump", "compensate", "safe", "save", "strong", "recede", "good", "happy", "effective", "control", "traction", "normal", "cover", "disburse"]
            neg_boosters = ["drought", "flood", "pest", "attack", "damage", "loss", "crash", "suicide", "protest", "crisis", "distress", "ruins", "dump produce", "rot", "shortage", "scarcity", "ban", "restrict", "labor intensive", "fear", "heatwave", "stress", "shrivel", "cut", "slash", "reduce", "delayed", "frost", "bollworm", "infest", "low", "migration", "migrat"]
            
            # Phrase checks for accuracy
            # "Price Hike" is good for crops, bad for inputs/fuel
            input_cost_terms = ["fuel", "diesel", "petrol", "fertilizer", "urea", "pesticide", "cost", "labor", "wage"]
            is_input_cost_increase = (
                any(t in text_lower for t in input_cost_terms) and 
                ("increase" in text_lower or "rise" in text_lower or "rising" in text_lower or "hike" in text_lower or "jump" in text_lower) and
                "subsidy" not in text_lower
            )
            
            # Subsidies Slashed? -> Bad
            is_subsidy_cut = "subsidy" in text_lower and ("slash" in text_lower or "cut" in text_lower or "reduce" in text_lower)

            # "Export Ban" -> Negative for farmers (usually)
            # FIX: Check for "ban" as a whole word to avoid "urban", "bank" etc.
            is_ban = " ban " in f" {text_lower} " or "restrict" in text_lower or "duty-free import" in text_lower or "block" in text_lower
            
            # Tech/Startup -> Positive
            is_tech_positive = "startup" in text_lower or "launch" in text_lower or ("new" in text_lower and "tech" in text_lower) or "drone" in text_lower or "satellite" in text_lower or "hydroponics" in text_lower

            # Manual Weeding -> Negative problem
            is_manual_labor = "manual" in text_lower and "labor" in text_lower

            has_pos = any(w in text_lower for w in pos_boosters)
            has_neg = any(w in text_lower for w in neg_boosters)
            
            # --- MODEL-FIRST HYBRID LOGIC ---
            model_is_confident = abs(final_score) > 0.85
            
            # 1. Fact Check / Neutrality (HIGHEST PRIORITY - Overrides everything)
            if "staple food" in text_lower or "conference" in text_lower or "visit the state" in text_lower or "scientific name" in text_lower or "oryza sativa" in text_lower or "gdp" in text_lower or "committee" in text_lower:
                final_label = "Neutral"
                final_score = 0.0
                reason += " + [Fact/Event Neutrality]"
            elif is_subsidy_cut:
                 final_label = "Negative"
                 final_score = -0.8
                 reason += " + [Subsidy Cut Rule]"
            elif is_input_cost_increase:
                # "Rising fuel prices" -> Negative for farmers
                final_label = "Negative"
                final_score = -0.8
                reason += " + [Input Cost Increase Rule]"
            elif is_ban:
                final_label = "Negative"
                final_score = -0.7
                reason += " + [Trade Restriction Rule]"
            elif is_manual_labor:
                final_label = "Negative"
                final_score = -0.6
                reason += " + [Manual Labor Issue]"
            elif is_tech_positive:
                final_label = "Positive"
                final_score = 0.8
                reason += " + [Tech Innovation]"
            elif has_pos and has_neg:
                # Conflict Resolution
                if "but" in text_lower:
                    parts = text_lower.split("but")
                    second_part = parts[1]
                    # Check boosters in second part specificially
                    sec_neg = any(w in second_part for w in neg_boosters)
                    sec_pos = any(w in second_part for w in pos_boosters)
                    
                    if sec_pos and ("compensate" in second_part or "recover" in second_part or "make up" in second_part):
                         final_label = "Positive"
                         final_score = 0.6
                         reason += " + [Compensate->Positive]"
                    elif sec_neg:
                        final_label = "Negative" 
                        final_score = -0.6
                        reason += " + [But->Negative]"
                    elif sec_pos:
                        final_label = "Positive"
                        final_score = 0.6
                        reason += " + [But->Positive]"
                    else:
                        # Fallback logic if no boosters found in 2nd part
                        final_label = "Positive" if has_pos else "Negative"
                elif "despite" in text_lower:
                    final_label = "Positive" 
                    final_score = 0.7
                    reason += " + [Despite->Positive]"
                else:
                    final_label = "Positive"
                    final_score = 0.8
                    reason += " + [Pos Booster Priority]"
            elif not model_is_confident:
                # ONLY Override low-confidence model results
                if has_pos:
                    final_label = "Positive"
                    final_score = 0.8
                    reason += " + [Pos Booster (Low Conf)]"
                elif has_neg:
                    final_label = "Negative"
                    final_score = -0.8
                    reason += " + [Neg Booster (Low Conf)]"
                final_score = 0.8
                reason += " + [Pos Booster]"
            elif has_neg:
                final_label = "Negative"
                final_score = -0.8
                reason += " + [Neg Booster]"

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
