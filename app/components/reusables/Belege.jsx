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
 *
 * ============ KARTEN STATT HANDTUCHSPALTE (2026-09-26) ======================
 * Christian zum Abschnitt: „Sehr hässliche Darstellung ⇒ muss optisch
 * optimiert werden." Gemessen am Kundenrand (1366 px): eine 400 px schmale
 * Spalte in einer 1350 px breiten Seite, Schrift 12,8 px, vier Textfarben,
 * sechsmal dieselben fünf Beschriftungen untereinander.
 * Jetzt ist jeder Beleg eine Karte in der Bauform, die dieser Laden für
 * Sortenkacheln und Vorteile schon hat (Fläche, feine Kante, EIN Bildradius,
 * oben 3 px im Sortenton). Am Telefon stehen die Karten untereinander, ab
 * 60em drei nebeneinander: eine Sorte, eine Reihe. Alles liest sich in
 * 16 px, es gibt zwei Textfarben, und das Gold sitzt nur auf der
 * Unterstreichung dessen, was man anklicken kann.
 *
 * DIE BELEGE SELBST SIND UNVERÄNDERT: dieselben sechs Dokumente, dieselben
 * fünf Angaben je Dokument, dieselbe Reihenfolge (Create vor Awake). Die
 * Datei-Angabe ist zusätzlich selbst ein Link auf das PDF — wer „PDF,
 * englisch, 9 Seiten" liest, will genau dort klicken.
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

/**
 * Der Titel in zwei Zeilen: Art des Dokuments, dann sein Gegenstand.
 * Der Vertrag schreibt beides in EINE Zeichenkette („Schadstoff-Prüfzeugnis ·
 * Amazonas Nativo"). Auf einer Karte brach der Browser genau vor dem
 * Mittelpunkt um, und die zweite Zeile begann mit „·". Getrennt wird deshalb
 * hier, beim Anzeigen — der Mittelpunkt bleibt im Markup stehen (unsichtbar),
 * damit der Titel dort weiterhin wörtlich so steht wie im Vertrag:
 * probe_belege_abrufbar.py zerlegt den Abschnitt an genau diesen Titeln.
 */
export function titelTeile(titel) {
  const i = (titel || '').indexOf(' · ');
  return i < 0 ? [titel, null] : [titel.slice(0, i), titel.slice(i + 3)];
}

/** Die Felder je Beleg, in fester Reihenfolge — das ist die „Tabelle".
 *  Das dritte Element sagt, ob der Wert selbst auf das Dokument verlinkt. */
function felderVon(beleg) {
  return [
    ['Geprüft', beleg.geprueft, false],
    ['Labor', beleg.labor, false],
    ['Datum', beleg.datum, false],
    ['Nummer', beleg.kennung, false],
    ['Datei', dateiZeile(beleg), true],
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
        // die 3-px-Oberkante jeder Karte, wie bei den Sortenkacheln — die
        // Schrift bleibt in beiden Gruppen dieselbe, weil Christian „gleiche
        // Schrift" verlangt hat. Der Sortenakzent übernimmt nirgends die
        // Rolle des Goldes.
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
                  {titelTeile(b.titel)[0]}
                  {titelTeile(b.titel)[1] ? (
                    <>
                      <span className="cc-belege__trenner" aria-hidden="true">
                        {' · '}
                      </span>
                      <span className="cc-belege__gegenstand">
                        {titelTeile(b.titel)[1]}
                      </span>
                    </>
                  ) : null}
                </a>
                {/* dt/dd sind DIREKTE Kinder der dl und liegen damit selbst
                    im Raster — das ist die „Tabelle". Ein Wrapper-<div> je
                    Feld hätte display:contents gebraucht, und das ist genau
                    die Stelle, an der Vorleseprogramme historisch die
                    Listen-Semantik verlieren. */}
                <dl className="cc-belege__daten">
                  {felderVon(b).map(([bezeichnung, wert, verlinkt]) => (
                    <Fragment key={bezeichnung}>
                      <dt>{bezeichnung}</dt>
                      <dd>
                        {verlinkt ? (
                          <a
                            className="cc-belege__datei"
                            href={b.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {wert}
                          </a>
                        ) : (
                          wert
                        )}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Der Schlusssatz bleibt der LETZTE Knoten des Abschnitts:
          crystal-cacao-node/proben/probe_belege_abrufbar.py grenzt den
          Abschnitt an `cc-belege` und `cc-belege__grenze` ab. Stünde er oben,
          fiele jede Sortengruppe aus ihrer Messung. */}
      <p className="cc-belege__grenze">
        Primoris Belgium prüft die rohe Bohne auf Schadstoffe. Dartsch
        Scientific misst an der fertigen Mischung die Nährstoffe, die
        Mineralstoff-Analysen dazu Mineralstoffe und Spurenelemente. Jedes
        Dokument trägt sein Prüfdatum.
      </p>
    </div>
  );
}
