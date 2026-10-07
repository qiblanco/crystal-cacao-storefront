import {Link} from 'react-router';

import {Belege} from '~/components/reusables/Belege';
import {StarRating} from '~/components/reusables/StarRating';
import {
  FEED_STAND,
  GOOGLE_PROFIL_URL,
  KAKAO_STIMMEN,
  datumDeutsch,
} from '~/data/kakao-stimmen';
import {FAQ_CACAO} from '~/data/product-faqs';
import {tagLang} from '~/lib/datum';
import {KAKAO_KOLLEKTION} from '~/lib/kakao-zone';
import {seitenSignale} from '~/lib/kakao-seo';
import {canonicalLink} from '~/lib/seo';

/**
 * CRYSTAL CACAO ERFAHRUNGEN — die Seite fuer die Suchabsicht „Erfahrungen".
 *
 * ANLASS (Hypothese GS-098, Job km-entw-hebel-umsetzen-seo-top3-zwei-
 * crystal-erfahrungen-de-gs-098-20261007, KPI seo-top3-zwei-crystal-
 * erfahrungen-de): bei „Crystal Cacao Erfahrungen" (google.de) haelt
 * qiblanco.com/pages/crystal-cacao Platz 1, die Plaetze 2 und 3 fuellte Google
 * an 18 von 24 Tagen mit Erfahrungsseiten fremder Marken (Trustpilot von
 * Cacao Rituals, ein allgemeiner Kakao-Blog). Gemessen im taeglichen
 * Flaechen-Zensus (seo-manager/data/seo.db, Tabelle flaeche): keine eigene
 * Seite trug das Wort im Titel. Die letzte neue Seite dieser Domain
 * (warum-crystal-cacao) stand nach 4 Tagen in den Top 10, nach 13 auf Platz 3.
 *
 * WAS DIESE SEITE TRAEGT UND WOHER JEDER SATZ KOMMT:
 *   * die Stimmen: app/data/kakao-stimmen.js, woertlich, mit Name und Datum,
 *     genau wie im Abschnitt #kundenstimmen der Startseite. Die Messgrenze
 *     (gemeldet, geliefert, Stichtag) liest FEED_STAND aus derselben Datei.
 *   * die Schadstoff-Antwort: jede Zahl aus qi-salesbot/docs/belege-crystal-
 *     cacao-laborwerte.md, der Quelle, aus der auch Anna antwortet. Sie wird
 *     mit DENSELBEN Detektoren gemessen wie Annas Antwort (qi-salesbot/eval/
 *     bin/cacao-hgas-wortlaut-probe): Quecksilber „nicht nachweisbar", Arsen
 *     „nicht quantifizierbar", der Grenzwert 0,80 mg/kg mit seiner Kategorie.
 *     Keine Nickelzahl (§4), kein „Cadmium-arm" (§5.2), keine Kausalaussage
 *     ueber die Herkunft des Cadmiums ausser der belegten Form (§5.5).
 *   * Inhaltsstoffe: die Zahlen von /pages/warum-crystal-cacao; die 21 mg je
 *     Tasse von der Startseite (KaffeeVergleich), dazu Awake aus denselben
 *     Dartsch-Werten gerechnet (120 mg je 100 g, 15 g je Tasse = 18 mg).
 *     WER GEMESSEN HAT, steht im Bericht selbst und nicht im Briefkopf: die
 *     Naehrstoff-Analysen nennen als verantwortlichen Laborleiter Dr. Markus
 *     Born, PLENUM Dr. Born, Ennepetal; Dartsch Scientific verantwortet den
 *     Inhalt des Berichts (am PDF nachgelesen 2026-10-07, Gegenpruefer Z2).
 *     Die Absichtsseite schreibt die Messung Dartsch zu; das korrigiert der
 *     Auftrag 20261007-repair-kakaotiefe-satz-quecksilber-arsen-nicht-im-
 *     primoris-zeugnis mit, zusammen mit dem Labor-Feld der Pruefdokumente.
 *   * "jede Charge" nennt die Stoffe, die Primoris tatsaechlich prueft
 *     (Cadmium, Blei, Pestizide; laborwerte.md §1). "Schwermetalle" laese
 *     sich als "auch Quecksilber und Arsen" -- die stehen NICHT im Zeugnis.
 *   * Zubereitung und „Fuer wen": FAQ_CACAO, woertlich. Ein zweiter Text
 *     daneben waere die Drift, die eine FAQ-Quelle verhindern soll.
 *   * Rueckgabe: der Wortlaut des Garantie-Blocks der Startseite.
 *
 * WAS BEWUSST FEHLT:
 *   * EINE EIGENE WIRKAUSSAGE. Was der Kakao mit einem Menschen macht, sagen
 *     ausschliesslich die zitierten Kundinnen und Kunden.
 *   * REVIEW- UND AggregateRating-MARKUP. Bewertungen ueber das eigene
 *     Unternehmen auf der eigenen Seite bekommen bei Google keine Sterne
 *     (Search Central, „self-serving reviews", 16.09.2019). Ein Markup, das
 *     keine Wirkung hat und nur eine Regel reizt, bleibt weg.
 *   * FAQPage-MARKUP. Zubereitung und „Fuer wen" stehen woertlich auf beiden
 *     Kaufseiten; Google will dieselbe FAQ nur EINMAL je Site ausgezeichnet.
 *   * die Instagram-Stimme der Kaufseiten: das Original ist auf Instagram als
 *     Anzeige gekennzeichnet. Eine Anzeige ist keine Erfahrung.
 *   * Gruendergeschichte, Verarbeitung, Zeremonie: das steht auf
 *     /pages/warum-crystal-cacao und interessiert hier nicht.
 *
 * WARUM CODE-ROUTE UND KEIN SHOPIFY-PAGE-OBJEKT: derselbe Grund wie bei
 * warum-crystal-cacao — der Katalog ist mit qiblanco.com geteilt. Die Folge
 * auch: die Seite steht nur ueber KAKAO_CODE_SEITEN (app/lib/kakao-zone.js)
 * in der Sitemap, und der Weg zu ihr fuehrt ueber das Fussmenue
 * (KAKAO_FUSSMENUE). Beides gehoert zum selben Commit.
 *
 * DIE WACHE: crystal-cacao-node/proben/probe_erfahrungen_am_kundenrand.py
 * misst die Seite am Kundenrand (Arme A–J). Ihre Anker sind die
 * Ueberschriften-ids dieser Datei (h2#cc-erfahrungen-schadstoffe) und die
 * Kartenklasse cc-va-stimme — wer sie umbenennt, zieht die Probe mit.
 */

const PFAD = '/pages/erfahrungen';
const TITEL = 'Crystal Cacao Erfahrungen: echte Stimmen und Laborwerte';
const BESCHREIBUNG =
  'Echte Google-Bewertungen zu Crystal Cacao im Wortlaut, dazu die ' +
  'Laborwerte zu Cadmium und Schwermetallen, die Zubereitung und 20 Tage ' +
  'Rückgabe.';

/** Die zwei Fragen aus FAQ_CACAO, die Google zu dieser Suche selbst stellt
 *  (abends trinken, Nebenwirkungen) bzw. die jeder Erstkaeufer stellt. Fehlt
 *  eine in FAQ_CACAO, faellt ihr Abschnitt weg statt leer zu rendern; Arm J
 *  der Wache meldet das. */
const FRAGEN = [
  {q: 'Wie wird zeremonieller Kakao zubereitet?', id: 'cc-erfahrungen-zubereitung'},
  {q: 'Für wen ist Kakao (un)geeignet?', id: 'cc-erfahrungen-fuer-wen'},
];

const ZAHLWORT = [
  'keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht',
  'neun', 'zehn', 'elf', 'zwölf',
];

/** „unter diesen 38 nennen drei den Kakao" — aus der Liste gezaehlt, nicht
 *  getippt: faellt eine Stimme weg, stimmt der Satz trotzdem. */
function kakaoNennungen(n) {
  const wort = ZAHLWORT[n] ?? String(n);
  return n === 1 ? `nennt ${wort}` : `nennen ${wort}`;
}

export const meta = () => [
  {title: TITEL},
  {name: 'description', content: BESCHREIBUNG},
  canonicalLink(PFAD),
  ...seitenSignale({pfad: PFAD, titel: TITEL, beschreibung: BESCHREIBUNG}),
];

export function loader() {
  return {};
}

export default function ErfahrungenPage() {
  const fragen = FRAGEN.map((f) => ({
    ...f,
    a: FAQ_CACAO.find((e) => e.q === f.q)?.a,
  })).filter((f) => f.a);

  return (
    <div className="cc-seite cc-seite--text cc-erfahrungen">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>

      <article>
        <h1>Crystal Cacao Erfahrungen</h1>
        <p className="cc-lead">
          Kundinnen und Kunden haben bei Google über Crystal Cacao geschrieben.
          Du liest ihre Worte im Original, mit Namen und Datum.
        </p>

        <section aria-labelledby="cc-erfahrungen-stimmen">
          <h2 id="cc-erfahrungen-stimmen">Was Kundinnen und Kunden schreiben</h2>
          <div className="cc-va-stimmen-gitter">
            {KAKAO_STIMMEN.map((s) => (
              <figure className="cc-va-stimme" key={s.id}>
                <StarRating value={s.sterne} qb="d" />
                <blockquote>{s.text}</blockquote>
                <figcaption>
                  {s.name} · {datumDeutsch(s.datum)}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="cc-va-stimmen-quelle">
            Unverändert im Wortlaut aus dem Google-Profil von Qi Blanco.{' '}
            <a href={GOOGLE_PROFIL_URL} target="_blank" rel="noreferrer">
              Alle Bewertungen bei Google ansehen
            </a>
          </p>
          <p className="cc-erfahrungen__grenze">
            Crystal Cacao kommt von Qi Blanco. Deshalb stehen die Bewertungen im
            Google-Profil von Qi Blanco. Das Profil zählt {FEED_STAND.gemeldet}{' '}
            Bewertungen. {FEED_STAND.geliefert} davon konnten wir am{' '}
            {tagLang(FEED_STAND.stand)} im Wortlaut abrufen, und unter diesen{' '}
            {FEED_STAND.geliefert} {kakaoNennungen(KAKAO_STIMMEN.length)} den
            Kakao.
          </p>
        </section>

        <section aria-labelledby="cc-erfahrungen-schadstoffe">
          <h2 id="cc-erfahrungen-schadstoffe">
            Wie viel Cadmium und Schwermetalle stecken im Kakao?
          </h2>
          <p>
            Cadmium ist messbar vorhanden und liegt in beiden Sorten unter dem
            EU-Höchstgehalt. Blei ist nicht nachweisbar, und bei den Pestiziden
            gibt es keinen Befund.
          </p>
          <p>
            Gemessen am essbaren Anteil der rohen Bohne enthält Awake 0,59 mg/kg
            Cadmium und Create 0,44 mg/kg. Für Schokolade ab 50 %
            Kakaotrockenmasse erlaubt die EU höchstens 0,80 mg/kg. Crystal Cacao
            ist Schokolade mit 100 % Kakao. Beide Werte bleiben darunter, auch
            mit der Messunsicherheit von 20 %. Blei liegt unter der
            Bestimmungsgrenze von 0,02 mg/kg.
          </p>
          <p>
            Die Anbauregion bringt das Cadmium mit, die Verarbeitung erzeugt es
            nicht.
          </p>
          <p>
            Gemessen hat Primoris in Belgien, ein nach EN ISO/IEC 17025
            akkreditiertes Labor. Dort lassen wir jede Charge auf Cadmium, Blei
            und Pestizide prüfen.{' '}
            <a href="#pruefdokumente">
              Beide Prüfzeugnisse kannst du selbst öffnen.
            </a>
          </p>
          <p>
            Zu Quecksilber und Arsen gibt es eine eigene Untersuchung. Dartsch
            Scientific hat den Kakao einmal auf alle Elemente untersucht.
            Quecksilber war darin nicht nachweisbar. Arsen fand sich in sehr
            geringen Spuren, die nicht quantifizierbar sind.
          </p>
        </section>

        {/* Die Pruefdokumente stehen HINTER einer eigenen Ueberschrift und
            nicht im Schadstoff-Abschnitt: ihr Schlusssatz (Belege.jsx) nennt
            Dartsch mit den Naehrstoffen. Im Abschnitt darueber, wo Dartsch die
            Quelle der Quecksilber- und Arsen-Aussage ist, waere genau das die
            Umwidmung, die Annas Detektor REICHWEITE-DARTSCH-UMGEWIDMET sperrt
            (FEHLER-DB F-392 im qi-salesbot). */}
        <section aria-labelledby="cc-erfahrungen-inhalt">
          <h2 id="cc-erfahrungen-inhalt">Was steckt im Kakao?</h2>
          <p>
            Eine Tasse mit 15 g Create bringt 21 mg Koffein mit, mit Awake sind
            es 18 mg. Eine Tasse Kaffee hat 80 bis 100 mg.
          </p>
          <p>
            In 100 Gramm Create stecken 5,62 Gramm Polyphenole und Flavanole,
            1,05 Gramm Theobromin und 140 Milligramm Koffein. Bei Awake sind es
            5,03 Gramm, 0,95 Gramm und 120 Milligramm. Gemessen hat das Labor
            PLENUM Dr. Born in Ennepetal, an der fertigen Mischung aus der
            verschlossenen Originalpackung. Den Bericht verantwortet Dartsch
            Scientific.
          </p>
          <p>
            Den Mineralstoffgehalt hat die SAS hagmann GmbH in Horb am Neckar mit
            Massenspektrometrie (ICP-MS) bestimmt. Das Labor ist bei der
            Deutschen Akkreditierungsstelle akkreditiert (D-PL-19422-01-00). Ein
            Kilogramm Create enthält unter anderem 3.400 Milligramm Magnesium und
            12.000 Milligramm Kalium, ein Kilogramm Awake 2.650 und 9.150
            Milligramm.
          </p>
          <Belege id="pruefdokumente" />
        </section>

        {fragen.map((f) => (
          <section key={f.id} aria-labelledby={f.id}>
            <h2 id={f.id}>{f.q}</h2>
            <p>{f.a}</p>
          </section>
        ))}

        <section aria-labelledby="cc-erfahrungen-rueckgabe">
          <h2 id="cc-erfahrungen-rueckgabe">Kann ich den Kakao zurückgeben?</h2>
          <p>
            Ja. Du kannst den Kakao 20 Tage testen, komplett risikofrei. Es gilt
            die 100 % Geld-zurück-Garantie, selbst bei geöffneter Packung.
          </p>
          <div className="cc-knopfreihe cc-erfahrungen__knoepfe">
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
      </article>
    </div>
  );
}

/** @typedef {import('./+types/pages.erfahrungen').Route} Route */
