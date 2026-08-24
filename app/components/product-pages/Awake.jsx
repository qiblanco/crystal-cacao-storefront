import LazyImage from '../reusables/LazyImage';
import {ProductFAQ} from '../ProductFAQ';
import {FAQ_CACAO} from '~/data/product-faqs';

export function BioaktiveInhaltsstoffe() {
  const IMG_FRAU =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06589_1.jpg?v=1764275150';
  const IMG_KAFFEE =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-1052459-kaffee.jpg?v=1764250719';

  const ingredients = [
    {
      title: 'Theobromin: 950 mg / 100g',
      bullets: [
        'sanfte, ausgewogene Aktivierung',
        'harmonisches 7,9:1-Verhältnis',
      ],
    },
    {
      title: 'Phenylethylamin (PEA): 5 mg / 100g',
      bullets: ['subtiler Impuls für Wohlgefühl'],
    },
    {
      title: 'Anandamid: 54 µg / 100g',
      bullets: ['unterstützt Ruhe, Verbindung und innere Präsenz'],
    },
    {
      title: 'L-Tryptophan: 30 mg / 100g',
      bullets: [
        'höchste Menge aller Crystal Cacao® Sorten',
        'Serotonin-Vorstufe für emotionale Ausgeglichenheit',
      ],
    },
    {
      title: 'Polyphenole & Flavanole: 5.030 mg / 100g',
      bullets: ['antioxidative Pflanzenstoffe für neuronale Balance'],
    },
  ];

  return (
    <div className="NormalSectionSize my-[100px]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-start">
        {/* Left: desktop images stacked */}
        <div className="hidden sm:flex! flex-col gap-4">
          <img className="w-full rounded-xl" src={IMG_FRAU} alt="" />
          <img className="w-full rounded-xl" src={IMG_KAFFEE} alt="" />
        </div>

        {/* Right: text */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-5">
            7 bioaktive Inhaltsstoffe:
          </h2>

          {/* Mobile-only top image */}
          <img
            className="block sm:hidden! w-full rounded-xl mb-5"
            src={IMG_FRAU}
            alt=""
          />

          <ol className="list-decimal list-inside space-y-4 text-sm text-gray-800">
            {ingredients.map((item, i) => (
              <li key={i}>
                <b>{item.title}</b>
                <br />
                {item.bullets.map((b, j) => (
                  <span key={j} className="block ml-4 text-gray-600">
                    → {b}
                  </span>
                ))}
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm text-gray-800 leading-relaxed">
            <b>Crystal Cacao® Awake</b> kombiniert sanfte Aktivierung mit dem{' '}
            <b>
              höchsten L-Tryptophan-Gehalt aller Kristall Kakao® Sorten – für
              präsente Klarheit, emotionale Tiefe und ein Gefühl innerer Weite.
            </b>
          </p>

          {/* Mobile-only bottom image */}
          <img
            className="block sm:hidden! w-full rounded-xl mt-5"
            src={IMG_KAFFEE}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}

export function Mineralstoffe() {
  const IMG_BOHNE =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/bohne-create.jpg?v=1763083566';
  const IMG_BALI =
    'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06610_1.jpg?v=1764258286';

  const minerals = [
    ['Magnesium (Mg)', 'Energiehaushalt, Nerven'],
    ['Kalium (K)', 'Herzfunktion, Zellspannung'],
    ['Calcium (Ca)', 'Knochen, Signalwege'],
    ['Phosphor (P)', 'ATP-Bildung'],
    ['Natrium (Na)', 'Elektrolytgleichgewicht'],
    ['Eisen (Fe)', 'Sauerstofftransport'],
    ['Zink (Zn)', 'Immunsystem, Enzyme'],
    ['Kupfer (Cu)', 'antioxidative Enzyme'],
    ['Mangan (Mn)', 'antioxidative Cofaktoren'],
    ['Chrom (Cr)', 'Glukosestoffwechsel'],
    ['Nickel (Ni)', 'enzymatische Prozesse'],
    ['Kobalt (Co)', 'Bestandteil von Vitamin B12'],
    ['Silizium (Si)', 'Bindegewebe, Struktur'],
    ['Bor (B)', 'Knochen, kognitive Funktionen'],
    ['Strontium (Sr)', 'Mineralstoffwechsel'],
    ['Rubidium (Rb)', 'intrazellulärer Marker'],
    ['Vanadium (V)', 'Glukosestoffwechsel'],
    ['Cäsium (Cs)', 'bioenergetische Spur'],
    ['Barium (Ba)', 'Spurenelement'],
    ['Gallium (Ga)', 'Ultraspurenelement'],
    ['Lanthan (La)', 'seltenes Spurenelement'],
    ['Tellur (Te)', 'Ultraspurenelement'],
    ['Hafnium (Hf)', 'Spurenelement'],
    ['Tantal (Ta)', 'Ultraspurenelement'],
  ];
  return (
    <div className="NormalSectionSize my-[100px]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-start">
        {/* Left: desktop images stacked */}
        <div className="hidden sm:flex! flex-col gap-4">
          <img
            className="w-full rounded-xl hidden sm:block!"
            src={IMG_BOHNE}
            alt=""
          />
          <img
            className="w-full rounded-xl hidden sm:block!"
            src={IMG_BALI}
            alt=""
          />
        </div>

        {/* Right: text */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-5">Enthält 24 Mineralstoffe</h2>

          {/* Mobile-only top image */}
          <img
            className="block sm:hidden! w-full rounded-xl mb-5"
            src={IMG_BOHNE}
            alt=""
          />

          <ol className="space-y-1 text-sm text-gray-800">
            {minerals.map(([name, desc], i) => (
              <li key={i}>
                <b>
                  {i + 1}. {name}
                </b>{' '}
                – {desc}
              </li>
            ))}
          </ol>

          {/* Mobile-only bottom image */}
          <img
            className="block sm:hidden! w-full rounded-xl mt-5"
            src={IMG_BALI}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}

const herkunftRows = [
  {
    text: (
      <>
        <p>
          Aus den <b>goldenen Flusstälern des Piura-Tals im Norden Perus</b>{' '}
          stammt eine heilige Pflanze – in ihrer reinsten Form: unser
          bio-zertifizierter <b>Awake – Kristall Kakao®.</b>
        </p>
        <p className="mt-3">
          Die hellen Kakaobohnen aus dieser Region zählen zu den seltensten und
          aromatischsten der Welt. Sie stammen aus nachhaltigem Anbau, werden
          von lokalen Kleinbauern mit großer Sorgfalt geerntet und bewahren
          durch ihre besondere Bohnenstruktur ein außergewöhnlich feines
          Aromaprofil.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/tal-kakao-awake.jpg?v=1764276290',
  },
  {
    text: (
      <>
        <p>
          Schonend bei niedriger Temperatur vermahlen, gießen wir sie
          anschließend in eine elegante, quadratische 420 g-Tafel – ein purer
          Block <b>Bio Kristall Kakao®.</b>
        </p>
        <p className="mt-3">
          Nach der Formung geben wir dem Kakao die Zeit, die er braucht: In der
          harmonisierenden <b>QiHome® Air</b> Atmosphäre – unterstützt durch
          die <b>GitterChip™-Technologie</b> – kristallisiert er langsam aus
          und entfaltet dabei sein charakteristisches Kristallmuster.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC02183_1.jpg?v=1764259399',
  },
  {
    text: (
      <>
        <p>
          Es ist ein Sinnbild für naturbelassene Qualität, aromatische Tiefe und
          unsere tiefe Achtung vor dem Ursprung. Versiegelt im Aroma-Schutzpack
          bleiben das volle Bouquet frischer Fruchtnoten, feiner Kokosnuancen
          und alle wertvollen Bestandteile optimal bewahrt.
        </p>
        <p className="mt-3">
          <b>
            Brich dir ein Stück ab, bereite ein warmes Elixier zu und tauche ein
            in dein persönliches Ritual – mit Achtsamkeit, Herzöffnung und
            tiefer Verbindung zu dir selbst.
          </b>
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01401.jpg?v=1766919672',
  },
];

function Herkunft() {
  return (
    <div className="NormalSectionSize my-[100px]!">
      <h2 className="text-center text-2xl font-bold mb-10">
        Herkunft: Spüre die Kraft des Amazonas
      </h2>
      <div className="flex flex-col gap-12">
        {herkunftRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center"
          >
            <p className="text-sm text-gray-800 leading-relaxed">{row.text}</p>
            <img className="w-full rounded-xl" src={row.img} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Anwendung() {
  return (
    <div className="NormalSectionSize flex flex-col gap-2">
      <h2>Anwendung & Tageszeiten</h2>
      <p>
        🕓 <b>Morgens:</b> Klarer Fokus und kraftvoller Start.
      </p>
      <p>
        🕑 <b>Nachmittags:</b> Für produktive Arbeit oder Training.
      </p>
      <p>
        🧘 <b>Abends:</b> Sanftes Ausklingen des Tages.
      </p>
      <p className="mt-2!">
        Zubereitung: 15 g in 75 ml warmer Milch oder Wasser (max. 85 °C).
      </p>
    </div>
  );
}

const COPYRIGHT =
  'Copyright: Quirino Olivera Núñez - Asociación para la Investigación Científica de la Amazonía del Perú';

const ursprungRows = [
  {
    text: (
      <>
        <p>
          Im Norden Perus, im Tal von Jaén und Bagua, erhebt sich der mystische{' '}
          <b>Spiraltempel von Montegrande</b> – ein Ort, an dem Archäologen
          Kakaorückstände in <b>6.300 Jahre alten Keramiken entdeckt</b> haben.
        </p>
        <p className="mt-3">
          Diese Funde gelten heute als der{' '}
          <b>älteste bekannte Nachweis von Kakao weltweit</b> – der Beginn einer
          Geschichte, die bis in unsere Zeit fortlebt.
        </p>
        <p className="mt-3">
          Nur wenige Kilometer von diesem historischen Fundort entfernt, in
          denselben fruchtbaren Böden des oberen Amazonasbeckens, wachsen die
          Pflanzen, aus deren Früchten <b>Crystal Cacao®</b> entsteht.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/montegrande.jpg?v=1764260249',
    copyright: COPYRIGHT,
  },
  {
    text: (
      <>
        <p>
          Sie gedeihen auf exakt jenem geologischen Fundament, das seit
          Jahrtausenden als Heimat des ursprünglichen Kakaos gilt.
        </p>
        <p className="mt-3">
          Die Region bildet eine <b>kontinuierliche Abstammungslinie:</b>
        </p>
        <p className="mt-3">
          Vom urzeitlichen Wildkakao über die ersten domestizierten Pflanzen des
          Montegrande-Kulturraums bis hin zu den heutigen, naturbelassenen
          Altlinien, die den genetischen Kern von <b>Crystal Cacao®</b> tragen.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/tempel-kakao.jpg?v=1764260567',
    copyright: COPYRIGHT,
  },
  {
    text: (
      <>
        <p>
          Diese Verbindung aus Archäologie, Ökologie und Genetik zeichnet ein
          klares Bild:
        </p>
        <p className="mt-3">
          <b>
            Crystal Cacao® wächst dort, wo die Geschichte des Kakaos begann
          </b>{' '}
          – im selben Boden, unter derselben Sonne und in einer ununterbrochenen
          Linie, die seit über 6.000 Jahren fortbesteht.
        </p>
        <p className="mt-3">
          Er trägt die Energie, Reinheit und Resonanz des ältesten bekannten
          Kakaos der Welt – und macht sie erlebbar für den Menschen von heute.
        </p>
      </>
    ),
    img: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-herkunft.jpg?v=1764260814',
    copyright: COPYRIGHT,
  },
];

function Ursprung() {
  return (
    <div className="NormalSectionSize my-[100px]!">
      <h2 className="text-center text-2xl font-bold mb-10">
        Crystal Cacao® – Ursprung, der 6.300 Jahre zurückreicht
      </h2>
      <div className="flex flex-col gap-12">
        {ursprungRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start"
          >
            <div className="text-sm text-gray-800 leading-relaxed">
              {row.text}
            </div>
            <div>
              <img className="w-full rounded-xl" src={row.img} alt="" />
              {row.copyright && (
                <p className="text-[0.7em] text-gray-500 mt-1">
                  {row.copyright}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HerobannerWithText({src, text}) {
  return (
    <div className="my-[10vh]! relative">
      <img className="w-full h-auto rounded-xl block" src={src} alt="" />
      <h2 className="absolute top-10 left-0 right-0 text-center text-white! text-5xl!">
        {text}
      </h2>
    </div>
  );
}

export default function AwakeProductPage() {
  return (
    <>
      <BioaktiveInhaltsstoffe />
      <Mineralstoffe />
      <Anwendung />
      <Herkunft />
      <Ursprung />
      <HerobannerWithText
        src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/bohne-create.jpg?v=1763083566"
        text=""
      />
      <ProductFAQ items={FAQ_CACAO} />
    </>
  );
}
