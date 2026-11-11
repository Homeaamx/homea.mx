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

Marcas "Solo cotizar" (21 en el Excel; U-Line ya no está en el sitio; Alfa Forni sumada el 2026-11-10 por la regla IESA): Alfa Forni, Asko, Benessi, Bertazzoni, Bosch, Brizo, Cove, Delta, Dexa, Franke, Gaggenau, Gessi, Hoshizaki, Miele, Pitt Cooking, Scotsman, Sub-Zero, The Galley, Thermador, Viking, Wolf.

**Regla IESA/Lavish (Carla, 2026-11-10):** cualquier marca que se compra a IESA/Lavish (hoy Alfa Forni, Cove, Dexa, Scotsman, Sub-Zero, The Galley y Wolf) **se cotiza siempre, salvo la pieza que esté en stock** (esa se paga en línea por la regla 1). Toda marca nueva de IESA entra a `soloCotizar`.

## 2. Qué ve el cliente al cerrar el proyecto (Carla, 2026-10-08)

Cuatro casos, y solo cuatro. El modo (`checkout` / `cotizacion`) lo decide el servidor con la regla de la sección 1.

| Situación | Botón | Comentario al pie de los totales |
|-----------|-------|----------------------------------|
| **Todo está en stock** (regla 1 en cada pieza) | **Pagar** → checkout de Shopify | *Sin comentario.* |
| Todo se compra y **todo es en pesos** | **Pagar** → Shopify | "Tu tiempo estimado de entrega puede variar de acuerdo a los productos seleccionados." |
| Todo se compra y **hay piezas en dólares** (ninguna pasa de $100,000 con IVA al TC del día) | **Pagar** → Shopify | "Tipo de cambio al 4 de noviembre de 2026. Las piezas en dólares se cobran en pesos al tipo de cambio del día, se recomienda cotizar con un ejecutivo." (la fecha es la del FIX con el que están los pesos; Carla, 2026-11-04) |
| Todo se compra y **alguna pieza en dólares trae el tipo de cambio de un día anterior** o el FIX aún no es el de hoy (`tc-vencido`, Carla 2026-11-04/05) | **Pagar** se ve igual, pero sin `checkoutUrl`: abre el aviso `tc-vencido` con "Continuar con pre-cotización". Un solo botón (Pagar). En /mi-proyecto el título dice "Casi listo para *pagar*." con "Tus piezas en dólares necesitan el tipo de cambio de hoy. Un ejecutivo te lo confirma para que puedas completar tu compra." (Carla, 2026-11-05) | "Tu producto tiene / Tus productos tienen **el tipo de cambio del día <fecha>**, necesitas **contactar a un ejecutivo** para que te proporcione el precio con **el tipo de cambio del día de hoy**." |
| **Alguna pieza se cotiza** (marca "Solo cotizar" o más de $100,000 con IVA, sin stock) | **Enviar listado a un ejecutivo** (abre la pre-cotización, cuyo botón final es "Enviar por WhatsApp a un ejecutivo"; pide nombre, teléfono, ciudad, tipo de proyecto) | "Totales con el tipo de cambio al día, tu listado se enviará a un ejecutivo de ventas para confirmar montos y tiempos estimados de entrega." |
| Pago bloqueado (tienda con contraseña o precio en pesos incoherente) | **Pagar** deshabilitado + explicación + enlace a WhatsApp | La explicación del bloqueo |

Notas de implementación:

- Un proyecto mixto (unas en stock, otras bajo pedido) cae en el 2.º o 3.º caso según haya dólares: el comentario del stock solo aplica cuando **todas** están en inventario.
- El caso "se cotiza por monto" usa el mismo botón y comentario que "se cotiza por marca".
- Ya no existe el comentario aparte para piezas de más de $100,000 en stock (se retiró el 2026-10-08 por la tarde): lo en stock se paga sin comentarios.

Título del total: **"Total en pesos"** si todo es MXN; **"Total estimado"** si hay piezas en dólares.

Orden de los totales (Carla, 2026-10-09, sustituye al del 2026-10-08): **todo con IVA**. **Subtotal** a precio de lista con IVA (`subtotalConIva`) → **Ahorro** con IVA (`ahorroConIva`, derivado como subtotal − total para que cierre al centavo) → línea → **Total** (IVA incluido) → debajo, en gris y sin sumarse, "Incluye IVA 16 %: $X" y el tipo de cambio aplicado. Razón: el cliente final (Profeco) debe ver siempre el precio que paga; mezclar líneas con IVA y un subtotal sin IVA confundía. La pre-cotización conserva el formato SAE sin IVA, pero sus encabezados lo dicen ("P/U sin IVA", "Importe sin IVA", "Subtotal sin IVA", "Total · IVA incl.").

**Tipo de cambio aplicado (2026-10-09):** cuando hay piezas en dólares, bajo el total va la línea "Tipo de cambio aplicado · 1 USD = 17.97 MXN". Es el FIX con el que el cron escribió los pesos en Shopify (`Carrito.tipoCambio`, derivado en `lib/shopify/normalizar.ts` como pesos de venta ÷ dólares de venta), que puede NO coincidir con el de la barra superior (ese se consulta al momento; los precios de Shopify se actualizan con el cron de las 19:00 UTC, lunes a viernes). Sin esta línea el cliente veía líneas en dólares y totales en pesos sin saber cómo se pasaba de uno a otro.

**El tipo de cambio tiene que ser el de HOY (Carla, 2026-11-05):** además de lo de abajo, en un día hábil, si el último FIX publicado no es el de hoy (Ciudad de México), el pago en dólares también se bloquea (`esFixDeHoy` en `lib/tipoCambio.ts`). Es lo que pasa cada mañana hasta que Banxico publica (≈12:00) y el cron reprecia (13:00). Sábado y domingo vale el FIX del viernes. En feriados bancarios Banxico no publica, así que ese día todo lo que trae dólares se cotiza. Con el bloqueo, "Pagar" abre el aviso `tc-vencido`: "Uno o más de tus productos tienen **precio en dólares** y se debe **consultar el tipo de cambio del día de hoy** para poder proceder al pago. Enviaremos tu pedido a **un ejecutivo** para que te proporcione la información completa de tu producto, los **tiempos de entrega estimados** y **el tipo de cambio vigente**, y así evitar cualquier imprevisto." Su botón es "Continuar con pre-cotización".

**Tipo de cambio de un día anterior (Carla, 2026-11-04):** el servidor (`app/acciones/carrito.ts` → `fecharTipoCambio`, `lib/tipoCambio.ts` → `diaDelTipoCambio`) compara el tipo de cambio de **cada** pieza en dólares (pesos de Shopify ÷ dólares) con el FIX vigente de Banxico. Si todas coinciden, `tipoCambioDia` es la fecha del FIX. Si alguna no coincide, busca en los FIX de los últimos 15 días de qué día es, marca `tipoCambioVencido` y bloquea el pago con `tc-vencido` (va antes del candado de la tienda). Solo aplica a proyectos `checkout`: si algo se cotiza, el listado ya va al ejecutivo. Sin respuesta de Banxico nunca se bloquea. En la práctica, ocurre entre la publicación del FIX (≈12:00 CDMX) y la corrida del cron (19:00 UTC, 13:00 CDMX), o si el cron falla.

**Formato de las notas (Carla, 2026-11-05):** en el cajón van en rojo oscuro de 12px con una línea roja a la izquierda; en /mi-proyecto, con formato de aviso (texto oscuro de 14px y línea dorada). Las partes importantes van en negritas.

**Aviso antes de salir del proyecto (Carla, 2026-11-04):** "Pagar" y "Enviar listado a un ejecutivo" ya no salen directo. Primero abren al centro `components/AvisoCierre.tsx`: rojo oscuro (#8c2f24), triángulo con "!", título "Antes de continuar", y debajo "Prefiero hablar con un ejecutivo" (abre la pre-cotización, solo en los avisos de pago) y "Volver a mi proyecto" (o Escape). Redacción pulida por Claude, con "imprevisto" en lugar de "confusiones":

| Botón | Cuándo | Texto | Botón principal |
|-------|--------|-------|-----------------|
| Pagar | Alguna pieza en dólares | "Uno o más de tus productos tienen precio en dólares. Te recomendamos contactar a un ejecutivo para que te proporcione la información completa de tu producto, los tiempos de entrega estimados y el tipo de cambio vigente, y así evitar cualquier imprevisto." + "Si estás de acuerdo, haz clic en «Continuar con pago»." | Continuar con pago → checkout |
| Pagar | Todo en pesos (cumple todas las reglas) | "Antes de continuar con tu compra, te recomendamos contactar a un ejecutivo de ventas para que te proporcione un tiempo de entrega estimado más preciso y así evitar cualquier imprevisto." + "Si deseas continuar con tu compra, haz clic en «Continuar con pago»." | Continuar con pago → checkout |
| Enviar listado a un ejecutivo | El proyecto se cotiza | "Uno o más de los productos seleccionados tienen precio en dólares o superan el límite de compra en línea. Para tu protección, necesitamos confirmarte el tipo de cambio vigente y los tiempos de entrega estimados. A continuación, llena tus datos y enviaremos tu pre-cotización a un ejecutivo." | Continuar con pre-cotización → `PreCotizacionModal` |

## 3. Casos sin texto propio (por si Carla quiere uno)

1. **Marca "Solo cotizar" con una pieza en stock** → se paga en línea sin aviso.
2. **Pieza no publicada en Shopify** (solo en el índice) → en la cotización preliminar sale "precio por confirmar"; en el carrito no puede entrar.
3. **Dólares y pago en línea** → el comentario dice que se cobra al tipo de cambio del día; el FIX usado se ve en la ficha y en la cotización, no en el carrito.

## 4. Dónde vive cada texto

- Comentarios y botón: `components/ProyectoCierre.tsx` → `notasDelProyecto()`. El botón de WhatsApp abre la pre-cotización (`components/PreCotizacionModal.tsx`), donde el cliente llena sus datos y envía.
- Explicaciones de bloqueo: misma función `textoBloqueo()`.
- Nota de la ficha de producto ("se cotiza con un ejecutivo…"): `lib/shopify/htmlCatalogo.ts` → `ctaHtml()`.
- Pre-cotización (modal y `/cotizacion`): `components/PreCotizacion.tsx`; nota fija al pie "Se te proporcionará un tipo de cambio vigente y tiempos de entrega estimados." (de tú, como todo el sitio; 2026-11-05) Solo nombre y teléfono son obligatorios (ciudad, CP, correo y nombre del proyecto son opcionales y así se marcan).
- Mensaje de WhatsApp al vendedor: `lib/cotizacion.ts` → `mensajeCotizacion()`. Es UNO solo para el modal y para `/cotizacion` (2026-10-09): folio, link, datos del cliente, partidas en su moneda sin IVA y totales por moneda, igual que el documento. Ya no se mandan los totales en pesos del carrito dentro del mensaje.
- Páginas `/wishlist` y `/mi-proyecto` (2026-10-09): lista de filas (`.sel-row`) + panel de resumen pegajoso (`.sel-aside`), CSS compartido en el bloque "Listas personales" de `styles/theme.css` (espejo en `preview/theme.css`).
