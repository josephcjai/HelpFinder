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

---

## PART 2: Building and Packaging the Android App

This process compiles the web assets with the production API endpoint, synchronizes them with the Android project structure, and bundles the application into a signed `.aab` package.

### Step 1: Compile Web Assets for Mobile (Local Machine)
Ensure you are in the `apps/web` directory on your local machine and build the static output pointing to the production API:
```powershell
cd apps/web

# Build Next.js output for static packaging using the production API base URL
npx cross-env CAPACITOR_BUILD=true NEXT_PUBLIC_API_BASE=https://api.helpfinder4u.com npm run build:mobile
```

### Step 2: Synchronize Assets with Android Project
Copy the newly built static assets from the Next.js `out` directory into the native Android folder structure:
```powershell
npx cap sync android
```

### Step 3: Bundle and Sign the Android Package
Use Gradle to compile the Android project into a signed Android App Bundle (AAB). The keystore is already configured in the project's build files (`release.jks` with credentials `hfpass123`):
```powershell
# Navigate to the android directory
cd android

# Compile and package in release mode
cmd /c gradlew.bat bundleRelease
```

### Step 4: Locate the Output Bundle
Once the Gradle build reports `BUILD SUCCESSFUL`, your output file will be generated at:
`apps/web/android/app/build/outputs/bundle/release/app-release.aab`

---

## PART 3: Uploading to Google Play Console

### Step 1: Log in
Open your browser and sign in at the [Google Play Console](https://play.google.com/console).

### Step 2: Create a New Release
1. Select the **HelpFinder** application from your dashboard list.
2. In the left-hand navigation menu, choose your release track:
   - For initial testing: Go to **Testing > Internal testing**.
   - For direct launch: Go to **Release > Production**.
3. Click on the **Create new release** button in the top right.

### Step 3: Upload the Bundle
1. In the **App bundles** section, upload the **`app-release.aab`** file generated in Part 2.
2. Fill out the **Release name** (e.g., `1.1` or `1.1.1`) and add **Release notes** describing the new welcome banner and account update prompts.
3. Click **Save as draft**, then click **Next** / **Review release**.

### Step 4: Rollout
Review any warnings (minor API target warnings can be ignored for testing) and click **Start rollout to Production** to complete the process.
