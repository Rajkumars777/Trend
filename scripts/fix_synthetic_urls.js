const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixSyntheticUrls() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('agri_trend_dashboard');
        const collection = db.collection('posts');

        console.log("🔍 Finding synthetic posts with placeholder URLs...");

        const cursor = collection.find({ url: "https://example.com/synthetic" });
        const count = await collection.countDocuments({ url: "https://example.com/synthetic" });
        console.log(`Found ${count} posts to update.`);

        let updated = 0;
        const bulkOps = [];

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            let newUrl = "";

            // Encode content for search query
            const query = encodeURIComponent(doc.content.substring(0, 100)); // Limit length

            if (doc.source === 'twitter') {
                newUrl = `https://twitter.com/search?q=${query}&src=typed_query`;
            } else if (doc.source === 'youtube') {
                newUrl = `https://www.youtube.com/results?search_query=${query}`;
            } else if (doc.source === 'reddit') {
                newUrl = `https://www.reddit.com/search/?q=${query}`;
            } else {
                newUrl = `https://www.google.com/search?q=${query}`;
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { url: newUrl } }
                }
            });

            if (bulkOps.length >= 1000) {
                await collection.bulkWrite(bulkOps);
                updated += bulkOps.length;
                console.log(`   Updated ${updated}/${count}`);
                bulkOps.length = 0; // Clear array
            }
        }

        if (bulkOps.length > 0) {
            await collection.bulkWrite(bulkOps);
            updated += bulkOps.length;
        }

        console.log(`✅ Successfully updated ${updated} posts.`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

fixSyntheticUrls();
