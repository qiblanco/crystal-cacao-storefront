import {Preis} from './Preis';
import {bruttoAnzeige, formatPreis} from '~/lib/markt-pricing';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  return (
    <div aria-label="Preis" className="product-price" role="group">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <Preis data={price} /> : null}
          <s>
            <Preis data={compareAtPrice} />
          </s>
        </div>
      ) : price ? (
        <Preis data={price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/**
 * ProductPriceKanon — die Buybox-Preisanzeige der SAMMELROUTE
 * (app/routes/products.$handle.jsx), also der fuenf Kakao-Kaufseiten
 * /crystal-cacao-angebot, /bundle-2x-awake, /bundle-3x-awake,
 * /mengenrabatt-2x, /mengenrabatt-3x-create.
 *
 * WARUM ES DIESE ZWEITE FASSUNG GIBT UND `ProductPrice` NICHT EINFACH
 * UMGEBAUT WURDE — das ist der ganze Punkt dieser Datei:
 * `ProductPrice` hat ZWEI Aufrufer mit ZWEI VERSCHIEDENEN Eingangs-Semantiken.
 *   - app/components/CartLineItem.jsx uebergibt den BEREITS GERECHNETEN
 *     Brutto-Betrag aus getCartLinePriceDisplayExact() (cent-genau).
 *   - Diese Sammelroute uebergab bis zum 2026-09-12 den ROHEN API-Betrag.
 * Haette man den Steueraufschlag IN `ProductPrice` gelegt, haette der
 * Warenkorb ab sofort DOPPELT besteuert (76 -> 81). Die Rechnung gehoert
 * deshalb an den Aufrufer, der die rohe Zahl hat — hier.
 *
 * DER BEFUND, der das ausgeloest hat (am 2026-09-12 am oeffentlichen Rand
 * gemessen, nicht vermutet): die Buybox zeigte den NETTO-Betrag der
 * Storefront-API — 71,03 € statt 76, 114,02 € statt 122, 148,60 € statt 159 —
 * waehrend der Warenkorb ueber cart-display-pricing.js den Brutto-Betrag
 * belastet. Faktor exakt 1,07 (Lebensmittelsatz, alle fuenf Handles stehen in
 * CACAO_HANDLES). Der Kunde zahlte damit bis zu 10,40 € mehr, als die Seite
 * bewarb; fuer einen deutschen Endkundenpreis ist das zusaetzlich die falsche
 * Groesse (PAngV: Endpreis).
 *
 * WELCHE ZAHL RICHTIG IST — beantwortet aus dem SSoT, nicht aus dem Code:
 * `preis-ssot json` (Stand 2026-09-12T08:08:27Z) fuehrt fuer alle sieben
 * Kakao-Handles `gegenprobe: ok`, d.h. Admin-API-NETTO x (1+Satz) trifft den
 * Storefront-Wert. Er nennt anzeige = 76 / 122 / 159 — exakt das, was
 * bruttoAnzeige() rechnet. Die Netto-Zahl der Buybox war damit nicht bloss
 * abweichend, sondern widerlegt.
 *
 * WARUM compareAtPrice KEINE STEUER BEKOMMT — Bestand, nicht Ermessen:
 * homepage-bauer/src/preiswatch.py (Zeile 253) fuehrt den Streichpreis
 * ausdruecklich OHNE Steuer ("compareAt wird OHNE Steuer angezeigt
 * (ProductPrice-Kanon: no tax here)"), und `preis-ssot` exportiert daraufhin
 * streichpreis = 152 fuer crystal-cacao-angebot. Den Kanon auch auf dieses
 * Feld zu legen haette 163 ergeben — eine ZWEITE Wahrheit gegen den SSoT und
 * einen um 11 € hoeheren Streichpreis, den niemand verlangt hat und den
 * niemand gegen § 11 PAngV (niedrigster Preis der letzten 30 Tage) belegen
 * kann. Ein Streichpreis ist eine Werbeaussage des Haendlers, kein
 * Rechenergebnis.
 *
 * DAS ANZEIGEFORMAT IST 'pdp', nicht das Cent-Format von `Preis`:
 * app/lib/markt-pricing.js nennt 'pdp' selbst den "ProductPrice-Kanon"
 * ("1.087,- €"). Damit steht auf diesen fuenf Seiten dieselbe Schreibweise
 * wie auf den beiden Flaggschiff-Seiten ("76,- €"), die ueber
 * CacaoPriceDisplay/cacaoPricing denselben Kanon fahren. `Preis` bleibt
 * unangetastet — es ist die cent-genaue Warenkorb-Anzeige und muss es
 * bleiben (159,63 € ist dort die richtige Zahl, 160 waere falsch).
 *
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 *   handle?: string;
 * }}
 */
export function ProductPriceKanon({price, compareAtPrice, handle}) {
  const waehrung = price?.currencyCode || compareAtPrice?.currencyCode;
  const anzeige = formatPreis(
    bruttoAnzeige(price?.amount, handle, waehrung),
    waehrung,
    'pdp',
  );
  // Streichpreis: nur runden, NIE besteuern (siehe Kopf).
  const streichRoh = Number.parseFloat(compareAtPrice?.amount);
  const streich = Number.isFinite(streichRoh)
    ? formatPreis(
        Math.round(streichRoh),
        compareAtPrice?.currencyCode || waehrung,
        'pdp',
      )
    : null;

  return (
    <div aria-label="Preis" className="product-price" role="group">
      {streich ? (
        <div className="product-price-on-sale">
          {anzeige ? <span>{anzeige}</span> : null}
          <s>
            <span>{streich}</span>
          </s>
        </div>
      ) : anzeige ? (
        <span>{anzeige}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
