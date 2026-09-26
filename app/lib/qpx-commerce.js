import {numericProductId, cartLineContentIds} from './pixel-content.js';

/**
 * qpx-commerce.js — First-Party-Commerce-Events für den eigenen qpx-Receiver.
 * ===========================================================================
 * Schließt die Mid-Funnel-Messluecke (Job 20260723-commerce-microfunnel-
 * instrumentierung-messluecke, Folgejob A der Ad-Sales-Diagnose): events.db
 * kannte First-Party nur behavior/page_view/identify — NULL view_content/
 * add_to_cart/initiate_checkout. Der qpx-Receiver AKZEPTIERT diese event_names
 * laengst (config.VALID_EVENTS, event_model.normalize liest value/currency);
 * was fehlte, war das STOREFRONT-seitige Feuern.
 *
 * Architektur (P10, Bestand-vor-Neubau): Diese Events kommen aus DENSELBEN
 * Hydrogen-Analytics-Events (product_viewed/product_added_to_cart), die
 * MetaPixel.jsx bereits an das Meta-Pixel (fbq) bridged — hier nur ein ZWEITER,
 * unabhaengiger Konsument für den First-Party-Receiver. numericProductId/
 * cartLineContentIds werden aus pixel-content.js wiederverwendet (kein zweites
 * parseGid-Idiom). MetaPixel.jsx bleibt bewusst UNBERUEHRT (Regressionsschutz,
 * s. pixel-content.js-Kommentar).
 *
 * Kein neuer Identitaets-/Tracking-Key: view_content/add_to_cart/initiate_
 * checkout laufen SAME-ORIGIN an den eigenen Receiver (window.qpx), sie queren
 * KEINE Storefront->Checkout-Grenze. content_ids/content_name/content_type
 * spiegeln MetaPixel (Match-Qualitaet/forward-compat); der Receiver ignoriert
 * heute unbekannte Felder fail-soft (normalize picket nur value/currency).
 *
 * Consent: nicht hier — der qpx-Loader (qiblanco-qpx-loader.js) lädt qpx.js
 * erst nach Cookiebot-Marketing-Consent. Vor Boot puffert qpxTrack über den
 * Standard-Queue-Stub (window.qpx.q), den qpx.js beim Boot abspielt; ohne
 * Consent lädt qpx.js NIE -> der Puffer bleibt im RAM (kein Cookie, kein Netz).
 */

const CONTENT_TYPE = 'product';

/**
 * Sichere qpx-Zustellung. Tracking darf den Shop NIE brechen.
 *
 * Ist qpx.js schon geladen, ist window.qpx die echte API -> Direkt-Call.
 * Ist es das nicht (async + consent-gated), legen wir den offiziellen
 * qpx-Queue-Stub an: fruehe Aufrufe (z.B. view_content beim harten PDP-Load,
 * bevor qpx.js da ist) landen in window.qpx.q und werden beim Boot abgespielt.
 *
 * @param {string} name  event_name (view_content|add_to_cart|initiate_checkout)
 * @param {object|null|undefined} props
 */
export function qpxTrack(name, props) {
  if (typeof window === 'undefined') return;
  if (!name || !props) return;
  try {
    if (typeof window.qpx !== 'function') {
      const stub = function () {
        (stub.q = stub.q || []).push(arguments);
      };
      window.qpx = stub;
    }
    window.qpx('track', name, props);
  } catch {
    // bewusst geschluckt — ein Tracking-Fehler darf den Checkout nie blockieren.
  }
}

/**
 * Zahl aus Shopify-Money/String robust nach Number, sonst 0.
 * @param {unknown} amount
 * @returns {number}
 */
export function toValue(amount) {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

/**
 * view_content-Payload aus dem Hydrogen-`product_viewed`-Event.
 * Spiegelt MetaPixel.jsx ViewContent. Ohne Produkt -> null (Aufrufer skippt).
 *
 * @param {{products?: Array<object>, shop?: {currency?: string}}} data
 * @returns {object|null}
 */
export function buildViewContentEvent(data) {
  const product = data?.products?.[0];
  if (!product) return null;
  return {
    content_ids: [numericProductId(product.id)].filter(Boolean),
    content_name: product.title,
    content_type: CONTENT_TYPE,
    value: toValue(product.price),
    currency: data?.shop?.currency || 'EUR',
  };
}

/**
 * add_to_cart-Payload aus dem Hydrogen-`product_added_to_cart`-Event.
 * Spiegelt MetaPixel.jsx AddToCart inkl. Mengen-Delta (Hydrogen feuert das
 * Event auch bei Mengen-Erhoehung — nur das Delta zählt). Ohne Merchandise
 * -> null.
 *
 * @param {{currentLine?: object, prevLine?: object, shop?: {currency?: string}}} data
 * @returns {object|null}
 */
export function buildAddToCartEvent(data) {
  const line = data?.currentLine;
  const merchandise = line?.merchandise;
  if (!merchandise) return null;
  const unitPrice = toValue(merchandise.price?.amount);
  const quantity = Math.max(
    (line.quantity || 1) - (data?.prevLine?.quantity || 0),
    1,
  );
  return {
    content_ids: [numericProductId(merchandise.product?.id)].filter(Boolean),
    content_name: merchandise.product?.title,
    content_type: CONTENT_TYPE,
    value: unitPrice * quantity,
    currency: merchandise.price?.currencyCode || data?.shop?.currency || 'EUR',
    num_items: quantity,
  };
}

/**
 * initiate_checkout-Payload für den Checkout-Submit (CartSummary.jsx).
 * Spiegelt das Meta-Pixel InitiateCheckout (content_ids über alle Cart-Lines).
 * `contentIds` wird vom Aufrufer aus cartLineContentIds(lines) geliefert (oder
 * hier aus `lines` abgeleitet, falls uebergeben).
 *
 * @param {{
 *   subtotal?: {amount?: string, currencyCode?: string},
 *   numItems?: number,
 *   contentIds?: string[],
 *   lines?: Array<object>,
 * }} data
 * @returns {object}
 */
export function buildInitiateCheckoutEvent(data) {
  const contentIds =
    data?.contentIds ??
    (data?.lines ? cartLineContentIds(data.lines) : []);
  return {
    content_ids: contentIds || [],
    content_type: CONTENT_TYPE,
    value: toValue(data?.subtotal?.amount),
    currency: data?.subtotal?.currencyCode || 'EUR',
    num_items: data?.numItems || 0,
  };
}
