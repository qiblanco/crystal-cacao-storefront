// app/components/MailManagerFormular.tsx
// Formular des Qi Blanco Mail Managers für Hydrogen (React, serverseitig renderbar, ohne Fremd-Skript).
// Absenden: an die eigene Route /api/mm-formular (app/routes/api.mm-formular.tsx), die an den Mail-Manager-
// Endpunkt weitergibt. Spamschutz: Honigtopf-Feld "website" + Zeitpruefung (Anzeigedauer). Double-Opt-in macht
// der Endpunkt (Bestaetigungsmail mit Knopf). Erfolg: Danke-Text oder Weiterleitung auf die Erfolgsseite.
// Erzeugt vom Mail Manager (Reiter Formulare). Texte und Einwilligung kommen aus der Formular-Konfiguration.
import {useEffect, useRef, useState} from 'react';

export type MmFeld = {name: string; typ: 'text' | 'email'; label: string; pflicht: boolean};
export type MmFormularKonfig = {
  formularId: string;
  sprache: 'de' | 'en';
  felder: MmFeld[];
  titel?: string;
  hinweis?: string;
  knopf: string;
  einwilligung: string;
  einwilligungId: string;
  dankeTitel?: string;
  dankeText: string;
  erfolgsseite?: string;
  liste?: string;
  tags?: string[];
};
export type MmKlassen = Partial<Record<
  'form' | 'titel' | 'hinweis' | 'feld' | 'label' | 'input' | 'knopf' | 'einwilligung' | 'meldung' | 'danke', string>>;
type Antwort = {ok: boolean; status?: string; fehler?: string; text?: string; weiter?: string};

const FEHLER = {"de": {"fehler": "Deine Anmeldung ist gerade nicht bei uns angekommen. Das liegt an uns, nicht an deiner Adresse. Bitte versuch es in ein paar Minuten noch einmal.", "unklar": "Wir konnten gerade nicht prüfen, ob deine Anmeldung angekommen ist. Schau bitte in dein Postfach. Kommt in ein paar Minuten keine Mail von uns, versuch es noch einmal.", "adresse": "Bitte prüfe deine E-Mail-Adresse. So wie sie dort steht, können wir dir keine Mail schicken.", "pflicht": "Bitte fülle alle Pflichtfelder aus.", "veraltet": "Der Einwilligungstext wurde gerade aktualisiert. Bitte lade die Seite neu.", "unbekannt": "Dieses Formular nimmt gerade keine Anmeldungen an.", "bremse": "Gerade kommen sehr viele Anmeldungen. Bitte versuch es in ein paar Minuten noch einmal.", "gesperrt": "Diese Adresse ist bei uns gesperrt, zum Beispiel nach einer Abmeldung oder weil unsere Mails dort nicht ankamen. Darum tragen wir sie nicht wieder ein. Wenn du wieder Post von uns möchtest, schreib uns an info@qiblanco.com."}, "en": {"fehler": "Your signup did not reach us just now. This is on our side, not your address. Please try again in a few minutes.", "unklar": "We could not check whether your signup reached us. Please look in your inbox. If no email from us arrives within a few minutes, try again.", "adresse": "Please check your email address. We cannot send a message to it as written.", "pflicht": "Please fill in all required fields.", "veraltet": "The consent text was just updated. Please reload the page.", "unbekannt": "This form is not accepting signups right now.", "bremse": "We are getting a lot of signups right now. Please try again in a few minutes.", "gesperrt": "This address is blocked on our side, for example after an unsubscribe or because our emails could not be delivered. That's why we won't add it again. If you'd like to hear from us again, write to info@qiblanco.com."}} as const;

// Direkt aus dem Browser an den Endpunkt (Prop `direkt`): der Endpunkt sieht die echte Kunden-IP, ohne dass die Route ein
// Geheimnis braucht. Zeitstempel in Serverzeit (GET /w), wie ihn die Zeitprüfung des Endpunkts erwartet; mindestens
// 1,6 s nach der Anzeige, kein automatischer Zweitversuch (er wäre eine doppelte Anmeldung).
async function direktSenden(endpunkt: string, konfig: MmFormularKonfig, f: HTMLFormElement, dauer: number): Promise<Antwort> {
  const wert = (k: string) => String((f.elements.namedItem(k) as HTMLInputElement | null)?.value ?? '').trim();
  let versatz = 0;
  try {
    const w = await (await fetch(`${endpunkt}/w`, {credentials: 'omit'})).json();
    const s = Date.parse(w.stand);
    if (Number.isFinite(s)) versatz = s - Date.now();
  } catch { /* ohne Serverzeit gilt die Uhr des Browsers */ }
  if (dauer < 1600) await new Promise((fertig) => setTimeout(fertig, 1600 - dauer));
  try {
    const r = await fetch(`${endpunkt}/f/${encodeURIComponent(konfig.formularId)}`, {
      method: 'POST', credentials: 'omit', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({
        email: wert('email'), vorname: [wert('vorname'), wert('nachname')].filter(Boolean).join(' '), website: wert('website'),
        t: String(Math.round(Date.now() + versatz - Math.max(dauer, 1600))), einwilligung_id: konfig.einwilligungId,
        seite: window.location.pathname, formular_id: konfig.formularId, liste: konfig.liste ?? '',
        tags: (konfig.tags ?? []).join(','), erfolgsseite: konfig.erfolgsseite ?? '',
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (j.ok) return {ok: true, weiter: /^https:\/\//.test(konfig.erfolgsseite ?? '') ? konfig.erfolgsseite : undefined};
    return {ok: false, fehler: j.fehler || (r.status === 429 ? 'zu_viele_anfragen' : 'fehler')};
  } catch {
    return {ok: false, fehler: 'nicht_erreichbar'};
  }
}

// Über die eigene Route. Ein abgerissenes Netz ist hier eine Meldung im Formular: useFetcher warf es an die Fehlerseite der
// Route, die ganze Seite stand auf „Hoppla 500“ (Elina EL-20261103-ca2f6465).
async function routeSenden(aktion: string, f: HTMLFormElement): Promise<Antwort> {
  try {
    const r = await fetch(aktion, {method: 'POST', body: new FormData(f), headers: {Accept: 'application/json'}});
    const j = await r.json().catch(() => null);
    return j && typeof j.ok === 'boolean' ? j : {ok: false, fehler: 'nicht_erreichbar'};
  } catch {
    return {ok: false, fehler: 'nicht_erreichbar'};
  }
}

export function MailManagerFormular({
  konfig, className, klassen = {}, aktion = '/api/mm-formular', direkt = '', style,
}: {konfig: MmFormularKonfig; className?: string; klassen?: MmKlassen; aktion?: string; direkt?: string;
    style?: React.CSSProperties}) {
  const [a, setAntwort] = useState<Antwort | null>(null);
  const [sendet, setSendet] = useState(false);
  const T = FEHLER[konfig.sprache] ?? FEHLER.de;
  // Anzeige-Zeitpunkt: serverseitig gerendert (ohne JavaScript trägt das Feld die Renderzeit des Servers),
  // im Browser zählt die Anzeigedauer; die Route rechnet daraus den Zeitstempel für die Zeitprüfung.
  const [angezeigt] = useState(() => Date.now());
  const start = useRef<number>(0);
  const [meldung, setMeldung] = useState('');
  useEffect(() => { start.current = performance.now(); }, []);

  useEffect(() => {
    if (!a) return;
    if (a.ok && a.weiter && typeof window !== 'undefined') window.location.assign(a.weiter);
    if (!a.ok) setMeldung(
      a.fehler === 'adresse_ungueltig' ? T.adresse : a.fehler === 'einwilligung_veraltet' ? T.veraltet
        : a.fehler === 'formular_unbekannt' ? T.unbekannt : a.fehler === 'zu_viele_anfragen' ? T.bremse
        : a.fehler === 'adresse_gesperrt' ? T.gesperrt : a.fehler === 'pflicht' ? T.pflicht
        : a.fehler === 'nicht_erreichbar' ? T.unklar : T.fehler);
  }, [a, T]);

  if (a?.ok && !a.weiter) {
    return (
      <div className={klassen.danke ?? 'mm-formular__danke'} role="status" style={style}>
        {konfig.dankeTitel ? <strong>{konfig.dankeTitel}</strong> : null}
        <p>{konfig.dankeText}</p>
      </div>
    );
  }
  return (
    <form method="post" action={aktion} className={className ?? klassen.form ?? 'mm-formular'} style={style}
      noValidate onSubmit={(e) => {
        const f = e.currentTarget;
        const fehlt = konfig.felder.some((x) => x.pflicht && !String((f.elements.namedItem(x.name) as HTMLInputElement)?.value || '').trim());
        const mail = String((f.elements.namedItem('email') as HTMLInputElement)?.value || '').trim();
        if (fehlt) { e.preventDefault(); setMeldung(T.pflicht); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { e.preventDefault(); setMeldung(T.adresse); return; }
        setMeldung('');
        // Direkt ins Feld (nicht über State): routeSenden liest die Formulardaten noch in diesem Ereignis.
        const dauer = Math.max(1, Math.round(performance.now() - start.current));
        (f.elements.namedItem('dauer_ms') as HTMLInputElement).value = String(dauer);
        // Mit `direkt` sendet der Browser selbst an den Endpunkt, sonst an die Route; ohne JavaScript greift dieser Zweig
        // nicht, dann sendet der Browser das Formular selbst an die Route.
        e.preventDefault();
        setSendet(true);
        void (direkt ? direktSenden(direkt, konfig, f, dauer) : routeSenden(aktion, f))
          .then((antwort) => { setAntwort(antwort); setSendet(false); });
      }}>
      {konfig.titel ? <h3 className={klassen.titel ?? 'mm-formular__titel'}>{konfig.titel}</h3> : null}
      {konfig.hinweis ? <p className={klassen.hinweis ?? 'mm-formular__hinweis'}>{konfig.hinweis}</p> : null}
      <input type="hidden" name="formular_id" value={konfig.formularId} />
      <input type="hidden" name="einwilligung_id" value={konfig.einwilligungId} />
      <input type="hidden" name="liste" value={konfig.liste ?? ''} />
      <input type="hidden" name="tags" value={(konfig.tags ?? []).join(',')} />
      <input type="hidden" name="erfolgsseite" value={konfig.erfolgsseite ?? ''} />
      <input type="hidden" name="sprache" value={konfig.sprache} />
      <input type="hidden" name="angezeigt" value={String(angezeigt)} suppressHydrationWarning />
      <input type="hidden" name="dauer_ms" defaultValue="" />
      {konfig.felder.map((x) => (
        <div key={x.name} className={klassen.feld ?? 'mm-formular__feld'}>
          <label className={klassen.label ?? 'mm-formular__label'}>
            <span>{x.label}{x.pflicht ? ' *' : ''}</span>
            <input className={klassen.input ?? 'mm-formular__input'} name={x.name} type={x.typ}
              autoComplete={x.name === 'email' ? 'email' : x.name === 'vorname' ? 'given-name' : x.name === 'nachname' ? 'family-name' : 'off'}
              required={x.pflicht} placeholder={x.label} />
          </label>
        </div>
      ))}
      {/* Honigtopf: Menschen sehen und fuellen es nicht. */}
      <div aria-hidden="true" style={{position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden'}}>
        <label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      <button type="submit" className={klassen.knopf ?? 'mm-formular__knopf'} disabled={sendet}>{konfig.knopf}</button>
      <p className={klassen.einwilligung ?? 'mm-formular__einwilligung'}>{konfig.einwilligung}</p>
      <p className={klassen.meldung ?? 'mm-formular__meldung'} role="status" aria-live="polite">{meldung}</p>
    </form>
  );
}
