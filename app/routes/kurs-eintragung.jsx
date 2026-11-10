/**
 * Die eigene Route des Eintragungswegs: sie nimmt die Adresse entgegen,
 * reicht sie serverseitig an den Anmelde-Endpunkt des Mail Managers
 * (ac-eingang, Formular `cc-21`) weiter und antwortet mit UNSERER
 * Bestaetigung. Bis 2026-11-10 ging sie an ActiveCampaign (proc.php,
 * Formular 21); warum nicht mehr, steht in app/lib/kurs-eintragung.js.
 *
 * WARUM SERVERSEITIG UND NICHT PER FREMD-SKRIPT: der Kunde bleibt im Laden.
 * Der Aufruf an den Endpunkt geht vom Node-Prozess aus, nie aus dem Browser —
 * damit setzt die Eintragung keinen Fremd-Cookie, laedt kein Fremd-Skript und
 * braucht keine Zeile in der CSP. Die Einwilligung holt der Endpunkt ein:
 * `cc-21` laeuft mit doppelter Bestaetigung (Mail `kurs-kakao-cc`, Klick).
 *
 * KEINE PERSONENBEZOGENEN DATEN IM LOG. Protokolliert wird der Antwort-Code
 * und der Fehlername des Endpunkts, nie die Adresse — und auch kein Hash
 * davon, denn ein Hash einer E-Mail-Adresse ist ruecksuchbar und damit weiter
 * personenbezogen.
 */
import {redirect} from 'react-router';
import {Link} from 'react-router';
import {useLoaderData} from 'react-router';
import {KursEintragung} from '~/components/reusables/KursEintragung';
import {canonicalLink} from '~/lib/seo';
import {ABSENDER_MARKE} from '~/lib/kakao-zone';
import {
  ANMELDE_ENDPUNKT,
  EINTRAGUNG_PFAD,
  FELD_ANGEZEIGT,
  FELD_DAUER,
  FELD_FALLE,
  FELD_MAIL,
  FORMULAR_ID,
  STAND,
  adresseTaugt,
  anzeigeZeit,
  nutzlast,
  standAus,
  weiterleitungsKoepfe,
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
 * der Anmelde-Endpunkt ausfaellt oder sich aendert, wenn Missbrauch ueber das Feld
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

  const koerper = nutzlast({
    adresse,
    falle,
    t: anzeigeZeit(daten.get(FELD_ANGEZEIGT), daten.get(FELD_DAUER)),
    referer: request.headers.get('Referer'),
  });

  let stand = STAND.stoerung;
  try {
    const antwort = await fetch(
      `${ANMELDE_ENDPUNKT}/f/${encodeURIComponent(FORMULAR_ID)}`,
      {
        method: 'POST',
        headers: weiterleitungsKoepfe({
          geheimnis: context?.env?.MM_FORMULAR_WEITERLEITUNG,
          // Der Adapter (server.node.mjs kaeuferIpStellen) setzt
          // oxygen-buyer-ip aus dem letzten X-Forwarded-For; ist er aus
          // (CRYSTAL_BUYER_IP=off), dieselbe Quelle direkt.
          xff:
            request.headers.get('oxygen-buyer-ip') ||
            request.headers.get('X-Forwarded-For'),
          ua: request.headers.get('User-Agent'),
        }),
        body: JSON.stringify(koerper),
        // Ohne Deckel haengt eine Kundenanfrage an einem anderen Dienst.
        // KEIN automatischer Zweitversuch: ohne anmelde_id waere er eine
        // zweite Anmeldung; der Kunde bekommt die Stoerungsseite mit Feld.
        signal: AbortSignal.timeout(15000),
      },
    );
    const json = await antwort.json().catch(() => null);
    stand = standAus(antwort.status, json);
    console.log(
      '[kurs-eintragung] mm_http=%s formular=%s stand=%s%s',
      antwort.status,
      FORMULAR_ID,
      stand,
      json && json.fehler ? ` mm_fehler=${String(json.fehler).slice(0, 40)}` : '',
    );
  } catch (fehler) {
    console.log('[kurs-eintragung] mm_nicht_erreicht=%s', fehler?.name || 'unbekannt');
    return ziel(STAND.stoerung);
  }

  return ziel(stand);
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

  if (stand === STAND.gesperrt) {
    return (
      <Rahmen>
        <h1>Diese Adresse ist bei uns gesperrt</h1>
        <p>
          Das passiert zum Beispiel nach einer Abmeldung. Möchtest du den Kurs
          doch bekommen, schreib uns an{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>.
        </p>
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
