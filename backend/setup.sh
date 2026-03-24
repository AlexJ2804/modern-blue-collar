#!/bin/bash
# ============================================================
# modern-blue-collar — Quick Setup Script
# Run from the backend/ directory: bash setup.sh
# ============================================================

set -e

echo ""
echo "====================================="
echo " modern-blue-collar Setup"
echo "====================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js not found. Install Node 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

echo "Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "[1/5] Installing dependencies..."
npm install

# Copy .env if not exists
echo ""
echo "[2/5] Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
  echo "  IMPORTANT: Edit .env with your actual values before continuing."
else
  echo "  .env already exists — skipping."
fi

# Generate JWT secret if placeholder
if grep -q "CHANGE_ME" .env 2>/dev/null; then
  echo ""
  echo "  Generating random JWT_SECRET..."
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/JWT_SECRET=CHANGE_ME.*/JWT_SECRET=$JWT_SECRET/" .env
  else
    sed -i "s/JWT_SECRET=CHANGE_ME.*/JWT_SECRET=$JWT_SECRET/" .env
  fi
  echo "  JWT_SECRET set in .env"
fi

# Prisma setup
echo ""
echo "[3/5] Setting up database..."
npx prisma generate
npx prisma migrate dev --name init || npx prisma db push

# Seed superadmin
echo ""
echo "[4/5] Seeding superadmin..."
SUPERADMIN_EMAIL=${SUPERADMIN_EMAIL:-admin@example.com}
SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD:-changeme123}
SUPERADMIN_NAME=${SUPERADMIN_NAME:-Admin}
SUPERADMIN_EMAIL=$SUPERADMIN_EMAIL SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD SUPERADMIN_NAME=$SUPERADMIN_NAME node seed_superadmin.js || echo "  (skipped — superadmin may already exist)"

# Optional pricebook seed
echo ""
read -p "[5/5] Seed sample pricebook items? (y/N): " seed_pb
if [[ "$seed_pb" == "y" || "$seed_pb" == "Y" ]]; then
  node seed_pricebook.js
  echo "  Pricebook seeded."
else
  echo "  Skipping pricebook seed."
fi

echo ""
echo "====================================="
echo " Setup complete!"
echo "====================================="
echo ""
echo " Start the server:    node server.js"
echo " Or with auto-reload: npx nodemon server.js"
echo ""
echo " Default superadmin:"
echo "   Email:    ${SUPERADMIN_EMAIL}"
echo "   Password: ${SUPERADMIN_PASSWORD}"
echo ""
echo " Edit brand.config.js (repo root) to customize:"
echo "   - Company name, slogan, trade type"
echo "   - Colors, timezone, technician label"
echo "   - Job types for your trade"
echo ""
