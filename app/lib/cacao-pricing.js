import {
  anzeigeSatz,
  formatPreis,
  kassenAnzeige,
  staffelModellAnzeige,
} from './markt-pricing.js';
import {KAKAO_EINZEL, KAKAO_SETS} from './kakao-set-zeile.js';

/**
 * KAKAO-MENGENSTAFFEL — die Rechnung hinter Kaufbox, Preisblock und
 * Sortenvergleich der Kakao-Kaufseiten. Ausgezogen aus CacaoProductForm.jsx
 * (Job 20261006-preisanzeige-rest-laender-achse-staffel-fremdwaehrung), damit
 * sie ohne React mit `node --test` prüfbar ist und crystal-cacao.com sie
 * byte-gleich übernehmen kann. CacaoProductForm.jsx exportiert cacaoPricing
 * weiter unter dem alten Namen; kein Aufrufer ändert sich.
 *
 * GESCHÄFTSREGEL (Prozente + Badges), KEINE Preiszahlen (M2, Auftrag
 * 20260718-lp-preise-dynamisch-binden-gestuft). Die Prozente spiegeln die
 * Shopify-Automatik "Mengenrabatt 2x/3x Crystal Cacao®" (Cart-Probe
 * 2026-07-18: Rabatt pro Einheit centgenau abgeschnitten, 71,03 x 20 % =
 * 14,206 -> 14,20). Der Packungspreis wird aus dem API-Preis der Variante
 * abgeleitet:
 *   round((netto - trunc2(netto * rabatt)) * (1 + satz))
 * — reproduziert exakt 76/61/53 beim heutigen Netto 71,03 (satz 7 %).
 */
export const CACAO_STAFFEL = {
  '1': {rabattProzent: 0, badge: 'Exklusiv', badgeStyle: 'gold'},
  '2': {rabattProzent: 20, badge: 'Angebot', badgeStyle: 'red'},
  '3': {rabattProzent: 30, badge: 'Bestseller Angebot', badgeStyle: 'gradient'},
};

// FAIL-CLOSED: letzter bekannter guter Stand (DE/EUR-Anzeige), wenn der
// API-Preis fehlt — nie 0/leer/falsch. preiswatch hält die Werte synchron.
const CACAO_FALLBACK = {
  '1': {einzel: 76, compareAt: null},
  '2': {einzel: 61, compareAt: 76},
  '3': {einzel: 53, compareAt: 76},
};

export const PACKUNG_GRAMM = 420;

function formatPer100g(wert, waehrung) {
  if (waehrung === 'USD') {
    return `$${wert.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} / 100g`;
  }
  const de = wert.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return waehrung === 'EUR' ? `${de}€ / 100g` : `${de} ${waehrung} / 100g`;
}

/**
 * Netto-Zeilenbetrag der Kasse für diese Menge, aus dem Warenkorb gelesen
 * (ladeStaffelKasse unten), oder null. Gilt nur für eine Menge mit
 * Rabatt und nur in der Währung, in der er gelesen wurde.
 * @param {{waehrung: string, zeilen: Object<string, number>}|null|undefined} staffelKasse
 * @param {number} menge
 * @param {string} waehrung
 * @returns {number|null}
 */
function kassenZeile(staffelKasse, menge, waehrung) {
  if (!staffelKasse || staffelKasse.waehrung !== waehrung) return null;
  const n = Number(staffelKasse.zeilen?.[String(menge)]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Staffel-Anzeige je Menge, DYNAMISCH aus dem API-Preis der Variante.
 * @param {string} quantity '1' | '2' | '3'
 * @param {object} [selectedVariant] Variante mit price {amount, currencyCode}
 * @param {string} [handle] Produkt-Handle (Steuersatz-Zuordnung, 7 % Kakao)
 * @param {string} [land] ISO-Land des aufgelösten Marktes (Default DE)
 * @param {{waehrung: string, zeilen: Object<string, number>}|null} [staffelKasse]
 *   Netto-Zeilenbeträge der Kasse je Menge (nur außerhalb des EUR-Markts)
 */
export function cacaoPricing(quantity, selectedVariant, handle, land, staffelKasse) {
  const staffel = CACAO_STAFFEL[quantity] || CACAO_STAFFEL['1'];
  const netto = Number.parseFloat(selectedVariant?.price?.amount);
  let waehrung = selectedVariant?.price?.currencyCode || 'EUR';
  let einzel;
  let compareAt;
  let gesamtNum;
  let compareAtGesamtNum = null;
  const menge = Number.parseInt(quantity, 10) || 1;
  // NICHT-EUR-MAERKTE: DER RABATT KOMMT AUS DEM WARENKORB (2026-10-06).
  // Der Mengenrabatt ist seit dem 2026-09-12 ein FESTBETRAG in EUR; Shopify
  // rechnet ihn je Markt per Wechselkurs um. Diesen Kurs gibt die
  // Storefront-API nicht heraus, und die Rundung je Einheit ist nicht
  // nachzubauen. Gemessen am Kundenrand war jede hier gerechnete Zahl
  // geraten (US 3x bewarb 207,00 USD, die Kasse belastete 220,69 USD).
  // Darum liest der Loader den Zeilenbetrag aus einem Warenkorb des Landes
  // (staffelKasse, Job 20261006-preisanzeige-rest): CH 2x 115,34 CHF netto,
  // mal 1,081 = 124,68 CHF an der Kasse. Fehlt er (Frist, Fehler), bleibt
  // der Stand vom 2026-09-12: Listenpreis und "Mengenrabatt im Warenkorb".
  // Der Prozentsatz kommt dann aus den echten Beträgen (CH 2x 19 statt 20),
  // denn der Festbetrag trifft in fremder Währung keine runde Quote.
  // Im EUR-Markt bleibt die Rechnung unverändert: dort trifft der Festbetrag
  // den runden DE-Bruttobetrag exakt.
  const zeileKasse =
    waehrung !== 'EUR' && staffel.rabattProzent > 0 && Number.isFinite(netto)
      ? kassenZeile(staffelKasse, menge, waehrung)
      : null;
  let rabattProzent = waehrung === 'EUR' ? staffel.rabattProzent : 0;
  if (zeileKasse != null) {
    rabattProzent = Math.round((1 - zeileKasse / (netto * menge)) * 100);
  }
  const rabattImWarenkorb =
    waehrung !== 'EUR' && staffel.rabattProzent > 0 && zeileKasse == null;
  const istDE = String(land || 'DE').toUpperCase() === 'DE';
  if (Number.isFinite(netto)) {
    const satz = anzeigeSatz(handle, waehrung, land);
    const modellProzent = waehrung === 'EUR' ? rabattProzent : 0;
    const rabattProEinheit =
      Math.floor(netto * (modellProzent / 100) * 100) / 100;
    // Staffelpreis ist ein MODELL des Festbetrags (markt-pricing.js,
    // staffelModellAnzeige): DE gerundet (3x Modell 53,21, Kasse 53,00).
    einzel = staffelModellAnzeige((netto - rabattProEinheit) * (1 + satz), land);
    // KASSENBETRAG DER ZEILE außerhalb DE (Grossjob 20261004 preisanzeige,
    // s03): der
    // Festbetrag ist so gesetzt, dass der DE-Bruttobetrag ganz ist. Die
    // Netto-Zeile nach Rabatt ist also der DE-Ganzbetrag durch (1 + DE-Satz),
    // auf den Cent: 3x 159 / 1,07 = 148,60, 2x 122 / 1,07 = 114,02 (gemessen
    // als Cart-Zeile 2026-10-04, Kassenmessung s02 vom 2026-10-04).
    // Darauf kommt der Satz des Landes: AT 3x 148,60 x 1,10 = 163,46 = Kasse.
    // Packungspreis mal Menge wäre 1 Cent daneben (78,13 x 3 = 234,39, Kasse
    // 71,03 x 3 x 1,10 = 234,40), darum rechnet der Gesamtbetrag die Zeile.
    let nettoZeile = netto * menge;
    if (zeileKasse != null) {
      nettoZeile = zeileKasse;
    } else if (modellProzent > 0) {
      const satzDE = anzeigeSatz(handle, waehrung, 'DE');
      const deGanz = Math.round((netto - rabattProEinheit) * (1 + satzDE));
      nettoZeile = Math.round(((deGanz * menge) / (1 + satzDE)) * 100) / 100;
    }
    if (istDE) {
      gesamtNum = einzel * menge;
    } else {
      gesamtNum = kassenAnzeige(nettoZeile * (1 + satz), land);
      einzel = kassenAnzeige(gesamtNum / menge, land);
    }
    if (rabattProzent > 0) {
      compareAt = kassenAnzeige(netto * (1 + satz), land);
      compareAtGesamtNum = kassenAnzeige(netto * menge * (1 + satz), land);
    } else {
      compareAt = null;
    }
  } else {
    if (typeof console !== 'undefined') {
      console.warn(
        `[preis-fallback] Kakao-Staffel ${quantity}x: API-Preis fehlt, letzter bekannter Stand wird gezeigt.`,
      );
    }
    const fallback = CACAO_FALLBACK[quantity] || CACAO_FALLBACK['1'];
    waehrung = 'EUR';
    einzel = fallback.einzel;
    compareAt = fallback.compareAt;
    gesamtNum = einzel * menge;
    compareAtGesamtNum = compareAt != null ? compareAt * menge : null;
  }
  // TEILBAR (Punkt 8 des Auftrags 20261006-preisanzeige-rest): ergibt der
  // Packungspreis mal Menge den Zeilenbetrag auf den Cent? In DE immer (der
  // Festbetrag trifft 61 und 53 genau). AT 3x nicht: 163,46 / 3 = 54,4867,
  // "54,49 pro Packung" mal 3 wären 163,47. Dann nennt die Seite den
  // Zeilenbetrag ("163,46 € für 3 Packungen") statt einer Rechnung, die um
  // einen Cent danebenliegt.
  const teilbar = Math.round(einzel * 100) * menge === Math.round(gesamtNum * 100);
  // GESAMTPREIS DES KAUFKNOPFS (Job rtbefund-kopfpreis-vs-kaufmenge-wache-
  // 20260924): der Knopf legt `quantity` Packungen in den Warenkorb, also ist
  // DAS der Betrag, den ein Klick kostet. In DE trifft der Festbetrag seit
  // 2026-09-12 den runden Bruttobetrag je Packung exakt, darum ist dort
  // Packungspreis mal Menge gleich dem Warenkorb (gemessen 2026-09-24 per
  // cartCreate: 76 / 122 / 159). Außerhalb DE rechnet er die Zeile (oben).
  return {
    price: formatPreis(einzel, waehrung, 'pdp'),
    priceNum: einzel,
    compareAt: compareAt != null ? formatPreis(compareAt, waehrung, 'pdp') : null,
    menge,
    gesamt: formatPreis(gesamtNum, waehrung, 'pdp'),
    gesamtNum,
    teilbar,
    compareAtGesamt:
      compareAtGesamtNum != null
        ? formatPreis(compareAtGesamtNum, waehrung, 'pdp')
        : null,
    // Grundpreis aus dem exakten Zeilenbetrag, nicht aus einer gerundeten Zahl.
    per100g: formatPer100g(gesamtNum / menge / (PACKUNG_GRAMM / 100), waehrung),
    badge: staffel.badge,
    badgeStyle: staffel.badgeStyle,
    rabattProzent,
    rabattImWarenkorb,
  };
}

/**
 * Betrag einer Staffel-Option, wie die Auswahl ihn nennt: der Packungspreis,
 * wenn Packungspreis mal Menge den Zeilenbetrag trifft, sonst der
 * Zeilenbetrag selbst ("163,46 € für 3 Packungen").
 * @param {ReturnType<typeof cacaoPricing>} pricing
 * @returns {string}
 */
export function staffelBetragText(pricing) {
  return pricing.teilbar
    ? `${pricing.price} pro Packung`
    : `${pricing.gesamt} für ${pricing.menge} Packungen`;
}

/**
 * Dropdown-Optionen der Mengenstaffel (Preise dynamisch abgeleitet).
 * @param {object} [selectedVariant]
 * @param {string} [handle]
 * @param {string} [land]
 * @param {{waehrung: string, zeilen: Object<string, number>}|null} [staffelKasse]
 */
export function cacaoSizeOptions(selectedVariant, handle, land, staffelKasse) {
  return ['3', '2', '1'].map((value) => {
    const pricing = cacaoPricing(value, selectedVariant, handle, land, staffelKasse);
    const rabatt =
      pricing.rabattProzent > 0 ? `${pricing.rabattProzent}% Rabatt | ` : '';
    // Fehlt der Zeilenbetrag aus dem Warenkorb, nennt die Zeile außerhalb des
    // EUR-Markts den Listenpreis und sagt, dass der Mengenrabatt im Warenkorb
    // abgezogen wird — statt einen Staffelpreis zu versprechen, den die Kasse
    // nicht einlöst (siehe cacaoPricing).
    const hinweis = pricing.rabattImWarenkorb
      ? ' | Mengenrabatt im Warenkorb'
      : '';
    return {
      value,
      label: `${value}x ${PACKUNG_GRAMM}g | ${rabatt}${staffelBetragText(pricing)}${hinweis}`,
    };
  });
}

/* ───────── Staffel-Kasse (Loader-Seite) ───────── */

/**
 * STAFFEL-KASSE — der Zeilenbetrag, den die Kasse für 2 und 3 Packungen Kakao
 * in einem Nicht-EUR-Markt nimmt, gelesen aus einem Warenkorb des Landes.
 * (Job 20261006-preisanzeige-rest-laender-achse-staffel-fremdwaehrung,
 * Punkt 2; Grossjob 20261004 preisanzeige, s02 Klasse 6.)
 *
 * WARUM AUS DEM WARENKORB: der Mengenrabatt ist ein Festbetrag in EUR, den
 * Shopify je Markt per Wechselkurs umrechnet. Den Kurs gibt die
 * Storefront-API nicht heraus, und die Rundung ist nicht nachzubauen
 * (gemessen 2026-10-06: CH 2x 142,00 -> 115,34 CHF, 3x 213,00 -> 151,67 CHF;
 * US 2x 198 -> 165,91 USD). Die Seite nannte deshalb seit dem 2026-09-12
 * den Listenpreis mal Menge mit "Mengenrabatt im Warenkorb"; die Kasse
 * nahm weniger. Der Warenkorb rechnet den Rabatt genau so wie die Kasse.
 *
 * WAS ENTSTEHT: je Menge ein Warenkorb über die Storefront-API, ohne Kunde,
 * ohne Kasse, ohne Cookie für den Besucher (die Kennung wird nirgends
 * gespeichert). Shopify verwirft solche Warenkörbe nach Ablauf. Der Wert wird
 * je Variante und Land im Speicher gehalten (ABLAGE_MS), damit nicht jeder
 * Seitenabruf zwei Warenkörbe anlegt. Im EUR-Markt passiert nichts: dort
 * trifft die Rechnung der Seite die Kasse ohne Warenkorb.
 *
 * WARUM IN DIESER DATEI UND NICHT IN EINER .server.js: die Funktion braucht
 * nichts Geheimes, nur den Storefront-Client, den der Loader übergibt. Eine
 * eigene Datei hätte eine neue Freigabe im Deploy-Tor gebraucht; diese hier
 * ist freigegeben (deploy.conf ALLOW_GLOB app/lib/cacao-pricing.js) und
 * erreicht nur die zwei Kakao-Routen.
 *
 * FAIL-CLOSED AUF DEN STAND DAVOR: Frist überschritten, Fehler, andere
 * Währung oder unplausible Zeile -> null. Die Seite nennt dann wie bisher den
 * Listenpreis mit "Mengenrabatt im Warenkorb" (cacaoPricing oben). Eine
 * leere oder falsche Zahl ist schlechter als der benannte alte Stand.
 */

export const STAFFEL_MENGEN = [2, 3];

/** Wie lange ein gelesener Zeilenbetrag gilt (Wechselkurse wandern). */
const ABLAGE_MS = 15 * 60 * 1000;
/** Längste Wartezeit des Seitenaufbaus auf die Warenkörbe. */
const FRIST_MS = 1500;
/** Obergrenze der Ablage (2 Sorten x wenige Länder; Schutz gegen Wachstum). */
const ABLAGE_MAX = 64;

const ablage = new Map();

const STAFFEL_KASSE_MUTATION = `#graphql
  mutation StaffelKasse($lines: [CartLineInput!]!, $land: CountryCode!) {
    cartCreate(input: {lines: $lines, buyerIdentity: {countryCode: $land}}) {
      cart {
        totalQuantity
        lines(first: 2) {
          nodes {
            quantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function mitFrist(versprechen, ms) {
  let uhr;
  const frist = new Promise((_, ablehnen) => {
    uhr = setTimeout(() => ablehnen(new Error('staffel-kasse: Frist')), ms);
  });
  return Promise.race([versprechen, frist]).finally(() => clearTimeout(uhr));
}

/**
 * Zeilenbetrag eines Warenkorbs mit `menge` Stück, oder Fehler.
 * @returns {Promise<{amount: number, currencyCode: string}>}
 */
async function zeileLesen(storefront, variantId, land, menge) {
  const antwort = await storefront.mutate(STAFFEL_KASSE_MUTATION, {
    variables: {
      lines: [{merchandiseId: variantId, quantity: menge}],
      land,
    },
  });
  const ergebnis = antwort?.cartCreate;
  if (ergebnis?.userErrors?.length) {
    throw new Error(`staffel-kasse: ${ergebnis.userErrors[0]?.message}`);
  }
  const zeilen = ergebnis?.cart?.lines?.nodes || [];
  if (zeilen.length !== 1 || zeilen[0].quantity !== menge) {
    throw new Error('staffel-kasse: Warenkorb ohne genau eine Zeile');
  }
  const geld = zeilen[0].cost?.totalAmount;
  const amount = Number.parseFloat(geld?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('staffel-kasse: Zeile ohne Betrag');
  }
  return {amount, currencyCode: geld.currencyCode};
}

/*
 * DER LADEN LEGT 2 UND 3 PACKUNGEN ALS SET (kakao-set-zeile.server.js): ist
 * das Sorten-Set im Markt nicht teurer als die Einzelzeile, wird die
 * Einzelpackung x2/x3 an Ort zum Set, und die Kasse nimmt den Set-Preis.
 * Gemessen 2026-10-10 am Ladenweg ?markt=CH: 2 Awake = bundle-2x-awake
 * 124,00 CHF, der Warenkorb mit Einzelpackung x2 127,53 CHF; US 159 gegen
 * 163,75 USD. Die Seite nannte den Einzelweg, die Kasse nahm das Set (Job
 * 20261010-update-kakao-mengen-schweiz-ganze-franken, "Seite = Kasse, ganze
 * Franken"). Darum liest der Loader die Sorten-Sets mit und nimmt dieselbe
 * Regel wie der Laden: Set, wenn verfügbar, gleiche Währung und nicht teurer.
 * Fehlt die Antwort, bleibt der Warenkorb-Betrag (Stand davor).
 */
const STAFFEL_SET_FELDER = `selectedOrFirstAvailableVariant {
      availableForSale
      price {
        amount
        currencyCode
      }
    }`;

function setSchluesselFuer(sorte, menge) {
  return sorte === 'awake' ? `${menge}+0` : `0+${menge}`;
}

// Bewusst ohne #graphql-Kennung (wie kakao-set-zeile.server.js): gehört nicht
// in die Codegen-Typen.
const STAFFEL_SET_QUERY = `
  query StaffelSets($id: ID!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    variante: node(id: $id) {
      ... on ProductVariant {
        product {
          handle
        }
      }
    }
    ${['awake', 'create']
      .flatMap((sorte) =>
        STAFFEL_MENGEN.map(
          (menge) =>
            `${sorte}${menge}: product(handle: "${KAKAO_SETS[setSchluesselFuer(sorte, menge)]}") {
    ${STAFFEL_SET_FELDER}
  }`,
        ),
      )
      .join('\n    ')}
  }
`;

/**
 * Set-Preis je Staffel-Menge für die Sorte der Variante, oder {} (fail-soft).
 * @returns {Promise<Object<string, {amount: number, currencyCode: string}>>}
 */
async function setsLesen(storefront, variantId, land) {
  if (!storefront?.query) return {};
  try {
    const d = await storefront.query(STAFFEL_SET_QUERY, {
      variables: {id: variantId, country: land},
    });
    const handle = d?.variante?.product?.handle;
    const sorte = Object.keys(KAKAO_EINZEL).find((s) => KAKAO_EINZEL[s] === handle);
    if (!sorte) return {};
    const aus = {};
    for (const menge of STAFFEL_MENGEN) {
      const v = d?.[`${sorte}${menge}`]?.selectedOrFirstAvailableVariant;
      const amount = Number.parseFloat(v?.price?.amount);
      if (v?.availableForSale && Number.isFinite(amount) && amount > 0) {
        aus[String(menge)] = {amount, currencyCode: v.price.currencyCode};
      }
    }
    return aus;
  } catch (fehler) {
    if (typeof console !== 'undefined') {
      console.warn(`[staffel-kasse] Sets ${land}: ${fehler?.message || fehler}; es gilt der Warenkorb.`);
    }
    return {};
  }
}

/**
 * Netto-Zeilenbeträge der Kasse je Staffel-Menge, oder null.
 *
 * @param {{mutate: Function}} storefront Hydrogen-Storefront-Client
 * @param {{variantId?: string, waehrung?: string, land?: string,
 *   listenpreis?: string|number}} angabe
 * @param {{jetzt?: number, fristMs?: number}} [optionen] nur für Tests
 * @returns {Promise<{waehrung: string, land: string,
 *   zeilen: Object<string, number>}|null>}
 */
export async function ladeStaffelKasse(storefront, angabe, optionen = {}) {
  const {variantId, waehrung, land, listenpreis} = angabe || {};
  if (!storefront?.mutate || !variantId || !land) return null;
  if (!waehrung || waehrung === 'EUR') return null;
  const jetzt = optionen.jetzt ?? Date.now();
  const schluessel = `${variantId}|${land}|${waehrung}`;
  const alt = ablage.get(schluessel);
  if (alt && jetzt - alt.ts < ABLAGE_MS) return alt.wert;
  try {
    const [gelesen, sets] = await mitFrist(
      Promise.all([
        Promise.all(
          STAFFEL_MENGEN.map((menge) =>
            zeileLesen(storefront, variantId, land, menge),
          ),
        ),
        setsLesen(storefront, variantId, land),
      ]),
      optionen.fristMs ?? FRIST_MS,
    );
    const liste = Number.parseFloat(listenpreis);
    const zeilen = {};
    for (let i = 0; i < STAFFEL_MENGEN.length; i += 1) {
      const menge = STAFFEL_MENGEN[i];
      const {amount, currencyCode} = gelesen[i];
      if (currencyCode !== waehrung) return null;
      // Plausibel heißt: ein Rabatt, kein Aufschlag. Ein Zeilenbetrag über
      // Listenpreis mal Menge wäre kein Mengenrabatt mehr.
      if (Number.isFinite(liste) && amount > liste * menge + 0.005) return null;
      // Der Laden legt das Sorten-Set, wenn es nicht teurer ist (oben).
      const set = sets[String(menge)];
      zeilen[String(menge)] =
        set && set.currencyCode === waehrung && set.amount <= amount + 0.005
          ? set.amount
          : amount;
    }
    const wert = {waehrung, land, zeilen};
    if (ablage.size >= ABLAGE_MAX) ablage.clear();
    ablage.set(schluessel, {ts: jetzt, wert});
    return wert;
  } catch (fehler) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[staffel-kasse] ${land} ${waehrung}: ${fehler?.message || fehler}; die Seite nennt den Listenpreis.`,
      );
    }
    return null;
  }
}

/** Nur für Tests: Ablage leeren. */
export function _ablageLeeren() {
  ablage.clear();
}
