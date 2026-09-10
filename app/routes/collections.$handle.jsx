import {redirect, useLoaderData} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {ABSENDER_MARKE, istKakaoKollektion, fremdinhaltAbweisen} from '~/lib/kakao-zone';
import {canonicalLink, absoluteCanonical} from '~/lib/seo';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const kollektion = data?.collection;
  const titel = `${kollektion?.title ?? 'Kollektion'} | ${ABSENDER_MARKE}`;
  if (!kollektion?.handle) return [{title: titel}];

  const descriptoren = [{title: titel}];
  // Beschreibung aus dem gepflegten Kollektionstext. Gekürzt statt
  // abgeschnitten: Google zeigt rund 160 Zeichen, ein mitten im Wort
  // endendes Snippet liest sich wie ein Fehler.
  const beschreibung =
    kuerzeBeschreibung(kollektion.description) ??
    ERSATZ_BESCHREIBUNG[kollektion.handle];
  if (beschreibung) {
    descriptoren.push({name: 'description', content: beschreibung});
    descriptoren.push({property: 'og:description', content: beschreibung});
  }
  descriptoren.push(canonicalLink(`/collections/${kollektion.handle}`));
  descriptoren.push({property: 'og:type', content: 'website'});
  descriptoren.push({property: 'og:site_name', content: ABSENDER_MARKE});
  descriptoren.push({property: 'og:locale', content: 'de_DE'});
  descriptoren.push({property: 'og:title', content: titel});
  descriptoren.push({
    property: 'og:url',
    content: absoluteCanonical(`/collections/${kollektion.handle}`),
  });
  return descriptoren;
};

/**
 * Beschreibung für Kollektionen, die im Shopify-Datensatz KEINE führen.
 *
 * WARUM ES DIESEN ERSATZ GIBT (Job 20260910-BAU-crystal-cacao-in-die-
 * suchmessung-und-seo-nachziehen, am 2026-09-10 am gerenderten Markup
 * gemessen):
 * `collection.description` ist für `zeremonie-kakao` leer — die Seite rendert
 * ein leeres `<p class="collection-description">`. Ein Canonical allein macht
 * die Seite noch nicht auffindbar; ohne Beschreibung reimt sich Google das
 * Snippet aus dem Seitentext zusammen, und der besteht auf einer
 * Kollektionsseite fast nur aus Produktnamen und Preisen.
 *
 * WARUM IM QUELLTEXT UND NICHT IM SHOPIFY-DATENSATZ: der Datensatz wäre der
 * bessere Ort, aber er ist von hier aus nicht schreibbar — und eine Seite,
 * die auf eine fremde Hand wartet, bleibt ohne Beschreibung. Der Quelltext
 * ist die Stelle, die dieser Bau erreicht. Trägt Shopify später eine
 * Beschreibung, GEWINNT SIE: `kuerzeBeschreibung()` steht vor diesem Ersatz,
 * und dieser Eintrag wird von selbst wirkungslos statt falsch.
 *
 * ZUR SPRACHE: nur Produktbeschaffenheit (Herkunft, Bio-Zertifikat,
 * Verarbeitung, Sortenzahl), KEINE gesundheitsbezogene Angabe — dieselbe
 * Grenze wie bei den Produktbeschreibungen in app/lib/produkt-seo.js
 * (EU 1924/2006).
 *
 * @type {Record<string, string>}
 */
const ERSATZ_BESCHREIBUNG = {
  'zeremonie-kakao':
    'Zeremonie-Kakao von Crystal Cacao® in Bio-Qualität (DE-ÖKO-006): zwei ' +
    'Sorten aus dem Piura-Tal in Peru, schonend kalt verarbeitet.',
};

/**
 * Kollektionstext auf Snippet-Länge bringen.
 *
 * Ohne Text -> undefined, damit der Aufrufer den Descriptor WEGLÄSST statt
 * einen leeren zu rendern: ein leeres `content` täuscht eine gepflegte
 * Angabe vor und ist für eine Suchmaschine schlechter als gar keins
 * (dieselbe Begründung wie bei produktBeschreibung() in app/lib/produkt-seo.js).
 *
 * @param {string|undefined|null} text
 * @returns {string|undefined}
 */
function kuerzeBeschreibung(text) {
  const roh = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!roh) return undefined;
  if (roh.length <= 160) return roh;
  const schnitt = roh.slice(0, 157);
  const luecke = schnitt.lastIndexOf(' ');
  return `${(luecke > 100 ? schnitt.slice(0, luecke) : schnitt).trim()}…`;
}

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

  // SORTIMENTS-ZAUN: unter /collections standen die vier Qi-Blanco-
  // Kollektionen frontpage, products, digitale-kurse, digital-goods-vat-tax.
  if (!istKakaoKollektion(handle)) {
    throw fremdinhaltAbweisen();
  }
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Kollektion ${handle} nicht gefunden`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection} = useLoaderData();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
