import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {EuGewaehrleistungsHinweis} from './EuGewaehrleistungsLabel';
import {anzeigeSatz, formatPreis} from '~/lib/markt-pricing';
import {useMarktLand} from '~/lib/markt-land';

/**
 * Mengenstaffel Crystal Cacao® — GESCHAEFTSREGEL (Prozente + Badges), KEINE
 * Preiszahlen (M2, Auftrag 20260718-lp-preise-dynamisch-binden-gestuft).
 * Der Packungspreis wird aus dem API-Preis der Variante abgeleitet:
 *   round((netto - trunc2(netto * rabatt)) * (1 + satz))
 * — ergibt 76/61/53 beim Netto 71,03 (satz 7 %).
 *
 * ACHTUNG, SEIT 2026-09-12 IST rabattProzent NICHT MEHR DIE MECHANIK DES
 * LADENS, SONDERN NUR NOCH EIN MODELL DAVON — und ein Modell, dessen
 * Uebereinstimmung mit der Kasse an einer Rundung haengt. Bis zu diesem Tag
 * waren die Shopify-Automatiken "Mengenrabatt 2x/3x Crystal Cacao®" echte
 * PROZENTrabatte (percentage 0.2 / 0.3), und dieser Nachbau war deshalb die
 * Mechanik selbst. Der Job
 * 20260912-BAU-runde-preise-bis-zur-kasse-festbetrag-statt-prozent hat sie auf
 * FESTBETRAEGE umgestellt, damit der Bruttobetrag an der Kasse rund aufgeht
 * (Christian: "wir zeigen im Shop keine Preise mit Cent an"). Gemessen am
 * 2026-09-12 in der Storefront-API: der Rabatt ist jetzt 28,04 bzw. 64,49 EUR
 * FEST — also 19,74 % bzw. 30,26 % und nicht 20 / 30 %.
 *
 * WARUM DIE PROZENTE TROTZDEM STEHEN BLEIBEN: der Prozentsatz ist die
 * UEBERSCHRIFT (Christian ausdruecklich im Auftrag jenes Jobs: "Der
 * Prozentsatz bleibt die Ueberschrift ... der Rabatt selbst wird als
 * Festbetrag gesetzt"), und die Anzeige trifft die Kasse heute exakt
 * (gemessen, 6 von 6 Zellen: 2 Sorten x Menge 1/2/3, Drift 0,00 EUR).
 * Sie trifft sie aber aus ZWEI Rechnungen, die sich nur im selben
 * Rundungsfenster treffen: unser Modell rechnet 49,73 netto je Packung
 * (53,2111 brutto), die Kasse 49,5333 (53,0006) — beide runden auf 53.
 *
 * WORAN ES BRECHEN WIRD, und es wird STILL brechen: ein Festbetrag skaliert
 * NICHT mit dem Preis. Aendert sich das Variantennetto (heute 71,03; preiswatch
 * fuehrt es), rechnet diese Funktion weiter 20/30 % und die Kasse zieht
 * weiter 28,04/64,49 EUR ab — ab dann bewirbt die Seite einen anderen Betrag
 * als die Kasse belastet, ohne dass hier etwas rot wird. Die Funktion kann den
 * Festbetrag baulich nicht lesen: ein Automatikrabatt zeigt sich erst, wenn ein
 * Warenkorb existiert, und auf der Kaufseite gibt es keinen. Der Schutz ist
 * deshalb NICHT hier, sondern eine Wache am Kundenrand — Stand und offene
 * Flanke in devlog D-050 / F-033.
 *
 * UND IN CHF/USD STIMMT ES HEUTE SCHON NICHT: Shopify rechnet den EUR-Festbetrag
 * je Markt per Wechselkurs um, wo er nicht mehr rund landet. Gemessen
 * 2026-09-12: US-Dreier bewirbt 207,00 USD, die Kasse belastet 220,69 USD.
 * Eigener Auftrag
 * 20260912-kakao-staffel-festbetrag-nicht-rund-in-chf-und-usd-prio4.
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
export function cacaoPricing(quantity, selectedVariant, handle, land) {
  const staffel = CACAO_STAFFEL[quantity] || CACAO_STAFFEL['1'];
  const netto = Number.parseFloat(selectedVariant?.price?.amount);
  let waehrung = selectedVariant?.price?.currencyCode || 'EUR';
  let einzel;
  let compareAt;
  // NICHT-EUR-MAERKTE BEKOMMEN KEINE STAFFEL-BEHAUPTUNG (2026-09-12).
  // Der Mengenrabatt ist seit dem 2026-09-12 ein FESTBETRAG in EUR; Shopify
  // rechnet ihn je Markt per Wechselkurs um. Diesen Kurs kann die Kaufseite
  // baulich nicht kennen (ein Automatikrabatt existiert erst mit einem
  // Warenkorb) — jede hier gerechnete Prozentzahl ist geraten. Gemessen am
  // Kundenrand war sie zu NIEDRIG geraten: US 3x bewarb 207,00 USD, die Kasse
  // belastete 220,69 USD. Darum nennt die Seite ausserhalb des EUR-Markts den
  // LISTENPREIS und verspricht keinen Staffelpreis; der Rabatt zeigt sich im
  // Warenkorb. Im EUR-Markt bleibt die Rechnung unveraendert — dort trifft der
  // Festbetrag den runden Bruttobetrag exakt.
  const rabattProzent =
    waehrung === 'EUR' ? staffel.rabattProzent : 0;
  const rabattImWarenkorb = waehrung !== 'EUR' && staffel.rabattProzent > 0;
  if (Number.isFinite(netto)) {
    const satz = anzeigeSatz(handle, waehrung, land);
    const rabattProEinheit =
      Math.floor(netto * (rabattProzent / 100) * 100) / 100;
    einzel = Math.round((netto - rabattProEinheit) * (1 + satz));
    compareAt = rabattProzent > 0 ? Math.round(netto * (1 + satz)) : null;
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
    rabattProzent,
    rabattImWarenkorb,
  };
}

/**
 * Dropdown-Optionen der Mengenstaffel (Preise dynamisch abgeleitet).
 */
export function cacaoSizeOptions(selectedVariant, handle, land) {
  return ['3', '2', '1'].map((value) => {
    const pricing = cacaoPricing(value, selectedVariant, handle, land);
    const rabatt =
      pricing.rabattProzent > 0 ? `${pricing.rabattProzent}% Rabatt | ` : '';
    // Ausserhalb des EUR-Markts nennt die Zeile den Listenpreis und sagt, dass
    // der Mengenrabatt im Warenkorb abgezogen wird — statt einen Staffelpreis
    // zu versprechen, den die Kasse nicht einloest (siehe cacaoPricing).
    const hinweis = pricing.rabattImWarenkorb
      ? ' | Mengenrabatt im Warenkorb'
      : '';
    return {
      value,
      label: `${value}x ${PACKUNG_GRAMM}g | ${rabatt}${pricing.price} pro Packung${hinweis}`,
    };
  });
}

/**
 * Custom add-to-cart form for Crystal Cacao products.
 * No Shopify variants — the dropdown controls the quantity
 * of the single product variant added to the cart.
 *
 * @param {{ selectedVariant: object, handle?: string, quantity: string,
 *   onQuantityChange: (val: string) => void,
 *   gewaehrleistungsHinweis?: boolean }} props
 *
 * `gewaehrleistungsHinweis` (Default TRUE, und der Default IST die Aussage)
 * steuert, ob die EU-Pflichtmitteilung hier unter dem Kauf-Knopf haengt.
 * Wortgleich zur Prop der Vorlage, damit dieselbe Naht nicht zwei Namen
 * traegt. Die beiden Kakao-Kaufflaechen dieses Ladens montieren die
 * Mitteilung selbst — als sechsten Punkt ihrer Vertrauensliste — und
 * schalten den Default deshalb ab.
 *
 * WARUM EIN ABSCHALTER UND KEIN AUSBAU (Nachzug 2026-09-11 aus der Vorlage,
 * fd143bb): bis hierher stand in dieser Datei GAR KEIN Hinweis mehr. Das war
 * am 2026-09-08 richtig gemessen — genau zwei Aufrufer, beide mit Liste —
 * und traegt genau so lange, wie diese Zahl stimmt. Eine dritte
 * Kakao-Kaufflaeche ohne Vertrauensliste haette die Pflichtmitteilung
 * lautlos NICHT getragen: Seite rendert, Build gruen, HTTP 200. Der Default
 * faengt diesen Fall; die zwei Bestandsseiten sehen davon nichts.
 */
export function CacaoProductForm({
  selectedVariant,
  handle,
  quantity,
  onQuantityChange,
  gewaehrleistungsHinweis = true,
}) {
  const {open} = useAside();
  // Der Lebensmittelsatz ist NICHT ueberall 7 % -- in AT sind es 10 %
  // (gemessen 2026-09-13, cart-display-pricing.js SATZ_JE_LAND).
  const marktLand = useMarktLand();

  return (
    <div className="product-form">
      <div className="product-options">
        <h5>Größe</h5>
        <select
          className="CacaoVariantSelect"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        >
          {cacaoSizeOptions(selectedVariant, handle, marktLand).map((opt) => (
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
      {/*
        DIE PFLICHTMITTEILUNG STAND BIS ZUM 2026-09-08 HIER — jetzt steht sie
        als Zeile in der Vertrauensliste der beiden Kakao-Kaufseiten
        (<CacaoBenefitList/> in products.crystal-cacao-awake.jsx und
        -create.jsx). Christian, woertlich: „Der Button gesetzliche Garantie
        ist mega gross und komisch. Das sollte einfach als weitere Zeile bei
        den Gimmicks aufgelistet werden."

        DER WORTLAUT IST UNVERAENDERT und die Anforderung gehalten: der Satz
        steht weiter sichtbar, unmittelbar unter dem Kauf-Button und BEVOR
        der Verbraucher gebunden ist (Art. 6 Abs. 1 lit. l RL 2011/83/EU,
        "in hervorgehobener Weise"); die amtliche Grafik erscheint
        unveraendert erst im Overlay nach dem ersten Klick (Praxisleitlinien
        der Kommission, April 2026, Abschnitt 2.3). Geaendert hat sich allein
        die GESTALT.

        WAS DIESER UMZUG NICHT VERAENDERT, gemessen und nicht angenommen:
        die MENGE der Seiten, die die Mitteilung tragen. Der urspruengliche
        Kommentar hier begruendete die Naht damit, dass Kaufflaechen ueber
        den Catch-all products.$handle entstehen — der benutzt aber
        <ProductForm/> und bringt seinen eigenen Hinweis mit.
        <CacaoProductForm/> hat auf diesem Laden genau ZWEI Aufrufer
        (gemessen 2026-09-08: die beiden Kakao-Kaufrouten), und genau diese
        zwei bekommen die Zeile jetzt in ihrer Vertrauensliste — sie schalten
        den Default darunter deshalb ab. Der Default selbst bleibt stehen und
        traegt jede KUENFTIGE Kakao-Kaufflaeche ohne eigene Liste.
      */}
      {gewaehrleistungsHinweis ? <EuGewaehrleistungsHinweis /> : null}
    </div>
  );
}
