/* Eigener Einwilligungshinweis qiblanco.com (BAUVERTRAG Abschnitte 2, 3, 6).
 * Grossjob 20261022-GROSSJOB-cookiebot-abloesen-eigener-einwilligungshinweis-qiblanco s02.
 * Bildet die Cookiebot-Schnittstelle nach, die unsere Leser heute nutzen
 * (MetaPixel, Google-Tracking, qpx, Tracker, UpPromote, checkout-tracking),
 * damit keiner umgebaut wird. Ereignisfolge wie live gemessen am 23.10.:
 * Erstbesuch DialogInit -> DialogDisplay; Wahl und Wiederbesuch
 * ConsentReady -> Load -> Accept|Decline. Kein Eingriff in document.createElement.
 * Fehlerfall = nichts erlaubt; die Seite bleibt immer bedienbar. */
(function () {
  'use strict';
  if (window.qbEinwilligung) return;
  var d = document, w = window;
  // GTM-N7DRSN5 trägt das Cookiebot-Vorlagen-Tag cvt_31884966_92, das uc.js ohne Bedingung
  // nachlädt (s06, gemessen 25.10.: nach "Alle akzeptieren" 1 Anfrage an consent.cookiebot.com).
  // Die CSP hält es nicht ('strict-dynamic'). Die Sperrliste muss vor gtm.js im dataLayer stehen;
  // sie gilt nur hier, also nur im Motor eigen. Rückweg Motor cookiebot: dieses Skript lädt dort nicht.
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({'gtm.blocklist': ['cvt_31884966_92']});
  var JAHR = 31536000000;
  var nonce = (d.currentScript && (d.currentScript.nonce || d.currentScript.getAttribute('nonce'))) || '';
  function $(id) { return d.getElementById(id); }
  function banner() { return $('qb-einwilligung'); }
  function dialog() { return $('qb-einwilligung-dialog'); }
  function attr(n, f) { var b = banner(); return (b && b.getAttribute(n)) || f; }
  var FASSUNG = attr('data-qb-fassung', '1.0');
  function haupt(v) { var n = parseInt(String(v || '').split('.')[0], 10); return isFinite(n) ? n : 0; }

  function leseCookie() {
    var m = d.cookie.match(/(?:^|;\s*)CookieConsent=([^;]*)/);
    if (!m) return null;
    var s = m[1];
    try { s = decodeURIComponent(s); } catch (e) {}
    function b(k) { var r = s.match(new RegExp('(?:^|[,{])\\s*' + k + '\\s*:\\s*(true|false)')); return r ? r[1] === 'true' : null; }
    function t(k) { var r = s.match(new RegExp('(?:^|[,{])\\s*' + k + "\\s*:\\s*'([^']*)'")); return r ? r[1] : ''; }
    var u = s.match(/(?:^|[,{])\s*utc\s*:\s*(\d+)/), mk = b('marketing');
    if (mk === null || !u) return null;
    var c = {preferences: !!b('preferences'), statistics: !!b('statistics'), marketing: mk, utc: +u[1], qbv: t('qbv'), stamp: t('stamp'), method: t('method')};
    if (Date.now() - c.utc > JAHR) return null;
    if ((c.qbv ? haupt(c.qbv) : 1) < haupt(FASSUNG)) return null;
    return c;
  }

  function stempel() {
    try { if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID(); } catch (e) {}
    return 'qb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  var CB = {
    consent: {stamp: '0', necessary: true, preferences: false, statistics: false, marketing: false, method: null},
    consented: false, declined: false, hasResponse: false, motor: 'eigen'
  };
  function setze(c, stamp) {
    // method aus dem Bestandscookie behalten (Cookiebot kennt 'implied'); eigene Wahl ist immer 'explicit'.
    CB.consent = {stamp: stamp, necessary: true, preferences: !!c.preferences, statistics: !!c.statistics, marketing: !!c.marketing, method: c.method || 'explicit'};
    CB.hasResponse = true;
    CB.consented = !!(c.preferences || c.statistics || c.marketing);
    CB.declined = !CB.consented;
  }
  var bestand = leseCookie();
  if (bestand) setze(bestand, bestand.stamp || stempel());

  function feuere(n) {
    try { w.dispatchEvent(new Event('Cookiebot' + n)); } catch (e) {}
    var cb = w['CookiebotCallback_' + n];
    if (typeof cb === 'function') { try { cb(); } catch (e) {} }
  }
  function stand() {
    return {fassung: FASSUNG, motor: 'eigen', hasResponse: CB.hasResponse, stamp: CB.consent.stamp,
      necessary: true, preferences: CB.consent.preferences, statistics: CB.consent.statistics, marketing: CB.consent.marketing};
  }
  function meldeStand() {
    try { d.dispatchEvent(new CustomEvent('qb:einwilligung', {detail: stand()})); } catch (e) {}
  }

  // Shopify Customer Privacy: daran hängt der Checkout (Vorbild cookiebot-shopify-consent-sync.js).
  function shopify() {
    var sp = w.Shopify && w.Shopify.customerPrivacy;
    if (!CB.hasResponse || !sp || typeof sp.setTrackingConsent !== 'function') return false;
    try {
      sp.setTrackingConsent({analytics: CB.consent.statistics, marketing: CB.consent.marketing,
        preferences: CB.consent.preferences, sale_of_data: CB.consent.marketing}, function () {});
    } catch (e) {}
    return true;
  }
  function shopifyMitWarten() {
    if (shopify()) return;
    var n = 0, iv = setInterval(function () { if (shopify() || ++n > 40) clearInterval(iv); }, 250);
  }

  function erlaubt(liste) {
    var ks = String(liste || '').split(',');
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i].trim();
      if (!k || k === 'necessary' || k === 'ignore') continue;
      if (!CB.consent[k]) return false;
    }
    return true;
  }
  // Vorab-Blockade für Markup Dritter: <script type="text/plain" data-cookieconsent="marketing">
  // und <iframe data-qb-src|data-cookieblock-src data-cookieconsent>.
  function runScripts() {
    var ss = d.querySelectorAll('script[type="text/plain"][data-cookieconsent]');
    for (var i = 0; i < ss.length; i++) {
      var alt = ss[i];
      if (!erlaubt(alt.getAttribute('data-cookieconsent'))) continue;
      var neu = d.createElement('script');
      for (var a = 0; a < alt.attributes.length; a++) {
        var at = alt.attributes[a];
        if (at.name !== 'type') neu.setAttribute(at.name, at.value);
      }
      neu.type = alt.getAttribute('data-type') || 'text/javascript';
      if (nonce) neu.nonce = nonce;
      if (!alt.src) neu.text = alt.text;
      alt.parentNode.replaceChild(neu, alt);
    }
    var fs = d.querySelectorAll('iframe[data-cookieconsent][data-qb-src],iframe[data-cookieconsent][data-cookieblock-src]');
    for (var j = 0; j < fs.length; j++) {
      var f = fs[j];
      if (!erlaubt(f.getAttribute('data-cookieconsent'))) continue;
      f.src = f.getAttribute('data-qb-src') || f.getAttribute('data-cookieblock-src');
      f.removeAttribute('data-qb-src'); f.removeAttribute('data-cookieblock-src');
    }
  }

  function schreibeCookie() {
    var region = (d.documentElement.getAttribute('data-qb-region') || '').toLowerCase();
    var c = CB.consent;
    var wert = "{stamp:'" + c.stamp + "',necessary:true,preferences:" + c.preferences + ',statistics:' + c.statistics +
      ',marketing:' + c.marketing + ",method:'explicit',ver:1,utc:" + Date.now() + ",region:'" + region + "',qbv:'" + FASSUNG + "'}";
    d.cookie = 'CookieConsent=' + wert.replace(/'/g, '%27').replace(/,/g, '%2C') +
      '; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function protokoll(methode) {
    try {
      var c = CB.consent;
      var last = JSON.stringify({schema: 1, id: c.stamp, ts_client: new Date().toISOString(), motor: 'eigen', fassung: FASSUNG,
        texte_hash: attr('data-qb-texte-hash', ''), sprache: attr('data-qb-sprache', 'de'),
        wahl: {necessary: true, preferences: c.preferences, statistics: c.statistics, marketing: c.marketing},
        methode: methode, seite: location.pathname, shop: location.hostname});
      if (navigator.sendBeacon) navigator.sendBeacon('/api/einwilligung', new Blob([last], {type: 'application/json'}));
    } catch (e) {}
  }

  var oeffner = null;
  // Offener Banner reserviert unten Platz (body-Polster, Kaufleiste darüber), damit nichts verdeckt bleibt.
  function lage() {
    var b = banner(), offen = !!b && !b.hasAttribute('hidden'), h = d.documentElement;
    if (offen) { h.setAttribute('data-qb-einwilligung-offen', ''); h.style.setProperty('--qb-ew-hoehe', b.offsetHeight + 'px'); }
    else h.removeAttribute('data-qb-einwilligung-offen');
  }
  function zeige(el, an) { if (el) { if (an) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); lage(); } }
  function schliesseDialog() {
    zeige(dialog(), false);
    zeige(banner(), !CB.hasResponse);
    if (oeffner && oeffner.focus) { try { oeffner.focus(); } catch (e) {} }
    oeffner = null;
  }
  function oeffneEinstellungen() {
    var dg = dialog();
    if (!dg) return;
    oeffner = d.activeElement && d.activeElement !== d.body ? d.activeElement : null;
    var boxen = dg.querySelectorAll('input[data-qb-kategorie]');
    for (var i = 0; i < boxen.length; i++) boxen[i].checked = !!CB.consent[boxen[i].getAttribute('data-qb-kategorie')];
    zeige(banner(), false);
    zeige(dg, true);
    var erst = boxen[0] || dg.querySelector('button');
    if (erst) { try { erst.focus(); } catch (e) {} }
  }

  function waehle(p, s, m, methode) {
    var vorher = CB.hasResponse ? CB.consent : null;
    if (vorher && ((vorher.preferences && !p) || (vorher.statistics && !s) || (vorher.marketing && !m))) methode = 'widerruf';
    setze({preferences: p, statistics: s, marketing: m}, stempel());
    schreibeCookie();
    schliesseDialog();
    zeige(banner(), false);
    feuere('OnConsentReady');
    feuere('OnLoad');
    feuere(CB.consented ? 'OnAccept' : 'OnDecline');
    runScripts();
    shopifyMitWarten();
    meldeStand();
    protokoll(methode);
    // Widerruf: geladene Tracker lassen sich nicht entladen -> Seite neu laden.
    if (methode === 'widerruf') setTimeout(function () { location.reload(); }, 300);
  }

  CB.submitCustomConsent = function (p, s, m) { waehle(!!p, !!s, !!m, 'auswahl'); };
  CB.renew = oeffneEinstellungen;
  CB.show = function () { zeige(banner(), true); };
  CB.hide = function () { zeige(banner(), false); zeige(dialog(), false); };
  CB.withdraw = function () { waehle(false, false, false, 'widerruf'); };
  CB.runScripts = runScripts;
  w.Cookiebot = w.CookieConsent = CB;
  w.qbEinwilligung = {fassung: FASSUNG, motor: 'eigen', stand: stand, oeffneEinstellungen: oeffneEinstellungen};

  // Delegation am Dokument: überlebt, wenn React die Knoten ersetzt.
  function klick(ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-qb-wahl]') : null;
    if (!el || !el.closest('#qb-einwilligung,#qb-einwilligung-dialog')) return;
    var wahl = el.getAttribute('data-qb-wahl');
    if (wahl === 'einstellungen') oeffneEinstellungen();
    else if (wahl === 'notwendig') waehle(false, false, false, 'notwendig');
    else if (wahl === 'alle') waehle(true, true, true, 'alle');
    else if (wahl === 'zu') schliesseDialog();
    else if (wahl === 'auswahl') {
      var v = {};
      var boxen = dialog().querySelectorAll('input[data-qb-kategorie]');
      for (var i = 0; i < boxen.length; i++) v[boxen[i].getAttribute('data-qb-kategorie')] = boxen[i].checked;
      waehle(!!v.preferences, !!v.statistics, !!v.marketing, 'auswahl');
    } else return;
    ev.preventDefault();
  }

  function start() {
    var b = banner();
    d.addEventListener('click', klick);
    d.addEventListener('keydown', function (ev) {
      var dg = dialog();
      if (ev.key === 'Escape' && dg && !dg.hasAttribute('hidden')) { ev.preventDefault(); schliesseDialog(); }
    });
    w.addEventListener('resize', lage);
    if (CB.hasResponse) {
      zeige(b, false);
      feuere('OnConsentReady');
      feuere('OnLoad');
      feuere(CB.consented ? 'OnAccept' : 'OnDecline');
      runScripts();
      shopifyMitWarten();
    } else {
      zeige(b, true);
      feuere('OnDialogInit');
      feuere('OnDialogDisplay');
    }
    meldeStand();
  }
  // defer-Skripte laufen vor DOMContentLoaded: so hören alle Leser schon zu.
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0);
})();
