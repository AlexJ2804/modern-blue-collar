/**
 * routes/quickbooks.js  — QuickBooks Online OAuth2 integration
 * Requires: QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REDIRECT_URI, QB_ENVIRONMENT
 *
 * GET  /api/quickbooks/connect        — redirect to QBO OAuth
 * GET  /api/quickbooks/callback       — OAuth callback, stores tokens
 * POST /api/quickbooks/sync-invoice/:id — push invoice to QBO
 * GET  /api/quickbooks/status         — connection status
 */
const express         = require('express');
const router          = express.Router();
const { requireAuth, requireRole } = require('./auth');
const brand           = require('../../brand.config');

// In-memory token store — replace with DB storage in production
let qboTokens = null;

function getOAuthClient() {
  const OAuthClient = require('intuit-oauth');
  return new OAuthClient({
    clientId:     process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    environment:  process.env.QB_ENVIRONMENT || 'sandbox',
    redirectUri:  process.env.QB_REDIRECT_URI,
  });
}

// GET /api/quickbooks/status
router.get('/status', requireAuth, (_req, res) => {
  res.json({
    connected:   !!qboTokens,
    environment: process.env.QB_ENVIRONMENT || 'sandbox',
    companyName: brand.companyName,
  });
});

// GET /api/quickbooks/connect  — initiates OAuth flow
router.get('/connect', requireAuth, requireRole('super-admin', 'admin'), (_req, res) => {
  if (!process.env.QB_CLIENT_ID) return res.status(503).json({ error: 'QuickBooks not configured — set QB_* env vars' });
  const oauthClient = getOAuthClient();
  const authUri = oauthClient.authorizeUri({
    scope:  [require('intuit-oauth').scopes.Accounting],
    state:  'qbo-auth',
  });
  res.redirect(authUri);
});

// GET /api/quickbooks/callback
router.get('/callback', async (req, res, next) => {
  try {
    const oauthClient = getOAuthClient();
    const authResponse = await oauthClient.createToken(req.url);
    qboTokens = authResponse.getJson();
    res.redirect('/?qbo=connected');
  } catch (err) { next(err); }
});

// POST /api/quickbooks/sync-invoice/:id — stub; implement full QBO API call as needed
router.post('/sync-invoice/:id', requireAuth, async (_req, res) => {
  if (!qboTokens) return res.status(400).json({ error: 'Not connected to QuickBooks. Visit /api/quickbooks/connect first.' });
  // TODO: implement full invoice push to QBO using qboTokens
  res.json({ success: true, message: 'Invoice sync to QuickBooks — implement full QBO API call here.' });
});

module.exports = router;
