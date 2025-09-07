# AI Assistant Startup Guide

This guide will help you properly start all services required for the AI Assistant to work correctly.

## Prerequisites

1. Node.js (version 18 or higher)
2. Python (version 3.7 or higher)
3. pip (Python package manager)
4. Docker (recommended approach)

## Services Overview

The AI Assistant requires three services to run:

1. **Frontend** (React app) - Runs on port 3006
2. **Backend** (Node.js API) - Runs on port 3001
3. **AI Assistant Backend** (Python Flask app) - Runs on port 5000

## Recommended Approach: Using Docker

The easiest and most reliable way to run all services is using Docker:

```bash
docker-compose up --build -d
```

This will start all services in detached mode. You can then access the application at:
- Frontend: http://localhost:3006
- Backend API: http://localhost:3001
- AI Assistant Backend: http://localhost:5000

To stop all services:
```bash
docker-compose down
```

## Alternative Approach: Manual Installation

If you prefer to run services manually, follow these steps:

### 1. Start the AI Assistant Backend (Python Flask)

Open a new terminal/command prompt and navigate to the chatbot directory:

```bash
cd chatbot
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Download the required spaCy model:

```bash
python -m spacy download en_core_web_sm
```

Start the AI Assistant backend:

```bash
python app.py
```

The service should start on `http://localhost:5000`

### 2. Start the Main Backend (Node.js)

Open a new terminal/command prompt and navigate to the backend directory:

```bash
cd backend
```

Install Node.js dependencies:

```bash
npm install
```

Start the backend server:

```bash
npm start
```

The service should start on `http://localhost:3001`

### 3. Start the Frontend (React)

Open a new terminal/command prompt in the root directory:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The service should start on `http://localhost:3006`

## Alternative: Using the Start Script

You can also use the provided batch script to start all services:

```bash
start-all-services.bat
```

This will open separate command prompt windows for each service.

## Testing the Connection

You can test if all services are properly connected with:

```bash
npm run test:ai-connection
```

This script will check if all three services are accessible and provide specific error messages if any service is not running.

## Troubleshooting

### If you get "Python is not recognized" error:

1. Make sure Python is installed on your system
2. Add Python to your system PATH environment variable
3. Try using `python3` instead of `python` in the commands

### If you get "pip is not recognized" error:

1. Make sure pip is installed with Python
2. Try using `python -m pip` instead of `pip` in the commands

### If services fail to start on the expected ports:

1. Check if the ports are already in use:
   ```bash
   netstat -an | findstr "3001\|5000\|3006"
   ```
2. If ports are in use, you can either:
   - Stop the processes using those ports, or
   - Modify the port configurations in the respective configuration files

### If you get connection errors in the AI Assistant:

1. Make sure all three services are running
2. Check that there are no firewall rules blocking the connections
3. Verify that the environment variables are correctly set in the `.env` file

## Environment Variables

Make sure your `.env` file in the root directory contains:

```env
VITE_API_URL=http://localhost:3001
VITE_AI_ASSISTANT_BACKEND_URL=http://localhost:5000
```

## Verifying Services

You can verify each service is running by visiting:

- Frontend: http://localhost:3006
- Backend: http://localhost:3001/health
- AI Assistant Backend: http://localhost:5000/health

You can also use the provided scripts:
```bash
npm run check-services    # Check services running manually
npm run check-docker      # Check services running in Docker
npm run test:ai-connection # Test AI assistant connection
```

## Stopping Services

To stop the services:
- If running with Docker: `docker-compose down`
- If running manually: Simply close the terminal/command prompt windows or press `Ctrl+C` in each terminal.