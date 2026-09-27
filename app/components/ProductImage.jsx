import {Image} from '@shopify/hydrogen';

/**
 * @param {{
 *   image: ProductVariantFragment['image'];
 *   vorrang?: boolean;
 * }}
 *
 * vorrang (Default true): fetchpriority="high" am Hauptbild. Nur abschalten, wo
 * ein anderes Element das LCP ist (QiBracelet, QiHome Air: das 360-Video),
 * sonst konkurriert das Bild mit ihm um die Leitung. eager bleibt immer.
 */
export function ProductImage({image, vorrang = true}) {
  if (!image) return <div className="product-image" />;

  return (
    <div className="product-image">
      <Image
        alt={image.altText || 'Produktbild'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
        /*
         * Das Hauptbild der Galerie steht auf jeder Kaufseite im ersten
         * Bildschirm und ist auf den QiOne- und Kakao-Kaufseiten das
         * LCP-Element (gemessen 2026-09-27, mobil 390x844 und desktop
         * 1440x900). Hydrogen setzt ohne Angabe loading="lazy": der Abruf
         * startete dann erst nach dem Layout, auf crystal-cacao.com bei
         * 1 335 ms statt mit dem HTML. Deshalb eager und hohe Priorität.
         * Am Zwilling (mobil, gedrosselt): QiOne 2 Pro LCP 6,9 -> 4,1 s, und
         * der CLS fällt von 0,3 auf 0,04, weil das Bild vor dem ersten
         * Zeichnen da ist. Wo ein Video das LCP ist (QiBracelet, QiHome Air),
         * kostet die hohe Priorität am Zwilling (5 Läufe, abwechselnd) mobil
         * 110-140 ms und desktop 60-130 ms; dort übergeben die Aufrufer
         * vorrang={false} und das Bild lädt eager ohne fetchpriority.
         * fetchpriority klein geschrieben: react-dom 18.3 warnt bei der
         * camelCase-Form (Messung im Kopf von reusables/LazyImage.jsx).
         */
        loading="eager"
        fetchpriority={vorrang ? 'high' : undefined}
      />
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
