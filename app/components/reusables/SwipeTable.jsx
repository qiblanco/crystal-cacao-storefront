import {useCallback, useEffect, useRef, useState} from 'react';
import {useDragSwipe} from '~/components/reusables/useDragSwipe';

/*
 * BAUKASTEN qb-swipetab — breite Tabelle: erste Spalte FEST, Wertspalten WISCHBAR.
 * Regeln + CSS-Vertrag: app/styles/qb-swipetab.css (SSoT der Regeln:
 * shared-state/homepage-bauer/baukasten/qb-swipetab/).
 * Gebaut 2026-08-12, Job 20260811-responsive-tabelle-sticky-...-prio95.
 *
 * ROLLENTEILUNG (wichtig fürs Verständnis):
 *   Das Wischen selbst kann der Browser. Touch und Trackpad scrollen den Container
 *   nativ — dafür ist hier KEIN Javascript nötig. Diese Komponente liefert nur
 *   die zwei Dinge, die CSS nicht messen kann:
 *     (a) "gibt es überhaupt etwas zu wischen, und in welche Richtung noch?"
 *         -> Klassen is-wischbar / is-mehr-rechts / is-ab-links
 *     (b) Ziehen mit gedrückter MAUS — dafür der GEMEINSAME Storefront-Hook
 *         useDragSwipe(mode:'scroll'), Baustandard GL-DES-0012. Bewusst KEINE
 *         zweite Gesten-Implementierung: ein Server, ein Gefühl.
 *   Fällt Javascript aus, bleibt die Tabelle vollständig bedienbar: sticky-Spalte,
 *   Touch-Wisch, Trackpad, Tastatur und Scrollbar sind reines CSS/Browser-Verhalten.
 *   Der Hinweis-Text erscheint dann nicht — er verspricht also nie etwas, das
 *   gerade nicht ginge.
 *
 * Anpassung je Einsatzort ausschließlich über die CSS-Variablen (style-Prop),
 * niemals über freie Werte im Markup.
 */

const REST_PX = 2; // Sub-Pixel-Rundung: darunter zählt "am Anschlag"

export function SwipeTable({
  children,
  label = 'Tabelle horizontal wischbar',
  hinweis = 'Wischen',
  className = '',
  style,
}) {
  const vpRef = useRef(null);
  const [lage, setLage] = useState({
    wischbar: false,
    abLinks: false,
    mehrRechts: false,
  });

  const messen = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const weg = vp.scrollWidth - vp.clientWidth;
    const wischbar = weg > REST_PX;
    setLage((alt) => {
      const neu = {
        wischbar,
        abLinks: vp.scrollLeft > REST_PX,
        mehrRechts: wischbar && vp.scrollLeft < weg - REST_PX,
      };
      // Nur bei echter Änderung neu rendern — scroll feuert sonst pro Frame.
      return alt.wischbar === neu.wischbar &&
        alt.abLinks === neu.abLinks &&
        alt.mehrRechts === neu.mehrRechts
        ? alt
        : neu;
    });
  }, []);

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return undefined;
    messen();

    vp.addEventListener('scroll', messen, {passive: true});
    window.addEventListener('resize', messen, {passive: true});
    // Spät ladende Schriften/Bilder ändern die Spaltenbreiten -> nachmessen.
    // (Die Tabellenköpfe tragen Logos: ohne das misst man vor dem Layout.)
    if (document.fonts?.ready?.then) {
      document.fonts.ready.then(messen).catch(() => {});
    }
    let ro;
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(messen);
      ro.observe(vp);
    }
    return () => {
      vp.removeEventListener('scroll', messen);
      window.removeEventListener('resize', messen);
      ro?.disconnect();
    };
  }, [messen]);

  const {handlers, isDragging} = useDragSwipe({
    mode: 'scroll',
    enabled: lage.wischbar, // nichts zu ziehen -> Hook gar nicht erst aktiv
    trackRef: vpRef,
  });

  const klassen = [
    'qb-swipetab',
    lage.wischbar ? 'is-wischbar is-zieh-faehig' : '',
    lage.abLinks ? 'is-ab-links' : '',
    lage.mehrRechts ? 'is-mehr-rechts' : '',
    isDragging ? 'is-ziehen' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={klassen} style={style}>
      <div
        ref={vpRef}
        className="qb-swipetab__vp"
        // tabindex/role: der Scrollbereich muss per Tastatur erreichbar und
        // für Screenreader als eigener Bereich benannt sein (WCAG 2.1.1).
        // Der Lint-Regel ist nur role="tabpanel" als nicht-interaktive Ausnahme
        // bekannt; für einen SCROLLBAREN Bereich ist tabindex=0 aber genau die
        // vorgeschriebene Lösung — ohne ihn käme man per Tastatur nicht an die
        // rechten Spalten (axe: "scrollable region must have keyboard access").
        // Bewusst hier eng begrenzt statt die Regel projektweit aufzuweichen.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label={label}
        {...handlers}
      >
        {children}
      </div>
      {/* aria-hidden: reine Bedien-Dekoration. Die Tabelle selbst bleibt der Inhalt. */}
      <p className="qb-swipetab__hinweis" aria-hidden="true">
        {hinweis}
      </p>
    </div>
  );
}
