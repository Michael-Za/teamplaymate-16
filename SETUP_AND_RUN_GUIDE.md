# StatSor Platform Setup and Run Guide

This guide provides complete instructions for setting up and running the StatSor platform with real data services instead of mock implementations.

## Prerequisites

1. Python 3.8 or higher
2. Node.js 16 or higher
3. npm (comes with Node.js)
4. Git (optional, for cloning the repository)

## Step-by-Step Setup

### 1. Environment Configuration

#### 1.1 Chatbot Environment
Create a `.env` file in the `chatbot` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
FLASK_ENV=development
FLASK_APP=app.py
BACKEND_API_URL=http://localhost:3001/api/v1
```

#### 1.2 Backend Environment
Create a `.env` file in the `backend` directory:

```env
# Application Configuration
NODE_ENV=development
PORT=3001
APP_NAME=Statsor
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (Replace with your actual credentials)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (Alternative to Supabase)
DATABASE_URL=postgresql://username:password@localhost:5432/statsor

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration (Use strong, random secrets)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_at_least_32_characters_long

# Google OAuth Configuration (Replace with your actual credentials)
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

### 2. Install Dependencies

#### 2.1 Chatbot Dependencies
```bash
cd chatbot
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

#### 2.2 Backend Dependencies
```bash
cd backend
npm install
```

### 3. Database Setup

#### 3.1 Supabase Setup
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your project URL and API keys
4. Update the `.env` file with your Supabase credentials

#### 3.2 Database Initialization
```bash
cd backend
node init-database.js
```

### 4. Service Configuration

#### 4.1 Email Service (Resend)
1. Create a Resend account at https://resend.com
2. Get your API key
3. Update the `.env` file with your Resend credentials

#### 4.2 Google OAuth
1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable Google OAuth APIs
3. Create OAuth credentials
4. Update the `.env` file with your Google credentials

#### 4.3 Groq API
The Groq API key is already provided in the chatbot `.env` file. You can also get your own at https://console.groq.com

## Running the Services

### Option 1: Manual Start

#### Start Chatbot
```
cd chatbot
python app.py
```

#### Start Backend
```bash
cd backend
npm start
```

### Option 2: Automated Start
```
python start_services.py
```

## Verifying the Setup

### 1. Health Checks
Once services are running, verify them:

```bash
# Chatbot health check
curl http://localhost:5000/health

# Backend health check
curl http://localhost:3001/health
```

### 2. API Testing

#### Chatbot Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about my team", "context": {}}'
```

#### Backend Players Endpoint
```bash
curl http://localhost:3001/api/v1/players
```

## Service URLs

- **Chatbot**: http://localhost:5000
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000 (if running)

## Key Features Implemented

### 1. Real Authentication
- User registration with email verification
- Login with password hashing
- Google OAuth integration
- JWT token authentication

### 2. Real Database Operations
- Player management (CRUD operations)
- Team management
- Match tracking
- Analytics data storage

### 3. Email Services
- Welcome emails for new users
- Password reset functionality
- Notification emails

### 4. AI Assistant
- Groq API integration for advanced NLP
- Real data access for analysis
- Agent capabilities for team management
- Tactical recommendations

### 5. Real-time Features
- WebSocket connections
- Live match updates
- Real-time notifications

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Change the PORT in `.env` files
   - Default ports: Chatbot (5000), Backend (3001)

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure Supabase project is active

3. **Email Service Not Working**
   - Verify SMTP credentials
   - Check firewall settings
   - Test with a simple email script

4. **Google OAuth Not Working**
   - Verify client ID and secret
   - Check redirect URIs in Google Console
   - Ensure proper OAuth scopes

### Testing Scripts

Run the provided test scripts to verify all services:

```bash
# Test implementation
python verify_implementation.py

# Test chatbot integration
cd chatbot
python test_groq_integration.py

# Test backend services
python test_backend_services.py
```

## Production Deployment

### Environment Variables for Production

Update your `.env` files with production values:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SUPABASE_URL=your_production_supabase_url
```

### Security Considerations

1. Use strong, random secrets for JWT
2. Enable HTTPS in production
3. Configure proper CORS settings
4. Use production database credentials
5. Implement rate limiting
6. Regular security audits

### Scaling Recommendations

1. Use Redis for session storage
2. Implement load balancing
3. Use database connection pooling
4. Enable caching for frequently accessed data
5. Monitor performance metrics
6. Set up logging and error tracking

## Monitoring and Maintenance

### Health Endpoints

All services provide health check endpoints:
- `/health` - Basic service health
- `/health/db` - Database connectivity (Backend)
- `/health/redis` - Redis connectivity (Backend)

### Logging

Services log important events for monitoring:
- Error logs
- Performance metrics
- User activity
- Security events

### Updates

Regularly update dependencies:
```
# Backend
cd backend
npm update

# Chatbot
cd chatbot
pip install --upgrade -r requirements.txt
```

## Conclusion

This setup ensures that all backend services are working with real data implementations rather than mock code. The platform provides:

1. **Real User Authentication** - Working sign up/in with proper password handling
2. **Google Services Integration** - OAuth authentication with account linking
3. **Email Services** - Resend SMTP integration for welcome and notification emails
4. **Database Operations** - Supabase integration for all data storage needs
5. **Password Reset** - Functional password reset with email verification
6. **AI Chatbot** - Groq API integration for advanced natural language processing
7. **Agent Capabilities** - Real team management functionality with data access

The implementation is now ready for production use with all services working with real data instead of mock implementations.