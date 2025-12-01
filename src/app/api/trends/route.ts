import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getPostModel } from '@/models/Schema';

export async function GET() {
    const conn = await dbConnect();
    const db = conn.useDb('agri_trend_dashboard');
    const defaultModel = getPostModel();
    const Post = db.model('PostV3', defaultModel.schema, 'posts');

    try {
        // 1. Trends Aggregation (Time Series)
        const trends = await Post.aggregate([
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        category: "$analysis.category"
                    },
                    avg_sentiment: { $avg: "$analysis.sentiment_score" },
                    post_count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        const formattedTrends = trends.map(t => ({
            date: t._id.date,
            category: t._id.category,
            sentiment: parseFloat(t.avg_sentiment.toFixed(2)),
            count: t.post_count
        }));

        // 2. Sentiment Distribution (Pie Chart)
        const sentimentDist = await Post.aggregate([
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gt: ["$analysis.sentiment_score", 0.05] }, then: "Positive" },
                                { case: { $lt: ["$analysis.sentiment_score", -0.05] }, then: "Negative" }
                            ],
                            default: "Neutral"
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Sentiment by Platform (Bar Chart)
        const sentimentByPlatform = await Post.aggregate([
            {
                $group: {
                    _id: "$source",
                    avg_sentiment: { $avg: "$analysis.sentiment_score" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. Sentiment by Category (Bar Chart)
        const sentimentByCategory = await Post.aggregate([
            {
                $group: {
                    _id: "$analysis.category",
                    avg_sentiment: { $avg: "$analysis.sentiment_score" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Product Predictions
        const predictions = await Post.aggregate([
            {
                $match: {
                    "analysis.category": "Machinery",
                    "analysis.sentiment_score": { $gt: 0 }
                }
            },
            { $unwind: "$analysis.detected_keywords" },
            {
                $group: {
                    _id: "$analysis.detected_keywords",
                    count: { $sum: 1 },
                    avg_sentiment: { $avg: "$analysis.sentiment_score" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        const formattedPredictions = predictions.map(p => ({
            product: p._id,
            count: p.count,
            sentiment: parseFloat(p.avg_sentiment.toFixed(2))
        }));

        // 6. Recent Posts
        const recentPosts = await Post.find().sort({ timestamp: -1 }).limit(10);

        // 7. Detailed Platform Stats (for TopStatsRow)
        const platformStats = await Post.aggregate([
            {
                $group: {
                    _id: {
                        source: "$source",
                        sentiment: {
                            $switch: {
                                branches: [
                                    { case: { $gt: ["$analysis.sentiment_score", 0.05] }, then: "Positive" },
                                    { case: { $lt: ["$analysis.sentiment_score", -0.05] }, then: "Negative" }
                                ],
                                default: "Neutral"
                            }
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 7. Forecasts
        const Forecast = db.collection('forecasts');
        const forecasts = await Forecast.find().toArray();

        return NextResponse.json({
            trends: formattedTrends,
            sentimentDist: sentimentDist.map(s => ({ name: s._id, value: s.count })),
            sentimentByPlatform: sentimentByPlatform.map(s => ({ name: s._id, sentiment: parseFloat(s.avg_sentiment.toFixed(2)), count: s.count })),
            sentimentByCategory: sentimentByCategory.map(s => ({ name: s._id, sentiment: parseFloat(s.avg_sentiment.toFixed(2)), count: s.count })),
            predictions: formattedPredictions,
            recentPosts,
            forecasts,
            platformStats
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}
