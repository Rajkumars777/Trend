
import os
import sys
import numpy as np
import pandas as pd
from sklearn.metrics import (
    f1_score, 
    accuracy_score, 
    classification_report, 
    confusion_matrix, 
    matthews_corrcoef, 
    cohen_kappa_score,
    balanced_accuracy_score
)

# Add script dir to path
# Add script dir to path (Parent directory 'scripts/')
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from utils.ai_client import AgriAIClient

def evaluate_comprehensive():
    print("🔬 RUNNING COMPREHENSIVE MODEL EVALUATION...")
    ai = AgriAIClient()
    
    # 21-Sample Synthetic Test Data (Same consistency)
    test_data = [
        # Positive
        ("Rice production in Punjab has reached record highs this season due to good rains.", "Positive"),
        ("Farmers are happy with the new MSP prices announced for wheat.", "Positive"),
        ("New irrigation technology has boosted soybean yields by 20%.", "Positive"),
        ("Export ban lift is a great opportunity for Indian onion farmers.", "Positive"),
        ("Excellent weather conditions forecast for the harvest in Madhya Pradesh.", "Positive"),
        ("Government subsidies on fertilizer have significantly reduced costs.", "Positive"),
        ("Bumper crop expected for cotton this year.", "Positive"),
        ("Tech adoption in farming is profitable.", "Positive"),

        # Negative
        ("Locust attack destroys hectares of bajra fields in Rajasthan.", "Negative"),
        ("Heavy rains caused massive flooding, damaging the paddy crops.", "Negative"),
        ("Farmers protest against low market prices for tomatoes.", "Negative"),
        ("Drought conditions are threatening the upcoming sowing season.", "Negative"),
        ("Pest infestation is widespread in the sugarcane belt.", "Negative"),
        ("Fertilizer shortage is causing anxiety among small farmers.", "Negative"),
        ("Wheat prices crashed today at the local mandi.", "Negative"),
        ("Poor monsoon will lead to lower yields.", "Negative"),

        # Neutral
        ("The government released the agricultural census data today.", "Neutral"),
        ("Wheat is sown in the Rabi season.", "Neutral"),
        ("The conference on sustainable farming starts tomorrow.", "Neutral"),
        ("Prices of vegetables vary by region.", "Neutral"),
        ("The Ministry of Agriculture is located in New Delhi.", "Neutral"),
    ]

    y_true = []
    y_pred = []
    
    print(f"\n🧪 Testing {len(test_data)} Samples...\n")

    for text, label in test_data:
        res = ai.analyze(text)
        pred = "Neutral"
        if res and res['is_relevant']:
            pred = res.get('sentiment_class', "Neutral")
        
        y_true.append(label)
        y_pred.append(pred)

    print("="*60)
    print("📊 1. CLASSIFICATION REPORT")
    print("="*60)
    labels = ["Positive", "Negative", "Neutral"]
    print(classification_report(y_true, y_pred, labels=labels, zero_division=0))

    print("="*60)
    print("🧮 2. ADVANCED METRICS")
    print("="*60)
    
    acc = accuracy_score(y_true, y_pred)
    f1_weighted = f1_score(y_true, y_pred, average='weighted')
    mcc = matthews_corrcoef(y_true, y_pred)
    kappa = cohen_kappa_score(y_true, y_pred)
    bal_acc = balanced_accuracy_score(y_true, y_pred)
    
    print(f"✅ Accuracy (Raw):              {acc:.4f}  (1.0 is perfect)")
    print(f"✅ Balanced Accuracy:           {bal_acc:.4f}  (Avg recall per class)")
    print(f"✅ Weighted F1 Score:           {f1_weighted:.4f}  (Harmonic mean of P/R)")
    print(f"✅ Matthews Corr. Coeff (MCC):  {mcc:.4f}  (+1 is perfect prediction)")
    print(f"✅ Cohen's Kappa:               {kappa:.4f}  (Agreement vs Chance)")
    
    print("\n" + "="*60)
    print("🧩 3. CONFUSION MATRIX")
    print("="*60)
    print("True \\ Pred | Neg  | Neu  | Pos")
    print("------------|------|------|------")
    
    cm = confusion_matrix(y_true, y_pred, labels=["Negative", "Neutral", "Positive"])
    
    # Simple ASCII Print
    row_labels = ["Negative", "Neutral ", "Positive"]
    for i, row in enumerate(cm):
        print(f"{row_labels[i]}    | {row[0]:<4} | {row[1]:<4} | {row[2]:<4}")
        
    print("-" * 30)

if __name__ == "__main__":
    evaluate_comprehensive()
