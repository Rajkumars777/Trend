const { GoogleGenerativeAI } = require("@google/generative-ai");

// The exact key you provided
const KEY = "AIzaSyCPIBeLy-5_w3XkCPV9Cqy7QeQKmK7Pb00";

async function verify() {
    console.log(`Testing API Key: ${KEY.slice(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(KEY);

    try {
        console.log("Attempt 1: gemini-1.5-flash");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log("✅ SUCCESS with gemini-1.5-flash! Response:", response.text());
        return;
    } catch (error) {
        console.log("⚠️ Failed with gemini-1.5-flash. Error:", error.message);
    }

    try {
        console.log("Attempt 2: gemini-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log("✅ SUCCESS with gemini-pro! Response:", response.text());
    } catch (error) {
        console.log("❌ FAILED with gemini-pro. Error:", error.message);
    }
}

verify();
