require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const URI = process.env.MONGODB_URI;

console.log('---------------------------------------------------');
console.log('🧪 Testing MongoDB Connection from .env.local');
console.log('---------------------------------------------------');

if (!URI) {
    console.error('❌ Error: MONGODB_URI is not defined in .env.local');
    process.exit(1);
}

// Mask password for display
const maskedURI = URI.replace(/:([^:@]+)@/, ':****@');
console.log(`📡 Attempting to connect to: ${maskedURI}`);

mongoose.connect(URI)
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB!');
        console.log('---------------------------------------------------');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FAILURE: Could not connect.');
        console.error(`   Error Name: ${err.name}`);
        console.error(`   Error Message: ${err.message}`);

        if (err.message.includes('bad auth')) {
            console.log('\n💡 TIP: This means your Username or Password in the connection string is incorrect.');
            console.log('   Check for special characters in the password that need URL encoding.');
        } else if (err.message.includes('ECONNREFUSED')) {
            console.log('\n💡 TIP: This means the database server is not running or the address is wrong.');
            console.log('   If using localhost, make sure MongoDB Community Server is started.');
        }

        console.log('---------------------------------------------------');
        process.exit(1);
    });
