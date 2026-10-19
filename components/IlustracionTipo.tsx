// IlustracionTipo — ilustración "en escena" de un tipo de producto para las
// fichas de Guías (Carla, 2026-10-19: prueba French Door aprobada; se aplica al
// grupo "Diseño" de Refrigeradores; "Tipo de instalación" sigue con el diagrama
// de línea). Evoluciona FiltroDiagrama a una tarjeta grande:
//
//   reposo  → el aparato cerrado, integrado a una cocina oscura (espresso)
//   hover   → las puertas GIRAN en 3D sobre su bisagra, los cajones salen hacia
//             el frente, se enciende la luz interior y aparecen etiquetas con
//             leader lines que explican cada zona
//   modal   → FichaModal clona esta pieza dos veces (cerrado | abierto) y las
//             pone juntas, recortadas al aparato
//
// Todo es código (SVG + CSS 3D), sin fotos. Cada tipo es DATOS (`APARATOS`):
// cuerpos (gabinetes), huecos (interiores con su zona: fresca, congelador…),
// piezas (puertas con bisagra o cajones) y etiquetas. El generador dibuja la
// escena, la cavidad en perspectiva con repisas y contenido, los frentes de acero
// y sus reversos. Escena de 560×400 unidades; cada capa se coloca con
// porcentajes (helper `caja`), así escala con la tarjeta. Colores: tokens
// --ilus-* / --dgm-* de styles/guias.css; degradados en DiagramaDefs (ilus-*).

import type { CSSProperties, ReactElement } from "react";

const W = 560;
const H = 400;

type Zona = "fresca" | "congelador" | "flex" | "bebidas" | "vino" | "cava" | "vinoteca";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Cuerpo extends Rect {
  /** Zoclo de lamas de acero (cavas estilo Thermador) en vez de rejilla oscura. */
  zocloAcero?: boolean;
  /** Rejilla de ventilación arriba (estilo Sub-Zero), en unidades de alto. */
  rejilla?: number;
}

interface Hueco extends Rect {
  zona: Zona;
  /** Cajones de verduras al fondo del compartimento. */
  crisper?: boolean;
}

interface Pieza extends Rect {
  tipo: "puerta" | "cajon";
  zona?: Zona;
  bisagra?: "l" | "r";
  cristal?: boolean;
  despachador?: boolean;
  /** Jaladera: media (½ alto), larga (casi todo el alto), superior (corta,
   *  arriba) o tubo (tubular profesional con soportes, estilo Thermador). */
  manija?: "media" | "larga" | "superior" | "tubo";
  /** Lleva capa de panel de carpintería (se enciende con el botón Panelar). */
  panelable?: boolean;
}

interface Etiqueta {
  /** Punto que señala (unidades de escena). */
  x: number;
  y: number;
  /** Hasta dónde llega la línea en X; el texto sale de ahí hacia afuera. */
  hasta: number;
  texto: string;
}

interface Aparato {
  escena: "alta" | "baja";
  cuerpos: Cuerpo[];
  huecos: Hueco[];
  piezas: Pieza[];
  etiquetas: Etiqueta[];
  /** Encuadre del modal; por omisión, el aparato con aire a los lados. */
  recorte?: Rect;
  /** Botón "Panelar": cambia el frente de acero por panel de carpintería. */
  panelable?: boolean;
  /** Modal: Cerrado y Abierto uno encima del otro (aparatos anchos: Parejas). */
  apilar?: boolean;
  /** Escena baja con aparato alto: espacio a los lados (ventilación). */
  holgura?: number;
  /** Vista superior en la esquina (tipos de instalación). */
  planta?: "piso" | "empotrado" | "counter";
  /** Escena realista: nogal, mármol, latón, luces y decoración (instalación). */
  real?: boolean;
  /** Acabado antracita (marco, jaladera y zoclo), como la cava Gaggenau. */
  antracita?: boolean;
}

/** Coloca una capa en la escena: unidades de la escena → % del contenedor. */
function caja({ x, y, w, h }: Rect): CSSProperties {
  return {
    left: `${(x / W) * 100}%`,
    top: `${(y / H) * 100}%`,
    width: `${(w / W) * 100}%`,
    height: `${(h / H) * 100}%`,
  };
}

function limites(rs: Rect[]): Rect {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.w));
  const y2 = Math.max(...rs.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

/* ——— Etiquetas ——————————————————————————————————————————————— */

function Tag({ e, i }: { e: Etiqueta; i: number }) {
  const der = e.hasta > e.x;
  const style: CSSProperties & Record<string, string | number> = {
    top: `${(e.y / H) * 100}%`,
    width: `${(Math.abs(e.hasta - e.x) / W) * 100}%`,
    "--i": i,
    // Espacio entre el final de la línea y el borde de la imagen (en % del ancho):
    // el texto nunca pasa de ahí; si no cabe, se parte en otra línea.
    "--esp": ((der ? W - e.hasta : e.hasta) / W) * 100,
  };
  if (der) style.left = `${(e.x / W) * 100}%`;
  else style.right = `${((W - e.x) / W) * 100}%`;
  return (
    <span className={`ilus-tag ${der ? "ilus-tag--der" : "ilus-tag--izq"}`} style={style}>
      <span className="ilus-tag-tx">{e.texto}</span>
    </span>
  );
}

/* ——— Escenas ————————————————————————————————————————————————— */

/** Frentes de carpintería entre x1 y x2, con juntas y jaladeras. */
function Frentes({ x1, x2, y1, y2, k, jal }: { x1: number; x2: number; y1: number; y2: number; k: string; jal: "v" | "h" }) {
  const w = x2 - x1;
  if (w < 20) return null;
  const n = Math.max(1, Math.round(w / 78));
  const paso = w / n;
  return (
    <g key={k}>
      <rect x={x1} y={y1} width={w} height={y2 - y1} className="i-mueble" />
      <rect x={x1} y={y1} width={w} height={y2 - y1} className="i-modelado" />
      {Array.from({ length: n - 1 }, (_, j) => (
        <line key={j} x1={x1 + paso * (j + 1)} y1={y1 + 2} x2={x1 + paso * (j + 1)} y2={y2 - 2} className="i-junta" />
      ))}
      {Array.from({ length: n }, (_, j) => {
        const cx = x1 + paso * j + paso / 2;
        return jal === "h" ? (
          <rect key={j} x={cx - 14} y={y1 + 9} width={28} height={2.5} className="i-jaladera" />
        ) : (
          <rect key={j} x={cx - 1.25} y={y2 - 26} width={2.5} height={20} className="i-jaladera" />
        );
      })}
    </g>
  );
}

/* ——— Escena realista: luz, decoración y piso ——————————————————————— */

/** Plafón con luminarias empotradas y su haz cálido sobre la carpintería. */
function Luces({ xs }: { xs: number[] }) {
  return (
    <g>
      <rect x={0} y={0} width={W} height={20} className="i-mueble" />
      <rect x={0} y={0} width={W} height={20} className="i-plafon" />
      {xs.map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={20} rx={78} ry={230} fill="url(#ilus-cono)" />
          <ellipse cx={cx} cy={19} rx={6.5} ry={1.6} className="i-foco" />
        </g>
      ))}
    </g>
  );
}

/** Cinta LED: resplandor cálido que cae desde `y` (bajo alacena / bajo zoclo). */
function Cinta({ x1, x2, y, h = 46 }: { x1: number; x2: number; y: number; h?: number }) {
  if (x2 - x1 < 4) return null;
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={h} fill="url(#ilus-cinta)" />
      <line x1={x1 + 2} y1={y + 0.5} x2={x2 - 2} y2={y + 0.5} className="i-led-linea" />
    </g>
  );
}

/** Olivo en jarrón (sobre la cubierta, base en y). */
function Planta2({ x, y }: { x: number; y: number }) {
  const hojas: [number, number, number][] = [
    [-9, -40, -30], [-4, -48, -10], [3, -46, 20], [9, -38, 35], [-12, -30, -50], [12, -30, 50],
    [-6, -56, -15], [6, -54, 15], [0, -60, 0], [-14, -44, -40], [14, -46, 40],
  ];
  return (
    <g>
      <path d={`M${x} ${y - 20} C ${x - 4} ${y - 34}, ${x - 8} ${y - 44}, ${x - 10} ${y - 54} M${x} ${y - 20} C ${x + 3} ${y - 36}, ${x + 8} ${y - 46}, ${x + 12} ${y - 52} M${x} ${y - 20} L ${x} ${y - 60}`} className="i-tallo" />
      {hojas.map(([dx, dy, r], k) => (
        <ellipse key={k} cx={x + dx} cy={y + dy} rx={1.6} ry={4.2} transform={`rotate(${r} ${x + dx} ${y + dy})`} className="i-hoja" />
      ))}
      <path d={`M${x - 8} ${y} Q ${x - 11} ${y - 12} ${x - 4} ${y - 20} L ${x + 4} ${y - 20} Q ${x + 11} ${y - 12} ${x + 8} ${y} Z`} className="i-jarron" />
    </g>
  );
}

/** Tablas de madera recargadas y un tazón (sobre la cubierta, base en y). */
function Tablas({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y - 15} r={15} className="i-tabla" />
      <circle cx={x + 10} cy={y - 11} r={11} className="i-tabla i-tabla-2" />
      <path d={`M${x - 14} ${y - 7} Q ${x - 2} ${y + 1} ${x + 10} ${y - 7} Z`} className="i-tazon" transform={`translate(-6 0)`} />
    </g>
  );
}

/** Platos apilados y jarrón chico. */
function Platos({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 2.4, 4.8].map((d) => (
        <rect key={d} x={x - 12} y={y - 2.2 - d} width={24} height={2} rx={1} className="i-plato" />
      ))}
      <path d={`M${x + 16} ${y} Q ${x + 12} ${y - 9} ${x + 18} ${y - 14} L ${x + 22} ${y - 14} Q ${x + 28} ${y - 9} ${x + 24} ${y} Z`} className="i-jarron" />
    </g>
  );
}

/** Tramo bajo de cocina (alacena + salpicadero + cubierta + base) entre x1 y x2. */
function TramoCubierta({ x1, x2, decor }: { x1: number; x2: number; decor?: "planta" | "tablas" | "platos" }) {
  if (x2 - x1 < 10) return null;
  const cx = (x1 + x2) / 2;
  return (
    <g>
      <Frentes x1={x1} x2={x2} y1={20} y2={150} k={`s${x1}`} jal="v" />
      <rect x={x1} y={150} width={x2 - x1} height={86} className="i-muro" />
      <Cinta x1={x1} x2={x2} y={150} h={60} />
      {decor === "planta" && <Planta2 x={cx} y={236} />}
      {decor === "tablas" && <Tablas x={cx} y={236} />}
      {decor === "platos" && <Platos x={cx - 8} y={236} />}
      <rect x={x1 - 3} y={236} width={x2 - x1 + 6} height={9} className="i-cubierta" />
      <line x1={x1 - 3} y1={236.5} x2={x2 + 3} y2={236.5} className="i-cubierta-canto" />
      <Frentes x1={x1} x2={x2} y1={245} y2={366} k={`b${x1}`} jal="h" />
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
    </g>
  );
}

/** Alacena alta (despensa) con puertas superiores e inferiores y latón largo. */
function Despensa({ x, w, y1 = 22 }: { x: number; w: number; y1?: number }) {
  return (
    <g>
      <rect x={x} y={y1} width={w} height={366 - y1} className="i-mueble" />
      <rect x={x} y={y1} width={w} height={366 - y1} className="i-modelado" />
      <line x1={x + w / 2} y1={y1 + 2} x2={x + w / 2} y2={364} className="i-junta" />
      <line x1={x + 2} y1={150} x2={x + w - 2} y2={150} className="i-junta" />
      {[x + w / 2 - 9, x + w / 2 + 6.5].map((jx) => (
        <g key={jx}>
          <rect x={jx} y={160} width={2.5} height={42} className="i-jaladera" />
          <rect x={jx} y={104} width={2.5} height={32} className="i-jaladera" />
        </g>
      ))}
      <rect x={x} y={366} width={w} height={10} className="i-zoclo" />
    </g>
  );
}

/** Empotrado realista (referencia de Carla): tramo bajo · despensa · aparato ·
 *  despensa · tramo bajo, de lado a lado, con luces y decoración. */
function EscenaAltaReal({ b }: { b: Rect }) {
  const i1 = 60;
  const d2 = 500;
  return (
    <>
      <TramoCubierta x1={0} x2={i1 - 4} decor="planta" />
      <TramoCubierta x1={d2 + 4} x2={W} decor="tablas" />
      <Despensa x={i1} w={b.x - 4 - i1} y1={20} />
      <Despensa x={b.x + b.w + 4} w={d2 - (b.x + b.w + 4)} y1={20} />
      <rect x={b.x} y={20} width={b.w} height={32} className="i-mueble" />
      <rect x={b.x} y={20} width={b.w} height={32} className="i-modelado" />
      <line x1={b.x + b.w / 2} y1={22} x2={b.x + b.w / 2} y2={50} className="i-junta" />
      <rect x={b.x - 3} y={53} width={b.w + 6} height={323} className="i-nicho" />
      <Luces xs={[28, (i1 + b.x) / 2, b.x + b.w / 2, (b.x + b.w + d2) / 2, 532]} />
    </>
  );
}

/* ——— Muro de listones de madera (escenas de Diseño, Carla 2026-10-19) ——— */

// Tono de cada listón (negro − / blanco +): la chapa no es pareja, como en obra.
const TONOS = [0.07, -0.04, 0.1, 0.02, -0.06, 0.05, 0, 0.09, -0.03, 0.04, 0.12, -0.05, 0.03];

/** Listones verticales de madera clara entre x1–x2 / y1–y2, con su ranura. */
function Listones({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  if (x2 - x1 < 2) return null;
  const paso = 15;
  const n = Math.ceil((x2 - x1) / paso);
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-liston" />
      {Array.from({ length: n }, (_, k) => {
        const t = TONOS[(k + Math.round(x1 / paso)) % TONOS.length];
        const x = x1 + k * paso;
        return (
          <g key={k}>
            <rect x={x} y={y1} width={Math.min(paso, x2 - x)} height={y2 - y1} fill={t < 0 ? "#fff" : "#000"} opacity={Math.abs(t)} />
            {k > 0 && <line x1={x} y1={y1} x2={x} y2={y2} className="i-ranura" />}
          </g>
        );
      })}
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="url(#ilus-modelado)" />
    </g>
  );
}

/** Diseño: muro de listones de piso a techo con el nicho del aparato. */
function EscenaListones({ b }: { b: Rect }) {
  return (
    <>
      <Listones x1={0} x2={W} y1={0} y2={366} />
      <rect x={0} y={366} width={W} height={10} className="i-zoclo" />
      <rect x={b.x - 3} y={53} width={b.w + 6} height={323} className="i-nicho" />
    </>
  );
}

/** Charola de madera con dos copas (sobre la cubierta, base en y). */
function Copas({ x, y }: { x: number; y: number }) {
  const copa = (cx: number) => (
    <g key={cx}>
      <path d={`M${cx - 9} ${y - 52} Q ${cx - 10} ${y - 34} ${cx} ${y - 30} Q ${cx + 10} ${y - 34} ${cx + 9} ${y - 52}`} className="i-copa" />
      <line x1={cx} y1={y - 30} x2={cx} y2={y - 8} className="i-copa-tallo" />
      <ellipse cx={cx} cy={y - 7.5} rx={6} ry={1.2} className="i-copa-tallo" />
    </g>
  );
  return (
    <g>
      <rect x={x - 10} y={y - 6} width={150} height={6} rx={1} className="i-liston" />
      <rect x={x - 10} y={y - 6} width={150} height={1.4} className="i-brillo" />
      {[x + 30, x + 66].map(copa)}
    </g>
  );
}

/** Tazón con aceitunas (sobre la cubierta, base en y). */
function Aceitunas({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[-8, -3, 2, 7, -5, 4].map((dx, k) => (
        <ellipse key={k} cx={x + dx} cy={y - 12 - (k > 3 ? 3 : 0)} rx={3} ry={2.4} className={k % 2 ? "i-hoja" : "i-aceituna"} />
      ))}
      <path d={`M${x - 14} ${y - 12} L ${x + 14} ${y - 12} L ${x + 10} ${y} L ${x - 10} ${y} Z`} className="i-jarron" />
    </g>
  );
}

/** Diseño, bajo cubierta (referencia Gaggenau): vista cercana — listones arriba,
 *  cubierta gruesa de piedra con charola y copas, frentes lisos de madera abajo. */
function EscenaListonesBaja({ b }: { b: Rect }) {
  const top = b.y - 4; // canto inferior de la cubierta
  const frente = (x1: number, x2: number, k: string) => (
    <g key={k}>
      <rect x={x1} y={top + 2} width={x2 - x1} height={366 - top - 2} className="i-mueble" />
      <rect x={x1} y={top + 2} width={x2 - x1} height={366 - top - 2} className="i-modelado" />
      <rect x={x1 + 0.5} y={top + 2.5} width={x2 - x1 - 1} height={366 - top - 3} className="i-panel-canto" />
    </g>
  );
  return (
    <>
      <Listones x1={0} x2={W} y1={0} y2={top - 22} />
      <Copas x={22} y={top - 22} />
      <Aceitunas x={472} y={top - 22} />
      <rect x={0} y={top - 22} width={W} height={22} className="i-cubierta" />
      <line x1={0} y1={top - 21.5} x2={W} y2={top - 21.5} className="i-cubierta-canto" />
      <rect x={0} y={top} width={W} height={4} className="i-nicho" />
      {/* Luz que baña los frentes desde la cubierta. */}
      {frente(0, b.x - 4, "i")}
      {frente(b.x + b.w + 4, 360 + (W - 360) / 2, "d1")}
      {frente(360 + (W - 360) / 2 + 3, W, "d2")}
      <rect x={0} y={top + 2} width={W} height={70} fill="url(#ilus-cinta)" opacity={0.22} />
      <rect x={b.x - 4} y={top} width={b.w + 8} height={376 - top} className="i-nicho" />
      <rect x={0} y={366} width={W} height={10} className="i-zoclo" />
    </>
  );
}

/** Cocina con cubierta: el aparato va bajo ella (bajo cubierta) o, si es alto,
 *  de pie entre dos tramos con `holgura` a los lados (De Piso, Counter Depth). */
function EscenaBaja({ b, holgura = 2, real }: { b: Rect; holgura?: number; real?: boolean }) {
  const alto = b.y < 236;
  const g = holgura;
  const i2 = b.x - g;
  const d1 = b.x + b.w + g;
  if (real && alto) {
    // Realista: tramos de cubierta de lado a lado, alacena corta sobre el aparato.
    return (
      <>
        <TramoCubierta x1={0} x2={i2} decor="planta" />
        <TramoCubierta x1={d1} x2={W} decor="platos" />
        <Platos x={i2 - 40} y={236} />
        <Tablas x={W - 46} y={236} />
        <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-mueble" />
        <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-modelado" />
        <line x1={(i2 + d1) / 2} y1={22} x2={(i2 + d1) / 2} y2={b.y - g - 2} className="i-junta" />
        <rect x={i2} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={b.x + b.w} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={i2} y={b.y - g} width={d1 - i2} height={g} className="i-nicho" />
        <Luces xs={[i2 / 2, (i2 + d1) / 2, (d1 + W) / 2]} />
      </>
    );
  }
  return (
    <>
      {/* Alacenas superiores con luz bajo mueble. */}
      {alto ? (
        <>
          <Frentes x1={40} x2={i2} y1={40} y2={150} k="si" jal="v" />
          <Frentes x1={d1} x2={520} y1={40} y2={150} k="sd" jal="v" />
          {b.y - g - 40 > 14 && <rect x={i2} y={22} width={d1 - i2} height={b.y - g - 22} className="i-mueble" />}
        </>
      ) : (
        <Frentes x1={40} x2={520} y1={40} y2={150} k="sup" jal="v" />
      )}
      <rect x={40} y={150} width={480} height={86} className="i-muro" />
      <rect x={40} y={150} width={480} height={86} fill="url(#ilus-bajoluz)" />
      <line x1={44} y1={151} x2={516} y2={151} className="i-filo" />
      <Frentes x1={40} x2={alto ? i2 : b.x - 2} y1={246} y2={366} k="bi" jal="h" />
      <Frentes x1={alto ? d1 : b.x + b.w + 2} x2={520} y1={246} y2={366} k="bd" jal="h" />
      <rect x={40} y={366} width={480} height={10} className="i-zoclo" />
      {alto ? (
        // Holgura de ventilación: la sombra entre el aparato y los muebles.
        <>
          <rect x={i2} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
          <rect x={b.x + b.w} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
          <rect x={i2} y={b.y - g} width={d1 - i2} height={g} className="i-nicho" />
        </>
      ) : (
        <rect x={b.x - 2} y={246} width={b.w + 4} height={130} className="i-nicho" />
      )}
      <rect x={30} y={236} width={alto ? i2 - 30 : 500} height={10} className="i-cubierta" />
      {alto && <rect x={d1} y={236} width={530 - d1} height={10} className="i-cubierta" />}
      <line x1={30} y1={236.5} x2={alto ? i2 : 530} y2={236.5} className="i-cubierta-canto" />
      {alto && <line x1={d1} y1={236.5} x2={530} y2={236.5} className="i-cubierta-canto" />}
    </>
  );
}

/** Vista superior (planta) en la esquina: lo que el alzado no enseña — el fondo
 *  del aparato contra el frente de los gabinetes. */
function Planta({ tipo }: { tipo: "piso" | "empotrado" | "counter" }) {
  const x = 420;
  const y = 278;
  const muro = y + 22;
  const frente = muro + 31; // 24″ de gabinete
  const ref = { piso: { y: muro + 3, h: 42, gap: 3 }, counter: { y: muro + 1, h: 32, gap: 2 }, empotrado: { y: muro, h: 31, gap: 0 } }[tipo];
  // Hueco de 30 entre gabinetes (x+32…x+62); la holgura los separa del aparato.
  return (
    <g className="i-planta">
      <rect x={x} y={y} width={94} height={84} className="i-planta-caja" />
      <text x={x + 47} y={y + 13} textAnchor="middle" className="i-planta-tit">
        VISTA SUPERIOR
      </text>
      <line x1={x + 6} y1={muro} x2={x + 88} y2={muro} className="i-planta-muro" />
      <rect x={x + 6} y={muro} width={26 - ref.gap} height={31} className="i-planta-gab" />
      <rect x={x + 62 + ref.gap} y={muro} width={26 - ref.gap} height={31} className="i-planta-gab" />
      <rect x={x + 32} y={ref.y} width={30} height={ref.h} className="i-planta-ref" />
      <line x1={x + 4} y1={frente} x2={x + 90} y2={frente} className="i-planta-frente" />
    </g>
  );
}

/* ——— Contenido de la cavidad ————————————————————————————————————— */

type Objeto = "jarra" | "frasco" | "limones" | "botella" | "caja" | "hielo" | "lata";

const PATRONES: Record<Zona, Objeto[][]> = {
  fresca: [
    ["jarra", "frasco", "limones", "botella"],
    ["caja", "frasco", "jarra", "limones"],
    ["botella", "caja", "frasco"],
    ["limones", "jarra", "caja"],
  ],
  congelador: [["hielo", "caja", "hielo"], ["caja", "hielo", "caja"]],
  flex: [["caja", "limones", "frasco"]],
  bebidas: [["botella", "lata", "lata", "botella", "lata"], ["lata", "botella", "lata", "lata", "botella"]],
  vino: [],
  cava: [],
  vinoteca: [],
};

const ANCHO: Record<Objeto, number> = { jarra: 15, frasco: 13, limones: 28, botella: 9, caja: 26, hielo: 24, lata: 8 };

/** Un objeto apoyado en `base`, con alto máximo `max`. */
function objeto(o: Objeto, x: number, base: number, max: number, k: string) {
  switch (o) {
    case "jarra": {
      const h = Math.min(30, max);
      return (
        <g key={k}>
          <rect x={x} y={base - h} width={15} height={h} rx={3} className="i-ceramica" />
          <rect x={x + 4} y={base - h - 5} width={7} height={6} rx={1} className="i-ceramica" />
        </g>
      );
    }
    case "frasco": {
      const h = Math.min(20, max);
      return (
        <g key={k}>
          <rect x={x} y={base - h} width={13} height={h} rx={2} className="i-vidrio" />
          <rect x={x - 1} y={base - h - 3} width={15} height={4} rx={1} className="i-tapa" />
        </g>
      );
    }
    case "limones":
      return (
        <g key={k}>
          <circle cx={x + 9} cy={base - 9} r={4.8} className="i-limon" />
          <circle cx={x + 19} cy={base - 9.5} r={5.2} className="i-limon" />
          <circle cx={x + 14} cy={base - 13.5} r={4.4} className="i-limon" />
          <path d={`M${x} ${base - 9} Q${x + 14} ${base + 3} ${x + 28} ${base - 9} Z`} className="i-ceramica" />
        </g>
      );
    case "botella": {
      const h = Math.min(34, max);
      return (
        <g key={k}>
          <rect x={x} y={base - h + 8} width={9} height={h - 8} rx={3} className="i-botella" />
          <rect x={x + 2.5} y={base - h} width={4} height={10} rx={1} className="i-botella" />
          <rect x={x} y={base - h * 0.55} width={9} height={7} className="i-etiqueta" />
        </g>
      );
    }
    case "caja": {
      const h = Math.min(15, max);
      return (
        <g key={k}>
          <rect x={x} y={base - h} width={26} height={h} rx={2} className="i-ceramica" />
          <line x1={x} y1={base - h + 4} x2={x + 26} y2={base - h + 4} className="i-linea" />
        </g>
      );
    }
    case "hielo": {
      const h = Math.min(13, max);
      return <rect key={k} x={x} y={base - h} width={24} height={h} rx={2} className="i-hielo" />;
    }
    case "lata": {
      const h = Math.min(15, max);
      return <rect key={k} x={x} y={base - h} width={8} height={h} rx={1.5} className="i-lata" />;
    }
  }
}

/** Fondo de botella visto de frente: vidrio oscuro, aro que refleja la luz y
 *  cápsula (plata, oro o sin cápsula). */
function Fondo({ cx, cy, r, capsula }: { cx: number; cy: number; r: number; capsula?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="i-fondo" />
      <circle cx={cx} cy={cy} r={r * 0.78} className="i-fondo-aro" />
      <circle cx={cx} cy={cy} r={r * 0.5} className="i-fondo-sombra" />
      {capsula && <circle cx={cx} cy={cy} r={r * 0.3} className={capsula} />}
      <path d={`M${cx - r * 0.75} ${cy - r * 0.35} A ${r * 0.82} ${r * 0.82} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.8}`} className="i-fondo-brillo" />
    </g>
  );
}

/** Interior de la cava (referencia Thermador): fondo negro, seis bandejas con
 *  frente de acero y separadores de madera, fondos de botella y, al centro, la
 *  franja de control con dígitos azules. */
function Cava({ o }: { o: Rect }) {
  const k = o.h / 210;
  const Y = (v: number) => o.y + v * k;
  const X = (f: number) => o.x + f * o.w;
  const r = Math.min(10, o.w / 16, 11 * k);
  // [y de la fila de botellas, posiciones x (fracción), cápsulas]
  const filas: [number, number[], (string | undefined)[]][] = [
    [16, [0.12, 0.3, 0.48, 0.66, 0.84], [undefined, "i-capsula-plata", "i-capsula-plata", "i-capsula-oro", undefined]],
    [47, [0.14, 0.34, 0.54, 0.76], ["i-capsula-plata", undefined, "i-capsula-plata", undefined]],
    [78, [0.2, 0.42, 0.64, 0.86], [undefined, "i-capsula-oro", undefined, "i-capsula-plata"]],
    [130, [0.14, 0.36, 0.58, 0.8], ["i-capsula-plata", "i-capsula-plata", undefined, "i-capsula-plata"]],
    [161, [0.12, 0.34, 0.56, 0.78], [undefined, "i-capsula-oro", "i-capsula-plata", undefined]],
    [192, [0.24, 0.46, 0.7], ["i-capsula-plata", undefined, "i-capsula-plata"]],
  ];
  return (
    <g>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} className="i-cava-fondo" />
      {filas.map(([y, xs, caps], n) => {
        // Separadores de madera (en punta) entre botellas, detrás de ellas.
        const seps = Array.from({ length: 7 }, (_, q) => 0.07 + q * 0.143);
        return (
          <g key={n}>
            {seps.map((f) => (
              <path
                key={f}
                d={`M${X(f) - 3} ${Y(y + 9)} L ${X(f) - 3} ${Y(y - 3)} L ${X(f)} ${Y(y - 7)} L ${X(f) + 3} ${Y(y - 3)} L ${X(f) + 3} ${Y(y + 9)} Z`}
                className="i-separador"
              />
            ))}
            {xs.map((f, q) => (
              <Fondo key={q} cx={X(f)} cy={Y(y)} r={r} capsula={caps[q]} />
            ))}
            {/* Frente de acero de la bandeja. */}
            <rect x={o.x + 2} y={Y(y + 10)} width={o.w - 4} height={6 * k} fill="url(#dgm-acero)" className="i-bandeja-acero" />
          </g>
        );
      })}
      {/* Franja de control: dígitos azules. */}
      <rect x={o.x + 1} y={Y(97)} width={o.w - 2} height={15 * k} className="i-control" />
      <text x={X(0.42)} y={Y(107)} className="i-control-azul">46</text>
      <text x={X(0.56)} y={Y(107)} className="i-control-azul">57</text>
      {[0.12, 0.17, 0.22, 0.27].map((f) => (
        <circle key={f} cx={X(f)} cy={Y(104.5)} r={0.9} className="i-control-luz" />
      ))}
      <rect x={X(0.74)} y={Y(103.5)} width={o.w * 0.12} height={1.6} className="i-control-luz" />
    </g>
  );
}

/** Torre de vinos (Columna, referencia Sub-Zero): fondo negro, frentes de repisa
 *  de madera cada pocos centímetros, fondos de botella y una fila con etiquetas
 *  blancas; franja de control con las dos temperaturas. */
function Vinoteca({ o }: { o: Rect }) {
  const paso = 22;
  const filas = Math.floor((o.h - 6) / paso);
  const control = Math.floor(filas * 0.4);
  const r = 5.4;
  const n = Math.max(2, Math.floor((o.w - 10) / 14));
  return (
    <g>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} className="i-cava-fondo" />
      {Array.from({ length: filas }, (_, f) => {
        const y = o.y + 4 + f * paso;
        if (f === control)
          return (
            <g key={f}>
              <rect x={o.x + 2} y={y + 4} width={o.w - 4} height={11} className="i-control" />
              <text x={o.x + o.w / 2} y={y + 12} textAnchor="middle" className="i-control-num">
                55° · 45°
              </text>
            </g>
          );
        const etiquetas = f === control + 1;
        return (
          <g key={f}>
            {Array.from({ length: n }, (_, q) => {
              const cx = o.x + 8 + q * ((o.w - 16) / (n - 1));
              return etiquetas ? (
                <g key={q}>
                  <rect x={cx - 5} y={y + 3} width={10} height={14} rx={2} className="i-etiqueta-blanca" />
                  <rect x={cx - 5} y={y + 3} width={10} height={4} rx={2} className="i-fondo" />
                </g>
              ) : (
                <g key={q}>
                  <circle cx={cx} cy={y + 10} r={r} className="i-fondo" />
                  <circle cx={cx} cy={y + 10} r={r * 0.75} className="i-fondo-aro" />
                </g>
              );
            })}
            <rect x={o.x + 2} y={y + 17} width={o.w - 4} height={4} className="i-repisa-madera" />
          </g>
        );
      })}
    </g>
  );
}

/** Cavidad en perspectiva con repisas, contenido y luz. */
function Cavidad({ r, n, cristal }: { r: Hueco; n: number; cristal?: boolean }) {
  const o = { x: r.x + 3, y: r.y + 3, w: r.w - 6, h: r.h - 6 };
  const dx = Math.max(7, Math.min(15, o.w * 0.1));
  const dy = 10;
  const b = { x: o.x + dx, y: o.y + dy, w: o.w - 2 * dx, h: o.h - 2 * dy };
  const pts = (p: number[]) => p.join(" ");
  const crisper = r.crisper && o.h > 120 ? 46 : 0;
  const util = o.h - crisper - (crisper ? 4 : 0);
  const niveles = r.zona === "vino" || r.zona === "cava" || r.zona === "vinoteca" ? 0 : Math.max(1, Math.round(util / 54));
  const repisas: number[] = Array.from({ length: niveles }, (_, k) => o.y + (util * (k + 1)) / niveles);
  const filas = PATRONES[r.zona];
  const cosas: ReactElement[] = [];
  repisas.forEach((ys, k) => {
    const alto = util / niveles - 9;
    const pat = filas[(k + n) % Math.max(1, filas.length)] ?? [];
    let x = o.x + dx * 0.7 + 3;
    const fin = o.x + o.w - dx * 0.7 - 3;
    let j = 0;
    while (pat.length && j < 12) {
      const ob = pat[j % pat.length];
      if (x + ANCHO[ob] > fin) break;
      cosas.push(objeto(ob, x, ys - 3, alto, `${k}-${j}`));
      x += ANCHO[ob] + (r.zona === "bebidas" ? 3 : 7);
      j++;
    }
  });
  const yc = o.y + o.h - crisper;
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#dgm-cavidad)" />
      <polygon points={pts([o.x, o.y, o.x + o.w, o.y, b.x + b.w, b.y, b.x, b.y])} className="i-techo" />
      <polygon points={pts([o.x, o.y, b.x, b.y, b.x, b.y + b.h, o.x, o.y + o.h])} fill="url(#ilus-lado-l)" />
      <polygon points={pts([o.x + o.w, o.y, b.x + b.w, b.y, b.x + b.w, b.y + b.h, o.x + o.w, o.y + o.h])} fill="url(#ilus-lado-r)" />
      <polygon points={pts([o.x, o.y + o.h, o.x + o.w, o.y + o.h, b.x + b.w, b.y + b.h, b.x, b.y + b.h])} className="i-suelo" />
      <rect x={o.x + o.w * 0.2} y={o.y + 2.5} width={o.w * 0.6} height={2.2} rx={1.1} className="i-led" />
      <ellipse cx={o.x + o.w / 2} cy={o.y + 10} rx={o.w * 0.42} ry={Math.min(22, o.h * 0.15)} fill="url(#ilus-led)" />

      {/* Cava: botellas acostadas vistas de frente sobre rieles. */}
      {r.zona === "vino" &&
        Array.from({ length: Math.floor((o.h - 16) / 13) }, (_, f) => {
          const y = o.y + 14 + f * 13;
          const cols = Math.floor((o.w - 14) / 11);
          return (
            <g key={f}>
              {Array.from({ length: cols }, (_, c) => (
                <g key={c}>
                  <circle cx={o.x + 12 + c * 11} cy={y} r={4.6} className="i-botella" />
                  <circle cx={o.x + 11 + c * 11} cy={y - 1.2} r={1.3} className="i-brillo" />
                </g>
              ))}
              <line x1={o.x + 4} y1={y + 5.5} x2={o.x + o.w - 4} y2={y + 5.5} className="i-riel" />
            </g>
          );
        })}

      {/* Cava (bajo cubierta), como la referencia Gaggenau: botellas vistas de
          frente (fondo con cápsula de color) sobre repisas claras, franja de
          control al centro, ranuras de ventilación al fondo y caja de vino abajo. */}
      {r.zona === "cava" && <Cava o={o} />}
      {r.zona === "vinoteca" && <Vinoteca o={o} />}

      {cosas}
      {repisas.map((ys, k) =>
        k === repisas.length - 1 && !crisper ? null : (
          <g key={k}>
            <polygon points={pts([o.x, ys, o.x + o.w, ys, b.x + b.w, ys - 8, b.x, ys - 8])} className="i-repisa" />
            <line x1={o.x} y1={ys + 0.5} x2={o.x + o.w} y2={ys + 0.5} className="i-canto" />
          </g>
        ),
      )}

      {crisper > 0 && (
        <g>
          {(o.w > 100 ? [0, 1] : [0]).map((c) => {
            const bw = o.w > 100 ? (o.w - 12) / 2 : o.w - 8;
            const bx = o.x + 4 + c * (bw + 4);
            const ofs = ["i-verde", "i-verde", "i-limon", "i-durazno"];
            const m = Math.floor((bw - 8) / 12);
            return (
              <g key={c}>
                {Array.from({ length: m }, (_, q) => (
                  <circle key={q} cx={bx + 8 + q * 12} cy={yc + 7 + (q % 2)} r={6} className={ofs[(q + c * 2) % 4]} />
                ))}
                <rect x={bx} y={yc + 2} width={bw} height={crisper - 4} rx={3} className="i-crisper" />
                <line x1={bx + bw * 0.3} y1={yc + 8} x2={bx + bw * 0.7} y2={yc + 8} className="i-canto" />
              </g>
            );
          })}
        </g>
      )}

      {/* La luz se enciende al abrir (velo que se desvanece). */}
      <rect x={o.x} y={o.y} width={o.w} height={o.h} className={cristal ? "ilus-apagado ilus-apagado--cristal" : "ilus-apagado"} />
    </g>
  );
}

/* ——— Frentes: puertas (cara + reverso) y cajones ———————————————————— */

/** Marco del cristal: más ancho abajo, como las puertas Sub-Zero. */
const MARCO = { lado: 12, arriba: 12, abajo: 24 };
const huecoCristal = (w: number, h: number) =>
  `M0.75 0.75H${w - 0.75}V${h - 0.75}H0.75Z M${MARCO.lado} ${MARCO.arriba}V${h - MARCO.abajo}H${w - MARCO.lado}V${MARCO.arriba}Z`;

function FrentePuerta({ p }: { p: Pieza }) {
  const { w, h } = p;
  const l = p.bisagra !== "r";
  const hx = l ? w - 10 : 6;
  let len = Math.min(108, h * 0.6);
  let hy = h > 200 ? h * 0.42 - len / 2 : h / 2 - len / 2;
  if (p.manija === "media") [len, hy] = [h * 0.5, h * 0.45 - h * 0.25];
  if (p.manija === "larga") [len, hy] = [h * 0.86, h * 0.07];
  if (p.manija === "superior") [len, hy] = [h * 0.3, h * 0.1];
  const tubo = p.manija === "tubo";
  if (tubo) [len, hy] = [h * 0.8, h * 0.1];
  return (
    <svg className="ilus-cara" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {p.cristal ? (
        <>
          <path d={huecoCristal(w, h)} fillRule="evenodd" fill="url(#dgm-acero)" className="i-panel i-marco-cristal" />
          <rect x={MARCO.lado} y={MARCO.arriba} width={w - 2 * MARCO.lado} height={h - MARCO.arriba - MARCO.abajo} className="i-cristal" />
          <polygon
            points={`${w * 0.32},${MARCO.arriba} ${w * 0.55},${MARCO.arriba} ${w * 0.22},${h - MARCO.abajo} ${MARCO.lado},${h - MARCO.abajo} ${MARCO.lado},${h * 0.72}`}
            className="i-reflejo"
          />
        </>
      ) : (
        <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#dgm-acero)" className="i-panel" />
      )}
      {/* Modelado del acero (luz y bandas); en vidrio solo sobre el marco. */}
      {p.cristal ? (
        <>
          <path d={huecoCristal(w, h)} fillRule="evenodd" fill="url(#ilus-acero-luz)" className="i-acero-luz" />
          <path d={huecoCristal(w, h)} fillRule="evenodd" fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
        </>
      ) : (
        <>
          <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
          <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
        </>
      )}
      {p.despachador && (
        <g>
          <rect x={w * 0.2} y={h * 0.26} width={w * 0.6} height={40} rx={2} className="i-despachador" />
          <rect x={w * 0.3} y={h * 0.26 + 9} width={w * 0.4} height={24} rx={1.5} className="i-hueco" />
          <rect x={w * 0.28} y={h * 0.26 + 3} width={w * 0.44} height={3} rx={1} className="i-pantalla" />
        </g>
      )}
      {tubo ? (
        // Tubo de acero sobre dos soportes, separado de la puerta (sombra).
        <g>
          <rect x={(l ? w - 14 : 6) + 2} y={hy + 3} width={7} height={len} rx={3.5} className="i-manija-sombra" />
          <rect x={l ? w - 13 : 7} y={hy - 2} width={6} height={9} rx={1.5} className="i-manija" />
          <rect x={l ? w - 13 : 7} y={hy + len - 7} width={6} height={9} rx={1.5} className="i-manija" />
          <rect x={l ? w - 14 : 6} y={hy + 4} width={8} height={len - 8} rx={4} fill="url(#ilus-cromo)" className="i-manija-tubo" />
        </g>
      ) : (
        <>
          <rect x={l ? hx - 2 : hx + 2} y={hy + 3} width={4} height={len} rx={2} className="i-manija-sombra" />
          <rect x={hx} y={hy} width={4} height={len} rx={2} className="i-manija" />
          <rect x={l ? hx + 4 : hx - 2} y={hy + 6} width={2} height={4} className="i-manija" />
          <rect x={l ? hx + 4 : hx - 2} y={hy + len - 10} width={2} height={4} className="i-manija" />
        </>
      )}
      {p.panelable && p.cristal && (
        // Panelada con vidrio: el marco de acero pasa a madera y el cristal queda.
        <g className="i-panelado">
          <path d={huecoCristal(w, h)} fillRule="evenodd" className="i-mueble" />
          <path d={huecoCristal(w, h)} fillRule="evenodd" className="i-modelado" />
          <rect x={MARCO.lado - 1} y={MARCO.arriba - 1} width={w - 2 * MARCO.lado + 2} height={h - MARCO.arriba - MARCO.abajo + 2} className="i-panel-canto" />
          <rect x={l ? w - 8 : 4.5} y={h * 0.06} width={3.5} height={h * 0.88} rx={1.5} className="i-jaladera-oro" />
        </g>
      )}
      {p.panelable && !p.cristal && (
        // Panel a medida del mismo material que los gabinetes + jaladera larga dorada.
        <g className="i-panelado">
          <rect x={0} y={0} width={w} height={h} className="i-mueble" />
          <rect x={0} y={0} width={w} height={h} className="i-modelado" />
          {Array.from({ length: Math.floor(w / 15) }, (_, k) => (
            <line key={k} x1={(k + 1) * 15} y1={0} x2={(k + 1) * 15} y2={h} className="i-ranura i-ranura-panel" />
          ))}
          <rect x={1} y={1} width={w - 2} height={h - 2} className="i-panel-canto" />
          <rect x={l ? w - 11 : 7.5} y={h * 0.12} width={3.5} height={h * 0.76} rx={1.5} className="i-jaladera-oro" />
        </g>
      )}
    </svg>
  );
}

function ReversoPuerta({ p }: { p: Pieza }) {
  const { w, h } = p;
  if (p.cristal) {
    return (
      <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={huecoCristal(w, h)} fillRule="evenodd" fill="url(#ilus-forro)" className="i-panel i-marco-cristal" />
        <rect x={MARCO.lado} y={MARCO.arriba} width={w - 2 * MARCO.lado} height={h - MARCO.arriba - MARCO.abajo} className="i-cristal" />
      </svg>
    );
  }
  const n = Math.max(1, Math.floor((h - 24) / 48));
  const paso = (h - 24) / n;
  const conjuntos: Objeto[][] = [["botella", "frasco", "jarra"], ["frasco", "caja"], ["jarra", "botella", "frasco"]];
  return (
    <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-forro)" className="i-panel" />
      <rect x={5} y={5} width={w - 10} height={h - 10} rx={4} className="i-empaque" />
      {Array.from({ length: n }, (_, k) => {
        const by = 12 + paso * (k + 1) - 18;
        let x = 14;
        const items: ReactElement[] = [];
        const lista: Objeto[] = p.zona === "congelador" ? ["hielo", "hielo"] : conjuntos[k % 3];
        for (const [q, ob] of lista.entries()) {
          if (x + ANCHO[ob] > w - 12) break;
          items.push(objeto(ob, x, by + 4, 26, `${k}-${q}`));
          x += ANCHO[ob] + 5;
        }
        return (
          <g key={k}>
            {items}
            <rect x={9} y={by} width={w - 18} height={16} rx={2} className="i-anaquel" />
          </g>
        );
      })}
    </svg>
  );
}

function FrenteCajon({ p }: { p: Pieza }) {
  const { w, h } = p;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
      <rect x={w * 0.19} y={14} width={w * 0.62} height={4.5} rx={2.2} className="i-manija-sombra" />
      <rect x={w * 0.19} y={11} width={w * 0.62} height={4.5} rx={2.2} className="i-manija i-manija-h" />
      <rect x={w * 0.19 + 3} y={8} width={3} height={5} className="i-manija" />
      <rect x={w * 0.81 - 6} y={8} width={3} height={5} className="i-manija" />
    </svg>
  );
}

/** Canasta del cajón: aparece sobre el frente cuando el cajón sale. */
function Canasta({ p }: { p: Pieza }) {
  const w = p.w - 8;
  const fria = p.zona !== "flex";
  const cosas: ReactElement[] = [];
  let x = 10;
  let j = 0;
  while (x < w - 20 && j < 8) {
    const ancho = [28, 20, 32, 18][j % 4];
    if (x + ancho > w - 6) break;
    const cls = fria ? (j % 2 ? "i-ceramica" : "i-hielo") : ["i-ceramica", "i-verde", "i-limon", "i-ceramica"][j % 4];
    cosas.push(<rect key={j} x={x} y={4 + (j % 2) * 2} width={ancho} height={14 - (j % 2) * 2} rx={2} className={cls} />);
    x += ancho + 6;
    j++;
  }
  return (
    <svg
      className="ilus-capa ilus-canasta"
      style={caja({ x: p.x + 4, y: p.y - 8, w, h: 22 })}
      viewBox={`0 0 ${w} 22`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={`0,22 ${w},22 ${w - 8},0 8,0`} className="i-canasta" />
      {cosas}
    </svg>
  );
}

/* ——— Pieza completa ————————————————————————————————————————————— */

function Ilustracion({ a }: { a: Aparato }) {
  const b = limites(a.cuerpos);
  const cajones = a.piezas.filter((p) => p.tipo === "cajon").sort((p, q) => q.y - p.y);
  return (
    <>
      <svg className="ilus-escena" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect width={W} height={H} fill="url(#ilus-pared)" />
        <ellipse cx={W / 2} cy={10} rx={320} ry={190} fill="url(#ilus-halo)" />
        <rect y={376} width={W} height={24} className="i-piso" />
        {a.real ? (
          a.escena === "alta" ? <EscenaAltaReal b={b} /> : <EscenaBaja b={b} holgura={a.holgura} real />
        ) : a.escena === "alta" ? (
          <EscenaListones b={b} />
        ) : (
          <EscenaListonesBaja b={b} />
        )}
        {/* Piso pulido: reflejo del aparato (todas las escenas) y, en la realista,
            la luz del zoclo. */}
        {a.real && <rect x={0} y={376} width={W} height={10} fill="url(#ilus-cinta)" opacity={0.35} />}
        <rect x={b.x} y={377} width={b.w} height={22} fill="url(#ilus-reflejo)" />
        <ellipse cx={b.x + b.w / 2} cy={377} rx={b.w * 0.72} ry={7} fill="url(#ilus-sombra)" />

        {/* Cuerpos: marco, zoclo con rejilla y, detrás de cada cajón, el hueco. */}
        {a.cuerpos.map((c, k) => (
          <g key={k}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} className="i-marco" />
            {c.rejilla && (
              <g>
                <rect x={c.x} y={c.y} width={c.w} height={c.rejilla} fill="url(#dgm-acero)" className="i-panel" />
                {Array.from({ length: Math.floor((c.rejilla - 4) / 3) }, (_, j) => (
                  <line key={j} x1={c.x + 3} y1={c.y + 3.5 + j * 3} x2={c.x + c.w - 3} y2={c.y + 3.5 + j * 3} className="i-lama" />
                ))}
                {/* Al panelar, la rejilla también queda detrás del panel. */}
                {a.panelable && (
                  <g className="i-panelado">
                    <rect x={c.x} y={c.y} width={c.w} height={c.rejilla + 0.5} className="i-mueble" />
                    <rect x={c.x} y={c.y} width={c.w} height={c.rejilla + 0.5} className="i-modelado" />
                    <line x1={c.x} y1={c.y + c.rejilla} x2={c.x + c.w} y2={c.y + c.rejilla} className="i-junta" />
                  </g>
                )}
              </g>
            )}
            {c.zocloAcero ? (
              <g>
                <rect x={c.x} y={c.y + c.h - 12} width={c.w} height={12} fill="url(#dgm-acero)" className="i-panel" />
                {[0, 1, 2].map((f) =>
                  Array.from({ length: 6 }, (_, q) => (
                    <rect key={`${f}-${q}`} x={c.x + 6 + q * ((c.w - 12) / 6)} y={c.y + c.h - 10 + f * 3.3} width={(c.w - 12) / 6 - 3} height={1.6} rx={0.8} className="i-lama-zoclo" />
                  )),
                )}
              </g>
            ) : (
              <>
                <rect x={c.x} y={c.y + c.h - 10} width={c.w} height={10} className="i-zoclo-ap" />
                {Array.from({ length: Math.floor((c.w - 16) / 10) }, (_, j) => (
                  <line key={j} x1={c.x + 12 + j * 10} y1={c.y + c.h - 7.5} x2={c.x + 12 + j * 10} y2={c.y + c.h - 2.5} className="i-rejilla" />
                ))}
              </>
            )}
          </g>
        ))}
        {cajones.map((p, k) => (
          <rect key={k} x={p.x + 3} y={p.y + 2} width={p.w - 6} height={p.h - 4} className="i-hueco" />
        ))}
        {a.planta && <Planta tipo={a.planta} />}
        {a.huecos.map((h, k) => (
          <Cavidad
            key={k}
            r={h}
            n={k}
            cristal={a.piezas.some((p) => p.cristal && p.x < h.x + h.w && h.x < p.x + p.w && p.y < h.y + h.h && h.y < p.y + p.h)}
          />
        ))}
      </svg>

      {cajones.map((p, k) => (
        <Canasta key={`c${k}`} p={p} />
      ))}
      {cajones.map((p, k) => (
        <span
          key={`d${k}`}
          className="ilus-capa ilus-cajon"
          style={{ ...caja(p), zIndex: 2 + k, "--k": k } as CSSProperties}
        >
          <FrenteCajon p={p} />
        </span>
      ))}

      {a.piezas
        .filter((p) => p.tipo === "puerta")
        .map((p, k) => (
          <span key={`p${k}`} className={`ilus-capa ilus-puerta ilus-puerta--${p.bisagra === "r" ? "r" : "l"}`} style={caja(p)}>
            <FrentePuerta p={p} />
            <ReversoPuerta p={p} />
          </span>
        ))}

      <span className="ilus-tags" aria-hidden="true">
        {a.etiquetas.map((e, i) => (
          <Tag key={i} e={e} i={i} />
        ))}
      </span>
    </>
  );
}

/* ——— Registro: key = ficha.diagrama ——————————————————————————————— */

// Alto de los aparatos de piso: y 56–376 (zoclo 366–376).
const ALTO = { y: 56, h: 320 };
const puerta = (x: number, y: number, w: number, h: number, bisagra: "l" | "r", extra: Partial<Pieza> = {}): Pieza => ({
  tipo: "puerta", x, y, w, h, bisagra, ...extra,
});
const cajon = (x: number, y: number, w: number, h: number, zona: Zona): Pieza => ({ tipo: "cajon", x, y, w, h, zona });

const APARATOS: Record<string, Aparato> = {
  // ——— Tipo de instalación (solo Refrigeradores; ver FilterShowcase) ———
  // De Piso: libre, más bajo y con holgura a los lados; la planta enseña que
  // sobresale del frente de los gabinetes.
  "de-piso": {
    escena: "baja",
    real: true,
    holgura: 8,
    planta: "piso",
    cuerpos: [{ x: 212, y: 70, w: 136, h: 306 }],
    huecos: [{ x: 212, y: 70, w: 136, h: 180, zona: "fresca", crisper: true }],
    piezas: [puerta(212, 70, 136, 180, "r"), cajon(212, 254, 136, 112, "congelador")],
    etiquetas: [
      { x: 246, y: 96, hasta: 150, texto: "Fondo 29–36″:\nsobresale del mueble" },
      { x: 208, y: 196, hasta: 150, texto: "Holgura lateral\npara ventilar" },
      { x: 246, y: 318, hasta: 150, texto: "Sin obra: se\nconecta y listo" },
    ],
  },
  // Empotrado: built-in a ras dentro de la carpintería; admite panel.
  empotrado: {
    escena: "alta",
    real: true,
    panelable: true,
    planta: "empotrado",
    cuerpos: [{ x: 190, ...ALTO, w: 180, rejilla: 16 }],
    huecos: [{ x: 190, y: 74, w: 180, h: 292, zona: "fresca", crisper: true }],
    piezas: [puerta(190, 74, 180, 292, "l", { manija: "larga", panelable: true })],
    etiquetas: [
      { x: 240, y: 100, hasta: 150, texto: "A ras del mueble:\n24″ de fondo" },
      { x: 240, y: 236, hasta: 150, texto: "Admite panel o\nfrente de acero" },
      { x: 236, y: 371, hasta: 150, texto: "Ventila por el\nzoclo frontal" },
    ],
  },
  // Counter Depth: libre pero con el fondo de la cubierta; sin nicho a medida.
  "counter-depth": {
    escena: "baja",
    real: true,
    holgura: 3,
    planta: "counter",
    cuerpos: [{ x: 200, y: 64, w: 160, h: 312 }],
    huecos: [{ x: 200, y: 64, w: 160, h: 182, zona: "fresca", crisper: true }],
    piezas: [puerta(200, 64, 80, 182, "l"), puerta(280, 64, 80, 182, "r"), cajon(200, 250, 160, 116, "congelador")],
    etiquetas: [
      { x: 238, y: 96, hasta: 150, texto: "Al ras de la\ncubierta: 24–28″" },
      { x: 198, y: 200, hasta: 150, texto: "Sin nicho\na medida" },
      { x: 238, y: 318, hasta: 150, texto: "Instalación libre:\nse conecta y listo" },
    ],
  },

  // Proporción de la foto de referencia (dos columnas de 36″, casi cuadradas):
  // rejilla arriba, jaladeras juntas al centro.
  parejas: {
    escena: "alta",
    apilar: true,
    cuerpos: [{ x: 140, ...ALTO, w: 138, rejilla: 16 }, { x: 282, ...ALTO, w: 138, rejilla: 16 }],
    // Regla de Carla (2026-10-19): congelador a la izquierda, refrigerador a la derecha.
    huecos: [
      { x: 140, y: 74, w: 138, h: 292, zona: "congelador" },
      { x: 282, y: 74, w: 138, h: 292, zona: "fresca", crisper: true },
    ],
    piezas: [puerta(140, 74, 138, 292, "l", { manija: "media", zona: "congelador" }), puerta(282, 74, 138, 292, "r", { manija: "media" })],
    etiquetas: [
      { x: 176, y: 100, hasta: 128, texto: "Congelador\nindependiente" },
      { x: 280, y: 336, hasta: 128, texto: "Kit de unión:\nuna sola pieza" },
      { x: 386, y: 100, hasta: 432, texto: "Refrigerador\ncon su compresor" },
      { x: 384, y: 250, hasta: 432, texto: "Control propio\nen cada columna" },
    ],
  },
  "french-door": {
    escena: "alta",
    cuerpos: [{ x: 200, ...ALTO, w: 160 }],
    huecos: [{ x: 200, y: 56, w: 160, h: 188, zona: "fresca", crisper: true }],
    piezas: [puerta(200, 56, 80, 188, "l"), puerta(280, 56, 80, 188, "r"), cajon(200, 248, 160, 118, "congelador")],
    etiquetas: [
      { x: 238, y: 80, hasta: 150, texto: "Lo fresco a la\naltura de los ojos" },
      { x: 234, y: 318, hasta: 150, texto: "Congelador en cajón\nde extracción total" },
      { x: 382, y: 80, hasta: 404, texto: "Medias puertas:\nabren en poco espacio" },
      { x: 330, y: 222, hasta: 404, texto: "Cajones de\nhumedad controlada" },
    ],
  },
  duplex: {
    escena: "alta",
    cuerpos: [{ x: 200, ...ALTO, w: 160 }],
    huecos: [
      { x: 200, y: 56, w: 70, h: 310, zona: "congelador" },
      { x: 270, y: 56, w: 90, h: 310, zona: "fresca", crisper: true },
    ],
    piezas: [puerta(200, 56, 70, 310, "l", { zona: "congelador", despachador: true }), puerta(270, 56, 90, 310, "r")],
    etiquetas: [
      { x: 226, y: 84, hasta: 150, texto: "Congelador vertical\nde piso a techo" },
      { x: 186, y: 300, hasta: 150, texto: "Despachador de agua\ny hielo en la puerta" },
      { x: 318, y: 84, hasta: 410, texto: "Compartimento fresco\nde altura completa" },
      { x: 386, y: 236, hasta: 410, texto: "Puertas angostas:\nabatimiento corto" },
    ],
  },
  "bottom-mount": {
    escena: "alta",
    cuerpos: [{ x: 215, ...ALTO, w: 130 }],
    huecos: [{ x: 215, y: 56, w: 130, h: 188, zona: "fresca", crisper: true }],
    piezas: [puerta(215, 56, 130, 188, "r"), cajon(215, 248, 130, 118, "congelador")],
    etiquetas: [
      { x: 248, y: 84, hasta: 150, texto: "Una sola puerta\npara lo fresco" },
      { x: 248, y: 224, hasta: 150, texto: "Verduras a la\naltura de la mano" },
      { x: 246, y: 318, hasta: 150, texto: "Congelador en\ncajón inferior" },
    ],
  },
  "top-mount": {
    escena: "alta",
    cuerpos: [{ x: 215, ...ALTO, w: 130 }],
    huecos: [
      { x: 215, y: 56, w: 130, h: 92, zona: "congelador" },
      { x: 215, y: 152, w: 130, h: 214, zona: "fresca", crisper: true },
    ],
    piezas: [puerta(215, 56, 130, 92, "r", { zona: "congelador" }), puerta(215, 152, 130, 214, "r")],
    etiquetas: [
      { x: 248, y: 96, hasta: 150, texto: "Congelador arriba\ncon su propia puerta" },
      { x: 248, y: 236, hasta: 150, texto: "Compartimento\nfresco abajo" },
      { x: 260, y: 360, hasta: 150, texto: "Un solo sistema de\nfrío: menor consumo" },
    ],
  },
  // Torres que se combinan (Carla, 2026-10-19; referencia Sub-Zero): congelador,
  // cava y refrigerador lado a lado, cada una con su rejilla y su jaladera. Todas
  // panelables (botón "Panelar"). La cava va al centro: su puerta es de vidrio y
  // al abrirse no tapa a la vecina.
  columna: {
    escena: "alta",
    panelable: true,
    apilar: true,
    cuerpos: [
      { x: 96, ...ALTO, w: 120, rejilla: 18 },
      { x: 220, ...ALTO, w: 112, rejilla: 18 },
      { x: 336, ...ALTO, w: 120, rejilla: 18 },
    ],
    huecos: [
      { x: 96, y: 76, w: 120, h: 290, zona: "congelador" },
      { x: 220, y: 76, w: 112, h: 290, zona: "vinoteca" },
      { x: 336, y: 76, w: 120, h: 290, zona: "fresca", crisper: true },
    ],
    piezas: [
      puerta(96, 76, 120, 290, "l", { zona: "congelador", manija: "larga", panelable: true }),
      puerta(220, 76, 112, 290, "l", { cristal: true, manija: "larga", panelable: true }),
      puerta(336, 76, 120, 290, "r", { manija: "larga", panelable: true }),
    ],
    etiquetas: [
      { x: 150, y: 150, hasta: 104, texto: "Congelador" },
      { x: 256, y: 236, hasta: 104, texto: "Cava de vinos" },
      { x: 218, y: 336, hasta: 104, texto: "Kit de unión" },
      { x: 400, y: 150, hasta: 452, texto: "Refrigerador" },
      { x: 400, y: 300, hasta: 452, texto: "Compresor\npropio" },
    ],
  },
  // Como la referencia Sub-Zero: rejilla arriba, marco de acero ancho, interior
  // iluminado con comida a la vista y jaladera de alto completo.
  "glass-door": {
    escena: "alta",
    cuerpos: [{ x: 215, ...ALTO, w: 130, rejilla: 18 }],
    huecos: [{ x: 215, y: 76, w: 130, h: 290, zona: "fresca", crisper: true }],
    piezas: [puerta(215, 76, 130, 290, "r", { cristal: true, manija: "larga" })],
    etiquetas: [
      { x: 250, y: 100, hasta: 150, texto: "Iluminación LED\nen cada repisa" },
      { x: 250, y: 236, hasta: 150, texto: "El interior\nse ve sin abrir" },
      { x: 250, y: 318, hasta: 150, texto: "Vidrio aislante\ncon filtro UV" },
    ],
  },
  // Como la referencia (libre, más baja): bisagra a la derecha, jaladera corta
  // arriba a la izquierda y rejilla de zoclo.
  "una-puerta": {
    escena: "alta",
    cuerpos: [{ x: 220, y: 84, w: 120, h: 292 }],
    huecos: [{ x: 220, y: 84, w: 120, h: 282, zona: "fresca", crisper: true }],
    piezas: [puerta(220, 84, 120, 282, "r", { manija: "superior" })],
    etiquetas: [
      { x: 256, y: 96, hasta: 150, texto: "Todo el volumen\npara refrigerar" },
      { x: 256, y: 236, hasta: 150, texto: "Sin congelador:\nuna sola zona" },
      { x: 256, y: 340, hasta: 150, texto: "Cajones de\nhumedad controlada" },
    ],
  },
  "cuatro-puertas": {
    escena: "alta",
    cuerpos: [{ x: 200, ...ALTO, w: 160 }],
    huecos: [{ x: 200, y: 56, w: 160, h: 150, zona: "fresca", crisper: true }],
    piezas: [
      puerta(200, 56, 80, 150, "l"),
      puerta(280, 56, 80, 150, "r"),
      cajon(200, 210, 160, 68, "flex"),
      cajon(200, 282, 160, 84, "congelador"),
    ],
    etiquetas: [
      { x: 238, y: 80, hasta: 150, texto: "Zona fresca\nfrench door" },
      { x: 236, y: 340, hasta: 150, texto: "Congelador en\ncajón inferior" },
      { x: 382, y: 80, hasta: 404, texto: "Medias puertas:\nabren en poco espacio" },
      { x: 330, y: 250, hasta: 404, texto: "Cajón flex:\ntemperatura a elegir" },
    ],
  },
  "cinco-puertas": {
    escena: "alta",
    cuerpos: [{ x: 196, ...ALTO, w: 168 }],
    huecos: [{ x: 196, y: 56, w: 168, h: 140, zona: "fresca" }],
    piezas: [
      puerta(196, 56, 84, 140, "l"),
      puerta(280, 56, 84, 140, "r"),
      cajon(196, 200, 82, 72, "flex"),
      cajon(282, 200, 82, 72, "flex"),
      cajon(196, 276, 168, 90, "congelador"),
    ],
    etiquetas: [
      { x: 238, y: 80, hasta: 150, texto: "Zona fresca\nfrench door" },
      { x: 236, y: 236, hasta: 150, texto: "Dos cajones con\ntemperatura propia" },
      { x: 236, y: 336, hasta: 150, texto: "Congelador en\ncajón inferior" },
      { x: 386, y: 80, hasta: 410, texto: "Cinco zonas\nindependientes" },
    ],
  },
  // Vista cercana bajo la cubierta (referencia Gaggenau) con la cava estilo
  // Thermador: marco de acero, jaladera tubular, bandejas con frente de acero y
  // zoclo de lamas. Panelable (marco de madera).
  "bajo-cubierta": {
    escena: "baja",
    panelable: true,
    cuerpos: [{ x: 196, y: 150, w: 168, h: 226, zocloAcero: true }],
    huecos: [{ x: 196, y: 150, w: 168, h: 214, zona: "cava" }],
    piezas: [puerta(196, 150, 168, 214, "r", { cristal: true, manija: "tubo", panelable: true })],
    etiquetas: [
      { x: 214, y: 128, hasta: 150, texto: "Bajo la cubierta:\n34″ de alto" },
      { x: 236, y: 230, hasta: 150, texto: "Botellas a la mano\nen barra o isla" },
      { x: 240, y: 371, hasta: 150, texto: "Ventila por\nel zoclo frontal" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },
};

export function tieneIlustracion(tipo: string): boolean {
  return tipo in APARATOS;
}

/** Botón "Panelar" del tipo: posición en % de la escena, o null. */
export function panelar(tipo: string): { x: string; y: string } | null {
  const a = APARATOS[tipo];
  if (!a?.panelable) return null;
  // Sobre la hoja derecha de la alacena de la derecha (Carla, 2026-10-19).
  const b = limites(a.cuerpos);
  const x0 = b.x + b.w + 4;
  const x1 = a.real && a.escena === "alta" ? 500 : 520; // fin de la alacena derecha
  const y = a.escena === "baja" && !a.real ? b.y + 40 : 100; // bajo cubierta: sobre el frente
  return { x: `${((x0 + (x1 - x0) * 0.75) / W) * 100}%`, y: `${(y / H) * 100}%` };
}

export default function IlustracionTipo({ tipo }: { tipo: string }) {
  const a = APARATOS[tipo];
  if (!a) return null;
  const b = limites(a.cuerpos);
  // Aire a los lados: una puerta abierta sobresale ~60 % de su ancho (con la
  // perspectiva), así que el encuadre crece con la puerta más ancha.
  const ancha = Math.max(0, ...a.piezas.filter((p) => p.tipo === "puerta").map((p) => p.w));
  const aire = Math.max(54, Math.round(ancha * 0.66 + 14));
  const x0 = Math.max(0, b.x - aire);
  const x1 = Math.min(W, b.x + b.w + aire);
  const { x, y, w, h } = a.recorte ?? { x: x0, y: 18, w: x1 - x0, h: 370 };
  // El recorte viaja como variables CSS: el modal lo usa para encuadrar el aparato.
  const style = {
    "--rx": `${(x / W) * 100}%`,
    "--ry": `${(y / H) * 100}%`,
    "--rw": W / w,
    "--rh": H / h,
    "--rar": `${w} / ${h}`,
  } as CSSProperties;
  return (
    <span className={`ilus ${a.real ? "ilus--real" : "ilus--listones"}${a.antracita ? " ilus--antracita" : ""}`} style={style} data-apilar={a.apilar ? "" : undefined}>
      <Ilustracion a={a} />
    </span>
  );
}
