const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testGeminiModels() {
    const key = process.env.GEMINI_API_KEY || "AIzaSyCPIBeLy-5_w3XkCPV9Cqy7QeQKmK7Pb00";
    console.log(`🔑 Testing Gemini Key: ${key ? key.slice(0, 10) + '...' : 'NONE'}`);

    const genAI = new GoogleGenerativeAI(key);

    // List of models to test
    const modelsToTest = [
        "gemini-2.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash",
        "gemini-pro"
    ];

    console.log("🚀 Starting Model Availability Test...");

    for (const modelName of modelsToTest) {
        console.log(`\n-----------------------------------`);
        console.log(`🤖 Testing Model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(`   Response: ${response.text().slice(0, 50)}...`);
            return; // Exit on first success to save time/quota
        } catch (error) {
            console.log(`❌ FAILED with ${modelName}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Reason: ${error.response.data?.error?.message || error.message}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
    }
    console.log(`\n-----------------------------------`);
    console.log("❌ All models failed.");
}

testGeminiModels();
