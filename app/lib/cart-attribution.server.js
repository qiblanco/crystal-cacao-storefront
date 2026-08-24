import {
  appendTrackingToCheckoutUrl,
  buildAttributionCartAttributes,
  getCheckoutTrackingSearchParams,
  isQiblancoProductionHost,
  mergeCartAttributes,
} from '~/lib/checkout-tracking';
import {hasRegionAwareTrackingPermission} from '~/lib/consent-policy';

/**
 * Persists ad click IDs on the Shopify cart so they become order note_attributes.
 *
 * @param {{
 *   cart: import('@shopify/hydrogen').HydrogenCart,
 *   request: Request,
 *   env?: Record<string, string | undefined>,
 *   result: {
 *     cart?: {id?: string, attributes?: Array<{key?: string | null, value?: string | null}> | null} | null,
 *     errors?: Array<unknown>,
 *     warnings?: Array<unknown>,
 *   } | null,
 * }} options
 */
export async function persistAttributionOnCartResult({
  cart,
  request,
  env,
  result,
}) {
  if (!result?.cart || !hasAttributionConsent(request, env)) return result;

  const attributionAttributes = getAttributionCartAttributes(request);
  if (!attributionAttributes.length) return result;

  const {attributes, changed} = mergeCartAttributes(
    result.cart.attributes,
    attributionAttributes,
  );

  if (!changed) return result;

  const updatedResult = await cart.updateAttributes(attributes);

  return {
    ...result,
    ...updatedResult,
    cart: updatedResult?.cart ?? result.cart,
    errors: mergeResultMessages(result.errors, updatedResult?.errors),
    warnings: mergeResultMessages(result.warnings, updatedResult?.warnings),
  };
}

/**
 * @param {Request} request
 * @param {Record<string, string | undefined> | undefined} env
 */
export function hasAttributionConsent(request, env) {
  // Job 20260718: region-aware (DE=consent, sonst optout NACH Env-Flip;
  // ohne PUBLIC_CONSENT_STRICT_REGIONS exakt heutiges Consent-Verhalten).
  return (
    hasRegionAwareTrackingPermission(request, env) ||
    isPreviewTrackingAllowed(request, env)
  );
}

/**
 * @param {Request} request
 */
export function getAttributionCartAttributes(request) {
  const url = new URL(request.url);

  return buildAttributionCartAttributes({
    searchParams: url.searchParams,
    cookieHeader: request.headers.get('Cookie'),
    includeCookies: true,
  });
}

/**
 * @param {string} checkoutUrl
 * @param {Request} request
 * @param {Record<string, string | undefined> | undefined} env
 */
export function getTrackedCheckoutUrl(checkoutUrl, request, env) {
  if (!hasAttributionConsent(request, env)) return checkoutUrl;

  const url = new URL(request.url);
  const searchParams = getCheckoutTrackingSearchParams({
    searchParams: url.searchParams,
    cookieHeader: request.headers.get('Cookie'),
    includeCookies: true,
  });

  return appendTrackingToCheckoutUrl(checkoutUrl, {
    searchParams,
    cookieHeader: request.headers.get('Cookie'),
    includeCookies: true,
  });
}

/**
 * @param {Array<unknown> | undefined} first
 * @param {Array<unknown> | undefined} second
 */
function mergeResultMessages(first, second) {
  return [...(first ?? []), ...(second ?? [])];
}

/**
 * @param {Request} request
 * @param {Record<string, string | undefined> | undefined} env
 */
function isPreviewTrackingAllowed(request, env) {
  // ADR 0056 Festlegung 4: dieser Schalter ist ein CONSENT-BYPASS, kein
  // Host-Schalter — zulaessig NUR auf der Oxygen-Vorschau, VERBOTEN in der
  // crystal-Produktions-Umgebung. Der Code-Pfad bleibt (die Vorschau braucht
  // ihn), gesetzt wird die Variable in keiner Produktions-Konfiguration.
  // Durchsetzer: homepage-bauer/pruefungen/probe_crystal_consent_bypass.py.
  return (
    env?.PUBLIC_ENABLE_TRACKING_IN_PREVIEW === 'true' &&
    !isQiblancoProductionHost(request.url, env)
  );
}
