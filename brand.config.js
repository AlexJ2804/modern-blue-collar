/**
 * brand.config.js
   * ─────────────────────────────────────────────────────────────────────────────
   * Central branding & trade-type configuration for Modern Blue Collar.
   *
   * To white-label this platform for a client, edit ONLY this file.
   * No other source file should contain client-specific strings.
   * ─────────────────────────────────────────────────────────────────────────────
   */

module.exports = {
  // ── Company identity ────────────────────────────────────────────────────────
  companyName:   process.env.BRAND_COMPANY_NAME   || 'Modern Blue Collar',
      companySlogan: process.env.BRAND_COMPANY_SLOGAN || 'Field Service Management',
      companyPhone:  process.env.BRAND_COMPANY_PHONE  || '',
      companyEmail:  process.env.BRAND_COMPANY_EMAIL  || '',
      companyAddress:process.env.BRAND_COMPANY_ADDRESS|| '',

      // ── Trade type ──────────────────────────────────────────────────────────────
      // Supported values: 'electrical' | 'plumbing' | 'hvac' | 'contracting'
      tradeType: process.env.BRAND_TRADE_TYPE || 'electrical',

      // ── UI theme colours (CSS custom properties) ────────────────────────────────
      // Override via BRAND_COLOR_PRIMARY env var or edit defaults below.
      colors: {
    // electrical  → yellow/black
    // plumbing    → blue/silver
    // hvac        → teal/grey
    // contracting → orange/dark
    primary:    process.env.BRAND_COLOR_PRIMARY    || '#f5a623',
          secondary:  process.env.BRAND_COLOR_SECONDARY  || '#1a1a2e',
          accent:     process.env.BRAND_COLOR_ACCENT     || '#ffffff',
          navBg:      process.env.BRAND_COLOR_NAV_BG     || '#1a1a2e',
          navText:    process.env.BRAND_COLOR_NAV_TEXT   || '#ffffff',
          headerBg:   process.env.BRAND_COLOR_HEADER_BG  || '#f5a623',
          headerText: process.env.BRAND_COLOR_HEADER_TEXT|| '#1a1a2e',
      },

        // ── Default state for address fields ────────────────────────────────────────
        defaultState: process.env.BRAND_DEFAULT_STATE || 'KS',

            // ── Pricebook industry label ─────────────────────────────────────────────────
            // Used as the default "industry" value in PriceBookItem records.
            get industryLabel() {
    const map = {
            electrical:  'Electrical',
                    plumbing:    'Plumbing',
                    hvac:        'HVAC',
                    contracting: 'General Contracting',
              };
    return process.env.BRAND_INDUSTRY_LABEL || map[this.tradeType] || 'Electrical';
        },

  // ── Trade-specific job types ─────────────────────────────────────────────────
  get jobTypes() {
        const map = {
                electrical:  ['Panel Upgrade', 'Outlet / Switch', 'Lighting', 'EV Charger', 'Generator', 'Inspection', 'Troubleshooting', 'Other'],
                        plumbing:    ['Leak Repair', 'Drain Cleaning', 'Water Heater', 'Fixture Install', 'Sewer Line', 'Inspection', 'Troubleshooting', 'Other'],
                        hvac:        ['AC Install', 'Furnace Install', 'AC Repair', 'Furnace Repair', 'Duct Work', 'Tune-Up', 'Inspection', 'Other'],
                        contracting: ['Framing', 'Drywall', 'Flooring', 'Roofing', 'Painting', 'Demo', 'General Repair', 'Other'],
                  };
    return map[this.tradeType] || map.electrical;
  },

  // ── Trade-specific technician label ──────────────────────────────────────────
  get technicianLabel() {
        const map = {
                electrical:  'Electrician',
                        plumbing:    'Plumber',
                        hvac:        'HVAC Technician',
                        contracting: 'Contractor',
                  };
    return process.env.BRAND_TECH_LABEL || map[this.tradeType] || 'Technician';
  },

  // ── Timezone for scheduled jobs & cron tasks ─────────────────────────────────
  timezone: process.env.BRAND_TIMEZONE || 'America/Chicago',
    };
