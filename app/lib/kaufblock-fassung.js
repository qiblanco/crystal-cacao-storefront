/**
 * kaufblock-fassung — der RUECKWEG der Kaufseiten-Anordnung, ohne Deploy.
 *
 * Grossjob 20261015-GROSSJOB-design-update-designmeister-homepagebauer-
 * fehler-wurzel-alle-beheben, Segment s06 (Register F-004, F-063, F-082,
 * F-090, F-106, F-107). Christian zur Desktopansicht der Kaufseite: „genau so
 * diese Desktopansicht. das passiert alles bloß kein Kauf". Bei 1440x900
 * standen Groessenwahl und Kaufknopf unter dem Falz, bei 390x844 auch der
 * Preis: der Aufmacher (360 bzw. 396 px) und die Beschreibung standen vor dem
 * Kauf-Block.
 *
 * GEBAUT NACH DEM HAUSMUSTER, NICHT NEU ERFUNDEN (P10): app/lib/
 * sortenaufmacher-fassung.js macht dasselbe fuer den Aufmacher derselben
 * zwei Seiten. Gleiche Form, gleiche Fail-closed-Regel, gleicher Vertrag.
 * Die beiden Schalter sind unabhaengig: `?aufmacher=` waehlt, WELCHER
 * Aufmacher steht, `?kaufblock=` waehlt, WO er steht.
 *
 * PARAMETER (beide Richtungen, ohne Deploy, auf jeder der zwei Sortenseiten):
 *   ?kaufblock=neu       Kauf-Block zuerst, in der Reihenfolge des
 *                        Designstandards (bausteine.kauf_block: Bild, Titel,
 *                        Preiszeile, Variante, Kaufknopf, Zusage), die
 *                        Beschreibung danach, der Aufmacher unter dem
 *                        Kauf-Block (Default)
 *   ?kaufblock=bestand   die Anordnung vom 2026-10-15 vor diesem Bau,
 *                        Markup unveraendert
 *
 * DER DAUERHAFTE RUECKWEG ist `FASSUNG` auf 'bestand': EINE Zeile, wirkt fuer
 * alle Besucher. Der Rueckweg OHNE Bau ist `bin/fassung aktivieren <name>`
 * auf die vor der Auslieferung gesicherte Fassung.
 */

/** 'neu' = Kauf-Block zuerst · 'bestand' = Aufmacher zuerst (Zustand davor) */
export const FASSUNG = 'neu';

const ERLAUBT = ['neu', 'bestand'];

/**
 * @param {Request} request
 * @returns {'neu'|'bestand'}
 */
export function waehleKaufblockFassung(request) {
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
    const f = p.get('kaufblock');
    if (ERLAUBT.includes(f)) return f;
  }
  return ERLAUBT.includes(FASSUNG) ? FASSUNG : 'neu';
}
