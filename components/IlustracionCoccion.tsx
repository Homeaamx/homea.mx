// IlustracionCoccion — escenas "en escena" de las fichas de Cocción (Carla,
// 2026-10-20), con los mismos acabados de Refrigeración (IlustracionTipo):
// carpintería de nogal, cubierta de piedra, salpicadero de mármol, acero
// cepillado y luz cálida. Cada tipo anima lo que lo distingue:
//
//   Estufas y parrillas de gas → se prende la flama azul (y el horno se abre)
//   Inducción                  → las zonas se encienden en azul claro
//   Vitrocerámica              → las resistencias se encienden en rojo
//   Hornos, microondas, cajones → se abren (puerta abatible o cajón)
//   Campanas                   → luz encendida y el aire subiendo a la campana
//                                (la retráctil sube desde la cubierta)
//   Cafeteras                  → pantalla encendida y café sirviéndose
//
// El estado de reposo es el aparato apagado/cerrado; al hover de la tarjeta (o
// en la vista derecha del modal, `.is-abierto`) pasa a encendido/abierto. Las
// etiquetas del modal ("Apagado · Encendido" o "Cerrado · Abierto") viajan en
// `data-estados`. Escena de 560×400 (las mismas unidades que IlustracionTipo);
// colores en styles/guias.css (sección Cocción); degradados en DiagramaDefs (c-*).

import { Fragment, type CSSProperties, type ReactElement, type ReactNode } from "react";
import {
  Cajones,
  Cinta,
  Despensa,
  H,
  Listones,
  Luces,
  Planta2,
  Platos,
  Puertas,
  Tablas,
  Tag,
  TramoCubierta,
  W,
  caja,
  type Etiqueta,
  type Rect,
} from "./IlustracionTipo";

type Estados = "encender" | "abrir";
const ESTADOS: Record<Estados, string> = { encender: "Apagado|Encendido", abrir: "Cerrado|Abierto" };

interface Escena {
  estados: Estados;
  /** Contenido del SVG de la escena (fondo, aparato y partes animadas en SVG). */
  fondo: ReactNode;
  /** Capas HTML encima (puertas que giran en 3D, cajones). */
  capas?: ReactNode;
  etiquetas: Etiqueta[];
  /** Encuadre del modal. */
  recorte: Rect;
}

/* ——— Utilidades ——————————————————————————————————————————————————— */

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Acero cepillado con su modelado (luz arriba, bandas). */
function Acero({ x, y, w, h, rx = 0, className = "" }: Rect & { rx?: number; className?: string }) {
  return (
    <g className={className}>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#dgm-acero)" className="i-panel" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
    </g>
  );
}

/** Vidrio negro (hornos, cafeteras, campanas Monolith) con reflejo diagonal. */
function VidrioNegro({ x, y, w, h }: Rect) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="c-vidrio-negro" />
      <polygon points={pts([[x + w * 0.18, y], [x + w * 0.42, y], [x + w * 0.12, y + h], [x, y + h], [x, y + h * 0.7]])} className="c-reflejo" />
    </g>
  );
}

/** Jaladera tubular horizontal con dos soportes. */
function Tubo({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x + 2} y={y + 3} width={w} height={4.5} rx={2.2} className="i-manija-sombra" />
      <rect x={x + 4} y={y - 3} width={3} height={6} className="i-manija" />
      <rect x={x + w - 7} y={y - 3} width={3} height={6} className="i-manija" />
      <rect x={x} y={y} width={w} height={4.5} rx={2.2} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
    </g>
  );
}

/** Perilla vista de frente (roja estilo profesional o de acero). */
function Perilla({ cx, cy, r = 5.5, roja }: { cx: number; cy: number; r?: number; roja?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy + 1.2} r={r} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r} className={roja ? "i-perilla-roja" : "c-perilla"} />
      <rect x={cx - 0.8} y={cy - r + 1} width={1.6} height={r * 0.9} rx={0.6} className="c-perilla-marca" />
    </g>
  );
}

/* ——— Flama, vapor, aire ————————————————————————————————————————————— */

/** Lengüeta de flama: base en (x, y), alto h. */
const lengua = (x: number, y: number, h: number, w = 1.8) =>
  `M${x - w} ${y} Q${x - w * 0.9} ${y - h * 0.55} ${x} ${y - h} Q${x + w * 0.9} ${y - h * 0.55} ${x + w} ${y} Z`;

/** Flama vista de lado (estufas en alzado): fila de lengüetas sobre la rejilla. */
function FlamaLado({ cx, y, w }: { cx: number; y: number; w: number }) {
  const n = Math.max(4, Math.round(w / 3.4));
  return (
    <g className="c-flama">
      <ellipse cx={cx} cy={y - 1} rx={w / 2 + 2} ry={2.4} className="c-flama-halo" />
      {Array.from({ length: n }, (_, k) => {
        const x = cx - w / 2 + (w * (k + 0.5)) / n;
        const h = 7 + ((k * 7) % 4);
        return <path key={k} d={lengua(x, y, h, 2)} className="c-llama" style={{ "--d": `${(k % 5) * 0.11}s` } as CSSProperties} />;
      })}
    </g>
  );
}

/** Corona de flama vista desde arriba (parrillas): lengüetas alrededor del anillo. */
function Corona({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const n = Math.max(10, Math.round(rx * 1.1));
  const atras: ReactElement[] = [];
  const frente: ReactElement[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    const h = Math.max(4, rx * 0.32) + ((k * 5) % 3);
    const el = <path key={k} d={lengua(x, y, h, Math.max(1.4, rx * 0.09))} className="c-llama" style={{ "--d": `${(k % 6) * 0.09}s` } as CSSProperties} />;
    (Math.sin(a) < 0 ? atras : frente).push(el);
  }
  return (
    <g className="c-flama">
      <ellipse cx={cx} cy={cy} rx={rx * 1.25} ry={ry * 1.25} className="c-flama-halo" />
      {atras}
      {frente}
    </g>
  );
}

/** Vapor que sube desde (x, y): bocanadas difusas que suben y se desvanecen. */
function Vapor({ x, y, n = 4, ancho = 10 }: { x: number; y: number; n?: number; ancho?: number }) {
  return (
    <g className="c-vapor">
      {Array.from({ length: n }, (_, k) => (
        <ellipse
          key={k}
          cx={x + ((k % 3) - 1) * ancho * 0.45}
          cy={y}
          rx={ancho * 0.55}
          ry={ancho * 0.4}
          className="c-bocanada"
          style={{ "--d": `${k * 0.55}s` } as CSSProperties}
        />
      ))}
    </g>
  );
}

/** Corrientes de aire: trazos ondulados que avanzan (extracción). */
function Aire({ trazos }: { trazos: string[] }) {
  return (
    <g className="c-aire">
      {trazos.map((d, k) => (
        <path key={k} d={d} className="c-aire-trazo" style={{ "--d": `${k * 0.3}s` } as CSSProperties} />
      ))}
    </g>
  );
}

/** Flechas que suben por el ducto de la campana. */
function Ducto({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g className="c-ducto">
      {Array.from({ length: Math.max(2, Math.floor((y2 - y1) / 34)) }, (_, k) => (
        <path
          key={k}
          d={`M${x - 7} ${y2 - 10 - k * 34} L${x} ${y2 - 17 - k * 34} L${x + 7} ${y2 - 10 - k * 34}`}
          className="c-ducto-flecha"
          style={{ "--d": `${k * 0.25}s` } as CSSProperties}
        />
      ))}
    </g>
  );
}

/* ——— Ollas y comida —————————————————————————————————————————————— */

/** Olla de acero vista de lado, apoyada en y. */
function Olla({ cx, y, w = 30, h = 22, tapa }: { cx: number; y: number; w?: number; h?: number; tapa?: boolean }) {
  return (
    <g>
      <rect x={cx - w / 2 - 4} y={y - h + 5} width={5} height={2.4} rx={1.2} className="c-asa" />
      <rect x={cx + w / 2 - 1} y={y - h + 5} width={5} height={2.4} rx={1.2} className="c-asa" />
      <rect x={cx - w / 2} y={y - h} width={w} height={h} rx={1.5} fill="url(#ilus-cromo)" className="c-olla" />
      <ellipse cx={cx} cy={y - h} rx={w / 2} ry={2.6} className="c-olla-borde" />
      {tapa && (
        <g>
          <ellipse cx={cx} cy={y - h - 1} rx={w / 2 - 1} ry={3} className="c-olla-tapa" />
          <rect x={cx - 3} y={y - h - 6} width={6} height={3.5} rx={1.5} className="c-asa" />
        </g>
      )}
    </g>
  );
}

/** Sartén vista de lado con mango. */
function Sarten({ cx, y, w = 36 }: { cx: number; y: number; w?: number }) {
  return (
    <g>
      <rect x={cx + w / 2 - 2} y={y - 6} width={w * 0.6} height={2.6} rx={1.3} className="c-mango" />
      <path d={`M${cx - w / 2} ${y - 7} L${cx + w / 2} ${y - 7} L${cx + w / 2 - 3} ${y} L${cx - w / 2 + 3} ${y} Z`} className="c-sarten" />
      <ellipse cx={cx} cy={y - 7} rx={w / 2} ry={2} className="c-olla-borde" />
    </g>
  );
}

/* ——— Escenas —————————————————————————————————————————————————————— */

/** Cocina en alzado (Estufas, Micro-campana, Campanas de pared): tramos de
 *  cubierta a los lados del hueco x1–x2 y muro de mármol encima. */
function EscenaCocina({ x1, x2, alacenaCorrida, sinLuces }: { x1: number; x2: number; alacenaCorrida?: number; sinLuces?: boolean }) {
  return (
    <>
      <TramoCubierta x1={0} x2={x1} decor="planta" />
      <TramoCubierta x1={x2} x2={W} decor="tablas" base="cajones" />
      <rect x={x1} y={20} width={x2 - x1} height={216} className="i-muro" />
      {alacenaCorrida !== undefined && (
        <>
          <Puertas x1={x1} x2={x2} y1={20} y2={alacenaCorrida} jy={alacenaCorrida - 26} />
          <Cinta x1={x1} x2={x2} y={alacenaCorrida} h={50} />
        </>
      )}
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
      {!sinLuces && <Luces xs={[x1 / 2, (x1 + x2) / 2, (x2 + W) / 2]} />}
    </>
  );
}

/** Muro de cocina con columna de carpintería al centro (x1–x2) y los huecos de
 *  los aparatos (`huecos`); tramo de cubierta a la izquierda y despensa a la derecha. */
function EscenaColumna({ x1, x2, huecos }: { x1: number; x2: number; huecos: Rect[] }) {
  return (
    <>
      <TramoCubierta x1={0} x2={x1 - 4} decor="planta" />
      <Despensa x1={x2 + 4} x2={W} />
      <rect x={x1} y={20} width={x2 - x1} height={346} className="i-mueble" />
      <rect x={x1} y={20} width={x2 - x1} height={346} className="i-modelado" />
      <rect x={x1 + 0.5} y={20.5} width={x2 - x1 - 1} height={345} className="i-panel-canto" />
      {huecos.map((r, k) => (
        <rect key={k} x={r.x - 3} y={r.y - 3} width={r.w + 6} height={r.h + 6} className="i-nicho" />
      ))}
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
      <Luces xs={[(x1 - 4) / 2, (x1 + x2) / 2, (x2 + 4 + W) / 2]} />
    </>
  );
}

/** Puertas de carpintería de la columna entre y1–y2 (arriba o abajo de los aparatos). */
function PuertasColumna({ x1, x2, y1, y2, arriba }: { x1: number; x2: number; y1: number; y2: number; arriba?: boolean }) {
  return <Puertas x1={x1 + 6} x2={x2 - 6} y1={y1} y2={y2} jy={arriba ? y2 - 26 : y1 + 6} jl={18} />;
}

/** Cubierta en perspectiva (Parrillas, extracción de superficie): muro arriba,
 *  plano de piedra que se acerca, canto y frentes de cajones abajo. */
const PB = 168; // canto trasero de la cubierta (y)
const PF = 300; // canto frontal (y)
const PCX = 280;
const PSB = 0.72; // escala del fondo respecto al frente
const PDEP = 300; // profundidad física del plano (unidades del frente)
const esc = (v: number) => PSB + (1 - PSB) * v;
/** Punto (x, v) del plano de la cubierta: x en unidades del frente, v de 0 (fondo) a 1 (canto). */
const P = (x: number, v: number): [number, number] => [PCX + (x - PCX) * esc(v), PB + (PF - PB) * v];
const quad = (x1: number, x2: number, v1: number, v2: number) => pts([P(x1, v1), P(x2, v1), P(x2, v2), P(x1, v2)]);
/** Círculo de radio r apoyado en el plano → elipse en pantalla. */
const elip = (x: number, v: number, r: number) => {
  const [cx, cy] = P(x, v);
  const s = esc(v);
  return { cx, cy, rx: r * s, ry: r * s * ((PF - PB) / PDEP) };
};
/** Profundidad (Δv) equivalente a `u` unidades físicas. */
const dv = (u: number) => u / PDEP;

function EscenaCubierta({ decor = true }: { decor?: boolean }) {
  return (
    <>
      <rect x={0} y={0} width={W} height={PB} className="i-muro" />
      <rect x={0} y={0} width={W} height={34} className="i-mueble" />
      <rect x={0} y={0} width={W} height={34} className="i-modelado" />
      <line x1={186} y1={2} x2={186} y2={32} className="i-junta" />
      <line x1={374} y1={2} x2={374} y2={32} className="i-junta" />
      <Cinta x1={0} x2={W} y={34} h={90} />
      <polygon points={pts([[0, PB], [W, PB], [W, PF], [0, PF]])} className="i-cubierta c-cubierta-plano" />
      <polygon points={pts([[0, PB], [W, PB], [W, PF], [0, PF]])} className="c-cubierta-luz" />
      <rect x={0} y={PF} width={W} height={12} className="i-cubierta" />
      <line x1={0} y1={PF + 0.5} x2={W} y2={PF + 0.5} className="i-cubierta-canto" />
      <rect x={0} y={PF + 12} width={W} height={4} className="i-nicho" />
      <Cajones x1={0} x2={186} ys={[316, 360, 404]} />
      <Cajones x1={190} x2={370} ys={[316, 360, 404]} />
      <Cajones x1={374} x2={W} ys={[316, 360, 404]} />
      {decor && (
        <>
          {/* Tabla de picar y botella de aceite al fondo. */}
          <polygon points={quad(18, 118, 0.06, 0.3)} className="i-tabla c-tabla-plano" />
          <ellipse {...elip(52, 0.16, 9)} className="i-hoja" />
          <ellipse {...elip(70, 0.2, 7)} className="i-verde-c" />
          <g transform={`translate(${P(500, 0.12)[0]} ${P(500, 0.12)[1]})`}>
            <rect x={-6} y={-40} width={12} height={40} rx={3} className="c-botella" />
            <rect x={-2.5} y={-50} width={5} height={11} rx={1} className="c-botella" />
            <rect x={-6} y={-24} width={12} height={10} className="c-botella-etq" />
          </g>
          <g transform={`translate(${P(470, 0.1)[0]} ${P(470, 0.1)[1]})`}>
            <rect x={-5} y={-26} width={10} height={26} rx={2.5} className="c-frasco" />
          </g>
        </>
      )}
    </>
  );
}

/** Isla con cocción y campana suspendida: muro de listones al fondo, isla de
 *  piedra y nogal al frente. `x1–x2` es el tramo de la parrilla sobre la isla. */
const ISLA_Y = 232; // canto superior (frente) de la isla
function EscenaIsla({ detras }: { detras?: ReactNode }) {
  return (
    <>
      <Listones x1={0} x2={W} y1={0} y2={300} />
      <rect x={0} y={0} width={W} height={20} className="i-mueble" />
      <rect x={0} y={0} width={W} height={20} className="i-plafon" />
      <rect x={0} y={292} width={W} height={10} className="i-zoclo" />
      {/* Piso entre el muro y la isla. */}
      <rect x={0} y={302} width={W} height={74} className="i-piso" />
      {/* Lo que queda detrás de la isla (extractor retráctil guardado). */}
      {detras}
      {/* Isla: cubierta en perspectiva + frentes de cajones. */}
      <polygon points={pts([[64, ISLA_Y - 22], [496, ISLA_Y - 22], [520, ISLA_Y], [40, ISLA_Y]])} className="i-cubierta c-cubierta-plano" />
      <polygon points={pts([[64, ISLA_Y - 22], [496, ISLA_Y - 22], [520, ISLA_Y], [40, ISLA_Y]])} className="c-cubierta-luz" />
      <rect x={40} y={ISLA_Y} width={480} height={10} className="i-cubierta" />
      <line x1={40} y1={ISLA_Y + 0.5} x2={520} y2={ISLA_Y + 0.5} className="i-cubierta-canto" />
      <Cajones x1={44} x2={196} ys={[ISLA_Y + 10, ISLA_Y + 58, 366]} />
      <Cajones x1={200} x2={360} ys={[ISLA_Y + 10, ISLA_Y + 58, 366]} />
      <Cajones x1={364} x2={516} ys={[ISLA_Y + 10, ISLA_Y + 58, 366]} />
      <rect x={44} y={366} width={472} height={10} className="i-zoclo" />
      <g transform="translate(470 210) scale(0.9)">
        <Planta2 x={0} y={0} />
      </g>
    </>
  );
}

/** Parrilla de gas sobre la isla (vista casi de canto): rejilla, ollas y flama. */
function ParrillaIsla({ conVapor = true }: { conVapor?: boolean }) {
  const y = ISLA_Y - 12;
  return (
    <g>
      <polygon points={pts([[196, y - 6], [364, y - 6], [372, y + 6], [188, y + 6]])} className="c-vidrio-negro" />
      {[214, 252, 308, 346].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={13} ry={3} className="c-quemador" />
          <FlamaLado cx={x} y={y} w={20} />
        </g>
      ))}
      <rect x={190} y={y - 9} width={180} height={2.5} className="c-rejilla-lado" />
      <Olla cx={252} y={y - 7} w={34} h={26} />
      <Sarten cx={322} y={y - 7} w={34} />
      {conVapor && (
        <>
          <Vapor x={252} y={y - 36} />
          <Vapor x={322} y={y - 18} n={3} />
        </>
      )}
    </g>
  );
}

/** Barra de cocina (aparatos de mesa): cubierta corrida, alacenas arriba y el
 *  hueco libre x1–x2 sobre la cubierta. */
function EscenaBarra({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <>
      {/* Tres tramos de alacena; el aparato va sobre la cubierta del central. */}
      <TramoCubierta x1={0} x2={Math.min(186, x1 - 10)} base="cajones" />
      <TramoCubierta x1={Math.min(186, x1 - 10) + 4} x2={Math.max(374, x2 + 10) - 4} />
      <TramoCubierta x1={Math.max(374, x2 + 10)} x2={W} base="cajones" />
      <Planta2 x={70} y={236} />
      <Tablas x={478} y={236} />
      <Platos x={410} y={236} />
      <Luces xs={[90, 280, 470]} />
    </>
  );
}

/* ——— Estufas (alzado) ————————————————————————————————————————————— */

type TipoEstufa = "profesional" | "empotre" | "piso";

/** Estufa vista de frente con flama azul y horno que se abre. */
function Estufa({ x, w, tipo }: { x: number; w: number; tipo: TipoEstufa }) {
  const top = tipo === "empotre" ? 238 : 236;
  const quemadores = tipo === "profesional" ? 4 : 3;
  const xs = Array.from({ length: quemadores }, (_, k) => x + (w * (k + 0.5)) / quemadores);
  const roja = tipo === "profesional";
  return (
    <g>
      {/* Respaldo */}
      {tipo === "profesional" && <Acero x={x + 2} y={top - 24} w={w - 4} h={16} />}
      {tipo === "piso" && (
        <g>
          <Acero x={x + 2} y={top - 44} w={w - 4} h={36} />
          <rect x={x + w / 2 - 16} y={top - 34} width={32} height={10} rx={1.5} className="i-pantalla-negra" />
          <text x={x + w / 2} y={top - 26.5} textAnchor="middle" className="c-reloj">12:30</text>
          {[0.14, 0.26, 0.74, 0.86].map((f) => (
            <Perilla key={f} cx={x + w * f} cy={top - 26} r={5} />
          ))}
        </g>
      )}
      {/* Rejillas, quemadores y ollas */}
      <rect x={x} y={top - 8} width={w} height={8} className="c-cubierta-estufa" />
      {xs.map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={top - 7} rx={w / quemadores / 2 - 6} ry={2.2} className="c-quemador" />
          <FlamaLado cx={cx} y={top - 8} w={w / quemadores - 18} />
        </g>
      ))}
      <path
        d={`M${x + 2} ${top - 8} ${xs.map((cx) => `L${cx - 12} ${top - 8} L${cx - 10} ${top - 12} L${cx + 10} ${top - 12} L${cx + 12} ${top - 8}`).join(" ")} L${x + w - 2} ${top - 8}`}
        className="c-rejilla-lado"
      />
      <Olla cx={xs[0]} y={top - 12} w={36} h={28} tapa />
      <Sarten cx={xs[xs.length - 1] - 4} y={top - 12} w={38} />
      <Vapor x={xs[0]} y={top - 46} n={3} />
      {/* Cuerpo */}
      <Acero x={x} y={top} w={w} h={366 - top} />
      {tipo === "empotre" && (
        // Slide-in: los costados se apoyan sobre la cubierta.
        <>
          <rect x={x - 5} y={top - 3} width={w + 10} height={4} rx={1} fill="url(#ilus-cromo-h)" className="i-panel" />
        </>
      )}
      {/* Tablero de controles al frente (profesional y empotre) */}
      {tipo !== "piso" && (
        <g>
          <rect x={x + 2} y={top + 3} width={w - 4} height={22} className="c-tablero" />
          {(tipo === "profesional" ? [0.07, 0.15, 0.23, 0.31, 0.69, 0.77, 0.85, 0.93] : [0.12, 0.24, 0.36, 0.64, 0.76, 0.88]).map((f) => (
            <Perilla key={f} cx={x + w * f} cy={top + 14} r={tipo === "profesional" ? 6 : 5} roja={roja} />
          ))}
          <rect x={x + w / 2 - 15} y={top + 9} width={30} height={10} rx={1.5} className="i-pantalla-negra" />
          <text x={x + w / 2} y={top + 16.5} textAnchor="middle" className="c-reloj">
            {tipo === "profesional" ? "350°" : "12:30"}
          </text>
        </g>
      )}
      {/* Zoclo: rejilla profesional o cajón de guardado */}
      {tipo === "profesional" ? (
        <g>
          <rect x={x + 2} y={348} width={w - 4} height={18} className="c-zoclo-estufa" />
          {Array.from({ length: Math.floor((w - 20) / 10) }, (_, k) => (
            <rect key={k} x={x + 10 + k * 10} y={353} width={6} height={8} rx={1} className="c-ranura" />
          ))}
        </g>
      ) : (
        <g>
          <line x1={x + 4} y1={342} x2={x + w - 4} y2={342} className="c-junta-acero" />
          <rect x={x + w * 0.3} y={350} width={w * 0.4} height={3} rx={1.5} className="i-manija" />
        </g>
      )}
    </g>
  );
}

/** Puertas del horno de la estufa (rect en escena) por tipo. */
function puertasEstufa(x: number, w: number, tipo: TipoEstufa): Rect[] {
  const y = tipo === "piso" ? 244 : 266;
  const h = (tipo === "profesional" ? 346 : 340) - y;
  if (tipo === "profesional") {
    const g = w * 0.62;
    return [
      { x: x + 4, y, w: g - 6, h },
      { x: x + g + 2, y, w: w - g - 6, h },
    ];
  }
  return [{ x: x + 4, y, w: w - 8, h }];
}

/* ——— Interiores y frentes con bisagra abajo (hornos) ———————————————————— */

type Variante = "normal" | "conveccion" | "vapor" | "multifuncion" | "micro" | "cafe";

/** Cavidad de horno en perspectiva: esmalte oscuro, rieles, charola con
 *  comida y luz; el velo la oscurece hasta que se abre. */
function CavidadHorno({ r, variante = "normal", comida = "pollo" }: { r: Rect; variante?: Variante; comida?: "pollo" | "pan" | "verduras" | "nada" }) {
  const dx = r.w * 0.13;
  const dy = r.h * 0.15;
  const b = { x: r.x + dx, y: r.y + dy, w: r.w - 2 * dx, h: r.h - 2 * dy };
  const pisoY = r.y + r.h * 0.78;
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} className="c-cavidad" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#c-horno-fondo)" />
      <polygon points={pts([[r.x, r.y], [b.x, b.y], [b.x, b.y + b.h], [r.x, r.y + r.h]])} className="c-cavidad-lado" />
      <polygon points={pts([[r.x + r.w, r.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [r.x + r.w, r.y + r.h]])} className="c-cavidad-lado" />
      <polygon points={pts([[r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]])} className="c-cavidad-piso" />
      {/* Luz interior */}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#c-horno-luz)" className="c-luz-horno" />
      {variante === "conveccion" && (
        <g>
          <circle cx={r.x + r.w / 2} cy={b.y + b.h * 0.45} r={Math.min(b.w, b.h) * 0.3} className="c-ventilador-reja" />
          <g className="c-ventilador" style={{ transformOrigin: `${r.x + r.w / 2}px ${b.y + b.h * 0.45}px` } as CSSProperties}>
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path
                key={a}
                d={`M${r.x + r.w / 2} ${b.y + b.h * 0.45} q 4 -${Math.min(b.w, b.h) * 0.12} 0 -${Math.min(b.w, b.h) * 0.26}`}
                transform={`rotate(${a} ${r.x + r.w / 2} ${b.y + b.h * 0.45})`}
                className="c-aspa"
              />
            ))}
          </g>
          <Aire
            trazos={[
              `M${b.x + 6} ${b.y + b.h * 0.2} q ${b.w * 0.25} -10 ${b.w * 0.42} 0`,
              `M${b.x + b.w - 6} ${b.y + b.h * 0.75} q -${b.w * 0.25} 10 -${b.w * 0.42} 0`,
            ]}
          />
        </g>
      )}
      {variante === "multifuncion" && (
        <path
          d={`M${b.x + 4} ${b.y + 4} ${Array.from({ length: 8 }, (_, k) => `L${b.x + 4 + ((b.w - 8) * (k + 0.5)) / 8} ${b.y + (k % 2 ? 4 : 9)}`).join(" ")} L${b.x + b.w - 4} ${b.y + 4}`}
          className="c-resistencia"
        />
      )}
      {variante === "micro" && <ellipse cx={r.x + r.w / 2} cy={pisoY + 4} rx={r.w * 0.34} ry={4} className="c-plato-giratorio" />}
      {/* Riel y charola */}
      {variante !== "micro" && variante !== "cafe" && (
        <>
          <line x1={r.x + 3} y1={pisoY} x2={r.x + r.w - 3} y2={pisoY} className="c-riel" />
          <polygon points={pts([[r.x + r.w * 0.2, pisoY - 2], [r.x + r.w * 0.8, pisoY - 2], [r.x + r.w * 0.76, pisoY - 7], [r.x + r.w * 0.24, pisoY - 7]])} className="c-charola" />
        </>
      )}
      {comida === "pollo" && (
        <g>
          <ellipse cx={r.x + r.w / 2} cy={pisoY - 12} rx={r.w * 0.14} ry={r.h * 0.11} className="c-pollo" />
          <ellipse cx={r.x + r.w / 2 - r.w * 0.04} cy={pisoY - 16} rx={r.w * 0.05} ry={r.h * 0.035} className="c-brillo-comida" />
          <circle cx={r.x + r.w * 0.33} cy={pisoY - 9} r={3} className="i-limon" />
          <circle cx={r.x + r.w * 0.67} cy={pisoY - 9} r={3} className="i-verde" />
        </g>
      )}
      {comida === "pan" && (
        <g>
          {[0.36, 0.5, 0.64].map((f) => (
            <ellipse key={f} cx={r.x + r.w * f} cy={pisoY - 10} rx={r.w * 0.06} ry={r.h * 0.06} className="c-pan" />
          ))}
        </g>
      )}
      {comida === "verduras" && (
        <g>
          {[0.38, 0.46, 0.54, 0.62].map((f, k) => (
            <circle key={f} cx={r.x + r.w * f} cy={pisoY - 9 - (k % 2)} r={r.h * 0.05} className={k % 2 ? "i-verde" : "c-zanahoria"} />
          ))}
        </g>
      )}
      {variante === "vapor" && <Vapor x={r.x + r.w / 2} y={pisoY - 24} n={5} ancho={r.w * 0.12} />}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} className="ilus-apagado" />
    </g>
  );
}

interface CaraOpc {
  acabado?: "acero" | "negro";
  /** Ventana: proporciones del marco (lados, arriba, abajo) */
  ventana?: boolean;
  manija?: "tubo" | "barra-v" | "ninguna" | "superior";
  /** Banda de control arriba (horno de pared). */
  control?: boolean;
  logo?: boolean;
}

/** Frente de puerta (svg con viewBox w×h) y su reverso. */
function CaraPuerta({ w, h, o }: { w: number; h: number; o: CaraOpc }) {
  const mx = w * 0.1;
  const my1 = o.control ? h * 0.24 : h * 0.16;
  const my2 = h * 0.12;
  return (
    <svg className="ilus-cara" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {o.acabado === "negro" ? <VidrioNegro x={0.5} y={0.5} w={w - 1} h={h - 1} /> : <Acero x={0.5} y={0.5} w={w - 1} h={h - 1} />}
      {o.control && (
        <g>
          <rect x={w * 0.36} y={h * 0.05} width={w * 0.28} height={h * 0.1} rx={1.5} className="c-pantalla" />
          <text x={w / 2} y={h * 0.05 + h * 0.075} textAnchor="middle" className="c-reloj c-reloj-on">
            220°
          </text>
          {[0.14, 0.86].map((f) => (
            <circle key={f} cx={w * f} cy={h * 0.1} r={Math.min(6, h * 0.06)} className="c-perilla" />
          ))}
        </g>
      )}
      {o.ventana !== false && (
        <rect x={mx} y={my1} width={w - 2 * mx} height={h - my1 - my2} rx={2} className="c-ventana" />
      )}
      {o.ventana !== false && <polygon points={pts([[mx + 6, my1], [mx + (w - 2 * mx) * 0.4, my1], [mx + 4, h - my2]])} className="c-reflejo" />}
      {o.manija === "tubo" && <Tubo x={w * 0.1} y={o.control ? h * 0.19 : 5} w={w * 0.8} />}
      {o.manija === "superior" && <rect x={w * 0.2} y={3} width={w * 0.6} height={3} rx={1.5} className="i-manija i-manija-h" fill="url(#ilus-cromo-h)" />}
      {o.manija === "barra-v" && (
        <g>
          <rect x={w - 12} y={h * 0.15} width={4} height={h * 0.7} rx={2} className="i-manija-sombra" />
          <rect x={w - 14} y={h * 0.15} width={4} height={h * 0.7} rx={2} fill="url(#ilus-cromo)" className="i-manija" />
        </g>
      )}
      {o.logo && <rect x={w / 2 - 10} y={h - 7} width={20} height={1.6} rx={0.8} className="c-logo" />}
    </svg>
  );
}

/** Cara interior de la puerta ya abatida: trapecio que se acerca (más ancho
 *  abajo), con su ventana y el empaque. */
function PuertaAbatida({ r, k }: { r: Rect; k: number }) {
  const h = Math.max(26, r.h * 0.42);
  const s = Math.min(14, r.w * 0.07); // ensanche por perspectiva
  const w = r.w + 2 * s;
  return (
    <svg
      className="ilus-capa c-puerta-abatida"
      style={{ ...caja({ x: r.x - s, y: r.y + r.h - 1, w, h }), "--k": k } as CSSProperties}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={`${s},0 ${w - s},0 ${w},${h} 0,${h}`} className="c-forro-horno" />
      <polygon points={`${s + r.w * 0.1},${h * 0.12} ${w - s - r.w * 0.1},${h * 0.12} ${w - r.w * 0.08},${h * 0.84} ${r.w * 0.08},${h * 0.84}`} className="c-ventana-int" />
      <polygon points={`${s + 3},2 ${w - s - 3},2 ${w - 4},${h - 3} 4,${h - 3}`} className="c-empaque" />
      {/* Canto de acero que queda de frente */}
      <rect x={0} y={h - 4} width={w} height={4} fill="url(#ilus-cromo-h)" className="i-panel" />
    </svg>
  );
}

/** Puerta abatible hacia abajo (hornos, estufas, speed oven): el frente se
 *  pliega sobre la bisagra y aparece la cara interior hacia el frente. */
function PuertaAbajo({ r, o, k = 0 }: { r: Rect; o: CaraOpc; k?: number }) {
  return (
    <>
      <PuertaAbatida r={r} k={k} />
      <span className="ilus-capa c-puerta-x" style={{ ...caja(r), "--k": k } as CSSProperties}>
        <CaraPuerta w={r.w} h={r.h} o={o} />
      </span>
    </>
  );
}

/** Puerta con bisagra lateral (microondas, horno French Door). */
function PuertaLado({ r, o, lado }: { r: Rect; o: CaraOpc; lado: "l" | "r" }) {
  return (
    <span className={`ilus-capa ilus-puerta ilus-puerta--${lado} c-puerta-lado`} style={caja(r)}>
      <CaraPuerta w={r.w} h={r.h} o={o} />
      <svg className="ilus-cara ilus-reverso" viewBox={`0 0 ${r.w} ${r.h}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x={0.5} y={0.5} width={r.w - 1} height={r.h - 1} className="c-forro-horno" />
        <rect x={r.w * 0.1} y={r.h * 0.14} width={r.w * 0.8} height={r.h * 0.7} rx={3} className="c-ventana-int" />
      </svg>
    </span>
  );
}

/** Cajón que sale (frente + caja con su contenido encima). */
function CajonSale({ r, contenido, o, k = 0 }: { r: Rect; contenido: "platos" | "vacio" | "plato-micro"; o: CaraOpc; k?: number }) {
  const cw = r.w - 10;
  return (
    <>
      <svg className="ilus-capa c-caja" style={{ ...caja({ x: r.x + 5, y: r.y - 16, w: cw, h: 24 }), zIndex: 8 + k * 2 }} viewBox={`0 0 ${cw} 24`} preserveAspectRatio="none" aria-hidden="true">
        <polygon points={`0,24 ${cw},24 ${cw - 10},2 10,2`} className={contenido === "vacio" ? "c-caja-vacio" : "c-caja-int"} />
        {contenido === "platos" &&
          [0.3, 0.5, 0.7].map((f) => (
            <g key={f}>
              {[0, 2, 4].map((d) => (
                <ellipse key={d} cx={cw * f} cy={15 - d} rx={cw * 0.08} ry={3} className="c-plato-caliente" />
              ))}
            </g>
          ))}
        {contenido === "platos" && (
          <g className="c-calor">
            {[0.3, 0.5, 0.7].map((f) => (
              <path key={f} d={`M${cw * f - 4} 6 q 2 -3 0 -6 M${cw * f + 4} 6 q 2 -3 0 -6`} className="c-calor-onda" />
            ))}
          </g>
        )}
        {contenido === "vacio" && (
          <g>
            <rect x={cw * 0.3} y={8} width={cw * 0.4} height={12} rx={3} className="c-bolsa" />
            <rect x={cw * 0.38} y={11} width={cw * 0.24} height={6} rx={2} className="c-zanahoria" />
            <rect x={cw * 0.08} y={4} width={cw * 0.84} height={4} rx={1.5} className="c-tapa-vidrio" />
          </g>
        )}
        {contenido === "plato-micro" && (
          <g>
            <ellipse cx={cw / 2} cy={16} rx={cw * 0.22} ry={5} className="c-plato-giratorio" />
            {[0.42, 0.48, 0.54, 0.6].map((f, q) => (
              <circle key={f} cx={cw * f} cy={14 - (q % 2)} r={2.6} className={q % 2 ? "i-verde" : "c-zanahoria"} />
            ))}
          </g>
        )}
      </svg>
      <span className="ilus-capa c-cajon" style={{ ...caja(r), zIndex: 9 + k * 2, "--k": k } as CSSProperties}>
        <svg viewBox={`0 0 ${r.w} ${r.h}`} preserveAspectRatio="none" aria-hidden="true">
          {o.acabado === "negro" ? <VidrioNegro x={0.5} y={0.5} w={r.w - 1} h={r.h - 1} /> : <Acero x={0.5} y={0.5} w={r.w - 1} h={r.h - 1} />}
          {o.manija !== "ninguna" && <Tubo x={r.w * 0.2} y={7} w={r.w * 0.6} />}
          {o.control && <rect x={r.w * 0.4} y={4} width={r.w * 0.2} height={5} rx={1} className="c-pantalla" />}
        </svg>
      </span>
    </>
  );
}

/* ——— Parrillas (cubierta en perspectiva) ———————————————————————————— */

interface Quemador {
  x: number;
  v: number;
  r: number;
  /** Zona de inducción / vitro en vez de quemador. */
  zona?: "induccion" | "vitro";
}

/** Quemador de gas sobre el plano: base, tapa y la corona de flama. */
function QuemadorPlano({ q, laton }: { q: Quemador; laton?: boolean }) {
  const e = elip(q.x, q.v, q.r);
  const t = elip(q.x, q.v, q.r * 0.55);
  return (
    <g>
      <ellipse {...e} className="c-quemador-base" />
      <ellipse {...e} rx={e.rx * 0.82} ry={e.ry * 0.82} className={laton ? "c-anillo-laton" : "c-anillo"} />
      <ellipse {...t} className="c-tapa-quemador" />
      <Corona cx={e.cx} cy={e.cy} rx={e.rx * 0.84} ry={e.ry * 0.84} />
    </g>
  );
}

/** Zona de inducción (azul claro) o vitrocerámica (rojo) en el plano. */
function ZonaPlano({ q }: { q: Quemador }) {
  const e = elip(q.x, q.v, q.r);
  const tipo = q.zona === "vitro" ? "vitro" : "ind";
  return (
    <g>
      <ellipse {...e} className={`c-zona c-zona--${tipo}`} />
      <ellipse {...e} rx={e.rx * 0.62} ry={e.ry * 0.62} className={`c-zona-anillo c-zona-anillo--${tipo}`} />
      <ellipse {...e} className={`c-zona-calor c-zona-calor--${tipo}`} fill={`url(#c-${tipo})`} />
      <ellipse {...e} rx={e.rx * 1.02} ry={e.ry * 1.02} className={`c-zona-borde c-zona-borde--${tipo}`} />
    </g>
  );
}

/** Rejilla de hierro sobre un rectángulo del plano (x1–x2 · v1–v2), con `n` dedos. */
function Rejilla({ x1, x2, v1, v2, cols = 1 }: { x1: number; x2: number; v1: number; v2: number; cols?: number }) {
  const lineas: string[] = [];
  const paso = (x2 - x1) / cols;
  for (let c = 0; c <= cols; c++) lineas.push(`M${P(x1 + c * paso, v1).join(" ")} L${P(x1 + c * paso, v2).join(" ")}`);
  lineas.push(`M${P(x1, v1).join(" ")} L${P(x2, v1).join(" ")}`);
  lineas.push(`M${P(x1, v2).join(" ")} L${P(x2, v2).join(" ")}`);
  const vm = (v1 + v2) / 2;
  lineas.push(`M${P(x1, vm).join(" ")} L${P(x2, vm).join(" ")}`);
  return (
    <g>
      <path d={lineas.join(" ")} className="c-rejilla" />
      <path d={lineas.join(" ")} className="c-rejilla-brillo" />
    </g>
  );
}

/** Olla vista desde arriba-frente sobre un punto del plano. */
function OllaPlano({ x, v, r, alto = 26, sarten }: { x: number; v: number; r: number; alto?: number; sarten?: boolean }) {
  const [cx, cy] = P(x, v);
  const s = esc(v);
  if (sarten) {
    // Sartén vista desde arriba: fondo, borde y mango hacia el frente-derecha.
    const e = elip(x, v, r);
    return (
      <g>
        <path d={`M${e.cx + e.rx * 0.8} ${e.cy + e.ry * 0.4} L${e.cx + e.rx * 1.9} ${e.cy + e.ry * 1.1}`} className="c-mango-plano" />
        <ellipse cx={e.cx} cy={e.cy - 2} rx={e.rx} ry={e.ry} className="c-sarten-borde" />
        <ellipse cx={e.cx} cy={e.cy - 1} rx={e.rx * 0.84} ry={e.ry * 0.8} className="c-sarten-fondo" />
        <ellipse cx={e.cx - e.rx * 0.25} cy={e.cy - 2} rx={e.rx * 0.3} ry={e.ry * 0.22} className="c-brillo-comida" />
      </g>
    );
  }
  return <Olla cx={cx} y={cy + 3} w={r * 2 * s} h={alto * s} />;
}

/** Placa (vidrio negro o acero) sobre la cubierta con su canto. */
function Placa({ x1, x2, v1, v2, acabado = "vidrio", marco }: { x1: number; x2: number; v1: number; v2: number; acabado?: "vidrio" | "acero"; marco?: boolean }) {
  const [, yf] = P(x1, v2);
  const [xa] = P(x1, v2);
  const [xb] = P(x2, v2);
  return (
    <g>
      {marco && <polygon points={quad(x1 - 8, x2 + 8, v1 - dv(8), v2 + dv(8))} className="c-marco-placa" />}
      <polygon points={quad(x1, x2, v1, v2)} className={acabado === "vidrio" ? "c-vidrio-negro" : "c-acero-plano"} fill={acabado === "acero" ? "url(#dgm-acero)" : undefined} />
      {acabado === "acero" && <polygon points={quad(x1, x2, v1, v2)} fill="url(#ilus-acero-luz)" className="i-acero-luz" />}
      {acabado === "vidrio" && <polygon points={pts([P(x1 + (x2 - x1) * 0.55, v1), P(x1 + (x2 - x1) * 0.75, v1), P(x1 + (x2 - x1) * 0.42, v2), P(x1 + (x2 - x1) * 0.22, v2)])} className="c-reflejo" />}
      <rect x={xa} y={yf} width={xb - xa} height={3} className={acabado === "vidrio" ? "c-canto-vidrio" : "c-canto-acero"} />
    </g>
  );
}

/** Controles táctiles al frente de una placa de vidrio (se iluminan al encender). */
function Tactil({ x1, x2, v }: { x1: number; x2: number; v: number }) {
  const n = 7;
  return (
    <g>
      {Array.from({ length: n }, (_, k) => {
        const e = elip(x1 + ((x2 - x1) * (k + 0.5)) / n, v, 4);
        return <ellipse key={k} {...e} className="c-tactil" />;
      })}
      <rect x={P((x1 + x2) / 2 - 16, v)[0]} y={P(0, v)[1] - 2.5} width={32 * esc(v)} height={5} rx={1} className="c-pantalla" />
    </g>
  );
}

/** Ranura de extracción descendente en el plano + aire que baja hacia ella. */
function Extractor({ x1, x2, v1, v2, ollas }: { x1: number; x2: number; v1: number; v2: number; ollas: [number, number][] }) {
  const lam: string[] = [];
  for (let k = 1; k < 8; k++) lam.push(`M${P(x1 + ((x2 - x1) * k) / 8, v1).join(" ")} L${P(x1 + ((x2 - x1) * k) / 8, v2).join(" ")}`);
  const [cx, cy] = P((x1 + x2) / 2, (v1 + v2) / 2);
  return (
    <g>
      <polygon points={quad(x1, x2, v1, v2)} className="c-extractor" />
      <path d={lam.join(" ")} className="c-extractor-lama" />
      <Aire trazos={ollas.map(([ox, oy]) => `M${ox} ${oy} C ${ox} ${oy - 26}, ${(ox + cx) / 2} ${cy - 40}, ${cx} ${cy}`)} />
    </g>
  );
}

type TipoParrilla = "profesional" | "tradicional" | "gas" | "vitro" | "induccion" | "extraccion" | "hibrida" | "submontar" | "invisible" | "modular" | "superficie";

function Parrilla({ tipo }: { tipo: TipoParrilla }) {
  const x1 = 140;
  const x2 = 420;
  const v1 = 0.24;
  const v2 = 0.8;
  const ancho = x2 - x1;
  const cuatro = (zona?: Quemador["zona"], r = 40): Quemador[] => [
    { x: x1 + ancho * 0.27, v: v1 + (v2 - v1) * 0.3, r: r * 0.85, zona },
    { x: x1 + ancho * 0.73, v: v1 + (v2 - v1) * 0.3, r: r * 0.75, zona },
    { x: x1 + ancho * 0.27, v: v1 + (v2 - v1) * 0.72, r: r * 0.7, zona },
    { x: x1 + ancho * 0.73, v: v1 + (v2 - v1) * 0.72, r: r, zona },
  ];
  const olla = (q: Quemador, sarten?: boolean) => <OllaPlano x={q.x} v={q.v} r={q.r * 0.82} sarten={sarten} />;
  const vaporDe = (q: Quemador) => {
    const [cx, cy] = P(q.x, q.v);
    return <Vapor x={cx} y={cy - 34 * esc(q.v)} n={3} ancho={12} />;
  };

  if (tipo === "profesional") {
    // Rangetop: acero, 6 quemadores con rejilla continua y perillas rojas al frente.
    const qs: Quemador[] = [0.17, 0.5, 0.83].flatMap((f) => [
      { x: x1 + ancho * f, v: v1 + (v2 - v1) * 0.28, r: 30 },
      { x: x1 + ancho * f, v: v1 + (v2 - v1) * 0.74, r: 33 },
    ]);
    const [fx1, fy] = P(x1 - 10, 1);
    const [fx2] = P(x2 + 10, 1);
    return (
      <g>
        <polygon points={quad(x1 - 10, x2 + 10, v1 - dv(10), 1)} fill="url(#dgm-acero)" className="i-panel" />
        <polygon points={quad(x1 - 10, x2 + 10, v1 - dv(10), 1)} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
        {qs.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} laton />
        ))}
        <Rejilla x1={x1 - 2} x2={x2 + 2} v1={v1} v2={v2 + dv(6)} cols={3} />
        {olla(qs[3])}
        {vaporDe(qs[3])}
        {/* Frente de perillas sobre el canto de la cubierta */}
        <Acero x={fx1} y={fy} w={fx2 - fx1} h={30} />
        {[0.06, 0.18, 0.3, 0.42, 0.58, 0.7, 0.82, 0.94].map((f) => (
          <Perilla key={f} cx={fx1 + (fx2 - fx1) * f} cy={fy + 15} r={7} roja />
        ))}
      </g>
    );
  }
  if (tipo === "tradicional") {
    const qs = cuatro(undefined, 38);
    return (
      <g>
        <Placa x1={x1} x2={x2} v1={v1} v2={v2} acabado="acero" marco />
        {qs.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} />
        ))}
        <Rejilla x1={x1 + 8} x2={x2 - 8} v1={v1 + 0.03} v2={v2 - 0.03} cols={2} />
        {[0.08, 0.92].flatMap((f) => [f]).map((f) => (
          <ellipse key={f} {...elip(x1 + ancho * f, v2 - 0.04, 9)} className="c-perilla" />
        ))}
        {olla(qs[3])}
        {vaporDe(qs[3])}
      </g>
    );
  }
  if (tipo === "gas") {
    const qs: Quemador[] = [...cuatro(undefined, 32).map((q, i) => ({ ...q, x: i % 2 ? q.x + 18 : q.x - 18 })), { x: (x1 + x2) / 2, v: (v1 + v2) / 2, r: 44 }];
    return (
      <g>
        <Placa x1={x1 - 20} x2={x2 + 20} v1={v1} v2={v2} />
        {qs.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} />
        ))}
        <Rejilla x1={x1 - 14} x2={x2 + 14} v1={v1 + 0.03} v2={v2 - 0.03} cols={3} />
        {olla(qs[4], true)}
        {[0.1, 0.22, 0.78, 0.9].map((f) => (
          <ellipse key={f} {...elip(x1 - 20 + (ancho + 40) * f, v2 + 0.08, 7)} className="c-perilla" />
        ))}
      </g>
    );
  }
  if (tipo === "vitro" || tipo === "induccion" || tipo === "extraccion") {
    const zona = tipo === "vitro" ? "vitro" : "induccion";
    const qs = cuatro(zona, 42);
    const ollas: [number, number][] = [];
    if (tipo === "extraccion") {
      qs[0].x -= 20;
      qs[2].x -= 20;
      qs[1].x += 20;
      qs[3].x += 20;
    }
    return (
      <g>
        <Placa x1={x1 - (tipo === "extraccion" ? 24 : 0)} x2={x2 + (tipo === "extraccion" ? 24 : 0)} v1={v1} v2={v2} />
        {qs.map((q) => (
          <ZonaPlano key={`${q.x}-${q.v}`} q={q} />
        ))}
        <Tactil x1={x1 + 50} x2={x2 - 50} v={v2 - 0.035} />
        {olla(qs[0])}
        {olla(qs[3], true)}
        {tipo === "extraccion" &&
          (() => {
            const [ox, oy] = P(qs[0].x, qs[0].v);
            ollas.push([ox, oy - 30 * esc(qs[0].v)]);
            const [sx, sy] = P(qs[3].x, qs[3].v);
            ollas.push([sx, sy - 10]);
            return <Extractor x1={(x1 + x2) / 2 - 18} x2={(x1 + x2) / 2 + 18} v1={v1 + 0.05} v2={v2 - 0.08} ollas={ollas} />;
          })()}
        {tipo !== "extraccion" && vaporDe(qs[0])}
      </g>
    );
  }
  if (tipo === "hibrida") {
    const gas = cuatro(undefined, 36).filter((_, i) => i % 2 === 0);
    const ind = cuatro("induccion", 42).filter((_, i) => i % 2 === 1);
    return (
      <g>
        <Placa x1={x1} x2={x2} v1={v1} v2={v2} />
        {ind.map((q) => (
          <ZonaPlano key={`${q.x}-${q.v}`} q={q} />
        ))}
        {gas.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} />
        ))}
        <Rejilla x1={x1 + 6} x2={(x1 + x2) / 2 - 6} v1={v1 + 0.03} v2={v2 - 0.03} />
        <Tactil x1={(x1 + x2) / 2 + 10} x2={x2 - 10} v={v2 - 0.035} />
        {olla(gas[1])}
        {vaporDe(gas[1])}
        {olla(ind[1], true)}
      </g>
    );
  }
  if (tipo === "submontar") {
    // Quemadores sueltos directo en la piedra, cada uno con su rejilla y perilla.
    const qs: Quemador[] = [
      { x: 170, v: 0.38, r: 32 },
      { x: 280, v: 0.36, r: 36 },
      { x: 390, v: 0.38, r: 32 },
      { x: 220, v: 0.68, r: 34 },
      { x: 340, v: 0.68, r: 34 },
    ];
    return (
      <g>
        {qs.map((q) => {
          const r = q.r * 1.05;
          return (
            <g key={`${q.x}-${q.v}`}>
              <QuemadorPlano q={q} laton />
              <Rejilla x1={q.x - r} x2={q.x + r} v1={q.v - dv(r * 0.95)} v2={q.v + dv(r * 0.95)} />
            </g>
          );
        })}
        {[0.2, 0.33, 0.46, 0.59, 0.72].map((f) => (
          <ellipse key={f} {...elip(110 + 340 * f, 0.92, 6)} className="c-perilla" />
        ))}
        <OllaPlano x={340} v={0.68} r={28} />
        {vaporDe(qs[4])}
      </g>
    );
  }
  if (tipo === "invisible") {
    // La piedra no cambia: al encender se ven las zonas a través de ella.
    const qs = cuatro("induccion", 42);
    return (
      <g>
        {qs.map((q) => {
          const e = elip(q.x, q.v, q.r);
          return (
            <g key={`${q.x}-${q.v}`}>
              <ellipse {...e} className="c-zona-calor c-zona-calor--ind c-zona-invisible" fill="url(#c-ind)" />
              <ellipse {...e} className="c-zona-borde c-zona-borde--ind" />
            </g>
          );
        })}
        <g className="c-tactil-invisible">
          {Array.from({ length: 5 }, (_, k) => (
            <ellipse key={k} {...elip(240 + k * 20, v2 + 0.04, 3.4)} className="c-tactil" />
          ))}
        </g>
        {olla(qs[0])}
        {vaporDe(qs[0])}
        {olla(qs[3], true)}
      </g>
    );
  }
  if (tipo === "modular" || tipo === "superficie") {
    // Módulos de 15″: gas wok · (extractor) · teppanyaki · inducción.
    const mods = tipo === "superficie" ? [96, 196, 236, 336, 376, 476] : [100, 220, 230, 350, 360, 480];
    const [ga1, ga2, te1, te2, in1, in2] = mods;
    const wok: Quemador = { x: (ga1 + ga2) / 2, v: 0.52, r: 40 };
    const zonas: Quemador[] = [
      { x: (in1 + in2) / 2, v: 0.38, r: 34, zona: "induccion" },
      { x: (in1 + in2) / 2, v: 0.68, r: 38, zona: "induccion" },
    ];
    const ollas: [number, number][] = [];
    const [wx, wy] = P(wok.x, wok.v);
    ollas.push([wx, wy - 20]);
    return (
      <g>
        <Placa x1={ga1} x2={ga2} v1={v1} v2={v2} />
        <QuemadorPlano q={wok} laton />
        <Rejilla x1={ga1 + 8} x2={ga2 - 8} v1={v1 + 0.04} v2={v2 - 0.04} />
        <Placa x1={te1} x2={te2} v1={v1} v2={v2} acabado="acero" />
        <polygon points={quad(te1 + 8, te2 - 8, v1 + 0.04, v2 - 0.06)} className="c-teppan" />
        <polygon points={quad(te1 + 8, te2 - 8, v1 + 0.04, v2 - 0.06)} fill="url(#c-teppan-calor)" className="c-teppan-calor" />
        <Placa x1={in1} x2={in2} v1={v1} v2={v2} />
        {zonas.map((q) => (
          <ZonaPlano key={q.v} q={q} />
        ))}
        {[ga1, te1, in1].map((m) => (
          <g key={m}>
            <ellipse {...elip(m + 30, v2 + 0.06, 6)} className="c-perilla" />
            <ellipse {...elip(m + 90, v2 + 0.06, 6)} className="c-perilla" />
          </g>
        ))}
        <Sarten cx={wx} y={wy + 2} w={60 * esc(wok.v)} />
        {(() => {
          const [px, py] = P(zonas[1].x, zonas[1].v);
          ollas.push([px, py - 26]);
          return <Olla cx={px} y={py + 3} w={54 * esc(zonas[1].v)} h={24} />;
        })()}
        {tipo === "superficie" ? (
          <Extractor x1={ga2 + 6} x2={te1 - 6} v1={v1 + 0.02} v2={v2 - 0.02} ollas={ollas} />
        ) : (
          <>
            <Vapor x={wx} y={wy - 22} n={3} />
            <g className="c-calor">
              {[0.35, 0.5, 0.65].map((f) => {
                const [hx, hy] = P(te1 + (te2 - te1) * f, 0.5);
                return <path key={f} d={`M${hx} ${hy} q 3 -5 0 -10 q -3 -5 0 -10`} className="c-calor-onda" />;
              })}
            </g>
          </>
        )}
      </g>
    );
  }
  return null;
}

/* ——— Campanas ——————————————————————————————————————————————————— */

type TipoCampana =
  | "pared" | "isla" | "recta" | "t-invertida" | "cristal" | "piramidal" | "cilindrica" | "inserto" | "bajo-mueble"
  | "slider" | "revestir" | "techo" | "decorativa" | "retractil" | "gran-formato" | "repisa" | "monolith" | "airwall";

/** Luz de la campana (cono sobre la cocción) + tira LED, se encienden juntas. */
function LuzCampana({ x1, x2, y, piso, ancho = 1.15 }: { x1: number; x2: number; y: number; piso: number; ancho?: number }) {
  const cx = (x1 + x2) / 2;
  const w = (x2 - x1) * ancho;
  return (
    <g className="c-luz">
      <polygon points={pts([[x1 + 6, y], [x2 - 6, y], [cx + w / 2, piso], [cx - w / 2, piso]])} fill="url(#c-cono-led)" />
      <line x1={x1 + 8} y1={y + 0.6} x2={x2 - 8} y2={y + 0.6} className="c-led" />
    </g>
  );
}

/** Aire que sube de las ollas a la boca de captación (x1–x2 · y). */
function AireCampana({ x1, x2, y, desde }: { x1: number; x2: number; y: number; desde: [number, number][] }) {
  const cx = (x1 + x2) / 2;
  return (
    <Aire
      trazos={desde.flatMap(([ox, oy], k) => [
        `M${ox} ${oy} C ${ox - 8} ${oy - 20}, ${ox + 10} ${(oy + y) / 2}, ${ox + (cx - ox) * 0.4} ${y + 4}`,
        `M${ox + 6} ${oy} C ${ox + 14} ${oy - 18}, ${ox - 6} ${(oy + y) / 2 + (k ? 6 : -6)}, ${ox + (cx - ox) * 0.6} ${y + 4}`,
      ])}
    />
  );
}

/** Campana de pared u otras sobre la estufa en alzado; devuelve la boca (x1,x2,y). */
function CampanaPared({ tipo, cx, ancho }: { tipo: TipoCampana; cx: number; ancho: number }): { el: ReactElement; boca: [number, number, number]; ducto?: [number, number, number] } {
  const x1 = cx - ancho / 2;
  const x2 = cx + ancho / 2;
  const chim = (w: number, y2: number) => <Acero x={cx - w / 2} y={20} w={w} h={y2 - 20} />;
  switch (tipo) {
    case "recta":
      return {
        el: (
          <g>
            {chim(70, 70)}
            <Acero x={x1 + 20} y={70} w={ancho - 40} h={86} />
            <rect x={x1 + 20} y={150} width={ancho - 40} height={6} className="c-filtro" />
          </g>
        ),
        boca: [x1 + 20, x2 - 20, 156],
        ducto: [cx, 24, 70],
      };
    case "t-invertida":
      return {
        el: (
          <g>
            {chim(56, 144)}
            <Acero x={x1 - 10} y={144} w={ancho + 20} h={10} />
            <rect x={x1 - 10} y={153} width={ancho + 20} height={2} className="c-filtro" />
          </g>
        ),
        boca: [x1 - 10, x2 + 10, 155],
        ducto: [cx, 24, 140],
      };
    case "cristal":
      return {
        el: (
          <g>
            {chim(60, 120)}
            <Acero x={cx - 70} y={118} w={140} h={22} />
            <path d={`M${x1} 150 Q ${cx} 128 ${x2} 150 L ${x2} 156 Q ${cx} 136 ${x1} 156 Z`} className="c-visera-cristal" />
          </g>
        ),
        boca: [x1, x2, 154],
        ducto: [cx, 24, 116],
      };
    case "piramidal":
      return {
        el: (
          <g>
            {chim(58, 92)}
            <polygon points={pts([[cx - 36, 92], [cx + 36, 92], [x2, 148], [x1, 148]])} fill="url(#dgm-acero)" className="i-panel" />
            <polygon points={pts([[cx - 36, 92], [cx + 36, 92], [x2, 148], [x1, 148]])} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
            <Acero x={x1} y={148} w={ancho} h={9} />
          </g>
        ),
        boca: [x1, x2, 157],
        ducto: [cx, 24, 90],
      };
    case "inserto":
      // Mueble de carpintería que oculta el grupo de extracción.
      return {
        el: (
          <g>
            <rect x={x1 - 6} y={20} width={ancho + 12} height={134} className="i-mueble" />
            <rect x={x1 - 6} y={20} width={ancho + 12} height={134} className="i-modelado" />
            <rect x={x1 - 10} y={120} width={ancho + 20} height={10} className="i-mueble" />
            <rect x={x1 - 10} y={120} width={ancho + 20} height={10} className="c-moldura" />
            <rect x={x1 - 5.5} y={20.5} width={ancho + 11} height={133} className="i-panel-canto" />
            <Acero x={x1 + 4} y={154} w={ancho - 8} h={5} />
          </g>
        ),
        boca: [x1 + 4, x2 - 4, 159],
      };
    case "bajo-mueble":
      return {
        el: <Acero x={x1 + 10} y={132} w={ancho - 20} h={18} />,
        boca: [x1 + 10, x2 - 10, 150],
      };
    case "slider":
      return {
        el: (
          <g>
            <Acero x={x1 + 10} y={132} w={ancho - 20} h={10} />
            <g className="c-slider">
              <Acero x={x1 + 10} y={140} w={ancho - 20} h={8} />
              <rect x={cx - 30} y={146} width={60} height={2} className="c-filtro" />
            </g>
          </g>
        ),
        boca: [x1 + 10, x2 - 10, 148],
      };
    case "revestir":
      // Forrada en obra (yeso/piedra) con filo de latón.
      return {
        el: (
          <g>
            <polygon points={pts([[cx - 50, 20], [cx + 50, 20], [cx + 50, 100], [x2, 150], [x1, 150], [cx - 50, 100]])} className="c-revestida" />
            <polygon points={pts([[cx - 50, 20], [cx + 50, 20], [cx + 50, 100], [x2, 150], [x1, 150], [cx - 50, 100]])} fill="url(#ilus-modelado)" />
            <rect x={x1} y={146} width={ancho} height={4} className="c-filo-laton" />
            <rect x={x1 + 8} y={150} width={ancho - 16} height={4} className="c-filtro" />
          </g>
        ),
        boca: [x1 + 8, x2 - 8, 154],
      };
    case "gran-formato":
      return {
        el: (
          <g>
            {chim(80, 96)}
            <polygon points={pts([[cx - 70, 96], [cx + 70, 96], [x2, 140], [x1, 140]])} fill="url(#dgm-acero)" className="i-panel" />
            <polygon points={pts([[cx - 70, 96], [cx + 70, 96], [x2, 140], [x1, 140]])} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
            <Acero x={x1} y={140} w={ancho} h={14} />
          </g>
        ),
        boca: [x1, x2, 154],
        ducto: [cx, 24, 94],
      };
    case "repisa":
      return {
        el: (
          <g>
            <Acero x={x1} y={134} w={ancho} h={5} />
            <Acero x={x1 + 6} y={139} w={ancho - 12} h={14} />
            {/* Frascos y planta sobre la repisa */}
            {[0.12, 0.2, 0.28].map((f) => (
              <rect key={f} x={x1 + ancho * f} y={116} width={10} height={18} rx={2} className="c-frasco" />
            ))}
            <g transform={`translate(${x2 - 40} 134) scale(0.7)`}>
              <Planta2 x={0} y={0} />
            </g>
          </g>
        ),
        boca: [x1 + 6, x2 - 6, 153],
      };
    case "airwall":
      return {
        el: (
          <g>
            <rect x={x1 + 10} y={150} width={ancho - 20} height={76} className="c-airwall" />
            {Array.from({ length: 10 }, (_, k) => (
              <line key={k} x1={x1 + 18} y1={156 + k * 7} x2={x2 - 18} y2={156 + k * 7} className="c-airwall-lama" />
            ))}
          </g>
        ),
        boca: [x1 + 10, x2 - 10, 226],
      };
    default:
      // De pared (chimenea + canopy recto).
      return {
        el: (
          <g>
            {chim(64, 104)}
            <polygon points={pts([[cx - 44, 104], [cx + 44, 104], [x2 - 6, 140], [x1 + 6, 140]])} fill="url(#dgm-acero)" className="i-panel" />
            <polygon points={pts([[cx - 44, 104], [cx + 44, 104], [x2 - 6, 140], [x1 + 6, 140]])} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
            <Acero x={x1} y={140} w={ancho} h={14} />
          </g>
        ),
        boca: [x1, x2, 154],
        ducto: [cx, 24, 102],
      };
  }
}

/** Campana suspendida sobre la isla. */
function CampanaIsla({ tipo }: { tipo: TipoCampana }): { el: ReactElement; boca: [number, number, number]; ducto?: [number, number, number] } {
  const cx = 280;
  switch (tipo) {
    case "cilindrica":
      return {
        el: (
          <g>
            <rect x={cx - 3} y={20} width={6} height={64} className="c-cable" />
            <rect x={cx - 52} y={84} width={104} height={62} rx={4} fill="url(#ilus-cromo)" className="c-cilindro" />
            <ellipse cx={cx} cy={146} rx={52} ry={6} className="c-cilindro-base" />
          </g>
        ),
        boca: [cx - 52, cx + 52, 150],
      };
    case "techo":
      return {
        el: (
          <g>
            <rect x={cx - 110} y={20} width={220} height={8} className="c-techo-panel" />
            <rect x={cx - 100} y={27} width={200} height={2} className="c-filtro" />
          </g>
        ),
        boca: [cx - 104, cx + 104, 29],
      };
    case "decorativa":
      return {
        el: (
          <g>
            <rect x={cx - 2} y={20} width={4} height={40} className="c-cable" />
            <path d={`M${cx - 84} 150 Q ${cx - 82} 60 ${cx} 58 Q ${cx + 82} 60 ${cx + 84} 150 Z`} className="c-domo" />
            <path d={`M${cx - 84} 150 Q ${cx - 82} 60 ${cx} 58 Q ${cx + 82} 60 ${cx + 84} 150 Z`} fill="url(#ilus-modelado)" />
            <ellipse cx={cx} cy={150} rx={84} ry={7} className="c-domo-int" />
          </g>
        ),
        boca: [cx - 80, cx + 80, 152],
      };
    case "monolith":
      return {
        el: (
          <g>
            <rect x={cx - 64} y={20} width={128} height={128} className="c-monolith" />
            <polygon points={pts([[cx - 64 + 20, 20], [cx - 64 + 44, 20], [cx - 64 + 12, 148], [cx - 64, 148], [cx - 64, 120]])} className="c-reflejo" />
          </g>
        ),
        boca: [cx - 64, cx + 64, 148],
      };
    default:
      // De isla: chimenea de acero desde el plafón y cuerpo rectangular.
      return {
        el: (
          <g>
            <Acero x={cx - 32} y={20} w={64} h={90} />
            <Acero x={cx - 96} y={110} w={192} h={36} />
            <rect x={cx - 96} y={144} width={192} height={3} className="c-filtro" />
          </g>
        ),
        boca: [cx - 96, cx + 96, 147],
        ducto: [cx, 24, 108],
      };
  }
}

/** Extractor descendente que sube desde la isla detrás de la parrilla. */
function Retractil() {
  const y = ISLA_Y - 20;
  return (
    <g className="c-retractil">
      <rect x={204} y={y - 64} width={152} height={66} className="c-vidrio-negro" />
      <rect x={204} y={y - 64} width={152} height={6} fill="url(#ilus-cromo-h)" className="i-panel" />
      {Array.from({ length: 6 }, (_, k) => (
        <line key={k} x1={214} y1={y - 50 + k * 7} x2={346} y2={y - 50 + k * 7} className="c-airwall-lama" />
      ))}
    </g>
  );
}

/** Tapa de la ranura del retráctil sobre la cubierta (siempre visible). */
function RanuraRetractil() {
  const y = ISLA_Y - 20;
  return <polygon points={pts([[200, y - 2], [360, y - 2], [362, y + 1], [198, y + 1]])} className="c-canto-acero" />;
}

/* ——— Microondas, cafeteras ———————————————————————————————————————— */

/** Cuerpo de microondas (teclado a la derecha); la puerta va como capa. */
function CuerpoMicro({ r, acabado = "acero" }: { r: Rect; acabado?: "acero" | "negro" }) {
  const t = r.x + r.w * 0.76;
  return (
    <g>
      {acabado === "negro" ? <VidrioNegro {...r} /> : <Acero {...r} />}
      <rect x={t + 5} y={r.y + 8} width={r.x + r.w - t - 10} height={12} rx={1.5} className="c-pantalla" />
      <text x={t + (r.x + r.w - t) / 2} y={r.y + 17} textAnchor="middle" className="c-reloj c-reloj-on">
        1:30
      </text>
      {Array.from({ length: 9 }, (_, k) => (
        <rect
          key={k}
          x={t + 7 + (k % 3) * ((r.x + r.w - t - 14) / 3)}
          y={r.y + 26 + Math.floor(k / 3) * 9}
          width={(r.x + r.w - t - 14) / 3 - 3}
          height={6}
          rx={1}
          className="c-tecla"
        />
      ))}
    </g>
  );
}

/** Cafetera (cuerpo + boquilla + taza); el café cae al encender. */
function Cafetera({ r, empotre }: { r: Rect; empotre?: boolean }) {
  const cx = r.x + r.w / 2;
  const nicho = { x: r.x + r.w * 0.22, y: r.y + r.h * 0.34, w: r.w * 0.56, h: r.h * 0.56 };
  const tazaY = nicho.y + nicho.h - 6;
  return (
    <g>
      {empotre ? <Acero {...r} /> : <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} className="c-cafetera" />}
      {!empotre && <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} fill="url(#ilus-acero-luz)" />}
      {/* Pantalla */}
      <rect x={cx - r.w * 0.2} y={r.y + r.h * 0.09} width={r.w * 0.4} height={r.h * 0.14} rx={2} className="c-pantalla c-pantalla-cafe" />
      <g className="c-pantalla-ui">
        <circle cx={cx - r.w * 0.1} cy={r.y + r.h * 0.16} r={2.4} className="c-ui" />
        <circle cx={cx} cy={r.y + r.h * 0.16} r={2.4} className="c-ui" />
        <circle cx={cx + r.w * 0.1} cy={r.y + r.h * 0.16} r={2.4} className="c-ui" />
      </g>
      {/* Nicho de servicio */}
      <rect x={nicho.x} y={nicho.y} width={nicho.w} height={nicho.h} rx={3} className="c-nicho-cafe" />
      <rect x={cx - 8} y={nicho.y} width={16} height={9} rx={2} className="c-boquilla" />
      <rect x={nicho.x + 3} y={nicho.y + nicho.h - 5} width={nicho.w - 6} height={4} rx={1} className="c-charola-cafe" />
      {/* Chorro de café (crece al encender) */}
      <rect x={cx - 1.6} y={nicho.y + 9} width={3.2} height={tazaY - nicho.y - 22} className="c-chorro" />
      {/* Taza */}
      <path d={`M${cx - 11} ${tazaY - 16} L${cx + 11} ${tazaY - 16} L${cx + 9} ${tazaY} L${cx - 9} ${tazaY} Z`} className="c-taza" />
      <rect x={cx - 10} y={tazaY - 13} width={20} height={11} className="c-cafe-nivel" />
      <path d={`M${cx + 10} ${tazaY - 12} q 6 2 0 7`} className="c-taza-asa" />
      <Vapor x={cx} y={tazaY - 22} n={3} ancho={7} />
    </g>
  );
}

/* ——— Registro ————————————————————————————————————————————————————— */

const R_COCINA: Rect = { x: 110, y: 50, w: 340, h: 340 };
const R_CUBIERTA: Rect = { x: 50, y: 120, w: 460, h: 230 };
const R_COLUMNA: Rect = { x: 120, y: 20, w: 320, h: 370 };
const R_BARRA: Rect = { x: 130, y: 110, w: 300, h: 160 };
const R_ISLA: Rect = { x: 30, y: 18, w: 500, h: 372 };

function escenaEstufa(tipo: TipoEstufa, etiquetas: Etiqueta[]): Escena {
  const w = tipo === "profesional" ? 220 : 160;
  const x = 280 - w / 2;
  const doors = puertasEstufa(x, w, tipo);
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaCocina x1={x - (tipo === "piso" ? 6 : 2)} x2={x + w + (tipo === "piso" ? 6 : 2)} />
        {(() => {
          const c = CampanaPared({ tipo: "pared", cx: 280, ancho: w + 20 });
          return c.el;
        })()}
        <Estufa x={x} w={w} tipo={tipo} />
        {doors.map((d, k) => (
          <CavidadHorno key={k} r={{ x: d.x + 2, y: d.y + 2, w: d.w - 4, h: d.h - 4 }} comida={k === 0 ? "pollo" : "pan"} />
        ))}
        {tipo === "piso" && (
          // Freestanding: holgura y costados terminados a la vista.
          <>
            <rect x={x - 6} y={236} width={6} height={140} className="i-nicho" />
            <rect x={x + w} y={236} width={6} height={140} className="i-nicho" />
          </>
        )}
      </>
    ),
    capas: (
      <>
        {doors.map((d, k) => (
          <PuertaAbajo key={k} r={d} k={k} o={{ manija: "tubo", ventana: true, logo: k === 0 }} />
        ))}
      </>
    ),
    etiquetas,
    recorte: R_COCINA,
  };
}

function escenaParrilla(tipo: TipoParrilla, etiquetas: Etiqueta[]): Escena {
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaCubierta decor={tipo !== "modular" && tipo !== "superficie"} />
        <Parrilla tipo={tipo} />
      </>
    ),
    etiquetas,
    recorte: R_CUBIERTA,
  };
}

/** Horno(s) en columna. `puertas`: una abajo por horno o French Door. */
function escenaHorno(opc: { variante: Variante; doble?: boolean; french?: boolean; negro?: boolean; comida?: "pollo" | "pan" | "verduras" }, etiquetas: Etiqueta[]): Escena {
  const x1 = 160;
  const x2 = 400;
  const hx = 182;
  const hw = 196;
  const hornos: Rect[] = opc.doble
    ? [
        { x: hx, y: 98, w: hw, h: 116 },
        { x: hx, y: 224, w: hw, h: 116 },
      ]
    : [{ x: hx, y: 140, w: hw, h: 132 }];
  const acabado = opc.negro ? "negro" : "acero";
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={hornos} />
        {opc.doble ? (
          <>
            <PuertasColumna x1={x1} x2={x2} y1={24} y2={90} arriba />
            <rect x={x1 + 6} y={348} width={x2 - x1 - 12} height={16} className="i-mueble" />
          </>
        ) : (
          <>
            <PuertasColumna x1={x1} x2={x2} y1={24} y2={132} arriba />
            <PuertasColumna x1={x1} x2={x2} y1={280} y2={362} />
          </>
        )}
        {hornos.map((h, k) => {
          const panel = h.h * 0.2;
          const cav = opc.french ? { x: h.x + 4, y: h.y + panel + 2, w: h.w - 8, h: h.h - panel - 6 } : { x: h.x + 4, y: h.y + 4, w: h.w - 8, h: h.h - 8 };
          return (
            <Fragment key={k}>
              {opc.french && (
                <g>
                  {acabado === "negro" ? <VidrioNegro x={h.x} y={h.y} w={h.w} h={panel} /> : <Acero x={h.x} y={h.y} w={h.w} h={panel} />}
                  <rect x={h.x + h.w * 0.38} y={h.y + panel * 0.25} width={h.w * 0.24} height={panel * 0.5} rx={1.5} className="c-pantalla" />
                  {[0.14, 0.86].map((f) => (
                    <circle key={f} cx={h.x + h.w * f} cy={h.y + panel / 2} r={6} className="c-perilla" />
                  ))}
                </g>
              )}
              <CavidadHorno r={cav} variante={opc.variante} comida={opc.comida ?? (k ? "pan" : "pollo")} />
            </Fragment>
          );
        })}
      </>
    ),
    capas: (
      <>
        {hornos.map((h, k) => {
          if (opc.french) {
            const panel = h.h * 0.2;
            const r = { x: h.x, y: h.y + panel, w: h.w / 2, h: h.h - panel };
            return (
              <Fragment key={k}>
                <PuertaLado r={r} lado="l" o={{ acabado, ventana: true, manija: "barra-v" }} />
                <PuertaLado r={{ ...r, x: h.x + h.w / 2 }} lado="r" o={{ acabado, ventana: true, manija: "barra-v" }} />
              </Fragment>
            );
          }
          return <PuertaAbajo key={k} r={h} k={k} o={{ acabado, ventana: true, manija: "tubo", control: true }} />;
        })}
      </>
    ),
    etiquetas,
    recorte: R_COLUMNA,
  };
}

function escenaMicro(tipo: "mesa" | "empotrable" | "multifuncion" | "campana" | "cajon" | "trim", etiquetas: Etiqueta[]): Escena {
  if (tipo === "mesa") {
    const r = { x: 206, y: 176, w: 148, h: 60 };
    const puerta = { x: r.x, y: r.y, w: r.w * 0.76, h: r.h };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaBarra x1={r.x} x2={r.x + r.w} />
          <CuerpoMicro r={r} />
          <CavidadHorno r={{ x: puerta.x + 6, y: puerta.y + 6, w: puerta.w - 12, h: puerta.h - 12 }} variante="micro" comida="verduras" />
        </>
      ),
      capas: <PuertaLado r={puerta} lado="l" o={{ ventana: true, manija: "barra-v" }} />,
      etiquetas,
      recorte: R_BARRA,
    };
  }
  if (tipo === "campana") {
    const x = 200;
    const w = 160;
    const r = { x, y: 104, w, h: 52 };
    const puerta = { x: r.x, y: r.y, w: r.w * 0.76, h: r.h };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaCocina x1={x - 2} x2={x + w + 2} alacenaCorrida={100} />
          <rect x={x - 2} y={100} width={w + 4} height={4} className="i-nicho" />
          <CuerpoMicro r={r} />
          <CavidadHorno r={{ x: puerta.x + 5, y: puerta.y + 5, w: puerta.w - 10, h: puerta.h - 10 }} variante="micro" comida="verduras" />
          <LuzCampana x1={x} x2={x + w} y={156} piso={230} />
          <Estufa x={x} w={w} tipo="empotre" />
          <CaraEstatica r={puertasEstufa(x, w, "empotre")[0]} />
        </>
      ),
      capas: <PuertaLado r={puerta} lado="l" o={{ ventana: true, manija: "barra-v" }} />,
      etiquetas,
      recorte: R_COCINA,
    };
  }
  if (tipo === "cajon") {
    // Bajo la cubierta de la isla.
    const r = { x: 210, y: ISLA_Y + 14, w: 140, h: 52 };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaIsla />
          <rect x={r.x - 3} y={r.y - 3} width={r.w + 6} height={r.h + 6} className="i-nicho" />
          <Olla cx={300} y={ISLA_Y - 14} w={28} h={18} tapa />
          <Tablas x={240} y={ISLA_Y - 14} />
        </>
      ),
      capas: <CajonSale r={r} contenido="plato-micro" o={{ acabado: "acero", manija: "ninguna", control: true }} />,
      etiquetas,
      recorte: R_ISLA,
    };
  }
  // Empotrable, multifunción y + Trim: en la columna, sobre el horno.
  const x1 = 160;
  const x2 = 400;
  const trim = tipo === "trim";
  const micro: Rect = trim ? { x: 196, y: 112, w: 168, h: 66 } : { x: 182, y: 104, w: 196, h: 74 };
  const horno: Rect = { x: 182, y: 194, w: 196, h: 124 };
  const speed = tipo === "multifuncion";
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={[trim ? { x: 182, y: 100, w: 196, h: 90 } : micro, horno]} />
        <PuertasColumna x1={x1} x2={x2} y1={24} y2={96} arriba />
        <PuertasColumna x1={x1} x2={x2} y1={326} y2={362} />
        {trim && <Acero x={182} y={100} w={196} h={90} />}
        {trim && <rect x={micro.x - 1} y={micro.y - 1} width={micro.w + 2} height={micro.h + 2} className="i-nicho" />}
        {speed ? (
          <CavidadHorno r={{ x: micro.x + 4, y: micro.y + 4, w: micro.w - 8, h: micro.h - 8 }} variante="multifuncion" comida="pan" />
        ) : (
          <>
            <CuerpoMicro r={micro} />
            <CavidadHorno r={{ x: micro.x + 5, y: micro.y + 5, w: micro.w * 0.76 - 10, h: micro.h - 10 }} variante="micro" comida="verduras" />
          </>
        )}
        <CaraEstatica r={horno} control />
      </>
    ),
    capas: speed ? (
      <PuertaAbajo r={micro} o={{ ventana: true, manija: "tubo", control: true }} />
    ) : (
      <PuertaLado r={{ x: micro.x, y: micro.y, w: micro.w * 0.76, h: micro.h }} lado="l" o={{ ventana: true, manija: "barra-v" }} />
    ),
    etiquetas,
    recorte: R_COLUMNA,
  };
}

/** Frente fijo (horno que no se anima en esta ficha). */
function CaraEstatica({ r, control }: { r: Rect; control?: boolean }) {
  return (
    <g transform={`translate(${r.x} ${r.y})`}>
      <Acero x={0} y={0} w={r.w} h={r.h} />
      {control && <rect x={r.w * 0.38} y={r.h * 0.05} width={r.w * 0.24} height={r.h * 0.1} rx={1.5} className="c-pantalla" />}
      <rect x={r.w * 0.1} y={r.h * (control ? 0.24 : 0.16)} width={r.w * 0.8} height={r.h * (control ? 0.64 : 0.72)} rx={2} className="c-ventana" />
      <rect x={r.w * 0.1} y={r.h * (control ? 0.18 : 0.05)} width={r.w * 0.8} height={4} rx={2} fill="url(#ilus-cromo-h)" className="i-manija" />
    </g>
  );
}

function escenaCajon(tipo: "caliente" | "vacio", etiquetas: Etiqueta[]): Escena {
  const x1 = 160;
  const x2 = 400;
  const horno: Rect = { x: 182, y: 120, w: 196, h: 124 };
  const cajon: Rect = { x: 182, y: 254, w: 196, h: 52 };
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={[horno, cajon]} />
        <PuertasColumna x1={x1} x2={x2} y1={24} y2={112} arriba />
        <PuertasColumna x1={x1} x2={x2} y1={314} y2={362} />
        <CaraEstatica r={horno} control />
        <rect x={cajon.x} y={cajon.y} width={cajon.w} height={cajon.h} className="c-cavidad" />
      </>
    ),
    capas: <CajonSale r={cajon} contenido={tipo === "caliente" ? "platos" : "vacio"} o={{ acabado: "acero", manija: tipo === "vacio" ? "ninguna" : "tubo", control: tipo === "vacio" }} />,
    etiquetas,
    recorte: R_COLUMNA,
  };
}

function escenaCafe(tipo: "mesa" | "empotre", etiquetas: Etiqueta[]): Escena {
  if (tipo === "mesa") {
    const r = { x: 230, y: 140, w: 100, h: 96 };
    return {
      estados: "encender",
      fondo: (
        <>
          <EscenaBarra x1={r.x - 40} x2={r.x + r.w + 40} />
          <Cafetera r={r} />
          <rect x={r.x + r.w + 10} y={226} width={22} height={10} rx={2} className="c-frasco" />
        </>
      ),
      etiquetas,
      recorte: R_BARRA,
    };
  }
  const x1 = 160;
  const x2 = 400;
  const cafe: Rect = { x: 182, y: 130, w: 196, h: 92 };
  const cajon: Rect = { x: 182, y: 232, w: 196, h: 40 };
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={[cafe, cajon]} />
        <PuertasColumna x1={x1} x2={x2} y1={24} y2={122} arriba />
        <PuertasColumna x1={x1} x2={x2} y1={280} y2={362} />
        <Cafetera r={cafe} empotre />
        <Acero {...cajon} />
        <Tubo x={cajon.x + cajon.w * 0.2} y={cajon.y + 8} w={cajon.w * 0.6} />
      </>
    ),
    etiquetas,
    recorte: R_COLUMNA,
  };
}

function escenaCampana(tipo: TipoCampana, etiquetas: Etiqueta[]): Escena {
  const enIsla = tipo === "isla" || tipo === "cilindrica" || tipo === "techo" || tipo === "decorativa" || tipo === "monolith" || tipo === "retractil";
  if (enIsla) {
    const c = tipo === "retractil" ? null : CampanaIsla({ tipo });
    const desde: [number, number][] = [
      [252, ISLA_Y - 48],
      [322, ISLA_Y - 30],
    ];
    return {
      estados: "encender",
      fondo: (
        <>
          <EscenaIsla detras={tipo === "retractil" ? <Retractil /> : undefined} />
          {tipo === "retractil" && <RanuraRetractil />}
          {c && <LuzCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} piso={ISLA_Y - 12} ancho={1.05} />}
          <ParrillaIsla />
          {c?.el}
          {c?.ducto && <Ducto x={c.ducto[0]} y1={c.ducto[1]} y2={c.ducto[2]} />}
          {c ? (
            <AireCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} desde={desde} />
          ) : (
            <Aire trazos={desde.map(([ox, oy]) => `M${ox} ${oy} C ${ox} ${oy - 20}, 280 ${ISLA_Y - 70}, 280 ${ISLA_Y - 56}`)} />
          )}
        </>
      ),
      etiquetas,
      recorte: R_ISLA,
    };
  }
  const gran = tipo === "gran-formato";
  const w = gran ? 260 : tipo === "airwall" ? 170 : 170;
  const x = 280 - w / 2;
  const alacena = tipo === "bajo-mueble" || tipo === "slider" ? 132 : undefined;
  const c = CampanaPared({ tipo, cx: 280, ancho: gran ? w + 20 : tipo === "airwall" ? w : w + 30 });
  const ollaY = 224;
  const desde: [number, number][] = [
    [x + w * 0.2, ollaY - 34],
    [x + w * 0.8, ollaY - 20],
  ];
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaCocina x1={x - 2} x2={x + w + 2} alacenaCorrida={alacena} />
        {tipo !== "airwall" && <LuzCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} piso={228} />}
        {c.el}
        {c.ducto && <Ducto x={c.ducto[0]} y1={c.ducto[1]} y2={c.ducto[2]} />}
        {tipo === "airwall" ? (
          <>
            {/* Parrilla empotrada en la cubierta y gabinetes abajo. */}
            <rect x={x - 3} y={236} width={w + 6} height={9} className="i-cubierta" />
            <Cajones x1={x} x2={x + w} ys={[245, 290, 335, 366]} />
            <rect x={x + 10} y={231} width={w - 20} height={5} className="c-vidrio-negro" />
            <Olla cx={x + w * 0.3} y={231} w={30} h={22} />
            <Sarten cx={x + w * 0.72} y={231} w={34} />
            <Vapor x={x + w * 0.3} y={200} n={3} />
            <Aire
              trazos={[
                `M${x + w * 0.3} 204 C ${x + w * 0.32} 192, ${x + w * 0.4} 186, ${x + w * 0.46} 184`,
                `M${x + w * 0.7} 222 C ${x + w * 0.68} 208, ${x + w * 0.6} 198, ${x + w * 0.55} 194`,
              ]}
            />
          </>
        ) : (
          <>
            <Estufa x={x} w={w} tipo={gran ? "profesional" : "empotre"} />
            {puertasEstufa(x, w, gran ? "profesional" : "empotre").map((d, k) => (
              <CaraEstatica key={k} r={d} />
            ))}
            <AireCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} desde={desde} />
          </>
        )}
      </>
    ),
    etiquetas,
    recorte: R_COCINA,
  };
}

const ESCENAS: Record<string, () => Escena> = {
  // ——— Estufas ———
  "estufa-profesional": () =>
    escenaEstufa("profesional", [
      { x: 212, y: 226, hasta: 120, texto: "Quemadores sellados\nde alto BTU" },
      { x: 300, y: 254, hasta: 440, texto: "Perillas y tablero\nal frente" },
      { x: 220, y: 300, hasta: 120, texto: "Dos hornos:\ngrande y auxiliar" },
    ]),
  "estufa-empotre": () =>
    escenaEstufa("empotre", [
      { x: 204, y: 236, hasta: 120, texto: "Se desliza entre\nmuebles, a ras" },
      { x: 330, y: 250, hasta: 440, texto: "Controles\nal frente" },
      { x: 250, y: 300, hasta: 120, texto: "Sin respaldo: luce\nel salpicadero" },
    ]),
  "estufa-de-piso": () =>
    escenaEstufa("piso", [
      { x: 230, y: 210, hasta: 120, texto: "Respaldo con\ncontroles atrás" },
      { x: 360, y: 280, hasta: 440, texto: "Costados\nterminados" },
      { x: 250, y: 352, hasta: 120, texto: "Cajón de\nguardado abajo" },
    ]),
  // ——— Parrillas ———
  "parrilla-profesional": () =>
    escenaParrilla("profesional", [
      { x: 200, y: 214, hasta: 90, texto: "Quemadores de\nalto BTU" },
      { x: 360, y: 250, hasta: 470, texto: "Rejilla continua:\nlas ollas se deslizan" },
      { x: 180, y: 316, hasta: 90, texto: "Perillas al\nfrente" },
    ]),
  "parrilla-tradicional": () =>
    escenaParrilla("tradicional", [
      { x: 170, y: 270, hasta: 80, texto: "Se sobrepone en\nel corte de la cubierta" },
      { x: 380, y: 210, hasta: 470, texto: "Marco visible\nsobre la piedra" },
    ]),
  "parrilla-gas": () =>
    escenaParrilla("gas", [
      { x: 280, y: 236, hasta: 470, texto: "Flama directa:\nrespuesta inmediata" },
      { x: 170, y: 210, hasta: 80, texto: "Rejillas de\nhierro fundido" },
    ]),
  "parrilla-vitroceramica": () =>
    escenaParrilla("vitro", [
      { x: 210, y: 220, hasta: 80, texto: "Resistencias bajo\nla placa lisa" },
      { x: 360, y: 266, hasta: 470, texto: "Superficie fácil\nde limpiar" },
    ]),
  "parrilla-induccion": () =>
    escenaParrilla("induccion", [
      { x: 210, y: 220, hasta: 80, texto: "Calienta directo\nel recipiente" },
      { x: 280, y: 280, hasta: 470, texto: "Controles\ntáctiles" },
    ]),
  "parrilla-induccion-extraccion": () =>
    escenaParrilla("extraccion", [
      { x: 280, y: 236, hasta: 470, texto: "El vapor baja por\nel extractor central" },
      { x: 190, y: 220, hasta: 80, texto: "Inducción\nsin campana" },
    ]),
  "parrilla-hibrida": () =>
    escenaParrilla("hibrida", [
      { x: 190, y: 220, hasta: 80, texto: "Gas para\nflama directa" },
      { x: 360, y: 214, hasta: 470, texto: "Inducción para\nprecisión" },
    ]),
  "parrilla-submontar": () =>
    escenaParrilla("submontar", [
      { x: 180, y: 216, hasta: 80, texto: "Quemadores directo\nen la piedra" },
      { x: 360, y: 290, hasta: 470, texto: "Sin placa:\ncubierta continua" },
    ]),
  "parrilla-invisible": () =>
    escenaParrilla("invisible", [
      { x: 200, y: 220, hasta: 80, texto: "Inducción bajo\nla cubierta" },
      { x: 360, y: 272, hasta: 470, texto: "Apagada, solo\nse ve la piedra" },
    ]),
  "parrilla-modular": () =>
    escenaParrilla("modular", [
      { x: 160, y: 232, hasta: 70, texto: "Wok de gas" },
      { x: 290, y: 210, hasta: 470, texto: "Teppanyaki" },
      { x: 420, y: 270, hasta: 470, texto: "Inducción" },
    ]),
  // ——— Hornos ———
  "horno-conveccion": () =>
    escenaHorno({ variante: "conveccion" }, [
      { x: 280, y: 196, hasta: 440, texto: "Ventilador con\nresistencia propia" },
      { x: 200, y: 250, hasta: 110, texto: "Calor parejo en\ntoda la cavidad" },
    ]),
  "horno-vapor": () =>
    escenaHorno({ variante: "vapor", negro: true, comida: "verduras" }, [
      { x: 280, y: 196, hasta: 440, texto: "Cocina con humedad\ncontrolada" },
      { x: 200, y: 250, hasta: 110, texto: "Conserva textura\ny nutrientes" },
    ]),
  "horno-multifuncion": () =>
    escenaHorno({ variante: "multifuncion" }, [
      { x: 280, y: 164, hasta: 440, texto: "Grill superior" },
      { x: 200, y: 250, hasta: 110, texto: "Convencional,\nconvección y grill" },
    ]),
  "horno-sencillo": () =>
    escenaHorno({ variante: "normal" }, [
      { x: 190, y: 200, hasta: 110, texto: "A la altura\nde trabajo" },
      { x: 370, y: 140, hasta: 440, texto: "Empotrado en\nmueble columna" },
    ]),
  "horno-doble": () =>
    escenaHorno({ variante: "normal", doble: true }, [
      { x: 370, y: 150, hasta: 440, texto: "Dos cavidades\nindependientes" },
      { x: 190, y: 280, hasta: 110, texto: "Cada una con su\ntemperatura" },
    ]),
  "horno-french": () =>
    escenaHorno({ variante: "normal", french: true }, [
      { x: 280, y: 200, hasta: 440, texto: "Dos puertas que\nabren a la vez" },
      { x: 190, y: 260, hasta: 110, texto: "Menos espacio\nal frente" },
    ]),
  // ——— Microondas ———
  "micro-mesa": () =>
    escenaMicro("mesa", [
      { x: 250, y: 206, hasta: 150, texto: "Sobre la cubierta,\na 127 V" },
      { x: 334, y: 200, hasta: 440, texto: "Sin instalación" },
    ]),
  "micro-empotrable": () =>
    escenaMicro("empotrable", [
      { x: 230, y: 140, hasta: 110, texto: "Integrado al\nmueble columna" },
      { x: 360, y: 130, hasta: 440, texto: "Frente a ras" },
    ]),
  "micro-multifuncion": () =>
    escenaMicro("multifuncion", [
      { x: 230, y: 140, hasta: 110, texto: "Microondas, convección\ny grill" },
      { x: 360, y: 250, hasta: 440, texto: "Funciona como\nsegundo horno" },
    ]),
  "micro-campana": () =>
    escenaMicro("campana", [
      { x: 230, y: 130, hasta: 120, texto: "Sobre la estufa" },
      { x: 330, y: 160, hasta: 440, texto: "Extractor y luz\nintegrados" },
    ]),
  "micro-cajon": () =>
    escenaMicro("cajon", [
      { x: 240, y: 262, hasta: 60, texto: "Bajo la cubierta" },
      { x: 330, y: 262, hasta: 500, texto: "Abre deslizando:\nse carga desde arriba" },
    ]),
  "micro-trim": () =>
    escenaMicro("trim", [
      { x: 190, y: 146, hasta: 110, texto: "Marco de empotre\n(trim)" },
      { x: 330, y: 146, hasta: 440, texto: "Cubre el hueco\ndel mueble" },
    ]),
  // ——— Cajones ———
  "cajon-caliente": () =>
    escenaCajon("caliente", [
      { x: 230, y: 270, hasta: 110, texto: "Platos y comida\na temperatura" },
      { x: 340, y: 290, hasta: 440, texto: "Bajo el horno" },
    ]),
  "cajon-vacio": () =>
    escenaCajon("vacio", [
      { x: 240, y: 266, hasta: 110, texto: "Sella al vacío\npara sous-vide" },
      { x: 340, y: 290, hasta: 440, texto: "Conserva y\nmarina" },
    ]),
  // ——— Cafeteras ———
  "cafe-mesa": () =>
    escenaCafe("mesa", [
      { x: 262, y: 166, hasta: 150, texto: "Pantalla táctil" },
      { x: 290, y: 214, hasta: 440, texto: "Molino integrado:\ncafé al momento" },
    ]),
  "cafe-empotre": () =>
    escenaCafe("empotre", [
      { x: 230, y: 144, hasta: 110, texto: "Integrada al\nmuro de hornos" },
      { x: 300, y: 200, hasta: 440, texto: "Espresso\nal toque" },
    ]),
  // ——— Campanas ———
  "camp-pared": () => escenaCampana("pared", [{ x: 230, y: 130, hasta: 110, texto: "Anclada al muro\nsobre la estufa" }, { x: 340, y: 190, hasta: 450, texto: "Capta el humo\ny lo saca" }]),
  "camp-isla": () => escenaCampana("isla", [{ x: 250, y: 80, hasta: 120, texto: "Suspendida del\ntecho" }, { x: 360, y: 128, hasta: 470, texto: "Sin muro: más\npotencia de extracción" }]),
  "camp-recta": () => escenaCampana("recta", [{ x: 230, y: 110, hasta: 110, texto: "Un solo prisma\nde líneas rectas" }, { x: 330, y: 190, hasta: 450, texto: "Luz LED sobre\nla cocción" }]),
  "camp-t-invertida": () => escenaCampana("t-invertida", [{ x: 280, y: 90, hasta: 450, texto: "Cubreductos\nangosto" }, { x: 210, y: 150, hasta: 110, texto: "Visera ancha\ny plana" }]),
  "camp-cristal": () => escenaCampana("cristal", [{ x: 220, y: 146, hasta: 110, texto: "Visera de vidrio\ntemplado" }, { x: 330, y: 190, hasta: 450, texto: "Retiene y guía\nel vapor" }]),
  "camp-piramidal": () => escenaCampana("piramidal", [{ x: 230, y: 120, hasta: 110, texto: "Cuerpo inclinado\nhacia el ducto" }, { x: 330, y: 190, hasta: 450, texto: "Forma clásica\nde campana" }]),
  "camp-cilindrica": () => escenaCampana("cilindrica", [{ x: 250, y: 110, hasta: 120, texto: "Cuerpo exento\nsobre la isla" }, { x: 330, y: 170, hasta: 470, texto: "Luz y extracción\nal centro" }]),
  "camp-inserto": () => escenaCampana("inserto", [{ x: 230, y: 80, hasta: 110, texto: "Mueble a la medida\nque lo oculta" }, { x: 320, y: 158, hasta: 450, texto: "Solo se ve el\ngrupo de extracción" }]),
  "camp-bajo-mueble": () => escenaCampana("bajo-mueble", [{ x: 230, y: 140, hasta: 110, texto: "Bajo la alacena" }, { x: 330, y: 190, hasta: 450, texto: "Compacta, con\nsalida al ducto" }]),
  "camp-slider": () => escenaCampana("slider", [{ x: 230, y: 146, hasta: 110, texto: "Visera que se\nextiende al usarla" }, { x: 330, y: 120, hasta: 450, texto: "Integrada bajo\nla alacena" }]),
  "camp-revestir": () => escenaCampana("revestir", [{ x: 240, y: 90, hasta: 110, texto: "Forrada en madera,\npiedra o yeso" }, { x: 330, y: 152, hasta: 450, texto: "El motor queda\noculto" }]),
  "camp-techo": () => escenaCampana("techo", [{ x: 220, y: 26, hasta: 110, texto: "Al ras del plafón" }, { x: 340, y: 120, hasta: 470, texto: "Sin volumen\ncolgante" }]),
  "camp-decorativa": () => escenaCampana("decorativa", [{ x: 230, y: 96, hasta: 110, texto: "Forma escultórica" }, { x: 330, y: 150, hasta: 470, texto: "Luz y extracción\nbajo el domo" }]),
  "camp-retractil": () => escenaCampana("retractil", [{ x: 230, y: 180, hasta: 110, texto: "Sube desde la\ncubierta al usarla" }, { x: 330, y: 200, hasta: 470, texto: "Al apagarla\ndesaparece" }]),
  "camp-gran-formato": () => escenaCampana("gran-formato", [{ x: 220, y: 120, hasta: 90, texto: "55″ o más" }, { x: 360, y: 150, hasta: 470, texto: "Para estufas\nprofesionales" }]),
  "camp-repisa": () => escenaCampana("repisa", [{ x: 220, y: 126, hasta: 110, texto: "Repisa superior" }, { x: 330, y: 150, hasta: 450, texto: "Perfil delgado" }]),
  "camp-monolith": () => escenaCampana("monolith", [{ x: 240, y: 80, hasta: 110, texto: "Un solo volumen\ndel techo" }, { x: 330, y: 150, hasta: 470, texto: "Capta a la altura\njusta" }]),
  "camp-airwall": () => escenaCampana("airwall", [{ x: 230, y: 180, hasta: 110, texto: "Panel al muro\ndetrás de la parrilla" }, { x: 330, y: 200, hasta: 450, texto: "Extrae el vapor\nde lado" }]),
  "camp-superficie": () =>
    escenaParrilla("superficie", [
      { x: 216, y: 236, hasta: 60, texto: "Módulo de extracción\nen la cubierta" },
      { x: 420, y: 270, hasta: 490, texto: "Entre las parrillas\nmodulares" },
    ]),
  "camp-induccion-extraccion": () =>
    escenaParrilla("extraccion", [
      { x: 280, y: 236, hasta: 470, texto: "La extracción va\nen la placa" },
      { x: 190, y: 220, hasta: 80, texto: "El vapor baja,\nno sube" },
    ]),
};

export function tieneCoccion(tipo: string): boolean {
  return tipo in ESCENAS;
}

export default function IlustracionCoccion({ tipo }: { tipo: string }) {
  const crear = ESCENAS[tipo];
  if (!crear) return null;
  const e = crear();
  const { x, y, w, h } = e.recorte;
  const style = {
    "--rx": `${(x / W) * 100}%`,
    "--ry": `${(y / H) * 100}%`,
    "--rw": W / w,
    "--rh": H / h,
    "--rar": `${w} / ${h}`,
  } as CSSProperties;
  return (
    <span className="ilus ilus--real ilus--coccion" style={style} data-estados={ESTADOS[e.estados]}>
      <svg className="ilus-escena" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect width={W} height={H} fill="url(#ilus-pared)" />
        <rect y={376} width={W} height={24} className="i-piso" />
        {e.fondo}
        <rect x={0} y={376} width={W} height={10} fill="url(#ilus-cinta)" opacity={0.35} />
      </svg>
      {e.capas}
      <span className="ilus-tags" aria-hidden="true">
        {e.etiquetas.map((t, i) => (
          <Tag key={i} e={t} i={i} />
        ))}
      </span>
    </span>
  );
}
