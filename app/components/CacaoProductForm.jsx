import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {anzeigeSatz, formatPreis} from '~/lib/markt-pricing';

/**
 * Mengenstaffel Crystal Cacao® — GESCHAEFTSREGEL (Prozente + Badges), KEINE
 * Preiszahlen (M2, Auftrag 20260718-lp-preise-dynamisch-binden-gestuft).
 * Die Prozente spiegeln die Shopify-Automatik "Mengenrabatt 2x/3x Crystal
 * Cacao®" (Cart-Probe 2026-07-18: Rabatt pro Einheit centgenau
 * abgeschnitten, 71,03 x 20 % = 14,206 -> 14,20). Der Packungspreis wird
 * aus dem API-Preis der Variante abgeleitet:
 *   round((netto - trunc2(netto * rabatt)) * (1 + satz))
 * — reproduziert exakt 76/61/53 beim heutigen Netto 71,03 (satz 7 %).
 */
export const CACAO_STAFFEL = {
  '1': {rabattProzent: 0, badge: 'Exklusiv', badgeStyle: 'gold'},
  '2': {rabattProzent: 20, badge: 'Angebot', badgeStyle: 'red'},
  '3': {rabattProzent: 30, badge: 'Bestseller Angebot', badgeStyle: 'gradient'},
};

// FAIL-CLOSED: letzter bekannter guter Stand (DE/EUR-Anzeige), wenn der
// API-Preis fehlt — nie 0/leer/falsch. preiswatch haelt die Werte synchron.
const CACAO_FALLBACK = {
  '1': {einzel: 76, compareAt: null},
  '2': {einzel: 61, compareAt: 76},
  '3': {einzel: 53, compareAt: 76},
};

const PACKUNG_GRAMM = 420;

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
 * Staffel-Anzeige je Menge, DYNAMISCH aus dem API-Preis der Variante.
 * @param {string} quantity '1' | '2' | '3'
 * @param {object} [selectedVariant] Variante mit price {amount, currencyCode}
 * @param {string} [handle] Produkt-Handle (Steuersatz-Zuordnung, 7 % Kakao)
 */
export function cacaoPricing(quantity, selectedVariant, handle) {
  const staffel = CACAO_STAFFEL[quantity] || CACAO_STAFFEL['1'];
  const netto = Number.parseFloat(selectedVariant?.price?.amount);
  let waehrung = selectedVariant?.price?.currencyCode || 'EUR';
  let einzel;
  let compareAt;
  if (Number.isFinite(netto)) {
    const satz = anzeigeSatz(handle, waehrung);
    const rabattProEinheit =
      Math.floor(netto * (staffel.rabattProzent / 100) * 100) / 100;
    einzel = Math.round((netto - rabattProEinheit) * (1 + satz));
    compareAt =
      staffel.rabattProzent > 0 ? Math.round(netto * (1 + satz)) : null;
  } else {
    if (typeof console !== 'undefined') {
      console.warn(
        `[preis-fallback] Kakao-Staffel ${quantity}x: API-Preis fehlt — letzter bekannter Stand wird gezeigt.`,
      );
    }
    const fallback = CACAO_FALLBACK[quantity] || CACAO_FALLBACK['1'];
    waehrung = 'EUR';
    einzel = fallback.einzel;
    compareAt = fallback.compareAt;
  }
  return {
    price: formatPreis(einzel, waehrung, 'pdp'),
    priceNum: einzel,
    compareAt: compareAt != null ? formatPreis(compareAt, waehrung, 'pdp') : null,
    per100g: formatPer100g(einzel / (PACKUNG_GRAMM / 100), waehrung),
    badge: staffel.badge,
    badgeStyle: staffel.badgeStyle,
    rabattProzent: staffel.rabattProzent,
  };
}

/**
 * Dropdown-Optionen der Mengenstaffel (Preise dynamisch abgeleitet).
 */
export function cacaoSizeOptions(selectedVariant, handle) {
  return ['3', '2', '1'].map((value) => {
    const pricing = cacaoPricing(value, selectedVariant, handle);
    const rabatt =
      pricing.rabattProzent > 0 ? `${pricing.rabattProzent}% Rabatt | ` : '';
    return {
      value,
      label: `${value}x ${PACKUNG_GRAMM}g | ${rabatt}${pricing.price} pro Packung`,
    };
  });
}

/**
 * Custom add-to-cart form for Crystal Cacao products.
 * No Shopify variants — the dropdown controls the quantity
 * of the single product variant added to the cart.
 *
 * @param {{ selectedVariant: object, handle?: string, quantity: string, onQuantityChange: (val: string) => void }} props
 */
export function CacaoProductForm({selectedVariant, handle, quantity, onQuantityChange}) {
  const {open} = useAside();

  return (
    <div className="product-form">
      <div className="product-options">
        <h5>Größe</h5>
        <select
          className="CacaoVariantSelect"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        >
          {cacaoSizeOptions(selectedVariant, handle).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="AddToCartButtonWrapper">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: parseInt(quantity, 10),
                    selectedVariant,
                  },
                ]
              : []
          }
        >
          {selectedVariant?.availableForSale
            ? 'In den Warenkorb legen'
            : 'Ausverkauft'}
        </AddToCartButton>
      </div>
    </div>
  );
}
