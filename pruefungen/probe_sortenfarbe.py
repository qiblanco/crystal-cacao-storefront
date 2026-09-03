#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
probe_sortenfarbe.py — misst am GERENDERTEN DOM, ob die aus den Verpackungen
abgeleitete Sortenfarbe beim Besucher wirklich ankommt.

WARUM AM DOM UND NICHT AN DER CSS-DATEI: ein `grep --cc-sorte-awake
app/styles/kakao-seiten.css` beweist nur, dass jemand einen Token
hingeschrieben hat. Ob der Token je ein Pixel faerbt, sagt er nicht — und
genau diese Verwechslung ist der Blog-Fall vom 2026-08-31: die Huelle
antwortete mit HTTP 200 und war leer. Erreichbarkeit ist nicht Inhalt.

VIER ARME, jeder waere allein blind:
  A NAHT      Die Sorten-Kennung ueberquert die Grenze SSoT (kakao-zone.js)
              -> Server-Render (root.jsx): traegt <html> data-cc-sorte?
              Und traegt die Uebersichtsseite bewusst KEINE?
  B WIRKUNG   Faerbt der Token real? Die Sorten-Claim-Zeile muss die
              abgeleitete Textfarbe als COMPUTED STYLE tragen — und zwar
              GENAU EIN Element je Seite. Ohne die Zaehlung waere ein zu
              weiter Selektor (der die halbe Seite einfaerbt) gruen.
  C SORTE     Sind die Sorten fuer den Besucher UNTERSCHEIDBAR? Die beiden
              gemessenen Farben muessen verschieden sein UND im Farbton zu
              der Messung an der Verpackung passen. Ohne C waeren zwei
              identische Grautoene gruen.
  D LESBAR    Haelt die Farbe an ihrem ECHTEN Hintergrund WCAG AA (4,5:1)?
              Gemessen wird der tatsaechlich gerenderte Hintergrund der
              Vorfahrenkette, nicht ein angenommener Grundton.

ZUSAGE OHNE ZAEHLER-PIN: es steht bewusst nirgends "3 Seiten geprueft". Die
Zahl der Routen darf wachsen, ohne die Probe rot zu faerben.

EXIT
  0 = alles gehalten
  1 = BEFUND
  4 = MESSAUSFALL (dev-Server aus, Browser fehlt) — ausdruecklich NICHT gruen
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

BASIS = os.environ.get("CC_BASIS", "http://localhost:3399")

# Erwartung aus der Messung an den Verpackungsbildern
# (pruefungen/farbmessung_verpackung.py, Werte im Kopf von kakao-seiten.css).
# Gepinnt ist der FARBTON-BEREICH, nicht ein Hexwert: der abgeleitete Ton darf
# in Helligkeit und Saettigung nachjustiert werden, ohne die Probe zu roeten —
# er darf nur nicht die Sorte wechseln.
SORTEN = {
    "awake": {
        "pfad": "/products/crystal-cacao-awake",
        "hue_soll": 339.4,      # Mittel aus drei Messungen, Spanne 1,0 Grad
        "hue_toleranz": 20.0,
        "beschreibung": "rosa/magenta",
    },
    "create": {
        "pfad": "/products/crystal-cacao-create",
        "hue_soll": 210.9,      # Mittel aus drei Messungen, Spanne 3,5 Grad
        "hue_toleranz": 20.0,
        "beschreibung": "blau",
    },
}
# Die Uebersichtsseite zeigt BEIDE Sorten und bleibt deshalb bewusst neutral.
NEUTRAL = "/pages/crystal-cacao"

CLAIM_SELEKTOR = "[data-cc-sorte] .items-center-justify-center > h2"

JS = r"""
(() => {
  const raus = {sorte: document.documentElement.dataset.ccSorte || null,
                treffer: []};
  const el = document.querySelectorAll(SELEKTOR_PLATZHALTER);
  const grund = (n) => {
    for (let k = n; k; k = k.parentElement) {
      const bg = getComputedStyle(k).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) continue;
      const t = m[1].split(',').map(s => parseFloat(s));
      if (t.length < 4 || t[3] > 0) return [t[0], t[1], t[2]];
    }
    return [255, 255, 255];
  };
  el.forEach(n => {
    const cs = getComputedStyle(n);
    const m = cs.color.match(/rgba?\(([^)]+)\)/);
    const t = m ? m[1].split(',').map(s => parseFloat(s)) : [0, 0, 0];
    raus.treffer.push({
      text: (n.textContent || '').trim().slice(0, 60),
      farbe: [t[0], t[1], t[2]],
      grund: grund(n),
      schrift_px: parseFloat(cs.fontSize),
      gewicht: cs.fontWeight,
    });
  });
  return raus;
})()
"""


def _lum(rgb):
    c = [v / 255.0 for v in rgb]
    c = [(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def kontrast(a, b):
    l1, l2 = sorted([_lum(a), _lum(b)], reverse=True)
    return round((l1 + 0.05) / (l2 + 0.05), 2)


def hue(rgb):
    import colorsys
    h, _l, _s = colorsys.rgb_to_hls(*[v / 255.0 for v in rgb])
    return round(h * 360, 1)


def hue_abstand(a, b):
    d = abs(a - b) % 360
    return round(min(d, 360 - d), 1)


def erreichbar():
    try:
        with urllib.request.urlopen(BASIS + NEUTRAL, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def hole_html(pfad):
    with urllib.request.urlopen(BASIS + pfad, timeout=20) as r:
        return r.read().decode("utf-8", "replace")


def messe_dom(pfad):
    """Rendert die Seite im echten Browser und liest COMPUTED STYLES."""
    from playwright.sync_api import sync_playwright
    js = JS.replace("SELEKTOR_PLATZHALTER", json.dumps(CLAIM_SELEKTOR))
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        try:
            pg = b.new_page(viewport={"width": 1280, "height": 900})
            pg.goto(BASIS + pfad, wait_until="networkidle", timeout=45000)
            return pg.evaluate(js)
        finally:
            b.close()


def main():
    befunde = []

    if not erreichbar():
        print(f"MESSAUSFALL: {BASIS} nicht erreichbar. "
              f"Erst `npm run dev -- --port 3399` starten.", file=sys.stderr)
        return 4

    # --- Arm A: die Naht SSoT -> Server-Render -----------------------------
    print("[A] Naht: traegt das Server-HTML die Sorten-Kennung?")
    for sorte, cfg in SORTEN.items():
        try:
            html = hole_html(cfg["pfad"])
        except Exception as ex:
            print(f"MESSAUSFALL: {cfg['pfad']} nicht ladbar ({ex})", file=sys.stderr)
            return 4
        marke = f'data-cc-sorte="{sorte}"'
        ok = marke in html
        print(f"    {cfg['pfad']:38} {marke:28} {'OK' if ok else 'FEHLT'}")
        if not ok:
            befunde.append(f"[A] {cfg['pfad']}: {marke} fehlt im Server-HTML — "
                           f"die Kennung ueberquert die Grenze root.jsx nicht.")
    try:
        html_n = hole_html(NEUTRAL)
    except Exception as ex:
        print(f"MESSAUSFALL: {NEUTRAL} nicht ladbar ({ex})", file=sys.stderr)
        return 4
    if "data-cc-sorte=" in html_n:
        befunde.append(f"[A] {NEUTRAL}: traegt eine Sorten-Kennung, obwohl die "
                       f"Uebersicht beide Sorten zeigt und neutral bleiben soll.")
    else:
        print(f"    {NEUTRAL:38} {'bewusst ohne Kennung':28} OK")

    # --- Arm B/C/D: was der Besucher wirklich sieht ------------------------
    print("\n[B/C/D] Wirkung am gerenderten DOM (computed style):")
    gemessen = {}
    for sorte, cfg in SORTEN.items():
        try:
            r = messe_dom(cfg["pfad"])
        except Exception as ex:
            print(f"MESSAUSFALL: DOM-Messung {cfg['pfad']} fehlgeschlagen ({ex})",
                  file=sys.stderr)
            return 4
        n = len(r["treffer"])
        if n != 1:
            befunde.append(
                f"[B] {cfg['pfad']}: der Sorten-Selektor trifft {n} Elemente, "
                f"erwartet ist GENAU EINES. Bei 0 faerbt der Token nichts "
                f"(leere Huelle), bei mehr als 1 ist er nicht mehr dezent.")
            print(f"    {sorte:7} Treffer={n}  -> BEFUND")
            continue
        t = r["treffer"][0]
        farbe, grund = t["farbe"], t["grund"]
        h = hue(farbe)
        k = kontrast(farbe, grund)
        gemessen[sorte] = farbe
        hexw = "#%02X%02X%02X" % tuple(int(round(v)) for v in farbe)
        hexg = "#%02X%02X%02X" % tuple(int(round(v)) for v in grund)
        print(f"    {sorte:7} \"{t['text'][:34]}\"")
        print(f"            Farbe {hexw} Hue {h}deg  auf {hexg}  "
              f"Kontrast {k}:1  Schrift {t['schrift_px']}px")

        # C: passt der Farbton zur Verpackung?
        d = hue_abstand(h, cfg["hue_soll"])
        if d > cfg["hue_toleranz"]:
            befunde.append(
                f"[C] {sorte}: Farbton {h} Grad liegt {d} Grad neben der an der "
                f"Verpackung gemessenen Sortenfarbe ({cfg['hue_soll']} Grad, "
                f"{cfg['beschreibung']}). Toleranz {cfg['hue_toleranz']} Grad.")
        else:
            print(f"            Farbton {d} Grad von der Verpackung "
                  f"({cfg['beschreibung']}, {cfg['hue_soll']}deg) — OK")

        # D: lesbar?
        if k < 4.5:
            befunde.append(
                f"[D] {sorte}: Sorten-Claim erreicht nur {k}:1 gegen seinen "
                f"echten Hintergrund {hexg}. WCAG AA verlangt 4.5:1 — die "
                f"Farbe ist schoen und nicht lesbar.")
        else:
            print(f"            WCAG AA {k}:1 >= 4.5:1 — OK")

    # C, zweiter Teil: sind die Sorten ueberhaupt unterscheidbar?
    if len(gemessen) == 2:
        a, c = gemessen["awake"], gemessen["create"]
        d = hue_abstand(hue(a), hue(c))
        print(f"\n[C] Sorten-Abstand: {d} Grad Farbton zwischen Awake und Create")
        if a == c:
            befunde.append("[C] Awake und Create rendern DIESELBE Farbe — der "
                           "Sorten-Schalter wirkt nicht.")
        elif d < 60:
            befunde.append(f"[C] Awake und Create liegen nur {d} Grad "
                           f"auseinander — an der Verpackung sind es 128,5 Grad. "
                           f"Der Besucher unterscheidet sie so nicht.")
        else:
            print("            unterscheidbar — OK")

    print()
    if befunde:
        print(f"=== {len(befunde)} BEFUND(E) ===")
        for b in befunde:
            print("  " + b)
        return 1
    print("=== keine Befunde: die gemessene Sortenfarbe kommt beim Besucher an ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
