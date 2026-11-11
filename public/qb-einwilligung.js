/* Eigener Einwilligungshinweis qiblanco.com (BAUVERTRAG Abschnitte 2, 3, 6).
 * Grossjob 20261022-GROSSJOB-cookiebot-abloesen-eigener-einwilligungshinweis-qiblanco s02.
 * Bildet die Cookiebot-Schnittstelle nach, die unsere Leser heute nutzen
 * (MetaPixel, Google-Tracking, qpx, Tracker, UpPromote, checkout-tracking),
 * damit keiner umgebaut wird. Ereignisfolge wie live gemessen am 23.10.:
 * Erstbesuch DialogInit -> DialogDisplay; Wahl und Wiederbesuch
 * ConsentReady -> Load -> Accept|Decline. Kein Eingriff in document.createElement.
 * Fehlerfall = nichts erlaubt; die Seite bleibt immer bedienbar.
 *
 * Z11 s02 (2026-11-11, "alles, was Cookiebot sonst noch anbietet"): Regelwerk je Region
 * (Cookiebot.regulations), Global Privacy Control (Cookiebot.doNotTrack), Opt-out-Weg in
 * Opt-out-Regionen, Platzhalter für blockierte Einbettungen, Microsoft-Einwilligungssignal
 * (Clarity, UET), Cookiebot.getScript, Ereignis CookiebotOnTagsExecuted, CookieConsent für
 * alle Subdomains (Domain .<laden>). Portierbar: alles Ladenspezifische kommt aus dem DOM
 * (data-qb-region, data-qb-consent-strict, Texte am Banner) und aus BASIS unten. */
(function () {
  'use strict';
  if (window.qbEinwilligung) return;
  var d = document, w = window;
  // GTM-N7DRSN5 trägt das Cookiebot-Vorlagen-Tag cvt_31884966_92, das uc.js ohne Bedingung
  // nachlädt (s06, gemessen 25.10.: nach "Alle akzeptieren" 1 Anfrage an consent.cookiebot.com).
  // Die CSP hält es nicht ('strict-dynamic'). Die Sperrliste muss vor gtm.js im dataLayer stehen;
  // sie gilt nur hier, also nur im Motor eigen. Rückweg Motor cookiebot: dieses Skript lädt dort nicht.
  // Dazu Taboola (Vorlage cvt_31884966_95, Tag 96): es trägt im Container keine Zusatz-Einwilligung und
  // feuerte, sobald GTM lädt, also schon bei "nur Statistik" (gemessen 11.11.: 3 Anfragen an taboola.com).
  // Ohne Marketing-Erlaubnis steht es mit auf der Sperrliste; gesetzt beim Laden (gespeicherte Wahl,
  // unten nach leseCookie) und in waehle() vor den Ereignissen, nach denen GTM lädt.
  // Job 20261111-us-laden-tags-ausserhalb-theme-an-ablehnung-binden.
  w.dataLayer = w.dataLayer || [];
  function gtmSperre(marketing) {
    var liste = ['cvt_31884966_92'];
    if (!marketing) liste.push('cvt_31884966_95');
    w.dataLayer.push({'gtm.blocklist': liste});
  }
  var JAHR = 31536000000;
  var nonce = (d.currentScript && (d.currentScript.nonce || d.currentScript.getAttribute('nonce'))) || '';
  function $(id) { return d.getElementById(id); }
  function banner() { return $('qb-einwilligung'); }
  function dialog() { return $('qb-einwilligung-dialog'); }
  function attr(n, f) { var b = banner(); return (b && b.getAttribute(n)) || f; }
  var FASSUNG = attr('data-qb-fassung', '1.0');
  function haupt(v) { var n = parseInt(String(v || '').split('.')[0], 10); return isFinite(n) ? n : 0; }

  // Basis-Domains der Läden: CookieConsent gilt dort für alle Subdomains (checkout.<basis> u. a.).
  var BASIS = ['qiblanco.com', 'qi-blanco.com', 'crystal-cacao.com'];
  function cookieDomain() {
    var h = (w.location && w.location.hostname) || '';
    for (var i = 0; i < BASIS.length; i++) {
      if (h === BASIS[i] || h.slice(-(BASIS[i].length + 1)) === '.' + BASIS[i]) return '.' + BASIS[i];
    }
    return '';
  }
  var roh = '';
  // Gelesen wird wie am Server (cookieAusHeader) das ERSTE CookieConsent (Naht-Test C1). Doppelt steht es nur
  // im Übergang host-only -> Domain; umziehen() und setzeRoh räumen das host-only Cookie weg.
  function leseCookie() {
    var m = d.cookie.match(/(?:^|;\s*)CookieConsent=([^;]*)/);
    if (!m) return null;
    roh = m[1];
    return leseWert(m[1]);
  }
  function leseWert(s) {
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
  // Schreibt den Rohwert als Domain-Cookie und räumt ein host-only CookieConsent weg (keine Doppelung).
  function setzeRoh(wert) {
    var dom = cookieDomain(), rest = '; path=/; max-age=31536000; SameSite=Lax' + (w.location && w.location.protocol === 'https:' ? '; Secure' : '');
    if (dom) d.cookie = 'CookieConsent=; path=/; max-age=0';
    d.cookie = 'CookieConsent=' + wert + rest + (dom ? '; domain=' + dom : '');
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
  // Übergang host-only -> Domain-Cookie, nur auf den Laden-Domains und nur, wenn nötig: das host-only
  // Cookie wird gelöscht; trägt danach genau ein Domain-Cookie dieselbe Wahl, bleibt alles, wie es ist.
  // Stehen zwei Cookies da (z. B. Wahl in einem Tab mit älterem Stand), gewinnt die jüngere Wahl (utc).
  function alleRoh() {
    var r = [], re = /(?:^|;\s*)CookieConsent=([^;]*)/g, m;
    while ((m = re.exec(d.cookie))) r.push(m[1]);
    return r;
  }
  function umziehen() {
    if (!cookieDomain()) return;
    var alle = alleRoh();
    if (!alle.length) return;
    var wahl = alle[0], wc = leseWert(wahl);
    for (var i = 1; i < alle.length; i++) {
      var c = leseWert(alle[i]);
      if (c && (!wc || c.utc > wc.utc)) { wahl = alle[i]; wc = c; }
    }
    d.cookie = 'CookieConsent=; path=/; max-age=0';
    var rest = alleRoh();
    if (rest.length === 1 && rest[0] === wahl) return;
    setzeRoh(wahl);
  }
  try { umziehen(); } catch (e) {}
  var bestand = leseCookie();
  if (bestand) setze(bestand, bestand.stamp || stempel());
  gtmSperre(!!(bestand && bestand.marketing));

  // Regelwerk je Region wie Cookiebot.regulations. Dieselbe Regel wie die Leser (regionPolicy in
  // qiblanco-google-tracking.js, MetaPixel.jsx, consent-policy.js): ohne strict-Liste oder ohne Region
  // gilt Opt-in für alle (fail-closed); eine Region außerhalb der Liste ist Opt-out.
  var de = d.documentElement;
  function regelwerk() {
    var region = (de.getAttribute('data-qb-region') || '').trim().toUpperCase();
    var strict = (de.getAttribute('data-qb-consent-strict') || '').toUpperCase().split(','), liste = [];
    for (var i = 0; i < strict.length; i++) { var k = strict[i].trim(); if (/^[A-Z]{2}$/.test(k)) liste.push(k); }
    var optout = liste.length > 0 && !!region && liste.indexOf(region) < 0;
    return {region: region, optout: optout, gdprApplies: !optout, ccpaApplies: optout && region === 'US', lgpdApplies: optout && region === 'BR'};
  }
  var REGEL = regelwerk();
  var GPC = false, DNT = false;
  try { GPC = navigator.globalPrivacyControl === true; } catch (e) {}
  try { DNT = navigator.doNotTrack === '1' || w.doNotTrack === '1'; } catch (e) {}
  CB.doNotTrack = GPC || DNT;
  CB.regulations = {gdprApplies: REGEL.gdprApplies, ccpaApplies: REGEL.ccpaApplies, lgpdApplies: REGEL.lgpdApplies};
  // GPC ohne Wahl: Marketing gilt als abgelehnt (Cookiebot: method 'implied'). In Opt-in-Regionen ist ohne
  // Wahl ohnehin alles aus; in Opt-out-Regionen sehen die Leser so eine Ablehnung (hasResponse +
  // marketing false). Der Hinweis bleibt trotzdem für alle sichtbar, es wird kein Cookie geschrieben.
  var implizit = false;
  if (!CB.hasResponse && GPC && REGEL.optout) {
    CB.consent = {stamp: '0', necessary: true, preferences: true, statistics: true, marketing: false, method: 'implied'};
    CB.hasResponse = true; CB.consented = true; CB.declined = false; implizit = true;
  }
  // Wie die Leser (hasDeclined in qiblanco-google-tracking.js): in Opt-out-Regionen ist alles erlaubt,
  // bis Marketing abgelehnt ist (dann alles aus); sonst nur mit Zustimmung je Kategorie.
  function darf(k) {
    if (k === 'necessary') return true;
    if (REGEL.optout) return !(CB.hasResponse && !CB.consent.marketing);
    return !!(CB.hasResponse && CB.consent[k]);
  }

  // Microsoft UET: Vorgabe vor jedem Tag (Warteschlange, die ein späteres UET-Tag liest).
  try {
    w.uetq = w.uetq || [];
    w.uetq.push('consent', 'default', {ad_storage: darf('marketing') ? 'granted' : 'denied'});
  } catch (e) {}
  // Nach einer Wahl (und beim Wiederbesuch): Clarity und UET bekommen das Signal.
  function microsoft() {
    try {
      if (darf('statistics')) {
        if (typeof w.clarity !== 'function') w.clarity = function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
        w.clarity('consent');
      } else if (typeof w.clarity === 'function') w.clarity('consent', false);
    } catch (e) {}
    try { w.uetq = w.uetq || []; w.uetq.push('consent', 'update', {ad_storage: darf('marketing') ? 'granted' : 'denied'}); } catch (e) {}
  }

  function feuere(n) {
    try { w.dispatchEvent(new Event('Cookiebot' + n)); } catch (e) {}
    var cb = w['CookiebotCallback_' + n];
    if (typeof cb === 'function') { try { cb(); } catch (e) {} }
  }
  function stand() {
    return {fassung: FASSUNG, motor: 'eigen', hasResponse: CB.hasResponse, stamp: CB.consent.stamp,
      necessary: true, preferences: CB.consent.preferences, statistics: CB.consent.statistics, marketing: CB.consent.marketing,
      gpc: GPC, implizit: implizit, region: REGEL.region, optout: REGEL.optout};
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
  // Die API lädt erst nach der Wahl (lib/shopify-tracking-tor.js); Hydrogen meldet, wenn sie steht.
  function shopifyMitWarten() {
    if (shopify()) return;
    d.addEventListener('shopifyCustomerPrivacyApiLoaded', function () { shopify(); }, {once: true});
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
    platzhalter();
  }

  // Platzhalter wie Cookiebot: vor jeder blockierten Einbettung (iframe mit data-qb-src bzw. data-cookieblock-src)
  // steht ein Kasten mit Text und Knopf; Elemente .cookieconsent-optout-<kat> zeigen sich ohne, .cookieconsent-optin-<kat>
  // mit Zustimmung. Der Knopf erlaubt die Kategorie der Einbettung (eine Wahl wie im Dialog, Protokoll 'auswahl').
  function platzhalter() {
    var b = banner();
    var text = (b && b.getAttribute('data-qb-ph-text')) || '', knopf = (b && b.getAttribute('data-qb-ph-knopf')) || 'OK';
    var fs = d.querySelectorAll('iframe[data-cookieconsent][data-qb-src],iframe[data-cookieconsent][data-cookieblock-src]');
    for (var j = 0; j < fs.length; j++) {
      var f = fs[j], kat = String(f.getAttribute('data-cookieconsent') || 'marketing').split(',')[0].trim() || 'marketing';
      var vor = f.previousElementSibling;
      if (vor && vor.hasAttribute('data-qb-motor-platzhalter')) continue;
      var ph = d.createElement('div');
      ph.className = 'qb-ew-platzhalter';
      ph.setAttribute('data-qb-platzhalter', kat);
      ph.setAttribute('data-qb-motor-platzhalter', '');
      var p = d.createElement('p'); p.textContent = text;
      var k = d.createElement('button'); k.type = 'button'; k.className = 'qb-ew-knopf qb-ew-knopf--gold';
      k.setAttribute('data-qb-platzhalter-zustimmung', kat); k.textContent = knopf;
      ph.appendChild(p); ph.appendChild(k);
      f.parentNode.insertBefore(ph, f);
    }
    var ps = d.querySelectorAll('[data-qb-motor-platzhalter]');
    for (var q = 0; q < ps.length; q++) {
      var nx = ps[q].nextElementSibling;
      if (!nx || !(nx.hasAttribute('data-qb-src') || nx.hasAttribute('data-cookieblock-src'))) ps[q].parentNode.removeChild(ps[q]);
    }
    var ks = ['preferences', 'statistics', 'marketing'];
    for (var i = 0; i < ks.length; i++) {
      var aus = d.querySelectorAll('.cookieconsent-optout-' + ks[i]), an = d.querySelectorAll('.cookieconsent-optin-' + ks[i]);
      for (var a = 0; a < aus.length; a++) { if (darf(ks[i])) aus[a].setAttribute('hidden', ''); else aus[a].removeAttribute('hidden'); }
      for (var o = 0; o < an.length; o++) { if (darf(ks[i])) an[o].removeAttribute('hidden'); else an[o].setAttribute('hidden', ''); }
    }
  }

  // Cookiebot.getScript(URL, async, callback): lädt ein Skript (mit Nonce) und ruft callback nach dem Laden.
  function getScript(url, async, cb) {
    var s = d.createElement('script');
    s.src = url;
    s.async = async !== false;
    if (nonce) s.nonce = nonce;
    if (typeof cb === 'function') s.onload = function () { try { cb(); } catch (e) {} };
    (d.head || d.documentElement).appendChild(s);
    return s;
  }

  function schreibeCookie() {
    var region = (d.documentElement.getAttribute('data-qb-region') || '').toLowerCase();
    var c = CB.consent;
    var wert = "{stamp:'" + c.stamp + "',necessary:true,preferences:" + c.preferences + ',statistics:' + c.statistics +
      ',marketing:' + c.marketing + ",method:'explicit',ver:1,utc:" + Date.now() + ",region:'" + region + "',qbv:'" + FASSUNG + "'}";
    setzeRoh(wert.replace(/'/g, '%27').replace(/,/g, '%2C'));
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
    zeige(banner(), !CB.hasResponse || implizit);
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
    var vorher = CB.hasResponse && !implizit ? CB.consent : null;
    implizit = false;
    if (vorher && ((vorher.preferences && !p) || (vorher.statistics && !s) || (vorher.marketing && !m))) methode = 'widerruf';
    setze({preferences: p, statistics: s, marketing: m}, stempel());
    gtmSperre(!!m);
    schreibeCookie();
    schliesseDialog();
    zeige(banner(), false);
    feuere('OnConsentReady');
    feuere('OnLoad');
    feuere(CB.consented ? 'OnAccept' : 'OnDecline');
    runScripts();
    feuere('OnTagsExecuted');
    microsoft();
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
  CB.getScript = getScript;
  w.Cookiebot = w.CookieConsent = CB;
  // erlaubt(k): dieselbe Regel wie die Leser (Region + Wahl), für React-Bausteine wie die YouTube-Fassade.
  // erlaube(k): eine Kategorie zusätzlich erlauben (Platzhalter-Knopf), die übrigen bleiben wie gewählt.
  function erlaube(k) {
    // Ohne eigene Wahl werden nur die erbetenen Kategorien gespeichert, nie mehr (eine Opt-out-Region
    // erlaubt ohnehin alles bis zur Ablehnung; reist der Besucher in eine Opt-in-Region, gilt nur das Erbetene).
    var c = CB.hasResponse && !implizit ? CB.consent : {preferences: false, statistics: false, marketing: false};
    waehle(k === 'preferences' || !!c.preferences, k === 'statistics' || !!c.statistics, k === 'marketing' || !!c.marketing, 'auswahl');
  }
  w.qbEinwilligung = {fassung: FASSUNG, motor: 'eigen', stand: stand, oeffneEinstellungen: oeffneEinstellungen,
    erlaubt: darf, erlaube: erlaube, regelwerk: REGEL};

  // Delegation am Dokument: überlebt, wenn React die Knoten ersetzt.
  function klick(ev) {
    var ph = ev.target && ev.target.closest ? ev.target.closest('[data-qb-motor-platzhalter] [data-qb-platzhalter-zustimmung]') : null;
    if (ph) { ev.preventDefault(); erlaube(ph.getAttribute('data-qb-platzhalter-zustimmung') || 'marketing'); return; }
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-qb-wahl]') : null;
    if (!el || !el.closest('#qb-einwilligung,#qb-einwilligung-dialog')) return;
    var wahl = el.getAttribute('data-qb-wahl');
    if (wahl === 'einstellungen') oeffneEinstellungen();
    // Opt-out-Weg (nur in Opt-out-Regionen sichtbar): Marketing aus ("Do Not Sell or Share"), der Rest bleibt.
    else if (wahl === 'optout') {
      var o = CB.hasResponse && !implizit ? CB.consent : {preferences: false, statistics: false};
      waehle(!!o.preferences, !!o.statistics, false, 'auswahl');
    }
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

  // Frühe Wahl (s12, gemessen 09.11.2026): die Leiste steht mit dem Server-HTML da, dieses Skript
  // läuft erst nach dem Parsen (defer; mobil gedrosselt 2-4 s später). Bis dahin merkt sich das
  // Inline-Skript aus Einwilligungshinweis.jsx Klicks in window.__qbEwFrueh; hier wird die
  // letzte nachgeholt. Ohne das ging ein früher Tipp still verloren.
  function fruehWahl() {
    var q = w.__qbEwFrueh, wahl = q && q.length ? q[q.length - 1] : '';
    if (q) q.length = 0;
    return wahl === 'alle' || wahl === 'notwendig' || wahl === 'einstellungen' ? wahl : '';
  }

  function start() {
    var b = banner();
    d.addEventListener('click', klick);
    d.addEventListener('keydown', function (ev) {
      var dg = dialog();
      if (ev.key === 'Escape' && dg && !dg.hasAttribute('hidden')) { ev.preventDefault(); schliesseDialog(); }
    });
    w.addEventListener('resize', lage);
    w.qbEinwilligung.bereit = true;
    if (REGEL.optout) {
      var os = d.querySelectorAll('[data-qb-optout]');
      for (var i = 0; i < os.length; i++) os[i].removeAttribute('hidden');
    }
    var frueh = fruehWahl();
    if (CB.hasResponse && !implizit) {
      zeige(b, false);
      feuere('OnConsentReady');
      feuere('OnLoad');
      feuere(CB.consented ? 'OnAccept' : 'OnDecline');
      runScripts();
      feuere('OnTagsExecuted');
      microsoft();
      shopifyMitWarten();
    } else {
      platzhalter();
      if (implizit) { microsoft(); shopifyMitWarten(); }
      zeige(b, !frueh);
      feuere('OnDialogInit');
      feuere('OnDialogDisplay');
      if (frueh === 'alle') waehle(true, true, true, 'alle');
      else if (frueh === 'notwendig') waehle(false, false, false, 'notwendig');
      else if (frueh === 'einstellungen') oeffneEinstellungen();
    }
    meldeStand();
  }
  // defer-Skripte laufen vor DOMContentLoaded: so hören alle Leser schon zu.
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0);
})();
