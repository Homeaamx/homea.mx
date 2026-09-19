#!/usr/bin/env python3
"""Mapa de migración OXATIS → sitio nuevo (redirects 301).

Lee el inventario de URLs viejas (sitemap OXATIS + páginas de GSC), empareja cada
ficha de producto con su SKU del maestro de catálogo y le asigna una familia de la
taxonomía nueva. Escribe:

  data/redirects/oxatis-auto.json   ruta vieja → {s: sku, t: macro/sub1/sub2, f: filtro}
  data/redirects/pdfs-legacy.json   PDFs viejos que no son listas de precios (se
                                    conservan las 'url' que ya se hayan capturado)
  data/redirects/sin-destino.csv    lo que quedó sin destino, ordenado por clics

NO decide si el destino es la ficha o el listado: eso lo hace
scripts/build-redirects.mjs en cada build, según qué fichas existan ya.

Volver a correr cuando cambie el maestro de catálogo:
    MAESTRO_XLSX=/ruta/local/06-MAESTRO-SHOPIFY.xlsx python3 scripts/build-oxatis-map.py
"""

import csv
import json
import os
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "redirects"
GSC_PAGES = ROOT / "seo-data" / "gsc-export-2026-06-04" / "Pages.csv"
OXATIS_URLS = ROOT / "seo-data" / "urls-oxatis.txt"
# El maestro trae precios de proveedor y existencias: NO vive en el repo público.
# Ruta local vía MAESTRO_XLSX (el resultado, oxatis-auto.json, sí se versiona).
MAESTRO = Path(
    os.environ.get("MAESTRO_XLSX")
    or ROOT / "catalogo-shopify" / "06-MAESTRO-SHOPIFY.xlsx"
)

RE_FICHA = re.compile(r"-c\d+x\d+$")
ES_PRODUCT = "es/product/"

# TIPO del maestro → familia de la taxonomía (macro/sub1/sub2). La grifería se
# decide además por la macro (baño vs cocina).
TIPO_A_FAMILIA = {
    "Refrigeradores": "cocina-y-bar/refrigeracion/refrigeradores",
    "Congeladores": "cocina-y-bar/refrigeracion/congeladores",
    "Cavas de vino": "cocina-y-bar/refrigeracion/cavas-de-vino",
    "Máquinas de hielo": "cocina-y-bar/refrigeracion/maquinas-de-hielo",
    "Centros de bebida": "cocina-y-bar/refrigeracion/centros-de-bebida",
    "Frigobares": "cocina-y-bar/refrigeracion/frigobares",
    "Cajones fríos": "cocina-y-bar/refrigeracion/cajones-frios",
    "Estufas": "cocina-y-bar/coccion/estufas",
    "Parrillas": "cocina-y-bar/coccion/parrillas",
    "Hornos": "cocina-y-bar/coccion/hornos",
    "Microondas": "cocina-y-bar/coccion/microondas",
    "Campanas": "cocina-y-bar/coccion/campanas",
    "Cajones (calientaplatos / vacío)": "cocina-y-bar/coccion/cajones",
    "Cafeteras": "cocina-y-bar/coccion/cafeteras-empotrables",
    "Accesorios de cocción / cocina": "cocina-y-bar/coccion/accesorios-coccion",
    "Lavavajillas": "cocina-y-bar/lavavajillas",
    "Tarjas": "cocina-y-bar/tarjas-y-griferia/tarjas",
    "Trituradores": "cocina-y-bar/trituradores",
    "Filtros de agua": "cocina-y-bar/filtros-y-purificadores-de-agua/filtros-y-repuestos",
    "Dispensadores de agua": "cocina-y-bar/filtros-y-purificadores-de-agua",
    "Asadores": "exterior/asadores-y-hornos",
    "Hornos de pizza": "exterior/asadores-y-hornos/hornos-de-pizza",
    "Lavabos": "banos/lavabos",
    "Regaderas": "banos/regaderas",
    "Tinas": "banos/tinas",
    "Accesorios de Baños": "banos/accesorios-banos",
    "WC / Sanitarios (sin categoría en taxonomía)": "banos/wc-y-sanitarios",
    "Minisplits": "minisplits",
    "Lavadoras": "lavanderia/lavadoras",
    "Secadoras": "lavanderia/secadoras",
    "Lavasecadoras (2 en 1)": "lavanderia/lavasecadoras",
    "Centros de Lavado": "lavanderia/centros-de-lavado",
    "Calentadores": "chimeneas-y-calentadores/calentadores",
    "Chimeneas": "chimeneas-y-calentadores/chimeneas",
    "Vapor": "vapor-y-sauna/vapor",
    "Recubrimientos / Superficies": "recubrimientos-y-superficies",
    "Batidoras": "electrodomesticos-menores/batidoras",
    "Licuadoras": "electrodomesticos-menores/licuadoras",
    "Aspiradoras (sin categoría en taxonomía)": "electrodomesticos-menores",
}


def familia_de_tipo(macro, tipo):
    if tipo == "Grifería / Monomandos":
        return "banos/monomandos" if macro == "Baños" else "cocina-y-bar/tarjas-y-griferia/griferia"
    return TIPO_A_FAMILIA.get(tipo)


def slugify(texto):
    t = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def norm_sku(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def norm_ruta(url):
    """Misma normalización que proxy.ts: sin dominio, minúsculas, sin / final,
    sin prefijo /mobile; en .asp solo se conserva el parámetro que identifica la
    página (id / pageid)."""
    url = url.strip().replace("&amp;", "&")
    url = re.sub(r"^https?://[^/]+", "", url) or "/"
    ruta, _, query = url.partition("?")
    ruta = ruta.lower()
    if ruta.startswith("/mobile/"):
        ruta = ruta[len("/mobile"):]
    if len(ruta) > 1:
        ruta = ruta.rstrip("/")
    if ruta.endswith(".asp"):
        for par in query.split("&"):
            k, _, v = par.partition("=")
            if k.lower() in ("id", "pageid") and v:
                return f"{ruta}?{k.lower()}={v.lower()}"
    return ruta


def cargar_maestro():
    wb = openpyxl.load_workbook(MAESTRO, read_only=True)
    filas = wb["Maestro"].iter_rows(values_only=True)
    h = next(filas)
    i = {k: h.index(k) for k in ("CLAVE", "MARCA", "MACROCATEGORIA", "TIPO")}
    skus, marcas = {}, set()
    for r in filas:
        clave = r[i["CLAVE"]]
        if not clave:
            continue
        n = norm_sku(clave)
        if r[i["MARCA"]]:
            marcas.add(norm_sku(r[i["MARCA"]]))
        # Claves cortas o sin dígitos chocan con palabras del slug ("acero").
        if len(n) < 5 or not re.search(r"\d", n):
            continue
        fam = familia_de_tipo(r[i["MACROCATEGORIA"]], r[i["TIPO"]])
        if n not in skus or (fam and not skus[n]):
            skus[n] = fam
    return skus, {m for m in marcas if len(m) >= 3}


def cargar_claves():
    data = json.loads((OUT / "palabras-clave.json").read_text(encoding="utf-8"))
    return [(c[0], c[1], c[2] if len(c) > 2 else None) for c in data["claves"]]


def familia_por_clave(slug, claves):
    """Palabra clave más al inicio del slug (empate → la más larga)."""
    s = "-" + slug
    mejor = None
    for clave, fam, f in claves:
        pos = s.find("-" + clave)
        if pos < 0:
            continue
        rank = (pos, -len(clave))
        if mejor is None or rank < mejor[0]:
            mejor = (rank, fam, f)
    return (mejor[1], mejor[2]) if mejor else (None, None)


def familia_por_subcadena(slug, claves):
    """Último recurso para slugs con palabras pegadas ("cgi1209scampanageprofile"):
    la clave más larga que aparezca en cualquier parte."""
    plano = slug.replace("-", "")
    mejor = None
    for clave, fam, f in claves:
        c = clave.replace("-", "")
        if len(c) >= 5 and c in plano and (mejor is None or len(c) > mejor[0]):
            mejor = (len(c), fam, f)
    return (mejor[1], mejor[2]) if mejor else (None, None)


def buscar_sku(slug, skus):
    toks = [t for t in slug.split("-") if t]
    # 1) Lo que sigue a "modelo-" es el modelo (slugs de GSC).
    if "modelo" in toks:
        k = toks.index("modelo") + 1
        for j in range(min(k + 5, len(toks)), k, -1):
            n = "".join(toks[k:j])
            if n in skus:
                return n
    # 2) Ventanas de 1–5 palabras; gana la coincidencia más larga.
    mejor = None
    for i in range(len(toks)):
        for j in range(i + 1, min(i + 5, len(toks)) + 1):
            n = "".join(toks[i:j])
            if n in skus and re.search(r"[a-z]", n) and (mejor is None or len(n) > len(mejor)):
                mejor = n
    return mejor


def tiene_marca(slug, marcas):
    toks = [t for t in slug.split("-") if t]
    return any(
        "".join(toks[i:j]) in marcas
        for i in range(len(toks))
        for j in range(i + 1, min(i + 3, len(toks)) + 1)
    )


def main():
    skus, marcas = cargar_maestro()
    claves = cargar_claves()
    manual = json.loads((OUT / "oxatis-manual.json").read_text(encoding="utf-8"))["rutas"]
    listas = json.loads((ROOT / "data" / "listas-precios.json").read_text(encoding="utf-8"))
    pdf_listas = {
        norm_ruta(p)
        for m in listas["marcas"]
        for d in m["documentos"]
        for p in d["legacy"]
    }

    clics = defaultdict(int)
    with open(GSC_PAGES, encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            clics[norm_ruta(r["Top pages"])] += int(r["Clicks"])
    rutas = set(clics)
    rutas |= {norm_ruta(u) for u in OXATIS_URLS.read_text(encoding="utf-8").split() if u}

    pdfs_path = OUT / "pdfs-legacy.json"
    pdfs_prev = {}
    if pdfs_path.exists():
        pdfs_prev = json.loads(pdfs_path.read_text(encoding="utf-8"))["pdfs"]

    auto, pdfs, sin = {}, {}, []
    for ruta in sorted(rutas):
        if ruta == "/" or ruta in manual:
            continue
        if ruta.startswith("/files/"):
            if ruta in pdf_listas:
                continue
            base = ruta.rsplit("/", 1)[-1][:-4].lower()
            sku = buscar_sku(re.sub(r"[_.]", "-", base), skus)
            prev = pdfs_prev.get(ruta, {})
            desc = prev.get("descripcion") or (f"Ficha/manual {sku.upper()}" if sku else "Sin identificar")
            fam = skus.get(sku) if sku else None
            if not fam:
                # Sin SKU: la familia sale de la descripción capturada a mano.
                fam, _ = familia_por_clave(slugify(desc), claves)
            pdfs[ruta] = {"descripcion": desc, "url": prev.get("url"), "t": fam}
            continue
        slug = ruta.lstrip("/")
        es_product = slug.startswith(ES_PRODUCT)
        if es_product:
            # Formato más viejo: /es/product/<slug> (a veces con _ y palabras pegadas).
            slug = re.sub(r"[_-]+", "-", slug[len(ES_PRODUCT):]).strip("-")
        elif not RE_FICHA.search(slug):
            sin.append((clics.get(ruta, 0), ruta, "patrón sin regla"))
            continue
        slug = RE_FICHA.sub("", slug)
        sku = buscar_sku(slug, skus)
        fam, f = familia_por_clave(slug, claves)
        if not fam and es_product:
            fam, f = familia_por_subcadena(slug, claves)
        if sku and skus[sku]:
            # El TIPO del maestro manda, salvo que la clave dé un filtro de la misma familia.
            if skus[sku] != fam:
                fam, f = skus[sku], None
        entrada = {}
        if sku:
            entrada["s"] = sku
        if fam and fam.startswith("/"):
            entrada["u"] = fam
        elif fam:
            entrada["t"] = fam
            if f:
                entrada["f"] = f
        elif tiene_marca(slug, marcas):
            entrada["u"] = "/marcas"
        if not entrada.get("t") and not entrada.get("u"):
            sin.append((clics.get(ruta, 0), ruta, "sin familia" + (f" (sku {sku})" if sku else "")))
            if not sku:
                continue
        auto[ruta] = entrada

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "oxatis-auto.json").write_text(
        json.dumps(auto, ensure_ascii=False, separators=(",", ":"), sort_keys=True), encoding="utf-8"
    )
    pdfs_path.write_text(
        json.dumps(
            {
                "_nota": "PDFs viejos de OXATIS que NO son listas de precios (esas viven en data/listas-precios.json). ESTADO: PENDIENTE — se re-hospedan en Shopify Files. Captura la URL de Shopify en 'url' y haz deploy: la URL vieja redirige (301) al PDF nuevo. Mientras 'url' sea null redirige al listado de su familia ('t') o a /marcas#listas-de-precios. 'descripcion' se puede editar a mano; el script la respeta.",
                "pdfs": pdfs,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    with open(OUT / "sin-destino.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["clics_gsc", "ruta", "motivo"])
        for fila in sorted(sin, reverse=True):
            w.writerow(fila)

    # Resumen de cobertura sobre los clics de GSC.
    tot = sum(clics.values())
    cub = defaultdict(int)
    for ruta, c in clics.items():
        if ruta == "/":
            cub["home"] += c
        elif ruta in manual:
            cub["manual"] += c
        elif ruta in pdf_listas or ruta in pdfs:
            cub["pdf"] += c
        elif ruta in auto and auto[ruta].get("s"):
            cub["ficha (sku)"] += c
        elif ruta in auto:
            cub["listado"] += c
        else:
            cub["sin destino"] += c
    print(f"URLs: {len(rutas)} · auto: {len(auto)} · pdfs: {len(pdfs)} · sin destino: {len(sin)}")
    for k, v in sorted(cub.items(), key=lambda x: -x[1]):
        print(f"  {k:<12} {v:>6} clics  {100 * v / tot:5.1f}%")


if __name__ == "__main__":
    main()
