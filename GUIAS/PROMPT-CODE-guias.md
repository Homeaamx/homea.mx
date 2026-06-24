# PROMPT-CODE · Construir la sección GUÍAS (HOMEA)

> Pega este prompt al agente de código. Construye la sección **GUÍAS** en el front-end Next.js a partir de la taxonomía ya definida, dejando **cableados** los botones actuales y **stubs listos** para los botones futuros (filtros de producto que aún no existen).

---

## Contexto

Estoy construyendo el front-end propio de HOMEA (**Next.js App Router**, hospedado en **Vercel**, Shopify solo como ecommerce vía Storefront API). Quiero que implementes la sección **GUÍAS**: un centro de contenido (modelo AJ Madison `/learn/`) que educa al usuario y lo empuja a **filtros de producto** y/o a **cotización (lead)**.

**Fuente de verdad de la estructura:** `GUIAS/taxonomia-guias.json` (NO inventes categorías ni rutas; léelas de ahí).
**Arquitectura y reglas:** `GUIAS/ARQUITECTURA-GUIAS.md`.
**Design system (obligatorio):** tokens en `preview/tokens-v2.css` y estilos de `preview/theme.css`. Superficies bone/greige/espresso, acento oro champagne `#BD9B5E`, tipografías Newsreader (serif display) + Montserrat (UI, eyebrows 600/13px/0.22em), radius 0, motion contenido. **No inventes colores, tipos ni espaciados fuera de los tokens v2.**
**Base visual:** parte del preview existente `preview/guias.html` y del mega-menú ya hecho ahí.

---

## Jerarquía (respétala tal cual)

```
Macrocategoría (Cocina y Bar) → Subcategoría 1 (Refrigeración) → Subcategoría 2 (Refrigeradores = leaf de filtro)
```
- Cada macro trae `nivelGuias`: `"subcategoria1"` (rama de 3 niveles) o `"macrocategoria"` (rama de 2 niveles).
- **Las guías se anclan donde dice `nivelGuias`.** En 3 niveles viven en cada Subcategoría 1; en 2 niveles viven en la Macrocategoría y sus Sub1 son los leaves (`esLeaf: true`, con `filtro`).

---

## Rutas a generar (App Router + SSG)

Lee `taxonomia-guias.json` y genera con `generateStaticParams`:

1. **Hub** — `/guias/`
   `app/guias/page.tsx`
2. **Índice de macro** — `/guias/{macro}/`
   `app/guias/[macro]/page.tsx`
3. **Índice de categoría de guías (solo 3 niveles)** — `/guias/{macro}/{sub1}/`
   `app/guias/[macro]/[sub1]/page.tsx`
4. **Artículo de guía**
   - 3 niveles: `/guias/{macro}/{sub1}/{tipo}/{slug}/` → `app/guias/[macro]/[sub1]/[tipo]/[slug]/page.tsx`
   - 2 niveles: `/guias/{macro}/{tipo}/{slug}/` → `app/guias/[macro]/[tipo]/[slug]/page.tsx`

Usa **ISR** (`revalidate`) para no rebuildear todo. Tipa la taxonomía (genera `types/guias.ts` con `Macrocategoria`, `Subcategoria1`, `Subcategoria2`, `Guia`, `SeccionGuia`).

---

## Páginas y componentes

### Hub `/guias/`
- **Hero "Guía"** replicando el bloque de diseño: eyebrow + título serif *"¿No sabes por dónde empezar? No te preocupes, nosotros te guiamos."* + botón **GUÍA DE COMPRA** (acento oro) + el ícono de ruta SVG. Tómalo del preview.
- **Grid de las 10 macrocategorías** (tarjetas limpias, estilo "Navegar por categoría" del home) → cada una a `/guias/{macro}/`.
- **Guías destacadas / más leídas** (carrusel o grid de `GuideCard`).

### Índice de macro `/guias/{macro}/`
- Breadcrumb + título de la macro.
- Si `nivelGuias === "subcategoria1"`: lista las **Subcategorías 1** como tarjetas → `/guias/{macro}/{sub1}/`.
- Si `nivelGuias === "macrocategoria"`: renderiza directamente el **índice de guías** (la macro ES la categoría de guías), con filtro por **tipo de guía**.

### Índice de categoría `/guias/{macro}/{sub1}/`
- Breadcrumb. Sidebar/lista de las otras Sub1 de la macro.
- **Filtro por tipo de guía** (chips: Guía de compra, Top Picks, Cómo elegir, Reseña, Tendencias, Comparativa, Mantenimiento) leídos de `tiposDeGuia`.
- Grid de `GuideCard` con etiqueta `Categoría / Tipo`.

### Artículo de guía
- Breadcrumb completo (Inicio › Guías › Macro › [Sub1] › Guía).
- Cuerpo editorial (placeholder de contenido por ahora: usa `resumen` + secciones).
- **Por cada `seccion` del JSON:** título + un botón **"Ver productos"** que apunta a `seccion.filtro` (ver "Botones futuros").
- **CTA global de la guía (doble ruta):**
  - Primario oro: **"Cotizar por WhatsApp"** → usa el patrón de WhatsApp ya existente en el sitio (mismo número/flotante).
  - Secundario: **"Ver todos los productos"** → al `filtro` de la categoría/leaf principal.

---

## Botones: cableado actual vs. futuro (IMPORTANTE)

Hay dos tipos de destino. Implementa un único componente `<CtaProducto>` que distinga:

1. **Botones que YA funcionan:**
   - **Navegación interna de Guías** (`/guias/...`): links normales `next/link`.
   - **WhatsApp / Cotizar**: usa el componente/href de WhatsApp existente del sitio.

2. **Botones FUTUROS (filtros de producto):** todos los `filtro` del JSON apuntan a `/productos/{leaf}/?faceta=valor`, **y esa sección PLP aún NO existe**. No los rompas:
   - Renderiza el botón **siempre**, con el `href` real guardado en `data-href={filtro}` y clase `data-cta="ver-productos"`.
   - Controla con un flag central `PLP_READY` (en `lib/flags.ts`, hoy `false`):
     - Si `PLP_READY === false`: el botón hace `preventDefault`, no navega, y muestra microcopy **"Próximamente"** (o abre el WhatsApp de cotización como fallback). NO debe dar 404.
     - Si `PLP_READY === true`: el botón usa el `href` real y navega al filtro.
   - Así, cuando construyamos el PLP, solo se cambia `PLP_READY = true` y **todos los filtros quedan vivos sin tocar las guías**.
   - Deja un `// TODO PLP:` junto al flag explicando el mapeo `filtro → colección/tag de Shopify`.

---

## Navegación del sitio
- Enlaza el item **GUÍAS** del header (ya existe en la nav) a `/guias/`.
- Marca el estado activo cuando la ruta empiece por `/guias`.

---

## SEO (regla de oro del proyecto: no perder posicionamiento)
- **Metadata API** por página: `title`/`description` por guía y categoría (usa `titulo`/`resumen`).
- **Canónico** por página.
- **JSON-LD**: `Article` en cada guía, `BreadcrumbList` en todas, `ItemList` en los índices.
- Añade las rutas de guías a `sitemap.ts`.
- SSR/SSG (no client-only): el contenido debe servirse renderizado.

---

## Entregables
1. Rutas y páginas listadas, con `generateStaticParams` desde el JSON.
2. Componentes: `GuideHero`, `MacroGrid`, `CategoryList`, `GuideTypeFilter`, `GuideCard`, `Breadcrumb`, `GuideArticle`, `CtaProducto`, `WhatsAppCta` (reusar si existe).
3. `types/guias.ts` y un loader `lib/guias.ts` que lea/parsee `taxonomia-guias.json`.
4. `lib/flags.ts` con `PLP_READY=false` y el TODO de mapeo a Shopify.
5. Estilos solo con tokens v2.
6. JSON-LD + metadata + sitemap.

## Criterios de aceptación
- Todas las rutas del JSON renderizan sin 404.
- Ningún botón de filtro produce 404 con `PLP_READY=false` (muestran "Próximamente" o caen a WhatsApp).
- Cambiar `PLP_READY=true` activa todos los filtros sin editar componentes de guías.
- Breadcrumbs y JSON-LD presentes y válidos.
- Visual fiel al design system v2 (sin colores/tipos fuera de tokens).

> No modifiques la taxonomía: si algo falta, agrégalo a `GUIAS/taxonomia-guias.json` y coméntalo, no lo hardcodees en componentes.
