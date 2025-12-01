import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getCountryStatModel } from '@/models/Schema';

export async function GET() {
    await dbConnect();
    try {
        const CountryStat = getCountryStatModel();
        const stats = await CountryStat.find({});

        // Transform array to object keyed by country name for easier frontend lookup
        const countryData: Record<string, any> = {};
        stats.forEach((stat: any) => {
            countryData[stat.country] = {
                yield_growth: stat.yield_growth,
                comparison: stat.comparison,
                top_crops: stat.top_crops,
                sentiment: stat.sentiment,
                alert: stat.alert
            };
        });

        return NextResponse.json(countryData);
    } catch (error) {
        console.error("Error fetching map data:", error);
        return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 });
    }
}
