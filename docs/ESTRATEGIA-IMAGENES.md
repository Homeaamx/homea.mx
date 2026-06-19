# Estrategia de Imágenes — Landing HOMEA

> Cómo se **almacenan**, **optimizan** y **nombran** las imágenes para que NO hagan lenta la página y, además, **posicionen** en buscadores (Google Images y búsquedas por tema).
> Conecta con la **Regla de oro: NO PERDER SEO** (`CLAUDE.md §6`) — Core Web Vitals móvil es la gran oportunidad vs. OXATIS, y el **LCP** casi siempre es una imagen (el hero).

---

## 1. Dónde se almacenan — DOS tipos, DOS almacenes

| Tipo | Volumen | Almacén | Quién las sirve |
|---|---|---|---|
| **Editoriales** (hero, foto de marca, lifestyle, showroom, proyectos) | ~40, curadas | **Repo / Vercel** | **`next/image`** (Vercel las optimiza) |
| **Producto** (catálogo) | **~25,000** | **Shopify** (product media) | **Shopify CDN** (`cdn.shopify.com`, Fastly) |

**Por qué separadas:**
- Las **~25k de producto NO pasan por la optimización de Vercel** (Vercel cobra por imagen optimizada → 25k dispararía el costo). Shopify ya da CDN global + WebP automático + redimensionado por URL (`?width=`), gratis.
- Las **editoriales sí valen `next/image`**: pocas, de alto impacto, y el hero es el **LCP**.

**Jugada clave para producto:** configurar un **`loader` personalizado de `next/image` que apunte a Shopify CDN**. Así `next/image` genera el `srcset` responsivo y el `lazy-load`, pero **Shopify optimiza y sirve** (sin costo de Vercel). Lo mejor de ambos mundos.

---

## 2. Optimización de carga (se aplica SIEMPRE)

1. **Formatos modernos:** AVIF/WebP en vez de JPG/PNG (30–60% menos peso).
2. **Tamaño exacto por pantalla:** `srcset` + `sizes` (al móvil, imagen chica; no la de escritorio).
3. **Lazy-load** todo lo que está bajo el pliegue; **`priority`/preload SOLO el hero** (LCP).
4. **`width`/`height` siempre** → cero saltos de layout (CLS = 0).
5. **Placeholder blur (LQIP):** algo visible de inmediato mientras carga la real.
6. **Caché agresiva** (immutable, larga) en CDN.
7. **Compresión en el import de las 25k:** NO subir originales de 3–5 MB. Redimensionar (lado mayor ~2000px) y comprimir (~calidad 80) **antes** de cargar a Shopify. (Pipeline `homea-operaciones`, Fase 4.2.)

**Meta:** que ninguna imagen de varios MB llegue al usuario; hero ligero y priorizado, resto diferido.

---

## 3. Nomenclatura SEO de archivos ⭐ (NUEVO)

El **nombre del archivo es una señal de SEO de imágenes**: Google lo lee para entender de qué trata la foto. Un nombre descriptivo y alineado a lo que la gente busca hace que la imagen **aparezca cuando alguien busca ese tema** (Google Images y búsquedas normales con resultados visuales).

### Reglas de nombre
- **Descriptivo, no genérico.** ❌ `DSC0001.jpg`, `IMG_4821.png`, `foto1.jpg` → ✅ describe lo que se ve.
- **Minúsculas, sin espacios, sin acentos ni ñ**, palabras separadas por **guiones medios** (`-`). (Guion medio, no guion bajo.)
- **Estructura sugerida:** `marca-producto-categoria-atributo(s).webp`
  - `sub-zero-refrigerador-empotrable-acero-inoxidable.webp`
  - `wolf-estufa-de-gas-6-quemadores-cocina.webp`
  - `miele-lavavajillas-panelable-integrado.webp`
  - `asador-exterior-premium-cocina-de-patio.webp`
- **Incluir términos que la gente realmente busca (trends):** validar el vocabulario con **Google Trends / keyword research / Search Console** y usar el término más buscado (ej. decidir entre *"refrigerador empotrable"* vs *"refrigerador built-in"*, *"campana"* vs *"extractor"*). Español de México como base.
- **Sin relleno de keywords** (keyword stuffing): un nombre claro y natural, no `refrigerador-refrigeradores-nevera-sub-zero-barato-mexico.jpg`.

### Para las ~25k (programático)
Los nombres se **generan automáticamente** desde los datos ya homologados (marca + tipo + características) en el **pipeline de operaciones (Fase 4.1/4.2)** — no a mano uno por uno. Definir la plantilla de nombre como parte de la homologación.

### Acompañar SIEMPRE con:
- **`alt` descriptivo** (para accesibilidad y SEO; describe la imagen con naturalidad, sin stuffing).
- **Contexto en la página** (título, texto cercano) coherente con la imagen.
- (Producto) datos estructurados **JSON-LD `Product` con `image`** (ya previsto en Fase 3.3).

---

## 4. Mapeo a fases

- **Fase 3 (front-end):** `next/image` + loader Shopify; hero con `priority`; lazy en el resto; JSON-LD con `image`.
- **Fase 4.1 (datos):** definir la **plantilla de nomenclatura SEO** como parte de la homologación.
- **Fase 4.2 (imágenes de producto):** **compresión/redimensión en el import** + **aplicación de los nombres SEO** + validación de vocabulario con trends. Priorizar productos de mayor tráfico/venta.
- **Fase 5 (QA):** medir **Core Web Vitals móvil** (LCP del hero), validar que no haya imágenes pesadas ni CLS.

---

## 5. Pendiente (cuando estén las imágenes definitivas)
- Optimizar las imágenes del preview (WebP + `loading="lazy"` + `width/height`). **Diferido**: las imágenes del preview van a cambiar; no se sabe aún cuáles serán las definitivas (decisión Carla 2026-06-15).
