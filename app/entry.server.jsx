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
