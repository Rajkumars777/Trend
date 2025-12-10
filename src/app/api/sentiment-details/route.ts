import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getPostModel } from '@/models/Schema';

export async function GET() {
    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const defaultModel = getPostModel();
        const Post = db.model('PostV3', defaultModel.schema, 'posts');

        // Platforms to analyze
        const platforms = ['twitter', 'reddit', 'youtube', 'news'];
        const results: any = {};

        // Helper: Get recent date range for trend
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        for (const platform of platforms) {
            // 1. Platform Stats (Volume, Engagement, Sentiment Breakdown)
            const stats = await Post.aggregate([
                { $match: { source: platform } },
                {
                    $group: {
                        _id: null,
                        totalVolume: { $sum: 1 },
                        totalEngagement: { $sum: { $add: ["$metrics.upvotes", "$metrics.comments"] } },
                        avgSentiment: { $avg: "$analysis.sentiment_score" },
                        positive: {
                            $sum: { $cond: [{ $gt: ["$analysis.sentiment_score", 0.05] }, 1, 0] }
                        },
                        negative: {
                            $sum: { $cond: [{ $lt: ["$analysis.sentiment_score", -0.05] }, 1, 0] }
                        },
                        neutral: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ["$analysis.sentiment_score", -0.05] },
                                            { $lte: ["$analysis.sentiment_score", 0.05] }
                                        ]
                                    }, 1, 0
                                ]
                            }
                        }
                    }
                }
            ]);

            // 2. Top Authors
            const topAuthors = await Post.aggregate([
                { $match: { source: platform } },
                {
                    $group: {
                        _id: "$author",
                        count: { $sum: 1 },
                        engagement: { $sum: { $add: ["$metrics.upvotes", "$metrics.comments"] } }
                    }
                },
                { $sort: { engagement: -1 } },
                { $limit: 3 }
            ]);

            // 3. Keywords/Hashtags
            const keywords = await Post.aggregate([
                { $match: { source: platform } },
                { $unwind: "$analysis.detected_keywords" },
                {
                    $group: {
                        _id: "$analysis.detected_keywords",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            const pStats = stats[0] || { totalVolume: 0, totalEngagement: 0, avgSentiment: 0, positive: 0, negative: 0, neutral: 0 };

            // Calculate %
            const total = pStats.totalVolume || 1;
            const posPct = Math.round((pStats.positive / total) * 100);
            const negPct = Math.round((pStats.negative / total) * 100);
            const neuPct = Math.round((pStats.neutral / total) * 100);

            results[platform] = {
                sentimentBreakdown: { positive: posPct, neutral: neuPct, negative: negPct },
                totalVolume: pStats.totalVolume,
                engagementFactor: Math.round(pStats.totalEngagement / (pStats.totalVolume || 1)), // Avg per post
                topAuthors: topAuthors.map(a => ({ name: a._id, reach: a.engagement })),
                hashtags: keywords.map(k => ({ text: k._id, value: k.count }))
            };
        }

        // 4. Engagement Trend (Last 7 Days, grouped by Platform)
        const engagementTrend = await Post.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        source: "$source"
                    },
                    engagement: { $sum: { $add: ["$metrics.upvotes", "$metrics.comments"] } }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // Transform trend data for recharts (date as key, platforms as values)
        const trendMap = new Map();
        engagementTrend.forEach(item => {
            const date = item._id.date;
            if (!trendMap.has(date)) trendMap.set(date, { date });
            const entry = trendMap.get(date);
            entry[item._id.source] = item.engagement;
        });

        const formattedTrend = Array.from(trendMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date));

        return NextResponse.json({
            platforms: results,
            engagementTrend: formattedTrend
        });

    } catch (error) {
        console.error("API Error (Sentiment Details):", error);
        return NextResponse.json({
            platforms: {},
            engagementTrend: []
        });
    }
}
