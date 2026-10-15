import {useEffect, useRef} from 'react';
import {useAside} from '~/components/Aside';

/*
 * SCHUBLADE UND MENUE FUER TASTATUR UND SCREENREADER (Befund C06, 13.10.2026)
 *
 * Gemessen am 13.10.: Warenkorb-Schublade und Menue liessen den Fokus am
 * Ausloeser, 3x Tab fuehrte in den Seiteninhalt dahinter, Escape liess ihn
 * dort liegen. Der Dialog (role=dialog, aria-modal) hatte keinen Namen, die
 * Schliessflaeche `.close-outside` war fokussierbar und namenlos.
 *
 * Die Schublade selbst ist app/components/Aside.jsx und Vorlagen-Klasse K1:
 * der Laden aendert sie nicht (shared/UPSTREAM.json). Diese Huelle sitzt
 * daneben im Provider, liest denselben Zustand (useAside) und arbeitet nur
 * am fertigen DOM der Schublade, die sie ueber ihre Klasse `aside--<typ>`
 * findet:
 *   1. Name: aria-labelledby zeigt auf die Ueberschrift der Schublade.
 *   2. Die Schliessflaeche heisst „Schließen“ und faellt aus der Tab-Folge
 *      (die Maus trifft sie weiter; der Schliessen-Knopf im Kopf bleibt).
 *   3. Beim Oeffnen geht der Fokus in die Schublade, Tab und Umschalt+Tab
 *      bleiben darin, beim Schliessen kehrt er zum Ausloeser zurueck.
 * Zieht die Vorlage das selbst in Aside.jsx ein, wird diese Datei samt
 * Einbau in PageLayout.jsx entfernt (Probe: proben/probe_schublade_fokus.py).
 */

const FOKUSSIERBAR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function schubladeZu(typ) {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`.overlay > aside.aside--${typ}`)?.parentElement ?? null;
}

function benennen() {
  for (const overlay of document.querySelectorAll('.overlay[role="dialog"]')) {
    const typ = [...(overlay.querySelector(':scope > aside')?.classList ?? [])]
      .find((k) => k.startsWith('aside--'))
      ?.slice('aside--'.length);
    const titel = overlay.querySelector('aside header h3');
    if (typ && titel) {
      if (!titel.id) titel.id = `cc-schublade-${typ}-titel`;
      overlay.setAttribute('aria-labelledby', titel.id);
    }
    const flaeche = overlay.querySelector(':scope > .close-outside');
    if (flaeche) {
      flaeche.setAttribute('aria-label', 'Schließen');
      flaeche.tabIndex = -1;
    }
  }
}

function sichtbar(el) {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

export function SchubladenZugang() {
  const {type} = useAside();
  const ausloeser = useRef(null);
  const offen = type && type !== 'closed';

  useEffect(() => {
    benennen();
  }, [type]);

  useEffect(() => {
    if (!offen) return undefined;
    const overlay = schubladeZu(type);
    const aside = overlay?.querySelector(':scope > aside');
    if (!aside) return undefined;

    if (!ausloeser.current) {
      const aktiv = document.activeElement;
      ausloeser.current = aktiv && aktiv !== document.body && !overlay.contains(aktiv) ? aktiv : null;
    }
    const ziele = () => [...aside.querySelectorAll(FOKUSSIERBAR)].filter(sichtbar);
    // Der Fokus wird ueber einige Bildwechsel nachgesetzt: im selben Takt wie
    // das Oeffnen greift focus() nicht (gemessen am Kandidaten 15.10.: der
    // Fokus blieb am Ausloeser), einen Bildwechsel spaeter schon.
    let bild = 0;
    let rahmen = 0;
    const hinein = () => {
      if (aside.contains(document.activeElement)) return;
      (aside.querySelector('header button.close') ?? ziele()[0])?.focus();
      if (!aside.contains(document.activeElement) && ++bild < 10) {
        rahmen = requestAnimationFrame(hinein);
      }
    };
    rahmen = requestAnimationFrame(hinein);

    const taste = (event) => {
      if (event.key !== 'Tab') return;
      const liste = ziele();
      if (!liste.length) return;
      const erstes = liste[0];
      const letztes = liste[liste.length - 1];
      const aktiv = document.activeElement;
      if (!aside.contains(aktiv)) {
        event.preventDefault();
        (event.shiftKey ? letztes : erstes).focus();
      } else if (event.shiftKey && aktiv === erstes) {
        event.preventDefault();
        letztes.focus();
      } else if (!event.shiftKey && aktiv === letztes) {
        event.preventDefault();
        erstes.focus();
      }
    };
    document.addEventListener('keydown', taste);
    return () => {
      cancelAnimationFrame(rahmen);
      document.removeEventListener('keydown', taste);
    };
  }, [offen, type]);

  useEffect(() => {
    if (offen) return;
    const ziel = ausloeser.current;
    ausloeser.current = null;
    if (!ziel || !ziel.isConnected) return;
    const aktiv = document.activeElement;
    // Nur zurueckgeben, wenn der Fokus nirgends sonst hin wollte: in der
    // geschlossenen Schublade oder auf <body>. Ein Link im Menue, der die
    // Seite wechselt, behaelt seine eigene Fokusfuehrung.
    if (!aktiv || aktiv === document.body || aktiv.closest('.overlay')) {
      ziel.focus();
    }
  }, [offen]);

  return null;
}
