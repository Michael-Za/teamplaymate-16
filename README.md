# StatSor - Football Management Platform

<<<<<<< HEAD
StatSor is a comprehensive football management platform with AI-powered tactical analysis.

## System Architecture

The platform consists of three main components:

1. **Frontend**: React application with TypeScript, Vite, and Tailwind CSS
2. **Backend**: Node.js/Express API with MongoDB
3. **AI Assistant**: Python-based service for tactical analysis

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB (for local development)

## Quick Start with Docker

```bash
# Start all services
npm run start:docker

# Stop all services
npm run stop:docker
```

This will start:
- Frontend on http://localhost:3009
- Backend API on http://localhost:3008
- MongoDB on port 27017

## Development Setup

### Backend

```bash
cd coach
npm install
npm run dev
```

The backend will start on http://localhost:3008

### Frontend

```bash
npm install
npm run dev
```

The frontend will start on http://localhost:3009

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new coach
- `POST /api/auth/login` - Login
- `POST /api/auth/guest` - Guest login
- `GET /api/auth/me` - Get current user

### Players
- `POST /api/players` - Create a new player
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get a specific player
- `PUT /api/players/:id` - Update a player
- `DELETE /api/players/:id` - Delete a player

### Teams
- `POST /api/teams` - Create a new team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get a specific team
- `PUT /api/teams/:id` - Update a team
- `DELETE /api/teams/:id` - Delete a team

### Matches
- `POST /api/matches` - Create a new match
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get a specific match
- `PUT /api/matches/:id` - Update a match
- `DELETE /api/matches/:id` - Delete a match

### Training
- `POST /api/trainings` - Create a new training session
- `GET /api/trainings` - Get all training sessions
- `GET /api/trainings/:id` - Get a specific training session
- `PUT /api/trainings/:id` - Update a training session
- `DELETE /api/trainings/:id` - Delete a training session

## Environment Variables
=======
StatSor is a comprehensive football management platform that helps coaches and managers track player performance, analyze matches, and make data-driven decisions.

## Features

- Player Management
- Team Formation Analysis
- Match Tracking
- Performance Analytics
- Training Planning
- **AI-Powered Tactical Assistant**
- Real-time Collaboration
- Mobile Responsive Design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.7+ (for AI assistant)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mm
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up the AI Assistant (Python service):
```bash
cd chatbot
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Environment Setup
>>>>>>> 5b1c6eafdf9968ae53e6d141d90a040247079721

Create a `.env` file in the root directory with the following variables:

```env
<<<<<<< HEAD
# Backend Environment Variables
MONGO_URI=mongodb://localhost:27017/statsor
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3009/api/auth/google/callback

# Email Configuration (optional)
EMAIL_FROM=no-reply@statsor.com
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
GMAIL_USERNAME=your_email@gmail.com
GMAIL_PASSWORD=your_app_password
```

## Testing Integration

To test if the frontend and backend are properly integrated:

```bash
npm run test:integration
=======
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3012
VITE_AI_ASSISTANT_BACKEND_URL=http://localhost:5000

# Backend Environment Variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### Running the Application

#### Option 1: Using Docker (Recommended)

The easiest way to run all services is using Docker:

```bash
docker-compose up --build -d
```

This will start all services in detached mode. You can then access the application at http://localhost:3006

To stop all services:
```bash
docker-compose down
```

#### Option 2: Manual Installation

1. Start the AI Assistant (Python service):
```bash
cd chatbot
python app.py
```

2. Start the backend server:
```bash
cd backend
npm start
```

3. Start the frontend development server:
```bash
npm run dev
```

### Checking Service Status

You can verify all services are running correctly with:

```bash
npm run check-services    # For manually run services
npm run check-docker      # For Docker services
```

## AI-Powered Tactical Assistant

StatSor includes an AI-powered tactical assistant that can help with:

- Formation analysis and recommendations
- Player performance insights
- Match strategy and tactics
- Training drill suggestions
- Injury prevention advice

The AI assistant uses natural language processing to understand football-related queries and provide data-driven responses.

### AI Assistant Setup

See [AI Assistant Setup Guide](AI_ASSISTANT_SETUP.md) for detailed instructions.

## Project Structure

```
mm/
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── services/        # API services
│   ├── contexts/        # React contexts
│   └── lib/            # Utility libraries
├── backend/             # Backend server
│   ├── src/            # Backend source code
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Express middleware
│   │   └── services/   # Backend services
│   └── config/         # Configuration files
├── chatbot/             # AI Assistant (Python)
│   ├── app.py          # Main application
│   └── requirements.txt # Python dependencies
├── public/              # Static assets
└── tests/               # Test files
```

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
cd backend
npm run dev
```

### Testing

```bash
npm run test
>>>>>>> 5b1c6eafdf9968ae53e6d141d90a040247079721
```

## Deployment

<<<<<<< HEAD
For production deployment:

```bash
npm run deploy:docker
```

This will build and deploy all services using the production configuration.
=======
### Frontend

```bash
npm run build
npm run preview
```

### Backend

The backend can be deployed to any Node.js hosting platform like:
- Railway
- Heroku
- DigitalOcean App Platform
- AWS EC2

### AI Assistant

The AI assistant can be deployed to:
- Railway
- Heroku
- Any server with Python support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team.
>>>>>>> 5b1c6eafdf9968ae53e6d141d90a040247079721
