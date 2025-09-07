# MM Project Setup Guide

This guide will help you set up the complete MM project, including both the frontend and the new Python-based AI chatbot backend.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- Python (version 3.7 or higher)
- pip (Python package installer)
- Git

## Setup Instructions

### 1. Frontend Setup

1. Navigate to the project root directory:
   ```
   cd mm
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

### 2. Python Chatbot Backend Setup

#### Option A: Automated Setup (Windows)

1. Navigate to the chatbot directory:
   ```
   cd chatbot
   ```

2. Run the setup script:
   ```
   setup.bat
   ```

#### Option B: Manual Setup (All Platforms)

1. Navigate to the chatbot directory:
   ```
   cd chatbot
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Download the spaCy English model:
   ```
   python -m spacy download en_core_web_sm
   ```

### 3. Running the Application

#### Running the Frontend

1. From the project root directory:
   ```
   npm run dev
   ```

2. The frontend will be available at http://localhost:3006

#### Running the Python Backend

##### Option A: Using npm scripts

1. From the project root directory:
   ```
   npm run backend:run
   ```

##### Option B: Manual execution

1. Navigate to the chatbot directory:
   ```
   cd chatbot
   ```

2. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Run the Python application:
   ```
   python app.py
   ```

4. The backend will be available at http://localhost:5000

### 4. Accessing the AI Assistant

Once both the frontend and backend are running:

1. Open your browser and navigate to http://localhost:3006
2. Log in to the application
3. Navigate to the AI Assistant page at http://localhost:3006/ai-assistant
4. The AI Assistant should now be connected to the Python backend and able to provide data-driven responses

## Docker Deployment (Optional)

For easier deployment, you can use Docker to run both services together:

1. From the project root directory:
   ```
   docker-compose up --build
   ```

2. The frontend will be available at http://localhost:3006
3. The backend will be available at http://localhost:5000

## Troubleshooting

### Common Issues

1. **spaCy model not found**: If you get errors about the spaCy model, make sure you've run:
   ```
   python -m spacy download en_core_web_sm
   ```

2. **Port conflicts**: If ports 3006 or 5000 are already in use, you can modify the port configurations in:
   - Frontend: `vite.config.ts`
   - Backend: `chatbot/app.py`

3. **Connection issues**: Make sure both services are running and that your firewall isn't blocking the connections.

### Verifying the Setup

1. Check that the frontend is running by visiting http://localhost:3006
2. Check that the backend is running by visiting http://localhost:5000/health
3. In the AI Assistant interface, you should see both "AI Engine: Online" and "Data Services: Online"

## Customization

### Modifying User Data

The Python backend uses sample user data stored in the `USER_DATA` variable in `chatbot/app.py`. You can modify this data to match your actual team information.

### Extending Functionality

To add new features to the chatbot:

1. Add new intent patterns to the `INTENT_PATTERNS` dictionary
2. Implement new response generation logic in the `generate_response` function
3. Add new data structures to `USER_DATA` as needed
4. Create additional API endpoints for new features

## Support

If you encounter any issues during setup or have questions about customization, please refer to the documentation in each component or reach out to the development team.