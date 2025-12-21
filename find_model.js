
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function findWorkingModel() {
    console.log("🔍 Hunting for a working model...");
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of candidates) {
        console.log(`\n👉 Testing: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅✅✅ SUCCESS! '${modelName}' is WORKING! Response: ${response.text()}`);
            return; // Stop at first success
        } catch (error) {
            let msg = error.message;
            if (msg.includes("404")) msg = "404 Not Found";
            if (msg.includes("429")) msg = "429 Rate Limit";
            console.log(`❌ Failed (${modelName}): ${msg}`);
        }
    }
    console.log("\n❌❌❌ NO WORKING MODELS FOUND.");
}

findWorkingModel();
