import {useLoaderData} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import {ABSENDER_MARKE, istKakaoProdukt, istKakaoSeite, istKakaoKollektion} from '~/lib/kakao-zone';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: `Suche | ${ABSENDER_MARKE}`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({request, context});

  searchPromise.catch((error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });

  return await searchPromise;
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {type, term, result, error} = useLoaderData();
  if (type === 'predictive') return null;

  return (
    <div className="search">
      <h1>Suche</h1>
      <SearchForm>
        {({inputRef}) => (
          <>
            <input
              defaultValue={term}
              name="q"
              placeholder="Suchen…"
              ref={inputRef}
              type="search"
            />
            &nbsp;
            <button type="submit">Suchen</button>
          </>
        )}
      </SearchForm>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!term || !result?.total ? (
        <SearchResults.Empty />
      ) : (
        <SearchResults result={result} term={term}>
          {({articles, pages, products, term}) => (
            <div>
              <SearchResults.Products products={products} term={term} />
              <SearchResults.Pages pages={pages} term={term} />
              <SearchResults.Articles articles={articles} term={term} />
            </div>
          )}
        </SearchResults>
      )}
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </div>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    # SORTIMENTS-ZAUN (app/lib/kakao-zone.js): mitgezogen, damit der Loader
    # Fremdtreffer verwerfen kann, ohne eine zweite Query zu fahren.
    collections(first: 50) {
      nodes {
        handle
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
`;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
`;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
`;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

/**
 * Regular search fetcher
 * @param {Pick<
 *   Route.LoaderArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 8});
  const term = String(url.searchParams.get('q') || '');

  // Search articles, pages, and products for the `q` term
  const {errors, ...items} = await storefront.query(SEARCH_QUERY, {
    variables: {...variables, term},
  });

  if (!items) {
    throw new Error('Die Suche lieferte keine Daten von Shopify zurück');
  }

  // SORTIMENTS-ZAUN: die Shopify-Suche durchsucht den GANZEN Katalog hinter
  // dieser Storefront, also auch die Energieprodukte. Gemessen 2026-09-02 gab
  // /search?q=qione hier 38 sichtbare Fremdnennungen. Gefiltert wird NACH der
  // Abfrage, weil die Storefront-Suche kein Kollektions-Prädikat kennt.
  const gefiltert = nurKakaoTreffer(items);

  const total = Object.values(gefiltert).reduce(
    (acc, {nodes}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}) => message).join(', ')
    : undefined;

  return {type: 'regular', term, error, result: {total, items: gefiltert}};
}

/**
 * Wirft aus einem Shopify-Suchergebnis alles heraus, was nicht zur Kakao-Welt
 * gehört: Produkte über die Kollektions-Mitgliedschaft, Seiten über die
 * Seiten-Allowlist. ARTIKEL bleiben unangetastet — das Magazin ist eine eigene
 * Fläche und wird in diesem Segment bewusst nicht mitentschieden (siehe RESULT).
 * Die Form des Ergebnisses ({nodes: [...]} je Gattung) bleibt erhalten, damit
 * die Zähl- und Anzeigelogik unverändert weiterläuft.
 */
function nurKakaoTreffer(items) {
  const raus = {};
  for (const [gattung, wert] of Object.entries(items)) {
    const nodes = wert?.nodes ?? [];
    let behalten = nodes;
    if (gattung === 'products') {
      behalten = nodes.filter((n) =>
        istKakaoProdukt(n?.collections?.nodes?.map((k) => k.handle)),
      );
    } else if (gattung === 'pages') {
      behalten = nodes.filter((n) => istKakaoSeite(n?.handle));
    }
    raus[gattung] = {...wert, nodes: behalten};
  }
  return raus;
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    # SORTIMENTS-ZAUN (app/lib/kakao-zone.js) — siehe SearchProduct.
    collections(first: 50) {
      nodes {
        handle
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

/**
 * Predictive search fetcher
 * @param {Pick<
 *   Route.ActionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<PredictiveSearchReturn>}
 */
async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
      },
    },
  );

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('Die Sucheingabe lieferte keine Daten von Shopify zurück');
  }

  // SORTIMENTS-ZAUN, auch hier: die Sucheingabe im Kopf ist derselbe Katalog.
  // Die Vorschlagsliste liefert je Gattung ein ARRAY (nicht {nodes}), deshalb
  // ein eigener Zweig statt nurKakaoTreffer().
  const gefiltert = Object.fromEntries(
    Object.entries(items).map(([gattung, liste]) => {
      if (!Array.isArray(liste)) return [gattung, liste];
      if (gattung === 'products') {
        return [
          gattung,
          liste.filter((n) =>
            istKakaoProdukt(n?.collections?.nodes?.map((k) => k.handle)),
          ),
        ];
      }
      if (gattung === 'pages') {
        return [gattung, liste.filter((n) => istKakaoSeite(n?.handle))];
      }
      if (gattung === 'collections') {
        return [gattung, liste.filter((n) => istKakaoKollektion(n?.handle))];
      }
      return [gattung, liste];
    }),
  );

  const total = Object.values(gefiltert).reduce(
    (acc, item) => acc + (Array.isArray(item) ? item.length : 0),
    0,
  );

  return {type, term, result: {items: gefiltert, total}};
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('storefrontapi.generated').RegularSearchQuery} RegularSearchQuery */
/** @typedef {import('storefrontapi.generated').PredictiveSearchQuery} PredictiveSearchQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
