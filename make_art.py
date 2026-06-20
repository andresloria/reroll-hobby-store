# Optimiza las 5 artes de assets/arts/ para los paneles "Trabajamos con":
# las pasa a webp, tamano justo (cabe en 600x1200), calidad 80.
import os
from PIL import Image

SRC = {
    "one-piece": "OnePiece.png",
    "riftbound": "Riftbound.jpg",
    "pokemon":   "Pokemon.jpeg",
    "magic":     "Magic.webp",
    "yugioh":    "yugioh.webp",
}
d = "assets/arts"
BOX = (600, 1200)

for slug, fname in SRC.items():
    p = os.path.join(d, fname)
    im = Image.open(p).convert("RGB")
    im.thumbnail(BOX, Image.LANCZOS)   # solo achica, mantiene proporcion
    out = os.path.join(d, slug + ".webp")
    im.save(out, "WEBP", quality=80, method=6)
    print(f"{slug:11} {im.size[0]}x{im.size[1]}  {os.path.getsize(out)//1024}KB  <- {fname}")
