# Políticas de Shopify — propuesta de cambios (2026-10-14)

> **Estado 2026-10-14 (tarde): APLICADO en Shopify** — Aviso de privacidad, Términos,
> Aviso legal y Contacto (la app "HOMEA Sitio Web" ya tiene `write_legal_policies`).
> Pendientes: Política de envíos (§6), limpieza de Devoluciones (§4) y garantía extendida.
>
> Después de editar una política en Shopify, el sitio la muestra al momento con
> `GET /api/revalidar-politicas` + `Authorization: Bearer $CRON_SECRET`; si no, tarda hasta 24 h.

---

## 1. Aviso de privacidad — listo para aplicar (lo pediste)

**a) Fecha.** "Última actualización: 24 de septiembre de 2026" → **"Última actualización: 14 de octubre de 2026"**.

**b) Domicilio (2 veces).** "Calle Ahuehuetes No. 7, Col. Álamos 1a Sección, C.P. 76160, Querétaro, Querétaro, México" → **"Calle del Ahuehuete 7, Col. Álamos 1a Sección, C.P. 76160, Santiago de Querétaro, Qro., México"**.

**c) Información general.** Sustituir el párrafo "HOMEA utiliza tecnología de Shopify para operar nuestra tienda en línea y proporcionar determinados Servicios." por:

> Nuestro sitio web www.homea.mx se aloja en Vercel. La tienda en línea (catálogo, carrito y proceso de pago) opera con tecnología de Shopify.

**d) Cómo comunicamos o transferimos datos personales.** Agregar a la lista, después de "Shopify y proveedores tecnológicos necesarios para operar nuestra tienda.":

> Proveedores de alojamiento web, mensajería y analítica, como Vercel, Meta (WhatsApp) y Google, en los términos descritos en este Aviso de Privacidad.

**e) Relación con Shopify.** Cambiar el título a **"RELACIÓN CON SHOPIFY Y VERCEL"** y sustituir el primer párrafo por estos dos:

> El sitio web www.homea.mx se aloja en Vercel, que procesa datos técnicos de su visita (como dirección IP, navegador y páginas solicitadas) para entregar el sitio y mantener su seguridad.
>
> La tienda en línea, el carrito y el proceso de pago operan en Shopify, que recopila y procesa determinados datos personales relacionados con su acceso y uso de los Servicios para proporcionar la infraestructura y funcionalidades de nuestra tienda.

**f) Sección nueva, antes de "Sitios web y enlaces de terceros": "WHATSAPP Y PRE-COTIZACIONES"**

> Cuando solicita una pre-cotización desde el sitio o nos escribe por WhatsApp, recabamos su nombre, teléfono, ciudad, tipo de proyecto y los productos de su interés, con la finalidad de preparar su cotización, darle seguimiento y atender su compra.
>
> Estas conversaciones se realizan a través de WhatsApp, servicio de Meta Platforms, sujeto a sus propios términos y políticas de privacidad. Le recomendamos no compartir por este medio datos que no sean necesarios para su solicitud.

**g) Cookies y tecnologías similares.** Agregar después de la lista de usos:

> Además, el sitio guarda en su navegador (almacenamiento local) su lista de favoritos y los productos que agrega a "Mi proyecto", para conservarlos entre visitas. Esta información permanece en su dispositivo y puede borrarla desde la configuración de su navegador.
>
> La página de Contacto muestra un mapa de Google Maps, que puede utilizar sus propias cookies. Cuando se encuentren habilitadas, HOMEA podrá utilizar herramientas de analítica y medición publicitaria de terceros, como Google Analytics y el píxel de Meta, de acuerdo con las preferencias que usted elija en el banner de cookies.

---

## 2. Términos y condiciones — APROBADO (2026-10-14), listo para aplicar

Reglas de Carla: marcas solo cotización (mayormente las de USD); más de $100,000 con IVA por pieza se cotiza; piezas en stock con precio final en pesos se venden; "Mi proyecto" puede ser mixto; vigencia 14 días (sin justificación); precios cambian sin previo aviso; todo lo que está en USD se presenta en "Mi proyecto" con su equivalente en pesos al TC del día.

- Fecha → "Última actualización: 14 de octubre de 2026".
- Domicilio (2 veces) → "Calle del Ahuehuete 7, Col. Álamos 1a Sección, C.P. 76160, Santiago de Querétaro, Qro., México" (como la CSF).
- Datos sensibles fuera: se borran la frase "La razón social, RFC y domicilio anteriores corresponden a los datos contenidos en la Constancia de Situación Fiscal…" y la línea "CONSTANCIA DE SITUACION FISCAL NPC agosto 2026.pdf". El RFC de la empresa se queda (identifica al proveedor; no es dato personal).
- **Sección 3, al final — "Compra en línea y cotización":** Los productos pueden pagarse directamente en la tienda en línea, salvo: productos de las marcas que se comercializan únicamente bajo cotización; productos con precio mayor a $100,000.00 MXN por pieza, IVA incluido. Los productos en existencia con precio final en pesos mexicanos pueden comprarse en línea. El sitio indica en cada producto si puede pagarse en línea o si se cotiza. "Mi proyecto" puede reunir productos de compra en línea y productos que se cotizan; cuando incluya al menos uno que deba cotizarse, el asesor atiende el proyecto completo mediante cotización.
- **Sección 3 — "Pre-cotizaciones":** informativa, vigencia de 14 días naturales desde su emisión, no es pedido ni reserva de inventario; tipo de cambio, disponibilidad, tiempos de entrega y descuentos se confirman en la cotización formal.
- **Sección 4 — moneda:** los precios están en MXN, salvo los productos cuyo fabricante tiene lista en USD, que se publican en dólares como referencia. En "Mi proyecto" todo lo que está en dólares se presenta con su equivalente en pesos al tipo de cambio del día (FIX de Banxico publicado en el DOF); los pagos en línea son en pesos por el total mostrado antes de concluir la compra.
- **Sección 4 — cambios de precio (reforzada):** "Los precios, descuentos, promociones y disponibilidad publicados en el sitio pueden cambiar sin previo aviso, incluido el equivalente en pesos de los precios en dólares, que se actualiza diariamente conforme al tipo de cambio. Dichos cambios no afectarán pedidos previamente confirmados, salvo error manifiesto…"
- Sección 6 → la referencia a la Política de envíos se agrega cuando esa política exista.

**Pendiente — garantía extendida:** la página de Garantías dice "Garantía de fábrica + extensión disponible". Si HOMEA ofrece extensión, se agrega a la Sección 7; si no, se quita del sitio.

## 3. Aviso legal — APROBADO (2026-10-14), listo para aplicar

Son textos de borrador que quedaron publicados: comentan la ley en vez de establecer una regla. Propuesta: borrarlos.

- "CONSTANCIA DE SITUACION FISCAL NPC agosto 2026.pdf" (aparece 2 veces).
- "La Ley Federal de Protección al Consumidor y el monitoreo de PROFECO contemplan que…" (sección 3).
- "PROFECO incluye entre los elementos revisados en las tiendas virtuales…" (sección 4).
- "PROFECO considera, entre los elementos relevantes del comercio electrónico…" (sección 5).
- "PROFECO incluye expresamente el Aviso de Privacidad…" (sección 8).
- "Shopify señala igualmente que el comerciante es responsable…" (sección 10).
- "PROFECO recordó en marzo de 2026 que las cláusulas…" (sección 13).
- Sección 9: "consulte nuestra Política de Cookies y nuestro Aviso de Privacidad" → "consulte la sección de cookies de nuestro Aviso de Privacidad".
- Datos sensibles: se borra también la frase "La razón social, RFC y domicilio corresponden a los datos fiscales proporcionados por HOMEA en su Constancia de Situación Fiscal." y la oración de la actividad registrada ante el SAT.
- Sección 4: se agrega que los productos con lista en USD se publican en dólares como referencia y que en "Mi proyecto" se presentan con su equivalente en pesos al tipo de cambio del día.
- Fecha → 14 de octubre de 2026. Domicilio (2 veces) → "Calle del Ahuehuete 7…".

## 4. Devoluciones — limpieza (PARA CONFIRMAR)

- Sección 6, borrar la frase final: "La política original exige conservar el empaque y establece condiciones específicas para productos con fallas técnicas." (es una nota de quien la redactó).
- Se mantiene el teléfono de oficina.

## 5. Contacto

- Domicilio → "HOMEA, Calle del Ahuehuete 7, Col. Álamos 1a Sección, C.P. 76160, Santiago de Querétaro, Qro., México".

---

## 6. Política de envíos — BORRADOR NUEVO (PARA CONFIRMAR)

> **POLÍTICA DE ENVÍOS Y ENTREGAS**
>
> Última actualización: [fecha de publicación]
>
> En HOMEA Premium coordinamos la entrega de tus equipos para que lleguen en buen estado y a tiempo. Debido a que comercializamos electrodomésticos de distintas marcas, dimensiones y pesos, las condiciones de envío pueden variar según el producto y el destino.
>
> **1. Cobertura**
> Realizamos entregas en toda la República Mexicana.
>
> **2. Costo de envío**
> El costo de envío depende del destino, las dimensiones, el peso y las características de los equipos. Salvo que se indique lo contrario, no está incluido en el precio de los productos: se cotiza por separado con la paquetería correspondiente y se informa al cliente antes de programar el envío.
>
> **3. Tiempos de entrega**
> Una vez autorizado el envío, la preparación de los equipos puede tomar de 1 a 3 días hábiles. Posteriormente, la entrega tarda aproximadamente de 1 a 5 días hábiles, dependiendo del destino.
> Los productos sobre pedido o sin existencia inmediata tienen tiempos distintos, que HOMEA informa al confirmar el pedido. Los tiempos son estimados y pueden variar por causas ajenas a HOMEA, como disponibilidad del fabricante, condiciones del transportista o del destino.
>
> **4. Cómo programar tu envío**
> 1. Completa nuestro formulario de envío con los datos de la persona que recibirá la mercancía y el domicilio de entrega.
> 2. El equipo de Post Venta de HOMEA revisa la información y cotiza el envío con la paquetería correspondiente.
> 3. Una vez autorizado el envío y, en su caso, cubierto su costo, se prepara y se entrega la mercancía al transportista.
>
> **5. Rastreo**
> Una vez enviado tu pedido, recibirás la carta porte o el número de rastreo correspondiente.
>
> **6. Recepción de la mercancía**
> Es indispensable que una persona mayor de edad esté disponible en el domicilio de entrega y atenta a las llamadas del transportista. Si no hay respuesta o nadie puede recibir, la entrega puede reprogramarse y podrían generarse cargos adicionales.
>
> **7. Revisa tu pedido antes de firmar**
> Antes de aceptar la mercancía, revisa cuidadosamente las cajas y verifica que el modelo corresponda con tu compra. Si observas daños, no firmes de recibido: toma fotografías y video 360° del empaque y comunícate de inmediato con HOMEA. El procedimiento completo está en nuestra Política de devoluciones, cancelaciones y reembolsos.
>
> **8. Contacto**
> Teléfono: (442) 216 3552
> Correo electrónico: postventa@homea.mx
>
> HOMEA Premium — New Products Connection, S.A. de C.V.

**Preguntas abiertas para la política de envíos:**
- ¿Se puede recoger en showroom o bodega sin costo de envío?
- ¿Hay maniobras especiales (subir pisos, grúa, desmontar puertas) que se cobren aparte?
- "Persona mayor de edad" es una sugerencia; confírmala o se quita.
