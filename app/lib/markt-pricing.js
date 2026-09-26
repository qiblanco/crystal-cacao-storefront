/**
 * MARKT-PREIS-KANON — die EINE Stelle, die aus einem Storefront-API-Preis
 * (Betrag + Waehrung) den Anzeigewert und das Anzeigeformat macht.
 * (Auftrag 20260718-lp-preise-dynamisch-binden-gestuft; Deep-Dive Preis-Job
 * 20260718-preis-konsistenz-fix-und-preis-monitor.)
 *
 * Belegte Markt-Mechanik (Cart-API-Gegenproben 2026-07-18):
 * - EUR-Maerkte (DE/AT): Shopify speichert NETTO (`taxes_included=false`);
 *   der Warenkorb-Kanon (cart-display-pricing) zeigt round(netto*(1+satz)),
 *   satz 19 % bzw. 7 % (Kakao). Steuer kommt im Checkout obendrauf.
 * - Alle anderen Waehrungen (CHF/USD/GBP, Shopify Markets): der Markets-
 *   Preis IST der Endbetrag — Cart-Zeile == @inContext-Preis, keine
 *   Steuer-Zeile (CH 1.048 CHF belegt; inkl. Wechselkursaufschlag 1,5 %
 *   + Aufrundung bei Auto-FX-Preisen bzw. manuell fixierter Marktpreis).
 */
// RELATIV statt über den '~'-Alias (2026-08-15): der Alias wird nur von
// Vite aufgeloest, nicht von Node. Solange dieser Import hier stand, war
// jede reine Datenfabrik, die den Preis-Kanon benutzt, mit `node --test`
// nicht mehr pruefbar — und genau das ist die Eigenschaft, wegen der es
// diese Dateien gibt (siehe Kopf von produkt-seo.js). Vite loest den
// relativen Pfad identisch auf; cart-display-pricing importiert selbst
// nichts, die Kette ist damit vollstaendig node-aufloesbar.
import {taxRateForHandle} from './cart-display-pricing.js';
import {istBrutto} from './preismodus.js';

/**
 * Anzeige-Steuersatz eines Produkts im Markt-Kontext.
 *
 * ZWEI ACHSEN, NICHT EINE (Job 20260913-at-paketkarte-rechnet-19-prozent-
 * kasse-nimmt-20-prio8). Die WAEHRUNG entscheidet, OB hier ueberhaupt Steuer
 * aufzuschlagen ist: in CHF/USD/GBP ist der Markets-Preis schon der Endbetrag.
 * Das LAND entscheidet, WELCHER Satz das ist -- und zwei EUR-Laender haben
 * verschiedene. Bis zum 2026-09-13 stand hier nur die erste Achse, und
 * Oesterreich bekam deshalb den deutschen Satz: die Karte nannte 6.756 EUR,
 * die Kasse verlangte 6.814,24 EUR.
 *
 * @param {string} handle Produkt-Handle
 * @param {string} [currencyCode] Waehrung des API-Preises (Default EUR)
 * @param {string} [land] ISO-Land des aufgeloesten Marktes (Default DE)
 * @returns {number} AUFZUSCHLAGENDER Satz: der des Landes für EUR im Preismodus
 *   netto, 0 sonst (Nicht-EUR oder Preismodus brutto: Betrag ist Endbetrag)
 */
export function anzeigeSatz(handle, currencyCode, land) {
  if ((currencyCode || 'EUR') !== 'EUR') return 0;
  // DRITTE ACHSE, der PREISMODUS (Grossjob 20260924-kasse-zeigt-brutto-
  // preise-wie-produktseite-prio10, s02): steht der Shop auf brutto, ist auch
  // der EUR-Preis schon der Endbetrag -- in DE ohnehin, in AT über Shopifys
  // "Dynamisch" (Heimatsatz heraus, Landessatz drauf). Aufschlagen hieße dann
  // doppelte Steuer. Der ENTHALTENE Satz bleibt über taxRateForHandle lesbar.
  if (istBrutto()) return 0;
  return taxRateForHandle(handle, land);
}

/**
 * Brutto-Anzeigewert eines API-Preises (Warenkorb-Kanon: Math.round).
 * @param {string|number} amount API-Betrag (Netto bei EUR, Endbetrag sonst)
 * @param {string} handle Produkt-Handle (Steuersatz-Zuordnung)
 * @param {string} [currencyCode]
 * @param {string} [land] ISO-Land des aufgeloesten Marktes (Default DE)
 * @returns {number|null} gerundeter Anzeigewert oder null (Betrag fehlt)
 */
export function bruttoAnzeige(amount, handle, currencyCode, land) {
  const zahl = Number.parseFloat(amount);
  if (!Number.isFinite(zahl)) return null;
  return Math.round(zahl * (1 + anzeigeSatz(handle, currencyCode, land)));
}

/**
 * Anzeigeformat je Waehrung. Stile:
 * - 'lp'        (Campaign-/Paket-Karten): "7.345 €" · "1.048 CHF" · "$1,383"
 * - 'pdp'       (ProductPrice-Kanon):    "1.087,- €" · "1.048,- CHF" · "$1,383"
 * - 'cart-cent' (Warenkorb, cent-genau, aiceo:digest54:p3): "76,00 €" ·
 *   "159,63 €" — NUR für bereits cent-genaue Werte aus
 *   cart-display-pricing.js (getCartLine*Exact); kein zweites Runden hier.
 * @param {number|null} wert gerundeter Anzeigewert (bzw. cent-genau bei 'cart-cent')
 * @param {string} [currencyCode]
 * @param {'lp'|'pdp'|'cart-cent'} [stil]
 * @returns {string|null}
 */
export function formatPreis(wert, currencyCode = 'EUR', stil = 'lp') {
  if (wert == null || !Number.isFinite(Number(wert))) return null;
  const n = Number(wert);
  const digits = stil === 'cart-cent' ? 2 : 0;
  if (currencyCode === 'USD') {
    return `$${n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  const de = n.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const symbol = currencyCode === 'EUR' ? '€' : currencyCode;
  if (stil === 'cart-cent') return `${de} ${symbol}`;
  return stil === 'pdp' ? `${de},- ${symbol}` : `${de} ${symbol}`;
}

/* ───────── M3: Markt-Dynamik (Geo -> Markt-Kontext) ─────────
   FLIP-SCHALTER der Geo-Dynamik: NUR hier gelistete Laender bekommen ihren
   Shopify-Markets-Kontext ueber die Geo-Erkennung (Oxygen-Header
   `oxygen-buyer-country`). LEERE Liste = dunkel (DE-Pin, Status quo).
   Stufen-Flips sind bewusst eigene gegatete 1-Zeilen-Deploys mit eigenem
   Rollback-SHA: Stufe CH: ['AT','CH'] -> Stufe US: ['AT','CH','US'].
   Der explizite Preview-Parameter `?markt=XX` funktioniert UNABHAENGIG vom
   Flip (QA/Verify-Werkzeug: gezielter Blick auf einen Markt-Kontext). */
export const FREIGESCHALTETE_MAERKTE = ['AT', 'CH', 'US'];

// Maerkte, die der Shop anbietet (Shopify Markets, localization-API belegt
// 2026-07-18): DE Default · AT EUR · CH/LI CHF · US USD · GB GBP.
const MARKT_LAENDER = new Set(['DE', 'AT', 'CH', 'LI', 'US', 'GB']);

/**
 * Markt-Land eines Requests: ?markt-Preview > Geo (nur freigeschaltet) > DE.
 * FAIL-CLOSED: alles Unbekannte/Abgeschaltete rendert den DE-Default.
 * @param {Request} request
 * @returns {string} ISO-Laendercode
 */
export function resolveCountry(request) {
  try {
    const override = (
      new URL(request.url).searchParams.get('markt') || ''
    ).toUpperCase();
    if (override && MARKT_LAENDER.has(override)) return override;
    const geo = (
      request.headers.get('oxygen-buyer-country') || ''
    ).toUpperCase();
    if (geo && MARKT_LAENDER.has(geo) && FREIGESCHALTETE_MAERKTE.includes(geo)) {
      return geo;
    }
  } catch {
    // fail-closed: DE-Default
  }
  return 'DE';
}
