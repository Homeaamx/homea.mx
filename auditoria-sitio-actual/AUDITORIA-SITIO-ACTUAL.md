# Auditoría del sitio actual — homea.mx (OXATIS)

> Insumo para la migración a Shopify. Documenta la arquitectura actual, inventario de secciones con decisión (dejar / quitar / mejorar), tipos de plantilla y recomendaciones para el front-end customer-centric y el back-end (catálogo) en Shopify.
> Recorrido realizado el 2026-06-09 sobre `https://www.homea.mx/`. Plataforma actual: **OXATIS**.
> Tablero visual de los activos gráficos: `tablero-visual.html` (mismo folder).

---

## 0. Función del sitio y principio rector (leer primero)

**El sitio NO es —ni debe tratarse como— un ecommerce todavía.** Hoy funciona, y debe seguir funcionando en esta fase, como **guía de compra + generador de leads** para dos audiencias en paralelo:

- **Cliente final (B2C):** lo usa para **investigar, comparar y orientarse** antes de decidir; el cierre ocurre por WhatsApp o en showroom.
- **Cliente B2B** (arquitectos, desarrolladores, cocineros/fabricantes): lo usa como **herramienta de consulta y catálogo de referencia** para sus proyectos.

El **ecommerce transaccional llega en una fase posterior, vía Shopify**. Por ahora la prioridad no es el checkout sino que la guía sea **más eficiente y demuestre expertise**.

> **Principio rector de esta fase:** mantener y reforzar la **función de guía de usuario**, pero **priorizando eficiencia (encontrar/comparar rápido) y expertise (asesoría experta visible)**. Todo el rediseño se evalúa contra esto: ¿ayuda al usuario a decidir más rápido y con mejor asesoría, y deja un lead calificado? El botón "Comprar" es secundario en esta fase y se activa de forma controlada cuando Shopify esté listo.

---

## 1. Resumen ejecutivo

El sitio actual es una **guía de compra + generador de leads** (para B2C y B2B), montada en OXATIS, con un ecommerce funcional pero **subutilizado y secundario**; el comercio transaccional se difiere a una fase posterior en Shopify. La realidad operativa que confirma la auditoría:

- La home no comunica una propuesta de valor clara arriba del pliegue; es un **mosaico de banners de categoría/gama** apilados, muy largo, sin jerarquía de conversión.
- **No hay precios visibles** en las páginas de navegación de categoría (solo en los niveles hoja). El mensaje recurrente es *"consultar con un ejecutivo el precio vigente"* → el sitio **empuja al lead, no al checkout**, coherente con el modelo de negocio (ticket alto por WhatsApp/showroom).
- El ecommerce **sí funciona** en el nivel más profundo: hay fichas de producto con precio, descuento, stock y "Añadir a la cesta". Pero está enterrado tras 3 niveles de navegación.
- **Riesgos SEO heredados** serios: URLs dinámicas `PBCPPlayer.asp?ID=`, slugs de producto **desalineados** del producto real, y `<title>` con keyword-stuffing.
- Activos reutilizables fuertes: **banners de gama por marca**, **grid de ~96 marcas**, **badges de confianza** (años, proyectos, cobertura) y los **bloques por segmento** (arquitectos, desarrolladores, particulares, cocineros).

La migración a Shopify debe **reordenar**, no recrear: conservar los activos y el mensaje de segmentación, pero imponer jerarquía de conversión (lead alto-ticket vs compra directa) y limpiar la estructura técnica.

---

## 2. Arquitectura y estructura de URLs (lo que hereda Shopify)

OXATIS usa **cuatro patrones de URL** distintos. Esto importa porque Shopify forzará su propia estructura (`/collections/`, `/products/`, `/pages/`) y **cada URL indexada necesita un 301**.

| Tipo | Patrón actual (OXATIS) | Ejemplo real | Destino Shopify |
|---|---|---|---|
| Home | `/` | `/` | `/` |
| Categoría (3 niveles) | `/<slug>-c102x<ID>` | `/asadores-de-gas-c102x3322263` | `/collections/<handle>` |
| Producto (PDP) | `/<slug>-c2x<ID>` | `/asador-...-keg2000-c2x41387249` | `/products/<handle>` |
| Página de contenido | `/<slug>.htm` **o** `/PBCPPlayer.asp?ID=<ID>` | `/contacto.htm` · `/PBCPPlayer.asp?ID=2375568` | `/pages/<handle>` |
| Archivos (PDF) | `/Files/119914/...pdf` | listas de precios, saunas | `/pages` + archivo o app |

**Hallazgos técnicos clave:**

1. **Taxonomía de 3 niveles**: Categoría → Subcategoría → Hoja con productos. Ej.: *Asadores & Grills* → *Asadores de Gas* → *Con Carrito / De Empotrar* (aquí aparecen los productos con precio). En Shopify esto se resuelve con **colecciones + filtros (tags/metafields)**, no con sub-sub-colecciones anidadas.
2. **Slug de producto desalineado**: la ficha del *"Asador A Gas Napoleón R425PK-1"* vive en una URL que dice `asador-ahumador-de-carbon-...broilking-keg2000`. Slugs reciclados/erróneos = canibalización y confusión SEO. En Shopify hay que **regenerar handles limpios** desde el nombre real del producto.
3. **Páginas dinámicas `PBCPPlayer.asp?ID=`**: Quiénes Somos, Nuestras Marcas, Garantías, etc. son contenido servido por query-string. Son URLs frágiles para SEO; varias están en el menú principal y probablemente indexadas → **mapear a `/pages/` con 301**.
4. **`<title>` con keyword-stuffing**: p.ej. *"...Querétaro, Mexico, Guadalajara, Monterrey, Cabos"*. Funciona a medias hoy; en Shopify conviene títulos limpios orientados a intención + ciudad principal.
5. Footer legal genérico sin personalizar: *"Informaciones legales de tu empresa"* y *"Crear tienda online con Oxatis"* → **eliminar** (placeholder de plantilla).

> Acción para el `PLAN-REDIRECTS-MIGRACION.md`: estos cuatro patrones son las reglas base del mapa 301. El inventario de 3,358 URLs (`seo-data/`) debe clasificarse por estos patrones.

---

## 3. Mapa de navegación actual

**Barra superior (utilidad):** Email/Tel · Buscador · Cuenta usuario · Carrito (MEX$).

**Menú principal (header):** Herramientas · Noticias · Nuestras Marcas · Quiénes Somos · Formas de pago · Garantías · Gastos de envío · Contacto · Paquetes · Listas de Precios.
→ Mezcla **navegación de catálogo** (casi nula) con **páginas de soporte/contenido**. No hay un menú de **categorías de producto** en el header; las categorías viven solo como banners dentro del home. Es el problema estructural #1 para descubrir producto.

**Accesos rápidos bajo el hero:** Llámanos · Ubícanos · Comparativos (botones), y una fila de **badges circulares**: Ofertas y Promociones · Listas de Precios · Clientes y Proyectos · Garantías e Instalaciones · Nuestras Marcas · Quiénes Somos.

**Categorías de producto (como bloques en el home):** Equipos de Cocina · Bar · Para Exterior · Baños, Vapor & Sauna · Electrodomésticos Menores · Wellness · Cuidado de la Ropa · Minisplits · Muebles de Exterior · Chimeneas de Etanol · Recubrimientos y Superficies (Laminam).

**Footer:** Gastos de envío · Medios de pago · Condiciones Generales de Venta · Política para Devoluciones · Aviso Legal · (placeholder Oxatis).

**Canales flotantes:** WhatsApp · Facebook · Instagram (sticky a la derecha).

---

## 4. Inventario de secciones del HOME — dejar / quitar / mejorar

| # | Sección | Qué es hoy | Decisión | Notas para el rediseño |
|---|---|---|---|---|
| 1 | Barra de utilidad (email/tel) | Texto plano arriba | **MEJORAR** | Mantener contacto visible, pero como barra delgada con CTA WhatsApp y "Cotiza". |
| 2 | Header + buscador + cuenta + carrito | Funcional | **DEJAR + MEJORAR** | Añadir **mega-menú de categorías** (hoy no existe). Buscador predictivo. |
| 3 | Hero rotativo "Crea la cocina que mereces" | Carrusel de banners de gama | **MEJORAR** | Pasar a 1 hero con **propuesta de valor + doble CTA** (Cotizar / Comprar). Reducir el carrusel. |
| 4 | Botones Llámanos / Ubícanos / Comparativos | 3 botones | **MEJORAR** | "Comparativos" es valioso (B2B); reubicar. Llámanos/Ubícanos → en header/footer. |
| 5 | Badges circulares (ofertas, listas, proyectos…) | Fila de accesos | **DEJAR** (curar) | Buen recurso de confianza/atajos. Reducir a 4–5 y rediseñar consistente. |
| 6 | Bloques de categoría (Cocina, Bar, Exterior, Baño…) | Banner grande + botones de subcategoría encima de la foto | **MEJORAR** | Idea correcta, ejecución pesada. Convertir en **tarjetas de colección** limpias que linkeen a colecciones Shopify. |
| 7 | Aviso "precios cambian, consultar con ejecutivo" | Texto recurrente | **QUITAR / REEMPLAZAR** | En alto-ticket → "Solicita cotización". En compra directa → **mostrar precio real**. |
| 8 | Novedades / Nuevos lanzamientos (NikolaTesla, Pitt) | 2 destacados de producto | **DEJAR + MEJORAR** | Excelente para storytelling de producto. Convertir en sección "Novedades" dinámica. |
| 9 | Bloque Cocineros / Fabricantes | "Precios especiales" + Contáctanos | **DEJAR** | Es un **segmento-objetivo**. Llevar a landing/lead form dedicado. |
| 10 | Bloque Arquitectos | Asesoría profesional + showroom | **DEJAR** | Segmento clave alto-ticket. Landing B2B + lead. |
| 11 | Bloque Desarrolladores Inmobiliarios | Precios de mayoreo | **DEJAR** | Segmento clave. Lead form con campos de proyecto/volumen. |
| 12 | Bloque Clientes Particulares | Experiencia, stock, descuentos | **DEJAR + MEJORAR** | Es el segmento ecommerce. Reforzar con prueba social y CTA de compra. |
| 13 | Gamas (Premium / Residencial / Media / Económica) | 4 niveles de marca | **DEJAR** | Mensaje diferenciador real. Volverlo navegación filtrable por gama. |
| 14 | Badges de confianza (10,000+ proyectos · 20–22 años · México · 96 marcas) | Cifras | **DEJAR** | Fuerte prueba social. Homologar el dato (aparece "20" y "22 años"). |
| 15 | Recubrimientos / Laminam | Bloque B2B superficies | **DEJAR** (evaluar) | Categoría distinta (arquitectura). Definir si vive en la misma tienda o landing aparte. |
| 16 | Footer legal | Placeholder Oxatis | **QUITAR** | Reemplazar por footer real: legal, contacto, redes, pago, envíos. |
| 17 | Sticky WhatsApp / redes | Botones flotantes | **DEJAR** | WhatsApp es canal de cierre #1. Mantener prominente. |

---

## 5. Tipos de plantilla (templates a recrear en Shopify)

| Plantilla | Estado actual | Qué conserva / qué cambia |
|---|---|---|
| **Home** | Mosaico largo de banners, sin jerarquía de conversión | Rediseño total con jerarquía: hero con doble CTA → categorías → segmentos → prueba social → novedades. |
| **Colección (categoría L1/L2)** | "Tienda" con sub-categorías y descripciones, **sin productos ni precios** | Colección Shopify con **grid de productos real + filtros** (marca, tipo, gama, precio). |
| **Colección hoja (L3)** | Lista de productos con precio, descuento %, "Detalles/Comprar" | Base de la PLP. Mantener precio/descuento/stock; añadir filtros y orden. |
| **Producto (PDP)** | Título, código/SKU, precio tachado + %, stock ("1 en stock"), descripción, imagen, "Añadir a la cesta" | Mantener todo; **añadir** galería, especificaciones estructuradas, marca, **doble CTA (Comprar / Cotizar por WhatsApp)**, productos relacionados, reseñas/garantía. Regenerar **handle limpio**. |
| **Contacto** | Datos de showroom + form (Nombre, Apellidos, Tel, Cel, Email, Mensaje) + horarios + WhatsApp | Conservar; conectar form → **KOMMO**. Añadir mapa embebido y CTA WhatsApp directo. |
| **Quiénes Somos** | Historia (fundada 2004), CEO, showroom, gamas, cifras | Conservar narrativa; pasar a `/pages/` limpia, sin `PBCPPlayer.asp`. |
| **Listas de Precios / Marcas** | Grid de logos → cada logo abre **PDF** de lista de precios por marca | Repensar: en alto-ticket el PDF sirve a ventas; evaluar si se mantiene como recurso o se sustituye por colección por marca. |
| **Contenido/soporte** (Formas de pago, Garantías, Gastos de envío, Devoluciones, Aviso Legal) | `.htm` / dinámicas | Migrar a `/pages/` y enlazar desde footer. |

---

## 6. Hallazgos clave por área

**SEO (regla de oro del proyecto — no perder posicionamiento):**
- 4 patrones de URL distintos → 4 reglas de redirect 301. Prioridad: páginas de contenido en el menú (`PBCPPlayer.asp?ID=`) y categorías con tráfico.
- Slugs de producto desalineados: oportunidad de **limpiar** al migrar, pero exige 301 producto-a-producto cuidado para no perder el histórico.
- Títulos con keyword-stuffing: reescribir a intención + marca + ciudad principal.
- A favor: el dominio `www.homea.mx` se conserva (activo de autoridad) y Shopify da sitemap/canónicos/robots automáticos.

**UX / conversión:**
- Sin mega-menú de categorías → el producto es difícil de descubrir. **Prioridad #1 del front.**
- Home demasiado larga y plana, sin guía de "qué hacer" arriba del pliegue.
- Doble objetivo (lead vs compra) **no está señalizado**: el usuario no sabe cuándo cotizar y cuándo comprar.
- Prueba social existe pero está dispersa; consolidarla.

**Ecommerce (back / catálogo Shopify):**
- El catálogo real tiene precio, descuento y stock por unidad → migrable a variantes/inventario Shopify.
- ~96 marcas y taxonomía profunda → resolver con **colecciones automáticas por tag/metafield** (marca, categoría, gama) en lugar de árboles anidados manuales.
- Coherente con CLAUDE.md: ~25,000 productos = migración seria (homologación de datos, imágenes por producto, import masivo, filtros precisos).

---

## 7. Recomendaciones de uso de la página (front customer-centric + back Shopify)

**Principio rector (fase actual):** el sitio es **guía de compra + generador de leads**; el ecommerce es una **fase 2**. Por tanto el front se optimiza para **eficiencia y expertise**, no para el checkout. Dos rutas, con pesos distintos según la fase:
- **Ruta GUÍA + LEAD (prioridad fase 1):** para B2C en investigación y para B2B (arquitectos, desarrolladores, cocineros). El usuario **encuentra, compara y entiende** rápido, asesorado por contenido experto → CTA **"Cotizar / Hablar con un especialista"** → KOMMO + WhatsApp. El precio se muestra como referencia o se pide cotización.
- **Ruta COMPRA (fase 2, activación controlada):** producto en stock con precio → CTA **"Comprar"** → checkout Shopify nativo. Se habilita por categoría/gama cuando el catálogo y la operación estén listos; mientras tanto convive sin competir con la guía.

**Cómo se traduce "eficiencia + expertise" en el front:**
- *Eficiencia:* mega-menú de categorías, buscador predictivo, filtros por marca/tipo/gama, comparativos, y rutas cortas a "encontrar mi equipo" y "hablar con un experto".
- *Expertise:* guías de compra por categoría (p.ej. la actual de minisplits), comparativos, asesoría por segmento, fichas con especificaciones claras y recomendaciones por perfil de cliente — todo lo que posicione a HOMEA como el experto, no como un simple listado.

**Front-end (customer-centric):**
1. **Mega-menú de categorías** en el header (lo más importante que falta hoy). Estructura por categoría + filtro por gama y marca.
2. **Home jerárquica:** hero con propuesta de valor + doble CTA → tarjetas de categoría → bloques por segmento (los actuales, mejorados) → prueba social (cifras + marcas) → novedades.
3. **PDP fuerte:** galería, especificaciones estructuradas, marca/gama, stock, **doble CTA contextual** (Comprar si hay stock/precio; Cotizar por WhatsApp si es alto-ticket), relacionados, garantía/instalación.
4. **Buscador predictivo** con resultados por producto, marca y categoría.
5. **WhatsApp** como canal persistente de cierre (ya existe; mantener).
6. Señalizar visualmente la **gama** (Premium/Residencial/Media/Económica) como filtro y como badge.

**Back-end (catálogo Shopify):**
1. Modelar **marca, categoría, gama y tipo** como **metafields/tags** para alimentar filtros y colecciones automáticas (evita recrear el árbol de 3 niveles a mano).
2. **Handles limpios** regenerados del nombre real del producto (no reciclar los slugs OXATIS).
3. **Inventario y precio/descuento** por variante; los productos sin precio público se marcan como "cotizar" (sin botón de compra, con CTA de lead).
4. Importación masiva por CSV/Matrixify + **imágenes por producto** (pendiente operativo grande del proyecto).
5. Form de contacto y leads → **KOMMO** (app de formularios o integración nativa).
6. **Mapa 301** disciplinado antes de publicar (regla de oro SEO).

---

## 8. Qué compartir con Claude Code (checklist de insumos)

Para construir el tema Shopify, entregar a "code":

- [x] **Este documento** (arquitectura + inventario + recomendaciones).
- [x] **`tablero-visual.html`** — banners de gama, badges, grid de marcas y superficies (referencia visual viva).
- [ ] **Design System** (`/Documents/Homea Design System`: tokens.css, fuentes, assets) — fuente única visual.
- [ ] **Export del catálogo** (~25k productos) + esquema de campos: nombre real, SKU, marca, categoría/subcategoría, gama, precio, descuento, stock, descripción, imágenes.
- [ ] **Tabla de mapeo de gamas** (Premium/Residencial/Media/Económica → marcas).
- [ ] **Inventario de URLs** (`seo-data/INVENTARIO-URLS.md`) clasificado por los 4 patrones de §2, para el **mapa 301**.
- [ ] **Listas de precios PDF por marca** (decidir si se conservan como recurso de ventas).
- [ ] **Definición de los 2 CTAs** (Comprar vs Cotizar) y regla de cuándo aplica cada uno por categoría/gama.
- [ ] **Contenido de páginas de soporte** (Formas de pago, Garantías, Gastos de envío, Devoluciones, Aviso Legal) para migrar a `/pages/`.
- [ ] **Datos de contacto homologados** (tel 800, oficina, WhatsApp, dirección showroom, horarios) y cifras de confianza (resolver "20 vs 22 años").

---

## 9. Próximo paso

Listo para recibir las **páginas de referencia de diseño ergonómico** que mencionaste, para definir el front-end dentro de los límites de Shopify. Con este inventario, podremos mapear qué patrón de cada referencia aplica a cada plantilla (home, colección, PDP, lead landing).
