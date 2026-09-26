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
