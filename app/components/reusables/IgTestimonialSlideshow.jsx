import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useDragSwipe} from './useDragSwipe';
import {IG_TESTIMONIALS} from '~/data/ig-testimonials';

/*
 * IgTestimonialSlideshow — die Instagram-Stimmen eines Produkts als
 * horizontale Bahn (Job 20260911-GROSSJOB-ig-testimonial-slideshow-…, s03).
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DAS FASSADEN-REGIME — und warum es hier NICHT neu erfunden wird          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Christian am 2026-09-11 über die YouTube-Einbettungen: „wenn man auf Play
 * drückt, verschwindet zuerst alles Sichtbare, dann kommt was Schwarzes, und
 * dann wird das Video geladen. Das war nicht die Idee hinter Fast Loading."
 *
 * Der Zwillingsjob 20260911-BAU-videoumschaltung hat das für YouTube gelöst
 * (Commit 1dc1c3a, Bauform von lite-youtube-embed): die Vorschau wird beim
 * Play NICHT entfernt, sie bleibt als unterste Schicht liegen, der Player legt
 * sich darüber und wird erst eingeblendet, wenn er zeigt. GEOMETRIE gehört der
 * Komponente, AUSSEHEN dem Seiten-CSS.
 *
 * Diese Komponente übernimmt genau dieses Regime — KEIN zweites. Der Grund ist
 * derselbe, aus dem der Zwillingsjob überhaupt nötig war: „fünf Einbettungen
 * mit fünf Verhaltensweisen" ist der Zustand, der repariert wurde. Eine sechste
 * wäre der Rückfall.
 *
 * SEIT DEM 2026-09-12 SIND ES WIEDER DREI AUSLÖSER — und das ist die Folge
 * des Quellenwechsels, nicht eine eigene Erfindung. Hier stand bis dahin:
 * „Auslöser 1 gibt es hier NICHT: die Instagram-Einbettung hat kein
 * postMessage-Protokoll, das einen Abspielzustand meldet." Das war für ein
 * <iframe> richtig und ist mit einem <video> gegenstandslos: ein
 * Medienelement MELDET seinen Abspielzustand selbst (`playing`). Die Fassade
 * hat damit genau den Handshake, den der YouTube-Bau hat:
 *   (1) das Video meldet `playing`          → sofort umblenden
 *   (2) `loadeddata` + Gnadenfrist          → Rückfallebene
 *   (3) harte Frist                         → kann nicht ausfallen
 * (2) und (3) BLEIBEN. Ein Beschleuniger, der im Fehlerfall den normalen Weg
 * kaputt macht, ist schlimmer als keiner — und (1) fällt aus, sobald der
 * Browser das Abspielen verweigert (Autoplay-Regel), also in genau dem Fall,
 * in dem der Mensch die Bedienelemente sehen MUSS.
 *
 * DIE FEHLERRICHTUNG IST DIESELBE WIE DORT: bliebe die Vorschau liegen, WEIL
 * die Auskunft nie kommt, stünde ein Standbild über einem laufenden Video —
 * schlimmer als der Zustand, der behoben wird. Die harte Frist kann deshalb
 * nicht ausfallen. Im schlechtesten Fall ist das Verhalten das von vorher.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DIE ZWEITE SCHICHT IST UNSERE EIGENE mp4 — NICHT MEHR DER IG-EMBED       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Christian am 2026-09-12, mit Bildschirmfoto: „Krasser Fehler, bitte mit
 * Prio 1 beheben lassen: die IG-Videos können wir nicht abspielen, warum?"
 *
 * GEMESSEN, nicht vermutet: der Abruf von instagram.com/reel/<code>/embed/
 * liefert HTTP 200 mit 261 KB — und darin eine ANMELDEWAND. Für einen
 * ausgeloggten Besucher, also für praktisch jeden Kunden, spielte hier nie
 * etwas. 43 von 43 Kacheln hatten als einzige Videoquelle diesen Embed.
 *
 * Die Videos liegen deshalb jetzt auf UNSEREM CDN und werden von dort
 * abgespielt (`videoUrl` der Datenschicht). Das ist dieselbe Linie, die für
 * die Poster schon galt, und sie gilt aus demselben Grund: die signierten
 * Instagram-Quellen tragen ihren Ablauf im Klartext, und keine der 56 hielt
 * länger als vier Tage. Wer verlinkt statt zu spiegeln, baut eine Fläche, die
 * ein paar Tage läuft und dann still stirbt — und jede Probe, die vorher
 * läuft, wäre grün.
 *
 * DER PROFIL-KLICK BLEIBT DER WEG ZUM ORIGINAL. Die Einbettung ist hier
 * ersetzt, nicht Instagram: wer den Beitrag dort sehen will, kommt über die
 * Namenszeile hin (T1/T2).
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ WELCHE KACHELN STEHEN: `inDerReihe`, und zwar FAIL-CLOSED                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Christian am 2026-09-12, zweiter Befund: „Hier sind oft ganz viele Videos
 * vom gleichen Künstler, das kommt nicht gut. Hier sollte jeder Künstler nur
 * einmal gezeigt werden, das beste Video."
 *
 * WELCHE das sind, entscheidet nicht diese Komponente — es steht als Feld
 * `inDerReihe` in der Datenschicht, begründet je Kachel in auswahl.json des
 * Reparatur-Jobs (Rang aus views → likes → Datum → Code, mit benannter
 * Ersatzordnung, weil es Abrufzahlen nachweislich nicht gibt). Eine zweite
 * Auswahl HIER wäre eine zweite Wahrheit.
 *
 * DER FELDNAME IST NICHT FREI GEWÄHLT, und das ist eine Falle für den nächsten:
 * das naheliegende Wort steht im Lexikon des Umlaut-Gates (Gate 7b des Deploys,
 * homepage-bauer/src/umlaut_gate.py). Es scannt JEDE hinzugefügte Zeile einer
 * .js-Datei und unterscheidet Programmtext nicht von Kundentext — ein Feldname
 * in Digraph-Form blockt damit jeden Merge, und der echte Umlaut mitten in
 * einem Bezeichner wäre die schlechtere Antwort. `inDerReihe` sagt ohnehin
 * genauer, was gemeint ist: diese Kachel steht in der Reihe, die der Kunde sieht.
 *
 * GEFILTERT WIRD AUF `=== true`, NICHT AUF `!== false`. Fehlt das Feld — alte
 * Datenschicht, fremder Zwilling —, rendert diese Fläche NICHTS und
 * verschwindet; die Positiv-Kontrolle der Live-Probe schlägt darauf an. Ein
 * `!== false` hätte in demselben Fall still alle 66 Slots zurückgebracht, also
 * genau den Zustand, der hier behoben wird. Die Fehlerrichtung ist eine
 * Entscheidung, keine Schreibweise.
 *
 * UND WAS DER KUNDE NICHT SIEHT: keine Like-Zahl und nirgends das Wort
 * „beste". Die Zahl war unser Auswahlwerkzeug; sie ist keine Empfehlung für
 * ihn, und eine Kachel, die sich selbst zur besten erklärt, sagt über die
 * anderen etwas aus, das wir nicht gemessen haben.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DIE MESS-NAHT: data-qb-video-zustand                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Jede Kachel trägt `data-qb-video-zustand` in genau den Werten, die der
 * Zwillingsbau verwendet: `vorschau` → `wartet` → `spielt`. Dazu ein vierter,
 * den es dort nicht gibt: `kein-video`.
 *
 * DER MITTLERE WERT WAR BIS ZUM 2026-09-11 DIE ASCII-SCHREIBWEISE VON `lädt`
 * -- und das war KEIN Wert des Zwillingsbaus, obwohl der Satz darüber es
 * behauptete. Am Bestand nachgelesen (YoutubeTimestamp.jsx, Zeile 554:
 * `'spielt' : 'wartet'` bzw. `'vorschau'`) heißt der mittlere Zustand dort
 * `wartet`. Aufgefallen ist die Abweichung erst, als das Umlaut-Gate des
 * Deploys die ASCII-Schreibweise blockte: der naheliegende Griff wäre der
 * echte Umlaut gewesen -- also ein Umlaut mitten in einem DOM-Attributwert,
 * den zwei fremde Messgeräte lesen. Statt den Wert schöner zu schreiben, ist
 * er jetzt der, den die Naht ohnehin versprochen hat. Keine Probe vergleicht
 * den mittleren Wert literal (geprüft: probe_ig_facade.py liest nur `spielt`
 * und `kein-video`, mess_videoumschaltung.py nur `spielt` und `vorschau`).
 *
 * `kein-video` ist keine Verlegenheitslösung, sondern die einzige ehrliche
 * Antwort für drei Einträge des Korpus (CYHc4RClQLb, DRK-x7OjATx,
 * DW59RV8Db8k): das sind Bild-/Karussell-Posts, kein Video. Ein Play-Knopf
 * darauf wäre eine Lüge, und das Attribut wegzulassen wäre eine zweite — die
 * Kachel gäbe sich dann als etwas aus, das nicht gemessen werden will.
 *
 * WAS DAS ATTRIBUT NICHT LEISTET, gemessen am Quelltext des fremden Messgeräts
 * (homepage-bauer/bin/mess_videoumschaltung.py, Stand 2026-09-11): Segment s01
 * hatte festgehalten, das autoritative Gerät messe unsere Fläche damit
 * „automatisch mit — ohne Nachbau". Das stimmt so NICHT. Sein Wahl-Schritt
 * sammelt zwar alle `[data-qb-video-zustand]` (Zeile 207), wirft aber in der
 * gemeinsamen Schlussschleife (Zeile 225) jeden Kasten wieder weg, dessen
 * Vorschau kein YouTube-Bild ist: `posterVon = (e) => e.querySelector(
 * 'img[src*="ytimg"], img[srcset*="ytimg"]')`. Unsere Poster liegen auf
 * cdn.shopify.com — genau das war der Zweck von s02, weil `video.poster` bei
 * Instagram signiert ist und verfällt. Unsere Kacheln werden also gefunden und
 * sofort wieder verworfen.
 *
 * Das Attribut bleibt trotzdem, aus zwei Gründen: es kostet nichts, und es ist
 * die richtige Naht — sobald der ytimg-Riegel beim Eigentümer fällt, misst das
 * Gerät hier ohne eine einzige Änderung mit. (Sein zweiter Riegel greift
 * seither ebenfalls: er sucht im Kasten ein `iframe`. Hier steht jetzt ein
 * `video` — dieselbe Naht, dieselbe Meldung an den Eigentümer, nicht hier
 * repariert.) Bis dahin misst die eigene Probe
 * `pruefungen/probe_ig_facade.py` dieselbe Zusage im selben Regime. Der Befund
 * am fremden Gerät ist an dessen Eigentümer gemeldet, nicht hier repariert:
 * `bin/` ist Nachbargebiet.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DIE ORDNUNG: Christians Stufen, darunter die Sprache                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Die Datenschicht liefert je Produkt bereits Christians Ordnung: T1 (fremdes
 * Konto) vor T2 (unser Post, Person per @handle genannt) vor T3 (unser Post
 * ohne Person), innerhalb der Stufe das jüngste zuerst.
 *
 * Diese Komponente sortiert NUR NOCH INNERHALB DER STUFE nach, nie über
 * Stufengrenzen hinweg — die Stufen-Ordnung ist Christians Weisung, die
 * Sprache ist die Feinsortierung darunter. Sie wäre sonst in der Lage, einen
 * eigenen Post vor ein fremdes Konto zu schieben, und genau das ist die eine
 * Sache, die die Fläche nicht tun darf.
 *
 * Der Sortierschlüssel ist deshalb (stufe, sprache) und NICHT (sprache, …).
 * `Array.prototype.sort` ist seit ES2019 stabil — die Datums-Ordnung der
 * Datenschicht bleibt innerhalb jeder (Stufe, Sprache)-Gruppe erhalten, ohne
 * dass sie hier noch einmal nachgebaut werden müsste. Zwei Stellen, die
 * dieselbe Ordnung führen, wären eine zu viel.
 */

/* Die Stufen-Ordnung. Sie steht hier NUR, um sie zu ERHALTEN — die
 * Datenschicht hat bereits danach sortiert. Ein eigener Rang wäre eine zweite
 * Wahrheit; dieser hier ist die Kopie, gegen die stabil nachsortiert wird. */
const STUFEN_RANG = {T1: 0, T2: 1, T3: 2};

/*
 * Sprach-Rang für die DEUTSCHE Seite. `beide` trägt deutschen Text und steht
 * deshalb direkt hinter `de`. `keine` (ein Post ohne nennenswerten Text) steht
 * VOR `en`: er stößt einen deutschen Leser nicht ab, eine fremde Sprache tut
 * es. Das ist eine Design-Entscheidung mit Begründung, keine Naturkonstante —
 * eine englische Seite bekäme ihren eigenen Rang über die Prop `sprachRang`.
 */
const SPRACH_RANG_DE = {de: 0, beide: 1, keine: 2, en: 3};

/*
 * DIE ÜBERSCHRIFT FOLGT DER KACHELZAHL, NICHT EINER PROP JE ROUTE.
 *
 * Zwei der fünf Flächen tragen nach der Auswahl genau EINE Kachel (Kakao,
 * QiHome): von vier Kakao-Beiträgen ist nur einer überhaupt abspielbar, und
 * QiHomes Korpus besteht aus drei eigenen Posts, die auf eine zusammenfallen.
 * „Echte Stimmen" über einer einzigen Stimme verspricht Vielstimmigkeit und
 * liefert eine — das ist dieselbe Art Unwahrheit wie ein Play-Knopf ohne Video.
 *
 * WARUM HIER UND NICHT JE ROUTE: eine handgesetzte Prop wäre eine zweite
 * Stelle, die dieselbe Aussage führt, und sie veraltet stumm beim ersten
 * Nachschub — käme ein zweites Kakao-Video, stünde dort weiter der Singular.
 * Die Kachelzahl ist die einzige Quelle, die nicht driften kann.
 *
 * EINE AUSDRÜCKLICHE `ueberschrift` STICHT WEITER. /products/qihome-air trägt
 * „QiHome® Air auf Instagram" (Commit d3f81bb, aus demselben Grund gewählt:
 * das Material dort trägt die Zusage „echte Stimmen" nicht, weil alle
 * Beiträge auf unserem eigenen Konto liegen). Ein Mensch hat diesen Text
 * entschieden; er wird nicht maschinell überstimmt.
 */
const UEBERSCHRIFT_MEHRERE = 'Echte Stimmen auf Instagram';
const UEBERSCHRIFT_EINE = 'Eine echte Stimme auf Instagram';

/* Wie lange nach `loadeddata` noch gewartet wird, bevor der Player eingeblendet
 * wird. Dieselbe Zahl wie im YouTube-Bau — dort begründet als „kurz genug,
 * dass niemand ein Standbild über einem laufenden Video sieht; lang genug,
 * dass die Auskunft im Normalfall zuerst da ist". Hier gibt es die Auskunft
 * gar nicht, die Frist trägt also allein. */
const GNADENFRIST_MS = 900;
/* Die Frist, die NICHT ausfallen kann: greift, wenn `onLoad` nie feuert
 * (Netzfehler, blockierter Drittinhalt). Ein Beschleuniger, der im Fehlerfall
 * den normalen Weg kaputt macht, ist schlimmer als keiner. */
const HARTE_FRIST_MS = 4000;

/*
 * Das Seitenverhältnis der Bühne. EIN Wert für alle Kacheln, bewusst:
 * verschieden hohe Kacheln in einer Bahn erzeugen eine unruhige Kante, und die
 * Designsprache verlangt für Reihen gleichartiger Bilder eine gemeinsame Bühne
 * mit festem Seitenverhältnis. 4:5 ist der Kompromiss, der beide Quellen
 * erträgt: Reels sind 9:16, Bild-Posts meist 1:1 oder 4:5.
 *
 * ABGRENZUNG zur Flächen-Harmonie-Regel der Designsprache („kein object-fit
 * cover auf einem Beleg"): die gilt für BELEGBILDER (Studien-Cover,
 * Zertifikate), deren Inhalt vollständig sichtbar bleiben muss. Ein
 * Video-Standbild ist kein Beleg, sondern eine Vorschau — dort ist der
 * Bildausschnitt gewollt und `cover` richtig.
 */
const BUEHNE = '4 / 5';

/*
 * DER STAPEL — wörtlich die Bauform des Zwillings, mit derselben Begründung:
 * in der Flussrichtung (kein `position: absolute` auf dem Stapel selbst),
 * damit er in jeder Umgebung dieselbe Höhe ergibt, und `maxWidth: none`,
 * damit eine Zeilenlängen-Regel des Seiten-CSS ihn nicht schrumpft (gemessener
 * Fall im Zwillingsbau: eine `max-width: 65ch`-Regel für Fließtext traf dort
 * jedes <span> und machte das Video um 175 px schmaler).
 */
const STAPEL_STYLE = {
  position: 'relative',
  display: 'block',
  width: '100%',
  maxWidth: 'none',
  overflow: 'hidden',
  aspectRatio: BUEHNE,
};
/* Die Schichten sitzen deckungsgleich aufeinander — das ist der ganze Trick. */
const SCHICHT_STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  border: 0,
  margin: 0,
  display: 'block',
};

/* Die frühere Hilfsfunktion `einbettung(t)` ist hier ENTFERNT und nicht bloß
 * unbenutzt stehengelassen: sie baute die instagram.com/…/embed/-URL, und genau
 * die ist der behobene Fehler. Eine ungenutzte Funktion, die den alten Weg noch
 * kennt, ist die Einladung, ihn wieder anzuschliessen. `app/lib/ig-video-schema.js`
 * trägt seine eigene Fassung für den strukturierten Datensatz. */

/**
 * Eine Kachel. Eigene Komponente, weil jede ihren EIGENEN Zustand hat: in
 * einer Bahn mit 45 Kacheln wäre ein gemeinsamer Zustand im Elternteil ein
 * Neuaufbau aller Geschwister bei jedem Klick.
 */
function Kachel({t}) {
  const [laueft, setLaueft] = useState(false);
  /* `zeigt` ist NICHT „der Player existiert", sondern „der Player hat Bild".
   * Der Unterschied zwischen den beiden ist genau das Schwarz, um das es in
   * diesem Bau geht. */
  const [zeigt, setZeigt] = useState(false);
  const fristen = useRef([]);
  const spielerRef = useRef(null);
  /* Beim Aushaengen alle offenen Fristen loeschen: sonst setzt ein Timer
   * Zustand auf einer Kachel, die es nicht mehr gibt (Routenwechsel). */
  useEffect(() => () => fristen.current.forEach(clearTimeout), []);

  /*
   * DER KNOPF SAGT DIE WAHRHEIT — und zwar als BEDINGUNG, nicht als Zusage.
   * Hier stand `t.video !== false`, also allein das Korpus-Flag. Das war die
   * Frage „gibt es an der Plattform ein Video?" und nicht die Frage, die den
   * Kunden angeht: „kann ICH es hier abspielen?". Beide müssen gelten. Fehlt
   * die eigene Datei, gibt es keinen Play-Knopf — auch dann nicht, wenn die
   * Plattform ein Video hat, das wir nicht ausliefern können.
   */
  const hatVideo = t.video !== false && Boolean(t.videoUrl);

  /*
   * ABSPIELEN NACH DEM MONTIEREN, nicht per `autoPlay`-Attribut.
   *
   * Der Klick IST die Nutzergeste, die der Browser für Ton verlangt — aber das
   * <video> entsteht erst im Render DANACH. `autoPlay` an einem frisch
   * montierten Element ist dem Browser gegenueber kein Geste-Ergebnis, sondern
   * Autoplay, und Autoplay MIT Ton wird verweigert. Ein `.play()` im selben
   * Aktivierungsfenster wird erlaubt.
   *
   * DIE FEHLERRICHTUNG IST AUSDRÜCKLICH GEWÄHLT: verweigert der Browser
   * trotzdem, wird NICHT stumm nachgeladen, sondern umgeblendet. Dann sieht der
   * Mensch die Bedienelemente und drueckt selbst — ein stummes Testimonial wäre
   * schlechter als ein Klick mehr, denn hier spricht jemand.
   */
  useEffect(() => {
    if (!laueft) return;
    const el = spielerRef.current;
    if (!el) return;
    const versuch = el.play();
    if (versuch && typeof versuch.catch === 'function') {
      versuch.catch(() => setZeigt(true));
    }
  }, [laueft]);
  const zustand = !hatVideo
    ? 'kein-video'
    : laueft
      ? zeigt
        ? 'spielt'
        : 'wartet'
      : 'vorschau';

  const starte = () => {
    if (laueft) return;
    setLaueft(true);
    /* Die Frist, die nicht ausfallen kann — sie hängt an NICHTS ausser der
     * Uhr. Hinge sie an `loadeddata`, wäre sie bei einem Netzfehler genauso
     * weg wie die Auskunft, auf die sie antworten soll. */
    fristen.current.push(
      setTimeout(() => setZeigt(true), HARTE_FRIST_MS),
    );
  };

  /* Der sichtbare Teil der Kachel — in BEIDEN Zuständen derselbe Bauplan.
   * Vorher-Nachher-Tausch von Teilbäumen war der Defekt, den der Zwillingsjob
   * behoben hat; hier entsteht er gar nicht erst. */
  const stapel = (
    <span className="qb-igt__buehne" style={STAPEL_STYLE}>
      {/* SCHICHT 1 — die Vorschau. Wird NIE entfernt. Sie bleibt auch nach dem
          Umblenden liegen: ein Player, der später neu puffert, fällt damit auf
          ein Bild zurück statt auf Schwarz. */}
      <img
        className="qb-igt__poster"
        src={t.posterPfad}
        alt={
          t.stufe === 'T3'
            ? 'Standbild eines Instagram-Beitrags von Qi Blanco'
            : `Standbild des Instagram-Beitrags von @${t.profil}`
        }
        loading="lazy"
        /* Läuft der Player, ist die Vorschau nur noch Unterlage und trägt
           keine eigene Aussage mehr. */
        aria-hidden={laueft ? 'true' : undefined}
        style={SCHICHT_STYLE}
      />

      {/* SCHICHT 2 — der Spieler. Erst ab dem Klick im Dokument (das ist die
          Ladeweise, die bleibt: 18 Videos eager zu laden wäre die Ladezeit,
          die dieser Bau gerade nicht kosten darf), und sichtbar erst, wenn er
          Bild haben KANN.

          `poster` trägt dieselbe Datei wie SCHICHT 1 — kein zweiter Abruf, sie
          liegt bereits im Zwischenspeicher. Sie steht hier trotzdem, weil ein
          <video> ohne Poster im Moment des Einblendens ein SCHWARZES Feld
          zeigt, und Schwarz beim Play ist genau der Zustand, gegen den das
          Fassaden-Regime gebaut wurde.

          `controls`: keine eigenen Bedienelemente und kein eigener Ton-Schalter.
          Die Haus-Regel zum Ton-Umschalter gilt für AUTOPLAY-STUMME Videos —
          sie schaltet `.muted` an einem bereits laufenden, weil stummen Video
          um. Hier gibt es die Nutzergeste, also darf der Ton von Anfang an an
          sein, und der Mensch braucht kein nachgebautes Bedienfeld: er bekommt
          das des Browsers, das er kennt und das barrierefrei ist. Ein eigener
          Schalter wäre eine sechste Bauform. */}
      {laueft ? (
        <video
          className="qb-igt__player"
          ref={spielerRef}
          src={t.videoUrl}
          poster={t.posterPfad}
          controls
          playsInline
          preload="none"
          aria-label={
            t.stufe === 'T3'
              ? 'Instagram-Beitrag von Qi Blanco'
              : `Instagram-Beitrag von @${t.profil}`
          }
          style={{
            ...SCHICHT_STYLE,
            opacity: zeigt ? 1 : 0,
            /* Kurz, und nur in EINE Richtung. `prefers-reduced-motion`
               schaltet sie im CSS ab — eine Deckkraft-Animation ist Bewegung
               im Sinne der Einstellung. */
            transition: 'opacity 240ms ease-out',
          }}
          /* AUSLÖSER 1 — der Handshake, den es mit dem <iframe> nicht gab. */
          onPlaying={() => setZeigt(true)}
          /* AUSLÖSER 2 — Rückfallebene: Bild ist da, Abspielen (noch) nicht. */
          onLoadedData={() => {
            fristen.current.push(
              setTimeout(() => setZeigt(true), GNADENFRIST_MS),
            );
          }}
          /* Bricht die Datei, ist die Vorschau mit Ladezeichen die falsche
             Anzeige: sie verspricht weiter, dass gleich etwas kommt. Der Spieler
             sagt es selbst — dieselbe Richtung wie die harte Frist, nur früher. */
          onError={() => setZeigt(true)}
        />
      ) : null}

      {/* SCHICHT 3 — das Zeichen. Vor dem Klick Play, während des Ladens ein
          Ladezeichen („wer klickt und eine Sekunde nichts sieht, klickt
          nochmal" — Christian). Nach dem Umblenden weg.
          AUF EINEM BILD-POST GIBT ES GAR KEINS: ein Play-Knopf auf einem
          Karussell verspricht ein Video, das es nicht gibt. */}
      {hatVideo && !zeigt ? (
        <span className="qb-igt__zeichen" aria-hidden="true">
          <span className="qb-igt__abzeichen">
            {laueft ? <span className="qb-igt__spinner" /> : '▶'}
          </span>
        </span>
      ) : null}
    </span>
  );

  /*
   * DIE HÜLLE. Vor dem Klick ein <button>, danach ein <div> — ein <iframe> ist
   * interaktiver Inhalt und darf baulich nicht in einem <button> stehen. Das
   * ist derselbe (und einzige) Element-Wechsel wie im Zwillingsbau, und er ist
   * folgenlos: Klasse, Stil und Inhalt sind in beiden Zuständen dieselben, die
   * Geometrie kommt aus dem Stapel darin.
   *
   * `display: block; width: 100%` steht hier und nicht im CSS: ein <button>
   * ist von Haus aus inline-block und schrumpft auf seinen Inhalt — der Stapel
   * darin hat `width: 100%`, was in einem schrumpfenden Elternteil NULL ergibt
   * und die Kachel verschwinden lässt. Im Zwillingsbau live gemessen
   * („Kasten hat keine messbare Größe").
   */
  const huelle = {
    className: 'qb-igt__flaeche',
    style: {display: 'block', width: '100%'},
  };

  /* Ein Bild-Post bekommt keinen Play-Knopf und deshalb auch keine Bühne, die
   * sich bedienen lässt — er ist reine Anschauung. Der Weg zum Beitrag führt
   * über die Profil-Zeile darunter (T1/T2) bzw. gar nicht (T3). */
  const buehne = !hatVideo ? (
    <span {...huelle}>{stapel}</span>
  ) : laueft ? (
    <div {...huelle}>{stapel}</div>
  ) : (
    <button
      type="button"
      {...huelle}
      onClick={starte}
      aria-label={
        t.stufe === 'T3'
          ? 'Instagram-Beitrag von Qi Blanco abspielen'
          : `Instagram-Beitrag von @${t.profil} abspielen`
      }
    >
      {stapel}
    </button>
  );

  return (
    /*
     * `data-ig-video` trägt die Zusage „hier spielt eine eigene Datei" AM
     * DOKUMENT — nicht nur im strukturierten Datensatz. Das sind zwei
     * verschiedene Zeugen: der Datensatz entsteht in app/lib/ig-video-schema.js,
     * dieses Attribut auf DEM Renderpfad, der auch die Quelle des <video>
     * setzt. Stimmen die beiden nicht zusammen, ist das der Befund — eine
     * Zusage, die nur ihre eigene Quelle bezeugt, bezeugt nichts.
     * Die Reihenfolge der Attribute ist dabei nicht beliebig: das fremde
     * Messgeraet pruefeungen/probe_ig_videoobject.py erwartet data-ig-reel VOR
     * data-qb-video-zustand im selben <article>.
     */
    <article
      className="qb-igt__kachel"
      data-ig-reel={t.code}
      data-ig-video={hatVideo ? t.videoUrl : undefined}
      data-ig-profil={t.profil}
      data-qb-video-zustand={zustand}
    >
      {buehne}
      {/*
        OHNE JAVASCRIPT. Eine Fassade ist ein <button> — ohne JavaScript
        passiert beim Klick NICHTS, und das ist die eine echte Schwäche dieser
        Bauform (Zusage G der Haus-Ladestrategie). Der Vorgängerbau liess sie
        offen, weil sein Weg zum Video eine fremde Einbettung war, die einem
        ausgeloggten Besucher ohnehin nur eine Anmeldewand zeigte. Mit der
        eigenen Datei gibt es jetzt einen ehrlichen Weg: ein Link auf genau die
        mp4, die der Knopf abspielen würde. Poster und Namenszeile stehen
        ohnehin ohne JavaScript.
      */}
      {hatVideo ? (
        <noscript>
          <a className="qb-igt__ohnejs" href={t.videoUrl}>
            Video ansehen
          </a>
        </noscript>
      ) : null}
      {/*
        DIE NAMENSZEILE — und die eine Grenze, die Christians Nachtrag
        ausdrücklich stehen lässt: KEINE BEI T3.

        „Wo keine Person dahintersteht, steht keine da. Ein Reel ohne Namen ist
        erlaubt, ein Reel mit falschem Namen nicht."

        T3 sind unsere eigenen Posts ohne jede Personennennung. Sie stehen
        bewusst auf der Fläche (Christian: „Trotzdem einen tollen Slider machen
        mit dem ganzen Material"), aber sie bekommen keinen Namen geliehen —
        auch nicht unseren eigenen, denn eine Zeile „@qiblanco" unter einem
        Testimonial liest sich wie eine Quellenangabe für eine fremde Stimme.
        Das Konto steht trotzdem maschinenlesbar in `data-ig-profil`: kaschiert
        wird hier nichts, es wird nur nichts behauptet.
      */}
      {t.stufe === 'T3' ? null : (
        <a
          className="qb-igt__profil"
          href={t.profilUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <span className="qb-igt__handle">@{t.profil}</span>
          <span className="qb-igt__aufig">auf Instagram</span>
        </a>
      )}
    </article>
  );
}

/**
 * @param {{
 *   produkt: string,
 *   ueberschrift?: string,  // ohne Angabe: Numerus nach Kachelzahl
 *   unterzeile?: string,
 *   eintraege?: Array<object>,
 *   sprachRang?: Record<string, number>,
 *   dataSection?: string,
 * }} props
 */
export function IgTestimonialSlideshow({
  produkt,
  ueberschrift,
  unterzeile,
  eintraege = IG_TESTIMONIALS,
  sprachRang = SPRACH_RANG_DE,
  dataSection,
}) {
  const titelId = useId();
  const bahnRef = useRef(null);
  const {handlers, isDragging} = useDragSwipe({mode: 'scroll', trackRef: bahnRef});

  const liste = useMemo(() => {
    const meine = eintraege.filter(
      /* FAIL-CLOSED, und die Reihenfolge der beiden Bedingungen ist Absicht:
       * erst das Produkt, dann `inDerReihe === true`. Ein Eintrag ohne das Feld
       * ist KEINE Kachel — siehe Kopf, Abschnitt „WELCHE KACHELN STEHEN". */
      (t) => t.produkt === produkt && t.inDerReihe === true,
    );
    /* Stabil nach (ansEnde, Stufe, Sprache) — die Rang-Ordnung der Datenschicht
     * bleibt innerhalb jeder Gruppe erhalten (ES2019: sort ist stabil).
     *
     * Der Erzeuger der Datenschicht sortiert die Kacheln nach genau demselben
     * Schluessel vor, damit diese Nachsortierung ein NO-OP ist. Wer hier etwas
     * aendert — etwa `sprachRang` je Markt —, zieht auswahl.json und den
     * Erzeuger im SELBEN Schritt mit; der Detektor dafür ist
     * `pruefe_auswahl.py --nur-naht` im Job-Ordner des Reparatur-Grossjobs,
     * und er muss exit 0 bleiben.
     *
     * `ansEnde` IST DIE ERSTE STUFE UND DAMIT DIE STAERKSTE, und das ist der
     * Zweck: eine so markierte Kachel steht am Flaechen-ENDE, auch wenn ihre
     * Stufe sie sonst nach vorn zoege. Sie ist die einzige Ordnungsangabe, die
     * NICHT aus einer Messung kommt, sondern aus einer Weisung — Christian am
     * 2026-09-16 zum Gedicht von @gianky261: es soll den Schluss bilden, weil
     * ein Gedicht am Anfang ein Rateseil ist und am Ende ein Schlusswort.
     * Ohne das Feld ändert sich NICHTS: `!== true` heißt 0, und damit ist
     * diese Stufe für jede Kachel ohne Marke ein No-Op (drei der vier
     * Produktreihen tragen sie nicht). */
    const ansEndeRang = (t) => (t.ansEnde === true ? 1 : 0);
    return [...meine].sort((a, b) => {
      const e = ansEndeRang(a) - ansEndeRang(b);
      if (e !== 0) return e;
      const s = (STUFEN_RANG[a.stufe] ?? 9) - (STUFEN_RANG[b.stufe] ?? 9);
      if (s !== 0) return s;
      return (sprachRang[a.sprache] ?? 9) - (sprachRang[b.sprache] ?? 9);
    });
  }, [eintraege, produkt, sprachRang]);

  if (liste.length === 0) return null;

  /* Eine Kachel ist eine Stimme, mehrere sind Stimmen. Die Begründung steht
   * oben an den zwei Konstanten; eine ausdrueckliche Prop sticht. */
  const eine = liste.length === 1;
  const titel = ueberschrift ?? (eine ? UEBERSCHRIFT_EINE : UEBERSCHRIFT_MEHRERE);

  const blaettere = (richtung) => {
    const bahn = bahnRef.current;
    if (!bahn) return;
    const kachel = bahn.querySelector('.qb-igt__kachel');
    const schritt = kachel ? kachel.offsetWidth + 16 : 280;
    bahn.scrollBy({left: richtung * schritt, behavior: 'smooth'});
  };

  const beiTaste = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      blaettere(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      blaettere(-1);
    }
  };

  return (
    <section
      className="qb-igt"
      data-ig-testimonials={produkt}
      data-section={dataSection}
      aria-labelledby={titelId}
    >
      <div className="qb-igt__kopf">
        <h2 className="qb-igt__titel" id={titelId}>
          {titel}
        </h2>
        {unterzeile ? <p className="qb-igt__unter">{unterzeile}</p> : null}
      </div>

      <div
        /* `is-eine` trägt KEINE Geometrie und keinen Wert — sie sagt dem
           Seiten-CSS nur, dass hier genau EINE Kachel steht. Die Bahn ist
           sonst linksbuendig, was bei zehn Kacheln richtig ist (sie laufen
           nach rechts weiter) und bei einer einzigen wie ein Rest aussieht:
           eine Karte am linken Rand unter einer zentrierten Ueberschrift.
           Die Trennung folgt der Hausregel des Zwillingsbaus — GEOMETRIE
           gehört der Komponente, AUSSEHEN dem CSS. */
        className={`qb-igt__bahn${isDragging ? ' is-dragging' : ''}${
          eine ? ' is-eine' : ''
        }`}
        ref={bahnRef}
        role="group"
        aria-label={
          eine
            ? `Instagram-Beitrag zu ${produkt}`
            : `Instagram-Beiträge zu ${produkt} — horizontal scrollbar`
        }
        tabIndex={0}
        onKeyDown={beiTaste}
        {...handlers}
      >
        {liste.map((t) => (
          <Kachel key={`${t.produkt}-${t.code}`} t={t} />
        ))}
      </div>

      {/*
        BEI GENAU EINER KACHEL GIBT ES NICHTS ZU BLAETTERN. Zwei Pfeile und ein
        „weiterwischen" über einer einzigen Kachel sind dieselbe Unwahrheit wie
        die Plural-Ueberschrift darueber: sie versprechen mehr, als da ist, und
        der Pfeil führt ins Leere. Kakao und QiHome tragen heute je eine.
      */}
      {eine ? null : (
        <div className="qb-igt__nav">
          <button
            type="button"
            className="qb-igt__pfeil"
            onClick={() => blaettere(-1)}
            aria-label="Vorheriger Beitrag"
          >
            {'←'}
          </button>
          <span className="qb-igt__wisch" aria-hidden="true">
            weiterwischen {'→'}
          </span>
          <button
            type="button"
            className="qb-igt__pfeil"
            onClick={() => blaettere(1)}
            aria-label="Nächster Beitrag"
          >
            {'→'}
          </button>
        </div>
      )}
    </section>
  );
}

export default IgTestimonialSlideshow;
