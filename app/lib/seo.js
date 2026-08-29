/**
 * K2-ADAPTIERT (crystal-cacao-storefront) — NICHT byte-gleich zur Vorlage.
 * =====================================================================
 * Herkunft: qiblanco-storefront app/lib/seo.js @ 2648d92 (nachgezogen
 * 2026-08-29; die Basis a6ec77e des Erstbaus steht im Manifest-Feld
 * `upstream_commit` der damaligen Fassung und ist damit nicht verloren).
 * Klasse K2 nach ADR 0056: beide Seiten einzeln gepinnt, Gleichheit
 * ausdrücklich NICHT gefordert — dieselbe Bauform wie app/lib/redirect.js.
 *
 * EINZIGE Abweichung zur Vorlage: CANONICAL_ORIGIN (siehe unten).
 *
 * WARUM SIE NICHT BYTE-GLEICH SEIN DARF (gemessen, nicht vermutet):
 * die Vorlage führt `CANONICAL_ORIGIN = 'https://qiblanco.com'` als
 * Quelltext-Konstante. Byte-gleich übernommen trüge JEDE Seite auf
 * crystal-cacao.com einen Canonical auf qiblanco.com — und dieses Ziel
 * EXISTIERT dort, weil es dieselbe geteilte Seite ist. Google konsolidiert
 * dann crystal-cacao.com auf qiblanco.com: der Kakao-Laden verschwindet aus
 * dem Index. Build grün, Seite lädt, KEINE Fehlermeldung.
 *
 * Das ist strukturell dieselbe Fehlerform, die `checkout-tracking.js` für
 * TRACKING_PRODUCTION_HOSTS beschreibt (byte-gleich -> isProductionHost=false
 * -> Tracking tot, ohne Symptom) — nur eine Achse weiter: diese Datei liegt in
 * der IMPORT-HÜLLE der drei geteilten Routen und wäre vom Manifest-Erzeuger
 * sonst automatisch als K1 (byte-gleich) eingestuft und damit unbeobachtet.
 *
 * DIE KONSTANTE IST DIE WURZEL DREIER WIRKUNGEN, nicht nur des Canonicals:
 *   1. canonicalLink()/absoluteCanonical() — <link rel="canonical">,
 *   2. produkt-seo.js -> og:url der Produktseiten,
 *   3. entity-schema.js -> ORG_ID/SITE_ID der JSON-LD-Knoten.
 * Alle drei folgen dieser einen Zeile; deshalb genügt hier EINE Adaption.
 *
 * Zentraler SEO-Helper (DACH-Storefront) — Vorlagen-Kommentar ab hier
 * unverändert:
 *
 * Reine Datenfabrik ohne React-Import (Node-unit-testbar, analog
 * structured-data.js). Liefert ABSOLUTE Canonical-URLs für die
 * Route-`meta`-Exporte.
 *
 * WARUM ES DIESE DATEI GIBT (Befund SEO-2026-W33 F_canonical):
 * react-router-7 rendert einen meta-Descriptor OHNE `tagName` als
 * `<meta ...>` mit allen Keys als Attribute (Renderschleife der
 * <Meta>-Komponente in den dist-Chunks von node_modules/react-router:
 * tagName -> title -> charset -> script:ld+json -> Fallback
 * `createElement('meta', {...metaProps})`). Ein Descriptor
 * `{rel:'canonical', href:X}` ergibt deshalb `<meta rel="canonical" href="X">`
 * — im Quelltext fast nicht von der korrekten Form zu unterscheiden, für
 * Suchmaschinen aber wirkungslos. Korrekt ist:
 *
 *     {tagName: 'link', rel: 'canonical', href: absoluteCanonical(pfad)}
 *
 * `isValidMetaTag` des Routers akzeptiert genau /^(meta|link)$/.
 *
 * WARUM ABSOLUT: react-router-7 merged `meta` NICHT baumweit (der nächste
 * Leaf gewinnt vollständig) — es gibt also keinen zentralen Ort, an dem ein
 * relativer Canonical serverseitig gegen die Produktions-Domain aufgeloest
 * wird. Auf einem Oxygen-Preview-Host würde ein relativer Canonical auf den
 * Preview-Host zeigen und die Preview-URL selbst kanonisieren. Ein absoluter
 * Canonical ist auf Preview wie Produktion identisch korrekt.
 *
 * API-KOMPATIBILITAET: Namen und Semantik von CANONICAL_ORIGIN und
 * absoluteCanonical() sind bewusst identisch zum Entwurf in PR #103
 * (geo/seo-entity-hygiene-dach), damit dessen breiterer Helper diese Datei
 * spaeter als Obermenge ersetzen kann statt neben ihr zu stehen.
 */

// Kanonische Produktions-Domain (apex). Quelle: TRACKING_PRODUCTION_HOSTS in
// app/lib/checkout-tracking.js. Canonicals zeigen IMMER hierauf, auch wenn die
// Seite gerade unter einer Preview-/Oxygen-URL ausgeliefert wird.
//
// DIE EINE ADAPTION DIESER DATEI (K2, ADR 0056): der Wert ist die Domain
// DIESES Shops, nicht die der Vorlage. Er steht byte-gleich in
// TRACKING_PRODUCTION_HOSTS von app/lib/checkout-tracking.js — dieselbe
// Quelle, die der Vorlagen-Kommentar oben nennt. Wer die eine ändert, ändert
// die andere mit.
export const CANONICAL_ORIGIN = 'https://crystal-cacao.com';

/**
 * Absolute Canonical-URL für einen Pfad. Query/Hash werden entfernt, ein
 * abschliessender Slash (ausser Root) getrimmt.
 * @param {string} pathname
 * @returns {string}
 */
export function absoluteCanonical(pathname) {
  if (!pathname || pathname === '/') return `${CANONICAL_ORIGIN}/`;
  let p = String(pathname).split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return `${CANONICAL_ORIGIN}${p}`;
}

/**
 * Fertiger meta-Descriptor für den Canonical einer Route.
 * Rendert ein echtes `<link rel="canonical" href="...">`.
 * @param {string} pathname
 * @returns {{tagName: 'link', rel: 'canonical', href: string}}
 */
export function canonicalLink(pathname) {
  return {tagName: 'link', rel: 'canonical', href: absoluteCanonical(pathname)};
}

/**
 * Shopify-Page-Handles, die NICHT in den Google-Index gehören.
 *
 * WARUM DIESE LISTE HIER STEHT UND NICHT IN DER ROUTE (Befund SEO-2026-W33,
 * Stufe S0): sie hat ZWEI Leser — die Route `pages.$handle.jsx` (setzt
 * `robots: noindex`) und die Sitemap-Route (wirft den Eintrag raus). Stünden
 * zwei Listen nebeneinander, driften sie auseinander, und der häufigere Fall
 * ist der gefährliche: Seite trägt `noindex`, steht aber weiter in der
 * Sitemap — dann meldet die Search Console dauerhaft einen Konflikt, und
 * niemand sieht ihn, weil beide Einzelstellen für sich richtig aussehen.
 *
 * BELEGTER ANLASS: `/pages/development-nicht-loschen` ist eine
 * Entwicklungsseite und stand am 2026-08-14 auf Platz 4 der Suche nach
 * "Qi Blanco Studien" — sie war NICHT intern verlinkt (0 Treffer im
 * gerenderten HTML der Startseite), sondern ausschließlich über
 * `sitemap/pages/1.xml` auffindbar (lastmod 2025-02-02). Der Discovery-Pfad
 * ist also die Sitemap, und deshalb genügt `noindex` allein nicht.
 *
 * AUFNAHME-KRITERIUM: nur Seiten, die für Kunden keinen Zweck haben
 * (Entwicklungs-/Test-/Rest-Seiten). Eine Seite, die Kunden nutzen sollen,
 * gehört NIE hierher — dann ist die richtige Antwort besserer Inhalt, nicht
 * Unsichtbarkeit. Funnel-Bestätigungsseiten sind der Grenzfall, der trotzdem
 * hierher gehört: Kunden SEHEN sie (nach dem Absenden eines Formulars), aber
 * niemand SUCHT nach ihnen — sie sind Ziel eines Klicks, nie eines Treffers.
 *
 * ZWEI WIRKUNGEN, EINE QUELLE — und warum `ausSitemap` je Eintrag steht
 * (Befund s05 des Grossjobs 20260823-seo-…-indexhygiene…, 2026-08-23):
 * Bis hierher löste EIN Listeneintrag BEIDE Wirkungen zugleich aus, weil
 * beide Leser dasselbe Array bekamen. Für `development-nicht-loschen` war das
 * richtig. Für `/pages/pre-access` ist es GENAU FALSCHHERUM: die Seite hat
 * NULL eingehende interne Links (gemessen über 79 gecrawlte DACH-Seiten), die
 * Sitemap ist also der einzige Weg, auf dem Google sie noch besucht. Wer sie
 * im selben Deploy aus der Sitemap wirft, nimmt Google die Gelegenheit, das
 * frische `noindex` überhaupt zu LESEN — die Seite bliebe im Index und wäre
 * zugleich unerreichbar für die Korrektur. Das ist derselbe Defekt wie ein
 * `Disallow` in der robots.txt, nur durch die zweite Tür: das Ausschluss-
 * Signal muss crawlbar bleiben, bis es gewirkt hat.
 *
 * Deshalb: `ausSitemap: false` heißt „noindex ja, Sitemap-Eintrag bleibt
 * vorerst". Der Preis ist bewusst gewählt und benannt — für die Dauer des
 * Übergangs besteht der Zustand „noindex UND in der Sitemap", vor dem der
 * Absatz oben warnt. Er ist hier gewollt und endlich, nicht versehentlich.
 * Aufgelöst wird er, wenn das noindex nachweislich gewirkt hat; dann kippt
 * der Eintrag auf `ausSitemap: true`.
 *
 * Was hier NICHT passieren darf, ist eine ZWEITE Liste: die beiden Sichten
 * unten werden aus DIESER einen Definition abgeleitet, können also nicht
 * auseinanderdriften.
 * @type {Array<{handle: string, ausSitemap: boolean, grund: string}>}
 */
export const NICHT_INDEXIERBARE_SEITEN_DEF = [
  {
    handle: 'development-nicht-loschen',
    ausSitemap: true,
    grund: 'Entwicklungsseite; Sitemap war ihr einziger Discovery-Pfad (2026-08-14)',
  },
  // Neu 2026-08-23 (s05). Jeder Handle live gemessen: HTTP 200, KEIN
  // robots-meta, in `sitemap/pages/1.xml` geführt. Die ersten sechs tragen
  // NULL eigene Wörter (das leere DACH-Gerüst misst 424 Wörter, sie messen
  // exakt 424), die Funnel-Seiten wenige Zeilen.
  {
    handle: 'pre-access',
    ausSitemap: false,
    grund: 'leere Kampagnen-Restseite, stand auf Platz 2 der Suche nach "QiOne 2 Pro"',
  },
  {
    handle: 'qibracelet_',
    ausSitemap: false,
    grund: 'leerer Handle-Vertipper zu /pages/qibracelet',
  },
  {
    handle: 'qiblanco-qibracelet',
    ausSitemap: false,
    grund: 'leere Dublette zu /pages/qibracelet',
  },
  {
    handle: 'kakao-anwendung-de',
    ausSitemap: false,
    grund: 'leere Sprachvariante zu /pages/kakao-anwendung',
  },
  {
    handle: 'kakao-anwendung-us',
    ausSitemap: false,
    grund: 'leere Sprachvariante, rankte auf der DACH-Markensuche',
  },
  {
    handle: 'zeremonie-kakao-language-select',
    ausSitemap: false,
    grund: 'leere Sprachweiche ohne Inhalt',
  },
  {
    handle: 'anmeldung-erfolgreich',
    ausSitemap: false,
    grund: 'Funnel-Bestätigung: Klickziel, kein Suchziel',
  },
  {
    handle: 'kw-anmeldung-erfolgreich',
    ausSitemap: false,
    grund: 'Funnel-Bestätigung: Klickziel, kein Suchziel',
  },
  {
    handle: 'superhuman-anmeldung-erfolgreich',
    ausSitemap: false,
    grund: 'Funnel-Bestätigung: Klickziel, kein Suchziel',
  },
  {
    handle: 'erinnerung-erfolgreich',
    ausSitemap: false,
    grund: 'Funnel-Bestätigung: Klickziel, kein Suchziel',
  },
  {
    handle: 'superhuman-kurs-bestatigung',
    ausSitemap: false,
    grund: 'Funnel-Bestätigung: Klickziel, kein Suchziel',
  },
  // Neu 2026-08-26 (s04 des Grossjobs …seo-rest-kanonisierung…). Diese fünf
  // sind derselbe Fall wie `pre-access` oben, nur später gefunden: sie waren
  // nicht im damaligen Suchraum. Gemessen wurde nicht die Wortzahl, sondern
  // die DIFFERENZ zu zwei nachweislich leeren Referenzseiten (`pre-access`,
  // `qibracelet_` — beide oben mit Begründung geführt): das Gerüst aus Kopf,
  // Navigation und Fuß ist damit abgezogen. Alle fünf messen 0 eigene
  // Textstücke, tragen also NULL eigenen Inhalt, liefern HTTP 200 und stehen
  // in `sitemap/pages/1.xml` (Beleg: belege/inhalts-delta.json, 20:12Z).
  //
  // `qiblanco` ist dabei der teuerste: eine leere Seite unter dem MARKENNAMEN
  // konkurriert mit der Startseite um genau die Suche, die am sichersten
  // konvertiert. Das ist der Präzedenzfall `pre-access` („stand auf Platz 2
  // der Suche nach QiOne 2 Pro"), nur eine Ebene wichtiger.
  {
    handle: 'qiblanco',
    ausSitemap: false,
    grund: 'leere Restseite unter dem Markennamen; konkurriert mit der Startseite',
  },
  {
    handle: 'linkseite',
    ausSitemap: false,
    grund: 'leere Link-in-Bio-Restseite ohne eigenen Inhalt',
  },
  {
    handle: 'one-inch',
    ausSitemap: false,
    grund: 'leere Kampagnen-Restseite (One Inch Club), laut Grossjob depubliziert',
  },
  {
    handle: 'ketogenes-wochenende',
    ausSitemap: false,
    grund: 'leere Kursseite; die zugehörige Bestätigungsseite ist bereits noindex',
  },
  {
    handle: 'superhuman-kurs',
    ausSitemap: false,
    grund: 'leere Kursseite; die zugehörige Bestätigungsseite ist bereits noindex',
  },
  // Neu 2026-08-29 (Job 20260829-ads-ziel-url-verstoss-...). Achse B der
  // landing-bereich-Wache: beide Handles standen in `sitemap/pages/1.xml`,
  // tragen live aber `noindex,nofollow` — wir bieten Google also eine Seite
  // an, die wir ihm zugleich verbieten.
  //
  // DIESE BEIDEN GEHEN DIREKT AUF `ausSitemap: true`, ANDERS ALS DIE
  // ÜBERGANGS-EINTRÄGE DARÜBER: die Zweistufigkeit existiert für Seiten,
  // deren EINZIGER Discovery-Pfad die Sitemap ist — dort würde ein sofortiges
  // Entfernen dafür sorgen, dass Google das frische `noindex` nie liest. Hier
  // ist das `noindex` kein frisches Signal, sondern steht seit dem
  // IA-Zweiblock-Umbau vom 2026-07-17 (~6 Wochen, live nachgemessen am
  // 2026-08-29). Stufe 1 ist damit abgelaufen, nicht übersprungen.
  //
  // NEBENWIRKUNGS-PRÜFUNG: `NICHT_INDEXIERBARE_SEITEN` (Sicht 1) wird nur von
  // `pages.$handle.jsx` gelesen. Beide Handles haben eigene Code-Routen
  // (pages.partner.jsx, pages.qibracelet.jsx) und laufen nie durch den
  // Catch-all — der Eintrag ändert also KEIN robots-meta, nur die Sitemap.
  // Insbesondere bleibt der öffentliche Zwilling /pages/qibracelet-details
  // unberührt, obwohl er denselben CMS-Handle 'qibracelet' abfragt.
  {
    handle: 'partner',
    ausSitemap: true,
    grund:
      'noindex-LP im Landing-Bereich (Partner-Funnel); stand trotz noindex in ' +
      'der Sitemap — Achse B der landing-bereich-Wache, gemessen 2026-08-29',
  },
  {
    handle: 'qibracelet',
    ausSitemap: true,
    grund:
      'noindex-LP-Shopseite im Landing-Bereich; stand trotz noindex in der ' +
      'Sitemap. Der öffentliche Zwilling ist /pages/qibracelet-details und ' +
      'bleibt indexierbar — Achse B, gemessen 2026-08-29',
  },
];

/**
 * Sicht 1 — alle Handles, die ein `noindex` bekommen. Leser: die Route
 * `pages.$handle.jsx` (robots-meta UND X-Robots-Tag).
 * @type {string[]}
 */
export const NICHT_INDEXIERBARE_SEITEN = NICHT_INDEXIERBARE_SEITEN_DEF.map(
  (e) => e.handle,
);

/**
 * Sicht 2 — die TEILMENGE, die zusätzlich aus der Sitemap fliegt. Leser: die
 * Sitemap-Route. Immer eine Teilmenge von Sicht 1: aus der Sitemap fliegt nur,
 * was ohnehin schon `noindex` trägt — nie umgekehrt.
 * @type {string[]}
 */
export const AUS_SITEMAP_ENTFERNTE_SEITEN = NICHT_INDEXIERBARE_SEITEN_DEF.filter(
  (e) => e.ausSitemap,
).map((e) => e.handle);

/**
 * Gehört dieser Page-Handle aus dem Index?
 * @param {string|undefined} handle
 * @returns {boolean}
 */
export function istNichtIndexierbar(handle) {
  return !!handle && NICHT_INDEXIERBARE_SEITEN.includes(handle);
}

/**
 * meta-Descriptor, der eine Seite aus dem Index nimmt.
 * `noindex` schließt den Index aus, `nofollow` verhindert, dass die Seite
 * ihre Linkkraft weiterreicht — bei einer Entwicklungsseite ist beides
 * gewollt.
 * @returns {{name: 'robots', content: string}}
 */
export function noindexMeta() {
  return {name: 'robots', content: 'noindex,nofollow'};
}

/**
 * Die ZWEITE, vom HTML unabhängige Sperre desselben Signals (Hausmuster
 * D-006, „Gurt und Hosenträger"): greift auch bei einem Bot, der den
 * HTML-head nicht parst. Bewusst wortgleich zu dem, was die eigenen Routen
 * mit eigener Datei setzen (z. B. `pages.uebersicht.jsx`) — ein zweiter
 * Wortlaut wäre ein zweiter Wartungspunkt ohne Nutzen.
 * @returns {{'X-Robots-Tag': string}}
 */
export function noindexHeader() {
  return {'X-Robots-Tag': 'noindex, nofollow'};
}

/**
 * Produkt-Handles, die NICHT in den Google-Index gehören.
 *
 * WARUM DIESE LISTE HIER STEHT (und zwei Vorgänger-Listen ersetzt):
 * Für Produkte existierte dieselbe Trennung bereits ZWEIMAL nebeneinander —
 * `HIDDEN_BUNDLE_PRODUCT_HANDLES` in `products.$handle.jsx` (setzt das
 * robots-meta) und `HIDDEN_PRODUCT_HANDLES` in der Sitemap-Route (wirft den
 * Eintrag raus). Beide trugen zufällig denselben Inhalt. Genau vor dieser
 * Doppelung warnt der Kommentar an NICHT_INDEXIERBARE_SEITEN oben; für
 * Seiten wurde sie deshalb schon zusammengelegt, für Produkte war es nur
 * noch nicht passiert. Zwei Listen driften, und der gefährliche Fall ist
 * der leise: Produkt trägt `noindex`, steht aber weiter in der Sitemap —
 * die Search Console meldet das dauerhaft als Konflikt, während jede
 * Einzelstelle für sich richtig aussieht.
 *
 * BELEGTER ANLASS (live gemessen 2026-08-15 gegen sitemap/products/1.xml,
 * 19 Einträge): SECHS der 19 Produkt-URLs sind keine Kundenseiten.
 *   - `test-page-crystal-cacao®-create-spater-wieder-loschen` — eine
 *     Testseite, die ihren Zweck im eigenen Handle nennt, ausgeliefert mit
 *     HTTP 200 und indexierbar.
 *   - `crystal-cacao-adfiefiale` — Vertipper-Handle, Titel identisch mit
 *     `crystal-cacao-create`: eine Dublette der Umsatzseite.
 *   - `8kendiw34hd`, `pjdz538hgs0` — Angebots-Handles aus Zufallszeichen.
 *     Sie sind Ziel verschickter Angebotslinks, nicht Suchergebnis.
 *   - `aw783hfn`, `37cr378n` — antworten selbst mit HTTP 404 und standen
 *     trotzdem in der Sitemap: wir haben Google aktiv auf zwei tote URLs
 *     gezeigt.
 * Für die Suche heißt das: rund um das umsatztragende Wort
 * "Crystal Cacao Create" konkurrieren mehrere fast gleiche Seiten, und
 * Google muss selbst raten, welche die echte ist.
 *
 * AUFNAHME-KRITERIUM (bewusst identisch zu NICHT_INDEXIERBARE_SEITEN): nur
 * Handles, die für Kunden keinen Zweck haben — Test-, Rest-, Dubletten- und
 * reine Link-Ziel-Handles. NICHT aufgenommen sind deshalb die realen
 * Bundle-/Mengenrabatt-Produkte (`bundle-2x-awake`, `mengenrabatt-3x-create`
 * u. a.): die kann man kaufen. Sie sind inhaltlich dünn, aber die richtige
 * Antwort darauf ist besserer Inhalt, nicht Unsichtbarkeit.
 * @type {string[]}
 */
export const NICHT_INDEXIERBARE_PRODUKTE = [
  // Bestand: nie beworbene Bundle-Handles (bis 2026-08-15 in zwei Listen).
  'bundle-fundament',
  'bundle-unabhangig',
  'bundle-erholungs-residenz',
  // Neu 2026-08-15, jeder Handle an der Live-Auslieferung belegt.
  'test-page-crystal-cacao®-create-spater-wieder-loschen',
  'crystal-cacao-adfiefiale',
  '8kendiw34hd',
  'pjdz538hgs0',
  'aw783hfn',
  '37cr378n',
];

/**
 * Gehört dieser Produkt-Handle aus dem Index?
 * @param {string|undefined} handle
 * @returns {boolean}
 */
export function istNichtIndexierbaresProdukt(handle) {
  return !!handle && NICHT_INDEXIERBARE_PRODUKTE.includes(handle);
}

/**
 * Kollektions-Handles, die NICHT in den Google-Index gehören.
 *
 * WARUM DIE DRITTE LISTE UND NICHT EIN EINTRAG IN EINER DER OBEREN: Seiten,
 * Produkte und Kollektionen sind drei getrennte Shopify-Namensräume mit je
 * eigenem URL-Präfix. Ein Handle `products` existiert als Kollektion UND
 * könnte als Seite existieren; eine gemeinsame Liste müsste den Typ mitführen
 * und wäre an jeder Lesestelle zu filtern. Die Trennung ist hier billiger als
 * die Vereinigung — die Doppelungs-Warnung oben richtet sich gegen ZWEI Listen
 * für DENSELBEN Namensraum, nicht gegen eine je Namensraum.
 *
 * AUFNAHME-KRITERIUM (wortgleich zu den beiden Listen oben): nur Handles ohne
 * Zweck für Kunden. Entscheidend ist NICHT, ob die Kollektion heute leer ist —
 * eine leere Saison-Kollektion (`valentinstag-angebote`,
 * `blackfriday-sale-artikel`) ist eine echte Kundenkategorie, die wieder
 * gefüllt wird; dort ist die richtige Antwort Inhalt, nicht Unsichtbarkeit.
 * Aufgenommen ist nur, was seiner NATUR nach intern ist.
 *
 * BELEGTER ANLASS (live gemessen 2026-08-26T20:07Z gegen alle neun in der
 * Sitemap geführten Kollektionen, belege/inhalts-delta.json): fünf davon sind
 * Steuerungs-Kollektionen des Shops, keine Kategorien.
 *   - `slider` sagt es in der eigenen Beschreibung: „Artikel, die im Slider
 *     angezeigt werden sollen." Das ist eine Konfiguration der Startseite,
 *     die versehentlich eine öffentliche URL bekommen hat.
 *   - `frontpage` („Home page") und `products` („Products") legt Shopify
 *     selbst an. Beide tragen einen ENGLISCHEN Titel auf der deutschen
 *     Storefront und dieselben Produkte wie `/collections/all` — sie sind
 *     Dubletten der Kategorieübersicht, nicht eigene Kategorien.
 *   - `digital-goods-vat-tax` ist eine steuerliche Gruppierung für die
 *     Umsatzsteuer digitaler Güter, `cross-selling` eine Merchandising-Quelle
 *     für Produktempfehlungen. Beide messen 0 eigene Produkte.
 *
 * WARUM noindex UND KEIN canonical: dieselbe Regel, die schon
 * `pages.uebersicht.jsx` trägt — noindex neben einem canonical auf eine
 * andere URL sind widersprüchliche Signale. Für `frontpage`/`products` wäre
 * ein canonical auf `/collections/all` fachlich naheliegend und trotzdem
 * falsch: es machte die Dublette wieder crawlbar.
 * @type {string[]}
 */
export const NICHT_INDEXIERBARE_KOLLEKTIONEN = [
  'frontpage',
  'products',
  'slider',
  'cross-selling',
  'digital-goods-vat-tax',
];

/**
 * Gehört dieser Kollektions-Handle aus dem Index?
 * @param {string|undefined} handle
 * @returns {boolean}
 */
export function istNichtIndexierbareKollektion(handle) {
  return !!handle && NICHT_INDEXIERBARE_KOLLEKTIONEN.includes(handle);
}
