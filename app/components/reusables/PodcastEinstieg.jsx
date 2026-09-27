import {useEffect, useRef, useState} from 'react';

import {bildQuellen} from './shopifyBildQuellen';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * ÄNDERUNG 2026-09-26 (Job 20260926-GROSSJOB-crystal-cacao-seitendurchgang-
 * videos-pruefdokumente-texte-gruenderbild, Christian): EIGENES STANDBILD,
 * VORSTUFE, KEINE ANFRAGE AN YOUTUBE VOR DEM KLICK.
 *
 * Christian: „da wird noch ein goldenes Ladebild angezeigt, bin mir sicher,
 * dass es hier schon einen neuen Standard gibt."
 *
 * GEMESSEN VOR DEM UMBAU (Headless-Chromium, Browser stumm, 2026-09-26):
 * das Vorschaubild kam von i.ytimg.com (sddefault bzw. hqdefault), also eine
 * Anfrage an YouTube vor jedem Klick. Mit gesperrtem YouTube — Tracking-
 * Schutz, Erweiterung, Firmennetz — blieb vom Kasten nur die leere Bühne mit
 * dem goldenen Abspielknopf: naturalWidth 0, ein kaputtes Bildsymbol oben
 * links. Und das Motiv war das Kanal-Vorschaubild, eine Werbegrafik mit
 * Goldrahmen, keine Szene aus der Folge.
 *
 * DER STANDARD, DEN ES GIBT, UND WAS HIER DAVON ANKOMMT:
 *   1. Die Vorstufe (qiblanco-storefront YoutubeTimestamp.jsx, #498 vom
 *      2026-09-18, „erst unscharf, dann scharf"): ein 24x14-WebP als
 *      data-URI, vollflächig, als unterste Schicht. Sie steht im HTML und ist
 *      ohne Anfrage und ohne Skript mit dem ersten Bildaufbau da. Erzeugt mit
 *      denselben Vorgaben wie homepage-bauer/ladeverhalten/bin/
 *      lqip_erzeuge.py (24x14, WebP q65, auf 16:9 beschnitten) — 328 B.
 *   2. Das eigene Standbild (`thumbnail` im DACH-Baustein): es ersetzt die
 *      YouTube-Posterkette ganz. Im DACH-Laden schaltet ein eigenes
 *      Standbild die Vorstufe ab; hier gehören beide zusammen, weil beide
 *      aus derselben Datei stammen.
 *   3. Überblenden, Zeitmarke, Ladezeichen und der <noscript>-Ausweg bleiben
 *      unverändert (Umbau vom 2026-09-11, unten).
 *
 * DAS STANDBILD IST EINE SZENE AUS DER FOLGE, KEINE GRAFIK: YouTubes eigenes
 * Standbild 1 dieser Folge (maxres1.jpg, 1280x720, rund ein Viertel der
 * Laufzeit, also kurz vor der Einstiegsstelle 8:30) — Christian und Anna mit
 * ihren Tassen und der Create-Tüte. Es liegt jetzt in UNSEREN Shopify-Dateien
 * (gid://shopify/MediaImage/77272116756748) und kommt über cdn.shopify.com,
 * wie jedes andere Bild dieses Ladens. Das CDN verhandelt WebP selbst
 * (gemessen: &width=640 -> 74 250 B image/webp) — dafür braucht es den
 * Breitenparameter, den `bildQuellen` setzt.
 *
 * FEHLT FÜR EIN VIDEO DAS STANDBILD, GIBT ES KEINE BÜHNE — und das ist
 * Absicht: lieber der Text mit dem Link zur ganzen Folge als ein Kasten, der
 * wieder auf YouTube angewiesen wäre oder einfarbig dasteht.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Die eigenen Standbilder, je YouTube-Kennung.
 *
 * `breite`/`hoehe` sind die Maße der Masterdatei, gemessen am Kopf der
 * ausgelieferten Datei (nicht an naturalWidth — SKILL-VIDEO-LADESTRATEGIE.md
 * 4.2). `vorstufe` ist aus GENAU DIESER Datei erzeugt, sonst sähe man beim
 * Scharfwerden ein anderes Bild einrasten.
 */
const EIGENE_STANDBILDER = {
  'kd7Z-ITKYDo': {
    url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/crystal-cacao-podcast-standbild-vier-dinge-kakao-1280x720.jpg?v=1790452169',
    breite: 1280,
    hoehe: 720,
    vorstufe:
      'data:image/webp;base64,UklGRu4AAABXRUJQVlA4IOIAAAAQBQCdASoYAA4APqlCnEkmI6KhMAgAwBUJZgCdMoHggFP0MvVbNZdfuD6kbt5i2dQAAP7zr84iE70awP5ZUjXyZPRDL5e+FwL2KrtB57a9a9aAyQZRN/lJ6ZE7D7NHHPK7dN5lhhRFLXtkb8GFdNI/8yyKAHmoc0Nu3H6PNa47itpAfvBGGJ4Djm35YPjaje7QdvbaKYnTmRMQ5fLmlauNGfdUYwQVyRC7Qx1ERQXtPWb8Bw5GJ5UaEk+T5WdPyEWP3u5/hmY60G0kMcX9zzkhybbS3ZYGRFvJfGTmV1OTKgAA',
  },
};

/*
 * DIE BREITEN-LEITER DES STANDBILDS, an der gerenderten Bühne GEMESSEN und
 * nicht geschätzt (Vorschau-Bau, 2026-09-26): 256 px bei 320, 326 bei 390,
 * 703 bei 767 (eine Spalte, 32 px Rand je Seite); ab 48em zwei Spalten mit
 * 328 px bei 768, 456 bei 1024 und höchstens 536 px ab 1184 (die Startseite
 * begrenzt auf 72rem). `sizes` sagt dem Browser genau das. Die Zusatz-
 * Sprossen decken die gängigen Telefone bei dpr 2 und 3 ab; über dem Master
 * (1280) gibt es nichts.
 */
const STANDBILD_SIZES =
  '(min-width: 1184px) 536px, (min-width: 48em) calc(50vw - 56px), calc(100vw - 64px)';
const STANDBILD_LEITER = {
  anzeigeBreite: 704,
  dprStufen: [1, 2],
  zusatzSprossen: [360, 480, 640, 960, 1100],
};

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

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * ÄNDERUNG 2026-09-27 (Job 20260927-videobaustein-klick-ohne-rueckmeldung-
 * spielt-attribut-postmessage-beide-laeden): EIN KLICK OHNE PLAYER HAT JETZT
 * EINEN AUSWEG, `spielt` SAGT, WER ES GESETZT HAT, UND DER HANDSCHLAG SPRICHT
 * NUR NOCH MIT DEM URSPRUNG, DEN DAS IFRAME TRÄGT.
 *
 * GEMESSEN VOR DEM UMBAU (live, Browser stumm, 1366 und 390 px):
 *   YouTube gesperrt (Tracking-Schutz, Erweiterung, Firmennetz): `laedt` ab
 *   ~40 ms, `spielt` ab ~970 ms — gesetzt von der Gnadenfrist nach dem load
 *   der FEHLERSEITE. Der Player hat kein Wort gesagt. Danach: Standbild, kein
 *   Knopf, kein Ladezeichen, kein Link. 16 Konsolenwarnungen „target origin".
 *   YouTube erreichbar: `spielt` ab ~1,5 s, ebenfalls aus der Gnadenfrist —
 *   auf diesem Server meldet der Player nur playerState -1 mit
 *   videoData.errorCode "auth" (Bot-Sperre gegen die Rechenzentrums-Adresse).
 *   9 Warnungen: der Gruß ging an ZWEI Ursprünge, und das Anklopfen begann,
 *   bevor das iframe überhaupt geladen war (about:blank trägt den Ursprung
 *   der Seite, jeder frühe Gruß passte also auf keinen der beiden).
 *
 * WIE ES JETZT GEBAUT IST — nach YouTubes eigener www-widgetapi.js (gelesen
 * am 2026-09-27): das Ziel eines Grußes ist der Ursprung der iframe-`src`,
 * nie eine Liste. Trägt die Einbettungs-URL `origin` und `widgetid`, meldet
 * sich der Player UNGEFRAGT mit `readyToListen` (gemessen 516 ms, VOR dem
 * load bei 679 ms); erst darauf wird gegrüßt. Ein einziger Ersatz-Gruß beim
 * load hält den Handschlag, falls YouTube dieses Ereignis je fallen lässt.
 * Mit erreichbarem YouTube: 0 Warnungen. Mit gesperrtem: 1 (der Ersatz-Gruß
 * trifft die Fehlerseite) — bewusst, denn ohne ihn sähe bei einer stillen
 * Änderung auf YouTubes Seite JEDER Besucher nur noch den Ausweg.
 *
 * DIE ENTSCHEIDUNG, und sie hat jetzt vier Ausgänge statt drei:
 *   Player meldet playerState 1                   -> spielt / player
 *   load + GNADENFRIST_MS, Player hat geantwortet -> spielt / gnadenfrist
 *     (er ist da und zeigt seine eigene Oberfläche: Fehlerhinweis, eigener
 *     Knopf, Anmeldung — die ist dann der Weg weiter)
 *   HARTE_FRIST_MS, Player hat geantwortet        -> spielt / frist
 *   load + ANTWORT_FRIST_MS OHNE jedes Wort       -> ausweg / gnadenfrist
 *   ABSOLUTE_FRIST_MS ohne jedes Wort             -> ausweg / frist
 * `data-qb-video-ausloeser` trägt, welche Stelle entschieden hat. Nur
 * `player` ist ein Abspielbeweis; homepage-bauer/bin/mess_videoumschaltung.py
 * hält das gegen seine EIGENE Erhebung der Player-Nachrichten.
 *
 * DER AUSWEG: an der Stelle des Knopfes steht derselbe Knopf als LINK auf
 * die Folge an derselben Sekunde (neuer Tab). Das iframe wird dabei nicht
 * ausgehängt, sondern auf about:blank gestellt und verborgen: ein Player, der
 * doch lebt, verstummt damit sicher — und ein Aushängen liefe gegen einen
 * Knoten, den eine Erweiterung ersetzt haben kann (React-removeChild bricht
 * dann die ganze Seite). Im Hintergrund-Tab wird nicht auf `ausweg`
 * entschieden: gedrosselte Uhren sind kein Beleg für einen stummen Player.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* Wie lange nach `onLoad` noch auf die Auskunft gewartet wird. `onLoad` sagt
 * nur, dass das Player-DOKUMENT da ist — nicht, dass Bild da ist. */
const GNADENFRIST_MS = 900;
/* Die Frist, die nicht ausfallen kann. Bliebe die Vorschau liegen, weil die
 * Auskunft nie kommt, stünde ein Standbild über einem laufenden Video — das
 * wäre schlimmer als der Fehler, der hier behoben wird. Seit 2026-09-27 gilt
 * sie für einen Player, der GEANTWORTET hat; einer, der schweigt, bekommt den
 * Ausweg (ANTWORT_FRIST_MS / ABSOLUTE_FRIST_MS). */
const HARTE_FRIST_MS = 4000;
/* Nach dem load der EIGENEN Quelle: so lange darf der Player schweigen, bevor
 * das Dokument im Rahmen als „kein Player" gilt. Er meldet sich gemessen VOR
 * dem load; 1500 ms sind Luft für ein langsames Telefon, keine Wartezeit. */
const ANTWORT_FRIST_MS = 1500;
/* Kein load, kein Wort: ein hängendes Netz. Länger als jedes gemessene
 * Laden des Players, kurz genug, dass niemand vor einem Ladezeichen aufgibt. */
const ABSOLUTE_FRIST_MS = 15000;
const ZUSTAND_ABSPIELEND = 1;
/* Der Ursprung, von dem der Player lädt — und damit der EINZIGE, an den
 * gegrüßt wird. Aus der Quelle abgeleitet, nicht zweimal von Hand geführt. */
const PLAYER_URSPRUNG = 'https://www.youtube-nocookie.com';
/* Laufende Nummer je Player der Seite, wie in YouTubes eigener API. Ohne
 * `widgetid` in der URL meldet der Player sich nie von selbst. */
let naechsteWidgetId = 1;

/**
 * Der Handschlag mit dem YouTube-Player (postMessage-Protokoll der
 * IFrame-API, ohne deren Fremdskript).
 *
 * Gegrüßt wird NUR der Ursprung, den das iframe trägt, und NUR wenn der
 * Player zuhört: auf `readyToListen` hin, plus ein einziger Ersatz-Gruß beim
 * load, falls bis dahin kein `initialDelivery` kam.
 *
 * @param {HTMLIFrameElement} iframe
 * @param {{ursprung: string, widgetId: number, beiAntwort: () => void,
 *          beiSpielt: () => void}} opts
 * @returns {{abmelden: () => void, beiLoad: () => void}}
 */
function spielMelderAnbinden(iframe, {ursprung, widgetId, beiAntwort, beiSpielt}) {
  const leer = {abmelden: () => {}, beiLoad: () => {}};
  if (typeof window === 'undefined' || !iframe) return leer;
  let geantwortet = false;
  let initialisiert = false;
  let gemeldet = false;

  const gruessen = () => {
    try {
      const f = iframe.contentWindow;
      if (f) {
        f.postMessage(
          JSON.stringify({event: 'listening', id: widgetId, channel: 'widget'}),
          ursprung,
        );
      }
    } catch {
      /* fremdes Fenster nicht erreichbar — der Ausweg fängt das auf */
    }
  };

  const aufNachricht = (ev) => {
    /* Nur der eigene Player zählt: auf der Seite können weitere fremde
     * Fenster sprechen, und ein `message` ohne Absenderprüfung ist eine
     * offene Tür. */
    if (!iframe.contentWindow || ev.source !== iframe.contentWindow) return;
    if (ev.origin !== ursprung) return;
    let d;
    try {
      d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    } catch {
      return;
    }
    if (!d || typeof d !== 'object') return;
    if (!geantwortet) {
      geantwortet = true;
      beiAntwort();
    }
    if (d.event === 'readyToListen') {
      gruessen();
      return;
    }
    if (
      d.event === 'initialDelivery' ||
      d.event === 'onReady' ||
      d.event === 'alreadyInitialized'
    ) {
      initialisiert = true;
    }
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

  window.addEventListener('message', aufNachricht);
  return {
    abmelden: () => window.removeEventListener('message', aufNachricht),
    beiLoad: () => {
      if (!initialisiert) gruessen();
    },
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
 * die Fassaden-Bauweise, der youtube-nocookie-Ursprung und der
 * <noscript>-Ausweg. Die YouTube-Poster-Kette maxres -> sd -> hq ist seit
 * dem 2026-09-26 durch das eigene Standbild ersetzt (Kopf dieser Datei).
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
 * eigene Standbild von cdn.shopify.com, `loading="lazy"`, also erst wenn es
 * in die Naehe des Sichtfensters kommt. Bis dahin steht die Vorstufe aus dem
 * HTML. Kein Player, kein Skript, kein Autoplay (WCAG 1.4.2), keine Anfrage
 * an YouTube. Der Player entsteht erst im Klick-Handler.
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
 * SEIT DEM 2026-09-26 GESCHLOSSEN: bis dahin kam das Vorschaubild von
 * i.ytimg.com, also eine Verbindung zu Google, bevor der Besucher etwas
 * anklickt. Das eigene Standbild (Kopf dieser Datei) nimmt diese Verbindung
 * weg; vor dem Klick spricht die Seite mit keinem YouTube-Host mehr.
 *
 * @param {{
 *   videoId: string,
 *   startSekunde?: number,
 *   titel: string,
 *   dauerWort?: string,
 * }} props
 */
export function PodcastEinstieg({
  videoId,
  startSekunde = 0,
  titel,
  dauerWort = '',
  children,
}) {
  const [laeuft, setLaeuft] = useState(false);
  /* `zeigt` ist NICHT „der Player existiert", sondern „der Player hat Bild".
   * Der Unterschied zwischen beidem ist genau das Schwarz, um das es geht. */
  const [zeigt, setZeigt] = useState(false);
  /* `ausweg`: kein Player hat je geantwortet — der Knopf wird zum Link. */
  const [ausweg, setAusweg] = useState(false);
  /* Welche Stelle den Ladezustand beendet hat: player | gnadenfrist | frist. */
  const [ausloeser, setAusloeser] = useState(null);
  const rahmen = useRef(null);
  const melder = useRef(null);
  const antwort = useRef(false);
  const entschieden = useRef(false);
  const widgetId = useRef(0);
  const start = Math.max(0, Math.floor(startSekunde || 0));

  /* EINE Stelle entscheidet, und nur einmal. */
  const entscheide = (wie, ergebnis) => {
    if (entschieden.current) return;
    entschieden.current = true;
    setAusloeser(wie);
    if (ergebnis === 'ausweg') setAusweg(true);
    else setZeigt(true);
  };
  /* Schweigen wird erst im sichtbaren Tab zum Befund: im Hintergrund drosselt
   * der Browser die Uhren, und ein langsamer Player sähe dann aus wie keiner. */
  const pruefeSchweigen = (wie) => {
    if (entschieden.current || antwort.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      const wieder = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', wieder);
        setTimeout(() => pruefeSchweigen(wie), ANTWORT_FRIST_MS);
      };
      document.addEventListener('visibilitychange', wieder);
      return;
    }
    entscheide(wie, 'ausweg');
  };

  useEffect(() => {
    if (!laeuft || !rahmen.current) return undefined;
    const m = spielMelderAnbinden(rahmen.current, {
      ursprung: PLAYER_URSPRUNG,
      widgetId: widgetId.current,
      beiAntwort: () => {
        antwort.current = true;
      },
      beiSpielt: () => entscheide('player', 'spielt'),
    });
    melder.current = m;
    return () => {
      m.abmelden();
      melder.current = null;
    };
  }, [laeuft]);

  /* Die Fristen ab dem Klick — unabhängig von jedem load. */
  useEffect(() => {
    if (!laeuft) return undefined;
    const hart = setTimeout(() => {
      if (antwort.current) entscheide('frist', 'spielt');
    }, HARTE_FRIST_MS);
    const absolut = setTimeout(() => pruefeSchweigen('frist'), ABSOLUTE_FRIST_MS);
    return () => {
      clearTimeout(hart);
      clearTimeout(absolut);
    };
  }, [laeuft]);

  /* Der Weg zur ganzen Folge. Er zeigt bewusst auf DIESELBE Sekunde: wer
   * hier weiterklickt, soll dort weitermachen, wo er aufgehoert hat, nicht
   * am Anfang neu beginnen. Ohne Skript ist genau dieser Link der Ersatz
   * fuer den Knopf (siehe <noscript> unten). */
  const ganzeFolge = folgeUrl(videoId, start);
  /* Die Einbettung. `origin` und `widgetid` wie in YouTubes eigener API:
   * erst damit meldet der Player sich von selbst (`readyToListen`). Die
   * Nummer entsteht beim Klick, die Adresse also erst im Browser. */
  const quelle =
    laeuft && typeof window !== 'undefined'
      ? `${PLAYER_URSPRUNG}/embed/${videoId}?start=${start}&autoplay=1&enablejsapi=1` +
        `&origin=${encodeURIComponent(window.location.origin)}&widgetid=${widgetId.current}`
      : '';

  const standbild = EIGENE_STANDBILDER[videoId] || null;
  const quellen = standbild
    ? bildQuellen(standbild.url, {
        ...STANDBILD_LEITER,
        masterBreite: standbild.breite,
        sizes: STANDBILD_SIZES,
      })
    : null;

  return (
    <section className="cc-podcast NormalSectionSize" aria-labelledby="cc-podcast-titel">
      <div className="cc-podcast__raster">
        {standbild ? (
          <div
            className="cc-podcast__buehne"
            data-qb-video-zustand={
              laeuft ? (ausweg ? 'ausweg' : zeigt ? 'spielt' : 'laedt') : 'vorschau'
            }
            data-qb-video-ausloeser={ausloeser || undefined}
          >
            {/* SCHICHT 0 — die Vorstufe. Grob, vollflächig, sofort da: sie
                steht als data-URI im HTML und braucht weder eine Anfrage noch
                ein Skript. Sie liegt VOR dem Standbild im Baum und damit
                darunter (beide absolut, ohne z-index). */}
            <span
              className="cc-podcast__vorstufe"
              aria-hidden="true"
              data-qb-video-vorstufe=""
              style={{backgroundImage: `url(${standbild.vorstufe})`}}
            />

            {/* SCHICHT 1 — die Vorschau. Sie wird NIE entfernt. Sie liegt auch
                während des Ladens und danach unter dem Player: puffert er
                später nach, fällt er auf ein Bild zurück statt auf Schwarz.
                Sie kostet nichts, sie ist längst geladen. */}
            <img
              src={quellen.src}
              srcSet={quellen.srcSet}
              sizes={quellen.sizes}
              width={standbild.breite}
              height={standbild.hoehe}
              className="cc-podcast__fuellung"
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden={laeuft ? 'true' : undefined}
            />

            {/* SCHICHT 2 — der Player. Erst ab dem Klick im Dokument (die
                schlanke Ladeweise bleibt), sichtbar erst wenn er Bild hat. */}
            {laeuft ? (
              <iframe
                ref={rahmen}
                className="cc-podcast__fuellung"
                src={ausweg ? 'about:blank' : quelle}
                title={titel}
                style={{
                  opacity: zeigt && !ausweg ? 1 : 0,
                  visibility: ausweg ? 'hidden' : undefined,
                  transition: 'opacity 240ms ease-out',
                }}
                onLoad={() => {
                  /* Nur der load der EIGENEN Quelle zählt: hat ein
                     Einwilligungs-Werkzeug oder eine Erweiterung die Adresse
                     umgeschrieben, sagt dieser load nichts über den Player. */
                  const f = rahmen.current;
                  if (entschieden.current || !f || f.getAttribute('src') !== quelle) return;
                  if (melder.current) melder.current.beiLoad();
                  setTimeout(() => {
                    if (antwort.current) entscheide('gnadenfrist', 'spielt');
                  }, GNADENFRIST_MS);
                  setTimeout(() => pruefeSchweigen('gnadenfrist'), ANTWORT_FRIST_MS);
                }}
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
                onClick={() => {
                  if (!widgetId.current) widgetId.current = naechsteWidgetId++;
                  setLaeuft(true);
                }}
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
            {laeuft && !zeigt && !ausweg ? (
              <span className="cc-podcast__play" aria-hidden="true">
                <span className="cc-podcast__play-scheibe">
                  <span className="cc-video-spinner" />
                </span>
              </span>
            ) : null}
            {/* DER AUSWEG — derselbe Knopf an derselben Stelle, jetzt als Link
                auf die Folge an derselben Sekunde. Wer klickt und der Player
                kann hier nicht laden (Tracking-Schutz, Erweiterung,
                Firmennetz), landet trotzdem bei 8:30 — nur auf YouTube. Die
                Klasse ist die des Knopfes: gleiche Fläche, gleiches Gold,
                gleiche Trefferfläche, kein zweiter Stil-Pfad. */}
            {ausweg ? (
              <a
                className="cc-podcast__knopf"
                href={ganzeFolge}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Podcast ab Minute ${minuteWort(start)} auf YouTube ansehen (neuer Tab): ${titel}`}
              >
                <span className="cc-podcast__play" aria-hidden="true">
                  <span className="cc-podcast__play-scheibe">▶</span>
                </span>
                <span className="cc-podcast__marke" aria-hidden="true">
                  ab {minuteWort(start)} auf YouTube
                </span>
              </a>
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
        ) : null}

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
