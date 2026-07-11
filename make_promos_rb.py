# -*- coding: utf-8 -*-
"""
make_promos_rb.py — Agrega al inventario los PROMOS de Riftbound (Organized
Play, Judge, Promotional) con su precio de mercado de TCGplayer (vía TCGCSV).

Qué hace:
  1. Baja los grupos de promo de Riftbound (89) y sus precios FRESCOS.
  2. Descarta los que NO son singles jugables vendibles:
       - Sellados (Box Set, Bundle)
       - Ultra-raros de evento: (Metal), (Prize Wall), (Champion), (Top 8)
  3. Cada promo se cruza con la carta BASE (por número de coleccionista + set,
     leído del campo "Number" tipo "246b/298") para tomar la IMAGEN de Riot
     (el CDN de TCGplayer bloquea hotlinking) y su data rica (efecto/atributos
     los pone make_cartas.py al cruzar por image_url).
  4. Precio: market USD (foil si es foil-only, si no normal) x 520 + redondeo
     escalonado del proyecto. Los promos casi todos son foil-only -> en nuestro
     modelo eso es solo `price` (sin campo `foil`, igual que Rare/Epic/Showcase).
  5. Los agrega a productos.json como set "Promos", type single, stock 0
     (agotado: aparecen en el panel para subirles cantidad; se ven en la tienda
     cuando pongas stock).

Uso:
  python make_promos_rb.py            -> solo reporta (NO toca productos.json)
  python make_promos_rb.py --aplicar  -> agrega los promos a productos.json (backup)

Después de --aplicar hay que correr:  python make_cartas.py   (fichas + sitemap)
"""
import json, os, re, sys, csv, glob, math, time, urllib.request, unicodedata
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.join(ROOT, "productos.json")
RATE = 520
CAT_RB = 89
PROMO_GROUPS = {24528: "Organized Play", 24552: "Judge", 24343: "Promotional"}
EXCLUIR = ("(Metal)", "(Prize Wall)", "(Champion)", "(Top 8)")
SELLADO = ("Box Set", "Bundle")
# denominador del número ("xxx/298") -> set base para tomar imagen/data de Riot
DENOM_SET = {"298": "Origins", "219": "Unleashed", "221": "Spiritforged",
             "24": "Proving Grounds", "024": "Proving Grounds"}


def round_crc(usd):
    if not usd or usd <= 0:
        return 100
    raw = usd * RATE
    def ceil_to(x, s): return int(math.ceil(x / s) * s)
    if raw <= 100:   return 100
    if raw < 5000:   return max(100, ceil_to(raw, 100))
    if raw < 20000:  return ceil_to(raw, 500)
    if raw < 100000: return ceil_to(raw, 1000)
    return ceil_to(raw, 5000)


def _get(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "reroll-promos/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))["results"]
        except Exception:
            if attempt == 2: raise
            time.sleep(2)


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def load_base_index():
    """(set_name, collector_number) -> lista de filas base (sin Showcase si hay
    versión normal). Varias cartas pueden compartir número (Unleashed recicla
    numeración) -> se guarda lista y luego se desambigua por nombre."""
    idx = {}
    for f in glob.glob(os.path.join(ROOT, "Riftbound_Cards", "*", "*_cards.csv")):
        for r in csv.DictReader(open(f, encoding="utf-8-sig")):
            idx.setdefault((r["set_name"], r["collector_number"]), []).append(r)
    # por cada número: si hay versión no-Showcase, descartar las Showcase
    for k, rows in idx.items():
        no_sc = [r for r in rows if r.get("rarity") != "Showcase"]
        idx[k] = no_sc or rows
    return idx


def ext(prod, name):
    for e in prod.get("extendedData", []):
        if e.get("name") == name:
            return e.get("value")
    return None


def base_num(n):
    """'246b' -> '246' ; '001' -> '1' ; '118a' -> '118'."""
    n = re.sub(r"[a-z]+$", "", (n or "").strip())     # sufijo de variante promo
    n = n.lstrip("0") or "0"                            # sin zero-padding (CSV usa '1')
    return n


def img_de_promo(prod, base_idx):
    num = ext(prod, "Number") or ""
    if "/" not in num:
        return None
    N, D = num.rsplit("/", 1)
    st = DENOM_SET.get(D.strip())
    if not st:
        return None
    rows = base_idx.get((st, base_num(N)))
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0]["image_url"]
    # varias cartas comparten número -> elegir por solape de palabras con el nombre
    promo_words = set(_norm(re.sub(r"\s*\(.*?\)", "", prod["name"])).split())
    best, best_score = rows[0], -1
    for r in rows:
        score = len(promo_words & set(_norm(r["name"]).split()))
        if score > best_score:
            best, best_score = r, score
    return best["image_url"]


def main():
    aplicar = "--aplicar" in sys.argv
    base_idx = load_base_index()
    productos = json.load(open(PROD, encoding="utf-8"))
    ya = {(p.get("name"), p.get("set")) for p in productos}
    next_id = max(p["id"] for p in productos) + 1

    nuevos, sin_precio, sin_imagen, duplicados = [], [], [], []
    for gid, label in PROMO_GROUPS.items():
        prods = _get(f"https://tcgcsv.com/tcgplayer/{CAT_RB}/{gid}/products")
        prices = _get(f"https://tcgcsv.com/tcgplayer/{CAT_RB}/{gid}/prices")
        pmap = {}
        for pr in prices:
            pmap.setdefault(pr["productId"], {})[pr["subTypeName"]] = pr.get("marketPrice")
        for p in prods:
            name = p["name"]
            if any(x in name for x in EXCLUIR) or any(x in name for x in SELLADO):
                continue
            pp = pmap.get(p["productId"], {})
            usd = pp.get("Foil") or pp.get("Normal")   # promos casi todos foil-only
            if not usd:
                sin_precio.append(name); continue
            img = img_de_promo(p, base_idx)
            if not img:
                sin_imagen.append(f"{name} [{ext(p,'Number')}]"); continue
            if (name, "Promos") in ya:
                duplicados.append(name); continue
            nuevos.append({
                "id": next_id, "name": name, "cat": "Riftbound", "type": "single",
                "set": "Promos", "price": round_crc(usd), "cond": "Near Mint",
                "stock": 0, "img": img, "badge": "Promo",   # distingue del arte base en la tienda
            })
            ya.add((name, "Promos"))
            next_id += 1

    # ---- reporte ----
    nuevos.sort(key=lambda x: -x["price"])
    print(f"\n=== PROMOS RIFTBOUND — {'APLICANDO' if aplicar else 'DRY-RUN (no escribe)'} ===")
    print(f"nuevos a agregar : {len(nuevos)}")
    print(f"ya en inventario : {len(duplicados)}")
    print(f"sin precio (skip): {len(sin_precio)}")
    print(f"sin imagen (skip): {len(sin_imagen)}")
    print("\n-- top 15 por precio --")
    for p in nuevos[:15]:
        print(f"  ₡{p['price']:>8,}  {p['name']}")
    print("\n-- 5 más baratos --")
    for p in nuevos[-5:]:
        print(f"  ₡{p['price']:>8,}  {p['name']}")
    if sin_imagen:
        print(f"\n-- sin imagen (no se agregan) --")
        for x in sin_imagen: print("  -", x)
    if sin_precio:
        print(f"\n-- sin precio (no se agregan) --")
        for x in sin_precio: print("  -", x)

    if not aplicar:
        print("\n(dry-run) corré con --aplicar para agregarlos a productos.json")
        return
    # backup + escribir con el MISMO formato (indent=2, utf-8)
    import shutil
    shutil.copy(PROD, os.path.join(ROOT, "productos_backup_promos.json"))
    productos.extend(nuevos)
    json.dump(productos, open(PROD, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\nOK · {len(nuevos)} promos agregados a productos.json (backup: productos_backup_promos.json)")
    print("AHORA correr:  python make_cartas.py")


if __name__ == "__main__":
    main()
