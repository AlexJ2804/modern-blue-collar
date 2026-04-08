# DigitalOcean App Platform — Deployment Guide

## Pre-Deployment Checklist

Complete every item on this list before pushing to main and attempting a deployment. These are all lessons learned from the Kraft Electric initial deployment.

### 1. Set Source Directory to `backend`
The app code lives in the `backend/` subfolder. DigitalOcean defaults to the repo root and will fail to find Express and other dependencies. In DigitalOcean App Platform: Settings → Component Settings → Source → Edit → set Source Directory to `backend`.

### 2. All dependencies must be in `package.json` with `--save`
Never run `npm install <package>` alone. Always run `npm install <package> --save` so the dependency is written to `package.json`. DigitalOcean runs `npm ci` from `package.json` only — packages installed locally but not listed there will be missing on the server and crash the build.

### 3. Commit both `package.json` and `package-lock.json` together
After adding or removing any dependency, run `npm install` inside the `backend/` directory to regenerate `package-lock.json`. DigitalOcean uses `npm ci` which requires the lockfile to exactly match `package.json`. Always commit both files together. A mismatch causes the build to fail with "npm lockfile is not in sync".

### 4. Merge feature branch to main before deploying
DigitalOcean watches the `main` branch. Any fixes on feature branches must be merged to `main` before they take effect on the deployment. Run: `git checkout main && git merge <branch> && git push origin main`

### 5. Set component-level environment variables
These three variables are required at startup. Set them in DigitalOcean: Settings → Component Settings → Environment Variables (NOT app-level — app-level env vars do not apply to service components):

| Key | Value |
|---|---|
| PORT | 8080 |
| JWT_SECRET | (any long random string) |
| NODE_ENV | production |

DigitalOcean health-checks port 8080 by default. Without PORT=8080 the app starts on 3001 and the health check kills the container. Without JWT_SECRET the auth middleware crashes on startup.

---

## Stack

Node.js/Express · Prisma ORM · PostgreSQL · Plain HTML/CSS/JS · GitHub repo (source directory: `backend/`)

---

## Google OAuth Setup

1. Go to **Google Cloud Console → Google Auth Platform → Clients → Create Client**
2. Type: **Web application**
3. Add JS Origin: `https://your-app.ondigitalocean.app`
4. Add Redirect URI: `https://your-app.ondigitalocean.app/api/auth/google/callback`
5. **Immediately download the JSON** — you only get one chance to see the secret
6. **Hardcode both values** directly in your auth route — no `process.env` fallback:
   ```js
   const clientId = '...apps.googleusercontent.com';
   const clientSecret = 'GOCSPX-...';
   ```
7. **Critical:** DigitalOcean env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) will **override** any `process.env.X || 'hardcoded'` fallback — the env var always wins. Either hardcode with no fallback, or keep env vars perfectly in sync. Hardcoding is simpler for now.
8. Keep only **one enabled secret** per client at a time. Multiple enabled secrets causes `invalid_client` errors.

---

## Database Setup

**Dev database ($7/mo) — works fine for testing with this fix:**

The DO dev database user doesn't have schema creation permissions, so `prisma migrate deploy` fails with `permission denied for schema public`.

**The fix:** Use `prisma db push` instead. It syncs the schema without needing migration history table permissions.

**Two places this must be set — both matter:**

1. **`backend/package.json`:**
   ```json
   "start": "npx prisma db push --skip-generate --accept-data-loss && node server.js"
   ```

2. **`backend/Procfile`:**
   ```
   web: npx prisma db push --skip-generate --accept-data-loss && node server.js
   ```

3. **DigitalOcean App Platform → Settings → component → Commands → Run Command:**
   Set to: `npm start`
   *(This is the critical one — DO's hardcoded run command overrides both the Procfile and package.json unless you explicitly set it to `npm start`)*

---

## DigitalOcean App Platform Gotchas

- **Env vars override hardcoded fallbacks** — stale env vars from old deploys will silently win over `process.env.X || 'new-value'` in code
- **The Procfile is ignored** if DO has a custom Run Command set in the app settings UI
- **The Run Command in DO settings** takes priority over everything — always set it to `npm start` so package.json controls the actual command
- **Dev DB = $7/mo**, Managed DB = $15/mo. Dev DB works fine with `prisma db push`; avoid the managed DB unless you need backups/failover
- **Total cost for testing:** $5 (web) + $7 (dev DB) = **$12/mo**

---

## First Deployment Steps (in order)

1. Confirm source directory is set to `backend` in DigitalOcean component settings
2. Confirm all dependencies are in `backend/package.json`
3. Run `cd backend && npm install` and commit both `package.json` and `package-lock.json`
4. Merge all changes to `main` and push
5. Add PORT, JWT_SECRET, NODE_ENV, DATABASE_URL as component-level env vars in DigitalOcean
6. Watch the deploy logs — build phase should pass before deploy phase

---

## Deployment Checklist for New Clients

- [ ] Create Google OAuth client, download JSON immediately
- [ ] Hardcode `clientId` and `clientSecret` with no `process.env` fallback
- [ ] Set Procfile and package.json start script to `prisma db push && node server.js`
- [ ] In DO App Settings → Run Command → set to `npm start`
- [ ] Remove stale `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env vars from DO (or delete them entirely since values are hardcoded)
- [ ] First deploy: login, run seed via browser console

---

## Common Errors and Fixes

**"Cannot find module 'X'"** → Package not in `package.json`. Run `npm install X --save` in `backend/`, commit both files, push.

**"npm lockfile is not in sync"** → Run `cd backend && npm install`, commit `package-lock.json`, push.

**"container exited with non-zero exit code"** → Check deploy logs. Usually means PORT, JWT_SECRET, or NODE_ENV env vars are missing from component settings.

**"Readiness probe failed: connection refused :8080"** → PORT=8080 is not set as a component-level env var.

**"Sorry, we couldn't find an app in your repo"** → Source Directory is not set to `backend`.

**"permission denied for schema public"** → Using `prisma migrate deploy` with a dev database. Switch to `prisma db push` in the start script.

**"invalid_client" on Google OAuth** → Multiple OAuth secrets enabled, or stale `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars in DO overriding hardcoded values.
