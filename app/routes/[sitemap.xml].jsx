import {sitemapIndex, xmlAntwort} from '~/lib/sitemap-zaun';

/**
 * SITEMAP-INDEX — seit 2026-09-02 (s05) aus dem Sortiments-Zaun statt aus
 * `getSitemapIndex()`. Die Begründung mit allen gemessenen Zahlen steht am Kopf
 * von app/lib/sitemap-zaun.js; kurz: der Helfer meldete 58 Adressen an, die
 * dieselbe App mit 404 beantwortet, dazu drei hreflang-Sprachen, die es hier
 * nicht gibt.
 *
 * @param {Route.LoaderArgs}
 */
export function loader({request}) {
  const {origin} = new URL(request.url);
  return xmlAntwort(sitemapIndex(origin));
}

/** @typedef {import('./+types/[sitemap.xml]').Route} Route */
