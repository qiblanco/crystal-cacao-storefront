/**
 * startseite-fassung — welche der drei Fassungen die Startseite `/` zeigt.
 *
 * STAND 2026-09-08 (Nachtrag-Auftrag). Christian:
 *   „Oder andere Frage: ist ‚Unser Kakao' nicht die bessere Frontseite — ich
 *    würde sagen schon. Also das ist redundant. Einfach diese Version
 *    übernehmen, ‚Unser Kakao', und die andere Frontseite löschen."
 *
 * Damit ist die Vorlage-Frage des Vorgaengerbaus entschieden, und zwar GEGEN
 * den dort gebauten Entwurf: nicht eine dritte Startseite, sondern die
 * vorhandene, seit Wochen live stehende Seite `/pages/crystal-cacao` wird die
 * Startseite. Der Default steht deshalb auf 'kakao'.
 *
 * WARUM DIE ANDEREN ZWEI FASSUNGEN BLEIBEN — und das ist kein Zoegern:
 * „Die alte Startseite wird ERSETZT, NICHT VERNICHTET: Inhalt und Fassung
 * bleiben lesbar abgelegt." Endgueltiges Loeschen ist ausdruecklich
 * Christians Perimeter. 'bestand' und 'entwurf' sind deshalb weiter
 * abrufbar — und 'bestand' ist zugleich der RUECKWEG dieses Baus: eine Zeile
 * hier, kein zweiter Bau.
 *
 * DIE ABGELEGTE FASSUNG HAT EINEN LESER, sonst waere sie Dekoration:
 *   - proben/probe_sofortfehler.py misst Achse (6b) — die Rangfolge der
 *     zwei Kopf-Schaltflaechen — an ihr, seit die Schaltflaechen auf der
 *     neuen Startseite nicht mehr stehen. Ohne die Ablage waere jener
 *     Rot-Nachweis vom 2026-09-08 lautlos verfallen.
 *   - proben/probe_startseite_ist_kakao.py ARM-E prueft, dass sie abrufbar
 *     BLEIBT.
 *
 * PARAMETER (alle drei Richtungen, ohne Deploy):
 *   ?fassung=hochwertig  die Startseite seit 2026-10-02 (Default)
 *   ?fassung=kakao    „Unser Kakao" (Startseite 08.09.–02.10.2026),
 *                     auch ?fassung=bisher
 *   ?fassung=bestand  die alte Startseite (Aufmacher + Sortenraster)
 *   ?fassung=entwurf  der Verkaufsauftritt-Entwurf vom 2026-09-08
 *
 * RUECKWAERTS-VERTRAG: die Adressen `?entwurf=1` und `?entwurf=0` aus dem
 * Vorgaengerbau bleiben gueltig. Sie stehen in dessen RESULT und auf
 * Christians Vorlage; eine Adresse, die dort genannt ist, laeuft nicht ins
 * Leere, nur weil hier ein Parameter dazugekommen ist.
 */

/*
 * STAND 2026-10-02 (Grossjob 20261002-GROSSJOB-crystal-cacao-startseite-
 * hochwertig-slider-profile-responsiv): Christian hat die Startseite neu
 * bestellt — oben der Sorten-Slider (Awake herzöffnend/powerful, Create
 * Fokus/High Performance), direkt danach die Analyseprofile, Aufbau wie die
 * Zellen-Schlafschutz-Seite. Die neue Fassung heisst 'hochwertig' und ist
 * Default. 'kakao' bleibt unveraendert abrufbar, zusaetzlich unter dem
 * sprechenden Namen 'bisher'.
 *
 * DER RUECKWEG DIESES BAUS IST DIESE EINE ZEILE: FASSUNG = 'kakao'.
 */

/** 'hochwertig' = Startseite seit 02.10.2026 · 'kakao'/'bisher' = „Unser Kakao" bis 02.10. · 'bestand' = alte Startseite · 'entwurf' = Verkaufsauftritt */
export const FASSUNG = 'hochwertig';

const ERLAUBT = ['hochwertig', 'kakao', 'bestand', 'entwurf'];

/** Sprechende Namen, die auf eine Fassung zeigen. */
const ALIAS = {bisher: 'kakao'};

/**
 * @param {Request} request
 * @returns {'hochwertig'|'kakao'|'bestand'|'entwurf'}
 */
export function waehleFassung(request) {
  let p = null;
  try {
    p = new URL(request.url).searchParams;
  } catch {
    // FAIL-CLOSED: eine unlesbare URL zeigt die eingestellte Fassung, nie
    // eine, die jemand ueber die Adresszeile erraten hat.
    p = null;
  }
  if (p) {
    const f = ALIAS[p.get('fassung')] || p.get('fassung');
    if (ERLAUBT.includes(f)) return f;
    const e = p.get('entwurf');
    if (e === '1') return 'entwurf';
    if (e === '0') return 'bestand';
  }
  return ERLAUBT.includes(FASSUNG) ? FASSUNG : 'kakao';
}

/**
 * Beibehalten fuer den Vorgaengerbau und seine Probe: sie fragt genau diese
 * eine Frage („zeigt `/` den Entwurf?"). Sie wird hier ABGELEITET statt
 * danebengeschrieben — zwei Stellen, die denselben Zustand fuehren, laufen
 * sonst auseinander, und die falsche gewinnt still.
 * @param {Request} request
 * @returns {boolean}
 */
export function zeigeVerkaufsauftritt(request) {
  return waehleFassung(request) === 'entwurf';
}
