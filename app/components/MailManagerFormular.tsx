// app/components/MailManagerFormular.tsx
// Formular des Qi Blanco Mail Managers fuer Hydrogen (React, serverseitig renderbar, ohne Fremd-Skript).
// Absenden: an die eigene Route /api/mm-formular (app/routes/api.mm-formular.tsx), die an den Mail-Manager-
// Endpunkt weitergibt. Spamschutz: Honigtopf-Feld "website" + Zeitpruefung (Anzeigedauer). Double-Opt-in macht
// der Endpunkt (Bestaetigungsmail mit Knopf). Erfolg: Danke-Text oder Weiterleitung auf die Erfolgsseite.
// Erzeugt vom Mail Manager (Reiter Formulare). Texte und Einwilligung kommen aus der Formular-Konfiguration.
import {useEffect, useRef, useState} from 'react';
import {useFetcher} from 'react-router';

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

const FEHLER = {"de": {"fehler": "Das hat gerade nicht geklappt. Bitte versuch es in ein paar Minuten noch einmal.", "adresse": "Bitte gib eine gültige E-Mail-Adresse ein.", "pflicht": "Bitte fülle alle Pflichtfelder aus.", "veraltet": "Der Einwilligungstext wurde gerade aktualisiert. Bitte lade die Seite neu.", "unbekannt": "Dieses Formular nimmt gerade keine Anmeldungen an.", "bremse": "Gerade kommen sehr viele Anmeldungen. Bitte versuch es in ein paar Minuten noch einmal."}, "en": {"fehler": "Something went wrong. Please try again in a few minutes.", "adresse": "Please enter a valid email address.", "pflicht": "Please fill in all required fields.", "veraltet": "The consent text was just updated. Please reload the page.", "unbekannt": "This form is not accepting signups right now.", "bremse": "We are getting a lot of signups right now. Please try again in a few minutes."}} as const;

export function MailManagerFormular({
  konfig, className, klassen = {}, aktion = '/api/mm-formular', style,
}: {konfig: MmFormularKonfig; className?: string; klassen?: MmKlassen; aktion?: string;
    style?: React.CSSProperties}) {
  const fetcher = useFetcher<Antwort>();
  const T = FEHLER[konfig.sprache] ?? FEHLER.de;
  // Anzeige-Zeitpunkt: serverseitig gerendert (ohne JavaScript traegt das Feld die Renderzeit des Servers),
  // im Browser zaehlt die Anzeigedauer; die Route rechnet daraus den Zeitstempel fuer die Zeitpruefung.
  const [angezeigt] = useState(() => Date.now());
  const start = useRef<number>(0);
  const [meldung, setMeldung] = useState('');
  useEffect(() => { start.current = performance.now(); }, []);

  const a = fetcher.data;
  const laeuft = fetcher.state !== 'idle';
  useEffect(() => {
    if (!a) return;
    if (a.ok && a.weiter && typeof window !== 'undefined') window.location.assign(a.weiter);
    if (!a.ok) setMeldung(
      a.fehler === 'adresse_ungueltig' ? T.adresse : a.fehler === 'einwilligung_veraltet' ? T.veraltet
        : a.fehler === 'formular_unbekannt' ? T.unbekannt : a.fehler === 'zu_viele_anfragen' ? T.bremse
        : a.fehler === 'pflicht' ? T.pflicht : T.fehler);
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
    <fetcher.Form method="post" action={aktion} className={className ?? klassen.form ?? 'mm-formular'} style={style}
      noValidate onSubmit={(e) => {
        const f = e.currentTarget;
        const fehlt = konfig.felder.some((x) => x.pflicht && !String((f.elements.namedItem(x.name) as HTMLInputElement)?.value || '').trim());
        const mail = String((f.elements.namedItem('email') as HTMLInputElement)?.value || '').trim();
        if (fehlt) { e.preventDefault(); setMeldung(T.pflicht); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { e.preventDefault(); setMeldung(T.adresse); return; }
        setMeldung('');
        // Direkt ins Feld (nicht ueber State): fetcher.Form liest die Formulardaten noch in diesem Ereignis.
        (f.elements.namedItem('dauer_ms') as HTMLInputElement).value = String(Math.max(1, Math.round(performance.now() - start.current)));
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
      <button type="submit" className={klassen.knopf ?? 'mm-formular__knopf'} disabled={laeuft}>{konfig.knopf}</button>
      <p className={klassen.einwilligung ?? 'mm-formular__einwilligung'}>{konfig.einwilligung}</p>
      <p className={klassen.meldung ?? 'mm-formular__meldung'} role="status" aria-live="polite">{meldung}</p>
    </fetcher.Form>
  );
}

