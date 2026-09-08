import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import {useRouteLoaderData} from 'react-router';
import {
  labelFuerSprache,
  LABEL_ALT_DE,
  RECHTE_LINK_TEXT,
} from '~/lib/eu-gewaehrleistungslabel';

/**
 * Harmonisierte Mitteilung über das gesetzliche Gewaehrleistungsrecht
 * (Anhang I der Durchfuehrungsverordnung (EU) 2025/1960, Pflicht ab
 * 27.09.2026).
 *
 * Diese Datei enthält DREI Bausteine und EIN Overlay:
 *   <EuLabelProvider>            -- hält genau EINEN <dialog> je Seite
 *   <EuGewaehrleistungsHinweis>  -- Produktseite: NUR der Text-Link
 *   <EuGewaehrleistungsLink>     -- Footer: NUR der Text-Link
 *
 * Beide Ausloeser öffnen dasselbe Overlay. Die amtliche Grafik erscheint
 * NUR dort -- nirgends offen im Seitenfluss.
 *
 * ====================================================================
 * WARUM DIE GRAFIK HINTER DEM KLICK LIEGT -- und nicht offen auf der Seite
 * ====================================================================
 * Eine fruehere Fassung dieses Bausteins zeigte die Grafik auf der
 * Produktseite OFFEN und benutzte das Overlay nur als Lupe. Begründet war
 * das mit Erwaegungsgrund 14 der VO (EU) 2025/1960, der das verschachtelte
 * Format woertlich nur "der Kennzeichnung" (dem GARAN-Label des Anhangs II)
 * erlaubt und für die Mitteilung (Anhang I) schweigt.
 *
 * Dieser Schluss war zu eng. Die Kommission selbst beschreibt für die
 * MITTEILUNG genau den Klick-Weg. In den "Practical guidelines for sellers
 * and producers" (GD Justiz und Verbraucher, April 2026), Abschnitt 2.3
 * "Digital display", steht woertlich:
 *
 *   "On the product catalogue page, add a sentence informing consumers about
 *    their legal guarantee rights (e.g. 'Your legal guarantee rights'), where
 *    the harmonised notice shall then appear on the first mouse click or
 *    mouse roll-over."
 *
 * Derselbe Satz steht dort noch zweimal -- für den Website-Header und für
 * die Checkout-Seite. Der sichtbare SATZ ist die Pflicht, die Grafik
 * erscheint auf den ersten Klick. Genau das ist hier gebaut.
 *
 * Einordnung, damit niemand die Quelle ueberschaetzt: die Leitlinien sind
 * KEINE Rechtsquelle. Sie tragen den Disclaimer "preliminary views of the
 * European Commission (EC) services". Der Verordnungstext selbst regelt das
 * verschachtelte Format weiterhin nur für die Kennzeichnung. Wer diesen Bau
 * uebernimmt, folgt dem Verstaendnis der Kommissionsdienststelle -- ein
 * Restrisiko abweichender nationaler Auslegung bleibt und gehört vor dem
 * Livegang auf einen juristischen Tisch, nicht auf diesen.
 *
 * ====================================================================
 * WAS DAS FÜR DEN QR-CODE BEDEUTET
 * ====================================================================
 * Weil die Grafik jetzt NUR im Overlay steht, muss das Overlay allein die
 * Lesbarkeit des QR-Codes tragen. Anhang I Nr. 3 verlangt, dass er mit einem
 * mobilen Standardgeraet ablesbar ist; die Leitlinien nennen als Untergrenze
 * 2 x 2 cm (Abschnitt 3.1.2 -- dort für das GARAN-Label geschrieben, hier
 * bewusst auf die Mitteilung uebertragen, weil es für deren QR-Code keine
 * eigene Zahl gibt).
 *
 * Gemessen an 20 der 24 Sprachfassungen belegt der QR-Code 18,2-20,2 % der
 * Bildbreite. Die vier fehlenden (et, fi, sl, sv) sind in der Quelldatei so
 * beschaedigt, dass sich der QR-Code darin nicht einmal lokalisieren lässt
 * (siehe QR_DEFEKT). Werden sie neu hochgeladen, ist dieser Anteil
 * nachzumessen -- faellt er unter 18,24 %, trägt die Mindestbreite unten
 * nicht mehr. Die CSS setzt darum eine MINDESTBREITE für die Grafik im
 * Overlay, statt sie nur "auf volle Breite" zu ziehen: bei schmalen
 * Viewports schiebt die Buehne waagerecht, statt den QR-Code unter die
 * Lesbarkeitsgrenze zu schrumpfen. Die Rechnung steht in der CSS und wird
 * vom Test nachgerechnet -- nicht hier dupliziert.
 *
 * ====================================================================
 * WARUM NATIVES <dialog> UND KEIN NACHGEBAUTES OVERLAY
 * ====================================================================
 * `showModal()` bringt Fokusfalle, Esc-Schließen und -- der eigentliche
 * Punkt -- die FOKUS-RÜCKGABE an das ausloesende Element von sich aus mit.
 * Ein handgebauter Nachbau müsste all das selbst halten und verliert die
 * Rückgabe erfahrungsgemaess als Erstes. Der Auftrag verlangt sie
 * ausdrücklich.
 */

const EuLabelKontext = createContext(null);

/**
 * Hält genau EINEN <dialog> für die ganze Seite. Gehört in root.jsx um
 * <PageLayout> -- dann teilen Produktseite und Footer dasselbe Overlay,
 * statt jeweils ein eigenes mitzubringen.
 *
 * DAS GILT SEIT DEM 2026-09-06 NICHT MEHR, und zwar auf Anweisung:
 * Elina EL-20260901-3fb38a2a verbietet die Montage im globalen
 * Seitengeruest und in der Footer-Komponente ausdrücklich -- die
 * Mitteilung gehört ausschließlich dorthin, wo ein Produkt gekauft
 * werden kann. Der Provider wird deshalb NICHT MEHR VON AUSSEN montiert;
 * die beiden öffentlichen Bausteine (EuGewaehrleistungsHinweis,
 * EuGewaehrleistungsLink) bringen ihn selbst mit.
 *
 * WARUM AM BAUSTEIN UND NICHT JE ROUTE: der Hinweis sitzt bewusst in
 * ProductForm/CacaoProductForm/TenYearsDealPage und nicht in den einzelnen
 * Seiten-Komponenten, weil die meisten Kaufflaechen über veroeffentlichte
 * Shopify-Produkte OHNE eigene Route-Datei laufen (Catch-all
 * products.$handle) -- die Begründung steht woertlich an der Naht in
 * ProductForm.jsx. Eine Bindung je Route würde genau die stillschweigend
 * auslassen und müsste von Hand nachgepflegt werden. Am Baustein montiert
 * ist die Kopplung strukturell: wo die Mitteilung steht, steht auch ihr
 * Overlay.
 *
 * PREIS DIESER BAUFORM, offen benannt: eine Seite mit ZWEI Kaufflaechen
 * bekommt ZWEI Overlays statt einem (gemessen: app/routes/
 * products.zeremonie-kakao.jsx rendert <ProductForm> zweimal als
 * Geschwister). Das ist bewusst in Kauf genommen und nicht kaputt: jeder
 * Ausloeser öffnet über seinen eigenen Kontext seinen eigenen Dialog,
 * <dialog>.showModal() hebt ihn in den Top-Layer, und beide tragen
 * denselben Inhalt. Eine Verschachtelungs-Sperre würde hier nichts
 * helfen -- Geschwister sehen einander baulich nicht.
 */
export function EuLabelProvider({children}) {
  const dialogRef = useRef(null);
  const label = useEuLabelAsset();

  const open = useCallback(() => {
    // showModal() wirft, wenn der Dialog bereits offen ist (z.B. Doppelklick
    // oder zweiter Ausloeser). Ohne den Schutz reißt das die Seite ab.
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  const close = useCallback(() => {
    const d = dialogRef.current;
    if (d?.open) d.close();
  }, []);

  const wert = useMemo(() => ({open, close, label}), [open, close, label]);

  return (
    <EuLabelKontext.Provider value={wert}>
      {children}
      <EuLabelDialog ref={dialogRef} label={label} onClose={close} />
    </EuLabelKontext.Provider>
  );
}

function useEuLabel() {
  return useContext(EuLabelKontext);
}

/**
 * Sprachaufloesung aus der Hydrogen-eigenen i18n (NICHT aus Liquid).
 *
 * MESSBEFUND 2026-08-25, der hier offen stehen bleiben muss:
 * `app/lib/context.js` setzt `i18n: {language: 'DE', country}` -- die Sprache
 * ist im DACH-Storefront fest verdrahtet, nur das LAND variiert
 * (DE/AT/CH/US/GB, alle drei EU-Maerkte deutschsprachig). Es gibt keine
 * Sprach-Routen (`($locale)`) und keinen Sprachumschalter.
 *
 * Diese Funktion loest deshalb HEUTE immer 'de' auf. Sie ist trotzdem so
 * gebaut, wie der Auftrag es verlangt -- an der echten i18n-Quelle, mit
 * Rueckfall Englisch --, damit der Tag, an dem eine zweite Sprache
 * dazukommt, hier nichts mehr zu tun ist.
 *
 * Was sie NICHT tut: eine Sprachautomatik VORTAEUSCHEN. Wer den Zustand
 * nachmisst, findet ihn im Markup (`data-eu-label-iso`) und in der Probe.
 */
function useEuLabelAsset() {
  const root = useRouteLoaderData('root');
  const sprache = root?.storefrontSprache ?? root?.consent?.language ?? 'de';
  return useMemo(() => labelFuerSprache(sprache), [sprache]);
}

// forwardRef ist hier PFLICHT, nicht Stil: das Repo faehrt React 18.3
// (package.json). Die React-19-Schreibweise "ref als normales Prop" wäre
// hier still `undefined` -- showModal() liefe nie, das Overlay bliebe tot,
// und der Fehler zeigte sich erst im Browser.
const EuLabelDialog = forwardRef(function EuLabelDialog({label, onClose}, ref) {
  // Klick auf den dunklen Rand schließt. Der <dialog> selbst IST der
  // zentrierte Kasten (der Rand ist ::backdrop), deshalb lässt sich der Rand
  // nicht direkt beklicken -- die Trefferpruefung läuft über die Geometrie
  // des Kastens. Ein naives onClick am <dialog> würde auch bei einem Klick
  // auf das Bild schließen.
  const aufRandKlick = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return;
      const k = e.currentTarget.getBoundingClientRect();
      const drin =
        e.clientX >= k.left && e.clientX <= k.right &&
        e.clientY >= k.top && e.clientY <= k.bottom;
      if (!drin) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={ref}
      className="eu-gwl-dialog"
      aria-label="Gesetzliches Gewährleistungsrecht"
      onClick={aufRandKlick}
      onCancel={onClose}
    >
      <div className="eu-gwl-dialog__kasten">
        <button
          type="button"
          className="eu-gwl-dialog__zu"
          onClick={onClose}
          aria-label="Schließen"
        >
          &times;
        </button>

        {/*
          Die Buehne ist der einzige waagerecht scrollende Bereich. Sie liegt
          bewusst INNERHALB des Kastens und nicht am <dialog>: so bleibt der
          Schließen-Knopf stehen, wenn bei schmalem Viewport seitlich
          geschoben wird.
        */}
        <div className="eu-gwl-dialog__buehne">
          <img
            className="eu-gwl-dialog__bild"
            src={label.url}
            alt={LABEL_ALT_DE}
            width={label.breite}
            height={label.hoehe}
            data-eu-label-iso={label.iso}
          />
        </div>

        <p className="eu-gwl-dialog__fuss">
          <a
            className="eu-gwl__link"
            href={label.rechteLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {RECHTE_LINK_TEXT}
          </a>
        </p>
      </div>
    </dialog>
  );
});

/**
 * Der gemeinsame Ausloeser. Produktseite und Footer unterscheiden sich seit
 * dem 2026-09-06 nur noch in der Messmarke -- die Beschriftung ist auf
 * beiden Flächen dieselbe (Elina EL-20260906-0380455b: der Zusatz
 * "amtliche Mitteilung ansehen" auf der Produktseite wurde gestrichen).
 * Die Kürzung berührt die Pflicht nicht: verlangt ist ein SATZ, der über
 * das Gewährleistungsrecht informiert ("Your legal guarantee rights",
 * Leitlinien Abschnitt 2.3, Zitat im Kopf dieser Datei) -- nicht die
 * Ankündigung des Klick-Ziels. Der Footer trug den kurzen Text von Anfang an.
 */
function EuLabelAusloeser({flaeche, beschriftung}) {
  const kontext = useEuLabel();
  if (!kontext) return null;

  return (
    <button
      type="button"
      className="eu-gwl__link"
      data-eu-gewaehrleistungslabel={flaeche}
      onClick={kontext.open}
    >
      {beschriftung}
    </button>
  );
}

/**
 * PRODUKTSEITE. NUR der Text-Link -- keine offen sichtbare Grafik im
 * Seitenfluss. Die Mitteilung erscheint auf den ersten Klick im Overlay
 * (Leitlinien der Kommission, Abschnitt 2.3; siehe Kopf dieser Datei).
 */
export function EuGewaehrleistungsHinweis() {
  return (
    <EuLabelProvider>
      <EuLabelHinweisFlaeche />
    </EuLabelProvider>
  );
}

/**
 * Die eigentliche Flaeche. Sie liegt IMMER unter dem Provider oben -- der
 * `null`-Zweig ist damit baulich unerreichbar und bleibt nur als Riegel
 * stehen. Genau dieser Zweig war die Gefahr an der Vorgaenger-Bauform: ohne
 * Kontext rendert die Pflichtmitteilung STILL nichts, die Seite antwortet
 * weiter HTTP 200 und sieht vollstaendig aus. Erreichbarkeit ist nicht
 * Inhalt; deshalb wird der Kontext jetzt mitgeliefert statt vorausgesetzt.
 */
function EuLabelHinweisFlaeche() {
  const kontext = useEuLabel();
  if (!kontext) return null;

  return (
    <section
      className="eu-gwl eu-gwl--pdp"
      data-eu-label-iso={kontext.label.iso}
      aria-label="Gesetzliches Gewährleistungsrecht"
    >
      <EuLabelAusloeser
        flaeche="pdp"
        beschriftung="Gesetzliche Gewährleistung"
      />
    </section>
  );
}

/**
 * FOOTER. Punkt 4 unter "3. Bezahlmethoden" -- reiner Textlink.
 *
 * DERZEIT NIRGENDS MONTIERT: Elina EL-20260901-3fb38a2a stellt den
 * Footer-Teil ausdrücklich zurück ("jetzt bewusst weglassen und für
 * spaeter zurueckstellen"). Der Baustein bleibt deshalb erhalten -- er ist
 * zurueckgestellt, nicht entfernt.
 *
 * GEAENDERT gegenueber der Vorfassung, und das ist kein Schoenheitsfehler:
 * früher stand hier "gleiches Overlay, kein zweiter Dialog", weil ein
 * globaler Provider im Seitengeruest hing. Den gibt es nicht mehr. Ohne
 * eigenen Provider würde `useEuLabel()` hier `null` liefern und der
 * Ausloeser beim ersten Rendern an `kontext.open` WERFEN -- ein Fehler, der
 * erst auftritt, wenn jemand den Baustein spaeter wieder einhaengt, also
 * genau dann, wenn niemand mehr mit ihm rechnet. Der Provider steht deshalb
 * hier drin.
 */
export function EuGewaehrleistungsLink() {
  return (
    <EuLabelProvider>
      <EuLabelAusloeser
        flaeche="footer"
        beschriftung="Gesetzliche Gewährleistung"
      />
    </EuLabelProvider>
  );
}
