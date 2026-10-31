/**
 * Der Schalter zwischen Cookiebot und dem eigenen Einwilligungshinweis.
 *
 * Grossjob 20261022-GROSSJOB-cookiebot-abloesen-eigener-einwilligungshinweis-qiblanco
 * (BAUVERTRAG Abschnitt 1 und 2). Christian 22.10.: „Das können wir doch selber
 * besser machen … und dann für qiblanco.com ersetzen."
 *
 * EINWILLIGUNG_MOTOR ist der Rückweg in einer Zeile. Segment s02 liefert
 * 'cookiebot' (Schatten), nur Segment s06 legt 'eigen' nach der Gegenprobe.
 *
 * Je Besucher überschreibbar, auch auf Produktion: `?qb_einwilligung=eigen|cookiebot`
 * setzt das Sitzungs-Cookie `qb_einwilligung_motor`. Reihenfolge: Query vor
 * Cookie vor Konstante. Andere Werte gelten nicht.
 *
 * Alles hier ist rein (kein window, kein Request-Objekt): der Root-Loader ruft
 * es am Server, die Probe am Quelltext.
 */
export const EINWILLIGUNG_MOTOR = 'eigen';

export const MOTOR_COOKIE = 'qb_einwilligung_motor';
export const MOTOR_QUERY = 'qb_einwilligung';
const MOTOREN = ['cookiebot', 'eigen'];

// 12 Monate wie Cookiebot (gemessen 23.10.: expires = utc + 365 Tage).
export const EINWILLIGUNG_LAUFZEIT_MS = 365 * 24 * 60 * 60 * 1000;

function cookieWert(cookieHeader, name) {
  const m = String(cookieHeader || '').match(
    new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'),
  );
  return m ? m[1] : '';
}

/**
 * Welcher Motor gilt für diese Anfrage?
 * -> {motor, setzeCookie} — setzeCookie ist der Set-Cookie-Wert, wenn die
 *    Query eine Überschreibung verlangt, sonst ''.
 */
export function motorFuer(url, cookieHeader, konstante = EINWILLIGUNG_MOTOR) {
  let query = '';
  try {
    query = new URL(url).searchParams.get(MOTOR_QUERY) || '';
  } catch {
    query = '';
  }
  if (MOTOREN.includes(query)) {
    // Secure nur auf https: Safari/Firefox verwerfen es sonst auf http-Vorschauen.
    const sicher = String(url).startsWith('https:') ? '; Secure' : '';
    return {
      motor: query,
      setzeCookie: `${MOTOR_COOKIE}=${query}; Path=/; SameSite=Lax${sicher}`,
    };
  }
  const ausCookie = cookieWert(cookieHeader, MOTOR_COOKIE);
  if (MOTOREN.includes(ausCookie)) return {motor: ausCookie, setzeCookie: ''};
  return {motor: MOTOREN.includes(konstante) ? konstante : 'cookiebot', setzeCookie: ''};
}

/** Hauptnummer einer Fassung: '1.0' -> 1, '2.3' -> 2, Unlesbares -> 0. */
export function hauptnummer(fassung) {
  const n = parseInt(String(fassung || '').split('.')[0], 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Liest das CookieConsent-Cookie (Cookiebot-Format oder eigenes mit qbv).
 * -> null (keins oder unlesbar) oder
 *    {preferences, statistics, marketing, utc, qbv, stamp}
 */
export function leseEinwilligung(rohwert) {
  if (!rohwert) return null;
  let s = String(rohwert);
  try {
    s = decodeURIComponent(s);
  } catch {
    // Rohwert weiter benutzen
  }
  if (s === '-1') return null;
  const bool = (k) => {
    const m = s.match(new RegExp('(?:^|[,{])\\s*' + k + '\\s*:\\s*(true|false)'));
    return m ? m[1] === 'true' : null;
  };
  const text = (k) => {
    const m = s.match(new RegExp('(?:^|[,{])\\s*' + k + "\\s*:\\s*'([^']*)'"));
    return m ? m[1] : '';
  };
  const utcM = s.match(/(?:^|[,{])\s*utc\s*:\s*(\d+)/);
  const marketing = bool('marketing');
  if (marketing === null || !utcM) return null;
  return {
    preferences: Boolean(bool('preferences')),
    statistics: Boolean(bool('statistics')),
    marketing,
    utc: Number(utcM[1]),
    qbv: text('qbv'),
    stamp: text('stamp'),
  };
}

/**
 * Gilt eine gespeicherte Wahl noch (BAUVERTRAG Abschnitt 2)?
 * Ungültig: kein Cookie, älter als 12 Monate, oder Hauptnummer der Fassung
 * kleiner als die aktuelle. Ein Cookiebot-Cookie ohne qbv zählt als Hauptnummer 1.
 */
export function wahlGilt(einwilligung, fassung, jetzt = Date.now()) {
  if (!einwilligung) return false;
  if (!(einwilligung.utc > 0) || jetzt - einwilligung.utc > EINWILLIGUNG_LAUFZEIT_MS) {
    return false;
  }
  const imCookie = einwilligung.qbv ? hauptnummer(einwilligung.qbv) : 1;
  return imCookie >= hauptnummer(fassung);
}

/** Sprache des Hinweises: 'en' unter /en, sonst 'de'. */
export function spracheFuer(pfad) {
  return /^\/en(\/|$)/.test(String(pfad || '')) ? 'en' : 'de';
}

export function cookieAusHeader(cookieHeader) {
  return cookieWert(cookieHeader, 'CookieConsent');
}
