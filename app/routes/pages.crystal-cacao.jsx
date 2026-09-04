import {useLoaderData} from 'react-router';
import {Kakao} from '~/components/product-pages/Kakao';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {canonicalLink} from '~/lib/seo';
import {ABSENDER_MARKE} from '~/lib/kakao-zone';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    // ABSENDER_MARKE statt eines Literals: "Qi Blanco" ist auf einem
    // Kakao-Laden die fremde Absender-Marke (Segment s02, "Eine Marke, eine
    // Stelle"). Diese Route trug den Titel als einzige noch woertlich —
    // gemessen 2026-09-04 am gerenderten dev-Server: "Crystal Cacao® |
    // Qi Blanco". Das ist Browser-Tab UND SERP-Zeile der meistgesehenen
    // Kakao-Flaeche. Die Rechtsperson (Qi Blanco UG) bleibt davon unberuehrt;
    // sie steht in den Rechtstexten und im legalName, nicht im Seitentitel.
    //
    // WARUM DER SEITENNAME MITWANDERT: der alte Titel war
    // "<Seitenname> | <Absender>" = "Crystal Cacao® | Qi Blanco". Tauscht man
    // nur den Absender, steht dort "Crystal Cacao® | Crystal Cacao®" — die
    // Marke zweimal und die Seite ohne Aussage. Der Seitenname nimmt deshalb
    // die Worte auf, die auf DIESER Seite ohnehin stehen: "zeremoniell" (so
    // nennt die Startseite die Ernte) und "aus Peru" (Zeile 'description'
    // direkt darunter). Es ist keine neue Behauptung, sondern die vorhandene.
    {title: `Zeremonie-Kakao aus Peru | ${ABSENDER_MARKE}`},
    {
      name: 'description',
      content:
        'Crystal Cacao® – High Performance Cacao. Wach. Klar. Mineralisiert. 100 % reiner Premium-Naturkakao aus Peru.',
    },
    canonicalLink('/pages/crystal-cacao'),
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
