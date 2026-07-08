# -*- coding: utf-8 -*-
"""
check_precios.py — RUTINA DE PRECIOS: compara el inventario de Reroll contra
los precios frescos de TCGplayer (vía TCGCSV) y avisa cuáles cartas cambiaron.

Qué hace:
  1. Baja precios FRESCOS de TCGplayer (One Piece + Riftbound). No usa cache de
     precios (los precios cambian a diario); sí cachea grupos/productos.
  2. Cruza cada carta de productos.json contra su precio actual de mercado:
       - One Piece: por product ID exacto (viene en la URL de la imagen).
       - Riftbound: por nombre + set (maneja campeones "Ahri - Nine-Tailed Fox").
         Si el cruce es ambiguo -> NO adivina, lo manda a "revisar manual".
  3. Aplica la MISMA conversión del proyecto: market USD x 520 + redondeo escalonado.
  4. Escribe un reporte ordenado (mayor subida primero):
       reporte_precios.md   (legible, para abrir y decidir)
       reporte_precios.csv  (para Excel / editar en lote)

Uso:
  python check_precios.py            -> solo reporta (NO toca productos.json)
  python check_precios.py --aplicar  -> además actualiza productos.json (con backup)
  python check_precios.py --min 500  -> ignora cambios menores a ₡500 en el reporte

Seguridad: --aplicar NUNCA hace push. Deja backup productos_backup_precios.json.
"""
import json, os, re, sys, math, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
RATE = 520
CACHE = os.path.join(ROOT, "catalogo", "_cache")

GAMES = {"one-piece": 68, "riftbound": 89}

# ---- redondeo escalonado del proyecto (idéntico a make_catalogo.py) ----------
def round_crc(usd):
    if not usd or usd <= 0: return 100
    raw = usd * RATE
    def ceil_to(x, s): return int(math.ceil(x / s) * s)
    if raw <= 100:   return 100
    if raw < 5000:   return max(100, ceil_to(raw, 100))
    if raw < 20000:  return ceil_to(raw, 500)
    if raw < 100000: return ceil_to(raw, 1000)
    return ceil_to(raw, 5000)

# ---- fetch: grupos/productos con cache; precios SIEMPRE frescos --------------
def _get(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "reroll-precios/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == 2: raise
            time.sleep(2)

def fetch_cached(url, key):
    os.makedirs(CACHE, exist_ok=True)
    fp = os.path.join(CACHE, key + ".json")
    if os.path.exists(fp):
        with open(fp, encoding="utf-8") as f: return json.load(f)
    data = _get(url)
    with open(fp, "w", encoding="utf-8") as f: json.dump(data, f)
    return data

def results(d): return d.get("results", d) if isinstance(d, dict) else d

def norm(s): return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()

# ---- construye el índice de precios frescos por juego -----------------------
def build_price_index():
    """Devuelve:
       by_pid[pid]  = {"normal": usd|None, "foil": usd|None, "name":.., "set":..}
       rb_name[key] = pid   (para cruzar Riftbound por nombre; key = (norm_name, norm_set) o epíteto)
    """
    by_pid = {}
    rb_name = {}          # (norm_name, norm_set) -> [pids]
    rb_epi  = {}          # epíteto (parte tras ' - ') -> {(norm_epi,norm_set): [pids]}
    rb_all  = {}          # norm_name -> [pids]  (fallback global, solo si es único)
    for key, cat in GAMES.items():
        groups = results(fetch_cached(f"https://tcgcsv.com/tcgplayer/{cat}/groups", f"{key}_groups"))
        print(f"[{key}] {len(groups)} sets — bajando precios frescos…")
        for g in groups:
            gid = g["groupId"]; setn = g["name"]
            prods  = results(fetch_cached(f"https://tcgcsv.com/tcgplayer/{cat}/{gid}/products", f"{key}_{gid}_p"))
            prices = results(_get(f"https://tcgcsv.com/tcgplayer/{cat}/{gid}/prices"))  # FRESCO
            pm = {}
            for pr in prices:
                mp = pr.get("marketPrice")
                if mp is None: continue
                pm.setdefault(pr["productId"], {})[pr["subTypeName"]] = mp
            for p in prods:
                pid = p["productId"]; name = p["name"]
                is_single = bool(p.get("extendedData"))
                subs = pm.get(pid, {})
                by_pid[pid] = {"normal": subs.get("Normal"), "foil": subs.get("Foil"),
                               "name": name, "set": setn, "single": is_single}
                if key == "riftbound" and is_single:
                    variant = "(" in name  # (Signature)/(Overnumbered)/(Metal)/(Alternate Art)…
                    rb_name.setdefault((norm(name), norm(setn)), []).append(pid)
                    if not variant:
                        rb_all.setdefault(norm(name), []).append(pid)
                    if " - " in name and not variant:
                        epi = name.split(" - ", 1)[1]
                        rb_epi.setdefault((norm(epi), norm(setn)), []).append(pid)
                        rb_all.setdefault(norm(epi), []).append(pid)
    return by_pid, rb_name, rb_epi, rb_all

# ---- resolver el pid de una carta de productos.json -------------------------
def resolve_pid(item, rb_name, rb_epi, rb_all):
    """Devuelve (pid, motivo). pid=None si no se pudo cruzar con confianza."""
    img = item.get("img", "") or ""
    m = re.search(r"/product/(\d+)_", img)
    if m:
        return int(m.group(1)), "id"          # One Piece (y cualquier carta con img de tcgplayer)
    # Riftbound: cruce por nombre + set
    nm, st = norm(item.get("name", "")), norm(item.get("set", ""))
    cands = rb_name.get((nm, st), [])
    if len(cands) == 1: return cands[0], "nombre+set"
    if len(cands) > 1:  return None, "ambiguo(nombre+set)"
    cands = rb_epi.get((nm, st), [])          # campeón por epíteto ("Nine-Tailed Fox")
    if len(cands) == 1: return cands[0], "epíteto"
    if len(cands) > 1:  return None, "ambiguo(epíteto)"
    cands = list(set(rb_all.get(nm, [])))     # fallback: nombre único en todo el juego (set distinto)
    if len(cands) == 1: return cands[0], "nombre-global"
    return None, "sin-cruce"

def main():
    args = sys.argv[1:]
    aplicar = "--aplicar" in args or "--aplicar-subidas" in args
    solo_subidas = "--aplicar-subidas" in args   # aplica solo las que subieron (no baja precios)
    mind = 0
    if "--min" in args:
        try: mind = int(args[args.index("--min") + 1])
        except Exception: pass

    prod = json.load(open(os.path.join(ROOT, "productos.json"), encoding="utf-8"))
    by_pid, rb_name, rb_epi, rb_all = build_price_index()

    subidas, bajadas, sincruce, sinprecio = [], [], [], []
    for it in prod:
        if it.get("cat") not in ("One Piece", "Riftbound"): continue
        if it.get("type") and it["type"] != "single": continue
        pid, motivo = resolve_pid(it, rb_name, rb_epi, rb_all)
        if pid is None:
            sincruce.append((it, motivo)); continue
        px = by_pid.get(pid)
        if not px or (px["normal"] is None and px["foil"] is None):
            sinprecio.append((it, motivo)); continue
        base = px["normal"] if px["normal"] else px["foil"]
        new_price = round_crc(base)
        old_price = it.get("price", 0)
        row = {"id": it["id"], "name": it["name"], "cat": it["cat"], "set": it.get("set", ""),
               "campo": "price", "old": old_price, "new": new_price, "motivo": motivo}
        if new_price != old_price:
            (subidas if new_price > old_price else bajadas).append(row)
        # variante foil (si la carta tiene precio foil en el inventario)
        if it.get("foil") is not None and px["foil"]:
            nf, of = round_crc(px["foil"]), it["foil"]
            if nf != of:
                r2 = {"id": it["id"], "name": it["name"], "cat": it["cat"], "set": it.get("set", ""),
                      "campo": "foil", "old": of, "new": nf, "motivo": motivo}
                (subidas if nf > of else bajadas).append(r2)

    # filtro de ruido
    def big(r): return abs(r["new"] - r["old"]) >= mind
    subidas = sorted([r for r in subidas if big(r)], key=lambda r: r["new"] - r["old"], reverse=True)
    bajadas = sorted([r for r in bajadas if big(r)], key=lambda r: r["old"] - r["new"], reverse=True)

    # ---- reporte legible ----
    def pct(r):
        return f"+{round((r['new']-r['old'])/r['old']*100)}%" if r["old"] else "—"
    lines = ["# Reporte de precios — Reroll vs TCGplayer",
             f"_Generado: {time.strftime('%Y-%m-%d %H:%M')} · tipo de cambio ₡{RATE}/USD_", "",
             f"- **{len(subidas)} subieron** · {len(bajadas)} bajaron · "
             f"{len(sincruce)} sin cruce automático · {len(sinprecio)} sin precio de referencia", ""]
    if subidas:
        lines += ["## ⬆️ Subieron (revisar para actualizar)", "",
                  "| id | carta | set | campo | actual | TCGplayer | dif |",
                  "|---|---|---|---|--:|--:|--:|"]
        for r in subidas:
            lines.append(f"| {r['id']} | {r['name']} | {r['set']} | {r['campo']} | "
                         f"₡{r['old']:,} | ₡{r['new']:,} | +₡{r['new']-r['old']:,} ({pct(r)}) |")
        lines.append("")
    if bajadas:
        lines += ["## ⬇️ Bajaron (opcional, para no quedar caro)", "",
                  "| id | carta | set | campo | actual | TCGplayer | dif |",
                  "|---|---|---|---|--:|--:|--:|"]
        for r in bajadas:
            lines.append(f"| {r['id']} | {r['name']} | {r['set']} | {r['campo']} | "
                         f"₡{r['old']:,} | ₡{r['new']:,} | -₡{r['old']-r['new']:,} |")
        lines.append("")
    if sincruce:
        lines += [f"## ❓ Sin cruce automático ({len(sincruce)}) — revisar a mano", ""]
        for it, mot in sincruce[:60]:
            lines.append(f"- {it['name']} · {it.get('set','')} · ({mot})")
        if len(sincruce) > 60: lines.append(f"- …y {len(sincruce)-60} más")
        lines.append("")
    open(os.path.join(ROOT, "reporte_precios.md"), "w", encoding="utf-8").write("\n".join(lines))

    # ---- CSV ----
    import csv
    with open(os.path.join(ROOT, "reporte_precios.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id", "carta", "juego", "set", "campo", "precio_actual", "precio_tcgplayer", "diferencia", "estado"])
        for r in subidas: w.writerow([r["id"], r["name"], r["cat"], r["set"], r["campo"], r["old"], r["new"], r["new"]-r["old"], "subio"])
        for r in bajadas: w.writerow([r["id"], r["name"], r["cat"], r["set"], r["campo"], r["old"], r["new"], r["new"]-r["old"], "bajo"])

    print("\n=== RESUMEN ===")
    print(f"  Subieron: {len(subidas)}   Bajaron: {len(bajadas)}   "
          f"Sin cruce: {len(sincruce)}   Sin precio: {len(sinprecio)}")
    if subidas:
        print("  Top subidas:")
        for r in subidas[:10]:
            print(f"    #{r['id']} {r['name'][:34]:34} {r['set'][:16]:16} "
                  f"{r['old']:>7} -> {r['new']:>7}  (+{r['new']-r['old']})")
    print("  Reporte: reporte_precios.md  /  reporte_precios.csv")

    # ---- aplicar (opcional, con backup, NUNCA push) ----
    if aplicar:
        aplica = subidas if solo_subidas else (subidas + bajadas)
        if not aplica:
            print("  Nada que aplicar."); return
        json.dump(prod, open(os.path.join(ROOT, "productos_backup_precios.json"), "w", encoding="utf-8"),
                  ensure_ascii=False)
        by_id = {p["id"]: p for p in prod}
        changed = 0
        for r in aplica:
            p = by_id.get(r["id"])
            if p is not None:
                p[r["campo"]] = r["new"]; changed += 1
        json.dump(prod, open(os.path.join(ROOT, "productos.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)  # mismo formato indentado del inventario
        print(f"  APLICADO ({'solo subidas' if solo_subidas else 'subidas+bajadas'}): "
              f"{changed} precios actualizados en productos.json "
              f"(backup en productos_backup_precios.json).")
        print("  Nota: las fichas re-hidratan precio desde productos.json (no requiere rebuild). Push manual para publicar.")

if __name__ == "__main__":
    main()
