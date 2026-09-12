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

/* ====================================================================
 * DER AUSLOESER AUF DER KAUFFLAECHE (Elina EL-20260908-d8349a01)
 * ====================================================================
 *
 * Bestellt ist eine reine DARSTELLUNGS-Aenderung des Ausloesers auf der
 * Produktseite: links ein Zeichen, rechts daneben der Link. Die Mitteilung
 * selbst, ihr Weg (erster Klick) und ihr Overlay bleiben unberuehrt.
 *
 * WARUM DIE BESCHRIFTUNGEN HIER STEHEN UND NICHT IM JSX: sie sind seit dem
 * 2026-09-08 wieder VERSCHIEDEN (Produktseite lang, Footer kurz -- der
 * Footer bleibt auf Anweisung unveraendert). Zwei Literale im JSX wären
 * genau die Sorte Dublette, die beim nächsten Textwunsch zur Haelfte
 * nachgezogen wird; als benannte Konstanten kann der Test beide Flaechen
 * gegeneinander prüfen.
 */

/** Produktseite. Ersetzt den frueheren Linktext 'Gesetzliche Gewährleistung'. */
export const AUSLOESER_TEXT_PDP = 'Garantierte gesetzliche Gewährleistung';

/** Footer, Punkt 4. Bleibt ausdrücklich wie er war. */
export const AUSLOESER_TEXT_FOOTER = 'Gesetzliche Gewährleistung';

/**
 * Das Zeichen links neben dem Link auf der Produktseite.
 *
 * DAS IST NICHT DIE AMTLICHE GRAFIK -- und diese Unterscheidung ist der
 * ganze Grund, warum es hier eine EIGENE Konstante gibt statt eines
 * Rueckgriffs auf LABEL_ASSETS. Das Zeichen ist ein Schild mit
 * EU-Sternenkranz und weissem G: es trägt KEINEN QR-Code, KEINEN
 * Verordnungstext und keine einzige Zusage. Es ist Schmuck neben einem
 * Link, der genau dasselbe sagt.
 *
 * Daraus folgt dreierlei, und alle drei Punkte bewacht
 * test/eu-gewaehrleistung.test.mjs:
 *   1. alt="" -- ein Screenreader liest den Linktext daneben, nicht zweimal
 *      dieselbe Sache. Ein beschreibender alt-Text wäre hier keine
 *      Barrierefreiheit, sondern Laerm.
 *   2. Die AUFLOESUNG trägt hier NICHTS. Anders als bei der amtlichen
 *      Grafik (siehe LABEL_MINDESTBREITE_PX) darf dieses Bild über
 *      `&width=` klein gerechnet werden -- es geht über die
 *      Hausleiter `bildQuellen`, wie jedes andere Schmuckbild des Shops.
 *   3. Es darf NIE gegen ein LABEL_ASSETS-Bild getauscht werden. Damit
 *      stuende die amtliche Mitteilung wieder offen im Seitenfluss -- genau
 *      die Abweichung, die am 2026-08-25 kassiert wurde.
 *
 * Masse gemessen an der hochgeladenen Datei (Shopify-Admin-API, 2026-09-08):
 * 240 x 251 px, 14 020 B. `anzeigeBreite` ist die Flaeche in der CSS
 * (.eu-gwl__zeichen) -- beide Zahlen stehen absichtlich beieinander, damit
 * die Leiter nicht an der Gestaltung vorbeirechnet.
 */
export const AUSLOESER_ZEICHEN = {
  url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/WhatsApp_Image_2026-09-08_at_21.27.22.jpg?v=1788895741',
  breite: 240,
  hoehe: 251,
  anzeigeBreite: 36,
};

/* ==================================================================== */
/* UNSERE EIGENEN WORTE VOR DER AMTLICHEN MITTEILUNG                    */
/* ==================================================================== */

/**
 * Anlass (Christian am 2026-09-12, mit Bildschirmfoto des Dialogs):
 * "dieses Pop-up wirkt sehr befremdlich und nicht nett. Hier wuensche ich
 * mir ein Statement von uns, dass wir dem folgen und Teil davon sind, und
 * was der Kunde davon hat."
 *
 * --------------------------------------------------------------------
 * WAS DIE RECHERCHE ERGEBEN HAT -- und warum der Text DAVOR steht und die
 * Grafik NICHT ersetzt
 * --------------------------------------------------------------------
 * Die harmonisierte Mitteilung selbst ist verbindlich vorgegeben.
 * Durchfuehrungsverordnung (EU) 2025/1960 der Kommission vom 25.09.2025,
 * Artikel 1 woertlich: "Die Gestaltung und der Inhalt der harmonisierten
 * Mitteilung nach Artikel 22a Absatz 1 der Richtlinie 2011/83/EU
 * entsprechen den Angaben in Anhang I dieser Verordnung." Rechtsgrundlage
 * ist Art. 22a Abs. 2 und 4 RL 2011/83/EU, eingefuegt durch die
 * EmpCo-Richtlinie (EU) 2024/825. Anwendbar ab 27.09.2026 (Artikel 3).
 *
 * EINE EIGENE FORMULIERUNG ALS ERSATZ IST DAMIT NICHT ZULAESSIG. Die
 * Verordnung regelt aber NUR die Mitteilung selbst und sagt
 * nichts über begleitenden Text. Zusaetzliche eigene Erklaerungen sind
 * nicht verboten -- die Fundstellen und die Abwaegung stehen im RESULT des
 * Jobs 20260912-BAU-gewaehrleistung-in-eigenen-worten-statt-amtsblatt-als-bild.
 *
 * Gebaut ist deshalb genau die Form, die Christian beschrieben hat: unsere
 * Erklaerung zuerst, die amtliche Grafik unveraendert dahinter und mit
 * eigener Ueberschrift als fremde Rede ausgewiesen. Nichts daran ersetzt
 * die Mitteilung, nichts kuerzt sie ab.
 *
 * --------------------------------------------------------------------
 * DIE GRENZE, DIE DEN TEXT TRÄGT: ANHANG I NR. 10 DER UGP-RICHTLINIE
 * --------------------------------------------------------------------
 * Nr. 10 des Anhangs I der RL 2005/29/EG (in Deutschland über
 * Par. 3 Abs. 3 UWG) verbietet PER SE, "Rechte, die dem Verbraucher
 * gesetzlich zustehen, als Besonderheit des Angebots des Gewerbetreibenden
 * darzustellen" -- Werbung mit Selbstverstaendlichkeiten, schwarze Liste,
 * ohne Spuerbarkeitsschwelle.
 *
 * Der Text sagt deshalb im zweiten Satz, dass dieses Recht KRAFT GESETZES
 * bei jedem Haendler in der EU gilt. Was wir als UNSERES ausweisen duerfen,
 * ist allein die Art, wie wir damit umgehen (kein Formular, Bestellnummer
 * genügt) -- nicht die Frist und nicht die Abhilfen. Wer diesen Text
 * aendert, prueft jeden neuen Satz gegen genau diese Grenze.
 *
 * --------------------------------------------------------------------
 * WARUM JE SPRACHE UND NICHT EINE KONSTANTE
 * --------------------------------------------------------------------
 * Die Mitteilung gibt es in 24 Amtssprachen. Unsere eigenen Worte gibt es
 * heute in zwei. Eine Sprache ohne Eintrag bekommt KEINEN Ersatztext und
 * KEINE maschinelle Uebersetzung, sondern nur die amtliche Grafik -- also
 * genau den Zustand vor diesem Bau. Das ist rechtlich vollstaendig (die
 * Pflicht hängt an der Mitteilung, nicht an unserem Zusatz) und ehrlich:
 * ein unuebersetzter deutscher Absatz vor einem griechischen Amtsblatt
 * wäre schlechter als gar keiner.
 *
 * HEUTIGE REICHWEITE, gemessen: `app/lib/context.js` verdrahtet
 * `i18n.language` fest auf 'DE'; es gibt keine Sprach-Routen und keinen
 * Sprachumschalter. Ausgeliefert wird deshalb ausschließlich 'de'. Der
 * englische Eintrag ist der Rueckfall (RUECKFALL_SPRACHE) und wird erst
 * sichtbar, wenn eine zweite Sprache dazukommt.
 */
export const EIGENE_WORTE = {
  de: {
    titel: 'Deine gesetzliche Gewährleistung',
    absaetze: [
      'In Europa gilt für jede Ware, die du kaufst, eine gesetzliche ' +
        'Gewährleistung von mindestens zwei Jahren. Dieses Recht hast du ' +
        'kraft Gesetzes, bei jedem Händler in der EU. Wir stehen dahinter.',
      'Wenn dein Stück nicht das ist, was zugesagt war, oder nicht so ' +
        'funktioniert, wie es soll, wende dich an uns. Du bekommst ' +
        'kostenlos Nachbesserung oder Ersatz, und wenn das nicht trägt, ' +
        'eine Preisminderung oder die volle Erstattung des Kaufpreises. ' +
        'Maßgeblich ist, ob der Mangel schon bei der Lieferung vorlag.',
      'Schreib uns, sobald dir etwas auffällt, und leg deinen Kaufnachweis ' +
        'dazu. Deine Bestellnummer genügt, ein Formular gibt es nicht. Du ' +
        'erreichst uns unter info@qiblanco.com. Kosten entstehen dir dabei ' +
        'keine.',
      'In manchen EU-Ländern ist die Frist länger als zwei Jahre. Dann ' +
        'gilt die längere.',
    ],
    amtstitel: 'Die amtliche Mitteilung der Europäischen Union',
  },
  en: {
    titel: 'Your legal guarantee',
    absaetze: [
      'In the European Union, every product you buy comes with a legal ' +
        'guarantee of at least two years. This right is granted by law and ' +
        'applies to every seller in the EU. We stand behind it.',
      'If your piece is not what was described, or does not work the way ' +
        'it should, get in touch with us. You are entitled to free repair ' +
        'or replacement, and where that does not settle it, to a price ' +
        'reduction or a full refund. What matters is whether the fault was ' +
        'already there on delivery.',
      'Write to us as soon as you notice something, and include your proof ' +
        'of purchase. Your order number is enough, and there is no form to ' +
        'fill in. You can reach us at info@qiblanco.com. This costs you ' +
        'nothing.',
      'In some EU countries the period is longer than two years. Where that ' +
        'is the case, the longer period applies.',
    ],
    amtstitel: 'The official notice of the European Union',
  },
};

/**
 * Unsere eigenen Worte zur Sprachfassung -- oder `null`.
 *
 * `null` ist ein ZULAESSIGES Ergebnis und kein Fehler: der Dialog zeigt dann
 * allein die amtliche Mitteilung. Es wird ausdrücklich NICHT auf Englisch
 * zurueckgefallen, wie es `labelFuerSprache` für die Grafik tut -- ein
 * englischer Absatz vor einem polnischen Amtsblatt hilft niemandem, waehrend
 * die englische GRAFIK dort die Pflicht weiter erfuellt.
 *
 * @param {string|null|undefined} iso ISO-639-1 der Fassung
 * @returns {{titel: string, absaetze: string[], amtstitel: string}|null}
 */
export function eigeneWorteFuerSprache(iso) {
  const k = String(iso ?? '').trim().toLowerCase();
  return EIGENE_WORTE[k] ?? null;
}
