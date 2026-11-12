import {vorteilText, vorteilVorlesen} from '~/components/reusables/preis-schild-regel';

/**
 * PREIS-SCHILDCHEN, Variante B "Juwelier-Etikett" (Christian 12.11.2026).
 * Stil: app/styles/preis-schild.css. Regel: app/components/reusables/preis-schild-regel.js.
 *
 *   <PreisSchild art="auszeichnung">Bestseller</PreisSchild>
 *   <PreisSchild art="vorteil">−200 €</PreisSchild>
 *   <PreisSchilder preis={159} vergleich={228} waehrung="EUR" auszeichnung="Bestseller" />
 *
 * Kein Link, kein Knopf, kein Hover. Reihenfolge am Preis: Preis, Vergleichspreis,
 * Preisvorteil, Auszeichnung. Hoechstens eins je Art.
 */
export function PreisSchild({art = 'auszeichnung', children, vorlesen}) {
  if (!children) return null;
  const vorteil = art === 'vorteil';
  return (
    <span
      className={`qb-schild${vorteil ? ' qb-schild--vorteil' : ''}`}
      data-schild={vorteil ? 'vorteil' : 'auszeichnung'}
      aria-label={vorlesen || undefined}
    >
      {children}
    </span>
  );
}

export function PreisSchilder({preis, vergleich, waehrung = 'EUR', auszeichnung = null}) {
  const vorteil = vorteilText(preis, vergleich, waehrung);
  if (!vorteil && !auszeichnung) return null;
  return (
    <span className="qb-schilder">
      {vorteil ? (
        <PreisSchild art="vorteil" vorlesen={vorteilVorlesen(vorteil)}>
          {vorteil}
        </PreisSchild>
      ) : null}
      {auszeichnung ? <PreisSchild art="auszeichnung">{auszeichnung}</PreisSchild> : null}
    </span>
  );
}
