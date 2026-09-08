import {CartForm} from '@shopify/hydrogen';
import {Preis} from './Preis';
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

  // Ein BEREITS EINGELOESTER Code wird nie versteckt — sonst koennte der Kunde
  // ihn weder sehen noch entfernen. Der Falz startet dann offen.
  const codeEingeloest = Boolean(
    cart?.discountCodes?.some((d) => d.applicable) ||
      cart?.appliedGiftCards?.length,
  );

  return (
    <div aria-labelledby={summaryId} className={className}>
      <h4 id={summaryId}>Summe</h4>
      <dl role="group" className="cart-subtotal">
        <dt>Zwischensumme</dt>
        <dd>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Preis data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CodeFalz layout={layout} offen={codeEingeloest}>
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
 * DIE ZWEI CODE-FORMULARE KLAPPEN IN DER SCHUBLADE ZU — auf der /cart-SEITE
 * bleibt alles unveraendert.
 *
 * GEMESSEN 2026-09-08 (390x844, zwei Artikel, Diagnose-A/B im selben Browser):
 * der Drawer-Fuss war 435 px hoch, davon 264 px allein die beiden IMMER offenen
 * Code-Formulare (Rabattcode + Geschenkgutschein, je 132 px). Die scrollende
 * Mitte behielt 313 px = 37,1 % der Drawer-Hoehe; kalibriert und gefordert sind
 * mindestens 40 %, gemessen waren es nach dem Drei-Zonen-Umbau am 2026-08-22
 * noch 437 px = 51,8 %.
 *
 * WARUM NICHT DIE 44-px-TREFFERFLAECHEN ZURUECKNEHMEN, die den Fuss haben
 * wachsen lassen: `main input`/`main button { min-height: var(--cc-treffer-min) }`
 * ist WCAG 2.5.5 und am 2026-09-02 bewusst gesetzt worden. Diese Regeln sind
 * NICHT der Fehler — sie haben nur sichtbar gemacht, dass der Fuss zwei
 * optionale Formulare traegt, die er sich in 844 px nie leisten konnte. Sie zu
 * verkleinern waere eine Barrierefreiheits-Regression und eine Verschiebung der
 * eigenen Torpfosten. Aufgeklappt behalten die Felder ihre vollen 44 px.
 *
 * WARUM `<details>` UND KEIN EIGENER SCHALTER: nativ tastaturbedienbar, von
 * Screenreadern als aufklappbare Gruppe angesagt, kein JavaScript, kein
 * Hydration-Zustand. Und nichts wird ENTFERNT: wer einen Code hat, findet ihn
 * mit einem Klick — wer keinen hat (der Regelfall), sieht seine Ware.
 */
function CodeFalz({layout, offen, children}) {
  if (layout === 'page') return <>{children}</>;
  return (
    <details className="cc-code-falz" open={offen}>
      <summary>Rabatt- oder Gutscheincode?</summary>
      {children}
    </details>
  );
}

/**
 * @param {{checkoutUrl?: string}}
 */
function CartCheckoutActions({checkoutUrl}) {
  if (!checkoutUrl) return null;

  return (
    <div>
      <a href={checkoutUrl} target="_self">
        <p>Jetzt sicher zur Kasse</p>
      </a>
      <br />
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
