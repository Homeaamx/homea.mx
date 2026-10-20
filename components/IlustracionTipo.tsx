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

import { Fragment, type CSSProperties, type ReactElement } from "react";

export const W = 560;
export const H = 400;

type Zona = "fresca" | "congelador" | "flex" | "bebidas" | "vino" | "cava" | "vinoteca" | "hielo" | "pared";

export interface Rect {
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
  /** Juntas negras entre frentes (franja entre puertas y cajones, parteluz). */
  juntas?: Rect[];
}

interface Hueco extends Rect {
  zona: Zona;
  /** Cajones de verduras al fondo del compartimento. */
  crisper?: boolean;
}

interface Pieza extends Rect {
  /** "tapa": arcón (Congeladores horizontales), la tapa se levanta al abrir. */
  tipo: "puerta" | "cajon" | "tapa";
  zona?: Zona;
  bisagra?: "l" | "r";
  cristal?: boolean;
  /** true: despachador básico. "francesa": grande, en la mitad baja de la puerta
   *  (referencia KitchenAid 5 puertas). "cruzada": compacto con franja negra
   *  (referencia Mabe 4 puertas). */
  despachador?: boolean | "francesa" | "cruzada";
  /** Pantalla vertical de control junto al canto interior (referencia Mabe). */
  control?: boolean;
  /** Placa de la marca: al pie del cajón o arriba en la puerta. */
  insignia?: boolean;
  /** Jaladera: media (½ alto), larga (casi todo el alto), superior (corta,
   *  arriba), tubo (tubular profesional con soportes, estilo Thermador) o
   *  francesa (larga junto al canto central, ~70 % del alto). En cajones,
   *  "larga" cruza casi todo el frente. */
  manija?: "media" | "larga" | "superior" | "tubo" | "francesa" | "ninguna";
  /** Marco del cristal distinto al de serie (cava de pared: banda alta con pantalla). */
  marco?: { lado: number; arriba: number; abajo: number };
  /** Banda superior con pantalla táctil y jaladera horizontal (cava de pared). */
  pantalla?: boolean;
  /** Lleva capa de panel de carpintería (se enciende con el botón Panelar). */
  panelable?: boolean;
}

export interface Etiqueta {
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
  /** La tarjeta abre ya panelada (tipo "Panelable"); el botón regresa al acero. */
  panelInicial?: boolean;
  /** Panelado fijo, sin botón para volver al acero (Máquinas de hielo · Panelable). */
  panelFijo?: boolean;
  /** Escena libre: lado de la maceta (por omisión, a la izquierda). */
  maceta?: "izq" | "der";
  /** Máquina de hielo modular de piso (referencia Hoshizaki): se dibuja completa. */
  modular?: boolean;
  /** Escena libre con canto lateral y sombra marcada: el aparato se despega del muro. */
  profundidad?: boolean;
  /** Columnas altas antracita con el aparato a media altura (cava de pared). */
  oscuro?: boolean;
  /** De Piso: sin puente ni alacenas a la derecha; lámpara colgante en su lugar. */
  lampara?: boolean;
  /** Escena realista con el aparato de pie en un hueco, sin cubierta encima
   *  (máquina de hielo de piso); sin `real`, de pie frente al muro de listones. */
  libre?: boolean;
  /** Gabinete blanco (arcón doméstico) en vez de acero. */
  blanco?: boolean;
  /** Muro de mármol negro con veta clara sobre la cubierta (en vez de listones). */
  marmol?: boolean;
  /** Cocina exterior: muro de ladrillo, cubierta de granito, gabinetes de acero
   *  y asador (Centros de bebida · Puerta sólida). */
  exterior?: boolean;
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
  /** Acero grafito (más oscuro que el inoxidable), como el Mabe de 4 puertas. */
  grafito?: boolean;
  /** Cajones bajo cubierta: al abrir sale el cajón de abajo, no el de arriba
   *  (Combinado: la fábrica de hielos vive en el cajón congelador inferior). */
  abreAbajo?: boolean;
}

/** Coloca una capa en la escena: unidades de la escena → % del contenedor. */
export function caja({ x, y, w, h }: Rect): CSSProperties {
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

export function Tag({ e, i }: { e: Etiqueta; i: number }) {
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
export function Luces({ xs }: { xs: number[] }) {
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
export function Cinta({ x1, x2, y, h = 46 }: { x1: number; x2: number; y: number; h?: number }) {
  if (x2 - x1 < 4) return null;
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={h} fill="url(#ilus-cinta)" />
      <line x1={x1 + 2} y1={y + 0.5} x2={x2 - 2} y2={y + 0.5} className="i-led-linea" />
    </g>
  );
}

/** Olivo en jarrón (sobre la cubierta, base en y). */
export function Planta2({ x, y }: { x: number; y: number }) {
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
export function Tablas({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y - 15} r={15} className="i-tabla" />
      <circle cx={x + 10} cy={y - 11} r={11} className="i-tabla i-tabla-2" />
      <path d={`M${x - 14} ${y - 7} Q ${x - 2} ${y + 1} ${x + 10} ${y - 7} Z`} className="i-tazon" transform={`translate(-6 0)`} />
    </g>
  );
}

/** Platos apilados y jarrón chico. */
export function Platos({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 2.4, 4.8].map((d) => (
        <rect key={d} x={x - 12} y={y - 2.2 - d} width={24} height={2} rx={1} className="i-plato" />
      ))}
      <path d={`M${x + 16} ${y} Q ${x + 12} ${y - 9} ${x + 18} ${y - 14} L ${x + 22} ${y - 14} Q ${x + 28} ${y - 9} ${x + 24} ${y} Z`} className="i-jarron" />
    </g>
  );
}

/** Par de puertas de carpintería entre x1 y x2: una jaladera por puerta, junto
 *  a la junta que comparten, desde `jy` con largo `jl` (Carla, 2026-10-19). */
export function Puertas({ x1, x2, y1, y2, jy, jl = 20 }: { x1: number; x2: number; y1: number; y2: number; jy: number; jl?: number }) {
  if (x2 - x1 < 20) return null;
  const m = (x1 + x2) / 2;
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-mueble" />
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-modelado" />
      <line x1={m} y1={y1 + 2} x2={m} y2={y2 - 2} className="i-junta" />
      <rect x={m - 8.5} y={jy} width={2.5} height={jl} className="i-jaladera" />
      <rect x={m + 6} y={jy} width={2.5} height={jl} className="i-jaladera" />
    </g>
  );
}

/** Cajones de lado a lado entre x1 y x2; `ys` son sus cortes de arriba abajo.
 *  Una jaladera horizontal centrada por cajón. */
export function Cajones({ x1, x2, ys }: { x1: number; x2: number; ys: number[] }) {
  if (x2 - x1 < 20) return null;
  const y1 = ys[0];
  const y2 = ys[ys.length - 1];
  const jw = Math.min(40, (x2 - x1) * 0.3);
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-mueble" />
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-modelado" />
      {ys.slice(1, -1).map((y) => (
        <line key={y} x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} className="i-junta" />
      ))}
      {ys.slice(0, -1).map((y) => (
        <rect key={y} x={(x1 + x2) / 2 - jw / 2} y={y + 9} width={jw} height={2.5} className="i-jaladera" />
      ))}
    </g>
  );
}

/** Tramo bajo de cocina (alacena + salpicadero + cubierta + base) entre x1 y x2.
 *  Alacena de dos puertas; base de un cajón sobre dos puertas o de tres cajones. */
export function TramoCubierta({
  x1,
  x2,
  decor,
  base = "puertas",
  sinAlacena,
}: {
  x1: number;
  x2: number;
  decor?: "planta" | "tablas" | "platos";
  base?: "puertas" | "cajones";
  /** Sin alacena: el muro sube hasta el plafón. */
  sinAlacena?: boolean;
}) {
  if (x2 - x1 < 10) return null;
  const cx = (x1 + x2) / 2;
  return (
    <g>
      {sinAlacena ? (
        <rect x={x1} y={20} width={x2 - x1} height={216} className="i-muro" />
      ) : (
        <>
          <Puertas x1={x1} x2={x2} y1={20} y2={150} jy={124} />
          <rect x={x1} y={150} width={x2 - x1} height={86} className="i-muro" />
          <Cinta x1={x1} x2={x2} y={150} h={60} />
        </>
      )}
      {decor === "planta" && <Planta2 x={cx} y={236} />}
      {decor === "tablas" && <Tablas x={cx} y={236} />}
      {decor === "platos" && <Platos x={cx - 8} y={236} />}
      <rect x={x1 - 3} y={236} width={x2 - x1 + 6} height={9} className="i-cubierta" />
      <line x1={x1 - 3} y1={236.5} x2={x2 + 3} y2={236.5} className="i-cubierta-canto" />
      {base === "cajones" ? (
        <Cajones x1={x1} x2={x2} ys={[245, 285, 325, 366]} />
      ) : (
        <>
          <Cajones x1={x1} x2={x2} ys={[245, 290]} />
          <Puertas x1={x1} x2={x2} y1={290} y2={366} jy={296} />
        </>
      )}
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
    </g>
  );
}

/** Despensa: dos puertas de piso a techo con jaladera larga. */
export function Despensa({ x1, x2, y1 = 20 }: { x1: number; x2: number; y1?: number }) {
  return (
    <g>
      <Puertas x1={x1} x2={x2} y1={y1} y2={366} jy={150} jl={56} />
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
    </g>
  );
}

/** Empotrado realista (referencia de Carla; gabinetes simplificados 2026-10-19):
 *  tramo bajo · aparato · despensa de piso a techo, con puente liso arriba. */
function EscenaAltaReal({ b }: { b: Rect }) {
  const i2 = b.x - 4;
  const d1 = b.x + b.w + 4;
  return (
    <>
      <TramoCubierta x1={0} x2={i2} decor="planta" />
      <Despensa x1={d1} x2={W} />
      <rect x={b.x} y={20} width={b.w} height={32} className="i-mueble" />
      <rect x={b.x} y={20} width={b.w} height={32} className="i-modelado" />
      <rect x={b.x - 3} y={53} width={b.w + 6} height={323} className="i-nicho" />
      <Luces xs={[i2 / 2, b.x + b.w / 2, (d1 + W) / 2]} />
    </>
  );
}

/** Bajo cubierta realista (Congeladores, Máquinas de hielo, Cajones, 2026-10-19):
 *  tramos de cocina a los lados, alacenas corridas arriba y el aparato bajo la
 *  cubierta o, si es `libre`, de pie en un hueco con el muro a la vista. */
function EscenaBajoCubiertaReal({ b, g, libre }: { b: Rect; g: number; libre?: boolean }) {
  const i2 = b.x - g;
  const d1 = b.x + b.w + g;
  const tope = libre ? b.y - g : 236; // hasta dónde baja el muro sobre el aparato
  return (
    <>
      <TramoCubierta x1={0} x2={i2} decor="planta" />
      <TramoCubierta x1={d1} x2={W} decor="tablas" base="cajones" />
      <Puertas x1={i2} x2={d1} y1={20} y2={150} jy={124} />
      <rect x={i2} y={150} width={d1 - i2} height={tope - 150} className="i-muro" />
      <Cinta x1={i2} x2={d1} y={150} h={Math.min(60, tope - 150)} />
      {libre ? (
        <>
          <rect x={i2} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
          <rect x={b.x + b.w} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        </>
      ) : (
        <>
          <rect x={i2 - 3} y={236} width={d1 - i2 + 6} height={9} className="i-cubierta" />
          <line x1={i2 - 3} y1={236.5} x2={d1 + 3} y2={236.5} className="i-cubierta-canto" />
          <rect x={i2} y={245} width={d1 - i2} height={131} className="i-nicho" />
        </>
      )}
      <Luces xs={[i2 / 2, (i2 + d1) / 2, (d1 + W) / 2]} />
    </>
  );
}

/* ——— Muro de listones de madera (escenas de Diseño, Carla 2026-10-19) ——— */

// Tono de cada listón (negro − / blanco +): la chapa no es pareja, como en obra.
const TONOS = [0.07, -0.04, 0.1, 0.02, -0.06, 0.05, 0, 0.09, -0.03, 0.04, 0.12, -0.05, 0.03];

/** Listones verticales de madera clara entre x1–x2 / y1–y2, con su ranura. */
export function Listones({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
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

/** Aparato de pie frente al muro de listones, sin cocina (arcón, Carla
 *  2026-10-19): zoclo corrido y una planta en maceta tejida a un lado. */
function EscenaListonesLibre({ b, maceta = "izq", profundidad }: { b: Rect; maceta?: "izq" | "der"; profundidad?: boolean }) {
  const mx = maceta === "der" ? Math.min(W - 60, b.x + b.w + 70) : Math.max(60, b.x - 70);
  return (
    <>
      <Listones x1={0} x2={W} y1={0} y2={366} />
      <rect x={0} y={366} width={W} height={10} className="i-zoclo" />
      {/* Sombra difusa en el muro: el aparato queda de pie, separado del fondo.
          Con `profundidad` la sombra se aleja más y se ve el canto lateral. */}
      {profundidad ? (
        <rect x={b.x + 16} y={b.y + 12} width={b.w + 4} height={376 - b.y - 12} rx={8} className="i-sombra-muro i-sombra-muro--lejos" filter="url(#ilus-desenfoque)" />
      ) : (
        <rect x={b.x + 4} y={b.y + 8} width={b.w + 6} height={376 - b.y - 8} rx={6} className="i-sombra-muro" filter="url(#ilus-desenfoque)" />
      )}
      {profundidad && (
        <g>
          <polygon points={`${b.x + b.w},${b.y + 1} ${b.x + b.w + 10},${b.y + 7} ${b.x + b.w + 10},376 ${b.x + b.w},376`} fill="url(#dgm-acero)" />
          <polygon points={`${b.x + b.w},${b.y + 1} ${b.x + b.w + 10},${b.y + 7} ${b.x + b.w + 10},376 ${b.x + b.w},376`} className="i-canto-lateral" />
          <polygon points={`${b.x + 4},376 ${b.x + b.w + 10},376 ${b.x + b.w + 26},372 ${b.x + 14},370`} className="i-sombra-piso" />
        </g>
      )}
      <g transform={`translate(${mx} 376) scale(2.1)`}>
        <Planta2 x={0} y={0} />
      </g>
    </>
  );
}

/** Ladrillo aparente entre x1–x2 / y1–y2: hiladas a junta cuatrapeada con tonos
 *  que varían (Centros de bebida · Puerta sólida, referencia de Carla). */
function Ladrillo({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  const alto = 11;
  const largo = 34;
  const tonos = ["i-ladrillo-1", "i-ladrillo-2", "i-ladrillo-3", "i-ladrillo-4", "i-ladrillo-2", "i-ladrillo-1", "i-ladrillo-3"];
  const piezas: ReactElement[] = [];
  for (let f = 0; y1 + f * alto < y2; f++) {
    const y = y1 + f * alto;
    const ofs = f % 2 ? largo / 2 : 0;
    for (let c = -1; x1 + c * largo + ofs < x2; c++) {
      const x = x1 + c * largo + ofs;
      const xa = Math.max(x1, x + 1);
      const xb = Math.min(x2, x + largo - 1);
      if (xb - xa < 2) continue;
      piezas.push(
        <rect key={`${f}-${c}`} x={xa} y={y + 1} width={xb - xa} height={Math.min(alto - 2, y2 - y - 1)} className={tonos[(f * 3 + c * 5 + 70) % tonos.length]} />,
      );
    }
  }
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} className="i-junta-ladrillo" />
      {piezas}
    </g>
  );
}

/** Cocina exterior (referencia: terraza con muro de ladrillo): ladrillo de
 *  fondo y a la izquierda del mueble, cubierta de granito, gabinetes de acero, asador a la derecha y
 *  piso de deck. El aparato va bajo la cubierta. */
function EscenaExterior({ b }: { b: Rect }) {
  const top = b.y - 4; // canto inferior de la cubierta
  const c0 = b.x - 10; // inicio del mueble
  const asador = 446;
  const gabinete = (x1: number, x2: number, k: string, jal: number[]) => (
    <g key={k}>
      <rect x={x1} y={top + 2} width={x2 - x1} height={364 - top} className="i-gab-ext" />
      <rect x={x1 + 0.5} y={top + 2.5} width={x2 - x1 - 1} height={363 - top} className="i-gab-ext-canto" />
      {jal.map((jx) => (
        <rect key={jx} x={jx} y={top + 24} width={3} height={52} rx={1.5} className="i-manija i-manija-tubo" fill="url(#ilus-cromo)" />
      ))}
    </g>
  );
  return (
    <>
      {/* Muro de ladrillo: sobre la cubierta y, a la izquierda del mueble, hasta
          el piso (referencia de Carla). */}
      <Ladrillo x1={0} x2={W} y1={0} y2={top - 22} />
      <Ladrillo x1={0} x2={c0} y1={top - 22} y2={376} />
      <rect x={c0 - 4} y={top - 22} width={W - c0 + 4} height={22} className="i-granito" />
      {Array.from({ length: 70 }, (_, q) => (
        <circle key={q} cx={c0 + ((q * 37) % (W - c0))} cy={top - 20 + ((q * 13) % 18)} r={0.9} className="i-granito-punto" />
      ))}
      <line x1={c0 - 4} y1={top - 21.5} x2={W} y2={top - 21.5} className="i-cubierta-canto" />
      <Planta2 x={c0 + 40} y={top - 22} />
      <Tablas x={c0 + 210} y={top - 22} />
      {/* Gabinetes de acero (terraza) y asador */}
      {gabinete(b.x + b.w + 4, asador - 3, "g1", [asador - 30])}
      {gabinete(asador, W, "g3", [])}
      <rect x={asador + 4} y={top - 92} width={W - asador} height={98} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={asador + 4} y={top - 92} width={W - asador} height={98} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
      <rect x={asador + 14} y={top - 60} width={W - asador} height={4} rx={2} fill="url(#ilus-cromo-h)" className="i-manija" />
      <rect x={asador + 4} y={top - 34} width={W - asador} height={1.2} className="i-lama" />
      {[asador + 40, asador + 80].map((kx) => (
        <circle key={kx} cx={kx} cy={top - 18} r={7} className="i-perilla-roja" />
      ))}
      <rect x={c0} y={top} width={W - c0} height={4} className="i-nicho" />
      <rect x={b.x - 4} y={top} width={b.w + 8} height={376 - top} className="i-nicho" />
      <rect x={c0} y={top + 2} width={4} height={364 - top} className="i-gab-ext" />
      <rect x={c0} y={366} width={W - c0} height={10} className="i-zoclo-ext" />
      {/* Deck: tablas del piso. */}
      {Array.from({ length: 14 }, (_, q) => (
        <line key={q} x1={q * 42 + 10} y1={377} x2={q * 42 - 6} y2={400} className="i-deck" />
      ))}
    </>
  );
}

/** Columnas altas antracita (referencia Smeg/Gaggenau): paneles de piso a techo
 *  con sus juntas y el aparato empotrado a media altura en la columna central. */
function EscenaColumnasOscuras({ b }: { b: Rect }) {
  const c1 = b.x - 34;
  const c2 = b.x + b.w + 34;
  return (
    <>
      <rect x={0} y={0} width={W} height={376} fill="url(#ilus-antracita)" />
      <ellipse cx={W / 2} cy={b.y + b.h / 2} rx={260} ry={220} fill="url(#ilus-halo-gris)" />
      {[c1, c2].map((x) => (
        <line key={x} x1={x} y1={0} x2={x} y2={376} className="i-junta-oscura" />
      ))}
      <line x1={c1} y1={b.y - 3} x2={c2} y2={b.y - 3} className="i-junta-oscura" />
      <line x1={c1} y1={b.y + b.h + 3} x2={c2} y2={b.y + b.h + 3} className="i-junta-oscura" />
      <rect x={b.x - 2} y={b.y - 2} width={b.w + 4} height={b.h + 4} className="i-nicho" />
      <rect x={0} y={366} width={W} height={10} className="i-zoclo" />
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
function EscenaListonesBaja({ b, libre, g = 4, marmol }: { b: Rect; libre?: boolean; g?: number; marmol?: boolean }) {
  // Libre (Centros de bebida · De piso): el aparato llega a la altura de la
  // cubierta, que se corta a sus lados; se ve la holgura.
  const top = libre ? 146 : b.y - 4; // canto inferior de la cubierta
  const i2 = b.x - g;
  const d1 = b.x + b.w + g;
  const frente = (x1: number, x2: number, k: string) => (
    <g key={k}>
      <rect x={x1} y={top + 2} width={x2 - x1} height={366 - top - 2} className="i-mueble" />
      <rect x={x1} y={top + 2} width={x2 - x1} height={366 - top - 2} className="i-modelado" />
      <rect x={x1 + 0.5} y={top + 2.5} width={x2 - x1 - 1} height={366 - top - 3} className="i-panel-canto" />
    </g>
  );
  return (
    <>
      {marmol ? (
        <rect x={0} y={0} width={W} height={top - 22} fill="url(#ilus-marmol-negro)" />
      ) : (
        <Listones x1={0} x2={W} y1={0} y2={top - 22} />
      )}
      <Copas x={22} y={top - 22} />
      <Aceitunas x={472} y={top - 22} />
      {(libre ? [[0, i2], [d1, W]] : [[0, W]]).map(([x1, x2]) => (
        <g key={x1}>
          <rect x={x1} y={top - 22} width={x2 - x1} height={22} className="i-cubierta" />
          <line x1={x1} y1={top - 21.5} x2={x2} y2={top - 21.5} className="i-cubierta-canto" />
          <rect x={x1} y={top} width={x2 - x1} height={4} className="i-nicho" />
        </g>
      ))}
      {/* Luz que baña los frentes desde la cubierta. */}
      {frente(0, i2, "i")}
      {frente(d1, 360 + (W - 360) / 2, "d1")}
      {frente(360 + (W - 360) / 2 + 3, W, "d2")}
      <rect x={0} y={top + 2} width={W} height={70} fill="url(#ilus-cinta)" opacity={0.22} />
      {libre ? (
        <>
          <rect x={i2} y={top - 22} width={g} height={376 - top + 22} className="i-nicho" />
          <rect x={b.x + b.w} y={top - 22} width={g} height={376 - top + 22} className="i-nicho" />
        </>
      ) : (
        <rect x={i2} y={top} width={d1 - i2} height={376 - top} className="i-nicho" />
      )}
      <rect x={0} y={366} width={W} height={10} className="i-zoclo" />
    </>
  );
}

/** Cocina con cubierta: el aparato va bajo ella (bajo cubierta) o, si es alto,
 *  de pie entre dos tramos con `holgura` a los lados (De Piso, Counter Depth). */
/** Lámpara colgante: cable desde el plafón, campana negra con filo de latón y
 *  su cono de luz cálida (De Piso, Carla 2026-10-19). */
export function Lampara({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 18} rx={84} ry={210} fill="url(#ilus-cono)" />
      <line x1={x} y1={20} x2={x} y2={y} className="i-lampara-cable" />
      <path d={`M${x - 22} ${y + 18} Q ${x - 20} ${y} ${x} ${y} Q ${x + 20} ${y} ${x + 22} ${y + 18} Z`} className="i-lampara-campana" />
      <line x1={x - 22} y1={y + 18} x2={x + 22} y2={y + 18} className="i-lampara-filo" />
      <ellipse cx={x} cy={y + 19} rx={9} ry={2.6} className="i-foco" />
    </g>
  );
}

function EscenaBaja({
  b,
  holgura = 2,
  real,
  planta,
  lampara,
}: {
  b: Rect;
  holgura?: number;
  real?: boolean;
  planta?: Aparato["planta"];
  lampara?: boolean;
}) {
  const alto = b.y < 236;
  const g = holgura;
  const i2 = b.x - g;
  const d1 = b.x + b.w + g;
  if (real && alto && planta === "counter") {
    // Counter Depth (foto de referencia de Carla, 2026-10-19): el aparato queda
    // enmarcado por dos costados y un puente; despensa alta a la derecha.
    const c = 13; // grueso del costado
    return (
      <>
        <TramoCubierta x1={0} x2={i2 - c} decor="planta" base="cajones" />
        <Platos x={i2 - c - 40} y={236} />
        <Despensa x1={d1 + c} x2={W} />
        {[i2 - c, d1].map((x) => (
          <g key={x}>
            <rect x={x} y={20} width={c} height={356} className="i-mueble" />
            <rect x={x} y={20} width={c} height={356} className="i-modelado" />
            <rect x={x + 0.5} y={20.5} width={c - 1} height={355} className="i-panel-canto" />
          </g>
        ))}
        <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-mueble" />
        <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-modelado" />
        <rect x={i2} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={b.x + b.w} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={i2} y={b.y - g} width={d1 - i2} height={g} className="i-nicho" />
        <Luces xs={[(i2 - c) / 2, (i2 + d1) / 2, (d1 + c + W) / 2]} />
      </>
    );
  }
  if (real && alto) {
    // Realista: tramos de cubierta de lado a lado, alacena corta sobre el aparato.
    return (
      <>
        <TramoCubierta x1={0} x2={i2} decor="planta" />
        <TramoCubierta x1={d1} x2={W} decor="platos" base="cajones" sinAlacena={lampara} />
        <Platos x={i2 - 40} y={236} />
        <Tablas x={W - 46} y={236} />
        {lampara ? (
          // Sin puente: el muro sigue arriba del aparato.
          <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-muro" />
        ) : (
          <>
            <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-mueble" />
            <rect x={i2} y={20} width={d1 - i2} height={b.y - g - 20} className="i-modelado" />
          </>
        )}
        <rect x={i2} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={b.x + b.w} y={b.y - g} width={g} height={376 - b.y + g} className="i-nicho" />
        <rect x={i2} y={b.y - g} width={d1 - i2} height={g} className="i-nicho" />
        <Luces xs={lampara ? [i2 / 2, (i2 + d1) / 2] : [i2 / 2, (i2 + d1) / 2, (d1 + W) / 2]} />
        {lampara && <Lampara x={(d1 + W) / 2} y={112} />}
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
  hielo: [],
  pared: [],
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

/** Máquina de hielo: evaporador con moldes arriba, cubos cayendo y el depósito
 *  lleno de hielo con su pala (Máquinas de hielo, 2026-10-19). */
function Hielo({ o }: { o: Rect }) {
  const lado = 7;
  const paso = 8;
  const binY = o.y + o.h * 0.42;
  const fondo = o.y + o.h - 4;
  const cols = Math.max(2, Math.floor((o.w - 10) / paso));
  const filas = Math.max(2, Math.floor((fondo - binY - 10) / paso));
  const x0 = o.x + (o.w - cols * paso) / 2 + 0.5;
  const cubos: ReactElement[] = [];
  for (let f = 0; f < filas; f++)
    for (let c = 0; c < cols; c++) {
      // El montón sube al centro: las orillas pierden la fila de arriba.
      if (f === filas - 1 && (c === 0 || c === cols - 1)) continue;
      const jit = ((c * 7 + f * 3) % 5) - 2;
      cubos.push(
        <rect key={`${f}-${c}`} x={x0 + c * paso + jit * 0.4} y={fondo - (f + 1) * paso + (jit % 2)} width={lado} height={lado} rx={1.6} className="i-hielo" />,
      );
    }
  return (
    <g>
      <rect x={o.x + 4} y={o.y + 6} width={o.w - 8} height={12} rx={1} className="i-evaporador" />
      {Array.from({ length: Math.floor((o.w - 12) / 6) }, (_, q) => (
        <line key={q} x1={o.x + 8 + q * 6} y1={o.y + 8} x2={o.x + 8 + q * 6} y2={o.y + 16} className="i-molde" />
      ))}
      {[0.3, 0.55, 0.75].map((f, q) => (
        <rect key={q} x={o.x + o.w * f} y={o.y + 26 + q * 11} width={6} height={6} rx={1.4} className="i-hielo" />
      ))}
      <rect x={o.x + 3} y={binY} width={o.w - 6} height={fondo - binY + 2} rx={2} className="i-deposito" />
      {cubos}
      <path d={`M${o.x + o.w - 22} ${binY - 2} l 12 -4 l 3 9 l -12 4 z M${o.x + o.w - 10} ${binY - 6} l 6 -9`} className="i-pala" />
    </g>
  );
}

/** Centro de bebidas (referencia Sub-Zero de Carla, 2026-10-19): interior
 *  oscuro con luz LED cálida arriba; repisa de botellas altas (agua, jugo,
 *  espumoso), repisa con frente de madera para latas y botellas verdes, y
 *  cajón de madera abajo con botellas acostadas. */
function Bebidas({ o, dx }: { o: Rect; dx: number }) {
  const fondo = { x: o.x + dx, y: o.y + 8, w: o.w - 2 * dx, h: o.h - 12 };
  const y1 = o.y + o.h * 0.44; // repisa de botellas altas
  const y2 = o.y + o.h * 0.73; // repisa de latas; abajo el cajón
  const piso = o.y + o.h - 2;
  const x0 = o.x + 7;
  const ancho = o.w - 14;
  // Fila centrada: piezas [ancho, dibujo(x)] con su separación.
  const fila = (piezas: [number, (x: number) => ReactElement][], sep: number) => {
    const total = piezas.reduce((t, [w]) => t + w, 0) + sep * (piezas.length - 1);
    let x = x0 + Math.max(0, (ancho - total) / 2);
    return piezas.map(([w, dib], k) => {
      const el = <g key={k}>{dib(x)}</g>;
      x += w + sep;
      return el;
    });
  };
  const alta = (tipo: "agua" | "jugo" | "espumoso") => {
    const h = Math.min(66, y1 - o.y - 16);
    return [
      11,
      (x: number) => {
        const cuello = h * 0.3;
        const cuerpo = `i-beb-${tipo}`;
        return (
          <>
            <rect x={x} y={y1 - h + cuello} width={11} height={h - cuello} rx={3} className={cuerpo} />
            <rect x={x + 3.5} y={y1 - h} width={4} height={cuello + 2} rx={1} className={tipo === "espumoso" ? "i-beb-oro" : cuerpo} />
            <rect x={x} y={y1 - h * 0.48} width={11} height={h * 0.26} className={`i-beb-etq-${tipo}`} />
          </>
        );
      },
    ] as [number, (x: number) => ReactElement];
  };
  const lata = (color: "amarilla" | "turquesa") => {
    const h = Math.min(24, (y2 - y1) * 0.45);
    return [
      9,
      (x: number) => (
        <>
          <rect x={x} y={y2 - 4 - h} width={9} height={h} rx={1.5} className={`i-beb-lata-${color}`} />
          <rect x={x} y={y2 - 4 - h * 0.62} width={9} height={h * 0.3} className="i-beb-lata-banda" />
          <rect x={x + 0.5} y={y2 - 4 - h} width={8} height={1.6} rx={0.8} className="i-beb-lata-tapa" />
        </>
      ),
    ] as [number, (x: number) => ReactElement];
  };
  const verde = () => {
    const h = Math.min(44, y2 - y1 - 10);
    return [
      8,
      (x: number) => (
        <>
          <rect x={x} y={y2 - 4 - h * 0.7} width={8} height={h * 0.7} rx={2.5} className="i-beb-verde" />
          <rect x={x + 2.5} y={y2 - 4 - h} width={3} height={h * 0.32} rx={1} className="i-beb-verde" />
          <rect x={x} y={y2 - 4 - h * 0.42} width={8} height={h * 0.18} className="i-beb-etq-verde" />
        </>
      ),
    ] as [number, (x: number) => ReactElement];
  };
  const acostada = () => [
    12,
    (x: number) => (
      <>
        <rect x={x} y={y2 + 8} width={12} height={piso - y2 - 18} rx={5} className="i-beb-verde" />
        <ellipse cx={x + 6} cy={piso - 12} rx={4.6} ry={3.4} className="i-beb-tapa-clara" />
      </>
    ),
  ] as [number, (x: number) => ReactElement];
  return (
    <g>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} className="i-beb-lado" />
      <rect x={fondo.x} y={fondo.y} width={fondo.w} height={fondo.h} className="i-beb-fondo" />
      {/* Luz LED cálida bajo el techo. */}
      <rect x={o.x} y={o.y} width={o.w} height={o.h * 0.5} fill="url(#ilus-cinta)" opacity={0.32} />
      <rect x={o.x + 5} y={o.y + 3} width={o.w - 10} height={2.2} rx={1.1} className="i-beb-led" />
      {fila([alta("agua"), alta("agua"), alta("jugo"), alta("jugo"), alta("espumoso"), alta("espumoso")], 4)}
      <rect x={o.x + 2} y={y1} width={o.w - 4} height={2.5} className="i-beb-repisa" />
      {fila([lata("amarilla"), lata("amarilla"), lata("turquesa"), lata("turquesa"), lata("turquesa"), verde(), verde(), verde()], 1.5)}
      <rect x={o.x + 2} y={y2 - 4} width={o.w - 4} height={6} className="i-repisa-madera" />
      {fila([acostada(), acostada(), acostada(), acostada()], 14)}
      <rect x={o.x + 2} y={piso - 9} width={o.w - 4} height={9} className="i-repisa-madera" />
    </g>
  );
}

/** Cava de pared (referencia Smeg): interior negro, tres filas de botellas
 *  acostadas vistas de frente —vidrio oscuro y corcho— sobre repisas de madera. */
function BodegaPared({ o }: { o: Rect }) {
  const filas = 3;
  const alto = o.h / filas;
  const n = Math.max(3, Math.floor((o.w - 16) / 24));
  const paso = (o.w - 16) / n;
  const r = Math.min(alto * 0.34, paso * 0.42);
  return (
    <g>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} className="i-bodega-fondo" />
      {Array.from({ length: filas }, (_, f) => {
        const cy = o.y + alto * f + alto * 0.48;
        return (
          <g key={f}>
            {Array.from({ length: n }, (_, q) => {
              const cx = o.x + 8 + paso * (q + 0.5);
              return (
                <g key={q}>
                  <circle cx={cx} cy={cy} r={r} className="i-bodega-vidrio" />
                  <circle cx={cx} cy={cy} r={r * 0.82} className="i-fondo-aro" />
                  <circle cx={cx} cy={cy} r={r * 0.42} className="i-bodega-corcho" />
                </g>
              );
            })}
            {f < filas - 1 && <rect x={o.x + 2} y={o.y + alto * (f + 1) - 2} width={o.w - 4} height={3} className="i-repisa-madera" />}
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
  const sinRepisas =
    r.zona === "vino" || r.zona === "cava" || r.zona === "vinoteca" || r.zona === "hielo" || r.zona === "bebidas" || r.zona === "pared";
  const niveles = sinRepisas ? 0 : Math.max(1, Math.round(util / 54));
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
      {r.zona === "hielo" && <Hielo o={o} />}
      {r.zona === "bebidas" && <Bebidas o={o} dx={dx} />}
      {r.zona === "pared" && <BodegaPared o={o} />}

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
const huecoCristal = (w: number, h: number, m = MARCO) =>
  `M0.75 0.75H${w - 0.75}V${h - 0.75}H0.75Z M${m.lado} ${m.arriba}V${h - m.abajo}H${w - m.lado}V${m.arriba}Z`;

/** Despachador de agua y hielo en la puerta. "francesa" (KitchenAid 5 puertas):
 *  grande, en la mitad baja, bisel cromado, nicho negro con boquilla, palanca y
 *  charola. "cruzada" (Mabe 4 puertas): compacto, franja negra arriba y nicho
 *  gris con paleta cromada. */
function Despachador({ w, h, tipo }: { w: number; h: number; tipo: "francesa" | "cruzada" }) {
  if (tipo === "francesa") {
    const x = w * 0.14;
    const y = h * 0.46;
    const bw = w * 0.6;
    const bh = h * 0.46;
    const cx = x + bw / 2;
    return (
      <g>
        <rect x={x - 0.5} y={y + 1.5} width={bw + 1} height={bh} rx={2.5} className="i-manija-sombra" />
        <rect x={x} y={y} width={bw} height={bh} rx={2.5} className="i-desp-bisel" />
        <rect x={x + 2.4} y={y + 2.4} width={bw - 4.8} height={bh - 4.8} rx={1.5} className="i-desp-negro" />
        <rect x={x + 5} y={y + 5} width={bw - 10} height={5} rx={1} className="i-desp-control" />
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <circle key={f} cx={x + 5 + (bw - 10) * f} cy={y + 7.5} r={0.7} className="i-desp-punto" />
        ))}
        <rect x={x + 5} y={y + 13} width={bw - 10} height={bh - 24} rx={1} className="i-desp-nicho" />
        <rect x={cx - 4} y={y + 13} width={8} height={bh * 0.42} rx={3} className="i-desp-boquilla" />
        <rect x={cx - 2} y={y + 13 + bh * 0.42 - 3} width={4} height={5} rx={1.5} className="i-desp-palanca" />
        <rect x={x + 5} y={y + bh - 10} width={bw - 10} height={4.5} rx={1} className="i-desp-charola" />
        {Array.from({ length: Math.floor((bw - 14) / 4) }, (_, q) => (
          <line key={q} x1={x + 8 + q * 4} y1={y + bh - 9} x2={x + 8 + q * 4} y2={y + bh - 6.5} className="i-desp-rejilla" />
        ))}
      </g>
    );
  }
  const x = w * 0.33;
  const y = h * 0.49;
  const bw = w * 0.34;
  const bh = h * 0.22;
  const cx = x + bw / 2;
  return (
    <g>
      <rect x={x - 0.5} y={y + 1.2} width={bw + 1} height={bh} rx={2} className="i-manija-sombra" />
      <rect x={x} y={y} width={bw} height={bh} rx={2} className="i-desp-bisel" />
      <rect x={x + 1.6} y={y + 1.6} width={bw - 3.2} height={bh * 0.17} rx={0.8} className="i-desp-negro" />
      <rect x={cx - bw * 0.22} y={y + 1.6 + bh * 0.07} width={bw * 0.44} height={0.9} className="i-desp-punto" />
      <rect x={x + 4} y={y + bh * 0.24} width={bw - 8} height={bh * 0.68} rx={1} className="i-desp-nicho-claro" />
      <rect x={cx - 2.5} y={y + bh * 0.24} width={5} height={bh * 0.1} className="i-desp-boquilla" />
      <rect x={cx - bw * 0.17} y={y + bh * 0.36} width={bw * 0.34} height={bh * 0.4} rx={1.5} className="i-desp-paleta" />
      <rect x={x + 4} y={y + bh * 0.84} width={bw - 8} height={bh * 0.08} className="i-desp-charola" />
    </g>
  );
}

/** Pantalla vertical de control (referencia Mabe 4 puertas), junto al canto
 *  central de la puerta: cifra de temperatura arriba e íconos debajo. */
function PantallaControl({ w, h, l }: { w: number; h: number; l: boolean }) {
  const pw = w * 0.09;
  const x = l ? w * 0.85 - pw : w * 0.15;
  const y = h * 0.21;
  const ph = h * 0.26;
  return (
    <g>
      <rect x={x} y={y} width={pw} height={ph} rx={1.5} className="i-control" />
      <rect x={x + pw * 0.22} y={y + 3} width={pw * 0.24} height={3.6} rx={0.4} className="i-control-cifra" />
      <rect x={x + pw * 0.54} y={y + 3} width={pw * 0.24} height={3.6} rx={0.4} className="i-control-cifra" />
      {[0.34, 0.5, 0.64, 0.78].map((f) => (
        <rect key={f} x={x + pw * 0.3} y={y + ph * f} width={pw * 0.4} height={1.4} rx={0.6} className="i-control-icono" />
      ))}
    </g>
  );
}

function FrentePuerta({ p }: { p: Pieza }) {
  const { w, h } = p;
  const m = p.marco ?? MARCO;
  const l = p.bisagra !== "r";
  const hx = l ? w - 10 : 6;
  let len = Math.min(108, h * 0.6);
  let hy = h > 200 ? h * 0.42 - len / 2 : h / 2 - len / 2;
  if (p.manija === "media") [len, hy] = [h * 0.5, h * 0.45 - h * 0.25];
  if (p.manija === "larga") [len, hy] = [h * 0.86, h * 0.07];
  if (p.manija === "superior") [len, hy] = [h * 0.3, h * 0.1];
  if (p.manija === "francesa") [len, hy] = [h * 0.72, h * 0.12];
  const tubo = p.manija === "tubo";
  if (tubo) [len, hy] = [h * 0.8, h * 0.1];
  return (
    <svg className="ilus-cara" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {p.cristal ? (
        <>
          <path d={huecoCristal(w, h, m)} fillRule="evenodd" fill="url(#dgm-acero)" className="i-panel i-marco-cristal" />
          <rect x={m.lado} y={m.arriba} width={w - 2 * m.lado} height={h - m.arriba - m.abajo} className="i-cristal" />
          <polygon
            points={`${w * 0.32},${m.arriba} ${w * 0.55},${m.arriba} ${w * 0.22},${h - m.abajo} ${m.lado},${h - m.abajo} ${m.lado},${h * 0.72}`}
            className="i-reflejo"
          />
        </>
      ) : (
        <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#dgm-acero)" className="i-panel" />
      )}
      {/* Modelado del acero (luz y bandas); en vidrio solo sobre el marco. */}
      {p.cristal ? (
        <>
          <path d={huecoCristal(w, h, m)} fillRule="evenodd" fill="url(#ilus-acero-luz)" className="i-acero-luz" />
          <path d={huecoCristal(w, h, m)} fillRule="evenodd" fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
        </>
      ) : (
        <>
          <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
          <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
        </>
      )}
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} className="i-tinte" />
      {(p.despachador === "francesa" || p.despachador === "cruzada") && <Despachador w={w} h={h} tipo={p.despachador} />}
      {p.control && <PantallaControl w={w} h={h} l={l} />}
      {p.insignia && <rect x={l ? w * 0.08 : w * 0.78} y={9} width={w * 0.14} height={2.4} rx={1.2} className="i-logo-puerta" />}
      {p.despachador === true && (
        <g>
          <rect x={w * 0.2} y={h * 0.26} width={w * 0.6} height={40} rx={2} className="i-despachador" />
          <rect x={w * 0.3} y={h * 0.26 + 9} width={w * 0.4} height={24} rx={1.5} className="i-hueco" />
          <rect x={w * 0.28} y={h * 0.26 + 3} width={w * 0.44} height={3} rx={1} className="i-pantalla" />
        </g>
      )}
      {p.pantalla && (
        // Cava de pared (referencia Smeg): pantalla táctil al centro de la banda
        // alta, jaladera horizontal a la izquierda y logotipo abajo.
        <g>
          <rect x={w / 2 - 22} y={5} width={44} height={m.arriba - 10} rx={1.5} className="i-pantalla-negra" />
          <text x={w / 2} y={m.arriba / 2 + 2.5} textAnchor="middle" className="i-pantalla-txt">
            − 12° +
          </text>
          <rect x={w * 0.1} y={m.arriba / 2 + 2} width={22} height={3.2} rx={1.5} className="i-manija-sombra" />
          <rect x={w * 0.1} y={m.arriba / 2} width={22} height={3.2} rx={1.5} className="i-manija i-manija-h" />
          <rect x={w / 2 - 10} y={h - m.abajo / 2 - 1} width={20} height={2} rx={1} className="i-logo-cava" />
        </g>
      )}
      {p.manija === "ninguna" ? null : tubo ? (
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
          <path d={huecoCristal(w, h, m)} fillRule="evenodd" className="i-mueble" />
          <path d={huecoCristal(w, h, m)} fillRule="evenodd" className="i-modelado" />
          <rect x={m.lado - 1} y={m.arriba - 1} width={w - 2 * m.lado + 2} height={h - m.arriba - m.abajo + 2} className="i-panel-canto" />
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
  const m = p.marco ?? MARCO;
  if (p.cristal) {
    return (
      <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={huecoCristal(w, h, m)} fillRule="evenodd" fill="url(#ilus-forro)" className="i-panel i-marco-cristal" />
        <rect x={m.lado} y={m.arriba} width={w - 2 * m.lado} height={h - m.arriba - m.abajo} className="i-cristal" />
      </svg>
    );
  }
  // Máquina de hielo y cava: contrapuerta lisa y aislada, sin anaqueles.
  if (p.zona === "hielo" || p.zona === "vinoteca" || p.zona === "bebidas") {
    return (
      <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-forro)" className="i-panel" />
        <rect x={5} y={5} width={w - 10} height={h - 10} rx={4} className="i-empaque" />
      </svg>
    );
  }
  // Con despachador, la contrapuerta lleva la caja de la fábrica de hielo arriba.
  const ini = p.despachador ? h * 0.56 : 12;
  const n = Math.max(1, Math.floor((h - ini - 12) / 48));
  const paso = (h - ini - 12) / n;
  const conjuntos: Objeto[][] = [["botella", "frasco", "jarra"], ["frasco", "caja"], ["jarra", "botella", "frasco"]];
  return (
    <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-forro)" className="i-panel" />
      <rect x={5} y={5} width={w - 10} height={h - 10} rx={4} className="i-empaque" />
      {p.despachador && (
        <g>
          <rect x={10} y={h * 0.1} width={w - 20} height={h * 0.42} rx={4} className="i-hielera" />
          <rect x={16} y={h * 0.14} width={w - 32} height={h * 0.12} rx={2} className="i-hielera-ventana" />
          <rect x={16} y={h * 0.32} width={w - 32} height={h * 0.16} rx={2} className="i-hielera-tolva" />
        </g>
      )}
      {Array.from({ length: n }, (_, k) => {
        const by = ini + paso * (k + 1) - 18;
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
  const m = p.manija === "larga" ? 0.08 : 0.19; // margen de la jaladera a cada lado
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} className="i-tinte" />
      <rect x={w * m} y={14} width={w * (1 - 2 * m)} height={4.5} rx={2.2} className="i-manija-sombra" />
      <rect x={w * m} y={11} width={w * (1 - 2 * m)} height={4.5} rx={2.2} className="i-manija i-manija-h" />
      <rect x={w * m + 3} y={8} width={3} height={5} className="i-manija" />
      <rect x={w * (1 - m) - 6} y={8} width={3} height={5} className="i-manija" />
      {p.insignia && (
        <g>
          <rect x={w / 2 - 10} y={h - 11} width={20} height={5.5} rx={0.8} className="i-insignia" />
          <rect x={w / 2 - 6.5} y={h - 8.9} width={13} height={1.3} rx={0.5} className="i-insignia-tx" />
        </g>
      )}
      {p.panelable && (
        // Mismo panel que las puertas: madera, ranuras y jaladera dorada horizontal.
        <g className="i-panelado">
          <rect x={0} y={0} width={w} height={h} className="i-mueble" />
          <rect x={0} y={0} width={w} height={h} className="i-modelado" />
          {Array.from({ length: Math.floor(w / 15) }, (_, k) => (
            <line key={k} x1={(k + 1) * 15} y1={0} x2={(k + 1) * 15} y2={h} className="i-ranura i-ranura-panel" />
          ))}
          <rect x={1} y={1} width={w - 2} height={h - 2} className="i-panel-canto" />
          <rect x={w * 0.2} y={10} width={w * 0.6} height={3.5} rx={1.5} className="i-jaladera-oro" />
        </g>
      )}
    </svg>
  );
}

/** Arcón: frente de acero fijo y la franja de la tapa, que sube al abrir. */
const TAPA = 70; // alto de la cara interior de la tapa ya levantada
function FrenteArcon({ p, blanco }: { p: Pieza; blanco?: boolean }) {
  const { w, h } = p;
  const t = 16;
  if (blanco) {
    // Arcón doméstico blanco (referencia de Carla): manija al centro de la tapa,
    // control abajo a la derecha y patas.
    const cuerpo = h - 6;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ overflow: "visible" }}>
        <rect x={0.75} y={t} width={w - 1.5} height={cuerpo - t} className="i-blanco" />
        <rect x={0.75} y={t} width={w - 1.5} height={cuerpo - t} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
        <rect x={0.75} y={t} width={w - 1.5} height={cuerpo - t} className="i-blanco-canto" />
        <rect x={w - 24} y={cuerpo - 30} width={14} height={18} rx={2} className="i-arcon-control" />
        <circle cx={w - 17} cy={cuerpo - 24} r={2.6} className="i-arcon-perilla" />
        <circle cx={w - 19.5} cy={cuerpo - 16.5} r={1.1} className="i-led-verde" />
        <circle cx={w - 14.5} cy={cuerpo - 16.5} r={1.1} className="i-led-rojo" />
        {[8, w - 16].map((x) => (
          <rect key={x} x={x} y={cuerpo} width={8} height={6} rx={1.5} className="i-arcon-pata" />
        ))}
        <g className="ilus-tapa-frente">
          <rect x={0.75} y={0.75} width={w - 1.5} height={t} className="i-blanco" />
          <rect x={0.75} y={0.75} width={w - 1.5} height={t} className="i-blanco-canto" />
          <rect x={w * 0.42} y={t - 5} width={w * 0.16} height={4} rx={2} className="i-manija-sombra" />
          <rect x={w * 0.42} y={t - 7} width={w * 0.16} height={4} rx={2} className="i-arcon-manija" />
        </g>
      </svg>
    );
  }
  const acero = (y: number, alto: number) => (
    <>
      <rect x={0.75} y={y} width={w - 1.5} height={alto} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={0.75} y={y} width={w - 1.5} height={alto} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
      <rect x={0.75} y={y} width={w - 1.5} height={alto} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
    </>
  );
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ overflow: "visible" }}>
      {acero(t, h - t - 0.75)}
      <rect x={w * 0.08} y={h - 26} width={w * 0.14} height={8} rx={1} className="i-hueco" />
      <g className="ilus-tapa-frente">
        {acero(0.75, t)}
        <rect x={w * 0.3} y={t - 4} width={w * 0.4} height={3} rx={1.5} className="i-manija-sombra" />
        <rect x={w * 0.3} y={t - 6} width={w * 0.4} height={3} rx={1.5} className="i-manija i-manija-h" />
      </g>
    </svg>
  );
}

/** Máquina de hielo modular de piso (referencia Hoshizaki de Carla, 2026-10-19):
 *  fábrica de acero arriba, puerta corrediza negra del depósito, rejilla y patas.
 *  Al abrir, la puerta sube dentro de la máquina y se ve el hielo. */
function MaquinaModular({ w, h }: { w: number; h: number }) {
  const acero = (x: number, y: number, ancho: number, alto: number) => (
    <>
      <rect x={x} y={y} width={ancho} height={alto} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={x} y={y} width={ancho} height={alto} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
    </>
  );
  const cubos: ReactElement[] = [];
  for (let f = 0; f < 3; f++)
    for (let c = 0; c < 16; c++)
      cubos.push(<rect key={`${f}-${c}`} x={10 + c * 8 + (f % 2) * 4} y={114 - f * 7} width={6.5} height={6.5} rx={1.5} className="i-hielo" />);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {/* Boca del depósito con hielo (visible al subir la puerta). */}
      <rect x={8} y={88} width={w - 16} height={34} className="i-hueco" />
      {cubos}
      <g className="ilus-modular-puerta">
        <polygon points={`0,122 ${w},122 ${w - 4},90 4,90`} className="i-modular-negro" />
        <line x1={5} y1={91} x2={w - 5} y2={91} className="i-modular-filo" />
      </g>
      {/* Fábrica de hielo: acero, logotipo y ventila lateral. */}
      {acero(6, 6, w - 12, 76)}
      <circle cx={w - 22} cy={20} r={6} className="i-modular-logo" />
      <rect x={w - 12} y={12} width={6} height={64} className="i-modular-negro" />
      {Array.from({ length: 10 }, (_, q) => (
        <line key={q} x1={w - 11} y1={16 + q * 6} x2={w - 7} y2={16 + q * 6} className="i-lama" />
      ))}
      <rect x={0} y={0} width={w} height={6} rx={1} className="i-modular-negro" />
      <rect x={2} y={82} width={w - 4} height={8} rx={2} className="i-modular-negro" />
      {/* Depósito, rejilla y patas. */}
      {acero(6, 122, w - 12, 62)}
      <rect x={4} y={184} width={w - 8} height={40} className="i-modular-negro" />
      {Array.from({ length: 6 }, (_, q) => (
        <line key={q} x1={8} y1={189 + q * 6} x2={w - 8} y2={189 + q * 6} className="i-modular-lama" />
      ))}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={4 + (w - 8) * f} y1={186} x2={4 + (w - 8) * f} y2={222} className="i-modular-lama" />
      ))}
      {[40, w - 48].map((x) => (
        <polygon key={x} points={`${x},224 ${x + 8},224 ${x + 7},242 ${x + 1},242`} className="i-modular-pata-atras" />
      ))}
      {[8, w - 20].map((x) => (
        <polygon key={x} points={`${x},224 ${x + 12},224 ${x + 10},${h} ${x + 2},${h}`} className="i-modular-negro" />
      ))}
    </svg>
  );
}

/** Canasta del cajón: aparece sobre el frente cuando el cajón sale. */
function Canasta({ p, z }: { p: Pieza; z?: number }) {
  const w = p.w - 8;
  const fria = p.zona === "congelador";
  const cosas: ReactElement[] = [];
  let x = 10;
  let j = 0;
  if (p.zona === "hielo") {
    // Fábrica de hielos al fondo a la izquierda y el depósito lleno de cubos.
    cosas.push(<rect key="f" x={10} y={2} width={30} height={13} rx={2} className="i-fabrica" />);
    cosas.push(<rect key="fl" x={13} y={5} width={24} height={2} rx={1} className="i-fabrica-filo" />);
    for (let f = 0; f < 2; f++)
      for (let c = 0; x + 44 + c * 7 < w - 10; c++)
        cosas.push(<rect key={`${f}-${c}`} x={44 + c * 7 + (f % 2) * 3} y={12 - f * 5} width={5.5} height={5.5} rx={1.2} className="i-hielo" />);
    j = 8;
  }
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
      style={{ ...caja({ x: p.x + 4, y: p.y - 8, w, h: 22 }), ...(z !== undefined ? { zIndex: z } : {}) }}
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
  // Solo cajones (bajo cubierta): sale uno solo, el de arriba o (abreAbajo) el
  // de abajo, y solo ese enseña su canasta.
  const soloCajones = a.piezas.every((p) => p.tipo === "cajon");
  const sale = a.abreAbajo ? 0 : cajones.length - 1;
  return (
    <>
      <svg className="ilus-escena" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect width={W} height={H} fill="url(#ilus-pared)" />
        <ellipse cx={W / 2} cy={10} rx={320} ry={190} fill="url(#ilus-halo)" />
        <rect y={376} width={W} height={24} className="i-piso" />
        {a.exterior ? (
          <EscenaExterior b={b} />
        ) : a.oscuro ? (
          <EscenaColumnasOscuras b={b} />
        ) : !a.real && a.libre && a.escena === "alta" ? (
          <EscenaListonesLibre b={b} maceta={a.maceta} profundidad={a.profundidad} />
        ) : a.real ? (
          a.escena === "alta" ? (
            <EscenaAltaReal b={b} />
          ) : a.libre || b.y >= 236 ? (
            <EscenaBajoCubiertaReal b={b} g={a.holgura ?? 2} libre={a.libre} />
          ) : (
            <EscenaBaja b={b} holgura={a.holgura} real planta={a.planta} lampara={a.lampara} />
          )
        ) : a.escena === "alta" ? (
          <EscenaListones b={b} />
        ) : (
          <EscenaListonesBaja b={b} libre={a.libre} g={a.holgura} marmol={a.marmol} />
        )}
        {/* Piso pulido: reflejo del aparato y luz del zoclo (todas las escenas). */}
        <rect x={0} y={376} width={W} height={10} fill="url(#ilus-cinta)" opacity={0.35} />
        <rect x={b.x} y={377} width={b.w} height={22} fill="url(#ilus-reflejo)" />
        <ellipse cx={b.x + b.w / 2} cy={377} rx={b.w * 0.72} ry={7} fill="url(#ilus-sombra)" />

        {/* Cuerpos: marco, zoclo con rejilla y, detrás de cada cajón, el hueco.
            La máquina modular se dibuja completa aparte. */}
        {!a.modular && a.cuerpos.map((c, k) => (
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
                {c.juntas?.map((j, q) => <rect key={q} x={j.x} y={j.y} width={j.w} height={j.h} className="i-junta-negra" />)}
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

      {/* Cada canasta queda justo debajo de su cajón y encima del de abajo. */}
      {cajones.map((p, k) =>
        soloCajones && k !== sale ? null : <Canasta key={`c${k}`} p={p} z={a.abreAbajo ? 2 * cajones.length + 1 : 1 + 2 * k} />,
      )}
      {cajones.map((p, k) => (
        <span
          key={`d${k}`}
          className={
            k !== sale
              ? "ilus-capa ilus-cajon"
              : a.abreAbajo
                ? "ilus-capa ilus-cajon ilus-cajon--abajo"
                : "ilus-capa ilus-cajon ilus-cajon--arriba"
          }
          style={{ ...caja(p), zIndex: a.abreAbajo && k === sale ? 2 * cajones.length + 2 : 2 + 2 * k, "--k": k } as CSSProperties}
        >
          <FrenteCajon p={p} />
        </span>
      ))}

      {a.piezas
        .filter((p) => p.tipo === "tapa")
        .map((p, k) => (
          <Fragment key={`t${k}`}>
            <span className="ilus-capa ilus-tapa-int" style={caja({ x: p.x, y: p.y - TAPA, w: p.w, h: TAPA })}>
              <svg viewBox={`0 0 ${p.w} ${TAPA}`} preserveAspectRatio="none" aria-hidden="true">
                <rect x={0.75} y={0.75} width={p.w - 1.5} height={TAPA - 1.5} className={a.blanco ? "i-blanco i-blanco-canto" : "i-tapa-int"} />
                {/* Blanco: relieve moldeado de la contratapa, como la referencia. */}
                {a.blanco &&
                  Array.from({ length: Math.max(3, Math.floor((p.w - 20) / 32)) }, (_, q) => {
                    const n = Math.max(3, Math.floor((p.w - 20) / 32));
                    const pw = (p.w - 20 - (n - 1) * 5) / n;
                    return <rect key={q} x={10 + q * (pw + 5)} y={10} width={pw} height={TAPA - 20} rx={2} className="i-blanco-relieve" />;
                  })}
                <rect x={6} y={6} width={p.w - 12} height={TAPA - 12} rx={4} className="i-empaque" />
              </svg>
            </span>
            <Canasta p={p} />
            <span className="ilus-capa ilus-tapa" style={caja(p)}>
              <FrenteArcon p={p} blanco={a.blanco} />
            </span>
          </Fragment>
        ))}

      {a.piezas
        .filter((p) => p.tipo === "puerta")
        .map((p, k) => (
          <span key={`p${k}`} className={`ilus-capa ilus-puerta ilus-puerta--${p.bisagra === "r" ? "r" : "l"}`} style={caja(p)}>
            <FrentePuerta p={p} />
            <ReversoPuerta p={p} />
          </span>
        ))}

      {a.modular && (
        <span className="ilus-capa ilus-modular" style={caja(b)}>
          <MaquinaModular w={b.w} h={b.h} />
        </span>
      )}

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
const cajon = (x: number, y: number, w: number, h: number, zona: Zona, extra: Partial<Pieza> = {}): Pieza => ({
  tipo: "cajon", x, y, w, h, zona, ...extra,
});

const APARATOS: Record<string, Aparato> = {
  // ——— Tipo de instalación (solo Refrigeradores; ver FilterShowcase) ———
  // De Piso: libre, más bajo y con holgura a los lados; la planta enseña que
  // sobresale del frente de los gabinetes.
  "de-piso": {
    escena: "baja",
    real: true,
    lampara: true,
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
      { x: 386, y: 130, hasta: 432, texto: "Refrigerador\ncon su compresor" },
      { x: 384, y: 250, hasta: 432, texto: "Control propio\nen cada columna" },
    ],
  },
  "french-door": {
    escena: "alta",
    panelable: true,
    cuerpos: [{ x: 200, ...ALTO, w: 160 }],
    huecos: [{ x: 200, y: 56, w: 160, h: 188, zona: "fresca", crisper: true }],
    piezas: [
      puerta(200, 56, 80, 188, "l", { panelable: true }),
      puerta(280, 56, 80, 188, "r", { panelable: true }),
      cajon(200, 248, 160, 118, "congelador", { panelable: true }),
    ],
    etiquetas: [
      { x: 238, y: 80, hasta: 150, texto: "Lo fresco a la\naltura de los ojos" },
      { x: 234, y: 318, hasta: 150, texto: "Congelador en cajón\nde extracción total" },
      { x: 382, y: 120, hasta: 404, texto: "Medias puertas:\nabren en poco espacio" },
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
      { x: 318, y: 120, hasta: 410, texto: "Compartimento fresco\nde altura completa" },
      { x: 386, y: 236, hasta: 410, texto: "Puertas angostas:\nabatimiento corto" },
    ],
  },
  "bottom-mount": {
    escena: "alta",
    panelable: true,
    cuerpos: [{ x: 215, ...ALTO, w: 130 }],
    huecos: [{ x: 215, y: 56, w: 130, h: 188, zona: "fresca", crisper: true }],
    piezas: [puerta(215, 56, 130, 188, "r", { panelable: true }), cajon(215, 248, 130, 118, "congelador", { panelable: true })],
    etiquetas: [
      { x: 248, y: 84, hasta: 150, texto: "Una sola puerta\npara lo fresco" },
      { x: 248, y: 224, hasta: 150, texto: "Verduras a la\naltura de la mano" },
      { x: 246, y: 318, hasta: 150, texto: "Congelador en\ncajón inferior" },
    ],
  },
  // De pie, separado del muro y con maceta a la derecha (Carla, 2026-10-19).
  "top-mount": {
    escena: "alta",
    libre: true,
    maceta: "der",
    profundidad: true,
    cuerpos: [{ x: 196, ...ALTO, w: 130 }],
    huecos: [
      { x: 196, y: 56, w: 130, h: 92, zona: "congelador" },
      { x: 196, y: 152, w: 130, h: 214, zona: "fresca", crisper: true },
    ],
    piezas: [puerta(196, 56, 130, 92, "r", { zona: "congelador" }), puerta(196, 152, 130, 214, "r")],
    etiquetas: [
      { x: 229, y: 96, hasta: 130, texto: "Congelador arriba\ncon su propia puerta" },
      { x: 229, y: 236, hasta: 130, texto: "Compartimento\nfresco abajo" },
      { x: 241, y: 360, hasta: 130, texto: "Un solo sistema de\nfrío: menor consumo" },
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
    panelable: true,
    cuerpos: [{ x: 215, ...ALTO, w: 130, rejilla: 18 }],
    huecos: [{ x: 215, y: 76, w: 130, h: 290, zona: "fresca", crisper: true }],
    piezas: [puerta(215, 76, 130, 290, "r", { cristal: true, manija: "larga", panelable: true })],
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
  // Puertas cruzadas (referencia Mabe de Carla, 2026-10-20): dos puertas arriba
  // para lo fresco y dos abajo para el congelador, franja negra al centro, acero
  // grafito, sin jaladeras a la vista, despachador compacto a la izquierda y
  // pantalla vertical a la derecha. Más ancho que alto como la foto (≈0.7).
  "cuatro-puertas": {
    escena: "alta",
    grafito: true,
    cuerpos: [
      {
        x: 168,
        ...ALTO,
        w: 224,
        juntas: [
          { x: 168, y: 224, w: 224, h: 8 },
          { x: 279, y: 232, w: 2, h: 134 },
        ],
      },
    ],
    huecos: [
      { x: 168, y: 56, w: 224, h: 168, zona: "fresca", crisper: true },
      { x: 168, y: 232, w: 112, h: 134, zona: "congelador" },
      { x: 280, y: 232, w: 112, h: 134, zona: "congelador" },
    ],
    piezas: [
      puerta(168, 56, 111, 168, "l", { manija: "ninguna", despachador: "cruzada" }),
      puerta(281, 56, 111, 168, "r", { manija: "ninguna", control: true, insignia: true }),
      puerta(168, 232, 111, 134, "l", { manija: "ninguna", zona: "congelador" }),
      puerta(281, 232, 111, 134, "r", { manija: "ninguna", zona: "congelador" }),
    ],
    etiquetas: [
      { x: 224, y: 128, hasta: 130, texto: "Agua fría sin\nabrir la puerta" },
      { x: 210, y: 300, hasta: 130, texto: "Congelador en\ndos puertas" },
      { x: 303, y: 80, hasta: 430, texto: "Control digital\nen la puerta" },
      { x: 360, y: 170, hasta: 430, texto: "Lo fresco arriba,\na la vista" },
      { x: 360, y: 300, hasta: 430, texto: "Medias puertas:\nabren en poco espacio" },
    ],
  },
  // French door de cinco frentes (referencia KitchenAid de Carla, 2026-10-20):
  // despachador grande en la puerta izquierda, jaladeras largas al centro, dos
  // cajones intermedios y el congelador abajo, separados por juntas negras.
  "cinco-puertas": {
    escena: "alta",
    cuerpos: [
      {
        x: 196,
        ...ALTO,
        w: 168,
        juntas: [
          { x: 196, y: 216, w: 168, h: 4 },
          { x: 196, y: 264, w: 168, h: 4 },
          { x: 278, y: 220, w: 4, h: 44 },
        ],
      },
    ],
    huecos: [{ x: 196, y: 56, w: 168, h: 160, zona: "fresca", crisper: true }],
    piezas: [
      puerta(196, 56, 83, 160, "l", { manija: "francesa", despachador: "francesa" }),
      puerta(281, 56, 83, 160, "r", { manija: "francesa" }),
      cajon(196, 220, 82, 44, "flex", { manija: "larga" }),
      cajon(282, 220, 82, 44, "flex", { manija: "larga" }),
      cajon(196, 268, 168, 98, "congelador", { manija: "larga", insignia: true }),
    ],
    etiquetas: [
      { x: 222, y: 150, hasta: 150, texto: "Agua y hielo sin\nabrir la puerta" },
      { x: 236, y: 330, hasta: 150, texto: "Congelador en\ncajón inferior" },
      { x: 322, y: 90, hasta: 410, texto: "Zona fresca\nfrench door" },
      { x: 330, y: 242, hasta: 410, texto: "Dos cajones con\ntemperatura propia" },
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

  // ——— Resto de Refrigeración (Carla, 2026-10-19): mismas escenas, la ficha
  // las pide con `ilustracion` (taxonomía) porque comparten `diagrama`. ———
  // Congeladores
  "cong-de-piso": {
    escena: "baja",
    real: true,
    holgura: 8,
    planta: "piso",
    cuerpos: [{ x: 215, y: 70, w: 130, h: 306 }],
    huecos: [{ x: 215, y: 70, w: 130, h: 296, zona: "congelador" }],
    // Abre a la izquierda (Carla, 2026-10-19): etiquetas a la derecha.
    piezas: [puerta(215, 70, 130, 296, "l", { zona: "congelador", manija: "larga" })],
    etiquetas: [
      { x: 310, y: 110, hasta: 410, texto: "Repisas y cajones\ncon acceso frontal" },
      { x: 349, y: 190, hasta: 410, texto: "Holgura lateral\npara ventilar" },
      { x: 310, y: 255, hasta: 410, texto: "Instalación libre:\nse conecta y listo" },
    ],
  },
  "cong-empotrado": {
    escena: "alta",
    real: true,
    panelable: true,
    planta: "empotrado",
    cuerpos: [{ x: 200, ...ALTO, w: 160, rejilla: 16 }],
    huecos: [{ x: 200, y: 72, w: 160, h: 294, zona: "congelador" }],
    piezas: [puerta(200, 72, 160, 294, "l", { zona: "congelador", manija: "larga", panelable: true })],
    etiquetas: [
      { x: 250, y: 100, hasta: 150, texto: "A ras del mueble:\n24″ de fondo" },
      { x: 250, y: 236, hasta: 150, texto: "Admite panel o\nfrente de acero" },
      { x: 246, y: 371, hasta: 150, texto: "Ventila por el\nzoclo frontal" },
    ],
  },
  // Arcón doméstico blanco frente al muro de listones, fuera de la cocina
  // (Carla, 2026-10-19; referencia: arcón blanco de tapa con relieve).
  "cong-horizontal": {
    escena: "alta",
    libre: true,
    blanco: true,
    cuerpos: [{ x: 165, y: 216, w: 230, h: 160 }],
    huecos: [],
    piezas: [{ tipo: "tapa", x: 165, y: 216, w: 230, h: 160, zona: "congelador" }],
    etiquetas: [
      { x: 200, y: 226, hasta: 130, texto: "Tapa superior:\nel frío no escapa" },
      { x: 220, y: 310, hasta: 130, texto: "Máximo volumen para\npiezas grandes" },
      { x: 360, y: 270, hasta: 430, texto: "Temperatura estable\ny bajo consumo" },
    ],
    recorte: { x: 80, y: 120, w: 400, h: 270 },
  },
  // Cajones fríos bajo la cubierta, panelables (Carla, 2026-10-19).
  "cong-bajo-cubierta": {
    escena: "baja",
    real: true,
    panelable: true,
    cuerpos: [{ x: 214, y: 246, w: 132, h: 130 }],
    huecos: [],
    piezas: [
      cajon(214, 247, 132, 58, "congelador", { panelable: true }),
      cajon(214, 307, 132, 59, "congelador", { panelable: true }),
    ],
    etiquetas: [
      { x: 250, y: 270, hasta: 150, texto: "Alto 34″: entra\nbajo la cubierta" },
      { x: 250, y: 340, hasta: 150, texto: "Cajones de\nextracción total" },
      { x: 340, y: 270, hasta: 410, texto: "Admite panel\nde carpintería" },
    ],
    recorte: { x: 140, y: 175, w: 280, h: 215 },
  },

  // Máquinas de hielo
  "hielo-empotrable": {
    escena: "baja",
    real: true,
    cuerpos: [{ x: 246, y: 246, w: 68, h: 130 }],
    huecos: [{ x: 246, y: 246, w: 68, h: 120, zona: "hielo" }],
    // Jaladera tubular larga, como Acero inox y Panelable (Carla, 2026-10-20).
    piezas: [puerta(246, 246, 68, 120, "r", { zona: "hielo", manija: "tubo" })],
    etiquetas: [
      { x: 262, y: 262, hasta: 150, texto: "Hielo continuo\nen 15–18″ de ancho" },
      { x: 262, y: 330, hasta: 150, texto: "Toma de agua y\ndrenaje o bomba" },
      { x: 300, y: 371, hasta: 410, texto: "Ventilación\nfrontal" },
    ],
    recorte: { x: 170, y: 175, w: 220, h: 215 },
  },
  // Modular de piso (referencia Hoshizaki), de pie frente al muro de listones
  // como el arcón de Congeladores (Carla, 2026-10-19).
  "hielo-de-piso": {
    escena: "alta",
    libre: true,
    modular: true,
    cuerpos: [{ x: 205, y: 126, w: 150, h: 250 }],
    huecos: [],
    piezas: [],
    etiquetas: [
      { x: 300, y: 170, hasta: 430, texto: "Fábrica de hielo\narriba" },
      { x: 230, y: 232, hasta: 130, texto: "Depósito con\npuerta corrediza" },
      { x: 240, y: 330, hasta: 130, texto: "Ventila por la\nrejilla frontal" },
      { x: 345, y: 364, hasta: 430, texto: "Patas: libre y\nfácil de limpiar" },
    ],
    recorte: { x: 80, y: 90, w: 400, h: 300 },
  },
  "hielo-acero": {
    escena: "baja",
    cuerpos: [{ x: 230, y: 150, w: 100, h: 226, zocloAcero: true }],
    huecos: [{ x: 230, y: 150, w: 100, h: 214, zona: "hielo" }],
    piezas: [puerta(230, 150, 100, 214, "r", { zona: "hielo", manija: "tubo" })],
    etiquetas: [
      { x: 250, y: 200, hasta: 150, texto: "Acero inoxidable\nde grado profesional" },
      { x: 250, y: 300, hasta: 150, texto: "Resiste la humedad\ndel bar" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },
  "hielo-panelable": {
    escena: "baja",
    panelFijo: true,
    cuerpos: [{ x: 230, y: 150, w: 100, h: 226, zocloAcero: true }],
    huecos: [{ x: 230, y: 150, w: 100, h: 214, zona: "hielo" }],
    piezas: [puerta(230, 150, 100, 214, "r", { zona: "hielo", manija: "tubo", panelable: true })],
    etiquetas: [
      { x: 250, y: 200, hasta: 150, texto: "Panel del mismo\nmaterial del mueble" },
      { x: 250, y: 300, hasta: 150, texto: "Queda oculta\ndentro del mueble" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },

  // Cavas de vino: misma columna, solo cambia la puerta.
  "cava-acero": {
    escena: "alta",
    real: true,
    cuerpos: [{ x: 225, ...ALTO, w: 110, rejilla: 16 }],
    huecos: [{ x: 225, y: 72, w: 110, h: 294, zona: "vinoteca" }],
    piezas: [puerta(225, 72, 110, 294, "r", { zona: "vinoteca", manija: "larga" })],
    etiquetas: [
      { x: 262, y: 110, hasta: 150, texto: "Puerta sólida:\nsin luz" },
      { x: 262, y: 230, hasta: 150, texto: "Mayor aislamiento\npara guarda larga" },
      { x: 262, y: 340, hasta: 150, texto: "La colección no\nqueda a la vista" },
    ],
  },
  "cava-vidrio": {
    escena: "alta",
    real: true,
    cuerpos: [{ x: 225, ...ALTO, w: 110, rejilla: 16 }],
    huecos: [{ x: 225, y: 72, w: 110, h: 294, zona: "vinoteca" }],
    piezas: [puerta(225, 72, 110, 294, "r", { zona: "vinoteca", cristal: true, manija: "larga" })],
    etiquetas: [
      { x: 262, y: 110, hasta: 150, texto: "Vidrio aislante\ncon filtro UV" },
      { x: 262, y: 230, hasta: 150, texto: "La colección se\nve sin abrir" },
      { x: 262, y: 340, hasta: 150, texto: "1 a 3 zonas de\ntemperatura" },
    ],
  },

  // Centros de bebida (Carla, 2026-10-19; referencias Sub-Zero): vista cercana
  // como Bajo cubierta de Refrigeradores. De piso y Empotrado en acero con botón
  // Panelar (marco de madera alrededor del vidrio); Diseño: vidrio o sólida
  // (sólida = cocina exterior).
  // De piso: de pie frente al muro de listones, sin mueble alrededor.
  "cb-de-piso": {
    escena: "alta",
    libre: true,
    panelable: true,
    cuerpos: [{ x: 196, y: 150, w: 168, h: 226, zocloAcero: true }],
    huecos: [{ x: 196, y: 150, w: 168, h: 214, zona: "bebidas" }],
    piezas: [puerta(196, 150, 168, 214, "l", { zona: "bebidas", cristal: true, manija: "tubo", panelable: true })],
    etiquetas: [
      { x: 214, y: 170, hasta: 130, texto: "Gabinete terminado:\nsin nicho ni obra" },
      { x: 368, y: 250, hasta: 430, texto: "Costados a la\nvista" },
      { x: 240, y: 371, hasta: 130, texto: "Va donde haga falta:\nbar, oficina o terraza" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },
  "cb-empotrado": {
    escena: "baja",
    marmol: true,
    panelable: true,
    cuerpos: [{ x: 196, y: 150, w: 168, h: 226, zocloAcero: true }],
    huecos: [{ x: 196, y: 150, w: 168, h: 214, zona: "bebidas" }],
    piezas: [puerta(196, 150, 168, 214, "l", { zona: "bebidas", cristal: true, manija: "tubo", panelable: true })],
    etiquetas: [
      { x: 214, y: 128, hasta: 150, texto: "Bajo la cubierta:\n34″ de alto" },
      { x: 236, y: 250, hasta: 150, texto: "A ras del mueble,\nadmite panel" },
      { x: 240, y: 371, hasta: 150, texto: "Ventila por\nel zoclo frontal" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },
  "cb-cristal": {
    escena: "baja",
    marmol: true,
    cuerpos: [{ x: 196, y: 150, w: 168, h: 226, zocloAcero: true }],
    huecos: [{ x: 196, y: 150, w: 168, h: 214, zona: "bebidas" }],
    piezas: [puerta(196, 150, 168, 214, "r", { zona: "bebidas", cristal: true, manija: "tubo" })],
    etiquetas: [
      { x: 236, y: 190, hasta: 150, texto: "Vidrio aislante\ncon luz LED" },
      { x: 236, y: 290, hasta: 150, texto: "Todo a la vista\nsin abrir" },
    ],
    recorte: { x: 70, y: 60, w: 420, h: 330 },
  },
  "cb-solida": {
    escena: "baja",
    exterior: true,
    cuerpos: [{ x: 160, y: 150, w: 168, h: 226, zocloAcero: true }],
    huecos: [{ x: 160, y: 150, w: 168, h: 214, zona: "bebidas" }],
    piezas: [puerta(160, 150, 168, 214, "l", { zona: "bebidas", manija: "larga" })],
    etiquetas: [
      { x: 200, y: 200, hasta: 130, texto: "Acero sin vidrio:\naísla del sol" },
      { x: 200, y: 300, hasta: 130, texto: "Certificado\npara exterior" },
    ],
    recorte: { x: 60, y: 60, w: 440, h: 330 },
  },

  // Cavas de vino · Diseño (Carla, 2026-10-19). Bajo cubierta reutiliza la
  // escena "bajo-cubierta" de Refrigeradores.
  // De pared (referencia Smeg): empotrada a media altura en columnas antracita.
  "cava-pared": {
    escena: "alta",
    oscuro: true,
    cuerpos: [{ x: 170, y: 150, w: 220, h: 118 }],
    huecos: [{ x: 170, y: 150, w: 220, h: 118, zona: "pared" }],
    piezas: [
      puerta(170, 150, 220, 118, "l", {
        zona: "pared",
        cristal: true,
        manija: "ninguna",
        pantalla: true,
        marco: { lado: 6, arriba: 30, abajo: 22 },
      }),
    ],
    etiquetas: [
      { x: 214, y: 210, hasta: 130, texto: "A la altura\nde la vista" },
      { x: 280, y: 165, hasta: 430, texto: "Control táctil\nen el frente" },
      { x: 360, y: 290, hasta: 430, texto: "Entra en el hueco\nde un horno" },
    ],
    recorte: { x: 80, y: 90, w: 400, h: 240 },
  },
  // Columna de piso a techo con puerta de vidrio, panelable.
  "cava-columna": {
    escena: "alta",
    panelable: true,
    cuerpos: [{ x: 215, ...ALTO, w: 130, rejilla: 18 }],
    huecos: [{ x: 215, y: 76, w: 130, h: 290, zona: "vinoteca" }],
    piezas: [puerta(215, 76, 130, 290, "r", { zona: "vinoteca", cristal: true, manija: "larga", panelable: true })],
    etiquetas: [
      { x: 250, y: 120, hasta: 150, texto: "De piso a techo:\nla colección completa" },
      { x: 250, y: 236, hasta: 150, texto: "Hasta tres zonas\nde temperatura" },
      { x: 250, y: 330, hasta: 150, texto: "Admite panel\nde carpintería" },
    ],
  },

  // Cajones refrigerantes (Carla, 2026-10-20): los cuatro tipos de
  // funcionamiento comparten el diseño —dos cajones bajo cubierta, panelables—
  // y solo cambia lo que guardan.
  "cajones-refrigerantes": {
    escena: "baja",
    real: true,
    panelable: true,
    cuerpos: [{ x: 214, y: 246, w: 132, h: 130 }],
    huecos: [],
    piezas: [cajon(214, 247, 132, 58, "fresca", { panelable: true }), cajon(214, 307, 132, 59, "fresca", { panelable: true })],
    etiquetas: [
      { x: 250, y: 270, hasta: 150, texto: "Temperatura propia\nen cada cajón" },
      { x: 250, y: 340, hasta: 150, texto: "Extracción total\nbajo la cubierta" },
      { x: 340, y: 270, hasta: 410, texto: "Ingredientes junto\na la preparación" },
    ],
    recorte: { x: 140, y: 175, w: 280, h: 215 },
  },
  "cajones-congeladores": {
    escena: "baja",
    real: true,
    panelable: true,
    cuerpos: [{ x: 214, y: 246, w: 132, h: 130 }],
    huecos: [],
    piezas: [cajon(214, 247, 132, 58, "congelador", { panelable: true }), cajon(214, 307, 132, 59, "congelador", { panelable: true })],
    etiquetas: [
      { x: 250, y: 270, hasta: 150, texto: "Congelación en\nformato cajón" },
      { x: 250, y: 340, hasta: 150, texto: "Porciones y hielo\na la mano" },
      { x: 340, y: 270, hasta: 410, texto: "Combinable con un\ncajón refrigerante" },
    ],
    recorte: { x: 140, y: 175, w: 280, h: 215 },
  },
  // Todo congelador con fábrica de hielos: el cajón de arriba hace el hielo.
  "cajones-congelador-hielos": {
    escena: "baja",
    real: true,
    panelable: true,
    cuerpos: [{ x: 214, y: 246, w: 132, h: 130 }],
    huecos: [],
    piezas: [cajon(214, 247, 132, 58, "hielo", { panelable: true }), cajon(214, 307, 132, 59, "congelador", { panelable: true })],
    etiquetas: [
      { x: 250, y: 266, hasta: 150, texto: "Fábrica de hielos\nen el cajón superior" },
      { x: 250, y: 340, hasta: 150, texto: "Congelador\nabajo" },
      { x: 340, y: 300, hasta: 410, texto: "Requiere toma\nde agua" },
    ],
    recorte: { x: 140, y: 175, w: 280, h: 215 },
  },
  // Combinado: refrigerador arriba y congelador con fábrica de hielos abajo
  // (como Sub-Zero); al abrir sale el cajón de abajo con el hielo.
  "cajones-combinados": {
    escena: "baja",
    real: true,
    panelable: true,
    abreAbajo: true,
    cuerpos: [{ x: 214, y: 246, w: 132, h: 130 }],
    huecos: [],
    piezas: [cajon(214, 247, 132, 58, "fresca", { panelable: true }), cajon(214, 307, 132, 59, "hielo", { panelable: true })],
    etiquetas: [
      { x: 250, y: 266, hasta: 150, texto: "Refrigerador\narriba" },
      { x: 250, y: 345, hasta: 150, texto: "Congelador con fábrica\nde hielos abajo" },
      { x: 340, y: 300, hasta: 410, texto: "Requiere toma\nde agua" },
    ],
    recorte: { x: 140, y: 175, w: 280, h: 215 },
  },
};

export function tieneIlustracion(tipo: string): boolean {
  return tipo in APARATOS;
}

/** Botón "Panelar" del tipo: posición en % de la escena, o null. */
export function panelar(tipo: string): { right: string; y: string; inicial: boolean; boton: boolean } | null {
  const a = APARATOS[tipo];
  if (!a?.panelable && !a?.panelFijo) return null;
  // Sobre la alacena de la derecha (Carla, 2026-10-19), anclado por su borde
  // derecho: "Ver en acero" es más largo que "Panelar" y, centrado, se salía de
  // la tarjeta (2026-10-19).
  const x1 = a.real && a.escena === "alta" ? 500 : 520; // fin de la alacena derecha
  const pref = a.escena === "baja" && !a.real ? limites(a.cuerpos).y + 40 : 100; // bajo cubierta: sobre el frente
  // Que no tape las etiquetas del lado derecho (Carla, 2026-10-19): la altura
  // libre más cercana a la preferida, nunca arriba de 100 (ahí va la lupa).
  const derechas = a.etiquetas.filter((e) => e.hasta > e.x).map((e) => e.y);
  const libres = Array.from({ length: 26 }, (_, k) => 100 + k * 10)
    .filter((y) => derechas.every((t) => Math.abs(y - t) >= 46))
    .sort((p, q) => Math.abs(p - pref) - Math.abs(q - pref));
  const y = libres[0] ?? pref;
  return {
    right: `${((W - x1) / W) * 100}%`,
    y: `${(y / H) * 100}%`,
    inicial: Boolean(a.panelInicial || a.panelFijo),
    boton: !a.panelFijo,
  };
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
    <span
      className={`ilus ${a.real ? "ilus--real" : "ilus--listones"}${a.exterior ? " ilus--exterior" : ""}${a.antracita ? " ilus--antracita" : ""}${a.grafito ? " ilus--grafito" : ""}${a.piezas.every((p) => p.tipo === "cajon") ? " ilus--cajones" : ""}`}
      style={style}
      data-apilar={a.apilar ? "" : undefined}
    >
      <Ilustracion a={a} />
    </span>
  );
}
