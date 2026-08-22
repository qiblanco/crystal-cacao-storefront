import LazyImage from '../reusables/LazyImage';
import {ActiveCampaignForm} from '../reusables/ActiveCampaignForm';

export function Kakao() {
  return (
    <div className="ProductPageKakao">
      <h1 className="text-6xl! text-center mb-[0px]!">High Performance Cacao</h1>
      <h2 className="text-5xl! text-center mt-5!">Wach. Klar. Mineralisiert.</h2>
      <Hero />
      <Benefits />
      <SideToSideWithTable />
      <ComparisonTable />
      <HerobannerWithText
        text="Wach. Klar. Im Flow."
        src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06610.jpg?v=1763050714"
      />
      <div className="flex flex-col NormalSectionSize gap-3 items-center justify-center">
        <h2 className="text-2xl">Unser Versprechen an dich</h2>
        <p>
          <b>Crystal Cacao®</b> liefert dir ein{' '}
          <b>besseres Gefühl, mehr Klarheit und stabile Energie.</b> Wenn nicht,
          bekommst du dein Geld zurück – ohne Diskussion.
        </p>
        <p>
          <b>20 Tage testen - komplett risikofrei</b>
        </p>
        <p>
          <b>100 % Geld-zurück-Garantie, selbst bei geöffneter Packung.</b>
        </p>
        <p>
          Nicht zufrieden? Einfach zurücksenden und wir erstatten dir alles.
        </p>
      </div>
      <HerobannerWithText
        text="100% naturrein"
        src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC00308_Kopie.webp?v=1763062180"
      />
      <SparSection />
      <MusterSection />
      <WurzelnSection />
      <Zubereitung />
      <RitualSection />
      <OnlineKurs />
      <KursInhalt />
      <KursRegistration />

      <div className="my-[10vh]! NormalSectionSize">
        <h2>Wusstest du?</h2>
        <p>Unser Kakao wird in einer strukturierten Umgebung mit der QiHome® Air-Technologie verarbeitet – einer innovativen Lösung, die ein harmonisches Feld erzeugt und die Qualität natürlicher Rohstoffe in ihrer feinen Struktur unterstützen kann.</p>
        <p>👉 Erfahre mehr über unsere unterstützenden Tools – wie der QiOne® oder das QiBracelet® – und entdecke, wie du dein eigenes Umfeld energetisch stärken und bewusster gestalten kannst.</p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-col gap-10 NormalSectionSize items-center sm:flex-row mt-[50px]!">
      <div className="flex-1 justify-center self-stretch flex flex-col">
        <div className="block sm:hidden">
          <LazyImage
            highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001273-v2b-min.jpg_1.webp?v=1669001851"
            compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001273-v2b-min_small.jpg_1.webp?v=1669001851"
          />
        </div>
        <h2 className="text-2xl">Crystal Cacao® - Bio</h2>
        <div className="text-2xl font-bold text-[#eabb6e]!">5.0 ★★★★★</div>
        <h3 className="text-2xl font-bold">Mehr als 1.000+ aktive Nutzer</h3>
        <div className="text-lg text-[#4A4741]">
          Erfahre jetzt die Vorteile von Kristall Kakao
        </div>
        <div>
          <ul className="m-[22px]!">
            <li className="list-disc">
              Für 28 Tage - Klarheit, Fokus & Energie
            </li>
            <li className="list-disc">11x mehr Antioxidantien als Kakao</li>
            <li className="list-disc">24 Mineralstoffe & Spurenelemente</li>
            <li className="list-disc">100 % reiner Premium-Naturkakao</li>
          </ul>
        </div>
        <p className="font-bold">
          {' '}
          ✅ Wissenschaftlich geprüft - direkt spürbar!{' '}
        </p>
        <div className="flex gap-3 mt-2">
          <a href="/products/crystal-cacao-create" className="btn--primary">
            Jetzt kaufen
          </a>
          <a target='_blank'
            href="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Test_report_Create_27.10.2025_english_language.pdf?v=1763061829"
            className="btn--secondary border-none! bg-[#00000025]"
          >
            Analyse anzeigen
          </a>
        </div>
        <div className="text-center mt-2 m-auto self-center">
          <b>100% Zufriedenheitsgarantie · Geprüfte Bio-Qualität</b>
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden sm:block hidden">
        <LazyImage
          highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001273-v2b-min.jpg_1.webp?v=1669001851"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001273-v2b-min_small.jpg_1.webp?v=1669001851"
        />
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <div className="flex flex-col sm:flex-row! items-center NormalSectionSize mt-[10vh]! gap-10">
      <div className="flex-1 flex flex-col gap-10">
        <div>
          <h2>Wach</h2>
          <p>
            Unsere Nutzer mögen, dass man wach ist, ohne sich aufgedreht zu
            fühlen. Wenig Koffein, kombiniert mit natürlichem Theobromin, sorgt
            für ein ruhiges, klares Gefühl.
          </p>
        </div>
        <div>
          <h2>Klar.</h2>
          <p>
            Viele Nutzer merken, dass sie ruhiger und klarer im Kopf sind und
            sich besser konzentrieren können.
          </p>
        </div>
        <div>
          <h2>Mineralisiert.</h2>
          <p>
            Ein unkomplizierter Begleiter für jeden Tag – mit 24 natürlich
            enthaltenen Mineralstoffen und Spurenelementen.
          </p>
        </div>
        <div>
          <h2>Antioxidantien-Boost.</h2>
          <p>
            Reine Pflanzenkraft, ganz ohne Zucker. Eine Tasse Kristall Kakao®
            liefert viele natürlich enthaltene Antioxidantien – pur,
            unverfälscht und ohne Zusätze.
          </p>
        </div>
        <div>
          <h2>100% naturrein.</h2>
          <p>
            Aus einer überlieferten Kakaolinie mit mehr als 6.300 Jahren
            Ursprung. Naturbelassen, unverfälscht und in Bio-Qualität.
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <LazyImage
          highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet.jpg?v=1771790329"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet_small.jpg?v=1771790329"
        />
        <LazyImage
          highQualityLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet-beans.jpg?v=1771790303"
          compressedLink="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-snippet-beans_small.jpg?v=1771790303"
        />
      </div>
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    {
      label: (
        <>
          Polyphenole &amp;
          <br /> Flavanole
        </>
      ),
      kakao: '843 mg',
      kaffee: {value: '300 mg', highlight: true},
      energy: '-',
    },
    {label: 'Theobromin', kakao: '158 mg', kaffee: '-', energy: '-'},
    {
      label: 'Coffein',
      kakao: '21 mg',
      kaffee: {value: '80 – 100 mg'},
      energy: {value: '80 mg'},
    },
    {label: 'Phenylethylamin (PEA)', kakao: '1,5 mg', kaffee: '-', energy: '-'},
    {label: 'Anandamid', kakao: '9 µg', kaffee: '-', energy: '-'},
    {label: 'L-Tryptophan', kakao: '3 mg', kaffee: '-', energy: '-'},
  ];

  const cell = (val) => {
    if (val === '-')
      return <td className="text-center py-2 px-3 text-gray-400">–</td>;
    const isObj = typeof val === 'object' && val !== null && 'value' in val;
    return (
      <td className="text-center py-2 px-3">
        <p
          className={
            isObj && val.highlight
              ? 'text-orange-500 font-medium text-sm!'
              : 'font-medium text-sm!'
          }
        >
          {isObj ? val.value : val}
        </p>
      </td>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[100px]! NormalSectionSize">
      {/* Left: table */}
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-3" />
                <th className="py-3 px-3 text-center!">
                  <img
                    width={50}
                    src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-bean-logo.png?v=1764252027"
                    alt=""
                    className="mx-auto! mb-1"
                  />
                  <h3 className="text-sm font-bold" style={{color: '#cab581'}}>
                    Crystal Cacao®
                  </h3>
                  <h4 className="text-gray-500">15g</h4>
                </th>
                <th className="py-3 px-3 text-center">
                  <img
                    width={50}
                    src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/coffee-logo.png?v=1763976173"
                    alt=""
                    className="mx-auto! mb-1"
                  />
                  <h3 className="text-sm font-bold" style={{color: '#5b3b26'}}>
                    Kaffee
                  </h3>
                  <h4 className="text-gray-500">200ml</h4>
                </th>
                <th className="py-3 px-3 text-center">
                  <img
                    width={50}
                    src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/energy-logo.png?v=1763976173"
                    alt=""
                    className="mx-auto! mb-1"
                  />
                  <h3 className="text-sm font-bold" style={{color: '#c04718'}}>
                    Energydrink
                  </h3>
                  <h4 className="text-gray-500">250ml</h4>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3 font-bold text-md">{row.label}</td>
                  {cell(row.kakao)}
                  {cell(row.kaffee)}
                  {cell(row.energy)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center">
          <a
            target="_blank"
            href="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Test_report_Create_27.10.2025_english_language.pdf?v=1763061829"
            className="btn--secondary mx-auto! mt-2!"
            rel="noreferrer"
          >
            Analysedaten
          </a>
        </div>
      </div>

      {/* Right: text */}
      <div className="flex flex-col justify-center">
        <p>
          <b>Crystal Cacao®</b> enthält 6 weitere wertvolle Pflanzenstoffe:
          <br />
          &nbsp;
          <br />
          <b>
            Flavanole, Polyphenole, Theobromin, Phenylethylamin, Anandamid und
            L-Tryptophan.
          </b>
          <br />
          &nbsp;
          <br />
          Diese <b>jahrtausendealte natürliche Wirkstoffkomposition</b> wird von
          unseren Nutzern als klar{' '}
          <b>
            fokussierend, kreativitätsfördernd und lang anhaltend beschrieben
          </b>{' '}
          – und das gleichzeitig bei einer ruhigen und stabilen Energie.
          <br />
          &nbsp;
          <br />
          <b>Ganz ohne Zucker und Zusätze.</b>
        </p>
      </div>
    </div>
  );
}

function SideToSideWithTable() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[100px]! NormalSectionSize">
      <div className="flex flex-col justify-center">
        <h2 className="text-3xl font-bold">Wach. Klar. Ohne Koffein-Crash.</h2>
        <img
          className="block sm:hidden! mb-4"
          src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/chart-kakao.webp?v=1763974217"
          alt=""
        />
        <p>
          Die Wirkung von <b>Kaffee &amp; Energy-Drinks</b> beruht fast
          ausschließlich auf den <b>hohen Koffeingehalt.</b>
        </p>
        <p>
          Das führt zu
          <br />
          einem <b>schnellen Kick,</b>
          <br />
          <b>einem schnellen Crash</b>
          <br />
          und man <b>braucht immer mehr davon.</b>
        </p>
      </div>
      <div className="hidden sm:flex items-center">
        <img
          className="w-full"
          src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/chart-kakao.webp?v=1763974217"
          alt=""
        />
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

function SparSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 NormalSectionSize mt-[100px]!">
      <div className="flex flex-col justify-center">
        <h2>Jetzt sparen - bis zu 30%!</h2>
        <p>
          <b>Spare bis zu 30 % – sortenübergreifend kombinierbar.</b>
        </p>
        <p>
          <b>2 Packungen = 20 % Rabatt + Gratisversand</b>
        </p>
        <p>
          <b>3 Packungen = 30 % Rabatt + Gratisversand</b>
        </p>
      </div>
      <div className="aspect-square overflow-hidden rounded-xl mb-[10vh]">
        <img
          className="w-full h-full object-cover"
          src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-image.webp?v=1759153567"
          alt=""
        />
      </div>
    </div>
  );
}

function MusterSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 NormalSectionSize mt-[100px]!">
      <div className="flex flex-col justify-center">
        <h2>Der Unterschied zeigt sich im Muster:</h2>
        <p className="mt-2">
          Das charakteristische Leopardenmuster von Crystal Cacao® ist
          sichtbarer Beweis der kristallinen Struktur – entstanden durch
          naturbelassene Verarbeitung.
          <br />
          Diese Struktur bewahrt die volle Pflanzenkraft:
        </p>
        <ul className="list-disc ml-6 mt-2 flex flex-col gap-1">
          <li>
            5.620 mg <b>Flavanole &amp; Polyphenole</b>
          </li>
          <li>
            1.050 mg <b>Theobromin</b>
          </li>
          <li>
            10 mg <b>Phenylethylamin</b>
          </li>
          <li>
            61 µg <b>Anandamid</b>
          </li>
          <li>
            20 mg <b>L‑Tryptophan</b>
          </li>
          <li>frei von Zucker, frei von Zusätzen, 100% Kakao</li>
        </ul>
        <p className="mt-4">
          <b>Erlebe Fokus, Tiefe &amp; Präsenz – bei jeder Tasse.</b>
        </p>
      </div>
      <div className="flex items-center">
        <img
          className="w-full h-auto rounded-xl sm:mt-2"
          src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-muster.webp?v=1759179332"
          alt=""
        />
      </div>
    </div>
  );
}

function WurzelnSection() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <h2>Die Wurzeln von Crystal Cacao®</h2>
          <p>
            <b>Crystal Cacao®</b> stammt aus einer über{' '}
            <b>6.000 Jahre alten Kakaotradition</b> im peruanischen
            Amazonasgebiet. Unsere Partner bauen dort mit Sorgfalt und Achtung
            für Natur und Mensch den seltenen Edelkakao an, der die Basis für
            unseren <b>Kristall Kakao®</b> bildet.
          </p>
        </div>
        <div className="aspect-square overflow-hidden rounded-xl mt-2 mb-[10vh]">
          <img
            className="w-full h-full object-cover"
            src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01510_Kopie.webp?v=1759179020"
            alt=""
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-[10vh]!">
        <div className="aspect-square overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover bottom-[20px]!"
            src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/DSC01925.jpg?v=1764116026"
            alt=""
          />
        </div>
        <div className="flex flex-col justify-center">
          <ol className="list-decimal ml-6 flex flex-col gap-2">
            <li>Direkt &amp; fair gehandelt – von kleinen Familienbetrieben</li>
            <li>Nachhaltig angebaut in biodiverser Agroforstwirtschaft</li>
            <li>
              Verarbeitet bei niedrigen Temperaturen – für maximale
              Pflanzenkraft
            </li>
          </ol>
          <p className="mt-4">
            Jeder Schluck verbindet dich mit einer{' '}
            <b>6.000-jährigen Kakaotradition</b> – und mit den{' '}
            <b>Menschen, die ihn mit Hingabe anbauen.</b>
          </p>
        </div>
      </div>
    </div>
  );
}

function Zubereitung() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2>Zubereitung</h2>
      <p>
        1. 75 ml heißes Wasser oder Milch (max. 85 °C) <br />
        2. 15 g Crystal Cacao® dazugeben <br />
        3. Mit Milchaufschäumer schaumig rühren – fertig!
      </p>
    </div>
  );
}

function OnlineKurs() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2 className="text-center">Gratis Online Kurs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
        <div>
          <h3>
            Erfahre mehr über die Geheimnisse des Zeremonie Kakao und die
            richtige Anwendung.
          </h3>
        </div>
        <div className="aspect-video overflow-hidden rounded-xl">
          <img
            className="w-full h-auto"
            src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Mockup-Kakao-Zeremonie-Kurs-v2-2x-1024x599.jpg_1_1.webp?v=1760876274"
            alt="Kurs Kakao Zeremonie" 
          />
        </div>
      </div>
    </div>
  );
}

function KursRegistration() {
  return (
    <div className="my-[100px]! border-y! border-y-[#00000032]! py-[5vh]!">
      <div className="NormalSectionSize grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-4">
          <h2>Jetzt kostenfrei mitmachen!</h2>
          <ActiveCampaignForm formId="21" />
          <p className="text-sm! text-gray-500">
            *Deine Eintragung ist absolut unverbindlich. Wenn dir der Kurs nicht
            gefällt, kannst du dich jederzeit mit nur einem Klick wieder
            austragen und du erhältst keine weiteren E-mails von uns.
          </p>
        </div>
        <div className="aspect-video overflow-hidden rounded-xl">
          <img 
            className="w-full h-full object-cover"
            src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/Mockup-Kakao-Zeremonie-Kurs-v2-2x-1024x599.jpg_1_1.webp?v=1760876274"
            alt="Kurs Kakao Zeremonie"
          />
        </div>
      </div>
    </div>
  );
}

const videos = [
  {
    src: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001190-Kopie-1024x589_jpg.webp?v=1666617198',
    alt: 'Bild von einer Frau mit QiOne und QiBracelet',
    title:
      'Video 1: Intuition erfahren - Raus aus dem Kopf, rein ins Herz! – 9 min',
    items: [
      'Was ist Intuition?',
      'Welchen Vorteil bringt dir das im Alltag?',
      'Was hat Zeremonie Kakao damit zu tun?',
    ],
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2022-07-26-qiblanco-berlin-1001239-Kopie-1024x591.jpg_1_cf7bfbf2-2e9f-4654-a51a-e0f2b618501f.webp?v=1679327538',
    alt: 'Kakao auf Brett',
    title: 'Video 2: Zeremonie Kakao – Was ist das?! – 8 min',
    items: [
      'Warum enthält er so viele Inhaltsstoffe?',
      'Wo kommt er her?',
      'Wie wird er hergestellt?',
    ],
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-ad-01_2.1.1-min.jpg_1_2b439bb6-ccde-4801-a43f-d36eb669cee5.webp?v=1679327670',
    alt: 'Kakao Kochen',
    title: 'Video 3: Die ZeremonieKakao Kur in der Anwendung – 8 min',
    items: [
      'Wie erwärmt man ihn richtig?',
      'Wie schont man die Inhaltsstoffe?',
      'Wie konsumiert man ihn?',
    ],
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/kakao-ad-03_4.2.1-min.jpg_1_329aa829-10d5-4d95-a779-1dd0a92d0397.webp?v=1679328304',
    alt: 'Ureinwohner Kakao',
    title:
      'Video 4: Einen Schritt tiefer – mit Zeremonie Kakao meditieren – 4 min',
    items: [
      'Warum überhaupt meditieren?',
      'Wie und wie lange?',
      'Welche Effekte bringt es mit sich?',
    ],
  },
];

function KursInhalt() {
  return (
    <div className="NormalSectionSize mt-[10vh]! mb-[10vh]!">
      <h2>Kursinhalt</h2>
      <h3>Videolektionen</h3>
      <div className="flex flex-col gap-6 mt-4">
        {videos.map((v, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center"
          >
            <div className="aspect-video overflow-hidden rounded-xl">
              <img
                className="w-full h-full object-cover"
                src={v.src}
                alt={v.alt}
              />
            </div>
            <div className="flex flex-col gap-2 sm:p-5">
              <h3>{v.title}</h3>
              <ul className="list-disc ml-5 flex flex-col gap-1">
                {v.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RitualSection() {
  return (
    <div className="NormalSectionSize">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center gap-3">
          <h2>Lust auf eine 28-tägige Reise?</h2>
          <div className="aspect-square overflow-hidden rounded-xl mt-2 block sm:hidden">
            <img
              className="w-full h-full object-cover"
              src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06493-1x1.webp?v=1764201756"
              alt=""
            />
          </div>
          <p>
            Mit nur <b>einer Tasse Crystal Cacao® am Tag</b> schaffst du dir
            einen festen Anker im Alltag – für mehr Achtsamkeit, Fokus und
            innere Balance.
          </p>
          <p>
            Mit nur einer Packung <b>Crystal Cacao®</b> startest du in deine{' '}
            <b>28-Tage-Achtsamkeitskur</b>. <br /> So funktioniert's:
          </p>
        </div>
        <div className="hidden sm:block aspect-square overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover"
            src="https://cdn.shopify.com/s/files/1/0279/3095/1750/files/2024-06-qiblanco-bali-06493.webp?v=1764201756"
            alt=""
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <p>
          <b>☕ Dein Ritual:</b>
          <br /> Täglich 15 g <b>Crystal Cacao®</b> mit heißem Wasser oder
          Milch zubereiten und bewusst genießen.
        </p>
        <p>
          <b>🌀 Dein Moment:</b>
          <br /> Verbinde die Tasse mit etwas, das dir guttut: Atmen, Journaling
          oder Stille.
        </p>
        <p>
          <b>✨ Dein Effekt:</b>
          <br /> Schon nach wenigen Tagen spürst du: Mehr Ruhe. Mehr Fokus. Mehr
          Kraft.
        </p>
        <p>
          <b>Warum 28 Tage?</b>
          <br /> Weil sich neue Gewohnheiten nach 4 Wochen fest verankern. So
          wird aus einer Tasse ein tägliches Ritual.
        </p>
      </div>
      <h2 className="mt-[10vh]!">Unsere Garantie:</h2>
      <p>
        <b>
          100 % Kakao. 0 % Risiko.
          <br />
          &nbsp;
          <br />
          ✔️ Wissenschaftlich analysiert
          <br />
          ✔️ Rückgabe innerhalb von 20 Tagen – auch angebrochen
          <br />
          ✔️ Bio-zertifiziert &amp; aromasicher verpackt
        </b>
      </p>
    </div>
  );
}
