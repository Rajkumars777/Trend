import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import dbConnect from '../../../lib/dbConnect';
import { getCountryStatModel } from '../../../models/Schema';

// --- FALLBACK MOCK DATA (For when scraping fails) ---
const COUNTRY_DB: Record<string, any> = {
    "India": {
        overview: { gdpContribution: "18.3%", employment: "42.6%", foodSecurityIndex: "71.8 (Moderate)", arableLand: "156.4 Million Ha", policyHighlight: "MSP Hike for Kharif Crops 2024-25" },
        trade: { exports: 53.1, imports: 35.8, topExport: "Rice ($11B)", topImport: "Vegetable Oils ($14B)" },
        market: { inflation: "6.8%", cpi: "183.4", prices: [{ commodity: "Rice", price: "2200 ₹/q", trend: "+2.3%" }] },
        social: { sentimentByRegion: [{ region: "Punjab", sentiment: 0.3, volume: "High" }], hashtags: ["#FarmerProtest", "#MSP"] }
    },
    "United States": {
        overview: { gdpContribution: "5.4%", employment: "1.3%", foodSecurityIndex: "85.0 (Very High)", arableLand: "157.7 Million Ha", policyHighlight: "Farm Bill 2025" },
        trade: { exports: 178.5, imports: 195.0, topExport: "Soybeans ($32B)", topImport: "Coffee ($8B)" },
        market: { inflation: "3.2%", cpi: "308.5", prices: [{ commodity: "Corn", price: "$4.50/bu", trend: "-1.2%" }] },
        social: { sentimentByRegion: [{ region: "Midwest", sentiment: 0.5, volume: "High" }], hashtags: ["#Harvest24", "#AgTech"] }
    },
    // ... (Keep other fallbacks or reduce to save space)
};

const DEFAULT_DATA = {
    overview: { gdpContribution: "---", employment: "---", foodSecurityIndex: "---", arableLand: "---", policyHighlight: "No recent major policy data." },
    trade: { exports: 0, imports: 0, topExport: "N/A", topImport: "N/A" },
    market: { inflation: "---", cpi: "---", prices: [] },
    social: { sentimentByRegion: [], hashtags: [] }
};

// --- CACHE SYSTEM (TTL: 15 Minutes) ---
const CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

// --- SCRAPER HELPER ---
function getTradingEconomicsSlug(country: string): string {
    const map: Record<string, string> = {
        "India": "india", "United States": "united-states", "China": "china", "Brazil": "brazil", "Japan": "japan",
        "Russia": "russia", "Australia": "australia", "Canada": "canada", "Argentina": "argentina",
        "France": "france", "Germany": "germany", "United Kingdom": "united-kingdom",
        "Indonesia": "indonesia", "Thailand": "thailand", "Vietnam": "vietnam"
    };
    return map[country] || country.toLowerCase().replace(/ /g, '-');
}

async function scrapeCountryData(country: string) {
    console.log(`[Scraper] Starting for ${country}...`);
    const browser = await puppeteer.launch({
        headless: true, // "new" is deprecated, but valid in some versions. Use true.
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const slug = getTradingEconomicsSlug(country);

    // Result Object
    let result = JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep copy
    // Pre-fill with Fallback if available to ensure we have *some* data if scraping is partial
    if (COUNTRY_DB[country]) {
        result = JSON.parse(JSON.stringify(COUNTRY_DB[country]));
    }

    try {
        // 1. Scrape Trading Economics (Summary Page)
        // URL: https://tradingeconomics.com/[country]/indicators
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        const url = `https://tradingeconomics.com/${slug}/indicators`;
        console.log(`[Scraper] Navigating to ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

        // Extract Data using table selectors
        const indicators = await page.evaluate(() => {
            const data: Record<string, string> = {};
            // Trading Economics tables usually have class 'table'
            const rows = document.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const key = cells[0].innerText.trim();
                    const val = cells[1].innerText.trim();
                    data[key] = val;
                }
            });
            return data;
        });

        // Map scraped data to our schema
        if (indicators['Food Inflation']) result.market.inflation = indicators['Food Inflation'] + "%";
        if (indicators['Inflation Rate']) result.market.cpi = indicators['Consumer Price Index CPI'] || indicators['Inflation Rate'];
        if (indicators['GDP Annual Growth Rate']) result.overview.gdpContribution = indicators['GDP Annual Growth Rate'] + "% (Growth)";
        if (indicators['Unemployment Rate']) result.overview.employment = indicators['Unemployment Rate'] + "% (Unemployment)";
        if (indicators['Balance of Trade']) {
            // Heuristic: If negative, import heavy. If positive, export heavy.
            const val = parseFloat(indicators['Balance of Trade']);
            result.trade.exports = val > 0 ? val : 50; // Mock breakdown if only balance is known
            result.trade.imports = val < 0 ? Math.abs(val) : 40;
        }

        console.log(`[Scraper] Extracted indicators for ${country}:`, result.market);

    } catch (e) {
        console.error(`[Scraper] Failed to scrape TradingEconomics for ${country}:`, e);
        // Continue to other sources or return fallback
    } finally {
        await browser.close();
    }

    return result;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!country) {
        return NextResponse.json({ error: "Country parameter is required" }, { status: 400 });
    }

    try {
        await dbConnect();
        const CountryStat = getCountryStatModel();

        // Fetch from DB
        const data = await CountryStat.findOne({ country }).lean();

        // If not in DB, fallback to scraping (on-demand)
        if (!data) {
            console.log(`[API] Cache miss for ${country}, scraping now...`);
            const scrapedData = await scrapeCountryData(country);
            // Save for next time
            await CountryStat.create(scrapedData);
            return NextResponse.json(scrapedData);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(COUNTRY_DB[country] || DEFAULT_DATA);
    }
}
