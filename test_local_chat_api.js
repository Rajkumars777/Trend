// using global fetch (Node 18+)
async function testChatApi() {
    console.log("🚀 Testing local API endpoint: http://localhost:3000/api/chat");
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "Hello, who are you? Tell me about the market." })
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

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        console.log("Make sure the Next.js server is running on port 3000!");
    }
}

// Check node version for fetch support
if (parseInt(process.versions.node.split('.')[0]) < 18) {
    console.warn("⚠️ Node version < 18 detection. Ensure 'node-fetch' is installed or use Node 18+.");
    // Attempt to require, if fail user might need install.
    // In many modern envs, global fetch is available.
}

testChatApi();
