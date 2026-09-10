/**
 * sortenaufmacher-fassung — der RUECKWEG des Sorten-Aufmachers, ohne Deploy.
 *
 * Job 20260910-BAU-sortenbloecke-awake-und-create-leerer-bildschirm-ohne-aufgabe,
 * Kontrollstufe K2: „Nenne im RESULT ausdruecklich den RUECKWEG deiner
 * Aenderung — und ob er ERPROBT ist, nicht nur vorhanden."
 *
 * GEBAUT NACH DEM HAUSMUSTER, NICHT NEU ERFUNDEN (P10): app/lib/
 * startseite-fassung.js macht seit dem 2026-09-08 genau dasselbe fuer `/`.
 * Gleiche Form, gleiche Fail-closed-Regel, gleicher Vertrag — wer das eine
 * kennt, kennt das andere.
 *
 * PARAMETER (beide Richtungen, ohne Deploy, auf jeder der zwei Sortenseiten):
 *   ?aufmacher=neu       der Aufmacher dieses Baus (Default)
 *   ?aufmacher=bestand   der Zustand vom 2026-09-10 vor diesem Bau,
 *                        Markup unveraendert
 *
 * WARUM DER BESTAND ALS CODE STEHEN BLEIBT UND NICHT NUR IM GIT-VERLAUF:
 * dieselbe Ueberlegung wie bei `Bestandsfassung` in app/routes/_index.jsx.
 * Ein Rueckweg, der einen Bau und einen Dienst-Neustart braucht, ist im
 * Ernstfall kein Rueckweg, sondern ein zweiter Bau. Und die abgelegte
 * Fassung hat hier einen zweiten, harten Leser: `pruefungen/
 * probe_sortenaufmacher.py` faehrt ihren ROT-Nachweis GEGEN sie. Ohne die
 * Ablage waere der Nachweis nicht fuehrbar — die Probe kann dann nicht mehr
 * zeigen, dass sie den Zustand, gegen den sie gebaut ist, ueberhaupt
 * erkennt. Faellt die Ablage eines Tages weg, faellt dieser Arm auf
 * MESSAUSFALL und nicht auf gruen.
 *
 * DER DAUERHAFTE RUECKWEG ist trotzdem der Schalter unten: `FASSUNG` auf
 * 'bestand' zu setzen ist EINE Zeile und wirkt fuer alle Besucher.
 */

/** 'neu' = der Aufmacher dieses Baus · 'bestand' = der Zustand davor */
export const FASSUNG = 'neu';

const ERLAUBT = ['neu', 'bestand'];

/**
 * @param {Request} request
 * @returns {'neu'|'bestand'}
 */
export function waehleAufmacherFassung(request) {
  let p = null;
  try {
    p = new URL(request.url).searchParams;
  } catch {
    // FAIL-CLOSED wie im Hausmuster: eine unlesbare URL zeigt die
    // eingestellte Fassung, nie eine, die jemand ueber die Adresszeile
    // erraten hat.
    p = null;
  }
  if (p) {
    const f = p.get('aufmacher');
    if (ERLAUBT.includes(f)) return f;
  }
  return ERLAUBT.includes(FASSUNG) ? FASSUNG : 'neu';
}
