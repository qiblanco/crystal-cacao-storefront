import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * PROTOTYP s05 — Bau OHNE Oxygen-Preset (Weg A, Node-Spielart).
 * =============================================================
 * Diese Datei ist die Node-Zwillingsfassung von `vite.config.js`. Sie wird
 * NUR ueber `--config vite.config.node.mjs` gezogen; der Oxygen-Bau
 * (`npm run build`) liest sie nie. Damit ist der Rueckweg das Nichtstun.
 *
 * DREI UNTERSCHIEDE ZUM BESTAND, jeder einzeln begruendet:
 *
 * 1. `oxygen()` fehlt im plugins-Array (so schreibt es die Selbsthosting-
 *    Anleitung vor; `hydrogen()` BLEIBT). Gemessen an
 *    node_modules/@shopify/mini-oxygen/dist/vite/plugin.js faellt damit weg:
 *    ssr.target 'webworker', die Aufloesungs-Bedingungen worker/workerd,
 *    noExternal:true und das Artefakt dist/server/oxygen.json.
 *
 * 2. Der SSR-Einstieg muss explizit gesetzt werden. Genau das tat bisher der
 *    oxygen()-Plugin (DEFAULT_SSR_ENTRY = "./server", Z. 14/63-70 dort). Ohne
 *    Ersatz baute `react-router build` NICHT unseren fetch-Handler, sondern
 *    den React-Router-Server-Build — unser `server.js` mit storefrontRedirect
 *    und der Session-Verdrahtung fiele lautlos aus dem Bundle. `nodeSsrEntry()`
 *    unten repliziert deshalb exakt diese eine Zeile Verhalten, ohne die
 *    Worker-Laufzeit mitzunehmen.
 *
 * 3. `react-dom/server` -> `react-dom/server.browser`. GEMESSEN, nicht
 *    vermutet: auf Node exportiert `react-dom/server` (React 18.3.1) nur
 *    renderToPipeableStream/renderToString — `renderToReadableStream` fehlt,
 *    und genau die ruft `app/entry.server.jsx`. Bisher hat die worker-
 *    Bedingung des oxygen()-Plugins still die Browser-Fassung aufgeloest.
 *    Der Alias stellt das wieder her; Node 24 hat Web Streams global, die
 *    Fassung laeuft dort unveraendert. Die Alternative waere eine zweite
 *    entry.server-Fassung mit PassThrough (so das Express-Rezept) — sie
 *    haette eine Datei mehr gekostet und dieselbe Wirkung gehabt.
 *
 * WAS BEWUSST NICHT PASSIERT: keine Datei unter app/ wird angefasst. Die drei
 * Oxygen-Zulieferungen (caches, waitUntil, env) stellt der Adapter
 * `server.node.mjs` von aussen. app/lib/context.js ist im shared/UPSTREAM.json
 * als K3 gefuehrt und app/lib/markt-pricing.js als K1 — der von der Recherche
 * vorgeschlagene Direkteingriff dort waere eine Klassen-Verletzung.
 */

const SSR_ENTRY = './server.js';

function nodeSsrEntry() {
  return {
    name: 'crystal-node-ssr-entry',
    config(config, env) {
      // Spiegelt mini-oxygen/dist/vite/plugin.js Z. 63-70: die React-Router-CLI
      // setzt build.ssr auf `true`, wenn kein --entry uebergeben wurde. Genau
      // dann (und nur dann) tragen wir unseren echten Einstieg nach.
      if (env.isSsrBuild && config.build?.ssr) {
        return {
          build: {
            ssr: config.build.ssr === true ? SSR_ENTRY : config.build.ssr,
          },
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [hydrogen(), nodeSsrEntry(), reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      // Siehe Kopf, Punkt 3 — ohne diesen Alias bricht das SSR-Rendern auf Node.
      'react-dom/server': 'react-dom/server.browser',
    },
    tsconfigPaths: true,
  },
  build: {
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      include: [
        'react-router > set-cookie-parser',
        'react-router > cookie',
        'react-router',
      ],
    },
  },
});
