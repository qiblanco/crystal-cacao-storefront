/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

import type {HydrogenEnv} from '@shopify/hydrogen';

declare global {
  /**
   * Umgebungsvariablen der Tracking-Naht (K3, ADR 0056).
   *
   * ALLE sind OPTIONAL und die Naht ist FAIL-CLOSED: ist eine nicht gesetzt,
   * bleibt der zugehoerige Teil AUS — es gibt keinen Halb-Zustand und keine
   * stille Fehlzuordnung. Was hier fehlt, fehlt sichtbar; was gesetzt wird,
   * wirkt. Diese Liste ist zugleich die Uebergabe an s10 (Domain-Freischaltung).
   */
  interface Env extends HydrogenEnv {
    /**
     * Kommagetrennte Hostliste, auf der diese Storefront als PRODUKTION gilt
     * (Drittskripte + Pixel). Ohne sie greift die Quelltext-Liste in
     * app/lib/checkout-tracking.js (crystal-cacao.com, www.crystal-cacao.com).
     */
    PUBLIC_TRACKING_HOSTS?: string;
    /**
     * CONSENT-BYPASS, kein Host-Schalter (ADR 0056 Festlegung 4). Zulaessig
     * AUSSCHLIESSLICH auf der Oxygen-Vorschau, solange die Domain nicht
     * kundenerreichbar ist; in der crystal-PRODUKTION VERBOTEN. Ihn dort zu
     * setzen erfasst JEDEN Besucher unabhaengig von seiner Cookiebot-
     * Entscheidung. Entfernen vor dem Domain-Go-live ist Pflichtschritt (s10).
     * Durchsetzer: homepage-bauer/pruefungen/probe_crystal_consent_bypass.py
     */
    PUBLIC_ENABLE_TRACKING_IN_PREVIEW?: string;
    /**
     * Cookiebot-Domaingruppe DIESER Domain. Ohne sie: kein Banner, kein
     * marketing-Consent, und damit (fail-closed) kein Tracking.
     */
    PUBLIC_COOKIEBOT_ID?: string;
    /**
     * Meta-Pixel-Kennung DIESER Domain. Ohne sie bootet der Pixel nicht.
     * Bewusst NICHT die Kennung der Hauptseite (siehe MetaPixel.jsx).
     */
    PUBLIC_META_PIXEL_ID?: string;
    /**
     * Endpoint des First-Party-Pixels (qpx) — er setzt `_qpx_anon`, den
     * Schluessel der Session->Kauf-Bruecke. Ohne ihn laedt qpx nicht.
     */
    PUBLIC_QPX_ENDPOINT?: string;
    /**
     * Basis-URL des Hyros-Universal-Scripts MIT eigener Tag-Kennung
     * (einschliesslich `&ref_url=`; die Ziel-URL wird angehaengt). Ohne sie
     * laedt kein Hyros-Tag — siehe public/qiblanco-tracker.js.
     */
    PUBLIC_HYROS_TAG_URL?: string;
    /**
     * Kommagetrennte ISO-2-Laender mit Consent-Pflicht. Ohne sie gilt
     * 'consent' fuer ALLE Regionen (strengste Stufe, fail-closed).
     */
    PUBLIC_CONSENT_STRICT_REGIONS?: string;
  }
}
