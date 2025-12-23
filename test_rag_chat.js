
// RAG Test Script
async function testRagChat() {
    const topic = "maize"; // Matches "Short-stature maize" post
    console.log(`🚀 Testing RAG Chat API for topic: '${topic}'`);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `What is the latest trend on ${topic}?` })
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

        if (data.answer.toLowerCase().includes("social") || data.answer.toLowerCase().includes("sentiment")) {
            console.log("🌟 SUCCESS: Response contains social sentiment analysis.");
        } else {
            console.warn("⚠️ WARNING: Response might be missing social analysis. Check the output.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testRagChat();
