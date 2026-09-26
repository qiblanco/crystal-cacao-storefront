/**
 * First-Party-Pixel-Proxy /collect (Job 20260718-storefront-pixel-tracking-
 * vertiefung, OPTIONAL + ENV-GATED AUS).
 *
 * WARUM: Safari ITP kappt JS-gesetzte Cookies auf 7 Tage (24h bei Klick-ID in
 * der Landing-URL). Nur ein HTTP-Set-Cookie von der ECHTEN First-Party
 * (qiblanco.com selbst, kein CNAME) ist davon ausgenommen (bis 400 Tage).
 * Diese Route nimmt qpx-Beacons same-origin entgegen, reicht sie server-seitig
 * an den Receiver weiter und FRISCHT dabei vorhandene First-Party-Cookies
 * (_qpx_anon/_fbp/_fbc) als HTTP-Cookies mit 400-Tage-Laufzeit auf.
 *
 * GATE (fail-closed): Ohne Oxygen-Env QPX_PROXY_UPSTREAM (Server-URL des
 * Receivers, Christian-Hand) antwortet die Route 404 — Verhalten wie heute.
 * Aktivierung = QPX_PROXY_UPSTREAM setzen UND PUBLIC_QPX_ENDPOINT auf
 * '/collect' stellen (dann sendet qpx same-origin hierher).
 *
 * Es werden KEINE neuen Cookies erzeugt und KEINE Werte erfunden — nur
 * vorhandene, format-geprüfte Werte werden verlaengert. Kein PII-Speicher.
 */

const MAX_BODY_BYTES = 262144; // 256 KB, Spiegel des Receiver-Caps
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 Tage (Chrome-Obergrenze)

export async function loader() {
  return new Response('Not found', {status: 404});
}

/**
 * @param {{request: Request, context: {env: Record<string, string | undefined>}}} args
 */
export async function action({request, context}) {
  const upstream = context.env.QPX_PROXY_UPSTREAM;
  if (!upstream) return new Response('Not found', {status: 404});
  if (request.method !== 'POST') return new Response(null, {status: 405});

  let body = '';
  try {
    body = await request.text();
  } catch {
    return new Response(null, {status: 400});
  }
  if (!body || body.length > MAX_BODY_BYTES) {
    return new Response(null, {status: 413});
  }

  const {quelle} = clientIp(request);
  let upstreamOk = false;
  try {
    const res = await fetch(upstream, {
      method: 'POST',
      body,
      headers: upstreamHeaders(request),
    });
    upstreamOk = res.status < 400;
  } catch {
    // Receiver nicht erreichbar: Beacon geht verloren (wie heute bei
    // direktem Send), aber der Cookie-Refresh unten passiert trotzdem.
  }

  const headers = new Headers({'Content-Type': 'application/json'});
  for (const cookie of refreshCookies(request)) {
    headers.append('Set-Cookie', cookie);
  }
  // `ipsrc` ist der NAME der Quelle, nie ein IP-Wert — der Aufrufer erfaehrt
  // nichts, was er nicht ohnehin über sich selbst weiß. Er existiert, damit
  // die Naht VON AUSSEN in einem einzigen Request pruefbar ist: der Fix vom
  // 2026-08-09 sah im Code richtig aus und war sieben Tage lang wirkungslos,
  // weil niemand die Wirkung messen konnte, ohne die Datenbank zu befragen.
  return new Response(JSON.stringify({ok: upstreamOk, ipsrc: quelle}), {
    status: 200,
    headers,
  });
}

/**
 * Header für den Weiterreich-Fetch an den Receiver.
 *
 * WARUM (Job 20260809-dach-tracking-schluessel-verlust, 2026-08-09): Diese
 * Route ist ein SERVERSEITIGER Proxy — der Receiver sieht also nicht den
 * Browser, sondern uns. Bis zu diesem Fix ging nur `Content-Type` mit, und
 * damit kam beim Receiver WEDER der echte User-Agent NOCH die echte Client-IP
 * an. Gemessene Folge: 0 von 11.037 DACH-Events mit device_fp/ua_hash, während
 * der USA-Shop (Liquid, sendet direkt aus dem Browser) 1.367 von 2.036 trug —
 * bei identischem Code und identischer Schalterstellung (`full` auf beiden
 * Shops). Ein Transportweg kann einen HTTP-Header still schlucken.
 *
 * Zwei Header, zwei verschiedene Empfänger im Receiver:
 *   User-Agent      -> fingerprint.ua_hash()/device_fp()/device_class()
 *   X-Forwarded-For -> basis.client_ip() nimmt den LINKESTEN Eintrag. Caddy
 *                      hängt seinen Peer rechts an, links bleibt unsere
 *                      Client-IP. Ohne diesen Header stand dort die Egress-IP
 *                      des Oxygen-Edge — der ip_net_hash war also nicht bloß
 *                      dünn, sondern FALSCH (gemessen: 190 verschiedene
 *                      Besucher hinter EINEM Hash).
 *
 * KORREKTUR 2026-08-16 (Job 20260816-dach-ipnet-transport-wirkungslos-
 * nachfassen) — die UA-Hälfte oben hat gewirkt, die IP-Hälfte NIE. Gemessen
 * über 7 Tage: `ua_hash` 0 % -> 100 %, aber der größte `ip_net_hash` blieb
 * unverändert bei 26,2 % -> 32,3 % aller DACH-Besucher (USA-Kontrollshop, der
 * direkt aus dem Browser sendet: 2,4 %). Zwei Ursachen, hintereinander — jede
 * allein hätte genügt, und beide waren im Code unsichtbar:
 *
 *   [1] FALSCHER HEADER. `CF-Connecting-IP` existiert auf Oxygen nicht. Die
 *       Cloudflare-Edge beansprucht den Namen selbst und weist einen vom
 *       Client gesetzten Wert mit "error code: 1000" ab — die App sieht ihn
 *       nie. Der dokumentierte Oxygen-Weg ist `oxygen-buyer-ip` (Shopify
 *       Oxygen-Runtime, OXYGEN_HEADERS_MAP). Auch der eingehende
 *       `X-Forwarded-For` trägt hier keine Buyer-IP. `ip` war also IMMER
 *       undefined — der Header wurde nie gesetzt, nicht einmal falsch.
 *
 *   [2] FALSCHER TRANSPORT. Der alte Kommentar an dieser Stelle sagte, Caddy
 *       hänge seinen Peer rechts an und links bleibe unsere Client-IP. Das ist
 *       widerlegt: Caddy >= 2.7 ERSETZT einen eingehenden `X-Forwarded-For`
 *       durch die Peer-Adresse, solange der Absender nicht in `trusted_proxies`
 *       steht (dort steht bei uns nichts). Beleg: ein POST mit
 *       `X-Forwarded-For: 1.2.3.4` direkt an den Caddy-vhost kam beim Receiver
 *       als dessen Peer-IP an. Über `X-Forwarded-For` kann diese Route den
 *       Receiver baulich NICHT erreichen — auch mit dem richtigen Header [1]
 *       wäre der Fix wirkungslos geblieben.
 *
 * Deshalb reist die IP jetzt unter EIGENEM Namen (`X-QPX-Client-IP`): Caddy
 * verwaltet ausschließlich XFF/X-Forwarded-Proto/X-Forwarded-Host und reicht
 * jeden anderen Header unverändert durch. Kein Caddy-Eingriff nötig — der
 * Perimeter bleibt unangetastet.
 *
 * Leere Werte werden WEGGELASSEN statt als leerer Header gesendet: der
 * Receiver soll "nicht gemessen" von "gemessen und leer" unterscheiden können.
 *
 * @param {Request} request
 */
function upstreamHeaders(request) {
  const headers = {'Content-Type': 'application/json'};

  const ua = request.headers.get('User-Agent');
  if (ua) headers['User-Agent'] = ua;

  const {ip} = clientIp(request);
  if (ip) headers['X-QPX-Client-IP'] = ip;

  return headers;
}

/**
 * Buyer-IP + NAME ihrer Quelle. Die Reihenfolge ist die Beweislage aus dem
 * Job-Header, nicht Geschmack: `oxygen-buyer-ip` ist der einzige auf Oxygen
 * belegte Träger, die beiden anderen sind Rückfälle für andere Laufzeiten
 * (lokales `h2 dev`, ein etwaiger Umzug hinter einen echten CF-Worker).
 *
 * Die Quelle wird mitgegeben, damit ein Rückfall LAUT wird: liefert Shopify
 * `oxygen-buyer-ip` eines Tages nicht mehr, steht in der Antwort `ipsrc:"keine"`
 * statt stillschweigend wieder die Egress-IP in der Datenbank.
 *
 * @param {Request} request
 * @returns {{ip: string, quelle: string}}
 */
function clientIp(request) {
  const kandidaten = [
    ['oxygen-buyer-ip', request.headers.get('oxygen-buyer-ip')],
    ['cf-connecting-ip', request.headers.get('CF-Connecting-IP')],
    ['x-forwarded-for', request.headers.get('X-Forwarded-For')?.split(',')[0]],
  ];
  for (const [quelle, roh] of kandidaten) {
    const ip = roh?.trim();
    if (ip) return {ip, quelle};
  }
  return {ip: '', quelle: 'keine'};
}

/**
 * Vorhandene First-Party-Tracking-Cookies format-geprüft als HTTP-Cookies
 * verlaengern (ITP-Exemption). Nie erfinden, nie umschreiben.
 *
 * @param {Request} request
 */
function refreshCookies(request) {
  const jar = parseCookieHeader(request.headers.get('Cookie'));
  const out = [];
  const specs = [
    // _qpx_anon: UUID-artig (qpx.js uuid())
    ['_qpx_anon', /^[0-9a-fA-F-]{16,64}$/],
    // Meta-Browser-/Klick-Cookies: immer 'fb.'-Prefix
    ['_fbp', /^fb\.[0-9]\.[0-9]{10,16}\.[\w.-]{1,128}$/],
    ['_fbc', /^fb\.[0-9]\.[0-9]{10,16}\.[\w.-]{1,255}$/],
  ];
  let domain = '';
  try {
    const host = new URL(request.url).hostname;
    if (/(^|\.)qiblanco\.com$/.test(host)) domain = '; Domain=.qiblanco.com';
  } catch {
    domain = '';
  }
  for (const [name, re] of specs) {
    const value = jar[name];
    if (!value || !re.test(value)) continue;
    out.push(
      `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}` +
        `; SameSite=Lax; Secure${domain}`,
    );
  }
  return out;
}

/**
 * @param {string | null} cookieHeader
 */
function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return cookies;
    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (name) cookies[name] = safeDecode(value);
    return cookies;
  }, {});
}

/**
 * @param {string} value
 */
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
