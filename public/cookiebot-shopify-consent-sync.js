(function () {
  function hideBanner() {
    var el = document.getElementById('cookiebanner');
    if (el) el.style.display = 'none';
    var edit = document.getElementById('edit-cookie-consent');
    if (edit) edit.style.display = 'none';
    document.body.style.overflow = '';
  }
  window.hideCookieBanner = hideBanner;
  window.changeConsentToAll = function () {
    if (window.Cookiebot && typeof window.Cookiebot.submitCustomConsent === 'function') {
      window.Cookiebot.submitCustomConsent(true, true, true);
    }
    hideBanner();
  };
  window.cookieBannerToggle = function () {
    var main = document.getElementById('cookie-consent-banner');
    var edit = document.getElementById('edit-cookie-consent');
    if (!main || !edit) return;
    var showingEdit = edit.style.display === 'block';
    edit.style.display = showingEdit ? 'none' : 'block';
    main.style.display = showingEdit ? 'block' : 'none';
  };

  function syncShopifyConsent() {
    var cb = window.Cookiebot;
    if (!cb || !cb.consent) return false;
    var sp = window.Shopify && window.Shopify.customerPrivacy;
    if (!sp || typeof sp.setTrackingConsent !== 'function') return false;
    sp.setTrackingConsent(
      {
        analytics: !!cb.consent.statistics,
        marketing: !!cb.consent.marketing,
        preferences: !!cb.consent.preferences,
        sale_of_data: !!cb.consent.marketing,
      },
      function () {},
    );
    return true;
  }
  function trySync() {
    if (syncShopifyConsent()) return;
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (syncShopifyConsent() || attempts > 40) clearInterval(iv);
    }, 250);
  }
  window.addEventListener('CookiebotOnAccept', trySync);
  window.addEventListener('CookiebotOnDecline', trySync);
  window.addEventListener('CookiebotOnConsentReady', trySync);
})();
