// app/routes/pages.zubereitung-vorschau.jsx
//
// VORSCHAU der Zubereitungs-Section (Elina, 08.11.2026): EL-20261108-97a6b64a
// setzt EL-20261108-fbf1998e mit den Praezisierungen 29de4ddf, 80f6a9be und
// 7c358c96 um. Versteckte Seite wie /pages/mm-formular-test: nicht verlinkt,
// noindex (Meta und X-Robots-Tag), nicht in der Sitemap (steht NICHT in
// KAKAO_CODE_SEITEN). Einbau auf den Kaufseiten erst nach Elinas GO; bis dahin
// beruehrt diese Datei keine bestehende Seite.
//
// INHALT: die sechs Schritte und die Dosieranleitung sind Wortlaut der
// Packungsrueckseite, wortgleich zu ZUBEREITUNG_SCHRITTE in
// components/product-pages/Kakao.jsx (dort auch die Herkunft). Nur die Mengen
// sind fett gesetzt; kein Wort ist neu.
//
// BILDER (Elina, EL-20261119-cd98879b): NUR ECHTE FOTOS, keine KI-Bilder
// (Dauerregel fuer Crystal-Cacao-Shop-Seiten). Die frueheren Canva-/KI-Bilder
// (Tasse midjourney_hvsm_…, Schrittbilder qb-cc-zubereitung-vorschau--
// zubereitung-schritt-1..6) sind raus. Quellen jetzt: Elinas Crystal-Cacao-
// Handy-Shooting vom 15.10.2026 (bildmaterial/crystal-cacao-2026-10, per
// cdn-publish in die Shopify-Dateien) und das Berlin-Shooting 2022 (liegt schon
// in den Shopify-Dateien). Ein Schritt ohne passendes echtes Foto hat
// bild: null -> am Handy kein Bild ueber dem Schritt, am Desktop bleibt das
// zuletzt gezeigte Bild stehen ("lieber weniger Bilder als KI-Bilder").
//
// PREISE kommen live aus Shopify: Variante der Sorte, Mengenstaffel 3 (das
// vorausgewaehlte 3er-Set der Kaufseiten) ueber cacaoPricing — dieselbe
// Rechnung wie CacaoPriceDisplay, also derselbe Betrag wie im Shop.
//
// Rueckbau: diese Datei und app/styles/zubereitung-vorschau.css loeschen.
import {useEffect, useRef, useState} from 'react';
import {useLoaderData} from 'react-router';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {EuGewaehrleistungsHinweis} from '~/components/EuGewaehrleistungsLabel';
import {cacaoPricing, ladeStaffelKasse} from '~/lib/cacao-pricing';
import {useMarktLand} from '~/lib/markt-land';
import vorschauStyles from '~/styles/zubereitung-vorschau.css?url';

const CDN = 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/';
const MENGE = '3';

/** Hauptbild: echtes Foto aus Elinas Crystal-Cacao-Shooting (IMG_0427). */
const TASSE = Object.freeze({
  url: `${CDN}qb-cc-zubereitung-vorschau--echtfoto-tasse-holztisch-0427--2e603cad9cab.jpg?v=1795104462`,
  breite: 1440,
  hoehe: 1920,
  alt: 'Tasse Crystal Cacao mit Milchschaum und Kakaopulver auf einem Holztisch',
});

/* Wortlaut der Packungsrueckseite (= Kakao.jsx ZUBEREITUNG_SCHRITTE), in
 * Stuecke zerlegt, damit die Mengen fett stehen koennen: [text, fett?]. */
const SCHRITTE = [
  {
    titel: 'Kakao portionieren',
    text: [
      ['Breche dir deine gewünschte Menge Kakao ab – für tiefen Fokus empfehlen wir '],
      ['20–30\u00a0g', true],
      [' – und zerbrösele sie grob.'],
    ],
    // Berlin-Shooting 2022, schon in den Shopify-Dateien
    bild: {datei: '2022-07-26-qiblanco-berlin-1001239-2.jpg?v=1739881879', breite: 2292, hoehe: 2292},
    alt: 'Grob gehackter Blockkakao mit einem Messer auf einem Holzbrett',
  },
  {
    titel: 'Tasse vorwärmen',
    text: [
      ['Fülle deine Lieblingstasse kurz mit heißem Wasser, leere sie – so bleibt dein Kakao länger warm und aromatisch.'],
    ],
    // kein passendes echtes Foto im Bestand -> ohne Bild (Elina liefert nach)
    bild: null,
  },
  {
    titel: 'Aufgießen',
    text: [
      ['Übergieße den Kakao mit '],
      ['ca. 150\u00a0ml', true],
      [' heißem Wasser oder (pflanzlicher) Milch ('],
      ['max. 85\u00a0°C', true],
      [') – das bewahrt die wertvollen Aromen und Inhaltsstoffe des Kakaos.'],
    ],
    // kein passendes echtes Foto im Bestand -> ohne Bild (Elina liefert nach)
    bild: null,
  },
  {
    titel: 'Aroma erwachen lassen',
    text: [
      ['Warte '],
      ['etwa 1\u00a0Minute', true],
      [' und spüre, wie sich das volle Bouquet entfaltet.'],
    ],
    // Crystal-Cacao-Shooting 15.10.2026, IMG_0478
    bild: {datei: 'qb-cc-zubereitung-vorschau--echtfoto-tasse-sonne-balkon-0478--846d23a052d9.jpg?v=1795104467', breite: 1440, hoehe: 1920},
    alt: 'Tasse Crystal Cacao steht in der Sonne auf einer Balkonbrüstung',
  },
  {
    titel: 'Verfeinern & Aufschäumen',
    text: [
      ['Rühre den geschmolzenen Kakao cremig – ideal mit einem Milchaufschäumer. Nach Belieben mit Honig süßen und mit Blue-Lotus-Öl, Safran, Muskat, Cayennepfeffer, Vanille oder Himalaya-Salz veredeln.'],
    ],
    // Crystal-Cacao-Shooting 15.10.2026, IMG_0445
    bild: {datei: 'qb-cc-zubereitung-vorschau--echtfoto-tasse-schaum-hand-0445--2d00212d9159.jpg?v=1795104472', breite: 1440, hoehe: 1920},
    alt: 'Hand hält eine Tasse Crystal Cacao mit cremigem Milchschaum',
  },
  {
    titel: 'Genießen',
    text: [
      ['Nimm dir Zeit. Trinke langsam, atme den Duft ein – und spüre, wie jeder Schluck dein Herz öffnet und dir neue Kraft schenkt.'],
    ],
    // Berlin-Shooting 2022, schon in den Shopify-Dateien
    bild: {datei: '2022-07-26-qiblanco-berlin-1001190_Kopie_2.jpg?v=1765893937', breite: 1373, hoehe: 1373},
    alt: 'Lächelnde Frau genießt eine Tasse Kakao in der Sonne',
  },
];

/* Dosieranleitung der Packungsrueckseite, Reihenfolge nach Elinas Vorlage
 * (29de4ddf): 15 / 30 / 38 g. */
const DOSIS = [
  {gramm: '15 g', name: 'Daily Focus-Dosis', rituale: '≈ 28 Rituale'},
  {gramm: '30 g', name: 'Deep Focus-Dosis', rituale: '≈ 14 Rituale'},
  {gramm: '38 g', name: 'Schamanische Dosis', rituale: '≈ 11 Rituale'},
];

const SORTEN = [
  {sorte: 'awake', name: 'Awake'},
  {sorte: 'create', name: 'Create'},
];

function bildQuellen(url, breiten) {
  return {
    src: `${url}&width=${breiten[breiten.length - 1]}`,
    srcSet: breiten.map((w) => `${url}&width=${w} ${w}w`).join(', '),
  };
}

const schrittUrl = (s) => `${CDN}${s.bild.datei}`;

/** Breitenstufen fuer srcset, nie breiter als das Foto selbst. */
const stufen = (breiten, max) => {
  const b = breiten.filter((w) => w < max);
  return b.length === breiten.length ? breiten : [...b, max];
};

/* Desktop: zu Schritt i gehoert das Bild des letzten Schritts <= i, der ein
 * eigenes Foto hat; davor die Tasse. So bleibt bei einem Schritt ohne Bild das
 * zuletzt gezeigte Bild stehen, statt dass der Rahmen leer wird. */
const RAHMEN_BILD = SCHRITTE.reduce((acc, s, i) => {
  acc.push(s.bild ? i + 1 : i > 0 ? acc[i - 1] : 0);
  return acc;
}, []);

export function links() {
  return [{rel: 'stylesheet', href: vorschauStyles}];
}

export const meta = () => [
  {title: 'Zubereitung (Vorschau) – Crystal Cacao'},
  {name: 'robots', content: 'noindex,nofollow'},
];

export function headers() {
  return {'X-Robots-Tag': 'noindex, nofollow'};
}

export async function loader({context}) {
  const {storefront} = context;
  // PREIS FRISCH wie auf den Kaufseiten (CacheShort, siehe
  // products.crystal-cacao-awake.jsx): nach einer Preisaenderung zeigt die
  // Leiste nicht bis zu 24 h den alten Betrag.
  const daten = await storefront.query(VORSCHAU_QUERY, {
    cache: storefront.CacheShort(),
  });
  const land = storefront.i18n.country;
  const produkte = {};
  await Promise.all(
    SORTEN.map(async ({sorte}) => {
      const p = daten?.[sorte];
      const v = p?.selectedOrFirstAvailableVariant;
      if (!p || !v) return;
      const staffelKasse = await ladeStaffelKasse(storefront, {
        variantId: v.id,
        waehrung: v.price?.currencyCode,
        land,
        listenpreis: v.price?.amount,
      });
      produkte[sorte] = {
        handle: p.handle,
        titel: p.title,
        bild: v.image || p.featuredImage || null,
        variante: v,
        staffelKasse,
      };
    }),
  );
  return {produkte};
}

export default function ZubereitungVorschau() {
  const {produkte} = useLoaderData();
  const wurzel = useRef(null);
  const liste = useRef(null);
  const [aktiv, setAktiv] = useState(-1);
  const [bildSchritt, setBildSchritt] = useState(-1);
  const [imBild, setImBild] = useState(true);

  useEffect(() => {
    const root = wurzel.current;
    const ol = liste.current;
    if (!root || !ol) return undefined;
    // Erst MIT JavaScript stehen die Schritte vor dem Einblenden unsichtbar
    // da; ohne Skript ist alles sofort lesbar.
    root.setAttribute('data-zbv-js', '');
    const schritte = Array.from(ol.querySelectorAll('.zbv-schritt'));

    const einblenden =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (eintraege) => {
              for (const e of eintraege) {
                if (e.isIntersecting) {
                  // Datenattribut statt Klasse: className gehoert React und
                  // wird bei jedem Wechsel des aktiven Schritts neu gesetzt.
                  e.target.setAttribute('data-zbv-sichtbar', '');
                  einblenden.unobserve(e.target);
                }
              }
            },
            {threshold: 0.12, rootMargin: '0px 0px -8% 0px'},
          );
    if (einblenden) schritte.forEach((s) => einblenden.observe(s));
    else schritte.forEach((s) => s.setAttribute('data-zbv-sichtbar', ''));

    // Die goldene Zeitleiste fuellt sich mit dem Scrollen; aktiv ist der
    // letzte Schritt, dessen Punkt die Leselinie (55 % der Fensterhoehe)
    // ueberschritten hat.
    let rahmen = 0;
    let zuletzt = -2;
    let zuletztBild = -2;
    const kopf = root.querySelector('.zbv-kopf');
    const messen = () => {
      rahmen = 0;
      const linie = window.innerHeight * 0.55;
      const r = ol.getBoundingClientRect();
      const anteil = r.height > 0 ? (linie - r.top) / r.height : 0;
      ol.style.setProperty(
        '--zbv-fuellung',
        String(Math.min(1, Math.max(0, anteil))),
      );
      let neu = -1;
      schritte.forEach((s, i) => {
        const punkt = s.querySelector('.zbv-punkt');
        const top = (punkt || s).getBoundingClientRect().top;
        if (top < linie) neu = i;
      });
      if (neu !== zuletzt) {
        zuletzt = neu;
        setAktiv(neu);
      }
      // Hauptbild ist die Tasse: sie steht, solange der Kopf der Section
      // noch im Bild ist; danach wechselt das Bild mit dem gelesenen Schritt.
      const kopfUnten = kopf ? kopf.getBoundingClientRect().bottom : -1;
      const bild = kopfUnten > 0 ? -1 : neu;
      if (bild !== zuletztBild) {
        zuletztBild = bild;
        setBildSchritt(bild);
      }
    };
    const anstossen = () => {
      if (!rahmen) rahmen = requestAnimationFrame(messen);
    };
    messen();
    window.addEventListener('scroll', anstossen, {passive: true});
    window.addEventListener('resize', anstossen);

    // Die Kaufleiste klebt am Handy nur, solange die Section im Bild ist.
    const sichtbar =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((e) => setImBild(e[0]?.isIntersecting ?? true));
    sichtbar?.observe(root);

    return () => {
      if (rahmen) cancelAnimationFrame(rahmen);
      window.removeEventListener('scroll', anstossen);
      window.removeEventListener('resize', anstossen);
      einblenden?.disconnect();
      sichtbar?.disconnect();
    };
  }, []);

  // Desktop: erst die Tasse, danach das Bild des gelesenen Schritts.
  const bildIndex = bildSchritt < 0 ? 0 : RAHMEN_BILD[bildSchritt] ?? 0;

  return (
    <section
      ref={wurzel}
      className="zbv"
      aria-labelledby="zbv-titel"
      data-apple-seite="crystal-cacao-zubereitung-vorschau"
    >
      <header className="zbv-kopf">
        <p className="zbv-augenbraue">Zubereitung</p>
        <h1 id="zbv-titel">
          Dein Ritual in <strong>6 Schritten</strong>
        </h1>
        <p className="zbv-unterzeile">
          So steht es auch auf der Rückseite deiner Packung.
        </p>
      </header>

      <div className="zbv-raster">
        <div className="zbv-medien">
          <div className="zbv-rahmen">
            <img
              className={`zbv-rahmen__bild${bildIndex === 0 ? ' ist-aktiv' : ''}`}
              {...bildQuellen(TASSE.url, [480, 720, 1136])}
              sizes="(min-width: 56.25em) 46vw, 100vw"
              width={TASSE.breite}
              height={TASSE.hoehe}
              alt={TASSE.alt}
              fetchPriority="high"
              decoding="async"
            />
            {SCHRITTE.map((s, i) =>
              s.bild ? (
              <img
                key={s.titel}
                className={`zbv-rahmen__bild zbv-nur-breit${
                  bildIndex === i + 1 ? ' ist-aktiv' : ''
                }`}
                {...bildQuellen(schrittUrl(s), stufen([480, 720, 1136], s.bild.breite))}
                sizes="46vw"
                width={s.bild.breite}
                height={s.bild.hoehe}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              ) : null,
            )}
            <Kaufleiste produkte={produkte} imBild={imBild} />
          </div>
        </div>

        <div className="zbv-text">
          <ol ref={liste} className="zbv-schritte" data-qb-wortlaut="verpackung">
            {SCHRITTE.map((s, i) => (
              <li
                key={s.titel}
                className={`zbv-schritt${i === aktiv ? ' ist-aktiv' : ''}${
                  i < aktiv ? ' ist-erreicht' : ''
                }`}
              >
                {s.bild ? (
                  <div className="zbv-schritt__bildhuelle zbv-nur-schmal">
                    <img
                      className="zbv-schritt__bild"
                      {...bildQuellen(schrittUrl(s), stufen([360, 480, 720, 1136], s.bild.breite))}
                      sizes="(min-width: 37.5em) 520px, calc(100vw - 88px)"
                      width={s.bild.breite}
                      height={s.bild.hoehe}
                      alt={s.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <div className="zbv-schritt__marke">
                  <span className="zbv-punkt" aria-hidden="true" />
                  <p className="zbv-pill">Schritt {i + 1}</p>
                </div>
                <h2 className="zbv-schritt__titel">{s.titel}</h2>
                <p className="zbv-schritt__text">
                  {s.text.map(([t, fett], k) =>
                    fett ? <strong key={k}>{t}</strong> : <span key={k}>{t}</span>,
                  )}
                </p>
                {i === 0 ? <Dosieranleitung /> : null}
              </li>
            ))}
          </ol>
          <div className="zbv-pflicht">
            <EuGewaehrleistungsHinweis />
          </div>
        </div>
      </div>
    </section>
  );
}

function Dosieranleitung() {
  return (
    <div className="zbv-dosis">
      <table className="zbv-dosis__tabelle">
        <caption className="zbv-unsichtbar">Dosieranleitung pro Tasse</caption>
        <tbody>
          {DOSIS.map((d) => (
            <tr key={d.gramm}>
              <th scope="row">{d.gramm}</th>
              <td>{d.name}</td>
              <td className="zbv-dosis__rituale">{d.rituale}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="zbv-dosis__empfehlung">Für tiefen Fokus empfehlen wir{' '}
        <span className="zbv-am-stueck">20–30&nbsp;g</span>.
      </p>
    </div>
  );
}

/**
 * Schmale, lange Kaufleiste in Pillenform (80f6a9be + 7c358c96): runder
 * Packshot – „Crystal Cacao®“ mit Umschalter Awake/Create – Trennlinie –
 * Streichpreis – Preis – runder dunkler Knopf nur mit Einkaufswagen-Symbol.
 * Desktop unten im Bild, Handy klebend unten am Bildschirm (CSS).
 */
function Kaufleiste({produkte, imBild}) {
  const {open} = useAside();
  const marktLand = useMarktLand();
  const [sorte, setSorte] = useState(produkte?.awake ? 'awake' : 'create');
  const p = produkte?.[sorte];
  if (!p) return null;
  const v = p.variante;
  const pricing = cacaoPricing(MENGE, v, p.handle, marktLand, p.staffelKasse);
  // Wie CacaoPriceDisplay: Packungspreis, ausser er geht nicht glatt auf
  // (Fremdwaehrung), dann der Betrag fuer die drei Packungen.
  const preis = pricing.teilbar ? pricing.price : pricing.gesamt;
  const vorher = pricing.teilbar ? pricing.compareAt : pricing.compareAtGesamt;
  const kaufbar = Boolean(v?.availableForSale);
  const sorteName = SORTEN.find((s) => s.sorte === sorte)?.name;

  return (
    <div
      className={`zbv-leiste zbv-leiste--${sorte}`}
      data-zbv-leiste=""
      data-im-bild={imBild ? 'ja' : 'nein'}
    >
      {p.bild?.url ? (
        <img
          className="zbv-leiste__packshot"
          src={`${p.bild.url}${p.bild.url.includes('?') ? '&' : '?'}width=120`}
          width={40}
          height={40}
          alt={p.bild.altText || `Crystal Cacao ${sorteName}`}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="zbv-leiste__produkt">
        <p className="zbv-leiste__name">Crystal Cacao®</p>
        <div className="zbv-leiste__sorten" role="group" aria-label="Sorte wählen">
          {SORTEN.filter((s) => produkte?.[s.sorte]).map((s) => (
            <button
              key={s.sorte}
              type="button"
              className={`zbv-sorte zbv-sorte--${s.sorte}`}
              aria-pressed={sorte === s.sorte}
              onClick={() => setSorte(s.sorte)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <span className="zbv-leiste__trenner" aria-hidden="true" />
      <p className="zbv-leiste__preise">
        {vorher ? (
          <s className="zbv-leiste__vorher">
            <span className="zbv-unsichtbar">statt </span>
            {vorher}
          </s>
        ) : null}
        <span className="zbv-leiste__preis">
          {preis}
          {pricing.teilbar ? null : <span className="zbv-leiste__menge"> für 3</span>}
        </span>
      </p>
      <div className="zbv-leiste__knopf">
        <AddToCartButton
          disabled={!kaufbar}
          onClick={() => {
            open('cart');
          }}
          lines={[
            {
              merchandiseId: v.id,
              quantity: parseInt(MENGE, 10),
              selectedVariant: v,
            },
          ]}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L20.6 8H6.1" />
            <circle cx="9.5" cy="19.5" r="1.3" />
            <circle cx="17" cy="19.5" r="1.3" />
          </svg>
          <span className="zbv-unsichtbar">
            {kaufbar
              ? `3 Packungen Crystal Cacao ${sorteName} in den Warenkorb legen`
              : 'Ausverkauft'}
          </span>
        </AddToCartButton>
      </div>
    </div>
  );
}

const VORSCHAU_QUERY = `#graphql
  fragment ZbvVariante on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
  fragment ZbvProdukt on Product {
    id
    title
    handle
    featuredImage {
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true) {
      ...ZbvVariante
    }
  }
  query ZubereitungVorschau($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    awake: product(handle: "crystal-cacao-awake") {
      ...ZbvProdukt
    }
    create: product(handle: "crystal-cacao-create") {
      ...ZbvProdukt
    }
  }
`;
