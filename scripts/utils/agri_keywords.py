
# 1. GENERAL AGRICULTURE KEYWORDS (VERY HIGH VOLUME)
# 1. GENERAL AGRICULTURE KEYWORDS (VERY HIGH VOLUME)
GENERAL_KEYWORDS = [
    "agriculture", "farming", "farmers", "farm life", "rural", "agri news",
    "agri update", "harvest", "crop yield", "cultivation", "food production",
    "agri market", "sustainable farming", "organic farming", "precision agriculture",
    "agritech", "agricultural crisis", "food security", "agribusiness", "horticulture",
    "livestock management", "dairy farming", "poultry farming", "aquaculture"
]

# 2. CROP-SPECIFIC KEYWORDS (STAPLES & CASH CROPS)
CROP_KEYWORDS = [
    "Rice farming", "paddy cultivation", "rice yield", "rice price", "basmati rice",
    "Wheat farming", "wheat harvest", "wheat price", "wheat varieties",
    "Maize cultivation", "corn farming", "corn price", "maize yield",
    "Sugarcane farming", "sugar prices", "ethanol production",
    "Cotton farming", "bt cotton", "cotton price", "cotton pests",
    "Soybean farming", "soybean prices", "oilseeds", "mustard farming",
    "Potato farming", "onion prices", "tomato prices", "vegetable cultivation",
    "Coffee plantation", "tea garden", "rubber plantation", "spices farming"
]

# 3. WEATHER & CLIMATE
WEATHER_KEYWORDS = [
    "monsoon forecast", "rainfall deficit", "drought conditions", "flood damage crops",
    "heatwave agriculture", "unseasonal rain", "hailstorm crop damage",
    "climate change agriculture", "el nino impact", "la nina impact", "frost damage"
]

# 4. PESTS, DISEASES & PROTECTION
PEST_DISEASE_KEYWORDS = [
    "locust attack", "fall armyworm", "pink bollworm", "whitefly control",
    "fungal diseases", "bacterial blight", "crop protection", "pesticide resistance",
    "integrated pest management", "bio-pesticides", "weed control"
]

# 5. MARKET, ECONOMY & POLICY
MARKET_KEYWORDS = [
    "mandi prices", "APMC market", "MSP rates", "minimum support price",
    "farm export ban", "agri commodities", "food inflation", "fertilizer subsidy",
    "crop insurance", "PM Fasal Bima Yojana", "agricultural loan waiver",
    "farmer protests", "farm laws", "agriculture budget"
]

# --- NEW: POLICY KEYWORDS (For AI Client Compatibility) ---
POLICY_KEYWORDS = [
    "subsidy", "subsidies", "loan", "govt", "government", "bill", "act",
    "scheme", "ministry", "policy", "export ban", "import duty"
]

# 6. TECHNOLOGY & MODERN FARMING
TECH_KEYWORDS = [
    "agritech startups", "drone spraying", "agricultural drones", "smart irrigation",
    "IoT in agriculture", "satellite imagery farming", "soil health card",
    "vertical farming", "hydroponics", "aquaponics", "regenerative agriculture",
    "carbon farming", "precision planting", "farm mechanization", "electric tractors"
]

# 7. FARM INPUTS
INPUT_KEYWORDS = [
    "urea shortage", "DAP fertilizer price", "nano urea", "organic fertilizer",
    "hybrid seeds", "GM crops", "seed availability", "fodder shortage",
    "diesel price", "petrol price", "fuel cost"
]

# --- NEW: OPERATION KEYWORDS (For AI Client Compatibility) ---
OPERATION_KEYWORDS = [
    "yield", "yields", "sowing", "planting", "harvest", "harvesting", 
    "irrigation", "ploughing", "threshing"
]

# Combine all for broad searches
# For scrapers, we will use this master list
ALL_KEYWORDS = (
    GENERAL_KEYWORDS + CROP_KEYWORDS + WEATHER_KEYWORDS + 
    PEST_DISEASE_KEYWORDS + MARKET_KEYWORDS + TECH_KEYWORDS + INPUT_KEYWORDS +
    POLICY_KEYWORDS + OPERATION_KEYWORDS
)

# --- CONSTANTS MOVED FROM fetch_agri_data.py ---

# Country Coordinates for Weather API (Capital Cities)
COUNTRY_COORDS = {
    "India": {"lat": 28.61, "lon": 77.20}, # New Delhi
    "United States": {"lat": 38.90, "lon": -77.03}, # Washington DC
    "Brazil": {"lat": -15.78, "lon": -47.92}, # Brasilia
    "China": {"lat": 39.90, "lon": 116.40}, # Beijing
    "Russia": {"lat": 55.75, "lon": 37.61}, # Moscow
    "Australia": {"lat": -35.28, "lon": 149.13}, # Canberra
    "Canada": {"lat": 45.42, "lon": -75.69}, # Ottawa
    "Argentina": {"lat": -34.60, "lon": -58.38}, # Buenos Aires
    "France": {"lat": 48.85, "lon": 2.35}, # Paris
    "Ukraine": {"lat": 50.45, "lon": 30.52} # Kyiv
}

# Crop Tickers (Futures)
CROP_TICKERS = {
    "Rice": "ZR=F",
    "Wheat": "ZW=F",
    "Corn": "ZC=F",
    "Soybean": "ZS=F",
    "Cotton": "CT=F",
    "Coffee": "KC=F"
}

# 10. SENTIMENT LEXICONS (For Hybrid AI)
AGRI_POS_WORDS = [
    "record", "bumper", "high", "boost", "profit", "happy", "opportunity", 
    "excellent", "good rain", "subsidy", "subsidies"
]
AGRI_NEG_WORDS = [
    "destroy", "damage", "loss", "crash", "low", "drought", "flood", 
    "pest", "attack", "shortage", "anxiety", "protest", "poor", "threat", "drop"
]
GENERIC_AGRI_WORDS = ["agriculture", "farm", "crop", "harvest", "sowing", "yield", "mandi", "msp"]
