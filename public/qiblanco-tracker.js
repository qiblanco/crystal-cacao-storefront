(function () {
  var ATTRIBUTION_STORAGE_KEY = 'qiblanco_checkout_attribution';
  var ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
  var TRACKING_PARAM_NAMES = {
    fbclid: true,
    fbc: true,
    fbp: true,
    _fbc: true,
    _fbp: true,
    gclid: true,
    gbraid: true,
    wbraid: true,
    msclkid: true,
    ttclid: true,
    twclid: true,
    li_fat_id: true,
    epik: true,
    scclid: true,
    sccid: true,
    rdt_cid: true,
    irclickid: true,
    click_id: true,
    clickid: true,
    h_ad_id: true,
    h_click_id: true,
  };

  function isTrackingParamName(name) {
    return TRACKING_PARAM_NAMES[name] || /^utm_[a-z0-9_]+$/i.test(name);
  }

  function collectTrackedParams() {
    if (!window.location.search) return null;

    var params = new URLSearchParams(window.location.search);
    var tracked = [];

    params.forEach(function (value, name) {
      if (value && isTrackingParamName(name)) tracked.push([name, value]);
    });

    return tracked.length ? tracked : null;
  }

  function buildAttributionRecord(tracked) {
    return {
      params: tracked,
      href: window.location.href,
      referrer: document.referrer || '',
      savedAt: new Date().toISOString(),
    };
  }

  // Puffert Klick-IDs SOFORT beim Seitenaufruf in sessionStorage — auch VOR der
  // Cookie-Zustimmung. sessionStorage ist kein Cookie, verlässt den Browser-Tab
  // nicht und verfällt mit der Session: reiner technischer Zwischenspeicher,
  // damit die Zuordnung nicht verloren ist, wenn der Besucher erst später im
  // Funnel zustimmt oder per SPA-Navigation weitergeklickt hat, bevor er
  // zustimmt. Ein Cookie entsteht erst NACH Marketing-Consent (persist…).
  function bufferAttributionParams() {
    var tracked = collectTrackedParams();
    if (!tracked) return;

    try {
      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(buildAttributionRecord(tracked)),
      );
    } catch {
      // Session storage can be unavailable in restricted browser contexts.
    }
  }

  function readBufferedAttribution() {
    try {
      return window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  // Nur mit Consent: gepufferte (oder aktuelle) Klick-IDs als Cookie sichern,
  // damit der Server sie in die Order-note_attributes schreiben kann.
  function persistAttributionParams() {
    var serialized = readBufferedAttribution();

    if (!serialized) {
      var tracked = collectTrackedParams();
      if (!tracked) return;
      serialized = JSON.stringify(buildAttributionRecord(tracked));
      try {
        window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
      } catch {
        // Session storage can be unavailable in restricted browser contexts.
      }
    }

    try {
      writeAttributionCookie(serialized);
    } catch {
      // Cookie writes can be unavailable in restricted browser contexts.
    }
  }

  function writeAttributionCookie(serialized) {
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      ATTRIBUTION_STORAGE_KEY +
      '=' +
      encodeURIComponent(serialized) +
      '; Max-Age=' +
      ATTRIBUTION_COOKIE_MAX_AGE +
      '; Path=/; SameSite=Lax' +
      secure;
  }

  // K3-ABWEICHUNG (crystal-cacao-storefront) gegenueber der Vorlage
  // qiblanco-storefront public/qiblanco-tracker.js @ 89c2422:
  // Die Vorlage laedt hier FEST das Hyros-Universal-Script von t.qiblanco.com
  // mit der Tag-Kennung DER HAUPTSEITE. Byte-gleich uebernommen wuerde der
  // Traffic der zweiten Domain unter der Kennung der ersten verbucht — eine
  // Attributions-Entscheidung, die dieser Bau nicht still treffen darf.
  // Deshalb kommt die Basis-URL aus dem Script-Tag (`data-hyros-tag`, gesetzt
  // aus PUBLIC_HYROS_TAG_URL im root-Loader). Ohne sie laedt NICHTS.
  // ALLES UEBRIGE dieser Datei bleibt unveraendert — insbesondere
  // persistClickCookies() (fbclid -> _fbc) und persistAttributionParams(),
  // die den Kaufweg-Teil der Naht tragen und domain-neutral sind.
  function hyrosTagUrl() {
    try {
      var el = document.querySelector('script[data-hyros-tag]');
      return el ? el.getAttribute('data-hyros-tag') || '' : '';
    } catch (err) {
      void err;
      return '';
    }
  }

  function boot() {
    if (window._qiblancoBooted) return;
    var base = hyrosTagUrl();
    if (!base) return;
    window._qiblancoBooted = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = base + encodeURIComponent(location.href);
    document.head.appendChild(s);
  }
  function ready() {
    if (trackingAllowed()) {
      persistClickCookies();
      persistAttributionParams();
      boot();
    }
  }

  // SPA-Navigation: falls eine client-seitige Route neue Klick-IDs in der URL
  // trägt (z.B. interne Kampagnen-Links), nachpuffern — und bei vorhandenem
  // Consent direkt persistieren.
  function hookSpaNavigation() {
    if (window._qiblancoAttrSpaHooked) return;
    window._qiblancoAttrSpaHooked = true;

    function onNavigate() {
      window.setTimeout(function () {
        bufferAttributionParams();
        if (trackingAllowed()) {
          persistClickCookies();
          persistAttributionParams();
        }
      }, 0);
    }

    var pushState = window.history.pushState;
    var replaceState = window.history.replaceState;

    window.history.pushState = function () {
      pushState.apply(window.history, arguments);
      onNavigate();
    };

    window.history.replaceState = function () {
      replaceState.apply(window.history, arguments);
      onNavigate();
    };

    window.addEventListener('popstate', onNavigate);
  }

  // ---- Region-aware Consent-Policy (Job 20260718) -------------------------
  // html[data-qb-region] = Oxygen-Geo-Land, html[data-qb-consent-strict] =
  // Laender mit Consent-Pflicht (Oxygen-Env, Christian-Hand). OHNE das
  // Attribut gilt strict fuer ALLE (= heutiges Verhalten, fail-closed).
  // 'optout'-Regionen: Tracking erlaubt, AUSSER aktiv abgelehnt (Cookiebot
  // hasResponse + !marketing) — nie gegen erklaerten Willen.
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

  // ---- First-Party-Click-Capture (_fbc aus fbclid, Job 20260718) ----------
  // DACH-Aequivalent des USA-qb-click-capture: Meta-konform fb.1.<ts>.<fbclid>,
  // NUR aus echtem fbclid (nie erfinden, nie hashen), existierendes _fbc hat
  // Vorrang (fbevents.js gewinnt). Laeuft NUR mit trackingAllowed().
  function readCookie(name) {
    try {
      var m = document.cookie.match(
        new RegExp('(?:^|; )' + name + '=([^;]*)'),
      );
      return m ? decodeURIComponent(m[1]) : '';
    } catch {
      return '';
    }
  }

  function bufferedFbclid() {
    try {
      var rec = JSON.parse(readBufferedAttribution() || 'null');
      if (!rec || !rec.params) return '';
      for (var i = 0; i < rec.params.length; i++) {
        if (rec.params[i][0] === 'fbclid') return rec.params[i][1];
      }
    } catch {
      // kaputter Puffer -> kein fbclid
    }
    return '';
  }

  function persistClickCookies() {
    try {
      if (readCookie('_fbc')) return;
      var fbclid =
        new URLSearchParams(window.location.search).get('fbclid') ||
        bufferedFbclid();
      if (!fbclid) return;
      var value = 'fb.1.' + Date.now() + '.' + fbclid;
      var suffix =
        '; Path=/; Max-Age=' +
        60 * 60 * 24 * 90 +
        '; SameSite=Lax' +
        (window.location.protocol === 'https:' ? '; Secure' : '');
      var host = window.location.hostname || '';
      if (/(^|\.)qiblanco\.com$/.test(host)) {
        document.cookie = '_fbc=' + value + suffix + '; Domain=.qiblanco.com';
      }
      if (!readCookie('_fbc')) {
        document.cookie = '_fbc=' + value + suffix;
      }
    } catch {
      // Cookie-Schreiben nicht verfuegbar -> still bleiben
    }
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

  bufferAttributionParams();
  hookSpaNavigation();
  ready();
  window.addEventListener('CookiebotOnAccept', ready);
  window.addEventListener('CookiebotOnDecline', function () {
    // optout-Region + aktive Ablehnung: ab jetzt kein persist/boot mehr
    // (bereits geladene Drittscripte dieser Seite lassen sich nicht
    // entladen; ab der naechsten Navigation greift trackingAllowed()).
  });
  window.addEventListener('CookiebotOnConsentReady', ready);
  window.addEventListener('CookiebotOnLoad', ready);
})();
