# Propuesta de filtros por macrocategoría — Shopify + /productos

> Basada en: (1) el modelo de filtros de artexa.com, (2) la taxonomía del sitio
> (`GUIAS/taxonomia-guias.json`: facetas tipo/marca/característica/gama/instalación/combustible/ancho),
> y (3) la distribución REAL del catálogo (18,277 SKUs SAE + listas de proveedor 2026).
> Fecha: 2026-07-05.

## 1. Modelo general

Copiamos la estructura de Artexa (categoría → disponibilidad → marca → colección → instalación → tipo → color → acabado)
pero corregimos sus defectos: ellos mezclan valores de serie ("Professional", "Original") dentro de COLOR,
no tienen faceta de gama ni de combustible, y no separan ancho. Nosotros sí, porque ya existen en la taxonomía.

**Regla de variantes (decisión Carla):** cada acabado/color es una **variante del mismo producto**
(modelo base = producto, acabado = Opción). El filtro de Color/Acabado filtra por variantes disponibles.

**Productos con catálogo pero sin precio** (ej. parte de ASKO): se publican con CTA **"Cotizar"**
en lugar de precio. El filtro Disponibilidad los agrupa en "Bajo cotización" — no se ocultan.

## 2. Filtros globales (todas las macrocategorías)

| Filtro | Valores | Fuente del dato |
|---|---|---|
| **Categoría de producto** | jerarquía de la taxonomía (59 tipos) | TIPO_DETECTADO + Classification de listas |
| **Marca** | ~40 marcas curadas | Vendor |
| **Disponibilidad** | Entrega inmediata / Últimas unidades (≤2 pzas) / Bajo pedido / Bajo cotización | Existencias SAE + precio presente |
| **Precio** | rango MXN (convertido con FIX del día) | listas proveedor/SAE |
| **Gama** | Premium / Media / Residencial | faceta de la taxonomía (diferenciador vs Artexa) |
| **Color** | Inoxidable (3,243) · Cromo (2,016) · Negro (1,499) · Blanco (1,231) · Gris (361) · Bronce (351) · Dorado/Latón (308) · Níquel (157) + colores Viking/Alfresco | variantes (Finish de listas + descripción) |
| **Tipo de acabado** | Mate (581) · Cepillado (401) · Pulido (85) | variantes |
| **Colección / Serie** | por marca: Viking 5/7 Series · Wolf M/E/Pro · Sub-Zero Classic/Designer/PRO · AXOR Citterio/MyEdition/Montreux/Starck · Brizo Litze/Artesso/Rook/Tulham… | columna Series (Artexa xlsx) + secciones de PDFs |
| **Ancho** | 15" (84) · 18" (106) · 24" (555) · 30" (933) · 36" (1,279) · 42" (92) · 48" (807) · 60" (219) · 66" (101) | regex descripción + specs |

## 3. Filtros específicos por macrocategoría

### Cocina y Bar
- **Refrigeración**: Instalación (Empotrado / Bajo cubierta / De piso / Columna), Panelable (132 SKUs),
  Bisagra (Izq / Der / Reversible — clave en Sub-Zero y U-Line), Zonas de temperatura (1/2/3),
  Capacidad (botellas para cavas / pies³), Ancho.
- **Cocción**: Combustible (Gas 1,481 · Eléctrico 743 · Dual 507 · Inducción 213 · LP como variante),
  Nº de quemadores, Tipo de campana (Pared 601 · Isla 172 · Liner/Inserto · Bajo gabinete),
  Con plancha/comal/grill, Ancho, Serie.
- **Lavavajillas**: Instalación (Empotrable / Panelable / De piso), Ancho (18"/24"), Nº servicios.
- **Tarjas y Grifería**: Instalación (Sobre cubierta / Submontar / Pared — como Artexa),
  Material (Acero inox / Granito compuesto SILGRANIT / Fireclay), Nº de tazones,
  Función grifería (Extraíble pull-down / Pull-out / Pot filler / Touch/Electrónica), Colección, Color/Acabado.
- **Trituradores**: Potencia (HP), Alimentación (Continua / Batch).
- **Máquinas de hielo**: Tipo de hielo (Cubo / Nugget / Gourmet), Producción (lbs/día), Bomba de drenado.

### Exterior
- Tipo (Asador empotrable / Con carrito / Quemador lateral / Horno de pizza / Refrigeración exterior / Campana ext.),
  Combustible (Gas / LP / Carbón / Leña / Kamado / Pellets), Ancho de parrilla, Con rotisserie,
  Color (paleta RAL de Alfresco: estándar vs custom).

### Lavandería
- Tipo (Lavadora / Secadora / Lavasecadora / Centro de lavado), Carga (Frontal / Superior),
  Capacidad (kg), Secadora (Eléctrica / Gas / Bomba de calor), Apilable (sí/no).

### Baños
- Categoría (Monomando / Regadera / Tina / Lavabo / Accesorios / WC*), Colección (motor de AXOR/Brizo/Delta),
  Acabado/Color, Instalación (Pared / Cubierta / Piso), Termostática (sí/no).
  *WC/Sanitarios no existe aún en la taxonomía — hay ~docenas de SKUs American Standard; decidir si se agrega.

### Minisplits
- Modo (Frío / Frío-Calor), Capacidad (BTU / toneladas), Inverter, Voltaje (110/220), WiFi.

### Electrodomésticos Menores / Vapor y Sauna / Wellness / Recubrimientos / Chimeneas
- Menores: Tipo + Color (paleta Smeg/Wolf Gourmet). Vapor: capacidad (m³). Wellness: dimensiones/plazas.
  Recubrimientos: formato (cm) + acabado. Chimeneas: combustible (leña/gas/eléctrica) + medida. *(detallar cuando toque cada una; prioridad actual: cocinas)*

## 4. Implementación en Shopify

| Concepto | Mecanismo Shopify |
|---|---|
| Tipo de producto | `Product Type` (+ colección automatizada por tipo) |
| Marca | `Vendor` |
| Variantes | Opción 1: **Color/Acabado** · Opción 2: **Gas Natural/LP** (cocción/exterior) · Opción 3: **Bisagra Izq/Der** (refrigeración) |
| Facetas (gama, instalación, combustible, ancho, colección, material, etc.) | **Metafields** filtables (Search & Discovery) — expuestos vía Storefront API al front |
| Disponibilidad | metafield calculado: existencia SAE > 2 → Entrega inmediata; 1–2 → Últimas unidades; 0 con precio → Bajo pedido; sin precio → Bajo cotización |
| SKU / clave SAE | `SKU` de la variante (rastreo pedidos ↔ SAE) |
| URLs de filtro del sitio | `/productos/<tipo>/?f=<faceta>` (patrón de la taxonomía) → el front traduce a filtros Storefront API |

## 4.5 Estructura de páginas en Shopify (regla Carla 2026-07-05)

**El catálogo navegable y sus filtros viven en Shopify, no en el front-end.** Los botones/menús del
sitio (mega-menú Productos, mosaico de Guías, CTAs) **redirigen a Shopify**. Por eso se crea:

1. **Una página/colección principal por macrocategoría** (Cocina y Bar, Exterior, Lavandería, Baños,
   Minisplits, …): hero + carrusel de subcategorías con **imagen representativa de producto SIN fondo**
   (como el carrusel de Artexa: Refrigeración → refrigerador French Door, Cocción → range pro,
   Campanas → campana de pared, Trituradores, Cajones, Tarjas, Grifería, Cafeteras, Máquinas de hielo…).
2. **Una colección por subcategoría 1** de la taxonomía (Refrigeración, Cocción, Lavavajillas,
   Tarjas y Grifería, Trituradores, Dispensadores & Filtros…) y **por tipo** (nivel 2: Refrigeradores,
   Congeladores, Cavas…), con los filtros de la sección 2/3 activos vía Search & Discovery.
3. Mapeo 1:1 con la taxonomía del sitio para que cada botón del front tenga su URL destino en Shopify:
   `macrocategoría → colección madre`, `subcategoría1 → colección`, `tipo → colección hija`.

**Imágenes representativas requeridas (subcategorías nivel 1, prioridad cocinas):**
Refrigeración · Cocción · Lavavajillas · Tarjas y Grifería · Trituradores · Dispensadores & Filtros ·
Asadores & Hornos (Exterior) · Lavadoras/Secadoras · Baños (lavabo/monomando) · Minisplits —
todas en PNG sin fondo, producto icónico de marca premium (se extraen de los catálogos de marca o web oficial).

> ⚠️ Nota SEO a resolver: el playbook actual marca la tienda Shopify como noindex/password para no
> competir con homea.mx. Si el catálogo navegable vive en Shopify, hay que decidir qué dominio indexa
> el catálogo (¿colecciones bajo homea.mx vía dominio/subcarpeta, o Shopify indexable y el front noindexa
> sus rutas de producto?). Pendiente de definir con el playbook en mano.

## 5. De dónde sale cada dato (pipeline)

- **Classification/Function/Series/Finish** → xlsx Artexa (19 marcas, ya extraído en 02-CRUCE).
- **Secciones Viking (29)** y **categorías U-Line/Sub-Zero/Wolf** → PDFs Middleby/Lavish (03 y 04-CRUCE).
- **Ancho, color, combustible, instalación** → regex sobre descripción SAE + descripción proveedor (ya validado arriba).
- **Gama** → asignación por marca/serie (definir tabla marca→gama con Carla).
- Lo que no se pueda derivar queda como columna vacía en el maestro para captura manual asistida.
