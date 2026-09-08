import {belegeFuer, KAKAO_BELEGE} from '~/lib/kakao-belege';

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
 * WARUM JEDE ZEILE LABOR UND DATUM TRÄGT: die Zeugnisse stammen aus August bis
 * November 2025. Ob zur heute verkauften Charge ein neueres vorliegt, ist auf
 * unserer Seite nicht feststellbar — deshalb behauptet hier nichts Aktualität,
 * und der Leser sieht das Datum, bevor er klickt.
 *
 * `sorte` ist der Produkt-Handle (crystal-cacao-awake | crystal-cacao-create).
 * Ohne `sorte` werden alle Belege gezeigt (Übersichtsseite).
 */
export function Belege({sorte, titel = 'Prüfdokumente zum Nachlesen', id}) {
  const liste = sorte ? belegeFuer(sorte) : KAKAO_BELEGE;
  if (!liste.length) return null;

  return (
    <div className="cc-belege" id={id}>
      <h3 className="cc-belege__titel">{titel}</h3>
      <ul className="cc-belege__liste">
        {liste.map((b) => (
          // download-Attribut bewusst NICHT gesetzt: ein PDF soll sich im
          // Browser öffnen lassen. Christians Wort war „öffnen", und ein
          // erzwungener Download nimmt dem Prüfenden den schnellen Blick.
          <li key={b.id}>
            <a
              className="cc-belege__link"
              href={b.url}
              target="_blank"
              rel="noreferrer"
            >
              {b.titel}
            </a>
            <span className="cc-belege__quelle">
              {b.unterzeile}
              {b.sprache === 'en' ? ' · englisch' : ''}
            </span>
          </li>
        ))}
      </ul>
      <p className="cc-belege__grenze">
        Die Prüfzeugnisse von Primoris untersuchen Schadstoffe an der rohen
        Bohne, die Analysen von Dartsch Scientific die Nährstoffe der fertigen
        Mischung. Jedes Dokument trägt sein Prüfdatum.
      </p>
    </div>
  );
}
