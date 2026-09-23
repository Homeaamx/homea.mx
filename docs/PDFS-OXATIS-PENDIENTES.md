# PDFs de OXATIS — pendientes para Carla

> Estado al 2026-09-22. Los PDFs de OXATIS (`www.homea.mx/Files/119914/…`) se re-hospedan en
> **Shopify Files**. Ya están publicadas 21 listas/catálogos (`data/listas-precios.json`, cada una
> con su URL permanente `/listas-de-precios/<slug>.pdf`) + 6 fichas/manuales
> (`data/redirects/pdfs-legacy.json`, 301 directo al PDF). Este documento explica cómo se
> actualizan y lista lo que **falta decidir**.
>
> Archivo local de trabajo (fuera del repo): `~/Documents/ALTURA/Homea-archivos-oxatis/`
> — `originales/` (copia íntegra de OXATIS), `shopify/` (lo ya subido), `revisar/`,
> `wayback/` y `manifest.csv` (clics GSC, tamaños, checksums).
>
> **Actualización 2026-09-22:** se cargaron los catálogos vigentes de la carpeta `CATALOGOS VIGENTES`
> (ver §0). Hoy hay **69 listas publicadas** y **64 de las 92 marcas** enseñan su PDF.

## 0. Catálogos vigentes 2026 (carga del 2026-09-22)

**Fuente:** OneDrive `HOMEA/SAE/SAE-CARLA/MAESTRO PRECIOS/CATALOGOS VIGENTES` (una carpeta por distribuidor).
Por marca se tomó **la edición más reciente** (fecha de la portada, del código `COD-ddmmaaaa` o del nombre
del archivo). Los Excel de esa carpeta no se publican (traen costos). Los PDFs **no entran al git**: viven
en Shopify Files y el sitio los sirve en `/listas-de-precios/<slug>.pdf`.

**Limpieza antes de subir** (`python3 scripts/preparar-pdfs-marca.py SALIDA/`, configuración en
`scripts/pdfs-marca.json`), el mismo criterio que la lista de Elica que ya estaba publicada:

- Fuera la marca del **distribuidor** (Artexa, Lecrom, Maresa, eKitchen): su logo en portada y en cada
  página, sus teléfonos y correos, sus "términos y condiciones de compra" y su contraportada.
- **Tarjeta de contacto HOMEA** en la portada (o banner HOMEA donde iba el logo del distribuidor) y
  contraportada HOMEA. Muchas listas ya venían así de origen (Sub-Zero, Wolf, ASKO, Tecnolam, Kele…).
- Se quitaron los datos ocultos de Illustrator: Kamado Joe bajó de 102 MB a 13 MB y Trade-Wind de 30 a 4.
  Todas quedan por debajo del tope de 20 MB de Shopify Files.

**Subidas (49 archivos):** Alfa Forni, Alfresco, Artisan, ASKO, Benessi, Bertazzoni, Blanco, Blaze, Brizo,
Broil King, Café, Commodore, Cove, Dawn, Delta, Eclipse, Faber, Falmec, Franke, Fulgor Milano, Hoshizaki,
Invisacook, Kalt, Kamado Joe, Kele, Kraus, Lynx, Miele, Monogram, Mont Alpi, Nantucket, Pitt Cooking, Schock,
Scotsman, Sedona by Lynx, Smeg, Sub-Zero, Summit, Supra (lista + catálogo), Tecnolam, Teka, The Galley,
Thor, Trade-Wind, U-Line, Viking y Wolf (lista + asadores). Ya estaban: Elica, Josper, Mabe, IO Mabe,
GE Profile, Haier, Frigidaire·Electrolux, Axcent, Jacuzzi, Clearlight y Onix.

**Subidas después, por indicación de Carla (mismo día):** Bosch, Gaggenau, Thermador, InSinkErator (trituradores
comerciales) y Coyote. Se les quitó la palabra "Dealer" (BSH), el encabezado vacío "Dealer Cost" y la leyenda
*proprietary and confidential* de Thermador (cada fila trae un solo precio, el MSRP: no hay costos), la portadilla
"Our tools to help you sell" de Gaggenau, los términos de compra de Artexa (InSinkErator) y de Lecrom (Coyote) y
la leyenda "Distributor Price Schedule · Confidential" de Coyote. ⚠️ InSinkErator sigue diciendo en cada página
"Lista de precios a DISTRIBUIDOR TIPO A": sus precios son de distribuidor. Publicado así por decisión de Carla.

**Faltan (28 marcas sin ningún PDF):** Acros, Catalano, Dexa, Easy, Elkay, Firplak, Fontana, Foster, Gessi,
Hergom, I-Drain, IEM, Kaldewei, KitchenAid, La Cornue, Masterbuilt, Maytag, Mr. Steam, Nobili, Peerless,
Poletti Sinks, Sapphire, Sauna Estilo, Treesse, Valsir, Vass, Whirlpool (solo hay Excel) y WPPO.

**Publicadas pero viejas** (conviene buscar la edición nueva): Frigidaire·Electrolux (jul 2023), Onix (2023),
Trade-Wind (abr 2024), Nantucket (2024), Mabe, IO Mabe, GE Profile y Haier (2024), Clearlight y Jacuzzi
saunas (2024). Mabe tiene lista 2026 en Excel, pero no en PDF.

**Limpiar en Shopify Files** (Content → Files). Nadie los usa ya; borrarlos a mano:
`catalogo-american-standard-as150-2021.pdf`, `…-as150-2021-parte-1.pdf`, `…-as150-2021-parte-2.pdf`,
`catalogo-american-standard-as151-2023.pdf`, `lista-precios-moen-2023.pdf`,
`lista-precios-hansgrohe-essentials-2025.pdf`, `lista-precios-steamist-banos-vapor-2021.pdf`,
`catalogo-precios-fortum-2023.pdf` (marcas retiradas), `catalogo-mabe-2024.pdf` (duplicado de
`catalogo-mabe-2024-completo.pdf`), `lista-precios-tecnolam-tarjas-monomandos-2025.pdf` (la sustituye la de
ene 2026) y `lista-precios-artexa-elica-2023.pdf` (la sustituye la de 2026 y trae marca Artexa).

**Nuevo PDF de una marca que no tenía:** agrégalo a `scripts/pdfs-marca.json`, prepáralo con el script,
revisa a ojo portada, una página interior y contraportada, súbelo a Shopify Files, dalo de alta en
`data/listas-precios.json` y pon su URL permanente en `cta.url` de `data/marcas-hero.json`. Luego `npm run marcas`.

## Cómo funciona: una URL permanente por lista

Cada lista de precios tiene **una** entrada en `data/listas-precios.json` (no una por año) y una
URL permanente en el sitio: **`/listas-de-precios/<slug>.pdf`** (ej. `/listas-de-precios/sub-zero.pdf`).

- Esa URL sirve el PDF vigente de Shopify Files (`app/listas-de-precios/[archivo]/route.ts`),
  bajo homea.mx: el posicionamiento se queda en el dominio.
- **Todas** las URLs viejas de OXATIS de esa lista, de cualquier año (campo `legacy`), redirigen
  (301) a la URL permanente. Ese 301 ya no cambia nunca.
- Mientras la lista no tenga PDF (`url: null`), la URL permanente manda (302) a
  `/marcas#listas-de-precios`, donde se ofrece por WhatsApp.
- `/marcas#listas-de-precios` y el `sitemap.xml` enlazan a la URL permanente, nunca a Shopify.

## Nueva edición de una lista (ej. Sub-Zero 2027)

1. Subir el PDF a Shopify **Content → Files** (el nombre puede llevar el año).
2. En `data/listas-precios.json`, en la entrada de esa lista: pegar la URL de Shopify en `url`
   (con su `?v=`), actualizar `vigencia` y poner `estado: "listo"`. **No cambiar `slug`.**
3. Deploy. La URL permanente y todas las URLs viejas pasan a servir la edición nueva.

Una lista **nueva** (marca o línea que no existía): agregar una entrada con su `slug` propio.
Si una edición vieja apareciera con otra URL, se agrega esa ruta a `legacy` de su lista.
El build falla si un `slug` se repite, si una ruta vieja está en dos listas o si una lista
`listo` no tiene `url` (`scripts/build-redirects.mjs`).

No usar el "Reemplazar archivo" de Shopify sin cambiar `url` y hacer deploy: el sitio no se
enteraría hasta que caduque su caché (1 día).

⚠️ Todo lo que se sube a Shopify Files es **público** para quien tenga el enlace. No subir
listas de distribuidor ni documentos marcados como confidenciales.

## 1. Aprobación de Carla antes de publicar (`revisar/`)

Mientras no se aprueben, su URL vieja redirige a `/marcas#listas-de-precios` (o al listado
de su familia).

| Documento (archivo en `revisar/`) | URL vieja de OXATIS | Qué confirmar |
|---|---|---|
| Coyote asadores 2026 (`lista-precios-asadores-coyote-2026.pdf`) | `/Files/119914/LISTA_PRECIOS_ASADORES_COYOTE_2026.pdf` | El encabezado del proveedor dice **"2025 Distributor Price Schedule · Confidential"**. ¿Los precios son públicos? Si sí, quitar la leyenda antes de subir. **Resuelto 2026-09-22:** Carla aprobó; se publicó la de feb 2026 sin la leyenda. |
| ASKO 2023 (`lista-precios-asko-2023.pdf`) | `/Files/119914/232245863241526.pdf` | Trae condiciones **para dealers** (pedidos, fletes, reclamaciones). ¿El precio es público o de distribuidor? **Resuelto 2026-09-22:** se publicó la lista 2026, que ya viene con tarjeta HOMEA. |
| Whirlpool WHC18T521STWC (`ficha-tecnica-refrigerador-whirlpool-whc18t521stwc-2.pdf`) | `/Files/119914/WHC18T521STWC_Ficha_Tecnica2.pdf` | Cada página dice **"Whirlpool Corporation Confidential"**. ¿Whirlpool autoriza publicarla? |

> **Retirado el 2026-09-21:** Catalano salió del catálogo (marca eliminada, ver
> `docs/MARCAS-CANAL-Y-DESCUENTOS.md`). Su lista ya no se publica y la URL vieja redirige a
> `/productos/banos` (`data/redirects/oxatis-manual.json`). Lo mismo con las listas de
> Hansgrohe, American Standard, Moen, Fortum (→ Baños) y Steamist (→ Vapor y Sauna).

## 2. PDFs que ya no existen en OXATIS (`sin-archivo`)

Estos 17 PDFs ya responden 301 a la home en OXATIS y no teníamos copia. **Pedir a Carla los
originales (o la versión vigente)**. Ordenados por clics en GSC (16 meses a jun-2026).

Se buscaron en el Wayback Machine: 4 tienen copia completa (ya descargada en `wayback/`), 6
solo tienen una captura **incompleta** (cortada a 1 MB / 5 MB, en `wayback/incompletas/`, no
sirve para publicar) y 7 no tienen copia.

| Clics | URL vieja (OXATIS, muerta) | Qué es | Wayback |
|---:|---|---|---|
| 114 | https://www.homea.mx/Files/119914/Lista_Precios_SUPRA_2025.pdf | Supra · lista 2025 | sin copia |
| 92 | https://www.homea.mx/Files/119914/Lista_Precios_SUBZERO_2025.pdf | Sub-Zero · lista 2025 | [incompleta](https://web.archive.org/web/20250328053903/https://www.homea.mx/Files/119914/Lista_Precios_SUBZERO_2025.pdf) |
| 56 | https://www.homea.mx/Files/119914/LISTA_PRECIOS_KELE_2025_JULIO.pdf | Kele · lista jul-2025 | sin copia |
| 45 | https://www.homea.mx/Files/119914/Lista_Precios_Elica_2025_jun.pdf | Elica · lista jun-2025 (ya redirige a la de 2026) | sin copia |
| 44 | https://www.homea.mx/Files/119914/242011537389488.pdf | sin identificar | [incompleta](https://web.archive.org/web/20250123132821/https://www.homea.mx/Files/119914/242011537389488.pdf) |
| 33 | https://www.homea.mx/Files/119914/231657518915520.pdf | Kamado Joe · catálogo feb-2023 | ✅ [completa](https://web.archive.org/web/20240808020033/https://www.homea.mx/Files/119914/231657518915520.pdf) |
| 28 | https://www.homea.mx/Files/119914/Lista_Precios_Pitt_Cooking_2025_08.pdf | Pitt Cooking · lista ago-2025 | sin copia |
| 26 | https://www.homea.mx/Files/119914/232206635850808.pdf | Pitt Cooking · lista ene-2023 | ✅ [completa](https://web.archive.org/web/20240808060108/https://www.homea.mx/Files/119914/232206635850808.pdf) |
| 16 | https://www.homea.mx/Files/119914/24152970321617.pdf | sin identificar | sin copia |
| 15 | https://www.homea.mx/Files/119914/233185839511345.pdf | Tecnolam · catálogo | ✅ [completa](https://web.archive.org/web/20240808063638/https://www.homea.mx/Files/119914/233185839511345.pdf) |
| 13 | https://www.homea.mx/Files/119914/Lista_Precios_TEKA_tarjas_monomandos_2025_Abr.pdf | Teka · tarjas y monomandos abr-2025 | sin copia |
| 13 | https://www.homea.mx/Files/119914/241447054855494.pdf | sin identificar | [incompleta](https://web.archive.org/web/20250123125341/https://www.homea.mx/Files/119914/241447054855494.pdf) |
| 12 | https://www.homea.mx/Files/119914/LISTA_PRECIOS_SUBZERO_2026.pdf | Sub-Zero · lista 2026 | sin copia |
| 9 | https://www.homea.mx/Files/119914/ListaPreciosVIKING2024feb.pdf | Viking · lista feb-2024 | [incompleta](https://web.archive.org/web/20250123145030/https://www.homea.mx/Files/119914/ListaPreciosVIKING2024feb.pdf) |
| 9 | https://www.homea.mx/Files/119914/ListaPreciosTEKA2024Sep.pdf | Teka · lista sep-2024 | [incompleta](https://web.archive.org/web/20250123130437/https://www.homea.mx/Files/119914/ListaPreciosTEKA2024Sep.pdf) |
| 9 | https://www.homea.mx/Files/119914/ListaPreciosSummit2024.pdf | Summit · lista 2024 | [incompleta](https://web.archive.org/web/20250123135950/https://www.homea.mx/Files/119914/ListaPreciosSummit2024.pdf) |
| 9 | https://www.homea.mx/Files/119914/24965815411450.pdf | Coyote · lista feb-2024 | ✅ [completa](https://web.archive.org/web/20240814005943/https://www.homea.mx/Files/119914/24965815411450.pdf) — mismo encabezado "Distributor · Confidential" que la de 2026: pasa por la revisión de la §1 |

Las URLs viejas de Pitt Cooking 2023, Coyote 2024 y el catálogo Tecnolam ya están en `legacy`
de su lista (redirigen a la lista vigente de su marca). **Resuelto 2026-09-22:** Supra, Sub-Zero, Kele, Viking,
Teka, Summit y Pitt Cooking ya tienen su edición vigente publicada (§0), así que todas sus URLs viejas
quedaron resueltas. Nota original: para las listas sin PDF (Supra, Sub-Zero,
Kele, Viking, Teka, Summit, Pitt Cooking) basta con subir la **edición vigente** y pegar su `url`:
todas sus URLs viejas quedan resueltas. Kamado Joe (catálogo 2023) no tiene lista propia todavía.
