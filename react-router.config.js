import {hydrogenPreset} from '@shopify/hydrogen/react-router-preset';

/**
 * React Router 7.9.x Configuration for Hydrogen
 *
 * This configuration uses the official Hydrogen preset to provide optimal
 * React Router settings for Shopify Oxygen deployment. The preset enables
 * validated performance optimizations while ensuring compatibility.
 */
/**
 * PROTOTYP s05: Der Node-Bau (Weg A, `vite.config.node.mjs`) legt sein Ergebnis
 * nach `dist-node/`, damit das Oxygen-Artefakt in `dist/` unberuehrt bleibt —
 * sonst ueberschriebe der Prototyp den lauffaehigen Bestand, und der Rueckweg
 * waere ein Neubau statt ein Nichtstun.
 *
 * Der Schalter ist bewusst eine Umgebungsvariable und kein Dauerzustand: ist
 * CRYSTAL_NODE_BUILD nicht gesetzt, ist das exportierte Objekt identisch zu
 * vorher (der Spread traegt dann nichts ein) — der Oxygen-Bau merkt von dieser
 * Datei nichts.
 */
const nodePrototypBau = process.env.CRYSTAL_NODE_BUILD === '1';

export default {
  presets: [hydrogenPreset()],
  ...(nodePrototypBau ? {buildDirectory: 'dist-node'} : {}),
};

/** @typedef {import('@react-router/dev/config').Config} Config */
