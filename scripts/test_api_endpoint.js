const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/trends',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("API Response Keys:", Object.keys(json));
            console.log("Trends Count:", json.trends?.length);
            console.log("Predictions Count:", json.predictions?.length);
            console.log("Recent Posts Count:", json.recentPosts?.length);
            if (json.debugInfo) {
                console.log("Debug Info:", json.debugInfo);
            }
            if (json.predictions?.length > 0) {
                console.log("Sample Prediction:", json.predictions[0]);
            }
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            console.log("Raw Body:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
