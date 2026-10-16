import {faqPageJsonLdString} from '~/lib/faq-schema';
import {FaqListe} from './reusables/FaqListe';

/**
 * FAQ accordion component for product pages.
 *
 * Crawlbarkeit (FJ2, GEO/AEO): Die Antworten stehen JETZT server-seitig im
 * initialen HTML — sie werden IMMER gerendert und per `hidden`-Attribut nur
 * visuell ein-/ausgeklappt (WAI-ARIA-Accordion-Muster) statt bedingt gemountet.
 * Zusaetzlich wird ein FAQPage-JSON-LD emittiert, ABER NUR für faktisch saubere
 * Q&A-Items (faqPageJsonLdString filtert geflaggte + eso-/wirkmechanismus-
 * behaftete Items heraus — Content-Bereinigung = Christian-Gate).
 *
 * KEIN ABSCHNITTS-UMSCHALTER (seit 16.10.2026, K1 — gilt in qiblanco und
 * crystal): Die Überschrift trug bis dahin einen eigenen 28-px-Pfeil und
 * klappte die ganze Liste ein. Neben den Pfeilen der Fragen sah sie damit aus
 * wie eine weitere Frage (Christian-Beleg 15.10., Sicht-Tor F-017/F-062).
 * Die Überschrift ist jetzt nur Überschrift; klappen lassen sich die Fragen.
 *
 * @param {{ items: Array<{q: string, a: string, flag?: string}> }} props
 */
export function ProductFAQ({items}) {

  // Reine Datenauszeichnung — nur saubere Items (Rest wartet auf Christian-Go).
  const jsonLd = faqPageJsonLdString(items);

  return (
    <div className="ProductFAQ NormalSectionSize" style={{maxWidth: '860px', padding: '3rem 1.5rem 5rem'}}>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: jsonLd}}
        />
      ) : null}

      {/* cursor: die Laden-CSS (app.css / kakao-seiten.css) setzt am Kopf
          noch „pointer" aus der Zeit des Umschalters; ein Zeiger auf nicht
          klickbarem Text verspricht eine Handlung, die es nicht gibt. */}
      <div className="ProductFAQ__header" style={{cursor: 'default'}}>
        <h2 style={{marginBottom: 0}}>Häufig gestellte Fragen (FAQ)</h2>
      </div>

      <FaqListe items={items} />
    </div>
  );
}
