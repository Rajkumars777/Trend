
require('dotenv').config({ path: '.env.local' });

console.log("Environment Variables in .env.local:");
const fs = require('fs');
const path = require('path');

try {
    const envConfig = require('dotenv').parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        console.log(`- ${k}`);
    }
} catch (e) {
    console.error("Could not read .env.local:", e.message);
}
