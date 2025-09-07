# Google OAuth Setup Guide for Statsor

This guide will help you set up functional Google OAuth authentication for both sign-in and sign-up in the Statsor application.

## 🚀 Current Implementation Status

✅ **IMPLEMENTED & WORKING:**
- Google OAuth flow in AuthContext
- Google sign-in/sign-up buttons in UI
- Google callback handling
- Mock/Demo mode for development
- Error handling and user feedback
- Responsive UI with loading states
- Environment configuration

## 📋 Prerequisites

1. Google Cloud Console account
2. Project domain (for production)
3. SSL certificate (for production)

## 🔧 Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your Project ID

2. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity Toolkit API"

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set the name (e.g., "Statsor Web Client")

4. **Configure Authorized Origins:**
   ```
   Development:
   http://localhost:3006
   
   Production:
   https://yourdomain.com
   ```

5. **Configure Authorized Redirect URIs:**
   ```
   Development:
   http://localhost:3006/auth/google/callback
   
   Production:
   https://yourdomain.com/auth/google/callback
   ```

6. **Save and Download:**
   - Save the configuration
   - Note your Client ID and Client Secret

### Step 2: Environment Configuration

1. **Update your `.env` file:**
   ```bash
   # Google OAuth Configuration
   VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   VITE_ENABLE_GOOGLE_AUTH=true
   VITE_ENABLE_MOCK_AUTH=false  # Set to true for demo mode
   ```

2. **For Production:**
   ```bash
   VITE_APP_URL=https://yourdomain.com
   VITE_GOOGLE_CLIENT_ID=your_production_client_id
   VITE_ENABLE_MOCK_AUTH=false
   ```

### Step 3: Backend API Integration (Optional)

If you want to implement real backend integration instead of mock responses:

1. **Update `src/lib/api.ts`:**
   - Replace the mock `verifyGoogleToken` function
   - Implement actual API calls to your backend

2. **Backend Implementation (Node.js/Express example):**
   ```javascript
   app.post('/api/auth/google', async (req, res) => {
     const { code } = req.body;
     
     try {
       // Exchange code for access token
       const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           client_id: process.env.GOOGLE_CLIENT_ID,
           client_secret: process.env.GOOGLE_CLIENT_SECRET,
           code: code,
           grant_type: 'authorization_code',
           redirect_uri: `${process.env.APP_URL}/auth/google/callback`
         })
       });
       
       const tokens = await tokenResponse.json();
       
       // Get user info from Google
       const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
         headers: { Authorization: `Bearer ${tokens.access_token}` }
       });
       
       const googleUser = await userResponse.json();
       
       // Create or update user in your database
       const user = await createOrUpdateUser(googleUser);
       
       // Generate JWT token
       const authToken = generateJWT(user);
       
       res.json({
         success: true,
         data: { user, token: authToken }
       });
     } catch (error) {
       res.status(400).json({
         success: false,
         message: 'Google authentication failed'
       });
     }
   });
   ```

## 🎯 Testing the Implementation

### Development Mode (Mock)
1. Set `VITE_ENABLE_MOCK_AUTH=true` in `.env`
2. Click "Continue with Google" button
3. Should immediately create a demo user and sign in

### Production Mode (Real Google OAuth)
1. Set your real Google Client ID in `.env`
2. Set `VITE_ENABLE_MOCK_AUTH=false`
3. Click "Continue with Google" button
4. Should redirect to Google for authentication
5. After approval, redirects back to `/auth/google/callback`
6. Processes the callback and signs in the user

## 🔍 Troubleshooting

### Common Issues:

1. **"Google OAuth not configured" error:**
   - Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env`
   - Restart the development server after changing `.env`

2. **Redirect URI mismatch:**
   - Ensure the redirect URI in Google Console matches exactly
   - Check for trailing slashes and HTTP vs HTTPS

3. **CORS errors:**
   - Ensure your domain is added to authorized origins
   - Check that you're using the correct protocol (HTTP/HTTPS)

4. **"Invalid client" error:**
   - Verify your Client ID is correct
   - Check that the Google+ API is enabled

### Debug Mode:
Enable debug logging by setting `VITE_DEBUG_MODE=true` in your `.env` file.

## 🌟 Features Included

### User Experience:
- ✅ Smooth loading states during authentication
- ✅ Clear error messages with recovery options
- ✅ Visual feedback with Google branding
- ✅ Responsive design for all screen sizes
- ✅ Toast notifications for user feedback

### Security:
- ✅ CSRF protection with state parameter
- ✅ Secure token handling
- ✅ Error boundary protection
- ✅ Input validation

### Functionality:
- ✅ Both sign-in and sign-up with Google
- ✅ User profile data from Google (name, email, picture)
- ✅ Automatic user creation/update
- ✅ Integration with existing auth system
- ✅ Sport selection flow for new users
- ✅ Subscription initialization

## 📱 User Flow

1. **User clicks "Continue with Google"**
2. **Loading state shows** with "Redirecting to Google..." message
3. **Redirect to Google OAuth** (or mock demo if enabled)
4. **User authorizes** the application
5. **Redirect back** to `/auth/google/callback`
6. **Processing callback** with loading animation
7. **Success feedback** and redirect to dashboard
8. **Sport selection** (if new user)

## 🔒 Security Considerations

- Store Client Secret securely (backend only)
- Use HTTPS in production
- Validate redirect URIs
- Implement rate limiting
- Log authentication attempts
- Use secure cookies for sessions

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your Google Cloud Console configuration
3. Test with mock mode first (`VITE_ENABLE_MOCK_AUTH=true`)
4. Check network requests in browser dev tools

The implementation includes comprehensive error handling and user feedback to help diagnose issues quickly.