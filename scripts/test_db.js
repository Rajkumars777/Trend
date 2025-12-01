const mongoose = require('mongoose');

const URI = 'mongodb://localhost:27017/agri-trend-dashboard';

console.log(`Connecting to ${URI}...`);

mongoose.connect(URI)
    .then(() => {
        console.log('✅ Connection Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    });
