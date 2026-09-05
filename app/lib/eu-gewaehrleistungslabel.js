/**
 * Harmonisierte Mitteilung über das gesetzliche Gewaehrleistungsrecht
 * (Anhang I der Durchfuehrungsverordnung (EU) 2025/1960, anwendbar ab
 * 27.09.2026) -- Sprachaufloesung und Asset-Verzeichnis.
 *
 * Diese Datei ist bewusst PUR (kein React, kein Server-Zugriff): so ist die
 * Sprachlogik hermetisch testbar, ohne einen Renderer hochzufahren.
 *
 * ------------------------------------------------------------------
 * WOHER DIE URLS KOMMEN -- und warum sie hier trotzdem als Liste stehen
 * ------------------------------------------------------------------
 * Der Auftrag verlangt "per Storefront API einbinden statt fester URLs".
 * Gemessen am 2026-08-25: die 24 Dateien liegen unter Shopify ->
 * Einstellungen -> Dateien. Dateien AUS DIESEM BEREICH sind über die
 * Storefront API nicht adressierbar -- die Storefront API kennt Medien nur
 * als Anhaengsel von Produkten, Metaobjekten oder Metafeldern. Ein
 * Datei-Verzeichnis gibt es dort nicht; die Abfrage, mit der die Liste unten
 * erhoben wurde, ist die ADMIN-API (`files(query: "filename:...")`).
 *
 * Damit bleiben genau zwei Wege:
 *   (a) ein Shopify-Metaobjekt anlegen, das die 24 Dateien referenziert --
 *       dann kann die Storefront API sie ausliefern. Das ist eine AENDERUNG
 *       AM SHOPIFY-DATENMODELL (Schreibzugriff) und braucht eine Freigabe.
 *   (b) das Verzeichnis unten -- ERZEUGT, nicht abgetippt, aus der
 *       Live-Admin-API (`werkzeuge/manifest_bauen.py`).
 *
 * Gebaut ist (b), weil es ohne Schreibzugriff auskommt und keine handgetippte
 * URL enthält. Der Weg nach (a) ist damit nicht verbaut: nur diese eine
 * Konstante wechselt dann die Quelle, kein Aufrufer ändert sich.
 *
 * ------------------------------------------------------------------
 * BEFUND ZU DEN SPRACHFASSUNGEN (gemessen, nicht vermutet)
 * ------------------------------------------------------------------
 * Anhang I Nr. 3 verlangt, dass der QR-Code mit einem mobilen Standardgeraet
 * ablesbar ist. Die hochgeladenen Dateien sind JPEG (~1000-1285 px breit).
 * JPEG-Artefakte sitzen auf harten Schwarz-Weiss-Kanten -- also auf den
 * Modulen des QR-Codes. Maschinell gemessen (probe_overlay_qr_groesse.py,
 * mit Positiv- UND Negativ-Kontrolle, zwei unabhaengige Leser):
 *
 *   et, fi, sl, sv -> von KEINEM Leser dekodierbar
 *   da, el, pl     -> nur von einem der Leser, nicht von beiden
 *   uebrige 17     -> von beiden Lesern sauber
 *
 * DIE LISTEN SIND LESERABHAENGIG -- und das ist der eigentliche Befund.
 * Die Vormessung (Vorjob, andere Skalen und Aufbereitung) kam auf
 * `fi, sl, sv` hart und `lv` als Grenzfall; diese Messung kommt auf
 * `et, fi, sl, sv` hart und `da, el, pl` als Grenzfall -- `lv` schaffen hier
 * beide Leser, dafür faellt `et` neu durch. Wer daraus eine gepflegte
 * Ausnahmeliste macht, pflegt eine Eigenschaft seines Messgeraets.
 *
 * Der belastbare, geraeteunabhaengige Schluss ist deshalb NICHT "diese vier
 * Dateien tauschen", sondern: über beide Messungen zusammen sind 8 der 24
 * Dateien mindestens einmal durchgefallen (da, el, et, fi, lv, pl, sl, sv),
 * und welche genau, hängt vom Leser ab. Zu ersetzen
 * sind alle 24 -- die amtlichen PNG-Originale (1654x2339) dekodieren
 * ausnahmslos fehlerfrei. Der Schaden entsteht erst beim Verkleinern und
 * JPEG-Wandeln vor dem Upload, nicht in der Grafik der Kommission.
 *
 * WICHTIG FÜR DIE EINORDNUNG: eine groessere Darstellung im Overlay heilt
 * das NICHT. Was in der Quelldatei zerstört ist, bleibt bei jeder
 * Anzeigegroesse zerstört. Die Anzeigegroesse (siehe CSS) und die
 * Quelldatei-Qualitaet sind zwei getrennte Baustellen.
 */

/** ISO-639-1 der 24 EU-Amtssprachen. */
export const EU_SPRACHEN = [
  'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr', 'ga', 'hr',
  'hu', 'it', 'lt', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv',
];

/** Rueckfall, wenn die Seitensprache keine EU-Amtssprache ist. */
export const RUECKFALL_SPRACHE = 'en';

/**
 * Sprachfassungen, deren QR-Code von KEINEM der beiden Leser dekodiert wird.
 * Erzeugt von pruefungen/probe_overlay_qr_groesse.py am 2026-08-25.
 */
export const QR_DEFEKT = ['et', 'fi', 'sl', 'sv'];

/**
 * Sprachfassungen, die nur EIN Leser schafft. Sie stehen bewusst in einer
 * eigenen Liste statt bei QR_DEFEKT: "ein Leser schafft es" ist keine
 * Zusicherung, dass ein Telefon es schafft -- aber auch kein Beweis des
 * Gegenteils. Zusammen mit QR_DEFEKT sind es 7 von 24 Dateien.
 *
 * `lv` steht hier bewusst NICHT drin, obwohl der Vorjob es als Grenzfall
 * fuehrte: beide Leser dieser Messung kommen damit zurecht. Die Liste gibt
 * wieder, was probe_overlay_qr_groesse.py misst -- sonst wäre sie gegen
 * die Probe nicht pruefbar. Dass `lv` bei einem anderen Leser durchfaellt,
 * steht im Kopfkommentar, wo es hingehoert.
 */
export const QR_GRENZFALL = ['da', 'el', 'pl'];

/**
 * Kleinster gemessener Anteil des QR-Codes an der Bildbreite, über alle 24
 * Sprachfassungen (schmalster Fall: fr mit 18,24 %; breitester: pl mit
 * 20,23 %). Erhoben von pruefungen/probe_overlay_qr_groesse.py.
 *
 * Diese Zahl ist die Bruecke zwischen "wie breit rendert die Grafik" und
 * "wie groß ist der QR-Code dann". Ohne sie wäre die Mindestbreite in der
 * CSS eine gegriffene Zahl.
 */
export const QR_ANTEIL_DER_BILDBREITE_MIN = 0.1824;

/**
 * Untergrenze für die Kantenlaenge des QR-Codes auf dem Bildschirm.
 *
 * Quelle: "Practical guidelines for sellers and producers" (Europaeische
 * Kommission, GD Justiz und Verbraucher, April 2026), Abschnitt 3.1.2:
 * "The QR code should never be smaller than 2 x 2 cm."
 *
 * EHRLICH DAZU: dieser Satz steht dort im Kapitel über das GARAN-Label
 * (Anhang II). Für den QR-Code der MITTEILUNG nennen weder Verordnung noch
 * Leitlinien eine Zahl -- dort steht nur die Anforderung "scannable under
 * normal lighting conditions using a standard mobile device". Die 2 cm sind
 * hier bewusst uebertragen, weil eine gemessene Untergrenze besser ist als
 * gar keine. Wer eine belastbarere Zahl hat, ersetzt sie hier an EINER
 * Stelle -- CSS und Test rechnen mit.
 */
export const QR_MINDESTKANTE_MM = 20;

/** 1 CSS-Pixel = 1/96 Zoll. Für die Umrechnung Bildschirmgroesse <-> mm. */
export const MM_JE_CSS_PIXEL = 25.4 / 96;

/**
 * Asset-Verzeichnis. ERZEUGT von werkzeuge/manifest_bauen.py aus der
 * Shopify-Admin-API -- nicht von Hand pflegen.
 */
export const LABEL_ASSETS = {
  bg: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-bg.jpg?v=1787678040', breite: 1002, hoehe: 1338},
  cs: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-cs.jpg?v=1787678040', breite: 1212, hoehe: 1559},
  da: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-da.jpg?v=1787678040', breite: 1194, hoehe: 1539},
  de: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-de.jpg?v=1787678041', breite: 1219, hoehe: 1668},
  el: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-el.jpg?v=1787678039', breite: 1040, hoehe: 1477},
  en: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-en.jpg?v=1787678040', breite: 1186, hoehe: 1675},
  es: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-es.jpg?v=1787678040', breite: 1181, hoehe: 1561},
  et: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-et.jpg?v=1787678039', breite: 1184, hoehe: 1673},
  fi: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-fi.jpg?v=1787678040', breite: 1159, hoehe: 1562},
  fr: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-fr.jpg?v=1787678039', breite: 1162, hoehe: 1550},
  ga: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-ga.jpg?v=1787678040', breite: 1137, hoehe: 1518},
  hr: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-hr.jpg?v=1787678039', breite: 1186, hoehe: 1675},
  hu: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-hu.jpg?v=1787678040', breite: 1186, hoehe: 1671},
  it: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-it.jpg?v=1787678040', breite: 1197, hoehe: 1595},
  lt: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-lt.jpg?v=1787678039', breite: 1215, hoehe: 1472},
  lv: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-lv.jpg?v=1787678040', breite: 1160, hoehe: 1544},
  mt: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-mt.jpg?v=1787678039', breite: 1076, hoehe: 1434},
  nl: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-nl.jpg?v=1787678040', breite: 1157, hoehe: 1635},
  pl: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-pl.jpg?v=1787678040', breite: 1152, hoehe: 1623},
  pt: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-pt.jpg?v=1787678040', breite: 1259, hoehe: 1674},
  ro: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-ro.jpg?v=1787678040', breite: 1285, hoehe: 1516},
  sk: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-sk.jpg?v=1787678039', breite: 1215, hoehe: 1569},
  sl: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-sl.jpg?v=1787678040', breite: 1171, hoehe: 1658},
  sv: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/gewaehrleistungslabel-sv.jpg?v=1787678040', breite: 1255, hoehe: 1673},
};

/**
 * Seiten-Sprache -> Asset der passenden Sprachfassung.
 *
 * Bewusst tolerant in der EINGABE (die Hydrogen-i18n liefert 'DE', ein
 * Accept-Language-Kopf 'de-AT', ein Metafeld vielleicht 'de_DE') und streng
 * in der AUSGABE: es kommt immer ein gueltiges Asset zurück, nie undefined.
 *
 * @param {string|null|undefined} sprache z.B. 'DE', 'de-AT', 'fr_FR'
 * @returns {{iso: string, url: string, breite: number, hoehe: number,
 *            rueckfall: boolean, qrDefekt: boolean}}
 */
export function labelFuerSprache(sprache) {
  const iso = String(sprache ?? '')
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];

  const treffer = EU_SPRACHEN.includes(iso) && LABEL_ASSETS[iso] ? iso : RUECKFALL_SPRACHE;
  const asset = LABEL_ASSETS[treffer];

  return {
    iso: treffer,
    url: asset.url,
    breite: asset.breite,
    hoehe: asset.hoehe,
    rueckfall: treffer !== iso,
    qrDefekt: QR_DEFEKT.includes(treffer),
    rechteLink: rechteLinkFuerSprache(treffer),
  };
}

/**
 * Alt-Text. Die amtliche Grafik enthält NULL Textknoten -- saemtliche
 * Schrift ist zu Pfaden konvertiert, der QR-Code ist gezeichnet. Ohne alt
 * laese ein Screenreader von einer gesetzlich vorgeschriebenen
 * Verbraucherinformation exakt gar nichts (BFSG, gilt seit 28.06.2025).
 *
 * Der Text gibt den abgebildeten Wortlaut wieder, er formuliert ihn nicht neu.
 *
 * Seit die Grafik nur noch im Overlay steht, ist dieser Alt-Text der EINZIGE
 * maschinenlesbare Traeger des Mitteilungsinhalts. Er wiegt damit mehr als
 * vorher, nicht weniger.
 */
export const LABEL_ALT_DE =
  'Amtliche Mitteilung der Europäischen Union über das gesetzliche ' +
  'Gewährleistungsrecht. Für Waren, die in der Europäischen Union verkauft ' +
  'werden, gilt eine gesetzliche Gewährleistung der Vertragsmäßigkeit von ' +
  'mindestens zwei Jahren. Nach nationalem Recht kann ein längerer Zeitraum ' +
  'gelten; für gebrauchte Waren kann ein kürzerer Zeitraum gelten, jedoch ' +
  'nicht weniger als ein Jahr. Verbraucherinnen und Verbraucher können ihre ' +
  'Rechte geltend machen, wenn Waren nicht der Beschreibung entsprechen oder ' +
  'nicht bestimmungsgemäß funktionieren. Verkäufer haften für jede ' +
  'Vertragswidrigkeit, die zum Zeitpunkt der Lieferung bestand, und müssen ' +
  'kostenlose Nachbesserung oder Ersatzlieferung anbieten, in bestimmten ' +
  'Fällen eine Preisminderung oder die vollständige Erstattung des ' +
  'Kaufpreises. Melden Sie dem Verkäufer das Problem so bald wie möglich ' +
  'und legen Sie einen Kaufnachweis vor. Weitere Informationen im Portal ' +
  '„Ihr Europa".';

/**
 * Ziel des Textlinks unter der Grafik -- JE SPRACHFASSUNG.
 *
 * Die Leitlinien der Kommission (Abschnitt 2.3) verlangen: "A clickable link
 * to the same destination as the QR code should always be available."
 * DASSELBE Ziel wie der QR-Code -- und der QR-Code ist je Sprachfassung ein
 * anderer. Eine einzige Konstante kann diese Zusage baulich nicht halten.
 *
 * BEFUND, DER ZU DIESER TABELLE FUEHRTE (gemessen 2026-08-28, Job
 * 20260828-eulabel-rechte-link-nur-deutsch-für-alle-24-sprachen): hier stand
 * EINE hartcodierte deutsche URL für ALLE 24 Fassungen. Von 19 maschinell
 * lesbaren QR-Codes stimmte genau EINER mit ihr überein -- der deutsche.
 * Neben jeder anderen Sprachfassung zeigte der sichtbare Link woandershin als
 * der Code darüber.
 *
 * ERZEUGT, NICHT ABGETIPPT: werkzeuge/patch_bauen.py aus den dekodierten
 * QR-Codes der ausgelieferten Grafiken (messung-24-qr-ziele.json).
 *
 * WARUM NICHT EINE NEUTRALE URL FÜR ALLE: https://europa.eu/youreurope/
 * guarantees sieht sprachneutral aus, ist es aber nicht -- sie antwortet mit
 * einem harten 301 auf index_en.htm, unabhängig vom Accept-Language des
 * Browsers (gemessen mit de/en/fr). Sie für alle zu setzen hätte deutsche
 * Kunden -- heute die einzigen -- auf eine englische Seite geschickt und den
 * einen Fall verschlechtert, der bisher korrekt war.
 *
 * 'en' ist die einzige Fassung, deren QR nicht dem Muster index_<iso>.htm
 * folgt: ihre Amtsgrafik trägt die Kurzform. Das ist kein Fehler, sondern
 * gemessen -- und der Grund, warum diese Tabelle Werte statt einer Formel
 * enthält.
 */
export const RECHTE_LINKS = {
  bg: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_bg.htm',
  cs: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_cs.htm',
  da: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_da.htm',
  de: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_de.htm',
  el: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_el.htm',
  en: 'https://europa.eu/youreurope/guarantees',
  es: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_es.htm',
  et: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_et.htm',   // abgeleitet, QR nicht dekodierbar
  fi: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_fi.htm',   // abgeleitet, QR nicht dekodierbar
  fr: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_fr.htm',
  ga: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_ga.htm',
  hr: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_hr.htm',
  hu: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_hu.htm',
  it: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_it.htm',
  lt: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_lt.htm',
  lv: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_lv.htm',   // abgeleitet, QR nicht dekodierbar
  mt: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_mt.htm',
  nl: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_nl.htm',
  pl: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_pl.htm',
  pt: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_pt.htm',
  ro: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_ro.htm',
  sk: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_sk.htm',
  sl: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_sl.htm',   // abgeleitet, QR nicht dekodierbar
  sv: 'https://europa.eu/youreurope/citizens/consumers/shopping/guarantees-returns/index_sv.htm',   // abgeleitet, QR nicht dekodierbar
};

/**
 * Der deutsche Link. Bleibt als eigene Konstante bestehen: die
 * Bestellbestätigungs-Mail (eigener Vorgang) und der Test hängen daran, und
 * Deutsch ist die heute einzige ausgelieferte Fassung.
 */
export const RECHTE_LINK = RECHTE_LINKS.de;

/**
 * Link-Ziel für eine Sprachfassung. Streng in der AUSGABE wie
 * labelFuerSprache: es kommt immer eine gültige URL zurück, nie undefined.
 *
 * @param {string|null|undefined} iso ISO-639-1 der Fassung
 * @returns {string}
 */
export function rechteLinkFuerSprache(iso) {
  return RECHTE_LINKS[iso] ?? RECHTE_LINKS[RUECKFALL_SPRACHE];
}

/** Beschriftung desselben Links. */
export const RECHTE_LINK_TEXT =
  'Weitere Informationen zu Ihren Rechten: europa.eu/youreurope/garantien';
