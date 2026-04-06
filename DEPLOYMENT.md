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

## First Deployment Steps (in order)

1. Confirm source directory is set to `backend` in DigitalOcean component settings
2. Confirm all dependencies are in `backend/package.json`
3. Run `cd backend && npm install` and commit both `package.json` and `package-lock.json`
4. Merge all changes to `main` and push
5. Add PORT, JWT_SECRET, NODE_ENV as component-level env vars in DigitalOcean
6. Watch the deploy logs — build phase should pass before deploy phase

## Common Errors and Fixes

**"Cannot find module 'X'"** → Package not in `package.json`. Run `npm install X --save` in `backend/`, commit both files, push.

**"npm lockfile is not in sync"** → Run `cd backend && npm install`, commit `package-lock.json`, push.

**"container exited with non-zero exit code"** → Check deploy logs. Usually means PORT, JWT_SECRET, or NODE_ENV env vars are missing from component settings.

**"Readiness probe failed: connection refused :8080"** → PORT=8080 is not set as a component-level env var.

**"Sorry, we couldn't find an app in your repo"** → Source Directory is not set to `backend`.

## Production Upgrade (at client handover)

When moving from staging to production, add a DigitalOcean Managed PostgreSQL database and set DATABASE_URL as a component-level env var. Update the Prisma provider from sqlite to postgresql and run migrations. See STAGING.md for full details.
