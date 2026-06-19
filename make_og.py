# Genera assets/og-image.jpg (1200x630) para Open Graph: fondo de marca + dado mascota real.
#
# Requiere Pillow (pip install Pillow) y la fuente Archivo Black en el directorio:
#   curl -sL -o archivoblack.ttf \
#     "https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf"
# Luego: python make_og.py
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
DEEP   = (74, 13, 20)     # vino profundo
GLOW   = (140, 27, 45)    # vino claro (brillo)
CREAM  = (250, 246, 239)
GOLD   = (232, 199, 122)
GOLDD  = (201, 162, 75)
BODY   = (240, 227, 214)
INK    = (42, 26, 8)

AB   = "archivoblack.ttf"
ARI  = "C:/Windows/Fonts/arial.ttf"
ARIB = "C:/Windows/Fonts/arialbd.ttf"
def font(p, s): return ImageFont.truetype(p, s)

# --- fondo: gradiente radial vino (brillo arriba-derecha) ---
try:
    import numpy as np
    yy, xx = np.mgrid[0:H, 0:W].astype("float32")
    cx, cy = W * 0.85, H * 0.20
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / math.hypot(W, H)
    t = np.clip(1.0 - d * 1.45, 0, 1)[..., None]
    base = (np.array(DEEP) * (1 - t) + np.array(GLOW) * t).astype("uint8")
    img = Image.fromarray(base, "RGB")
except Exception:
    img = Image.new("RGB", (W, H), DEEP)
draw = ImageDraw.Draw(img)

# --- halo dorado detrás del dado ---
halo = Image.new("L", (W, H), 0)
hd = ImageDraw.Draw(halo)
hcx, hcy, hr = int(W * 0.81), int(H * 0.50), 250
hd.ellipse([hcx - hr, hcy - hr, hcx + hr, hcy + hr], fill=110)
halo = halo.filter(ImageFilter.GaussianBlur(70))
gold_layer = Image.new("RGB", (W, H), GOLD)
img = Image.composite(gold_layer, img, halo)
draw = ImageDraw.Draw(img)

# --- borde dorado interior ---
draw.rounded_rectangle([14, 14, W - 14, H - 14], radius=14, outline=(232, 199, 122), width=2)

def tracked(d, xy, text, fnt, fill, track):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill, anchor="la")
        x += d.textlength(ch, font=fnt) + track

# --- dado mascota (logo real) ---
dado = Image.open("assets/logo.png").convert("RGBA")
dh = 460
dw = int(dado.width * dh / dado.height)
dado = dado.resize((dw, dh), Image.LANCZOS)
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
dx, dy = int(W * 0.81 - dw / 2), int(H * 0.52 - dh / 2)
sd.ellipse([dx + 30, dy + dh - 60, dx + dw - 30, dy + dh + 30], fill=(0, 0, 0, 90))
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
img.paste(shadow, (0, 0), shadow)
img.paste(dado, (dx, dy), dado)

# --- texto izquierda ---
x0 = 84
# dos puntos dorados + eyebrow
draw.ellipse([x0, 132, x0 + 13, 145], fill=GOLD)
draw.ellipse([x0 + 20, 132, x0 + 33, 145], fill=GOLD)
tracked(draw, (x0 + 46, 130), "CARTAGO · COSTA RICA", font(ARIB, 20), GOLD, 5)
# REROLL
draw.text((x0 - 2, 168), "REROLL", font=font(AB, 138), fill=CREAM, anchor="la")
# HOBBY STORE
tracked(draw, (x0, 318), "HOBBY STORE", font(AB, 46), GOLD, 6)
# tagline
draw.text((x0, 392), "Singles & sellado · Tu tienda TCG en Cartago",
          font=font(ARI, 30), fill=BODY, anchor="la")

# --- chips de juegos ---
chips = [("Pokémon", True), ("Magic", False), ("Yu-Gi-Oh", False),
         ("One Piece", False), ("Riftbound", False)]
cf = font(ARIB, 23)
cx = x0
cy = 452
for name, filled in chips:
    tw = draw.textlength(name, font=cf)
    w = tw + 34
    box = [cx, cy, cx + w, cy + 44]
    if filled:
        draw.rounded_rectangle(box, radius=22, fill=GOLD)
        draw.text((cx + 17, cy + 22), name, font=cf, fill=INK, anchor="lm")
    else:
        draw.rounded_rectangle(box, radius=22, outline=(232, 199, 122, 160), width=2)
        draw.text((cx + 17, cy + 22), name, font=cf, fill=BODY, anchor="lm")
    cx += w + 12

img.convert("RGB").save("assets/og-image.jpg", "JPEG", quality=88, optimize=True)
print("OK -> assets/og-image.jpg", img.size)
