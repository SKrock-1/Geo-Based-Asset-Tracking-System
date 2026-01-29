const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const AUTH_URL = `${BASE_URL}/auth`;
const ASSETS_URL = `${BASE_URL}/assets`;

const uniqueId = Date.now();
const testUser = {
    name: 'Test Admin',
    email: `testadmin_${uniqueId}@example.com`,
    password: 'password123',
    role: 'admin'
};

const verifyGeoAPIs = async () => {
    console.log('🚀 Starting Verification...');
    let token;

    try {
        console.log(`Attempting Register with ${testUser.email}...`);
        const regRes = await axios.post(`${AUTH_URL}/register`, testUser);
        console.log('✅ Registration successful');
        token = regRes.data.token;
    } catch (error) {
        console.error('❌ Registration FAILED');
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Details:', errMsg);

        // Try login as fallback (in case uniqueId isn't unique enough or server restarted with persistence)
        try {
            console.log('Attempting Login fallback...');
            const loginRes = await axios.post(`${AUTH_URL}/login`, { email: testUser.email, password: testUser.password });
            token = loginRes.data.token;
            console.log('✅ Login successful');
        } catch (loginErr) {
            console.error('❌ Login fallback failed also');
            return;
        }
    }

    if (!token) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
        // Create Assets
        console.log('Creating test assets...');

        // Asset 1: Center
        await axios.post(ASSETS_URL, {
            name: `Center Asset ${uniqueId}`,
            description: 'Asset at 0,0',
            latitude: 0,
            longitude: 0,
            status: 'active'
        }, config);

        // Asset 2: Nearby (~150m)
        await axios.post(ASSETS_URL, {
            name: `Nearby Asset ${uniqueId}`,
            description: 'Asset ~150m away',
            latitude: 0.001,
            longitude: 0.001,
            status: 'active'
        }, config);

        // Asset 3: Far (~15km)
        await axios.post(ASSETS_URL, {
            name: `Far Asset ${uniqueId}`,
            description: 'Asset ~15km away',
            latitude: 0.1,
            longitude: 0.1,
            status: 'active'
        }, config);

        console.log('✅ Assets created');

        // Test 1: GET /nearby
        console.log('Testing GET /nearby (Radius 1000m)...');
        const nearbyRes = await axios.get(`${ASSETS_URL}/nearby?lat=0&lng=0&radius=1000`, config);
        const foundNames = nearbyRes.data.map(a => a.name);

        const hasCenter = foundNames.some(n => n.includes(`Center Asset ${uniqueId}`));
        const hasNearby = foundNames.some(n => n.includes(`Nearby Asset ${uniqueId}`));
        const hasFar = foundNames.some(n => n.includes(`Far Asset ${uniqueId}`));

        if (hasCenter && hasNearby && !hasFar) {
            console.log('✅ Nearby API Logic Verified: Found expected assets.');
        } else {
            console.error('❌ Nearby API Logic Failed. Found:', foundNames);
        }

        // Test 2: POST /within-zone
        console.log('Testing POST /within-zone...');
        const polygon = [
            [-0.005, -0.005],
            [0.005, -0.005],
            [0.005, 0.005],
            [-0.005, 0.005],
            [-0.005, -0.005] // Closed loop
        ];

        const zoneRes = await axios.post(`${ASSETS_URL}/within-zone`, { coordinates: polygon }, config);
        const zoneNames = zoneRes.data.map(a => a.name);

        const hasCenterZone = zoneNames.some(n => n.includes(`Center Asset ${uniqueId}`));
        const hasNearbyZone = zoneNames.some(n => n.includes(`Nearby Asset ${uniqueId}`));
        const hasFarZone = zoneNames.some(n => n.includes(`Far Asset ${uniqueId}`));

        if (hasCenterZone && hasNearbyZone && !hasFarZone) {
            console.log('✅ Zone API Logic Verified: Found expected assets.');
        } else {
            console.error('❌ Zone API Logic Failed. Found:', zoneNames);
        }

    } catch (err) {
        console.error('❌ Asset Test Failed');
        const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error('Details:', errMsg);
    }
};

verifyGeoAPIs();
