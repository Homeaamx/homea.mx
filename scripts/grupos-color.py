#!/usr/bin/env python3
"""Grupos de color por marca (data/sugerencias-marca.json → "colores").

Cada color de un modelo es su propio producto en Shopify. Para que la tarjeta y
la ficha pinten los círculos del modelo, cada pieza del grupo lleva en
data/sugerencias-marca.json la lista de sus otros colores. Este script los busca
en las páginas de marca del sitio (necesita `npm run dev` en el puerto 3000):

  misma marca + misma línea + mismo título sin las palabras de color
  + un color distinto (filtros.color) en cada pieza  →  un grupo

Uso:
  python3 scripts/grupos-color.py elica thor      # solo enseña los grupos nuevos
  python3 scripts/grupos-color.py --todas         # todas las marcas SHOPIFY
  python3 scripts/grupos-color.py elica --aplicar # además los escribe en el JSON

Lo que no cuadra (dos piezas del mismo color con el mismo título) sale como
AMBIGUO y no se escribe: se decide a mano. Después de aplicar, revisar que cada
nombre de color nuevo tenga su muestra en lib/coloresModelo.ts (MUESTRAS); sin
muestra, la pieza no aparece en los círculos. Detalle: docs/COLORES-POR-MARCA.md.
"""

import collections
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SUGERENCIAS = RAIZ / "data" / "sugerencias-marca.json"
MARCAS = RAIZ / "data" / "marcas.json"
SITIO = "http://localhost:3000"

# Palabras de color o acabado que cambian entre los títulos de un mismo modelo.
COLOR = re.compile(
    r"\b(negro|negra|blanco|blanca|gris|acero inoxidable|inoxidable|acero|cromo|cromado|dorado|oro|bronce|"
    r"níquel|niquel|mate|cepillado|pulido|satinado|matte black|black|white|stainless|steel|chrome|gold|"
    r"champagne|nero|bianco|grafito|antracita|carbón|cobre|platino|plata|rojo|azul|verde|crema|beige|café|"
    r"panelable|vidrio)\b"
)


def tarjetas(slug):
    h = urllib.request.urlopen(f"{SITIO}/marcas/{slug}", timeout=300).read().decode()
    for attrs, cuerpo in re.findall(r'<a class="pcard"([^>]*)>(.*?)</a>', h, re.S):
        sku = re.search(r'data-sku="([^"]+)"', attrs).group(1)
        color = re.search(r'data-fv-color="([^"]*)"', attrs)
        titulo = html.unescape(re.search(r'class="pcard-name">([^<]+)', cuerpo).group(1))
        serie = re.search(r'class="pcard-serie">([^<]*)', cuerpo)
        yield sku, titulo, serie.group(1) if serie else "", color.group(1) if color else ""


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    aplicar = "--aplicar" in sys.argv
    if "--todas" in sys.argv:
        crudo = json.loads(MARCAS.read_text())
        lista = crudo if isinstance(crudo, list) else crudo["marcas"]
        args = [m["slug"] for m in lista if m.get("canal") == "shopify"]
    if not args:
        sys.exit(__doc__)

    texto = SUGERENCIAS.read_text()
    datos = json.loads(texto)
    agrupadas = {k for k, v in datos.items() if isinstance(v, dict) and v.get("colores")}

    nuevos = []
    for slug in args:
        modelos = collections.defaultdict(list)
        for sku, titulo, serie, color in tarjetas(slug):
            if sku in agrupadas:
                continue
            base = re.sub(r"\s+", " ", COLOR.sub("", titulo.lower())).strip(" -—,")
            modelos[(serie, base)].append((sku, color, titulo))
        for (serie, _), piezas in modelos.items():
            colores = {c for _, c, _ in piezas}
            if len(piezas) < 2 or len(colores) < 2:
                continue
            if len(colores) < len(piezas):
                print(f"AMBIGUO {slug} · {serie}: " + ", ".join(f"{s} ({c})" for s, c, _ in piezas))
                continue
            nuevos.append([s for s, _, _ in piezas])
            print(f"{slug} · {serie}: " + " | ".join(f"{s} {t}" for s, _, t in piezas))

    print(f"\n{len(nuevos)} grupos nuevos")
    if aplicar and nuevos:
        for grupo in nuevos:
            for sku in grupo:
                datos.setdefault(sku, {})["colores"] = [s for s in grupo if s != sku]
        SUGERENCIAS.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + ("\n" if texto.endswith("\n") else ""))
        print(f"Escritos en {SUGERENCIAS.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
