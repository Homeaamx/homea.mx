#!/usr/bin/env python3
"""Pone un metafield de filtro (filtros.<clave>) a TODOS los productos de una marca.

Uso:
  python3 scripts/shopify-metafield-marca.py --marca Gaggenau --clave garantia --valor "5 años" [--solo-tipo Refrigeradores] [--aplicar]
  python3 scripts/shopify-metafield-marca.py --por-sku valores.json [--aplicar]
      valores.json = { "RVY497790": { "acabado": ["Panelable"], "fabrica_hielos": ["Sin despachador"] }, ... }

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--marca")
    ap.add_argument("--clave")
    ap.add_argument("--valor", help='Un valor, o varios separados por "|"')
    ap.add_argument("--solo-tipo")
    ap.add_argument("--por-sku", help="JSON { sku: { clave: [valores] } }")
    ap.add_argument("--aplicar", action="store_true")
    a = ap.parse_args()
    if a.por_sku:
        return por_sku(a.por_sku, a.aplicar)
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
