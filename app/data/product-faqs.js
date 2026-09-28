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
    a: 'Zeremonieller Kakao ist eine spezielle Form von Kakao, die absichtsvoll und achtsam zubereitet und konsumiert wird. Im Gegensatz zu gewöhnlichem Kakao wird dieser Kakao unter Einbeziehung ritueller Elemente, Achtsamkeit und Intentionalität zubereitet. Zeremonieller Kakao wird oft in ganzheitlichen Praktiken verwendet und kann eine tiefere Verbindung mit dem Selbst, der Natur oder anderen Menschen fördern. Die Zubereitung und der Konsum werden als eine Art Zeremonie betrachtet, die die psychoaktiven und energetischen Eigenschaften des Kakaos betont.',
    flag: 'eso-buzzword',
  },
  {
    q: 'Was bedeutet psychoaktiv in diesem Zusammenhang?',
    a: 'Gemeint ist damit, dass Kakao das zentrale Nervensystem beeinflussen kann. Er enthält natürliche Stoffe wie Theobromin, Koffein, Phenylethylamin und Anandamid, und die können deine Stimmung, deine Wachheit und deine Entspannung leicht verändern, sodass sich auch Denken, Fühlen und Wahrnehmen positiv verändern können. Diese Effekte sind sanft und mit einem starken Rausch überhaupt nicht zu vergleichen.',
  },
  {
    q: 'Wie wird zeremonieller Kakao zubereitet?',
    a: 'Das ist ganz unkompliziert, und nach den ersten Versuchen wird es dir schnell vertraut und macht sogar richtig Freude. Erwärm etwa 75 ml Wasser oder Pflanzenmilch, zum Beispiel Hafermilch, auf höchstens 85 °C. Zerkleinere die Kakaomasse, wieg 15 g für eine Tasse ab und lös sie in der warmen Flüssigkeit auf, am besten unter Rühren. Wenn du magst, verfeinerst du deinen Kakao mit verschiedenen Gewürzen. Und dann nimm dir Zeit, ihn zu spüren und zu genießen.',
  },
  {
    q: 'Für wen ist Kakao (un)geeignet?',
    a: 'Kakao enthält Theobromin, einen natürlichen Wachmacher. Wenn du empfindlich auf Koffein reagierst, fang deshalb sehr vorsichtig an, mit 5 bis 10 g pro Tasse. Wenn du schwanger bist und reinen Kakao trinken möchtest, frag am besten vorher deine Ärztin, deinen Arzt oder deine Hebamme, weil die Ansichten dazu auseinandergehen. Kinder mögen Kakao oft sehr und genießen, dass er die Stimmung hebt. Dosier für sie behutsam und achte darauf, dass sie ihn nicht zu kurz vor dem Schlafengehen trinken. Und wenn du Medikamente oder Antidepressiva (SSRIs) nimmst, sprich bitte unbedingt mit deinem behandelnden Arzt, bevor du zeremoniellen Kakao trinkst.',
  },
  {
    q: 'Was ist eine Kakaozeremonie und ist diese nötig?',
    a: 'Die Kakaozeremonie ist eine bewusste und absichtliche Praxis des Genießens von zeremoniellem Kakao an einem Ort der Wohlfühlatmosphäre. Diese einzigartige Art des Konsums verstärkt die tiefe und unterschwellige Wirkung des Kakaos, was sie für den Einnehmenden leichter erfahrbar macht. Obwohl eine Kakaozeremonie keine zwingende Voraussetzung ist, bietet sie Raum für persönliche Entfaltung und Reflektion. Viele Menschen nehmen sich gezielt Zeit für ihren Kakao und zelebrieren ihn auf ihre eigene Weise, oft im Rahmen von Dankbarkeitspraktiken.',
    flag: 'unfalsifizierbar',
  },
  {
    q: 'Wie oft darf man zeremoniellen Kakao trinken?',
    a: 'Das ist ganz individuell und bei jedem Menschen ein bisschen anders. Achte am besten darauf, wie du dich körperlich und im Kopf damit fühlst. In der Regel passt ein maßvoller Genuss, der dir guttut.',
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
