import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';

/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

/**
 * @param {PartialSearchResult<'articles'>}
 */
function SearchResultsArticles({term, articles}) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Artikel</h2>
      <div>
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                {article.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

/**
 * @param {PartialSearchResult<'pages'>}
 */
function SearchResultsPages({term, pages}) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Seiten</h2>
      <div>
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                {page.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

/**
 * @param {PartialSearchResult<'products'>}
 *
 * KEINE PAGINIERUNG MEHR — 2026-09-02 (s05), und das ist eine Korrektur, keine
 * Vereinfachung. Der Sortiments-Zaun filtert die Shopify-Treffer NACH der
 * Abfrage (search.jsx nurKakaoTreffer). Eine Cursor-Paginierung darüber liefert
 * Seiten, die nach dem Filtern leer sind, und eine Trefferzahl, deren Zähler
 * aus dem gefilterten und deren Nenner aus dem ungefilterten Ergebnis stammt.
 * Der Loader holt stattdessen die ganze (kleine) Kakao-Menge auf einmal.
 */
function SearchResultsProducts({term, products}) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Produkte</h2>
      <div className="cc-trefferliste">
        {products.nodes.map((product) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/products/${product.handle}`,
            trackingParams: product.trackingParameters,
            term,
          });

          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image;

          return (
            <div className="search-results-item" key={product.id}>
              <Link prefetch="intent" to={productUrl}>
                {image && <Image data={image} alt={product.title} width={64} />}
                <div>
                  <p>{product.title}</p>
                  <small>{price && <Money data={price} />}</small>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchResultsEmpty() {
  return (
    <div className="cc-leerzustand">
      <p>Dazu haben wir nichts gefunden.</p>
      <p className="cc-leerzustand-hinweis">
        Probier’s mit einem anderen Wort — oder sieh dir gleich unsere zwei
        Sorten an.
      </p>
      <Link className="cc-knopf" to="/pages/crystal-cacao">
        Unseren Kakao ansehen
      </Link>
    </div>
  );
}

/** @typedef {RegularSearchReturn['result']['items']} SearchItems */
/**
 * @typedef {Pick<
 *   SearchItems,
 *   ItemType
 * > &
 *   Pick<RegularSearchReturn, 'term'>} PartialSearchResult
 * @template {keyof SearchItems} ItemType
 */
/**
 * @typedef {RegularSearchReturn & {
 *   children: (args: SearchItems & {term: string}) => React.ReactNode;
 * }} SearchResultsProps
 */

/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
