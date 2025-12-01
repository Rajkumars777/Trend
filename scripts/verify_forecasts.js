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
                value = value.replace(/^["'](.*)["']$/, '$1');
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    }
}
loadEnvLocal();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri_trend_dashboard';

async function verifyForecasts() {
    try {
        await mongoose.connect(URI, { dbName: 'agri_trend_dashboard' });
        console.log('✅ Connected to DB: agri_trend_dashboard');

        const Forecast = mongoose.connection.db.collection('forecasts');

        const count = await Forecast.countDocuments();
        console.log(`Total Forecasts: ${count}`);

        if (count === 0) {
            console.log('❌ No forecasts found.');
            process.exit(1);
        }

        const models = await Forecast.distinct('model');
        console.log('Models found:', models);

        if (!models.includes('LSTM')) {
            console.log('❌ LSTM forecasts missing.');
        } else {
            console.log('✅ LSTM forecasts present.');
        }

        if (!models.includes('Linear Regression')) {
            console.log('❌ Linear Regression forecasts missing.');
        } else {
            console.log('✅ Linear Regression forecasts present.');
        }

        const sample = await Forecast.findOne();
        console.log('Sample Forecast:', sample);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

verifyForecasts();
