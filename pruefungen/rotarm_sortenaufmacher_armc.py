#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""rotarm_sortenaufmacher_armc — macht Arm C von probe_sortenaufmacher.py rot.

WARUM ES DIESE DATEI GIBT, obwohl `--fassung bestand` schon ein Rot-Nachweis ist:
weil sie einen ANDEREN Arm belegt als der. Arm C hat VIER BEINE, und ein
Rot-Nachweis am einen zertifiziert die anderen nicht:

  C1 Masse          Datei-Breite/-Hoehe gegen `breite`/`hoehe`
  C2 Tinten-Kasten  gemessener Kasten gegen x0/y0/x1/y1
  C3 Ausgleich      gemessener Versatz gegen `tinte_dx`
  C4 Reserve        Aufloesungs-Reserve bei dreifacher Pixeldichte

`--fassung bestand` roetet AUSSCHLIESSLICH C4 — der aufbewahrte Vorzustand
rendert die Wortmarke groesser, die BILDDATEIEN sind dieselben. C1/C2/C3
vergleichen Datei gegen sorten-profil.js und sind dort per Konstruktion gruen.
Gemessen am 2026-09-11: `--fassung bestand` gibt 34 Befunde (A 12, B 18,
C 2, D 2) — und beide C-Befunde sind C4 („franst aus"). C1, C2 und C3 waren
bis dahin NIE rot gefahren.

LIVE IST DER ZUSTAND NICHT HERSTELLBAR: C1-C3 werden nur rot, wenn jemand eine
Wortmarken-Datei austauscht, ohne die Geometrie nachzumessen — genau der
Vorgang, gegen den Arm C gebaut ist. Deshalb hermetisch: der Pruefgegenstand
bleibt die LIVE-Seite und die ECHTEN CDN-Dateien, verfaelscht wird allein die
HINTERLEGTE Geometrie, in einem Wegwerf-Baum. Moeglich ist das ohne Eingriff
in den Bestand, weil die Probe `--repo` fuehrt und `--repo` NUR
app/lib/sorten-profil.js aufloest (nachgelesen, nicht vermutet).

DIE FEHLERRICHTUNG, und sie ist der Punkt: exit 4 (Messausfall) ist hier NIE
ein Erfolg. „Ich kann den Rot-Zustand nicht mehr herstellen" und „der
Pruefgegenstand ist in Ordnung" sind zwei Saetze; faellt die Probe in einen
Messausfall (Pillow fehlt, Seite nicht erreichbar), ist das ein MESSAUSFALL
dieses Rot-Arms und kein Beleg.

AUFRUF   /usr/bin/python3 pruefungen/rotarm_sortenaufmacher_armc.py
         INTERPRETER IST /usr/bin/python3 — pw-python traegt kein Pillow.
EXIT     0 = ROT BELEGT (alle drei Beine haben je ihren eigenen Befund)
         1 = NICHT belegt (ein Bein blieb stumm)
         4 = MESSAUSFALL (die Probe konnte nicht messen) — nie ein Beleg
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile

# SHOP-LANDKARTE STATT DOMAIN-LITERAL (Job 20260911-crystal-cacao-literale-auf-sm-url-
# und-adoption-regex-prio30). Derselbe Griff wie im Pruefgegenstand nebenan
# (probe_sortenaufmacher.py): crystal und dach sind BEIDE Hydrogen mit
# `data-qb-region` und werden erst am Marker `header-marke` getrennt.
# WARUM HIER MIT, obwohl `adoption` diese Datei gar nicht sieht (ihr Abruf laeuft
# ueber den Pruefgegenstand, `ABRUF` trifft sie nicht): ein Rot-Arm, der auf einen
# ANDEREN Laden zeigt als sein Pruefgegenstand, belegt nichts -- und das Auseinander-
# laufen der beiden waere still.
sys.path.insert(0, "/srv/openclaw/shared-state/storefront-messung/src")
try:
    import storefront_messung as sm          # noqa: E402
except Exception as _sm_fehlt:               # Landkarte fehlt -> MESSAUSFALL, nie Befund
    print("MESSAUSFALL: storefront_messung nicht ladbar (%s)" % _sm_fehlt,
          file=sys.stderr)
    raise SystemExit(4)

BASIS_VORGABE = f"https://{sm.shop('crystal').domain}"   # Domain aufloesen, nicht tippen


HIER = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HIER)
PROBE = os.path.join(HIER, "probe_sortenaufmacher.py")
PROFIL = os.path.join(REPO, "app", "lib", "sorten-profil.js")

# (Bein, Ersetzung im Quelltext, Erkennungsmuster im Befund)
BEINE = [
    ("C1 Masse", ("breite: 995", "breite: 900"),
     r"\[C\] awake: die Wortmarke misst \d+x\d+, hinterlegt sind 900x"),
    ("C2 Tinten-Kasten", ("tinte: Object.freeze({x0: 11, y0: 7, x1: 950, y1: 353})",
                          "tinte: Object.freeze({x0: 20, y0: 7, x1: 950, y1: 353})"),
     r"\[C\] awake: der Tinten-Kasten ist \([\d,]+\), hinterlegt ist \(20,"),
    ("C3 Ausgleich", ("tinte_dx: 0,", "tinte_dx: 5.0,"),
     r"\[C\] create: der hinterlegte Ausgleich 5\.000% weicht vom gemessenen"),
]


def main():
    basis = sys.argv[1] if len(sys.argv) > 1 else BASIS_VORGABE
    try:
        src = open(PROFIL, encoding="utf-8").read()
    except OSError as exc:
        print("MESSAUSFALL: sorten-profil.js nicht lesbar: %s" % exc)
        return 4

    # VORFLUG: greift jede Mutation ueberhaupt? Eine Ersetzung, die ins Leere
    # laeuft, erzeugt einen gruenen Lauf, der wie ein gesunder Pruefgegenstand
    # aussieht — der Aufbau muss vor der Messung scheitern, nicht nach ihr.
    mutiert = src
    for name, (alt, neu), _ in BEINE:
        if alt not in mutiert:
            print("MESSAUSFALL: Anker fuer %s nicht mehr in sorten-profil.js: %r" % (name, alt))
            print("  Die Datei hat sich bewegt — dieser Rot-Arm ist neu zu fassen, "
                  "nicht zu loeschen.")
            return 4
        mutiert = mutiert.replace(alt, neu, 1)

    zwilling = tempfile.mkdtemp(prefix="rotarm-armc-")
    try:
        os.makedirs(os.path.join(zwilling, "app", "lib"))
        with open(os.path.join(zwilling, "app", "lib", "sorten-profil.js"), "w",
                  encoding="utf-8") as fh:
            fh.write(mutiert)
        p = subprocess.run([sys.executable, PROBE, "--basis", basis, "--repo", zwilling],
                           capture_output=True, text=True, timeout=900)
    except Exception as exc:  # noqa: BLE001
        shutil.rmtree(zwilling, ignore_errors=True)
        print("MESSAUSFALL: Probe nicht ausfuehrbar: %s" % exc)
        return 4
    shutil.rmtree(zwilling, ignore_errors=True)

    ausgabe = p.stdout + p.stderr
    if p.returncode == 4:
        print("MESSAUSFALL: die Probe konnte nicht messen (exit 4) — kein Beleg.")
        print(ausgabe.strip()[-400:])
        return 4

    print("Probe exit=%d  (erwartet 1 = BEFUND)" % p.returncode)
    fehlt = []
    for name, _, muster in BEINE:
        treffer = re.search(muster, ausgabe)
        print("  %-18s %s" % (name, "ROT BELEGT" if treffer else "STUMM"))
        if treffer:
            print("      %s" % treffer.group(0))
        else:
            fehlt.append(name)

    if p.returncode != 1 or fehlt:
        print("\nNICHT BELEGT: %s" % (", ".join(fehlt) or "Exit-Code weicht ab"))
        return 1
    print("\nROT BELEGT: Arm C schlaegt auf allen drei Geometrie-Beinen einzeln aus.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
