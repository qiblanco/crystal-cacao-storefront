#!/usr/bin/env python3
"""
probe_sorten_eine_seite — AWAKE und CREATE sind EINE Seite, zweimal benutzt.

Job 20260910-REPAIR-awake-und-create-sind-zwei-kopien-derselben-seite.
Vorgeschichte: Awake.jsx (424 Z.) und Create.jsx (414 Z.) trugen am 2026-09-10
351 woertlich gleiche Zeilen (82,8 %, difflib). Der Bau zieht den Rumpf in
app/components/product-pages/SortenSeite.jsx und die Unterschiede nach
app/lib/sorten-profil.js. Diese Probe misst, dass das SO BLEIBT — und dass
der Kundenrand dabei sortenrichtig geblieben ist.

ARME (jeder druckt seinen Marker; ein Rot-Nachweis nennt den Arm, nicht den Exit):
  A KOPIE   Awake.jsx/Create.jsx teilen hoechstens KOPIE_MAX Zeilen (difflib,
            derselbe Massstab wie die Ausgangsmessung) und beide importieren
            SortenSeite. Gemessen am Repo (--repo), nicht am Rand.
  B RAND    Beide Kaufseiten liefern am Kundenrand (--basis) ihren SORTEN-
            Inhalt (und NICHT den der anderen) UND den gemeinsamen Inhalt.
            Das ist die Wirkung: Zusammenfuehren darf nichts vertauschen.
  D MARKUP  Jede Fett-Markierung in sorten-profil.js ist ein PAAR: ein
            fehlendes zweites ** faellt im Renderer lautlos durch (der Rest
            des Absatzes wuerde fett) — Hinweis des Advisor-Pruefers, K3 P2.
  E ZUBEREITUNG  Die Seite nennt GENAU EINE Zubereitung. Gemessen wird die
     Eigenschaft, nicht ein Verbotswort: (E1) die Mengenangaben in der
     Zubereitungs-FAQ — aus dem FAQPage-JSON-LD der gelieferten Seite, also
     strukturiert statt aus Fliesstext geraten — liegen in der erlaubten
     Menge {75 ml, 15 g}; (E2) die Menge aller VOLUMEN-Angaben der ganzen
     Seite ist genau {75 ml}, denn eine zweite Zubereitungsanweisung bringt
     immer ihre eigene Fluessigkeitsmenge mit.
     (E3) der Zubereitungs-ABSCHNITT und die Zubereitungs-FAQ nennen DIESELBEN
     Mengen — nicht nur je erlaubte; (E4) die Rechnung der Seite geht auf:
     Tafelgewicht / Tagesdosis == die versprochene Zahl der Tage (420 / 15 = 28).
     WAS E NICHT MISST, damit niemand mehr hineinliest: die GRAMM-Angaben der
     ganzen Seite. 100 g (Naehrwerte), 420 g (Tafel) und die 5 bis 10 g der
     Empfindlichkeits-FAQ stehen dort zu Recht; ein globaler Gramm-Arm waere
     ein Fluter. Gramm werden deshalb nur dort gemessen, wo genau eine
     Dosierung hingehoert: in der Zubereitungs-Antwort (E1) und im
     Zubereitungs-Abschnitt (E3).
     WARUM E3 UND E4 NACHTRAEGLICH DAZUKAMEN, und es ist der Ertrag einer
     adversarialen Gegenpruefung (K3 P2, 2026-09-11): mit E1+E2 allein waere der
     WAHRSCHEINLICHSTE Rueckfall unsichtbar geblieben — jemand setzt im
     ABSCHNITT 15 g auf 25 g, laesst 75 ml stehen und ruehrt die FAQ nicht an.
     Dann ist das Volumen weiter eindeutig (E2 gruen), die FAQ weiter in der
     erlaubten Menge (E1 gruen), und die Seite ist wieder zweizuengig. E3 misst
     deshalb die EINIGKEIT der zwei Aussagen statt zweimal ihre Zulaessigkeit.
     E4 haengt die Dosis zusaetzlich an einen DRITTEN, unabhaengigen Zeugen:
     "Fuer 28 Tage" kommt aus den Shopify-Produktdaten, nicht aus unserem Code —
     eine in sich einige, aber falsche Dosis faellt dort auf.
     EHRLICHE UEBERSCHNEIDUNG MIT ARM B, damit E3 niemand fuer mehr haelt als es
     ist: den oben genannten 25-g-Rueckfall faengt B/gemeinsam bereits, weil es
     den Zubereitungs-Satz als LITERAL fuehrt — gemessen, nicht vermutet. B ist
     dabei aber an den WORTLAUT gebunden und geht auch bei einer harmlosen
     Umformulierung rot, waehrend es ueber den SINN nichts weiss. Der eigene
     Wert von E3/E4 liegt deshalb dort, wo die Zahlen sich einmal LEGITIM
     aendern: dann muessen B und E1 von Hand neu gepinnt werden, E3 (Einigkeit
     der zwei Aussagen) und E4 (Rechnung gegen die Shopify-Zusage) halten
     dagegen ohne Zutun — und E4 ist der einzige Arm, der einen Zeugen
     AUSSERHALB unseres Repos liest.
  C KLASSE  Der Abschnitt "Anwendung & Tageszeiten" (2026-09-10: 453 px,
            0 Ziele, 13,6 % Fuellgrad, in beiden Dateien zeichengleich) ist
            weg; die pruefbare Zubereitungs-Angabe (15 g / 75 ml / 85 °C)
            steht weiter auf beiden Seiten — die Startseite verspricht sie
            ("Wie du ihn zubereitest ... findest du bei AWAKE und CREATE").

EXIT: 0 gruen · 1 BEFUND · 4 MESSAUSFALL (Rand nicht erreichbar, Datei fehlt).
ROT-NACHWEIS: gegen den Stand VOR dem Bau (git show 011b7d1) ist A rot (351
gemeinsame Zeilen), C rot (Tageszeiten da) — siehe RESULT des Jobs, Abschnitt
"Rot vor Gruen". Arm B ist gegen den Vorstand GRUEN und gegen eine
vertauschte Sorte (awake-Rumpf auf der create-Route) rot — hermetisch
gefahren ueber --html-awake/--html-create mit vertauschten Dateien.
"""
import argparse
import difflib
import json
import os
import re
import sys
import urllib.request

KOPIE_MAX = 40  # Zeilen; vorher 351. Import-/Export-Zeilen der zwei Huellen bleiben gemeinsam.

SORTEN_MARKER = {
    "awake": ["Theobromin: 950 mg / 100g", "Piura-Tals", "Crystal Cacao® Awake",
              "tal-kakao-awake.jpg"],
    "create": ["Theobromin: 1.050 mg / 100g", "Departamento Amazonas", "Crystal Cacao® Create",
               "DSC01491_Kopie.webp"],
}
GEMEINSAM = ["Enthält 24 Mineralstoffe", "6.300 Jahre zurückreicht", "Spiraltempel von Montegrande",
             "15 g in 75 ml warmer Milch oder Wasser (max. 85 °C)"]
WEG = ["Anwendung &amp; Tageszeiten", "Nachmittags:", "Sanftes Ausklingen des Tages"]

# Arm E — die einzige Zubereitung dieser Kaufseite (420-g-Tafel: 420 / 15 = 28 Tage).
# Belegter Bestand: Startseite (Kakao.jsx), Zubereitungs-Abschnitt (SortenSeite.jsx)
# und die Produktbeschreibung ("Fuer 28 Tage") sagen alle 15 g / 75 ml / max. 85 °C.
ZUB_ERLAUBT = {(75.0, "ml"), (15.0, "g")}
ZUB_FRAGE = "zubereitet"   # Teilstring der FAQ-Frage, klein geschrieben verglichen
# E3: der Zubereitungs-Abschnitt ist <h2>Zubereitung</h2> + folgender <p> (SortenSeite.jsx).
ABSCHNITT_RX = re.compile(r"<h2[^>]*>\s*Zubereitung\s*</h2>\s*<p[^>]*>(.*?)</p>", re.S | re.I)
# E4: die drei Zeugen der Rechnung. Tafel tolerant (Prosa "420 g-Tafel" und
# Variantenzeile "1x 420g"), Tage aus der Shopify-Produktbeschreibung.
TAFEL_RX = re.compile(r"(\d{2,4})\s*-?\s*g\s*-?\s*Tafel|(?:^|[^0-9])1\s*x\s*(\d{2,4})\s*g", re.I)
TAGE_RX = re.compile(r"F\u00fcr\s+(\d{1,3})\s+Tage", re.I)
MENGE_RX = re.compile(r"(\d+(?:[.,]\d+)?)\s*(ml|g)\b", re.I)
BEREICH_RX = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:bis|-|–|—)\s*(\d+(?:[.,]\d+)?)\s*(ml|g)\b", re.I)


def mengen(text):
    """Alle Mengenangaben als {(zahl, einheit)}. Bereiche ('20 bis 25g') werden
    ZUERST auf BEIDE Enden ausgerollt — sonst faellt die untere Zahl still weg,
    weil sie keine eigene Einheit traegt."""
    gefunden = set()
    rest = text
    for m in BEREICH_RX.finditer(text):
        e = m.group(3).lower()
        gefunden.add((float(m.group(1).replace(",", ".")), e))
        gefunden.add((float(m.group(2).replace(",", ".")), e))
    rest = BEREICH_RX.sub(" ", text)
    for m in MENGE_RX.finditer(rest):
        gefunden.add((float(m.group(1).replace(",", ".")), m.group(2).lower()))
    return gefunden


def zub_faq_antwort(html):
    """Die Antwort der Zubereitungs-Frage aus dem FAQPage-JSON-LD der gelieferten
    Seite. Rueckgabe None = die Frage ist nicht da (MESSAUSFALL: der Gegenstand
    dieses Arms fehlt, das ist keine Aussage und kein Freispruch)."""
    for roh in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
                          html, re.S):
        try:
            daten = json.loads(roh)
        except ValueError:
            continue
        for eintrag in (daten if isinstance(daten, list) else [daten]):
            if not isinstance(eintrag, dict) or eintrag.get("@type") != "FAQPage":
                continue
            for frage in eintrag.get("mainEntity", []) or []:
                if ZUB_FRAGE in (frage.get("name") or "").lower():
                    return (frage.get("acceptedAnswer") or {}).get("text") or ""
    return None


def arm(name, ok, text):
    print(f"[{'OK' if ok else 'BEFUND'}] ARM {name} — {text}")
    return ok


def lade(url):
    req = urllib.request.Request(url, headers={"User-Agent": "probe_sorten_eine_seite"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def entkomme(s):
    # Das SSR-HTML traegt & als &amp; und ® unveraendert; Marker mit & werden so verglichen.
    return s.replace("&", "&amp;") if "&" in s and "&amp;" not in s else s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--basis", default=os.environ.get("CC_BASIS", "https://crystal-cacao.com"))
    ap.add_argument("--html-awake", help="hermetisch: HTML-Datei statt Rand")
    ap.add_argument("--html-create", help="hermetisch: HTML-Datei statt Rand")
    a = ap.parse_args()

    pp = os.path.join(a.repo, "app", "components", "product-pages")
    try:
        awake = open(os.path.join(pp, "Awake.jsx"), encoding="utf-8").read().splitlines()
        create = open(os.path.join(pp, "Create.jsx"), encoding="utf-8").read().splitlines()
    except OSError as e:
        print(f"[MESSAUSFALL] Datei fehlt: {e}")
        return 4
    gleich = sum(b.size for b in difflib.SequenceMatcher(None, awake, create).get_matching_blocks())
    ok = True
    ok &= arm("A/kopie", gleich <= KOPIE_MAX,
              f"Awake.jsx {len(awake)} Z., Create.jsx {len(create)} Z., gemeinsam {gleich} "
              f"(Deckel {KOPIE_MAX}; 2026-09-10 vor dem Bau: 351 = 82,8 %)")
    rx = r"""from\s+['"](?:\./|~/components/product-pages/)SortenSeite['"]"""
    beide = all(re.search(rx, "\n".join(t)) for t in (awake, create))
    ok &= arm("A/rumpf", beide, "beide Huellen importieren SortenSeite" if beide
              else "mindestens eine Huelle importiert SortenSeite NICHT")

    # D — Fett-Paare im Profil: Strings samt '+'-Verkettung zusammensetzen, dann zaehlen
    profil = os.path.join(a.repo, "app", "lib", "sorten-profil.js")
    try:
        quell = open(profil, encoding="utf-8").read()
    except OSError as e:
        print(f"[MESSAUSFALL] {profil}: {e}")
        return 4
    quell = re.sub(r"/\*.*?\*/", "", quell, flags=re.S)
    quell = re.sub(r"^\s*//.*$", "", quell, flags=re.M)
    lit = r"'(?:[^'\\]|\\.)*'"
    laeufe = re.findall(rf"{lit}(?:\s*\+\s*{lit})*", quell)
    texte = ["".join(t[1:-1] for t in re.findall(lit, lauf)) for lauf in laeufe]
    kaputt = [t[:60] for t in texte if t.count("**") % 2 or "****" in t]
    ok &= arm("D/markup", not kaputt, f"{len(texte)} Profil-Strings, Fett-Paare vollstaendig" if not kaputt
              else f"unpaarige/leere Fett-Markierung in: {kaputt}")

    html = {}
    for sorte in ("awake", "create"):
        quelle = getattr(a, f"html_{sorte}")
        try:
            html[sorte] = open(quelle, encoding="utf-8").read() if quelle else \
                lade(f"{a.basis}/products/crystal-cacao-{sorte}")
        except Exception as e:  # noqa: BLE001
            print(f"[MESSAUSFALL] {sorte}: {e.__class__.__name__}: {e}")
            return 4
    for sorte in ("awake", "create"):
        andere = "create" if sorte == "awake" else "awake"
        h = html[sorte]
        eigen = [m for m in SORTEN_MARKER[sorte] if entkomme(m) not in h]
        fremd = [m for m in SORTEN_MARKER[andere] if entkomme(m) in h]
        ok &= arm(f"B/{sorte}/eigen", not eigen, f"Sortenmarker fehlen: {eigen}" if eigen else
                  f"alle {len(SORTEN_MARKER[sorte])} Sortenmarker da")
        ok &= arm(f"B/{sorte}/fremd", not fremd, f"Marker der ANDEREN Sorte gefunden: {fremd}" if fremd
                  else "kein Marker der anderen Sorte")
        gem = [m for m in GEMEINSAM if entkomme(m) not in h]
        ok &= arm(f"B/{sorte}/gemeinsam", not gem, f"gemeinsamer Inhalt fehlt: {gem}" if gem
                  else f"alle {len(GEMEINSAM)} gemeinsamen Marker da (inkl. Zubereitung)")
        weg = [m for m in WEG if m in h]
        ok &= arm(f"C/{sorte}", not weg, f"Tageszeiten-Abschnitt noch da: {weg}" if weg
                  else "Tageszeiten-Abschnitt weg, Zubereitung bleibt")

        antwort = zub_faq_antwort(h)
        if antwort is None:
            print(f"[MESSAUSFALL] {sorte}: keine FAQ-Frage mit '{ZUB_FRAGE}' im FAQPage-JSON-LD")
            return 4
        fremd_menge = sorted(mengen(antwort) - ZUB_ERLAUBT)
        ok &= arm(f"E/{sorte}/faq", not fremd_menge,
                  f"Zubereitungs-FAQ nennt eine zweite Dosierung: {fremd_menge}" if fremd_menge
                  else f"Zubereitungs-FAQ bleibt in {sorted(ZUB_ERLAUBT)}")
        volumen = {z for z, e in mengen(h) if e == "ml"}
        ok &= arm(f"E/{sorte}/volumen", volumen == {75.0},
                  f"Volumen-Angaben der Seite: {sorted(volumen)} — erwartet genau [75.0]"
                  if volumen != {75.0} else "genau EIN Volumen auf der Seite: 75 ml")

        # E3 — Abschnitt und FAQ muessen EINIG sein, nicht nur je zulaessig.
        treffer = ABSCHNITT_RX.search(h)
        if not treffer:
            print(f"[MESSAUSFALL] {sorte}: kein <h2>Zubereitung</h2> + <p> im gelieferten HTML")
            return 4
        abschnitt = mengen(re.sub(r"<[^>]+>", " ", treffer.group(1)))
        faq = mengen(antwort)
        einig = abschnitt == faq
        ok &= arm(f"E/{sorte}/einig", einig,
                  f"Abschnitt {sorted(abschnitt)} vs FAQ {sorted(faq)} — zwei Zubereitungen"
                  if not einig else f"Abschnitt und FAQ nennen dieselben Mengen {sorted(abschnitt)}")

        # E4 — dritter Zeuge: Tafelgewicht / Tagesdosis == versprochene Tage.
        tafel = {float(a or b) for a, b in TAFEL_RX.findall(h)}
        tage = {float(t) for t in TAGE_RX.findall(h)}
        dosis = {z for z, e in abschnitt if e == "g"}
        if not tafel or not tage or not dosis:
            print(f"[MESSAUSFALL] {sorte}: Rechnung nicht lesbar — Tafel {sorted(tafel)}, "
                  f"Tage {sorted(tage)}, Dosis {sorted(dosis)}")
            return 4
        if len(tafel) > 1 or len(tage) > 1 or len(dosis) > 1:
            ok &= arm(f"E/{sorte}/rechnung", False,
                      f"mehrdeutige Zeugen: Tafel {sorted(tafel)}, Tage {sorted(tage)}, "
                      f"Dosis {sorted(dosis)} — je genau EINE Angabe erwartet")
        else:
            t, d, n = tafel.pop(), dosis.pop(), tage.pop()
            passt = abs(t / d - n) < 0.5
            ok &= arm(f"E/{sorte}/rechnung", passt,
                      f"{t:.0f} g / {d:.0f} g = {t / d:.2f}, versprochen sind {n:.0f} Tage"
                      if not passt else
                      f"Rechnung geht auf: {t:.0f} g / {d:.0f} g = {n:.0f} Tage")
    print("\nOK" if ok else "\nBEFUND")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
