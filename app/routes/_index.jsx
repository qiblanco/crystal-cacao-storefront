import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {ABSENDER_MARKE, KAKAO_KOLLEKTION} from '~/lib/kakao-zone';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: `${ABSENDER_MARKE} – Bio-Kakao aus zeremonieller Ernte`}];
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
async function loadCriticalData({context}) {
  const [{collection}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY, {
      variables: {handle: KAKAO_KOLLEKTION},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {variables: {handle: KAKAO_KOLLEKTION}})
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image
            data={image}
            sizes="100vw"
            alt={image.altText || collection.title}
          />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <h2 id="recommended-products">Unsere Empfehlungen</h2>
      <Suspense fallback={<div>Wird geladen …</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response?.collection
                ? response.collection.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </section>
  );
}

// SORTIMENTS-ZAUN AN DER STARTSEITE — der Grund steht in app/lib/kakao-zone.js.
//
// VORHER standen hier die unveränderten Hydrogen-Schablonen-Queries:
//   collections(first: 1, sortKey: UPDATED_AT, reverse: true)
//   products(first: 4,   sortKey: UPDATED_AT, reverse: true)
// Sie fragen nicht nach SORTIMENT, sondern nach AKTUALITÄT — über den ganzen
// Shopify-Katalog, der auch die Energieprodukte führt. Am 2026-09-02 zeigte die
// Startseite deshalb zufällig Kakao (weil Kakao zuletzt bearbeitet worden war);
// EINE Produktbearbeitung an QiOne/QiBracelet/QiHome Air im Admin hätte das
// Fremdsortiment ohne jede Code-Änderung auf die Kakao-Startseite gestellt.
// Eine Probe, die den damaligen Zustand misst, wäre grün gewesen und hätte
// nichts bewiesen. Deshalb bindet die Query jetzt die KOLLEKTION, nicht die Zeit.
const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode, $handle: String!)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...FeaturedCollection
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode, $handle: String!)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 4) {
        nodes {
          ...RecommendedProduct
        }
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
