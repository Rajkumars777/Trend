import requests

class WorldBankClient:
    BASE_URL = "https://api.worldbank.org/v2" # Force HTTPS
    
    # ISO Codes for our target countries
    COUNTRY_CODES = {
        "India": "IN", "United States": "US", "Brazil": "BR", "China": "CN", 
        "Russia": "RU", "Australia": "AU", "Canada": "CA", "Argentina": "AR",
        "France": "FR", "Ukraine": "UA", "Japan": "JP", "Philippines": "PH" # Ensure JP/PH exist
    }
    
    # Indicators
    INDICATORS = {
        "gdp_share": "NV.AGR.TOTL.ZS", # Agriculture value added (% of GDP)
        "employment": "SL.AGR.EMPL.ZS", # Employment in agriculture (% of total)
        "arable_land": "AG.LND.ARBL.ZS", # Arable land (% of land area)
        "inflation": "FP.CPI.TOTL.ZG",   # Inflation, consumer prices (annual %)
        "cpi": "FP.CPI.TOTL"             # Consumer Price Index (2010 = 100)
    }

    def get_indicator(self, country_name, indicator_key, year="2022"):
        code = self.COUNTRY_CODES.get(country_name)
        if not code: return None
        
        ind_code = self.INDICATORS.get(indicator_key)
        url = f"{self.BASE_URL}/country/{code}/indicator/{ind_code}"
        
        # Retry logic for robustness
        for attempt in range(2):
            try:
                # format=json, per_page=1 to get just one
                # Try 2022 first, if None, logic elsewhere could fallback to 2021 if needed
                # But WB often has lags, so maybe fetch range?
                # Let's try fetching latest available by using "MRV" (Most Recent Value) logic if possible
                # Or just fetch a range "2020:2023" and take first non-null
                
                params = {'format': 'json', 'date': '2020:2023', 'per_page': 100} 
                resp = requests.get(url, params=params, timeout=10) # Increased timeout
                
                if resp.status_code == 200:
                    data = resp.json()
                    # WB API V2 returns [metadata, [data...]]
                    if len(data) > 1 and isinstance(data[1], list):
                        # Find first non-null value in the range
                        for entry in data[1]:
                            if entry.get('value') is not None:
                                return round(entry.get('value'), 2)
            except Exception as e:
                print(f"      ⚠️ WB API Error ({country_name}, {indicator_key}): {e}")
                pass
            
        return None

    def fetch_all_stats(self, country_name):
        return {
            "gdp_share": self.get_indicator(country_name, "gdp_share"),
            "employment": self.get_indicator(country_name, "employment"),
            "arable_land": self.get_indicator(country_name, "arable_land"),
            "inflation": self.get_indicator(country_name, "inflation"),
            "cpi": self.get_indicator(country_name, "cpi")
        }
