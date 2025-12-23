
// Domain Restriction Test Script
async function testRestriction() {
    const offTopicQuery = "Tell me a joke about bitcoin and politics.";
    console.log(`🚀 Testing Domain Restriction with query: '${offTopicQuery}'`);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: offTopicQuery })
        });

        if (!response.ok) {
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        const answer = data.answer;
        console.log("✅ Response received:");
        console.log("---------------------------------------------------");
        console.log(answer);
        console.log("---------------------------------------------------");

        if (answer.toLowerCase().includes("cannot assist") || answer.toLowerCase().includes("specialize only")) {
            console.log("🌟 SUCCESS: Chatbot correctly refused off-topic query.");
        } else {
            console.warn("⚠️ WARNING: Chatbot might have answered the off-topic query. Check the output.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testRestriction();
