
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verifyGemini25() {
    console.log("🚀 Starting verification for 'gemini-2.5-flash'...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    });

    try {
        const prompt = "Current Date: " + new Date().toLocaleDateString() + ". Hello, are you online?";
        console.log("📤 Sending prompt:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ SUCCESS! Model responded:");
        console.log("---------------------------------------------------");
        console.log(text);
        console.log("---------------------------------------------------");
    } catch (error) {
        console.error("❌ FAILED:", error.message);
        if (error.response) {
            console.error("Details:", await error.response.json());
        }
    }
}

verifyGemini25();
