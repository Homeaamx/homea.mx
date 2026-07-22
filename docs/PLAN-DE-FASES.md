# Plan de Fases — Landing HOMEA

> **Arquitectura (actualizado 2026-06-10): HEADLESS.** Front-end propio en **Next.js** publicado en **Vercel** (`www.homea.mx`); **Shopify solo como ecommerce** vía Storefront API (catálogo, carrito, checkout hospedado). Ver `CLAUDE.md §3`. Sustituye la ruta previa "TODO EN SHOPIFY".

Estado: 🔵 pendiente · 🟡 en curso · ✅ hecho

---

## ✅ Fase 0 — Descubrimiento y blindaje SEO
*La fase que evita perder posicionamiento. Va primero, sí o sí.*

- [x] **Contexto Homea** documentado (`CLAUDE.md`).
- [x] **Accesos confirmados:** GSC `https://www.homea.mx/` verificado; hoy sirve OXATIS (coexisten `homea.mx` y `homea.oxatis.com`).
- [x] **Línea base SEO:** export GSC 16 meses (~56.5k clics) → `seo-data/ANALISIS-GSC.md`; GA4 → `seo-data/ANALISIS-GA4.md`.
- [x] **Inventario de URLs** (3,358) → `seo-data/INVENTARIO-URLS.md` + borrador del **mapa 301** → `docs/PLAN-REDIRECTS-MIGRACION.md`.
- [ ] Captura competitiva HOMEA vs ARTEXA (opcional, baja prioridad).

**Entregable:** ✅ línea base SEO + inventario + mapa 301 borrador. **(Decisión Carla 2026-06-04: avanzar con lo disponible, no instrumentar OXATIS.)**

---

## ✅ Fase 1 — Estrategia de conversión y arquitectura
- [x] **Análisis** (auditoría + benchmark) → `docs/FASE1-ANALISIS-Y-SECCIONES.md`.
- [x] **Concepto + secciones por plantilla** (7 plantillas), modelo híbrido lead alto-ticket vs. compra directa.
- [x] **Design system v2** definido (bone/greige, Newsreader+Montserrat, oro champagne) → `preview/tokens-v2.css`.
- [x] Lógica **"Cotizar" (Fase 1) vs "Comprar" (Fase 2)** definida en el diseño.

**Entregable:** ✅ mapa de secciones + design system v2 + concepto.

---

## ✅ Fase 2 — Diseño navegable (preview de alta fidelidad)
- [x] **7 plantillas** construidas sobre el design system v2: home, PLP (colección), PDP (producto), B2B/Proyectos, marcas, quiénes-somos/showroom, contacto.
- [x] **Fotografía real** de marcas integrada (Sub-Zero, Wolf, Miele, Thermador, Monogram + proyectos propios) desde OneDrive → `preview/assets/photos/`.
- [x] Interacciones: hero rotativo, nav claro→oscuro, reveals, filtros, tablas de specs.
- [x] **Preview offline autocontenido** (`preview/offline/`) para revisión sin servidor.
- [ ] Ajustes finales de diseño según feedback de Carla (en curso).

> 🔁 **Recordatorio de respaldo (Carla):** aunque el sitio **aún NO está publicado**, **subir `test` → `main` de vez en cuando** (`git push origin test:main`) para mantener `main` como copia segura del avance. Hacerlo después de cada bloque de cambios del preview.

**Entregable:** ✅ preview navegable aprobado = base visual para construir el front-end. ← **AQUÍ ESTAMOS**

---

## 🟡 Fase 3 — Front-end Next.js en Vercel + SEO técnico propio
*Traducir el preview a una app real. El SEO técnico lo construimos nosotros (Shopify ya no lo da).*

### 3.1 Proyecto base
- [ ] Crear proyecto **Next.js (App Router)** partiendo de `/preview`; tokens v2 → CSS Modules/Tailwind.
- [ ] Componentizar: Nav, Hero, mega-menú, PLP, PDP, formularios, footer.
- [ ] Desplegar en **Vercel** (dominio temporal) con **SSR/SSG/ISR** (obligatorio por SEO).
- [ ] **Rendimiento de imágenes** (ver `docs/ESTRATEGIA-IMAGENES.md`): `next/image` con loader a **Shopify CDN** para producto; hero con `priority` (es el LCP); lazy-load en el resto; AVIF/WebP + `srcset`.

### 3.2 Conexión Shopify (headless)
- [ ] Crear **app personalizada / canal Headless** en Shopify → **token privado** Storefront API.
- [ ] **Proteger con contraseña** la tienda `homeashop.mx` (no indexable) — *Opción A, pendiente de activar.*
- [ ] Traer productos vía Storefront API (empezando por los 3 de prueba).

### 3.3 SEO técnico (lo construimos nosotros)
- [ ] **Redirects 301** del mapa → `next.config.js`/`vercel.json`.
- [ ] **`sitemap.xml`** propio + **`robots.txt`** propio.
- [ ] **Canónicos** y metadatos por página (Metadata API).
- [ ] **JSON-LD** (Product, BreadcrumbList, Organization, LocalBusiness/Querétaro, FAQ).

### 3.4 Tracking + leads (limpio desde día 1)
- [ ] **GA4** + **Meta Pixel/CAPI** inyectados desde el front-end (sin GTM heredado).
- [ ] Preservar audiencias de remarketing.
- [ ] **Formulario de leads → KOMMO** (API/webhook).
- [ ] Botón/flotante **WhatsApp** → `https://api.whatsapp.com/send/?phone=524461446318` (cel. 446 144 6318). **Ya implementado en el preview** en las 7 plantillas.

### 3.5 Google Ads + rastreo de clicks (conversiones) ⭐ NUEVO
*Cada clic relevante debe ser rastreable a la cuenta de Google de HOMEA.*
- [ ] Crear/instalar **GA4** y vincularlo con **Google Ads** (import de conversiones).
- [ ] Configurar **etiqueta de conversión de Google Ads** (gtag/`AW-XXXX`) en el front-end.
- [ ] **Evento `whatsapp_click` → marcar como CONVERSIÓN** en GA4 e importarlo a Google Ads. *El disparo ya está cableado en el preview (`v2.js`): cada clic de WhatsApp empuja `whatsapp_click` a `dataLayer` y a `gtag` con `data-label` (`wa_float`, `wa_contacto_directo`). Solo falta inyectar GA4/Ads para que registre.*
- [ ] Marcar también como conversión: envío de formulario (lead→KOMMO), clic en "Cotizar"/"Agendar", clic-a-llamar del teléfono de oficina.
- [ ] Verificar con **Tag Assistant / GA4 DebugView** que cada clic llega a la cuenta antes de invertir en campañas.
- [ ] Actualizar **destino de las campañas de Google Ads** a la nueva landing (`www.homea.mx` en Vercel) en el corte de migración (Fase 5).
- [ ] Marcar como conversión la **compra directa** (checkout Shopify, bajo ticket) → alimenta la **campaña de Shopping (Fase 4.6)** con valor de conversión (ROAS).

**Entregable:** front-end en Vercel (dominio temporal), conectado a Shopify, con SEO técnico y **tracking de conversiones (incl. clicks de WhatsApp) verificado en GA4 + Google Ads**.

> La cuenta de Google Ads y el tracking que se montan aquí son el **cimiento** de la **campaña de Google Shopping** descrita en la **Fase 4.6** (esa depende de tener catálogo con datos+imágenes, por eso vive en Fase 4).

---

## 🔵 Fase 4 — Catálogo, ecommerce funcional y filtros
*El ecommerce no es la venta principal, pero **DEBE funcionar bien**. Escala: **~25,000 productos**.*
*4.1 y 4.2 (datos + imágenes) pueden correr **en paralelo** desde ya (skill `homea-operaciones`).*

### 4.1 Preparación / homologación de datos
- [ ] Exportar ~25k productos (SAE/COI/OXATIS); limpiar duplicados, nomenclaturas, categorías, marcas, características, precios.
- [ ] **Marcar la moneda de cada producto (MXN vs USD)** durante la homologación → tag/metafield `moneda:USD` + metafield `precio_usd`. Shopify solo maneja una moneda de tienda (MXN), así que el precio en dólares vive en metafield y el producto USD queda **no comprable** en checkout. Alimenta la regla "USD = solo con ejecutivo" de 4.5.
- [ ] Estructurar para Shopify (CSV/Matrixify): handle, título, tipo, vendor, tags, variantes, precio, **metafields**.
- [ ] Definir la **plantilla de nomenclatura SEO de imágenes** (`marca-producto-categoria-atributo`) como parte de la homologación → alimenta 4.2.

### 4.2 Imágenes de producto ⭐ (subproyecto) — ver `docs/ESTRATEGIA-IMAGENES.md`
- [ ] Inventariar qué productos tienen imagen y cuáles no.
- [ ] Estrategia de obtención (fabricante por SKU, bancos, foto propia); **priorizar** los de mayor tráfico/venta.
- [ ] **Optimización de carga:** comprimir/redimensionar antes de subir (lado mayor ~2000px, calidad ~80); servir vía **Shopify CDN** (no por optimización de Vercel) con **WebP/AVIF**, `srcset`, lazy-load. Producto → Shopify CDN; editoriales → `next/image`.
- [ ] **Nomenclatura SEO de archivos** ⭐: nombres **descriptivos** (`marca-producto-categoria-atributo.webp`), en minúsculas con guiones, sin acentos, alineados a **trends de búsqueda** (validar vocabulario con Google Trends/keyword research) para aparecer en Google Images y búsquedas por tema. Generados **programáticamente** desde los datos homologados (4.1). Acompañar con `alt` descriptivo.
- [ ] Carga y asignación en Shopify.

### 4.3 Import a Shopify + consumo headless
- [ ] Carga masiva (Shopify MCP / Matrixify); validación de integridad.
- [ ] Consumo por **Storefront API** con **ISR / on-demand revalidation** (no se construyen 25k de golpe).

### 4.4 Filtros / navegación facetada ⭐
- [ ] Taxonomía: **tipo, marca, características** (medidas, color, panelable, combustible, etc.).
- [ ] Implementar con metafields/tags de Shopify + lógica de filtros en el front-end. Filtros **precisos por categoría**.
- [ ] **Filtros específicos por subcat.2** ⭐ (pendiente desde 2026-07-22): las páginas de subcat.1 de Cocina y Bar (`/productos/cocina-y-bar/<sub>`) ya existen con filtros a nivel subcat.1 y deep-link `?tipo=<subcat.2>`; falta definir e implementar el **set de filtros propio de cada subcat.2** (p. ej. Refrigeradores: estilo French Door/Duplex/Bottom Mount, panelable; Campanas: tipo de instalación y capacidad de extracción; Tarjas: nº de tazones). Se trabaja al conectar Shopify Search & Discovery / Storefront API, subcat.2 por subcat.2, partiendo de las fichas de tipo de `GUIAS/taxonomia-guias.json` (campo `filtros`) y de `docs/PATRON-FICHAS-TIPO.md`. Replicar después en las demás macrocategorías.

### 4.5 Lógica comercial y checkout
- [ ] **"Cotizar" vs "Comprar"** por colección/etiqueta.
- [ ] **Checkout hospedado en Shopify** para bajo ticket (cart → checkout URL).
- [ ] **Definir cómo se cotiza cada caso** ⭐: (a) MXN bajo ticket → compra directa en checkout; (b) MXN alto ticket → CTA "Cotizar" → lead/WhatsApp; (c) **USD → si o sí pasa con un ejecutivo, sin excepción**. Identificar los productos USD viene de la homologación (4.1, tag `moneda:USD`).
- [ ] **Productos en USD → SIEMPRE con ejecutivo** ⭐: en la PDP mostrar la nota *"Este producto se cotiza en dólares (USD). El tipo de cambio y el descuento los confirma tu ejecutivo de ventas"* (cláusula 6 del formato de cotización: TC Santander a la venta). Al intentar agregarlo al carrito se **intercepta** y se manda al usuario **directo a cotizar por WhatsApp** con el modelo prellenado — el vendedor revisa precio, descuento y tipo de cambio manualmente. **Un producto USD nunca llega al checkout de Shopify.**
- [ ] **Lista de cotización (wishlist → vendedor)** ⭐: el usuario arma su lista de productos y la envía directo al vendedor en **formato de cotización simplificado** — solo **modelo + título + imagen principal** por partida (versión sencilla del formato SAE). Flujo: wishlist (localStorage, ya en fase 1 en `preview/wishlist.js`) → route `/api/cotizacion` en Vercel genera el documento (XLSX/PDF con folio y fecha) → URL del documento → se comparte **automáticamente por WhatsApp al ejecutivo** junto con la lista en texto. 100% front-end + serverless: **no toca Shopify** (su carrito/checkout sigue intacto para MXN bajo ticket). Opcional: el mismo envío crea el lead en **KOMMO** vía webhook.

### 4.6 Google Shopping — Merchant Center + feed + campaña ⭐ NUEVO
*Anuncios de Shopping (las fichas con foto/precio del buscador) con **conexión directa al ecommerce**. Depende de catálogo con datos+imágenes (4.1/4.2) y del tracking de la Fase 3.5. Puede arrancar con un **set curado de productos prioritarios** antes de tener los 25k.*

**a) Infraestructura**
- [ ] Crear **Google Merchant Center** de HOMEA y **verificar/reclamar el dominio** `www.homea.mx`.
- [ ] **Vincular Merchant Center ↔ Google Ads** (la cuenta y conversiones ya montadas en Fase 3.5).
- [ ] Activar el **feed de producto desde Shopify** (canal *Google & YouTube* / Content API). ⚠️ **Clave headless:** la **URL de destino (`link`) de cada producto en el feed debe apuntar a la PDP en `www.homea.mx` (Vercel), NO al storefront `homeashop.mx`** (que va `noindex`/password). Confirmar el dominio del feed para no mandar tráfico pagado a la tienda oculta.

**b) Productos "más buscados" publicados y aprobados** (lo que pediste)
- [ ] **Priorizar el feed** con la franquicia SEO real (datos en `seo-data/ANALISIS-GSC.md`): **refrigeración panelable / built-in** (`refrigerador panelable`, `refrigeradores pareja panelables`, counter-depth, 80 cm), **marcas premium + intención de precio** (Sub-Zero, Wolf, Thermador, Monogram, Miele), **exterior** (asadores empotrables, cavas de vino) y **SKUs exactos** que ya rankean.
- [ ] Asegurar **datos de feed completos** por producto prioritario: título optimizado, **precio**, **disponibilidad**, **marca**, **GTIN/MPN**, **imagen de calidad** (de 4.2) y categoría (`google_product_category`).
- [ ] Resolver **diagnósticos/desaprobaciones** en Merchant Center hasta dejar los prioritarios **aprobados** (sin esto no se muestran).

**c) Campaña**
- [ ] Lanzar **campaña de Shopping** (o **Performance Max** con feed) en Google Ads, segmentada al set prioritario; pujas hacia **compra directa** (bajo ticket) y, donde aplique, "Cotizar" como conversión secundaria (alto ticket).
- [ ] Estructurar por **grupos de productos** (marca / categoría) para controlar puja y presupuesto.
- [ ] Loop de optimización: revisar **diagnóstico de feed + términos de búsqueda + ROAS**; ampliar cobertura del feed conforme se completa la migración de los 25k (4.3).

**Entregable:** ~25k productos consumidos por la app, con imágenes (priorizadas), **filtros precisos** y checkout operativo; **feed de Shopping vivo en Merchant Center con los productos más buscados aprobados y una campaña de Shopping/PMax activa apuntando a las PDP de `homea.mx`**.

---

## 🔵 Fase 5 — Función general, QA y lanzamiento
- [ ] **QA FUNCIONAL:** búsqueda, **filtros**, carrito, checkout, formularios→KOMMO, WhatsApp, enlaces. Todo debe funcionar de verdad.
- [ ] **QA de la regla USD → solo ejecutivo:** verificar que **ningún producto en dólares** pueda llegar al checkout de Shopify; el intercepto a WhatsApp debe funcionar en PLP, PDP y carrito.
- [ ] Responsive, accesibilidad (WCAG), **Core Web Vitals** móvil (la gran oportunidad vs OXATIS).
- [ ] **Corte de migración:** apuntar **DNS de `homea.mx` (GoDaddy) a Vercel**, activar **todos los 301**, subir **sitemap propio** a GSC, validar indexación.
- [ ] **Análisis de comportamiento con Microsoft Clarity** ⭐ NUEVO: instalar **Microsoft Clarity** (gratis) en el front-end **en el corte de lanzamiento** para que capture datos desde el día 1 — **heatmaps** (clics, scroll, áreas muertas) y **grabaciones de sesión**. Complementa GA4/Meta Pixel (que miden *qué* pasa) mostrando *cómo* navegan los usuarios. Durante el **monitoreo post-lanzamiento**, revisar: dónde abandonan, qué CTAs ("Cotizar"/WhatsApp/"Comprar") se ven y cuáles se ignoran, rage-clicks y fricción en filtros/PDP → alimenta iteración de conversión.
- [ ] **No matar OXATIS de golpe**; **monitoreo post-lanzamiento** 2–6 semanas vs. línea base.

**Entregable:** sitio en producción en `www.homea.mx` (servido por Vercel) sin pérdida de SEO, **con Microsoft Clarity capturando comportamiento desde el lanzamiento**.

---

## 🔵 Fase 6 — Contenido editorial: blogs en Guías (cadencia quincenal) ⭐ NUEVO
*Trabajo continuo: alimentar la sección **Guías** con artículos/blogs publicados de forma **quincenal** (cada 2 semanas). Refuerza la función de "guía de compra" del sitio y construye autoridad SEO orgánica sostenida.*

- [ ] **Cadencia:** publicar **un blog/guía nuevo cada 2 semanas** (quincenal) en la sección Guías (`/guias`).
- [ ] **Calendario editorial:** definir temas por quincena alineados a las macrocategorías (Cocina y Bar, Exterior, Baños, etc.) y a búsquedas reales (GSC / keywords).
- [ ] **SEO por artículo:** title/description, canónico, JSON-LD (Article/FAQ), enlazado interno a productos y otras guías, imágenes con nombres SEO.
- [ ] **Flujo de publicación:** redacción → revisión → publicación en Guías → indexación (sitemap) → difusión (redes/WhatsApp/email).
- [ ] **Medición:** seguir tráfico orgánico y conversiones (lead/WhatsApp) por guía para priorizar próximos temas.

**Entregable:** flujo editorial vivo con **publicación quincenal** en Guías; biblioteca de contenido que crece y suma SEO orgánico mes a mes.

---

## Mapeo de los 9 pasos originales de Carla

| Paso original | Fase |
|---|---|
| 1. Contexto Homea | Fase 0 ✅ |
| 2. Design system para conversión | Fase 1 ✅ |
| 3. Secciones + concepto | Fase 1 ✅ |
| 4. Layout / preview navegable | Fase 2 ✅ |
| 5. COWORK: screenshots Homea + ARTEXA | Fase 0 (opcional) |
| 6. Refinar/borrar secciones | Fase 2 ✅ |
| 7. Conectar Shopify + describir tienda | Fase 3.2 / Fase 4 |
| 8. Integrar tienda | Fase 4 |
| 9. Función general | Fase 5 |

**Alcance añadido:** front-end Next.js + integración Storefront API (Fase 3), tracking de conversiones + Google Ads (Fase 3.5), catálogo ~25k + imágenes + filtros (Fase 4), **Google Shopping: Merchant Center + feed + campaña con conexión directa al ecommerce (Fase 4.6)**, QA funcional (Fase 5). **Funcionalidad = prioridad.**
