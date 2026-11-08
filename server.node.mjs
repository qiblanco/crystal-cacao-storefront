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
 *   4. `oxygen-buyer-country` -> aus einer lokalen IP-Land-Tabelle (2026-09-04)
 *   6. `oxygen-buyer-ip` -> die Kunden-Adresse selbst (2026-09-29, siehe unten)
 *
 * Zulieferung 4 kam spaeter dazu und ist die einzige mit direkter
 * Umsatzwirkung: `app/lib/markt-pricing.js` liest den Laendercode aus genau
 * dieser Kopfzeile und faellt ohne sie fail-closed auf `DE` zurueck. Der
 * Laden fuehrt AT/CH/US frei; ein Schweizer Besucher saehe also EUR statt
 * CHF, ein US-Besucher EUR statt USD. Gemessen an den Kakao-Seiten der
 * DACH-Storefront (2026-07-09..2026-09-04) betrifft das 20,0 % der
 * Seitenaufrufe und 40,3 % der unterscheidbaren Besucher.
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
import {
  ladeTabelle,
  kundenAdresse,
  istNichtOeffentlicheSchreibweise,
  v4ZuZahl,
  v6ZuPaar,
} from '../geo/laendererkennung.mjs';

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
// 5. fetch mit Strom-Rumpf — Node verlangt `duplex: 'half'`, workerd nicht
// ---------------------------------------------------------------------------
// Hydrogen reicht `/api/(unstable|YYYY-MM)/graphql.json` per
// `storefront.forward()` an Shopify weiter und uebergibt dabei den Rumpf der
// Browser-Anfrage als ReadableStream: `fetch(url, {method, body: g.body})`.
// Auf Oxygen laeuft das. Node (undici) wirft ohne `duplex: 'half'`
// "RequestInit: duplex option is required when sending a body." — server.js
// faengt das und antwortet 500. Gemessen 2026-09-23: 500 auf allen 10 Seiten,
// dieselbe Anfrage an qiblanco.com (Oxygen) 200. Aufrufer im Browser ist
// `useShopifyCookies` (Anfrage `ensureCookies`), also die Tracking-Werte von
// Shopify Analytics — der Warenkorb laeuft serverseitig und war nicht betroffen.
// Der Fix gehoert hierher und nicht nach node_modules oder app/: es ist dieselbe
// Art Zulieferung wie `caches`, eine Eigenschaft der Laufzeit, nicht der App.
const ursprungsFetch = globalThis.fetch;
globalThis.fetch = function fetchMitDuplex(eingabe, init) {
  if (
    init &&
    init.duplex === undefined &&
    init.body != null &&
    typeof init.body.getReader === 'function'
  ) {
    init = {...init, duplex: 'half'};
  }
  return ursprungsFetch(eingabe, init);
};

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
// 4. oxygen-buyer-country — die Laender-Zulieferung des Netzrands
// ---------------------------------------------------------------------------
// DREI EIGENSCHAFTEN, UND JEDE EINZELNE IST TRAGEND:
//
// (a) DIE EINGEHENDE KOPFZEILE WIRD IMMER ENTFERNT, auch wenn die Erkennung
//     abgeschaltet ist oder nichts findet. Ohne diesen Griff koennte ein
//     Besucher seinen eigenen `oxygen-buyer-country`-Kopf mitschicken und sich
//     den Waehrungskontext selbst aussuchen — auf Oxygen unmoeglich (der
//     Netzrand setzt ihn), hier ohne Weiteres. Der Adapter stellt Oxygen
//     nach, und dazu gehoert, dass diese Kopfzeile NICHT vom Kunden kommt.
//
// (b) FAIL-CLOSED HEISST: KEINE KOPFZEILE. Kennt die Tabelle die Adresse
//     nicht, fehlt die Tabelle, oder ist die Erkennung per Schalter aus, dann
//     wird schlicht nichts gesetzt — und `resolveCountry()` in der Anwendung
//     macht daraus ihren DE-Default. Der Adapter raet nie ein Land. Ein
//     falscher Waehrungskontext ist teurer als ein konservativer.
//
// (c) DIE ADRESSE KOMMT AUS DEM LETZTEN `x-forwarded-for`-EINTRAG, nicht aus
//     dem ersten. Caddy setzt `header_up X-Forwarded-For {remote_host}`; ob
//     er den Wert dabei ersetzt oder anhaengt, ist eine Konfigurationsfrage,
//     die sich aendern kann. Der LETZTE Eintrag stammt in beiden Faellen von
//     unserem eigenen Netzrand — ein selbst mitgeschickter Wert des Kunden
//     stuende davor und kann die Auskunft damit nicht kapern.
const GEO_KOPF = 'oxygen-buyer-country';
const GEO_AN = (process.env.CRYSTAL_GEO ?? 'on').toLowerCase() !== 'off';
const ZAEHLER_DATEI = path.resolve(WURZEL, '../state/geo-zaehler.json');

let geoTabelle = null;
if (GEO_AN) {
  try {
    geoTabelle = ladeTabelle();
    const m = geoTabelle.meta ?? {};
    console.log(
      `[geo] Laendererkennung AN — Tabelle ${m.quelle_stand ?? '?'} ` +
        `(${geoTabelle.n4} IPv4- + ${geoTabelle.n6} IPv6-Bereiche, ${geoTabelle.nCc} Laender)`,
    );
  } catch (fehler) {
    // Laut, aber nicht toedlich: der Laden laeuft weiter und zeigt DE — das
    // ist der konservative Zustand, nicht der kaputte. Ein Absturz hier
    // waere die teurere Antwort auf ein Problem, das den Verkauf nicht
    // blockiert.
    console.error(
      `[geo] KEINE LAENDERERKENNUNG — Tabelle nicht ladbar: ${fehler.message}\n` +
        `      Alle Besucher sehen den DE-Kontext. Beheben mit:\n` +
        `      node geo/bin/tabelle-bauen.mjs --holen`,
    );
  }
} else {
  console.log('[geo] Laendererkennung AUS (CRYSTAL_GEO=off) — alle Besucher sehen den DE-Kontext.');
}

// Messlog statt blossem Urteil: die WERTE werden gefuehrt, damit ein
// Fehlerfall von einer echten Null unterscheidbar bleibt. Eine Wache, die nur
// "0 Treffer" meldet, ist von einer abgeschalteten nicht zu unterscheiden.
const zaehler = {
  seit_utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  tabelle_stand: geoTabelle?.meta?.quelle_stand ?? null,
  erkennung_an: GEO_AN && geoTabelle !== null,
  anfragen: 0,
  ohne_adresse: 0,
  nicht_oeffentlich: 0,
  unbekannt: 0,
  erkannt: 0,
  kopf_verworfen: 0, // eingehende Faelschungsversuche bzw. Altlasten
  je_land: {},
  // Zulieferung 6 (oxygen-buyer-ip), eigene Felder, damit die Laender-Wache
  // (proben/probe_geo_wirkt.mjs) ihre Quote unveraendert rechnet.
  kaeufer_ip_an: null,
  kaeufer_ip_gesetzt: 0,
  kaeufer_ip_verworfen: 0,
};
let zaehlerSchmutzig = false;

function zaehlerSchreiben() {
  if (!zaehlerSchmutzig) return;
  zaehlerSchmutzig = false;
  try {
    fs.mkdirSync(path.dirname(ZAEHLER_DATEI), {recursive: true});
    fs.writeFileSync(
      ZAEHLER_DATEI,
      JSON.stringify({...zaehler, stand_utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z')}, null, 2) + '\n',
    );
  } catch (e) {
    console.error('[geo] Zaehler nicht schreibbar:', e.message);
  }
}
const zaehlerUhr = setInterval(zaehlerSchreiben, 60_000);
zaehlerUhr.unref();
// SIGTERM/SIGINT: siehe "Geordnetes Ende" unter dem Server (braucht `server`).

/**
 * Setzt die Laender-Kopfzeile — oder entfernt sie ersatzlos.
 * @param {Headers} headers bereits aus der Node-Anfrage gefuellt
 * @param {import('node:http').IncomingMessage} req
 */
function laenderKopfStellen(headers, req) {
  zaehler.anfragen++;
  zaehlerSchmutzig = true;

  if (headers.has(GEO_KOPF)) {
    headers.delete(GEO_KOPF); // (a) — ausnahmslos, vor jeder Fallunterscheidung
    zaehler.kopf_verworfen++;
  }
  if (!geoTabelle) return;

  const adresse = kundenAdresse(req);
  if (!adresse) {
    zaehler.ohne_adresse++;
    return;
  }
  const land = geoTabelle.land(adresse);
  if (!land) {
    // `land()` gibt fuer nicht-oeffentliche Adressen dasselbe `null` wie fuer
    // eine unbekannte — fuer die Zaehlung sind das zwei verschiedene Dinge:
    // eigener Proben-Verkehr darf die Trefferquote der Wache nicht faerben.
    if (istNichtOeffentlicheSchreibweise(adresse)) zaehler.nicht_oeffentlich++;
    else zaehler.unbekannt++;
    return;
  }
  headers.set(GEO_KOPF, land);
  zaehler.erkannt++;
  zaehler.je_land[land] = (zaehler.je_land[land] ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// 6. oxygen-buyer-ip — die Kaeufer-Adresse fuer Shopify (2026-09-29)
// ---------------------------------------------------------------------------
// Hydrogen liest `buyerIp` AUSSCHLIESSLICH aus dieser Kopfzeile
// (getStorefrontHeaders) und schickt ihn als X-Shopify-Client-IP an die
// Storefront API bzw. als x-forwarded-for in forward(). Fehlt er, sieht
// Shopify jeden Besucher an unserer Server-IP (Hetzner Helsinki).
// Job 20260929-repair-crystal-cacao-node-oxygen-buyer-ip-fehlt.
//
// DIESELBEN DREI EIGENSCHAFTEN WIE ZULIEFERUNG 4:
// (a) Eingehende `oxygen-buyer-ip` UND `x-shopify-client-ip-sig` werden IMMER
//     entfernt. Gemessen VOR diesem Bau: ein mitgeschicktes
//     `oxygen-buyer-ip: 8.8.8.8` ging unveraendert als X-Shopify-Client-IP an
//     Shopify. Die Signatur liest Hydrogen ebenfalls aus der eingehenden
//     Anfrage; auf Oxygen setzt sie der Netzrand, hier nie der Kunde.
// (b) fail-closed: keine lesbare oeffentliche Adresse -> keine Kopfzeile.
// (c) Adresse aus dem LETZTEN x-forwarded-for-Eintrag (kundenAdresse).
// Unabhaengig vom Geo-Schalter: eigener Schalter CRYSTAL_BUYER_IP, fehlt er,
// gilt 'on'. Rueckweg: CRYSTAL_BUYER_IP=off in repo/.env + Dienst-Neustart.
//
// WAS DAS BEI SHOPIFY BEWIRKT, gemessen 2026-09-29 (proben/
// probe_kaeufer_ip_wirkt.mjs): mit dem OEFFENTLICHEN Storefront-Token
// ignoriert Shopify die unsignierte Kaeufer-IP und meldet weiter
// country=FI. Wirksam wird sie erst mit einem PRIVATEN Storefront-Token
// (Hydrogen setzt dann Shopify-Storefront-Buyer-IP). Diese Zulieferung ist die
// Voraussetzung dafuer; ohne sie haette auch der private Token keine IP.
const KAEUFER_IP_KOPF = 'oxygen-buyer-ip';
const KAEUFER_IP_SIG_KOPF = 'x-shopify-client-ip-sig';
const KAEUFER_IP_AN = (process.env.CRYSTAL_BUYER_IP ?? 'on').toLowerCase() !== 'off';
zaehler.kaeufer_ip_an = KAEUFER_IP_AN;
console.log(
  KAEUFER_IP_AN
    ? '[kaeufer-ip] Kaeufer-IP an Shopify AN (oxygen-buyer-ip aus x-forwarded-for)'
    : '[kaeufer-ip] Kaeufer-IP AUS (CRYSTAL_BUYER_IP=off) — Shopify sieht die Server-IP.',
);

function istOeffentlicheAdresse(adresse) {
  if (!adresse) return false;
  const lesbar = adresse.includes(':') ? v6ZuPaar(adresse) !== null : v4ZuZahl(adresse) !== null;
  return lesbar && !istNichtOeffentlicheSchreibweise(adresse);
}

/**
 * Setzt `oxygen-buyer-ip` — oder entfernt ihn ersatzlos.
 * @param {Headers} headers bereits aus der Node-Anfrage gefuellt
 * @param {import('node:http').IncomingMessage} req
 */
function kaeuferIpStellen(headers, req) {
  let verworfen = false;
  for (const name of [KAEUFER_IP_KOPF, KAEUFER_IP_SIG_KOPF]) {
    if (headers.has(name)) {
      headers.delete(name); // (a) — ausnahmslos, vor jeder Fallunterscheidung
      verworfen = true;
    }
  }
  if (verworfen) {
    zaehler.kaeufer_ip_verworfen++;
    zaehlerSchmutzig = true;
  }
  if (!KAEUFER_IP_AN) return;

  const adresse = kundenAdresse(req);
  if (!istOeffentlicheAdresse(adresse)) return; // (b)
  headers.set(KAEUFER_IP_KOPF, adresse);
  zaehler.kaeufer_ip_gesetzt++;
  zaehlerSchmutzig = true;
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

  laenderKopfStellen(headers, req);
  kaeuferIpStellen(headers, req);

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
  // content-encoding/content-length fallen weg: kommt der Koerper aus einem
  // Node-`fetch` (Storefront-Weiterleitung, Zulieferung 5), hat undici ihn
  // bereits ENTpackt, die Kopfzeile sagt aber weiter `gzip`. Der Browser
  // scheitert dann am Entpacken (curl --compressed: rc=61), und Caddy packt
  // nichts nach, was schon eine Kodierung behauptet. Ohne die Kopfzeile
  // komprimiert Caddy (`encode zstd gzip`) selbst. Eigene Antworten der App
  // tragen keine Kodierung; fuer sie aendert sich nichts.
  const kopfzeilen = {};
  response.headers.forEach((wert, name) => {
    const n = name.toLowerCase();
    if (n === 'set-cookie' || n === 'content-encoding' || n === 'content-length') return;
    kopfzeilen[name] = wert;
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
  antwortVerfolgen(res);
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

// ---------------------------------------------------------------------------
// Geordnetes Ende auf SIGTERM (graceful shutdown / connection draining)
// ---------------------------------------------------------------------------
// WARUM: bis 2026-11-08 endete der Prozess auf SIGTERM sofort mit
// `process.exit(0)`. Was er in seinen letzten Millisekunden noch angenommen
// hatte, riss ab. Caddy wiederholt seit s03 (devlog D-220) GET und HEAD, einen
// POST (Warenkorb `/cart`, `/kurs-eintragung`) aber bewusst nicht, sonst droht
// eine Doppelbuchung: der Kunde bekam beim Neustart 502. Vorbild im Haus ist
// qi-salesbot D-599/F-707 (`Connection: close` ab SIGTERM); hier ohne
// diagnostics_channel, weil der Adapter seinen Handler selbst haelt.
//
// WAS ES TUT, ab dem Signal:
//   1. `server.close()`: der Port nimmt keine neue Verbindung mehr an. Caddy
//      bekommt "Verbindung abgelehnt" und waehlt neu, fuer JEDE Methode, bis
//      `lb_try_duration` (3 s) -- bis dahin lauscht der neue Prozess.
//   2. Leere Keep-alive-Verbindungen werden sofort geschlossen, jede Antwort
//      ohne gesendeten Kopf bekommt `Connection: close`, und nach jeder
//      fertigen Antwort werden frei gewordene Verbindungen erneut geschlossen.
//   3. Laufende Abrufe laufen zu Ende. Sind alle Verbindungen zu: Zaehler
//      schreiben, exit 0 (Exit-Code wie bisher).
//   4. DECKEL, CRYSTAL_ABBAU_DECKEL_S (Standard 2 s): danach werden alle
//      Verbindungen geschlossen und der Prozess endet trotzdem.
//
// WARUM DER DECKEL 2 s IST UND NICHT 10: die Neustartluecke ist Drainieren +
// Start des neuen Prozesses (s03 gemessen 0,41-0,58 s), und Caddy haelt sie
// nur bis `lb_try_duration 3s` (crystal-cacao.caddy). Ein einziger langsamer
// Abruf mit 10-s-Deckel zoege die Luecke auf ~10,5 s, und ALLE neuen Abrufe
// bekaemen nach 3 s ein 502. Mit 2 s bleibt sie unter ~2,6 s. Gemessen am
// Zugriffslog 29.10.-07.11.2026: POST n=14469, p99 1,49 s, ueber 2 s 11
// (0,08 %); GET p99 0,22 s. Wer den Deckel hebt, hebt lb_try_duration mit.
// Die Unit traegt kein TimeoutStopSec (systemd: 90 s); der Deckel liegt weit
// darunter, ein SIGKILL trifft den Laden also nie.
//
// Kill-Schalter: CRYSTAL_SIGTERM_ABBAU=aus (dann sofortiges Ende wie bis
// 2026-11-08). Ein zweites Signal waehrend des Abbaus beendet sofort.
// Probe: claude-jobs/20261030-crystal-bau-nachzieher-deploy-fenster-ohne-asset-404-s04/probe_sigterm_abbau.py
const ABBAU_AN = (process.env.CRYSTAL_SIGTERM_ABBAU ?? '').trim().toLowerCase() !== 'aus';
const ABBAU_DECKEL_STANDARD_S = 2;
const ABBAU_DECKEL_S = (() => {
  const roh = (process.env.CRYSTAL_ABBAU_DECKEL_S ?? '').trim();
  if (!roh) return ABBAU_DECKEL_STANDARD_S;
  const wert = Number(roh);
  // Unlesbar, <= 0 oder nicht unter TimeoutStopSec (90 s): der Standard, laut.
  if (!Number.isFinite(wert) || wert <= 0 || wert >= 90) {
    console.error(`[abbau] CRYSTAL_ABBAU_DECKEL_S=${roh} unbrauchbar, Deckel ${ABBAU_DECKEL_STANDARD_S} s`);
    return ABBAU_DECKEL_STANDARD_S;
  }
  return wert;
})();
let imAbbau = false;
const laufendeAntworten = new Set();

function schliessenNachAntwort(res) {
  if (!res.headersSent && !res.writableEnded) res.setHeader('Connection', 'close');
}

function antwortVerfolgen(res) {
  if (imAbbau) schliessenNachAntwort(res);
  laufendeAntworten.add(res);
  res.once('close', () => {
    laufendeAntworten.delete(res);
    // Eine Antwort, deren Kopf vor dem Signal schon unterwegs war, laesst
    // ihre Verbindung als Keep-alive zurueck: jetzt ist sie leer, also zu.
    if (imAbbau) setImmediate(() => server.closeIdleConnections());
  });
}

function abbauen(signal) {
  if (!ABBAU_AN || imAbbau) {
    if (imAbbau) console.log(`[abbau] zweites ${signal}: sofortiges Ende`);
    zaehlerSchreiben();
    process.exit(0);
  }
  imAbbau = true;
  const beginn = Date.now();
  for (const res of laufendeAntworten) schliessenNachAntwort(res);
  console.log(
    `[abbau] ${signal}: Annahme zu, ${laufendeAntworten.size} laufende Antwort(en), Deckel ${ABBAU_DECKEL_S} s`,
  );
  const ende = (grund) => {
    console.log(`[abbau] Ende nach ${Date.now() - beginn} ms (${grund})`);
    zaehlerSchreiben();
    process.exit(0);
  };
  const deckel = setTimeout(() => {
    console.log(
      `[abbau] Deckel ${ABBAU_DECKEL_S} s erreicht: ${laufendeAntworten.size} Antwort(en) offen, Verbindungen werden geschlossen`,
    );
    server.closeAllConnections();
    ende('deckel');
  }, ABBAU_DECKEL_S * 1000);
  server.close(() => {
    clearTimeout(deckel);
    ende('alle Verbindungen zu');
  });
  server.closeIdleConnections();
}
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => abbauen(signal));
}

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
