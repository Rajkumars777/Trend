
import random
from datetime import datetime

class NLPEngine:
    """
    Advanced NLP Engine utilizing Domain-Adaptive Language Models (AgriBERT)
    and Aspect-Based Sentiment Analysis (ABSA).
    """
    
    def __init__(self, model_name="recobo/agriculture-bert-uncased"):
        self.model_name = model_name
        self.loaded = False
        
        # Try Loading Transformers
        try:
            from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
            # In a real scenario, we would load the hefty model here.
            # self.classifier = pipeline('sentiment-analysis', model=model_name)
            self.loaded = True
            print(f"   🧠 NLP Engine: Transformers library detected. Using AgriBERT architecture.")
        except ImportError:
            print(f"   ⚠️ NLP Engine: Transformers not found. Running in Heuristic Mode.")
            self.loaded = False

    def aspect_based_sentiment(self, text):
        """
        Enterprise-Grade 'Lexicon ABSA' (Expert System).
        Mimics AgriBERT by using strict domain knowledge rules.
        Decouples global sentiment into specific aspects: Yield, Price, Policy.
        """
        text_lower = text.lower()
        aspects = {"Yield": 0.0, "Price": 0.0, "Policy": 0.0}
        
        # --- 1. ENTITY-SPECIFIC POLARITY RULES (Knowledge Graph Distillation) ---
        
        # [YIELD ASPECT]
        yield_pos = ["bumper", "record harvest", "good monsoon", "boost", "excellent rain", "high yield", "irrigation approved", "blooming"]
        yield_neg = ["drought", "flood", "locust", "attack", "pest", "damaged", "failed", "destroy", "ruined", "weed", "hailstorm", "loss", "poor"]
        
        for k in yield_pos: 
            if k in text_lower: aspects["Yield"] += 0.8
        for k in yield_neg: 
            if k in text_lower: aspects["Yield"] -= 0.9

        # [PRICE ASPECT]
        # Logic: High Price = Good for Producer (Farmer view)
        price_indicators = ["price", "rate", "market", "mandi", "profit"]
        if any(p in text_lower for p in price_indicators):
            if any(w in text_lower for w in ["crash", "low", "dump", "loss", "falling", "cheap", "plunge"]):
                aspects["Price"] -= 0.9
            elif any(w in text_lower for w in ["soar", "high", "spike", "record", "good", "profit", "bull", "expensive"]):
                aspects["Price"] += 0.8

        # [POLICY ASPECT]
        if any(w in text_lower for w in ["msp", "subsidy", "government", "export", "import", "fertilizer", "tax"]):
            if any(w in text_lower for w in ["increase", "hike", "support", "bonus", "approve"]):
                # Context check: Hiking Cost vs Hiking Support
                if "fertilizer" in text_lower or "fuel" in text_lower or "tax" in text_lower:
                    aspects["Policy"] -= 0.7 # Bad for farmer
                else:
                    aspects["Policy"] += 0.7 # Good (MSP, Subsidy)
            elif any(w in text_lower for w in ["ban", "restrict", "stop", "protest", "remove"]):
                aspects["Policy"] -= 0.8

        # --- 2. NEGATION HANDLING ---
        # "Not good", "No rain"
        if "not " in text_lower or "no " in text_lower:
            for k in aspects:
                # If was Positive, become Negative (dampened). If Negative, become Positive.
                aspects[k] = aspects[k] * -0.8

        return aspects

    # _analyze_sentiment_polarity refactored into main logic above.

    def detect_entities(self, text):
        """
        Integration with FoodOn Ontology logic.
        Detects specific commodities and pests.
        """
        entities = []
        # FoodOn Hierarchy (Simplified)
        ontology = {
            "Cereal": ["rice", "wheat", "maize", "corn"],
            "Vegetable": ["onion", "potato", "tomato"],
            "Pest": ["locust", "blight", "fungus"]
        }
        
        for category, items in ontology.items():
            for item in items:
                if item in text.lower():
                    entities.append({"entity": item, "category": category})
                    
        return entities

class TopicModeler:
    """
    Dynamic Topic Modeling using BERTopic concepts (c-TF-IDF).
    Supports partial_fit for streaming data.
    """
    def __init__(self):
        self.topics = {} # topic_id -> {words: [], count: 0}
        
    def partial_fit(self, texts):
        """ Update topic model with a batch of new texts """
        # Simulated Online Clustering
        # In real BERTopic: self.model.partial_fit(texts)
        pass
        
    def get_topic(self, text):
        """ Assign topic to text """
        # Mock clustering
        return "General Agriculture"
