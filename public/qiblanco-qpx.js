/* eslint-disable no-unused-vars, no-empty, object-shorthand */
/*!
 * qpx.js — Qi-Blanco First-Party Tracking-Pixel (v2.4)
 *
 * NEU in v2.4 (Google-Kampagnen-Capture, Job 20260726-storefront-tracking-
 * deploy): CLICK_KEYS zusaetzlich gad_campaignid (Google-Auto-Tagging-
 * Kampagnen-ID) + h_ad_id (Ad-ID aus unserem Tracking-Template). KEINE
 * Klick-IDs im Receiver-Sinn (CLICK_PARAM_PLATFORM unberuehrt, kein
 * click_kind/is_paid-Einfluss) — reine Metadaten im click_ids-Payload,
 * damit die Kampagnen-/Ad-Ebene nicht mehr an der Pixel-Grenze verloren
 * geht (Befund Tracking-Debug: 117/123 Google-Klicks ohne Kampagne).
 * Payload sonst byte-strukturgleich v2.3; kein neues Cookie, keine PII.
 *
 * NEU in v2.3 (Sektionsmessung, Job 20260721-sektionsmessung-usa-exposure-
 * rueckkopplung): (a) Tall-Section-Fix — sichtbar = >=50% Element ODER >=50%
 * Viewport-Deckung (threshold-Leiter 0..1/20 statt fix 0.5); (b) Nach-
 * registrierung spaet gemounteter Anker (MutationObserver, rAF-throttled);
 * (c) Anker-Fallback [data-section-type] fuer Liquid/GemPages (USA). KEIN
 * neues Feld/Event — Payload byte-strukturgleich v2.2.
 * ====================================================
 * Erst-Party (laeuft auf eigener Domain, sendet an den eigenen Receiver).
 * Erfasst: anon_id (First-Party-Cookie+localStorage), Klick-IDs (gclid/fbclid/
 * msclid/ttclid...), UTM, Referrer-Host, Events (page_view/view_content/
 * add_to_cart/initiate_checkout/purchase/lead/identify). Versand via
 * navigator.sendBeacon (Fallback fetch keepalive).
 *
 * NEU in v2.0 (Verhaltens-Schicht, E1 2026-07-10): Sektions-Tracker —
 * data-section-Anker (IntersectionObserver 50%, seen ab 1s kumulativ),
 * Scroll-Marken 25/50/75/100, attention_ms (sichtbar + aktiv), device.
 * EIN kumulatives 'behavior'-Event je Pageview (pv_id, wachsende seq),
 * Flush alle 15s nur bei Aenderung + IMMER bei hidden/pagehide.
 * Abschaltbar via window.QPX_CONFIG = { behavior: false }. Keine neue PII,
 * kein neuer Speicher (kein zusaetzliches Cookie). v1-Verhalten unveraendert.
 *
 * NEU in v2.1 (Frustrations-Signale, T2 2026-07-14): dead_click (Klick ohne
 * DOM-/Scroll-Reaktion binnen 3s), rage_click (>=3 Klicks <=1s/<=30px = EIN
 * Event/Burst), error_click/js_error (window error + unhandledrejection;
 * <=1s nach Klick = error_click, msg auf 120 Zeichen gekappt). ELEMENT-basierte
 * Verortung (section_id + kurzer Selektor + rx/ry relativ 0..1 im Element),
 * NIE Seiten-x/y. Kumulativ im bestehenden behavior-Flush mitgesendet. Keine
 * Feld-INHALTE, keine neue ID. Abschaltbar via QPX_CONFIG.frust=false.
 *
 * NEU in v2.2 (Storefront-Pixel-Fix, Job 20260718-storefront-pixel-tracking-
 * vertiefung): (1) MATCH-SIGNALE — liest vorhandene _fbp/_fbc-First-Party-
 * Cookies (nur LESEN, gesetzt werden sie von fbevents.js/Click-Capture) und
 * sendet sie mit jedem Event -> events.db fbp/fbc, click_vault/Stitching.
 * (2) CONSENT-REPORT — Cookiebot-Status (marketing) als consent.ad_storage/
 * ad_user_data + region (QPX_CONFIG.region oder html[data-qb-region]) im
 * Payload; der Receiver speichert das schon (event_model.py). (3) IDENTIFY-
 * AUTO-HOOK — Form-Submit mit ausgefuelltem E-Mail-Feld sendet identify an
 * den EIGENEN Receiver (der hasht mit Salt und verwirft den Klartext,
 * privacy.hash_email); Dedupe je Session via nicht-umkehrbarem Kurz-Hash.
 * Kill-Schalter je Feature: QPX_CONFIG = { match:false, consent_report:false,
 * identity:false }. v2.1-Verhalten sonst byte-gleich.
 *
 * EINBAU = CHRISTIAN-HAND (Website). Diese Datei ist fertig + ausgeliefert.
 * Konfiguration via window.QPX_CONFIG = { endpoint: "https://t.qiblanco.com/collect" }.
 * Standard-Endpoint unten ist ein PLATZHALTER, bis die Domain/Proxy steht.
 */
(function (w, d) {
  "use strict";
  var CFG = w.QPX_CONFIG || {};
  var ENDPOINT = CFG.endpoint || "/collect"; // gleicher Origin via Reverse-Proxy
  var COOKIE = "_qpx_anon";
  var SES = "_qpx_ses";
  var STORE = "_qpx_attr"; // persistiertes erstes Klick-Attribut (first-touch)
  var DAYS = 365;
  var CLICK_KEYS = ["gclid","gbraid","wbraid","fbclid","msclid","msclkid","ttclid","twclid","epik","sccid","gad_campaignid","h_ad_id"];

  function uuid() {
    if (w.crypto && w.crypto.randomUUID) { try { return w.crypto.randomUUID(); } catch (e) {} }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function setCookie(k, v, days) {
    var e = ""; if (days) { var dt = new Date(); dt.setTime(dt.getTime() + days * 864e5); e = "; expires=" + dt.toUTCString(); }
    d.cookie = k + "=" + encodeURIComponent(v) + e + "; path=/; SameSite=Lax";
  }
  function getCookie(k) {
    var m = d.cookie.match("(^|;)\\s*" + k + "\\s*=\\s*([^;]+)"); return m ? decodeURIComponent(m.pop()) : "";
  }
  function ls(k, v) {
    try { if (v === undefined) return w.localStorage.getItem(k); w.localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function anonId() {
    var id = getCookie(COOKIE) || ls(COOKIE);
    if (!id) { id = uuid(); }
    setCookie(COOKIE, id, DAYS); ls(COOKIE, id); return id;
  }
  function sessionId() {
    var s = sessionStorageGet(SES); if (!s) { s = uuid(); sessionStorageSet(SES, s); } return s;
  }
  function sessionStorageGet(k){ try { return w.sessionStorage.getItem(k);}catch(e){return null;} }
  function sessionStorageSet(k,v){ try { w.sessionStorage.setItem(k,v);}catch(e){} }

  function params() {
    var q = {}, s = w.location.search.replace(/^\?/, "");
    if (s) s.split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ""); });
    return q;
  }
  function captureAttr() {
    // First-touch-Attribut persistieren: erste bekannte Klick-ID/UTM gewinnt.
    var existing; try { existing = JSON.parse(ls(STORE) || "null"); } catch (e) { existing = null; }
    var q = params(), click_ids = {}, utm = {}, found = false;
    CLICK_KEYS.forEach(function (k) { if (q[k]) { click_ids[k] = q[k]; found = true; } });
    ["source","medium","campaign","content","term"].forEach(function (k) { if (q["utm_" + k]) { utm[k] = q["utm_" + k]; } });
    if (found || Object.keys(utm).length) {
      var attr = { click_ids: click_ids, utm: utm, ts: Date.now() };
      if (!existing) { ls(STORE, JSON.stringify(attr)); existing = attr; } // first-touch bleibt
      return { click_ids: click_ids, utm: utm }; // aktueller Touch (last-touch fuer dieses Event)
    }
    return existing ? { click_ids: existing.click_ids || {}, utm: existing.utm || {} } : { click_ids: {}, utm: {} };
  }
  function refHost() {
    try { return d.referrer ? new URL(d.referrer).host : ""; } catch (e) { return ""; }
  }

  // ---- v2.2: Match-Signale, Consent-Report, Region ------------------------
  function matchSignals() {
    // _fbp/_fbc werden NIE von qpx gesetzt — nur mitgelesen, wenn fbevents.js
    // bzw. das Storefront-Click-Capture sie als First-Party-Cookie angelegt hat.
    if (CFG.match === false) return {};
    var out = {};
    try {
      var fbp = getCookie("_fbp"), fbc = getCookie("_fbc");
      if (fbp && fbp.indexOf("fb.") === 0) out.fbp = fbp;
      if (fbc && fbc.indexOf("fb.") === 0) out.fbc = fbc;
    } catch (e) {}
    return out;
  }
  function consentState() {
    if (CFG.consent_report === false) return null;
    try {
      var cb = w.Cookiebot;
      if (cb && cb.consent && typeof cb.consent.marketing !== "undefined") {
        var mk = cb.consent.marketing ? "granted" : "denied";
        return { ad_storage: mk, ad_user_data: mk };
      }
    } catch (e) {}
    return null;
  }
  function region() {
    if (CFG.region) return String(CFG.region);
    try {
      return d.documentElement.getAttribute("data-qb-region") || "";
    } catch (e) { return ""; }
  }

  function base(name, props) {
    props = props || {};
    var attr = captureAttr();
    var ev = {
      event_id: uuid(),
      event_name: name,
      event_time: Math.floor(Date.now() / 1000),
      anon_id: anonId(),
      session_id: sessionId(),
      url: w.location.href,
      referrer: d.referrer || "",
      click_ids: attr.click_ids,
      utm: attr.utm,
      referrer_host: refHost()
    };
    // v2.2: Match-Signale + Consent + Region additiv (Receiver kennt die Felder).
    var ms = matchSignals();
    if (ms.fbp) ev.fbp = ms.fbp;
    if (ms.fbc) ev.fbc = ms.fbc;
    var cs = consentState();
    if (cs) ev.consent = cs;
    var rg = region();
    if (rg) ev.region = rg;
    for (var k in props) { if (Object.prototype.hasOwnProperty.call(props, k)) ev[k] = props[k]; }
    return ev;
  }
  function send(ev) {
    var body = JSON.stringify(ev);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch (e) {}
    try { fetch(ENDPOINT, { method: "POST", body: body, headers: { "Content-Type": "application/json" }, keepalive: true, mode: "cors" }); } catch (e) {}
  }

  function track(name, props) { send(base(name, props)); }
  function identify(email, props) { props = props || {}; if (email) props.email = email; send(base("identify", props)); }

  // Queue-Replay (falls qpx vor Laden aufgerufen wurde: window.qpx.q)
  var q = (w.qpx && w.qpx.q) || [];
  function api() {
    var args = [].slice.call(arguments), cmd = args.shift();
    if (cmd === "track") return track(args[0], args[1]);
    if (cmd === "identify") return identify(args[0], args[1]);
    if (cmd === "purchase") return track("purchase", args[0]);
  }
  w.qpx = api; w.qpx.track = track; w.qpx.identify = identify;
  q.forEach(function (a) { api.apply(null, a); });

  // ---- Verhaltens-Schicht (v2.0): Sektions-Tracker -----------------------
  // EIN kumulativer Snapshot je Pageview (pv_id, seq waechst je Flush).
  // KOMPLETT in try/catch — ein Pixel-Fehler darf die Seite NIE brechen.
  // Alle Listener passive. Kein neuer Speicher: pv_id lebt nur im RAM.
  function initBehavior() {
    if (CFG.behavior === false) return;                 // Tracker-Flag (Konzept E1)
    var PV_ID = uuid();                                  // Pageview-UUID (kein Cookie)
    var seq = 0;                                         // waechst je Flush, Server: letzter Stand gewinnt
    var scrollMax = 0;                                   // erreichte Marke 25/50/75/100
    var attentionMs = 0;                                 // sichtbar + aktiv (5s-Raster)
    var lastActivity = Date.now();
    var sections = {};                                   // id -> {seen,dwellAcc,visibleSince,clicks}
    var lastSent = "";                                   // Signatur des letzten Flushs
    // ---- Frustrations-Signale (v2.1, T2): dead/rage/error_click -----------
    // Additiv im bestehenden behavior-Flush; kumulativ je Pageview. ELEMENT-
    // basierte Verortung (sel + rx/ry relativ 0..1), NIE Seiten-x/y. Keine
    // Feld-Inhalte. Abschaltbar via QPX_CONFIG.frust=false.
    var FRUST_ON = CFG.frust !== false;
    var DEAD_MS = 3000, RAGE_MS = 1000, RAGE_PX = 30, RAGE_MIN = 3, FRUST_MAX = 40;
    var frust = [];                                      // im Snapshot mitgesendet
    var lastClick = null;                                // {t,x,y,el} fuer error_click
    var rageChain = [], rageEmitted = false;             // Burst-Erkennung
    var lastMutation = 0, lastScrollTs = 0, unloading = false;

    function sec(id) {
      if (!sections[id]) sections[id] = { seen: 0, dwellAcc: 0, visibleSince: 0, clicks: 0 };
      return sections[id];
    }
    function dwellOf(s, now) { return s.dwellAcc + (s.visibleSince ? now - s.visibleSince : 0); }
    function device() {
      try { return (w.matchMedia && w.matchMedia("(pointer:coarse)").matches) ? "mobile" : "desktop"; }
      catch (e) { return "desktop"; }
    }
    // ---- Frust-Helfer: kurzer Selektor + relative Position + Puffer ---------
    function clamp01(n) { return n < 0 ? 0 : (n > 1 ? 1 : n); }
    function selOf(el) {
      // id > data-section > tag:nth-child. Klassen bewusst WEG: Hydrogen/Vite
      // liefert gehashte, build-instabile Klassennamen -> kein tragfaehiger Anker.
      try {
        if (!el || el.nodeType !== 1) return "";
        if (el.id) return "#" + el.id;
        var t = el.tagName.toLowerCase(), da = el.getAttribute("data-section");
        if (da) return t + "[data-section=" + da + "]";
        var s = el, i = 1;
        while ((s = s.previousElementSibling)) i++;
        return t + ":nth-child(" + i + ")";
      } catch (e) { return ""; }
    }
    function relPos(el, cx, cy) {
      try {
        var r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0)
          return { rx: clamp01((cx - r.left) / r.width), ry: clamp01((cy - r.top) / r.height) };
      } catch (e) {}
      return { rx: null, ry: null };
    }
    function sectionOf(el) {
      try { var sc = el && el.closest ? el.closest("[data-section]") : null;
            return sc ? (sc.getAttribute("data-section") || "") : ""; }
      catch (e) { return ""; }
    }
    function pushFrust(typ, el, cx, cy, meta) {
      if (!FRUST_ON || frust.length >= FRUST_MAX) return;
      var rp = (el && cx != null) ? relPos(el, cx, cy) : { rx: null, ry: null };
      frust.push({ typ: typ, section_id: sectionOf(el), sel: selOf(el),
                   rx: rp.rx, ry: rp.ry, meta: meta || {} });
    }
    function exempt(el) {                                 // Nav/Download taeuscht keinen "toten" Klick vor
      try {
        if (el.tagName === "A") {
          var h = el.getAttribute("href") || "";
          if (/^(mailto:|tel:)/i.test(h) || el.hasAttribute("download") ||
              el.getAttribute("target") === "_blank") return true;
        }
        if (el.tagName === "INPUT" && (el.getAttribute("type") || "").toLowerCase() === "file") return true;
      } catch (e) {}
      return false;
    }
    function onError(msg, src) {
      if (!FRUST_ON) return;
      try {
        msg = ("" + (msg || "")).slice(0, 120);          // msg gekappt (keine PII-Leaks)
        src = ("" + (src || "")).slice(0, 120);
        if (lastClick && Date.now() - lastClick.t <= RAGE_MS)
          pushFrust("error_click", lastClick.el, lastClick.x, lastClick.y, { msg: msg, src: src });
        else if (frust.length < FRUST_MAX)
          frust.push({ typ: "js_error", section_id: "", sel: "", rx: null, ry: null, meta: { msg: msg, src: src } });
      } catch (e) {}
    }
    function snapshot() {
      var now = Date.now(), list = [];
      for (var id in sections) {
        if (!Object.prototype.hasOwnProperty.call(sections, id)) continue;
        var s = sections[id], dw = Math.round(dwellOf(s, now));
        if (dw >= 1000) s.seen = 1;                      // seen ab >=1s kumulativ sichtbar
        list.push({ id: id, seen: s.seen, dwell_ms: dw, clicks: s.clicks });
      }
      list.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      return { attention_ms: attentionMs, scroll_max_pct: scrollMax,
               device: device(), sections: list, frust: frust };
    }
    function flush(force) {
      var snap = snapshot();
      var sig = JSON.stringify(snap);
      if (!force && sig === lastSent) return;            // 15s-Flush nur bei Aenderung
      lastSent = sig;
      snap.pv_id = PV_ID; snap.seq = seq++;              // kumulativer Stand, Server-Upsert monoton
      track("behavior", snap);
    }

    // Sektionen (v2.3): Anker [data-section]; Fallback [data-section-type]
    // fuer Themes ohne kuratierte Anker (USA-Liquid/GemPages) — KEIN neues
    // Feld/Event, nur Anker-Aufloesung. "Sichtbar" = >=50% des ELEMENTS ODER
    // Deckung >=50% des VIEWPORTS (Tall-Section-Fix: fixe threshold 0.5
    // feuerte bei Sektionen hoeher ~2x Viewport strukturell nie, Beleg
    // mikroskop-video 1/1279 seen). Spaet gemountete Anker (Hydration/Lazy)
    // werden nachregistriert (Beleg gitterchip-video: nur 492/1280 pv
    // ueberhaupt beobachtet). Job 20260721-sektionsmessung-usa-exposure.
    var secIo = null, secObserved = [];
    function anchorId(el) {
      return el.getAttribute("data-section") ||
             el.getAttribute("data-section-type") || "";
    }
    function visEnough(en) {
      if (en.intersectionRatio >= 0.5) return true;
      try {
        var vh = (en.rootBounds && en.rootBounds.height) || w.innerHeight || 0;
        return vh > 0 && en.intersectionRect &&
               en.intersectionRect.height >= vh * 0.5;
      } catch (e) { return false; }
    }
    function observeSections() {
      if (!w.IntersectionObserver) return;
      var nodes = d.querySelectorAll("[data-section]");
      if (!nodes.length) nodes = d.querySelectorAll("[data-section-type]");
      if (!nodes.length) return;
      if (!secIo) {
        var thr = []; for (var t = 0; t <= 20; t++) thr.push(t / 20);
        secIo = new w.IntersectionObserver(function (entries) {
          var now = Date.now();
          for (var i = 0; i < entries.length; i++) {
            var en = entries[i], id = anchorId(en.target);
            if (!id) continue;
            var s = sec(id), vis = en.isIntersecting && visEnough(en);
            if (vis) { if (!s.visibleSince) s.visibleSince = now; }
            else if (s.visibleSince) { s.dwellAcc += now - s.visibleSince; s.visibleSince = 0; }
          }
        }, { threshold: thr });
      }
      for (var i = 0; i < nodes.length; i++) {
        var bekannt = false;
        for (var j = 0; j < secObserved.length; j++) {
          if (secObserved[j] === nodes[i]) { bekannt = true; break; }
        }
        if (!bekannt) { secIo.observe(nodes[i]); secObserved.push(nodes[i]); }
      }
    }
    observeSections();
    try {                                    // Nachregistrierung (rAF-throttled)
      if (w.MutationObserver) {
        var secScanPending = false;
        new w.MutationObserver(function () {
          if (secScanPending) return;
          secScanPending = true;
          (w.requestAnimationFrame || w.setTimeout)(function () {
            secScanPending = false;
            try { observeSections(); } catch (e) {}
          });
        }).observe(d.documentElement, { childList: true, subtree: true });
      }
    } catch (e) {}

    // Klicks: delegiert (capture, passive) -> naechster data-section-Vorfahr.
    d.addEventListener("click", function (e) {
      lastActivity = Date.now();
      try {
        var el = e.target && e.target.closest ? e.target.closest("[data-section]") : null;
        if (el) { var id = el.getAttribute("data-section"); if (id) sec(id).clicks++; }
      } catch (e2) {}
      // ---- Frust-Erkennung (v2.1): rage_click + dead_click + lastClick ----
      if (!FRUST_ON) return;
      try {
        var now = Date.now(), tgt = e.target, cx = e.clientX, cy = e.clientY;
        lastClick = { t: now, x: cx, y: cy, el: tgt };
        // rage_click: >=RAGE_MIN Klicks je <=RAGE_MS und <=RAGE_PX -> EIN Event/Burst
        rageChain = rageChain.filter(function (c) {
          return now - c.t <= RAGE_MS && Math.abs(c.x - cx) <= RAGE_PX && Math.abs(c.y - cy) <= RAGE_PX;
        });
        rageChain.push({ t: now, x: cx, y: cy });
        if (rageChain.length === 1) rageEmitted = false;   // neuer Burst
        if (rageChain.length >= RAGE_MIN && !rageEmitted) {
          pushFrust("rage_click", tgt, cx, cy, { clicks: rageChain.length, span_ms: now - rageChain[0].t });
          rageEmitted = true;
        }
        // dead_click: actionable Element (closest filtert = actionable), danach
        // 3s kein DOM-/Scroll-/Nav-Effekt. Nav/Download/mailto/tel ausgenommen.
        var act = tgt && tgt.closest ? tgt.closest("button,input,a,[role=button]") : null;
        if (act && !exempt(act)) {
          var t0 = now, a0 = act, ax = cx, ay = cy;
          w.setTimeout(function () {
            try {
              if (unloading || lastMutation > t0 || lastScrollTs > t0) return;
              pushFrust("dead_click", a0, ax, ay, { waited_ms: DEAD_MS });
            } catch (e3) {}
          }, DEAD_MS);
        }
      } catch (e4) {}
    }, { passive: true, capture: true });

    // DOM-Mutations-Beobachter fuer dead_click (setzt NUR einen Zeitstempel).
    try {
      if (w.MutationObserver && FRUST_ON) {
        new w.MutationObserver(function () { lastMutation = Date.now(); })
          .observe(d.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      }
    } catch (e) {}

    // JS-Fehler: window error + unhandledrejection (<=1s nach Klick = error_click).
    w.addEventListener("error", function (ev) {
      try { onError(ev && ev.message, ev && ev.filename); } catch (e) {}
    }, { passive: true });
    w.addEventListener("unhandledrejection", function (ev) {
      try { var r = ev && ev.reason; onError(r && (r.message || r), ""); } catch (e) {}
    }, { passive: true });

    // Scroll-Marken 25/50/75/100 (passive + rAF-throttled).
    var scrollPending = false;
    function measureScroll() {
      scrollPending = false;
      try {
        var de = d.documentElement;
        var h = Math.max(1, de.scrollHeight || 1);
        var pct = ((w.pageYOffset || de.scrollTop || 0) + (w.innerHeight || de.clientHeight || 0)) / h * 100;
        var marks = [25, 50, 75, 100];
        for (var i = 0; i < marks.length; i++) { if (pct >= marks[i] && marks[i] > scrollMax) scrollMax = marks[i]; }
      } catch (e) {}
    }
    w.addEventListener("scroll", function () {
      lastActivity = lastScrollTs = Date.now();          // lastScrollTs: dead_click-Ausschluss
      if (!scrollPending) { scrollPending = true; (w.requestAnimationFrame || w.setTimeout)(measureScroll); }
    }, { passive: true });
    measureScroll();                                     // initiale Marke (kurze Seiten = 100)

    // Aktivitaets-Signale fuer attention (nur Zeitstempel, keine Inhalte/PII).
    var acts = ["keydown", "mousemove", "touchstart"];
    for (var a = 0; a < acts.length; a++) {
      w.addEventListener(acts[a], function () { lastActivity = Date.now(); }, { passive: true });
    }
    // attention_ms: alle 5s +5000, wenn Tab sichtbar UND Aktivitaet <30s her.
    w.setInterval(function () {
      try {
        if (d.visibilityState === "visible" && Date.now() - lastActivity < 30000) attentionMs += 5000;
      } catch (e) {}
    }, 5000);

    // Flush: alle 15s nur bei Aenderung; bei hidden/pagehide IMMER.
    w.setInterval(function () { try { flush(false); } catch (e) {} }, 15000);
    d.addEventListener("visibilitychange", function () {
      if (d.visibilityState === "hidden") { try { flush(true); } catch (e) {} }
    });
    w.addEventListener("pagehide", function () { unloading = true; try { flush(true); } catch (e) {} });
  }

  // ---- v2.2: identify-Auto-Hook (Form-Submit mit E-Mail-Feld) --------------
  // Sendet an den EIGENEN First-Party-Receiver; dort wird die E-Mail sofort
  // gesalzen-gehasht und der Klartext verworfen (privacy.hash_email). Dedupe
  // je Session ueber nicht-umkehrbaren djb2-Kurz-Hash (keine PII im Storage).
  function initIdentify() {
    if (CFG.identity === false) return;
    function djb2(s) {
      var h = 5381, i;
      for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return String(h);
    }
    d.addEventListener("submit", function (e) {
      try {
        var form = e.target;
        if (!form || !form.querySelectorAll) return;
        var inputs = form.querySelectorAll("input[type=email],input[name*=email i]");
        for (var i = 0; i < inputs.length; i++) {
          var v = (inputs[i].value || "").trim();
          if (!v || v.indexOf("@") < 1 || v.length > 254) continue;
          var sig = djb2(v.toLowerCase());
          if (sessionStorageGet("_qpx_idf") === sig) return;
          sessionStorageSet("_qpx_idf", sig);
          identify(v.toLowerCase());
          return;
        }
      } catch (e2) {}
    }, { passive: true, capture: true });
  }

  // Auto page_view (v1-Verhalten unveraendert) + Verhaltens-Tracker (v2.0).
  function boot() { track("page_view"); try { initBehavior(); } catch (e) {} try { initIdentify(); } catch (e) {} }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
