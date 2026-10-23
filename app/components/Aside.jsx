import {createContext, useContext, useEffect, useId, useRef, useState} from 'react';

/*
 * TASTATUR UND SCREENREADER (Befund C06 des crystal-Gesamtchecks, 13.10.2026):
 * vorher blieb der Fokus beim Öffnen am Auslöser, Tab lief in den Seiteninhalt
 * dahinter, Escape ließ ihn dort liegen; der Dialog hatte keinen Namen, und die
 * Schließfläche .close-outside war fokussierbar und namenlos. Jetzt:
 *   1. Name: aria-labelledby zeigt auf die Überschrift der Schublade.
 *   2. Die Schließfläche heißt „Schließen“ und fällt aus der Tab-Folge (die
 *      Maus trifft sie weiter, der Knopf im Kopf bleibt der Tastaturweg).
 *   3. Beim Öffnen geht der Fokus in die Schublade, Tab und Umschalt+Tab
 *      bleiben darin, beim Schließen kehrt er zum Auslöser zurück.
 * Abnahme: homepage-bauer/pruefungen/probe_schublade_fokus_vorlage.py
 * (--laden dach|crystal). crystal-cacao.com trug das bis zum K1-Nachzug als
 * eigene Hülle SchubladenZugang.jsx.
 */
const FOKUSSIERBAR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function sichtbar(el) {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 * @param {{
 *   children?: React.ReactNode;
 *   type: AsideType;
 *   heading: React.ReactNode;
 * }}
 */
export function Aside({children, heading, type}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const titelId = useId();
  const asideRef = useRef(null);

  // Fokus hinein und beim Schließen zurück. Hängt NUR an expanded: close ist
  // je Provider-Render eine neue Funktion, ein Effekt mit [close] liefe bei
  // offener Schublade erneut und hielte dann den Fokus darin für den Auslöser.
  useEffect(() => {
    const aside = asideRef.current;
    if (!expanded || !aside) return undefined;
    const aktiv = document.activeElement;
    const ausloeser =
      aktiv && aktiv !== document.body && !aktiv.closest('.overlay') ? aktiv : null;
    // Im selben Takt wie das Öffnen greift focus() nicht (gemessen an crystal
    // 15.10.: der Fokus blieb am Auslöser), einen Bildwechsel später schon.
    let bild = 0;
    let rahmen = 0;
    const hinein = () => {
      if (aside.contains(document.activeElement)) return;
      const ziel =
        aside.querySelector('header button.close') ??
        [...aside.querySelectorAll(FOKUSSIERBAR)].find(sichtbar);
      ziel?.focus();
      if (!aside.contains(document.activeElement) && ++bild < 10) {
        rahmen = requestAnimationFrame(hinein);
      }
    };
    rahmen = requestAnimationFrame(hinein);
    return () => {
      cancelAnimationFrame(rahmen);
      // Nur zurückgeben, wenn der Fokus nirgends sonst hin wollte: noch in der
      // geschlossenen Schublade oder auf <body>.
      const jetzt = document.activeElement;
      if (
        ausloeser?.isConnected &&
        (!jetzt || jetzt === document.body || aside.contains(jetzt))
      ) {
        ausloeser.focus();
      }
    };
  }, [expanded]);

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event) {
          if (event.key === 'Escape') {
            close();
            return;
          }
          // Tab-Falle: Tab und Umschalt+Tab bleiben in der offenen Schublade.
          const aside = asideRef.current;
          if (event.key !== 'Tab' || !aside) return;
          const ziele = [...aside.querySelectorAll(FOKUSSIERBAR)].filter(sichtbar);
          if (!ziele.length) return;
          const erstes = ziele[0];
          const letztes = ziele[ziele.length - 1];
          const jetzt = document.activeElement;
          if (!aside.contains(jetzt)) {
            event.preventDefault();
            (event.shiftKey ? letztes : erstes).focus();
          } else if (event.shiftKey && jetzt === erstes) {
            event.preventDefault();
            letztes.focus();
          } else if (!event.shiftKey && jetzt === letztes) {
            event.preventDefault();
            erstes.focus();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      aria-labelledby={titelId}
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
    >
      <button
        className="close-outside"
        onClick={close}
        aria-label="Schließen"
        tabIndex={-1}
      />
      {/* Der Typ steht als Klasse am Element, weil derselbe Drawer drei sehr
          verschiedene Inhalte trägt (cart / search / mobile) und genau EINER
          davon sein Scrollen abgeben muss: beim Warenkorb scrollt die
          Positionsliste, bei Suche und Menü die Zone selbst. Ohne diesen
          Haken müsste das CSS über :has() raten. */}
      <aside className={`aside--${type}`} ref={asideRef}>
        {/* Bewusst KEIN <main>: ein Dokument hat genau ein main-Landmark
            (axe landmark-no-duplicate-main), und das steht in PageLayout.jsx.
            Bis 2026-10-09 lag hier ein <main> je Schublade -- vier auf jeder
            Seite, und document.querySelector('main') traf den Warenkorb statt
            den Seiteninhalt. Die Klasse trägt die bisherigen Regeln
            (app.css .overlay > aside > .aside-zone, reset.css). */}
        <div className="aside-zone">
        <header>
          <h3 id={titelId}>{heading === "MENU" ? 'Menü' : heading}</h3>
          <button className="close reset" onClick={close} aria-label="Schließen">
            &times;
          </button>
        </header>
          {children}

          </div>
      </aside>
    </div>
  );
}

const AsideContext = createContext(null);

Aside.Provider = function AsideProvider({children}) {
  const [type, setType] = useState('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}

/** @typedef {'search' | 'cart' | 'mobile' | 'closed'} AsideType */
/**
 * @typedef {{
 *   type: AsideType;
 *   open: (mode: AsideType) => void;
 *   close: () => void;
 * }} AsideContextValue
 */

/** @typedef {import('react').ReactNode} ReactNode */
