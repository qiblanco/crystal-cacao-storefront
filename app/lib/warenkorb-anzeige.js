import {useEffect, useState} from 'react';
import {useFetchers} from 'react-router';
import {CartForm} from '@shopify/hydrogen';

/*
 * WAS DER WARENKORB ZEIGT, WAEHREND EINE AKTION LAEUFT — und wie ein Betrag
 * geschrieben wird. Laden-eigen (keine K-Klasse in shared/UPSTREAM.json).
 *
 * ANLASS, 2026-10-13, Christian: „die seite crystal cacao hängt voll im
 * warenkorb wenn man die stückzahl ändert oder auch wenn man was in den
 * warenkorb legt" und „dass da 0 euro angezeigt wurde ist die ladezeit".
 * Gemessen (Grossjob 20261013-crystal-cacao-warenkorb-haengt, s01):
 *
 *   - Eine Warenkorb-Aktion dauert am Server 1,6 bis 4,1 s, weil nach der
 *     Kundenaktion die Set-Zeile gelegt wird (kakao-set-zeile.server.js, K1).
 *     In dieser Zeit zeigte die Schublade eine neue Zeile mit „0,00 €": die
 *     optimistische Zeile von useOptimisticCart hat noch keinen `cost`, und
 *     cart-display-pricing.js (K1) liest dann `?? '0'`.
 *   - Der Stepper einer Set-Zeile schickt `kakaoPackungen`. Das kennt
 *     useOptimisticCart nicht, die Zahl blieb stehen, die Knoepfe blieben
 *     klickbar. Wer nochmal klickte, brach im Browser die erste Anfrage ab
 *     (gleicher fetcherKey), der Server rechnete beide: Christians Korb sprang
 *     am 13.10. 09:28Z ueber 6, 5, 4 und 7 Packungen.
 *
 * DIE REGEL DARAUS (Christian 13.10. 10:05Z, s99): nie ein Platzhalter-Preis.
 * Solange eine Warenkorb-Aktion laeuft, steht an jedem Betrag eine
 * Ladeanzeige statt einer Zahl, der Stepper zeigt schon die Zielmenge, und
 * alle Knoepfe des Warenkorbs warten. Die Set-Normalform kann jede
 * Kakao-Zeile aendern (zwei Sorten werden ein gemischtes Set), darum gilt die
 * Ladeanzeige fuer alle Zeilen, nicht nur fuer die angeklickte.
 *
 * NOTAUSGANG: haengt eine Anfrage wirklich (Netz weg), darf der Warenkorb
 * nicht fuer immer gesperrt bleiben. Nach NOTAUSGANG_MS gelten die Knoepfe
 * wieder und die Betraege zeigen den letzten Stand des Servers.
 */
export const NOTAUSGANG_MS = 15000;

/**
 * Liest die laufenden Warenkorb-Formulare (CartForm) aus den Fetchern.
 * Rein, damit die Regel ohne React pruefbar bleibt.
 * @param {Array<{state?: string, formData?: FormData}>} fetchers
 * @returns {{laeuft: boolean, zielPackungen: Map<string, number>}}
 */
export function warenkorbAktionen(fetchers) {
  const zielPackungen = new Map();
  let laeuft = false;
  for (const f of fetchers || []) {
    if (!f || f.state === 'idle' || !f.formData) continue;
    let eingabe;
    try {
      eingabe = CartForm.getFormInput(f.formData);
    } catch {
      continue;
    }
    if (!eingabe?.action) continue;
    laeuft = true;
    const wunsch = eingabe.inputs?.kakaoPackungen;
    if (
      eingabe.action === CartForm.ACTIONS.LinesUpdate &&
      wunsch &&
      typeof wunsch === 'object' &&
      wunsch.lineId
    ) {
      const n = Number.parseInt(wunsch.packungen, 10);
      if (Number.isFinite(n) && n >= 0) zielPackungen.set(wunsch.lineId, n);
    }
  }
  return {laeuft, zielPackungen};
}

/**
 * @returns {{laeuft: boolean, blockiert: boolean, zielPackungen: Map<string, number>}}
 *   laeuft: eine Warenkorb-Aktion ist unterwegs (auch nach dem Notausgang);
 *   blockiert: laeuft und der Notausgang ist noch nicht erreicht.
 */
export function useWarenkorbAktion() {
  const {laeuft, zielPackungen} = warenkorbAktionen(useFetchers());
  const [ueberfaellig, setUeberfaellig] = useState(false);
  useEffect(() => {
    if (!laeuft) {
      setUeberfaellig(false);
      return undefined;
    }
    const t = setTimeout(() => setUeberfaellig(true), NOTAUSGANG_MS);
    return () => clearTimeout(t);
  }, [laeuft]);
  return {laeuft, blockiert: laeuft && !ueberfaellig, zielPackungen};
}

const LOCALE_JE_WAEHRUNG = Object.freeze({
  EUR: 'de-DE',
  CHF: 'de-CH',
  USD: 'en-US',
  GBP: 'en-GB',
});

/**
 * GANZE BETRAEGE OHNE NACHKOMMASTELLEN (Christian 13.10.: „ich möchte auch
 * nicht dass im warenkorb die nachkommastellen angezeigt werden, wir haben ja
 * die preise bereinigt auf ganze euro"; Hausregel writing-rules.md §3:
 * „249 €", nie „249,00 €").
 *
 * Ein Betrag, der auf den Cent ganz ist, steht ohne Nachkommastellen
 * („159 €", „$69", „CHF 116"). Ein Betrag MIT Cent (CHF-Umrechnung,
 * Partnercode in Prozent) wird NICHT gerundet, sondern bleibt cent-genau:
 * der Warenkorb zeigt, was die Kasse belastet. Das Gebietsschema folgt der
 * Waehrung wie in components/Preis.jsx.
 *
 * @param {string|number} betrag
 * @param {string} [waehrung] ISO-4217-Code
 * @returns {string|null} null ohne lesbaren Betrag — nie „0" und nie „NaN"
 */
export function warenkorbBetrag(betrag, waehrung) {
  const zahl = Number.parseFloat(betrag);
  if (!Number.isFinite(zahl)) return null;
  const code = waehrung || 'EUR';
  const locale = LOCALE_JE_WAEHRUNG[code] || 'de-DE';
  const ganz = Math.round(zahl * 100) % 100 === 0;
  const stellen = ganz ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: stellen,
      maximumFractionDigits: stellen,
    }).format(zahl);
  } catch {
    return `${zahl.toLocaleString('de-DE', {
      minimumFractionDigits: stellen,
      maximumFractionDigits: stellen,
    })} ${code}`;
  }
}
