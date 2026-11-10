/**
 * Der Eintragungsweg des Gratis-Kakao-Kurses — EINE Quelle fuer beide Seiten
 * der Naht.
 *
 * WARUM DIESE DATEI EXISTIERT UND NICHT ZWEI LITERALE: das Formular auf der
 * Startseite nennt einen Pfad im `action`-Attribut, und die Route nimmt ihn
 * entgegen. Stehen die zwei Literale an zwei Orten, reisst die Naht bei der
 * ersten Umbenennung — und zwar STILL: die Seite antwortet weiter HTTP 200,
 * das Feld steht da, und der Absendeknopf laeuft in ein 404. Hier steht der
 * Pfad einmal; beide Seiten lesen ihn.
 *
 * WARUM DAS FORMULAR SERVER-GERENDERT IST (Befund 2026-09-17, Job
 * 20260917-jetzt-kostenfrei-mitmachen-ohne-ein-feld-zum-eintragen): das
 * fruehere ActiveCampaign-Embed haengte ein fremdes Skript an, und die eigene
 * Content-Security-Policy dieses Ladens (`default-src 'self'`) blockte es —
 * 0 `<form>` am Kundenrand. Die CSP bleibt eng; ein server-gerendertes
 * Formular braucht keine Zeile davon. Das Erfuellungskriterium k4cc97eb5b2
 * zaehlt `<form>`, `<input>` und `type=email` im ROHEN HTML.
 *
 * SEIT 2026-11-10 GEHT DIE EINTRAGUNG AN DEN MAIL MANAGER, NICHT MEHR AN
 * ACTIVECAMPAIGN (Elina EL-20261110-5a9e5746 Punkt 1 und 3, EL-20261106-
 * ce1af516, Umzug EL-20261103-b633cb45). Bis dahin reichte die Route an
 * `qiblanco.activehosted.com/proc.php` (AC-Formular 21 -> Liste 20) weiter.
 * Seit T3 (10.11. 19:19:34Z) sind alle AC-Automationen aus; eine Eintragung in
 * AC-Liste 20 startete danach weder Bestaetigungsmail noch Kurs, und der Mail
 * Manager macht aus einer AC-Listen-Eintragung keinen Ablauf-Start. Wer sich
 * hier eintrug, bekam NICHTS. Ziel ist jetzt der eigene Anmelde-Endpunkt
 * (ac-eingang, Formular `cc-21`): er versiegelt die Anmeldung, schickt die
 * Bestaetigungsmail `kurs-kakao-cc` und startet nach dem Klick die
 * Kakao-Kurs-Strecke im Mail Manager. Dieselbe Bauform wie die Route
 * `api.mm-formular` auf qiblanco.com.
 *
 * KEIN AC-RUECKFALL, UND DAS IST ELINAS WORT: "Kuenftig Formulare/Neueinsteiger
 * nie mehr an den AC-Stopp koppeln." Ein Schalter zurueck auf proc.php waere
 * genau diese Kopplung. Rueckweg ist der Revert-Commit (RESULT des Jobs
 * 20261110-kakao-kurs-eintragung-auf-mail-manager) bzw. `CRYSTAL_KURSFELD=off`.
 *
 * KEIN SCHLUESSEL IN DIESER DATEI. Der Endpunkt ist oeffentlich (dieselbe
 * Adresse, die jeder Browser auf qiblanco.com anspricht). Der einzige
 * geteilte Wert, der Weiterleitungs-Ausweis, kommt — falls je gesetzt — aus
 * der Unit-Umgebung (`MM_FORMULAR_WEITERLEITUNG`), nie aus dem Quelltext.
 */

/** Die eigene Route, die die Eintragung serverseitig weiterreicht. */
export const EINTRAGUNG_PFAD = '/kurs-eintragung';

/** Der Anmelde-Endpunkt des Mail Managers (ac-eingang, README Abschnitt Aufbau). */
export const ANMELDE_ENDPUNKT = 'https://anmelden.dienst.qiblanco.com';

/** Das Formular im Endpunkt: ac-eingang/config/formulare.yaml, Schluessel `cc-21`. */
export const FORMULAR_ID = 'cc-21';

/**
 * Der Einwilligungssatz am Knopf, WORTGLEICH mit `einwilligung` von `cc-21` in
 * ac-eingang/config/formulare.yaml, und seine Kennung (die ersten 12 Zeichen
 * von SHA-256 ueber den Satz, wie `formulare.einwilligung_id`).
 *
 * WARUM HIER EINE KOPIE STEHT, obwohl die Storefront auf qiblanco.com keine
 * haelt: dieses Formular ist server-gerendert und ohne Skript benutzbar, es
 * kann den Satz nicht zur Laufzeit von `/w` holen. Damit die Kopie nicht still
 * vom Nachweis abweicht, schickt die Route die Kennung mit; aendert jemand den
 * Satz im Endpunkt, antwortet er 409 `einwilligung_veraltet`, die Route
 * protokolliert genau das (`[kurs-eintragung] mm_fehler=einwilligung_veraltet`)
 * und der Kunde sieht die Stoerungsseite statt eines Nachweises ueber einen
 * Satz, den er nie gesehen hat. Abgleich am Rand: die Naht-Probe dieses Jobs
 * vergleicht diese Kennung mit `GET /w`.
 */
export const EINWILLIGUNG = {
  id: '004f08b27a56',
  text:
    'Ja, ich möchte den kostenlosen Kakao-Kurs und danach den Newsletter von ' +
    'Crystal Cacao per E-Mail bekommen. Abmelden kann ich mich jederzeit mit ' +
    'einem Klick.',
};

/** Das Feld, das der Kunde ausfuellt. */
export const FELD_MAIL = 'email';

/**
 * Das Honeypot-Feld. Unsichtbar, leer, und genau deshalb da. Der Name bleibt
 * `fullname` (die stehende Wache und die Bestandsproben kennen ihn); an den
 * Endpunkt geht er als dessen Honigtopf `website`.
 */
export const FELD_FALLE = 'fullname';

/**
 * Die Zeitfalle des Endpunkts ist PFLICHT (ac-eingang src/sauber.py
 * zeitfalle: ohne Zeitpunkt, juenger als 1,5 s oder aelter als 24 h wird
 * still verworfen). Zwei Felder, wie auf qiblanco.com:
 *   `angezeigt` — Renderzeit des Servers in ms, steht im HTML (traegt ohne JS);
 *   `dauer_ms`  — Anzeigedauer, im Browser beim Absenden gemessen (mit JS;
 *                 unabhaengig von einer falsch gehenden Uhr im Geraet).
 */
export const FELD_ANGEZEIGT = 'angezeigt';
export const FELD_DAUER = 'dauer_ms';

/**
 * Die Zustaende, die die Route ueber die Adresszeile zurueckgibt.
 * Sie stehen in der URL und nicht in einem Cookie: eine Bestaetigungsseite
 * braucht keine Fremdspur.
 */
export const STAND = {
  eingetragen: 'eingetragen',
  adresse: 'adresse',
  gesperrt: 'gesperrt',
  stoerung: 'stoerung',
};

/**
 * Die Adress-Pruefung der Route. Bewusst grob: sie soll den Tippfehler
 * abfangen, nicht die Zustellbarkeit beweisen. Ob die Adresse dem Kunden
 * gehoert, entscheidet der Bestaetigungsklick (doppelte Einwilligung im
 * Endpunkt).
 */
export function adresseTaugt(wert) {
  const t = String(wert || '').trim();
  return t.length >= 6 && t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}

/**
 * Der Anzeige-Zeitpunkt in Serverzeit (ms), wie ihn der Endpunkt prueft.
 * Mit Anzeigedauer aus dem Browser: jetzt minus Dauer. Sonst die Renderzeit
 * aus dem HTML. Nichts Lesbares: 0 — der Endpunkt verwirft das als
 * `ohne_zeit`, und genau so soll ein Automat ohne Formular enden.
 */
export function anzeigeZeit(angezeigt, dauer, jetzt = Date.now()) {
  const d = Number(String(dauer ?? '').trim());
  if (Number.isFinite(d) && d > 0 && d < 7 * 24 * 3600 * 1000) {
    return Math.round(jetzt - d);
  }
  const a = Number(String(angezeigt ?? '').trim());
  return Number.isFinite(a) && a > 0 ? Math.round(a) : 0;
}

/**
 * Die Kunden-IP, wie Caddy sie sah: der LETZTE Eintrag von X-Forwarded-For.
 * Caddy ersetzt einen eingehenden Kopf durch seinen Peer (keine
 * trusted_proxies), ein Browser kann ihn also nicht vorgeben.
 */
export function kundenIp(xff) {
  const teile = String(xff || '').split(',');
  return (teile[teile.length - 1] || '').trim().slice(0, 64);
}

/**
 * Die Koepfe an den Endpunkt. `X-MM-Weiterleitung` steht IMMER da: ohne ihn
 * hielte der Endpunkt die Adresse dieses Servers fuer die Anmelde-IP des
 * Kunden (falscher Nachweis). Mit ihm, aber ohne gueltiges Geheimnis,
 * speichert er KEINE Anmelde-IP (`ip_quelle: weiterleitung_unbelegt`) —
 * derselbe Stand wie die Route auf qiblanco.com (mail-manager D-148). Die
 * Klick-IP der Bestaetigung kommt ohnehin direkt vom Browser des Kunden.
 */
export function weiterleitungsKoepfe({geheimnis, xff, ua}) {
  const k = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-MM-Weiterleitung': geheimnis ? String(geheimnis) : 'ohne-geheimnis',
  };
  const ip = kundenIp(xff);
  if (ip) k['X-MM-Kunden-IP'] = ip;
  if (ua) k['User-Agent'] = String(ua).slice(0, 300);
  return k;
}

/**
 * Die Nutzlast fuer `POST /f/cc-21`. Nur Felder, die der Endpunkt kennt
 * (src/endpunkt.py `_anmelden`, `herkunft`). UTM-Werte kommen aus der Adresse
 * der Seite, von der das Formular abgeschickt wurde (Referer).
 */
export function nutzlast({adresse, falle, t, referer}) {
  const n = {
    email: String(adresse || '').trim().slice(0, 254),
    website: String(falle || '').slice(0, 200),
    t: String(t || 0),
    einwilligung_id: EINWILLIGUNG.id,
    seite: '/',
  };
  try {
    const url = new URL(referer || '');
    n.seite = url.pathname.slice(0, 200) || '/';
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = (url.searchParams.get(k) || '').trim().slice(0, 150);
      if (v) n[k] = v;
    }
  } catch {
    /* kein lesbarer Referer: Startseite als Herkunft */
  }
  return n;
}

/**
 * Die Antwort des Endpunkts -> der Zustand fuer den Kunden.
 * Angenommen ist NUR `ok: true` (202 `bitte_bestaetigen`, bzw. `weiter`) —
 * der Statuscode allein reicht nicht, und ein unlesbarer Rumpf ist kein Erfolg.
 *   400 adresse_ungueltig -> adresse
 *   403 adresse_gesperrt  -> gesperrt (abgemeldet / Sperrliste: ein "noch ein
 *                            Klick im Postfach" waere gelogen, es kommt keine Mail)
 *   alles andere          -> stoerung (409 Satz veraltet, 429 Bremse, 404, 5xx)
 */
export function standAus(status, antwort) {
  const a = antwort && typeof antwort === 'object' ? antwort : {};
  if (a.ok === true && status >= 200 && status < 300) return STAND.eingetragen;
  if (a.fehler === 'adresse_ungueltig') return STAND.adresse;
  if (status === 403 && a.fehler === 'adresse_gesperrt') return STAND.gesperrt;
  return STAND.stoerung;
}
