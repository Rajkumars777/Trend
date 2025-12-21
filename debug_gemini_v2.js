
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local");
        return;
    }
    console.log("✅ Found API Key:", apiKey.substring(0, 5) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("🔄 Testing specific model name variants...");

        // Variant 1: Explicit 'models/' prefix
        console.log("🔄 Variant 1: 'models/gemini-1.5-flash'...");
        const model1 = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        try {
            const result1 = await model1.generateContent("Hello");
            const response1 = await result1.response;
            console.log("✅ SUCCESS with 'models/gemini-1.5-flash'. Response:", response1.text());
        } catch (e) { console.log("❌ Variant 1 Failed:", e.message); }

        // Variant 2: 'gemini-1.0-pro'
        console.log("🔄 Variant 2: 'gemini-1.0-pro'...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        try {
            const result2 = await model2.generateContent("Hello");
            const response2 = await result2.response;
            console.log("✅ SUCCESS with 'gemini-1.0-pro'. Response:", response2.text());
        } catch (e) { console.log("❌ Variant 2 Failed:", e.message); }

        // Variant 3: 'gemini-1.5-flash' (standard)
        console.log("🔄 Variant 3: 'gemini-1.5-flash'...");
        const model3 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const result3 = await model3.generateContent("Hello");
            const response3 = await result3.response;
            console.log("✅ SUCCESS with 'gemini-1.5-flash'. Response:", response3.text());
        } catch (e) { console.log("❌ Variant 3 Failed:", e.message); }

    } catch (error) {
        console.error("❌ API Detailed Error:", error);
    }
}

testGemini();
