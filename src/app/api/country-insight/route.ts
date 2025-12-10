import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Simple Country -> Lat/Lon map (Expanded for key agricultural nations)
// Simple Country -> Lat/Lon map (Expanded for key agricultural nations)
const COUNTRY_COORDS: Record<string, { lat: number, lon: number, capitalName: string }> = {
    "India": { lat: 28.6139, lon: 77.2090, capitalName: "New Delhi" },
    "United States": { lat: 38.9072, lon: -77.0369, capitalName: "Washington D.C." }, // Fixed US key to match likely input or standard
    "United States of America": { lat: 38.9072, lon: -77.0369, capitalName: "Washington D.C." },
    "China": { lat: 39.9042, lon: 116.4074, capitalName: "Beijing" },
    "Brazil": { lat: -15.7801, lon: -47.9292, capitalName: "Brasília" },
    "Russia": { lat: 55.7558, lon: 37.6173, capitalName: "Moscow" },
    "Australia": { lat: -35.2809, lon: 149.1300, capitalName: "Canberra" },
    "Canada": { lat: 45.4215, lon: -75.6972, capitalName: "Ottawa" },
    "Argentina": { lat: -34.6037, lon: -58.3816, capitalName: "Buenos Aires" },
    "Ukraine": { lat: 50.4501, lon: 30.5234, capitalName: "Kyiv" },
    "France": { lat: 48.8566, lon: 2.3522, capitalName: "Paris" },
    "Germany": { lat: 52.5200, lon: 13.4050, capitalName: "Berlin" },
    "Indonesia": { lat: -6.2088, lon: 106.8456, capitalName: "Jakarta" },
    "Thailand": { lat: 13.7563, lon: 100.5018, capitalName: "Bangkok" },
    "United Kingdom": { lat: 51.5074, lon: -0.1278, capitalName: "London" },
    "Japan": { lat: 35.6762, lon: 139.6503, capitalName: "Tokyo" },
    "Vietnam": { lat: 21.0285, lon: 105.8542, capitalName: "Hanoi" },
    "Mexico": { lat: 19.4326, lon: -99.1332, capitalName: "Mexico City" },
    "Turkey": { lat: 39.9334, lon: 32.8597, capitalName: "Ankara" },
    "Italy": { lat: 41.9028, lon: 12.4964, capitalName: "Rome" },
    "Spain": { lat: 40.4168, lon: -3.7038, capitalName: "Madrid" }
};

const parser = new Parser();

// Keywords for Concern Analysis
const CONCERN_KEYWORDS = {
    weather: ["drought", "flood", "rain", "storm", "heatwave", "cyclone", "monsoon", "weather", "climate", "dry", "wet", "precipitation", "el nino", "la nina"],
    price: ["price", "cost", "inflation", "market", "expensive", "hike", "rate", "economy", "trade", "export", "import", "tariff", "subsidy"],
    pest: ["pest", "locust", "armyworm", "infestation", "disease", "fungus", "virus", "blight", "beetle", "worm", "attack", "outbreak"]
};

const POSITIVE_KEYWORDS = ["boost", "growth", "rise", "record", "surplus", "profit", "success", "innovate", "solution", "good", "stable", "boom", "high yield"];
const NEGATIVE_KEYWORDS = ["drop", "fall", "decline", "loss", "crisis", "shortage", "fail", "damage", "destroy", "risk", "threat", "bad", "low yield", "drought", "flood"];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!country) {
        return NextResponse.json({ error: "Country parameter is required" }, { status: 400 });
    }

    try {
        // 1. Fetch Live News (Broad Agriculture search)
        // We fetch more items to get a better statistical sample
        const newsQuery = encodeURIComponent(`Agriculture ${country}`);
        const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${newsQuery}&hl=en-US&gl=US&ceid=US:en`);

        // 2. Fetch AI/Tech Specific News
        const aiQuery = encodeURIComponent(`Agriculture Technology AI ${country}`);
        const aiFeed = await parser.parseURL(`https://news.google.com/rss/search?q=${aiQuery}&hl=en-US&gl=US&ceid=US:en`);

        // 3. Fetch Live Weather
        let weather = null;
        const coords = COUNTRY_COORDS[country] || COUNTRY_COORDS["India"]; // Fallback
        if (coords) {
            // Fetch current weather + daily forecast for max/min temps to gauge extremes
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
            weather = await weatherRes.json();
        }

        // 4. Analytics Processing
        const concernCounts = { weather: 0, price: 0, pest: 0 };
        let sentimentScore = 0; // -1 to 1
        let totalAnalyzed = 0;
        const detectedCrops = new Set<string>();
        const CROP_LIST = ["Rice", "Wheat", "Corn", "Maize", "Soybean", "Cotton", "Sugarcane", "Coffee", "Tea", "Potato", "Tomato", "Onion", "Barley", "Sorghum", "Palm Oil", "Rubber"];

        // Analyze last 30 news items (or fewer if feed is small)
        const itemsToAnalyze = feed.items.slice(0, 30);

        itemsToAnalyze.forEach(item => {
            const text = `${item.title} ${item.content || ""}`.toLowerCase();
            totalAnalyzed++;

            // Concern Detection
            if (CONCERN_KEYWORDS.weather.some(k => text.includes(k))) concernCounts.weather++;
            if (CONCERN_KEYWORDS.price.some(k => text.includes(k))) concernCounts.price++;
            if (CONCERN_KEYWORDS.pest.some(k => text.includes(k))) concernCounts.pest++;

            // Sentiment Analysis (Simple Heuristic)
            let score = 0;
            POSITIVE_KEYWORDS.forEach(k => { if (text.includes(k)) score += 1; });
            NEGATIVE_KEYWORDS.forEach(k => { if (text.includes(k)) score -= 1; });
            // Clamp individual score
            sentimentScore += Math.max(-1, Math.min(1, score));

            // Crop Detection
            CROP_LIST.forEach(crop => {
                if (text.includes(crop.toLowerCase())) detectedCrops.add(crop);
            });
        });

        // Normalize Data
        // Convert counts to a "Density" (0-100 scale) relative to sample size
        // We multiply by a factor to make it visible even with few hits
        const density = {
            weather: Math.min(100, Math.round((concernCounts.weather / totalAnalyzed) * 200)) || 0,
            price: Math.min(100, Math.round((concernCounts.price / totalAnalyzed) * 200)) || 0,
            pest: Math.min(100, Math.round((concernCounts.pest / totalAnalyzed) * 200)) || 0
        };

        // Average Sentiment (-1 to 1) -> Text
        const avgSentiment = totalAnalyzed > 0 ? sentimentScore / totalAnalyzed : 0;
        let sentimentLabel = "Neutral";
        if (avgSentiment > 0.1) sentimentLabel = "Positive";
        if (avgSentiment < -0.1) sentimentLabel = "Negative";
        if (avgSentiment < -0.4) sentimentLabel = "Critical"; // Very bad news

        // Trend Text
        const trends = [];
        if (density.weather > 40) trends.push("High Weather Impact");
        if (density.price > 40) trends.push("Market Volatility");
        if (density.pest > 20) trends.push("Pest Risks");
        if (trends.length === 0) trends.push("Stable Operations");

        const insight = feed.items[0]?.title || `No recent major headlines for ${country}.`;

        return NextResponse.json({
            country,
            sentiment: sentimentLabel,
            sentimentScore: parseFloat(avgSentiment.toFixed(2)),
            trend: trends[0],
            insight,
            crops: Array.from(detectedCrops).slice(0, 5), // Top 5 relevant crops
            aiNews: aiFeed.items.slice(0, 3).map(i => ({ title: i.title, link: i.link })),
            concerns: density, // { weather: 45, price: 12, pest: 0 }
            weather: weather ? {
                temp: weather.current_weather.temperature,
                condition: weather.current_weather.weathercode,
                dailyMin: weather.daily?.temperature_2m_min?.[0],
                dailyMax: weather.daily?.temperature_2m_max?.[0],
                precip: weather.daily?.precipitation_sum?.[0],
                capital: coords.capitalName
            } : null
        });

    } catch (error) {
        console.error("Country Insight API Error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
