import {useState} from 'react';

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
  const [stufe, setStufe] = useState(0);
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
        <div className="cc-podcast__buehne">
          {laeuft ? (
            <iframe
              className="cc-podcast__fuellung"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${start}&autoplay=1`}
              title={titel}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="cc-podcast__knopf"
              onClick={() => setLaeuft(true)}
              aria-label={`Podcast ab Minute ${minuteWort(start)} abspielen: ${titel}`}
            >
              <img
                {...poster}
                className="cc-podcast__fuellung"
                alt=""
                loading="lazy"
              />
              <span className="cc-podcast__play" aria-hidden="true">
                <span className="cc-podcast__play-scheibe">▶</span>
              </span>
              <span className="cc-podcast__marke" aria-hidden="true">
                ab {minuteWort(start)}
              </span>
            </button>
          )}
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
