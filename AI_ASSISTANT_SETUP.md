# AI Assistant Setup Guide

This guide will help you set up and run the AI Football Assistant chatbot service.

## Prerequisites

1. Python 3.7 or higher
2. Node.js (for the main application)
3. pip (Python package manager)

## Setup Steps

### 1. Install Python Dependencies

Navigate to the chatbot directory and install the required Python packages:

```bash
cd chatbot
pip install -r requirements.txt
```

### 2. Download spaCy Language Model

The chatbot uses spaCy for natural language processing. Download the English language model:

```bash
python -m spacy download en_core_web_sm
```

### 3. Start the Python Chatbot Service

Run the chatbot service:

```bash
cd chatbot
python app.py
```

Or use the provided batch files:

```bash
# To setup (install dependencies)
cd chatbot
setup.bat

# To run the service
run.bat
```

## Configuration

### Environment Variables

Make sure the following environment variables are set in your `.env` file:

```env
# AI Assistant Backend
VITE_AI_ASSISTANT_BACKEND_URL=http://localhost:5000
AI_ASSISTANT_BACKEND_URL=http://localhost:5000
```

### Port Configuration

- Main application: http://localhost:3001
- AI Assistant backend: http://localhost:5000
- Frontend: http://localhost:3006

## Testing the Service

### 1. Check if the service is running

Visit http://localhost:5000/health to verify the AI assistant is running.

### 2. Test the chat endpoint

You can test the chat functionality with a simple curl command:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you help me with?", "context": {}}'
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. **spaCy model not found**: Download the language model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Port conflicts**: If port 5000 is already in use, you can change it in the `app.py` file:
   ```python
   if __name__ == '__main__':
       app.run(host='0.0.0.0', port=5001, debug=True)  # Change 5001 to your preferred port
   ```

4. **Connection refused**: Make sure the Python service is running before starting the main application.

### Logs

Check the console output for any error messages. The Python service will display logs in the terminal where it's running.

## Features

The AI Football Assistant can help with:

- Player information and statistics
- Team formation analysis
- Match predictions and analysis
- Tactical advice and strategies
- Training recommendations
- Injury and fitness tracking

## Customization

You can customize the AI assistant by modifying the `chatbot/app.py` file:

1. **Player Data**: Update the `USER_DATA` dictionary with real player information
2. **Intent Patterns**: Modify the `INTENT_PATTERNS` dictionary to add new conversation topics
3. **Responses**: Customize the response templates in the `generate_response` function

## Integration with Main Application

The AI assistant integrates with the main application through:

1. **Frontend Service**: `src/services/aiChatService.ts`
2. **Backend Proxy**: `backend/src/routes/aiChatProxy.js`
3. **API Endpoints**: 
   - `/api/v1/ai-proxy/chat` - Main chat endpoint
   - `/api/v1/ai-proxy/team-data` - Team data endpoints
   - `/api/v1/ai-assistant/status` - Health check endpoint

## Support

If you encounter any issues, please check the console logs and ensure all services are running on the correct ports.