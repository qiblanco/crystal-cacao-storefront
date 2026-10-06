import {useCallback, useEffect, useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {useDragSwipe} from '~/components/reusables/useDragSwipe';
import {KachelPreis} from '~/components/KachelPreis';
import {SORTEN} from '~/lib/sorten-profil';
import {KAKAO_KENNZAHLEN} from '~/lib/kakao-zone';

/**
 * SortenSlider — der erste Eindruck der Startseite (seit 2026-10-02).
 *
 * Christian, 02.10.2026: „im oberen Bereich, wirklich wenn jemand drauf kommt,
 * einen Slider, der ganz klar sagt, was für Produkte gibt es. Awake, Create
 * und was sind die Unterschiede … das eine ist herzöffnend, powerful, das ist
 * Awake, und der Create ist Fokus, High Performance.“
 *
 * AUFBAU
 *   Kopf      Eyebrow, die eine H1 der Seite, Bewertungszeile.
 *   Sortenwahl  zwei Knöpfe (role=tab), die BEIDE Sorten mit ihrem Zustand
 *             gleichzeitig zeigen, bevor jemand wischt. Mit zwei Folien IST
 *             die Übersicht der Inhalt. Das ist die eine ausgewiesene
 *             Abweichung vom Standard-Slider (homepage-bauer/baukasten/
 *             qb-standard-slider: „zwei Bedienelemente, keine dritte“): die
 *             Knöpfe sind die Produktübersicht, die der Auftrag verlangt,
 *             kein drittes Slider-Bedienelement.
 *   Bühne     eine Bahn mit zwei Folien (mode 'transform', diskreter Index,
 *             wie InfoSlider). Wischen per useDragSwipe (Finger und Maus),
 *             Klick, Tastatur (Pfeiltasten auf Bühne und Sortenwahl).
 *   Bedienung Christians Standard: Fortschrittsbalken + zwei Pfeile UNTER der
 *             Bahn, Fortschritt = aktiv / maxIndex, „weiter“ wickelt am Ende
 *             auf die erste Folie, „zurück“ klemmt bei 0. Kein Autoplay, kein
 *             Wischhinweis-Text, keine native Scrollleiste.
 *
 * KEIN LAYOUT-SPRUNG: beide Folien liegen nebeneinander auf einer Bahn, die
 * Bahn ist so hoch wie die höchste Folie. Der Wechsel verschiebt nur per
 * transform. Bilder tragen width/height.
 *
 * OHNE JAVASCRIPT steht Awake vollständig da (SSR, Index 0), und beide Namen
 * mit ihrem Zustand stehen in der Sortenwahl.
 *
 * DIE NICHT AKTIVE FOLIE ist nach dem Übergang `visibility: hidden`, aria-hidden
 * und inert: kein Tab-Stopp in einer Folie, die man nicht sieht, und kein Text,
 * den eine Messung „oben“ findet, obwohl er rechts neben dem Bildschirm liegt.
 */

/** Fakten je Sorte — Herstellerangaben, Quelle je Zeile. */
const FAKTEN = Object.freeze({
  awake: [
    // sorten-profil.js inhaltsstoffe.liste + fazit
    '30 mg L-Tryptophan je 100 g, der höchste Wert unserer Sorten',
    // amazonstil-daten.js SORTENVERGLEICH (bohne), Awake.jsx herkunftRows
    'Piura Blanco aus dem Norden Perus',
    // Kakao.jsx MusterSection, Route products.crystal-cacao-*: Bio DE-ÖKO-006
    '100 % Kakao in Bio-Qualität, ohne Zucker',
  ],
  create: [
    '1.050 mg Theobromin je 100 g, das stärkste aktivierende Profil',
    // Create.jsx herkunftRows: „Bergwäldern des peruanischen Departamento Amazonas“
    'Amazonas Nativo aus Perus Bergwäldern',
    '100 % Kakao in Bio-Qualität, ohne Zucker',
  ],
});

/** Der Satz unter dem Claim — die Einordnung aus sorten-profil.js. */
const REIHENFOLGE = ['awake', 'create'];

function Pfeil() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/**
 * @param {{produkte: {awake?: any, create?: any} | null}} props
 */
export function SortenSlider({produkte = null}) {
  const [aktiv, setAktiv] = useState(0);
  const [slideStep, setSlideStep] = useState(420);
  const buehneRef = useRef(null);
  const trackRef = useRef(null);
  const tabRefs = useRef([]);
  const max = REIHENFOLGE.length - 1;

  useEffect(() => {
    const messen = () => {
      const b = buehneRef.current;
      if (b) setSlideStep(b.getBoundingClientRect().width || 420);
    };
    messen();
    window.addEventListener('resize', messen);
    return () => window.removeEventListener('resize', messen);
  }, []);

  const weiter = useCallback(
    () => setAktiv((i) => (i < max ? i + 1 : 0)),
    [max],
  );
  const zurueck = useCallback(() => setAktiv((i) => (i > 0 ? i - 1 : i)), []);

  const {handlers, isDragging, dragOffset} = useDragSwipe({
    mode: 'transform',
    slideStep,
    onNext: weiter,
    onPrev: zurueck,
    canNext: () => true, // wickelt am Ende auf 0 (Standard)
    canPrev: () => aktiv > 0,
  });

  const fortschritt = max > 0 ? (aktiv / max) * 100 : 100;

  const tastenBuehne = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      weiter();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      zurueck();
    }
  };

  // WAI-ARIA Tabs, automatische Aktivierung: Pfeiltaste wählt UND fokussiert.
  const tastenWahl = (e) => {
    let ziel = null;
    if (e.key === 'ArrowRight') ziel = aktiv < max ? aktiv + 1 : 0;
    else if (e.key === 'ArrowLeft') ziel = aktiv > 0 ? aktiv - 1 : max;
    else if (e.key === 'Home') ziel = 0;
    else if (e.key === 'End') ziel = max;
    if (ziel === null) return;
    e.preventDefault();
    setAktiv(ziel);
    tabRefs.current[ziel]?.focus();
  };

  return (
    <section
      className="cc-akt cc-akt--grund cc-start-slider"
      aria-labelledby="cc-start-titel"
    >
      <div className="cc-akt__innen">
        <div className="cc-start-slider__kopf">
          <p className="cc-eyebrow">Crystal Cacao® · High Performance Cacao aus Peru</p>
          <h1 id="cc-start-titel">Zwei Sorten. Zwei Zustände.</h1>
          <p className="cc-start-slider__bewertung">
            {KAKAO_KENNZAHLEN.bewertung}{' '}
            {/* Klasse "d" = rein darstellend, springt nirgendwohin
                (Marker-Vertrag StarRating.jsx, sterne-klick-scroll-wache). */}
            <span className="qb-sterne" data-qb-rating="d" aria-hidden="true">
              ★★★★★
            </span>{' '}
            · Mehr als {KAKAO_KENNZAHLEN.nutzer} aktive Nutzer
          </p>
        </div>

        <div
          className="cc-sortenwahl"
          role="tablist"
          aria-label="Unsere zwei Sorten"
          onKeyDown={tastenWahl}
        >
          {REIHENFOLGE.map((sorte, i) => (
            <button
              key={sorte}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`cc-sortenwahl-${sorte}`}
              aria-selected={aktiv === i}
              aria-controls={`cc-folie-${sorte}`}
              tabIndex={aktiv === i ? 0 : -1}
              className={`cc-sortenwahl__knopf${aktiv === i ? ' is-aktiv' : ''}`}
              data-cc-sorte={sorte}
              onClick={() => setAktiv(i)}
            >
              <span className="cc-sortenwahl__name">{SORTEN[sorte].name}</span>
              <span className="cc-sortenwahl__zustand">
                {sorte === 'awake' ? 'herzöffnend, powerful' : 'Fokus, High Performance'}
              </span>
            </button>
          ))}
        </div>

        <div
          ref={buehneRef}
          className={`cc-buehne${isDragging ? ' is-dragging' : ''}`}
          role="region"
          aria-roledescription="Slider"
          aria-label="Crystal Cacao® Sorten"
          tabIndex={0}
          onKeyDown={tastenBuehne}
          {...handlers}
        >
          <div
            ref={trackRef}
            className="cc-buehne__bahn"
            style={{
              transform: `translateX(calc(${-aktiv * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : undefined,
            }}
          >
            {REIHENFOLGE.map((sorte, i) => (
              <Folie
                key={sorte}
                sorte={sorte}
                index={i}
                aktiv={aktiv === i}
                produkt={produkte?.[sorte] || null}
              />
            ))}
          </div>
        </div>

        <div className="cc-buehne__bedienung">
          <div
            className="ProgressWrapper"
            role="presentation"
          >
            <div
              className="ProgressTracker"
              style={{width: fortschritt + '%'}}
            />
          </div>
          <div className="SliderButtonWrapper">
            <button
              type="button"
              className="ButtonPrev SliderButton"
              aria-label="Vorherige Sorte"
              aria-controls="cc-folie-awake cc-folie-create"
              onClick={zurueck}
            >
              <Pfeil />
            </button>
            <button
              type="button"
              className="ButtonNext SliderButton"
              aria-label="Nächste Sorte"
              aria-controls="cc-folie-awake cc-folie-create"
              onClick={weiter}
            >
              <Pfeil />
            </button>
          </div>
        </div>
        <p className="cc-visuell-versteckt" aria-live="polite">
          {`Sorte ${aktiv + 1} von ${REIHENFOLGE.length}: ${SORTEN[REIHENFOLGE[aktiv]].name}`}
        </p>
      </div>
    </section>
  );
}

/**
 * DIE WORTMARKE HAT KEINE FESTE BREITE, SONDERN EINE FESTE HOEHE:
 * startseite.css setzt .cc-folie__wortmarke auf 64 px (mobil) und 88 px
 * (ab 48em), die Breite folgt dem Seitenverhaeltnis der Datei. Die sizes
 * werden deshalb daraus gerechnet, nicht getippt. Bis 2026-10-06 stand hier
 * fest "(min-width: 48em) 280px, 220px" -- gemessen 2026-10-06 lag Create
 * mobil bei 145 px, bekam 640w geliefert (2,21x, Befund der rt-Wache
 * ladeverhalten-bildmasse-kakao). Aendert sich die CSS-Hoehe, muessen die
 * zwei Zahlen hier mitwandern.
 */
const WORTMARKE_HOEHE_MOBIL = 64;
const WORTMARKE_HOEHE_BREIT = 88;
function wortmarkeSizes(marke) {
  const v = marke.breite / marke.hoehe;
  return `(min-width: 48em) ${Math.ceil(WORTMARKE_HOEHE_BREIT * v)}px, ${Math.ceil(WORTMARKE_HOEHE_MOBIL * v)}px`;
}

function Folie({sorte, index, aktiv, produkt}) {
  const profil = SORTEN[sorte];
  const marke = profil.wortmarke;
  const bild = produkt?.featuredImage || null;
  return (
    <div
      id={`cc-folie-${sorte}`}
      className={`cc-folie${aktiv ? ' is-aktiv' : ''}`}
      data-cc-sorte={sorte}
      role="tabpanel"
      aria-labelledby={`cc-sortenwahl-${sorte}`}
      aria-hidden={aktiv ? undefined : 'true'}
      // React 18 kennt `inert` nicht als Boolean; als leeres Attribut wirkt es.
      inert={aktiv ? undefined : ''}
    >
      <div className="cc-folie__text">
        <p className="cc-eyebrow cc-folie__nummer">Sorte {index + 1} von 2</p>
        {/* h3, nicht h2: die Seite fuehrt EINEN H2-Stil (Abschnittstitel);
            der Sortenname ist die Wortmarke, ihre Groesse traegt das Bild. */}
        <h3 className="cc-folie__name">
          <img
            className="cc-folie__wortmarke"
            src={`${marke.url}&width=640`}
            srcSet={`${marke.url}&width=320 320w, ${marke.url}&width=640 640w`}
            sizes={wortmarkeSizes(marke)}
            width={marke.breite}
            height={marke.hoehe}
            alt={`Crystal Cacao® ${profil.name}`}
            loading="eager"
            decoding="async"
          />
        </h3>
        <p className="cc-folie__claim">{profil.claim}</p>
        <p className="cc-folie__satz">{profil.einordnung}</p>
        <ul className="cc-folie__fakten">
          {FAKTEN[sorte].map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="cc-folie__kauf">
          {produkt ? <KachelPreis produkt={produkt} /> : null}
          <div className="cc-folie__knoepfe">
            <a className="btn--primary cc-folie__knopf" href={profil.pfad}>
              {profil.name} kaufen
            </a>
            <a className="cc-folie__link" href="#cc-analyseprofile">
              Profile vergleichen
            </a>
          </div>
        </div>
      </div>
      <div className="cc-folie__bild">
        {bild ? (
          <Image
            data={bild}
            alt={`Crystal Cacao® ${profil.name}, Packung`}
            aspectRatio="1/1"
            sizes="(min-width: 72em) 520px, (min-width: 48em) 44vw, calc(100vw - 40px)"
            loading="eager"
            fetchPriority={index === 0 ? 'high' : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
