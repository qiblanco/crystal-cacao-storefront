/**
 * Region-aware Consent-Policy (Job 20260718-storefront-pixel-tracking-vertiefung;
 * EWR/UK-Floor: Job 20260724-consent-mode-v2-kontrolle-bauen-live-debugging).
 *
 * Christian-Direktive 2026-07-24 (Consent-Mode-v2 "jetzt", ersetzt die
 * engere DE-only-Vorgabe vom 18.07.): Google Consent Mode v2 verlangt
 * default=denied für ALLE EWR-Länder + UK — nicht nur DACH. Sobald die
 * Region-Öffnung aktiv ist (Env-Var gesetzt), erzwingt EEA_UK_STRICT_FLOOR
 * diesen gesetzlichen Mindestumfang als Union; die Env-Var kann Regionen
 * ADDIEREN, den Floor aber nicht entfernen (Lockerung = bewusste
 * Code-Änderung, kein Env-Versehen).
 *
 * FAIL-CLOSED: Ohne PUBLIC_CONSENT_STRICT_REGIONS (Oxygen-Env, Christian-Hand)
 * gilt 'consent' für ALLE Regionen = strengstes Verhalten, unveraendert.
 * Erst der Env-Flip öffnet Nicht-Floor-Regionen (z.B. US) auf 'optout'.
 *
 * Policies:
 *   'consent'  Tracking NUR nach aktiver Cookiebot-Marketing-Einwilligung.
 *   'optout'   Tracking ab Seitenaufruf; eine AKTIV erklaerte Ablehnung im
 *              Banner wird IMMER respektiert (nie gegen erklaerten Willen).
 *
 * Region-Quelle: Oxygen-Geo-Header 'oxygen-buyer-country' (Cloudflare).
 * Unbekannte/fehlende Region => 'consent' (strengste Stufe, fail-closed).
 */
import {
  hasCookiebotMarketingConsent,
  hasCookiebotMarketingDeclined,
} from '~/lib/checkout-tracking';

export const OXYGEN_COUNTRY_HEADER = 'oxygen-buyer-country';

// EWR (EU-27 + IS/LI/NO) + UK (GB) + CH (revDSG, Bestand seit 18.07.):
// nicht-entfernbarer Consent-Pflicht-Mindestumfang bei aktiver
// Region-Öffnung. GR = ISO-Code Griechenlands (nicht EL).
export const EEA_UK_STRICT_FLOOR = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR',
  'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT',
  'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
];

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {string[]} ISO-3166-1-alpha-2 Laender mit Consent-Pflicht;
 *   leeres Array = Flag nicht gesetzt = ALLE Regionen streng (fail-closed).
 *   Flag gesetzt = Union aus Env-Liste und EEA_UK_STRICT_FLOOR.
 */
export function strictRegions(env) {
  const raw = env?.PUBLIC_CONSENT_STRICT_REGIONS;
  if (!raw || typeof raw !== 'string') return [];
  const fromEnv = raw
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
  if (!fromEnv.length) return [];
  return [...new Set([...fromEnv, ...EEA_UK_STRICT_FLOOR])];
}

/**
 * @param {string | null | undefined} country ISO-2 (z.B. 'DE'), '' = unbekannt
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {'consent' | 'optout'}
 */
export function policyForCountry(country, env) {
  const strict = strictRegions(env);
  if (!strict.length) return 'consent'; // Env unset => heutiges Verhalten
  const c = (country || '').trim().toUpperCase();
  if (!c) return 'consent'; // Region unbekannt => strengste Stufe
  return strict.includes(c) ? 'consent' : 'optout';
}

/**
 * @param {Request} request
 * @returns {string} ISO-2 oder ''
 */
export function buyerCountry(request) {
  try {
    return (request.headers.get(OXYGEN_COUNTRY_HEADER) || '').toUpperCase();
  } catch {
    return '';
  }
}

/**
 * Server-seitige Tracking-Erlaubnis (Cart-Attribute/Checkout-URL-Dekoration).
 *
 * @param {Request} request
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {boolean}
 */
export function hasRegionAwareTrackingPermission(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  const policy = policyForCountry(buyerCountry(request), env);
  if (policy === 'consent') return hasCookiebotMarketingConsent(cookieHeader);
  // 'optout': erlaubt, ausser der Besucher hat AKTIV abgelehnt.
  return !hasCookiebotMarketingDeclined(cookieHeader);
}
