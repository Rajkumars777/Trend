import fs from 'fs';
import path from 'path';
import dbConnect from './dbConnect';
import { getPostModel } from '@/models/Schema';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'posts.json');

export async function fetchAndProcessPosts() {
    const conn = await dbConnect();
    const db = conn.useDb('agri_trend_dashboard');
    const defaultModel = getPostModel();
    const Post = db.model('PostV3', defaultModel.schema, 'posts');

    console.log("📂 Reading data from JSON file...");

    try {
        if (!fs.existsSync(DATA_FILE)) {
            throw new Error("Data file not found. Please run the python script first.");
        }

        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const rawPosts = JSON.parse(fileContent);

        let newCount = 0;

        for (const p of rawPosts) {
            // 1. Check Deduplication
            const exists = await Post.findOne({ reddit_id: p.reddit_id });
            if (exists) continue;

            // 2. Save
            await Post.create({
                reddit_id: p.reddit_id,
                source: p.source || 'reddit',
                url: p.url,
                content: p.content,
                author: p.author,
                timestamp: new Date(p.timestamp),
                metrics: p.metrics,
                analysis: p.analysis
            });
            newCount++;
        }

        return { status: 'success', new_posts: newCount, source: 'python_json' };

    } catch (error) {
        console.error("Error syncing data:", error);
        return { status: 'error', message: 'Failed to read JSON data' };
    }
}
