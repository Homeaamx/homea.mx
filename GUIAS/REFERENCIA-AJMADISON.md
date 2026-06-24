# GUÍAS — Referencia del modelo AJ Madison (`/learn/`)

> Scraping de `https://www.ajmadison.com/learn/` (23-jun-2026). Documenta **la estructura y la función** del Learn Center de AJ Madison, que usamos como modelo para la sección **GUÍAS** de HOMEA. No se copia contenido; se copia el **patrón de navegación y conversión** (guía → categoría → artículo → link a filtro de producto).

---

## 1. El patrón en una línea

```
LEARN (hub) → REFRIGERATION (categoría) → LUXURY REFRIGERATION GUIDE (artículo/guía)
            → INTEGRATED REFRIGERATOR (subtipo dentro del artículo) → LINK AL FILTRO DE PRODUCTO (PLP)
```

Cada nivel tiene una **función** distinta. La guía no es un blog suelto: es un **embudo editorial** que termina empujando al usuario a un listado de productos filtrado (o, en HOMEA, a un lead).

---

## 2. Los 3 niveles de página y su función

| Nivel | Ruta AJ Madison | Función | Componentes clave |
|---|---|---|---|
| **Hub** | `/learn/` | Punto de entrada. Orienta y distribuye. | "Explore By Category" (grid de macrocategorías con ícono), "Popular Articles", "Top Picks", bloque editorial de marca, captura de correo (VIP list). |
| **Categoría** | `/learn/refrigeration/` | Índice de una macrocategoría. Filtra y lista. | Breadcrumb (Home › Learn › Refrigeration), sidebar **Categories** (saltar a otra macro), filtro **Article Types**, hero con buscador, grid de artículos con etiqueta `Categoría / Tipo`. |
| **Artículo / Guía** | `/learn/refrigeration/buying-guide/luxury-refrigeration/` | Contenido experto que educa y **convierte**. | Cuerpo editorial + secciones por subtipo (Integrated / Built-in / Column), cada una con su **CTA a filtro de producto**, "Features Forum", crédito de diseñador, descarga de guía (PDF). |

**Patrón de URL del artículo:**
```
/learn/{categoria}/{tipo-de-articulo}/{slug-del-articulo}/
        refrigeration  buying-guide      luxury-refrigeration
```

---

## 3. Macrocategorías del hub AJ Madison (referencia)

Laundry · Refrigeration · Cooking · Dishwashers · Outdoor Living · Air Conditioners · Smart Home · Appliances · Small Space · Luxury Appliances.

> Nota: el árbol de AJ Madison está pensado para retail masivo EE. UU. HOMEA usa su **propia** taxonomía de 3 niveles —10 macrocategorías → Subcategoría 1 (categorías para guías) → Subcategoría 2 (leaf de producto)— (ver `ARQUITECTURA-GUIAS.md`), no esta lista. En el modelo HOMEA, "Refrigeration" no es la cima: equivale a una **Subcategoría 1** (Refrigeración) bajo la macro **Cocina y Bar**.

---

## 4. Tipos de artículo (Article Types) — la "función" editorial

Tomados del filtro real de `/learn/refrigeration/`. Son el **vocabulario controlado** que adaptamos para HOMEA:

| AJ Madison (Article Type) | Función | Equivalente HOMEA (slug) |
|---|---|---|
| Buying guide | Cómo elegir, pros/contras, qué buscar | `guia-de-compra` |
| Top Picks | "Los mejores X de 2026", rankings por marca/tipo | `top-picks` |
| How To | Medidas, instalación, reemplazo | `como-elegir` |
| Product Review | Reseña de modelo/colección | `resena` |
| Trends | Tendencias de diseño/tecnología | `tendencias` |
| Appliance Maintenance | Cuidado y vida útil | `mantenimiento` |
| Comparativas (vs.) | A vs. B | `comparativa` |
| KBIS Recap / Kitchen Design Collective | Editorial de marca/eventos | (no se adopta como tipo; va en `tendencias`) |

---

## 5. Inventario de ejemplo — `/learn/refrigeration/` (artículos reales scrapeados)

Sirve como modelo del **volumen y mezcla** de contenido que una macrocategoría madura puede tener (~55 artículos en Refrigeración). Selección representativa:

**Buying guide**
- Luxury Refrigeration Guide → `/learn/refrigeration/buying-guide/luxury-refrigeration/`
- Refrigerator Buying Guide 2026
- Important Refrigerator Features to Look For
- What is a Column Refrigerator
- What's the Difference Between Counter Depth and Standard Depth
- Pros & Cons: French Door / Side-by-Side / Built-In / Bottom Freezer
- Important Features of a Wine Refrigerator

**Top Picks**
- Best Built-In Refrigerators · Best Built-In Refrigerator Columns · Best Counter-Depth · Best Side-by-Side · Best French Door
- Por marca: Best Sub-Zero · Best Viking · Best Miele · Best Bosch · Best GE · Best LG · Best Frigidaire
- Best Wine Coolers · Best Undercounter · Best Refrigerator Drawers · Best Freezers

**How To**
- Important Refrigerator Measurements You Need to Know
- How to Replace a Built-in Refrigerator
- Common Refrigerator Problems and How to Fix Them

**Product Review**
- Review of the Viking 7 Series Integrated Refrigerator Collection
- Samsung Family Hub vs. LG InstaView (comparativa)
- Bosch Refreshment Center Refrigerator

---

## 6. Qué adoptamos y qué cambiamos para HOMEA

**Adoptamos:**
- Los 3 niveles (Hub → Categoría → Guía) y el patrón de URL `/{categoria}/{tipo}/{slug}/`.
- El vocabulario de tipos de artículo (guía-de-compra, top-picks, etc.).
- La mecánica clave: **cada guía termina en links a filtros de producto** (subtipos → PLP filtrado).
- El filtro **Article Types** en la página de categoría.

**Cambiamos (alineado a CLAUDE.md):**
- **Taxonomía propia de HOMEA** de 3 niveles (10 macrocategorías → Subcategoría 1 → Subcategoría 2), no la de AJ Madison. Las guías se anclan en el nivel cuyos hijos son leaves de producto (Sub1 en ramas de 3 niveles; Macro en ramas de 2 niveles).
- **Doble CTA HOMEA:** además de "Ver productos" (filtro PLP), cada guía premium incluye **"Cotizar / WhatsApp"** (la venta de ticket alto cierra fuera del sitio).
- **Marcas premium** (Sub-Zero, Viking, Thermador, Wolf, Miele, Monogram, Gaggenau, La Cornue) en lugar del catálogo masivo gringo.
- **SEO propio** (Next.js): rutas limpias `/guias/...`, canónicos, JSON-LD `Article` + `BreadcrumbList`, sin Liquid/tema.
