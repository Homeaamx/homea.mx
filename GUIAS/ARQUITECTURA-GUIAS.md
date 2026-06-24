# GUÍAS — Arquitectura de la sección (HOMEA)

> **Qué es esto:** el mapa de ruta + función de la sección **GUÍAS** de homea.mx, modelado sobre el Learn Center de AJ Madison (`/learn/`) y mapeado a la taxonomía propia de HOMEA.
> **Para qué:** alimentar el build en Next.js (rutas, breadcrumbs, índices, JSON-LD) y el plan editorial (qué guías escribir y a qué filtro enlazan).
> **Datos fuente para código:** `taxonomia-guias.json` · **Modelo de referencia:** `REFERENCIA-AJMADISON.md`.

---

## 1. Idea central

GUÍAS no es un blog suelto: es un **embudo editorial**. Cada guía educa al usuario y lo termina empujando a un **listado de productos filtrado** (PLP) y/o a un **CTA de cotización** (la venta de ticket alto cierra por WhatsApp/showroom, según `CLAUDE.md`).

---

## 2. Jerarquía de 3 niveles (identificación corregida)

```
MACROCATEGORÍA      →  SUBCATEGORÍA 1            →  SUBCATEGORÍA 2
(Cocina y Bar)         (Refrigeración)              (Refrigeradores, Congeladores…)
agrupación del hub     "categoría para guías"       tipo de producto / leaf de filtro
```

- **Macrocategoría** (10): Cocina y Bar · Exterior · Electrodomésticos Menores · Lavandería · Baños · Minisplits · Vapor y Sauna · Wellness · Recubrimientos y Superficies · Chimeneas & Calentadores.
- **Subcategoría 1**: las categorías bajo cada macro (Refrigeración, Cocción, Lavavajillas…). **Aquí se anclan las guías** cuando la rama llega a Subcategoría 2.
- **Subcategoría 2**: el tipo de producto (Refrigeradores, Estufas…). Es el **leaf de filtro**: a esto enlazan las secciones de cada guía.

**Algunas ramas no llegan a Subcategoría 2.** En esos casos (Electrodomésticos Menores, Lavandería, Baños, Minisplits, Vapor y Sauna, Wellness, Recubrimientos y Superficies, Chimeneas & Calentadores), las **Subcategorías 1 son los leaves de filtro** y las **guías se anclan en la Macrocategoría**.

> **Regla única de anclaje de guías:** *las guías viven en el nivel cuyos hijos directos son los leaves de producto.* → Sub1 en macros de 3 niveles; la Macro en macros de 2 niveles.

---

## 3. Niveles de página, ruta y función

| Nivel de página | Ruta | Función |
|---|---|---|
| **Hub** | `/guias/` | Orienta y distribuye. Grid de las 10 macrocategorías + guías destacadas + más leídas. |
| **Macrocategoría** | `/guias/{macro}/` | Agrupa. Lista sus Subcategorías 1. En macros de 2 niveles, **también es la página de índice de guías**. |
| **Categoría de guías (Sub1)** | `/guias/{macro}/{sub1}/` | Índice de una categoría: lista sus guías y filtra por tipo de guía. *(solo en macros de 3 niveles)* |
| **Guía / Artículo** | ver patrones abajo | Contenido experto. Cuerpo + secciones por subtipo, cada una con **link a filtro de producto** + **CTA Cotizar**. |

**Patrones de URL de guía:**
```
3 niveles:  /guias/{macro}/{sub1}/{tipo}/{slug}/
            /guias/cocina-y-bar/refrigeracion/guia-de-compra/refrigeracion-de-lujo/

2 niveles:  /guias/{macro}/{tipo}/{slug}/
            /guias/lavanderia/guia-de-compra/guia-de-compra-lavanderia/
```

**Patrón de link a filtro (la "salida" de cada guía):**
```
/productos/{leaf}/?{faceta}={valor}
/productos/refrigeradores/?caracteristica=panelable
```
> El `{leaf}` es la Subcategoría 2 (macros de 3 niveles) o la Subcategoría 1 (macros de 2 niveles). Facetas: `tipo`, `marca`, `caracteristica`, `gama`, `instalacion`, `combustible`, `ancho`. En Shopify se resuelven con colecciones + tags/metafields. El destino **aún no existe** — se construye en la fase de PLP/filtros.
>
> **Opción de URL más corta:** el segmento `{macro}` puede omitirse en la ruta del artículo (`/guias/refrigeracion/...`) si se prefiere por SEO; la macro seguiría siendo solo agrupación visual en el hub.

---

## 4. Tipos de guía (la "función" editorial)

Vocabulario controlado adaptado de los *Article Types* de AJ Madison. Filtro en cada índice y prefijo de URL:

| Slug | Nombre | Función |
|---|---|---|
| `guia-de-compra` | Guía de compra | Cómo elegir, pros/contras, qué buscar, medidas |
| `top-picks` | Mejores / Top Picks | Rankings por tipo, marca o uso ("Los mejores X de 2026") |
| `como-elegir` | Cómo elegir / How-to | Medidas, instalación, configuración, reemplazo |
| `resena` | Reseña | Reseña de modelo, serie o colección |
| `tendencias` | Tendencias | Diseño, tecnología y novedades |
| `comparativa` | Comparativa | A vs. B (tipo, marca o tecnología) |
| `mantenimiento` | Mantenimiento | Cuidado, vida útil y solución de problemas |

---

## 5. Mapa completo: Macro → Sub1 → Sub2 + guías + filtros

> Resumen legible. La fuente estructurada para código está en `taxonomia-guias.json`.
> Cada guía indica su **tipo** entre paréntesis; cada subtipo de una guía enlaza a un **leaf de filtro**.

### A. Cocina y Bar — `/guias/cocina-y-bar/` · *(3 niveles · guías en Sub1)*

**Refrigeración** → `/guias/cocina-y-bar/refrigeracion/`
Sub2 (leaves): Refrigeradores · Congeladores · **Refrigeradores de piso** · Centros de bebida · Frigobares · Máquinas de hielo · Cavas de vino · Cajones fríos · Accesorios de refrigeración.
Guías: Guía de Refrigeración de Lujo *(guía-de-compra)* · Guía de compra de refrigerador 2026 *(guía-de-compra)* · Mejores refrigeradores panelables *(top-picks)* · Cómo medir el espacio *(como-elegir)* · Características de una cava de vino *(guía-de-compra)*.

**Cocción** → `/guias/cocina-y-bar/coccion/`
Sub2: Estufas · Parrillas · Hornos · Microondas · Campanas · Cajones · Cafeteras · Accesorios de cocción.
Guías: Guía de compra de cocción *(guía-de-compra)* · Inducción vs. gas vs. eléctrica *(comparativa)* · Mejores rangos profesionales *(top-picks)* · Cómo elegir tu campana *(como-elegir)* · Hornos de vapor y combi *(tendencias)*.

**Lavavajillas** → `/guias/cocina-y-bar/lavavajillas/`
Sub2: Lavavajillas.
Guías: Guía de compra de lavavajillas *(guía-de-compra)* · Mejores lavavajillas silenciosos *(top-picks)* · Cómo cuidar tu lavavajillas *(mantenimiento)*.

**Tarjas y Grifería** → `/guias/cocina-y-bar/tarjas-y-griferia/`
Sub2: Tarjas · Grifería · Dispensadores de Agua · Accesorios de Tarjas & Grifería.
Guías: Guía de compra de tarjas *(guía-de-compra)* · Cómo elegir tu grifería *(como-elegir)*.

**Trituradores** → `/guias/cocina-y-bar/trituradores/`
Sub2: Trituradores.
Guías: Guía de compra de triturador *(guía-de-compra)* · ¿Vale la pena un triturador? *(comparativa)*.

**Dispensadores & Filtros de agua** → `/guias/cocina-y-bar/dispensadores-y-filtros-de-agua/`
Sub2: Dispensadores de agua · Filtros de agua.
Guías: Guía de filtración de agua *(guía-de-compra)*.

### B. Exterior — `/guias/exterior/` · *(3 niveles · guías en Sub1)*

**Asadores & Hornos** → `/guias/exterior/asadores-y-hornos/`
Sub2: Asadores empotrables · Asadores con carrito · Hornos de pizza · Accesorios Asadores & Hornos.
Guías: Guía de compra de asadores *(guía-de-compra)* · Cómo diseñar tu cocina exterior *(como-elegir)* · Mejores asadores premium *(top-picks)*.

**Alberca** → `/guias/exterior/alberca/`
Sub2: Mosaicos.
Guías: Guía de mosaicos para alberca *(guía-de-compra)*.

### C. Electrodomésticos Menores — `/guias/electrodomesticos-menores/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Licuadoras · Batidoras · Tostadoras · Exprimidor de cítricos · Cafeteras · Accesorios de cocina pequeños.
Guías: Electrodomésticos de barra premium *(guía-de-compra)* · Cómo elegir tu cafetera *(como-elegir)*.

### D. Lavandería — `/guias/lavanderia/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Lavadoras · Secadoras · Lavasecadoras (2 en 1) · Centros de Lavado.
Guías: Guía de compra de lavadora y secadora *(guía-de-compra)* · Lavasecadora 2 en 1 *(comparativa)* · Cómo elegir tu cuarto de lavado *(como-elegir)*.

### E. Baños — `/guias/banos/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Tarjas · Monomandos · Regaderas · Tinas · Accesorios de Baños.
Guías: Diseñar un baño premium *(guía-de-compra)* · Cómo elegir tu regadera *(como-elegir)*.

### F. Minisplits — `/guias/minisplits/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Minisplit Frío · Minisplit Frío & Calor.
Guías: Guía de compra de minisplits *(guía-de-compra)* · ¿Cuántos BTU necesito? *(como-elegir)*.

### G. Vapor y Sauna — `/guias/vapor-y-sauna/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Vapor · Sauna interior · Sauna exterior.
Guías: Guía de vapor y sauna en casa *(guía-de-compra)* · Cómo planear tu cuarto de vapor *(como-elegir)*.

### H. Wellness — `/guias/wellness/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Tinas de Inmersión · Carril de Nado · Sillón para masajes · Jacuzzi.
Guías: Guía de wellness en casa *(guía-de-compra)* · Carril de nado vs. alberca *(comparativa)*.

### I. Recubrimientos y Superficies — `/guias/recubrimientos-y-superficies/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Pisos · Muros · Piedras Sinterizadas.
Guías: Guía de piedra sinterizada (Laminam) *(guía-de-compra)* · Cómo elegir recubrimiento por espacio *(como-elegir)*.

### J. Chimeneas & Calentadores — `/guias/chimeneas-y-calentadores/` · *(2 niveles · guías en la Macro)*
Sub1 (leaves): Chimeneas · Calentadores.
Guías: Guía de compra de chimeneas *(guía-de-compra)* · Cómo elegir tu calentador de patio *(como-elegir)*.

---

## 6. Notas para el build (Next.js)

- **Rutas dinámicas:**
  - 3 niveles: `app/guias/[macro]/[sub1]/page.tsx` (índice) y `app/guias/[macro]/[sub1]/[tipo]/[slug]/page.tsx` (guía).
  - 2 niveles: `app/guias/[macro]/page.tsx` (índice) y `app/guias/[macro]/[tipo]/[slug]/page.tsx` (guía).
  - Generar `generateStaticParams` desde `taxonomia-guias.json` leyendo `nivelGuias` para decidir el patrón.
- **Breadcrumbs:** Inicio › Guías › {Macro} › {Sub1 si aplica} › {Guía} — con JSON-LD `BreadcrumbList`.
- **SEO:** cada guía con canónico + JSON-LD `Article`; cada índice con `ItemList`. Alineado a la regla de oro de no perder SEO (`CLAUDE.md` §6).
- **Doble CTA por guía:** botón secundario **"Ver productos"** (al filtro PLP) + botón primario dorado **"Cotizar / WhatsApp"** (lead).
- **Filtros:** los links `/productos/{leaf}/?faceta=valor` son el contrato con el PLP. Cuando se definan las colecciones/tags en Shopify, mapear cada faceta→valor a su filtro real.
- **Pendiente de negocio:** validar marcas premium por categoría y priorizar redacción (sugerencia: empezar por Refrigeración, franquicia SEO #1).
