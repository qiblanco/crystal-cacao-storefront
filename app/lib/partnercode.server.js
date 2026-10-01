/*
 * ================================================================
 * PARTNERCODE AUTOMATISCH (Job 20260924-partnerlink-setzt-code-automatisch-
 * und-permalink-einbettungsfest-prio12, Folgejob aus Christians
 * Partnerlink-Auftrag vom 2026-09-24).
 * ================================================================
 * BEFUND: der Empfehlungslink eines Partners (`?sca_ref=<id>.<token>`) trägt
 * die ZUORDNUNG bis in die Kasse, aber nicht den RABATT. UpPromotes
 * "Auto-Apply" hängt an einem Theme-App-Embed und wirkt auf dieser
 * Hydrogen-Storefront nicht (gemessen 2026-09-24, Test-Partner TESTIX:
 * Kasse ohne Abzug). Partner, die nur ihren Standardlink teilen, lieferten
 * ihren Leuten deshalb keinen Rabatt.
 *
 * WAS DIESES MODUL TUT: kommt ein Seitenaufruf mit `sca_ref` an und kennt
 * das Datenmodul diesen Link, legt der Server den Code des Partners in den
 * Warenkorb (cart.updateDiscountCodes — derselbe Weg wie /discount/<CODE>).
 * Trägt der Warenkorb schon IRGENDEINEN Code, bleibt er unangetastet: ein
 * Kunde, der selbst einen Code eingegeben hat, verliert ihn nie an einen
 * Link.
 *
 * WARUM DIE CODES VERSCHLUESSELT IM DATENMODUL STEHEN: eine offene Liste
 * aller Partnercodes ist genau das, was Gutscheinseiten abgreifen. Jeder
 * Eintrag ist deshalb mit einem Schluessel verschluesselt, der aus dem
 * vollstaendigen Partnerlink-Wert abgeleitet wird. Wer den Link nicht hat,
 * liest den Code nicht — auch nicht, wenn das Modul versehentlich in ein
 * Client-Bundle geriete oder das Repo in fremde Haende fiele. Wer den Link
 * hat, bekommt den Code ohnehin beim Aufruf; das ist der Zweck.
 * Das Suchfeld `k` ist ein gekuerzter Hash desselben Werts, damit der Server
 * den Eintrag findet, ohne den Link im Klartext zu speichern.
 *
 * QUELLE UND AKTUALITAET: app/lib/partnercode-daten.server.js wird NIE von
 * Hand gepflegt. Erzeuger ist bin/partnercode-gen.mjs, gespeist aus UpPromote
 * (nur lesend) durch partner-manager/bin/partnercode-abgleich; neue Partner
 * kommen über den gegateten hb-deploy-Weg hinein.
 *
 * RUECKWEG: PARTNERCODE_AUTO unten auf false (ein Deploy), oder die
 * Einhaengestelle in app/entry.server.jsx entfernen. Messung am Rand:
 * partner-manager/bin/partnerlink-check, Linkart "standardlink-code".
 */
import {PARTNERCODE_EINTRAEGE} from './partnercode-daten.server.js';

export const PARTNERCODE_AUTO = true;
export const PARTNERCODE_KOPF = 'X-Qb-Partnercode';

const SALZ_SUCHE = 'qb-partnercode-k|v1|';
const SALZ_SCHLUESSEL = 'qb-partnercode-s|v1|';
const SALZ_IV = 'qb-partnercode-iv|v1|';
const SUCHFELD_LAENGE = 22;
// Form wie pm_linkcheck.SCA_REF_RX, mit Laengendeckel gegen Unsinn.
const SCA_REF_RX = /^\d{1,12}\.[A-Za-z0-9_-]{4,64}$/;

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function subtle() {
  return globalThis.crypto.subtle;
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ausB64url(text) {
  const s = text.replace(/-/g, '+').replace(/_/g, '/');
  const roh = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) out[i] = roh.charCodeAt(i);
  return out;
}

async function sha256(text) {
  return new Uint8Array(await subtle().digest('SHA-256', ENC.encode(text)));
}

async function aesSchluessel(ref) {
  return subtle().importKey(
    'raw',
    await sha256(SALZ_SCHLUESSEL + ref),
    {name: 'AES-GCM'},
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Gueltiger sca_ref-Wert oder null. */
export function normiereRef(roh) {
  const ref = String(roh ?? '').trim();
  return SCA_REF_RX.test(ref) ? ref : null;
}

/** Suchfeld eines Eintrags (gekuerzter Hash des vollen Link-Werts). */
export async function suchfeld(ref) {
  return b64url(await sha256(SALZ_SUCHE + ref)).slice(0, SUCHFELD_LAENGE);
}

/**
 * Ein Eintrag {k, c} für den Erzeuger. Das IV ist aus Link UND Code
 * abgeleitet: gleiche Eingabe -> byte-gleiche Ausgabe (kein Diff-Rauschen im
 * täglichen Abgleich), und weil der Schluessel je Link ein eigener ist, faellt
 * ein IV nur dann zweimal, wenn auch der Klartext derselbe ist.
 */
export async function eintragFuer(ref, code) {
  const r = normiereRef(ref);
  if (!r) throw new Error('sca_ref hat nicht die erwartete Form');
  const iv = (await sha256(SALZ_IV + r + '|' + code)).slice(0, 12);
  const geheim = new Uint8Array(
    await subtle().encrypt(
      {name: 'AES-GCM', iv},
      await aesSchluessel(r),
      ENC.encode(String(code)),
    ),
  );
  const c = new Uint8Array(iv.length + geheim.length);
  c.set(iv, 0);
  c.set(geheim, iv.length);
  return {k: await suchfeld(r), c: b64url(c)};
}

/**
 * Code des Partners zu diesem Link oder null. Wirft nie: ein kaputter
 * Eintrag heißt "kein Code", nie ein kaputter Seitenaufruf.
 */
export async function partnercodeFuer(roh, eintraege = PARTNERCODE_EINTRAEGE) {
  try {
    const ref = normiereRef(roh);
    if (!ref || !Array.isArray(eintraege) || eintraege.length === 0) {
      return null;
    }
    const k = await suchfeld(ref);
    const e = eintraege.find((x) => x && x.k === k);
    if (!e) return null;
    const c = ausB64url(e.c);
    const klar = await subtle().decrypt(
      {name: 'AES-GCM', iv: c.slice(0, 12)},
      await aesSchluessel(ref),
      c.slice(12),
    );
    const code = DEC.decode(klar).trim();
    return code || null;
  } catch {
    return null;
  }
}

/**
 * Soll dieser Aufruf ueberhaupt gefragt werden? Nur ein echter
 * Seitenaufruf (GET, Dokument) mit sca_ref. Datenabrufe (fetch/_data),
 * Rahmen und Bots legen keinen Warenkorb an.
 * @param {Request} request
 * @param {(ua: string) => boolean} [istBot]
 */
export function refAusAufruf(request, istBot) {
  if (request.method !== 'GET') return null;
  const ziel = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
  if (ziel && ziel !== 'document') return null;
  if (istBot && istBot(request.headers.get('user-agent') || '')) return null;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }
  return normiereRef(url.searchParams.get('sca_ref'));
}

/**
 * Legt den Partnercode in den Warenkorb, falls möglich.
 * Rückgabe ist ein Zustandswort; es geht als Kopf X-Qb-Partnercode an die
 * Antwort (kein Code, kein Link — nur das Wort), damit die tägliche
 * Messung den Weg am Rand sieht.
 *   aus | kein-treffer | fremder-code | schon-gesetzt | gesetzt | fehler
 * @param {{ref: string, cart: any, responseHeaders: Headers,
 *          eintraege?: Array<{k: string, c: string}>, an?: boolean}} a
 */
export async function wendePartnercodeAn({
  ref,
  cart,
  responseHeaders,
  eintraege = PARTNERCODE_EINTRAEGE,
  an = PARTNERCODE_AUTO,
}) {
  let zustand;
  try {
    if (!an) {
      zustand = 'aus';
    } else {
      const code = await partnercodeFuer(ref, eintraege);
      if (!code) {
        zustand = 'kein-treffer';
      } else {
        const vorher = await cart.get();
        const codes = (vorher?.discountCodes || [])
          .map((d) => String(d?.code || '').trim())
          .filter(Boolean);
        if (codes.some((c) => c.toLowerCase() === code.toLowerCase())) {
          zustand = 'schon-gesetzt';
        } else if (codes.length > 0) {
          // Ein Code, den der Kunde schon hat, wird nie ersetzt.
          zustand = 'fremder-code';
        } else {
          const ergebnis = await cart.updateDiscountCodes([code]);
          const id = ergebnis?.cart?.id;
          if (!id || ergebnis?.errors?.length) {
            zustand = 'fehler';
          } else {
            const kopf = cart.setCartId(id);
            const kekse =
              typeof kopf.getSetCookie === 'function'
                ? kopf.getSetCookie()
                : [kopf.get('set-cookie')].filter(Boolean);
            for (const wert of kekse) responseHeaders.append('Set-Cookie', wert);
            zustand = 'gesetzt';
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    zustand = 'fehler';
  }
  responseHeaders.set(PARTNERCODE_KOPF, zustand);
  return zustand;
}
