import {Link} from 'react-router';

/**
 * AbsichtHinweis — der Verweis auf /pages/warum-crystal-cacao.
 *
 * WARUM EINE KOMPONENTE UND NICHT DREIMAL EIN <Link>: der Auftrag verlangt
 * Verweise von mindestens drei Flaechen (Startseite, beide Kaufseiten). Drei
 * handgeschriebene Links waeren drei Stellen, die denselben Zustand fuehren —
 * und beim naechsten Umbau waeren zwei davon nachgezogen und die dritte nicht.
 * Dieselbe Begruendung, aus der KAKAO_PFADE existiert (siehe Kopf von
 * app/lib/kakao-zone.js): eine Liste, die in einer Komponente mitwohnt, wird
 * beim naechsten Seitenbau vergessen.
 *
 * WARUM NICHT NUR DAS FUSSMENUE: der Eintrag dort steht auf JEDER Seite und
 * ist der Boden. Er ist aber auch die Zeile, die niemand liest — im Fussmenue
 * stehen sonst nur Rechtstexte. Ein Verweis im INHALT sagt dem Leser, dass
 * dort etwas steht, das mit dem zu tun hat, was er gerade liest. Fuer die
 * Messung ist der Unterschied tragend: probe_absicht_am_kundenrand.py sucht
 * den Verweis AUSSERHALB des <footer>, sonst waere ein einziger Fussmenue-
 * Eintrag als „drei Flaechen verlinken" durchgegangen.
 *
 * WARUM KEIN GOLDENER KNOPF: Gold traegt in dieser Designsprache HANDLUNG und
 * BEWEIS (app/styles/kakao-seiten.css, Abschnitt Farbe — genau EIN Akzent).
 * Ein Absichtstext ist weder das eine noch das andere; ein Kaufknopf-Look auf
 * einem Text ohne Kaufabsicht waere ein Versprechen ueber den Inhalt, das die
 * Seite dahinter nicht einloest.
 *
 * WARUM DER SATZ IN ANFUEHRUNGSZEICHEN STEHT: er ist Christians Wortlaut aus
 * dem Auftrag vom 2026-09-11 und nicht unsere Zusammenfassung. Wer ihn
 * aendert, aendert ein Zitat.
 */
export function AbsichtHinweis({id} = {}) {
  return (
    <section className="cc-absicht-hinweis" id={id}>
      <p className="cc-absicht-hinweis__kicker">Warum es das gibt</p>
      <p className="cc-absicht-hinweis__satz">
        „Crystal Cacao kommt aus meinem Wunsch, Mineralmedizin zu etablieren."
      </p>
      <p className="cc-absicht-hinweis__wer">
        Christian Bernd Bauer, Gründer
      </p>
      <p>
        <Link
          className="cc-absicht-hinweis__link"
          to="/pages/warum-crystal-cacao"
          prefetch="intent"
        >
          Die ganze Absichtserklärung lesen
        </Link>
      </p>
    </section>
  );
}
