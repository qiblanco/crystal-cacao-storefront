import {parseGid} from '@shopify/hydrogen';

/**
 * Numerische Shopify-Produkt-ID aus einer GID.
 *
 * Gespiegelt aus app/components/MetaPixel.jsx (dort lokal `numericProductId`,
 * nicht exportiert) — hier als geteilter, testbarer Kern fuer den
 * InitiateCheckout-content_ids-Fix (Job 20260723). Bewusste Duplizierung:
 * MetaPixel.jsx anzufassen wuerde ViewContent/AddToCart beruehren (Regression);
 * die Semantik ist identisch: parseGid('gid://shopify/Product/123').id === '123',
 * Junk/leer -> '' -> undefined.
 *
 * @param {string|undefined|null} gid
 * @returns {string|undefined}
 */
export function numericProductId(gid) {
  try {
    return parseGid(gid).id || undefined;
  } catch {
    return undefined;
  }
}

/**
 * content_ids fuer das Meta-Pixel InitiateCheckout: die numerischen
 * Produkt-IDs aller Cart-Lines. Exakt dasselbe Idiom wie ViewContent/AddToCart
 * in MetaPixel.jsx (`[numericProductId(gid)].filter(Boolean)`), nur ueber den
 * ganzen Cart statt ein einzelnes Produkt.
 *
 * @param {Array<{merchandise?: {product?: {id?: string}}}>|undefined|null} lines
 *   cart.lines.nodes
 * @returns {string[]}
 */
export function cartLineContentIds(lines) {
  return (lines ?? [])
    .map((line) => numericProductId(line?.merchandise?.product?.id))
    .filter(Boolean);
}

/**
 * Meta-Pixel-Payload für ViewContent aus dem Hydrogen-`product_viewed`-Event.
 *
 * Grossjob 20261011-fm-folge-attribution-nachzuege (s05): Meta da_checks
 * meldete `pixel_missing_param_in_events` für ViewContent. Live gesendet
 * wurden content_ids + content_type, `contents` fehlte immer. `contents`
 * trägt dieselbe ID wie content_ids (Katalog-Match), quantity 1 (ein
 * Produkt-View, Parität zu D-006) und den Stückpreis.
 * Bis hierher stand der Payload inline in MetaPixel.jsx; die Felder dort
 * sind unverändert übernommen.
 *
 * @param {{products?: Array<{id?: string, title?: string, price?: string}>,
 *   shop?: {currency?: string}}|undefined|null} data
 * @returns {object|null} null ohne Produkt (Aufrufer feuert dann nicht)
 */
export function viewContentPayload(data) {
  const product = data?.products?.[0];
  if (!product) return null;
  const id = numericProductId(product.id);
  const value = parseFloat(product.price) || 0;
  return {
    content_ids: [id].filter(Boolean),
    contents: id ? [{id, quantity: 1, item_price: value}] : [],
    content_name: product.title,
    content_type: 'product',
    value,
    currency: data?.shop?.currency || 'EUR',
  };
}
