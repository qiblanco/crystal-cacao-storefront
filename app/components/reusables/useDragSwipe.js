import {useCallback, useEffect, useRef, useState} from 'react';

/*
 * Gemeinsamer Drag-/Swipe-Hook fuer ALLE Slider der Storefront
 * (Baustandard GL-DES-0012, Jobspec SLIDER-DRAG-SWIPE_2026-07-21).
 *
 * mode 'transform': steuert einen index-basierten Track (InfoSlider, UpsellLineUp).
 *   Waehrend des Drags liefert der Hook dragOffset (px, dem Zeiger 1:1 folgend);
 *   beim Loslassen entscheidet Weg ODER Velocity ueber onNext/onPrev.
 * mode 'scroll': steuert einen overflow-x-Container (scroll-snap-Tracks).
 *   Maus-Drag setzt scrollLeft; Touch bleibt beim nativen Scrollen (Browser).
 *   Nach dem Loslassen Momentum per Velocity, dann Settle auf den naechsten
 *   Snap-Punkt (bei prefers-reduced-motion: reduce ohne Momentum-Fling).
 *
 * Rueckgabe: {handlers, isDragging, dragOffset, shouldSuppressClick}
 * handlers auf den Wrapper/Track spreizen. Klick-Suppression nach echtem Drag
 * laeuft zusaetzlich ueber onClickCapture (faengt auch Links im Track ab).
 * SSR-sicher: kein window-Zugriff im Render.
 */

const AXIS_LOCK_PX = 10; // erste ~10 px entscheiden die Achse (D4)
const CLICK_SUPPRESS_PX = 8; // darunter gilt die Geste als Klick (D3)
const FLICK_VELOCITY = 0.5; // px/ms — schneller Flick schaltet auch unter Schwelle (D1)
const VELOCITY_WINDOW_MS = 100; // Velocity aus den letzten ~100 ms
const SNAP_RATIO = 0.5; // Weg-Schwelle: halber slideStep
// Obergrenze der Weg-Schwelle, gemessen am SICHTBAREN Container statt am
// slideStep. Grund (gemessen 2026-08-09, /products/qione-2-pro, mobil-360):
// slideStep ist Kartenbreite + gap (328+20=348) und damit größer als der
// sichtbare Container (328). Die Schwelle lag folglich bei 174 px, während
// eine Wischgeste über die ganze sichtbare Breite höchstens 328 px und in
// der Praxis ~164 px (halbe Breite) erreicht: der Nutzer musste mehr als die
// halbe sichtbare Karte ziehen, um einen Slide auszulösen. Auf Desktop fiel
// das nie auf, weil dort slideStep (420) weit unter der Containerbreite
// (1248) liegt. Die Kappe greift also GENAU dann, wenn ein Slide breiter ist
// als das Fenster, das ihn zeigt — und lässt Desktop unverändert
// (min(210, 374) = 210, exakt der Bestandswert).
const VIEWPORT_RATIO = 0.3;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useDragSwipe({
  mode = 'transform',
  enabled = true,
  trackRef = null,
  slideStep = 420,
  onNext = null,
  onPrev = null,
  canNext = null,
  canPrev = null,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Optionen je Render in einen Ref spiegeln — Handler bleiben stabil,
  // sehen aber immer den aktuellen Stand (kein Stale-Closure).
  const opts = useRef({});
  opts.current = {mode, enabled, trackRef, slideStep, onNext, onPrev, canNext, canPrev};

  const state = useRef({
    pointerId: null,
    captureEl: null,
    startX: 0,
    startY: 0,
    axis: null, // null = unentschieden, 'x' = Drag aktiv, 'y' = abgebrochen
    startScrollLeft: 0,
    samples: [], // {t, x} der letzten ~100 ms fuer die Velocity
    suppressClick: false,
    momentumRaf: 0,
    snapRestoreTimer: 0,
  });

  const shouldSuppressClick = useCallback(() => state.current.suppressClick, []);

  const stopMomentum = useCallback(() => {
    const s = state.current;
    if (s.momentumRaf) {
      window.cancelAnimationFrame(s.momentumRaf);
      s.momentumRaf = 0;
    }
    if (s.snapRestoreTimer) {
      window.clearTimeout(s.snapRestoreTimer);
      s.snapRestoreTimer = 0;
    }
  }, []);

  const resetDrag = useCallback(() => {
    const s = state.current;
    if (s.captureEl && s.pointerId !== null) {
      try {
        s.captureEl.releasePointerCapture(s.pointerId);
      } catch {
        /* Capture kann schon weg sein (pointercancel) */
      }
    }
    s.pointerId = null;
    s.captureEl = null;
    s.axis = null;
    s.samples = [];
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  const restoreSnap = useCallback((track) => {
    // scroll-snap war fuer den Drag ausgeschaltet (mandatory-Snap wuerde
    // waehrend scrollLeft-Updates springen); sanft auf den naechsten
    // Snap-Punkt setteln, dann CSS-Snap wieder aktivieren.
    const s = state.current;
    if (!track) return;
    const children = Array.from(track.children);
    if (children.length) {
      let nearest = null;
      let nearestDist = Infinity;
      for (const child of children) {
        const dist = Math.abs(child.offsetLeft - track.scrollLeft);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = child;
        }
      }
      if (nearest) {
        track.scrollTo({
          left: nearest.offsetLeft,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      }
    }
    s.snapRestoreTimer = window.setTimeout(() => {
      track.style.scrollSnapType = '';
      s.snapRestoreTimer = 0;
    }, 320);
  }, []);

  const velocityFromSamples = useCallback(() => {
    const s = state.current;
    const now = performance.now();
    const recent = s.samples.filter((p) => now - p.t <= VELOCITY_WINDOW_MS);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.t - first.t;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  }, []);

  const onPointerDown = useCallback(
    (event) => {
      const o = opts.current;
      if (!o.enabled) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      // scroll-Modus: Touch scrollt nativ (Bauart C ist auf Touch bereits
      // wischbar) — nur die Maus braucht den Drag.
      if (o.mode === 'scroll' && event.pointerType !== 'mouse') return;

      const s = state.current;
      stopMomentum();
      s.pointerId = event.pointerId;
      s.captureEl = event.currentTarget;
      s.startX = event.clientX;
      s.startY = event.clientY;
      s.axis = null;
      s.suppressClick = false;
      s.samples = [{t: performance.now(), x: event.clientX}];
      if (o.mode === 'scroll' && o.trackRef?.current) {
        s.startScrollLeft = o.trackRef.current.scrollLeft;
      }
      // KEIN preventDefault: Klicks (D3) und natives vertikales Scrollen (D4)
      // muessen moeglich bleiben, bis die Achse entschieden ist.
    },
    [stopMomentum],
  );

  const onPointerMove = useCallback((event) => {
    const s = state.current;
    const o = opts.current;
    if (s.pointerId === null || event.pointerId !== s.pointerId) return;
    if (s.axis === 'y') return;

    const dx = event.clientX - s.startX;
    const dy = event.clientY - s.startY;

    if (s.axis === null) {
      if (Math.hypot(dx, dy) < AXIS_LOCK_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertikal: Drag abbrechen, Seite scrollen lassen (touch-action: pan-y)
        s.axis = 'y';
        return;
      }
      s.axis = 'x';
      try {
        s.captureEl.setPointerCapture(s.pointerId);
      } catch {
        /* z.B. Element schon entfernt */
      }
      setIsDragging(true);
      if (o.mode === 'scroll' && o.trackRef?.current) {
        o.trackRef.current.style.scrollSnapType = 'none';
        s.startScrollLeft = o.trackRef.current.scrollLeft;
      }
    }

    s.samples.push({t: performance.now(), x: event.clientX});
    if (s.samples.length > 12) s.samples.shift();
    if (Math.abs(dx) > CLICK_SUPPRESS_PX) s.suppressClick = true;

    if (o.mode === 'scroll') {
      const track = o.trackRef?.current;
      if (track) track.scrollLeft = s.startScrollLeft - dx;
    } else {
      let offset = dx;
      // Widerstand an harten Enden (kein next/prev moeglich): Rubber-Band
      const blockedNext = o.canNext && !o.canNext() && dx < 0;
      const blockedPrev = o.canPrev && !o.canPrev() && dx > 0;
      if (blockedNext || blockedPrev) offset = dx * 0.35;
      setDragOffset(offset);
    }
    event.preventDefault();
  }, []);

  const finishDrag = useCallback(
    (event, cancelled) => {
      const s = state.current;
      const o = opts.current;
      if (s.pointerId === null || (event && event.pointerId !== s.pointerId)) return;

      const wasHorizontal = s.axis === 'x';
      const dx = event ? event.clientX - s.startX : 0;
      const velocity = velocityFromSamples();

      if (wasHorizontal && !cancelled) {
        if (o.mode === 'scroll') {
          const track = o.trackRef?.current;
          if (track) {
            const reduced = prefersReducedMotion();
            let v = reduced ? 0 : -velocity; // px/ms in Scroll-Richtung
            if (Math.abs(v) > 0.2 && !reduced) {
              // Momentum-Fling: Velocity mit Reibung auslaufen lassen (D6/D8)
              const friction = 0.95;
              const step = () => {
                track.scrollLeft += v * 16;
                v *= friction;
                if (Math.abs(v) > 0.05) {
                  s.momentumRaf = window.requestAnimationFrame(step);
                } else {
                  s.momentumRaf = 0;
                  restoreSnap(track);
                }
              };
              s.momentumRaf = window.requestAnimationFrame(step);
            } else {
              restoreSnap(track);
            }
          }
        } else {
          const step = o.slideStep || 420;
          // Sichtbare Breite des Wrappers, auf dem die Geste liegt. Fällt sie
          // aus (kein Element / 0), bleibt es beim reinen slideStep-Verhalten
          // — die Kappe darf nie strenger sein als der Bestand.
          const sichtbar = s.captureEl?.clientWidth || 0;
          const schwelle = sichtbar > 0
            ? Math.min(step * SNAP_RATIO, sichtbar * VIEWPORT_RATIO)
            : step * SNAP_RATIO;
          const movedFar = Math.abs(dx) >= schwelle;
          const flicked =
            !prefersReducedMotion() &&
            Math.abs(dx) > CLICK_SUPPRESS_PX &&
            Math.abs(velocity) >= FLICK_VELOCITY;
          if (movedFar || flicked) {
            if (dx < 0) o.onNext?.();
            else o.onPrev?.();
          }
        }
      }

      if (s.suppressClick) {
        // Flag nach dem Klick-Durchlauf zuruecksetzen (Click feuert nach pointerup)
        window.setTimeout(() => {
          s.suppressClick = false;
        }, 120);
      }
      resetDrag();
    },
    [resetDrag, restoreSnap, velocityFromSamples],
  );

  const onPointerUp = useCallback((event) => finishDrag(event, false), [finishDrag]);
  const onPointerCancel = useCallback(
    (event) => {
      // Browser hat die Geste uebernommen (z.B. vertikales Touch-Scrollen)
      const o = opts.current;
      if (o.mode === 'scroll' && o.trackRef?.current) {
        o.trackRef.current.style.scrollSnapType = '';
      }
      finishDrag(event, true);
    },
    [finishDrag],
  );

  const onClickCapture = useCallback((event) => {
    if (state.current.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  // Bilder/Links im Track starten sonst ein natives HTML5-Drag, das die
  // Pointer-Events kapert (pointercancel) — im Slider nie erwuenscht.
  const onDragStart = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Cleanup: Fenster-Blur bricht einen haengenden Drag ab (D6)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onBlur = () => {
      if (state.current.pointerId !== null) {
        const o = opts.current;
        if (o.mode === 'scroll' && o.trackRef?.current) {
          o.trackRef.current.style.scrollSnapType = '';
        }
        resetDrag();
      }
    };
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      stopMomentum();
    };
  }, [resetDrag, stopMomentum]);

  return {
    handlers: {onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, onDragStart},
    isDragging,
    dragOffset,
    shouldSuppressClick,
  };
}
