# ─────────────────────────────────────────────────────────────────────────────
# Modern Blue Collar — production-capable Node image.
# The build context is the repo ROOT, because the backend requires
# ../brand.config.js (white-label config that lives at the repo root).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim

# openssl: required by Prisma's query engine.
# postgresql-client: provides pg_dump for the nightly DB backup job.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl postgresql-client \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Install dependencies first for better layer caching. The Prisma schema is
#    copied before `npm ci` so the postinstall `prisma generate` can run.
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npm ci --omit=dev

# 2) Copy application source. node_modules is excluded via .dockerignore, so the
#    image's installed dependencies are preserved.
WORKDIR /app
COPY brand.config.js ./brand.config.js
COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate

# Drop privileges.
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
