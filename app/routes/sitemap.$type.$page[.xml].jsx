import {sitemapSeiten, xmlAntwort} from '~/lib/sitemap-zaun';
import {fremdinhaltAbweisen} from '~/lib/kakao-zone';

/**
 * DIE EINE SITEMAP-DATEI dieser Storefront — seit 2026-09-02 (s05) aus dem
 * Sortiments-Zaun statt aus `getSitemap()`. Volle Begründung mit Messwerten am
 * Kopf von app/lib/sitemap-zaun.js.
 *
 * WARUM DIE ALTEN ABSCHNITTSNAMEN 404 GEBEN UND NICHT WEITERLEITEN: die alten
 * Adressen (/sitemap/products/1.xml, /sitemap/articles/1.xml …) haben nie einen
 * Zustand beschrieben, den es hier gibt — /sitemap/articles/1.xml zeigte auf
 * /articles/<handle>, eine Route, die diese App überhaupt nicht führt. Eine
 * Weiterleitung würde behaupten, die alte Sicht sei nur umgezogen. Sie war
 * falsch, und eine 404 sagt das.
 *
 * @param {Route.LoaderArgs}
 */
export async function loader({request, params, context: {storefront}}) {
  if (params.type !== 'seiten' || params.page !== '1') {
    throw fremdinhaltAbweisen();
  }

  const {origin} = new URL(request.url);
  return xmlAntwort(await sitemapSeiten({storefront, origin}));
}

/** @typedef {import('./+types/sitemap.$type.$page[.xml]').Route} Route */
