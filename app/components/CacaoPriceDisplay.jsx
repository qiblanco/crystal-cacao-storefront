import {cacaoPricing} from './CacaoProductForm';

/**
 * Preis-Anzeige der Kakao-Mengenstaffel — DYNAMISCH aus dem API-Preis der
 * Variante (M2, Auftrag 20260718-lp-preise-dynamisch-binden-gestuft);
 * fail-closed auf den letzten bekannten guten Stand (cacaoPricing).
 */
export function CacaoPriceDisplay({quantity, selectedVariant, handle}) {
  const pricing = cacaoPricing(quantity, selectedVariant, handle);

  return (
    <div className="Bestseller-Price">
      <div className="CacaoPriceMain">
        <span className={`CacaoPriceCurrent ${pricing.compareAt ? 'sale' : 'exclusive'}`}>
          {pricing.price}
        </span>
        {pricing.compareAt && (
          <span className="CacaoPriceCompare">{pricing.compareAt}</span>
        )}
      </div>
      <div className={`BestsellerLabel BestsellerLabel--${pricing.badgeStyle}`}>
        {pricing.badge}
      </div>
      <div className="CacaoPricePer100g">{pricing.per100g}</div>
    </div>
  );
}
