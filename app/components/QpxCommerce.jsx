import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {
  qpxTrack,
  buildViewContentEvent,
  buildAddToCartEvent,
} from '~/lib/qpx-commerce';

/**
 * QpxCommerce — First-Party-Commerce-Bridge für den eigenen qpx-Receiver.
 *
 * Zweiter, UNABHAENGIGER Konsument der Hydrogen-Analytics-Events, die auch
 * MetaPixel.jsx nutzt: product_viewed -> qpx view_content, product_added_to_cart
 * -> qpx add_to_cart. So wird der Mid-Funnel (page_view -> view_content ->
 * add_to_cart -> initiate_checkout -> purchase) First-Party messbar
 * (Job 20260723-commerce-microfunnel-instrumentierung-messluecke).
 *
 * BEWUSST getrennt von MetaPixel.jsx: eine Aenderung dort würde die schon
 * gruenen ViewContent/AddToCart-Meta-Events beruehren (Regressionsrisiko,
 * s. pixel-content.js). Consent + Versand liegen im qpx-Loader/qpx.js; qpxTrack
 * puffert bis dahin über den Standard-Queue-Stub. initiate_checkout feuert
 * NICHT hier, sondern beim Checkout-Submit in CartSummary.jsx.
 *
 * Rendert nichts.
 */
export function QpxCommerce() {
  const {subscribe} = useAnalytics();
  const subscribed = useRef(false);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    subscribe('product_viewed', (data) => {
      const ev = buildViewContentEvent(data);
      if (ev) qpxTrack('view_content', ev);
    });

    subscribe('product_added_to_cart', (data) => {
      const ev = buildAddToCartEvent(data);
      if (ev) qpxTrack('add_to_cart', ev);
    });
  }, [subscribe]);

  return null;
}
