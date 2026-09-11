/**
 * /.well-known/tdm-policy.json — ODRL-Policy zum Nutzungsvorbehalt.
 *
 * Job 20260910-crystal-cacao-hat-kein-impressum. Übernommen aus dem
 * Schwester-Laden (`qiblanco-storefront:app/routes/[.well-known].tdm-policy[.json].jsx`,
 * origin/main 389dab8). Sie ist das Ziel, auf das `tdmrep.json` im Feld
 * `tdm-policy` zeigt — ohne sie wäre dieser Verweis ein toter Link.
 *
 * Inhalt in einem Satz: Mining ist untersagt (prohibition), erlaubt nur mit
 * vorheriger schriftlicher Lizenz (permission + duty obtainConsent). Der
 * Kontaktweg für Lizenzanfragen ist BEWUSST das Impressum und keine hier
 * hartcodierte Adresse — das Impressum ist die gepflegte Wahrheit, eine
 * zweite Kopie veraltet.
 *
 * KEIN RECHTSRAT — juristische Wertung Christian/Anwalt.
 */

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request}) {
  const origin = new URL(request.url).origin;

  const body = JSON.stringify(
    {
      '@context': [
        'http://www.w3.org/ns/odrl.jsonld',
        {tdm: 'http://www.w3.org/ns/tdmrep#'},
      ],
      '@type': 'Policy',
      uid: `${origin}/.well-known/tdm-policy.json`,
      profile: 'http://www.w3.org/ns/tdmrep',
      permission: [
        {
          target: `${origin}/`,
          action: 'tdm:mine',
          assigner: `${origin}/pages/impressum`,
          // Erlaubt nur mit vorheriger schriftlicher Lizenz.
          duty: [
            {
              action: 'obtainConsent',
              target: `${origin}/pages/impressum`,
            },
          ],
        },
      ],
      prohibition: [
        {
          target: `${origin}/`,
          action: 'tdm:mine',
          // Ohne Lizenz: untersagt. Das ist der Vorbehalt nach 44b Abs. 3
          // UrhG in maschinenlesbarer Form.
        },
      ],
    },
    null,
    2,
  );

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/ld+json',
      'tdm-reservation': '1',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/** @typedef {import('./+types/[.well-known].tdm-policy[.json]').Route} Route */
