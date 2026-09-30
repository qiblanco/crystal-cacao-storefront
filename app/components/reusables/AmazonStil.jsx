import {CdnBild} from './CdnBild';
import {FaqListe} from './FaqListe';
import {produktLink, BLOCK_PUBLIC} from './blockLinks';
import {faqPageJsonLdString} from '~/lib/faq-schema';
import {useMarktLand} from '~/lib/markt-land';
import {cacaoPricing} from '~/components/CacaoProductForm';
import {
  KUNDENFRAGEN,
  SORTENVERGLEICH,
  VERGLEICH,
  berichtQuelle,
  sortenSpalten,
  vergleichSpalten,
} from './amazonstil-daten';

/*
 * AMAZON-STIL STUFE 2 — Gerätevergleich und Kundenfragen weit oben auf
 * /products/qione-2-pro, /products/qibracelet und /products/qihome-air
 * (Grossjob growth-m-lp-produktseite-verkauft, s04, 27.09.2026). Weit oben,
 * weil 73,5 % der Nichtkäufer nicht über 25 % Scrolltiefe kommen (Messung
 * 26.09.) und "Vergleich" zu den drei häufigsten eigenen Kundenfragen im
 * Verkaufs-Chat gehört. Texte, Schalter, Auswahlregel: ./amazonstil-daten.js.
 *
 * Seit dem 28.09.2026 AUCH auf /pages/qione-2-pro, /pages/qibracelet und
 * /pages/qihome-air: Christian will die LP-Spiegel "gleich bis auf den
 * Beschreibungstext oben", beide Routen rendern dieselbe Seitenkomponente
 * (product-pages/*Seite.jsx). Bis dahin waren die /pages/-Kaufseiten die
 * Kontrollgruppe der Wirkungsmessung (Hypothese hce22957c).
 * MESSANKER (Vertrag von probe_amazonstil_s04.py, nicht umbenennen):
 * data-qb-geraetevergleich, -vergleich-produkt, -vergleich-preis,
 * -kundenfragen, -kundenfrage. data-textplatz = Anker der Textmappe.
 * BEWUSST KEIN data-section (anker-freie PDPs, Kopf der Route).
 */

/**
 * Vergleich der drei Geräte. `preise` kommt aus dem Loader
 * (ladeVergleichsPreise), `eigenerPreis` ist der Preis der Kaufbox dieser
 * Seite. Aus (Schalter) oder ohne Spalten: nichts.
 *
 * `block` (Default BLOCK_PUBLIC) bestimmt die Ziele der Geräte-Links: auf den
 * LP-Landezielen /pages/<handle> übergibt die gemeinsame Seitenkomponente
 * BLOCK_LP, damit der Vergleich im Landing-Bereich bleibt (Zwei-Block-IA,
 * reusables/blockLinks.js). Ohne die Angabe zeigt er wie bisher auf /products/.
 *
 * @param {{handle: string, preise?: object|null, eigenerPreis?: object|null, block?: string}} props
 */
export function Geraetevergleich({
  handle,
  preise = null,
  eigenerPreis = null,
  block = BLOCK_PUBLIC,
}) {
  const land = useMarktLand();
  const spalten = vergleichSpalten(handle, {preise: preise || {}, eigenerPreis, land});
  if (spalten.length < 2) return null;
  const mitRaten = spalten.some((s) => s.raten);
  const z = VERGLEICH.zeilen;
  const titelId = `qb-gv-titel-${handle}`;

  return (
    <section
      className="qb-gv NormalSectionSize"
      data-qb-geraetevergleich=""
      data-textplatz={`${handle}.geraetevergleich`}
      aria-labelledby={titelId}
    >
      <h2 id={titelId} className="qb-gv__titel">
        {VERGLEICH.titel}
      </h2>
      <div className={`qb-gv__raster${mitRaten ? ' qb-gv__raster--raten' : ''}`}>
        {spalten.map((s) => {
          const ziel = produktLink(s.handle, block, 'kauf');
          const nameId = `qb-gv-name-${handle}-${s.handle}`;
          const bild = (
            <CdnBild
              src={s.bild}
              alt=""
              anzeigeBreite={120}
              breite={120}
              hoehe={120}
              sizes="120px"
              loading="lazy"
              className="qb-gv__bild"
            />
          );
          return (
            <article
              key={s.handle}
              className={`qb-gv__geraet${s.eigenes ? ' qb-gv__geraet--eigenes' : ''}`}
              data-qb-vergleich-produkt={s.handle}
              aria-labelledby={nameId}
            >
              <h3 id={nameId} className="qb-gv__kopf">
                {s.eigenes ? (
                  <span className="qb-gv__kopf-inhalt">
                    {bild}
                    <span className="qb-gv__name">{s.name}</span>
                  </span>
                ) : (
                  <a className="qb-gv__kopf-inhalt" href={ziel}>
                    {bild}
                    <span className="qb-gv__name">{s.name}</span>
                  </a>
                )}
              </h3>
              <dl className="qb-gv__merkmale">
                <div className="qb-gv__zeile qb-gv__zeile--preis">
                  <dt>{z.preis}</dt>
                  <dd data-qb-vergleich-preis="">{s.preis || '–'}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.einsatz}</dt>
                  <dd>{s.einsatz}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.material}</dt>
                  <dd>{s.material}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.wasser}</dt>
                  <dd>{s.wasser}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.studie}</dt>
                  <dd>
                    {s.studien.map((st) => (
                      <a key={st.href} className="qb-gv__studie" href={st.href}>
                        {st.text}
                      </a>
                    ))}
                  </dd>
                </div>
                {mitRaten ? (
                  <div className="qb-gv__zeile">
                    <dt>{z.raten}</dt>
                    <dd>{s.raten || '–'}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="qb-gv__fuss">
                {s.eigenes ? (
                  <span className="qb-gv__marke">{VERGLEICH.dieserArtikel}</span>
                ) : (
                  <a className="btn--text qb-gv__weg" href={ziel}>
                    {VERGLEICH.zumGeraet(s.name)}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Vergleich der zwei Crystal Cacao®-Sorten auf /products/crystal-cacao-awake
 * und -create (s03, 30.09.2026): dasselbe Raster und dieselben qb-gv-Klassen
 * wie der Gerätevergleich, zwei Spalten statt drei, Analyseberichte statt
 * Zellstudie. MESSANKER (ANKER-VERTRAG des Grossjobs, markt-paritaet misst
 * daran, nicht umbenennen): data-qb-sortenvergleich, data-qb-vergleich-produkt,
 * data-qb-vergleich-preis, data-qb-sorten-liste, data-qb-analysebericht.
 *
 * Preis: dieselbe Rechnung wie die Kaufbox für EINE Packung (cacaoPricing aus
 * CacaoProductForm.jsx, dort auch der Mengenrabatt). Ohne Preis der Variante:
 * "–" statt des EUR-Rückfallwerts der Kaufbox, der in anderen Märkten eine
 * falsche Währung zeigen würde.
 *
 * @param {{handle: string, varianten?: object|null, eigeneVariante?: object|null}} props
 */
export function Sortenvergleich({handle, varianten = null, eigeneVariante = null}) {
  const land = useMarktLand();
  const spalten = sortenSpalten(handle, {varianten: varianten || {}, eigeneVariante});
  if (spalten.length < 2) return null;
  const z = SORTENVERGLEICH.zeilen;
  const titelId = `qb-gv-titel-${handle}`;

  return (
    <section
      className="qb-gv qb-gv--sorten NormalSectionSize"
      data-qb-sortenvergleich=""
      data-textplatz={`${handle}.sortenvergleich`}
      aria-labelledby={titelId}
    >
      <h2 id={titelId} className="qb-gv__titel">
        {SORTENVERGLEICH.titel}
      </h2>
      <div className="qb-gv__raster qb-gv__raster--sorten">
        {spalten.map((s) => {
          const ziel = `/products/${s.handle}`;
          const nameId = `qb-gv-name-${handle}-${s.handle}`;
          const preis = s.variante?.price?.amount
            ? cacaoPricing('1', s.variante, s.handle, land).price
            : null;
          const bild = (
            <CdnBild
              src={s.bild}
              alt=""
              anzeigeBreite={120}
              breite={s.breite}
              hoehe={s.hoehe}
              sizes="120px"
              loading="lazy"
              className="qb-gv__bild"
            />
          );
          return (
            <article
              key={s.handle}
              className={`qb-gv__geraet${s.eigenes ? ' qb-gv__geraet--eigenes' : ''}`}
              data-qb-vergleich-produkt={s.handle}
              aria-labelledby={nameId}
            >
              <h3 id={nameId} className="qb-gv__kopf">
                {s.eigenes ? (
                  <span className="qb-gv__kopf-inhalt">
                    {bild}
                    <span className="qb-gv__name">{s.name}</span>
                  </span>
                ) : (
                  <a className="qb-gv__kopf-inhalt" href={ziel}>
                    {bild}
                    <span className="qb-gv__name">{s.name}</span>
                  </a>
                )}
              </h3>
              <dl className="qb-gv__merkmale">
                <div className="qb-gv__zeile qb-gv__zeile--preis">
                  <dt>{z.preis}</dt>
                  <dd data-qb-vergleich-preis="">{preis || '–'}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.wofuer}</dt>
                  <dd>
                    <ul className="qb-gv__liste" data-qb-sorten-liste="">
                      {s.wofuer.map((zeile) => (
                        <li key={zeile}>{zeile}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.bohne}</dt>
                  <dd>{s.bohne}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.profil}</dt>
                  <dd>{s.profil}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.bio}</dt>
                  <dd>{s.bio}</dd>
                </div>
                <div className="qb-gv__zeile">
                  <dt>{z.berichte}</dt>
                  <dd>
                    {s.berichte.map((b) => (
                      <a
                        key={b.url}
                        className="qb-gv__studie qb-gv__bericht"
                        href={b.url}
                        hrefLang={b.sprache}
                        type="application/pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-qb-analysebericht=""
                      >
                        <span className="qb-gv__bericht-art">{b.art}</span>
                        <span className="qb-gv__bericht-quelle">{berichtQuelle(b)}</span>
                      </a>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="qb-gv__fuss">
                {s.eigenes ? (
                  <span className="qb-gv__marke">{SORTENVERGLEICH.dieserArtikel}</span>
                ) : (
                  <a className="btn--text qb-gv__weg" href={ziel}>
                    {SORTENVERGLEICH.zurSorte(s.name)}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Die häufigsten Kundenfragen mit ihren Bestandsantworten. `oben` ist die
 * Auswahl aus teileFragen(), `alle` die volle Liste der Seite: das
 * FAQPage-Schema wird hier über die VOLLE Liste ausgegeben (byte-gleich zu
 * dem, was die FAQ unten vorher ausgab), die FAQ unten gibt keines mehr aus.
 *
 * Jede Frage hat ihre eigene FaqListe: so bekommt jeder Eintrag seinen
 * Messanker, ohne dass die geteilte Akkordeon-Mechanik (FaqListe.jsx) eine
 * zweite Fassung bekommt oder angefasst wird.
 *
 * @param {{handle: string, oben: Array, alle: Array}} props
 */
export function Kundenfragen({handle, oben, alle}) {
  if (!oben?.length) return null;
  const jsonLd = faqPageJsonLdString(alle);
  const titelId = `qb-kf-titel-${handle}`;
  return (
    <section
      className="qb-kf NormalSectionSize"
      data-qb-kundenfragen=""
      data-textplatz={`${handle}.kundenfragen`}
      aria-labelledby={titelId}
    >
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      ) : null}
      <h2 id={titelId} className="qb-kf__titel">
        {KUNDENFRAGEN.titel}
      </h2>
      <div className="qb-kf__liste">
        {oben.map((item) => (
          <div key={item.q} data-qb-kundenfrage="">
            <FaqListe items={[item]} />
          </div>
        ))}
      </div>
    </section>
  );
}
