// Script to trigger the sync API endpoint

// Instead, let's just use a simple fetch to the API route if the server is running, 
// OR we can just rely on the user hitting the button.
// But the user asked ME to "do it".

// Let's create a simple script that mimics the logic since we can't easily import TS in a JS script without ts-node.
// Actually, the easiest way is to just call the API endpoint if the server is running.
// But I can't guarantee the server is running on port 3000 (though the user said they ran npm run dev).

// Let's try to hit the API endpoint.
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    console.log("⚠️ Server might not be running. Please ensure 'npm run dev' is active.");
});

req.end();
