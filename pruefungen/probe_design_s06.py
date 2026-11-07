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

MESSORT (umgehaengt 2026-11-07, Job
repairkorb-20261107-14-messblind-pruefungen-probe-design). Bis dahin mass die
Probe den dev-Server http://localhost:3399 der Werkbank. Den gab es nur
waehrend der Bau-Segmente; seit dem DNS-Klick am 2026-09-08 liefert der Dienst
crystal-cacao-node den Laden aus crystal-cacao-node/repo aus, die Werkbank ist
nur noch der Vorratsweg. Arm C lief deshalb seit Oktober in jedem Lauf auf
MESSAUSFALL (messkette blind), und Arm A las den Vorratsweg statt der
ausgelieferten Quelle. Jetzt:
  ARM A liest die Quelle des Kundenrands (Shop-Landkarte storefront-messung,
        Feld repo), nicht das Verzeichnis dieser Datei.
  ARM B nimmt je Flaeche den JUENGSTEN Beleg aus ccs-<slug> und dem Slug, unter
        dem der taegliche Design-Watch genau diese Rand-URL fuehrt
        (config/design_gate_seiten.yaml). Ein Beleg eines fremden Shops bleibt
        ein Befund, egal unter welchem Namen er liegt.
  ARM C misst den Rand selbst, mit dem internen Marker-UA und dem
        Identitaetstor von storefront-messung: zeigt die Antwort einen anderen
        Laden, ist das MESSAUSFALL, nie ein Urteil.
Wer waehrend eines Baus die Vorschau messen will: CC_PROBE_BASIS=<dev-URL>
CC_PROBE_QUELLE=<Werkbank>. Fuer Fixturen: CC_PROBE_AUDITS, CC_PROBE_SEITEN_CONF.

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
from urllib.parse import urlsplit

SS = '/srv/openclaw/shared-state'
SM_SRC = os.path.join(SS, 'storefront-messung/src')
try:
    sys.path.insert(0, SM_SRC)
    import storefront_messung as sm
    SM_FEHLER = ''
except Exception as exc:                                  # noqa: BLE001
    sm, SM_FEHLER = None, repr(exc)

SHOP = 'crystal'
# Die Vorschau dieser Storefront waehrend eines Baus. Ein Beleg mit diesem
# target misst UNS (aelterer Stand), keinen fremden Shop.
VORSCHAU = 'http://localhost:3399'
RAND = sm.url(SHOP, '/').rstrip('/') if sm else ''
BASIS = (os.environ.get('CC_PROBE_BASIS') or RAND).rstrip('/')
REPO = os.environ.get('CC_PROBE_QUELLE') or (
    os.path.join(SS, sm.shop(SHOP).repo) if sm else '')
AUDITS = os.environ.get('CC_PROBE_AUDITS') or os.path.join(
    SS, 'homepage-bauer/exports/design-reviews/audits')
SEITEN_CONF = os.environ.get('CC_PROBE_SEITEN_CONF') or os.path.join(
    SS, 'homepage-bauer/config/design_gate_seiten.yaml')
PW = os.path.join(SS, 'playwright-env/bin/pw-python')

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
def _deploy_achse():
    """(urteil_fn|None, deploys, bestimmt, meldung) — einmal je Lauf.

    URSACHEN-ACHSE (2026-09-10, Job 20260910-belegleser-ohne-ursachenachse-
    sieben-leser-und-gate9-prio25): ein Beleg, der vor dem letzten Deploy seiner
    Seite entstand, ist ueber die HEUTIGE Seite kein Urteil. Fail-open in jedem
    Zweig — ist die Lage unbestimmt, verhaelt sich diese Probe wie vorher.
    """
    try:
        sys.path.insert(0, '/srv/openclaw/shared-state/homepage-bauer/src')
        import design_deploy_signal as dds
        deploys, meldungen, bestimmt = dds.lage()
        return dds, deploys, bestimmt, (meldungen[0] if meldungen else '')
    except Exception as exc:                              # noqa: BLE001
        return None, {}, False, f'deploy-achse nicht ladbar: {exc!r}'


def _unsere_ziele():
    """Die targets, die DIESE Storefront messen: Rand (mit und ohne www) und
    die Bau-Vorschau. Alles andere ist ein fremder Laden."""
    ziele = [VORSCHAU, BASIS]
    if sm:
        dom = sm.shop(SHOP).domain
        ziele += [f'https://{dom}', f'https://www.{dom}']
    return tuple(dict.fromkeys(z for z in ziele if z))


def _ist_unser(target, ziele):
    # Mit Trenner verglichen: 'https://crystal-cacao.com.example' ist fremd.
    return any(target == z or target.startswith((z + '/', z + '?'))
               for z in ziele)


def _watch_slugs():
    """(Rand-URL -> Watch-Slug | None, meldung). Ein Lesefehler ist KEIN
    leeres Verzeichnis: der Aufrufer bucht ihn als Messausfall."""
    try:
        import yaml
        with open(SEITEN_CONF, encoding='utf-8') as fh:
            daten = yaml.safe_load(fh) or {}
    except Exception as exc:                              # noqa: BLE001
        return None, f'{SEITEN_CONF} nicht lesbar: {exc!r}'
    karte = {}
    for e in daten.get('seiten') or []:
        if isinstance(e, dict) and e.get('seite') and e.get('url'):
            karte.setdefault(str(e['url']), str(e['seite']))
    return karte, ''


def arm_b():
    print('--- ARM B  Belege gehoeren dieser Storefront')
    dds, deploys, bestimmt, achse_meldung = _deploy_achse()
    if not bestimmt:
        print(f'  deploy-achse: KEINE AUSSAGE ({achse_meldung}) — fail-open')
    ziele = _unsere_ziele()
    karte, karte_fehler = _watch_slugs()
    if karte is None:
        ausfaelle.append(f'Watch-Liste: {karte_fehler}')
        karte = {}
    ungedeckt, beurteilt, nur_vorschau = 0, 0, []
    for slug in sorted(SEITEN):
        kandidaten = [slug]
        watch = karte.get(sm.url(SHOP, SEITEN[slug])) if sm else None
        if watch and watch not in kandidaten:
            kandidaten.append(watch)
        belege, andere = [], 0   # andere = fremd oder unlesbar, schon gebucht
        for name in kandidaten:
            pfad = os.path.join(AUDITS, name, 'design-review.json')
            if not os.path.exists(pfad):
                continue
            try:
                with open(pfad, encoding='utf-8') as fh:
                    beleg = json.load(fh)
            except (OSError, ValueError) as exc:
                ausfaelle.append(f'{name}: Beleg unlesbar ({exc})')
                print(f'  [??] {name}: Beleg unlesbar')
                andere += 1
                continue
            target = beleg.get('target') or ''
            # DIE EIGENTLICHE ZUSAGE DIESES ARMS: jeder Beleg misst UNS.
            if not _ist_unser(target, ziele):
                befunde.append(
                    f'{name}: der Beleg wurde an {target} gemessen, nicht an '
                    f'dieser Storefront ({", ".join(ziele)}) — der Namensraum '
                    'wurde von einem fremden Lauf ueberschrieben')
                print(f'  [!!] {name:24} FREMD target={target}')
                andere += 1
                continue
            belege.append((str(beleg.get('zeit') or ''), name, beleg))
        if not belege:
            if not andere:
                befunde.append(f'{slug}: kein Beleg unter {AUDITS}/'
                               f'{{{",".join(kandidaten)}}}')
                print(f'  [!!] {slug}: Beleg fehlt')
            continue
        # Geurteilt wird ueber den JUENGSTEN eigenen Beleg der Flaeche.
        zeit, name, beleg = max(belege, key=lambda t: t[0])
        score = beleg.get('score')
        target = beleg.get('target') or ''
        schlecht = not isinstance(score, (int, float)) or score < SCHWELLE
        if target.startswith(VORSCHAU):
            nur_vorschau.append(slug)
        # Ursachen-Achse VOR dem Schwellen-Urteil: ein Beleg, der die zu
        # beurteilende Aenderung nicht kennt, ist weder Befund noch Freispruch
        # und faellt auf den vorhandenen Messausfall-Kanal (ausfaelle -> 4).
        veraltet = None
        if bestimmt and dds is not None:
            try:
                veraltet, grund = dds.urteil(deploys, name, beleg.get('zeit'))
            except Exception as exc:                      # noqa: BLE001
                veraltet, grund = None, f'achse-fehler: {exc!r}'
            if veraltet is True:
                ausfaelle.append(f'{name}: {grund} — keine Aussage ueber die '
                                 'HEUTIGE Seite')
            elif veraltet is False and 'kein Deploy' in str(grund):
                ungedeckt += 1
            elif veraltet is False:
                beurteilt += 1
        if schlecht:
            befunde.append(f'{name}: score {score} unter Schwelle {SCHWELLE}')
        marke = 'OK' if not (schlecht or veraltet is True) else '!!'
        print(f'  [{marke}] {slug:16} beleg={name} zeit={zeit or "?"} '
              f'score={score} target={target}')
    # DECKUNGS-RESTBERICHT, gezaehlt und benannt (Hausmuster
    # design_beleg.ausnahmen_bericht): das Deploy-Signal liest EINEN Ledger und
    # EIN Repo (werkbank/qiblanco-storefront). Der Kakao-Laden kommt aus einem
    # EIGENEN Repo, dessen Auslieferungen in keinem Ledger stehen — die Achse
    # kann hier baulich nichts beurteilen. Das ist fail-open richtig und
    # trotzdem KEINE Deckung.
    if bestimmt:
        print(f'  deploy-achse: {beurteilt} von {beurteilt + ungedeckt} Seite(n) '
              f'beurteilbar, {ungedeckt} ohne auffindbaren Deploy im Fenster')
        if ungedeckt and not beurteilt:
            print('  DECKUNGSGRENZE: keine dieser Seiten ist fuer die Achse '
                  'beurteilbar — eigenes Repo (crystal-cacao-node), kein '
                  'Ledger; die Achse laeuft mit, urteilt aber ueber nichts.')
    # Zweite Grenze, ebenso gezaehlt: eine Flaeche, die der Design-Watch nicht
    # fuehrt, hat nur den Vorschau-Beleg aus dem Bau. Er misst uns, aber einen
    # aelteren Stand als den Rand.
    if nur_vorschau:
        print(f'  DECKUNGSGRENZE: {len(nur_vorschau)} von {len(SEITEN)} '
              f'Flaeche(n) nur mit Vorschau-Beleg ({VORSCHAU}), kein Rand-Beleg '
              f'im Design-Watch: {", ".join(nur_vorschau)}')


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
  const kopf=[...document.querySelectorAll('.header-ctas button,.header-ctas a')];
  const ziele=kopf
    .filter(e=>{const r=e.getBoundingClientRect();
      return r.width>0 && (r.width<44||r.height<44);}).length;
  return {bodyFam:getComputedStyle(document.body).fontFamily,
    fam:Object.entries(fam).sort((a,b)=>b[1]-a[1])[0],
    scrollW:document.documentElement.scrollWidth, vw, klein, ziele,
    kopfN:kopf.length};
}"""

TREIBER = r'''
import json, sys
from playwright.sync_api import sync_playwright
basis, js = sys.argv[1], sys.argv[2]
pfade = json.loads(sys.argv[3])
sm_src, shop, am_rand = sys.argv[4], sys.argv[5], sys.argv[6] == "1"
sm = None
if am_rand:
    # Am Rand: interner Marker-UA (zaehlt in keiner Analytik) und das
    # Identitaetstor - ein fremder Laden wird Messausfall, nie ein Urteil.
    sys.path.insert(0, sm_src)
    import storefront_messung as sm
erg = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for pf in pfade:
        for vw in (360, 390):
            vp = {"width": vw, "height": 800}
            if sm:
                ctx = sm.kontext(b, shop, zweck="probe_design_s06",
                                 viewport=vp, is_mobile=True)
            else:
                ctx = b.new_context(viewport=vp, is_mobile=True)
            pg = ctx.new_page()
            try:
                pg.goto(basis + pf, wait_until="networkidle", timeout=45000)
                pg.wait_for_timeout(1200)
                if sm:
                    sm.identitaet_pruefen_page(pg, shop)
                r = pg.evaluate(js, vw); r["pfad"] = pf; r["end"] = pg.url
                erg.append(r)
            except Exception as exc:
                erg.append({"pfad": pf, "vw": vw, "fehler": f"{type(exc).__name__}: {exc}"[:160]})
            ctx.close()
    b.close()
print(json.dumps(erg))
'''


def arm_c():
    print(f'--- ARM C  Live-Wirkung am gerenderten DOM ({BASIS})')
    if not os.path.exists(PW):
        ausfaelle.append(f'MESSAUSFALL: {PW} fehlt')
        print('  [??] kein playwright-env')
        return
    am_rand = '1' if (RAND and BASIS == RAND) else '0'
    lauf = subprocess.run([PW, '-c', TREIBER, BASIS, JS,
                           json.dumps(sorted(SEITEN.values())),
                           SM_SRC, SHOP, am_rand],
                          capture_output=True, text=True, timeout=900)
    if lauf.returncode != 0 or not lauf.stdout.strip():
        ausfaelle.append('MESSAUSFALL: der Render-Lauf lieferte nichts '
                         f'(rc={lauf.returncode}) an {BASIS}: '
                         f'{lauf.stderr.strip()[-200:]}')
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
        # Positiv-Kontrolle der Trefferflaechen-Achse: trifft der Selektor
        # keinen Kopfzeilen-Schalter, ist "0 zu klein" keine Messung.
        if not r.get('kopfN'):
            ausfaelle.append(f'MESSAUSFALL {pf}@{vw}: .header-ctas trifft keinen '
                             'Schalter — die Trefferflaechen-Achse ist blind')
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
        # Eine Umleitung ist kein Befund (der Kunde sieht die Zielseite, und die
        # wird gemessen), aber sie gehoert sichtbar: die Flaeche ist dann keine
        # eigene mehr.
        end = r.get('end') or ''
        # Nur der Pfad zaehlt: ?Art=420g setzt die Seite selbst (Variante).
        umleitung = ('' if urlsplit(end).path.rstrip('/') ==
                     urlsplit(BASIS + pf).path.rstrip('/') else f' -> {end}')
        print(f"  [{marke}] {pf:34}@{vw} schrift={haupt} "
              f"scrollW={r['scrollW']} klein={r['klein']} ziele={r['ziele']}{umleitung}")


def main():
    print('PROBE DESIGN s06 — Crystal Cacao')
    if sm is None:
        print('MESSAUSFALL — nicht gruen, nicht rot:')
        print(f'  ? storefront-messung nicht ladbar ({SM_FEHLER}) — ohne Shop-'
              'Landkarte kennt die Probe weder Rand noch Quelle')
        return 4
    print(f'QUELLE  {REPO}')
    print(f'BASIS   {BASIS}' + ('  (Kundenrand)' if BASIS == RAND else
                                '  (NICHT der Kundenrand, per CC_PROBE_BASIS)'))
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
