
# HelpFinder Production Deployment Guide

This guide details the steps to deploy the `HelpFinder` monorepo (NestJS Backend + Next.js Frontend) to a single Linux VPS (e.g., Ubuntu 22.04 on DigitalOcean, AWS EC2, or Linode).

## 1. Prerequisites
-   A fresh Ubuntu 22.04 LTS Server.
-   Access via SSH (`ssh root@<server-ip>`).
-   A domain name pointed to your server's IP (e.g., `helpfinder.app`, `api.helpfinder.app`).

## 2. Server Provisioning
Update the system and install essential tools.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx
```

### Install Node.js (LTR)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

### Install PostgreSQL & Redis
If hosting DB on the same server (for MVP):
```bash
sudo apt install -y postgresql postgresql-contrib redis-server
sudo systemctl start result
sudo systemctl enable redis-server
```

**Configure Database:**
```bash
sudo -u postgres psql
# In psql prompt:
CREATE DATABASE helpfinder;
CREATE USER helpfinder WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE helpfinder TO helpfinder;
\q
```

## 3. Application Setup

### Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/josephcjai/HelpFinder.git helpfinder
sudo chown -R $USER:$USER helpfinder
cd helpfinder
```

### Environment Configuration
Create a production `.env` file. You can base it on `.env.example`, but **ensure** `NODE_ENV=production` and `DB_SYNCHRONIZE=false`.

```bash
# /var/www/helpfinder/.env

NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://helpfinder:your_secure_password@localhost:5432/helpfinder
DB_SYNCHRONIZE=false

# JWT
JWT_SECRET=super_secret_production_key_CHANGE_THIS

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Install & Build
```bash
# Install dependencies
pnpm install

# Build Shared Package
cd packages/shared
pnpm build
cd ../..

# Build Backend
cd services/api
pnpm build
cd ../..

# Build Frontend
cd apps/web
# Ensure the API URL is baked in for the build
NEXT_PUBLIC_API_URL=https://api.yourdomain.com pnpm build
cd ../..
```

## 4. Database Migration
Since `DB_SYNCHRONIZE` is false, you must run migrations.

```bash
cd services/api
# Run TypeORM migrations (Assuming you have migration scripts configured)
# If no migration scripts exist yet, for the *FIRST* deploy only, you might temporarily use sync=true 
# OR generate a migration locally and push it.
pnpm typeorm migration:run
```

## 5. Process Management (PM2)
Use PM2 to keep apps running.

```bash
# Start Backend
cd services/api
pm2 start dist/main.js --name "api"

# Start Frontend
cd ../../apps/web
pm2 start npm --name "web" -- start -- -p 3000

# Freeze process list for auto-restart
pm2 save
pm2 startup
```

## 6. Nginx Reverse Proxy
Configure Nginx to route traffic.

**Create config:** `/etc/nginx/sites-available/helpfinder`

```nginx
# Backend (API)
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend (Web)
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/helpfinder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL Setup (HTTPS)
Secure your domains using Certbot.

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

## 8. Final Verification
1.  Visit `https://yourdomain.com` -> Should load the Homepage.
2.  Log in / Register.
3.  Visit `https://api.yourdomain.com/health` (if endpoint exists) or check logs.

## 9. Pending Items for Beta Launch
Before executing this guide, ensure these items from `task.md` are closed:
1.  **Notification Triggers**: Ensure emails are firing for completion/rejection.
2.  **Content Moderation**: (Backlog) - Consider if manual DB review is sufficient for Beta 1.
3.  **Terms & Privacy**: Ensure the actual content in `privacy.tsx` is accurate for your region.
