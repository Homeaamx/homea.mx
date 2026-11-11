# Catalogación de campanas — filtro Diseño (`filtros.diseno`)

Reglas de Carla (2026-11-11) a partir de sus correcciones sobre el listado de campanas.
**Aplicarlas al cargar cualquier marca nueva.** El Diseño se decide por la **forma** del
producto en su foto, no por el nombre que trae el proveedor (Elica llama "T Invertida" a
campanas columna; Thermador llama "Piramidal" o "Cuadrada" a campanas T invertida).
El tipo de instalación (pared / isla / techo / sobre cubierta) es un filtro aparte.

| Diseño | Cómo se ve | Ejemplos |
|---|---|---|
| **Rectas** | Caja rectangular de frente plano, **también la campana profesional tipo caja con chimenea** (estilo comercial) | Café CVW9364x / UVW9364x, Elica Torino, KitchenAid KVWC956/958, Wolf PW / PI / PWC |
| **T invertida** | Chimenea + cubierta horizontal delgada (la "T" al revés), sin pendiente marcada. Haiku 24" se queda aquí aunque sea angosta | Thermador HMIB / HMCB, GE Profile CGP1220I7I, Mabe CM9017P2I, Wolf VW, Elica Haiku 24"–48" |
| **De cristal** | La cubierta es de vidrio. **Vidrio plano + chimenea = De cristal + T invertida**; vidrio curvo = solo De cristal | Plano: Mabe CU9018P2DS0, CM9018P2I · Curvo: Elica PRF018057x |
| **Piramidal** | Chimenea + cubierta en forma de pirámide (laterales inclinados), aunque la cubierta sea baja | GE Profile PVW1036SWSS, Elica Mezzano, KitchenAid KVIB606 y KVWC730/736, Mabe CPSU5301TS0 |
| **Cilíndrica o cuadrada** | El cuerpo entero es una columna (cilindro o prisma) sin cubierta ancha | Elica Haiku 13" (pared e isla) |
| **Decorativas** | Suspendidas del techo con cables, tipo lámpara | Elica Easy / Easy UX, Seashell, Star |
| **Gran formato** | Isla muy ancha, de 72" o más | Elica Haiku 72" (PRF0157487) |
| **Bajo mueble** | Va bajo la alacena, sin chimenea: visera, bajo alacena y campana profesional "estilo comercial" bajo gabinete | Mabe CMPU…, CM8042I, KitchenAid KVWC906/908KSS, Thermador HMWB |
| **Slider** | Frente telescópico o extraíble que se desliza hacia afuera. **Solo Slider**, aunque vaya bajo mueble o tenga chimenea | Thermador HMDW y HDDB, IO Mabe IOT8002I1 / IOT6002I |
| **Tipo inserto** | Módulo para empotrar dentro de un mueble o campana a medida | Elica PRF0140693A, Monogram UVC9…, Bertazzoni KIN36XV2 |
| **Para revestir** | Campana hecha para forrarse con el acabado de la cocina (incluye la "campana oculta") | Wolf PL, Thermador VCI / VCIN, Mabe CM7648PIW0 |
| **A techo** | Empotrada en el plafón | Elica PRF0156852, Wolf VC |
| **Retráctiles** | Sube desde la cubierta (downdraft) | Wolf DD, KitchenAid KXD |
| **De superficie** | Extractor integrado a la cubierta | Gaggenau VL |

**Títulos:** el título no debe nombrar un diseño distinto al del filtro (p. ej. "Campana de Isla
Cuadrada" en una T invertida). Al cambiar el título, el handle se queda igual (la URL del sitio es
`/producto/<sku>`), así que no se pierde SEO.

## Cómo revisarlo

1. Hoja de contactos con la foto principal de cada campana, agrupada por Diseño.
2. Revisar a ojo contra la tabla y corregir con `metafieldsSet` (`filtros.diseno`, lista).
3. Revisar también la instalación (`filtros.instalacion`): pared / isla.
