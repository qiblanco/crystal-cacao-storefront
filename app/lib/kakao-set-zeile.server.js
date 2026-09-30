import {CartForm} from '@shopify/hydrogen';
import {
  KAKAO_EINZEL,
  KAKAO_SETS,
  kakaoSetArt,
  kakaoZeilenPlan,
  setSchluessel,
  sortenSetsGleicherMenge,
  stepperZusammensetzung,
} from '~/lib/kakao-set-zeile';

/*
 * Stellt nach jeder Zeilen-Aktion die Kakao-Normalform her (Regel und Messung
 * in ~/lib/kakao-set-zeile.js). Aufgerufen aus der Warenkorb-Action
 * (routes/cart.jsx) und dem Warenkorb-Permalink (routes/cart.$lines.jsx) —
 * dieselben zwei Türen wie bei den Qi-Master-Add-ons.
 *
 * WARUM AM WARENKORB UND NICHT IN DER KAUFFORM: die 2x/3x-Auswahl der
 * Kaufseite ist nur EIN Weg zu Menge 2/3. Der Stepper im Warenkorb, ein
 * zweites "In den Warenkorb" derselben Sorte und ein Partner-Permalink
 * (/cart/<variante>:3?discount=<code>) führen genauso dorthin, und in jedem
 * dieser Fälle verlöre der Partnercode wieder gegen die Automatik.
 *
 * WIE: der Tausch geschieht AN ORT (cartLinesUpdate mit merchandiseId). Das
 * ist eine Mutation, die Zeilen-id und Zeilen-Attribute bleiben, die
 * Warenkorb-Attribute (_qpx_anon, Herkunft, UTM) werden nicht berührt
 * (gemessen 2026-09-29 an der Storefront-API).
 *
 * NIE TEURER: das Set wird nur gelegt, wenn sein Preis im Markt des
 * Warenkorbs nicht über dem Betrag der Einzelzeile vor Code liegt. In EUR
 * sind beide centgleich, in USD ist das Set billiger, in CHF ist das
 * Create-Set 0,22 bzw. 1,05 teurer (gemessen 2026-09-29) — dort bleibt die
 * Einzelzeile. Die Varianten werden zur Laufzeit über den Handle aufgelöst,
 * nie als ID getippt.
 *
 * GEMISCHTE SETS NIE BILLIGER ALS DAS SORTEN-SET (Elina EL-20260930-9c7bdd63):
 * die drei gemischten Sets tragen in EUR den Staffelpreis, in Fremdwährung
 * rechnet Shopify sie aber um, während die Sorten-Sets dort Festpreise der
 * Markt-Preisliste haben. Gemessen 2026-09-30: USD 1+1 = 139 gegen Sorten-Set
 * 159 und Automatik 165,57 — ein Umleger wäre dort ein stiller Preisnachlass
 * von 16 %, den niemand entschieden hat. Ein gemischtes Set wird darum nur
 * gelegt, wenn es im Markt auch nicht unter dem billigsten Sorten-Set
 * derselben Packungszahl liegt (EUR centgleich, CHF 116 = 116). Bekommt es
 * einen Festpreis in der Preisliste, greift es dort ohne Codeänderung.
 *
 * FAIL-SOFT: jeder Lese- oder Auflösefehler lässt das Ergebnis der
 * Kundenaktion unverändert (eine Warnung im Log, kein leerer Warenkorb).
 * Kill-Schalter: env KAKAO_SET_ZEILE=off.
 */
const ZEILEN_AKTIONEN = new Set([
  CartForm.ACTIONS.LinesAdd,
  CartForm.ACTIONS.LinesUpdate,
  CartForm.ACTIONS.LinesRemove,
]);

// Bewusst ohne #graphql-Kennung: diese zwei Abfragen gehören nicht in die
// Codegen-Typen (storefrontapi.generated.d.ts bleibt unberührt).
const VARIANTE_QUERY = `
  query KakaoSetVariante(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      selectedOrFirstAvailableVariant {
        id
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`;

const ZEILEN_QUERY = `
  query KakaoSetZeilen($cartId: ID!) {
    cart(id: $cartId) {
      lines(first: 100) {
        nodes {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              product {
                handle
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          discountAllocations {
            discountedAmount {
              amount
            }
            ... on CartCodeDiscountAllocation {
              code
            }
          }
        }
      }
    }
  }
`;

function warnen(text) {
  if (typeof console !== 'undefined') console.warn(`[kakao-set-zeile] ${text}`);
}

async function variante(storefront, handle) {
  try {
    const {product} = await storefront.query(VARIANTE_QUERY, {
      variables: {handle},
      cache: storefront.CacheShort(),
    });
    const v = product?.selectedOrFirstAvailableVariant;
    return v?.id ? v : null;
  } catch {
    return null;
  }
}

async function zeilenLesen(storefront, cartId) {
  const {cart} = await storefront.query(ZEILEN_QUERY, {
    variables: {cartId},
    cache: storefront.CacheNone(),
  });
  return (cart?.lines?.nodes || []).map((z) => {
    const netto = Number.parseFloat(z.cost?.totalAmount?.amount);
    const code = (z.discountAllocations || [])
      .filter((a) => a.code)
      .reduce((s, a) => s + Number.parseFloat(a.discountedAmount?.amount || 0), 0);
    return {
      id: z.id,
      quantity: z.quantity,
      handle: z.merchandise?.product?.handle,
      // Betrag der Zeile VOR einem Code (nach der Automatik): damit wird das
      // Set verglichen, denn auf dem Set greift der Code ja noch dazu.
      vorCode: Number.isFinite(netto) ? netto + code : NaN,
      waehrung: z.cost?.totalAmount?.currencyCode,
    };
  });
}

/**
 * Preis (Cent) des billigsten Sorten-Sets derselben Packungszahl im Markt
 * des Warenkorbs; NaN, wenn keins lesbar ist (dann bleibt es beim alten Weg).
 */
async function sortenSetUntergrenzeCent(storefront, packungen, waehrung) {
  const handles = Object.values(sortenSetsGleicherMenge(packungen)).filter(Boolean);
  const cents = [];
  for (const h of handles) {
    const v = await variante(storefront, h);
    const cent = Math.round(Number.parseFloat(v?.price?.amount) * 100);
    if (v && v.price?.currencyCode === waehrung && Number.isFinite(cent)) {
      cents.push(cent);
    }
  }
  return cents.length ? Math.min(...cents) : NaN;
}

function aus(env) {
  return String(env?.KAKAO_SET_ZEILE ?? '').toLowerCase() === 'off';
}

/**
 * @param {{cart: any, storefront: any, env?: Record<string, string>,
 *   action: string, result: any}} args
 */
export async function legeKakaoSetZeile({cart, storefront, env, action, result}) {
  const cartId = result?.cart?.id;
  if (!cartId || !storefront || aus(env)) return result;
  if (!ZEILEN_AKTIONEN.has(action)) return result;

  let neu = result;
  try {
    let zeilen = await zeilenLesen(storefront, cartId);
    const plan = kakaoZeilenPlan(zeilen);
    if (!plan) return result;

    // Schritt 1: je Sorte EINE Einzelpackungs-Zeile mit der Gesamtmenge, in
    // EINER Mutation (Menge 0 entfernt die übrigen Zeilen derselben Sorte).
    if (plan.einzelform.length || plan.entfernen.length || plan.hinzu.length) {
      const aendern = [];
      for (const z of plan.einzelform) {
        const v = await variante(storefront, z.handle);
        if (!v) {
          warnen(`${z.handle} nicht auflösbar - Warenkorb bleibt wie er ist`);
          return result;
        }
        aendern.push({id: z.id, merchandiseId: v.id, quantity: z.quantity});
      }
      for (const id of plan.entfernen) aendern.push({id, quantity: 0});
      const anlegen = [];
      for (const z of plan.hinzu) {
        const v = await variante(storefront, z.handle);
        if (!v) {
          warnen(`${z.handle} nicht auflösbar - Warenkorb bleibt wie er ist`);
          return result;
        }
        anlegen.push({merchandiseId: v.id, quantity: z.quantity});
      }
      if (aendern.length) {
        const r = await cart.updateLines(aendern, {cartId});
        if (!r?.cart || r?.errors?.length) {
          warnen(`Einzelform gescheitert: ${JSON.stringify(r?.errors || [])}`);
          return result;
        }
        neu = r;
      }
      if (anlegen.length) {
        const r = await cart.addLines(anlegen, {cartId});
        if (!r?.cart || r?.errors?.length) {
          warnen(`Einzelform (neue Zeile) gescheitert: ${JSON.stringify(r?.errors || [])}`);
          return neu;
        }
        neu = r;
      }
      if (!plan.kandidat) return neu;
      zeilen = await zeilenLesen(storefront, cartId);
    }

    // Schritt 2: die Einzelzeile(n) auf das Set umlegen, wenn es nicht
    // teurer ist. Gemischt: die erste Zeile wird an Ort zum Set, die zweite
    // fällt weg — in EINER Mutation.
    const {kandidat} = plan;
    const einzelZeilen = kandidat.einzel.map((e) =>
      zeilen.find((z) => z.handle === e.handle && z.quantity === e.packungen),
    );
    const set = await variante(storefront, kandidat.set);
    if (einzelZeilen.some((z) => !z) || !set?.availableForSale) {
      warnen(`${kandidat.set} nicht verfügbar oder Zeile fehlt - Einzelpackung bleibt`);
      return neu;
    }
    const waehrung = einzelZeilen[0].waehrung;
    const setCent = Math.round(Number.parseFloat(set.price?.amount) * 100);
    const zeileCent = Math.round(
      einzelZeilen.reduce((s, z) => s + z.vorCode, 0) * 100,
    );
    if (
      set.price?.currencyCode !== waehrung ||
      einzelZeilen.some((z) => z.waehrung !== waehrung) ||
      !Number.isFinite(setCent) ||
      !Number.isFinite(zeileCent) ||
      setCent > zeileCent
    ) {
      warnen(
        `${kandidat.set} ${set.price?.amount} ${set.price?.currencyCode} gegen Einzelzeile ` +
          `${zeileCent / 100} ${waehrung} - Einzelpackung bleibt (nie teurer)`,
      );
      return neu;
    }
    if (kandidat.gemischt) {
      const untergrenze = await sortenSetUntergrenzeCent(
        storefront,
        kandidat.packungen,
        waehrung,
      );
      if (!Number.isFinite(untergrenze) || setCent < untergrenze) {
        warnen(
          `${kandidat.set} ${set.price?.amount} ${waehrung} unter dem Sorten-Set ` +
            `(${untergrenze / 100}) - Einzelpackungen bleiben (nie billiger als das Sorten-Set)`,
        );
        return neu;
      }
    }
    const [erste, ...weitere] = einzelZeilen;
    const r = await cart.updateLines(
      [
        {id: erste.id, merchandiseId: set.id, quantity: 1},
        ...weitere.map((z) => ({id: z.id, quantity: 0})),
      ],
      {cartId},
    );
    if (!r?.cart || r?.errors?.length) {
      warnen(`Set-Tausch gescheitert: ${JSON.stringify(r?.errors || [])}`);
      return neu;
    }
    return r;
  } catch (e) {
    warnen(`Lesefehler, Warenkorb unverändert: ${e?.message || e}`);
    return neu;
  }
}

/**
 * Der Stepper einer Set-Zeile rechnet in PACKUNGEN, nicht in Sets: "+" auf
 * dem 3er-Set bedeutet 4 Packungen, nicht zwei 3er-Sets (sonst 6 Packungen,
 * teurer als die Automatik ab 4x). CartLineItem schickt deshalb `kakaoPackungen`
 * {lineId, handle, packungen}; hier wird daraus die Einzelpackung der Sorte
 * mit dieser Menge, und legeKakaoSetZeile() stellt danach die Normalform her.
 * Ohne auflösbare Einzelpackung bleiben die Zeilen, wie der Client sie
 * schickte (dort: dieselbe Menge, also nichts).
 *
 * Gemischtes Set: die Zeile kann nur EINE Ware tragen (LinesUpdate legt keine
 * Zeile an). Ergibt die neue Zusammensetzung wieder ein Set (2 oder 3
 * Packungen), wird die Zeile direkt dieses Set; sonst trägt sie die Sorte mit
 * mehr Packungen (bei Gleichstand Awake), und die andere Sorte wird vorher
 * als eigene Zeile angelegt — dafür braucht es den `cart`-Handler. Fehlt er
 * oder scheitert das Anlegen, bleibt die Zeile, wie sie ist (keine Packung
 * geht still verloren).
 *
 * @param {{storefront: any, inputs: any, cart?: any}} args
 */
export async function kakaoPackungenEingabe({storefront, inputs, cart}) {
  const zeilen = Array.isArray(inputs?.lines) ? inputs.lines : [];
  const wunsch = inputs?.kakaoPackungen;
  if (!wunsch || typeof wunsch !== 'object' || !storefront) return zeilen;
  const art = kakaoSetArt(wunsch.handle);
  const packungen = Number.parseInt(wunsch.packungen, 10);
  if (!art || !wunsch.lineId || !(packungen >= 1 && packungen <= 99)) {
    return zeilen;
  }
  const neu = stepperZusammensetzung(art.je, packungen);
  const gesamt = neu.awake + neu.create;
  let handle;
  let menge;
  let dazu = null;
  if (art.gemischt && (gesamt === 2 || gesamt === 3)) {
    handle = KAKAO_SETS[setSchluessel(neu)];
    menge = 1;
  } else if (gesamt === 0) {
    handle = KAKAO_EINZEL[art.sorte || 'awake'];
    menge = 0;
  } else {
    const sorte = neu.create > neu.awake ? 'create' : 'awake';
    const andere = sorte === 'awake' ? 'create' : 'awake';
    handle = KAKAO_EINZEL[sorte];
    menge = art.gemischt ? neu[sorte] : gesamt;
    if (art.gemischt && neu[andere] > 0) {
      dazu = {handle: KAKAO_EINZEL[andere], quantity: neu[andere]};
    }
  }
  const v = await variante(storefront, handle);
  if (!v) {
    warnen(`${handle} nicht auflösbar - Stepper ohne Wirkung`);
    return zeilen;
  }
  if (dazu) {
    const w = await variante(storefront, dazu.handle);
    const r = w && cart
      ? await cart.addLines([{merchandiseId: w.id, quantity: dazu.quantity}])
      : null;
    if (!r?.cart || r?.errors?.length) {
      warnen(`${dazu.handle} nicht anlegbar - Stepper ohne Wirkung`);
      return zeilen;
    }
  }
  return [
    ...zeilen.filter((z) => z.id !== wunsch.lineId),
    {id: wunsch.lineId, merchandiseId: v.id, quantity: menge},
  ];
}
