/**
 * DIE SITEMAP DIESER STOREFRONT — gezäunt wie alles andere auch.
 *
 * WARUM SIE NICHT MEHR AUS `getSitemap()` KOMMT (gemessen 2026-09-02, Job
 * …-prio6-s05, am laufenden dev-Server, nicht aus der Doku abgeleitet):
 *
 * Der Hydrogen-Helfer fragt den Shopify-Katalog HINTER dieser Storefront ab —
 * denselben Katalog, den der Sortiments-Zaun aus s02 an der Route absichtlich
 * abweist. Beides zusammen ergibt den teuersten Zustand, den es hier geben
 * kann: die Sitemap MELDET Adressen an, die der eigene Shop mit 404
 * beantwortet. Gezählt am 2026-09-02:
 *
 *   /sitemap/pages/1.xml        51 Adressen — davon EINE erreichbar
 *                               (/pages/crystal-cacao). Die übrigen 50 sind
 *                               Qi-Blanco-Seiten: /pages/qione, /pages/qihome,
 *                               /pages/qibracelet, /pages/studien,
 *                               /pages/impressum, /pages/superhuman-kurs …
 *   /sitemap/collections/1.xml   7 Adressen — davon NULL erreichbar. Die
 *                               einzige echte Kakao-Kollektion
 *                               (zeremonie-kakao) steht nicht einmal drin.
 *   /sitemap/articles/1.xml     Adressen der Form /articles/<handle> — diese
 *                               Route EXISTIERT in dieser App überhaupt nicht
 *                               (Artikel liegen unter /blogs/<blog>/<artikel>).
 *                               Jede einzelne war schon vor dem Zaun tot.
 *   /sitemap/blogs/1.xml        die drei Fremdblogs, seit s05 alle 404.
 *
 * DAZU EIN ZWEITER, UNABHÄNGIGER FEHLER: der Helfer war auf
 * `locales: ['EN-US','EN-CA','FR-CA']` konfiguriert — die Hydrogen-Schablone,
 * nie angepasst. Jede Adresse trug damit drei `hreflang`-Alternativen auf
 * Pfade, die diese App nicht bedient. Das ist kein Kosmetikfehler: hreflang auf
 * eine 404 ist ein Widerspruch, den Suchmaschinen der Domain anlasten, nicht
 * der Zeile.
 *
 * WARUM EIGENBAU STATT KONFIGURATION: `getSitemap()` nimmt einen `getLink`-Haken
 * für die FORM der Adresse, aber keinen Filter für ihre AUSWAHL. Es gibt in der
 * öffentlichen Schnittstelle keine Stelle, an der man ihm den Zaun mitgeben
 * könnte. Ein `getLink`, das für Fremdtreffer eine leere Zeichenkette liefert,
 * wäre eine Fälschung an der falschen Ebene.
 *
 * DIE AUSWAHL KOMMT AUS DERSELBEN SSoT WIE DIE ROUTEN (app/lib/kakao-zone.js).
 * Das ist der ganze Punkt: eine zweite Liste hätte genau die Divergenz erzeugt,
 * die dieser Bau behebt — Route sagt 404, Sitemap sagt "gibt es". Produkte
 * folgen wie an der Route der KOLLEKTIONS-MITGLIEDSCHAFT, nicht einer Liste;
 * ein im Admin angelegtes Kakao-Produkt steht damit ohne Code-Änderung drin.
 */
import {
  KAKAO_KOLLEKTION,
  KAKAO_KOLLEKTIONEN,
  KAKAO_SEITEN,
  KAKAO_BLOGS,
} from '~/lib/kakao-zone';

/** Wieviele Produkte höchstens gezogen werden. Deckelt die Antwort, entscheidet nichts. */
const PRODUKTE_MAX = 250;

const SITEMAP_PRODUKTE_QUERY = `#graphql
  query SitemapProdukte($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          handle
          updatedAt
        }
      }
    }
  }
`;

const SITEMAP_SEITEN_QUERY = `#graphql
  query SitemapSeiten($first: Int!) {
    pages(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
  }
`;

/** XML-Sonderzeichen in einer Adresse. Kein Kunde tippt sie, ein Handle kann sie tragen. */
function xmlEscape(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlEintrag({loc, lastmod, changefreq, priority}) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function urlset(eintraege) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eintraege.join('\n')}
</urlset>
`;
}

export function xmlAntwort(body) {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

/**
 * Der Sitemap-Index. Bewusst EIN Abschnitt: die Kakao-Welt ist klein genug für
 * eine Datei, und ein Index mit fünf Abschnitten, von denen vier leer sind,
 * wäre eine Behauptung über Umfang, die nicht stimmt.
 */
export function sitemapIndex(origin) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${xmlEscape(`${origin}/sitemap/seiten/1.xml`)}</loc></sitemap>
</sitemapindex>
`;
}

/**
 * Alle Adressen, die diese Storefront wirklich ausliefert.
 *
 * @param {{storefront: any, origin: string}} args
 * @returns {Promise<string>} das fertige XML
 */
export async function sitemapSeiten({storefront, origin}) {
  const eintraege = [];

  // 1. Die Startseite.
  eintraege.push(
    urlEintrag({loc: `${origin}/`, changefreq: 'weekly', priority: '1.0'}),
  );

  // 2. Die freigegebenen CMS-Seiten — aus der SSoT, gegen den echten Bestand
  //    geprüft. Ein Handle, den Shopify nicht (mehr) führt, kommt NICHT herein:
  //    sonst stünde eine 404 in der eigenen Sitemap, also genau der Fehler,
  //    den dieser Bau behebt.
  let seiten = [];
  try {
    const {pages} = await storefront.query(SITEMAP_SEITEN_QUERY, {
      variables: {first: PRODUKTE_MAX},
    });
    seiten = pages?.nodes ?? [];
  } catch (fehler) {
    // Fail-soft mit Protokoll: eine unvollständige Sitemap ist besser als eine
    // 500er-Sitemap — aber der Ausfall wird benannt, nicht verschluckt.
    console.error('sitemap: Seiten-Abfrage fehlgeschlagen', fehler);
  }
  for (const seite of seiten) {
    if (!KAKAO_SEITEN.includes(seite.handle)) continue;
    eintraege.push(
      urlEintrag({
        loc: `${origin}/pages/${seite.handle}`,
        lastmod: seite.updatedAt,
        changefreq: 'weekly',
        priority: '0.9',
      }),
    );
  }

  // 3. Die freigegebenen Kollektionen.
  for (const handle of KAKAO_KOLLEKTIONEN) {
    eintraege.push(
      urlEintrag({
        loc: `${origin}/collections/${handle}`,
        changefreq: 'weekly',
        priority: '0.8',
      }),
    );
  }

  // 4. Die Produkte — über die Kollektions-Mitgliedschaft, exakt wie die Route
  //    entscheidet (kakao-zone.js istKakaoProdukt).
  let produkte = [];
  try {
    const {collection} = await storefront.query(SITEMAP_PRODUKTE_QUERY, {
      variables: {handle: KAKAO_KOLLEKTION, first: PRODUKTE_MAX},
    });
    produkte = collection?.products?.nodes ?? [];
  } catch (fehler) {
    console.error('sitemap: Produkt-Abfrage fehlgeschlagen', fehler);
  }
  for (const produkt of produkte) {
    eintraege.push(
      urlEintrag({
        loc: `${origin}/products/${produkt.handle}`,
        lastmod: produkt.updatedAt,
        changefreq: 'weekly',
        priority: '0.9',
      }),
    );
  }

  // 5. Blogs: heute keine (KAKAO_BLOGS leer). Die Schleife steht trotzdem hier,
  //    damit der Rückweg wirklich EINE Zeile in der SSoT ist und nicht ein
  //    vergessener Zweig.
  for (const handle of KAKAO_BLOGS) {
    eintraege.push(
      urlEintrag({
        loc: `${origin}/blogs/${handle}`,
        changefreq: 'weekly',
        priority: '0.6',
      }),
    );
  }

  return urlset(eintraege);
}
