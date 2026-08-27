import {useLoaderData} from 'react-router';
import {KAKAO_KENNZAHLEN} from '~/lib/kakao-zone';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductImage} from '~/components/ProductImage';
import {CacaoProductForm} from '~/components/CacaoProductForm';
import {CacaoPriceDisplay} from '~/components/CacaoPriceDisplay';
import {ProductImageList} from '~/components/ProductImageList';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {useState} from 'react';
import Create from '~/components/product-pages/Create';
import LazyImage from '~/components/reusables/LazyImage';

import {produktMeta, MARKE} from '~/lib/produkt-seo';
/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return produktMeta({
    // Product-Auszeichnung (Preis/Verfügbarkeit) — siehe produkt-seo.js
    produkt: data?.product,
    pfad: '/products/crystal-cacao-create',
    titel: `${data?.product?.title ?? ''} | ${MARKE}`,
    bildUrl:
      data?.product?.selectedOrFirstAvailableVariant?.image?.url ??
      data?.product?.images?.nodes?.[0]?.url,
  });
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args, 'crystal-cacao-create'); // ✅ pass hardcoded handle

  return {...deferredData, ...criticalData};
}

/**
 * Load critical data (above-the-fold content)
 * @param {LoaderFunctionArgs} args
 * @param {string} handle
 */
async function loadCriticalData({context, request}, handle) {
  const {storefront} = context;

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {
        handle, // ✅ use the static handle
        selectedOptions: getSelectedProductOptions(request),
      },
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {product};
}

/**
 * Load deferred (non-critical) data
 */
function loadDeferredData({context, params}) {
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
  const [featuredImage, setFeaturedImage] = useState(product?.images.nodes[0]);
  const [quantity, setQuantity] = useState('3');
  return (
    <>
      <div className="flex flex-col gap-5 items-center-justify-center text-center max-w-[750px] mx-auto! my-[5vh]! p-2">
        <div className="max-w-[500px] m-center">
          <LazyImage highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Create_Schriftzug_1.png?v=1766481502"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Create_Schriftzug_1_small.png?v=1766481502" />
        </div>
        <h2 style={{fontSize: '3em', marginTop: '50px'}}>Wach. Klar. Fokussiert.</h2>
        <h3 style={{fontSize: '2em'}}>High Performance Cacao</h3>
      </div>
      <div className="product">
        <div className="ProductImages">
          <div className="ProductImageWrapperSticky">
          <ProductImage image={featuredImage} />
          <ProductImageList
            images={product?.images}
            onSelectImage={(image) => setFeaturedImage(image)}
          />
          </div>
        </div>
        <div className="product-main">
          <h1>{title}</h1>
          <div className="product-rating">
            <span>{KAKAO_KENNZAHLEN.bewertung}</span> ★★★★★ <span>Über {KAKAO_KENNZAHLEN.nutzer} Nutzer</span>
          </div>
          <div
            className="ProductDescription"
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
          />

          <p className="mt-2">
            <b>Mehr als {KAKAO_KENNZAHLEN.nutzer}+ aktive Nutzer</b>
          </p>

          <CacaoPriceDisplay
            quantity={quantity}
            selectedVariant={selectedVariant}
            handle={product.handle}
          />

          <CacaoProductForm
            selectedVariant={selectedVariant}
            handle={product.handle}
            quantity={quantity}
            onQuantityChange={setQuantity}
          />
          <CacaoBenefitList />
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
      <Create />
    </>
  );
}

function CacaoBenefitList() {
  return (
    <div className="CacaoBenefitList">
      <ul>
        <li>✅ Kostenloser Versand ab 99 € innerhalb Deutschlands</li>
        <li>🚚 Lieferung in 1–3 Werktagen</li>
        <li>🔄 100 % Geld-zurück-Garantie bei Unzufriedenheit</li>
        <li>🔬 Laboranalytisch geprüft (Dartsch Institut)</li>
        <li>🌿 Bio-zertifiziert nach DE-ÖKO-006</li>
      </ul>
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

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
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
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
