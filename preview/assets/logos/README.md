# Logos de marcas — placeholders de la marquesina (home · "Distribución oficial")

Cada chip de la marquesina busca su logo en `assets/logos/<slug>.png`.
Mientras el archivo NO exista, el chip muestra el wordmark de la marca como
placeholder (respaldo). En cuanto subas el archivo con el nombre exacto, el
logo reemplaza al texto automáticamente (no hay que tocar el HTML).

## Convención
- Formato: **PNG con fondo transparente** (idealmente el logo en blanco/mono,
  para que asiente sobre el fondo espresso). También sirve SVG si cambias la
  extensión en `home.html`.
- Tamaño sugerido: alto ~120–160 px, ancho proporcional. El chip recorta a ~58%
  de su alto, así que deja un poco de aire.
- Nombre = slug en minúsculas, sin acentos, espacios → guiones.

## Archivos esperados
sub-zero.png · wolf.png · cove.png · miele.png · thermador.png · monogram.png ·
viking.png · gaggenau.png · la-cornue.png · smeg.png · bertazzoni.png ·
kitchenaid.png · bosch.png · elica.png · pitt-cooking.png · hoshizaki.png ·
alfresco.png · lynx.png · kamado-joe.png
