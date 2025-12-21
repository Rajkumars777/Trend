
import sys
import os

# Add script dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_client import AgriAIClient

def test_new_batch():
    print("🚀 Starting Batch Validation (34 New Records)...")
    
    try:
        ai = AgriAIClient()
    except Exception as e:
        print(f"❌ Failed to initialize AgriAIClient: {e}")
        return

    # 34 BRAND NEW RECORDS
    test_cases = [
        # --- WEATHER & CLIMATE (5) ---
        ("Hailstorm in Nashik damages extensive grape plantations.", "Negative"),
        ("El Nino fears recede, normal monsoon predicted by IMD.", "Positive"),
        ("Heatwave during grain filling stage affects wheat shriveling.", "Negative"),
        ("Frost alert issued for potato farmers in northern belt.", "Negative"),
        ("Timely rains help in completion of paddy transplantation.", "Positive"),

        # --- PESTS & DISEASES (5) ---
        ("Pink bollworm infestation reported in cotton belt of Punjab.", "Negative"),
        ("New bio-pesticide effective against fall armyworm.", "Positive"),
        ("Fungal outbreak threatens banana plantations in Kerala.", "Negative"),
        ("Locust swarms controlled effectively this year.", "Positive"),
        ("Whitefly attack lowers yield expectations for guar crop.", "Negative"),

        # --- MARKET & PRICES (6) ---
        ("Global sugar deficit pushes domestic prices up, millers happy.", "Positive"), # High price good for sellers/industry
        ("Onion prices crash to Rs 5/kg due to glut in market.", "Negative"),
        ("Jeera futures hit upper circuit on strong export demand.", "Positive"),
        ("Palm oil import duty hike to support domestic coconut farmers.", "Positive"), # Duty hike on import = good for domestic
        ("Lack of cold storage forces farmers to sell at distress prices.", "Negative"),
        ("Soybean prices remain range-bound with weak cues.", "Neutral"),

        # --- POLICY & GOVT (6) ---
        ("Cabinet approves hike in MSP for Rabi crops.", "Positive"),
        ("PM Fasal Bima Yojana claims settlement delayed by months.", "Negative"),
        ("Government launches new scheme for solar pumps.", "Positive"),
        ("Fertilizer subsidy slashed in the new budget.", "Negative"), # Slash subsidy = Bad
        ("Agri-infra fund disbursed for post-harvest management.", "Positive"),
        ("State government creates committee to study farm distress.", "Neutral"), # Action is neutral until result

        # --- TECHNOLOGY (4) ---
        ("Drones deployed for nano-urea spraying save labor costs.", "Positive"),
        ("Satellite imagery helps in accurate crop acreage estimation.", "Positive"),
        ("Adoption of precision farming low due to high initial cost.", "Negative"),
        ("Hydroponics farming gaining traction in urban areas.", "Positive"),

        # --- INPUTS & LOGISTICS (4) ---
        ("Shortage of DAP fertilizer reported during peak sowing.", "Negative"),
        ("Container shortage hits grape exports to Europe.", "Negative"),
        ("Good availability of certified seeds for the kharif season.", "Positive"),
        ("Power cuts disrupt irrigation schedules in rural areas.", "Negative"),

        # --- GENERAL / MIXED (4) ---
        ("Agriculture contributes 18% to India's GDP.", "Neutral"), # Fact
        ("Young generation migrating away from farming jobs.", "Negative"),
        ("Record procurement of wheat by FCI this season.", "Positive"),
        ("Despite initial delay, sowing covers normal acreage.", "Positive") # Recovery logic
    ]

    correct = 0
    total = len(test_cases)
    
    with open("batch_34_results.txt", "w", encoding="utf-8") as f:
        f.write(f"🧪 Testing {total} New Cases...\n\n")

        for text, expected in test_cases:
            result = ai.analyze(text)
            
            if not result:
                msg = f"⚠️ [NULL] '{text[:60]}...' -> Irrelevant?"
                print(msg)
                f.write(msg + "\n")
                continue
            
            if not result.get('is_relevant', False):
                 msg = f"⚠️ [IRRELEVANT] '{text[:60]}...' -> {result.get('reason')}"
                 print(msg)
                 f.write(msg + "\n")
                 f.write(f"❌ [FAIL] Expected: {expected}, Got: Irrelevant\n")
                 continue

            actual = result.get('sentiment_class', 'Unknown')
            
            if actual.lower() == expected.lower():
                msg = f"✅ [PASS] {actual} | '{text[:60]}...'"
                print(msg)
                f.write(msg + "\n")
                correct += 1
            else:
                msg = f"❌ [FAIL] Expected: {expected}, Got: {actual} | '{text[:60]}...'"
                print(msg)
                f.write(msg + "\n")

        accuracy = (correct / total) * 100
        summary = f"\n📊 Results: {correct}/{total} Correct\n🎯 Accuracy: {accuracy:.2f}%\n"
        print(summary)
        f.write(summary)

if __name__ == "__main__":
    test_new_batch()
