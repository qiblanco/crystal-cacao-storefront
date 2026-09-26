import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/*
 * ================================================================
 * CSP-MELDEWEG (2026-09-17) - REPORT-ONLY, DER NICHTS DURCHSETZT.
 * ================================================================
 * Die zwei Bloecke weiter unten sind beide auf dieselbe Weise
 * entstanden: jemand hat zufaellig eine Browser-Konsole aufgemacht
 * und gesehen, was die Richtlinie still erwuergt. Beim Podcast war
 * es eine schwarze Flaeche, beim Bakon NULL Zeilen in basis_hit
 * ueber neun Tage. Beide Male antwortete die Seite HTTP 200, beide
 * Male war das Markup vollstaendig, beide Male war jede Probe auf
 * das Markup gruen. DAS IST DIE FEHLERFORM DIESES KOPFES: er
 * blockiert leise, und nichts im Haus sagt es.
 *
 * Der Report-Only-Kopf dreht genau das um. Er traegt DIESELBE
 * Richtlinie wie der scharfe Kopf und setzt NICHTS durch - er ist
 * per Definition wirkungslos fuer den Besucher. Sein einziger
 * Zweck ist, dass der Browser jede Blockade, die der scharfe Kopf
 * ohnehin ausfuehrt, zusaetzlich MELDET. Der Rueckweg ist deshalb
 * trivial: ein Kopf, der nichts erzwingt, kann nichts brechen.
 *
 * WARUM NICHT ENGER ALS DER SCHARFE KOPF: die uebliche Bauform
 * stellt Report-Only STRENGER, um eine geplante Verschaerfung
 * vorzuwarnen. Hier ist die Frage die andere - was wird HEUTE
 * blockiert, ohne dass es jemand erfaehrt. Dafuer muss die
 * gemeldete Richtlinie die DURCHGESETZTE sein, nicht eine zweite.
 *
 * WARUM EIN AUFRUF UND EIN STRING-ANHANG, OBWOHL
 * createContentSecurityPolicy Zusatz-Direktiven ANNEHMEN WUERDE:
 * am installierten Modul gemessen (2026-09-17, @shopify/hydrogen
 * 2026.4.4, sechs Varianten hermetisch gefahren) nimmt es
 * reportUri/reportTo an und kebab-cased sie korrekt zu
 * report-uri/report-to. Es erzeugt aber bei JEDEM Aufruf ein NEUES
 * nonce - sechs Aufrufe, sechs verschiedene nonce-Werte. Ein
 * zweiter Aufruf fuer den Report-Only-Kopf haette also ein nonce
 * genannt, das die gerenderte Seite nicht traegt, und der Browser
 * haette JEDES legitime Inline-Skript der eigenen Seite gemeldet:
 * Dauerrauschen im Normalbetrieb, und zwar genau in den Deckel
 * des Empfaengers hinein. Darum: EIN Aufruf, der scharfe Kopf
 * bekommt seinen `header` UNVERAENDERT, der Report-Only-Kopf ist
 * derselbe String plus zwei Direktiven.
 *
 * WARUM NUR `report-uri` UND KEIN `report-to` - DAS IST DER
 * TEUERSTE EINZELNE BEFUND DIESES SEGMENTS, UND ER WIDERSPRICHT
 * DEM, WAS DER AUFTRAG VERLANGT HAT. Die naheliegende Bauform ist
 * "beide setzen, doppelt haelt besser": `report-uri` ist die
 * aeltere Form, die Firefox und Safari kennen, `report-to` die
 * Reporting-API, die Chromium bevorzugt. Hermetisch gemessen
 * (2026-09-17, echter headless Chromium, echte Verletzung, eigene
 * Empfaenger-Instanz, drei Arme mit derselben Verletzung):
 *   report-uri ALLEIN                        -> 1 Zeile abgelegt,
 *       inhaltlich vollstaendig (direktive, blockierter Ursprung,
 *       Pfad, disposition=report).
 *   report-to ALLEIN + Reporting-Endpoints   -> 0 Zeilen nach 40 s.
 *   BEIDE zusammen                           -> 0 Zeilen nach 70 s.
 * Die dritte Zeile ist der Befund: `report-to` macht den
 * funktionierenden Weg KAPUTT. Der Browser laesst `report-uri`
 * fallen, sobald `report-to` dasteht - so sieht es die
 * Spezifikation vor -, und liefert die Reporting-API-Meldung dann
 * selbst nicht aus. Wer beide setzt, hat NULL Meldewege statt
 * zwei, und zwar STILL: der Kopf steht, die Verletzung tritt ein,
 * der Browser bestaetigt sie intern per
 * `securitypolicyviolation`-Ereignis, und beim Empfaenger kommt
 * nichts an. Das ist exakt die Fehlerform, gegen die dieser Bau
 * gerichtet ist - eine Ebene hoeher.
 *
 * EHRLICHE GRENZE DIESER MESSUNG: gemessen ist headless Chromium
 * auf diesem Server. Ob ein echter Besucher-Browser die
 * Reporting-API bedient haette, ist damit NICHT widerlegt. Die
 * Entscheidung haengt aber nicht daran: `report-uri` liefert
 * nachweislich, und `report-to` daneben kostet nachweislich den
 * Ertrag. Das Risiko ist einseitig.
 *
 * WAS BEWUSST NICHT GESETZT WURDE - UND ES IST MEHR ALS SONST:
 *   - `report-to` (siehe oben).
 *   - Der Antwort-Kopf `Reporting-Endpoints`. Er bildet den
 *     Gruppennamen von `report-to` auf eine URL ab und ist ohne
 *     diese Direktive ein Kopf ohne Leser. Er faellt also mit ihr.
 *   - Der alte `Report-To`-Kopf (JSON mit max_age/endpoints). Durch
 *     `Reporting-Endpoints` abgeloest und aus demselben Grund
 *     gegenstandslos.
 * Wer `report-to` spaeter doch will, braucht ZUERST den positiven
 * Zustellnachweis gegen genau diesen Empfaenger - nicht die
 * Vermutung, dass es inzwischen geht. Ohne ihn nimmt die Direktive
 * den einen belegten Weg mit.
 *
 * KOSTEN, BENANNT STATT VERSCHWIEGEN: die Richtlinie steht damit
 * zweimal in jeder Antwort, rund 0,38 KB mehr Kopf. Gegen ~58 KB
 * Seite ist das unter einem Prozent; erwaehnt, weil es NICHT null
 * ist. Der zweite Kopf `Reporting-Endpoints` entfaellt.
 *
 * RUECKWEG OHNE NEUBAU: CRYSTAL_CSP_REPORT=off in repo/.env und
 * Dienst-Neustart - dann entfallen beide Koepfe, der scharfe Kopf
 * bleibt unberuehrt. Die Bauform ist die des Hauses (Konstante als
 * Boden, env als Uebersteuerung, wie QPX_BASIS_ENDPOINT_DEFAULT in
 * app/root.jsx): ausserhalb von Oxygen injiziert kein Workflow
 * PUBLIC_*-Variablen, ein Wert der NUR aus env kaeme waere hier
 * stumm.
 */
const CSP_BERICHT_ZIEL_DEFAULT = 'https://qpx.65-108-150-121.sslip.io/csp-report';

/**
 * Meldeziel aufloesen. Leer oder 'off' = kein Report-Only-Kopf.
 * @param {Record<string, string|undefined>} env
 * @returns {string|null}
 */
function berichtsziel(env) {
  const roh = (env?.CRYSTAL_CSP_REPORT ?? CSP_BERICHT_ZIEL_DEFAULT).trim();
  if (!roh || roh.toLowerCase() === 'off') return null;
  return roh;
}

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

  // Meldeweg: siehe den Block CSP-MELDEWEG am Kopf dieser Datei.
  // `header` geht UNVERAENDERT in den scharfen Kopf darueber - dieser
  // Zweig liest ihn nur, er schreibt ihn nie um.
  const ziel = berichtsziel(context.env);
  if (ziel) {
    responseHeaders.set(
      'Content-Security-Policy-Report-Only',
      `${header}; report-uri ${ziel}`,
    );
  }

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/hydrogen').HydrogenRouterContextProvider} HydrogenRouterContextProvider */
/** @typedef {import('react-router').EntryContext} EntryContext */
