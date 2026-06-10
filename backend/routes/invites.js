/**
 * routes/invites.js  — Google OAuth team invite + auto-provisioning flow
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
 *
 * GET /api/invites/send?email=x   — send invite email (admin+)
 * GET /api/auth/google            — redirect to Google OAuth
 * GET /api/auth/google/callback   — Google callback; provisions/authenticates user
 *
 * Note: this router is mounted at BOTH /api/invites AND /api/auth so that the
 * Google callback URL works as /api/auth/google/callback.
 *
 * Provisioning model (multi-tenant, replaces Kraft's Admin-SDK directory sync):
 *   - First Google sign-in auto-creates a platform account, restricted to the
 *     client's Workspace domain(s) (BRAND_ALLOWED_DOMAINS), as a PENDING
 *     technician that an admin must approve before it gets data access.
 *   - Ghost admins (GHOST_ADMIN_EMAILS) are platform-support accounts that
 *     bypass the domain + pending gates, are provisioned as super-admin, and
 *     are audited on every sign-in and write.
 *   - Domain restriction applies to ACCOUNT CREATION only; existing users sign
 *     in regardless of domain.
 */

require('dotenv').config();
const express   = require('express');
const router    = express.Router();
const passport  = require('passport');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('./auth');
const { writeAudit } = require('../helpers/audit');
const brand     = require('../../brand.config');

const prisma = new PrismaClient();

// Emails granted ghost-admin (platform support) access. Config-driven per
// deployment (improvement over Kraft's hardcoded ADMIN_EMAILS list).
function ghostAdminEmails() {
  return (process.env.GHOST_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

async function randomPassword() {
  return bcrypt.hash(Math.random().toString(36) + Date.now().toString(36), 10);
}

// ── Configure Passport Google strategy (lazy init) ─────────────────────────────
let passportConfigured = false;
function ensurePassportGoogle() {
  if (passportConfigured) return;
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  }, async (req, _accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error('No email from Google profile'));

      const firstName = profile.name?.givenName  || '';
      const lastName  = profile.name?.familyName || '';
      const ip        = req.ip;

      let user = await prisma.user.findUnique({ where: { email } });

      // ── 1. Ghost admin — bypass domain + pending, always super-admin, audited.
      if (ghostAdminEmails().includes(email)) {
        if (!user) {
          user = await prisma.user.create({
            data: {
              email, password: await randomPassword(), firstName, lastName,
              role: 'super-admin', isGhost: true, status: 'active', active: true,
            },
          });
        } else if (!user.isGhost || user.role !== 'super-admin'
                   || user.status !== 'active' || !user.active) {
          // Keep an existing ghost account in the expected support state.
          user = await prisma.user.update({
            where: { id: user.id },
            data:  { isGhost: true, role: 'super-admin', status: 'active', active: true },
          });
        }
        await writeAudit({ userId: user.id, action: 'ghost-login', detail: `Google sign-in (${email})`, ip });
        return done(null, user);
      }

      // ── 2. Existing (non-ghost) user — authenticate, respecting active/status.
      if (user) {
        if (!user.active || user.status === 'deactivated') {
          return done(new Error('Account is deactivated. Contact an admin.'));
        }
        return done(null, user);
      }

      // ── 3. New user — auto-provision only if their domain is allow-listed.
      const domain  = email.split('@')[1] || '';
      const allowed = brand.allowedDomains;
      if (allowed.length && allowed.includes(domain)) {
        user = await prisma.user.create({
          data: {
            email, password: await randomPassword(), firstName, lastName,
            role: 'technician', status: 'pending', active: true,
          },
        });
        return done(null, user);
      }

      // ── 4. New + domain not allowed (or no allow-list configured) → fail closed.
      return done(new Error('Your account is not permitted to sign in. Contact an admin.'));
    } catch (err) { done(err); }
  }));
  passportConfigured = true;
}

// GET /api/auth/google
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google OAuth not configured' });
  ensurePassportGoogle();
  const opts = { scope: ['profile', 'email'], session: false };
  // `hd` pre-selects the Workspace domain in Google's account picker. It is a UX
  // hint only — the authoritative domain check happens server-side in the strategy.
  const primaryDomain = brand.allowedDomains[0];
  if (primaryDomain) opts.hd = primaryDomain;
  passport.authenticate('google', opts)(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  ensurePassportGoogle();
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`/?auth_error=${encodeURIComponent(err?.message || 'OAuth failed')}`);
    }
    const token = jwt.sign(
      {
        id: user.id, email: user.email, role: user.role,
        firstName: user.firstName, lastName: user.lastName,
        status: user.status, isGhost: user.isGhost,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    // Redirect to frontend with token (front-end stores it). Pending users land
    // on the app and see the "pending approval" screen.
    res.redirect(`/?token=${token}`);
  })(req, res, next);
});

// POST /api/invites/send — admin+ sends an invite email
router.post('/send', requireAuth, requireRole('super-admin', 'admin'), async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    // Build invite link that starts the Google OAuth flow
    const inviteLink = `${process.env.APP_URL}/api/auth/google`;

    // Send via nodemailer if configured, else return the link
    if (process.env.SMTP_HOST) {
      const nodemailer = require('nodemailer');
      const transport  = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({
        from:    `"${brand.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to:      email,
        subject: `You've been invited to join ${brand.companyName}`,
        text:    `Click the link to accept your invite: ${inviteLink}`,
        html:    `<p>You've been invited to join <strong>${brand.companyName}</strong>.</p><p><a href="${inviteLink}">Accept Invite</a></p>`,
      });
    }

    res.json({ success: true, inviteLink, message: `Invite sent to ${email}` });
  } catch (err) { next(err); }
});

module.exports = router;
