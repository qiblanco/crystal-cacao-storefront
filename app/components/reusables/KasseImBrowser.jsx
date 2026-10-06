import {useEffect, useState} from 'react';
import {useAside} from '~/components/Aside';
import {WEBVIEW_META_MARKERS} from '~/lib/checkout-tracking';

/**
 * Hinweis im Warenkorb für Besucher im Instagram-/Facebook-Browser.
 *
 * HERKUNFT: Vorlage qiblanco-storefront 840ed57 (#650, 26.09.2026), in den
 * Kakao-Laden übertragen von Job 20261006-aiceo-k2-j2-kasse-hinweis-crystal-cacao.
 * Bewusst die Fassung von 840ed57 und NICHT die spätere mit „Link per E-Mail“
 * (#712): deren Link führt auf qiblanco.com/weiter/…, also aus diesem Laden hinaus.
 *
 * WARUM HIER: am 26.09. begründet nicht gebaut, weil kein bezahlter Meta-Zulauf
 * ankam (devlog D-079). Seit dem 01.10. laufen Meta-Anzeigen auf crystal-cacao.com
 * (21 bezahlte Besuche in 14 Tagen, alle mobil, 0 begonnene Kassen aus dem
 * In-App-Browser). Auf qiblanco.com bestellten aus Meta-Anzeigen im In-App-Browser
 * 0 von 24 begonnenen Kassen. Die Kasse ist dieselbe (checkout.qiblanco.com): sie
 * lädt dort und KANN abschließen, aber es fehlen Apple Pay (Shopify verlangt
 * Safari), Google Pay (in Android-WebViews aus) und die gespeicherten Karten.
 * Der Kassen-Link öffnet in einem frischen Browser denselben Warenkorb. Wer IN
 * DER KASSE über das Menü der App in den Browser wechselt, nimmt ihn mit; wer
 * es schon hier auf /cart tut, landet mit LEEREM Warenkorb (getrennter
 * Cookie-Speicher). Deshalb steht die Reihenfolge vorn.
 *
 * Bewusst KEIN Sprung-Knopf: x-safari-https:// trägt in Metas Browsern seit
 * Mitte 2025 unzuverlässig, intent:// ist unbelegt. Bewusst KEINE
 * Positionsangabe für das Menü: Ort und Bezeichnung wechseln je App/Version.
 *
 * ERKENNUNG: dieselbe Markerliste wie classifyUserAgent (WEBVIEW_META_MARKERS),
 * keine zweite. classifyUserAgent selbst wird NICHT benutzt, weil es die Klasse
 * `intern` vorzieht — unsere stummen Proben tragen `QiBlancoInternal` im UA und
 * müssen den Block sehen, sonst ist er am Rand unmessbar.
 * Gelesen wird der UA erst nach der Hydration (useEffect): der Server rendert
 * nichts, Server- und Client-Markup bleiben identisch.
 *
 * Im Drawer erscheint der Block nur, solange der Drawer offen ist: der
 * geschlossene Drawer steht im DOM vor der Seite, und ein unsichtbares Duplikat
 * davor ließe jede Rand-Messung mit `[data-kasse-iab]` ins Leere greifen.
 *
 * GESTALT DES LADENS statt der Vorlage: Farbe, Schrift und Abstand aus den
 * :root-Tokens in kakao-seiten.css (--cc-text, --cc-fs-2, --cc-space-1), keine
 * freien Werte. 16 px statt der 14,4 px der Vorlage: die Skala des Ladens hat
 * dazwischen keine Stufe, und 16 px ist sein Fließtext-Boden.
 *
 * Messmarker: data-kasse-iab, data-kasse-iab-app, data-kasse-iab-os.
 *
 * RÜCKWEG: KASSE_IM_BROWSER_AN = false (ein Bau) oder `git revert` des
 * Commits + bin/bau-nachzieher --jetzt.
 */
export const KASSE_IM_BROWSER_AN = true;

const APP = {instagram: 'Instagram', facebook: 'Facebook'};

const TEXT = {fontSize: 'var(--cc-fs-2, 1rem)', lineHeight: 1.45};

/**
 * App und Betriebssystem aus dem User-Agent — oder null, wenn der Hinweis
 * nicht passt (kein Meta-Browser, oder weder iOS noch Android: dort gibt es
 * weder Apple Pay noch Google Pay zuzusagen).
 *
 * @param {string | null | undefined} userAgent
 * @returns {{app: 'instagram' | 'facebook', os: 'ios' | 'android'} | null}
 */
export function kasseImBrowserKontext(userAgent) {
  const u = (userAgent || '').toLowerCase();
  if (!u || !WEBVIEW_META_MARKERS.some((m) => u.includes(m))) return null;
  let os = null;
  if (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) {
    os = 'ios';
  } else if (u.includes('android')) {
    os = 'android';
  }
  if (!os) return null;
  return {app: u.includes('instagram') ? 'instagram' : 'facebook', os};
}

/**
 * @param {{layout?: 'page' | 'aside'}}
 */
export function KasseImBrowser({layout}) {
  const [kontext, setKontext] = useState(null);
  // Wie CartMain: der Warenkorb steht immer im Aside-Provider (PageLayout).
  const drawerOffen = useAside().type === 'cart';
  useEffect(() => {
    if (!KASSE_IM_BROWSER_AN) return;
    setKontext(kasseImBrowserKontext(window.navigator?.userAgent));
  }, []);

  if (!kontext) return null;
  if (layout === 'aside' && !drawerOffen) return null;

  const app = APP[kontext.app];
  const ios = kontext.os === 'ios';
  const wallet = ios ? 'Apple Pay' : 'Google Pay';
  const menue = ios ? '„In Safari öffnen“' : '„In Chrome öffnen“';
  const ziel = ios ? 'in Safari' : 'im Browser';

  return (
    <div
      className="kasse-im-browser"
      data-kasse-iab=""
      data-kasse-iab-app={kontext.app}
      data-kasse-iab-os={kontext.os}
      style={{
        color: 'var(--cc-text, #2c2a26)',
        padding: 'var(--cc-space-1, 0.5rem) 0 0',
      }}
    >
      {/* Schrift am <p> selbst: `aside p` schlägt das Erben. */}
      <p style={{...TEXT, margin: '0 0 var(--cc-space-1, 0.5rem)', fontWeight: 600}}>
        Lieber mit {wallet} bezahlen?
      </p>
      <p style={{...TEXT, margin: 0}}>
        Tippe erst auf „Jetzt sicher zur Kasse“. Dann in der Kasse auf die
        drei Punkte (···) von {app} und auf {menue} oder „Im Browser öffnen“.
        Dein Warenkorb kommt mit, und {ziel} hast du {wallet} und deine
        gespeicherten Karten.
      </p>
    </div>
  );
}
