# Deployment Guide

## Vercel Deployment

To deploy this application to Vercel:

### 1. Prerequisites
- A Vercel account
- A Git repository (GitHub, GitLab, or Bitbucket)
- Your backend API deployed and accessible via HTTPS

### 2. Deployment Steps

1. **Push your code to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in to your account
   - Click "New Project"
   - Import your Git repository
   - Configure the project settings:
     - Framework Preset: `Vite`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Set Environment Variables**
   In your Vercel project settings, add the following environment variables:
   ```
   VITE_API_URL=https://your-backend-domain.com
   BACKEND_URL=https://your-backend-domain.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your application will be available at the provided URL

### 3. Backend Deployment

Since Vercel only hosts static sites and serverless functions, you'll need to deploy your backend separately. Options include:

1. **Heroku** (easiest for Node.js apps)
2. **DigitalOcean App Platform**
3. **AWS Elastic Beanstalk**
4. **Google Cloud Run**
5. **Azure App Service**

### 4. Environment Configuration

For local development:
```bash
# Create a .env file in the root directory
VITE_API_URL=http://localhost:3008
```

For production deployment:
```bash
# Set in Vercel environment variables
VITE_API_URL=https://your-production-backend.com
```

### 5. CORS Configuration

Make sure your backend is configured to accept requests from your Vercel domain:
```javascript
// In your backend app.js
app.use(cors({
  origin: [
    'http://localhost:3009',
    'https://your-vercel-domain.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 6. Domain Configuration

To use a custom domain:
1. In Vercel, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update your backend CORS settings to include your custom domain

## Alternative: Full Stack Deployment

If you want to deploy both frontend and backend together, consider:
1. **Docker deployment** to a cloud provider
2. **Railway** or **Render** for full stack deployments
3. **Fly.io** for containerized applications

The docker-compose.yml file is configured for this purpose.