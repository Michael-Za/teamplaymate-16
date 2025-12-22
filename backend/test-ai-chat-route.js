
const fetch = require('node-fetch');

async function testAIChatRoute() {
  console.log('Testing AI chat route...');

  try {
    const response = await fetch('https://localhost.codesandbox.io/api/v1/aichatproxy/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      },
      body: JSON.stringify({
        message: 'Hello, AI assistant! Are you working?',
        context: {
          userRole: 'admin'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('AI Response:', data);
      console.log('✅ AI chat route test successful!');
    } else {
      const errorData = await response.text();
      console.error('❌ AI chat route test failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Error connecting to the server:', error);
  }
}

testAIChatRoute();
