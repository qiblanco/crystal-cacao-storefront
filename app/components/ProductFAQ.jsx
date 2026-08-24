import {useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';

/**
 * FAQ accordion component for product pages.
 * @param {{ items: Array<{q: string, a: string}> }} props
 */
export function ProductFAQ({items}) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="ProductFAQ NormalSectionSize" style={{maxWidth: '860px', padding: '3rem 1.5rem 5rem'}}>
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
            return (
              <div key={i} className="ProductFAQ__item">
                <button
                  className="ProductFAQ__question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
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
                {isOpen && (
                  <div className="ProductFAQ__answer">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
