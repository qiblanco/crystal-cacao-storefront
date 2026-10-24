// app/routes/api.mm-formular.tsx
// Eigene Route für alle Mail-Manager-Formulare: nimmt den POST der Komponente an und gibt ihn serverseitig an
// den Mail-Manager-Endpunkt weiter (kein CORS, kein Skript im Browser, funktioniert auch ohne JavaScript).
import {data, redirect, type ActionFunctionArgs} from 'react-router';

const ENDPUNKT = 'https://anmelden.65-108-150-121.sslip.io';
const KENNUNG = /^[A-Za-z0-9-]{1,20}$/;
const ERLAUBTE_ZIELE = /^https:\/\/(www\.|us\.)?(qiblanco\.com|qi-blanco\.com|crystal-cacao\.com)(\/|$)/;

export async function action({request}: ActionFunctionArgs) {
  const f = await request.formData();
  const w = (k: string, n = 300) => String(f.get(k) ?? '').slice(0, n);
  const id = w('formular_id', 20);
  const ohneJs = !w('dauer_ms');
  const antworte = (ok: boolean, weiter: string, fehler = '') => {
    if (!ohneJs) return data({ok, fehler, weiter: ok && weiter ? weiter : undefined}, {status: ok ? 200 : 400});
    const herkunft = request.headers.get('Referer') || '/';
    return redirect(ok && weiter ? weiter : herkunft.split('#')[0] + (herkunft.includes('?') ? '&' : '?') +
      'mm-formular=' + (ok ? 'danke' : 'fehler'));
  };
  if (!KENNUNG.test(id)) return antworte(false, '', 'formular_unbekannt');
  // Zeitpruefung: Anzeigedauer aus dem Browser (mit JS) oder Renderzeit des Servers (ohne JS) -> Zeitstempel
  // in Serverzeit, wie ihn der Endpunkt prueft (zu schnell, zu alt, Zukunft = Automat).
  const dauer = Number(w('dauer_ms', 12));
  const t = Number.isFinite(dauer) && dauer > 0 ? Date.now() - dauer : Number(w('angezeigt', 16));
  const vorname = [w('vorname', 80), w('nachname', 80)].filter(Boolean).join(' ');
  const erfolg = w('erfolgsseite');
  const nutzlast = {
    email: w('email', 200), vorname, website: w('website', 200), t: String(Math.round(t || 0)),
    einwilligung_id: w('einwilligung_id', 20), seite: new URL(request.headers.get('Referer') || request.url).pathname,
    formular_id: id, liste: w('liste', 120), tags: w('tags', 300), erfolgsseite: erfolg,
  };
  let antwort: {ok?: boolean; fehler?: string} = {};
  let status = 0;
  try {
    const r = await fetch(`${ENDPUNKT}/f/${encodeURIComponent(id)}`, {
      method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(nutzlast), signal: AbortSignal.timeout(8000),
    });
    status = r.status;
    antwort = await r.json().catch(() => ({}));
  } catch {
    // Netz/Endpunkt weg: KEIN automatischer Zweitversuch (er wäre eine doppelte Anmeldung).
    return antworte(false, '', 'nicht_erreichbar');
  }
  if (antwort.ok) return antworte(true, ERLAUBTE_ZIELE.test(erfolg) ? erfolg : '');
  return antworte(false, '', antwort.fehler || (status === 429 ? 'zu_viele_anfragen' : 'fehler'));
}

// Kein GET: die Route ist nur ein Ziel für Formulare.
export async function loader() {
  return new Response('Nicht gefunden', {status: 404});
}

