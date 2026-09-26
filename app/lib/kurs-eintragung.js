/**
 * Der Eintragungsweg des Gratis-Kakao-Kurses — EINE Quelle fuer beide Seiten
 * der Naht.
 *
 * WARUM DIESE DATEI EXISTIERT UND NICHT ZWEI LITERALE: das Formular auf der
 * Startseite nennt einen Pfad im `action`-Attribut, und die Route nimmt ihn
 * entgegen. Stehen die zwei Literale an zwei Orten, reisst die Naht bei der
 * ersten Umbenennung — und zwar STILL: die Seite antwortet weiter HTTP 200,
 * das Feld steht da, und der Absendeknopf laeuft in ein 404. Hier steht der
 * Pfad einmal; beide Seiten lesen ihn.
 *
 * WARUM DAS FORMULAR NICHT MEHR DAS ACTIVECAMPAIGN-EMBED IST (Befund
 * 2026-09-17, Job 20260917-jetzt-kostenfrei-mitmachen-ohne-ein-feld-zum-
 * eintragen): der Abschnitt "Jetzt kostenfrei mitmachen!" versprach eine
 * Eintragung und bot keine. Gemessen am Kundenrand: 0 `<form>`, 0 `<input>`,
 * 0 `type=email` auf https://crystal-cacao.com/ bei HTTP 200 und 58.025 Byte.
 * Die Ursache war NICHT eine fehlende Zeile im Markup, sondern die eigene
 * Content-Security-Policy dieses Ladens: `<ActiveCampaignForm formId="21" />`
 * haengt zur Laufzeit ein fremdes `<script>` an, und `default-src 'self'`
 * blockt es (Playwright-Ereignis `requestfailed`, Grund woertlich `csp`, drei
 * Blockaden je Seitenaufruf). Das Server-HTML enthielt baulich nur ein leeres
 * `<div>`.
 *
 * DIE CSP BLEIBT UNBERUEHRT, UND ZWAR ALS ENTSCHEIDUNG: der Kommentarblock in
 * app/entry.server.jsx begruendet auf zwanzig Zeilen, warum dieser Laden seine
 * Richtlinie eng haelt. Unser eigener Ursprung ist `'self'` und damit schon
 * erlaubt. Ein server-gerendertes Formular braucht keine einzige Zeile davon —
 * und es ist die einzige Bauform, die am gerenderten Rand ueberhaupt messbar
 * ist: ein Fremd-JS-Embed erzeugt sein Feld erst im Browser, das
 * Erfuellungskriterium k4cc97eb5b2 zaehlt aber `<form>`, `<input>` und
 * `type=email` im ROHEN HTML.
 *
 * KEIN API-SCHLUESSEL, UND KEINER GEHOERT HIERHER: die Felder unten sind aus
 * dem oeffentlichen Embed selbst ausgelesen (GET /f/embed.php?id=21). Sie
 * zeigen auf den OEFFENTLICHEN Formular-Prozessor, nicht auf die API.
 * `activecampaign.env` bleibt unberuehrt. Damit ist "derselbe Weg wie der
 * uebrige Kursversand" woertlich erfuellt: gleiche Formular-Nummer 21, gleiche
 * Liste, gleiche Automation wie auf qiblanco.com.
 */

/** Die eigene Route, die die Eintragung serverseitig weiterreicht. */
export const EINTRAGUNG_PFAD = '/kurs-eintragung';

/** Der oeffentliche Formular-Prozessor von ActiveCampaign. */
export const AC_PROZESSOR = 'https://qiblanco.activehosted.com/proc.php';

/**
 * Die verborgenen Felder des Formulars 21, aus dem Embed ausgelesen.
 * `email` kommt vom Kunden, `fullname` ist der HONEYPOT und bleibt LEER —
 * ActiveCampaign wertet ein gefuelltes fullname als Spam.
 */
export const FORMULAR_21 = {
  u: '6AAC4EE90B31C',
  f: '21',
  s: '',
  c: '0',
  m: '0',
  act: 'sub',
  v: '2',
  or: '9dbaea5e-31e8-4a35-ac4c-b2bb4f9427aa',
};

/** Das Feld, das der Kunde ausfuellt. */
export const FELD_MAIL = 'email';

/** Das Honeypot-Feld. Unsichtbar, leer, und genau deshalb da. */
export const FELD_FALLE = 'fullname';

/**
 * Die Zustaende, die die Route ueber die Adresszeile zurueckgibt.
 * Sie stehen in der URL und nicht in einem Cookie: dieser Laden hat keine
 * Einwilligungsverwaltung, und ein Cookie fuer eine Bestaetigungsseite waere
 * genau die Art Fremdspur, die hier nichts zu suchen hat.
 */
export const STAND = {
  eingetragen: 'eingetragen',
  adresse: 'adresse',
  stoerung: 'stoerung',
};

/**
 * Die Adress-Pruefung der Route. Bewusst grob: sie soll den Tippfehler
 * abfangen, nicht die Zustellbarkeit beweisen. Ob die Adresse dem Kunden
 * gehoert, entscheidet ActiveCampaign selbst — Formular 21 laeuft mit
 * doppelter Einwilligung (gemessen 2026-09-17: die Antwort von proc.php
 * fordert woertlich zur Bestaetigung im Postfach auf).
 */
export function adresseTaugt(wert) {
  const t = String(wert || '').trim();
  return t.length >= 6 && t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}
