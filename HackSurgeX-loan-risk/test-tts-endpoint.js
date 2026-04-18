// Quick test script to verify TTS endpoint is working
// Run with: node test-tts-endpoint.js

import fs from 'fs';

async function testTTS() {
  try {
    console.log('Testing TTS endpoint...');
    
    const response = await fetch('http://localhost:3001/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello farmer, your soil is healthy.',
        language: 'en'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      return;
    }

    const audioBlob = await response.blob();
    console.log('Audio blob received, size:', audioBlob.size, 'bytes');
    console.log('Audio type:', audioBlob.type);

    // Save to file for testing
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    fs.writeFileSync('test-audio.wav', buffer);
    console.log('✅ Audio saved to test-audio.wav - play it to verify!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTTS();
