/*
 * UpPromote-Affiliate-Basis-Code für crystal-cacao.com.
 *
 * WARUM DIESE DATEI ÜBERHAUPT: crystal-cacao.com ist eine EIGENE
 * Hydrogen-App (eigenes Repo, eigene Oxygen-Umgebung) — aber sie verkauft am
 * SELBEN Shopify-Shop (qi-blanco.myshopify.com) über DENSELBEN Checkout
 * (checkout.qiblanco.com) wie qiblanco.com. Bis heute trug diese App KEINEN
 * UpPromote-Code: ein Partnerklick, der auf crystal-cacao.com landete, wurde
 * nie erfasst — unabhängig davon, ob der Checkout die Referenz später
 * durchgereicht hätte. Das ist die Hälfte, die in der Auftragsbeschreibung
 * fehlte; dort stand nur die Linker-Liste der Schwester-App.
 *
 * DIE ZWEI-FLÄCHEN-FRAGE (Christian, wörtlich): "ein Affiliate-Klick auf der
 * einen und ein Kauf auf der anderen Fläche muss DERSELBE Vorgang sein."
 * Die beiden Flächen sind crystal-cacao.com und qiblanco.com/pages/crystal-cacao.
 * Weil beide am selben Shop hängen, ist das attributiv lösbar — die Zuordnung
 * bricht nicht am Checkout, sondern an der linker-Liste. Deshalb führt die
 * Liste unten BEIDE Flächen UND den gemeinsamen Checkout: ein Kunde, der von
 * hier auf die Schwesterfläche wechselt, nimmt die Referenz mit, und umgekehrt.
 *
 * BEIDE KAKAO-FASSUNGEN, nicht nur der Apex: crystal-cacao.com liefert 301 auf
 * www.crystal-cacao.com, und www ist seit dem Livegang am 2026-08-25 die
 * PRIMÄRE Fassung (Shopify hat sie damals selbsttätig mit angelegt). Eine
 * Liste mit nur dem Apex deckte genau den Host nicht ab, auf dem der Kauf
 * real beginnt.
 *
 * WAS DIESE DATEI TUT — UND WAS NICHT: sie legt ausschließlich die Queue
 * (window.upDataLayer) und den upTag-Stub an und schreibt zwei
 * Konfigurationswerte HINEIN. Sie setzt nichts auf dem Endgerät, lädt nichts
 * nach und sendet nichts. Die Werte liegen nur im Arbeitsspeicher, bis
 * collect.js sie abarbeitet.
 *
 * DAS EINWILLIGUNGSPFLICHTIGE STÜCK ist das Nachladen von
 * https://static-pixel.uppromote.com/collect/v1/collect.js. Das passiert
 * BEWUSST NICHT hier und BEWUSST NICHT als fester <script>-Tag in root.jsx,
 * sondern in app/components/UpPromoteTracking.jsx hinter demselben
 * Cookiebot-Marketing-Tor wie das Meta-Pixel (trackingAllowed() aus
 * MetaPixel.jsx, importiert statt nachgebaut). Ein fester Tag in root.jsx
 * würde collect.js bei JEDEM Seitenaufruf laden — auch ohne Einwilligung.
 *
 * REIHENFOLGE: dieses Skript hängt als defer-Tag in root.jsx und läuft damit
 * vor der React-Hydration. Wenn UpPromoteTracking.jsx collect.js nachlädt,
 * liegen die config-Aufrufe also bereits in der Queue — genau die Reihenfolge,
 * die UpPromote verlangt.
 *
 * ACHTUNG: dieselbe Hostliste steht ein zweites Mal in
 * app/components/UpPromoteTracking.jsx (UPPROMOTE_LINKER_DOMAINS). Wer nur
 * eine der beiden anfasst, baut einen stillen Verlust. Beide gehören in
 * denselben Commit.
 */
(function () {
  if (window._crystalCacaoUpPromoteBasisGeladen) return;
  window._crystalCacaoUpPromoteBasisGeladen = true;

  window.upDataLayer = window.upDataLayer || [];
  if (typeof window.upTag !== 'function') {
    window.upTag = function upTag() {
      return window.upDataLayer.push(arguments);
    };
  }

  // Der Shop, an dem diese Fläche hängt — derselbe wie qiblanco.com.
  window.upTag('config', 'myshopify_domain', 'qi-blanco.myshopify.com');
  window.upTag('config', 'linker', [
    'checkout.qiblanco.com',
    'qiblanco.com',
    'crystal-cacao.com',
    'www.crystal-cacao.com',
  ]);
})();
