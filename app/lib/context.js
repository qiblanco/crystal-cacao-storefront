import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {resolveCountry} from '~/lib/markt-pricing';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
};

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} executionContext
 */
export async function createHydrogenRouterContext(
  request,
  env,
  executionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  // Markt-Kontext wie auf qiblanco-storefront (dort app/lib/context.js:29-40),
  // mit DERSELBEN Funktion: markt-pricing.js liegt hier byte-gleich als K1 vor,
  // resolveCountry ist also kein Nachbau, sondern der geteilte Bestand.
  //   ?markt=XX (Preview) > Geo-Header, nur freigeschaltete Maerkte > 'DE'.
  //
  // WARUM DAS HIER STEHT (s09, 2026-08-22): der Skeleton-Default
  // {language: 'EN', country: 'US'} laesst app/lib/fragments.js:220,236 mit
  // @inContext(country: US) gegen dasselbe DACH-Backend fragen. Gemessen an der
  // Vorschau des Commits bd6b9da hiess das fuer den Kunden: $69/$79/$99 statt
  // 53/61/76 EUR und ein Warenkorb ueber $207.90, wo qiblanco.com 159 EUR bucht
  // -- gegen die Auftragszusage "Preise sind ueberall gleich". Die drei Kakao-
  // Routen sind daran unschuldig und byte-gleich; der Kontext, der sie mit
  // Preisen beliefert, liegt ausserhalb ihrer Import-Huelle und deshalb in
  // KEINER Klasse des shared/UPSTREAM.json.
  const country = resolveCountry(request);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'DE', country},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
        getBuyerIdentity: () => ({countryCode: country}),
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}

/** @typedef {Class<additionalContext>} AdditionalContextType */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
