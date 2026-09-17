import {
  EINTRAGUNG_PFAD,
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
  return (
    <form className="cc-eintrag" method="post" action={EINTRAGUNG_PFAD}>
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
        DER HONEYPOT. ActiveCampaign wertet ein gefuelltes `fullname` als Spam
        und verwirft die Eintragung — das Feld gehoert also mit, und es muss
        LEER bleiben. `display:none` steckt in der Klasse, nicht im Markup,
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
      <button className="cc-eintrag__knopf" type="submit">
        {knopf}
      </button>
    </form>
  );
}
