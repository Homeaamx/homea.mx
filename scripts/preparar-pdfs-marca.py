#!/usr/bin/env python3
"""Prepara los PDFs de marca (listas de precios / catálogos) antes de subirlos a Shopify Files.

Fuente: la carpeta CATALOGOS VIGENTES del maestro de precios (OneDrive, fuera del repo).
Los PDFs NUNCA entran al git: este script solo escribe en una carpeta de salida local.

Qué hace con cada PDF de scripts/pdfs-marca.json (una entrada por documento):
  · Quita la marca del distribuidor (Artexa, Lecrom, Maresa…): logos vectoriales de
    Artexa en todas las páginas, líneas de texto con su nombre o teléfono, páginas
    de "términos y condiciones de compra" del distribuidor ("del") y su contraportada
    ("back", se sustituye por la tarjeta de contacto HOMEA), palabras sueltas ("palabras",
    p. ej. "Dealer") y líneas enteras que casen con un patrón ("lineas", p. ej. leyendas
    "Confidential").
  · Pone la tarjeta HOMEA en la portada ("stamp": tr · tl · br · bl · at_img = donde
    estaba el logo quitado) o el banner HOMEA donde iba el logo del distribuidor en
    cada página ("banner_dims": ancho × alto en px de ese logo).
  · Borra los datos privados de Illustrator (PieceInfo) y los metadatos XMP: pesan
    decenas de MB y no se ven. Si aún pasa de 19.5 MB (tope de Shopify Files: 20 MB)
    baja la resolución de las fotos.
  · Pone título y autor HOMEA en los metadatos.

Mismo criterio que la lista de Elica publicada en 2026-09 (docs/PDFS-OXATIS-PENDIENTES.md).
Revisa SIEMPRE el resultado a ojo (portada, una página interior y la contraportada)
antes de subirlo: la tarjeta de la portada puede tapar el logo de la marca.

    python3 scripts/preparar-pdfs-marca.py SALIDA/ [slug-doc ...]

Requiere PyMuPDF (`pip install pymupdf`).
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
FUENTE = Path.home() / (
    "Library/Group Containers/UBF8T346G9.OneDriveSyncClientSuite/OneDrive-Homea 2.noindex/"
    "OneDrive-Homea 2/HOMEA/SAE/SAE-CARLA/MAESTRO PRECIOS/CATALOGOS VIGENTES"
)
TOPE = 19_500_000
CDN = "https://cdn.shopify.com/s/files/1/0688/0788/4860/files/"

# Artes HOMEA: se toman de PDFs ya publicados (no viven en el repo).
#   tarjeta: contraportada de la lista de Elica · banner: encabezado de la de Broil King.
ARTE = {
    "tarjeta": ("lista-precios-campanas-elica-2026.pdf", 25, (612, 564)),
    "banner": ("lista-precios-asadores-broil-king-mar-2026.pdf", 0, (1278, 230)),
}

TEXTO_DISTRIBUIDOR = re.compile(
    r"artexa|8625\s?5\d|T\.\s?01\s?[\(\[]\s?81|F\.\s?01\s?[\(\[]\s?81|lecrom|maresa|alkia"
    r"|NO PARTICIPAN EN PROMOCIONES",
    re.I,
)

# Logo "artexa": seis letras vectoriales con este número de trazos (a-r-t-e-x-a).
LETRAS_ARTEXA = [19, 13, 17, 12, 18, 19]


def arte(nombre):
    archivo, pagina, dims = ARTE[nombre]
    pdf = fitz.open(stream=urllib.request.urlopen(CDN + archivo).read(), filetype="pdf")
    for img in pdf[pagina].get_images(full=True):
        if (img[2], img[3]) == dims:
            return pdf.extract_image(img[0])["image"]
    raise SystemExit(f"No encontré el arte '{nombre}' en {archivo}")


def logos_artexa(page):
    ds = [d for d in page.get_drawings() if d.get("fill") is not None and d["type"] in ("f", "fs")]
    out = []
    for i in range(len(ds) - 5):
        grupo = ds[i : i + 6]
        if [len(g["items"]) for g in grupo] != LETRAS_ARTEXA:
            continue
        if [g["rect"].x0 for g in grupo] != sorted(g["rect"].x0 for g in grupo):
            continue
        L = fitz.Rect(grupo[0]["rect"])
        for g in grupo:
            L |= g["rect"]
        h = L.height
        if L.width >= 6 * h:
            continue
        # Variante "artexa kitchen.": palabras pegadas a la derecha, mismo color.
        color = grupo[0].get("fill")
        derecha = sorted(
            (
                g
                for g in ds
                if g.get("fill") == color
                and g["rect"].x0 > L.x1 - 1
                and g["rect"].y0 > L.y0 - 0.6 * h
                and g["rect"].y1 < L.y1 + 0.6 * h
                and g["rect"].height < 1.4 * h
            ),
            key=lambda g: g["rect"].x0,
        )
        for g in derecha:
            if g["rect"].x0 - L.x1 > 1.6 * h:
                break
            L |= g["rect"]
        # + el ícono a la izquierda
        out.append(fitz.Rect(L.x0 - 2.5 * h, L.y0 - 0.75 * h, L.x1 + 0.45 * h, L.y1 + 0.8 * h))
    return out


def sellar(page, tarjeta, donde, junto=None, fraccion=None):
    R = page.rect
    w = R.width * (fraccion or (0.2 if R.width > R.height else 0.27))
    h = w * 564 / 612
    m = R.width * 0.035
    if donde == "tr":
        r = fitz.Rect(R.x1 - m - w, m, R.x1 - m, m + h)
    elif donde == "tl":
        r = fitz.Rect(m, m, m + w, m + h)
    elif donde == "br":
        r = fitz.Rect(R.x1 - m - w, R.y1 - m - h, R.x1 - m, R.y1 - m)
    elif donde == "bl":
        r = fitz.Rect(m, R.y1 - m - h, m + w, R.y1 - m)
    elif junto is None:  # at_img sin logo encontrado: esquina superior derecha
        r = fitz.Rect(R.x1 - m - w, m, R.x1 - m, m + h)
    else:  # at_img: centrada en el logo que se quitó, sin salirse de la página
        c = (junto.tl + junto.br) / 2
        r = fitz.Rect(c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2)
        dx = max(0, m - r.x0) - max(0, r.x1 - (R.x1 - m))
        dy = max(0, m - r.y0) - max(0, r.y1 - (R.y1 - m))
        r = r + (dx, dy, dx, dy)
    page.insert_image(r, stream=tarjeta, keep_proportion=True)


def preparar(doc, op, salida, tarjeta, banner):
    pdf = fitz.open(FUENTE / doc["src"])
    hecho = []
    for n in sorted(op.get("del", []), reverse=True):
        pdf.delete_page(n - 1)
        hecho.append(f"sin p{n}")
    if op.get("back"):
        R = pdf[-1].rect
        pdf.delete_page(pdf.page_count - 1)
        p = pdf.new_page(width=R.width, height=R.height)
        w = R.width / 2
        h = w * 564 / 612
        p.insert_image(fitz.Rect((R.width - w) / 2, (R.height - h) / 2, (R.width + w) / 2, (R.height + h) / 2), stream=tarjeta)
        hecho.append("contraportada HOMEA")
    junto = None
    for i, p in enumerate(pdf):
        marcas = logos_artexa(p) if op.get("artexa") else []
        for r in marcas:
            p.add_redact_annot(r, fill=False)
        if marcas and i == 0:
            junto = marcas[0]
        lineas = 0
        if op.get("artexa") or op.get("texto") or op.get("del"):
            for b in p.get_text("dict")["blocks"]:
                for l in b.get("lines", []):
                    if TEXTO_DISTRIBUIDOR.search("".join(s["text"] for s in l["spans"])):
                        p.add_redact_annot(fitz.Rect(l["bbox"]), fill=False)
                        lineas += 1
        # Palabras sueltas (exactas, p. ej. "Dealer") y líneas enteras por patrón (p. ej. "Confidential").
        for w in p.get_text("words"):
            if w[4] in op.get("palabras", []):
                p.add_redact_annot(fitz.Rect(w[:4]), fill=False)
                lineas += 1
        if op.get("lineas"):
            patron = re.compile(op["lineas"], re.I)
            for b in p.get_text("dict")["blocks"]:
                for l in b.get("lines", []):
                    if patron.search("".join(s["text"] for s in l["spans"])):
                        p.add_redact_annot(fitz.Rect(l["bbox"]), fill=False)
                        lineas += 1
        caja = op.get("tapar", {}).get(str(i + 1))
        if caja:
            p.add_redact_annot(fitz.Rect(caja), fill=False)
        if marcas or lineas or caja:
            # Solo quita texto y trazos cubiertos por completo: las fotos de fondo se quedan.
            p.apply_redactions(
                images=fitz.PDF_REDACT_IMAGE_NONE,
                graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED,
                text=fitz.PDF_REDACT_TEXT_REMOVE,
            )
    if op.get("banner_dims"):
        dims = tuple(op["banner_dims"])
        sitios = [
            (i, img[0], r)
            for i, p in enumerate(pdf)
            for img in p.get_images(full=True)
            if (img[2], img[3]) == dims
            for r in p.get_image_rects(img[0])
        ]
        for xref in {x for _, x, _ in sitios}:  # borrar la imagen la quita de todas sus páginas
            pdf[next(i for i, x, _ in sitios if x == xref)].delete_image(xref)
        for i, _, r in sitios:
            pdf[i].insert_image(r, stream=banner, keep_proportion=True)
        hecho.append(f"banner HOMEA en {len({i for i, _, _ in sitios})} páginas")
    portada = pdf[0]
    for img in portada.get_images(full=True):
        # logo del distribuidor como imagen: 1×1 con máscara (Artexa) o por tamaño (Lecrom)
        if (op.get("logo_1x1") and img[2] <= 2 and img[3] <= 2) or (
            op.get("logo_dims") and (img[2], img[3]) == tuple(op["logo_dims"])
        ):
            junto = portada.get_image_rects(img[0])[0]
            portada.delete_image(img[0])
            hecho.append("logo distribuidor portada")
    if op.get("stamp"):
        sellar(portada, tarjeta, op["stamp"], junto, op.get("fraccion"))
        hecho.append("tarjeta HOMEA")
    pdf.set_metadata(
        {"title": f"{doc['nombre']} · {doc['titulo']} {doc['vigencia']} · HOMEA", "author": "HOMEA",
         "subject": "www.homea.mx", "keywords": "", "creator": "", "producer": ""}
    )
    for p in pdf:
        for k in ("PieceInfo", "Metadata"):
            if pdf.xref_get_key(p.xref, k)[0] != "null":
                pdf.xref_set_key(p.xref, k, "null")
    pdf.del_xml_metadata()
    out = salida / doc["archivo"]
    pdf.save(out, garbage=4, deflate=True, clean=True)
    for umbral, meta, calidad in [(150, 110, 75), (130, 96, 65), (110, 80, 55)]:
        if out.stat().st_size <= TOPE:
            break
        chico = fitz.open(out)
        chico.rewrite_images(dpi_threshold=umbral, dpi_target=meta, quality=calidad)
        chico.save(str(out) + ".tmp", garbage=4, deflate=True)
        os.replace(str(out) + ".tmp", out)
        hecho.append(f"fotos a {meta} dpi")
    return pdf.page_count, out.stat().st_size, hecho


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    salida = Path(sys.argv[1])
    salida.mkdir(parents=True, exist_ok=True)
    solo = set(sys.argv[2:])
    cfg = json.loads((ROOT / "scripts" / "pdfs-marca.json").read_text())
    tarjeta, banner = arte("tarjeta"), arte("banner")
    for doc in cfg["documentos"]:
        if solo and doc["slug"] not in solo:
            continue
        paginas, peso, hecho = preparar(doc, doc.get("op", {}), salida, tarjeta, banner)
        aviso = "  ⚠️ PASA DE 20 MB" if peso > 20_000_000 else ""
        print(f"{doc['slug']:30} {paginas:4}p {peso / 1e6:5.1f} MB  {'; '.join(hecho)}{aviso}")


if __name__ == "__main__":
    main()
