import { NextResponse } from 'next/server';

const COUNTRY_COORDS: Record<string, { lat: number, lon: number }> = {
    "India": { lat: 20.5937, lon: 78.9629 },
    "United States": { lat: 37.0902, lon: -95.7129 },
    "China": { lat: 35.8617, lon: 104.1954 },
    "Brazil": { lat: -14.2350, lon: -51.9253 },
    "Russia": { lat: 61.5240, lon: 105.3188 },
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || "India";

    // Simulate API delay for realism
    await new Promise(r => setTimeout(r, 500));

    try {
        const currentYear = new Date().getFullYear();

        // Base yield varies by country
        let baseYield = 3.5;
        if (country === "United States") baseYield = 8.0; // Corn high yield
        if (country === "China") baseYield = 6.0;
        if (country === "Brazil") baseYield = 4.0;

        // Generate History (Last 5 Years)
        const history = [];
        for (let i = 5; i > 0; i--) {
            const year = currentYear - i;
            // Random fluctuation ±10%
            const fluctuation = 1 + (Math.random() * 0.2 - 0.1);
            // Tech growth 2% per year
            const growth = 1 + (0.02 * (5 - i));

            history.push({
                year,
                yield: parseFloat((baseYield * fluctuation * growth).toFixed(2))
            });
        }

        // Generate Forecast (Next 3 Years)
        const forecast = [];
        const lastYield = history[history.length - 1].yield;

        for (let i = 0; i < 3; i++) {
            const year = currentYear + i;
            // Forecast assumes steady growth + slight variability
            const predictedGrowth = 1.03; // 3% optimistic growth
            const variability = 1 + (Math.random() * 0.05 - 0.025); // Smaller variance in forecast

            const prevVal = i === 0 ? lastYield : forecast[i - 1].yield;

            forecast.push({
                year,
                yield: parseFloat((prevVal * predictedGrowth * variability).toFixed(2))
            });
        }

        return NextResponse.json({
            history,
            forecast
        });

    } catch (e) {
        return NextResponse.json({ history: [], forecast: [] });
    }
}
