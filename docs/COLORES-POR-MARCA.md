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
| Sub-Zero | 114 (2026-11-10, a mano: Classic por familia + bisagra → Panelable · Acero jaladera Tubular · Acero jaladera Pro; muestras "acero inoxidable jaladera tubular/pro", "tubular", "pro") |

Pendiente de Carla: Elica **PRF0024262A** y **PRF0098392** son la misma campana Seashell 32" Blanca; solo PRF0098392 quedó en el grupo.

## Colores como variantes de un solo producto (Viking, 2026-11-17)

Carla pidió para Viking **un producto por modelo** (foto de acero) con los colores en círculos, como Alfresco, en lugar de un producto por color. En Shopify cada producto Viking lleva hasta tres opciones: **Color** (nombre de Viking: Slate Blue, Damascus Gray…), **Herraje** (Estándar / Latón cepillado) y **Tipo de gas** (Gas LP primero, Gas natural); hasta 76 variantes.

- `lib/shopify/catalogoVivo.ts` lee hasta 100 variantes. Cada círculo es Color + Herraje ("Slate Blue · Latón cepillado") y guarda su propio gas en `ColorVivo.gases`.
- El tono de cada círculo sale de `TONOS_VARIANTE` en `lib/coloresMarca.ts` (`fondoVariante`); el latón se pinta como una franja dorada.
- El botón lleva en `data-cart-gas` un mapa por SKU de color y `CarritoProvider` pregunta el gas del color elegido.
- `filtros.color` lleva el tono percibido de todos los colores del modelo y `filtros.herraje = Latón cepillado` si el modelo también se vende con latón (grupo "Herraje" del panel).
- `/producto/<sku de variante>` redirige (308) a la ficha del modelo.

**Lynx (2026-11-17):** mismo esquema que Viking sin herraje. Los 16 equipos con *Exclusive Color Finishes* llevan **Color** (Acero Inoxidable + California Poppy, Obsidian, Desert Sage, Limestone, Pacific Blue, Sierra, Glacier, Surf; precio ECF de la lista) × **Tipo de gas** cuando aplica; SKU de color = modelo + código Lynx (`L36TROB`, `L36TROB-NG`). Tonos en `TONOS_VARIANTE` (muestras de lynxgrills.com). Kamado LCGRBK ↔ LCGRMG va como dos productos (grupo `colores` a mano: el script no quita "Brillante").

## Eclipse (2026-11-18)

Línea Colors = opción **Color** del mismo producto (Acero inoxidable · Bronce · Negro), cada una con su precio de lista (el Colors cuesta más que el acero). SKU de variante = clave del catálogo + código: `EA 62B`, `EA 62B BZ`, `EA 62B NG`. Tonos `Bronce` y `Negro` en `TONOS_VARIANTE` (lib/coloresMarca.ts).
Las fotos de color llevan alt que termina en ` — color <nombre>`: al pulsar el círculo, `public/catalogo.js` salta a esa foto (acero = primera). Las marcas sin esas fotos (Alfresco, Viking, Lynx) no cambian.
El USD de cada color sale de la proporción de precios (`usdEscalado`, lib/catalogo.ts): conserva los centavos cuando el precio base los trae (Eclipse) y se queda en el dólar entero en las listas enteras.

## Schock (2026-11-18)

**Un producto por color** (Carla, 2026-11-18, como Bertazzoni y Blanco; primero se cargó con opción Color y se cambió el mismo día). Tarjas Green Line (Night · Day · Dusk), Cristadur (Magma · Polaris · Stone · Bronze) y Cristalite (Nero · Alpina); llaves SC-510…SC-550 en los 7; complementos en color Black · Bronze; rejillas plegables acero inoxidable · negra. El color va en el título antes de " — línea" (`… Greenwich N100 S Polaris — Cristadur`) y en `filtros.color`.
- SKU: el primer color conserva el SKU y la URL del producto original (`GREENWICH N100 S` = Magma, `/producto/greenwich-n100-s`); los demás = modelo + color (`GREENWICH N100 S POLARIS`). Rejillas con el artículo Schock (`629726EDM` / `629726S`).
- Grupos `colores` a mano en `data/sugerencias-marca.json` (el script no conoce los nombres de Schock). Muestras `magma`, `polaris`, `stone`, `bronze`, `night`, `day`, `dusk`, `alpina`, `black` en `MUESTRAS` (lib/coloresModelo.ts); `nero`, `negra` y `acero inoxidable` ya existían.
- Cada ficha solo con fotos de su color: foto del color + ambiente del catálogo si es de ese color + plano. Las llaves Night/Day/Dusk llevan la foto del tono equivalente (Magma/Polaris/Stone) hasta tener la suya.
- La tarja sugiere la llave del mismo tono (Polaris/Day/Alpina → `SC-520 POLARIS`…), sus complementos Black y Bronze, y sus accesorios.
**Accesorios incluidos a elegir:** Prepstation D150 y Horizont N200 (todos sus colores) incluyen 2 de 4 accesorios. Al agregarlas se abre una ventana para escogerlos (`data/accesorios-incluidos.json`, `lib/accesoriosIncluidos.ts`, CarritoProvider). Lo elegido viaja como atributo de línea "Accesorios incluidos" (carrito, pedido de Shopify, cajón, Mi proyecto y pre-cotización) y no se cobra aparte.
