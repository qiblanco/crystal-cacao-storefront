/**
 * COOKIE-ERKLÄRUNG — /pages/cookie-erklaerung auf crystal-cacao.com
 *
 * Z11 s03 (Grossjob 20261111-z11-cookiebot-leistungsparitaet-drei-laeden-traeger, Christian
 * 22.10.: „alles, was Cookiebot sonst noch anbietet“). Port der Seite aus dem Global
 * Deutsch-Shop (qiblanco-storefront app/routes/pages.cookie-erklaerung.jsx, BAUVERTRAG
 * Abschnitt 7), in der Gestalt der Rechtsseiten dieses Ladens (.cc-seite, .cc-rechtstext).
 *
 * Die Seite rendert NUR, was in app/data/cookie-register.json steht. Diese Datei kommt
 * aus dem Register des Einwilligungs-Scanners (einwilligung-scanner/register/cookies.yaml,
 * Fläche crystal), erzeugt mit export.baue(Register(), 'crystal', texte_js=<diese
 * einwilligung-texte.js>) — dasselbe wie `einwilligung-register-export --flaeche crystal
 * --texte app/lib/einwilligung-texte.js`. Nie hier von Hand nachtragen: ein neues Cookie
 * kommt ins Register, dann die Datei neu erzeugen. Titel und Beschreibung je Kategorie
 * sind der Wortlaut des Einstellungs-Dialogs.
 *
 * Angezeigte Fassung = die Fassung des Hinweises auf DIESEM Laden (EINWILLIGUNG_FASSUNG),
 * nicht die Register-Fassung des Deutsch-Shops (flaechen.yaml: crystal fassung false).
 */
import {Link} from 'react-router';
import {canonicalLink} from '~/lib/seo';
import {EINWILLIGUNG_FASSUNG} from '~/lib/einwilligung-texte';
import register from '~/data/cookie-register.json';

const PFAD = '/pages/cookie-erklaerung';
const TITEL = 'Cookie-Erklärung | Crystal Cacao';

export const meta = () => [
  {title: TITEL},
  {
    name: 'description',
    content:
      'Welche Cookies crystal-cacao.com setzt: wer sie setzt, wozu und wie lange sie bleiben. Mit Knopf zum Ändern deiner Cookie-Wahl.',
  },
  // Nicht in den Index: eine Cookie-Liste beantwortet keine Suchfrage. Erreichbar über den
  // Cookie-Hinweis, den Dialog und den Fuß jeder Seite.
  {name: 'robots', content: 'noindex,nofollow'},
  canonicalLink(PFAD),
];

export function loader() {
  return {};
}

const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

/** "2026-11-11" -> "11. November 2026" (ohne Date: keine Zeitzonen-Verschiebung). */
function datumLang(iso) {
  const [j, m, t] = String(iso || '').split('-').map(Number);
  if (!j || !m || !t) return iso;
  return `${t}. ${MONATE[m - 1]} ${j}`;
}

/* Der Motor (qb-einwilligung.js) laedt verzoegert. Ein Tipp davor geht nicht verloren:
   der Dialog oeffnet, sobald der Motor da ist (load feuert nach den verzoegerten Skripten). */
function oeffneEinwilligung() {
  if (window.qbEinwilligung) {
    window.qbEinwilligung.oeffneEinstellungen();
    return;
  }
  window.addEventListener(
    'load',
    () => window.qbEinwilligung && window.qbEinwilligung.oeffneEinstellungen(),
    {once: true},
  );
}

function KategorieTabelle({kategorie}) {
  if (!kategorie.cookies.length) {
    return <p className="ce-leer">Auf crystal-cacao.com gibt es derzeit kein Cookie dieser Art.</p>;
  }
  return (
    <table className="ce-tabelle">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Anbieter</th>
          <th scope="col">Zweck</th>
          <th scope="col">Laufzeit</th>
        </tr>
      </thead>
      <tbody>
        {kategorie.cookies.map((c) => (
          <tr key={`${c.anbieter}-${c.name}`}>
            <td data-spalte="Name">
              <code>{c.name}</code>
            </td>
            <td data-spalte="Anbieter">{c.anbieter}</td>
            <td data-spalte="Zweck">{c.zweck}</td>
            <td data-spalte="Laufzeit">{c.laufzeit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CookieErklaerungPage() {
  const anzahl = register.kategorien.reduce((n, k) => n + k.cookies.length, 0);
  return (
    <div className="policy cc-seite cc-seite--text ce-seite">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>
      <div className="cc-rechtstext">
        <h1>Cookie-Erklärung</h1>
        <p className="ce-meta">
          Stand: {datumLang(register.stand)} · Fassung {EINWILLIGUNG_FASSUNG} · {anzahl} Cookies
        </p>

        <section className="ce-einstieg">
          <p>
            Hier stehen die Cookies, die unser Cookie-Register für crystal-cacao.com führt: wer
            sie setzt, wozu und wie lange sie bleiben. Welche Kategorien du erlaubst, entscheidest du im Cookie-Hinweis.
            Notwendige Cookies sind immer aktiv.
          </p>
          <p>Deine Wahl kannst du jederzeit ändern:</p>
          <button
            type="button"
            className="cc-knopf ce-knopf"
            data-qb-wahl="einstellungen"
            onClick={oeffneEinwilligung}
          >
            Cookie-Einstellungen
          </button>
          <p className="ce-hinweis">
            Diese Liste entsteht aus unserem Cookie-Register. Ein Scan prüft regelmäßig alle
            Seiten des Shops und meldet uns jedes Cookie, das hier noch fehlt. Wie wir mit deinen
            Daten umgehen, steht in der <Link to="/pages/datenschutz">Datenschutzerklärung</Link>.
          </p>
        </section>

        {register.kategorien.map((k) => (
          <section key={k.id} id={`kategorie-${k.id}`} className="ce-kategorie">
            <h2>{k.titel}</h2>
            <p>{k.beschreibung}</p>
            <KategorieTabelle kategorie={k} />
          </section>
        ))}
      </div>
    </div>
  );
}
