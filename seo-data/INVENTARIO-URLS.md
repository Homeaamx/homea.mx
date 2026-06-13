# Inventario de URLs — OXATIS (homea.mx)

Fuente: `Sitemap.asp?AccID=119914&LangID=2` → guardado en `sitemap-oxatis.xml` + lista limpia en `urls-oxatis.txt`.
Generado: 2026-06-04.

## Total: 3,358 URLs canónicas
✅ Coincide casi exacto con las **3,334 páginas indexadas** que reporta GSC → **el sitemap ES el inventario real** de lo que importa. Las 16,331 "no indexadas" son basura (parámetros/filtros) que NO van al sitemap y **NO se migran**.

## Desglose por tipo y patrón de URL

| Tipo | Cantidad | Patrón OXATIS | Destino Shopify |
|---|---|---|---|
| Home | 1 | `/?pgflngid=2` | `/` |
| **Productos** | ~3,299 | `/es/product/{slug}` | `/products/{handle}` |
| **Categorías** | 68 | `/{slug}-c102x{ID}?PGFLngID=2` | `/collections/{handle}` |
| Páginas contenido | ~20 | `.htm` / `.html` (contacto, garantías, quiénes-somos, marcas, catálogo, formas-de-pago, etc.) | `/pages/{handle}` |
| Páginas custom | 11 | `PBCPPlayer.asp?ID=...` | `/pages/...` o sección |
| Blog | 0 en sitemap | (la canónica de Blog estaba activa, pero no hay artículos en el sitemap; "noticias.htm" parece la sección de noticias) | revisar |

## 🟢 Buena noticia: el mapa 301 será LIMPIO
Los **productos ya tienen slugs legibles** (`/es/product/parrilla-gas-acros-30-...`). El handle de Shopify será casi idéntico → redirección directa:
- `/es/product/{slug}` → `/products/{slug}`
- `/{slug}-c102x{ID}` → `/collections/{slug}`
- `*.htm` → `/pages/{handle}`

→ Se puede automatizar gran parte del mapa con reglas + ajustes manuales para las URLs de más tráfico.

## ⚠️ Hallazgos adicionales
- **Sitio móvil separado:** hay 3,226 URLs alternas bajo `/Mobile/` (patrón m-dot vía `xhtml:link`). Es la causa principal del Core Web Vitals móvil pésimo. → Shopify responsive de una sola URL **elimina** este problema.
- **Slugs sucios en algunos productos:** ej. `emd8010estufamabecassette30`, `io8030hi0hornoio_mabegas80cm...` (SKU pegado sin separadores). Mappables, pero en Shopify conviene regenerar handles limpios + 301.
- **Parámetro `?PGFLngID=2`** (idioma español) en muchas URLs — se ignora en el destino Shopify.

## Próximo paso para priorizar el mapa 301
Cruzar estas 3,358 URLs con el **tráfico/clics de GSC (Performance, 16 meses)** para saber **cuáles son las URLs de oro** (las que más tráfico traen) y mapearlas con cuidado prioritario.
