/* Prevent the home screen from being redrawn for every addon response during startup. */
(() => {
  'use strict';

  function installRouteGuard() {
    if (typeof window.route !== 'function') return false;
    if (window.route.__lumoStartupGuard) return true;

    const originalRoute = window.route;
    let lastHash = location.hash;
    const guardedRoute = function(...args) {
      const currentHash = location.hash;
      let addonsLoading = false;
      try {
        // S is a top-level lexical binding in the existing app script.
        addonsLoading = typeof S !== 'undefined' && !!S.ld;
      } catch {}

      // bootAddons reports progress by calling route() after each manifest.
      // Those repeated same-route renders cause the visible startup flicker.
      // Keep route changes responsive, and allow the final render when loading ends.
      if (addonsLoading && currentHash === lastHash) return;
      lastHash = currentHash;
      return originalRoute.apply(this, args);
    };
    guardedRoute.__lumoStartupGuard = true;
    window.route = guardedRoute;
    return true;
  }

  // config.js loads before the main inline script defines route(). Install as
  // soon as that script has run; retry briefly for slower browsers.
  if (!installRouteGuard()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installRouteGuard() || attempts >= 100) clearInterval(timer);
    }, 25);
  }
})();
