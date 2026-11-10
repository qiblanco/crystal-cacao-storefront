import {useState} from 'react';
import {useNonce} from '@shopify/hydrogen';
import {hinweisHtml} from '~/lib/einwilligung-texte';

/**
 * FRÜHE WAHL (s12, gemessen 09.11.2026 live, mobil 390x844, Netz 1,6 Mbit/s, CPU x4):
 * die Leiste steht ab rund 1,0 s im Bild, /qb-einwilligung.js (defer) bedient sie erst ab
 * 3,3 bis 4,6 s. Ein Tipp dazwischen ging still verloren (3 von 3 Läufen: Leiste offen,
 * kein Cookie). Dieses Inline-Skript steht direkt hinter der Leiste, merkt sich solche
 * Klicks in window.__qbEwFrueh und blendet die Leiste bei „Notwendige“ und „Alle“ sofort
 * aus. Das Skript holt die letzte Wahl beim Start nach (fruehWahl in qb-einwilligung.js)
 * und setzt danach qbEinwilligung.bereit; ab dann schweigt dieser Zuhörer.
 * Es setzt kein Cookie und lädt nichts.
 */
const FRUEH_WAHL =
  "(function(d,w){if(w.__qbEwFrueh)return;var q=w.__qbEwFrueh=[];" +
  "d.addEventListener('click',function(e){if(w.qbEinwilligung&&w.qbEinwilligung.bereit)return;" +
  "var t=e.target,k=t&&t.closest?t.closest('[data-qb-wahl]'):null;" +
  "if(!k||!k.closest('#qb-einwilligung'))return;var a=k.getAttribute('data-qb-wahl');q.push(a);" +
  "if(a!=='einstellungen'){var b=d.getElementById('qb-einwilligung');if(b)b.setAttribute('hidden','');}" +
  "},true);})(document,window);";

/**
 * Der eigene Einwilligungshinweis (BAUVERTRAG Abschnitt 4), erstes Kind von <body>.
 *
 * Christian 22.10. (Z4): die Seite lädt und ist voll benutzbar, BEVOR der
 * Besucher wählt. Deshalb eine Leiste unten ohne Overlay, ohne Scroll-Sperre,
 * ohne Ausgrauen. Erstes body-Kind, damit die Tastatur ihn zuerst erreicht.
 *
 * Inhalt per dangerouslySetInnerHTML: React gleicht ihn nie ab, das Skript
 * /qb-einwilligung.js darf ihn bedienen (hidden setzen, Schalter umlegen),
 * ohne einen Hydrationsfehler auszulösen. Die Hülle trägt keinen Zustand.
 *
 * Gerendert nur im Motor 'eigen' (app/lib/einwilligung-schalter.js).
 *
 * Der HTML-Text wird EINMAL beim ersten Rendern festgelegt: der Root-Loader
 * läuft nach jedem Warenkorb-POST neu, `entschieden` kippt dann, und ein neuer
 * String liesse React Banner und Dialog ersetzen (Befund K3-Gegenprüfung s02:
 * danach war der Widerruf tot). Den Zustand gleicht das Skript selbst ab.
 */
export function Einwilligungshinweis({sprache = 'de', entschieden = false}) {
  const [html] = useState(() => hinweisHtml(sprache, {entschieden}));
  // Wie html EINMAL festgelegt: kippt `entschieden` nach einem Warenkorb-POST, bleibt der Baum gleich.
  const [mitFruehWahl] = useState(() => !entschieden);
  const nonce = useNonce();
  return (
    <>
      <div
        className="qb-einwilligung-wurzel"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{__html: html}}
      />
      {mitFruehWahl && (
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{__html: FRUEH_WAHL}}
        />
      )}
    </>
  );
}
