#!/usr/bin/env python3
"""Die Quelltext-Invarianten der Angleichung — messbar OHNE laufenden Server.

WOZU ES DIESE PROBE NEBEN probe_angleichung.py GIBT, und die Abgrenzung ist der
ganze Punkt:

  probe_angleichung.py misst die WIRKUNG am gerenderten Ergebnis. Das ist die
  staerkere Aussage — und sie ist nur moeglich, solange ein Server laeuft. Beim
  taeglichen nachbau-audit-Tick laeuft keiner; die Probe gibt dort ehrlich
  exit 4 (Messausfall, ausdruecklich kein Gruen) und trifft damit KEINE Aussage.
  Eine Hypothese, deren Probe dauerhaft "keine Aussage" liefert, ist Deko.

  DIESE Probe misst deshalb den ARTEFAKT-Zustand: genau die Bauformen, deren
  Verlust den behobenen Defekt zurueckbringt. Sie ist die SCHWAECHERE Aussage
  und sagt das selbst — sie belegt nicht, dass die Seite gut aussieht, sondern
  dass niemand die Traeger wieder herausgenommen hat.

DIE FALLE, DIE SIE VERMEIDET (bekannter Belegfall F-014, hyros-eigenbau
2026-08-09): ein `git grep` ist ein TEXTTREFFER, kein Messwert — der Treffer
kann im Kommentar stehen, der das Gegenteil sagt. Diese Probe entfernt deshalb
VOR jedem Vergleich alle Kommentare (JS-Zeilen- und Blockkommentare,
CSS-Blockkommentare) und misst nur, was der Parser sieht. Der Selbsttest
beweist das mit einem Kommentar, der den gesuchten Text traegt.

EXIT
  0  alle Invarianten stehen
  1  mindestens eine Invariante fehlt
  4  Messausfall (Repo-Wurzel nicht gefunden)

AUFRUF
  pruefungen/probe_angleichung_statisch.py [--repo PFAD] [--selbsttest]
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys

WURZEL_DEFAULT = pathlib.Path(__file__).resolve().parent.parent


def ohne_kommentare(text: str, art: str) -> str:
    """Kommentare raus — sonst misst man die Absichtserklaerung statt den Code."""
    text = re.sub(r"/\*.*?\*/", " ", text, flags=re.S)
    if art == "js":
        # Zeilenkommentare nur am Zeilenanfang bzw. nach Leerraum, damit ein
        # "https://" in einem String nicht als Kommentar verschwindet.
        text = re.sub(r"(?m)(^|\s)//.*$", r"\1 ", text)
    return text


# (Datei, Art, Beschreibung der Invariante, Muster das VORHANDEN sein muss,
#  Muster das FEHLEN muss)
INVARIANTEN = [
    (
        "app/lib/kakao-zone.js",
        "js",
        "Der Blog-Zaun hat eine Allowlist und ein Praedikat",
        [r"export const KAKAO_BLOGS", r"export function istKakaoBlog"],
        [],
    ),
    (
        "app/routes/blogs._index.jsx",
        "js",
        "Die Blog-Uebersicht weist ab, solange kein Kakao-Blog eingetragen ist",
        [r"KAKAO_BLOGS\.length === 0", r"fremdinhaltAbweisen\(\)"],
        [],
    ),
    (
        "app/routes/blogs.$blogHandle._index.jsx",
        "js",
        "Der einzelne Blog haengt am Zaun",
        [r"istKakaoBlog\(", r"fremdinhaltAbweisen\(\)"],
        [],
    ),
    (
        "app/routes/blogs.$blogHandle.$articleHandle.jsx",
        "js",
        "Der einzelne Artikel haengt am Zaun (Uebersicht sperren und Artikel "
        "offen lassen waere ein Zaun mit Tuer daneben)",
        [r"istKakaoBlog\(", r"fremdinhaltAbweisen\(\)"],
        [],
    ),
    (
        "app/routes/search.jsx",
        "js",
        "Die Suche filtert Artikel — und zieht das dafuer noetige Feld mit",
        [r"gattung === 'articles'", r"istKakaoBlog\(", r"blog\s*\{\s*handle"],
        # Cursor-Paginierung ueber einem nachgelagerten Filter erzeugt leere
        # Seiten und eine Trefferzahl aus zwei Grundmengen.
        [r"getPaginationVariables"],
    ),
    (
        "app/routes/sitemap.$type.$page[.xml].jsx",
        "js",
        "Die Sitemap kommt aus dem eigenen Zaun, nicht aus dem Hydrogen-Helfer",
        [r"sitemapSeiten"],
        [r"getSitemap\b"],
    ),
    (
        "app/routes/[sitemap.xml].jsx",
        "js",
        "Der Sitemap-Index ebenso",
        [r"sitemapIndex"],
        [r"getSitemapIndex"],
    ),
    (
        "app/lib/sitemap-zaun.js",
        "js",
        "Der Sitemap-Zaun zieht seine Auswahl aus derselben SSoT wie die Routen",
        [r"from '~/lib/kakao-zone'", r"KAKAO_SEITEN", r"KAKAO_KOLLEKTIONEN", r"KAKAO_BLOGS"],
        # Drei hreflang-Sprachen, die diese App nicht bedient.
        [r"EN-CA", r"FR-CA"],
    ),
    (
        "app/root.jsx",
        "js",
        "Die Fehlerseite steht im Layout und ist keine Sackgasse mehr",
        [r"isRouteErrorResponse", r"<PageLayout", r"cc-knopfreihe"],
        [],
    ),
    (
        "app/styles/app.css",
        "css",
        "Die uebrigen Seiten benutzen die Token-Schicht statt freier Werte",
        [
            r"--color-dark:\s*var\(--cc-dunkel",
            r"background:\s*var\(--cc-grund",
            r"\.cc-knopf\s*\{",
            r"--grid-item-width:\s*min\(",
            r"aside header \.close",
        ],
        [],
    ),
    (
        "app/styles/kakao-seiten.css",
        "css",
        "Das Warenkorb-Abzeichen bleibt im Kasten (absolut positionierte Kinder "
        "zaehlen zur scrollWidth ihres Vorfahren)",
        [r"right:\s*-6px"],
        [r"right:\s*-10px"],
    ),
]


def pruefe(wurzel: pathlib.Path) -> list[str]:
    befunde: list[str] = []
    for pfad, art, was, muss, darf_nicht in INVARIANTEN:
        datei = wurzel / pfad
        if not datei.exists():
            befunde.append(f"{pfad}: Datei fehlt — {was}")
            continue
        code = ohne_kommentare(datei.read_text(encoding="utf-8"), art)
        for m in muss:
            if not re.search(m, code):
                befunde.append(f"{pfad}: »{m}« fehlt im Code — {was}")
        for m in darf_nicht:
            if re.search(m, code):
                befunde.append(f"{pfad}: »{m}« steht wieder im Code — {was}")
    return befunde


def selbsttest() -> int:
    """Beweist, dass die Probe Kommentare NICHT mitmisst — in beide Richtungen."""
    fehler = []
    # (1) Ein Muster, das NUR im Kommentar steht, darf nicht als vorhanden gelten.
    js = "// hier stand einmal getSitemap()\nconst x = 1;\n"
    if re.search(r"getSitemap\b", ohne_kommentare(js, "js")):
        fehler.append("Zeilenkommentar wird mitgemessen")
    css = "/* right: -10px war der Fehler */\n.a { right: -6px; }\n"
    ohne = ohne_kommentare(css, "css")
    if re.search(r"right:\s*-10px", ohne):
        fehler.append("CSS-Blockkommentar wird mitgemessen")
    # (2) Die Gegenrichtung: echter Code darf NICHT verschwinden.
    if not re.search(r"right:\s*-6px", ohne):
        fehler.append("echter CSS-Code verschwindet beim Kommentar-Entfernen")
    if not re.search(r"const x = 1", ohne_kommentare(js, "js")):
        fehler.append("echter JS-Code verschwindet beim Kommentar-Entfernen")
    # (3) Eine URL in einem String ist kein Kommentar.
    if not re.search(r"example\.com", ohne_kommentare('const u = "https://example.com/a";', "js")):
        fehler.append("URL in einem String wird als Kommentar verschluckt")
    if fehler:
        print("SELBSTTEST ROT:")
        for f in fehler:
            print("  " + f)
        return 1
    print("SELBSTTEST OK: 5 Arme — Kommentare werden weder mitgemessen noch "
          "reisst das Entfernen echten Code heraus.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=str(WURZEL_DEFAULT))
    ap.add_argument("--selbsttest", action="store_true")
    a = ap.parse_args()

    if a.selbsttest:
        return selbsttest()

    wurzel = pathlib.Path(a.repo).resolve()
    if not (wurzel / "app" / "lib" / "kakao-zone.js").exists():
        print(f"MESSAUSFALL: {wurzel} sieht nicht wie das crystal-Repo aus.")
        return 4

    befunde = pruefe(wurzel)
    if befunde:
        print(f"ROT: {len(befunde)} Invariante(n) verletzt\n")
        for b in befunde:
            print("  " + b)
        print(
            "\nHINWEIS: Diese Probe misst den QUELLTEXT, nicht die Wirkung. Sie "
            "belegt nicht, dass die Seiten gut aussehen — sie belegt, dass die "
            "Traeger der Angleichung noch da sind. Die Wirkung misst "
            "pruefungen/probe_angleichung.py gegen einen laufenden Server."
        )
        return 1

    print(
        f"OK: {len(INVARIANTEN)} Quelltext-Invarianten der Angleichung stehen "
        "(Kommentare ausgenommen). Die WIRKUNG misst probe_angleichung.py."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
