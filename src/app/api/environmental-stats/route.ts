import { NextResponse } from 'next/server';

const COUNTRY_COORDS: Record<string, { lat: number, lon: number }> = {
    "India": { lat: 20.5937, lon: 78.9629 },
    "United States": { lat: 37.0902, lon: -95.7129 },
    "China": { lat: 35.8617, lon: 104.1954 },
    "Brazil": { lat: -14.2350, lon: -51.9253 },
    "Russia": { lat: 61.5240, lon: 105.3188 },
    "Australia": { lat: -25.2744, lon: 133.7751 },
    "Canada": { lat: 56.1304, lon: -106.3468 },
    "Argentina": { lat: -38.4161, lon: -63.6167 },
    "Ukraine": { lat: 48.3794, lon: 31.1656 },
    "France": { lat: 46.2276, lon: 2.2137 },
    "Germany": { lat: 51.1657, lon: 10.4515 },
    "Indonesia": { lat: -0.7893, lon: 113.9213 },
    "Thailand": { lat: 15.8700, lon: 100.9925 },
    "United Kingdom": { lat: 55.3781, lon: -3.4360 },
    "Japan": { lat: 36.2048, lon: 138.2529 }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || "India";

    // Default to India if not found, or handle error
    const coords = COUNTRY_COORDS[country] || COUNTRY_COORDS["India"];

    try {
        // Calculate dates: Last 5 full years
        const endYear = new Date().getFullYear() - 1;
        const startYear = endYear - 4;
        const startDate = `${startYear}-01-01`;
        const endDate = `${endYear}-12-31`;

        // Fetch Historical Weather (Annual aggregation done manually vs daily)
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,rain_sum&timezone=auto`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.daily) throw new Error("No weather data found");

        const daily = data.daily;
        const yearsData: Record<number, { tempSum: number, rainSum: number, count: number }> = {};

        // Aggregate daily to annual
        daily.time.forEach((dateStr: string, i: number) => {
            const year = parseInt(dateStr.split('-')[0]);
            if (!yearsData[year]) yearsData[year] = { tempSum: 0, rainSum: 0, count: 0 };

            yearsData[year].tempSum += daily.temperature_2m_mean[i] || 0;
            yearsData[year].rainSum += daily.rain_sum[i] || 0;
            yearsData[year].count++;
        });

        // Optimize Yield Logic (Mocked Correlation)
        // Crop yield is best at "moderate" values. Extremes reduce it.
        const OPTIMAL_TEMP = 24; // C
        const OPTIMAL_RAIN = 1200; // mm

        const result = Object.keys(yearsData).map(yearStr => {
            const year = parseInt(yearStr);
            const stats = yearsData[year];
            const avgTemp = stats.tempSum / stats.count;
            const totalRain = stats.rainSum; // Sum of daily rain = annual rain

            // Yield Simulation Formula (Bell curve-ish)
            // 1. Temp penalty: deviation from 24C
            const tempDiff = Math.abs(avgTemp - OPTIMAL_TEMP);
            const tempFactor = Math.max(0, 1 - (tempDiff * 0.1)); // 10% penalty per degree off

            // 2. Rain penalty: deviation from 1200mm (normalized)
            const rainDiff = Math.abs(totalRain - OPTIMAL_RAIN);
            const rainFactor = Math.max(0, 1 - (rainDiff / 2000));

            // Base yield ~4.0 t/ha
            let simulatedYield = 4.0 * tempFactor * rainFactor;
            // Add some noise/tech growth
            simulatedYield += (year - 2020) * 0.1; // +0.1 t/ha per year due to tech

            return {
                year,
                temp: parseFloat(avgTemp.toFixed(1)),
                rain: Math.round(totalRain),
                yield: parseFloat(simulatedYield.toFixed(2))
            };
        });

        return NextResponse.json(result);

    } catch (e) {
        console.error("Env Stats Error:", e);
        return NextResponse.json([]);
    }
}
