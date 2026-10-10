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
 * JEDE MENGE (Christian, 30.09.2026: "mit 2, mit 3, mit 4, mit 5, mit einer
 * und auch gemischt über die Sorten hinweg", Nachtrag 01.10. 00:05: "nicht
 * von 1 bis 5, sondern für jede Menge, auch 20"). Ab 4 Packungen macht die
 * Automatik "ab 4x" 30 %, und auch dort fiel der Code weg. Seit dem
 * 2026-09-30 gibt es Sets der Größen 4, 5, 6 und 7 in jeder Zusammensetzung
 * (26 Stück, Großjob 20260930-GROSSJOB-kakao-partnercodes-alle-mengen-und-
 * mengenrabatt-gemischt, s02). Ab 4 Packungen ist die Stufe linear (49,73 EUR
 * netto bzw. 69,30 USD je Packung), also ist jede Menge ab 8 centgleich als
 * Summe von Sets der Größen 4 bis 7 darstellbar.
 *
 * DIE NORMALFORM WIRD ÜBER DIE GANZE KAKAO-MENGE GEBILDET, NIE JE ZEILE.
 * Die Automatik zählt Awake und Create ZUSAMMEN (und das Angebot "Create &
 * Awake"), und ein Set trägt sie nicht. Gemessen 2026-09-29: Set-2 x2 kostet
 * 228,04 statt 198,92 (ab 4x 30 %), Awake x1 + Set-2 kostet 185,05 statt
 * 148,60. Ein Umleger je Zeile wäre dort ein Aufpreis. Darum, keine fremde
 * Kakao-Zeile vorausgesetzt:
 *   - 1 Packung -> die Einzelpackung
 *   - 2 bis 7 Packungen -> EINE Set-Zeile x1 in genau dieser Zusammensetzung
 *   - ab 8 Packungen -> Set-Zeilen der Größen 4 bis 7, die Sorten so
 *     gleichmäßig verteilt, dass möglichst wenige verschiedene Zeilen
 *     entstehen (12 Awake + 8 Create = Set 3+2 x4)
 *   - jeweils nur, wenn es nicht teurer und nicht billiger ist (.server.js)
 *   - sonst (fremde Kakao-Zeile, Preisschutz greift) je Sorte eine
 *     Einzelpackung x Gesamtmenge, also der Weg über die Automatik.
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
 * Die Größen 4 bis 7 ebenfalls am 2026-09-30 (s02, alle Zusammensetzungen,
 * netto 198,92 / 248,65 / 298,38 / 348,11 EUR, USD fest 277,20 / 346,50 /
 * 415,80 / 485,10 = der Warenkorbpreis der Automatik auf den Cent).
 */
export const KAKAO_SETS = {
  '2+0': 'bundle-2x-awake',
  '3+0': 'bundle-3x-awake',
  '0+2': 'mengenrabatt-2x',
  '0+3': 'mengenrabatt-3x-create',
  '1+1': 'bundle-1x-awake-1x-create',
  '2+1': 'bundle-2x-awake-1x-create',
  '1+2': 'bundle-1x-awake-2x-create',
  // 4 Packungen
  '4+0': 'bundle-4x-awake',
  '3+1': 'bundle-3x-awake-1x-create',
  '2+2': 'bundle-2x-awake-2x-create',
  '1+3': 'bundle-1x-awake-3x-create',
  '0+4': 'bundle-4x-create',
  // 5 Packungen
  '5+0': 'bundle-5x-awake',
  '4+1': 'bundle-4x-awake-1x-create',
  '3+2': 'bundle-3x-awake-2x-create',
  '2+3': 'bundle-2x-awake-3x-create',
  '1+4': 'bundle-1x-awake-4x-create',
  '0+5': 'bundle-5x-create',
  // 6 Packungen
  '6+0': 'bundle-6x-awake',
  '5+1': 'bundle-5x-awake-1x-create',
  '4+2': 'bundle-4x-awake-2x-create',
  '3+3': 'bundle-3x-awake-3x-create',
  '2+4': 'bundle-2x-awake-4x-create',
  '1+5': 'bundle-1x-awake-5x-create',
  '0+6': 'bundle-6x-create',
  // 7 Packungen
  '7+0': 'bundle-7x-awake',
  '6+1': 'bundle-6x-awake-1x-create',
  '5+2': 'bundle-5x-awake-2x-create',
  '4+3': 'bundle-4x-awake-3x-create',
  '3+4': 'bundle-3x-awake-4x-create',
  '2+5': 'bundle-2x-awake-5x-create',
  '1+6': 'bundle-1x-awake-6x-create',
  '0+7': 'bundle-7x-create',
};

/** Set-Größen, aus denen eine Menge ab 8 Packungen zusammengesetzt wird. */
export const SET_GROESSE_MIN = 4;
export const SET_GROESSE_MAX = 7;

/*
 * Rein technische Obergrenze der Zerlegung (die Suche ist quadratisch in der
 * Menge). Keine Geschäftsregel: der Online-Bestand erlaubt heute höchstens 22
 * Packungen je Sorte in einem Warenkorb. Darüber bleibt der alte Weg.
 */
export const KAKAO_NORMALFORM_MAX = 999;

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

/*
 * Verteilt eine Menge auf m Sets: Größen so gleich wie möglich (die größeren
 * zuerst), Awake ebenso, die zusätzlichen Awake-Packungen auf die größeren
 * Sets. Dabei bleibt jede Awake-Zahl unter der Set-Größe: ist floor(a/m)
 * gleich floor(n/m), liegt der Awake-Rest nie über dem Größen-Rest.
 */
function aufMSets(awake, create, m) {
  const n = awake + create;
  const q = Math.floor(n / m);
  const r = n % m;
  const ka = Math.floor(awake / m);
  const ra = awake % m;
  const zaehler = new Map();
  for (let i = 0; i < m; i += 1) {
    const groesse = q + (i < r ? 1 : 0);
    const a = ka + (i < ra ? 1 : 0);
    const schluessel = `${a}+${groesse - a}`;
    zaehler.set(schluessel, (zaehler.get(schluessel) || 0) + 1);
  }
  return [...zaehler.entries()];
}

/**
 * Die Soll-Zeilen der Normalform für eine Zusammensetzung, oder null, wenn
 * es kein Set gibt (1 Packung, mehr als KAKAO_NORMALFORM_MAX, fehlendes Set).
 * Ab 8 Packungen: Set-Zeilen der Größen 4 bis 7; gewählt wird die Setzahl
 * mit den wenigsten verschiedenen Zeilen, bei Gleichstand die kleinste.
 * Gleiche Sets liegen als EINE Zeile mit Menge im Warenkorb.
 *
 * @param {{awake: number, create: number}} je
 * @returns {null | Array<{handle: string, quantity: number,
 *   je: {awake: number, create: number}}>}
 */
export function kakaoSollZeilen(je) {
  const awake = je?.awake || 0;
  const create = je?.create || 0;
  const n = awake + create;
  if (n < 2 || n > KAKAO_NORMALFORM_MAX) return null;
  const zeile = ([schluessel, quantity]) => {
    const handle = KAKAO_SETS[schluessel];
    if (!handle) return null;
    const [a, c] = schluessel.split('+').map(Number);
    return {handle, quantity, je: {awake: a, create: c}};
  };
  if (n <= SET_GROESSE_MAX) {
    const z = zeile([setSchluessel({awake, create}), 1]);
    return z ? [z] : null;
  }
  let beste = null;
  const bis = Math.floor(n / SET_GROESSE_MIN);
  for (let m = Math.ceil(n / SET_GROESSE_MAX); m <= bis; m += 1) {
    const zeilen = aufMSets(awake, create, m).map(zeile);
    if (zeilen.some((z) => !z)) continue;
    if (!beste || zeilen.length < beste.length) beste = zeilen;
  }
  return beste;
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
 *     einzel: Array<{handle: string, packungen: number}>,
 *     sets: Array<{handle: string, quantity: number, je: object}>,
 *     set: string | null},
 * }}
 *   Schritt 1 (`einzelform`/`entfernen`/`hinzu`): je Sorte EINE
 *   Einzelpackungs-Zeile mit der Gesamtmenge. Vorhandene Zeilen werden dabei
 *   an Ort umgelegt; neu angelegt wird nur, wenn eine Sorte keine Zeile mehr
 *   hat (eine gemischte Set-Zeile ist EINE Zeile für zwei Sorten).
 *   `kandidat`: Schritt 2, diese Einzelzeilen auf die Set-Zeilen `sets`
 *   umlegen, sofern das nicht teurer und nicht billiger ist. `set` ist der
 *   Handle, wenn es genau eine Set-Zeile x1 ist, sonst null.
 *   null: nichts zu tun.
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
  const soll = fremd ? null : kakaoSollZeilen(je);

  // Steht der Warenkorb schon genau in den Soll-Zeilen, ist nichts zu tun.
  if (
    soll &&
    kakao.length === soll.length &&
    soll.every((s) =>
      kakao.some((z) => z.handle === s.handle && Number(z.quantity) === s.quantity),
    )
  ) {
    return null;
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
        sets: soll,
        set: soll.length === 1 && soll[0].quantity === 1 ? soll[0].handle : null,
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

/*
 * Rundungsspielraum der Untergrenze ab 4 Packungen: Shopify rundet die
 * Automatik je Einzelzeile auf den Cent, das Set hat einen festen Preis. Mehr
 * als ein Cent je Einzelzeile unter dem Einzelweg wäre ein Preisnachlass, den
 * niemand entschieden hat — dann bleibt der alte Weg.
 */
export const ANKER_TOLERANZ_CENT_JE_ZEILE = 1;

/*
 * Länder, deren Markt KEINE Preisliste in der Landeswährung hat (gemessen
 * 2026-10-07): LI und GB im Markt international (Basis USD), PL und SE im
 * Markt eu (Basis EUR). Shopify rechnet dort Einzelpackung und Set aus der
 * Basis um und rundet jeden Preis auf eine ganze Einheit AUF. In der Basis
 * kostet das Set auf den Cent die Stufe; in der Landeswährung entsteht die
 * Abweichung allein aus diesen Aufrundungen: die der Einzelpackung wirkt im
 * Einzelweg mit 0,7 je Packung, die des Sets einmal je Set. Gemessen an allen
 * 26 Sets: LI -2,00 bis -3,50 CHF, GB -1,60 bis -3,30 GBP, PL +0,40 bis
 * +0,70 PLN, SE -0,40 bis +0,20 SEK. Ein Festpreis kann das nicht heilen,
 * weil es keine Preisliste in dieser Währung gibt. Vor dem 06.10. legten
 * diese Besucher im EUR-Warenkorb ab und zahlten an der Kasse genau diesen
 * umgerechneten Set-Betrag mit Code. Spielraum ab 4 Packungen deshalb die
 * Rundung selbst: höchstens UMRECHNUNG_EINHEIT_CENT je Packung darunter und
 * je Set-Stück darüber. Ein neu freigeschalteter Markt ohne eigene Preisliste
 * gehört hier hinein (die Nachtmessung des Partner-Managers meldet ihn).
 */
export const UMRECHNUNGS_LAENDER = ['LI', 'GB', 'PL', 'SE'];
export const UMRECHNUNG_EINHEIT_CENT = 100;

/*
 * FESTBETRÄGE AB 4 PACKUNGEN (Christian 09.10.2026 auf die Frage "Kakao-Staffel
 * ab 4 Packungen als Festbeträge 213, 319 und 372 €: ja oder nein?": "ja zu 5";
 * Job 20261009-update-kakao-staffel-ab-4-festbetraege). Die 30-%-Stufe der
 * Automatik ergibt nach dem Brutto-Kipp bei 4, 6 und 7 Packungen Cent
 * (4 x 76 x 0,7 = 212,80; 319,20; 372,40). Der Kipp schreibt die Sets auf
 * ganze Beträge (213 / 266 / 319 / 372), und der Anker "Einzelweg" lehnte den
 * Tausch dann ab: der Partnercode griff ab 4 Packungen nicht mehr. Hier ist
 * der Festbetrag selbst der Anker.
 *
 * SCHARF NUR, WENN ALLES ZUSAMMEN STIMMT: Land DE (seit 10.10. auch CH/CHF
 * und US/USD, siehe unten), Währung EUR, Preismodus
 * brutto (Shop-Metafeld qb_preis.modus, das der Kipp setzt) und JEDE Set-Zeile
 * kostet auf den Cent den Festbetrag ihrer Größe. Vor dem Kipp stehen die Sets
 * netto (198,92 usw.), dann greift der Anker nie und alles bleibt wie es ist.
 * Länder ohne Tabelle bleiben beim Einzelweg.
 * Ab 8 Packungen zählt jede Set-Zeile mit ihrem Festbetrag (4+4 = 426 €).
 */
/*
 * GANZE FRANKEN UND DOLLAR (Christian 09./10.10.2026: "man müsste den Wert in
 * Schweizer Franken auf keine Nachkommastelle reduzieren", "einfach lösen
 * lassen"; Job 20261010-update-kakao-mengen-schweiz-ganze-franken). Derselbe
 * Weg wie DE. In CH kostet Awake 78 und Create 77 CHF, darum hat jede
 * Zusammensetzung ihren eigenen Betrag; der Schlüssel ist dort "<awake>+<create>"
 * (wie KAKAO_SETS), in DE und US die Packungszahl. Die Regel: Sorten-Sets so
 * ganz, dass der Stückpreis mit der Menge nie steigt (Awake 219 / 273 / 327 /
 * 381 statt 218,40 / 273 / 327,60 / 382,20), gemischte Sets der nächste
 * Franken zwischen Create- und Awake-Set. Hergeleitet und geprüft in
 * partner-manager/src/pm_kakao_festbetrag.py, dort muss dieselbe Tabelle
 * stehen (Naht-Probe probe_kakao_festbetrag_naht__20261010.py). Die
 * CHF-Festpreise schreibt der Takt kakao-set-chf, die USD-Festpreise stehen
 * in der Preisliste International.
 */
export const KAKAO_FESTBETRAG_CENT = {
  DE: {EUR: {4: 21300, 5: 26600, 6: 31900, 7: 37200}},
  CH: {
    CHF: {
      '4+0': 21900, '3+1': 21800, '2+2': 21700, '1+3': 21600, '0+4': 21600,
      '5+0': 27300, '4+1': 27200, '3+2': 27200, '2+3': 27100, '1+4': 27000, '0+5': 27000,
      '6+0': 32700, '5+1': 32700, '4+2': 32600, '3+3': 32600, '2+4': 32500, '1+5': 32400, '0+6': 32400,
      '7+0': 38100, '6+1': 38100, '5+2': 38100, '4+3': 38000, '3+4': 37900, '2+5': 37900, '1+6': 37800, '0+7': 37700,
    },
  },
  US: {USD: {4: 27800, 5: 34700, 6: 41600, 7: 48500}},
};

/**
 * Trifft der Warenkorb die Festbeträge? Alle Bedingungen oben, sonst false.
 * Je Set-Zeile zählt zuerst der Betrag ihrer Zusammensetzung (`je`), sonst
 * der ihrer Packungszahl.
 *
 * @param {{land?: string, waehrung?: string, brutto?: boolean,
 *   sets?: Array<{packungen: number, cent: number,
 *     je?: {awake: number, create: number}}>}} p
 * @returns {boolean}
 */
export function kakaoFestbetragGetroffen({land, waehrung, brutto, sets}) {
  if (brutto !== true) return false;
  const tabelle =
    KAKAO_FESTBETRAG_CENT[String(land || '').toUpperCase()]?.[waehrung];
  if (!tabelle || !Array.isArray(sets) || !sets.length) return false;
  return sets.every((s) => {
    if (!Number.isFinite(s?.cent)) return false;
    const soll = s?.je ? tabelle[setSchluessel(s.je)] : undefined;
    return (soll ?? tabelle[s?.packungen]) === s.cent;
  });
}

/**
 * Preisschutz des Set-Tauschs, in Cent und im Markt des Warenkorbs.
 *
 *   NIE TEURER: Summe der Set-Zeilen <= Einzelzeilen vor Code (nach der
 *   Automatik). Gilt für jede Menge.
 *   NIE BILLIGER, zwei Anker, im Code benannt:
 *     - 2 bis 3 Packungen, gemischt: nicht unter dem billigsten Sorten-Set
 *       derselben Packungszahl (Elina EL-20260930-9c7bdd63). Die Sorten-Sets
 *       selbst sind der Anker und haben keine Untergrenze (USD 159/210 liegen
 *       seit 12/2025 unter der Automatik, Bestandsstufe).
 *     - ab 4 Packungen, jede Mischung: nicht unter dem Einzelweg mit
 *       Automatik (s03, 2026-09-30). Für 4 bis 7 sind die Sorten-Sets selbst
 *       neu, ein älteres Set als Maßstab gibt es nicht. Toleranz
 *       ANKER_TOLERANZ_CENT_JE_ZEILE je Einzelzeile.
 *   UMGERECHNETE WÄHRUNG (umgerechnet, Land in UMRECHNUNGS_LAENDER), ab 4
 *   Packungen: Spielraum ist Shopifys Aufrundung, höchstens
 *   UMRECHNUNG_EINHEIT_CENT je Set-Stück darüber und je Packung darunter.
 *   FESTBETRAG (festbetrag, siehe kakaoFestbetragGetroffen), ab 4 Packungen:
 *   der entschiedene Betrag ist der Anker, ohne Vergleich mit dem Einzelweg.
 *
 * @param {{packungen: number, gemischt: boolean, setCent: number,
 *   zeileCent: number, einzelZeilen: number, sortenSetCent?: number,
 *   umgerechnet?: boolean, setStueck?: number, festbetrag?: boolean}} p
 * @returns {{ok: boolean, grund: string}}
 */
export function kakaoPreisschutz({
  packungen,
  gemischt,
  setCent,
  zeileCent,
  einzelZeilen,
  sortenSetCent,
  umgerechnet,
  setStueck,
  festbetrag,
}) {
  if (!Number.isFinite(setCent) || !Number.isFinite(zeileCent)) {
    return {ok: false, grund: 'preis_unlesbar'};
  }
  if (festbetrag === true && packungen >= SET_GROESSE_MIN) {
    return {ok: true, grund: 'anker_festbetrag'};
  }
  if (umgerechnet && packungen >= SET_GROESSE_MIN) {
    if (setCent > zeileCent + UMRECHNUNG_EINHEIT_CENT * (setStueck || 1)) {
      return {ok: false, grund: 'nie_teurer_als_umrechnung'};
    }
    if (setCent < zeileCent - UMRECHNUNG_EINHEIT_CENT * packungen) {
      return {ok: false, grund: 'nie_billiger_als_umrechnung'};
    }
    return {ok: true, grund: 'anker_einzelweg_umrechnung'};
  }
  if (setCent > zeileCent) return {ok: false, grund: 'nie_teurer'};
  if (packungen >= SET_GROESSE_MIN) {
    const untergrenze = zeileCent - ANKER_TOLERANZ_CENT_JE_ZEILE * (einzelZeilen || 1);
    if (setCent < untergrenze) return {ok: false, grund: 'nie_billiger_als_automatik'};
    return {ok: true, grund: 'anker_einzelweg'};
  }
  if (gemischt) {
    if (!Number.isFinite(sortenSetCent)) return {ok: false, grund: 'sorten_set_unlesbar'};
    if (setCent < sortenSetCent) return {ok: false, grund: 'nie_billiger_als_sorten_set'};
    return {ok: true, grund: 'anker_sorten_set'};
  }
  return {ok: true, grund: 'sorten_set'};
}

/**
 * Stepper auf einer Set-Zeile, ganze Zeile gerechnet (Set x Zeilenmenge):
 * welche Einzelpackung die Zeile danach trägt und welche zweite Sorte vorher
 * als eigene Zeile dazukommt. Die Normalform legt daraus wieder Sets — erst
 * dort sitzt der Preisschutz, deshalb nie ein direkter Sprung auf ein Set.
 *
 * @param {string} handle  Set-Handle der Zeile
 * @param {number} zeilenMenge  aktuelle Menge der Zeile (Sets)
 * @param {number} packungen  Wunsch in Packungen für die ganze Zeile
 * @returns {null | {zeile: {handle: string, quantity: number},
 *   dazu: null | {handle: string, quantity: number}}}
 */
export function stepperEinzelZeilen(handle, zeilenMenge, packungen) {
  const art = kakaoSetArt(handle);
  const menge = Math.max(1, Number.parseInt(zeilenMenge, 10) || 1);
  if (!art || !(packungen >= 1 && packungen <= KAKAO_NORMALFORM_MAX)) return null;
  const neu = stepperZusammensetzung(
    {awake: art.je.awake * menge, create: art.je.create * menge},
    packungen,
  );
  const sorte = neu.create > neu.awake ? 'create' : 'awake';
  const andere = sorte === 'awake' ? 'create' : 'awake';
  return {
    zeile: {handle: KAKAO_EINZEL[sorte], quantity: neu[sorte]},
    dazu: neu[andere] > 0 ? {handle: KAKAO_EINZEL[andere], quantity: neu[andere]} : null,
  };
}
