# HelpFinder Amazon Lightsail Hosting Guide 🚀

This guide provides a comprehensive, step-by-step walkthrough to host your application on Amazon Lightsail. It is designed for beginners.

## Prerequisites
1.  **Amazon AWS Account**: [Sign up here](https://aws.amazon.com/).
2.  **Domain Name**: You should have purchased a domain (e.g., `helpfinder.com`) from GoDaddy, Namecheap, or Route53.

---

## Step 1: Create a Lightsail Instance (Server)

1.  Log in to the **Amazon Lightsail Console**.
2.  Click **Create instance**.
3.  **Instance location**: Choose a region close to your users (e.g., `Ohio` or `Mumbai`).
4.  **Pick your instance image**:
    *   **Platform**: `Linux/Unix`
    *   **Blueprint**: `OS Only` -> `Ubuntu 24.04 LTS` (Do NOT choose "Apps + OS" like Node.js, we will set it up manually for better control).
5.  **Choose your instance plan**: The **$10/month** plan (2GB RAM, 1 vCPU) is recommended for this stack. The $5 plan might struggle with building the Next.js app.
6.  **Identify your instance**: Name it `helpfinder-prod`.
7.  Click **Create instance**.
8.  Wait for the status to turn from "Pending" to "Running".

---

## Step 2: Connect to your Server

### Option A: Browser SSH (Easiest)
1.  Click the orange terminal icon (`>_`) next to your instance name in the Lightsail Console.
2.  A window will pop up. You are now "inside" your server.

### Option B: Local Terminal (Recommended for file transfer)
1.  Download the **Default Key** from your Account > SSH Keys page.
2.  Open your computer's terminal:
    ```bash
    chmod 400 LightsailDefaultKey-us-east-1.pem
    ssh -i LightsailDefaultKey-us-east-1.pem ubuntu@<your-static-ip>
    ```

---

## Step 3: Setup Static IP (Important)
1.  In Lightsail Console, click the **Networking** tab.
2.  Click **Create static IP**.
3.  Attach it to your `helpfinder-prod` instance.
4.  Write down this IP address (e.g., `34.12.56.78`). You will need it for your domain domains.

---

## Step 4: Install Necessary Software

One by one, copy and run these commands in your SSH terminal:

### 1. Update the System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js (Version 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
*Verify install*: `node -v` (should verify v20.x.x)

### 3. Install Package Manages & Tools
```bash
sudo npm install -g pnpm pm2
```

### 4. Install Database (PostgreSQL) & Cache (Redis)
```bash
sudo apt install -y postgresql postgresql-contrib redis-server
```
> **Note (Ubuntu 24.04):** This will install **PostgreSQL 16** (the default for 24.04). This is a newer version than 22.04's default but fully compatible with HelpFinder. All SQL commands below work identically.

### 5. Start Redis
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 6. Configure PostgreSQL
Log into Postgres as the superuser:
```bash
sudo -u postgres psql
```
Now, inside the `postgres=#` prompt, run these SQL commands (copy exactly, but change the password):
```sql
CREATE DATABASE helpfinder;
CREATE USER helpfinder WITH ENCRYPTED PASSWORD 'replace_this_with_a_secure_password';
GRANT ALL PRIVILEGES ON DATABASE helpfinder TO helpfinder;
GRANT ALL ON SCHEMA public TO helpfinder;
ALTER USER helpfinder CREATEDB;
\q
```

---

## Step 5: Deploy Your Code

### 1. Clone the Repository
```bash
cd /var/www
# (If /var/www doesn't exist: sudo mkdir -p /var/www && sudo chown -R ubuntu:ubuntu /var/www)
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
git clone https://github.com/josephcjai/HelpFinder.git helpfinder
cd helpfinder
```

### 2. Configure Environment Variables
Create the production `.env` file from the example.
```bash
cp services/api/.env.example services/api/.env
nano services/api/.env
```
**Edit these lines in the editor:**
*   `DATABASE_URL=postgres://helpfinder:replace_this_with_a_secure_password@localhost:5432/helpfinder`
*   `DB_SYNCHRONIZE=false` (CRITICAL for production)
*   `FRONTEND_URL=https://yourdomain.com` (We will set up the domain later)
*   `CORS_ORIGIN=https://yourdomain.com`

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Now do the web app:
```bash
cp apps/web/.env.example apps/web/.env.local
nano apps/web/.env.local
```
**Edit line:**
*   `NEXT_PUBLIC_API_BASE=https://api.yourdomain.com`

Save and exit.

### 3. Install & Build
This will take a few minutes.
```bash
# Install dependencies
pnpm install

# Build Shared Library
cd packages/shared
pnpm build
cd ../..

# Build API
cd services/api
pnpm build
cd ../..

# Build Web (Frontend)
cd apps/web
# NOTE: Replace with your actual domain!
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com pnpm build
cd ../..
```

---

## Step 6: Start Applications with PM2

PM2 keeps your apps running in the background and restarts them if they crash.

```bash
# Start API
cd services/api
pm2 start dist/main.js --name "hf-api"

# Start Web
cd ../../apps/web
pm2 start npm --name "hf-web" -- start -- -p 3000

# Save configuration to auto-start on reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Step 7: Configure Nginx (The Web Server)

Nginx sits in front of your apps and handles the domains.

1.  **Install Nginx**:
    ```bash
    sudo apt install -y nginx
    ```

2.  **Create Config**:
    ```bash
    sudo nano /etc/nginx/sites-available/helpfinder
    ```

3.  **Paste Config** (Replace `yourdomain.com` with your actual domain):
    ```nginx
    # API Configuration
    server {
        server_name api.yourdomain.com;

        location / {
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # WebSocket timeouts
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }

    # Web Configuration
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

4.  **Activate Config**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/helpfinder /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## Step 8: Database Migrations (First Run)

Since we disabled "synchronize", we need to setup the database tables manually/via migration.

For the **FIRST deployment ONLY**, it is acceptable to temporarily allow synchronization to create the tables, then disable it.

1.  Edit `.env` again: `nano services/api/.env` -> set `DB_SYNCHRONIZE=true`.
2.  Restart API: `pm2 restart hf-api`.
3.  Check logs: `pm2 logs hf-api`. Wait until you see "Nest application successfully started".
4.  Edit `.env` back: `nano services/api/.env` -> set `DB_SYNCHRONIZE=false`.
5.  Restart API: `pm2 restart hf-api`.

---

## Step 9: Configure Firewall & DNS

1.  **Lightsail Firewall**:
    *   Go to Lightsail Console > Networking.
    *   Under "Firewall", add rule: **HTTPS (443)**.
    *   Ensure **HTTP (80)** and **SSH (22)** are open.

2.  **DNS (Domain Provider)**:
    *   Go to where you bought your domain (GoDaddy, Namecheap etc.).
    *   Add **A Record**: `Host: @`, `Value: <YOUR_STATIC_IP>`
    *   Add **A Record**: `Host: api`, `Value: <YOUR_STATIC_IP>`
    *   Add **CNAME**: `Host: www`, `Value: yourdomain.com`

---

## Step 10: Secure with SSL (HTTPS)

This gives you the green lock icon.

```bash
# Install Snapd (usually pre-installed on 24.04, but just in case)
sudo apt install -y snapd

# Remove any old apt-based certbot to avoid conflicts
sudo apt remove -y certbot

# Install Certbot via Snap (recommended method on Ubuntu 24.04)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Issue certificates and auto-configure Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
Follow the prompts (Enter email, Agree to terms).

🎉 **Congratulations! Your application is now live.**
Visit `https://yourdomain.com` to see it.
