
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report
import sys
import os

# Add script dir to path (Parent directory 'scripts/')
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from advanced_analytics.relevance_gate import RelevanceGate
from advanced_analytics.nlp_engine import NLPEngine

def run_evaluation():
    print("🧪 Starting Model Evaluation (Accuracy & F1 Score)...")
    
    # 1. Initialize Models
    gate = RelevanceGate()
    nlp = NLPEngine()
    
    # 2. Golden Dataset (Ground Truth)
    # Fields: Text, Is_Relevant (0/1), Sentiment_Label (-1=Neg, 0=Neu, 1=Pos)
    golden_data = [
        # --- POSITIVE AGRICULTURAL ---
        ("Bumper wheat harvest expected in Punjab this year", 1, 1),
        ("Excellent monsoon rains will boost kharif sowing", 1, 1),
        ("Government increases MSP for rice, farmers happy", 1, 1),
        ("Onion prices are high, good profit for farmers", 1, 1),
        ("New irrigation canal project approved", 1, 1),
        
        # --- NEGATIVE AGRICULTURAL ---
        ("Locust attack destroys hectares of crops in Rajasthan", 1, -1),
        ("Tomato prices crashed to 2 rupees, farmers dumping produce on road", 1, -1),
        ("Severe drought warning issued for Maharashtra", 1, -1),
        ("High fertilizer costs are killing our profits", 1, -1),
        ("Untimely rain damaged the standing wheat crop", 1, -1),
        
        # --- NOISE / IRRELEVANT (The "Context" Challenge) ---
        ("I need to farm more karma to post on this sub", 0, 0),
        ("My server farm is overcrowding causing lag", 0, 0),
        ("Playing Farming Simulator 22 all night", 0, 0),
        ("The yield on these corporate bonds is surprisingly high", 0, 0),
        ("Looking for a team to farm XP in Minecraft", 0, 0),
        ("CPU render farm is overheating", 0, 0),
        ("He bought the farm in that movie scene", 0, 0), # Idiom
        
        # --- AMBIGUOUS / HARD ---
        ("The weed in my garden is annoying", 1, -1), # Technically agri/botany
        ("Bull market in stocks today", 0, 0), # Finance
        ("Cows are grazing in the field", 1, 0), # Neutral agri
    ]
    
    df = pd.DataFrame(golden_data, columns=["text", "true_relevant", "true_sentiment"])
    
    # 3. Run Inference
    pred_relevant = []
    pred_sentiment = []
    
    print(f"   📝 Processing {len(df)} labelled samples...")
    for _, row in df.iterrows():
        text = row['text']
        
        # Relevance Prediction
        is_rel = gate.is_relevant(text)
        pred_relevant.append(1 if is_rel else 0)
        
        # Sentiment Prediction (Only if relevant, else 0)
        if is_rel:
            aspects = nlp.aspect_based_sentiment(text)
            # Simple voting polarity for global sentiment
            score = sum(aspects.values())
            if score > 0.1: lbl = 1
            elif score < -0.1: lbl = -1
            else: lbl = 0
        else:
            lbl = 0
        pred_sentiment.append(lbl)
        
    # 4. Calculate Relevance Metrics (Binary Classification)
    print("\n📊 RELEVANCE GATE PERFORMANCE")
    print("============================")
    acc_gate = accuracy_score(df['true_relevant'], pred_relevant)
    f1_gate = f1_score(df['true_relevant'], pred_relevant)
    prec_gate = precision_score(df['true_relevant'], pred_relevant)
    rec_gate = recall_score(df['true_relevant'], pred_relevant)
    
    print(f"Accuracy:  {round(acc_gate * 100, 2)}%")
    print(f"F1 Score:  {round(f1_gate, 4)}")
    print(f"Precision: {round(prec_gate, 4)}")
    print(f"Recall:    {round(rec_gate, 4)}")
    
    # 5. Calculate Sentiment Metrics (Multiclass Classification)
    # ... (existing code) ...
    
    # 6. EVALUATE ENTERPRISE MODULES
    print("\n📊 ENTERPRISE FORECASTING & UNCERTAINTY")
    print("=======================================")
    
    from advanced_analytics.forecasting_engine import ForecastingEngine
    forecaster = ForecastingEngine()
    
    # 6A. Conformal Prediction Coverage Test
    # We simulate 100 price points and check how many fall inside the interval
    hits = 0
    total_tests = 50
    print(f"   🧪 Testing Conformal Coverage (N={total_tests})...")
    
    import random
    for _ in range(total_tests):
        true_price = 2500 + random.uniform(-100, 100)
        # Model predicts roughly the center
        pred_point = 2500 + random.uniform(-20, 20) 
        
        # Get Interval
        interval = forecaster.explain_forecast_conformal(pred_point, confidence=0.9)
        low = interval['lower_bound']
        high = interval['upper_bound']
        
        if low <= true_price <= high:
            hits += 1
            
    coverage = (hits / total_tests) * 100
    print(f"Expected Confidence: 90%")
    print(f"Actual Coverage:     {coverage}%")
    if coverage >= 85:
        print("Verdict: ✅ Well Calibrated.")
    else:
        print("Verdict: ⚠️ Under-confident (Intervals too narrow).")
        
    # 6B. Active Learning Uncertainty Test
    print("\n📊 ACTIVE LEARNING GATEKEEPER")
    print("=============================")
    ambiguous_samples = [
        "I am farming yields in Stardew Valley",
        "My server farm has high latency",
        "The yield is terrible this season" # Real
    ]
    
    print("   Testing Uncertainty Scores (Target: 0.4 - 0.6 for ambiguous):")
    for samp in ambiguous_samples:
        score = gate.get_uncertainty_score(samp)
        status = "UNCERTAIN (Review)" if 0.4 <= score <= 0.6 else "CONFIDENT"
        print(f"   - '{samp[:25]}...': Score {score} -> {status}")

if __name__ == "__main__":
    run_evaluation()
