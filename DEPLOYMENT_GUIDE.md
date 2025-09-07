# 🚀 Statsor.com Deployment Guide

## Overview
This guide will help you deploy your Statsor football management platform to your domain `statsor.com`.

## 🏗️ Architecture
- **Frontend**: React + Vite (https://statsor.com)
- **Backend**: Node.js + Express (https://api.statsor.com)
- **Database**: Supabase PostgreSQL
- **Cache**: Redis
- **Reverse Proxy**: Nginx with SSL
- **Containerization**: Docker + Docker Compose

## 📋 Prerequisites

### 1. Domain Setup
- Point `statsor.com` to your server IP
- Point `api.statsor.com` to your server IP
- Set up DNS records:
  ```
  A     statsor.com        -> YOUR_SERVER_IP
  A     www.statsor.com    -> YOUR_SERVER_IP
  A     api.statsor.com    -> YOUR_SERVER_IP
  ```

### 2. SSL Certificates
Create SSL certificates for both domains:
```bash
# For statsor.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/statsor.com.key -out ssl/statsor.com.crt

# For api.statsor.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/api.statsor.com.key -out ssl/api.statsor.com.crt
```

### 3. Environment Variables
Update `backend/env.production` with your production values:
- Google OAuth secrets
- Stripe API keys
- Cloudflare R2 credentials
- Email SMTP settings

## 🚀 Quick Deployment

### Option 1: Automated Deployment
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Build and start services
npm run deploy:build
npm run deploy:up

# Check logs
npm run deploy:logs
```

## 🔧 Manual Setup Steps

### 1. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone Repository
```bash
git clone <your-repo-url>
cd teamplaymate-main
```

### 4. Set Up SSL Directory
```bash
mkdir ssl
# Copy your SSL certificates to this directory
```

### 5. Deploy
```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

## 🔍 Health Checks

### Backend Health
```bash
curl https://api.statsor.com/health
```

### Frontend Health
```bash
curl https://statsor.com
```

### Database Connection
```bash
docker-compose -f docker-compose.production.yml exec backend npm run db:test
```

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
```

### Resource Usage
```bash
docker stats
```

## 🔄 Updates

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Update Environment Variables
```bash
# Edit environment file
nano backend/env.production

# Restart services
docker-compose -f docker-compose.production.yml restart
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

2. **SSL Certificate Issues**
   ```bash
   openssl x509 -in ssl/statsor.com.crt -text -noout
   ```

3. **Database Connection Issues**
   ```bash
   docker-compose -f docker-compose.production.yml exec backend npm run db:test
   ```

4. **Service Not Starting**
   ```bash
   docker-compose -f docker-compose.production.yml logs backend
   ```

### Reset Everything
```bash
# Stop and remove everything
docker-compose -f docker-compose.production.yml down -v
docker system prune -a

# Start fresh
./deploy.sh
```

## 🔒 Security Checklist

- [ ] SSL certificates installed
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Environment variables secured
- [ ] Database passwords strong
- [ ] Regular backups configured
- [ ] Monitoring set up

## 📈 Performance Optimization

### Nginx Tuning
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Database Optimization
```sql
-- Run on Supabase
CREATE INDEX CONCURRENTLY idx_matches_date ON matches(match_date);
CREATE INDEX CONCURRENTLY idx_players_team ON players(team_id);
```

## 🎉 Success!

Your Statsor platform is now live at:
- **Frontend**: https://statsor.com
- **API**: https://api.statsor.com
- **Health**: https://api.statsor.com/health

## 📞 Support

If you encounter issues:
1. Check the logs: `npm run deploy:logs`
2. Verify SSL certificates
3. Check DNS propagation
4. Ensure all environment variables are set

---

**Happy managing your football teams! ⚽** 