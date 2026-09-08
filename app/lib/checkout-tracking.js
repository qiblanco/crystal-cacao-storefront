/**
 * K3-NAHT (crystal-cacao-storefront) — EIGENE Fassung, NICHT geteilt.
 * =====================================================================
 * Herkunft: qiblanco-storefront app/lib/checkout-tracking.js @ 89c2422.
 * Klasse K3 nach ADR 0056: nur `sha256_upstream` gepinnt, lokal bewusst
 * abweichend. Bewegt sich die Vorlage oben (etwa ein NEUER Schluessel in
 * TRACKING_COOKIE_NAMES), meldet die Drift-Wache NAHT-NACHZUG — genau die
 * `_qpx_anon`-Fehlerklasse (90,6 % Fehlattribution), nur eine Domain weiter.
 *
 * WARUM SIE NICHT BYTE-GLEICH SEIN DARF (gemessen, nicht vermutet):
 * die Vorlage fuehrt `TRACKING_PRODUCTION_HOSTS` als Quelltext-Konstante mit
 * ausschliesslich qiblanco-Hosts. Byte-gleich uebernommen waere auf
 * crystal-cacao.com `isProductionHost = false` — kein Pixel, keine
 * Drittskripte, KEINE Fehlermeldung: Build gruen, Seite laedt, Tracking tot.
 *
 * DIE HOSTLISTE IST HIER ZUSAETZLICH UEBER `PUBLIC_TRACKING_HOSTS`
 * UEBERSTEUERBAR (kommagetrennt). Das ist bewusst vorweggenommen: ADR 0056
 * Festlegung 3 legt Christian denselben Schritt fuer qiblanco vor (dort waere
 * es eine Aenderung an der unberuehrbaren Hauptseite). Faellt die Entscheidung
 * dort so aus, ist diese Datei schon in der Zielform.
 *
 * NICHT hier: `PUBLIC_ENABLE_TRACKING_IN_PREVIEW`. Der Schalter ist ein
 * CONSENT-BYPASS (er setzt sich VOR jede Cookiebot-Abfrage) und in der
 * crystal-PRODUKTION verboten (ADR 0056 Festlegung 4). Durchsetzer:
 * homepage-bauer/pruefungen/probe_crystal_consent_bypass.py
 */
export const ATTRIBUTION_STORAGE_KEY = 'qiblanco_checkout_attribution';
export const ATTRIBUTION_COOKIE_NAME = ATTRIBUTION_STORAGE_KEY;

const TRACKING_PRODUCTION_HOSTS = new Set([
  'crystal-cacao.com',
  'www.crystal-cacao.com',
]);

const TRACKING_PARAM_NAMES = new Set([
  'fbclid',
  'fbc',
  'fbp',
  '_fbc',
  '_fbp',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'ttclid',
  'twclid',
  'li_fat_id',
  'epik',
  'scclid',
  'sccid',
  'rdt_cid',
  'irclickid',
  'click_id',
  'clickid',
  'h_ad_id',
  'h_click_id',
]);

const TRACKING_COOKIE_NAMES = new Set([
  '_fbc',
  '_fbp',
  'hyros_id',
  'hyros_sid',
  'hyros_session_id',
  'hyros_visitor_id',
  // First-Party qpx-Visitor-ID (Job 20260722-stitch-gap-session-kauf, 2026-07-23):
  // der eigene qpx-Pixel setzt _qpx_anon (365-Tage-Cookie, opakes uuid). Ihn als
  // Order-note_attribute mitzufuehren schliesst die Session->Kauf-Luecke: der
  // own-source-Stitch (own_source.py, gated OS_STITCH_SESSION) verbindet den Kauf
  // deterministisch mit der Ad-Klick-Session ueber identity_edge(anon) — auch bei
  // Multi-Session/Return-Visit ohne fbclid in der URL. Rein first-party/intern,
  // NICHT an Meta/Google gesendet; Capture bleibt consent-gated (wie fbc/fbp).
  '_qpx_anon',
]);

const MAX_CART_ATTRIBUTE_VALUE_LENGTH = 500;

// NACHZUG aus der Vorlage (#175, s03 2026-08-27).
// Query-Keys, die nie in ein Order-note_attribute gehoeren (Identitaet,
// Zugangsdaten, Kontakt). Bewusst eine DENYLIST, keine Allowlist:
// die Backend-Konsumenten der `landing_page`-Query sitzen in mehreren fremden
// Modulen (hyros-eigenbau own_source `_landing_params` + herkunft,
// capi-rueckspeisung order_to_event, google-rueckspeisung click_conversions,
// funnel-substrat sources) und lesen dort Keys, die in TRACKING_PARAM_NAMES
// bewusst NICHT stehen und darum ausschliesslich ueber diese Query erreichbar
// sind. Eine Allowlist waere hier eine handgepflegte Spiegelliste fremder
// Parser ohne Durchsetzer: ein uebersehener Key = stiller Attributionsverlust.
// Bei der Denylist ist ein uebersehener Key = unveraenderter Bestand.
// Die Fehlerrichtung entscheidet.
const SENSITIVE_QUERY_PARAM_NAMES = new Set([
  'email',
  'e_mail',
  'mail',
  'user_email',
  'customer_email',
  'phone',
  'telephone',
  'mobile',
  'first_name',
  'firstname',
  'last_name',
  'lastname',
  'fullname',
  'address',
  'street',
  'postal_code',
  'birthday',
  'birthdate',
  'dob',
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'access_token',
  'id_token',
  'refresh_token',
  'auth',
  'authorization',
  'api_key',
  'apikey',
  'otp',
  'session',
  'session_id',
  'sessionid',
  'sid',
  'iban',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
]);

/**
 * Appends only allowlisted ad attribution values to a checkout URL.
 *
 * @param {string} checkoutUrl
 * @param {{
 *   searchParams?: URLSearchParams | string | null,
 *   cookieHeader?: string | null,
 *   includeCookies?: boolean,
 * }} options
 */
export function appendTrackingToCheckoutUrl(
  checkoutUrl,
  {searchParams, cookieHeader, includeCookies = false} = {},
) {
  if (!checkoutUrl) return checkoutUrl;

  let url;
  try {
    url = new URL(checkoutUrl);
  } catch {
    return checkoutUrl;
  }

  const trackingParams = getCheckoutTrackingSearchParams({
    searchParams,
    cookieHeader,
    includeCookies,
  });

  for (const [name, value] of trackingParams) {
    appendAllowedTrackingValue(url.searchParams, name, value);
  }

  return url.toString();
}

/**
 * @param {{
 *   searchParams?: URLSearchParams | string | null,
 *   cookieHeader?: string | null,
 *   includeCookies?: boolean,
 * }} options
 */
export function getCheckoutTrackingSearchParams({
  searchParams,
  cookieHeader,
  includeCookies = false,
} = {}) {
  const target = new URLSearchParams();
  const storedAttribution = readStoredAttribution(cookieHeader);

  for (const [name, value] of getStoredAttributionParamEntries(
    storedAttribution,
  )) {
    setAllowedTrackingValue(target, name, value);
  }

  for (const [name, value] of normalizeSearchParams(searchParams)) {
    setAllowedTrackingValue(target, name, value, {overwrite: true});
  }

  if (includeCookies) {
    const cookies = parseCookieHeader(cookieHeader);
    for (const name of TRACKING_COOKIE_NAMES) {
      setAllowedTrackingValue(target, name, cookies[name], {overwrite: true});
    }
  }

  return target;
}

/**
 * Builds Shopify cart attributes that become order note_attributes after checkout.
 *
 * @param {{
 *   searchParams?: URLSearchParams | string | null,
 *   cookieHeader?: string | null,
 *   includeCookies?: boolean,
 * }} options
 */
export function buildAttributionCartAttributes({
  searchParams,
  cookieHeader,
  includeCookies = true,
} = {}) {
  const storedAttribution = readStoredAttribution(cookieHeader);
  const trackingParams = getCheckoutTrackingSearchParams({
    searchParams,
    cookieHeader,
    includeCookies,
  });

  const attributes = [];
  for (const [key, value] of trackingParams) {
    addCartAttribute(attributes, key, value);
  }

  // NACHZUG aus der Vorlage (#174, qiblanco 2026-08-09; hier uebernommen im
  // s03-Nachzug 2026-08-27): frueher stand hier
  // `if (!attributes.length) return attributes;` VOR dem Marker. Ein
  // signal-loser Besucher verliess die Funktion damit, bevor irgendetwas
  // geschrieben wurde — upstream gemessen trugen 41,7 % der DACH-Orders GAR
  // KEIN note_attribute. Folge: "Order lief nicht ueber die instrumentierte
  // Kasse" war von "Besucher hatte kein Ad-Signal" nicht mehr unterscheidbar.
  // Der Befund gilt fuer diesen Shop unveraendert — dieselbe Bauform.
  // ZWEI Haelften, beide noetig:
  //   1. Der Marker wird UNBEDINGT geschrieben (auch ohne jedes Signal).
  //   2. Der Marker zaehlt NICHT als Signal — sonst wuerden landing_page und
  //      referrer ploetzlich fuer jeden organischen Besucher mitgeschrieben,
  //      also eine stille Ausweitung der Datenmenge statt eines Fixes.
  const hasTrackingSignal = attributes.length > 0;

  if (hasTrackingSignal) {
    // NACHZUG aus der Vorlage (#175): `landing_page`/`referrer` trugen bisher
    // den VOLLEN href inklusive Query und Fragment in ein Order-note_attribute.
    // Ein Query-String kann personenbeziehbar sein (`?email=`, `?token=`); er
    // wird deshalb vor dem Schreiben bereinigt.
    addCartAttribute(
      attributes,
      'landing_page',
      sanitizeAttributionUrl(storedAttribution?.href),
    );
    addCartAttribute(
      attributes,
      'referrer',
      sanitizeAttributionUrl(storedAttribution?.referrer),
    );
    addCartAttribute(
      attributes,
      'attribution_saved_at',
      storedAttribution?.savedAt,
    );
  }

  // BEWUSST UNVERAENDERT beim Nachzug: der Wert bleibt 'qiblanco_hydrogen'.
  // Ihn hier auf einen eigenen Wert zu setzen waere eine Aenderung an einer
  // FREMDEN Naht — die Backend-Parser (own_source, capi-rueckspeisung,
  // funnel-substrat) lesen ihn. Das gehoert entschieden, nicht nebenbei.
  addCartAttribute(attributes, 'attribution_source', 'qiblanco_hydrogen');

  return attributes;
}

/**
 * @param {Array<{key?: string | null, value?: string | null}> | null | undefined} existingAttributes
 * @param {Array<{key: string, value: string}>} attributionAttributes
 */
export function mergeCartAttributes(existingAttributes, attributionAttributes) {
  const merged = new Map();

  for (const attribute of existingAttributes ?? []) {
    if (!attribute?.key) continue;
    merged.set(attribute.key, attribute.value ?? '');
  }

  let changed = false;
  for (const attribute of attributionAttributes) {
    if (!attribute?.key || !attribute?.value) continue;
    if (merged.get(attribute.key) !== attribute.value) changed = true;
    merged.set(attribute.key, attribute.value);
  }

  return {
    attributes: [...merged].map(([key, value]) => ({key, value})),
    changed,
  };
}

/**
 * @param {string | null} cookieHeader
 */
export function hasCookiebotMarketingConsent(cookieHeader) {
  const cookieConsent = parseCookieHeader(cookieHeader).CookieConsent;
  if (!cookieConsent) return false;

  const decoded = safeDecode(cookieConsent);
  return /(?:^|[,{]\s*|["'])marketing["']?\s*:\s*true(?:[,}]|$)/i.test(
    decoded,
  );
}

/**
 * Aktive Ablehnung: Cookiebot-Stamp vorhanden UND marketing:false.
 * (Kein Stamp = keine Entscheidung => false; Zustimmung => false.)
 * Job 20260718: Grundlage der 'optout'-Policy — nie gegen erklaerten Willen.
 *
 * @param {string | null} cookieHeader
 */
export function hasCookiebotMarketingDeclined(cookieHeader) {
  const cookieConsent = parseCookieHeader(cookieHeader).CookieConsent;
  if (!cookieConsent) return false;

  const decoded = safeDecode(cookieConsent);
  return /(?:^|[,{]\s*|["'])marketing["']?\s*:\s*false(?:[,}]|$)/i.test(
    decoded,
  );
}

/**
 * Produktions-Host? Quelle ist die Konstante oben; `PUBLIC_TRACKING_HOSTS`
 * (kommagetrennt) ersetzt sie, wenn gesetzt. Fail-closed: unlesbare URL oder
 * leere Liste ergeben `false` — im Zweifel KEIN Tracking, nie umgekehrt.
 *
 * Der Name bleibt bewusst wie in der Vorlage (`isQiblancoProductionHost`),
 * damit ein spaeterer Nachzug von qiblanco ein reiner Zeilen-Diff bleibt und
 * nicht an einer Umbenennung haengt.
 *
 * @param {string} requestUrl
 * @param {Record<string, string | undefined> | undefined} [env]
 */
export function isQiblancoProductionHost(requestUrl, env) {
  try {
    const {hostname} = new URL(requestUrl);
    return trackingProductionHosts(env).has(hostname);
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {Set<string>}
 */
function trackingProductionHosts(env) {
  const raw = env?.PUBLIC_TRACKING_HOSTS;
  if (!raw || typeof raw !== 'string') return TRACKING_PRODUCTION_HOSTS;
  const hosts = raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return hosts.length ? new Set(hosts) : TRACKING_PRODUCTION_HOSTS;
}

/**
 * @param {URLSearchParams | string | null | undefined} searchParams
 */
function normalizeSearchParams(searchParams) {
  if (!searchParams) return [];
  if (searchParams instanceof URLSearchParams) return searchParams.entries();
  return new URLSearchParams(searchParams).entries();
}

/**
 * @param {URLSearchParams} target
 * @param {string} name
 * @param {string | undefined} value
 */
function appendAllowedTrackingValue(target, name, value) {
  if (!value || !isTrackingParamName(name) || target.has(name)) return;
  target.append(name, value);
}

/**
 * @param {URLSearchParams} target
 * @param {string} name
 * @param {string | undefined} value
 * @param {{overwrite?: boolean}} options
 */
function setAllowedTrackingValue(target, name, value, {overwrite = false} = {}) {
  if (!value || !isTrackingParamName(name)) return;
  if (!overwrite && target.has(name)) return;
  target.set(name, value);
}

/**
 * @param {string} name
 */
function isTrackingParamName(name) {
  return (
    TRACKING_PARAM_NAMES.has(name) ||
    TRACKING_COOKIE_NAMES.has(name) ||
    /^utm_[a-z0-9_]+$/i.test(name)
  );
}

/**
 * @param {Array<{key: string, value: string}>} attributes
 * @param {string} key
 * @param {string | null | undefined} value
 */
function addCartAttribute(attributes, key, value) {
  if (!value) return;
  attributes.push({
    key,
    value: truncateCartAttributeValue(value),
  });
}

/**
 * @param {string} value
 */
/**
 * NACHZUG aus der Vorlage (#175, s03 2026-08-27).
 *
 * Entfernt Identitaets-/Zugangs-Query-Keys und den Fragment-Teil aus einer
 * URL, bevor sie als `landing_page`/`referrer` in ein Order-note_attribute
 * geht.
 *
 * Gibt den Eingabe-String BYTE-IDENTISCH zurueck, wenn nichts zu entfernen war
 * — so bleibt der Bestandswert (den fremde Parser per `urlsplit().query`
 * lesen) frei von URL-Normalisierungs-Nebenwirkungen.
 *
 * @param {string | null | undefined} rawUrl
 * @returns {string} bereinigte URL oder '' wenn unbrauchbar
 */
function sanitizeAttributionUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl) return '';

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return '';
  }

  // Nur echte Web-URLs (schuetzt vor javascript:/data:/android-app: im referrer).
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';

  let removed = false;
  for (const name of [...url.searchParams.keys()]) {
    if (!SENSITIVE_QUERY_PARAM_NAMES.has(name.toLowerCase())) continue;
    url.searchParams.delete(name);
    removed = true;
  }

  if (!removed && !url.hash) return rawUrl;

  url.hash = '';
  return url.toString();
}

/**
 * @param {string} value
 */
function truncateCartAttributeValue(value) {
  if (value.length <= MAX_CART_ATTRIBUTE_VALUE_LENGTH) return value;
  return value.slice(0, MAX_CART_ATTRIBUTE_VALUE_LENGTH);
}

/**
 * @param {string | null | undefined} cookieHeader
 */
function readStoredAttribution(cookieHeader) {
  const rawValue = parseCookieHeader(cookieHeader)[ATTRIBUTION_COOKIE_NAME];
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} storedAttribution
 */
function getStoredAttributionParamEntries(storedAttribution) {
  if (!Array.isArray(storedAttribution?.params)) return [];

  return storedAttribution.params.filter(
    (entry) =>
      Array.isArray(entry) &&
      typeof entry[0] === 'string' &&
      typeof entry[1] === 'string',
  );
}

/**
 * @param {string | null | undefined} cookieHeader
 */
function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((cookies, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (name) cookies[name] = safeDecode(value);
    return cookies;
  }, {});
}

/**
 * @param {string} value
 */
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// ===========================================================================
// NAHT-NACHZUG 2026-09-08 (Job 20260902-crystal-abnahme-...-prio45, Segment s04)
// aus der Vorlage, upstream-Commit d3b0bbb (#326). Der Block darunter ist
// ZEICHENGLEICH zur Vorlage uebernommen -- bewusst, siehe (3).
//
// WARUM DIESE NAHT NACHGEZOGEN WIRD, obwohl "bewusst unterlassen" an dieser
// K3-Datei sonst der Normalfall ist (qb_ad_id, 2026-09-05): der Konsument
// existiert diesmal, und er ist GETEILT. Drei Glieder, jedes einzeln gemessen:
//
//   (1) crystal-cacao.com und qiblanco.com haengen am SELBEN Shopify-Store.
//       Beide .env tragen PUBLIC_STORE_DOMAIN=qi-blanco.myshopify.com.
//       Eigene Auslieferung, aber kein eigener Shop.
//   (2) Eine Bestellung von crystal-cacao.com landet darum im SELBEN
//       Order-Strom wie eine qiblanco-DACH-Bestellung. Gemessen an
//       worker-pool/attribution/live/raw/orders.jsonl (253 Zeilen): das Feld
//       `shop` kennt genau zwei Werte, dach=222 und usa=31. Es gibt keinen
//       Wert `crystal` -- eine crystal-Order ist dort als `dach` gebucht und
//       von einer qiblanco-Order nicht zu unterscheiden.
//   (3) tracking-linkage/proben/probe_herkunftsmarker_ankunft.py fuehrt
//       PFLICHT_MARKER = (attribution_source, consent_state, ua_class) und
//       bewertet JEDE dach-Order seit dem Stichtag 2026-09-07T15:51:05Z.
//
// FOLGE, und sie ist der ganze Grund: haetten wir hier unterlassen, truege
// jede crystal-Order zwar `attribution_source` (das schreibt diese Storefront
// seit dem s03-Nachzug 2026-08-27), aber WEDER `consent_state` NOCH
// `ua_class`. Die Wache faellt dann auf exit 1 -- und klagt den GESUNDEN
// qiblanco-Bau fuer eine Luecke an, die in Wahrheit die hier nicht nachgezogene
// Naht ist. Je Seite gruen beweist nichts ueber die Naht dazwischen.
//
// DESHALB ZEICHENGLEICH UND NICHT ADAPTIERT: die Wache prueft die ANKUNFT
// derselben drei Marker in demselben Strom. Eine abweichende zweite Fassung
// erzeugte zwei Klassifikatoren fuer dieselbe Frage -- in der Auswertung waeren
// die Besucher der beiden Laeden danach nicht mehr trennbar. Dieselbe
// Begruendung, mit der die Vorlage ihrerseits `ua_klasse()` aus
// hyros-eigenbau/receiver/src/basis.py zeichengleich uebernommen hat.
//
// `attribution_source` BLEIBT 'qiblanco_hydrogen' -- unveraendert und bewusst,
// wortgleich zur Begruendung an buildAttributionCartAttributes weiter oben:
// den Wert hier auf einen eigenen zu setzen waere eine Aenderung an einer
// FREMDEN Naht (own_source, capi-rueckspeisung, funnel-substrat lesen ihn).
// Das gehoert entschieden, nicht nebenbei.
//
// KEINE AUSWEITUNG DER DATENMENGE, und das ist die Bedingung, unter der dieser
// Block an einer K3-Datei ueberhaupt zulaessig ist: gelesen werden
// ausschliesslich Request-Metadaten -- der User-Agent-Header und das
// Cookiebot-Cookie, letzteres NUR als ja/nein/unbekannt. KEINE Klick-ID,
// KEIN _fbc, KEIN _fbp, KEIN _qpx_anon, KEIN landing_page, KEIN referrer.
// Der personenbezogene Teil bleibt unveraendert consent-gegatet; genau deshalb
// steht das hier in einer EIGENEN Funktion. TRACKING_COOKIE_NAMES bleibt
// unberuehrt -- es kommt kein Identitaets-Key hinzu.
// ===========================================================================

// ---------------------------------------------------------------------------
// HERKUNFTS-MARKER — consent-frei, aus Request-Metadaten
// (Job 20260907-fbc-klick-id-ueberlebt-checkout-grenze-nicht-ads-unbewertbar-prio8, s02)
//
// DER BEFUND, DEN DIESER BLOCK AUFLÖST (s01, gemessen 2026-09-07 an
// orders.jsonl, DACH 30 T, n=28): 14 von 28 Orders tragen GAR KEIN
// note_attribute — nicht einmal `attribution_source`. Diese EINE leere Liste
// beantwortet DREI verschiedene Fragen mit demselben Zustand:
//   1. Der Besucher hatte keinen Marketing-Consent — RECHTMÄSSIG, kein Defekt.
//   2. Der Kauf lief am instrumentierten Hydrogen-Cart vorbei — Defekt.
//   3. Die Identität ging vorher verloren (In-App-Browser) — Defekt.
// Solange die drei denselben Zustand erzeugen, ist keine von ihnen messbar,
// und jeder Fix auf eine von ihnen ist geraten.
//
// WARUM DER FIX VON 2026-08-09 HIER NICHT REICHT: er machte den Marker INNEN
// unbedingt (buildAttributionCartAttributes, siehe oben). Eine Ebene HÖHER —
// in cart-attribution.server.js, cart.attribution.jsx und cart.$lines.jsx —
// steht der Früh-Ausstieg `if (!hasAttributionConsent(...)) return` unverändert.
// Ohne Consent läuft die innere Funktion GAR NICHT ERST AN. Der Fix wurde innen
// gebaut und ist außen wirkungslos.
//
// DIE HARTE GRENZE, die diesen Block erst zulässig macht — sie ist der Grund,
// warum er in einer EIGENEN Funktion steht und nicht in
// buildAttributionCartAttributes: hier werden Ausschließlich
// REQUEST-METADATEN gelesen — der User-Agent-Header und das Cookiebot-Cookie,
// letzteres NUR als ja/nein/unbekannt. KEIN Klick-ID-Wert, KEIN _fbc, KEIN
// _fbp, KEIN _qpx_anon, KEIN landing_page, KEIN referrer. Der personenbezogene
// Teil bleibt unverändert consent-gegatet. Diese Änderung weitet die
// Datenmenge NICHT aus — sie macht eine Messlücke sichtbar.

/**
 * WebView-/Browser-Klasse aus dem User-Agent.
 *
 * P10 (Bestand vor Neubau): die Regeln sind ZEICHENGLEICH aus dem produktiven
 * Klassifikator übernommen — hyros-eigenbau/receiver/src/basis.py, Funktion
 * `ua_klasse()` (Marker-Listen `_WEBVIEW_META_MARKERS` / `_WEBVIEW_ANDERE_MARKERS`
 * plus WKWebView-Abdruck). Es gibt bewusst KEINEN zweiten, abweichenden
 * Klassifikator: das Backend klassifiziert dieselben Besucher in events.db, und
 * zwei Fassungen derselben Frage wären in der Auswertung nicht mehr zu trennen.
 *
 * ABWEICHUNG VOM AUFTRAGSTEXT, bewusst und zugunsten des Bestands: der Auftrag
 * nennt vier Werte (webview_meta|webview_andere|browser|unbekannt). Der Bestand
 * kennt zusätzlich `webview_vermutet` und begründet ihn ausdrücklich — "DIE
 * GEFÄHRLICHE RICHTUNG IST DER FALSCH-NEGATIVE. Ein Webview, der sich nicht zu
 * erkennen gibt, würde als 'browser' gebucht". `webview_vermutet` in `browser`
 * zu kippen wäre genau der Fehler, gegen den der Bestand gebaut ist.
 *
 * Leerer/fehlender UA ergibt `unbekannt`, NIE `browser`: das Backend gibt dort
 * `None` zurück und nennt den Grund — ein Default auf `browser` wäre ein
 * erfundener Messwert in der entlastenden Richtung. Ein Cart-Attribut kann kein
 * `null` tragen (mergeCartAttributes verwirft leere Werte still), deshalb hier
 * der explizite String.
 *
 * @param {string | null | undefined} userAgent
 * @returns {'webview_meta'|'webview_andere'|'webview_vermutet'|'browser'|'unbekannt'}
 */
export function classifyUserAgent(userAgent) {
  const u = (userAgent || '').trim().toLowerCase();
  if (!u) return 'unbekannt';
  if (WEBVIEW_META_MARKERS.some((m) => u.includes(m))) return 'webview_meta';
  if (WEBVIEW_ANDERE_MARKERS.some((m) => u.includes(m))) return 'webview_andere';
  // WKWebView-Abdruck: iOS-WebKit, aber kein Safari-Token. Ein echter mobiler
  // Safari trägt IMMER 'safari/'; Chrome/Firefox auf iOS tragen 'crios/' bzw.
  // 'fxios/' und werden hier bewusst NICHT eingefangen.
  if (
    (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) &&
    u.includes('applewebkit') &&
    !u.includes('safari/') &&
    !u.includes('crios/') &&
    !u.includes('fxios/')
  ) {
    return 'webview_vermutet';
  }
  return 'browser';
}

const WEBVIEW_META_MARKERS = [
  'fban/',
  'fbav/',
  'fb_iab',
  'fbios',
  'fbdv/',
  'fbsv/',
  'instagram',
];

// Andere In-App-Browser. Sie beantworten die Meta-Frage nicht, müssen aber von
// 'browser' getrennt bleiben: sonst verwässern sie die Vergleichsgruppe, gegen
// die der Meta-Webview gemessen wird.
const WEBVIEW_ANDERE_MARKERS = [
  'micromessenger',
  'line/',
  'tiktok',
  'musical_ly',
  'bytedance',
  'twitter',
  'snapchat',
  'pinterest',
  'linkedinapp',
  'whatsapp',
  'gsa/',
  'yjapp',
  'kakaotalk',
  'naver',
  'electron/',
  '; wv', // Android-WebView kennzeichnet sich selbst
];

/**
 * Cookiebot-Marketing-Stempel als DREI-wertige Größe.
 *
 * WAS DAS IST UND WAS NICHT — der Unterschied entscheidet die spätere
 * Auswertung: dies ist der ROHE Cookiebot-Stempel, NICHT das region-bewusste
 * Policy-Urteil aus `hasRegionAwareTrackingPermission`. Für DACH fallen beide
 * zusammen (Policy dort immer 'consent'), für eine optout-Region NICHT: dort
 * darf ohne Stempel getrackt werden, `consent_state` bliebe trotzdem
 * `unknown`. Wer diese Spalte als "durfte getrackt werden" liest, irrt für
 * genau die Regionen, um die es hier nicht geht.
 *
 * @param {string | null} cookieHeader
 * @returns {'granted'|'denied'|'unknown'}
 */
export function consentStateFromCookies(cookieHeader) {
  if (hasCookiebotMarketingConsent(cookieHeader)) return 'granted';
  if (hasCookiebotMarketingDeclined(cookieHeader)) return 'denied';
  return 'unknown';
}

/**
 * Die drei consent-freien Herkunfts-Marker als Cart-Attribute.
 *
 * Sie werden an ALLEN Cart-Eintrittspunkten UNBEDINGT geschrieben — auch ohne
 * Marketing-Consent. Alle drei Werte sind immer nicht-leer, damit
 * `mergeCartAttributes` keinen davon still verwirft.
 *
 * @param {{userAgent?: string | null, cookieHeader?: string | null}} options
 * @returns {Array<{key: string, value: string}>}
 */
export function buildOriginCartAttributes({userAgent, cookieHeader} = {}) {
  const attributes = [];
  addCartAttribute(attributes, 'attribution_source', 'qiblanco_hydrogen');
  addCartAttribute(
    attributes,
    'consent_state',
    consentStateFromCookies(cookieHeader ?? null),
  );
  addCartAttribute(attributes, 'ua_class', classifyUserAgent(userAgent));
  return attributes;
}
