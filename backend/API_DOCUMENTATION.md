# 🚀 Statsor API Documentation

## 📋 **Overview**

The Statsor API is a comprehensive RESTful API that provides all the functionality needed for the football analytics platform. This documentation covers all endpoints, authentication, and usage examples.

**Base URL**: `http://localhost:3001/api`

---

## 🔐 **Authentication**

### **JWT Token Authentication**
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### **Getting a Token**
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Google OAuth: `POST /api/auth/google`

---

## 📊 **API Endpoints**

### **🔑 Authentication Endpoints**

#### **Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### **Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### **Google OAuth**
```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google_oauth_token"
}
```

#### **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### **👥 User Management Endpoints**

#### **Get User Profile**
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### **Update User Profile**
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": "New York",
  "bio": "Football coach and analyst"
}
```

#### **Change Password**
```http
PUT /api/user/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

#### **Get User Settings**
```http
GET /api/user/settings
Authorization: Bearer <token>
```

#### **Update User Settings**
```http
PUT /api/user/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "es",
  "timezone": "America/New_York"
}
```

---

### **🏆 Teams Management Endpoints**

#### **Get User Teams**
```http
GET /api/teams
Authorization: Bearer <token>
```

#### **Create Team**
```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Valencia CF",
  "description": "Professional football team",
  "sport": "football",
  "level": "professional"
}
```

#### **Get Team Details**
```http
GET /api/teams/{teamId}
Authorization: Bearer <token>
```

#### **Update Team**
```http
PUT /api/teams/{teamId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Valencia CF Updated",
  "description": "Updated description"
}
```

#### **Delete Team**
```http
DELETE /api/teams/{teamId}
Authorization: Bearer <token>
```

---

### **⚽ Players Management Endpoints**

#### **Get Players**
```http
GET /api/players?teamId={teamId}&position=forward&search=john
Authorization: Bearer <token>
```

#### **Create Player**
```http
POST /api/players
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "position": "forward",
  "number": 10,
  "teamId": "team_id_here",
  "email": "john@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1995-05-15",
  "height": 180,
  "weight": 75
}
```

#### **Get Player Details**
```http
GET /api/players/{playerId}
Authorization: Bearer <token>
```

#### **Update Player**
```http
PUT /api/players/{playerId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith Updated",
  "position": "midfielder",
  "number": 8
}
```

#### **Get Player Statistics**
```http
GET /api/players/{playerId}/stats?period=month&teamId={teamId}
Authorization: Bearer <token>
```

#### **Upload Player Photo**
```http
POST /api/players/{playerId}/photo
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoUrl": "https://example.com/photo.jpg"
}
```

---

### **🏟️ Matches Management Endpoints**

#### **Get Matches**
```http
GET /api/matches?teamId={teamId}&status=completed
Authorization: Bearer <token>
```

#### **Create Match**
```http
POST /api/matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "homeTeam": "Valencia CF",
  "awayTeam": "Barcelona",
  "date": "2024-08-15T20:00:00Z",
  "venue": "Mestalla Stadium",
  "competition": "La Liga",
  "teamId": "team_id_here"
}
```

#### **Get Match Details**
```http
GET /api/matches/{matchId}
Authorization: Bearer <token>
```

#### **Update Match**
```http
PUT /api/matches/{matchId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "homeScore": 2,
  "awayScore": 1,
  "status": "completed"
}
```

#### **Get Match Statistics**
```http
GET /api/matches/{matchId}/stats
Authorization: Bearer <token>
```

---

### **💳 Subscription & Payment Endpoints**

#### **Get Available Plans**
```http
GET /api/subscriptions/plans
```

#### **Get Current Subscription**
```http
GET /api/subscriptions/current
Authorization: Bearer <token>
```

#### **Create Subscription**
```http
POST /api/subscriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "pro",
  "paymentMethodId": "pm_1234567890",
  "billingCycle": "yearly"
}
```

#### **Cancel Subscription**
```http
POST /api/subscriptions/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancelAtPeriodEnd": true
}
```

#### **Upgrade Subscription**
```http
POST /api/subscriptions/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "club",
  "paymentMethodId": "pm_1234567890"
}
```

#### **Get Payment Methods**
```http
GET /api/subscriptions/payment-methods
Authorization: Bearer <token>
```

#### **Add Payment Method**
```http
POST /api/subscriptions/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "card",
  "cardNumber": "4242424242424242",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123"
}
```

---

### **📁 File Upload Endpoints**

#### **Upload Image**
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: [file]
- category: "team"
- description: "Team photo"
- tags: ["photo", "team"]
```

#### **Upload Multiple Images**
```http
POST /api/upload/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- images: [files]
- category: "match"
- description: "Match photos"
```

#### **Upload Document**
```http
POST /api/upload/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- document: [file]
- category: "report"
- description: "Match report"
```

#### **Upload Player Photo**
```http
POST /api/upload/player-photo/{playerId}
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- photo: [file]
```

#### **Upload Team Logo**
```http
POST /api/upload/team-logo/{teamId}
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- logo: [file]
```

#### **Get User Files**
```http
GET /api/upload/files?category=image&search=photo
Authorization: Bearer <token>
```

#### **Delete File**
```http
DELETE /api/upload/files/{fileId}
Authorization: Bearer <token>
```

---

### **📊 Analytics Endpoints**

#### **Get Dashboard Statistics**
```http
GET /api/analytics/dashboard?period=month&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### **Get Team Analytics**
```http
GET /api/analytics/team/{teamId}?period=month
Authorization: Bearer <token>
```

#### **Get Player Analytics**
```http
GET /api/analytics/player/{playerId}?period=month
Authorization: Bearer <token>
```

#### **Get Match Analytics**
```http
GET /api/analytics/matches?teamId={teamId}&period=month
Authorization: Bearer <token>
```

#### **Get Performance Metrics**
```http
GET /api/analytics/performance?teamId={teamId}&playerId={playerId}&period=month
Authorization: Bearer <token>
```

#### **Get Goal Analytics**
```http
GET /api/analytics/goals?teamId={teamId}&playerId={playerId}&period=month
Authorization: Bearer <token>
```

#### **Get Assist Analytics**
```http
GET /api/analytics/assists?teamId={teamId}&playerId={playerId}&period=month
Authorization: Bearer <token>
```

#### **Get Attendance Analytics**
```http
GET /api/analytics/attendance?teamId={teamId}&period=month
Authorization: Bearer <token>
```

#### **Export Analytics Data**
```http
POST /api/analytics/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "dashboard",
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "teamId": "team_id_here",
  "metrics": ["goals", "assists", "attendance"]
}
```

#### **Get AI Insights**
```http
GET /api/analytics/insights?teamId={teamId}&playerId={playerId}
Authorization: Bearer <token>
```

#### **Get Performance Predictions**
```http
GET /api/analytics/predictions?teamId={teamId}&playerId={playerId}&horizon=30
Authorization: Bearer <token>
```

---

### **🤖 AI Chatbot Endpoints**

#### **Send Message to AI**
```http
POST /api/chatbot/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What's the best formation for my team?",
  "context": {
    "teamId": "team_id_here",
    "matchId": "match_id_here"
  }
}
```

#### **Get Chat History**
```http
GET /api/chatbot/history?page=1&limit=20
Authorization: Bearer <token>
```

#### **Get AI Suggestions**
```http
POST /api/chatbot/suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "tactical",
  "teamId": "team_id_here",
  "context": "upcoming match"
}
```

#### **Internet Search**
```http
GET /api/chatbot/search?query=latest football tactics
Authorization: Bearer <token>
```

---

### **📧 Email & Feedback Endpoints**

#### **Submit Feedback**
```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "bug",
  "subject": "Login issue",
  "message": "Cannot login with Google OAuth",
  "priority": "high"
}
```

#### **Get Feedback List**
```http
GET /api/feedback?type=bug&status=open
Authorization: Bearer <token>
```

---

## 🔧 **System Endpoints**

### **Health Check**
```http
GET /api/health
```

### **API Status**
```http
GET /api/status
```

### **API Documentation**
```http
GET /api/docs
```

---

## 📝 **Response Format**

All API responses follow a consistent format:

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🚨 **Error Codes**

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Invalid data format |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## 🔒 **Rate Limiting**

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **File upload endpoints**: 50 requests per 15 minutes
- **AI chatbot endpoints**: 30 requests per 15 minutes

---

## 📋 **Query Parameters**

### **Pagination**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### **Filtering**
- `search`: Search term
- `category`: Filter by category
- `status`: Filter by status
- `teamId`: Filter by team
- `playerId`: Filter by player

### **Date Range**
- `startDate`: Start date (ISO 8601 format)
- `endDate`: End date (ISO 8601 format)
- `period`: Time period (day, week, month, quarter, year)

### **Sorting**
- `sortBy`: Field to sort by
- `sortOrder`: asc or desc

---

## 🧪 **Testing Examples**

### **Using cURL**

#### **Register User**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

#### **Login User**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### **Create Team**
```bash
curl -X POST http://localhost:3001/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Team",
    "description": "A test team",
    "sport": "football"
  }'
```

### **Using JavaScript/Fetch**

#### **Get User Profile**
```javascript
const response = await fetch('http://localhost:3001/api/user/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();
console.log(data);
```

#### **Upload File**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('category', 'team');

const response = await fetch('http://localhost:3001/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

---

## 🚀 **Getting Started**

1. **Start the backend server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Test the API**:
   ```bash
   curl http://localhost:3001/api/health
   ```

4. **Register a user and start using the API!**

---

## 📞 **Support**

For API support and questions:
- **Email**: api-support@statsor.com
- **Documentation**: https://docs.statsor.com/api
- **GitHub Issues**: https://github.com/statsor/backend/issues

---

**🎯 Ready to build amazing football analytics applications with the Statsor API!** 