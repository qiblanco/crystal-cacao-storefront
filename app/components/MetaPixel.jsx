import {useEffect, useRef} from 'react';
import {useAnalytics, parseGid} from '@shopify/hydrogen';

/**
 * K3-NAHT (crystal-cacao-storefront) — EIGENE Fassung, NICHT geteilt.
 * Herkunft: qiblanco-storefront app/components/MetaPixel.jsx @ 89c2422.
 *
 * EINZIGE Abweichung zur Vorlage: die Pixel-ID ist dort eine Quelltext-
 * Konstante (der Pixel „Qi Blanco Germany Pixel 2023"). Sie hier byte-gleich
 * zu uebernehmen wuerde den Traffic einer ZWEITEN Domain in den Pixel der
 * Hauptseite schreiben — eine Datenentscheidung, die dieser Job nicht still
 * treffen darf. Deshalb kommt sie als Prop aus dem root-Loader
 * (`PUBLIC_META_PIXEL_ID`). Ohne gesetzte Variable bootet der Pixel NICHT:
 * fail-closed, kein Halb-Zustand, keine Fehlzuordnung.
 *
 * Meta-Pixel (Browser) — Vorlagen-Kommentar ab hier unveraendert:
 *
 * Consent-gated über Cookiebot (Marketing), wie qiblanco-tracker.js: ohne
 * Zustimmung wird weder fbevents.js geladen noch ein Event gefeuert.
 *
 * Events: PageView (jede Route, auch SPA-Navigation), ViewContent (Produktseite),
 * AddToCart. InitiateCheckout kommt aus CartSummary (Checkout-Submit).
 * KEIN Browser-Purchase: der Purchase kommt server-seitig per Conversions API
 * mit event_id = Shopify-Order-ID; ein Browser-Purchase würde ohne dieselbe
 * eventID doppelt zählen.
 *
 * Nebeneffekt (gewollt): fbevents.js setzt die First-Party-Cookies _fbp/_fbc.
 * qiblanco-tracker.js schreibt sie in die Order-note_attributes, die
 * Server-CAPI sendet sie mit — erst dadurch kann Meta Käufe attribuieren.
 */

function hasMarketingConsent() {
  return Boolean(
    window.Cookiebot &&
      window.Cookiebot.consent &&
      window.Cookiebot.consent.marketing,
  );
}

function hasPreviewTrackingConsent() {
  return (
    document.documentElement.getAttribute('data-qiblanco-tracking-preview') ===
    'true'
  );
}

// Region-aware Consent-Policy (Job 20260718, Spiegel consent-policy.js):
// ohne html[data-qb-consent-strict] strict fuer ALLE (heutiges Verhalten,
// fail-closed); 'optout'-Regionen laden das Pixel ab Seitenaufruf, eine
// AKTIV erklaerte Ablehnung wird immer respektiert.
function regionPolicy() {
  const de = document.documentElement;
  const strict = (de.getAttribute('data-qb-consent-strict') || '')
    .toUpperCase()
    .split(',')
    .filter((c) => /^[A-Z]{2}$/.test(c.trim()));
  if (!strict.length) return 'consent';
  const region = (de.getAttribute('data-qb-region') || '').toUpperCase();
  if (!region) return 'consent';
  return strict.includes(region) ? 'consent' : 'optout';
}

function hasDeclined() {
  return Boolean(
    window.Cookiebot &&
      window.Cookiebot.hasResponse &&
      window.Cookiebot.consent &&
      !window.Cookiebot.consent.marketing,
  );
}

function trackingAllowed() {
  if (hasPreviewTrackingConsent()) return true;
  if (regionPolicy() === 'optout') return !hasDeclined();
  return hasMarketingConsent();
}

function bootMetaPixel(metaPixelId) {
  if (window._qiblancoMetaPixelBooted) return;
  // Ohne konfigurierte Pixel-ID wird NICHTS geladen und NICHTS gefeuert.
  if (!metaPixelId) return;
  if (!trackingAllowed()) return;
  window._qiblancoMetaPixelBooted = true;

  // Offizieller Meta-Basecode (fbq-Stub + fbevents.js-Loader).
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js',
  );

  window.fbq('init', metaPixelId);
  window.fbq('track', 'PageView');
  window._qiblancoMetaPixelLastUrl = window.location.href;
}

function fbqTrack(eventName, params) {
  if (!window._qiblancoMetaPixelBooted) return;
  if (typeof window.fbq !== 'function') return;
  try {
    window.fbq('track', eventName, params);
  } catch {
    // Ein Tracking-Fehler darf nie den Shop brechen.
  }
}

function trackPageView(url) {
  if (!window._qiblancoMetaPixelBooted) return;
  if (url && url === window._qiblancoMetaPixelLastUrl) return;
  window._qiblancoMetaPixelLastUrl = url || window.location.href;
  fbqTrack('PageView');
}

function numericProductId(gid) {
  try {
    return parseGid(gid).id || undefined;
  } catch {
    return undefined;
  }
}

/**
 * @param {{metaPixelId?: string}} props
 */
export function MetaPixel({metaPixelId}) {
  const {subscribe} = useAnalytics();
  const subscribed = useRef(false);

  useEffect(() => {
    bootMetaPixel(metaPixelId);
    const onConsent = () => bootMetaPixel(metaPixelId);
    window.addEventListener('CookiebotOnAccept', onConsent);
    window.addEventListener('CookiebotOnConsentReady', onConsent);
    window.addEventListener('CookiebotOnLoad', onConsent);
    return () => {
      window.removeEventListener('CookiebotOnAccept', onConsent);
      window.removeEventListener('CookiebotOnConsentReady', onConsent);
      window.removeEventListener('CookiebotOnLoad', onConsent);
    };
  }, [metaPixelId]);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    subscribe('page_viewed', (data) => {
      trackPageView(data?.url);
    });

    subscribe('product_viewed', (data) => {
      const product = data?.products?.[0];
      if (!product) return;
      fbqTrack('ViewContent', {
        content_ids: [numericProductId(product.id)].filter(Boolean),
        content_name: product.title,
        content_type: 'product',
        value: parseFloat(product.price) || 0,
        currency: data?.shop?.currency || 'EUR',
      });
    });

    subscribe('product_added_to_cart', (data) => {
      const line = data?.currentLine;
      const merchandise = line?.merchandise;
      if (!merchandise) return;
      const unitPrice = parseFloat(merchandise.price?.amount) || 0;
      // Hydrogen feuert das Event auch bei Mengen-Erhöhung — nur das Delta zählen.
      const quantity = Math.max(
        (line.quantity || 1) - (data?.prevLine?.quantity || 0),
        1,
      );
      fbqTrack('AddToCart', {
        content_ids: [numericProductId(merchandise.product?.id)].filter(
          Boolean,
        ),
        content_name: merchandise.product?.title,
        content_type: 'product',
        value: unitPrice * quantity,
        currency:
          merchandise.price?.currencyCode || data?.shop?.currency || 'EUR',
        num_items: quantity,
      });
    });
  }, [subscribe]);

  return null;
}
