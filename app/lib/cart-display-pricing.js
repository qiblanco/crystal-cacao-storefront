const SALE_CACAO_HANDLES = new Set(['37cr378n', 'aw783hfn', 'awcr37shyj']);
const CACAO_HANDLES = new Set([
  ...SALE_CACAO_HANDLES,
  'crystal-cacao-awake',
  'crystal-cacao-create',
]);

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
