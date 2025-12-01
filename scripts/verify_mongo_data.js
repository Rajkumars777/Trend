const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifyData() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('agri_trend_dashboard');
        const collection = db.collection('posts');

        const count = await collection.countDocuments();
        console.log(`Total documents in 'posts' collection: ${count}`);

        if (count > 0) {
            const sample = await collection.findOne();
            console.log("Sample document:", JSON.stringify(sample, null, 2));
        } else {
            console.log("No documents found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

verifyData();
