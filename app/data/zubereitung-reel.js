/**
 * Das Zubereitungs-Reel von @crystal.cacao — eine Stelle fuer zwei Leser:
 * die Seite /pages/zubereitung und den Hinweis auf den Kaufseiten
 * (components/reusables/ZubereitungHinweis.jsx).
 *
 * Eigener Kanal (og:url instagram.com/crystal.cacao/reel/Dd6WjfouvDW,
 * Graph business_discovery, veroeffentlicht 30.09.2026). Das mp4 und das
 * Titelbild liegen auf dem Shopify-CDN (medien-hosting/bin/cdn-upload,
 * 2026-10-30, Job 20261030-crystal-cacao-zubereitung-reiter-reel-design-99);
 * Dateiname traegt den sha256-Praefix des Inhalts. Dauer und Masse gemessen
 * mit ffprobe an derselben Datei.
 */
const CDN = 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/';

export const ZUBEREITUNG_PFAD = '/pages/zubereitung';

export const ZUBEREITUNG_REEL = Object.freeze({
  code: 'Dd6WjfouvDW',
  konto: 'crystal.cacao',
  permalink: 'https://www.instagram.com/reel/Dd6WjfouvDW/',
  veroeffentlicht: '2026-09-30',
  dauerSekunden: 46,
  breite: 720,
  hoehe: 1280,
  videoUrl: `${CDN}qb-cc-zubereitung--reel-dd6wjfouvdw--6782d48fdf77.mp4?v=1793345051`,
  posterUrl: `${CDN}qb-cc-zubereitung--reel-poster--68ce2f9aa3e2.jpg?v=1793345055`,
});

/** Standbild aus dem Reel (720 x 900, ueber dem eingebrannten Untertitel
 *  beschnitten). Das CDN liefert ueber `width` kleinere Fassungen. */
export function reelBild(datei) {
  const basis = `${CDN}${datei}`;
  return {
    url: basis,
    src: `${basis}&width=480`,
    srcSet: [240, 360, 480, 720]
      .map((w) => `${basis}&width=${w} ${w}w`)
      .join(', '),
    breite: 720,
    hoehe: 900,
  };
}
