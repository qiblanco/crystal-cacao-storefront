import {useEffect, useRef, useState} from 'react';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {EuGewaehrleistungsHinweis} from './EuGewaehrleistungsLabel';
import {useMarktLand} from '~/lib/markt-land';
import {
  CACAO_STAFFEL,
  PACKUNG_GRAMM,
  cacaoPricing,
  staffelBetragText,
} from '~/lib/cacao-pricing';

// Die Staffel-Rechnung kommt seit 2026-10-06 aus lib/cacao-pricing.js, byte-gleich
// zu qiblanco.com (K1, Job 20261006-preisanzeige-rest-laender-achse-staffel-
// fremdwaehrung). Ausserhalb des EUR-Markts rechnet sie mit dem Zeilenbetrag aus
// einem Warenkorb des Landes (staffelKasse vom Loader); teilt die Menge den
// Zeilenbetrag nicht auf den Cent, nennt die Option den Zeilenbetrag ("163,46 €
// für 3 Packungen"). Laden-eigen bleiben hier die Kurzfassung der Auswahl und der
// Kopf (Packungspreis, CacaoPriceDisplay). Die Namen bleiben exportiert.
export {CACAO_STAFFEL, cacaoPricing};

/**
 * Dropdown-Optionen der Mengenstaffel (Preise aus lib/cacao-pricing.js).
 */
export function cacaoSizeOptions(selectedVariant, handle, land, staffelKasse) {
  return ['3', '2', '1'].map((value) => {
    const pricing = cacaoPricing(value, selectedVariant, handle, land, staffelKasse);
    const rabatt =
      pricing.rabattProzent > 0 ? `${pricing.rabattProzent}% Rabatt | ` : '';
    // Fehlt der Zeilenbetrag aus dem Warenkorb, nennt die Zeile ausserhalb des
    // EUR-Markts den Listenpreis und sagt, dass der Mengenrabatt im Warenkorb
    // abgezogen wird (siehe cacaoPricing).
    const hinweis = pricing.rabattImWarenkorb
      ? ' | Mengenrabatt im Warenkorb'
      : '';
    // KURZFASSUNG fuer schmale Telefone (Job 20261003-crystal-mengenauswahl-
    // zeile-schmales-telefon): dieselben drei Angaben — Menge, Rabatt, Preis
    // je Packung —, nur "pro Packung" wird zu "je" vor dem Preis. Gemessen bei
    // 16 px (Open Sans 600): lang 311 px, kurz 230 px; Platz in der Auswahl
    // 390 px -> 312, 360 px -> 282, 320 px -> 242. Die Schrift unter 16 px zu
    // setzen ist kein Ausweg: darunter zoomt iOS beim Antippen die Seite.
    // Nennt die Option den Zeilenbetrag, heisst die Kurzfassung "für 3".
    const hinweisKurz = pricing.rabattImWarenkorb
      ? ' | Rabatt im Warenkorb'
      : '';
    const betragKurz = pricing.teilbar
      ? `je ${pricing.price}`
      : `${pricing.gesamt} für ${pricing.menge}`;
    return {
      value,
      label: `${value}x ${PACKUNG_GRAMM}g | ${rabatt}${staffelBetragText(pricing)}${hinweis}`,
      kurz: `${value}x ${PACKUNG_GRAMM}g | ${rabatt}${betragKurz}${hinweisKurz}`,
    };
  });
}

/**
 * Ob die LANGE Optionszeile in die Textflaeche der Auswahl passt — gemessen,
 * nicht per Breitengrenze geraten: der Platz haengt an Breite, Polster und
 * Schrift, die Zeile an Markt und Waehrung ("1.048,50 CHF" ist laenger als
 * "53,- €"). Gemessen wird die LAENGSTE lange Zeile, damit die Fassung nicht
 * mit der gewaehlten Menge wechselt. Server und erster Render zeigen die lange
 * Fassung (dort gibt es keine Breite); die kurze kommt erst, wenn die Messung
 * sagt, dass die lange nicht passt.
 */
function useKurzfassung(selectRef, langeZeilen) {
  const [kurz, setKurz] = useState(false);
  const schluessel = langeZeilen.join('\n');
  useEffect(() => {
    const s = selectRef.current;
    if (!s || typeof window === 'undefined') return undefined;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return undefined;
    const pruefe = () => {
      const cs = window.getComputedStyle(s);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
      const platz =
        s.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      if (!(platz > 0)) return;
      const breite = Math.max(
        ...schluessel.split('\n').map((z) => ctx.measureText(z).width),
      );
      setKurz(breite > platz);
    };
    pruefe();
    // Die Hausschrift kann nach dem ersten Render nachladen und breiter sein
    // als die Ersatzschrift — nach dem Laden noch einmal messen.
    if (document.fonts?.ready) document.fonts.ready.then(pruefe);
    window.addEventListener('resize', pruefe);
    return () => window.removeEventListener('resize', pruefe);
  }, [selectRef, schluessel]);
  return kurz;
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
  staffelKasse = null,
}) {
  const {open} = useAside();
  // Der Lebensmittelsatz ist NICHT ueberall 7 % -- in AT sind es 10 %
  // (gemessen 2026-09-13, cart-display-pricing.js SATZ_JE_LAND).
  const marktLand = useMarktLand();
  const optionen = cacaoSizeOptions(selectedVariant, handle, marktLand, staffelKasse);
  const selectRef = useRef(null);
  const kurz = useKurzfassung(
    selectRef,
    optionen.map((o) => o.label),
  );

  return (
    <div className="product-form">
      <div className="product-options">
        <h5>Größe</h5>
        <select
          ref={selectRef}
          className="CacaoVariantSelect"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        >
          {optionen.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {kurz ? opt.kurz : opt.label}
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
