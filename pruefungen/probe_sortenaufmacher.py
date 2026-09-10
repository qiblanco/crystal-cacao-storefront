#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""probe_sortenaufmacher — urteilt ueber den Sorten-Aufmacher der zwei Kaufseiten.

Job 20260910-BAU-sortenbloecke-awake-und-create-leerer-bildschirm-ohne-aufgabe.
Christian, zu zwei Bildschirmaufnahmen von crystal-cacao.com: „Das ist optisch
auch nicht gut gemacht, auch Crystal Cacao."

Das MESSGERAET ist pruefungen/mess_sortenaufmacher.py (druckt Zahlen, faellt
kein Urteil). DIESE Datei faellt das Urteil.

VIER ARME, jeder mit EIGENEM Befund-Praefix — und das ist keine Kosmetik:
ein Rot-Nachweis am fruehen Arm zertifiziert den spaeten nicht. Wer eine
Rot-Zusage fuehrt, muss sagen, WELCHER Arm gefallen ist; der blosse
Exit-Code unterscheidet Geschwisterarme nicht.

  [A] INHALT       Der Abschnitt bietet ausser Wortmarke und Claim etwas an:
                   einen Einordnungssatz UND mindestens zwei anklickbare
                   Ziele, davon eines auf die ANDERE Sorte. Das ist die
                   Erfuellungsfrage des Auftrags am Kundenrand.
  [B] DECKUNG      Beide Sorten stehen auf denselben Massen: Blockhoehe,
                   Wortmarken-Hoehe und die waagerechte Lage der TINTE sind
                   ueber neun Fensterbreiten gleich. Gemessen wird die
                   Tintenmitte, nicht die Bildmitte — die Bildmitte ist bei
                   einer unsymmetrischen Leinwand die falsche Groesse und
                   war genau der Grund, warum „Create steht weiter links"
                   aussah wie ein Abstandsfehler.
  [C] WORTMARKE    Die in app/lib/sorten-profil.js hinterlegte Geometrie wird
                   an den ECHTEN Dateien nachgerechnet: Masse, Tinten-Kasten,
                   Ausgleichswert — und die Aufloesungs-Reserve bei
                   dreifacher Pixeldichte. Ohne diesen Arm koennte jemand
                   eine Wortmarke austauschen und der Ausgleich schoebe
                   danach in die falsche Richtung, ohne dass etwas rot wird.
  [D] DECKEL       Der Abschnitt bleibt unter einer Hoehen-Obergrenze. Das
                   ist der schwerste Punkt des Auftrags („kostet einen
                   ganzen Bildschirm") und der einzige, der sich still
                   zurueckentwickeln kann: Inhalt waechst, niemand merkt es.

WARUM ARM B NICHT GENUEGT UND ARM A NICHT ALLEIN STEHT: zwei leere Bloecke
sind perfekt deckungsgleich. Genau das war der Vorzustand — 0 anklickbare
Ziele auf beiden Seiten. Und umgekehrt: zwei inhaltsreiche Bloecke koennen
auseinanderlaufen. Erst A und B zusammen beschreiben die Zusage.

ROT-NACHWEIS — FUEHRBAR, NICHT BEHAUPTET
----------------------------------------
`--fassung bestand` haengt `?aufmacher=bestand` an jede gemessene Adresse.
Das ist KEIN nachgebauter Defekt, sondern der echte Zustand vom 2026-09-10,
den app/components/product-pages/SortenAufmacher.jsx als
<SortenAufmacherBestand/> unveraendert aufbewahrt.

GEFAHREN UND GEZAEHLT AM 2026-09-10 (nicht vorhergesagt): 34 Befunde, verteilt
auf ALLE VIER Arme — A 12, B 18, C 2, D 2.
KORREKTUR AN DER ERSTEN FASSUNG DIESES KOPFES, und sie steht hier, weil sie
genau die Sorte Irrtum ist, gegen die die Arm-Trennung gebaut ist: dort stand
„C bleibt gruen, weil die Bilddateien dieselben sind". Das ist falsch, und der
erste echte Rot-Lauf hat es widerlegt. Arm C hat ZWEI Beine — die Datei-Masse
(die tatsaechlich unveraendert bleiben) und die AUFLOESUNGS-RESERVE, und die
rechnet gegen die GERENDERTE Hoehe. Im Vorzustand steht die Wortmarke 178,9
bzw. 221,0 px hoch statt 112 px, also braucht sie bei dreifacher Pixeldichte
1500 Punkte und hat 995 bzw. 950 — genau der Ausfranser, den Christian auf
seiner Aufnahme gesehen hat. Wer eine Arm-Zusage aus dem Kopf schreibt statt
aus dem Lauf, beschreibt seine Absicht und nicht sein Werkzeug.

  pruefungen/probe_sortenaufmacher.py --basis <url> --fassung bestand
      -> erwartet exit 1 mit Befunden in A, B, C und D

FAELLT DER ROT-ARM EINES TAGES AUS, weil die abgelegte Fassung entfernt
wurde, meldet `--fassung bestand` MESSAUSFALL (exit 4) und nicht gruen: „ich
kann den Rot-Zustand nicht mehr herstellen" und „der Pruefgegenstand ist in
Ordnung" sind zwei verschiedene Saetze und duerfen nie auf denselben Ausgang
fallen.

EXIT
  0  gruen
  1  BEFUND
  4  MESSAUSFALL (Seite nicht erreichbar, Playwright fehlt, CDN nicht
     erreichbar, Rot-Zustand nicht herstellbar) — ausdruecklich NICHT gruen

AUFRUF
  pruefungen/probe_sortenaufmacher.py [--basis https://crystal-cacao.com]
  Die Probe startet keinen Server — ein selbst gestarteter Server waere ein
  zweiter Messgegenstand.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import urllib.error
import urllib.request

SORTEN = ("awake", "create")

# Neun Breiten: die drei gaengigen Telefonbreiten, das Entwurfsmass 390, die
# Umbruchstelle der zwei Spalten (768) und der Schreibtischbereich. 320 ist
# bewusst dabei — dort ist am wenigsten Platz, und genau dort ist der
# Umbruch-Unterschied des Quer-Verweises aufgefallen.
BREITEN = (320, 360, 390, 414, 768, 1024, 1280, 1440, 1920)

# Der Deckel. HERGELEITET, nicht gesetzt: der Vorzustand mass 427,0 px (awake)
# und 469,2 px (create) bei 1440 px sowie 417,4 / 446,2 px bei 390 px. Der
# Deckel liegt jeweils auf dem KLEINEREN der beiden Vorwerte — der Abschnitt
# darf also nicht einmal so gross werden wie der bessere seiner zwei
# Vorgaenger. Gemessen steht er heute bei 336,2 px (breit) und 419,5 px
# (schmal); die Luft dazwischen ist der Spielraum fuer kuenftige Textzeilen.
# WARUM DER SCHMALE DECKEL SO KNAPP IST, ehrlich: auf dem Telefon ist der
# Abschnitt NICHT wesentlich kleiner geworden (419,5 gegen 417,4 px), er
# traegt jetzt nur Inhalt statt Leere. Ein Deckel, der etwas anderes
# behauptet, waere eine Zusage ohne Deckung.
# DER DRITTE DECKEL IST KEINE ZUSAGE AUF VERBESSERUNG — und das steht hier,
# weil ein Deckel, der wie die zwei darueber aussieht, auch so gelesen wird.
# BEI 320 px IST DER ABSCHNITT GROESSER GEWORDEN, gemessen 488,6 px gegen
# 407,3 (awake) bzw. 430,3 px (create). Das ist kein Versehen, sondern der
# Preis des Auftrags: in eine 288 px breite Spalte passen zwei
# Trefferflaechen von je 44 px aufwaerts und ein dreizeiliger
# Einordnungssatz nicht umsonst. Der Vorzustand war dort nur deshalb
# kuerzer, weil er NICHTS anbot — 0 anklickbare Ziele, genau der Befund.
# WARUM NICHT NACHGEBESSERT: nachgerechnet kostet bei 320 px der Claim eine
# zweite Zeile (57,5 statt 28,8 px), der Hauptknopf eine zweite (76,2 statt
# 55,1 px) und die Zwei-Zeilen-Reserve des Quer-Verweises 19,2 px. Selbst
# wenn man alle drei per Sonderregel unter 22,5em wegkuerzte, blieben rund
# 460 px — immer noch mehr als der leere Vorgaenger. Eine Sonderregel, die
# ihr Ziel nicht erreicht, dafuer aber eine vierte Fassung des Abschnitts
# einfuehrt, ist die naechste Stelle, an der die zwei Sorten auseinander-
# laufen. 320 px liegt zudem unter der schmalsten Breite, an der das Haus
# misst (SKILL-RESPONSIVE-MEDIEN-STANDARD.md: 360 px).
# WOGEGEN DIESER DECKEL DANN SCHUETZT: gegen WEITERES Wachstum. 500,0 px ist
# der heutige Wert plus 11,4 px Luft — reisst er, hat jemand nach diesem Bau
# Inhalt nachgelegt, ohne die schmalste Breite anzusehen.
DECKEL = {1440: 427.0, 390: 417.4 + 8.0, 320: 500.0}

JS_BLOCK = r"""
() => {
  const sec = document.querySelector('[data-cc-aufmacher]')
           || document.querySelector('.items-center-justify-center');
  if (!sec) return {fehlt: 'block'};
  const img = sec.querySelector('img');
  const r = (e) => { const b = e.getBoundingClientRect();
    return {x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1)}; };
  // Der angewandte waagerechte Ausgleich, aus der berechneten Matrix gelesen.
  // Ihn abzuziehen ergibt die Lage der TINTE — die einzige Groesse, die
  // ueber „steht mittig" entscheidet.
  let shift = 0;
  if (img) {
    const t = getComputedStyle(img).transform;
    const m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null;
    if (m) shift = parseFloat(m[1].split(',')[4]) || 0;
  }
  const ziele = Array.from(sec.querySelectorAll('a[href], button')).map((a) => ({
    text: (a.textContent || '').trim(),
    href: a.getAttribute('href') || null,
  }));
  const ein = sec.querySelector('.cc-sortenaufmacher__einordnung');
  return {
    block: r(sec),
    bild: img ? r(img) : null,
    bild_natur: img ? {w: img.naturalWidth, h: img.naturalHeight} : null,
    bild_alt: img ? (img.getAttribute('alt') || '') : null,
    bild_loading: img ? (img.getAttribute('loading') || '') : null,
    bild_src: img ? img.getAttribute('src') : null,
    shift: +shift.toFixed(2),
    tinte_mitte_versatz: img
      ? +((r(img).x + r(img).w / 2) - shift - window.innerWidth / 2).toFixed(1)
      : null,
    einordnung: ein ? ein.textContent.trim() : null,
    ziele,
  };
}
"""


class Messausfall(Exception):
    pass


def _lade_bild(url, timeout=25):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as fh:
            return fh.read()
    except Exception as exc:  # noqa: BLE001
        raise Messausfall("Wortmarke nicht ladbar (%s): %s" % (url, exc)) from exc


def _tinten_kasten(rohbytes):
    """Masse und Tinten-Kasten aus den echten Bytes — ohne Pillow kein Urteil."""
    try:
        from PIL import Image
    except ImportError as exc:  # noqa: BLE001
        raise Messausfall("Pillow fehlt — Arm C kann nicht messen") from exc
    im = Image.open(io.BytesIO(rohbytes)).convert("RGBA")
    kasten = im.getchannel("A").getbbox()
    if not kasten:
        raise Messausfall("Wortmarke ist vollstaendig durchsichtig")
    return im.size, kasten


def _sorten_profil(repo):
    """Die hinterlegten Zahlen aus app/lib/sorten-profil.js lesen.

    BEWUSST OHNE JS-PARSER: die Datei ist die SSoT, aber sie hier
    auszufuehren hiesse, den Pruefling als Messgeraet zu benutzen. Gelesen
    werden die Zahlen als Text; findet die Probe sie nicht, ist das
    MESSAUSFALL und kein Freispruch.
    """
    import re
    pfad = os.path.join(repo, "app", "lib", "sorten-profil.js")
    try:
        text = open(pfad, encoding="utf-8").read()
    except OSError as exc:
        raise Messausfall("sorten-profil.js nicht lesbar: %s" % exc) from exc
    aus = {}
    for sorte in SORTEN:
        block = re.search(
            r"%s:\s*Object\.freeze\(\{(.*?)\n  \}\)," % sorte, text, re.S)
        if not block:
            raise Messausfall("Sorten-Block %r in sorten-profil.js nicht gefunden" % sorte)
        b = block.group(1)
        def zahl(feld):
            m = re.search(r"%s:\s*(-?[\d.]+)" % feld, b)
            if not m:
                raise Messausfall("Feld %r fehlt bei %r" % (feld, sorte))
            return float(m.group(1))
        murl = re.search(r"url:\s*'([^']+)'", b)
        if not murl:
            raise Messausfall("Feld 'url' fehlt bei %r" % sorte)
        aus[sorte] = {
            "url": murl.group(1),
            "breite": zahl("breite"), "hoehe": zahl("hoehe"),
            "x0": zahl("x0"), "y0": zahl("y0"), "x1": zahl("x1"), "y1": zahl("y1"),
            "tinte_dx": zahl("tinte_dx"),
        }
    return aus


def messe(basis, fassung, breiten=BREITEN):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:  # noqa: BLE001
        raise Messausfall("Playwright fehlt") from exc
    zusatz = "?aufmacher=%s" % fassung if fassung else ""
    erg = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for w in breiten:
                for sorte in SORTEN:
                    ctx = browser.new_context(viewport={"width": w, "height": 900},
                                              device_scale_factor=1)
                    page = ctx.new_page()
                    url = "%s/products/crystal-cacao-%s%s" % (basis.rstrip("/"), sorte, zusatz)
                    try:
                        page.goto(url, wait_until="networkidle", timeout=45000)
                        page.wait_for_timeout(700)
                        m = page.evaluate(JS_BLOCK)
                    except Exception as exc:  # noqa: BLE001
                        raise Messausfall("%s nicht messbar: %s" % (url, exc)) from exc
                    finally:
                        ctx.close()
                    if m.get("fehlt"):
                        raise Messausfall("Aufmacher-Block auf %s nicht gefunden" % url)
                    erg[(w, sorte)] = m
        finally:
            browser.close()
    return erg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--basis", default=os.environ.get("CC_BASIS", "https://crystal-cacao.com"))
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--fassung", default=None, choices=["neu", "bestand"],
                    help="bestand = Rot-Nachweis gegen den Zustand vor dem Umbau")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    befunde = []
    zeilen = []

    try:
        erg = messe(args.basis, args.fassung)
    except Messausfall as e:
        print("[MESSAUSFALL] %s" % e, file=sys.stderr)
        return 4

    # Wenn ausdruecklich der Rot-Zustand angefordert wurde: erst pruefen, ob es
    # ihn ueberhaupt noch gibt. Ein Bestand, der sich nicht mehr herstellen
    # laesst, ist ein ERFOLG (jemand hat aufgeraeumt) und keine Entwarnung.
    if args.fassung == "bestand":
        probe = erg[(1440, "awake")]
        if probe.get("einordnung") is not None or len(probe.get("ziele") or []) > 0:
            print("[MESSAUSFALL] `?aufmacher=bestand` liefert nicht mehr den Vorzustand — "
                  "der Rot-Nachweis ist nicht mehr fuehrbar. Das ist KEIN Gruen.",
                  file=sys.stderr)
            return 4

    # ---------------------------------------------------------------- Arm A
    zeilen.append("[A] INHALT: bietet der Abschnitt ausser Wortmarke und Claim etwas an?")
    for sorte in SORTEN:
        m = erg[(1440, sorte)]
        andere = "create" if sorte == "awake" else "awake"
        ziele = m.get("ziele") or []
        hrefs = [z["href"] or "" for z in ziele]
        zeilen.append("    %-7s Einordnung: %s" % (sorte, (m.get("einordnung") or "FEHLT")))
        zeilen.append("            %d anklickbare Ziele: %s"
                      % (len(ziele), ", ".join("%r->%s" % (z["text"][:40], z["href"]) for z in ziele) or "—"))
        if not m.get("einordnung"):
            befunde.append("[A] %s: kein Einordnungssatz — der Abschnitt sagt nicht, "
                           "wofuer die Sorte gedacht ist." % sorte)
        if len(ziele) < 2:
            befunde.append("[A] %s: nur %d anklickbares Ziel — der Besucher kann hier "
                           "nichts tun." % (sorte, len(ziele)))
        if not any(h.startswith("#") for h in hrefs):
            befunde.append("[A] %s: kein Weg zum Kaufblock derselben Seite." % sorte)
        if not any("crystal-cacao-%s" % andere in h for h in hrefs):
            befunde.append("[A] %s: kein Weg zur anderen Sorte (%s) — wer auf der "
                           "falschen Seite gelandet ist, erfaehrt es hier nicht."
                           % (sorte, andere))
        # Der Schriftzug ist das groesste Element im ersten Bildschirm. Ein
        # alt-Text „image" ist keiner, und `lazy` kostet ganz oben einen
        # Ladeschritt.
        if (m.get("bild_alt") or "").strip().lower() in ("", "image", "bild"):
            befunde.append("[A] %s: der Schriftzug traegt keinen echten alt-Text (%r)."
                           % (sorte, m.get("bild_alt")))
        if (m.get("bild_loading") or "") == "lazy":
            befunde.append("[A] %s: der Schriftzug im ersten Bildschirm laedt `lazy`." % sorte)

    # ---------------------------------------------------------------- Arm B
    zeilen.append("")
    zeilen.append("[B] DECKUNG: stehen beide Sorten auf denselben Massen?")
    zeilen.append("    %-7s %10s %10s %9s   %s" % ("Breite", "awake", "create", "Delta", "Wortmarke / Tintenmitte"))
    for w in BREITEN:
        a, c = erg[(w, "awake")], erg[(w, "create")]
        d_block = round(a["block"]["h"] - c["block"]["h"], 1)
        d_bild = round((a["bild"]["h"] if a["bild"] else 0) - (c["bild"]["h"] if c["bild"] else 0), 1)
        d_tinte = round((a["tinte_mitte_versatz"] or 0) - (c["tinte_mitte_versatz"] or 0), 1)
        zeilen.append("    %-7d %10.1f %10.1f %9.1f   %.1f/%.1f  %.1f/%.1f"
                      % (w, a["block"]["h"], c["block"]["h"], d_block,
                         a["bild"]["h"], c["bild"]["h"],
                         a["tinte_mitte_versatz"], c["tinte_mitte_versatz"]))
        if abs(d_block) > 0.5:
            befunde.append("[B] %d px: Blockhoehen laufen auseinander (awake %.1f, create %.1f, "
                           "Delta %.1f px)." % (w, a["block"]["h"], c["block"]["h"], d_block))
        if abs(d_bild) > 0.5:
            befunde.append("[B] %d px: Schriftzug-Hoehen ungleich (Delta %.1f px)." % (w, d_bild))
        if abs(d_tinte) > 1.0:
            befunde.append("[B] %d px: die Tinte der zwei Schriftzuege steht verschieden weit "
                           "von der Mitte (awake %.1f, create %.1f px)."
                           % (w, a["tinte_mitte_versatz"], c["tinte_mitte_versatz"]))

    # ---------------------------------------------------------------- Arm C
    zeilen.append("")
    zeilen.append("[C] WORTMARKE: stimmen die hinterlegten Masse noch mit den Dateien?")
    try:
        profil = _sorten_profil(args.repo)
        for sorte in SORTEN:
            p = profil[sorte]
            (bw, bh), kasten = _tinten_kasten(_lade_bild(p["url"]))
            x0, y0, x1, y1 = kasten
            dx_ist = ((x0 + x1) / 2 - bw / 2) / bw * -100.0
            zeilen.append("    %-7s Datei %dx%d  Tinte (%d,%d,%d,%d)  Ausgleich ist %.3f%% / "
                          "hinterlegt %.3f%%" % (sorte, bw, bh, x0, y0, x1, y1, dx_ist, p["tinte_dx"]))
            if (bw, bh) != (int(p["breite"]), int(p["hoehe"])):
                befunde.append("[C] %s: die Wortmarke misst %dx%d, hinterlegt sind %dx%d. "
                               "Wurde die Datei getauscht, stimmt auch der Ausgleich nicht mehr."
                               % (sorte, bw, bh, int(p["breite"]), int(p["hoehe"])))
            if (x0, y0, x1, y1) != (int(p["x0"]), int(p["y0"]), int(p["x1"]), int(p["y1"])):
                befunde.append("[C] %s: der Tinten-Kasten ist (%d,%d,%d,%d), hinterlegt ist "
                               "(%d,%d,%d,%d)." % (sorte, x0, y0, x1, y1,
                                                   int(p["x0"]), int(p["y0"]), int(p["x1"]), int(p["y1"])))
            if abs(dx_ist - p["tinte_dx"]) > 0.05:
                befunde.append("[C] %s: der hinterlegte Ausgleich %.3f%% weicht vom gemessenen "
                               "%.3f%% ab — der Schriftzug wird in die falsche Richtung "
                               "geschoben." % (sorte, p["tinte_dx"], dx_ist))
            # Aufloesungs-Reserve bei dreifacher Pixeldichte, an der wirklich
            # gerenderten Hoehe gemessen statt an der CSS-Absicht.
            hoehe_css = erg[(1440, sorte)]["bild"]["h"]
            noetig = 3 * hoehe_css * (bw / bh)
            zeilen.append("            bei 3x Pixeldichte noetig: %d Punkte, vorhanden: %d"
                          % (round(noetig), bw))
            if noetig > bw * 1.02:
                befunde.append("[C] %s: der Schriftzug wird bei dreifacher Pixeldichte "
                               "hochgezogen (%d noetig, %d vorhanden) — er franst aus."
                               % (sorte, round(noetig), bw))
    except Messausfall as e:
        print("[MESSAUSFALL] Arm C: %s" % e, file=sys.stderr)
        for z in zeilen:
            print(z)
        return 4

    # ---------------------------------------------------------------- Arm D
    zeilen.append("")
    zeilen.append("[D] DECKEL: kostet der Abschnitt weniger als sein Vorgaenger?")
    for w, grenze in DECKEL.items():
        for sorte in SORTEN:
            h = erg[(w, sorte)]["block"]["h"]
            zeilen.append("    %-7s bei %d px: %.1f px (Deckel %.1f)" % (sorte, w, h, grenze))
            if h > grenze:
                befunde.append("[D] %s bei %d px: der Abschnitt ist %.1f px hoch und "
                               "ueberschreitet den Deckel %.1f px."
                               % (sorte, w, h, grenze))

    if args.json:
        json.dump({"befunde": befunde,
                   "messung": {"%d/%s" % k: v for k, v in erg.items()}},
                  sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        for z in zeilen:
            print(z)
        print()
        if befunde:
            print("=== %d BEFUND(E) ===" % len(befunde))
            for b in befunde:
                print("  " + b)
        else:
            print("OK: Inhalt da, beide Sorten deckungsgleich ueber %d Breiten, "
                  "Wortmarken-Masse stimmen, Deckel gehalten (%s)"
                  % (len(BREITEN), args.basis))
    return 1 if befunde else 0


if __name__ == "__main__":
    sys.exit(main())
