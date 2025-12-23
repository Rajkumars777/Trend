
// Document Restriction Test Script
async function testDocRestriction() {
    // Simulating a non-agri document (e.g., Tech/Finance)
    const fakeDocContent = `
    BITCOIN WHITE PAPER
    Abstract: A Peer-to-Peer Electronic Cash System.
    Bitcoin is a decentralized digital currency without a central bank or single administrator.
    Price: $100,000 USD.
    Trend: Volatile but bullish.
    `;

    const query = "Summarize this document.";
    console.log(`🚀 Testing Document Restriction with query: '${query}'`);

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

        if (data.answer.toLowerCase().includes("only analyze agriculture") || data.answer.toLowerCase().includes("refuse")) {
            console.log("🌟 SUCCESS: Chatbot correctly refused the non-agri document.");
        } else {
            console.warn("⚠️ WARNING: Chatbot might have accepted the document. Check output.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testDocRestriction();
