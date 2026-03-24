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
- **Database:** SQLite via Prisma ORM (PostgreSQL-ready)
- **Frontend:** Vanilla HTML/JS/CSS (no framework dependency)
- **Auth:** JWT + Google OAuth (Passport.js)
- **SMS:** Twilio
- **Accounting:** QuickBooks Online API
- **Scheduler:** node-cron

---

## License

MIT
