/**
 * kakao-belege — die Prüfdokumente zu Crystal Cacao, die der Kunde öffnen darf.
 *
 * NICHT VON HAND GEPFLEGT UND NICHT DIE QUELLE DER WAHRHEIT. Der SSoT ist der
 * kuratierte Zeugnis-Vertrag des qi-salesbot:
 *   /srv/openclaw/shared-state/qi-salesbot/data/zeugnis-vertrag.json
 * Diese Datei ist eine Ableitung daraus, erzeugt am 2026-09-08 von Job
 * 20260908-BAU-crystal-cacao-sofortfehler-und-startseite-als-verkaufsauftritt,
 * erweitert am 2026-09-10 von Job 20260910-BAU-pruefdokumente-sortenrein-
 * create-vor-awake-je-drei-und-zwei-mineralstoff-analysen-fehlen.
 * Die Naht zwischen beiden wird gemessen, nicht zugesagt:
 *   crystal-cacao-node/proben/probe_belege_abrufbar.py  (ARM D/E)
 * Arm E lädt jede verlinkte Datei wirklich und rechnet ihren sha256 nach —
 * ein Vergleich Render gegen Quelldatei könnte einen falschen Beleg baulich
 * nie finden, weil er die Quelle mit ändert.
 *
 * ================= WARUM HIER KEINE FERTIGE ANZEIGE-ZEILE MEHR STEHT =========
 * Bis zum 2026-09-10 trug jeder Eintrag ein Feld `unterzeile` — einen fertigen
 * Satz aus Labor, Datum, Nummer und Dateiformat. Die Anzeige hängte an diesen
 * Satz zusätzlich die Sprache an. Bei einem der vier Dokumente stand die
 * Sprache schon IM Satz, und der Kunde las auf crystal-cacao.com:
 *     „PDF, englisch · englisch"
 * Der Fehler war NICHT in der Anzeige. Er war in der Form der Daten: wer aus
 * einer fremden fertigen Anzeigezeile eine eigene ableitet, kann baulich nicht
 * wissen, was darin schon gesagt wurde — und beim nächsten Dokument wäre es
 * wiedergekommen. Deshalb tragen die Einträge hier jetzt EINZELFELDER, und die
 * Anzeige setzt ihre Zeile selbst zusammen (`Belege.jsx`, `dateiZeile`). Es
 * gibt genau eine Stelle, an der Format und Sprache zu Text werden.
 * Die `unterzeile` des Vertrags bleibt davon unberührt: sie ist die Anzeige-
 * Zeile des CHATS und wird hier nicht mehr gelesen.
 *
 * DREI ABGRENZUNGEN, DIE WÖRTLICH AUS DEM VERTRAG STAMMEN UND KUNDENSICHTBAR SIND:
 *  - Primoris prüft SCHADSTOFFE an der ROHBOHNE.
 *  - Dartsch misst NÄHRSTOFFE der fertigen Mischung und enthält KEINEN
 *    Schadstoffwert.
 *  - Die Mineralstoff-Analysen (Messung SAS hagmann, Zusammenfassung Dartsch)
 *    messen Mineralstoffe und Spurenelemente der fertigen Mischung — ebenfalls
 *    OHNE Schadstoffwert. Sie heißen deshalb nicht „vollständige Analyse":
 *    die kritischen Substanzen sind dort auf unsere eigene Bitte weggelassen.
 * Alle sechs »Prüfzeugnisse« zu nennen wäre eine Falschbezeichnung.
 * Es steht hier KEIN Grenzwert und KEINE Aktualitätszusage: die Dokumente sind
 * von August 2025 bis März 2026, und jede Zeile trägt ihr Datum, damit der
 * Leser selbst urteilt.
 */

export const KAKAO_BELEGE = [
  {
    id: "primoris-amazonas-nativo-2025-08-19",
    art: "schadstoff-pruefzeugnis",
    titel: "Schadstoff-Prüfzeugnis · Amazonas Nativo",
    geprueft: "Schadstoffe an der rohen Bohne",
    labor: "Primoris Belgium",
    datum: "19.08.2025",
    kennung: "Zertifikat 25/049940",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-amazonas-nativo-2025-08-19.pdf?v=1788373357",
    produktKeys: ["crystal-cacao-create"],
    format: "PDF",
    sprache: "en",
    seiten: 9,
    bytes: 5246694,
  },
  {
    id: "dartsch-create-2025-10-27",
    art: "naehrstoff-analyse",
    titel: "Nährstoff-Analyse · Crystal Cacao Create",
    geprueft: "Nährstoffe der fertigen Mischung",
    labor: "Dartsch Scientific",
    datum: "27.10.2025",
    kennung: "Analyse DARTSCH/21/10/25",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-create-2025-10-27.pdf?v=1788373349",
    produktKeys: ["crystal-cacao-create"],
    format: "PDF",
    sprache: "de",
    seiten: 1,
    bytes: 342391,
  },
  {
    id: "dartsch-mineralstoffe-create-2026-03-12",
    art: "mineralstoff-analyse",
    titel: "Mineralstoff-Analyse · Crystal Cacao Create",
    geprueft: "Mineralstoffe und Spurenelemente (ICP-MS)",
    labor: "SAS hagmann (Messung), Dartsch Scientific (Bericht)",
    datum: "12.03.2026",
    kennung: "Bericht 202510143565-engl.-E",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-create-2026-03-12.pdf?v=1789034532",
    produktKeys: ["crystal-cacao-create"],
    format: "PDF",
    sprache: "en",
    seiten: 3,
    bytes: 454225,
  },
  {
    id: "primoris-piura-blanco-2025-08-21",
    art: "schadstoff-pruefzeugnis",
    titel: "Schadstoff-Prüfzeugnis · Piura Blanco",
    geprueft: "Schadstoffe an der rohen Bohne",
    labor: "Primoris Belgium",
    datum: "21.08.2025",
    kennung: "Zertifikat 25/049938",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-piura-blanco-2025-08-21.pdf?v=1788373365",
    produktKeys: ["crystal-cacao-awake"],
    format: "PDF",
    sprache: "en",
    seiten: 9,
    bytes: 5248993,
  },
  {
    id: "dartsch-awake-2025-11-04",
    art: "naehrstoff-analyse",
    titel: "Nährstoff-Analyse · Crystal Cacao Awake",
    geprueft: "Nährstoffe der fertigen Mischung",
    labor: "Dartsch Scientific",
    datum: "04.11.2025",
    kennung: "Analyse DARTSCH/04/11/25",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-awake-2025-11-04.pdf?v=1788373343",
    produktKeys: ["crystal-cacao-awake"],
    format: "PDF",
    sprache: "en",
    seiten: 1,
    bytes: 325578,
  },
  {
    id: "dartsch-mineralstoffe-awake-2026-03-24",
    art: "mineralstoff-analyse",
    titel: "Mineralstoff-Analyse · Crystal Cacao Awake",
    geprueft: "Mineralstoffe und Spurenelemente (ICP-MS)",
    labor: "SAS hagmann (Messung), Dartsch Scientific (Bericht)",
    datum: "24.03.2026",
    kennung: "Bericht 202511123716 engl.",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-awake-2026-03-24.pdf?v=1789034539",
    produktKeys: ["crystal-cacao-awake"],
    format: "PDF",
    sprache: "en",
    seiten: 3,
    bytes: 747053,
  },
];

/**
 * DIE SORTEN-REIHENFOLGE, und sie ist eine Entscheidung, keine Sortierung.
 *
 * Christian am 2026-09-10: „zuerst CREATE und dann AWAKE, mit dann jeweils
 * drei Prüfzeugnissen". Deshalb steht sie hier als Liste und nicht als
 * `sort()` über einen Namen — eine alphabetische Sortierung ergäbe Awake
 * zuerst und sähe wie dieselbe Absicht aus.
 *
 * Der `key` ist der Produkt-Handle. Kommt eine dritte Sorte, gehört sie hier
 * hinein; ein Beleg, dessen `produktKeys` auf keine Sorte dieser Liste zeigt,
 * fällt sonst still aus der Anzeige. Genau davor schützt `belegeNachSorte`:
 * es meldet solche Belege in der Gruppe `rest`, statt sie zu verschlucken.
 */
export const KAKAO_SORTEN = [
  {key: "crystal-cacao-create", titel: "Crystal Cacao® Create", akzent: "create"},
  {key: "crystal-cacao-awake", titel: "Crystal Cacao® Awake", akzent: "awake"},
];

/** Die Belege einer Sorte, in der Reihenfolge der Liste oben. */
export function belegeFuer(produktKey) {
  return KAKAO_BELEGE.filter((b) => b.produktKeys.includes(produktKey));
}

/**
 * Die Belege nach Sorte gruppiert, Create vor Awake.
 *
 * `nurSorte` (Produkt-Handle) grenzt auf eine Sorte ein — das ist der Fall der
 * beiden Kaufseiten. Ohne Angabe kommen alle Gruppen (Übersichts-/Startseite).
 *
 * KEIN BELEG DARF UNTERWEGS VERSCHWINDEN. Ein Beleg ohne passende Sorte wäre
 * sonst unsichtbar, und eine Anzeige, die weniger zeigt als der Vertrag führt,
 * ist von einer vollständigen nicht zu unterscheiden. Er landet deshalb in
 * einer eigenen Gruppe `rest` mit sichtbarem Titel.
 */
export function belegeNachSorte(nurSorte = null) {
  const sorten = nurSorte
    ? KAKAO_SORTEN.filter((s) => s.key === nurSorte)
    : KAKAO_SORTEN;
  const gruppen = sorten
    .map((s) => ({
      key: s.key,
      titel: s.titel,
      akzent: s.akzent,
      belege: belegeFuer(s.key),
    }))
    .filter((g) => g.belege.length > 0);

  if (!nurSorte) {
    const zugeordnet = new Set(gruppen.flatMap((g) => g.belege.map((b) => b.id)));
    const rest = KAKAO_BELEGE.filter((b) => !zugeordnet.has(b.id));
    if (rest.length > 0) {
      gruppen.push({
        key: "rest",
        titel: "Weitere Prüfdokumente",
        akzent: null,
        belege: rest,
      });
    }
  }
  return gruppen;
}
