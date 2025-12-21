
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verifyGemini20() {
    console.log("🚀 Verifying 'gemini-2.0-flash'...");

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        const result = await model.generateContent("Hello 2.0");
        const response = await result.response;
        console.log("✅ SUCCESS with 'gemini-2.0-flash'. Response:", response.text());
    } catch (error) {
        console.error("❌ FAILED:", error.message);
    }
}

verifyGemini20();
