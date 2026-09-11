import {Link} from 'react-router';

import {Belege} from '~/components/reusables/Belege';
import {ABSENDER_MARKE, markenOrganisation} from '~/lib/kakao-zone';
import {canonicalLink, CANONICAL_ORIGIN} from '~/lib/seo';
import {ORG_ID, ORGANISATION, organizationSchema} from '~/lib/entity-schema';

/**
 * DIE ABSICHTSERKLÄRUNG von Crystal Cacao — warum es diesen Kakao gibt.
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
 *   b) „die schonendste Verarbeitungstechnologie der Welt" trägt NICHT als
 *      Tatsache. Ein Vergleich gegen andere Verfahren liegt auf diesem Server
 *      nicht vor (gesucht 2026-09-11 in produkt-dokumente/, qi-salesbot/docs/
 *      und im Zeugnis-Vertrag: null Treffer). Der Satz steht deshalb in der
 *      Ich-Form als Überzeugung, und die fehlende Vergleichsmessung wird auf
 *      der Seite BENANNT statt verschwiegen. Er verliert dadurch nichts: ein
 *      Mensch unterschreibt ihn, und daneben steht, was wirklich gemessen ist.
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
        datePublished: VEROEFFENTLICHT,
        dateModified: VEROEFFENTLICHT,
        author: {'@id': AUTOR_ID},
        publisher: {'@id': ORG_ID},
        about: [
          {'@type': 'Thing', name: 'Mineralmedizin'},
          {'@type': 'Thing', name: 'Zeremonieller Kakao'},
          {'@type': 'Brand', name: 'Crystal Cacao'},
        ],
      },
    ],
  };
}

export const meta = () => [
  {title: `Warum es Crystal Cacao gibt | ${ABSENDER_MARKE}`},
  {
    name: 'description',
    content:
      'Christian Bernd Bauer, Gründer von Crystal Cacao, über seine Absicht: ' +
      'Mineralmedizin etablieren, Kaffee ablösen, Kakao als Medium — und ' +
      'woran man das nachprüfen kann.',
  },
  {name: 'author', content: 'Christian Bernd Bauer'},
  canonicalLink(PFAD),
  {'script:ld+json': absichtsGraph()},
];

export function loader() {
  return {};
}

export default function WarumCrystalCacaoPage() {
  return (
    <div className="cc-seite cc-seite--text cc-absicht">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>

      <article>
        <h1>Warum es Crystal Cacao gibt</h1>

        <p className="cc-absicht__urheber">
          <span className="cc-absicht__autor">Christian Bernd Bauer</span>
          <span className="cc-absicht__rolle">
            Gründer von {ABSENDER_MARKE}
          </span>
          <time dateTime={VEROEFFENTLICHT}>{VEROEFFENTLICHT_TEXT}</time>
        </p>

        <p className="cc-lead">
          Ich will Kaffee ablösen. Nicht, weil mit Kaffee etwas nicht stimmt,
          sondern weil ich glaube, dass Kakao das bessere Medium ist für das,
          was die meisten Menschen morgens eigentlich suchen.
        </p>

        <section>
          <h2>Was ich mit Mineralmedizin meine</h2>
          <p>
            Crystal Cacao kommt aus meinem Wunsch, Mineralmedizin zu
            etablieren. Der Begriff steht in keinem Lehrbuch, und ich benutze
            ihn trotzdem, weil ich keinen besseren kenne.
          </p>
          <p>
            Gemeint ist ein einfacher Gedanke: Der Körper arbeitet mit
            Mineralstoffen und Spurenelementen. Magnesium, Kalium, Eisen,
            Zink — das sind keine Nebensachen der Ernährung, sondern das
            Material, aus dem Zustände entstehen. Wer ruhig, wach oder klar
            ist, ist das nicht nur, weil er es sich vorgenommen hat.
          </p>
          <p>
            Mineralmedizin heißt für mich deshalb: erst nachsehen, was fehlt,
            und es dann in der Form zurückgeben, in der eine Pflanze es
            ohnehin schon hergestellt hat — statt in der Form, die ein Labor
            nachbaut. Eine Pflanze liefert nie ein Element allein. Sie liefert
            es in Gesellschaft, und diese Gesellschaft ist der Unterschied.
          </p>
          <p>
            Und noch etwas gehört für mich dazu, sonst ist das Wort leer: Was
            sich Medizin nennt, muss messbar sein. Deshalb steht am Ende
            dieser Seite kein Versprechen, sondern eine Analyse.
          </p>
        </section>

        <section>
          <h2>Warum Kakao und warum nicht Kaffee</h2>
          <p>
            Kaffee wirkt über eine einzige Achse. Er stellt den Körper unter
            Spannung, und diese Spannung endet irgendwann — meistens dann,
            wenn man sie am wenigsten gebrauchen kann. Man kennt das Muster.
            Man kennt auch, was man dagegen tut: die nächste Tasse.
          </p>
          <p>
            Kakao ist für mich ein Medium und kein Ersatzgetränk. Ein Medium
            ist etwas, das trägt: Der Kakao bringt mit, was ich eigentlich
            meine — die Mineralstoffe. Er ist der Weg in den Körper, nicht der
            Zweck.
          </p>
          <p>
            Deshalb geht es mir nicht darum, Kaffee schlechtzureden. Es geht
            darum, dass die Tasse am Morgen ohnehin getrunken wird. Wenn sie
            ohnehin getrunken wird, dann soll sie etwas mitbringen.
          </p>
        </section>

        <section>
          <h2>Wozu das Ganze</h2>
          <p>
            Wenn ich aufschreibe, was ich mit Crystal Cacao erreichen will,
            dann steht da das hier — in meinen Worten und in dieser
            Reihenfolge:
          </p>
          <blockquote className="cc-absicht__zitat">
            <p>
              Bewusstseinserweiterung und Herzöffnungszustände, das heißt
              aktive Entraumatisierung im Körperbewusstsein, das heißt
              Persönlichkeitsentwicklung auf natürlicher Ebene — zu fördern
              und zu fordern.
            </p>
          </blockquote>
          <p>
            Ich weiß, wie dieser Satz klingt. Ich lasse ihn trotzdem so
            stehen, weil jede glattere Fassung etwas anderes bedeuten würde.
          </p>
          <p>
            „Fördern und fordern" ist dabei der Teil, den ich am wenigsten
            weglassen möchte. Ein Getränk erledigt das nicht für einen
            Menschen. Es kann einen Zustand öffnen, in dem Arbeit an sich
            selbst möglich wird — die Arbeit macht der Mensch. Alles andere
            wäre ein Versprechen, das ich nicht halten kann und auch nicht
            geben will.
          </p>
        </section>

        <section>
          <h2>Wie wir das machen</h2>
          <p>
            Wir nehmen alten Kakao. Damit meine ich nicht ein Alter in Jahren,
            sondern die Sorten: Amazonas Nativo und Piura Blanco, zwei alte
            peruanische Herkünfte von kleinen Familienbetrieben in
            Agroforstwirtschaft. Beide stehen namentlich in den Prüfzeugnissen
            weiter unten — die Herkunft ist also nachlesbar und nicht nur
            behauptet.
          </p>
          <p>
            Und wir verarbeiten so schonend, wie ich es kenne: die ganze
            Bohne, nicht entölt, nicht über Stunden gewalzt, bei niedrigen
            Temperaturen. Was in der Bohne ist, soll in der Tasse ankommen.
            Das ist der ganze Anspruch, und alles andere an diesem Produkt ist
            diesem Anspruch untergeordnet.
          </p>
          <p className="cc-absicht__ehrlich">
            Ich habe bisher gesagt, das sei die schonendste
            Verarbeitungstechnologie der Welt. Das ist meine Überzeugung, und
            ich stehe dazu — aber ich habe keinen Vergleich vorliegen, der
            unser Verfahren gegen alle anderen Verfahren der Welt gemessen
            hätte. Solange den niemand geführt hat, sage ich lieber: die
            schonendste, die ich gefunden habe. Was ich statt eines Vergleichs
            habe, ist die Messung dessen, was am Ende wirklich in der Tasse
            ist. Sie steht im nächsten Abschnitt.
          </p>
        </section>

        <section>
          <h2>Woran man erkennt, ob das stimmt</h2>
          <p>
            Ob die Verarbeitung wirklich schonend ist, sieht man nicht an der
            Verpackung. Man sieht es an zwei Dingen: am Wirkstoffprofil und am
            Mineralstoffgehalt. Beides ist untersucht, und beides kann hier
            nachgelesen werden.
          </p>
          <p>
            Das <strong>Wirkstoffprofil</strong> hat Dartsch Scientific
            (Dießen am Ammersee) an der fertigen Mischung gemessen, aus der
            verschlossenen Originalpackung. Gemessen wurden Polyphenole und
            Flavanole, Theobromin, Coffein, L-Tryptophan, Anandamid und
            Phenylethylamin. Je 100 Gramm Pulver stehen dort für Create
            5,62 Gramm Polyphenole und Flavanole, 1,05 Gramm Theobromin und
            140 Milligramm Coffein; für Awake 5,03 Gramm, 0,95 Gramm und
            120 Milligramm.
          </p>
          <p>
            Den <strong>Mineralstoffgehalt</strong> hat die SAS hagmann GmbH
            in Horb am Neckar bestimmt, mit Massenspektrometrie (ICP-MS);
            die Zusammenfassung stammt wieder von Dartsch Scientific. Das
            Labor ist von der Deutschen Akkreditierungsstelle akkreditiert
            (D-PL-19422-01-00). Je Kilogramm Fertigprodukt sind für Create
            unter anderem 3.400 Milligramm Magnesium und 12.000 Milligramm
            Kalium ausgewiesen, für Awake 2.650 und 9.150 Milligramm.
          </p>
          <p>
            Dazu kommen zwei Schadstoff-Prüfzeugnisse von Primoris Belgium an
            der rohen Bohne, nach EN ISO/IEC 17025. Alle sechs Dokumente sind
            unten verlinkt und vollständig lesbar — nicht als Auszug, sondern
            als das Dokument, das uns das Labor geschickt hat.
          </p>
          <p className="cc-absicht__ehrlich">
            Zwei Einschränkungen, die dazugehören: Diese Dokumente stammen aus
            dem Zeitraum August 2025 bis März 2026. Jede Zeile unten trägt ihr
            Datum, und ich behaupte damit nicht, dass zu jeder heute
            ausgelieferten Charge ein eigenes, neueres Papier vorliegt. Und
            eine Analyse sagt, was drin ist — sie sagt nicht, was es bei einem
            bestimmten Menschen bewirkt. Das ist ein Unterschied, den ich
            nicht verwischen will.
          </p>
        </section>

        <Belege id="pruefdokumente" />

        <section className="cc-absicht__unterschrift">
          <h2>Wer das unterschreibt</h2>
          <p>
            Christian Bernd Bauer, Gründer und Geschäftsführer der{' '}
            {ORGANISATION.legalName} in Maßbach. Anschrift, Registergericht
            und Kontakt stehen im <Link to="/pages/impressum">Impressum</Link>.
          </p>
          <p>
            Wenn Sie etwas auf dieser Seite für falsch halten, schreiben Sie
            mir. Ein Satz, den niemand prüfen kann, ist auf einer Seite wie
            dieser nichts wert.
          </p>
        </section>
      </article>
    </div>
  );
}

/** @typedef {import('./+types/pages.warum-crystal-cacao').Route} Route */
