# HelpFinder End-to-End Production Deployment & Release Manifest

This document contains detailed, step-by-step instructions to deploy backend API changes to your production Linux server and compile the Android App Bundle (`.aab`) for the Google Play Store. 

---

## PART 1: Deploying Backend API Server Changes

### Step 1: Commit and Push Local Changes
Before deploying, ensure all local changes (including types, user entities, and api controllers) are committed and pushed to the main repository:
```powershell
# On your local machine
git add .
git commit -m "feat: implement first-login redirection and welcome banner"
git push origin main
```

### Step 2: SSH into the Production Server
Log in to your VPS (e.g., AWS Lightsail or DigitalOcean Ubuntu server):
```bash
ssh -i LightsailDefaultKey-*.pem ubuntu@<YOUR_PRODUCTION_STATIC_IP>
```

### Step 3: Pull the Latest Code
Navigate to the application root directory and pull the changes:
```bash
cd /var/www/helpfinder
git pull origin main
```

### Step 4: Install Dependencies & Build
Install new dependencies and compile the updated modules in the exact order (shared package → API server):
```bash
# Install package dependencies
pnpm install

# 1. Build the shared types package
cd packages/shared
pnpm build
cd ../..

# 2. Build the NestJS API backend
cd services/api
pnpm build
cd ../..
```

### Step 5: Database Schema Synchronization (Critical)
Because we introduced a new database column (`isFirstLogin`) on the `UserEntity`, the production PostgreSQL schema must be updated. Follow this temporary sync procedure:

1. **Open the environment file** on the server:
   ```bash
   nano /var/www/helpfinder/services/api/.env
   ```
2. **Temporarily enable synchronization**:
   Locate `DB_SYNCHRONIZE` and change it to `true`:
   ```env
   DB_SYNCHRONIZE=true
   ```
   *Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).*

3. **Restart the API process** to trigger TypeORM database schema updates:
   ```bash
   pm2 restart hf-api
   ```
4. **Monitor logs** to confirm the schema was updated successfully and the server started cleanly:
   ```bash
   pm2 logs hf-api --lines 50
   # Wait until you see: "Nest application successfully started"
   ```
5. **Disable synchronization (Important for safety)**:
   Re-open the environment file:
   ```bash
   nano /var/www/helpfinder/services/api/.env
   ```
   Set it back to `false`:
   ```env
   DB_SYNCHRONIZE=false
   ```
   *Save and exit.*

6. **Restart the API process** one final time:
   ```bash
    pm2 restart hf-api
    ```

