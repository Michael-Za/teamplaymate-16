# 🆓 Statsor.com - 100% FREE Deployment Guide

## 🎯 **ZERO COST SOLUTION - No Credit Cards Required**

This guide shows you how to deploy statsor.com using **completely FREE services** with no trials or credit card requirements.

---

## 🆓 **100% FREE Services Stack**

### **🌐 Hosting & Infrastructure**
- **Frontend**: Netlify (FREE - 100GB bandwidth/month)
- **Backend**: Railway.app (FREE - 512MB RAM, 8GB storage)
- **Database**: Supabase (FREE - 500MB database, 2GB file storage)
- **Domain**: Use your existing statsor.com domain

### **🔧 Services & APIs**
- **Authentication**: Supabase Auth (FREE)
- **Email**: Gmail SMTP (FREE with your Gmail account)
- **File Storage**: Supabase Storage (FREE - 2GB)
- **SSL Certificate**: Automatic (FREE)
- **CDN**: Automatic (FREE)

### **📊 Monitoring & Analytics**
- **Analytics**: Google Analytics (FREE)
- **Error Monitoring**: Sentry (FREE tier - 5,000 errors/month)
- **Uptime Monitoring**: UptimeRobot (FREE - 50 monitors)

---

## 🚀 **Quick Deploy (15 Minutes)**

### **Step 1: Database Setup (Supabase) - 3 minutes**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign in with GitHub
3. Create organization → Create project:
   - Name: `statsor-production`
   - Database password: Generate strong password
   - Region: Closest to your users
4. Wait for setup (2-3 minutes)

### **Step 2: Frontend Deployment (Netlify) - 5 minutes**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub (no credit card needed)
3. "New site from Git" → Connect GitHub
4. Select your statsor repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy site → Get your netlify URL

### **Step 3: Backend Deployment (Railway) - 5 minutes**
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub (no credit card needed)
3. "Deploy from GitHub repo" → Select statsor repository
4. Choose `backend` folder
5. Add environment variables (from Supabase)
6. Deploy → Get your railway API URL

### **Step 4: Connect Your Domain - 2 minutes**
1. In Netlify: Domain settings → Add custom domain → statsor.com
2. Update DNS records as instructed
3. SSL certificate will be automatically generated

---

## 📋 **Detailed Free Setup Guide**

### **🗄️ Database Setup (Supabase - FREE)**

1. **Create Supabase Project:**
   ```
   - Go to supabase.com
   - Sign in with GitHub (free)
   - Create new project: "statsor-production"
   - Choose free tier (no credit card needed)
   ```

2. **Setup Database Schema:**
   - Go to SQL Editor in Supabase dashboard
   - Run the migration files from `/supabase/migrations/`
   - Enable Row Level Security (RLS)

3. **Get API Keys:**
   ```
   Settings → API → Copy these values:
   - SUPABASE_URL: https://your-project.supabase.co
   - SUPABASE_ANON_KEY: your_anon_key
   - SUPABASE_SERVICE_ROLE_KEY: your_service_role_key
   ```

### **🌐 Frontend Deployment (Netlify - FREE)**

1. **Deploy to Netlify:**
   ```bash
   # Connect your GitHub repository to Netlify
   # Build settings:
   Build command: npm run build
   Publish directory: dist
   
   # Environment variables:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=https://your-backend.railway.app
   ```

2. **Connect Custom Domain:**
   ```
   Domain settings → Add custom domain → statsor.com
   Update DNS: CNAME www.statsor.com → your-site.netlify.app
   ```

### **⚙️ Backend Deployment (Railway - FREE)**

1. **Deploy to Railway:**
   ```bash
   # Connect your GitHub repository to Railway
   # Select backend folder
   # Automatic deployment on git push
   ```

2. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_generated_secret_key_32_chars_minimum
   FRONTEND_URL=https://statsor.com
   ```

### **📧 Email Setup (Gmail SMTP - FREE)**

1. **Enable 2-Factor Authentication:**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn on

2. **Generate App Password:**
   - Security → App passwords → Select app: Mail
   - Generate password → Save this password

3. **Add to Environment:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_generated_app_password
   EMAIL_FROM=noreply@statsor.com
   ```

---

## 🔧 **Free Configuration Files**

### **Netlify Configuration**
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.railway.app/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

### **Railway Configuration**
Create `railway.json` in backend folder:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🆓 **Free Service Limits & Scaling**

### **Current FREE Limits:**
- **Netlify**: 100GB bandwidth/month, unlimited sites
- **Railway**: 512MB RAM, 8GB storage, 100GB bandwidth
- **Supabase**: 500MB database, 2GB file storage, 50MB file uploads
- **Gmail SMTP**: 500 emails/day

### **When to Upgrade (Optional):**
- **High traffic**: Netlify Pro ($19/month) for more bandwidth
- **More users**: Railway Pro ($5/month) for more resources  
- **Large database**: Supabase Pro ($25/month) for unlimited
- **Bulk emails**: SendGrid paid plans

---

## 🚀 **Deployment Scripts (Free)**

### **Auto-Deploy Script for Free Services**
```bash
#!/bin/bash

echo "🆓 Deploying Statsor.com - 100% FREE Version"

# Step 1: Install Netlify CLI
npm install -g netlify-cli

# Step 2: Build frontend
npm run build

# Step 3: Deploy to Netlify
netlify deploy --prod --dir=dist

# Step 4: Backend to Railway
echo "Please push your backend to GitHub"
echo "Railway will auto-deploy from GitHub"

echo "✅ Free deployment complete!"
echo "Frontend: Your Netlify URL"
echo "Backend: Your Railway URL"
echo "Database: Your Supabase project"
```

---

## ✅ **Testing Your Free Deployment**

### **Frontend Tests:**
- [ ] Visit https://statsor.com
- [ ] Check responsive design on mobile
- [ ] Test navigation and routing
- [ ] Verify API connection

### **Backend Tests:**
- [ ] API health check: https://your-backend.railway.app/api/v1/health
- [ ] User registration
- [ ] User login
- [ ] Database operations

### **Features Tests:**
- [ ] User authentication works
- [ ] Player management functions
- [ ] File uploads to Supabase storage
- [ ] Email notifications send
- [ ] Dashboard loads correctly

---

## 🔧 **Free Troubleshooting**

### **Common Free Tier Issues:**

1. **Build Failures:**
   ```bash
   # Check build logs in Netlify/Railway
   # Ensure all dependencies are in package.json
   # Verify environment variables
   ```

2. **API Connection Issues:**
   ```bash
   # Check CORS settings in backend
   # Verify API URL in frontend environment
   # Test API endpoints directly
   ```

3. **Database Connection:**
   ```bash
   # Verify Supabase URL and keys
   # Check RLS policies
   # Test connection in Supabase dashboard
   ```

4. **Email Not Working:**
   ```bash
   # Verify Gmail app password
   # Check spam folder for test emails
   # Test SMTP settings
   ```

---

## 🎉 **Free Success Checklist**

After free deployment, you should have:

✅ **Live Website**: https://statsor.com working perfectly
✅ **User System**: Registration, login, profiles all working
✅ **Database**: All player data and analytics stored
✅ **Email**: Welcome emails and notifications working
✅ **File Uploads**: Player photos uploading to Supabase
✅ **Mobile Ready**: Responsive design on all devices
✅ **SSL Secure**: HTTPS automatically enabled
✅ **Fast Loading**: CDN and optimizations active

## 💸 **Total Cost: $0.00/month**

The only cost is your domain name (statsor.com) which you already own!

---

## 🚀 **Optional Free Upgrades**

### **Free Analytics:**
- Google Analytics 4 (completely free)
- Supabase Analytics (included in free tier)
- Netlify Analytics (basic version free)

### **Free Monitoring:**
- UptimeRobot (50 monitors free)
- Sentry error tracking (5,000 errors/month free)
- Railway logs (included)

### **Free CDN & Performance:**
- Netlify global CDN (included)
- Automatic image optimization (included)
- Gzip compression (automatic)

---

This FREE setup will give you a fully functional statsor.com with professional features, no credit card required, and room to grow!