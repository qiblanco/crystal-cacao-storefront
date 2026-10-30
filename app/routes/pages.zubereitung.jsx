import {useRef, useState} from 'react';
import {Link} from 'react-router';

import zubereitungStyles from '~/styles/zubereitung.css?url';
import {ABSENDER_MARKE, markenOrganisation} from '~/lib/kakao-zone';
import {brotkrume, teilbildSignale} from '~/lib/kakao-seo';
import {canonicalLink, CANONICAL_ORIGIN} from '~/lib/seo';
import {ORG_ID, organizationSchema} from '~/lib/entity-schema';
import {SORTEN} from '~/lib/sorten-profil';
import {isoMitZone} from '~/lib/datum';
import {
  reelBild as schrittBild,
  ZUBEREITUNG_PFAD,
  ZUBEREITUNG_REEL,
} from '~/data/zubereitung-reel';

/**
 * ZUBEREITUNG — der Reiter mit dem Reel als Basis.
 *
 * Job 20261030-crystal-cacao-zubereitung-reiter-reel-design-99, Christian
 * am 28.10.2026 wörtlich: „Dass wir da nochmal schick irgendwie vielleicht
 * oben einen Reiter Zubereitung machen oder sowas und dann dieses Video als
 * Basis nehmen und dann unten drunter einfach gekonnt mit 99 von 100 Punkten
 * was bauen lassen, dass es optisch schön ausschaut."
 *
 * DAS VIDEO IST DAS REEL DES EIGENEN KANALS, NICHT EINGEBETTET.
 * https://www.instagram.com/reel/Dd6WjfouvDW/ gehört @crystal.cacao
 * (og:url und Graph business_discovery, 30.09.2026). Das mp4 liegt auf dem
 * Shopify-CDN wie die Kakao-Stimmen (app/data/ig-testimonials.js). Ein
 * Instagram-Embed hätte drei Preise gehabt: Metas Skript und iframe auf jedem
 * Aufruf, die fremde Instagram-Oberfläche mitten in der Seite und eine neue
 * frame-src in der CSP (entry.server.jsx erlaubt heute nur YouTube). Vor dem
 * Klick lädt hier nur das Titelbild (preload="none"); der Link zum Original
 * auf Instagram steht direkt darunter, die Reichweite des Kanals bleibt.
 *
 * DREI QUELLEN FÜR DIE MENGE, UND JEDE STEHT DA, WO SIE HERKOMMT.
 *   Schritte  folgen dem Reel (gesprochen und Bildunterschrift): 20 g als
 *             Wohlfühldosis, 20–25 g in der Bildunterschrift, Schamanendosis
 *             ab 30 g, Wasser 80 °C „nicht heißer".
 *   Wasser    „ca. 150 ml" steht nur auf der Packung; das Reel nennt keine
 *             Menge.
 *   Dosis     die Tabelle ist Wortlaut der Packungsrückseite, dieselbe wie
 *             im Zubereitungsblock der Kaufseiten (Kakao.jsx), deshalb
 *             data-qb-wortlaut="verpackung".
 * Die FAQ (15 g in 75 ml) und kakao-tiefe-daten.js nennen eine vierte
 * Fassung; die Harmonisierung ist nicht Gegenstand dieses Auftrags und als
 * offene Flanke im Job vermerkt.
 *
 * EIGENE CODE-ROUTE statt Shopify-Seite aus demselben Grund wie
 * /pages/warum-crystal-cacao (Katalog geteilt mit qiblanco.com); deshalb
 * steht der Handle in KAKAO_CODE_SEITEN (app/lib/kakao-zone.js), sonst wäre
 * die Seite live und in keiner Sitemap. Der Netzrand (crystal-cacao.caddy,
 * netzrand_echt) deckt /pages/.* schon.
 *
 * KEINE RECHTSPRÜFUNG. Nicht beauftragt und nicht Gegenstand dieser Route.
 */

const PFAD = ZUBEREITUNG_PFAD;
const SEITEN_URL = `${CANONICAL_ORIGIN}${PFAD}`;
const VEROEFFENTLICHT = '2026-10-30';

const SCHRITTE = [
  {
    id: 'abwiegen',
    titel: 'Abwiegen',
    text:
      'Wieg 20 bis 25 g Crystal Cacao ab. Das ist unsere Wohlfühldosis. ' +
      'Hör auf dich: Weniger geht auch, die Schamanendosis beginnt bei 30 g.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-abwiegen--d06ec3184f79.jpg?v=1793345066',
    ),
    alt: 'Crystal Cacao in einer Keramiktasse auf der Feinwaage',
  },
  {
    id: 'wasser',
    titel: 'Wasser auf 80\u00a0°C',
    text:
      'Erhitze etwa 150 ml Wasser auf 80 °C. Nicht heißer, sonst verlierst ' +
      'du genau das, wofür du den Kakao trinkst.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-wasser--99e5aacb16e9.jpg?v=1793345070',
    ),
    alt: 'Frau am Wasserkocher, daneben die Tasse mit Kakao',
  },
  {
    id: 'aufgiessen',
    titel: 'Aufgießen',
    text:
      'Gieß das Wasser über den Kakao und warte kurz, bis er weich wird. ' +
      'Leg den Milchaufschäumer schon bereit.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-aufgiessen--300f6c3f13cb.jpg?v=1793345074',
    ),
    alt: 'Heißes Wasser fließt auf den Kakao in der Tasse',
  },
  {
    id: 'mixen',
    titel: 'Mixen',
    text:
      'Mix den Kakao mit dem Milchaufschäumer, bis er ganz glatt ist. ' +
      'Das dauert nur einen Moment.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-mixen--a750accccdd2.jpg?v=1793345078',
    ),
    alt: 'Milchaufschäumer mixt den Kakao in der Tasse',
  },
  {
    id: 'crema',
    titel: 'Die Crema',
    text:
      'Oben bildet sich eine sahnige, samtige Crema. Jetzt ist dein Kakao ' +
      'fertig.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-crema--68f67fe93e42.jpg?v=1793345082',
    ),
    alt: 'Sahnige Kakao-Crema in der Tasse, darüber der Milchaufschäumer',
  },
  {
    id: 'geniessen',
    titel: 'Genießen',
    text:
      'Nimm dir Zeit für die Tasse. Trink langsam und spür, wie das Herz ' +
      'weich wird und der Kopf klar.',
    bild: schrittBild(
      'qb-cc-zubereitung--schritt-geniessen--e3919b659f4f.jpg?v=1793345086',
    ),
    alt: 'Frau hält lächelnd ihre Tasse Crystal Cacao',
  },
];

/** Das Teilbild der Seite: die Crema, ein Bild aus dem Reel. */
const TEILBILD = Object.freeze({
  url: schrittBild(
    'qb-cc-zubereitung--schritt-crema--68f67fe93e42.jpg?v=1793345082',
  ).url,
  breite: 720,
  hoehe: 900,
  alt: 'Sahnige Crema in einer Tasse Crystal Cacao',
});

const WERKZEUG = [
  {
    id: 'waage',
    titel: 'Feinwaage',
    text: 'Für deine Dosis auf das Gramm.',
    zeichen: (
      <>
        <rect x="4" y="10" width="24" height="16" rx="3" />
        <path d="M10 10V7.5a6 6 0 0 1 12 0V10" />
        <path d="M12 19h8" />
      </>
    ),
  },
  {
    id: 'kocher',
    titel: 'Wasserkocher',
    text: 'Am besten mit Temperaturwahl.',
    zeichen: (
      <>
        <path d="M9 12h14l-1.5 13a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L9 12Z" />
        <path d="M23 15l4-3" />
        <path d="M12 12V9a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    id: 'tasse',
    titel: 'Deine Tasse',
    text: 'Eine, die du gern in der Hand hältst.',
    zeichen: (
      <>
        <path d="M6 12h17v6a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8v-6Z" />
        <path d="M23 14h1.5a3 3 0 0 1 0 6H23" />
        <path d="M11 5v3M15 4v4M19 5v3" />
      </>
    ),
  },
  {
    id: 'aufschaeumer',
    titel: 'Milchaufschäumer',
    text: 'Er macht die Crema.',
    zeichen: (
      <>
        <rect x="12" y="3" width="8" height="13" rx="3" />
        <path d="M16 16v9" />
        <circle cx="16" cy="27" r="2.5" />
      </>
    ),
  },
];

/** Wortlaut der Packungsrückseite, gleich wie Kakao.jsx. */
const DOSIS = [
  {name: 'Daily Focus-Dosis', gramm: 15, rituale: 28},
  {name: 'Deep Focus-Dosis', gramm: 30, rituale: 14},
  {name: 'Schamanische Dosis', gramm: 38, rituale: 11},
];

const SEITEN_TITEL = `Kakao Zubereitung: So geht dein Ritual | ${ABSENDER_MARKE}`;
const SEITEN_BESCHREIBUNG =
  'So bereitest du Crystal Cacao zu: 20 bis 25 g abwiegen, mit 80 °C ' +
  'heißem Wasser aufgießen, cremig mixen. Mit Video und allen Schritten.';

function zubereitungsGraph() {
  const r = ZUBEREITUNG_REEL;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      markenOrganisation(organizationSchema(), {origin: CANONICAL_ORIGIN}),
      brotkrume({url: SEITEN_URL, name: 'Zubereitung'}),
      {
        '@type': 'Recipe',
        '@id': `${SEITEN_URL}#rezept`,
        name: 'Crystal Cacao zubereiten',
        description: SEITEN_BESCHREIBUNG,
        url: SEITEN_URL,
        inLanguage: 'de-DE',
        datePublished: isoMitZone(VEROEFFENTLICHT),
        author: {'@id': ORG_ID},
        image: [TEILBILD.url],
        recipeCategory: 'Getränk',
        recipeYield: '1 Tasse',
        totalTime: 'PT5M',
        recipeIngredient: [
          '20–25 g Crystal Cacao',
          'ca. 150 ml Wasser oder (pflanzliche) Milch',
        ],
        tool: WERKZEUG.map((w) => ({'@type': 'HowToTool', name: w.titel})),
        recipeInstructions: SCHRITTE.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.titel,
          text: s.text,
          url: `${SEITEN_URL}#schritt-${s.id}`,
          image: s.bild.src,
        })),
        video: {
          '@type': 'VideoObject',
          name: 'Crystal Cacao Zubereitung',
          description:
            'Unser tägliches Kakao-Ritual: abwiegen, aufgießen, mixen, ' +
            'genießen.',
          thumbnailUrl: [r.posterUrl],
          contentUrl: r.videoUrl,
          uploadDate: isoMitZone(r.veroeffentlicht),
          duration: `PT${r.dauerSekunden}S`,
          url: r.permalink,
        },
      },
    ],
  };
}

export function links() {
  return [{rel: 'stylesheet', href: zubereitungStyles}];
}

export const meta = () => [
  {title: SEITEN_TITEL},
  {name: 'description', content: SEITEN_BESCHREIBUNG},
  canonicalLink(PFAD),
  {property: 'og:type', content: 'article'},
  {property: 'og:site_name', content: ABSENDER_MARKE},
  {property: 'og:locale', content: 'de_DE'},
  {property: 'og:title', content: SEITEN_TITEL},
  {property: 'og:url', content: SEITEN_URL},
  {property: 'og:description', content: SEITEN_BESCHREIBUNG},
  ...teilbildSignale(TEILBILD),
  {'script:ld+json': zubereitungsGraph()},
];

export function loader() {
  return {};
}

export default function ZubereitungPage() {
  return (
    <div className="cc-zb">
      <Aufmacher />
      <Werkzeug />
      <Schritte />
      <Dosis />
      <Sorten />
    </div>
  );
}

function Aufmacher() {
  return (
    <section className="cc-zb-akt cc-zb-aufmacher" aria-labelledby="cc-zb-titel">
      <div className="cc-zb-innen cc-zb-aufmacher__raster">
        {/* Drei Teile statt zwei Spalten: auf dem Telefon steht das Reel
            direkt unter Titel und Vorspann, nicht erst nach den Eckdaten.
            Am Schreibtisch steht es rechts neben beiden Textteilen. */}
        <div className="cc-zb-aufmacher__kopf">
          <p className="cc-zb-augenbraue">Zubereitung</p>
          <h1 id="cc-zb-titel">So bereitest du Crystal Cacao zu</h1>
          <p className="cc-zb-lead">
            Abwiegen, aufgießen, mixen. Mehr braucht deine Tasse nicht. Im
            Video zeigen wir dir unser tägliches Ritual.
          </p>
        </div>
        <ReelVideo />
        <div className="cc-zb-aufmacher__details">
          <dl className="cc-zb-eckdaten">
            <div>
              <dt>Dauer</dt>
              <dd>ca. 5&nbsp;Min.</dd>
            </div>
            <div>
              <dt>Kakao</dt>
              <dd>20–25&nbsp;g</dd>
            </div>
            <div>
              <dt>Wasser</dt>
              <dd>80&nbsp;°C</dd>
            </div>
          </dl>
          <a className="cc-zb-weiter" href="#schritte">
            Alle Schritte ansehen
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Das Reel mit Titelbild und Abspielknopf. Vor dem Klick lädt nur das
 * Titelbild; der Klick startet das Video mit Ton und blendet die
 * Bedienleiste des Browsers ein.
 */
function ReelVideo() {
  const r = ZUBEREITUNG_REEL;
  const video = useRef(null);
  const [laeuft, setLaeuft] = useState(false);

  function abspielen() {
    setLaeuft(true);
    const v = video.current;
    if (v) {
      const versuch = v.play();
      if (versuch && typeof versuch.catch === 'function') versuch.catch(() => {});
    }
  }

  return (
    <figure className="cc-zb-reel">
      <div className="cc-zb-reel__rahmen">
        <video
          ref={video}
          className="cc-zb-reel__video"
          poster={r.posterUrl}
          preload="none"
          playsInline
          controls={laeuft}
          width={r.breite}
          height={r.hoehe}
          aria-label="Video: So bereiten wir Crystal Cacao zu"
        >
          <source src={r.videoUrl} type="video/mp4" />
        </video>
        {laeuft ? null : (
          <button
            type="button"
            className="cc-zb-reel__start"
            onClick={abspielen}
            aria-label="Video abspielen"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
      <figcaption className="cc-zb-reel__unterzeile">
        <a href={r.permalink} target="_blank" rel="noopener noreferrer">
          @{r.konto} auf Instagram
        </a>
      </figcaption>
    </figure>
  );
}

function Werkzeug() {
  return (
    <section className="cc-zb-akt cc-zb-akt--flaeche" aria-labelledby="cc-zb-werkzeug-titel">
      <div className="cc-zb-innen">
        <h2 id="cc-zb-werkzeug-titel">Was du brauchst</h2>
        <ul className="cc-zb-werkzeug">
          {WERKZEUG.map((w) => (
            <li key={w.id} className="cc-zb-werkzeug__teil">
              <svg
                className="cc-zb-werkzeug__zeichen"
                viewBox="0 0 32 32"
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {w.zeichen}
              </svg>
              <h3>{w.titel}</h3>
              <p>{w.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Schritte() {
  return (
    <section
      id="schritte"
      className="cc-zb-akt cc-zb-schritte"
      aria-labelledby="cc-zb-schritte-titel"
    >
      <div className="cc-zb-innen">
        <h2 id="cc-zb-schritte-titel">Schritt für Schritt</h2>
        <ol className="cc-zb-schritte__liste">
          {SCHRITTE.map((s, i) => (
            <li key={s.id} id={`schritt-${s.id}`} className="cc-zb-schritt">
              <img
                className="cc-zb-schritt__bild"
                src={s.bild.src}
                srcSet={s.bild.srcSet}
                sizes="(min-width: 64em) 400px, (min-width: 40em) 45vw, 112px"
                width={s.bild.breite}
                height={s.bild.hoehe}
                alt={s.alt}
                loading="lazy"
                decoding="async"
              />
              <div className="cc-zb-schritt__text">
                <h3>
                  <span className="cc-zb-schritt__nummer" aria-hidden="true">
                    {i + 1}
                  </span>
                  {s.titel}
                </h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Dosis() {
  return (
    <section className="cc-zb-akt cc-zb-akt--flaeche" aria-labelledby="cc-zb-dosis-titel">
      <div className="cc-zb-innen">
        <h2 id="cc-zb-dosis-titel">Deine Dosis</h2>
        <p className="cc-zb-absatz">
          Im Video sind es 20 g, unsere Wohlfühldosis. Auf der Rückseite
          deiner Packung findest du drei Stufen.
        </p>
        <dl className="cc-zb-dosis" data-qb-wortlaut="verpackung">
          {DOSIS.map((d) => (
            <div key={d.name} className="cc-zb-dosis__stufe">
              <dt>{d.name}</dt>
              <dd>
                <span className="cc-zb-dosis__gramm">{d.gramm} g</span>
                <span>pro Tasse ≈ {d.rituale} Rituale</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="cc-zb-verfeinern">
          <h3>Verfeinern</h3>
          <p data-qb-wortlaut="verpackung">
            Statt Wasser geht auch (pflanzliche) Milch. Nach Belieben mit
            Honig süßen und mit Blue-Lotus-Öl, Safran, Muskat, Cayennepfeffer,
            Vanille oder Himalaya-Salz veredeln.
          </p>
        </div>
      </div>
    </section>
  );
}

function Sorten() {
  const sorten = [SORTEN.awake, SORTEN.create];
  return (
    <section className="cc-zb-akt cc-zb-sorten" aria-labelledby="cc-zb-sorten-titel">
      <div className="cc-zb-innen">
        <h2 id="cc-zb-sorten-titel">Welche Sorte kommt in deine Tasse?</h2>
        <ul className="cc-zb-sorten__liste">
          {sorten.map((s) => (
            <li key={s.sorte} className="cc-zb-sorte">
              <h3>{s.name.toUpperCase()}</h3>
              <p className="cc-zb-sorte__claim">{s.claim}</p>
              <p>{s.einordnung}</p>
              <Link className="cc-knopf cc-zb-sorte__knopf" prefetch="intent" to={s.pfad}>
                {s.name.toUpperCase()} ansehen
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** @typedef {import('./+types/pages.zubereitung').Route} Route */
