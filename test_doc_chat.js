
// Document Chat Test Script
async function testDocumentChat() {
    // Simulating a parsed document content about a specific (fake) crop report
    const fakeDocContent = `
    OFFICIAL CROP REPORT 2025 - SPECIAL EDITION
    Item: Purple Wheat
    Price: 5000 INR/Quintal
    Trend: Highly Bullish
    Weather Impact: Moderate rains expected next week, good for sowing.
    Advice: Farmers should hold stocks.
    `;

    const query = "What is the price of Purple Wheat and what is the advice?";
    console.log(`🚀 Testing Document Chat with query: '${query}'`);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                documentContext: fakeDocContent
            })
        });

        if (!response.ok) {
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        console.log("✅ Response received:");
        console.log("---------------------------------------------------");
        console.log(data.answer);
        console.log("---------------------------------------------------");

        if (data.answer.includes("5000") || data.answer.includes("Purple Wheat")) {
            console.log("🌟 SUCCESS: Chatbot answered from the document context.");
        } else {
            console.warn("⚠️ WARNING: Chatbot might have ignored the document.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testDocumentChat();
