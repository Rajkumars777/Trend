import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const crop = searchParams.get('crop');

    if (!country || !crop) {
        return NextResponse.json({ error: 'Country and Crop are required' }, { status: 400 });
    }

    const conn = await dbConnect();
    const db = conn.useDb('agri_trend_dashboard');
    const YieldForecast = db.collection('yield_forecasts');

    try {
        const data = await YieldForecast.findOne({ country, crop });

        if (!data) {
            return NextResponse.json({ error: 'No forecast data found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
