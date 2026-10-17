import {cacaoPricing} from './CacaoProductForm';
import {useMarktLand} from '~/lib/markt-land';

/**
 * Preis-Anzeige der Kakao-Mengenstaffel — DYNAMISCH aus dem API-Preis der
 * Variante (M2, Auftrag 20260718-lp-preise-dynamisch-binden-gestuft);
 * fail-closed auf den letzten bekannten guten Stand (cacaoPricing).
 */
export function CacaoPriceDisplay({quantity, selectedVariant, handle, staffelKasse = null}) {
  const marktLand = useMarktLand();
  // staffelKasse (Job 20261006-preisanzeige-rest): Zeilenbetraege der Kasse je
  // Menge ausserhalb des EUR-Markts, vom Loader (lib/cacao-pricing.js).
  const pricing = cacaoPricing(quantity, selectedVariant, handle, marktLand, staffelKasse);
  // KOPF = PACKUNGSPREIS, ABER NIE MIT NACHKOMMASTELLEN (Grossjob 20261006-repair-
  // glatte-preise, s04, 2026-10-17). Christian 08.09.: oben steht der Preis je
  // Packung der gewaehlten Menge. Christian 06.10.: "keine Nachkommastellen".
  // Geht der Packungspreis nicht ganz auf (CH 3x 161 / 3 = 53,67 CHF, US 2x
  // 159 / 2 = 79,50 USD), steht oben der Betrag der Menge mit "für N Packungen"
  // -- dieselbe Regel wie die Auswahl darunter (teilbar, lib/cacao-pricing.js).
  const jePackung = pricing.teilbar;
  const kopf = jePackung ? pricing.price : pricing.gesamt;
  const kopfVorher = jePackung ? pricing.compareAt : pricing.compareAtGesamt;
  const nebenzeile = [
    jePackung ? null : `für ${pricing.menge} Packungen`,
    pricing.per100g,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="Bestseller-Price">
      <div className="CacaoPriceMain">
        <span className={`CacaoPriceCurrent ${kopfVorher ? 'sale' : 'exclusive'}`}>
          {kopf}
        </span>
        {kopfVorher && (
          <span className="CacaoPriceCompare">{kopfVorher}</span>
        )}
      </div>
      <div className={`BestsellerLabel BestsellerLabel--${pricing.badgeStyle}`}>
        {pricing.badge}
      </div>
      <div className="CacaoPricePer100g">{nebenzeile}</div>
    </div>
  );
}
