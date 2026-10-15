import {useOptimisticCart} from '@shopify/hydrogen';
import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {VERBINDUNG_EREIGNIS} from '~/lib/warenkorb-meldung';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
/**
 * Returns a map of all line items and their children.
 * @param {CartLine[]} lines
 * @return {import("/private/tmp/claude-501/-Users-elinagerlinger-Desktop-WORK-Clients-Qi-Blanco-BRAIN/9d42ca69-3ec2-4eab-b947-12cb5aff5f9e/scratchpad/crystal-cacao-storefront/app/components/CartMain").LineItemChildrenMap}
 */
function getLineItemChildrenMap(lines) {
  const children = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * VERBINDUNG UNTERBROCHEN (Befund C16, 13.10.2026): bricht eine
 * Warenkorb-Aktion im Netz ab, faengt cart.jsx (clientAction) den Fehler,
 * der Warenkorb bleibt stehen und hier erscheint fuer 15 s ein Hinweis.
 * Die role=status-Zone ist immer da, damit ein Screenreader den Text beim
 * Erscheinen vorliest.
 */
const VERBINDUNG_HINWEIS_MS = 15000;

function VerbindungsHinweis() {
  const [text, setText] = useState('');
  useEffect(() => {
    let zeitgeber = null;
    const zeigen = () => {
      setText('Verbindung unterbrochen – bitte versuch es gleich noch einmal.');
      clearTimeout(zeitgeber);
      zeitgeber = setTimeout(() => setText(''), VERBINDUNG_HINWEIS_MS);
    };
    window.addEventListener(VERBINDUNG_EREIGNIS, zeigen);
    return () => {
      window.removeEventListener(VERBINDUNG_EREIGNIS, zeigen);
      clearTimeout(zeitgeber);
    };
  }, []);
  return (
    <p className="cc-warenkorb-meldung" role="status">
      {text}
    </p>
  );
}

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 * @param {CartMainProps}
 */
export function CartMain({layout, cart: originalCart}) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  return (
    <section
      className={className}
      aria-label={layout === 'page' ? 'Warenkorb-Seite' : 'Warenkorb-Schublade'}
    >
      <VerbindungsHinweis />
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Positionen im Warenkorb
        </p>
        <div>
          <ul aria-labelledby="cart-lines">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
      </div>
      {/*
        DREI-ZONEN-SCHUBLADE (2026-08-22): die Zusammenfassung mit dem Kaufknopf
        ist GESCHWISTER von `.cart-details`, nicht mehr dessen Kind. Als Kind lag
        sie im Scroll-Container und musste per `position: absolute` aus ihm
        herausgehoben werden — womit sie ueber der letzten Warenkorb-Zeile lag.
        Als Geschwister ist sie der ruhende Fuss der Schublade und beansprucht
        ihren Platz, statt ihn zu ueberdecken (CSS: `aside .cart-summary-aside`).
        Fuer `layout === 'page'` aendert sich nichts Sichtbares: dort stapeln
        beide ohnehin im normalen Fluss untereinander.
      */}
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </section>
  );
}

/**
 * @param {{
 *   hidden: boolean;
 *   layout?: CartMainProps['layout'];
 * }}
 */
function CartEmpty({hidden = false}) {
  const {close} = useAside();
  return (
    // Ein leerer Warenkorb ist kein Fehler, sondern der häufigste Zustand —
    // und die letzte Stelle, an der wir dem Kunden noch etwas anbieten können,
    // bevor er die Schublade wieder zumacht. Deshalb steht hier ein Weg zu den
    // Sorten und nicht nur eine Feststellung.
    <div hidden={hidden} className="cc-leerzustand">
      <p>Dein Warenkorb ist noch leer.</p>
      <p className="cc-leerzustand-hinweis">
        {/* Positionierung seit 2026-10-02 (Christian): Awake herzöffnend,
            powerful; Create Fokus, High Performance. Vorher: „Awake für den
            Start in den Tag, Create für den klaren Kopf.“ */}
        Zwei Sorten, ein Kakao: Awake ist herzöffnend und powerful, Create
        steht für Fokus und High Performance.
      </p>
      <Link
        className="cc-knopf"
        to="/"
        onClick={close}
        prefetch="viewport"
      >
        Unseren Kakao ansehen
      </Link>
    </div>
  );
}

/** @typedef {'page' | 'aside'} CartLayout */
/**
 * @typedef {{
 *   cart: CartApiQueryFragment | null;
 *   layout: CartLayout;
 * }} CartMainProps
 */
/** @typedef {{[parentId: string]: CartLine[]}} LineItemChildrenMap */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartLineItem').CartLine} CartLine */
