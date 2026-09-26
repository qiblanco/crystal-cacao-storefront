/**
 * IG-Stimmen des Kakao-Ladens — Datenquelle, kein Layout.
 *
 * LADEN-EIGENE FASSUNG (K2 im Manifest shared/UPSTREAM.json), NICHT die
 * Vorlage. Die Vorlage (qiblanco-storefront app/data/ig-testimonials.js) fuehrt
 * 66 Slots ueber alle Produkte: QiBracelet, QiHome, QiOne, dazu eigene Posts
 * mit dem Urheber "Qi Blanco". Dieser Laden bewirbt keine Qi-Blanco-Produkte
 * (Christian 2026-09-02). Deshalb steht hier NUR, was auf crystal-cacao.com
 * gezeigt werden darf, und damit gelangt auch nur das ins Client-Bundle.
 *
 * ==================== WAS HIER STEHT UND WARUM ====================
 *
 * Der Kakao-Ausschnitt der Vorlage hat vier Eintraege. Am 2026-09-26 je
 * Eintrag gemessen (Bildtext, Poster, Videobild, Ton; Job
 * 20260926-crystal-kakao-zwei-vorlagen-features-ig-stimmen-und-kasse-im-browser,
 * analyse/ig-kakao-korpus-befund.md):
 *
 *  DUY4iOojqSh  @vanessastehler  Reel 30 s. Bis 17,75 s spricht sie nur vom
 *               Kakao. Bei 21-24 s sagt sie "mit meinem Qi-Bracelet spuere
 *               ich diese Verbundenheit". HIER ALS AUSZUG 0-17,75 s.
 *  DZcBRn9tKn4  @maxinfreiheit   Kakao UND Armband ("2 besondere Dinge"),
 *               Armband im Poster. Nicht hier.
 *  DW59RV8Db8k  @maxinfreiheit   Bild-Post ohne Video. Nicht hier, aus
 *               demselben Grund wie in der Vorlage: nur abspielbare Beitraege
 *               stehen in der Reihe.
 *  DRK-x7OjATx  @gesunde.psyche  handelt vom QiOne-Anhaenger. Nicht hier.
 *
 * DER AUSZUG, genau: das Originalvideo der Vorlage (Shopify-CDN,
 * sha256 2f0ee6d8...) wurde bei 17,75 s geschnitten. Der Schnittpunkt ist am
 * Ton gesucht, nicht aus Wortzeiten geraten: "Waerme." klingt bis 17,5 s ab,
 * der Anlaut von "Draussen" beginnt bei 17,88 s. Ton und Bild blenden auf den
 * letzten 0,3-0,4 s aus. Kein Wort ist veraendert, umgestellt oder
 * zusammengesetzt; der gezeigte Teil ist ein Auszug in der Reihenfolge des
 * Originals. Zwei Laeufe desselben ffmpeg-Aufrufs ergaben dieselbe md5
 * (8c750ba8...), das Abhoeren des Ergebnisses endet auf "Waerme.".
 * Das Poster ist ein Bild AUS dem Auszug (16 s): das Poster der Vorlage
 * stammt aus Sekunde ~28 und laege ausserhalb des gezeigten Teils.
 *
 * NUTZUNGSRECHTE: Christian 2026-09-12, woertlich: "Für die anderen Reels
 * haben wir auch die vollen Rechte." Gilt fuer die Videos des Korpus, also
 * auch fuer diesen Auszug. Nicht zu pruefen, nicht erneut vorzulegen.
 *
 * Felder wie in der Vorlage (siehe dort), damit Komponente und
 * ig-video-schema.js byte-gleich bleiben (K1). Zusaetzlich, von der Komponente
 * NICHT gelesen, als Herkunftsnachweis:
 *  anzeige       Das Original ist auf Instagram als "Anzeige" gekennzeichnet.
 *  auszugS       gezeigter Ausschnitt in Sekunden [von, bis]
 *
 * Quelle des Auszugs (ungekuerzt, bleibt auf dem CDN):
 *   cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-duy4ioojqsh--2f0ee6d877e0.mp4
 * Gesprochen im Auszug (abgehoert, faster-whisper medium):
 *   "Manchmal braucht es nur einen stillen Moment, um ganz bei sich anzukommen.
 *   Ich liebe es, mir diesen Raum zu schenken, den Alltag loszulassen und etwas
 *   Schönes für mich zu schaffen. Wenn ich mir meinen Zeremonie-Kakao
 *   zubereite, beginnt für mich ein kleines Ritual. Erdend, herzöffnend und
 *   voller Wärme."
 * Ohne JavaScript und ohne Kommentare bleibt davon im Bundle nur der Eintrag.
 */
export const IG_TESTIMONIALS = [
  {
    code: 'DUY4iOojqSh',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'reel',
    konto: 'vanessastehler',
    profil: 'vanessastehler',
    profilUrl: 'https://www.instagram.com/vanessastehler/',
    verifiziert: true,
    video: true,
    datum: '2026-02-05',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/cc-ig-kakao--duy4ioojqsh--auszug-poster-16s.jpg?v=1790464059',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/cc-ig-kakao--duy4ioojqsh--auszug-0-17s75.mp4?v=1790464052',
    anzeige: true,
    auszugS: [0, 17.75],
  },
];
