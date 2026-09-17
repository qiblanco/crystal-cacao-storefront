import {bildQuelle} from '../reusables/shopifyBildQuellen';
import {Belege} from '../reusables/Belege';
import {AbsichtHinweis} from '../reusables/AbsichtHinweis';
import {KAKAO_KENNZAHLEN} from '~/lib/kakao-zone';
import {ActiveCampaignForm} from '../reusables/ActiveCampaignForm';
import {SwipeTable} from '../reusables/SwipeTable';

/* ======================================================================
 * BILDLAST DER STARTSEITE — gemessene Leiter je Datei, nicht geraten.
 * Job 20260917-erst-schnell-dann-scharf-ladeverhalten-beider-laeden, s05.
 * ======================================================================
 *
 * DER GEMESSENE ANLASS (2026-09-17, crystal-cacao.com, 25-s-Fenster,
 * gedrosselt 1,6 Mbit/150 ms, Median aus 3 Laeufen):
 *   mobil    LCP 10 112 ms · CLS 0,1019 · 4 312 879 Bildbytes auf 21 Ressourcen
 *   desktop  LCP  1 724 ms · CLS 0,0023 · 4 200 492 Bildbytes auf 23 Ressourcen
 * DAS TELEFON LUD MEHR ALS DER RECHNER. Genau das ist die Signatur einer
 * Seite ohne responsive Auslieferung: jedes <img> hier trug eine nackte
 * CDN-Adresse ohne `srcset`, ohne `sizes` und ohne `loading` — also die
 * MASTERDATEI, in voller Groesse, und zwar alle gleichzeitig beim ersten
 * Blick. Am gerenderten DOM gemessen kamen mobil 6000 px in eine 358-px-
 * Flaeche (2024-06-qiblanco-bali-06610, 1 655 856 B) und 568 px in eine
 * 50-px-Flaeche (kakao-bean-logo).
 *
 * WARUM DIE LEITER JE DATEI STEHT UND NICHT EINE PAUSCHALE IST
 * Das Shopify-CDN kodiert bei einem Breiten-Parameter NEU — und eine
 * Sprosse kann dabei GROESSER werden als der Master. Je Datei und je
 * Sprosse am CDN nachgemessen (curl, Accept: image/avif,image/webp,
 * Belege in homepage-bauer/ladeverhalten/belege_s05/cdn_leiter.json):
 * bei den 1000–1024-px-Mastern liegt `width=840` um 4,7 bis 6,4 Prozent
 * UEBER der Masterdatei. Solche Sprossen stehen hier deshalb NICHT in der
 * Leiter — sonst macht ausgerechnet der Fix das Bild schwerer. Aufgenommen
 * ist nur, was gemessen KLEINER ist als der Master, plus der Master selbst
 * als oberste Sprosse. Wer eine Sprosse ergaenzt, misst sie vorher nach.
 *
 * WARUM DER MASTER BEI DREI DATEIEN FEHLT
 * bali-06610 (6000 px, 1,66 MB), DSC01925 (3827 px, 1,20 MB) und
 * kakao-bean-logo (568 px fuer eine 50-px-Flaeche) sind fuer JEDE Flaeche
 * dieser Seite zu gross. Ihre Leiter endet unter dem Master; die oberste
 * Sprosse deckt noch DPR 2 auf dem breitesten gemessenen Aufbau.
 *
 * DIE `sizes`-WERTE SIND GEMESSEN, NICHT GESCHAETZT: die Boxbreiten wurden
 * an neun Viewport-Breiten (360…1920) am gerenderten DOM abgelesen
 * (belege_s05/boxbreiten_sweep.json). Zwei Familien:
 *   HALBSPALTE  bis 639 px volle Spalte (100vw − 64), darueber halbe
 *               Spalte ((100vw − 96)/2), ab 1280 gedeckelt auf 548.
 *   BANNER      volle Breite (100vw − 32), ab 1184 gedeckelt auf 1152.
 *
 * FAIL-SOFT: `bild()` gibt eine unbekannte Adresse UNVERAENDERT zurueck —
 * ein neues Bild verhaelt sich dann genau wie vorher, statt auf eine
 * geratene Leiter zu fallen.
 */
const SIZES_HALBSPALTE =
  '(min-width: 1280px) 548px, (min-width: 640px) calc((100vw - 96px) / 2), calc(100vw - 64px)';
const SIZES_BANNER = '(min-width: 1184px) 1152px, calc(100vw - 32px)';
const SIZES_LOGO = '50px';

const B_HERO =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001273-v2b-min.jpg_1.webp?v=1669001851';
const B_SNIPPET =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet.jpg?v=1771790329';
const B_SNIPPET_BEANS =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet-beans.jpg?v=1771790303';
const B_LOGO_KAKAO =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-bean-logo.png?v=1764252027';
const B_LOGO_KAFFEE =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/coffee-logo.png?v=1763976173';
const B_LOGO_ENERGY =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/energy-logo.png?v=1763976173';
const B_CHART =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/chart-kakao.webp?v=1763974217';
const B_BANNER_FLOW =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06610.jpg?v=1763050714';
const B_BANNER_NATURREIN =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC00308_Kopie.webp?v=1763062180';
const B_SETZLING =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-image.webp?v=1759153567';
const B_MUSTER =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-muster.webp?v=1759179332';
const B_BAUER_FRUCHT =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01510_Kopie.webp?v=1759179020';
const B_BAUER_TONNE =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01925.jpg?v=1764116026';
const B_KURS_MOCKUP =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Mockup-Kakao-Zeremonie-Kurs-v2-2x-1024x599.jpg_1_1.webp?v=1760876274';
const B_RITUAL_HOCH =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06493.webp?v=1764201756';
const B_RITUAL_QUADRAT =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06493-1x1.webp?v=1764201756';
const KURS_VIDEO_1 =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001190-Kopie-1024x589_jpg.webp?v=1666617198';
const KURS_VIDEO_2 =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001239-Kopie-1024x591.jpg_1_cf7bfbf2-2e9f-4654-a51a-e0f2b618501f.webp?v=1679327538';
const KURS_VIDEO_3 =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-ad-01_2.1.1-min.jpg_1_2b439bb6-ccde-4801-a43f-d36eb669cee5.webp?v=1679327670';
const KURS_VIDEO_4 =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-ad-03_4.2.1-min.jpg_1_329aa829-10d5-4d95-a779-1dd0a92d0397.webp?v=1679328304';

/**
 * Gemessene Leiter, `sizes` und Eigenmasse je Datei.
 * `breite`/`hoehe` sind die INTRINSISCHEN Masse der Masterdatei (am DOM
 * abgelesen, belege_s05/dom_vorher_*.json). Sie stehen als width/height am
 * <img> und reservieren den Platz, bevor das Bild da ist — das ist die
 * Haelfte gegen das Nachrutschen (CLS 0,1019 mobil).
 */
const BILDER = new Map([
  [B_HERO, {leiter: [300, 420, 550, 660, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 1000}],
  [B_SNIPPET, {leiter: [300, 420, 550, 660, 840, 935], sizes: SIZES_HALBSPALTE, breite: 935, hoehe: 935}],
  [B_SNIPPET_BEANS, {leiter: [300, 420, 550, 660, 840, 953], sizes: SIZES_HALBSPALTE, breite: 953, hoehe: 953}],
  [B_LOGO_KAKAO, {leiter: [50, 100, 150], sizes: SIZES_LOGO, breite: 568, hoehe: 568}],
  [B_LOGO_KAFFEE, {leiter: [50, 126], sizes: SIZES_LOGO, breite: 126, hoehe: 126}],
  [B_LOGO_ENERGY, {leiter: [50, 125], sizes: SIZES_LOGO, breite: 125, hoehe: 125}],
  [B_CHART, {leiter: [300, 420, 550, 660, 840, 1100, 1404], sizes: SIZES_HALBSPALTE, breite: 1404, hoehe: 963}],
  [B_BANNER_FLOW, {leiter: [360, 480, 620, 740, 1000, 1160, 1500, 2320], sizes: SIZES_BANNER, breite: 6000, hoehe: 4000}],
  [B_BANNER_NATURREIN, {leiter: [360, 480, 620, 740, 937], sizes: SIZES_BANNER, breite: 937, hoehe: 528}],
  [B_SETZLING, {leiter: [300, 420, 550, 660, 766], sizes: SIZES_HALBSPALTE, breite: 766, hoehe: 1002}],
  [B_MUSTER, {leiter: [300, 420, 550, 660, 766], sizes: SIZES_HALBSPALTE, breite: 766, hoehe: 766}],
  [B_BAUER_FRUCHT, {leiter: [300, 420, 550, 660, 840, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 1500}],
  [B_BAUER_TONNE, {leiter: [300, 420, 550, 660, 840, 1100, 1650], sizes: SIZES_HALBSPALTE, breite: 3827, hoehe: 5740}],
  [B_KURS_MOCKUP, {leiter: [300, 420, 550, 660, 840, 1024], sizes: SIZES_HALBSPALTE, breite: 1024, hoehe: 599}],
  [B_RITUAL_HOCH, {leiter: [300, 420, 550, 660, 840, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 1500}],
  [B_RITUAL_QUADRAT, {leiter: [300, 420, 550, 660, 840, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 1000}],
  [KURS_VIDEO_1, {leiter: [300, 420, 550, 660, 1024], sizes: SIZES_HALBSPALTE, breite: 1024, hoehe: 589}],
  [KURS_VIDEO_2, {leiter: [300, 420, 550, 660, 1024], sizes: SIZES_HALBSPALTE, breite: 1024, hoehe: 591}],
  [KURS_VIDEO_3, {leiter: [300, 420, 550, 660, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 563}],
  [KURS_VIDEO_4, {leiter: [300, 420, 550, 660, 1000], sizes: SIZES_HALBSPALTE, breite: 1000, hoehe: 563}],
]);

/**
 * Bildquellen als Spread ins <img>: src + srcSet + sizes + width + height.
 *
 * Eine Adresse, die hier nicht steht, kommt UNVERAENDERT zurueck. Das ist
 * Absicht und keine Nachlaessigkeit: ein falsch geratener Breiten-Parameter
 * an einem fremden Host waere ein 404 statt eines nur nicht optimierten
 * Bildes, und eine geratene Leiter ist keine gemessene.
 */
function bild(url) {
  const e = BILDER.get(url);
  if (!e) return {src: url};
  return {
    ...bildQuelle(url, e.leiter),
    sizes: e.sizes,
    width: e.breite,
    height: e.hoehe,
  };
}

/**
 * DIE UEBERSICHTSSEITE — und seit dem 2026-09-08 die STARTSEITE.
 *
 * Christian: „ist ‚Unser Kakao' nicht die bessere Frontseite — ich wuerde
 * sagen schon. Also das ist redundant. Einfach diese Version uebernehmen."
 * `/` rendert seither genau diese Komponente; `/pages/crystal-cacao` leitet
 * dauerhaft (301) hierher.
 *
 * DIE ZWEI SLOTS, und warum es Slots sind und keine festen Sektionen:
 * diese Datei ist K2 gegen die qiblanco-Vorlage (shared/UPSTREAM.json) und
 * wird dort weiter als UNTERSEITE gerendert. Was nur die STARTSEITE braucht,
 * darf ihr deshalb nicht fest eingebaut werden — sonst traegt die
 * Unterseite es mit, und der naechste Vendoring-Nachzug hat eine Abweichung
 * mehr zu erklaeren. Beide Slots sind optional; ohne sie rendert die Seite
 * exakt wie zuvor.
 *
 *   stimmen  — die drei echten Google-Bewertungen. Sie stehen NACH dem
 *              Beleg-Block und VOR dem Versprechen: erst was drin ist und
 *              wer es geprueft hat, dann wer es getrunken hat, dann die
 *              Risikoumkehr. Sozialer Beweis zieht, aber er zieht erst,
 *              wenn der Leser weiss, worum es geht.
 *   podcast  — der Podcast-Einstieg. Er steht direkt hinter `Benefits`,
 *              also an dritter Stelle der Seite: die Seite hat gerade
 *              „wach / klar / mineralisiert / naturrein" behauptet, und die
 *              naechste Frage eines Fremden ist „ja, und wodurch unterscheidet
 *              sich das von dem Kakaopulver aus dem Supermarkt?". Genau die
 *              beantwortet die eingestellte Stelle der Folge — und der
 *              Vergleich mit Kaffee/Energy-Drink direkt darunter liefert
 *              danach die Zahlen. Er steht bewusst VOR `ComparisonTable`
 *              und NICHT zwischen `SideToSideWithTable` und
 *              `ComparisonTable`: die beiden sind ein Paar (dieselbe Frage,
 *              einmal als Text, einmal als Tabelle) und werden nicht getrennt.
 *   sorten   — die zwei Sortenkacheln mit Preis. Sie stehen direkt hinter
 *              dem Versprechen, also an der Stelle, an der die Frage von
 *              „will ich das" auf „welche nehme ich" kippt. Sie tragen
 *              ausserdem den Preis-Fix des Vorgaengerbaus (Achse 1 von
 *              probe_sofortfehler.py); ohne sie waere er auf der Startseite
 *              nicht mehr messbar.
 *
 * @param {{stimmen?: import('react').ReactNode, sorten?: import('react').ReactNode, podcast?: import('react').ReactNode}} props
 */
export function Kakao({stimmen = null, sorten = null, podcast = null} = {}) {
  return (
    <div className="ProductPageKakao">
      <h1 className="text-6xl! text-center mb-[0px]!">High Performance Cacao</h1>
      <h2 className="text-5xl! text-center mt-5!">Wach. Klar. Mineralisiert.</h2>
      <Hero />
      <Benefits />
      {podcast}
      <SideToSideWithTable />
      <ComparisonTable />
      <Belege id="cc-pruefdokumente" />
      {/* Der Verweis steht DIREKT hinter den Pruefdokumenten und nicht am
          Seitenende: wer gerade gesehen hat, dass es Analysen gibt, ist genau
          der Leser, den die Frage „warum machen die das" erreicht. */}
      <AbsichtHinweis id="cc-absicht-start" />
      {stimmen}
      <HerobannerWithText
        text="Wach. Klar. Im Flow."
        src={B_BANNER_FLOW}
        imgAlt="Zwei Menschen an einem Cafétisch, sie mit einem Tablet, er am Laptop, daneben zwei Tassen"
      />
      <div className="flex flex-col NormalSectionSize gap-3 items-center justify-center">
        <h2 className="text-2xl">Unser Versprechen an dich</h2>
        <p>
          <b>Crystal Cacao®</b> liefert dir ein{' '}
          <b>besseres Gefühl, mehr Klarheit und stabile Energie.</b> Wenn nicht,
          bekommst du dein Geld zurück – ohne Diskussion.
        </p>
        <p>
          <b>20 Tage testen - komplett risikofrei</b>
        </p>
        <p>
          <b>100 % Geld-zurück-Garantie, selbst bei geöffneter Packung.</b>
        </p>
        <p>
          Nicht zufrieden? Einfach zurücksenden und wir erstatten dir alles.
        </p>
      </div>
      {sorten}
      <HerobannerWithText
        text="100% naturrein"
        src={B_BANNER_NATURREIN}
        imgAlt="Hände schneiden eine reife Kakaofrucht mit einer Gartenschere direkt vom Baum"
      />
      <SparSection />
      <MusterSection />
      <WurzelnSection />
      <Zubereitung />
      <RitualSection />
      <OnlineKurs />
      <KursInhalt />
      <KursRegistration />

      <div className="my-[10vh]! NormalSectionSize">
        <h2>Wusstest du?</h2>
        <p>Nach dem Vermahlen bekommt unser Kakao Zeit statt Tempo: Er ruht,
        bis er langsam auskristallisiert – daher das feine Kristallmuster, das
        du im Bruch der Tafel siehst.</p>
        <p>👉 Wie du ihn zubereitest und welche Sorte zu dir passt, findest du
        bei AWAKE und CREATE.</p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-col gap-10 NormalSectionSize items-center sm:flex-row mt-[50px]!">
      <div className="flex-1 justify-center self-stretch flex flex-col">
        <div className="block sm:hidden">
          {/* DAS ERSTE SICHTBARE BILD DER SEITE — `eager` und
              fetchPriority="high" statt `lazy`, weil es der LCP-Kandidat
              ist: was oben steht, darf nicht hinten anstehen. Beide
              Aufmacher-Fassungen (diese und die sm:-Fassung weiter unten)
              zeigen DIESELBE Datei; der Browser holt sie einmal.
              VORHER stand hier <LazyImage/>, das eine zweite, kleinere Datei
              (…_small…) als Vorstufe NACHLUD — zwei Anfragen fuer ein Bild.
              Die Vorstufe ist mit `srcset` gegenstandslos: die passende
              Sprosse ist bereits klein. */}
          <img
            {...bild(B_HERO)}
            alt="Tasse Crystal Cacao neben der Kakaotafel auf hellem Holz"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <h2 className="text-2xl">Crystal Cacao® - Bio</h2>
        <div className="text-2xl font-bold">
          {KAKAO_KENNZAHLEN.bewertung}{' '}
          {/* Klasse "d" = rein darstellend: die Zeile ZEIGT die Bewertung und
              springt bewusst nirgendwohin — diese Seite hat keinen
              Bewertungsbereich (Christians ausdrueckliche Cacao-No-Op-Vorgabe,
              s. sterne-klick-scroll-wache). Marker-Vertrag: StarRating.jsx. */}
          <span className="qb-sterne" data-qb-rating="d">
            ★★★★★
          </span>
        </div>
        <h3 className="text-2xl font-bold">
          Mehr als {KAKAO_KENNZAHLEN.nutzer}+ aktive Nutzer
        </h3>
        {/* s03, 2026-09-04: war die Tailwind-Freiwert-Klasse text-[#4A4741] —
            der letzte systemfremde Farbwert des ganzen Ladens (gemessen: nach
            allen anderen Fixes genau EIN Element auf genau EINER Route). Der
            Wert liegt dem Haus-Ton --cc-text #2C2A26 nahe, ist aber ein
            eigener; eine Freiwert-Klasse haengt an keinem Token und zieht bei
            einer Aenderung der Skala nicht mit. */}
        <div className="text-lg text-gray-800">
          Erfahre jetzt die Vorteile von Kristall Kakao
        </div>
        <div>
          <ul className="m-[22px]!">
            <li className="list-disc">
              Für 28 Tage - Klarheit, Fokus & Energie
            </li>
            <li className="list-disc">11x mehr Antioxidantien als Kakao</li>
            <li className="list-disc">24 Mineralstoffe & Spurenelemente</li>
            <li className="list-disc">100 % reiner Premium-Naturkakao</li>
          </ul>
        </div>
        <p className="font-bold">
          {' '}
          ✅ Wissenschaftlich geprüft - direkt spürbar!{' '}
        </p>
        <div className="flex gap-3 mt-2">
          <a href="/products/crystal-cacao-create" className="btn--primary">
            Jetzt kaufen
          </a>
          <a
            href="#cc-pruefdokumente"
            className="btn--secondary border-none! bg-[#00000025]"
          >
            Analyse anzeigen
          </a>
        </div>
        <div className="text-center mt-2 m-auto self-center">
          <b>100% Zufriedenheitsgarantie · Geprüfte Bio-Qualität</b>
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden sm:block hidden">
        <img
          {...bild(B_HERO)}
          alt="Tasse Crystal Cacao neben der Kakaotafel auf hellem Holz"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <div className="flex flex-col sm:flex-row! items-center NormalSectionSize mt-[10vh]! gap-10">
      <div className="flex-1 flex flex-col gap-10">
        <div>
          <h2>Wach</h2>
          <p>
            Unsere Nutzer mögen, dass man wach ist, ohne sich aufgedreht zu
            fühlen. Wenig Koffein, kombiniert mit natürlichem Theobromin, sorgt
            für ein ruhiges, klares Gefühl.
          </p>
        </div>
        <div>
          <h2>Klar.</h2>
          <p>
            Viele Nutzer merken, dass sie ruhiger und klarer im Kopf sind und
            sich besser konzentrieren können.
          </p>
        </div>
        <div>
          <h2>Mineralisiert.</h2>
          <p>
            Ein unkomplizierter Begleiter für jeden Tag – mit 24 natürlich
            enthaltenen Mineralstoffen und Spurenelementen.
          </p>
        </div>
        <div>
          <h2>Antioxidantien-Boost.</h2>
          <p>
            Reine Pflanzenkraft, ganz ohne Zucker. Eine Tasse Kristall Kakao®
            liefert viele natürlich enthaltene Antioxidantien – pur,
            unverfälscht und ohne Zusätze.
          </p>
        </div>
        <div>
          <h2>100% naturrein.</h2>
          <p>
            Aus einer überlieferten Kakaolinie mit mehr als 6.300 Jahren
            Ursprung. Naturbelassen, unverfälscht und in Bio-Qualität.
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <img
          {...bild(B_SNIPPET)}
          alt="Crystal Cacao in der Tasse, daneben gebrochene Kakaostuecke"
          loading="lazy"
        />
        <img
          {...bild(B_SNIPPET_BEANS)}
          alt="Geoeffnete Kakaofrucht mit den hellen Bohnen im Fruchtfleisch"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    {
      label: (
        <>
          Polyphenole &amp;
          <br /> Flavanole
        </>
      ),
      kakao: '843 mg',
      kaffee: {value: '300 mg', highlight: true},
      energy: '-',
    },
    {label: 'Theobromin', kakao: '158 mg', kaffee: '-', energy: '-'},
    {
      label: 'Coffein',
      kakao: '21 mg',
      kaffee: {value: '80 – 100 mg'},
      energy: {value: '80 mg'},
    },
    {label: 'Phenylethylamin (PEA)', kakao: '1,5 mg', kaffee: '-', energy: '-'},
    {label: 'Anandamid', kakao: '9 µg', kaffee: '-', energy: '-'},
    {label: 'L-Tryptophan', kakao: '3 mg', kaffee: '-', energy: '-'},
  ];

  const cell = (val) => {
    if (val === '-')
      return <td className="text-center py-2 px-3 text-gray-400">–</td>;
    const isObj = typeof val === 'object' && val !== null && 'value' in val;
    return (
      <td className="text-center py-2 px-3">
        <p
          className={
            isObj && val.highlight
              ? 'text-orange-500 font-medium text-sm!'
              : 'font-medium text-sm!'
          }
        >
          {isObj ? val.value : val}
        </p>
      </td>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[100px]! NormalSectionSize">
      {/* Left: table */}
      <div className="flex flex-col gap-4">
        {/* Baukasten qb-swipetab: die Beschriftungsspalte bleibt stehen, die
            Wertspalten sind wischbar. Ohne das lief die Tabelle auf dem Handy
            rechts aus dem Bild (gemessen: 374 px Bedarf gegen 326 px Platz).
            Rahmen + Radius sitzen auf dem Wrapper, NICHT auf dem <table> —
            ein Radius am <table> braucht overflow:hidden, und das tötet sticky. */}
        <SwipeTable
          className="qb-swipetab--zebra rounded-xl border border-gray-200"
          label="Nährstoff-Vergleich Crystal Cacao, Kaffee, Energydrink — horizontal wischbar"
        >
          {/* cc-vgl: EIN Kopf-Stil fuer alle drei Vergleichsspalten (Groesse,
              Zeilenhoehe, Abstand der Mengenangabe) — die Regeln stehen in
              app/styles/kakao-seiten.css, NICHT je Zelle. Vorher trug jede
              Kopfzelle nur `text-sm`, und das griff nicht: `main h3` und der
              K1-Neutralisierer `main h3[style]` (!important) hoben alle drei
              auf 25 px. "Crystal Cacao®" brach dadurch als einziger Kopf auf
              zwei Zeilen um und zog seine Mengenangabe 15,6 px nach unten.
              Das <colgroup> deklariert die Spaltenaufteilung, statt sie dem
              Auto-Layout zu ueberlassen. KEINE feste Breite und kein
              table-layout:fixed — beides wuerde den Wisch-Baukasten
              (qb-swipetab) auf dem Handy aushebeln. */}
          <table className="cc-vgl w-full text-sm">
            <colgroup>
              <col className="cc-vgl__spalte-label" />
              <col className="cc-vgl__spalte-wert" />
              <col className="cc-vgl__spalte-wert" />
              <col className="cc-vgl__spalte-wert" />
            </colgroup>
            <thead>
              {/* Trennlinie auf den <th>, NICHT auf dem <tr>: der Baukasten schaltet
                  auf border-collapse:separate, und dort zeichnet der Browser Ränder
                  auf <tr> laut Spezifikation nicht — sie wäre lautlos verschwunden.
                  bg-white: im Zebra-Modus erbt die feste Spalte die Zeilenfarbe, die
                  muss also deckend sein. */}
              <tr className="bg-white">
                <th className="py-3 px-3 border-b border-gray-200" />
                <th className="py-3 px-3 text-center! border-b border-gray-200">
                  <img
                    {...bild(B_LOGO_KAKAO)}
                    width={50}
                    height={50}
                    alt=""
                    loading="lazy"
                    className="mx-auto! mb-1"
                  />
                  {/* s03 2026-09-02: war der freie Wert '#cab581' — ein
                      ZWEITER Goldton neben --cc-gold (dE 19,71) und auf
                      Weiss nur 2,01:1 lesbar, an einer Tabellen-Ueberschrift.
                      Jetzt derselbe eine Goldton in seiner lesbaren
                      Ableitung (5,07:1). Der Wert wohnt in
                      app/styles/kakao-seiten.css, hier steht keiner mehr. */}
                  <h3
                    className="text-sm font-bold"
                    style={{color: 'var(--cc-gold-text)'}}
                  >
                    Crystal Cacao®
                  </h3>
                  <h4 className="text-gray-500">15g</h4>
                </th>
                <th className="py-3 px-3 text-center border-b border-gray-200">
                  <img
                    {...bild(B_LOGO_KAFFEE)}
                    width={50}
                    height={50}
                    alt=""
                    loading="lazy"
                    className="mx-auto! mb-1"
                  />
                  {/* s03, 2026-09-04: war das Literal #5b3b26. Die dritte
                      Spaltenueberschrift dieser Tabelle stand damit als
                      einzige noch auf einem freien Wert — der Goldton daneben
                      war schon umgestellt, dieser und der Energydrink daneben
                      nicht. GEMESSEN am gerenderten DOM: nachdem die kuehlen
                      Tailwind-Graustufen gefallen waren, blieben auf
                      /pages/crystal-cacao genau ZWEI systemfremde Textfarben
                      uebrig, und das hier war eine davon. Ein Inline-Style
                      schlaegt jedes Stylesheet — er ist nur an der Quelle
                      erreichbar.
                      DIE DREI SPALTEN BLEIBEN UNTERSCHEIDBAR, das ist der
                      Zweck der Farbe: unser Kakao traegt den einen Goldton,
                      Kaffee das Kraftpapier-Braun der Verpackung
                      (--cc-kraft-tief, 5,26:1 auf hellem Grund), der
                      Energydrink das ruhige Grau (--cc-muted, 5,38:1). Die
                      Reihenfolge ist Absicht: warm zu neutral, unser Produkt
                      vorn. Kein vierter und fuenfter Ton. */}
                  <h3
                    className="text-sm font-bold"
                    style={{color: 'var(--cc-kraft-tief)'}}
                  >
                    Kaffee
                  </h3>
                  <h4 className="text-gray-500">200ml</h4>
                </th>
                <th className="py-3 px-3 text-center border-b border-gray-200">
                  <img
                    {...bild(B_LOGO_ENERGY)}
                    width={50}
                    height={50}
                    alt=""
                    loading="lazy"
                    className="mx-auto! mb-1"
                  />
                  <h3
                    className="text-sm font-bold"
                    style={{color: 'var(--cc-muted)'}}
                  >
                    Energydrink
                  </h3>
                  <h4 className="text-gray-500">250ml</h4>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                // bg-white statt "": im Zebra-Modus erbt die feste Spalte die
                // Zeilenfarbe — eine transparente Zeile ließe die wandernden
                // Wertspalten durch die feste Spalte durchscheinen.
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-3 font-bold text-md">{row.label}</td>
                  {cell(row.kakao)}
                  {cell(row.kaffee)}
                  {cell(row.energy)}
                </tr>
              ))}
            </tbody>
          </table>
        </SwipeTable>
        <div className="text-center">
          {/* Dieselbe Hausform wie der Zwilling im Aufmacher (Zeile ~148,
              "Analyse anzeigen"): gefuellt, randlos. Beide zeigen auf
              #cc-pruefdokumente und tun dasselbe — der eine trug bisher als
              einziger die umrandete Variante und sah neben den gefuellten
              Knoepfen der Seite wie ein Fremdkoerper aus. Kein dritter Stil:
              die Klassenkette ist woertlich die des Zwillings.
              Das href bleibt unveraendert — die Wache crystal-belege-abrufbar
              prueft genau diesen Anker. */}
          <a
            href="#cc-pruefdokumente"
            className="btn--secondary border-none! bg-[#00000025] mx-auto! mt-2!"
            >
            Analysedaten
          </a>
        </div>
      </div>

      {/* Right: text */}
      <div className="flex flex-col justify-center">
        <p>
          <b>Crystal Cacao®</b> enthält 6 weitere wertvolle Pflanzenstoffe:
          <br />
          &nbsp;
          <br />
          <b>
            Flavanole, Polyphenole, Theobromin, Phenylethylamin, Anandamid und
            L-Tryptophan.
          </b>
          <br />
          &nbsp;
          <br />
          Diese <b>jahrtausendealte natürliche Wirkstoffkomposition</b> wird von
          unseren Nutzern als klar{' '}
          <b>
            fokussierend, kreativitätsfördernd und lang anhaltend beschrieben
          </b>{' '}
          – und das gleichzeitig bei einer ruhigen und stabilen Energie.
          <br />
          &nbsp;
          <br />
          <b>Ganz ohne Zucker und Zusätze.</b>
        </p>
      </div>
    </div>
  );
}

function SideToSideWithTable() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[100px]! NormalSectionSize">
      <div className="flex flex-col justify-center">
        <h2 className="text-3xl font-bold">Wach. Klar. Ohne Koffein-Crash.</h2>
        <img
          className="block sm:hidden! mb-4"
          {...bild(B_CHART)}
          loading="lazy"
          alt="Diagramm Fokus und Energie über die Wirkdauer: Kaffee und Energy-Drinks steigen steil an und fallen schnell wieder ab, Crystal Cacao® steigt flacher an und hält lange"
        />
        <p>
          Die Wirkung von <b>Kaffee &amp; Energy-Drinks</b> beruht fast
          ausschließlich auf den <b>hohen Koffeingehalt.</b>
        </p>
        {/* Der Wortlaut ist unveraendert; entfernt sind nur die drei harten
            <br>. Sie waren nicht bloss Geschmack: ein Absatz mit hartem
            Umbruch hat eine kleine max-content-Breite, und als Flex-Kind
            macht `margin-inline: auto` (.ProductPageKakao p, kakao-seiten.css)
            daraus eine geschrumpfte, MITTIG gesetzte Box. Gemessen am
            gerenderten DOM: 299 px in einer 544-px-Spalte, 122,5 px
            eingerueckt gegenueber dem Absatz darueber — vier Zeilen mit vier
            verschiedenen linken Kanten. Ohne die <br> laeuft der Absatz auf
            derselben Kante wie sein Nachbar (x = 160, Breite 544). */}
        <p>
          Das führt zu einem <b>schnellen Kick,</b>{' '}
          <b>einem schnellen Crash</b> und man{' '}
          <b>braucht immer mehr davon.</b>
        </p>
      </div>
      <div className="hidden sm:flex items-center">
        <img
          className="w-full"
          {...bild(B_CHART)}
          loading="lazy"
          alt="Diagramm Fokus und Energie über die Wirkdauer: Kaffee und Energy-Drinks steigen steil an und fallen schnell wieder ab, Crystal Cacao® steigt flacher an und hält lange"
        />
      </div>
    </div>
  );
}

/*
 * HerobannerWithText — Bild mit einer daruebergelegten Ueberschrift.
 *
 * DER alt-TEXT IST EIN PARAMETER (Vendoring-Nachzug 2026-09-11 aus der
 * Vorlage, 2b3c8f4). Das feste alt="" waere richtig, wenn das Bild nur
 * Kulisse fuer die Ueberschrift waere. Hier ist es das nicht: die
 * Ueberschriften sind Schlagworte ("Wach. Klar. Im Flow.", "100% naturrein"),
 * das Bild zeigt etwas anderes als sie sagen — ohne alt faellt genau dieser
 * Teil weg. Default '' bleibt, damit kuenftige Aufrufe mit echter Kulisse
 * nichts erfinden muessen.
 */
function HerobannerWithText({src, text, imgAlt = ''}) {
  return (
    <div className="my-[10vh]! relative">
      <img
        className="w-full h-auto rounded-xl block"
        {...bild(src)}
        alt={imgAlt}
        loading="lazy"
      />
      <h2 className="absolute top-10 left-0 right-0 text-center text-white! text-5xl!">
        {text}
      </h2>
    </div>
  );
}

function SparSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 NormalSectionSize mt-[100px]!">
      <div className="flex flex-col justify-center">
        <h2>Jetzt sparen - bis zu 30%!</h2>
        <p>
          <b>Spare bis zu 30 % – sortenübergreifend kombinierbar.</b>
        </p>
        <p>
          <b>2 Packungen = 20 % Rabatt + Gratisversand innerhalb Deutschlands</b>
        </p>
        <p>
          <b>3 Packungen = 30 % Rabatt + Gratisversand innerhalb Deutschlands</b>
        </p>
      </div>
      <div className="aspect-square overflow-hidden rounded-xl mb-[10vh]">
        <img
          className="w-full h-full object-cover"
          {...bild(B_SETZLING)}
          loading="lazy"
          alt="Kakaobäuerin in einer Baumschule, in den Händen einen jungen Kakaosetzling"
        />
      </div>
    </div>
  );
}

function MusterSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 NormalSectionSize mt-[100px]!">
      <div className="flex flex-col justify-center">
        <h2>Der Unterschied zeigt sich im Muster:</h2>
        <p className="mt-2">
          Das charakteristische Leopardenmuster von Crystal Cacao® ist
          sichtbarer Beweis der kristallinen Struktur – entstanden durch
          naturbelassene Verarbeitung.
          <br />
          Diese Struktur bewahrt die volle Pflanzenkraft:
        </p>
        <ul className="list-disc ml-6 mt-2 flex flex-col gap-1">
          <li>
            5.620 mg <b>Flavanole &amp; Polyphenole</b>
          </li>
          <li>
            1.050 mg <b>Theobromin</b>
          </li>
          <li>
            10 mg <b>Phenylethylamin</b>
          </li>
          <li>
            61 µg <b>Anandamid</b>
          </li>
          <li>
            20 mg <b>L‑Tryptophan</b>
          </li>
          <li>frei von Zucker, frei von Zusätzen, 100% Kakao</li>
        </ul>
        <p className="mt-4">
          <b>Erlebe Fokus, Tiefe &amp; Präsenz – bei jeder Tasse.</b>
        </p>
      </div>
      <div className="flex items-center">
        <img
          className="w-full h-auto rounded-xl sm:mt-2"
          {...bild(B_MUSTER)}
          loading="lazy"
          alt="Nahaufnahme der Kakaomasse: dicht an dicht liegende, hell umrandete Kristallstrukturen"
        />
      </div>
    </div>
  );
}

function WurzelnSection() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <h2>Die Wurzeln von Crystal Cacao®</h2>
          <p>
            <b>Crystal Cacao®</b> stammt aus einer über{' '}
            <b>6.000 Jahre alten Kakaotradition</b> im peruanischen
            Amazonasgebiet. Unsere Partner bauen dort mit Sorgfalt und Achtung
            für Natur und Mensch den seltenen Edelkakao an, der die Basis für
            unseren <b>Kristall Kakao®</b> bildet.
          </p>
        </div>
        <div className="aspect-square overflow-hidden rounded-xl mt-2 mb-[10vh]">
          <img
            className="w-full h-full object-cover"
            {...bild(B_BAUER_FRUCHT)}
            loading="lazy"
            alt="Kakaobauer mit Machete im Kakaowald, in der Hand eine geerntete Kakaofrucht"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[10vh]!">
        <div className="aspect-square overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover bottom-[20px]!"
            {...bild(B_BAUER_TONNE)}
            loading="lazy"
            alt="Kakaobauer trägt eine große Erntetonne auf der Schulter durch die Plantage"
          />
        </div>
        <div className="flex flex-col justify-center">
          <ol className="list-decimal ml-6 flex flex-col gap-2">
            <li>Direkt &amp; fair gehandelt – von kleinen Familienbetrieben</li>
            <li>Nachhaltig angebaut in biodiverser Agroforstwirtschaft</li>
            <li>
              Verarbeitet bei niedrigen Temperaturen – für maximale
              Pflanzenkraft
            </li>
          </ol>
          <p className="mt-4">
            Jeder Schluck verbindet dich mit einer{' '}
            <b>6.000-jährigen Kakaotradition</b> – und mit den{' '}
            <b>Menschen, die ihn mit Hingabe anbauen.</b>
          </p>
        </div>
      </div>
    </div>
  );
}

function Zubereitung() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2>Zubereitung</h2>
      <p>
        1. 75 ml heißes Wasser oder Milch (max. 85 °C) <br />
        2. 15 g Crystal Cacao® dazugeben <br />
        3. Mit Milchaufschäumer schaumig rühren – fertig!
      </p>
    </div>
  );
}

function OnlineKurs() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2 className="text-center">Gratis Online Kurs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
        <div>
          <h3>
            Erfahre mehr über die Geheimnisse des Zeremonie Kakao und die
            richtige Anwendung.
          </h3>
        </div>
        <div className="aspect-video overflow-hidden rounded-xl">
          <img
            className="w-full h-auto"
            {...bild(B_KURS_MOCKUP)}
            loading="lazy"
            alt="Kurs Kakao Zeremonie" 
          />
        </div>
      </div>
    </div>
  );
}

function KursRegistration() {
  return (
    <div className="my-[100px]! border-y! border-y-[#00000032]! py-[5vh]!">
      <div className="NormalSectionSize grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-4">
          <h2>Jetzt kostenfrei mitmachen!</h2>
          <ActiveCampaignForm formId="21" />
          <p className="text-sm! text-gray-500">
            *Deine Eintragung ist absolut unverbindlich. Wenn dir der Kurs nicht
            gefällt, kannst du dich jederzeit mit nur einem Klick wieder
            austragen und du erhältst keine weiteren E-mails von uns.
          </p>
        </div>
        <div className="aspect-video overflow-hidden rounded-xl">
          <img 
            className="w-full h-full object-cover"
            {...bild(B_KURS_MOCKUP)}
            loading="lazy"
            alt="Kurs Kakao Zeremonie"
          />
        </div>
      </div>
    </div>
  );
}

const videos = [
  {
    src: KURS_VIDEO_1,
    alt: 'Titelbild zum Video „Intuition erfahren“',
    title:
      'Video 1: Intuition erfahren - Raus aus dem Kopf, rein ins Herz! – 9 min',
    items: [
      'Was ist Intuition?',
      'Welchen Vorteil bringt dir das im Alltag?',
      'Was hat Zeremonie Kakao damit zu tun?',
    ],
  },
  {
    src: KURS_VIDEO_2,
    alt: 'Kakao auf Brett',
    title: 'Video 2: Zeremonie Kakao – Was ist das?! – 8 min',
    items: [
      'Warum enthält er so viele Inhaltsstoffe?',
      'Wo kommt er her?',
      'Wie wird er hergestellt?',
    ],
  },
  {
    src: KURS_VIDEO_3,
    alt: 'Kakao Kochen',
    title: 'Video 3: Die ZeremonieKakao Kur in der Anwendung – 8 min',
    items: [
      'Wie erwärmt man ihn richtig?',
      'Wie schont man die Inhaltsstoffe?',
      'Wie konsumiert man ihn?',
    ],
  },
  {
    src: KURS_VIDEO_4,
    alt: 'Ureinwohner Kakao',
    title:
      'Video 4: Einen Schritt tiefer – mit Zeremonie Kakao meditieren – 4 min',
    items: [
      'Warum überhaupt meditieren?',
      'Wie und wie lange?',
      'Welche Effekte bringt es mit sich?',
    ],
  },
];

function KursInhalt() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2>Kursinhalt</h2>
      <h3>Videolektionen</h3>
      <div className="flex flex-col gap-6 mt-4">
        {videos.map((v, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center"
          >
            <div className="aspect-video overflow-hidden rounded-xl">
              <img
                className="w-full h-full object-cover"
                {...bild(v.src)}
                alt={v.alt}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col gap-2 sm:p-5">
              <h3>{v.title}</h3>
              <ul className="list-disc ml-5 flex flex-col gap-1">
                {v.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RitualSection() {
  return (
    <div className="NormalSectionSize">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center gap-3">
          <h2>Lust auf eine 28-tägige Reise?</h2>
          <div className="aspect-square overflow-hidden rounded-xl mt-2 block sm:hidden">
            <img
              className="w-full h-full object-cover"
              {...bild(B_RITUAL_QUADRAT)}
              loading="lazy"
              alt="Lächelnde Frau im weißen Hemd, das Kinn auf die Hand gestützt"
            />
          </div>
          <p>
            Mit nur <b>einer Tasse Crystal Cacao® am Tag</b> schaffst du dir
            einen festen Anker im Alltag – für mehr Achtsamkeit, Fokus und
            innere Balance.
          </p>
          <p>
            Mit nur einer Packung <b>Crystal Cacao®</b> startest du in deine{' '}
            <b>28-Tage-Achtsamkeitskur</b>. <br /> So funktioniert's:
          </p>
        </div>
        <div className="hidden sm:block aspect-square overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover"
            {...bild(B_RITUAL_HOCH)}
            loading="lazy"
            alt="Lächelnde Frau im weißen Hemd, das Kinn auf die Hand gestützt"
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <p>
          <b>☕ Dein Ritual:</b>
          <br /> Täglich 15 g <b>Crystal Cacao®</b> mit heißem Wasser oder
          Milch zubereiten und bewusst genießen.
        </p>
        <p>
          <b>🌀 Dein Moment:</b>
          <br /> Verbinde die Tasse mit etwas, das dir guttut: Atmen, Journaling
          oder Stille.
        </p>
        <p>
          <b>✨ Dein Effekt:</b>
          <br /> Schon nach wenigen Tagen spürst du: Mehr Ruhe. Mehr Fokus. Mehr
          Kraft.
        </p>
        <p>
          <b>Warum 28 Tage?</b>
          <br /> Weil sich neue Gewohnheiten nach 4 Wochen fest verankern. So
          wird aus einer Tasse ein tägliches Ritual.
        </p>
      </div>
      <h2 className="mt-[10vh]!">Unsere Garantie:</h2>
      <p>
        <b>
          100 % Kakao. 0 % Risiko.
          <br />
          &nbsp;
          <br />
          ✔️ Wissenschaftlich analysiert
          <br />
          ✔️ Rückgabe innerhalb von 20 Tagen – auch angebrochen
          <br />
          ✔️ Bio-zertifiziert &amp; aromasicher verpackt
        </b>
      </p>
    </div>
  );
}
