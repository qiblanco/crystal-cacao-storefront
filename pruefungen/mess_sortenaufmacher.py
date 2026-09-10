#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MESSGERAET fuer den Sorten-Aufmacher von /products/crystal-cacao-{awake,create}.

Job 20260910-BAU-sortenbloecke-awake-und-create-leerer-bildschirm-ohne-aufgabe.

Christian, zu zwei Bildschirmaufnahmen: „Das ist optisch auch nicht gut gemacht,
auch Crystal Cacao." Der Auftrag verlangt woertlich: „Miss die Werte, statt nach
Augenmass zu schieben" und „Nenne die gemessenen Abstaende vorher und nachher."

WAS DAS HIER IST UND WAS NICHT: ein MESSGERAET, keine Wache. Es faellt kein
Urteil und hat keine Schwelle -- es druckt Zahlen, damit VORHER und NACHHER
mit demselben Instrument erhoben sind. Ein Vergleich zweier Messungen, die mit
verschiedenen Instrumenten entstanden sind, misst die Instrumente.

Das URTEIL faellt pruefungen/probe_sortenaufmacher.py.

WARUM ES DIE ROHWERTE DRUCKT UND NICHT NUR DIE DIFFERENZ: eine Differenz von 0
kann heissen 'deckungsgleich' oder 'beide Messungen sind ausgefallen'. Deshalb
steht neben jeder Differenz die Grundmenge, aus der sie stammt, und ein
fehlendes Element wird als FEHLT gedruckt statt als 0.

AUFRUF
  pruefungen/mess_sortenaufmacher.py --basis https://crystal-cacao.com
  pruefungen/mess_sortenaufmacher.py --basis http://localhost:3399 --json

EXIT
  0  gemessen
  4  MESSAUSFALL (Seite nicht erreichbar, Block nicht gefunden) -- nie als
     'alles gleich' lesen
"""
from __future__ import annotations

import argparse
import json
import sys

SORTEN = ("awake", "create")
BREITEN = (("breit", 1440, 900), ("schmal", 390, 844))

# Der Aufmacher-Block. Beide Selektoren werden versucht: der NEUE Baustein
# traegt eine eigene Kennung, der ALTE (Vorzustand) ist nur ueber die
# Utility-Klassen-Kette auffindbar, die die Route inline mitbringt. Ohne den
# alten Zweig koennte dieses Geraet den VORHER-Zustand nicht messen -- und ein
# Vorher-Nachher-Vergleich, dessen Vorher-Seite strukturell leer ist, ist kein
# Vergleich.
BLOCK_SEL = "[data-cc-aufmacher], .items-center-justify-center"

JS = r"""
(sel) => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {x: Math.round(b.x*10)/10, y: Math.round(b.y*10)/10,
            w: Math.round(b.width*10)/10, h: Math.round(b.height*10)/10,
            top: Math.round(b.top*10)/10, bottom: Math.round(b.bottom*10)/10};
  };
  const block = document.querySelector(sel);
  if (!block) return {fehlt: 'block'};
  const img  = block.querySelector('img');
  const h2   = block.querySelector('h2');
  const h3   = block.querySelector('h3');
  const cs   = (el) => el ? getComputedStyle(el) : null;
  const out = {
    viewport: {w: window.innerWidth, h: window.innerHeight},
    block: r(block),
    bild:  r(img),
    claim: r(h2),
    unter: r(h3),
    bild_src: img ? img.getAttribute('src') : null,
    bild_natur: img ? {w: img.naturalWidth, h: img.naturalHeight} : null,
    bild_alt: img ? img.getAttribute('alt') : null,
    bild_loading: img ? img.getAttribute('loading') : null,
    claim_text: h2 ? h2.textContent.trim() : null,
    unter_text: h3 ? h3.textContent.trim() : null,
    claim_fs: h2 ? cs(h2).fontSize : null,
    unter_fs: h3 ? cs(h3).fontSize : null,
    claim_ff: h2 ? cs(h2).fontFamily : null,
    unter_ff: h3 ? cs(h3).fontFamily : null,
    unter_color: h3 ? cs(h3).color : null,
    claim_color: h2 ? cs(h2).color : null,
    // WAS DER ABSCHNITT ANBIETET: die Frage des Auftrags ist nicht
    // 'wie gross ist die Schrift', sondern 'kann der Besucher hier etwas tun'.
    // Deshalb wird die Zahl der ANKLICKBAREN Ziele im Block mitgemessen.
    wege: Array.from(block.querySelectorAll('a[href], button')).map(a => ({
      text: (a.textContent || '').trim().slice(0, 60),
      href: a.getAttribute('href') || null,
      rect: r(a),
    })),
    produktbilder: block.querySelectorAll('img').length,
  };
  return out;
}
"""


def _abstaende(m):
    """Die drei Abstaende, die der Auftrag benennt -- in Pixeln, gerundet."""
    if m.get("fehlt"):
        return {}
    a = {}
    if m.get("bild") and m.get("claim"):
        a["bild_bottom_zu_claim_top"] = round(m["claim"]["top"] - m["bild"]["bottom"], 1)
    if m.get("claim") and m.get("unter"):
        a["claim_bottom_zu_unter_top"] = round(m["unter"]["top"] - m["claim"]["bottom"], 1)
    if m.get("block"):
        a["block_hoehe"] = m["block"]["h"]
        a["block_x"] = m["block"]["x"]
    if m.get("bild"):
        a["bild_hoehe"] = m["bild"]["h"]
        a["bild_breite"] = m["bild"]["w"]
        a["bild_x"] = m["bild"]["x"]
        vp = m["viewport"]["w"]
        # Wie mittig steht der Schriftzug wirklich? Positiv = nach rechts
        # verschoben, negativ = nach links. Genau die Groesse, die Christian
        # mit blossem Auge als 'deutlich weiter links' beschrieben hat.
        a["bild_mitte_versatz"] = round((m["bild"]["x"] + m["bild"]["w"] / 2) - vp / 2, 1)
    return a


def messe(basis, sorten=SORTEN, breiten=BREITEN):
    from playwright.sync_api import sync_playwright

    erg = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for name, bw, bh in breiten:
                ctx = browser.new_context(viewport={"width": bw, "height": bh},
                                          device_scale_factor=1)
                page = ctx.new_page()
                for sorte in sorten:
                    url = f"{basis.rstrip('/')}/products/crystal-cacao-{sorte}"
                    try:
                        page.goto(url, wait_until="networkidle", timeout=45000)
                    except Exception as e:  # noqa: BLE001
                        erg[(name, sorte)] = {"fehlt": f"laden: {e.__class__.__name__}"}
                        continue
                    page.wait_for_timeout(900)
                    m = page.evaluate(JS, BLOCK_SEL)
                    m["url"] = url
                    m["abstaende"] = _abstaende(m)
                    erg[(name, sorte)] = m
                ctx.close()
        finally:
            browser.close()
    return erg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--basis", default="https://crystal-cacao.com")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--out", default=None, help="JSON zusaetzlich hierhin schreiben")
    args = ap.parse_args()

    erg = messe(args.basis)
    flach = {f"{b}/{s}": v for (b, s), v in erg.items()}

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(flach, fh, ensure_ascii=False, indent=2)

    if args.json:
        json.dump(flach, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        for k, m in flach.items():
            print(f"== {k}  {m.get('url','')}")
            if m.get("fehlt"):
                print(f"   MESSAUSFALL: {m['fehlt']}")
                continue
            print(f"   Bild  src={m['bild_src']}")
            print(f"         natuerlich={m['bild_natur']} loading={m['bild_loading']} alt={m['bild_alt']!r}")
            print(f"   Claim {m['claim_text']!r} fs={m['claim_fs']} ff={(m['claim_ff'] or '')[:40]}")
            print(f"   Unter {m['unter_text']!r} fs={m['unter_fs']} ff={(m['unter_ff'] or '')[:40]} farbe={m['unter_color']}")
            print(f"   Bilder im Block: {m['produktbilder']}   anklickbare Ziele: {len(m['wege'])}")
            for w in m["wege"]:
                print(f"      -> {w['text']!r} {w['href']}")
            for a, v in m["abstaende"].items():
                print(f"   {a:32s} = {v}")
            print()

    ausfall = [k for k, m in flach.items() if m.get("fehlt")]
    if ausfall:
        print(f"MESSAUSFALL in: {', '.join(ausfall)}", file=sys.stderr)
        return 4
    return 0


if __name__ == "__main__":
    sys.exit(main())
