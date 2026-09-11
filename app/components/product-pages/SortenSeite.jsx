import {Belege} from '../reusables/Belege';
import {AbsichtHinweis} from '../reusables/AbsichtHinweis';
import {ProductFAQ} from '../ProductFAQ';
import {FAQ_CACAO} from '~/data/product-faqs';
import {sortenProfil} from '~/lib/sorten-profil';

/**
 * DIE SORTENSEITE — der Rumpf unter dem Kaufblock, einmal gebaut, zweimal
 * benutzt (AWAKE, CREATE).
 *
 * Job 20260910-REPAIR-awake-und-create-sind-zwei-kopien-derselben-seite.
 * Anlass: Awake.jsx und Create.jsx waren am 2026-09-10 zu 82,8 % dieselbe
 * Datei (351 von 424 Zeilen woertlich gleich, difflib). Der Sorten-Aufmacher
 * (SortenAufmacher.jsx) hatte den Kopf schon zusammengelegt; hier folgt der
 * Rest. Was je Sorte verschieden ist, kommt aus app/lib/sorten-profil.js
 * (`inhaltsstoffe`, `herkunft`); alles andere steht hier genau einmal.
 *
 * ABSCHNITTE, in der Reihenfolge des Bestands:
 *   Inhaltsstoffe (je Sorte) · Mineralstoffe · Zubereitung · Herkunft (je
 *   Sorte) · Ursprung · Banner · Belege (je Sorte) · FAQ
 *
 * ======================================================================
 * "ANWENDUNG & TAGESZEITEN" IST WEG — "ZUBEREITUNG" BLEIBT. Die Entscheidung:
 * ======================================================================
 * Der Abschnitt stand in beiden Dateien ZEICHENGLEICH und mass am Kundenrand
 * 453 px (1440 px) bzw. 513 px (390 px) bei 0 anklickbaren Zielen und 13,6 %
 * Fuellgrad — der groesste verbliebene Vertreter der Klasse, gegen die sich
 * Christian gewandt hat ("Das ist optisch auch nicht gut gemacht").
 *
 * Er trug zwei Sorten Inhalt, und die sind verschieden zu behandeln:
 *
 * 1. DREI TAGESZEITEN-ZEILEN ("Morgens: Klarer Fokus und kraftvoller Start",
 *    "Nachmittags: Fuer produktive Arbeit oder Training", "Abends: Sanftes
 *    Ausklingen des Tages"). Sie sind WEG, aus drei Gruenden:
 *    (a) Sie waren fuer AWAKE und CREATE identisch — ein Text, der auf beiden
 *        Sortenseiten gleich lautet, sagt ueber DIESE Sorte nichts.
 *    (b) Sie widersprechen dem, was der Aufmacher zwei Bildschirme darueber
 *        sagt: AWAKE ist "fuer den Start in den Tag", CREATE "fuer den klaren
 *        Kopf, lange Stunden am Schreibtisch" (sorten-profil.js, Bedingung des
 *        Vorjobs: Gelegenheiten, keine Wirkung). Ein Abschnitt, der beiden
 *        Sorten dieselben drei Tageszeiten zuweist, loescht genau die
 *        Einordnung, die der Aufmacher herstellt.
 *    (c) "Klarer Fokus", "produktive Arbeit" sind halbe Wirkungsaussagen. Der
 *        Auftrag verbietet, welche zu ERGAENZEN; das Streichen ist die
 *        sichere Richtung. Es faellt dabei keine pruefbare Angabe weg.
 *
 * 2. DIE ZUBEREITUNGS-ZEILE ("15 g in 75 ml warmer Milch oder Wasser (max.
 *    85 °C)") BLEIBT. Genau: das Praefix "Zubereitung: " ist aus dem Absatz in
 *    die Ueberschrift gewandert, die Angabe selbst ist unveraendert (Advisor-
 *    Pruefung 2026-09-11 hat "wortgleich" zu Recht als zu scharf geruegt).
 *    Sie ist eine PRUEFBARE Angabe, die einzige
 *    Dosierung auf der Kaufseite, und sie macht das "Fuer 28 Tage" der
 *    Produktbeschreibung nachrechenbar (420 g / 15 g = 28). Vor allem aber
 *    verspricht die Startseite sie: "Wie du ihn zubereitest und welche Sorte
 *    zu dir passt, findest du bei AWAKE und CREATE" (Kakao.jsx). Ein Verweis
 *    ist eine Zusage, dass der Weg dort gangbar ist — die Zeile hier ist
 *    dieser Weg. Die Ueberschrift heisst jetzt "Zubereitung": "Anwendung &
 *    Tageszeiten" haette Inhalt angekuendigt, der nicht mehr da ist, und
 *    "Zubereitung" ist das Wort, das die Startseite fuer dieselbe Sache
 *    benutzt. Kein neuer Wortlaut — die Ueberschrift ist der alte Praefix.
 *
 * NICHT GETAN, und warum: die Zeile in die Vertrauensliste des Kaufblocks zu
 * ziehen (CacaoBenefitList in der Route) haette den Kaufblock veraendert, an
 * dem probe_kakao_naehe und der Kaufweg haengen — fuer eine Zeile, die auch
 * hier ihren Zweck erfuellt. Und den Dreischritt der Startseite hierher zu
 * kopieren waere die naechste Kopie gewesen (Kakao.jsx ist K2 mit offenem
 * Fremd-Drift, eine geteilte Konstante war ohne Eingriff dort nicht zu haben).
 *
 * ======================================================================
 * DREI KLEINE, BEWUSSTE ABWEICHUNGEN VOM BESTAND (am Rand nachgemessen):
 * ======================================================================
 * Massstab dabei ist der TEXTINHALT (textContent) und die Geometrie je
 * Element, nicht das HTML-Byte: SSR setzt zwischen benachbarte Textknoten
 * ein <!-- -->, und wo frueher {' '} stand, ist jetzt ein Knoten — ein
 * Byte-Diff des HTML faellt also aus, ohne dass ein Zeichen anders waere.
 * - Create.jsx setzte die Inhaltsstoff-Titel per dangerouslySetInnerHTML,
 *   Awake.jsx als Text. Kein Titel traegt Markup; das DOM ist in beiden
 *   Faellen <b>Titel</b>. Jetzt ueberall Text — eine Angriffsflaeche weniger,
 *   kein Pixel anders.
 * - In Create.jsx standen die Herkunfts-Absaetze der Zeilen 1 und 2 als
 *   nackter Text im <div>, Zeile 3 und alle Awake-Zeilen in <p>. reset.css
 *   gibt <p> 1rem / 1.4, der <div> traegt text-sm / leading-relaxed — auf
 *   der Create-Seite standen damit in EINEM Abschnitt zwei Schriftgroessen.
 *   Jetzt ist jeder Absatz ein <p>; die zwei Create-Zeilen ruecken auf die
 *   Groesse ihrer dritten und der Awake-Seite. Das ist die einzige sichtbare
 *   Aenderung ausserhalb des Zubereitungs-Abschnitts.
 * - Das Banner rendert sein <h2> nur, wenn es Text hat. Beide Seiten riefen
 *   es mit text="" — ein leeres <h2> im Dokument, unsichtbar, aber eine leere
 *   Ueberschrift fuer jeden, der die Struktur liest.
 */

/**
 * Rendert einen Absatz-String; **so** markierte Stellen werden <b>.
 * Kein HTML, kein dangerouslySetInnerHTML — die Texte kommen aus
 * sorten-profil.js und tragen ausser dieser einen Markierung nichts.
 * Ein fehlendes zweites ** faellt hier lautlos durch (der Rest des Absatzes
 * wuerde fett); deshalb prueft probe_sorten_eine_seite.py Arm D die Paare.
 */
function Fett({text}) {
  const teile = text.split('**');
  return teile.map((t, i) => (i % 2 === 1 ? <b key={i}>{t}</b> : t));
}

const IMG_KAFFEE =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-1052459-kaffee.jpg?v=1764250719';

function BioaktiveInhaltsstoffe({sorte}) {
  const {bild, bildSeite, liste, fazit} = sorte.inhaltsstoffe;
  const bilder = (
    <div className="hidden sm:flex! flex-col gap-4">
      <img className="w-full rounded-xl" src={bild} alt="" />
      <img className="w-full rounded-xl" src={IMG_KAFFEE} alt="" />
    </div>
  );
  return (
    <div className="NormalSectionSize my-[100px]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-start">
        {bildSeite === 'links' && bilder}

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-5">
            7 bioaktive Inhaltsstoffe:
          </h2>

          {/* Mobile-only top image */}
          <img
            className="block sm:hidden! w-full rounded-xl mb-5"
            src={bild}
            alt=""
          />

          <ol className="list-decimal list-inside space-y-4 text-sm text-gray-800">
            {liste.map((item, i) => (
              <li key={i}>
                <b>{item.titel}</b>
                <br />
                {item.punkte.map((p, j) => (
                  <span key={j} className="block ml-4 text-gray-600">
                    → {p}
                  </span>
                ))}
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm text-gray-800 leading-relaxed">
            <Fett text={fazit} />
          </p>

          {/* Mobile-only bottom image */}
          <img
            className="block sm:hidden! w-full rounded-xl mt-5"
            src={IMG_KAFFEE}
            alt=""
          />
        </div>

        {bildSeite === 'rechts' && bilder}
      </div>
    </div>
  );
}

function Mineralstoffe() {
  const IMG_BOHNE =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/bohne-create.jpg?v=1763083566';
  const IMG_BALI =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06610_1.jpg?v=1764258286';

  const minerals = [
    ['Magnesium (Mg)', 'Energiehaushalt, Nerven'],
    ['Kalium (K)', 'Herzfunktion, Zellspannung'],
    ['Calcium (Ca)', 'Knochen, Signalwege'],
    ['Phosphor (P)', 'ATP-Bildung'],
    ['Natrium (Na)', 'Elektrolytgleichgewicht'],
    ['Eisen (Fe)', 'Sauerstofftransport'],
    ['Zink (Zn)', 'Immunsystem, Enzyme'],
    ['Kupfer (Cu)', 'antioxidative Enzyme'],
    ['Mangan (Mn)', 'antioxidative Cofaktoren'],
    ['Chrom (Cr)', 'Glukosestoffwechsel'],
    ['Nickel (Ni)', 'enzymatische Prozesse'],
    ['Kobalt (Co)', 'Bestandteil von Vitamin B12'],
    ['Silizium (Si)', 'Bindegewebe, Struktur'],
    ['Bor (B)', 'Knochen, kognitive Funktionen'],
    ['Strontium (Sr)', 'Mineralstoffwechsel'],
    ['Rubidium (Rb)', 'intrazellulärer Marker'],
    ['Vanadium (V)', 'Glukosestoffwechsel'],
    ['Cäsium (Cs)', 'bioenergetische Spur'],
    ['Barium (Ba)', 'Spurenelement'],
    ['Gallium (Ga)', 'Ultraspurenelement'],
    ['Lanthan (La)', 'seltenes Spurenelement'],
    ['Tellur (Te)', 'Ultraspurenelement'],
    ['Hafnium (Hf)', 'Spurenelement'],
    ['Tantal (Ta)', 'Ultraspurenelement'],
  ];
  return (
    <div className="NormalSectionSize my-[100px]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-start">
        {/* Left: desktop images stacked */}
        <div className="hidden sm:flex! flex-col gap-4">
          <img
            className="w-full rounded-xl hidden sm:block!"
            src={IMG_BOHNE}
            alt=""
          />
          <img
            className="w-full rounded-xl hidden sm:block!"
            src={IMG_BALI}
            alt=""
          />
        </div>

        {/* Right: text */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-5">Enthält 24 Mineralstoffe</h2>

          {/* Mobile-only top image */}
          <img
            className="block sm:hidden! w-full rounded-xl mb-5"
            src={IMG_BOHNE}
            alt=""
          />

          <ol className="space-y-1 text-sm text-gray-800">
            {minerals.map(([name, desc], i) => (
              <li key={i}>
                <b>
                  {i + 1}. {name}
                </b>{' '}
                – {desc}
              </li>
            ))}
          </ol>

          {/* Mobile-only bottom image */}
          <img
            className="block sm:hidden! w-full rounded-xl mt-5"
            src={IMG_BALI}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}

/** Siehe Kopf: die eine pruefbare Zeile des frueheren "Anwendung"-Abschnitts. */
function Zubereitung() {
  return (
    <div className="NormalSectionSize flex flex-col gap-2">
      <h2>Zubereitung</h2>
      <p>15 g in 75 ml warmer Milch oder Wasser (max. 85 °C).</p>
    </div>
  );
}

function Herkunft({sorte}) {
  return (
    <div className="NormalSectionSize my-[100px]!">
      <h2 className="text-center text-2xl font-bold mb-10">
        Herkunft: Spüre die Kraft des Amazonas
      </h2>
      <div className="flex flex-col gap-12">
        {sorte.herkunft.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center"
          >
            {/* <div> statt <p> um die Absaetze: ein <p> in einem <p> ist
                ungueltiges HTML, der Parser schliesst das aeussere vorzeitig,
                Server- und Client-Baum laufen auseinander und React bricht
                die Hydration ab. Gemessen 2026-09-03 auf der Kaufseite:
                6 verschachtelte <p> und 8 Konsolenfehler. Die Vorlage
                (qiblanco-storefront) traegt denselben Bau; der Befund ist
                dorthin gemeldet. */}
            <div className="text-sm text-gray-800 leading-relaxed">
              {row.absaetze.map((a, j) => (
                <p key={j} className={j > 0 ? 'mt-3' : undefined}>
                  <Fett text={a} />
                </p>
              ))}
            </div>
            <img className="w-full rounded-xl" src={row.bild} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

const COPYRIGHT =
  'Copyright: Quirino Olivera Núñez - Asociación para la Investigación Científica de la Amazonía del Perú';

const ursprungRows = [
  {
    text: (
      <>
        <p>
          Im Norden Perus, im Tal von Jaén und Bagua, erhebt sich der mystische{' '}
          <b>Spiraltempel von Montegrande</b> – ein Ort, an dem Archäologen
          Kakaorückstände in <b>6.300 Jahre alten Keramiken entdeckt</b> haben.
        </p>
        <p className="mt-3">
          Diese Funde gelten heute als der{' '}
          <b>älteste bekannte Nachweis von Kakao weltweit</b> – der Beginn einer
          Geschichte, die bis in unsere Zeit fortlebt.
        </p>
        <p className="mt-3">
          Nur wenige Kilometer von diesem historischen Fundort entfernt, in
          denselben fruchtbaren Böden des oberen Amazonasbeckens, wachsen die
          Pflanzen, aus deren Früchten <b>Crystal Cacao®</b> entsteht.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/montegrande.jpg?v=1764260249',
    copyright: COPYRIGHT,
  },
  {
    text: (
      <>
        <p>
          Sie gedeihen auf exakt jenem geologischen Fundament, das seit
          Jahrtausenden als Heimat des ursprünglichen Kakaos gilt.
        </p>
        <p className="mt-3">
          Die Region bildet eine <b>kontinuierliche Abstammungslinie:</b>
        </p>
        <p className="mt-3">
          Vom urzeitlichen Wildkakao über die ersten domestizierten Pflanzen des
          Montegrande-Kulturraums bis hin zu den heutigen, naturbelassenen
          Altlinien, die den genetischen Kern von <b>Crystal Cacao®</b> tragen.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/tempel-kakao.jpg?v=1764260567',
    copyright: COPYRIGHT,
  },
  {
    text: (
      <>
        <p>
          Diese Verbindung aus Archäologie, Ökologie und Genetik zeichnet ein
          klares Bild:
        </p>
        <p className="mt-3">
          <b>
            Crystal Cacao® wächst dort, wo die Geschichte des Kakaos begann
          </b>{' '}
          – im selben Boden, unter derselben Sonne und in einer ununterbrochenen
          Linie, die seit über 6.000 Jahren fortbesteht.
        </p>
        <p className="mt-3">
          Er trägt die Energie, Reinheit und Resonanz des ältesten bekannten
          Kakaos der Welt – und macht sie erlebbar für den Menschen von heute.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-herkunft.jpg?v=1764260814',
    copyright: COPYRIGHT,
  },
];

function Ursprung() {
  return (
    <div className="NormalSectionSize my-[100px]!">
      <h2 className="text-center text-2xl font-bold mb-10">
        Crystal Cacao® – Ursprung, der 6.300 Jahre zurückreicht
      </h2>
      <div className="flex flex-col gap-12">
        {ursprungRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start"
          >
            <div className="text-sm text-gray-800 leading-relaxed">
              {row.text}
            </div>
            <div>
              <img className="w-full rounded-xl" src={row.img} alt="" />
              {row.copyright && (
                <p className="text-[0.7em] text-gray-500 mt-1">
                  {row.copyright}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HerobannerWithText({src, text}) {
  return (
    <div className="my-[10vh]! relative">
      <img className="w-full h-auto rounded-xl block" src={src} alt="" />
      {text && (
        <h2 className="absolute top-10 left-0 right-0 text-center text-white! text-5xl!">
          {text}
        </h2>
      )}
    </div>
  );
}

/**
 * @param {{sorte: 'awake'|'create'}} props
 */
export function SortenSeite({sorte}) {
  const profil = sortenProfil(sorte);
  if (!profil) {
    throw new Error(`SortenSeite: unbekannte Sorte '${sorte}'`);
  }
  return (
    <>
      <BioaktiveInhaltsstoffe sorte={profil} />
      <Mineralstoffe />
      <Zubereitung />
      <Herkunft sorte={profil} />
      <Ursprung />
      <HerobannerWithText
        src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/bohne-create.jpg?v=1763083566"
        text=""
      />
      <Belege sorte={`crystal-cacao-${sorte}`} />
      {/* Einmal gebaut, zweimal ausgeliefert (AWAKE und CREATE) — dieselbe
          Naht, aus der diese Datei ueberhaupt entstanden ist. */}
      <AbsichtHinweis />
      <ProductFAQ items={FAQ_CACAO} />
    </>
  );
}
