import {useEffect, useRef, useState} from 'react';
import {bildQuellen} from './shopifyBildQuellen';

/**
 * LazyImage — Vorschaubild zuerst, scharfes Bild beim Heranscrollen.
 *
 * ====================================================================
 * WARUM DIESE DATEI EINEN SOFORT-MODUS BEKOMMEN HAT (2026-09-17, gemessen)
 * ====================================================================
 * Dieser Baustein rendert das GROESSTE sichtbare Element der Startseite —
 * das Hero-Produktbild. Bis zu diesem Bau tat er dafür drei Dinge, die
 * jedes für sich richtig klingen und zusammen das LCP-Element hinter die
 * Hydration schieben:
 *
 *   1. `loading="lazy"` — auch oberhalb der Falte.
 *   2. `src` trägt anfangs NUR `compressedLink` (die _small-Datei).
 *   3. `highQualityLink` steht überhaupt erst im DOM, nachdem React
 *      hydriert hat UND ein IntersectionObserver gefeuert hat.
 *
 * Der Vorlade-Scanner des Browsers liest das rohe HTML, bevor JavaScript
 * läuft. `highQualityLink` steht dort nicht — er kann es also baulich nicht
 * finden. Die Kette lautet: HTML -> JS-Bundle laden -> hydrieren ->
 * Observer -> setState -> ERST JETZT das Bild anfordern.
 *
 * GEMESSEN am 2026-09-17 auf qiblanco.com (Android 390x844 DPR2, gedrosselt
 * 1,6 Mbit/s, 150 ms Latenz, 25-s-Fenster, Median aus 3 Laeufen):
 *   - Das Hero-Bild kam laut `responseEnd` bei t = 19 395 ms an.
 *   - Der LCP der Seite lag bei 19 836 ms — es IST das LCP-Element.
 *
 * ====================================================================
 * UND DERSELBE BAUSTEIN ERZEUGTE DEN GRÖSSTEN LAYOUT-SPRUNG DER SEITE
 * ====================================================================
 * Das <img> trug weder `width` noch `height`. Ein <img> ohne Abmessungen
 * nimmt die Größe dessen an, was gerade geladen IST. Gemessen:
 *   - mit Platzhalter (_small, nativ 100x100): Box 100 x 100 px
 *   - mit scharfem Bild (nativ 1080x1080):     Box 358 x 358 px
 * Die Differenz ist 258 px — und genau 258 px sprang die Überschrift der
 * Hero-Sektion bei t = 19 409 ms nach unten, also 14 ms nach dem Eintreffen
 * des Bildes. Dieser eine Sprung war 0,1338 von CLS 0,3014, also 44 % der
 * gesamten Layout-Verschiebung der Startseite.
 *
 * Der Platzhalter-Ansatz ist deshalb nicht falsch — ihm fehlte nur die
 * Angabe des Seitenverhaeltnisses. Ein Platzhalter OHNE feste Abmessung
 * verschiebt den Sprung, er verhindert ihn nicht.
 *
 * ====================================================================
 * WAS SICH NICHT AENDERT (never-break)
 * ====================================================================
 * Alle neuen Eigenschaften sind OPTIONAL. Wird keine davon uebergeben,
 * verhält sich der Baustein exakt wie vorher: Platzhalter, Observer,
 * `loading="lazy"`, kein srcset. Die uebrigen fünf Aufrufer (Awake,
 * Create, Kakao und die zwei crystal-cacao-Routen) sind damit unberührt —
 * sie liegen im Mutationsgebiet anderer Segmente.
 *
 * @param {object} p
 * @param {string} p.compressedLink   kleine Vorstufe (nur im Beobachter-Modus)
 * @param {string} p.highQualityLink  scharfe Datei
 * @param {string} [p.alt]
 * @param {boolean} [p.sofort]        LCP-Modus: kein Platzhalter, kein
 *   Beobachter, `loading="eager"` + `fetchpriority="high"`. NUR für ein
 *   Bild setzen, das oberhalb der Falte steht — `high` auf allem ist
 *   dasselbe wie `high` auf nichts.
 * @param {number} [p.breite]         für das width-Attribut (Seitenverhältnis)
 * @param {number} [p.hoehe]          für das height-Attribut
 * @param {number} [p.anzeigeBreite]  größte Anzeigebreite in CSS-px -> srcset
 * @param {string} [p.sizes]          eigener sizes-Wert
 * @param {number} [p.masterBreite]   echte Masterbreite, klemmt die Leiter
 * @param {string} [p.className]
 */
export default function LazyImage({
  compressedLink,
  highQualityLink,
  alt = 'image',
  sofort = false,
  breite,
  hoehe,
  anzeigeBreite,
  sizes,
  masterBreite,
  className,
}) {
  const [isSeen, setIsSeen] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Im Sofort-Modus gibt es nichts zu beobachten: das scharfe Bild steht
    // bereits im ersten HTML. Der Beobachter würde nur Arbeit kosten.
    if (sofort || !imgRef.current || isSeen) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsSeen(true);
        observer.disconnect();
      }
    });

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isSeen, sofort]);

  const quelle = sofort || isSeen ? highQualityLink : compressedLink;

  /*
   * Die Leiter hängt an der ANZEIGE-Breite, nicht an der Masterbreite —
   * sonst liefert sie dem Telefon Desktop-Pixel. `bildQuellen` lässt
   * Nicht-CDN-Quellen unveraendert durch (fail-soft), und ohne
   * `anzeigeBreite` entsteht gar keine Leiter: dann ist `q.srcSet`
   * undefined, React rendert das Attribut nicht, und das Bild verhält
   * sich wie vorher.
   */
  const q = anzeigeBreite
    ? bildQuellen(quelle, {
        anzeigeBreite,
        masterBreite: masterBreite || null,
        sizes,
      })
    : {src: quelle, srcSet: undefined, sizes: undefined};

  return (
    <img
      ref={imgRef}
      src={q.src}
      srcSet={q.srcSet}
      sizes={q.sizes}
      alt={alt}
      className={className}
      width={breite}
      height={hoehe}
      loading={sofort ? 'eager' : 'lazy'}
      /*
       * KLEINGESCHRIEBEN, und das ist gemessen statt uebernommen: der
       * Kopfkommentar von CdnBild.jsx hält fest, React 18.3 kenne
       * `fetchPriority` nicht und "würde es als unbekannte Eigenschaft
       * verwerfen". Am 2026-09-17 mit react-dom 18.3.1 nachgemessen
       * (renderToStaticMarkup, Warnungen mitgeschnitten):
       *   fetchPriority="high" -> <img ... fetchPriority="high"/> + Warnung
       *                           "React does not recognize the prop"
       *   fetchpriority="high" -> <img ... fetchpriority="high"/> + KEINE Warnung
       * Verworfen wird also nichts; die camelCase-Form ist nur laut. Die
       * kleingeschriebene Form geht sauber durch und ist gueltiges HTML.
       */
      /* eslint-disable-next-line react/no-unknown-property --
         Die Regel kennt nur die React-19-Schreibweise. Auf react-dom
         18.3.1 (diesem Repo) ist sie die LAUTE Variante: gemessen gibt
         `fetchPriority` eine SSR-Warnung bei jedem Rendern, die
         kleingeschriebene Form keine. Gueltiges HTML sind beide —
         HTML-Attributnamen sind ohnehin nicht schreibungsempfindlich. */
      fetchpriority={sofort ? 'high' : undefined}
      /* Bewusst auch im Sofort-Modus 'async': `sync` zwingt den
         Hauptstrang, das Bild zu dekodieren, bevor er weiterarbeitet.
         Bei einem 1080er-Bild kostet das mehr, als die frühere
         Darstellung einbringt — die Dringlichkeit gehört an den
         ABRUF (fetchpriority), nicht an das Dekodieren. */
      decoding="async"
    />
  );
}
