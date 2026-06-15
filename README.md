# Modern Blue Collar

> **White-label field service management platform for blue-collar trades.**  
> Supports: Electrical · Plumbing · HVAC · General Contracting

---

## What is this?

Modern Blue Collar is a production-ready, self-hosted web platform for small field service businesses. It provides:

- Job scheduling & dispatch board
- Customer CRM
- Quoting & invoicing
- Trade-specific pricebook
- Team management with role-based access
- QuickBooks Online sync
- Twilio SMS notifications
- Google OAuth team invites
- Nightly database backups
- CSV data exports

The entire platform is **white-labeled via a single config file** (`brand.config.js`). Swapping it to a new trade or client requires changing only environment variables — no source code edits.

---

## Running a local demo (Docker — free, no cloud accounts)

Spin up the whole platform — app, PostgreSQL, S3-compatible storage (MinIO), and
an email catch-all (Mailpit) — with **no paid services and no real credentials**.
Requires only Docker + Docker Compose.

```bash
cp .env.example .env
docker compose --profile demo up --build
```

Then open:

| URL | What |
|-----|------|
| http://localhost:3001 | The app — sign in with **admin@demo.test** / **demo1234** |
| http://localhost:8025 | Mailpit — every outbound email lands here |
| http://localhost:9001 | MinIO console — uploaded job photos (`minioadmin` / `minioadmin`) |

`--profile demo` + `DEMO_MODE=true` together:

- Seed a demo admin, team, customers, jobs and a pricebook on first boot.
- **Auth:** local email/password login (the Google button is hidden).
- **Storage:** job photos upload to MinIO — open any job → **Photos** → **Upload Photo**.
- **Email:** team-invite emails are caught by Mailpit instead of being sent.
- **Twilio / QuickBooks:** dormant — SMS is logged to the console, QuickBooks
  live auth is disabled (the "Connect" path stays visible).

Tear down (and wipe data) with `docker compose --profile demo down -v`.

### Same file, production

The compose file is production-capable by **changing only `.env`** — omit the
profile so MinIO/Mailpit don't start and the app uses your external services:

```bash
# in .env: DEMO_MODE=false, real DATABASE_URL, S3_*/SMTP_* → Wasabi + real SMTP,
#          plus any Google / QuickBooks / Twilio creds you use
docker compose up -d --build
```

---

## Supported Trade Types

| Trade | `BRAND_TRADE_TYPE` |
|-------|--------------------|
| Electrical | `electrical` |
| Plumbing | `plumbing` |
| HVAC | `hvac` |
| General Contracting | `contracting` |

Each trade gets trade-specific job type lists, a technician label, and a pre-seeded pricebook.

---

## Quick Start

```bash
git clone https://github.com/AlexJ2804/modern-blue-collar.git
cd modern-blue-collar/backend
npm install
cp .env.example .env   # edit with your values
npm run migrate
npm run generate
npm run seed:admin
npm run seed:prices
npm run dev
```

Then open http://localhost:3001.

See **[SETUP.md](SETUP.md)** for the full local development guide.  
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for production deployment (VPS, Railway, Render, Fly.io).

---

## White-Label in 60 Seconds

Edit `.env`:

```ini
BRAND_COMPANY_NAME=Apex Plumbing LLC
BRAND_TRADE_TYPE=plumbing
BRAND_COLOR_PRIMARY=#1565c0
BRAND_DEFAULT_STATE=TX
```

That's it. No other files need to change.

---

## Tech Stack

- **Backend:** Node.js / Express
- **Database:** PostgreSQL via Prisma ORM
- **Frontend:** Vanilla HTML/JS/CSS (no framework dependency)
- **Auth:** JWT email/password + Google OAuth (Passport.js)
- **SMS:** Twilio
- **Accounting:** QuickBooks Online API
- **Object storage:** AWS S3 SDK — MinIO locally, Wasabi / S3 in production
- **Scheduler:** node-cron
- **Local demo stack:** Docker Compose (PostgreSQL · MinIO · Mailpit)

---

## License

MIT
