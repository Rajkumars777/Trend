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

async function verifyYieldForecasts() {
    try {
        await mongoose.connect(URI, { dbName: 'agri_trend_dashboard' });
        console.log('✅ Connected to DB: agri_trend_dashboard');

        const YieldForecast = mongoose.connection.db.collection('yield_forecasts');

        const count = await YieldForecast.countDocuments();
        console.log(`Total Yield Forecasts: ${count}`);

        if (count === 0) {
            console.log('❌ No yield forecasts found.');
            process.exit(1);
        }

        const sample = await YieldForecast.findOne({ country: 'India', crop: 'Rice' });
        if (!sample) {
            console.log('❌ Missing forecast for India/Rice');
        } else {
            console.log('✅ Found forecast for India/Rice');
            console.log('History length:', sample.history.length);
            console.log('Forecast length:', sample.forecast.length);
            console.log('Sample Forecast Data:', sample.forecast);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

verifyYieldForecasts();
