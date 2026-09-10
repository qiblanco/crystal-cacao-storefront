#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MESSGERAET fuer den Kaufblock von /products/crystal-cacao-{awake,create}.

Job 20260910-BAU-sternzeile-ist-eine-tote-flaeche-und-produktseite-naeher-ans-original.

WAS DAS IST UND WAS NICHT: ein MESSGERAET, keine Wache. Es faellt kein Urteil und
hat keine Schwelle -- es druckt Zahlen, damit VORHER und NACHHER mit DEMSELBEN
Instrument erhoben sind. Ein Vergleich zweier Messungen aus zwei Instrumenten
misst die Instrumente. Das URTEIL faellt pruefungen/probe_kaufblock.py.

GEMESSEN WIRD AM GERENDERTEN DOM, NICHT AM MARKUP -- das ist hier tragend:
Christians Befund lautet "Button, der aufleuchtet und nirgendwo hin geht".
Ob eine Flaeche irgendwo hin geht, steht NICHT im Markup: ein <button> ohne
Handler und ein <button> mit Handler sehen im HTML identisch aus. Gemessen wird
deshalb die WIRKUNG eines echten Klicks (scrollY vorher/nachher, location.hash)
und die Existenz eines Sprungziels auf derselben Seite.

DIE ZWEITE MESSFALLE, aus dem Auftrag woertlich: ausgeliefertes HTML ist
verdichtet und traegt eingebettete Daten und fremde Titel. Deshalb zaehlt dieses
Geraet Vorkommen ausschliesslich ueber textContent von ELEMENTEN, nie ueber den
Zeichenstrom der Antwort.

EXIT
  0  gemessen
  4  MESSAUSFALL (Seite nicht erreichbar, Kaufblock nicht gefunden) -- nie als
     'alles in Ordnung' lesen
"""
from __future__ import annotations

import argparse
import json
import sys

BREITEN = [(390, 'telefon'), (768, 'tablet'), (1440, 'schreibtisch')]

# Rollen im Kaufblock. Schluessel = Rolle, Wert = CSS-Selektor.
ROLLEN = {
    'titel': '.product-main h1',
    'sternzeile': '.product-main .product-rating',
    'sterne_grafik': '.product-main .star-rating',
    'nutzerzeile': '.product-main .mt-2 b',
    'preis_aktuell': '.CacaoPriceCurrent',
    'preis_streich': '.CacaoPriceCompare',
    'preis_etikett': '.BestsellerLabel',
    'preis_grund': '.CacaoPricePer100g',
    'preisblock': '.Bestseller-Price',
    'kaufknopf': '.product-main button[type="submit"], .product-main .cc-knopf',
    'hakenliste': '.product-main ul',
}

JS_MESSEN = """
(rollen) => {
  const px = (v) => Math.round(v * 10) / 10;
  const messe = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      x: px(r.x), y: px(r.y + window.scrollY),
      breite: px(r.width), hoehe: px(r.height),
      schriftgroesse: px(parseFloat(s.fontSize)),
      schriftgewicht: s.fontWeight,
      farbe: s.color,
      tag: el.tagName.toLowerCase(),
      // textContent, NICHT innerHTML: der Auftrag verbietet das Zaehlen ueber
      // den Zeichenstrom.
      text: (el.textContent || '').trim().slice(0, 80),
    };
  };
  const out = {rollen: {}};
  for (const [name, sel] of Object.entries(rollen)) {
    const el = document.querySelector(sel);
    out.rollen[name] = messe(el);
  }
  // --- Die tote Flaeche: gemessen an der WIRKUNG, nicht am Markup -----------
  const zeile = document.querySelector('.product-main .product-rating');
  out.sternzeile_befund = null;
  if (zeile) {
    const s = getComputedStyle(zeile);
    out.sternzeile_befund = {
      tag: zeile.tagName.toLowerCase(),
      rolle_attr: zeile.getAttribute('role'),
      aria_label: zeile.getAttribute('aria-label'),
      qb_rating: zeile.getAttribute('data-qb-rating'),
      // Bietet sie sich als Handlung an?
      zeiger: s.cursor,
      fokussierbar: zeile.matches('a,button,[tabindex],input,select,textarea'),
      // Gibt es ueberhaupt ein Sprungziel auf DIESER Seite?
      sprungziele_seite: document.querySelectorAll(
        '#bewertungen,#reviews,[data-qb-bewertungsbereich],.google-rezensionen'
      ).length,
      sterne_gerendert: document.querySelectorAll('.product-main .star-rating').length,
    };
  }
  // --- Dopplung der Nutzerzahl: ueber ELEMENTE, nie ueber den Strom ---------
  const zahltexte = [];
  for (const el of document.querySelectorAll('.product-main *')) {
    if (el.children.length) continue;          // nur Blattknoten
    const t = (el.textContent || '').trim();
    if (/\\d[\\d.\\s]*\\+?\\s*(aktive\\s+)?Nutzer/i.test(t)) zahltexte.push(t.slice(0, 60));
  }
  out.nutzerzahl_vorkommen = zahltexte;
  return out;
}
"""


def messe_seite(page, url, breite):
    page.set_viewport_size({'width': breite, 'height': 900})
    page.goto(url, wait_until='networkidle', timeout=45000)
    page.wait_for_timeout(600)
    daten = page.evaluate(JS_MESSEN, ROLLEN)

    # Der Klick-Versuch: WIRKUNG statt Markup.
    zeile = page.query_selector('.product-main .product-rating')
    if zeile:
        # ZUERST ins Bild rollen, DANN den Ausgangswert nehmen. Ohne diesen
        # Schritt rollt Playwright beim Klick selbst -- und genau dieses
        # Einrollen wurde am 2026-09-10 bei 390 px als "754 px bewegt, ging
        # irgendwohin" gemessen, obwohl die Flaeche tot ist. Das Messgeraet
        # haette den Rot-Nachweis des eigenen Jobs widerlegt.
        zeile.scroll_into_view_if_needed(timeout=3000)
        page.wait_for_timeout(400)
        vorher = page.evaluate('() => ({y: window.scrollY, hash: location.hash})')
        try:
            zeile.click(timeout=3000)
            page.wait_for_timeout(900)
        except Exception as exc:                 # noqa: BLE001
            daten['klick_fehler'] = str(exc)[:120]
        nachher = page.evaluate('() => ({y: window.scrollY, hash: location.hash})')
        daten['klick'] = {
            'scrollY_vorher': vorher['y'], 'scrollY_nachher': nachher['y'],
            'hash_vorher': vorher['hash'], 'hash_nachher': nachher['hash'],
            'bewegt_px': round(abs(nachher['y'] - vorher['y']), 1),
            'ging_irgendwohin': (abs(nachher['y'] - vorher['y']) > 4
                                 or vorher['hash'] != nachher['hash']),
        }
    return daten


def ueberlappen(a, b):
    """Zwei gemessene Kaesten -- ueberlappende Flaeche in px^2 (Rect gegen Rect)."""
    if not a or not b:
        return None
    x = max(0, min(a['x'] + a['breite'], b['x'] + b['breite']) - max(a['x'], b['x']))
    y = max(0, min(a['y'] + a['hoehe'], b['y'] + b['hoehe']) - max(a['y'], b['y']))
    return round(x * y, 1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--basis', default='https://crystal-cacao.com')
    p.add_argument('--pfad', default='/products/crystal-cacao-create')
    p.add_argument('--json', action='store_true')
    p.add_argument('--aufnahme-nach', default=None,
                   help='Verzeichnis fuer Bildschirmaufnahmen je Breite')
    p.add_argument('--marke', default='messung')
    args = p.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('MESSAUSFALL: playwright fehlt', file=sys.stderr)
        return 4

    url = args.basis.rstrip('/') + args.pfad
    ergebnis = {'url': url, 'marke': args.marke, 'breiten': {}}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(locale='de-DE')
        page = ctx.new_page()
        for breite, name in BREITEN:
            try:
                d = messe_seite(page, url, breite)
            except Exception as exc:             # noqa: BLE001
                print(f'MESSAUSFALL bei {breite}px: {exc}', file=sys.stderr)
                browser.close()
                return 4
            d['ueberlappung_streich_etikett'] = ueberlappen(
                d['rollen'].get('preis_streich'), d['rollen'].get('preis_etikett'))
            d['ueberlappung_preiszeile_etikett'] = ueberlappen(
                d['rollen'].get('preis_aktuell'), d['rollen'].get('preis_etikett'))
            ergebnis['breiten'][name] = d
            if args.aufnahme_nach:
                page.set_viewport_size({'width': breite, 'height': 900})
                page.goto(url, wait_until='networkidle', timeout=45000)
                page.wait_for_timeout(600)
                ziel = f'{args.aufnahme_nach.rstrip("/")}/{args.marke}-{name}-{breite}.png'
                blk = page.query_selector('.product-main')
                (blk or page).screenshot(path=ziel)
                d['aufnahme'] = ziel
        browser.close()

    if ergebnis['breiten'].get('schreibtisch', {}).get('rollen', {}).get('preis_aktuell') is None:
        print('MESSAUSFALL: Kaufblock nicht gefunden', file=sys.stderr)
        return 4

    if args.json:
        print(json.dumps(ergebnis, ensure_ascii=False, indent=2))
        return 0

    for name, d in ergebnis['breiten'].items():
        print(f'\n=== {name} ({d["rollen"]["titel"]["breite"] if d["rollen"]["titel"] else "?"} px Titelbreite) ===')
        for rolle, m in d['rollen'].items():
            if m is None:
                print(f'  {rolle:18s} FEHLT')
            else:
                print(f'  {rolle:18s} {m["tag"]:7s} y={m["y"]:8.1f} {m["breite"]:6.1f}x{m["hoehe"]:5.1f} '
                      f'fs={m["schriftgroesse"]:5.1f} fw={m["schriftgewicht"]:3s} {m["farbe"]}')
        print(f'  ueberlappung Streichpreis x Etikett : {d["ueberlappung_streich_etikett"]} px^2')
        print(f'  ueberlappung Preiszeile   x Etikett : {d["ueberlappung_preiszeile_etikett"]} px^2')
        sb = d.get('sternzeile_befund')
        if sb:
            print(f'  sternzeile: <{sb["tag"]}> cursor={sb["zeiger"]} fokussierbar={sb["fokussierbar"]} '
                  f'qb={sb["qb_rating"]} sprungziele_auf_seite={sb["sprungziele_seite"]}')
        k = d.get('klick')
        if k:
            print(f'  KLICK: bewegt {k["bewegt_px"]} px, hash {k["hash_vorher"]!r} -> {k["hash_nachher"]!r}, '
                  f'ging_irgendwohin={k["ging_irgendwohin"]}')
        print(f'  Nutzerzahl-Vorkommen (Blattknoten): {d["nutzerzahl_vorkommen"]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
