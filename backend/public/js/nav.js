/**
 * public/js/nav.js — single source of truth for role-based navigation + page guard.
 *
 * The nav markup itself still lives in each page (so per-page brand/colour logic
 * in loadBrand() keeps working untouched); this module owns the ROLE matrix:
 * which nav links a role may see, which pages a technician may open, and the
 * pending-approval screen. Call MBC.start(user) after fetching /api/auth/me.
 *
 * TODO: per-deployment page matrix (dispatcher/office get bespoke views; for now
 * they are treated as admin-minus-api-keys by the server, full nav here).
 */
(function () {
  const ADMIN_ROLES = ['admin', 'super-admin'];
  const isAdmin = (role) => ADMIN_ROLES.includes(role);

  // Where technicians are sent when they hit an admin-only page.
  // Stage 3 repoints this at my-jobs.html.
  const TECH_HOME = 'schedule.html';

  // Pages a technician may open directly. Everything else is admin-only.
  const TECH_PAGES = ['schedule.html', 'job.html'];
  // Nav links (by href) a technician may see. Everything else is admin-only.
  const TECH_NAV_HREFS = ['schedule.html'];

  function currentPage() {
    return (location.pathname.split('/').pop() || 'index.html');
  }

  function hrefFile(a) {
    return (a.getAttribute('href') || '').split('/').pop();
  }

  // Filter the existing nav links by role and highlight the active page.
  function filterNav(role) {
    const admin = isAdmin(role);
    const page = currentPage();
    document.querySelectorAll('nav .nav-links a').forEach((a) => {
      const href = hrefFile(a);
      const allowed = admin || TECH_NAV_HREFS.includes(href);
      a.style.display = allowed ? '' : 'none';
      a.classList.toggle('active', href === page);
    });
  }

  function hideAllNavLinks() {
    document.querySelectorAll('nav .nav-links a').forEach((a) => { a.style.display = 'none'; });
  }

  function showPending() {
    const main = document.querySelector('main') || document.body;
    main.innerHTML =
      '<div style="max-width:520px;margin:4rem auto;text-align:center;padding:2rem;">' +
      '<h2 style="margin-bottom:0.75rem;">Account pending approval</h2>' +
      '<p style="color:#64748b;line-height:1.5;">Your account has been created and is ' +
      'awaiting approval. An admin will activate you shortly — please check back later.</p>' +
      '</div>';
  }

  function logout() { localStorage.removeItem('token'); location.href = 'index.html'; }

  // Render the role-appropriate nav and enforce the UI guard.
  // Returns false when the page should stop loading: a pending user (pending
  // screen shown) or a technician bounced off an admin-only page.
  function start(user) {
    if (user && user.status === 'pending') { hideAllNavLinks(); showPending(); return false; }
    filterNav(user ? user.role : '');
    if (user && !isAdmin(user.role) && !TECH_PAGES.includes(currentPage())) {
      location.href = TECH_HOME;
      return false;
    }
    return true;
  }

  window.MBC = { ADMIN_ROLES, isAdmin, start, logout, showPending, TECH_HOME, TECH_PAGES };
})();
