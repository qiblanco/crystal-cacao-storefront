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
import {
  STEUER_LAND_DEFAULT,
  kassenSatz,
  taxRateForHandle,
} from './cart-display-pricing.js';
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
 * @returns {number} AUFZUSCHLAGENDER Satz: im Preismodus netto der gemessene
 *   Kassensatz des Landes (kassenSatz), 0 im Preismodus brutto
 */
export function anzeigeSatz(handle, currencyCode, land) {
  // SATZ-ACHSE LAND (Grossjob 20261004 preisanzeige, s03): die Währung
  // entscheidet nicht mehr,
  // OB Steuer aufkommt. CH zahlt auf den CHF-Preis 8,1 Prozent obendrauf;
  // kassenSatz() kennt die gemessenen Länder und lässt ungemessene in
  // Fremdwährung beim Endbetrag.
  // DRITTE ACHSE, der PREISMODUS (Grossjob 20260924-kasse-zeigt-brutto-
  // preise-wie-produktseite-prio10, s02): steht der Shop auf brutto, ist auch
  // der EUR-Preis schon der Endbetrag -- in DE ohnehin, in AT über Shopifys
  // "Dynamisch" (Heimatsatz heraus, Landessatz drauf). Aufschlagen hieße dann
  // doppelte Steuer. Der ENTHALTENE Satz bleibt über taxRateForHandle lesbar.
  if (istBrutto()) return 0;
  return kassenSatz(handle, currencyCode, land);
}

/**
 * Brutto-Anzeigewert eines API-Preises: der Kassenbetrag (kassenAnzeige).
 * @param {string|number} amount API-Betrag (Netto bei EUR, Endbetrag sonst)
 * @param {string} handle Produkt-Handle (Steuersatz-Zuordnung)
 * @param {string} [currencyCode]
 * @param {string} [land] ISO-Land des aufgeloesten Marktes (Default DE)
 * @returns {number|null} Anzeigewert auf den Cent oder null (Betrag fehlt)
 */
export function bruttoAnzeige(amount, handle, currencyCode, land) {
  const zahl = Number.parseFloat(amount);
  if (!Number.isFinite(zahl)) return null;
  return kassenAnzeige(
    zahl * (1 + anzeigeSatz(handle, currencyCode, land)),
    land,
  );
}

/**
 * KASSENBETRAG-ANZEIGE: aus dem Kundenbetrag die Zahl, die die Seite nennt.
 * Die Regel heißt: die Seite nennt den Betrag, den die Kasse des Landes nimmt
 * (Grossjob 20261004 preisanzeige, Konzept Abschnitt 2, Christian
 * 2026-10-04: "1 Euro mehr
 * anzeigen macht keinen Sinn").
 *
 * Gerechnet wird auf den Cent. Ist der Betrag ein ganzer Euro, zeigt die Seite
 * ihn ohne Cent ("1.087,- €"), sonst cent-genau ("78,13 €").
 *
 * Davor standen drei Fixe an derselben Frage, der Rundungsrichtung: round
 * (2026-07-18), ceil außerhalb DE (2026-09-26, AT 78,13 -> 79), ceil auch in
 * DE (2026-10-01, Sets 266,06 -> 267). Für keine Richtung ist eine
 * Ganz-Euro-Zahl eines nicht ganzen Kassenbetrags richtig: abgerundet nennt
 * die Seite weniger, aufgerundet mehr als die Kasse.
 *
 * NOTBEHELF DE, mit Verfall: DE ist das Kalibrierland, dort sind Nettopreise
 * so gesetzt, dass brutto ein ganzer Euro herauskommt. Ein Nettopreis auf den
 * Cent trifft das aber nur auf +-1 Cent (QiOne 2 Pro 913,45 x 1,19 =
 * 1087,0055, Kasse 1087,01). Liegt der DE-Betrag 1 Cent neben einem ganzen
 * Euro, nennt die Seite den ganzen Euro. Diese Toleranz endet mit dem
 * Brutto-Kipp (Job 20260924-kasse-zeigt-bruttopreise-wie-produktseite-prio10):
 * danach ist der DE-Kassenbetrag selbst ganz, und die Zeile hier kann weg.
 *
 * Für MODELLIERTE Beträge (die Kakao-Staffel rechnet einen Festbetragsrabatt
 * als Prozent nach) gilt staffelModellAnzeige(), nicht diese Funktion.
 * Die Regel hängt NICHT am Preismodus. Dieselbe Regel rechnet preiswatch nach
 * (homepage-bauer/src/preiswatch.py, anzeige_ganz_euro).
 *
 * @param {number} betrag Kundenbetrag, ungerundet
 * @param {string} [land] ISO-Land des aufgelösten Marktes (Default DE)
 * @returns {number|null} Anzeigewert auf den Cent
 */
export function kassenAnzeige(betrag, land) {
  const zahl = Number(betrag);
  if (!Number.isFinite(zahl)) return null;
  const l = String(land || STEUER_LAND_DEFAULT).toUpperCase();
  const cent = Math.round(zahl * 100);
  if (l === STEUER_LAND_DEFAULT) {
    const rest = ((cent % 100) + 100) % 100;
    if (rest === 1) return (cent - 1) / 100;
    if (rest === 99) return (cent + 1) / 100;
  }
  // `+ 0`: aus -0 wird 0, sonst formatiert es als "-0".
  return cent / 100 + 0;
}

/**
 * STREICHPREIS AUF DER SATZ-ACHSE DES LANDES (Job 20261006-preisanzeige-rest,
 * Punkte 3 und 6). Der Streichpreis bekommt denselben Steuerschritt wie der
 * Kaufpreis daneben, sonst ist der gezeigte Rabatt je Land verschieden.
 *
 * Gemessen 2026-10-06 (Preisanzeige-Messung, Storefront-API je Land): der
 * Vergleichspreis aus der API ist ein deutscher BRUTTOBETRAG in einem
 * Netto-Laden. DE zeigt QiOne 2 Pro 1.087,- neben 1.238,- (913,45 netto x
 * 1,19 gegen 1238 unversteuert). PL (5533 PLN) und SE (14220 SEK) rechnet
 * Shopify aus denselben 1238 um, mit demselben Kurs wie den Preis. Darum gilt
 * für einen API-Wert: heraus mit dem DE-Satz der Ware, hinein mit dem Satz
 * des Landes. DE bleibt so byte-gleich 1.238,-; AT zeigt 1.248,40 neben
 * 1.096,14, also denselben Rabatt wie DE (12,2 Prozent).
 *
 * Der Paritäts-Ersatz aus streichpreis-paritaet.js (CHF 1420, USD 1599)
 * steht dagegen auf der Basis der Preisliste, wie der Preis 1048 CHF selbst
 * (`basis: 'preisliste'`). Er bekommt nur den Satz des Landes: CH 1420 x
 * 1,081 = 1.535,02 neben 1.132,89, der Rabatt aus dem Paritäts-Konzept
 * (26,2 Prozent) wie vor dem Kassenbetrag-PR #772. US bleibt 1599.
 *
 * Im Preismodus brutto ist der API-Wert schon der Endbetrag, wie der Preis:
 * dann wird nichts gerechnet.
 *
 * @param {{amount: string|number, currencyCode?: string, basis?: string}|null} money
 * @param {string} handle Produkt-Handle (Steuerklasse)
 * @param {string} [land] ISO-Land des aufgelösten Marktes (Default DE)
 * @returns {number|null} Streichpreis auf den Cent (ganz -> ohne Cent)
 */
export function streichAnzeige(money, handle, land) {
  if (!money) return null;
  const zahl = Number.parseFloat(money.amount);
  if (!Number.isFinite(zahl)) return null;
  if (istBrutto()) return kassenAnzeige(zahl, land);
  const waehrung = money.currencyCode || 'EUR';
  const satzLand = kassenSatz(handle, waehrung, land);
  const satzHeraus =
    money.basis === 'preisliste'
      ? 0
      : taxRateForHandle(handle, STEUER_LAND_DEFAULT);
  return kassenAnzeige((zahl * (1 + satzLand)) / (1 + satzHeraus), land);
}

/**
 * Alter Name, gleiche Funktion: die Aufrufer der früheren Ganz-Euro-Regel
 * gehen ohne Änderung auf die Kassenbetrag-Regel mit.
 */
export const ganzEuroAnzeige = kassenAnzeige;

/**
 * STAFFEL-MODELL-ANZEIGE: nur für die Kakao-Staffel (CacaoProductForm,
 * cacaoPricing). Dort ist der Betrag ein Modell: der Mengenrabatt ist ein
 * Festbetrag, die Seite rechnet ihn als Prozent nach. 3 Packungen ergeben im
 * Modell 49,73 x 1,07 = 53,21, die Kasse nimmt 53,00, weil der Festbetrag in
 * DE den runden Betrag trifft. Darum bleibt DE hier kaufmännisch gerundet;
 * jedes andere Land rundet auf wie ganzEuroAnzeige().
 *
 * @param {number} betrag Modellbetrag, ungerundet
 * @param {string} [land] ISO-Land des aufgelösten Marktes (Default DE)
 * @returns {number|null} ganzer Anzeigewert
 */
export function staffelModellAnzeige(betrag, land) {
  const zahl = Number(betrag);
  if (!Number.isFinite(zahl)) return null;
  const l = String(land || STEUER_LAND_DEFAULT).toUpperCase();
  if (l === STEUER_LAND_DEFAULT) return Math.round(zahl);
  return kassenAnzeige(zahl, l);
}

/**
 * Anzeigeformat je Waehrung. Stile:
 * - 'lp'        (Campaign-/Paket-Karten): "7.345 €" · "1.048 CHF" · "$1,383"
 * - 'pdp'       (ProductPrice-Kanon):    "1.087,- €" · "1.048,- CHF" · "$1,383"
 * - 'cart-cent' (Warenkorb, cent-genau, aiceo:digest54:p3): "76,00 €" ·
 *   "159,63 €" — NUR für bereits cent-genaue Werte aus
 *   cart-display-pricing.js (getCartLine*Exact); kein zweites Runden hier.
 * @param {number|null} wert Anzeigewert auf den Cent (ganz -> ohne Nachkommastellen)
 * @param {string} [currencyCode]
 * @param {'lp'|'pdp'|'cart-cent'} [stil]
 * @returns {string|null}
 */
export function formatPreis(wert, currencyCode = 'EUR', stil = 'lp') {
  if (wert == null || !Number.isFinite(Number(wert))) return null;
  const n = Number(wert);
  // Ganz -> ohne Cent, sonst cent-genau, in jedem Stil (Kassenbetrag-Regel,
  // s03 2026-10-04): "78,13 €" · "1.132,89 CHF" · "$1,234.56".
  const ganz = Math.round(n * 100) % 100 === 0;
  const digits = stil === 'cart-cent' || !ganz ? 2 : 0;
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
  if (stil === 'cart-cent' || !ganz) return `${de} ${symbol}`;
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
// Stufe Länder (Grossjob 20261004 preisanzeige, s03, eigener Deploy mit
// eigenem Rückweg): jedes Land mit GEMESSENEM Kassensatz in SATZ_JE_LAND
// (cart-display-pricing.js) und GB. LI seit 2026-10-06 dazu (Job
// 20261006-preisanzeige-rest): Normalsatz aus LI-Bestellungen, Kakao-Satz
// aus der CH-Analogie, Beleg bei SATZ_JE_LAND. Bis dahin sahen LI-Besucher
// die DE-Seite in EUR und zahlten an der Kasse in CHF.
export const FREIGESCHALTETE_MAERKTE = [
  'AT',
  'CH',
  'LI',
  'US',
  'GB',
  'FR',
  'IT',
  'ES',
  'NL',
  'BE',
  'PT',
  'IE',
  'PL',
  'SE',
];

// Maerkte, die der Shop anbietet (Shopify Markets, localization-API belegt
// 2026-07-18): DE Default · AT EUR · CH/LI CHF · US USD · GB GBP.
// Seit 2026-10-04 auch die EU-Länder mit gemessenem Kassensatz (Markt eu:
// FR, IT, ES, NL, BE, PT, IE in EUR, PL in PLN, SE in SEK).
const MARKT_LAENDER = new Set([
  'DE',
  'AT',
  'CH',
  'LI',
  'US',
  'GB',
  'FR',
  'IT',
  'ES',
  'NL',
  'BE',
  'PT',
  'IE',
  'PL',
  'SE',
]);

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
