/**
 * Ladeanzeige an der Stelle eines Betrags, solange eine Warenkorb-Aktion
 * laeuft (Regel und Messung in ~/lib/warenkorb-anzeige.js). Sie ersetzt die
 * Zahl, nie umgekehrt: ein Platzhalter-Betrag wie „0,00 €" sieht aus wie ein
 * Preis, drei ruhige Punkte nicht. Der Name fuer Screenreader sagt, was
 * passiert; die Punkte selbst sind Dekoration.
 * @param {{className?: string}}
 */
export function BetragLaedt({className}) {
  return (
    <span
      className={`cc-betrag-laedt${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Preis wird berechnet</span>
      <span className="cc-betrag-laedt-punkte" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
