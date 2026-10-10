# Activar los filtros en Shopify Search & Discovery

> Paso manual en el admin de Shopify: no se puede hacer por API.
> Fuente de qué filtros van: hoja `METAFIELDS SHOPIFY` de
> `FILTROS DE BUSQUEDA EN LA WEB_CLAUDE.xlsx` (columna "Dónde filtra" = Shopify (nativo)).

## Para qué sirve

Hoy el sitio filtra en el navegador (`public/catalogo.js`) con los `filtros.*` que ya tiene
cada producto, así que **las páginas ya filtran sin este paso**. Search & Discovery hace que la
**Storefront API** también ofrezca esos filtros (con conteos) para cada colección. Eso es lo que
se necesita al escalar a ~16,000 productos, cuando la página ya no pueda traer todas las piezas
de golpe y tenga que pedirle a Shopify "solo las de 36" de gas".

## Estado (revisado por Storefront API, 2026-10-09)

Carla ya configuró la app. Shopify devuelve: **Precio, Marca, Tipo de instalación, Diseño, Ancho,
Acabado, Tipo y Disponibilidad** (la Disponibilidad nativa de inventario ya no sale ✔).

**Faltan** (tienen datos en productos publicados y no aparecen): Tipo de funcionamiento, Bisagra /
apertura, Tipo de horneado, Tipo de gas, Potencia (CFM), Uso, Voltaje, Garantía y Compatible con.
Sin datos todavía para comprobar: Capacidad, Material y Promoción.

## Antes de empezar (una sola vez)

1. **Instalar la app:** admin de Shopify → *Apps* → buscar **Shopify Search & Discovery**
   (gratuita, de Shopify) → *Instalar*.
2. **Tema Online Store 2.0 instalado** (no hace falta publicarlo). Requisito de Shopify para que
   existan los filtros. Si en *Tienda online → Temas* no hay ninguno 2.0, agrega **Dawn** (gratis)
   sin publicarlo.
3. Los 38 campos `filtros.*` ya existen como definiciones de metacampo con lista cerrada y acceso
   de Storefront: no hay que crear nada.

## Paso a paso

1. Admin → *Apps* → **Search & Discovery** → pestaña **Filtros**.
2. Ya vienen dos activos: **Disponibilidad** (la de inventario de Shopify) y **Precio**.
   - Deja **Precio**.
   - **Quita o desactiva la Disponibilidad de Shopify**: nosotros vendemos sin inventario
     ("Bajo pedido"), así que esa saldría siempre "En existencia". La nuestra es el metacampo
     `filtros.disponibilidad` (paso 4).
3. Clic en **Agregar filtro** → en *Origen* elige **Proveedor** (*Vendor*) → etiqueta
   **Marca** → *Guardar*.
4. Para cada metacampo de la lista de abajo: **Agregar filtro** → *Origen*: **Metacampo de
   producto** → elige el metacampo (aparece como "Filtro · …", namespace `filtros`) →
   *Etiqueta*: el nombre visible de la tabla → *Guardar*.
5. Arrastra los filtros para dejarlos en este orden (Search & Discovery tiene un solo orden
   para toda la tienda; el orden por subcategoría lo pone la web).
6. *Guardar*. Los filtros tardan unos minutos en indexarse.

| # | Origen | Metacampo | Etiqueta |
|---|---|---|---|
| 1 | Proveedor | — | Marca |
| 2 | Precio | — | Precio |
| 3 | Metacampo | `filtros.instalacion` | Tipo de instalación |
| 4 | Metacampo | `filtros.diseno` | Diseño |
| 5 | Metacampo | `filtros.funcionamiento` | Tipo de funcionamiento |
| 6 | Metacampo | `filtros.tipo` | Tipo |
| 7 | Metacampo | `filtros.bisagra` | Bisagra / apertura |
| 8 | Metacampo | `filtros.ancho` | Ancho |
| 9 | Metacampo | `filtros.acabado` | Acabado |
| 10 | Metacampo | `filtros.horneado` | Tipo de horneado |
| 11 | Metacampo | `filtros.tipo_gas` | Tipo de gas |
| 12 | Metacampo | `filtros.potencia` | Potencia (CFM) |
| 13 | Metacampo | `filtros.capacidad` | Capacidad |
| 14 | Metacampo | `filtros.material` | Material |
| 15 | Metacampo | `filtros.uso` | Uso |
| 16 | Metacampo | `filtros.voltaje` | Voltaje |
| 17 | Metacampo | `filtros.compatible` | Compatible con |
| 18 | Metacampo | `filtros.disponibilidad` | Disponibilidad |
| 19 | Metacampo | `filtros.garantia` | Garantía |
| 20 | Metacampo | `filtros.promocion` | Promoción |

Son 20: los 19 de la tabla más **Bisagra / apertura**, que se agregó después (prioridad de Carla en
refrigeración y hornos). Los demás `filtros.*` (extracción, motor, llenado de agua, etc.) son de una
sola subcategoría y los sigue filtrando la web, para no gastar el tope de filtros de la tienda.

## Cómo comprobarlo

Avísale a Claude cuando termines: se consulta la colección con la Storefront API
(`collection(handle:"parrillas"){ products{ filters{ label values{label count} } } }`). Si salen
"Tipo de funcionamiento", "Ancho", etc. con sus conteos, quedó.

## Si un metacampo no aparece en la lista del paso 4

- Que la definición sea de tipo admitido (los `filtros.*` son *lista de texto de una línea*: sí lo es).
- Que tenga productos con valor (los que aún no tienen ninguno pueden no listarse).
- Se alcanzó el tope de filtros de la tienda: quitar los que no se usen.
