# HelpFinder: Production Promotion Guide

This is the standard process to deploy any code changes to the live production server.
Follow this checklist every time you push new development work to production.

---

## Step 1: Commit & Push to GitHub (on your local machine)

```bash
# Stage all changed files
git add .

# Commit with a meaningful message
git commit -m "feat: describe what you changed"

# Push to the remote main branch
git push origin main
```

✅ Verify on GitHub that your changes are visible at `github.com/josephcjai/HelpFinder`.

---

## Step 2: SSH into the Production Server

```bash
ssh -i LightsailDefaultKey-*.pem ubuntu@<YOUR_STATIC_IP>
```

---

## Step 3: Pull the Latest Code

```bash
cd /var/www/helpfinder
git pull origin main
```

---

## Step 4: Install Any New Dependencies

Only needed if you added new packages (e.g., `pnpm add something`). If you are unsure, running it again is always safe.

```bash
pnpm install
```

---

## Step 5: Build the Changed Packages

Always build in this order (shared → api → web). If only one layer changed, you can build just that one.

```bash
# 1. Shared library (build if types/interfaces changed)
cd /var/www/helpfinder/packages/shared && pnpm build && cd ../..

# 2. API (build if any backend file changed)
cd /var/www/helpfinder/services/api && pnpm build && cd ../..

> [!IMPORTANT]
> **Update CORS for Mobile:** 
> In your production server's `/var/www/helpfinder/services/api/.env`, ensure `CORS_ORIGIN` includes your domain AND the mobile app's internal origin:
> `CORS_ORIGIN=https://helpfinder4u.com,http://localhost`

# 3. Web frontend (build if any frontend file changed)
cd /var/www/helpfinder/apps/web
NEXT_PUBLIC_API_BASE=https://api.helpfinder4u.com pnpm build
cd ../..
```

---

## Step 6: Restart the App Processes

```bash
pm2 restart hf-api
pm2 restart hf-web
```

Check logs to confirm everything started cleanly:
```bash
pm2 logs hf-api --lines 30
pm2 logs hf-web --lines 30
```

Look for `Nest application successfully started` in the API logs.

---

## Step 7: Verify in Browser

Open your live site and test the new functionality manually.

---

## ❓ When Do I Need to Change DB_SYNCHRONIZE?

`DB_SYNCHRONIZE` controls whether TypeORM automatically creates/alters database **tables and columns** to match your entity files.

| Scenario | DB_SYNCHRONIZE needed? |
| :--- | :--- |
| New feature (no new DB columns/tables) | ❌ No — keep it `false` |
| Adding a new column to an entity | ✅ Yes — temporarily |
| Adding a new table/entity | ✅ Yes — temporarily |
| Frontend-only changes | ❌ No |
| Bug fixes that don't touch entities | ❌ No |

### Procedure when DB_SYNCHRONIZE IS needed:

1. `nano /var/www/helpfinder/services/api/.env` → set `DB_SYNCHRONIZE=true`
2. `pm2 restart hf-api`
3. Wait for `pm2 logs hf-api` to show `Nest application successfully started`
   - This means all schema changes have been applied to the database
4. `nano /var/www/helpfinder/services/api/.env` → set `DB_SYNCHRONIZE=false`
5. `pm2 restart hf-api`

> ⚠️ **NEVER** leave `DB_SYNCHRONIZE=true` running in production. It can accidentally drop columns or alter data if your entity changes in unexpected ways.

---

## Quick Cheat Sheet (No Schema Changes)

```bash
# SSH in
ssh -i LightsailDefaultKey-*.pem ubuntu@<IP>

# Pull + install + build + restart
cd /var/www/helpfinder
git pull origin main
pnpm install
cd services/api && pnpm build && cd ../..
cd apps/web && NEXT_PUBLIC_API_BASE=https://api.helpfinder4u.com pnpm build && cd ../..
pm2 restart hf-api && pm2 restart hf-web

# Check logs
pm2 logs hf-api --lines 30
```
