/**
 * Annahme des Einwilligungs-Nachweises /api/einwilligung (Grossjob
 * cookiebot-abloesen, Segment s03, BAUVERTRAG Abschnitt 6).
 *
 * Der eigene Hinweis (public/qb-einwilligung.js) schickt nach jeder Wahl per
 * navigator.sendBeacon einen Satz im Schema 1 an diese Route, gleiche Herkunft,
 * keine Fremd-Domain im Browser. Die Route prüft die Felder, ergänzt, was nur
 * der Server weiß, und reicht den Satz an die Annahme auf unserem Server weiter
 * (einwilligung-protokoll über den qpx-Empfänger). Der Besucher bekommt sofort
 * 204; die Weiterleitung läuft danach in waitUntil und schluckt jeden Fehler.
 *
 * Ergänzt werden: Serverzeit, Land (oxygen-buyer-country), die IP GEKÜRZT auf
 * /24 bzw. /48, User-Agent und Host. Die volle IP verlässt diese Route nie.
 * Kein Cookie, kein Tracking, keine Antwort mit Inhalt.
 *
 * Einen abgewiesenen Satz meldet die Route ohne seinen Inhalt weiter
 * ({abgewiesen: <grund>}, bei einem Testsatz zusätzlich test: true), damit die
 * Annahme Fehler zählen kann. Die Wache
 * einwilligung-protokoll-wache liest diese Zähler.
 *
 * Abschalten ohne Deploy: Oxygen-Env EINWILLIGUNG_PROTOKOLL=off (dann nur 204).
 * Ziel umlenken: Oxygen-Env EINWILLIGUNG_UPSTREAM.
 */

const MAX_BYTES = 4096;
const UPSTREAM = 'https://qpx.65-108-150-121.sslip.io/collect?ziel=einwilligung';
const TIMEOUT_MS = 8000;

const METHODEN = ['alle', 'notwendig', 'auswahl', 'widerruf'];
const KATEGORIEN = ['necessary', 'preferences', 'statistics', 'marketing'];

export async function loader() {
  return new Response(null, {status: 405, headers: {Allow: 'POST'}});
}

/**
 * @param {{request: Request, context: {env?: Record<string, string | undefined>, waitUntil?: Function}}} args
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return antwort(405);
  }
  const env = context?.env || {};
  if (/^(off|aus|0|false|nein)$/i.test(String(env.EINWILLIGUNG_PROTOKOLL || ''))) {
    return antwort(204);
  }
  // Nur die eigene Seite darf senden. Ohne Origin-Kopf (manche Beacon-Wege)
  // entscheidet die Feldprüfung allein.
  const host = hostVon(request.url);
  const origin = request.headers.get('Origin');
  if (origin && hostVon(origin) !== host) {
    weiter(context, env, {schema: 1, abgewiesen: 'herkunft'});
    return antwort(403);
  }

  let roh = '';
  try {
    roh = await request.text();
  } catch {
    return antwort(400);
  }
  if (new TextEncoder().encode(roh).length > MAX_BYTES) {
    weiter(context, env, {schema: 1, abgewiesen: 'groesse'});
    return antwort(413);
  }

  let satz;
  try {
    satz = JSON.parse(roh);
  } catch {
    weiter(context, env, {schema: 1, abgewiesen: 'json'});
    return antwort(400);
  }
  const grund = pruefe(satz);
  if (grund) {
    // Ein abgewiesener TESTsatz (Rot-Arm der Naht-Probe) trägt test:true weiter,
    // damit die Annahme ihn nicht als Fehler am Rand zählt (sonst Fehlalarm der Wache).
    const test = satz && typeof satz === 'object' && satz.test === true;
    weiter(context, env, {schema: 1, abgewiesen: grund, ...(test ? {test: true} : {})});
    return antwort(400);
  }

  const {ip, quelle} = clientIp(request);
  const mitServer = {
    ...satz,
    server: {
      ts_server: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      land: landVon(request.headers.get('oxygen-buyer-country')),
      ip_gekuerzt: kuerzeIp(ip),
      ip_quelle: quelle,
      ua: (request.headers.get('User-Agent') || '').slice(0, 512),
      host,
    },
  };
  weiter(context, env, mitServer);
  return antwort(204);
}

function antwort(status) {
  return new Response(null, {status, headers: {'Cache-Control': 'no-store'}});
}

/**
 * Schema 1 (BAUVERTRAG Abschnitt 6). Liefert den Grund der Abweisung oder ''.
 * Die Annahme prüft dieselben Felder noch einmal (sie nimmt auch von anderswo an).
 */
function pruefe(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return 'form';
  if (s.schema !== 1) return 'schema';
  const texte = {
    id: /^[A-Za-z0-9+/=_.:-]{8,80}$/,
    ts_client: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/,
    motor: /^eigen$/,
    fassung: /^\d{1,3}\.\d{1,3}$/,
    texte_hash: /^([0-9a-f]{8})?$/,
    sprache: /^[a-z]{2}(-[A-Za-z]{2})?$/,
    seite: /^\/[^\u0000-\u001f\u007f]{0,1023}$/,
    shop: /^[a-z0-9]([a-z0-9.-]{0,98}[a-z0-9])?$/,
  };
  for (const [feld, muster] of Object.entries(texte)) {
    if (!(feld in s)) return `fehlt:${feld}`;
    if (typeof s[feld] !== 'string' || !muster.test(s[feld])) return `wert:${feld}`;
  }
  if (!METHODEN.includes(s.methode)) return 'methode' in s ? 'wert:methode' : 'fehlt:methode';
  if (!s.wahl || typeof s.wahl !== 'object') return 'fehlt:wahl';
  for (const k of KATEGORIEN) {
    if (typeof s.wahl[k] !== 'boolean') return `wahl:${k}`;
  }
  if (s.wahl.necessary !== true) return 'wahl:necessary';
  if ('test' in s && typeof s.test !== 'boolean') return 'typ:test';
  if ('probe' in s && (s.test !== true || typeof s.probe !== 'string' || !/^[a-z0-9-]{1,64}$/.test(s.probe))) {
    return 'wert:probe';
  }
  return '';
}

function weiter(context, env, nutzlast) {
  const ziel = env.EINWILLIGUNG_UPSTREAM || UPSTREAM;
  const senden = fetch(ziel, {
    method: 'POST',
    body: JSON.stringify(nutzlast),
    headers: {'Content-Type': 'application/json'},
    signal: typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
  }).catch(() => {
    // fail-soft: ein Satz, der nicht ankommt, zählt die Wache als Dauer-Null.
  });
  if (typeof context?.waitUntil === 'function') context.waitUntil(senden);
}

function hostVon(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Buyer-IP wie in collect.jsx: oxygen-buyer-ip ist auf Oxygen der belegte Träger.
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

/** Ländercode: genau zwei Großbuchstaben, sonst leer (z. B. Cloudflare 'T1', 'XX' bleibt erlaubt). */
function landVon(roh) {
  const l = String(roh || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(l) ? l : '';
}

/**
 * IPv4 -> a.b.c.0 (/24), IPv6 -> die ersten drei Gruppen 'x:y:z::' (/48).
 * IPv4 in IPv6 (::ffff:a.b.c.d) und 6to4 (2002::/16) zählen als IPv4. Unbekanntes -> ''.
 */
function kuerzeIp(roh) {
  const s = String(roh || '').trim().split('%')[0];
  const v4 = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(s);
  if (v4) {
    const teile = v4.slice(1, 5).map(Number);
    if (teile.some((n) => n > 255)) return '';
    return `${teile[0]}.${teile[1]}.${teile[2]}.0`;
  }
  if (!s.includes(':') || !/^[0-9a-f:]+$/i.test(s)) return '';
  const halb = s.split('::');
  if (halb.length > 2) return '';
  const kopf = halb[0] ? halb[0].split(':') : [];
  const rumpf = halb.length === 2 && halb[1] ? halb[1].split(':') : [];
  const fehlend = 8 - kopf.length - rumpf.length;
  if (halb.length === 1 ? kopf.length !== 8 : fehlend < 1) return '';
  const gruppen = [...kopf, ...Array(halb.length === 2 ? fehlend : 0).fill('0'), ...rumpf];
  if (gruppen.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return '';
  // 6to4 (2002::/16): die Bits 16-47 SIND die IPv4 des Besuchers, ein /48 hieße volle IPv4.
  // Darum wie IPv4 auf /24 kürzen (wie Python ipaddress.sixtofour in der Annahme).
  if (parseInt(gruppen[0], 16) === 0x2002) {
    const g1 = parseInt(gruppen[1], 16);
    const g2 = parseInt(gruppen[2], 16);
    return `${g1 >> 8}.${g1 & 255}.${g2 >> 8}.0`;
  }
  const vorn = gruppen.slice(0, 3).map((g) => parseInt(g, 16).toString(16));
  // Schreibweise wie Python ipaddress.compressed: führende Null-Gruppen am Ende fallen in '::'.
  while (vorn.length && vorn[vorn.length - 1] === '0') vorn.pop();
  return vorn.length ? `${vorn.join(':')}::` : '::';
}
