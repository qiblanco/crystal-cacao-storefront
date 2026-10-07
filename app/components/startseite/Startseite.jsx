import {SortenSlider} from './SortenSlider';
import {Analyseprofile} from './Analyseprofile';
import {KaffeeVergleich} from './KaffeeVergleich';
import {Belege} from '~/components/reusables/Belege';
import {AbsichtHinweis} from '~/components/reusables/AbsichtHinweis';
import {KursEintragung} from '~/components/reusables/KursEintragung';
import {
  bild,
  Zubereitung,
  KURS_VIDEOS,
  B_CHART,
  B_BANNER_FLOW,
  B_BANNER_NATURREIN,
  B_MUSTER,
  B_BAUER_FRUCHT,
  B_BAUER_TONNE,
  B_KURS_MOCKUP,
  B_RITUAL_QUADRAT,
  B_LOGO_KAKAO,
  B_LOGO_KAFFEE,
  B_LOGO_ENERGY,
} from '~/components/product-pages/Kakao';

/**
 * DIE KAFFEE-KURVE STEHT HIER IN EINEM ANDEREN RASTER ALS AUF DER KAUFSEITE:
 * .cc-akt__innen hat mobil 24 px Rand je Seite (Kaufseite 32), ab 48em
 * 32 px Rand + 64 px Spalten-Luecke, gedeckelt bei 72rem = 1152 px. Live
 * gemessen 2026-10-06: 390 -> 342 px, 768 -> 320, 1024 -> 448, ab 1152 -> 512.
 * Mit den Kaufseiten-sizes (100vw - 64px) bekam das Telefon 660w fuer 684
 * gebrauchte Pixel (0,96x, Befund ladeverhalten-bildmasse-kakao).
 */
const SIZES_KURVE_START =
  '(min-width: 1152px) 512px, (min-width: 48em) calc((100vw - 128px) / 2), calc(100vw - 48px)';

/**
 * DIE STARTSEITE AUF HIGH-END-NIVEAU — seit 2026-10-02.
 *
 * Grossjob 20261002-GROSSJOB-crystal-cacao-startseite-hochwertig-slider-
 * profile-responsiv. Konzept: crystal-cacao-node/bau/startseite-hochwertig-
 * 20261002/KONZEPT.html (PDF im Postausgang, Crystal-Startseite_Konzept_
 * 2026-10-02.pdf).
 *
 * Christian: „Ein bestes Beispiel ist die Zellen-Schlafschutz-Seite, wo man
 * wirklich der Reihe nach sagt: Was ist der Mehrwert des Produkts? Und dann
 * Wirkung, Bewertung, Studien … so muss diese Frontseite auch aufgezogen
 * werden.“
 *
 * DIE REIHENFOLGE (jeder Abschnitt ein „Akt“ mit eigenem Hintergrund):
 *    1 Sorten-Slider        welche Produkte gibt es, worin unterscheiden sie sich
 *    2 Analyseprofile       direkt danach, wie bestellt
 *    3 Was du spürst        Mehrwert (Nutzerstimmen, Bestandstexte)
 *    4 Podcast              Christian erklärt den Unterschied (ab 8:30)
 *    5 Kaffee-Vergleich     Wirkung, je Tasse
 *    6 Bewertungen          drei echte Google-Bewertungen + Gründer
 *    7 Belege               sechs Prüfdokumente + Kristallmuster
 *    8 Herkunft             Bauern, Anbau, 6.000 Jahre Tradition
 *    9 Ritual               Zubereitung (Wortlaut der Packung) + 28 Tage
 *   10 Kauf                 Sortenkacheln, Mengenrabatt, Garantie
 *   11 Online-Kurs          für alle, die noch nicht kaufen
 *
 * DIE REIHENFOLGE 3 → 4 → 5 IST GEMESSEN, NICHT GEWÄHLT: probe_podcast_einstieg
 * verlangt im Markup „Reine Pflanzenkraft“ < cc-podcast < „Ohne Koffein-Crash“
 * < #cc-pruefdokumente < #recommended-products (Christians Auftrag vom
 * 2026-09-08: der Podcast erklärt, wodurch sich der Kakao unterscheidet, die
 * Tabelle liefert danach die Zahlen).
 *
 * DAS ABSTANDSSYSTEM: jeder Akt trägt NUR Innenabstand (64 px Telefon, 96 px
 * ab 48em), kein Außenrand; eingehängte Bausteine verlieren im Akt ihre
 * eigenen Außenränder (startseite.css). Die bisherige Seite stapelte
 * `mt-[10vh]!`, `mt-[100px]!` und Bild-`mb-[10vh]` auf den Innenabstand und
 * kam so auf 250 bis 390 px leere Fläche.
 *
 * TEXTE: Wo ein Abschnitt aus der bisherigen Startseite (Kakao.jsx) stammt,
 * steht sein Text im Wortlaut. Neu geschrieben sind nur Eyebrows, Leads und
 * die Sätze des Sliders und der Profile (aus den Herstellerangaben in
 * sorten-profil.js abgeleitet).
 *
 * DIE BISHERIGE STARTSEITE ist nicht weg: /?fassung=bisher rendert sie
 * unverändert (app/lib/startseite-fassung.js, Rückweg = eine Zeile).
 *
 * @param {{produkte: object|null, stimmen: import('react').ReactNode, sorten: import('react').ReactNode, podcast: import('react').ReactNode}} props
 */
export function Startseite({produkte, stimmen, sorten, podcast}) {
  return (
    <div className="home cc-start">
      <SortenSlider produkte={produkte} />
      <Analyseprofile />
      <Mehrwert />
      <section className="cc-akt cc-akt--flaeche cc-start-podcast">
        <div className="cc-akt__innen">{podcast}</div>
      </section>
      <KaffeeVergleich
        kurve={{...bild(B_CHART), sizes: SIZES_KURVE_START}}
        logos={{
          kakao: bild(B_LOGO_KAKAO),
          kaffee: bild(B_LOGO_KAFFEE),
          energy: bild(B_LOGO_ENERGY),
        }}
      />
      <section className="cc-akt cc-akt--flaeche cc-start-stimmen">
        <div className="cc-akt__innen">
          {stimmen}
          <AbsichtHinweis id="cc-absicht-start" />
        </div>
      </section>
      <BelegeAkt />
      <Herkunft />
      <Ritual />
      <section className="cc-akt cc-akt--flaeche cc-start-kauf">
        <div className="cc-akt__innen">
          {sorten}
          <div className="cc-kauf__infos">
            <Mengenrabatt />
            <Garantie />
          </div>
        </div>
      </section>
      <OnlineKurs />
    </div>
  );
}

/* ---- 3 · Was du spürst -------------------------------------------------- */

/** Bestandstexte aus Kakao.jsx `Benefits`, im Wortlaut. */
const VORTEILE = [
  {
    titel: 'Wach',
    text: 'Unsere Nutzer mögen, dass man wach ist, ohne sich aufgedreht zu fühlen. Wenig Koffein, kombiniert mit natürlichem Theobromin, sorgt für ein ruhiges, klares Gefühl.',
  },
  {
    titel: 'Klar',
    text: 'Viele Nutzer merken, dass sie ruhiger und klarer im Kopf sind und sich besser konzentrieren können.',
  },
  {
    titel: 'Mineralisiert',
    text: 'Ein unkomplizierter Begleiter für jeden Tag, mit 24 natürlich enthaltenen Mineralstoffen und Spurenelementen.',
  },
  {
    titel: 'Antioxidantien-Boost',
    // Dieser Satz ist der Marker der Scharfschalt-Kette (bin/scharfschalten,
    // bin/scharfschalt-wache, probe_startseite_ist_kakao, probe_ziel_kundenrand):
    // „Reine Pflanzenkraft, ganz ohne Zucker“. Nicht umformulieren.
    text: 'Reine Pflanzenkraft, ganz ohne Zucker. Eine Tasse Kristall Kakao® liefert viele natürlich enthaltene Antioxidantien: pur, unverfälscht und ohne Zusätze.',
  },
  {
    titel: '100 % naturrein',
    text: 'Aus einer überlieferten Kakaolinie mit mehr als 6.300 Jahren Ursprung. Naturbelassen, unverfälscht und in Bio-Qualität.',
  },
];

function Mehrwert() {
  const flow = bild(B_BANNER_FLOW);
  return (
    <section className="cc-akt cc-akt--grund cc-mehrwert" aria-labelledby="cc-mehrwert-titel">
      <div className="cc-akt__innen">
        <header className="cc-akt__kopf">
          <p className="cc-eyebrow">Was du spürst</p>
          <h2 id="cc-mehrwert-titel">Wach. Klar. Mineralisiert.</h2>
        </header>
        <div className="cc-zweispalter">
          <figure className="cc-bildflaeche cc-bildflaeche--hoch">
            <img
              {...flow}
              sizes="(min-width: 72em) 540px, (min-width: 48em) 46vw, calc(100vw - 40px)"
              loading="lazy"
              alt="Zwei Menschen an einem Cafétisch, sie mit einem Tablet, er am Laptop, daneben zwei Tassen"
            />
          </figure>
          <ul className="cc-vorteile">
            {VORTEILE.map((v) => (
              <li key={v.titel}>
                <h3>{v.titel}</h3>
                <p>{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---- 7 · Belege --------------------------------------------------------- */

function BelegeAkt() {
  const muster = bild(B_MUSTER);
  return (
    <section className="cc-akt cc-akt--grund cc-start-belege" aria-labelledby="cc-belege-akt-titel">
      <div className="cc-akt__innen">
        <header className="cc-akt__kopf">
          <p className="cc-eyebrow">Studien und Belege</p>
          <h2 id="cc-belege-akt-titel">Jede Sorte im Labor geprüft</h2>
          <p className="cc-akt__lead">
            Sechs Dokumente aus drei Laboren, je Sorte drei. Jedes trägt sein
            Prüfdatum, und du kannst es selbst öffnen.
          </p>
        </header>
        <Belege id="cc-pruefdokumente" />
        <div className="cc-zweispalter cc-muster">
          <div className="cc-zweispalter__text">
            <h3>Der Unterschied zeigt sich im Muster</h3>
            <p>
              Das charakteristische Leopardenmuster von Crystal Cacao® ist
              sichtbarer Beweis der kristallinen Struktur. Sie entsteht durch
              naturbelassene Verarbeitung und bewahrt die volle Pflanzenkraft.
            </p>
            <p>
              Nach dem Vermahlen lassen wir unserem Kakao Zeit. Er reift in
              Ruhe nach und kristallisiert dabei langsam aus. Daher kommt das
              feine Kristallmuster, das du im Bruch der Tafel siehst.
            </p>
            <p>
              <b>Frei von Zucker, frei von Zusätzen, 100 % Kakao.</b>
            </p>
          </div>
          <figure className="cc-bildflaeche">
            <img
              {...muster}
              sizes="(min-width: 72em) 540px, (min-width: 48em) 46vw, calc(100vw - 40px)"
              loading="lazy"
              alt="Nahaufnahme der Kakaomasse: dicht an dicht liegende, hell umrandete Kristallstrukturen"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---- 8 · Herkunft ------------------------------------------------------- */

function Herkunft() {
  const ernte = bild(B_BANNER_NATURREIN);
  const frucht = bild(B_BAUER_FRUCHT);
  const tonne = bild(B_BAUER_TONNE);
  return (
    <section className="cc-akt cc-akt--flaeche cc-herkunft" aria-labelledby="cc-herkunft-titel">
      <div className="cc-akt__innen">
        {/* Bild mit Ueberschrift darauf: `div > img + h2`. Die Kontrast-Probe
            des Ladens (pruefungen/probe_startseite_kontrast_telefon.py) misst
            genau diese Form. Die Ueberschrift hat Groesse, Gewicht und
            Ausrichtung jeder anderen H2 der Seite (EIN H2-Stil). */}
        <div className="cc-band">
          <img
            {...ernte}
            sizes="(min-width: 72em) 1104px, calc(100vw - 40px)"
            loading="lazy"
            alt="Hände schneiden eine reife Kakaofrucht mit einer Gartenschere direkt vom Baum"
          />
          {/* Kurz mit Absicht: bei 320 px und 200 % Schrift fuellte „Die Wurzeln
              von Crystal Cacao®“ fast einen ganzen Bildschirm, und der feste
              Seitenkopf lag ueber den oberen Zeilen (Kontrast-Probe Arm B). */}
          <h2 id="cc-herkunft-titel">Unsere Wurzeln</h2>
        </div>
        <div className="cc-zweispalter">
          <div className="cc-zweispalter__text">
            <p>
              <b>Crystal Cacao®</b> stammt aus einer über{' '}
              <b>6.000 Jahre alten Kakaotradition</b> im peruanischen
              Amazonasgebiet. Unsere Partner bauen dort mit Sorgfalt und
              Achtung für Natur und Mensch den seltenen Edelkakao an, der die
              Basis für unseren <b>Kristall Kakao®</b> bildet.
            </p>
            <ol className="cc-liste-nummern">
              <li>Direkt &amp; fair gehandelt, von kleinen Familienbetrieben</li>
              <li>Nachhaltig angebaut in biodiverser Agroforstwirtschaft</li>
              <li>Verarbeitet bei niedrigen Temperaturen für maximale Pflanzenkraft</li>
            </ol>
            <p>
              Jeder Schluck verbindet dich mit einer{' '}
              <b>6.000-jährigen Kakaotradition</b> und mit den{' '}
              <b>Menschen, die ihn mit Hingabe anbauen.</b>
            </p>
          </div>
          <div className="cc-bildpaar">
            <figure className="cc-bildflaeche cc-bildflaeche--quadrat">
              <img
                {...frucht}
                sizes="(min-width: 72em) 264px, (min-width: 48em) 22vw, calc(50vw - 28px)"
                loading="lazy"
                alt="Kakaobauer mit Machete im Kakaowald, in der Hand eine geerntete Kakaofrucht"
              />
            </figure>
            <figure className="cc-bildflaeche cc-bildflaeche--quadrat">
              <img
                {...tonne}
                sizes="(min-width: 72em) 264px, (min-width: 48em) 22vw, calc(50vw - 28px)"
                loading="lazy"
                alt="Kakaobauer trägt eine große Erntetonne auf der Schulter durch die Plantage"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- 9 · Ritual --------------------------------------------------------- */

function Ritual() {
  const ritual = bild(B_RITUAL_QUADRAT);
  return (
    <section className="cc-akt cc-akt--grund cc-ritual" aria-labelledby="cc-ritual-titel">
      <div className="cc-akt__innen">
        {/* Zwei Spalten, jede mit ihrer eigenen H2: links die Zubereitung
            (Baustein mit H2 „Zubereitung“, Wortlaut der Packung), rechts die
            28-Tage-Reise. Kein Akt-Kopf darueber, sonst stuenden drei H2
            uebereinander. */}
        <div className="cc-zweispalter cc-zweispalter--oben">
          <Zubereitung />
          <div className="cc-ritual__reise">
            <h2 id="cc-ritual-titel">Lust auf eine 28-tägige Reise?</h2>
            <figure className="cc-bildflaeche cc-bildflaeche--quadrat">
              <img
                {...ritual}
                sizes="(min-width: 72em) 540px, (min-width: 48em) 46vw, calc(100vw - 40px)"
                loading="lazy"
                alt="Lächelnde Frau im weißen Hemd, das Kinn auf die Hand gestützt"
              />
            </figure>
            <p>
              Mit nur <b>einer Tasse Crystal Cacao® am Tag</b> schaffst du dir
              einen festen Anker im Alltag: für mehr Achtsamkeit, Fokus und
              innere Balance. Mit einer Packung startest du in deine{' '}
              <b>28-Tage-Achtsamkeitskur</b>.
            </p>
            <dl className="cc-ritual__schritte">
              <div>
                <dt>☕ Dein Ritual</dt>
                <dd>
                  Täglich 15 g <b>Crystal Cacao®</b> mit heißem Wasser oder Milch
                  zubereiten und in Ruhe genießen.
                </dd>
              </div>
              <div>
                <dt>🌀 Dein Moment</dt>
                <dd>
                  Verbinde die Tasse mit etwas, das dir guttut: Atmen,
                  Journaling oder Stille.
                </dd>
              </div>
              <div>
                <dt>✨ Dein Effekt</dt>
                <dd>
                  Schon nach wenigen Tagen spürst du: Mehr Ruhe. Mehr Fokus.
                  Mehr Kraft.
                </dd>
              </div>
              <div>
                <dt>Warum 28 Tage?</dt>
                <dd>
                  Weil sich neue Gewohnheiten nach 4 Wochen fest verankern. So
                  wird aus einer Tasse ein tägliches Ritual.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- 10 · Kauf ---------------------------------------------------------- */

function Mengenrabatt() {
  // Wortlaut aus Kakao.jsx `SparSection`. Die Prozente sind Shopify-Rabatte
  // (Grossjob 20260930 Partnercodes/Mengenrabatt); diese Seite nennt sie nur.
  return (
    <div className="cc-mengenrabatt">
      <h3>Jetzt sparen: bis zu 30 %</h3>
      <p>Spare bis zu 30 %, sortenübergreifend kombinierbar.</p>
      <ul>
        <li>
          <b>2 Packungen</b> = 20 % Rabatt + Gratisversand innerhalb Deutschlands
        </li>
        <li>
          <b>3 Packungen</b> = 30 % Rabatt + Gratisversand innerhalb Deutschlands
        </li>
      </ul>
    </div>
  );
}

function Garantie() {
  // Wortlaut aus Kakao.jsx (Versprechen + „Unsere Garantie“).
  return (
    <div className="cc-garantie">
      <h3>Unser Versprechen an dich</h3>
      <p>
        <b>Crystal Cacao®</b> liefert dir ein{' '}
        <b>besseres Gefühl, mehr Klarheit und stabile Energie.</b> Wenn nicht,
        bekommst du dein Geld zurück. Ohne Diskussion.
      </p>
      <ul className="cc-garantie__punkte">
        <li>20 Tage testen, komplett risikofrei</li>
        <li>100 % Geld-zurück-Garantie, selbst bei geöffneter Packung</li>
        <li>Wissenschaftlich analysiert</li>
        <li>Bio-zertifiziert &amp; aromasicher verpackt</li>
      </ul>
    </div>
  );
}

/* ---- 11 · Online-Kurs --------------------------------------------------- */

function OnlineKurs() {
  const mockup = bild(B_KURS_MOCKUP);
  return (
    <section className="cc-akt cc-akt--grund cc-kurs" aria-labelledby="cc-kurs-titel">
      <div className="cc-akt__innen">
        <header className="cc-akt__kopf">
          <p className="cc-eyebrow">Gratis Online Kurs</p>
          <h2 id="cc-kurs-titel">Jetzt kostenfrei mitmachen!</h2>
          <p className="cc-akt__lead">
            Erfahre mehr über die Geheimnisse des Zeremonie Kakao und die
            richtige Anwendung. Vier Videolektionen, zusammen knapp eine halbe
            Stunde.
          </p>
        </header>
        <div className="cc-zweispalter cc-zweispalter--oben">
          <ol className="cc-lektionen">
            {KURS_VIDEOS.map((v) => {
              const b = bild(v.src);
              return (
                <li className="cc-lektion" key={v.title}>
                  <figure className="cc-bildflaeche cc-bildflaeche--video">
                    <img
                      {...b}
                      sizes="(min-width: 48em) 200px, 128px"
                      loading="lazy"
                      alt={v.alt}
                    />
                  </figure>
                  <div>
                    <h3>{v.title}</h3>
                    <ul>
                      {v.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="cc-kurs__anmeldung">
            <figure className="cc-bildflaeche cc-bildflaeche--video">
              <img
                {...mockup}
                sizes="(min-width: 72em) 540px, (min-width: 48em) 46vw, calc(100vw - 40px)"
                loading="lazy"
                alt="Kurs Kakao Zeremonie auf Laptop und Telefon"
              />
            </figure>
            <KursEintragung />
            <p className="cc-kurs__hinweis">
              *Deine Eintragung ist absolut unverbindlich. Wenn dir der Kurs
              nicht gefällt, kannst du dich jederzeit mit nur einem Klick wieder
              austragen und du erhältst keine weiteren E-Mails von uns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
