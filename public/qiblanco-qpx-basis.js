/*!
 * qpx-basis.js — Cookielose BASIS-EBENE (einwilligungsfrei) fuer Qi-Blanco.
 * =========================================================================
 * Eigenstaendiges Mikro-Pixel (KEINE Abhaengigkeit zu qpx.js). Es misst
 * ~100% des Traffics OHNE vorherige Cookie-Einwilligung — compliant by design:
 *
 *   - Setzt/liest KEINE Cookies, KEIN localStorage, KEIN sessionStorage.
 *   - Meldet seit 2026-08-28 auch clientseitige Seitenwechsel der Hydrogen-SPA
 *     (History-Hook, siehe unten). Das aendert NICHTS an der Einwilligungs-
 *     freiheit: es wird weiterhin nichts auf dem Endgeraet gelesen oder
 *     gespeichert, es entsteht keine besuchsuebergreifende ID, und die Nutzlast
 *     bleibt Pfad/Verweis/Plattform-Klasse ohne Query.
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
    // Mehrfach-Einbindung darf NICHT doppelt zählen (und den History-Hook nicht
    // doppelt legen). Reine Seiten-Lebenszeit im Speicher: kein Storage, keine
    // ID, beim Entladen weg — die Einwilligungsfreiheit bleibt unberührt.
    if (w.__qpxBasisAktiv === true) return;
    w.__qpxBasisAktiv = true;
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
    // Verweis und Plattform-Klasse werden EINMAL beim Einstieg bestimmt und für
    // alle weiteren Hits desselben Besuchs beibehalten. Grund: d.referrer ändert
    // sich bei clientseitiger Navigation nicht, und die Klick-ID steht nur in der
    // Einstiegs-URL. Die Spalte heißt serverseitig `entry_platform` — genau das
    // ist die Semantik. So bleibt die cookielose Ebene mit qpx.js vergleichbar,
    // das die Zuordnung ebenfalls über den ganzen Besuch hält; ohne das würde
    // jeder SPA-Wechsel fälschlich als verweisloser Direkt-Zugriff gezählt.
    var referrer = d.referrer || '';

    function sende(pfad) {
      // Seite OHNE Query/Fragment (keine Klick-ID/PII im Nutzlast-URL).
      var url = w.location.protocol + '//' + w.location.host + pfad;
      var body = JSON.stringify({url, referrer, platform});
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
    }

    // DOPPELZÄHLUNG BAULICH AUSGESCHLOSSEN: `letzterPfad` wird vom Erstaufruf
    // gesetzt, bevor irgendein Hook liegt. Gemeldet wird nur eine echte
    // AENDERUNG des Pfades — ein replaceState auf denselben Pfad (Hydrogen setzt
    // so Filter/Query) und ein doppelt gefeuertes popstate bleiben damit stumm.
    // Query und Fragment sind bewusst kein Teil des Vergleichs: sie stehen auch
    // nicht in der Nutzlast, ein reiner Query-Wechsel ist also kein neuer Hit.
    var letzterPfad = null;

    function melde() {
      var pfad = w.location.pathname;
      if (pfad === letzterPfad) return;
      letzterPfad = pfad;
      sende(pfad);
    }

    melde(); // Erstaufruf (Dokument-Load) — unveraendertes Verhalten von vorher

    // SPA-HOOK: die Hydrogen-Storefront wechselt die Seite clientseitig, ohne
    // ein neues Dokument zu laden. Ohne diesen Hook sieht die cookielose Ebene
    // ausschließlich den EINSTIEG eines Besuchs, während qpx.js jeden Wechsel
    // zählt — der Abdeckungs-Quotient vergleicht dann Einstiege gegen
    // Navigationen und wird größer als 100 %.
    function wickle(name) {
      var orig = w.history && w.history[name];
      if (typeof orig !== 'function') return;
      w.history[name] = function () {
        var r = orig.apply(this, arguments);
        try {
          melde(); // nach dem Original: location ist hier bereits aktualisiert
        } catch (errHook) {
          void errHook;
        }
        return r;
      };
    }
    try {
      wickle('pushState');   // Vorwaerts-Navigation der SPA
      wickle('replaceState');
      w.addEventListener('popstate', melde);  // Zurück/Vorwärts im Browser
    } catch (errWire) {
      void errWire; // ohne History-API bleibt es beim Einstiegs-Hit
    }
  } catch (errTop) {
    void errTop; // never-break: harte Kapselung, keine Seiten-Wirkung
  }
})(window, document);
