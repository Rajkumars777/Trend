const { GoogleGenerativeAI } = require("@google/generative-ai");

// Using the key provided by the user
const genAI = new GoogleGenerativeAI("AIzaSyCPIBeLy-5_w3XkCPV9Cqy7QeQKmK7Pb00");

async function listModels() {
    try {
        // Note: getGenerativeModelFactory is not a function on the instance in newer SDKs, 
        // usually it's accessed via the model manager or just by trying known models.
        // However, let's try to access the model list if the SDK exposes it.
        // Actually, the node SDK doesn't always expose listModels easily on the client instance directly in all versions.
        // But let's try the standard approach for the current SDK version.

        // If the SDK version installed doesn't support listModels directly, we might need a direct fetch.
        // Let's try to fetch directly using the key to be sure, as the SDK method signatures vary.

        // Using direct fetch to be safe and independent of SDK version quirks for listing
        const key = "AIzaSyCPIBeLy-5_w3XkCPV9Cqy7QeQKmK7Pb00";
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("✅ AVAILABLE MODELS:");
            console.log("-------------------");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`Name: ${model.name.replace("models/", "")}`);
                }
            });
        } else {
            console.log("❌ No models found or error:", data);
        }

    } catch (error) {
        console.error("❌ Error listing models:", error.message);
    }
}

listModels();
