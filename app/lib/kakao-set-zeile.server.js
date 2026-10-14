import {CartForm} from '@shopify/hydrogen';
import {
  KAKAO_NORMALFORM_MAX,
  KAKAO_ZEILEN,
  SET_GROESSE_MIN,
  UMRECHNUNGS_LAENDER,
  kakaoFestbetragGetroffen,
  kakaoPreisschutz,
  kakaoSetArt,
  kakaoSollZeilen,
  kakaoZeilenPlan,
  sortenSetsGleicherMenge,
  stepperEinzelZeilen,
  stepperZusammensetzung,
} from '~/lib/kakao-set-zeile';
import {istBrutto} from '~/lib/preismodus';

/*
 * Stellt nach jeder Zeilen-Aktion die Kakao-Normalform her (Regel und Messung
 * in ~/lib/kakao-set-zeile.js). Aufgerufen aus der Warenkorb-Action
 * (routes/cart.jsx) und dem Warenkorb-Permalink (routes/cart.$lines.jsx) —
 * dieselben zwei Türen wie bei den Qi-Master-Add-ons.
 *
 * WARUM AM WARENKORB UND NICHT IN DER KAUFFORM: die 2x/3x-Auswahl der
 * Kaufseite ist nur EIN Weg zu Menge 2/3. Der Stepper im Warenkorb, ein
 * zweites "In den Warenkorb" derselben Sorte und ein Partner-Permalink
 * (/cart/<variante>:3?discount=<code>) führen genauso dorthin, und in jedem
 * dieser Fälle verlöre der Partnercode wieder gegen die Automatik.
 *
 * WIE: der Tausch geschieht AN ORT (cartLinesUpdate mit merchandiseId). Das
 * ist eine Mutation, die Zeilen-id und Zeilen-Attribute bleiben, die
 * Warenkorb-Attribute (_qpx_anon, Herkunft, UTM) werden nicht berührt
 * (gemessen 2026-09-29 an der Storefront-API).
 *
 * NIE TEURER: das Set wird nur gelegt, wenn sein Preis im Markt des
 * Warenkorbs nicht über dem Betrag der Einzelzeile vor Code liegt. In EUR
 * sind beide centgleich, in USD ist das Set billiger, in CHF ist das
 * Create-Set 0,22 bzw. 1,05 teurer (gemessen 2026-09-29) — dort bleibt die
 * Einzelzeile. Die Varianten werden zur Laufzeit über den Handle aufgelöst,
 * nie als ID getippt.
 *
 * GEMISCHTE SETS NIE BILLIGER ALS DAS SORTEN-SET (Elina EL-20260930-9c7bdd63):
 * die drei gemischten Sets tragen in EUR den Staffelpreis, in Fremdwährung
 * rechnet Shopify sie aber um, während die Sorten-Sets dort Festpreise der
 * Markt-Preisliste haben. Gemessen 2026-09-30: USD 1+1 = 139 gegen Sorten-Set
 * 159 und Automatik 165,57 — ein Umleger wäre dort ein stiller Preisnachlass
 * von 16 %, den niemand entschieden hat. Ein gemischtes Set wird darum nur
 * gelegt, wenn es im Markt auch nicht unter dem billigsten Sorten-Set
 * derselben Packungszahl liegt (EUR centgleich, CHF 116 = 116). Bekommt es
 * einen Festpreis in der Preisliste, greift es dort ohne Codeänderung.
 *
 * AB 4 PACKUNGEN IST DER ANKER DER EINZELWEG MIT AUTOMATIK (2026-09-30,
 * Großjob kakao-partnercodes-alle-mengen, s03). Für 4 bis 7 Packungen sind
 * die Sorten-Sets selbst neu, es gibt also kein älteres Set als Maßstab. Die
 * Untergrenze ist dort der gemessene Betrag der Einzelzeilen vor Code, also
 * genau das, was der Kunde ohne Set heute zahlt. Zusammen mit "nie teurer"
 * heißt das: centgleich, bis auf ANKER_TOLERANZ_CENT_JE_ZEILE (Rundung je
 * Einzelzeile). In EUR und USD sind die Sets centgleich (gemessen s02). In CH
 * hält der Takt partner-manager/bin/kakao-set-chf die Festpreise der Sets auf
 * dem gemessenen Einzelweg. In Ländern ohne Preisliste in der Landeswährung
 * (UMRECHNUNGS_LAENDER: LI, GB, PL, SE) gilt das Rundungsband der Umrechnung,
 * Herleitung bei der Konstante.
 *
 * FESTBETRÄGE DE AB 4 PACKUNGEN (Christian 09.10.2026): nach dem Brutto-Kipp
 * kosten die Sets in DE 213 / 266 / 319 / 372 €, der Einzelweg mit 30 %
 * 212,80 / 266,00 / 319,20 / 372,40 €. Dort ist der Festbetrag der Anker
 * (kakaoFestbetragGetroffen: DE, EUR, Preismodus brutto, jede Set-Zeile auf
 * den Cent). Vor dem Kipp greift er nie. Seit dem 10.10. ebenso CH (ganze
 * Franken je Zusammensetzung) und US (ganze Dollar je Größe).
 *
 * MEHRERE SET-ZEILEN (ab 8 Packungen): verglichen wird die SUMME aller
 * Set-Zeilen gegen die Summe der Einzelzeilen. Die Einzelzeilen werden an Ort
 * zu Set-Zeilen; gibt es mehr Set- als Einzelzeilen, werden die übrigen
 * VORHER angelegt, und scheitert danach der Tausch, werden sie wieder
 * entfernt (keine Packung doppelt im Warenkorb).
 *
 * FAIL-SOFT: jeder Lese- oder Auflösefehler lässt das Ergebnis der
 * Kundenaktion unverändert (eine Warnung im Log, kein leerer Warenkorb).
 * Kill-Schalter: env KAKAO_SET_ZEILE=off.
 *
 * WENIGER RUNDREISEN (Großjob vom 13.10.2026 „Warenkorb hängt", Segment s02;
 * Christian: „hängt voll im warenkorb … dauerhaft abstellen"). Gemessen am
 * 13./14.10. von diesem Server, Median je Markt DE/CH/US/AT: eine
 * Warenkorb-Mutation 0,46 bis 0,60 s, eine Abfrage 0,10 bis 0,15 s. Hinter
 * der Kundenaktion standen hier bis zu zwei Mutationen und vier Abfragen
 * nacheinander. Drei Wege, keiner ändert die Preisregel:
 *   1. ZEILEN AUS DER ANTWORT: trägt die Antwort der Mutation die Zeilen
 *      (Mutations-Fragment des Ladens mit denselben Feldern wie ZEILEN_QUERY),
 *      entfällt das Nachlesen. Gemessen gleich in 15 von 15 Fällen, samt
 *      Rabatt-Zuteilungen. Fehlt ein Feld, wird wie bisher nachgelesen.
 *   2. ALLE VARIANTEN IN EINER ABFRAGE (kakaoVariantenVorladen): die 35
 *      Handles der Tabelle zusammen 0,14 bis 0,15 s, ein einzelner 0,10 bis
 *      0,14 s. Einmal je Anfrage, parallel zur Kundenaktion. Der Cache bleibt
 *      CacheShort: ein längerer hieße ältere Preise im Preisschutz.
 *   3. DIREKT AUFS SET nur dort, wo der Preisschutz den gemessenen Einzelweg
 *      nicht braucht: beim Festbetrag-Anker ab 4 Packungen (Land und Währung
 *      der Tabelle, brutto, jede Set-Zeile auf den Cent). Dann schreibt der
 *      Stepper das Set in DIESELBE Mutation (kakaoStepperDirekt), und die
 *      Normalform legt die Soll-Zeilen an Ort ohne den Umweg über die
 *      Einzelpackungen (legeKakaoSetZeile mit `direkt`). Unter 4 Packungen
 *      und in Ländern ohne Festbetrag bleibt der Umweg: dort ist der
 *      Einzelweg im Warenkorb des Kunden der Anker, und den gibt es erst,
 *      wenn die Einzelzeile liegt.
 * 2. und 3. nur auf Wunsch des Aufrufers: der Kakao-Laden ruft sie,
 * qiblanco.com fragt wie bisher. Kill-Schalter für 3.: env KAKAO_SET_DIREKT=off.
 */
const ZEILEN_AKTIONEN = new Set([
  CartForm.ACTIONS.LinesAdd,
  CartForm.ACTIONS.LinesUpdate,
  CartForm.ACTIONS.LinesRemove,
]);

// Bewusst ohne #graphql-Kennung: diese Abfragen gehören nicht in die
// Codegen-Typen (storefrontapi.generated.d.ts bleibt unberührt).
const VARIANTE_QUERY = `
  query KakaoSetVariante(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      selectedOrFirstAvailableVariant {
        id
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`;

/** Die Handles der Tabelle in fester Reihenfolge (Alias k0, k1, …). */
const KAKAO_HANDLES = Object.keys(KAKAO_ZEILEN);

// Dieselben Felder wie VARIANTE_QUERY, für alle Handles in einer Abfrage.
const VARIANTEN_QUERY = `
  query KakaoSetVarianten(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
${KAKAO_HANDLES.map(
  (handle, i) => `    k${i}: product(handle: ${JSON.stringify(handle)}) {
      selectedOrFirstAvailableVariant {
        id
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }`,
).join('\n')}
  }
`;

const ZEILEN_QUERY = `
  query KakaoSetZeilen($cartId: ID!) {
    cart(id: $cartId) {
      lines(first: 100) {
        nodes {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              product {
                handle
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          discountAllocations {
            discountedAmount {
              amount
            }
            ... on CartCodeDiscountAllocation {
              code
            }
          }
        }
      }
    }
  }
`;

function warnen(text) {
  if (typeof console !== 'undefined') console.warn(`[kakao-set-zeile] ${text}`);
}

/** Zählt Rundreisen mit, wenn der Aufrufer ein Messobjekt mitgibt. */
function zaehle(messung, art) {
  if (messung && typeof messung === 'object') messung[art] = (messung[art] || 0) + 1;
}

/** Hat eine Mutation gegriffen? (errors: GraphQL, userErrors: Shopify) */
function gescheitert(r) {
  return !r?.cart || Boolean(r?.errors?.length) || Boolean(r?.userErrors?.length);
}

// createHydrogenContext legt je Anfrage EINEN Storefront-Client an; an ihm
// hängt die eine Varianten-Abfrage dieser Anfrage.
const variantenJeAnfrage = new WeakMap();

/**
 * Weg 2: die Varianten aller Kakao-Handles in EINER Abfrage, einmal je
 * Anfrage. Der Aufrufer startet das parallel zur Kundenaktion, variante()
 * wartet dann nur noch auf dieses Ergebnis. Scheitert die Abfrage oder fehlt
 * darin ein Handle, fragt variante() wie bisher einzeln (FAIL-SOFT). Ohne
 * Vorladen ändert sich nichts.
 *
 * @param {any} storefront
 * @returns {Promise<Map<string, any> | null>}
 */
export function kakaoVariantenVorladen(storefront) {
  if (!storefront || typeof storefront !== 'object' || typeof storefront.query !== 'function') {
    return Promise.resolve(null);
  }
  let tabelle = variantenJeAnfrage.get(storefront);
  if (!tabelle) {
    tabelle = Promise.resolve()
      .then(() => storefront.query(VARIANTEN_QUERY, {cache: storefront.CacheShort()}))
      .then((daten) => {
        const karte = new Map();
        KAKAO_HANDLES.forEach((handle, i) => {
          if (!daten || !Object.prototype.hasOwnProperty.call(daten, `k${i}`)) return;
          const v = daten[`k${i}`]?.selectedOrFirstAvailableVariant;
          karte.set(handle, v?.id ? v : null);
        });
        return karte;
      })
      .catch(() => null);
    variantenJeAnfrage.set(storefront, tabelle);
  }
  return tabelle;
}

async function variante(storefront, handle, messung) {
  const vorgeladen = storefront ? variantenJeAnfrage.get(storefront) : undefined;
  if (vorgeladen) {
    const tabelle = await vorgeladen;
    if (tabelle?.has(handle)) return tabelle.get(handle);
  }
  try {
    zaehle(messung, 'abfragen');
    const {product} = await storefront.query(VARIANTE_QUERY, {
      variables: {handle},
      cache: storefront.CacheShort(),
    });
    const v = product?.selectedOrFirstAvailableVariant;
    return v?.id ? v : null;
  } catch {
    return null;
  }
}

/** Eine Warenkorb-Zeile in der Form, mit der hier gerechnet wird. */
function zeileAusKnoten(z) {
  const netto = Number.parseFloat(z.cost?.totalAmount?.amount);
  const code = (z.discountAllocations || [])
    .filter((a) => a.code)
    .reduce((s, a) => s + Number.parseFloat(a.discountedAmount?.amount || 0), 0);
  return {
    id: z.id,
    quantity: z.quantity,
    handle: z.merchandise?.product?.handle,
    // Betrag der Zeile VOR einem Code (nach der Automatik): damit wird das
    // Set verglichen, denn auf dem Set greift der Code ja noch dazu.
    vorCode: Number.isFinite(netto) ? netto + code : NaN,
    waehrung: z.cost?.totalAmount?.currencyCode,
  };
}

async function zeilenLesen(storefront, cartId, messung) {
  zaehle(messung, 'abfragen');
  const {cart} = await storefront.query(ZEILEN_QUERY, {
    variables: {cartId},
    cache: storefront.CacheNone(),
  });
  return (cart?.lines?.nodes || []).map(zeileAusKnoten);
}

/*
 * Weg 1: die Zeilen aus der Antwort der Mutation, wenn sie alles trägt, was
 * ZEILEN_QUERY liest (auch die ersten 100 Zeilen wie dort). Sonst null, und
 * es wird nachgelesen.
 */
function zeilenAusAntwort(result) {
  const knoten = result?.cart?.lines?.nodes;
  if (!Array.isArray(knoten)) return null;
  const vollstaendig = knoten.every(
    (z) =>
      z?.id &&
      Number.isFinite(z?.quantity) &&
      z?.merchandise?.product &&
      z?.cost?.totalAmount &&
      Array.isArray(z?.discountAllocations),
  );
  return vollstaendig ? knoten.map(zeileAusKnoten) : null;
}

async function zeilenNach(storefront, result, messung) {
  return zeilenAusAntwort(result) ?? (await zeilenLesen(storefront, result.cart.id, messung));
}

/**
 * Preis (Cent) des billigsten Sorten-Sets derselben Packungszahl im Markt
 * des Warenkorbs; NaN, wenn keins lesbar ist (dann bleibt es beim alten Weg).
 */
async function sortenSetUntergrenzeCent(storefront, packungen, waehrung, messung) {
  const handles = Object.values(sortenSetsGleicherMenge(packungen)).filter(Boolean);
  const cents = [];
  for (const h of handles) {
    const v = await variante(storefront, h, messung);
    const cent = Math.round(Number.parseFloat(v?.price?.amount) * 100);
    if (v && v.price?.currencyCode === waehrung && Number.isFinite(cent)) {
      cents.push(cent);
    }
  }
  return cents.length ? Math.min(...cents) : NaN;
}

function aus(env) {
  return String(env?.KAKAO_SET_ZEILE ?? '').toLowerCase() === 'off';
}

function direktAus(env) {
  return String(env?.KAKAO_SET_DIREKT ?? '').toLowerCase() === 'off';
}

/*
 * Weg 3, die Bedingung: entscheidet der Preisschutz ohne den gemessenen
 * Einzelweg? Genau beim Festbetrag-Anker (kakaoPreisschutz, zweiter Zweig):
 * ab SET_GROESSE_MIN Packungen, jede Set-Variante verfügbar und in der Währung
 * des Warenkorbs, und jede kostet in Land und Währung der Tabelle, brutto, auf
 * den Cent ihren Festbetrag. Dann sagt kakaoPreisschutz für JEDEN lesbaren
 * Einzelweg „anker_festbetrag" (test/kakao-set-zeile-server.test.mjs pinnt
 * das), also liegt am Ende dasselbe Set wie auf dem Umweg.
 */
function festbetragEntscheidet({storefront, packungen, waehrung, sets}) {
  if (!(packungen >= SET_GROESSE_MIN) || !waehrung || !sets.length) return false;
  const lesbar = sets.every(
    (s) => s.variante?.availableForSale && s.variante.price?.currencyCode === waehrung,
  );
  return (
    lesbar &&
    kakaoFestbetragGetroffen({
      land: storefront.i18n?.country,
      waehrung,
      brutto: istBrutto(),
      sets: sets.map((s) => ({
        packungen: (s.je?.awake || 0) + (s.je?.create || 0),
        je: s.je,
        cent: Math.round(Number.parseFloat(s.variante.price?.amount) * 100),
      })),
    })
  );
}

/*
 * Weg 3 in der Normalform: die Kakao-Zeilen in EINER Mutation an Ort zu den
 * Soll-Set-Zeilen, statt erst die Einzelpackungen (Mutation), dann nachlesen,
 * dann das Set (zweite Mutation). Nur beim Festbetrag-Anker und nur, wenn
 * keine Zeile neu angelegt werden muss.
 * null: nicht anwendbar, nichts geändert. Sonst {r, zeilen}: die Antwort (null,
 * wenn die Mutation scheiterte) und die Zeilen danach; der klassische Weg
 * macht daran weiter, falls die Normalform noch nicht steht.
 */
async function normalformDirekt({cart, storefront, cartId, zeilen, kandidat, messung}) {
  const kakao = zeilen.filter((z) => KAKAO_ZEILEN[z.handle]);
  if (!kakao.length || kandidat.sets.length > kakao.length) return null;
  const waehrung = kakao[0].waehrung;
  if (!kakao.every((z) => z.waehrung === waehrung && Number.isFinite(z.vorCode))) {
    return null;
  }
  const sets = [];
  for (const s of kandidat.sets) {
    sets.push({...s, variante: await variante(storefront, s.handle, messung)});
  }
  if (!festbetragEntscheidet({storefront, packungen: kandidat.packungen, waehrung, sets})) {
    return null;
  }

  // Zuordnung Set -> Zeile: zuerst die Zeile, die schon dieses Set ist, dann
  // jede übrige. Was keinem Set zufällt, geht auf Menge 0.
  const frei = [...kakao];
  const nimm = (pruefe) => {
    const i = frei.findIndex(pruefe);
    return i < 0 ? null : frei.splice(i, 1)[0];
  };
  const zuordnung = sets.map((s) => ({s, zeile: nimm((z) => z.handle === s.handle)}));
  for (const eintrag of zuordnung) {
    if (!eintrag.zeile) eintrag.zeile = nimm(() => true);
  }
  const aenderungen = [
    ...zuordnung
      .filter(({s, zeile}) => zeile.handle !== s.handle || zeile.quantity !== s.quantity)
      .map(({s, zeile}) => ({id: zeile.id, merchandiseId: s.variante.id, quantity: s.quantity})),
    ...frei.map((z) => ({id: z.id, quantity: 0})),
  ];
  if (!aenderungen.length) return null;
  zaehle(messung, 'mutationen');
  const r = await cart.updateLines(aenderungen, {cartId});
  if (gescheitert(r)) {
    warnen(
      `Set direkt gescheitert: ${JSON.stringify(r?.errors || r?.userErrors || [])} - ` +
        'Weg über die Einzelpackungen',
    );
    return {r: null, zeilen: await zeilenLesen(storefront, cartId, messung)};
  }
  return {r, zeilen: await zeilenNach(storefront, r, messung)};
}

/**
 * @param {{cart: any, storefront: any, env?: Record<string, string>,
 *   action: string, result: any, direkt?: boolean, messung?: object}} args
 *   direkt: Weg 3 (Festbetrag-Anker in einer Mutation), nur auf Wunsch.
 *   messung: zählt Mutationen und Abfragen dieses Schritts mit.
 */
export async function legeKakaoSetZeile({
  cart,
  storefront,
  env,
  action,
  result,
  direkt = false,
  messung,
}) {
  const cartId = result?.cart?.id;
  if (!cartId || !storefront || aus(env)) return result;
  if (!ZEILEN_AKTIONEN.has(action)) return result;

  let neu = result;
  try {
    let zeilen = await zeilenNach(storefront, result, messung);
    let plan = kakaoZeilenPlan(zeilen);
    if (!plan) return result;

    // Weg 3: steht der Festbetrag-Anker fest, die Soll-Zeilen gleich an Ort.
    const umweg = plan.einzelform.length || plan.entfernen.length || plan.hinzu.length;
    if (direkt === true && !direktAus(env) && plan.kandidat && umweg) {
      const d = await normalformDirekt({
        cart,
        storefront,
        cartId,
        zeilen,
        kandidat: plan.kandidat,
        messung,
      });
      if (d) {
        if (d.r) neu = d.r;
        zeilen = d.zeilen;
        plan = kakaoZeilenPlan(zeilen);
        if (!plan) return neu;
      }
    }

    // Schritt 1: je Sorte EINE Einzelpackungs-Zeile mit der Gesamtmenge, in
    // EINER Mutation (Menge 0 entfernt die übrigen Zeilen derselben Sorte).
    if (plan.einzelform.length || plan.entfernen.length || plan.hinzu.length) {
      const aendern = [];
      for (const z of plan.einzelform) {
        const v = await variante(storefront, z.handle, messung);
        if (!v) {
          warnen(`${z.handle} nicht auflösbar - Warenkorb bleibt wie er ist`);
          return neu;
        }
        aendern.push({id: z.id, merchandiseId: v.id, quantity: z.quantity});
      }
      for (const id of plan.entfernen) aendern.push({id, quantity: 0});
      const anlegen = [];
      for (const z of plan.hinzu) {
        const v = await variante(storefront, z.handle, messung);
        if (!v) {
          warnen(`${z.handle} nicht auflösbar - Warenkorb bleibt wie er ist`);
          return neu;
        }
        anlegen.push({merchandiseId: v.id, quantity: z.quantity});
      }
      if (aendern.length) {
        zaehle(messung, 'mutationen');
        const r = await cart.updateLines(aendern, {cartId});
        if (!r?.cart || r?.errors?.length) {
          warnen(`Einzelform gescheitert: ${JSON.stringify(r?.errors || [])}`);
          return neu;
        }
        neu = r;
      }
      if (anlegen.length) {
        zaehle(messung, 'mutationen');
        const r = await cart.addLines(anlegen, {cartId});
        if (!r?.cart || r?.errors?.length) {
          warnen(`Einzelform (neue Zeile) gescheitert: ${JSON.stringify(r?.errors || [])}`);
          return neu;
        }
        neu = r;
      }
      if (!plan.kandidat) return neu;
      zeilen = await zeilenNach(storefront, neu, messung);
    }

    // Schritt 2: die Einzelzeile(n) auf die Set-Zeile(n) umlegen, wenn das
    // nicht teurer und nicht billiger ist.
    const {kandidat} = plan;
    const einzelZeilen = kandidat.einzel.map((e) =>
      zeilen.find((z) => z.handle === e.handle && z.quantity === e.packungen),
    );
    if (einzelZeilen.some((z) => !z)) {
      warnen(`Einzelzeile fehlt nach Schritt 1 - Einzelpackung bleibt`);
      return neu;
    }
    const waehrung = einzelZeilen[0].waehrung;
    const sets = [];
    for (const s of kandidat.sets) {
      const v = await variante(storefront, s.handle, messung);
      if (!v?.availableForSale) {
        warnen(`${s.handle} nicht verfügbar - Einzelpackung bleibt`);
        return neu;
      }
      sets.push({...s, variante: v});
    }
    const setCent = sets.reduce(
      (summe, s) =>
        summe + Math.round(Number.parseFloat(s.variante.price?.amount) * 100) * s.quantity,
      0,
    );
    const zeileCent = Math.round(
      einzelZeilen.reduce((summe, z) => summe + z.vorCode, 0) * 100,
    );
    const benannt = sets.map((s) => `${s.handle} x${s.quantity}`).join(' + ');
    const festbetrag = kakaoFestbetragGetroffen({
      land: storefront.i18n?.country,
      waehrung,
      brutto: istBrutto(),
      sets: sets.map((s) => ({
        packungen: (s.je?.awake || 0) + (s.je?.create || 0),
        je: s.je,
        cent: Math.round(Number.parseFloat(s.variante.price?.amount) * 100),
      })),
    });
    const waehrungGleich =
      sets.every((s) => s.variante.price?.currencyCode === waehrung) &&
      einzelZeilen.every((z) => z.waehrung === waehrung);
    const schutz = waehrungGleich
      ? kakaoPreisschutz({
          packungen: kandidat.packungen,
          gemischt: kandidat.gemischt,
          setCent,
          zeileCent,
          einzelZeilen: einzelZeilen.length,
          umgerechnet: UMRECHNUNGS_LAENDER.includes(
            String(storefront.i18n?.country || '').toUpperCase(),
          ),
          setStueck: sets.reduce((summe, s) => summe + s.quantity, 0),
          festbetrag,
          sortenSetCent:
            kandidat.gemischt && kandidat.packungen < SET_GROESSE_MIN
              ? await sortenSetUntergrenzeCent(storefront, kandidat.packungen, waehrung, messung)
              : undefined,
        })
      : {ok: false, grund: 'waehrung'};
    if (!schutz.ok) {
      warnen(
        `${benannt} ${setCent / 100} gegen Einzelzeile ${zeileCent / 100} ${waehrung} - ` +
          `Einzelpackung bleibt (${schutz.grund})`,
      );
      return neu;
    }

    // Einzelzeile i wird an Ort Set-Zeile i; übrige Einzelzeilen fallen weg,
    // übrige Set-Zeilen werden vorher angelegt.
    const anOrt = sets.slice(0, einzelZeilen.length);
    const extra = sets.slice(einzelZeilen.length);
    if (extra.length) {
      zaehle(messung, 'mutationen');
      const r = await cart.addLines(
        extra.map((s) => ({merchandiseId: s.variante.id, quantity: s.quantity})),
        {cartId},
      );
      if (!r?.cart || r?.errors?.length) {
        warnen(`Set-Zeile anlegen gescheitert: ${JSON.stringify(r?.errors || [])}`);
        return neu;
      }
    }
    zaehle(messung, 'mutationen');
    const r = await cart.updateLines(
      [
        ...anOrt.map((s, i) => ({
          id: einzelZeilen[i].id,
          merchandiseId: s.variante.id,
          quantity: s.quantity,
        })),
        ...einzelZeilen.slice(anOrt.length).map((z) => ({id: z.id, quantity: 0})),
      ],
      {cartId},
    );
    if (!r?.cart || r?.errors?.length) {
      warnen(`Set-Tausch gescheitert: ${JSON.stringify(r?.errors || [])}`);
      if (extra.length) {
        // Die vorher angelegten Set-Zeilen wieder heraus: sonst lägen deren
        // Packungen zusätzlich zu den Einzelzeilen im Warenkorb.
        const nachher = await zeilenLesen(storefront, cartId, messung);
        const extraHandles = new Set(extra.map((s) => s.handle));
        const weg = nachher.filter((z) => extraHandles.has(z.handle));
        if (weg.length) {
          zaehle(messung, 'mutationen');
          const z = await cart.updateLines(
            weg.map((x) => ({id: x.id, quantity: 0})),
            {cartId},
          );
          if (z?.cart && !z?.errors?.length) return z;
        }
        warnen('Rückbau der angelegten Set-Zeilen gescheitert');
      }
      return neu;
    }
    return r;
  } catch (e) {
    warnen(`Lesefehler, Warenkorb unverändert: ${e?.message || e}`);
    return neu;
  }
}

/**
 * Der Stepper einer Set-Zeile rechnet in PACKUNGEN, nicht in Sets: "+" auf
 * dem 3er-Set bedeutet 4 Packungen, nicht zwei 3er-Sets. CartLineItem schickt
 * deshalb `kakaoPackungen` {lineId, handle, packungen} und zeigt die Packungen
 * der ganzen Zeile (Set-Größe x Zeilenmenge, ab 8 Packungen z.B. Set 3+2 x4
 * = 20). Hier wird daraus die Zusammensetzung der Zeile mit der neuen
 * Packungszahl, und legeKakaoSetZeile() stellt danach die Normalform her.
 *
 * DER WEG GEHT IMMER ÜBER DIE EINZELPACKUNGEN (seit 2026-09-30, s03): die
 * Zeile trägt die Sorte mit mehr Packungen (bei Gleichstand Awake), die
 * andere Sorte wird vorher als eigene Zeile angelegt — dafür braucht es den
 * `cart`-Handler. Erst die Normalform legt daraus wieder Sets, und nur dort
 * sitzt der Preisschutz. Ein direkter Sprung auf ein Set würde ihn umgehen
 * (in CHF ist das 4er-Set teurer als der Einzelweg). Fehlt der Handler oder
 * scheitert das Anlegen, bleibt die Zeile, wie sie ist (keine Packung geht
 * still verloren). Die eine Ausnahme ist kakaoStepperDirekt (unten): beim
 * Festbetrag-Anker umgeht der Sprung nichts.
 *
 * @param {{storefront: any, inputs: any, cart?: any, messung?: object}} args
 */
export async function kakaoPackungenEingabe({storefront, inputs, cart, messung}) {
  const zeilen = Array.isArray(inputs?.lines) ? inputs.lines : [];
  const wunsch = inputs?.kakaoPackungen;
  if (!wunsch || typeof wunsch !== 'object' || !storefront) return zeilen;
  // Zeilenmenge: das Formular schickt die Zeile mit ihrer aktuellen Menge mit.
  const eigene = zeilen.find((z) => z.id === wunsch.lineId);
  const ziel = wunsch.lineId
    ? stepperEinzelZeilen(
        wunsch.handle,
        eigene?.quantity,
        Number.parseInt(wunsch.packungen, 10),
      )
    : null;
  if (!ziel) return zeilen;
  const {handle, quantity: menge} = ziel.zeile;
  const {dazu} = ziel;
  const v = await variante(storefront, handle, messung);
  if (!v) {
    warnen(`${handle} nicht auflösbar - Stepper ohne Wirkung`);
    return zeilen;
  }
  if (dazu) {
    const w = await variante(storefront, dazu.handle, messung);
    if (w && cart) zaehle(messung, 'mutationen');
    const r = w && cart
      ? await cart.addLines([{merchandiseId: w.id, quantity: dazu.quantity}])
      : null;
    if (!r?.cart || r?.errors?.length) {
      warnen(`${dazu.handle} nicht anlegbar - Stepper ohne Wirkung`);
      return zeilen;
    }
  }
  return [
    ...zeilen.filter((z) => z.id !== wunsch.lineId),
    {id: wunsch.lineId, merchandiseId: v.id, quantity: menge},
  ];
}

/**
 * Weg 3 am Stepper einer Set-Zeile: steht das Ziel vor der Mutation fest und
 * entscheidet der Festbetrag-Anker, schreibt der Stepper das Set in DIESELBE
 * Mutation. Der Umweg über die Einzelpackungen kostete dort zwei Mutationen
 * und bis zu drei Abfragen und endete beim selben Set.
 *
 * Das Ziel ist die Normalform der neuen Zusammensetzung (kakaoSollZeilen),
 * angewandt nur, wenn sie EINE Zeile ist (bis 7 Packungen, ab 8 nur gleiche
 * Sets). Danach wird an der Antwort geprüft: dieselbe Zeile trägt das Set in
 * der Menge, und der Warenkorb rechnet in der Währung der Set-Variante.
 * Weitere Kakao-Zeilen daneben ordnet legeKakaoSetZeile danach wie bisher.
 *
 * null heißt: nicht anwendbar oder nicht so gelandet, der Aufrufer nimmt den
 * klassischen Weg (kakaoPackungenEingabe). Lief die Mutation schon, legt der
 * klassische Weg dieselbe Zeile wieder auf die Einzelpackungen, und die
 * Normalform entscheidet wie bisher.
 *
 * @param {{storefront: any, inputs: any, cart: any,
 *   env?: Record<string, string>, messung?: object}} args
 */
export async function kakaoStepperDirekt({storefront, inputs, cart, env, messung}) {
  if (!cart || !storefront || aus(env) || direktAus(env)) return null;
  const wunsch = inputs?.kakaoPackungen;
  if (!wunsch || typeof wunsch !== 'object' || !wunsch.lineId) return null;
  // So schickt es der Stepper: genau seine Zeile, mit ihrer aktuellen Menge.
  const zeilen = Array.isArray(inputs?.lines) ? inputs.lines : [];
  if (zeilen.length !== 1 || zeilen[0]?.id !== wunsch.lineId) return null;
  const art = kakaoSetArt(wunsch.handle);
  const packungen = Number.parseInt(wunsch.packungen, 10);
  if (!art || !(packungen >= SET_GROESSE_MIN && packungen <= KAKAO_NORMALFORM_MAX)) {
    return null;
  }
  // Dieselbe Rechnung wie stepperEinzelZeilen, nur ohne den Umweg.
  const menge = Math.max(1, Number.parseInt(zeilen[0].quantity, 10) || 1);
  const je = stepperZusammensetzung(
    {awake: art.je.awake * menge, create: art.je.create * menge},
    packungen,
  );
  const soll = kakaoSollZeilen(je);
  if (!soll || soll.length !== 1) return null;
  const set = {...soll[0], variante: await variante(storefront, soll[0].handle, messung)};
  const waehrung = set.variante?.price?.currencyCode;
  const anker = festbetragEntscheidet({
    storefront,
    packungen: je.awake + je.create,
    waehrung,
    sets: [set],
  });
  if (!anker) return null;

  zaehle(messung, 'mutationen');
  const r = await cart.updateLines([
    {id: wunsch.lineId, merchandiseId: set.variante.id, quantity: set.quantity},
  ]);
  if (gescheitert(r)) {
    warnen(
      `Stepper direkt gescheitert: ${JSON.stringify(r?.errors || r?.userErrors || [])} - ` +
        'Weg über die Einzelpackungen',
    );
    return null;
  }
  let nachher = null;
  try {
    nachher = await zeilenNach(storefront, r, messung);
  } catch {
    nachher = null;
  }
  const kakao = (nachher || []).filter((z) => KAKAO_ZEILEN[z.handle]);
  const zeile = kakao.find((z) => z.id === wunsch.lineId);
  const gelandet =
    zeile &&
    zeile.handle === set.handle &&
    zeile.quantity === set.quantity &&
    kakao.every((z) => z.waehrung === waehrung);
  if (!gelandet) {
    warnen(
      `Stepper direkt: ${set.handle} x${set.quantity} nicht so im Warenkorb ` +
        `(${waehrung}) - Weg über die Einzelpackungen`,
    );
    return null;
  }
  return r;
}
