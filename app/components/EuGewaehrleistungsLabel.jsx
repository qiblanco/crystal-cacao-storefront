import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import {useRouteLoaderData} from 'react-router';
import {bildQuellen} from '~/components/reusables/shopifyBildQuellen';
import {
  labelFuerSprache,
  AUSLOESER_TEXT_FOOTER,
  AUSLOESER_TEXT_PDP,
  AUSLOESER_ZEICHEN,
  LABEL_ALT_DE,
  RECHTE_LINK_TEXT,
} from '~/lib/eu-gewaehrleistungslabel';

/**
 * Harmonisierte Mitteilung über das gesetzliche Gewaehrleistungsrecht
 * (Anhang I der Durchfuehrungsverordnung (EU) 2025/1960, Pflicht ab
 * 27.09.2026).
 *
 * Diese Datei enthält VIER Bausteine und EIN Overlay:
 *   <EuLabelProvider>              -- hält genau EINEN <dialog> je Seite
 *   <EuGewaehrleistungsHinweis>    -- Produktseite: Zeichen + Text-Link,
 *                                     als eigener Block (Kauf-Knopf, Korb)
 *   <EuGewaehrleistungsListenpunkt>-- Produktseite: derselbe Inhalt als
 *                                     <li> INNERHALB der Nutzen-Liste
 *                                     (Elina EL-20260909-395f848c, seit
 *                                     EL-20260909-8c4001d1 auf JEDER
 *                                     Kaufflaeche mit eigener Nutzen-Liste)
 *   <EuGewaehrleistungsLink>       -- Footer: NUR der Text-Link
 *
 * Die beiden Produktseiten-Bauformen unterscheiden sich NUR in ihrer
 * Hülle. Text, Zeichen, Messmarke und Overlay sind dieselben -- wer
 * am Inhalt etwas aendert, aendert ihn für beide.
 *
 * Beide Ausloeser öffnen dasselbe Overlay. DIE AMTLICHE GRAFIK ERSCHEINT
 * NUR DORT -- nirgends offen im Seitenfluss.
 *
 * SEIT DEM 2026-09-08 STEHT AUF DER PRODUKTSEITE EIN BILD IM SEITENFLUSS
 * (Elina EL-20260908-d8349a01), und der Satz darueber gilt trotzdem
 * unveraendert. Das Zeichen ist ein Schild mit EU-Sternenkranz und weissem
 * G -- Schmuck neben dem Link, ohne QR-Code, ohne Verordnungstext, ohne
 * eine einzige Zusage. Die Unterscheidung "Zeichen ja, amtliche Grafik
 * nein" ist der Kern des Zuschnitts und wird im Test an der QUELLE gemessen
 * (AUSLOESER_ZEICHEN vs. LABEL_ASSETS), nicht an der Zahl der <img>: eine
 * blosse Zaehlung haette einen Tausch der beiden Quellen nie bemerkt.
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
 * Der gemeinsame Ausloeser.
 *
 * BIS ZUM 2026-09-08 trugen Produktseite und Footer denselben Text und
 * unterschieden sich nur in der Messmarke (Elina EL-20260906-0380455b: der
 * Zusatz "amtliche Mitteilung ansehen" auf der Produktseite war gestrichen).
 * SEITDEM gehen sie wieder auseinander (Elina EL-20260908-d8349a01): die
 * Produktseite bekommt ein Zeichen davor und den laengeren Text, der Footer
 * bleibt ausdrücklich unveraendert.
 *
 * DIE PFLICHT BERUEHRT DAS NICHT -- in keine der beiden Richtungen. Verlangt
 * ist ein SATZ, der über das Gewaehrleistungsrecht informiert ("Your legal
 * guarantee rights", Leitlinien Abschnitt 2.3, Zitat im Kopf dieser Datei),
 * und die Mitteilung auf den ersten Klick. Beides bleibt.
 *
 * DAS ZEICHEN IST EIN OPTIONALER SLOT, KEIN FLAECHEN-IF: `flaeche` ist die
 * Messmarke fuers Live-HTML, nicht die Gestaltungsregel. Wer die beiden
 * koppelt, kann eine Flaeche nicht mehr umgestalten, ohne die Messmarke
 * anzufassen -- und die Live-Probe misst genau sie.
 *
 * DAS ZEICHEN IST NICHT KLICKBAR, und das ist bestellt so: "Klick auf den
 * Text öffnet weiterhin dasselbe Overlay wie bisher". Es liegt deshalb
 * AUSSERHALB des <button> und ist für Screenreader unsichtbar (alt="",
 * aria-hidden) -- der Knopf daneben sagt bereits, was es zeigt.
 */
function EuLabelAusloeser({
  flaeche,
  beschriftung,
  zeichen = null,
  eigeneZeile = true,
}) {
  const kontext = useEuLabel();
  if (!kontext) return null;

  const knopf = (
    <button
      type="button"
      className="eu-gwl__link"
      data-eu-gewaehrleistungslabel={flaeche}
      onClick={kontext.open}
    >
      {beschriftung}
    </button>
  );

  if (!zeichen) return knopf;

  // Über die Hausleiter, nicht als nackte CDN-URL: ohne `width=` liefert
  // das Shopify-CDN die Masterdatei und verhandelt das Format nicht
  // (Messbefund in shopifyBildQuellen.js). Der Riegel LABEL_MINDESTBREITE_PX
  // gilt hier ausdrücklich NICHT -- er schuetzt den QR-Code der amtlichen
  // Grafik, und den trägt dieses Zeichen nicht.
  const quellen = bildQuellen(zeichen.url, {
    anzeigeBreite: zeichen.anzeigeBreite,
    masterBreite: zeichen.breite,
  });

  const bild = (
    <img
      className="eu-gwl__zeichen"
      src={quellen.src}
      srcSet={quellen.srcSet}
      sizes={quellen.sizes}
      alt=""
      aria-hidden="true"
      width={zeichen.breite}
      height={zeichen.hoehe}
      loading="lazy"
      decoding="async"
    />
  );

  /*
   * `eigeneZeile={false}` gibt Zeichen und Knopf NACKT zurück, ohne den
   * Flex-Kasten. Das ist kein Gestaltungsgeschmack, sondern die Bedingung
   * dafür, dass der Ausloeser in einer fremden Zeile mitlaufen kann: als
   * fuenfter <li> der Nutzen-Liste MUSS er im normalen Inline-Fluss stehen,
   * sonst richtet `align-items: center` das Zeichen anders aus als die vier
   * Geschwister-Icons darueber (die hängen an der Schriftlinie) -- und
   * genau der halbe Pixel Versatz ist es, den man als "gehört nicht dazu"
   * sieht, ohne ihn benennen zu können.
   */
  if (!eigeneZeile) {
    return (
      <>
        {bild}
        {knopf}
      </>
    );
  }

  return (
    <span className="eu-gwl__zeile">
      {bild}
      {knopf}
    </span>
  );
}

/**
 * PRODUKTSEITE. Zeichen + Text-Link -- die AMTLICHE Grafik steht weiterhin
 * nicht offen im Seitenfluss. Die Mitteilung erscheint auf den ersten Klick
 * im Overlay (Leitlinien der Kommission, Abschnitt 2.3; siehe Kopf dieser
 * Datei).
 *
 * WO DIESER BAUSTEIN AUF DER SEITE HÄNGT, ENTSCHEIDET DER AUFRUFER -- und
 * seit dem 2026-09-08 nicht mehr ueberall gleich.
 *
 * DIE TRENNLINIE IST SEIT ELINA EL-20260909-8c4001d1 EINE EINZIGE FRAGE:
 * hat die Kaufflaeche eine eigene Nutzen-Liste (<ul> neben dem Kauf-Knopf)?
 *   ja   -> sie montiert <EuGewaehrleistungsListenpunkt> IN diese Liste und
 *           schaltet den Default in ProductForm/CacaoProductForm ab.
 *   nein -> sie lässt den Default stehen; dieser Baustein hier hängt dann
 *           wie bisher unmittelbar unter dem Kauf-Knopf.
 * Das ist bewusst KEINE Seitenliste: eine Aufzaehlung wäre ab der nächsten
 * neuen Kaufflaeche unvollstaendig, ohne dass es jemandem auffaellt. Die
 * Regel steht als Waechter im Test (test/eu-gewaehrleistung.test.mjs), der
 * die Flaechen SUCHT statt sie zu kennen.
 *
 * Der Baustein weiss von alldem nichts und soll es nicht wissen: die Naht
 * gegen doppelte Montage sitzt in ProductForm/CacaoProductForm (Prop
 * `gewaehrleistungsHinweis`), nicht hier.
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
        beschriftung={AUSLOESER_TEXT_PDP}
        zeichen={AUSLOESER_ZEICHEN}
      />
    </section>
  );
}

/**
 * PRODUKTSEITE, ZWEITE BAUFORM: derselbe Hinweis als LISTENPUNKT.
 *
 * Elina EL-20260909-395f848c: auf /products/qione-2-pro soll der Hinweis
 * "optisch wie ein weiterer, fuenfter Punkt der bestehenden Icon-Liste
 * wirken, nicht wie ein separater Block darunter". EL-20260909-8c4001d1 hat
 * denselben Zuschnitt auf JEDE Kaufflaeche mit eigener Nutzen-Liste gezogen
 * -- der Baustein bleibt dabei unveraendert, genau weil er nichts über die
 * Liste voraussetzt, in der er hängt (4., 5. oder 6. Punkt, <svg>-Spalte
 * oder Emoji-Zeilen: die Masse kommen alle aus der Liste).
 *
 * WARUM DAS EINE EIGENE BAUFORM IST UND KEINE CSS-ZEILE
 * Die drei bestellten Angleichungen (Zeilenabstand, Icon-Groesse, Schrift)
 * sind alle drei Werte, die die Nutzen-Liste bereits FÜHRT -- als <li> in
 * ihrem eigenen <ul>. Der <section>-Bau von gestern kann sie nur NACHBAUEN:
 *   - `section { padding: 1rem 0 }` (reset.css) plus `.eu-gwl--pdp
 *     { margin: 1rem 0 0 }` sind zusammen der zu große Abstand oben. Ein
 *     <li> erbt stattdessen `li { margin-bottom: 0.5rem }` -- denselben
 *     Wert wie die vier Geschwister.
 *   - `p, li { font-size: 1.2rem; line-height: 1.4; color: … }` greift auf
 *     einer <section> gar nicht. Der Knopf steht deshalb heute in der
 *     Grundschrift des <body>, nicht in der Listenschrift.
 * Nachgebaute Werte laufen beim nächsten Anfassen der Liste auseinander,
 * und zwar STILL: die Seite sieht weiter vollstaendig aus. Geerbte nicht.
 *
 * DIE <li> LIEGT AUSSERHALB DES PROVIDERS, und das ist der Kern:
 * EuLabelProvider rendert {children} UND den <dialog> als Geschwister. Stuende
 * die <li> innen, wäre der <dialog> ein direktes Kind des <ul> -- ungueltiges
 * HTML. Der Browser-Parser hebt ihn dann beim Einlesen aus der Liste heraus,
 * der Serverbau hat ihn drin, und React findet beim Hydrieren einen anderen
 * Baum vor als es geschrieben hat. Solche Naehte fallen nicht im Build auf,
 * sondern beim Kunden.
 *
 * Die Sprachmarke wird hier ein zweites Mal aufgeloest (der Provider tut es
 * für das Overlay). Auseinanderlaufen können die beiden nicht:
 * labelFuerSprache ist eine reine Funktion auf demselben Loader-Wert.
 */
export function EuGewaehrleistungsListenpunkt() {
  const label = useEuLabelAsset();

  return (
    <li className="eu-gwl eu-gwl--listenpunkt" data-eu-label-iso={label.iso}>
      <EuLabelProvider>
        <EuLabelListenpunktFlaeche />
      </EuLabelProvider>
    </li>
  );
}

/**
 * Der Inhalt des Listenpunkts. Kein eigenes Huellelement mehr -- die <li>
 * oben IST die Zeile, und `eigeneZeile={false}` hält Zeichen und Knopf im
 * normalen Inline-Fluss, genau wie <svg> + Text in den vier Punkten darueber.
 *
 * Die MESSMARKE bleibt `pdp`. Sie benennt die FLAECHE (Kaufseite), nicht die
 * Bauform -- probe_eulabel_live_kaufseite.py misst an ihr, dass der Kunde die
 * Pflichtmitteilung sieht. Eine dritte Marke hier haette diese Probe still
 * blind gemacht, obwohl sich nur die Gestaltung geaendert hat.
 */
function EuLabelListenpunktFlaeche() {
  const kontext = useEuLabel();
  if (!kontext) return null;

  return (
    <EuLabelAusloeser
      flaeche="pdp"
      beschriftung={AUSLOESER_TEXT_PDP}
      zeichen={AUSLOESER_ZEICHEN}
      eigeneZeile={false}
    />
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
        beschriftung={AUSLOESER_TEXT_FOOTER}
      />
    </EuLabelProvider>
  );
}
