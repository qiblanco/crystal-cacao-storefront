import {CartForm} from '@shopify/hydrogen';
import {
  SET_GROESSE_MIN,
  UMRECHNUNGS_LAENDER,
  kakaoPreisschutz,
  kakaoZeilenPlan,
  sortenSetsGleicherMenge,
  stepperEinzelZeilen,
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
 * AB 4 PACKUNGEN IST DER ANKER DER EINZELWEG MIT AUTOMATIK (2026-09-30,
 * Großjob kakao-partnercodes-alle-mengen, s03). Für 4 bis 7 Packungen sind
 * die Sorten-Sets selbst neu, es gibt also kein älteres Set als Maßstab. Die
 * Untergrenze ist dort der gemessene Betrag der Einzelzeilen vor Code, also
 * genau das, was der Kunde ohne Set heute zahlt. Zusammen mit "nie teurer"
 * heißt das: centgleich, bis auf ANKER_TOLERANZ_CENT_JE_ZEILE (Rundung je
 * Einzelzeile). In EUR und USD sind die Sets centgleich (gemessen s02). In CH
 * hält der Takt partner-manager/bin/kakao-set-chf die Festpreise der Sets auf
 * dem gemessenen Einzelweg. In Ländern ohne Preisliste in der Landeswährung
 * (UMRECHNUNGS_LAENDER: LI, GB, PL, SE) gilt das Rundungsband der Umrechnung,
 * Herleitung bei der Konstante.
 *
 * MEHRERE SET-ZEILEN (ab 8 Packungen): verglichen wird die SUMME aller
 * Set-Zeilen gegen die Summe der Einzelzeilen. Die Einzelzeilen werden an Ort
 * zu Set-Zeilen; gibt es mehr Set- als Einzelzeilen, werden die übrigen
 * VORHER angelegt, und scheitert danach der Tausch, werden sie wieder
 * entfernt (keine Packung doppelt im Warenkorb).
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

    // Schritt 2: die Einzelzeile(n) auf die Set-Zeile(n) umlegen, wenn das
    // nicht teurer und nicht billiger ist.
    const {kandidat} = plan;
    const einzelZeilen = kandidat.einzel.map((e) =>
      zeilen.find((z) => z.handle === e.handle && z.quantity === e.packungen),
    );
    if (einzelZeilen.some((z) => !z)) {
      warnen(`Einzelzeile fehlt nach Schritt 1 - Einzelpackung bleibt`);
      return neu;
    }
    const waehrung = einzelZeilen[0].waehrung;
    const sets = [];
    for (const s of kandidat.sets) {
      const v = await variante(storefront, s.handle);
      if (!v?.availableForSale) {
        warnen(`${s.handle} nicht verfügbar - Einzelpackung bleibt`);
        return neu;
      }
      sets.push({...s, variante: v});
    }
    const setCent = sets.reduce(
      (summe, s) =>
        summe + Math.round(Number.parseFloat(s.variante.price?.amount) * 100) * s.quantity,
      0,
    );
    const zeileCent = Math.round(
      einzelZeilen.reduce((summe, z) => summe + z.vorCode, 0) * 100,
    );
    const benannt = sets.map((s) => `${s.handle} x${s.quantity}`).join(' + ');
    const waehrungGleich =
      sets.every((s) => s.variante.price?.currencyCode === waehrung) &&
      einzelZeilen.every((z) => z.waehrung === waehrung);
    const schutz = waehrungGleich
      ? kakaoPreisschutz({
          packungen: kandidat.packungen,
          gemischt: kandidat.gemischt,
          setCent,
          zeileCent,
          einzelZeilen: einzelZeilen.length,
          umgerechnet: UMRECHNUNGS_LAENDER.includes(
            String(storefront.i18n?.country || '').toUpperCase(),
          ),
          setStueck: sets.reduce((summe, s) => summe + s.quantity, 0),
          sortenSetCent:
            kandidat.gemischt && kandidat.packungen < SET_GROESSE_MIN
              ? await sortenSetUntergrenzeCent(storefront, kandidat.packungen, waehrung)
              : undefined,
        })
      : {ok: false, grund: 'waehrung'};
    if (!schutz.ok) {
      warnen(
        `${benannt} ${setCent / 100} gegen Einzelzeile ${zeileCent / 100} ${waehrung} - ` +
          `Einzelpackung bleibt (${schutz.grund})`,
      );
      return neu;
    }

    // Einzelzeile i wird an Ort Set-Zeile i; übrige Einzelzeilen fallen weg,
    // übrige Set-Zeilen werden vorher angelegt.
    const anOrt = sets.slice(0, einzelZeilen.length);
    const extra = sets.slice(einzelZeilen.length);
    if (extra.length) {
      const r = await cart.addLines(
        extra.map((s) => ({merchandiseId: s.variante.id, quantity: s.quantity})),
        {cartId},
      );
      if (!r?.cart || r?.errors?.length) {
        warnen(`Set-Zeile anlegen gescheitert: ${JSON.stringify(r?.errors || [])}`);
        return neu;
      }
    }
    const r = await cart.updateLines(
      [
        ...anOrt.map((s, i) => ({
          id: einzelZeilen[i].id,
          merchandiseId: s.variante.id,
          quantity: s.quantity,
        })),
        ...einzelZeilen.slice(anOrt.length).map((z) => ({id: z.id, quantity: 0})),
      ],
      {cartId},
    );
    if (!r?.cart || r?.errors?.length) {
      warnen(`Set-Tausch gescheitert: ${JSON.stringify(r?.errors || [])}`);
      if (extra.length) {
        // Die vorher angelegten Set-Zeilen wieder heraus: sonst lägen deren
        // Packungen zusätzlich zu den Einzelzeilen im Warenkorb.
        const nachher = await zeilenLesen(storefront, cartId);
        const extraHandles = new Set(extra.map((s) => s.handle));
        const weg = nachher.filter((z) => extraHandles.has(z.handle));
        if (weg.length) {
          const z = await cart.updateLines(
            weg.map((x) => ({id: x.id, quantity: 0})),
            {cartId},
          );
          if (z?.cart && !z?.errors?.length) return z;
        }
        warnen('Rückbau der angelegten Set-Zeilen gescheitert');
      }
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
 * dem 3er-Set bedeutet 4 Packungen, nicht zwei 3er-Sets. CartLineItem schickt
 * deshalb `kakaoPackungen` {lineId, handle, packungen} und zeigt die Packungen
 * der ganzen Zeile (Set-Größe x Zeilenmenge, ab 8 Packungen z.B. Set 3+2 x4
 * = 20). Hier wird daraus die Zusammensetzung der Zeile mit der neuen
 * Packungszahl, und legeKakaoSetZeile() stellt danach die Normalform her.
 *
 * DER WEG GEHT IMMER ÜBER DIE EINZELPACKUNGEN (seit 2026-09-30, s03): die
 * Zeile trägt die Sorte mit mehr Packungen (bei Gleichstand Awake), die
 * andere Sorte wird vorher als eigene Zeile angelegt — dafür braucht es den
 * `cart`-Handler. Erst die Normalform legt daraus wieder Sets, und nur dort
 * sitzt der Preisschutz. Ein direkter Sprung auf ein Set würde ihn umgehen
 * (in CHF ist das 4er-Set teurer als der Einzelweg). Fehlt der Handler oder
 * scheitert das Anlegen, bleibt die Zeile, wie sie ist (keine Packung geht
 * still verloren).
 *
 * @param {{storefront: any, inputs: any, cart?: any}} args
 */
export async function kakaoPackungenEingabe({storefront, inputs, cart}) {
  const zeilen = Array.isArray(inputs?.lines) ? inputs.lines : [];
  const wunsch = inputs?.kakaoPackungen;
  if (!wunsch || typeof wunsch !== 'object' || !storefront) return zeilen;
  // Zeilenmenge: das Formular schickt die Zeile mit ihrer aktuellen Menge mit.
  const eigene = zeilen.find((z) => z.id === wunsch.lineId);
  const ziel = wunsch.lineId
    ? stepperEinzelZeilen(
        wunsch.handle,
        eigene?.quantity,
        Number.parseInt(wunsch.packungen, 10),
      )
    : null;
  if (!ziel) return zeilen;
  const {handle, quantity: menge} = ziel.zeile;
  const {dazu} = ziel;
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
