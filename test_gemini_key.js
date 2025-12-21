const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m);

    if (!match) {
        console.error("❌ GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    const API_KEY = match[1].trim();
    console.log(`Found API Key starting with: ${API_KEY.slice(0, 5)}...`);

    async function testGemini() {
        console.log("1. Initializing Gemini Client with key...");
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Try gemini-pro as fallback test
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        try {
            console.log("2. Sending test prompt...");
            const prompt = "Hello!";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log("SUCCESS! Gemini replied:", response.text());
        } catch (error) {
            console.error("FAILED. API Error:");
            console.error(error);
        }
    }

    testGemini();

} catch (err) {
    console.error("Error reading .env.local:", err);
}
