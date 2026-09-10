import {redirect} from 'react-router';
import {KAKAO_KOLLEKTION} from '~/lib/kakao-zone';

/**
 * SORTIMENTS-ZAUN fuer `/products` — dritter Fall derselben Klasse wie
 * `collections._index.jsx` und `collections.all.jsx`.
 *
 * WARUM ES DIESE ROUTE GIBT (Job
 * 20260910-BAU-crystal-cacao-in-die-suchmessung-und-seo-nachziehen, am
 * 2026-09-10 live gemessen, nicht vermutet):
 *
 * Hydrogen hat unter `/products` keine eigene Route. Der Aufruf fiel deshalb
 * durch bis zu `storefrontRedirect()`, das die URL-Weiterleitungen des
 * SHOPIFY-ADMINS ausliefert — und die gehoeren dem geteilten Backend, nicht
 * diesem Laden. Gemessen:
 *
 *   https://crystal-cacao.com/products
 *     -> 301 https://us.qiblanco.com/
 *     -> 301 https://qi-blanco.com/            (US-Shop, englisch, USD)
 *
 * Ein deutscher Kakao-Laden warf damit jeden Besucher und jeden Crawler, der
 * den naheliegendsten Sammelpfad probiert, ueber zwei Spruenge auf die
 * Startseite eines FREMDEN Shops. Fuer die Suchmaschine ist das ein
 * Domain-uebergreifendes Signal an genau der Stelle, an der diese Storefront
 * sonst ihr Sortiment fuehrt.
 *
 * WARUM WEITERLEITUNG UND NICHT 404 — woertlich dieselbe Begruendung wie in
 * den beiden Geschwister-Routen: ein 404 auf einem Sammelpfad braeche den
 * Kaufweg, statt ihn zu ordnen. Ziel ist die Kakao-Kollektion, also der Ort,
 * den diese Storefront als ihr Sortiment fuehrt.
 *
 * WARUM 301 UND NICHT 302 — hier weicht diese Route BEWUSST von den beiden
 * Geschwistern ab, die 302 liefern: `/products` hat kein eigenes Ziel auf
 * diesem Laden und wird auch keins bekommen; die Weiterleitung ist dauerhaft.
 * Ein 301 sagt der Suchmaschine genau das und konsolidiert das Signal auf die
 * Kollektion, statt beide Adressen dauerhaft getrennt zu fuehren.
 *
 * @param {Route.LoaderArgs} args
 */
export async function loader() {
  throw redirect(`/collections/${KAKAO_KOLLEKTION}`, 301);
}

/** @typedef {import('./+types/products._index').Route} Route */
