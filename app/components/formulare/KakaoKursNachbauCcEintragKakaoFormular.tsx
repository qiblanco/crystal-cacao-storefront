// app/components/formulare/KakaoKursNachbauCcEintragKakaoFormular.tsx
// Mail-Manager-Formular „Kakao-Kurs (Nachbau cc-eintrag-kakao)“ (Formular-ID 21). Erzeugt im Reiter Formulare;
// nach einer Textaenderung dort neu kopieren (der Endpunkt nimmt eine veraltete Einwilligung nicht an).
import {MailManagerFormular, type MmFormularKonfig, type MmKlassen} from '../MailManagerFormular';

export const KONFIG: MmFormularKonfig = {
  "formularId": "21",
  "sprache": "de",
  "felder": [
    {
      "name": "email",
      "typ": "email",
      "label": "name@beispiel.de",
      "pflicht": true
    },
    {
      "name": "vorname",
      "typ": "text",
      "label": "Vorname",
      "pflicht": false
    }
  ],
  "titel": "",
  "hinweis": "",
  "knopf": "Zum Kurs anmelden",
  "einwilligung": "Ja, ich möchte den kostenlosen Kakao-Kurs und danach den Newsletter von Qi Blanco per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.",
  "einwilligungId": "3c0506138a25",
  "dankeTitel": "Noch ein Klick in deinem Postfach",
  "dankeText": "Wir haben dir eine E-Mail geschickt. Bestätige darin deine Adresse, dann bekommst du den Kurs.\nDie E-Mail kommt sofort. Schau auch im Spam-Ordner nach.",
  "erfolgsseite": "https://crystal-cacao.com/kurs-eintragung?stand=eingetragen",
  "liste": "Double-Optin - Kakaokurs",
  "tags": [
    "#kakao"
  ]
};

export function KakaoKursNachbauCcEintragKakaoFormular(props: {className?: string; klassen?: MmKlassen; style?: React.CSSProperties}) {
  return <MailManagerFormular konfig={KONFIG} {...props} />;
}

export default KakaoKursNachbauCcEintragKakaoFormular;

