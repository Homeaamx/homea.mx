# Colores por marca: círculos en tarjeta, ficha y filtro

> Decisión de Carla, 2026-11-03. Se probó en la tarja Blanco Ikon 402525 y se llevó a todas las marcas.
> **Leer al cargar cualquier marca nueva** cuyos modelos vengan en varios colores.

## Qué ve el cliente

| Dónde | Qué hace |
|---|---|
| **Tarjeta del catálogo** (marca, categoría, tipo) | Fila de círculos de 18 px entre el nombre y el precio, con todos los colores que caben en el ancho de la tarjeta; "+N" solo si faltan. El color de la tarjeta lleva el aro dorado y siempre se ve. Las tarjetas sin colores de la misma rejilla reservan el renglón para que los precios alineen. |
| Cursor (o foco de teclado) sobre otro círculo | La foto de la tarjeta cambia a la de ese color y vuelve al salir. |
| Clic (o Enter / Espacio) en un círculo | La tarjeta se queda con ese color: foto, modelo, nombre, precio, "+", corazón y enlace. No sale de la página. |
| Clic en la tarjeta | Abre la ficha del color que muestra. |
| **Ficha** | Círculos de 40 px junto al precio; cada uno lleva a la ficha de su color. |
| **Filtro Color** (todas las categorías) | Círculo con el tono junto a cada valor, aunque la pieza no tenga círculos en su tarjeta ni en su ficha. |

**Una sola tarjeta en todo el sitio (Carla, 2026-11-05):** listados, wishlist y relacionados de la ficha usan la misma tarjeta (`tarjetaHtml`), con "+" y círculos. La wishlist pinta una tarjeta ligera con lo guardado en el corazón y `catalogo.js` la cambia por la completa (`/api/tarjetas?skus=…`, sin `lista` = tarjetas sueltas por SKU con sus colores). Un color hermano que no está en la página se pide igual, por SKU, al pasar el cursor o al hacer clic.

**Cada color sigue siendo su propio producto y su propia tarjeta.** No se juntan, y los filtros cuentan piezas, no modelos.

## Cómo se arma (y qué hacer con una marca nueva)

1. **En Shopify, un producto por color**, con su SKU. El color va en el título (`… Silgranit Café`, `… 48" Negra`) y en `filtros.color` (color base; el acabado va en `filtros.acabado`, ver memoria `color-y-acabado`).
2. **Grupo de colores** en `data/sugerencias-marca.json`: cada pieza lleva `"colores": [los otros SKUs del modelo]`. Para encontrarlos, con el sitio corriendo (`npm run dev`):
   ```bash
   python3 scripts/grupos-color.py <slug-marca>            # enseña los grupos
   python3 scripts/grupos-color.py <slug-marca> --aplicar  # los escribe
   ```
   Agrupa piezas de la misma marca y línea cuyo título es igual salvo las palabras de color, con un color distinto cada una. Lo que sale como **AMBIGUO** (dos piezas del mismo color y el mismo título) se decide a mano. Las versiones que no son color (Gas LP, "Doble"/"Sencillo") no se agrupan.
3. **Muestra de cada nombre de color** en `lib/coloresModelo.ts`:
   - `MUESTRAS`: el nombre tal como cambia en el título (`satin gold`, `negra`, `anthracite`, `nero`…) → color o degradado. **Si un nombre no tiene muestra, esa pieza no aparece en los círculos** (así se quedan fuera las versiones LP).
   - `MUESTRAS_FILTRO`: el valor de `filtros.color` (`Dorado`, `Gris oscuro`…) → círculo del filtro. Un valor nuevo de la lista de Shopify necesita su entrada; sin ella, la casilla sale sin círculo.
4. **Revisar** `/marcas/<slug>`: pasar el cursor por los círculos (cambia la foto), hacer clic (cambia la tarjeta) y abrir la ficha.

Las variantes de una misma pieza (Alfresco *Standard Color / Custom Color*, `-SC` / `-CC`) son otro sistema: una sola tarjeta con opción Color en Shopify. Ver memoria `selector-color-variantes`.

## Dónde vive el código

- `lib/shopify/htmlCatalogo.ts`: `coloresDeRejilla` (hermanos que vienen en el mismo listado), `coloresTarjetaHtml` (la fila), `coloresModeloHtml` (ficha), `circuloFiltro` (filtro).
- `lib/coloresModelo.ts`: `coloresDeModelo` (nombre de cada color contra todo el grupo), `MUESTRAS`, `MUESTRAS_FILTRO`.
- `public/catalogo.js`: cambio de foto en hover/foco, aplicar color con clic o teclado, cuántos círculos caben (`ajustarColores`). Al cambiarlo, subir `?v=` en `app/layout.tsx`.
- `styles/theme.css`: `.pcard-colores`, `.pcard-color`, `.fopts .fcolor`, y el alto máximo de la tarjeta (cabe en la pantalla; la foto se encoge en pantallas bajas).

## Estado (2026-11-03)

| Marca | Piezas con grupo |
|---|---|
| Blanco | 611 |
| InSinkErator | 48 |
| Bertazzoni | 33 (4 versiones Gas LP sin círculos, a propósito) |
| Elica | 27 (12 grupos nuevos el 2026-11-03) |
| Hoshizaki | 8 (acero / panelable) |
| Thor | 6 (Gordon Ramsay negra / inoxidable) |
| Kraus | 2 |
| Benessi | 46 (2026-11-04, a mano: acero ↔ panelable en refrigeración, bajo cubierta y lavavajillas; acero ↔ negra/cristal negro en parrillas Masterpiece, cafetera 24", combi-vapor y microondas combinado 30") |

Pendiente de Carla: Elica **PRF0024262A** y **PRF0098392** son la misma campana Seashell 32" Blanca; solo PRF0098392 quedó en el grupo.
