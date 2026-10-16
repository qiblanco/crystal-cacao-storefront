import {
  ANALYSEPROFIL,
  PROFIL_BEZUG,
  PROFIL_DEUTUNG,
  balkenProzent,
  fuehrendeSorte,
} from '~/lib/analyseprofil';
import {SORTEN} from '~/lib/sorten-profil';

/**
 * Analyseprofile — direkt hinter dem Sorten-Slider (Christian, 02.10.2026:
 * „und dass dann stimmig gleich die Analyseprofile dazukommen“).
 *
 * Je Inhaltsstoff ein Balkenpaar Awake / Create, je 100 g. Die Balkenlänge ist
 * relativ zur stärkeren Sorte DERSELBEN Zeile (analyseprofil.js,
 * balkenProzent): der Leser vergleicht die zwei Sorten, nicht Milligramm
 * Polyphenole mit Mikrogramm Anandamid.
 *
 * Die Balken tragen die TEXT-Töne der Sorten (--cc-sorte-*-text, 4,5:1 auf
 * Fläche), nicht die hellen Markentöne: die Farbwelt-Probe des Ladens misst
 * jedes Element mit Sortenfarbe gegen seinen Grund.
 *
 * Der Knopf „Analyse anzeigen“ ist der Zwilling von „Analysedaten“ im
 * Kaffee-Vergleich: gleiches Ziel (#cc-pruefdokumente), gleicher Stil
 * (proben/probe_startseite_kanten_und_kopf.py, Achse D).
 *
 * VERGLEICH MIT ZUSTAND UND RUECKWEG (2026-10-16, Grossjob design-update s06,
 * Register F-021). Kommt der Kunde ueber „Profile vergleichen“ aus einer
 * Sorten-Folie, traegt der Abschnitt diese Sorte (`data-cc-vergleich`): ihre
 * Balken bleiben farbig, die der anderen Sorte werden unbunt
 * (--cc-neutral-vergleich, „die eigene Sorte steht farbig, die andere unbunt
 * daneben“ wie in der Vorlage), und unter dem Lead steht der Weg zurueck zur
 * Sortenwahl. Ohne diesen Weg in den Abschnitt (gescrollt, ohne JavaScript)
 * bleibt er unveraendert.
 */
export function Analyseprofile({vergleich = null, onZurueck = null}) {
  const sorte = vergleich && SORTEN[vergleich] ? vergleich : null;
  return (
    <section
      className="cc-akt cc-akt--flaeche cc-profil"
      id="cc-analyseprofile"
      aria-labelledby="cc-analyseprofile-titel"
      data-cc-vergleich={sorte || undefined}
    >
      <div className="cc-akt__innen">
        <header className="cc-akt__kopf">
          <p className="cc-eyebrow">Analyseprofile · je {PROFIL_BEZUG}</p>
          <h2 id="cc-analyseprofile-titel">Zwei Bohnen, zwei Profile</h2>
          <p className="cc-akt__lead">
            Awake und Create stammen aus zwei verschiedenen Edelkakao-Bohnen.
            Im Labor zeigt sich, worin sie sich unterscheiden.
          </p>
          {sorte ? (
            <p className="cc-profil__zurueck">
              <a
                className="btn--secondary cc-knopf-ruhig"
                href="#cc-start-titel"
                onClick={() => onZurueck?.()}
              >
                Zurück zu {SORTEN[sorte].name}
              </a>
            </p>
          ) : null}
        </header>

        <div className="cc-profil__legende" aria-hidden="true">
          <span data-cc-sorte="awake">Awake</span>
          <span data-cc-sorte="create">Create</span>
        </div>

        <dl className="cc-profil__liste">
          {ANALYSEPROFIL.map((zeile) => {
            const vorn = fuehrendeSorte(zeile);
            return (
              <div className="cc-profil__zeile" key={zeile.key}>
                <dt className="cc-profil__stoff">
                  <span className="cc-profil__stoffname">{zeile.stoff}</span>
                  {zeile.bedeutung ? (
                    <span className="cc-profil__bedeutung">{zeile.bedeutung}</span>
                  ) : null}
                </dt>
                {['awake', 'create'].map((sorte) => (
                  <dd
                    key={sorte}
                    className={`cc-profil__wertzeile${vorn === sorte ? ' is-vorn' : ''}`}
                    data-cc-sorte={sorte}
                  >
                    <span className="cc-profil__sorte">{SORTEN[sorte].name}</span>
                    <span className="cc-profil__spur" aria-hidden="true">
                      <span
                        className="cc-profil__balken"
                        style={{width: `${balkenProzent(zeile, sorte)}%`}}
                      />
                    </span>
                    <span className="cc-profil__wert">
                      {zeile[sorte].anzeige}&nbsp;{zeile.einheit}
                    </span>
                  </dd>
                ))}
              </div>
            );
          })}
        </dl>

        <div className="cc-profil__deutung">
          {['awake', 'create'].map((sorte) => (
            <div className="cc-profil__karte" data-cc-sorte={sorte} key={sorte}>
              <p className="cc-profil__karte-titel">
                {SORTEN[sorte].name}: {SORTEN[sorte].claim}
              </p>
              <p>{PROFIL_DEUTUNG[sorte]}</p>
              <a className="cc-textlink" href={SORTEN[sorte].pfad}>
                Zu {SORTEN[sorte].name}
              </a>
            </div>
          ))}
        </div>

        <div className="cc-profil__fuss">
          <p className="cc-profil__quelle">
            Die Nährstoffe misst Dartsch Scientific an der fertigen Mischung.
            Dazu kommen Mineralstoff-Analysen von SAS hagmann und
            Schadstoff-Prüfzeugnisse von Primoris Belgium für die rohe Bohne.
          </p>
          <a className="btn--secondary cc-knopf-ruhig" href="#cc-pruefdokumente">
            Analyse anzeigen
          </a>
        </div>
      </div>
    </section>
  );
}
