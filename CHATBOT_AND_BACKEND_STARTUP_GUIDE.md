# Chatbot and Backend Services Startup Guide

This guide provides instructions for setting up and running the AI Football Assistant chatbot and backend services with real data implementations.

## Prerequisites

1. Python 3.8 or higher
2. Node.js 16 or higher
3. PostgreSQL or Supabase account
4. Redis server (optional but recommended)
5. Groq API key
6. Email service credentials (Resend/Gmail/SMTP)

## 1. Chatbot Setup

### 1.1 Install Python Dependencies

```bash
cd chatbot
pip install -r requirements.txt
```

### 1.2 Install spaCy Language Model

```bash
python -m spacy download en_core_web_sm
```

### 1.3 Configure Environment Variables

Create a `.env` file in the `chatbot` directory with the following content:

```env
GROQ_API_KEY=your_groq_api_key_here
FLASK_ENV=development
FLASK_APP=app.py
BACKEND_API_URL=http://localhost:3001/api/v1
```

### 1.4 Run the Chatbot

```bash
cd chatbot
python app.py
```

The chatbot will be available at `http://localhost:5000`

## 2. Backend Services Setup

### 2.1 Install Node.js Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# Application Configuration
NODE_ENV=development
PORT=3001
APP_NAME=Statsor
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (Alternative to Supabase)
DATABASE_URL=postgresql://username:password@localhost:5432/statsor

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_at_least_32_characters_long

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service Configuration (Resend)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
EMAIL_FROM=noreply@statsor.com

# AI Services
GROQ_API_KEY=your_groq_api_key

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 2.3 Initialize Database

```bash
cd backend
node init-database.js
```

### 2.4 Run Backend Services

```bash
cd backend
npm start
```

The backend will be available at `http://localhost:3001`

## 3. Testing the Integration

### 3.1 Test Chatbot Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Chat endpoint
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about my team", "context": {}}'
```

### 3.2 Test Backend Endpoints

```bash
# Health check
curl http://localhost:3001/health

# API documentation
curl http://localhost:3001/api/docs
```

## 4. Real Data Implementation

### 4.1 Player Management

The backend provides real player management through the following endpoints:

- `GET /api/v1/players` - List all players
- `POST /api/v1/players` - Create a new player
- `GET /api/v1/players/:id` - Get player details
- `PUT /api/v1/players/:id` - Update player information
- `DELETE /api/v1/players/:id` - Delete a player

### 4.2 Team Management

- `GET /api/v1/teams` - List all teams
- `POST /api/v1/teams` - Create a new team
- `GET /api/v1/teams/:id` - Get team details
- `PUT /api/v1/teams/:id` - Update team information

### 4.3 Match Tracking

- `GET /api/v1/matches` - List all matches
- `POST /api/v1/matches` - Create a new match
- `GET /api/v1/matches/:id` - Get match details
- `PUT /api/v1/matches/:id` - Update match information

### 4.4 Analytics

- `GET /api/v1/analytics/overview` - Dashboard analytics
- `GET /api/v1/analytics/players/:id` - Player performance
- `GET /api/v1/analytics/teams/:id` - Team statistics

## 5. AI Assistant Features

### 5.1 Data Analysis

The AI assistant can analyze real team data including:
- Player performance metrics
- Team statistics
- Match predictions
- Tactical recommendations

### 5.2 Agent Capabilities

The AI assistant can perform actions such as:
- Adding/removing players
- Scheduling matches
- Updating team information
- Providing tactical advice

### 5.3 Integration with Backend

The chatbot connects to the backend API to fetch real data:
- Player information
- Team statistics
- Match history
- Training sessions

## 6. Email Services

### 6.1 Welcome Emails

New users receive welcome emails through the Resend SMTP service.

### 6.2 Password Reset

Users can request password resets with verification codes sent to their email.

### 6.3 Notification Emails

Important notifications are sent via email to keep users informed.

## 7. Google Authentication

### 7.1 OAuth Flow

Users can sign in with their Google accounts using OAuth 2.0.

### 7.2 Account Linking

Existing accounts can be linked with Google for easier authentication.

## 8. Troubleshooting

### 8.1 Common Issues

1. **Groq API Key Not Found**
   - Ensure the `.env` file is properly configured in the chatbot directory
   - Verify the API key is correct

2. **Database Connection Failed**
   - Check Supabase credentials
   - Verify network connectivity to Supabase

3. **Email Service Not Working**
   - Verify SMTP credentials
   - Check firewall settings

4. **Google OAuth Not Working**
   - Verify client ID and secret
   - Check redirect URIs in Google Console

### 8.2 Testing Scripts

Run the provided test scripts to verify all services are working:

```bash
# Test chatbot integration
cd chatbot
python test_groq_integration.py

# Test backend services
python ../test_backend_services.py
```

## 9. Production Deployment

### 9.1 Environment Variables

For production, update the environment variables to use production values:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SUPABASE_URL=your_production_supabase_url
```

### 9.2 Security Considerations

- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS settings
- Use production database credentials

### 9.3 Scaling

- Use Redis for session storage
- Implement load balancing
- Use database connection pooling
- Enable caching for frequently accessed data

## 10. Monitoring and Maintenance

### 10.1 Health Checks

Regular health checks are available at:
- `/health` - Basic service health
- `/health/db` - Database connectivity
- `/health/redis` - Redis connectivity

### 10.2 Logging

All services log important events for monitoring and debugging.

### 10.3 Updates

Regularly update dependencies to ensure security and performance.

---

This guide ensures that all backend services are working with real data implementations rather than mock code. The chatbot is integrated with the Groq API for advanced AI capabilities and connects to the backend to access real user data for analysis, predictions, and advice.