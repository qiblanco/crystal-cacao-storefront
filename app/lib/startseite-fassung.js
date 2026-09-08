/**
 * startseite-fassung — der eine Schalter zwischen der heutigen Startseite und
 * dem Verkaufsauftritt-Entwurf.
 *
 * WARUM ES IHN GIBT: Christian hat den Auftrag am 2026-09-08 ausdruecklich
 * zweigeteilt. Die sechs Sofortfehler waren „autonom bauen und live schalten";
 * fuer die neue Startseite steht woertlich da: „Diesen Teil legst du Christian
 * vor, bevor er live geht." Das ist der Ausnahmefall [A] der Autonomie-Policy
 * (ausdrueckliche Anweisung schlaegt den Voll-live-Default), und deshalb — und
 * NUR deshalb — steht hier ein Flag statt eines Deploys.
 *
 * ES IST BEWUSST KEIN DAUERZUSTAND. Der Entwurf ist unter `?entwurf=1` auf der
 * echten Startseite anzusehen, also am fertigen Objekt und nicht auf einem
 * Bild. Sagt Christian ja, wird aus FASSUNG die Zeichenkette 'live' — eine
 * Zeile, ein Deploy, kein zweiter Bau. Sagt er nein, faellt der Entwurf mit
 * derselben Zeile weg.
 *
 * VORSCHAU-PARAMETER, beide Richtungen:
 *   ?entwurf=1  zeigt den Entwurf, auch wenn FASSUNG auf 'bestand' steht
 *   ?entwurf=0  zeigt den Bestand, auch wenn FASSUNG schon auf 'live' steht
 * Die Gegenrichtung ist kein Luxus: nach dem Scharfschalten ist sie der
 * einzige Weg, die alte Fassung noch anzusehen, ohne zu deployen.
 */

/** 'bestand' = heutige Startseite · 'live' = Verkaufsauftritt fuer alle. */
export const FASSUNG = 'bestand';

/**
 * @param {Request} request
 * @returns {boolean} true = Verkaufsauftritt-Entwurf zeigen
 */
export function zeigeVerkaufsauftritt(request) {
  let wahl = null;
  try {
    wahl = new URL(request.url).searchParams.get('entwurf');
  } catch {
    // FAIL-CLOSED: eine unlesbare URL zeigt den Bestand, nie den Entwurf.
    wahl = null;
  }
  if (wahl === '1') return true;
  if (wahl === '0') return false;
  return FASSUNG === 'live';
}
