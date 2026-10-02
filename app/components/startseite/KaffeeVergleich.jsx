import {TASSE, TASSEN_VERGLEICH, tassenBalken} from '~/lib/analyseprofil';

/**
 * KaffeeVergleich — „Eine Tasse im Vergleich“ (seit 2026-10-02).
 *
 * Christian, 02.10.2026: „oben, wo der Vergleich stattfindet mit Kaffee und
 * sowas. Das ist viel zu lasch gemacht, man versteht eigentlich gar nicht,
 * worum es geht, und der Slider, der funktioniert auch nicht gescheit.“
 *
 * DER „SLIDER“ WAR DIE WISCHTABELLE (qb-swipetab): auf dem Telefon stand nur
 * die Spalte Crystal Cacao® im Bild, Kaffee und Energydrink lagen rechts
 * daneben (gemessen 02.10., 390 px). Der Vergleich fand also nicht statt.
 *
 * JETZT: dieselbe Tabelle, dieselben Zahlen (analyseprofil.js TASSEN_VERGLEICH,
 * kein Wert geändert), aber
 *   - jede Zelle trägt einen Balken: man SIEHT 21 gegen 100 mg Koffein,
 *   - auf dem Telefon wird jede Zeile ein Raster aus drei Spalten mit der
 *     Stoffbezeichnung darüber: alle drei Getränke stehen ohne Wischen
 *     nebeneinander,
 *   - der Tabellenkopf nennt die Sorte, auf die sich die 15 g beziehen.
 *
 * WAS BLEIBT, WEIL WACHEN DARAN MESSEN (proben/probe_startseite_kanten_und_kopf.py):
 *   - <h2> „Wach. Klar. Ohne Koffein-Crash.“ in einem zweispaltigen Raster,
 *     daneben die Kurve; in derselben Spalte der Absatz mit „schnellen Kick“
 *     und sein Vorgänger auf derselben linken Kante (Achse A/B),
 *   - <table class="cc-vgl"> mit drei Kopfzellen aus <h3> + <h4> (Achse C),
 *   - der Knopf „Analysedaten“ mit dem Stil seines Zwillings „Analyse
 *     anzeigen“ (Achse D, Zwilling in Analyseprofile.jsx).
 *
 * @param {{kurve: {src: string, srcSet?: string, sizes?: string, width?: number, height?: number}, logos: {kakao: object, kaffee: object, energy: object}}} props
 */
export function KaffeeVergleich({kurve, logos}) {
  const spalten = [
    ['kakao', TASSE.kakao, logos.kakao],
    ['kaffee', TASSE.kaffee, logos.kaffee],
    ['energy', TASSE.energy, logos.energy],
  ];
  return (
    <section
      className="cc-akt cc-akt--grund cc-kaffee"
      id="cc-kaffee-vergleich"
      aria-labelledby="cc-kaffee-titel"
    >
      <div className="cc-akt__innen">
        <div className="cc-kaffee__raster">
          <div className="cc-kaffee__text">
            <p className="cc-eyebrow">Eine Tasse im Vergleich</p>
            <h2 id="cc-kaffee-titel">Wach. Klar. Ohne Koffein-Crash.</h2>
            <p>
              Die Wirkung von <b>Kaffee &amp; Energy-Drinks</b> beruht fast
              ausschließlich auf dem <b>hohen Koffeingehalt.</b>
            </p>
            <p>
              Das führt zu einem <b>schnellen Kick,</b>{' '}
              <b>einem schnellen Crash</b> und man{' '}
              <b>braucht immer mehr davon.</b>
            </p>
            <p>
              Eine Tasse Crystal Cacao® hat 21 mg Koffein, eine Tasse Kaffee 80
              bis 100 mg. Dafür steckt im Kakao Theobromin, das Kaffee nicht hat.
            </p>
          </div>
          <figure className="cc-kaffee__kurve">
            <img
              {...kurve}
              loading="lazy"
              alt="Diagramm Fokus und Energie über die Wirkdauer: Kaffee und Energy-Drinks steigen steil an und fallen schnell wieder ab, Crystal Cacao® steigt flacher an und hält lange"
            />
          </figure>
        </div>

        <div className="cc-vgl-rahmen">
          <table className="cc-vgl">
            <caption className="cc-visuell-versteckt">
              Inhaltsstoffe je Tasse: Crystal Cacao® (15 g Create), Kaffee (200 ml), Energydrink (250 ml)
            </caption>
            <thead>
              <tr>
                <th className="cc-vgl__ecke" scope="col">
                  <span className="cc-visuell-versteckt">Inhaltsstoff</span>
                </th>
                {spalten.map(([key, t, logo]) => (
                  <th scope="col" key={key} data-cc-spalte={key}>
                    <img
                      {...logo}
                      width={40}
                      height={40}
                      alt=""
                      loading="lazy"
                      className="cc-vgl__logo"
                    />
                    <h3 className="cc-vgl__name">{t.name}</h3>
                    <h4 className="cc-vgl__menge">{t.menge}</h4>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TASSEN_VERGLEICH.map((zeile) => (
                <tr key={zeile.key}>
                  <th scope="row" className="cc-vgl__stoff">
                    {zeile.stoff}
                  </th>
                  {spalten.map(([key]) => (
                    <td key={key} data-cc-spalte={key}>
                      {zeile[key] ? (
                        <>
                          <span className="cc-vgl__spur" aria-hidden="true">
                            <span
                              className="cc-vgl__balken"
                              style={{width: `${tassenBalken(zeile, key)}%`}}
                            />
                          </span>
                          <span className="cc-vgl__wert">{zeile[key].anzeige}</span>
                        </>
                      ) : (
                        <span className="cc-vgl__leer">
                          <span aria-hidden="true">–</span>
                          <span className="cc-visuell-versteckt">nicht enthalten</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cc-kaffee__fuss">
          <p>
            Diese natürliche Wirkstoffkomposition beschreiben unsere Nutzer als{' '}
            <b>fokussierend, kreativitätsfördernd und lang anhaltend</b>, bei
            einer ruhigen und stabilen Energie. Ganz ohne Zucker und Zusätze.
          </p>
          <a className="btn--secondary cc-knopf-ruhig" href="#cc-pruefdokumente">
            Analysedaten
          </a>
        </div>
      </div>
    </section>
  );
}
