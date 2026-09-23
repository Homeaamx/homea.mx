# Páginas de marca — `/marcas/<slug>`

> Una página por marca: **92** hoy (68 SHOPIFY · 24 PDF, desde el 2026-09-22; se quitaron AXOR, TRES, Pizarro, Artexa Bath y Hergom Diseño). Todas salen de
> la **misma ruta** (`app/marcas/[marca]/page.tsx`) y del **mismo registro** (`data/marcas.json`).
> Cambia el logo, la foto, las categorías, las listas de precios y el **canal**; el armazón es idéntico.
>
> Qué marca va a Shopify y cuál solo como PDF, y su descuento: `docs/MARCAS-CANAL-Y-DESCUENTOS.md`.

## Por qué existen

El 11% de los clics de búsqueda del sitio (1,859 de 16,758 en 16 meses de GSC) traen el
nombre de una marca: `wolf` 451, `sub-zero` 456, `whirlpool` 194, `monogram` 182, `mabe`
153… El sitio viejo nunca tuvo una página de marca — los 77 tiles de `/marcas` no
llevaban a ningún lado (`href="home.html"` → `/`). Es superficie de SEO nueva, no una
recuperación.

## Qué enseña la página

1. **Hero** con la foto de la marca y su logo (`.page-hero.marcas-hero`, el mismo de `/marcas`).
2. **Categorías** que distribuimos de esa marca → enlazan al PLP correspondiente.
3. **Listas de precios** de la marca, en su URL permanente `/listas-de-precios/<slug>.pdf`.
4. **Catálogo**: filtros + rejilla, el mismo armazón que `/productos`. **Solo marcas `shopify`.**
5. **CTA** de showroom.

### Dos canales (`canal`)

| `canal` | Qué enseña la página |
|---|---|
| `shopify` | Hero y **directo al catálogo** con filtros. Sin bloque de categorías ni listas de precios (Carla, 2026-09-22): ahí van los productos de la marca desde Shopify |
| `pdf` | Bloque **"Asesoría especializada"**: invitación a hablar con un asesor por WhatsApp, su PDF si ya está publicado y sus categorías. **Sin** catálogo ni filtros. El botón de la página, el del hero y el flotante mandan *"Hola, estaba viendo el catálogo de {marca} y me interesa una asesoría."* (`mensajeAsesoria()` en `lib/whatsapp.ts`) |

### Marcas sin arte

Sin foto, el hero cae a fondo negro con su velo. Sin logo, queda solo el `<h1>` (el tile de
`/marcas` enseña el nombre en lugar del logo, clase `no-logo`). Nunca hay una imagen rota. En
cuanto se agregan los archivos y se corre `npm run marcas`, la página los toma.

⚠️ **La rejilla de productos es maqueta**, igual que la de `/productos`: el catálogo
todavía no está migrado (la tienda de Shopify sigue con contraseña). Ver abajo.

## El registro — `data/marcas.json`

**Generado. No editar a mano** (salvo `descripcion`, que el generador conserva).

```json
{ "slug": "sub-zero", "nombre": "Sub-Zero", "gama": ["premium"],
  "categorias": ["cocina"],
  "logo": "/assets/logos/sub-zero.webp",
  "foto": "/assets/photos/brands/sub-zero.webp",
  "listas": ["sub-zero"] }
```

| Campo | De dónde sale |
|---|---|
| `slug` | `data-brand` del tile en `preview/marcas.html` |
| `nombre` | tabla `NOMBRES` de `scripts/build-marcas.mjs` (el tile solo trae MAYÚSCULAS) |
| `gama` | `data-gama` del tile |
| `categorias` | `data-sub` del tile |
| `canal` | `data-canal` del tile: `shopify` o `pdf` (obligatorio) |
| `logo` | `public/assets/logos/<slug>.*` — **la extensión varía** (.webp / .png). `null` si no hay |
| `foto` | `public/assets/photos/brands/<slug>.*` — foto de los **tiles**, tope 700 px. Varía (.webp / .avif). `null` si no hay |
| `fotoHero` | `public/assets/photos/brands/hero/<slug>.webp` — foto del **hero**, hasta 2000 px, con variantes 400–1600 (`node scripts/responsive-images.mjs`). Si no hay, usa `foto` |
| `listas` | slugs de documento de `data/listas-precios.json` |
| `descripcion` | opcional, a mano. Si no está, la página arma una frase con gama + categorías |

El JSON también trae las tablas `categorias` (nombre + ruta) y `gamas`, para que
`lib/marcas.ts` no las repita.

Regenerar:

```bash
npm run marcas
```

Es idempotente y **sale con 1** si una marca se queda sin nombre en `NOMBRES`, sin
`data-canal` válido, o con un `data-gama`/`data-sub` que no conoce. Sin logo o sin foto solo
**avisa** (lista las marcas sin arte): la página tiene respaldo. A propósito **no** está en
`prebuild`: ese hook lo comparten otras sesiones de trabajo.

## Texto del hero — `data/marcas-hero.json` (2026-09-22)

Contenido del hero **por marca**, escrito a mano o desde el Excel de contenido. El generador no lo toca.
Tiene las **92 marcas**, cargadas desde `HOMEA_HERO_97_MARCAS_CODE.xlsx` (2026-09-22). Para actualizarlas, edita el JSON o vuelve a convertir el Excel (columnas SLUG · MARCA · EYEBROW · H1 · DESCRIPCIÓN · BOTÓN). Marca sin entrada → hero de siempre (gama · Distribución oficial + nombre + frase automática).

```json
"acros": {
  "eyebrow": "Funcional · Práctica · Accesible",
  "titulo": "Electrodomésticos Acros",
  "descripcion": "Soluciones prácticas para el hogar…",
  "cta": { "texto": "Ver catálogo oficial", "url": null }
}
```

- `eyebrow` en minúsculas normales: el CSS lo pasa a MAYÚSCULAS.
- `cta.url` = URL permanente del PDF oficial, `/listas-de-precios/<slug>.pdf` (sirve el archivo de Shopify Files y no cambia entre ediciones; la ruta vieja de OXATIS redirige ahí). Mientras sea `null`, el mismo botón pide el catálogo por WhatsApp. Desde el 2026-09-22 lo tienen 64 marcas (`docs/PDFS-OXATIS-PENDIENTES.md` §0).
- Ajustes opcionales por marca: `imagen.espejo: false` (la foto del hero va en espejo por defecto; se desactiva cuando
  trae texto o logos, p. ej. Bosch, Kamado Joe, WPPO, Lynx, Alfa Forni), `imagen.posicion` (encuadre; por defecto
  `center 75%`, un % menor enseña más la parte de arriba: Acros, Café, Josper…) y `logoEscala` (Axcent 0.6).
- **Suavizado automático:** si la foto del hero mide menos de **1100 px** de ancho (según `data/variantes-imagenes.json`),
  la página añade `.marcas-hero--suave`: blur leve + velo y viñeta más densos para que no se noten los pixeles.
  Se quita solo al subir una foto más grande. Las fotos del hero se sustituyen en `brands/hero/` (la del tile no cambia).
- Logo del hero: `public/assets/logos/hero/<slug>.webp` es una copia **recortada sin margen** (14 logos traían mucho
  margen transparente y se veían chicos). Los tiles de `/marcas` siguen con el original.
- La jerarquía la da la clase `.marcas-hero--contenido` (`styles/theme.css`): eyebrow 15px · H1 52–68px · descripción 19–22px · bloque 600px.
  Fondo, overlay, logo y breadcrumb no cambian.

## Nombres SEO de las fotos (2026-09-22)

Tile y hero se llaman `<slug>-<tipo>.webp` (p. ej. `wolf-cocina.webp`, `blanco-tarjas-y-griferia.webp`,
`sedona-by-lynx-asadores.webp`): el tipo sale del H1 de `data/marcas-hero.json` sin el nombre de la marca
(`scripts/nombre-seo-marca.mjs`). El generador busca la foto con ese nombre y, si no existe, acepta `<slug>.webp`.
Cambiar el H1 de una marca cambia el nombre esperado: renombrar su foto (tile y hero) o `npm run marcas` la dará por
faltante. Cada variante del hero tiene tope de peso (≈24 KB a 400 px … ≈260 KB a 2000 px).

## Foto del hero (2026-09-22)

La foto de los tiles se capa a 700 px (`scripts/optimize-images.mjs`), y estirada a sangre completa se veía pixeleada.
El hero usa su propia copia en `brands/hero/`, sacada del **original más grande** que hay (se recuperaron del historial de git).
Se sirve desde **Vercel** (estático en `public/`), no desde Shopify: es imagen editorial, no de producto (`docs/ESTRATEGIA-IMAGENES.md`).
Para cambiarla: deja `brands/hero/<slug>.webp` (horizontal, **≥ 2000 px de ancho**), corre `node scripts/responsive-images.mjs`
y `npm run marcas`. Ojo: `responsive-images.mjs` genera variantes de **todo** el sitio que no las tenga; revisa `git status` antes de subir.

## Agregar una marca

1. Agrega su tile en `preview/marcas.html` con `data-brand`, `data-gama`, `data-sub`,
   `data-canal` y su `href="marca-<slug>.html"`. Sin logo, el tile va con clase
   `brandtile no-logo` y sin `<img>`.
2. Pon su logo en `public/assets/logos/<slug>.<ext>` y su foto en
   `public/assets/photos/brands/<slug>.<ext>` (si ya los tienes; si no, la página tiene respaldo).
   El logo debe tener **fondo transparente real**: la página y el tile lo pintan en blanco con
   `filter: brightness(0) invert(1)`, así que un fondo blanco horneado se ve como caja.
3. Agrega su nombre en `NOMBRES` (`scripts/build-marcas.mjs`).
4. Agrega su enlace en el mega-menú de `preview/home.html` (`.mega-brands-cols`, orden A–Z).
5. `npm run marcas`.

Una lista de precios cuya marca no tiene tile se sigue viendo en `/marcas#listas-de-precios`,
pero no tiene página. Hoy no queda ninguna así (2026-09-21).

## Quitar una marca

Quitar su tile de `preview/marcas.html`, su enlace del mega-menú de `preview/home.html`, su
nombre de `NOMBRES`, sus reglas `.brandtile[data-brand=…]` de `styles/theme.css` y
`preview/theme.css`, sus archivos en `public/assets/` y `preview/assets/`, y su entrada de
`data/listas-precios.json`. **Las URLs viejas de sus PDFs** (`legacy`) no se tiran: pásalas a
`data/redirects/oxatis-manual.json` apuntando a su categoría, para que no den 404. Luego
`npm run marcas`. Así se quitaron Hansgrohe, Keuco, American Standard y Moen el 2026-09-21
(y las listas de Catalano, Fortum y Steamist), y AXOR, TRES, Pizarro, Artexa Bath y Hergom Diseño el 2026-09-22.

⚠️ En `next dev`, la ruta `/listas-de-precios/<slug>.pdf` puede seguir sirviendo una lista ya
borrada: Turbopack no vuelve a leer `data/listas-precios.json`. Reinicia el servidor para
comprobarlo; en producción no pasa.

## Cómo se enlazan

`lib/preview.ts` traduce `marca-<slug>.html` → `/marcas/<slug>` (`MARCA_PREFIX`, igual
que `categoria-` y `producto-`). **No existe ningún archivo `preview/marca-*.html`**: el
nombre solo sirve para enlazar desde el HTML del preview. Hoy apuntan ahí:

- los 92 tiles de `preview/marcas.html`,
- los 92 enlaces del mega-menú de marcas y los 38 chips de la marquesina, en
  `preview/home.html` (que es el nav compartido de todo el sitio).

## Cuando llegue el catálogo

**Solo hay que cambiar una función**: `productosDeMarca()` en `lib/marcas.ts`. Hoy
devuelve `[]` y la página enseña la maqueta con salida a WhatsApp. En cuanto devuelva
productos, las páginas `shopify` se llenan solas — no hay que tocar `app/marcas/[marca]/page.tsx`.
Las `pdf` no enseñan catálogo aunque la función devuelva algo.

Los filtros (`filtrosDeMarca()`) están puestos pero **no filtran nada todavía**, igual
que los de `/productos`. Se conectan en el mismo momento.

Ver `lib/flags.ts` → `PLP_READY` y `CLAUDE.md` §3.

## Relacionado

- `docs/PDFS-OXATIS-PENDIENTES.md` — las listas de precios que enlaza cada marca.
- `docs/FASE1-ANALISIS-Y-SECCIONES.md` §Marcas — el spec original de esta página.
- `catalogo-shopify/TABLA-MARCA-GAMA.md` — `preview/marcas.html` es la fuente oficial de la gama.
