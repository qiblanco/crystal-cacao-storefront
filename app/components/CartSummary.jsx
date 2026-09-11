import {CartForm} from '@shopify/hydrogen';
import {Preis} from './Preis';
import {getCartLineGrossDisplayTotalExact} from '~/lib/cart-display-pricing';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';

/**
 * @param {CartSummaryProps}
 */
export function CartSummary({cart, layout}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  // ZWISCHENSUMME BRUTTO — 2026-09-09. Hier stand `cart.cost.subtotalAmount`,
  // und das ist bei diesem Shop der NETTO-Betrag: gemessen 71,03 EUR fuer eine
  // Packung mit 76,- EUR Kaufseitenpreis, 149,19 EUR fuer drei. Zur selben
  // Sekunde zeigte die Kasse 149,19 + 10,44 MwSt = 159,63 EUR.
  //
  // DIE NAHT ZU CartMain, und sie ist der Grund fuer den Filter: `lines.nodes`
  // enthaelt auch KIND-Zeilen (componentizable lines / Buendel). CartMain
  // ueberspringt sie beim Rendern ueber genau dieses Praedikat und zeigt sie
  // stattdessen unter ihrer Elternzeile. Der Elternbetrag enthaelt sie bereits
  // — wer hier ungefiltert summiert, zaehlt ein Buendel doppelt. Das Praedikat
  // ist woertlich dasselbe wie in CartMain; laeuft es dort auseinander, ist die
  // Zwischensumme still falsch.
  const zeilen = (cart?.lines?.nodes ?? []).filter(
    (zeile) =>
      !('parentRelationship' in zeile && zeile.parentRelationship?.parent),
  );
  const bruttoSumme = zeilen.reduce(
    (summe, zeile) => summe + getCartLineGrossDisplayTotalExact(zeile),
    0,
  );
  const waehrung = cart?.cost?.subtotalAmount?.currencyCode ?? 'EUR';

  return (
    // AUFBAU DER VORLAGE qiblanco.com (Christian 2026-09-10): Zwischensumme ->
    // Kassenknopf, sonst nichts. Die Ueberschrift "Summe" ist entfallen (die
    // Vorlage hat keine), und die Zwischensumme steht wie dort als
    // `Zwischensumme:` + Leerzeichen + Betrag in EINER Zeile mit
    // `justify-content: space-between`. Vorher war es ein <dl> mit <dt>/<dd>
    // ohne Textknoten dazwischen — im DOM stand "Zwischensumme159,63 €", und
    // weil <dl> als Flex-Zeile ohne gap gesetzt war, klebten Bezeichner und
    // Betrag auch sichtbar zusammen. Das Leerzeichen kommt jetzt aus der
    // Zusammensetzung (Textknoten), nicht aus der Anzeige — sonst kaeme es beim
    // naechsten Feld wieder.
    <div aria-labelledby={summaryId} className={className}>
      <div className="cart-aside-subtotal">
        <div id={summaryId}>Zwischensumme:</div>{' '}
        {cart?.cost?.subtotalAmount?.amount ? (
          <Preis
            data={{
              amount: bruttoSumme.toFixed(2),
              currencyCode: waehrung,
            }}
          />
        ) : (
          '-'
        )}
      </div>
      <CodeFalz layout={layout}>
        <CartDiscounts
          discountCodes={cart?.discountCodes}
          discountsHeadingId={discountsHeadingId}
          discountCodeInputId={discountCodeInputId}
        />
        <CartGiftCard
          giftCardCodes={cart?.appliedGiftCards}
          giftCardHeadingId={giftCardHeadingId}
          giftCardInputId={giftCardInputId}
        />
      </CodeFalz>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

/**
 * DIE CODE-FORMULARE (Rabattcode, Geschenkgutschein) STEHEN NUR NOCH AUF DER
 * /cart-SEITE — in der Schublade gar nicht mehr.
 *
 * Bis zum 2026-09-10 trug die Schublade sie in einem <details>-Falz
 * ("Rabatt- oder Gutscheincode?", Job 20260908-crystal-warenkorb-
 * scrollflaeche-37prozent-drift-prio30: der Falz gab der scrollenden Mitte
 * 124 px zurueck, ohne die 44-px-Trefferflaechen anzutasten). Christians
 * Auftrag vom 2026-09-10 verlangt fuer die Schublade DENSELBEN AUFBAU wie
 * qiblanco.com — gleiche Reihenfolge der Elemente — und die Vorlage fuehrt
 * dort keine Code-Formulare: Zwischensumme, dann der Kassenknopf. Ein Code
 * wird in der Kasse eingeloest (Shopify-Checkout hat das Feld), und ein per
 * Link mitgebrachter Code (/discount/<code>) haengt ohnehin am Warenkorb.
 * NICHTS geht verloren: die Seite /cart behaelt beide Formulare unveraendert.
 */
function CodeFalz({layout, children}) {
  if (layout === 'page') return <>{children}</>;
  return null;
}

/**
 * @param {{checkoutUrl?: string}}
 */
function CartCheckoutActions({checkoutUrl}) {
  if (!checkoutUrl) return null;

  // DER KASSENKNOPF IST DER KERN (Christian 2026-09-10): "Jetzt sicher zur
  // Kasse" war nackter Text in derselben Groesse wie die Zeile darueber. Jetzt
  // traegt er die Hausform .cc-knopf (dieselben Masse wie .btn--primary der
  // Vorlage: 70,4 px hoch, 17,6 px / 600, Radius 10 — gemessen, nicht
  // geschaetzt) im Wrapper .cartSummaryWrapper, der in der Vorlage denselben
  // Namen traegt.
  //
  // BEWUSST WEITER EIN <a> AUF cart.checkoutUrl und KEIN <Form> auf
  // /cart/attribution wie in der Vorlage: der Auftrag verbietet jeden Eingriff
  // in den Kaufvorgang, vier stehende Proben messen
  // `aside a[href*='checkout.qiblanco.com']`, und die Herkunfts-/Klick-Marker
  // reisen auf diesem Laden bereits als Cart-Attribute mit
  // (persistAttributionOnCartResult in cart.jsx und cart.$lines.jsx).
  // Die Knopf-Gestalt ist Darstellung; der Weg bleibt derselbe.
  return (
    <div className="cartSummaryWrapper">
      <a className="cc-knopf cart-kasse" href={checkoutUrl} target="_self">
        <p>Jetzt sicher zur Kasse</p>
      </a>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: CartApiQueryFragment['discountCodes'];
 *   discountsHeadingId: string;
 *   discountCodeInputId: string;
 * }}
 */
function CartDiscounts({
  discountCodes,
  discountsHeadingId,
  discountCodeInputId,
}) {
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <section aria-label="Rabatte">
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt id={discountsHeadingId}>Rabatte</dt>
          <UpdateDiscountForm>
            <div
              className="cart-discount"
              role="group"
              aria-labelledby={discountsHeadingId}
            >
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button type="submit" aria-label="Rabattcode entfernen">
                Entfernen
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <label htmlFor={discountCodeInputId} className="sr-only">
            Rabattcode
          </label>
          <input
            id={discountCodeInputId}
            type="text"
            name="discountCode"
            placeholder="Rabattcode"
          />
          &nbsp;
          <button type="submit" aria-label="Rabattcode einlösen">
            Einlösen
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
 *   giftCardHeadingId: string;
 *   giftCardInputId: string;
 * }}
 */
function CartGiftCard({giftCardCodes, giftCardHeadingId, giftCardInputId}) {
  const giftCardCodeInput = useRef(null);
  const removeButtonRefs = useRef(new Map());
  const previousCardIdsRef = useRef([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <section aria-label="Geschenkgutscheine">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt id={giftCardHeadingId}>Eingelöste Geschenkgutscheine</dt>
          {giftCardCodes.map((giftCard) => (
            <dd key={giftCard.id} className="cart-discount">
              <RemoveGiftCardForm
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
                buttonRef={(el) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
              >
                <code>***{giftCard.lastCharacters}</code>
                &nbsp;
                <Preis data={giftCard.amountUsed} />
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div>
          <label htmlFor={giftCardInputId} className="sr-only">
            Gutscheincode
          </label>
          <input
            id={giftCardInputId}
            type="text"
            name="giftCardCode"
            placeholder="Gutscheincode"
            ref={giftCardCodeInput}
          />
          &nbsp;
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            aria-label="Geschenkgutschein einlösen"
          >
            Einlösen
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

/**
 * @param {{
 *   fetcherKey?: string;
 *   children: React.ReactNode;
 * }}
 */
function AddGiftCardForm({fetcherKey, children}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardId: string;
 *   lastCharacters: string;
 *   children: React.ReactNode;
 *   onRemoveClick?: () => void;
 *   buttonRef?: (el: HTMLButtonElement | null) => void;
 * }}
 */
function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
      &nbsp;
      <button
        type="submit"
        aria-label={`Geschenkgutschein mit der Endung ${lastCharacters} entfernen`}
        onClick={onRemoveClick}
        ref={buttonRef}
      >
        Entfernen
      </button>
    </CartForm>
  );
}

/**
 * @typedef {{
 *   cart: OptimisticCart<CartApiQueryFragment | null>;
 *   layout: CartLayout;
 * }} CartSummaryProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCart} OptimisticCart */
