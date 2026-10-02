import {
  KT_BILDER,
  KT_DOKUMENTE,
  KT_LOQ,
  KT_MINERALSTOFFE,
  KT_PROFIL,
  KT_SORTEN,
  KT_TEXTE,
} from './kakao-tiefe-daten';

/**
 * KAKAO-TIEFE — alles unter dem Amazon-Bereich der Kakao-Kaufseiten, im
 * Gestaltungssystem der Startseite von crystal-cacao.com.
 *
 * Grossjob 20261002-GROSSJOB-kakaoseiten-mineralstoffe-dartsch-und-crystal-
 * niveau-auf-dach-und-us. EIN Baustein für drei Läden: qiblanco.com und
 * crystal-cacao.com rendern ihn direkt (K1, byte-gleich), der US-Shop bekommt
 * sein Markup per renderToStaticMarkup(<KakaoTiefe sprache="en" />) als
 * Liquid-Snippet. Darum gilt hier: reines React, kein Hydrogen-Hook, kein
 * Router-Link, kein Zustand, kein Effekt. Was im Browser läuft, muss auch
 * als statisches HTML stimmen.
 *
 * Reihenfolge (Mehrwert -> Wirkung -> Einordnung -> Herkunft -> Ritual ->
 * Belege): Mineralstoffe · Analyseprofil · Einordnung · Herkunft ·
 * Zubereitung · Prüfdokumente. Der Laden crystal-cacao.com führt seine
 * Prüfdokumente schon als `.cc-belege` (bewacht von probe_belege_abrufbar)
 * und ruft deshalb mit belege={false}.
 *
 * FARBE: die Sorte der Seite trägt ihre Sortenfarbe, die Vergleichssorte
 * ein Neutral (data-kt-farbe="neutral"). So bleibt es je Seite bei Gold plus
 * EINER Sortenfarbe; eine dritte gesättigte Farbwelt kostet in der
 * design-rubrik 25 Punkte (Kandidat 2026-10-02: 88 statt 95).
 *
 * MESSBAR: jede Mineralstoff-Kachel trägt data-kt-symbol und data-kt-wert
 * (der Rohwert der JSON). Daran hält probe_mineralstoffe_naht.py die sechs
 * Seiten gegen den Dartsch-Auszug.
 */

const ANDERE = {awake: 'create', create: 'awake'};
const MONATE_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fuelle(vorlage, werte) {
  return vorlage.replace(/\{(\w+)\}/g, (_, k) => (k in werte ? String(werte[k]) : `{${k}}`));
}

/** Berichtswert -> Anzeige. Nur das Dezimalzeichen wechselt; '<' hält am Wert. */
function zeigeWert(w, sprache) {
  const t = sprache === 'de' ? w.replace('.', ',') : w;
  return t.replace('< ', '< ');
}

/** Zahl für Balken; '< 0.001' zählt als 0. */
function zahl(w) {
  return w.startsWith('<') ? 0 : Number(w);
}

function tausender(n, sprache) {
  const s = String(n);
  const t = sprache === 'de' ? '.' : ',';
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, t);
}

function datum(iso, sprache) {
  const [j, m, t] = iso.split('-');
  return sprache === 'de' ? `${t}.${m}.${j}` : `${MONATE_EN[Number(m) - 1]} ${Number(t)}, ${j}`;
}

function liste(namen, und) {
  if (namen.length < 2) return namen.join('');
  return `${namen.slice(0, -1).join(', ')} ${und} ${namen[namen.length - 1]}`;
}

/** Shopify-CDN skaliert per &width=; nur Stufen unter dem Master. */
function bildAttr(b, sizes) {
  const stufen = [360, 540, 720, 960, 1200].filter((w) => w < b.breite);
  const trenner = b.url.includes('?') ? '&' : '?';
  return {
    src: `${b.url}${trenner}width=${stufen[stufen.length - 1] ?? b.breite}`,
    srcSet: [...stufen.map((w) => `${b.url}${trenner}width=${w} ${w}w`), `${b.url} ${b.breite}w`].join(', '),
    sizes,
    width: b.breite,
    height: b.hoehe,
  };
}

const SIZES_HALB = '(min-width: 48em) 34rem, calc(100vw - 48px)';

function Kopf({augenbraue, titel, lead, id}) {
  return (
    <header className="kt-kopf">
      <p className="kt-augenbraue">{augenbraue}</p>
      <h2 id={id}>{titel}</h2>
      {lead ? <p className="kt-lead">{lead}</p> : null}
    </header>
  );
}

function Legende({sorte}) {
  return (
    <p className="kt-legende">
      <span className="kt-legende__eintrag" data-kt-farbe={sorte}>
        {KT_SORTEN[sorte].name}
      </span>
      <span className="kt-legende__eintrag" data-kt-farbe="neutral">
        {KT_SORTEN[ANDERE[sorte]].name}
      </span>
    </p>
  );
}

/* ==== Akt 1 · Mineralstoffe ============================================= */

function mineralZeilen(sorte) {
  const andere = new Map(KT_MINERALSTOFFE.sorten[ANDERE[sorte]].map((e) => [e.s, e.w]));
  return KT_MINERALSTOFFE.sorten[sorte].map((e) => ({...e, andere: andere.get(e.s)}));
}

/** Absteigend nach Gehalt dieser Sorte; '<'-Werte ans Ende, sonst Berichtsfolge. */
function sortiert(zeilen) {
  return zeilen
    .map((e, i) => ({e, i}))
    .sort((x, y) => {
      const ux = x.e.w.startsWith('<');
      const uy = y.e.w.startsWith('<');
      if (ux !== uy) return ux ? 1 : -1;
      return zahl(y.e.w) - zahl(x.e.w) || x.i - y.i;
    })
    .map((x) => x.e);
}

function Kachel({e, sorte, sprache, t}) {
  const name = sprache === 'de' ? e.de : e.en;
  const diese = zahl(e.w);
  const andere = e.andere ? zahl(e.andere) : 0;
  const max = Math.max(diese, andere) || 1;
  const unter = e.w.startsWith('<');
  return (
    <li
      className={`kt-kachel${unter ? ' kt-kachel--unter' : ''}`}
      data-kt-symbol={e.s}
      data-kt-wert={e.w}
      data-kt-gruppe={e.g}
    >
      <span className="kt-kachel__symbol" aria-hidden="true">
        {e.s}
      </span>
      <span className="kt-kachel__name">{name}</span>
      <span className="kt-kachel__wert">{zeigeWert(e.w, sprache)}</span>
      {unter ? <span className="kt-kachel__hinweis">{t.unter}</span> : null}
      {e.andere ? (
        <span className="kt-kachel__vergleich">
          <span className="kt-balken" aria-hidden="true">
            <span
              className="kt-balken__fuellung"
              data-kt-farbe={sorte}
              style={{'--kt-anteil': `${Math.round((diese / max) * 1000) / 10}%`}}
            />
          </span>
          <span className="kt-balken" aria-hidden="true">
            <span
              className="kt-balken__fuellung"
              data-kt-farbe="neutral"
              style={{'--kt-anteil': `${Math.round((andere / max) * 1000) / 10}%`}}
            />
          </span>
          <span className="kt-kachel__andere">
            {KT_SORTEN[ANDERE[sorte]].name} {zeigeWert(e.andere, sprache)}
          </span>
        </span>
      ) : null}
    </li>
  );
}

function vergleichSaetze(sprache, t) {
  const a = KT_MINERALSTOFFE.sorten.awake.filter((e) => e.g === 'hoch');
  const c = new Map(KT_MINERALSTOFFE.sorten.create.map((e) => [e.s, e]));
  const nameVon = (e) => (sprache === 'de' ? e.de : e.en.toLowerCase());
  const mehr = {awake: [], create: []};
  const gleich = [];
  for (const e of a) {
    const x = zahl(e.w);
    const y = zahl(c.get(e.s).w);
    if (x === y) gleich.push(nameVon(e));
    else mehr[x > y ? 'awake' : 'create'].push(nameVon(e));
  }
  const vorn = mehr.create.length >= mehr.awake.length ? 'create' : 'awake';
  const hinten = ANDERE[vorn];
  const saetze = [
    fuelle(t.vergleich_mehr, {
      a: KT_SORTEN[vorn].name,
      b: KT_SORTEN[hinten].name,
      n: mehr[vorn].length,
      gesamt: a.length,
    }),
  ];
  if (gleich.length) saetze.push(fuelle(t.vergleich_gleich, {liste: liste(gleich, t.und)}));
  if (mehr[hinten].length) {
    saetze.push(fuelle(t.vergleich_vorn, {b: KT_SORTEN[hinten].name, liste: liste(mehr[hinten], t.und)}));
  }
  return saetze;
}

function Mineralstoffe({sorte, sprache}) {
  const t = KT_TEXTE[sprache].mineral;
  const zeilen = mineralZeilen(sorte);
  const hoch = sortiert(zeilen.filter((e) => e.g === 'hoch'));
  const spur = sortiert(zeilen.filter((e) => e.g === 'spur'));
  const bericht = KT_MINERALSTOFFE.bericht[sorte];
  const loq = zeigeWert(KT_LOQ, sprache);
  const wert = (s) => zeilen.find((e) => e.s === s)?.w ?? '';
  const ag = wert('Ag');
  const pt = wert('Pt');
  const schadstoff = KT_DOKUMENTE[sorte].find((d) => d.art === 'schadstoff');
  const name = KT_SORTEN[sorte].name;
  return (
    <section className="kt-akt kt-akt--flaeche kt-mineral" aria-labelledby="kt-mineral-titel">
      <div className="kt-akt__innen">
        <Kopf
          id="kt-mineral-titel"
          augenbraue={t.augenbraue}
          titel={fuelle(t.titel, {anzahl: zeilen.length})}
          lead={fuelle(t.lead, {name: `Crystal Cacao® ${name}`})}
        />
        <Legende sorte={sorte} />

        <div className="kt-gruppe">
          <h3 className="kt-gruppe__titel">
            {t.hoch} <span className="kt-gruppe__zahl">{fuelle(t.elemente, {n: hoch.length})} · mg/kg</span>
          </h3>
          <p className="kt-gruppe__regel">{fuelle(t.hoch_regel, {loq})}</p>
          <ol className="kt-kacheln kt-kacheln--hoch">
            {hoch.map((e) => (
              <Kachel key={e.s} e={e} sorte={sorte} sprache={sprache} t={t} />
            ))}
          </ol>
        </div>

        <div className="kt-gruppe">
          <h3 className="kt-gruppe__titel">
            {t.spur} <span className="kt-gruppe__zahl">{fuelle(t.elemente, {n: spur.length})} · mg/kg</span>
          </h3>
          <p className="kt-gruppe__regel">{fuelle(t.spur_regel, {loq})}</p>
          <ol className="kt-kacheln kt-kacheln--spur">
            {spur.map((e) => (
              <Kachel key={e.s} e={e} sorte={sorte} sprache={sprache} t={t} />
            ))}
          </ol>
        </div>

        <div className="kt-vergleich">
          <h3 className="kt-gruppe__titel">
            {fuelle(t.vergleich_titel, {name, andere: KT_SORTEN[ANDERE[sorte]].name})}
          </h3>
          {vergleichSaetze(sprache, t).map((s) => (
            <p key={s}>{s}</p>
          ))}
          {ag && pt && !ag.startsWith('<') && !pt.startsWith('<') ? (
            <p>{fuelle(t.fund, {ag: zeigeWert(ag, sprache), pt: zeigeWert(pt, sprache)})}</p>
          ) : null}
        </div>

        <div className="kt-quelle">
          <p>
            {fuelle(t.quelle, {nr: bericht.nr, datum: datum(bericht.datum, sprache), probe: bericht.probe})}{' '}
            <a className="kt-link" href={KT_MINERALSTOFFE.quelle[sorte]} target="_blank" rel="noopener noreferrer">
              {t.quelle_link}
            </a>
          </p>
          <p>
            {t.schadstoff}{' '}
            <a className="kt-link" href={schadstoff.url} target="_blank" rel="noopener noreferrer">
              {fuelle(t.schadstoff_link, {datum: datum(schadstoff.datum, sprache)})}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==== Akt 2 · Analyseprofil ============================================= */

function Analyseprofil({sorte, sprache}) {
  const t = KT_TEXTE[sprache].profil;
  const andere = ANDERE[sorte];
  const naehrstoff = KT_DOKUMENTE[sorte].find((d) => d.art === 'naehrstoff');
  return (
    <section className="kt-akt kt-akt--grund kt-profil" aria-labelledby="kt-profil-titel">
      <div className="kt-akt__innen">
        <Kopf
          id="kt-profil-titel"
          augenbraue={t.augenbraue}
          titel={fuelle(t.titel, {name: KT_SORTEN[sorte].name})}
          lead={fuelle(t.lead, {andere: KT_SORTEN[andere].name})}
        />
        <Legende sorte={sorte} />
        <dl className="kt-profil__liste">
          {KT_PROFIL.map((z) => {
            const max = Math.max(z.awake, z.create);
            return (
              <div className="kt-profil__zeile" key={z.key} data-kt-stoff={z.key}>
                <dt className="kt-profil__stoff">
                  <span className="kt-profil__name">{z[sprache]}</span>
                  {z.bedeutung[sprache] ? <span className="kt-profil__bedeutung">{z.bedeutung[sprache]}</span> : null}
                </dt>
                {[sorte, andere].map((s) => (
                  <dd className="kt-profil__wertzeile" key={s}>
                    <span className="kt-profil__sorte" data-kt-farbe={s === sorte ? s : 'neutral'}>
                      {KT_SORTEN[s].name}
                    </span>
                    <span className="kt-balken" aria-hidden="true">
                      <span
                        className="kt-balken__fuellung"
                        data-kt-farbe={s === sorte ? s : 'neutral'}
                        style={{'--kt-anteil': `${Math.round((z[s] / max) * 1000) / 10}%`}}
                      />
                    </span>
                    <span className="kt-profil__wert">
                      {tausender(z[s], sprache)} {z.einheit}
                    </span>
                  </dd>
                ))}
              </div>
            );
          })}
        </dl>
        <p className="kt-deutung" data-kt-farbe={sorte}>
          {t.deutung[sorte]}{' '}
          <a className="kt-link" href={naehrstoff.url} target="_blank" rel="noopener noreferrer">
            {t.quelle_link}
          </a>
        </p>
      </div>
    </section>
  );
}

/* ==== Akt 3 · Einordnung ================================================ */

function Einordnung({sorte, sprache}) {
  const t = KT_TEXTE[sprache].einordnung;
  return (
    <section className="kt-akt kt-akt--flaeche kt-einordnung" aria-labelledby="kt-einordnung-titel">
      <div className="kt-akt__innen">
        <Kopf id="kt-einordnung-titel" augenbraue={t.augenbraue} titel={t.titel} lead={t.lead} />
        <ol className="kt-leiter">
          {t.stufen.map((s, i) => (
            <li key={s.name} className={`kt-stufe${s.marke ? ' kt-stufe--wir' : ''}`}>
              <span className="kt-stufe__nr" aria-hidden="true">
                {i + 1}
              </span>
              <span className="kt-stufe__name">{s.name}</span>
              {s.marke ? <span className="kt-stufe__marke">{s.marke}</span> : null}
              <span className="kt-stufe__text">{s.text}</span>
            </li>
          ))}
        </ol>
        <div className="kt-urstamm">
          <h3 className="kt-gruppe__titel">{t.urstamm_titel}</h3>
          <p>{t.urstamm_text}</p>
          <ul className="kt-urstamm__liste">
            {[sorte, ANDERE[sorte]].map((s) => (
              <li key={s} data-kt-farbe={s === sorte ? s : 'neutral'}>
                <span className="kt-urstamm__name">{KT_SORTEN[s].urstamm}</span>
                {t.urstamm[s]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ==== Akt 4 · Herkunft ================================================== */

function Herkunft({sorte, sprache}) {
  const t = KT_TEXTE[sprache].herkunft;
  return (
    <section className="kt-akt kt-akt--grund kt-herkunft" aria-labelledby="kt-herkunft-titel">
      <div className="kt-akt__innen">
        <Kopf id="kt-herkunft-titel" augenbraue={t.augenbraue} titel={t.titel[sorte]} />
        <div className="kt-paar">
          <div className="kt-paar__text">
            {t.text[sorte].map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <figure className="kt-bild">
            <img {...bildAttr(KT_SORTEN[sorte].bilder.tal, SIZES_HALB)} alt={t.alt_tal[sorte]} loading="lazy" decoding="async" />
          </figure>
        </div>
        <div className="kt-paar kt-paar--gedreht">
          <div className="kt-paar__text">
            <h3 className="kt-gruppe__titel">{t.ursprung_titel}</h3>
            {t.ursprung.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <figure className="kt-bild">
            <img {...bildAttr(KT_BILDER.montegrande, SIZES_HALB)} alt={t.alt_montegrande} loading="lazy" decoding="async" />
            <figcaption>{t.copyright}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ==== Akt 5 · Zubereitung =============================================== */

function Zubereitung({sprache}) {
  const t = KT_TEXTE[sprache].zubereitung;
  return (
    <section className="kt-akt kt-akt--flaeche kt-zubereitung" aria-labelledby="kt-zubereitung-titel">
      <div className="kt-akt__innen">
        <Kopf id="kt-zubereitung-titel" augenbraue={t.augenbraue} titel={t.titel} />
        <div className="kt-paar">
          <div className="kt-paar__text">
            <ol className="kt-schritte">
              {t.schritte.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="kt-hinweis">{t.hinweis}</p>
          </div>
          <figure className="kt-bild">
            <img {...bildAttr(KT_BILDER.kristall, SIZES_HALB)} alt={t.alt} loading="lazy" decoding="async" />
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ==== Akt 6 · Prüfdokumente ============================================ */

function Pruefdokumente({sorte, sprache}) {
  const t = KT_TEXTE[sprache].belege;
  return (
    <section className="kt-akt kt-akt--grund kt-belege" aria-labelledby="kt-belege-titel">
      <div className="kt-akt__innen">
        <Kopf
          id="kt-belege-titel"
          augenbraue={t.augenbraue}
          titel={fuelle(t.titel, {name: `Crystal Cacao® ${KT_SORTEN[sorte].name}`})}
          lead={t.lead}
        />
        <ul className="kt-dokumente">
          {KT_DOKUMENTE[sorte].map((d) => (
            <li key={d.url} className="kt-dokument" data-kt-art={d.art}>
              <a className="kt-dokument__titel" href={d.url} target="_blank" rel="noopener noreferrer">
                {d.titel[sprache]}
              </a>
              <dl className="kt-dokument__daten">
                <dt>{t.geprueft}</dt>
                <dd>{d.geprueft[sprache]}</dd>
                <dt>{t.labor}</dt>
                <dd>{sprache === 'en' && d.labor_en ? d.labor_en : d.labor}</dd>
                <dt>{t.datum}</dt>
                <dd>{datum(d.datum, sprache)}</dd>
                <dt>{t.nummer}</dt>
                <dd>{d.kennung[sprache]}</dd>
                <dt>{t.datei}</dt>
                <dd>
                  {fuelle(t.datei_text, {
                    sprache: t.sprachen[d.sprache],
                    seiten: d.seiten === 1 ? t.seite : fuelle(t.seiten, {n: d.seiten}),
                  })}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * @param {{sorte: 'awake'|'create', sprache?: 'de'|'en', belege?: boolean}} props
 */
export function KakaoTiefe({sorte, sprache = 'de', belege = true}) {
  if (!KT_SORTEN[sorte] || !KT_TEXTE[sprache]) return null;
  return (
    <div className="kt" data-kt-sorte={sorte} lang={sprache}>
      <Mineralstoffe sorte={sorte} sprache={sprache} />
      <Analyseprofil sorte={sorte} sprache={sprache} />
      <Einordnung sorte={sorte} sprache={sprache} />
      <Herkunft sorte={sorte} sprache={sprache} />
      <Zubereitung sprache={sprache} />
      {belege ? <Pruefdokumente sorte={sorte} sprache={sprache} /> : null}
    </div>
  );
}

export default KakaoTiefe;
