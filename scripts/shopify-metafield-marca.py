#!/usr/bin/env python3
"""Pone un metafield de filtro (filtros.<clave>) a TODOS los productos de una marca.

Uso:
  python3 scripts/shopify-metafield-marca.py --marca Gaggenau --clave garantia --valor "5 años" [--solo-tipo Refrigeradores] [--aplicar]
  python3 scripts/shopify-metafield-marca.py --por-sku valores.json [--aplicar]
      valores.json = { "RVY497790": { "acabado": ["Panelable"], "fabrica_hielos": ["Sin despachador"] }, ... }
  python3 scripts/shopify-metafield-marca.py --contenido ficha.json [--aplicar]
      ficha.json = { "RVY497790": { "descripcion_html": "<p>…</p>", "dimensiones": [{"nombre":"Ancho de nicho","valor":"90 cm"}],
                                    "fichas": ["https://…/spec.pdf"] }, ... }
      → descripción larga del producto, metafield homea.dimensiones (json) y homea.fichas_tecnicas
        (los PDF se suben a Shopify Files desde su URL y se ligan como file_reference).

Sin --aplicar solo muestra cuántos productos cambiarían. Lee las credenciales de la
app "HOMEA Sitio Web" de .env.local (SHOPIFY_ADMIN_*), igual que lib/shopify/admin.ts.
Los valores van como lista JSON (los filtros.* son list.single_line_text_field) y
deben existir en las opciones de la definición; Shopify rechaza lo demás.
"""
import argparse, json, os, sys, urllib.request

def env():
    vals = {}
    with open(".env.local") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                vals[k] = v.strip().strip('"')
    return vals

E = env()
DOMINIO = E["SHOPIFY_ADMIN_DOMAIN"]
VERSION = E.get("SHOPIFY_ADMIN_API_VERSION", "2026-07")

def token():
    datos = json.dumps({"client_id": E["SHOPIFY_ADMIN_CLIENT_ID"], "client_secret": E["SHOPIFY_ADMIN_CLIENT_SECRET"], "grant_type": "client_credentials"}).encode()
    req = urllib.request.Request(f"https://{DOMINIO}/admin/oauth/access_token", data=datos, headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))["access_token"]

TOKEN = token()

def gql(query, variables=None):
    req = urllib.request.Request(
        f"https://{DOMINIO}/admin/api/{VERSION}/graphql.json",
        data=json.dumps({"query": query, "variables": variables or {}}).encode(),
        headers={"Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN},
    )
    r = json.load(urllib.request.urlopen(req))
    if "errors" in r:
        sys.exit(f"GraphQL: {r['errors']}")
    return r["data"]

def productos(marca, clave, solo_tipo=None):
    q = f'vendor:"{marca}"'
    if solo_tipo:
        q += f' AND product_type:"{solo_tipo}"'
    cursor, out = None, []
    while True:
        d = gql("""query($q:String!,$c:String){ products(first:100, query:$q, after:$c){
            pageInfo{hasNextPage endCursor}
            nodes{ id title productType status variants(first:1){nodes{sku}} mf: metafield(namespace:"filtros", key:"%s"){ value } } } }""" % clave,
            {"q": q, "c": cursor})
        p = d["products"]
        out += p["nodes"]
        if not p["pageInfo"]["hasNextPage"]:
            return out
        cursor = p["pageInfo"]["endCursor"]

def por_sku(ruta, aplicar):
    """Valores distintos por modelo (p. ej. sacados del catálogo del proveedor)."""
    mapa = json.load(open(ruta))
    lote = []
    for sku, claves in mapa.items():
        d = gql('query($q:String!){ products(first:5, query:$q){ nodes{ id variants(first:10){nodes{sku}} } } }', {"q": f'sku:{sku}'})
        prod = next((p for p in d["products"]["nodes"] if any((v["sku"] or "").upper() == sku.upper() for v in p["variants"]["nodes"])), None)
        if not prod:
            print(f"  ⚠ {sku}: no está en Shopify"); continue
        for clave, valores in claves.items():
            lote.append({"ownerId": prod["id"], "namespace": "filtros", "key": clave, "type": "list.single_line_text_field", "value": json.dumps(valores, ensure_ascii=False)})
            print(f"  · {sku} filtros.{clave} = {valores}")
    print(f"{len(lote)} metafields en {len(mapa)} modelos")
    if not aplicar:
        print("(sin --aplicar no se cambia nada)"); return
    for i in range(0, len(lote), 25):
        d = gql("mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ metafields{ id } userErrors{ field message code } } }", {"m": lote[i:i+25]})
        err = d["metafieldsSet"]["userErrors"]
        if err:
            sys.exit(f"Shopify rechazó el lote {i//25+1}: {err}")
    print("Hecho. Recuerda: el sitio refresca el catálogo cada hora (ISR).")

def producto_por_sku(sku):
    d = gql('query($q:String!){ products(first:5, query:$q){ nodes{ id variants(first:10){nodes{sku}} } } }', {"q": f'sku:{sku}'})
    return next((p for p in d["products"]["nodes"] if any((v["sku"] or "").upper() == sku.upper() for v in p["variants"]["nodes"])), None)

def subir_archivo(url, nombre):
    """Sube un PDF a Shopify Files desde su URL pública; devuelve el GID del archivo.
    Requiere el scope write_files en la app (hoy no lo tiene: usar el MCP de Shopify)."""
    d = gql("""mutation($f:[FileCreateInput!]!){ fileCreate(files:$f){ files{ id fileStatus } userErrors{ field message code } } }""",
            {"f": [{"originalSource": url, "contentType": "FILE", "alt": nombre, "filename": nombre}]})
    err = d["fileCreate"]["userErrors"]
    if err:
        print(f"  ⚠ no se pudo subir {url}: {err}"); return None
    return d["fileCreate"]["files"][0]["id"]

def contenido(ruta, aplicar):
    mapa = json.load(open(ruta))
    for sku, c in mapa.items():
        prod = producto_por_sku(sku)
        if not prod:
            print(f"  ⚠ {sku}: no está en Shopify"); continue
        print(f"  · {sku}: descripción {len(c.get('descripcion_html',''))} chars · {len(c.get('dimensiones',[]))} dimensiones · {len(c.get('fichas',[]))} fichas")
        if not aplicar:
            continue
        if c.get("descripcion_html"):
            r = gql("mutation($i:ProductUpdateInput!){ productUpdate(product:$i){ userErrors{ field message } } }",
                    {"i": {"id": prod["id"], "descriptionHtml": c["descripcion_html"]}})
            if r["productUpdate"]["userErrors"]:
                sys.exit(f"{sku} descripción: {r['productUpdate']['userErrors']}")
        mfs = []
        if c.get("dimensiones"):
            mfs.append({"ownerId": prod["id"], "namespace": "homea", "key": "dimensiones", "type": "json", "value": json.dumps(c["dimensiones"], ensure_ascii=False)})
        # La app "HOMEA Sitio Web" no tiene write_files: los PDF se suben con el MCP
        # de Shopify (fileCreate) y aquí llegan ya como GIDs en "fichas_gids".
        gids = list(c.get("fichas_gids", []))
        if c.get("fichas") and not gids:
            for i, url in enumerate(c["fichas"]):
                nombre = f"{sku.lower()}-ficha-tecnica{'-' + str(i+1) if i else ''}.pdf"
                g = subir_archivo(url, nombre)
                if g: gids.append(g)
        if gids:
            if True:
                mfs.append({"ownerId": prod["id"], "namespace": "homea", "key": "fichas_tecnicas", "type": "list.file_reference", "value": json.dumps(gids)})
        if mfs:
            r = gql("mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message code } } }", {"m": mfs})
            if r["metafieldsSet"]["userErrors"]:
                sys.exit(f"{sku} metafields: {r['metafieldsSet']['userErrors']}")
    print("Hecho." if aplicar else "(sin --aplicar no se cambia nada)")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--marca")
    ap.add_argument("--clave")
    ap.add_argument("--valor", help='Un valor, o varios separados por "|"')
    ap.add_argument("--solo-tipo")
    ap.add_argument("--por-sku", help="JSON { sku: { clave: [valores] } }")
    ap.add_argument("--contenido", help="JSON { sku: { descripcion_html, dimensiones, fichas } }")
    ap.add_argument("--aplicar", action="store_true")
    a = ap.parse_args()
    if a.por_sku:
        return por_sku(a.por_sku, a.aplicar)
    if a.contenido:
        return contenido(a.contenido, a.aplicar)
    if not (a.marca and a.clave and a.valor):
        ap.error("--marca, --clave y --valor son obligatorios (o usa --por-sku)")
    valor = json.dumps(a.valor.split("|"), ensure_ascii=False)
    todos = productos(a.marca, a.clave, a.solo_tipo)
    cambian = [p for p in todos if (p["mf"] or {}).get("value") != valor]
    print(f"{a.marca}: {len(todos)} productos, {len(cambian)} por actualizar → filtros.{a.clave} = {valor}")
    if not a.aplicar:
        for p in cambian[:8]:
            print("  ·", p["variants"]["nodes"][0]["sku"] if p["variants"]["nodes"] else "?", p["productType"], p["status"], "actual:", (p["mf"] or {}).get("value"))
        print("(sin --aplicar no se cambia nada)")
        return
    for i in range(0, len(cambian), 25):
        lote = [{"ownerId": p["id"], "namespace": "filtros", "key": a.clave, "type": "list.single_line_text_field", "value": valor} for p in cambian[i:i+25]]
        d = gql("mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ metafields{ id } userErrors{ field message code } } }", {"m": lote})
        err = d["metafieldsSet"]["userErrors"]
        if err:
            sys.exit(f"Shopify rechazó el lote {i//25+1}: {err}")
        print(f"  lote {i//25+1}: {len(lote)} productos listos")
    print("Hecho. Recuerda: el sitio refresca el catálogo cada hora (ISR).")

if __name__ == "__main__":
    main()
