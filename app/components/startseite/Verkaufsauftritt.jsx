import {Link} from 'react-router';
import LazyImage from '~/components/reusables/LazyImage';
import {StarRating} from '~/components/reusables/StarRating';
import {
  GOOGLE_PROFIL_URL,
  KAKAO_STIMMEN,
  datumDeutsch,
} from '~/data/kakao-stimmen';

/**
 * Verkaufsauftritt — die Startseite als Trichter statt als Sortenliste.
 *
 * ANLASS, Christian am 2026-09-08: „Die Frontseite geht gar nicht. Das muss
 * doch einladend sein, und dann Bewertungen kommen etc. … Und die Frontseite
 * bei crystal-cacao müsste auch viel mehr wie ein Funnel-Look haben: Also warum
 * unser Kakao, was ist der große Vorteil, etc."
 *
 * WAS DIE ALTE STARTSEITE BEANTWORTET HAT: genau eine Frage — welche zwei
 * Sorten gibt es. Sie hat NICHT beantwortet, warum jemand diesen Kakao will.
 *
 * WOHER JEDER SATZ KOMMT — und das ist der wichtigere Teil dieser Datei:
 * NICHTS hier ist neu erfunden. Jede Angabe steht heute schon auf
 * /pages/crystal-cacao oder auf den beiden Kaufseiten und ist dort seit Wochen
 * live; sie wird hier nur nach OBEN geholt, weil sie unten verschenkt wurde.
 * Die Herkunft steht je Abschnitt im Kommentar darueber. Die einzigen Zahlen,
 * die neu auf dieser Seite auftauchen, stammen aus der Vergleichstabelle
 * derselben Seite (app/components/product-pages/Kakao.jsx, ComparisonTable).
 *
 * WAS BEWUSST NICHT MITKOMMT, und diese Haelfte streicht mehr als sie
 * hinzufuegt (KWD-0001, Frage 3): der Online-Kurs, die Zubereitungs-Anleitung,
 * das Ruhen und Auskristallisieren nach dem Vermahlen, die Ritual-Sektion. Das
 * ist unser Handwerksstolz und interessiert einen Menschen, der zum ersten Mal
 * hier landet, nicht — er will wissen, was drin ist, was es kostet und ob es
 * echt ist. Alles davon steht weiter auf /pages/crystal-cacao, wo es hingehoert.
 *
 * WIRKZUSAGEN: in UNSERER Stimme steht hier keine. Was der Kakao mit einem
 * Menschen macht, sagen ausschliesslich die drei zitierten Kundinnen und
 * Kunden — woertlich, mit Namen und Datum, aus dem Google-Profil
 * (app/data/kakao-stimmen.js). Unsere eigenen Saetze bleiben bei dem, was
 * MESSBAR ist: Inhalt, Menge, Herkunft, Pruefung, Preis, Rueckgaberecht.
 */

const ANALYSE_PDF =
  'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Test_report_Create_27.10.2025_english_language.pdf?v=1763061829';

/**
 * DER AUFMACHER — die Frage des Kunden zuerst, nicht unser Name zuerst.
 * Der Koffein-Vergleich (21 mg gegen 80–100 mg) steht woertlich in der
 * Vergleichstabelle auf /pages/crystal-cacao und ist damit keine neue
 * Behauptung, sondern die vorhandene an ihrem wirksamen Platz.
 */
export function Aufmacher() {
  return (
    <section className="cc-va-kopf">
      <div className="cc-va-kopf-text">
        <p className="cc-va-marke">Crystal Cacao®</p>
        <h1>Ganze Bohne. Kein Zucker. Kein Zusatz.</h1>
        <p className="cc-va-lead">
          Bio-Kakao aus zeremonieller Ernte — 21 mg Koffein pro Tasse, eine
          Tasse Kaffee hat 80 bis 100.
        </p>
        <div className="cc-knopfreihe">
          <Link className="cc-knopf" to="/pages/crystal-cacao">
            Unseren Kakao ansehen
          </Link>
          <Link className="cc-knopf cc-knopf--ruhig" to="/collections/zeremonie-kakao">
            Alle Sorten
          </Link>
        </div>
      </div>
      <div className="cc-va-kopf-bild">
        <LazyImage
          alt="Crystal Cacao in der Tasse"
          highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet.jpg?v=1771790329"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet_small.jpg?v=1771790329"
        />
      </div>
    </section>
  );
}

/**
 * WARUM UNSER KAKAO — Christians erste Frage, vier Antworten, jede mit ihrer
 * Groesse dahinter. Herkunft der Angaben:
 *   Reinheit / 24 Mineralstoffe / 11x Antioxidantien: Kaufseiten
 *     (app/routes/products.crystal-cacao-awake.jsx, CacaoBenefitList) und
 *     /pages/crystal-cacao (Benefits).
 *   843 mg Polyphenole & Flavanole, 158 mg Theobromin, 21 mg Coffein:
 *     ComparisonTable in app/components/product-pages/Kakao.jsx.
 */
const VORTEILE = Object.freeze([
  {
    titel: 'Ganze Bohne, sonst nichts',
    text:
      '100 % reiner Premium-Naturkakao. Kein Zucker, keine Zusätze, keine Aromen — ' +
      'das ganze Aroma kommt aus der Bohne.',
  },
  {
    titel: '21 mg Koffein statt 80 bis 100',
    text:
      'Eine Tasse Crystal Cacao® bringt 21 mg Coffein mit, eine Tasse Kaffee 80 bis 100. ' +
      'Dazu 158 mg Theobromin — das enthält Kaffee gar nicht.',
  },
  {
    titel: '24 Mineralstoffe & Spurenelemente',
    text: 'Natürlich in der Bohne enthalten, nicht nachträglich zugesetzt.',
  },
  {
    titel: '11× mehr Antioxidantien',
    text:
      '843 mg Polyphenole und Flavanole je Tasse, gemessen gegen 300 mg im Kaffee — ' +
      'und elfmal so viel wie in industriellem Kakao.',
  },
]);

export function Vorteile() {
  return (
    <section className="cc-va-vorteile" aria-labelledby="cc-va-vorteile-titel">
      <h2 id="cc-va-vorteile-titel">Warum unser Kakao</h2>
      <div className="cc-va-vorteile-gitter">
        {VORTEILE.map((v) => (
          <article className="cc-va-vorteil" key={v.titel}>
            <h3>{v.titel}</h3>
            <p>{v.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * WOHER ER KOMMT — Herkunft und Pruefung, woertlich aus der Sektion
 * „100% naturrein" auf /pages/crystal-cacao; die Bio-Nummer steht auf beiden
 * Kaufseiten. Der Link auf die Analyse ist derselbe, den die Uebersichtsseite
 * seit jeher fuehrt: der Beleg wird gezeigt, nicht behauptet.
 */
export function Herkunft() {
  return (
    <section className="cc-va-herkunft">
      <div className="cc-va-herkunft-bild">
        <LazyImage
          alt="Kakaobohnen"
          highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet-beans.jpg?v=1771790303"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet-beans_small.jpg?v=1771790303"
        />
      </div>
      <div className="cc-va-herkunft-text">
        <h2>Woher er kommt</h2>
        <p>
          Aus einer überlieferten Kakaolinie mit mehr als 6.300 Jahren Ursprung.
          Naturbelassen, unverfälscht und in Bio-Qualität, zertifiziert nach
          DE-ÖKO-006.
        </p>
        <p>
          Was drin ist, steht nicht nur hier: der Kakao wird laboranalytisch
          geprüft, und der Bericht liegt offen.
        </p>
        <a
          className="cc-va-beleg-link"
          href={ANALYSE_PDF}
          target="_blank"
          rel="noreferrer"
        >
          Laboranalyse ansehen (PDF)
        </a>
      </div>
    </section>
  );
}

/**
 * STIMMEN — Christian: „Und dann Bewertungen kommen etc. — hier welche aus dem
 * Google-Profil raussuchen und posten."
 *
 * DREI ECHTE, woertlich, mit Vorname und Datum wie im Profil. Herkunft und
 * Messgrenze stehen in app/data/kakao-stimmen.js und werden hier auch dem
 * Besucher genannt, statt sie im Quelltext zu verstecken: die Zeile unter den
 * Karten sagt, aus welchem Profil sie stammen und verlinkt es.
 *
 * WARUM HIER UND NICHT GANZ OBEN: sozialer Beweis ZIEHT, aber der Kunde muss
 * erst wissen, worum es geht — die Reihenfolge ist Nutzen, Beleg, Menschen,
 * Wahl, Abschluss.
 */
export function Stimmen() {
  return (
    <section className="cc-va-stimmen" aria-labelledby="cc-va-stimmen-titel">
      <h2 id="cc-va-stimmen-titel">Was Kundinnen und Kunden schreiben</h2>
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
    </section>
  );
}

/**
 * ABSCHLUSS — die Stufe, an der laut Einwandslage der Kauf entschieden wird und
 * die dieser Laden bisher gar nicht hatte. Risikoumkehr und Versandbedingung
 * stehen woertlich so auf /pages/crystal-cacao („Unser Versprechen an dich")
 * bzw. auf den Kaufseiten (CacaoBenefitList) — kein neues Versprechen, nur
 * eines, das der Kunde jetzt sieht, bevor er sich entscheidet.
 */
export function Abschluss() {
  return (
    <section className="cc-va-abschluss">
      <h2>20 Tage testen — komplett risikofrei</h2>
      <p className="cc-va-abschluss-lead">
        100 % Geld-zurück-Garantie, selbst bei geöffneter Packung. Nicht
        zufrieden? Einfach zurücksenden, wir erstatten dir alles.
      </p>
      <ul className="cc-va-abschluss-liste">
        <li>Kostenloser Versand ab 99 € innerhalb Deutschlands</li>
        <li>Lieferung in 1–3 Werktagen</li>
        <li>Laboranalytisch geprüft (Dartsch Institut)</li>
        <li>Bio-zertifiziert nach DE-ÖKO-006</li>
      </ul>
      <div className="cc-knopfreihe cc-va-abschluss-knopf">
        <Link className="cc-knopf" to="/pages/crystal-cacao">
          Unseren Kakao ansehen
        </Link>
      </div>
    </section>
  );
}
