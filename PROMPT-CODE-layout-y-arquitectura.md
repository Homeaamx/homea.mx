# Prompt para Claude Code — Análisis + layout vacío de secciones

> Copia el bloque de abajo y pégalo en Claude Code dentro de este repo.

---

Estás trabajando en el proyecto **HOMEA** (lee `CLAUDE.md` para el contexto completo).

**Contexto de mercado (no lo pierdas de vista):** HOMEA es un distribuidor mexicano de **electrodomésticos y equipamiento premium de alta gama**, con showroom en Querétaro y equipo comercial consultivo. Hoy la web funciona como **guía de compra + generador de leads** para dos audiencias en paralelo: **cliente final (B2C)** que investiga y compara antes de cerrar por WhatsApp/showroom, y **cliente B2B** (arquitectos, desarrolladores inmobiliarios, cocineros/fabricantes) que la usa como catálogo de referencia para sus proyectos. El **ecommerce transaccional es fase 2** y vivirá en **Shopify**. La regla de oro del proyecto es **no perder el SEO** en la migración desde OXATIS conservando `homea.mx`.

**Principio rector:** mantener y reforzar la **función de guía de usuario**, priorizando **eficiencia** (encontrar y comparar rápido) y **expertise** (asesoría experta visible). El front es **customer-centric**; el back es el **catálogo en Shopify**. El botón "Comprar" es secundario en esta fase y se activa de forma controlada en fase 2.

## Tarea 1 — Análisis
Lee y sintetiza estos materiales del repo (y el Design System):
- `CLAUDE.md`
- `auditoria-sitio-actual/AUDITORIA-SITIO-ACTUAL.md` y `auditoria-sitio-actual/tablero-visual.html`
- `benchmark-competencia/BENCHMARK.md` y `benchmark-competencia/tablero-referencia.html`
- `docs/` (PLAN-DE-FASES.md, PLAYBOOK-MIGRACION-SEO.md, PLAN-REDIRECTS-MIGRACION.md, FASE1-CONCEPTO-Y-SECCIONES.md)
- Design System en `/Users/carlaarteaga/Documents/Homea Design System` (tokens.css, placeholders.css, fuentes, `Homea Site.html`)

Entrega un **resumen breve (máx. 1 página)** con: (a) el ámbito de mercado de HOMEA, (b) las conclusiones clave de la auditoría del sitio actual y del benchmark de competencia/proveedor, y (c) los principios de diseño que se derivan (guía+lead, eficiencia, expertise, doble ruta Cotizar/Comprar, no perder SEO, límites de Shopify Online Store 2.0).

## Tarea 2 — Secciones recomendadas por plantilla
A partir de ese análisis, propón la **lista de secciones que debería tener cada plantilla**, justificada por el mercado de HOMEA y por el benchmark (no inventes secciones genéricas: cada una debe responder a un hallazgo). Cubre al menos:
- **Home**
- **Colección / PLP** (con filtros)
- **Ficha de producto / PDP**
- **Landing de lead B2B** (arquitectos / desarrolladores / cocineros)
- **Marcas** (y navegación por marca)
- **Quiénes Somos / Showroom**
- **Contacto**

Para cada plantilla, lista las secciones **en orden**, con una línea de propósito por sección y una etiqueta **[Fase 1: guía+lead]** o **[Fase 2: ecommerce]**. Incluye explícitamente: mega-menú de categorías + navegación por **marca / espacio / característica**, jerarquía de conversión con **doble CTA (Cotizar vs Comprar)**, y los patrones rescatados del benchmark (filtros técnicos, ficha técnica PDF, FAQ por equipo, reseñas, showroom con cita, contenido educativo, outlet/“más vendidos”, etc.).

## Tarea 3 — Layout vacío (wireframe)
Crea un **layout vacío / esqueleto** que materialice esas secciones: **contenedores y placeholders rotulados** con el nombre y propósito de cada sección, **sin contenido real ni diseño final**, respetando los límites de **Shopify Online Store 2.0** (estructura de secciones y bloques) y usando los **tokens del Design System** solo como referencia de espaciado/tipografía. Guárdalo en el repo (p. ej. `wireframe/` o `previews/`), una vista por plantilla. El layout debe dejar clara la **jerarquía de conversión** y la separación visual entre la ruta de **lead (alto ticket)** y la de **compra (fase 2)**.

## Cierre
Al terminar el análisis (Tareas 1–2) y el layout vacío (Tarea 3), **avísame que puedes proceder a crear la arquitectura de la página**. **No generes el preview navegable todavía** — espera mi instrucción explícita para crear el preview.
