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
        const { query, documentContext } = await request.json(); // Accept documentContext
        if (!query) return NextResponse.json({ answer: "Hello! I am your Agri-Assistant powered by Gemini 1.5 Flash. Ask away!", sources: [] });

        // 1. INTENT DETECTION (Rule-based)
        const isMarketQuery = /price|cost|rate|trend|market|forecast|outlook|buy|sell|future/i.test(query);
        const isGreeting = /^(hi|hello|hey|greetings)/i.test(query);

        if (isGreeting) {
            return NextResponse.json({
                answer: "Hello! I am your Agri-Intelligence Assistant.\n\nI can help you with:\n- **Real-time Crop Prices**\n- **Weather & Market Trends**\n- **Social Sentiment Analysis**\n\nWhat would you like to know?",
                sources: []
            });
        }

        // 2. WEB SEARCH (Google) - Skip if Document is provided or specific intent
        // Don't search if it's purely conversational or if we have a document (focus on doc)
        const needsSearch = !isGreeting && !documentContext && query.length > 5;
        const webNews = needsSearch ? await fetchGoogleSearch(query) : [];

        // 3. GENERATION
        let finalAnswer = "";

        // Check for OpenRouter (DeepSeek) first
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        // RAG: Fetch Social Media Context
        let socialContext = "";
        try {
            const client = await clientPromise;
            const db = client.db('agri_trend_dashboard');

            // Extract keywords (simple whitespace split, filter short words)
            const keywords = query.split(/\s+/).filter((w: string) => w.length > 3).map((w: string) => new RegExp(w, 'i'));

            if (keywords.length > 0) {
                const posts = await db.collection('posts').find({
                    $or: [
                        { content: { $in: keywords } },
                        { "analysis.detected_keywords": { $in: keywords } }
                    ]
                }).limit(8).sort({ timestamp: -1 }).toArray();

                if (posts.length > 0) {
                    const postSummaries = posts.map((p: any) =>
                        `- "${p.content.substring(0, 100)}..." (Sentiment: ${p.analysis?.sentiment_score || 0}, Source: ${p.source})`
                    ).join("\n");
                    socialContext = `\n\nRECENT SOCIAL MEDIA ACTIVITY (Real User Posts):\n${postSummaries}`;
                }
            }
        } catch (dbError) {
            console.error("RAG Fetch Error:", dbError);
            // Continue without social context if DB fails
        }

        if (openRouterKey) {
            try {
                const OpenAI = require("openai"); // Dynamic import to avoid build issues if not used, or use import at top
                const openai = new OpenAI({
                    baseURL: "https://openrouter.ai/api/v1",
                    apiKey: openRouterKey,
                });

                // Only use Web Data for context
                const googleData = webNews.map((s: any) => `- ${s.title}: ${s.snippet}`).join("\n");

                const docSection = documentContext ? `\n\n📄 **UPLOADED DOCUMENT CONTENT:**\n"${documentContext.substring(0, 15000)}..."\n(Use this information to answer the user's question about the document)` : "";

                const systemPrompt = `You are an elite Agricultural Intelligence Consultant.

CONTEXT:
**Current Date:** ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${docSection}
${googleData || "No external data needed."}
${socialContext}

INSTRUCTIONS:
1. **SCOPE ENFORCEMENT (CRITICAL):**
   - If the user uploaded a document, **FIRST CHECK IF IT IS AGRI-RELATED**.
     - **Allowed Documents**: Crop Reports, Market Price Lists, Weather Forecasts, Machinery Manuals, Gov Policy on Farming.
     - **Forbidden Documents**: Crypto Reports, Novels, Tech Tutorials, General News.
     - **Action**: If the document is NOT agriculture-related, **REFUSE** to analyze it. Say: "I can only analyze agriculture-related documents. This document appears to be about [topic]."
   
   - If the document IS valid, **PRIORITIZE** answering from it.
   - You are an **Agricultural Intelligence Consultant**. You ONLY answer questions related to:
     - Agriculture (Crops, Farming, Soil, Pests)
     - Market Prices & Trends (Wholesale, Retail)
     - Agri-Machinery (Tractors, Tools, Equipment)
     - Weather impacts on farming.
     - **AND Content within the uploaded document (IF and ONLY IF it is agri-related).**
   - If the user asks about ANYTHING else, **POLITELY REFUSE**.
     - Example Refusal: "I specialize only in agricultural market trends, machinery, and crop prices. I cannot assist with [topic]."
   - **EXCEPTION:** You can answer basic greetings ("Hi", "Hello") friendly.

2. **CLASSIFY INTENT:**
   - If the user is asking about the **Document**, answer from it.
   - If the user is just chatting, be friendly but steer them back to agriculture.
   - If the user asks about **Prices, Crops, Weather, or Trends**, you MUST follow the **STRICT REPORTING FORMAT**.

STRICT REPORTING FORMAT (Only for Market/Agri Queries):
1. **Data Visualization (MANDATORY):** Use a **Markdown Table** (Columns: Market/Variety | Wholesale Price | Retail Price).
2. **High Contrast:** **BOLD** every price, percentage, and key location.
3. **Structure:**
   - 🌟 **Executive Summary:** Direct answer.
   ---
   - 💰 **Market Pulse:** [TABLE]
   ---
   - 📈 **Trend Analysis:** Bullet points with arrows (⬆️ ⬇️).
   ---
   - 🗣️ **Social Sentiment:** Analyze the "RECENT SOCIAL MEDIA ACTIVITY" provided above. Summarize what people are saying.
   ---
   - 💡 **Pro Tip:** Actionable advice.

4. **Tone:** Executive, Data-Driven, Premium.`;

                const completion = await openai.chat.completions.create({
                    model: "deepseek/deepseek-chat", // DeepSeek V3/V2.5 via OpenRouter
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: query }
                    ],
                });

                finalAnswer = completion.choices[0].message.content || "No response generated.";

            } catch (error: any) {
                console.error("OpenRouter Error:", error);
                if (error.status === 402) {
                    finalAnswer = "⚠️ **DeepSeek Credit Issue:** Insufficient balance on OpenRouter. Falling back requires manual intervention or credit top-up.";
                } else {
                    finalAnswer = `⚠️ Error using DeepSeek: ${error.message}`;
                    // Optionally fall back to Gemini here if you want
                }
            }
        }
        // Fallback to Gemini if OpenRouter is missing (or if you add fallback logic above)
        else if (geminiKey) {
            try {
                // Only use Web Data for context (kept internal, not shown as cards)
                const googleData = webNews.map((s: any) => `- ${s.title}: ${s.snippet}`).join("\n");

                // HYBRID PROMPT: Handles both Chit-Chat and Market Tasks
                const prompt = `You are an elite Agricultural Intelligence Consultant.

CONTEXT:
**Current Date:** ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${googleData || "No external data needed."}
${socialContext}

USER QUERY: ${query}

INSTRUCTIONS:
1. **SCOPE ENFORCEMENT (CRITICAL):**
   - You are an **Agricultural Intelligence Consultant**. You ONLY answer questions related to:
     - Agriculture (Crops, Farming, Soil, Pests)
     - Market Prices & Trends
     - Agri-Machinery (Tractors, Tools)
     - Weather impacts on farming.
   - If the user asks about ANYTHING else, **POLITELY REFUSE**.
     - Example: "I specialize only in agricultural topics. I cannot assist with [topic]."

2. **CLASSIFY INTENT:**
   - If the user is just chatting, be friendly but steer them back to agriculture.
   - If the user asks about **Prices, Crops, Weather, or Trends**, you MUST follow the **STRICT REPORTING FORMAT**.

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
   - 🗣️ **Social Sentiment:** Analyze the "RECENT SOCIAL MEDIA ACTIVITY" provided above.
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
        } else {
            finalAnswer = `## ⚠️ Setup Required
I need an API Key (DeepSeek or Gemini) to function.

1. Get a key from [OpenRouter](https://openrouter.ai/) or [Google AI Studio](https://aistudio.google.com/).
2. Add it to \`.env.local\`:
   \`OPENROUTER_API_KEY=your_key\` or \`GEMINI_API_KEY=your_key\`
3. Restart the server.`;
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
