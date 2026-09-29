/*
 * Kakao-Sets im Warenkorb: zwei oder drei Packungen EINER Sorte liegen als
 * Set-Zeile (natives Shopify-Bundle, Menge 1) im Warenkorb, nicht als
 * Einzelpackung mit Menge 2 oder 3.
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
 * DIE NORMALFORM WIRD ÜBER DIE GANZE KAKAO-MENGE GEBILDET, NIE JE ZEILE.
 * Die Automatik zählt Awake und Create ZUSAMMEN (und das Angebot "Create &
 * Awake"), und ein Set trägt sie nicht. Gemessen 2026-09-29: Set-2 x2 kostet
 * 228,04 statt 198,92 (ab 4x 30 %), Awake x1 + Set-2 kostet 185,05 statt
 * 148,60. Ein Umleger je Zeile wäre dort ein Aufpreis. Darum:
 *   - genau EINE Sorte mit 2 oder 3 Packungen, keine fremde Kakao-Zeile
 *     -> Set-Zeile x1 (wenn sie nicht teurer ist, siehe .server.js)
 *   - sonst Einzelpackung x Gesamtmenge je Sorte, also der Weg über die
 *     Automatik wie bisher (ab 4 Packungen, gemischte Sorten, Angebot).
 *
 * Diese Datei ist rein (kein Netz, kein Server-Import): der Warenkorb-Stepper
 * (CartLineItem.jsx) liest daraus, wie viele Packungen eine Set-Zeile trägt.
 */

/** Handle -> Sorte und Packungen je Zeilen-Einheit. */
export const KAKAO_ZEILEN = {
  'crystal-cacao-awake': {sorte: 'awake', packungen: 1},
  'crystal-cacao-create': {sorte: 'create', packungen: 1},
  'bundle-2x-awake': {sorte: 'awake', packungen: 2},
  'bundle-3x-awake': {sorte: 'awake', packungen: 3},
  'mengenrabatt-2x': {sorte: 'create', packungen: 2},
  'mengenrabatt-3x-create': {sorte: 'create', packungen: 3},
};

export const KAKAO_EINZEL = {
  awake: 'crystal-cacao-awake',
  create: 'crystal-cacao-create',
};

export const KAKAO_SET = {
  awake: {2: 'bundle-2x-awake', 3: 'bundle-3x-awake'},
  create: {2: 'mengenrabatt-2x', 3: 'mengenrabatt-3x-create'},
};

/** Set-Zeile? Dann {sorte, packungen}, sonst null (auch für Einzelpackungen). */
export function kakaoSetArt(handle) {
  const art = KAKAO_ZEILEN[handle];
  return art && art.packungen > 1 ? art : null;
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
 *   kandidat: null | {sorte: string, packungen: number, einzel: string, set: string},
 * }}
 *   `einzelform`/`entfernen`: Schritt 1, alle Kakao-Zeilen einer Sorte auf
 *   EINE Einzelpackungs-Zeile mit der Gesamtmenge. `kandidat`: Schritt 2,
 *   diese Zeile auf das Set umlegen, sofern das Set nicht teurer ist.
 *   null: nichts zu tun.
 */
export function kakaoZeilenPlan(zeilen) {
  const kakao = (zeilen || []).filter((z) => KAKAO_ZEILEN[z.handle]);
  if (!kakao.length) return null;
  const fremd = zeilen.some((z) => istFremdeKakaoZeile(z.handle));

  const jeSorte = {};
  for (const z of kakao) {
    const art = KAKAO_ZEILEN[z.handle];
    const menge = Number(z.quantity) || 0;
    jeSorte[art.sorte] ??= {packungen: 0, zeilen: []};
    jeSorte[art.sorte].packungen += art.packungen * menge;
    jeSorte[art.sorte].zeilen.push(z);
  }
  const sorten = Object.keys(jeSorte);
  const eine = sorten.length === 1 ? jeSorte[sorten[0]] : null;
  const setFaehig =
    !fremd && eine && (eine.packungen === 2 || eine.packungen === 3);

  if (setFaehig) {
    const soll = KAKAO_SET[sorten[0]][eine.packungen];
    const [z] = eine.zeilen;
    if (eine.zeilen.length === 1 && z.handle === soll && z.quantity === 1) {
      return null;
    }
  }

  const einzelform = [];
  const entfernen = [];
  for (const sorte of sorten) {
    const {packungen, zeilen: zs} = jeSorte[sorte];
    const [erste, ...rest] = zs;
    const einzel = KAKAO_EINZEL[sorte];
    if (erste.handle !== einzel || erste.quantity !== packungen) {
      einzelform.push({id: erste.id, handle: einzel, quantity: packungen});
    }
    entfernen.push(...rest.map((z) => z.id));
  }

  const kandidat = setFaehig
    ? {
        sorte: sorten[0],
        packungen: eine.packungen,
        einzel: KAKAO_EINZEL[sorten[0]],
        set: KAKAO_SET[sorten[0]][eine.packungen],
      }
    : null;

  if (!einzelform.length && !entfernen.length && !kandidat) return null;
  return {einzelform, entfernen, kandidat};
}
