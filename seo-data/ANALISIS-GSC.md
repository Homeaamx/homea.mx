# Análisis SEO — Línea base Google Search Console (16 meses)

Fuente: `gsc-export-2026-06-04/` · Periodo: ~16 meses hasta 2026-06-04.
**Esta es la línea base oficial. Contra estos números se mide el éxito de la migración.**

## Totales (todo el sitio, 16 meses)
- **Clics orgánicos:** ~56,526
- **Impresiones:** ~3,084,446
- Las **top 1,000 páginas concentran ~88%** de los clics (el resto es cola larga).

## 📱 Hallazgo clave: el móvil te está costando dinero
| Dispositivo | Clics | Impresiones | CTR | Posición media |
|---|---|---|---|---|
| Desktop | 30,233 | 1,354,305 | **2.23%** | 14.25 |
| Mobile | 25,871 | 1,714,610 | **1.51%** | 10.15 |
| Tablet | 422 | 15,531 | 2.72% | 7.88 |

**Lectura:** en móvil tienes **MÁS impresiones y MEJOR posición** que en desktop… pero **peor CTR y menos clics**. Traducción: Google te muestra en móvil, la gente te ve, pero **no entra (o rebota)** por la mala experiencia móvil. Es pérdida directa de tráfico. → El rebuild móvil de Shopify ataca justo esto.

## 🎯 Concentración de tráfico → niveles de prioridad para el mapa 301
| Nivel | Páginas | % de clics | Trato |
|---|---|---|---|
| Top 10 | 10 | 25% | Manual, máximo cuidado |
| Top 50 | 50 | 47% | Manual, prioritario |
| Top 175 (≥50 clics) | 175 | ~mayoría | Revisión cuidadosa |
| Top 494 (≥20 clics) | 494 | grueso del tráfico | 301 garantizado |
| Resto (≥10 clics: 927) | cola | — | Reglas automáticas |

→ **Estrategia 301:** mapear con cuidado manual el top ~175–500; el resto por reglas de patrón (`/es/product/{slug}` → `/products/{slug}`, etc.).

## 🏆 Tu "franquicia SEO" — lo que NO podemos perder
Tu fuerza orgánica está clarísima:

1. **Refrigeración panel-ready / built-in premium** ← tu joya
   - `refrigerador panelable` (965 clics), `refrigeradores panelables`, `refrigerador panelable whirlpool/mexico`
   - Categoría top: `refrigeradores-pareja-panelables` (2,044 clics)
   - `refrigerador counter depth`, `refrigerador 80 cm ancho`, combos pareja refri+congelador
2. **Marcas premium + "precio" (alta intención de compra)**
   - `refrigerador sub-zero (pro 48) precio`, `parrilla wolf precio`, `estufa wolf`, `estufa monogram precio`
3. **SKUs exactos** (gente busca el modelo) → estas páginas de producto DEBEN mapearse 1:1
   - `fpru19f8wf`, `ccwsz57l18dm`, `whc18t521stwc`, `prf0173669`, `ei33ar80ws`, `cgu366p2ts1`, `jx160`
4. **Exterior / jardín y otros**
   - `pasto sintetico queretaro`, `asador de gas empotrable`, `asadores queretaro`, `muebles de jardin`, `campana downdraft`, `lavavajillas panelable`, `cavas de vino`, `gemelos electrolux/frigidaire`
5. **Marca + local:** `homea` (3,113), `homea queretaro` (239) → confirma fuerza de marca y relevancia local (Querétaro).

## ⚠️ Páginas atípicas a vigilar
- **Home** = la página #1 (3,723 clics). Mapeo obvio pero crítico.
- **PDF rankeando:** `Files/119914/...pdf` (316 clics) — un catálogo PDF trae tráfico. Hay que reubicarlo/redirigirlo en Shopify.
- **Página custom** `pbcpplayer.asp?id=2033184` (540 clics) — identificar qué es y mapearla con cuidado (es de las top).

## Implicaciones más allá del 301
- **Fase 1 (IA/contenido):** la arquitectura del sitio nuevo debe poner al frente **refrigeración panelable + marcas premium**, que es lo que ya te posiciona.
- **Conversión:** las búsquedas con "precio" + SKU son de alta intención → ideales para CTAs de "Cotizar" (lead) y fichas de producto fuertes.
- **Local:** reforzar SEO local de Querétaro (LocalBusiness schema, Google Business Profile).
