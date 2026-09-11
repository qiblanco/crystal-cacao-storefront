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
    print("\nOK" if ok else "\nBEFUND")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
