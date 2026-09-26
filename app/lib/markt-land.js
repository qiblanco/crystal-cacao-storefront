import {useRouteLoaderData} from 'react-router';
import {STEUER_LAND_DEFAULT} from './cart-display-pricing.js';

/**
 * DAS MARKT-LAND EINER ANZEIGE — der Weg, auf dem der aufgeloeste Markt bis
 * zu der Stelle kommt, die eine Zahl auf den Bildschirm schreibt.
 *
 * WARUM ES DIESE DATEI GIBT (Job 20260913-at-paketkarte-rechnet-19-prozent-
 * kasse-nimmt-20-prio8). Der Markt wird genau einmal aufgeloest
 * (`resolveCountry` in markt-pricing.js, aufgerufen von lib/context.js) und
 * war danach nur im Hydrogen-Kontext sichtbar — also im Loader, nicht in der
 * Anzeige. Jede Preisanzeige hat deshalb aus der WAEHRUNG auf den Markt
 * geschlossen, und dieser Schluss ist falsch, sobald zwei Laender eine
 * Waehrung teilen: AT und DE sind beide EUR und haben verschiedene
 * Steuersaetze.
 *
 * WARUM EIGENE DATEI UND NICHT markt-pricing.js: markt-pricing.js ist bewusst
 * frei von Framework-Importen, damit jede reine Datenfabrik, die den
 * Preis-Kanon benutzt, mit `node --test` pruefbar bleibt (Begründung im Kopf
 * jener Datei und in produkt-seo.js). Ein `react-router`-Import dort haette
 * genau diese Eigenschaft zerstört. Hier ist er richtig, weil diese Datei
 * NUR von Komponenten benutzt wird.
 *
 * WARUM ÜBER DIE ROOT-LOADERDATEN: `useRouteLoaderData('root')` ist im Haus
 * der bestehende Weg für sitewide Loader-Werte (EuGewaehrleistungsLabel,
 * lib/googleRating.js) — kein neuer Mechanismus, sondern derselbe.
 */

/** Markt-Land, wenn keines durchkommt. Fail-closed auf den Status quo. */
export {STEUER_LAND_DEFAULT as MARKT_LAND_DEFAULT};

/**
 * Markt-Land aus den root-Loaderdaten.
 *
 * FAIL-CLOSED, ABSICHTLICH STILL: fehlt der Wert (Route ausserhalb von root,
 * Loader-Fehler, alter Client-Bundle), gilt DE — also der Zustand vor dieser
 * Aenderung. Eine leere Preisanzeige wäre die schlechtere Antwort; ein
 * Ausrufezeichen an dieser Stelle würde bei JEDEM Fehler die Kaufseite
 * roeten. Dass der Wert wirklich ankommt, ist deshalb NICHT hier geprueft,
 * sondern am Kundenrand: `abnahme_karte_gegen_korb.py --markt AT` und die
 * Wache `preiswatch` (live_maerkte) messen die Zahl, die der Kunde sieht.
 *
 * @returns {string} ISO-Land des aufgeloesten Marktes
 */
export function useMarktLand() {
  const root = useRouteLoaderData('root');
  return root?.marktLand || STEUER_LAND_DEFAULT;
}
