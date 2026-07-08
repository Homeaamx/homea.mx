# Imágenes de proyectos — cómo subirlas

Carpeta destino (subir a **las dos**, son espejo):
- `preview/assets/projects/`  ← fuente
- `public/assets/projects/`   ← la que sirve el front-end Next (localhost:3000)

## Reglas
- Formato: `.jpg` (o `.webp`). Horizontal, mínimo 1200 px de ancho.
- Nombre en minúsculas, sin acentos ni espacios (usa guiones).
- **Portada** de cada proyecto = un archivo con el slug exacto de abajo.
- Fotos adicionales: `<slug>-2.jpg`, `<slug>-3.jpg`, … (hasta `-12`). Numera
  seguido, sin saltos.
- Al hacer clic en la tarjeta se abre un **lightbox** que detecta y muestra
  automáticamente todas las fotos que existan con ese slug (portada + `-2`, `-3`…).
  No hay que configurar cuántas son: sube las que tengas y aparecen solas.

## Los 9 proyectos y su archivo de portada esperado
Los primeros 4 salen de la página actual (homea.mx). Los otros 5 son
marcadores de posición — cámbiame el nombre/descr. cuando me pases los reales.

| # | Proyecto              | Categoría        | Ubicación            | Archivo portada           |
|---|-----------------------|------------------|----------------------|---------------------------|
| 1 | Casa Artigas          | Arquitectos      | El Campanario, QRO   | casa-artigas.jpg          |
| 2 | Casa KAH              | Arquitectos      | El Campanario, QRO   | casa-kah.jpg              |
| 3 | Casa Reims            | Arquitectos      | El Campanario, QRO   | casa-reims.jpg            |
| 4 | Club Campestre        | Desarrolladores  | Querétaro            | club-campestre.jpg        |
| 5 | Desarrollo Vertical   | Desarrolladores  | (por definir)        | desarrollo-vertical.jpg   |
| 6 | Hotel Boutique        | Hotelería        | (por definir)        | hotel-boutique.jpg        |
| 7 | Cocina Integral Encino| Cocinas integr.  | (por definir)        | cocina-encino.jpg         |
| 8 | Residencia            | Residencial      | (por definir)        | residencia-lomas.jpg      |
| 9 | Penthouse             | Residencial      | (por definir)        | penthouse.jpg             |

Mientras no exista el archivo real, la galería muestra una foto de respaldo
(no se ve rota). En cuanto subas el archivo con el nombre exacto, aparece solo.
