/**
 * Texte des eigenen Einwilligungshinweises auf crystal-cacao.com (BAUVERTRAG
 * Abschnitt 4 und 5, Grossjob 20261022-GROSSJOB-cookiebot-abloesen-eigener-
 * einwilligungshinweis-qiblanco, Segment s08).
 *
 * Gleicher Vertrag wie app/lib/einwilligung-texte.js im Global Deutsch-Shop
 * (qiblanco-storefront): TEXTE, texteFuer, texteHash, hinweisHtml, dieselben
 * Selektoren. Eigene Datei, weil dieser Laden andere Anbieter hat: Statistik =
 * Shopify, Marketing = unser eigener Messpixel und UpPromote (gemessen am
 * Quelltext 31.10.2026: kein Google, kein Clarity; das Meta-Pixel ist ohne
 * PUBLIC_META_PIXEL_ID aus). Kommt ein Anbieter dazu (etwa die Meta-ID), steigt
 * die Hauptnummer der Fassung, dann fragt der Hinweis alle neu.
 *
 * Sprachen (Z11 s03, 2026-11-11, Luecke 9 "Sprache je Besucher" wie Cookiebot):
 * Deutsch und Englisch. Der Server waehlt nach der ersten Browser-Sprache
 * (spracheFuer in einwilligung-schalter.js): Deutsch -> 'de', jede andere -> 'en'.
 * Der englische Text ist eine sinngetreue Uebersetzung von Crystals deutschem
 * Wortlaut (nicht der Text des Global Englisch-Shops: hier misst Marketing nur
 * Link und Empfehlung, es gibt keine Werbeanzeigen-Personalisierung).
 * Unbekannte Sprache faellt auf 'de' zurueck, auch im data-qb-sprache und im Hash.
 *
 * Seit Z11 s03 gibt es /pages/cookie-erklaerung auch auf diesem Laden (aus dem
 * Register des Einwilligungs-Scanners, app/data/cookie-register.json). Link im
 * Hinweis und im Dialog; der Linktext steht in ZUSATZ, damit TEXTE.de und sein
 * texte_hash e2ba2e95 byte-gleich bleiben.
 *
 * Die drei Knoepfe stehen woertlich so, wie Christian sie am 22.09. vorgegeben
 * hat: Cookies einstellen · Notwendige Cookies akzeptieren · Alle akzeptieren.
 */
export const EINWILLIGUNG_FASSUNG = '1.0';

export const TEXTE = {
  de: {
    bereich: 'Cookie-Hinweis',
    kurz:
      'Du kannst sofort weiterlesen und bestellen. Erlaubst du Statistik und Marketing, sehen wir, welche Seiten dir helfen und über welche Empfehlung du zu uns kommst.',
    einstellen: 'Cookies einstellen',
    notwendig: 'Notwendige Cookies akzeptieren',
    alle: 'Alle akzeptieren',
    dialogTitel: 'Cookie-Einstellungen',
    dialogText:
      'Wähle, was wir speichern dürfen. Deine Wahl kannst du jederzeit über „Cookie-Einstellungen“ unten auf der Seite ändern.',
    kategorien: {
      necessary: ['Notwendig', 'Warenkorb, Kasse, Sicherheit und deine Cookie-Wahl. Immer aktiv.'],
      preferences: ['Präferenzen', 'Merkt sich Einstellungen wie Sprache und Region.'],
      statistics: ['Statistik', 'Zeigt uns, welche Seiten und Sorten angesehen werden (Shopify).'],
      marketing: ['Marketing', 'Misst, über welchen Link oder welche Empfehlung du kommst (unser eigener Messpixel, UpPromote).'],
    },
    speichern: 'Auswahl speichern',
    zu: 'Schließen',
    datenschutz: 'Datenschutz',
    fussLink: 'Cookie-Einstellungen',
  },
  en: {
    bereich: 'Cookie notice',
    kurz:
      'You can keep reading and ordering right away. If you allow statistics and marketing, we see which pages help you and which recommendation brought you to us.',
    einstellen: 'Cookie settings',
    notwendig: 'Accept necessary cookies',
    alle: 'Accept all',
    dialogTitel: 'Cookie settings',
    dialogText:
      'Choose what we may store. You can change your choice at any time via “Cookie-Einstellungen” (cookie settings) at the bottom of the page.',
    kategorien: {
      necessary: ['Necessary', 'Cart, checkout, security and your cookie choice. Always on.'],
      preferences: ['Preferences', 'Remembers settings such as language and region.'],
      statistics: ['Statistics', 'Shows us which pages and varieties are viewed (Shopify).'],
      marketing: ['Marketing', 'Measures which link or recommendation brought you to us (our own measurement pixel, UpPromote).'],
    },
    speichern: 'Save selection',
    zu: 'Close',
    datenschutz: 'Privacy policy',
    fussLink: 'Cookie settings',
  },
};

/**
 * ZUSATZ (Z11 s03, Port von qiblanco-storefront s02): Texte, die nur in einer Lage erscheinen,
 * getrennt von TEXTE, damit der deutsche Wortlaut und sein texte_hash byte-gleich bleiben.
 *   optout       Opt-out-Weg fuer Besucher aus Opt-out-Regionen (Regelwerk je Region, Luecke 2).
 *   platzhalter  Platzhalter an einer blockierten Einbettung (Luecke 3), Knopf darunter.
 *   erklaerung   Linktext zur Cookie-Erklaerung (Arm E).
 */
export const ZUSATZ = {
  de: {
    optout: 'Meine Daten nicht verkaufen oder teilen',
    platzhalter: 'Das Video kommt von YouTube. Es lädt erst, wenn du Marketing-Cookies erlaubst.',
    platzhalterKnopf: 'Erlauben und abspielen',
    erklaerung: 'Cookie-Erklärung',
  },
  en: {
    optout: 'Do Not Sell or Share My Personal Information',
    platzhalter: 'This video is hosted by YouTube. It loads once you allow marketing cookies.',
    platzhalterKnopf: 'Allow and play',
    erklaerung: 'Cookie declaration',
  },
};

export function zusatzFuer(sprache) {
  return ZUSATZ[spracheGilt(sprache)];
}

/** Sprache, die es gibt: sonst 'de' (Markup, Hash und Protokoll nennen dieselbe). */
export function spracheGilt(sprache) {
  return TEXTE[sprache] ? sprache : 'de';
}

export function texteFuer(sprache) {
  return TEXTE[spracheGilt(sprache)];
}

// SHA-256, synchron und ohne Abhängigkeit (SSR und Browser rechnen gleich).
function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const K = [];
  const H = [];
  const frac = (x) => ((x - Math.floor(x)) * 0x100000000) >>> 0;
  for (let n = 2, i = 0; i < 64; n++) {
    let prim = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) prim = false;
    if (!prim) continue;
    if (i < 8) H.push(frac(Math.sqrt(n)));
    K.push(frac(Math.cbrt(n)));
    i++;
  }
  const len = bytes.length;
  const total = ((len + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(total);
  m.set(bytes);
  m[len] = 0x80;
  const bits = len * 8;
  const dv = new DataView(m.buffer);
  dv.setUint32(total - 8, Math.floor(bits / 0x100000000));
  dv.setUint32(total - 4, bits >>> 0);
  const w = new Uint32Array(64);
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) >>> 0));
  }
  return H.map((v) => v.toString(16).padStart(8, '0')).join('');
}

export function texteHash(sprache) {
  return sha256Hex(JSON.stringify(texteFuer(sprache))).slice(0, 8);
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

/**
 * Markup von Banner und Dialog (Selektoren = Vertrag für die Proben, s05).
 * `entschieden`: am Server gelesene gültige Wahl -> Banner startet verborgen.
 */
export function hinweisHtml(roh, {entschieden = false} = {}) {
  const sprache = spracheGilt(roh);
  const t = texteFuer(sprache);
  const z = zusatzFuer(sprache);
  // Opt-out-Weg (Luecke 2): im Server-HTML verborgen; qb-einwilligung.js zeigt ihn nur, wenn das Regelwerk
  // der Region Opt-out ist (data-qb-region ausserhalb der strict-Liste).
  const optout =
    `<p class="qb-ew-optout" data-qb-optout hidden><a href="#" data-qb-wahl="optout">${esc(z.optout)}</a></p>`;
  const kat = ['preferences', 'statistics', 'marketing']
    .map(
      (k) =>
        `<label class="qb-ew-kat"><span class="qb-ew-kat__kopf"><input type="checkbox" data-qb-kategorie="${k}">` +
        `<strong>${esc(t.kategorien[k][0])}</strong></span><span class="qb-ew-kat__text">${esc(t.kategorien[k][1])}</span></label>`,
    )
    .join('');
  return (
    `<div id="qb-einwilligung" data-qb-einwilligung="banner" role="region" aria-label="${esc(t.bereich)}"` +
    ` data-qb-fassung="${EINWILLIGUNG_FASSUNG}" data-qb-sprache="${sprache}" data-qb-texte-hash="${texteHash(sprache)}"` +
    ` lang="${sprache}" data-qb-ph-text="${esc(z.platzhalter)}" data-qb-ph-knopf="${esc(z.platzhalterKnopf)}"` +
    `${entschieden ? ' hidden' : ''}>` +
    `<p class="qb-ew-text">${esc(t.kurz)} <a href="/pages/cookie-erklaerung">${esc(z.erklaerung)}</a></p>` +
    `<div class="qb-ew-knoepfe">` +
    `<button type="button" class="qb-ew-knopf qb-ew-knopf--leise" data-qb-wahl="einstellungen">${esc(t.einstellen)}</button>` +
    `<button type="button" class="qb-ew-knopf qb-ew-knopf--grau" data-qb-wahl="notwendig">${esc(t.notwendig)}</button>` +
    `<button type="button" class="qb-ew-knopf qb-ew-knopf--gold" data-qb-wahl="alle">${esc(t.alle)}</button>` +
    `</div>${optout}</div>` +
    `<div id="qb-einwilligung-dialog" data-qb-einwilligung="dialog" role="dialog" aria-modal="false" aria-labelledby="qb-ew-titel" hidden>` +
    `<button type="button" class="qb-ew-zu" data-qb-wahl="zu" aria-label="${esc(t.zu)}">×</button>` +
    // Kein <h2>: der Hinweis steht als erstes body-Kind im Server-HTML JEDER Seite; ein h2 dort änderte die
    // Abschnittsüberschriften aller Gewinnerseiten (Gewinnerschutz-Tor, s06-r6). role=heading trägt die Semantik.
    `<div id="qb-ew-titel" class="qb-ew-titel" role="heading" aria-level="2">${esc(t.dialogTitel)}</div>` +
    `<p class="qb-ew-text">${esc(t.dialogText)}</p>` +
    `<label class="qb-ew-kat"><span class="qb-ew-kat__kopf"><input type="checkbox" checked disabled>` +
    `<strong>${esc(t.kategorien.necessary[0])}</strong></span><span class="qb-ew-kat__text">${esc(t.kategorien.necessary[1])}</span></label>` +
    kat +
    `<div class="qb-ew-knoepfe">` +
    `<button type="button" class="qb-ew-knopf qb-ew-knopf--grau" data-qb-wahl="auswahl">${esc(t.speichern)}</button>` +
    `<button type="button" class="qb-ew-knopf qb-ew-knopf--gold" data-qb-wahl="alle">${esc(t.alle)}</button>` +
    `</div>${optout}<p class="qb-ew-links"><a href="/pages/cookie-erklaerung">${esc(z.erklaerung)}</a> · <a href="/pages/datenschutz">${esc(t.datenschutz)}</a></p></div>`
  );
}
