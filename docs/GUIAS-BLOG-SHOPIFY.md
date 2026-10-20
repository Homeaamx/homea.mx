# Guías: cómo se publican desde Shopify

> Decisión de Carla (2026-10-14): los artículos de **Guías** (`/guias`) se escriben y publican en
> el **blog "Guías" de Shopify**. El sitio los lee por Storefront API y los pinta con el diseño de
> HOMEA. Ya no hay guías escritas en el código.

## Qué se hace en Shopify

**Contenido → Entradas de blog → Agregar entrada**, en el blog **Guías**.

| Campo de Shopify | Qué es en el sitio |
|---|---|
| Título | Título de la guía (H1) |
| Contenido | Cuerpo de la guía. Usa **Encabezado 2** para secciones y **Encabezado 3** para subsecciones; listas, tablas, negritas y enlaces se respetan. |
| Extracto | Resumen que sale bajo el título y en la tarjeta de la guía |
| Imagen | Fondo del encabezado. Si no hay, se usa la foto de su subcategoría o macro |
| Etiquetas | **Dónde vive la guía** (ver abajo) |
| Identificador de URL (handle) | Última parte de la URL. Corto, en minúsculas y con guiones |
| Vista previa en buscadores (SEO) | `<title>` y meta descripción de la página |
| Visibilidad | **Visible** = aparece en el sitio. **Oculta** = borrador (no aparece) |

### Etiquetas (obligatorias)

Cada entrada lleva **una etiqueta de lugar** y, opcionalmente, **una de tipo**. Se escriben normal,
con acentos; mayúsculas y "&" o "y" dan igual.

- **Lugar.** Cocina y Bar y Exterior van por subcategoría: `Refrigeración`, `Cocción`,
  `Lavavajillas`, `Tarjas y Grifería`, `Trituradores`, `Filtros y Purificadores de Agua`,
  `Asadores & Hornos` y `Alberca`. Las demás van por macro: `Electrodomésticos Menores`,
  `Lavandería`, `Baños`, `Aire acondicionado`, `Vapor y Sauna`, `Wellness`,
  `Recubrimientos y Superficies` y `Chimeneas & Calentadores`.
- **Tipo** (si falta, se toma "Guía de compra"): `Guía de compra`, `Top picks`, `Cómo elegir`,
  `Comparativa`, `Mantenimiento`, `Tendencias` o `Reseña`.

Una entrada **sin etiqueta de lugar válida no se publica** (el sitio la ignora y lo avisa en el log).

- **Categoría de producto** (opcional, desde 2026-10-20): en las páginas de guías con riel
  "Explora por categoría" (Lavandería, Baños, Wellness, Alberca…) y en las tarjetas de la portada
  de Electrodomésticos menores, elegir una categoría deja solo sus guías. **Cada guía queda en una
  categoría**: la que nombre su etiqueta (`Jacuzzi`, `Lavadoras`, `WC y Sanitarios`; puede llevar
  varias) o, sin etiqueta, la primera que nombra completa en título, extracto o cuerpo. Esa
  categoría muestra el número en el riel. Al elegir una categoría, los chips de tipo (Todas, Guía
  de compra…) se quedan fijos y a su derecha aparece **Ver productos en tienda**, que lleva a su
  página de la tienda con su filtro (`tienda` en `GUIAS/taxonomia-guias.json`).

**URL resultante:** `/guias/{macro}/{subcategoría}/{tipo}/{handle}`, o
`/guias/{macro}/{tipo}/{handle}` en las macros sin subcategorías.
Ejemplo: `Refrigeración` + `Guía de compra` + handle `guia-refrigeracion-premium` →
`/guias/cocina-y-bar/refrigeracion/guia-de-compra/guia-refrigeracion-premium`.

⚠️ **No cambies el handle ni las etiquetas de una guía ya publicada:** cambia su URL y se pierde
lo que haya ganado en Google. Si hace falta, se agrega un 301 en `next.config.js`.

## Cuándo aparece en el sitio

- Hasta **1 hora** después de publicar (caché del blog, tag `guias`).
- Al momento, llamando a `GET /api/revalidar-guias` con `Authorization: Bearer $CRON_SECRET`.
- Aparece en el hub (`/guias`, "Guías destacadas" y buscador), en el índice de su macro o
  subcategoría, en el sitemap y con JSON-LD `Article`.

## Estado al 2026-10-14

Blog **Guías** (`guias`) creado. **16 guías**, una por subcategoría o macro, **publicadas el
2026-10-14** por indicación de Carla:

| Lugar | Guía (handle) |
|---|---|
| Refrigeración | `guia-refrigeracion-premium` |
| Cocción | `guia-coccion-estufa-parrilla-horno` |
| Lavavajillas | `guia-compra-lavavajillas` |
| Tarjas y Grifería | `guia-tarjas-y-griferia` |
| Trituradores | `guia-triturador-de-alimentos` |
| Filtros y Purificadores de Agua | `guia-filtracion-agua-cocina` |
| Asadores & Hornos | `guia-asadores-y-hornos-exterior` |
| Alberca | `elegir-mosaico-para-alberca` |
| Electrodomésticos Menores | `guia-electrodomesticos-menores` |
| Lavandería | `guia-lavadora-y-secadora` |
| Baños | `guia-bano-premium` |
| Aire acondicionado | `guia-compra-minisplits` |
| Vapor y Sauna | `guia-vapor-y-sauna` |
| Wellness | `guia-wellness-en-casa` |
| Recubrimientos y Superficies | `elegir-recubrimiento-por-espacio` |
| Chimeneas & Calentadores | `guia-chimeneas-y-calentadores` |

Se eliminaron las 39 guías de ejemplo que vivían en `GUIAS/taxonomia-guias.json` (eran solo título,
resumen y enlaces a filtros que no existían; nunca estuvieron en línea, así que no necesitan 301).

**Pendiente:** imagen de encabezado propia en cada guía (hoy usan la foto de su categoría) y
marcas en Lavandería, Aire acondicionado y Filtros (no nombran marcas porque aún no hay catálogo
cargado para confirmarlas).

## Cómo verlas antes de publicarlas

En desarrollo (`npm run dev`) el sitio suma las guías de `GUIAS/semilla-shopify/` que todavía no
estén publicadas, marcadas como "Borrador" y con `noindex`. En producción nunca. Esos archivos son
la copia de lo que se subió; **después de editar en Shopify, la versión buena es la de Shopify**.

## Código

- `lib/shopify/guias.ts` — lee el blog, limpia el HTML, ubica cada entrada por etiquetas.
- `lib/guias.ts` — estructura (JSON) + funciones async que listan guías.
- `app/guias/[...segments]/page.tsx` — hub de macro, subcategoría, filtros y artículo.
- `components/GuideArticle.tsx` + `.guide-prose` en `styles/guias.css` — diseño del artículo.
- `app/api/revalidar-guias/route.ts` — refresco inmediato.

## Portada de Subcategoría 1 (2026-10-19, primero Refrigeración)

`/guias/<macro>/<sub1>` usa `components/GuiasPortada.tsx` cuando **todas** sus
Subcategorías 2 traen `tarjeta` en `GUIAS/taxonomia-guias.json` y la Sub1 tiene foto
en `PORTADA_FOTO_SUB1` (`app/guias/[...segments]/page.tsx`): hero partido, rejilla de
tipos (foto de `public/assets/photos/subcat-tiles/`, la misma del slider de Productos,
ícono de línea en `ICONOS` y resumen) y, abajo, la sección **Blog** con el formulario
de suscripción (`data-newsletter="guias"`, lo envía v2.js) y las tarjetas de las guías.
Para pasar Cocción u otra Sub1: agregar `tarjeta: { imagen, resumen }` a cada tipo,
su foto en `PORTADA_FOTO_SUB1` y, si falta, su ícono en `ICONOS`.
