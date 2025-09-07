# 🌐 Statsor Production Deployment Guide

## Overview
This guide will help you deploy your Statsor football management platform to work online as a production platform.

## Prerequisites
1. A server/VPS with Docker and Docker Compose installed
2. A domain name (e.g., statsor.com)
3. SSL certificates for your domain
4. Supabase account and project
5. Google OAuth credentials
6. Stripe account (for payment features)

## Step-by-Step Deployment

### 1. Server Setup

#### Install Docker and Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Domain Configuration

#### DNS Records
Set up these DNS records for your domain:
```
A     statsor.com        -> YOUR_SERVER_IP
A     www.statsor.com    -> YOUR_SERVER_IP
A     api.statsor.com    -> YOUR_SERVER_IP
```

### 3. SSL Certificates

#### Generate SSL certificates using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d statsor.com -d www.statsor.com
sudo certbot certonly --standalone -d api.statsor.com
```

#### Or use self-signed certificates for testing
```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/statsor.com.key -out ssl/statsor.com.crt

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/api.statsor.com.key -out ssl/api.statsor.com.crt
```

### 4. Environment Configuration

#### Update backend/env.production
Replace placeholder values with your actual credentials:
```bash
# Supabase Configuration
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_KEY=your_actual_supabase_service_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

#### Update .env.production
Replace placeholder values with your actual credentials:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 5. Deploy the Application

#### Clone the repository
```bash
git clone <your-repo-url>
cd mm
```

#### Build and start services
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

#### Or deploy manually
```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 6. Verify Deployment

#### Check health endpoints
```bash
# Frontend health
curl https://statsor.com

# Backend health
curl https://api.statsor.com/health

# API documentation
curl https://api.statsor.com/api/docs
```

#### View logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
```

## Configuration Details

### Nginx Configuration
The nginx.conf file is already configured for:
- HTTPS redirection
- SSL termination
- Reverse proxy for frontend and backend
- WebSocket support
- Security headers
- Rate limiting

### Docker Services
The docker-compose.production.yml defines:
- Frontend service (React app)
- Backend service (Node.js API)
- PostgreSQL database
- Redis cache
- Nginx reverse proxy

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   sudo netstat -tulpn | grep :3001
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

## Maintenance

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

## Security Checklist

- [ ] SSL certificates are valid and up to date
- [ ] Environment variables are properly secured
- [ ] Database credentials are strong
- [ ] API keys are restricted
- [ ] Rate limiting is configured
- [ ] Security headers are set
- [ ] Regular backups are configured
- [ ] Monitoring and alerting are set up

## Monitoring

### Resource Usage
```bash
docker stats
```

### Health Checks
Regularly check:
- https://statsor.com
- https://api.statsor.com/health
- Database connectivity
- SSL certificate expiration

## Scaling

For high-traffic deployments, consider:
- Load balancer in front of multiple instances
- Database read replicas
- CDN for static assets
- Caching layer (Redis already included)
- Horizontal scaling of services

## Backup and Recovery

### Database Backup
```bash
# Backup PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres statsor > backup.sql
```

### Restore Database
```bash
# Restore PostgreSQL
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres statsor < backup.sql
```

## Support

For issues with deployment, contact:
- Your DevOps team
- Hosting provider support
- Community forums

For application-specific issues:
- Check logs
- Review documentation
- Contact development team