import {CartForm} from '@shopify/hydrogen';
import {
  KAKAO_EINZEL,
  kakaoSetArt,
  kakaoZeilenPlan,
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
    if (plan.einzelform.length || plan.entfernen.length) {
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
      const r = await cart.updateLines(aendern, {cartId});
      if (!r?.cart || r?.errors?.length) {
        warnen(`Einzelform gescheitert: ${JSON.stringify(r?.errors || [])}`);
        return result;
      }
      neu = r;
      if (!plan.kandidat) return neu;
      zeilen = await zeilenLesen(storefront, cartId);
    }

    // Schritt 2: die Einzelzeile auf das Set umlegen, wenn es nicht teurer ist.
    const {kandidat} = plan;
    const zeile = zeilen.find(
      (z) => z.handle === kandidat.einzel && z.quantity === kandidat.packungen,
    );
    const set = await variante(storefront, kandidat.set);
    if (!zeile || !set?.availableForSale) {
      warnen(`${kandidat.set} nicht verfügbar oder Zeile fehlt - Einzelpackung bleibt`);
      return neu;
    }
    const setCent = Math.round(Number.parseFloat(set.price?.amount) * 100);
    const zeileCent = Math.round(zeile.vorCode * 100);
    if (
      set.price?.currencyCode !== zeile.waehrung ||
      !Number.isFinite(setCent) ||
      !Number.isFinite(zeileCent) ||
      setCent > zeileCent
    ) {
      warnen(
        `${kandidat.set} ${set.price?.amount} ${set.price?.currencyCode} gegen Einzelzeile ` +
          `${zeile.vorCode} ${zeile.waehrung} - Einzelpackung bleibt (nie teurer)`,
      );
      return neu;
    }
    const r = await cart.updateLines(
      [{id: zeile.id, merchandiseId: set.id, quantity: 1}],
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
 * @param {{storefront: any, inputs: any}} args
 */
export async function kakaoPackungenEingabe({storefront, inputs}) {
  const zeilen = Array.isArray(inputs?.lines) ? inputs.lines : [];
  const wunsch = inputs?.kakaoPackungen;
  if (!wunsch || typeof wunsch !== 'object' || !storefront) return zeilen;
  const art = kakaoSetArt(wunsch.handle);
  const packungen = Number.parseInt(wunsch.packungen, 10);
  if (!art || !wunsch.lineId || !(packungen >= 1 && packungen <= 99)) {
    return zeilen;
  }
  const v = await variante(storefront, KAKAO_EINZEL[art.sorte]);
  if (!v) {
    warnen(`${KAKAO_EINZEL[art.sorte]} nicht auflösbar - Stepper ohne Wirkung`);
    return zeilen;
  }
  return [
    ...zeilen.filter((z) => z.id !== wunsch.lineId),
    {id: wunsch.lineId, merchandiseId: v.id, quantity: packungen},
  ];
}
