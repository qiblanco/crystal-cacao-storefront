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

  if (!attributes.length) return attributes;

  addCartAttribute(attributes, 'landing_page', storedAttribution?.href);
  addCartAttribute(attributes, 'referrer', storedAttribution?.referrer);
  addCartAttribute(
    attributes,
    'attribution_saved_at',
    storedAttribution?.savedAt,
  );
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
