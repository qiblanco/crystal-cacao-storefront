import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Preis} from './Preis';
import {useVariantUrl} from '~/lib/variants';

/**
 * `preisSlot` (2026-09-08): die Kachel zeigt normalerweise den API-Preis der
 * guenstigsten Variante — fuer ein Sortiment ohne Mengenstaffel genau richtig.
 * Der Kakao HAT eine Staffel, und die Kaufseite rechnet sie (Netto -> Brutto ->
 * Mengenrabatt). Die Startseite zeigte deshalb 71,03 € netto, wo die Kaufseite
 * 53,- € auswies: zwei richtige Zahlen auf verschiedene Fragen, und der Kunde
 * sieht den hoechsten davon zuerst. Statt hier eine zweite Preisrechnung
 * einzubauen, nimmt die Kachel den fertigen Block von aussen entgegen — die
 * Rechnung bleibt an EINER Stelle (app/components/CacaoProductForm.jsx).
 *
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 *   preisSlot?: import('react').ReactNode;
 * }}
 */
export function ProductItem({product, loading, preisSlot}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {image && (
        <Image
          alt={image.altText || product.title}
          aspectRatio="1/1"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      {preisSlot ?? (
        <small>
          <Preis data={product.priceRange.minVariantPrice} />
        </small>
      )}
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
