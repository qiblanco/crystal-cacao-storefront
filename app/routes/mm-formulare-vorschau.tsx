// app/routes/mm-formulare-vorschau.tsx
// Pruefseite der Mail-Manager-Formulare fuer crystal-cacao.com (Elina EL-20261023-d0d76dd3).
// NICHT verlinkt, noindex. Ersetzt keine bestehende Seite und kein bestehendes AC-Formular:
// sie zeigt nur die Nachbauten nebeneinander, damit Elina sie vor dem GO ansehen und absenden kann.
// Rueckbau: diese Datei, app/styles/mm-formulare-vorschau.css und die Dateien unter
// app/components/formulare/ loeschen (Komponente und Route stoeren ohne Aufrufer nicht).
import * as F21 from '../components/formulare/KakaoKursNachbauCcEintragKakaoFormular';
import vorschauStyles from '../styles/mm-formulare-vorschau.css?url';

export function links() {
  return [{rel: 'stylesheet', href: vorschauStyles}];
}

export const meta = () => [
  {title: 'Vorschau Anmeldeformular - Crystal Cacao'},
  {name: 'robots', content: 'noindex,nofollow'},
];

export function headers() {
  return {'X-Robots-Tag': 'noindex, nofollow'};
}

// Liste und Formular-ID kommen aus der Konfiguration des Formulars selbst.
const FORMULARE = [
  {name: 'Kakao-Kurs', m: F21, Formular: F21.KakaoKursNachbauCcEintragKakaoFormular},
];

export default function MmFormulareVorschau() {
  return (
    <div className="mm-vorschau">
      <h1>Anmeldeformular aus dem Mail Manager</h1>
      <p className="mm-vorschau__hinweis">
        Vorschau für crystal-cacao.com: im Shop nicht verlinkt und in keiner Suchmaschine. Das Formular meldet echt an.
        Danach kommt die Bestätigungsmail.
      </p>
      {FORMULARE.map((f) => (
        <section key={f.m.KONFIG.formularId} className="mm-vorschau__kachel" id={`formular-${f.m.KONFIG.formularId}`}>
          <h2>{f.name}</h2>
          <p className="mm-vorschau__kennung">Formular {f.m.KONFIG.formularId} · Liste {f.m.KONFIG.liste}</p>
          <f.Formular />
        </section>
      ))}
    </div>
  );
}
