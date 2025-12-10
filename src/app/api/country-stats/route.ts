import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

const API_KEY = '1a5565ba8bc041a7b8b61321250912';

// In-memory cache to prevent hitting API rate limits with ~200 requests per reload
const weatherCache: {
    data: Record<string, any>;
    timestamp: number;
} = {
    data: {},
    timestamp: 0
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Updated keys to match GeoJSON (world-atlas 110m)
const COUNTRY_CAPITALS: Record<string, string> = {
    "Afghanistan": "Kabul", "Albania": "Tirana", "Algeria": "Algiers", "Andorra": "Andorra la Vella", "Angola": "Luanda",
    "Antigua and Barbuda": "Saint John's", "Argentina": "Buenos Aires", "Armenia": "Yerevan", "Australia": "Canberra", "Austria": "Vienna",
    "Azerbaijan": "Baku", "Bahamas": "Nassau", "Bahrain": "Manama", "Bangladesh": "Dhaka", "Barbados": "Bridgetown",
    "Belarus": "Minsk", "Belgium": "Brussels", "Belize": "Belmopan", "Benin": "Porto-Novo", "Bhutan": "Thimphu",
    "Bolivia": "Sucre", "Bosnia and Herzegovina": "Sarajevo", "Botswana": "Gaborone", "Brazil": "Brasilia", "Brunei": "Bandar Seri Begawan",
    "Bulgaria": "Sofia", "Burkina Faso": "Ouagadougou", "Burundi": "Gitega", "Cabo Verde": "Praia", "Cambodia": "Phnom Penh",
    "Cameroon": "Yaounde", "Canada": "Ottawa", "Central African Republic": "Bangui", "Chad": "N'Djamena", "Chile": "Santiago",
    "China": "Beijing", "Colombia": "Bogota", "Comoros": "Moroni", "Democratic Republic of the Congo": "Kinshasa", "Congo": "Brazzaville",
    "Costa Rica": "San Jose", "Croatia": "Zagreb", "Cuba": "Havana", "Cyprus": "Nicosia", "Czech Republic": "Prague",
    "Denmark": "Copenhagen", "Djibouti": "Djibouti", "Dominica": "Roseau", "Dominican Republic": "Santo Domingo", "Ecuador": "Quito",
    "Egypt": "Cairo", "El Salvador": "San Salvador", "Equatorial Guinea": "Malabo", "Eritrea": "Asmara", "Estonia": "Tallinn",
    "Eswatini": "Mbabane", "Ethiopia": "Addis Ababa", "Fiji": "Suva", "Finland": "Helsinki", "France": "Paris",
    "Gabon": "Libreville", "Gambia": "Banjul", "Georgia": "Tbilisi", "Germany": "Berlin", "Ghana": "Accra",
    "Greece": "Athens", "Grenada": "Saint George's", "Guatemala": "Guatemala City", "Guinea": "Conakry", "Guinea-Bissau": "Bissau",
    "Guyana": "Georgetown", "Haiti": "Port-au-Prince", "Honduras": "Tegucigalpa", "Hungary": "Budapest", "Iceland": "Reykjavik",
    "India": "New Delhi", "Indonesia": "Jakarta", "Iran": "Tehran", "Iraq": "Baghdad", "Ireland": "Dublin",
    "Israel": "Jerusalem", "Italy": "Rome", "Jamaica": "Kingston", "Japan": "Tokyo", "Jordan": "Amman",
    "Kazakhstan": "Astana", "Kenya": "Nairobi", "Kiribati": "Tarawa", "North Korea": "Pyongyang", "South Korea": "Seoul",
    "Kosovo": "Pristina", "Kuwait": "Kuwait City", "Kyrgyzstan": "Bishkek", "Laos": "Vientiane", "Latvia": "Riga",
    "Lebanon": "Beirut", "Lesotho": "Maseru", "Liberia": "Monrovia", "Libya": "Tripoli", "Liechtenstein": "Vaduz",
    "Lithuania": "Vilnius", "Luxembourg": "Luxembourg", "Madagascar": "Antananarivo", "Malawi": "Lilongwe", "Malaysia": "Kuala Lumpur",
    "Maldives": "Male", "Mali": "Bamako", "Malta": "Valletta", "Marshall Islands": "Majuro", "Mauritania": "Nouakchott",
    "Mauritius": "Port Louis", "Mexico": "Mexico City", "Micronesia": "Palikir", "Moldova": "Chisinau", "Monaco": "Monaco",
    "Mongolia": "Ulaanbaatar", "Montenegro": "Podgorica", "Morocco": "Rabat", "Mozambique": "Maputo", "Myanmar": "Naypyidaw",
    "Namibia": "Windhoek", "Nauru": "Yaren", "Nepal": "Kathmandu", "Netherlands": "Amsterdam", "New Zealand": "Wellington",
    "Nicaragua": "Managua", "Niger": "Niamey", "Nigeria": "Abuja", "North Macedonia": "Skopje", "Norway": "Oslo",
    "Oman": "Muscat", "Pakistan": "Islamabad", "Palau": "Ngerulmud", "Palestine": "Ramallah", "Panama": "Panama City",
    "Papua New Guinea": "Port Moresby", "Paraguay": "Asuncion", "Peru": "Lima", "Philippines": "Manila", "Poland": "Warsaw",
    "Portugal": "Lisbon", "Qatar": "Doha", "Romania": "Bucharest", "Russian Federation": "Moscow", "Rwanda": "Kigali",
    "Saint Kitts and Nevis": "Basseterre", "Saint Lucia": "Castries", "Saint Vincent and the Grenadines": "Kingstown", "Samoa": "Apia", "San Marino": "San Marino",
    "Sao Tome and Principe": "Sao Tome", "Saudi Arabia": "Riyadh", "Senegal": "Dakar", "Serbia": "Belgrade", "Seychelles": "Victoria",
    "Sierra Leone": "Freetown", "Singapore": "Singapore", "Slovakia": "Bratislava", "Slovenia": "Ljubljana", "Solomon Islands": "Honiara",
    "Somalia": "Mogadishu", "South Africa": "Pretoria", "South Sudan": "Juba", "Spain": "Madrid", "Sri Lanka": "Colombo",
    "Sudan": "Khartoum", "Suriname": "Paramaribo", "Sweden": "Stockholm", "Switzerland": "Bern", "Syria": "Damascus",
    "Taiwan": "Taipei", "Tajikistan": "Dushanbe", "Tanzania": "Dodoma", "Thailand": "Bangkok", "Timor-Leste": "Dili",
    "Togo": "Lome", "Tonga": "Nuku'alofa", "Trinidad and Tobago": "Port of Spain", "Tunisia": "Tunis", "Turkey": "Ankara",
    "Turkmenistan": "Ashgabat", "Tuvalu": "Funafuti", "Uganda": "Kampala", "Ukraine": "Kyiv", "United Arab Emirates": "Abu Dhabi",
    "United Kingdom": "London", "United States of America": "Washington", "Uruguay": "Montevideo", "Uzbekistan": "Tashkent", "Vanuatu": "Port Vila",
    "Vatican City": "Vatican City", "Venezuela": "Caracas", "Vietnam": "Hanoi", "Yemen": "Sanaa", "Zambia": "Lusaka",
    "Zimbabwe": "Harare"
};

function getWeatherIcon(conditionText: string, isDay: number): string {
    const text = conditionText.toLowerCase();
    if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) return 'CloudRain';
    if (text.includes('snow') || text.includes('blizzard') || text.includes('ice') || text.includes('sleet')) return 'Snow';
    if (text.includes('thunder') || text.includes('storm')) return 'CloudLightning';
    if (text.includes('cloud') || text.includes('overcast') || text.includes('mist') || text.includes('fog')) return 'Cloud';
    if (text.includes('sunny') || text.includes('clear')) return isDay ? 'Sun' : 'Cloud';
    return 'Cloud';
}

export async function GET() {
    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const CountryStats = db.collection('country_stats');

        // Fetch existing DB data
        const dbData = await CountryStats.find({}).toArray();
        const dbDataMap = dbData.reduce((acc: any, item: any) => {
            let key = item.country;
            // Handle DB entry name mismatches if DB uses short names
            if (key === "United States") key = "United States of America";
            if (key === "Russia") key = "Russian Federation";
            if (key === "Dem. Rep. Congo") key = "Democratic Republic of the Congo";
            acc[key] = item;
            return acc;
        }, {});

        // Check Cache
        const now = Date.now();
        const isCacheValid = (now - weatherCache.timestamp) < CACHE_DURATION;

        const allCountries = Object.keys(COUNTRY_CAPITALS);

        // Sim Constants
        const CROPS = ['Rice', 'Wheat', 'Corn', 'Soybean', 'Cotton', 'Coffee', 'Potato', 'Barley', 'Sugarcane', 'Tea'];
        const REASONS = [
            "Stable conditions expected.",
            "Minor pest alerts in region.",
            "Good harvest forecasts.",
            "Wait-and-see market approach.",
            "Rising input costs affecting sentiment."
        ];

        // Helper for batch processing
        async function fetchInBatches(items: string[], batchSize: number, processFn: (item: string) => Promise<any>) {
            const results = [];
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(processFn));
                results.push(...batchResults);
                // Tiny delay to be gentle
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return results;
        }

        const enrichedData = await fetchInBatches(allCountries, 5, async (countryName) => {
            const capital = COUNTRY_CAPITALS[countryName];
            const cachedItem = weatherCache.data[countryName];

            let weatherData = cachedItem?.weather;
            let agriStats = cachedItem?.agri_stats;
            let realAlerts = cachedItem?.risk_alerts;

            if (!isCacheValid || !weatherData) {
                // Fetch fresh
                try {
                    const weatherRes = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(capital)}&days=1&alerts=yes`);
                    if (weatherRes.ok) {
                        const wData = await weatherRes.json();
                        const current = wData.current;
                        const forecastDay = wData.forecast.forecastday[0].day;

                        weatherData = {
                            main: current.condition.text,
                            icon: getWeatherIcon(current.condition.text, current.is_day),
                            desc: current.condition.text,
                            temp: `${current.temp_c}°C`
                        };

                        agriStats = {
                            precipitation: forecastDay.totalprecip_mm || 0,
                            humidity: current.humidity,
                            wind_kph: current.wind_kph,
                            chance_of_rain: forecastDay.daily_chance_of_rain || 0
                        };

                        if (wData.alerts?.alert?.length > 0) {
                            realAlerts = wData.alerts.alert.map((alert: any) => ({
                                type: alert.event || "Weather Alert",
                                probability: 100, // WeatherAPI alerts are usually certain
                                severity: alert.severity || "Warning",
                                urgency: alert.urgency,
                                areas: alert.areas,
                                category: alert.category,
                                certainty: alert.certainty,
                                event: alert.event,
                                note: alert.note,
                                effective: alert.effective,
                                expires: alert.expires,
                                desc: alert.desc,
                                instruction: alert.instruction,
                                headline: alert.headline
                            })).slice(0, 1);
                        } else {
                            realAlerts = [];
                        }
                    } else {
                        // Failed request
                        weatherData = { main: 'N/A', icon: 'Cloud', desc: 'No Data', temp: 'N/A' };
                        agriStats = { precipitation: 0, humidity: 0, wind_kph: 0, chance_of_rain: 0 };
                        realAlerts = [];
                    }
                } catch (e) {
                    // console.error(`Fetch fail ${countryName}`);
                    weatherData = { main: 'N/A', icon: 'Cloud', desc: 'No Data', temp: 'N/A' };
                    agriStats = { precipitation: 0, humidity: 0, wind_kph: 0, chance_of_rain: 0 };
                    realAlerts = [];
                }
            }

            // Base Data: DB or Mock
            const dbEntry = dbDataMap[countryName];
            const randomCrop = CROPS[Math.floor(Math.random() * CROPS.length)];
            const randomReason = REASONS[Math.floor(Math.random() * REASONS.length)];

            return {
                _id: dbEntry?._id || `sim_${countryName.replace(/\s/g, '')}`,
                country: countryName,
                last_updated: dbEntry?.last_updated || new Date().toISOString(),
                market: dbEntry?.market || { prices: [] },
                overview: dbEntry?.overview || {},
                social: dbEntry?.social || {},
                trade: dbEntry?.trade || {},
                trend: dbEntry?.trend || (Math.random() > 0.5 ? 'up' : 'down'),
                heatScore: dbEntry?.heatScore || Math.floor(Math.random() * 100),
                top_crop: dbEntry?.top_crop || { name: randomCrop, percent: Math.floor(Math.random() * 50) + 10 },
                weather: weatherData,
                agri_stats: agriStats,
                risk_alerts: (dbEntry?.risk_alerts?.length ? dbEntry.risk_alerts : realAlerts),
                ai_reason: dbEntry?.ai_reason || randomReason,
                isMissing: !dbEntry && !weatherData // Flag if genuinely nothing
            };
        });

        // Update cache timestamp if we fetched
        if (!isCacheValid) {
            weatherCache.timestamp = now;
            // Store the weather bits into cache
            enrichedData.forEach((item: any) => {
                weatherCache.data[item.country] = {
                    weather: item.weather,
                    agri_stats: item.agri_stats,
                    risk_alerts: item.risk_alerts
                };
            });
        }

        return NextResponse.json(enrichedData);
    } catch (error) {
        console.error("API Error (Country Stats):", error);
        return NextResponse.json([]);
    }
}
