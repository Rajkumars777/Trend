// Hybrid RAG Agent (Google Gemini)
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCPIBeLy-5_w3XkCPV9Cqy7QeQKmK7Pb00");
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // User requested model
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
    ],
});

// Helper: Google Custom Search API
async function fetchGoogleSearch(query: string) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;

    if (!apiKey || !cx) {
        console.warn("⚠️ Google Search API keys missing. Falling back to internal data.");
        return [];
    }

    try {
        const searchContext = query.toLowerCase().includes('price') ? '' : ' agriculture market price';
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + searchContext)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            return data.items.slice(0, 4).map((item: any) => ({
                source: item.displayLink || 'Google Search',
                title: item.title,
                snippet: item.snippet,
                content: `${item.title} - ${item.snippet}`,
                timestamp: new Date(),
                url: item.link,
                image: item.pagemap?.cse_image?.[0]?.src || null,
                type: 'web_search'
            }));
        }
        return [];
    } catch (error) {
        console.error("Google Search Error:", error);
        return [];
    }
}

export async function POST(request: Request) {
    try {
        const { query } = await request.json();
        if (!query) return NextResponse.json({ answer: "Hello! I am your Agri-Assistant powered by Gemini 1.5 Flash. Ask away!", sources: [] });

        // 1. SMART INTENT DETECTION
        const isGreeting = /^(hi|hello|hey|greetings|good morning|yo|how are you|test|ping)$/i.test(query.trim()) ||
            (query.split(' ').length < 4 && /^(hi|hello|hey)/i.test(query));

        if (isGreeting) {
            return NextResponse.json({
                answer: "Hello! I am your Agri-Intelligence Assistant.\n\nI can help you with:\n- **Real-time Crop Prices**\n- **Weather & Market Trends**\n- **Social Sentiment Analysis**\n\nWhat would you like to know?",
                sources: []
            });
        }

        // 2. WEB SEARCH (Context Awareness)
        // Don't search if it's purely conversational to save API calls and noise
        const needsSearch = !isGreeting && query.length > 5;
        const webNews = needsSearch ? await fetchGoogleSearch(query) : [];

        // 3. GENERATION
        let finalAnswer = "";

        if (!process.env.GEMINI_API_KEY) {
            finalAnswer = `## ⚠️ Setup Required
I need a **Google Gemini API Key** to function.

1. Get a free key from [Google AI Studio](https://aistudio.google.com/).
2. Add it to \`.env.local\`:
   \`GEMINI_API_KEY=your_key_here\`
3. Restart the server.`;
        } else {
            try {
                // Only use Web Data for context (kept internal, not shown as cards)
                const googleData = webNews.map((s: any) => `- ${s.title}: ${s.snippet}`).join("\n");

                // HYBRID PROMPT: Handles both Chit-Chat and Market Tasks
                const prompt = `You are an elite Agricultural Intelligence Consultant.

CONTEXT:
**Current Date:** ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${googleData || "No external data needed."}

USER QUERY: ${query}

INSTRUCTIONS:
1. **CLASSIFY INTENT FIRST:**
   - If the user is just chatting ("How are you?", "Who are you?", "Thanks"), ignore the strict reporting format. Just be friendly, professional, and concise.
   - If the user asks about **Prices, Crops, Weather, or Trends**, you MUST follow the **STRICT REPORTING FORMAT** below.

STRICT REPORTING FORMAT (Only for Market/Agri Queries):
1. **Data Visualization (MANDATORY):** Use a **Markdown Table** for comparison. (Columns: Market/Variety | Wholesale Price | Retail Price).
2. **High Contrast:** **BOLD** every price, percentage, and key location.
3. **Structure:**
   - 🌟 **Executive Summary:** Direct answer.
   ---
   - 💰 **Market Pulse:** [TABLE]
   ---
   - 📈 **Trend Analysis:** Bullet points with arrows (⬆️ ⬇️).
   ---
   - 💡 **Pro Tip:** Actionable advice.

4. **Tone:** Executive, Data-Driven, Premium.`;

                // Retry Logic for Rate Limits (429)
                const generateWithRetry = async (retries = 3, delay = 1000) => {
                    try {
                        const result = await model.generateContent(prompt);
                        return await result.response;
                    } catch (error: any) {
                        if (retries > 0 && (error.message?.includes('429') || error.message?.includes('Quota'))) {
                            console.warn(`⚠️ Rate Limit Hit. Retrying in ${delay}ms...`);
                            await new Promise(res => setTimeout(res, delay));
                            return generateWithRetry(retries - 1, delay * 2);
                        }
                        throw error;
                    }
                };

                const response = await generateWithRetry();
                finalAnswer = response.text();

            } catch (error: any) {
                console.error("Gemini Error:", error);
                if (error.message?.includes('429') || error.message?.includes('Quota')) {
                    finalAnswer = "⚠️ **Server Busy:** The AI model is currently experiencing high traffic. Please try again in 10-15 seconds.";
                } else {
                    finalAnswer = "⚠️ I encountered an error communicating with Gemini. Please check your API usage.";
                }
            }
        }

        return NextResponse.json({
            answer: finalAnswer,
            sources: [], // CLEARED to remove "posts visible"
            structuredResults: [] // CLEARED to remove cards
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Service Error" }, { status: 500 });
    }
}
