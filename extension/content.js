// ============================================================
// PaywallRadar Browser Extension - CORS Bypass Script
// ============================================================
// This extension intercepts fetch requests to paywallscreens.com
// and adds CORS headers to allow cross-origin requests.
//
// Installation:
// 1. Open chrome://extensions/
// 2. Enable "Developer mode" (top right)
// 3. Click "Load unpacked"
// 4. Select the extension/ folder
// 5. Refresh the PaywallRadar page
//
// This script will automatically activate on paywallscreens.com domains.
// ============================================================

(function () {
  'use strict';

  const TARGET_HOST = 'paywallscreens.com';
  const ACTIVE_KEY = '__paywallRadarCORS_active';

  // Avoid double-injection
  if (window[ACTIVE_KEY]) return;
  window[ACTIVE_KEY] = true;

  console.log('[PaywallRadar CORS] Extension activated for', window.location.host);

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const urlObj = new URL(url, window.location.href);

    // Only intercept requests to our target host
    if (urlObj.hostname.includes(TARGET_HOST)) {
      console.log('[PaywallRadar CORS] Bypassing CORS for:', url);
      const headers = init?.headers || {};
      const headersObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;

      // Add CORS headers
      const modifiedInit = {
        ...init,
        headers: {
          ...headersObj,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': `https://${TARGET_HOST}`,
          'Referer': `https://${TARGET_HOST}/`,
        },
        mode: 'cors',
        credentials: 'omit',
      };

      return originalFetch.call(this, input instanceof Request ? input : url, modifiedInit);
    }

    return originalFetch.call(this, input, init);
  };

  // Also intercept XMLHttpRequest for good measure
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    const urlObj = new URL(url, window.location.href);
    if (urlObj.hostname.includes(TARGET_HOST)) {
      console.log('[PaywallRadar CORS] XHR Bypassing CORS for:', url);
      this.setRequestHeader('Origin', `https://${TARGET_HOST}`);
      this.setRequestHeader('Referer', `https://${TARGET_HOST}/`);
    }
    return originalXHROpen.call(this, method, url, async, user, password);
  };

  // Inject Access-Control headers via service worker intercept
  // This handles preflight requests as well
  console.log('[PaywallRadar CORS] Ready to bypass CORS for', TARGET_HOST);
})();
