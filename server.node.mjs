#!/usr/bin/env node
/**
 * PROTOTYP s05 — Node-Adapter: Hydrogen ausserhalb von Oxygen.
 * ============================================================
 * Startet das ohne `oxygen()` gebaute Bundle auf einem gewoehnlichen
 * Node-HTTP-Server. Laeuft die Anwendung hier, laeuft sie auf `workerd`
 * (Cloudflare/Oxygen) erst recht — Node ist der haertere Fall.
 *
 * WAS DIESER ADAPTER IST: der Ersatz fuer genau die DREI Zulieferungen, die
 * heute Oxygen stellt (so eingegrenzt in RECHERCHE-s02.md, Abschnitt 2a):
 *
 *   1. `caches`    -> globalThis-Polyfill ueber InMemoryCache aus @shopify/hydrogen
 *   2. `waitUntil` -> ein executionContext mit echter Funktion
 *   3. `env`       -> process.env via dotenv
 *
 * WAS ER BEWUSST NICHT IST: ein Umbau der Anwendung. Keine Datei unter `app/`
 * wird angefasst. `app/lib/context.js` ist im shared/UPSTREAM.json als K3
 * gefuehrt, `app/lib/markt-pricing.js` als K1; der naheliegende Direkteingriff
 * (`caches.open` -> `new InMemoryCache()`) waere dort eine Klassen-Verletzung.
 * Weil der Adapter `caches` global bereitstellt, bleibt die Zeile
 * `caches.open('hydrogen')` in context.js unveraendert lauffaehig — und weil er
 * einen echten `waitUntil` uebergibt, traegt auch
 * `executionContext.waitUntil.bind(executionContext)` unveraendert.
 *
 * ------------------------------------------------------------------------
 * DIE FALLE, DIE DIESER ADAPTER BEWUSST NICHT BAUT (der teuerste Punkt)
 * ------------------------------------------------------------------------
 * Shopifys offizielles Express-Rezept baut jede Anfrage so:
 *
 *     const request = new Request(`http://localhost${req.url}`, {...});
 *
 * Der echte Hostname geht dabei verloren. In einem Demo ist das egal; bei uns
 * ist es ein Falsch-Gruen der teuersten Sorte: `app/lib/checkout-tracking.js`
 * liest den `hostname` aus der Request-URL und prueft ihn gegen eine Allowlist
 * — ausdruecklich fail-closed ("im Zweifel KEIN Tracking"). Mit dem Host
 * `localhost` liefert sie `false`: die Seite laeuft, der Bau ist gruen, das
 * Tracking ist AUS und niemand merkt es. 14+ Stellen lesen `request.url`.
 *
 * Deshalb rekonstruiert `echteAnfrageUrl()` unten den ECHTEN Ursprung aus den
 * Kopfzeilen — und faellt NIE auf `localhost` zurueck. Fehlt jede Host-Angabe,
 * antwortet der Adapter mit 400 statt sich einen Host auszudenken: ein lauter
 * Fehlschlag ist billiger als ein stilles Falsch-Gruen.
 *
 * Aufruf:
 *   node server.node.mjs [--port 3000] [--build ./dist-node/server/index.js]
 *
 * Der Prototyp bindet absichtlich an 127.0.0.1 (nicht 0.0.0.0): er ist NICHT
 * fuer das oeffentliche Netz bestimmt. Christians stehende Anordnung lautet,
 * dass das Veroeffentlichen ihm gehoert.
 */

import http from 'node:http';
import {Readable} from 'node:stream';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Argumente
// ---------------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PORT = Number(arg('port', process.env.PORT || 3000));
const HOST_BIND = '127.0.0.1';
const BUILD_PFAD = path.resolve(
  WURZEL,
  arg('build', './dist-node/server/index.js'),
);
const CLIENT_DIR = path.resolve(WURZEL, arg('client', './dist-node/client'));

// ---------------------------------------------------------------------------
// 3. env — Umgebungsvariablen (Werte werden nie protokolliert)
// ---------------------------------------------------------------------------
// Der Kommentar im Shopify-Rezept ist hier zutreffend und wird befolgt:
// "Don't capture process.env too early - it needs to be accessed after dotenv
// loads". Deshalb wird `env` erst je Anfrage gelesen, nicht beim Modulstart.
const {default: dotenv} = await import('dotenv');
dotenv.config({path: path.join(WURZEL, '.env'), quiet: true});

const PFLICHT_VARIABLEN = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
];
const fehlend = PFLICHT_VARIABLEN.filter((n) => !process.env[n]);
if (fehlend.length) {
  // Namen, nie Werte.
  console.error(
    `[FEHLT] Diese Umgebungsvariablen sind nicht gesetzt: ${fehlend.join(', ')}`,
  );
  process.exit(78); // EX_CONFIG
}

// ---------------------------------------------------------------------------
// 1. caches — Web-Cache-API, die es auf Node nicht gibt
// ---------------------------------------------------------------------------
const {InMemoryCache} = await import('@shopify/hydrogen');
const cacheInstanz = new InMemoryCache();

if (!globalThis.caches) {
  globalThis.caches = {
    open: async () => cacheInstanz,
    match: async (anfrage) => cacheInstanz.match(anfrage),
    has: async () => true,
    delete: async () => false,
    keys: async () => ['hydrogen'],
  };
}

// ---------------------------------------------------------------------------
// Das gebaute Bundle
// ---------------------------------------------------------------------------
if (!fs.existsSync(BUILD_PFAD)) {
  console.error(
    `[FEHLT] Bundle nicht gefunden: ${BUILD_PFAD}\n` +
      `Erst bauen:  CRYSTAL_NODE_BUILD=1 npx react-router build --config vite.config.node.mjs`,
  );
  process.exit(78);
}
const bundle = await import(pathToFileURL(BUILD_PFAD).href);
const handler = bundle.default;
if (typeof handler?.fetch !== 'function') {
  console.error(
    `[FEHLT] Das Bundle exportiert keinen fetch-Handler (default.fetch). ` +
      `Wurde der SSR-Einstieg (./server.js) wirklich gebaut?`,
  );
  process.exit(78);
}

// ---------------------------------------------------------------------------
// Der echte Ursprung — siehe Kopf. Faellt NIE auf localhost zurueck.
// ---------------------------------------------------------------------------
function ersterWert(kopf) {
  if (!kopf) return undefined;
  const v = Array.isArray(kopf) ? kopf[0] : kopf;
  // "x-forwarded-host: a, b" -> a
  return String(v).split(',')[0].trim() || undefined;
}

function echteAnfrageUrl(req) {
  const host =
    ersterWert(req.headers['x-forwarded-host']) ??
    ersterWert(req.headers.host);
  if (!host) return null; // -> 400, statt sich einen Host auszudenken

  const proto =
    ersterWert(req.headers['x-forwarded-proto']) ??
    (req.socket && req.socket.encrypted ? 'https' : 'http');

  return `${proto}://${host}${req.url}`;
}

function nodeAnfrageZuRequest(req, url) {
  const headers = new Headers();
  for (const [name, wert] of Object.entries(req.headers)) {
    if (wert === undefined) continue;
    if (Array.isArray(wert)) wert.forEach((w) => headers.append(name, w));
    else headers.set(name, wert);
  }

  const hatKoerper = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers,
    ...(hatKoerper
      ? {body: Readable.toWeb(req), duplex: 'half'}
      : {}),
  });
}

async function antwortSchreiben(response, res) {
  const kopfzeilen = {};
  response.headers.forEach((wert, name) => {
    if (name.toLowerCase() !== 'set-cookie') kopfzeilen[name] = wert;
  });

  // set-cookie darf nicht zu EINER Zeile zusammengefaltet werden — sonst
  // verliert der Warenkorb seine Sitzung. Node nimmt dafuer ein Array, aber
  // NUR wenn es Teil des writeHead-Objekts ist: ein `setHeader` NACH
  // `writeHead` wirft ERR_HTTP_HEADERS_SENT. Genau das war hier ein echter
  // Fehlschlag — und er kam als HTTP 200 mit 28-Byte-Fehlerkoerper zurueck,
  // also als scheinbar gesunde Antwort. Deshalb misst die Kaufweg-Probe
  // Inhalt und Wirkung, nie den Status-Code.
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
  if (cookies.length) kopfzeilen['set-cookie'] = cookies;

  res.writeHead(response.status, kopfzeilen);

  if (!response.body) return res.end();
  await new Promise((fertig, fehler) => {
    Readable.fromWeb(response.body).pipe(res).on('finish', fertig).on('error', fehler);
  });
}

// ---------------------------------------------------------------------------
// Statische Dateien (das uebernimmt sonst Oxygens Netzrand)
// ---------------------------------------------------------------------------
const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.map': 'application/json',
};

function statischAusliefern(req, res) {
  let pfad;
  try {
    pfad = decodeURIComponent(new URL(req.url, 'http://platzhalter').pathname);
  } catch {
    return false;
  }
  const datei = path.resolve(CLIENT_DIR, '.' + pfad);
  // Pfad-Ausbruch verhindern
  if (!datei.startsWith(CLIENT_DIR + path.sep)) return false;
  if (!fs.existsSync(datei) || !fs.statSync(datei).isFile()) return false;

  const typ = MIME[path.extname(datei).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': typ,
    // Die gehashten Assets sind unveraenderlich; alles andere kurz.
    'Cache-Control': pfad.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600',
  });
  fs.createReadStream(datei).pipe(res);
  return true;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    if (statischAusliefern(req, res)) return;

    const url = echteAnfrageUrl(req);
    if (!url) {
      res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
      return res.end(
        'Kein Host-Kopf. Dieser Adapter erfindet bewusst keinen Host ' +
          '(sonst faellt das Tracking still aus).\n',
      );
    }

    const request = nodeAnfrageZuRequest(req, url);

    // 2. waitUntil — auf einem zustandsbehafteten Node-Server laeuft der
    // Prozess nach der Antwort weiter; die Zusage muss also nur eingeloest,
    // nicht verlaengert werden. Fehler werden geschluckt wie bei Oxygen,
    // aber protokolliert statt verschwiegen.
    const executionContext = {
      waitUntil(versprechen) {
        Promise.resolve(versprechen).catch((e) =>
          console.error('[waitUntil]', e),
        );
      },
      passThroughOnException() {},
    };

    const response = await handler.fetch(
      request,
      process.env,
      executionContext,
    );
    await antwortSchreiben(response, res);
  } catch (fehler) {
    console.error('[500]', fehler);
    if (!res.headersSent) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
    }
    res.end('An unexpected error occurred');
  }
});

server.listen(PORT, HOST_BIND, () => {
  console.log(
    `[bereit] Hydrogen ohne Oxygen auf http://${HOST_BIND}:${PORT} ` +
      `(Bundle: ${path.relative(WURZEL, BUILD_PFAD)})`,
  );
  console.log(
    `[hinweis] Nur lokal gebunden. Aufruf mit echtem Host z.B.:\n` +
      `          curl -H 'Host: crystal-cacao.com' http://${HOST_BIND}:${PORT}/`,
  );
});
