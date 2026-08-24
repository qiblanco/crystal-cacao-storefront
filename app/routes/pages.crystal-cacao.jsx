import {useLoaderData} from 'react-router';
import {Kakao} from '~/components/product-pages/Kakao';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    {title: `Crystal Cacao® | Qi Blanco UG (haftungsbeschränkt)`},
    {
      name: 'description',
      content:
        'Crystal Cacao® – High Performance Cacao. Wach. Klar. Mineralisiert. 100 % reiner Premium-Naturkakao aus Peru.',
    },
    {
      rel: 'canonical',
      href: `/pages/crystal-cacao`,
    },
  ];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args, 'crystal-cacao');
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}, handle) {
  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {handle},
    }),
  ]);

  // Graceful fallback — Shopify page optional; component is self-contained
  if (page) {
    redirectIfHandleIsLocalized(request, {handle, data: page});
  }

  return {page: page ?? null};
}

function loadDeferredData() {
  return {};
}

export default function CrystalCacaoPage() {
  return <Kakao />;
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
