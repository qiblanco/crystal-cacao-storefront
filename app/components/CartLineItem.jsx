import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import {getCartLinePriceDisplayExact} from '~/lib/cart-display-pricing';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 * @param {{
 *   layout: CartLayout;
 *   line: CartLine;
 *   childrenMap: LineItemChildrenMap;
 * }}
 */
export function CartLineItem({layout, line, childrenMap}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;
  // BRUTTO STATT NETTO — 2026-09-09, Christian: „In der Ansicht steht ja schon
  // korrekt 76 EUR, aber dann im Warenkorb stimmt es leider nicht."
  //
  // Hier stand `line?.cost?.totalAmount`. Das ist der ROHE Betrag der
  // Storefront-API, und der ist bei diesem Shop NETTO (`taxes_included=false`):
  // gemessen 71,03 EUR fuer eine Packung, die auf der Kaufseite 76,- EUR
  // kostet. Der Umrechner dafuer lag die ganze Zeit im Repo
  // (app/lib/cart-display-pricing.js) — er hatte in dieser Fassung des Ladens
  // nur KEINEN EINZIGEN AUFRUFER, waehrend dieselbe Komponente auf
  // qiblanco.com ihn aufruft und deshalb korrekt 76,- EUR zeigt.
  // Hier wird deshalb NICHT gerechnet und NICHT formatiert, sondern der
  // vorhandene Kanon gefragt — sonst laufen die beiden Zahlen beim naechsten
  // Mal wieder auseinander.
  const anzeigePreis = getCartLinePriceDisplayExact(line);

  return (
    <li key={id} className="cart-line">
      <div className="cart-line-inner">
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1"
            data={image}
            height={100}
            loading="lazy"
            width={100}
          />
        )}

        <div>
          <Link
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
          >
            <p>
              <strong>{product.title}</strong>
            </p>
          </Link>
          <ProductPrice price={anzeigePreis.price} />
          <ul>
            {selectedOptions.map((option) => (
              <li key={option.name}>
                <small>
                  {option.name}: {option.value}
                </small>
              </li>
            ))}
          </ul>
          <CartLineQuantity line={line} />
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Enthalten in {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    // AUFBAU DER VORLAGE qiblanco.com (Christian 2026-09-10: "genauso aufbauen
    // wie auf www.qiblanco.com"): links der Stepper [-] Zahl [+] in EINEM
    // Wrapper, rechts aussen das Entfernen — dieselbe Reihenfolge, dieselben
    // Klassen (.quantity-wrapper), damit die Abstaende aus app.css Abschnitt 15
    // mit gemessenen Vorlagewerten greifen. Vorher stand hier "Menge: 3" als
    // Text auf halber Hoehe neben zwei goldenen Quadraten und "Entfernen" als
    // umrandeter Knopf in eigener Zeile.
    // "Menge" bleibt fuer Screenreader als sr-only-Text erhalten; sichtbar
    // ist wie in der Vorlage nur die Zahl.
    <div className="cart-line-quantity">
      <div className="quantity-wrapper">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Menge verringern"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <span>&#8722;</span>
          </button>
        </CartLineUpdateButton>
        <small>
          <span className="sr-only">Menge: </span>
          {quantity}
        </small>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Menge erhöhen"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
          >
            <span>&#43;</span>
          </button>
        </CartLineUpdateButton>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 * @param {{
 *   lineIds: string[];
 *   disabled: boolean;
 * }}
 */
function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      {/* Wie in der Vorlage: ein Muelleimer-Zeichen statt eines umrandeten
          Textknopfs — die Handlung, die wir am wenigsten wollen, traegt das
          geringste Gewicht. Das Wort bleibt als zugaenglicher Name. */}
      <button disabled={disabled} type="submit" aria-label="Entfernen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 512 512"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M447.55 96H336V48a16 16 0 0 0-16-16H192a16 16 0 0 0-16 16v48H64.45L64 136h33l20.09 314A32 32 0 0 0 149 480h214a32 32 0 0 0 31.93-29.95L415 136h33ZM176 416l-9-256h33l9 256Zm96 0h-32V160h32Zm24-320h-80V68a4 4 0 0 1 4-4h72a4 4 0 0 1 4 4Zm40 320h-33l9-256h33Z"
          />
        </svg>
      </button>
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @returns
 * @param {string[]} lineIds - line ids affected by the update
 */
function getUpdateKey(lineIds) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}

/** @typedef {OptimisticCartLine<CartApiQueryFragment>} CartLine */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('~/components/CartMain').LineItemChildrenMap} LineItemChildrenMap */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLine} OptimisticCartLine */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').CartLineFragment} CartLineFragment */
