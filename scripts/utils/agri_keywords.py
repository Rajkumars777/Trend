
# 1. GENERAL AGRICULTURE KEYWORDS (VERY HIGH VOLUME)
GENERAL_KEYWORDS = [
    "agriculture", "farming", "farmers", "farm life", "rural", "agri news",
    "agri update", "harvest", "crop yield", "cultivation", "food production",
    "agri market", "sustainable farming", "organic farming", "precision agriculture",
    "agritech", "agricultural crisis", "food security"
]

# 2. CROP-SPECIFIC KEYWORDS
CROP_KEYWORDS = [
    "Rice", "rice farming", "paddy cultivation", "rice yield", "rice price", "paddy farmers",
    "Wheat", "wheat farming", "wheat price", "wheat yield", "heat stress wheat",
    "Maize", "corn", "maize farming", "corn cultivation", "maize price",
    "Sugarcane", "sugarcane farmers", "cane price", "sugarcane yield",
    "Cotton", "cotton farming", "cotton price", "bollworm", "pink bollworm attack",
    "Tomato", "tomato price", "Onion", "onion farming", "Potato", "potato cultivation",
    "vegetable market price"
]

# 3. WEATHER-RELATED KEYWORDS
WEATHER_KEYWORDS = [
    "monsoon", "rainfall shortage", "drought", "flood", "cyclone", "heatwave",
    "unseasonal rain", "climate impact farming", "weather impact crops",
    "soil moisture", "el nino farming", "la nina farming"
]

# 4. PEST & DISEASE KEYWORDS
PEST_DISEASE_KEYWORDS = [
    "pest outbreak", "locust attack", "fall armyworm", "bollworm", "crop disease",
    "fungal infection crops", "pest infestation", "plant disease outbreak"
]

# 5. PRICE & MARKET KEYWORDS
MARKET_KEYWORDS = [
    "crop price", "mandi prices", "MSP", "agricultural market", "produce selling price",
    "farm income", "vegetable price hike", "inflation food", "market rate today"
]

# 6. FARM INPUTS
INPUT_KEYWORDS = [
    "fertilizer shortage", "urea shortage", "DAP shortage", "NPK fertilizer", "fertilizer price",
    "seed quality", "hybrid seeds", "pesticide shortage", "pesticide price", "insecticide"
]

# 7. GOVERNMENT POLICY
POLICY_KEYWORDS = [
    "MSP policy", "PM Kisan", "agriculture subsidy", "farm bill", "government scheme farmers",
    "farmer protest", "loan waiver", "minimum support price"
]

# 8. TECHNOLOGY
TECH_KEYWORDS = [
    "agritech", "drone farming", "digital agriculture", "satellite farming",
    "precision farming", "IoT in agriculture", "smart irrigation",
    "vertical farming", "hydroponics", "AI in agriculture", "machine learning farming"
]

# 9. FARMING OPERATIONS
OPERATION_KEYWORDS = [
    "irrigation problem", "water scarcity", "soil erosion", "crop failure",
    "yield loss", "farm labour shortage", "tractor farming", "harvesting issues"
]



# HASHTAGS (for Twitter/Social Media specifically)
HASHTAGS = [
    "agriculture", "farming", "farmers", "agrinews", "agritech", "organicfarming",
    "monsoon", "heatwave", "drought", "floodalert",
    "ricefarmers", "cottonfarmers", "wheatfarmers",
    "mandiprice", "cropprice", "foodinflation",
    "dronesinagriculture", "precisionfarming"
]

# Combine all for broad searches or random selection
ALL_KEYWORDS = (
    GENERAL_KEYWORDS + CROP_KEYWORDS + WEATHER_KEYWORDS + 
    PEST_DISEASE_KEYWORDS + MARKET_KEYWORDS + INPUT_KEYWORDS + 
    POLICY_KEYWORDS + TECH_KEYWORDS + OPERATION_KEYWORDS
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
