/**
 * Die eigene Route des Eintragungswegs: sie nimmt die Adresse entgegen,
 * reicht sie serverseitig an ActiveCampaign weiter und antwortet mit UNSERER
 * Bestaetigung.
 *
 * WARUM SERVERSEITIG UND NICHT PER FREMD-SKRIPT: der Kunde bleibt im Laden.
 * Der Aufruf an proc.php geht vom Node-Prozess aus, nie aus dem Browser —
 * damit setzt die Eintragung keinen Fremd-Cookie und laedt kein Fremd-Skript.
 * Dieser Laden hat keine Einwilligungsverwaltung (kein Cookiebot in der CSP),
 * also darf er auch keine haben, die eine braeuchte. Die Einwilligung selbst
 * holt ActiveCampaign ein: Formular 21 laeuft mit doppelter Bestaetigung,
 * gemessen am 2026-09-17 an der Antwort von proc.php.
 *
 * KEINE PERSONENBEZOGENEN DATEN IM LOG. Protokolliert wird der Antwort-Code
 * und die Laenge, nie die Adresse — und auch kein Hash davon, denn ein Hash
 * einer E-Mail-Adresse ist ruecksuchbar und damit weiter personenbezogen.
 */
import {redirect} from 'react-router';
import {Link} from 'react-router';
import {useLoaderData} from 'react-router';
import {KursEintragung} from '~/components/reusables/KursEintragung';
import {canonicalLink} from '~/lib/seo';
import {ABSENDER_MARKE} from '~/lib/kakao-zone';
import {
  AC_PROZESSOR,
  EINTRAGUNG_PFAD,
  FELD_FALLE,
  FELD_MAIL,
  FORMULAR_21,
  STAND,
  adresseTaugt,
} from '~/lib/kurs-eintragung';

const TITEL = `Kurs-Anmeldung | ${ABSENDER_MARKE}`;

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => [
  {title: TITEL},
  // Eine Bestaetigungsseite gehoert nicht in den Index: sie hat fuer einen
  // Suchenden keinen Inhalt, und indexiert waere sie ein Einstieg ins Nichts.
  // `follow` bleibt, damit der Weg zurueck in den Laden gewertet wird.
  {name: 'robots', content: 'noindex,follow'},
  canonicalLink(EINTRAGUNG_PFAD),
];

/**
 * GET: die Seite selbst. Der Zustand steht in der Adresszeile, damit ein
 * Neuladen oder ein geteilter Link nie eine Bestaetigung vortaeuscht, die es
 * nicht gab.
 * @param {Route.LoaderArgs} args
 */
export async function loader({request, context}) {
  const stand = new URL(request.url).searchParams.get('stand') || '';
  return {
    stand: Object.values(STAND).includes(stand) ? stand : '',
    aus: !weiterreichenAn(context),
  };
}

/**
 * DER RUECKWEG AUF DER ZWEITEN ACHSE — und er liest bewusst eine ANDERE
 * Groesse als der erste.
 *
 * Rueckweg 1 ist das ausgelieferte Bundle: die Sicherung unter
 * crystal-cacao-node/state/rueckweg-<stempel>/ zurueckspielen und den Dienst
 * neu starten. Das nimmt das Feld KOMPLETT zurueck und braucht einen
 * Neustart.
 * Rueckweg 2 ist dieser Schalter: `CRYSTAL_KURSFELD=off` in der Unit-Umgebung
 * stellt das WEITERREICHEN ab, ohne das Bundle anzufassen. Gebraucht wird er
 * fuer den Fall, in dem der Bau in Ordnung ist und der WEG nicht — wenn
 * ActiveCampaign seinen Prozessor aendert, wenn Missbrauch ueber das Feld
 * laeuft. Zwei Sperren sind nur unabhaengig, wenn sie verschiedene Groessen
 * lesen; Rueckweg 1 liest ein Artefakt, Rueckweg 2 eine Umgebungsvariable.
 *
 * ER STEHT SERVERSEITIG UND NUR DORT. Ein Schalter, der das Markup
 * umschaltet, waere im Browser ein anderer Wert als auf dem Server — React
 * baut den Abschnitt dann bei der Hydration neu, und der Kunde sieht ein
 * Springen. Deshalb schaltet dieser Schalter den WEG und nicht das FELD:
 * `loader` und `action` laufen ausschliesslich auf dem Server.
 *
 * FAIL-OPEN, UND DAS IST ABSICHT: fehlt die Variable, wird weitergereicht.
 * Ein Schalter, der bei seinem eigenen Fehlen sperrt, nimmt den
 * Eintragungsweg mit jedem Deploy still wieder weg — genau der Zustand, den
 * dieser Bau behebt.
 */
function weiterreichenAn(context) {
  const wert = context?.env?.CRYSTAL_KURSFELD ?? 'on';
  return String(wert).toLowerCase() !== 'off';
}

/**
 * POST: der Weg selbst.
 * @param {Route.ActionArgs} args
 */
export async function action({request, context}) {
  if (!weiterreichenAn(context)) {
    console.log('[kurs-eintragung] schalter=off');
    return ziel(STAND.stoerung);
  }

  // EIN POST OHNE BRAUCHBAREN RUMPF DARF KEINE 500 GEBEN. `formData()` wirft
  // bei fehlendem oder fremdem Content-Type, und eine unbehandelte Ausnahme
  // waere hier eine Fehlerseite am Kundenrand fuer etwas, das gar keine
  // Eintragung war. GEMESSEN am 2026-09-17: genau so entsteht sie, wenn ein
  // Aufrufer einem 303 mit POST folgt (`curl -L -X POST`) — Suchmaschinen und
  // Sicherheits-Scanner tun das. Die Antwort ist dann dieselbe wie bei einer
  // untauglichen Adresse: eine Seite mit dem Feld darauf.
  let daten;
  try {
    daten = await request.formData();
  } catch (fehler) {
    console.log('[kurs-eintragung] rumpf_unlesbar=1 art=%s', fehler?.name || 'unbekannt');
    // HIER STEHT ABSICHTLICH KEINE WEITERLEITUNG, UND DAS IST GEMESSEN:
    // ein Aufrufer, der einem 303 erneut mit POST folgt, kommt mit demselben
    // unlesbaren Rumpf wieder an — und laeuft in eine Schleife. Die erste
    // Fassung dieser Stelle leitete auf ?stand=adresse um; `curl -L -X POST`
    // ergab daraufhin 50 Weiterleitungen statt einer Antwort, also 50
    // Anfragen an den Laden je Versuch. Aus einer einzelnen 500 war ein
    // Verstaerker geworden. Eine ANTWORT kann nicht kreisen.
    return antwortSeite(400);
  }

  const adresse = String(daten.get(FELD_MAIL) || '').trim();
  const falle = String(daten.get(FELD_FALLE) || '').trim();

  // DER HONEYPOT ANTWORTET WIE DER ERFOLG, UND ZWAR ABSICHTLICH: eine eigene
  // Fehlermeldung waere die Anleitung, wie man ihn umgeht. Weitergereicht
  // wird nichts.
  if (falle) {
    console.log('[kurs-eintragung] honeypot=1');
    return ziel(STAND.eingetragen);
  }

  if (!adresseTaugt(adresse)) {
    console.log('[kurs-eintragung] adresse_untauglich=1');
    return ziel(STAND.adresse);
  }

  const koerper = new URLSearchParams({
    ...FORMULAR_21,
    [FELD_MAIL]: adresse,
    [FELD_FALLE]: '',
  });

  try {
    const antwort = await fetch(AC_PROZESSOR, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: koerper,
      // Ohne Deckel haengt eine Kundenanfrage an einem fremden Dienst.
      signal: AbortSignal.timeout(20000),
    });
    const text = await antwort.text();
    console.log(
      '[kurs-eintragung] proc_http=%s laenge=%s quittiert=%s',
      antwort.status,
      text.length,
      // Die Quittung von proc.php ist ein Aufruf von `_show_thank_you`.
      // Geprueft wird die QUITTUNG, nicht nur der Statuscode: proc.php
      // antwortet auch bei einer verworfenen Eintragung mit HTTP 200.
      text.includes('_show_thank_you') ? 1 : 0,
    );
    if (!antwort.ok || !text.includes('_show_thank_you')) {
      return ziel(STAND.stoerung);
    }
  } catch (fehler) {
    console.log('[kurs-eintragung] proc_fehler=%s', fehler?.name || 'unbekannt');
    return ziel(STAND.stoerung);
  }

  return ziel(STAND.eingetragen);
}

/** 303: die Antwort auf ein POST ist eine Seite, kein erneutes POST. */
function ziel(stand) {
  return redirect(`${EINTRAGUNG_PFAD}?stand=${stand}`, 303);
}

/**
 * Die Antwort auf eine Anfrage, die keine Eintragung war: der Statuscode, und
 * sonst nichts.
 *
 * WARUM HIER KEIN EIGENES HTML STEHT — GEMESSEN, NICHT VERMUTET: eine erste
 * Fassung gab eine kleine eigene Seite zurueck. React Router liefert den
 * Rumpf einer Action-Antwort mit Nicht-Weiterleitungs-Status NICHT aus; es
 * rendert die Route (`loader` laeuft, Zustand leer, also die Seite mit dem
 * Feld darauf) und haengt den Rumpf als serialisierte Action-Daten in die
 * Auslieferung. Gemessen an der Live-Antwort: 15.442 Byte, H1 "Kostenfrei
 * beim Kakao-Kurs mitmachen", mein Satz genau einmal — im Datenstrom, nicht
 * im Sichtbaren. Das Ergebnis fuer den Menschen ist das richtige: die echte
 * Seite mit dem Feld, Status 400, KEINE Weiterleitung und damit keine
 * Schleife. Das eigene HTML war dabei nur Ballast, der als Daten mitfaehrt.
 */
function antwortSeite(status) {
  return new Response(null, {status});
}


export default function KursEintragungSeite() {
  /** @type {{stand: string, aus: boolean}} */
  const {stand, aus} = useLoaderData();

  // Ist der Weg abgeschaltet, sagt die Seite das ehrlich und nennt den Weg,
  // der dann traegt. Eine "Stoerung" zu behaupten waere eine Ausrede fuer
  // eine Entscheidung, die wir selbst getroffen haben.
  if (aus) {
    return (
      <Rahmen>
        <h1>Die Anmeldung läuft gerade über uns</h1>
        <p>
          Schreib uns an <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>,
          dann tragen wir dich in den Kurs ein.
        </p>
      </Rahmen>
    );
  }

  if (stand === STAND.eingetragen) {
    return (
      <Rahmen>
        <h1>Noch ein Klick in deinem Postfach</h1>
        <p>
          Wir haben dir eine E-Mail geschickt. Bestätige darin deine Adresse,
          dann bekommst du den Kurs.
        </p>
        <p>Die E-Mail kommt sofort. Schau auch im Spam-Ordner nach.</p>
      </Rahmen>
    );
  }

  if (stand === STAND.adresse) {
    return (
      <Rahmen>
        <h1>Die Adresse hat nicht gepasst</h1>
        <p>Trag sie bitte noch einmal ein.</p>
        <KursEintragung feldId="kurs-mail-neu" />
      </Rahmen>
    );
  }

  if (stand === STAND.stoerung) {
    return (
      <Rahmen>
        <h1>Das hat gerade nicht geklappt</h1>
        <p>
          Versuch es bitte noch einmal. Klappt es wieder nicht, schreib uns an{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>.
        </p>
        <KursEintragung feldId="kurs-mail-neu" />
      </Rahmen>
    );
  }

  return (
    <Rahmen>
      <h1>Kostenfrei beim Kakao-Kurs mitmachen</h1>
      <p>Trag deine E-Mail-Adresse ein.</p>
      <KursEintragung feldId="kurs-mail-direkt" />
    </Rahmen>
  );
}

/** Derselbe Textseiten-Rahmen, den Impressum und Datenschutz benutzen. */
function Rahmen({children}) {
  return (
    <div className="policy cc-seite cc-seite--text">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>
      <div className="cc-rechtstext cc-eintrag-seite">{children}</div>
    </div>
  );
}

/** @typedef {import('./+types/kurs-eintragung').Route} Route */
