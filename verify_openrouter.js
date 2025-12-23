
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function verifyOpenRouter() {
    console.log("🚀 Starting verification for 'OpenRouter (DeepSeek)'...");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("❌ OPENROUTER_API_KEY is missing in .env.local.");
        return;
    }

    const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey
    });

    try {
        const prompt = "Current Date: " + new Date().toLocaleDateString() + ". Hello, are you online?";
        console.log("📤 Sending prompt:", prompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            model: "deepseek/deepseek-chat", // OpenRouter model ID for DeepSeek V3/V2.5
        });

        console.log("✅ SUCCESS! Model responded:");
        console.log("---------------------------------------------------");
        console.log(completion.choices[0].message.content);
        console.log("---------------------------------------------------");
    } catch (error) {
        console.error("❌ FAILED:", error.message);
        if (error.response) {
            console.error("Details:", error.response.data);
        }
    }
}

verifyOpenRouter();
