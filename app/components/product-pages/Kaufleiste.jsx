import {useEffect, useState} from 'react';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {cacaoSizeOptions} from '~/components/CacaoProductForm';
import {useMarktLand} from '~/lib/markt-land';

/**
 * KAUFLEISTE — mobil (bis 749 px, designstandard mobil_bis_px), klebend am
 * unteren Fensterrand, solange der Kaufknopf des Kauf-Blocks nicht GANZ im
 * Fenster steht. Grossjob 20261015-GROSSJOB-design-update-…, s06, Register
 * F-063, F-082, F-106: bei 390x844 stand der Preis bei y=1504 und der
 * Kaufknopf bei y=1684, im ersten Fenster also keins von beiden.
 *
 * Designstandard bausteine.kauf_block: „Klebende Kaufleiste (mobil)
 * wiederholt Preis UND Knopf, nicht nur den Knopf." Sie wiederholt darum die
 * gewaehlte Groesse wortgleich in der Kurzfassung der Auswahl (Menge, Rabatt,
 * Preis je Packung — genau das, was der Knopf in den Warenkorb legt) und
 * denselben Knopf mit denselben Zeilen. Kein neuer Text, kein eigener Preis:
 * beides kommt aus cacaoSizeOptions, aus der auch die Auswahl liest.
 *
 * SIE VERSCHWINDET, sobald der Kaufknopf des Kauf-Blocks ganz im Fenster
 * steht — zwei gleiche Knoepfe gleichzeitig im Bild waeren eine Doppelung.
 * Server und erster Render zeigen sie NICHT (dort gibt es kein Fenster);
 * der Beobachter entscheidet nach dem Hydratisieren.
 *
 * Der Knopf ist AddToCartButton (K1) unveraendert. Die Leiste traegt bewusst
 * NICHT `.AddToCartButtonWrapper`: Proben und Messungen greifen den Kaufknopf
 * des Kauf-Blocks ueber `#cc-kaufen .AddToCartButtonWrapper button`, und sie
 * steht im DOM nach ihm (`.first` bleibt der Knopf des Kauf-Blocks).
 */
export function Kaufleiste({selectedVariant, handle, quantity, staffelKasse = null}) {
  const {open} = useAside();
  const marktLand = useMarktLand();
  const option = cacaoSizeOptions(selectedVariant, handle, marktLand, staffelKasse).find(
    (o) => o.value === quantity,
  );
  const [zeigen, setZeigen] = useState(false);

  useEffect(() => {
    const knopf = document.querySelector('#cc-kaufen .AddToCartButtonWrapper');
    if (!knopf || typeof IntersectionObserver === 'undefined') return undefined;
    const beobachter = new IntersectionObserver(
      ([e]) => setZeigen(!(e.isIntersecting && e.intersectionRatio >= 0.99)),
      {threshold: [0, 0.99, 1]},
    );
    beobachter.observe(knopf);
    return () => beobachter.disconnect();
  }, []);

  if (!option) return null;
  const kaufbar = Boolean(selectedVariant?.availableForSale);

  return (
    <div className="cc-kaufleiste" data-cc-kaufleiste="" hidden={!zeigen}>
      <p className="cc-kaufleiste__preis">{option.kurz}</p>
      <AddToCartButton
        disabled={!kaufbar}
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
        {kaufbar ? 'In den Warenkorb legen' : 'Ausverkauft'}
      </AddToCartButton>
    </div>
  );
}
