/**
 * IG-Stimmen des Kakao-Ladens — Datenquelle, kein Layout.
 *
 * LADEN-EIGENE FASSUNG (K2 im Manifest shared/UPSTREAM.json), NICHT die
 * Vorlage. Die Vorlage (qiblanco-storefront app/data/ig-testimonials.js) führt
 * 66 Slots über alle Produkte. Hier steht NUR, was auf crystal-cacao.com
 * gezeigt wird, und damit gelangt auch nur das ins Client-Bundle.
 *
 * ==================== WAS HIER STEHT UND WARUM ====================
 *
 * WELCHE KAKAO-STIMMEN HIER STEHEN, regelt crystal-cacao-node/REGEL-KAKAO-STIMMEN.md
 * (Elina, EL-20261026-8bdf0028): zeigt ein Beitrag Kakao, steht er hier
 * UNGEKÜRZT, auch wenn daneben ein Qi-Blanco-Gerät zu sehen oder zu hören
 * ist. Nur ein Beitrag, der AUSSCHLIESSLICH ein anderes Produkt zeigt, steht
 * nicht hier. Vor jedem Schnitt oder Weglassen diese Regel lesen.
 *
 * Stand 2026-10-26 (EL-20261026-28f53e7d):
 *  DUY4iOojqSh  @vanessastehler  volles Reel (bis dahin ein Auszug bis 17,75 s),
 *               dieselbe mp4 wie auf qiblanco.com.
 *  DZcBRn9tKn4  @maxxpansion     volles Reel, Kakao im Bild. Das Konto hieß
 *               früher @maxinfreiheit und ist auf Instagram umbenannt.
 *  DW59RV8Db8k  @maxxpansion     Bild-Beitrag mit 5 Bildern als Bild-Kachel,
 *               die Bilder blättern in der Kachel (Feld `bilder`).
 *  DRK-x7OjATx  @gesunde.psyche  handelt vom QiOne-Anhänger, kein Kakao, steht
 *               deshalb nicht hier (EL-20261023-10b68e2e).
 *  DcjbAxBtMwy  @flucid.temple, DWn8u4OFHEh und DXq8EjJlGUV  @friquencita:
 *               volle Reels aus EL-20261026-db3cc728.
 * Video und Bilder von @maxxpansion liegen auf dem Shopify-CDN, abgerufen über
 * die Graph-API (business_discovery) am 2026-10-26.
 * Die Reihenfolge ist frei (Elina, EL-20261026-8bdf0028).
 *
 * NUTZUNGSRECHTE: Christian 2026-09-12, wörtlich: "Für die anderen Reels
 * haben wir auch die vollen Rechte." Für die Stimmen aus EL-20261026-db3cc728
 * bestätigt Elina, dass die Einverständnisse der Personen vorliegen.
 *
 * Felder wie in der Vorlage (siehe dort), damit Komponente und
 * ig-video-schema.js byte-gleich bleiben (K1). Zusätzlich:
 *  bilder        nur Bild-Beiträge: die Bilder der Kachel in Reihenfolge
 *                (die Komponente blättert sie; `posterPfad` = erstes Bild)
 *  anzeige       von der Komponente NICHT gelesen: das Original ist auf
 *                Instagram als "Anzeige" gekennzeichnet.
 *
 * ==================== DAS POSTER TRAEGT EINE BREITE ====================
 * (Job 20260927-crystal-kaufseiten-schicken-dem-telefon-keine-desktop-pixel)
 * `posterPfad` endet auf `&width=600`. Der Master ist 720x1280 px und
 * 161 406 B; die Kachel ist 232 CSS-px breit (unter 768 px Fensterbreite)
 * bzw. 268 px (darueber), das Bild fuellt sie per object-fit: cover. Am
 * CDN gemessen 2026-09-27 liefert `&width=600` 600x1067 px mit 125 226 B.
 * Deckung damit: Telefon DPR 2 1,29 (vorher 1,55), Schreibtisch DPR 1 2,24
 * (vorher 2,69), Schreibtisch DPR 2 1,12; ein Telefon mit DPR 3 sieht 0,86.
 *
 * WARUM EINE ADRESSE UND KEIN srcset: die Kachel rendert `posterPfad` als
 * `src` UND als `poster` des Videos (IgTestimonialSlideshow.jsx, K1 und
 * byte-gleich zur Vorlage — nicht anfassen). Eine Leiter braeuchte die
 * Komponente; die Datenschicht kann nur EINE Datei nennen, und die ist
 * zwangslaeufig ein Kompromiss zwischen den Dichten. 550 wuerde am
 * Schreibtisch mit DPR 2 gerade decken (1,03); 600 kostet 17 KB mehr und
 * gibt dafuer einem Telefon mit DPR 3 0,86 statt 0,79. Das Original (720 px)
 * war fuer DPR 3 genau richtig und fuer alles darunter zu gross.
 * Weil `src` und `poster` dieselbe Adresse lesen, bleibt es beim Klick auf
 * Play bei EINEM Abruf.
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
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-duy4ioojqsh--db2ff5efaebe.jpg?v=1789160999&width=600',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-duy4ioojqsh--2f0ee6d877e0.mp4?v=1789239635',
    anzeige: true,
  },
  {
    code: 'DZcBRn9tKn4',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'reel',
    konto: 'maxxpansion',
    profil: 'maxxpansion',
    profilUrl: 'https://www.instagram.com/maxxpansion/',
    verifiziert: true,
    video: true,
    datum: '2026-06-11',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dzcbrn9tkn4-poster--3967ff341096.jpg?v=1793017511&width=600',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dzcbrn9tkn4--ff6939f9e7f3.mp4?v=1793017504',
  },
  {
    code: 'DW59RV8Db8k',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'p',
    konto: 'maxxpansion',
    profil: 'maxxpansion',
    profilUrl: 'https://www.instagram.com/maxxpansion/',
    verifiziert: true,
    video: false,
    datum: '2026-04-09',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild1--e21fece56e41.jpg?v=1793017518&width=600',
    bilder: [
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild1--e21fece56e41.jpg?v=1793017518&width=600',
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild2--1feb735268c0.jpg?v=1793017525&width=600',
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild3--45a99ed4be99.jpg?v=1793017533&width=600',
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild4--fb7283d8db0a.jpg?v=1793017543&width=600',
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--ig-dw59rv8db8k-bild5--3d15bbdfc0cc.jpg?v=1793017551&width=600',
    ],
    inDerReihe: true,
    videoUrl: null,
    anzeige: true,
  },
  /* Stimmen aus EL-20261026-db3cc728 (Elina: Einverständnisse liegen vor),
     ungekürzt, Kakao im Bild. Abgerufen und hochgeladen von jenem Vorgang. */
  {
    code: 'DcjbAxBtMwy',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'reel',
    konto: 'flucid.temple',
    profil: 'flucid.temple',
    profilUrl: 'https://www.instagram.com/flucid.temple/',
    verifiziert: true,
    video: true,
    datum: '2026-08-27',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-flucid-temple-dcjbaxbtmwy-poster--0c1abfdd9937.jpg?v=1793018883&width=600',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-flucid-temple-dcjbaxbtmwy--edd93db9d152.mp4?v=1793018858',
    anzeige: false,
  },
  {
    code: 'DWn8u4OFHEh',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'reel',
    konto: 'friquencita',
    profil: 'friquencita',
    profilUrl: 'https://www.instagram.com/friquencita/',
    verifiziert: true,
    video: true,
    datum: '2026-04-02',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-friquencita-dwn8u4ofheh-poster--d66e4ae69e27.jpg?v=1793018887&width=600',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-friquencita-dwn8u4ofheh--0f537f40c52f.mp4?v=1793018863',
    anzeige: false,
  },
  {
    code: 'DXq8EjJlGUV',
    produkt: 'Kakao',
    stufe: 'T1',
    typ: 'reel',
    konto: 'friquencita',
    profil: 'friquencita',
    profilUrl: 'https://www.instagram.com/friquencita/',
    verifiziert: true,
    video: true,
    datum: '2026-04-28',
    sprache: 'de',
    posterPfad:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-friquencita-dxq8ejjlguv-poster--c7aecc6afc5c.jpg?v=1793018891&width=600',
    inDerReihe: true,
    videoUrl:
      'https://cdn.shopify.com/s/files/1/0279/3095/1750/files/qb-ig-testimonials--cc-kakao-stimme-friquencita-dxq8ejjlguv--df9285a3cf01.mp4?v=1793018869',
    anzeige: false,
  },
];
