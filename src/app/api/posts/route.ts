import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sentiment = searchParams.get('sentiment');
    const platform = searchParams.get('platform');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const Posts = db.collection('posts');

        const query: any = {};

        // Sentiment Filter
        if (sentiment && sentiment !== 'All') {
            query['analysis.sentiment_class'] = sentiment;
        }

        // Platform Filter
        if (platform && platform !== 'All') {
            query['source'] = platform.toLowerCase();
        }

        // Date Range Filter
        if (startDate || endDate) {
            query['timestamp'] = {};
            if (startDate) query['timestamp']['$gte'] = new Date(startDate);
            if (endDate) query['timestamp']['$lte'] = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        // Execute queries in parallel
        const [posts, total, countsAgg] = await Promise.all([
            Posts.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            Posts.countDocuments(query),
            Posts.aggregate([
                { $group: { _id: "$source", count: { $sum: 1 } } }
            ]).toArray()
        ]);

        const counts: Record<string, number> = {};
        countsAgg.forEach(c => {
            if (c._id) counts[c._id] = c.count;
        });

        const transformedPosts = posts.map((post: any) => ({
            ...post,
            metrics: post.metrics || {
                upvotes: post.metadata?.score || 0,
                likes: post.metadata?.likes || 0,
                comments: post.metadata?.comments || 0,
                views: post.metadata?.views || 0
            }
        }));

        return NextResponse.json({
            posts: transformedPosts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            counts
        });
    } catch (error) {
        console.error("API Error (Posts):", error);
        return NextResponse.json({
            posts: [],
            pagination: { total: 0, page: 1, limit: 12, pages: 0 },
            counts: {}
        });
    }
}
