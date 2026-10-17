import {CartForm} from '@shopify/hydrogen';
import {angebotKorrektur} from '~/lib/angebot-limit';

/*
 * Klemmt das Angebot im Warenkorb auf ANGEBOT_MAX (Regel und Begründung in
 * ~/lib/angebot-limit.js). Aufgerufen aus der Warenkorb-Action
 * (routes/cart.jsx) und dem Warenkorb-Permalink (routes/cart.$lines.jsx) —
 * dieselben zwei Türen wie bei den Qi-Master-Add-ons.
 *
 * NUR NACH HINZUFÜGEN UND MENGE ÄNDERN: Entfernen, Rabattcode und
 * Kundendaten können die Menge nicht erhöhen und kosten nichts.
 *
 * GELESEN WIRD DER WARENKORB, NICHT DIE EINGABE: ein zweites „In den
 * Warenkorb" derselben Variante führt Shopify zu einer Zeile mit Menge 2
 * zusammen, und eine Menge-ändern-Eingabe trägt nur die Zeilen-id. Trägt die
 * Antwort der Mutation schon die Zeilen, entfällt das Nachlesen.
 *
 * FAIL-SOFT: scheitert das Lesen oder die Korrektur, bleibt das Ergebnis der
 * Kundenaktion unverändert (eine Warnung im Log). Der Warenkorb wird nie
 * geleert; ein durchgerutschtes zweites Angebot meldet der Bestell-Arm der
 * Preisboden-Wache.
 */
const BEGRENZ_AKTIONEN = new Set([
  CartForm.ACTIONS.LinesAdd,
  CartForm.ACTIONS.LinesUpdate,
]);

function zeilenAus(warenkorb) {
  const nodes = warenkorb?.lines?.nodes;
  if (!Array.isArray(nodes)) return null;
  if (nodes.some((z) => !z?.merchandise?.product)) return null;
  return nodes.map((z) => ({
    id: z.id,
    quantity: z.quantity,
    handle: z.merchandise.product.handle,
  }));
}

export async function begrenzeAngebot({cart, action, result}) {
  const cartId = result?.cart?.id;
  if (!cartId) return result;
  if (!BEGRENZ_AKTIONEN.has(action)) return result;

  let zeilen = zeilenAus(result.cart);
  if (!zeilen) {
    try {
      zeilen = zeilenAus(await cart.get({cartId}));
    } catch (e) {
      console.warn('angebot-limit: Warenkorb nicht lesbar', e?.message || e);
      return result;
    }
    if (!zeilen) {
      console.warn('angebot-limit: Warenkorb ohne lesbare Zeilen');
      return result;
    }
  }
  const {entfernen, aendern} = angebotKorrektur(zeilen);
  if (!entfernen.length && !aendern.length) return result;

  let neu = result;
  try {
    if (entfernen.length) neu = await cart.removeLines(entfernen, {cartId});
    if (aendern.length) neu = await cart.updateLines(aendern, {cartId});
  } catch (e) {
    console.warn('angebot-limit: Korrektur gescheitert', e?.message || e);
    return result;
  }
  return neu?.cart ? neu : result;
}
