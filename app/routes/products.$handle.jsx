import {useLoaderData, redirect} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  istKakaoProdukt,
  fremdinhaltAbweisen,
  ABSENDER_MARKE,
  UMGELEITETE_PRODUKTE,
} from '~/lib/kakao-zone';
import {produktMeta} from '~/lib/produkt-seo';

/**
 * @type {Route.MetaFunction}
 *
 * WARUM DIESE ROUTE SEIT 2026-09-10 UEBER produktMeta() LAEUFT (Job
 * 20260910-BAU-crystal-cacao-in-die-suchmessung-und-seo-nachziehen, an der
 * Live-Auslieferung gemessen, nicht vermutet):
 *
 * Die bisherige Fassung gab den Descriptor `{rel: 'canonical', href: ...}`
 * OHNE `tagName: 'link'` zurueck. react-router 7 rendert einen Descriptor nur
 * dann als `<link>`, wenn er `tagName` traegt; ohne ihn entsteht KEIN
 * Canonical-Tag. Gemessen am 2026-09-10 an allen fuenf Seiten, die ueber diese
 * Sammelroute laufen (/products/mengenrabatt-2x, /mengenrabatt-3x-create,
 * /bundle-2x-awake, /bundle-3x-awake, /crystal-cacao-angebot): canonical = 0,
 * meta description = 0, og = 0, JSON-LD = 0. Der href war zusaetzlich relativ
 * statt absolut — ein Canonical MUSS absolut sein.
 *
 * DER HELFER EXISTIERTE BEREITS UND HATTE NUR KEINEN AUFRUFER (P10): der Kopf
 * von app/lib/produkt-seo.js fuehrt diese Luecke seit dem 2026-09-08 als
 * "EHRLICHE GRENZE" — die vier Bundle-Beschreibungen stehen dort seither
 * gepflegt, "wirken hier also noch nicht", weil diese Datei produkt-seo gar
 * nicht importierte. Genau dieser Import ist der Fix; es entsteht KEIN
 * zweiter Emitter und keine zweite Beschreibungs-Karte.
 *
 * WAS produktMeta() HIER BEWUSST NICHT TUT: alle fuenf Handles stehen in
 * OHNE_PREIS_NACHWEIS (app/lib/produkt-schema.js), deshalb liefert
 * produktSchema() fuer sie weiterhin `null` und es entsteht KEIN
 * Product-JSON-LD. Das ist ein Zaun, kein Versaeumnis: ein Product-Knoten ohne
 * belastbaren Preis steht dauerhaft als Fehler in der Search Console. Die
 * BreadcrumbList entsteht trotzdem — sie sagt ueber den Preis nichts aus.
 */
export const meta = ({data}) => {
  const produkt = data?.product;
  // Kein Produkt (Fehlerfall der Route): nur ein Titel. Bewusst KEIN Canonical
  // auf `/products/undefined` — die alte Fassung las `data?.product.title` mit
  // Optional-Chaining allein auf `data` und waere hier ausgestiegen.
  if (!produkt?.handle) {
    return [{title: `Produkt | ${ABSENDER_MARKE}`}];
  }
  return produktMeta({
    produkt,
    pfad: `/products/${produkt.handle}`,
    titel: `${produkt.title ?? 'Produkt'} | ${ABSENDER_MARKE}`,
    bildUrl:
      produkt.selectedOrFirstAvailableVariant?.image?.url ??
      produkt.images?.nodes?.[0]?.url,
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Es wurde kein Produkt angegeben');
  }

  // STILLGELEGTE ADRESSEN — dauerhaft (301) auf ihr Ziel, nicht ins Leere.
  // ANLASS 2026-09-09: `crystal-cacao-adfiefiale` (Dublette der Create-
  // Kaufseite) und die Testseite standen in der eigenen Sitemap. Sie fliegen
  // dort jetzt raus (app/lib/sitemap-zaun.js) — aber beide antworten seit
  // Monaten mit HTTP 200 an beiden Domains, also kann jemand darauf verlinkt
  // haben. Eine 404 würde diesen Besucher wegwerfen UND das Ranking-Signal der
  // alten Adresse verfallen lassen, statt es auf die echte Kaufseite zu geben.
  //
  // WARUM GANZ VORN, VOR DER PRODUKTABFRAGE UND VOR DEM SORTIMENTS-ZAUN: die
  // Zusage „keine Adresse läuft ins Leere" gilt sonst nur so lange, wie das
  // Produkt in der Kollektion bleibt und überhaupt noch existiert. Räumt
  // jemand später im Admin auf — und genau das ist die offene Vorlage zu
  // diesem Bau —, dann greift weiter oben `fremdinhaltAbweisen()` bzw. die
  // 404 des leeren Treffers, und die Weiterleitung käme nie zum Zug. Hier
  // hängt sie an nichts als dem Handle aus der Adresse.
  // Die Liste wohnt in kakao-zone.js, weil sie ZWEI Leser hat (diese Route und
  // die Sitemap) — zwei Stellen für denselben Zustand wären die teurere Form.
  const umleitungsZiel = UMGELEITETE_PRODUKTE[handle];
  if (umleitungsZiel) {
    throw redirect(umleitungsZiel, 301);
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // SORTIMENTS-ZAUN: der Shopify-Katalog hinter dieser Storefront führt auch
  // die Energieprodukte (QiOne, QiBracelet, QiHome Air). Ohne diese Prüfung
  // liefert /products/qione-2-pro hier HTTP 200 mit voll gerenderter
  // Fremdproduktseite — gemessen 2026-09-02, 26497 Bytes.
  if (!istKakaoProdukt(product.collections?.nodes?.map((k) => k.handle))) {
    throw fremdinhaltAbweisen();
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product} = useLoaderData();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  return (
    <div className="product">
      <ProductImage image={selectedVariant?.image} />
      <div className="product-main">
        <h1>{title}</h1>
        <ProductPrice
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <br />
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
        <br />
        <br />
        <p>
          <strong>Beschreibung</strong>
        </p>
        <br />
        <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
        <br />
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

// Der Fragment-/Operationsname traegt bewusst das Praefix `Skeleton`: die
// vendorten Kakao-Routen (products.crystal-cacao-awake/-create.jsx, K1 aus
// qiblanco, ADR 0056) bringen ein gleichnamiges, aber ANDERES `Product`-Fragment
// mit. Codegen dedupliziert byte-gleiche Duplikate still, bricht bei
// abweichenden aber ab -- und zwar VOR dem Buendeln, also mit einem Rot, das
// nichts ueber den restlichen Code aussagt. Umbenannt wird hier, weil diese
// Datei crystal allein gehoert (nicht im Manifest shared/UPSTREAM.json); eine
// Aenderung an den K1-Kopien waere LOKAL-DRIFT und ginge beim Nachzug verloren.
const PRODUCT_FRAGMENT = `#graphql
  fragment SkeletonProduct on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    # SORTIMENTS-ZAUN (app/lib/kakao-zone.js): entscheidet im Loader, ob dieses
    # Produkt zum Kakao-Sortiment gehört. Bewusst hier mitgezogen und NICHT als
    # zweite Query — die Mitgliedschaftsprüfung kostet so keinen Round-Trip.
    collections(first: 50) {
      nodes {
        handle
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query SkeletonProduct(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...SkeletonProduct
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
