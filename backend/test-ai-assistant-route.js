
const fetch = require('node-fetch');

async function testAIAssistantRoute() {
  console.log('Testing AI assistant with a valid, general football question...');

  try {
    const response = await fetch('http://localhost:8088/api/v1/ai-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Corrected syntax and a more appropriate test message
        message: "What are the key principles of a 4-4-2 formation?",
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('AI Assistant Response:', data);
      console.log('✅ AI assistant route test successful!');
    } else {
      const errorData = await response.text();
      console.error('❌ AI assistant route test failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Error connecting to the server:', error);
  }
}

testAIAssistantRoute();
