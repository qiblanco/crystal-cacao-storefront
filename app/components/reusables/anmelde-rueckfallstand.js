// RÜCKFALLSTAND DER ANMELDEWEICHE — Elina EL-20261110-5a9e5746, Punkt 3: "Künftig Formulare/Neueinsteiger nie
// mehr an den AC-Stopp koppeln." Antwortet der Anmelde-Endpunkt (GET /w) nicht, zu spät oder kaputt, zeigt die
// Weiche für diese Formulare das EIGENE Formular mit dem Satz von hier, nie mehr das ActiveCampaign-Formular.
//
// WARUM EINE KOPIE HIER TRÄGT: einwilligung_id ist sha256(Satz mit einfachen Leerzeichen)[:12], genau wie
// ac-eingang/src/formulare.py einwilligung_id(). Der Endpunkt prüft die mitgeschickte Kennung gegen den Satz in
// formulare.yaml und nimmt bei Abweichung NICHT an (409 einwilligung_veraltet). Ein veralteter Rückfallsatz kann
// also nie als Nachweis gespeichert werden; er kostet höchstens einen zweiten Klick. Ohne Kennung kein Satz:
// fehlt sie (oder passt sie nicht zum Satz), zeigt die Weiche eine Hinweiszeile statt eines Formulars.
//
// ABGEGLICHEN mit formulare.yaml über GET /w am STAND unten. Abgleich stehend:
// ac-eingang/pruefungen/probe_storefront_rueckfallstand.py (exit 1 = ein Satz weicht ab). Wer einen
// Einwilligungssatz in formulare.yaml ändert, zieht diesen Stand nach (Werte 1:1 aus /w).
export const RUECKFALL_STAND = '2026-11-11T09:45:07Z';

export const RUECKFALL_ANZEIGE = {
  13: {
    sprache: 'de',
    einwilligung:
      'Ja, ich möchte den kostenlosen Superhuman-Kurs und danach den Newsletter von Qi Blanco per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.',
    einwilligung_id: 'fed19f9d6fb4',
    knopf: 'Kurs jetzt starten',
    vorname_feld: 'Vorname',
  },
  15: {
    sprache: 'de',
    einwilligung:
      'Ja, ich möchte den Newsletter von Qi Blanco per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.',
    einwilligung_id: 'c656c0c34890',
    knopf: 'Jetzt anmelden',
    vorname_feld: 'Vorname',
  },
  21: {
    sprache: 'de',
    einwilligung:
      'Ja, ich möchte den kostenlosen Kakao-Kurs und danach den Newsletter von Qi Blanco per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.',
    einwilligung_id: '3c0506138a25',
    knopf: 'Kurs jetzt starten',
    vorname_feld: 'Vorname',
  },
  25: {
    sprache: 'en',
    einwilligung:
      'Yes, I want the exclusive Black Friday pre-access and then the Qi Blanco newsletter by email. I can unsubscribe at any time with one click.',
    einwilligung_id: '9c0312f8f8bc',
    knopf: "Get access now (it's free)",
    vorname_feld: 'Full name',
  },
  27: {
    sprache: 'de',
    einwilligung:
      'Ja, ich möchte den exklusiven Vorab-Zugang zu Black Friday und danach den Newsletter von Qi Blanco per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.',
    einwilligung_id: '306b8446a221',
    knopf: 'Jetzt sofort Zugriff erhalten!',
    vorname_feld: 'Vorname',
  },
  33: {
    sprache: 'de',
    einwilligung:
      'Mit der Anmeldung bekommst du unsere E-Mails: jede Woche die Einladung zu Coming Home und Neuigkeiten von Qi Blanco. Du bestätigst deine Adresse per E-Mail und kannst dich jederzeit mit einem Klick abmelden.',
    einwilligung_id: '7ae4e5ca7aad',
    knopf: 'Anmelden und Link bekommen',
    vorname_feld: 'Dein Name',
  },
  7: {
    sprache: 'en',
    einwilligung:
      'Yes, I want the Qi Blanco newsletter by email. I can unsubscribe at any time with one click.',
    einwilligung_id: '686815e84d9b',
    knopf: 'Subscribe',
    vorname_feld: 'First name',
  },
  9: {
    sprache: 'en',
    einwilligung:
      'Yes, I want the free 5-day course and then the Qi Blanco newsletter by email. I can unsubscribe at any time with one click.',
    einwilligung_id: '0eccba7ce557',
    knopf: 'Start the course',
    vorname_feld: 'First name',
  },
  'cc-21': {
    sprache: 'de',
    einwilligung:
      'Ja, ich möchte den kostenlosen Kakao-Kurs und danach den Newsletter von Crystal Cacao per E-Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.',
    einwilligung_id: '004f08b27a56',
    knopf: 'Zum Kurs anmelden',
    vorname_feld: 'Vorname',
  },
};
