import {redirect} from 'react-router';

/**
 * DIESER LADEN FUEHRT KEIN KUNDENKONTO — und diese Route ist der Beleg dafuer,
 * dass die Entscheidung auch fuer den gilt, der die Adresse noch kennt.
 *
 * WAS HIER VORHER STAND: zehn Routendateien aus dem Hydrogen-Geruest
 * (account.jsx, account._index, account.orders*, account.profile,
 * account.addresses, account_.login, account_.logout, account_.authorize,
 * account.$). Sie sind am 2026-09-09 in den Papierkorb gegangen, nicht
 * geloescht — `papierkorb restore 20260909T0004*` holt jede einzelne zurueck.
 *
 * WARUM, GEMESSEN UND NICHT VERMUTET (2026-09-08/09, am echten Rand
 * https://crystal-cacao.com):
 *
 *   /account            302 -> /account/orders -> HTTP 500
 *   /account/login      HTTP 500
 *   /account/register   302 -> /account/login   -> HTTP 500
 *   /account/orders     HTTP 500
 *   /account/profile    302 -> /account/login   -> HTTP 500
 *   /account/addresses  302 -> /account/login   -> HTTP 500
 *
 * ALLE SECHS. Der Dienst nennt den Grund selbst:
 * "[h2:error:customerAccount] You do not have the valid credential to use
 * Customer Account API" — in `.env` gibt es weder
 * PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID noch ...API_URL. Diese Zugangsdaten zu
 * beschaffen heisst: eine App im Shopify-Admin konfigurieren und ein
 * Geheimnis hinterlegen. Das ist R3-Perimeter und ausdruecklich NICHT autonom.
 *
 * UND DIE FRAGE DAVOR WURDE ZUERST BEANTWORTET, in der vom Auftrag
 * verlangten Reihenfolge: VERLANGT DIE KASSE EIN KONTO? Nein. Gemessen an der
 * echten Kasse (Warenkorb ueber die Storefront-API angelegt, checkoutUrl
 * gefolgt bis checkout.qiblanco.com/checkouts/cn/..., HTTP 200): das Feld
 * `customerAccountRequirement` steht auf "OPTIONAL". Ein Gast kauft durch.
 * Wer trotzdem ein Konto will, findet den Weg IN der Kasse
 * (`loginLinkVisible: true`) — dort haelt Shopify ihn selbst am Leben.
 *
 * WARUM 302 UND NICHT 301: eine dauerhafte Weiterleitung bleibt im Browser
 * des Besuchers stehen, auch wenn dieser Laden spaeter doch Konten bekommt.
 * 302 ist hier der Rueckweg, nicht die Unentschlossenheit.
 *
 * WARUM UEBERHAUPT EINE ROUTE STATT NICHTS: ohne sie antworten diese Adressen
 * mit 404. Lesezeichen, Suchmaschinen und alte Verweise landen dann in einer
 * Sackgasse statt im Laden. Ein 404 waere ehrlicher als der 500 — aber die
 * Weiterleitung ist beides: ehrlich UND brauchbar.
 *
 * @param {Route.LoaderArgs}
 */
export async function loader() {
  return redirect('/', 302);
}

/** Auch ein POST (das alte Abmelde-Formular) landet im Laden statt im Leeren. */
export async function action() {
  return redirect('/', 302);
}

/** @typedef {import('./+types/account.$').Route} Route */
