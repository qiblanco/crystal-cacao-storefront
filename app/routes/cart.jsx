import {useLoaderData, data} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {
  getAttributionCartAttributes,
  getOriginCartAttributes,
  hasAttributionConsent,
  persistAttributionOnCartResult,
} from '~/lib/cart-attribution.server';
import {mergeCartAttributes} from '~/lib/checkout-tracking';
import {
  kakaoPackungenEingabe,
  legeKakaoSetZeile,
} from '~/lib/kakao-set-zeile.server';
import {ABSENDER_MARKE} from '~/lib/kakao-zone';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: `Warenkorb | ${ABSENDER_MARKE}`}];
};

/**
 * @type {HeadersFunction}
 */
export const headers = ({actionHeaders}) => actionHeaders;

/*
 * WARUM EINE WARENKORB-AKTION HIER NICHT MEHR DREI MUTATIONEN KOSTET
 * (Grossjob 20261013-crystal-cacao-warenkorb-haengt, s01; Christian 13.10.:
 * „hängt voll im warenkorb").
 *
 * Gemessen am 13.10.: eine Aktion brauchte am Server 1,6 bis 4,1 s. Jede
 * Shopify-Warenkorb-MUTATION kostet von diesem Server 0,41 bis 0,58 s, eine
 * Abfrage 0,11 bis 0,17 s, und eine Aktion reihte bis zu drei Mutationen:
 * die Kundenaktion, den Set-Tausch (kakao-set-zeile.server.js, K1) und
 * cartAttributesUpdate. Die letzte lief bei JEDER Aktion: Hydrogens
 * Rueckgabe einer Mutation (MINIMAL_CART_FRAGMENT) traegt keine Attribute,
 * also sah persistAttributionOnCartResult immer „geaendert" und ersetzte die
 * Attribute mit denselben Werten.
 *
 * Jetzt, ohne die K1/K3-Dateien anzufassen:
 *   1. Ein NEUER Korb bekommt die Herkunfts-Attribute schon beim Anlegen
 *      (cartCreate traegt lines UND attributes in einer Mutation).
 *   2. Die vorhandenen Attribute werden PARALLEL zum Set-Schritt gelesen
 *      (der Set-Schritt beruehrt sie nicht). Stimmen sie schon mit dem
 *      ueberein, was persistAttributionOnCartResult schreiben wuerde, entfaellt
 *      die Mutation. Sonst laeuft sie wie bisher: dieselbe Funktion, dieselbe
 *      Ersetzen-Semantik, auch wenn das Lesen scheitert.
 *   3. Jede Antwort traegt `Server-Timing` je Schritt (aktion, setzeile,
 *      herkunft, gesamt). Die Funktionswache und jeder Browser sehen damit,
 *      wo die Zeit bleibt, ohne Serverlog.
 * Kill-Schalter: env WARENKORB_HERKUNFT_SPAREN=off stellt 1. und 2. ab.
 */
const ATTRIBUTE_QUERY = `
  query WarenkorbAttribute($cartId: ID!) {
    cart(id: $cartId) {
      attributes {
        key
        value
      }
    }
  }
`;

function sparenAus(env) {
  return String(env?.WARENKORB_HERKUNFT_SPAREN ?? '').toLowerCase() === 'off';
}

/** Was persistAttributionOnCartResult bei leerem Bestand schreiben wuerde. */
function gewuenschteAttribute(request, env) {
  return mergeCartAttributes(undefined, [
    ...getOriginCartAttributes(request),
    ...(hasAttributionConsent(request, env)
      ? getAttributionCartAttributes(request)
      : []),
  ]).attributes;
}

function gleicheAttribute(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  const karte = new Map(a.map((x) => [x?.key, x?.value ?? '']));
  return b.every((x) => karte.has(x?.key) && karte.get(x?.key) === (x?.value ?? ''));
}

async function attributeLesen(storefront, cartId) {
  try {
    const {cart} = await storefront.query(ATTRIBUTE_QUERY, {
      variables: {cartId},
      cache: storefront.CacheNone(),
    });
    return Array.isArray(cart?.attributes) ? cart.attributes : null;
  } catch {
    return null;
  }
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const {cart, env, storefront} = context;
  const t0 = Date.now();
  const zeiten = {};
  const sparen = !sparenAus(env);
  let attributeGesetzt = null;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('Es wurde keine Aktion angegeben');
  }

  let status = 200;
  let result;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      if (sparen && !cart.getCartId()) {
        // Neuer Korb: Zeilen und Herkunft in EINER Mutation. Die Zeilen ohne
        // die Daten fuer die optimistische Anzeige, wie cart.addLines sie
        // selbst zuschneidet; buyerIdentity setzt cart.create selbst.
        const attributes = gewuenschteAttribute(request, env);
        result = await cart.create({
          lines: (inputs.lines || []).map((line) => ({
            attributes: line.attributes,
            quantity: line.quantity,
            merchandiseId: line.merchandiseId,
            sellingPlanId: line.sellingPlanId,
            parent: line.parent,
          })),
          ...(attributes.length ? {attributes} : {}),
        });
        if (result?.cart?.id && !result?.errors?.length) {
          attributeGesetzt = attributes;
        }
      } else {
        result = await cart.addLines(inputs.lines);
      }
      break;
    case CartForm.ACTIONS.LinesUpdate:
      // Stepper einer Kakao-Set-Zeile: Menge in Packungen (kakao-set-zeile.server.js).
      result = await cart.updateLines(
        await kakaoPackungenEingabe({storefront, inputs, cart}),
      );
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes;
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  // CROSS-BOUNDARY-LINKAGE (ADR 0056): die Identitaets-Schluessel als
  // Cart-Attribute festschreiben -- Shopify macht daraus die
  // Order-note_attributes, aus denen das Backend stitcht. Genau dieser
  // Schritt fehlte auf qiblanco fuer `_qpx_anon` (0/191 Orders, 90,6 %
  // faelschlich "direct"). Consent-gegated in cart-attribution.server.js.
  // 2 oder 3 Packungen einer Kakao-Sorte liegen als Set-Zeile im Warenkorb,
  // damit ein Partnercode neben dem Staffelpreis greift (Großjob 20260929
  // partnercodes x Sets, s03). Liest nach jeder Zeilen-Aktion nach.
  zeiten.aktion = Date.now() - t0;
  const korbId = result?.cart?.id;
  const vorhanden =
    sparen && korbId && !attributeGesetzt
      ? attributeLesen(storefront, korbId)
      : Promise.resolve(attributeGesetzt);

  const t1 = Date.now();
  result = await legeKakaoSetZeile({cart, storefront, env, action, result});
  zeiten.setzeile = Date.now() - t1;

  const t2 = Date.now();
  let herkunft = 'geschrieben';
  if (
    sparen &&
    result?.cart &&
    gleicheAttribute(await vorhanden, gewuenschteAttribute(request, env))
  ) {
    herkunft = 'unveraendert';
  } else {
    result = await persistAttributionOnCartResult({cart, request, env, result});
  }
  zeiten.herkunft = Date.now() - t2;
  zeiten.gesamt = Date.now() - t0;

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  headers.set(
    'Server-Timing',
    [
      `aktion;dur=${zeiten.aktion}`,
      `setzeile;dur=${zeiten.setzeile}`,
      `herkunft;dur=${zeiten.herkunft};desc="${herkunft}"`,
      `gesamt;dur=${zeiten.gesamt}`,
    ].join(', '),
  );
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  /** @type {LoaderReturnData} */
  const cart = useLoaderData();

  return (
    <div className="cart">
      <h1>Warenkorb</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}

/** @typedef {import('react-router').HeadersFunction} HeadersFunction */
/** @typedef {import('./+types/cart').Route} Route */
/** @typedef {import('@shopify/hydrogen').CartQueryDataReturn} CartQueryDataReturn */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
