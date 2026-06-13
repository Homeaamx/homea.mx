# HOMEA — Landing Page Oficial

> Documento maestro del proyecto. Claude Code lo lee automáticamente al iniciar.
> Mantener actualizado. Los detalles viven en `/docs`.

---

## 1. Qué es HOMEA

Empresa mexicana que **vende y distribuye electrodomésticos y equipamiento premium de alta gama** para el hogar. Segmento de **lujo accesible**, con marcas como **Viking, Wolf, Sub-Zero, Miele, Thermador y Monogram**. Tiene **showroom físico** (Querétaro) y un **equipo comercial consultivo**.

**Modelo de negocio (híbrido):** el cliente descubre el producto en digital, pero la mayoría de las **ventas de ticket alto se cierran por WhatsApp o en visita al showroom**, no en el ecommerce. El sitio actual (OXATIS) es funcional pero anticuado y sin optimización de conversión.

## 2. Qué estamos construyendo

Una landing page moderna con **dos objetivos simultáneos**:
1. **Capturar leads** para los ejecutivos de ventas (objetivo primario, ticket alto).
2. **Permitir compra directa** de productos de menor ticket (ecommerce secundario, pero **debe funcionar correctamente**).

**Escala del catálogo:** ~**25,000 productos** listos para exportar → es una **migración de catálogo seria**, no solo una landing. Implica: preparación/homologación de datos, **obtención de imágenes por producto**, import masivo a Shopify y **filtros precisos** (tipo, marca, características).

**Principio rector de producto:** la **funcionalidad es prioridad, no solo el diseño**. Búsqueda, filtros, carrito, formularios y velocidad deben funcionar impecablemente. "Bonito pero roto" no es aceptable.

## 3. Decisión de arquitectura — HEADLESS: FRONT-END PROPIO EN VERCEL + SHOPIFY SOLO ECOMMERCE (actualizado 2026-06-10)

**Decisión de Carla:** se construye un **front-end propio** (Next.js) que diseñamos aquí, se **publica en Vercel** sobre el dominio `www.homea.mx`. **Shopify se usa únicamente como motor de ecommerce** (catálogo, inventario, carrito y checkout) consumido vía **Storefront API (GraphQL)**. El contenido editorial, el diseño y las páginas de captación de leads viven en el front-end propio.

> ⚠️ Este apartado SUSTITUYE la decisión previa ("TODO EN SHOPIFY", 2026-06-04). Volvemos a la ruta **headless** que se planteó originalmente. Toda mención a "tema Shopify / Liquid / Online Store 2.0" en docs viejos queda **obsoleta**.

**Por qué headless en Vercel es MEJOR para el SEO (regla de oro):**
- **URLs 100% bajo nuestro control:** ya no estamos forzados a `/products/`, `/collections/`, `/pages/`. Podemos **conservar/replicar rutas limpias** y decidir el mapa de migración a conveniencia → menos riesgo de perder equity de URL.
- **Core Web Vitals de primera:** Next.js + Vercel (edge, `next/image`, SSG/ISR) supera por mucho el desempeño móvil de OXATIS (hoy 0 URLs "Good" en móvil). La oportunidad de ranking por velocidad **se maximiza**.
- **Control total de SEO técnico:** metadatos por página (title/description), **canónicos**, **JSON-LD** (Product, BreadcrumbList, Organization, FAQ) → rich results.

**Lo que AHORA debemos construir nosotros (Shopify ya no lo da gratis) — checklist crítico SEO:**
1. **Renderizado SSR/SSG/ISR (NO client-only).** Las páginas de producto y categoría deben servir HTML con contenido ya renderizado para que Googlebot las indexe. Esto es el riesgo #1 del headless → se mitiga con Next.js (App Router) + SSG/ISR.
2. **Redirects 301** del mapa de migración → en `next.config.js` / `vercel.json` (o middleware). Nota: Next.js con `permanent:true` emite **308**; se puede forzar `statusCode:301`. Google trata 301≈308 igual.
3. **`sitemap.xml` propio** (App Router `sitemap.ts` o `next-sitemap`) y **`robots.txt` propio**.
4. **Canónicos por página** (Metadata API de Next.js).
5. **Storefront de Shopify NO indexable:** la tienda `homeashop.mx` debe quedar **con password / `noindex`** para que NO compita con `homea.mx` (evitar contenido duplicado). El checkout vive en dominio Shopify y va `noindex` por defecto.

**Flujo de datos:** productos viven en Shopify → se consumen por **Storefront API** en build (SSG/ISR) o request (SSR). Para ~25k productos se usa **ISR / on-demand revalidation** (no se construyen los 25k de golpe). El **checkout permanece en Shopify** (hospedado), lo cual es correcto y no afecta SEO.

**Trade-off a vigilar:** más piezas que mantener (front-end + integración API) vs. un solo sistema. Lo asumimos a cambio de control de diseño, velocidad y SEO.

## 4. Stack técnico

- **Front-end:** **Next.js (App Router)** con renderizado **SSR/SSG/ISR** (obligatorio por SEO). Diseñado aquí, partiendo del preview en `/preview`.
- **Hosting:** **Vercel** (edge network, `next/image`, despliegue continuo).
- **Ecommerce (backend):** **Shopify** vía **Storefront API (GraphQL)** — catálogo, inventario, carrito y **checkout hospedado en Shopify**. Tienda: `homeashop.mx` (queda `noindex`/password, no compite en búsqueda).
- **Diseño:** tokens del design system (`tokens.css`) → CSS/estilos del front-end (CSS Modules o Tailwind, por definir).
- **Formularios/leads:** formulario propio en el front-end → **KOMMO** (API/webhook).
- **Lead alto-ticket vs compra directa:** lógica en el front-end + tags/colecciones de Shopify → botones "Cotizar" (Fase 1) vs "Comprar" (Fase 2, controlado).
- **WhatsApp:** botón/flotante propio.
- **CRM / leads:** KOMMO
- **Infra/DNS:** GoDaddy (DNS) → **apuntar `www.homea.mx` a Vercel** (CNAME/A). Shopify queda como API + checkout.
- **Analítica:** GA4 + Meta Pixel/CAPI, **inyectados desde el front-end** (tracking limpio, sin GTM heredado).
- **SEO técnico (propio):** `sitemap.ts`, `robots.txt`, canónicos (Metadata API), JSON-LD, redirects 301 en `next.config.js`/`vercel.json`.
- **Dominio:** `www.homea.mx` (se conserva — activo de autoridad SEO).

## 5. Design System — v2 (junio 2026, handoff de claude.ai/design)

**Versión vigente: v2.** Tokens en `preview/tokens-v2.css` (copiados del handoff). Sistema: superficies **bone `#F7F3EC` / greige `#ECEAE3` / espresso `#1E1914` / negro `#0A0A0A`**; acento único **oro champagne `#BD9B5E`** (`#76603B` para texto AA); tipografía **Newsreader (serif, display/H1/H2, con un acento en itálica) + Montserrat (UI, eyebrows 600/13px/0.22em)**; esquinas vivas (radius 0); doctrina de **precisión** (cifras tabulares, tablas `.spec`, sistema `·`); motion contenido (reveals 700ms, lift −4px, subrayado flecha 28→44px).
- Carpeta v1 (obsoleta como referencia visual): `/Users/carlaarteaga/Documents/Homea Design System`.
- Fotografía real de marcas: `/Users/carlaarteaga/Library/CloudStorage/OneDrive-Homea/HOMEA ONE DRIVE/PUBLICIDAD/DISEÑO 2026/FOTOS MARCAS/` (curadas y optimizadas en `preview/assets/photos/`).
**No inventar colores, tipografías ni espaciados fuera de los tokens v2.**

## 6. Regla de oro del proyecto: NO PERDER SEO

Migramos de OXATIS → Next.js conservando el dominio `homea.mx`. El riesgo #1 es perder el posicionamiento orgánico. Toda decisión de URLs, contenido y publicación se valida contra el **Playbook de Migración SEO** (`docs/PLAYBOOK-MIGRACION-SEO.md`). Capturar la línea base ANTES de construir.

## 7. Documentos del proyecto

- `docs/PLAN-DE-FASES.md` — las 6 fases y su estado.
- `docs/PLAYBOOK-MIGRACION-SEO.md` — checklist accionable de migración (la columna vertebral SEO).
- `docs/PLAN-REDIRECTS-MIGRACION.md` — plan de redirects 301 (estructura Google, reglas de mapeo, Tier 1–2).
- `docs/FASE1-CONCEPTO-Y-SECCIONES.md` — concepto + arquitectura de secciones de la landing.
- `docs/FASE1-ANALISIS-Y-SECCIONES.md` — análisis (auditoría+benchmark) + secciones por plantilla (7 plantillas).
- `auditoria-sitio-actual/` y `benchmark-competencia/` — auditoría del sitio actual + benchmark de competencia/proveedor.
- `wireframe/` — esqueleto vacío (HTML) por plantilla: home, PLP, PDP, B2B, marcas, quiénes-somos/showroom, contacto.
- `preview/` — **diseño navegable de alta fidelidad** (7 plantillas) sobre el design system real; **base para construir el front-end Next.js** (no un tema Shopify). Abrir `preview/home.html`.
- `seo-data/` — datos reales: inventario URLs, análisis GSC y GA4, exports.
- `docs/SKILLS-Y-HERRAMIENTAS.md` — qué skills/MCP usamos y cuáles crear, con su justificación.

## 8. Estado actual

- [x] Contexto y arquitectura definidos
- [x] Documentación base creada
- [x] Infra confirmada: GoDaddy (DNS) + OXATIS (sitio); coexisten homea.mx y homea.oxatis.com
- [🟡] **Fase 0 — Descubrimiento y blindaje SEO** ← en curso
  - [x] GSC: propiedad `https://www.homea.mx/` verificada
  - [x] **Inventario de URLs** (3,358) → `seo-data/INVENTARIO-URLS.md`
  - [x] **Línea base GSC** (16 meses, ~56.5k clics) → `seo-data/ANALISIS-GSC.md`
  - [x] **GA4** (landings+ads, 18k sesiones, $0 revenue=lead-gen) → `seo-data/ANALISIS-GA4.md`
  - [~] GA4 + limpieza GTM → **DIFERIDO a Fase 3** (decisión Carla: no instrumentar OXATIS; tracking limpio en la landing nueva)
  - [ ] Recuperar propiedad GSC antigua (`YA886D...`) — prioridad BAJA (no da más histórico; GSC tope 16 meses)
  - [ ] Captura competitiva ARTEXA (opcional, alimenta Fase 1)

**Decisión Carla (2026-06-04):** trabajar con la información ya disponible (inventario + línea base GSC), sin recabar/instrumentar más en el sitio viejo. Avanzar a estrategia/construcción.

**Decisión Carla (2026-06-10):** **PIVOT de arquitectura** → front-end propio en **Vercel (Next.js)** + **Shopify solo ecommerce** (Storefront API). Se revierte "TODO EN SHOPIFY". Ver Sección 3. 3 productos de prueba creados en Shopify (`homeashop.mx`) como Draft para validar estructura de datos/filtros.
  - [ ] Captura competitiva HOMEA vs ARTEXA
  - [ ] Mapa 301 priorizado (esqueleto ahora; URLs nuevas en Fase 4)

## 9. Skills y MCP disponibles para este proyecto

- **Ya instaladas (Homea):** `homea-marketing`, `homea-sales`, `homea-operaciones`
- **Generales útiles:** `frontend-design`, suite `design`, suite `marketing` (incl. `seo-audit`, `competitive-brief`), `skill-creator`
- **MCP conectados:** Shopify (Admin API), Meta Ads, Supermetrics, Canva, Gamma, Chrome (navegador)
- Detalle y skills a crear: ver `docs/SKILLS-Y-HERRAMIENTAS.md`
