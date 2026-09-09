import {cacaoPricing} from './CacaoProductForm';

/**
 * DER PREISBLOCK EINER SORTENKACHEL — EINE Implementierung, ZWEI Leser.
 *
 * WARUM DIESE DATEI AM 2026-09-09 ENTSTAND (Christian, an crystal-cacao.com):
 * „und es sind noch die falschen Preise." Die Startseite zeigte 53,- €, die
 * Sortenuebersicht 71,03 €. Beide Zahlen waren richtig und beantworteten
 * verschiedene Fragen: 71,03 ist der NETTO-Betrag der Variante aus der
 * Storefront-API, 53 der Brutto-Packungspreis im Dreierbund. Es ist
 * ausdruecklich KEINE Fremdwaehrungs-Umrechnung — der Verdacht lag nahe, ist
 * aber gemessen widerlegt: die Storefront-API liefert `currencyCode: EUR`, und
 * der Betrag ist ueber alle Laender-Kontexte hinweg derselbe.
 *
 * Der Fix vom 2026-09-08 hat den Preisblock als `preisSlot` in die Kachel
 * gehaengt (siehe Kopf von ProductItem.jsx) — aber er wohnte in
 * `app/routes/_index.jsx` und war damit fuer die Sortenuebersicht baulich
 * unerreichbar. Genau das ist die Klasse, vor der die Auftragszeile warnt:
 * „Wenn eine zweite Stelle denselben Preis noch einmal selbst formatiert,
 * laufen sie beim naechsten Mal wieder auseinander." Deshalb steht der Block
 * hier und nicht in einer Route: gerechnet wird weiterhin ausschliesslich in
 * `cacaoPricing()` (K1, CacaoProductForm.jsx), diese Datei kennt keine
 * Preiszahl.
 */
/**
 * DIE MENGE, DIE DIE KACHEL ZEIGT — 2026-09-08.
 *
 * Christian: „Auf der Startseite steht bei beiden Sorten €71.03, auf der
 * Produktseite 53,- € (gestrichen 76,- €). Ein Besucher sieht auf der
 * Startseite den hoechsten Preis ohne Rabatt und klickt weg, bevor er das
 * Angebot je sieht."
 *
 * BEIDE ZAHLEN WAREN RICHTIG, sie beantworteten nur verschiedene Fragen. 71,03
 * ist der NETTO-Betrag der Variante aus der Storefront-API; die Kaufseite
 * rechnet daraus ueber `cacaoPricing()` Brutto (7 % Kakao-Satz) und die
 * Mengenstaffel: 71,03 -> 76,- € einzeln, 53,- € pro Packung im Dreierbund.
 * Die Kaufseite steht dabei auf `useState('3')`
 * (app/routes/products.crystal-cacao-awake.jsx), zeigt also den Dreierbund —
 * und genau den zeigt die Kachel jetzt auch.
 *
 * WARUM DIE ZAHL HIER TROTZDEM NICHT ERFUNDEN IST: gerechnet wird
 * ausschliesslich mit `cacaoPricing()` aus dem K1-Bauteil CacaoProductForm;
 * diese Datei kennt keine Preiszahl. Und weil die Kaufseite ihre Menge in
 * einer eigenen Datei fuehrt, ist die GLEICHHEIT der beiden Anzeigen eine
 * MESSGROESSE und keine Zusage: `crystal-cacao-node/proben/probe_sofortfehler.py`
 * vergleicht Achse (1) den Kachelpreis mit dem Hauptpreis der Kaufseite und
 * geht rot, sobald sie auseinanderlaufen.
 */
const KACHEL_MENGE = '3';

/**
 * Der Preisblock der Sortenkachel: derselbe Betrag, dieselbe Schreibweise und
 * dieselbe Rabattlogik wie auf der Kaufseite — plus die eine Zeile, die auf der
 * Kaufseite das Dropdown darunter liefert („3x 420g … pro Packung"). Ohne sie
 * waere „53,- €" auf einer Kachel ohne Mengenwahl eine halbe Wahrheit.
 */
export function KachelPreis({produkt}) {
  const preis = cacaoPricing(
    KACHEL_MENGE,
    {price: produkt?.priceRange?.minVariantPrice},
    produkt?.handle,
  );
  return (
    <div className="cc-kachel-preis">
      <span className="cc-kachel-preis-jetzt">{preis.price}</span>
      {preis.compareAt ? (
        <s className="cc-kachel-preis-vorher">{preis.compareAt}</s>
      ) : null}
      <span className="cc-kachel-preis-hinweis">
        pro Packung im {KACHEL_MENGE}er-Set
      </span>
    </div>
  );
}
