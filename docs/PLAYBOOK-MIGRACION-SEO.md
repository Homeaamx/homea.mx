# Playbook de Migración SEO — OXATIS → Next.js (homea.mx)

**Principio rector:** capturar el "antes" ANTES de tocar nada, y que **cada URL vieja tenga un destino**.
Conservamos el dominio `homea.mx` (no es cambio de dominio → no requiere "Change of Address" en GSC).

Marca cada ítem: ⬜ pendiente · 🟨 en curso · ✅ hecho · ⛔ no aplica

---

## Bloque 1 — Capturar la línea base (Fase 0) ★ lo más crítico

- ⬜ **Rastreo completo del sitio OXATIS** (Screaming Frog o similar): URL, título, meta description, H1, código de estado, canónico.
- ✅ **Export de Google Search Console** (16 meses): en `seo-data/gsc-export-2026-06-04/` + análisis en `seo-data/ANALISIS-GSC.md`. **Línea base: ~56,526 clics / ~3.08M impresiones.** Franquicia SEO = refrigeración panelable + marcas premium (Sub-Zero/Wolf/Monogram) + SKUs + exterior. Móvil con CTR bajo pese a mejor posición (oportunidad).
- ⬜ **Export de Analytics:** páginas de mayor tráfico + rutas de conversión.
- ✅ **Listado de URLs indexadas:** sitemap OXATIS descargado → **3,358 URLs** (≈ 3,334 indexadas en GSC). Inventario en `seo-data/INVENTARIO-URLS.md`. Desglose: ~3,299 productos, 68 categorías, ~20 páginas contenido, 11 custom. Productos con slugs limpios → mapa 301 directo.
- ⬜ **Perfil de backlinks** (Ahrefs/Semrush o enlaces de GSC): identificar páginas con autoridad para protegerlas con prioridad.
- ⬜ **Baseline de Core Web Vitals / velocidad** para comparar post-lanzamiento.

## Bloque 2 — Mapa de URLs y redirecciones 301 ★ el corazón

- ⬜ Mapa **1:1**: URL vieja → URL nueva, con **301 permanente**.
- ⬜ **Conservar estructura de URL idéntica** donde se pueda (headless lo permite).
- ⬜ Unificar: `www`/sin-www, `http`→`https`, trailing slash → una sola versión canónica.
- ⬜ **Sin cadenas de redirect** (A→B→C ✗; siempre A→C).
- ⬜ Páginas retiradas → redirigir a categoría más cercana. **Nunca 404 masivo ni todo al home** (soft 404).
- ⬜ Redirigir también las URLs del sitemap viejo.

## Bloque 3 — Paridad de contenido

- ⬜ Conservar/mejorar **title tags, meta descriptions, H1** (no eliminar).
- ⬜ **No recortar contenido** de páginas que rankean (respetar profundidad/word count).
- ⬜ Preservar **alt text** e idealmente nombres de archivo de imágenes.
- ⬜ Replicar el **enlazado interno** que funciona.

## Bloque 4 — SEO técnico en el sitio nuevo (Fase 3)

- ⬜ `sitemap.xml` + envío a GSC.
- ⬜ `robots.txt` correcto.
- ⬜ Etiquetas **canónicas**.
- ⬜ **JSON-LD:** `Product`+`Offer`, `LocalBusiness` (showroom Querétaro), `BreadcrumbList`, `Organization`.
- ⬜ HTTPS/SSL, mobile-first, paginación.

## Bloque 5 — Dominio e infraestructura

- ⬜ **Conservar `homea.mx`** (no cambiar dominio).
- ⬜ Plan de corte DNS/hosting.
- ⬜ Aprovechar **Cloudflare** para redirects en edge + caché.
- ⬜ Definir subdominio de checkout Shopify (`checkout.homea.mx`).

## Bloque 6 — El corte / launch (Fase 5)

- ⬜ Staging con **`noindex`** (NO dejar que Google indexe pruebas).
- ⬜ Publicar los **301 en el mismo momento** del go-live.
- ⬜ **Enviar sitemap nuevo a GSC** y pedir indexación de páginas top.
- ⬜ **No matar OXATIS de golpe**: mantener redirigiendo durante transición.
- ⬜ Verificar propiedad en GSC y Bing Webmaster.

## Bloque 7 — Monitoreo post-lanzamiento (semanas 1–4)

- ⬜ Revisar errores de rastreo, cobertura y 404 en GSC (casi diario al inicio).
- ⬜ Comparar rankings y tráfico vs. línea base (Bloque 1).
- ⬜ Re-rastrear: confirmar que todos los 301 disparan y sin cadenas.
- ⬜ Asumir fluctuación temporal; recuperación típica 2–6 semanas.

## Bloque 8 — Específico de ecommerce / OXATIS

- ⬜ Páginas de **producto que rankean**: mapeo individual cuidadoso.
- ⬜ **Reseñas/ratings**: migrar (señal SEO + conversión).
- ⬜ **Blog/contenido**: migrar con sus URLs.
- ⬜ **Google Business Profile**: NAP (nombre, dirección, teléfono) idéntico al del sitio → refuerza SEO local Querétaro.

---

## Infraestructura confirmada

- **DNS:** `homea.mx` está en **GoDaddy** (Carla controla el DNS → verificación de GSC vía TXT es viable).
- **Sitio servido por:** **OXATIS**.
- **Dominios coexisten:** `homea.mx` y `homea.oxatis.com` están vivos a la vez.

### ⚠️ Riesgo detectado: contenido duplicado en dos dominios
Si `homea.mx` y `homea.oxatis.com` sirven el mismo contenido, Google puede estar dividiendo la autoridad o rankeando uno y no el otro.
**Acción Fase 0:** averiguar **qué dominio rankea realmente** (GSC + `site:` de cada uno) antes del mapa 301. Destino final = `www.homea.mx`; `homea.oxatis.com` deberá redirigir ahí al cierre.

### ✅ CORRECCIÓN: GSC SÍ trae histórico (hasta 16 meses)
Al verificar, Search Console **mostró datos retroactivos** (Google los guarda por sitio aunque no estuvieras verificada). **Tenemos línea base de inmediato** — no hay que esperar a acumular. (Corrige la advertencia previa.)

### 🔎 Hallazgos GSC al verificar (línea base disponible YA)
- **~11,075 clics** de búsqueda orgánica en la ventana visible (~3 meses). Tendencia estable. → Exportar **16 meses completos** para la línea base real.
- ⚠️ **ÍNDICE INFLADO / problema grave de calidad de URLs:** **16,331 páginas NO indexadas** vs **3,334 indexadas** (~17% indexado). OXATIS genera miles de URLs basura/duplicadas (variantes `.asp?ID=`, filtros). → El sitio nuevo debe tener estructura **limpia y delgada**. Mapear con 301 **solo las 3,334 indexadas + las de mayor tráfico**; las 16K basura NO se migran (salvo las que tengan backlinks/tráfico).
- ⚠️ **Core Web Vitals MÓVIL = PÉSIMO:** 1,205 URLs en "Poor", **0 en Good** en móvil. Desktop sí está bien (1,169 Good). Como Google indexa *mobile-first*, esto **limita tu ranking hoy**. → El rebuild en Next.js es una **oportunidad enorme** de ganar posiciones solo por velocidad móvil.
- ✅ **HTTPS:** 100% (1,252 URLs HTTPS, 0 sin HTTPS).
- ⚠️ **OXATIS NO tiene sitemap activo** ("Ningún archivo Sitemap disponible"). → Generar uno (botón "Añadir archivo SiteMap") y enviarlo a GSC. Sirve también como inventario de URLs.

## 🔎 Hallazgos del Módulo `<HEAD>` de OXATIS (auditoría tracking)

Extraído del HEAD de la página de inicio. **Crítico para no perder tracking ni conversiones al migrar:**

- ⚠️ **Ya existe una propiedad GSC previa.** Hay un `google-site-verification` antiguo (`YA886D_6IML6wj0IbD06OmYY_Lvt1gsExCsFCfkQawQ`) distinto al nuevo de Carla → **alguien verificó GSC antes**.
  - **CORRECCIÓN:** GSC retiene **máximo 16 meses** para CUALQUIER propiedad. La propiedad nueva de Carla ya trajo esos 16 meses → **NO hay histórico extra que recuperar.** El valor de hallar la cuenta antigua es de **control/acceso** (puede tener ligados los GTM, Google Ads) y, si es propiedad "Dominio", mayor cobertura de variantes de URL — no más profundidad temporal. Prioridad: baja.
- ⚠️ **Universal Analytics (UA) muerto.** Está instalado `ga('create', 'UA-91011833-1')` — pero UA dejó de procesar datos en **julio 2023** y Google borró las propiedades UA en 2024. **No sirve.** Por eso falló la verificación por Analytics.
- ⚠️ **NO hay GA4.** → Hay que instalar GA4 cuanto antes para empezar a juntar línea base del sitio actual.
- ⚠️ **DOS contenedores Google Tag Manager:** `GTM-WS9BWXB` y `GTM-K2VNM5PH`. Redundante/sospechoso. → Auditar qué pixeles/conversiones viven en cada uno (Meta Pixel, Google Ads, etc.) antes de migrar; el tracking real puede estar ahí.
- Recursos externos en HEAD: animate.css, bootstrap-icons (cdnjs/jsdelivr).

## Decisiones abiertas (resolver en Fase 0)

1. ✅ ~~¿Qué sirve hoy a `homea.mx`?~~ → GoDaddy (DNS) + OXATIS (sitio); coexisten `homea.mx` y `homea.oxatis.com`.
2. ✅ ~~¿Existe propiedad GSC previa?~~ → **SÍ** (verificación `YA886D...` en el HEAD). Recuperar acceso a esa cuenta = recuperar histórico.
3. ✅ ~~¿Existe blog?~~ → SÍ (URL canónicas para Blog activas en OXATIS).
4. ⬜ ¿Hay reseñas de producto que debamos migrar?
5. ⬜ ¿Quién tiene la cuenta Google con la propiedad GSC antigua y los contenedores GTM?
