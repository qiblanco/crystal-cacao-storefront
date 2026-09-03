/**
 * Die FAQ dieser Storefront.
 *
 * HIER STANDEN BIS 2026-09-02 VIER WEITERE KONSTANTEN: FAQ_QIONE_2_PRO,
 * FAQ_QIBRACELET, FAQ_QIHOME_AIR und FAQ_QIONE_KETTE — die Produkt-FAQ der
 * Energieprodukte, mitgewandert beim Übertragen der Seiten aus der
 * Qi-Blanco-Welt. Sie sind entfernt (Job …-prio6-s02).
 *
 * EHRLICH ZUM BEFUND, weil die beiden Fälle nicht dasselbe sind: sie waren
 * TOTER CODE, keine sichtbare Fremdwerbung. Gemessen 2026-09-02 importierte
 * KEINE Datei sie — die einzigen zwei Importeure von `~/data/product-faqs`
 * (Awake.jsx, Create.jsx) holen ausschließlich FAQ_CACAO. Auf keiner
 * gerenderten Seite waren sie je zu sehen. Entfernt sind sie trotzdem: in
 * einem Kakao-Laden hat die FAQ eines Fremdprodukts nichts zu suchen, und
 * toter Code ist genau die Vorlage, aus der beim nächsten Seitenbau
 * versehentlich lebender wird.
 */

export const FAQ_CACAO = [
  {
    q: 'Was ist zeremonieller Kakao?',
    a: 'Zeremonieller Kakao ist eine spezielle Form von Kakao, die absichtsvoll und bewusst zubereitet und konsumiert wird. Im Gegensatz zu gewöhnlichem Kakao wird dieser Kakao unter Einbeziehung ritueller Elemente, Achtsamkeit und Intentionalität zubereitet. Zeremonieller Kakao wird oft in ganzheitlichen Praktiken verwendet und kann eine tiefere Verbindung mit dem Selbst, der Natur oder anderen Menschen fördern. Die Zubereitung und der Konsum werden als eine Art Zeremonie betrachtet, die die psychoaktiven und energetischen Eigenschaften des Kakaos betont.',
    flag: 'eso-buzzword',
  },
  {
    q: 'Was bedeutet psychoaktiv in diesem Zusammenhang?',
    a: 'Psychoaktiver Kakao enthält natürliche Verbindungen wie Theobromin, Koffein, Phenylethylamin und Anandamid. Diese Substanzen können leichte Veränderungen in der Stimmung, Wachsamkeit und Entspannung auslösen. Der Ausdruck "psychoaktiv" wird hier verwendet, um darauf hinzuweisen, dass der Konsum von Kakao das zentrale Nervensystem beeinflussen kann, wodurch positive Veränderungen in Denken, Fühlen und Wahrnehmen auftreten können. Es ist wichtig zu betonen, dass diese Effekte subtil sind und nicht mit starken Rauschzuständen verglichen werden können.',
  },
  {
    q: 'Wie wird zeremonieller Kakao zubereitet?',
    a: 'Die Zubereitung von zeremoniellem Kakao ist unkompliziert und kann nach den ersten Versuchen zu einer natürlichen und sogar freudigen Praxis werden. Eine Kurzanleitung dazu: 1. Erwärmen von etwa 150 ml Wasser oder pflanzlicher Milch (z.B. Hafermilch). 2. Zerkleinern der Kakaomasse. 3. Abmessen von 20 bis 25g für eine Alltagstasse und 30g für eine rituelle Tasse. 4. Auflösen der Kakaomasse in der warmen Flüssigkeit. Rühren kann dabei helfen! 5. Je nach Vorliebe den Kakao mit verschiedenen Gewürzen verfeinern. 6. Zeit nehmen, den Kakao spüren und genießen.',
  },
  {
    q: 'Für wen ist Kakao (un)geeignet?',
    a: 'Kakao enthält Theobromin, ein natürliches Stimulans. Personen, die empfindlich auf Koffein reagieren, wird eine äußerst vorsichtige Dosierung von 5 bis 10 g pro Tasse empfohlen. Bei der Frage nach dem Konsum von reinem Kakao während der Schwangerschaft ist es ratsam, Gesundheitsfachleute zu konsultieren, da Ansichten dazu variieren können. Kinder erleben oft eine positive Reaktion auf Kakao und genießen seine stimmungsaufhellende Wirkung. Hierbei ist eine behutsame Dosierung wichtig, und es ist ratsam, die Konsumzeit in Bezug auf die Schlafenszeiten der Kleinen zu beachten. Für Personen, die Medikamente oder Antidepressiva (SSRIs) einnehmen, ist vor dem Genuss von zeremoniellem Kakao eine Rücksprache mit ihrem behandelnden Arzt äußerst empfehlenswert.',
  },
  {
    q: 'Was ist eine Kakaozeremonie und ist diese nötig?',
    a: 'Die Kakaozeremonie ist eine bewusste und absichtliche Praxis des Genießens von zeremoniellem Kakao an einem Ort der Wohlfühlatmosphäre. Diese einzigartige Art des Konsums verstärkt die tiefe und unterschwellige Wirkung des Kakaos, was sie für den Einnehmenden leichter erfahrbar macht. Obwohl eine Kakaozeremonie keine zwingende Voraussetzung ist, bietet sie Raum für persönliche Entfaltung und Reflektion. Viele Menschen wählen bewusst, sich Zeit für ihren Kakao zu nehmen und ihn auf individuelle Weise zu zelebrieren, oft im Rahmen von Dankbarkeitspraktiken.',
    flag: 'unfalsifizierbar',
  },
  {
    q: 'Wie oft darf man zeremoniellen Kakao trinken?',
    a: 'Die Häufigkeit des Konsums von zeremoniellem Kakao ist individuell und kann von Person zu Person variieren. Es wird empfohlen, auf die eigene körperliche und mentale Reaktion zu achten. Ein maßvoller Konsum, der das persönliche Wohlbefinden unterstützt, ist in der Regel angebracht.',
  },
  // ENTFERNT 2026-09-02 (Job …-prio6-s02): "Welche Effekte entstehen durch die
  // Kombination von Qi Blanco®-Produkten und zeremoniellem Kakao?" — der
  // einzige Eintrag dieser Liste, der die Energieprodukte bewarb ("Gitterchip
  // 2.0", "kohärente Strukturen"). Anders als die vier gelöschten Konstanten
  // oben war dieser hier LIVE: FAQ_CACAO wird von Awake.jsx und Create.jsx
  // gerendert, der Eintrag stand also auf beiden Kaufseiten. Ersatzlos
  // gestrichen statt umformuliert — eine Aussage über die Wirkung eines
  // Fremdprodukts gehört nicht auf eine Kakao-Kaufseite, und eine neue
  // Wirkzusage an ihrer Stelle zu erfinden wäre schlimmer als die Lücke.
];
