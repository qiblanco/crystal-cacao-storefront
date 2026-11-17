// Was die Anmeldeweiche zeigt — reine Entscheidung ohne Browser, damit sie hermetisch prüfbar ist
// (anmelde-weiche-entscheidung.test.mjs). Seit 17.11.2026 (Elina EL-20261117-190e62ed: "ActiveCampaign ist abgeschaltet,
// ALLE Formulare laufen ab sofort NUR noch über den Mail Manager ... kein AC-Rückfall mehr") gibt es keinen AC-Weg mehr:
// auch ein 'ac' aus /w zeigt das eigene Formular (Satz aus /w oder aus dem Rückfallstand); 'aus' zeigt die Hinweiszeile.
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
 * -> nie mehr {weg: 'ac'} (EL-20261117-190e62ed); ein altes 'ac' aus /w gilt wie 'eigen';
 *    {weg: 'eigen', anzeige, versatz, rueckfallAc: false, quelle: 'w'|'rueckfallstand'};
 *    {weg: 'hinweis'} wenn kein Satz mit Kennung da ist.
 */
export function weicheEntscheiden(formId, wege, vorschau = false) {
  const id = String(formId);
  const weg = wege && wege.formulare ? wege.formulare[id] : undefined;
  const anzeige = wege && wege.anzeige ? wege.anzeige[id] : null;
  // Ein altes 'ac' aus /w zählt wie 'eigen': ActiveCampaign ist abgeschaltet, eine Anmeldung dort ginge verloren.
  const eigen = weg === 'eigen' || weg === 'ac';
  if ((eigen || vorschau) && anzeigeVollstaendig(anzeige)) {
    return {
      weg: 'eigen',
      anzeige,
      versatz: wege.versatz || 0,
      // Kein AC-Rückfall mehr nach gescheitertem Absenden, auch nicht bei rueckfall_ac: true (EL-20261117-190e62ed).
      rueckfallAc: false,
      quelle: 'w',
    };
  }
  // Ein ausdrücklich abgeschaltetes Formular (z. B. 'aus') bekommt kein Formular aus dem Rückfallstand.
  if (weg !== undefined && !eigen && !vorschau)
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
