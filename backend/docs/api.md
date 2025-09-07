# Statsor Backend API Documentation

## Overview
This document provides comprehensive documentation for the Statsor Backend API, a production-ready microservices architecture for football analytics.

## Base URL
```
Production: https://api.statsor.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication
All API endpoints require authentication unless otherwise specified. The API uses JWT (JSON Web Tokens) for authentication.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Key: <api_key> (for external integrations)
```

## Rate Limiting
- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

## Response Format
All API responses follow a consistent format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "errors": array,
  "meta": {
    "timestamp": "ISO 8601 timestamp",
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Endpoints

### Authentication
#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "coach"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "coach"
    },
    "token": "jwt_token"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### POST /auth/logout
Logout user (invalidate token).

#### POST /auth/refresh
Refresh JWT token.

#### POST /auth/forgot-password
Request password reset.

#### POST /auth/reset-password
Reset password with token.

### Users
#### GET /user/profile
Get current user profile.

#### PUT /user/profile
Update current user profile.

#### POST /user/change-password
Change user password.

#### GET /user/users
Get list of users (admin only).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role
- `search` (string): Search by name or email

### Teams
#### GET /team/teams
Get list of teams.

#### POST /team/teams
Create a new team.

**Request Body:**
```json
{
  "name": "Team Name",
  "sport": "football",
  "category": "Senior",
  "season": "2023/24",
  "coachId": "uuid"
}
```

#### GET /team/teams/:id
Get team by ID.

#### PUT /team/teams/:id
Update team.

#### DELETE /team/teams/:id
Delete team.

#### GET /team/teams/:id/players
Get team players.

#### POST /team/teams/:id/players
Add player to team.

### Players
#### GET /team/players
Get list of players.

#### POST /team/players
Create a new player.

**Request Body:**
```json
{
  "name": "Player Name",
  "number": 10,
  "position": "midfielder",
  "teamId": "uuid",
  "birthDate": "1995-01-01"
}
```

#### GET /team/players/:id
Get player by ID.

#### PUT /team/players/:id
Update player.

#### DELETE /team/players/:id
Delete player.

#### GET /team/players/:id/statistics
Get player statistics.

### Matches
#### GET /match/matches
Get list of matches.

#### POST /match/matches
Create a new match.

**Request Body:**
```json
{
  "homeTeamId": "uuid",
  "awayTeamId": "uuid",
  "date": "2024-01-15T15:00:00Z",
  "venue": "Stadium Name"
}
```

#### GET /match/matches/:id
Get match by ID.

#### PUT /match/matches/:id
Update match.

#### DELETE /match/matches/:id
Delete match.

#### POST /match/matches/:id/events
Add match event.

#### GET /match/matches/:id/statistics
Get match statistics.

### Analytics
#### GET /analytics/reports
Get analytics reports.

#### POST /analytics/reports
Generate analytics report.

#### GET /analytics/reports/:id
Get specific report.

#### GET /analytics/player-performance
Get player performance analytics.

#### GET /analytics/team-performance
Get team performance analytics.

#### GET /analytics/match-analysis
Get match analysis.

### Files
#### POST /file/upload
Upload file.

**Request:**
- Content-Type: multipart/form-data
- Max file size: 10MB

#### GET /file/files/:id
Download file.

#### DELETE /file/files/:id
Delete file.

## WebSocket Events
Real-time events are available via WebSocket connection at `/ws`.

### Events
- `match.live_update` - Live match updates
- `notification.new` - New notifications
- `analytics.report_ready` - Analytics report completed

## GraphQL
GraphQL endpoint is available at `/graphql` for complex queries and real-time subscriptions.

### Example Query
```graphql
query GetTeamWithPlayers($teamId: ID!) {
  team(id: $teamId) {
    id
    name
    sport
    players {
      id
      name
      position
      statistics {
        goals
        assists
      }
    }
  }
}
```

## SDK and Libraries
Official SDKs are available for:
- JavaScript/TypeScript
- Python
- PHP
- Java

## Postman Collection
Import our Postman collection for easy API testing:
[Download Collection](./postman/statsor-api.json)

## Support
For API support, contact: api-support@statsor.com