# Calibración de variantes y filtros por marca — fuente: artexa.com

> Método acordado (2026-07-05): para las marcas que Artexa distribuye, usar su página como
> referencia viva de filtros, acabados y agrupación (sus filtros ya están montados y con precios
> actualizados). Carla revisa las marcas no-Artexa en 07-VARIANTES-VALIDACION.xlsx.

## Hallazgo estructural (aplica a todo)

Artexa agrupa EXACTAMENTE como nuestro plan: producto padre con SKU "P-<modelo>"
(ej. `P-554HAR`, rango de precio USD $528–585) y cada acabado como variante hija
(`child_sku=554HAR-SS-DST`). Confirma la regla de variantes aprobada.

## DELTA — validado ✔ (2026-07-05)

**Patrón de SKU:** `[MODELO]-[CÓDIGO ACABADO]-[SUFIJO SERIE]` → ej. `554HAR-SS-DST`.
El código de acabado es el segmento corto entre guiones; `-DST` es parte del modelo (serie Delta).
Nuestra regla de stem (quitar segmentos alfabéticos ≤3) es correcta para Delta.

**Diccionario de acabados (en construcción, del sitio Artexa):**
| Código | Acabado |
|---|---|
| (sin código) | Cromo |
| SS | Stainless / Cromado Satinado |
| CZ | Champagne Bronze |
| BL | Matte Black (Negro Mate) |
| *(pendiente barrer: PN, RB, NK, GL…)* | |

**Facetas Delta grifería de lavabo (165 productos en Artexa) — capturadas en vivo:**
- Colección: Trinsic 15 · Cassidy 12 · Tetra 11 · Galeon 9 · Stryke 8 · Saylor 7 · Classic 6 · Dorval 6 · Pivotal 6 · Ara 5 …
- Instalación: Sobre Cubierta 141 · Pared 15
- Color: Cromo 120 · Negro 70 · Dorado 61 · Café 34 · Níquel 19
- Tipo de acabado: Cepillado 28 · Pulido 23 · Mate 9
- Tipo de grifería: Monomando 90 · Mezcladora 58 · Manos Libres 6
- Orificios para instalación: 3 (61) · 1 o 3 (47) · 1 (36) · 2 (3) · 2 o 3 (1)
- Altura de grifo: Medio 75 · Alto 38 · Bajo 9
- Empotre incluido: No 102 · Por separado 27 · Incluido 2
- Incluye drenaje: Sí 79 · No 37
- Booleanos: Manerales por separado · Pull Down · Touch · Manos Libres · Incluye Heater

→ **Nuevas facetas a adoptar en PROPUESTA-FILTROS (grifería):** orificios, altura de grifo,
empotre incluido, incluye drenaje, y los booleanos. Artexa las tiene; nosotros no las teníamos.

**Nota de copy:** las PDP de Artexa traen descripción SEO estructurada (párrafo comercial +
"Información del producto" + specs) — buen benchmark para nuestra fase de descripciones.

## SUB-ZERO y WOLF — decodificados con la CLAVE DE NÚMERO DE MODELO oficial ✔ (2026-07-05)

Fuente: tablas "CLAVE DE NÚMERO DE MODELO" de los LPS PDF (compartidas por Carla).
Aplicado al maestro (columnas nuevas: COLECCION_SERIE, JALADERA, BISAGRA, PANELABLE):

**Sub-Zero** — prefijo CL=Serie Clásica, DEC/DET=Designer, PRO=Serie PRO, IC/IW/UC=Bajo cubierta.
Tipo tras el ancho: R todo refri · F todo congelador · U arriba/abajo · FD french door · S side-by-side ·
G puerta vidrio · A vidrio alta altitud · D dispensador · ID dispensador interno.
Sufijos: /O panelable · /S inox · /T jaladera tubular · /P jaladera pro · /R bisagra der · /L izq.

**Wolf** — tipo por prefijo: SO/DO hornos · CSO(P) vapor · SPO speed oven · MDD/MD/MC/MS microondas ·
WWD cajón calentador · VS sellado al vacío · CI/CE/CG parrillas ind/eléc/gas · MM/SM/FM/GM módulos.
Serie: TM/PM/CM (Serie M transicional/profesional/contemporáneo), TE/PE (Serie E), T/P/C en parrillas.
Sufijos: /S inox · /B cristal negro · /T,TH jaladera tubular · /P,PH profesional · /LP gas LP · /O exterior.

Resultado: 247 productos con colección (Clásica 126, Designer 53, Series M/E 61, PRO 6),
198 con jaladera, 164 con bisagra, 44 panelables. Los ~2.7k restantes son refacciones/accesorios
con número de parte (no siguen la clave — correcto).

**Faceta COLECCIÓN por marca (regla Carla):** Sub-Zero/Wolf → Transicional · Profesional ·
Contemporáneo (+ Serie Clásica/Designer/PRO en refrigeración). Thermador → Masterpiece® ·
Professional (así los filtra Artexa). Gaggenau → Vario, series 200/400. Extender por marca
cuando la nomenclatura sea clara.

## Pendientes de calibrar con artexa.com (mismas categorías → mismos filtros)
- [ ] Delta cocina + regaderas + tinas (completar diccionario de acabados)
- [ ] Brizo (colecciones Litze/Artesso/Rook/Tulham; códigos PC/GL/NK/SL…)
- [ ] Peerless
- [ ] Blanco (tarjas: material Silgranit/acero, tazones, instalación)
- [ ] Elica / Thermador / Gaggenau / Bosch (cocción: no usan variantes de acabado igual)
- [ ] Bertazzoni (series PROF/MAST separan producto — ya validado con caso de Carla)
- [ ] InSinkErator / Alfresco / Artisan / Hoshizaki / Benessi / Gessi / Kraus / Pitt / Thor

## Marcas NO-Artexa (revisa Carla en 07-VARIANTES-VALIDACION.xlsx)
Viking · Sub-Zero · Wolf · Cove · U-Line · Miele · ASKO · AXOR · Hansgrohe · Smeg · Teka ·
Kele · Mabe/GE Profile · Coyote · The Galley · Scotsman · Alfa Forni · Firplak · Eclipse/Schock
