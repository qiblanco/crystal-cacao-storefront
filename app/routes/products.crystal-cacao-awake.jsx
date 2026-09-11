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
import {EuGewaehrleistungsListenpunkt} from '~/components/EuGewaehrleistungsLabel';
import {CacaoPriceDisplay} from '~/components/CacaoPriceDisplay';
import {ProductImageList} from '~/components/ProductImageList';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {useState} from 'react';
import Awake from '~/components/product-pages/Awake';
import {
  SortenAufmacher,
  SortenAufmacherBestand,
} from '~/components/product-pages/SortenAufmacher';
import {waehleAufmacherFassung} from '~/lib/sortenaufmacher-fassung';

import {produktMeta, MARKE} from '~/lib/produkt-seo';
import {StarRating} from '~/components/reusables/StarRating';
/** 
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return produktMeta({
    // Product-Auszeichnung (Preis/Verfügbarkeit) — siehe produkt-seo.js
    produkt: data?.product,
    pfad: '/products/crystal-cacao-awake',
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
  const criticalData = await loadCriticalData(args, 'crystal-cacao-awake'); // ✅ pass hardcoded handle

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

  return {product, aufmacherFassung: waehleAufmacherFassung(request)};
}

/**
 * Load deferred (non-critical) data
 */
function loadDeferredData({context, params}) {
  return {};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, aufmacherFassung} = useLoaderData();

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
      {aufmacherFassung === 'bestand' ? (
        <SortenAufmacherBestand sorte="awake" />
      ) : (
        <SortenAufmacher sorte="awake" />
      )}
      <div className="product" id="cc-kaufen">
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
          {/*
            * 2026-09-10 — Christian zur Aufnahme der Create-Kaufseite:
            * „Dass diese 4,9 Sterne mit Button hinterlegt sind, der aufleuchtet
            * und dann nirgendwo hin geht, ist auch Quatsch. Das entfernen."
            *
            * ER HAT RECHT, UND DER GRUND IST BAULICH: <SterneSprung/> ist ein
            * echter <button>, sein VERHALTEN haengt aber nicht an ihm, sondern
            * an useSterneSprungDelegation in GoogleRezensionenBereich.jsx (so
            * steht es im Kopf von StarRating.jsx). DIESE DATEI GIBT ES IN
            * DIESEM LADEN NICHT — das Bauteil wurde ohne seinen
            * Verhaltenstraeger uebernommen. Am Kundenrand gemessen
            * (Playwright, 390/768/1440 px): echter Klick bewegt 0,0 px,
            * location.hash bleibt leer, Sprungziele auf der Seite = 0.
            *
            * DIE AUSNAHME DES AUFTRAGS IST GEPRUEFT UND GREIFT NICHT: einen
            * Bewertungsabschnitt gibt es auf dieser Seite nicht. Die echten
            * Google-Stimmen (app/data/kakao-stimmen.js) stehen ausschliesslich
            * auf der Startseite (Verkaufsauftritt.jsx). Einen Abschnitt nur zu
            * bauen, damit ein Link ein Ziel hat, verbietet der Auftrag
            * ausdruecklich.
            *
            * ES BLEIBT ALSO REINER TEXT — und der Marker wandert von "s"
            * (Sprung zum Bewertungsbereich derselben Seite) auf "d" (rein
            * darstellend). Das ist der Vertrag aus StarRating.jsx, nicht eine
            * Abkuerzung: "d" ist eine BEWERTUNG, die nur nicht springt, ihre
            * Farbe wird weiter geurteilt und muss --qb-sterne-gold tragen.
            * "z" (Zierde) waere hier falsch — die Zeile RENDERT einen Wert.
            *
            * StarRating.jsx selbst bleibt UNANGETASTET: die Datei steht in
            * shared/UPSTREAM.json und wird gegen qiblanco-storefront auf
            * sha256 gewacht. Geaendert wird die Verwendungsstelle, wie es der
            * Marker-Vertrag verlangt ("die Klasse wird an der
            * VERWENDUNGSSTELLE gesetzt, nie zur Laufzeit erraten").
            *
            * DIE KENNZAHLEN bleiben, wo sie sind (KAKAO_KENNZAHLEN): 4,9 ist
            * der Stand von crystal-cacao.com und wird nie mit den 4,8 von
            * qiblanco.com verrechnet — zwei Marken, zwei Bestaende.
            */}
          <p className="product-rating">
            <span>{KAKAO_KENNZAHLEN.bewertung}</span>{' '}
            <StarRating
              value={Number(KAKAO_KENNZAHLEN.bewertung.replace(',', '.'))}
              qb="d"
            />{' '}
            <span>Über {KAKAO_KENNZAHLEN.nutzer} Nutzer</span>
          </p>
          <div
            className="ProductDescription"
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
          />

          {/*
            * 2026-09-10 ENTFERNT — Christian: „Mehr als 1.000+ aktive Nutzer
            * sagt dasselbe wie die Zeile bei den Sternen. Zweimal dieselbe Zahl
            * in acht Zeilen schwaecht sie, statt sie zu staerken."
            * Gemessen ueber BLATTKNOTEN im Kaufblock (nie ueber den
            * Zeichenstrom — ausgeliefertes HTML traegt eingebettete Daten und
            * fremde Titel): 2 Vorkommen, "Über 1.000 Nutzer" und "Mehr als
            * 1.000+ aktive Nutzer". Die Zahl bleibt — sie steht jetzt an genau
            * EINER Stelle, naemlich dort, wo sie als sozialer Beweis neben den
            * Sternen wirkt. Die Aussage ist nicht verschwunden, sie ist
            * einmal.
            * Nebenwirkung, gewollt: der Preis rueckt 47,6 px hoeher an die
            * Merkmalsliste heran.
            */}

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
            /* Die Mitteilung haengt auf dieser Kaufflaeche IN der
               Vertrauensliste darunter. Hier abgeschaltet — sonst stuende sie
               zweimal auf der Seite. */
            gewaehrleistungsHinweis={false}
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
      <Awake />
    </>
  );
}

/**
 * DIE VERTRAUENSLISTE — seit dem 2026-09-08 mit einer sechsten Zeile.
 *
 * Christian: „Der Button gesetzliche Garantie ist mega gross und komisch.
 * Das sollte einfach als weitere Zeile bei den Gimmicks aufgelistet werden."
 *
 * Die Mitteilung stand bis dahin als eigener Block unter dem Kauf-Button
 * (in <CacaoProductForm/>). Sie ist NICHT verschwunden und ihr WORTLAUT ist
 * unveraendert — sie ist eine Zeile geworden; die amtliche Grafik erscheint
 * weiterhin erst auf den ersten Klick.
 *
 * SIE STEHT BEWUSST ALS LETZTE. Die fuenf Zeilen darueber sind Zusagen, die
 * wir GEBEN; die sechste ist ein Recht, das der Kunde ohnehin HAT. Sie an
 * die Spitze zu stellen hiesse, ein gesetzliches Minimum als unsere
 * Leistung zu verkaufen.
 *
 * SEIT DEM 2026-09-11 TRAEGT SIE DIE BAUFORM DER VORLAGE (Vendoring-Nachzug
 * aus fd143bb, Elina EL-20260909-8c4001d1): <EuGewaehrleistungsListenpunkt/>
 * statt der hier von Hand gebauten Zeile <li>⚖️ <EuGewaehrleistungsHinweis/></li>.
 * BEIDE tun dasselbe — dieser Laden war mit seiner Fassung sogar ZUERST da
 * (2026-09-08, Christians Satz oben; die Vorlage zog am 09-09 nach).
 * Uebernommen wird sie trotzdem, und der Grund ist nicht Ordnungsliebe:
 *   (1) die Block-Bauform, die <EuGewaehrleistungsHinweis/> rendert, traegt
 *       seit dem 2026-09-08 ein BILD (Elina EL-20260908-d8349a01, 36 px).
 *       In einer Zeile mit ⚖️-Emoji stuenden damit ZWEI Zeichen nebeneinander,
 *       das zweite 2,5 Zeilen hoch — genau das „mega gross und komisch",
 *       gegen das Christians Satz gerichtet war.
 *   (2) die Datei, die die Pflichtmitteilung TRAEGT, ist K1 und soll es
 *       bleiben: sie ist die Stelle, an der die Verordnung (EU) 2025/1960
 *       gepflegt wird, und zwar oben. Eine eigene Kakao-Fassung haette
 *       genau diesen Pfad gekappt — vier Wochen vor dem Pflichttag
 *       27.09.2026.
 * Abstand, Schrift, Farbe und Zeichenhoehe sind GEERBT (kakao-seiten.css:
 * `.CacaoBenefitList ul { gap }`, `li { font-size }`, `.eu-gwl__zeichen
 * { height: 1em }`) — nachgebaute Zahlen laufen still auseinander.
 */
function CacaoBenefitList() {
  return (
    <div className="CacaoBenefitList">
      <ul>
        <li>✅ Kostenloser Versand ab 99 € innerhalb Deutschlands</li>
        <li>🚚 In 1-3 Tagen bei Dir</li>
        <li>🔄 100 % Geld-zurück-Garantie bei Unzufriedenheit</li>
        <li>🔬 Laboranalytisch geprüft (Dartsch Institut)</li>
        <li>🌿 Bio-zertifiziert nach DE-ÖKO-006</li>
        <EuGewaehrleistungsListenpunkt />
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
