// Stabilize the initial screen while addon manifests load. The app currently
// reports addon progress by calling route() repeatedly; each call redraws #app.
(() => {
  'use strict';
  if (typeof window.route !== 'function' || window.route.__lumoStartupGuard) return;

  const originalRoute = window.route;
  let lastHash = location.hash;
  function guardedRoute(...args) {
    const currentHash = location.hash;
    let loadingAddons = false;
    try {
      loadingAddons = typeof S !== 'undefined' && Boolean(S.ld);
    } catch {}

    // Ignore progress-triggered redraws for the current route. A route change
    // still renders immediately, and bootAddons renders once more when done.
    if (loadingAddons && currentHash === lastHash) return;
    lastHash = currentHash;
    return originalRoute.apply(this, args);
  }
  guardedRoute.__lumoStartupGuard = true;
  window.route = guardedRoute;
})();
