#!/usr/bin/env python3
"""PROBE — die Design-Zusagen des Segments s06, fail-closed.

Gebaut 2026-09-03, Job
20260902-GROSSJOB-crystal-cacao-live-bringen-und-design-angleichen-prio6-s06.

WAS SIE ZUSICHERT, in drei Armen. Jeder Arm misst eine ANDERE Achse; ein Arm
allein wuerde die anderen zwei nicht bemerken.

  ARM A  QUELLTEXT-INVARIANTEN. Die sechs Bauentscheidungen, die den Score von
         89/94 auf 96/98 gehoben haben, stehen noch da. Statisch, immer
         ausfuehrbar, faengt eine Ruecknahme im Code.

  ARM B  DIE BELEGE GEHOEREN UNS. Genau die Falle, die dieses Segment gekostet
         hat: exports/design-reviews/audits/<slug>/design-review.json ist ein
         GETEILTER Namensraum. Der taegliche Design-Watch fuehrt die Slugs
         `crystal-cacao` und `cc-crystal-cacao-*` fuer die FREMDEN Shops
         (qiblanco.com, qi-blanco.com) und hat den s04-Beleg dort binnen 18
         Stunden ueberschrieben — score 94 wurde zu score 77 einer anderen
         Domain. Dieser Arm prueft deshalb NICHT nur den Score, sondern auch,
         dass das gemessene `target` ueberhaupt unsere Storefront war. Ein
         Beleg mit fremdem target ist hier ein BEFUND, kein Erfolg.

  ARM C  LIVE-WIRKUNG. Schrift, Ueberlauf und Trefferflaechen am gerenderten
         DOM bei 360 und 390 px. Braucht den dev-Server; laeuft er nicht, ist
         das MESSAUSFALL (exit 4) und ausdruecklich NICHT gruen — sonst faellt
         "konnte nicht messen" mit "gemessen und sauber" auf denselben Exit.

EXIT  0 = alle ausgefuehrten Arme gruen · 1 = Befund · 4 = Messausfall

WAS SIE BEWUSST NICHT ZUSICHERT: den Warenkorb-Score. Er ist strukturell
unbewertbar (body{min-height:100vh} macht jede kurze Seite exakt viewporthoch,
die Plausibilitaets-Sperre der Rubrik kann "kurz" nicht von "tot" trennen —
FEHLER-DB F-2168). Ihn hier zu fordern hiesse, eine Zusage zu geben, die das
Messgeraet nicht einloesen kann.
"""
import json
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDITS = ('/srv/openclaw/shared-state/homepage-bauer/exports/'
          'design-reviews/audits')
BASIS = 'http://localhost:3399'
PW = '/srv/openclaw/shared-state/playwright-env/bin/pw-python'

# Slug -> Pfad. Der Warenkorb fehlt mit Absicht (siehe Kopf).
SEITEN = {
    'ccs-uebersicht': '/pages/crystal-cacao',
    'ccs-awake': '/products/crystal-cacao-awake',
    'ccs-create': '/products/crystal-cacao-create',
    'ccs-startseite': '/',
    'ccs-widerruf': '/policies/refund-policy',
    'ccs-suche': '/search?q=kakao',
    'ccs-kollektion': '/collections/zeremonie-kakao',
}
SCHWELLE = 80

befunde = []
ausfaelle = []


def lies(pfad):
    with open(os.path.join(REPO, pfad), encoding='utf-8') as fh:
        return fh.read()


# --------------------------------------------------------------- ARM A
def arm_a():
    print('--- ARM A  Quelltext-Invarianten')
    proben = [
        ('reset.css: body traegt die Schriftfamilie der Vorlage',
         'app/styles/reset.css',
         r"body\s*\{[^}]*font-family:\s*'Open Sans Variable',\s*sans-serif"),
        ('root.jsx: der CSS-Vertrag der Swipe-Tabelle ist eingebunden',
         'app/root.jsx', r"qb-swipetab\.css\?url"),
        ('kakao-seiten.css: die Zeilenlaenge ist begrenzt',
         'app/styles/kakao-seiten.css', r"max-width:\s*var\(--cc-zeile-max\)"),
        ('kakao-seiten.css: der Banner-Schleier steht',
         'app/styles/kakao-seiten.css',
         r"div:has\(>\s*img\s*\+\s*h2\)::after"),
        ('app.css: die Kopfzeilen-Schalter tragen die Mindest-Trefferflaeche',
         'app/styles/app.css', r"min-height:\s*var\(--cc-treffer-min"),
    ]
    for name, datei, muster in proben:
        try:
            treffer = re.search(muster, lies(datei), re.S)
        except OSError as exc:
            ausfaelle.append(f'{datei} nicht lesbar: {exc}')
            print(f'  [??] {name}')
            continue
        print(f'  [{"OK" if treffer else "!!"}] {name}')
        if not treffer:
            befunde.append(f'Quelltext: {name} — Muster fehlt in {datei}')

    # Die Swipetab-Datei existiert UND ist nicht leer.
    pfad = os.path.join(REPO, 'app/styles/qb-swipetab.css')
    gross = os.path.exists(pfad) and os.path.getsize(pfad) > 1000
    print(f'  [{"OK" if gross else "!!"}] app/styles/qb-swipetab.css liegt vor')
    if not gross:
        befunde.append('app/styles/qb-swipetab.css fehlt oder ist leer')

    # Kein <p>, das ein <p>-Fragment traegt.
    for datei in ('app/components/product-pages/Awake.jsx',
                  'app/components/product-pages/Create.jsx'):
        try:
            kaputt = re.search(r'<p className="[^"]*leading-relaxed[^"]*">\s*\{row\.text\}',
                               lies(datei))
        except OSError as exc:
            ausfaelle.append(f'{datei} nicht lesbar: {exc}')
            continue
        print(f'  [{"!!" if kaputt else "OK"}] {datei}: kein <p> um das <p>-Fragment')
        if kaputt:
            befunde.append(f'{datei}: row.text steht wieder in einem <p> '
                           '— die Hydration bricht damit ab')


# --------------------------------------------------------------- ARM B
def arm_b():
    print('--- ARM B  Belege gehoeren dieser Storefront')
    for slug in sorted(SEITEN):
        pfad = os.path.join(AUDITS, slug, 'design-review.json')
        if not os.path.exists(pfad):
            befunde.append(f'{slug}: kein Beleg unter {pfad}')
            print(f'  [!!] {slug}: Beleg fehlt')
            continue
        try:
            with open(pfad, encoding='utf-8') as fh:
                beleg = json.load(fh)
        except (OSError, ValueError) as exc:
            ausfaelle.append(f'{slug}: Beleg unlesbar ({exc})')
            print(f'  [??] {slug}: Beleg unlesbar')
            continue
        score = beleg.get('score')
        target = beleg.get('target') or ''
        # DIE EIGENTLICHE ZUSAGE DIESES ARMS: der Beleg misst UNS.
        fremd = not target.startswith(BASIS)
        schlecht = not isinstance(score, (int, float)) or score < SCHWELLE
        if fremd:
            befunde.append(
                f'{slug}: der Beleg wurde an {target} gemessen, nicht an '
                f'{BASIS} — der Namensraum wurde von einem fremden Lauf '
                'ueberschrieben')
        if schlecht:
            befunde.append(f'{slug}: score {score} unter Schwelle {SCHWELLE}')
        marke = 'OK' if not (fremd or schlecht) else '!!'
        print(f'  [{marke}] {slug:16} score={score} target={target}')


# --------------------------------------------------------------- ARM C
JS = r"""(vw)=>{
  const fam={};
  document.querySelectorAll('p,li,h1,h2,h3,h4,span,a,div,button').forEach(e=>{
    if(!e.innerText||!e.innerText.trim())return;
    const f=getComputedStyle(e).fontFamily.split(',')[0].replace(/['"]/g,'').trim();
    fam[f]=(fam[f]||0)+1;});
  const klein=[...document.querySelectorAll('*')].filter(e=>{
    const t=(e.innerText||'').trim(); if(!t||t.length<3)return false;
    const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>2);
    return own && parseFloat(getComputedStyle(e).fontSize)<12;}).length;
  const ziele=[...document.querySelectorAll('.header-ctas button,.header-ctas a')]
    .filter(e=>{const r=e.getBoundingClientRect();
      return r.width>0 && (r.width<44||r.height<44);}).length;
  return {bodyFam:getComputedStyle(document.body).fontFamily,
    fam:Object.entries(fam).sort((a,b)=>b[1]-a[1])[0],
    scrollW:document.documentElement.scrollWidth, vw, klein, ziele};
}"""

TREIBER = r'''
import json, sys
from playwright.sync_api import sync_playwright
basis, js = sys.argv[1], sys.argv[2]
pfade = json.loads(sys.argv[3])
erg = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for pf in pfade:
        for vw in (360, 390):
            pg = b.new_page(viewport={"width": vw, "height": 800}, is_mobile=True)
            try:
                pg.goto(basis + pf, wait_until="networkidle", timeout=45000)
                pg.wait_for_timeout(1200)
                r = pg.evaluate(js, vw); r["pfad"] = pf
                erg.append(r)
            except Exception as exc:
                erg.append({"pfad": pf, "vw": vw, "fehler": f"{type(exc).__name__}: {exc}"[:120]})
            pg.close()
    b.close()
print(json.dumps(erg))
'''


def arm_c():
    print(f'--- ARM C  Live-Wirkung am gerenderten DOM ({BASIS})')
    if not os.path.exists(PW):
        ausfaelle.append(f'MESSAUSFALL: {PW} fehlt')
        print('  [??] kein playwright-env')
        return
    lauf = subprocess.run([PW, '-c', TREIBER, BASIS, JS,
                           json.dumps(sorted(SEITEN.values()))],
                          capture_output=True, text=True, timeout=900)
    if lauf.returncode != 0 or not lauf.stdout.strip():
        ausfaelle.append('MESSAUSFALL: der Render-Lauf lieferte nichts '
                         f'(rc={lauf.returncode}) — laeuft der dev-Server auf '
                         f'{BASIS}? {lauf.stderr.strip()[-160:]}')
        print('  [??] Render-Lauf ohne Ergebnis')
        return
    try:
        daten = json.loads(lauf.stdout.strip().splitlines()[-1])
    except ValueError as exc:
        ausfaelle.append(f'MESSAUSFALL: Ergebnis nicht lesbar ({exc})')
        print('  [??] Ergebnis nicht lesbar')
        return
    for r in daten:
        if r.get('fehler'):
            ausfaelle.append(f"MESSAUSFALL {r['pfad']}@{r['vw']}: {r['fehler']}")
            print(f"  [??] {r['pfad']}@{r['vw']}: {r['fehler']}")
            continue
        pf, vw = r['pfad'], r['vw']
        schrift_ok = 'Open Sans Variable' in (r.get('bodyFam') or '')
        haupt = (r.get('fam') or ['?', 0])[0]
        ueberlauf = r['scrollW'] > vw
        if not schrift_ok or haupt != 'Open Sans Variable':
            befunde.append(f'{pf}@{vw}: Schrift ist "{haupt}", erwartet '
                           '"Open Sans Variable" wie in der Vorlage')
        if ueberlauf:
            befunde.append(f'{pf}@{vw}: horizontaler Ueberlauf, '
                           f"scrollWidth {r['scrollW']} > {vw}")
        if r['klein']:
            befunde.append(f"{pf}@{vw}: {r['klein']} Textelement(e) unter 12px")
        if r['ziele']:
            befunde.append(f"{pf}@{vw}: {r['ziele']} Kopfzeilen-Ziel(e) unter 44px")
        marke = 'OK' if not (befunde and befunde[-1].startswith(f'{pf}@{vw}')) else '!!'
        print(f"  [{marke}] {pf:34}@{vw} schrift={haupt} "
              f"scrollW={r['scrollW']} klein={r['klein']} ziele={r['ziele']}")


def main():
    print('PROBE DESIGN s06 — Crystal Cacao')
    print(f'REPO  {REPO}')
    arm_a()
    arm_b()
    arm_c()
    print()
    if ausfaelle:
        print('MESSAUSFALL — nicht gruen, nicht rot:')
        for a in ausfaelle:
            print('  ?', a)
        # Ein Befund neben einem Ausfall bleibt ein Befund.
        if befunde:
            for b in befunde:
                print('  !', b)
            return 1
        return 4
    if befunde:
        print(f'BEFUNDE ({len(befunde)}):')
        for b in befunde:
            print('  !', b)
        return 1
    print('OK: Quelltext-Invarianten stehen, alle Belege gehoeren dieser '
          'Storefront und liegen ueber der Schwelle, und am gerenderten DOM '
          'stimmen Schrift, Breite, Lesbarkeitsboden und Trefferflaechen '
          'bei 360 und 390 px.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
