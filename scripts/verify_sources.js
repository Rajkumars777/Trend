const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

// Helper to load .env.local
function loadEnvLocal() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts.shift().trim();
                let value = parts.join('=').trim();
                value = value.replace(/^["'](.*)["']$/, '$1'); // Remove surrounding quotes
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    }
}
loadEnvLocal();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_trend_dashboard';

async function verifySources() {
    try {
        await mongoose.connect(URI);
        console.log('✅ Connected to DB');

        const Post = mongoose.connection.db.collection('posts');

        const sources = ['reddit', 'news', 'youtube', 'twitter'];

        console.log('\n--- Source Verification ---');
        for (const source of sources) {
            const count = await Post.countDocuments({ source: source });
            if (count > 0) {
                console.log(`✅ ${source}: ${count} records found`);
            } else {
                console.log(`❌ ${source}: No records found`);
            }
        }
        console.log('---------------------------\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

verifySources();
