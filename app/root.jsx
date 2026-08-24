import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import kakaoStyles from '~/styles/kakao-seiten.css?url';
import {PageLayout} from './components/PageLayout';
import {MetaPixel} from './components/MetaPixel';
import {isQiblancoProductionHost} from '~/lib/checkout-tracking';
import {strictRegions} from '~/lib/consent-policy';
import '@fontsource-variable/open-sans';

/**
 * Endpoint der COOKIELOSEN Basis-Ebene (qiblanco-qpx-basis.js).
 *
 * WARUM EINE KONSTANTE STATT NUR `env` (gemessen 2026-08-24, nicht vermutet):
 * die qiblanco-Vorlage rendert das Basis-Skript ausschliesslich bei gesetztem
 * `PUBLIC_QPX_BASIS_ENDPOINT`. Dieses Repo hat ZWEI Oxygen-Workflows, und der
 * aktive (`oxygen-deployment-1000172095.yml`, `on: [push]`) ruft
 * `npx shopify hydrogen deploy` OHNE `--env-file` — er injiziert also gar keine
 * PUBLIC_*-Variablen. Byte-gleich uebernommen waere der Beacon hier STUMM:
 * Build gruen, Seite laedt, Nenner tot. Exakt dieselbe Fehlerform, die
 * `checkout-tracking.js` oben fuer `TRACKING_PRODUCTION_HOSTS` beschreibt —
 * daher hier dieselbe Bauform: Konstante als Boden, `env` als Uebersteuerung.
 *
 * Der Wert ist am LIVE ausgelieferten qiblanco.com gemessen
 * (`data-qpx-basis-endpoint`), nicht aus einer Konfigdatei abgeschrieben.
 */
const QPX_BASIS_ENDPOINT_DEFAULT = 'https://qpx.65-108-150-121.sslip.io/b';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    // --- Tracking-Naht (K3, ADR 0056). Alles env-gesteuert und fail-closed:
    // ohne gesetzte Variable laedt nichts, feuert nichts, und es entsteht
    // KEIN Halb-Zustand. Was hier fehlt, fehlt sichtbar (siehe env.d.ts).
    isProductionHost: isQiblancoProductionHost(args.request.url, env),
    // ADR 0056 Festlegung 4: CONSENT-BYPASS. Nur Vorschau, NIE Produktion.
    enableTrackingInPreview: env.PUBLIC_ENABLE_TRACKING_IN_PREVIEW === 'true',
    // Region-aware Consent (Spiegel fuer die Client-Skripte). Ohne
    // PUBLIC_CONSENT_STRICT_REGIONS bleibt clientseitig ALLES streng.
    buyerCountry: args.request.headers.get('oxygen-buyer-country') || '',
    consentStrictRegions: strictRegions(env).join(','),
    // First-Party-Pixel (qpx) — setzt _qpx_anon. Laedt nur mit Endpoint.
    qpxEndpoint: env.PUBLIC_QPX_ENDPOINT || '',
    // Cookielose BASIS-Ebene — der NENNER fuer den Mess-Abdeckungsgrad.
    // Setzt/liest nichts auf dem Endgeraet und fuehrt KEINEN Identitaets-
    // Schluessel; deshalb bewusst NICHT hinter dem Consent-Gate, sondern nur
    // hinter dem Produktions-Host-Gate (wie in der qiblanco-Vorlage).
    qpxBasisEndpoint:
      env.PUBLIC_QPX_BASIS_ENDPOINT || QPX_BASIS_ENDPOINT_DEFAULT,
    // Meta-Pixel: eigene Kennung fuer diese Domain, siehe MetaPixel.jsx.
    metaPixelId: env.PUBLIC_META_PIXEL_ID || '',
    // Hyros-Universal-Script: eigene Tag-Kennung, siehe qiblanco-tracker.js.
    hyrosTagUrl: env.PUBLIC_HYROS_TAG_URL || '',
    // Cookiebot-Domaingruppe dieser Domain. Ohne sie kein Consent-Banner —
    // und damit (fail-closed) auch kein marketing-Consent und kein Tracking.
    cookiebotId: env.PUBLIC_COOKIEBOT_ID || '',
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context}) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

/**
 * @param {{children?: React.ReactNode}}
 */
export function Layout({children}) {
  const nonce = useNonce();
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');
  // Drittskripte laufen NUR auf einem konfigurierten Produktions-Host oder in
  // der ausdruecklich als Vorschau markierten Umgebung — nie "einfach so".
  const shouldLoadThirdPartyScripts =
    data?.isProductionHost || data?.enableTrackingInPreview;
  const isTrackingPreview =
    Boolean(data?.enableTrackingInPreview) && !data?.isProductionHost;

  return (
    <html
      lang="de"
      data-qiblanco-tracking-preview={isTrackingPreview ? 'true' : undefined}
      data-qb-region={data?.buyerCountry || undefined}
      data-qb-consent-strict={data?.consentStrictRegions || undefined}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <link rel="stylesheet" href={kakaoStyles}></link>
        {shouldLoadThirdPartyScripts && data?.cookiebotId ? (
          <script
            id="Cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid={data.cookiebotId}
            data-blockingmode="auto"
            type="text/javascript"
            nonce={nonce}
            async
            suppressHydrationWarning
          />
        ) : null}
        <Meta />
        <Links />
        {shouldLoadThirdPartyScripts && (
          <>
            <script
              src="/cookiebot-shopify-consent-sync.js"
              nonce={nonce}
              defer
              suppressHydrationWarning
            />
            <script
              src="/qiblanco-tracker.js"
              data-hyros-tag={data?.hyrosTagUrl || undefined}
              nonce={nonce}
              defer
              suppressHydrationWarning
            />
            {data?.qpxEndpoint ? (
              <script
                src="/qiblanco-qpx-loader.js"
                data-qpx-endpoint={data.qpxEndpoint}
                nonce={nonce}
                defer
                suppressHydrationWarning
              />
            ) : null}
            {data?.qpxBasisEndpoint ? (
              // Cookielose Basis-Ebene: BEWUSST direkt (nicht über den
              // Consent-Loader) — einwilligungsfrei, setzt nichts auf dem
              // Endgerät. Sie ist der NENNER, gegen den die consent-gegatete
              // Ebene gemessen wird; ohne sie ist der Abdeckungsgrad auf
              // crystal-cacao.com baulich unmessbar.
              <script
                src="/qiblanco-qpx-basis.js"
                data-qpx-basis-endpoint={data.qpxBasisEndpoint}
                nonce={nonce}
                defer
                suppressHydrationWarning
              />
            ) : null}
          </>
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
      {(data.isProductionHost || data.enableTrackingInPreview) && (
        <MetaPixel metaPixelId={data.metaPixelId} />
      )}
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}

/** @typedef {LoaderReturnData} RootLoader */

/** @typedef {import('react-router').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('./+types/root').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
