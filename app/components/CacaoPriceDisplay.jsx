import {cacaoPricing} from './CacaoProductForm';
import {useMarktLand} from '~/lib/markt-land';
import {PreisSchilder} from '~/components/reusables/PreisSchild';

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
  // SCHILDCHEN VARIANTE B (Christian 12.11.2026, Standard design-meister
  // _basis.yaml `schildchen`): der Preisvorteil nennt die Zahl, die zu GENAU
  // dem Preispaar daneben passt. Dieser Laden zeigt oben den Packungspreis
  // (teilbar), die Vorlage qiblanco den Zeilenbetrag; deshalb rechnet die
  // Anzeige hier aus ihrem eigenen Paar und nicht aus pricing.vorteil
  // (Zeilenbetrag: 3x 159 gegen 228 waere "−69 €" neben "53 € / 76 €").
  const kopfNum = jePackung ? pricing.priceNum : pricing.gesamtNum;
  const kopfVorherNum =
    pricing.compareAtGesamtNum != null
      ? jePackung
        ? pricing.compareAtGesamtNum / pricing.menge
        : pricing.compareAtGesamtNum
      : null;
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
      {/* Preisvorteil mit Zahl (Tiefrot), dann die Auszeichnung (Tinte, Gold,
          Raute). Vorher EIN Schild je Stufe mit Text ohne Zahl: 'Exklusiv' /
          'Angebot' / 'Bestseller Angebot'. */}
      <PreisSchilder
        preis={kopfNum}
        vergleich={kopfVorher ? kopfVorherNum : null}
        waehrung={pricing.waehrung}
        auszeichnung={pricing.auszeichnung}
      />
      <div className="CacaoPricePer100g">{nebenzeile}</div>
    </div>
  );
}
