# Marcas: canal web y descuentos (SEP26)

> **Fuente:** `MARCAS_HOMEA_SEP26_DESCUENTOS.xlsx` (Carla, 2026-09-21), hojas *MARCAS NUEVA PAG* y
> *MARCAS ELIMINADAS*, con las decisiones que Carla tomó ese mismo día (abajo). Esta tabla es una
> copia para trabajar. Si el Excel cambia, se regenera desde el Excel.
>
> 🔒 **Sin costos ni márgenes.** El Excel también trae el descuento de costo del proveedor, el flete y
> el margen con y sin Shopify. Esa información **no se copia aquí porque el repo es público**
> (`Homeaamx/homea.mx`). Para costos y márgenes, consultar el Excel.

## Qué significa cada canal

| Canal | En Shopify | En el sitio |
|---|---|---|
| **SHOPIFY** (68) | Catálogo completo, precio, inventario, carrito y checkout | `/marcas/<slug>` **con** listado y filtros de productos (Storefront API); aparece en PLP, filtros y buscador |
| **SOLO PDF** (25) | No se sube | El botón de la marca en `/marcas` abre `/marcas/<slug>`, que muestra **el PDF** (catálogo o lista) y la cotización por WhatsApp, **sin** listado ni filtros de Shopify. Existe **por SEO** |

En el código, el canal vive en el tile de `preview/marcas.html` (`data-canal="shopify|pdf"`), pasa a
`data/marcas.json` con `npm run marcas` y la plantilla `app/marcas/[marca]/page.tsx` lo respeta.

**La asignación por marca manda sobre la regla por macrocategoría** (decisión del 2026-09-21 en el
plan). Kamado Joe, Masterbuilt, WPPO y La Cornue son de cocina o asadores y van **solo como PDF**.

## Decisiones de Carla (2026-09-21)

1. **Orden de trabajo de los PDFs:** se trabajan **marca por marca**, para que el PDF de cada una se
   presente sin error. Es el paso siguiente a subir los catálogos. Primero las marcas de **Cocina y Bar,
   Exterior, Electrodomésticos menores, Lavandería y Minisplits**; lo demás queda pendiente.
   De **Brizo, Delta y Axcent solo se trabaja la línea de cocina**.
2. **Eliminadas:** se quitan de todo el sitio porque ya no se venden. Hecho el 2026-09-21: Hansgrohe,
   Keuco, American Standard y Moen perdieron página, tile, enlace de menú, fotos, logos y listas de precios.
   Las URLs viejas de sus PDFs redirigen (301) a su categoría.
3. **Saunas de Grupo 90: descatalogadas.** Solo se presentan las saunas que ofrece **Artexa**.
   Se crearon las **16 páginas** que faltaban: 6 SHOPIFY y 10 SOLO PDF. Los PDFs vigentes de cada marca
   se le piden a Carla más adelante y se suben a Shopify Files.
   **Las saunas de Artexa son Jacuzzi y Clearlight**, que no venían en el Excel. Se agregaron como marcas
   SOLO PDF con sus listas ya publicadas: Jacuzzi (spas, carril de nado, cold plunge y saunas infrarrojas) y
   Clearlight (saunas de exterior). Su descuento queda pendiente. **Vass vende chimeneas.**
   **Onix se queda** (mosaico veneciano, Recubrimientos y Superficies, con su catálogo ya publicado) y
   **Firplak se restaura** (Baños); las dos como SOLO PDF. **Fortum y Steamist se retiran**: tenían lista de
   precios publicada y no venían en el Excel. Gamas: Vass y Onix residencial, Firplak económica.
4. **Descuentos:** todos se quedan como están (la mayoría en 10%), **incluidas las 5 marcas que el
   Excel marca debajo del margen mínimo**. Se van a modificar más adelante.

## Descuentos

La columna **Descuento Shopify (PLATA)** es el descuento asignado a cada marca. **Va a cambiar:**
revisarlo antes de cargar precios (tarea en el plan, Fase 4.5).

- **PENDIENTE:** Commodore, Peerless y The Galley (Shopify), y Artexa Bath (PDF). No están en la política de descuentos.
- **Validar con la lista PPS** (nota 4 de la política): los grupos Mabe (Easy, GE Profile, Haier, IEM, IO Mabe,
  Mabe) y Whirlpool (Acros, KitchenAid, Maytag, Whirlpool), todos al 30%.
- Las marcas **SOLO PDF** de Grupo 90 llevan 10% aunque no se venden en Shopify. Aplica a la cotización.

## Por confirmar con Carla

- **Categoría de las marcas nuevas.** Se asignaron así; confirmar las marcadas con ❓ (Vass ya lo confirmó Carla):
  Kraus → Tarjas (confirmado en el catálogo) · Commodore → Trituradores (confirmado) · IEM → Cocina
  (estufas, confirmado) · Easy → Lavandería y Cocina (en el catálogo solo hay lavadoras) ❓ ·
  Faber → Cocina (campanas) ❓ · Nantucket → Tarjas ❓ · Foster → Tarjas ❓ · Fontana → Asadores y
  hornos ❓ · Josper → Asadores y hornos (hornos de brasa) · Pizarro → Baños (confirmado) · TRES y
  Valsir → Baños ❓ · Artexa Bath → Baños ❓ · Hergom y Hergom Diseño → Chimeneas &
  Calentadores (confirmado) · Vass → Chimeneas & Calentadores, residencial (confirmado por Carla) · Jacuzzi → Vapor y
  Sauna y Wellness · Clearlight → Vapor y Sauna.
- **Gama** (premium/residencial/media/económica) de las marcas nuevas: se asignó por analogía con
  marcas parecidas. Carla confirmó Vass y Onix (residencial) y Firplak (económica).
- **Arte pendiente** (logo y foto): la página cae a hero oscuro con el nombre mientras no llegue. La
  columna *Arte* de las tablas dice qué falta. La carpeta de OneDrive con logos y fotos ya no está
  sincronizada en esta Mac.

## SHOPIFY — 68 marcas

| Marca | Proveedor | Línea SAE | Productos tras carga | Descuento Shopify (PLATA) | Página | Arte | Nota |
|---|---|---|---:|---:|---|---|---|
| ACROS | WHIRLPOOL | ACROS | 50 | 30% | `/marcas/acros` | completo | Validar margen con lista PPS (nota 4 de la política) |
| ALFA FORNI | IESA/LAVISH | ALFA | 20 | 10% | `/marcas/alfa-forni` | completo |  |
| ALFRESCO | ARTEXA | ALFRE | 247 | 10% | `/marcas/alfresco` | completo |  |
| ARTISAN | ARTEXA | ARTIS | 104 | 10% | `/marcas/artisan` | completo |  |
| ASKO | IESA/LAVISH | ASKO | 355 | 10% | `/marcas/asko` | completo |  |
| AXCENT | ITALY TOP | AXCEN | 101 | 15% | `/marcas/axcent` | completo | Solo línea de cocina |
| BENESSI | ARTEXA | BENES | 100 | 15% | `/marcas/benessi` | completo |  |
| BERTAZZONI | ARTEXA | BERTA | 109 | 10% | `/marcas/bertazzoni` | completo |  |
| BLANCO | ARTEXA | BLANC | 881 | 10% | `/marcas/blanco` | completo |  |
| BLAZE | MARESA | BLAZE | 119 | 10% | `/marcas/blaze` | completo |  |
| BOSCH | ARTEXA | BOSCH | 58 | 10% | `/marcas/bosch` | completo |  |
| BRIZO | ARTEXA | BRIZO | 806 | 10% | `/marcas/brizo` | completo | Solo línea de cocina |
| BROIL KING | MARESA | BROIL | 26 | 10% | `/marcas/broil-king` | completo |  |
| CAFÉ | MABE | CAFE | 99 | 10% | `/marcas/cafe` | completo |  |
| COMMODORE | ECLIPSE | COMMO | 9 | **PENDIENTE** | `/marcas/commodore` | falta logo y foto | No está en la política de descuentos |
| COVE | IESA/LAVISH | COVE | 15 | 10% | `/marcas/cove` | completo |  |
| COYOTE | LECROM | COYOT | 224 | 10% | `/marcas/coyote` | completo |  |
| DAWN | LECROM / MARESA | DAWN | 25 | 10% | `/marcas/dawn` | completo |  |
| DELTA | ARTEXA | DELTA | 2791 | 10% | `/marcas/delta` | completo | Solo línea de cocina |
| DEXA | IESA/LAVISH | DEXA | 112 | 10% | `/marcas/dexa` | completo |  |
| EASY | MABE | EASY | 13 | 30% | `/marcas/easy` | falta logo y foto | Validar margen con lista PPS (nota 4 de la política) |
| ECLIPSE | ECLIPSE | ECLIP | 98 | 10% | `/marcas/eclipse` | completo | Revisar Serie Value Line (condición distinta) |
| ELECTROLUX / ELECTROLUX ICON | INTERMUEBLES | ELECT | 12 | 10% | `/marcas/electrolux` | completo |  |
| ELICA (todas las series) | ARTEXA | ELICA | 166 | 10% | `/marcas/elica` | completo |  |
| ELKAY | ARTEXA | ELKAY | 4 | 10% | `/marcas/elkay` | completo |  |
| FABER | LECROM | FABER | 12 | 5% | `/marcas/faber` | falta foto |  |
| FALMEC | TECNOLAM | FALME | 53 | 10% | `/marcas/falmec` | completo |  |
| FRANKE | LECROM | FRANK | 28 | 10% | `/marcas/franke` | completo | Se compra por Lecrom (no IESA) |
| FRIGIDAIRE / GALLERY / PRO | INTERMUEBLES | FRIGI | 23 | 10% | `/marcas/frigidaire` | completo | Parejas Pro: checar precio Palacio |
| FULGOR MILANO | LECROM / TECNOLAM | FULGO | 40 | 10% | `/marcas/fulgor-milano` | completo |  |
| GAGGENAU | ARTEXA | GAGGE | 297 | 10% | `/marcas/gaggenau` | completo |  |
| GE PROFILE | MABE | GEPRO | 84 | 30% | `/marcas/ge-profile` | completo | Validar margen con lista PPS (nota 4 de la política) |
| GESSI | ARTEXA | GESSI | 213 | 10% | `/marcas/gessi` | completo |  |
| HAIER | MABE | HAIER | 21 | 30% | `/marcas/haier` | completo | Validar margen con lista PPS (nota 4 de la política) |
| HOSHIZAKI | ARTEXA | HOSHI | 20 | 10% | `/marcas/hoshizaki` | completo |  |
| IEM | MABE | IEM | 9 | 30% | `/marcas/iem` | falta logo y foto | Validar margen con lista PPS (nota 4 de la política) |
| INSINKERATOR | ARTEXA | INSIN | 67 | 10% | `/marcas/insinkerator` | completo |  |
| INVISACOOK | INVISACOOK | INVIS | 9 | 10% | `/marcas/invisacook` | completo |  |
| IO MABE | MABE | IOMAB | 78 | 30% | `/marcas/io-mabe` | completo | Validar margen con lista PPS (nota 4 de la política) |
| KELE | INTERDEMEX | KELE | 206 | 10% | `/marcas/kele-master-sinks` | completo |  |
| KITCHENAID (incl. portátiles) | WHIRLPOOL | KITCH | 223 | 30% | `/marcas/kitchenaid` | completo | Validar margen con lista PPS (nota 4 de la política) |
| KRAUS | ARTEXA | KRAUS | 79 | 10% | `/marcas/kraus` | falta foto |  |
| LYNX | MIDDLEBY | LYNX | 137 | 5% | `/marcas/lynx` | completo |  |
| MABE (incl. cuadro básico) | MABE | MABE | 589 | 30% | `/marcas/mabe` | completo | Validar margen con lista PPS (nota 4 de la política) |
| MAYTAG | WHIRLPOOL | MAYTA | 46 | 30% | `/marcas/maytag` | completo | Validar margen con lista PPS (nota 4 de la política) |
| MIELE | MIELE | MIELE | 292 | 5% | `/marcas/miele` | completo |  |
| MONOGRAM | MABE | MONOG | 87 | 10% | `/marcas/monogram` | completo |  |
| MONT ALPI | MARESA | MONTA | 87 | 10% | `/marcas/mont-alpi` | completo |  |
| NANTUCKET | LECROM | NANTU | 20 | 10% | `/marcas/nantucket` | falta logo y foto |  |
| PEERLESS | ARTEXA | PEERL | 140 | **PENDIENTE** | `/marcas/peerless` | completo | No está en la política de descuentos |
| PITT | ARTEXA | PITT | 108 | 10% | `/marcas/pitt-cooking` | completo |  |
| SCHOCK | ECLIPSE | SCHOC | 33 | 10% | `/marcas/schock` | completo |  |
| SCOTSMAN | IESA/LAVISH | SCOTS | 66 | 10% | `/marcas/scotsman` | completo |  |
| SEDONA | MIDDLEBY | SEDON | 55 | 5% | `/marcas/sedona-by-lynx` | completo |  |
| SMEG | SMEG | SMEG | 240 | 10% | `/marcas/smeg` | completo |  |
| SUB-ZERO | IESA/LAVISH | SUBZE | 462 | 10% | `/marcas/sub-zero` | completo | Condición distinta para fuera de línea vs. de línea |
| SUMMIT | LECROM | SUMMI | 19 | 10% | `/marcas/summit` | completo |  |
| SUPRA | SUPER FLAMA | SUPRA | 111 | 5% | `/marcas/supra` | completo |  |
| TECNOLAM | TECNOLAM | TECNO | 138 | 10% | `/marcas/tecnolam` | completo |  |
| TEKA (todas las líneas) | TEKA | TEKA | 210 | 10% | `/marcas/teka` | completo | Estufas económicas: 5% |
| THE GALLEY | IESA/LAVISH | GALLE | 153 | **PENDIENTE** | `/marcas/the-galley` | completo | No está en la política de descuentos |
| THERMADOR | ARTEXA | THERM | 243 | 10% | `/marcas/thermador` | completo |  |
| THOR | ARTEXA | THOR | 34 | 10% | `/marcas/thor` | completo |  |
| TRADEWIND | MIDDLEBY | TRADE | 154 | 5% | `/marcas/tradewind` | completo |  |
| U-LINE | MIDDLEBY | ULINE | 293 | 5% | `/marcas/u-line` | completo |  |
| VIKING (todas las series) | MIDDLEBY | VIKIN | 3401 | 5% | `/marcas/viking` | completo | Revisar Serie 3/6/Tuscany (condición distinta) |
| WHIRLPOOL | WHIRLPOOL | WHIRL | 282 | 30% | `/marcas/whirlpool` | completo | Validar margen con lista PPS (nota 4 de la política) |
| WOLF | IESA/LAVISH | WOLF | 665 | 10% | `/marcas/wolf` | completo | Condición distinta para fuera de línea vs. de línea |

## SOLO PDF — 25 marcas

| Marca | Proveedor | Línea SAE | Productos tras carga | Descuento Shopify (PLATA) | Página | Arte | Nota |
|---|---|---|---:|---:|---|---|---|
| ARTEXA BATH | ARTEXA | — | — | **PENDIENTE** | `/marcas/artexa-bath` | falta logo y foto | No está en la política de descuentos |
| AXOR | GRUPO 90 | AXOR | 1403 | 10% | `/marcas/axor` | completo |  |
| CLEARLIGHT | ARTEXA | — | — | **PENDIENTE** | `/marcas/clearlight` | falta logo | Saunas de Artexa; no venía en el Excel (Carla, 2026-09-21) |
| FIRPLAK | ENVITEB | — | 0 | N/A | `/marcas/firplak` | falta logo y foto | Económica. Estaba en *Marcas eliminadas*; restaurada como SOLO PDF (Carla, 2026-09-21) |
| FONTANA | LECROM | FONTA | 29 | N/A | `/marcas/fontana` | falta logo y foto |  |
| FOSTER | LECROM | FOSTE | 9 | — | `/marcas/foster` | falta logo y foto |  |
| HERGOM | BLOCK | HERGO | 0 | — | `/marcas/hergom` | falta logo |  |
| HERGOM DISEÑO | BLOCK | HERGO | 0 | — | `/marcas/hergom-diseno` | falta logo y foto |  |
| IDRAIN / IDRAIN PROYECTOS | GRUPO 90 | IDRAI | 86 | 10% | `/marcas/i-drain` | completo | iDrain Proyectos: el descuento PLATA no aplica |
| JACUZZI | ARTEXA | — | — | **PENDIENTE** | `/marcas/jacuzzi` | falta logo | Saunas de Artexa; no venía en el Excel (Carla, 2026-09-21) |
| JOSPER | MIDDLEBY | JOSPE | 0 | — | `/marcas/josper` | falta logo y foto |  |
| KALT | LECROM | KALT | 15 | — | `/marcas/kalt` | completo |  |
| KAMADO JOE | MIDDLEBY | KAMAD | 43 | — | `/marcas/kamado-joe` | completo |  |
| LA CORNUE | MIDDLEBY | LACOR | 2 | — | `/marcas/la-cornue` | completo |  |
| MASTERBUILT | MIDDLEBY | MASTB | 8 | — | `/marcas/masterbuilt` | completo |  |
| MR STEAM | GRUPO 90 | MRSTE | 28 | 10% | `/marcas/mr-steam` | completo |  |
| NOBILI | GRUPO 90 | NOBIL | 191 | 10% | `/marcas/nobili` | completo |  |
| ONIX | — | — | — | **PENDIENTE** | `/marcas/onix` | falta logo y foto | Mosaico veneciano, residencial; no venía en el Excel, se queda (Carla, 2026-09-21) |
| PIZARRO | PIZARRO | PIZAR | 129 | — | `/marcas/pizarro` | falta logo y foto |  |
| POLETTI | LECROM | POLET | 28 | — | `/marcas/poletti-sinks` | completo |  |
| SAPPHIRE | LECROM | SAPPH | 19 | — | `/marcas/sapphire` | completo |  |
| TRES | GRUPO 90 | — | 0 | 10% | `/marcas/tres` | falta logo y foto |  |
| VALSIR | GRUPO 90 | — | 0 | 10% | `/marcas/valsir` | falta logo y foto |  |
| VASS | VASS | VASS | 3 | — | `/marcas/vass` | falta logo y foto | Chimeneas, residencial (Carla, 2026-09-21) |
| WPPO | MARESA | WPPO | 6 | — | `/marcas/wppo` | completo |  |

## ELIMINADAS — 14 marcas

| Marca | Proveedor | Línea SAE | Productos hoy | Nota |
|---|---|---|---:|---|
| AMBIANCE | STUDIO & DISEÑO | AMBIA | 39 |  |
| AMERICAN STANDARD | STUDIO & DISEÑO | AMSTA | 256 | Tenía página; se quitó de todo el sitio el 2026-09-21 |
| CATALANO | GRUPO 90 | CATAL | 14 | Tenía lista de precios; se retiró |
| DUPLASH | GRUPO 90 | — | 0 |  |
| FORTUM | — | — | — | No venía en el Excel; se retiró su lista de precios el 2026-09-21 (la URL vieja redirige a Baños) |
| HANSGROHE | GRUPO 90 | HANSG, HAGNA | 335 | Tenía página; se quitó de todo el sitio el 2026-09-21 |
| INDA | GRUPO 90 | — | 0 |  |
| KALDEWEI | GRUPO 90 | — | 0 |  |
| KEUCO | GRUPO 90 | KEUCO | 30 | Tenía página; se quitó de todo el sitio el 2026-09-21 |
| KINDRED | LECROM | — | 0 |  |
| LAUFEN | GRUPO 90 | — | 0 |  |
| MOEN | STUDIO & DISEÑO | MOEN | 357 | Tenía página; se quitó de todo el sitio el 2026-09-21 |
| SAUNAS | GRUPO 90 | — | 0 | Descatalogada el 2026-09-21: solo se presentan las saunas de Artexa |
| STEAMIST | — | — | — | No venía en el Excel; se retiró su lista de precios el 2026-09-21 (la URL vieja redirige a Vapor y Sauna) |
