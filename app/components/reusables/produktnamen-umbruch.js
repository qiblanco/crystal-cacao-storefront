/**
 * PRODUKTNAMEN NIE TRENNEN (Christian 22.11.2026, Job 20261122-prio1-shop-
 * design-header-flagge-waehrung-iphone-knoepfe-umbruch-us-glanz-bf-store):
 * „das wieder G1.1 und dann ist das 1 in der neuen Zeile … idealerweise
 * vermeidet man solche Zeilenumbrüche, wo man so einen Namen auseinander macht.“
 *
 * Ersetzt in Textknoten die Leerzeichen INNERHALB fester Wortgruppen durch
 * ein geschütztes Leerzeichen (U+00A0): Produktnamen mit Nummer/Zusatz und
 * Zahl + Einheit. Startet nach der Hydration des Root (root.jsx, useEffect)
 * und danach für jeden neuen Text (MutationObserver). Idempotent: ein
 * zweiter Lauf ändert nichts mehr.
 *
 * NUR HYDRIERTEN TEXT ANFASSEN (Repair 20261122-prio6-repair-qiblanco-
 * hydration-umbruchschutz): der Root-Effekt läuft, bevor nachgeladene
 * Suspense-Grenzen (Await/Streaming) hydriert sind. Wer deren Text vorher
 * ändert, lässt React beim Hydrieren anderen Text finden: #418/#425, dann
 * verwirft React das Server-HTML (#422), auf jeder Seite. Deshalb prüft
 * `zustand` je Textknoten: hat React ihn (oder sein Elternelement) schon
 * hydriert, ist er frei; liegt er in einer noch nicht hydrierten Grenze,
 * wartet er und wird später erneut geprüft (Zeitplan + erste Eingabe);
 * DOM, das nie React gehört (Einwilligungs-Dialog, fremde Skripte), ist frei.
 *
 * QUELLE DER MUSTER für beide Shops: diese Datei. Der Global Englisch-Shop
 * trägt eine Kopie (us-qiblanco-2024 assets/produktnamen-umbruch.js) mit
 * denselben Mustern plus den englischen Einheiten.
 * Reine Funktion `schuetze` ohne DOM: node --test-fähig
 * (test/produktnamen-umbruch.test.mjs).
 */

const NB = ' ';

/**
 * Muster: jede Gruppe ist eine Folge von Wörtern, zwischen denen nie
 * umbrochen werden darf. Das ® darf direkt am Namen oder mit hochgestelltem
 * Zeichen stehen; Leerzeichen auch schon geschützt (idempotent).
 */
const LZ = '[ \\u00A0]+';
export const MUSTER = [
  // QiOne® 1 / QiOne 2 / QiOne® 2 Pro / QiOne® 2 Pro Kette
  new RegExp(`QiOne®?${LZ}\\d+(?:${LZ}Pro)?(?:${LZ}(?:Kette|Necklace))?`, 'g'),
  // Qi Alpha® (Qi + Alpha), Qi Blanco, Qi Master
  new RegExp(`Qi${LZ}(?:Alpha|Blanco|Master)®?`, 'g'),
  // QiHome Air
  new RegExp(`QiHome®?${LZ}Air`, 'g'),
  // Zahl + Einheit / Zählwort (deutsch und englisch)
  new RegExp(
    `\\d+(?:[.,]\\d+)?${LZ}(?:Prozent|percent|%|Tage|Tagen|days|Stunden|hours|Minuten|minutes|Jahre|Jahren|years|Wochen|weeks|Monate|Monaten|months|mm|cm|m|km|g|kg|mg|Hz|GHz|MHz|€|EUR|CHF|USD|THB|GBP|Studien|studies|Bewertungen|reviews|x|×)(?![\\p{L}\\d])`,
    'gu',
  ),
];

/**
 * Schützt alle Wortgruppen in einem Text.
 * @param {string} text
 * @returns {string}
 */
export function schuetze(text) {
  if (!text || !/\s/.test(text)) return text;
  let aus = text;
  for (const m of MUSTER) {
    m.lastIndex = 0;
    aus = aus.replace(m, (treffer) => treffer.replace(/ +/g, NB));
  }
  return aus;
}

/**
 * Text direkt hinter einem abgesetzten ®: das führende Leerzeichen vor der
 * Nummer bzw. vor „Air“/„Pro“ wird geschützt („QiOne® 2 Pro“).
 * @param {string} text
 * @returns {string}
 */
export function nachMarke(text) {
  return String(text || '').replace(
    /^[ \u00A0]+(?:\d+(?:[ \u00A0]+Pro)?|Air|Pro)(?![\p{L}])/u,
    (t) => t.replace(/ +/g, NB),
  );
}

const UEBERSPRINGEN = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'NOSCRIPT', 'TEMPLATE']);

// React hängt beim Hydrieren (und beim Erzeugen im Browser) diese Schlüssel
// an jeden Knoten, den es besitzt: __reactFiber$<zufall>, __reactProps$<zufall>.
// Server-HTML einer noch nicht hydrierten Grenze trägt sie nicht.
function reactSchluessel(knoten, praefix) {
  if (!knoten || typeof knoten !== 'object') return null;
  const schluessel = Object.keys(knoten);
  for (let i = 0; i < schluessel.length; i++) {
    if (schluessel[i].startsWith(praefix)) return schluessel[i];
  }
  return null;
}
const hatFiber = (k) => reactSchluessel(k, '__reactFiber$') !== null;

// Suspense-Marken im Server-HTML (React 18): <!--$--> fertig, <!--$?--> wartet,
// <!--$!--> Rückfall im Browser, <!--/$--> Ende. Liegt `kind` unter `eltern`
// zwischen einer offenen und ihrer schließenden Marke, gehört es zu einer Grenze.
function inGrenze(eltern, kind) {
  let tiefe = 0;
  const kinder = eltern.childNodes || [];
  for (let i = 0; i < kinder.length; i++) {
    const k = kinder[i];
    if (k === kind) return tiefe > 0;
    if (k.nodeType === 8) {
      if (k.data === '$' || k.data === '$?' || k.data === '$!') tiefe++;
      else if (k.data === '/$' && tiefe > 0) tiefe--;
    }
  }
  return false;
}

/**
 * Darf der Schutz diesen Textknoten jetzt ändern?
 * 'frei'   – React hat ihn hydriert, er gehört nie React, oder es gibt hier
 *            gar kein React (Test, Seite ohne Hydration).
 * 'warten' – Server-Text einer noch nicht hydrierten Suspense-Grenze;
 *            später erneut prüfen.
 * 'nie'    – nicht anfassen (kein Elternknoten, Skript/Stil/Eingabe,
 *            Streaming-Ablage <div hidden id="S:…">, die React gleich
 *            an ihren Platz verschiebt; dort meldet ihn der Beobachter neu).
 * @param {Node} text
 * @returns {'frei'|'warten'|'nie'}
 */
export function zustand(text) {
  const p = text && text.parentNode;
  if (!p || UEBERSPRINGEN.has(p.nodeName) || p.isContentEditable) return 'nie';
  if (hatFiber(text) || hatFiber(p)) return 'frei';
  let kind = text;
  let ahn = p;
  while (ahn && !hatFiber(ahn)) {
    if (ahn.nodeName === 'DIV' && ahn.hidden && /^S:/.test(ahn.id || '')) return 'nie';
    kind = ahn;
    ahn = ahn.parentNode;
  }
  if (!ahn) return 'frei';
  const props = ahn[reactSchluessel(ahn, '__reactProps$')];
  if (props && props.dangerouslySetInnerHTML) return 'frei';
  return inGrenze(ahn, kind) ? 'warten' : 'frei';
}

function aendereText(knoten) {
  const alt = knoten.nodeValue;
  let neu = schuetze(alt);
  // Das ® steht oft als eigenes <sup> (MarkeR): „QiOne“<sup>®</sup>„ 1.“.
  // Dann beginnt der nächste Textknoten mit dem Leerzeichen vor der Nummer.
  const vor = knoten.previousSibling;
  if (vor && vor.nodeType === 1 && /^\s*®\s*$/.test(vor.textContent || '')) {
    neu = nachMarke(neu);
  }
  if (neu !== alt) knoten.nodeValue = neu;
}

// Nachprüf-Abstände in ms für wartende Knoten (Grenzen hydrieren meist binnen
// einer Sekunde; Eingaben lösen zusätzlich eine Prüfung aus).
const NACHPRUEFEN_MS = [50, 150, 400, 1000, 2000, 4000, 8000, 15000, 30000];

/**
 * Startet den Schutz für das ganze Dokument. Gibt eine Stopp-Funktion zurück.
 * Wirft nie: ein Fehler lässt die Seite unberührt.
 * @param {Document} doc
 */
export function starteUmbruchSchutz(doc) {
  try {
    if (!doc?.body) return () => {};
    const win = doc.defaultView || globalThis;
    // Wartende Knoten -> wie oft schon nacheinander 'frei' gesehen. Erst beim
    // zweiten Mal ändern: eine Grenze, die gerade hydriert, ist dann committet.
    const wartend = new Map();
    let schritt = 0;
    let uhr = null;
    let gestoppt = false;

    const behandle = (knoten) => {
      if (knoten.nodeType === 3) {
        const z = zustand(knoten);
        if (z === 'frei') aendereText(knoten);
        else if (z === 'warten' && !wartend.has(knoten)) {
          wartend.set(knoten, 0);
          schritt = 0;
        }
        return;
      }
      if (knoten.nodeType !== 1 || UEBERSPRINGEN.has(knoten.nodeName)) return;
      const gaenger = doc.createTreeWalker(knoten, 4);
      let t = gaenger.nextNode();
      while (t) {
        behandle(t);
        t = gaenger.nextNode();
      }
    };

    const nachpruefen = () => {
      uhr = null;
      if (gestoppt) return;
      wartend.forEach((gesehen, knoten) => {
        if (!knoten.isConnected) return void wartend.delete(knoten);
        const z = zustand(knoten);
        if (z === 'nie') return void wartend.delete(knoten);
        if (z !== 'frei') return void wartend.set(knoten, 0);
        if (gesehen >= 1) {
          wartend.delete(knoten);
          aendereText(knoten);
        } else wartend.set(knoten, 1);
      });
      plane();
    };

    // Frühester Termin gewinnt: ein späterer Wunsch verschiebt nie einen
    // früheren (Scrollen feuert dauernd und darf die Prüfung nicht aufschieben).
    let faellig = 0;
    const plane = (sofort) => {
      if (gestoppt || wartend.size === 0) return;
      let ms;
      if (sofort) ms = 50;
      else if (schritt < NACHPRUEFEN_MS.length) ms = NACHPRUEFEN_MS[schritt];
      else return;
      const jetzt = Date.now();
      if (uhr && faellig <= jetzt + ms) return;
      if (uhr) win.clearTimeout(uhr);
      if (!sofort) schritt++;
      faellig = jetzt + ms;
      uhr = win.setTimeout(nachpruefen, ms);
    };

    // Eine Eingabe in einer noch nicht hydrierten Grenze lässt React sie
    // sofort hydrieren: danach kurz nachprüfen, auch nach Ablauf des Zeitplans.
    const beiEingabe = () => plane(true);
    const EREIGNISSE = ['pointerdown', 'keydown', 'focusin', 'scroll'];
    EREIGNISSE.forEach((e) => doc.addEventListener(e, beiEingabe, {capture: true, passive: true}));

    behandle(doc.body);
    const beobachter = new MutationObserver((liste) => {
      for (const m of liste) {
        if (m.type === 'characterData') behandle(m.target);
        else m.addedNodes.forEach(behandle);
      }
      plane();
    });
    beobachter.observe(doc.body, {childList: true, subtree: true, characterData: true});
    plane();
    return () => {
      gestoppt = true;
      beobachter.disconnect();
      if (uhr) win.clearTimeout(uhr);
      EREIGNISSE.forEach((e) => doc.removeEventListener(e, beiEingabe, {capture: true}));
      wartend.clear();
    };
  } catch {
    return () => {};
  }
}
