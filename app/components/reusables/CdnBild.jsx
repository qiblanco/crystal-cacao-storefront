/**
 * CdnBild — ein <img> vom Shopify-Datei-CDN, das seine Anzeigegroesse KENNT.
 *
 * ====================================================================
 * WOZU ES DIESEN BAUSTEIN GIBT
 * ====================================================================
 * Gemessen am 2026-09-08 über `app/`: 347 fest verdrahtete
 * cdn.shopify.com-Bildquellen, davon 214 verschiedene Dateien -- und
 * GENAU NULL mit einem Größen-Parameter. Jede dieser Stellen liefert die
 * Masterdatei aus, unabhängig davon, wie klein die Flaeche ist.
 *
 * Der Auftrag von Christian am 2026-09-08 lautete woertlich, es duerfe
 * "kein Handgriff an dieser einen Datei" sein. Deshalb ist der Kern dieses
 * Baus ein BAUSTEIN und keine Reihe von Einzelkorrekturen: wer kuenftig ein
 * CDN-Bild einbaut, nimmt diesen hier und bekommt Größen-Parameter,
 * srcset, sizes und feste Abmessungen, ohne daran zu denken.
 *
 * ====================================================================
 * WARUM `breite`/`hoehe` PFLICHTFELDER SIND
 * ====================================================================
 * Ohne width/height am <img> kennt der Browser das Seitenverhaeltnis erst,
 * wenn das Bild da ist -- die Seite springt beim Nachladen (CLS). Das
 * Kopf-Logo war bis zu diesem Bau genau so gebaut. Die beiden Werte sind
 * hier deshalb kein optionaler Feinschliff: fehlen sie, WARNT der Baustein
 * in der Entwicklung laut. Er wirft NICHT -- ein fehlendes Attribut darf
 * keine Kaufseite abreissen (fail-soft, Hausregel).
 *
 * ====================================================================
 * WAS ER BEWUSST NICHT TUT
 * ====================================================================
 * - Er setzt KEIN `loading="lazy"` von sich aus. Ob ein Bild sofort oder
 *   spaeter geladen wird, ist eine Aussage über die SEITE, nicht über das
 *   Bild -- das erste sichtbare Bild braucht `eager`, und ein Baustein, der
 *   das raet, raet fast immer falsch. Der Aufrufer entscheidet und sagt es.
 * - Er fasst Nicht-CDN-Quellen nicht an (fail-soft über `bildQuellen`).
 * - Er beschneidet nichts (kein crop, kein object-fit): das wäre eine
 *   Aussage über den Bildinhalt.
 *
 * ====================================================================
 * WANN EINE LEITER SCHADET -- `leiterAus` (Nachtrag 2026-09-08, s03 des
 * Grossjobs 20260908-BAU-fachartikel-autorenkasten-...)
 * ====================================================================
 * Ein Größen-Parameter macht ein Bild NICHT immer kleiner. Er schaltet die
 * Transformations-Pipeline ein und ERZEUGT DAS BILD NEU. Oberhalb der
 * Masterbreite liefert das CDN unveraendert zurück (byte-gleich, kein
 * Re-Encode); UNTERHALB kodiert es neu -- und wenn der Master bereits ein
 * knapp kodiertes WebP ist, ist diese Neukodierung SCHLECHTER als das
 * Original, bis die reine Pixelersparnis den Aufschlag ueberholt.
 *
 * Gemessen 2026-09-08 gegen dasselbe CDN, mit
 * `Accept: image/avif,image/webp,...`, je ein eigener Abruf:
 *
 *   BrainScan.webp          Master 876x862,  34 054 B webp
 *       &width=800  -> 55 664 B   (+63,5 %)
 *       &width=680  -> 47 074 B   (+38,2 %)
 *       &width=876  -> 34 054 B   (byte-gleich, kein Re-Encode)
 *   Functional_brain_MRI... Master 800x1066, 15 438 B webp
 *       &width=600  -> 23 990 B   (+55,4 %)
 *       &width=454  -> 19 196 B   (+24,3 %)
 *   Studie2_1.webp          Master 1000x1328, 66 104 B webp
 *       &width=600  -> 49 554 B   (-25,0 %)   <- hier trägt die Leiter
 *
 * Die Leiter trägt also nur, wenn der Master (a) deutlich größer ist als
 * die Flaeche UND (b) in einem schwachen Format vorliegt (PNG, grosszuegiges
 * JPEG, unkomprimiertes WebP). Beim Kopf-Logo, an dem dieser Baustein gebaut
 * wurde, trifft beides zu (2048x720 PNG auf 150 px). Bei einem nur 1,5- bis
 * 3,5-fach ueberdimensionierten, schon knapp kodierten WebP kehrt sich das
 * Vorzeichen um.
 *
 * `leiterAus` ist deshalb KEIN Schalter, sondern eine BEGRÜNDUNG: wer ihn
 * setzt, schreibt die gemessene Zahl hin. Der Baustein setzt dann Masse,
 * loading und decoding wie sonst auch und lässt allein die Quelle in Ruhe.
 * Ein leerer oder zu kurzer Text warnt in der Entwicklung -- ein stiller
 * Schalter wäre von Nachlaessigkeit nicht zu unterscheiden.
 */

import {bildQuellen} from './shopifyBildQuellen';

/**
 * @param {object} p
 * @param {string} p.src              CDN-URL (mit oder ohne ?v=)
 * @param {string} p.alt
 * @param {number} p.anzeigeBreite    groesste Breite der Flaeche in CSS-px
 * @param {number} p.breite           Breite für das Seitenverhaeltnis (width-Attribut)
 * @param {number} p.hoehe            Hoehe für das Seitenverhaeltnis (height-Attribut)
 * @param {number} [p.masterBreite]   echte Breite der Masterdatei, klemmt die Leiter
 * @param {number} [p.mindestBreite]  Riegel für inhaltlich tragende Aufloesung
 * @param {string} [p.sizes]          eigener sizes-Wert, sonst `${anzeigeBreite}px`
 * @param {number[]} [p.zusatzSprossen] GEMESSENE Zusatzbreiten unterhalb der
 *   dpr-Leiter, für Flächen, die mit dem Fenster schrumpfen (s. shopifyBildQuellen)
 * @param {string} [p.leiterAus]     GEMESSENE Begründung, warum hier keine
 *   Leiter gebaut wird (der Master ist bereits die guenstigste Sprosse)
 * @param {'lazy'|'eager'} [p.loading]
 *
 * `fetchPriority` ist bewusst NICHT durchgereicht: React 18.3 (dieses Repo)
 * kennt das Attribut noch nicht und würde es als unbekannte Eigenschaft
 * verwerfen. Wer es braucht, reicht es als `{...rest}` durch und misst nach.
 */
export function CdnBild({
  src,
  alt,
  anzeigeBreite,
  breite,
  hoehe,
  masterBreite,
  mindestBreite,
  sizes,
  zusatzSprossen,
  leiterAus,
  loading,
  decoding,
  ...rest
}) {
  if (import.meta.env?.DEV && leiterAus !== undefined && String(leiterAus).trim().length < 20) {
    // Eine Begründung, die niemand lesen kann, ist keine. 20 Zeichen sind
    // die Grenze zwischen "gemessen und aufgeschrieben" und "abgeschaltet".
    console.warn(
      `[CdnBild] leiterAus ohne belastbare Begründung (${String(alt).slice(0, 40)}) — ` +
        'nenne die gemessene Zahl, sonst ist es ein stiller Schalter.',
    );
  }

  if (import.meta.env?.DEV && (!breite || !hoehe)) {
    // Laut, aber nicht toedlich: eine fehlende Abmessung ist ein Layout-
    // Sprung, kein Grund, die Seite abzureissen.
    console.warn(
      `[CdnBild] ohne breite/hoehe gebaut (${String(alt).slice(0, 40)}) — ` +
        'die Seite springt beim Nachladen.',
    );
  }

  /*
   * `breite`/`hoehe` sind das SEITENVERHAELTNIS für die Attribute -- im
   * Bestand stehen dort oft schon die ANZEIGE-Masse (z.B. 325x217), nicht
   * die der Masterdatei. Sie duerfen deshalb NICHT als `masterBreite` in die
   * Leiter gehen: das haette die Leiter auf 1x geklemmt und genau die
   * 2x/3x-Sprossen entfernt, wegen derer es sie gibt. Wer den Master kennt,
   * nennt ihn ausdrücklich; wer nicht, bekommt die ungeklemmte Leiter --
   * eine Sprosse über dem Master liefert ohnehin nur den Master zurück.
   */
  // `leiterAus` gesetzt: Quelle unveraendert, alles andere wie sonst. Das ist
  // exakt das Verhalten von `bildQuellen` bei einer Nicht-CDN-URL -- der
  // fail-soft-Ausgang, hier bewusst und mit Begründung gewählt statt
  // zufaellig getroffen.
  const q = leiterAus
    ? {src, srcSet: undefined, sizes: undefined}
    : bildQuellen(src, {
        anzeigeBreite,
        mindestBreite,
        masterBreite: masterBreite || null,
        sizes,
        zusatzSprossen,
      });

  return (
    <img
      src={q.src}
      srcSet={q.srcSet}
      sizes={q.sizes}
      alt={alt}
      width={breite}
      height={hoehe}
      loading={loading}
      decoding={decoding ?? 'async'}
      {...rest}
    />
  );
}
