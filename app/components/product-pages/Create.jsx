import {SortenSeite} from './SortenSeite';

/**
 * CREATE — die Huelle. Der Rumpf der Kaufseite steht in SortenSeite.jsx,
 * was CREATE von AWAKE unterscheidet in app/lib/sorten-profil.js.
 * Bis 2026-09-11 trug diese Datei 414 Zeilen, davon 351 woertlich gleich
 * mit Awake.jsx (Job 20260910-REPAIR-awake-und-create-sind-zwei-kopien-
 * derselben-seite). Die Route (products.crystal-cacao-create.jsx) importiert
 * weiter diesen Default — sie musste sich nicht bewegen.
 */
export default function CreateProductPage() {
  return <SortenSeite sorte="create" />;
}
