/**
 * Der Hinweis, der erscheint, wenn KEIN Shop angebunden ist.
 *
 * WARUM DIESE DATEI 2026-09-09 ANGEFASST WURDE, obwohl sie nichts rendert:
 * Christian am 2026-09-08 zum Browser-Reiter — "man sieht oben im Browser
 * noch ein Hydrogen-Logo" — und der Auftrag daraus: "Such nach weiteren
 * Resten derselben Herkunft: Titel, Symbole, Platzhaltertexte,
 * Standardbilder." Hier stand der Platzhaltertext des Geruests, woertlich
 * "Welcome to Hydrogen!" samt der Aufforderung, `npx shopify hydrogen link`
 * in einem Terminal auszufuehren.
 *
 * ER IST HEUTE UNERREICHBAR, UND DAS IST GENAU DER GRUND, IHN ZU ERSETZEN
 * STATT IHN STEHENZULASSEN. Der Aufrufer in app/routes/_index.jsx haengt an
 * `isShopLinked`, also an gesetztem PUBLIC_STORE_DOMAIN; am echten Rand
 * gemessen (2026-09-09, https://crystal-cacao.com auf "/" und auf der
 * Kaufseite) kommt der Text 0-mal vor. Ein Text, der nur bei einem
 * Konfigurationsausfall erscheint, wird nie beim Durchsehen gefunden — er
 * erscheint erst dann, wenn ohnehin gerade etwas kaputt ist, und sagt dem
 * Kunden in diesem Moment auf Englisch, er solle ein Terminal oeffnen.
 *
 * BEWUSST NICHT GELOESCHT: die drei Aufrufstellen stehen in _index.jsx, und
 * an dieser Datei arbeiten parallel andere Auftraege. Ein Ausbau waere ein
 * vermeidbarer Zusammenstoss fuer null zusaetzlichen Nutzen — der Hinweis
 * selbst ist richtig, nur seine Herkunft war sichtbar.
 */
export function MockShopNotice() {
  return (
    <section
      className="mock-shop-notice"
      aria-labelledby="mock-shop-notice-heading"
    >
      <div className="inner">
        <h2 id="mock-shop-notice-heading">
          Der Kakao lädt gerade nicht
        </h2>
        <p>
          Unser Sortiment ist im Moment nicht erreichbar. Das liegt an uns,
          nicht an dir — bitte lade die Seite in einem Augenblick neu.
        </p>
        <p>
          Wenn es dann immer noch nicht geht, schreib uns kurz an{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>. Wir
          melden uns.
        </p>
      </div>
    </section>
  );
}
