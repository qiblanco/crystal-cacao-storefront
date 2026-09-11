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
 *
 * ------------------------------------------------------------------------
 * `inhaltsstoffe` UND `herkunft` — DER REST DER KAUFSEITE, JE SORTE
 * (Job 20260910-REPAIR-awake-und-create-sind-zwei-kopien-derselben-seite)
 * ------------------------------------------------------------------------
 * Awake.jsx und Create.jsx trugen bis zum 2026-09-11 je ~420 Zeilen, davon
 * 351 woertlich gleich (82,8 %, difflib). Der Sorten-Aufmacher hatte davon
 * schon EINEN Abschnitt geloest; der Rumpf stand weiter zweimal da. Jetzt
 * rendert app/components/product-pages/SortenSeite.jsx den Rumpf EINMAL, und
 * hier steht, was WIRKLICH je Sorte verschieden ist — nicht mehr:
 *
 *   inhaltsstoffe.liste   die fuenf Gehalte je 100 g (Theobromin 950 gegen
 *                         1.050 mg, PEA 5 gegen 10 mg, ...) — Messwerte der
 *                         Sorte, aus dem Bestand uebernommen, kein Zeichen
 *                         geaendert.
 *   inhaltsstoffe.fazit   der Schluss-Satz, der die Sorte aus ihrem Profil
 *                         heraus beschreibt — Bestandstext.
 *   inhaltsstoffe.bild    das erste der zwei Bilder (Frau / Armband-Motiv);
 *                         das zweite (Kaffee) ist auf beiden Seiten dasselbe
 *                         und steht deshalb im Bauteil, nicht hier.
 *   inhaltsstoffe.bildSeite  'links' (Awake) / 'rechts' (Create): am
 *                         Schreibtisch stehen die zwei Bilder bei Awake links
 *                         vom Text, bei Create rechts. EHRLICH: dafuer gibt es
 *                         keinen inhaltlichen Grund, die Seiten begegnen
 *                         einander nie. Es bleibt ein Parameter, damit beide
 *                         Seiten nach dem Zusammenlegen GENAU so aussehen wie
 *                         vorher — den Bau dieses Jobs am Kundenrand als
 *                         'unveraendert' nachzuweisen war wichtiger als eine
 *                         Vereinheitlichung, die niemand verlangt hat. Wer sie
 *                         will, aendert EIN Wort hier.
 *   herkunft              drei Zeilen Text+Bild: die Herkunfts-Erzaehlung ist
 *                         je Sorte eine andere (Piura-Tal gegen Departamento
 *                         Amazonas, andere Bilder, andere Aromanoten).
 *
 * WAS NICHT HIER STEHT, weil es auf beiden Seiten zeichengleich war: die 24
 * Mineralstoffe, der Ursprung (Montegrande), das Banner, die Belege, die
 * FAQ, die Zubereitung. Das gehoert ins Bauteil.
 *
 * TEXTFORM: Absaetze sind Strings; **so** markierte Stellen rendert das
 * Bauteil als <b>. Das ist bewusst KEIN HTML (kein dangerouslySetInnerHTML
 * — Create.jsx hatte eines fuer Titel, die nie Markup trugen) und keine
 * JSX-Datenstruktur (die gehoerte in eine .jsx-Datei und damit weg von
 * hier). Jeder Absatz wird ein <p>. Der Wortlaut ist Bestand; er wurde am
 * gelieferten HTML vor und nach dem Bau Zeichen fuer Zeichen verglichen.
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
    inhaltsstoffe: Object.freeze({
      bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06589_1.jpg?v=1764275150',
      bildSeite: 'links',
      liste: Object.freeze([
        {
          titel: 'Theobromin: 950 mg / 100g',
          punkte: ['sanfte, ausgewogene Aktivierung', 'harmonisches 7,9:1-Verhältnis'],
        },
        {
          titel: 'Phenylethylamin (PEA): 5 mg / 100g',
          punkte: ['subtiler Impuls für Wohlgefühl'],
        },
        {
          titel: 'Anandamid: 54 µg / 100g',
          punkte: ['unterstützt Ruhe, Verbindung und innere Präsenz'],
        },
        {
          titel: 'L-Tryptophan: 30 mg / 100g',
          punkte: [
            'höchste Menge aller Crystal Cacao® Sorten',
            'Serotonin-Vorstufe für emotionale Ausgeglichenheit',
          ],
        },
        {
          titel: 'Polyphenole & Flavanole: 5.030 mg / 100g',
          punkte: ['antioxidative Pflanzenstoffe für neuronale Balance'],
        },
      ]),
      fazit:
        '**Crystal Cacao® Awake** kombiniert sanfte Aktivierung mit dem ' +
        '**höchsten L-Tryptophan-Gehalt aller Kristall Kakao® Sorten – für ' +
        'präsente Klarheit, emotionale Tiefe und ein Gefühl innerer Weite.**',
    }),
    herkunft: Object.freeze([
      {
        absaetze: [
          'Aus den **goldenen Flusstälern des Piura-Tals im Norden Perus** ' +
            'stammt eine heilige Pflanze – in ihrer reinsten Form: unser ' +
            'bio-zertifizierter **Awake – Kristall Kakao®.**',
          'Die hellen Kakaobohnen aus dieser Region zählen zu den seltensten und ' +
            'aromatischsten der Welt. Sie stammen aus nachhaltigem Anbau, werden ' +
            'von lokalen Kleinbauern mit großer Sorgfalt geerntet und bewahren ' +
            'durch ihre besondere Bohnenstruktur ein außergewöhnlich feines ' +
            'Aromaprofil.',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/tal-kakao-awake.jpg?v=1764276290',
      },
      {
        absaetze: [
          'Schonend bei niedriger Temperatur vermahlen, gießen wir sie ' +
            'anschließend in eine elegante, quadratische 420 g-Tafel – ein purer ' +
            'Block **Bio Kristall Kakao®.**',
          'Nach der Formung geben wir dem Kakao die Zeit, die er braucht: In ' +
            'Ruhe kristallisiert er langsam aus und entfaltet dabei sein ' +
            'charakteristisches Kristallmuster.',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC02183_1.jpg?v=1764259399',
      },
      {
        absaetze: [
          'Es ist ein Sinnbild für naturbelassene Qualität, aromatische Tiefe und ' +
            'unsere tiefe Achtung vor dem Ursprung. Versiegelt im Aroma-Schutzpack ' +
            'bleiben das volle Bouquet frischer Fruchtnoten, feiner Kokosnuancen ' +
            'und alle wertvollen Bestandteile optimal bewahrt.',
          '**Brich dir ein Stück ab, bereite ein warmes Elixier zu und tauche ein ' +
            'in dein persönliches Ritual – mit Achtsamkeit, Herzöffnung und ' +
            'tiefer Verbindung zu dir selbst.**',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01401.jpg?v=1766919672',
      },
    ]),
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
    inhaltsstoffe: Object.freeze({
      bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/bracelet-kakao-highlight.png?v=1764257247',
      bildSeite: 'rechts',
      liste: Object.freeze([
        {
          titel: 'Theobromin: 1.050 mg / 100g & Koffein: 140 mg / 100g',
          punkte: ['stabile, langanhaltende Wachheit', 'natürliches 7,5:1-Verhältnis'],
        },
        {
          titel: 'Phenylethylamin (PEA): 10 mg / 100g',
          punkte: ['Teil des körpereigenen Motivationssystems.'],
        },
        {
          titel: 'Anandamid: 61 µg / 100g',
          punkte: ['das „Bliss Molecule" für ruhige, klare Präsenz.'],
        },
        {
          titel: 'L-Tryptophan: 20 mg / 100g',
          punkte: ['Serotonin-Vorstufe für emotionale Balance.'],
        },
        {
          titel: 'Polyphenole & Flavanole: 5.620 mg / 100g',
          punkte: ['antioxidative Pflanzenstoffe für kognitive Vitalität.'],
        },
      ]),
      fazit:
        '**Crystal Cacao® Create** enthält das ' +
        '**stärkste aktivierende Profil aller Kristall Kakao® Sorten** – für ' +
        '**sanfte Wachheit, kognitive Klarheit und stabile innere Ausrichtung.**',
    }),
    herkunft: Object.freeze([
      {
        absaetze: [
          'Aus dem geheimnisvollen Amazonas bringen wir dir eine heilige Pflanze in ' +
            'ihrer reinsten Form: unseren bio-zertifizierten ' +
            '**Kristall Kakao® Create.** Diese besonderen Kakaobohnen stammen aus ' +
            'nachhaltigem Anbau in den ' +
            '**Bergwäldern des peruanischen Departamento Amazonas**. Sie werden ' +
            'behutsam bei niedriger Temperatur vermahlen und anschließend in eine ' +
            'elegante, quadratische 420 g-Tafel gegossen – ein purer Block ' +
            '**Bio Kristall Kakao®.**',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01491_Kopie.webp?v=1759179615',
      },
      {
        absaetze: [
          'Nach der Formung geben wir dem Kakao die Zeit, die er braucht: In Ruhe ' +
            'kristallisiert er langsam und entwickelt dabei sein charakteristisches ' +
            'Kristallmuster – Sinnbild für naturbelassene Qualität, aromatische Tiefe ' +
            'und unsere tiefe Achtung vor dem Ursprung.',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC02183_1.jpg?v=1764259399',
      },
      {
        absaetze: [
          'So entsteht unser unverwechselbarer **Kristall Kakao®** – mit ' +
            'feiner Struktur, voller Kraft und lebendigem Geschmack. Versiegelt im ' +
            'Aroma-Schutzpack bleiben das volle Bouquet tropischer Früchte, feiner ' +
            'Kokosnoten und Zitrusnuancen sowie alle wertvollen Bestandteile ' +
            'optimal bewahrt.',
          '**Brich dir ein Stück ab, bereite ein warmes Elixier zu und tauche ein ' +
            'in dein persönliches Ritual – voller Achtsamkeit, Herzöffnung und ' +
            'tiefer Verbundenheit.**',
        ],
        bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01953.jpg?v=1766919764',
      },
    ]),
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
