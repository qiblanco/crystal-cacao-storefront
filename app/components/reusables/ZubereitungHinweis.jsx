import {Link} from 'react-router';

import {ZUBEREITUNG_PFAD, ZUBEREITUNG_REEL} from '~/data/zubereitung-reel';

/**
 * Der kurze Hinweis der Kaufseiten auf den Reiter „Zubereitung".
 *
 * Job 20261030-crystal-cacao-zubereitung-reiter-reel-design-99. Christian:
 * Reiter „Zubereitung" mit dem Reel, „oder eben irgendwo gekonnt auf der
 * Landingpage oder in der Shopseite". Die Kaufseiten bekommen deshalb den
 * Weg dorthin, nicht ein zweites Video: der Abschnitt „Zubereitung" darueber
 * stammt aus KakaoTiefe (K1, byte-gleich zur Vorlage) und bleibt unberuehrt.
 *
 * Das Titelbild ist klein und lazy; das Video selbst laedt erst auf der
 * Zubereitungsseite und dort erst beim Klick.
 *
 * <section>, NICHT <aside>: app.css stylt jedes `aside` als Schublade
 * (position: fixed, rechts ausserhalb, 100dvh hoch). Als <aside> stand der
 * Hinweis unsichtbar neben dem Bildschirm, obwohl er im HTML stand.
 */
export function ZubereitungHinweis() {
  const r = ZUBEREITUNG_REEL;
  return (
    <section className="cc-zb-hinweis" aria-labelledby="cc-zb-hinweis-titel">
      <div className="cc-zb-hinweis__innen">
        <Link
          className="cc-zb-hinweis__bild"
          to={ZUBEREITUNG_PFAD}
          prefetch="intent"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={`${r.posterUrl}&width=240`}
            srcSet={`${r.posterUrl}&width=120 120w, ${r.posterUrl}&width=240 240w`}
            sizes="96px"
            width={r.breite}
            height={r.hoehe}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="cc-zb-hinweis__text">
          <p id="cc-zb-hinweis-titel" className="cc-zb-hinweis__titel">
            Zubereitung im Video
          </p>
          <p>
            So machen wir unsere tägliche Tasse: abwiegen, aufgießen, mixen.
          </p>
          <Link className="cc-zb-hinweis__weiter" to={ZUBEREITUNG_PFAD} prefetch="intent">
            Zur Anleitung mit Video
          </Link>
        </div>
      </div>
    </section>
  );
}
