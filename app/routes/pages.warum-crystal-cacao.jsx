import {Link} from 'react-router';

import {Belege} from '~/components/reusables/Belege';
import {
  GRUENDER_FOTO,
  gruenderFotoQuellen,
} from '~/components/reusables/AbsichtHinweis';
import {ABSENDER_MARKE, markenOrganisation} from '~/lib/kakao-zone';
import {canonicalLink, CANONICAL_ORIGIN} from '~/lib/seo';
import {ORG_ID, ORGANISATION, organizationSchema} from '~/lib/entity-schema';
import {MARKEN_TEILBILD, teilbildSignale} from '~/lib/kakao-seo';
import {isoMitZone} from '~/lib/datum';

/**
 * WARUM ES CRYSTAL CACAO GIBT — Christians Geschichte zum Kakao.
 *
 * ======================= NEU GEFASST AM 2026-09-26 =========================
 * Job 20260926-GROSSJOB-crystal-cacao-seitendurchgang-videos-pruefdokumente-
 * texte-gruenderbild. Christian über den Verweis auf diese Seite: „Klingt
 * 1000 % nach AI. Warum schreiben wir noch solche AI-Texte? Warum
 * ‚Absichtserklärung'? Das klingt nach einem Rechtsstaat, nicht nach einer
 * persönlichen Einladung. Außerdem fehlt mein Bild dazu."
 *
 * GEMESSEN VORHER (homepage-bauer/bin/stil-pruefe auf dem sichtbaren Text):
 * 10,0 Gedankenstriche je 1000 Wörter (Schwelle 4,0) und zwei Selbstbezüge
 * („auf dieser Seite", „weiter unten") — dazu Sätze, die über den Text statt
 * über die Sache reden („Ich weiß, wie dieser Satz klingt"), Vorbehalte, nach
 * denen der Leser nichts mehr weiß, und am Ende ein „Sie" auf einer Seite,
 * die sonst duzt.
 *
 * WAS JETZT GILT:
 *   - SEINE STIMME, NICHT UNSERE: jede Aussage kommt aus seinem Auftrag vom
 *     2026-09-11 (Wortlaut in worker-pool/state/backlog-prompts/
 *     20260911-BAU-absichtserklaerung-…-absicht-cacao.md) oder aus seinem
 *     Podcast kd7Z-ITKYDo (Abschrift homepage-bauer/data/erfahrungen/
 *     transkripte/kd7Z-ITKYDo.txt): Tulum, die indigenen Stämme mit dem Kakao
 *     als gemeinsamer Pflanze, „eigentlich kannte ich nur Schokolade",
 *     „morgens bringt er mich in den Tag … abends nimmt er das Feuer aus dem
 *     Tag", das Lesen mit Create, „es sind Welten". Erzählt wird in der
 *     ersten Person, der Leser wird geduzt wie überall in diesem Laden.
 *   - SEIN FOTO steht am Autorennamen (dieselbe Datei wie auf qiblanco.com,
 *     GRUENDER_FOTO in AbsichtHinweis.jsx).
 *   - SEINE FESTLEGUNG STEHT OHNE RÜCKZIEHER: „uralter Kakao mit der
 *     schonendsten Verarbeitungstechnologie der Welt" ist seine Produkt-
 *     aussage und damit gesetzt (GL-SPR-0008). Der Absatz, der sie
 *     zurücknahm („ich habe keinen Vergleich vorliegen"), ist gestrichen;
 *     der Beleg, den Christian selbst nennt — Wirkstoffprofil und
 *     Mineralstoffgehalt, beides untersucht —, steht mit allen Dokumenten da.
 *     Die Wache probe_absicht_am_kundenrand.py ist im selben Zug nachgezogen.
 *   - DIE SECHS MERKMALE, AN DENEN DIE WACHE DIE GEDANKEN ERKENNT, bleiben im
 *     Text („Mineralmedizin", „Kaffee ablösen", „Entraumatisierung im
 *     Körperbewusstsein", „in der Tasse ankommen", „Mineralstoffgehalt",
 *     „Christian Bernd Bauer"), ebenso die H1 „Warum es Crystal Cacao gibt",
 *     die probe_absichtserklaerung_live.py wörtlich sucht.
 *   - KEINE ENERGIEMEDIZIN AUF DIESER SEITE: Christian erzählt im Podcast
 *     auch von der Frequenztechnologie von Qi Blanco. Sie gehört in die
 *     andere Produktwelt und bleibt hier weg (Brain-Regel
 *     segment-geo-x-produktwelt).
 *
 * ================== DIE FASSUNG VOM 2026-09-11, ZUR HERKUNFT ==================
 *
 * WARUM ES DIESE SEITE GIBT (Job 20260911-BAU-absichtserklaerung-crystal-
 * cacao-mineralmedizin-live-und-crawlbar, Christian wörtlich):
 * „Crystal Cacao kommt quasi aus meinem Wunsch, Mineralmedizin zu etablieren
 * — und eben Kaffee abzulösen und Kakao als neues Medium zu nutzen …"
 * Der Laden war zu diesem Zeitpunkt DREI TAGE live (A-Record 2026-09-08),
 * stand nicht in der Search Console, und es gab auf dieser Domain keinen
 * einzigen zurechenbaren Text, den eine Suchmaschine oder eine KI hätte
 * zitieren können — nur Produkt-, Kauf- und Rechtstexte. Der erste solche
 * Text prägt, wie über eine Marke geschrieben wird; beim Schwester-Laden
 * qiblanco.com ist dieser Moment verpasst worden.
 *
 * WARUM EIGENE ROUTE UND KEIN SHOPIFY-PAGE-OBJEKT — gemessen, nicht gewählt:
 * diese Storefront läuft gegen PUBLIC_STORE_DOMAIN=qi-blanco.myshopify.com,
 * also gegen DENSELBEN Katalog wie qiblanco.com (siehe Sortiments-Zaun in
 * app/lib/kakao-zone.js). Ein neu angelegtes Page-Objekt wäre damit auch auf
 * dem Schwester-Laden abrufbar — eine Absichtserklärung der Kakao-Welt auf
 * der Energieprodukt-Domain. Die Weltgrenze verläuft hier durch den Katalog,
 * nicht durch die Domain; deshalb Code, nicht CMS. Die Folge ist tragend und
 * steht nicht nebenbei: eine Code-Route kommt baulich NIE in die Sitemap
 * (sitemap-zaun.js zieht CMS-Seiten aus der Shopify-`pages`-Query). Genau
 * deshalb entsteht im selben Commit KAKAO_CODE_SEITEN — ohne sie wäre diese
 * Seite live und für Suchmaschinen unangemeldet, also das Gegenteil des
 * Auftragszwecks. /pages/impressum und /pages/datenschutz zeigen den
 * Zustand, der ohne diesen Schritt entsteht: live seit Tagen, in der eigenen
 * Sitemap mit null Einträgen.
 *
 * DIE FÜNF GEDANKEN STEHEN IN CHRISTIANS ORDNUNG, NICHT IN DER, DIE SICH
 * BESSER VERKAUFT: (1) Mineralmedizin etablieren, (2) Kaffee ablösen / Kakao
 * als Medium, (3) wozu, (4) wie, (5) woran man es erkennt. Der Absatz vor
 * Abschnitt 1 nimmt Gedanke 2 als Einstieg vorweg, weil er der einzige ist,
 * den jeder sofort versteht — die Reihenfolge der Abschnitte bleibt seine.
 *
 * DER SATZ IN ABSCHNITT 3 IST EIN ZITAT UND WIRD NICHT GEGLÄTTET. „Aktive
 * Entraumatisierung im Körperbewusstsein" ist keine Marketingformulierung und
 * soll auch nicht wie eine klingen; genau daran ist erkennbar, dass der Text
 * von einem Menschen stammt und nicht von einer Agentur. Er steht deshalb als
 * <blockquote> und nicht paraphrasiert im Fließtext.
 *
 * DIE ZWEI STELLEN, AN DENEN DIESE SEITE GENAU SEIN MUSS — beide am
 * 2026-09-11 nachgemessen, nicht abgeschrieben:
 *   a) „beides ist untersucht" ist eine TATSACHENBEHAUPTUNG und trägt. Vier
 *      Analysen liegen vor und sind öffentlich abrufbar (HTTP 200,
 *      application/pdf, 2026-09-11 selbst geladen). Sie stehen unten über
 *      <Belege/>, also über dieselbe Komponente und dieselbe SSoT
 *      (qi-salesbot/data/zeugnis-vertrag.json -> app/lib/kakao-belege.js),
 *      die schon Start- und Kaufseiten speist. Kein zweiter Beleg-Ort, keine
 *      zweite Liste — eine zweite Liste wäre genau die Divergenz, die der
 *      Sitemap-Zaun eine Etage tiefer schon behoben hat.
 *   b) „die schonendste Verarbeitungstechnologie der Welt" stand bis zum
 *      2026-09-26 mit einem Rückzieher da (fehlender Verfahrensvergleich).
 *      ÜBERHOLT, siehe Kopf: es ist Christians Produktaussage (GL-SPR-0008),
 *      und der Rückzieher war genau der Ton, den er „Rechtsstaat" nennt.
 *
 * WAS BEWUSST NICHT DRIN STEHT:
 *   * KEIN Verkaufssatz, kein Preis, kein Rabatt, kein Kaufaufruf. Der einzige
 *     Weg zum Produkt ist die Rücknavigation oben — danebenstehend, nicht im
 *     Text. Ein Absichtstext mit Kaufknopf ist eine Anzeige, und eine Anzeige
 *     zitiert niemand.
 *   * KEIN Nickel-Wert. Primoris (Rohbohne) und SAS hagmann (Fertigprodukt)
 *     widersprechen sich beim Create um Faktor 2,5 (2,4 gegen 6 mg/kg),
 *     ungeklärt — die Sperre stammt aus qi-salesbot/docs/belege-crystal-
 *     cacao-laborwerte.md und gilt hier genauso.
 *   * KEINE Aktualitätszusage zur verkauften Charge. Die Dokumente sind von
 *     August 2025 bis März 2026; jede Zeile trägt ihr Datum, damit der Leser
 *     selbst urteilt. Dieselbe Regel wie in Belege.jsx.
 *
 * KEINE RECHTSPRÜFUNG. Nicht beauftragt und nicht Gegenstand dieser Route.
 */

/** Erstveröffentlichung. Fest, nicht `new Date()`: ein Datum, das sich bei
 *  jedem Aufruf ändert, ist kein Datum, sondern eine Uhr — und ein
 *  datePublished, das mitwandert, entwertet genau die Zurechenbarkeit, für die
 *  diese Seite gebaut ist. */
const VEROEFFENTLICHT = '2026-09-11';
/** Letzte inhaltliche Überarbeitung (Neufassung in Christians Stimme). Fest
 *  wie das Erscheinungsdatum und aus demselben Grund. */
const GEAENDERT = '2026-09-26';
const PFAD = '/pages/warum-crystal-cacao';
const SEITEN_URL = `${CANONICAL_ORIGIN}${PFAD}`;
const AUTOR_ID = `${CANONICAL_ORIGIN}/#christian-bauer`;

/** Menschenlesbares Datum. Aus derselben Konstante wie das maschinenlesbare —
 *  zwei Stellen für dasselbe Datum wären zwei Stellen für denselben Zustand. */
const VEROEFFENTLICHT_TEXT = new Date(`${VEROEFFENTLICHT}T00:00:00Z`)
  .toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/**
 * Der Auszeichnungs-Graph dieser Seite.
 *
 * WARUM `Article` UND NICHT `AboutPage`: der Auftrag will, dass eine Maschine
 * „die Aussage einer benannten Person und eines benannten Unternehmens"
 * erkennt. `AboutPage` beschreibt eine SEITENART, `Article` trägt `author` und
 * `datePublished` als Kernfelder — genau die zwei Angaben, an denen eine
 * zitierende Maschine die Zurechenbarkeit festmacht.
 *
 * WARUM DER PERSON-KNOTEN EIGENSTÄNDIG STEHT und nicht als eingebettetes
 * Objekt: über `@id` ist er referenzierbar. Der Organization-Knoten trägt
 * dieselbe `@id` wie auf der Startseite (ORG_ID) — beide Seiten beschreiben
 * damit DIESELBE Entität und nicht zwei gleichnamige.
 *
 * WARUM KEIN websiteSchema(): dessen `name` ist ORGANISATION.name, also
 * „Qi Blanco" — auf dieser Domain die fremde Absender-Marke. Dieselbe Drift,
 * die _index.jsx mit `startseitenGraph()` abfängt. Hier wird der Knoten
 * schlicht nicht gebraucht; die Startseite führt ihn.
 *
 * UND GENAU DIESE DRIFT TRAF AUCH DEN ORGANIZATION-KNOTEN HIER — nachgezogen
 * am 2026-09-11 vom Job 20260911-REPAIR-crystal-cacao-…, Segment s03. Der
 * Absatz darüber hatte die Hälfte der Sache schon erkannt (WebSite-Name) und
 * `organizationSchema()` trotzdem ROH aufgerufen: live gemessen trug diese
 * Seite denselben Knoten wie die Startseite — dieselbe `@id`, name='Qi Blanco'
 * und alle sechs Qi-Blanco-Kanäle im `sameAs`.
 *
 * DAS IST DER TEURE TEIL FÜR SPÄTERE LESER: die Identitätsprobe
 * (crystal-cacao-node/proben/probe_marken_identitaet.py) liest ausschließlich
 * „/". Hätte s03 nur die Startseite korrigiert, wäre sie grün geworden,
 * während derselbe kaputte Knoten unter derselben `@id` hier weitergelebt
 * hätte. WER EINEN WEITEREN organizationSchema()-AUFRUF EINBAUT, LEGT IHN
 * DURCH markenOrganisation() — sonst führen zwei Seiten dieselbe Entität mit
 * zwei verschiedenen Identitäten, und gemessen wird nur eine davon.
 */
function absichtsGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      markenOrganisation(organizationSchema(), {origin: CANONICAL_ORIGIN}),
      {
        '@type': 'Person',
        '@id': AUTOR_ID,
        name: 'Christian Bernd Bauer',
        jobTitle: 'Gründer und Geschäftsführer',
        worksFor: {'@id': ORG_ID},
        // Dasselbe Porträt wie am Autorennamen der Seite — eine Datei.
        image: GRUENDER_FOTO.url,
      },
      {
        '@type': 'Article',
        '@id': `${SEITEN_URL}#artikel`,
        headline: 'Warum es Crystal Cacao gibt',
        description:
          'Christian Bernd Bauer über die Absicht hinter Crystal Cacao: ' +
          'Mineralmedizin etablieren, Kaffee ablösen, Kakao als Medium.',
        url: SEITEN_URL,
        mainEntityOfPage: {'@type': 'WebPage', '@id': SEITEN_URL},
        inLanguage: 'de-DE',
        // MASCHINENLESBAR MIT ZONE, menschenlesbar unveraendert. Google legt
        // ein Datum ohne Zone nach dem Standort seines eigenen Crawlers aus —
        // der Kalendertag haengt dann an einem Fremden. `isoMitZone` setzt den
        // Anfang dieses Kalendertages in der Hauszone und rechnet den Offset je
        // Datum aus der Zone; ein fest getipptes "+02:00" waere im Winter der
        // falsche Tag. Die Konstante darueber bleibt der Kalendertag — sie
        // speist auch den sichtbaren Text.
        datePublished: isoMitZone(VEROEFFENTLICHT),
        dateModified: isoMitZone(GEAENDERT),
        author: {'@id': AUTOR_ID},
        publisher: {'@id': ORG_ID},
        // DASSELBE Bild wie og:image, aus DERSELBEN Konstante. Stuende hier
        // ein zweites, zeigte die Suchmaschine ein anderes Vorschaubild als
        // das soziale Netzwerk — und beide waeren fuer sich richtig.
        image: {
          '@type': 'ImageObject',
          url: MARKEN_TEILBILD.url,
          width: MARKEN_TEILBILD.breite,
          height: MARKEN_TEILBILD.hoehe,
        },
        about: [
          {'@type': 'Thing', name: 'Mineralmedizin'},
          {'@type': 'Thing', name: 'Zeremonieller Kakao'},
          {'@type': 'Brand', name: 'Crystal Cacao'},
        ],
      },
    ],
  };
}

/**
 * Titel und Beschreibung stehen als Konstanten, weil sie seit dem 2026-09-12
 * je ZWEIMAL gebraucht werden — einmal fuer die Suchmaschine
 * (`title`/`name=description`) und einmal fuers Teilen (`og:title`/
 * `og:description`). Zwei getrennt gepflegte Quellen fuer denselben Text
 * driften auseinander, und dann zeigt ein geteilter Link etwas anderes als
 * das Suchergebnis: zwei Versprechen fuer eine Seite.
 */
const SEITEN_TITEL = `Warum es Crystal Cacao gibt | ${ABSENDER_MARKE}`;
const SEITEN_BESCHREIBUNG =
  'Christian Bernd Bauer erzählt, wie er in Mexiko zum Kakao kam und warum ' +
  'er Crystal Cacao macht: Mineralmedizin, Kakao statt Kaffee, mit allen ' +
  'Laborergebnissen zum Nachlesen.';

/**
 * OPEN GRAPH, ergaenzt 2026-09-12 vom Grossjob-Segment s06.
 *
 * GEMESSENER ANLASS (Vollzensus der lebenden Sitemap, 2026-09-12): diese
 * Seite trug NULL og-Tags — nicht bloss kein Bild. Sie ist der erste
 * zurechenbare Text dieser Domain und genau der, den man weitergibt; ohne
 * diese Angaben entscheidet jedes Netzwerk selbst, was in der Vorschau steht.
 * Der Auftrag dieses Segments kannte die Seite noch nicht: sie ist erst am
 * 2026-09-11 entstanden (Commit 13c2322) und hat den Laden von neun auf zehn
 * Sitemap-Seiten wachsen lassen. Ein gepinnter Nenner haette sie verschluckt.
 *
 * `og:type: article` und nicht `website`: die Seite IST ein zurechenbarer
 * Text mit Autor und Datum, und der Article-Knoten unten sagt genau das schon.
 */
export const meta = () => [
  {title: SEITEN_TITEL},
  {name: 'description', content: SEITEN_BESCHREIBUNG},
  {name: 'author', content: 'Christian Bernd Bauer'},
  canonicalLink(PFAD),
  {property: 'og:type', content: 'article'},
  {property: 'og:site_name', content: ABSENDER_MARKE},
  {property: 'og:locale', content: 'de_DE'},
  {property: 'og:title', content: SEITEN_TITEL},
  {property: 'og:url', content: SEITEN_URL},
  {property: 'og:description', content: SEITEN_BESCHREIBUNG},
  {property: 'article:author', content: 'Christian Bernd Bauer'},
  {property: 'article:published_time', content: VEROEFFENTLICHT},
  ...teilbildSignale(),
  {'script:ld+json': absichtsGraph()},
];

export function loader() {
  return {};
}

export default function WarumCrystalCacaoPage() {
  const foto = gruenderFotoQuellen(72, '72px');
  return (
    <div className="cc-seite cc-seite--text cc-absicht">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>

      <article>
        <h1>Warum es Crystal Cacao gibt</h1>

        {/* Der Autorenblock trägt die Zurechenbarkeit der Seite: ein Text mit
            Gesicht, Namen und Datum ist die Aussage eines Menschen. Name und
            Rolle stehen in EINEM Textknoten — die Erfüllungsprobe des
            Auftrags sucht genau diesen und verlangt im selben Block ein
            geladenes Bild. Das Foto ist hier nicht lazy: es steht im ersten
            Bildschirm. */}
        <div className="cc-absicht__urheber">
          <img
            className="cc-absicht__foto"
            src={foto.src}
            srcSet={foto.srcSet}
            sizes={foto.sizes}
            width={72}
            height={72}
            alt={GRUENDER_FOTO.alt}
            decoding="async"
          />
          <p className="cc-absicht__urheber-text">
            <span className="cc-absicht__wer">
              Christian Bernd Bauer, Gründer von {ABSENDER_MARKE}
            </span>
            <time dateTime={VEROEFFENTLICHT}>{VEROEFFENTLICHT_TEXT}</time>
          </p>
        </div>

        <p className="cc-lead">
          Ich möchte Kaffee ablösen. Mit einer Tasse, die dir etwas mitbringt:
          die Mineralstoffe, die Spurenelemente und die Wirkstoffe einer
          uralten Kakaobohne.
        </p>

        <section>
          <h2>Wie der Kakao zu uns kam</h2>
          <p>
            Anna und ich haben über drei Jahre in Tulum gelebt, in Mexiko. Es
            war die Zeit von Corona, und in Tulum trafen sich damals Menschen
            aus der ganzen Welt.
          </p>
          <p>
            Am meisten beeindruckt haben mich die indigenen Stämme, die dorthin
            kamen: die Huichol aus der Wüste Mexikos, die Kofán aus dem
            kolumbianischen Amazonas, die Shipibo aus Peru und die Yawanawá aus
            Brasilien. Jeder Stamm hat seine eigenen Pflanzen und seine eigenen
            Zeremonien. Eine Pflanze hatten sie alle gemeinsam: den Kakao.
          </p>
          <p>
            Ich kannte Kakao bis dahin als süßes Getränk aus der Kindheit und
            als Praline. Ehrlich gesagt kannte ich nur Schokolade. In Mexiko
            habe ich die Bohne in ihrer Urform erlebt, von Bäumen, wie sie seit
            Jahrtausenden im Dschungel wachsen. Das hat mich gepackt.
          </p>
        </section>

        <section>
          <h2>Was ich mit Mineralmedizin meine</h2>
          <p>
            Crystal Cacao kommt aus meinem Wunsch, Mineralmedizin zu
            etablieren. Damit meine ich Mineralstoffe und Spurenelemente in
            ihrer reinsten und ursprünglichsten Form, so wie eine Pflanze sie
            selbst gebildet hat.
          </p>
          <p>
            Kakao bringt davon 24 mit, dazu sieben Wirkstoffe. Magnesium,
            Kalium, Eisen und Zink gehören genauso dazu wie Theobromin,
            Anandamid und Tryptophan. Und das alles in einer Tasse, die du
            ohnehin trinkst.
          </p>
        </section>

        <section>
          <h2>Warum Kakao statt Kaffee</h2>
          <p>
            Kaffee gibt dir einen schnellen Kick, und danach kommt das Tief.
            Die meisten greifen dann zur nächsten Tasse, und dann zur nächsten.
            Ich wollte eine Tasse, die mich wach macht und mir dabei etwas gibt.
          </p>
          <p>
            Kakao ist für mich ein neues Medium. Er trägt die Mineralstoffe und
            die Wirkstoffe der Bohne in den Körper. Ich trinke ihn morgens und
            abends. Morgens bringt er mich in den Tag, er weckt mich auf und
            zentriert mich. Abends nimmt er das Feuer aus dem Tag, bringt mich
            runter und macht das Herz auf.
          </p>
        </section>

        <section>
          <h2>Worum es mir eigentlich geht</h2>
          <p>Mein eigentliches Ziel mit Crystal Cacao ist dieses:</p>
          <blockquote className="cc-absicht__zitat">
            <p>
              Bewusstseinserweiterung und Herzöffnungszustände, das heißt
              aktive Entraumatisierung im Körperbewusstsein, das heißt
              Persönlichkeitsentwicklung auf natürlicher Ebene, zu fördern und
              zu fordern.
            </p>
          </blockquote>
          <p>
            Wenn ich abends mit einer Tasse Create ein Buch lese, landen die
            Worte direkt im Herzen. Ohne den Kakao bleiben sie im Kopf. Ich
            habe beides ausprobiert, und es sind Welten.
          </p>
          <p>
            Der Kakao öffnet diesen Zustand. Was du daraus machst, liegt bei
            dir. Deshalb heißt es bei mir fördern und fordern.
          </p>
        </section>

        <section>
          <h2>Wie wir den Kakao machen</h2>
          <p>
            Dazu nutzen wir uralten Kakao und die schonendste
            Verarbeitungstechnologie der Welt. Wir setzen auf die Urstämme des
            Kakaos: Amazonas Nativo und Piura Blanco, zwei alte Linien aus
            Peru. Sie wachsen bei kleinen Familienbetrieben in
            Agroforstwirtschaft, und beide Namen findest du in den
            Prüfzeugnissen wieder.
          </p>
          <p>
            Wir verarbeiten die ganze Bohne, kurz und schonend bei niedriger
            Temperatur. Wir entölen sie nicht und walzen sie nicht stundenlang.
            Danach reift der Kakao in seinem Aromaschutzbeutel nach und
            kristallisiert dabei aus. Daher hat der Kristallkakao seinen Namen.
            Alles, was in der Bohne steckt, soll in der Tasse ankommen.
          </p>
        </section>

        <section>
          <h2>Woran du erkennst, dass das stimmt</h2>
          <p>
            Das erkennst du am Wirkstoffprofil und am Mineralstoffgehalt.
            Beides ist im Labor untersucht, und jedes Dokument kannst du selbst
            öffnen.
          </p>
          <p>
            Das <strong>Wirkstoffprofil</strong> hat Dartsch Scientific in
            Dießen am Ammersee an der fertigen Mischung gemessen, aus der
            verschlossenen Originalpackung. In 100 Gramm Create stecken 5,62
            Gramm Polyphenole und Flavanole, 1,05 Gramm Theobromin und 140
            Milligramm Koffein. Bei Awake sind es 5,03 Gramm, 0,95 Gramm und
            120 Milligramm.
          </p>
          <p>
            Den <strong>Mineralstoffgehalt</strong> hat die SAS hagmann GmbH in
            Horb am Neckar mit Massenspektrometrie (ICP-MS) bestimmt. Das Labor
            ist bei der Deutschen Akkreditierungsstelle akkreditiert
            (D-PL-19422-01-00). Ein Kilogramm Create enthält unter anderem 3.400
            Milligramm Magnesium und 12.000 Milligramm Kalium, ein Kilogramm
            Awake 2.650 und 9.150 Milligramm.
          </p>
          <p>
            Dazu kommen zwei Schadstoff-Prüfzeugnisse von Primoris Belgium,
            gemessen an der rohen Bohne nach EN ISO/IEC 17025.
          </p>
        </section>

        <Belege id="pruefdokumente" />

        <section className="cc-absicht__unterschrift">
          <h2>Schreib mir</h2>
          <p>
            Ich freue mich, wenn du den Kakao selbst erlebst. Wenn du Fragen
            hast oder mir erzählen willst, was er bei dir bewegt, schreib mir.
            Meine Adresse und alle Kontaktwege findest du im{' '}
            <Link to="/pages/impressum">Impressum</Link>.
          </p>
          <p className="cc-absicht__gruss">
            Christian Bernd Bauer, Gründer und Geschäftsführer der{' '}
            {ORGANISATION.legalName} in Maßbach
          </p>
        </section>
      </article>
    </div>
  );
}

/** @typedef {import('./+types/pages.warum-crystal-cacao').Route} Route */
