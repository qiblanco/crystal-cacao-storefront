/**
 * Meta-Beschreibungen und Open-Graph-Signale der Produktseiten (DACH).
 *
 * Reine Datenfabrik ohne React-Import (Node-unit-testbar, wie app/lib/seo.js
 * und app/lib/entity-schema.js).
 *
 * WARUM ES DIESE DATEI GIBT (Befund SEO-2026-W33 L6/L3, am 2026-08-14 an der
 * Live-Auslieferung nachgemessen): alle sieben Produktrouten trugen einen
 * korrekten Canonical, aber KEINE `meta description` und NULL og-Tags. Für
 * eine Suchmaschine heißt das: sie reimt sich das Snippet aus dem Seitentext
 * selbst zusammen; für jedes soziale Netzwerk heißt es, dass es beim Teilen
 * selbst entscheidet, was erscheint. Das sind die Umsatzseiten — die Stelle,
 * an der ein zusammengereimtes Snippet am teuersten ist.
 *
 * WARUM NEBEN app/lib/seo.js UND NICHT DARIN:
 * seo.js liefert die Canonical-Bausteine und wird außerdem von
 * pages.support/impressum/agb/datenschutz/teilnahmebedingungen importiert.
 * `support` hat einen etablierten Formate-Beleg-Ordner, und hb-deploy Gate 12
 * blockt im Modus FORMATE_GATE_REICHWEITE=beleg genau für solche Seiten. Eine
 * Änderung an seo.js würde diese fremden, völlig unbeteiligten Seiten in die
 * Prüfmenge ziehen. Diese Datei wird ausschließlich von den Produktrouten
 * importiert; ihre Import-Closure sind damit die Produktseiten selbst.
 *
 * WER SIE VON EINER FREMDEN ROUTE IMPORTIERT, ZIEHT DEREN SEITE IN DIE
 * CLOSURE. Das ist gewollt und der Grund, warum hier kein Sammel-Helper
 * entstehen soll.
 *
 * ZUR SPRACHE DER TEXTE — das ist ein Chesterton-Zaun, keine Stilfrage:
 * Die Live-Produktseiten formulieren durchgehend "reduziert die Auswirkungen
 * von E-Smog" und "unterstützt ein Umfeld, das ... ermöglicht" — also über
 * das UMFELD, nie als Wirkzusage am Körper. Diese Bauweise ist der
 * Claim-Korridor (HWG §3/§11), und die Beschreibungen hier übernehmen sie
 * wörtlich statt sie zu "verbessern". Bei den Kakao-Sorten gilt zusätzlich
 * die Health-Claims-Verordnung (EU 1924/2006): dort steht bewusst NUR
 * Produktbeschaffenheit (Bio-Zertifikat, Sortenprofil, Geschmack) und KEINE
 * gesundheitsbezogene Angabe — der L-Tryptophan-/Theobromin-Gehalt der
 * Seite ist eine Nährwertangabe und trägt keinen zugelassenen Claim.
 *
 * KUNDENSPRACHE (SSoT kaufueberzeugung/kanon): Einstieg mit dem Wort des
 * Kunden — Schutz, E-Smog, Strahlung, Raum. NICHT mit "kohärentes Wasser":
 * dieser Begriff stammt aus unserem Marketing und wird von Kunden nur
 * zurückgespiegelt, wenn wir ihn zuerst benutzt haben.
 */

// Bewusst RELATIV statt über den '~'-Alias: der Alias wird nur von Vite
// aufgelöst, nicht von Node. Der hermetische Test (node --test, ohne Bundler)
// könnte diese Datei sonst gar nicht laden.
import {absoluteCanonical} from './seo.js';
import {produktSchema} from './produkt-schema.js';

/**
 * Markenname für den Titel-Suffix im Suchergebnis.
 *
 * WARUM OHNE RECHTSFORM (gemessen 2026-08-15 an der Live-Auslieferung):
 * 18 der 72 DACH-URLs trugen den Suffix "| Qi Blanco UG (haftungsbeschränkt)",
 * darunter JEDE Produktseite. Das sind 24 Zeichen, die im Suchergebnis den
 * Platz des Produktnamens wegnehmen — "Crystal Cacao® Create & Awake – Bio |
 * Qi Blanco UG (haftungsbeschränkt)" stand bei 75 Zeichen und wurde von
 * Google abgeschnitten. Niemand sucht nach "UG (haftungsbeschränkt)".
 *
 * Die Rechtsform ist an keiner Stelle als Pflicht im Titel dokumentiert; die
 * Impressumspflicht erfüllt die Impressumsseite, und die trägt sie
 * unverändert weiter. Kanonischer Markenname der Storefront ist "Qi Blanco"
 * (devlog D-081) — dieselbe Schreibweise, die das Organization-Schema und der
 * Wikidata-Eintrag Q141070656 führen. Genau diese Gleichheit ist der Zweck:
 * eine Marke, die in Titel, Schema und Wikidata identisch heißt, ist für
 * Google EINE Entität statt dreier Schreibweisen.
 *
 * WARUM HIER UND NICHT IN seo.js: siehe Kopf dieser Datei — seo.js wird von
 * pages.support/impressum/agb/… importiert und zöge diese unbeteiligten
 * Seiten in die Gate-12-Prüfmenge.
 */
export const MARKE = 'Qi Blanco';

/**
 * Beschreibung je Produktpfad.
 *
 * Der Schlüssel ist exakt der Pfad, der auch an canonicalLink() geht — so kann
 * eine Route nicht versehentlich die Beschreibung einer anderen ziehen.
 *
 * NICHT enthalten ist `/products/zeremonie-kakao`: diese URL antwortet live
 * mit HTTP 301 auf /products/crystal-cacao-create (am 2026-08-14 gemessen).
 * Eine Beschreibung dort wäre wirkungslos, weil die Seite nie ausgeliefert
 * wird — sie zu setzen würde einen Vollzug vortäuschen, den es nicht gibt.
 */
export const PRODUKT_BESCHREIBUNGEN = {
  '/products/qione-2-pro':
    'E-Smog ist überall, wo du bist — der QiOne® 2 Pro auch. Sein Gitterchip™ ' +
    'reduziert die Auswirkungen. Original vom Hersteller, 20 Tage risikofrei.',
  '/products/qibracelet':
    'Schutz, den man nicht sieht: Der QiBracelet® reduziert mit integriertem ' +
    'Gitterchip™ die Auswirkungen von E-Smog und 5G — elegant am Handgelenk.',
  '/products/qihome-air':
    'Ein Gitterchip™ für den ganzen Raum: Das QiHome® Air deckt bis zu 300 m² ab ' +
    'und schafft eine harmonische Atmosphäre — ideal für Schlafzimmer und Büro.',
  '/products/qione-kette':
    'Die passende Kette für deinen QiOne® 2 Pro: hochwertig verarbeitet und ' +
    'angenehm zu tragen, damit dein Anhänger überall dabei ist.',
  '/products/crystal-cacao-awake':
    'Crystal Cacao® Awake: Zeremonie-Kakao in Bio-Qualität (DE-ÖKO-006), sanft ' +
    'im Sortenprofil und vollmundig im Geschmack. Für deine besondere Kakao-Zeit.',
  '/products/crystal-cacao-create':
    'Crystal Cacao® Create: Zeremonie-Kakao in Bio-Qualität (DE-ÖKO-006) mit dem ' +
    'kräftigsten Sortenprofil — intensiv und vollmundig im Geschmack.',
};

/**
 * Die Beschreibung eines Produktpfads. Unbekannter Pfad -> undefined, damit
 * der Aufrufer den Descriptor weglassen kann statt einen leeren zu rendern:
 * ein leeres `content` ist für eine Suchmaschine schlechter als gar keins,
 * weil es eine gepflegte Angabe vortäuscht.
 * @param {string} pfad
 * @returns {string|undefined}
 */
export function produktBeschreibung(pfad) {
  return PRODUKT_BESCHREIBUNGEN[pfad];
}

/**
 * Titel je Produktpfad — NUR dort gesetzt, wo der Produktname allein die
 * Suchabsicht nicht trifft. Unbekannter Pfad -> undefined, dann bleibt es
 * beim bisherigen `Produktname | Marke` der Route.
 *
 * WARUM ES DIESEN ÜBERSCHREIBER GIBT (Befund s02 des Grossjobs
 * 20260831-…-warum-ranken-kritiker… (s02), an der Live-SERP gemessen):
 * Auf der Suche nach „QiOne 2 Pro" — unserem eigenen Produktnamen — stand am
 * 2026-08-24 auf den Plätzen 1 und 3 je ein GEBRAUCHTWAREN-Marktplatz
 * (kleinanzeigen.de, ebay.de), und unsere Produktseite war in den erfassten
 * neun Zeilen nicht dabei. Wer diese Suche tippt, kennt das Produkt bereits;
 * er ist nicht auf der Suche nach einer Erklärung, sondern nach einer
 * Bezugsquelle, der er trauen kann.
 *
 * Der bisherige Titel „QiOne® 2 Pro | Qi Blanco" ist 24 Zeichen lang und
 * beantwortet diese Frage nicht: er wiederholt nur, wonach gesucht wurde.
 * Google zeigt rund 60 Zeichen — die übrigen 36 standen ungenutzt leer,
 * während der Wettbewerb auf derselben Seite „gebraucht" und „Privatverkauf"
 * schreibt. Der neue Titel besetzt genau den Unterschied, den ein
 * Marktplatz-Treffer nicht bieten kann: Bezug beim Hersteller und
 * Risikoumkehr.
 *
 * ZUR SPRACHE — beide Zusätze sind BELEGT, nicht erfunden: „20 Tage
 * risikofrei" steht wörtlich als H2 auf der Produktseite selbst und trägt
 * eine eigene Seite (/pages/das-20-tage-versprechen); „Original vom
 * Hersteller" ist eine Herkunftsaussage über den Vertriebsweg und keine
 * Wirkzusage — der Claim-Korridor des Dateikopfs bleibt damit unberührt.
 * Die Risikoumkehr ist zugleich das für DACH gemessene Closer-Thema
 * (SSoT kaufueberzeugung/kanon: Rückgabe/20-Tage-Test/Garantie, n=22).
 * @type {Record<string, string>}
 */
export const PRODUKT_TITEL = {
  '/products/qione-2-pro': `QiOne® 2 Pro kaufen — 20 Tage risikofrei | ${MARKE}`,
};

/**
 * Der Titel eines Produktpfads, falls überschrieben.
 * @param {string} pfad
 * @returns {string|undefined}
 */
export function produktTitel(pfad) {
  return PRODUKT_TITEL[pfad];
}

/**
 * Vollständige meta-Descriptor-Liste einer Produktroute: Titel, Beschreibung,
 * Canonical und Open Graph in EINEM Aufruf.
 *
 * Bewusst hier gebündelt statt in jeder Route einzeln aufgezählt: sonst
 * driften die Routen auseinander, und genau diese Drift war der Ausgangs-
 * befund (jede Route trug ihren Canonical, keine eine Beschreibung).
 *
 * PRODUKT-AUSZEICHNUNG (seit 2026-08-15): Wird `produkt` mitgegeben, hängt
 * diese Funktion zusätzlich den schema.org-Product-Knoten an. Gemessen am
 * 2026-08-15 trug KEINE der 17 DACH-Produkt-URLs eine Product-Auszeichnung,
 * während alle 6 US-Produktseiten sie tragen — ohne sie kann Google auf den
 * Umsatzseiten weder Preis noch Verfügbarkeit als Rich Result zeigen.
 *
 * Der Parameter ist OPTIONAL, und das ist Absicht: die sechs Flaggschiff-
 * Routen haben eigene Route-Dateien, der Rest des Sortiments läuft über
 * `products.$handle.jsx`. Genau diese Zweiteilung hat beim ersten Anlauf
 * (PR #217) dazu geführt, dass die Auszeichnung überall ANKAM, nur nicht auf
 * den sechs wichtigsten Seiten. Ein optionaler Parameter lässt jede Route
 * einzeln nachziehen, ohne die anderen zu brechen.
 *
 * @param {{pfad: string, titel: string, bildUrl?: string, produkt?: object}} args
 * @returns {Array<object>} meta-Descriptoren für react-router 7
 */
export function produktMeta({pfad, titel, bildUrl, produkt}) {
  const beschreibung = produktBeschreibung(pfad);
  // Der Überschreiber gewinnt, wenn es einen gibt — sonst bleibt es exakt
  // beim Titel der Route. Bewusst hier und nicht in der Route: sonst trägt
  // jede der sechs Flaggschiff-Routen ihre eigene Titel-Logik, und genau
  // diese Drift war der Ausgangsbefund dieser Datei.
  const titelEffektiv = produktTitel(pfad) ?? titel;
  const url = absoluteCanonical(pfad);
  const descriptoren = [
    {title: titelEffektiv},
    // Canonical als echtes <link> (tagName) und absolut — Begründung im Kopf
    // von app/lib/seo.js. Hier NICHT über canonicalLink(), weil derselbe
    // absoluteCanonical()-Wert unten auch als og:url gebraucht wird und zwei
    // getrennte Aufrufe auseinanderlaufen könnten.
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:type', content: 'product'},
    {property: 'og:site_name', content: 'Qi Blanco'},
    {property: 'og:locale', content: 'de_DE'},
    // Muss dem <title> folgen, nicht dem Routen-Rohwert: sonst zeigt ein
    // geteilter Link etwas anderes als das Suchergebnis — dieselbe
    // Zwei-Versprechen-Falle, die unten für die Beschreibung benannt ist.
    {property: 'og:title', content: titelEffektiv},
    {property: 'og:url', content: url},
  ];
  if (beschreibung) {
    // Die Beschreibung steht an ZWEI Stellen (name=description und
    // og:description) und muss identisch sein: ein Netzwerk, das beim Teilen
    // etwas anderes zeigt als die Suchmaschine, erzeugt zwei Versprechen.
    descriptoren.splice(1, 0, {name: 'description', content: beschreibung});
    descriptoren.push({property: 'og:description', content: beschreibung});
  }
  if (bildUrl) {
    descriptoren.push({property: 'og:image', content: bildUrl});
  }
  // react-router 7 rendert diesen Descriptor nativ als
  // <script type="application/ld+json"> und maskiert den Inhalt selbst.
  // produktSchema() gibt null zurück, wenn Preis oder Titel fehlen — dann
  // entsteht bewusst KEIN Knoten: ein unvollständiges Element steht dauerhaft
  // als Fehler in der Search Console, ein fehlendes bewirkt nur nichts.
  const schema = produkt ? produktSchema(produkt) : null;
  if (schema) {
    descriptoren.push({'script:ld+json': schema});
  }
  return descriptoren;
}
