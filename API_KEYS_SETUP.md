# 🔑 **API Keys Setup Guide - Step by Step**

## 🚀 **Quick Start Checklist**

### **Essential Services (Required)**
- [ ] **Supabase** - Database & Authentication
- [ ] **Google OAuth** - User Authentication
- [ ] **Stripe** - Payment Processing
- [ ] **Cloudflare R2** - File Storage
- [ ] **AI Services** - Chatbot & Analytics

### **Optional Services (Recommended)**
- [ ] **GitHub OAuth** - Alternative Authentication
- [ ] **Sentry** - Error Monitoring
- [ ] **Google Analytics** - User Analytics
- [ ] **Email Service** - Notifications

---

## 📋 **1. Supabase Setup (Database & Auth)**

### **Step 1: Create Supabase Account**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new organization

### **Step 2: Create New Project**
1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `statsor-production`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"

### **Step 3: Get API Keys**
1. Go to **Settings** → **API**
2. Copy these values:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### **Step 4: Run Database Migrations**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

---

## 🔐 **2. Google OAuth Setup**

### **Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `Statsor OAuth`
4. Click "Create"

### **Step 2: Enable OAuth API**
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click "Enable"

### **Step 3: Create OAuth Credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback`
5. Click "Create"

### **Step 4: Get API Keys**
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 💳 **3. Stripe Payment Setup**

### **Step 1: Create Stripe Account**
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now"
3. Complete account setup

### **Step 2: Get API Keys**
1. Go to **Developers** → **API keys**
2. Copy these keys:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   ```

### **Step 3: Set Up Webhooks**
1. Go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook secret:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### **Step 4: Create Products & Prices**
1. Go to **Products** → **Add product**
2. Create products for each plan:
   - **Starter Plan**: €0/month
   - **Pro Plan**: €299/year
   - **Club Plan**: €250/month

---

## ☁️ **4. Cloudflare R2 (File Storage)**

### **Step 1: Create Cloudflare Account**
1. Go to [https://cloudflare.com](https://cloudflare.com)
2. Sign up for free account
3. Add your domain

### **Step 2: Enable R2 Storage**
1. Go to **R2 Object Storage**
2. Click "Get started with R2"
3. Choose a plan (free tier available)

### **Step 3: Create Bucket**
1. Click "Create bucket"
2. Name: `statsor-uploads`
3. Choose region closest to users

### **Step 4: Create API Token**
1. Go to **My Profile** → **API Tokens**
2. Click "Create Token"
3. Choose "Custom token"
4. Permissions:
   - **Account**: R2 Storage:Edit
   - **Zone**: Zone:Read
5. Copy token details:
   ```bash
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=statsor-uploads
   ```

---

## 🤖 **5. AI Services Setup**

### **DeepSeek AI**
1. Go to [https://platform.deepseek.com](https://platform.deepseek.com)
2. Sign up and verify account
3. Go to **API Keys**
4. Create new API key:
   ```bash
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

### **OpenRouter (Multiple AI Providers)**
1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up and add payment method
3. Go to **API Keys**
4. Create new key:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

### **Groq (Fast AI)**
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up and verify account
3. Go to **API Keys**
4. Create new key:
   ```bash
   GROQ_API_KEY=your_groq_api_key
   ```

### **SERPAPI (Internet Search)**
1. Go to [https://serpapi.com](https://serpapi.com)
2. Sign up for free account
3. Go to **API Keys**
4. Copy your key:
   ```bash
   SERPAPI_KEY=your_serpapi_key
   ```

---

## 📧 **6. Email Service Setup**

### **Gmail SMTP (Recommended)**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification**
3. Go to **Security** → **App passwords**
4. Generate app password for "Mail"
5. Use these settings:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=noreply@statsor.com
   ```

### **Alternative: SendGrid**
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your domain
4. Create API key:
   ```bash
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

---

## 📊 **7. Monitoring & Analytics**

### **Sentry (Error Tracking)**
1. Go to [https://sentry.io](https://sentry.io)
2. Create free account
3. Create new project
4. Copy DSN:
   ```bash
   SENTRY_DSN=your_sentry_dsn
   ```

### **Google Analytics**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create account and property
3. Get tracking ID:
   ```bash
   GA_TRACKING_ID=G-XXXXXXXXXX
   ```

---

## 🔧 **8. Environment File Setup**

### **Create .env file**
```bash
# Copy template
cp backend/env.example backend/.env

# Edit with your keys
nano backend/.env
```

### **Complete .env Template**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/statsor

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Services
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROQ_API_KEY=your_actual_groq_api_key_here
SERPAPI_KEY=your_serpapi_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@statsor.com

# Payments
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=statsor-uploads

# Monitoring
SENTRY_DSN=your_sentry_dsn
GA_TRACKING_ID=your_ga_tracking_id

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com,http://localhost:3000

# Environment
NODE_ENV=development
PORT=3001
```

---

## 🚀 **9. Start the Backend**

### **Install Dependencies**
```bash
cd backend
npm install
```

### **Start Development Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### **Test API Endpoints**
```bash
# Health check
curl http://localhost:3001/api/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## 🔒 **10. Security Checklist**

- [ ] All API keys are in `.env` file (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] JWT secret is strong and unique
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced in production
- [ ] Database passwords are strong
- [ ] OAuth redirect URIs are secure
- [ ] Webhook secrets are configured
- [ ] Error monitoring is set up

---

## 📞 **Need Help?**

### **Common Issues**
1. **CORS errors**: Check CORS_ORIGIN in .env
2. **Database connection**: Verify DATABASE_URL
3. **OAuth not working**: Check redirect URIs
4. **Payments failing**: Verify Stripe keys
5. **File uploads**: Check R2 credentials

### **Support Resources**
- **Documentation**: [backend/README.md](backend/README.md)
- **API Docs**: [backend/docs/api.md](backend/docs/api.md)
- **GitHub Issues**: Create issue for bugs
- **Email Support**: support@statsor.com

---

## 🎯 **Next Steps**

1. ✅ **Set up all API keys**
2. ✅ **Configure environment variables**
3. ✅ **Start backend server**
4. 🔄 **Test all endpoints**
5. 🔄 **Deploy to production**
6. 🔄 **Set up monitoring**
7. 🔄 **Configure CI/CD**

**🚀 Your powerful Statsor backend is ready to launch!** 