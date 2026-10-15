/**
 * WARENKORB-MELDUNGEN, DIE SONST NIEMAND AUSSPRICHT
 * (Job 20261013-crystal-laden-feinschliff, Befund C16).
 *
 * GEMESSEN am 13.10.2026: brach eine Warenkorb-Aktion an der Verbindung ab
 * (Funkloch, hier per page.route nachgestellt), ersetzte der Laden den ganzen
 * Warenkorb durch „Da ist etwas schiefgelaufen 500 Failed to fetch“. Der
 * Fehler des Fetchers stieg bis zur Wurzel-Fehlergrenze (root.jsx) auf.
 *
 * Die Route /cart faengt ihn jetzt in einer clientAction (routes/cart.jsx)
 * und meldet ihn ueber dieses Ereignis. Der Hinweis (CartMain.jsx) hoert
 * darauf, egal welches Formular die Aktion ausgeloest hat — Menge,
 * Entfernen, Rabattcode, Gutschein oder „In den Warenkorb“.
 */
export const VERBINDUNG_EREIGNIS = 'cc-warenkorb-verbindung';

/**
 * Ist das ein Abbruch der Verbindung (und nicht eine Antwort des Servers)?
 * `fetch()` wirft bei einem Netzfehler einen TypeError („Failed to fetch“,
 * „NetworkError…“, „Load failed“). Antworten, Weiterleitungen und
 * Routenfehler sind keine TypeErrors und laufen unveraendert weiter.
 * @param {unknown} fehler
 * @returns {boolean}
 */
export function istVerbindungsfehler(fehler) {
  return fehler instanceof TypeError;
}

/** Meldet einen Verbindungsabbruch an den Hinweis im Warenkorb. */
export function meldeVerbindungsfehler() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(VERBINDUNG_EREIGNIS));
}
