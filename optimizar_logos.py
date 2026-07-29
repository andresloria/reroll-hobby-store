# -*- coding: utf-8 -*-
"""optimizar_logos.py — reescala los logos de juego (tiles) y la marca.

Por qué: los tiles se servían a 640-1001 px de ancho pero se muestran a 124-324 px
(pokemon-tile.png pesaba 102 KB para verse a 124x46). Lighthouse lo marca en
"properly size images" y castiga Performance.

Ancho objetivo 480 px = nítido incluso en pantallas retina (el tile más grande se
ve a 324 px) y una fracción del peso. Sale WebP, que en estos logos con
transparencia rinde mucho mejor que PNG.

Uso:  python optimizar_logos.py          -> solo reporta
      python optimizar_logos.py --aplicar -> escribe los archivos
⚠️ Después de aplicar hay que actualizar `logoLight` y lw/lh en js/app.js.
"""
import io, os, sys
from PIL import Image

APLICAR = "--aplicar" in sys.argv
ROOT = os.path.dirname(os.path.abspath(__file__))

# origen -> (destino, ancho objetivo)
OBJETIVOS = {
    "assets/logos/pokemon-tile.png":   ("assets/logos/pokemon-tile.webp",   480),
    "assets/logos/riftbound-tile.png": ("assets/logos/riftbound-tile.webp", 480),
    "assets/logos/weiss-tile.png":     ("assets/logos/weiss-tile.webp",     480),
    "assets/logos/one-piece-tile.png": ("assets/logos/one-piece-tile.webp", 480),
    "assets/logos/magic-tile.png":     ("assets/logos/magic-tile.webp",     480),
    "assets/logos/yugioh-tile.webp":   ("assets/logos/yugioh-tile.webp",    480),  # ya es webp: se reescala
    "assets/logo.webp":                ("assets/logo.webp",                 160),  # marca: se ve a 42-66 px
}

ant = nue = 0
finales = {}
print(f"{'archivo':34} {'antes':>9}  {'después':>9}   dimensiones")
for src, (dst, w) in OBJETIVOS.items():
    fp = os.path.join(ROOT, src)
    if not os.path.exists(fp):
        print(f"  falta {src}"); continue
    a = os.path.getsize(fp) / 1024
    with Image.open(fp) as im:
        im = im.convert("RGBA")
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        dim = f"{im.width}x{im.height}"
        # se prueban los dos formatos y gana el más liviano: en logos planos
        # (pocos colores) el PNG optimizado a veces le gana al WebP
        cand = {}
        b = io.BytesIO(); im.save(b, "WEBP", quality=88, method=6)
        cand[os.path.splitext(dst)[0] + ".webp"] = b.getvalue()
        b = io.BytesIO(); im.save(b, "PNG", optimize=True)
        cand[os.path.splitext(dst)[0] + ".png"] = b.getvalue()
    ruta, data = min(cand.items(), key=lambda kv: len(kv[1]))
    n = len(data) / 1024
    if n >= a:                       # nada que ganar: se deja como está
        print(f"  {src:32} {a:>7.0f} KB   (ya óptimo, se deja)")
        ant += a; nue += a; finales[src] = (src, im.width, im.height)
        continue
    ant += a; nue += n
    print(f"  {src:32} {a:>7.0f} KB -> {n:>7.0f} KB   {dim}  -> {os.path.basename(ruta)}")
    finales[src] = (ruta, im.width, im.height)
    if APLICAR:
        with open(os.path.join(ROOT, ruta), "wb") as f:
            f.write(data)
        if ruta != src and os.path.exists(os.path.join(ROOT, src)):
            os.remove(os.path.join(ROOT, src))   # el viejo ya no se usa

print(f"  {'TOTAL':32} {ant:>7.0f} KB -> {nue:>7.0f} KB   ahorro {ant-nue:.0f} KB ({100*(ant-nue)/ant:.0f}%)")
print("\nPara js/app.js (logoLight + lw/lh):")
for src, (ruta, w, h) in finales.items():
    if "tile" in src: print(f'   logoLight:"{ruta}", lw:{w}, lh:{h}')
print("\nAPLICADO" if APLICAR else "\n(dry-run: no se escribió nada)")
