import {useEffect, useRef, useState} from 'react';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * ÄNDERUNG 2026-09-11 (Job 20260911-BAU-videoumschaltung-seite-bricht-beim-
 * play-klick-zusammen, Christian): ÜBERBLENDEN STATT ELEMENT-TAUSCH.
 *
 * Christian: „wenn man auf Play drückt, verschwindet zuerst alles Sichtbare,
 * dann kommt was Schwarzes, und dann wird das Video geladen."
 *
 * Der Defekt stand hier in derselben Form wie im DACH-Laden: ein Ternär
 * (`{laeuft ? <iframe/> : <button><img/></button>}`) hat die Vorschau
 * ausgehängt und im selben Bildaufbau einen leeren Rahmen eingehängt.
 * GEMESSEN VOR DEM UMBAU (bin/mess_videoumschaltung.py, live, 2026-09-11):
 * crystal-cacao.com, vorschau_sichtbar_ms = 0, schwarz 195 ms.
 *
 * Jetzt bleibt die Vorschau als unterste Schicht liegen und der Player wird
 * darüber eingeblendet, sobald er MELDET, dass er spielt. Bauform und
 * Fristen sind dieselben wie in
 * homepage-bauer/werkbank/qiblanco-storefront/app/components/reusables/
 * YoutubeTimestamp.jsx — bewusst dieselben, damit beide Läden dasselbe tun.
 *
 * WARUM DER MELDER HIER EIGENS STEHT (und das keine Doppelung nach P10 ist):
 * im DACH-Laden wird die Auskunft aus der bestehenden Watchtime-Erfassung
 * durchgereicht (app/lib/video-watchtime.js). Dieser Laden hat KEINE
 * Watchtime-Erfassung — es gibt hier nichts, woran man sich hängen könnte.
 * Gebaut ist deshalb das kleinstmögliche Stück: ein Handschlag, ein
 * `message`-Empfänger, ein Zustand. Kein zweites Skript, kein zusätzlicher
 * Abruf; die YouTube-IFrame-API spricht über `postMessage` mit dem Player,
 * der ohnehin geladen wird.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* Wie lange nach `onLoad` noch auf die Auskunft gewartet wird. `onLoad` sagt
 * nur, dass das Player-DOKUMENT da ist — nicht, dass Bild da ist. */
const GNADENFRIST_MS = 900;
/* Die Frist, die nicht ausfallen kann. Bliebe die Vorschau liegen, weil die
 * Auskunft nie kommt, stünde ein Standbild über einem laufenden Video — das
 * wäre schlimmer als der Fehler, der hier behoben wird. */
const HARTE_FRIST_MS = 4000;
const ZUSTAND_ABSPIELEND = 1;

/**
 * Fragt den YouTube-Player, wann er wirklich spielt.
 *
 * @param {HTMLIFrameElement} iframe  das eingebettete iframe (mit enablejsapi=1)
 * @param {() => void} beiSpielt      genau einmal gerufen, wenn er spielt
 * @returns {() => void} Abmelder
 */
function spielMelderAnbinden(iframe, beiSpielt) {
  if (typeof window === 'undefined' || !iframe) return () => {};
  let gemeldet = false;
  let versuche = 0;
  let takt = 0;

  const aufNachricht = (ev) => {
    /* Nur der eigene Player zählt: auf der Seite können weitere fremde
     * Fenster sprechen, und ein `message` ohne Absenderprüfung ist eine
     * offene Tür. */
    if (!iframe.contentWindow || ev.source !== iframe.contentWindow) return;
    let d;
    try {
      d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    } catch {
      return;
    }
    if (!d || typeof d !== 'object') return;
    const info = d.info && typeof d.info === 'object' ? d.info : null;
    const zustand =
      d.event === 'onStateChange'
        ? typeof d.info === 'number'
          ? d.info
          : info && info.playerState
        : info && info.playerState;
    if (zustand === ZUSTAND_ABSPIELEND && !gemeldet) {
      gemeldet = true;
      beiSpielt();
    }
  };

  /* Der Player antwortet erst, wenn er zuhört — also ein paar Mal anklopfen
   * und dann nicht mehr. Kein Dauer-Timer. */
  const anklopfen = () => {
    versuche += 1;
    try {
      const f = iframe.contentWindow;
      if (f) {
        const gruss = JSON.stringify({event: 'listening', id: 1, channel: 'widget'});
        f.postMessage(gruss, 'https://www.youtube.com');
        f.postMessage(gruss, 'https://www.youtube-nocookie.com');
      }
    } catch {
      /* fremdes Fenster noch nicht bereit — beim nächsten Versuch wieder */
    }
    if (gemeldet || versuche >= 8) {
      window.clearInterval(takt);
      takt = 0;
    }
  };

  window.addEventListener('message', aufNachricht);
  anklopfen();
  takt = window.setInterval(anklopfen, 700);
  return () => {
    window.removeEventListener('message', aufNachricht);
    if (takt) window.clearInterval(takt);
  };
}

/**
 * PodcastEinstieg — das Vorschaubild-mit-Einstiegsstelle fuer die Startseite.
 *
 * Christian, 2026-09-08: „Und der Podcast muss auf die Seite — dort erklaeren
 * wir den Kakao. Das muss ziemlich weit oben auf der Frontseite integriert
 * werden, mit einem coolen kleinen Text dazu, und an einer interessanten
 * Stelle ein Timeslot gesetzt werden. Eventuell dort, wo wir den Unterschied
 * zwischen den Sorten erklaeren. Soll ja nur ein kleiner Einstieg sein — wer
 * mehr wissen will, kann es dann ganz abspielen."
 *
 * ======================================================================
 * P10 — DAS IST EINE PORTIERUNG, KEIN NEUBAU.
 * ======================================================================
 * Vorlage: qiblanco-storefront `app/components/reusables/YoutubeTimestamp.jsx`
 * (Job 20260718-lp-gesamt-relaunch; Skill-Doc homepage-bauer/
 * SKILL-VIDEO-LADESTRATEGIE.md). Dort ist das Muster „Vorschaubild,
 * Klick-zu-Play, Start ab Zeitstempel" seit Wochen live. Uebernommen sind:
 * die Fassaden-Bauweise, die Poster-Kette maxres -> sd -> hq mit
 * onError-Abstieg (GL-DES-0009), der youtube-nocookie-Ursprung und der
 * <noscript>-Ausweg.
 *
 * WAS BEWUSST NICHT MITKAM, jeweils mit Grund:
 *   - `~/lib/video-watchtime` (enablejsapi + Meta-Medien-Erfassung). Diese
 *     Bibliothek existiert in DIESEM Repo nicht. Sie mitzuschleppen hiesse,
 *     eine Tracking-Anbindung zu bauen, die niemand beauftragt hat — und sie
 *     an einer Flaeche einzufuehren, die gerade wegen Einwilligung und
 *     Ladezeit unter Beobachtung steht.
 *   - `vorwaermen` (preconnect auf das Absichtssignal). In der Vorlage steht
 *     der Schalter auf `false`, weil er fuer kreuz-seitige iframes GEMESSEN
 *     wirkungslos ist (Chrome partitioniert Verbindungen nach
 *     NetworkAnonymizationKey). Toten Code zu portieren waere P10 verletzt.
 *   - `className`/`playClassName` (LiteYt-Erbe der Campaign-LPs). Hier gibt
 *     es genau EINEN Einsatzort und eine Token-Schicht; ein zweiter
 *     Stil-Pfad waere die naechste Stelle, die auseinanderlaeuft.
 *
 * ======================================================================
 * LADEZEIT — WARUM EINE FASSADE UND KEIN <iframe>
 * ======================================================================
 * Ein eingebetteter Player laedt beim Seitenaufbau fremde Skripte, und zwar
 * weit oben auf der meistbesuchten Seite. Gemessen VOR diesem Bau
 * (claude-jobs/20260908-BAU-crystal-cacao-podcast-.../mess/ladezeit-vorher.json):
 * 54 Ressourcen, 4,83 MB, load 228 ms, 27 Anfragen an fremde Hosts — alle an
 * cdn.shopify.com, activehosted und monorail. NULL an YouTube.
 *
 * Diese Komponente laedt vor dem Klick GENAU EINE zusaetzliche Anfrage: das
 * Vorschaubild von i.ytimg.com, `loading="lazy"`, also erst wenn es in die
 * Naehe des Sichtfensters kommt. Kein Player, kein Skript, kein Autoplay
 * (WCAG 1.4.2). Der Player entsteht erst im Klick-Handler.
 *
 * ======================================================================
 * EINWILLIGUNG — DIE VORHANDENE REGEL, NICHT EINE NEUE
 * ======================================================================
 * Das Haus hat dafuer eine Loesung, und sie heisst hier Fassade: vor der
 * Handlung des Besuchers wird KEIN Einbettungs-Ursprung kontaktiert, der
 * Kennungen setzt. Beim Klick laedt der Player von
 * `www.youtube-nocookie.com` — derselbe Ursprung, den die Vorlage benutzt.
 * `app/lib/consent-policy.js` (Cookiebot, fail-closed, EWR/UK-Floor) bleibt
 * unberuehrt: diese Komponente fuegt ihr weder eine Kategorie noch eine
 * Ausnahme hinzu und fragt sie auch nicht ab — sie hat vor dem Klick nichts
 * zu fragen.
 *
 * OFFEN UND GEMELDET, NICHT ENTSCHIEDEN (der Auftrag sagt woertlich: „melden,
 * nicht entscheiden — es faehrt keine Rechtspruefung ohne Christians
 * ausdruecklichen Auftrag"): das Vorschaubild kommt von i.ytimg.com, also von
 * einem fremden Host. Es setzt keine Kennung und laedt kein Skript, aber es
 * ist eine Verbindung zu Google, bevor der Besucher etwas anklickt — genau
 * so, wie es die Vorlage auf qiblanco.com seit Wochen tut. Ob das der
 * Einwilligung bedarf, ist eine Bewertungsfrage und steht im RESULT.
 * DER RUECKWEG DAFUER IST SCHON GEBAUT: `posterUrl` nimmt jede eigene
 * Bild-URL entgegen (z.B. von cdn.shopify.com) und schaltet die
 * YouTube-Poster-Kette komplett ab — eine Zeile, kein Umbau.
 *
 * @param {{
 *   videoId: string,
 *   startSekunde?: number,
 *   titel: string,
 *   posterUrl?: string,
 *   dauerWort?: string,
 * }} props
 */

/* Poster-Kette: [Datei, Breite, Hoehe]. hqdefault existiert immer, deshalb
 * ist der Abstieg endlich und idempotent. hqdefault ist 4:3 — object-fit:
 * cover verhindert die Balkenraender. */
const POSTER_STUFEN = [
  ['maxresdefault', 1280, 720],
  ['sddefault', 640, 480],
  ['hqdefault', 480, 360],
];

export function PodcastEinstieg({
  videoId,
  startSekunde = 0,
  titel,
  posterUrl,
  dauerWort = '',
  children,
}) {
  const [laeuft, setLaeuft] = useState(false);
  /* `zeigt` ist NICHT „der Player existiert", sondern „der Player hat Bild".
   * Der Unterschied zwischen beidem ist genau das Schwarz, um das es geht. */
  const [zeigt, setZeigt] = useState(false);
  const rahmen = useRef(null);
  const [stufe, setStufe] = useState(0);

  useEffect(() => {
    if (!laeuft || !rahmen.current) return undefined;
    return spielMelderAnbinden(rahmen.current, () => setZeigt(true));
  }, [laeuft]);

  /* Die Frist, die nicht ausfallen kann — unabhängig von jeder Auskunft. */
  useEffect(() => {
    if (!laeuft || zeigt) return undefined;
    const t = setTimeout(() => setZeigt(true), HARTE_FRIST_MS);
    return () => clearTimeout(t);
  }, [laeuft, zeigt]);
  const start = Math.max(0, Math.floor(startSekunde || 0));
  const [datei, breite, hoehe] = POSTER_STUFEN[stufe];

  /* Der Weg zur ganzen Folge. Er zeigt bewusst auf DIESELBE Sekunde: wer
   * hier weiterklickt, soll dort weitermachen, wo er aufgehoert hat, nicht
   * am Anfang neu beginnen. Ohne Skript ist genau dieser Link der Ersatz
   * fuer den Knopf (siehe <noscript> unten). */
  const ganzeFolge = folgeUrl(videoId, start);

  const poster = posterUrl
    ? {src: posterUrl, width: 1280, height: 720}
    : {
        src: `https://i.ytimg.com/vi/${videoId}/${datei}.jpg`,
        srcSet: POSTER_STUFEN.slice(stufe)
          .map(([d, b]) => `https://i.ytimg.com/vi/${videoId}/${d}.jpg ${b}w`)
          .join(', '),
        sizes: '(min-width: 48em) 46vw, 92vw',
        width: breite,
        height: hoehe,
        onError: () => setStufe((s) => Math.min(s + 1, POSTER_STUFEN.length - 1)),
      };

  return (
    <section className="cc-podcast NormalSectionSize" aria-labelledby="cc-podcast-titel">
      <div className="cc-podcast__raster">
        <div
          className="cc-podcast__buehne"
          data-qb-video-zustand={laeuft ? (zeigt ? 'spielt' : 'laedt') : 'vorschau'}
        >
          {/* SCHICHT 1 — die Vorschau. Sie wird NIE entfernt. Sie liegt auch
              während des Ladens und danach unter dem Player: puffert er
              später nach, fällt er auf ein Bild zurück statt auf Schwarz.
              Sie kostet nichts, sie ist längst geladen. */}
          <img
            {...poster}
            className="cc-podcast__fuellung"
            alt=""
            loading="lazy"
            aria-hidden={laeuft ? 'true' : undefined}
          />

          {/* SCHICHT 2 — der Player. Erst ab dem Klick im Dokument (die
              schlanke Ladeweise bleibt), sichtbar erst wenn er Bild hat. */}
          {laeuft ? (
            <iframe
              ref={rahmen}
              className="cc-podcast__fuellung"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${start}&autoplay=1&enablejsapi=1`}
              title={titel}
              style={{opacity: zeigt ? 1 : 0, transition: 'opacity 240ms ease-out'}}
              onLoad={() => setTimeout(() => setZeigt(true), GNADENFRIST_MS)}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {/* SCHICHT 3 — die Bedienung. Vor dem Klick der Knopf mit dem
              Play-Zeichen; während des Ladens bleibt an derselben Stelle ein
              Ladezeichen stehen: „wer klickt und eine Sekunde nichts sieht,
              klickt nochmal" (Christian). Der Knopf selbst ist dann weg, er
              läge sonst über dem Player und finge dessen Klicks ab. */}
          {laeuft ? null : (
            <button
              type="button"
              className="cc-podcast__knopf"
              onClick={() => setLaeuft(true)}
              aria-label={`Podcast ab Minute ${minuteWort(start)} abspielen: ${titel}`}
            >
              <span className="cc-podcast__play" aria-hidden="true">
                <span className="cc-podcast__play-scheibe">▶</span>
              </span>
              <span className="cc-podcast__marke" aria-hidden="true">
                ab {minuteWort(start)}
              </span>
            </button>
          )}
          {laeuft && !zeigt ? (
            <span className="cc-podcast__play" aria-hidden="true">
              <span className="cc-podcast__play-scheibe">
                <span className="cc-video-spinner" />
              </span>
            </span>
          ) : null}
          {/*
            OHNE AKTIVES SKRIPT passiert bei einem <button> nichts. Das ist
            eine echte Schwaeche der Fassade gegenueber einem festen <iframe>,
            und sie wird hier geschlossen statt verschwiegen: das Vorschaubild
            steht ohnehin serverseitig da, und <noscript> traegt einen echten
            Link auf die Folge — inklusive Startsekunde. Ohne Skript fuehrt der
            Klick also zum Video, nur auf YouTube statt eingebettet.
            Als GESCHWISTER und nicht im Knopf, weil ein <a> nicht in einem
            <button> stehen darf.
          */}
          <noscript>
            <a className="cc-podcast__ohne-skript" href={ganzeFolge}>
              Folge ab {minuteWort(start)} auf YouTube ansehen
            </a>
          </noscript>
        </div>

        <div className="cc-podcast__text">
          {children}
          {/*
            „Wer mehr wissen will, kann es dann ganz abspielen" (Christian).
            Der Weg dorthin steht HIER und nicht im Aufrufer, damit er nicht
            vergessen werden kann: ein Einstieg ohne Ausgang ist eine
            Sackgasse, und die Zusage „nur ein kleiner Einstieg" haengt daran.
            `rel="noopener"` weil `target="_blank"`; der Besucher soll unsere
            Seite nicht verlieren, wenn er die Folge ganz sehen will.
          */}
          <a
            className="cc-podcast__ganze"
            href={ganzeFolge}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ganze Folge ansehen{dauerWort ? ` (${dauerWort})` : ''}
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Sekunden -> „8:30". Steht hier und nicht im Aufrufer, damit die Zahl im
 * Knopf-Label, in der Bildmarke und im Ohne-Skript-Link aus DERSELBEN Quelle
 * kommt wie der `start`-Parameter des Players. Drei Stellen, die dieselbe
 * Zahl von Hand fuehren, laufen auseinander — und die falsche gewinnt still.
 */
export function minuteWort(sekunden) {
  const s = Math.max(0, Math.floor(sekunden || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Die Adresse der ganzen Folge, mit Startsekunde. Eigene Funktion, weil sie
 * an ZWEI Stellen gebraucht wird (sichtbarer Verweis und Ohne-Skript-Ausweg)
 * — zwei handgefuehrte Kopien derselben URL laufen auseinander, und der
 * Ohne-Skript-Zweig ist genau der, den niemand nachschaut.
 */
export function folgeUrl(videoId, startSekunde) {
  const s = Math.max(0, Math.floor(startSekunde || 0));
  return (
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` +
    (s > 0 ? `&t=${s}s` : '')
  );
}
