/*
 * Snap-Ziel eines scroll-snap-Tracks, in den Koordinaten von track.scrollLeft.
 *
 * Anlass (Job 20261010-hb-dragswipe-restoresnap-offsetleft-ziel-prio35):
 * useDragSwipe.restoreSnap zielte auf child.offsetLeft. offsetLeft ist relativ
 * zum offsetParent, nicht zur Kartenreihe. Liegt die Reihe im offsetParent
 * nicht bei 0 (Startseite @1440: 61 px), parkte der Slider 61 px neben dem
 * Snap-Punkt, und das wieder eingeschaltete CSS-Snap setzte ihn ein zweites
 * Mal (421 -> 360). Am IG-Slider kam scroll-padding dazu (188 -> 284).
 *
 * Hier wird der Punkt so gerechnet, wie das CSS-Snap ihn wählt: Kartenkante
 * aus dem Rect relativ zum Scrollport, scroll-margin der Karte, scroll-padding
 * der Reihe, scroll-snap-align (start/center/end) und auf den Scrollbereich
 * begrenzt.
 *
 * Reine Geometrie ohne DOM (test/dragswipe-snapziel.test.mjs); die
 * DOM-Lesung steht in snapGeometrie().
 */

function zahl(wert) {
  const n = parseFloat(wert);
  return Number.isFinite(n) ? n : 0;
}

// Computed scroll-snap-align ist "start" oder "<block> <inline>".
function inlineAlign(wert) {
  const teile = String(wert || 'none').trim().split(/\s+/);
  return teile[teile.length - 1];
}

/**
 * @param {{scrollLeft:number, portBreite:number, padStart:number, padEnd:number,
 *          max:number, kinder:{links:number, rechts:number, align:string}[]}} g
 *   links/rechts: Kartenkanten inkl. scroll-margin, in scrollLeft-Koordinaten.
 * @returns {number|null} nächster Snap-Punkt oder null (keine Karte)
 */
export function snapPunktNahe(g) {
  const mitAlign = g.kinder.filter((k) => k.align !== 'none');
  // Kein Kind trägt ein Align: wie bisher an den Kartenanfang.
  const kinder = mitAlign.length ? mitAlign : g.kinder.map((k) => ({...k, align: 'start'}));
  const innen = g.portBreite - g.padStart - g.padEnd;
  let bester = null;
  let besterAbstand = Infinity;
  for (const k of kinder) {
    let p;
    if (k.align === 'end') p = k.rechts - g.padStart - innen;
    else if (k.align === 'center') p = (k.links + k.rechts) / 2 - g.padStart - innen / 2;
    else p = k.links - g.padStart;
    p = Math.min(Math.max(p, 0), Math.max(g.max, 0));
    const abstand = Math.abs(p - g.scrollLeft);
    if (abstand < besterAbstand) {
      besterAbstand = abstand;
      bester = p;
    }
  }
  return bester;
}

/** Liest die Geometrie eines Tracks aus dem DOM (nur im Browser aufrufen). */
export function snapGeometrie(track) {
  const cs = window.getComputedStyle(track);
  const port = track.getBoundingClientRect();
  const portLinks = port.left + track.clientLeft;
  const kinder = Array.from(track.children).map((kind) => {
    const kcs = window.getComputedStyle(kind);
    const r = kind.getBoundingClientRect();
    return {
      links: r.left - zahl(kcs.scrollMarginLeft) - portLinks + track.scrollLeft,
      rechts: r.right + zahl(kcs.scrollMarginRight) - portLinks + track.scrollLeft,
      align: inlineAlign(kcs.scrollSnapAlign),
    };
  });
  return {
    scrollLeft: track.scrollLeft,
    portBreite: track.clientWidth,
    padStart: zahl(cs.scrollPaddingLeft),
    padEnd: zahl(cs.scrollPaddingRight),
    max: track.scrollWidth - track.clientWidth,
    kinder,
  };
}
