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
  champagne; aparece la línea de specs (anchos típicos + tag de posicionamiento);
  la flecha del CTA crece 28→44px; la tarjeta hace lift −4px con borde oro.

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
    "descripcion": "Dos puertas arriba y congelador abajo: lo fresco queda a la altura de la vista, con baldas anchas donde cabe una charola completa.",
    "specs": "Anchos 36–48″ · El más buscado"
  }
}
```

- **`grupo`** — fila donde vive la tarjeta. Valores actuales (taxonomía interna de
  Carla): `tipo` ("Por tipo": cómo se instala — De Piso, Empotrado) y `estilo`
  ("Por estilo": formato/configuración — Parejas, French Door, Duplex, Bottom/Top
  Mount, Columna, Glass Door, 4/5 puertas, Bajo cubierta). Orden de render:
  tipo → estilo; dentro de cada grupo se respeta el orden del JSON. Si una
  categoría nueva necesita otro eje, añadirlo a `GrupoFicha` (types) y a `GRUPOS`
  (FilterShowcase) con su etiqueta.
- **`diagrama`** — key en `FiltroDiagrama.tsx`. Si no existe, cae al diagrama
  `generic` (nunca rompe).
- **`descripcion`** — ver reglas de copy (§5).
- **`specs`** — línea de precisión: medida típica + tag, separados por `·`.

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

- **`descripcion`**: UNA oración (máx ~2 líneas), concreta y útil — qué es + para
  quién / qué problema resuelve. Prohibido lo genérico ("gran calidad y diseño").
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
