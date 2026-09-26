/**
 * Teilen-Bild und strukturierte Daten der crystal-eigenen Seitenklassen.
 *
 * Reine Datenfabrik ohne React-Import (mit `node --input-type=module`
 * ladbar, wie app/lib/seo.js, produkt-seo.js und entity-schema.js). Die
 * Importe stehen bewusst RELATIV statt ueber den '~'-Alias: den loest nur
 * Vite auf, nicht Node — die hermetische Probe koennte die Datei sonst gar
 * nicht laden.
 *
 * WARUM ES DIESE DATEI GIBT (Vollzensus der lebenden Sitemap am 2026-09-12,
 * zehn URLs einzeln abgerufen, keine Stichprobe): drei von zehn Seiten trugen
 * KEIN og:image (`/`, `/collections/zeremonie-kakao`, `/pages/warum-crystal-
 * cacao`), und `/collections/zeremonie-kakao` trug als EINZIGE Seite des
 * Ladens ueberhaupt kein JSON-LD. Wer einen dieser Links teilt, bekommt einen
 * nackten Link; eine Suchmaschine sieht auf der Kollektionsseite eine
 * Produktliste, der niemand sagt, dass sie eine Kollektion ist.
 *
 * WARUM NEBEN app/lib/seo.js UND NICHT DARIN: seo.js steht im
 * Vendoring-Manifest (shared/UPSTREAM.json) als K2 — jede Zeile dort ist eine
 * weitere Abweichung von der qiblanco-Vorlage, die bei jedem Nachzug von Hand
 * entschieden werden muss. Diese Datei gehoert crystal allein und steht in
 * keinem Manifest-Eintrag.
 *
 * WARUM NICHT DIE DACH-HILFE app/lib/kollektion-seo.js UEBERNOMMEN — das ist
 * der tragende Unterschied und keine Geschmacksfrage: jene Datei baut eine
 * DREISTUFIGE Brotkrume und begruendet ihre mittlere Stufe ausdruecklich
 * damit, dass "/collections EXISTIERT als ausgelieferte Seite mit eigener H1
 * und verlinkt jede Kollektion". Auf crystal-cacao.com ist das NICHT so:
 * `/collections` antwortet HTTP 302 auf `/collections/zeremonie-kakao`, und
 * `/collections/all` ebenso (am 2026-09-12 gemessen). Eine dreistufige
 * Brotkrume naennte hier eine Zwischenstufe, die keine Seite ist und die auf
 * das LETZTE Glied derselben Brotkrume weiterleitet. Es gilt deshalb die
 * Begruendung, die seiten-seo.js in der Vorlage fuer /pages fuehrt: "eine
 * erfundene Zwischenstufe entspricht keinem Link, den ein Besucher je sieht."
 * Zwei Laeden, zwei verschiedene richtige Antworten.
 *
 * WAS SIE AUSDRUECKLICH NICHT TUT: sie setzt weder <title> noch
 * `name=description` noch den Canonical. Die stehen in den Routen bereits und
 * folgen dort einer eigenen, begruendeten Rangfolge. Diese Datei ist ADDITIV —
 * sie haengt an, was fehlt, und fasst nicht an, was steht.
 */
import {CANONICAL_ORIGIN, absoluteCanonical} from './seo.js';
import {ORG_ID, SITE_ID, entityGraph, websiteSchema} from './entity-schema.js';
import {ABSENDER_MARKE, markenOrganisation} from './kakao-zone.js';

/**
 * Entitaets-Graph dieses Ladens: Organization UND WebSite, beide mit der
 * RICHTIGEN Marke.
 *
 * WARUM ER HIER STEHT UND NICHT IN app/routes/_index.jsx, wo er bis zum
 * 2026-09-12 stand: seit diesem Tag braucht ihn eine ZWEITE Seite. Die
 * Kollektionsseite nennt in ihrer CollectionPage `isPartOf` und `publisher`
 * per `@id` — und eine unabhaengige Gegenpruefung hat noch am selben Tag
 * gemessen, dass beide Knoten in JENEM Dokument gar nicht ausgeliefert wurden.
 * Ein Konsument, der das Einzeldokument liest (so wertet Google), sah einen
 * leeren Verweis.
 *
 * Der Griff waere gewesen, den Graphen in der zweiten Route noch einmal zu
 * bauen. Dann haette dieser Laden ZWEI Stellen, an denen seine Marke steht,
 * und sie waeren beim naechsten Marken-Nachzug auseinandergelaufen — genau die
 * Drift, gegen die ABSENDER_MARKE in kakao-zone.js angelegt wurde. Eine Marke,
 * eine Stelle.
 *
 * entity-schema.js bleibt unberuehrt: sie ist im Vendoring-Manifest als K1
 * gefuehrt, also byte-gleich zur Vorlage. `websiteSchema()` setzt `name` auf
 * ORGANISATION.name, also „Qi Blanco" — in der Vorlage richtig, hier die
 * fremde Absender-Marke. Der Anpassungspunkt ist deshalb der AUFRUFER.
 *
 * @returns {object} JSON-LD-Graph mit Organization und WebSite
 */
export function markenGraph() {
  const graph = entityGraph();
  const seite = websiteSchema();
  return {
    ...graph,
    '@graph': graph['@graph'].map((knoten) => {
      if (knoten['@id'] === seite['@id']) {
        return {...knoten, name: ABSENDER_MARKE};
      }
      if (knoten['@id'] === ORG_ID) {
        return markenOrganisation(knoten, {origin: CANONICAL_ORIGIN});
      }
      return knoten;
    }),
  };
}

/**
 * DAS Teilen-Bild dieses Ladens — eine Marke, ein Bild, eine Stelle.
 *
 * WAS HIER ENTSCHIEDEN WURDE, und warum es keine Geschmacksfrage ist
 * (Grossjob-Segment s06, 2026-09-12): app/routes/_index.jsx trug bis heute
 * den Zaun, der og:image "bewusst" wegliess, weil es "kein gepflegtes
 * Teilen-Bild" gebe.
 *
 * DER WORTLAUT JENES ZAUNS WIRD HIER ABSICHTLICH NICHT ZITIERT, und das ist
 * keine Stil-, sondern eine Wirkungsfrage: seo-manager/bin/auffindbarkeits_
 * wache.py erkennt einen dokumentierten og-Verzicht daran, dass die STATISCHE
 * Routendatei genau diesen Satz fuehrt (OG_VERZICHT_MARKER). Der Satz ist also
 * kein Kommentar, sondern ein SCHALTER. Wer ihn zitiert, nachdem der Verzicht
 * zurueckgenommen wurde, stellt eine Ausnahme wieder her, die es nicht mehr
 * gibt -- sie bleibt schlafend, solange die Seite ihr Bild hat, und entschuldigt
 * lautlos den Tag, an dem es wieder verschwindet.
 * Der ZWEITE Halbsatz jenes Zauns — `twitter:card summary_large_image` ohne
 * Bild waere eine Zusage ohne Deckung — ist zeitlos richtig und gilt hier
 * unveraendert weiter: die Kartenangabe steht unten in DERSELBEN Bedingung
 * wie das Bild. Der ERSTE Halbsatz war eine Tatsachenbehauptung ueber den
 * Bildbestand, und die ist nachgemessen worden statt geglaubt.
 *
 * GEMESSEN (44 distinkte Bild-URLs der Startseite, jede geladen, echte
 * Pixelmasse aus dem Dateikopf — NICHT aus dem Dateinamen, der nachweislich
 * luegen kann): die Startseite rendert zwei Packshots mit `loading="eager"`,
 * also oberhalb der Falz. 7.png (Awake) misst nativ 2000x2000,
 * Doypack_Mockup__v3-min.png (Create) 2144x2133. Beide echt, beide in Shopify
 * gepflegt, beide genau das, was der Laden verkauft. Ein gepflegtes Bild
 * EXISTIERT also; was fehlt, ist ein eigens fuers Teilen gebautes.
 *
 * SEIT DEM 2026-09-13 IST DAS BILD EIGENS GEBAUT — und der Absatz darueber
 * beschreibt den Zwischenstand, der dafuer abgeloest wurde. Er lautete: nimm
 * den Awake-Packshot, weil er das erste eager geladene Produktbild der
 * Startseite ist. Das war ein Kriterium und kein Geschmack, aber es blieb eine
 * Verlegenheit — die Startseite zeigt BEIDE Sorten gleichgewichtig (Awake und
 * Create je genau 12 Vorkommen), und der geteilte Link sagte trotzdem „Awake".
 * Dazu war das Bild quadratisch, also genau die Form, die Facebook, LinkedIn
 * und X wegschneiden, und es war ein Packshot ohne Wortmarke und ohne Herkunft.
 *
 * WAS JETZT DASTEHT: repo/public/teilen/crystal-cacao-teilbild-1200x630.png,
 * gebaut von bau/teilbild/teilbild-bauen.py aus den Token der Seite selbst
 * (app/styles/kakao-seiten.css) und ihrer eigenen Schrift (Open Sans Variable).
 * Beide Sorten in gleicher Groesse und gleichem Abstand, Wortmarke, Bewertung,
 * je Sorte die EIGENE Herkunft. Nichts Saisonales: verworfen blieb
 * Black_Friday_Sale-Kakao.png (711x711 und an ein Datum gebunden — ein
 * Black-Friday-Banner als dauerhaftes Markenbild veraltet von selbst).
 *
 * DIE HERKUNFT STEHT JE SORTE GETRENNT, UND DAS IST KEINE FEINHEIT: Awake
 * kommt aus dem Piura-Tal in Nordperu, Create aus dem Departamento Amazonas
 * (app/lib/sorten-profil.js sagt das ausdruecklich, die Pruefzeugnisse heissen
 * entsprechend „Piura Blanco" und „Amazonas Nativo"). Eine gemeinsame Zeile
 * „aus dem Piura-Tal" waere fuer die eine Sorte wahr und fuer die andere
 * falsch. Gemeinsam wahr ist allein „Peru".
 *
 * AUF DEM BILD STEHT NUR PRODUKTBESCHAFFENHEIT, keine gesundheitsbezogene
 * Angabe (EU 1924/2006). Die Startseite traegt die Zeile „Zwei Sorten, ein
 * Kakao: Awake fuer den Start in den Tag, Create fuer den klaren Kopf" — davon
 * ist die ERSTE Haelfte uebernommen und die zweite bewusst weggelassen.
 *
 * DIE BEWERTUNG IST NICHT ABGETIPPT, SIE WIRD GELESEN. Der Generator parst
 * KAKAO_KENNZAHLEN aus app/lib/kakao-zone.js; die Zahl hat sich schon einmal
 * geaendert (5,0 -> 4,9 am 2026-08-24), und ein soziales Netz haelt ein
 * Teilen-Bild monatelang im Cache. Waere sie hier eingebrannt und dort
 * gepflegt, fuehrten zwei Stellen denselben Stand. Daneben liegt
 * bau/teilbild/teilbild-manifest.json mit genau den verbauten Werten — daran
 * kann eine Probe Bild gegen Konstante halten, ohne Pixel lesen zu muessen.
 *
 * WARUM EINE KONSTANTE UND NICHT „das Bild des ersten Produkts der
 * Kollektion": genau diese Ableitung war der Defekt, den eine unabhaengige
 * Gegenpruefung am 2026-09-12 im DACH-Laden gefunden hat — unter IDENTISCHEM
 * canonical lieferten zwei URLs zwei verschiedene Vorschaubilder, weil das
 * Bild aus den Seitendaten stammte. Ein Teilen-Bild muss stabil sein.
 *
 * MASSE SIND DIE DER AUSGELIEFERTEN DATEI, nicht die des Dateinamens: die PNG
 * misst im IHDR-Kopf 1200x630, nachgemessen. Der Dateiname nennt dieselben
 * Zahlen, aber er ist der Beleg nicht — im Schwester-Laden ist belegt, dass
 * ein Dateiname ueber seine Masse luegt. Mit dem Wechsel auf die eigene
 * Herkunft faellt nebenbei der Shopify-`?width=`-Deckel weg: er skalierte nie
 * hoch, sondern nur herunter, und das Original musste deshalb mindestens die
 * Zielgroesse haben.
 *
 * KEIN og:image:type: zwar liefert der eigene Adapter jetzt einen festen
 * Content-Type (server.node.mjs, MIME-Tabelle), aber `teilbildSignale()`
 * setzt das Feld nicht, und die taegliche Probe fordert es nicht. Ein Feld,
 * dessen Zusage niemand prueft, ist Deko.
 *
 * DER alt-TEXT BENENNT, WAS ZU SEHEN IST — beide Sorten, nicht eine. Der alte
 * Text („Crystal Cacao® Awake – Bio") war der Produkttitel des einen
 * Packshots; auf diesem Bild waere er nur noch halb wahr.
 */
export const MARKEN_TEILBILD = Object.freeze({
  url: `${CANONICAL_ORIGIN}/teilen/crystal-cacao-teilbild-1200x630.png`,
  breite: 1200,
  hoehe: 630,
  alt: 'Crystal Cacao® – Awake und Create, Bio-Kakao aus Peru',
});

/**
 * Open-Graph-Bild samt Massen und Twitter-Karte — als meta-Descriptoren.
 *
 * Additiv gedacht: das Ergebnis wird an die bestehende meta-Liste einer Route
 * ANGEHAENGT (`...teilbildSignale()`), es ersetzt sie nicht.
 *
 * Die Kartenangabe steht in DERSELBEN Bedingung wie das Bild und ist von ihm
 * gedeckt — ohne Bild entsteht auch keine Karte. Das ist der Zaun aus
 * _index.jsx, hier weitergefuehrt statt aufgegeben.
 *
 * @param {{url: string, breite: number, hoehe: number, alt: string}} [bild]
 * @returns {Array<object>} meta-Descriptoren fuer react-router 7
 */
export function teilbildSignale(bild = MARKEN_TEILBILD) {
  if (!bild?.url || !bild?.breite || !bild?.hoehe) return [];
  return [
    {property: 'og:image', content: bild.url},
    {property: 'og:image:width', content: String(bild.breite)},
    {property: 'og:image:height', content: String(bild.hoehe)},
    {property: 'og:image:alt', content: bild.alt || ABSENDER_MARKE},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
}

/**
 * Brotkrume Startseite -> diese Seite. ZWEI Stufen, siehe Dateikopf.
 *
 * @param {{url: string, name: string}} args
 * @returns {object} BreadcrumbList-Knoten
 */
export function brotkrume({url, name}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${url}#brotkrume`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Startseite',
        item: `${CANONICAL_ORIGIN}/`,
      },
      {'@type': 'ListItem', position: 2, name, item: url},
    ],
  };
}

/**
 * Open Graph und strukturierte Daten EINER Kollektions-URL.
 *
 * `eintraege` sind die Produkte, die die Seite TATSAECHLICH ZEIGT, in der
 * gerenderten Reihenfolge. Das ist wichtiger, als es aussieht: der
 * Uebersichts-Zaun im Loader (uebersichtAuswahl) kappt die API-Antwort von
 * neun auf zwei Sorten, und eine ItemList aus der ROHEN API-Antwort haette
 * sieben Adressen benannt, die auf dieser Seite niemand sieht. Der Aufrufer
 * uebergibt deshalb die Knoten NACH dem Zaun.
 *
 * WARUM DIE ItemList NUR AUF DER ERSTEN SEITE ENTSTEHT (`ersteSeite`): die
 * Kollektionsroute paginiert cursor-basiert und kanonisiert jede Cursor-URL
 * auf die Kollektion selbst. Eine ItemList mit `position: 1..n` auf einer
 * Folgeseite behauptete unter der KANONISCHEN URL eine Reihenfolge, die dort
 * nicht gilt. Heute hat dieser Laden nach dem Zaun genau zwei Sorten und
 * damit nie eine Folgeseite — die Bedingung steht trotzdem, weil sie sonst
 * genau in dem Moment fehlt, in dem das Sortiment waechst.
 *
 * @param {{pfad: string, name: string,
 *          beschreibung?: string|null,
 *          eintraege?: Array<{url: string, name: string}>,
 *          ersteSeite?: boolean}} args
 * @returns {Array<object>} meta-Descriptoren fuer react-router 7
 */
export function kollektionSignale({
  pfad,
  name,
  beschreibung,
  eintraege = [],
  ersteSeite = true,
}) {
  const url = absoluteCanonical(pfad);
  const kurz = (name || '').trim() || ABSENDER_MARKE;
  const text = (beschreibung || '').trim();

  const descriptoren = [];
  // Das Teilbild haengt aus demselben Grund an `ersteSeite` wie die ItemList:
  // eine Cursor-URL ist kein teilbarer Gegenstand, sie wird auf die Kollektion
  // kanonisiert. Ein falsches Bild ist dort schlechter als gar keines.
  if (ersteSeite) descriptoren.push(...teilbildSignale());

  const knoten = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    // Eigene @id mit Fragment, damit der Knoten neben Brotkrume und ItemList
    // desselben Dokuments eindeutig adressierbar bleibt.
    '@id': `${url}#collection`,
    url,
    name: kurz,
    inLanguage: 'de-DE',
    // Dieselben Anker, die die Startseite als Organization und WebSite
    // ausliefert. Ohne sie stuenden hier drei unverbundene Aussagen ueber
    // denselben Laden nebeneinander.
    isPartOf: {'@id': SITE_ID},
    publisher: {'@id': ORG_ID},
  };
  if (text) knoten.description = text;
  if (ersteSeite) {
    knoten.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: MARKEN_TEILBILD.url,
      width: MARKEN_TEILBILD.breite,
      height: MARKEN_TEILBILD.hoehe,
    };
    knoten.mainEntity = {'@id': `${url}#liste`};
  }
  // react-router 7 rendert diesen Descriptor nativ als
  // <script type="application/ld+json"> und maskiert den Inhalt selbst.
  descriptoren.push({'script:ld+json': knoten});

  if (ersteSeite) {
    descriptoren.push({
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#liste`,
        name: kurz,
        // Die Reihenfolge IST die gerenderte, deshalb `Ascending` und nicht
        // `Unordered`: die Position im Markup entspricht der auf der Seite.
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: eintraege.length,
        itemListElement: eintraege.map((e, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: e.name,
          url: e.url,
        })),
      },
    });
  }

  descriptoren.push({'script:ld+json': brotkrume({url, name: kurz})});
  // DIE ANKER, AUF DIE `isPartOf` UND `publisher` OBEN ZEIGEN — im SELBEN
  // Dokument. Eine unabhaengige Gegenpruefung hat am 2026-09-12 gemessen, dass
  // die erste Fassung dieser Datei beide per `@id` nannte, ohne sie
  // auszuliefern: sie standen nur auf der Startseite. Ein Konsument, der das
  // Einzeldokument liest — und so wertet Google — sah einen leeren Verweis.
  // Die doppelte Ausgabe desselben Knotens auf mehreren Seiten ist kein
  // Widerspruch: die `@id` macht sie zur EINEN Entitaet.
  descriptoren.push({'script:ld+json': markenGraph()});
  // og:title/og:url/og:description stehen bereits in der Route und werden
  // hier NICHT wiederholt — zwei Quellen fuer denselben Text driften
  // auseinander.
  return descriptoren;
}

/**
 * Die Produkt-Eintraege einer Kollektionsseite in die Form von `eintraege`
 * bringen — aus den Knoten, die die Seite NACH dem Uebersichts-Zaun rendert.
 *
 * Ein Knoten ohne Handle oder ohne Titel wird ausgelassen statt mit einem
 * Platzhalter gefuellt: eine ListItem-Adresse, die ins Leere zeigt, fuehrt
 * einen Crawler auf eine Seite, die es nicht gibt.
 *
 * @param {Array<{handle?: string, title?: string}>} knoten
 * @returns {Array<{url: string, name: string}>}
 */
export function produktEintraege(knoten) {
  return (knoten ?? [])
    .filter((p) => p?.handle && p?.title)
    .map((p) => ({
      url: `${CANONICAL_ORIGIN}/products/${p.handle}`,
      name: p.title,
    }));
}

/**
 * Der Seitenname ohne Marken-Suffix — für Brotkrume und schema.org-`name`.
 * „Impressum | Crystal Cacao®" -> „Impressum". Bleibt nach dem Abschneiden
 * nichts übrig, gewinnt der volle Titel.
 *
 * Bewusst dieselbe Bauform wie `kurzName()` in der Vorlage
 * (qiblanco-storefront app/lib/seiten-seo.js): ein Titel, der in <title>,
 * og:title und im Schema-`name` verschieden heißt, ist für Google nicht eine
 * Seite mit drei Namen, sondern eine Seite ohne Namen.
 *
 * @param {string|undefined|null} titel
 * @returns {string}
 */
export function kurzName(titel) {
  const roh = (titel || '').trim();
  if (!roh) return ABSENDER_MARKE;
  const marke = ABSENDER_MARKE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ohne = roh
    .replace(new RegExp(`\\s*[|–—-]\\s*${marke}\\s*$`), '')
    .replace(new RegExp(`^\\s*${marke}\\s*[|–—-]\\s*`), '')
    .trim();
  return ohne || roh;
}

/**
 * Open Graph, Twitter-Karte und strukturierte Daten EINER einfachen Textseite
 * dieses Ladens — Rechtstexte, Übersichten, Pflichtangaben.
 *
 * WARUM ES DIESE FUNKTION GIBT (Job 20260912-sieben-indexierbare-seiten-ohne-
 * sitemap-und-ohne-auszeichnung-prio22, jede Zahl am selben Tag am Kundenrand
 * gemessen): `kollektionSignale()` deckt die Kollektionsseite, `produkt-seo.js`
 * die Kaufseiten — für die GETEILTE Routenklasse (/policies, /policies/<handle>)
 * und die beiden Pflichtangaben-Routen gab es keinen Ort. Gemessen am
 * 2026-09-12: sieben indexierbare Seiten dieses Ladens trugen kein og:image und
 * keine strukturierten Daten, fünf keinen Canonical — und dieselben Pfade
 * trugen sie auf qiblanco.com EBENFALLS nicht. Es ist also keine crystal-Lücke,
 * sondern eine Lücke der geteilten Klasse in beiden Läden; der Fix-Ort ist
 * je Laden eine Funktion und ihre Aufrufer, nicht sieben Seiten.
 *
 * WARUM NICHT `kollektionSignale()` MITBENUTZT: deren Hauptknoten ist eine
 * `CollectionPage` mit `mainEntity` auf eine ItemList. Ein Rechtstext ist keine
 * Sammlung und hat keine Liste; ein CollectionPage-Knoten über einem
 * Widerrufstext ist eine falsche Aussage, nicht eine ungenaue.
 *
 * WAS SIE AUSDRÜCKLICH NICHT TUT: sie setzt weder <title> noch
 * `name=description` noch den Canonical. Die stehen in der jeweiligen Route und
 * folgen dort einer eigenen Begründung. Diese Funktion ist ADDITIV — sie hängt
 * an, was fehlt, und fasst nicht an, was steht.
 *
 * `markenGraph()` WIRD MITGELIEFERT, und das ist kein Beiwerk: der Hauptknoten
 * nennt `isPartOf` und `publisher` per `@id`. Genau diese beiden Anker fehlten
 * am 2026-09-12 in der ersten Fassung der Kollektionsseite IM DOKUMENT — ein
 * Konsument, der das Einzeldokument liest (so wertet Google), sah einen leeren
 * Verweis. Die doppelte Ausgabe desselben Knotens auf mehreren Seiten ist kein
 * Widerspruch: die `@id` macht sie zur EINEN Entität.
 *
 * @param {{pfad: string, titel?: string, beschreibung?: string|null}} args
 * @returns {Array<object>} meta-Descriptoren für react-router 7
 */
export function seitenSignale({pfad, titel, beschreibung}) {
  const url = absoluteCanonical(pfad);
  const name = kurzName(titel);
  const vollerTitel = (titel || '').trim() || `${name} | ${ABSENDER_MARKE}`;
  const text = (beschreibung || '').trim();

  const descriptoren = [
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: ABSENDER_MARKE},
    {property: 'og:locale', content: 'de_DE'},
    // Muss dem <title> der Route folgen, nicht einem eigenen Rohwert: sonst
    // zeigt ein geteilter Link etwas anderes als das Suchergebnis.
    {property: 'og:title', content: vollerTitel},
    {property: 'og:url', content: url},
    // Bild UND Twitter-Karte in einem Zug — die Karte ist vom Bild gedeckt,
    // siehe teilbildSignale().
    ...teilbildSignale(),
  ];
  if (text) descriptoren.push({property: 'og:description', content: text});

  const knoten = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    // Eigene @id mit Fragment, damit der Knoten neben der Brotkrume desselben
    // Dokuments eindeutig adressierbar bleibt.
    '@id': `${url}#webpage`,
    url,
    name,
    inLanguage: 'de-DE',
    isPartOf: {'@id': SITE_ID},
    publisher: {'@id': ORG_ID},
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: MARKEN_TEILBILD.url,
      width: MARKEN_TEILBILD.breite,
      height: MARKEN_TEILBILD.hoehe,
    },
  };
  if (text) knoten.description = text;
  descriptoren.push({'script:ld+json': knoten});
  descriptoren.push({'script:ld+json': brotkrume({url, name})});
  descriptoren.push({'script:ld+json': markenGraph()});
  return descriptoren;
}
