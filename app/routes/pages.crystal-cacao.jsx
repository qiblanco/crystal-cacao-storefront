import {redirect} from 'react-router';
import {UMGELEITETE_SEITEN} from '~/lib/kakao-zone';

/**
 * K2-ADAPTIERT (crystal-cacao-storefront) — NICHT byte-gleich zur Vorlage.
 * Die Vorlage qiblanco-storefront rendert unter dieser Adresse weiter die
 * Uebersichtsseite; auf DIESEM Laden ist sie die Startseite geworden.
 *
 * =====================================================================
 * DIESE ROUTE RENDERT SEIT DEM 2026-09-08 NICHTS MEHR — SIE LEITET WEITER.
 * =====================================================================
 * Christian, woertlich: „ist ‚Unser Kakao' nicht die bessere Frontseite —
 * ich wuerde sagen schon. Also das ist redundant. Einfach diese Version
 * uebernehmen, ‚Unser Kakao', und die andere Frontseite loeschen."
 *
 * Der Inhalt dieser Seite (app/components/product-pages/Kakao.jsx) wird
 * seither von `app/routes/_index.jsx` unter `/` gerendert. Bliebe diese
 * Route bestehen, staende derselbe Inhalt unter ZWEI Adressen — genau die
 * Redundanz, die der Auftrag abstellt, und fuer eine Suchmaschine
 * Duplicate Content auf der eigenen Domain.
 *
 * WARUM 301 UND NICHT 302: die Verschiebung ist dauerhaft. Ein 302 laesst
 * Suchmaschinen die alte Adresse als die massgebliche behalten; die
 * Rankinghistorie dieser Seite — der meistbesuchten Kakao-Flaeche —
 * wanderte dann nicht mit.
 *
 * WARUM DIE DATEI NICHT GELOESCHT WIRD, obwohl sie nichts mehr rendert:
 *   1. „Endgueltiges Loeschen ist Christians Perimeter" (Auftrag, woertlich).
 *   2. Ohne sie faengt die Catch-all-Route pages.$handle.jsx den Pfad ab und
 *      liefert wieder eine Seite — die Weiterleitung waere still weg.
 *      Eine geloeschte Datei ist hier also nicht „weniger Code", sondern
 *      eine andere Wirkung.
 *
 * DAS ZIEL STEHT NICHT HIER, sondern in app/lib/kakao-zone.js
 * (UMGELEITETE_SEITEN). Der zweite Leser ist die Sitemap: sie muss dieselbe
 * Adresse auslassen, die diese Route wegleitet. Zwei Stellen, die denselben
 * Zustand fuehren, laufen sonst auseinander — und die falsche gewinnt still.
 */
const ZIEL = UMGELEITETE_SEITEN['crystal-cacao'];

/**
 * Die Weiterleitung sitzt im LOADER, nicht in einer Komponente: sie muss
 * schon beim ersten Byte greifen. Ein Redirect im Render waere ein
 * Client-Sprung — die alte Adresse antwortete weiter mit HTTP 200, und
 * genau daran erkennt eine Suchmaschine eine Verschiebung NICHT.
 *
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request}) {
  // Query-Parameter werden mitgenommen. Wer eine Kampagnen-Adresse mit
  // ?utm_source=… auf die alte Seite geschaltet hat, verliert sie an der
  // Weiterleitung sonst — und damit die Zuordnung des Besuchs.
  const suche = new URL(request.url).search;
  throw redirect(ZIEL + suche, 301);
}

/**
 * Baulich unerreichbar: der Loader wirft immer. Die Komponente steht hier
 * als Riegel — faellt die Weiterleitung je aus, soll der Besucher auf der
 * Startseite landen und nicht auf einer leeren Seite mit HTTP 200.
 */
export default function CrystalCacaoUmgeleitet() {
  return null;
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
