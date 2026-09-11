/**
 * shopifyBildQuellen — srcset-Leiter für Bilder vom Shopify-Datei-CDN.
 *
 * WOZU
 * Ein nacktes <img src="https://cdn.shopify.com/.../foto.webp"> lädt IMMER die
 * Masterdatei, egal wie klein die Fläche ist. Gemessen am 2026-09-01 auf
 * /pages/schlaf-zellen-schutz: 1714 px / 362 KB für eine Kachel von 342 CSS-px.
 * Mit `&width=344` liefert dasselbe CDN 344 px / 21 KB — dieselbe Datei, 94 %
 * weniger Bytes. Diese Funktion baut daraus die Leiter fürs srcset.
 *
 * WARUM DIE LEITER NICHT AUF DIE MASTERBREITE GEDECKELT WIRD
 * Shopify skaliert NIE hoch: eine angefragte Breite über der Masterbreite
 * liefert die Masterdatei zurück (nachgemessen — `&width=1376` auf einen
 * 668-px-Master gibt 668 px, byte-gleich zum Original). Eine Sprosse oberhalb
 * des Masters überzeichnet damit ihren w-Deskriptor. Das ist unschädlich und
 * ausdrücklich gewollt:
 *   - Der Browser wählt die kleinste Sprosse >= Bedarf. Ist der Bedarf <=
 *     Master, bekommt er mindestens den Bedarf. Ist der Bedarf > Master,
 *     bekommt er den Master — also genau das, was er ohne srcset auch bekommen
 *     hätte. Schlechter als vorher wird es in keinem Fall.
 *   - Wird später ein größerer Master hochgeladen (der offene Asset-Weg (a)
 *     des Jobs 20260901-lp-a-mechanismus-bilder-zu-klein-asset-entscheid),
 *     liefert die Leiter die höhere Auflösung SOFORT aus, ohne Code-
 *     Änderung. Eine hart gedeckelte Leiter müsste dafür nachgezogen werden
 *     und würde es erfahrungsgemäß nicht.
 *
 * Die Leiter ist bewusst KEINE Zusage über die Bildschärfe: ob eine Quelle
 * für eine Fläche groß genug ist, entscheidet der Master, nicht das Markup.
 */

/** Sprossen in CSS-/Gerätepixeln. Deckt 320..1440 breite Kacheln bis dpr 3. */
export const BILD_LEITER = [320, 480, 640, 800, 1100, 1440];

const CDN_RX = /^https?:\/\/cdn\.shopify\.com\//i;

/**
 * srcset-Wert für eine Shopify-CDN-URL.
 *
 * Gibt `undefined` zurück, wenn die URL nicht vom Shopify-Datei-CDN stammt
 * (lokale /campaigns/*.jpg, YouTube-Poster, Google-Avatare). Ein `srcSet={undefined}`
 * rendert React gar nicht — das Bild verhaelt sich dann exakt wie vorher.
 * Fail-soft ist hier Absicht: ein falsch umgeschriebener Fremd-Host wäre ein
 * 404 statt eines nicht optimierten Bildes.
 *
 * @param {string} url    Bildquelle
 * @param {number[]} [leiter=BILD_LEITER]
 * @returns {string|undefined}
 */
export function bildSrcSet(url, leiter = BILD_LEITER) {
  if (!url || !CDN_RX.test(url) || hatBreite(url)) return undefined;
  const trenner = url.includes('?') ? '&' : '?';
  return leiter.map((w) => `${url}${trenner}width=${w} ${w}w`).join(', ');
}

/**
 * Trägt die URL bereits einen eigenen Breitenparameter? (Query, nicht Pfad.)
 *
 * Eine URL, die `width=` schon mitbringt, wird NICHT angefasst: ein zweites
 * `&width=` daneben ist eine Angabe, über deren Auflösung wir nichts zugesagt
 * bekommen — und der Aufrufer, der die erste gesetzt hat, wusste mehr über das
 * Bild als diese Funktion. Bestandsverhalten ist hier der sichere Ausgang.
 */
function hatBreite(url) {
  const frage = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return /(^|&)width=/.test(frage);
}

/**
 * `src` + `srcSet` für ein Shopify-CDN-Bild, als Spread ins <img>.
 *
 *   <img {...bildQuelle(url, [200, 400])} sizes="200px" alt="…" loading="lazy" />
 *
 * UNTERSCHIED ZU bildSrcSet, UND WARUM ES IHN BRAUCHT: `bildSrcSet` lässt das
 * `src`-Attribut in Ruhe, dort bleibt also die MASTERDATEI stehen. Das ist
 * folgenlos, solange `sizes` und `srcSet` greifen — aber genau dann nicht mehr,
 * wenn sie es nicht tun: ein Vorschau-Renderer, ein Crawler oder ein Bild, das
 * ohne `sizes` eingebunden wird, holt dann wieder das Original. Gemessen am
 * 2026-09-08 auf /pages/schlaf-zellen-schutz sind das im Extremfall 6.266.409 B
 * für eine Fläche von 200 px. `src` trägt deshalb hier die KLEINSTE Sprosse:
 * ein zu kleines Bild ist der billigere Fehler als ein 6-MB-Original.
 *
 * Nicht-CDN-URLs und URLs mit eigenem `width=` gehen unverändert durch — ein
 * falsch umgeschriebener Fremd-Host wäre ein 404 statt eines nicht optimierten
 * Bildes.
 *
 * @param {string} url
 * @param {number[]} [leiter=BILD_LEITER]  aufsteigende Zielbreiten in px, aus
 *   der GEMESSENEN Anzeigegröße abgeleitet (1x … DPR-Reserve) — nie pauschal:
 *   ein fester Wert über alle Bilder macht die kleinen größer (gemessen bei
 *   `width=600`: Klarna-Badge 17 -> 28 KB).
 * @returns {{src: string, srcSet?: string}}
 */
export function bildQuelle(url, leiter = BILD_LEITER) {
  const srcSet = bildSrcSet(url, leiter);
  if (!srcSet) return {src: url};
  const kleinste = [...new Set(leiter)].sort((a, b) => a - b)[0];
  const trenner = url.includes('?') ? '&' : '?';
  return {src: `${url}${trenner}width=${kleinste}`, srcSet};
}
/* ====================================================================
 * ANZEIGEGROESSEN-LEITER  (Job 20260908-REPAIR-eu-gewaehrleistungslabel)
 * ====================================================================
 *
 * WARUM ES DIE ZWEITE FUNKTION BRAUCHT UND `bildSrcSet` NICHT REICHT
 * `bildSrcSet` hängt eine feste Leiter an, lässt aber `src` unangetastet.
 * Ein Bild ohne srcset-faehigen Kontext -- und vor allem der `src` selbst --
 * zieht damit weiter die Masterdatei. Gemessen am 2026-09-08 am Kopf-Logo:
 * Master 2048x720, angezeigt auf hoechstens 150 CSS-px, uebertragen 44 877 B
 * als PNG. Das sind 13,6-fach zu viele Pixel auf JEDER Seite des Shops.
 *
 * DER ENTSCHEIDENDE MESSBEFUND (2026-09-08, curl gegen das Shopify-CDN):
 * Ohne Größen-Parameter liefert das CDN die Masterdatei und konvertiert ein
 * PNG NICHT -- auch dann nicht, wenn der Browser `image/avif,image/webp`
 * anbietet:
 *     .../01_Logo_2020_Qi_Blanco-black.png            -> 44 877 B  image/png
 *     .../01_Logo_2020_Qi_Blanco-black.png&width=150  ->  5 000 B  image/webp
 *     .../01_Logo_2020_Qi_Blanco-black.png&width=300  -> 10 694 B  image/avif
 * Erst der Größen-Parameter schaltet die Transformations-Pipeline ein, und
 * erst die verhandelt das Format. Ein JPEG wird auch ohne Parameter zu WebP
 * (dort wirkt die Verhandlung), ein PNG nicht. Wer also nur auf "das CDN macht
 * doch Content-Negotiation" vertraut, lässt bei jedem PNG den ganzen Gewinn
 * liegen -- und die Marken-Assets des Shops sind ueberwiegend PNG.
 *
 * DESHALB SETZT `bildQuellen` AUCH DEN `src`, nicht nur das srcset.
 */

/**
 * Breiten-Leiter für eine bekannte Anzeigebreite.
 *
 * @param {number} anzeigeBreite  Breite der Flaeche in CSS-Pixeln
 * @param {{dprStufen?: number[], mindestBreite?: number, masterBreite?: number|null}} [opt]
 * @returns {number[]} aufsteigend, ohne Dubletten
 */
export function bildLeiterFuer(anzeigeBreite, opt = {}) {
  const {dprStufen = [1, 2, 3], mindestBreite = 0, masterBreite = null} = opt;
  const roh = dprStufen.map((d) => Math.ceil(anzeigeBreite * d));
  const geklemmt = roh.map((w) => {
    let x = Math.max(w, mindestBreite);
    // Shopify skaliert nie hoch; eine Sprosse über dem Master wäre eine
    // Dublette der Master-Sprosse und würde den w-Deskriptor ueberzeichnen.
    if (masterBreite) x = Math.min(x, masterBreite);
    return x;
  });
  return [...new Set(geklemmt)].sort((a, b) => a - b);
}

/**
 * Vollstaendiger Satz Bildquellen für eine Shopify-CDN-URL.
 *
 * FAIL-SOFT (wie `bildSrcSet`): bei einer Nicht-CDN-URL kommt die Quelle
 * unveraendert zurück, srcSet/sizes bleiben `undefined`. React rendert die
 * Attribute dann gar nicht -- das Bild verhaelt sich exakt wie vorher. Ein
 * falsch umgeschriebener Fremd-Host wäre ein 404 statt eines nur nicht
 * optimierten Bildes.
 *
 * `mindestBreite` ist der Riegel für Bilder, deren AUFLOESUNG inhaltlich
 * trägt (amtliche Grafiken mit QR-Code). Sie ist bewusst ein Parameter und
 * kein Sonderfall im Code: wer ein solches Bild einbaut, muss die Zahl
 * nennen, statt sich auf einen Vorgabewert zu verlassen.
 *
 * @param {string} url
 * @param {{anzeigeBreite: number, dprStufen?: number[], mindestBreite?: number,
 *          masterBreite?: number|null, sizes?: string}} opt
 * @returns {{src: string, srcSet: string|undefined, sizes: string|undefined}}
 */
export function bildQuellen(url, opt) {
  const {anzeigeBreite, sizes} = opt || {};
  if (!url || !CDN_RX.test(url) || !anzeigeBreite) {
    return {src: url, srcSet: undefined, sizes: undefined};
  }
  const leiter = bildLeiterFuer(anzeigeBreite, opt);
  const trenner = url.includes('?') ? '&' : '?';
  const mitBreite = (w) => `${url}${trenner}width=${w}`;

  return {
    // Der `src` ist die UNTERSTE Sprosse, nicht die Masterdatei: er ist das,
    // was ein Browser ohne srcset-Auswertung zieht -- und was in den
    // Ladeplan der Seite eingeht, bevor srcset ausgewertet ist.
    src: mitBreite(leiter[0]),
    srcSet: leiter.map((w) => `${mitBreite(w)} ${w}w`).join(', '),
    sizes: sizes || `${anzeigeBreite}px`,
  };
}
