import {useEffect, useRef} from 'react';
import {
  EINTRAGUNG_PFAD,
  EINWILLIGUNG,
  FELD_ANGEZEIGT,
  FELD_DAUER,
  FELD_FALLE,
  FELD_MAIL,
} from '~/lib/kurs-eintragung';

/**
 * Das Eintragungsformular des Gratis-Kurses — server-gerendert und ohne
 * JavaScript benutzbar.
 *
 * "OHNE JAVASCRIPT BENUTZBAR" IST HIER KEIN ZUGABE-MERKMAL, SONDERN DER GRUND,
 * WARUM DIE WACHE ES SEHEN KANN: ein `<form method="post">` mit echtem
 * `action` steht im ausgelieferten HTML und funktioniert, bevor eine Zeile
 * Skript geladen ist. Deshalb ausdruecklich KEIN `<Form>` aus react-router
 * hier — das waere derselbe Knoten mit einem Skript davor, und die
 * Bestaetigung haengt dann an der Hydration.
 *
 * DAS FELD HEISST `email` UND TRAEGT `type="email"`. Beides ist gemessen und
 * nicht gewaehlt: die stehende Wache (crystal-cacao-node/bin/
 * eintragungsweg-nachlauf) sucht `input[name=email]` und von dort aus per
 * `.closest('form')` den Absendeknopf; das Erfuellungskriterium k4cc97eb5b2
 * sucht zusaetzlich `type=email` im rohen HTML. Das ActiveCampaign-Formular
 * traegt dort `type="text"` — das ist dort ein Mangel und kein Vorbild.
 */
export function KursEintragung({knopf = 'Zum Kurs anmelden', feldId = 'kurs-mail'}) {
  // DIE ZEITFALLE DES ANMELDE-ENDPUNKTS (seit 2026-11-10, Weg an den Mail
  // Manager, app/lib/kurs-eintragung.js): ohne lesbaren Anzeige-Zeitpunkt
  // verwirft er still. `angezeigt` ist die Renderzeit des Servers und steht
  // im HTML, damit der Weg auch ohne Skript traegt. Mit Skript misst der
  // Browser die Anzeigedauer und schickt sie beim Absenden als `dauer_ms`;
  // die Route rechnet daraus den Zeitpunkt in Serverzeit (eine falsch
  // gehende Uhr im Geraet spielt dann keine Rolle).
  // `suppressHydrationWarning`: Server- und Browser-Render sehen je eine
  // eigene Uhrzeit; der Wert im HTML ist der richtige und bleibt stehen.
  const angezeigt = String(Date.now());
  const seit = useRef(0);
  const dauer = useRef(null);
  useEffect(() => {
    seit.current = performance.now();
  }, []);
  const beimAbsenden = () => {
    if (dauer.current && seit.current) {
      dauer.current.value = String(Math.round(performance.now() - seit.current));
    }
  };
  return (
    <form
      className="cc-eintrag"
      method="post"
      action={EINTRAGUNG_PFAD}
      onSubmit={beimAbsenden}
    >
      <label className="cc-eintrag__marke" htmlFor={feldId}>
        Deine E-Mail-Adresse
      </label>
      <input
        className="cc-eintrag__feld"
        id={feldId}
        type="email"
        name={FELD_MAIL}
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        placeholder="name@beispiel.de"
      />
      {/*
        DER HONEYPOT. Ein gefuelltes `fullname` beantwortet die Route wie einen
        Erfolg und reicht nichts weiter — das Feld gehoert also mit, und es
        muss LEER bleiben. `display:none` steckt in der Klasse, nicht im Markup,
        damit hier kein freier Wert entsteht.
        `tabIndex={-1}` ist tragend: ein fokussierbares Feld in einem
        aria-hidden-Bereich waere ein Bedienfehler fuer die Tastatur.
        Nebenbei, und ausdruecklich NICHT hier behoben: auf qiblanco.com ist
        dieses Feld SICHTBAR, dort sieht der Kunde ein streunendes Textfeld.
        Das ist als eigener Auftrag gemeldet.
      */}
      <div className="cc-eintrag__falle" aria-hidden="true">
        <label htmlFor={`${feldId}-falle`}>Name</label>
        <input
          id={`${feldId}-falle`}
          type="text"
          name={FELD_FALLE}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input
        type="hidden"
        name={FELD_ANGEZEIGT}
        defaultValue={angezeigt}
        suppressHydrationWarning
      />
      <input type="hidden" name={FELD_DAUER} defaultValue="" ref={dauer} />
      <button className="cc-eintrag__knopf" type="submit">
        {knopf}
      </button>
      {/*
        DER EINWILLIGUNGSSATZ AM KNOPF, wortgleich mit dem Nachweis im
        Endpunkt (Formular cc-21). Der Endpunkt haelt fest, dass genau dieser
        Satz am Knopf stand; stuende er hier nicht, stimmte der Nachweis nicht
        mit dem Formular ueberein.
      */}
      <p className="cc-eintrag__einwilligung">{EINWILLIGUNG.text}</p>
    </form>
  );
}
