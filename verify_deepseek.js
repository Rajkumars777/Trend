
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function verifyDeepSeek() {
    console.log("🚀 Starting verification for 'DeepSeek'...");

    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log("DEBUG: Key type:", typeof apiKey);
    console.log("DEBUG: Key length:", apiKey ? apiKey.length : 0);

    if (!apiKey) {
        console.error("❌ DEEPSEEK_API_KEY is missing in .env.local.");
        return;
    }

    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: apiKey
    });

    try {
        const prompt = "Current Date: " + new Date().toLocaleDateString() + ". Hello, are you online?";
        console.log("📤 Sending prompt:", prompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            model: "deepseek-chat",
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

verifyDeepSeek();
