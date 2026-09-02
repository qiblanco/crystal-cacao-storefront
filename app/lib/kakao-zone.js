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
 * DER SORTIMENTS-ZAUN — welche Shopify-Ressourcen diese Storefront ausliefern darf.
 * ============================================================================
 *
 * WARUM ES DIESEN ZAUN GIBT (gemessen 2026-09-02, Job …-prio6-s02, auf
 * origin/main 86ee245 am gerenderten HTML des dev-Servers):
 * Diese Storefront läuft gegen PUBLIC_STORE_DOMAIN=qi-blanco.myshopify.com —
 * denselben Shopify-Katalog, der auch die Energieprodukte führt. Die
 * Hydrogen-Catch-all-Routen fragen diesen Katalog ungefiltert ab. Ergebnis
 * VOR dem Zaun, alles HTTP 200 mit voll gerendertem Fremdinhalt:
 *   /products/qione-2-pro    26497 B, 18 sichtbare Fremdnennungen
 *   /products/qibracelet     32441 B, 18
 *   /products/qihome-air     24221 B, 18
 *   /pages/studien          105308 B, 59   (aus der Kopfnavigation verlinkt!)
 *   /collections/all         35067 B, 44   (aus dem leeren Warenkorb verlinkt!)
 * Auf einem Kakao-Shop hat das nichts zu suchen. Ein grep über den Quelltext
 * findet davon NICHTS — keine dieser Seiten steht in einer Zeile Code.
 *
 * WARUM PRODUKTE DYNAMISCH, KOLLEKTIONEN UND SEITEN STATISCH:
 * Das Kakao-SORTIMENT wächst im Shopify-Admin, ohne dass jemand Code anfasst
 * (die Kollektion `zeremonie-kakao` führte am 2026-09-02 acht Produkte). Eine
 * statische Handle-Liste würde beim nächsten neu angelegten Kakao-Produkt
 * still 404 liefern — unsichtbar, und ausgerechnet auf dem Kaufweg. Deshalb
 * entscheidet bei Produkten die KOLLEKTIONS-MITGLIEDSCHAFT, nicht eine Liste.
 * Kollektionen und Seiten dagegen ändern sich nur durch bewusste
 * Strukturarbeit; dort ist die Liste richtig und default-deny erwünscht.
 *
 * WARUM DIE MITGLIEDSCHAFT NICHTS KOSTET: sie braucht keine zweite
 * Storefront-Query. Die Produkt-Query in `products.$handle` zieht die
 * `collections`-Handles einfach mit; der Loader entscheidet daraus.
 */

/** Die Shopify-Kollektion, die das Kakao-Sortiment führt. */
export const KAKAO_KOLLEKTION = 'zeremonie-kakao';

/**
 * Die ABSENDER-MARKE dieser Storefront — der Name, den der Besucher im
 * Seitentitel und in der Kopfzeile liest.
 *
 * WARUM ALS KONSTANTE UND NICHT 13-MAL ALS LITERAL: gemessen 2026-09-02 stand
 * `| Qi Blanco UG (haftungsbeschränkt)` wörtlich in 13 Route-Dateien. Auf einem
 * Kakao-Shop ist das die fremde Absender-Marke; sie hier zu ändern und dort
 * stehen zu lassen hätte den Widerspruch nur verteilt. Eine Marke, eine Stelle.
 *
 * ABGRENZUNG, die tragend ist: Das ist die ANZEIGE-Marke, NICHT die
 * Rechtsperson. Betreiberin bleibt die Qi Blanco UG (haftungsbeschränkt) —
 * sie steht unverändert in `app/lib/entity-schema.js` (legalName) und in den
 * Rechtstexten. Diese Konstante fasst KEINE Rechtsfrage an; Impressum,
 * Datenschutz und AGB bleiben unberührt und sind ausdrücklich nicht Gegenstand
 * dieses Zauns.
 */
export const ABSENDER_MARKE = 'Crystal Cacao®';

/**
 * Kollektions-Handles, die diese Storefront ausliefern darf.
 * Bewusst kurz: alles andere ist Fremdsortiment (gemessen standen unter
 * /collections die vier Qi-Blanco-Kollektionen frontpage, products,
 * digitale-kurse und digital-goods-vat-tax).
 */
export const KAKAO_KOLLEKTIONEN = Object.freeze([KAKAO_KOLLEKTION]);

/**
 * CMS-Seiten-Handles, die diese Storefront ausliefern darf.
 * `studien` steht hier bewusst NICHT: das ist die Qi-Blanco-Studienseite
 * (105 KB, 59 Fremdnennungen), nicht Kakao.
 */
export const KAKAO_SEITEN = Object.freeze(['crystal-cacao', 'kristall-kakao']);

/**
 * Gehört dieses Produkt zum Kakao-Sortiment?
 * Entscheidet über die Kollektions-Mitgliedschaft, damit ein im Admin neu
 * angelegtes Kakao-Produkt OHNE Code-Änderung sofort erreichbar ist.
 *
 * @param {string[]|undefined|null} kollektionsHandles Handles der Kollektionen,
 *   in denen das Produkt liegt (aus der ohnehin laufenden Produkt-Query).
 * @returns {boolean}
 */
export function istKakaoProdukt(kollektionsHandles) {
  if (!Array.isArray(kollektionsHandles)) return false;
  return kollektionsHandles.some((h) => KAKAO_KOLLEKTIONEN.includes(h));
}

/** Darf diese Kollektion ausgeliefert werden? @param {string} handle */
export function istKakaoKollektion(handle) {
  return Boolean(handle) && KAKAO_KOLLEKTIONEN.includes(handle);
}

/** Darf diese CMS-Seite ausgeliefert werden? @param {string} handle */
export function istKakaoSeite(handle) {
  return Boolean(handle) && KAKAO_SEITEN.includes(handle);
}

/**
 * DIE NAVIGATION DIESER STOREFRONT.
 *
 * WARUM SIE HIER STEHT UND NICHT AUS SHOPIFY KOMMT (gemessen 2026-09-02):
 * Kopf- und Fusszeile zogen die Shopify-Menüs `main-menu` und `footer` des
 * Shops qi-blanco.myshopify.com. Die führen das ganze Fremdsortiment — im
 * ausgelieferten HTML JEDER Seite standen dadurch die Menüeinträge zu
 * QiOne®, QiBracelet®, QiHome® Air und der Qi-Blanco-Studienseite, auch auf
 * /cart und /policies. Sichtbar gerendert wurde davon nur die oberste Ebene
 * ("Studien" verlinkte /pages/studien), die Kinder lagen im Hydratations-
 * Datensatz — also EINE Komponentenänderung von der Sichtbarkeit entfernt.
 *
 * Diese Liste ist bewusst STATISCH: eine Navigation ändert sich nur durch
 * bewusste Strukturarbeit, nicht durch das Anlegen eines Produkts. Sobald im
 * Shopify-Admin ein eigenes Kakao-Menü existiert, kann sie durch dessen
 * Handle ersetzt werden — bis dahin ist sie die ehrlichere Lösung als ein
 * Fremdmenü, das zufällig gerade harmlos aussieht.
 *
 * Jedes Ziel hier ist am 2026-09-02 mit HTTP 200 gemessen worden.
 */
export const KAKAO_MENUE = Object.freeze({
  id: 'kakao-menue',
  items: Object.freeze([
    {id: 'kakao-start', title: 'Start', url: '/', items: []},
    {
      id: 'kakao-ueber',
      title: 'Unser Kakao',
      url: '/pages/crystal-cacao',
      items: [],
    },
    {
      id: 'kakao-awake',
      title: 'AWAKE',
      url: '/products/crystal-cacao-awake',
      items: [],
    },
    {
      id: 'kakao-create',
      title: 'CREATE',
      url: '/products/crystal-cacao-create',
      items: [],
    },
    {
      id: 'kakao-alle',
      title: 'Alle Sorten',
      url: `/collections/${KAKAO_KOLLEKTION}`,
      items: [],
    },
  ]),
});

/**
 * Fusszeile: bewusst nur die Rechtstexte.
 * Sie werden hier NICHT inhaltlich angefasst — welche Pflichtseiten es geben
 * muss und was darin steht, ist eine Rechtsfrage und gehört Christian, nicht
 * diesem Zaun. Verlinkt wird die Shopify-eigene Policy-Übersicht.
 */
export const KAKAO_FUSSMENUE = Object.freeze({
  id: 'kakao-fussmenue',
  items: Object.freeze([
    {id: 'kakao-policies', title: 'Rechtliches', url: '/policies', items: []},
  ]),
});

/**
 * Die eine Stelle, an der "gehört nicht hierher" zu einer Antwort wird.
 * 404 und nicht 403: für den Besucher gibt es diese Seite auf dem Kakao-Shop
 * schlicht nicht, und eine 404 ist die einzige Antwort, die Suchmaschinen
 * nicht als Inhalt indexieren.
 */
export function fremdinhaltAbweisen() {
  return new Response(null, {status: 404, statusText: 'Not Found'});
}

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

/**
 * WELCHE SORTE ZEIGT DIESE SEITE? (Job …-prio6, Segment s03)
 * ==========================================================
 * Christian: „Awake und Create haben zwei unterschiedliche Farbgebungen im
 * Namen … auswerten und dezent entsprechend nutzen."
 *
 * Die Farbe selbst steht in app/styles/kakao-seiten.css (gemessen an den
 * Verpackungsbildern, dort mit Werten belegt). Hier steht nur, WELCHE Seite
 * welche Sorte ist — dieselbe Trennung wie oben: die Zuordnung Pfad→Bedeutung
 * wohnt in dieser Datei, nicht in einer Komponente.
 *
 * WARUM HIER UND NICHT IN DEN ROUTEN: die beiden Produktrouten
 * products.crystal-cacao-awake.jsx und -create.jsx sind K1 (byte-gleich zur
 * Vorlage, shared/UPSTREAM.json). Eine Sorten-Markierung dort wäre
 * Vendoring-Drift und würde beim nächsten Nachzug kommentarlos überschrieben
 * — die Sortenfarbe wäre still wieder weg. Der Weg über den Pfad kommt ohne
 * eine einzige K1-Zeile aus.
 *
 * WARUM KEIN SUBSTRING-TEST: derselbe Grund wie bei KAKAO_PFADE oben. Die
 * Übersichtsseite /pages/crystal-cacao trägt „crystal-cacao" im Pfad und ist
 * bewusst KEINE Sorte — sie zeigt beide und bleibt deshalb neutral.
 */
export const SORTEN_PFADE = Object.freeze({
  '/products/crystal-cacao-awake': 'awake',
  '/products/crystal-cacao-create': 'create',
});

/**
 * Sorte dieses Pfades — 'awake', 'create' oder null (keine Sortenseite).
 * @param {string} pathname
 * @returns {string|null}
 */
export function sorteZuPfad(pathname) {
  if (!pathname) return null;
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SORTEN_PFADE[p] ?? null;
}
