/*
 * Das Einführungsangebot „Create & Awake" (crystal-cacao-angebot, 76 € für
 * 2 Packungen) liegt höchstens ANGEBOT_MAX-mal in einem Warenkorb.
 *
 * WARUM (Großjob 20261017-repair-prio1-kakao-unter-herstellkosten-bundle-
 * stapelt-rabatt-preisboden-wache, s02): Bestellung #13561 kaufte das Angebot
 * dreimal, zusammen mit dem Mengenrabatt 2x waren das 33 € je Packung.
 * Christian: „das geht nicht ... abstellen". Der Rabatt ist im Shop behoben,
 * aber schon 2x Angebot sind 38 € je Packung unter jeder Staffel. Gedacht ist
 * das Angebot als einmaliger Einstieg.
 *
 * EINE Stelle für Handle, Höchstmenge und Hinweissatz. Gelesen von der
 * Warenkorb-Action (angebot-limit.server.js), dem Permalink, dem Stepper
 * im Warenkorb (CartLineItem) und der Kaufseite, damit alle dieselbe Zahl
 * sprechen. Dieselbe Datei liegt in qiblanco-storefront (PR #935); beide
 * Läden teilen sich eine Kasse, die Konstante ist je Laden umkehrbar.
 *
 * WARUM NICHT IN DER KASSE: der umgehungsfeste Weg wäre eine Shopify-Function
 * (Cart and Checkout Validation). Sie braucht eine Custom-App mit Deploy-
 * Zugang, den der Server nicht hat. Ein Kauf an dieser Storefront vorbei
 * (Storefront-API direkt, Kassen-Link, Admin-Entwurf) läuft hier nicht durch;
 * den meldet der Bestell-Arm der Preisboden-Wache (preisboden/bin/
 * preisboden-wache, stündlich).
 *
 * RÜCKWEG: ANGEBOT_MAX auf eine große Zahl (99) setzen, dann greift die Klemme
 * praktisch nie und der Stepper ist wieder frei. Die Probe
 * preisboden/pruefungen/probe_angebot_limit_live.py wird dann rot.
 */

export const ANGEBOT_HANDLE = 'crystal-cacao-angebot';
export const ANGEBOT_MAX = 1;
export const ANGEBOT_HINWEIS = 'Dieses Angebot gibt es einmal pro Bestellung.';

/** Ist diese Zeile das begrenzte Angebot? */
export function istBegrenztesAngebot(handle) {
  return handle === ANGEBOT_HANDLE;
}

/**
 * DIE REGEL, rein (kein Netz). Eingabe: Warenkorbzeilen mit {id, quantity,
 * handle}. Ausgabe: was entfernt bzw. geändert werden muss, damit über alle
 * Angebotszeilen zusammen höchstens `max` Stück liegen. Es bleibt die VORNE
 * stehende Zeile (Shopify liefert die zuletzt hinzugefügte zuerst).
 */
export function angebotKorrektur(zeilen, max = ANGEBOT_MAX) {
  const entfernen = [];
  const aendern = [];
  let rest = max;
  for (const z of zeilen) {
    if (!istBegrenztesAngebot(z.handle)) continue;
    if (rest <= 0) {
      entfernen.push(z.id);
    } else if ((z.quantity || 0) > rest) {
      aendern.push({id: z.id, quantity: rest});
      rest = 0;
    } else {
      rest -= z.quantity || 0;
    }
  }
  return {entfernen, aendern};
}
