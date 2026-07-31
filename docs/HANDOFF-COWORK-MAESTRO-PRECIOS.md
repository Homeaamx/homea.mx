# HANDOFF → Cowork · Arquitectura de control de precios SAE ↔ Shopify

> **Para:** el agente que trabaja el lado SAE (Cowork) en `MAESTRO PRECIOS`.
> **De:** Claude Code (lado Shopify / sitio web).
> **Fecha:** 2026-07-30 · **Decisión de Carla:** aprobada.
> Este documento es autosuficiente: no hace falta la conversación de origen.

---

## 0. La decisión en una línea

**Dos maestros, una llave (`CLAVE_SAE`), un dueño por dato.** No se fusionan. Se sincronizan
por llave y cada campo tiene un único archivo que manda sobre él.

---

## 1. Reparto de responsabilidades — LÉELO ANTES DE TOCAR NADA

| Archivo | Dueño | El otro agente |
|---|---|---|
| `MAESTRO_PRECIOS_HOMEA.xlsx` | **Cowork** | solo lectura |
| `MAESTRO_SHOPIFY.xlsx` | **Claude Code** | solo lectura |
| `DIRECTORIO_MARCAS` (hoja) | **Cowork** | solo lectura |
| Estructura de carpetas `PRODUCTOS/` | **Cowork** (la crea) | usa |
| Conexión Shopify Admin API | **Claude Code** | — |
| Archivos TXT para SAE | **Cowork** | — |
| CSV de import a Shopify | **Claude Code** | — |

**Regla dura:** Cowork **nunca escribe** en `MAESTRO_SHOPIFY.xlsx`. Claude Code **nunca escribe**
en `MAESTRO_PRECIOS_HOMEA.xlsx`. Si uno necesita que el otro cambie algo, se pide — no se edita.

Excepción única y controlada: las columnas `EN_SHOPIFY` y `PRECIO_EN_SHOPIFY` del maestro de
precios las **escribe Claude Code** vía script de conciliación (§6). Cowork las trata como
solo-lectura y no las llena a mano.

---

## 2. Estructura de carpetas a crear

Ubicación: **raíz** de `OneDrive-Homea/HOMEA ONE DRIVE/`, al mismo nivel que `SAE`, `VENTAS`,
`LOGISTICA`. **No** dentro de `SAE/` — productos no es un subtema de SAE.

```
PRODUCTOS/
  README.md                    ← qué vive aquí y quién manda sobre qué (copiar §1 y §7)
  1-ENTRADAS/                  ← insumos crudos, tal como llegan. NUNCA se editan.
      SAE/                     ← exports de SAE
      ARTEXA/  VIKING/  U-LINE/  MIDDLEBY/  ...   ← una carpeta por proveedor
  2-MAESTROS/                  ← las dos únicas fuentes de verdad
      MAESTRO_PRECIOS_HOMEA.xlsx
      MAESTRO_SHOPIFY.xlsx
  3-SALIDAS/                   ← generado, fechado, desechable
      SAE/                     ← TXT de carga a SAE
      SHOPIFY/                 ← CSV de import a Shopify
  4-HISTORICO/                 ← versiones anteriores de maestros y de listas
  REGLAS/                      ← documentos que el equipo usa para capturar
```

**Criterio para clasificar cualquier archivo nuevo:**
- ¿Llegó de fuera y no lo editamos? → `1-ENTRADAS/`
- ¿Es fuente de verdad viva? → `2-MAESTROS/`
- ¿Lo generamos y se puede regenerar? → `3-SALIDAS/`
- ¿Ya cumplió su función? → `4-HISTORICO/`

### Movimientos (los hace Cowork)

| Archivo | Origen | Destino |
|---|---|---|
| `MAESTRO_PRECIOS_HOMEA.xlsx` | `SAE/SAE-CARLA/MAESTRO PRECIOS/` | `2-MAESTROS/` |
| `Productos y servicios_JUL_2026.xls` | ídem | `1-ENTRADAS/SAE/` |
| `PRECIOS_MXN.txt` · `PRECIOS_USD.txt` | ídem | `3-SALIDAS/SAE/` renombrados `2026-05-22-precios-mxn.txt` / `-usd.txt` |
| `CATALOGOS VIGENTES/` (vacía) | ídem | `1-ENTRADAS/` (se disuelve en las carpetas por proveedor) |
| `POLITICA DE DESCUENTOS…xlsx` | ídem | **se queda** en `SAE/SAE-CARLA/` — no es de productos |

Los archivos que hoy viven en el repo del sitio (`catalogo-shopify/`) los mueve **Claude Code**.
Cowork no los toca.

---

## 3. Cambios a `MAESTRO_PRECIOS_HOMEA.xlsx` — hoja `MAESTRO`

### 3.1 Estado actual medido (2026-07-30)

```
18,313 filas · llave CLAVE_SAE 100% llena
LINEA_SAE 95.3%  ·  MARCA 95.0%  ·  PROVEEDOR 65.6%
PRECIO_PUBLICO 0%  ·  MONEDA 0%  ·  COSTO_PROVEEDOR 0%
ESTATUS: 18,313 en POR_VALIDAR  ·  EN_SHOPIFY: 18,313 en "NO"
```

### 3.2 Columnas nuevas a agregar

| Columna | Quién la llena | Valores | Para qué |
|---|---|---|---|
| `PRECIO_EN_SAE` | Cowork, al conciliar | número | lo que SAE **tiene hoy** |
| `FECHA_SUBIDA_SAE` | Cowork, al generar el TXT | `AAAA-MM-DD` | cuándo se subió |
| `PRECIO_EN_SHOPIFY` | **Claude Code** (script) | número MXN | lo que Shopify **tiene publicado** |
| `FECHA_SUBIDA_SHOPIFY` | **Claude Code** (script) | `AAAA-MM-DD` | — |
| `MARCA_NORMALIZADA` | Cowork | de `DIRECTORIO_MARCAS` | llave de cruce entre maestros |

### 3.3 La distinción que sostiene todo el control

Son **tres precios distintos** y no se deben mezclar:

- `PRECIO_PUBLICO` → **el precio que queremos cobrar.** Lo fija la lista de proveedor más reciente.
- `PRECIO_EN_SAE` → **el que SAE tiene hoy.** Cambia solo cuando se sube el TXT.
- `PRECIO_EN_SHOPIFY` → **el que está publicado hoy.** Cambia solo cuando se hace push por API.

El semáforo es la comparación: si los tres son iguales → 🟢. Si `PRECIO_PUBLICO` difiere de
cualquiera de los otros dos → 🔴 pendiente de sincronizar. **Nunca sobreescribas los tres a la vez
"para que empaten"** — eso destruye el control, que es precisamente ver la diferencia.

### 3.4 Valores permitidos de `ESTATUS`

Hoy todo está en `POR_VALIDAR`. Sustituir por este vocabulario cerrado:

| Valor | Significado |
|---|---|
| `VIGENTE` | precio confirmado contra lista de proveedor actual |
| `POR_VALIDAR` | está en SAE pero sin lista que lo respalde |
| `SIN_LISTA` | la marca no tiene lista de proveedor cargada |
| `DESCONTINUADO` | el proveedor lo sacó de catálogo |
| `EXCLUIDO` | decisión de Carla, no se vende |

---

## 4. ⚠️ HALLAZGO CRÍTICO — el export de SAE NO trae precios

Verifiqué `Productos y servicios_JUL_2026.xls`. Tiene **8 columnas** y ninguna es precio:

```
Clave · Descripción · Línea · Existencias · Nombre de la imagen ·
Bloqueado por costos-e · Descripción específica · Clave alterna
```

**Por eso `PRECIO_PUBLICO` está al 0% — no es un olvido, la fuente no lo tiene.**

**Acción requerida (Cowork debe pedírselo a Carla):** hace falta un **segundo export de SAE**, el
reporte de **lista de precios por producto**, que incluya `Clave` + `Precio` + `Lista/Moneda`.
Sin él, `PRECIO_EN_SAE` no se puede llenar y el control queda cojo del lado SAE.

Mientras no exista ese export: llenar `PRECIO_PUBLICO` **solo** desde listas de proveedor
(`1-ENTRADAS/`), dejar `PRECIO_EN_SAE` vacío, y marcar esas filas `SIN_LISTA` o `POR_VALIDAR`.
**No rellenar `PRECIO_PUBLICO` con el precio del maestro de Shopify** — ese es un dato derivado y
usarlo como semilla crearía una referencia circular.

---

## 5. Formato de carga a SAE — confirmado

Verificado contra `PRECIOS_MXN.txt` (2,857 líneas) y `PRECIOS_USD.txt` (1,031 líneas):

```
CLAVE<TAB>PRECIO
KSS1231-BK	304
KTD3319	200
```

- Separador **tabulador**, sin encabezado.
- **Un archivo por moneda** (la moneda está implícita en el archivo, no en una columna).
- Precio entero, sin símbolo, sin comas.
- Nombrar `AAAA-MM-DD-precios-<marca|todos>-<mxn|usd>.txt` y dejar en `3-SALIDAS/SAE/`.

---

## 6. Conciliación — cómo se llenan las columnas de estado

**Lado Shopify (automático, lo hace Claude Code):** Shopify tiene Admin API y ya hay acceso
confirmado (309 productos: 5 activos, 304 en borrador). Un script lee la tienda y **escribe de
vuelta** `PRECIO_EN_SHOPIFY`, `EN_SHOPIFY` y `FECHA_SUBIDA_SHOPIFY` con lo que realmente está
publicado. No depende de que nadie marque una casilla.

**Lado SAE (manual/periódico, lo hace Cowork):** SAE no tiene API. La conciliación es el export
mensual: se deja en `1-ENTRADAS/SAE/`, se cruza por `CLAVE_SAE` y se llena `PRECIO_EN_SAE` y
`EXISTENCIAS`. Requiere el export de precios de §4.

**Cadencia sugerida:** Shopify continuo (cada push), SAE mensual o al cierre de cada carga.

---

## 7. Reglas invariantes — no se rompen nunca

1. **`CLAVE_SAE` es la única llave.** Verificado: empata al **99.8%** con el maestro de Shopify
   (18,285 de 18,313). Prohibido cruzar por descripción, por modelo o por nombre de marca.
2. **El precio nunca se origina en Shopify.** Si alguien lo edita allá, el siguiente ciclo lo pisa.
3. **Una lista de proveedor jamás se edita.** Llega a `1-ENTRADAS/`, se lee, se deja intacta.
4. **Nada se sube a SAE ni a Shopify sin quedar registrado en `LOG_CAMBIOS`.**
5. **Los 3 precios se mantienen separados** (§3.3).
6. **Existir en SAE es requisito para "Comprar", no para "Cotizar".** Los productos sin clave SAE
   se publican como ficha de captación sin checkout. Solo se dan de alta en SAE cuando hay venta
   real. (Decisión de Carla, alineada con la regla de que los productos en USD no van a checkout.)

---

## 8. Normalización de marcas — bloquea el cruce automático

Las llaves empatan, **los nombres de marca no**. Detectado:

| `MAESTRO_PRECIOS` | `MAESTRO_SHOPIFY` |
|---|---|
| `SUB ZERO` | `SUB-ZERO` |
| `WOLF DE LINEA` | `WOLF` |
| 78 marcas distintas | 47 marcas distintas |
| 908 filas sin marca | 0 sin marca |

**`DIRECTORIO_MARCAS` (131 filas) queda como catálogo único de marcas.** Tarea de Cowork:

1. Agregar a `DIRECTORIO_MARCAS` la columna `MARCA_NORMALIZADA` — el nombre canónico, escrito
   **exactamente como aparece en la página de Marcas del sitio** (esa es la que ve el cliente).
2. Agregar `ALIAS` — variantes conocidas separadas por `|` (ej. `SUB ZERO|SUBZERO|SUB-ZERO`).
3. Llenar `MARCA_NORMALIZADA` en la hoja `MAESTRO` para las 18,313 filas.
4. Resolver las 908 filas sin marca y subir `PROVEEDOR` del 65.6% actual.

Claude Code alineará el maestro de Shopify contra ese catálogo. **Cowork define, Claude Code
obedece** — no al revés.

---

## 9. Hoja `TABLERO` — el entregable que pidió Carla

Una fila por marca (≈78). Es el "un solo archivo que consulto".

| Columna | Cómo se calcula |
|---|---|
| `MARCA` | de `DIRECTORIO_MARCAS.MARCA_NORMALIZADA` |
| `PROVEEDOR` | de `DIRECTORIO_MARCAS` |
| `SKUS` | conteo en `MAESTRO` |
| `ULTIMA_ACTUALIZACION` | máx. de `FECHA_ACTUALIZACION` de la marca |
| `CATALOGO_VIGENTE` | `CATALOGO_ORIGEN` más reciente |
| `DIAS_ANTIGUEDAD` | hoy − `ULTIMA_ACTUALIZACION` |
| `SEMAFORO` | 🟢 ≤90 días · 🟡 91–180 · 🔴 >180 o sin lista |
| `CON_PRECIO` | filas con `PRECIO_PUBLICO` |
| `EN_SAE` | filas con `PRECIO_EN_SAE` no vacío |
| `EN_SHOPIFY` | filas con `EN_SHOPIFY = SÍ` |
| `DIVERG_SAE` | filas con `PRECIO_PUBLICO ≠ PRECIO_EN_SAE` |
| `DIVERG_SHOPIFY` | filas con `PRECIO_PUBLICO ≠ PRECIO_EN_SHOPIFY` |

Las dos últimas son el corazón del tablero: **si no son cero, algo está fuera de sincronía.**

Ordenar por `DIAS_ANTIGUEDAD` descendente — lo más viejo arriba, que es lo que hay que atender.

---

## 10. Flujo de una actualización (paso a paso)

```
1. Llega lista de proveedor
   → guardar íntegra en 1-ENTRADAS/<PROVEEDOR>/AAAA-MM-<marca>-<tipo>.pdf|xlsx

2. Extraer clave + descripción + precio público
   → cruzar contra MAESTRO por CLAVE_SAE

3. Actualizar en MAESTRO (solo estas columnas):
   PRECIO_PUBLICO · MONEDA · COSTO_PROVEEDOR ·
   ESTATUS=VIGENTE · FECHA_ACTUALIZACION · CATALOGO_ORIGEN
   → NO tocar PRECIO_EN_SAE ni PRECIO_EN_SHOPIFY

4. Reportar a Carla ANTES de subir nada:
   actualizados · nuevos · descontinuados · incremento promedio %
   → esperar visto bueno

5. Generar TXT → 3-SALIDAS/SAE/  → subir a SAE
   → llenar PRECIO_EN_SAE y FECHA_SUBIDA_SAE

6. Avisar a Claude Code qué marcas cambiaron
   → él hace el push a Shopify y llena PRECIO_EN_SHOPIFY / FECHA_SUBIDA_SHOPIFY

7. Escribir el renglón en LOG_CAMBIOS con SUBIDO_A_SAE y SUBIDO_A_SHOPIFY

8. Versión anterior del maestro → 4-HISTORICO/AAAA-MM-DD-MAESTRO_PRECIOS.xlsx
```

El paso 4 no es opcional: **ningún precio se sube sin que Carla lo apruebe.**

---

## 11. Qué NO debe hacer Cowork

- ❌ Escribir en `MAESTRO_SHOPIFY.xlsx`.
- ❌ Llenar a mano `EN_SHOPIFY` o `PRECIO_EN_SHOPIFY` (los escribe el script).
- ❌ Crear una segunda llave o cruzar por descripción.
- ❌ Editar archivos de `1-ENTRADAS/`.
- ❌ Subir precios a SAE sin aprobación de Carla.
- ❌ Sembrar `PRECIO_PUBLICO` desde el maestro de Shopify (referencia circular).
- ❌ Convertir USD→MXN dentro del maestro de precios. El maestro guarda **moneda original**;
  la conversión con el FIX es un paso de publicación y lo hace el lado Shopify.

---

## 12. Orden de ejecución sugerido

| # | Tarea | Bloquea a |
|---|---|---|
| 1 | Crear `PRODUCTOS/` y mover archivos (§2) | todo |
| 2 | `DIRECTORIO_MARCAS`: `MARCA_NORMALIZADA` + `ALIAS` (§8) | el cruce entre maestros |
| 3 | Llenar `MARCA_NORMALIZADA` en las 18,313 filas; resolver las 908 sin marca | tablero |
| 4 | Agregar las 5 columnas nuevas (§3.2) | conciliación |
| 5 | **Pedir a Carla el export de precios de SAE** (§4) | `PRECIO_EN_SAE` |
| 6 | Construir hoja `TABLERO` (§9) | — |
| 7 | Cargar la primera lista de proveedor con el flujo de §10 | — |

Los pasos 1–4 y 6 no dependen del export de precios: **arrancar con ellos ya.**

---

## 13. Contrato de interfaz con Claude Code

Cowork **entrega**: `CLAVE_SAE` · `MARCA_NORMALIZADA` · `PRECIO_PUBLICO` · `MONEDA` ·
`ESTATUS` · `EXISTENCIAS` · `FECHA_ACTUALIZACION`.

Claude Code **devuelve**: `EN_SHOPIFY` · `PRECIO_EN_SHOPIFY` · `FECHA_SUBIDA_SHOPIFY`.

Nada más cruza la frontera. Si hace falta un campo nuevo, se acuerda aquí antes de agregarlo.

---

## 14. Cambios recomendados a la skill `homea-precios`

> **Nota de alcance:** la skill vive en la cuenta de claude.ai, no en este equipo — no pude leer su
> cuerpo. Estas recomendaciones se basan en su **descripción publicada** y en la arquitectura de
> este documento. Quien la edite debe validar contra el texto real.

### 14.1 Conflicto a resolver primero ⚠️

La descripción actual dispara la skill con *"actualizar precios en Shopify"*. **Eso ahora cruza la
frontera del §1.** El push a Shopify lo hace Claude Code por Admin API, no la skill.

Dos salidas posibles — hay que elegir una:

- **(A) Recomendada:** la skill genera el **delta** (qué claves y qué precios cambiaron) y lo deja
  en `3-SALIDAS/SHOPIFY/AAAA-MM-DD-delta-<marca>.csv`, luego avisa. No llama a la API.
- **(B)** La skill sí hace el push y Claude Code no toca precios. Requiere darle credenciales de
  Admin API y quitarle a Claude Code esa responsabilidad.

Mientras no se elija, **los dos podrían escribir precio en Shopify y pisarse.** Es el riesgo más
concreto de este handoff.

### 14.2 Rutas — actualización obligatoria

Toda referencia a `SAE/SAE-CARLA/MAESTRO PRECIOS/` debe apuntar a:

```
Maestro   → PRODUCTOS/2-MAESTROS/MAESTRO_PRECIOS_HOMEA.xlsx
Entradas  → PRODUCTOS/1-ENTRADAS/<PROVEEDOR>/
Salidas   → PRODUCTOS/3-SALIDAS/SAE/  y  /SHOPIFY/
Histórico → PRODUCTOS/4-HISTORICO/
```

### 14.3 Reglas a agregar al cuerpo de la skill

1. **La regla de los tres precios (§3.3).** Es el concepto que más falta le hace. Sin ella la skill
   va a "emparejar" los tres campos y matar el control.
2. **Compuerta de aprobación.** Reportar a Carla (actualizados · nuevos · descontinuados ·
   incremento promedio %) y **esperar visto bueno antes de generar el TXT.** Hoy la descripción no
   menciona una pausa; debe ser un paso explícito y bloqueante.
3. **Cruce solo por `CLAVE_SAE`.** Nunca por descripción ni por nombre de marca. Para marcas,
   resolver siempre contra `DIRECTORIO_MARCAS.ALIAS` (§8).
4. **Las listas de proveedor no se editan.** Se archivan íntegras en `1-ENTRADAS/`.
5. **Moneda original, siempre.** Prohibido convertir USD→MXN dentro del maestro. La conversión con
   el FIX es un paso de publicación del lado Shopify.
6. **Cierre obligatorio de cada carga:** renglón en `LOG_CAMBIOS` + copia de la versión anterior
   del maestro a `4-HISTORICO/`. Si no se hizo, la carga no está terminada.
7. **Formato TXT verificado (§5):** tabulador, sin encabezado, un archivo por moneda.
   Vale la pena incluir el ejemplo literal en la skill para que no lo reinvente.

### 14.4 Consultas al maestro — dirigirlas al TABLERO

La descripción ya contempla *"¿cuándo se actualizó la marca Y?"*. Instruir que esa pregunta se
responde leyendo la hoja **`TABLERO`** (78 renglones), no barriendo las 18,313 filas de `MAESTRO`.
Más rápido, y obliga a que el tablero se mantenga vivo.

Preguntas que el tablero debe poder contestar sin abrir nada más:
- ¿Qué marcas tienen precio de más de 180 días? → filtro `SEMAFORO = 🔴`
- ¿Qué marcas están fuera de sincronía? → `DIVERG_SAE > 0` o `DIVERG_SHOPIFY > 0`
- ¿Con qué catálogo está corriendo la marca X? → `CATALOGO_VIGENTE`

### 14.5 Disparadores a añadir a la descripción

Además de los que ya tiene: *conciliar precios*, *tablero de precios*, *divergencia*,
*¿está al día la marca X?*, *qué marcas están desactualizadas*, *cerrar carga de precios*.

### 14.6 Lo que la skill NO debe hacer

- Escribir en `MAESTRO_SHOPIFY.xlsx`.
- Llenar `EN_SHOPIFY` o `PRECIO_EN_SHOPIFY`.
- Subir a SAE sin aprobación de Carla.
- Sembrar `PRECIO_PUBLICO` desde el maestro de Shopify.

