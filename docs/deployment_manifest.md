# HelpFinder End-to-End Production Deployment & Release Manifest

This document contains detailed, step-by-step instructions to deploy backend API changes to your production Linux server and upload the pre-built Android App Bundle (`.aab`) to the Google Play Store.

---

## PART 1: Deploying Backend API Server Changes

### Step 1: SSH into the Production Server
Log in to your VPS (e.g., AWS Lightsail or DigitalOcean Ubuntu server):
```bash
ssh -i LightsailDefaultKey-*.pem ubuntu@<YOUR_PRODUCTION_STATIC_IP>
```

### Step 2: Pull the Latest Code
Navigate to the application root directory and pull the changes:
```bash
cd /var/www/helpfinder
git pull origin main
```

### Step 3: Install Dependencies & Build
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

### Step 4: Database Schema Synchronization (Critical)
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

---

## PART 2: Uploading the Android App to Google Play Console

Follow these steps to upload your pre-built Android App Bundle (`app-release.aab`) to the Google Play Store.

### Step 1: Locate your Pre-built App Bundle
Confirm you have the signed bundle file ready on your machine. By default, the build output is located at:
`apps/web/android/app/build/outputs/bundle/release/app-release.aab`

### Step 2: Log in to Google Play Console
Open your browser and sign in at the [Google Play Console](https://play.google.com/console).

### Step 3: Create a New Release
1. Select the **HelpFinder** application from your dashboard list.
2. In the left-hand navigation menu, choose your release track:
   - For initial testing: Go to **Testing > Internal testing**.
   - For direct launch: Go to **Release > Production**.
3. Click on the **Create new release** button in the top right.

### Step 4: Upload the Bundle & Publish
1. In the **App bundles** section, upload your **`app-release.aab`** file.
2. Fill out the **Release name** (e.g., `1.1` or `1.1.1`) and add **Release notes** describing the new welcome banner and account update prompts.
3. Click **Save as draft**, then click **Next** / **Review release**.
4. Review any warnings (minor API target warnings can be ignored for testing) and click **Start rollout to Production** to complete the process.
