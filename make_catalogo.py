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
import csv, glob, re, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "catalogo")
RATE = 520  # ₡ por USD (igual que el inventario)

# categorías de TCGCSV/TCGplayer.
# RB y OP van COMPLETOS. Magic/YGO/Pokémon solo los ÚLTIMOS sets ("recent" grupos
# más nuevos por groupId, con piso de fecha; sus catálogos completos serían
# gigantes: Magic tiene 450 grupos). "excl" filtra grupos que no son cartas.
GAMES = {
    "riftbound": {"cat": 89, "label": "Riftbound"},
    "one-piece": {"cat": 68, "label": "One Piece"},
    "pokemon":   {"cat": 3,  "label": "Pokémon",  "recent": 12, "min_pub": "2025-01-01"},
    "magic":     {"cat": 1,  "label": "Magic",    "recent": 12, "min_pub": "2025-01-01",
                  "excl": ("Art Series",)},
    "yugioh":    {"cat": 2,  "label": "Yu-Gi-Oh", "recent": 12, "min_pub": "2025-01-01"},
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

def rich_magic(ed):
    extra = []
    if ed.get("P") and ed.get("T"): extra.append(["Fuerza / Resistencia", f'{ed["P"]}/{ed["T"]}'])
    if ed.get("Color"): extra.append(["Color", ed["Color"]])
    return {
        "ability_text": ed.get("OracleText", ""),
        "type": ed.get("SubType", ""),
        "rarity": ed.get("Rarity", ""),
        "number": ed.get("Number", ""),
        "extra": extra,
        "op": True,   # usa el renderizador de texto con <br>/[keywords] (no el de Riftbound)
    }

def rich_yugioh(ed):
    extra = []
    if ed.get("Attack") or ed.get("Defense"):
        extra.append(["ATK / DEF", f'{ed.get("Attack","?")}/{ed.get("Defense","?")}'])
    if ed.get("Level"): extra.append(["Nivel", ed["Level"]])
    if ed.get("LinkRating"): extra.append(["Link", ed["LinkRating"]])
    return {
        "ability_text": ed.get("Description", ""),
        "type": ed.get("Card Type", ""),
        "rarity": ed.get("Rarity", ""),
        "attribute": ed.get("Attribute", ""),
        "tags": ed.get("MonsterType", ""),
        "number": ed.get("Number", ""),
        "extra": extra,
        "op": True,
    }

def rich_pokemon(ed):
    # el "efecto" de un Pokémon son sus ataques; los entrenadores traen CardText
    partes = [ed[k] for k in ("Attack 1", "Attack 2", "Attack 3", "Attack 4") if ed.get(k)]
    ability = ed.get("CardText", "") or "<br>".join(partes)
    extra = []
    if ed.get("HP"): extra.append(["HP", ed["HP"]])
    if ed.get("Card Type"): extra.append(["Tipo de energía", ed["Card Type"]])
    if ed.get("Weakness"): extra.append(["Debilidad", ed["Weakness"]])
    if ed.get("Resistance"): extra.append(["Resistencia", ed["Resistance"]])
    if ed.get("RetreatCost"): extra.append(["Retirada", ed["RetreatCost"]])
    return {
        "ability_text": ability,
        "type": ed.get("Stage", "") or ed.get("Card Type", ""),
        "rarity": ed.get("Rarity", ""),
        "number": ed.get("Number", ""),
        "extra": extra,
        "op": True,
    }

RICH = {"riftbound": rich_riftbound, "one-piece": rich_onepiece,
        "magic": rich_magic, "yugioh": rich_yugioh, "pokemon": rich_pokemon}

# prioridad del precio base y subtipo que cuenta como "foil" por juego
BASE_SUBS = ["Normal", "1st Edition", "Holofoil", "Unlimited", "Foil", "Reverse Holofoil"]
FOIL_SUB  = {"riftbound": "Foil", "one-piece": "Foil",
             "magic": "Foil", "pokemon": "Reverse Holofoil"}   # yugioh: sin variante foil

# ---- Riftbound: imagen de RIOT (la MISMA del inventario) ---------------------
# El inventario RB usa las imágenes del CDN de Riot (CSVs de Riftbound_Cards/).
# El catálogo cruza cada producto por número de coleccionista + set para usar
# esa misma imagen: así el panel reconoce por img las cartas que YA están en la
# base (muestra el stepper con tu stock) y no se duplican al agregar.
# Fallback: la imagen de TCGplayer (sets sin CSV todavía, ej. Vendetta).
RB_DENOM_SET = {"298": "Origins", "219": "Unleashed", "221": "Spiritforged",
                "24": "Proving Grounds", "024": "Proving Grounds"}
RB_PROMO_HINTS = ("Promotional", "Judge", "Worlds Bundle", "Organized Play")

def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def _base_num(n):
    n = re.sub(r"[a-z]+$", "", (n or "").strip())   # quita sufijo de variante (039a, 246b)
    return n.lstrip("0") or "0"

def load_rb_base():
    idx = {}
    for f in glob.glob(os.path.join(ROOT, "Riftbound_Cards", "*", "*_cards.csv")):
        for r in csv.DictReader(open(f, encoding="utf-8-sig")):
            idx.setdefault((r["set_name"], r["collector_number"]), []).append(r)
    return idx

def rb_riot_img(name, number, rarity, idx):
    if "/" not in (number or ""):
        return ""
    N, D = number.rsplit("/", 1)
    st = RB_DENOM_SET.get(D.strip())
    rows = idx.get((st, _base_num(N))) if st else None
    if not rows:
        return ""
    # Showcase/Alt-Art usa la impresión Showcase; el resto (incl. promos) la normal
    want_sc = (rarity == "Showcase")
    pool = [r for r in rows if (r.get("rarity") == "Showcase") == want_sc] or rows
    if len(pool) == 1:
        return pool[0]["image_url"]
    # varios con el mismo número (Unleashed recicla numeración): por solape de nombre
    words = set(_norm(re.sub(r"\(.*?\)", "", name)).split())
    best = max(pool, key=lambda r: len(words & set(_norm(r["name"]).split())))
    return best["image_url"]

def build_game(key):
    cfg = GAMES[key]; cat = cfg["cat"]; label = cfg["label"]
    groups = results(fetch_json(f"https://tcgcsv.com/tcgplayer/{cat}/groups", f"{key}_groups"))
    # juegos "solo últimos sets": los N grupos más nuevos (groupId ≈ cronológico;
    # publishedOn viene contaminado en grupos viejos) con piso de fecha
    if cfg.get("recent"):
        groups = [g for g in groups
                  if (g.get("publishedOn") or "")[:10] >= cfg.get("min_pub", "")
                  and not any(x in g["name"] for x in cfg.get("excl", ()))]
        groups.sort(key=lambda g: -g["groupId"])
        groups = groups[:cfg["recent"]]
    print(f"[{label}] {len(groups)} sets")
    rb_idx = load_rb_base() if key == "riftbound" else None
    entries = []; rich = {}
    for g in groups:
        gid = g["groupId"]; setn = set_label(key, g["name"])
        # grupos promocionales de RB -> set corto "Promos" (igual que el inventario)
        if key == "riftbound" and any(h in g["name"] for h in RB_PROMO_HINTS):
            setn = "Promos"
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
            # single = carta: en RB/OP el sellado no trae extendedData; en
            # Magic/YGO/Pokémon SÍ trae (con UPC) → carta = tiene Rarity y no UPC
            if cat in (1, 2, 3):
                is_single = ("Rarity" in ed) and ("UPC" not in ed)
            else:
                is_single = bool(ed)
            subs = pm.get(pid, {})
            base_sub = next((s for s in BASE_SUBS if subs.get(s)), None)
            usd_norm = subs.get(base_sub) if base_sub else None
            fsub = FOIL_SUB.get(key, "Foil")
            usd_foil = subs.get(fsub) if fsub != base_sub else None   # no duplicar el mismo acabado
            base_usd = usd_norm
            price = round_crc(base_usd)
            # imagen: RB primero intenta la de Riot (la del inventario) por número+set;
            # fallback TCGplayer si existe (imageCount>0); si no, emoji
            has_img = (p.get("imageCount") or 0) > 0
            img = f"https://tcgplayer-cdn.tcgplayer.com/product/{pid}_400w.jpg" if has_img else ""
            if rb_idx is not None and is_single:
                riot = rb_riot_img(name, ed.get("Number", ""), ed.get("Rarity", ""), rb_idx)
                if riot: img = riot
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
