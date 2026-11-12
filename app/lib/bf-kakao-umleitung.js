/*
 * BF-KAKAO: ALTE ADRESSEN AUF DIE EINE KAKAO-DEAL-SEITE (Elina EL-20261111-fa47cfd9, GO 11.11.2026).
 *
 * Elina, Punkt 3: „Die bisherigen Kakao-Adressen (crystal-cacao-angebot, bundle-2x-awake,
 * mengenrabatt-2x, alte ?el=BF2025-Links) auf die neue Kakao-Deal-Seite weiterleiten.“
 *
 * Die Kakao-Deal-Seite DE mit Set-Wahl steht im Deutsch-Shop unter
 * https://qiblanco.com/products/j7hcyb802kn (Storefront qiblanco/qiblanco-storefront,
 * bf-deals-daten.js). Dieser Laden hat keine eigene Fassung davon; das Ziel ist darum
 * absolut die qiblanco.com-Adresse, dieselbe, die Mails, Ads und bf-deals bekommen.
 * Ihr Kaufknopf führt auf den Warenkorb-Link dieses Ladens (crystal-cacao.com/cart/...).
 *
 * 302 (vorübergehend), nur bis BF_DEAL_ENDE (30.11.2026 23:59 Berlin), danach antworten alle
 * Adressen wieder wie vorher. Alle Abfrageparameter (el, utm_*, fbclid, markt ...) kommen mit,
 * `set` setzt die Tabelle. `nurEuro`: bundle-2x-awake und mengenrabatt-2x sind die normalen
 * Set-Seiten dieses Ladens; sie leiten nur im Euro-Markt weiter (dort gilt der BF-Code), in
 * jedem anderen Markt zeigen sie ihre normale Seite.
 *
 * Gleiche Tabelle wie BF_KAKAO_UMLEITUNGEN in qiblanco-storefront bf-deals-daten.js.
 */
export const BF_DEAL_ENDE = '2026-11-30T22:59:59Z';
export const BF_KAKAO_ZIEL = 'https://qiblanco.com/products/j7hcyb802kn';

export const BF_KAKAO_UMLEITUNGEN = Object.freeze({
  awcr37shyj: {set: 'create-awake'},
  aw783hfn: {set: '2x-awake'},
  '37cr378n': {set: '2x-create'},
  'crystal-cacao-angebot': {set: 'create-awake'},
  'bundle-2x-awake': {set: '2x-awake', nurEuro: true},
  'mengenrabatt-2x': {set: '2x-create', nurEuro: true},
});

/**
 * Ziel der Weiterleitung, nur im Zeitfenster.
 * @returns {{ziel: string, nurEuro: boolean} | null}
 */
export function bfKakaoUmleitung(handle, requestUrl, jetzt = Date.now()) {
  const u = BF_KAKAO_UMLEITUNGEN[handle];
  if (!u || jetzt > Date.parse(BF_DEAL_ENDE)) return null;
  const q = new URLSearchParams({set: u.set});
  let alt;
  try {
    alt = new URL(requestUrl).searchParams;
  } catch {
    alt = new URLSearchParams();
  }
  alt.forEach((wert, schluessel) => {
    if (schluessel !== 'set') q.append(schluessel, wert);
  });
  return {ziel: `${BF_KAKAO_ZIEL}?${q.toString()}`, nurEuro: Boolean(u.nurEuro)};
}
