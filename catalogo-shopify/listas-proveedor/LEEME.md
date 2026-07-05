# Listas de proveedor — cómo dejar los archivos aquí

Suelta aquí los catálogos y listas de precios reales, **una subcarpeta por marca**:

```
listas-proveedor/
  VIKING/
    viking-lista-precios-2026.pdf
  U-LINE/
    uline-price-list-jul-2026.xlsx
  COYOTE/
    ...
```

- **Formato:** el que tengas — PDF, Excel, CSV, imagen o escaneo. No hace falta convertir nada.
- **Nombre de archivo:** marca + qué es + fecha/vigencia si se sabe (ej. `wolf-msrp-2026-q3.pdf`).
- Si una lista trae **fecha de vigencia o tipo de cambio sugerido**, no lo borres: se usa para validar.
- Si el proveedor maneja **precio de lista y precio distribuidor**, incluye ambos; a Shopify solo sube el público.

## Qué se hace con cada lista

1. Se extraen modelo/SKU, descripción y precio público.
2. Se cruza contra la clave SAE (match exacto y por número de modelo).
3. Se reporta por marca: coincidencias, productos SAE sin match (¿obsoletos?), y productos del catálogo que no están en SAE (¿faltan de dar de alta?).
4. El precio del proveedor manda sobre el de las listas SAE cuando la lista es más reciente.

## Prioridad de marcas (sin precio en listas SAE)

U-Line (240), Coyote (203), Benessi (75), Mont Alpi (69), Tradewind (47),
Lynx (35), Fulgor (29), Mr. Steam (22), Poletti, Kalt, Sedona, Sapphire,
Kamado, Dawn, Schock, y parciales: Teka, Kele, Mabe, Falmec.
