
import sys
import os

# Add script dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_client import AgriAIClient

def test_sentiment_accuracy():
    print("🚀 Starting Sentiment Analysis Accuracy Check...")
    
    try:
        ai = AgriAIClient()
    except Exception as e:
        print(f"❌ Failed to initialize AgriAIClient: {e}")
        return

    test_cases = [
        # --- BATCH 1: STANDARD CASES ---
        ("Bumper harvest expected for wheat this year in Punjab.", "Positive"),
        ("Government increases subsidy for urea and fertilizers.", "Positive"),
        ("Good monsoon rains bring relief to drought-hit farmers.", "Positive"),
        ("Record breaking cotton yield reported in Gujarat.", "Positive"),
        ("Exports of non-basmati rice surge, bringing profits.", "Positive"),
        ("Farmers are happy with the new MSP rates.", "Positive"),
        ("New irrigation project will boost crop production.", "Positive"),
        
        ("Locust attack destroys acres of standing crops.", "Negative"),
        ("Severe drought causes distress among farmers in Vidarbha.", "Negative"),
        ("Tomato prices crash to Rs 2 per kg, farmers dump produce.", "Negative"),
        ("Unseasonal rains damage ready-to-harvest wheat crop.", "Negative"),
        ("Rising fuel prices increase cost of cultivation.", "Negative"),
        ("Pest infestation ruins the entire cotton harvest.", "Negative"),
        ("Farmers protest against the new farm laws.", "Negative"),

        ("Agriculture minister to visit the state tomorrow.", "Neutral"),
        ("Wheat sowing has started in the northern states.", "Neutral"),
        ("Market remains closed on Sunday.", "Neutral"),
        ("Farmers are using new technology for soil testing.", "Positive"),
        ("The conference on sustainable farming was held today.", "Neutral"),
        ("Rice is a staple food for half the world's population.", "Neutral"),
        ("Changes in sowing patterns observed this season.", "Neutral"),

        # --- BATCH 2: CHALLENGING / NUANCED CASES ---
        
        # Policy & Trade (Export bans are usually negative for trade/farmers)
        ("Government bans onion exports to control local prices.", "Negative"),
        ("India allows duty-free import of soybean oil.", "Negative"), # Bad for domestic soy farmers
        ("Centre approves interest subvention on crop loans.", "Positive"),

        # Market Volatility vs Input Costs
        ("Diesel prices hike hits tractor operations hard.", "Negative"), # Cost increase
        ("Potato prices jump 30% due to supply shortage.", "Positive"), # High price = Good for farmer revenue (usually)

        # Mixed Signals (Conflict Resolution)
        ("Harvest is good but lack of storage is causing rot.", "Negative"), # Rot/Loss outweighs harvest
        ("Despite the floods, sugarcane crop remains safe.", "Positive"), # 'Safe' overrides 'Flood' context? or Neutral? Let's expect Positive/Neutral. Safe -> Positive.
        ("Yields are down, but high prices compensate the loss.", "Positive"), # 'Compensate'/'High prices' -> Positive sentiment overall? This is tricky. Let's aim for Positive.

        # Tech & Future
        ("Startup launches AI-powered weed remover.", "Positive"), # Tech solution
        ("Manual weeding is labor intensive and costly.", "Negative"), # Problem statement

        # Irrelevant / Borderline (Should be filtered or Neutral)
        # "Stock market crashes due to weak global cues." -> Should be IRRELEVANT (Filtered by Blacklist)
        # We can't test IRRELEVANT here easily without breaking the loop logic, but let's test a Borderline Neutral
        ("The scientific name of rice is Oryza sativa.", "Neutral"), # Scientific fact

        # --- BATCH 3: UNSEEN DYNAMIC VALIDATION (Synonyms) ---
        ("Petrol costs are surging, hurting small farmers.", "Negative"), # Synonyms: Petrol (Diesel), Surging (Hikes), Hurting
        ("New app launched to help track soil health.", "Positive"), # Synonyms: App (Tech), Launched (Startup)
        ("Government restricts export of sugar.", "Negative"), # Synonyms: Restricts (Bans)
        ("Output is low, yet strong market rates make up for it.", "Positive") # Logic: Low output < Strong Rates (Compensate logic variation)
    ]

    correct = 0
    total = len(test_cases)
    
    with open("sentiment_results.txt", "w", encoding="utf-8") as f:
        f.write(f"🧪 Testing {total} cases...\n\n")

        for text, expected in test_cases:
            result = ai.analyze(text)
            
            if not result:
                msg = f"⚠️ [NULL] '{text[:50]}...' -> No Result returned (Irrelevant?)"
                print(msg)
                f.write(msg + "\n")
                continue
                
            if not result.get('is_relevant', False):
                 msg = f"⚠️ [IRRELEVANT] '{text[:50]}...' -> Reason: {result.get('reason')}"
                 print(msg)
                 f.write(msg + "\n")
                 f.write(f"❌ [FAIL] Expected: {expected}, Got: Irrelevant\n")
                 continue

            actual = result.get('sentiment_class', 'Unknown')
            
            # Simplify comparison (case insensitive)
            if actual.lower() == expected.lower():
                msg = f"✅ [PASS] {actual} | '{text[:50]}...'"
                print(msg)
                f.write(msg + "\n")
                correct += 1
            else:
                msg = f"❌ [FAIL] Expected: {expected}, Got: {actual} | '{text[:50]}...'"
                print(msg)
                f.write(msg + "\n")

        accuracy = (correct / total) * 100
        summary = f"\n📊 Results: {correct}/{total} Correct\n🎯 Accuracy: {accuracy:.2f}%\n"
        print(summary)
        f.write(summary)

if __name__ == "__main__":
    test_sentiment_accuracy()
