/**
 * WÄHRUNGS-AUSWAHL IM KOPF UND FUSS (Christian 22.11.2026, Job
 * 20261122-prio1-shop-design-header-flagge-waehrung-iphone-knoepfe-umbruch-us-glanz-bf-store):
 * „neben dem User-Portal nebendran noch die Flagge … Und dann nebendran noch
 * ein Feld, wo er die Währung aussuchen kann.“
 *
 * Reine Datenfabrik ohne React-/Vite-Import (node --test-fähig,
 * test/land-waehrung.test.mjs).
 *
 * WIE DIE WAHL WIRKT: der Shop bestimmt sein Markt-Land in
 * lib/markt-pricing.js resolveCountry (?markt > Cookie qb_land > Geo > DE).
 * Eine Währung wählen heißt hier: ihr Vertreterland als Cookie qb_land
 * merken. Damit rechnen Seite, Warenkorb (BuyerIdentityUpdate) und Kasse im
 * selben Shopify-Markt. Zusätzlich qb_markt=DE: wer im Deutsch-Shop bewusst
 * eine Währung wählt, wird von der Länder-Weiche nicht mehr weitergeschickt
 * (dieselbe Sitzungs-Ausnahme wie ?markt=DE, lib/laender-weiche.js).
 *
 * WELCHE WÄHRUNGEN: nur die, die Shopify Markets diesem Shop wirklich anbietet
 * (localization.availableCountries). Die Reihenfolge und das Vertreterland je
 * Währung stehen unten; eine Währung erscheint nur, wenn ihr Vertreterland in
 * Shopifys Liste steht und sein Kassen-Kontext das Land selbst ist.
 */

export const LAND_COOKIE = 'qb_land';
export const LAND_COOKIE_TAGE = 90;

/** Reihenfolge im Panel. */
export const WAEHRUNG_VORRANG = ['EUR', 'CHF', 'USD', 'GBP', 'THB', 'PLN', 'SEK'];

/** Vertreterland je Währung (das Land, dessen Shopify-Markt diese Währung führt). */
export const WAEHRUNG_VERTRETER = Object.freeze({
  EUR: 'DE',
  CHF: 'CH',
  USD: 'US',
  GBP: 'GB',
  THB: 'TH',
  PLN: 'PL',
  SEK: 'SE',
});

/** Rückfall ohne Shopify-Antwort: die vier Kernwährungen. */
const RUECKFALL = [
  {code: 'EUR', symbol: '€', land: 'DE'},
  {code: 'CHF', symbol: 'CHF', land: 'CH'},
  {code: 'USD', symbol: '$', land: 'US'},
  {code: 'GBP', symbol: '£', land: 'GB'},
];

/** Rückfall-Zuordnung Land -> Währung, wenn Shopify nicht antwortet. */
const LAND_WAEHRUNG_RUECKFALL = {DE: 'EUR', AT: 'EUR', CH: 'CHF', LI: 'CHF', US: 'USD', GB: 'GBP', TH: 'THB', PL: 'PLN', SE: 'SEK'};

const ISO2 = /^[A-Z]{2}$/;

/**
 * Baut die Liste für das Panel.
 * @param {null | {country?: {isoCode?: string, currency?: {isoCode?: string, symbol?: string}}, availableCountries?: Array<{isoCode: string, currency?: {isoCode?: string, symbol?: string}}>}} lokalisierung
 * @param {string} marktLand aufgelöstes Markt-Land (root-Loader marktLand)
 * @returns {{aktiv: string, liste: Array<{code: string, symbol: string, land: string, aktiv: boolean}>}}
 */
export function waehrungsListe(lokalisierung, marktLand = 'DE') {
  const land = ISO2.test(String(marktLand || '')) ? String(marktLand) : 'DE';
  const verfuegbar = new Map();
  const laender = Array.isArray(lokalisierung?.availableCountries)
    ? lokalisierung.availableCountries
    : [];
  for (const c of laender) {
    const code = c?.currency?.isoCode;
    if (!code || !c?.isoCode) continue;
    if (!verfuegbar.has(code)) {
      verfuegbar.set(code, {code, symbol: c.currency.symbol || code, laender: new Set()});
    }
    verfuegbar.get(code).laender.add(c.isoCode);
  }

  let aktiv = lokalisierung?.country?.currency?.isoCode || '';
  if (!aktiv) aktiv = LAND_WAEHRUNG_RUECKFALL[land] || 'EUR';

  let liste;
  if (verfuegbar.size === 0) {
    liste = RUECKFALL.map((w) => ({...w}));
  } else {
    liste = WAEHRUNG_VORRANG.filter((code) => {
      const v = verfuegbar.get(code);
      return v && v.laender.has(WAEHRUNG_VERTRETER[code]);
    }).map((code) => ({
      code,
      symbol: verfuegbar.get(code).symbol,
      land: WAEHRUNG_VERTRETER[code],
    }));
  }
  if (!liste.some((w) => w.code === aktiv)) {
    const symbol =
      verfuegbar.get(aktiv)?.symbol ||
      lokalisierung?.country?.currency?.symbol ||
      aktiv;
    liste.unshift({code: aktiv, symbol, land});
  }
  return {
    aktiv,
    liste: liste.map((w) => ({...w, aktiv: w.code === aktiv})),
  };
}

/**
 * Liest das gemerkte Land aus einer Cookie-Kopfzeile. Nur zwei Großbuchstaben
 * gelten; alles andere ist "keine Wahl" (leerer Text).
 * @param {string} cookieKopf
 * @returns {string}
 */
export function landAusCookie(cookieKopf) {
  const m = new RegExp(`(?:^|;\\s*)${LAND_COOKIE}=([A-Za-z]{2})(?:;|$)`).exec(
    String(cookieKopf || ''),
  );
  return m ? m[1].toUpperCase() : '';
}

/**
 * Cookie-Zeilen für document.cookie (Client). Zwei Zeilen: das Land für
 * 90 Tage, die Weichen-Ausnahme für die Sitzung.
 * @param {string} land
 * @returns {string[]}
 */
export function cookieZeilen(land, sicher = true) {
  const l = String(land || '').toUpperCase();
  if (!ISO2.test(l)) return [];
  const sek = LAND_COOKIE_TAGE * 24 * 60 * 60;
  // Secure nur über https (lokale Vorschau über http nimmt es sonst nicht an).
  const s = sicher ? '; Secure' : '';
  return [
    `${LAND_COOKIE}=${l}; Path=/; Max-Age=${sek}${s}; SameSite=Lax`,
    `qb_markt=DE; Path=/${s}; SameSite=Lax`,
  ];
}

/**
 * Ziel-Adresse ohne ?markt (der Parameter ginge sonst dem Cookie vor).
 * @param {string} href
 * @returns {string}
 */
export function zielOhneMarkt(href) {
  try {
    const u = new URL(href);
    u.searchParams.delete('markt');
    return u.pathname + (u.search || '') + (u.hash || '');
  } catch {
    return '/';
  }
}
