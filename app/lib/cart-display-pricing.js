import {istBrutto} from './preismodus.js';

const SALE_CACAO_HANDLES = new Set(['37cr378n', 'aw783hfn', 'awcr37shyj']);
// Lebensmittel-Satz statt Regelsatz. Alle Cacao-Produkte liegen in der
// Shopify-Collection Zeremonie Kakao (524038045964), die den 7%-Override
// trägt; taxable/tax_code/product_type sind identisch, die Collection ist
// das einzige steuerlich differenzierende Merkmal. Belegt an realen
// Bestellungen: SKU 6666/6668 mit rate 0.07 DE MwSt (41 Positionen).
// Job 20260729-cacao-mwst-anzeige-sku6667-klaerung.
// ACHTUNG beim Ändern dieses Blocks: preiswatch (homepage-bauer) parst die
// Handles aus dem Dateikopf bis zur ersten Funktionsdefinition und nimmt dort
// jede in Anführungszeichen gesetzte Kleinbuchstaben-Folge als Handle. Zwei
// Fallen, beide hier real ausgelöst und gemessen: ein zitiertes Wort in einem
// Kommentar wird zum Phantom-Handle, und das Schlüsselwort der Funktions-
// definition im Klartext schneidet den Kopf vorzeitig ab — dann verliert die
// SSoT alle Handles darunter und fällt still auf den Regelsatz zurück.
// Deshalb: in diesen Kommentaren keine Anführungszeichen und kein Klartext-
// Schlüsselwort. Gegenprobe nach jeder Änderung: mess/naht_preiswatch.py.
// Vollständigkeit gegen die Collection gemessen, nicht gegen den Namen: der
// erste Anlauf suchte Produkte per Substring cacao im Handle und übersah
// dabei die Bundle-Produkte — dieselbe Ware unter anderem Namen. Träger des
// Steuer-Overrides ist die Collection, also ist die Collection die
// Grundgesamtheit. Sie hat 12 Mitglieder; die hier gelisteten sind alle
// davon bis auf das Test-Duplikat (siehe unten).
// Wirkung der Bundle-Zeilen: sie zeigten 136 statt 122 bzw. 177 statt 159 —
// dieselbe Menge Kakao war über den Größenwähler 14 bzw. 18 Euro billiger
// als über das Bundle-Produkt (gemeldet als Digest-Punkt 8).
const CACAO_HANDLES = new Set([
  ...SALE_CACAO_HANDLES,
  'crystal-cacao-awake',
  'crystal-cacao-create',
  'crystal-cacao-adfiefiale',
  'crystal-cacao-angebot',
  'mengenrabatt-2x',
  'mengenrabatt-3x-create',
  'bundle-2x-awake',
  'bundle-3x-awake',
]);
// BEWUSST NICHT aufgenommen: das zwölfte Collection-Mitglied
// test-page-crystal-cacao(R)-create-spater-wieder-loschen ist ein aktives
// Test-Duplikat von -create (gleiche SKU 6666), das gelöscht gehört; sein
// Handle enthält ein Sonderzeichen, das hier nur die Encoding-Gates reizt.
// Das ist eine dokumentierte Entscheidung, kein Übersehen — als Shop-Hygiene
// gemeldet. Verschwindet das Produkt, verschwindet der Fall mit ihm.

const SALE_CACAO_UNIT_GROSS_PRICE = 76;

function getProductHandle(line) {
  return line?.merchandise?.product?.handle ?? '';
}

function getLineQuantity(line) {
  const quantity = Number(line?.quantity ?? 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getCurrencyCode(line) {
  return line?.cost?.totalAmount?.currencyCode ?? 'EUR';
}

/**
 * STEUERSATZ JE MARKT-LAND UND STEUERKLASSE -- GEMESSEN, NICHT ANGENOMMEN.
 *
 * WARUM ES DIESE TABELLE GIBT (Job 20260913-at-paketkarte-rechnet-19-prozent-
 * kasse-nimmt-20-prio8). Bis zum 2026-09-13 kannte dieser Kanon nur die
 * Steuerklasse und entschied den Satz allein an der WAEHRUNG: EUR -> 19 %
 * bzw. 7 %, alles andere 0. Oesterreich ist ein EUR-Markt und bekam damit den
 * deutschen Satz -- die Kasse belastet dort aber den oesterreichischen.
 *
 * DIE WAEHRUNG IST NICHT DER MARKT. Das war die Wurzel: zwei Laender teilen
 * eine Waehrung und haben verschiedene Saetze, also kann die Waehrung den Satz
 * nicht tragen. Gemessen am Kundenrand (Kassenseite `totalTaxAmount` gegen die
 * Netto-Zwischensumme, je Fall zwei Zeugen, 2026-09-13):
 *
 *     DE  qione-2-pro          netto  913,45  Steuer 173,56  -> 19,000 %
 *     DE  crystal-cacao-awake  netto   71,03  Steuer   4,97  ->  6,997 % (7 %)
 *     AT  qione-2-pro          netto  913,45  Steuer 182,69  -> 20,000 %
 *     AT  crystal-cacao-awake  netto   71,03  Steuer   7,10  ->  9,996 % (10 %)
 *
 * Also BEIDE Klassen unterscheiden sich, nicht nur der Regelsatz -- ein Fix,
 * der nur 19 auf 20 gehoben haette, wäre beim Kakao falsch geblieben.
 * Was der Kunde vorher zahlte, aendert sich durch diese Tabelle NICHT: die
 * Kasse verlangte in AT schon immer 20 bzw. 10 %. Korrigiert wird allein die
 * ANZEIGE, die zu wenig nannte (Paketkarte: 58,24 bis 146,22 EUR je Paket).
 *
 * WARUM EINE TABELLE UND NICHT GELESEN: der naheliegende Weg wäre, Shopify
 * nach dem Betrag zu fragen. Gemessen am 2026-09-13 gibt die Storefront-API
 * ihn nicht her -- `cart.cost.totalTaxAmount` kam in allen vier gemessenen
 * Faellen als `null` zurück (Beleg: mess/satz_de_at.json im Jobordner).
 * Der Satz ist an dieser Schnittstelle nicht lesbar, also muss er hier stehen.
 *
 * WARUM SIE HIER UNTEN STEHT UND NICHT IM DATEIKOPF: der Preis-Waechter
 * (homepage-bauer/src/preiswatch.py, kanon_saetze) liest die Kakao-Handles aus
 * allem, was VOR dem ersten Vorkommen des Wortes function steht, und nimmt
 * dort jede zitierte Kleinbuchstaben-Folge als Handle. Eine Tabelle im Kopf
 * haette Phantom-Handles erzeugt. Derselbe Waechter liest die Saetze aus
 * GENAU dieser Tabelle -- wer sie umbenennt, zieht `kanon_saetze` im selben
 * Commit nach, sonst faellt der Waechter still auf seine Konfig-Vorgabe
 * zurück und misst AT wieder mit 19 %.
 *
 * DIE GRENZE, DIE BLEIBT: der Steuersatz hängt an der LIEFERADRESSE, und die
 * kennt niemand, bevor der Kunde sie eingibt. Diese Tabelle nennt den Satz des
 * aufgeloesten MARKTES -- die beste verfuegbare Schaetzung, nicht die Wahrheit
 * der Bestellung. Wer aus DE nach AT liefert, sieht weiter 19 % und zahlt
 * 20 %; das ist am Anzeigezeitpunkt baulich nicht behebbar und deshalb hier
 * benannt statt verschwiegen.
 */
const SATZ_JE_LAND = {
  DE: {regel: 0.19, ermaessigt: 0.07},
  AT: {regel: 0.2, ermaessigt: 0.1},
};

/** Markt-Land, das gilt, wenn keines durchgereicht wurde (fail-closed: Status quo). */
export const STEUER_LAND_DEFAULT = 'DE';

/** Laender, für die ein Satz GEMESSEN vorliegt. */
export const STEUER_LAENDER = Object.keys(SATZ_JE_LAND);

/**
 * Anzeige-Steuersatz eines Produkts im Markt-Land.
 *
 * FAIL-CLOSED auf DE: ein unbekanntes oder fehlendes Land bekommt den
 * deutschen Satz -- also den Zustand, der vor dieser Aenderung galt. Das ist
 * bewusst kein Fehler, sondern die Vorgabe; ein fehlendes Land darf keine
 * leere Preisanzeige erzeugen. Dass jede Anzeige ihr Land wirklich mitgibt,
 * prueft `pruefungen/probe_steuersatz_hat_markt.py` am Quelltext -- eine
 * Vorgabe, die niemand ueberschreibt, ist von einem Defekt nicht zu
 * unterscheiden.
 *
 * @param {string} handle Produkt-Handle (entscheidet die Steuerklasse)
 * @param {string} [land] ISO-Land des aufgeloesten Marktes (Default DE)
 * @returns {number} Steuersatz als Dezimalzahl
 */
export function taxRateForHandle(handle, land) {
  const tabelle =
    SATZ_JE_LAND[String(land || '').toUpperCase()] ||
    SATZ_JE_LAND[STEUER_LAND_DEFAULT];
  return CACAO_HANDLES.has(handle ?? '') ? tabelle.ermaessigt : tabelle.regel;
}

export function getCartLineTaxRate(line, land) {
  return taxRateForHandle(getProductHandle(line), land);
}

export function getCartLinePriceDisplay(line, land) {
  return {
    price: {
      amount: String(getCartLineGrossDisplayTotal(line, land)),
      currencyCode: getCurrencyCode(line),
    },
    taxRate: 0,
  };
}

/**
 * DER UNGERUNDETE BRUTTO-ZEILENBETRAG — die EINZIGE Stelle, an der in dieser
 * Datei gerechnet wird. Alle öffentlichen Funktionen unten runden nur noch;
 * keine von ihnen rechnet ein zweites Mal. Uebernommen 2026-09-10 (Job
 * 20260910-VOLLZUG-cent-anzeige-warenkorb-beide-laeden) aus
 * crystal-cacao-node/repo/app/lib/cart-display-pricing.js (dort seit
 * 2026-09-09 Rot-vor-Gruen belegt) — bewusst Bestand uebernommen statt
 * ein zweites Mal hergeleitet, siehe RESULT.md §2 jenes Jobs.
 * @param {object} line Cart-Zeile
 * @param {string} [land] Markt-Land (entscheidet den Steuersatz, s. SATZ_JE_LAND)
 * @returns {number} Brutto, UNGERUNDET (EUR) bzw. Endbetrag (andere Waehrung)
 */
function bruttoZeileRoh(line, land) {
  // M3: Nicht-EUR-Maerkte (Shopify Markets, CHF/USD/GBP): der Cart-Betrag
  // IST der Endbetrag (belegt: Cart-API == @inContext, keine Steuer-Zeile)
  // — keine deutsche MwSt aufschlagen.
  const net = parseFloat(line?.cost?.totalAmount?.amount ?? '0');
  if (!Number.isFinite(net)) return 0;

  if (getCurrencyCode(line) !== 'EUR') {
    return net;
  }

  // PREISMODUS brutto (Grossjob 20260924-kasse-zeigt-bruttopreise-wie-
  // produktseite-prio10, s02): der Zeilenbetrag IST der Kassenbetrag, auch für
  // den Sale-Kakao -- die Kasse belastet, was Shopify liefert, nicht die
  // Konstante darunter. Kein Aufschlag, kein Ersatzwert.
  if (istBrutto()) {
    return net;
  }

  if (SALE_CACAO_HANDLES.has(getProductHandle(line))) {
    return SALE_CACAO_UNIT_GROSS_PRICE * getLineQuantity(line);
  }

  return net * (1 + getCartLineTaxRate(line, land));
}

/**
 * Cent-genauer Brutto-Zeilenbetrag — der Betrag, den die Kasse belastet.
 * @param {object} line
 * @param {string} [land] Markt-Land
 * @returns {number}
 */
export function getCartLineGrossDisplayTotalExact(line, land) {
  return Math.round(bruttoZeileRoh(line, land) * 100) / 100;
}

/**
 * Cent-genaue Preis-Anzeige einer Cart-Zeile (Aufrufform wie
 * getCartLinePriceDisplay, nur ohne die Ganz-Euro-Rundung).
 * @param {object} line
 * @param {string} [land] Markt-Land
 */
export function getCartLinePriceDisplayExact(line, land) {
  return {
    price: {
      amount: getCartLineGrossDisplayTotalExact(line, land).toFixed(2),
      currencyCode: getCurrencyCode(line),
    },
    taxRate: 0,
  };
}

/**
 * BESTAND, unveraendert im Verhalten: Brutto-Zeilenbetrag auf ganze Euro
 * gerundet. Rundet nur — gerechnet wird ausschließlich in bruttoZeileRoh(),
 * damit die beiden Fassungen nicht auseinanderlaufen können.
 * @param {object} line
 * @param {string} [land] Markt-Land
 * @returns {number}
 */
export function getCartLineGrossDisplayTotal(line, land) {
  return Math.round(bruttoZeileRoh(line, land));
}
