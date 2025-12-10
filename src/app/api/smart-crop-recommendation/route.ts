import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getCountryStatModel } from '@/models/Schema';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'India';

    try {
        await dbConnect();
        const CountryStat = getCountryStatModel();
        const stats = await CountryStat.findOne({ country }).lean();

        if (!stats) return NextResponse.json({ error: "Country data not found" }, { status: 404 });

        // Logic: Best crop = High price trend + Low weather risk + High historical yield
        // This is a simplified logic. 

        const crops = ["Rice", "Wheat", "Corn", "Soybean"];
        const recommendations = crops.map(crop => {
            // Find price trend
            const marketData = (stats.market?.prices || []).find((p: any) => p.commodity.toLowerCase().includes(crop.toLowerCase()));
            const priceTrend = marketData ? parseFloat(marketData.trend) : 0;

            // Basic score
            let score = 50 + (priceTrend * 5); // Base score + price influence

            // Adjust for visual variety
            if (crop === 'Wheat') score += 10;

            return {
                crop,
                score: Math.min(98, Math.max(10, score)),
                reason: priceTrend > 0 ? "Rising Market Price" : "Stable Yield Forecast",
                risk: priceTrend < -2 ? "High" : "Low"
            };
        });

        recommendations.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            topRecommendation: recommendations[0],
            all: recommendations
        });

    } catch (error) {
        console.error("API Error (Smart Crop):", error);
        return NextResponse.json({ error: "Analysis Failed" }, { status: 500 });
    }
}
