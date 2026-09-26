/* qpx.js — ERZEUGT aus receiver/pixel/qpx.js (bin/qpx-ausliefern). NICHT VON HAND AENDERN. */
(function (w, d) {
  "use strict";
  var CFG = w.QPX_CONFIG || {};
  var ENDPOINT = CFG.endpoint || "/collect";
  var COOKIE = "_qpx_anon";
  var SES = "_qpx_ses";
  var STORE = "_qpx_attr";
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

  var EH = "_qpx_eh";
  var EH_RX = /^[0-9a-f]{16}$/;
  function mailZeiger() {
    try {
      var roh = String(params()["qpx_eh"] || "").toLowerCase();
      if (EH_RX.test(roh)) { sessionStorageSet(EH, roh); return roh; }
    } catch (e) {}
    var gespeichert = String(sessionStorageGet(EH) || "").toLowerCase();
    return EH_RX.test(gespeichert) ? gespeichert : "";
  }

  function params() {
    var q = {}, s = w.location.search.replace(/^\?/, "");
    if (s) s.split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ""); });
    return q;
  }
  function captureAttr() {
    var existing; try { existing = JSON.parse(ls(STORE) || "null"); } catch (e) { existing = null; }
    var q = params(), click_ids = {}, utm = {}, found = false;
    CLICK_KEYS.forEach(function (k) { if (q[k]) { click_ids[k] = q[k]; found = true; } });
    ["source","medium","campaign","content","term"].forEach(function (k) { if (q["utm_" + k]) { utm[k] = q["utm_" + k]; } });
    if (found || Object.keys(utm).length) {
      var attr = { click_ids: click_ids, utm: utm, ts: Date.now() };
      if (!existing) { ls(STORE, JSON.stringify(attr)); existing = attr; }
      return { click_ids: click_ids, utm: utm };
    }
    return existing ? { click_ids: existing.click_ids || {}, utm: existing.utm || {} } : { click_ids: {}, utm: {} };
  }
  function refHost() {
    try { return d.referrer ? new URL(d.referrer).host : ""; } catch (e) { return ""; }
  }

  function matchSignals() {
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

  var FP_MODI = /*__QPX_FP_MODI_START__*/{"DACH":"aus","USA":"aus","notaus":true}/*__QPX_FP_MODI_END__*/;

  function fpMarkt() {
    var h = "";
    try { h = String(w.location.hostname || "").toLowerCase(); } catch (e) { return ""; }
    if (h === "qi-blanco.com" || h === "www.qi-blanco.com") return "USA";
    if (h === "qiblanco.com" || h === "www.qiblanco.com" || h === "qi-blanco.de" ||
        h === "www.qi-blanco.de" || h === "t.qiblanco.com") return "DACH";
    return "";
  }

  function fpErlaubt() {
    try {
      if (FP_MODI && FP_MODI.notaus) return false;
      var stufe = (FP_MODI && FP_MODI[fpMarkt()]) || "aus";
      if (stufe === "full") return true;
      if (stufe !== "konservativ") return false;
      var cs = consentState();
      return !!(cs && cs.ad_storage === "granted");
    } catch (e) { return false; }
  }

  function fpSignals() {
    if (!fpErlaubt()) return null;
    var o = {};
    try { if (w.screen) o.sr = String(w.screen.width) + "x" + String(w.screen.height); } catch (e) {}
    try { if (w.screen && w.screen.colorDepth) o.sd = String(w.screen.colorDepth); } catch (e) {}
    try { o.tz = String(new Date().getTimezoneOffset()); } catch (e) {}
    try { if (navigator.language) o.lang = String(navigator.language); } catch (e) {}
    try { if (navigator.platform) o.plat = String(navigator.platform); } catch (e) {}
    try { if (navigator.hardwareConcurrency) o.hc = String(navigator.hardwareConcurrency); } catch (e) {}
    try { if (navigator.deviceMemory) o.dm = String(navigator.deviceMemory); } catch (e) {}
    try { o.tp = String(navigator.maxTouchPoints || 0); } catch (e) {}
    for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) return o; }
    return null;
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
    var ms = matchSignals();
    if (ms.fbp) ev.fbp = ms.fbp;
    if (ms.fbc) ev.fbc = ms.fbc;
    var cs = consentState();
    if (cs) ev.consent = cs;
    var rg = region();
    if (rg) ev.region = rg;
    var fps = fpSignals();
    if (fps) ev.fp = fps;
    var eh = mailZeiger();
    if (eh) ev.email_hash = eh;
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

  var q = (w.qpx && w.qpx.q) || [];
  function api() {
    var args = [].slice.call(arguments), cmd = args.shift();
    if (cmd === "track") return track(args[0], args[1]);
    if (cmd === "identify") return identify(args[0], args[1]);
    if (cmd === "purchase") return track("purchase", args[0]);
  }
  w.qpx = api; w.qpx.track = track; w.qpx.identify = identify;
  q.forEach(function (a) { api.apply(null, a); });

  function initBehavior() {
    if (CFG.behavior === false) return;
    var PV_ID = uuid();
    var seq = 0;
    var scrollMax = 0;
    var attentionMs = 0;
    var lastActivity = Date.now();
    var sections = {};
    var lastKey = "";
    var lastVoll = "";
    var hiddenUnterdrueckt = 0;
    var FRUST_ON = CFG.frust !== false;
    var DEAD_MS = 3000, RAGE_MS = 1000, RAGE_PX = 30, RAGE_MIN = 3, FRUST_MAX = 40;
    var frust = [];
    var lastClick = null;
    var rageChain = [], rageEmitted = false;
    var lastMutation = 0, lastScrollTs = 0, unloading = false;

    function sec(id) {
      if (!sections[id]) sections[id] = { seen: 0, dwellAcc: 0, visibleSince: 0, clicks: 0, vis: 0 };
      return sections[id];
    }
    function dwellOf(s, now) { return s.dwellAcc + (s.visibleSince ? now - s.visibleSince : 0); }
    function tabSichtbar() {
      try { return d.visibilityState !== "hidden"; } catch (e) { return true; }
    }
    function dwellAnhalten(now) {
      for (var id in sections) {
        if (!Object.prototype.hasOwnProperty.call(sections, id)) continue;
        var s = sections[id];
        if (s.visibleSince) { s.dwellAcc += now - s.visibleSince; s.visibleSince = 0; }
      }
    }
    function dwellFortsetzen(now) {
      for (var id in sections) {
        if (!Object.prototype.hasOwnProperty.call(sections, id)) continue;
        var s = sections[id];
        if (s.vis && !s.visibleSince) s.visibleSince = now;
      }
    }
    function device() {
      try { return (w.matchMedia && w.matchMedia("(pointer:coarse)").matches) ? "mobile" : "desktop"; }
      catch (e) { return "desktop"; }
    }
    function clamp01(n) { return n < 0 ? 0 : (n > 1 ? 1 : n); }
    function selOf(el) {
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
    function exempt(el) {
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
    function onError(msg, src, ch, san, tr) {
      if (!FRUST_ON) return;
      try {
        msg = ("" + (msg || "")).slice(0, 120);
        src = ("" + (src || "")).slice(0, 120);
        var meta = { msg: msg, src: src };
        if (ch) meta.ch = ch;
        if (san != null) meta.san = san;
        if (tr != null) meta.tr = tr;
        if (lastClick && Date.now() - lastClick.t <= RAGE_MS)
          pushFrust("error_click", lastClick.el, lastClick.x, lastClick.y, meta);
        else if (frust.length < FRUST_MAX)
          frust.push({ typ: "js_error", section_id: "", sel: "", rx: null, ry: null, meta: meta });
      } catch (e) {}
    }
    var MEDIEN_ON = CFG.medien !== false;
    var MED_MRC_MS = 2000;
    var MED_SEG_MAX = 6 * 3600000;
    var MED_VIDEO_MAX = 20, MED_BILD_MAX = 40, MED_EINTRAG_MAX = 55;
    var MED_UMKEHR_PCT = 5, MED_UMKEHR_MAX = 20, MED_BILD_MIN_MS = 500;
    var MED_EXTERN_MAX = 40;
    var MED_EXTERN_STAND = { video_stand: 1, video_scrub: 1, bild_gesehen: 1, ausstieg: 1 };
    var MED_FAMILIEN = { imgix: 1, youtube: 1, scrub: 1, "360": 1, unbekannt: 1 };
    var MED_ARTEN = { video_start: 1, video_quartil: 1, video_stand: 1,
                      video_scrub: 1, bild_gesehen: 1, scroll_umkehr: 1, ausstieg: 1 };
    var medien = {};
    var medN = 0, medBildN = 0;
    var medIo = null, medObserved = [];
    var medExtern = [];
    var medExternVerworfen = 0;
    var scrollPct = 0, scrollWende = null, scrollUmkehrN = 0, scrollUmkehrListe = [];
    var letzterAnker = "";
    var ausstiegAn = 0;
    var MED_T0 = Date.now();

    function medSanit(s) {
      try {
        s = String(s || "").toLowerCase().replace(/[^a-z0-9_.:-]+/g, "-")
             .replace(/^-+|-+$/g, "");
        return s.slice(0, 64);
      } catch (e) { return ""; }
    }
    function medBasename(u) {
      try {
        u = String(u || "");
        if (!u || u.indexOf("blob:") === 0 || u.indexOf("data:") === 0) return "";
        u = u.split("?")[0].split("#")[0];
        return medSanit(u.substring(u.lastIndexOf("/") + 1));
      } catch (e) { return ""; }
    }
    function medObjekt(el) {
      var v = el.getAttribute && el.getAttribute("data-video");
      if (v) return { id: medSanit(v), q: "anker" };
      var b = medBasename(el.currentSrc || el.src);
      if (b) return { id: b, q: "quelle" };
      b = medBasename(el.getAttribute && el.getAttribute("poster"));
      if (b) return { id: b, q: "poster" };
      try {
        var sc = el.closest ? el.closest("[data-section]") : null;
        if (sc) { var sid = medSanit(sc.getAttribute("data-section"));
                  if (sid) return { id: sid, q: "sektion" }; }
      } catch (e) {}
      return { id: "", q: "" };
    }
    function medFamilie(el) {
      var f = el.getAttribute && el.getAttribute("data-video-familie");
      if (f && MED_FAMILIEN[f]) return { f: f, q: "anker" };
      return { f: "unbekannt", q: "abgeleitet" };
    }
    function medTon(el, k) {
      if (!k.tonBekannt || !k.tonHoerbar) return false;
      try {
        if (el.muted) return false;
        if (typeof el.volume === "number" && el.volume <= 0) return false;
      } catch (e) { return false; }
      return true;
    }
    function medCt(el) {
      try { var c = el.currentTime; return (typeof c === "number" && c >= 0) ? c : 0; }
      catch (e) { return 0; }
    }
    function medDauer(el) {
      try { var dd = el.duration; return (typeof dd === "number" && dd > 0 && dd < 86400) ? dd : 0; }
      catch (e) { return 0; }
    }
    function medZustand(k, el) {
      if (!tabSichtbar()) return "hintergrund";
      var ton = medTon(el, k);
      if (k.vis) return ton ? "sichtbar_ton" : "sichtbar_stumm";
      return ton ? "unsichtbar_ton" : "unsichtbar_stumm";
    }
    function medLauf(k, el, now) {
      if (!k.spielt || !k.seit) return 0;
      if (k.zustand === "hintergrund") {
        var c = medCt(el);
        return (c > k.ctSeit) ? Math.round((c - k.ctSeit) * 1000) : 0;
      }
      var ms = now - k.seit;
      return ms > 0 ? ms : 0;
    }
    function medBuche(k, el, now) {
      var ms = medLauf(k, el, now);
      if (ms > 0 && ms <= MED_SEG_MAX) k.konten[k.zustand] = (k.konten[k.zustand] || 0) + ms;
      k.seit = 0; k.ctSeit = medCt(el);
    }
    function medKonten(k, el, now) {
      var o = {}, id;
      for (id in k.konten) { if (k.konten[id]) o[id] = k.konten[id]; }
      var lauf = medLauf(k, el, now);
      if (lauf > 0 && lauf <= MED_SEG_MAX) o[k.zustand] = (o[k.zustand] || 0) + lauf;
      return o;
    }
    function medSumme(o) { var s = 0, id; for (id in o) s += o[id]; return s; }
    function medMrc(k, el, now) {
      if (k.mrc) return;
      if (!k.spielt || !k.vis || !tabSichtbar()) { k.sichtSeit = 0; return; }
      if (!k.sichtSeit) { k.sichtSeit = now; return; }
      if (now - k.sichtSeit >= MED_MRC_MS) { k.mrc = 1; k.startOff = now - MED_T0; k.start = 1; }
    }
    function medQuartile(k, el, now) {
      if (!k.mrc) return;
      var dur = medDauer(el); if (!dur) return;
      var ct = medCt(el), p = ct / dur;
      if (k.letztP > 0.9 && p < 0.1) p = 1;
      var m = [25, 50, 75, 100], i;
      for (i = 0; i < m.length; i++) {
        if (p * 100 >= m[i] && !k.q[m[i]]) {
          k.q[m[i]] = { t: now - MED_T0, z: k.zustand, kn: medKonten(k, el, now) };
        }
      }
      k.letztP = p;
    }
    function medEval(el) {
      if (!MEDIEN_ON) return;
      var k = el && el.__qpxMed; if (!k) return;
      var now = Date.now();
      medBuche(k, el, now);
      var lief = k.spielt;
      try { k.spielt = !!(!el.paused && !el.ended && el.readyState > 1); }
      catch (e) { k.spielt = false; }
      var ct = medCt(el);
      if (!k.spielt && !lief && k.letztCt >= 0 && Math.abs(ct - k.letztCt) > 0.05) {
        var durS = medDauer(el);
        if (durS) {
          var pct = Math.round(ct / durS * 100);
          if (pct > k.scrubMax) k.scrubMax = pct;
          if (ct < k.letztCt - 0.05) k.scrubUmkehr++;
          k.scrubN++;
          if (k.famQ !== "anker") { k.fam = "scrub"; k.famQ = "laufzeit"; }
        }
      } else if (k.spielt && k.famQ !== "anker" && k.fam === "unbekannt") {
        k.fam = "imgix";
        k.famQ = "laufzeit";
      }
      k.letztCt = ct;
      k.zustand = medZustand(k, el);
      if (k.spielt) { k.seit = now; k.ctSeit = ct; }
      medMrc(k, el, now);
      medQuartile(k, el, now);
    }
    function medRegistriere(el, art) {
      if (!MEDIEN_ON || !el || el.__qpxMed) return;
      if (art === "bild") { if (medBildN >= MED_BILD_MAX) return; }
      else if (medN >= MED_VIDEO_MAX) return;
      var o = medObjekt(el);
      if (!o.id) return;
      var k = medien[o.id];
      if (!k) {
        var f = art === "bild" ? { f: null, q: null } : medFamilie(el);
        var ton = el.getAttribute && el.getAttribute("data-video-ton");
        k = { art: art, id: o.id, objQ: o.q, fam: f.f, famQ: f.q, el: el,
              tonBekannt: ton === "hoerbar" || ton === "stumm",
              tonHoerbar: ton === "hoerbar",
              konten: {}, zustand: "sichtbar_stumm", spielt: false, vis: 0,
              seit: 0, ctSeit: 0, letztCt: medCt(el), letztP: 0,
              mrc: 0, sichtSeit: 0, start: 0, startOff: 0, q: {},
              scrubMax: 0, scrubUmkehr: 0, scrubN: 0,
              dwell: 0, dwellSeit: 0 };
        medien[o.id] = k;
        if (art === "bild") medBildN++; else medN++;
      }
      el.__qpxMed = k;
      if (art === "bild") return;
      var evs = ["play", "playing", "pause", "ended", "volumechange", "seeked", "emptied"];
      for (var i = 0; i < evs.length; i++) {
        el.addEventListener(evs[i], function () { try { medEval(el); } catch (e) {} },
                            { passive: true });
      }
      el.addEventListener("timeupdate", function () {
        var n = Date.now();
        if (n - (el.__qpxTu || 0) < 1000) return;
        el.__qpxTu = n;
        try { medEval(el); } catch (e) {}
      }, { passive: true });
    }
    function medObserve() {
      if (!MEDIEN_ON || !w.IntersectionObserver) return;
      if (!medIo) {
        medIo = new w.IntersectionObserver(function (entries) {
          var now = Date.now();
          for (var i = 0; i < entries.length; i++) {
            var en = entries[i], el = en.target, k = el.__qpxMed;
            if (!k) continue;
            var vis = en.isIntersecting && visEnough(en);
            if (k.art === "bild") {
              if (vis && tabSichtbar()) { if (!k.dwellSeit) k.dwellSeit = now; }
              else if (k.dwellSeit) { k.dwell += now - k.dwellSeit; k.dwellSeit = 0; }
              k.vis = vis ? 1 : 0;
              continue;
            }
            if (k.vis !== (vis ? 1 : 0)) { k.vis = vis ? 1 : 0; medEval(el); }
          }
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      }
      var nodes = d.querySelectorAll("video, [data-bild]"), i2;
      for (i2 = 0; i2 < nodes.length; i2++) {
        var n2 = nodes[i2], bekannt = false, j;
        for (j = 0; j < medObserved.length; j++) { if (medObserved[j] === n2) { bekannt = true; break; } }
        if (bekannt) continue;
        medRegistriere(n2, n2.hasAttribute("data-bild") && n2.tagName !== "VIDEO" ? "bild" : "video");
        medObserved.push(n2);
        if (n2.__qpxMed) medIo.observe(n2);
      }
    }
    function medTabWechsel() {
      if (!MEDIEN_ON) return;
      var id;
      for (id in medien) {
        var k = medien[id];
        if (k.art === "bild") {
          var now = Date.now();
          if (!tabSichtbar()) { if (k.dwellSeit) { k.dwell += now - k.dwellSeit; k.dwellSeit = 0; } }
          else if (k.vis && !k.dwellSeit) { k.dwellSeit = now; }
          continue;
        }
        try { medEval(k.el); } catch (e) {}
      }
    }
    function medScroll(pct) {
      if (!MEDIEN_ON) return;
      if (pct > scrollPct + 0.5) { scrollWende = null; }
      else if (pct < scrollPct - 0.5) {
        if (scrollWende === null) scrollWende = scrollPct;
        if (scrollWende - pct >= MED_UMKEHR_PCT && scrollUmkehrN < MED_UMKEHR_MAX) {
          scrollUmkehrN++;
          scrollUmkehrListe.push({ nr: scrollUmkehrN, von: Math.round(scrollWende),
                                   bis: Math.round(pct), anker: letzterAnker,
                                   t: Date.now() - MED_T0 });
          scrollWende = null;
        }
      }
      scrollPct = pct;
    }
    function medienExtern(e) {
      try {
        if (!MEDIEN_ON || !e || !MED_ARTEN[e.art]) return false;
        var obj = medSanit(e.obj); if (!obj) return false;
        var fam = MED_FAMILIEN[e.fam] ? e.fam : "unbekannt";
        var eintrag = { art: e.art, obj: obj, fam: fam, toff: Date.now() - MED_T0 };
        if (typeof e.wert === "number" && isFinite(e.wert)) eintrag.wert = e.wert;
        if (typeof e.zus === "string") eintrag.zus = e.zus;
        if (e.meta && typeof e.meta === "object") eintrag.meta = e.meta;
        var stand = MED_EXTERN_STAND[e.art] === 1, i;
        for (i = 0; i < medExtern.length; i++) {
          var v = medExtern[i];
          if (v.art !== eintrag.art || v.obj !== eintrag.obj) continue;
          if (stand) { medExtern[i] = eintrag; return true; }
          if (v.wert === eintrag.wert) return true;
        }
        if (medExtern.length >= MED_EXTERN_MAX) { medExternVerworfen++; return false; }
        medExtern.push(eintrag);
        return true;
      } catch (e2) { return false; }
    }
    function medienListe(now) {
      if (!MEDIEN_ON) return [];
      var out = [], id, i;
      for (id in medien) {
        if (!Object.prototype.hasOwnProperty.call(medien, id)) continue;
        var k = medien[id], el = k.el;
        if (k.art === "bild") {
          var dw = k.dwell + (k.dwellSeit ? now - k.dwellSeit : 0);
          if (dw >= MED_BILD_MIN_MS)
            out.push({ art: "bild_gesehen", obj: id, wert: Math.round(dw),
                       toff: 0, meta: { obj_q: k.objQ } });
          continue;
        }
        if (k.start)
          out.push({ art: "video_start", obj: id, fam: k.fam, wert: 1, toff: k.startOff,
                     meta: { obj_q: k.objQ, fam_q: k.famQ, dauer_s: Math.round(medDauer(el)),
                             ton_bekannt: k.tonBekannt ? 1 : 0 } });
        for (i in k.q) {
          if (!Object.prototype.hasOwnProperty.call(k.q, i)) continue;
          var qq = k.q[i], mq = { zustand_marke: qq.z };
          for (var zk in qq.kn) mq[zk] = qq.kn[zk];
          out.push({ art: "video_quartil", obj: id, fam: k.fam, wert: Number(i),
                     zus: qq.z, toff: qq.t, meta: mq });
        }
        var kn = medKonten(k, el, now), summe = medSumme(kn);
        if (summe > 0 || k.start) {
          var mm = { mrc: k.mrc ? 1 : 0, obj_q: k.objQ, fam_q: k.famQ,
                     ton_bekannt: k.tonBekannt ? 1 : 0 };
          for (var zk2 in kn) mm[zk2] = kn[zk2];
          out.push({ art: "video_stand", obj: id, fam: k.fam, wert: summe,
                     zus: k.zustand, toff: 0, meta: mm });
        }
        if (k.scrubN)
          out.push({ art: "video_scrub", obj: id, fam: k.fam, wert: k.scrubMax, toff: 0,
                     meta: { umkehr: k.scrubUmkehr, schritte: k.scrubN, obj_q: k.objQ } });
      }
      for (i = 0; i < scrollUmkehrListe.length; i++) {
        var u = scrollUmkehrListe[i];
        out.push({ art: "scroll_umkehr", obj: u.anker || "seite", nr: u.nr,
                   wert: u.bis, toff: u.t, meta: { von_pct: u.von, bis_pct: u.bis } });
      }
      if (ausstiegAn && letzterAnker)
        out.push({ art: "ausstieg", obj: letzterAnker, wert: Math.round(scrollPct),
                   toff: Date.now() - MED_T0, meta: { scroll_pct: Math.round(scrollPct) } });
      for (i = 0; i < medExtern.length; i++) out.push(medExtern[i]);
      if (medExternVerworfen)
        out.push({ art: "video_stand", obj: "naht-deckel", fam: "unbekannt",
                   wert: 0, toff: 0, meta: { extern_verworfen: medExternVerworfen } });
      return out.slice(0, MED_EINTRAG_MAX);
    }
    function medSchluessel(liste) {
      var k = [], i;
      for (i = 0; i < liste.length; i++) {
        var e = liste[i], stufe = 0;
        if (e.art === "video_quartil") stufe = e.wert;
        else if (e.art === "video_start") stufe = 1;
        else if (e.art === "video_scrub") stufe = Math.round((e.wert || 0) / 5);
        else if (e.art === "scroll_umkehr") stufe = e.nr;
        else if (e.art === "ausstieg") stufe = 1;
        k.push({ a: e.art, o: e.obj, s: stufe, z: e.zus || "" });
      }
      return k;
    }
    function snapshot() {
      var now = Date.now(), list = [];
      for (var id in sections) {
        if (!Object.prototype.hasOwnProperty.call(sections, id)) continue;
        var s = sections[id], dw = Math.round(dwellOf(s, now));
        if (dw >= 1000) s.seen = 1;
        list.push({ id: id, seen: s.seen, dwell_ms: dw, clicks: s.clicks });
      }
      list.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      return { attention_ms: attentionMs, scroll_max_pct: scrollMax,
               device: device(), sections: list, frust: frust,
               medien: medienListe(now) };
    }
    function schluessel(snap) {
      var kern = [];
      for (var i = 0; i < snap.sections.length; i++) {
        var s = snap.sections[i];
        kern.push({ id: s.id, seen: s.seen, clicks: s.clicks });
      }
      return JSON.stringify({ attention_ms: snap.attention_ms, scroll_max_pct: snap.scroll_max_pct,
                              device: snap.device, sections: kern, frust: snap.frust,
                              medien: medSchluessel(snap.medien || []) });
    }
    function flush(force, url) {
      if (force) ausstiegAn = 1;
      var snap = snapshot();
      var sig = JSON.stringify(snap);
      var key = schluessel(snap);
      if (force ? (sig === lastVoll) : (key === lastKey)) {
        if (force) hiddenUnterdrueckt++;
        return;
      }
      lastKey = key; lastVoll = sig;
      snap.pv_id = PV_ID; snap.seq = seq++;
      if (hiddenUnterdrueckt) snap.hidden_unterdrueckt = hiddenUnterdrueckt;
      if (url) snap.url = url;
      track("behavior", snap);
    }

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
            s.vis = vis ? 1 : 0;
            if (vis) letzterAnker = id;
            if (vis && tabSichtbar()) { if (!s.visibleSince) s.visibleSince = now; }
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
    try { medObserve(); } catch (e) {}
    try {
      if (w.MutationObserver) {
        var secScanPending = false;
        new w.MutationObserver(function () {
          if (secScanPending) return;
          secScanPending = true;
          (w.requestAnimationFrame || w.setTimeout)(function () {
            secScanPending = false;
            try { observeSections(); } catch (e) {}
            try { medObserve(); } catch (e) {}
          });
        }).observe(d.documentElement, { childList: true, subtree: true });
      }
    } catch (e) {}

    d.addEventListener("click", function (e) {
      lastActivity = Date.now();
      try {
        var el = e.target && e.target.closest ? e.target.closest("[data-section]") : null;
        if (el) { var id = el.getAttribute("data-section"); if (id) sec(id).clicks++; }
      } catch (e2) {}
      if (!FRUST_ON) return;
      try {
        var now = Date.now(), tgt = e.target, cx = e.clientX, cy = e.clientY;
        lastClick = { t: now, x: cx, y: cy, el: tgt };
        rageChain = rageChain.filter(function (c) {
          return now - c.t <= RAGE_MS && Math.abs(c.x - cx) <= RAGE_PX && Math.abs(c.y - cy) <= RAGE_PX;
        });
        rageChain.push({ t: now, x: cx, y: cy });
        if (rageChain.length === 1) rageEmitted = false;
        if (rageChain.length >= RAGE_MIN && !rageEmitted) {
          pushFrust("rage_click", tgt, cx, cy, { clicks: rageChain.length, span_ms: now - rageChain[0].t });
          rageEmitted = true;
        }
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

    try {
      if (w.MutationObserver && FRUST_ON) {
        new w.MutationObserver(function () { lastMutation = Date.now(); })
          .observe(d.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      }
    } catch (e) {}

    w.addEventListener("error", function (ev) {
      try {
        onError(ev && ev.message, ev && ev.filename, "e",
                (ev && ev.error == null) ? 1 : 0,
                (ev && ev.isTrusted === false) ? 0 : 1);
      } catch (e) {}
    }, { passive: true });
    w.addEventListener("unhandledrejection", function (ev) {
      try {
        var r = ev && ev.reason;
        onError(r && (r.message || r), "", "r", null,
                (ev && ev.isTrusted === false) ? 0 : 1);
      } catch (e) {}
    }, { passive: true });

    var scrollPending = false;
    function measureScroll() {
      scrollPending = false;
      try {
        var de = d.documentElement;
        var h = Math.max(1, de.scrollHeight || 1);
        var pct = ((w.pageYOffset || de.scrollTop || 0) + (w.innerHeight || de.clientHeight || 0)) / h * 100;
        var marks = [25, 50, 75, 100];
        for (var i = 0; i < marks.length; i++) { if (pct >= marks[i] && marks[i] > scrollMax) scrollMax = marks[i]; }
        medScroll(Math.max(0, Math.min(100, pct)));
      } catch (e) {}
    }
    w.addEventListener("scroll", function () {
      lastActivity = lastScrollTs = Date.now();
      if (!scrollPending) { scrollPending = true; (w.requestAnimationFrame || w.setTimeout)(measureScroll); }
    }, { passive: true });
    measureScroll();

    var acts = ["keydown", "mousemove", "touchstart"];
    for (var a = 0; a < acts.length; a++) {
      w.addEventListener(acts[a], function () { lastActivity = Date.now(); }, { passive: true });
    }
    w.setInterval(function () {
      try {
        if (d.visibilityState === "visible" && Date.now() - lastActivity < 30000) attentionMs += 5000;
      } catch (e) {}
    }, 5000);

    w.setInterval(function () { try { flush(false); } catch (e) {} }, 15000);
    d.addEventListener("visibilitychange", function () {
      var now = Date.now();
      if (d.visibilityState === "hidden") {
        dwellAnhalten(now);
        try { medTabWechsel(); } catch (e) {}
        try { flush(true); } catch (e) {}
      } else {
        dwellFortsetzen(now);
        try { medTabWechsel(); } catch (e) {}
      }
    });
    w.addEventListener("pagehide", function () {
      unloading = true; dwellAnhalten(Date.now());
      try { medTabWechsel(); } catch (e) {}
      try { flush(true); } catch (e) {}
    });
    function medienRouteReset() {
      var now = Date.now(), id, i, keep = [];
      for (id in medien) {
        if (!Object.prototype.hasOwnProperty.call(medien, id)) continue;
        var k = medien[id], tot = false;
        try { tot = !!(k.el && k.el.isConnected === false); } catch (e) {}
        if (tot) {
          try { k.el.__qpxMed = null; } catch (e) {}
          delete medien[id];
          if (k.art === "bild") { if (medBildN > 0) medBildN--; }
          else if (medN > 0) medN--;
          continue;
        }
        k.konten = {}; k.q = {}; k.mrc = 0; k.start = 0; k.startOff = 0;
        k.sichtSeit = k.vis ? now : 0;
        k.dwell = 0; k.dwellSeit = (k.art === "bild" && k.vis && tabSichtbar()) ? now : 0;
        k.scrubMax = 0; k.scrubUmkehr = 0; k.scrubN = 0;
        k.seit = k.spielt ? now : 0; k.letztP = 0;
      }
      for (i = 0; i < medObserved.length; i++) {
        var n = medObserved[i];
        if (n && n.isConnected !== false) keep.push(n);
      }
      medObserved = keep;
      medExtern = []; medExternVerworfen = 0;
      scrollPct = 0; scrollWende = null; scrollUmkehrN = 0; scrollUmkehrListe = [];
      letzterAnker = ""; ausstiegAn = 0;
      MED_T0 = now;
    }
    var lastPath = w.location.pathname, lastHref = w.location.href;
    function routeChanged() {
      try {
        var p = w.location.pathname, altHref = lastHref;
        lastHref = w.location.href;
        if (p === lastPath) return;
        lastPath = p;
        try { flush(true, altHref); } catch (e) {}
        PV_ID = uuid(); seq = 0; lastKey = ""; lastVoll = ""; hiddenUnterdrueckt = 0;
        scrollMax = 0; attentionMs = 0; lastActivity = Date.now();
        sections = {}; frust = []; lastClick = null;
        rageChain = []; rageEmitted = false;
        var keep = [];
        for (var i = 0; i < secObserved.length; i++) {
          var n = secObserved[i];
          if (n && n.isConnected !== false) keep.push(n);
        }
        secObserved = keep;
        try { medienRouteReset(); } catch (e) {}
        track("page_view");
        try { observeSections(); } catch (e) {}
        try { medObserve(); } catch (e) {}
      } catch (e) {}
    }
    var histM = ["pushState", "replaceState"];
    for (var hm = 0; hm < histM.length; hm++) {
      (function (m) {
        try {
          var orig = w.history && w.history[m];
          if (typeof orig !== "function") return;
          w.history[m] = function () {
            var r = orig.apply(this, arguments);
            try { routeChanged(); } catch (e) {}
            return r;
          };
        } catch (e) {}
      })(histM[hm]);
    }
    w.addEventListener("popstate", function () { routeChanged(); });

    try { w.qpx.medien = medienExtern; } catch (e) {}
  }

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

  function boot() { track("page_view"); try { initBehavior(); } catch (e) {} try { initIdentify(); } catch (e) {} }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
