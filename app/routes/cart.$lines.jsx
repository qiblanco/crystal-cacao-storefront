import {redirect} from 'react-router';
import {
  getAttributionCartAttributes,
  getOriginCartAttributes,
  getTrackedCheckoutUrl,
  hasAttributionConsent,
} from '~/lib/cart-attribution.server';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```js
 * /cart/<variant_id>:<quantity>
 *
 * ```
 *
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL, for
 * carts with more than one product variant.
 *
 * @example
 * Example path creating a cart with two product variants, different quantities, and a discount code in the querystring:
 * ```js
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * ```
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context, params}) {
  const {cart, env} = context;
  const {lines} = params;
  if (!lines) return redirect('/cart');
  const linesMap = lines.split(',').map((line) => {
    const lineDetails = line.split(':');
    const variantId = lineDetails[0];
    const quantity = parseInt(lineDetails[1], 10);

    return {
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    };
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  // CROSS-BOUNDARY-LINKAGE (ADR 0056): die Identitaets-Schluessel muessen den
  // Domainwechsel crystal-cacao.com -> checkout.qiblanco.com ueberleben. Sie
  // reisen auf ZWEI Wegen, weil ein Weg allein je einen Fall verliert:
  // als Cart-Attribut (wird zum Order-note_attribute, ueberlebt auch eine
  // spaetere Kasse) UND als Query-Parameter an der checkoutUrl.
  // Der PERSONENBEZOGENE Teil ist consent-gegated -- ohne Einwilligung reist
  // davon nichts.
  const hasMarketingConsent = hasAttributionConsent(request, env);
  // NAHT-NACHZUG 2026-09-08 aus der Vorlage (d3b0bbb, #326; Job
  // 20260902-crystal-abnahme-...-prio45 s04). Hier stand
  // `hasMarketingConsent ? ... : []` fuer die GESAMTE Attributsliste -- ein
  // Direkt-zur-Kasse-Link ohne Consent erzeugte einen Cart ganz OHNE Attribute,
  // und die Order war spaeter nicht von einem Cart-Bypass zu unterscheiden.
  //
  // WARUM DIESE DATEI MITZIEHT, obwohl sie NICHT im Vendoring-Manifest steht:
  // diese Storefront hat ZWEI Cart-Eintrittspunkte (cart.jsx ueber
  // persistAttributionOnCartResult und diesen hier). Zoege nur der erste nach,
  // truege der Direkt-zur-Kasse-Weg weiterhin keine Herkunfts-Marker -- die
  // Wache tracking-linkage/proben/probe_herkunftsmarker_ankunft.py fiele
  // trotzdem auf exit 1, und der halbe Fix saehe wie ein ganzer aus.
  //
  // Herkunfts-Marker jetzt IMMER (consent-frei, nur Request-Metadaten),
  // personenbezogene Attribute weiterhin NUR mit Consent. Begruendung der
  // ganzen Naht am Block HERKUNFTS-MARKER in app/lib/checkout-tracking.js.
  const attributionAttributes = [
    ...getOriginCartAttributes(request),
    ...(hasMarketingConsent ? getAttributionCartAttributes(request) : []),
  ];

  // create a cart
  const result = await cart.create({
    lines: linesMap,
    discountCodes: discountArray,
    ...(attributionAttributes.length
      ? {attributes: attributionAttributes}
      : {}),
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Response('Dieser Link ist möglicherweise abgelaufen. Bitte prüfe die Adresse.', {
      status: 410,
    });
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  // redirect to checkout
  if (cartResult.checkoutUrl) {
    const trackedCheckoutUrl = hasMarketingConsent
      ? getTrackedCheckoutUrl(cartResult.checkoutUrl, request, env)
      : cartResult.checkoutUrl;

    return redirect(trackedCheckoutUrl, {headers});
  } else {
    throw new Error('Es wurde kein Kassen-Link gefunden');
  }
}

export default function Component() {
  return null;
}

/** @typedef {import('./+types/cart.$lines').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
