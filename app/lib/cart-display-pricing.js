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

export function taxRateForHandle(handle) {
  return CACAO_HANDLES.has(handle ?? '') ? 0.07 : 0.19;
}

export function getCartLineTaxRate(line) {
  return taxRateForHandle(getProductHandle(line));
}

export function getCartLinePriceDisplay(line) {
  return {
    price: {
      amount: String(getCartLineGrossDisplayTotal(line)),
      currencyCode: getCurrencyCode(line),
    },
    taxRate: 0,
  };
}

/**
 * DER UNGERUNDETE BRUTTO-ZEILENBETRAG — die EINZIGE Stelle, an der in dieser
 * Datei gerechnet wird. Beide oeffentlichen Funktionen unten runden nur noch;
 * keine von ihnen rechnet ein zweites Mal.
 *
 * WARUM DAS AM 2026-09-09 AUSEINANDERGEZOGEN WURDE (Christian, an
 * crystal-cacao.com): „In der Ansicht steht ja schon korrekt 76 EUR, aber dann
 * im Warenkorb stimmt es leider nicht." Der Warenkorb dieses Ladens zeigte
 * 71,03 EUR — den NETTO-Betrag aus der Storefront-API. Diese Datei lag dabei
 * unveraendert im Repo und war fehlerfrei; sie hatte nur KEINEN Aufrufer
 * (CartLineItem und CartSummary rendern in dieser Fassung des Ladens die rohen
 * API-Betraege). Der Aufruf ist jetzt da, und zwar cent-genau:
 *
 * WARUM CENT UND NICHT GANZE EURO: der Warenkorb dieses Ladens ist per Bauform
 * cent-genau (siehe Kopf von app/components/Preis.jsx: „hier MIT [Cent], weil
 * ein Warenkorb centgenau ist"), und die Kasse ist die einzige Flaeche, die
 * wir nicht aendern koennen — sie belastet den Cent-Betrag. Gemessen am
 * 2026-09-09 fuer Awake, Menge 3: Netto-Zeilensumme 149,19 EUR, Kasse
 * 149,19 + 10,44 MwSt = 159,63 EUR. `Math.round` haette 160 angezeigt.
 *
 * WARUM DIE STEUER UEBERHAUPT HIER GERECHNET WIRD und nicht von Shopify kommt:
 * die Cart-API liefert sie nicht, solange keine Bestellung entsteht. Gemessen
 * am 2026-09-09 gegen qi-blanco.myshopify.com, beide Male EUR:
 *   ohne Adresse         -> totalTaxAmount: null, totalAmount == subtotal
 *   mit DE-Lieferadresse -> totalTaxAmount: null, totalAmount == subtotal
 * Der Satz muss deshalb von uns kommen. Genau das tut diese Datei seit jeher.
 *
 * @param {object} line Cart-Zeile
 * @returns {number} Brutto, UNGERUNDET (EUR) bzw. Endbetrag (andere Waehrung)
 */
function bruttoZeileRoh(line) {
  // M3: Nicht-EUR-Maerkte (Shopify Markets, CHF/USD/GBP): der Cart-Betrag
  // IST der Endbetrag (belegt: Cart-API == @inContext, keine Steuer-Zeile)
  // — keine deutsche MwSt aufschlagen.
  const net = parseFloat(line?.cost?.totalAmount?.amount ?? '0');
  if (!Number.isFinite(net)) return 0;

  if (getCurrencyCode(line) !== 'EUR') {
    return net;
  }

  if (SALE_CACAO_HANDLES.has(getProductHandle(line))) {
    return SALE_CACAO_UNIT_GROSS_PRICE * getLineQuantity(line);
  }

  return net * (1 + getCartLineTaxRate(line));
}

/**
 * Cent-genauer Brutto-Zeilenbetrag — der Betrag, den die Kasse belastet.
 * @param {object} line
 * @returns {number}
 */
export function getCartLineGrossDisplayTotalExact(line) {
  return Math.round(bruttoZeileRoh(line) * 100) / 100;
}

/**
 * Cent-genaue Preis-Anzeige einer Cart-Zeile (Aufrufform wie
 * getCartLinePriceDisplay, nur ohne die Ganz-Euro-Rundung).
 * @param {object} line
 */
export function getCartLinePriceDisplayExact(line) {
  return {
    price: {
      amount: getCartLineGrossDisplayTotalExact(line).toFixed(2),
      currencyCode: getCurrencyCode(line),
    },
    taxRate: 0,
  };
}

/**
 * BESTAND, unveraendert im Verhalten: Brutto-Zeilenbetrag auf ganze Euro
 * gerundet (Warenkorb-Kanon von qiblanco.com). Rundet nur — gerechnet wird
 * ausschliesslich in bruttoZeileRoh(), damit die beiden Fassungen nicht
 * auseinanderlaufen koennen. Bewusst NICHT ueber die Cent-Fassung gefuehrt:
 * zweimal zu runden verschoebe das Ergebnis im Band [x,495 .. x,50) um einen
 * ganzen Euro gegenueber dem Bestand.
 * @param {object} line
 * @returns {number}
 */
export function getCartLineGrossDisplayTotal(line) {
  return Math.round(bruttoZeileRoh(line));
}
