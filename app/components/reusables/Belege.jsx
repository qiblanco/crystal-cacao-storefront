import {Fragment} from 'react';

import {belegeNachSorte} from '~/lib/kakao-belege';

/**
 * Belege — die Prüfdokumente zum Öffnen, für den Besucher, der nachrechnen will.
 *
 * WARUM ALS LISTE UND NICHT ALS KNOPF: dieselbe Entscheidung wie beim
 * Gewährleistungshinweis (Christian am 2026-09-08: „der Button ist mega groß und
 * komisch, das sollte einfach als weitere Zeile bei den Gimmicks aufgelistet
 * werden"). Ein Beleg soll auffindbar sein, nicht mit der Kaufhandlung um
 * Aufmerksamkeit ringen. Die Zeilen sind Textlinks in der Form der
 * Vertrauensliste darüber.
 *
 * WARUM JEDE ZEILE LABOR UND DATUM TRÄGT: die Dokumente stammen aus August 2025
 * bis März 2026. Ob zur heute verkauften Charge ein neueres vorliegt, ist auf
 * unserer Seite nicht feststellbar — deshalb behauptet hier nichts Aktualität,
 * und der Leser sieht das Datum, bevor er klickt.
 *
 * ============ WARUM SORTENREIN UND WARUM CREATE ZUERST (2026-09-10) ==========
 * Christian: „das sollte wirklich noch schöner sortenrein angezeigt werden:
 * also zuerst CREATE und dann AWAKE, mit dann jeweils drei Prüfzeugnissen."
 * Vorher standen die vier Dokumente flach untereinander, nach ART sortiert
 * (beide Primoris, dann beide Dartsch). Wer wissen wollte, was zu SEINER Sorte
 * gehört, musste „Amazonas Nativo" und „Piura Blanco" den Sorten zuordnen —
 * und das steht nirgends auf der Seite. Die Zuordnung ist im Vertrag belegt
 * (Feld `produkt_quelle`), nicht geraten; die Gruppierung macht sie sichtbar.
 * Die Reihenfolge kommt aus `KAKAO_SORTEN`, nicht aus einer Sortierung.
 *
 * ============ WARUM DIE ZEILE HIER ZUSAMMENGESETZT WIRD ======================
 * Der Vorgänger nahm eine fertige Zeile aus den Daten und hängte die Sprache
 * an. Bei einem Dokument stand sie dort schon, und der Kunde las
 * „PDF, englisch · englisch". `dateiZeile` ist jetzt die EINZIGE Stelle, an
 * der Format, Sprache und Umfang zu Text werden — eine Sprache kann baulich
 * nicht mehr zweimal erscheinen, weil sie nur an einer Stelle geschrieben wird.
 */

/** Sprachnamen für den Leser. Ein unbekannter Code wird GENANNT, nicht
 *  verschluckt: eine stille Lücke sähe aus wie „Sprache egal". */
const SPRACHE = {de: 'deutsch', en: 'englisch'};

/**
 * Die Datei-Zeile: Format, Sprache, Umfang — in dieser Reihenfolge, immer.
 * Fehlt ein Teil, fällt genau er weg und nicht die ganze Zeile.
 */
export function dateiZeile(beleg) {
  const teile = [];
  if (beleg.format) teile.push(beleg.format);
  if (beleg.sprache) teile.push(SPRACHE[beleg.sprache] || beleg.sprache);
  if (beleg.seiten) {
    teile.push(beleg.seiten === 1 ? '1 Seite' : `${beleg.seiten} Seiten`);
  }
  return teile.join(', ');
}

/** Die Felder je Beleg, in fester Reihenfolge — das ist die „Tabelle". */
function felderVon(beleg) {
  return [
    ['Geprüft', beleg.geprueft],
    ['Labor', beleg.labor],
    ['Datum', beleg.datum],
    ['Nummer', beleg.kennung],
    ['Datei', dateiZeile(beleg)],
  ].filter(([, wert]) => Boolean(wert));
}

/**
 * `sorte` ist der Produkt-Handle (crystal-cacao-awake | crystal-cacao-create).
 * Ohne `sorte` werden alle Sorten gezeigt (Übersichts-/Startseite).
 */
export function Belege({sorte, titel = 'Prüfdokumente zum Nachlesen', id}) {
  const gruppen = belegeNachSorte(sorte || null);
  if (!gruppen.length) return null;

  // Auf einer Kaufseite gibt es nur eine Sorte, und die steht in der
  // Überschrift der Seite bereits. Eine zweite Überschrift mit demselben
  // Produktnamen wäre eine Wiederholung, keine Ordnung.
  const zeigeSortenTitel = gruppen.length > 1;

  return (
    <div className="cc-belege" id={id}>
      <h3 className="cc-belege__titel">{titel}</h3>

      {gruppen.map((gruppe) => (
        // data-cc-sorte ist die bestehende Sortensprache dieser Seite
        // (kakao-seiten.css, Christian 2026-09-01: „zwei unterschiedliche
        // Farbgebungen … dezent entsprechend nutzen"). Sie faerbt hier NUR
        // den schmalen Balken an der Überschrift — die Schrift bleibt in
        // beiden Gruppen dieselbe, weil Christian „gleiche Schrift" verlangt
        // hat. Der Sortenakzent übernimmt nirgends die Rolle des Goldes.
        <section
          className="cc-belege__sorte"
          key={gruppe.key}
          data-cc-sorte={gruppe.akzent || undefined}
        >
          {zeigeSortenTitel ? (
            <h4 className="cc-belege__sorten-titel">{gruppe.titel}</h4>
          ) : null}
          <ul className="cc-belege__liste">
            {gruppe.belege.map((b) => (
              // download-Attribut bewusst NICHT gesetzt: ein PDF soll sich im
              // Browser öffnen lassen. Christians Wort war „öffnen", und ein
              // erzwungener Download nimmt dem Prüfenden den schnellen Blick.
              <li className="cc-belege__zeile" key={b.id}>
                <a
                  className="cc-belege__link"
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {b.titel}
                </a>
                {/* dt/dd sind DIREKTE Kinder der dl und liegen damit selbst
                    im Raster — das ist die „Tabelle". Ein Wrapper-<div> je
                    Feld hätte display:contents gebraucht, und das ist genau
                    die Stelle, an der Vorleseprogramme historisch die
                    Listen-Semantik verlieren. */}
                <dl className="cc-belege__daten">
                  {felderVon(b).map(([bezeichnung, wert]) => (
                    <Fragment key={bezeichnung}>
                      <dt>{bezeichnung}</dt>
                      <dd>{wert}</dd>
                    </Fragment>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="cc-belege__grenze">
        Die Prüfzeugnisse von Primoris untersuchen Schadstoffe an der rohen
        Bohne. Die Nährstoff-Analysen von Dartsch Scientific messen die
        Nährstoffe der fertigen Mischung, die Mineralstoff-Analysen ihre
        Mineralstoffe und Spurenelemente. Jedes Dokument trägt sein Prüfdatum.
      </p>
    </div>
  );
}
