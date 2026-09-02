/**
 * StarRating — geteilte 5-Sterne-Darstellung der 4,8-Google-Bewertung
 * (Block Landingpage; Job 20260718-lp-sterne-reputon-googlelink).
 *
 * Immer 5 sichtbare gelbe Sterne; der Wert (z.B. 4,8) wird wie bei
 * Google-Rezensionen ueblich als fraktionale Fuellung gerendert
 * (4 volle Sterne + 5. Stern zu 80 %). Overlay-Clip statt SVG-Gradient:
 * SSR-safe ohne id-Kollisionen (Hydrogen streamt serverseitig).
 *
 * GOOGLE_REVIEWS_URL ist die EINE Quelle fuer das Klickziel: die
 * Rezensionen-Ansicht des Google-Business-Profils »Qi Blanco«
 * (Place-ID aus der Reputon-Widget-Config, die auch die 4,8 liefert).
 *
 * ---------------------------------------------------------------------------
 * MARKER-VERTRAG `data-qb-rating` (Job 20260820-wurzel-sterne-klick-scroll,
 * Segment s03; Standard + Ausnahme siehe devlog D-2026-08-22).
 *
 *   "s"  Sprung zum Bewertungsbereich derselben Seite  (DEFAULT)
 *   "g"  Link auf das Google-Profil — genau 1 je Seite mit Bewertungsbereich
 *   "d"  rein darstellend (Sterne der einzelnen Bewertungskarten)
 *
 * OHNE Marker = Fehlstelle. "Darstellend" gilt nur, wenn es im Code STEHT —
 * die Klasse wird an der VERWENDUNGSSTELLE gesetzt, nie zur Laufzeit aus dem
 * DOM erraten (Christian 2026-08-20 21:47).
 *
 * WARUM DIE GRAFIK UNVERAENDERT BLEIBT — das ist der teure Teil dieser Datei:
 * die Wache enumeriert ihren NENNER unter anderem über das Signal ARIA
 * (`[role="img"][aria-label]` mit "von 5"/"Sterne"). Auf DACH ist genau dieses
 * Markup mit 88 von 94 Treffern die tragende Saeule des Nenners. Wer den
 * Traeger zum Knopf UMWIDMET (role="button", aria-label "Zu den Bewertungen
 * springen"), verliert BEIDE Haelften der Bedingung auf einmal: die Wache
 * findet die Instanzen nicht mehr, der Nenner faellt zusammen und sie meldet
 * GRUEN, WEIL SIE BLIND GEWORDEN IST — exakt der Fehler, gegen den dieser Job
 * gebaut wurde. Deshalb wird die Interaktivitaet DANEBENGESTELLT, nicht
 * hineingebaut: `SterneSprung` umschliesst die Grafik als echter <button>.
 * Faustregel für jeden Folgebau: nicht "ist meine Aenderung korrekt?",
 * sondern "SIEHT MEIN ZAEHLER MICH DANACH NOCH?".
 * ---------------------------------------------------------------------------
 */

export const GOOGLE_REVIEWS_URL =
  'https://search.google.com/local/reviews?placeid=ChIJafc6o-z3okcRPlf__D3fDBM';

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function Star({size}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

/**
 * Bedienbarer Traeger für eine Sterne-Zeile: macht die GANZE Zeile
 * (Zahl + Sterne + Nutzerzahl) zum Sprung-Ausloeser — dieselbe Bauform, die
 * der Bestand mit `a.product-rating--google` bereits für den Google-Link
 * nutzt, nur als <button> statt als <a>.
 *
 * ES IST BEWUSST EIN ECHTER <button> UND KEIN VERDRAHTETES <span>: Enter und
 * Leertaste loesen dort NATIV ein click-Ereignis aus, Fokussierbarkeit und
 * Rollen-Semantik kommen vom Element. Das US-Vorbild (qb-reviews.js) braucht
 * einen eigenen keydown-Handler nur deshalb, weil es beliebige <span>
 * verdrahtet — hier wäre er doppelt und damit falsch.
 *
 * Das Verhalten hängt NICHT hier, sondern delegiert am document
 * (useSterneSprungDelegation in GoogleRezensionenBereich.jsx). Grund ist kein
 * Geschmack, sondern ein Zyklus: StarRating -> GoogleRezensionenBereich ->
 * ReputonWidget -> StarRating. Die Delegation ist zugleich das Muster, das der
 * US-Stack seit Wochen faehrt (Uebertragungsrichtung US -> DACH).
 */
export function SterneSprung({className = '', children, label}) {
  return (
    <button
      type="button"
      className={`sterne-sprung ${className}`.trim()}
      data-qb-rating="s"
      aria-label={label || 'Zu den Bewertungen springen'}
    >
      {children}
    </button>
  );
}

export function StarRating({value = 4.8, size = 18, qb = 's'}) {
  const label = `${String(value).replace('.', ',')} von 5 Sternen`;
  return (
    <span
      className="star-rating"
      role="img"
      aria-label={label}
      {...(qb ? {'data-qb-rating': qb} : {})}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const anteil = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="star-rating__star">
            {/* KEINE Farbe im JSX: die beiden Sterntoene kommen aus
                --qb-sterne-leer / --qb-sterne-gold und werden in app.css an
                .star-rating__star > svg bzw. .star-rating__fill > svg
                gesetzt. CSS schlaegt Praesentationsattribute, also gaebe ein
                fill hier eine zweite, still konkurrierende Wahrheit. */}
            <Star size={size} />
            {anteil > 0 && (
              <span
                className="star-rating__fill"
                style={{width: `${anteil * 100}%`}}
              >
                <Star size={size} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
