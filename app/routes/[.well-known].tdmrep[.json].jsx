/**
 * /.well-known/tdmrep.json — MASCHINENLESBARER NUTZUNGSVORBEHALT (W3C TDMRep)
 *
 * Job 20260910-crystal-cacao-hat-kein-impressum. Übernommen aus dem
 * Schwester-Laden (`qiblanco-storefront:app/routes/[.well-known].tdmrep[.json].jsx`,
 * origin/main 389dab8, dort aus Job 20260729-homepage-anti-scraping-schutz);
 * die Rechtslage-Begründung dort gilt unverändert und wird nicht neu erfunden.
 *
 * WARUM DIESE DATEI HIER ENTSTEHT — und nicht als eigener Job später:
 * Das Impressum dieses Ladens BEHAUPTET im Abschnitt „Urheberrecht und
 * Nutzungsvorbehalt" (Pflichtfeld IMP-12 des rechtstext-checkers), der
 * Vorbehalt sei zusätzlich maschinenlesbar erklärt — und nennt genau diese
 * Datei namentlich. Gemessen am 2026-09-10 antwortete sie auf dieser Domain
 * mit HTTP 404. Der Text wäre also mit einer unwahren Aussage live gegangen.
 * Das Prinzip des Moduls ist DEKLARATION == REALER BESTAND (PR-#25-Prinzip):
 * entweder die Behauptung fällt weg, oder sie wird gedeckt. Gewählt ist das
 * Decken, weil der Vorbehalt selbst gewollt ist.
 *
 * § 44b Abs. 3 UrhG erlaubt kommerzielles Text- und Data-Mining, SOLANGE der
 * Rechteinhaber sich die Nutzung nicht vorbehalten hat — und ein Vorbehalt
 * bei online zugänglichen Werken ist nach dem derzeit geltenden
 * Berufungsmaßstab nur in MASCHINENLESBARER Form wirksam (OLG Hamburg
 * 10.12.2025, 5 U 104/24, Kneschke ./. LAION; Revision zum BGH zugelassen,
 * also nicht rechtskräftig).
 *
 * KEIN RECHTSRAT. Der Text ist der freigegebene Bestand des Schwester-Ladens;
 * die juristische Wertung bleibt Christian/Anwalt.
 *
 * Spec: https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240202/
 */

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request}) {
  const origin = new URL(request.url).origin;

  // tdm-reservation: 1 = Vorbehalt für den GESAMTEN Pfadraum ("/").
  // tdm-policy verweist auf die maschinenlesbare ODRL-Policy daneben.
  const body = JSON.stringify(
    [
      {
        location: '/',
        'tdm-reservation': 1,
        'tdm-policy': `${origin}/.well-known/tdm-policy.json`,
      },
    ],
    null,
    2,
  );

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/ld+json',
      // Der Vorbehalt gilt auch für den Abruf dieser Datei selbst.
      'tdm-reservation': '1',
      'tdm-policy': `${origin}/.well-known/tdm-policy.json`,
      // Kurz halten: eine Rechtsposition, die sich ändert, soll sich schnell
      // ausbreiten können. 1 h statt der 24 h der robots.txt.
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/** @typedef {import('./+types/[.well-known].tdmrep[.json]').Route} Route */
