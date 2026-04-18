/**
 * Test script for Market Price API
 */

const axios = require('axios');

async function testMarketAPI() {
  console.log('Testing Market Price API...\n');

  try {
    // Test 1: Search crops
    console.log('1. Testing crop search...');
    const searchResponse = await axios.get('http://localhost:3001/api/market/search?query=rice');
    console.log('✓ Search successful:', searchResponse.data.crops.slice(0, 5));

    // Test 2: Get crop price
    console.log('\n2. Testing crop price fetch for Rice...');
    const priceResponse = await axios.get('http://localhost:3001/api/market/price/Rice');
    console.log('✓ Price fetch successful!');
    console.log('Crop:', priceResponse.data.crop);
    console.log('Current Price:', priceResponse.data.currentPrice);
    console.log('Market:', priceResponse.data.market);
    console.log('Source:', priceResponse.data.source);
    console.log('Price History Length:', priceResponse.data.priceHistory.length);

    // Test 3: Get another crop
    console.log('\n3. Testing crop price fetch for Tomato...');
    const tomatoResponse = await axios.get('http://localhost:3001/api/market/price/Tomato');
    console.log('✓ Price fetch successful!');
    console.log('Crop:', tomatoResponse.data.crop);
    console.log('Current Price:', tomatoResponse.data.currentPrice);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMarketAPI();
