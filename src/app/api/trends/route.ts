import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getPostModel } from '@/models/Schema';

export async function GET() {
    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const defaultModel = getPostModel();
        const Post = db.model('PostV3', defaultModel.schema, 'posts');

        // Helper: Get recent date range
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const CROP_KEYWORDS = ["wheat", "corn", "rice", "soybean", "cotton", "coffee", "barley", "sugarcane", "potato", "tomato"];

        // Execute independent raw aggregations in parallel
        const [
            rawTrends,
            rawSentimentDist,
            rawTopCrop,
            rawRecentSentiment,
            rawTopicTimeline,
            rawInfluencers,
            rawWordCloud,
            recentPosts,
            rawDailyTrend,
            rawSentimentByPlatform, // 10
            rawSentimentByCategory  // 11
        ] = await Promise.all([
            // 1. Trends
            Post.aggregate([
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
            ]),

            // 2. Sentiment Dist
            Post.aggregate([
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
            ]),

            // 3. Top Crop
            Post.aggregate([
                { $unwind: "$analysis.detected_keywords" },
                { $match: { "analysis.detected_keywords": { $in: CROP_KEYWORDS } } },
                { $group: { _id: "$analysis.detected_keywords", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]),

            // 4. Forecast Index
            Post.aggregate([
                { $match: { timestamp: { $gte: yesterday } } },
                { $group: { _id: null, avg: { $avg: "$analysis.sentiment_score" } } }
            ]),

            // 5. Topic Timeline
            Post.aggregate([
                { $match: { timestamp: { $gte: sevenDaysAgo } } },
                { $unwind: "$analysis.detected_keywords" },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                            topic: "$analysis.detected_keywords"
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]),

            // 6. Influencers
            Post.aggregate([
                {
                    $group: {
                        _id: "$author",
                        count: { $sum: 1 },
                        avg_sentiment: { $avg: "$analysis.sentiment_score" },
                        platform: { $first: "$source" },
                        last_post: { $max: "$timestamp" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),

            // 7. Word Cloud
            Post.aggregate([
                { $unwind: "$analysis.detected_keywords" },
                { $group: { _id: "$analysis.detected_keywords", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]),

            // 8. Recent Posts
            Post.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .select('content source timestamp url author analysis')
                .lean(),

            // 9. Daily Trend
            Post.aggregate([
                { $match: { timestamp: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        sentiment: { $avg: "$analysis.sentiment_score" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // 10. Sentiment By Platform (NEW)
            Post.aggregate([
                {
                    $group: {
                        _id: "$source",
                        avg_sentiment: { $avg: "$analysis.sentiment_score" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),

            // 11. Sentiment By Category (NEW)
            Post.aggregate([
                {
                    $group: {
                        _id: "$analysis.category",
                        avg_sentiment: { $avg: "$analysis.sentiment_score" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ])
        ]);

        // Process Results
        const formattedTrends = rawTrends.map((t: any) => ({
            date: t._id.date,
            category: t._id.category,
            sentiment: parseFloat((t.avg_sentiment || 0).toFixed(2)),
            count: t.post_count
        }));

        const sentimentDist = rawSentimentDist.map((item: any) => ({
            name: item._id,
            value: item.count
        }));

        const topCrop = rawTopCrop.length > 0 ? rawTopCrop[0]._id : "Mixed";

        const currentSentiment = rawRecentSentiment.length > 0 ? rawRecentSentiment[0].avg : 0;
        const forecastIndex = currentSentiment >= 0.05 ? "Bullish" : currentSentiment <= -0.05 ? "Bearish" : "Stable";
        const forecastDirection = currentSentiment > 0 ? "up" : "down";

        const formattedTopicTimeline = rawTopicTimeline.map((t: any) => ({
            date: t._id.date,
            topic: t._id.topic,
            count: t.count
        }));

        const influencers = rawInfluencers;

        const wordCloud = rawWordCloud.map((item: any) => ({
            text: item._id,
            value: item.count
        }));

        const dailyTrend = rawDailyTrend;

        const sentimentByPlatform = rawSentimentByPlatform.map((item: any) => ({
            name: item._id || 'Unknown',
            sentiment: parseFloat((item.avg_sentiment || 0).toFixed(2)),
            count: item.count
        }));

        const sentimentByCategory = rawSentimentByCategory.map((item: any) => ({
            name: item._id || 'Uncategorized',
            sentiment: parseFloat((item.avg_sentiment || 0).toFixed(2)),
            count: item.count
        }));

        // Generate Predictions based on trends
        const predictionMap = new Map();
        formattedTrends
            .filter((t: any) => Math.abs(t.sentiment) > 0.2)
            .forEach((t: any) => {
                if (!predictionMap.has(t.category)) {
                    predictionMap.set(t.category, {
                        product: t.category,
                        count: t.count,
                        sentiment: t.sentiment,
                        action: t.sentiment > 0 ? "Buy / Long" : "Sell / Short",
                        confidence: `${Math.min(95, 70 + Math.abs(t.sentiment) * 100)}%`,
                        reasoning: `Strong ${t.sentiment > 0 ? 'positive' : 'negative'} sentiment detected in social signals.`
                    });
                } else {
                    const existing = predictionMap.get(t.category);
                    existing.count += t.count;
                }
            });

        const predictions = Array.from(predictionMap.values());

        // Fallback if no trends found
        if (predictions.length === 0) {
            predictions.push({
                product: "Wheat",
                action: "Hold",
                confidence: "80%",
                reasoning: "Market sentiment is neutral. Accumulate on dips.",
                sentiment: 0,
                count: 0
            });
        }

        return NextResponse.json({
            trends: formattedTrends,
            sentimentDist: sentimentDist,
            sentimentByPlatform,
            sentimentByCategory,
            topCrop,
            forecastIndex,
            forecastDirection,
            topicTimeline: formattedTopicTimeline,
            dailyTrend: dailyTrend.map((d: any) => ({ date: d._id, value: d.sentiment })),
            recentPosts,
            predictions,
            influencers: influencers.map((i: any) => {
                let profileUrl = "#";
                if (i.platform === 'twitter') profileUrl = `https://twitter.com/${i._id}`;
                else if (i.platform === 'reddit') profileUrl = `https://www.reddit.com/user/${i._id}`;
                else if (i.platform === 'youtube') profileUrl = `https://www.youtube.com/user/${i._id}`;

                return {
                    name: i._id || 'Unknown',
                    handle: i._id ? `@${i._id.replace(/\s+/g, '')}` : '@unknown',
                    platform: i.platform,
                    reach: `${(i.count * 1.5).toFixed(1)}K`,
                    sentiment: i.avg_sentiment > 0.05 ? 'Positive' : i.avg_sentiment < -0.05 ? 'Negative' : 'Neutral',
                    engagement: Math.min(100, Math.round(Math.random() * 40 + 60)),
                    profileUrl
                };
            }),
            wordCloud: wordCloud
        });
    } catch (error) {
        console.error("API Error (Trends):", error);
        return NextResponse.json({
            trends: [], sentimentDist: [], topCrop: "N/A", forecastIndex: "Stable",
            topicTimeline: [], influencers: [], wordCloud: [], recentPosts: [], dailyTrend: [],
            predictions: [],
            sentimentByPlatform: [],
            sentimentByCategory: [],
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}
