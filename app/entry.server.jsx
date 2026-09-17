import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} reactRouterContext
 * @param {HydrogenRouterContextProvider} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },

    /*
     * ================================================================
     * PODCAST-EINSTIEG (2026-09-09) — ZWEI HOSTS, KEINER MEHR.
     * ================================================================
     * Ohne diese zwei Zeilen ist der Podcast-Abschnitt eine SCHWARZE
     * FLAECHE mit einem Abspielknopf, der nichts tut — und zwar STILL:
     * die Seite antwortet HTTP 200, das Markup ist vollstaendig, die
     * Probe auf das src-Attribut ist gruen. GEMESSEN am eigenen Bau,
     * bevor diese Aenderung da war (Playwright-Ereignis `requestfailed`,
     * Grund woertlich `csp`):
     *   https://i.ytimg.com/vi/kd7Z-ITKYDo/sddefault.jpg -> FAIL csp
     * `img.naturalWidth` war 0 bei `complete === true`. Der Besucher
     * haette ein leeres Rechteck gesehen, und nichts im Log haette es
     * gesagt.
     *
     * WARUM DAS UEBERHAUPT PASSIERT: die Hydrogen-Vorgabe setzt kein
     * eigenes img-src/frame-src, beide fallen also auf `default-src
     * 'self' cdn.shopify.com shopify.com` zurueck. Sobald man img-src
     * ueberhaupt NENNT, gilt der Rueckfall nicht mehr — deshalb stehen
     * 'self', data: und cdn.shopify.com hier ausdruecklich MIT drin.
     * Sie wegzulassen waere kein "Standard", sondern der Verlust jedes
     * Produktbilds des Ladens.
     *
     * P10 — DAS IST DIE HAUSREGEL, NICHT EINE NEUE: qiblanco-storefront
     * app/entry.server.jsx fuehrt seit dem LP-Relaunch dieselben zwei
     * Hosts (imgSrc 'https://i.ytimg.com', frameSrc
     * 'https://www.youtube-nocookie.com'). Uebernommen ist genau das
     * Noetige.
     *
     * WAS BEWUSST NICHT UEBERNOMMEN WURDE, obwohl es dort steht:
     *   - https://www.youtube.com im frameSrc. Wir betten ausschliesslich
     *     ueber die cookielose Fassung ein; der zweite Host waere ein
     *     Weg, den niemand benutzt, und eine Erlaubnis, die niemand
     *     braucht.
     *   - Jeder script-src. Der Player laeuft in seinem EIGENEN Ursprung
     *     im iframe — unsere Seite laedt kein einziges YouTube-Skript.
     *     Ein script-src-Eintrag waere genau die Ausweitung, die nach
     *     "es funktioniert ja" aussieht und in Wahrheit fremden Code auf
     *     unserer Seite erlaubt.
     *
     * EINWILLIGUNG: das aendert NICHTS am Zeitpunkt. i.ytimg.com wird
     * erst angefragt, wenn das lazy geladene Vorschaubild in die Naehe
     * des Sichtfensters kommt; www.youtube-nocookie.com erst nach dem
     * Klick. Eine CSP ERLAUBT, sie laedt nicht.
     */
    /*
     * ================================================================
     * TRACKING-BAKON (2026-09-17) - EIN HOST, KEINER MEHR.
     * ================================================================
     * Ohne diese Zeile ist der Laden fuer die eigene Messung STUMM, und
     * zwar in derselben stillen Bauart wie der Podcast-Fall darueber:
     * die Seite antwortet HTTP 200, das Markup ist vollstaendig, jede
     * Probe auf das Markup ist gruen. GEMESSEN am 2026-09-17, woertlich
     * aus der Browser-Konsole:
     *   Connecting to 'https://qpx.65-108-150-121.sslip.io/b' violates
     *   the following Content Security Policy directive: "connect-src
     *   'self' https://cdn.shopify.com/ ..."
     * Bilanz der Stille: crystal-cacao.com ist seit dem 2026-09-08
     * oeffentlich und hatte am 2026-09-17 NULL Zeilen in basis_hit und
     * NULL in event - waehrend qiblanco.com 74836 und qi-blanco.com
     * 17756 basis_hit-Zeilen trugen.
     *
     * WARUM HIER KEIN 'self' UND KEIN cdn.shopify.com STEHT, obwohl es
     * beim imgSrc darueber ausdruecklich noetig war: connectSrc ist
     * EINER der fuenf Schluessel, die Hydrogen selbst vorbelegt
     * (baseUri, defaultSrc, frameAncestors, styleSrc, connectSrc).
     * Fuer genau diese fuenf MISCHT createContentSecurityPolicy die
     * eigene Liste vor die Vorgabe, statt sie zu ersetzen. Hermetisch
     * nachgemessen am installierten Modul, nicht aus dem Quelltext
     * geschlossen - Ergebnis dieser einen Zeile:
     *   connect-src https://qpx.65-108-150-121.sslip.io 'self'
     *   https://cdn.shopify.com/ https://monorail-edge.shopifysvc.com
     *   https://checkout.qiblanco.com https://qi-blanco.myshopify.com
     * Die Kasse und der Shopify-Kanal bleiben also unberuehrt. Bei
     * imgSrc/frameSrc gilt das NICHT - die stehen nicht in der Vorgabe
     * und ersetzen sie darum, weshalb dort jeder Host ausgeschrieben
     * ist. Die zwei Bloecke sehen gleich aus und sind es nicht.
     *
     * EIN HOST DECKT BEIDE EBENEN: die cookielose Basis-Ebene sendet an
     * /b, der einwilligungspflichtige qpx-Pixel an /collect - derselbe
     * Ursprung, also dieselbe Erlaubnis. Heute laedt nur die Basis;
     * PUBLIC_QPX_ENDPOINT und PUBLIC_COOKIEBOT_ID sind in .env bewusst
     * ungesetzt, weil die Cookiebot-Domaingruppe crystal-cacao.com
     * nicht deckt. Diese Zeile nimmt das nicht vorweg - sie erlaubt,
     * sie laedt nicht.
     *
     * WAS BEWUSST NICHT MIT AUFGENOMMEN WURDE, obwohl es auf der
     * Hauptseite steht: qiblanco.activehosted.com. Das Kursformular
     * dieses Ladens ist seit dem 2026-09-17 server-gerendert und
     * braucht keine Fremdverbindung (Commit 86e5396). Ein Eintrag
     * dafuer waere eine Erlaubnis ohne Benutzer.
     */
    connectSrc: ['https://qpx.65-108-150-121.sslip.io'],

    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://i.ytimg.com',
    ],
    frameSrc: ["'self'", 'https://www.youtube-nocookie.com'],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/hydrogen').HydrogenRouterContextProvider} HydrogenRouterContextProvider */
/** @typedef {import('react-router').EntryContext} EntryContext */
