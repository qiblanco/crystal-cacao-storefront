import {Link} from 'react-router';

import {bildQuellen} from './shopifyBildQuellen';

/**
 * AbsichtHinweis — Christians persönliche Zeile mit seinem Foto und dem Weg
 * zu /pages/warum-crystal-cacao.
 *
 * ============ NEU GEFASST AM 2026-09-26 (Job 20260926-GROSSJOB-crystal-
 * cacao-seitendurchgang-videos-pruefdokumente-texte-gruenderbild) ============
 * Christian zu der Fassung davor (Kicker „Warum es das gibt", ein Satz in
 * Anführungszeichen, „Christian Bernd Bauer, Gründer", Link „Die ganze
 * Absichtserklärung lesen"): „Klingt 1000 % nach AI. Warum schreiben wir noch
 * solche AI-Texte? Warum ‚Absichtserklärung'? Das klingt nach einem
 * Rechtsstaat, nicht nach einer persönlichen Einladung. Außerdem fehlt mein
 * Bild dazu."
 *
 * Was sich deshalb geändert hat, jeweils mit Grund:
 *   - SEIN FOTO steht dabei. Es ist dieselbe Datei, die er auf qiblanco.com
 *     neben seine Unterschrift gestellt hat (qiblanco-storefront
 *     app/data/absicht.js, ABSENDER_FOTO, #400 vom 2026-09-12: „es fehlt ein
 *     Foto von mir"). Ein Gesicht, eine Datei, kein neues Bild.
 *   - KEIN KICKER in Versalien mehr. Die Zeile „WARUM ES DAS GIBT" über einem
 *     einzelnen Satz war die Form eines Formulars, nicht die einer Nachricht.
 *   - DER SATZ ERZÄHLT, statt zu erklären: wo er den Kakao kennengelernt hat
 *     und was er damit will. Beides sind seine Aussagen (Auftrag vom
 *     2026-09-11 „Kaffee abzulösen", Podcast kd7Z-ITKYDo: Tulum/Mexiko, „wir
 *     haben Kakao ganz anders kennengelernt"). Er steht ohne
 *     Anführungszeichen, weil er in seinem Namen geschrieben ist und nicht
 *     wörtlich gesprochen wurde.
 *   - DER LINK LÄDT EIN: „Lies, wie der Kakao zu uns kam" statt
 *     „Absichtserklärung". Das Wort kommt auf keiner Kundenfläche mehr vor.
 *
 * WARUM EINE KOMPONENTE UND NICHT DREIMAL EIN <Link>: der Verweis steht auf
 * drei Flächen (Startseite, beide Kaufseiten). Drei handgeschriebene Links
 * wären drei Stellen, die denselben Zustand führen — und beim nächsten Umbau
 * wären zwei davon nachgezogen und die dritte nicht.
 *
 * WARUM NICHT NUR DAS FUSSMENÜ: der Eintrag dort ist der Boden, aber die
 * Zeile, die niemand liest. Ein Verweis im INHALT erreicht den Leser, der
 * gerade die Prüfdokumente gesehen hat. Gemessen wird das außerhalb des
 * <footer> (crystal-cacao-node/proben/probe_absicht_am_kundenrand.py, Arm F).
 *
 * WARUM KEIN GOLDENER KNOPF: Gold trägt in dieser Designsprache HANDLUNG und
 * BEWEIS (kakao-seiten.css, Abschnitt Farbe — genau EIN Akzent). Eine
 * persönliche Zeile ist kein Kaufangebot.
 *
 * DIE ZEILE „Christian Bernd Bauer, Gründer" bleibt EIN Textknoten: die
 * Erfüllungsprobe des Auftrags sucht genau diesen Knoten und verlangt im
 * selben Block ein geladenes Bild.
 */

/** Christians Porträt — Master 1200x1535, auf qiblanco.com öffentlich in
 *  Gebrauch (Warum-Seite, Autorenkasten der Fachartikel). */
export const GRUENDER_FOTO = {
  url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Christian.jpg?v=1668985845',
  masterBreite: 1200,
  alt: 'Christian Bernd Bauer',
};

/**
 * Bildquellen für das Porträt in einer bekannten Anzeigegröße (quadratisch
 * zugeschnitten per CSS, mit dem einen Bildradius der Seite).
 * `anzeigeBreite` ist die größte gerenderte Kantenlänge in CSS-Pixeln; die
 * Leiter deckt dpr 1 bis 3 ab und bleibt unter dem Master.
 */
export function gruenderFotoQuellen(anzeigeBreite, sizes) {
  return bildQuellen(GRUENDER_FOTO.url, {
    anzeigeBreite,
    masterBreite: GRUENDER_FOTO.masterBreite,
    zusatzSprossen: [96, 192, 288],
    sizes,
  });
}

export function AbsichtHinweis({id} = {}) {
  const foto = gruenderFotoQuellen(120, '(min-width: 48em) 120px, 96px');
  return (
    <section className="cc-absicht-hinweis" id={id}>
      <img
        className="cc-absicht-hinweis__foto"
        src={foto.src}
        srcSet={foto.srcSet}
        sizes={foto.sizes}
        width={120}
        height={120}
        alt={GRUENDER_FOTO.alt}
        loading="lazy"
        decoding="async"
      />
      <div className="cc-absicht-hinweis__text">
        <p className="cc-absicht-hinweis__satz">
          In Mexiko habe ich Kakao so kennengelernt, wie er wirklich ist.
          Seitdem möchte ich Kaffee ablösen: mit einer Tasse, die dir etwas
          mitbringt.
        </p>
        <p className="cc-absicht-hinweis__wer">Christian Bernd Bauer, Gründer</p>
        <p className="cc-absicht-hinweis__weg">
          <Link
            className="cc-absicht-hinweis__link"
            to="/pages/warum-crystal-cacao"
            prefetch="intent"
          >
            Lies, wie der Kakao zu uns kam
          </Link>
        </p>
      </div>
    </section>
  );
}
