#!/usr/bin/env python3
"""
NAEHE-PROBE: bleiben die drei Kakao-Seiten dieser Storefront nah an der
Vorlage qiblanco.com?

WOZU ES DIESE PROBE GIBT — und warum sie KEINE zweite Drift-Wache ist (P10):

  Die bestehende Wache `bauten-wache` / check `crystal-cacao-drift` misst die
  sha256 der geteilten DATEIEN gegen shared/UPSTREAM.json. Sie beantwortet die
  Frage "ist der Quelltext synchron". Sie kann baulich NICHT beantworten, ob
  der Kunde dasselbe SIEHT. Der Check sagt das ueber sich selbst, mit einem
  Belegfall: app/components/reusables/StarRating.jsx war nach dem Nachzug
  formal SYNCHRON und zeigte dem Kunden trotzdem ungefaerbte Sterne, weil die
  Farbe aus globalem CSS kommt und globales CSS per Konstruktion nie in einer
  Import-Huelle auftaucht.

  Diese Probe misst die andere Achse: das GERENDERTE Ergebnis. Sie ist damit
  die Ergaenzung, nicht die Dopplung — und sie faengt genau die drei Klassen,
  fuer die die Datei-Wache blind ist:
    (a) globales CSS / Token, die nur eine Seite hat,
    (b) Inhalt, der aus dem Shopify-Datensatz kommt statt aus dem Repo
        (Produktbeschreibung, Bilder, Preise),
    (c) Chrome-Bausteine ausserhalb der Huelle (Kopfzeile, Balken).

DIE MESSREGEL, die ohne sie einen Befund erzeugt, den es nicht gibt:

  DER MARKT WIRD HART GEPINNT. Der lokale Entwicklungsserver setzt
  `oxygen-buyer-country: US` als festen Vorgabewert
  (node_modules/@shopify/mini-oxygen/dist/common/headers.js). Ohne Pin
  rendert er Dollar, waehrend die Vorlage Euro rendert — ein Diff, der wie
  eine Abweichung aussieht und in Wahrheit zwei verschiedene MAERKTE
  vergleicht. Beide Seiten bekommen deshalb denselben Header.

EXIT-CODES
  0  nah        alle Achsen gleich (nach den benannten Ausnahmen)
  1  abweichung mindestens eine Achse laeuft auseinander
  4  messausfall eine Seite war nicht erreichbar / lieferte kein <main>
                 -> KEINE AUSSAGE, ausdruecklich nicht "sauber"

KEIN GEPINNTER ZAEHLER. Die Probe vergleicht immer gegen die LIVE-Vorlage.
Waechst die Vorlage um einen Abschnitt, waechst der Sollwert mit; es gibt
keine Zahl in dieser Datei, die beim naechsten Ausbau der Seite falsch wird.
"""
from __future__ import annotations

import argparse
import difflib
import html as htmllib
import json
import os
import re
import sys
import urllib.error
import urllib.request

SEITEN = [
    '/pages/crystal-cacao',
    '/products/crystal-cacao-awake',
    '/products/crystal-cacao-create',
]

VORLAGE_BASIS = 'https://qiblanco.com'
CRYSTAL_BASIS_VORGABE = 'http://localhost:3399'

# Der Pin. Siehe Kopf: ohne ihn misst man zwei Maerkte und nennt es Drift.
MARKT_HEADER = {'oxygen-buyer-country': 'DE'}


# ---------------------------------------------------------------------------
# DIE BENANNTEN ABWEICHUNGEN — die Begruendungs-Liste des Auftrags.
#
# Jede Zeile hier ist eine Stelle, an der crystal BEWUSST von der Vorlage
# abweicht. Wer eine Zeile hinzufuegt, ohne einen Grund zu schreiben, hebelt
# die Probe aus; deshalb ist `grund` Pflichtfeld und wird mit ausgegeben.
#
# `richtung`:
#   'nur_vorlage' = die Zeile steht in der Vorlage und fehlt hier (Tilgung)
#   'nur_crystal' = die Zeile steht hier und fehlt in der Vorlage (Ersatz)
# ---------------------------------------------------------------------------
ABWEICHUNGEN = [
    {
        'id': 'fremd-kakao-qihome-absatz',
        'achse': 'text',
        'richtung': 'nur_vorlage',
        'muster': r'QiHome® Air-Technologie verarbeitet',
        'grund': 'Fremdinhalts-Tilgung s02: die Uebersicht bewarb woertlich die '
                 'QiHome(R) Air-Technologie. Werbung fuer ein fremdes Sortiment '
                 'auf einem Kakao-Shop.',
    },
    {
        'id': 'fremd-kakao-tools-verweis',
        'achse': 'text',
        'richtung': 'nur_vorlage',
        'muster': r'Erfahre mehr über unsere unterstützenden Tools',
        'grund': 'Fremdinhalts-Tilgung s02: Cross-Sell auf QiOne(R) und '
                 'QiBracelet(R) mitten in der Kakao-Uebersicht.',
    },
    {
        'id': 'ersatz-kakao-prozessaussage',
        'achse': 'text',
        'richtung': 'nur_crystal',
        'muster': r'Nach dem Vermahlen bekommt unser Kakao Zeit statt Tempo',
        'grund': 'Ersatz fuer den getilgten Fremdabsatz (s02): eine '
                 'kakao-eigene Prozessaussage ohne neue Wirkzusage. Ein Loch '
                 'waere die schlechtere Loesung gewesen als ein Ersatz.',
    },
    {
        'id': 'ersatz-kakao-sortenverweis',
        'achse': 'text',
        'richtung': 'nur_crystal',
        'muster': r'Wie du ihn zubereitest und welche Sorte zu dir passt',
        'grund': 'Ersatz fuer den getilgten Cross-Sell (s02): verweist auf die '
                 'eigenen zwei Sorten statt auf das fremde Sortiment.',
    },
    {
        'id': 'fremd-reifephase-qihome',
        'achse': 'text',
        'richtung': 'nur_vorlage',
        # Die Vorlage zerlegt den Satz durch die <b>-Auszeichnungen der beiden
        # Fremdmarken in fuenf Textstuecke. Alle fuenf gehoeren zu DIESER
        # Tilgung; das letzte ist das Satzende hinter der zweiten Fettung.
        'muster': r'(QiHome® Air|GitterChip™-Technologie|harmonisierenden$|'
                  r'Atmosphäre – unterstützt durch die|'
                  r'ein: Es schafft eine besondere Atmosphäre|'
                  r'^– kristallisiert er langsam aus und entfaltet)',
        'grund': 'Fremdinhalts-Tilgung s02: beide Sortenseiten schrieben die '
                 'Reifephase des Kakaos einer Fremdtechnik zu. Die Aussage ueber '
                 'das langsame Auskristallisieren blieb erhalten, die '
                 'Zuschreibung ist weg.',
    },
    {
        'id': 'fremd-reifephase-create-satz',
        'achse': 'text',
        'richtung': 'nur_vorlage',
        'muster': r'Während dieser Reifephase setzen wir das$',
        'grund': 'Fremdinhalts-Tilgung s02, Create-Seite: derselbe Satz endete '
                 'in der Vorlage mit dem Einsatz der Fremdtechnik. Lokal endet '
                 'er beim Ursprung; das ist dieselbe Aussage ohne die '
                 'Zuschreibung.',
    },
    {
        'id': 'ersatz-reifephase-neutral',
        'achse': 'text',
        'richtung': 'nur_crystal',
        'muster': r'(In Ruhe kristallisiert er langsam aus und entfaltet'
                  r'|unsere tiefe Achtung vor dem Ursprung\.$)',
        'grund': 'Ersatz fuer die getilgte Fremdtechnik-Zuschreibung auf beiden '
                 'Sortenseiten (s02): die Aussage ueber das langsame '
                 'Auskristallisieren bleibt, die Fremdtechnik ist weg.',
    },
    {
        'id': 'fremd-faq-kombination',
        'achse': 'text',
        'richtung': 'nur_vorlage',
        'muster': r'(Kombination von Qi Blanco®-Produkten|'
                  r'Verwendung von Qi Blanco®-Produkten in Verbindung)',
        'grund': 'Fremdinhalts-Tilgung s02: der FAQ-Eintrag stand LIVE auf '
                 'beiden Kaufseiten und war Cross-Selling genau an der Stelle, '
                 'an der der Kunde ueber den Kakao entscheidet. Ersatzlos '
                 'gestrichen statt umformuliert — eine neue Wirkzusage an '
                 'seiner Stelle zu erfinden waere schlimmer als die Luecke.',
    },
    # --- Die STRUKTUR-Spur des Hydration-Fixes aus s06 ------------------------
    # KEINE Tilgung, sondern eine REPARATUR: Awake.jsx/Create.jsx rendern
    # `row.text` — ein Fragment aus mehreren <p> — und legten es in ein
    # weiteres <p>. Ein <p> in einem <p> ist ungueltiges HTML; der Parser
    # schliesst das aeussere vorzeitig, Server- und Client-Baum laufen
    # auseinander, und React bricht die Hydration ab (gemessen 2026-09-03:
    # 6 verschachtelte <p>, 8 Konsolenfehler, zweimal woertlich "Hydration
    # failed because the initial UI does not match what was rendered on the
    # server"). Der aeussere Traeger ist deshalb hier ein <div>, bei
    # unveraenderten Klassen und unveraendertem Text.
    #
    # WARUM DIE VORLAGE MEHR ELEMENTE HAT ALS CRYSTAL (259 gegen 252 bzw.
    # 255 gegen 249) UND DAS KEIN VERLUST IST: die Zusatz-Elemente der
    # Vorlage sind die REPARATUR DES BROWSERS an ihrem kaputten Markup — er
    # reisst die inneren <p> aus dem aeusseren heraus und haengt sie als
    # Geschwister daneben. Crystal hat sie weiterhin, nur korrekt
    # verschachtelt. Die Textachse belegt das getrennt: sie meldet auf
    # beiden Seiten "gleich".
    #
    # DIE VORLAGE TRAEGT DENSELBEN DEFEKT an derselben Zeile
    # (qiblanco-storefront Awake.jsx:251 / Create.jsx:243). Der Befund ist
    # dorthin gemeldet; faellt er dort, sind diese vier Zeilen wieder zu
    # entfernen — dann ist die Naht von selbst wieder geschlossen.
    {
        'id': 'struktur-hydration-p-traeger-vorlage',
        'achse': 'struktur',
        'richtung': 'nur_vorlage',
        'seiten': ['/products/crystal-cacao-awake', '/products/crystal-cacao-create'],
        'muster': None,
        'folge': ['p|leading-relaxed text-gray-800 text-sm|'],
        'anzahl_max': 3,
        'grund': 'Der ungueltige <p>-Traeger der Herkunfts-Absaetze. In der '
                 'Vorlage ein <p> in einem <p>, was die React-Hydration '
                 'abbrechen laesst (s06, gemessen).',
    },
    {
        'id': 'struktur-hydration-div-traeger-crystal',
        'achse': 'struktur',
        'richtung': 'nur_crystal',
        'seiten': ['/products/crystal-cacao-awake', '/products/crystal-cacao-create'],
        'muster': None,
        'folge': ['div|leading-relaxed text-gray-800 text-sm|'],
        'anzahl_max': 3,
        'grund': 'Derselbe Traeger als <div>: gleiche Klassen, gleicher Text, '
                 'gueltiges HTML. Ersatz zu struktur-hydration-p-traeger-vorlage.',
    },
    {
        'id': 'struktur-hydration-parser-reparatur-vorlage',
        'achse': 'struktur',
        'richtung': 'nur_vorlage',
        'seiten': ['/products/crystal-cacao-awake'],
        'muster': None,
        'folge': ['p||', 'p|mt-3|', 'b||'],
        'anzahl_max': 1,
        'grund': 'Die inneren Absaetze, die der Browser in der Vorlage aus dem '
                 'kaputten <p> herausreisst und als Geschwister danebenhaengt. '
                 'Sie stehen in crystal weiterhin, nur korrekt im <div> '
                 'verschachtelt — der Diff meldet sie deshalb an anderer '
                 'Stelle, siehe Gegenstueck nur_crystal.',
    },
    {
        'id': 'struktur-hydration-parser-reparatur-crystal',
        'achse': 'struktur',
        'richtung': 'nur_crystal',
        'seiten': ['/products/crystal-cacao-awake'],
        'muster': None,
        'folge': ['p||', 'b||', 'p|mt-3|'],
        'anzahl_max': 1,
        'grund': 'Dieselben Absaetze an ihrer korrekten Stelle im <div>. '
                 'Gegenstueck zu struktur-hydration-parser-reparatur-vorlage.',
    },

    # --- Die STRUKTUR-Spuren derselben Tilgungen ------------------------------
    # Ein geloeschter Absatz laesst nicht nur Text fehlen, sondern auch die
    # Elemente, die ihn getragen haben. Die Textachse allein wuerde das nicht
    # decken; deshalb stehen die Spuren hier — aber als FORM, nicht als Zahl.
    #
    # WARUM `folge` UND KEIN MUSTER: ein Muster wie 'b|' wuerde JEDES entfernte
    # <b> auf der ganzen Seite durchwinken. Die Form beschreibt genau den einen
    # Baustein, der weggefallen ist. Faellt spaeter ein zweiter <b> weg, deckt
    # ihn diese Zeile NICHT.
    #
    # UND WARUM DAS KEIN GEPINNTER WACHSENDER ZAEHLER IST: die Zahl unten
    # beschreibt die Form EINES entfernten Bausteins. Waechst die Seite um
    # einen Abschnitt, waechst sie auf BEIDEN Seiten und diese Zeile bleibt
    # unberuehrt — die Sollwerte der Probe kommen ausschliesslich aus der
    # LIVE-Vorlage, nie aus dieser Datei.
    {
        'id': 'struktur-faq-eintrag-entfernt',
        'achse': 'struktur',
        'richtung': 'nur_vorlage',
        'seiten': ['/products/crystal-cacao-awake', '/products/crystal-cacao-create'],
        'muster': None,
        'folge': [
            'div|ProductFAQ__item|',
            'button|ProductFAQ__question|',
            'span||',
            'svg|lucide lucide-chevron-down|',
            'div|ProductFAQ__answer|',
        ],
        'grund': 'Die Traeger-Elemente des unter fremd-faq-kombination '
                 'getilgten FAQ-Eintrags. Ein FAQ-Eintrag der Vorlage hat genau '
                 'diese Form; die Textachse belegt getrennt, WELCHER Eintrag es '
                 'war.',
    },
    {
        'id': 'struktur-fremdmarke-fett-entfernt',
        'achse': 'struktur',
        'richtung': 'nur_vorlage',
        'seiten': ['/products/crystal-cacao-awake', '/products/crystal-cacao-create'],
        'muster': None,
        'folge': ['b||'],
        'anzahl_max': 2,
        'grund': 'In der Vorlage stehen die Fremdmarken der Reifephase ("QiHome(R) '
                 'Air", "GitterChip(TM)-Technologie") als <b> im Fliesstext. Mit '
                 'dem Text faellt der Traeger weg: Awake trug zwei, Create einen. '
                 'anzahl_max 2 ist deshalb die Form des groesseren der beiden '
                 'Faelle, keine Gesamtzahl der Seite.',
    },
    {
        'id': 'kanonische-domain',
        'achse': 'jsonld',
        'richtung': 'beide',
        'muster': None,   # wird durch Domain-Normalisierung behandelt
        'grund': 'K2-Adaption app/lib/seo.js: CANONICAL_ORIGIN steht auf '
                 'https://crystal-cacao.com. Byte-gleich uebernommen truege JEDE '
                 'crystal-Seite einen Canonical auf qiblanco.com — Google wuerde '
                 'crystal-cacao.com dorthin konsolidieren und der Kakao-Laden '
                 'verschwaende aus dem Index, ohne Fehlermeldung. Die Probe '
                 'normalisiert die Domain deshalb auf BEIDEN Seiten weg und '
                 'vergleicht den Rest streng.',
    },
]


# ---------------------------------------------------------------------------
# Messen
# ---------------------------------------------------------------------------
class Messausfall(Exception):
    pass


def hole(url: str, timeout: int = 40) -> str:
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (probe_kakao_naehe; crystal-cacao)',
            **MARKT_HEADER,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if r.status != 200:
                raise Messausfall(f'{url}: HTTP {r.status}')
            return r.read().decode('utf-8', 'replace')
    except urllib.error.URLError as e:
        raise Messausfall(f'{url}: {e}') from e
    except OSError as e:
        raise Messausfall(f'{url}: {e}') from e


def _ohne_skripte(s: str) -> str:
    for tag in ('script', 'style', 'noscript', 'svg'):
        s = re.sub(r'(?is)<%s\b.*?</%s>' % (tag, tag), ' ', s)
    return s


def haupt(s: str, url: str) -> str:
    """Der Inhaltsbereich. Kopf-/Fusszeile sind bewusst NICHT enthalten —
    sie sind auf einem Kakao-Shop zwangslaeufig andere (Sortiments-Zaun s02)
    und wuerden jede inhaltliche Aussage im Rauschen ersaeufen. Der Balken
    ueber der Kopfzeile hat dafuer eine eigene Achse."""
    teile = re.findall(r'(?is)<main\b[^>]*>(.*?)</main>', s)
    if not teile:
        raise Messausfall(f'{url}: kein <main> im Dokument')
    return max(teile, key=len)


LEER_TAGS = {
    'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'path', 'use',
    'circle', 'area', 'col', 'track', 'wbr', 'embed', 'param',
}


def achse_struktur(m: str) -> list[str]:
    """Abschnittsfolge und -anzahl: die Folge aller Element-Oeffnungen mit
    ihrer class-Signatur UND ihren data-Attributen. Aendert sich die
    Reihenfolge, faellt ein Abschnitt weg oder kommt einer dazu, schlaegt
    diese Achse aus.

    WARUM DIE data-ATTRIBUTE MIT MUESSEN — im Bau dieses Segments teuer
    gelernt: die erste Fassung verglich nur Tag und Klasse und war deshalb
    GRUEN, waehrend die Seiten nachweislich auseinanderliefen. Der Upstream
    hatte `data-qb-rating="d"` auf das Sterne-span gesetzt (Sterne-Vertrag,
    qiblanco #290); live stand es, hier fehlte es. Ein semantischer Vertrag,
    der ueber ein Attribut gefuehrt wird, ist genau die Klasse "formal
    gleich, faktisch anders", gegen die diese Probe gebaut ist — und sie war
    dafuer blind. Aufgefallen ist es nur, weil die Datei-Drift-Wache in ihrer
    Meldung den erwarteten UND den gemessenen Hash nennt.

    Nur `data-*`: ids, hrefs, srcs und aria-Werte tragen hier Laufzeit- und
    Groessenrauschen (Hydrogen-Hydrationskeys, Bild-Transformationen) und
    wuerden die Achse unbrauchbar machen. Die Bilder haben ihre eigene Achse,
    der Text seine."""
    out = []
    for mm in re.finditer(r'(?is)<([a-z0-9]+)([^>]*)>', m):
        tag = mm.group(1).lower()
        if tag in LEER_TAGS:
            continue
        attrs = mm.group(2)
        k = re.search(r'class="([^"]*)"', attrs)
        klasse = ' '.join(sorted(k.group(1).split())) if k else ''
        daten = sorted(
            f'{n}={w}' for n, w in re.findall(r'(data-[\w-]+)="([^"]*)"', attrs)
        )
        out.append(f'{tag}|{klasse}|{" ".join(daten)}')
    return out


def achse_ueberschriften(m: str) -> list[str]:
    out = []
    for mm in re.finditer(r'(?is)<(h[1-6])\b[^>]*>(.*?)</\1>', m):
        t = _text(mm.group(2))
        if t:
            out.append(f'{mm.group(1)}: {t}')
    return out


def _text(fragment: str) -> str:
    return ' '.join(htmllib.unescape(re.sub(r'(?s)<[^>]+>', ' ', fragment)).split())


def achse_text(m: str) -> list[str]:
    roh = re.sub(r'(?s)<[^>]+>', '\n', _ohne_skripte(m))
    zeilen = [' '.join(z.split()) for z in htmllib.unescape(roh).split('\n')]
    return [z for z in zeilen if z]


def achse_bilder(m: str) -> list[str]:
    """Dieselben Bilder in derselben Reihenfolge. Verglichen wird der
    Dateiname der Shopify-CDN-URL ohne Transform-Parameter — die
    Breiten/Hoehen-Parameter unterscheiden sich je Viewport-Verhandlung und
    sagen nichts ueber das Bild aus."""
    out = []
    for mm in re.finditer(r'(?is)<img\b[^>]*>', m):
        src = re.search(r'src="([^"]+)"', mm.group(0))
        if not src:
            continue
        u = htmllib.unescape(src.group(1)).split('?')[0]
        out.append(u.rsplit('/', 1)[-1])
    return out


PREIS_MUSTER = re.compile(
    r'((?:\d[\d.]*,?-?\s*€)|(?:\$\d[\d.,]*)|(?:\d+[.,]\d+\s*€\s*/\s*100g)'
    r'|(?:\d+x\s*\d+g[^|]*\|[^|]*\|[^<\n]*))'
)


def achse_preise(m: str) -> list[str]:
    """Preis- und Mengenstaffel. Sie ist die einzige Achse, die NICHT aus dem
    Repo kommt, sondern aus dem Shopify-Datensatz — und genau deshalb muss sie
    gemessen und darf nicht aus der Datei-Gleichheit geschlossen werden."""
    return [' '.join(x.split()) for x in PREIS_MUSTER.findall(' \n'.join(achse_text(m)))]


def achse_jsonld(dok: str) -> list[str]:
    """Strukturierte Daten, domain-normalisiert (siehe ABWEICHUNGEN
    'kanonische-domain')."""
    out = []
    for mm in re.finditer(
        r'(?is)<script[^>]*application/ld\+json[^>]*>(.*?)</script>', dok
    ):
        try:
            o = json.loads(htmllib.unescape(mm.group(1)))
        except json.JSONDecodeError as e:
            out.append(f'PARSEFEHLER: {e}')
            continue
        out.extend(_ld_signatur(o))
    return out


def _ld_signatur(o, pfad: str = '') -> list[str]:
    if isinstance(o, dict):
        res = []
        for k in sorted(o):
            res.extend(_ld_signatur(o[k], f'{pfad}.{k}'))
        return res
    if isinstance(o, list):
        res = [f'{pfad}[]={len(o)}']
        for i, v in enumerate(o):
            res.extend(_ld_signatur(v, f'{pfad}[{i}]'))
        return res
    s = str(o)
    s = re.sub(r'https?://(?:www\.)?(?:qiblanco\.com|crystal-cacao\.com)',
               '<KANONISCHE-DOMAIN>', s)
    return [f'{pfad}={s}']


BALKEN_RE = re.compile(
    r'(?is)<div[^>]*class="[^"]*Header-AnnouncementBanner[^"]*"[^>]*>(.*?)</div>'
)


def achse_balken(dok: str) -> list[str]:
    """Der Vertrauensbalken ueber der Kopfzeile. Eigene Achse, weil er
    ausserhalb von <main> steht und die Kopfzeile im uebrigen bewusst
    abweicht. Auf der Vorlage traegt er auf den Kakao-Seiten den
    Kakao-Zweig (KAKAO_KENNZAHLEN); genau der gehoert hierher."""
    treffer = BALKEN_RE.search(dok)
    if not treffer:
        return []
    t = _text(treffer.group(1))
    return [t] if t else []


ACHSEN = [
    ('struktur', 'Abschnittsfolge und -anzahl', True, achse_struktur),
    ('ueberschrift', 'Ueberschriften', True, achse_ueberschriften),
    ('text', 'Fliesstext', True, achse_text),
    ('bild', 'Bilder und ihre Reihenfolge', True, achse_bilder),
    ('preis', 'Preis- und Mengenstaffel', True, achse_preise),
    ('jsonld', 'Strukturierte Daten', False, achse_jsonld),
    ('balken', 'Vertrauensbalken ueber der Kopfzeile', False, achse_balken),
]


def _gilt_hier(a: dict, seite: str) -> bool:
    """Eine Ausnahme gilt nur dort, wo sie ihren Gegenstand hat.

    WARUM DAS NICHT KOSMETIK IST — im Rot-vor-Gruen-Lauf dieses Segments
    aufgefallen und deshalb nachgezogen: ohne diese Bindung haette die
    Ausnahme `struktur-fremdmarke-fett-entfernt` (anzahl_max 2) auf der
    UEBERSICHTSSEITE bis zu zwei entfernte <b> verschluckt, obwohl ihr
    Gegenstand — die Fremdmarken der Reifephase — dort gar nicht vorkommt.
    Eine Ausnahme, die weiter reicht als ihr Grund, ist ein Loch in der
    Wache."""
    seiten = a.get('seiten')
    return not seiten or seite in seiten


def erlaubt(achse: str, richtung: str, zeile: str, seite: str) -> dict | None:
    for a in ABWEICHUNGEN:
        if a['achse'] != achse or not a['muster']:
            continue
        if a['richtung'] != richtung or not _gilt_hier(a, seite):
            continue
        if re.search(a['muster'], zeile):
            return a
    return None


def _formen_abziehen(achse: str, richtung: str, zeilen: list[str],
                     benutzt: set, seite: str) -> list[str]:
    """Zieht die als FORM (`folge`) benannten Bausteine aus der Menge der
    abweichenden Zeilen ab. Was uebrig bleibt, ist unbegruendet.

    Bewusst als Multimenge und nicht als Teilfolge: der Diff-Algorithmus zerlegt
    einen zusammenhaengenden Wegfall je nach Umgebung in mehrere Bloecke, die
    Reihenfolge der Meldung ist also kein verlaesslicher Traeger. Die FORM ist
    einer."""
    rest = list(zeilen)
    for a in ABWEICHUNGEN:
        if a['achse'] != achse or a['richtung'] != richtung:
            continue
        if not _gilt_hier(a, seite):
            continue
        folge = a.get('folge')
        if not folge:
            continue
        for _ in range(a.get('anzahl_max', 1)):
            if all(f in rest for f in folge):
                for f in folge:
                    rest.remove(f)
                benutzt.add(a['id'])
            else:
                break
    return rest


def vergleiche(achse, v: list[str], c: list[str], benutzt: set,
               seite: str) -> list[str]:
    """Gibt die NICHT begruendeten Abweichungen zurueck."""
    nur_v, nur_c = [], []
    sm = difflib.SequenceMatcher(None, v, c)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        for z in v[i1:i2]:
            a = erlaubt(achse, 'nur_vorlage', z, seite)
            if a:
                benutzt.add(a['id'])
            else:
                nur_v.append(z)
        for z in c[j1:j2]:
            a = erlaubt(achse, 'nur_crystal', z, seite)
            if a:
                benutzt.add(a['id'])
            else:
                nur_c.append(z)
    nur_v = _formen_abziehen(achse, 'nur_vorlage', nur_v, benutzt, seite)
    nur_c = _formen_abziehen(achse, 'nur_crystal', nur_c, benutzt, seite)
    return [f'- {z}' for z in nur_v] + [f'+ {z}' for z in nur_c]


def kontrast(hex1: str, hex2: str) -> float:
    def lum(h):
        h = h.lstrip('#')
        vals = []
        for i in (0, 2, 4):
            c = int(h[i:i + 2], 16) / 255
            vals.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]
    a, b = lum(hex1), lum(hex2)
    hell, dunkel = max(a, b), min(a, b)
    return (hell + 0.05) / (dunkel + 0.05)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--crystal-basis',
                   default=os.environ.get('CC_BASIS', CRYSTAL_BASIS_VORGABE))
    p.add_argument('--vorlage-basis', default=VORLAGE_BASIS)
    p.add_argument('--seite', action='append',
                   help='nur diese Seite messen (mehrfach angebbar)')
    p.add_argument('--kontrast-balken', action='store_true',
                   help='nur den Kontrast des Vertrauensbalkens nachrechnen')
    args = p.parse_args()

    if args.kontrast_balken:
        v = kontrast('#FFFFFF', '#171310')
        print(f'Vertrauensbalken: #FFFFFF auf --cc-dunkel #171310 = {v:.2f}:1 '
              f'(WCAG AA Fliesstext 4.5:1)')
        return 0 if v >= 4.5 else 1

    seiten = args.seite or SEITEN
    benutzt: set[str] = set()
    befunde = 0
    print(f'VORLAGE  {args.vorlage_basis}')
    print(f'CRYSTAL  {args.crystal_basis}')
    print(f'MARKT    gepinnt auf {MARKT_HEADER} (sonst misst man zwei Maerkte)')
    print()

    for seite in seiten:
        try:
            dv = hole(args.vorlage_basis + seite)
            dc = hole(args.crystal_basis + seite)
            mv = haupt(dv, args.vorlage_basis + seite)
            mc = haupt(dc, args.crystal_basis + seite)
        except Messausfall as e:
            print(f'MESSAUSFALL: {e}')
            print('=> KEINE AUSSAGE. Ein Lauf ohne beide Seiten ist nicht '
                  '"sauber", sondern ungemessen.')
            return 4

        print(f'=== {seite}')
        for kuerzel, titel, im_main, fn in ACHSEN:
            v = fn(mv if im_main else dv)
            c = fn(mc if im_main else dc)
            rest = vergleiche(kuerzel, v, c, benutzt, seite)
            marke = 'gleich' if not rest else f'{len(rest)} ABWEICHUNG(EN)'
            print(f'  [{"OK" if not rest else "!!"}] {titel:38s} '
                  f'V={len(v):4d} C={len(c):4d}  {marke}')
            for z in rest[:12]:
                print(f'        {z[:170]}')
            if len(rest) > 12:
                print(f'        … und {len(rest) - 12} weitere')
            befunde += len(rest)
        print()

    aktive = {a['id'] for a in ABWEICHUNGEN if a.get('muster') or a.get('folge')}
    tot = sorted(aktive - benutzt)
    print('--- Benannte Abweichungen ---')
    for a in ABWEICHUNGEN:
        z = 'genutzt' if a['id'] in benutzt else (
            'ohne Muster (Normalisierung)'
            if not (a.get('muster') or a.get('folge')) else 'NICHT GENUTZT')
        print(f'  [{z:28s}] {a["id"]}')
    if tot:
        print()
        print(f'HINWEIS: {len(tot)} benannte Abweichung(en) haben in diesem Lauf '
              f'nicht gegriffen: {", ".join(tot)}.')
        print('  Das ist KEIN Fehler, aber es gehoert angesehen: entweder ist die '
              'Vorlage nachgezogen (dann faellt die Ausnahme weg) oder es wurde '
              'nur eine Teilmenge der Seiten gemessen. Eine Ausnahme ohne '
              'Gegenstand ist ein Loch, das niemand mehr bemerkt.')

    print()
    if befunde:
        print(f'URTEIL: {befunde} NICHT begruendete Abweichung(en) — die '
              f'Kakao-Seiten laufen von der Vorlage weg.')
        print()
        print('WAS DAS HEISST, damit der naechste Leser nicht das Falsche tut:')
        print('  Ein rotes Urteil hier ist in der Regel KEIN Defekt in crystal,')
        print('  sondern ein faelliger NACHZUG. qiblanco ist autoritativ')
        print('  (ADR 0056); bewegt sich die Vorlage, zieht crystal nach. Wer')
        print('  hier "repariert", repariert gesunden Code.')
        print('  Zeilen mit "-" fehlen HIER (Vorlage hat sie) -> nachziehen.')
        print('  Zeilen mit "+" stehen NUR hier -> entweder in die benannte')
        print('  Liste ABWEICHUNGEN mit Grund, oder zurueckbauen.')
        print('  Der Nachzug selbst laeuft ueber die geteilten Dateien; danach')
        print('  shared/UPSTREAM.json neu erzeugen (erzeuge_upstream_manifest.py).')
        return 1
    print('URTEIL: NAH AM ORIGINAL — jede gemessene Abweichung steht in der '
          'benannten Liste.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
