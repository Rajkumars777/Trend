const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const PostSchema = new mongoose.Schema({
    reddit_id: { type: String, required: true, unique: true },
    source: { type: String, default: 'reddit' },
    url: { type: String },
    content: { type: String, required: true },
    author: { type: String, required: true },
    timestamp: { type: Date, required: true },
    metrics: {
        upvotes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
    },
    analysis: {
        sentiment_score: { type: Number, default: 0 },
        category: {
            type: String,
            default: 'General'
        },
        detected_keywords: [String],
        detected_location: String,
    },
});

async function testMongoose() {
    try {
        console.log("Connecting to URI:", MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@'));

        const opts = {
            bufferCommands: false,
            dbName: 'agri_trend_dashboard',
        };

        await mongoose.connect(MONGODB_URI, opts);
        console.log("Connected. DB Name:", mongoose.connection.db.databaseName);

        const Post = mongoose.model('Post', PostSchema, 'posts');

        const count = await Post.countDocuments();
        console.log("Post Count:", count);

        if (count > 0) {
            const doc = await Post.findOne();
            console.log("Sample Doc:", doc._id);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testMongoose();
