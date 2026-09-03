#!/usr/bin/env python3
"""Probe: die Crystal-Cacao-Storefront liefert keinen Fremdinhalt aus.

WAS DIESE PROBE MISST — und warum sie den Quelltext NICHT liest:
Die groesste Fremdinhalts-Quelle dieser Storefront stand in KEINER Zeile Code.
Sie entstand daraus, dass die Hydrogen-Catch-all-Routen den geteilten
Shopify-Katalog (qi-blanco.myshopify.com) ungefiltert abfragten. Gemessen am
2026-09-02 auf origin/main 86ee245 antwortete /products/qione-2-pro mit HTTP
200 und 26497 Bytes voll gerenderter Fremdproduktseite; /pages/studien mit
105308 Bytes; /collections/all mit 35067 Bytes. Ein `grep` ueber app/ findet
davon nichts und meldet faelschlich sauber. Deshalb misst diese Probe
ausschliesslich AUSGELIEFERTES HTML.

DREI ARME, weil ein einziger jeweils blind waere:
  A  Kakao-Routen ANTWORTEN und enthalten keine Fremdmarke.
     (Nur A: die Fremd-Handles wuerden nie abgefragt.)
  B  Fremd-Handles antworten NICHT mit Inhalt (404 erwartet).
     (Nur B: eine kaputte Storefront gaebe ueberall 404 und waere "gruen".)
  C  Die Kakao-Routen tragen weiterhin ihren erwarteten Kakao-Inhalt.
     (Der Riegel gegen A+B: eine leere Huelle antwortet mit 200 und ohne
     Fremdmarke, waere also nach A und B gruen und trotzdem kaputt. Genau der
     Fehler, den die Blog-Lehre vom 2026-08-31 beschreibt: Erreichbarkeit ist
     nicht Inhalt.)

ZUSAGE, bewusst OHNE Zaehler-Pin: "0 Fremdtreffer". Die Zahl der geprueften
Routen darf wachsen, ohne diese Probe rot zu faerben.

EXIT-CODES
  0  gruen
  1  Befund (Fremdinhalt erreichbar oder Kakao-Inhalt fehlt)
  4  Messausfall (Server nicht erreichbar) — ausdruecklich KEIN Gruen

AUFRUF
  pruefungen/probe_fremdinhalt.py [--basis http://localhost:3399]
  Laeuft der Server nicht, startet die Probe ihn NICHT selbst — sie sagt
  Messausfall. Ein selbst gestarteter Server waere ein zweiter Messgegenstand.
"""
from __future__ import annotations

import argparse
import re
import sys
import urllib.error
import urllib.request

# Die Marken des Fremdsortiments. Absichtlich die MARKEN und nicht die Handles:
# ein Handle kann sich aendern, die Marke steht im Text.
FREMD_MARKEN = re.compile(r"QiOne|QiHome|QiBracelet|Gitterchip", re.I)

# Routen, die es geben MUSS — mit dem Inhalt, den ein Mensch dort sehen soll.
# Der zweite Eintrag ist der Riegel gegen die leere Huelle: er nennt einen
# INHALT, nie nur einen Statuscode.
#
# NACHGEZOGEN 2026-09-02 (Segment s05), und die Begruendung gehoert hierher,
# weil der naheliegende Verdacht ("die Probe wurde weichgeklopft") falsch waere:
# Der Marker fuer "/" war "Zeremonie Kakao" — der TITEL der Shopify-Kollektion,
# den die Startseite als Kachel rendert. Diese Kachel traegt im Admin KEIN Bild
# (gemessen: collection.image ist null); sie bestand also aus nichts als dieser
# einen 39px-Ueberschrift mit einem Backend-Namen darin und wurde deshalb
# entfernt. Damit verschwand der Marker — die Probe wurde rot, ohne dass etwas
# kaputt war.
# DER NEUE MARKER IST STAERKER, NICHT SCHWAECHER: "Unsere Sorten" ist die
# Ueberschrift ueber dem Produktraster und existiert NUR auf "/". Sie steht
# unmittelbar vor der Liste, die aus der gezaeunten Kollektions-Query kommt —
# fehlt die Route-Antwort, fehlt sie mit. Der alte Marker haette dagegen auch
# dann noch gestanden, wenn das Raster selbst leer geblieben waere.
KAKAO_ROUTEN = [
    ("/", "Unsere Sorten"),
    ("/pages/crystal-cacao", "Kakao"),
    ("/products/crystal-cacao-awake", "AWAKE"),
    ("/products/crystal-cacao-create", "CREATE"),
    ("/collections/zeremonie-kakao", "Crystal Cacao"),
    ("/cart", "Warenkorb"),
    ("/search", "Suche"),
    ("/policies", None),
]

# Handles des Fremdsortiments, die NICHT mehr ausgeliefert werden duerfen.
FREMD_ROUTEN = [
    "/products/qione-2-pro",
    "/products/qibracelet",
    "/products/qihome-air",
    "/products/qione-kette",
    "/pages/studien",
    "/collections/all",
    "/collections/frontpage",
    "/collections/digitale-kurse",
]


class _KeinRedirect(urllib.request.HTTPRedirectHandler):
    """Verfolgt Weiterleitungen NICHT.

    Der Grund ist am eigenen Fehlschlag gelernt (2026-09-02): /collections/all
    leitet auf die Kakao-Kollektion um. Mit Redirect-Verfolgung endet der Abruf
    bei HTTP 200 auf einer voellig korrekten Kakao-Seite — und eine Probe, die
    "404 erwartet" prueft, meldet daraufhin einen Befund, den es nicht gibt.
    Gemessen werden muss der Status, den die FREMD-URL selbst gibt.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def hole(basis: str, pfad: str, timeout: int = 60, folge: bool = True):
    """Gibt (status, text, ziel) zurueck. status None = nicht erreichbar."""
    req = urllib.request.Request(
        basis + pfad, headers={"User-Agent": "probe-fremdinhalt/1"}
    )
    oeffner = (
        urllib.request.build_opener()
        if folge
        else urllib.request.build_opener(_KeinRedirect)
    )
    try:
        with oeffner.open(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace"), r.headers.get("Location")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), e.headers.get("Location")
    except Exception:
        return None, "", None


def sichtbar(html: str) -> str:
    """Nur der Text, den ein Besucher sieht — <script> raus.

    Das ist die haerteste Stelle der Probe: der Hydratations-Datensatz in den
    <script>-Bloecken enthaelt Daten, die NICHT gerendert werden. Wer ihn
    mitmisst, meldet Befunde, die kein Mensch je zu sehen bekommt; wer nur ihn
    misst, uebersieht den sichtbaren Text. Diese Probe prueft BEIDES getrennt
    (siehe unten) und meldet den Unterschied.
    """
    return re.sub(r"<script.*?</script>", "", html, flags=re.S)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--basis", default="http://localhost:3399")
    a = ap.parse_args()
    basis = a.basis.rstrip("/")

    status, _, _ = hole(basis, "/")
    if status is None:
        print(f"MESSAUSFALL: {basis} nicht erreichbar. Erst `npm run dev` starten.")
        return 4

    befunde: list[str] = []
    gemessen = 0

    # --- Arm A + C: Kakao-Routen antworten, ohne Fremdmarke, mit Inhalt ---
    for pfad, muss_enthalten in KAKAO_ROUTEN:
        code, html, _ = hole(basis, pfad)
        if code is None:
            print(f"MESSAUSFALL: {pfad} nicht erreichbar")
            return 4
        gemessen += 1
        if code != 200:
            befunde.append(f"[A] {pfad}: HTTP {code}, erwartet 200")
            continue

        vis = sichtbar(html)
        sicht_treffer = FREMD_MARKEN.findall(vis)
        if sicht_treffer:
            befunde.append(
                f"[A] {pfad}: {len(sicht_treffer)} SICHTBARE Fremdnennung(en): "
                + ", ".join(sorted(set(t.lower() for t in sicht_treffer)))
            )

        # Der Datensatz zaehlt getrennt: unsichtbar ist nicht abwesend.
        rest = FREMD_MARKEN.findall(html)
        if len(rest) > len(sicht_treffer):
            befunde.append(
                f"[A] {pfad}: {len(rest) - len(sicht_treffer)} Fremdnennung(en) "
                "im ausgelieferten Datensatz (nicht gerendert, aber ueber die "
                "Leitung gegangen und eine Komponentenaenderung von der "
                "Sichtbarkeit entfernt)"
            )

        if muss_enthalten and muss_enthalten.lower() not in vis.lower():
            befunde.append(
                f"[C] {pfad}: antwortet mit 200, aber ohne den erwarteten "
                f"Kakao-Inhalt {muss_enthalten!r} — leere Huelle?"
            )

    # --- Arm B: Fremd-Handles liefern keinen Fremdinhalt mehr ---
    # ZULAESSIG sind ZWEI Antworten, und die Unterscheidung ist der Punkt:
    #   404      — es gibt diese Seite hier nicht (der Regelfall des Zauns);
    #   3xx      — sie leitet auf eine Kakao-Flaeche um (so behandelt der Zaun
    #              /collections und /collections/all, weil der leere Warenkorb
    #              sichtbar dorthin verlinkt und ein 404 den Kaufweg braeche).
    # UNZULAESSIG ist allein HTTP 200 MIT Inhalt. Deshalb wird hier bewusst
    # OHNE Redirect-Verfolgung gemessen: mit ihr endet /collections/all bei 200
    # auf einer korrekten Kakao-Seite und saehe wie ein Befund aus.
    for pfad in FREMD_ROUTEN:
        code, html, ziel = hole(basis, pfad, folge=False)
        if code is None:
            print(f"MESSAUSFALL: {pfad} nicht erreichbar")
            return 4
        gemessen += 1
        if code in (301, 302, 303, 307, 308):
            if not ziel or "qione" in ziel.lower() or "qihome" in ziel.lower():
                befunde.append(f"[B] {pfad}: leitet auf {ziel!r} — kein Kakao-Ziel")
            continue
        if code == 200:
            n = len(FREMD_MARKEN.findall(sichtbar(html)))
            befunde.append(
                f"[B] {pfad}: HTTP 200 statt 404/Umleitung — Fremdinhalt "
                f"weiterhin abrufbar ({len(html)} Bytes, {n} sichtbare "
                "Fremdnennungen)"
            )

    if befunde:
        print(f"ROT: {len(befunde)} Befund(e) auf {gemessen} gemessenen Routen\n")
        for b in befunde:
            print("  " + b)
        return 1

    print(f"OK: 0 Fremdtreffer auf {gemessen} gemessenen Routen ({basis})")
    print("     Arm A sichtbarer Text · Arm B Fremd-Handles 404 · Arm C Kakao-Inhalt da")
    return 0


if __name__ == "__main__":
    sys.exit(main())
