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
        sentiment_class: { type: String }, // Add missing field
        category: {
            type: String,
            // enum: ['General', 'Machinery', 'Pest/Disease', 'Economics'], // Relax enum if needed
            default: 'General'
        },
        detected_keywords: [String],
        detected_location: String,
    },
});

// Indexes for Performance
PostSchema.index({ timestamp: -1 });
PostSchema.index({ source: 1 });
PostSchema.index({ "analysis.category": 1 });
PostSchema.index({ "analysis.sentiment_class": 1 });
PostSchema.index({ "analysis.detected_keywords": 1 });

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
    overview: {
        gdpContribution: string;
        employment: string;
        foodSecurityIndex: string;
        arableLand: string;
        policyHighlight: string;
    };
    trade: {
        exports: number;
        imports: number;
        topExport: string;
        topImport: string;
    };
    market: {
        inflation: string;
        cpi: string;
        prices: Array<{
            commodity: string;
            price: string;
            trend: string;
        }>;
    };
    social: {
        sentimentByRegion: Array<{
            region: string;
            sentiment: number;
            volume: string;
        }>;
        hashtags: string[];
    };
    last_updated: Date;
}

const CountryStatSchema: Schema = new Schema({
    country: { type: String, required: true, unique: true },
    // Deep Stats Structure
    overview: {
        gdpContribution: String,
        employment: String,
        foodSecurityIndex: String,
        arableLand: String,
        policyHighlight: String
    },
    trade: {
        exports: Number,
        imports: Number,
        topExport: String,
        topImport: String
    },
    market: {
        inflation: String,
        cpi: String,
        prices: [{
            commodity: String,
            price: String,
            trend: String
        }]
    },
    social: {
        sentimentByRegion: [{
            region: String,
            sentiment: Number,
            volume: String
        }],
        hashtags: [String]
    },
    last_updated: { type: Date, default: Date.now }
});

export function getCountryStatModel(): Model<ICountryStat> {
    return mongoose.models.CountryStat || mongoose.model<ICountryStat>('CountryStat', CountryStatSchema, 'country_stats');
}
