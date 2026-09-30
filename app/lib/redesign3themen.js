/**
 * Zentrales Daten-Modul fuer das Redesign „Drei Themen" (Konzept B7).
 *
 * ALLE Texte, Beweis-Zahlen, Links und Asset-Pfade der neuen Redesign-Sektionen
 * (Hero3Themen, ThemenAkkordeon, PodcastStimmen, ProduktTrio, DreiThemenBand)
 * leben hier — eine einzige Quelle. Die Komponenten sind reine Praesentation.
 *
 * Claim-Disziplin (Konzept B2): Beweis-Zahlen stammen AUSSCHLIESSLICH aus dem
 * Bestand (TieferSchlaf.jsx + PeerReviewStudies in HomepageSections.jsx) — hier
 * wird NICHTS Neues erfunden. Zellstudien-Zahlen tragen ein erkennbares
 * in-vitro-/Zellstudien-Label im umgebenden Text.
 *
 * Bilder: seit DESIGN v2 (2026-07-12) ausschliesslich ECHTE Shooting-Fotos
 * vom Shopify-CDN (Christian-Regel: echte statt offensichtlicher KI-Bilder;
 * Bild-Ehrlichkeits-Lehre homepage-bauer D-013). Keine Repo-Binaries noetig.
 */

/** Hero-Dreizeiler (Konzept B2, Empfehlung E1) — drei einzelne Zeilen. */
export const DREIZEILER = [
  'Tiefer schlafen.',
  'Geschützt vor E-Smog.',
  'Auf Zellebene jung bleiben.',
];

/** Mechanismus-Subline unter dem Dreizeiler (Nordstern-Ton, 1 Satz). */
export const SUBLINE =
  'Dein Körper besteht zu über 70 % aus Wasser. Qi Blanco bringt es in kohärente Ordnung — in Zellstudien gemessen, von 14.000+ Trägern erlebt.';

/**
 * Hero-Daten fuer Hero3Themen.
 * `bild` ist ein J4-Platzhalter. `trustRow` enthaelt NUR belegte Fakten —
 * keine erfundenen Zahlen/Ratings.
 */
export const HERO = {
  bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/QiOne2Pro_mit-Siegel_2a003117-6b48-42ea-be23-c237a78215db.webp?v=1673788196',
  bildAlt: 'QiOne® 2 Pro — kohärentes Wasser auf Zellebene',
  cta: {label: 'Jetzt QiOne® 2 Pro entdecken', link: '/products/qione-2-pro'},
  trustRow: ['14.000+ Träger', 'Made in Germany', '20 Tage risikofrei testen'],
};

/**
 * Die drei Kern-Themen (Konzept B2).
 * `beweisZahl` + `beweisLabel` sind aus dem Bestand belegt; `mechanismusText`
 * erklaert in genau zwei Saetzen den Wirkmechanismus (Nordstern-Ton).
 * `bild` ist je Thema ein J4-Platzhalter.
 */
export const THEMEN = [
  {
    id: 'schlaf',
    titel: 'Tiefer Schlaf',
    kurz: 'Endlich erholt aufwachen',
    beweisZahl: '~20 %',
    beweisLabel: 'nennen tieferen Schlaf als häufigstes Erlebnis (171 Berichte)',
    mechanismusText:
      'Kohärentes Wasser hilft dem Nervensystem, den nächtlichen Daueralarm zu verlassen und leichter herunterzufahren. In einer Auswertung von 171 Erfahrungsberichten war ruhigerer, tieferer Schlaf das mit Abstand häufigste Thema.',
    link: '/pages/tiefer-schlaf',
    // ECHTES Shooting-Foto (Shopify-CDN) — Christian-Regel 2026-07-11:
    // echte statt offensichtlicher KI-Bilder (Bild-Ehrlichkeits-Lehre D-013)
    bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2023-03-01-qiblanco-milva-martin-1020791_1_0f03ee06-6ad1-4997-9182-3685335eb04c.webp?v=1738063344',
    alt: 'Paar liegt entspannt im Bett — zur Ruhe kommen',
  },
  {
    id: 'esmog',
    titel: 'E-Smog-Schutz',
    kurz: 'Gelassen im Funk-Alltag',
    beweisZahl: '87,1 %',
    beweisLabel: 'geringere Zellschädigung durch EM-Strahlung (Zellstudie, in vitro)',
    mechanismusText:
      'Die kohärente Grenzschicht am Wasser puffert eingestrahlten E-Smog ab und stabilisiert die Zellmembran. In Zellstudien (in vitro) zeigte sich unter Mobilfunk-Stress eine bis zu zehnfach bessere Zell-Barrierefunktion.',
    link: '/products/qione-2-pro',
    // ECHTES Shooting-Foto (Laptop-Arbeit = Funk-Alltag). Dasselbe Motiv und
    // derselbe Ausschnitt wie das frühere 2024-06-qiblanco-bali-05984.webp,
    // neu aus dem Original (bildmaterial/bali-couple-2024/raw, 4000x6000)
    // geschnitten: der alte Master hatte nur 940 px und war in der
    // Einspalten-Kachel (<=767px, 4:3 cover) auf dpr 2 hochskaliert — Gate 12
    // bild-aufloesung. Neuer Master 2400 px (Job
    // 20260923-formate-schuld-schlaf-zellen-schutz-bilder-und-pixelsoll).
    bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-themen--themen-esmog-laptop-bali-05984--f786b6fa5b29.webp?v=1790161971',
    alt: 'Frau arbeitet am Laptop — Alltag zwischen WLAN und Bildschirm',
  },
  {
    id: 'zellen',
    titel: 'Zellgesundheit & Langlebigkeit',
    kurz: 'Länger jung bleiben',
    beweisZahl: '75,0 %',
    beweisLabel: 'weniger oxidativer Zellstress (Zellstudie, in vitro)',
    mechanismusText:
      'Oxidativer Stress gilt als anerkannter Treiber der Zellalterung — kohärentes Wasser senkt ihn an den Zellgrenzflächen. In peer-review-kontrollierten Zellstudien (in vitro) sank die Zellbelastung durch oxidativen Stress um 75,0 %.',
    link: '/pages/zell-schutz',
    // ECHTES Shooting-Foto (Canggu 2025, draußen im Grünen, QiBracelet am
    // Handgelenk, grüner Saft — Frische/Vitalität). Ersetzt am 2026-09-23
    // 2023-06-qiblanco-kitzbuehel-10.webp: dessen Master hat nur 668 px, ein
    // größeres Original existiert weder in Shopify Files noch in
    // bildmaterial/ — das Bild war auf jedem Retina-Gerät hochskaliert
    // (Gate 12 bild-aufloesung). Neuer Master 2400 px aus
    // bildmaterial/qione-qibracelet-2025/raw/2025-05-qiblanco-canggu-06390.jpg.
    bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-themen--themen-zellen-qibracelet-gruensaft-canggu-06390--b4ab3f9b62c8.webp?v=1790161977',
    alt: 'Hand mit QiBracelet hält ein Glas grünen Saft, draußen im Grünen',
  },
];

/**
 * Podcast-Snippets „Christian im Gespräch" (Geldhelden EP01).
 *
 * Medien-Hosting-Standard GL-PRO-0015: Video-Binaries gehören aufs
 * Shopify-CDN (Shopify Files), NICHT ins Repo — dieser Branch traegt darum
 * bewusst KEIN mp4 (nur das Poster ≤ 500 KB). SHOPIFY_CDN traegt die
 * CDN-URLs; solange `video` null ist (Upload wartet auf die
 * write_files-Scope-Freigabe, medien-hosting/bin/finalize-podcast-clips),
 * rendert PodcastStimmen fail-soft eine Zitat-Karte mit echtem Standbild
 * statt eines toten Players.
 *
 * CONTENT-MATCH (Christian-Regel 2026-07-11): `titel` und `zitat` sind
 * wortlaut-belegt aus dem Snippet-Transkript (video-snippets/manifest.json,
 * Geldhelden EP01, t=817.9–836.1 s) — keine erfundenen Themen.
 */
const SHOPIFY_CDN = {
  'podcast-schlaf': {video: null, poster: null},
  'podcast-esmog': {video: null, poster: null},
  'podcast-wasser': {video: null, poster: null},
};

/** CDN-URL wenn vorhanden, sonst Fallback (null = Datei bewusst nicht im Repo). */
const cdnOderPublic = (id, art, fallback) => SHOPIFY_CDN[id]?.[art] ?? fallback;

export const VIDEOS = [
  {
    id: 'podcast-schlaf',
    src: cdnOderPublic('podcast-schlaf', 'video', null),
    poster: cdnOderPublic('podcast-schlaf', 'poster', '/videos/podcast/podcast-schlaf.jpg'),
    thema: 'schlaf',
    titel: 'Das Kopfkissen-Experiment: Handy und Schlaf',
    zitat:
      'Das schönste Praxisbeispiel: eingeschaltetes Handy unters Kopfkissen legen — und dann gucken, schläft man besser oder schlechter.',
    quelle: 'Christian Bauer im Geldhelden-Podcast (EP 01)',
  },
  {
    id: 'podcast-esmog',
    src: cdnOderPublic('podcast-esmog', 'video', null),
    poster: cdnOderPublic('podcast-esmog', 'poster', null),
    thema: 'esmog',
    titel: 'Was E-Smog in den Zellen auslöst',
    zitat:
      'Es ist klar, dass dieser E-Smog, vereinfacht gesagt, auch immer oxidativen Stress in den Zellen erzeugt.',
    quelle: 'Christian Bauer im Geldhelden-Podcast (EP 01)',
  },
  {
    id: 'podcast-wasser',
    src: cdnOderPublic('podcast-wasser', 'video', null),
    poster: cdnOderPublic('podcast-wasser', 'poster', null),
    thema: 'zellen',
    titel: 'Kohärentes Wasser: der Bindungswinkel, einfach erklärt',
    zitat: '',
    quelle: 'Christian Bauer im Geldhelden-Podcast (EP 01)',
  },
];

/** Ueberschrift des Produkt-Trio-Closers. */
export const PRODUKT_TRIO_TITEL = 'Drei Wege, kohärentes Wasser zu erleben';

/**
 * Produkt-Trio-Closer (Konzept B3, Pos 24).
 * `bild` sind bestehende Shopify-CDN-URLs aus dem Bestand (HomepageSections
 * FeaturedProduct / TieferSchlaf) — bewusst wiederverwendet (kein neues Asset).
 * QiOne 2 Pro sitzt in der Mitte und traegt das Bestseller-Badge.
 */
export const PRODUKT_TRIO = [
  {
    id: 'qibracelet',
    handle: 'qibracelet',
    title: 'QiBracelet®',
    tagline: 'Eleganz und Schutz — dein Support für unterwegs.',
    bild:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/01_2048px-Alpha_1.webp?v=1667284638',
    alt: 'QiBracelet®',
    bestseller: false,
  },
  {
    id: 'qione-2-pro',
    handle: 'qione-2-pro',
    title: 'QiOne® 2 Pro',
    tagline: 'Kompakt, innovativ, stark — dein Begleiter Tag und Nacht.',
    bild:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qiblanco-com-qione-2-pro-transparent_1.webp?v=1666591476',
    alt: 'QiOne® 2 Pro',
    bestseller: true,
  },
  {
    id: 'qihome-air',
    handle: 'qihome-air',
    title: 'QiHome® Air',
    tagline: 'Kohärentes Wasser für dein ganzes Zuhause.',
    bild:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/QiHomeAir-Front-Alpha-Web2_1024x1024_741c3ad5-b5f7-49bf-89d4-c9b4a961545b.webp?v=1669000329',
    alt: 'QiHome® Air',
    bestseller: false,
  },
];
