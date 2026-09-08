/**
 * kakao-stimmen — die ECHTEN Google-Bewertungen, in denen der Kakao vorkommt.
 *
 * HERKUNFT, nachpruefbar: Google-Unternehmensprofil „Qi Blanco"
 * (placeId `ChIJafc6o-z3okcRPlf__D3fDBM`, cid 1372717443771750206), abgerufen
 * am 2026-09-08 ueber denselben Feed, den der DACH-Shop seit Monaten benutzt:
 *   https://grw.reputon.com/app/storefront/widget?shop=qi-blanco.myshopify.com
 * Wortlaut, Name und Datum stehen hier so, wie sie im Profil stehen —
 * `zeit` ist der Unix-Zeitstempel aus dem Feed, `datum` seine ISO-Form.
 *
 * DIE MESSGRENZE GEHOERT DAZU UND WIRD NICHT VERSCHWIEGEN: der Feed meldet
 * 439 Bewertungen und LIEFERT davon 38 (Deckel der Quelle; ein Vorgaengerjob
 * hat das am 2026-08-02 mit 37 von 437 belegt und Pagination als wirkungslos
 * gemessen). Diese drei sind also alle Kakao-Nennungen unter den 38
 * ausgelieferten — nicht notwendig alle unter den 439. Wer hier mehr will,
 * braucht die Google-Business-Profile-API, nicht mehr Code.
 *
 * NICHTS IST GEGLAETTET, GEKUERZT ODER ZUSAMMENGESETZT. Wer eine Stimme
 * aendert, faelscht fremde Rede; wer eine dazuschreibt, erfindet einen Kunden.
 * Faellt eine weg, stehen eben zwei — drei echte sind mehr wert als zehn
 * gebaute (Christian, 2026-09-08).
 */

export const GOOGLE_PROFIL_URL =
  'https://search.google.com/local/reviews?placeid=ChIJafc6o-z3okcRPlf__D3fDBM';

export const KAKAO_STIMMEN = Object.freeze([
  Object.freeze({
    id: 'AbFvOqkb7S3bjbMTPSzd0WwHieMG8zTKcHqUehyA1E20PcZiQ_uNkQrj5_VxbNcuCoQR_BPZ1uts',
    name: 'Stefanie Spree',
    sterne: 5,
    datum: '2026-01-28',
    zeit: 1769613965,
    text: 'Ein wundervoller Kakao wie ich ihn noch nirgendwo sonst getrunken habe 🤎',
  }),
  Object.freeze({
    id: 'AbFvOqk-bbb3qS-XbISE7VKakrsxBL2gh_eC6z81S6ujMahOV90A9NKk-tKO4Jq9hCbaopr5XaLKfA',
    name: 'Kat rin',
    sterne: 5,
    datum: '2025-12-15',
    zeit: 1765824046,
    text:
      'Ich war nie der große Kakao-Fan, aber seit ich die beide Kristall-Kakaos habe, ' +
      'gibt es keinen Tag an dem ich nicht einen Becher trinke. Mein Kaffeekonsum ist ' +
      'seit dem auf ein Minimum gesunken. Teilweise trinke ich mehrere Tage lang gar ' +
      'keinen Kaffee, vermisse ihn auch nicht. Meine Konzentrationsphase hat sich ' +
      'deutlich verlängert, und ich bin viel klarer und wacher im Kopf. Ich bin ein ' +
      'riesiger Fan von Herzen geworden und werde bald Nachschub bestellen müssen!',
  }),
  Object.freeze({
    id: 'AbFvOqkw-SMPv67EcHGzZmBexuHkUICY8trqnPUjnMf1yjswosD_5U-Yjdv2j5DpGUHKc86CNBZJ',
    name: 'Jojo',
    sterne: 5,
    datum: '2026-03-31',
    zeit: 1774974649,
    text:
      'Ich habe wegen einer Rückgabe (Kakao) ziemlichen Stress beim Support von Qi ' +
      'Blanco veranstaltet, was mir im Nachhinein wirklich leid tut. Service war ' +
      'nämlich nach kurzer Verzögerung vorbildlich, freundlich und blitzschnell! ' +
      'Danke vielmals!!',
  }),
]);

/** Deutsches Datum aus der ISO-Form — ohne zweite Bibliothek. */
export function datumDeutsch(iso) {
  const [j, m, t] = String(iso).split('-');
  return t && m && j ? `${t}.${m}.${j}` : iso;
}
