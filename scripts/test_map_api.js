// Native fetch is available in Node 20+

async function testMapApi() {
    try {
        const res = await fetch('http://localhost:3000/api/map-data');
        if (res.ok) {
            const data = await res.json();
            console.log('✅ API Response OK');
            const countries = Object.keys(data);
            console.log(`Found data for ${countries.length} countries:`, countries.join(', '));

            if (countries.includes('India')) {
                console.log('Sample Data (India):', data['India']);
            }
        } else {
            console.error('❌ API Failed:', res.status, res.statusText);
        }
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testMapApi();
