# -*- coding: utf-8 -*-
"""
make_catalogo.py — CATÁLOGO MAESTRO desde TCGplayer (vía TCGCSV).

Genera catalogo/<juego>.json con TODAS las versiones de cada carta (singles +
sellado) de los juegos que vende Reroll: imagen, precio en ₡ (market de
TCGplayer × ₡520 + el redondeo escalonado del proyecto), foil, y datos ricos
(efecto + atributos) para las fichas de detalle.

Lo consume:
  - el panel (admin.html) → buscador "Agregar desde catálogo" (estilo CardNexus)
  - make_cartas.py → data rica para /carta/<slug>.html de cualquier carta agregada

Correr: python make_catalogo.py           (todos los juegos)
        python make_catalogo.py riftbound (solo uno)
"""
import json, os, sys, math, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "catalogo")
RATE = 520  # ₡ por USD (igual que el inventario)

# categorías de TCGCSV/TCGplayer
GAMES = {
    "riftbound": {"cat": 89, "label": "Riftbound"},
    "one-piece": {"cat": 68, "label": "One Piece"},
}

# One Piece: prefijo con el código de set (más fácil de buscar/ordenar: "OP01: Romance Dawn")
OP_SET_CODES = {
    "Romance Dawn": "OP01", "Paramount War": "OP02", "Pillars of Strength": "OP03",
    "Kingdoms of Intrigue": "OP04", "Awakening of the New Era": "OP05",
    "Wings of the Captain": "OP06", "500 Years in the Future": "OP07",
    "Two Legends": "OP08", "Emperors in the New World": "OP09", "Royal Blood": "OP10",
    "A Fist of Divine Speed": "OP11", "Legacy of the Master": "OP12",
    "Carrying On His Will": "OP13", "The Azure Sea's Seven": "OP14",
    "Adventure on Kami's Island": "OP15", "The Time of Battle": "OP16",
}
def set_label(key, name):
    if key == "one-piece" and name in OP_SET_CODES:
        return f"{OP_SET_CODES[name]}: {name}"
    return name

# ---- redondeo escalonado del proyecto (ceil, piso ₡100) --------------------
def round_crc(usd):
    if not usd or usd <= 0: return 100
    raw = usd * RATE
    def ceil_to(x, s): return int(math.ceil(x / s) * s)
    if raw <= 100:      return 100
    if raw < 5000:      return max(100, ceil_to(raw, 100))
    if raw < 20000:     return ceil_to(raw, 500)
    if raw < 100000:    return ceil_to(raw, 1000)
    return ceil_to(raw, 5000)

# ---- fetch con cache local en scratchpad-like tmp --------------------------
CACHE = os.path.join(OUT_DIR, "_cache")
def fetch_json(url, cache_key):
    os.makedirs(CACHE, exist_ok=True)
    fp = os.path.join(CACHE, cache_key + ".json")
    if os.path.exists(fp):
        with open(fp, encoding="utf-8") as f:
            return json.load(f)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "reroll-catalogo/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read().decode("utf-8"))
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(data, f)
            return data
        except Exception as e:
            if attempt == 2: raise
            time.sleep(2)

def results(d): return d.get("results", d) if isinstance(d, dict) else d

# ---- mapeo de extendedData por juego ---------------------------------------
def ed_map(prod):
    return {e["name"]: e["value"] for e in prod.get("extendedData", [])}

SEALED_HINTS = ("booster box", "booster pack", "booster case", "case",
                "sleeved booster", "display", "starter deck", "double pack",
                "bundle", "collection", "gift", "tin", "pack ", "don!! card pack")

def looks_sealed(name):
    n = name.lower()
    return any(h in n for h in SEALED_HINTS)

def rich_riftbound(ed):
    return {
        "ability_text": ed.get("Description", ""),
        "type": ed.get("Card Type", ""),
        "rarity": ed.get("Rarity", ""),
        "domains": ed.get("Domain", ""),
        "energy": ed.get("Energy Cost", ""),
        "might": ed.get("Might", ""),
        "power": ed.get("Power Cost", ""),
        "tags": ed.get("Tag", ""),
        "collector_number": (ed.get("Number", "").split("/")[0] if ed.get("Number") else ""),
        "code": ed.get("Number", ""),
    }

def rich_onepiece(ed):
    return {
        "ability_text": ed.get("Description", ""),
        "type": ed.get("CardType", ""),
        "rarity": ed.get("Rarity", ""),
        "color": ed.get("Color", ""),
        "cost": ed.get("Cost", ""),
        "life": ed.get("Life", ""),
        "counter": ed.get("Counter", ""),
        "attribute": ed.get("Attribute", ""),
        "power": ed.get("Power", ""),
        "tags": ed.get("Subtypes", ""),
        "number": ed.get("Number", ""),
        "op": True,
    }

RICH = {"riftbound": rich_riftbound, "one-piece": rich_onepiece}

def build_game(key):
    cfg = GAMES[key]; cat = cfg["cat"]; label = cfg["label"]
    groups = results(fetch_json(f"https://tcgcsv.com/tcgplayer/{cat}/groups", f"{key}_groups"))
    print(f"[{label}] {len(groups)} sets")
    entries = []; rich = {}
    for g in groups:
        gid = g["groupId"]; setn = set_label(key, g["name"])
        prods = results(fetch_json(f"https://tcgcsv.com/tcgplayer/{cat}/{gid}/products", f"{key}_{gid}_p"))
        prices = results(fetch_json(f"https://tcgcsv.com/tcgplayer/{cat}/{gid}/prices", f"{key}_{gid}_pr"))
        # precios: productId -> {subtype: marketPrice}
        pm = {}
        for pr in prices:
            mp = pr.get("marketPrice")
            if mp is None: continue
            pm.setdefault(pr["productId"], {})[pr["subTypeName"]] = mp
        for p in prods:
            pid = p["productId"]; name = p["name"]
            ed = ed_map(p)
            is_single = bool(ed)  # las cartas traen extendedData; el sellado no
            subs = pm.get(pid, {})
            usd_norm = subs.get("Normal"); usd_foil = subs.get("Foil")
            base_usd = usd_norm if usd_norm else usd_foil
            price = round_crc(base_usd)
            # solo cableamos imagen si TCGplayer tiene una (imageCount>0); si no, emoji
            has_img = (p.get("imageCount") or 0) > 0
            img = f"https://tcgplayer-cdn.tcgplayer.com/product/{pid}_400w.jpg" if has_img else ""
            entry = {
                "name": name,
                "game": label,
                "set": setn,
                "number": ed.get("Number", ""),
                "rarity": ed.get("Rarity", ""),
                "type": "single" if is_single else "sealed",
                "img": img,
                "price": price,
            }
            # foil como variante (solo si hay Normal Y Foil = misma carta 2 acabados)
            if usd_norm and usd_foil:
                entry["foil"] = round_crc(usd_foil)
            entries.append(entry)
            if is_single and img:
                rich[img] = RICH[key](ed)
        print(f"   {setn}: {len(prods)} productos")
    os.makedirs(OUT_DIR, exist_ok=True)
    # archivo LIVIANO (lo carga el panel para el buscador)
    out = os.path.join(OUT_DIR, f"{key}.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False)
    # archivo RICO (solo lo usa make_cartas.py localmente para las fichas)
    outr = os.path.join(OUT_DIR, f"{key}_rich.json")
    with open(outr, "w", encoding="utf-8") as f:
        json.dump(rich, f, ensure_ascii=False)
    kb = os.path.getsize(out) // 1024; kbr = os.path.getsize(outr) // 1024
    print(f"[{label}] -> {key}.json ({len(entries)} ent, {kb} KB) + {key}_rich.json ({kbr} KB)")
    return entries

if __name__ == "__main__":
    which = sys.argv[1:] or list(GAMES.keys())
    total = 0
    for key in which:
        if key not in GAMES:
            print("juego desconocido:", key); continue
        total += len(build_game(key))
    print(f"OK — {total} entradas en el catálogo maestro.")
