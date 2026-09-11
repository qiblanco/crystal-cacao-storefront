#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""URTEIL ueber den Kaufblock der beiden Kakao-Kaufseiten.

Job 20260910-BAU-sternzeile-ist-eine-tote-flaeche-und-produktseite-naeher-ans-original.

Christian, 2026-09-10 zur Produktseite Crystal Cacao Create:
  „Dass diese 4,9 Sterne mit Button hinterlegt sind, der aufleuchtet und dann
   nirgendwo hin geht, ist auch Quatsch. Das entfernen."
und, zur selben Aufnahme: der Streichpreis fast so gross wie der Preis und
teilweise unter dem Etikett, der Grundpreis weit abgesetzt, die Nutzerzahl
zweimal in acht Zeilen.

SECHS ARME, JEDER MIT EIGENEM BEFUND-PRAEFIX. Sie teilen sich den Exit-Code,
deshalb traegt jede Meldung ihren Arm im Text -- ein Exit-Code allein
unterscheidet Geschwisterarme nicht (Regel rot-vor-gruen, sechster Grenzfall).

  [A] TOTE FLAECHE   Die Sternzeile bietet sich nicht als Handlung an, die
                     keine ist. Erfuellt auf GENAU ZWEI Weisen:
                       (a) sie ist keine Handlungsflaeche (kein a/button, nicht
                           fokussierbar, kein Zeigefinger)  -- ODER
                       (b) sie ist eine und ein echter Klick kommt messbar
                           irgendwo an (Rollweg > 4 px oder neuer Hash).
                     Beides ist ein definiertes Verhalten. Verboten ist allein
                     das Dritte: sieht aus wie eine Handlung, ist keine.
  [B] STREICHPREIS   Der durchgestrichene Preis ist dem gueltigen Preis
                     untergeordnet (Schriftgroesse hoechstens 70 %).
  [C] ETIKETT        Das Bestseller-Etikett ueberlappt weder den Preis noch den
                     Streichpreis, und haelt einen Mindestabstand (>= 12 px).
  [D] GRUNDPREIS     Die Pflichtangabe steht am Preis, nicht abgesetzt
                     (senkrechte Luecke zur Preiszeile <= 12 px).
  [E] DOPPLUNG       Die Nutzerzahl steht im Kaufblock GENAU EINMAL.
  [F] KAUFWEG        Der Kauf-Knopf ist vorhanden, sichtbar und trifft sich
                     selbst im Hit-Test. Dieser Arm ist der Regressionsriegel:
                     kein Fix an der Darstellung darf den Kaufweg kosten.

WARUM AM GERENDERTEN DOM UND NICHT AM MARKUP -- das ist hier tragend: ob eine
Flaeche irgendwo hin geht, steht NICHT im HTML. Ein <button> mit Handler und
einer ohne sehen im Zeichenstrom identisch aus. Genau deshalb konnte die tote
Flaeche monatelang unbemerkt live stehen.

MESSFALLEN, BEIDE GEMESSEN UND BEIDE TEUER:
  (1) Eine Seite hat MEHRERE <main> -- jede aside-Schublade bringt eines mit.
      `document.querySelector('main')` liefert die Warenkorb-Schublade. Diese
      Probe arbeitet deshalb ausschliesslich unter `.product .product-main`.
  (2) Playwright rollt ein Element vor dem Klick SELBST ins Bild. Wer den
      Ausgangswert von scrollY vor diesem Einrollen nimmt, misst sein eigenes
      Werkzeug: gemessen 2026-09-10 meldete der erste Lauf "bewegt 754 px,
      ging irgendwohin" an einer nachweislich toten Flaeche. Deshalb
      scroll_into_view_if_needed VOR dem Ablesen.
  (3) Ausgeliefertes HTML ist verdichtet und traegt eingebettete Daten und
      fremde Titel (Auftrag woertlich). Arm E zaehlt deshalb ueber
      BLATTKNOTEN im Kaufblock, nie ueber den Zeichenstrom der Antwort.

KEIN GEPINNTER ZAEHLER: die Probe nennt keine Anzahl von Abschnitten, keine
Seitenlaenge und keinen Preis. Jede Schwelle ist ein VERHAELTNIS oder ein
Abstand, beides waechst nicht mit dem Ausbau der Seite.

EXIT
  0  gruen
  1  Befund
  4  MESSAUSFALL (Seite/Kaufblock nicht erreichbar, Playwright fehlt) --
     ausdruecklich NICHT 'sauber'

AUFRUF
  pruefungen/probe_kaufblock.py [--basis https://crystal-cacao.com]
  pruefungen/probe_kaufblock.py --rot-arm A   # Selbstpruefung: baut den
                                              # Defekt im Browser nach
"""
from __future__ import annotations

import argparse
import sys

# Analyse-Einlieferungen des EIGENEN Zugriffs stummschalten (Job 20260911,
# Christian: Helsinki nicht in den Besucherzahlen mitzaehlen). Bricht NUR
# Analyse-Beacons ab (Shopify-monorail, Google, Meta) -- der Seitenabruf,
# das DOM und der Kaufweg bleiben unberuehrt, und der Browser-UA bleibt
# echt. SSoT: tracking-linkage/src/internal_client.py
import sys as _sys_ic
if "/srv/openclaw/shared-state/tracking-linkage/src" not in _sys_ic.path:
    _sys_ic.path.insert(0, "/srv/openclaw/shared-state/tracking-linkage/src")
import internal_client as _internal_client  # noqa: E402

PFADE = ['/products/crystal-cacao-create', '/products/crystal-cacao-awake']
BREITEN = [390, 768, 1440]

# --- Schwellen. Jede ist ein Verhaeltnis oder ein Abstand, nie ein Zaehler. ---
STREICH_ANTEIL_MAX = 0.70   # [B] Streichpreis <= 70 % der Preis-Schriftgroesse
ETIKETT_ABSTAND_MIN = 12.0  # [C] px zwischen Etikett und Preiszeile
GRUND_LUECKE_MAX = 12.0     # [D] px senkrecht zwischen Preiszeile und Grundpreis
KLICK_SCHWELLE = 4.0        # [A] px Rollweg, ab dem ein Klick "ankommt"

JS = """
(rotArm) => {
  const px = v => Math.round(v*10)/10;
  const blk = document.querySelector('.product .product-main');
  if (!blk) return {fehlt: 'product-main'};

  // --- Rot-Arme: den Defekt im Browser nachbauen, statt ihn zu behaupten ----
  if (rotArm === 'A') {
    const z = blk.querySelector('.product-rating');
    if (z && z.tagName.toLowerCase() !== 'button') {
      const b = document.createElement('button');
      b.type = 'button'; b.className = z.className;
      b.style.cursor = 'pointer';
      b.innerHTML = z.innerHTML;
      z.replaceWith(b);
    }
  }
  if (rotArm === 'B') {
    const s = blk.querySelector('.CacaoPriceCompare');
    const c = blk.querySelector('.CacaoPriceCurrent');
    // MIT 'important' -- die Regel traegt !important. Eine gewoehnliche
    // Inline-Zuweisung verliert dagegen und die Mutation trifft NICHTS: der
    // Rot-Arm lief dann gruen durch und las sich als "robuste Probe"
    // (gemessen 2026-09-10, Arm B feuerte 0x statt 3x).
    if (s && c) s.style.setProperty('font-size', getComputedStyle(c).fontSize, 'important');
  }
  if (rotArm === 'C') {
    const e = blk.querySelector('.BestsellerLabel');
    const c = blk.querySelector('.CacaoPriceCurrent');
    if (e && c) {
      const r = c.getBoundingClientRect();
      e.style.position = 'fixed';
      e.style.left = r.x + 'px'; e.style.top = r.y + 'px';
    }
  }
  if (rotArm === 'D') {
    const g = blk.querySelector('.CacaoPricePer100g');
    if (g) g.style.marginTop = '120px';
  }
  if (rotArm === 'E') {
    const p = document.createElement('p');
    p.textContent = 'Mehr als 1.000+ aktive Nutzer';
    blk.appendChild(p);
  }
  if (rotArm === 'F') {
    const k = blk.querySelector('button[type="submit"], .cc-knopf');
    if (k) k.style.display = 'none';
  }

  const kasten = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return null;
    return {x: px(r.x), y: px(r.y + window.scrollY),
            b: px(r.width), h: px(r.height),
            fs: px(parseFloat(s.fontSize)), cursor: s.cursor,
            tag: el.tagName.toLowerCase(),
            fokus: el.matches('a[href],button,[tabindex],input,select,textarea')};
  };
  const q = sel => blk.querySelector(sel);

  const out = {
    sternzeile: kasten(q('.product-rating')),
    sterne_grafik_n: blk.querySelectorAll('.star-rating').length,
    sprungziele: document.querySelectorAll(
      '#bewertungen,#reviews,[data-qb-bewertungsbereich],.google-rezensionen').length,
    preis: kasten(q('.CacaoPriceCurrent')),
    streich: kasten(q('.CacaoPriceCompare')),
    etikett: kasten(q('.BestsellerLabel')),
    grund: kasten(q('.CacaoPricePer100g')),
    knopf: kasten(q('button[type="submit"], .cc-knopf')),
  };

  // [E] Blattknoten, nie der Zeichenstrom.
  const treffer = [];
  for (const el of blk.querySelectorAll('*')) {
    if (el.children.length) continue;
    const t = (el.textContent||'').trim();
    if (/\\d[\\d.\\s]*\\+?\\s*(aktive\\s+)?Nutzer/i.test(t)) treffer.push(t.slice(0,60));
  }
  out.nutzerzahl = treffer;

  // [F] Hit-Test: trifft der Knopf sich selbst?
  // ERST INS BILD ROLLEN. elementFromPoint arbeitet in VIEWPORT-Koordinaten;
  // steht der Knopf unterhalb des Fensters (live bei 900 px Fensterhoehe der
  // Regelfall, y ~ 1646), liefert es null oder ein fremdes Element -- und die
  // Probe meldet "Kauf-Knopf ist verdeckt" an einem voellig gesunden Knopf.
  // Gemessen 2026-09-10: 6 von 6 Messpunkten falsch-rot, bevor diese Zeile
  // stand. Eine Probe, die einen Defekt meldet, den es nicht gibt, erzieht
  // zum Wegklicken.
  const k = q('button[type="submit"], .cc-knopf');
  if (k) {
    k.scrollIntoView({block: 'center'});
    const r = k.getBoundingClientRect();
    const oben = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
    out.knopf_trifft_sich = !!(oben && (oben === k || k.contains(oben)));
    window.scrollTo(0, 0);
  }
  return out;
}
"""


def abstand(a, b):
    """Kleinster Abstand zweier Kaesten; negativ = Ueberlappung."""
    if not a or not b:
        return None
    dx = max(a['x'] - (b['x'] + b['b']), b['x'] - (a['x'] + a['b']))
    dy = max(a['y'] - (b['y'] + b['h']), b['y'] - (a['y'] + a['h']))
    if dx < 0 and dy < 0:
        return round(max(dx, dy), 1)       # ueberlappt in beiden Achsen
    return round(max(dx, dy, 0.0), 1)


def pruefe(page, url, breite, rot_arm):
    page.set_viewport_size({'width': breite, 'height': 900})
    page.goto(url, wait_until='networkidle', timeout=45000)
    page.wait_for_timeout(700)
    d = page.evaluate(JS, rot_arm)
    if d.get('fehlt'):
        return None, [f'MESSAUSFALL: {d["fehlt"]} nicht gefunden ({url} @{breite})']

    befunde = []
    ort = f'{url.split("/products/")[-1]} @{breite}px'

    # ---- [A] tote Flaeche -------------------------------------------------
    z = d['sternzeile']
    if z is None:
        befunde.append(f'[A] {ort}: Sternzeile fehlt ganz (sterne_grafik={d["sterne_grafik_n"]})')
    else:
        bietet_sich_an = z['tag'] in ('a', 'button') or z['fokus'] or z['cursor'] == 'pointer'
        if bietet_sich_an:
            el = page.query_selector('.product .product-main .product-rating')
            el.scroll_into_view_if_needed(timeout=3000)
            page.wait_for_timeout(350)
            v = page.evaluate('() => ({y: window.scrollY, h: location.hash})')
            try:
                el.click(timeout=3000)
                page.wait_for_timeout(900)
            except Exception:                                   # noqa: BLE001
                pass
            n = page.evaluate('() => ({y: window.scrollY, h: location.hash})')
            kam_an = abs(n['y'] - v['y']) > KLICK_SCHWELLE or v['h'] != n['h']
            if not kam_an:
                befunde.append(
                    f'[A] {ort}: Sternzeile bietet sich als Handlung an '
                    f'(<{z["tag"]}> cursor={z["cursor"]} fokussierbar={z["fokus"]}), '
                    f'kommt aber nirgendwo an (Rollweg {abs(n["y"]-v["y"])} px, '
                    f'Hash {v["h"]!r}->{n["h"]!r}, Sprungziele auf der Seite '
                    f'{d["sprungziele"]})')

    # ---- [B] Streichpreis --------------------------------------------------
    if d['preis'] and d['streich']:
        anteil = d['streich']['fs'] / d['preis']['fs']
        if anteil > STREICH_ANTEIL_MAX:
            befunde.append(
                f'[B] {ort}: Streichpreis {d["streich"]["fs"]} px ist '
                f'{anteil*100:.0f} % des Preises ({d["preis"]["fs"]} px) — '
                f'erlaubt sind {STREICH_ANTEIL_MAX*100:.0f} %')
    elif d['preis'] is None:
        befunde.append(f'MESSAUSFALL: kein Preis gefunden ({ort})')

    # ---- [C] Etikett -------------------------------------------------------
    if d['etikett']:
        for name, kasten in (('Preis', d['preis']), ('Streichpreis', d['streich'])):
            a = abstand(d['etikett'], kasten)
            if a is not None and a < ETIKETT_ABSTAND_MIN:
                befunde.append(
                    f'[C] {ort}: Etikett steht {a} px vom {name} '
                    f'(Mindestabstand {ETIKETT_ABSTAND_MIN} px)'
                    + (' — UEBERLAPPUNG' if a < 0 else ''))

    # ---- [D] Grundpreis ----------------------------------------------------
    if d['grund'] and d['preis']:
        luecke = round(d['grund']['y'] - (d['preis']['y'] + d['preis']['h']), 1)
        if luecke > GRUND_LUECKE_MAX:
            befunde.append(
                f'[D] {ort}: Grundpreis steht {luecke} px unter der Preiszeile '
                f'(erlaubt {GRUND_LUECKE_MAX} px)')

    # ---- [E] Dopplung ------------------------------------------------------
    if len(d['nutzerzahl']) != 1:
        befunde.append(
            f'[E] {ort}: Nutzerzahl {len(d["nutzerzahl"])}x im Kaufblock '
            f'(erwartet genau 1): {d["nutzerzahl"]}')

    # ---- [F] Kaufweg -------------------------------------------------------
    if not d['knopf']:
        befunde.append(f'[F] {ort}: Kauf-Knopf fehlt oder ist unsichtbar')
    elif not d.get('knopf_trifft_sich'):
        befunde.append(f'[F] {ort}: Kauf-Knopf ist verdeckt (Hit-Test trifft ein anderes Element)')
    return d, befunde


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--basis', default='https://crystal-cacao.com')
    ap.add_argument('--rot-arm', default=None, choices=list('ABCDEF'),
                    help='Selbstpruefung: baut den Defekt dieses Arms im Browser nach')
    ap.add_argument('--nur-pfad', default=None)
    a = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('MESSAUSFALL: playwright fehlt', file=sys.stderr)
        return 4

    pfade = [a.nur_pfad] if a.nur_pfad else PFADE
    alle, ausfall = [], []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        page = b.new_context(locale='de-DE').new_page()
        _internal_client.stumm_schalten(page)
        for pfad in pfade:
            for breite in BREITEN:
                try:
                    _, bef = pruefe(page, a.basis.rstrip('/') + pfad, breite, a.rot_arm)
                except Exception as exc:                        # noqa: BLE001
                    ausfall.append(f'MESSAUSFALL {pfad}@{breite}: {exc}')
                    continue
                for x in bef:
                    (ausfall if x.startswith('MESSAUSFALL') else alle).append(x)
        b.close()

    if ausfall:
        for x in ausfall:
            print(x, file=sys.stderr)
        print(f'MESSAUSFALL: {len(ausfall)} Messung(en) ohne Aussage — NICHT als sauber lesen',
              file=sys.stderr)
        return 4
    if alle:
        for x in alle:
            print(x)
        print(f'BEFUND: {len(alle)} Abweichung(en) ueber '
              f'{len(pfade)} Seite(n) x {len(BREITEN)} Breiten')
        return 1
    print(f'[OK] Kaufblock gruen: {len(pfade)} Seite(n) x {len(BREITEN)} Breiten, '
          f'sechs Arme (A tote Flaeche, B Streichpreis, C Etikett, D Grundpreis, '
          f'E Dopplung, F Kaufweg)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
