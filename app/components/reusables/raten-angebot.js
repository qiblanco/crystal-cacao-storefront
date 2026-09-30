/*
 * Monatsbetrag für die Ratenzeile im Kaufblock (Job
 * 20260926-kaufblock-raten-und-testzeit-qione-2-pro-prio35, AEM-Hypothese
 * aem-h-1af5db847a).
 *
 * DIE FORMEL IST DIE DES HAUSES, NICHT NEU: die Landingpages rechnen seit
 * Juli `Math.ceil(preis / 12)` und schreiben „oder 12 Raten à 91 €"
 * (SchlafZellenSchutz.jsx u. a., Christian 21.09.2026 live). Aufgerundet,
 * damit zwölf Raten den Preis nie unterschreiten.
 *
 * DIE SCHWELLE KOMMT AUS DER KASSE, NICHT AUS UNS: die FAQ der Kaufseite
 * nennt die Klarna-Stufen („ab 500 € in 12 Monatsraten", ab 25 € in 6, ab
 * 1000 € in 24). Unter 500 € bietet die Kasse keine 12 Raten an, also nennt
 * die Seite dort auch keine: dann liefert die Funktion null und die Zeile
 * bleibt ohne Betrag.
 */
export const RATEN_ANZAHL = 12;
export const RATEN_MINDESTPREIS_EUR = 500;

/**
 * @param {number|null|undefined} bruttoEuro Anzeigepreis in Euro (ganze Euro)
 * @returns {number|null} Monatsbetrag in ganzen Euro, oder null
 */
export function monatsrate(bruttoEuro) {
  const n = Number(bruttoEuro);
  if (!Number.isFinite(n) || n < RATEN_MINDESTPREIS_EUR) return null;
  return Math.ceil(n / RATEN_ANZAHL);
}
