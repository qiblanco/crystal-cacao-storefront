/**
 * Datenschutzerklärung für crystal-cacao.com.
 *
 * WOHER DER TEXT KOMMT: Zeichen für Zeichen aus dem gepflegten und
 * freigegebenen Bestand des Schwester-Ladens —
 * `qiblanco-storefront:app/routes/pages.datenschutz.jsx` (origin/main 389dab8,
 * zuletzt inhaltlich 9946cc3 vom 2026-08-16). Er wurde NICHT neu formuliert;
 * diese Datei ist eine Kopie mit genau vier deklarierten Abweichungen (Bau-
 * skript im Job-Ordner, jede Ersetzung fail-closed verifiziert):
 *   1. Import/Rahmen: statt der `Rechtsseite`-Komponente des Schwester-Repos
 *      der hier bereits vorhandene Rechtstext-Rahmen (`cc-seite cc-seite--text`
 *      + `cc-rechtstext`), den `policies.$handle.jsx` ebenso benutzt.
 *   2. Titel/Beschreibung auf diesen Laden.
 *   3. Canonical über `canonicalLink()` — CANONICAL_ORIGIN ist hier
 *      crystal-cacao.com, der Verweis zeigt also nicht auf den Schwester-Laden.
 *   4. Ziffer 5 (Hosting): die EINZIGE inhaltliche Abweichung. Die Vorlage
 *      nennt Shopify-„Oxygen"-Hosting. Das ist für DIESE Domain sachlich
 *      falsch: crystal-cacao.com zeigt auf 65.108.150.121 (Hetzner, Helsinki)
 *      und wird von unserem eigenen Node-Prozess hinter Caddy ausgeliefert —
 *      die Server-Logfiles entstehen bei uns, nicht bei Shopify. Der Shop-
 *      Betrieb (Bestellungen, Kasse) bleibt Shopify und steht deshalb weiter da.
 *
 * WARUM ES DIESE SEITE GIBT (Job 20260910-crystal-cacao-dse-ist-alter-
 * generatortext-jameda-patienten): der Footer verlinkte als
 * Datenschutzerklärung `/policies/privacy-policy` — den Shopify-Rechtstext des
 * geteilten Stores `qi-blanco.myshopify.com`. Das ist ein alter Generatortext
 * (78 528 Zeichen), der „Jameda" nennt und von „Patienten" spricht. Er lässt
 * sich von hier aus nicht heilen: dafür bräuchte es den Shopify-Scope
 * `write_legal_policies` (fehlt serverweit), und derselbe Text hängt auch am
 * Schwester-Laden. Der Fix-Ort ist deshalb diese Route, nicht der fremde Text.
 *
 * NICHT ENTHALTEN, BEWUSST (Freigabe-Punkt Christian, siehe RESULT des Jobs):
 * UpPromote (Affiliate-Tracking, läuft auf dieser Domain) und die
 * YouTube-nocookie-Einbettungen sind hier NICHT deklariert. Beide bräuchten
 * einen NEUEN Absatz, und neuen Rechtstext zu formulieren ist keine
 * Server-Entscheidung. Bis zur Freigabe ist das eine bekannte Unter-
 * Deklaration und als solche gemeldet.
 */
import {Link} from 'react-router';
import {canonicalLink} from '~/lib/seo';
import {ABSENDER_MARKE} from '~/lib/kakao-zone';

export const meta = () => [
  {title: `Datenschutzerklärung | ${ABSENDER_MARKE}`},
  {
    name: 'description',
    content:
      'Datenschutzerklärung für crystal-cacao.com — Qi Blanco UG (haftungsbeschränkt)',
  },
  canonicalLink('/pages/datenschutz'),
];

export function loader() {
  return {};
}

export default function DatenschutzPage() {
  return (
    <div className="policy cc-seite cc-seite--text">
      <p className="cc-zurueck">
        <Link to="/">← Zurück zum Shop</Link>
      </p>
      <div className="cc-rechtstext">
        <h1>Datenschutzerklärung</h1>

      <p>
        Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie
        gemäß Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) darüber, welche
        personenbezogenen Daten wir beim Besuch unserer Website und bei der Abwicklung von
        Bestellungen verarbeiten, zu welchen Zwecken und auf welcher Rechtsgrundlage dies geschieht
        und welche Rechte Ihnen zustehen. <strong>Stand: August 2026.</strong>
      </p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Qi Blanco UG (haftungsbeschränkt)<br />
          Vertreten durch: Dipl.-Ing. Christian Bernd Bauer<br />
          Brunnrangenstr. 25, 97711 Maßbach, Deutschland<br />
          E-Mail: <a href="mailto:info@qiblanco.com">info@qiblanco.com</a><br />
          Handelsregister: Amtsgericht Schweinfurt, HRB 7306
        </p>
        <p>
          Einen Datenschutzbeauftragten haben wir nicht bestellt, da die gesetzlichen
          Voraussetzungen hierfür (Art. 37 DSGVO, § 38 BDSG) auf uns nicht zutreffen. Bei Fragen zum
          Datenschutz erreichen Sie uns unter der oben genannten E-Mail-Adresse.
        </p>
      </section>

      <section>
        <h2>2. Arten der verarbeiteten Daten</h2>
        <ul>
          <li>Bestandsdaten (z. B. Namen, Adressen)</li>
          <li>Kontaktdaten (z. B. E-Mail-Adressen, Telefonnummern)</li>
          <li>Inhaltsdaten (z. B. Texteingaben, Nachrichten)</li>
          <li>Vertrags- und Bestelldaten (z. B. bestellte Produkte, Bestellhistorie)</li>
          <li>Nutzungsdaten (z. B. besuchte Seiten, Zugriffszeiten, Klick- und Verweildaten)</li>
          <li>Meta-/Kommunikationsdaten (z. B. IP-Adressen, Geräte-/Browserinformationen)</li>
          <li>Zahlungsdaten (z. B. Zahlungsart, Zahlungshistorie)</li>
        </ul>
      </section>

      <section>
        <h2>3. Zwecke der Verarbeitung</h2>
        <ul>
          <li>Bereitstellung der Website und ihrer Funktionen</li>
          <li>Abwicklung von Bestellungen und Vertragserfüllung</li>
          <li>Beantwortung von Kontakt- und Supportanfragen</li>
          <li>Versand von Newslettern (nur mit Einwilligung)</li>
          <li>Sicherheit, Missbrauchsprävention und Stabilität</li>
          <li>Reichweitenmessung, Optimierung und Marketing (nur mit Einwilligung)</li>
          <li>
            Ausschluss bestehender Kundinnen und Kunden von Neukunden-Werbung
            (Werbe-Unterdrückung, siehe Ziffer 9)
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Rechtsgrundlagen</h2>
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage der DSGVO. Soweit wir
          Informationen auf Ihrem Endgerät speichern oder auslesen (z. B. Cookies), erfolgt dies
          zusätzlich auf Grundlage von § 25 TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz).
        </p>
        <ul>
          <li>Art. 6 Abs. 1 lit. a DSGVO – Einwilligung (z. B. Cookies, Tracking, Newsletter)</li>
          <li>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung/vorvertragliche Maßnahmen</li>
          <li>Art. 6 Abs. 1 lit. c DSGVO – Erfüllung rechtlicher Verpflichtungen</li>
          <li>Art. 6 Abs. 1 lit. f DSGVO – Berechtigte Interessen (z. B. sicherer Betrieb)</li>
          <li>§ 25 Abs. 1 TDDDG – Einwilligung für den Zugriff auf Endgeräte-Informationen</li>
        </ul>
      </section>

      <section>
        <h2>5. Hosting und Bereitstellung der Website (Server-Logfiles)</h2>
        <p>
          Diese Website (<strong>crystal-cacao.com</strong>) wird auf einem von uns angemieteten
          Server der <strong>Hetzner Online GmbH</strong> (Industriestraße 25, 91710 Gunzenhausen,
          Deutschland) im Rechenzentrum Helsinki (Finnland) und damit innerhalb der EU
          bereitgestellt. Beim Aufruf der Website werden durch den Browser automatisch übermittelte
          Daten in Server-Logfiles verarbeitet (IP-Adresse, Datum/Uhrzeit, aufgerufene Seite,
          Referrer, Browser-/Betriebssystem-Informationen). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
          DSGVO (berechtigtes Interesse an einem sicheren, stabilen Betrieb) sowie Art. 6 Abs. 1
          lit. b DSGVO für die Vertragsabwicklung im Shop.
        </p>
        <p>
          Der Shop-Betrieb selbst — Produkt- und Bestelldaten sowie die Kasse
          (<strong>checkout.qiblanco.com</strong>) — läuft auf der E-Commerce-Infrastruktur der{' '}
          <strong>Shopify International Ltd.</strong> (Victoria Buildings, 1–2 Haddington Road,
          Dublin 4, Irland) bzw. <strong>Shopify Inc.</strong> (Kanada). Für Übermittlungen nach
          Kanada besteht ein Angemessenheitsbeschluss der EU-Kommission (Art. 45 DSGVO); für
          etwaige Verarbeitungen in den USA gelten die unter Ziffer 12 genannten Garantien. Mit
          Shopify besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).
        </p>
      </section>

      <section>
        <h2>6. Bestellung und Zahlungsabwicklung</h2>
        <p>
          Zur Abwicklung von Bestellungen verarbeiten wir die von Ihnen angegebenen Bestands-,
          Kontakt- und Zahlungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Die
          Zahlungsabwicklung erfolgt über die von Ihnen gewählten Zahlungsdienstleister (z. B.
          Shopify Payments, PayPal, Kreditkarten- und Ratenkauf-Anbieter); die dabei erhobenen
          Zahlungsdaten werden von den jeweiligen Anbietern eigenverantwortlich verarbeitet. An
          Versand- und Logistikdienstleister sowie ggf. an Steuerberater und Behörden geben wir
          Daten weiter, soweit dies zur Vertragserfüllung bzw. zur Erfüllung rechtlicher Pflichten
          erforderlich ist (Art. 6 Abs. 1 lit. b und lit. c DSGVO).
        </p>
      </section>

      <section>
        <h2>7. Cookies und Einwilligungsverwaltung</h2>
        <p>
          Unsere Website verwendet Cookies und vergleichbare Technologien. Technisch notwendige
          Cookies, die für den Betrieb und die Bestellabwicklung erforderlich sind, setzen wir auf
          Grundlage von § 25 Abs. 2 TDDDG und Art. 6 Abs. 1 lit. f DSGVO ohne Einwilligung ein. Alle
          nicht notwendigen Cookies sowie Statistik- und Marketing-Dienste werden erst nach Ihrer
          Einwilligung gesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
        </p>
        <p>
          Zur Verwaltung Ihrer Einwilligung nutzen wir die Consent-Management-Plattform{' '}
          <strong>Cookiebot</strong> der Usercentrics A/S (Havnegade 39, 1058 Kopenhagen, Dänemark).
          Cookiebot dokumentiert und verwaltet Ihre Einwilligung; die Verarbeitung erfolgt innerhalb
          der EU. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über die
          Cookie-Einstellungen auf unserer Website widerrufen oder anpassen.
        </p>
      </section>

      <section>
        <h2>8. Reichweitenmessung und Analyse</h2>
        <p>
          <strong>a) Einwilligungsbasierte Analyse.</strong> Die folgenden Dienste werden
          ausschließlich nach Ihrer Einwilligung (Kategorie „Statistik") geladen. Rechtsgrundlage
          ist Art. 6 Abs. 1 lit. a DSGVO i. V. m. § 25 Abs. 1 TDDDG.
        </p>
        <ul>
          <li>
            <strong>Google Tag Manager, Google Analytics 4</strong> (Google Ireland Ltd., Gordon
            House, Barrow Street, Dublin 4, Irland; Google LLC, USA): Verwaltung von Tags sowie
            pseudonyme Reichweitenmessung. Wir setzen den <em>Google Consent Mode v2</em> ein; ohne
            Einwilligung werden keine Analyse-Cookies gesetzt (Standardzustand „denied"). Eine
            Übermittlung an Google LLC in den USA ist möglich (siehe Ziffer 12).
          </li>
          <li>
            <strong>Microsoft Clarity</strong> (Microsoft Corporation, One Microsoft Way, Redmond,
            USA): Analyse des Nutzungsverhaltens (u. a. Heatmaps, Sitzungsaufzeichnungen in
            pseudonymer Form) zur Verbesserung der Website. Übermittlung in die USA möglich
            (siehe Ziffer 12).
          </li>
          <li>
            <strong>Hotjar</strong> (Hotjar Ltd., Malta – Teil der Contentsquare-Gruppe): Erstellung
            von Heatmaps und pseudonymen Nutzungsanalysen. Der Anbieter hat seinen Sitz in der EU;
            soweit Sub-Auftragsverarbeiter in den USA eingesetzt werden, gelten die Garantien nach
            Ziffer 12.
          </li>
          <li>
            <strong>Eigene First-Party-Reichweitenmessung (qpx):</strong> Wir betreiben eine selbst
            gehostete Analyse-Lösung auf einem eigenen Server innerhalb der EU. Diese identifizierte
            Ebene (u. a. eine pseudonyme Kennung und Seiten-/Abschnittsnutzung) wird ebenfalls nur
            nach Ihrer Einwilligung aktiv. Eine Übermittlung an Dritte oder in Drittländer findet
            hierbei nicht statt.
          </li>
        </ul>
        <p>
          Mit den genannten externen Anbietern bestehen Auftragsverarbeitungsverträge nach
          Art. 28 DSGVO.
        </p>
        <p>
          <strong>b) Einwilligungsfreie Basis-Reichweitenmessung (cookielos).</strong> Zusätzlich
          setzen wir eine selbst betriebene, cookielose Basis-Messung ein, um die grundsätzliche
          Reichweite und Herkunft der Zugriffe zu verstehen. Diese Messung <em>setzt und liest
          keine Cookies</em> und greift <em>nicht</em> auf Informationen in Ihrem Endgerät zu (kein
          Local-/Session-Storage, kein Fingerprint, keine persistente Besucher-ID); sie fällt daher
          nicht unter die Einwilligungspflicht des § 25 TDDDG. Verarbeitet werden nur Daten, die Ihr
          Browser ohnehin übermittelt (aufgerufene Seite ohne Suchparameter, Referrer, grobe
          Herkunfts-/Werbeplattform-Klasse). Eine Unterscheidung von Besuchen entsteht erst
          serverseitig aus einem <em>täglich wechselnden, anschließend verworfenen</em> Prüfwert;
          eine Wiedererkennung über den Tag hinaus ist nicht möglich. Rechtsgrundlage ist unser
          berechtigtes Interesse an einer datensparsamen Reichweitenmessung (Art. 6 Abs. 1 lit. f
          DSGVO); die zugrunde liegende Interessenabwägung haben wir dokumentiert. Sie können dieser
          Verarbeitung jederzeit nach Art. 21 DSGVO widersprechen (Kontakt siehe Ziffer 1); die
          Verarbeitung erfolgt ausschließlich auf unserem Server in der EU, eine Weitergabe an
          Dritte findet nicht statt.
        </p>
      </section>

      <section>
        <h2>9. Marketing und Conversion-Messung</h2>
        <p>
          Die folgenden Dienste werden ausschließlich nach Ihrer Einwilligung (Kategorie
          „Marketing") aktiv. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO i. V. m.
          § 25 Abs. 1 TDDDG.
        </p>
        <ul>
          <li>
            <strong>Google Ads</strong> (Google Ireland Ltd. / Google LLC, USA): Messung des Erfolgs
            unserer Werbeanzeigen (Conversion-Tracking) und Remarketing. Wir nutzen den Google
            Consent Mode v2; werbebezogene Cookies (u. a. <code>ad_storage</code>) werden erst nach
            Einwilligung gesetzt.
          </li>
          <li>
            <strong>Meta (Facebook/Instagram)</strong> (Meta Platforms Ireland Ltd., 4 Grand Canal
            Square, Dublin 2, Irland; Meta Platforms Inc., USA): Messung von Werbe-Conversions.
            Diese erfolgt überwiegend serverseitig über die Meta Conversions API (CAPI), bei der wir
            ausgewählte Ereignisdaten (z. B. zu einer Bestellung) an Meta übermitteln; eine
            Zuordnung erfolgt einwilligungsbasiert. Für ein etwaiges browserseitiges Meta-Pixel gilt
            die vorherige Einwilligung nach § 25 Abs. 1 TDDDG. Soweit gemeinsame Verarbeitung
            vorliegt, besteht mit Meta eine Vereinbarung nach Art. 26 DSGVO.
          </li>
        </ul>

        <h3>
          Abgleich zur Werbe-Unterdrückung (Ausschlusslisten)
        </h3>
        <p>
          Unabhängig von den vorstehenden, einwilligungsbasierten Diensten übermitteln wir
          E-Mail-Adressen unserer Kundinnen und Kunden ausschließlich in kryptografisch gehashter
          Form (SHA-256) – also nicht im Klartext – an <strong>Meta Platforms Ireland Ltd.</strong>
          {' '}Meta gleicht diesen Hashwert mit den dort vorhandenen Nutzerkonten ab, und zwar allein
          zu dem Zweck, Ihnen keine Werbung mehr anzuzeigen, die sich an Neukundinnen und Neukunden
          richtet. Die Liste dient ausschließlich der <strong>Unterdrückung</strong> von Werbung,
          nicht deren Ausspielung: Wir bilden daraus weder Zielgruppen noch ähnliche Zielgruppen
          („Lookalike"), und wir reichern sie nicht mit weiteren Daten an.
        </p>
        <p>
          Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO,
          bestehende Kundinnen und Kunden nicht mit für sie unpassender Werbung anzusprechen und den
          Werbedruck zu verringern. Über das rechtlich Gebotene hinaus berücksichtigen wir dabei
          ausschließlich Personen, die dem Erhalt von E-Mail-Werbung zugestimmt haben.
        </p>
        <p>
          Sie können dieser Übermittlung jederzeit widersprechen (Art. 21 DSGVO) – formlos an{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a> oder durch Abmeldung vom
          Newsletter. Nach einer Abmeldung wird Ihre Adresse nicht erneut übermittelt; auf Ihr
          Verlangen entfernen wir zusätzlich den bereits übermittelten Hashwert aus der Zielgruppe
          bei Meta. Für die Übermittlung in die USA gilt Ziffer 12 entsprechend.
        </p>
      </section>

      <section>
        <h2>10. Kundensupport-Chat (Gorgias)</h2>
        <p>
          Für Support- und Kontaktanfragen setzen wir das Helpdesk- und Chat-System von{' '}
          <strong>Gorgias Inc.</strong> (USA) ein. Wenn Sie den Chat nutzen oder uns kontaktieren,
          verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung Ihres Anliegens.
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertrag/vorvertragliche Kommunikation)
          bzw. Art. 6 Abs. 1 lit. f DSGVO (effiziente Kundenkommunikation). Eine Übermittlung in die
          USA erfolgt auf Grundlage der EU-Standardvertragsklauseln (siehe Ziffer 12).
        </p>
      </section>

      <section>
        <h2>11. Newsletter und E-Mail-Marketing</h2>
        <p>
          Für den Versand von Newslettern und die Verwaltung von Anmeldeformularen nutzen wir{' '}
          <strong>ActiveCampaign, LLC</strong> (USA). Melden Sie sich über ein Newsletter-Formular
          auf unserer Website an, erfolgt die Anmeldung im Double-Opt-In-Verfahren: Sie erhalten
          eine Bestätigungs-E-Mail, mit der Sie den Empfang aktiv bestätigen. Haben Sie dagegen im
          Bestellvorgang das Feld für den Erhalt von E-Mails mit Neuigkeiten und Angeboten
          aktiviert, gilt Ihre dort erteilte Einwilligung unmittelbar (Single-Opt-In).
          Rechtsgrundlage ist in beiden Fällen Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO.
          Sie können den Newsletter jederzeit über den Abmeldelink in jeder E-Mail oder per
          Nachricht an uns abbestellen. Eine Übermittlung in die USA erfolgt nach den unter
          Ziffer 12 genannten Garantien.
        </p>
      </section>

      <section>
        <h2>12. Übermittlung in Drittländer (Art. 44–49 DSGVO)</h2>
        <p>
          Einige der von uns eingesetzten Dienste (insbesondere Google, Microsoft, Meta,
          ActiveCampaign und Gorgias) können personenbezogene Daten in Länder außerhalb der
          EU/des EWR – insbesondere in die USA – übermitteln. Für diese Übermittlungen stellen wir
          ein angemessenes Datenschutzniveau wie folgt sicher:
        </p>
        <ul>
          <li>
            <strong>EU-U.S. Data Privacy Framework (DPF):</strong> Soweit der US-Empfänger unter dem
            EU-U.S. Data Privacy Framework zertifiziert ist, erfolgt die Übermittlung auf Grundlage
            des Angemessenheitsbeschlusses der EU-Kommission vom 10. Juli 2023 (Art. 45 DSGVO). Dies
            betrifft nach unserem Kenntnisstand u. a. Google LLC, Microsoft Corporation und Meta
            Platforms Inc. Die jeweilige Zertifizierung kann unter{' '}
            <a href="https://www.dataprivacyframework.gov/" target="_blank" rel="noopener noreferrer">
              www.dataprivacyframework.gov
            </a>{' '}
            eingesehen werden.
          </li>
          <li>
            <strong>EU-Standardvertragsklauseln (SCC):</strong> Für Empfänger, die nicht (oder nicht
            nachweislich) unter dem DPF zertifiziert sind, stützen wir die Übermittlung auf die
            Standardvertragsklauseln der EU-Kommission (Durchführungsbeschluss (EU) 2021/914) nach
            Art. 46 Abs. 2 lit. c DSGVO. In Umsetzung des EuGH-Urteils „Schrems II" (C-311/18) führen
            wir bzw. unsere Auftragsverarbeiter ergänzend eine Risikobewertung des Drittlands
            (Transfer Impact Assessment) durch und treffen zusätzliche Schutzmaßnahmen (z. B.
            Verschlüsselung, Pseudonymisierung, vertragliche und organisatorische Maßnahmen gemäß den
            Empfehlungen des Europäischen Datenschutzausschusses 01/2020).
          </li>
        </ul>
        <p>
          Eine Kopie der Standardvertragsklauseln bzw. weitere Informationen zu den getroffenen
          Garantien erhalten Sie auf Anfrage unter{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>. Bitte beachten Sie, dass trotz
          dieser Garantien in Drittländern (insbesondere den USA) ein Zugriff staatlicher Stellen auf
          Daten nicht vollständig ausgeschlossen werden kann. Soweit erforderlich, holen wir Ihre
          ausdrückliche Einwilligung nach Art. 49 Abs. 1 lit. a DSGVO ein.
        </p>
      </section>

      <section>
        <h2>13. Speicherdauer und Löschung</h2>
        <p>
          Personenbezogene Daten werden gelöscht oder gesperrt, sobald der Zweck der Speicherung
          entfällt und keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Steuerrechtlich
          relevante Daten bewahren wir gemäß § 147 AO bis zu 10 Jahre auf; handelsrechtlich relevante
          Unterlagen 6 Jahre. Einwilligungsbasierte Daten werden bis zum Widerruf der Einwilligung
          verarbeitet.
        </p>
      </section>

      <section>
        <h2>14. Ihre Rechte als betroffene Person</h2>
        <p>Gemäß der DSGVO stehen Ihnen folgende Rechte zu:</p>
        <ul>
          <li><strong>Auskunft (Art. 15 DSGVO)</strong></li>
          <li><strong>Berichtigung (Art. 16 DSGVO)</strong></li>
          <li><strong>Löschung (Art. 17 DSGVO)</strong> – sofern keine Aufbewahrungspflichten entgegenstehen</li>
          <li><strong>Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong></li>
          <li><strong>Datenübertragbarkeit (Art. 20 DSGVO)</strong></li>
          <li>
            <strong>Widerspruch (Art. 21 DSGVO):</strong> Sie haben das Recht, jederzeit gegen die
            Verarbeitung Sie betreffender Daten, die auf Art. 6 Abs. 1 lit. f DSGVO beruht,
            Widerspruch einzulegen; dies gilt auch für ein etwaiges Profiling. Gegen die Verarbeitung
            zu Zwecken der Direktwerbung können Sie jederzeit widersprechen.
          </li>
          <li>
            <strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Eine erteilte
            Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Die
            Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.
          </li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an{' '}
          <a href="mailto:info@qiblanco.com">info@qiblanco.com</a>.
        </p>
      </section>

      <section>
        <h2>15. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p>
          Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren. Die für uns zuständige Behörde ist das Bayerische Landesamt für
          Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.
        </p>
      </section>

      <section>
        <h2>16. Datensicherheit (SSL/TLS)</h2>
        <p>
          Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
          personenbezogener Daten eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte Verbindung
          erkennen Sie an „https://" in der Adresszeile Ihres Browsers.
        </p>
      </section>

      <section>
        <h2>17. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen
          rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen. Für
          Ihren erneuten Besuch gilt dann die jeweils aktuelle Fassung.
        </p>
      </section>
      </div>
    </div>
  );
}

/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
