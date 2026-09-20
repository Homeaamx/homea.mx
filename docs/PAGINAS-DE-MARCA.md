# Páginas de marca — `/marcas/<slug>`

> Una página por marca: 77 hoy. Todas salen de la **misma ruta**
> (`app/marcas/[marca]/page.tsx`) y del **mismo registro** (`data/marcas.json`).
> Cambia el logo, la foto, las categorías y las listas de precios; el armazón es idéntico.

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
4. **Catálogo**: filtros + rejilla, el mismo armazón que `/productos`.
5. **CTA** de showroom.

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
| `logo` | `public/assets/logos/<slug>.*` — **la extensión varía** (.webp / .png) |
| `foto` | `public/assets/photos/brands/<slug>.*` — varía (.webp / .avif) |
| `listas` | slugs de documento de `data/listas-precios.json` |
| `descripcion` | opcional, a mano. Si no está, la página arma una frase con gama + categorías |

El JSON también trae las tablas `categorias` (nombre + ruta) y `gamas`, para que
`lib/marcas.ts` no las repita.

Regenerar:

```bash
npm run marcas
```

Es idempotente y **sale con 1** si una marca se queda sin logo, sin foto, sin nombre en
`NOMBRES`, o con un `data-gama`/`data-sub` que no conoce. A propósito **no** está en
`prebuild`: ese hook lo comparten otras sesiones de trabajo.

## Agregar una marca

1. Agrega su tile en `preview/marcas.html` con `data-brand`, `data-gama` y `data-sub`,
   y su `href="marca-<slug>.html"`.
2. Pon su logo en `public/assets/logos/<slug>.<ext>` y su foto en
   `public/assets/photos/brands/<slug>.<ext>`.
3. Agrega su nombre en `NOMBRES` (`scripts/build-marcas.mjs`).
4. `npm run marcas`.

Sin logo **y** foto no hay página: el generador falla a propósito, porque el hero se
vería roto. Por eso Josper, Jacuzzi, Clearlight, Onix, Fortum, Steamist y Catalano
**no tienen página** aunque sí tengan lista de precios — su lista se sigue viendo en
`/marcas#listas-de-precios`.

## Cómo se enlazan

`lib/preview.ts` traduce `marca-<slug>.html` → `/marcas/<slug>` (`MARCA_PREFIX`, igual
que `categoria-` y `producto-`). **No existe ningún archivo `preview/marca-*.html`**: el
nombre solo sirve para enlazar desde el HTML del preview. Hoy apuntan ahí:

- los 77 tiles de `preview/marcas.html`,
- los 77 enlaces del mega-menú de marcas y los 38 chips de la marquesina, en
  `preview/home.html` (que es el nav compartido de todo el sitio).

## Cuando llegue el catálogo

**Solo hay que cambiar una función**: `productosDeMarca()` en `lib/marcas.ts`. Hoy
devuelve `[]` y la página enseña la maqueta con salida a WhatsApp. En cuanto devuelva
productos, las 77 páginas se llenan solas — no hay que tocar `app/marcas/[marca]/page.tsx`.

Los filtros (`filtrosDeMarca()`) están puestos pero **no filtran nada todavía**, igual
que los de `/productos`. Se conectan en el mismo momento.

Ver `lib/flags.ts` → `PLP_READY` y `CLAUDE.md` §3.

## Relacionado

- `docs/PDFS-OXATIS-PENDIENTES.md` — las listas de precios que enlaza cada marca.
- `docs/FASE1-ANALISIS-Y-SECCIONES.md` §Marcas — el spec original de esta página.
- `catalogo-shopify/TABLA-MARCA-GAMA.md` — `preview/marcas.html` es la fuente oficial de la gama.
