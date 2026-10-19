# Patrón "Planos de cocina" — fichas de tipo de producto (Guías)

> Cómo presentar los tipos de un producto (refrigeradores, congeladores, cavas, estufas…)
> en su página de filtros de Guías. **Referencia implementada: Refrigeradores**
> (`/guias/cocina-y-bar/refrigeracion/refrigeradores/`). Aprobado por Carla (2026-07-02).

---

## 1. El concepto

Cada tipo de producto se presenta como una **ficha con diagrama técnico de línea**
(estilo plano de arquitecto) en vez de fotografía:

- **Reposo:** diagrama (trazo espresso sobre greige) + nombre (serif) + UNA oración
  concreta de qué es y para quién.
- **Hover:** las puertas del diagrama **se abren** revelando el interior en oro
  champagne; aparecen los **puntos clave** (`specs`: "Gas o inducción · 220 V");
  la flecha del CTA crece 28→44px; la tarjeta hace lift −4px con borde oro.
- **Clic (2026-10-19):** se abre `components/FichaModal.tsx` sobre el fondo
  oscurecido (velo de "Aprende sobre campanas", tarjeta más chica): el mismo
  diagrama con su hover, la explicación técnica (`detalle`), los puntos clave y
  el botón **Ver en el catálogo** → `catalogo` (catálogo con el filtro ya puesto).

**Por qué diagramas y no fotos:** las fotos de producto de un mismo tipo son casi
indistinguibles entre sí; el trabajo de la guía es explicar *diferencias*, y el
diagrama de configuración lo hace de un vistazo. Además elimina la dependencia de
conseguir N fotos antes de publicar, y es 100% sistema de diseño v2 (precisión,
oro solo como acento de revelación).

## 2. Dónde vive cada pieza

| Pieza | Archivo |
|---|---|
| Datos (`ficha` por filtro) | `GUIAS/taxonomia-guias.json` |
| Tipos (`FichaFiltro`, `GrupoFicha`) | `types/guias.ts` |
| Tarjetas + agrupación + fallback | `components/FilterShowcase.tsx` |
| Biblioteca de diagramas SVG | `components/FiltroDiagrama.tsx` |
| Ilustraciones en escena (grupo Diseño, §9) | `components/IlustracionTipo.tsx` |
| Estilos (prefijo `.tfk-`) | `styles/guias.css` |
| Dispatcher (fichas vs chips) | `app/guias/[...segments]/page.tsx` → `FilterIndex` |

La página de filtros usa `FilterShowcase` cuando **algún** filtro trae `ficha`;
los filtros que aún no la tengan se muestran como chips clásicos bajo "Más filtros".
Sin ninguna ficha, la página cae por completo a los chips (`FilterList`) — así una
categoría a medio definir nunca se rompe.

## 3. Estructura de datos (`ficha` en la taxonomía)

```json
{
  "nombre": "French Door",
  "filtro": "/productos/refrigeradores/?f=french-door",
  "ficha": {
    "grupo": "estilo",
    "diagrama": "french-door",
    "descripcion": "Dos puertas superiores para el compartimento fresco y congelador en cajón inferior: lo fresco queda a la altura de los ojos.",
    "specs": "Anchos 30–48″ · Congelador abajo · Puertas angostas",
    "detalle": "La zona fresca ocupa toda la parte superior… (2–3 oraciones técnicas)",
    "catalogo": "/productos/cocina-y-bar/refrigeracion/refrigeradores?f=french-door"
  }
}
```

- **`grupo`** — fila donde vive la tarjeta. Valores actuales: `tipo` (se muestra
  como **"Tipo de instalación"**: De Piso, Empotrado, Counter Depth) y `estilo`
  (se muestra como **"Diseño"**: Parejas, French Door, Duplex, Bottom/Top Mount,
  Columna, Glass Door, 1 puerta, 4/5 puertas, Bajo cubierta). Las etiquetas son
  las mismas que los filtros del PLP (`lib/filtrosPlp.ts`) — guía y filtro deben
  nombrar igual el mismo eje. Orden de render:
  tipo → estilo; dentro de cada grupo se respeta el orden del JSON. Si una
  categoría nueva necesita otro eje, añadirlo a `GrupoFicha` (types) y a `GRUPOS`
  (FilterShowcase) con su etiqueta.
- **`diagrama`** — key en `FiltroDiagrama.tsx`. Si no existe, cae al diagrama
  `generic` (nunca rompe).
- **`descripcion`** — ver reglas de copy (§5).
- **`specs`** — puntos clave a considerar, separados por `·` (2–3, cortos): se
  revelan al hover y salen como etiquetas en el modal.
- **`detalle`** — explicación técnica del modal (2–3 oraciones).
- **`catalogo`** — página de catálogo con el filtro de la ficha:
  - PLP de tipo (Refrigeradores, Parrillas, Campanas): `<ruta>?f=<slug>` (el mismo
    slug de `filtro`, que alimenta el mosaico del PLP — **no cambiar `filtro`**).
  - Resto: `<Subcategoría 1>?tipo=<tile>&filtro=<clave>:<valor>` (repetible);
    `public/catalogo.js` marca esa casilla al cargar. La clave y el valor son los
    de la tabla de filtros (`data/filtros-web.json` / `filtros.*` de Shopify).
- **`grupo`** también admite `instalacion` (Grifería, Purificadores); la etiqueta
  visible de cada grupo se ajusta con `etiquetasGrupos` de la Subcategoría 2.

## 4. Reglas de los diagramas (FiltroDiagrama)

- `viewBox="0 0 140 130"`, piso en `y=124`, trazos `1.5` (líneas de entorno `1`).
- **Sin colores hardcodeados en el SVG** — solo estructura con clases; el color lo
  asigna `styles/guias.css` con tokens v2.
- Anatomía por clases:
  - `.fb` cuerpo del aparato (bone + stroke espresso)
  - `.dr` puerta — grupo con `.hl` (bisagra izquierda) o `.hr` (derecha); al hover
    colapsa hacia su bisagra (`scaleX(0.13)`)
  - `.dw` cajón — al hover se desliza hacia abajo (`translateY(7px)`)
  - `.lid` tapa — al hover se levanta (`translateY(-8px)`): arcones, asadores,
    campana retráctil
  - `.in` interior/actividad revelada en oro — `.zone` (relleno oro 25%: agua,
    brasas, zonas), `<line>` repisas, `.ring` aros (quemadores, hielo, botellas),
    `<path>` trazos (agua, vapor, flamas), líneas con `strokeDasharray` (flujo de
    aire de campanas)
  - `.fl` línea de piso · `.cab` mobiliario/entorno (punteado) · `.ln` trazo
    genérico de línea · `.glass` / `.glass-shelf` elementos finos (vidrio, rejillas)
- El hover se ADAPTA a la categoría: puertas que se abren (refrigeración, hornos),
  quemadores que "encienden" (parrillas, estufas), agua que corre (grifería,
  tarjas), vapor/flamas (cafeteras, asadores), flujo de aire (campanas). Elegir el
  gesto que explica la función del tipo.
- Las manijas (`<line>`) van DENTRO del grupo de su puerta/cajón para que colapsen
  con ella. Verticales en puertas, horizontales en cajones.
- El interior (`.in`) debe calzar exactamente detrás de las puertas/cajones que lo
  cubren (inset de 2px respecto al cuerpo para no pisar el trazo).
- Dibujar la **diferencia estructural** del tipo, no el producto bonito: el entorno
  (cubierta, muebles punteados) es lo que distingue "bajo cubierta" o "empotrado".

## 5. Reglas de copy

- **`descripcion`** (Carla, 2026-10-19): UNA oración breve y **técnica** (máx ~2
  líneas) — qué es estructuralmente y qué implica (fondo, ventilación, conexión). Prohibido lo genérico ("gran calidad y diseño").
  Patrón: *rasgo estructural* + *beneficio en la vida real* ("Lo de todos los días
  queda arriba, a la mano y sin agacharse").
- **`specs`**: `Anchos X–Y″ · Tag` — cifras reales del mercado (verificar con el
  catálogo/marcas) y un tag corto de posicionamiento ("El más buscado",
  "Ergonomía diaria", "Bar · Isla · Exterior").
- Anglicismos de tipo (French Door, Bottom Mount) se conservan: así busca el cliente.

## 6. Checklist para una categoría nueva (p.ej. Congeladores, Cavas)

1. **Definir los tipos con Carla** (¿qué filtros merecen ficha?, ¿qué ejes de
   agrupación aplican?). Confirmar términos ambiguos antes de escribir copy.
2. En `GUIAS/taxonomia-guias.json`, añadir `ficha` a cada filtro (§3).
3. En `components/FiltroDiagrama.tsx`, dibujar los diagramas nuevos (§4). Reusar
   keys existentes cuando el tipo sea el mismo (p.ej. "columna" sirve para
   congeladores de columna).
4. Si aparece un eje de agrupación nuevo: `GrupoFicha` (types) + `GRUPOS`
   (FilterShowcase).
5. Verificar: la página usa fichas automáticamente (no hay que tocar `page.tsx`);
   hover abre puertas; filtros sin ficha caen a "Más filtros"; móvil (`hover: none`)
   muestra specs siempre; `prefers-reduced-motion` sin animación.

## 7. Accesibilidad y móvil

- El SVG es decorativo: `aria-hidden` + `focusable="false"`; toda la información
  está en texto dentro del enlace.
- Táctil (`hover: none`): specs siempre visibles, diagrama en reposo.
- `prefers-reduced-motion`: sin animación de puertas ni lift.
- La tarjeta completa es UN enlace (`CtaProducto`, fallback WhatsApp contextual
  mientras `PLP_READY=false`).

## 8. El mismo patrón en el PLP (2026-07-28)

La página de producto `/productos/<macro>/<sub1>/<tipo>` reusa estos diagramas en
versión **compacta** (`components/TipoGrid.tsx`, prefijo `.tpg-`): solo diagrama +
nombre, agrupados por los mismos dos ejes. Es el equivalente al mosaico visual de
AJ Madison (`/refrigerators/`), pero en el sistema v2.

**Regla anti-canibalización:** la descripción y las specs viven SOLO en la guía. El
PLP no repite ese copy — cierra con un enlace a la guía. Así las dos páginas no
compiten por la misma consulta (regla de oro del proyecto: no perder SEO).
La anatomía CSS del diagrama se comparte vía `:is(.tfk-diagram, .tpg-diagram)`;
no se duplica ninguna regla.

**Nomenclatura (Carla, 2026-07-28):** estos tipos son la **Subcategoría 3** de la
taxonomía — son filtro y, cuando la Subcategoría 2 lo amerite, página propia. Ver
`GUIAS/ARQUITECTURA-GUIAS.md` §2.

## 9. Ilustración en escena — grupo "Diseño" (Carla, 2026-10-19)

Evolución del diagrama de línea para las fichas del grupo **Diseño** (`grupo:
"estilo"`) y, solo en Refrigeradores, **Tipo de instalación** (De Piso, Empotrado,
Counter Depth; en otras categorías esas claves siguen con el diagrama de línea).
Implementado en los 14 tipos de Refrigeradores; referencia visual: French Door.

- **Instalación:** `escena: "baja"` con aparato alto = de pie entre dos tramos de
  cubierta, con `holgura` a los lados (sombra de ventilación). `planta` dibuja una
  **vista superior** en la esquina inferior derecha (gabinetes de 24″, línea
  dorada del frente): De Piso sobresale, Counter Depth queda al ras, Empotrado
  dentro del mueble. La planta no sale en el modal.
- **Diseño (Carla, 2026-10-19):** muro de **listones verticales de madera clara**
  de piso a techo, limpio, como las fotos Gaggenau (`EscenaListones`; patrón
  `#ilus-madera-clara`, ranuras cada 15 unidades, tono distinto por listón). El
  refrigerador no cambia; el panel de Columna toma la misma madera y ranuras.
  **Bajo cubierta** (referencia Gaggenau): vista cercana con cubierta gruesa de
  piedra, charola con copas, frentes lisos de la misma madera y cava de vidrio
  (`zona: "cava"`, estilo Thermador: interior negro, seis bandejas con frente de
  acero y separadores de madera, fondos de botella con aro y cápsula plata/oro,
  franja de control con dígitos azules; `manija: "tubo"` y `zocloAcero` en el
  cuerpo). Queda disponible `antracita: true` (marco/jaladera/zoclo antracita).
  **Parejas:** congelador siempre a la izquierda y refrigerador a la derecha.
  **Columna** (referencia Sub-Zero): tres torres combinadas — congelador, cava
  (`zona: "vinoteca"`, vidrio, al centro para no tapar a la vecina al abrir) y
  refrigerador — con rejilla y jaladera larga cada una; todas panelables; modal
  apilado. El texto de la ficha habla de combinarlas y panelarlas. Panelable: el marco
  de acero de la puerta de vidrio pasa a madera y el cristal se conserva.
- **Escena realista (`real: true`, solo Tipo de instalación):** nogal con veta
  (filtro `feTurbulence` → patrón `#ilus-madera`, una sola chapa continua),
  salpicadero de mármol, cubierta de piedra, jaladeras de latón, luminarias
  empotradas con haz cálido, LED bajo alacena y zoclo, piso pulido con reflejo y
  decoración (olivo, tablas, platos). Las clases son las mismas; `.ilus--real`
  cambia los materiales en `styles/guias.css`. Al panelar, el panel (nogal) cubre
  también la rejilla superior.
- **Bisagras (Carla, 2026-10-19):** Bottom Mount, Top Mount, Glass Door y Columna
  abren a la derecha; sus etiquetas van a la izquierda.

- **Tarjeta grande** (dos por fila, `.tfk-grid--ilus`): el aparato cerrado dentro
  de una cocina espresso. **Hover:** las puertas giran en 3D sobre su bisagra
  (CSS `rotateY`, con reverso: forro y anaqueles de puerta), los cajones salen al
  frente escalonados, se enciende la luz interior y aparecen etiquetas con leader
  line. Lupa dorada arriba a la derecha = "se abre".
- **Modal:** las dos vistas juntas, **Cerrado | Abierto**, recortadas al aparato
  (la abierta se anima sola). **Sin botón de WhatsApp** (en ningún modal de ficha).
- **Todo es código** (`components/IlustracionTipo.tsx`), sin fotos: cada tipo es
  DATOS en `APARATOS` — `cuerpos` (gabinetes), `huecos` (interior con `zona`:
  fresca, congelador, flex, bebidas, vino; `crisper` para cajones de verdura),
  `piezas` (`puerta(x,y,w,h,bisagra,{cristal,despachador})` o
  `cajon(x,y,w,h,zona)`) y `etiquetas`. El generador dibuja escena, cavidad en
  perspectiva, repisas, contenido, frentes de acero y reversos.
- Escena 560×400 unidades; aparatos de piso en y 56–376 (zoclo 366–376);
  `escena: "baja"` = cubierta + alacenas (bajo cubierta).
- **Etiquetas:** máx. ~20 caracteres por línea (dos líneas). Del lado izquierdo el
  texto termina en x 150 (`hasta: 150`); del derecho empieza en x 404–410. Evitar
  y 104–136 y 160–202 (jaladeras de las alacenas). Con puertas anchas de bisagra
  izquierda, poner las etiquetas a la derecha.
- Opciones de forma: `rejilla` en el cuerpo (lamas arriba, estilo Sub-Zero:
  Parejas, Glass Door), `manija: "media" | "larga" | "superior"`, `cristal` con
  marco ancho (interior iluminado aun cerrado). Proporciones según foto real de
  referencia (Parejas = dos columnas de 36″, casi cuadradas).
- **Panelar** (`panelable` en el aparato y en la puerta; hoy Columna y Empotrado):
  botón sobre la hoja derecha de la alacena derecha que cambia el frente de acero por panel del mismo material de los
  gabinetes con jaladera larga dorada; también en el modal.
- El encuadre del modal crece con la puerta más ancha (sobresale ~66 % al abrir).
  Mientras el modal está abierto, la tarjeta de origen no anima (`.tfk-quieta`):
  el velo es translúcido y se veía cerrarse detrás (doble animación).
- La ficha usa la ilustración si su `diagrama` está en `APARATOS` y el grupo es
  `estilo` (o `tipo` en Refrigeradores); si no, cae al diagrama de línea.

**Para una categoría nueva:** añadir su entrada a `APARATOS` con la misma
`diagrama` key de la taxonomía; si necesita otra mecánica (quemadores, tapas,
flujo de aire), sumar un tipo de pieza al generador en vez de dibujar a mano.
