/*!
 * qpx-basis.js — Cookielose BASIS-EBENE (einwilligungsfrei) fuer Qi-Blanco.
 * =========================================================================
 * Eigenstaendiges Mikro-Pixel (KEINE Abhaengigkeit zu qpx.js). Es misst
 * ~100% des Traffics OHNE vorherige Cookie-Einwilligung — compliant by design:
 *
 *   - Setzt/liest KEINE Cookies, KEIN localStorage, KEIN sessionStorage.
 *   - Erzeugt KEINE persistente Besucher-ID (kein anon_id, kein Fingerprint).
 *   - Sendet nur: Seite (Origin+Pfad, OHNE Query), Referrer, grobe Ad-Plattform-
 *     KLASSE (aus einer evtl. vorhandenen Klick-ID abgeleitet — NIE die ID selbst).
 *   - Die Besucher-Unterscheidung entsteht ERST serverseitig aus einem TAEGLICH
 *     rotierenden Salt-Hash(IP+UA), der nach 24h verworfen wird (siehe Receiver).
 *
 * DESHALB einwilligungsfrei einsetzbar (Datenminimierung, Art. 5 DSGVO;
 * kein Zugriff auf Endgeraet-Informationen i.S.v. TDDDG/ePrivacy, da weder
 * gelesen noch gespeichert wird). Die reichhaltige, IDENTIFIZIERTE Ebene
 * (qpx.js: anon_id-Cookie, Sektions-Tracker) bleibt UNVERAENDERT hinter dem
 * Cookiebot-Consent-Gate — dieses Skript ersetzt sie NICHT.
 *
 * EINBAU (Christian-Hand, Storefront-PR): dieses Skript UNBEDINGT/consent-
 * unabhaengig laden; qpx.js weiterhin NUR nach Consent laden.
 * Endpoint via <script data-qpx-basis-endpoint="…"> oder window.QPX_BASIS.
 */
(function (w, d) {
  'use strict';
  try {
    var CFG = w.QPX_BASIS || {};
    if (CFG.off === true) return; // Kill-Flag (Storefront)
    // Endpoint: 1) Script-Tag data-Attribut (Storefront env-gated), 2) window-
    //   Config, 3) Default /b (gleicher Origin via Reverse-Proxy).
    var tagEp = '';
    try {
      var el = d.currentScript || d.querySelector('script[data-qpx-basis-endpoint]');
      if (el) tagEp = el.getAttribute('data-qpx-basis-endpoint') || '';
    } catch (errTag) {
      void errTag;
    }
    var endpoint = tagEp || CFG.endpoint || '/b';
    // Ad-Plattform-KLASSE aus vorhandener Klick-ID ableiten (nur die Klasse!).
    var klass = {
      gclid: 'google', gbraid: 'google', wbraid: 'google',
      fbclid: 'meta', msclid: 'bing', msclkid: 'bing',
      ttclid: 'tiktok', twclid: 'twitter', epik: 'pinterest', sccid: 'snapchat',
    };
    var platform = '';
    var qs = w.location.search.replace(/^\?/, '');
    if (qs) {
      var parts = qs.split('&');
      for (var i = 0; i < parts.length; i++) {
        var key = decodeURIComponent(parts[i].split('=')[0] || '');
        if (klass[key]) { platform = klass[key]; break; }
      }
    }
    // Seite OHNE Query/Fragment (keine Klick-ID/PII im Nutzlast-URL).
    var url = w.location.protocol + '//' + w.location.host + w.location.pathname;
    var payload = {url, referrer: d.referrer || '', platform};
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], {type: 'application/json'});
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
    } catch (errBeacon) {
      void errBeacon; // sendBeacon nicht verfuegbar -> fetch-Fallback
    }
    try {
      fetch(endpoint, {
        method: 'POST', body, keepalive: true, mode: 'cors',
        headers: {'Content-Type': 'application/json'},
      });
    } catch (errFetch) {
      void errFetch; // still: ein Pixel-Fehler bricht die Seite NIE
    }
  } catch (errTop) {
    void errTop; // never-break: harte Kapselung, keine Seiten-Wirkung
  }
})(window, document);
