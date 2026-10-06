import {useEffect, useId, useRef, useState} from 'react';
import anmeldeStyles from './anmeldeformular.css?url';

/*
 * ANMELDEWEICHE — eigenes Anmeldeformular statt ActiveCampaign, je Formular
 * zur Laufzeit umschaltbar (Stufe E1 der AC-Ablösung, Großjob
 * 20260926-GROSSJOB-activecampaign-abloesen-bis-28-november-stufenplan-alarm,
 * Segment s11).
 *
 * WER ENTSCHEIDET: der eigene Anmelde-Endpunkt (Modul ac-eingang auf dem
 * Server) meldet unter GET /w je AC-Formular-id 'ac' oder 'eigen'. Umgeschaltet
 * wird dort mit EINEM Kommando (`ac-eingang schalte <id> eigen`), ohne Deploy.
 *
 * WAS BEI EINEM FEHLER PASSIERT — bewusst immer das heutige Verhalten:
 *  - /w antwortet nicht, nicht rechtzeitig oder kennt das Formular nicht
 *    -> das AC-Formular wie bisher.
 *  - die Anmeldung scheitert (5xx, 429, Netz) und /w meldet rueckfall_ac
 *    -> das AC-Formular mit einem Satz darüber. rueckfall_ac stellt der
 *    Server mit der AC-Abschaltung ab (Segment s08); danach steht hier ein
 *    Hinweis statt eines toten AC-Formulars.
 *
 * DER EINWILLIGUNGSSATZ KOMMT AUS /w und steht nirgends in diesem Repo. Er ist
 * Teil des Nachweises im Kontakt-Tresor; eine Kopie hier liefe beim nächsten
 * Textwechsel still auseinander, und der Mensch hätte einem anderen Satz
 * zugestimmt als dem, den der Nachweis nennt.
 *
 * DAS ZEITFELD t IST PFLICHT: der Endpunkt verwirft eine Anmeldung STILL (202,
 * nichts gespeichert), wenn t fehlt, älter als 24 h ist oder weniger als 1,5 s
 * vor dem Absenden liegt (Automaten-Falle). t wird deshalb beim Anzeigen im
 * Browser gesetzt (useEffect), nie beim Serverrendern — eine gecachte Seite
 * trüge sonst einen alten Wert. Wer schneller absendet, wartet den Rest der
 * 1,6 s ab, statt still verworfen zu werden.
 * t STEHT IN SERVERZEIT, nicht in der Uhr des Besuchers: der Server rechnet
 * seine Uhr gegen t. Eine 30 s vorgehende Kundenuhr ergab sonst `zu_schnell`
 * und eine stille Danke-Meldung ohne Anmeldung (K3-Prüfung 06.10.2026, B3).
 * Der Versatz kommt aus `stand` von /w. Er ist durch Cache (≤ 60 s), Laufzeit
 * und Sekundenrundung immer zu klein, t also höchstens zu ALT — die sichere
 * Richtung, weil nur ein zu junges t (oder eines über 24 h) verworfen wird.
 *
 * DIE KENNUNG DES GEZEIGTEN SATZES GEHT MIT (einwilligung_id). Ändert sich der
 * Satz, während ein Tab offen steht, antwortet der Endpunkt 409; das Formular
 * holt den neuen Satz und bittet um einen zweiten Klick (K3-Prüfung, B2).
 *
 * VORSCHAU OHNE UMSCHALTEN (Probe, Design-Beleg): localStorage
 * 'qb-anmeldung-vorschau' = 'eigen' (alle) oder '15,21' (diese) zeigt das
 * eigene Formular nur in DIESEM Browser. Bewusst kein URL-Parameter: ein
 * geteilter Link schaltete sonst fremde Besucher um.
 */

// STELLE 1 VON 2 — die zweite ist connect-src in app/entry.server.jsx. Fehlt
// sie dort, blockt die CSP STILL und jede Seite bleibt beim AC-Formular.
export const ANMELDE_ENDPUNKT = 'https://anmelden.65-108-150-121.sslip.io';

const WEICHE_ZEITLIMIT_MS = 2500;
const WEICHE_GUELTIG_MS = 5 * 60 * 1000;
const MIN_ANZEIGE_MS = 1600;
const MAX_ANZEIGE_MS = 23 * 3600 * 1000;
const VORSCHAU_SCHLUESSEL = 'qb-anmeldung-vorschau';

let wegeAnfrage = null;
let wegeGeholt = 0;

function wegeGueltig(wege) {
  return Boolean(
    wege &&
      wege.formulare &&
      typeof wege.formulare === 'object' &&
      wege.anzeige &&
      typeof wege.anzeige === 'object',
  );
}

function anzeigeVollstaendig(anzeige) {
  return Boolean(
    anzeige &&
      typeof anzeige.einwilligung === 'string' &&
      anzeige.einwilligung.trim() &&
      typeof anzeige.knopf === 'string' &&
      anzeige.knopf.trim() &&
      anzeige.einwilligung_id,
  );
}

// Versatz Serveruhr minus Besucheruhr in ms (0, wenn /w keinen Stand trägt).
function uhrVersatz(wege) {
  const server = Date.parse(wege && wege.stand);
  return Number.isFinite(server) ? server - Date.now() : 0;
}

function holeWege({frisch = false} = {}) {
  if (!frisch && wegeAnfrage && Date.now() - wegeGeholt < WEICHE_GUELTIG_MS) {
    return wegeAnfrage;
  }
  wegeGeholt = Date.now();
  wegeAnfrage = (async () => {
    const abbruch =
      typeof AbortController === 'undefined' ? null : new AbortController();
    const uhr = setTimeout(() => abbruch && abbruch.abort(), WEICHE_ZEITLIMIT_MS);
    try {
      const antwort = await fetch(`${ANMELDE_ENDPUNKT}/w`, {
        credentials: 'omit',
        cache: frisch ? 'no-cache' : 'default',
        signal: abbruch ? abbruch.signal : undefined,
      });
      if (!antwort.ok) return null;
      const wege = await antwort.json();
      if (!wegeGueltig(wege)) return null;
      return {...wege, versatz: uhrVersatz(wege)};
    } catch {
      return null;
    } finally {
      clearTimeout(uhr);
    }
  })();
  // Ein Fehlschlag wird nicht für die ganze Sitzung gemerkt.
  wegeAnfrage.then((wege) => {
    if (!wege) wegeAnfrage = null;
  });
  return wegeAnfrage;
}

function vorschauEigen(formId) {
  try {
    const wert = window.localStorage.getItem(VORSCHAU_SCHLUESSEL);
    if (!wert) return false;
    if (wert === 'eigen') return true;
    return wert
      .split(',')
      .map((teil) => teil.trim())
      .includes(String(formId));
  } catch {
    return false;
  }
}

/**
 * @param {{formId: string, ac: import('react').ReactNode, dunkel?: boolean}} props
 *   ac      das bisherige AC-Formular (Weg 'ac' und Rückfall)
 *   dunkel  heller Text auf dunklem Grund (Fußzeile)
 */
export function AnmeldeWeiche({formId, ac, dunkel = false}) {
  const [lage, setLage] = useState({weg: 'offen'});

  useEffect(() => {
    let aktiv = true;
    holeWege()
      .then((wege) => {
        if (!aktiv) return;
        const id = String(formId);
        const anzeige = wege ? wege.anzeige[id] : null;
        const eigen =
          anzeigeVollstaendig(anzeige) &&
          (wege.formulare[id] === 'eigen' || vorschauEigen(id));
        setLage(
          eigen
            ? {
                weg: 'eigen',
                anzeige,
                versatz: wege.versatz,
                rueckfallAc: wege.rueckfall_ac !== false,
              }
            : {weg: 'ac'},
        );
      })
      .catch(() => {
        // Jeder unerwartete Fehler endet beim AC-Formular, nie im Platzhalter.
        if (aktiv) setLage({weg: 'ac'});
      });
    return () => {
      aktiv = false;
    };
  }, [formId]);

  return (
    <>
      {/* Immer mitgerendert (auch auf dem AC-Weg), damit das eigene Formular
          nicht ungestaltet aufblitzt, wenn es nach /w erscheint. */}
      <link rel="stylesheet" href={anmeldeStyles} />
      {lage.weg === 'offen' ? (
        <div className="qb-anmelden-platz" data-anmeldeweg="offen" />
      ) : null}
      {lage.weg === 'ac' ? ac : null}
      {lage.weg === 'eigen' ? (
        <EigenesFormular
          formId={String(formId)}
          anzeige={lage.anzeige}
          versatz={lage.versatz}
          rueckfallAc={lage.rueckfallAc}
          ac={ac}
          dunkel={dunkel}
        />
      ) : null}
    </>
  );
}

function EigenesFormular({formId, anzeige: ersteAnzeige, versatz: ersterVersatz, rueckfallAc, ac, dunkel}) {
  const kennung = useId();
  const angezeigt = useRef(0);
  const [anzeige, setAnzeige] = useState(ersteAnzeige);
  const versatz = useRef(ersterVersatz || 0);
  const [stand, setStand] = useState('bereit');
  const [meldung, setMeldung] = useState('');
  const deutsch = anzeige.sprache !== 'en';

  useEffect(() => {
    angezeigt.current = Date.now();
  }, []);

  async function absenden(ereignis) {
    ereignis.preventDefault();
    if (stand === 'sendet') return;
    const daten = new FormData(ereignis.currentTarget);
    // Anzeigezeit in Besucheruhr: nur für Abstände (Wartezeit, 23 h).
    if (!angezeigt.current || Date.now() - angezeigt.current > MAX_ANZEIGE_MS) {
      angezeigt.current = Date.now();
    }
    // Was der Server bekommt: dieselbe Anzeigezeit in Serverzeit.
    const t = Math.round(angezeigt.current + versatz.current);
    setStand('sendet');
    setMeldung('');
    const rest = MIN_ANZEIGE_MS - (Date.now() - angezeigt.current);
    if (rest > 0) await new Promise((fertig) => setTimeout(fertig, rest));

    let status = 0;
    let antwort = null;
    try {
      const r = await fetch(
        `${ANMELDE_ENDPUNKT}/f/${encodeURIComponent(formId)}`,
        {
          method: 'POST',
          credentials: 'omit',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify({
            vorname: String(daten.get('vorname') || ''),
            email: String(daten.get('email') || ''),
            website: String(daten.get('website') || ''),
            t: String(t),
            einwilligung_id: String(anzeige.einwilligung_id),
            seite: window.location.pathname,
          }),
        },
      );
      status = r.status;
      antwort = await r.json().catch(() => null);
    } catch {
      status = 0;
    }

    if (status === 202 && antwort && antwort.ok) {
      setStand('fertig');
      setMeldung(
        antwort.text ||
          (deutsch
            ? 'Wir haben dir gerade eine Mail geschickt. Bestätige darin deine Anmeldung.'
            : "We've just sent you an email. Confirm your subscription there."),
      );
      return;
    }
    if (status === 409) {
      // Der Satz hat sich geändert, seit das Formular erschien: neuen Satz
      // holen und zeigen, der Mensch bestätigt den Satz, den er jetzt sieht.
      const wege = await holeWege({frisch: true}).catch(() => null);
      const neu = wege ? wege.anzeige[formId] : null;
      if (anzeigeVollstaendig(neu)) {
        versatz.current = wege.versatz;
        setAnzeige(neu);
        setStand('bereit');
        setMeldung(
          deutsch
            ? 'Der Text über dem Knopf hat sich gerade geändert. Bitte lies ihn und klick noch einmal.'
            : 'The text above the button has just changed. Please read it and click again.',
        );
        return;
      }
    }
    if (status === 400) {
      setStand('bereit');
      setMeldung(
        deutsch
          ? 'Bitte prüf deine E-Mail-Adresse.'
          : 'Please check your email address.',
      );
      return;
    }
    if (rueckfallAc) {
      setStand('rueckfall');
      return;
    }
    setStand('bereit');
    setMeldung(
      deutsch
        ? 'Bitte versuche es in ein paar Minuten noch einmal.'
        : 'Please try again in a few minutes.',
    );
  }

  const klasse = `qb-anmelden${dunkel ? ' qb-anmelden--dunkel' : ''}`;

  if (stand === 'rueckfall') {
    return (
      <div className={klasse} data-anmeldeweg="rueckfall" data-formular={formId}>
        <p className="qb-anmelden__meldung" role="status">
          {deutsch
            ? 'Bitte trag dich hier noch einmal ein.'
            : 'Please sign up here once more.'}
        </p>
        {ac}
      </div>
    );
  }

  if (stand === 'fertig') {
    return (
      <div className={klasse} data-anmeldeweg="eigen" data-formular={formId}>
        <p className="qb-anmelden__danke" role="status">
          {meldung}
        </p>
      </div>
    );
  }

  return (
    <form
      className={klasse}
      onSubmit={absenden}
      data-anmeldeweg="eigen"
      data-formular={formId}
      data-einwilligung={anzeige.einwilligung_id}
    >
      <div className="qb-anmelden__felder">
        <label className="qb-anmelden__unsichtbar" htmlFor={`${kennung}-vorname`}>
          {anzeige.vorname_feld}
        </label>
        <input
          id={`${kennung}-vorname`}
          className="qb-anmelden__feld"
          name="vorname"
          type="text"
          autoComplete="given-name"
          placeholder={anzeige.vorname_feld}
          maxLength={80}
          required
        />
        <label className="qb-anmelden__unsichtbar" htmlFor={`${kennung}-email`}>
          {deutsch ? 'E-Mail-Adresse' : 'Email address'}
        </label>
        <input
          id={`${kennung}-email`}
          className="qb-anmelden__feld"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={deutsch ? 'E-Mail-Adresse' : 'Email address'}
          maxLength={254}
          required
        />
      </div>
      {/* Falle für Automaten: ein Mensch sieht und füllt dieses Feld nie. */}
      {/* Neutrales Label und die Ignorier-Merkmale der verbreiteten
          Passwortmanager (1Password, LastPass, Bitwarden, Dashlane): ein
          automatisch befülltes Feld hieße eine stille Danke-Meldung ohne
          Anmeldung (K3-Prüfung, B5). */}
      <div className="qb-anmelden__falle" aria-hidden="true">
        <label htmlFor={`${kennung}-website`}>Bitte leer lassen</label>
        <input
          id={`${kennung}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="new-password"
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
      </div>
      <p className="qb-anmelden__einwilligung" id={`${kennung}-einwilligung`}>
        {anzeige.einwilligung}
      </p>
      <button
        type="submit"
        className="qb-anmelden__knopf"
        aria-describedby={`${kennung}-einwilligung`}
        disabled={stand === 'sendet'}
      >
        {anzeige.knopf}
      </button>
      {meldung ? (
        <p className="qb-anmelden__meldung" role="alert">
          {meldung}
        </p>
      ) : null}
    </form>
  );
}
