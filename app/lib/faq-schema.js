/**
 * FAQPage / JSON-LD Datenfabrik für die Produkt-FAQ der DACH-Storefront.
 *
 * Herkunft: Folgejob FJ2 aus dem GEO/AEO-Deep-Dive
 * (20260723-ki-sichtbarkeit-geo-aeo-empfehlbarkeit-nicht-eso, Maßnahme A2).
 * Befund dort: ProductFAQ.jsx rendert die Antworten client-seitig (nicht im
 * initialen HTML) UND ohne FAQPage-Schema -> für Crawler/KI doppelt unsichtbar.
 *
 * LEITPLANKE (verbindlich, identisch zu structured-data.js / FJ1):
 * NUR faktisch saubere Q&A werden ins Schema geschrieben. KEINE unfalsifizierbare
 * Aussage, KEIN Eso-Buzzword, KEINE unbelegte Wirkmechanismus-Behauptung, KEINE
 * Schuldumkehr und KEIN faktenwiderspruechlicher Claim (270/170 nm) landen im
 * FAQPage-Schema — sie warten auf Christians freigegebene Umformulierung
 * (Content = Christian-Gate). Der SICHTBARE FAQ-Text bleibt unangetastet; hier
 * wird nur entschieden, was maschinenlesbar ausgezeichnet (= verstaerkt) wird.
 *
 * Reine Datenfabrik: KEIN React-/Remix-Import, damit das Modul ohne Build-
 * Toolchain lesbar und in Node-Unit-Tests direkt aufrufbar ist.
 */

/**
 * Zwei-stufiger Ausschluss (Belt-and-Suspenders):
 *  (1) PRIMAER: ein explizites `flag`-Feld am Q&A-Item (gesetzt in
 *      product-faqs.js, dokumentiert im FLAG-FAQ-CHRISTIAN.md-Report).
 *  (2) SICHERHEITSNETZ: ein Deny-Token-Scan gegen das bekannte Eso-/
 *      Wirkmechanismus-Vokabular — faengt ein versehentlich NICHT geflaggtes
 *      Item ab, bevor eine Wirkaussage in strukturierte Daten leckt.
 * Kein sauberes Bestands-Item enthält eines dieser Tokens (verifiziert im
 * Selftest), d.h. das Netz erzeugt keine False-Positives auf dem Ist-Content.
 */
export const FORBIDDEN_PATTERNS = [
  /selbstvermehr/i, // "selbstvermehrend" — Mechanismus behauptet, nicht gemessen
  /(wirken|wirkt)\s+immer/i, // "wirken IMMER" — unfalsifizierbar
  /\b\d{3}\s?nm\b/i, // "270nm"/"170nm" — Faktenwiderspruch (Warnke 2019)
  /absorbiert\s+verst/i, // "absorbiert verstaerkt Licht" — Messclaim
  /entgift/i, // Detox-Schuldumkehr
  /k(ö|oe)rpersensorik/i, // Schuldumkehr ("Empfinden lag an dir")
  /\bdetox\b/i,
  /koh(ä|ae)rent/i, // "kohärente Wasserstruktur/Domaene/Zustand" — unbelegter Wirkmechanismus
  /statisches?\s+feld/i, // Wirkmechanismus als Faktum
  /energetisch/i, // Eso-Buzzword
];

/**
 * Entfernt etwaige HTML-Tags und normalisiert Whitespace. Die Bestands-Antworten
 * sind reiner Text; die Bereinigung ist rein defensiv (falls kuenftig HTML dazu
 * kommt), damit kein Markup in `acceptedAnswer.text` gelangt.
 * @param {string} s
 * @returns {string}
 */
export function normalizeText(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ist ein Q&A-Item faktisch sauber genug für das publizierte FAQPage-Schema?
 * @param {{q?: string, a?: string, flag?: string}} item
 * @returns {boolean}
 */
export function isSchemaSafe(item) {
  if (!item || typeof item.a !== 'string' || typeof item.q !== 'string') {
    return false;
  }
  if (item.flag) return false; // (1) explizite Flagge
  const hay = `${item.q}\n${item.a}`;
  return !FORBIDDEN_PATTERNS.some((re) => re.test(hay)); // (2) Deny-Netz
}

/**
 * Baut ein valides schema.org-FAQPage-JSON-LD-Objekt — ausschließlich aus den
 * sauberen Items. Gibt `null` zurück, wenn kein sauberes Item uebrig bleibt
 * (dann emittiert die Komponente bewusst KEIN leeres Schema).
 *
 * @param {Array<{q?: string, a?: string, flag?: string}>} items
 * @param {{inLanguage?: string}} [opts]
 * @returns {object|null} JSON-LD FAQPage oder null
 */
export function buildFaqPageJsonLd(items, opts = {}) {
  const safe = (Array.isArray(items) ? items : []).filter(isSchemaSafe);
  if (safe.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: opts.inLanguage || 'de-DE',
    mainEntity: safe.map((it) => ({
      '@type': 'Question',
      name: normalizeText(it.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: normalizeText(it.a),
      },
    })),
  };
}

/**
 * Serialisiert das FAQPage-Schema XSS-sicher für die Einbettung in ein
 * <script type="application/ld+json">-Tag: `<` wird zu `<` maskiert, damit
 * ein etwaiges "</script>" im Text den Tag nicht vorzeitig schließt.
 *
 * @param {Array<{q?: string, a?: string, flag?: string}>} items
 * @param {{inLanguage?: string}} [opts]
 * @returns {string|null} JSON-String oder null (kein sauberes Item)
 */
export function faqPageJsonLdString(items, opts = {}) {
  const obj = buildFaqPageJsonLd(items, opts);
  if (!obj) return null;
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
