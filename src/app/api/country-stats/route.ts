import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
    const conn = await dbConnect();
    const db = conn.useDb('agri_trend_dashboard');
    const CountryStats = db.collection('country_stats');

    try {
        const data = await CountryStats.find({}).toArray();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
