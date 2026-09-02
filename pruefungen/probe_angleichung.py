#!/usr/bin/env python3
"""Misst, ob die UEBRIGEN Seiten wirklich an den Kakao-Seiten ausgerichtet sind.

GEGENSTAND (Job 20260902-GROSSJOB-crystal-cacao-…-prio6, Segment s05):
Christian: "…und sich die anderen Seiten optisch daran angleichen."

WAS DIESE PROBE MISST — fuenf Arme, jeder mit eigenem Befund-Praefix:

  [A] BLOG-ZAUN        /blogs, /blogs/<blog> und /blogs/<blog>/<artikel>
                       antworten 404, solange KAKAO_BLOGS leer ist.
  [B] SUCH-ZAUN        Die Suche liefert KEINEN Qi-Blanco-Artikel mehr.
  [C] SITEMAP-WAHRHEIT Jede Adresse in der Sitemap ist vom eigenen Shop
                       erreichbar. Das ist der Arm, der die Naht misst: Route
                       und Sitemap sind je fuer sich stimmig und widersprechen
                       sich trotzdem, wenn niemand sie gegeneinander haelt.
  [D] KEIN QUERSCROLL  Auf den Klasse-(b)-Flaechen ist scrollWidth ==
                       clientWidth bei 360, 390 und 768 px.
  [E] TOKEN + SPRACHE  Die uebrigen Seiten benutzen die Token-Schicht (nicht
                       nur: sie ist geladen), sprechen Du und tragen echte
                       Umlaute.

WAS SIE AUSDRUECKLICH NICHT MISST — damit niemand sie fuer mehr haelt als sie ist:
  * Die drei Kakao-Seiten. Die misst pruefungen/probe_kakao_naehe.py (s04).
  * Das Schliesskreuz. Dafuer gibt es homepage-bauer/bin/probe_overlay_
    schliesskreuz.py aus dem Parallel-Auftrag; diese Probe baut keine zweite
    Wache daneben. Sie prueft nur den EINEN Wert, den s05 dort geaendert hat
    (Trefferflaeche >= 44px) — als Regressionsriegel, nicht als Ersatz.
  * Rechtsfragen. Der Inhalt der Rechtstexte ist kein Gegenstand.

EXIT
  0  gruen
  1  Befund
  4  Messausfall (Server nicht erreichbar / Playwright fehlt) — KEIN Gruen

AUFRUF
  pruefungen/probe_angleichung.py [--basis http://localhost:3399]
  Die Probe startet den Server NICHT selbst — ein selbst gestarteter Server
  waere ein zweiter Messgegenstand.
"""
from __future__ import annotations

import argparse
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

# Klasse (b): kundensichtbar und anzugleichen. /account fehlt bewusst — die
# Customer Account API verlangt lokal einen Hydrogen-Tunnel und antwortet ohne
# ihn mit 400; eine Messung dort waere ein Messausfall, kein Urteil.
FLAECHEN_B = [
    "/",
    "/cart",
    "/search?q=kakao",
    "/search",
    "/collections/zeremonie-kakao",
    "/policies",
    "/policies/privacy-policy",
    "/policies/refund-policy",
    "/gibtesnicht-404-probe",
]

# Blogs, die es im Fremdshop gibt und die dieser Laden nicht ausliefern darf.
BLOG_PFADE = [
    "/blogs",
    "/blogs/news",
    "/blogs/e-smog",
    "/blogs/wissen",
    "/blogs/wissen/strukturiertes-wasser-was-am-trend-gemessen-ist",
]

# Suchbegriffe, die vor dem Zaun Qi-Blanco-ARTIKEL geliefert haben (gemessen
# 2026-09-02). Sie sind der Gegenstand, nicht ein Beispiel.
SUCH_BEGRIFFE = ["qione", "armband", "strahlung", "wasser", "schlaf"]

# Marken der fremden Welt. Bewusst die MARKEN, nicht die Handles.
FREMD_MARKEN = re.compile(r"QiOne|QiHome|QiBracelet|Gitterchip", re.I)

# Sie-Ansprache in kundensichtbarem Text. AUSGENOMMEN sind die Rechtstexte:
# dort ist die foermliche Anrede der ZWECK und keine Luecke — eine
# "Korrektur" dort waere eine inhaltliche Aenderung an einer Pflichtangabe.
SIEZEN = re.compile(r"\b(Sie|Ihnen|Ihre[nrms]?)\b")
OHNE_SIEZEN = [p for p in FLAECHEN_B if not p.startswith("/policies/")]

# Mojibake: echte Umlaute sind Pflicht, ASCII-Ersatz (ae/oe/ue) im
# kundensichtbaren Text ist ein Befund. Gesucht wird nach dem KAPUTTEN Zeichen,
# nicht nach "ae" — "Kakaoernte" traegt kein Mojibake, "Ã¼" schon.
MOJIBAKE = re.compile(r"Ã.|â€|�")

# Token, die auf einer angeglichenen Seite AUFGELOEST sein muessen. Gemessen
# wird der GERECHNETE Stil am Element, nicht die Anwesenheit der Datei —
# Lehre aus s03: eine CSS-Regel ist nicht dadurch belegt, dass ihr Text
# ausgeliefert wird.
TOKENS = ["--cc-grund", "--cc-gold", "--cc-fs-2", "--cc-space-2", "--cc-radius-knopf"]


def hole(basis: str, pfad: str, timeout: int = 60, folge: bool = True):
    """(status, text) — status None heisst nicht erreichbar.

    DER PFAD WIRD KODIERT, und das ist am eigenen Fehlschlag gelernt
    (2026-09-02): ein Shopify-Handle darf Zeichen ausserhalb von ASCII tragen —
    im Bestand steht `/products/test-page-crystal-cacao®-create-…`. Roh
    uebergeben wirft urllib, die Probe buchte das als "nicht erreichbar" und
    meldete einen Sitemap-Widerspruch, den es nicht gibt. Ein Messfehler, der
    wie ein Befund aussieht, ist teurer als gar keine Messung.
    """
    ziel = urllib.parse.quote(pfad, safe="/?=&%:+,.-_~")
    req = urllib.request.Request(
        basis + ziel, headers={"User-Agent": "probe-angleichung/1"}
    )

    class _Kein(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    oeffner = (
        urllib.request.build_opener()
        if folge
        else urllib.request.build_opener(_Kein)
    )
    try:
        with oeffner.open(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception:
        return None, ""


def sichtbar(html: str) -> str:
    """Nur was ein Besucher liest: <script> und <style> raus, Tags zu Leerraum.

    Der Hydratations-Datensatz in <script> traegt Daten, die NIE gerendert
    werden. Wer ihn mitmisst, meldet Befunde, die kein Mensch je sieht.
    """
    h = re.sub(r"(?is)<script.*?</script>", " ", html)
    h = re.sub(r"(?is)<style.*?</style>", " ", h)
    h = re.sub(r"(?s)<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", h)


def arm_blogs(basis, befunde):
    """Kein Blog-Inhalt wird ausgeliefert — gemessen am ENDE der Kette.

    WARUM MIT REDIRECT-VERFOLGUNG, obwohl der Nachbar-Arm [C] bewusst ohne
    misst: gemessen 2026-09-02 antwortet /blogs/news mit 301 auf /blogs/wissen,
    und /blogs/wissen dann mit 404. Das 301 stammt aus der Shopify-eigenen
    Weiterleitungsliste, die Hydrogens storefrontRedirect nach einer 404
    abfragt — es ist kein Loch im Zaun, sondern ein Glied davor. Die Frage
    dieses Arms ist nicht "welchen Status gibt die erste Antwort", sondern
    "bekommt der Besucher am Ende Blog-Inhalt zu sehen". Wer hier ohne
    Verfolgung misst, meldet ein 301 als Befund, obwohl nichts ausgeliefert
    wird — und wuerde beim naechsten Lauf denselben Fehlalarm erzeugen.
    """
    for pfad in BLOG_PFADE:
        st, html = hole(basis, pfad, folge=True)
        if st is None:
            befunde.append(f"[A] {pfad}: nicht erreichbar (Messausfall im Arm)")
        elif st != 404:
            ende = sichtbar(html)[:120]
            befunde.append(
                f"[A] {pfad}: die Kette endet mit HTTP {st} statt 404 — "
                f"es wird Inhalt ausgeliefert: »{ende}«"
            )


def arm_suche(basis, befunde):
    for begriff in SUCH_BEGRIFFE:
        st, html = hole(basis, f"/search?q={begriff}")
        if st != 200:
            befunde.append(f"[B] /search?q={begriff}: HTTP {st} statt 200")
            continue
        txt = sichtbar(html)
        # Die Ergebnis-Rubrik "Artikel" erscheint nur, wenn Artikel-Treffer da
        # sind — SearchResults.Articles gibt bei leerer Liste null zurueck.
        if re.search(r"\bArtikel\b", txt):
            befunde.append(
                f"[B] /search?q={begriff}: die Rubrik 'Artikel' erscheint — "
                "die Suche liefert wieder Magazin-Treffer aus dem Fremdshop"
            )
        if FREMD_MARKEN.search(txt):
            treffer = set(m.group(0) for m in FREMD_MARKEN.finditer(txt))
            befunde.append(
                f"[B] /search?q={begriff}: Fremdmarke(n) sichtbar: {sorted(treffer)}"
            )


def arm_sitemap(basis, befunde):
    st, index = hole(basis, "/sitemap.xml")
    if st != 200:
        befunde.append(f"[C] /sitemap.xml: HTTP {st} statt 200")
        return
    abschnitte = re.findall(r"<loc>([^<]+)</loc>", index)
    if not abschnitte:
        befunde.append("[C] /sitemap.xml nennt keinen einzigen Abschnitt")
        return
    adressen = []
    for a in abschnitte:
        pfad = a.split(basis, 1)[-1] if basis in a else a
        st2, xml = hole(basis, pfad)
        if st2 != 200:
            befunde.append(f"[C] {pfad}: HTTP {st2} statt 200")
            continue
        adressen += re.findall(r"<loc>([^<]+)</loc>", xml)
    if not adressen:
        befunde.append("[C] die Sitemap nennt keine einzige Adresse")
        return
    for adr in adressen:
        pfad = adr.split(basis, 1)[-1] if basis in adr else adr
        st3, _ = hole(basis, pfad, folge=False)
        # 200 und 3xx sind beide in Ordnung: eine Weiterleitung fuehrt den
        # Besucher ans Ziel. 404 ist der Befund — die Sitemap meldet dann eine
        # Adresse an, die der eigene Shop nicht kennt.
        if st3 is None or st3 >= 400:
            befunde.append(
                f"[C] Sitemap meldet {pfad} an, der eigene Shop antwortet "
                f"mit {st3} — Route und Sitemap widersprechen sich"
            )
    print(f"    [C] {len(adressen)} Sitemap-Adressen geprueft")


def arm_sprache(basis, befunde):
    for pfad in FLAECHEN_B:
        st, html = hole(basis, pfad)
        if st is None:
            befunde.append(f"[E] {pfad}: nicht erreichbar")
            continue
        txt = sichtbar(html)
        if MOJIBAKE.search(txt):
            stelle = MOJIBAKE.search(txt)
            umfeld = txt[max(0, stelle.start() - 30) : stelle.end() + 30]
            befunde.append(f"[E] {pfad}: kaputte Umlaut-Kodierung bei »{umfeld}«")
        if pfad in OHNE_SIEZEN:
            treffer = SIEZEN.findall(txt)
            if treffer:
                stelle = SIEZEN.search(txt)
                umfeld = txt[max(0, stelle.start() - 40) : stelle.end() + 40]
                befunde.append(
                    f"[E] {pfad}: Sie-Ansprache ({len(treffer)}x), erste bei »{umfeld}«"
                )
        if FREMD_MARKEN.search(txt):
            befunde.append(f"[E] {pfad}: Fremdmarke im sichtbaren Text")


def arm_browser(basis, befunde):
    """Quer-Scroll, aufgeloeste Token und Trefferflaeche des Schliesskreuzes.

    Braucht Playwright. Fehlt es, ist das ein MESSAUSFALL dieses Arms und
    ausdruecklich kein Gruen — der Aufrufer bekommt exit 4.
    """
    try:
        from playwright.sync_api import sync_playwright
    except Exception as fehler:  # pragma: no cover
        return f"Playwright nicht verfuegbar ({fehler})"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for breite, hoehe in [(360, 740), (390, 844), (768, 1024)]:
                ctx = browser.new_context(viewport={"width": breite, "height": hoehe})
                seite = ctx.new_page()
                for pfad in FLAECHEN_B:
                    seite.goto(basis + pfad, wait_until="networkidle", timeout=45000)
                    mass = seite.evaluate(
                        "() => ({sw: document.documentElement.scrollWidth,"
                        " cw: document.documentElement.clientWidth})"
                    )
                    if mass["sw"] > mass["cw"] + 1:
                        befunde.append(
                            f"[D] {pfad} bei {breite}px: scrollWidth {mass['sw']} > "
                            f"clientWidth {mass['cw']} — die Seite scrollt quer"
                        )

                # Token: am ECHTEN Element gerechnet, nicht im Stylesheet gesucht.
                seite.goto(basis + "/cart", wait_until="networkidle", timeout=45000)
                fehlend = seite.evaluate(
                    """(namen) => {
                        const cs = getComputedStyle(document.documentElement);
                        return namen.filter((n) => !cs.getPropertyValue(n).trim());
                    }""",
                    TOKENS,
                )
                if fehlend:
                    befunde.append(
                        f"[E] /cart bei {breite}px: Token loesen nicht auf: {fehlend}"
                    )
                # Der Grundton muss WIRKEN, nicht nur definiert sein.
                grund = seite.evaluate(
                    "() => getComputedStyle(document.body).backgroundColor"
                )
                if grund.replace(" ", "") not in ("rgb(251,248,244)",):
                    befunde.append(
                        f"[E] /cart bei {breite}px: Seitengrund ist {grund}, "
                        "erwartet der Kakao-Grundton rgb(251, 248, 244)"
                    )

                # Regressionsriegel fuer die EINE Groesse, die s05 geaendert hat.
                # Die vollstaendige Schliesskreuz-Pruefung leistet die Wache des
                # Parallel-Auftrags, nicht diese Probe.
                seite.goto(basis + "/", wait_until="networkidle", timeout=45000)
                seite.click(".header-menu-mobile-toggle" if breite < 1024 else ".header-menu-mobile-toggle")
                seite.wait_for_timeout(400)
                kreuz = seite.evaluate(
                    """() => {
                        const ov = document.querySelector('.overlay.expanded');
                        if (!ov) return null;
                        const b = ov.querySelector('button.close');
                        if (!b) return null;
                        const r = b.getBoundingClientRect();
                        return {w: Math.round(r.width), h: Math.round(r.height)};
                    }"""
                )
                if kreuz is None:
                    befunde.append(
                        f"[D] bei {breite}px: die Menue-Schublade oeffnet nicht "
                        "oder hat kein Schliesskreuz"
                    )
                elif kreuz["w"] < 44 or kreuz["h"] < 44:
                    befunde.append(
                        f"[D] Schliesskreuz bei {breite}px: {kreuz['w']}x{kreuz['h']} "
                        "< 44x44 (Regel B2 des Parallel-Auftrags)"
                    )
                ctx.close()
        finally:
            browser.close()
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--basis", default="http://localhost:3399")
    ap.add_argument(
        "--ohne-browser",
        action="store_true",
        help="Arm D/Token auslassen (dann exit 4, weil nicht alles gemessen ist)",
    )
    a = ap.parse_args()
    basis = a.basis.rstrip("/")

    status, _ = hole(basis, "/")
    if status is None:
        print(f"MESSAUSFALL: {basis} nicht erreichbar. Erst `npm run dev` starten.")
        return 4

    befunde: list[str] = []
    print(f"=== Angleichung der uebrigen Seiten — gemessen gegen {basis} ===")
    arm_blogs(basis, befunde)
    arm_suche(basis, befunde)
    arm_sitemap(basis, befunde)
    arm_sprache(basis, befunde)

    ausfall = None
    if a.ohne_browser:
        ausfall = "Arm D/Token per --ohne-browser ausgelassen"
    else:
        ausfall = arm_browser(basis, befunde)

    if befunde:
        print(f"\nROT: {len(befunde)} Befund(e)\n")
        for b in befunde:
            print(f"  {b}")
        return 1

    if ausfall:
        print(f"\nMESSAUSFALL: {ausfall} — ohne Messung kein Gruen.")
        return 4

    print(
        "\nOK: Blog-Zaun, Such-Zaun, Sitemap-Wahrheit, kein Querscroll bei "
        "360/390/768, Token aufgeloest, Du-Ansprache, echte Umlaute."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
