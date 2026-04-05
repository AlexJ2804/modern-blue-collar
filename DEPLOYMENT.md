# DEPLOYMENT.md — Production Deployment

This document covers deploying **Modern Blue Collar** to a production Linux server (Ubuntu/Debian).  
For cloud-platform specifics (Railway, Render, Fly.io) see the platform-specific sections below.

---

## Architecture Overview

```
Internet
   │
      ▼
      Nginx (reverse proxy, SSL termination)
         │
            ▼
            Node.js / Express  (port 3001)
               │
                  ▼
                  SQLite  (prisma/prod.db)
                  ```

                  ---

                  ## Option A — VPS / Bare Metal (recommended for self-hosting)

                  ### 1. Provision the server

                  - Ubuntu 22.04 LTS or newer (1 vCPU / 1 GB RAM minimum)
                  - Open ports: **80** (HTTP), **443** (HTTPS)

                  ### 2. Install Node.js 18

                  ```bash
                  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                  sudo apt-get install -y nodejs
                  node -v   # should print v18.x.x
                  ```

                  ### 3. Install Nginx & Certbot

                  ```bash
                  sudo apt install -y nginx certbot python3-certbot-nginx
                  ```

                  ### 4. Clone & install

                  ```bash
                  sudo mkdir -p /var/www/modern-blue-collar
                  sudo chown $USER:$USER /var/www/modern-blue-collar
                  git clone https://github.com/AlexJ2804/modern-blue-collar.git /var/www/modern-blue-collar
                  cd /var/www/modern-blue-collar/backend
                  npm install --production
                  ```

                  ### 5. Configure environment

                  ```bash
                  cp .env.example .env
                  nano .env   # fill in all required values
                  ```

                  Critical production values:

                  ```ini
                  NODE_ENV=production
                  PORT=3001
                  APP_URL=https://yourdomain.com
                  JWT_SECRET=<strong random 64-char secret>
                  DATABASE_URL="file:/var/www/modern-blue-collar/backend/prisma/prod.db"

                  # Brand tokens
                  BRAND_COMPANY_NAME=Your Company LLC
                  BRAND_TRADE_TYPE=electrical
                  ```

                  ### 6. Migrate & seed

                  ```bash
                  npm run migrate:prod
                  npm run generate
                  ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=SecurePass123! npm run seed:admin
                  npm run seed:prices
                  ```

                  ### 7. Configure systemd service

                  Create `/etc/systemd/system/modern-blue-collar.service`:

                  ```ini
                  [Unit]
                  Description=Modern Blue Collar Platform
                  After=network.target

                  [Service]
                  Type=simple
                  User=www-data
                  WorkingDirectory=/var/www/modern-blue-collar/backend
                  EnvironmentFile=/var/www/modern-blue-collar/backend/.env
                  ExecStart=/usr/bin/node server.js
                  Restart=on-failure
                  RestartSec=5
                  StandardOutput=syslog
                  StandardError=syslog
                  SyslogIdentifier=modern-blue-collar

                  [Install]
                  WantedBy=multi-user.target
                  ```

                  ```bash
                  sudo systemctl daemon-reload
                  sudo systemctl enable modern-blue-collar
                  sudo systemctl start modern-blue-collar
                  sudo systemctl status modern-blue-collar
                  ```

                  ### 8. Configure Nginx

                  Create `/etc/nginx/sites-available/modern-blue-collar`:

                  ```nginx
                  server {
                      listen 80;
                          server_name yourdomain.com www.yourdomain.com;

                              location / {
                                      proxy_pass         http://127.0.0.1:3001;
                                              proxy_http_version 1.1;
                                                      proxy_set_header   Upgrade $http_upgrade;
                                                              proxy_set_header   Connection 'upgrade';
                                                                      proxy_set_header   Host $host;
                                                                              proxy_set_header   X-Real-IP $remote_addr;
                                                                                      proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
                                                                                              proxy_cache_bypass $http_upgrade;
                                                                                                  }
                                                                                                  }
                                                                                                  ```

                                                                                                  ```bash
                                                                                                  sudo ln -s /etc/nginx/sites-available/modern-blue-collar /etc/nginx/sites-enabled/
                                                                                                  sudo nginx -t
                                                                                                  sudo systemctl reload nginx
                                                                                                  ```

                                                                                                  ### 9. Enable HTTPS

                                                                                                  ```bash
                                                                                                  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
                                                                                                  ```

                                                                                                  Certbot auto-renews certificates. Verify with:

                                                                                                  ```bash
                                                                                                  sudo certbot renew --dry-run
                                                                                                  ```

                                                                                                  ---

                                                                                                  ## Option B — Railway

                                                                                                  1. Push this repo to GitHub.
                                                                                                  2. Create a new Railway project → "Deploy from GitHub repo".
                                                                                                  3. Set environment variables in the Railway dashboard (same keys as `.env.example`).
                                                                                                  4. Railway auto-detects Node.js; set the **Start Command** to:
                                                                                                     ```
                                                                                                        cd backend && npm run migrate:prod && npm run generate && node server.js
                                                                                                           ```
                                                                                                           5. Set `DATABASE_URL` to a Railway-provisioned SQLite path or use their PostgreSQL plugin.
                                                                                                           
                                                                                                           > **Note:** SQLite is not recommended on Railway's ephemeral filesystem. Use `DATABASE_URL` pointing to a Railway Postgres instance and change the Prisma provider to `postgresql`.
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Option C — Render
                                                                                                           
                                                                                                           1. Create a new Web Service from your GitHub repo.
                                                                                                           2. Set **Root Directory** to `backend`.
                                                                                                           3. Set **Build Command**: `npm install && npx prisma generate`
                                                                                                           4. Set **Start Command**: `npx prisma migrate deploy && node server.js`
                                                                                                           5. Add all environment variables from `.env.example` in Render's dashboard.
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Option D — Fly.io
                                                                                                           
                                                                                                           ```bash
                                                                                                           cd backend
                                                                                                           fly launch   # generates fly.toml
                                                                                                           fly secrets set JWT_SECRET="..." BRAND_COMPANY_NAME="..." BRAND_TRADE_TYPE="electrical"
                                                                                                           fly deploy
                                                                                                           ```
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Backups (Wasabi Cloud Storage)
                                                                                                           
                                                                                                           The platform runs a nightly backup at 03:00 (configured by `BRAND_TIMEZONE`).  
                                                                                                           Backups are saved locally to `backend/backups/` AND uploaded to Wasabi cloud storage.
                                                                                                           
                                                                                                           Wasabi (https://wasabi.com) is an S3-compatible cloud storage provider with
                                                                                                           no egress fees and low-cost storage — ideal for database backups.
                                                                                                           
                                                                                                           To configure Wasabi cloud backup, set these env vars:
                                                                                                           
                                                                                                           ```ini
                                                                                                           WASABI_BUCKET=your-company-backups
                                                                                                           WASABI_ACCESS_KEY=your_wasabi_access_key
                                                                                                           WASABI_SECRET_KEY=your_wasabi_secret_key
                                                                                                           WASABI_REGION=us-east-1
                                                                                                           WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
                                                                                                           ```
                                                                                                           
                                                                                                           Wasabi regions: us-east-1, us-east-2, us-central-1, us-west-1, eu-central-1, eu-central-2, eu-west-1, eu-west-2, ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2.
                                                                                                           
                                                                                                           To trigger a manual backup:
                                                                                                           
                                                                                                           ```bash
                                                                                                           cd backend
                                                                                                           node -e "require('./backup').runBackup()"
                                                                                                           ```
                                                                                                           
                                                                                                           If Wasabi credentials are not set, backups are local-only (still runs nightly).
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Third-Party Integrations
                                                                                                           
                                                                                                           ### Google OAuth (team invite flow)
                                                                                                           1. Go to https://console.cloud.google.com → Credentials → Create OAuth 2.0 Client
                                                                                                           2. Authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
                                                                                                           3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in `.env`
                                                                                                           
                                                                                                           ### QuickBooks Online
                                                                                                           1. Go to https://developer.intuit.com → Create App
                                                                                                           2. Redirect URI: `https://yourdomain.com/api/quickbooks/callback`
                                                                                                           3. Set `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REDIRECT_URI`; set `QB_ENVIRONMENT=production`
                                                                                                           
                                                                                                           ### Twilio SMS
                                                                                                           1. Go to https://twilio.com/console → Get a phone number
                                                                                                           2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
                                                                                                           
                                                                                                           ### Google Maps
                                                                                                           1. Go to https://console.cloud.google.com → APIs → Maps JavaScript API → Create Key
                                                                                                           2. Set `GOOGLE_MAPS_API_KEY`
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Health Check
                                                                                                           
                                                                                                           Once deployed, verify the server is healthy:
                                                                                                           
                                                                                                           ```bash
                                                                                                           curl https://yourdomain.com/api/health
                                                                                                           # Expected: {"message":"Your Company LLC Platform is running!","tradeType":"electrical",...}
                                                                                                           ```
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Updating
                                                                                                           
                                                                                                           ```bash
                                                                                                           cd /var/www/modern-blue-collar
                                                                                                           git pull origin main
                                                                                                           cd backend
                                                                                                           npm install --production
                                                                                                           npm run migrate:prod
                                                                                                           npm run generate
                                                                                                           sudo systemctl restart modern-blue-collar
                                                                                                           ```
                                                                                                           
                                                                                                           ---
                                                                                                           
                                                                                                           ## Security Checklist
                                                                                                           
                                                                                                           - [ ] `NODE_ENV=production` is set
                                                                                                           - [ ] `JWT_SECRET` is a random 64-char string (not the default)
                                                                                                           - [ ] `.env` file permissions: `chmod 600 .env`
                                                                                                           - [ ] Default admin password changed after first login
                                                                                                           - [ ] HTTPS enabled with valid certificate
                                                                                                           - [ ] Firewall: only ports 80, 443, 22 open externally
                                                                                                           - [ ] `prisma/prod.db` is included in nightly backups
                                                                                                           - [ ] Twilio phone number verified for the destination country
                                                                                                           
