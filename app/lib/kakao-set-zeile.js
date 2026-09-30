/*
 * Kakao-Sets im Warenkorb: zwei oder drei Packungen Kakao liegen als
 * Set-Zeile (natives Shopify-Bundle, Menge 1) im Warenkorb, nicht als
 * Einzelpackungen mit Menge 2 oder 3.
 *
 * WARUM (Großjob Partnercodes und Sets vom 29.09.2026, Segment s03,
 * Christian: "Partnercodes gelten auch für die 3er-Sets"):
 * mit Menge 2/3 macht die Shopify-Automatik "Mengenrabatt 2x/3x Crystal
 * Cacao" den Staffelpreis. Sie ist ein Produktrabatt, und zwei Produktrabatte
 * stapeln auf derselben Zeile nicht: ein Partnercode fällt mit
 * DISCOUNT_CODE_NOT_HONOURED weg (gemessen 2026-09-29, Julies Bestellung
 * #13532). Die Set-Produkte kosten auf den Cent den Staffelpreis (EUR) und
 * tragen keine Automatik — dort greift der Code.
 *
 * GEMISCHTE SORTEN (Elina, EL-20260930-9c7bdd63: "das Mischen verschiedener
 * Cacao-Sorten innerhalb eines Sets soll explizit erlaubt sein"): Awake und
 * Create zusammen laufen in dieselbe Automatik und verloren den Code genauso
 * (gemessen 2026-09-30 am Laden, 1+1, 2+1 und 1+2, beide Domains). Dafür gibt
 * es seit dem 2026-09-30 drei gemischte Set-Produkte, gleicher Staffelpreis.
 *
 * DIE NORMALFORM WIRD ÜBER DIE GANZE KAKAO-MENGE GEBILDET, NIE JE ZEILE.
 * Die Automatik zählt Awake und Create ZUSAMMEN (und das Angebot "Create &
 * Awake"), und ein Set trägt sie nicht. Gemessen 2026-09-29: Set-2 x2 kostet
 * 228,04 statt 198,92 (ab 4x 30 %), Awake x1 + Set-2 kostet 185,05 statt
 * 148,60. Ein Umleger je Zeile wäre dort ein Aufpreis. Darum:
 *   - insgesamt 2 oder 3 Packungen Awake/Create, keine fremde Kakao-Zeile
 *     -> EINE Set-Zeile x1 in genau dieser Zusammensetzung (wenn sie nicht
 *     teurer ist, siehe .server.js)
 *   - sonst je Sorte eine Einzelpackung x Gesamtmenge, also der Weg über die
 *     Automatik wie bisher (ab 4 Packungen, Angebot).
 *
 * Diese Datei ist rein (kein Netz, kein Server-Import): der Warenkorb-Stepper
 * (CartLineItem.jsx) liest daraus, wie viele Packungen eine Set-Zeile trägt.
 */

/** Die Sorten in fester Reihenfolge (sie bestimmt auch den Set-Schlüssel). */
export const KAKAO_SORTEN = ['awake', 'create'];

export const KAKAO_EINZEL = {
  awake: 'crystal-cacao-awake',
  create: 'crystal-cacao-create',
};

/**
 * Set je Zusammensetzung, Schlüssel "<awake>+<create>" in Packungen.
 * Die gemischten Sets sind am 2026-09-30 angelegt (Shopify-Bundles,
 * Komponenten Awake/Create, Preis 114,02 bzw. 148,60 wie die Sorten-Sets).
 */
export const KAKAO_SETS = {
  '2+0': 'bundle-2x-awake',
  '3+0': 'bundle-3x-awake',
  '0+2': 'mengenrabatt-2x',
  '0+3': 'mengenrabatt-3x-create',
  '1+1': 'bundle-1x-awake-1x-create',
  '2+1': 'bundle-2x-awake-1x-create',
  '1+2': 'bundle-1x-awake-2x-create',
};

/** Handle -> Packungen je Sorte je Zeilen-Einheit. */
export const KAKAO_ZEILEN = {
  [KAKAO_EINZEL.awake]: {awake: 1, create: 0},
  [KAKAO_EINZEL.create]: {awake: 0, create: 1},
  ...Object.fromEntries(
    Object.entries(KAKAO_SETS).map(([schluessel, handle]) => {
      const [awake, create] = schluessel.split('+').map(Number);
      return [handle, {awake, create}];
    }),
  ),
};

/** Set-Schlüssel einer Zusammensetzung. */
export function setSchluessel(je) {
  return KAKAO_SORTEN.map((s) => je[s] || 0).join('+');
}

/**
 * Set-Zeile? Dann {packungen, je: {awake, create}, sorte, gemischt},
 * sonst null (auch für Einzelpackungen). `sorte` ist bei gemischten Sets null.
 */
export function kakaoSetArt(handle) {
  const je = KAKAO_ZEILEN[handle];
  if (!je) return null;
  const packungen = KAKAO_SORTEN.reduce((s, x) => s + je[x], 0);
  if (packungen < 2) return null;
  const sorten = KAKAO_SORTEN.filter((x) => je[x] > 0);
  return {
    packungen,
    je: {...je},
    sorte: sorten.length === 1 ? sorten[0] : null,
    gemischt: sorten.length > 1,
  };
}

/*
 * Eine Kakao-Zeile, die diese Datei nicht kennt (crystal-cacao-angebot,
 * crystal-cacao-adfiefiale): sie zählt in die Automatik, also darf daneben
 * kein Set entstehen — es verlöre die Automatik für die ganze Menge.
 */
function istFremdeKakaoZeile(handle) {
  return (
    typeof handle === 'string' &&
    handle.startsWith('crystal-cacao') &&
    !KAKAO_ZEILEN[handle]
  );
}

/**
 * Was am Warenkorb zu tun ist, damit er in der Normalform steht.
 *
 * @param {Array<{id: string, quantity: number, handle: string}>} zeilen
 * @returns {null | {
 *   einzelform: Array<{id: string, handle: string, quantity: number}>,
 *   entfernen: string[],
 *   hinzu: Array<{handle: string, quantity: number}>,
 *   kandidat: null | {je: object, packungen: number, gemischt: boolean,
 *     einzel: Array<{handle: string, packungen: number}>, set: string},
 * }}
 *   Schritt 1 (`einzelform`/`entfernen`/`hinzu`): je Sorte EINE
 *   Einzelpackungs-Zeile mit der Gesamtmenge. Vorhandene Zeilen werden dabei
 *   an Ort umgelegt; neu angelegt wird nur, wenn eine Sorte keine Zeile mehr
 *   hat (eine gemischte Set-Zeile ist EINE Zeile für zwei Sorten).
 *   `kandidat`: Schritt 2, diese Einzelzeilen auf das Set umlegen, sofern das
 *   Set nicht teurer ist. null: nichts zu tun.
 */
export function kakaoZeilenPlan(zeilen) {
  const kakao = (zeilen || []).filter((z) => KAKAO_ZEILEN[z.handle]);
  if (!kakao.length) return null;
  const fremd = zeilen.some((z) => istFremdeKakaoZeile(z.handle));

  const je = {awake: 0, create: 0};
  for (const z of kakao) {
    const menge = Number(z.quantity) || 0;
    for (const s of KAKAO_SORTEN) je[s] += KAKAO_ZEILEN[z.handle][s] * menge;
  }
  const gesamt = je.awake + je.create;
  const soll = !fremd && (gesamt === 2 || gesamt === 3)
    ? KAKAO_SETS[setSchluessel(je)]
    : null;

  if (soll) {
    const [z] = kakao;
    if (kakao.length === 1 && z.handle === soll && z.quantity === 1) {
      return null;
    }
  }

  // Schritt 1: Ziel je Sorte = eine Einzelpackung mit der Gesamtmenge.
  // Zuordnung Zeile -> Ziel: zuerst die Zeile, die schon diese Einzelpackung
  // ist, dann eine Set-Zeile nur dieser Sorte, dann jede übrige Zeile.
  const ziele = KAKAO_SORTEN.filter((s) => je[s] > 0).map((s) => ({
    sorte: s,
    handle: KAKAO_EINZEL[s],
    quantity: je[s],
  }));
  const frei = [...kakao];
  const nimm = (pruefe) => {
    const i = frei.findIndex(pruefe);
    return i < 0 ? null : frei.splice(i, 1)[0];
  };
  const nurSorte = (z, s) =>
    KAKAO_SORTEN.every((x) => (x === s) === KAKAO_ZEILEN[z.handle][x] > 0);
  const zuordnung = ziele.map((ziel) => ({
    ziel,
    zeile:
      nimm((z) => z.handle === ziel.handle) ||
      nimm((z) => nurSorte(z, ziel.sorte)),
  }));
  for (const eintrag of zuordnung) {
    if (!eintrag.zeile) eintrag.zeile = nimm(() => true);
  }

  const einzelform = [];
  const hinzu = [];
  for (const {ziel, zeile} of zuordnung) {
    if (!zeile) {
      hinzu.push({handle: ziel.handle, quantity: ziel.quantity});
    } else if (zeile.handle !== ziel.handle || zeile.quantity !== ziel.quantity) {
      einzelform.push({id: zeile.id, handle: ziel.handle, quantity: ziel.quantity});
    }
  }
  const entfernen = frei.map((z) => z.id);

  const kandidat = soll
    ? {
        je: {...je},
        packungen: gesamt,
        gemischt: ziele.length > 1,
        einzel: ziele.map((z) => ({handle: z.handle, packungen: z.quantity})),
        set: soll,
      }
    : null;

  if (!einzelform.length && !entfernen.length && !hinzu.length && !kandidat) {
    return null;
  }
  return {einzelform, entfernen, hinzu, kandidat};
}

/**
 * Das Sorten-Set derselben Packungszahl (für die Untergrenze gemischter
 * Sets, siehe .server.js): {awake: handle|null, create: handle|null}.
 */
export function sortenSetsGleicherMenge(packungen) {
  return {
    awake: KAKAO_SETS[`${packungen}+0`] ?? null,
    create: KAKAO_SETS[`0+${packungen}`] ?? null,
  };
}

/**
 * Stepper auf einer Set-Zeile: aus der Wunsch-Packungszahl wird die
 * Zusammensetzung je Sorte. "+" legt eine Packung der Sorte dazu, von der
 * das Set mehr hat (bei Gleichstand Awake), "−" nimmt eine von der Sorte,
 * von der es mehr hat (bei Gleichstand Create). Bei Sorten-Sets bleibt es
 * bei der einen Sorte, wie bisher.
 *
 * @param {{awake: number, create: number}} je  Zusammensetzung des Sets
 * @param {number} packungen  Wunsch (>= 0)
 * @returns {{awake: number, create: number}}
 */
export function stepperZusammensetzung(je, packungen) {
  const neu = {awake: je.awake || 0, create: je.create || 0};
  let delta = packungen - (neu.awake + neu.create);
  while (delta > 0) {
    const s = neu.create > neu.awake ? 'create' : 'awake';
    neu[s] += 1;
    delta -= 1;
  }
  while (delta < 0) {
    const s = neu.awake > neu.create ? 'awake' : 'create';
    if (neu[s] === 0) break;
    neu[s] -= 1;
    delta += 1;
  }
  return neu;
}
