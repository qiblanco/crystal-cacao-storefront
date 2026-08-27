import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {trackingAllowed, subscribeConsentChanges} from './MetaPixel';

/**
 * UpPromote-Affiliate-Tracking (Browser) für crystal-cacao.com.
 *
 * WARUM: crystal-cacao.com ist eine eigene Hydrogen-App auf Oxygen, aber sie
 * verkauft am SELBEN Shop (qi-blanco.myshopify.com) über DENSELBEN Checkout
 * (checkout.qiblanco.com) wie qiblanco.com. Das UpPromote-App-Embed einer
 * Theme-Storefront gibt es hier nicht — der US-Shop qi-blanco.com hat es
 * nativ, diese Fläche kann es baulich nicht bekommen. Ohne diese Komponente
 * trug die Kakao-App überhaupt keinen UpPromote-Code: ein Partnerklick auf
 * crystal-cacao.com wurde nie erfasst.
 *
 * SPIEGEL VON qiblanco-storefront: Aufbau, Consent-Tor und Ereignisweitergabe
 * sind bewusst wörtlich dieselben wie dort. Zwei Storefronts mit derselben
 * Aufgabe sollen dieselbe Bauart haben — wer eine liest, kennt beide. Was sich
 * unterscheidet, ist nur der Namensraum der Flags (_crystalCacao… statt
 * _qiblanco…), damit die beiden Apps sich nicht gegenseitig für gebootet
 * halten, falls je eine in die andere eingebettet wird.
 *
 * ARBEITSTEILUNG (bewusst zweigeteilt):
 *  - public/crystal-cacao-uppromote-tracker.js legt Queue + upTag-Stub an und
 *    schreibt die beiden config-Werte hinein. Inert: nichts auf dem Endgerät,
 *    nichts gesendet. Hängt als defer-Tag in root.jsx, läuft also VOR der
 *    Hydration und damit vor allem hier.
 *  - Diese Komponente macht die zwei einwilligungspflichtigen Dinge: sie lädt
 *    collect.js nach und gibt cart_updated weiter.
 *
 * CONSENT: exakt dasselbe Tor wie das Meta-Pixel — trackingAllowed() und
 * subscribeConsentChanges() werden aus MetaPixel.jsx IMPORTIERT, nicht
 * nachgebaut (Cookiebot-Marketing, Region-Policy, Preview-Attribut). Ohne
 * Zustimmung wird collect.js nicht geladen und kein Event gefeuert.
 * `_crystalCacaoUpPromoteBooted` gated BEIDE Hälften: die Event-Weitergabe
 * kann nicht am Loader vorbeilaufen. Zusätzlich hängt die Komponente in
 * root.jsx im bestehenden Production/Preview-Gate shouldLoadThirdPartyScripts.
 *
 * Rendert nichts.
 */
const UPPROMOTE_PIXEL_SRC =
  'https://static-pixel.uppromote.com/collect/v1/collect.js';
const UPPROMOTE_MYSHOPIFY_DOMAIN = 'qi-blanco.myshopify.com';

// ACHTUNG: dieselbe Liste steht ein zweites Mal in
// public/crystal-cacao-uppromote-tracker.js. Wer nur eine der beiden anfasst,
// baut einen stillen Verlust. Beide gehören in denselben Commit.
//
// Alle vier Hosts, weil die Kakao-Ware über zwei Flächen verkauft wird
// (crystal-cacao.com und qiblanco.com/pages/crystal-cacao) und beide in
// denselben Checkout münden. Ein Partner, der auf die eine Fläche verlinkt,
// während der Kunde auf der anderen kauft, verlöre seine Provision sonst beim
// Domainwechsel — still, ohne Fehler. BEIDE Kakao-Fassungen: crystal-cacao.com
// liefert 301 auf www.crystal-cacao.com, www ist die primäre Fassung.
const UPPROMOTE_LINKER_DOMAINS = [
  'checkout.qiblanco.com',
  'qiblanco.com',
  'crystal-cacao.com',
  'www.crystal-cacao.com',
];

/**
 * Notnagel für den Fall, dass der defer-Tag aus root.jsx nicht gelaufen ist
 * (Skript geblockt, Reihenfolge anders als erwartet). Schreibt dieselben Werte
 * wie public/crystal-cacao-uppromote-tracker.js und ist über das Flag dort
 * gegen doppelte config-Aufrufe gesichert. Im Normalfall passiert hier nichts.
 */
function stelleBasisSicher() {
  if (window._crystalCacaoUpPromoteBasisGeladen) return;
  window._crystalCacaoUpPromoteBasisGeladen = true;

  window.upDataLayer = window.upDataLayer || [];
  if (typeof window.upTag !== 'function') {
    window.upTag = function upTag() {
      return window.upDataLayer.push(arguments);
    };
  }
  window.upTag('config', 'myshopify_domain', UPPROMOTE_MYSHOPIFY_DOMAIN);
  window.upTag('config', 'linker', UPPROMOTE_LINKER_DOMAINS);
}

function bootUpPromote() {
  if (window._crystalCacaoUpPromoteBooted) return;
  if (!trackingAllowed()) return;
  window._crystalCacaoUpPromoteBooted = true;

  // Reihenfolge ist Pflicht: die config-Aufrufe müssen in der Queue liegen,
  // bevor collect.js sie abarbeitet.
  stelleBasisSicher();

  const script = document.createElement('script');
  script.async = true;
  script.src = UPPROMOTE_PIXEL_SRC;
  // Kein nonce nötig: injiziert aus unserem bereits vertrauenswürdigen Bundle,
  // 'strict-dynamic' vererbt die Erlaubnis (wie fbevents.js in MetaPixel.jsx).
  document.head.appendChild(script);
}

/**
 * @param {string} eventName
 * @param {unknown} payload
 */
function upTagEvent(eventName, payload) {
  // Consent-Tor: ohne gebooteten Basis-Code wird nichts weitergegeben.
  if (!window._crystalCacaoUpPromoteBooted) return;
  if (typeof window.upTag !== 'function') return;
  if (!payload) return;
  try {
    window.upTag('event', eventName, payload);
  } catch {
    // Ein Tracking-Fehler darf nie den Warenkorb oder den Checkout blockieren.
  }
}

export function UpPromoteTracking() {
  const {subscribe} = useAnalytics();
  const subscribed = useRef(false);

  useEffect(() => subscribeConsentChanges(bootUpPromote), []);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    // Hydrogen feuert cart_updated bei jeder Änderung von cart.updatedAt
    // (Payload u.a. {cart, prevCart, shop}). UpPromote braucht den Cart, um den
    // Affiliate-Auto-Rabatt zu setzen.
    subscribe('cart_updated', (data) => {
      upTagEvent('cart_updated', data?.cart);
    });
  }, [subscribe]);

  return null;
}
