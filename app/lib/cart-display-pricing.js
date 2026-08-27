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

export function getCartLineGrossDisplayTotal(line) {
  // M3: Nicht-EUR-Maerkte (Shopify Markets, CHF/USD/GBP): der Cart-Betrag
  // IST der Endbetrag (belegt: Cart-API == @inContext, keine Steuer-Zeile)
  // — keine deutsche MwSt aufschlagen, nur Warenkorb-Kanon-Rundung.
  const net = parseFloat(line?.cost?.totalAmount?.amount ?? '0');
  if (!Number.isFinite(net)) return 0;

  if (getCurrencyCode(line) !== 'EUR') {
    return Math.round(net);
  }

  if (SALE_CACAO_HANDLES.has(getProductHandle(line))) {
    return SALE_CACAO_UNIT_GROSS_PRICE * getLineQuantity(line);
  }

  return Math.round(net * (1 + getCartLineTaxRate(line)));
}
