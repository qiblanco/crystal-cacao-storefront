#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
farbmessung_verpackung.py — leitet die Farbwelt der Crystal-Cacao-Storefront
aus den ECHTEN Produktbildern der beiden Sorten ab.

ANLASS (Christian, Grossjob 20260902-…-prio6): "Gerne darf die Seite einen
passenden Farbton bekommen, ABGELEITET von den Verpackungsbildern. Achtung:
Awake und Create haben zwei unterschiedliche Farbgebungen im Namen."
Drei Woerter tragen den Auftrag: ABGELEITET (nicht erfunden), AUSWERTEN
(gemessen, nicht geschaetzt), DEZENT.

WARUM DIESES SKRIPT UND NICHT EIN BLICK INS BILD: eine Farbe, die jemand
"passend" nennt, ist eine Meinung; eine Farbe mit Hex, HSL, CIELAB und
Flaechenanteil ist ein Befund, den der naechste Job nachrechnen kann.

QUELLENWAHL — WAS BEWUSST NICHT GEMESSEN WIRD
  Die im Baum liegenden Dateien 2x-Awake.webp, 2x-Create-BF.webp und
  Create_Awake.png sind BLACK-FRIDAY-KOMPOSITIONEN (Schneeszene, rote
  Laserstrahlen, farbiges Licht auf der Verpackung). Eine k-means-Analyse
  darauf misst die Kampagne, nicht die Verpackung. Gemessen wird deshalb
  ausschliesslich an Bildern, die im Shopify-PRODUKTDATENSATZ der beiden
  Sorten haengen (Storefront-API, product.images) und einen neutralen
  Studiohintergrund haben — der Hintergrund wird als Farbstich-Kontrolle
  MITGEMESSEN und im Bericht ausgewiesen (Feld `hintergrund`).

BESTAND-VOR-NEUBAU (P10)
  Die CIELAB-Umrechnung und das k-means mit festem Seed kommen aus dem
  Design-Meister (design-meister/src/bildsprache.py). Genutzt wird
  `dominante_palette()` unveraendert, wo kein Freistellen noetig ist
  (enge Wortmarken-Ausschnitte). Fuer die VERPACKUNG SELBST reicht sie
  nicht: sie hat keinen Masken-Parameter und verkleinert intern auf 128px,
  was die Maskenkante verschmieren wuerde. Dort wird `_rgb_to_lab()` des
  Design-Meisters wiederverwendet und nur die Zuordnungsschleife mit Maske
  gefahren — gleicher Seed (42), gleiche Iterationszahl, gleiche Metrik.

MASKE
  Der Studiohintergrund ist eine flache Flaeche. Sie wird aus vier
  Eckstichproben (je 30x30 px) gemittelt; alles mit CIELAB-Abstand > 10 zu
  diesem Mittel gilt als Verpackung. Die Streuung ueber die vier Ecken wird
  ausgegeben: ist sie gross, war die Flaeche nicht flach und die Maske
  waere unzulaessig.

EXIT
  0 = gemessen
  4 = MESSAUSFALL (Bild nicht ladbar, Werkzeug fehlt) — ausdruecklich NICHT
      als "gemessen und sauber" lesbar
"""
import argparse
import colorsys
import hashlib
import json
import os
import sys
import urllib.request

HIER = os.path.dirname(os.path.abspath(__file__))
DM_SRC = "/srv/openclaw/shared-state/design-meister/src"

try:
    import numpy as np
    from PIL import Image
except Exception as ex:  # pragma: no cover
    print(f"MESSAUSFALL: numpy/PIL fehlen ({ex})", file=sys.stderr)
    sys.exit(4)

sys.path.insert(0, DM_SRC)
try:
    import bildsprache as bs  # noqa: E402  (Bestand, P10)
except Exception as ex:  # pragma: no cover
    print(f"MESSAUSFALL: design-meister/src/bildsprache.py nicht ladbar ({ex})",
          file=sys.stderr)
    sys.exit(4)


# ---------------------------------------------------------------------------
# Die Messobjekte. Jeder Eintrag traegt seine Begruendung mit — ein Bild ohne
# beurteilbare Beleuchtung ist kein Messobjekt (Auftrag woertlich).
# ---------------------------------------------------------------------------
CDN = "https://cdn.shopify.com/s/files/1/0279/3095/1750/files/"

QUELLEN = [
    {
        "id": "awake-vorderseite",
        "sorte": "awake",
        "url": CDN + "7.png?v=1765893911",
        "eignung": "Produktdatensatz crystal-cacao-awake, Bild 0. Doypack "
                   "frontal, flacher Studiogrund, kein Szenenlicht.",
        "regionen": {
            # Wortmarke 'Awake' auf dem dunklen Etikett. Der Ausschnitt liegt
            # UNTER dem goldenen Schriftzug 'CACAO', damit das Gold nicht als
            # zweiter Cluster mitgemessen wird.
            "wortmarke": (0.395, 0.470, 0.630, 0.535),
        },
        "verpackung": True,
    },
    {
        "id": "awake-rueckseite",
        "sorte": "awake",
        "url": CDN + "8.png?v=1766919672",
        "eignung": "Produktdatensatz crystal-cacao-awake, Bild 7. "
                   "Rueckseiten-Etikett, nahezu planar, Wortmarke auf hellem "
                   "Grund — der sauberste Fall fuer die Sortenfarbe.",
        "regionen": {
            "wortmarke": (0.314, 0.308, 0.462, 0.370),
        },
        "verpackung": False,
    },
    {
        "id": "create-vorderseite",
        "sorte": "create",
        "url": CDN + "Doypack_Mockup__v3-min.png?v=1765893937",
        "eignung": "Produktdatensatz crystal-cacao-create, Bild 0. Gleiche "
                   "Aufnahmesituation wie awake-vorderseite — dadurch sind "
                   "die beiden Sorten direkt vergleichbar.",
        "regionen": {
            "wortmarke": (0.400, 0.470, 0.625, 0.535),
        },
        "verpackung": True,
    },
    {
        "id": "create-rueckseite",
        "sorte": "create",
        "url": CDN + "Crystal_Cacao_-2-min.png?v=1766919764",
        "eignung": "Produktdatensatz crystal-cacao-create, Bild 7. "
                   "Rueckseiten-Etikett, Wortmarke auf hellem Grund.",
        "regionen": {
            "wortmarke": (0.105, 0.062, 0.420, 0.140),
        },
        "verpackung": False,
    },
    {
        "id": "kakao-bruch",
        "sorte": None,
        "url": CDN + "Kakao2.png?v=1766919082",
        "eignung": "In BEIDEN Produktdatensaetzen enthalten (Bild 1) — also "
                   "sortenneutral. Der gebrochene Kakaoblock ist die Quelle "
                   "fuer den Kakao-Ton des Neutral-Kontinuums.",
        "regionen": {},
        "verpackung": False,
        "ganzbild": True,
    },
]


# ---------------------------------------------------------------------------
def _hsl(hexwert):
    r, g, b = (int(hexwert[i:i + 2], 16) / 255.0 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return [round(h * 360, 1), round(s * 100, 1), round(l * 100, 1)]


def _chroma(lab):
    return round(float((lab[1] ** 2 + lab[2] ** 2) ** 0.5), 2)


def _hex(rgb_mean):
    return "#%02X%02X%02X" % tuple(int(round(x)) for x in rgb_mean)


def _lade(url, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    name = hashlib.sha256(url.encode()).hexdigest()[:16] + ".bin"
    p = os.path.join(cache_dir, name)
    if not os.path.exists(p):
        urllib.request.urlretrieve(url, p)
    with open(p, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    return p, sha


def _kmeans_lab(px, k, iterationen=12, seed=42):
    """Identische Mechanik wie bildsprache.dominante_palette — nur ohne die
    interne 128px-Verkleinerung, damit eine Maske scharf bleibt."""
    lab = bs._rgb_to_lab(px)
    rng = np.random.default_rng(seed)
    centers = lab[rng.choice(len(lab), size=min(k, len(lab)), replace=False)]
    for _ in range(iterationen):
        d = np.linalg.norm(lab[:, None, :] - centers[None, :, :], axis=2)
        zuord = np.argmin(d, axis=1)
        neu = np.array([lab[zuord == i].mean(axis=0) if np.any(zuord == i)
                        else centers[i] for i in range(len(centers))])
        if np.allclose(neu, centers, atol=1e-3):
            centers = neu
            break
        centers = neu
    d = np.linalg.norm(lab[:, None, :] - centers[None, :, :], axis=2)
    zuord = np.argmin(d, axis=1)
    out = []
    for i, c in enumerate(centers):
        m = zuord == i
        if not np.any(m):
            continue
        hexw = _hex(px[m].mean(axis=0))
        out.append({
            "hex": hexw,
            "hsl": _hsl(hexw),
            "lab": [round(float(x), 2) for x in c],
            "chroma": _chroma(c),
            "anteil": round(float(m.mean()), 4),
        })
    return sorted(out, key=lambda e: -e["anteil"])


def _hintergrund(im):
    """Eckstichprobe + Streuung. Die Streuung ist die Ehrlichkeitspruefung:
    ist der Grund nicht flach, taugt die Maske nicht."""
    a = np.asarray(im).astype(np.float64)
    ecken = np.concatenate([a[:30, :30].reshape(-1, 3), a[:30, -30:].reshape(-1, 3),
                            a[-30:, :30].reshape(-1, 3), a[-30:, -30:].reshape(-1, 3)])
    bg = ecken.mean(axis=0)
    lab = bs._rgb_to_lab(bg.reshape(1, 3))[0]
    hexw = _hex(bg)
    return {
        "hex": hexw, "hsl": _hsl(hexw),
        "lab": [round(float(x), 2) for x in lab],
        "chroma": _chroma(lab),
        "streuung_rgb": [round(float(x), 2) for x in ecken.std(axis=0)],
        # Ein neutraler Grund hat Chroma nahe 0. Alles darueber ist ein
        # Farbstich und wuerde jede Messung im Bild mitfaerben.
        "farbstich_urteil": ("neutral" if _chroma(lab) < 4 else
                             "leichter Stich" if _chroma(lab) < 10 else
                             "FARBSTICHIG — als Messobjekt untauglich"),
    }


def messe(q, cache_dir, k_wortmarke=4, k_verpackung=7):
    pfad, sha = _lade(q["url"], cache_dir)
    im = Image.open(pfad).convert("RGB")
    voll = im.size
    erg = {
        "id": q["id"], "sorte": q["sorte"], "url": q["url"],
        "sha256": sha, "groesse": list(voll), "eignung": q["eignung"],
        "hintergrund": _hintergrund(im),
        "regionen": {}, "verpackung": None, "ganzbild": None,
    }

    # --- Wortmarken: enger Ausschnitt, Bestandsfunktion unveraendert (P10) ---
    for name, box in q.get("regionen", {}).items():
        w, h = voll
        c = im.crop((int(box[0] * w), int(box[1] * h),
                     int(box[2] * w), int(box[3] * h)))
        tmp = os.path.join(cache_dir, f"{q['id']}-{name}.png")
        c.save(tmp)
        pal = bs.dominante_palette(tmp, k=k_wortmarke)
        for e in pal:
            e["hsl"] = _hsl(e["rgb"])
            e["hex"] = e.pop("rgb")
            e["chroma"] = _chroma(e["lab"])
        # Die Wortmarke ist der farbigste Cluster mit nennenswerter Flaeche:
        # der Grund (creme oder schwarz) ist immer der GROESSTE, aber immer
        # der farbaermste. Ausgewiesen wird beides, entschieden nach Chroma.
        kandidaten = [e for e in pal if e["anteil"] >= 0.05]
        traeger = max(kandidaten or pal, key=lambda e: e["chroma"])
        erg["regionen"][name] = {"palette": pal, "traeger": traeger,
                                 "ausschnitt": list(box)}

    # --- Verpackung freigestellt ---
    if q.get("verpackung"):
        klein = im.copy()
        klein.thumbnail((700, 700), Image.LANCZOS)
        a = np.asarray(klein).astype(np.float64)
        H, W, _ = a.shape
        bg = np.array([int(erg["hintergrund"]["hex"][i:i + 2], 16)
                       for i in (1, 3, 5)], dtype=np.float64)
        lab_all = bs._rgb_to_lab(a.reshape(-1, 3))
        lab_bg = bs._rgb_to_lab(bg.reshape(1, 3))[0]
        de = np.linalg.norm(lab_all - lab_bg, axis=1)
        maske = de > 10
        px = np.asarray(klein).reshape(-1, 3)[maske]
        erg["verpackung"] = {
            "maskenanteil": round(float(maske.mean()), 4),
            "pixel": int(maske.sum()),
            "palette": _kmeans_lab(px, k_verpackung),
        }

    if q.get("ganzbild"):
        pal = bs.dominante_palette(pfad, k=5)
        for e in pal:
            e["hsl"] = _hsl(e["rgb"])
            e["hex"] = e.pop("rgb")
            e["chroma"] = _chroma(e["lab"])
        erg["ganzbild"] = {"palette": pal}
    return erg


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache", default=os.path.join(HIER, "_farbmessung-cache"))
    ap.add_argument("--json", help="Bericht als JSON hierhin schreiben")
    a = ap.parse_args()

    try:
        ergebnisse = [messe(q, a.cache) for q in QUELLEN]
    except Exception as ex:
        print(f"MESSAUSFALL: {ex}", file=sys.stderr)
        return 4

    for e in ergebnisse:
        print(f"\n=== {e['id']}  ({e['groesse'][0]}x{e['groesse'][1]})")
        print(f"    Quelle : {e['url']}")
        print(f"    sha256 : {e['sha256'][:16]}…")
        hg = e["hintergrund"]
        print(f"    Grund  : {hg['hex']}  Lab {hg['lab']}  Chroma {hg['chroma']}"
              f"  Streuung {hg['streuung_rgb']}  -> {hg['farbstich_urteil']}")
        for name, r in e["regionen"].items():
            t = r["traeger"]
            print(f"    {name:>10}: TRAEGER {t['hex']}  HSL {t['hsl']}  "
                  f"Lab {t['lab']}  Chroma {t['chroma']}  Anteil {t['anteil']:.1%}")
            for c in r["palette"]:
                print(f"                 · {c['hex']}  HSL {c['hsl']}  "
                      f"Lab {c['lab']}  C {c['chroma']:>6}  {c['anteil']:.1%}")
        if e["verpackung"]:
            v = e["verpackung"]
            print(f"    Verpackung freigestellt ({v['maskenanteil']:.1%} der Flaeche, "
                  f"{v['pixel']} px):")
            for c in v["palette"]:
                print(f"                 · {c['hex']}  HSL {c['hsl']}  "
                      f"Lab {c['lab']}  C {c['chroma']:>6}  {c['anteil']:.1%}")
        if e["ganzbild"]:
            print("    Ganzbild:")
            for c in e["ganzbild"]["palette"]:
                print(f"                 · {c['hex']}  HSL {c['hsl']}  "
                      f"Lab {c['lab']}  C {c['chroma']:>6}  {c['anteil']:.1%}")

    if a.json:
        with open(a.json, "w") as f:
            json.dump({"quellen": ergebnisse}, f, indent=1, ensure_ascii=False)
        print(f"\nJSON: {a.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
