# SETUP.md — Local Development

This guide walks you through spinning up **Modern Blue Collar** on your local machine for the first time.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 18.x LTS | https://nodejs.org |
| npm | 9.x | (bundled with Node) |
| Git | any recent | https://git-scm.com |

> SQLite is used by default (no extra database server needed).

---

## 1. Clone the repo

```bash
git clone https://github.com/AlexJ2804/modern-blue-collar.git
cd modern-blue-collar/backend
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```
JWT_SECRET=<random 32+ char string>
BRAND_COMPANY_NAME=Your Company LLC
BRAND_TRADE_TYPE=electrical   # or: plumbing | hvac | contracting
```

All `BRAND_*` keys are optional — sensible defaults are provided in `brand.config.js`.

---

## 4. Set up the database

```bash
# Run migrations (creates prisma/dev.db)
npm run migrate

# Generate Prisma client
npm run generate
```

---

## 5. Seed initial data

**Super-admin account:**

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourSecurePass! npm run seed:admin
```

**Starter pricebook (trade-aware):**

```bash
npm run seed:prices
```

The pricebook seed reads `BRAND_TRADE_TYPE` from `.env` and inserts the relevant starter items for that trade (electrical, plumbing, HVAC, or contracting).

---

## 6. Start the dev server

```bash
npm run dev
```

The server starts on **http://localhost:3001** (or the `PORT` value in `.env`).

Open your browser to http://localhost:3001 — the dashboard login page should load.

---

## 7. (Optional) Inspect the database

```bash
npm run studio
```

Prisma Studio opens at http://localhost:5555 so you can browse and edit records visually.

---

## Branding / White-label Quick-Start

All client-specific strings live in **one place**: `brand.config.js` at the repo root.

To re-brand for a new client:

1. Copy `.env.example` to `.env`
2. Set the `BRAND_*` variables:
   ```
      BRAND_COMPANY_NAME=Acme Plumbing Co.
         BRAND_COMPANY_SLOGAN=Your pipes, our expertise
            BRAND_TRADE_TYPE=plumbing
               BRAND_COLOR_PRIMARY=#1e88e5
                  BRAND_COLOR_SECONDARY=#0d47a1
                     BRAND_DEFAULT_STATE=TX
                        ```
                        3. Re-run `npm run seed:prices` to populate trade-correct pricebook items.
                        4. Replace the logo image at `backend/public/logo.png` with the client's logo.

                        No other files need to be touched.

                        ---

                        ## Supported Trade Types

                        | `BRAND_TRADE_TYPE` | Technician label | Industry label | Starter job types |
                        |-------------------|-----------------|----------------|-------------------|
                        | `electrical` | Electrician | Electrical | Panel Upgrade, Outlet, Lighting, EV Charger, … |
                        | `plumbing` | Plumber | Plumbing | Leak Repair, Drain Cleaning, Water Heater, … |
                        | `hvac` | HVAC Technician | HVAC | AC Install, Furnace Install, Tune-Up, … |
                        | `contracting` | Contractor | General Contracting | Framing, Drywall, Flooring, Roofing, … |

                        ---

                        ## Project Structure

                        ```
                        modern-blue-collar/
                        ├── brand.config.js          # <-- White-label config (edit this per client)
                        ├── SETUP.md                 # This file
                        ├── DEPLOYMENT.md            # Production deployment guide
                        └── backend/
                            ├── server.js            # Express app entry point
                                ├── package.json
                                    ├── .env.example         # Environment variable template
                                        ├── .gitignore
                                            ├── seed_superadmin.js   # Admin account seeder
                                                ├── seed_pricebook.js    # Trade-aware pricebook seeder
                                                    ├── backup.js            # Backup utility
                                                        ├── prisma/
                                                            │   └── schema.prisma    # Database schema
                                                                ├── routes/              # API route handlers
                                                                    │   ├── auth.js
                                                                        │   ├── backup.js
                                                                            │   ├── customers.js
                                                                                │   ├── exports.js
                                                                                    │   ├── invites.js
                                                                                        │   ├── invoices.js
                                                                                            │   ├── jobs.js
                                                                                                │   ├── pricebook.js
                                                                                                    │   ├── quickbooks.js
                                                                                                        │   ├── quotes.js
                                                                                                            │   ├── sms.js
                                                                                                                │   └── users.js
                                                                                                                    └── public/              # Frontend (HTML / JS / CSS)
                                                                                                                            ├── index.html       # Dashboard
                                                                                                                                    ├── customers.html
                                                                                                                                            ├── dispatch.html
                                                                                                                                                    ├── job.html
                                                                                                                                                            ├── schedule.html
                                                                                                                                                                    ├── team.html
                                                                                                                                                                            ├── pricebook.html
                                                                                                                                                                                    └── quote-invoice.html
                                                                                                                                                                                    ```
                                                                                                                                                                                    
                                                                                                                                                                                    ---
                                                                                                                                                                                    
                                                                                                                                                                                    ## Troubleshooting
                                                                                                                                                                                    
                                                                                                                                                                                    **`Cannot find module '../brand.config'`**
                                                                                                                                                                                    Make sure you run the server from `backend/` — the config file lives one directory up.
                                                                                                                                                                                    
                                                                                                                                                                                    **Prisma migration errors**
                                                                                                                                                                                    Delete `prisma/dev.db` and `prisma/migrations/` then re-run `npm run migrate`.
                                                                                                                                                                                    
                                                                                                                                                                                    **Port already in use**
                                                                                                                                                                                    Change `PORT=3001` in `.env` to another value.
                                                                                                                                                                                    
