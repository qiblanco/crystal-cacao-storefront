/**
 * PREISMODUS DES DACH-SHOPS — stehen die EUR-Variantenpreise in Shopify
 * NETTO oder BRUTTO?
 *
 * WOFÜR (Christian 2026-09-24, z3://auftrag/CW-20260924-094bcdd4: "die
 * Einstellung so richten, dass die Kasse dieselben Bruttopreise zeigt wie die
 * Produktseite"; Grossjob 20260924-kasse-zeigt-bruttopreise-wie-produktseite-
 * prio10). Bis zum Kipp speichert Shopify NETTO, und jede Anzeige rechnet
 * `preis x (1+satz)`. Christian stellt im Admin den Steuer-Einbezug um, der
 * Server schreibt in derselben Minute die Basispreise auf brutto (Segment
 * s04). Ab dann ist der EUR-Preis der Storefront-API schon der Endbetrag, und
 * derselbe Aufschlag wäre doppelte Steuer. Die Anzeige muss also OHNE Deploy
 * kippen können, genau in dieser Minute.
 *
 * DER TRÄGER: Shop-Metafeld `qb_preis.modus` (Definition mit
 * access.storefront=PUBLIC_READ, angelegt 2026-09-24 — ohne Definition gibt
 * die Storefront-API NULL zurück). Gelesen in lib/context.js VOR jedem
 * Request, also bevor irgendein Loader rechnet (Kind-Loader laufen parallel
 * zum root-Loader; dort wäre es zu spät). Der root-Loader reicht den Wert
 * an den Client weiter, damit die Hydration dieselbe Zahl rechnet.
 *
 * FAIL-DEFAULT, BEGRÜNDET: ein fester Rückfall ist in EINER der beiden
 * Welten falsch — `netto` nach dem Kipp (Anzeige +19 %), `brutto` davor
 * (Anzeige -19 %). Deshalb in dieser Reihenfolge:
 *   1. Metafeld lesbar und gültig        -> sein Wert       (quelle metafeld)
 *   2. unlesbar, Isolate hat schon gelesen -> letzter Wert    (quelle zuletzt)
 *   3. sonst                               -> PREISMODUS_VORGABE (quelle vorgabe)
 * Die Vorgabe ist der ZUSTAND DES SHOPS BEIM DEPLOY und wird nach dem Kipp
 * per Folge-Deploy auf 'brutto' gezogen (Zusage an s04). Welche Quelle gilt,
 * steht als data-qb-preismodus-quelle im HTML — ein Rückfall ist damit
 * messbar statt still.
 *
 * WAS „BRUTTO“ HEISST: der @inContext-Preis ist der Endbetrag, auch in AT
 * (Markt EU "Dynamisch": Shopify rechnet den Heimatsatz heraus und den
 * Landessatz drauf). Der Steuersatz wird dann NICHT mehr aufgeschlagen; er
 * bleibt nur noch für Festbeträge gebraucht, die im Code netto stehen
 * (heimatSatz).
 *
 * Relativ importierbar, kein '~'-Alias: `node --test` muss das laden können.
 */

export const PREISMODI = ['netto', 'brutto'];

/** Zustand des Shops beim Deploy. NACH DEM KIPP per Folge-Deploy auf 'brutto'. */
export const PREISMODUS_VORGABE = 'netto';

export const PREISMODUS_METAFELD = {namespace: 'qb_preis', key: 'modus'};

export const PREISMODUS_QUERY = `#graphql
  query Preismodus {
    shop {
      metafield(namespace: "qb_preis", key: "modus") {
        value
      }
    }
  }
`;

let aktuell = {modus: PREISMODUS_VORGABE, quelle: 'vorgabe'};
let zuletztGelesen = null;

/** @returns {'netto'|'brutto'} */
export function preismodus() {
  return aktuell.modus;
}

/** @returns {{modus: string, quelle: string}} */
export function preismodusStand() {
  return {...aktuell};
}

export function istBrutto() {
  return aktuell.modus === 'brutto';
}

/**
 * Setzt den Modus. Unbekannte Werte werden NICHT übernommen (Rückgabe
 * false) — ein Tippfehler im Metafeld darf keinen dritten Zustand erzeugen.
 * @param {string} modus
 * @param {string} [quelle]
 */
export function setzePreismodus(modus, quelle = 'gesetzt') {
  const m = String(modus ?? '').trim().toLowerCase();
  if (!PREISMODI.includes(m)) return false;
  aktuell = {modus: m, quelle};
  return true;
}

/** Nur für Tests: zurück auf den Deploy-Zustand. */
export function preismodusZuruecksetzen() {
  aktuell = {modus: PREISMODUS_VORGABE, quelle: 'vorgabe'};
  zuletztGelesen = null;
}

/**
 * Bewertet eine Metafeld-Antwort nach der Reihenfolge im Kopf und setzt den
 * Modus. Getrennt von der Abfrage, damit die Reihenfolge ohne Netz prüfbar ist.
 * @param {string|null|undefined} wert Metafeld-Wert (null = unlesbar/fehlt)
 */
export function uebernehmeMetafeld(wert) {
  const m = String(wert ?? '').trim().toLowerCase();
  if (PREISMODI.includes(m)) {
    zuletztGelesen = m;
    aktuell = {modus: m, quelle: 'metafeld'};
  } else if (zuletztGelesen) {
    aktuell = {modus: zuletztGelesen, quelle: 'zuletzt'};
  } else {
    aktuell = {modus: PREISMODUS_VORGABE, quelle: 'vorgabe'};
  }
  return preismodusStand();
}

/**
 * Liest das Metafeld über die Storefront-API (kurzer Cache: der Kipp soll
 * binnen rund einer Minute ankommen) und setzt den Modus. Wirft nie — ein
 * Lesefehler fällt auf die Reihenfolge im Kopf zurück.
 * @param {any} storefront Hydrogen-Storefront-Client
 */
export async function ladePreismodus(storefront) {
  let wert = null;
  try {
    const cache =
      typeof storefront?.CacheCustom === 'function'
        ? storefront.CacheCustom({
            mode: 'public',
            maxAge: 30,
            staleWhileRevalidate: 30,
          })
        : undefined;
    const data = await storefront.query(PREISMODUS_QUERY, {cache});
    wert = data?.shop?.metafield?.value ?? null;
  } catch {
    wert = null;
  }
  return uebernehmeMetafeld(wert);
}
