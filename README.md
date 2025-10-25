# StatSor - Football Management Platform

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

Create a `.env` file in the root directory with the following variables:

```env
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
```

## Deployment

For production deployment:

```bash
npm run deploy:docker
```

This will build and deploy all services using the production configuration.