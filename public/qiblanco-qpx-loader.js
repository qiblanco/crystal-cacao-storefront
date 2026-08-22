(function () {
  // Loader für den First-Party-Pixel (qpx). Doppelt gegated:
  // 1. Dieses Script wird überhaupt nur gerendert, wenn PUBLIC_QPX_ENDPOINT
  //    gesetzt ist (root.jsx) — der Rollout-Schalter liegt beim Server-Team.
  // 2. qpx setzt First-Party-Cookies → lädt nur nach Cookiebot-Marketing-Consent
  //    (gleiche Regel wie qiblanco-tracker.js).
  function endpoint() {
    var el = document.querySelector('script[data-qpx-endpoint]');
    return el ? el.getAttribute('data-qpx-endpoint') : '';
  }

  function hasMarketingConsent() {
    return (
      window.Cookiebot &&
      window.Cookiebot.consent &&
      window.Cookiebot.consent.marketing
    );
  }

  function hasPreviewTrackingConsent() {
    return (
      document.documentElement.getAttribute(
        'data-qiblanco-tracking-preview',
      ) === 'true'
    );
  }

  // Region-aware Policy (Job 20260718, Spiegel von consent-policy.js):
  // ohne html[data-qb-consent-strict] strict fuer ALLE (heutiges Verhalten);
  // 'optout'-Region laedt qpx sofort, aktive Ablehnung wird respektiert.
  function regionPolicy() {
    var de = document.documentElement;
    var strict = (de.getAttribute('data-qb-consent-strict') || '')
      .toUpperCase()
      .split(',')
      .filter(function (c) {
        return /^[A-Z]{2}$/.test(c.trim());
      });
    if (!strict.length) return 'consent';
    var region = (de.getAttribute('data-qb-region') || '').toUpperCase();
    if (!region) return 'consent';
    return strict.indexOf(region) >= 0 ? 'consent' : 'optout';
  }

  function hasDeclined() {
    return Boolean(
      window.Cookiebot &&
        window.Cookiebot.hasResponse &&
        window.Cookiebot.consent &&
        !window.Cookiebot.consent.marketing,
    );
  }

  function trackingAllowed() {
    if (hasPreviewTrackingConsent()) return true;
    if (regionPolicy() === 'optout') return !hasDeclined();
    return hasMarketingConsent();
  }

  function boot() {
    if (window._qiblancoQpxBooted) return;
    if (!trackingAllowed()) return;
    var ep = endpoint();
    if (!ep) return;
    window._qiblancoQpxBooted = true;
    window.QPX_CONFIG = {endpoint: ep};
    var s = document.createElement('script');
    s.async = true;
    s.src = '/qiblanco-qpx.js';
    document.head.appendChild(s);
  }

  boot();
  window.addEventListener('CookiebotOnAccept', boot);
  window.addEventListener('CookiebotOnConsentReady', boot);
  window.addEventListener('CookiebotOnLoad', boot);
})();
