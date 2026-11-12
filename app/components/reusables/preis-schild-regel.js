import {formatPreis} from '../../lib/markt-pricing.js';

/**
 * PREIS-SCHILDCHEN (Standard Variante B, Christian 12.11.2026) — die Regel ohne React,
 * damit sie mit `node --test` pruefbar ist.
 *
 * Zwei Arten: Auszeichnung ("Bestseller", "Exklusiv", "Neu", "Limitiert") und
 * Preisvorteil. Der Preisvorteil nennt eine Zahl, die zum durchgestrichenen Preis
 * daneben passt: unter 100 (Waehrungseinheiten) Prozent, ab 100 der Betrag
 * ("Rule of 100"). Ohne sichtbaren Vergleichspreis gibt es kein Preisvorteil-Schild.
 * Standard: design-meister/db/designstandard/_basis.yaml, Baustein `schildchen`.
 */

const MINUS = '−';

/**
 * @param {number|string|null|undefined} preis  Preis, der neben dem Schild steht
 * @param {number|string|null|undefined} vergleich  durchgestrichener Vergleichspreis
 * @param {string} [waehrung]  ISO-Code, Standard EUR
 * @returns {string|null}  "−30 %" | "−200 €" | null
 */
export function vorteilText(preis, vergleich, waehrung = 'EUR') {
  const p = Number(preis);
  const v = Number(vergleich);
  if (!Number.isFinite(p) || !Number.isFinite(v) || v <= p || p <= 0) return null;
  if (p < 100) {
    const prozent = Math.round((1 - p / v) * 100);
    return prozent > 0 ? `${MINUS}${prozent} %` : null;
  }
  const betrag = formatPreis(Math.round((v - p) * 100) / 100, waehrung);
  return betrag ? `${MINUS}${betrag}` : null;
}

/** Vorlesefassung: "minus 200 €" statt des Minuszeichens. */
export function vorteilVorlesen(text) {
  return text ? text.replace(MINUS, 'minus ') : text;
}
