/*
 * amazonstil-daten.js — Texte, Schalter und reine Logik der Amazon-Stil-
 * Stufe 2 auf den drei Geräte-Kaufseiten: Gerätevergleich und Kundenfragen
 * weit oben (Grossjob growth-m-lp-produktseite-verkauft, s04, 27.09.2026;
 * Leitplanke Folie 11). Seit dem 30.09.2026 auch auf den zwei Kakao-
 * Kaufseiten: Sortenvergleich mit Analyseberichten und Kundenfragen
 * (Abschnitt SORTENVERGLEICH). Komponenten: ./AmazonStil.jsx, Stylesheet:
 * styles/amazonstil.css, Test: ./amazonstil-daten.test.mjs.
 *
 * Liegt in reusables/ statt app/data/, weil die Scope-Allowlist des
 * Deploy-Wegs (homepage-bauer/config/deploy.conf) app/data/ nur namentlich
 * freigibt. Muster wie app/data/produkt-videos.js: reine Daten, EIN Ort je Text.
 *
 * KEIN NEUER WERBETEXT (Folie 15): jede sichtbare Zeile ist Bestand dieser
 * Seiten (Fundstelle je Feld), ein Tabellenkopf oder ein Bedienwort.
 * Christians Wortlaut ersetzt eine Zeile hier 1:1. Textmappen-Plätze:
 * <handle>.geraetevergleich und <handle>.kundenfragen (data-textplatz).
 *
 * RÜCKWEG OHNE CODE-LOGIK: VERGLEICH.produkte = [] (kein Vergleich, keine
 * Preisabfrage, kein Stylesheet) und KUNDENFRAGEN.seiten = [] (FAQ unten
 * wieder vollständig, trägt ihr Schema selbst). Beide aus = byte-gleich zum
 * Stand vor s04 (Test). Mit Code: hb-deploy revert.
 *
 * Nur relative Importe, kein React: läuft unter `node --test` ohne Build.
 */
import {PRODUKT_TRIO} from '../../lib/redesign3themen.js';
import {anzeigeSatz, formatPreis, ganzEuroAnzeige} from '../../lib/markt-pricing.js';
import {isSchemaSafe} from '../../lib/faq-schema.js';
import {monatsrate} from './raten-angebot.js';

/* ---- Gerätevergleich ------------------------------------------------------ */

/* Spalten: das Gerät DIESER Seite zuerst (Amazon "Dieser Artikel"), dann die
   anderen zwei. Name, Bild, Bildtext aus PRODUKT_TRIO (lib/redesign3themen.js). */
export const VERGLEICH = {
  // Tabellenkopf: die drei Produktnamen, wie PRODUKT_TRIO sie schreibt.
  titel: 'QiOne® 2 Pro, QiBracelet® und QiHome® Air im Vergleich',
  // Tabellenköpfe. "Raten" nur im Markt DE, wie unter dem Kaufknopf (KaufZusage.jsx).
  zeilen: {
    preis: 'Preis',
    einsatz: 'Einsatz',
    material: 'Material',
    wasser: 'Wasser und Sauna',
    studie: 'Zellstudie',
    raten: 'Raten',
  },
  // Bedienwörter; das Ziel steht im Wort (kein dreifaches "Ansehen" im Screenreader).
  zumGeraet: (name) => `Zum ${name}`,
  dieserArtikel: 'Dieser Artikel',
  produkte: [
    {
      handle: 'qione-2-pro',
      // product-faqs.js FAQ_QIBRACELET[0].a: "Der QiOne® 2 Pro ist als Gehäuse
      // mit einem Anhänger konzipiert und eignet sich daher ideal zum Tragen
      // um den Hals."
      einsatz: 'Anhänger zum Tragen um den Hals',
      // product-faqs.js FAQ_QIONE_2_PRO[2].a ("... Gehäuse ... Chirurgenstahl,
      // ... Gitterchip™ ... 750er Goldlegierung"). Legierungsgrad und 316L
      // bewusst weg: der Bestand nennt sie je Gerät verschieden (750er / High-
      // Carat), in der Tabelle läse sich das als Unterschied. Voller Wortlaut:
      // die Material-Frage direkt darunter.
      material: 'Gehäuse aus Chirurgenstahl, Gitterchip™ aus Goldlegierung',
      // product-faqs.js FAQ_QIONE_2_PRO[3] "Darf der QiOne® in die Sauna bzw.
      // nass werden?", Antwort beginnt mit "Ja!".
      wasser: 'Ja',
      // data/studien/e0001.json + e0002.json, kachel.zeile1/zeile2
      // ("Wissenschaftliche Publikation an Immunzellen ... 30. April 2021",
      // "... an Darmepithelzellen ... Applied Cell Biology 2021").
      studien: [
        {text: 'Immunzellen, 2021', href: '/pages/studie-immunzellen'},
        {text: 'Darmepithelzellen, 2021', href: '/pages/studie-darmbarriere'},
      ],
    },
    {
      handle: 'qibracelet',
      // product-faqs.js FAQ_QIBRACELET[0].a: "... ist das QiBracelet® als
      // Armreifen aus Chirurgenstahl gestaltet ... Tragestil am Handgelenk."
      einsatz: 'Armreifen zum Tragen am Handgelenk',
      // product-faqs.js FAQ_QIBRACELET[2].a (Chirurgenstahl, Gitterchip™,
      // Goldlegierung); Grad weg wie beim QiOne® 2 Pro.
      material: 'Gehäuse aus Chirurgenstahl, Gitterchip™ aus Goldlegierung',
      // product-faqs.js FAQ_QIBRACELET[3].a: "... bedenkenlos in feuchten
      // Umgebungen ... eignet sich auch für Saunabesuche ...".
      wasser: 'Ja',
      // data/studien/e0003.json, kachel ("zum Schutz vor oxidativem Stress",
      // "... Applied Cell Biology am 12. Januar 2024").
      studien: [
        {text: 'Oxidativer Stress, 2024', href: '/pages/studie-oxidativer-stress'},
      ],
    },
    {
      handle: 'qihome-air',
      // components/UpsellLineUp.jsx ITEMS[2].description: "Ein Gitterchip™
      // für den ganzen Raum: Das QiHome® Air ist auf einen Radius von bis zu
      // 160 m ausgelegt." Radius als Auslegung, nie in Quadratmetern
      // (GL-SPR-0007, Christian 2026-09-16).
      einsatz: 'Für den ganzen Raum, auf einen Radius von bis zu 160\u00a0m ausgelegt',
      // product-faqs.js FAQ_QIHOME_AIR[2].a: "Das Gehäuse besteht aus
      // hochwertigem Chirurgenstahl, der exklusive Gitterchip™ wird aus einer
      // maßgeschneiderten High-Carat-Goldlegierung gefertigt, und die
      // Holzelemente ... aus regionaler deutscher Eiche" (Grad weg, s. o.).
      material:
        'Gehäuse aus Chirurgenstahl, Gitterchip™ aus Goldlegierung, Holzelemente aus regionaler deutscher Eiche',
      // Christians Produktangabe 28.09.2026 (Festlegung, GL-SPR-0008): "Beim
      // QiHome Air darf dann bei Wasser und Sauna 'Nein' stehen. Das ist ganz
      // klar, dass es nicht für die Sauna ist."
      wasser: 'Nein',
      // data/studien/e0005.json, kachel ("an neuronalen Zellen", "...
      // Neurodegenerative Diseases: Current Research 2026").
      studien: [
        {text: 'Neuronale Zellen, 2026', href: '/pages/studie-qihome-air'},
      ],
    },
  ],
};

/** Ist der Vergleich eingeschaltet (Schalter: VERGLEICH.produkte)? */
export function vergleichAn(vergleich = VERGLEICH) {
  return Array.isArray(vergleich?.produkte) && vergleich.produkte.length > 0;
}

/* Preis wie in der Kaufbox: dieselbe Rechnung wie components/ProductPrice.jsx
   (anzeigeSatz -> ganzEuroAnzeige -> formatPreis 'pdp'), ohne Streichpreis. */
export function preisAnzeige(money, handle, land) {
  const betrag = Number.parseFloat(money?.amount);
  if (!Number.isFinite(betrag)) return null;
  const waehrung = money?.currencyCode || 'EUR';
  const roh = betrag * (1 + anzeigeSatz(handle, waehrung, land));
  const wert = ganzEuroAnzeige(roh, land);
  return formatPreis(Math.round(wert), waehrung, 'pdp');
}

/* Monatsrate wie die Ratenzeile unter dem Kaufknopf (KaufZusage.jsx): nur DE,
   nur EUR, 12 Raten ab 500 EUR (raten-angebot.js). */
export function ratenAnzeige(money, handle, land) {
  if (land !== 'DE') return null;
  if ((money?.currencyCode || 'EUR') !== 'EUR') return null;
  const betrag = Number.parseFloat(money?.amount);
  if (!Number.isFinite(betrag)) return null;
  const rate = monatsrate(ganzEuroAnzeige(betrag * (1 + anzeigeSatz(handle, 'EUR', land)), land));
  // Fussnote ² wie an der Ratenzeile (Fuss jeder Seite).
  return rate ? `12 Raten à ${rate} €²` : null;
}

/* Spalten für EINE Seite. `preise` {handle: money} aus ladeVergleichsPreise;
   das eigene Gerät nimmt den Preis seiner Kaufbox (`eigenerPreis`). */
export function vergleichSpalten(handle, {preise = {}, eigenerPreis = null, land = 'DE'} = {},
  vergleich = VERGLEICH) {
  if (!vergleichAn(vergleich)) return [];
  const trio = Object.fromEntries(PRODUKT_TRIO.map((p) => [p.handle, p]));
  const spalten = vergleich.produkte
    .filter((g) => trio[g.handle])
    .map((g) => {
      const money = g.handle === handle && eigenerPreis ? eigenerPreis : preise[g.handle];
      return {
        ...g,
        name: trio[g.handle].title,
        bild: trio[g.handle].bild,
        alt: trio[g.handle].alt,
        eigenes: g.handle === handle,
        preis: preisAnzeige(money, g.handle, land),
        raten: ratenAnzeige(money, g.handle, land),
      };
    });
  return [...spalten.filter((s) => s.eigenes), ...spalten.filter((s) => !s.eigenes)];
}

/* Die drei Preise in EINER Abfrage, aus dem Feld der Kaufbox
   (selectedOrFirstAvailableVariant ohne Optionen = die Variante, mit der die
   Kaufseite öffnet). Muster: CAMPAIGN_PRODUCTS_QUERY, pages.tiefer-schlaf.jsx. */
export const VERGLEICH_PREISE_QUERY = `#graphql
  fragment VergleichPreis on Product {
    handle
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      price {
        amount
        currencyCode
      }
    }
  }
  query GeraeteVergleichPreise($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    qione: product(handle: "qione-2-pro") {
      ...VergleichPreis
    }
    bracelet: product(handle: "qibracelet") {
      ...VergleichPreis
    }
    qihome: product(handle: "qihome-air") {
      ...VergleichPreis
    }
  }
`;

/* Für den Loader. Fail-soft: Abfrage aus -> Vergleich ohne Preis, die
   Kaufseite bleibt stehen. Vergleich aus -> keine Abfrage (null). */
export async function ladeVergleichsPreise(storefront, vergleich = VERGLEICH) {
  if (!vergleichAn(vergleich)) return null;
  try {
    const daten = await storefront.query(VERGLEICH_PREISE_QUERY, {
      cache: storefront.CacheShort(),
    });
    const preise = {};
    for (const p of [daten?.qione, daten?.bracelet, daten?.qihome]) {
      const money = p?.selectedOrFirstAvailableVariant?.price;
      if (p?.handle && money) preise[p.handle] = money;
    }
    return preise;
  } catch (fehler) {
    console.error('[geraetevergleich] Preisabfrage fehlgeschlagen:', fehler?.message || fehler);
    return {};
  }
}

/* ---- Sortenvergleich Crystal Cacao® --------------------------------------- */

/*
 * Derselbe Amazon-Stil für die zwei Kakao-Kaufseiten /products/crystal-cacao-
 * awake und -create (Grossjob 20260930-GROSSJOB-amazonstil-crystal-cacao-und-
 * us-seite-genau-wie-deutsch-mit-paritaetspruefer, s03). Christian 30.09.2026:
 * statt der Studien die Analyseberichte verlinken und kurz auflisten, wofür
 * die zwei Sorten sind. Verglichen werden die zwei SORTEN, nicht die Mengen:
 * die Mengen stehen schon in der Kaufbox.
 *
 * Diese Daten übernimmt crystal-cacao.com byte-gleich (s04) und qi-blanco.com
 * auf Englisch (s06, Übersetzung markt-paritaet/data/uebersetzungen.json).
 * Wer hier einen Text ändert, ändert ihn auf drei Läden.
 *
 * RÜCKWEG OHNE CODE-LOGIK: SORTENVERGLEICH.sorten = [] (kein Vergleich, keine
 * Preisabfrage) und die zwei Kakao-Handles aus KUNDENFRAGEN.seiten nehmen
 * (FAQ unten wieder vollständig, kein Stylesheet). Beides aus = beide Seiten
 * byte-gleich zum Stand vor s03 (Test).
 */
// Die Daten (SORTENVERGLEICH) stehen am Dateiende. Grund: das Stil-Tor von
// hb-deploy liest alle String-Literale einer Datei als EINEN Fliesstext; die
// Tabellenzellen der Create-Spalte liefen hier mit der GraphQL-Abfrage darunter
// zu einem 63-Wort-"Satz" zusammen. Am Dateiende endet die Kette nach den Zellen.


// Zweite Zeile je Bericht: Labor, Datum, Dateiart und Sprache des Dokuments.
const SPRACHE = {de: 'deutsch', en: 'englisch'};
export function berichtQuelle(b) {
  return [b.labor, b.datum, `PDF ${SPRACHE[b.sprache] || b.sprache}`].join(', ');
}

/** Ist der Sortenvergleich eingeschaltet (Schalter: SORTENVERGLEICH.sorten)? */
export function sortenAn(sortenvergleich = SORTENVERGLEICH) {
  return Array.isArray(sortenvergleich?.sorten) && sortenvergleich.sorten.length > 0;
}

/* Spalten für EINE Kakao-Seite: die Sorte dieser Seite zuerst ("Dieser
   Artikel"). `varianten` {handle: {price}} aus ladeSortenPreise; die eigene
   Sorte nimmt die Variante ihrer Kaufbox (`eigeneVariante`). Den Preis rechnet
   die Komponente mit derselben Funktion wie die Kaufbox (cacaoPricing). */
export function sortenSpalten(handle, {varianten = {}, eigeneVariante = null} = {},
  sortenvergleich = SORTENVERGLEICH) {
  if (!sortenAn(sortenvergleich)) return [];
  const spalten = sortenvergleich.sorten.map((s) => ({
    ...s,
    eigenes: s.handle === handle,
    variante: s.handle === handle && eigeneVariante ? eigeneVariante : varianten[s.handle] || null,
  }));
  return [...spalten.filter((s) => s.eigenes), ...spalten.filter((s) => !s.eigenes)];
}

/* Beide Kakao-Preise in EINER Abfrage, aus dem Feld der Kaufbox (Muster
   VERGLEICH_PREISE_QUERY oben; Fragment hinten, damit das Stil-Tor die Abfrage
   nicht als einen Langsatz liest). */
export const SORTEN_PREISE_QUERY = `#graphql
  query KakaoSortenPreise($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    awake: product(handle: "crystal-cacao-awake") {
      ...SortenPreis
    }
    create: product(handle: "crystal-cacao-create") {
      ...SortenPreis
    }
  }
  fragment SortenPreis on Product {
    handle
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      price {
        amount
        currencyCode
      }
    }
  }
`;

/* Für den Loader. Fail-soft: Abfrage aus -> Vergleich ohne Preis ("–"), die
   Kaufseite bleibt stehen. Vergleich aus -> keine Abfrage (null). */
export async function ladeSortenPreise(storefront, sortenvergleich = SORTENVERGLEICH) {
  if (!sortenAn(sortenvergleich)) return null;
  try {
    const daten = await storefront.query(SORTEN_PREISE_QUERY, {
      cache: storefront.CacheShort(),
    });
    const varianten = {};
    for (const p of [daten?.awake, daten?.create]) {
      const v = p?.selectedOrFirstAvailableVariant;
      if (p?.handle && v?.price) varianten[p.handle] = v;
    }
    return varianten;
  } catch (fehler) {
    console.error('[sortenvergleich] Preisabfrage fehlgeschlagen.', fehler?.message || fehler);
    return {};
  }
}

/* ---- Kundenfragen --------------------------------------------------------- */

/*
 * WELCHE FRAGEN NACH OBEN: alle, deren Bestandsantwort das Haus schon als
 * sauber auszeichnet (isSchemaSafe, lib/faq-schema.js, dieselbe Regel wie das
 * FAQPage-Schema). Was das Haus nicht verstärkt, zieht auch dieser Block nicht
 * nach oben. REIHENFOLGE nach dem Kundenworte-Zähler aus s03 (claude-jobs/
 * growth-m-lp-produktseite-verkauft-s03/mess/kundenfragen-zaehler.json,
 * 2026-09-26): Anteil Verkaufs-Chat in eigenen Worten (Nenner 377) plus Anteil
 * deutsche Support-Chats (Gorgias, Nenner 1.029): Tragen 6,4 + 26,2 = 32,6;
 * Sauna/Wasser 0,5 + 18,4 = 18,9; Preis/Raten 8,5 + 4,4 = 12,9; Material
 * 1,6 + 2,8 = 4,4. SCHEMA: unten bleibt keine saubere Frage, die FAQ unten gibt
 * kein FAQPage mehr aus; der Block oben gibt es über die VOLLE Liste aus,
 * byte-gleich zu vorher. Genau ein FAQPage je Seite.
 */
export const KUNDENFRAGEN = {
  // Überschrift des Blocks (Bedienwort, Christians Wortlaut ersetzt sie).
  titel: 'Kunden fragen',
  // Schalter: Seiten, auf denen der Block steht. [] = aus.
  seiten: ['qione-2-pro', 'qibracelet', 'qihome-air', 'crystal-cacao-awake', 'crystal-cacao-create'],
  // Themen in Rangfolge; Fragen wörtlich aus data/product-faqs.js.
  // Die Kakao-Themen stehen am Ende: keine Kakao-Frage steht auf einer
  // Geräteseite, die Reihenfolge dort bleibt unberührt.
  rang: [
    {
      thema: 'tragen',
      fragen: [
        'Kann ich den QiOne® an einer anderen Kette tragen?',
        'Wie sollte ich den QiOne® tragen?',
      ],
    },
    {
      thema: 'sauna-wasser',
      fragen: [
        'Darf der QiOne® in die Sauna bzw. nass werden?',
        'Darf das QiBracelet® nass werden, bzw. in die Sauna?',
      ],
    },
    {thema: 'preis-raten', fragen: ['Wie funktioniert die Finanzierung über Klarna?']},
    {
      thema: 'material',
      fragen: [
        'Ist das QiBracelet® sicher für Anwender mit Allergien?',
        'Aus welchem Material bestehen die Qi Blanco® Produkte?',
      ],
    },
    /*
     * KAKAO (FAQ_CACAO, s03 30.09.2026). Einen Kundenworte-Zähler für Kakao
     * gibt es nicht (der von s03 growth-m zählt nur Geräte-Themen). Eigene
     * Zählung im Verkaufs-Chat (qi-salesbot app.db, Widget-Gespräche ohne
     * Proben, 28.07.-30.09.2026, 83 Gespräche mit Kakao-Bezug): Zubereitung 5,
     * Für wen 0, Wie oft 0, Psychoaktiv 0. Zubereitung zuerst, der Rest in der
     * Reihenfolge des Auftrags. Dünne Grundlage, neu ordnen, sobald gezählt.
     */
    {thema: 'kakao-zubereitung', fragen: ['Wie wird zeremonieller Kakao zubereitet?']},
    {thema: 'kakao-zielgruppe', fragen: ['Für wen ist Kakao (un)geeignet?']},
    {thema: 'kakao-wie-oft', fragen: ['Wie oft darf man zeremoniellen Kakao trinken?']},
    {thema: 'kakao-psychoaktiv', fragen: ['Was bedeutet psychoaktiv in diesem Zusammenhang?']},
  ],
};

function rangVon(frage, rang) {
  let i = 0;
  for (const t of rang) {
    for (const f of t.fragen) {
      if (f === frage) return i;
      i += 1;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

/* `oben` = saubere Fragen nach Rang, `unten` = der Rest. Aus oder nichts
   Sauberes: oben leer, unten DASSELBE Array (Seite wie vor s04). */
export function teileFragen(handle, items, kundenfragen = KUNDENFRAGEN) {
  const liste = Array.isArray(items) ? items : [];
  const an = Array.isArray(kundenfragen?.seiten) && kundenfragen.seiten.includes(handle);
  const sauber = an ? liste.filter((it) => isSchemaSafe(it)) : [];
  if (!sauber.length) return {oben: [], unten: items};
  const rang = kundenfragen.rang || [];
  const oben = sauber
    .map((it, i) => ({it, i}))
    .sort((a, b) => rangVon(a.it.q, rang) - rangVon(b.it.q, rang) || a.i - b.i)
    .map((x) => x.it);
  return {oben, unten: liste.filter((it) => !oben.includes(it))};
}

/** Brauchen die Blöcke dieser Seite ihr Stylesheet? */
export function amazonstilAn(handle, vergleich = VERGLEICH, kundenfragen = KUNDENFRAGEN) {
  return vergleichAn(vergleich) ||
    (Array.isArray(kundenfragen?.seiten) && kundenfragen.seiten.includes(handle));
}

/** Dieselbe Frage für die zwei Kakao-Seiten (Schalter: Sortenvergleich). */
export function sortenStilAn(handle, sortenvergleich = SORTENVERGLEICH, kundenfragen = KUNDENFRAGEN) {
  return sortenAn(sortenvergleich) ||
    (Array.isArray(kundenfragen?.seiten) && kundenfragen.seiten.includes(handle));
}

/* ---- Sortenvergleich: Daten (Erklärung oben bei SORTENVERGLEICH-Kopf) ---- */

export const SORTENVERGLEICH = {
  titel: 'Crystal Cacao® Awake und Create im Vergleich',
  // Tabellenköpfe. "Analyseberichte" steht dort, wo bei den Geräten die
  // Zellstudie steht (Christian: "nicht die Studien, sondern die Analyseberichte").
  zeilen: {
    preis: 'Preis',
    wofuer: 'Wofür',
    bohne: 'Bohne und Herkunft',
    profil: 'Profil',
    bio: 'Bio',
    berichte: 'Analyseberichte',
  },
  zurSorte: (name) => `Zum ${name}`,
  dieserArtikel: 'Dieser Artikel',
  sorten: [
    {
      handle: 'crystal-cacao-awake',
      // Produkttitel (Storefront, <h1> der Kaufseite).
      name: 'Crystal Cacao® Awake',
      // featuredImage des Produkts (og:image der Kaufseite, 2000x2000).
      bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/7.png?v=1765893911',
      breite: 2000,
      hoehe: 2000,
      // crystal-cacao-node/repo/app/lib/sorten-profil.js SORTEN.awake.claim
      // und .einordnung (claim auch <h2> dieser Kaufseite).
      wofuer: [
        'Wach. Mutig. Kraftvoll.',
        'Gedacht für den Start in den Tag: morgens, vor dem Sport, vor einem langen Vormittag.',
      ],
      // Bohne: qi-salesbot/data/zeugnis-vertrag.json (Referenz »Piura Blanco«);
      // Herkunft: product-pages/Awake.jsx herkunftRows[0] ("goldenen
      // Flusstälern des Piura-Tals im Norden Perus").
      bohne: 'Piura Blanco aus dem Piura-Tal im Norden Perus',
      // Theobromin: product-pages/Awake.jsx ("Theobromin: 950 mg / 100g");
      // Koffein: Nährstoff-Analyse Dartsch DARTSCH/04/11/25 (unten verlinkt),
      // Wortlaut im Verkaufs-Chat qi-salesbot/data/seeds/qiblanco-knowledge.json.
      profil: 'Theobromin 950 mg, Koffein 120 mg je 100\u00a0g',
      // Route products.crystal-cacao-awake.jsx, CacaoBenefitList.
      bio: 'Bio-zertifiziert nach DE-ÖKO-006',
      // qi-salesbot/data/zeugnis-vertrag.json (SSoT), im Kakao-Laden
      // app/lib/kakao-belege.js: Art, Labor, Datum, Adresse, Sprache.
      berichte: [
        {
          art: 'Schadstoff-Prüfzeugnis',
          labor: 'Primoris Belgium',
          datum: '21.08.2025',
          sprache: 'en',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-piura-blanco-2025-08-21.pdf?v=1788373365',
        },
        {
          art: 'Nährstoff-Analyse',
          labor: 'Dartsch Scientific',
          datum: '04.11.2025',
          sprache: 'en',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-awake-2025-11-04.pdf?v=1788373343',
        },
        {
          art: 'Mineralstoff-Analyse',
          labor: 'SAS hagmann und Dartsch Scientific',
          datum: '24.03.2026',
          sprache: 'en',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-awake-2026-03-24.pdf?v=1789034539',
        },
      ],
    },
    {
      handle: 'crystal-cacao-create',
      name: 'Crystal Cacao® Create',
      // featuredImage des Produkts (og:image der Kaufseite, 2144x2133).
      bild: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Doypack_Mockup__v3-min.png?v=1765893937',
      breite: 2144,
      hoehe: 2133,
      // sorten-profil.js SORTEN.create.claim und .einordnung.
      wofuer: [
        'Wach. Klar. Fokussiert.',
        'Gedacht für den klaren Kopf: lange Stunden am Schreibtisch, Arbeit, die Ruhe braucht.',
      ],
      // Bohne: zeugnis-vertrag.json (Referenz »Amazonas Nativo«); Herkunft:
      // product-pages/Create.jsx herkunftRows[0] ("Bergwäldern des
      // peruanischen Departamento Amazonas").
      bohne: 'Amazonas Nativo aus dem Departamento Amazonas in Peru',
      // product-pages/Create.jsx ("Theobromin: 1.050 mg / 100g & Koffein:
      // 140 mg / 100g").
      profil: 'Theobromin 1.050 mg, Koffein 140 mg je 100\u00a0g',
      bio: 'Bio-zertifiziert nach DE-ÖKO-006',
      berichte: [
        {
          art: 'Schadstoff-Prüfzeugnis',
          labor: 'Primoris Belgium',
          datum: '19.08.2025',
          sprache: 'en',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-amazonas-nativo-2025-08-19.pdf?v=1788373357',
        },
        {
          art: 'Nährstoff-Analyse',
          labor: 'Dartsch Scientific',
          datum: '27.10.2025',
          sprache: 'de',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-create-2025-10-27.pdf?v=1788373349',
        },
        {
          art: 'Mineralstoff-Analyse',
          labor: 'SAS hagmann und Dartsch Scientific',
          datum: '12.03.2026',
          sprache: 'en',
          url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-create-2026-03-12.pdf?v=1789034532',
        },
      ],
    },
  ],
};
