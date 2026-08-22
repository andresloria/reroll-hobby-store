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


def construir(prod):
    """productos.json -> dict {id: [stock, stockf]}"""
    out = {}
    for p in prod:
        s = p.get("stock")
        f = p.get("stockf")
        if s in ("",): s = None
        if f in ("",): f = None
        out[str(p["id"])] = [s, None if f is None else int(f)]
    return out


def escribir(stock):
    os.makedirs(os.path.dirname(STOCK), exist_ok=True)
    # separators compactos: es un archivo de máquina, no se lee a mano
    with open(STOCK, "w", encoding="utf-8") as f:
        json.dump(stock, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        f.write("\n")


def main():
    prod = leer_prod()
    nuevo = construir(prod)

    if "--verificar" in sys.argv:
        if not os.path.exists(STOCK):
            print("data/stock.json no existe todavía"); return 1
        actual = json.load(open(STOCK, encoding="utf-8"))
        faltan = [k for k in nuevo if k not in actual]
        sobran = [k for k in actual if k not in nuevo]
        print(f"productos.json: {len(nuevo)} cartas · stock.json: {len(actual)} entradas")
        print(f"  sin entrada de stock: {len(faltan)}   entradas huérfanas: {len(sobran)}")
        if faltan: print("   ⚠ primeras sin stock:", faltan[:8])
        if sobran: print("   ⚠ primeras huérfanas:", sobran[:8])
        return 0 if not (faltan or sobran) else 1

    escribir(nuevo)
    kb = os.path.getsize(STOCK) / 1024
    print(f"data/stock.json escrito: {len(nuevo)} entradas · {kb:.0f} KB")

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
