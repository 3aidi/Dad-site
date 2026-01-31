# Production Deployment Guide

Complete guide to deploying your Educational Content System to production.

## Pre-Deployment Security Checklist

### 🔒 Critical Security Steps

- [ ] Generate a strong JWT secret (32+ characters, random)
- [ ] Change the default admin password to something strong
- [ ] Enable HTTPS/SSL (absolutely required)
- [ ] Set `NODE_ENV=production`
- [ ] Review all environment variables
- [ ] Remove or secure any debug endpoints
- [ ] Enable security headers
- [ ] Set up database backups
- [ ] Configure logging

## Environment Configuration

### Production `.env` File

```env
NODE_ENV=production
PORT=3000

# Generate a strong random secret - use a password generator
# Example: openssl rand -base64 32
JWT_SECRET=YOUR_STRONG_RANDOM_SECRET_HERE_32_PLUS_CHARS

# Strong admin credentials
ADMIN_USERNAME=admin_username_change_this
ADMIN_PASSWORD=VeryStrongPassword123!@#$

# Session configuration
JWT_EXPIRY=7d
```

### Generating Secure JWT Secret

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Upload Your Application

```bash
# On your local machine
cd educational-content-system
scp -r * user@your-server:/var/www/educational-content-system/
```

Or use Git:
```bash
# On server
cd /var/www
git clone your-repo-url educational-content-system
cd educational-content-system
npm install --production
```

#### 3. Configure Environment

```bash
cd /var/www/educational-content-system
nano .env
# Add production values (see above)

# Initialize database
npm run init-db
```

#### 4. Set Up Process Manager (PM2)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name educational-cms

# Enable startup on boot
pm2 startup
pm2 save
```

#### 5. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/educational-cms
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/educational-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Set Up SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure HTTPS.

#### 7. Verify Secure Cookie Settings

Update [server.js](server.js) to ensure cookies are secure in production:

```javascript
// In authRoutes.js, the cookie settings should be:
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // This enables secure flag
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

This is already configured correctly in the provided code.

### Option 2: Platform as a Service (Heroku, Railway, Render)

#### Heroku Deployment

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and create app**:
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-strong-secret
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=your-password
   ```

4. **Create Procfile**:
   ```
   web: node server.js
   ```

5. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

6. **Initialize database**:
   ```bash
   heroku run npm run init-db
   ```

#### Railway Deployment

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables in the dashboard
5. Railway will automatically deploy

#### Render Deployment

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your Git repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables
6. Click "Create Web Service"

### Option 3: Docker Container

#### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - ./database.db:/app/database.db
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build image
docker build -t educational-cms .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your-password \
  -v $(pwd)/database.db:/app/database.db \
  --name educational-cms \
  educational-cms

# Initialize database
docker exec educational-cms npm run init-db
```

## Database Management

### SQLite in Production

SQLite works well for small to medium sites. Considerations:

**Pros:**
- Simple deployment
- No separate database server
- Fast for read-heavy workloads
- Built-in backup (just copy the file)

**Cons:**
- Single write at a time
- Not ideal for high-traffic sites
- Requires file system access

### Backup Strategy

**Automated Daily Backups:**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/educational-cms"
DB_PATH="/var/www/educational-content-system/database.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/database_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "database_*.db" -mtime +30 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Migrate to PostgreSQL (Optional)

For high-traffic sites, migrate to PostgreSQL:

1. Install `pg` package: `npm install pg`
2. Update database.js to use PostgreSQL
3. Update SQL queries for PostgreSQL syntax
4. Set up PostgreSQL on server or use managed service

## Security Hardening

### 1. Security Headers

Add to [server.js](server.js) after middleware:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  next();
});
```

Or use `helmet` package:
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

### 2. Rate Limiting

Install rate limiter:
```bash
npm install express-rate-limit
```

Add to [server.js](server.js):
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Stricter limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 5 login attempts per 15 minutes
});

app.use('/api/auth/login', loginLimiter);
```

### 3. CORS Configuration

If you need CORS (for API access from other domains):

```bash
npm install cors
```

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://yourdomain.com', // Your domain only
  credentials: true
}));
```

### 4. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Monitoring and Logging

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs educational-cms

# Monitor resources
pm2 monit

# Web dashboard
pm2 web
```

### 2. Add Winston Logger

```bash
npm install winston
```

Create `src/utils/logger.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

Use in routes:
```javascript
const logger = require('../utils/logger');
logger.info('User logged in', { username: admin.username });
logger.error('Login failed', { error: error.message });
```

### 3. Error Tracking

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for usage statistics

## Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Static File Caching

Update nginx configuration:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

Create indexes for faster queries:
```sql
CREATE INDEX idx_units_class_id ON units(class_id);
CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);
```

Add to [initDatabase.js](c:/educational-content-system/src/database/initDatabase.js).

## Health Checks

Add health check endpoint in [server.js](server.js):

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

Set up monitoring (UptimeRobot, Pingdom, etc.) to check this endpoint.

## Post-Deployment Checklist

- [ ] Application is running on HTTPS
- [ ] Admin can login successfully
- [ ] Public pages are accessible
- [ ] Database backups are configured
- [ ] Monitoring is set up
- [ ] Security headers are enabled
- [ ] Rate limiting is active
- [ ] Error logging is working
- [ ] SSL certificate auto-renewal is configured
- [ ] Firewall is properly configured
- [ ] Default passwords have been changed
- [ ] Documentation is updated with production URLs

## Troubleshooting Production Issues

### Can't Access Site
- Check firewall: `sudo ufw status`
- Check Nginx: `sudo systemctl status nginx`
- Check app: `pm2 status`
- Check logs: `pm2 logs`

### Database Errors
- Check file permissions: `ls -la database.db`
- Check disk space: `df -h`
- Verify database integrity: `sqlite3 database.db "PRAGMA integrity_check;"`

### Memory Issues
- Check usage: `free -m`
- Restart app: `pm2 restart educational-cms`
- Consider upgrading server

### SSL Certificate Issues
- Renew manually: `sudo certbot renew`
- Check expiry: `sudo certbot certificates`
- Auto-renewal should work with certbot

## Scaling Considerations

When your site grows:

1. **Upgrade to PostgreSQL** for better concurrency
2. **Add Redis** for session management and caching
3. **Use CDN** (Cloudflare, AWS CloudFront) for static assets
4. **Load Balancer** if running multiple instances
5. **Separate database server** for better performance

## Maintenance

### Regular Tasks

**Weekly:**
- Check error logs
- Review disk space
- Monitor performance

**Monthly:**
- Review security updates
- Update dependencies: `npm update`
- Test backup restoration
- Review access logs

**Quarterly:**
- Security audit
- Performance review
- Dependency vulnerability scan: `npm audit`

---

## Need Help?

- Check server logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Review application logs
- Check this guide and README.md

**Your production deployment should now be secure and robust!** 🚀🔒
