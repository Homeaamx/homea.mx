# PDFs de OXATIS — pendientes para Carla

> Estado al 2026-09-19. Los PDFs de OXATIS (`www.homea.mx/Files/119914/…`) se re-hospedan en
> **Shopify Files** y sus URLs viejas redirigen (301) al PDF nuevo. Ya están publicados 32
> (26 listas/catálogos en `data/listas-precios.json` + 6 fichas/manuales en
> `data/redirects/pdfs-legacy.json`). Este documento lista lo que **falta decidir**.
>
> Archivo local de trabajo (fuera del repo): `~/Documents/ALTURA/Homea-archivos-oxatis/`
> — `originales/` (copia íntegra de OXATIS), `shopify/` (lo ya subido), `revisar/`,
> `wayback/` y `manifest.csv` (clics GSC, tamaños, checksums).

## Cómo publicar un PDF cuando se apruebe o aparezca

1. Subirlo a Shopify **Content → Files** con nombre SEO (ej. `lista-precios-coyote-2026.pdf`).
2. Pegar la URL (`https://cdn.shopify.com/s/files/1/0688/0788/4860/files/<nombre>.pdf`) en
   `url` de su entrada — en `data/listas-precios.json` si es lista/catálogo, o en
   `data/redirects/pdfs-legacy.json` si es ficha/manual — y cambiar `estado` a `listo`.
3. Deploy. `npm run build` regenera el mapa de redirects (`prebuild`) y la URL vieja de
   OXATIS pasa a redirigir al PDF. En `/marcas#listas-de-precios` la fila pasa de
   "Próximamente" a descarga.

⚠️ Todo lo que se sube a Shopify Files es **público** para quien tenga el enlace. No subir
listas de distribuidor ni documentos marcados como confidenciales.

## 1. Aprobación de Carla antes de publicar (`revisar/`)

Mientras no se aprueben, su URL vieja redirige a `/marcas#listas-de-precios` (o al listado
de su familia).

| Documento (archivo en `revisar/`) | URL vieja de OXATIS | Qué confirmar |
|---|---|---|
| Coyote asadores 2026 (`lista-precios-asadores-coyote-2026.pdf`) | `/Files/119914/LISTA_PRECIOS_ASADORES_COYOTE_2026.pdf` | El encabezado del proveedor dice **"2025 Distributor Price Schedule · Confidential"**. ¿Los precios son públicos? Si sí, quitar la leyenda antes de subir. |
| ASKO 2023 (`lista-precios-asko-2023.pdf`) | `/Files/119914/232245863241526.pdf` | Trae condiciones **para dealers** (pedidos, fletes, reclamaciones). ¿El precio es público o de distribuidor? |
| Catalano Export Price List 50 (`lista-precios-catalano-export-50.pdf`) | `/Files/119914/213299772868141.pdf` | Lista de **exportación en euros**. ¿Es precio público o de distribuidor? |
| Whirlpool WHC18T521STWC (`ficha-tecnica-refrigerador-whirlpool-whc18t521stwc-2.pdf`) | `/Files/119914/WHC18T521STWC_Ficha_Tecnica2.pdf` | Cada página dice **"Whirlpool Corporation Confidential"**. ¿Whirlpool autoriza publicarla? |

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

**Decisión por tomar:** las 3 copias completas no sensibles (Kamado Joe, Pitt Cooking 2023,
Tecnolam) son de 2023: ¿se publican como están o se sustituyen por la versión vigente? Para
las listas de marca (Supra, Sub-Zero, Kele, Viking, Teka, Summit, Pitt Cooking) conviene subir
la **vigente** con el mismo nombre SEO y agregar la URL vieja a su `legacy`.
