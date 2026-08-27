/**
 * Die EINE Stelle, an der steht, welche Fläche zur KAKAO-Welt gehört und
 * welche Kennzahlen dort gelten.
 *
 * WARUM ES DIESE DATEI GIBT (Christian 2026-08-24, Job
 * 20260824-kakao-bewertung-49-und-1000-nutzer-drei-domains-prio12):
 * Auf den Kakaoseiten standen die Qi-Blanco-Zahlen — "4.8 Sterne" und
 * "über 14.000 aktive Nutzer". Wörtlich: "Das 14.000 wurde fälschlicherweise
 * von Qi Blanco übernommen." Die Zahlen sind beim Übertragen der Seiten aus
 * der Qi-Blanco-Welt mitgewandert, weil die Vorlage von dort stammte.
 *
 * ZWEI PRODUKTWELTEN, ZWEI KENNZAHL-SÄTZE — das ist der ganze Punkt:
 *   Qi Blanco (Energieprodukte): 14.000 aktive Nutzer, Bewertung LIVE aus
 *                                Google (siehe unten), heute 4,8.
 *   Crystal Cacao:               1.000 aktive Nutzer, Bewertung 4,9.
 * Eine Zahl aus der einen Welt auf einer Seite der anderen ist ein Fehler,
 * auch wenn sie für sich genommen stimmt.
 *
 * WARUM EINE LISTE UND NICHT EIN SUBSTRING: geprüft und verworfen.
 * /pages/kakao-anwendung trägt "kakao" im Pfad, ist aber ein KURS der
 * Qi-Blanco-Welt und zeigt live korrekt die Qi-Blanco-Leiste. Eine Regel
 * `pathname.includes('kakao')` hätte genau diese Seite umgehängt.
 *
 * WARUM DIE LISTE HIERHER GEHÖRT UND NICHT IN DIE HEADER-KOMPONENTE:
 * Am 2026-08-24 live gemessen zeigten FÜNF Pfade die Kakao-Leiste
 * (crystal-cacao, kristall-kakao, zeremonie-kakao, crystal-cacao-create,
 * crystal-cacao-awake), während die Liste in Header.jsx nur DREI davon
 * kannte. Der nächste Deploy aus main hätte /pages/kristall-kakao und
 * /products/zeremonie-kakao auf die Qi-Blanco-Leiste gekippt — "über 14.000
 * zufriedene Kunden" auf einer Kakaoseite, entstanden durch einen völlig
 * unbeteiligten Deploy. Eine Liste, die in einer Komponente mitwohnt, wird
 * beim nächsten Seitenbau vergessen; eine Liste mit eigenem Namen und
 * eigener Probe nicht.
 *
 * WENN DU EINE NEUE KAKAOSEITE BAUST: trag ihren Pfad in KAKAO_PFADE ein.
 * Das ist der einzige Handgriff — Leiste, Sterne und Nutzerzahl folgen dann
 * von selbst. Die Probe
 *   homepage-bauer/pruefungen/probe_kakao_zone.py
 * hält Quelltext und ausgelieferte Seite gegeneinander.
 */

/** Pfade, die zur Kakao-Produktwelt gehören. */
export const KAKAO_PFADE = Object.freeze([
  '/pages/crystal-cacao',
  '/pages/kristall-kakao',
  '/products/crystal-cacao-create',
  '/products/crystal-cacao-awake',
  '/products/zeremonie-kakao',
]);

/**
 * Kennzahlen der Kakao-Welt.
 *
 * BELEGLAGE, ehrlich (Christian: "Halte im RESULT fest, worauf die 4,9 und
 * die 1.000 sich stützen"): Beide Werte sind eine REDAKTIONELLE ANGABE, keine
 * gemessene Größe. Für Crystal Cacao werden am Produkt keine Bewertungen
 * erhoben — es gibt also keine Quelle, aus der sich ein Sternewert rechnen
 * ließe. Christian hat am 2026-08-24 von 5,0 auf 4,9 korrigiert, also nach
 * unten in die vorsichtigere Richtung.
 *
 * DESHALB STEHEN DIESE ZAHLEN BEWUSST NICHT IM STRUKTURIERTEN DATENSATZ:
 * app/lib/produkt-schema.js lässt `aggregateRating` ausdrücklich weg, weil
 * Google verlangt, dass eine ausgezeichnete Bewertung aus echten Bewertungen
 * stammt. Diese Zahl hier ist eine Anzeige auf der Seite und darf NICHT ins
 * JSON-LD wandern.
 */
export const KAKAO_KENNZAHLEN = Object.freeze({
  bewertung: '4,9',
  bewertungSkala: '4,9/5,0',
  nutzer: '1.000',
});

/**
 * Kennzahlen der Qi-Blanco-Welt (Energieprodukte).
 *
 * Die BEWERTUNG steht hier bewusst NICHT: sie wird live geholt
 * (app/components/reusables/ReviewCount.jsx zieht den echten Google-
 * Händlerscore, Fallback 4,7). Sie ist damit die einzige der vier Zahlen,
 * die auf einer Messung beruht — eine feste Zahl daneben wäre eine zweite
 * Wahrheit über dieselbe Größe.
 */
export const QIBLANCO_KENNZAHLEN = Object.freeze({
  nutzer: '14.000',
});

/**
 * Gehört dieser Pfad zur Kakao-Welt?
 * @param {string} pathname
 * @returns {boolean}
 */
export function istKakaoPfad(pathname) {
  if (!pathname) return false;
  // Trailing Slash abschneiden, damit /pages/crystal-cacao/ nicht durchfällt.
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return KAKAO_PFADE.includes(p);
}
