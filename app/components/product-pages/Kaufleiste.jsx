import {useEffect, useRef, useState} from 'react';
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
 * die Entscheidung faellt nach dem Hydratisieren.
 *
 * „GANZ IM FENSTER" HEISST: ueber der Unterkante des KLEINEN Fensters
 * (100svh, Browserleisten ausgeklappt) und ueber dem offenen
 * Einwilligungshinweis (--qb-ew-hoehe). Bis 2026-11-01 entschied ein
 * IntersectionObserver gegen innerHeight; die waechst, wenn die Leisten
 * einklappen, und an derselben Scrollposition sprang die Leiste dann aus
 * und wieder an (echtgeraet_probe: iphone-chrome 6, iphone-safari 4,
 * android-chrome 3 Stellen; Job 20261101-crystal-kaufleiste-blendet-mit-
 * browserleisten). 100svh bleibt beim Einklappen stehen, also auch die
 * Entscheidung. Im eingeklappten Zustand liegt die Leiste ueber dem Streifen
 * unter 100svh und deckt den Knopf des Kauf-Blocks dort ab. Das Messelement
 * `.cc-kaufleiste-mass` (kakao-seiten.css) liefert 100svh; ohne svh-Kenntnis
 * misst es 0, dann gilt innerHeight wie vorher.
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
  const mass = useRef(null);

  useEffect(() => {
    const knopf = document.querySelector('#cc-kaufen .AddToCartButtonWrapper');
    if (!knopf) return undefined;
    const html = document.documentElement;
    let rahmen = 0;
    const entscheide = () => {
      rahmen = 0;
      const unten = mass.current?.offsetHeight || window.innerHeight;
      const hinweis = html.hasAttribute('data-qb-einwilligung-offen')
        ? parseFloat(
            getComputedStyle(html).getPropertyValue('--qb-ew-hoehe'),
          ) || 0
        : 0;
      const r = knopf.getBoundingClientRect();
      setZeigen(!(r.top >= -1 && r.bottom <= unten - hinweis + 1));
    };
    const anstossen = () => {
      if (!rahmen) rahmen = requestAnimationFrame(entscheide);
    };
    entscheide();
    // Ausloeser: Scrollen, Fenstergroesse, Knopf kreuzt den Fensterrand,
    // Seite waechst (Bilder, Bewertungen), Einwilligungshinweis auf/zu.
    window.addEventListener('scroll', anstossen, {passive: true});
    window.addEventListener('resize', anstossen);
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(anstossen, {threshold: [0, 0.99, 1]});
    io?.observe(knopf);
    const ro =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(anstossen);
    ro?.observe(document.body);
    const mo = new MutationObserver(anstossen);
    mo.observe(html, {
      attributes: true,
      attributeFilter: ['data-qb-einwilligung-offen', 'style'],
    });
    return () => {
      if (rahmen) cancelAnimationFrame(rahmen);
      window.removeEventListener('scroll', anstossen);
      window.removeEventListener('resize', anstossen);
      io?.disconnect();
      ro?.disconnect();
      mo.disconnect();
    };
  }, []);

  if (!option) return null;
  const kaufbar = Boolean(selectedVariant?.availableForSale);

  return (
    <>
      <div className="cc-kaufleiste-mass" aria-hidden="true" ref={mass} />
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
    </>
  );
}
