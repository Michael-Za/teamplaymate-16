# 🚀 Statsor.com Complete Deployment Guide

## 📋 Overview
This guide will help you deploy your Statsor football management platform to **statsor.com** with full functionality including user authentication, player management, analytics, and payments.

## 🏗️ Architecture
- **Frontend**: React + TypeScript + Vite (https://statsor.com)
- **Backend**: Node.js + Express API (https://api.statsor.com)
- **Database**: Supabase PostgreSQL
- **Cache**: Redis
- **File Storage**: Cloudflare R2
- **Email**: Gmail SMTP or SendGrid
- **Payments**: Stripe + PayPal
- **Authentication**: JWT + Google OAuth

## 🎯 What You'll Have After Deployment
✅ **Fully functional statsor.com website**
✅ **User registration and login system**
✅ **Google OAuth authentication**
✅ **Player management system**
✅ **Real-time analytics dashboard**
✅ **File upload functionality**
✅ **Payment processing (subscriptions)**
✅ **Email notifications**
✅ **Admin panel**
✅ **Mobile-responsive design**

---

## 📋 Prerequisites

### 1. Server Requirements
- **VPS/Dedicated Server** with:
  - 4GB+ RAM
  - 2+ CPU cores
  - 50GB+ SSD storage
  - Ubuntu 20.04+ or CentOS 8+
  - Root access

### 2. Domain Setup
- Point your DNS records to your server:
  ```dns
  A     statsor.com        -> YOUR_SERVER_IP
  A     www.statsor.com    -> YOUR_SERVER_IP
  A     api.statsor.com    -> YOUR_SERVER_IP
  ```

### 3. Required Services & API Keys

#### 🔥 **Critical Services (Must Have)**
1. **Supabase Account** - Database & Auth Backend
2. **Google Cloud Console** - OAuth Authentication
3. **Email Service** - Gmail SMTP or SendGrid
4. **Domain & Hosting** - Your statsor.com server

#### 💰 **Payment Services (Recommended)**
5. **Stripe Account** - Credit card processing
6. **PayPal Developer Account** - PayPal payments

#### 📁 **File Storage (Recommended)**
7. **Cloudflare R2** - File uploads & storage

---

## 🚀 Quick Deployment (Automated)

### Option 1: One-Click Deployment
```bash
# On your server, run:
wget https://raw.githubusercontent.com/your-repo/deploy-production.sh
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option 2: Manual Step-by-Step
Follow the detailed steps below...

---

## 📋 Step-by-Step Manual Deployment

### Step 1: Server Setup

1. **Connect to your server:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Update system:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install dependencies:**
   ```bash
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt-get install -y nodejs
   
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   
   # Install Nginx
   apt install -y nginx certbot python3-certbot-nginx
   ```

### Step 2: SSL Certificate Setup

```bash
# Get SSL certificates for all domains
certbot --nginx -d statsor.com -d www.statsor.com -d api.statsor.com
```

### Step 3: Database Setup (Supabase)

1. **Create Supabase account:** https://supabase.com
2. **Create new project:** "statsor-production"
3. **Get API keys:** Settings → API
4. **Run migrations:** Upload files from `/supabase/migrations/`

### Step 4: Google OAuth Setup

1. **Go to:** https://console.cloud.google.com
2. **Create new project:** "Statsor OAuth"
3. **Enable APIs:** Google+ API, Google Identity
4. **Create credentials:** OAuth 2.0 Client ID
5. **Authorized domains:**
   - `https://statsor.com`
   - `https://api.statsor.com`
6. **Redirect URIs:**
   - `https://api.statsor.com/api/v1/auth/google/callback`

### Step 5: Email Service Setup

#### Option A: Gmail SMTP (Easy)
1. **Enable 2FA** on your Gmail account
2. **Generate App Password:** Account → Security → App passwords
3. **Use credentials** in environment config

#### Option B: SendGrid (Professional)
1. **Create account:** https://sendgrid.com
2. **Get API key:** Settings → API Keys
3. **Verify domain:** statsor.com

### Step 6: Application Deployment

1. **Clone your project:**
   ```bash
   cd /var/www
   git clone YOUR_REPOSITORY_URL statsor
   cd statsor
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.production .env
   nano .env  # Fill in your API keys
   ```

3. **Build and deploy:**
   ```bash
   # Frontend
   npm install
   npm run build
   
   # Backend
   cd backend
   docker-compose -f docker-compose.production.yml up -d --build
   ```

4. **Configure Nginx:**
   ```bash
   cp nginx.conf /etc/nginx/sites-available/statsor.com
   ln -s /etc/nginx/sites-available/statsor.com /etc/nginx/sites-enabled/
   nginx -t && systemctl restart nginx
   ```

### Step 7: Testing & Verification

1. **Test website:** https://statsor.com
2. **Test API:** https://api.statsor.com/api/v1/health
3. **Test registration:** Create a test account
4. **Test Google login:** Try OAuth flow
5. **Test features:** Player management, analytics

---

## 🔧 Configuration Templates

### Environment Variables (.env)
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your_super_secure_32_char_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payments
STRIPE_SECRET_KEY=sk_live_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name statsor.com www.statsor.com;
    
    ssl_certificate /etc/letsencrypt/live/statsor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/statsor.com/privkey.pem;
    
    root /var/www/statsor/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name api.statsor.com;
    
    ssl_certificate /etc/letsencrypt/live/statsor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/statsor.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🧪 Testing Checklist

After deployment, test these features:

### Authentication
- [ ] User registration with email
- [ ] Email verification
- [ ] User login with email/password
- [ ] Google OAuth login
- [ ] Password reset functionality
- [ ] JWT token refresh

### Core Features
- [ ] Dashboard loads correctly
- [ ] Player management (CRUD operations)
- [ ] File upload (player photos)
- [ ] Analytics dashboard
- [ ] Real-time updates
- [ ] Mobile responsiveness

### Advanced Features
- [ ] Payment processing (Stripe)
- [ ] PayPal integration
- [ ] Email notifications
- [ ] Admin panel access
- [ ] API documentation
- [ ] Error handling

---

## 🔍 Troubleshooting

### Common Issues & Solutions

1. **Site not loading (SSL issues)**
   ```bash
   # Check SSL certificate
   certbot certificates
   
   # Renew if needed
   certbot renew
   ```

2. **API not responding**
   ```bash
   # Check backend containers
   docker-compose -f backend/docker-compose.production.yml ps
   
   # View logs
   docker-compose -f backend/docker-compose.production.yml logs -f
   ```

3. **Database connection issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Confirm RLS policies are set

4. **Email not working**
   - Verify Gmail app password
   - Check SMTP settings
   - Test with SendGrid instead

5. **Google OAuth failing**
   - Verify redirect URIs
   - Check domain authorization
   - Confirm client ID/secret

---

## 📊 Monitoring & Maintenance

### Log Monitoring
```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
docker-compose -f backend/docker-compose.production.yml logs -f

# System resources
htop
df -h
```

### Backup Strategy
```bash
# Database backup (via Supabase dashboard)
# File uploads backup
rsync -av /var/www/statsor/uploads/ /backup/uploads/

# Config backup
cp -r /etc/nginx/sites-available/ /backup/nginx/
```

### Security Updates
```bash
# System updates
apt update && apt upgrade -y

# SSL renewal (automatic)
certbot renew --dry-run

# Container updates
docker-compose -f backend/docker-compose.production.yml pull
docker-compose -f backend/docker-compose.production.yml up -d
```

---

## 🎉 Success!

Once deployment is complete, you'll have:

🌐 **statsor.com** - Your live football management platform
👥 **User System** - Registration, login, profiles
⚽ **Player Management** - Add, edit, track players
📊 **Analytics** - Real-time performance data
💳 **Payments** - Stripe & PayPal integration
📱 **Mobile Ready** - Responsive design
🔒 **Secure** - HTTPS, JWT auth, OAuth

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify all API keys are correctly configured
4. Test individual components separately

Remember: The most common issues are related to incorrect API keys or DNS configuration. Double-check these first!