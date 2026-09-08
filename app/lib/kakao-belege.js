/**
 * kakao-belege — die Prüfdokumente zu Crystal Cacao, die der Kunde öffnen darf.
 *
 * NICHT VON HAND GEPFLEGT UND NICHT DIE QUELLE DER WAHRHEIT. Der SSoT ist der
 * kuratierte Zeugnis-Vertrag des qi-salesbot:
 *   /srv/openclaw/shared-state/qi-salesbot/data/zeugnis-vertrag.json
 * Diese Datei ist eine Ableitung daraus, erzeugt am 2026-09-08 von Job
 * 20260908-BAU-crystal-cacao-sofortfehler-und-startseite-als-verkaufsauftritt.
 * Die Naht zwischen beiden wird gemessen, nicht zugesagt:
 *   crystal-cacao-node/proben/probe_belege_abrufbar.py  (ARM D/E)
 * Arm E lädt jede verlinkte Datei wirklich und rechnet ihren sha256 nach —
 * ein Vergleich Render gegen Quelldatei könnte einen falschen Beleg baulich
 * nie finden, weil er die Quelle mit ändert.
 *
 * DREI ABGRENZUNGEN, DIE WÖRTLICH AUS DEM VERTRAG STAMMEN UND KUNDENSICHTBAR SIND:
 *  - Primoris prüft SCHADSTOFFE an der ROHBOHNE.
 *  - Dartsch misst NÄHRSTOFFE der fertigen Mischung und enthält KEINEN
 *    Schadstoffwert.
 *  - Alle vier »Prüfzeugnisse« zu nennen wäre eine Falschbezeichnung.
 * Es steht hier deshalb KEIN Grenzwert und KEINE Aktualitätszusage: die
 * Zeugnisse sind von August bis November 2025, und jeder Knopf trägt sein
 * Datum, damit der Leser selbst urteilt.
 */

export const KAKAO_BELEGE = [
  {
    id: "primoris-amazonas-nativo-2025-08-19",
    art: "schadstoff-pruefzeugnis",
    titel: "Schadstoff-Prüfzeugnis · Amazonas Nativo",
    unterzeile: "Primoris Belgium, 19.08.2025 · Rohkakao-Bohnen · Zertifikat 25/049940 · PDF",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-amazonas-nativo-2025-08-19.pdf?v=1788373357",
    produktKeys: ["crystal-cacao-create"],
    sprache: "en",
    seiten: 9,
    bytes: 5246694,
  },
  {
    id: "primoris-piura-blanco-2025-08-21",
    art: "schadstoff-pruefzeugnis",
    titel: "Schadstoff-Prüfzeugnis · Piura Blanco",
    unterzeile: "Primoris Belgium, 21.08.2025 · Rohkakao-Bohnen · Zertifikat 25/049938 · PDF",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-piura-blanco-2025-08-21.pdf?v=1788373365",
    produktKeys: ["crystal-cacao-awake"],
    sprache: "en",
    seiten: 9,
    bytes: 5248993,
  },
  {
    id: "dartsch-create-2025-10-27",
    art: "naehrstoff-analyse",
    titel: "Nährstoff-Analyse · Crystal Cacao Create",
    unterzeile: "Dartsch Scientific, 27.10.2025 · Analyse DARTSCH/21/10/25 · PDF",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-create-2025-10-27.pdf?v=1788373349",
    produktKeys: ["crystal-cacao-create"],
    sprache: "de",
    seiten: 1,
    bytes: 342391,
  },
  {
    id: "dartsch-awake-2025-11-04",
    art: "naehrstoff-analyse",
    titel: "Nährstoff-Analyse · Crystal Cacao Awake",
    unterzeile: "Dartsch Scientific, 04.11.2025 · Analyse DARTSCH/04/11/25 · PDF, englisch",
    url: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-awake-2025-11-04.pdf?v=1788373343",
    produktKeys: ["crystal-cacao-awake"],
    sprache: "en",
    seiten: 1,
    bytes: 325578,
  },
];

/** Die Belege einer Sorte, in der Reihenfolge des Vertrags. */
export function belegeFuer(produktKey) {
  return KAKAO_BELEGE.filter((b) => b.produktKeys.includes(produktKey));
}
