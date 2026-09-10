/**
 * @param {Route.LoaderArgs}
 */
export function loader({request}) {
  const url = new URL(request.url);
  const body = robotsTxtData({url: url.origin});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',

      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

/**
 * @param {{url?: string}}
 */
function robotsTxtData({url}) {
  const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;

  return `
# ---------------------------------------------------------------------------
# NUTZUNGSVORBEHALT / TDM RESERVATION
# (Job 20260910-crystal-cacao-hat-kein-impressum)
#
# Die Betreiberin (Qi Blanco UG (haftungsbeschränkt), siehe /pages/impressum)
# behält sich die Nutzung der Inhalte dieser Website für kommerzielles
# Text- und Data-Mining im Sinne von 44b UrhG ausdrücklich vor
# (Art. 4 Abs. 3 DSM-RL 2019/790/EU).
#
# Dieser Vorbehalt wird MASCHINENLESBAR erklärt - hier, per W3C TDMRep unter
# /.well-known/tdmrep.json und per HTTP-Header 'tdm-reservation: 1'. Grund:
# das OLG Hamburg hat am 10.12.2025 (5 U 104/24, Kneschke ./. LAION) die
# gegenteilige Lesart der Vorinstanz aufgehoben - ein Vorbehalt in bloßer
# Prosa genügt danach NICHT (Revision zum BGH zugelassen).
#
# Content Signals (Cloudflare Content Signals Policy, 24.09.2025):
#   search=yes, ai-input=yes, ai-train=no
# Lies: gefunden werden JA, als Antwortquelle zitiert werden JA,
#       als Trainingsmaterial verwendet werden NEIN.
#
# ABGRENZUNG, damit niemand hier eine Sperre vermutet, die nicht dasteht:
# das ist eine ERKLÄRUNG, keine Zugangssperre. Der Schwester-Laden
# qiblanco.com führt zusätzlich einen Disallow-Block gegen 20 Trainings-
# Crawler; dieser Laden führt ihn NICHT. Das ist eine bewusst offene
# Flanke dieses Jobs (Zugangssperren sind eine eigene Entscheidung mit
# eigener SEO-Wirkung), keine Lücke im Vorbehalt.
# ---------------------------------------------------------------------------

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
${generalDisallowRules({sitemapUrl})}

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /cart
Disallow: /account
Disallow: /search
Allow: /search/
Disallow: /search/?*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: MJ12bot
Crawl-Delay: 10

User-agent: Pinterest
Crawl-delay: 1
`.trim();
}

/**
 * This function generates disallow rules that generally follow what Shopify's
 * Online Store has as defaults for their robots.txt
 * @param {{sitemapUrl?: string}}
 */
function generalDisallowRules({sitemapUrl}) {
  return `Disallow: /cart
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: /*/collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /policies/
Disallow: /search
Allow: /search/
Disallow: /search/?*
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}`;
}

/** @typedef {import('./+types/[robots.txt]').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
