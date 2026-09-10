/**
 * sorten-profil — WAS eine Sorte ist, an genau einer Stelle.
 *
 * Job 20260910-BAU-sortenbloecke-awake-und-create-leerer-bildschirm-ohne-aufgabe.
 * Christian, zu zwei Bildschirmaufnahmen von crystal-cacao.com: „Das ist
 * optisch auch nicht gut gemacht, auch Crystal Cacao."
 *
 * ------------------------------------------------------------------------
 * WARUM DIESE DATEI UEBERHAUPT EXISTIERT — UND WARUM SIE NICHT kakao-zone.js IST
 * ------------------------------------------------------------------------
 * app/lib/kakao-zone.js ist die SSoT fuer die ZONE: welcher Pfad gehoert zum
 * Kakao-Laden, welcher Pfad IST eine Sorte (SORTEN_PFADE), welche Marke steht
 * im Absender. Das ist Routing-Wissen, und es wird von root.jsx und der
 * Farbschicht gelesen.
 *
 * Diese Datei fuehrt etwas anderes: den INHALT je Sorte — Name, Wortmarke,
 * Claim, Einordnung. Zwei Gruende fuer die Trennung, beide nachgemessen:
 *
 *  1. kakao-zone.js ist im Vendoring-Manifest als K2 gefuehrt und steht
 *     derzeit (2026-09-10, `bauten-wache/bin/proben/homepage_crystal_cacao_drift.py`)
 *     mit einem OFFENEN LOKAL-DRIFT-Befund da: `sha256_lokal` im Manifest
 *     sagt ddae328ae164, die Datei sagt 1ef31fdd901e. Wer dort etwas
 *     anhaengt und danach den Hash nachzieht, absorbiert die undokumentierte
 *     Aenderung eines fremden Jobs in seinen eigenen Pin — und loescht damit
 *     genau das Signal, das die Wache erzeugt hat. Der Befund gehoert dem,
 *     der ihn verursacht hat, nicht mir.
 *  2. Der Inhalt IST crystal-eigen. In der qiblanco-Vorlage gibt es keine
 *     Kakao-Sorten; eine Aufnahme in die geteilte Menge haette dort keinen
 *     Gegenstand.
 *
 * DIE HUELLE WAECHST DADURCH NICHT: `probe_crystal_cacao_drift.berechne_huelle`
 * rechnet die Import-Huelle im QIBLANCO-Repo aus, nicht hier. Eine Datei, die
 * es nur in crystal gibt, kann dort nicht auftauchen und erzeugt deshalb kein
 * HUELLE-DRIFT. Nachgemessen vor und nach dem Bau, siehe RESULT.
 *
 * ------------------------------------------------------------------------
 * DIE WORTMARKEN-GEOMETRIE IST GEMESSEN, NICHT GESCHAETZT
 * ------------------------------------------------------------------------
 * Der Auftrag sagt woertlich: „Miss die Werte, statt nach Augenmass zu
 * schieben." Alle Zahlen unter `wortmarke` stammen aus einer Messung an den
 * echten CDN-Dateien am 2026-09-10; `pruefungen/probe_sortenaufmacher.py`
 * Arm C rechnet sie bei jedem Lauf NACH, statt sie zu glauben. Wird eine
 * Wortmarke ausgetauscht, faellt der Arm — die Zahl kann hier also nicht
 * still veralten.
 *
 * WAS DIE MESSUNG ERGAB, und warum das die zwei Bloecke ungleich machte:
 *   awake   995 x 356 px, Seitenverhaeltnis 2,795
 *   create  950 x 420 px, Seitenverhaeltnis 2,262
 * Beide standen in einer auf 500 px BREITE gedeckelten Box. Gleiche Breite
 * bei ungleichem Verhaeltnis heisst zwangslaeufig ungleiche HOEHE: gemessen
 * 178,9 px gegen 221,0 px, also 42,1 px Unterschied bei identischem Markup.
 * Deshalb ist hier die HOEHE die gefuehrte Groesse und die Breite folgt
 * (siehe `--cc-wortmarke-hoehe` in app/styles/kakao-seiten.css). Der
 * Tintenanteil an der Leinwandhoehe ist bei beiden fast gleich (awake
 * 346/356 = 97,2 %, create 404/420 = 96,2 %) — bei gleicher Leinwandhoehe
 * stehen die Buchstaben damit auf 1 % genau gleich hoch.
 *
 * `tinte_dx` ist der waagerechte Versatz der Tinte gegen die Mitte ihrer
 * Leinwand, in Prozent der Leinwandbreite. Er ist der Grund, warum Christian
 * den Create-Schriftzug „deutlich weiter links" sah, obwohl beide Boxen
 * gemessen an derselben Stelle standen: die Awake-Datei traegt rechts 45 px
 * leeren Rand und links 11, ihre Tinte sitzt also 17 px links der
 * Leinwandmitte — die Create-Datei ist mit 11/11 symmetrisch. Zwei Bilder,
 * die beide „mittig" eingesetzt sind, stehen dann sichtbar verschieden.
 * Der Wert ist gegen Sprenkel robust: ueber Schwellen von 0 %, 1 %, 2 % und
 * 5 % der staerksten Spalte bewegt er sich bei awake nur zwischen -1,709 %
 * und -1,859 %.
 *
 * KEINE SENKRECHTE KORREKTUR, und das ist eine Entscheidung: der senkrechte
 * Versatz betraegt gemessen +2,0 px (awake) und -2,0 px (create) auf
 * Leinwandhoehen von 356 bzw. 420 px. Bei der gerenderten Hoehe von 112 px
 * sind das 0,63 bzw. 0,53 px — unter einem CSS-Pixel. Eine Korrektur, die
 * kleiner ist als das Raster, auf dem sie wirkt, ist keine Genauigkeit
 * sondern Rauschen.
 */

import {SORTEN_PFADE} from '~/lib/kakao-zone';

/**
 * Die zwei Sorten. Reihenfolge = Anzeigereihenfolge.
 *
 * ABGELEITET, NICHT DANEBENGESCHRIEBEN: der Pfad kommt aus SORTEN_PFADE in
 * kakao-zone.js — derselbe Grund wie in app/routes/_index.jsx, wo die
 * Shopify-Handles schon so abgeleitet werden. Eine zweite Liste waere die
 * naechste Stelle, die auseinanderlaeuft.
 */
const PFAD_JE_SORTE = Object.freeze(
  Object.fromEntries(
    Object.entries(SORTEN_PFADE).map(([pfad, sorte]) => [sorte, pfad]),
  ),
);

/**
 * WAS HIER STEHEN DARF UND WAS NICHT — die Bedingung des Auftrags woertlich:
 * „Der Text darf sagen, wofuer die Sorte gemacht ist, aber nichts behaupten,
 * was sie bewirkt." Und: „‚Wach. Mutig. Kraftvoll.' beschreibt eine Haltung,
 * keine Wirkung — das bleibt so."
 *
 * `einordnung` nennt deshalb ausschliesslich GELEGENHEITEN (wann trinkt man
 * das), nie eine Folge (was passiert dann). Die Formulierung ist zugleich die
 * Grammatik aus KWD-0001: sie beschreibt SEINEN Tag, nicht unser Produkt.
 *
 * `kurz` ist woertlich der Satz, der seit dem 2026-09-03 auf der Startseite
 * unter der Sortenkachel steht (frueher SORTEN_ORIENTIERUNG in
 * app/routes/_index.jsx). Er ist hierher gezogen, weil ihn jetzt ZWEI
 * Flaechen brauchen: die Kachel auf `/` und der Quer-Verweis im Aufmacher
 * der jeweils anderen Sorte. Zwei Kopien desselben Satzes waeren die
 * naechste Stelle, an der die zwei Sorten auseinanderlaufen.
 */
export const SORTEN = Object.freeze({
  awake: Object.freeze({
    sorte: 'awake',
    name: 'Awake',
    pfad: PFAD_JE_SORTE.awake,
    claim: 'Wach. Mutig. Kraftvoll.',
    kurz: 'Für den Start in den Tag.',
    einordnung:
      'Gedacht für den Start in den Tag: morgens, vor dem Sport, ' +
      'vor einem langen Vormittag.',
    wortmarke: Object.freeze({
      url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Awake_Schriftzug.webp?v=1766482188',
      breite: 995,
      hoehe: 356,
      // Tinten-Kasten (Alpha > 0) in Leinwand-Pixeln: links/oben/rechts/unten
      tinte: Object.freeze({x0: 11, y0: 7, x1: 950, y1: 353}),
      // Waagerechter Ausgleich in Prozent der EIGENEN Breite. Positiv =
      // nach rechts. Herleitung: Tintenmitte (11+950)/2 = 480,5 gegen
      // Leinwandmitte 497,5 -> 17,0 px zu weit links -> 17,0/995 = 1,709 %.
      tinte_dx: 1.709,
    }),
  }),
  create: Object.freeze({
    sorte: 'create',
    name: 'Create',
    pfad: PFAD_JE_SORTE.create,
    claim: 'Wach. Klar. Fokussiert.',
    kurz: 'Für den klaren Kopf.',
    einordnung:
      'Gedacht für den klaren Kopf: lange Stunden am Schreibtisch, ' +
      'Arbeit, die Ruhe braucht.',
    wortmarke: Object.freeze({
      url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Create_Schriftzug_1.png?v=1766481502',
      breite: 950,
      hoehe: 420,
      tinte: Object.freeze({x0: 11, y0: 6, x1: 939, y1: 410}),
      // (11+939)/2 = 475,0 = Leinwandmitte 475,0 -> kein Versatz.
      tinte_dx: 0,
    }),
  }),
});

/**
 * DIE POSITIONIERUNG, an genau einer Stelle.
 *
 * Der Auftrag zu „High Performance Cacao": „Das ist unsere Positionierung —
 * entweder sie traegt den Abschnitt oder sie gehoert weg." Sie traegt ihn:
 * sie steht jetzt als erste Zeile UEBER der Wortmarke statt klein, grau und
 * abgesetzt darunter. Weggelassen ist sie NICHT — sie ist der Satz, der die
 * beiden Sorten zusammenhaelt, und deshalb in beiden Bloecken identisch.
 *
 * Der Wortlaut ist unveraendert und stammt nicht von hier: er steht seit
 * jeher als <h1> auf der Startseite (app/components/product-pages/Kakao.jsx)
 * und stand bis heute als <h3> unter beiden Sorten-Claims.
 */
export const POSITIONIERUNG = 'High Performance Cacao';

/**
 * Die jeweils andere Sorte — der „Weg zur passenden Sorte" auf einer Seite,
 * auf der man bereits bei EINER steht.
 * @param {'awake'|'create'} sorte
 * @returns {typeof SORTEN.awake | null}
 */
export function andereSorte(sorte) {
  const andere = Object.values(SORTEN).find((s) => s.sorte !== sorte);
  return SORTEN[sorte] ? andere ?? null : null;
}

/**
 * @param {string} sorte
 * @returns {typeof SORTEN.awake | null}
 */
export function sortenProfil(sorte) {
  return SORTEN[sorte] ?? null;
}
