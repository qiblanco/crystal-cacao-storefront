/**
 * Preis — die EINE Geldanzeige dieses Ladens.
 *
 * ANLASS, 2026-09-08, Christian: „Das Zahlenformat ist englisch. `€71.03`
 * gehoert auf einer deutschen Seite als `71,03 €` geschrieben — Komma als
 * Dezimaltrennzeichen, Waehrungszeichen hinten. Pruefe das ueberall, nicht nur
 * hier."
 *
 * WOHER DAS ENGLISCH KAM — gemessen, nicht vermutet: `<Money>` aus
 * @shopify/hydrogen ruft `useMoney()`, und das baut sein Gebietsschema aus
 * `useShop()`, also aus einem `<ShopifyProvider>`. Dieser Laden setzt seine
 * Sprache in `app/lib/context.js` (`i18n: {language: 'DE', country}`) — der
 * Storefront-Client kennt sie damit, `useShop()` aber nicht; ohne Provider
 * faellt `useMoney` auf `en-us` zurueck. Ergebnis:
 *   Intl.NumberFormat('en-us', …).format(71.03)  ->  "€71.03"
 *   Intl.NumberFormat('de-DE', …).format(71.03)  ->  "71,03 €"
 * Beide Zeilen sind auf diesem Rechner nachgefahren; der Unterschied ist
 * ausschliesslich das Gebietsschema.
 *
 * WARUM NICHT EINFACH DER PROVIDER: `<ShopifyProvider>` fuehrt nicht nur das
 * Gebietsschema, sondern auch Shop-Domain, API-Version und den Analytik-Pfad
 * mit. Ihn nachtraeglich ueber einen Baum zu legen, in dem `Analytics.Provider`
 * bereits sitzt, aendert mehr als die Schreibweise einer Zahl — und die
 * Zahl ist das, was beanstandet wurde. Diese Datei tut GENAU das und sonst
 * nichts.
 *
 * DAS GEBIETSSCHEMA FOLGT DER WAEHRUNG, nicht dem Browser: der Laden fuehrt
 * DE/AT (EUR), CH (CHF), US (USD), GB (GBP) ueber Shopify Markets, und der
 * Waehrungscode kommt in jedem Betrag mit. `navigator.language` waere hier
 * falsch — ein deutschsprachiger Besucher mit US-Adresse soll `$69` sehen,
 * nicht `69,00 $`. Dieselbe Zuordnung faehrt der Preis-Kanon
 * app/lib/markt-pricing.js seit dem 2026-07-18 (dort ohne Nachkommastellen,
 * weil er PAKETPREISE zeigt; hier MIT, weil ein Warenkorb centgenau ist).
 */

const LOCALE_JE_WAEHRUNG = Object.freeze({
  EUR: 'de-DE',
  CHF: 'de-CH',
  USD: 'en-US',
  GBP: 'en-GB',
});

/**
 * @param {string|number} betrag
 * @param {string} [waehrung] ISO-4217-Code aus der Storefront-API
 * @returns {string|null} null, wenn kein Betrag da ist — nie "0" und nie "NaN"
 */
export function formatGeld(betrag, waehrung) {
  const zahl = Number.parseFloat(betrag);
  if (!Number.isFinite(zahl)) return null;
  const code = waehrung || 'EUR';
  const locale = LOCALE_JE_WAEHRUNG[code] || 'de-DE';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(zahl);
  } catch {
    // FAIL-SOFT: eine Waehrung, die Intl nicht kennt, darf die Seite nicht
    // kosten — dann eben Zahl und Code, aber in deutscher Schreibweise.
    return `${zahl.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${code}`;
  }
}

/**
 * Ersatz fuer `<Money data={…} />` — gleiche Aufrufform, damit die
 * Austauschstellen eins zu eins bleiben und keine Stelle uebersehen wird.
 *
 * @param {{data?: {amount?: string, currencyCode?: string} | null, className?: string}} props
 */
export function Preis({data, className}) {
  const text = formatGeld(data?.amount, data?.currencyCode);
  if (text == null) return null;
  return <span className={className}>{text}</span>;
}
