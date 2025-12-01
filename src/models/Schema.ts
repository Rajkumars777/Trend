import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Interfaces ---

export interface IPost extends Document {
    reddit_id: string;
    source: string; // 'reddit', 'news', 'youtube'
    url: string;
    content: string;
    author: string;
    timestamp: Date;
    metrics: {
        upvotes: number;
        comments: number;
    };
    analysis: {
        sentiment_score: number;
        category: 'General' | 'Machinery' | 'Pest/Disease' | 'Economics';
        detected_keywords: string[];
        detected_location?: string;
    };
}

export interface ITrend extends Document {
    date: string; // YYYY-MM-DD
    category: string;
    avg_sentiment: number;
    post_count: number;
    top_keywords: Array<{ word: string; count: number }>;
}

// --- Schemas ---

const PostSchema: Schema = new Schema({
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
            enum: ['General', 'Machinery', 'Pest/Disease', 'Economics'],
            default: 'General'
        },
        detected_keywords: [String],
        detected_location: String,
    },
});

const TrendSchema: Schema = new Schema({
    date: { type: String, required: true },
    category: { type: String, required: true },
    avg_sentiment: { type: Number, required: true },
    post_count: { type: Number, required: true },
    top_keywords: [{
        word: String,
        count: Number
    }]
});

// --- Models ---
// --- Models ---
// Prevent overwriting models during hot reload
export function getPostModel(): Model<IPost> {
    return mongoose.models.PostV2 || mongoose.model<IPost>('PostV2', PostSchema, 'posts');
}

export function getTrendModel(): Model<ITrend> {
    return mongoose.models.Trend || mongoose.model<ITrend>('Trend', TrendSchema);
}

// --- Country Stats ---

export interface ICountryStat extends Document {
    country: string;
    yield_growth: Array<{ year: string; val: number }>;
    comparison: Array<{ name: string; val: number }>;
    top_crops: string[];
    sentiment: string;
    alert: string;
    last_updated: Date;
}

const CountryStatSchema: Schema = new Schema({
    country: { type: String, required: true, unique: true },
    yield_growth: [{ year: String, val: Number }],
    comparison: [{ name: String, val: Number }],
    top_crops: [String],
    sentiment: String,
    alert: String,
    last_updated: { type: Date, default: Date.now }
});

export function getCountryStatModel(): Model<ICountryStat> {
    return mongoose.models.CountryStat || mongoose.model<ICountryStat>('CountryStat', CountryStatSchema, 'country_stats');
}
