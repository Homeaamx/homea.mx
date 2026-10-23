#!/usr/bin/env python3
"""filtros-web-valores.py — lleva a data/filtros-web.json los VALORES cerrados de
cada filtro desde la tabla de Carla (FILTROS DE BUSQUEDA EN LA WEB_CLAUDE.xlsx).

data/filtros-web.json nació de esa misma tabla (2026-10-06) con nombre + clave por
subcategoría 2. Aquí se le añade `valores` (la lista cerrada de la columna
"Valores", en su orden) para que el panel de filtros del sitio enseñe la
especificación completa aunque todavía no haya piezas publicadas con ese dato.

Solo stdlib (sin openpyxl): el .xlsx se lee como zip + XML.

Uso:
  python3 scripts/filtros-web-valores.py            # escribe el JSON y reporta diferencias
  python3 scripts/filtros-web-valores.py --solo-diff  # solo reporta, no escribe

Qué reporta: filtros que están en la tabla y no en el JSON (o al revés) y
cambios de orden, para decidir a mano si se replica (el JSON lleva añadidos
posteriores a la tabla: bisagra, altura_ada…; nunca se pisan desde aquí).
"""

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JSON = RAIZ / "data" / "filtros-web.json"
_TABLA = "HOMEA/PAGINA WEB/PAGINA NUEVA 2026/FILTROS DE BUSQUEDA SHOPIFY 2026/FILTROS DE BUSQUEDA EN LA WEB_CLAUDE.xlsx"
# OneDrive renombra su carpeta al reiniciarse ("OneDrive-Homea", "OneDrive-Homea 2"…): la que exista.
XLSX = next(
    (r / _TABLA for r in sorted((Path.home() / "Library/CloudStorage").glob("OneDrive-Homea*"), reverse=True) if (r / _TABLA).exists()),
    Path.home() / "Library/CloudStorage/OneDrive-Homea 2" / _TABLA,
)
# Hojas con canal SHOPIFY (las "SOLO PDF" se ignoran).
HOJAS = {"COCINA Y BAR", "EXTERIOR", "ELECTRODOMÉSTICOS MENORES", "LAVANDERÍA", "AIRE ACONDICIONADO"}
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
# (subcategoría, clave) → [(insertar antes de, valor)] — valores añadidos en Shopify
# después de la tabla de Carla.
ADICIONALES = {
    ("Lavandería", "tipo"): [("", "Accesorio de lavandería")],
    ("Lavandería", "capacidad"): [("19 kg", "9 kg"), ("19 kg", "10 kg")],
    ("Lavavajillas", "capacidad"): [("12", "10")],
}
# Valores que no son lista cerrada.
SIN_LISTA = re.compile(r"^(depende del producto|min-max|—|-)?$", re.I)


def hojas(xlsx: Path):
    z = zipfile.ZipFile(xlsx)
    ss = [
        "".join(t.text or "" for t in si.iter("{%s}t" % NS["m"]))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    nombres = [s.get("name") for s in wb.find("m:sheets", NS)]
    archivos = sorted(
        (n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml", n)),
        key=lambda x: int(re.findall(r"\d+", x)[0]),
    )
    for nombre, archivo in zip(nombres, archivos):
        filas = []
        for fila in ET.fromstring(z.read(archivo)).iter("{%s}row" % NS["m"]):
            vals = []
            for c in fila.findall("m:c", NS):
                v = c.find("m:v", NS)
                if v is None:
                    vals.append(None)
                    continue
                vals.append(ss[int(v.text)] if c.get("t") == "s" else v.text)
            filas.append(vals)
        yield nombre, filas


def clave_de(metafield):
    if not metafield:
        return None
    m = metafield.strip()
    if m.startswith("filtros."):
        return m.split(".", 1)[1].strip()
    if m.startswith("vendor"):
        return "marca"
    if m.startswith("price"):
        return "precio"
    return None


def leer_tabla():
    """{tipo: [(orden, nombre, clave, valores)]} desde la tabla, en orden propuesto."""
    tabla = {}
    for hoja, filas in hojas(XLSX):
        if hoja not in HOJAS:
            continue
        for f in filas:
            if len(f) < 10 or not f[2] or f[0] in (None, "Macrocategoría"):
                continue
            if "›" in str(f[0]):
                continue
            tipo = str(f[2]).strip()
            clave = clave_de(f[9])
            if not clave:
                continue
            try:
                orden = int(float(f[4]))
            except (TypeError, ValueError):
                continue
            nombre = str(f[5]).strip()
            crudo = (f[7] or "").strip()
            valores = [] if SIN_LISTA.match(crudo) else [v.strip() for v in crudo.split(";") if v.strip()]
            # Promoción = % de descuento real de cada pieza (precio vs. tachado, lo
            # calcula lib/shopify/catalogoVivo.ts); "Outlet" ya no existe (Carla, 2026-10-22).
            if clave == "promocion":
                valores = [v for v in valores if v.lower() != "outlet"]
            # Valores que se agregaron en Shopify después de la tabla (Carla, 2026-10-22,
            # carga de Bosch): se insertan en su lugar aunque la tabla no los traiga.
            for (t_, c_), extra in ADICIONALES.items():
                if t_ == tipo and c_ == clave:
                    for antes, v in extra:
                        if v not in valores:
                            valores.insert(valores.index(antes) if antes in valores else len(valores), v)
            tabla.setdefault(tipo, []).append((orden, nombre, clave, valores))
    for tipo in tabla:
        tabla[tipo].sort(key=lambda x: x[0])
    return tabla


def main():
    solo_diff = "--solo-diff" in sys.argv
    datos = json.loads(JSON.read_text(encoding="utf-8"))
    tabla = leer_tabla()
    diffs = []
    anadidos = 0
    for tipo, defs in datos["subcategorias"].items():
        fila = tabla.get(tipo)
        if fila is None:
            diffs.append(f"  JSON tiene '{tipo}' y la tabla no")
            continue
        en_tabla = {c: (o, n, v) for o, n, c, v in fila}
        for d in defs:
            t = en_tabla.get(d["clave"])
            if t is None:
                diffs.append(f"  {tipo} › {d['nombre']} ({d['clave']}): en el JSON, no en la tabla")
                continue
            if t[2]:
                if d.get("valores") != t[2]:
                    anadidos += 1
                d["valores"] = t[2]
            elif "valores" in d:
                del d["valores"]
        claves_json = [d["clave"] for d in defs]
        for o, n, c, v in fila:
            if c not in claves_json:
                diffs.append(f"  {tipo} › {n} ({c}): en la tabla (orden {o}), no en el JSON")
        orden_tabla = [c for _, _, c, _ in fila if c in claves_json]
        orden_json = [c for c in claves_json if c in en_tabla]
        if orden_tabla != orden_json:
            diffs.append(f"  {tipo}: orden distinto · tabla {orden_tabla} · JSON {orden_json}")
    for tipo in tabla:
        if tipo not in datos["subcategorias"]:
            diffs.append(f"  Tabla tiene '{tipo}' y el JSON no")

    if not solo_diff:
        JSON.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"✓ data/filtros-web.json: valores cerrados de {sum(1 for d in datos['subcategorias'].values() for x in d if x.get('valores'))} filtros ({anadidos} actualizados)")
    print("Diferencias tabla ↔ JSON:" if diffs else "Tabla y JSON coinciden en filtros y orden.")
    for d in diffs:
        print(d)


if __name__ == "__main__":
    main()
