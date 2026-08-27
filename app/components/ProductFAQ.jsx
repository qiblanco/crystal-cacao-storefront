import {useId, useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {faqPageJsonLdString} from '~/lib/faq-schema';

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
  const [openIndex, setOpenIndex] = useState(null);
  const baseId = useId();

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

      {sectionOpen && (
        <div className="ProductFAQ__list">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            const answerId = `${baseId}-faq-answer-${i}`;
            return (
              <div key={i} className="ProductFAQ__item">
                <button
                  className="ProductFAQ__question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {/* Antwort IMMER im DOM (SSR/crawlbar); nur visuell per hidden geklappt. */}
                <div
                  id={answerId}
                  className="ProductFAQ__answer"
                  role="region"
                  hidden={!isOpen}
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
