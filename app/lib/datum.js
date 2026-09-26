/**
 * Datums-Anzeige für SSR-gerenderte Seiten — EIN Ort, EINE Zone.
 *
 * WARUM ES DIESE DATEI GIBT (Job 20260913-blog-hydration-bricht-bei-jedem-
 * dach-besucher-zeitzonen-datum): `Intl.DateTimeFormat` ohne `timeZone` nimmt
 * die Zone der UMGEBUNG. Auf dem Server ist das UTC, im Browser die Zone des
 * Kunden. Faellt ein Zeitstempel in das Fenster zwischen beiden Zonen, rendert
 * der Server einen anderen Tag als der Client — React findet beim Hydrieren
 * einen abweichenden Textknoten und wirft #418, in der Folge #423 und #425.
 *
 * Gemessen am 2026-09-13 live auf /blogs/wissen, die Zone als einzige Variable:
 *
 *     UTC                   0 Fehler      <- der Standort des Servers
 *     America/New_York      0
 *     Pacific/Honolulu     39
 *     Europe/Berlin        41             <- der Standort unserer Kundschaft
 *     Pacific/Kiritimati   45
 *
 * Der Defekt traf also nicht einen Randfall, sondern jeden Aufruf jeder
 * Blog-Seite durch einen DACH-Kunden.
 *
 * WARUM EUROPE/BERLIN UND NICHT DIE ZONE DES LESERS: ein Erscheinungs- oder
 * Bestelldatum ist ein Kalendertag, kein Zeitpunkt. Ein Artikel erscheint an
 * einem Tag — nicht an einem anderen, nur weil jemand ihn aus Honolulu liest.
 * Dieselbe Entscheidung ist im Haus schon zweimal so gefallen und steht in
 * app/lib/withdrawal.js (Widerrufs-Zeitstempel) und in
 * app/lib/qi-master-preisstufen.js (`tagIn`, Stufenwechsel). Genau
 * withdrawal.js nannten die beiden Blog-Routen im Kommentar als ihr
 * Hausmuster — sie hatten die SPRACHE daraus übernommen und die ZONE
 * daneben liegen lassen.
 *
 * Wer hier eine Zone braucht, die vom Leser abhängt, rendert sie NICHT im
 * SSR-Pfad, sondern nach der Hydration (useEffect) — sonst ist dieser Bruch
 * sofort zurück.
 */

/** Die redaktionelle Zone des Hauses. Ein Ort, damit sie nie zweimal driftet. */
export const HAUS_ZEITZONE = 'Europe/Berlin';

/**
 * Kalendertag, ausgeschrieben: "31. August 2026".
 *
 * @param {string|number|Date|null|undefined} wert ISO-Zeitstempel oder Date
 * @param {{zeitzone?: string}} [optionen]
 * @returns {string} leerer String, wenn nichts oder Unbrauchbares kommt —
 *   FAIL-SOFT, weil ein fehlendes Datum eine Seite nicht kosten darf.
 */
export function tagLang(wert, {zeitzone = HAUS_ZEITZONE} = {}) {
  const d = zuDatum(wert);
  if (!d) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zeitzone,
  }).format(d);
}

/**
 * Kalendertag mit fuehrender Null: "31. August 2026" mit zweistelligem Tag.
 * Eigene Funktion statt eines Schalters, weil die Konto-Ansicht die Daten
 * untereinander stellt und dort eine springende Spaltenbreite auffaellt.
 */
export function tagLangZweistellig(wert, {zeitzone = HAUS_ZEITZONE} = {}) {
  const d = zuDatum(wert);
  if (!d) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: zeitzone,
  }).format(d);
}

/** Alles, was hereinkommt, auf ein brauchbares Date bringen — oder auf null. */
function zuDatum(wert) {
  if (wert === null || wert === undefined || wert === '') return null;
  const d = wert instanceof Date ? wert : new Date(wert);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Kalendertag -> vollständiger ISO-8601-Zeitstempel MIT Zonenangabe.
 *
 * WARUM ES DIESE FUNKTION GIBT (Job 20260913-REPAIR-uploaddate-ohne-uhrzeit-
 * und-zeitzone): die Search Console meldete am 2026-09-13 zwei Probleme vom Typ
 * "Videos für strukturierte Daten" -- "Zeitzone in Datum/Uhrzeit-Attribut
 * `uploadDate` fehlt" und "ungültiger Datum/Uhrzeit-Wert für `uploadDate`".
 * Es sind nicht zwei Fehler, sondern derselbe Wert zweimal beurteilt: unsere
 * VideoObject-Knoten trugen ein bloßes `"2025-10-20"`. Google verlangt für
 * `uploadDate` ISO 8601 und sagt wörtlich: "We recommend that you provide
 * timezone information; otherwise, we will default to the timezone used by
 * Googlebot." Ein Datum ohne Zone überlässt den Kalendertag also dem
 * Standort eines fremden Crawlers.
 *
 * DIE UHRZEIT IST GESETZT, NICHT GEMESSEN -- und das ist der ehrliche Teil.
 * Gemessen 2026-09-13 an der Quelle (reels-gemessen.json, 67 Reels): das
 * Muster hh:mm kommt in 0 von 67 Instagram-Beschreibungen vor. Die Plattform
 * nennt dort nur einen Kalendertag ("qiblanco on August 13, 2024"); dieselbe
 * Lage bei den YouTube-Daten der Podcast- und Hypothesen-Seiten. Wir haben
 * also keine Veröffentlichungszeit und erfinden auch keine: gesetzt wird der
 * ANFANG dieses Kalendertages in der Hauszone. Das behauptet keine Genauigkeit,
 * die wir nicht haben -- es sagt "an diesem Tag, nach unserer Zeitrechnung".
 *
 * DER OFFSET WIRD GERECHNET, NIE GETIPPT. Europe/Berlin hat Sommerzeit:
 * 2025-10-20 ist +02:00, 2026-02-05 ist +01:00. Ein fest getipptes "+02:00"
 * macht aus dem 5. Februar den 4. Februar 23:00 Uhr -- also bei jedem
 * Winter-Beitrag den falschen Kalendertag. Und die Umstellungstage selbst sind
 * der Grenzfall, an dem eine einmalige Berechnung noch nicht reicht: am
 * 2025-10-26 gilt um 00:00 Ortszeit noch +02:00, um 12:00 UTC schon +01:00.
 * Deshalb wird der Kandidat gegengeprüft und der Offset notfalls ein zweites
 * Mal bestimmt -- die Gegenprobe ist die Wanduhr in der Zielzone selbst.
 *
 * IDEMPOTENT UND FAIL-SOFT, beides absichtlich: ein Wert, der schon eine
 * Uhrzeit trägt (`2021-02-12T03:23:31Z` aus erfahrungen-beitraege.js), kommt
 * unverändert zurück -- diese Funktion darf einen genaueren Wert nie
 * vergröbern. Und ein Wert, der KEIN reiner Kalendertag ist (etwa das bloße
 * Publikationsjahr "2021" einer Studie), kommt ebenfalls unverändert zurück:
 * dort wäre ein erfundener Tag samt Uhrzeit eine Präzision, die es nicht
 * gibt. Wer Genauigkeit hinzufuegt, die die Quelle nicht hergibt, hat das
 * Problem nicht gelöst, sondern versteckt.
 *
 * @param {string|null|undefined} wert Kalendertag "YYYY-MM-DD" (alles andere
 *   kommt unverändert zurück)
 * @param {{zeitzone?: string}} [optionen]
 * @returns {string} z. B. "2025-10-20T00:00:00+02:00"
 */
export function isoMitZone(wert, {zeitzone = HAUS_ZEITZONE} = {}) {
  if (typeof wert !== 'string') return wert === null || wert === undefined ? '' : wert;
  const tag = wert.trim();
  // NUR der reine Kalendertag wird angefasst. Alles andere -- schon fertige
  // Zeitstempel, bloße Jahre, Unfug -- bleibt, wie es ist.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return wert;

  let offset = zonenOffset(new Date(`${tag}T12:00:00Z`), zeitzone);
  // GEGENPROBE AN DER WANDUHR DER ZIELZONE: trifft der gebaute Zeitstempel
  // wirklich Mitternacht dieses Tages? An den beiden Umstellungstagen im Jahr
  // trifft er es beim ersten Anlauf nicht.
  if (wanduhr(new Date(`${tag}T00:00:00${offset}`), zeitzone) !== `${tag} 00:00`) {
    offset = zonenOffset(new Date(`${tag}T00:00:00${offset}`), zeitzone);
  }
  return `${tag}T00:00:00${offset}`;
}

/** Zonen-Offset zu EINEM Zeitpunkt, als "+02:00" / "-05:00". */
function zonenOffset(zeitpunkt, zeitzone) {
  if (Number.isNaN(zeitpunkt.getTime())) return '+00:00';
  const teil = new Intl.DateTimeFormat('en-US', {timeZone: zeitzone, timeZoneName: 'longOffset'})
    .formatToParts(zeitpunkt)
    .find((p) => p.type === 'timeZoneName');
  // "GMT" ohne Zusatz heißt exakt UTC — dort ist die ISO-Form "+00:00".
  const m = /^GMT([+-])(\d{2}):(\d{2})$/.exec(teil ? teil.value : '');
  return m ? `${m[1]}${m[2]}:${m[3]}` : '+00:00';
}

/** Die Wanduhr in der Zielzone als "YYYY-MM-DD HH:MM" — Gegenprobe, kein Schmuck. */
function wanduhr(zeitpunkt, zeitzone) {
  if (Number.isNaN(zeitpunkt.getTime())) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zeitzone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
      .formatToParts(zeitpunkt)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
}
