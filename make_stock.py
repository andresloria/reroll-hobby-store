# -*- coding: utf-8 -*-
"""
make_stock.py — separa el STOCK de productos.json a data/stock.json.

POR QUÉ EXISTE
--------------
Al confirmar un pedido, la API leía y REESCRIBÍA productos.json entero
(1,6 MB → PUT de 2,1 MB en base64) contra el límite de 10 s de Vercel:
tardaba 6-12 s y a veces se cortaba. Con el stock aparte, confirmar
escribe ~66 KB y el tiempo deja de depender de cuántas cartas haya.

FORMATO
-------
    {"<id>": [stock, stockf]}      stockf = null si la carta no tiene foil

REGLA QUE NO SE NEGOCIA: stockf null/ausente = foil AGOTADO (0). Nunca
hereda el stock normal (eso creaba "foils fantasma" vendibles que no
existen físicamente).

USO
---
    python make_stock.py            # regenera data/stock.json desde productos.json
    python make_stock.py --limpiar  # además QUITA stock/stockf de productos.json
    python make_stock.py --verificar # solo compara ambos archivos, no escribe
"""
import json, os, sys, shutil

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.join(ROOT, "productos.json")
STOCK = os.path.join(ROOT, "data", "stock.json")


def leer_prod():
    with open(PROD, encoding="utf-8") as f:
        return json.load(f)


def leer_stock_actual():
    if not os.path.exists(STOCK):
        return {}
    with open(STOCK, encoding="utf-8") as f:
        return json.load(f)


def construir(prod, previo):
    """productos.json + el stock ACTUAL -> dict {id: [stock, stockf]}

    Precedencia, en este orden:
      1. Si productos.json todavía trae `stock` (solo en la migración inicial),
         ese valor manda.
      2. Si la carta ya tiene entrada en stock.json, se RESPETA tal cual.
         (Acá vive el stock real: el script nunca lo pisa.)
      3. Carta nueva -> 0. Nunca null.

    ⚠️ `stock` siempre es un número. `null` significaba "ilimitado" y ya no se
    usa: una regeneración descuidada dejaba TODO el catálogo en ilimitado y
    vendible. `stockf` sí puede ser null = la carta no tiene variante foil.
    """
    out = {}
    for p in prod:
        k = str(p["id"])
        ant = previo.get(k)
        # --- stock normal ---
        if "stock" in p and p["stock"] not in (None, ""):
            s = int(p["stock"])
        elif ant is not None and ant[0] is not None:
            s = int(ant[0])
        else:
            s = 0
        # --- stock foil: solo existe si la carta tiene precio foil ---
        tiene_foil = p.get("foil") is not None
        if "stockf" in p and p["stockf"] not in (None, ""):
            f = int(p["stockf"])
        elif ant is not None and len(ant) > 1 and ant[1] is not None:
            f = int(ant[1])
        else:
            f = 0 if tiene_foil else None
        out[k] = [s, f]
    return out


def escribir(stock):
    os.makedirs(os.path.dirname(STOCK), exist_ok=True)
    # separators compactos: es un archivo de máquina, no se lee a mano
    with open(STOCK, "w", encoding="utf-8") as f:
        json.dump(stock, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        f.write("\n")


def main():
    prod = leer_prod()
    previo = leer_stock_actual()
    nuevo = construir(prod, previo)

    if "--verificar" in sys.argv:
        if not os.path.exists(STOCK):
            print("data/stock.json no existe todavía"); return 1
        actual = leer_stock_actual()
        faltan = [k for k in nuevo if k not in actual]
        sobran = [k for k in actual if k not in nuevo]
        print(f"productos.json: {len(nuevo)} cartas · stock.json: {len(actual)} entradas")
        print(f"  sin entrada de stock: {len(faltan)}   entradas huérfanas: {len(sobran)}")
        if faltan: print("   ⚠ primeras sin stock:", faltan[:8])
        if sobran: print("   ⚠ primeras huérfanas:", sobran[:8])
        return 0 if not (faltan or sobran) else 1

    # RED DE SEGURIDAD: avisar (y no escribir) si esto le bajaría el stock a
    # cartas que hoy lo tienen. Regenerar mal ya dejó una vez todo el catálogo
    # en "ilimitado"; que nunca vuelva a pasar en silencio.
    perdidas = [k for k, v in previo.items()
                if v[0] and k in nuevo and (nuevo[k][0] or 0) < v[0]]
    if perdidas and "--forzar" not in sys.argv:
        print(f"⚠️  ABORTADO: {len(perdidas)} carta(s) perderían stock. Ejemplos:")
        for k in perdidas[:6]:
            print(f"     id {k}: {previo[k][0]} → {nuevo[k][0]}")
        print("   Si de verdad querés eso, corré con --forzar.")
        return 1

    nuevas = [k for k in nuevo if k not in previo]
    escribir(nuevo)
    kb = os.path.getsize(STOCK) / 1024
    print(f"data/stock.json escrito: {len(nuevo)} entradas · {kb:.0f} KB"
          + (f" · {len(nuevas)} carta(s) nuevas en 0" if nuevas else ""))
    print(f"  unidades: {sum(int(v[0] or 0) for v in nuevo.values())} normal · "
          f"{sum(int(v[1] or 0) for v in nuevo.values())} foil")

    if "--limpiar" in sys.argv:
        shutil.copy(PROD, os.path.join(ROOT, "productos_backup_stock_split.json"))
        quitados = 0
        for p in prod:
            if p.pop("stock", None) is not None: quitados += 1
            p.pop("stockf", None)
        with open(PROD, "w", encoding="utf-8") as f:
            json.dump(prod, f, ensure_ascii=False, indent=2)
            f.write("\n")
        mb = os.path.getsize(PROD) / 1024 / 1024
        print(f"productos.json: stock/stockf quitados de {quitados} cartas → {mb:.2f} MB "
              f"(backup en productos_backup_stock_split.json)")


if __name__ == "__main__":
    sys.exit(main() or 0)
