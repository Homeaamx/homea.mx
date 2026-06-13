# Fase 1 — Análisis + Secciones por plantilla (HOMEA)

> Síntesis de: `CLAUDE.md`, `auditoria-sitio-actual/`, `benchmark-competencia/`, `docs/` y el Design System.
> Principio rector: **guía de compra + generación de leads** con **eficiencia** (encontrar/comparar rápido) y **expertise** (asesoría visible). Ecommerce = **Fase 2** en Shopify. Regla de oro: **no perder SEO**.

---

# TAREA 1 — Análisis (resumen ejecutivo, 1 página)

## (a) Ámbito de mercado de HOMEA
Distribuidor mexicano de **electrodomésticos y equipamiento premium/alta gama** (lujo accesible). **22 años, 10,000+ proyectos, ~96 marcas** en 4 **gamas** (Premium: Thermador, Sub-Zero, Wolf, Monogram, Gaggenau, La Cornue · Residencial: Café, Smeg, Bertazzoni, KitchenAid, Asko · Media/Económica: Mabe, Teka, Whirlpool, Electrolux). Categorías: cocina, refrigeración, bar, exterior/asadores, baño-vapor-sauna, lavandería, minisplits, wellness, muebles de exterior, chimeneas, superficies (Laminam). **Showroom en Querétaro** + equipo comercial consultivo. **Dos audiencias en paralelo:** B2C (investiga/compara, cierra por WhatsApp/showroom) y **B2B** (arquitectos, desarrolladores, cocineros/fabricantes; usa el sitio como catálogo de referencia para proyectos). **La venta de ticket alto cierra fuera del sitio**; el ecommerce transaccional es **Fase 2 (Shopify)**. Franquicia SEO confirmada (GSC): **refrigeración panelable/built-in + marcas premium + SKUs + exterior + local Querétaro**.

## (b) Conclusiones de la auditoría y del benchmark
**Auditoría del sitio actual (OXATIS):**
- Hoy es **guía + lead**, no ecommerce; el checkout real existe pero está **enterrado a 3 niveles**.
- **Problema #1: no hay mega-menú de categorías** → el producto es difícil de descubrir. Home **larga, plana, sin jerarquía** ni propuesta de valor arriba del pliegue.
- Sin precios en navegación ("consultar con ejecutivo") → empuja al lead (coherente con el negocio), pero sin señal de valor.
- **Riesgos SEO:** 4 patrones de URL (`c102x`, `c2x`, `.htm`, `PBCPPlayer.asp?ID=`), slugs de producto desalineados, `<title>` con keyword-stuffing, footer placeholder de Oxatis.
- **Activos fuertes a conservar:** banners de gama por marca, grid de ~96 marcas, badges de confianza, bloques por segmento (arquitectos/desarrolladores/cocineros/particulares).

**Benchmark:**
- **Artexa = el modelo** (guía + spec + lead, sin checkout): propuesta de autoridad, **navegación por espacio + por marca**, **precio de referencia + estatus "Bajo pedido"**, **filtros técnicos profundos**, **PDP con specs + ficha técnica PDF + "Cotiza Ahora"**, lista de deseos, **Artexa Pro** (B2B), showroom protagonista.
- **El Tío Sam** (competencia): valida el modelo; **evitar** tarjetas sin precio/CTA y estética genérica.
- **Palacio / Liverpool = vara de Fase 2** (facetas, reseñas, MSI, garantía extendida, escasez, búsqueda potente).
- **Líderes internacionales** (Ferguson, ABT, AJ Madison, James & Steven, KITCH-MX): **comprar por espacio/cuarto** y **por característica** (panel ready, smart, lujo), **constructor de cotización por áreas** + **calculadora de espacio**, **expertise visible** (asesor real + chat/IA), **contenido educativo/blog**, **ficha técnica PDF + FAQ por equipo + reseñas**, **showroom con cita + galería de proyectos instalados**, **outlet/rebates/"más vendidos"**.

## (c) Principios de diseño derivados
1. **Guía + lead primero:** conversión = **contacto cualificado** (Cotizar/WhatsApp/showroom). "Comprar" secundario y **activable en Fase 2**.
2. **Eficiencia:** mega-menú + buscador predictivo + **filtros técnicos profundos** + comparador + navegación **por categoría / por marca / por espacio / por característica**.
3. **Expertise visible:** propuesta de autoridad, guías por categoría, specs estructuradas + **ficha técnica PDF**, **asesor real** + showroom + galería de proyectos.
4. **Doble ruta señalizada:** CTA **lead** (alto ticket, dorado, primario) vs **compra** (Fase 2, secundario, por gama/categoría). **Precio de referencia + estatus**, nunca "consultar con ejecutivo" a secas.
5. **No perder SEO:** conservar `homea.mx`, mapa **301** de los 4 patrones, **handles limpios**, títulos por intención+marca+ciudad, paridad de contenido, conservar el vocabulario de la franquicia (panelable/premium).
6. **Límites Shopify OS 2.0:** todo se arma con **secciones + bloques** apilados; taxonomía vía **colecciones + tags/metafields** (marca, categoría, gama, tipo, característica), no árboles anidados de 3 niveles; **plantillas JSON por tipo de página**; filtros vía Search & Discovery/metafields; patrones avanzados (constructor de cotización, calculadora de espacio, chat IA, back-in-stock, wishlist/comparador, ficha PDF) requieren **apps o bloques custom**.
7. **Premium, mobile-first y ligero:** evitar heros de video pesado (CWV); especialista de nicho, no retail masivo.

---

# TAREA 2 — Secciones recomendadas por plantilla

> Etiquetas: **[F1]** = guía+lead (ahora) · **[F2]** = ecommerce (activación controlada).
> Cada sección responde a un hallazgo (auditoría / benchmark) indicado entre paréntesis.

## Elementos globales (en todas las plantillas)
- **Barra de utilidad [F1]:** tel/800 + email + WhatsApp (+ tipo de cambio USD→MXN si aplica). *(Artexa; auditoría §3)*
- **Header con MEGA-MENÚ [F1]:** navegación por **categoría + por marca + por espacio + por característica/gama** + **buscador predictivo** + lista de deseos/comparador + cuenta + CTA **"Cotizar"**. *(Hallazgo #1 de la auditoría: hoy no existe)*
- **Botón flotante WhatsApp [F1]:** canal de cierre #1. *(Auditoría §3)*
- **Footer real [F1]:** categorías · marcas · showroom/contacto · soporte (formas de pago, garantías, envíos, devoluciones, aviso legal) · redes · **NAP local** · leyenda de gamas. *(Reemplaza footer placeholder Oxatis)*

---

## 1) HOME
1. Barra de utilidad **[F1]** — contacto + WhatsApp siempre visibles.
2. Header + mega-menú + buscador predictivo **[F1]** — *descubrimiento de producto (problema #1).*
3. **Hero de autoridad** **[F1]** — propuesta de valor arriba del pliegue + **doble CTA** (Cotizar / Explorar). *Reemplaza el carrusel de banners (Artexa; evitar video pesado por CWV).*
4. Barra de confianza **[F1]** — 22 años · 10,000+ proyectos · 96 marcas · showroom. *Consolida badges dispersos.*
5. **Navegar por categoría** **[F1]** — tarjetas de colección limpias. *Reemplaza banners pesados.*
6. **Navegar por espacio** **[F1]** — Cocina · Bar · Lavandería · Exterior. *(Ferguson "Shop by Room"; mentalidad de proyecto B2B.)*
7. **Navegar por marca + gama** **[F1]** — grid de 96 marcas + filtro de gama. *(2ª ruta mental; Artexa/KITCH; reusa el grid.)*
8. **Destacado: Refrigeración panelable / built-in** **[F1]** — explota tu #1 orgánico. *(Ferguson "Shop by Feature: Panel Ready" + GSC.)*
9. Novedades / lanzamientos **[F1]** — NikolaTesla, Pitt, etc. *(Auditoría: storytelling de producto.)*
10. **Rutas por segmento (B2B + B2C)** **[F1]** — Arquitectos · Desarrolladores · Cocineros · Particulares → su landing. *(Reusa bloques de segmento.)*
11. **Expertise: "Habla con un especialista"** **[F1]** — asesor real (+ chat/IA después). *(ABT "Get Expert Help".)*
12. **Showroom Querétaro** **[F1]** — fotos, dirección, horarios, "Agenda tu visita". *(Artexa/ABT showroom protagonista.)*
13. Contenido educativo / Guías & Tips **[F1]** — blog. *(Autoridad + SEO; todas las referencias lo tienen.)*
14. **Outlet / Más vendidos** **[F1 ref · F2 compra]** — palanca de conversión honesta. *(James & Steven outlet; filtro "Más vendidos".)*
15. Captura de lead / newsletter **[F1]** → **KOMMO**.
16. Footer **[F1]**.

## 2) COLECCIÓN / PLP (con filtros)
1. Breadcrumb **[F1]** — orientación + SEO.
2. Encabezado de colección **[F1]** — título + **texto experto** + conteo ("138 artículos"). *(Artexa/Palacio; intro útil para SEO.)*
3. **Filtros técnicos + orden** **[F1]** — marca, tipo, gama, **ancho, capacidad, combustible/gas, CFM, zonas, color/acabado, energy star, panel ready, precio**; orden por relevancia/precio/stock/más vendidos. *(Artexa filtros profundos = eficiencia+expertise; corrige problema #1.)*
4. Chips de filtro activo **[F1]** — *(Liverpool: filtrado rápido.)*
5. **Grid de producto** **[F1 + F2]** — tarjeta: marca · título · **precio de referencia + estatus** (Bajo pedido/Disponible) · badge de gama · wishlist/comparar · **doble CTA** (Cotizar primario / Comprar [F2]). *Evita tarjetas sin precio/CTA (error El Tío Sam).*
6. Toggle grid/lista **[F1]** — *(Liverpool.)*
7. Paginación / cargar más **[F1]**.
8. **Guía de compra de la categoría** **[F1]** — bloque educativo. *(KITCH "tips", ABT "Learn"; expertise + SEO.)*
9. CTA asesoría "¿No encuentras? Habla con un especialista" **[F1]**.
10. Footer **[F1]**.

## 3) PRODUCTO / PDP
1. Breadcrumb **[F1]**.
2. **Galería de producto** **[F1]** — varias imágenes reales + badges (gama/estatus/novedad). *Evita pocas fotos/baja calidad (J&S).*
3. **Bloque de compra/lead** **[F1 + F2]** — marca · título · SKU · **precio de referencia + IVA + estatus stock** · gama · **doble CTA**: *Cotizar/WhatsApp* (primario F1) + *Comprar* (F2, activable) · wishlist/comparar. *(Artexa "Cotiza Ahora"; Palacio buy-box para F2.)*
4. **Calculadora de espacio "¿cabrá?"** **[F1]** — *(AJ Madison; app/bloque custom.)*
5. Información del producto **[F1]** — descripción en **formato uniforme**. *Evita copy-paste (KITCH).*
6. **Especificaciones técnicas** **[F1]** — tabla estructurada **con dimensiones**. *(Artexa specs; corrige falta de medidas de J&S.)*
7. **Descargables: ficha técnica PDF + manual** **[F1]** — *(Artexa/Ferguson; señal de expertise.)*
8. **FAQ por equipo** **[F1]** — *(KITCH/J&S.)*
9. **Kits / accesorios recomendados** **[F1 ref · F2 compra]** — jaladeras, kits. *(Ferguson.)*
10. Relacionados / misma marca o gama **[F1]**.
11. Reseñas + conteo **[F2]** — *(Palacio/Liverpool/ABT.)*
12. Garantía e instalación (+ garantía extendida) **[F1 info · F2 upsell]**.
13. **Back-in-stock / "avísame"** si 0 disponibles **[F1]** — *(ABT; corrige frustración de Artexa.)*
14. CTA showroom "Vívelo en el showroom" + WhatsApp **[F1]**.
15. Footer **[F1]**.

## 4) LANDING DE LEAD B2B (arquitectos / desarrolladores / cocineros)
1. **Hero B2B** **[F1]** — propuesta para el profesional + CTA "Hablemos de tu proyecto / Portal Pro". *(Artexa Pro; bloques de segmento.)*
2. Beneficios del canal profesional **[F1]** — precios/condiciones especiales, mayoreo, asesoría de especificación. *(Bloque desarrolladores/cocineros.)*
3. Cómo trabajamos / proceso de proyecto **[F1]**.
4. **Constructor de cotización por áreas / proyecto** **[F1]** — *(Ferguson; app/custom, orientado a lead.)*
5. **Galería de proyectos instalados / casos** **[F1]** — *(ABT; reusa "Clientes y proyectos".)*
6. Marcas y gamas para especificar + acceso a fichas técnicas/listas de precios PDF **[F1]**.
7. **Formulario de lead B2B** **[F1]** — campos de proyecto (tipo, volumen, etapa, ubicación) → **KOMMO**. *(Bloque desarrolladores: mayoreo/volumen.)*
8. Acceso/registro **Pro** (opcional) **[F1]** — *(Artexa Pro.)*
9. Contacto directo del equipo de proyectos + WhatsApp **[F1]**.
10. Footer **[F1]**.

## 5) MARCAS (índice + página por marca)
**Índice de marcas:**
1. Encabezado "Nuestras marcas — 96 marcas, 4 gamas" **[F1]**.
2. **Filtro por gama** (Premium/Residencial/Media/Económica) **[F1]** — *(navegación por gama.)*
3. **Grid de logos** → colección por marca **[F1]** — *(reusa grid de 96; KITCH navegación por marca.)*
4. Marcas destacadas / por categoría **[F1]**.
5. CTA **listas de precios (PDF)** / cotizar **[F1]** — *(recurso de ventas actual.)*

**Página por marca:**
1. Hero de marca — historia/posicionamiento + badge de gama **[F1]**.
2. Productos de la marca (grid filtrable) **[F1]**.
3. Categorías que ofrece la marca **[F1]**.
4. Recursos: listas de precios PDF, fichas técnicas, garantía **[F1]**.
5. CTA cotizar / showroom **[F1]**.

## 6) QUIÉNES SOMOS / SHOWROOM
1. Hero "22 años equipando los mejores proyectos" **[F1]** — *(autoridad; homologar 20→22 años.)*
2. Historia (fundada 2004) + CEO **[F1]** — *migrar de `PBCPPlayer.asp` a `/pages/` limpia.*
3. Cifras de confianza (10,000+ proyectos · 96 marcas · cobertura) **[F1]**.
4. **Showroom Querétaro** **[F1]** — galería, dirección, horarios, mapa, "Cómo llegar". *(Artexa/ABT.)*
5. **Agenda tu visita (cita)** **[F1]** — *(Ferguson/ABT; form→KOMMO.)*
6. **Galería de proyectos instalados** **[F1]** — *(ABT.)*
7. Equipo / asesores ("Habla con un especialista") **[F1]** — *(ABT.)*
8. Marcas y gamas que representamos **[F1]**.
9. CTA contacto / WhatsApp **[F1]**.
10. Footer **[F1]**.

## 7) CONTACTO
1. Encabezado de contacto **[F1]**.
2. Datos homologados **[F1]** — tel 800, oficina, WhatsApp, email. *(Auditoría: homologar.)*
3. **Formulario → KOMMO** **[F1]** — nombre, tel, cel, email, **interés/categoría**, **tipo (B2C/proyecto)**, mensaje.
4. **Showroom** **[F1]** — dirección, horarios, **mapa embebido**, cómo llegar.
5. Canales: WhatsApp directo + redes **[F1]**.
6. FAQ / soporte **[F1]** — enlaces a formas de pago, garantías, envíos, devoluciones.
7. Footer **[F1]**.

---

> Wireframe vacío que materializa estas secciones: carpeta `wireframe/` (una vista por plantilla).
