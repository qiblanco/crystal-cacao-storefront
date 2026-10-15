import {ladeStaffelKasse} from '~/lib/cacao-pricing';

/**
 * KACHEL-KASSE — derselbe Kassenbetrag für die Sortenkacheln, den die
 * Kaufseiten schon laden (Job 20261013-crystal-laden-feinschliff, Befund H01).
 *
 * GEMESSEN am 13.10.2026 (?markt=CH): die Kacheln auf Startseite und Übersicht
 * zeigten 78,- CHF (Awake) und 77,- CHF (Create) „pro Packung im 3er-Set“, die
 * Kaufseite nannte für das 3er-Set 161,- CHF, also 53,67 CHF je Packung. In DE
 * und AT stimmten beide (53,- €).
 *
 * URSACHE: `KachelPreis` rief `cacaoPricing()` ohne `staffelKasse` auf. Außerhalb
 * des EUR-Markts setzt `cacaoPricing()` (K1) den Rabatt dann auf 0 und nennt
 * den Listenpreis — auf der Kaufseite steht darunter „Mengenrabatt im
 * Warenkorb“, auf der Kachel stand „im 3er-Set“. Nur die Loader der beiden
 * Kaufseiten luden die Kassenbeträge (`ladeStaffelKasse`).
 *
 * KEINE NEUE PREISLOGIK: diese Datei ruft genau den Lader der Kaufseiten, mit
 * denselben Angaben (Variante, Währung, Land, Listenpreis). Die Ablage in
 * cacao-pricing.js gilt je Variante und Land 15 Minuten und wird mit den
 * Kaufseiten geteilt; im EUR-Markt gibt `ladeStaffelKasse` sofort null zurück,
 * dort entsteht also kein Warenkorb und keine Wartezeit.
 *
 * WARUM DER WERT AM PRODUKT HÄNGT (`kachelKasse`) und nicht als eigene Prop
 * gereicht wird: dieselbe Kachel steht an drei Stellen (Sorten-Slider und
 * Sortenraster der Startseite, Übersicht). Eine Prop müsste durch Startseite,
 * Slider und Folie gereicht werden, und jede vergessene Stelle zeigte wieder
 * den Listenpreis. Am Produkt reist der Betrag mit dem Datensatz, den alle
 * drei ohnehin bekommen.
 *
 * @param {object} storefront Hydrogen-Storefront-Client des Loaders
 * @param {Array<object|null|undefined>} produkte Produkte mit
 *   `selectedOrFirstAvailableVariant {id price {amount currencyCode}}`
 * @returns {Promise<void>} setzt `produkt.kachelKasse` (oder lässt es weg)
 */
export async function kachelKassenAnhaengen(storefront, produkte) {
  const liste = (Array.isArray(produkte) ? produkte : []).filter(
    (p) => p && typeof p === 'object',
  );
  const land = storefront?.i18n?.country;
  const werte = await Promise.all(
    liste.map((p) => {
      const v = p.selectedOrFirstAvailableVariant;
      return ladeStaffelKasse(storefront, {
        variantId: v?.id,
        waehrung: v?.price?.currencyCode,
        land,
        listenpreis: v?.price?.amount,
      }).catch(() => null);
    }),
  );
  liste.forEach((p, i) => {
    if (werte[i]) p.kachelKasse = werte[i];
  });
}
