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

    function sendeAn(ziel, body) {
      try {
        if (navigator.sendBeacon) {
          var blob = new Blob([body], {type: 'application/json'});
          if (navigator.sendBeacon(ziel, blob)) return;
        }
      } catch (errBeacon) {
        void errBeacon; // sendBeacon nicht verfuegbar -> fetch-Fallback
      }
      try {
        fetch(ziel, {
          method: 'POST', body, keepalive: true, mode: 'cors',
          headers: {'Content-Type': 'application/json'},
        });
      } catch (errFetch) {
        void errFetch; // still: ein Pixel-Fehler bricht die Seite NIE
      }
    }

    function sende(pfad) {
      // Seite OHNE Query/Fragment (keine Klick-ID/PII im Nutzlast-URL).
      var url = w.location.protocol + '//' + w.location.host + pfad;
      sendeAn(endpoint, JSON.stringify({url, referrer, platform}));
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

    // =====================================================================
    // ANONYME ZÄHLUNG, VARIANTE 2 (js-anonym) — Christian 05.10.2026: "die,
    // die ablehnen, anonym das Verhalten tracken … live schalten".
    // Vertrag: heatmap-manager/docs/VERTRAG-anonyme-zaehlung.md, Abschnitt 1b.
    //
    // Je Seitenbesuch GENAU EINE Zusammenfassung an …/a (abgeleitet aus dem
    // /b-Endpunkt): welche Abschnitte sichtbar waren, die höchste Tiefen-
    // Stufe, Klicks als Abschnitt + Zielklasse (+ Zielpfad bei internen
    // Zielen). Gesendet beim ersten Verlassen (pagehide bzw.
    // visibilitychange=hidden) oder beim SPA-Seitenwechsel. Kehrt der Besuch
    // in den Tab zurück, kommt keine zweite Meldung: die Zahl der Meldungen
    // ist die Zahl der Seitenbesuche.
    //
    // Wie oben: kein Cookie, kein Storage, keine Kennung. Dazu keine
    // Koordinaten, keine Zeitstempel, kein Text, keine Eingaben. Bei
    // navigator.globalPrivacyControl === true läuft dieser Block nicht.
    // /account ist ausgenommen (Bestellnummern im Pfad).
    //
    // GESEHEN: ein Abschnitt zählt nach 1 s Sichtbarkeit IN SUMME (>= 50 %
    // des Elements oder >= 50 % der Fensterhöhe), genau wie die Erfassung mit
    // Einwilligung (qiblanco-qpx.js snapshot(): dwell >= 1000 kumulativ).
    // Ein Austritt hält die Uhr an, setzt sie aber nicht zurück. Bis 06.10.2026
    // verlangte V2 1 s ununterbrochene Sicht und lag dadurch tiefer als G3.
    //
    // GEIST-ABSCHNITTE: beim SPA-Wechsel steht die alte Seite noch einen
    // Moment im DOM. Ein Abschnitt zählt deshalb nur, solange er im Dokument
    // hängt, und die Uhr startet beim Wechsel bei null. Ein Abschnitt der
    // Vorseite wird abgeräumt, bevor er reift.
    // =====================================================================
    try {
      anonymeZaehlung();
    } catch (errAnon) {
      void errAnon; // never-break
    }

    function anonymeZaehlung() {
      if (navigator.globalPrivacyControl === true) return;
      if (!tagEp && !CFG.endpoint) return;
      var ziel = endpoint.replace(/\/b$/, '/a');
      if (ziel === endpoint) return;

      var NAME = /^[A-Za-z0-9_.:-]{1,64}$/;
      var KONTO = /^\/account(\/|$)/;
      var MAX_ABSCHNITTE = 60;
      var MAX_KLICKS = 30;
      var REIFE_MS = 1000;

      var pfad = w.location.pathname;
      var gesehen = {};
      var nGesehen = 0;
      var tiefe = 0;
      var klicks = [];
      var offen = true;
      var beobachtet = [];

      function abschnittName(el) {
        var n = el.getAttribute('data-section') ||
                el.getAttribute('data-section-type') || '';
        return NAME.test(n) ? n : '';
      }

      // z.summe: bisher gesammelte Sichtzeit, z.seit: Beginn der laufenden
      // Sicht (0 = gerade nicht sichtbar).
      function reife(el, jetzt) {
        var z = el.__qpxAnon;
        if (!z) return;
        var ms = (z.summe || 0) + (z.seit ? jetzt - z.seit : 0);
        if (ms < REIFE_MS || el.isConnected === false) return;
        var n = abschnittName(el);
        if (n && !gesehen[n] && nGesehen < MAX_ABSCHNITTE) {
          gesehen[n] = 1;
          nGesehen++;
        }
      }

      function genugSichtbar(en) {
        if (en.intersectionRatio >= 0.5) return true;
        var vh = (en.rootBounds && en.rootBounds.height) || w.innerHeight || 0;
        return vh > 0 && en.intersectionRect &&
               en.intersectionRect.height >= vh * 0.5;
      }

      var io = null;
      if (w.IntersectionObserver) {
        var stufen = [];
        for (var t = 0; t <= 20; t++) stufen.push(t / 20);
        io = new w.IntersectionObserver(function (eintraege) {
          var jetzt = Date.now();
          for (var i = 0; i < eintraege.length; i++) {
            var en = eintraege[i], el = en.target;
            var z = el.__qpxAnon || (el.__qpxAnon = {seit: 0, summe: 0});
            var sicht = en.isIntersecting && el.isConnected !== false &&
                        genugSichtbar(en);
            if (sicht && !d.hidden) {
              if (!z.seit) z.seit = jetzt;
            } else {
              reife(el, jetzt);
              if (z.seit) z.summe = (z.summe || 0) + (jetzt - z.seit);
              z.seit = 0;
            }
          }
        }, {threshold: stufen});
      }

      function suche() {
        if (!io) return;
        var knoten = d.querySelectorAll('[data-section]');
        if (!knoten.length) knoten = d.querySelectorAll('[data-section-type]');
        var bleibt = [];
        for (var j = 0; j < beobachtet.length; j++) {
          if (beobachtet[j].isConnected !== false) bleibt.push(beobachtet[j]);
          else io.unobserve(beobachtet[j]);
        }
        beobachtet = bleibt;
        for (var k = 0; k < knoten.length; k++) {
          if (knoten[k].__qpxAnon) continue;
          knoten[k].__qpxAnon = {seit: 0, summe: 0};
          io.observe(knoten[k]);
          beobachtet.push(knoten[k]);
        }
      }

      function messeTiefe() {
        var de = d.documentElement;
        var h = Math.max(de.scrollHeight || 0, d.body ? d.body.scrollHeight : 0);
        if (!h) return;
        var pct = ((w.pageYOffset || de.scrollTop || 0) +
                   (w.innerHeight || de.clientHeight || 0)) / h * 100;
        var stufe = pct >= 99 ? 100 : Math.floor(pct / 25) * 25;
        if (stufe > tiefe) tiefe = Math.min(100, stufe);
      }

      // Zielklasse: dieselbe Logik wie zielKlasse() in qiblanco-qpx.js.
      var ZIEL_LOCALE = /^\/[a-z]{2}(-[a-z]{2})?(?=\/)/i;
      function hostOhneWww(h) { return String(h || '').toLowerCase().replace(/^www\./, ''); }
      function zielAusPfad(p) {
        p = String(p || '/').replace(ZIEL_LOCALE, '').toLowerCase();
        if (/^\/cart\/add(\/|\.js|$)/.test(p)) return 'kauf';
        if (/^\/(checkouts?|cart\/c|cart\/attribution)(\/|$)/.test(p) || /^\/cart\/[0-9]+:[0-9]+/.test(p)) return 'kasse';
        if (/^\/cart(\/|$)/.test(p)) return 'warenkorb';
        if (/^\/(collections\/[^/]+\/)?products\/./.test(p)) return 'produkt';
        if (/^\/pages\/./.test(p)) return 'lp';
        return 'navigation';
      }
      // Liefert [Zielklasse, Zielpfad]; der Pfad nur bei Zielen auf diesem Host.
      function zielVon(el) {
        try {
          var hier = hostOhneWww(w.location.hostname), u;
          var a = el.closest('a'), href = a ? a.getAttribute('href') : null;
          if (href != null) {
            href = String(href).trim();
            if (href.charAt(0) === '#') return ['anker', ''];
            var sch = /^([a-z][a-z0-9+.-]*):/i.exec(href);
            if (sch && !/^https?$/i.test(sch[1])) return [/^javascript$/i.test(sch[1]) ? 'sonst' : 'extern', ''];
            u = new URL(href, w.location.href);
            var dort = hostOhneWww(u.hostname);
            if (dort !== hier) {
              if (dort.indexOf('checkout.') === 0 || /^\/checkouts?(\/|$)/.test(u.pathname)) return ['kasse', ''];
              if (/\.myshopify\.com$/.test(dort) && /^\/cart\/c(\/|$)/.test(u.pathname)) return ['kasse', ''];
              return ['extern', ''];
            }
            if (u.hash && u.pathname === w.location.pathname) return ['anker', ''];
            return [zielAusPfad(u.pathname), u.pathname];
          }
          var tag = el.tagName, typ = String(el.getAttribute('type') || '').toLowerCase();
          var absenden = (tag === 'BUTTON' && (typ === '' || typ === 'submit')) ||
                         (tag === 'INPUT' && (typ === 'submit' || typ === 'image'));
          if (!absenden) return ['sonst', ''];
          if (String(el.getAttribute('name') || '').toLowerCase() === 'checkout') return ['kasse', ''];
          var f = el.closest('form'), act = f ? f.getAttribute('action') : null;
          if (!act) return ['sonst', ''];
          u = new URL(String(act), w.location.href);
          if (hostOhneWww(u.hostname) !== hier) return ['extern', ''];
          var z = zielAusPfad(u.pathname);
          if (z === 'warenkorb' && el.closest('[data-qb-kaufknopf]')) z = 'kauf';
          return (z === 'kauf' || z === 'warenkorb' || z === 'kasse') ? [z, u.pathname] : ['sonst', ''];
        } catch (errZiel) {
          void errZiel;
          return ['sonst', ''];
        }
      }

      function abschliessen() {
        if (!offen) return;
        offen = false;
        var jetzt = Date.now();
        for (var i = 0; i < beobachtet.length; i++) reife(beobachtet[i], jetzt);
        messeTiefe();
        if (KONTO.test(pfad)) return;
        var abschnitte = [];
        for (var n in gesehen) {
          if (Object.prototype.hasOwnProperty.call(gesehen, n)) abschnitte.push(n);
        }
        sendeAn(ziel, JSON.stringify({
          quelle: 'js', host: w.location.hostname, pfad,
          abschnitte, tiefe, klicks,
        }));
      }

      function neuerBesuch() {
        pfad = w.location.pathname;
        gesehen = {};
        nGesehen = 0;
        tiefe = 0;
        klicks = [];
        offen = true;
        var jetzt = Date.now();
        for (var i = 0; i < beobachtet.length; i++) {
          var z = beobachtet[i].__qpxAnon;
          if (!z) continue;
          z.summe = 0; // Sichtzeit der Vorseite zählt nicht für die neue
          if (z.seit) z.seit = d.hidden ? 0 : jetzt;
        }
      }

      function wechsel() {
        if (w.location.pathname === pfad) return;
        abschliessen();
        neuerBesuch();
      }

      suche();
      if (w.MutationObserver) {
        var geplant = false;
        new w.MutationObserver(function () {
          if (geplant) return;
          geplant = true;
          (w.requestAnimationFrame || w.setTimeout)(function () {
            geplant = false;
            try { suche(); } catch (errSuche) { void errSuche; }
          });
        }).observe(d.documentElement, {childList: true, subtree: true});
      }

      var tiefeGeplant = false;
      w.addEventListener('scroll', function () {
        if (tiefeGeplant) return;
        tiefeGeplant = true;
        (w.requestAnimationFrame || w.setTimeout)(function () {
          tiefeGeplant = false;
          try { messeTiefe(); } catch (errTiefe) { void errTiefe; }
        });
      }, {passive: true});

      d.addEventListener('click', function (e) {
        try {
          if (!offen || klicks.length >= MAX_KLICKS) return;
          var el = e.target && e.target.closest ?
            e.target.closest('a,button,input[type=submit],input[type=image],[role=button]') : null;
          if (!el) return;
          var sc = el.closest('[data-section]') || el.closest('[data-section-type]');
          var zv = zielVon(el);
          var k = {abschnitt: sc ? abschnittName(sc) : '', ziel: zv[0]};
          if (zv[1]) k.pfad = zv[1];
          klicks.push(k);
        } catch (errKlick) {
          void errKlick;
        }
      }, true);

      d.addEventListener('visibilitychange', function () {
        if (d.visibilityState === 'hidden') abschliessen();
      });
      w.addEventListener('pagehide', abschliessen);
      w.addEventListener('pageshow', function (e) {
        if (e && e.persisted) neuerBesuch(); // aus dem bfcache zurück
      });

      function wickleAnon(name) {
        var orig = w.history && w.history[name];
        if (typeof orig !== 'function') return;
        w.history[name] = function () {
          var r = orig.apply(this, arguments);
          try { wechsel(); } catch (errWechsel) { void errWechsel; }
          return r;
        };
      }
      wickleAnon('pushState');
      wickleAnon('replaceState');
      w.addEventListener('popstate', wechsel);
    }
  } catch (errTop) {
    void errTop; // never-break: harte Kapselung, keine Seiten-Wirkung
  }
})(window, document);
