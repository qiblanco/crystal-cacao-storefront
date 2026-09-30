import {SortenSeite} from './SortenSeite';

/**
 * AWAKE — die Huelle. Der Rumpf der Kaufseite steht in SortenSeite.jsx,
 * was AWAKE von CREATE unterscheidet in app/lib/sorten-profil.js.
 * Bis 2026-09-11 trug diese Datei 424 Zeilen, davon 351 woertlich gleich
 * mit Create.jsx (Job 20260910-REPAIR-awake-und-create-sind-zwei-kopien-
 * derselben-seite). Die Route (products.crystal-cacao-awake.jsx) importiert
 * weiter diesen Default — sie musste sich nicht bewegen.
 */
/**
 * faqItems (Default: undefined, dann die volle FAQ_CACAO in SortenSeite, also
 * unverändert): die Fragen der FAQ am Seitenende. Die Kaufseite übergibt seit
 * dem 30.09.2026 nur den Rest, weil ihre häufigsten Kundenfragen weiter oben
 * stehen (Amazon-Stil, reusables/AmazonStil.jsx Kundenfragen).
 */
export default function AwakeProductPage({faqItems} = {}) {
  return <SortenSeite sorte="awake" faqItems={faqItems} />;
}
