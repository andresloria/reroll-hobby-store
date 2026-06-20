# Genera assets/favicon.png (180x180) a partir del dado mascota (assets/logo.png):
# dado sobre placa vino redondeada. Sirve como favicon y como apple-touch-icon.
from PIL import Image, ImageDraw

src = Image.open("assets/logo.png").convert("RGBA")
src = src.crop(src.getbbox())   # recorta el margen transparente

S = 180
def fit(im, box):
    w, h = im.size
    sc = box / max(w, h)
    return im.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)

out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(out).rounded_rectangle([0, 0, S - 1, S - 1], radius=40, fill=(110, 20, 35, 255))  # vino #6E1423
d = fit(src, int(S * 0.78))
out.paste(d, ((S - d.width) // 2, (S - d.height) // 2), d)
out.save("assets/favicon.png")
print("OK -> assets/favicon.png", out.size)
