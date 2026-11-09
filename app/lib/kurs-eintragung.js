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
 * WARUM EIN SERVER-GERENDERTES FORMULAR (Befund 2026-09-17, Job
 * 20260917-jetzt-kostenfrei-mitmachen-ohne-ein-feld-zum-eintragen): ein
 * Fremd-JS-Embed scheiterte an der eigenen Content-Security-Policy dieses
 * Ladens und erzeugt sein Feld erst im Browser; das Erfuellungskriterium
 * k4cc97eb5b2 zaehlt `<form>`, `<input>` und `type=email` im ROHEN HTML.
 *
 * WOHIN DIE EINTRAGUNG GEHT (AC-Abschluss, Elina EL-20261103-b633cb45,
 * Punkt 5): bis dahin reichte die Route an den oeffentlichen Formular-
 * Prozessor von ActiveCampaign weiter (Formular 21). Jetzt geht sie an den
 * eigenen Anmelde-Endpunkt (ac-eingang, POST /f/cc-21): Liste 20 sofort,
 * nach der Bestaetigung Liste 2 und Tag #kakao, Bestaetigungsmail im
 * Crystal-Kit. Ohne diesen Wechsel liefe jede Anmeldung ab dem Kontoende
 * ins Leere.
 */

/** Die eigene Route, die die Eintragung serverseitig weiterreicht. */
export const EINTRAGUNG_PFAD = '/kurs-eintragung';

/** Der eigene Anmelde-Endpunkt (derselbe Host wie in qiblanco-storefront). */
export const ANMELDE_ENDPUNKT = 'https://anmelden.dienst.qiblanco.com';

/** Das Formular dieses Ladens beim Endpunkt (formulare.yaml, Schluessel cc-21). */
export const FORMULAR_ID = 'cc-21';

/**
 * Der Satz am Knopf, dem der Mensch mit dem Klick zustimmt. WORTGLEICH mit
 * `einwilligung` von cc-21 in ac-eingang/config/formulare.yaml. Er steht hier
 * und nicht aus GET /w geholt, weil das Formular ohne JavaScript und im rohen
 * HTML vollstaendig sein muss (siehe oben). Dass er nicht still auseinander-
 * laeuft, sichert die Kennung: die Route schickt einwilligung_id dieses Satzes
 * mit, und der Endpunkt antwortet 409, sobald seine Fassung eine andere ist.
 * Die Route meldet das als Stoerung und protokolliert `einwilligung_veraltet`.
 */
export const EINWILLIGUNG =
  'Ja, ich möchte den kostenlosen Kakao-Kurs und danach den Newsletter von Crystal Cacao per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.';

/** Das Feld, das der Kunde ausfuellt. */
export const FELD_MAIL = 'email';

/** Das Honeypot-Feld. Unsichtbar, leer, und genau deshalb da. */
export const FELD_FALLE = 'fullname';

/** Renderzeit des Formulars (Serverzeit), fuer die Zeitfalle des Endpunkts. */
export const FELD_ZEIT = 'angezeigt';

/**
 * Die Zustaende, die die Route ueber die Adresszeile zurueckgibt.
 * Sie stehen in der URL und nicht in einem Cookie: dieser Laden hat keine
 * Einwilligungsverwaltung, und ein Cookie fuer eine Bestaetigungsseite waere
 * genau die Art Fremdspur, die hier nichts zu suchen hat.
 */
export const STAND = {
  eingetragen: 'eingetragen',
  adresse: 'adresse',
  gesperrt: 'gesperrt',
  stoerung: 'stoerung',
};

/**
 * Die Adress-Pruefung der Route. Bewusst grob: sie soll den Tippfehler
 * abfangen, nicht die Zustellbarkeit beweisen. Ob die Adresse dem Kunden
 * gehoert, klaert die doppelte Einwilligung des Endpunkts (Bestaetigungsmail
 * mit Link).
 */
export function adresseTaugt(wert) {
  const t = String(wert || '').trim();
  return t.length >= 6 && t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}
