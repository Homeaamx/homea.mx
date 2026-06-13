# Plan de Fases — Landing HOMEA

> **Arquitectura (actualizado 2026-06-04): TODO EN SHOPIFY** (tema Online Store 2.0 + personalización). No Next.js. Ver `CLAUDE.md §3`.

Estado: 🔵 pendiente · 🟡 en curso · ✅ hecho

---

## 🔵 Fase 0 — Descubrimiento y blindaje SEO
*La fase que evita perder posicionamiento. Va primero, sí o sí.*

- [ ] **Contexto Homea** documentado (✅ en `CLAUDE.md`).
- [ ] **Confirmar accesos:** ¿acceso a Google Search Console de homea.mx? ¿qué sirve hoy a `homea.mx` (OXATIS, proxy, otro)?
- [ ] **Auditoría SEO base:** rastreo del sitio OXATIS + export de Search Console (16 meses) + Analytics + backlinks. → llena el Playbook.
- [ ] **Inventario de URLs** y borrador del **mapa de redirecciones 301**.
- [ ] **Captura competitiva y propia (COWORK):** screenshots + descripciones de páginas HOMEA y ARTEXA. (skill `competitive-brief` + navegador)
- [ ] **Cerrar stack** y dejar el `CLAUDE.md` definitivo.

**Entregable:** Playbook de migración con la línea base llena + mapa 301 borrador + brief competitivo.

---

## 🔵 Fase 1 — Estrategia de conversión y arquitectura
- [ ] **Design system orientado a conversión** (cómo se traduce a config/CSS del tema Shopify).
- [ ] **Concepto + lista de secciones** (modelo híbrido: lead alto-ticket vs. compra directa bajo-ticket).
- [ ] **Arquitectura de información en Shopify:** mapear el contenido a la estructura nativa (`/collections/`, `/pages/`, `/products/`, `/blogs/`) y construir el **mapa 301** URL-vieja→URL-nueva.
- [ ] Definir lógica **"producto solo-lead" (botón Cotizar) vs "producto compra directa" (botón Comprar)** vía colecciones/etiquetas.

**Entregable:** mapa de secciones + estructura de URLs Shopify + mapa 301 borrador.

---

## 🔵 Fase 2 — Tema, layout y validación
- [ ] **Selección de tema Shopify** (premium + personalizable) que soporte el nivel premium y el modelo lead+compra.
- [ ] **Layout (wireframe)** de las secciones recomendadas para el segmento premium.
- [ ] **Refinar y eliminar** secciones que no aporten.
- [ ] Cierre del **layout oficial**.

**Entregable:** tema elegido + layout oficial aprobado.

---

## 🔵 Fase 3 — Construcción en Shopify + SEO técnico
- [ ] Personalizar el tema y construir las secciones con contenido real (Liquid/CSS + editor de secciones).
- [ ] **SEO técnico Shopify:** metadatos por página, **JSON-LD** (Product, LocalBusiness/Querétaro, BreadcrumbList — vía tema/app), `robots.txt` editable, **paridad de contenido**, y carga del **mapa 301** en la herramienta de Redirecciones URL.
- [ ] **Tracking limpio desde día 1 (se monta AQUÍ, no en OXATIS):**
  - [ ] Instalar **GA4** en la landing nueva.
  - [ ] Recrear pixeles/conversiones de los **2 GTM** viejos (`GTM-WS9BWXB`, `GTM-K2VNM5PH`): Meta Pixel/CAPI, conversiones Google Ads.
  - [ ] **Preservar audiencias de remarketing** (que el pixel siga disparando para no perderlas).
  - [ ] Analítica nativa de Shopify.
- [ ] **Formulario de leads** (app de formularios) → KOMMO.

> **Decisión Carla (2026-06-04):** NO se instrumenta el sitio OXATIS actual (ni GA4 ni limpieza de GTM). El esfuerzo de tracking se concentra aquí, en la landing nueva. Se trabaja con la información ya disponible (inventario + línea base GSC).

**Entregable:** tienda funcional en el dominio temporal de Shopify (sin publicar el dominio aún).

---

## 🔵 Fase 4 — Catálogo, ecommerce funcional y filtros
*El ecommerce no es la venta principal, pero **DEBE funcionar bien**. Escala: **~25,000 productos**.*
*Nota de calendario: 4.1 y 4.2 (datos + imágenes) son trabajo de operaciones que puede correr **en paralelo** desde ya, sin esperar al tema.*

### 4.1 Preparación / homologación de datos (skill `homea-operaciones`)
- [ ] Exportar los ~25,000 productos de la fuente actual (SAE / COI / OXATIS).
- [ ] Limpiar y normalizar: **duplicados, nomenclaturas, categorías, marcas, características, precios**.
- [ ] Estructurar para import a Shopify (CSV/Matrixify): handle, título, tipo, marca (vendor), tags, variantes, precio, **metafields de características**.

### 4.2 Imágenes de producto ⭐ (subproyecto)
- [ ] Inventariar qué productos YA tienen imagen y cuáles **no**.
- [ ] Estrategia de obtención: fuentes de fabricante/marca por SKU, bancos de imagen, fotos propias.
- [ ] **Priorizar** imágenes de los productos de mayor tráfico/venta primero.
- [ ] Carga y asignación a cada producto en Shopify.

### 4.3 Import a Shopify
- [ ] Crear/configurar la tienda + conexión oficial (guiada).
- [ ] Carga masiva: productos, variantes, precios, colecciones (Shopify MCP / app tipo Matrixify).
- [ ] Validación de integridad (conteos, precios, imágenes, duplicados).

### 4.4 Filtros / navegación facetada ⭐
- [ ] Definir taxonomía de filtros: **tipo de producto, marca, características** (capacidad, medidas, color, panelable/no, combustible, etc.).
- [ ] Implementar vía **metafields + tags + Shopify Search & Discovery** (o app de filtros).
- [ ] Filtros **precisos por categoría**, no genéricos.

### 4.5 Lógica comercial y checkout
- [ ] Lógica **"Cotizar" (lead alto ticket) vs "Comprar" (bajo ticket)** por colección/etiqueta.
- [ ] Apps: formularios→KOMMO, WhatsApp.
- [ ] Checkout funcional para bajo ticket.

**Entregable:** ~25k productos cargados, con imágenes (priorizadas), **filtros precisos** y checkout operativo.

---

## 🔵 Fase 5 — Función general, QA y lanzamiento
- [ ] **QA FUNCIONAL (no solo visual):** búsqueda, **filtros**, carrito, checkout, formularios→KOMMO, WhatsApp, enlaces internos. Todo debe funcionar de verdad.
- [ ] Función general, responsive, accesibilidad (WCAG), **Core Web Vitals** (móvil).
- [ ] **Corte de migración:** apuntar el **DNS de `homea.mx` (GoDaddy) a Shopify**, activar **todos los 301** en Redirecciones URL, confirmar sitemap de Shopify en GSC, validar indexación.
- [ ] **No matar OXATIS de golpe** durante la transición.
- [ ] **Monitoreo post-lanzamiento** 2–6 semanas vs. línea base.

**Entregable:** sitio en producción en `www.homea.mx` (servido por Shopify) sin pérdida de SEO.

---

## Mapeo de los 9 pasos originales de Carla

| Paso original | Fase |
|---|---|
| 1. Contexto Homea | Fase 0 |
| 2. Design system para conversión | Fase 1 |
| 3. Secciones + concepto | Fase 1 |
| 4. Layout vacío sugerido | Fase 2 |
| 5. COWORK: screenshots Homea + ARTEXA | Fase 0 (adelantado) |
| 6. Refinar/borrar secciones | Fase 2 |
| 7. Conectar Shopify + describir tienda | Fase 4 |
| 8. Integrar tienda inicial | Fase 4 |
| 9. Función general | Fase 5 |

**Alcance añadido (no estaba en los 9 pasos originales):** catálogo ~25k productos, obtención de imágenes, filtros facetados (Fase 4) y QA funcional (Fase 5). **Funcionalidad = prioridad.**
