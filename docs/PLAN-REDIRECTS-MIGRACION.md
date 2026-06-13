# Plan de Redirecciones — Migración OXATIS → front-end Vercel (homea.mx)

> ⚠️ **ACTUALIZADO 2026-06-10 (pivot de arquitectura):** ya **NO** migramos a un tema Shopify, sino a un **front-end propio Next.js en Vercel** (Shopify queda solo como ecommerce vía Storefront API). El **mapeo de URLs y la lista de redirects de este doc siguen 100% válidos**; lo único que cambia es **DÓNDE se implementan**: ahora en `next.config.js` / `vercel.json`, no en la herramienta nativa de Shopify. Ventaja: **controlamos la estructura de URL destino** (no estamos forzados a `/products/`, `/collections/`).

> Objetivo: migrar las URLs actuales **sin perder posicionamiento**, redirigiendo cada URL importante a su equivalente.
> Basado en el SEO real: `seo-data/ANALISIS-GSC.md` + `seo-data/INVENTARIO-URLS.md`.

---

## 0. Decisión técnica: 301 vs 308 (mecanismo actualizado)

- **Google trata 301 y 308 igual** para SEO: ambos permanentes, ambos transfieren ranking/link equity. La única diferencia (308 conserva método POST) **no aplica** a páginas (son GET).
- **Dónde se implementan ahora (Vercel/Next.js):**
  - `next.config.js` → bloque `redirects()` (ideal para reglas con patrón/comodín y para mantenerlas versionadas en el repo). Nota: `permanent: true` emite **308**; para forzar **301** usar `statusCode: 301`.
  - `vercel.json` → array `redirects` (alternativa declarativa; `"permanent": true` = 308).
  - **Middleware** (`middleware.ts`) → solo si necesitamos lógica dinámica (lookup de un mapa grande, normalización de slugs). Para ~3.3k reglas estáticas, `next.config.js`/`vercel.json` basta.
- **DECISIÓN:** usar **301** (vía `statusCode: 301`) para el mapa de migración. SEO-equivalente a 308.
- *Ya NO aplica:* la herramienta nativa de redirects de Shopify ni el límite de 100k (eso era de la ruta "todo en Shopify", descartada).

---

## 1. SEO actual de homea.mx (lo que protegemos)

- **~56,500 clics / ~3.08M impresiones** orgánicos en 16 meses (GSC).
- **3,358 URLs** en sitemap ≈ 3,334 indexadas. (Las ~16k "no indexadas" son basura: NO se redirigen.)
- **Franquicia SEO a blindar:** refrigeración panelable/built-in premium · marcas Sub-Zero/Wolf/Monogram + "precio" · SKUs exactos · exterior (pasto, asadores, jardín) · marca + local Querétaro.
- **Tráfico concentrado:** top 10 págs = 25% · top 50 = 47% · top 175 (≥50 clics) = la mayoría.
- **Problema actual:** sitio `/Mobile/` separado y lento (CWV móvil pésimo) → la migración responsive lo corrige.

---

## 2. Estructura que Google exige para no perder posicionamiento

(Reglas obligatorias del plan; fuente: Google Search Central + best practices.)

1. **Redirección permanente server-side** (301/308). Nunca client-side/JS.
2. **Mapeo 1:1** a la página **equivalente más cercana**. ❌ Prohibido redirigir todo al home (Google lo marca como *soft 404* y pierde el ranking).
3. **Sin cadenas** (A→B→C). Siempre A→destino-final en un solo salto.
4. **Sin bucles** ni redirecciones a páginas que a su vez redirigen.
5. **Mantener los redirects activos ≥1 año** (recomendación de Google/J. Mueller); ideal: permanentes.
6. **Actualizar enlaces internos** del sitio nuevo para que apunten directo a la URL final (no depender solo del redirect).
7. **Una sola versión canónica:** `https://www.homea.mx` (consolidar http→https y no-www→www).
8. **Sitemaps:** publicar el sitemap nuevo en GSC y **mantener accesible el viejo** un tiempo para que Google recorra y vea los 301.
9. **No apagar OXATIS de golpe** hasta confirmar que los redirects funcionan.

---

## 3. Reglas de mapeo de URL (OXATIS → Shopify)

> OXATIS tiene **varios formatos**. Priorizamos redirigir los que **rankean** (los que aparecen en GSC).

| Tipo | Patrón viejo (OXATIS) | Patrón nuevo (Shopify) |
|---|---|---|
| Home | `/` y `/?pgflngid=2` | `/` |
| **Categoría** | `/{slug}-c102x{ID}?PGFLngID=2` | `/collections/{slug}` |
| **Producto (rankea)** | `/{slug}-c2x{ID}?PGFLngID=2` | `/products/{handle}` |
| **Producto (sitemap)** | `/es/product/{slug}` | `/products/{handle}` |
| Contenido | `/{slug}.htm` · `.html` | `/pages/{slug}` |
| Custom | `/PBCPPlayer.asp?ID={X}` | `/pages/...` (identificar 1 a 1) |
| Móvil | `/Mobile/{...}` | redirigir al equivalente nuevo (ya responsive) |
| PDF | `/Files/119914/{archivo}.pdf` | subir a Shopify Files → redirigir, o página equivalente |

**Cómo se obtiene el handle nuevo:** al importar el catálogo (Fase 4) Shopify asigna `handle`. Emparejamos **viejo↔nuevo por slug/SKU/título**. Lo más limpio: **forzar que el handle = slug viejo** → match casi 1:1.

⚠️ **Gotcha de query strings:** la herramienta nativa de Shopify maneja mal URLs con parámetros (`?PGFLngID=2`, `PBCPPlayer.asp?id=`). → Validar; si falla, usar **app de redirects** (manejan query strings) para esos casos.

---

## 4. Niveles de prioridad (del análisis de tráfico GSC)

| Nivel | Páginas | Trato |
|---|---|---|
| **Tier 1** | Top 10 | Manual, revisión 1 a 1, verificación post-launch inmediata |
| **Tier 2** | Top 50 (47% del tráfico) | Manual, prioritario |
| **Tier 3** | Top ~175 (≥50 clics) | Revisión cuidadosa |
| **Tier 4** | Top ~494 (≥20 clics) | 301 garantizado |
| **Tier 5** | Resto del sitemap | Reglas automáticas por patrón |

---

## 5. Redirects de máxima prioridad (Tier 1–2, borrador)

> Destino final se confirma cuando el handle exista en Shopify (Fase 4). Esto es el punto de partida.

| Old URL (path) | Clics | Tipo | → Nueva URL (propuesta) |
|---|---|---|---|
| `/` | 3,723 | Home | `/` |
| `/refrigeradores-pareja-panelables-c102x3177452` | 2,044 | Cat | `/collections/refrigeradores-pareja-panelables` |
| `/combo-pareja-3-pzas-...-frigidaire-pro-...fpru19f8wf-f-c2x19221770` | 1,875 | Prod | `/products/combo-pareja-frigidaire-pro-fpru19f8wf` |
| `/combo-pareja-3-pzas-...-electrolux-icon-...ei33ar80ws-c2x40300730` | 1,041 | Prod | `/products/combo-pareja-electrolux-icon-ei33ar80ws` |
| `/asadores-de-gas-de-empotrar-c102x3527945` | 720 | Cat | `/collections/asadores-de-gas-de-empotrar` |
| `/refrigerador-all-refrigerator-36-90-cm-...subzero-cl3650r...-c2x33108317` | 629 | Prod | `/products/subzero-cl3650r-all-refrigerator-36` |
| `/combo-pareja-...-whirlpool-...ccwsz57l18dm-c2x40419173` | 609 | Prod | `/products/combo-pareja-whirlpool-ccwsz57l18dm` |
| `/pbcpplayer.asp?id=2033184` | 540 | Custom | `/pages/...` (⚠️ identificar contenido) |
| `/pasto-artificial-c102x2874966` | 537 | Cat | `/collections/pasto-artificial` |
| `/muebles-de-jardin-c102x2874839` | 509 | Cat | `/collections/muebles-de-jardin` |
| `/refrigerador-congelador-pro-...subzero-pro4850a-c2x40016505` | 506 | Prod | `/products/subzero-pro4850a` |
| `/refrigerador-...whirlpool-whc18t521stwc-c2x41937852` | 451 | Prod | `/products/whirlpool-whc18t521stwc` |
| `/cajones-refrigerantes-c102x2875111` | 430 | Cat | `/collections/cajones-refrigerantes` |
| `/estufas-profesionales-de-48-c102x3179414` | 410 | Cat | `/collections/estufas-profesionales-48` |
| `/plantas-artificiales-c102x2875026` | 404 | Cat | `/collections/plantas-artificiales` |
| `/cavas-de-vino-refrigeradores-de-bebidas-c102x3177318` | 398 | Cat | `/collections/cavas-de-vino` |
| `/tarjas-fregaderos-sinks-c102x3171127` | 389 | Cat | `/collections/tarjas-fregaderos` |
| `/fabricas-de-hielos-c102x3177330` | 381 | Cat | `/collections/fabricas-de-hielo` |
| `/estufas-profesionales-de-60-c102x3179415` | 380 | Cat | `/collections/estufas-profesionales-60` |
| `/Files/119914/241552046510338.pdf` | 316 | PDF | subir a Shopify Files → redirigir |

---

## 6. Implementación en Shopify

1. Construir el **CSV de redirects** completo (columnas: `Redirect from`, `Redirect to`) a partir del sitemap + reglas del §3, una vez existan los handles (Fase 4).
2. Importar: **Content → Menus → View URL redirects → Import** (soporta miles; tope 100,000).
3. Casos con query string que falle el import nativo → **app de redirects**.
4. Subir PDFs que rankean a **Shopify Files** y redirigir.

---

## 7. Verificación y monitoreo (post-launch)

- [ ] **Crawl** de TODAS las URLs viejas (Screaming Frog) → confirmar que cada una da **301 → 200 en un solo salto** (sin cadenas, sin 404).
- [ ] **GSC:** vigilar cobertura, 404s y "páginas no indexadas" a diario las primeras semanas.
- [ ] Confirmar que el **sitemap nuevo** está enviado y el **viejo** sigue accesible temporalmente.
- [ ] Comparar **rankings/clics vs. línea base** (`ANALISIS-GSC.md`) 2–6 semanas.
- [ ] Tier 1–2: verificación manual URL por URL el día del corte.

---

## 8. Cuándo se ejecuta cada parte
- **Ahora (Fase 0):** este plan + reglas + Tier 1–2 borrador. ✅
- **Fase 4:** generar el CSV 1:1 completo (ya con handles de Shopify).
- **Fase 5 (corte):** importar redirects + apuntar DNS + verificar.
