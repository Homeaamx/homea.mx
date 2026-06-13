# Fase 1 — Concepto y Arquitectura de Secciones (Landing HOMEA)

> Base: design system (lujo editorial, negro+dorado, Montserrat) + datos reales (GSC/GA4) + modelo lead-first.
> Audiencia: consumidor final premium **+** B2B (arquitectos, interioristas, desarrolladores, cocinas integrales).
> Alcance: **landing front-end primero**; catálogo/tienda después. Dominio NO se apunta a Shopify hasta tener catálogo + 301 (Fase 5).

---

## 1. Concepto central

**HOMEA = el curador experto del equipamiento premium para el hogar.**
No vendemos electrodomésticos: equipamos hogares con las mejores marcas del mundo, con la asesoría de quienes saben.

- **Idea fuerza:** *"Las mejores marcas del mundo, con quien sí sabe asesorarte."*
- **Tono:** aspiracional pero cálido y accesible (no frío/elitista); experto y confiable.
- **Conversión #1:** generar **contacto cualificado** (lead → WhatsApp/showroom), no la venta en línea.

## 2. Principios de la landing
1. **Lead-first:** CTA primario = "Cotizar con un experto" / WhatsApp. "Comprar" queda **flexible** (se activa cuando definamos la regla).
2. **Doble ruta:** consumidor final **y** proyectos B2B, con caminos claros.
3. **Franquicia SEO al frente:** refrigeración **panelable/built-in** + marcas premium (tu mayor fuerza orgánica) protagonizan.
4. **Confianza consultiva:** asesoría + showroom + acompañamiento como diferenciador.
5. **Móvil impecable:** tu mayor oportunidad de crecer (hoy CWV móvil pésimo).
6. **Local Querétaro:** showroom y SEO local visibles.

---

## 3. Arquitectura de secciones
> Cada sección se construye con un componente que YA existe en tu design system.

| # | Sección | Componente DS | Objetivo | CTA |
|---|---|---|---|---|
| 0 | **Barra de anuncio** | `announce` | Confianza inmediata | "Showroom en Querétaro · Asesoría experta sin costo" |
| 1 | **Header sticky** | `header.site` (wordmark centrado) | Navegación + acceso a contacto | Nav: Cocina · Refrigeración · Bar · Exterior · Lavandería · Marcas · Showroom + botón **Cotizar/WhatsApp** |
| 2 | **Hero editorial** | `hero` (enmarcado, destello dorado) | Posicionamiento premium + captar | Primario: **Cotizar con un experto** · Fantasma: **Explorar el catálogo** |
| 3 | **Marcas autorizadas** | banda de logos (nueva, estilo `eyebrow`) | Autoridad: Viking, Wolf, Sub-Zero, Miele, Thermador, Monogram | — (distribuidor autorizado) |
| 4 | **Categorías** | `categories` (grid 4) | Navegación por mundo de producto | Cocina · Refrigeración · Bar/Vinotecas · Exterior · Lavandería · Confort |
| 5 | **Destacado: Refrigeración panelable** | `editorial` (bloque + firma) | Explotar tu #1 SEO/comercial | **Cotizar refrigeración a tu medida** |
| 6 | **Selección destacada** | `products` (grid + flags) | Mostrar producto premium / novedades | Por producto: **Cotizar** (y **Comprar** si aplica) |
| 7 | **Por qué HOMEA (asesoría)** | `ritual` (3 pasos) | Diferenciador consultivo | i. Te asesoramos · ii. Vives el producto (showroom) · iii. Te acompañamos al cierre y postventa |
| 8 | **Showroom Querétaro** | `editorial` | Tráfico a showroom + SEO local | **Agenda tu visita** + mapa/dirección |
| 9 | **Ruta B2B / Proyectos** | banda dedicada (nueva) | Captar arquitectos/desarrolladores | **¿Tienes un proyecto? Hablemos** (lead/programa) |
| 10 | **Cotizador / Captura de lead** | `newsletter` → re-skin a formulario | **Conversión principal** → KOMMO | Form: nombre, teléfono, email, categoría/producto de interés, tipo (hogar/proyecto) + **WhatsApp** |
| 11 | **Journal / Guías** *(opcional, SEO)* | `journal` (grid 3) | Autoridad + keywords (guías, comparativas) | "Ver todas las notas" |
| 12 | **Footer** | `footer.site` | Navegación + **NAP local** + legal | Categorías · Marcas · Showroom/Contacto · Ayuda |
| — | **Botón flotante WhatsApp** | nuevo (persistente) | Contacto inmediato siempre visible | WhatsApp |

---

## 4. Lógica de CTAs (flexible — a confirmar después)
- **Por defecto: "Cotizar"** (lead → KOMMO/WhatsApp) en todo producto de alto ticket.
- **"Comprar"** se diseña pero queda **oculto/activable** por colección o etiqueta cuando definas la regla (precio o categoría).
- Cada ficha de producto contempla **ambos botones** desde el diseño, para no rehacer después.

## 5. Doble ruta (consumidor vs B2B)
- **Consumidor:** Hero → Categorías → Producto → Cotizar/Showroom.
- **B2B (proyectos):** entrada propia en Header ("Proyectos") + sección 9 → formulario con campo "tipo: proyecto" → ruta de atención B2B en KOMMO.

## 6. SEO en el contenido (sin dominio aún)
- Textos de Hero/Categorías/Destacado deben usar el vocabulario que ya rankea: **refrigeración panelable, built-in, marcas premium, Querétaro**.
- Mantener **paridad/mejora** de contenido vs. lo que rankea hoy cuando se construya el catálogo.

---

## 7. Siguiente paso (Fase 2)
- Convertir esta arquitectura en **wireframe/layout** (orden y jerarquía visual de las secciones), refinar y eliminar lo que no aporte, y cerrar el **layout oficial** para empezar a construir en el tema Shopify.
