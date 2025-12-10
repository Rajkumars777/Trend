
import os
import sys

# Add script dir to path to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.ai_client import AgriAIClient

def test_bias():
    ai = AgriAIClient()
    
    test_cases = [
        "Farmers are harvesting wheat in Punjab.", # Neutral/Positive?
        "The government announced a new subsidy for fertilizer.", # Positive
        "Tomato prices have stabilized after a month of fluctuation.", # Neutral/Positive
        "Heavy rains might affect the cotton crop next week.", # Negative (legitimately)
        "New tractor technology is helping reduce labor costs.", # Positive
        "There is a meeting about agricultural policies tomorrow.", # Neutral
        "Pestisde usage has increased by 5% this year.", # Neutral/Negative?
        "Organic farming is gaining popularity among smallholders.", # Positive
        "The market is open from 9 AM to 5 PM.", # Neutral
        "Wheat prices are dropping dangerously low." # Negative
    ]

    with open("bias_results.txt", "w", encoding="utf-8") as f:
        f.write(f"{'Text':<60} | {'Predicted':<10} | {'Score'}\n")
        f.write("-" * 90 + "\n")
        
        for text in test_cases:
            res = ai.analyze(text)
            if res:
                 if res.get('is_relevant'):
                     f.write(f"{text:<60} | {res['sentiment_class']:<10} | {res['sentiment_score']:.4f}\n")
                 else:
                     f.write(f"{text:<60} | {'IRRELEVANT':<10} | -\n")
            else:
                 f.write(f"{text:<60} | {'FAILED':<10} | -\n")
    print("Results written to bias_results.txt")

if __name__ == "__main__":
    test_bias()
