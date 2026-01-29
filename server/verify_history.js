const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ASSETS_URL = `${BASE_URL}/assets`;

const uniqueId = Date.now();
const testUser = {
    name: 'History Tester',
    email: `history_${uniqueId}@example.com`,
    password: 'password123',
    role: 'admin'
};

const verifyHistory = async () => {
    console.log('🚀 Starting History Verification...');
    let token;

    // 1. Login/Register
    try {
        console.log(`Registering ${testUser.email}...`);
        const regRes = await axios.post(`${AUTH_URL}/register`, testUser);
        token = regRes.data.token;
        console.log('✅ Registered');
    } catch (e) {
        console.error('❌ Authentication failed:', e.message);
        return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    let assetId;

    try {
        // 2. Create Asset at Point A
        console.log('Creating asset at Point A (0,0)...');
        const createRes = await axios.post(ASSETS_URL, {
            name: `Moving Asset ${uniqueId}`,
            latitude: 0,
            longitude: 0,
            status: 'active'
        }, config);
        assetId = createRes.data._id;
        console.log('✅ Asset created:', assetId);

        // 3. Move Asset to Point B
        console.log('Moving asset to Point B (0.001, 0.001)...');
        await axios.put(`${ASSETS_URL}/${assetId}`, {
            latitude: 0.001,
            longitude: 0.001
        }, config);
        console.log('✅ Moved to B');

        // 4. Move Asset to Point C
        console.log('Moving asset to Point C (0.002, 0.002)...');
        await axios.put(`${ASSETS_URL}/${assetId}`, {
            latitude: 0.002,
            longitude: 0.002
        }, config);
        console.log('✅ Moved to C');

        // 5. Fetch History
        console.log('Fetching History...');
        const historyRes = await axios.get(`${ASSETS_URL}/${assetId}/history`, config);
        const history = historyRes.data;

        console.log(`📜 History Points: ${history.length}`);
        history.forEach((h, i) => {
            console.log(`   ${i + 1}. [${h.location.coordinates}] @ ${h.timestamp}`);
        });

        // We expect 2 history points (Point A and Point B) because Point C is current location
        // Actually, logic is: Initial (A). Update to B -> Saves A. Update to C -> Saves B.
        // So History should have A and B. Current is C.
        if (history.length >= 2) {
            console.log('✅ History Verification PASSED');
        } else {
            console.error('❌ History Verification FAILED: Expected at least 2 points.');
        }

    } catch (err) {
        console.error('❌ Verification Error:', err.response ? err.response.data : err.message);
    }
};

verifyHistory();
