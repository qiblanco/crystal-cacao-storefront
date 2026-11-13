// Was die Anmeldeweiche zeigt — reine Entscheidung ohne Browser, damit sie hermetisch prüfbar ist
// (anmelde-weiche-entscheidung.test.mjs). Elina EL-20261110-5a9e5746 Punkt 3: das AC-Formular nur noch bei
// ausdrücklichem 'ac' aus /w; sonst das eigene Formular (Satz aus /w oder aus dem Rückfallstand) oder eine Hinweiszeile.
import {RUECKFALL_ANZEIGE} from './anmelde-rueckfallstand.js';

// Kennung wie ac-eingang einwilligung_id(): Hex aus sha256 (heute 12 Zeichen). Leer, Leerzeichen oder Objekt zählen nicht.
const KENNUNG = /^[0-9a-f]{8,64}$/;

export function anzeigeVollstaendig(anzeige) {
  return Boolean(
    anzeige &&
      typeof anzeige.einwilligung === 'string' &&
      anzeige.einwilligung.trim() &&
      typeof anzeige.knopf === 'string' &&
      anzeige.knopf.trim() &&
      typeof anzeige.einwilligung_id === 'string' &&
      KENNUNG.test(anzeige.einwilligung_id),
  );
}

// Ohne /w fehlt der Uhrversatz. Der Endpunkt verwirft ein zu JUNGES t still (zu_schnell), ein älteres bis 24 h nie:
// im Rückfall steht t deshalb eine Stunde früher, so trägt auch eine bis zu 60 min vorgehende Besucheruhr.
export const RUECKFALL_VERSATZ_MS = -60 * 60 * 1000;

// Satz und Kennung aus dem eingebauten Rückfallstand, nur wenn vollständig (Kennung Pflicht).
export function rueckfallAnzeige(formId) {
  const anzeige = RUECKFALL_ANZEIGE[String(formId)];
  return anzeigeVollstaendig(anzeige) ? anzeige : null;
}

/**
 * Was die Weiche zeigt (rein, ohne Browser; anmelde-weiche-entscheidung.test.mjs).
 *   wege    Antwort von /w oder null (keine Antwort, zu spät, 5xx, kaputtes JSON)
 *   vorschau  localStorage-Vorschau für dieses Formular
 * -> {weg: 'ac'} nur bei ausdrücklichem 'ac';
 *    {weg: 'eigen', anzeige, versatz, rueckfallAc, quelle: 'w'|'rueckfallstand'};
 *    {weg: 'hinweis'} wenn kein Satz mit Kennung da ist.
 */
export function weicheEntscheiden(formId, wege, vorschau = false) {
  const id = String(formId);
  const weg = wege && wege.formulare ? wege.formulare[id] : undefined;
  const anzeige = wege && wege.anzeige ? wege.anzeige[id] : null;
  if (weg === 'ac' && !vorschau) return {weg: 'ac'};
  if ((weg === 'eigen' || vorschau) && anzeigeVollstaendig(anzeige)) {
    return {
      weg: 'eigen',
      anzeige,
      versatz: wege.versatz || 0,
      // Nur ein ausdrückliches true öffnet den AC-Rückfall nach gescheitertem Absenden; fehlt das Feld, bleibt er zu.
      rueckfallAc: wege.rueckfall_ac === true,
      quelle: 'w',
    };
  }
  // Ein ausdrücklich abgeschaltetes Formular (z. B. 'aus') bekommt kein Formular aus dem Rückfallstand.
  if (weg !== undefined && weg !== 'eigen' && !vorschau)
    return {weg: 'hinweis'};
  const ersatz = rueckfallAnzeige(id);
  if (ersatz) {
    return {
      weg: 'eigen',
      anzeige: ersatz,
      versatz: wege ? wege.versatz || 0 : RUECKFALL_VERSATZ_MS,
      rueckfallAc: false,
      quelle: 'rueckfallstand',
    };
  }
  return {weg: 'hinweis'};
}
