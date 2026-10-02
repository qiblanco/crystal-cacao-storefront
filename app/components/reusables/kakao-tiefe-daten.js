/**
 * kakao-tiefe-daten.js — Inhalt der „Kakao-Tiefe“ unter dem Amazon-Bereich der
 * zwei Kakao-Kaufseiten. EINE Quelle für drei Läden: qiblanco.com und
 * crystal-cacao.com rendern sie über KakaoTiefe.jsx (K1, byte-gleich), der
 * US-Shop qi-blanco.com bekommt ihr Markup per renderToStaticMarkup als Liquid-
 * Snippet (sprache 'en').
 *
 * Grossjob 20261002-GROSSJOB-kakaoseiten-mineralstoffe-dartsch-und-crystal-
 * niveau-auf-dach-und-us. Konzept: shared-state/claude-jobs/<jid>/konzept/.
 *
 * DIE MINERALSTOFFE SIND KEIN HANDTEXT. Der Block KT_MINERALSTOFFE ist ein
 * Abdruck von shared-state/crystal-cacao-node/data/mineralstoffe-dartsch.json
 * (wortgleich aus den Dartsch-PDFs, Mehrheitslesung der Zellen-OCR, 62/62).
 * Wer einen Wert ändern will, ändert die JSON und erzeugt den Block neu;
 * die Nahtprobe crystal-cacao-node/proben/probe_mineralstoffe_naht.py hält
 * JSON, diese Datei und die sechs gerenderten Seiten gegeneinander.
 *
 * ZAHLEN WIE IM BERICHT: Wert als String, Dezimalpunkt, keine Tausender-
 * trennung, Nachkommanullen bleiben ('0.130'). Die Anzeige tauscht im
 * Deutschen nur den Punkt gegen ein Komma.
 */

/** Rückweg: false zeigt wieder die bisherigen Abschnitte (Awake.jsx/Create.jsx). */
export const KAKAO_TIEFE_AN = true;

/** Die Bestimmungsgrenze des Berichts; sie trennt die zwei Gruppen. */
export const KT_LOQ = '0.623';

export const KT_SORTEN = Object.freeze({
  awake: Object.freeze({
    name: 'Awake',
    urstamm: 'Piura Blanco',
    bilder: Object.freeze({
      tal: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/tal-kakao-awake.jpg?v=1764276290', breite: 1559, hoehe: 1559},
    }),
  }),
  create: Object.freeze({
    name: 'Create',
    urstamm: 'Amazonas Nativo',
    bilder: Object.freeze({
      tal: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01491_Kopie.webp?v=1759179615', breite: 1200, hoehe: 800},
    }),
  }),
});

export const KT_BILDER = Object.freeze({
  montegrande: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/montegrande.jpg?v=1764260249', breite: 1598, hoehe: 1598},
  kristall: {url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC02183_1.jpg?v=1764259399', breite: 1333, hoehe: 1333},
});

/**
 * Analyseprofil je 100 g (Dartsch-Nährstoffanalysen 2025). Dieselben zwölf
 * Zahlen wie die Startseite von crystal-cacao.com (app/lib/analyseprofil.js);
 * probe_analyseprofil_naht.py hält beide gleich.
 */
export const KT_PROFIL = Object.freeze([
  {key: 'tryptophan', de: 'L-Tryptophan', en: 'L-Tryptophan', bedeutung: {de: 'Serotonin-Vorstufe', en: 'serotonin precursor'}, einheit: 'mg', awake: 30, create: 20},
  {key: 'theobromin', de: 'Theobromin', en: 'Theobromine', bedeutung: {de: 'sanfte, ausgewogene Aktivierung', en: 'gentle, balanced stimulation'}, einheit: 'mg', awake: 950, create: 1050},
  {key: 'koffein', de: 'Koffein', en: 'Caffeine', bedeutung: {de: '', en: ''}, einheit: 'mg', awake: 120, create: 140},
  {key: 'pea', de: 'Phenylethylamin (PEA)', en: 'Phenylethylamine (PEA)', bedeutung: {de: 'Teil des körpereigenen Motivationssystems', en: "part of the body's natural motivation pathways"}, einheit: 'mg', awake: 5, create: 10},
  {key: 'anandamid', de: 'Anandamid', en: 'Anandamide', bedeutung: {de: 'das „Bliss Molecule“', en: 'the “bliss molecule”'}, einheit: 'µg', awake: 54, create: 61},
  {key: 'polyphenole', de: 'Polyphenole & Flavanole', en: 'Polyphenols & flavanols', bedeutung: {de: 'antioxidative Pflanzenstoffe', en: 'antioxidant plant compounds'}, einheit: 'mg', awake: 5030, create: 5620},
]);

/** Die drei Prüfdokumente je Sorte, Felder wie app/lib/kakao-belege.js (Zeugnis-Vertrag). */
export const KT_DOKUMENTE = Object.freeze({
  awake: Object.freeze([
    {art: 'schadstoff', titel: {de: 'Schadstoff-Prüfzeugnis · Piura Blanco', en: 'Contaminant test certificate · Piura Blanco'}, geprueft: {de: 'Schadstoffe an der rohen Bohne', en: 'Contaminants in the raw bean'}, labor: 'Primoris Belgium', datum: '2025-08-21', kennung: {de: 'Zertifikat 25/049938', en: 'Certificate 25/049938'}, sprache: 'en', seiten: 9, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-piura-blanco-2025-08-21.pdf?v=1788373365'},
    {art: 'naehrstoff', titel: {de: 'Nährstoff-Analyse · Crystal Cacao Awake', en: 'Nutrient analysis · Crystal Cacao Awake'}, geprueft: {de: 'Nährstoffe der fertigen Mischung', en: 'Nutrients in the finished blend'}, labor: 'Dartsch Scientific', datum: '2025-11-04', kennung: {de: 'Analyse DARTSCH/04/11/25', en: 'Analysis DARTSCH/04/11/25'}, sprache: 'en', seiten: 1, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-awake-2025-11-04.pdf?v=1788373343'},
    {art: 'mineralstoff', titel: {de: 'Mineralstoff-Analyse · Crystal Cacao Awake', en: 'Mineral analysis · Crystal Cacao Awake'}, geprueft: {de: 'Mineralstoffe und Spurenelemente (ICP-MS)', en: 'Minerals and trace elements (ICP-MS)'}, labor: 'SAS hagmann (Messung), Dartsch Scientific (Bericht)', labor_en: 'SAS hagmann (testing), Dartsch Scientific (report)', datum: '2026-03-24', kennung: {de: 'Bericht 202511123716 engl.', en: 'Report 202511123716 engl.'}, sprache: 'en', seiten: 3, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-awake-2026-03-24.pdf?v=1789034539'},
  ]),
  create: Object.freeze([
    {art: 'schadstoff', titel: {de: 'Schadstoff-Prüfzeugnis · Amazonas Nativo', en: 'Contaminant test certificate · Amazonas Nativo'}, geprueft: {de: 'Schadstoffe an der rohen Bohne', en: 'Contaminants in the raw bean'}, labor: 'Primoris Belgium', datum: '2025-08-19', kennung: {de: 'Zertifikat 25/049940', en: 'Certificate 25/049940'}, sprache: 'en', seiten: 9, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/pruefzeugnis-primoris-amazonas-nativo-2025-08-19.pdf?v=1788373357'},
    {art: 'naehrstoff', titel: {de: 'Nährstoff-Analyse · Crystal Cacao Create', en: 'Nutrient analysis · Crystal Cacao Create'}, geprueft: {de: 'Nährstoffe der fertigen Mischung', en: 'Nutrients in the finished blend'}, labor: 'Dartsch Scientific', datum: '2025-10-27', kennung: {de: 'Analyse DARTSCH/21/10/25', en: 'Analysis DARTSCH/21/10/25'}, sprache: 'de', seiten: 1, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/naehrstoffanalyse-dartsch-crystal-cacao-create-2025-10-27.pdf?v=1788373349'},
    {art: 'mineralstoff', titel: {de: 'Mineralstoff-Analyse · Crystal Cacao Create', en: 'Mineral analysis · Crystal Cacao Create'}, geprueft: {de: 'Mineralstoffe und Spurenelemente (ICP-MS)', en: 'Minerals and trace elements (ICP-MS)'}, labor: 'SAS hagmann (Messung), Dartsch Scientific (Bericht)', labor_en: 'SAS hagmann (testing), Dartsch Scientific (report)', datum: '2026-03-12', kennung: {de: 'Bericht 202510143565-engl.-E', en: 'Report 202510143565-engl.-E'}, sprache: 'en', seiten: 3, url: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-create-2026-03-12.pdf?v=1789034532'},
  ]),
});

/**
 * Alle Texte. Platzhalter {name}, {andere} usw. ersetzt KakaoTiefe.jsx.
 * Hausstimme (writing-rules): Antwort zuerst, ein Gedanke je Satz, kein Text
 * über sich selbst. Keine Wirkaussage je Element: der Bericht misst Gehalte,
 * keine Wirkung.
 */
export const KT_TEXTE = Object.freeze({
  de: Object.freeze({
    mineral: {
      augenbraue: 'Mineralstoffe · Laborbericht',
      titel: '{anzahl} Elemente, Wert für Wert gemessen',
      lead: 'Das Labor SAS hagmann hat {name} per ICP-MS untersucht, Prof. Dr. Peter C. Dartsch hat den Bericht zusammengefasst. Du siehst jeden Wert so, wie er im Bericht steht: in Milligramm pro Kilogramm, ohne Rundung.',
      hoch: 'Hohe Elementanteile',
      hoch_regel: 'Über der Bestimmungsgrenze von {loq} mg/kg gemessen.',
      spur: 'Geringer Nachweis',
      spur_regel: 'Unter der Bestimmungsgrenze von {loq} mg/kg. Für diese Elemente nennt das Labor einen rechnerischen Wert aus der Signalstärke.',
      unter: 'kaum nachweisbar',
      elemente: '{n} Elemente',
      vergleich_titel: '{name} und {andere} im Vergleich',
      vergleich_mehr: '{a} liegt bei {n} von {gesamt} Elementen höher als {b}.',
      vergleich_gleich: 'Gleich auf: {liste}.',
      vergleich_vorn: '{b} liegt bei {liste} vorn.',
      fund: 'Selbst Silber und Platin weist das Labor in Spuren nach: {ag} und {pt} mg/kg.',
      quelle: 'Quelle: Dartsch Scientific, Zusammenfassung des Prüfberichts {nr} der SAS hagmann GmbH (DAkkS-akkreditiert) vom {datum}, Probe {probe}.',
      quelle_link: 'Bericht öffnen (PDF, englisch, 3 Seiten)',
      schadstoff: 'Blei, Cadmium, Quecksilber und Arsen führt dieser Bericht nicht. Sie prüft das Schadstoff-Prüfzeugnis an der rohen Bohne:',
      schadstoff_link: 'Primoris Belgium, {datum} (PDF)',
      und: 'und',
    },
    profil: {
      augenbraue: 'Analyseprofil · je 100 g',
      titel: 'Das Profil von {name}',
      lead: 'Dartsch Scientific hat die fertige Mischung untersucht. Daneben steht {andere} zum Vergleich.',
      deutung: {
        awake: 'Awake hat den höchsten L-Tryptophan-Gehalt unserer Sorten: für präsente Klarheit, emotionale Tiefe und ein Gefühl innerer Weite.',
        create: 'Create hat das stärkste aktivierende Profil unserer Sorten: für sanfte Wachheit, kognitive Klarheit und stabile innere Ausrichtung.',
      },
      quelle_link: 'Nährstoff-Analyse öffnen (PDF)',
    },
    einordnung: {
      augenbraue: 'Einordnung',
      titel: 'Was im Regal alles Kakao heißt',
      lead: 'Auf vier Produkten steht dasselbe Wort. Was mit der Bohne passiert, unterscheidet sich jedes Mal.',
      stufen: [
        {name: 'Kakaopulver', text: 'Die Bohne wird gepresst und entölt. Übrig bleibt ein trockenes Pulver.'},
        {name: 'Schokolade', text: 'Die Kakaomasse wird lange gewalzt und fast immer mit Zucker gemischt.'},
        {name: 'Zeremonie-Kakao', text: 'Die ganze Bohne wird zu Masse gemahlen. Die Kakaobutter bleibt drin.'},
        {name: 'Kristall-Kakao', text: 'Ganze Bohnen aus einem Urstamm, schonend bei niedriger Temperatur vermahlen. In Ruhe kristallisiert die Masse aus. Jede Sorte ist im Labor gemessen.', marke: 'Crystal Cacao®'},
      ],
      urstamm_titel: 'Unser Fokus: Urstämme',
      urstamm_text: 'Crystal Cacao® setzt auf Urstämme: alte Kakaosorten, wie es sie nur noch an wenigen Orten gibt.',
      urstamm: {
        awake: 'Awake kommt vom Piura Blanco aus dem Piura-Tal im Norden Perus.',
        create: 'Create kommt vom Amazonas Nativo aus den Bergwäldern des Departamento Amazonas.',
      },
    },
    herkunft: {
      augenbraue: 'Herkunft',
      titel: {awake: 'Piura Blanco aus dem Piura-Tal', create: 'Amazonas Nativo aus den Bergwäldern Perus'},
      text: {
        awake: [
          'Awake kommt aus den goldenen Flusstälern des Piura-Tals im Norden Perus.',
          'Die hellen Bohnen dieser Region zählen zu den seltensten und aromatischsten der Welt. Lokale Kleinbauern bauen sie nachhaltig an und ernten sie mit großer Sorgfalt.',
        ],
        create: [
          'Create stammt aus nachhaltigem Anbau in den Bergwäldern des peruanischen Departamento Amazonas.',
          'Die Bohnen werden behutsam bei niedriger Temperatur vermahlen und zu einer quadratischen 420-g-Tafel gegossen.',
        ],
      },
      ursprung_titel: 'Ein Ursprung, der 6.300 Jahre zurückreicht',
      ursprung: [
        'Im Tal von Jaén und Bagua im Norden Perus liegt der Spiraltempel von Montegrande. Archäologen haben dort Kakaorückstände in 6.300 Jahre alten Keramiken entdeckt, den ältesten bekannten Nachweis von Kakao weltweit.',
        'Nur wenige Kilometer entfernt, in denselben Böden des oberen Amazonasbeckens, wachsen die Pflanzen für Crystal Cacao®.',
      ],
      copyright: 'Copyright: Quirino Olivera Núñez, Asociación para la Investigación Científica de la Amazonía del Perú',
      alt_tal: {awake: 'Kakaoanbau im Piura-Tal im Norden Perus', create: 'Kakaobohnen von Create aus dem Departamento Amazonas'},
      alt_montegrande: 'Ausgrabungsstätte Montegrande in Jaén, Peru',
    },
    zubereitung: {
      augenbraue: 'Zubereitung',
      titel: 'Dein Ritual in drei Schritten',
      schritte: [
        '15 g abbrechen und fein zerbröseln.',
        'In 75 ml warmer Milch oder warmem Wasser auflösen, höchstens 85 °C.',
        'Aufschäumen, kurz ruhen lassen und langsam trinken.',
      ],
      hinweis: 'Eine 420-g-Tafel reicht für 28 Tassen.',
      alt: 'Das Kristallmuster einer Crystal-Cacao-Tafel',
    },
    belege: {
      augenbraue: 'Studien und Belege',
      titel: 'Drei Prüfdokumente zu {name}',
      lead: 'Drei Labore, drei Fragen. Jedes Dokument trägt sein Prüfdatum.',
      geprueft: 'Geprüft',
      labor: 'Labor',
      datum: 'Datum',
      nummer: 'Nummer',
      datei: 'Datei',
      datei_text: 'PDF, {sprache}, {seiten}',
      sprachen: {de: 'deutsch', en: 'englisch'},
      seite: '1 Seite',
      seiten: '{n} Seiten',
    },
  }),
  en: Object.freeze({
    mineral: {
      augenbraue: 'Minerals · Lab report',
      titel: '{anzahl} elements, measured value by value',
      lead: 'SAS hagmann tested {name} by ICP-MS, and Prof. Dr. Peter C. Dartsch summarized the report. You see every value exactly as the report states it: in milligrams per kilogram, unrounded.',
      hoch: 'High element content',
      hoch_regel: 'Measured above the limit of quantification of {loq} mg/kg.',
      spur: 'Trace detection',
      spur_regel: 'Below the limit of quantification of {loq} mg/kg. For these elements the lab gives a calculated value based on signal strength.',
      unter: 'barely detectable',
      elemente: '{n} elements',
      vergleich_titel: '{name} and {andere} compared',
      vergleich_mehr: '{a} is higher than {b} in {n} of {gesamt} elements.',
      vergleich_gleich: 'Equal: {liste}.',
      vergleich_vorn: '{b} leads in {liste}.',
      fund: 'The lab even detects traces of silver and platinum: {ag} and {pt} mg/kg.',
      quelle: 'Source: Dartsch Scientific, summary of test report {nr} by SAS hagmann GmbH (DAkkS-accredited), dated {datum}, sample {probe}.',
      quelle_link: 'Open the report (PDF, English, 3 pages)',
      schadstoff: 'This report does not cover lead, cadmium, mercury and arsenic. They are tested in the contaminant certificate on the raw bean:',
      schadstoff_link: 'Primoris Belgium, {datum} (PDF)',
      und: 'and',
    },
    profil: {
      augenbraue: 'Analysis profile · per 100 g',
      titel: 'The profile of {name}',
      lead: 'Dartsch Scientific tested the finished blend. {andere} is shown alongside for comparison.',
      deutung: {
        awake: 'Awake has the highest L-tryptophan content of our varieties: for present-moment clarity, emotional depth and a sense of inner openness.',
        create: 'Create has the most activating profile of our varieties: for gentle alertness, mental clarity and a steady inner balance.',
      },
      quelle_link: 'Open the nutrient analysis (PDF)',
    },
    einordnung: {
      augenbraue: 'Classification',
      titel: 'What the shelf calls cacao',
      lead: 'Four products carry the same word. What happens to the bean is different every time.',
      stufen: [
        {name: 'Cocoa powder', text: 'The bean is pressed and defatted. What remains is a dry powder.'},
        {name: 'Chocolate', text: 'The cacao mass is conched for a long time and almost always mixed with sugar.'},
        {name: 'Ceremonial cacao', text: 'The whole bean is ground into a paste. The cacao butter stays in.'},
        {name: 'Crystal cacao', text: 'Whole beans from a heritage strain, gently ground at low temperature. At rest, the mass crystallizes. Every variety is lab-tested.', marke: 'Crystal Cacao®'},
      ],
      urstamm_titel: 'Our focus: heritage strains',
      urstamm_text: 'Crystal Cacao® focuses on heritage strains: old cacao varieties that survive in only a few places.',
      urstamm: {
        awake: 'Awake comes from Piura Blanco, grown in the Piura Valley in northern Peru.',
        create: "Create comes from Amazonas Nativo, grown in the mountain forests of Peru's Amazonas region.",
      },
    },
    herkunft: {
      augenbraue: 'Origin',
      titel: {awake: 'Piura Blanco from the Piura Valley', create: "Amazonas Nativo from Peru's mountain forests"},
      text: {
        awake: [
          'Awake comes from the golden river valleys of the Piura Valley in northern Peru.',
          'The light-colored beans from this region are among the rarest and most aromatic in the world. Local smallholder farmers grow them sustainably and harvest them with great care.',
        ],
        create: [
          "Create comes from sustainable cultivation in the mountain forests of Peru's Amazonas region.",
          'The beans are gently ground at low temperature and poured into a square 14.8 oz bar.',
        ],
      },
      ursprung_titel: 'Origins dating back 6,300 years',
      ursprung: [
        'In the valley of Jaén and Bagua in northern Peru lies the spiral temple of Montegrande. Archaeologists discovered cacao residues there in 6,300-year-old ceramics, the oldest known evidence of cacao in the world.',
        'Just a few miles away, in the same soils of the upper Amazon basin, grow the plants for Crystal Cacao®.',
      ],
      copyright: 'Copyright: Quirino Olivera Núñez, Asociación para la Investigación Científica de la Amazonía del Perú',
      alt_tal: {awake: 'Cacao growing in the Piura Valley in northern Peru', create: 'Create cacao beans from the Amazonas region'},
      alt_montegrande: 'Montegrande excavation site in Jaén, Peru',
    },
    zubereitung: {
      augenbraue: 'Preparation',
      titel: 'Your ritual in three steps',
      schritte: [
        'Break off 15 g and crumble it finely.',
        'Dissolve it in 75 ml of warm milk or water, at most 185 °F (85 °C).',
        'Froth it, let it rest briefly and sip slowly.',
      ],
      hinweis: 'One 14.8 oz bar makes 28 cups.',
      alt: 'The crystal pattern of a Crystal Cacao bar',
    },
    belege: {
      augenbraue: 'Studies and evidence',
      titel: 'Three test documents for {name}',
      lead: 'Three labs, three questions. Every document carries its test date.',
      geprueft: 'Tested',
      labor: 'Lab',
      datum: 'Date',
      nummer: 'Number',
      datei: 'File',
      datei_text: 'PDF, {sprache}, {seiten}',
      sprachen: {de: 'German', en: 'English'},
      seite: '1 page',
      seiten: '{n} pages',
    },
  }),
});

// >>> KT_MINERALSTOFFE (erzeugt von crystal-cacao-node/bin/kakao-tiefe-mineralblock, nicht von Hand ändern)
export const KT_MINERALSTOFFE = Object.freeze({
  quelle: Object.freeze({awake: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-awake-2026-03-24.pdf?v=1789034539", create: "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/mineralstoffanalyse-dartsch-crystal-cacao-create-2026-03-12.pdf?v=1789034532"}),
  bericht: Object.freeze({
    awake: {datum: "2026-03-24", probe: "SAS-No. 690", nr: "202511123716 engl."},
    create: {datum: "2026-03-12", probe: "SAS-No. 444", nr: "202510143565-engl.-E"},
  }),
  sorten: Object.freeze({
    awake: Object.freeze([
      {s: "B", de: "Bor", en: "Boron", w: "10", g: "hoch"},
      {s: "Na", de: "Natrium", en: "Sodium", w: "3", g: "hoch"},
      {s: "Mg", de: "Magnesium", en: "Magnesium", w: "2650", g: "hoch"},
      {s: "P", de: "Phosphor", en: "Phosphorus", w: "4090", g: "hoch"},
      {s: "K", de: "Kalium", en: "Potassium", w: "9150", g: "hoch"},
      {s: "Ca", de: "Calcium", en: "Calcium", w: "960", g: "hoch"},
      {s: "Mn", de: "Mangan", en: "Manganese", w: "20", g: "hoch"},
      {s: "Si", de: "Silicium", en: "Silicon", w: "50", g: "hoch"},
      {s: "Fe", de: "Eisen", en: "Iron", w: "70", g: "hoch"},
      {s: "Ni", de: "Nickel", en: "Nickel", w: "4", g: "hoch"},
      {s: "Cu", de: "Kupfer", en: "Copper", w: "20", g: "hoch"},
      {s: "Zn", de: "Zink", en: "Zinc", w: "50", g: "hoch"},
      {s: "Rb", de: "Rubidium", en: "Rubidium", w: "19", g: "hoch"},
      {s: "Sr", de: "Strontium", en: "Strontium", w: "8", g: "hoch"},
      {s: "Li", de: "Lithium", en: "Lithium", w: "0.007", g: "spur"},
      {s: "V", de: "Vanadium", en: "Vanadium", w: "0.006", g: "spur"},
      {s: "Cr", de: "Chrom", en: "Chromium", w: "0.130", g: "spur"},
      {s: "Se", de: "Selen", en: "Selenium", w: "0.073", g: "spur"},
      {s: "Co", de: "Cobalt", en: "Cobalt", w: "0.600", g: "spur"},
      {s: "Ge", de: "Germanium", en: "Germanium", w: "< 0.001", g: "spur"},
      {s: "Ti", de: "Titan", en: "Titanium", w: "0.150", g: "spur"},
      {s: "Zr", de: "Zirconium", en: "Zirconium", w: "0.009", g: "spur"},
      {s: "Mo", de: "Molybdän", en: "Molybdenum", w: "0.260", g: "spur"},
      {s: "Ir", de: "Iridium", en: "Iridium", w: "< 0.001", g: "spur"},
      {s: "Rh", de: "Rhodium", en: "Rhodium", w: "< 0.001", g: "spur"},
      {s: "W", de: "Wolfram", en: "Tungsten", w: "< 0.001", g: "spur"},
      {s: "Pd", de: "Palladium", en: "Palladium", w: "0.030", g: "spur"},
      {s: "Te", de: "Tellur", en: "Tellurium", w: "0.050", g: "spur"},
      {s: "Ag", de: "Silber", en: "Silver", w: "0.070", g: "spur"},
      {s: "Au", de: "Gold", en: "Gold", w: "< 0.001", g: "spur"},
      {s: "Pt", de: "Platin", en: "Platinum", w: "0.060", g: "spur"},
    ]),
    create: Object.freeze([
      {s: "B", de: "Bor", en: "Boron", w: "20", g: "hoch"},
      {s: "Na", de: "Natrium", en: "Sodium", w: "5", g: "hoch"},
      {s: "Mg", de: "Magnesium", en: "Magnesium", w: "3400", g: "hoch"},
      {s: "P", de: "Phosphor", en: "Phosphorus", w: "6000", g: "hoch"},
      {s: "K", de: "Kalium", en: "Potassium", w: "12000", g: "hoch"},
      {s: "Ca", de: "Calcium", en: "Calcium", w: "1150", g: "hoch"},
      {s: "Mn", de: "Mangan", en: "Manganese", w: "20", g: "hoch"},
      {s: "Si", de: "Silicium", en: "Silicon", w: "70", g: "hoch"},
      {s: "Fe", de: "Eisen", en: "Iron", w: "90", g: "hoch"},
      {s: "Ni", de: "Nickel", en: "Nickel", w: "6", g: "hoch"},
      {s: "Cu", de: "Kupfer", en: "Copper", w: "30", g: "hoch"},
      {s: "Zn", de: "Zink", en: "Zinc", w: "50", g: "hoch"},
      {s: "Rb", de: "Rubidium", en: "Rubidium", w: "21", g: "hoch"},
      {s: "Sr", de: "Strontium", en: "Strontium", w: "6", g: "hoch"},
      {s: "Li", de: "Lithium", en: "Lithium", w: "0.008", g: "spur"},
      {s: "V", de: "Vanadium", en: "Vanadium", w: "0.015", g: "spur"},
      {s: "Cr", de: "Chrom", en: "Chromium", w: "0.310", g: "spur"},
      {s: "Se", de: "Selen", en: "Selenium", w: "0.080", g: "spur"},
      {s: "Co", de: "Cobalt", en: "Cobalt", w: "0.560", g: "spur"},
      {s: "Ge", de: "Germanium", en: "Germanium", w: "0.010", g: "spur"},
      {s: "Ti", de: "Titan", en: "Titanium", w: "0.230", g: "spur"},
      {s: "Zr", de: "Zirconium", en: "Zirconium", w: "0.006", g: "spur"},
      {s: "Mo", de: "Molybdän", en: "Molybdenum", w: "0.480", g: "spur"},
      {s: "Ir", de: "Iridium", en: "Iridium", w: "< 0.001", g: "spur"},
      {s: "Rh", de: "Rhodium", en: "Rhodium", w: "< 0.001", g: "spur"},
      {s: "W", de: "Wolfram", en: "Tungsten", w: "0.008", g: "spur"},
      {s: "Pd", de: "Palladium", en: "Palladium", w: "0.030", g: "spur"},
      {s: "Te", de: "Tellur", en: "Tellurium", w: "0.050", g: "spur"},
      {s: "Ag", de: "Silber", en: "Silver", w: "0.070", g: "spur"},
      {s: "Au", de: "Gold", en: "Gold", w: "< 0.001", g: "spur"},
      {s: "Pt", de: "Platin", en: "Platinum", w: "0.040", g: "spur"},
    ]),
  }),
});
// <<< KT_MINERALSTOFFE
