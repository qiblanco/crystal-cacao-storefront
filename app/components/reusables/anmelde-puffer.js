/*
 * RÜCKFALL-PUFFER FÜR ANMELDUNGEN (Elina EL-20261107-af9594f2, Punkt 4).
 *
 * WOFÜR: Ist der Anmelde-Empfang selbst nicht erreichbar (AI-Server, Caddy oder
 * ac-eingang weg, Netz), ging eine Anmeldung bisher verloren: Fehlermeldung,
 * Eingabe weg. Dieses Modul hält sie im Browser und stellt sie zu, sobald ein
 * Weg wieder trägt. Ohne React und mit eingereichten Abhängigkeiten (Speicher,
 * fetch, Uhr, Schlaf), damit anmelde-puffer.test.mjs jeden Zweig hermetisch prüft.
 *
 * ZWEI WEGE JE VERSUCH: zuerst direkt an den Empfang (POST /f/<id>), scheitert
 * das wiederholbar, derselbe Versuch über die Shop-Route /api/mm-formular
 * (Oxygen, serverseitig). Ein Ausfall nur des direkten Wegs (DNS, Zertifikat von
 * anmelden.dienst) zählt so nicht.
 *
 * WIEDERHOLBAR heißt: keine Antwort (Netz, Zeitlimit), 5xx oder 429. Alles andere
 * ist eine endgültige Antwort des Empfangs (202, 400, 403, 404, 409) und nimmt den
 * Eintrag aus dem Puffer, auch eine Ablehnung: der Empfang hat entschieden.
 *
 * DOPPELTE ZUSTELLUNG IST HARMLOS: jede Anmeldung trägt eine eigene Kennung
 * (anmelde_id). Der Empfang merkt sie sich und beantwortet eine Wiederholung wie
 * das Original, ohne zweite Spool-Zeile (ac-eingang/src/endpunkt.py, Tabelle
 * anmelde_schluessel). Das deckt den Fall „Antwort ging verloren, gespeichert war
 * es schon“.
 *
 * WAS IM BROWSER LIEGT (localStorage 'qb-anmeldung-puffer'): Formular-Kennung,
 * die Formularfelder (ohne Honigtopf), t, Absendezeit, Uhrversatz, Kennung des
 * Einwilligungssatzes. Höchstens 23 h, danach räumt jeder Seitenaufruf ihn weg.
 * 23 statt 24 h: der Empfang verwirft ein t, das älter als 24 h ist, STILL (202
 * ohne Speichern); eine Stunde Abstand fängt Uhr- und Laufzeitfehler ab.
 *
 * t BEIM NACHSCHICKEN: das ursprüngliche t, solange es jünger als 23 h ist, sonst
 * die Absendezeit (ab). Zur Absendezeit war der Mensch da, und sie liegt immer
 * mindestens 1,6 s nach der Anzeige; die Automaten-Falle bleibt also gültig.
 *
 * GEFÜLLTER HONIGTOPF: kein Puffer, genau ein Versuch wie bisher. Ein Automat
 * bekommt keine zweite Chance und keinen Platz im Speicher.
 *
 * SPEICHER NICHT NUTZBAR (privater Modus, voll, gesperrt): keine Zusage. Die
 * Komponente zeigt dann ihren bisherigen Fehlerweg, nie „wir haben sie“.
 *
 * RÜCKWEG: PUFFER_AN = false (ein Deploy) schaltet Puffer und zweiten Weg ab;
 * dann gilt genau ein direkter Versuch wie vor diesem Bau.
 */

export const PUFFER_AN = true;
export const PUFFER_SCHLUESSEL = 'qb-anmeldung-puffer';
export const PUFFER_GUELTIG_MS = 23 * 3600 * 1000;
export const T_HOECHSTALTER_MS = 23 * 3600 * 1000;
export const VERSUCH_ZEITLIMIT_MS = 10000;
/** Pausen vor den drei Runden: sofort, nach 5 s, nach weiteren 15 s. */
export const RUNDEN_PAUSEN_MS = [0, 5000, 15000];
export const NACHSCHICKEN_TAKT_MS = 60000;
export const ZWEITER_WEG = '/api/mm-formular';
const ANMELDE_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const HOECHSTENS_EINTRAEGE = 20;

/** Ids, die gerade unterwegs sind (dieser Tab), damit Takt und Absenden nicht doppelt fahren. */
const unterwegs = new Set();
const beobachter = new Set();

export function wiederholbar(status) {
  return !Number.isFinite(status) || status === 0 || status === 429 || status >= 500;
}

export function neueAnmeldeId(krypto = globalThis.crypto) {
  try {
    if (krypto && typeof krypto.randomUUID === 'function') return krypto.randomUUID();
  } catch {
    // weiter unten
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

function ohne(obj, schluessel) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !schluessel.includes(k)));
}

function standardSpeicher() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** -> Liste oder null (null heißt: Speicher nicht lesbar, nicht: leer). */
function lesen(speicher) {
  if (!speicher) return null;
  try {
    const roh = speicher.getItem(PUFFER_SCHLUESSEL);
    if (!roh) return [];
    const liste = JSON.parse(roh);
    return Array.isArray(liste) ? liste.filter((e) => e && typeof e.id === 'string' && e.felder) : [];
  } catch {
    return null;
  }
}

function schreiben(speicher, liste) {
  if (!speicher) return false;
  try {
    if (liste.length) speicher.setItem(PUFFER_SCHLUESSEL, JSON.stringify(liste));
    else speicher.removeItem(PUFFER_SCHLUESSEL);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{formular: string, felder: object, t: number, versatz?: number, id?: string}} a
 *   felder  der Körper für POST /f/<id> OHNE t (einwilligung_id, email, ... wie bisher)
 *   t       Anzeigezeit in Serverzeit (ms)
 *   versatz Serveruhr minus Besucheruhr (ms)
 */
export function eintragAnlegen({formular, felder, t, versatz = 0, id}, jetzt = Date.now()) {
  const v = Number.isFinite(versatz) ? versatz : 0;
  const ab = jetzt + v;
  const rest = ohne(felder, ['t', 'website']);
  return {
    id: id && ANMELDE_ID_RE.test(id) ? id : neueAnmeldeId(),
    formular: String(formular),
    felder: rest,
    t: Math.round(Number(t) || ab),
    ab: Math.round(ab),
    versatz: v,
    bis: jetzt + PUFFER_GUELTIG_MS,
  };
}

/** Legt den Eintrag ab. -> true nur, wenn er nachweislich im Speicher steht. */
export function puffern(eintrag, {speicher = standardSpeicher()} = {}) {
  const liste = lesen(speicher);
  if (liste === null) return false;
  const neu = [...liste.filter((e) => e.id !== eintrag.id), eintrag].slice(-HOECHSTENS_EINTRAEGE);
  if (!schreiben(speicher, neu)) return false;
  const kontrolle = lesen(speicher);
  return Boolean(kontrolle && kontrolle.some((e) => e.id === eintrag.id));
}

export function entfernen(id, {speicher = standardSpeicher()} = {}) {
  const liste = lesen(speicher);
  if (!liste || !liste.some((e) => e.id === id)) return;
  schreiben(speicher, liste.filter((e) => e.id !== id));
}

/** Nicht abgelaufene Einträge; abgelaufene werden dabei weggeräumt. */
export function offene({speicher = standardSpeicher(), jetzt = Date.now()} = {}) {
  const liste = lesen(speicher);
  if (!liste) return [];
  const lebend = liste.filter((e) => Number(e.bis) > jetzt);
  if (lebend.length !== liste.length) schreiben(speicher, lebend);
  return lebend;
}

/** Das t, das jetzt gesendet wird (siehe Kopf). */
export function tZumSenden(eintrag, jetzt = Date.now()) {
  const serverJetzt = jetzt + (Number(eintrag.versatz) || 0);
  return serverJetzt - eintrag.t < T_HOECHSTALTER_MS ? eintrag.t : eintrag.ab;
}

/** Körper für den direkten Weg (JSON an /f/<id>). */
export function koerperDirekt(eintrag, jetzt = Date.now()) {
  return {...eintrag.felder, website: '', t: String(Math.round(tZumSenden(eintrag, jetzt))), anmelde_id: eintrag.id};
}

/** Felder für den zweiten Weg. Die Route rechnet t aus dauer_ms in ihrer eigenen Uhr. */
export function felderShop(eintrag, jetzt = Date.now()) {
  const serverJetzt = jetzt + (Number(eintrag.versatz) || 0);
  const dauer = Math.max(1, Math.round(serverJetzt - tZumSenden(eintrag, jetzt)));
  const rest = ohne(eintrag.felder, ['seite', 't']);
  const aus = {formular_id: eintrag.formular, dauer_ms: String(dauer), anmelde_id: eintrag.id, website: ''};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && v !== null && v !== '') aus[k] = String(v);
  }
  return aus;
}

async function mitZeitlimit(holen, url, optionen, zeitlimitMs) {
  const abbruch = typeof AbortController === 'undefined' ? null : new AbortController();
  const uhr = setTimeout(() => abbruch && abbruch.abort(), zeitlimitMs);
  try {
    return await holen(url, {...optionen, signal: abbruch ? abbruch.signal : undefined});
  } finally {
    clearTimeout(uhr);
  }
}

async function direkt(eintrag, {holen, endpunkt, jetzt, zeitlimitMs}) {
  try {
    const r = await mitZeitlimit(
      holen,
      `${endpunkt}/f/${encodeURIComponent(eintrag.formular)}`,
      {
        method: 'POST',
        credentials: 'omit',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify(koerperDirekt(eintrag, jetzt())),
      },
      zeitlimitMs,
    );
    const antwort = await r.json().catch(() => null);
    return {status: r.status, antwort};
  } catch {
    return {status: 0, antwort: null};
  }
}

/**
 * Antwort der Shop-Route in die Form des direkten Wegs: http ist der Status, den
 * der Empfang der Route gab (0 = nicht erreicht). Ohne lesbares http gilt sie als
 * keine Antwort, auch bei ok (eine alte Route ohne Kennung wäre sonst ein falsches Ja).
 */
export function shopAntwort(httpStatus, json) {
  if (!json || typeof json !== 'object' || !Number.isFinite(json.http)) return {status: 0, antwort: null};
  const antwort = {ok: Boolean(json.ok)};
  if (typeof json.fehler === 'string' && json.fehler) antwort.fehler = json.fehler;
  if (typeof json.text === 'string' && json.text) antwort.text = json.text;
  if (typeof json.weiter === 'string' && json.weiter) antwort.weiter = json.weiter;
  return {status: json.http, antwort};
}

async function ueberShop(eintrag, {holen, jetzt, zeitlimitMs}) {
  try {
    const r = await mitZeitlimit(
      holen,
      ZWEITER_WEG,
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
        body: new URLSearchParams(felderShop(eintrag, jetzt())).toString(),
      },
      zeitlimitMs,
    );
    return shopAntwort(r.status, await r.json().catch(() => null));
  } catch {
    return {status: 0, antwort: null};
  }
}

function abhaengigkeiten(d = {}) {
  return {
    speicher: 'speicher' in d ? d.speicher : standardSpeicher(),
    holen: d.holen || ((...a) => fetch(...a)),
    endpunkt: d.endpunkt,
    jetzt: d.jetzt || (() => Date.now()),
    schlafen: d.schlafen || ((ms) => new Promise((weiter) => setTimeout(weiter, ms))),
    zeitlimitMs: d.zeitlimitMs || VERSUCH_ZEITLIMIT_MS,
    zweiterWeg: d.zweiterWeg !== false,
  };
}

/** Ein Versuch über beide Wege. -> {status, antwort, weg: 'direkt'|'shop'|'keiner'} */
export async function einmalZustellen(eintrag, d) {
  const a = abhaengigkeiten(d);
  const r = await direkt(eintrag, a);
  if (!wiederholbar(r.status) || !a.zweiterWeg) return {...r, weg: wiederholbar(r.status) ? 'keiner' : 'direkt'};
  const s = await ueberShop(eintrag, a);
  if (!wiederholbar(s.status)) return {...s, weg: 'shop'};
  return {...r, weg: 'keiner'};
}

function melden(id, ergebnis) {
  for (const fn of beobachter) {
    try {
      fn(id, ergebnis);
    } catch {
      // Ein Beobachter bricht nie die Zustellung.
    }
  }
}

/** Meldet jede Zustellung aus dem Puffer (auch aus dem Takt). -> Abmelden */
export function beobachten(fn) {
  beobachter.add(fn);
  return () => beobachter.delete(fn);
}

/**
 * Absenden mit Puffer: erst ablegen, dann bis zu drei Runden über beide Wege.
 * -> {status, antwort, weg, id, gepuffert}
 *   gepuffert true  alle Runden wiederholbar gescheitert, der Eintrag liegt sicher im Speicher
 *   gepuffert false endgültige Antwort, oder der Speicher hat ihn nicht genommen (dann keine Zusage)
 * beiWarten(gemerkt) läuft vor jeder Pause, damit die Seite den ehrlichen Satz zeigt.
 */
export async function zustellen({formular, felder, t, versatz, id}, d = {}) {
  const a = abhaengigkeiten(d);
  const honigtopf = String((felder && felder.website) || '') !== '';
  const eintrag = eintragAnlegen({formular, felder, t, versatz, id}, a.jetzt());
  if (honigtopf || !PUFFER_AN) {
    // Genau ein direkter Versuch, Körper wie bisher (der Honigtopf geht mit, der Empfang entscheidet).
    const k = {...koerperDirekt(eintrag, a.jetzt()), website: String((felder && felder.website) || '')};
    try {
      const r = await mitZeitlimit(
        a.holen,
        `${a.endpunkt}/f/${encodeURIComponent(eintrag.formular)}`,
        {method: 'POST', credentials: 'omit', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(k)},
        a.zeitlimitMs,
      );
      return {status: r.status, antwort: await r.json().catch(() => null), weg: 'direkt', id: eintrag.id, gepuffert: false};
    } catch {
      return {status: 0, antwort: null, weg: 'keiner', id: eintrag.id, gepuffert: false};
    }
  }
  const gemerkt = puffern(eintrag, a);
  unterwegs.add(eintrag.id);
  let letztes = {status: 0, antwort: null, weg: 'keiner'};
  try {
    for (const pause of RUNDEN_PAUSEN_MS) {
      if (pause) {
        if (d.beiWarten) d.beiWarten(gemerkt);
        await a.schlafen(pause);
      }
      letztes = await einmalZustellen(eintrag, d);
      if (!wiederholbar(letztes.status)) {
        entfernen(eintrag.id, a);
        return {...letztes, id: eintrag.id, gepuffert: false};
      }
    }
  } finally {
    unterwegs.delete(eintrag.id);
  }
  return {...letztes, id: eintrag.id, gepuffert: gemerkt};
}

/** Jeden offenen Eintrag einmal versuchen. -> [{id, formular, status, weg}] */
export async function nachschicken(d = {}) {
  const a = abhaengigkeiten(d);
  const aus = [];
  for (const eintrag of offene({speicher: a.speicher, jetzt: a.jetzt()})) {
    if (unterwegs.has(eintrag.id)) continue;
    unterwegs.add(eintrag.id);
    try {
      const r = await einmalZustellen(eintrag, d);
      if (!wiederholbar(r.status)) {
        entfernen(eintrag.id, a);
        melden(eintrag.id, r);
      }
      aus.push({id: eintrag.id, formular: eintrag.formular, status: r.status, weg: r.weg});
    } finally {
      unterwegs.delete(eintrag.id);
    }
  }
  return aus;
}

let takt = null;

/**
 * Beim Seitenaufruf: liegengebliebene Anmeldungen sofort nachschicken, danach im
 * Minutentakt und bei 'online', bis der Puffer leer ist. Einmal je Tab, egal wie
 * viele Formulare es aufrufen. sofort: false (nach drei gescheiterten Runden)
 * startet nur den Takt, ohne gleich einen vierten Versuch.
 */
export function starteNachschicken(d = {}) {
  if (typeof window === 'undefined' || !PUFFER_AN || takt) return;
  const a = abhaengigkeiten(d);
  const runde = async () => {
    await nachschicken(d).catch(() => []);
    if (!offene({speicher: a.speicher, jetzt: a.jetzt()}).length && takt) {
      clearInterval(takt.uhr);
      window.removeEventListener('online', takt.runde);
      takt = null;
    }
  };
  if (!offene({speicher: a.speicher, jetzt: a.jetzt()}).length) return;
  takt = {runde, uhr: setInterval(runde, NACHSCHICKEN_TAKT_MS)};
  window.addEventListener('online', runde);
  if (d.sofort !== false) runde();
}

/** Für die Tests: Modulzustand zurücksetzen. */
export function _zuruecksetzen() {
  unterwegs.clear();
  beobachter.clear();
  if (takt) {
    clearInterval(takt.uhr);
    takt = null;
  }
}
