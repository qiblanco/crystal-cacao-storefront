import {useState} from 'react';
import {hinweisHtml} from '~/lib/einwilligung-texte';

/**
 * Der eigene Einwilligungshinweis (BAUVERTRAG Abschnitt 4), erstes Kind von <body>.
 *
 * Christian 22.10. (Z4): die Seite lädt und ist voll benutzbar, BEVOR der
 * Besucher wählt. Deshalb eine Leiste unten ohne Overlay, ohne Scroll-Sperre,
 * ohne Ausgrauen. Erstes body-Kind, damit die Tastatur ihn zuerst erreicht.
 *
 * Inhalt per dangerouslySetInnerHTML: React gleicht ihn nie ab, das Skript
 * /qb-einwilligung.js darf ihn bedienen (hidden setzen, Schalter umlegen),
 * ohne einen Hydrationsfehler auszulösen. Die Hülle trägt keinen Zustand.
 *
 * Gerendert nur im Motor 'eigen' (app/lib/einwilligung-schalter.js).
 *
 * Der HTML-Text wird EINMAL beim ersten Rendern festgelegt: der Root-Loader
 * läuft nach jedem Warenkorb-POST neu, `entschieden` kippt dann, und ein neuer
 * String liesse React Banner und Dialog ersetzen (Befund K3-Gegenprüfung s02:
 * danach war der Widerruf tot). Den Zustand gleicht das Skript selbst ab.
 */
export function Einwilligungshinweis({sprache = 'de', entschieden = false}) {
  const [html] = useState(() => hinweisHtml(sprache, {entschieden}));
  return (
    <div
      className="qb-einwilligung-wurzel"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
