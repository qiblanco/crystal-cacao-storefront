/**
 * Der Schalter zwischen Cookiebot und dem eigenen Einwilligungshinweis.
 *
 * Grossjob 20261022-GROSSJOB-cookiebot-abloesen-eigener-einwilligungshinweis-qiblanco
 * (BAUVERTRAG Abschnitt 1 und 2). Christian 22.10.: „Das können wir doch selber
 * besser machen … und dann für qiblanco.com ersetzen."
 *
 * Seit 11.11.2026 gibt es nur noch den Motor 'eigen' (Job
 * 20261111-cookiebot-code-entfernen-drei-laeden-nach-7-stabilen-tagen). Der
 * Zweig 'cookiebot' und die Überschreibung `?qb_einwilligung=cookiebot` sind
 * ausgebaut; ein altes Sitzungs-Cookie `qb_einwilligung_motor` gilt nicht mehr.
 * Rückweg: git revert <Commit dieses Auftrags> + bin/bau-nachzieher --jetzt.
 *
 * Alles hier ist rein (kein window, kein Request-Objekt): der Root-Loader ruft
 * es am Server, die Probe am Quelltext.
 */
export const EINWILLIGUNG_MOTOR = 'eigen';

export const MOTOR_COOKIE = 'qb_einwilligung_motor';
export const MOTOR_QUERY = 'qb_einwilligung';
const MOTOREN = ['eigen'];

// 12 Monate wie Cookiebot (gemessen 23.10.: expires = utc + 365 Tage).
export const EINWILLIGUNG_LAUFZEIT_MS = 365 * 24 * 60 * 60 * 1000;

function cookieWert(cookieHeader, name) {
  const m = String(cookieHeader || '').match(
    new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'),
  );
  return m ? m[1] : '';
}

/**
 * Welcher Motor gilt für diese Anfrage? Seit 11.11.2026 immer 'eigen'.
 * Die Signatur bleibt, damit die Leser (root.jsx, checkout-tracking.js,
 * shopify-tracking-tor.js) unverändert bleiben; Query und Cookie
 * `qb_einwilligung_motor` werden nicht mehr gelesen.
 * -> {motor: 'eigen', setzeCookie: ''}
 */
// eslint-disable-next-line no-unused-vars
export function motorFuer(url, cookieHeader, konstante = EINWILLIGUNG_MOTOR) {
  return {motor: MOTOREN.includes(konstante) ? konstante : 'eigen', setzeCookie: ''};
}

/** Hauptnummer einer Fassung: '1.0' -> 1, '2.3' -> 2, Unlesbares -> 0. */
export function hauptnummer(fassung) {
  const n = parseInt(String(fassung || '').split('.')[0], 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Liest das CookieConsent-Cookie (Cookiebot-Format oder eigenes mit qbv).
 * -> null (keins oder unlesbar) oder
 *    {preferences, statistics, marketing, utc, qbv, stamp}
 */
export function leseEinwilligung(rohwert) {
  if (!rohwert) return null;
  let s = String(rohwert);
  try {
    s = decodeURIComponent(s);
  } catch {
    // Rohwert weiter benutzen
  }
  if (s === '-1') return null;
  const bool = (k) => {
    const m = s.match(new RegExp('(?:^|[,{])\\s*' + k + '\\s*:\\s*(true|false)'));
    return m ? m[1] === 'true' : null;
  };
  const text = (k) => {
    const m = s.match(new RegExp('(?:^|[,{])\\s*' + k + "\\s*:\\s*'([^']*)'"));
    return m ? m[1] : '';
  };
  const utcM = s.match(/(?:^|[,{])\s*utc\s*:\s*(\d+)/);
  const marketing = bool('marketing');
  if (marketing === null || !utcM) return null;
  return {
    preferences: Boolean(bool('preferences')),
    statistics: Boolean(bool('statistics')),
    marketing,
    utc: Number(utcM[1]),
    qbv: text('qbv'),
    stamp: text('stamp'),
  };
}

/**
 * Gilt eine gespeicherte Wahl noch (BAUVERTRAG Abschnitt 2)?
 * Ungültig: kein Cookie, älter als 12 Monate, oder Hauptnummer der Fassung
 * kleiner als die aktuelle. Ein Cookiebot-Cookie ohne qbv zählt als Hauptnummer 1.
 */
export function wahlGilt(einwilligung, fassung, jetzt = Date.now()) {
  if (!einwilligung) return false;
  if (!(einwilligung.utc > 0) || jetzt - einwilligung.utc > EINWILLIGUNG_LAUFZEIT_MS) {
    return false;
  }
  const imCookie = einwilligung.qbv ? hauptnummer(einwilligung.qbv) : 1;
  return imCookie >= hauptnummer(fassung);
}

/** Sprache des Hinweises: 'en' unter /en, sonst 'de'. */
export function spracheFuer(pfad) {
  return /^\/en(\/|$)/.test(String(pfad || '')) ? 'en' : 'de';
}

export function cookieAusHeader(cookieHeader) {
  return cookieWert(cookieHeader, 'CookieConsent');
}
