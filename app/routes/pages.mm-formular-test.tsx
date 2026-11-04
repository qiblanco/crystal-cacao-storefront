// app/routes/pages.mm-formular-test.tsx
// Versteckte Testseite des Mail-Manager-Formulars auf crystal-cacao.com (Elina, GO vom 03.11.2026): nicht verlinkt, noindex,
// nicht in der Sitemap. Ersetzt kein bestehendes Formular. Der Browser sendet direkt an den Endpunkt, damit die echte
// Anmelde-IP im Einwilligungsnachweis steht. Die Formular-Route /api/mm-formular gibt es hier bewusst nicht (der Netzrand
// ließe sie nicht durch); die Seite braucht deshalb JavaScript, was für eine Testseite genügt.
// Rückbau: diese Datei und app/styles/mm-formular-test.css löschen, alles andere stört ohne Aufrufer nicht.
import {MailManagerFormular} from '../components/MailManagerFormular';
import * as F21 from '../components/formulare/KakaoKursNachbauCcEintragKakaoFormular';
import testseiteStyles from '../styles/mm-formular-test.css?url';

const ENDPUNKT = 'https://anmelden.dienst.qiblanco.com';

export function links() {
  return [{rel: 'stylesheet', href: testseiteStyles}];
}

export const meta = () => [
  {title: 'Formular-Test - Crystal Cacao'},
  {name: 'robots', content: 'noindex,nofollow'},
];

export function headers() {
  return {'X-Robots-Tag': 'noindex, nofollow'};
}

export default function MmFormularTest() {
  return (
    <div className="mm-testseite">
      <h1>Formular-Test</h1>
      <p className="mm-testseite__hinweis">
        Testseite für crystal-cacao.com: im Shop nicht verlinkt und in keiner Suchmaschine. Das Formular meldet echt über
        den Mail Manager an. Danach kommt die Bestätigungsmail.
      </p>
      <section className="mm-testseite__kachel" id={`formular-${F21.KONFIG.formularId}`}>
        <h2>Kakao-Kurs</h2>
        <p className="mm-testseite__kennung">Formular {F21.KONFIG.formularId} · Liste {F21.KONFIG.liste}</p>
        <MailManagerFormular konfig={F21.KONFIG} direkt={ENDPUNKT} />
      </section>
    </div>
  );
}
