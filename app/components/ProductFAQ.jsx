import {useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
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
 * @param {{ items: Array<{q: string, a: string, flag?: string}> }} props
 */
export function ProductFAQ({items}) {
  const [sectionOpen, setSectionOpen] = useState(true);

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

      <div
        className="ProductFAQ__header"
        onClick={() => setSectionOpen((o) => !o)}
      >
        <h2 style={{marginBottom: 0}}>Häufig gestellte Fragen (FAQ)</h2>
        {sectionOpen ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
      </div>

      {sectionOpen && <FaqListe items={items} />}
    </div>
  );
}
