#!/usr/bin/env python3
"""
Logo sin fondo para la ficha de producto — HOMEA

Regla (Carla, 2026-10-23): en las páginas de producto TODA marca de la tienda va
sin fondo. Este script deja public/assets/logos/ficha/<slug>.webp a partir de un
logo de la marca (de preferencia el PNG transparente de OneDrive
"DISEÑO 2026/Logos Marcas png"):

  - Con transparencia: solo se recorta al trazo.
  - Sobre fondo blanco: el blanco se vuelve transparente (bordes suaves, sin
    halo) y se recorta. Las tintas fuertes (rojo Bosch, negro) quedan opacas.
  - Sobre fondo oscuro (p. ej. el Gaggenau blanco sobre negro): se rechaza;
    hay que conseguir la versión en negro o a color.

Después: dar su alto en styles/theme.css (.pdp-logo[data-marca="<slug>"]) para
que quede a la par de las demás marcas y revisar la ficha.

Uso:  python3 scripts/logo-ficha.py <slug> <archivo-de-logo> [alto_px=160]
"""
import sys
from PIL import Image

if len(sys.argv) < 3:
    sys.exit(__doc__)
slug, fuente = sys.argv[1], sys.argv[2]
alto = int(sys.argv[3]) if len(sys.argv) > 3 else 160

im = Image.open(fuente).convert("RGBA")
alfa = im.getchannel("A")
transparente = alfa.getextrema()[0] < 250

if not transparente:
    rgb = im.convert("RGB")
    w, h = rgb.size
    esquinas = [rgb.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
    if any(sum(c) / 3 < 200 for c in esquinas):
        sys.exit(f"{fuente}: el fondo no es blanco. Busca la versión transparente, en negro o a color.")
    # Distancia al blanco -> opacidad, con rampa corta para que las tintas queden
    # opacas; el color se des-premultiplica contra blanco para no dejar halo.
    RAMPA = 48
    px = []
    for r, g, b in rgb.getdata():
        d = max(255 - r, 255 - g, 255 - b)
        if d < 6:
            px.append((0, 0, 0, 0))
            continue
        a = min(255, round(d * 255 / RAMPA))
        f = d / 255
        color = tuple(max(0, min(255, round((c - 255 * (1 - f)) / f))) for c in (r, g, b))
        px.append(color + (a,))
    im = Image.new("RGBA", rgb.size)
    im.putdata(px)

caja = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
im = im.crop(caja)
if im.height > alto:
    im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
destino = f"public/assets/logos/ficha/{slug}.webp"
im.save(destino, "WEBP", quality=90, method=6)
print(f"{destino}: {im.width}×{im.height}px")
