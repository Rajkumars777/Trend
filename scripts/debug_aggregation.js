const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugAggregation() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('agri_trend_dashboard');
        const collection = db.collection('posts');

        const count = await collection.countDocuments();
        console.log(`Total documents: ${count}`);

        const trends = await collection.aggregate([
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
        ]).toArray();

        console.log("Aggregation Results (Trends):");
        console.log(JSON.stringify(trends, null, 2));

        // Check for documents with missing fields
        const missingTimestamp = await collection.countDocuments({ timestamp: { $exists: false } });
        console.log(`Documents missing timestamp: ${missingTimestamp}`);

        const missingAnalysis = await collection.countDocuments({ "analysis.category": { $exists: false } });
        console.log(`Documents missing analysis.category: ${missingAnalysis}`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

debugAggregation();
