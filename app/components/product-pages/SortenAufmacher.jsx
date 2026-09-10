import {Link} from 'react-router';
import LazyImage from '~/components/reusables/LazyImage';
import {SORTEN, POSITIONIERUNG, andereSorte} from '~/lib/sorten-profil';

/**
 * DER SORTEN-AUFMACHER — einmal gebaut, zweimal benutzt.
 *
 * Job 20260910-BAU-sortenbloecke-awake-und-create-leerer-bildschirm-ohne-aufgabe.
 * Christian, zu zwei Bildschirmaufnahmen: „Das ist optisch auch nicht gut
 * gemacht, auch Crystal Cacao."
 *
 * ======================================================================
 * 1. WOFUER IST DIESER ABSCHNITT DA — und warum die Antwort eine andere ist
 *    als die, die der Auftrag nahelegt
 * ======================================================================
 * Der Auftrag schlaegt vor: „hier wird der Unterschied zwischen den beiden
 * Sorten begreifbar und der Weg fuehrt zur passenden", und begruendet das
 * damit, dass die zwei Bloecke „direkt untereinander" stehen.
 *
 * GEMESSEN STEHEN SIE DAS NICHT. Es gibt sie zweimal, aber je einmal pro
 * SEITE: `/products/crystal-cacao-awake` und `/products/crystal-cacao-create`
 * sind zwei getrennte Routen, und im ausgelieferten HTML jeder Seite kommt
 * der Block genau EINMAL vor (nachgezaehlt am Live-HTML, 2026-09-10). Sie
 * begegnen einander nie. Ein Vergleich durch Nebeneinanderstellen ist auf
 * dieser Flaeche baulich nicht moeglich — der Auftrag beschreibt hier die
 * Wirkung der zwei Bildschirmaufnahmen, die nebeneinander gelegt wurden,
 * nicht die Seite.
 *
 * WAS DER BLOCK STATTDESSEN LEISTET, und das ist zugleich die Antwort auf
 * „was soll jemand hier verstehen, und was soll er danach tun":
 * er ist der Kopf einer KAUFSEITE, nicht einer Landingpage. Wer hier steht,
 * ist schon bei EINER Sorte. Vier Aufgaben, in dieser Reihenfolge:
 *
 *   a) SAGEN, WO ER IST — Positionierung, Wortmarke, Claim.
 *   b) EINORDNEN, WOFUER DIESE SORTE GEDACHT IST — ein Satz, Gelegenheiten,
 *      keine Wirkung (Bedingung des Auftrags).
 *   c) ZWEI WEGE ANBIETEN, und der zweite ist der eigentliche Ertrag:
 *      hinunter zu Preis und Bestellung DIESER Sorte — und hinueber zur
 *      ANDEREN, mit deren Einordnung im Linktext. Genau dort wird der
 *      Unterschied begreifbar und genau dort fuehrt der Weg zur passenden
 *      Sorte: nicht durch Nebeneinanderstellen, sondern indem jede Seite
 *      die andere benennt. Wer auf der falschen gelandet ist, sieht das im
 *      ersten Bildschirm statt gar nicht.
 *   d) AUFHOEREN, EINEN GANZEN BILDSCHIRM ZU KOSTEN. Das ist der schwerste
 *      Punkt des Auftrags, und die beste Antwort darauf ist nicht, den
 *      Block vollzustellen, sondern ihm den Bildschirm zurueckzugeben: die
 *      Produktaufnahme, der Preis und der Kaufknopf stehen ohnehin
 *      unmittelbar darunter. Sie in den ersten Bildschirm zu holen liefert
 *      dem Besucher mehr als jede Zutat, die man hier oben ergaenzen
 *      koennte.
 *
 * ======================================================================
 * 2. WARUM HIER KEIN ZWEITES PRODUKTBILD STEHT
 * ======================================================================
 * Der Auftrag schlaegt „daneben oder darunter das Produktbild" vor und
 * erlaubt ausdruecklich, den Vorschlag begruendet abzuwandeln.
 *
 * Die Kaufseite zeigt die Produktaufnahme bereits gross, gemessen 8 px
 * unter der Unterkante dieses Blocks (`.ProductImages`, direkt der naechste
 * Geschwisterknoten). Eine zweite Kopie derselben Tuete in diesem Abstand
 * ist keine Fuellung, sondern eine Dopplung — und sie wuerde genau den
 * Bildschirm wieder verbrauchen, den dieser Bau zurueckgibt.
 *
 * Die Anforderung „der Abschnitt bietet ein Bild an" wird deshalb dadurch
 * erfuellt, dass das VORHANDENE Bild hoeher rueckt statt dass ein zweites
 * entsteht — und was das wert ist, ist gemessen und NICHT schoengerechnet:
 *
 *              Oberkante Produktaufnahme / Kaufknopf, in Pixeln von oben
 *                        vorher            nachher          gewonnen
 *   1440x900 awake       621 / 682         476 / 537         145 px
 *   1440x900 create      663 / 724         476 / 537         187 px
 *    390x844 awake       620 / 1265        538 / 1182         82 px
 *    390x844 create      649 / 1293        538 / 1182        111 px
 *
 * EHRLICH DAZU, ZWEIMAL: am Schreibtisch war der Kaufknopf AUCH VORHER
 * schon ohne Scrollen sichtbar (682 px von 900) — dieser Bau holt ihn nicht
 * ins Bild, er hebt ihn um 145 bzw. 187 px. Und auf dem Telefon steht er
 * NACH wie VOR unter dem Falz (1182 px von 844); 82 bis 111 px weniger
 * Scrollweg sind eine Verbesserung, keine Loesung. Genau deshalb ist der
 * erste Weg ein Sprung auf `#cc-kaufen`: am Telefon spart er dem Besucher
 * die 1182 px, am Schreibtisch ist er ein Angebot und keine Notwendigkeit.
 * Arm D der Probe misst darum das, was hier wirklich zugesagt wird — dass
 * der Abschnitt eine gedeckelte Hoehe nicht ueberschreitet.
 *
 * ======================================================================
 * 3. WARUM BEIDE BLOECKE ZWANGSLAEUFIG DECKUNGSGLEICH SIND
 * ======================================================================
 * „Bau es einmal und verwende es zweimal, statt zwei Abschnitte zu pflegen,
 * die auseinanderlaufen werden." — genau deshalb ist das hier EINE
 * Komponente mit EINEM Parameter. Es gibt keinen Wert, den die eine Seite
 * setzen koennte und die andere nicht: Groessen und Abstaende stehen
 * ausschliesslich in app/styles/kakao-seiten.css, und was sich unterscheidet
 * (Farbe, Name, Claim, Bild, Einordnung) kommt aus app/lib/sorten-profil.js.
 *
 * VORHER war es zweimal dasselbe Markup in zwei Dateien — und genau das ist
 * der Befund, den der Auftrag unter „Zusammenhang" vermutet: nicht dass
 * jeder Abschnitt seine Abstaende selbst setzt, sondern dass jede SEITE
 * ihren Abschnitt selbst mitbringt. Die zwei Fassungen waren am 2026-09-10
 * sogar noch zeichengleich; auseinandergelaufen ist nicht der Code, sondern
 * das BILD darin (995x356 gegen 950x420 Pixel), und das konnte kein Blick
 * in den Quelltext sehen.
 *
 * ======================================================================
 * 4. DIE ZWEI ANKER, DIE HIER STEHEN BLEIBEN MUESSEN
 * ======================================================================
 * `.items-center-justify-center` ist als Tailwind-Klasse ein Schreibfehler
 * (gemeint war `items-center justify-center`, zwei Klassen) und faerbt
 * nichts. Sie bleibt trotzdem stehen — und sie steht ganz bewusst am
 * DIREKTEN ELTERN der <h2>, nicht am aeusseren <section>. Der Selektor
 * unten endet auf `> h2`, also auf einem KIND. In der ersten Fassung dieses
 * Bausteins trug die <section> die Klasse und die <h2> sass eine Ebene
 * tiefer im Text-Block: der Selektor griff nicht mehr, der Claim verlor
 * seine Sortenfarbe, und probe_sortenfarbe.py waere rot geworden — gesehen
 * auf der eigenen Bildschirmaufnahme, nicht im Quelltext. Wer die Gruppen
 * hier umbaut, verschiebt diesen Anker mit.
 * Sie ist seit dem 2026-09-02 ein TRAGENDER ANKER:
 *   - app/styles/kakao-seiten.css faerbt darueber die Claim-Zeile in der
 *     Sortenfarbe (`[data-cc-sorte] .items-center-justify-center > h2`),
 *   - und `pruefungen/probe_sortenfarbe.py` misst Arm B an genau diesem
 *     Selektor und verlangt GENAU EIN Treffer je Seite.
 * Sie umzubenennen hiesse, den Gegenstand einer fremden, lebenden Wache zu
 * verschieben und im selben Zug ihr Messgeraet nachzuziehen — der Pruefer
 * liefe dann durch den Pruefling. Der bessere Name ist ein eigener Auftrag;
 * hier ist er ein Anker, und `data-cc-aufmacher` steht additiv daneben.
 *
 * Aus demselben Grund bleibt der Claim eine <h2>: der Selektor verlangt es.
 * Dass damit eine <h2> vor der <h1> der Seite steht, ist ein
 * Gliederungsfehler — er BESTAND schon vorher, ist in diesem Bau nicht
 * entstanden und wird im RESULT als gefunden gemeldet, nicht im
 * Vorbeigehen mitgedreht.
 */
export function SortenAufmacher({sorte}) {
  const profil = SORTEN[sorte];
  // FAIL-CLOSED: eine unbekannte Sorte rendert nichts, statt einen halben
  // Block mit leeren Feldern zu zeigen. Ein Aufmacher ohne Inhalt ist genau
  // die leere Huelle, gegen die dieser Bau angetreten ist.
  if (!profil) return null;
  const andere = andereSorte(sorte);
  const wm = profil.wortmarke;

  return (
    <section
      className="cc-sortenaufmacher"
      data-cc-aufmacher={profil.sorte}
      data-cc-sorte={profil.sorte}
      aria-labelledby={`cc-sortenaufmacher-${profil.sorte}`}
    >
      <div className="cc-sortenaufmacher__marke">
      <p className="cc-sortenaufmacher__positionierung">{POSITIONIERUNG}</p>

      <img
        className="cc-sortenaufmacher__wortmarke"
        src={wm.url}
        width={wm.breite}
        height={wm.hoehe}
        alt={`Crystal Cacao ${profil.name}`}
        /* EAGER UND MIT VORRANG — die Wortmarke ist das groesste Element im
         * ersten Bildschirm und damit der LCP-Kandidat. Vorher hing sie an
         * <LazyImage/> mit `loading="lazy"`: ausgeliefert wurde zuerst die
         * 100 px breite Vorschau, auf 500 px hochgezogen, und erst ein
         * IntersectionObserver tauschte sie gegen die grosse. Ein
         * Platzhalter-Tausch ist unterhalb des Falzes richtig und ganz oben
         * falsch — er kostet einen Ladeschritt und zeigt dem Besucher im
         * ersten Moment die unscharfe Fassung.
         * `width`/`height` tragen die NATUERLICHEN Masse (nicht die
         * gerenderten): sie reservieren ueber das Seitenverhaeltnis den
         * Platz, bevor das Bild da ist, und halten CLS bei 0. */
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{'--cc-wortmarke-dx': `${wm.tinte_dx}%`}}
      />
      </div>

      {/* ZWEI GRUPPEN, WEIL DER BREITE BILDSCHIRM ZWEI SPALTEN HERGIBT.
        * Gestapelt kostete der Aufmacher gemessen 512,6 px — mehr als der
        * Vorzustand (427,0 / 469,2 px), und damit waere der schwerste Punkt
        * des Auftrags („kostet einen ganzen Bildschirm") durch den Fix
        * schlimmer geworden statt besser. Ab 48em stehen Marke und Text
        * deshalb NEBENEINANDER; die Gruppen sind das, was das Raster
        * braucht. Unter 48em fallen sie von selbst wieder untereinander. */}
      <div className="cc-sortenaufmacher__text items-center-justify-center">
      <h2 id={`cc-sortenaufmacher-${profil.sorte}`}>{profil.claim}</h2>

      <p className="cc-sortenaufmacher__einordnung">{profil.einordnung}</p>

      <div className="cc-knopfreihe cc-sortenaufmacher__wege">
        {/* EIN <a>, KEIN <Link>: das Ziel liegt auf DERSELBEN Seite. Ein
          * Sprungziel im eigenen Dokument ist Browser-Grundverhalten und
          * braucht keinen Router — es funktioniert auch dann noch, wenn das
          * JavaScript-Bundle gerade nicht geladen hat, und genau das ist im
          * ersten Bildschirm der wahrscheinliche Zustand. */}
        <a className="cc-knopf" href="#cc-kaufen">
          Preis und Bestellung ansehen
        </a>
        {andere ? (
          <Link className="cc-knopf cc-knopf--ruhig" to={andere.pfad}>
            {/* Der Quer-Verweis nennt die andere Sorte MIT ihrer Einordnung.
              * Ein blosses „Zur anderen Sorte" waere ein Weg ohne Auskunft —
              * der Besucher muesste klicken, um zu erfahren, ob es sich
              * lohnt. Der Satz ist derselbe, der auf der Startseite unter
              * der Kachel dieser Sorte steht (app/lib/sorten-profil.js
              * `kurz`), nicht eine zweite Formulierung daneben.
              *
              * DIE FORM „Name: Satz" IST GEMESSEN GEWAEHLT, nicht getextet.
              * Die erste Fassung hiess „Lieber Awake? Fuer den Start in den
              * Tag." — vier Zeichen laenger als ihr Gegenstueck, und genau
              * diese vier Zeichen kippten den Link bei 1440 px von einer auf
              * zwei Zeilen. Ergebnis: die zwei Bloecke waren 21,1 px
              * verschieden hoch, also exakt der Befund, gegen den dieser Bau
              * gebaut ist — erzeugt durch seine eigene Textwahl. Der Name
              * vorn spart die Anrede und macht beide Fassungen kurz genug.
              * Nachgemessen wird das nicht geglaubt: probe_sortenaufmacher.py
              * Arm B vergleicht die Blockhoehen ueber sechs Breiten. */}
            {andere.name}: {andere.kurz}
          </Link>
        ) : null}
      </div>
      </div>
    </section>
  );
}

/**
 * DER ZUSTAND VOM 2026-09-10 VOR DIESEM BAU — Markup unveraendert.
 *
 * Erreichbar unter `?aufmacher=bestand`, Vertrag in
 * app/lib/sortenaufmacher-fassung.js. Zwei Leser, damit das hier keine
 * Dekoration ist:
 *   - der Rueckweg dieses Baus (K2-Auflage: Rueckweg benennen UND erproben),
 *   - der ROT-Arm von pruefungen/probe_sortenaufmacher.py. Eine Probe, die
 *     ihren eigenen Anlassfall nicht mehr herstellen kann, beweist nichts.
 *
 * BEWUSST NICHT AUFGERAEUMT: die beiden Utility-Klassenketten sind Zeichen
 * fuer Zeichen die der zwei Routen vor dem Umbau, samt der zwei
 * Schreibfehler `items-center-justify-center` und `m-center` (keine der
 * beiden existiert als Tailwind-Klasse; `m-center` ist der Grund, warum die
 * 500-px-Box nicht zentriert war, sondern links in ihrer 734-px-Spalte
 * klebte — gemessen 117,0 px links der Fenstermitte, auf BEIDEN Seiten
 * gleich). Wer den Bestand „nebenbei" saeubert, hat keinen Bestand mehr,
 * sondern eine dritte Fassung.
 */
export function SortenAufmacherBestand({sorte}) {
  const profil = SORTEN[sorte];
  if (!profil) return null;
  const wm = profil.wortmarke;
  // Der Vorzustand haengt an <LazyImage/> — und das ist fuer den Rot-Nachweis
  // TRAGEND, nicht Beiwerk: der Baustein liefert zuerst die 100 px breite
  // Vorschau und tauscht sie erst per IntersectionObserver. Wer hier ein
  // schlichtes <img> mit der grossen Datei einsetzt, baut einen Vorzustand
  // nach, den es nie gab, und die Probe misst gegen eine Erfindung.
  const klein = wm.url.replace(/(\.[a-z0-9]+)(\?|$)/i, '_small$1$2');
  return (
    <div className="flex flex-col gap-5 items-center-justify-center text-center max-w-[750px] mx-auto! my-[5vh]! p-2">
      <div className="max-w-[500px] m-center">
        <LazyImage highQualityLink={wm.url} compressedLink={klein} />
      </div>
      <h2 style={{fontSize: '3em', marginTop: '50px'}}>{profil.claim}</h2>
      <h3 style={{fontSize: '2em'}}>{POSITIONIERUNG}</h3>
    </div>
  );
}

export default SortenAufmacher;
