import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sentiment = searchParams.get('sentiment');

    const conn = await dbConnect();
    const db = conn.useDb('agri_trend_dashboard');
    const Posts = db.collection('posts');

    try {
        const query: any = {};
        if (sentiment && sentiment !== 'All') {
            // Match sentiment class (Positive, Negative, Neutral)
            query['analysis.sentiment_class'] = sentiment;
        }

        const skip = (page - 1) * limit;

        const posts = await Posts.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await Posts.countDocuments(query);

        return NextResponse.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
