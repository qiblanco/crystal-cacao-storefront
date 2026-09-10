import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {cacaoPricing} from '~/components/CacaoProductForm';
import {
  Aufmacher as VaAufmacher,
  Vorteile as VaVorteile,
  Herkunft as VaHerkunft,
  Stimmen as VaStimmen,
  Abschluss as VaAbschluss,
} from '~/components/startseite/Verkaufsauftritt';
import {Kakao} from '~/components/product-pages/Kakao';
import {waehleFassung} from '~/lib/startseite-fassung';
import {canonicalLink} from '~/lib/seo';
import {MockShopNotice} from '~/components/MockShopNotice';
import {ABSENDER_MARKE, KAKAO_KOLLEKTION, SORTEN_PFADE} from '~/lib/kakao-zone';
import {SORTEN} from '~/lib/sorten-profil';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    // DER TITEL BLEIBT WOERTLICH STEHEN, obwohl die Seite darunter eine
    // andere geworden ist — und das ist keine Nachlaessigkeit, sondern eine
    // Naht: `bin/scharfschalten` prueft vor Christians DNS-Klick den Marker
    // MARKER_START = 'Bio-Kakao aus zeremonieller Ernte' gegen `/`, um den
    // richtigen Bau vom Prototyp zu unterscheiden. Wer den Titel im selben
    // Zug austauscht, macht die Scharfschalt-Kette blind, ohne dass eine
    // Fehlermeldung entsteht.
    {title: `${ABSENDER_MARKE} – Bio-Kakao aus zeremonieller Ernte`},
    // Beschreibung und Canonical wandern von /pages/crystal-cacao hierher
    // mit: die Seite ist dieselbe, ihre Adresse ist jetzt `/`. Ohne den
    // Canonical zeigte die Startseite weiter auf die Adresse, die sie
    // gerade an sich gezogen hat.
    {
      name: 'description',
      content:
        'Crystal Cacao® – High Performance Cacao. Wach. Klar. Mineralisiert. 100 % reiner Premium-Naturkakao aus Peru.',
    },
    canonicalLink('/'),
  ];
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
async function loadCriticalData({context, request}) {
  const [{collection}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY, {
      variables: {handle: KAKAO_KOLLEKTION},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collection,
    // Die Fassung wird SERVERSEITIG entschieden, nicht im Browser: sonst
    // rendert der Server das eine und der Browser das andere, und React
    // wirft einen Hydration-Fehler statt einer Seite.
    fassung: waehleFassung(request),
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
 *
 * SEIT DEM 2026-09-10 STEHT DER SATZ NICHT MEHR HIER, sondern in
 * app/lib/sorten-profil.js (Feld `kurz`) — Job 20260910-BAU-sortenbloecke-...
 * Grund: er hat seither einen ZWEITEN Leser. Der Sorten-Aufmacher der einen
 * Kaufseite verweist auf die andere Sorte und nennt dabei genau diesen Satz
 * ("Lieber Create? Fuer den klaren Kopf."). Zwei Kopien desselben Satzes
 * waeren die naechste Stelle, an der die zwei Sorten auseinanderlaufen —
 * und der Kunde laese auf der Startseite etwas anderes als auf der
 * Kaufseite. Der Wortlaut ist beim Umzug zeichengleich geblieben.
 */
const SORTEN_ORIENTIERUNG = Object.freeze(
  Object.fromEntries(
    Object.entries(SORTEN).map(([sorte, profil]) => [sorte, profil.kurz]),
  ),
);

/**
 * DIE MENGE, DIE DIE KACHEL ZEIGT — 2026-09-08.
 *
 * Christian: „Auf der Startseite steht bei beiden Sorten €71.03, auf der
 * Produktseite 53,- € (gestrichen 76,- €). Ein Besucher sieht auf der
 * Startseite den hoechsten Preis ohne Rabatt und klickt weg, bevor er das
 * Angebot je sieht."
 *
 * BEIDE ZAHLEN WAREN RICHTIG, sie beantworteten nur verschiedene Fragen. 71,03
 * ist der NETTO-Betrag der Variante aus der Storefront-API; die Kaufseite
 * rechnet daraus ueber `cacaoPricing()` Brutto (7 % Kakao-Satz) und die
 * Mengenstaffel: 71,03 -> 76,- € einzeln, 53,- € pro Packung im Dreierbund.
 * Die Kaufseite steht dabei auf `useState('3')`
 * (app/routes/products.crystal-cacao-awake.jsx), zeigt also den Dreierbund —
 * und genau den zeigt die Kachel jetzt auch.
 *
 * WARUM DIE ZAHL HIER TROTZDEM NICHT ERFUNDEN IST: gerechnet wird
 * ausschliesslich mit `cacaoPricing()` aus dem K1-Bauteil CacaoProductForm;
 * diese Datei kennt keine Preiszahl. Und weil die Kaufseite ihre Menge in
 * einer eigenen Datei fuehrt, ist die GLEICHHEIT der beiden Anzeigen eine
 * MESSGROESSE und keine Zusage: `crystal-cacao-node/proben/probe_sofortfehler.py`
 * vergleicht Achse (1) den Kachelpreis mit dem Hauptpreis der Kaufseite und
 * geht rot, sobald sie auseinanderlaufen.
 */
const KACHEL_MENGE = '3';

/**
 * Der Preisblock der Sortenkachel: derselbe Betrag, dieselbe Schreibweise und
 * dieselbe Rabattlogik wie auf der Kaufseite — plus die eine Zeile, die auf der
 * Kaufseite das Dropdown darunter liefert („3x 420g … pro Packung"). Ohne sie
 * waere „53,- €" auf einer Kachel ohne Mengenwahl eine halbe Wahrheit.
 */
function KachelPreis({produkt}) {
  const preis = cacaoPricing(
    KACHEL_MENGE,
    {price: produkt?.priceRange?.minVariantPrice},
    produkt?.handle,
  );
  return (
    <div className="cc-kachel-preis">
      <span className="cc-kachel-preis-jetzt">{preis.price}</span>
      {preis.compareAt ? (
        <s className="cc-kachel-preis-vorher">{preis.compareAt}</s>
      ) : null}
      <span className="cc-kachel-preis-hinweis">
        pro Packung im {KACHEL_MENGE}er-Set
      </span>
    </div>
  );
}

/**
 * DIE STARTSEITE IST SEIT DEM 2026-09-08 „UNSER KAKAO".
 *
 * Christian, woertlich: „Oder andere Frage: ist ‚Unser Kakao' nicht die
 * bessere Frontseite — ich wuerde sagen schon. Also das ist redundant.
 * Einfach diese Version uebernehmen, ‚Unser Kakao', und die andere
 * Frontseite loeschen."
 *
 * DAS IST EINE UEBERNAHME, KEIN NEUBAU — und das ist der ganze Punkt. Der
 * Vorgaengerbau hatte am selben Tag eine dritte Startseite als ENTWURF
 * gebaut (Verkaufsauftritt, unten). Christians Antwort darauf war nicht „so
 * nicht", sondern „das gibt es schon": die Seite /pages/crystal-cacao
 * beantwortet die Funnel-Fragen (warum dieser Kakao, was ist drin, wer hat
 * es geprueft, 20 Tage risikofrei) seit Wochen und steht live. Sie wird
 * uebernommen, statt ein zweites Mal gebaut zu werden.
 *
 * WAS AUS DEM ENTWURF MITKOMMT — und was ausdruecklich NICHT:
 *   MIT: die drei echten Google-Bewertungen (<VaStimmen/>) und die zwei
 *        Sortenkacheln mit dem korrigierten Preis. Beides fehlte der
 *        Kakao-Seite: sozialer Beweis und der Kaufweg mit Preis.
 *   OHNE: Aufmacher, „Warum unser Kakao" (4 Vorteile), „Woher er kommt",
 *        „20 Tage testen". Jedes davon steht auf dieser Seite bereits —
 *        Hero, Benefits (Wach/Klar/Mineralisiert/Antioxidantien/100 %
 *        naturrein), ComparisonTable (843 mg / 158 mg / 21 mg) und „Unser
 *        Versprechen an dich" (20 Tage, Geld zurueck). Sie ein zweites Mal
 *        einzuhaengen waere genau die Redundanz, die dieser Auftrag
 *        abstellt.
 *
 * DIE ANDEREN ZWEI FASSUNGEN SIND NICHT WEG, sie sind abgelegt:
 * `/?fassung=bestand` zeigt die alte Startseite, `/?fassung=entwurf` den
 * Verkaufsauftritt. Loeschen ist Christians Perimeter; der Rueckweg dieses
 * Baus ist eine Zeile in app/lib/startseite-fassung.js.
 */
export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  if (data.fassung === 'entwurf') return <Verkaufsauftritt data={data} />;
  if (data.fassung === 'bestand') return <Bestandsfassung data={data} />;
  return (
    <div className="home home--kakao">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Kakao
        stimmen={<VaStimmen />}
        sorten={<RecommendedProducts products={data.recommendedProducts} />}
      />
    </div>
  );
}

/**
 * DIE ALTE STARTSEITE — ersetzt, nicht vernichtet.
 *
 * Der Auftrag sagt woertlich: „Inhalt und Fassung bleiben lesbar abgelegt",
 * und „endgueltiges Loeschen ist Christians Perimeter". Sie ist unter
 * `/?fassung=bestand` abrufbar und unveraendert — inklusive der zwei
 * Kopf-Schaltflaechen, an denen Achse (6b) von proben/probe_sofortfehler.py
 * ihren Rot-Nachweis vom 2026-09-08 haengen hat. Ohne diese Ablage waere
 * jener Nachweis mit dem Umbau lautlos verfallen: der Anker verschwindet
 * durch legitimen Umbau, der Mutant wird gar nicht mehr gebaut, und die
 * Probe meldet statt eines Befunds eine leere Menge.
 */
function Bestandsfassung({data}) {
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
 * DIE STARTSEITE ALS VERKAUFSAUFTRITT — Teil 2 des Auftrags vom 2026-09-08.
 *
 * UEBERHOLT AM SELBEN TAG, und deshalb steht sie noch hier: Christian hat
 * die Frage, die dieser Entwurf beantworten sollte, anders entschieden —
 * „Unser Kakao" IST die bessere Frontseite, und die gab es schon. Der
 * Entwurf ist damit nicht verworfen worden, weil er schlecht war, sondern
 * weil die Antwort im Bestand lag (P10). Was er BEIGETRAGEN hat, steht
 * jetzt auf der Startseite: die drei echten Bewertungen.
 *
 * Er bleibt unter `/?fassung=entwurf` (und weiter unter `?entwurf=1`)
 * abrufbar; der Schalter und seine Begruendung stehen in
 * app/lib/startseite-fassung.js.
 *
 * DIE REIHENFOLGE IST DER GANZE UNTERSCHIED und sie ist nicht Geschmack:
 * Aufmacher (worum geht es) -> Nutzen (warum dieser Kakao) -> Beleg (Herkunft
 * und Laboranalyse) -> Menschen (drei echte Google-Bewertungen) -> Wahl
 * (welche der zwei Sorten) -> Abschluss (Risikoumkehr, Versand, Kaufweg).
 * Die Sortenkacheln bleiben, sie stehen nur nicht mehr allein und nicht mehr
 * am Anfang: die Frage „welche nehme ich" kommt nach der Frage „will ich das
 * ueberhaupt", nie davor.
 */
function Verkaufsauftritt({data}) {
  return (
    <div className="home home--verkaufsauftritt">
      {data.isShopLinked ? null : <MockShopNotice />}
      <VaAufmacher />
      <VaVorteile />
      <VaHerkunft />
      <VaStimmen />
      <RecommendedProducts products={data.recommendedProducts} />
      <VaAbschluss />
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
        <Link className="cc-knopf" to="/">
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
                  <div
                    className="cc-sortenkachel"
                    // DIE EINE ZEILE, DIE ROSA UND BLAU AUF EINE FLAECHE
                    // BRINGT — s03, 2026-09-04.
                    //
                    // `data-cc-sorte` ist KEIN neues Merkmal: es ist genau der
                    // Schalter, den app/styles/kakao-seiten.css seit dem
                    // 2026-09-02 fuehrt ([data-cc-sorte='awake'|'create']
                    // setzen --cc-sorte / --cc-sorte-text / --cc-sorte-flaeche
                    // um). Bisher stand er nur an <html>, gesetzt aus
                    // sorteZuPfad() in root.jsx — und weil eine ROUTE immer nur
                    // EINE Sorte sein kann, konnten sich die beiden Sortenfarben
                    // bauartbedingt nie begegnen. Gemessen (s01): jede Farbe kam
                    // auf genau EINER Seite genau EINMAL vor.
                    //
                    // Hier steht der Schalter zum ersten Mal an einem TEILBAUM
                    // statt an der Seite. Damit tragen die zwei Kacheln
                    // nebeneinander ihre eigene Sortenfarbe, ohne dass eine
                    // zweite Mechanik, eine zweite Farbe oder eine Aenderung an
                    // den (K1-)Sortenrouten noetig waere. Die Startseite ist die
                    // einzige Flaeche des Ladens, auf der beide Sorten
                    // gleichberechtigt stehen — deshalb hier und nirgends sonst.
                    data-cc-sorte={sorte}
                    key={produkt.id}
                  >
                    <ProductItem
                      product={produkt}
                      loading="eager"
                      preisSlot={<KachelPreis produkt={produkt} />}
                    />
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
