/**
 * analyseprofil — die Laborprofile der zwei Sorten als ZAHLEN, nicht als Sätze.
 *
 * Grossjob 20261002-GROSSJOB-crystal-cacao-startseite-hochwertig-slider-profile-
 * responsiv, Segment s02. Christian am 02.10.2026: oben der Slider mit Awake und
 * Create, „und dass dann stimmig gleich die Analyseprofile dazukommen“.
 *
 * WARUM EINE EIGENE DATEI UND NICHT DIE ZEILEN AUS sorten-profil.js
 * Die Kaufseiten zeigen die Gehalte als fertige Zeilen
 * („Theobromin: 950 mg / 100g“, sorten-profil.js `inhaltsstoffe.liste`). Ein
 * Balkendiagramm braucht die Zahl selbst. Sie aus der Anzeigezeile
 * herauszulesen wäre genau der Fehler aus devlog F-023 (eine Anzeige aus einer
 * fremden Anzeige ableiten). Deshalb stehen die Werte hier strukturiert, mit
 * Quelle je Wert, und die NAHT zu den Kaufseiten wird gemessen statt zugesagt:
 *   crystal-cacao-node/proben/probe_analyseprofil_naht.py
 * Sie liest beide Dateien und meldet jede Zahl, die hier anders steht als in
 * der Zeile der Kaufseite. Zwei Seiten, eine Wahrheit.
 *
 * QUELLEN (Herstellerangaben, kein Wert ist gerechnet oder geschätzt):
 *   - Theobromin, PEA, Anandamid, L-Tryptophan, Polyphenole & Flavanole:
 *     sorten-profil.js `inhaltsstoffe.liste` (Bestand seit 2026-09-10).
 *   - Koffein Create 140 mg: ebenda („Theobromin: 1.050 mg / 100g & Koffein:
 *     140 mg / 100g“).
 *   - Koffein Awake 120 mg: Nährstoff-Analyse Dartsch Scientific
 *     DARTSCH/04/11/25 (04.11.2025), wörtlich auch im Sortenvergleich der
 *     Kaufseiten (amazonstil-daten.js, `profil`). Die Awake-Liste in
 *     sorten-profil.js führt Koffein nicht; die Probe prüft diesen Wert
 *     deshalb gegen amazonstil-daten.js.
 *
 * `fuehrt` wird NICHT hier hineingeschrieben, sondern aus den Zahlen
 * abgeleitet (`fuehrendeSorte`). Eine zweite, handgepflegte Angabe derselben
 * Tatsache wäre die nächste Stelle, die auseinanderläuft.
 */

export const PROFIL_BEZUG = '100 g';

/**
 * Eine Zeile je Inhaltsstoff. `wert` in der Einheit `einheit`; `anzeige` ist
 * die deutsche Schreibweise derselben Zahl (Tausenderpunkt), damit die Seite
 * nirgends selbst formatiert.
 *
 * `bedeutung`: das Stichwort aus den Herstellerangaben derselben Sorten
 * (sorten-profil.js `punkte`), kurz gefasst. Keine neue Wirkaussage.
 */
export const ANALYSEPROFIL = Object.freeze([
  {
    key: 'tryptophan',
    stoff: 'L-Tryptophan',
    bedeutung: 'Serotonin-Vorstufe',
    einheit: 'mg',
    awake: {wert: 30, anzeige: '30'},
    create: {wert: 20, anzeige: '20'},
  },
  {
    key: 'theobromin',
    stoff: 'Theobromin',
    bedeutung: 'sanfte, ausgewogene Aktivierung',
    einheit: 'mg',
    awake: {wert: 950, anzeige: '950'},
    create: {wert: 1050, anzeige: '1.050'},
  },
  {
    key: 'koffein',
    stoff: 'Koffein',
    bedeutung: '',
    einheit: 'mg',
    awake: {wert: 120, anzeige: '120'},
    create: {wert: 140, anzeige: '140'},
  },
  {
    key: 'pea',
    stoff: 'Phenylethylamin (PEA)',
    bedeutung: 'Teil des körpereigenen Motivationssystems',
    einheit: 'mg',
    awake: {wert: 5, anzeige: '5'},
    create: {wert: 10, anzeige: '10'},
  },
  {
    key: 'anandamid',
    stoff: 'Anandamid',
    bedeutung: 'das „Bliss Molecule“',
    einheit: 'µg',
    awake: {wert: 54, anzeige: '54'},
    create: {wert: 61, anzeige: '61'},
  },
  {
    key: 'polyphenole',
    stoff: 'Polyphenole & Flavanole',
    bedeutung: 'antioxidative Pflanzenstoffe',
    einheit: 'mg',
    awake: {wert: 5030, anzeige: '5.030'},
    create: {wert: 5620, anzeige: '5.620'},
  },
]);

/** 'awake' | 'create' | null (gleichauf) — abgeleitet, nie gepflegt. */
export function fuehrendeSorte(zeile) {
  if (zeile.awake.wert === zeile.create.wert) return null;
  return zeile.awake.wert > zeile.create.wert ? 'awake' : 'create';
}

/**
 * Balkenlänge in Prozent, relativ zur stärkeren Sorte DERSELBEN Zeile.
 * Absolut über alle Zeilen wäre sinnlos: 5.620 mg Polyphenole gegen 61 µg
 * Anandamid sind verschiedene Größen in verschiedenen Einheiten.
 */
export function balkenProzent(zeile, sorte) {
  const max = Math.max(zeile.awake.wert, zeile.create.wert);
  if (!max) return 0;
  return Math.round((zeile[sorte].wert / max) * 1000) / 10;
}

/**
 * Was das Profil je Sorte heisst — im Wortlaut der Herstellerangaben aus
 * sorten-profil.js (`inhaltsstoffe.fazit`, ohne Markdown-Sterne). Die Sätze
 * stehen dort seit 2026-09-10 auf den Kaufseiten.
 */
export const PROFIL_DEUTUNG = Object.freeze({
  awake:
    'Awake hat den höchsten L-Tryptophan-Gehalt unserer Sorten: für präsente Klarheit, emotionale Tiefe und ein Gefühl innerer Weite.',
  create:
    'Create hat das stärkste aktivierende Profil unserer Sorten: für sanfte Wachheit, kognitive Klarheit und stabile innere Ausrichtung.',
});

/**
 * Der Kaffee-Vergleich JE TASSE.
 *
 * Die Zahlen sind die der bisherigen Vergleichstabelle der Startseite, kein
 * Zeichen geändert. Nachgerechnet am 02.10.2026: sie sind die Create-Werte je
 * 100 g mal 0,15 (eine Tasse = 15 g, Daily-Focus-Dosis der Packung):
 * 140 mg × 0,15 = 21 mg Koffein, 1.050 × 0,15 = 157,5 ≈ 158 mg Theobromin,
 * 5.620 × 0,15 = 843 mg Polyphenole, 10 × 0,15 = 1,5 mg PEA,
 * 61 × 0,15 = 9,15 ≈ 9 µg Anandamid, 20 × 0,15 = 3 mg L-Tryptophan.
 * Bis heute stand im Tabellenkopf nur „Crystal Cacao® 15g“. Welche Sorte
 * gemeint ist, steht jetzt dabei.
 *
 * `max` je Zeile ist der grösste Wert der Zeile, für die Balkenlänge. Bei
 * Kaffee steht eine Spanne (80–100 mg); gezeichnet wird ihr oberes Ende,
 * geschrieben die ganze Spanne.
 */
export const TASSE = Object.freeze({
  kakao: {name: 'Crystal Cacao®', menge: '15 g Create'},
  kaffee: {name: 'Kaffee', menge: '200 ml'},
  energy: {name: 'Energydrink', menge: '250 ml'},
});

export const TASSEN_VERGLEICH = Object.freeze([
  {
    key: 'koffein',
    stoff: 'Koffein',
    kakao: {wert: 21, anzeige: '21 mg'},
    kaffee: {wert: 100, anzeige: '80–100 mg'},
    energy: {wert: 80, anzeige: '80 mg'},
  },
  {
    key: 'theobromin',
    stoff: 'Theobromin',
    kakao: {wert: 158, anzeige: '158 mg'},
    kaffee: null,
    energy: null,
  },
  {
    key: 'polyphenole',
    stoff: 'Polyphenole & Flavanole',
    kakao: {wert: 843, anzeige: '843 mg'},
    kaffee: {wert: 300, anzeige: '300 mg'},
    energy: null,
  },
  {
    key: 'pea',
    stoff: 'Phenylethylamin (PEA)',
    kakao: {wert: 1.5, anzeige: '1,5 mg'},
    kaffee: null,
    energy: null,
  },
  {
    key: 'anandamid',
    stoff: 'Anandamid',
    kakao: {wert: 9, anzeige: '9 µg'},
    kaffee: null,
    energy: null,
  },
  {
    key: 'tryptophan',
    stoff: 'L-Tryptophan',
    kakao: {wert: 3, anzeige: '3 mg'},
    kaffee: null,
    energy: null,
  },
]);

export function tassenBalken(zeile, spalte) {
  const z = zeile[spalte];
  if (!z) return 0;
  const max = Math.max(
    ...['kakao', 'kaffee', 'energy'].map((s) => (zeile[s] ? zeile[s].wert : 0)),
  );
  return max ? Math.round((z.wert / max) * 1000) / 10 : 0;
}
