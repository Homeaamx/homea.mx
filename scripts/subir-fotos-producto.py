#!/usr/bin/env python3
"""
Sube a Shopify las fotos que HOMEA deja en OneDrive — HOMEA

Carla deja las fotos en `FOTOS PRODUCTO/<MARCA>/<SKU>-<N>.<ext>` (OneDrive que ve
en Finder: ~/Library/CloudStorage/OneDrive-Homea 2/…; OneDrive cambia el nombre
de la carpeta al reiniciarse, así que se toma la que exista). Este script, por cada SKU:

  1. busca el producto en Shopify (Admin API, variante con ese SKU);
  2. convierte cada foto a webp (≤2000 px, q80) con nombre SEO
     `<marca>-<sku>-<titulo>-<N>.webp` y alt "<Marca> <título> (<SKU>)";
  3. la sube por stagedUploadsCreate + productCreateMedia, saltando las que ya
     estén en el producto con ese mismo nombre;
  4. deja las fotos antes de los planos (`-plano-medidas-` en el nombre).

Credenciales: .env.local (SHOPIFY_ADMIN_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID,
SHOPIFY_ADMIN_CLIENT_SECRET; client credentials de la app "HOMEA Sitio Web").

Uso:
  python3 scripts/subir-fotos-producto.py <MARCA> [SKU …] [--prueba]
    sin SKUs: todos los archivos de la carpeta de la marca.
    --prueba: dice qué subiría, sin escribir en Shopify.
"""
import io
import json
import re
import sys
import time
import unicodedata
import urllib.request
import uuid
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FOTOS = next(
    (r / "HOMEA/PAGINA WEB/PAGINA NUEVA 2026/FOTOS PRODUCTO"
     for r in sorted((Path.home() / "Library/CloudStorage").glob("OneDrive-Homea*"), reverse=True)
     if (r / "HOMEA/PAGINA WEB/PAGINA NUEVA 2026/FOTOS PRODUCTO").is_dir()),
    Path.home() / "Library/CloudStorage/OneDrive-Homea 2/HOMEA/PAGINA WEB/PAGINA NUEVA 2026/FOTOS PRODUCTO",
)
VERSION = "2026-07"


def env():
    vals = {}
    for linea in (RAIZ / ".env.local").read_text().splitlines():
        if "=" in linea and not linea.lstrip().startswith("#"):
            k, v = linea.split("=", 1)
            vals[k.strip()] = v.strip().strip('"')
    return vals


E = env()
DOMINIO = E["SHOPIFY_ADMIN_DOMAIN"]


def token():
    datos = json.dumps({
        "client_id": E["SHOPIFY_ADMIN_CLIENT_ID"],
        "client_secret": E["SHOPIFY_ADMIN_CLIENT_SECRET"],
        "grant_type": "client_credentials",
    }).encode()
    req = urllib.request.Request(f"https://{DOMINIO}/admin/oauth/access_token", datos, {"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))["access_token"]


TOKEN = token()


def gql(query, variables=None):
    req = urllib.request.Request(
        f"https://{DOMINIO}/admin/api/{VERSION}/graphql.json",
        json.dumps({"query": query, "variables": variables or {}}).encode(),
        {"Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN},
    )
    r = json.load(urllib.request.urlopen(req))
    if r.get("errors"):
        raise RuntimeError(r["errors"])
    return r["data"]


def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:70].strip("-")


def producto(sku):
    d = gql("""query($q:String!){ productVariants(first:5, query:$q){ nodes{ sku product{ id title vendor
        media(first:50){ nodes{ id ... on MediaImage{ image{ url } } } } } } } }""", {"q": f"sku:{sku}"})
    for v in d["productVariants"]["nodes"]:
        if (v["sku"] or "").upper() == sku.upper():
            return v["product"]
    return None


def webp(ruta):
    im = Image.open(ruta)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    im.thumbnail((2000, 2000), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=80, method=6)
    return buf.getvalue()


def subir(prod, sku, archivos, prueba):
    marca = prod["vendor"]
    existentes = [m["image"]["url"].split("?")[0].split("/")[-1] for m in prod["media"]["nodes"] if m.get("image")]
    base = f"{slug(marca)}-{slug(sku)}-{slug(prod['title'].split(' — ')[0])}"
    nuevos = []
    for ruta in archivos:
        n = re.search(r"-(\d+)\.\w+$", ruta.name).group(1)
        nombre = f"{base}-{n}.webp"
        if any(e.startswith(nombre[:-5]) for e in existentes):
            print(f"  ya está: {nombre}")
            continue
        nuevos.append((ruta, nombre))
    if prueba or not nuevos:
        for _, nombre in nuevos:
            print(f"  subiría: {nombre}")
        return
    blobs = [webp(r) for r, _ in nuevos]
    d = gql("""mutation($i:[StagedUploadInput!]!){ stagedUploadsCreate(input:$i){
        stagedTargets{ url resourceUrl parameters{ name value } } userErrors{ message } } }""",
            {"i": [{"resource": "IMAGE", "filename": nm, "mimeType": "image/webp", "httpMethod": "POST", "fileSize": str(len(b))}
                   for (_, nm), b in zip(nuevos, blobs)]})
    objetivos = d["stagedUploadsCreate"]["stagedTargets"]
    alt = f"{marca} {prod['title'].split(' — ')[0]} ({sku})"
    medios = []
    for (ruta, nombre), b, t in zip(nuevos, blobs, objetivos):
        limite = uuid.uuid4().hex
        cuerpo = b""
        for p in t["parameters"]:
            cuerpo += f'--{limite}\r\nContent-Disposition: form-data; name="{p["name"]}"\r\n\r\n{p["value"]}\r\n'.encode()
        cuerpo += (f'--{limite}\r\nContent-Disposition: form-data; name="file"; filename="{nombre}"\r\n'
                   f"Content-Type: image/webp\r\n\r\n").encode() + b + f"\r\n--{limite}--\r\n".encode()
        urllib.request.urlopen(urllib.request.Request(t["url"], cuerpo, {"Content-Type": f"multipart/form-data; boundary={limite}"}))
        medios.append({"originalSource": t["resourceUrl"], "alt": alt, "mediaContentType": "IMAGE"})
    r = gql("""mutation($id:ID!,$m:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$m){
        media{ id } mediaUserErrors{ message } } }""", {"id": prod["id"], "m": medios})
    err = r["productCreateMedia"]["mediaUserErrors"]
    print(f"  subidas {len(medios)}" + (f" · errores {err}" if err else ""))
    ordenar(prod["id"])


def ordenar(pid):
    """Fotos primero y planos (-plano-medidas-) al final, cuando Shopify termine de procesar."""
    for _ in range(10):
        d = gql("""query($id:ID!){ product(id:$id){ media(first:50){ nodes{ id status ... on MediaImage{ image{ url } } } } } }""", {"id": pid})
        nodos = d["product"]["media"]["nodes"]
        if all(n["status"] == "READY" for n in nodos):
            break
        time.sleep(3)

    def es_plano(n):
        return "-plano-medidas-" in ((n.get("image") or {}).get("url") or "")

    orden = [n for n in nodos if not es_plano(n)] + [n for n in nodos if es_plano(n)]
    if [n["id"] for n in orden] != [n["id"] for n in nodos]:
        gql("""mutation($id:ID!,$m:[MoveInput!]!){ productReorderMedia(id:$id, moves:$m){ userErrors{ message } } }""",
            {"id": pid, "m": [{"id": n["id"], "newPosition": str(i)} for i, n in enumerate(orden)]})


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    prueba = "--prueba" in sys.argv
    if not args:
        sys.exit(__doc__)
    carpeta = FOTOS / args[0].upper()
    skus = {s.upper() for s in args[1:]}
    por_sku = {}
    for f in sorted(carpeta.iterdir()):
        m = re.match(r"(.+)-(\d+)\.(jpe?g|png|webp)$", f.name, re.I)
        if m and (not skus or m.group(1).upper() in skus):
            por_sku.setdefault(m.group(1).upper(), []).append(f)
    for sku, archivos in por_sku.items():
        prod = producto(sku)
        if not prod and "_" in sku:
            # SKU con diagonal (KIT01609/1): el archivo la lleva como guion bajo.
            sku = sku.replace("_", "/")
            prod = producto(sku)
        print(f"{sku}: {prod['title'] if prod else 'NO ESTÁ EN SHOPIFY'}")
        if prod:
            subir(prod, sku, archivos, prueba)


if __name__ == "__main__":
    main()
