import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const Posts = db.collection('posts');

        // Aggregate posts by date (last 30 days)
        const pipeline = [
            {
                $match: {
                    timestamp: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } as any }
        ];

        const stats = await Posts.aggregate(pipeline).toArray();

        // New: Get Pipeline Health
        const Runs = db.collection('pipeline_runs');
        const totalRuns = await Runs.countDocuments({});
        const recentFailures = await Runs.countDocuments({
            status: "FAILED",
            start_time: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        // Calculate Success Rate (Last 50 runs)
        const lastRuns = await Runs.find({}, { projection: { status: 1 } }).sort({ _id: -1 }).limit(50).toArray();
        const successCount = lastRuns.filter(r => r.status === "SUCCESS").length;
        const successRate = lastRuns.length > 0 ? (successCount / lastRuns.length) * 100 : 100;

        const formattedStats = stats.map(stat => ({
            date: stat._id,
            count: stat.count
        }));

        // Fill in missing dates with 0
        const result = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const existing = formattedStats.find(s => s.date === dateStr);
            result.push({
                date: dateStr,
                count: existing ? existing.count : 0
            });
        }

        return NextResponse.json({
            historical: result,
            pipeline: {
                totalRuns,
                recentFailures,
                successRate: Math.round(successRate * 10) / 10
            }
        });
    } catch (error) {
        console.error("API Error (System Stats):", error);
        return NextResponse.json({ historical: [], pipeline: {} });
    }
}
