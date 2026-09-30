/*
 * blockLinks — Kontext-Link-Map der Zwei-Block-Storefront-IA
 * (Job 20260717-storefront-ia-zweiblock-umbau; Konzept im Job-Ordner).
 *
 * ZWEI WELTEN, EIN SSoT fuer Produkt-Link-Ziele:
 *
 *   Block LP ('lp', geschlossener Paid-Funnel, alles noindex):
 *     /pages/qione-2-pro, /pages/qibracelet, /pages/qihome-air (LP-Shopseiten)
 *     + Campaign-LPs. Kauf on-page (Buy-Box); Karten-Links NUR zu
 *     Geschwister-LP-Shopseiten — NIE /products, NIE *-details (Leak).
 *
 *   Block oeffentlich ('public', indexierbar):
 *     "Jetzt kaufen" -> /products/*, "mehr erfahren" -> /pages/*-details.
 *     Kein Link in den noindex-Funnel.
 *
 * Dieselbe Produkt-Karte (UpsellLineUp/ProduktTrio/Campaign-Karten) rendert
 * damit block-abhaengige Ziele (Slot-/Prop-Muster wie Trust-Reuse D-045).
 * Der Zweiblock-Leak-Guard (homepage-bauer/selftest_zweiblock.py) prueft
 * diese Map und alle Call-Sites maschinell — Aenderungen hier NIE ohne
 * gruenen Selbsttest.
 *
 * FAIL-SAFE: unbekanntes Produkt/Block faellt auf die oeffentliche PDP
 * zurueck (/products/<handle>) — zieht nie jemanden in den noindex-Funnel.
 */

export const BLOCK_LP = 'lp';
export const BLOCK_PUBLIC = 'public';

/* Schluessel = Shopify-Produkt-Handle (products.*-Routen). */
const PRODUKT_LINKS = {
  'qione-2-pro': {
    [BLOCK_LP]: {kauf: '/pages/qione-2-pro', detail: '/pages/qione-2-pro'},
    [BLOCK_PUBLIC]: {
      kauf: '/products/qione-2-pro',
      detail: '/pages/qione-2-pro-details',
    },
  },
  qibracelet: {
    [BLOCK_LP]: {kauf: '/pages/qibracelet', detail: '/pages/qibracelet'},
    [BLOCK_PUBLIC]: {
      kauf: '/products/qibracelet',
      detail: '/pages/qibracelet-details',
    },
  },
  'qihome-air': {
    [BLOCK_LP]: {kauf: '/pages/qihome-air', detail: '/pages/qihome-air'},
    [BLOCK_PUBLIC]: {
      kauf: '/products/qihome-air',
      detail: '/pages/qihome-details',
    },
  },
};

/* Datenquellen fuehren QiHome teils unter 'qihome' (z. B. UpsellLineUp). */
const ALIAS = {qihome: 'qihome-air'};

/**
 * Block-abhaengiges Produkt-Link-Ziel.
 * @param {string} handle Shopify-Produkt-Handle (oder Alias)
 * @param {string} block BLOCK_LP | BLOCK_PUBLIC
 * @param {string} art 'kauf' | 'detail'
 * @returns {string}
 */
export function produktLink(handle, block, art) {
  const eintrag = PRODUKT_LINKS[ALIAS[handle] || handle];
  const ziel = eintrag?.[block]?.[art];
  return ziel || `/products/${ALIAS[handle] || handle}`;
}

/*
 * Thema-Chips (DreiThemenBand): im LP-Block darf der esmog-Chip nicht auf
 * die PDP zeigen — Ziel ist die E-Smog-Campaign-LP (URL mit Grossschreibung,
 * so heisst die Route). public bleibt der Datenstand aus redesign3themen
 * (oeffentliche Band-Nutzung existiert derzeit nicht).
 */
const LP_THEMA_ZIELE = {
  esmog: '/pages/E-Smog-Schutz',
};

/**
 * Block-abhaengiges Thema-Link-Ziel fuer DreiThemenBand-Chips.
 * @param {{id: string, link: string}} thema Eintrag aus THEMEN
 * @param {string} block BLOCK_LP | BLOCK_PUBLIC
 * @returns {string}
 */
export function themaLink(thema, block) {
  if (block === BLOCK_LP && LP_THEMA_ZIELE[thema.id]) {
    return LP_THEMA_ZIELE[thema.id];
  }
  return thema.link;
}
