import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {ABSENDER_MARKE, KAKAO_KOLLEKTION, SORTEN_PFADE} from '~/lib/kakao-zone';

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
    .query(SORTEN_QUERY, {
      variables: {awake: SORTEN_HANDLES.awake, create: SORTEN_HANDLES.create},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

/**
 * DIE ZWEI SORTEN-HANDLES — abgeleitet, nicht danebengeschrieben.
 *
 * `SORTEN_PFADE` in app/lib/kakao-zone.js ist seit s03 die SSoT dafuer, WELCHE
 * Seiten eine Sorte sind: sie steuert ueber `sorteZuPfad()` das Attribut
 * `data-cc-sorte` und damit den Farb-Akzent je Sorte. Wer eine dritte Sorte
 * anlegt, muss sie dort ohnehin eintragen, sonst bleibt sie farblos. Genau
 * deshalb wird hier daraus abgeleitet statt eine zweite Liste zu fuehren —
 * eine zweite Liste waere die naechste Stelle, die auseinanderlaeuft.
 */
const SORTEN_HANDLES = Object.freeze(
  Object.fromEntries(
    Object.entries(SORTEN_PFADE).map(([pfad, sorte]) => [
      sorte,
      pfad.split('/').pop(),
    ]),
  ),
);

/**
 * WAS DER KUNDE UNTER DER SORTE LIEST. Kein Versprechen, keine Wirkzusage,
 * keine Zahl — es ist woertlich die Unterscheidung, die schon im Aufmacher
 * derselben Seite steht ("Awake fuer den Start in den Tag, Create fuer den
 * klaren Kopf"). Sie beantwortet die einzige Frage, die der Kunde an dieser
 * Stelle hat: welche der zwei nehme ich. Der Beweis ist ein Closer und steht
 * auf der Kaufseite, nicht hier.
 */
const SORTEN_ORIENTIERUNG = Object.freeze({
  awake: 'Für den Start in den Tag.',
  create: 'Für den klaren Kopf.',
});

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Aufmacher />
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * DER AUFMACHER DER STARTSEITE — 2026-09-02 (s05).
 *
 * WAS VORHER DA STAND, gemessen am gerenderten HTML: eine <h1> mit dem
 * Kollektionsnamen "Zeremonie Kakao" und darunter sofort das Produktraster.
 * Kein Satz darüber, was das ist, für wen es ist, und wo es weitergeht — die
 * Startseite war eine Kategorieseite ohne Kategorieseiten-Zweck.
 *
 * WAS HIER BEWUSST *NICHT* STEHT, und das ist die wichtigere Hälfte:
 * KEINE Wirkzusage, KEINE Studie, KEINE Zahl. Die Startseite ist der Einstieg
 * (Awareness 1–2) — dort zieht sozialer Beweis, nicht Wissenschaft; der Beweis
 * ist ein Closer und gehört auf die Kaufseite, wo er auch steht. Der einzige
 * Vertrauensanker hier ist der Balken über der Kopfzeile, den s04 übertragen
 * hat (4,9/5,0, über 1.000 aktive Nutzer) — er steht ohnehin auf jeder Seite
 * und wird hier NICHT gedoppelt.
 *
 * WOHER DER TEXT KOMMT: die Zeile unter der Überschrift ist wörtlich der
 * Seitentitel, der seit s02 in `meta` steht ("Bio-Kakao aus zeremonieller
 * Ernte"). Der Knopf führt auf /pages/crystal-cacao — die Übersichtsseite, die
 * s04 nah an die Vorlage gebracht hat und die den Inhalt trägt. Die Startseite
 * verkauft nicht, sie erzeugt den nächsten Klick.
 */
function Aufmacher() {
  return (
    <section className="cc-aufmacher">
      <h1>{ABSENDER_MARKE}</h1>
      <p className="cc-lead">Bio-Kakao aus zeremonieller Ernte</p>
      <p className="cc-aufmacher-text">
        Zwei Sorten, ein Kakao — Awake für den Start in den Tag, Create für den
        klaren Kopf. Welche zu dir passt, siehst du in einer Minute.
      </p>
      <div className="cc-knopfreihe">
        <Link className="cc-knopf" to="/pages/crystal-cacao">
          Unseren Kakao ansehen
        </Link>
        <Link
          className="cc-knopf cc-knopf--ruhig"
          to={`/collections/${KAKAO_KOLLEKTION}`}
        >
          Alle Sorten
        </Link>
      </div>
    </section>
  );
}

/**
 * Die Kollektionskachel — bleibt, aber ohne die <h1>. Zwei <h1> auf einer Seite
 * waeren ein Struktur-, kein Geschmacksfehler; die Ueberschrift traegt jetzt
 * der Aufmacher.
 *
 * BILD-EHRLICHKEIT: die Kollektion `zeremonie-kakao` fuehrt im Shopify-Admin
 * KEIN Bild (gemessen 2026-09-02, `collection.image` ist null). Die Kachel
 * rendert deshalb heute nur ihren Titel. Das ist bewusst kein Platzhalterbild:
 * ein erfundenes Bild sieht wie Gestaltung aus und verdeckt, dass im Admin
 * etwas fehlt. -> Klicklisten-Punkt, nicht Code.
 *
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  const image = collection?.image;
  // OHNE BILD RENDERT DIESE KACHEL NUR IHREN EIGENEN TITEL — und der stand
  // gemessen als 39px-Ueberschrift "Zeremonie Kakao" zwischen dem Aufmacher
  // und dem Sortenraster, ohne etwas zu sagen, was nicht schon dasteht. Eine
  // Ueberschrift ohne Inhalt ist keine Gestaltung, sie ist eine leere Huelle
  // im Kleinen. Sobald im Shopify-Admin ein Kollektionsbild hinterlegt ist,
  // erscheint die Kachel von selbst wieder — das ist ein Klicklisten-Punkt,
  // kein Code-Fehler.
  if (!collection || !image) return null;
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
      <h2>{collection.title}</h2>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
/**
 * DIE SORTEN-SEKTION — 2026-09-03 (s06), und der Grund ist ein Screenshot.
 *
 * WAS HIER VORHER STAND, selbst gemessen am gerenderten HTML: die Ueberschrift
 * "Unsere Sorten" und darunter `collection.products(first: 4)` der Kollektion
 * `zeremonie-kakao`. Diese Kollektion fuehrt gemessen ACHT Produkte, und die
 * ersten vier davon ergaben ein Raster aus "Create – Bio", "Awake – Bio",
 * "Create - Bio" und "Create & Awake – Bio" — also CREATE ZWEIMAL, dazu ein
 * Buendel, unter einer Ueberschrift, die zwei Sorten verspricht. Der dritte
 * Eintrag war der Muell-Handle `crystal-cacao-adfiefiale`; in derselben
 * Kollektion liegt ausserdem ein Produkt mit dem woertlichen Titel
 * "Test Page - Crystal Cacao(R) Create spaeter wieder loeschen".
 *
 * WARUM DAS KEIN SCORE GEFANGEN HAT: die Rubrik gab dieser Startseite
 * 100 von 100. Sie misst Tokens, Rhythmus, Kontrast und Weissraum — sie kann
 * nicht wissen, dass zwei der vier Kacheln dasselbe Produkt zeigen. Ein Score
 * ist eine Diagnose ueber die Form, kein Urteil ueber die Wahrheit.
 *
 * WARUM DER FIX HIER SITZT UND NICHT IN DER KOLLEKTION: die Kollektion ist
 * als Sortiments-Zaun (s02) richtig — sie soll alles Kaufbare enthalten,
 * auch Buendel und Mengenrabatte, und die Kollektionsseite listet das zu
 * Recht. Falsch war die FRAGE dieser Sektion: sie fragte nach "den ersten
 * vier Produkten" und beschriftete die Antwort mit "Sorten". Es gibt genau
 * zwei Sorten, und die stehen in SORTEN_PFADE. Die Muell- und Testprodukte
 * bleiben davon unberuehrt und weiterhin erreichbar — das ist ein
 * Datenbefund fuer den Shopify-Admin und wird als solcher gemeldet, nicht
 * hier weggerendert.
 *
 * @param {{
 *   products: Promise<SortenQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <h2 id="recommended-products">Unsere Sorten</h2>
      <Suspense fallback={<div>Wird geladen …</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {['awake', 'create']
                .map((sorte) => [sorte, response?.[sorte]])
                .filter(([, produkt]) => Boolean(produkt))
                .map(([sorte, produkt]) => (
                  <div className="cc-sortenkachel" key={produkt.id}>
                    <ProductItem product={produkt} loading="eager" />
                    <p className="cc-sorten-orientierung">
                      {SORTEN_ORIENTIERUNG[sorte]}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </Await>
      </Suspense>
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

const SORTEN_QUERY = `#graphql
  fragment SortenProdukt on Product {
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
  query Sorten ($country: CountryCode, $language: LanguageCode, $awake: String!, $create: String!)
    @inContext(country: $country, language: $language) {
    awake: product(handle: $awake) {
      ...SortenProdukt
    }
    create: product(handle: $create) {
      ...SortenProdukt
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').SortenQuery} SortenQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
