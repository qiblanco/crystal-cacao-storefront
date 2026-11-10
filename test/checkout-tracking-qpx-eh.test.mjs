// Hermetische Tests: qpx_eh (Kontakt-Kennung aus dem eigenen Mailversand) reist
// als eigenes Warenkorb-Attribut und wird so zum Order-note_attribute
// (Vorgang EL-20261023-35724d07, Job 20261024-storefront-mailkennung-warenkorb-
// vorschau-el35724d07). node:test/node:assert, KEIN Netz.
// Ausfuehren: node --test test/checkout-tracking-qpx-eh.test.mjs (crystal-cacao, gleicher Patch wie qiblanco-storefront)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

import {
  ATTRIBUTION_COOKIE_NAME,
  buildAttributionCartAttributes,
  appendTrackingToCheckoutUrl,
} from '../app/lib/checkout-tracking.js';

const EH = '0123456789abcdef';
const MAILLINK = `utm_source=mail-manager&utm_medium=email&utm_campaign=test&utm_content=A&qpx_eh=${EH}`;

function attr(attrs, key) {
  return attrs.find((x) => x.key === key);
}

test('qpx_eh aus der URL -> eigenes Cart-Attribut, utm bleibt', () => {
  const attrs = buildAttributionCartAttributes({
    searchParams: new URLSearchParams(MAILLINK),
    cookieHeader: '',
    includeCookies: true,
  });
  assert.equal(attr(attrs, 'qpx_eh')?.value, EH);
  assert.equal(attr(attrs, 'utm_source')?.value, 'mail-manager');
  assert.equal(attr(attrs, 'utm_content')?.value, 'A');
});

test('qpx_eh aus dem gespeicherten Tracker-Record (Rückkehr ohne Query)', () => {
  const record = {
    params: [['utm_source', 'mail-manager'], ['qpx_eh', EH]],
    href: `https://crystal-cacao.com/?${MAILLINK}`,
    referrer: '',
    savedAt: '2026-11-10T00:00:00.000Z',
  };
  const cookieHeader = `${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}`;
  const attrs = buildAttributionCartAttributes({
    searchParams: new URLSearchParams(),
    cookieHeader,
    includeCookies: true,
  });
  assert.equal(attr(attrs, 'qpx_eh')?.value, EH);
});

test('Format-Guard: Klartext, Großbuchstaben, falsche Länge fallen weg', () => {
  for (const falsch of ['name@example.com', '0123456789ABCDEF', '0123456789abcde', '0123456789abcdef0', 'xyz']) {
    const attrs = buildAttributionCartAttributes({
      searchParams: new URLSearchParams(`utm_source=mail-manager&qpx_eh=${encodeURIComponent(falsch)}`),
      cookieHeader: '',
      includeCookies: true,
    });
    assert.equal(attr(attrs, 'qpx_eh'), undefined, `qpx_eh=${falsch} wurde durchgereicht`);
    assert.equal(attr(attrs, 'utm_source')?.value, 'mail-manager', 'utm regressierte');
  }
});

test('Format-Guard greift auch im gespeicherten Record', () => {
  const record = {params: [['utm_source', 'x'], ['qpx_eh', 'name@example.com']], href: 'https://crystal-cacao.com/', referrer: '', savedAt: 'x'};
  const cookieHeader = `${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}`;
  const attrs = buildAttributionCartAttributes({searchParams: new URLSearchParams(), cookieHeader, includeCookies: true});
  assert.equal(attr(attrs, 'qpx_eh'), undefined);
});

test('qpx_eh geht NICHT an die Checkout-URL, utm schon', () => {
  const url = new URL(
    appendTrackingToCheckoutUrl('https://checkout.qiblanco.com/cart/c/x', {
      searchParams: new URLSearchParams(MAILLINK),
    }),
  );
  assert.equal(url.searchParams.get('qpx_eh'), null);
  assert.equal(url.searchParams.get('utm_source'), 'mail-manager');
});

function namenAusSet(src) {
  const m = src.match(/const TRACKING_PARAM_NAMES = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(m, 'TRACKING_PARAM_NAMES in checkout-tracking.js nicht gefunden');
  return new Set([...m[1].replace(/\/\/.*$/gm, '').matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

function namenAusTracker(src) {
  const m = src.match(/var TRACKING_PARAM_NAMES = \{([\s\S]*?)\};/);
  assert.ok(m, 'TRACKING_PARAM_NAMES in qiblanco-tracker.js nicht gefunden');
  return new Set(
    [...m[1].replace(/\/\/.*$/gm, '').matchAll(/([A-Za-z0-9_]+)\s*:\s*true/g)].map((x) => x[1]),
  );
}

const TRACKER_SRC = readFileSync(new URL('../public/qiblanco-tracker.js', import.meta.url), 'utf8');

test('Zwillingslisten sind deckungsgleich und tragen qpx_eh', () => {
  const ct = namenAusSet(readFileSync(new URL('../app/lib/checkout-tracking.js', import.meta.url), 'utf8'));
  const tr = namenAusTracker(TRACKER_SRC);
  assert.ok(ct.has('qpx_eh'), 'checkout-tracking.js ohne qpx_eh');
  assert.ok(tr.has('qpx_eh'), 'qiblanco-tracker.js ohne qpx_eh');
  assert.deepEqual([...ct].sort(), [...tr].sort(), 'Zwillingslisten weichen ab');
});

// Der Tracker selbst, im Sandkasten ausgeführt: speichert er qpx_eh in den
// sessionStorage-Puffer, und verwirft er einen Klartext?
function trackerPuffer(search) {
  const speicher = new Map();
  const fenster = {
    location: {search, href: `https://crystal-cacao.com/${search}`, hostname: 'qiblanco.com', pathname: '/'},
    sessionStorage: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => speicher.set(k, String(v)),
      removeItem: (k) => speicher.delete(k),
    },
    localStorage: {getItem: () => null, setItem() {}, removeItem() {}},
    addEventListener() {},
    removeEventListener() {},
    setTimeout() {},
    clearTimeout() {},
    setInterval() {},
    clearInterval() {},
    performance: {getEntriesByType: () => []},
  };
  fenster.window = fenster;
  const dokument = {
    referrer: '',
    cookie: '',
    readyState: 'complete',
    addEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null,
    documentElement: {},
  };
  const ctx = vm.createContext({
    window: fenster,
    document: dokument,
    navigator: {userAgent: 'test'},
    URLSearchParams,
    URL,
    JSON,
    Date,
    console: {log() {}, warn() {}, error() {}},
    setTimeout() {},
    clearTimeout() {},
    location: fenster.location,
    sessionStorage: fenster.sessionStorage,
    localStorage: fenster.localStorage,
  });
  try {
    vm.runInContext(TRACKER_SRC, ctx);
  } catch {
    // Der Tracker darf an fehlenden Browser-APIs scheitern, NACHDEM er gepuffert hat.
  }
  const roh = speicher.get('qiblanco_checkout_attribution');
  return roh ? JSON.parse(roh) : null;
}

test('Tracker puffert qpx_eh aus dem Maillink', () => {
  const rec = trackerPuffer(`?${MAILLINK}`);
  assert.ok(rec, 'Tracker hat nichts gepuffert');
  const m = new Map(rec.params);
  assert.equal(m.get('qpx_eh'), EH);
  assert.equal(m.get('utm_source'), 'mail-manager');
});

test('Tracker verwirft qpx_eh im Klartext, puffert utm weiter', () => {
  const rec = trackerPuffer('?utm_source=mail-manager&qpx_eh=name%40example.com');
  assert.ok(rec, 'Tracker hat nichts gepuffert');
  const m = new Map(rec.params);
  assert.equal(m.has('qpx_eh'), false);
  assert.equal(m.get('utm_source'), 'mail-manager');
});

// Adversariale Pruefung (Job 20261024-...-el35724d07): qpx_eh darf nur als eigenes, formgeprueftes
// Attribut reisen -- nicht ungeprueft im landing_page/referrer, und es ist kein Signal fuer sich.
test('landing_page und referrer tragen kein qpx_eh (auch kein Klartext)', () => {
  const record = {
    params: [['utm_source', 'mail-manager']],
    href: 'https://crystal-cacao.com/?utm_source=mail-manager&qpx_eh=name%40example.com',
    referrer: `https://crystal-cacao.com/x?qpx_eh=${EH}`,
    savedAt: '2026-11-10T00:00:00.000Z',
  };
  const cookieHeader = `${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}`;
  const attrs = buildAttributionCartAttributes({searchParams: new URLSearchParams(), cookieHeader, includeCookies: true});
  const lp = attr(attrs, 'landing_page')?.value || '';
  assert.ok(lp.includes('utm_source=mail-manager'), lp);
  assert.ok(!lp.includes('qpx_eh'), lp);
  assert.ok(!(attr(attrs, 'referrer')?.value || '').includes('qpx_eh'));
});

test('qpx_eh allein ist kein Signal: kein landing_page/referrer', () => {
  const record = {params: [['qpx_eh', EH]], href: `https://crystal-cacao.com/?qpx_eh=${EH}`,
    referrer: 'https://webmail.example.org/inbox', savedAt: '2026-11-10T00:00:00.000Z'};
  const cookieHeader = `${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}`;
  const attrs = buildAttributionCartAttributes({searchParams: new URLSearchParams(), cookieHeader, includeCookies: true});
  assert.equal(attr(attrs, 'qpx_eh')?.value, EH);
  assert.equal(attr(attrs, 'landing_page'), undefined);
  assert.equal(attr(attrs, 'referrer'), undefined);
});
