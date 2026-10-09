# Reglas del carrito ("Mi proyecto") y comentarios finales

> Fuente: `OneDrive …/PAGINA WEB/PAGINA NUEVA 2026/REGLAS DE COMPRA POR MARCA_CLAUDE.xlsx` (hojas INSTRUCCIONES, MARCAS y PARÁMETROS; Carla, 2026-10-06, confirmado 2026-10-08).
> Código: `lib/reglas/reglaMarca.ts` (la regla), `lib/shopify/normalizar.ts` (se evalúa por línea con datos de Shopify), `components/ProyectoCierre.tsx` (comentarios y botón). Datos: `data/reglas-compra.json`.

## 1. La regla, en orden (el primero que aplica gana)

| # | Regla | Resultado | Quién lo decide |
|---|-------|-----------|-----------------|
| 1 | La pieza está **en stock / oferta** (inventario físico, `filtros.disponibilidad = En stock`) | **Se compra en línea**, siempre, sin importar marca ni monto | Shopify (metafield) |
| 2 | La marca está en la lista **"Solo cotizar"** | **Se cotiza** | Columna *REGLA DE LA MARCA* del Excel → `soloCotizar` en el JSON |
| 3 | El precio de venta unitario pasa del **monto límite: $100,000 MXN con IVA** (hoja PARÁMETROS) | **Se cotiza** | `limiteMxnConIva` en el JSON |
| 4 | Todo lo demás | **Se compra en línea** | — |

Reglas de conjunto:

- **Carrito mixto:** si **una sola** pieza se cotiza, **todo el proyecto** se envía como cotización al ejecutivo (no se separa el pedido).
- **La moneda no decide.** Una pieza en dólares que esté en stock o que no pase del límite se paga en línea; Shopify cobra en pesos al FIX del día.
- **Bajo pedido por defecto:** toda pieza es "Bajo pedido" salvo la que tenga inventario.
- **Límite propio por marca:** el Excel permite un monto distinto por marca (columna *MONTO LÍMITE PROPIO*). Hoy ninguna marca lo usa; si se llena, hay que llevarlo al JSON.
- **Stock vendible por marca:** columna *¿LO EN STOCK / OFERTA SE PUEDE COMPRAR?*. Hoy todas dicen "Sí".

Marcas "Solo cotizar" (21 en el Excel; U-Line ya no está en el sitio): Asko, Benessi, Bertazzoni, Bosch, Brizo, Cove, Delta, Dexa, Franke, Gaggenau, Gessi, Hoshizaki, Miele, Pitt Cooking, Scotsman, Sub-Zero, The Galley, Thermador, Viking, Wolf.

## 2. Qué ve el cliente al cerrar el proyecto (Carla, 2026-10-08)

Cuatro casos, y solo cuatro. El modo (`checkout` / `cotizacion`) lo decide el servidor con la regla de la sección 1.

| Situación | Botón | Comentario al pie de los totales |
|-----------|-------|----------------------------------|
| **Todo está en stock** (regla 1 en cada pieza) | **Pagar** → checkout de Shopify | *Sin comentario.* |
| Todo se compra y **todo es en pesos** | **Pagar** → Shopify | "Tu tiempo estimado de entrega puede variar de acuerdo a los productos seleccionados." |
| Todo se compra y **hay piezas en dólares** (ninguna pasa de $100,000 con IVA al TC del día) | **Pagar** → Shopify | "Las piezas en dólares se cobran en pesos al tipo de cambio del día, se recomienda cotizar con un ejecutivo." |
| **Alguna pieza se cotiza** (marca "Solo cotizar" o más de $100,000 con IVA, sin stock) | **Enviar listado por WhatsApp** (pide nombre, teléfono, ciudad, tipo de proyecto) | "Totales con el tipo de cambio al día, tu listado se enviará a un ejecutivo de ventas para confirmar montos y tiempos estimados de entrega." |
| Pago bloqueado (tienda con contraseña o precio en pesos incoherente) | **Pagar** deshabilitado + explicación + enlace a WhatsApp | La explicación del bloqueo |

Notas de implementación:

- Un proyecto mixto (unas en stock, otras bajo pedido) cae en el 2.º o 3.º caso según haya dólares: el comentario del stock solo aplica cuando **todas** están en inventario.
- El caso "se cotiza por monto" usa el mismo botón y comentario que "se cotiza por marca".
- Ya no existe el comentario aparte para piezas de más de $100,000 en stock (se retiró el 2026-10-08 por la tarde): lo en stock se paga sin comentarios.

Título del total: **"Total en pesos"** si todo es MXN; **"Total estimado"** si hay piezas en dólares.

Orden de los totales (Carla, 2026-10-08 noche): **Subtotal** a precio de venta público, antes del descuento (pesos sin IVA) → **Ahorro** (descuento × cantidad) → **IVA 16 %** (sobre subtotal − ahorro) → línea → **Total** = subtotal − ahorro + IVA.

## 3. Casos sin texto propio (por si Carla quiere uno)

1. **Marca "Solo cotizar" con una pieza en stock** → se paga en línea sin aviso.
2. **Pieza no publicada en Shopify** (solo en el índice) → en la cotización preliminar sale "precio por confirmar"; en el carrito no puede entrar.
3. **Dólares y pago en línea** → el comentario dice que se cobra al tipo de cambio del día; el FIX usado se ve en la ficha y en la cotización, no en el carrito.

## 4. Dónde vive cada texto

- Comentarios y botón: `components/ProyectoCierre.tsx` → `notasDelProyecto()`. El botón de WhatsApp abre la pre-cotización (`components/PreCotizacionModal.tsx`), donde el cliente llena sus datos y envía.
- Explicaciones de bloqueo: misma función `textoBloqueo()`.
- Nota de la ficha de producto ("se cotiza con un ejecutivo…"): `lib/shopify/htmlCatalogo.ts` → `ctaHtml()`.
- Pre-cotización (modal y `/cotizacion`): `components/PreCotizacion.tsx`; nota fija al pie "Se le proporcionará un tipo de cambio vigente y tiempos de entrega estimados."
