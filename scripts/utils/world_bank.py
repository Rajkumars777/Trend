import requests

class WorldBankClient:
    BASE_URL = "http://api.worldbank.org/v2"
    
    # ISO Codes for our target countries
    COUNTRY_CODES = {
        "India": "IN", "United States": "US", "Brazil": "BR", "China": "CN", 
        "Russia": "RU", "Australia": "AU", "Canada": "CA", "Argentina": "AR",
        "France": "FR", "Ukraine": "UA"
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
        
        try:
            # format=json, per_page=1 to get just one
            params = {'format': 'json', 'date': year, 'per_page': 1}
            # Short timeout to fail fast
            resp = requests.get(url, params=params, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                if len(data) > 1 and data[1]:
                    val = data[1][0].get('value')
                    return round(val, 2) if val is not None else None
        except Exception:
            # Silent fail for individual indicators to keep pipeline moving
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
