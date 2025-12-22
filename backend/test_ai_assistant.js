const axios = require('axios');

const testAIChat = async () => {
  try {
    console.log('Testing AI assistant chat...');
    const response = await axios.post(
      'https://localhost.codesandbox.io/api/v1/ai-assistant/chat',
      {
        message: 'Hello, who are you?'
      },
      {
        headers: {
          Authorization: 'Bearer test-token'
        }
      }
    );

    if (response.data && response.data.success && response.data.data.response) {
      console.log('AI Assistant Test PASSED:');
      console.log('Response:', response.data.data.response);
    } else {
      console.error('AI Assistant Test FAILED:');
      console.error('Invalid response format:', response.data);
    }
  } catch (error) {
    console.error('AI Assistant Test FAILED:');
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testAIChat();
