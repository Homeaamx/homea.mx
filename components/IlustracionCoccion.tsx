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
//   Lavavajillas               → la puerta se abate y deja ver las canastas
//   Asadores                   → la tapa se abre y se ven parrillas, flama y
//                                brasa (el ahumador de carbón echa humo)
//   Tarjas y grifería          → el grifo se abre y cae el agua (la extraíble
//                                baja su regadera; el pot filler despliega el
//                                brazo); la tarja dual pasa de sobre a bajo la cubierta
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

type Estados = "encender" | "abrir" | "montaje";
const ESTADOS: Record<Estados, string> = {
  encender: "Apagado|Encendido",
  abrir: "Cerrado|Abierto",
  // Tarja de doble instalación: la misma tarja sobre y bajo la cubierta.
  montaje: "Sobre la cubierta|Bajo la cubierta",
};

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
/** `ry`: semieje de la boca y del fondo (2.6 en alzado; mayor cuando la olla
 *  está sobre un plano en perspectiva, para que se vea redonda y con fondo). */
function Olla({ cx, y, w = 30, h = 22, tapa, ry = 2.6 }: { cx: number; y: number; w?: number; h?: number; tapa?: boolean; ry?: number }) {
  const x1 = cx - w / 2;
  const x2 = cx + w / 2;
  const asa = Math.min(h * 0.22, 6);
  return (
    <g>
      {ry > 3 && <ellipse cx={cx + 1.5} cy={y + 1.5} rx={w / 2 + 2} ry={ry + 1.2} className="c-sombra" />}
      <rect x={x1 - 4.5} y={y - h + asa} width={5.5} height={2.6} rx={1.3} className="c-asa" />
      <rect x={x2 - 1} y={y - h + asa} width={5.5} height={2.6} rx={1.3} className="c-asa" />
      <path d={`M${x1} ${y - h} L${x1} ${y} A ${w / 2} ${ry} 0 0 0 ${x2} ${y} L${x2} ${y - h} Z`} fill="url(#ilus-cromo)" className="c-olla" />
      <ellipse cx={cx} cy={y - h} rx={w / 2} ry={ry} className="c-olla-borde" />
      {ry > 3 && <ellipse cx={cx} cy={y - h + ry * 0.15} rx={w / 2 - 1.6} ry={ry - 1.1} className="c-olla-interior" />}
      {tapa && (
        <g>
          <ellipse cx={cx} cy={y - h - 1} rx={w / 2 - 1} ry={3} className="c-olla-tapa" />
          <rect x={cx - 3} y={y - h - 6} width={6} height={3.5} rx={1.5} className="c-asa" />
        </g>
      )}
    </g>
  );
}

/* ——— Escenas —————————————————————————————————————————————————————— */

/** Cocina en alzado (Estufas, Micro-campana, Campanas de pared): tramos de
 *  cubierta a los lados del hueco x1–x2 y muro de mármol encima. */
function EscenaCocina({ x1, x2, alacenaCorrida, sinLuces, sinAlacenas, sinPlanta }: { x1: number; x2: number; alacenaCorrida?: number; sinLuces?: boolean; sinAlacenas?: boolean; sinPlanta?: boolean }) {
  // Alacena corrida a la altura de las de los lados (Lavavajillas): el muro y su
  // tira de luz van de lado a lado en una sola pieza, sin cortes de luz en el
  // hueco (Carla, 2026-10-21).
  const corrido = alacenaCorrida === 150 && !sinAlacenas;
  return (
    <>
      {corrido && (
        <>
          <rect x={0} y={150} width={W} height={86} className="i-muro" />
          <Cinta x1={0} x2={W} y={150} h={60} />
        </>
      )}
      <TramoCubierta x1={0} x2={x1} decor={sinPlanta ? undefined : "planta"} sinAlacena={sinAlacenas} sinMuro={corrido} />
      <TramoCubierta x1={x2} x2={W} decor="tablas" base="cajones" sinAlacena={sinAlacenas} sinMuro={corrido} />
      {!corrido && <rect x={x1} y={20} width={x2 - x1} height={216} className="i-muro" />}
      {alacenaCorrida !== undefined && (
        <>
          <Puertas x1={x1} x2={x2} y1={20} y2={alacenaCorrida} jy={alacenaCorrida - 26} />
          {!corrido && <Cinta x1={x1} x2={x2} y={alacenaCorrida} h={50} />}
        </>
      )}
      <rect x={x1} y={366} width={x2 - x1} height={10} className="i-zoclo" />
      {!sinLuces && !sinAlacenas && <Luces xs={[x1 / 2, (x1 + x2) / 2, (x2 + W) / 2]} />}
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
function EscenaIsla({ detras, oscuro }: { detras?: ReactNode; oscuro?: boolean }) {
  return (
    <>
      <Listones x1={0} x2={W} y1={0} y2={300} />
      <rect x={0} y={0} width={W} height={20} className="i-mueble" />
      <rect x={0} y={0} width={W} height={20} className="i-plafon" />
      <rect x={0} y={292} width={W} height={10} className="i-zoclo" />
      {/* Piso entre el muro y la isla. */}
      <rect x={0} y={302} width={W} height={74} className="i-piso" />
      {/* Campanas de isla: el muro del fondo queda en penumbra para separar los
          planos y dar profundidad (Carla, 2026-10-21). */}
      {oscuro && (
        <>
          <rect x={0} y={0} width={W} height={302} fill="url(#c-fondo-profundo)" />
          <rect x={0} y={302} width={W} height={74} className="c-piso-penumbra" />
        </>
      )}
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
      {conVapor && <Vapor x={252} y={y - 36} />}
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

/** Perilla profesional: bisel cromado, botón rojo con brillo y su marca. */
function PerillaPro({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.55} rx={r + 1.4} ry={r * 0.75} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r + 1.3} fill="url(#ilus-cromo)" className="c-bisel-perilla" />
      <circle cx={cx} cy={cy} r={r} className="i-perilla-roja" />
      <path d={`M${cx - r * 0.7} ${cy - r * 0.35} A ${r} ${r} 0 0 1 ${cx + r * 0.55} ${cy - r * 0.55}`} className="c-brillo-perilla" />
      <rect x={cx - 0.9} y={cy - r + 1.2} width={1.8} height={r * 0.8} rx={0.7} className="c-marca-perilla" />
    </g>
  );
}

/** Tablero de la estufa profesional: banda de acero que sobresale del frente,
 *  cinco perillas rojas por lado y el módulo de control al centro. */
function TableroPro({ x, w, y, h }: { x: number; w: number; y: number; h: number }) {
  const paso = 18;
  const izq = [0, 1, 2, 3, 4].map((k) => x + 13 + k * paso);
  const der = izq.map((v) => x + w - (v - x));
  const cy = y + h / 2;
  return (
    <g>
      {/* Sombra que el tablero proyecta sobre las puertas */}
      <rect x={x + 1} y={y + h} width={w - 2} height={5} fill="url(#c-sombra-tablero)" />
      <Acero x={x - 1} y={y} w={w + 2} h={h} />
      <line x1={x - 1} y1={y + 0.6} x2={x + w + 1} y2={y + 0.6} className="c-filo-luz" />
      <line x1={x - 1} y1={y + h - 0.6} x2={x + w + 1} y2={y + h - 0.6} className="c-filo-sombra" />
      {/* Módulo central de control */}
      <rect x={x + w / 2 - 15} y={y + 3} width={30} height={h - 6} className="c-modulo" />
      <Acero x={x + w / 2 - 13.5} y={y + 4.5} w={27} h={h - 9} />
      <rect x={x + w / 2 - 9} y={cy - 3} width={18} height={6} rx={0.8} className="i-pantalla-negra" />
      <text x={x + w / 2} y={cy + 2.2} textAnchor="middle" className="c-reloj c-reloj-mini">
        350°
      </text>
      {[...izq, ...der].map((cx) => (
        <PerillaPro key={cx} cx={cx} cy={cy} />
      ))}
    </g>
  );
}

/** Zoclo de la profesional: riel inferior de acero, hueco en sombra y patas
 *  niveladoras que bajan al piso. */
function PatasPro({ x, w, y }: { x: number; w: number; y: number }) {
  const piso = 376;
  const patas = [x + 15, x + w * 0.4, x + w - 15];
  return (
    <g>
      <ellipse cx={x + w / 2} cy={piso} rx={w / 2 + 6} ry={4} className="c-sombra-piso" />
      <rect x={x + 3} y={y} width={w - 6} height={piso - y} fill="url(#c-bajo-estufa)" />
      {patas.map((cx) => (
        <g key={cx}>
          <polygon points={pts([[cx - 11, y], [cx + 11, y], [cx + 8, piso - 2], [cx - 8, piso - 2]])} fill="url(#dgm-acero)" className="i-panel" />
          <polygon points={pts([[cx - 11, y], [cx + 11, y], [cx + 8, piso - 2], [cx - 8, piso - 2]])} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
          <line x1={cx - 10.5} y1={y + 0.5} x2={cx + 10.5} y2={y + 0.5} className="c-filo-sombra" />
          <rect x={cx - 8.5} y={piso - 2.5} width={17} height={2.5} rx={0.6} className="c-pie" />
        </g>
      ))}
      {/* Riel inferior: sobresale un poco y remata las puertas */}
      <Acero x={x - 1} y={y - 9} w={w + 2} h={9} />
      <line x1={x - 1} y1={y - 8.4} x2={x + w + 1} y2={y - 8.4} className="c-filo-luz" />
      <line x1={x - 1} y1={y - 0.5} x2={x + w + 1} y2={y - 0.5} className="c-filo-sombra" />
    </g>
  );
}

/** Perilla de estufa de empotre: disco cromado con barra de agarre al centro. */
function PerillaEmpotre({ cx, cy, r = 5.5 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx + 0.4} cy={cy + 1.3} r={r + 0.4} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ilus-cromo)" className="c-perilla" />
      <circle cx={cx} cy={cy} r={r * 0.78} className="c-perilla-aro" />
      <rect x={cx - r * 0.26} y={cy - r * 0.86} width={r * 0.52} height={r * 1.72} rx={r * 0.24} fill="url(#ilus-cromo)" className="c-perilla-barra" />
      <rect x={cx - 0.45} y={cy - r * 0.78} width={0.9} height={r * 0.6} rx={0.4} className="c-perilla-marca" />
    </g>
  );
}

/** Tablero de la estufa de empotre: perilla del horno con su escala de
 *  temperatura, botón de luz, seis perillas de quemador y leyenda. */
function TableroEmpotre({ x, w, y, h }: { x: number; w: number; y: number; h: number }) {
  const cy = y + h / 2 + 1;
  const a = x + 50;
  const paso = (x + w - 28 - a) / 5;
  const horno = x + 17;
  return (
    <g>
      <line x1={x + 2} y1={y + h} x2={x + w - 2} y2={y + h} className="c-junta-acero" />
      {/* Escala de temperatura alrededor de la perilla del horno */}
      {Array.from({ length: 9 }, (_, k) => {
        const ang = ((-150 + k * 37.5) * Math.PI) / 180;
        return (
          <line
            key={k}
            x1={horno + Math.sin(ang) * 8.6}
            y1={cy - Math.cos(ang) * 8.6}
            x2={horno + Math.sin(ang) * 10}
            y2={cy - Math.cos(ang) * 10}
            className="c-escala"
          />
        );
      })}
      <PerillaEmpotre cx={horno} cy={cy} r={6.4} />
      {/* Botón de luz del horno */}
      <circle cx={x + 34} cy={cy + 0.8} r={3.2} className="c-sombra" />
      <circle cx={x + 34} cy={cy} r={3.2} fill="url(#ilus-cromo)" className="c-boton-luz" />
      {Array.from({ length: 6 }, (_, k) => {
        const cx = a + k * paso;
        return (
          <g key={k}>
            {[-2.4, 0, 2.4].map((d) => (
              <circle key={d} cx={cx + 3.5 + d} cy={cy - 8.6} r={0.7} className="c-escala-punto" />
            ))}
            <PerillaEmpotre cx={cx} cy={cy} />
          </g>
        );
      })}
      {/* Leyenda de la tecnología, sin marca */}
      <rect x={x + w - 20} y={cy - 3.6} width={12} height={1} className="c-leyenda" />
      <rect x={x + w - 20} y={cy - 1.2} width={9} height={1.4} className="c-leyenda" />
      <rect x={x + w - 20} y={cy + 1.4} width={11} height={1.4} className="c-leyenda" />
    </g>
  );
}

/** Tapa de vidrio templado de la estufa de empotre, con bisagras atrás. En
 *  reposo está cerrada sobre las parrillas (se ve como una lámina ahumada);
 *  al encender gira sobre las bisagras y queda de pie contra el salpicadero. */
function TapaVidrio({ x, w, y, alto }: { x: number; w: number; y: number; alto: number }) {
  return (
    <g>
      <g className="c-tapa">
        <rect x={x + 1} y={y - alto} width={w - 2} height={alto} className="c-tapa-vidrio" />
        <polygon points={pts([[x + w * 0.16, y - alto], [x + w * 0.3, y - alto], [x + w * 0.12, y], [x + 1, y], [x + 1, y - alto * 0.3]])} className="c-tapa-reflejo" />
        <polygon points={pts([[x + w * 0.58, y - alto], [x + w * 0.64, y - alto], [x + w * 0.5, y], [x + w * 0.44, y]])} className="c-tapa-reflejo" />
        <line x1={x + 1} y1={y - alto + 0.6} x2={x + w - 1} y2={y - alto + 0.6} className="c-tapa-canto" />
      </g>
      {/* Bisagras en las esquinas traseras */}
      {[x + 1, x + w - 8].map((bx) => (
        <rect key={bx} x={bx} y={y - 4} width={7} height={5} rx={1} fill="url(#ilus-cromo-h)" className="c-bisagra" />
      ))}
    </g>
  );
}

/** Frente de acero espejo de la estufa de empotre: marco, reflejo diagonal,
 *  jaladera integrada arriba y placa de marca abajo (en un svg de w×h). */
function FrenteEspejo({ w, h }: { w: number; h: number }) {
  return (
    <g>
      <rect x={3} y={3} width={w - 6} height={h - 6} className="c-espejo-marco" />
      <polygon points={pts([[w * 0.5, 3], [w * 0.78, 3], [w * 0.36, h - 3], [w * 0.08, h - 3]])} className="c-espejo-reflejo" />
      <polygon points={pts([[w * 0.84, 3], [w * 0.9, 3], [w * 0.5, h - 3], [w * 0.44, h - 3]])} className="c-espejo-reflejo" />
      {/* Jaladera integrada: receso en sombra y barra con los extremos que bajan */}
      <rect x={w * 0.06} y={h * 0.06} width={w * 0.88} height={8} rx={3} className="c-receso" />
      <path
        d={`M${w * 0.07} ${h * 0.06 + 7} L${w * 0.07} ${h * 0.06 + 3} Q${w * 0.07} ${h * 0.06} ${w * 0.1} ${h * 0.06} L${w * 0.9} ${h * 0.06} Q${w * 0.93} ${h * 0.06} ${w * 0.93} ${h * 0.06 + 3} L${w * 0.93} ${h * 0.06 + 7} L${w * 0.9} ${h * 0.06 + 7} L${w * 0.9} ${h * 0.06 + 4.5} L${w * 0.1} ${h * 0.06 + 4.5} L${w * 0.1} ${h * 0.06 + 7} Z`}
        fill="url(#ilus-cromo-h)"
        className="i-manija"
      />
      <rect x={w / 2 - 9} y={h - 10} width={18} height={2.4} rx={0.8} className="c-logo" />
    </g>
  );
}

/** Tablero de la estufa de piso: remate de acero arriba, tres perillas de
 *  quemador y una de función por lado, display digital al centro, con sus
 *  indicadores arriba y los íconos abajo. */
function TableroPiso({ x, w, y, h }: { x: number; w: number; y: number; h: number }) {
  const cy = y + h / 2 + 0.5;
  const paso = 16;
  const izq = [0, 1, 2, 3].map((k) => x + 12 + k * paso);
  const der = izq.map((v) => x + w - (v - x)).reverse();
  return (
    <g>
      <Acero x={x} y={y - 6} w={w} h={6} />
      <line x1={x} y1={y - 5.4} x2={x + w} y2={y - 5.4} className="c-filo-luz" />
      <line x1={x} y1={y - 0.4} x2={x + w} y2={y - 0.4} className="c-filo-sombra" />
      <line x1={x + 2} y1={y + h} x2={x + w - 2} y2={y + h} className="c-junta-acero" />
      {/* Display digital */}
      <rect x={x + w / 2 - 11} y={cy - 5} width={22} height={10} rx={0.8} className="c-display" />
      <text x={x + w / 2 - 1} y={cy - 0.6} textAnchor="middle" className="c-display-txt">180°</text>
      <text x={x + w / 2 - 1} y={cy + 3.6} textAnchor="middle" className="c-display-txt c-display-txt--2">160°</text>
      <rect x={x + w / 2 + 6.5} y={cy - 3} width={1.2} height={6} className="c-display-barra" />
      {[...izq, ...der].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={y + 2.6} r={0.8} className="c-escala-punto" />
          <PerillaEmpotre cx={cx} cy={cy} r={5.3} />
          <rect x={cx - 1.6} y={y + h - 3.6} width={3.2} height={2} rx={0.4} className="c-icono" />
        </g>
      ))}
    </g>
  );
}

/** Estufa vista de frente con flama azul y horno que se abre. `tapa`: la de
 *  empotre de su propia ficha lleva tapa de vidrio (sin ollas: se abre y se
 *  prende la flama). */
function Estufa({ x, w, tipo, tapa }: { x: number; w: number; tipo: TipoEstufa; tapa?: boolean }) {
  const pro = tipo === "profesional";
  const top = tipo === "empotre" ? 238 : 236;
  const quemadores = pro ? 6 : 3;
  const xs = Array.from({ length: quemadores }, (_, k) => x + (w * (k + 0.5)) / quemadores);
  const fondo = pro ? PRO.patas : tipo === "piso" ? PISO.zoclo : 366; // donde termina el cuerpo
  return (
    <g className={tapa ? "c-con-tapa" : undefined}>
      {/* Respaldo: remate bajo tipo isla en la profesional */}
      {pro && <Acero x={x + 2} y={top - 17} w={w - 4} h={9} />}
      {tipo === "piso" && (
        // Remate trasero bajo con la rejilla de ventilación del horno.
        <g>
          <Acero x={x + 1} y={top - 15} w={w - 2} h={7} />
          {Array.from({ length: 6 }, (_, k) => (
            <rect key={k} x={x + 6 + (k * (w - 12)) / 6} y={top - 12.5} width={(w - 12) / 6 - 4} height={2} rx={0.5} className="c-ranura" />
          ))}
        </g>
      )}
      {/* Tapa de vidrio (atrás de las flamas cuando está abierta) */}
      {tapa && <TapaVidrio x={x} w={w} y={top - 12} alto={58} />}
      {/* Rejillas, quemadores y ollas */}
      <rect x={x} y={top - 8} width={w} height={8} className="c-cubierta-estufa" />
      {xs.map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={top - 7} rx={w / quemadores / 2 - (pro ? 4 : 6)} ry={2.2} className="c-quemador" />
          <FlamaLado cx={cx} y={top - 8} w={w / quemadores - (pro ? 12 : 18)} />
        </g>
      ))}
      <path
        d={`M${x + 2} ${top - 8} ${xs.map((cx) => `L${cx - 12} ${top - 8} L${cx - 10} ${top - 12} L${cx + 10} ${top - 12} L${cx + 12} ${top - 8}`).join(" ")} L${x + w - 2} ${top - 8}`}
        className="c-rejilla-lado"
      />
      {pro && <line x1={x + 2} y1={top - 12} x2={x + w - 2} y2={top - 12} className="c-rejilla-lado c-rejilla-continua" />}
      {!pro &&
        // Tres parrillas independientes, separadas como en la estufa real.
        [1, 2].map((k) => <rect key={k} x={x + (w * k) / 3 - 1.5} y={top - 13} width={3} height={6} className="c-junta-parrilla" />)}
      {!tapa && (
        <>
          <Olla cx={xs[0]} y={top - 12} w={36} h={28} tapa />
          <Vapor x={xs[0]} y={top - 46} n={3} />
        </>
      )}
      {/* Cuerpo */}
      <Acero x={x} y={top} w={w} h={fondo - top} />
      {tipo === "empotre" && (
        // Slide-in: los costados se apoyan sobre la cubierta.
        <>
          <rect x={x - 5} y={top - 3} width={w + 10} height={4} rx={1} fill="url(#ilus-cromo-h)" className="i-panel" />
        </>
      )}
      {pro && <TableroPro x={x} w={w} y={top + PRO.tablero[0]} h={PRO.tablero[1]} />}
      {/* Tablero de controles al frente (empotre) */}
      {tipo === "empotre" && <TableroEmpotre x={x} w={w} y={top + 2} h={24} />}
      {tipo === "piso" && <TableroPiso x={x} w={w} y={top + 6} h={21} />}
      {/* Zoclo: patas niveladoras (profesional) o cajón de guardado */}
      {pro ? (
        <PatasPro x={x} w={w} y={PRO.patas} />
      ) : tipo === "empotre" ? (
        // Zoclo liso bajo la puerta.
        <g>
          <line x1={x + 2} y1={349.5} x2={x + w - 2} y2={349.5} className="c-junta-acero" />
          <rect x={x + 4} y={351} width={w - 8} height={13} className="c-zoclo-liso" />
          <line x1={x + 4} y1={351.5} x2={x + w - 4} y2={351.5} className="c-filo-luz" />
        </g>
      ) : (
        // Cajón de guardado con la placa de marca y zoclo negro al piso.
        <g>
          <line x1={x + 2} y1={PISO.cajon + 0.5} x2={x + w - 2} y2={PISO.cajon + 0.5} className="c-junta-acero" />
          <line x1={x + 2} y1={PISO.cajon + 1.6} x2={x + w - 2} y2={PISO.cajon + 1.6} className="c-filo-luz" />
          <rect x={x + w / 2 - 10} y={PISO.cajon + 9} width={20} height={2.6} rx={0.8} className="c-logo" />
          <rect x={x + 1} y={PISO.zoclo} width={w - 2} height={376 - PISO.zoclo} className="c-zoclo-negro" />
        </g>
      )}
    </g>
  );
}

/** Cotas de la profesional (escena): tablero [desfase desde la cubierta, alto],
 *  puertas [y1, y2] y arranque de las patas. Proporciones de una 48″ real. */
const PRO = { tablero: [3, 19] as const, puertas: [262, 343] as const, patas: 353 };
/** Cotas de la de piso: puerta, cajón de guardado y zoclo negro. */
const PISO = { puertas: [265, 341] as const, cajon: 342, zoclo: 362 };

/** Puertas del horno de la estufa (rect en escena) por tipo. */
function puertasEstufa(x: number, w: number, tipo: TipoEstufa): Rect[] {
  if (tipo === "profesional") {
    // Horno auxiliar a la izquierda y principal a la derecha.
    const [y, y2] = PRO.puertas;
    const g = w * 0.4;
    return [
      { x: x + 4, y, w: g - 6, h: y2 - y },
      { x: x + g + 2, y, w: w - g - 6, h: y2 - y },
    ];
  }
  if (tipo === "empotre") return [{ x: x + 4, y: 267, w: w - 8, h: 80 }];
  const [y, y2] = PISO.puertas;
  return [{ x: x + 4, y, w: w - 8, h: y2 - y }];
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
  manija?: "tubo" | "barra-v" | "ninguna" | "superior" | "barra-ancha";
  /** Banda de control arriba (horno de pared). */
  control?: boolean;
  logo?: boolean;
  /** Marco con bisel alrededor de la ventana (estufa profesional). */
  bisel?: boolean;
  /** Placa de marca bajo la ventana (estufa profesional). */
  insignia?: boolean;
  /** Frente de acero espejo sin ventana, con jaladera integrada (empotre). */
  espejo?: boolean;
  /** Ventana con marco ancho de acero, más abajo de la jaladera (de piso). */
  ventanaBaja?: boolean;
  /** Frente de horno de pared con el diseño de un modelo de referencia. */
  modelo?: ModeloHorno;
  /** French Door: de qué lado va la bisagra (la jaladera queda junto a la unión). */
  lado?: "l" | "r";
  /** Puerta de microondas con el diseño de un modelo de referencia. */
  micro?: ModeloMicro;
  /** Frente de cajón de microondas: vidrio gris con malla (Thermador). */
  vidrioGris?: boolean;
}

/** Frente de puerta (svg con viewBox w×h) y su reverso. */
function CaraPuerta({ w, h, o }: { w: number; h: number; o: CaraOpc }) {
  const mx = o.ventanaBaja ? w * 0.12 : w * 0.1;
  const my1 = o.ventanaBaja ? h * 0.27 : o.control ? h * 0.24 : h * 0.16;
  const my2 = o.ventanaBaja ? h * 0.15 : h * 0.12;
  return (
    <svg className="ilus-cara" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {o.acabado === "negro" ? <VidrioNegro x={0.5} y={0.5} w={w - 1} h={h - 1} /> : <Acero x={0.5} y={0.5} w={w - 1} h={h - 1} />}
      {o.espejo && <FrenteEspejo w={w} h={h} />}
      {o.modelo && <FrenteHorno w={w} h={h} modelo={o.modelo} lado={o.lado} />}
      {o.micro && <PuertaMicro w={w} h={h} modelo={o.micro} />}
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
      {!o.espejo && o.ventana !== false && o.bisel && (
        <g>
          <rect x={mx - 3} y={my1 - 3} width={w - 2 * mx + 6} height={h - my1 - my2 + 6} className="c-bisel-sombra" />
          <rect x={mx - 3} y={my1 - 3} width={w - 2 * mx + 6} height={h - my1 - my2 + 6} className="c-bisel" />
        </g>
      )}
      {!o.espejo && o.ventana !== false && (
        <rect x={mx} y={my1} width={w - 2 * mx} height={h - my1 - my2} rx={o.bisel ? 0.5 : 2} className="c-ventana" />
      )}
      {!o.espejo && o.ventana !== false && <polygon points={pts([[mx + 6, my1], [mx + (w - 2 * mx) * 0.4, my1], [mx + 4, h - my2]])} className="c-reflejo" />}
      {o.manija === "tubo" && <Tubo x={w * 0.1} y={o.control ? h * 0.19 : 5} w={w * 0.8} />}
      {o.manija === "barra-ancha" && (
        // Barra plana a todo lo ancho con sus soportes en los extremos.
        <g>
          <rect x={w * 0.02} y={h * 0.08 + 4} width={w * 0.96} height={3} className="i-manija-sombra" />
          <rect x={w * 0.02} y={h * 0.08 - 2} width={w * 0.06} height={8} rx={0.8} fill="url(#ilus-cromo-h)" className="i-manija" />
          <rect x={w * 0.92} y={h * 0.08 - 2} width={w * 0.06} height={8} rx={0.8} fill="url(#ilus-cromo-h)" className="i-manija" />
          <rect x={w * 0.02} y={h * 0.08} width={w * 0.96} height={5} rx={0.8} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
          <line x1={w * 0.02} y1={h * 0.08 + 0.6} x2={w * 0.98} y2={h * 0.08 + 0.6} className="c-filo-luz" />
        </g>
      )}
      {o.manija === "superior" && <rect x={w * 0.2} y={3} width={w * 0.6} height={3} rx={1.5} className="i-manija i-manija-h" fill="url(#ilus-cromo-h)" />}
      {o.manija === "barra-v" && (
        <g>
          <rect x={w - 12} y={h * 0.15} width={4} height={h * 0.7} rx={2} className="i-manija-sombra" />
          <rect x={w - 14} y={h * 0.15} width={4} height={h * 0.7} rx={2} fill="url(#ilus-cromo)" className="i-manija" />
        </g>
      )}
      {o.logo && <rect x={w / 2 - 10} y={h - 7} width={20} height={1.6} rx={0.8} className="c-logo" />}
      {o.insignia && (
        <g>
          <rect x={w / 2 - 13} y={h - my2 + 1.5} width={26} height={6} rx={0.6} fill="url(#ilus-cromo-h)" className="c-insignia" />
          <rect x={w / 2 - 11.5} y={h - my2 + 2.7} width={23} height={3.6} rx={0.4} className="c-insignia-fondo" />
          <rect x={w / 2 - 10.5} y={h - my2 + 3.5} width={2} height={2} className="c-insignia-rojo" />
          <rect x={w / 2 - 7} y={h - my2 + 4.1} width={16} height={0.9} className="c-insignia-texto" />
        </g>
      )}
    </svg>
  );
}

/** Cara interior de la puerta ya abatida: trapecio que se acerca (más ancho
 *  abajo), con su ventana y el empaque. */
function PuertaAbatida({ r, k, caida = 0.42, asa }: { r: Rect; k: number; caida?: number; asa?: boolean }) {
  const h = Math.max(caida < 0.42 ? 14 : 26, r.h * caida);
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
      {asa && (
        // La jaladera queda abajo, al frente de la puerta abierta.
        <g>
          <rect x={w * 0.08} y={h - 3} width={3} height={4} className="i-manija" />
          <rect x={w * 0.92 - 3} y={h - 3} width={3} height={4} className="i-manija" />
          <rect x={w * 0.06} y={h - 1.5} width={w * 0.88} height={4.5} rx={2.2} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
        </g>
      )}
    </svg>
  );
}

/** Puerta abatible hacia abajo (hornos, estufas, speed oven): el frente se
 *  pliega sobre la bisagra y aparece la cara interior hacia el frente. */
function PuertaAbajo({ r, o, k = 0, caida }: { r: Rect; o: CaraOpc; k?: number; caida?: number }) {
  return (
    <>
      <PuertaAbatida r={r} k={k} caida={caida} asa={!!o.modelo} />
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
function CajonSale({ r, contenido, o, k = 0 }: { r: Rect; contenido: "platos" | "vacio" | "plato-micro" | "comida"; o: CaraOpc; k?: number }) {
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
        {contenido === "comida" && (
          // Plato hondo con arroz, carne y verduras asadas (vista desde arriba).
          <g>
            <ellipse cx={cw / 2} cy={14} rx={cw * 0.24} ry={8} className="c-bol" />
            <ellipse cx={cw / 2} cy={13.4} rx={cw * 0.2} ry={6.4} className="c-bol-int" />
            <ellipse cx={cw * 0.42} cy={16} rx={cw * 0.07} ry={3} className="c-arroz" />
            <ellipse cx={cw * 0.5} cy={11.6} rx={cw * 0.07} ry={3} className="c-carne" />
            {[
              [0.6, 11, "c-zanahoria"],
              [0.64, 14.5, "c-pimiento"],
              [0.58, 16.6, "i-verde"],
              [0.4, 11.4, "c-jitomate"],
              [0.52, 17.4, "i-verde"],
            ].map(([f, y, cl]) => (
              <circle key={`${f}${y}`} cx={cw * (f as number)} cy={y as number} r={2.2} className={cl as string} />
            ))}
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
          {o.vidrioGris && (
            <g>
              <rect x={r.w * 0.07} y={r.h * 0.1} width={r.w * 0.86} height={r.h * 0.8} className="c-vidrio-gris" />
              <rect x={r.w * 0.2} y={r.h * 0.26} width={r.w * 0.6} height={r.h * 0.38} fill="url(#c-malla)" className="c-malla" />
              <rect x={r.w / 2 - 8} y={r.h * 0.76} width={16} height={1.4} className="c-leyenda" />
            </g>
          )}
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

/** Acabados de quemador: `cromo` (anillo cromado y tapa negra), `wok` (triple
 *  corona), `oro` (todo de latón) y `cromo-laton` (anillo cromado, tapa de latón). */
type EstiloQuemador = "cromo" | "wok" | "oro" | "cromo-laton";

/** Quemador de gas sobre el plano: base, tapa y la corona de flama. */
function QuemadorPlano({ q, laton, estilo }: { q: Quemador; laton?: boolean; estilo?: EstiloQuemador }) {
  const e = elip(q.x, q.v, q.r);
  const t = elip(q.x, q.v, q.r * 0.55);
  const anillo = (f: number, className: string) => <ellipse {...e} rx={e.rx * f} ry={e.ry * f} className={className} />;
  return (
    <g>
      <ellipse {...e} className="c-quemador-base" />
      {estilo === "wok" ? (
        <>
          {anillo(0.9, "c-anillo-cromo")}
          {anillo(0.72, "c-quemador-base")}
          {anillo(0.52, "c-anillo-cromo")}
          {anillo(0.32, "c-tapa-quemador")}
          {anillo(0.14, "c-anillo-cromo")}
        </>
      ) : estilo === "oro" ? (
        <>
          {anillo(0.84, "c-anillo-laton")}
          {anillo(0.58, "c-tapa-laton")}
          {anillo(0.3, "c-anillo-laton")}
          {anillo(0.16, "c-tapa-laton")}
        </>
      ) : estilo === "cromo-laton" ? (
        <>
          {anillo(0.8, "c-anillo-cromo")}
          {anillo(0.64, "c-tapa-quemador")}
          {anillo(0.34, "c-tapa-laton")}
        </>
      ) : estilo === "cromo" ? (
        <>
          {anillo(0.84, "c-anillo-cromo")}
          <ellipse {...t} className="c-tapa-quemador" />
          <ellipse cx={t.cx - t.rx * 0.25} cy={t.cy - t.ry * 0.3} rx={t.rx * 0.35} ry={t.ry * 0.25} className="c-brillo-tapa" />
        </>
      ) : (
        <>
          {anillo(0.82, laton ? "c-anillo-laton" : "c-anillo")}
          <ellipse {...t} className="c-tapa-quemador" />
        </>
      )}
      <Corona cx={e.cx} cy={e.cy} rx={e.rx * 0.84} ry={e.ry * 0.84} />
    </g>
  );
}

/** Arco sobre el plano (grados en el plano: 0 = derecha, 90 = hacia el frente). */
function arcoPlano(x: number, v: number, r: number, a1: number, a2: number, n = 14) {
  return Array.from({ length: n + 1 }, (_, k) => {
    const a = ((a1 + ((a2 - a1) * k) / n) * Math.PI) / 180;
    const [px, py] = P(x + Math.cos(a) * r, v + dv(Math.sin(a) * r));
    return `${k ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(" ");
}

/** Zona de inducción tipo Monogram: aro cromado serigrafiado sobre el vidrio. */
function ZonaAro({ q }: { q: Quemador }) {
  const e = elip(q.x, q.v, q.r);
  return (
    <g>
      <ellipse {...e} className="c-zona-calor c-zona-calor--ind" fill="url(#c-ind)" />
      <ellipse {...e} className="c-aro" />
      <ellipse {...e} rx={e.rx - 1} ry={e.ry - 0.6} className="c-aro-brillo" />
      <ellipse {...e} rx={e.rx * 1.05} ry={e.ry * 1.05} className="c-zona-borde c-zona-borde--ind" />
    </g>
  );
}

/** Zona de inducción tipo Teka/Elica: perímetro punteado y marcas en cruz. */
function ZonaMarcas({ q, sinPerimetro }: { q: Quemador; sinPerimetro?: boolean }) {
  const e = elip(q.x, q.v, q.r);
  return (
    <g>
      <ellipse {...e} className="c-zona-calor c-zona-calor--ind" fill="url(#c-ind)" />
      {!sinPerimetro && <ellipse {...e} className="c-perimetro-vitro" />}
      {[20, 110, 200, 290].map((g) => {
        const a = (g * Math.PI) / 180;
        const [ax, ay] = P(q.x + Math.cos(a) * q.r * 0.5, q.v + dv(Math.sin(a) * q.r * 0.5));
        const [bx, by] = P(q.x + Math.cos(a) * q.r * 0.86, q.v + dv(Math.sin(a) * q.r * 0.86));
        return <line key={g} x1={ax} y1={ay} x2={bx} y2={by} className="c-marca-vitro" />;
      })}
      <ellipse {...e} rx={e.rx * 1.04} ry={e.ry * 1.04} className="c-zona-borde c-zona-borde--ind" />
    </g>
  );
}

/** Control táctil con slider: dígito rojo y línea punteada con su tramo encendido. */
function Slider({ x, v, w, digito, nivel = 0.5 }: { x: number; v: number; w: number; digito: string; nivel?: number }) {
  const [x1, y] = P(x, v);
  const [x2] = P(x + w, v);
  const [xd] = P(x - 6, v);
  return (
    <g>
      <text x={xd} y={y - 3} className="c-digito c-digito--slider">
        {digito}
      </text>
      <line x1={x1} y1={y} x2={x2} y2={y} className="c-slider" />
      <line x1={x1} y1={y} x2={x1 + (x2 - x1) * nivel} y2={y} className="c-slider-on" />
    </g>
  );
}

/** Quemador suelto de submontar: rejilla redonda de hierro con cuatro brazos
 *  (el wok lleva además su aro alto) y quemador negro. */
function QuemadorSuelto({ q, wok }: { q: Quemador; wok?: boolean }) {
  const e = elip(q.x, q.v, q.r);
  const anillo = (f: number) => ({ cx: e.cx, cy: e.cy, rx: e.rx * f, ry: e.ry * f });
  const brazos = [45, 135, 225, 315].map((g) => {
    const a = (g * Math.PI) / 180;
    const [ax, ay] = P(q.x + Math.cos(a) * q.r * 0.5, q.v + dv(Math.sin(a) * q.r * 0.5));
    const [bx, by] = P(q.x + Math.cos(a) * q.r * 1.08, q.v + dv(Math.sin(a) * q.r * 1.08));
    return `M${ax} ${ay} L${bx} ${by - 2.5}`;
  });
  return (
    <g>
      <ellipse {...anillo(1.14)} className="c-sombra-quemador" />
      <ellipse {...anillo(1.04)} className="c-anillo-hierro" />
      <ellipse {...anillo(0.86)} className="c-bandeja" />
      <ellipse {...anillo(0.5)} className="c-quemador-base" />
      <ellipse {...anillo(0.34)} className="c-tapa-hierro" />
      {wok && <ellipse {...anillo(0.2)} className="c-tapa-hierro" />}
      <Corona cx={e.cx} cy={e.cy} rx={e.rx * 0.5} ry={e.ry * 0.5} />
      {wok && <Corona cx={e.cx} cy={e.cy} rx={e.rx * 0.24} ry={e.ry * 0.24} />}
      <path d={brazos.join(" ")} className="c-brazo-hierro" />
      {wok && <ellipse cx={e.cx} cy={e.cy - 4} rx={e.rx * 1.02} ry={e.ry * 1.02} className="c-aro-wok" />}
    </g>
  );
}

/** Perilla negra suelta sobre la piedra (submontar), con su aleta. */
function PerillaNegra({ x, v }: { x: number; v: number }) {
  const [cx, cy] = P(x, v);
  const s = esc(v);
  const rx = 4.6 * s;
  const ry = 1.9 * s;
  const h = 5 * s;
  return (
    <g>
      <ellipse cx={cx + 1} cy={cy + 0.8} rx={rx + 1.4} ry={ry + 1} className="c-sombra" />
      <rect x={cx - rx} y={cy - h} width={rx * 2} height={h} className="c-perilla-negra" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="c-perilla-negra" />
      <ellipse cx={cx} cy={cy - h} rx={rx} ry={ry} className="c-perilla-negra-tope" />
      <rect x={cx - 1.1 * s} y={cy - h - 3.4 * s} width={2.2 * s} height={3.6 * s} rx={0.6} className="c-perilla-negra" />
    </g>
  );
}

/** Rejilla profesional de una zona (x1–x2 · v1–v2) con `filas` celdas: marco por
 *  celda y hexágono alrededor del quemador, con brazos al marco (tipo Monogram). */
function RejillaHex({ x1, x2, v1, v2, filas = 2 }: { x1: number; x2: number; v1: number; v2: number; filas?: number }) {
  const d: string[] = [];
  const seg = (a: [number, number], b: [number, number]) => d.push(`M${a.join(" ")} L${b.join(" ")}`);
  const hw = (x2 - x1) / 2;
  const cx = (x1 + x2) / 2;
  const alto = (v2 - v1) / filas;
  for (let f = 0; f < filas; f++) {
    const a = v1 + f * alto;
    const b = a + alto;
    const cv = (a + b) / 2;
    // Marco de la celda
    seg(P(x1, a), P(x2, a));
    seg(P(x2, a), P(x2, b));
    seg(P(x2, b), P(x1, b));
    seg(P(x1, b), P(x1, a));
    // Hexágono (puntas a izquierda y derecha) y brazos
    const R = hw * 0.62;
    const vert = [0, 60, 120, 180, 240, 300].map((g) => {
      const r = (g * Math.PI) / 180;
      return P(cx + Math.cos(r) * R, cv + dv(Math.sin(r) * R));
    });
    vert.forEach((p, k) => seg(p, vert[(k + 1) % 6]));
    seg(vert[0], P(x2, cv));
    seg(vert[3], P(x1, cv));
    seg(vert[1], P(cx + R * 0.5, b));
    seg(vert[2], P(cx - R * 0.5, b));
    seg(vert[4], P(cx - R * 0.5, a));
    seg(vert[5], P(cx + R * 0.5, a));
  }
  return (
    <g>
      <path d={d.join(" ")} className="c-rejilla" />
      <path d={d.join(" ")} className="c-rejilla-brillo" />
    </g>
  );
}

/** Rejilla de placa doméstica (tipo io mabe) de una sección con dos quemadores:
 *  marco, travesaño al centro, barras a lo ancho y dedos hacia cada quemador. */
function RejillaBarras({ x1, x2, v1, v2 }: { x1: number; x2: number; v1: number; v2: number }) {
  const d: string[] = [];
  const seg = (a: [number, number], b: [number, number]) => d.push(`M${a.join(" ")} L${b.join(" ")}`);
  const vm = (v1 + v2) / 2;
  const cx = (x1 + x2) / 2;
  const w = x2 - x1;
  seg(P(x1, v1), P(x2, v1));
  seg(P(x2, v1), P(x2, v2));
  seg(P(x2, v2), P(x1, v2));
  seg(P(x1, v2), P(x1, v1));
  seg(P(x1, vm), P(x2, vm));
  for (const [a, b] of [
    [v1, vm],
    [vm, v2],
  ]) {
    const cv = (a + b) / 2;
    const h = b - a;
    // Barras a lo ancho cerca de los bordes de la celda
    seg(P(x1, a + h * 0.2), P(x2, a + h * 0.2));
    seg(P(x1, a + h * 0.8), P(x2, a + h * 0.8));
    // Dedos que apuntan al quemador
    seg(P(x1, cv), P(x1 + w * 0.22, cv));
    seg(P(x2, cv), P(x2 - w * 0.22, cv));
    seg(P(cx, a), P(cx, a + h * 0.2));
    seg(P(cx, b), P(cx, b - h * 0.2));
  }
  return (
    <g>
      <path d={d.join(" ")} className="c-rejilla" />
      <path d={d.join(" ")} className="c-rejilla-brillo" />
    </g>
  );
}

/** Perilla cilíndrica de acero sobre el plano (placas tipo io mabe). */
function PerillaCilindro({ x, v, led }: { x: number; v: number; led?: boolean }) {
  const [cx, cy] = P(x, v);
  const s = esc(v);
  const rx = 4.4 * s;
  const ry = 1.8 * s;
  const h = 6 * s;
  return (
    <g>
      <ellipse cx={cx + 1} cy={cy + 0.6} rx={rx + 1.2} ry={ry + 0.8} className="c-sombra" />
      {led && <ellipse cx={cx} cy={cy} rx={rx + 1.4} ry={ry + 0.9} className="c-led-perilla" />}
      <rect x={cx - rx} y={cy - h} width={rx * 2} height={h} fill="url(#ilus-cromo)" className="c-perilla-cuerpo" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#ilus-cromo)" className="c-perilla-cuerpo" />
      <ellipse cx={cx} cy={cy - h} rx={rx} ry={ry} className="c-perilla-tope" />
      <line x1={cx} y1={cy - h - ry * 0.7} x2={cx} y2={cy - h} className="c-perilla-raya" />
    </g>
  );
}

/** Perilla de acero al frente del mueble (tipo Gaggenau Vario), vista de
 *  frente: anillo de luz naranja que se enciende con la zona, cuerpo cromado,
 *  cara con su marca y la aleta de agarre. */
function PerillaLuz({ cx, cy, r = 8.5 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx + 0.8} cy={cy + 2} r={r + 1.2} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r + 3.5} className="c-luz-perilla-halo" />
      <circle cx={cx} cy={cy} r={r + 1.3} className="c-luz-perilla" />
      <circle cx={cx} cy={cy} r={r + 0.6} className="c-base-perilla" />
      <rect x={cx - r - 3.4} y={cy - 1.6} width={3.6} height={3.2} rx={0.6} fill="url(#ilus-cromo-h)" className="c-aleta" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ilus-cromo)" className="c-perilla" />
      <circle cx={cx} cy={cy} r={r * 0.74} fill="url(#ilus-cromo)" className="c-cara-perilla" />
      <line x1={cx - r * 0.5} y1={cy + r * 0.32} x2={cx} y2={cy} className="c-perilla-raya" />
    </g>
  );
}

/** Perilla de rangetop profesional: bisel moleteado y barra de latón. */
function PerillaLaton({ cx, cy, r = 7.5 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx + 0.5} cy={cy + 1.6} r={r + 0.6} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ilus-cromo)" className="c-perilla" />
      <circle cx={cx} cy={cy} r={r * 0.82} className="c-moleteado" />
      <rect x={cx - r * 0.24} y={cy - r * 0.95} width={r * 0.48} height={r * 1.9} rx={r * 0.2} className="c-barra-laton" />
      <rect x={cx - r * 0.08} y={cy - r * 0.8} width={r * 0.16} height={r * 1.6} className="c-barra-brillo" />
    </g>
  );
}

/** Zona radiante de vitrocerámica: marcas serigrafiadas (perímetro punteado,
 *  cuatro marcas en cruz y la "H" de calor residual) y, encendida, la
 *  resistencia en espiral al rojo. `doble`: zona con anillo exterior. Al
 *  apagarla el rojo se va despacio y la "H" se queda encendida un rato. */
function ZonaVitro({ q, doble }: { q: Quemador; doble?: boolean }) {
  const e = elip(q.x, q.v, q.r);
  const ring = (f: number) => ({ cx: e.cx, cy: e.cy, rx: e.rx * f, ry: e.ry * f });
  const espiras = doble ? [0.18, 0.3, 0.42, 0.54, 0.66, 0.84, 0.94] : [0.2, 0.34, 0.48, 0.62, 0.76, 0.9];
  const marcas = [45, 135, 225, 315].map((g) => {
    const r = (g * Math.PI) / 180;
    return [Math.cos(r), Math.sin(r)] as const;
  });
  return (
    <g className="c-zona-vitro">
      <g className="c-zona-calor">
        <ellipse {...ring(1.08)} className="c-halo-vitro" />
        <ellipse {...ring(1)} fill="url(#c-vitro)" />
        {espiras.map((f) => (
          <ellipse key={f} {...ring(f)} className="c-espira" />
        ))}
        {doble && <ellipse {...ring(0.76)} className="c-espira-separa" />}
      </g>
      <ellipse {...ring(1)} className="c-perimetro-vitro" />
      {doble && <ellipse {...ring(0.76)} className="c-perimetro-vitro" />}
      {marcas.map(([c, sn], k) => (
        <line
          key={k}
          x1={e.cx + c * e.rx * 0.86}
          y1={e.cy + sn * e.ry * 0.86}
          x2={e.cx + c * e.rx * 1.14}
          y2={e.cy + sn * e.ry * 1.14}
          className="c-marca-vitro"
        />
      ))}
      <ellipse {...ring(0.17)} className="c-centro-vitro" />
      <text x={e.cx} y={e.cy + 1.6} textAnchor="middle" className="c-h-residual">
        H
      </text>
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
function OllaPlano({ x, v, r, alto = 26, sarten }: { x: number; v: number; r: number; alto?: number; sarten?: boolean | "acero" }) {
  const [cx, cy] = P(x, v);
  const s = esc(v);
  if (sarten === "acero") {
    // Sartén de acero inoxidable: borde pulido, fondo cepillado con su brillo y
    // mango tubular largo con remaches.
    const e = elip(x, v, r);
    const pared = r * 0.28 * s;
    const m1: [number, number] = [e.cx + e.rx * 0.95, e.cy + e.ry * 0.2];
    const m2: [number, number] = [e.cx + e.rx * 2.1, e.cy + e.ry * 0.9 - pared * 1.3];
    return (
      <g>
        <ellipse cx={e.cx + 2} cy={e.cy + 2} rx={e.rx * 0.96} ry={e.ry * 0.96} className="c-sombra" />
        {/* Pared de la sartén: del fondo (más angosto) al borde */}
        <path
          d={`M${e.cx - e.rx} ${e.cy - pared} L${e.cx - e.rx * 0.88} ${e.cy} A ${e.rx * 0.88} ${e.ry * 0.88} 0 0 0 ${e.cx + e.rx * 0.88} ${e.cy} L${e.cx + e.rx} ${e.cy - pared} Z`}
          fill="url(#ilus-cromo)"
          className="c-sarten-acero-borde"
        />
        <path d={`M${m1[0]} ${m1[1] - pared} L${m2.join(" ")}`} className="c-mango-acero-sombra" />
        <path d={`M${m1[0]} ${m1[1] - pared} L${m2.join(" ")}`} className="c-mango-acero" />
        <ellipse cx={e.cx} cy={e.cy - pared} rx={e.rx} ry={e.ry} fill="url(#ilus-cromo)" className="c-sarten-acero-borde" />
        <ellipse cx={e.cx} cy={e.cy - pared + 0.8} rx={e.rx * 0.9} ry={e.ry * 0.86} fill="url(#c-acero-fondo)" className="c-sarten-acero-fondo" />
        <ellipse cx={e.cx - e.rx * 0.28} cy={e.cy - pared - e.ry * 0.15} rx={e.rx * 0.34} ry={e.ry * 0.2} className="c-brillo-acero" />
        <circle cx={m1[0] + 2} cy={m1[1] - pared + 0.4} r={0.9} className="c-remache" />
      </g>
    );
  }
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
  // Más angosta que la zona y alta como una olla real (alto ≈ 0.6 del diámetro).
  const w = r * 1.75 * s;
  return <Olla cx={cx} y={cy} w={w} h={Math.max(alto, r * 1.05) * s} ry={(w / 2) * ((PF - PB) / PDEP)} />;
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
  const olla = (q: Quemador) => <OllaPlano x={q.x} v={q.v} r={q.r * 0.82} />;
  const vaporDe = (q: Quemador) => {
    const [cx, cy] = P(q.x, q.v);
    return <Vapor x={cx} y={cy - 34 * esc(q.v)} n={3} ancho={12} />;
  };

  if (tipo === "profesional") {
    // Rangetop tipo Monogram: dos zonas de rejilla hexagonal con quemadores de
    // latón, plancha al centro con su ventila trasera y frente de perillas.
    const X1 = x1 - 14;
    const X2 = x2 + 14;
    const gv2 = 0.86;
    const zonas: [number, number][] = [
      [X1 + 8, 238],
      [322, X2 - 8],
    ];
    const qs: Quemador[] = zonas.flatMap(([a, b]) => [
      { x: (a + b) / 2, v: v1 + (gv2 - v1) * 0.25, r: 27 },
      { x: (a + b) / 2, v: v1 + (gv2 - v1) * 0.75, r: 31 },
    ]);
    const [fx1, fy] = P(X1, 1);
    const [fx2] = P(X2, 1);
    const fw = fx2 - fx1;
    return (
      <g>
        <polygon points={quad(X1, X2, v1 - dv(14), 1)} fill="url(#dgm-acero)" className="i-panel" />
        <polygon points={quad(X1, X2, v1 - dv(14), 1)} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
        {/* Bandejas de porcelana negra bajo las rejillas */}
        {zonas.map(([a, b]) => (
          <polygon key={a} points={quad(a, b, v1, gv2)} className="c-bandeja" />
        ))}
        {qs.map((q, k) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} estilo={k % 2 ? "oro" : "cromo-laton"} />
        ))}
        {zonas.map(([a, b]) => (
          <RejillaHex key={a} x1={a} x2={b} v1={v1} v2={gv2} />
        ))}
        {/* Plancha al centro y ventila de la plancha atrás */}
        <polygon points={quad(246, 314, v1, v1 + dv(22))} className="c-extractor" />
        <path
          d={Array.from({ length: 11 }, (_, k) => `M${P(250 + k * 6, v1 + dv(3)).join(" ")} L${P(250 + k * 6, v1 + dv(19)).join(" ")}`).join(" ")}
          className="c-extractor-lama"
        />
        <polygon points={quad(246, 314, v1 + dv(26), gv2)} className="c-acero-plano c-plancha-marco" />
        <polygon points={quad(250, 310, v1 + dv(30), gv2 - dv(4))} className="c-teppan" />
        <polygon points={quad(250, 310, v1 + dv(30), gv2 - dv(4))} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
        <polygon points={quad(250, 310, v1 + dv(30), gv2 - dv(4))} fill="url(#c-teppan-calor)" className="c-teppan-calor" />
        {olla(qs[2])}
        {vaporDe(qs[2])}
        {/* Frente de perillas sobre el canto de la cubierta */}
        <Acero x={fx1} y={fy} w={fw} h={44} />
        <line x1={fx1} y1={fy + 0.6} x2={fx2} y2={fy + 0.6} className="c-filo-luz" />
        <circle cx={fx1 + fw * 0.03} cy={fy + 15} r={2} fill="url(#ilus-cromo)" className="c-boton-luz" />
        {[0.11, 0.25, 0.5, 0.75, 0.89].map((f) => (
          <g key={f}>
            <PerillaLaton cx={fx1 + fw * f} cy={fy + 21} r={12.5} />
            <rect x={fx1 + fw * f + 15} y={fy + 33} width={5} height={3.6} rx={0.4} className="c-icono" />
          </g>
        ))}
        <rect x={fx1 + fw * 0.6} y={fy + 20} width={fw * 0.08} height={1.8} className="c-leyenda" />
      </g>
    );
  }
  if (tipo === "tradicional" || tipo === "gas") {
    // Placa de sobreponer tipo io mabe 90 cm: acero cepillado con marco
    // biselado, tres rejillas de hierro, seis quemadores (wok de triple corona
    // al frente izquierdo) y perillas cilíndricas al frente.
    const X1 = 122;
    const X2 = 438;
    const V1 = 0.22;
    const V2 = 0.86;
    const g1 = X1 + 8;
    const g2 = X2 - 8;
    const gv1 = V1 + dv(8);
    const gv2 = V2 - dv(34);
    const sec = (g2 - g1) / 3;
    const cx = (k: number) => g1 + sec * (k + 0.5);
    const atras = gv1 + (gv2 - gv1) * 0.26;
    const frente = gv1 + (gv2 - gv1) * 0.74;
    const qs: (Quemador & { estilo: EstiloQuemador })[] = [
      { x: cx(0), v: atras, r: 23, estilo: "cromo" },
      { x: cx(1), v: atras, r: 25, estilo: "cromo" },
      { x: cx(2), v: atras, r: 23, estilo: "cromo" },
      { x: cx(0), v: frente, r: 33, estilo: "wok" },
      { x: cx(1), v: frente, r: 27, estilo: "cromo" },
      { x: cx(2), v: frente, r: 20, estilo: "cromo" },
    ];
    const vp = V2 - dv(16);
    const [, yc] = P(X1, V2 + dv(5));
    const [xa] = P(X1 - 5, V2 + dv(5));
    const [xb] = P(X2 + 5, V2 + dv(5));
    return (
      <g>
        {/* Marco biselado y placa de acero cepillado */}
        <polygon points={quad(X1 - 5, X2 + 5, V1 - dv(5), V2 + dv(5))} className="c-marco-placa" />
        <polygon points={quad(X1, X2, V1, V2)} fill="url(#dgm-acero)" className="c-acero-plano" />
        <polygon points={quad(X1, X2, V1, V2)} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
        <polygon points={quad(X1, X2, V1, V2)} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
        <rect x={xa} y={yc} width={xb - xa} height={2.5} className="c-canto-acero" />
        {qs.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} estilo={q.estilo} />
        ))}
        {[0, 1, 2].map((k) => (
          <RejillaBarras key={k} x1={g1 + sec * k + 2} x2={g1 + sec * (k + 1) - 2} v1={gv1} v2={gv2} />
        ))}
        {/* Perillas al frente y placa de marca */}
        {Array.from({ length: 6 }, (_, k) => (
          <PerillaCilindro key={k} x={236 + k * 17.6} v={vp} led={k === 2} />
        ))}
        <polygon points={quad(388, 414, vp - dv(4), vp + dv(4))} className="c-placa-marca" />
      </g>
    );
  }
  if (tipo === "vitro") {
    // Vitrocerámica tipo Teka 60 cm: vidrio negro con marco fino, cuatro zonas
    // (la de atrás a la izquierda es doble) y control táctil al centro.
    const X1 = 150;
    const X2 = 410;
    const V1 = 0.24;
    const V2 = 0.86;
    const zonas: { q: Quemador; doble?: boolean }[] = [
      { q: { x: 205, v: 0.43, r: 50 }, doble: true },
      { q: { x: 348, v: 0.41, r: 40 } },
      { q: { x: 207, v: 0.73, r: 29 } },
      { q: { x: 346, v: 0.71, r: 34 } },
    ];
    const vp = V2 - dv(14);
    const [px1, py] = P(250, vp);
    const [px2] = P(310, vp);
    return (
      <g>
        <polygon points={quad(X1 - 3, X2 + 3, V1 - dv(3), V2 + dv(3))} className="c-marco-placa" />
        <Placa x1={X1} x2={X2} v1={V1} v2={V2} />
        {zonas.map(({ q, doble }) => (
          <ZonaVitro key={`${q.x}-${q.v}`} q={q} doble={doble} />
        ))}
        {/* Panel táctil: líneas guía, dígitos de potencia y teclas */}
        <g className="c-panel-vitro">
          <line x1={px1} y1={py - 7} x2={px2} y2={py - 7} className="c-guia-tactil" />
          <line x1={px1} y1={py + 7} x2={px2} y2={py + 7} className="c-guia-tactil" />
          {[0.08, 0.6].map((f) =>
            [-3.2, 3.2].map((dy) => (
              <text key={`${f}${dy}`} x={px1 + (px2 - px1) * f} y={py + dy + 1.4} className="c-digito">
                9
              </text>
            )),
          )}
          {[0.28, 0.42, 0.86].map((f) => (
            <circle key={f} cx={px1 + (px2 - px1) * f} cy={py - 3} r={1.4} className="c-tecla-vitro" />
          ))}
          {[0.3, 0.44, 0.86].map((f) => (
            <circle key={f} cx={px1 + (px2 - px1) * f} cy={py + 3} r={1.4} className="c-tecla-vitro" />
          ))}
        </g>
        <polygon points={quad(X1 + 8, X1 + 22, V2 - dv(10), V2 - dv(7))} className="c-leyenda-vidrio" />
        <polygon points={quad(X2 - 24, X2 - 8, V2 - dv(11), V2 - dv(6))} className="c-leyenda-vidrio" />
      </g>
    );
  }
  if (tipo === "induccion") {
    // Inducción tipo Monogram 90 cm: vidrio negro con aros cromados, zona puente
    // a la izquierda, zona grande al centro y controles de dial al frente.
    const X1 = 118;
    const X2 = 442;
    const V1 = 0.22;
    const V2 = 0.86;
    const izq: Quemador[] = [
      { x: 172, v: 0.38, r: 32 },
      { x: 172, v: 0.66, r: 32 },
    ];
    const zonas: Quemador[] = [...izq, { x: 280, v: 0.42, r: 50 }, { x: 390, v: 0.37, r: 28 }, { x: 386, v: 0.65, r: 38 }];
    const puente = [-1, 1].map((l) => {
      const xx = 172 + l * 36;
      return `M${P(xx, 0.48).join(" ")} L${P(xx, 0.56).join(" ")}`;
    });
    const diales: [number, number][] = [
      [254, 0.69],
      [280, 0.67],
      [306, 0.69],
      [242, 0.79],
      [318, 0.79],
    ];
    return (
      <g>
        <Placa x1={X1} x2={X2} v1={V1} v2={V2} />
        {zonas.map((q) => (
          <ZonaAro key={`${q.x}-${q.v}`} q={q} />
        ))}
        <path d={puente.join(" ")} className="c-aro c-puente" />
        {/* Controles de dial: arco, botón al centro y su menos/más */}
        {diales.map(([dx, dvv]) => (
          <g key={`${dx}-${dvv}`} className="c-dial">
            <path d={arcoPlano(dx, dvv, 9, 160, 380)} className="c-dial-arco" />
            <path d={arcoPlano(dx, dvv, 9, 160, 250)} className="c-dial-on" />
            <ellipse {...elip(dx, dvv, 3)} className="c-dial-centro" />
          </g>
        ))}
        <polygon points={quad(272, 290, 0.77, 0.83)} className="c-pantalla" />
        <polygon points={quad(X1 + 8, X1 + 30, V2 - dv(9), V2 - dv(6))} className="c-leyenda-vidrio" />
        <OllaPlano x={280} v={0.42} r={34} alto={30} />
        {vaporDe({ x: 280, v: 0.42, r: 40 })}
      </g>
    );
  }
  if (tipo === "extraccion") {
    // Inducción con extracción tipo Elica 80 cm: vidrio negro, cuatro zonas
    // marcadas apenas, ventila al centro y sliders rojos al frente; el humo de
    // la olla y la sartén baja hacia la ventila.
    const X1 = 128;
    const X2 = 432;
    const V1 = 0.22;
    const V2 = 0.86;
    const zonas: Quemador[] = [
      { x: 188, v: 0.4, r: 34 },
      { x: 190, v: 0.66, r: 40 },
      { x: 372, v: 0.39, r: 40 },
      { x: 372, v: 0.66, r: 34 },
    ];
    const [vx1, vx2, vv1, vv2] = [262, 298, 0.27, 0.6];
    const [cx, cy] = P(280, (vv1 + vv2) / 2);
    const olla = P(190, 0.66);
    const desde: [number, number][] = [[olla[0] + 18, olla[1] - 24]];
    return (
      <g>
        <Placa x1={X1} x2={X2} v1={V1} v2={V2} />
        {zonas.map((q) => (
          <ZonaMarcas key={`${q.x}-${q.v}`} q={q} sinPerimetro />
        ))}
        {/* Ventila central: marco, rejilla y lamas a lo largo */}
        <polygon points={quad(vx1 - 3, vx2 + 3, vv1 - dv(3), vv2 + dv(3))} className="c-ventila-marco" />
        <polygon points={quad(vx1, vx2, vv1, vv2)} className="c-extractor" />
        <path
          d={Array.from({ length: 12 }, (_, k) => {
            const vv = vv1 + ((vv2 - vv1) * (k + 0.5)) / 12;
            return `M${P(vx1 + 3, vv).join(" ")} L${P(vx2 - 3, vv).join(" ")}`;
          }).join(" ")}
          className="c-extractor-lama"
        />
        <line x1={P(280, vv1)[0]} y1={P(280, vv1)[1]} x2={P(280, vv2)[0]} y2={P(280, vv2)[1]} className="c-ventila-riel" />
        {/* Sliders de potencia y el de la extracción arriba al centro */}
        <Slider x={172} v={0.8} w={36} digito="6" nivel={0.6} />
        <Slider x={226} v={0.8} w={36} digito="0" nivel={0} />
        <Slider x={306} v={0.8} w={36} digito="7" nivel={0.7} />
        <Slider x={360} v={0.8} w={36} digito="0" nivel={0} />
        <Slider x={264} v={0.71} w={34} digito="8" nivel={0.8} />
        <OllaPlano x={190} v={0.66} r={34} alto={26} />
        <Aire
          trazos={desde.flatMap(([ox, oy], k) => [
            `M${ox} ${oy} C ${ox + (cx - ox) * 0.3} ${oy - 18}, ${ox + (cx - ox) * 0.7} ${cy - 22}, ${cx + (k ? 4 : -4)} ${cy}`,
            `M${ox} ${oy + 6} C ${ox + (cx - ox) * 0.35} ${oy - 8}, ${ox + (cx - ox) * 0.75} ${cy - 10}, ${cx + (k ? 6 : -6)} ${cy + 6}`,
          ])}
        />
      </g>
    );
  }
  if (tipo === "hibrida") {
    // Híbrida tipo Teka 90 cm: vidrio negro; a la izquierda gas con dos rejillas
    // de hierro y perillas cromadas, a la derecha dos zonas de inducción con sus
    // controles táctiles rojos.
    const X1 = 110;
    const X2 = 450;
    const V1 = 0.22;
    const V2 = 0.86;
    const gv1 = 0.27;
    const gv2 = 0.74;
    const gas: (Quemador & { estilo: EstiloQuemador })[] = [
      { x: 166, v: 0.39, r: 27, estilo: "wok" },
      { x: 166, v: 0.63, r: 20, estilo: "cromo" },
      { x: 254, v: 0.37, r: 22, estilo: "cromo" },
      { x: 254, v: 0.62, r: 26, estilo: "cromo" },
    ];
    const ind: Quemador[] = [
      { x: 390, v: 0.42, r: 46 },
      { x: 342, v: 0.68, r: 30 },
    ];
    return (
      <g>
        <Placa x1={X1} x2={X2} v1={V1} v2={V2} />
        <line x1={P(X1 + 6, V2 - dv(6))[0]} y1={P(X1 + 6, V2 - dv(6))[1]} x2={P(X2 - 6, V2 - dv(6))[0]} y2={P(X2 - 6, V2 - dv(6))[1]} className="c-filete" />
        {gas.map((q) => (
          <QuemadorPlano key={`${q.x}-${q.v}`} q={q} estilo={q.estilo} />
        ))}
        <RejillaBarras x1={122} x2={208} v1={gv1} v2={gv2} />
        <RejillaBarras x1={212} x2={298} v1={gv1} v2={gv2} />
        {[138, 160, 182, 204].map((kx) => (
          <PerillaCilindro key={kx} x={kx} v={0.8} />
        ))}
        {ind.map((q) => (
          <ZonaMarcas key={`${q.x}-${q.v}`} q={q} />
        ))}
        <Slider x={316} v={0.8} w={30} digito="9" nivel={0.9} />
        <Slider x={372} v={0.8} w={30} digito="9" nivel={0.9} />
        <text x={P(420, 0.8)[0]} y={P(420, 0.8)[1] - 1} className="c-digito c-digito--slider">
          99
        </text>
        <polygon points={quad(X2 - 30, X2 - 10, V2 - dv(9), V2 - dv(6))} className="c-leyenda-vidrio" />
      </g>
    );
  }
  if (tipo === "submontar") {
    // Quemadores sueltos directo en la piedra: rejillas redondas de hierro con
    // cuatro brazos, wok al centro con su aro alto y perillas negras al frente.
    const qs: Quemador[] = [
      { x: 172, v: 0.36, r: 32 },
      { x: 388, v: 0.36, r: 32 },
      { x: 172, v: 0.7, r: 32 },
      { x: 388, v: 0.7, r: 32 },
    ];
    const wok: Quemador = { x: 280, v: 0.5, r: 42 };
    return (
      <g>
        {qs.map((q) => (
          <QuemadorSuelto key={`${q.x}-${q.v}`} q={q} />
        ))}
        <QuemadorSuelto q={wok} wok />
        {[244, 262, 280, 298, 316].map((kx) => (
          <PerillaNegra key={kx} x={kx} v={0.9} />
        ))}
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
        {/* Panel táctil de vidrio negro sobre la piedra, al frente */}
        <polygon points={quad(232, 328, 0.86, 0.96)} className="c-sombra" />
        <polygon points={quad(230, 330, 0.85, 0.95)} className="c-panel-negro" />
        <polygon points={quad(230, 330, 0.85, 0.95)} className="c-panel-reflejo" />
        {Array.from({ length: 9 }, (_, k) => (
          <ellipse key={k} {...elip(256 + k * 7, 0.925, 1.6)} className="c-tactil" />
        ))}
        {[248, 264, 280, 296, 312].map((tx) => (
          <ellipse key={tx} {...elip(tx, 0.88, 2.6)} className="c-tecla-vitro c-tecla-invisible" />
        ))}
        <ellipse {...elip(320, 0.925, 2.8)} className="c-tecla-vitro c-tecla-invisible" />
        {olla(qs[0])}
        {vaporDe(qs[0])}
        <OllaPlano x={qs[3].x} v={qs[3].v} r={qs[3].r * 0.82} sarten="acero" />
      </g>
    );
  }
  if (tipo === "modular" || tipo === "superficie") {
    // Línea Vario tipo Gaggenau: inducción · extracción de superficie · gas
    // (wok de latón y quemador chico con rejilla de hierro) y las perillas de
    // acero en el frente del mueble, con su anillo de luz naranja al encender.
    const V1 = 0.22;
    const V2 = 0.86;
    const [in1, in2, ex1, ex2, ga1, ga2] = [128, 278, 283, 327, 332, 432];
    const zona: Quemador = { x: (in1 + in2) / 2, v: 0.53, r: 56 };
    // Gas en vertical (Vario 30 cm): quemador grande atrás y chico al frente.
    const gx = (ga1 + ga2) / 2;
    const vm = (V1 + V2) / 2;
    const atras: Quemador = { x: gx, v: 0.36, r: 22 };
    const frente: Quemador = { x: gx, v: 0.7, r: 18 };
    const q7 = (q: Quemador) => q.r * 0.6;
    const [vcx, vcy] = P((ex1 + ex2) / 2, 0.5);
    const [ox, oy] = P(zona.x, zona.v);
    // Rejilla de hierro: marco, travesaño al centro, brazos de cada quemador al
    // marco y el rombo que une los dos quemadores pasando por el travesaño.
    const g = (x: number, v: number) => P(x, v).join(" ");
    const gw = ga2 - ga1 - 12;
    const marco = [ga1 + 6, ga2 - 6, V1 + dv(6), V2 - dv(6)] as const;
    const rejilla = [
      `M${g(marco[0], marco[2])} L${g(marco[1], marco[2])} L${g(marco[1], marco[3])} L${g(marco[0], marco[3])} Z`,
      `M${g(marco[0], vm)} L${g(marco[1], vm)}`,
      ...[atras, frente].flatMap((q) => [
        `M${g(marco[0], q.v)} L${g(q.x - q.r * 0.7, q.v)}`,
        `M${g(q.x + q.r * 0.7, q.v)} L${g(marco[1], q.v)}`,
      ]),
      // Atrás: brazos en V hacia el marco trasero
      `M${g(atras.x - q7(atras), atras.v - dv(q7(atras)))} L${g(gx - gw * 0.3, marco[2])}`,
      `M${g(atras.x + q7(atras), atras.v - dv(q7(atras)))} L${g(gx + gw * 0.3, marco[2])}`,
      // Rombo entre los dos quemadores
      `M${g(atras.x - q7(atras), atras.v + dv(q7(atras)))} L${g(gx - gw * 0.42, vm)} L${g(frente.x - q7(frente), frente.v - dv(q7(frente)))}`,
      `M${g(atras.x + q7(atras), atras.v + dv(q7(atras)))} L${g(gx + gw * 0.42, vm)} L${g(frente.x + q7(frente), frente.v - dv(q7(frente)))}`,
      // Frente: brazos en V hacia el marco frontal
      `M${g(frente.x - q7(frente), frente.v + dv(q7(frente)))} L${g(gx - gw * 0.3, marco[3])}`,
      `M${g(frente.x + q7(frente), frente.v + dv(q7(frente)))} L${g(gx + gw * 0.3, marco[3])}`,
    ].join(" ");
    const perillas = [(in1 + in2) / 2, (ex1 + ex2) / 2, gx - 22, gx + 22];
    return (
      <g>
        {/* Inducción: vidrio negro con una zona flexible */}
        <Placa x1={in1} x2={in2} v1={V1} v2={V2} />
        <ZonaMarcas q={zona} sinPerimetro />
        <ellipse {...elip(zona.x, zona.v, zona.r)} className="c-zona-tenue" />
        <polygon points={quad(in1 + 8, in1 + 30, V2 - dv(9), V2 - dv(6))} className="c-leyenda-vidrio" />
        {/* Extracción: marco de acero y barras de hierro a lo largo */}
        <Placa x1={ex1} x2={ex2} v1={V1} v2={V2} acabado="acero" />
        <polygon points={quad(ex1 + 5, ex2 - 5, V1 + dv(6), V2 - dv(14))} className="c-extractor" />
        <path
          d={Array.from({ length: 5 }, (_, k) => {
            const xx = ex1 + 9 + ((ex2 - ex1 - 18) * k) / 4;
            return `M${P(xx, V1 + dv(9)).join(" ")} L${P(xx, V2 - dv(17)).join(" ")}`;
          }).join(" ")}
          className="c-barra-ventila"
        />
        {/* Gas: charola de acero, quemadores de latón y rejilla de hierro */}
        <Placa x1={ga1} x2={ga2} v1={V1} v2={V2} acabado="acero" />
        <QuemadorPlano q={atras} estilo="oro" />
        <QuemadorPlano q={frente} estilo="oro" />
        <path d={rejilla} className="c-rejilla" />
        <path d={rejilla} className="c-rejilla-brillo" />
        {/* Olla en la inducción; el vapor baja a la extracción */}
        <OllaPlano x={zona.x} v={zona.v} r={30} />
        <Aire
          trazos={[
            `M${ox + 18} ${oy - 32} C ${ox + 40} ${oy - 40}, ${vcx - 14} ${vcy - 26}, ${vcx} ${vcy - 2}`,
            `M${ox + 22} ${oy - 22} C ${ox + 44} ${oy - 26}, ${vcx - 10} ${vcy - 14}, ${vcx + 2} ${vcy + 4}`,
          ]}
        />
        {tipo === "modular" && <Vapor x={ox} y={oy - 40} n={3} />}
        {/* Perillas de acero en el frente del mueble, con anillo de luz */}
        {perillas.map((kx) => (
          <PerillaLuz key={kx} cx={kx} cy={344} />
        ))}
      </g>
    );
  }
  return null;
}

/* ——— Campanas ——————————————————————————————————————————————————— */

type TipoCampana =
  | "pared" | "isla" | "recta" | "t-invertida" | "cristal" | "piramidal" | "cilindrica" | "inserto" | "bajo-mueble"
  | "slider" | "revestir" | "techo" | "decorativa" | "retractil" | "gran-formato" | "repisa" | "monolith" | "airwall";

/** Luz de la campana (cono sobre la cocción) + tira LED, se encienden juntas.
 *  `fija`: encendida también en reposo, con focos y charco de luz sobre la
 *  cubierta (escenas de estufa, donde la campana es parte del ambiente). */
function LuzCampana({ x1, x2, y, piso, ancho = 1.15, fija }: { x1: number; x2: number; y: number; piso: number; ancho?: number; fija?: boolean }) {
  const cx = (x1 + x2) / 2;
  const w = (x2 - x1) * ancho;
  const focos = fija ? [x1 + (x2 - x1) * 0.25, x1 + (x2 - x1) * 0.75] : [];
  return (
    <g className={fija ? "c-luz c-luz--fija" : "c-luz"}>
      <polygon points={pts([[x1 + 6, y], [x2 - 6, y], [cx + w / 2, piso], [cx - w / 2, piso]])} fill="url(#c-cono-led)" />
      {focos.map((fx) => (
        <polygon
          key={fx}
          points={pts([[fx - 4, y], [fx + 4, y], [fx + 26, piso], [fx - 26, piso]])}
          fill="url(#c-cono-led)"
          className="c-haz"
        />
      ))}
      {fija && <ellipse cx={cx} cy={piso - 2} rx={w / 2} ry={7} className="c-charco" />}
      <line x1={x1 + 8} y1={y + 0.6} x2={x2 - 8} y2={y + 0.6} className="c-led" />
      {focos.map((fx) => (
        <g key={fx}>
          <circle cx={fx} cy={y + 1} r={5} className="c-foco-halo" />
          <ellipse cx={fx} cy={y + 0.8} rx={3} ry={1.2} className="c-foco" />
        </g>
      ))}
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
      // La visera ocupa el hueco entre alacenas, sin pasar sobre los muebles.
      return {
        el: (
          <g>
            {chim(56, 144)}
            <Acero x={x1 + 15} y={144} w={ancho - 30} h={10} />
            <rect x={x1 + 15} y={153} width={ancho - 30} height={2} className="c-filtro" />
          </g>
        ),
        boca: [x1 + 15, x2 - 15, 155],
        ducto: [cx, 24, 140],
      };
    case "cristal": {
      // Tipo io mabe: chimenea rectangular ancha con placa de marca, caja de
      // controles abajo y visera de vidrio templado curva con canto verde agua.
      const a = x1 + 14;
      const b = x2 - 14;
      const cw = 66;
      return {
        el: (
          <g>
            <Acero x={cx - cw / 2} y={20} w={cw} h={112} />
            <rect x={cx - 10} y={116} width={20} height={4} rx={0.6} fill="url(#ilus-cromo-h)" className="c-insignia" />
            {/* Caja de controles bajo la chimenea */}
            <Acero x={cx - cw / 2 + 2} y={132} w={cw - 4} h={12} />
            {[-0.32, -0.16, 0.16, 0.32].map((f) => (
              <circle key={f} cx={cx + cw * f} cy={139} r={1.6} fill="url(#ilus-cromo)" className="c-boton-luz" />
            ))}
            <rect x={cx - 2.6} y={136.5} width={5.2} height={5} rx={0.6} className="c-display" />
            {/* Visera curva: centro alto, extremos bajos */}
            <path d={`M${a} 158 Q ${cx} 118 ${b} 158 L ${b} 163 Q ${cx} 124 ${a} 163 Z`} className="c-visera-cristal c-visera-cristal--io" />
            <path d={`M${a + 8} 154 Q ${cx} 121 ${b - 8} 154`} className="c-cristal-brillo" />
            <path d={`M${a} 163 Q ${cx} 124 ${b} 163`} className="c-cristal-canto" />
          </g>
        ),
        boca: [a + 10, b - 10, 146],
        ducto: [cx, 24, 128],
      };
    }
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
    case "inserto": {
      // Mueble de carpintería a la medida del hueco que oculta el inserto. Al
      // encender, la madera se vuelve translúcida y deja ver el inserto (cuerpo
      // de acero con su cámara) y el ducto que sube.
      const m1 = x1 + 13;
      const m2 = x2 - 13;
      const i1 = m1 + 10;
      const i2 = m2 - 10;
      return {
        el: (
          <g>
            {/* Por dentro: ducto, cámara y cuerpo del inserto */}
            <Acero x={cx - 14} y={20} w={28} h={74} />
            <polygon points={pts([[cx - 46, 92], [cx + 46, 92], [i2, 136], [i1, 136]])} fill="url(#dgm-acero)" className="i-panel" />
            <polygon points={pts([[cx - 46, 92], [cx + 46, 92], [i2, 136], [i1, 136]])} fill="url(#ilus-acero-luz)" className="i-acero-luz" />
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((f) => (
              <circle key={f} cx={cx - 46 + 92 * f} cy={94} r={0.8} className="c-remache" />
            ))}
            <Acero x={i1} y={136} w={i2 - i1} h={18} />
            {/* Mueble que lo oculta */}
            <g className="c-mueble-inserto">
              <rect x={m1} y={20} width={m2 - m1} height={134} className="i-mueble" />
              <rect x={m1} y={20} width={m2 - m1} height={134} className="i-modelado" />
              <rect x={m1 - 3} y={120} width={m2 - m1 + 6} height={10} className="i-mueble" />
              <rect x={m1 - 3} y={120} width={m2 - m1 + 6} height={10} className="c-moldura" />
              <rect x={m1 + 0.5} y={20.5} width={m2 - m1 - 1} height={133} className="i-panel-canto" />
            </g>
            {/* Frente inferior del inserto: marco, rejillas, luces y perillas */}
            <polygon points={pts([[i1, 154], [i2, 154], [i2 + 6, 166], [i1 - 6, 166]])} fill="url(#dgm-acero)" className="i-panel c-marco-inserto" />
            <polygon points={pts([[i1 + 5, 156], [i2 - 5, 156], [i2, 164], [i1, 164]])} className="c-fondo-rejilla" />
            {Array.from({ length: 16 }, (_, k) => {
              const f = (k + 0.5) / 16;
              const xa = i1 + 5 + (i2 - i1 - 10) * f;
              const xb = i1 + (i2 - i1) * f;
              return <line key={k} x1={xa} y1={156.5} x2={xb} y2={163.5} className={k % 2 ? "c-lama-oscura" : "c-lama-clara"} />;
            })}
            {[0.12, 0.34, 0.66, 0.88].map((f) => (
              <rect key={f} x={i1 + (i2 - i1) * f - 4} y={155} width={8} height={1.4} rx={0.6} className="c-led-inserto" />
            ))}
            {[-6, 0, 6].map((d) => (
              <circle key={d} cx={cx + d} cy={157} r={1.6} fill="url(#ilus-cromo)" className="c-boton-luz" />
            ))}
          </g>
        ),
        boca: [i1, i2, 166],
        ducto: [cx, 24, 92],
      };
    }
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
    case "revestir": {
      // Panel de la misma madera que las alacenas, que cubre todo el hueco del
      // plafón al filtro y esconde la campana (Carla, 2026-10-21). Al encender el
      // panel se vuelve translúcido y deja ver la estructura: ducto, transición
      // de lámina, caja con el motor y, abajo, sus filtros de malla y focos (Teka).
      const a = x1 + 13;
      const b = x2 - 13;
      const i1 = a + 14;
      const i2 = b - 14;
      return {
        el: (
          <g>
            {/* Por dentro */}
            <Acero x={cx - 14} y={20} w={28} h={78} />
            <polygon points={pts([[cx - 18, 96], [cx + 18, 96], [i2, 116], [i1, 116]])} fill="url(#dgm-acero)" className="i-panel" />
            <Acero x={i1} y={116} w={i2 - i1} h={30} />
            {[0.08, 0.92].map((f) => (
              <circle key={f} cx={i1 + (i2 - i1) * f} cy={122} r={0.9} className="c-remache" />
            ))}
            <circle cx={cx} cy={131} r={10} className="c-motor" />
            <circle cx={cx} cy={131} r={3} className="c-motor-eje" />
            <g className="c-mueble-inserto">
              <rect x={a} y={20} width={b - a} height={126} className="i-mueble" />
              <rect x={a} y={20} width={b - a} height={126} className="i-modelado" />
              <rect x={a + 0.5} y={20.5} width={b - a - 1} height={125} className="i-panel-canto" />
            </g>
            {/* Frente inferior: filtros de malla, panel central con dos focos y controles */}
            <Acero x={i1 - 4} y={146} w={i2 - i1 + 8} h={9} />
            <rect x={i1} y={147.5} width={(i2 - i1) * 0.38} height={6} fill="url(#c-malla)" className="c-malla" />
            <rect x={i2 - (i2 - i1) * 0.38} y={147.5} width={(i2 - i1) * 0.38} height={6} fill="url(#c-malla)" className="c-malla" />
            {[-6, 6].map((d) => (
              <g key={d}>
                <circle cx={cx + d} cy={150.5} r={2.4} fill="url(#ilus-cromo)" className="c-perilla" />
                <circle cx={cx + d} cy={150.5} r={1.3} className="c-foco-campana" />
              </g>
            ))}
            {[-14, -10, 10, 14].map((d) => (
              <circle key={d} cx={cx + d} cy={145} r={0.9} className={d === -14 ? "c-piloto-rojo" : "c-boton-cilindro"} />
            ))}
          </g>
        ),
        boca: [i1, i2, 155],
        ducto: [cx, 24, 116],
      };
    }
    case "airwall": {
      // Panel luminoso apoyado en la cubierta detrás de la parrilla, más ancho
      // que ella, con marco negro delgado y la ranura de extracción a media
      // altura, cargada a la derecha (referencia de Carla, 2026-10-21).
      const p1 = x1 + 4;
      const p2 = x2 - 4;
      const yt = 170;
      return {
        el: (
          <g>
            <rect x={p1 - 2} y={yt - 2} width={p2 - p1 + 4} height={70} className="c-airwall-halo" />
            <rect x={p1} y={yt} width={p2 - p1} height={66} className="c-airwall-marco" />
            <rect x={p1 + 1.6} y={yt + 1.6} width={p2 - p1 - 3.2} height={64} fill="url(#c-airwall-cara)" />
            <rect x={p1 + 1.6} y={yt + 1.6} width={p2 - p1 - 3.2} height={64} className="c-airwall-encendido" />
            {/* Ranura: sombra arriba, boca negra, labio claro y el tope a la izquierda */}
            <rect x={cx - 10} y={yt + 27.6} width={62} height={1.4} className="c-airwall-sombra" />
            <rect x={cx - 10} y={yt + 29} width={62} height={4} className="c-airwall-ranura" />
            <rect x={cx - 16} y={yt + 27.5} width={7} height={7.5} className="c-airwall-ranura" />
            <line x1={cx - 16} y1={yt + 35.4} x2={cx + 52} y2={yt + 35.4} className="c-airwall-labio" />
          </g>
        ),
        boca: [cx - 10, cx + 52, yt + 31],
      };
    }
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
      // Tipo Elica: tubo del mismo diámetro desde el plafón y cuerpo cilíndrico
      // alto con sus botones al costado; la luz y la extracción salen por abajo.
      // La base queda a 60 cm de la parrilla (Carla, 2026-10-21): la isla mide
      // 90 cm en 144 u → 1.6 u/cm → 96 u sobre la cubierta (ISLA_Y − 12).
      return {
        el: (
          <g>
            <rect x={cx - 30} y={20} width={60} height={40} fill="url(#c-cilindro-oscuro)" className="c-cilindro" />
            <ellipse cx={cx} cy={60} rx={30} ry={3} className="c-cilindro-junta" />
            <rect x={cx - 33} y={60} width={66} height={64} fill="url(#c-cilindro-oscuro)" className="c-cilindro" />
            <rect x={cx - 33} y={60} width={66} height={64} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
            {[78, 86, 94].map((y) => (
              <rect key={y} x={cx - 27} y={y} width={2.4} height={4} rx={0.8} className={y === 86 ? "c-boton-azul" : "c-boton-cilindro"} />
            ))}
            <ellipse cx={cx} cy={124} rx={33} ry={4.5} className="c-cilindro-base" />
            <ellipse cx={cx} cy={124} rx={20} ry={2.6} className="c-led-cilindro" />
          </g>
        ),
        boca: [cx - 33, cx + 33, 126],
        ducto: [cx, 24, 58],
      };
    case "techo":
      return {
        el: (
          <g>
            <rect x={cx - 110} y={20} width={220} height={8} className="c-techo-panel" />
            <rect x={cx - 100} y={27} width={200} height={2} className="c-filtro" />
            {/* Control para extracción e iluminación, sobre la isla; se ilumina al encender */}
            <polygon points={pts([[392, ISLA_Y - 17], [418, ISLA_Y - 17], [420, ISLA_Y - 11], [390, ISLA_Y - 11]])} className="c-control-remoto" />
            {[0, 1, 2, 3].map((k) => (
              <ellipse key={k} cx={396 + k * 6} cy={ISLA_Y - 14} rx={1.6} ry={0.9} className="c-tecla-control" />
            ))}
          </g>
        ),
        boca: [cx - 104, cx + 104, 29],
      };
    case "decorativa":
      // Tipo lámpara (Elica): plafón redondo, dos tensores y el cable en espiral;
      // pantalla cónica de acero con el borde enrollado y focos en el disco de abajo.
      return {
        el: (
          <g>
            <ellipse cx={cx} cy={24} rx={44} ry={6} fill="url(#c-cilindro-oscuro)" className="c-cilindro" />
            {[-30, 30].map((d) => (
              <line key={d} x1={cx + d} y1={26} x2={cx + d * 0.95} y2={84} className="c-tensor" />
            ))}
            <path d={`M${cx} 28 C ${cx - 14} 44, ${cx + 16} 56, ${cx + 6} 84`} className="c-cable-espiral" />
            <path d={`M${cx - 40} 84 L ${cx + 40} 84 L ${cx + 64} 160 Q ${cx} 170 ${cx - 64} 160 Z`} fill="url(#c-cilindro-oscuro)" className="c-cilindro" />
            <path d={`M${cx - 40} 84 L ${cx + 40} 84 L ${cx + 64} 160 Q ${cx} 170 ${cx - 64} 160 Z`} fill="url(#ilus-acero-bandas)" className="i-acero-luz" />
            <ellipse cx={cx} cy={84} rx={40} ry={3.5} className="c-cilindro-junta" />
            <path d={`M${cx + 30} 165 Q ${cx + 50} 164 ${cx + 64} 160`} className="c-borde-enrollado" />
            <ellipse cx={cx} cy={162} rx={58} ry={5} className="c-disco-claro" />
            {[-30, 30].map((d) => (
              <circle key={d} cx={cx + d} cy={162} r={1.8} className="c-foco-campana" />
            ))}
          </g>
        ),
        boca: [cx - 60, cx + 60, 166],
      };
    case "monolith": {
      // Bloque de aluminio negro con frente de vidrio apoyado en la cubierta,
      // detrás de la parrilla (referencia de Carla y texto de Cowork,
      // 2026-10-21): tres módulos con tira de luz abajo; su canal superior
      // guarda utensilios y una tabla. Al encender, el módulo central se abre
      // ligeramente, deja ver los controles y capta el vapor a ras de cubierta.
      const yb = ISLA_Y - 22; // canto trasero de la cubierta
      const yt = yb - 30;
      return {
        el: (
          <g>
            {/* Utensilios y tabla que asoman del canal */}
            <line x1={98} y1={yt - 26} x2={100} y2={yt} className="c-utensilio" />
            <ellipse cx={97.6} cy={yt - 28} rx={3.2} ry={4.6} className="c-utensilio-cabeza" />
            <line x1={110} y1={yt - 22} x2={109} y2={yt} className="c-utensilio c-utensilio--acero" />
            <rect x={106} y={yt - 30} width={6} height={9} rx={1} className="c-utensilio-pala" />
            <rect x={130} y={yt - 12} width={8} height={12} rx={1.5} className="c-frasco" />
            <rect x={141} y={yt - 10} width={8} height={10} rx={1.5} className="c-frasco" />
            <rect x={400} y={yt - 22} width={34} height={22} rx={3} className="i-tabla" />
            <rect x={70} y={yb - 1} width={420} height={4} className="c-led-barra" />
            <rect x={70} y={yt} width={420} height={30} className="c-monolith" />
            <polygon points={pts([[100, yt], [130, yt], [110, yb], [80, yb]])} className="c-reflejo" />
            <rect x={70} y={yt - 2} width={420} height={2.5} fill="url(#ilus-cromo-h)" className="i-panel" />
            {[210, 350].map((x) => (
              <line key={x} x1={x} y1={yt} x2={x} y2={yb} className="c-junta-monolith" />
            ))}
            <rect x={214} y={yt - 3} width={132} height={3} className="c-ranura-negra" />
            <g className="c-tapa-monolith">
              <rect x={212} y={yt - 14} width={136} height={14} className="c-monolith" />
              <polygon points={pts([[240, yt - 14], [256, yt - 14], [240, yt], [224, yt]])} className="c-reflejo" />
              <rect x={212} y={yt - 14} width={136} height={2} fill="url(#ilus-cromo-h)" className="i-panel" />
              {[0, 1, 2, 3].map((k) => (
                <ellipse key={k} cx={268 + k * 8} cy={yt - 6} rx={1.8} ry={1} className="c-tecla-control" />
              ))}
            </g>
          </g>
        ),
        boca: [214, 346, yt - 2],
      };
    }
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
  // Torre de acero tipo Thermador: tapa superior, postes laterales, boca de
  // captación con su pestaña, panel inferior y tira de control azul a la derecha.
  const y = ISLA_Y - 20;
  const t = y - 64;
  return (
    <g className="c-retractil">
      <Acero x={206} y={t + 6} w={148} h={60} />
      <rect x={212} y={t + 7} width={136} height={12} className="c-boca-downdraft" />
      <Acero x={212} y={t + 19} w={136} h={5} />
      <line x1={212} y1={t + 24} x2={348} y2={t + 24} className="c-filo-sombra" />
      <line x1={212} y1={t + 54} x2={348} y2={t + 54} className="c-junta-acero" />
      <Acero x={202} y={t + 2} w={10} h={64} />
      <Acero x={348} y={t + 2} w={10} h={64} />
      <Acero x={200} y={t} w={160} h={5} />
      <rect x={276} y={t + 1.6} width={8} height={1.2} className="c-leyenda" />
      <rect x={350.5} y={t + 10} width={5} height={30} rx={1} className="c-tira-azul" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <rect key={k} x={352} y={t + 13 + k * 4.4} width={2} height={1.2} className="c-tira-azul-txt" />
      ))}
    </g>
  );
}

/** Parrilla de inducción sobre la isla: vidrio negro sobre el plano de la
 *  cubierta, con sus líneas de zona que se encienden, olla y vapor. */
function ParrillaInduccionIsla() {
  return (
    <g>
      <polygon points={pts([[200, ISLA_Y - 20], [360, ISLA_Y - 20], [368, ISLA_Y - 5], [192, ISLA_Y - 5]])} className="c-vidrio-negro" />
      <polygon points={pts([[200, ISLA_Y - 20], [360, ISLA_Y - 20], [368, ISLA_Y - 5], [192, ISLA_Y - 5]])} className="c-reflejo" />
      {[206, 354].map((x) => (
        <line key={x} x1={x} y1={ISLA_Y - 18} x2={x + (x < 280 ? -4 : 4)} y2={ISLA_Y - 7} className="c-linea-zona" />
      ))}
      <ellipse cx={252} cy={ISLA_Y - 12} rx={22} ry={3.5} className="c-zona-calor c-zona-calor--ind" fill="url(#c-ind)" />
      <Olla cx={252} y={ISLA_Y - 12} w={34} h={24} />
      <Vapor x={252} y={ISLA_Y - 40} />
    </g>
  );
}

/** Tapa de la ranura del retráctil sobre la cubierta (siempre visible). */
function RanuraRetractil() {
  const y = ISLA_Y - 20;
  return <polygon points={pts([[200, y - 2], [360, y - 2], [362, y + 1], [198, y + 1]])} className="c-canto-acero" />;
}

/* ——— Microondas, cafeteras ———————————————————————————————————————— */

/** Vaso de vidrio doble con café (y leche si es latte); el café sube al encender. */
function VasoCafe({ cx, y, w, h, latte }: { cx: number; y: number; w: number; h: number; latte?: boolean }) {
  const b = w * 0.1; // el vaso se angosta hacia abajo
  return (
    <g>
      <path d={`M${cx - w / 2} ${y - h} L${cx + w / 2} ${y - h} L${cx + w / 2 - b} ${y} L${cx - w / 2 + b} ${y} Z`} className="c-vaso" />
      {latte && <rect x={cx - w / 2 + b + 0.6} y={y - h * 0.42} width={w - 2 * b - 1.2} height={h * 0.42 - 1} className="c-leche" />}
      <rect x={cx - w / 2 + b * 0.7 + 0.6} y={y - h * (latte ? 0.78 : 0.7)} width={w - 1.4 * b - 1.2} height={h * (latte ? 0.36 : 0.7) - 1} className="c-cafe-nivel" />
      {latte && <rect x={cx - w / 2 + 0.8} y={y - h * 0.93} width={w - 1.6} height={h * 0.15} className="c-espuma" />}
    </g>
  );
}

/** Cafetera de mesa (referencia Bosch, Carla 2026-10-21): carcasa negra con
 *  pantalla táctil arriba, frente de acero con la unidad de salida, vaso de
 *  latte sobre la charola, jarra de leche a la izquierda y depósito de agua
 *  translúcido a la derecha. Al encender se ilumina la pantalla y cae el café. */
function CafeteraMesa({ cx, y }: { cx: number; y: number }) {
  const t = y - 76; // tope de la carcasa
  return (
    <g>
      {/* Jarra de leche */}
      <rect x={cx - 47} y={t + 30} width={16} height={4} rx={1} className="c-cafetera" />
      <rect x={cx - 46} y={t + 34} width={14} height={y - t - 36} rx={1.5} className="c-jarra" />
      <rect x={cx - 45} y={t + 42} width={12} height={y - t - 45} rx={1} className="c-leche" />
      {/* Depósito de agua */}
      <rect x={cx + 30} y={t + 4} width={15} height={56} rx={1.5} className="c-deposito" />
      <rect x={cx + 31} y={t + 22} width={13} height={37} rx={1} className="c-agua" />
      <rect x={cx + 30} y={t + 60} width={15} height={y - t - 60} className="c-cafetera" />
      {/* Carcasa: pantalla negra arriba y frente de acero */}
      <rect x={cx - 31} y={t} width={62} height={36} rx={2} className="c-cafetera" />
      <rect x={cx - 25} y={t + 4} width={50} height={22} rx={1} className="c-pantalla" />
      <g className="c-pantalla-ui">
        {[-14, 0, 14].map((d) => (
          <circle key={d} cx={cx + d} cy={t + 14} r={d ? 3 : 4.2} className="c-ui-taza" />
        ))}
        <rect x={cx - 18} y={t + 21} width={36} height={2} rx={0.6} className="c-ui-linea-clara" />
      </g>
      {[-18, -6, 6, 18].map((d) => (
        <circle key={d} cx={cx + d} cy={t + 30.5} r={0.9} className="c-ui-icono" />
      ))}
      <rect x={cx - 31} y={t + 36} width={62} height={7} className="c-banda-logo" />
      <rect x={cx - 8} y={t + 38.6} width={16} height={1.8} rx={0.6} className="c-logo" />
      <Acero x={cx - 31} y={t + 43} w={62} h={y - t - 50} />
      {/* Unidad de salida: bloque negro con línea roja y dos boquillas */}
      <rect x={cx - 11} y={t + 44} width={22} height={7} rx={1} className="c-cafetera" />
      <rect x={cx - 8} y={t + 49.4} width={16} height={0.9} className="c-led-rojo" />
      {[-3, 3].map((d) => (
        <rect key={d} x={cx + d - 1} y={t + 51} width={2} height={2.6} className="c-boquilla" />
      ))}
      {[-3, 3].map((d) => (
        <rect key={d} x={cx + d - 0.6} y={t + 53.6} width={1.2} height={5} className="c-chorro" />
      ))}
      <VasoCafe cx={cx} y={y - 7} w={17} h={19} latte />
      {/* Charola de goteo */}
      <rect x={cx - 33} y={y - 7} width={66} height={3} fill="url(#ilus-cromo-h)" className="i-panel" />
      <rect x={cx - 31} y={y - 4} width={62} height={4} className="c-cafetera" />
      <Vapor x={cx} y={t + 52} n={2} ancho={6} />
      {/* Vaso de espresso sobre la cubierta */}
      <VasoCafe cx={cx + 58} y={y} w={11} h={12} />
    </g>
  );
}

/** Cafetera de empotre (referencia Bosch, Carla 2026-10-21): marco de acero,
 *  franja de control con pantalla y selector redondo al centro, cavidad negra
 *  con el bloque de salida y la rejilla, y logotipo abajo. */
function CafeteraEmpotre({ r }: { r: Rect }) {
  // Proporciones tomadas del frente Bosch (ancho/alto ≈ 1.4, Carla 2026-10-21):
  // franja de control en el cuarto superior, cavidad del 30 % al 84 % del alto.
  const { w, h } = r;
  const cx = r.x + w / 2;
  const c = { x: r.x + w * 0.07, y: r.y + h * 0.3, w: w * 0.86, h: h * 0.54 }; // cavidad
  const rej = c.y + c.h - 3;
  const dy = r.y + h * 0.08; // tope del marco de la pantalla
  const dh = h * 0.13;
  const dc = dy + dh / 2;
  const blq = { w: w * 0.094, y: c.y + h * 0.03, h: h * 0.11 }; // bloque de salida
  const boq = blq.y + blq.h + h * 0.05; // punta de las boquillas
  return (
    <g>
      <Acero {...r} />
      {/* Franja de control: pantalla partida con el selector redondo al centro */}
      <line x1={r.x + 2} y1={r.y + h * 0.25} x2={r.x + w - 2} y2={r.y + h * 0.25} className="c-junta-marco-linea" />
      <rect x={cx - w * 0.235} y={dy} width={w * 0.47} height={dh} rx={1} className="c-marco-display" />
      <rect x={cx - w * 0.215} y={dy + 2} width={w * 0.43} height={dh - 4} className="c-pantalla" />
      <g className="c-pantalla-ui">
        {[-0.14, -0.09, 0.09, 0.14].map((f) => (
          <rect key={f} x={cx + w * f - 3.5} y={dc - 3.5} width={7} height={7} rx={0.8} className="c-ui-taza" />
        ))}
      </g>
      <circle cx={cx} cy={dc} r={h * 0.075} fill="url(#ilus-cromo)" className="c-perilla" />
      <circle cx={cx} cy={dc} r={h * 0.055} className="c-pantalla" />
      <rect x={r.x + w * 0.12} y={r.y + h * 0.17} width={w * 0.12} height={2.2} className="c-logo" />
      {/* Cavidad con panel central, bloque de salida y rejilla */}
      <rect x={c.x} y={c.y} width={c.w} height={c.h} className="c-nicho-cafe" />
      <rect x={cx - w * 0.24} y={c.y} width={w * 0.48} height={c.h} className="c-nicho-centro" />
      <rect x={cx - 1.8} y={c.y} width={3.6} height={blq.y - c.y} className="c-cafetera" />
      <rect x={cx - blq.w / 2} y={blq.y} width={blq.w} height={blq.h} fill="url(#ilus-cromo)" className="c-boquilla-bloque" />
      <circle cx={cx} cy={blq.y + blq.h / 2} r={blq.h * 0.32} className="c-logo-circulo" />
      <rect x={cx - 5} y={blq.y + blq.h} width={10} height={h * 0.035} className="c-cafetera" />
      {[-2.8, 2.8].map((d) => (
        <rect key={d} x={cx + d - 1.2} y={boq - h * 0.03} width={2.4} height={h * 0.03} className="c-boquilla" />
      ))}
      {[-2.8, 2.8].map((d) => (
        <rect key={d} x={cx + d - 0.5} y={boq} width={1} height={rej - 18 - boq} className="c-chorro" />
      ))}
      {/* Taza de espresso sobre la rejilla */}
      <path d={`M${cx - 10} ${rej - 17} L${cx + 10} ${rej - 17} L${cx + 8} ${rej} L${cx - 8} ${rej} Z`} className="c-taza" />
      <rect x={cx - 9} y={rej - 15} width={18} height={12} className="c-cafe-nivel" />
      <path d={`M${cx + 9.4} ${rej - 14} q 6 2 0 8`} className="c-taza-asa" />
      <Vapor x={cx} y={rej - 26} n={2} ancho={7} />
      <rect x={cx - w * 0.2} y={rej} width={w * 0.4} height={2.6} fill="url(#ilus-cromo-h)" className="i-panel" />
      <rect x={cx - 12} y={r.y + h * 0.9} width={24} height={2.8} rx={0.8} className="c-logo" />
    </g>
  );
}

/* ——— Lavavajillas ————————————————————————————————————————————————— */

type TipoLava = "piso-frente" | "piso-ocultos" | "empotre";

/** Lavavajillas en alzado (referencias de Carla, 2026-10-21):
 *  piso-frente  → botonera negra arriba, jaladera de cromo y puerta de acero (Whirlpool).
 *  piso-ocultos → puerta de acero lisa con jaladera plana empotrada arriba (GE).
 *  empotre      → panel de acero a ras del mueble con jaladera tubular (Smeg).
 *  Al abrir, la puerta se abate hacia el frente y deja ver la tina con sus dos
 *  canastas (vasos y tazas arriba, platos abajo); la cara interior queda abajo
 *  y, con controles ocultos, su canto lleva la botonera (Smeg).
 *  `i-panelado` es el panel de carpintería (botón Panelar). */
function Lavavajillas({ r, tipo }: { r: Rect; tipo: TipoLava }) {
  const { x, y, w, h } = r;
  const cx = x + w / 2;
  const ocultos = tipo !== "piso-frente";
  const yb = y + h; // bisagra
  // Canastas: arriba vasos y tazas boca abajo; abajo platos de canto.
  const sup = { y1: y + h * 0.1, y2: y + h * 0.42 };
  const inf = { y1: y + h * 0.5, y2: y + h * 0.95 };
  const s = 6; // ensanche de la puerta abatida (perspectiva)
  const ph = 18; // alto de la puerta abatida (cabe completa en la tarjeta)
  return (
    <g>
      {/* Tina con las dos canastas (se ve con la puerta abierta) */}
      <rect x={x} y={y} width={w} height={h} className="c-tina" />
      <rect x={x + 4} y={y + 3} width={w - 8} height={h - 6} className="c-tina-fondo" />
      {[sup, inf].map((c, k) => (
        <g key={k}>
          <rect x={x + 6} y={c.y1} width={w - 12} height={c.y2 - c.y1} className="c-canasta-lava" />
          {Array.from({ length: 11 }, (_, j) => (
            <line key={j} x1={x + 6 + ((w - 12) * (j + 0.5)) / 11} y1={c.y2 - (c.y2 - c.y1) * 0.35} x2={x + 6 + ((w - 12) * (j + 0.5)) / 11} y2={c.y2} className="c-alambre" />
          ))}
          <line x1={x + 6} y1={c.y2 - (c.y2 - c.y1) * 0.35} x2={x + w - 6} y2={c.y2 - (c.y2 - c.y1) * 0.35} className="c-alambre" />
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((k) => (
        // Vasos y tazas boca abajo
        <rect key={k} x={x + 10 + k * ((w - 22) / 6)} y={sup.y1 + 6} width={(w - 22) / 6 - 3} height={(sup.y2 - sup.y1) * 0.62} rx={1.4} className={k % 2 ? "c-taza-lava" : "c-vaso-lava"} />
      ))}
      {Array.from({ length: 12 }, (_, k) => (
        // Platos de canto
        <ellipse key={k} cx={x + 11 + k * ((w - 22) / 11)} cy={(inf.y1 + inf.y2) / 2 + 2} rx={2.6} ry={(inf.y2 - inf.y1) * 0.42} className="c-plato-lava" />
      ))}
      {/* Puerta cerrada: se pliega sobre la bisagra al abrir */}
      <g className="c-puerta-lava">
        <Acero x={x} y={y} w={w} h={h} />
        {tipo === "piso-frente" && (
          <g>
            {/* Botonera negra con teclas y pantalla */}
            <rect x={x} y={y} width={w} height={14} className="c-botonera-lava" />
            {Array.from({ length: 9 }, (_, k) => (
              <rect key={k} x={x + 8 + k * 6.4} y={y + 6} width={3.6} height={2.6} rx={0.5} className="c-tecla-lava" />
            ))}
            <rect x={x + w - 20} y={y + 4.5} width={12} height={5.5} rx={0.6} className="c-display-lava" />
            <rect x={x + 2} y={y + 15} width={w - 4} height={6} fill="url(#ilus-cromo-h)" className="i-panel" />
            <rect x={x + 2} y={y + 21} width={w - 4} height={1.2} className="c-sombra-jaladera" />
            <rect x={cx - 8} y={y + h * 0.78} width={16} height={2.2} rx={0.6} className="c-logo" />
          </g>
        )}
        {tipo === "piso-ocultos" && (
          <g>
            {/* Jaladera plana de acero en su hueco, casi de lado a lado (GE) */}
            <rect x={x + 4} y={y + 3.4} width={w - 8} height={8.6} className="c-hueco-jaladera" />
            <rect x={x + 4.6} y={y + 4.6} width={w - 9.2} height={6.4} fill="url(#ilus-cromo-h)" className="i-panel" />
            <rect x={x + 4.6} y={y + 4.6} width={w - 9.2} height={1} className="c-filo-jaladera" />
            <rect x={x + w - 24} y={y + 1} width={16} height={1.4} className="c-ranura-negra" />
            <circle cx={cx} cy={y + h * 0.85} r={3.2} className="c-logo-circulo" />
          </g>
        )}
        {tipo === "empotre" && (
          // Panel de acero con jaladera tubular y soportes (Carla, 2026-10-21).
          <g>
            <Tubo x={x + 6} y={y + h * 0.15} w={w - 12} />
            <rect x={cx - 7} y={y + h - 8} width={14} height={1.8} rx={0.6} className="c-logo" />
          </g>
        )}
        {ocultos && (
          // Panel de carpintería (Panelar): mismo nogal y jaladera que los muebles.
          <g className="i-panelado">
            <rect x={x} y={y} width={w} height={h} className="i-mueble" />
            <rect x={x} y={y} width={w} height={h} className="i-modelado" />
            <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} className="i-panel-canto" />
            <rect x={cx - w * 0.22} y={y + 9} width={w * 0.44} height={2.5} className="i-jaladera" />
          </g>
        )}
      </g>
      {/* Puerta abierta: cara interior que se acerca; con controles ocultos, la
          botonera queda en su canto (al frente) */}
      <g className="c-puerta-lava-int">
        <polygon points={pts([[x, yb], [x + w, yb], [x + w + s, yb + ph], [x - s, yb + ph]])} className="c-forro-lava" />
        <polygon points={pts([[x + 6, yb + 3], [x + w - 6, yb + 3], [x + w - 2, yb + ph - 7], [x + 2, yb + ph - 7]])} className="c-forro-lava-int" />
        <rect x={x - s} y={yb + ph - 5} width={w + 2 * s} height={5} fill="url(#ilus-cromo-h)" className="i-panel" />
        {ocultos && (
          <g>
            {Array.from({ length: 8 }, (_, k) => (
              <circle key={k} cx={x + 4 + k * 6} cy={yb + ph - 2.5} r={0.9} className="c-icono-canto" />
            ))}
            <rect x={x + w - 20} y={yb + ph - 4.2} width={12} height={3.4} className="c-display-lava c-display-lava--on" />
          </g>
        )}
      </g>
    </g>
  );
}

function escenaLavavajillas(tipo: TipoLava, etiquetas: Etiqueta[]): Escena {
  // 60 cm de ancho en una cocina de 90 cm de alto (1.44 u/cm).
  const x1 = 234;
  const x2 = 326;
  const piso = tipo !== "empotre";
  const r: Rect = piso ? { x: x1 + 2, y: 241, w: x2 - x1 - 4, h: 119 } : { x: x1 + 2, y: 246, w: x2 - x1 - 4, h: 117 };
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaCocina x1={x1} x2={x2} alacenaCorrida={150} />
        {piso ? (
          <>
            {/* De piso: hueco entre muebles; cubierta propia y costados terminados */}
            <rect x={x1} y={236} width={x2 - x1} height={140} className="i-nicho" />
            <rect x={r.x - 1} y={r.y - 5} width={r.w + 2} height={5} rx={1} className="c-tapa-lava" />
            <rect x={r.x} y={r.y + r.h} width={r.w} height={376 - r.y - r.h} className="c-zoclo-lava" />
            {[r.x + 6, r.x + r.w - 9].map((px) => (
              <rect key={px} x={px} y={372} width={3} height={4} className="c-pata-lava" />
            ))}
          </>
        ) : (
          <>
            {/* Empotrable: cubierta corrida encima y zoclo continuo del mueble */}
            <rect x={x1 - 3} y={236} width={x2 - x1 + 6} height={9} className="i-cubierta" />
            <line x1={x1 - 3} y1={236.5} x2={x2 + 3} y2={236.5} className="i-cubierta-canto" />
            <rect x={x1} y={245} width={x2 - x1} height={121} className="i-nicho" />
          </>
        )}
        <Lavavajillas r={r} tipo={tipo} />
      </>
    ),
    etiquetas,
    recorte: { x: 110, y: 130, w: 340, h: 260 },
  };
}

/* ——— Tarjas y grifería ——————————————————————————————————————————— */

type InstalacionTarja = "sobreponer" | "submontar" | "dual" | "farmhouse";
type TipoGrifo = "monomando" | "mezcladora" | "sencillo" | "extraible" | "profesional" | "inteligente" | "potfiller";

/** Caño de grifo: tubo de acero con su brillo. */
function Cano({ d, ancho = 9 }: { d: string; ancho?: number }) {
  return (
    <g>
      <path d={d} className="t-cano" style={{ strokeWidth: ancho }} />
      <path d={d} className="t-cano-luz" style={{ strokeWidth: ancho * 0.28 }} transform={`translate(${-ancho * 0.18} 0)`} />
    </g>
  );
}

/** Chorro de agua (aparece al abrir) y su salpicadura. */
function Chorro({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} className="t-agua" />
      <ellipse cx={x} cy={y2} rx={8} ry={2.2} className="t-salpica" />
    </g>
  );
}

/** Luz difusa sobre el muro, detrás de la tarja (Carla, 2026-10-21: sin ventana). */
function LuzDifusa({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#t-luz-difusa)" />;
}

/* Tarja en la cubierta en perspectiva (vista 3/4 desde arriba, como la foto
   de referencia): x en unidades del frente, v de 0 (fondo) a 1 (canto). */
const TA = 190;
const TB = 370;
const TV1 = 0.2;
const TV2 = 0.72;
const FONDO_TINA = 34; // alto en pantalla de la pared del fondo de la tina

/** Tina vista desde arriba: fondo, pared del fondo, costados y coladera. */
function TinaPerspectiva({ v2, corte }: { v2: number; corte?: boolean }) {
  const [p1x, p1y] = P(TA, TV1);
  const [p2x] = P(TB, TV1);
  const [p3x, p3y] = P(TB, v2);
  const [p4x] = P(TA, v2);
  const d = FONDO_TINA;
  const yFondo = (p1y + d + p3y) / 2 + 4;
  return (
    <g>
      <polygon points={pts([[p1x, p1y], [p2x, p1y], [p3x, p3y], [p4x, p3y]])} className="t-fondo-tina" />
      <polygon points={pts([[p1x, p1y], [p1x + 6, p1y + d], [p4x, p3y]])} className="t-costado-tina" />
      <polygon points={pts([[p2x, p1y], [p2x - 6, p1y + d], [p3x, p3y]])} className="t-costado-tina" />
      <polygon points={pts([[p1x, p1y], [p2x, p1y], [p2x - 6, p1y + d], [p1x + 6, p1y + d]])} className="t-pared-tina" />
      {/* Sombra al pie de la pared del fondo y filo del borde frontal */}
      <polygon points={pts([[p1x + 6, p1y + d], [p2x - 6, p1y + d], [p2x - 9, p1y + d + 7], [p1x + 9, p1y + d + 7]])} className="t-sombra-tina" />
      <line x1={p4x} y1={p3y} x2={p3x} y2={p3y} className="t-filo-tina" />
      <ellipse cx={(p1x + p2x) / 2} cy={yFondo} rx={8} ry={2.6} className="t-coladera" />
      <ellipse cx={(p1x + p2x) / 2} cy={yFondo} rx={4} ry={1.2} className="t-coladera-centro" />
      {/* Canto pulido de la cubierta (submontar): se ve el corte bajo el borde del fondo */}
      {corte && <polygon points={pts([[p1x, p1y], [p2x, p1y], [p2x - 1, p1y + 5], [p1x + 1, p1y + 5]])} className="t-canto-corte" />}
    </g>
  );
}

/** Grifo de cuello de ganso visto en 3/4, detrás de la tarja. */
function GrifoPerspectiva() {
  const [fx, fy] = P(280, TV1 - 0.07);
  const d = `M${fx} ${fy - 30} L${fx} ${fy - 74} Q ${fx} ${fy - 96} ${fx + 18} ${fy - 96} Q ${fx + 36} ${fy - 96} ${fx + 36} ${fy - 76} L${fx + 36} ${fy - 66}`;
  return (
    <g>
      <ellipse cx={fx} cy={fy} rx={7} ry={2} className="t-base-grifo" />
      <rect x={fx - 4.5} y={fy - 32} width={9} height={32} fill="url(#ilus-cromo)" className="t-cuerpo" />
      <path d={`M${fx + 4} ${fy - 22} L${fx + 13} ${fy - 30}`} className="t-palanca" />
      <Cano d={d} ancho={6} />
    </g>
  );
}

/** Escena de instalación: muro con luz difusa, cubierta de piedra en perspectiva,
 *  la tarja según su montaje, grifo y muebles bajo la cubierta. */
function escenaTarja(tipo: InstalacionTarja): Escena {
  const farm = tipo === "farmhouse";
  const v2 = farm ? 1 : TV2;
  const [p1x, p1y] = P(TA, TV1);
  const [p3x, p3y] = P(TB, v2);
  const [fx, fy] = P(280, TV1 - 0.07);
  const yFondo = (p1y + FONDO_TINA + p3y) / 2 + 4;
  const ceja = (m: number) => quad(TA - m, TB + m, TV1 - dv(m + 1), v2 + dv(m + 1));
  const [c4x, c4y] = P(TA - 8, v2 + dv(9));
  const [c3x] = P(TB + 8, v2 + dv(9));
  const [fa] = P(TA - 4, 1);
  const [fb] = P(TB + 4, 1);
  const etiquetas: Record<InstalacionTarja, Etiqueta[]> = {
    sobreponer: [
      { x: c4x + 6, y: c4y, hasta: 110, texto: "Ceja de acero sobre\nla cubierta" },
      { x: P(TB + 5, 0.45)[0], y: P(TB + 5, 0.45)[1], hasta: 450, texto: "Grapas por debajo:\ncorte sencillo" },
    ],
    submontar: [
      { x: p1x + 24, y: p1y + 2.5, hasta: 110, texto: "Canto pulido\nexpuesto" },
      { x: p3x - 4, y: p3y - 2, hasta: 450, texto: "Sin ceja: el agua\nse barre a la tina" },
    ],
    dual: [
      { x: c4x + 8, y: P(TA - 4, v2)[1] + 1, hasta: 110, texto: "Ceja delgada" },
      { x: P(TB + 3, 0.45)[0], y: P(TB + 3, 0.45)[1], hasta: 450, texto: "Sobre o bajo:\nse decide en obra" },
    ],
    farmhouse: [
      { x: fa + 10, y: PF + 34, hasta: 110, texto: "Faldón al frente" },
      { x: P(TB - 6, 0.5)[0], y: P(TB - 6, 0.5)[1], hasta: 450, texto: "Tina profunda" },
      { x: fb - 12, y: PF + 50, hasta: 450, texto: "Sustituye el frente\ndel mueble" },
    ],
  };
  return {
    estados: tipo === "dual" ? "montaje" : "abrir",
    fondo: (
      <>
        {/* Muro con luz difusa detrás de la tarja */}
        <rect x={0} y={0} width={W} height={PB} className="i-muro" />
        <LuzDifusa cx={280} cy={86} rx={230} ry={110} />
        <polygon points={pts([[0, PB], [W, PB], [W, PF], [0, PF]])} className="i-cubierta c-cubierta-plano" />
        <polygon points={pts([[0, PB], [W, PB], [W, PF], [0, PF]])} className="c-cubierta-luz" />
        <rect x={0} y={PF} width={W} height={12} className="i-cubierta" />
        <line x1={0} y1={PF + 0.5} x2={W} y2={PF + 0.5} className="i-cubierta-canto" />
        <rect x={0} y={PF + 12} width={W} height={4} className="i-nicho" />
        <Cajones x1={0} x2={186} ys={[316, 360, 404]} />
        <Puertas x1={190} x2={370} y1={farm ? PF + 72 : 316} y2={404} jy={farm ? PF + 80 : 326} />
        <Cajones x1={374} x2={W} ys={[316, 360, 404]} />
        {/* Decoración: planta al fondo a la izquierda y tabla a la derecha */}
        <g transform={`translate(${P(70, 0.12)[0]} ${P(70, 0.12)[1]}) scale(0.9)`}>
          <Planta2 x={0} y={0} />
        </g>
        <polygon points={quad(420, 520, 0.4, 0.66)} className="i-tabla c-tabla-plano" />
        {/* Montaje de la tarja */}
        {tipo === "sobreponer" && (
          <g>
            <polygon points={ceja(8)} className="t-ceja" />
            <polygon points={pts([[c4x, c4y], [c3x, c4y], [c3x, c4y + 2.4], [c4x, c4y + 2.4]])} className="t-ceja-canto" />
          </g>
        )}
        {tipo === "dual" && (
          <g className="t-dual-sobre">
            <polygon points={ceja(4)} className="t-ceja" />
          </g>
        )}
        <TinaPerspectiva v2={v2} corte={tipo === "submontar"} />
        {tipo === "dual" && (
          <g className="t-dual-bajo">
            <polygon points={pts([[p1x, p1y], [P(TB, TV1)[0], p1y], [P(TB, TV1)[0] - 1, p1y + 5], [p1x + 1, p1y + 5]])} className="t-canto-corte" />
          </g>
        )}
        {farm && (
          // Faldón de acero que sustituye el frente del mueble
          <g>
            <Acero x={fa} y={PF - 1} w={fb - fa} h={72} />
            <rect x={fa} y={PF - 2.5} width={fb - fa} height={3} fill="url(#ilus-cromo-h)" className="i-panel" />
          </g>
        )}
        <GrifoPerspectiva />
        {tipo !== "dual" && <Chorro x={fx + 36} y1={fy - 64} y2={yFondo} />}
      </>
    ),
    etiquetas: etiquetas[tipo],
    recorte: { x: 100, y: 20, w: 360, h: 360 },
  };
}

/** Diseño de la tarja en planta (vista superior, cubierta oscura): una, dos o
 *  tres tinas, con el grifo atrás y la tabla de picar a un lado. */
function escenaTarjaPlanta(n: 1 | 2 | 3): Escena {
  const ancho = n === 1 ? 210 : n === 2 ? 262 : 314;
  const x0 = 280 - ancho / 2;
  const x1 = 280 + ancho / 2;
  const y0 = 150;
  const y1 = 284;
  const sep = 9;
  const tw = (ancho - 20 - sep * (n - 1)) / n;
  const tinas = Array.from({ length: n }, (_, k) => ({ x: x0 + 10 + k * (tw + sep), y: y0 + 16, w: tw, h: y1 - y0 - 26 }));
  const usos = n === 1 ? ["Tina única y amplia"] : n === 2 ? ["Lavar", "Enjuagar"] : ["Lavar", "Enjuagar", "Preparar"];
  const etiquetas: Etiqueta[] =
    n === 1
      ? [
          { x: tinas[0].x + 20, y: (y0 + y1) / 2, hasta: 70, texto: "Tina única\ny amplia" },
          { x: x1 - 20, y: y1 - 30, hasta: 490, texto: "Caben charolas\ny ollas grandes" },
        ]
      : tinas.map((t, k) => ({
          x: t.x + t.w / 2,
          y: t.y + (k % 2 ? t.h - 18 : 18),
          hasta: k === n - 1 ? 490 : k === 0 ? 70 : t.x + t.w / 2,
          texto: usos[k],
        })).filter((e) => e.hasta !== e.x);
  // Tina del centro (3 tinas): su etiqueta va abajo, hacia la derecha.
  if (n === 3) etiquetas.push({ x: tinas[1].x + tinas[1].w / 2, y: tinas[1].y + tinas[1].h - 14, hasta: 490, texto: usos[1] });
  return {
    estados: "abrir",
    fondo: (
      <>
        <rect x={0} y={0} width={W} height={H} className="t-cubierta-negra" />
        <rect x={0} y={0} width={W} height={H} fill="url(#t-cubierta-luz)" />
        {/* Muro al fondo */}
        <rect x={0} y={0} width={W} height={44} className="i-muro" />
        <rect x={0} y={44} width={W} height={3} className="t-zoclo-muro" />
        {/* Tabla de picar y planta (vistas desde arriba) */}
        <rect x={x1 + 30} y={170} width={70} height={104} rx={6} className="i-tabla" />
        <circle cx={x0 - 56} cy={110} r={24} className="t-maceta" />
        {[0, 60, 120, 180, 240, 300].map((g) => (
          <ellipse key={g} cx={x0 - 56} cy={98} rx={5} ry={13} transform={`rotate(${g} ${x0 - 56} 110)`} className="t-hoja-planta" />
        ))}
        {/* Tarja: ceja de acero y tinas */}
        <rect x={x0} y={y0} width={ancho} height={y1 - y0} rx={8} fill="url(#dgm-acero)" className="t-ceja-planta" />
        {tinas.map((t, k) => (
          <g key={k}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={10} fill="url(#t-tina-planta)" className="t-tina-planta" />
            <rect x={t.x + 6} y={t.y + 6} width={t.w - 12} height={t.h - 12} rx={8} className="t-agua-tina" />
            <circle cx={t.x + t.w / 2} cy={t.y + t.h - 22} r={7} className="t-coladera" />
            <circle cx={t.x + t.w / 2} cy={t.y + t.h - 22} r={3} className="t-coladera-centro" />
          </g>
        ))}
        {/* Grifo visto desde arriba: base atrás y caño hacia la tina */}
        <circle cx={280} cy={y0 + 4} r={8} fill="url(#ilus-cromo)" className="t-base-grifo" />
        <rect x={276.5} y={y0 + 4} width={7} height={46} rx={3.5} fill="url(#ilus-cromo)" className="t-cuerpo" />
        <rect x={286} y={y0 - 2} width={14} height={4} rx={2} fill="url(#ilus-cromo-h)" className="t-cuerpo" />
        <circle cx={280} cy={y0 + 52} r={6} className="t-salpica-planta" />
      </>
    ),
    etiquetas,
    recorte: { x: 40, y: 50, w: 480, h: 290 },
  };
}

/** Grifo de cocina en alzado, todo en acero (referencias Blanco Candor/Carena/Catris): base
 *  sobre la cubierta en (bx, by). */
function GrifoAlzado({ tipo, bx, by }: { tipo: Exclude<TipoGrifo, "potfiller">; bx: number; by: number }) {
  const cuerpo = (h: number, w = 14) => (
    <>
      <ellipse cx={bx} cy={by} rx={w * 0.72} ry={2.6} className="t-base-grifo" />
      <rect x={bx - w / 2} y={by - h} width={w} height={h} rx={1} fill="url(#ilus-cromo)" className="t-cuerpo" />
    </>
  );
  // Palanca lateral: perno redondo y pala vertical (Candor/Carena).
  const palanca = (y: number) => (
    <g>
      <rect x={bx + 7} y={y - 38} width={4.6} height={38} rx={1.6} fill="url(#ilus-cromo)" className="t-cuerpo" />
      <circle cx={bx + 9} cy={y + 2} r={6.5} fill="url(#ilus-cromo)" className="t-cuerpo" />
    </g>
  );
  const cuello = (alto: number, r: number) =>
    `M${bx} ${by - 60} L${bx} ${by - alto} A ${r} ${r} 0 0 1 ${bx + 2 * r} ${by - alto} L${bx + 2 * r} ${by - alto + 26}`;
  switch (tipo) {
    case "monomando":
    case "inteligente":
      return (
        <g>
          <Cano d={cuello(170, 36)} />
          {cuerpo(72)}
          {palanca(by - 48)}
          {tipo === "inteligente" && <rect x={bx - 7} y={by - 28} width={14} height={4} className="t-sensor" />}
        </g>
      );
    case "extraible":
      return (
        <g>
          <Cano d={`M${bx} ${by - 60} L${bx} ${by - 170} A 36 36 0 0 1 ${bx + 72} ${by - 170} L${bx + 72} ${by - 166}`} />
          {cuerpo(72)}
          {palanca(by - 48)}
          {/* Manguera y regadera: bajan al abrir */}
          <rect x={bx + 70.5} y={by - 140} width={3} height={58} className="t-manguera" />
          <g className="t-regadera">
            <rect x={bx + 66} y={by - 168} width={12} height={30} rx={2.5} fill="url(#ilus-cromo)" className="t-cuerpo" />
            <rect x={bx + 66} y={by - 152} width={12} height={1.2} className="t-junta-regadera" />
          </g>
        </g>
      );
    case "sencillo":
      return (
        <g>
          <Cano d={`M${bx} ${by - 40} L${bx} ${by - 112} A 26 26 0 0 1 ${bx + 52} ${by - 112} L${bx + 52} ${by - 92}`} />
          {cuerpo(52)}
          {/* Palanca arriba, inclinada hacia atrás */}
          <path d={`M${bx} ${by - 52} L${bx - 20} ${by - 64}`} className="t-palanca t-palanca--gruesa" />
        </g>
      );
    case "mezcladora":
      return (
        <g>
          <rect x={bx - 40} y={by - 4} width={80} height={4} rx={2} fill="url(#ilus-cromo-h)" className="t-cuerpo" />
          <Cano d={`M${bx} ${by - 40} L${bx} ${by - 150} A 32 32 0 0 1 ${bx + 64} ${by - 150} L${bx + 64} ${by - 124}`} />
          {cuerpo(44, 13)}
          {[-28, 28].map((d) => (
            <g key={d}>
              <rect x={bx + d - 4} y={by - 22} width={8} height={18} fill="url(#ilus-cromo)" className="t-cuerpo" />
              <rect x={bx + d - 11} y={by - 28} width={22} height={6} rx={3} fill="url(#ilus-cromo-h)" className="t-cuerpo" />
            </g>
          ))}
        </g>
      );
    case "profesional":
      return (
        <g>
          {/* Resorte de acero (Catris en acero, Carla 2026-10-21) y brazo que sostiene la regadera */}
          <Cano d={`M${bx} ${by - 90} L${bx} ${by - 200} A 44 44 0 0 1 ${bx + 88} ${by - 200} L${bx + 88} ${by - 162}`} ancho={11} />
          <path d={`M${bx} ${by - 90} L${bx} ${by - 200} A 44 44 0 0 1 ${bx + 88} ${by - 200} L${bx + 88} ${by - 162}`} className="t-resorte" />
          {cuerpo(100, 16)}
          <rect x={bx + 8} y={by - 142} width={74} height={6} fill="url(#ilus-cromo-h)" className="t-cuerpo" />
          <rect x={bx + 81} y={by - 164} width={14} height={50} rx={3} fill="url(#ilus-cromo)" className="t-cuerpo" />
          {[0, 1].map((k) => (
            <circle key={k} cx={bx + 96} cy={by - 140 + k * 9} r={1.8} className="t-boton-regadera" />
          ))}
          {palanca(by - 56)}
        </g>
      );
  }
}

/** Escena de grifería: muro oscuro con luz difusa, cubierta oscura con la misma
 *  tarja submontada para todos los grifos y muebles abajo (Carla, 2026-10-21).
 *  El pot filler va sobre la parrilla, empotrado al muro. */
function escenaGrifo(tipo: TipoGrifo): Escena {
  const bx = 250;
  const by = 306;
  const fondo = 330; // fondo de la tarja (donde cae el agua)
  const punta: Record<Exclude<TipoGrifo, "potfiller">, [number, number]> = {
    monomando: [bx + 72, by - 142],
    inteligente: [bx + 72, by - 142],
    extraible: [bx + 72, by - 80],
    sencillo: [bx + 52, by - 90],
    mezcladora: [bx + 64, by - 122],
    profesional: [bx + 88, by - 112],
  };
  // Pot filler: toma en el muro y brazo de dos tramos con bisagra en j.
  const wx = 150;
  const wy = 190;
  const j = wx + 80;
  const etiquetas: Record<TipoGrifo, Etiqueta[]> = {
    monomando: [
      { x: bx + 12, y: by - 74, hasta: 120, texto: "Una palanca: caudal\ny temperatura" },
      { x: bx - 6, y: by - 4, hasta: 120, texto: "Una perforación" },
      { x: bx + 72, y: by - 156, hasta: 450, texto: "Cartucho cerámico,\ncaño de arco alto" },
    ],
    mezcladora: [
      { x: bx - 28, y: by - 25, hasta: 120, texto: "Dos manijas:\nfría y caliente" },
      { x: bx + 4, y: by - 120, hasta: 450, texto: "Caño al centro" },
    ],
    sencillo: [
      { x: bx - 16, y: by - 62, hasta: 120, texto: "Palanca arriba" },
      { x: bx + 40, y: by - 132, hasta: 450, texto: "Caño fijo,\nsin regadera" },
    ],
    extraible: [
      { x: bx, y: by - 140, hasta: 120, texto: "Manguera con\ncontrapeso" },
      { x: bx + 78, y: by - 92, hasta: 450, texto: "Regadera extraíble:\nchorro y spray" },
    ],
    profesional: [
      { x: bx, y: by - 170, hasta: 120, texto: "Resorte de acero" },
      { x: bx + 95, y: by - 136, hasta: 450, texto: "Regadera de\nalto caudal" },
    ],
    inteligente: [
      { x: bx - 7, y: by - 26, hasta: 120, texto: "Sensor al tacto" },
      { x: bx + 72, y: by - 156, hasta: 450, texto: "Abre y cierra\nsin palanca" },
    ],
    potfiller: [
      { x: wx, y: wy, hasta: 100, texto: "Toma de agua\nen el muro" },
      { x: j + 40, y: wy, hasta: 450, texto: "Brazo articulado\nsobre la parrilla" },
    ],
  };
  return {
    estados: "abrir",
    fondo: (
      <>
        {/* Muro oscuro con luz difusa detrás del grifo (Carla, 2026-10-21) */}
        <rect x={0} y={0} width={W} height={300} className="i-muro" />
        <LuzDifusa cx={tipo === "potfiller" ? 250 : 290} cy={170} rx={250} ry={150} />
        {/* Cubierta oscura en perspectiva, canto y muebles */}
        <polygon points={pts([[0, 300], [W, 300], [W, 350], [0, 350]])} className="t-cubierta-negra" />
        <polygon points={pts([[0, 300], [W, 300], [W, 350], [0, 350]])} fill="url(#t-cubierta-luz)" />
        <rect x={0} y={350} width={W} height={12} className="t-cubierta-negra t-canto-negro" />
        <line x1={0} y1={350.5} x2={W} y2={350.5} className="i-cubierta-canto" />
        <Cajones x1={0} x2={186} ys={[362, 404]} />
        <Puertas x1={190} x2={370} y1={362} y2={404} jy={370} jl={14} />
        <Cajones x1={374} x2={W} ys={[362, 404]} />
        {tipo === "potfiller" ? (
          <g>
            {/* Parrilla de inducción con olla, bajo el brazo */}
            <polygon points={pts([[206, 314], [414, 314], [420, 338], [200, 338]])} className="c-vidrio-negro" />
            <Olla cx={j + 80} y={330} w={46} h={34} />
            <ellipse cx={wx} cy={wy} rx={9} ry={11} fill="url(#ilus-cromo)" className="t-cuerpo" />
            <Cano d={`M${wx} ${wy} L${j} ${wy}`} ancho={7} />
            <circle cx={j} cy={wy} r={6} fill="url(#ilus-cromo)" className="t-cuerpo" />
            {/* Segundo tramo: plegado contra el muro; al abrir se despliega sobre la olla */}
            <g className="t-brazo-pot" style={{ transformOrigin: `${j}px ${wy}px` }}>
              <Cano d={`M${j} ${wy} L${j + 72} ${wy} Q ${j + 80} ${wy} ${j + 80} ${wy + 8} L${j + 80} ${wy + 22}`} ancho={7} />
              <rect x={j + 32} y={wy - 12} width={4} height={10} rx={1.5} fill="url(#ilus-cromo)" className="t-cuerpo" />
            </g>
            <Chorro x={j + 80} y1={wy + 24} y2={296} />
          </g>
        ) : (
          <g>
            {/* La misma tarja submontada para todos los grifos */}
            {/* Hueco oscuro de la tarja: se lee hundida bajo la cubierta */}
            <polygon points={pts([[214, 310], [406, 310], [414, 342], [206, 342]])} className="t-tarja-hueco" />
            <polygon points={pts([[214, 310], [406, 310], [402, 324], [218, 324]])} className="t-tarja-pared" />
            <line x1={206} y1={342} x2={414} y2={342} className="i-cubierta-canto" />
            <GrifoAlzado tipo={tipo} bx={bx} by={by} />
            <Chorro x={punta[tipo][0]} y1={punta[tipo][1]} y2={fondo} />
          </g>
        )}
      </>
    ),
    etiquetas: etiquetas[tipo],
    recorte: { x: 100, y: 30, w: 360, h: 360 },
  };
}

/* ——— Asadores (Exterior) ———————————————————————————————————————————— */

type TipoAsador = "emp-gas" | "emp-mixto" | "carro-gas" | "carro-carbon";

/** Jardín desenfocado al fondo (referencia Lynx): casa clara, setos y alberca. */
function JardinExterior({ hasta }: { hasta: number }) {
  return (
    <g>
      <rect x={0} y={0} width={W} height={hasta} fill="url(#a-jardin)" />
      <g filter="url(#ilus-desenfoque)">
        <rect x={190} y={-10} width={230} height={120} className="a-casa" />
        <rect x={240} y={30} width={70} height={60} className="a-ventana-casa" />
        <rect x={20} y={hasta * 0.62} width={170} height={16} className="a-alberca" />
        {[40, 120, 470, 530].map((x, k) => (
          <ellipse key={x} cx={x} cy={hasta * (k % 2 ? 0.72 : 0.66)} rx={70} ry={38} className="a-seto" />
        ))}
        <ellipse cx={500} cy={hasta * 0.35} rx={34} ry={90} className="a-cipres" />
      </g>
    </g>
  );
}

/** Tapa de asador cerrada (domo de acero con termómetro y jaladera tubular). */
function TapaAsador({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  const r = Math.min(28, (x2 - x1) * 0.14);
  const d = `M${x1} ${y2} L${x1} ${y1 + r} Q ${x1} ${y1} ${x1 + r} ${y1} L${x2 - r} ${y1} Q ${x2} ${y1} ${x2} ${y1 + r} L${x2} ${y2} Z`;
  const cx = (x1 + x2) / 2;
  return (
    <g>
      <path d={d} fill="url(#a-domo)" className="a-acero" />
      <rect x={x1} y={y2 - 12} width={x2 - x1} height={12} fill="url(#ilus-cromo-h)" className="a-acero" />
      <circle cx={cx} cy={y1 + (y2 - y1) * 0.38} r={8} className="a-termometro" />
      <circle cx={cx} cy={y1 + (y2 - y1) * 0.38} r={5.6} className="a-termometro-cara" />
      <line x1={cx} y1={y1 + (y2 - y1) * 0.38} x2={cx + 3} y2={y1 + (y2 - y1) * 0.38 - 3.5} className="a-aguja" />
      <Tubo x={x1 + 8} y={y2 - 20} w={x2 - x1 - 16} />
    </g>
  );
}

/** Tapa abierta vista de frente: su cara interior de acero, con la jaladera arriba. */
function TapaAbierta({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={4} fill="url(#a-interior)" className="a-acero" />
      {Array.from({ length: Math.floor((x2 - x1) / 9) }, (_, k) => (
        <line key={k} x1={x1 + 6 + k * 9} y1={y1 + 6} x2={x1 + 6 + k * 9} y2={y2 - 6} className="a-cepillado" />
      ))}
      <rect x={x1 + 6} y={y1 - 6} width={x2 - x1 - 12} height={4.5} rx={2.2} fill="url(#ilus-cromo-h)" className="a-acero" />
    </g>
  );
}

/** Parrillas con comida y la flama o brasa que se ve con la tapa abierta. */
function Parrillas({ x1, x2, y, carbon }: { x1: number; x2: number; y: number; carbon?: boolean }) {
  return (
    <g>
      <rect x={x1} y={y - 3} width={x2 - x1} height={10} className="a-camara" />
      <ellipse cx={(x1 + x2) / 2} cy={y + 2} rx={(x2 - x1) * 0.45} ry={5} className={carbon ? "a-brasa" : "a-flama-gas"} />
      {carbon &&
        Array.from({ length: Math.floor((x2 - x1) / 10) }, (_, k) => (
          <ellipse key={k} cx={x1 + 6 + k * 10} cy={y + 3} rx={4.4} ry={2.4} className={k % 3 ? "a-carbon" : "a-carbon a-carbon--vivo"} />
        ))}
      {Array.from({ length: Math.floor((x2 - x1) / 7) }, (_, k) => (
        <line key={k} x1={x1 + 3 + k * 7} y1={y - 4} x2={x1 + 3 + k * 7} y2={y} className="a-rejilla" />
      ))}
      <line x1={x1} y1={y - 4} x2={x2} y2={y - 4} className="a-rejilla" />
      {/* Comida sobre la parrilla */}
      <rect x={x1 + (x2 - x1) * 0.18} y={y - 10} width={26} height={7} rx={3} className="a-carne" />
      <rect x={x1 + (x2 - x1) * 0.55} y={y - 9} width={22} height={6} rx={3} className="a-carne" />
      {[0.42, 0.47, 0.8, 0.85].map((f) => (
        <rect key={f} x={x1 + (x2 - x1) * f} y={y - 8} width={6} height={4} rx={2} className="a-verdura" />
      ))}
    </g>
  );
}

/** Isla de cocina exterior (referencia Lynx): cubierta de granito, cajones con
 *  jaladera de acero a los lados y puertas de nogal bajo el asador. */
function IslaExterior({ g1, g2 }: { g1: number; g2: number }) {
  return (
    <g>
      <rect x={0} y={234} width={W} height={10} className="a-granito" />
      <line x1={0} y1={234.5} x2={W} y2={234.5} className="i-cubierta-canto" />
      <rect x={0} y={244} width={W} height={156} className="a-hueco-isla" />
      {[[0, g1 - 8], [g2 + 8, W]].map(([a, b]) => (
        <g key={a}>
          {[244, 296, 348].map((y) => (
            <g key={y}>
              <rect x={a + 2} y={y + 2} width={b - a - 4} height={48} className="i-mueble" />
              <rect x={a + 2} y={y + 2} width={b - a - 4} height={48} className="i-modelado" />
              <rect x={(a + b) / 2 - 18} y={y + 10} width={36} height={3} rx={1.5} fill="url(#ilus-cromo-h)" className="a-acero" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

function escenaAsador(tipo: TipoAsador): Escena {
  const etiquetas: Record<TipoAsador, Etiqueta[]> = {
    "emp-gas": [
      { x: 214, y: 214, hasta: 100, texto: "Parrillas sobre\nquemadores de gas" },
      { x: 372, y: 278, hasta: 470, texto: "Encendido\ninmediato" },
      { x: 150, y: 239, hasta: 100, texto: "Empotrado en\nla isla" },
    ],
    "emp-mixto": [
      { x: 180, y: 214, hasta: 90, texto: "Zona de carbón" },
      { x: 360, y: 214, hasta: 470, texto: "Zona de gas" },
      { x: 160, y: 300, hasta: 90, texto: "Charola de carbón\najustable" },
    ],
    "carro-gas": [
      { x: 230, y: 196, hasta: 110, texto: "Parrillas sobre\nquemadores de gas" },
      { x: 400, y: 250, hasta: 470, texto: "Repisas laterales\nplegables" },
      { x: 194, y: 384, hasta: 110, texto: "Ruedas con freno:\nsin obra" },
    ],
    "carro-carbon": [
      { x: 166, y: 150, hasta: 90, texto: "Chimenea con\ntiro ajustable" },
      { x: 412, y: 238, hasta: 480, texto: "Caja de fuego\nlateral: ahumado" },
      { x: 325, y: 372, hasta: 480, texto: "Ruedas para\nmoverlo" },
    ],
  };
  let cuerpo: ReactNode;
  if (tipo === "emp-gas") {
    // Lynx de una tapa: perillas dos a la izquierda, placa, una al centro y una a la derecha.
    cuerpo = (
      <>
        <JardinExterior hasta={234} />
        <IslaExterior g1={160} g2={400} />
        <rect x={156} y={226} width={248} height={10} fill="url(#ilus-cromo-h)" className="a-acero" />
        <Acero x={162} y={244} w={236} h={72} />
        {[200, 228, 312, 372].map((x) => (
          <Perilla key={x} cx={x} cy={279} r={9} />
        ))}
        <rect x={250} y={273} width={40} height={11} rx={1.5} className="a-placa" />
        <rect x={172} y={318} width={216} height={8} className="a-charola" />
        <Puertas x1={166} x2={394} y1={330} y2={400} jy={340} jl={34} />
        <g className="a-tapa-abierta">
          <TapaAbierta x1={168} x2={392} y1={94} y2={222} />
          <Parrillas x1={170} x2={390} y={224} />
        </g>
        <g className="a-tapa-cerrada">
          <rect x={146} y={176} width={14} height={20} rx={2} fill="url(#ilus-cromo)" className="a-acero" />
          <TapaAsador x1={160} x2={400} y1={150} y2={232} />
        </g>
      </>
    );
  } else if (tipo === "emp-mixto") {
    // Coyote híbrido: dos tapas; a la izquierda la charola de carbón con su
    // manivela, a la derecha dos perillas de gas y la placa.
    cuerpo = (
      <>
        <JardinExterior hasta={234} />
        <IslaExterior g1={130} g2={430} />
        <rect x={126} y={226} width={308} height={10} fill="url(#ilus-cromo-h)" className="a-acero" />
        <Acero x={132} y={244} w={296} h={72} />
        <rect x={148} y={252} width={112} height={56} rx={2} fill="url(#dgm-acero)" className="a-acero a-marco" />
        {[0, 1, 2, 3, 4].flatMap((k) => [160 + k * 5, 236 + k * 5]).map((x) => (
          <rect key={x} x={x} y={262} width={2} height={12} rx={1} className="a-ranura" />
        ))}
        <Perilla cx={204} cy={268} r={8} />
        <rect x={180} y={288} width={48} height={4} rx={2} fill="url(#ilus-cromo-h)" className="a-acero" />
        <path d="M138 262 L138 282 L143 282" className="a-manivela" />
        <Perilla cx={336} cy={279} r={9} />
        <rect x={354} y={274} width={30} height={10} rx={1.5} className="a-placa" />
        <Perilla cx={400} cy={279} r={9} />
        <rect x={142} y={318} width={276} height={8} className="a-charola" />
        <Puertas x1={136} x2={424} y1={330} y2={400} jy={340} jl={34} />
        <g className="a-tapa-abierta">
          <TapaAbierta x1={136} x2={276} y1={100} y2={222} />
          <TapaAbierta x1={284} x2={424} y1={100} y2={222} />
          <Parrillas x1={138} x2={276} y={224} carbon />
          <Parrillas x1={284} x2={422} y={224} />
        </g>
        <g className="a-tapa-cerrada">
          <TapaAsador x1={130} x2={278} y1={158} y2={232} />
          <TapaAsador x1={282} x2={430} y1={158} y2={232} />
        </g>
      </>
    );
  } else if (tipo === "carro-gas") {
    // Coyote con carrito: gabinete de acero con dos puertas, ruedas con freno y
    // repisas laterales plegadas hacia abajo.
    cuerpo = (
      <>
        <JardinExterior hasta={300} />
        <rect x={0} y={300} width={W} height={100} className="a-piso-patio" />
        {[330, 362].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} className="a-junta-piso" />
        ))}
        {[60, 160, 260, 360, 460].map((x, k) => (
          <line key={x} x1={x + (k % 2) * 40} y1={300} x2={x + (k % 2) * 40 - 12} y2={400} className="a-junta-piso" />
        ))}
        <ellipse cx={280} cy={392} rx={130} ry={7} className="a-sombra-piso" />
        {[152, 392].map((x) => (
          <Acero key={x} x={x} y={214} w={16} h={78} />
        ))}
        <Acero x={176} y={250} w={208} h={130} />
        <line x1={280} y1={252} x2={280} y2={378} className="a-junta-puertas" />
        {[268, 292].map((x) => (
          <rect key={x} x={x - 1.6} y={286} width={3.2} height={44} rx={1.6} fill="url(#ilus-cromo)" className="a-acero" />
        ))}
        {[190, 370].map((x) => (
          <g key={x}>
            <rect x={x - 3} y={380} width={6} height={6} className="a-rueda-eje" />
            <circle cx={x} cy={390} r={6} className="a-rueda" />
          </g>
        ))}
        <rect x={168} y={206} width={224} height={8} fill="url(#ilus-cromo-h)" className="a-acero" />
        <Acero x={170} y={214} w={220} h={36} />
        {[194, 230, 272, 292, 312, 366].map((x) => (
          <Perilla key={x} cx={x} cy={232} r={7.5} />
        ))}
        <rect x={326} y={227} width={30} height={10} rx={1.5} className="a-placa" />
        <g className="a-tapa-abierta">
          <TapaAbierta x1={176} x2={384} y1={70} y2={198} />
          <Parrillas x1={176} x2={384} y={200} />
        </g>
        <g className="a-tapa-cerrada">
          <TapaAsador x1={172} x2={388} y1={136} y2={206} />
        </g>
      </>
    );
  } else {
    // Broil King de carbón (ahumador offset): barril negro sobre patas con
    // ruedas, caja de fuego a la derecha, chimenea a la izquierda, termómetro,
    // jaladera cromada y repisas al frente y abajo.
    cuerpo = (
      <>
        <JardinExterior hasta={300} />
        <rect x={0} y={300} width={W} height={100} className="a-piso-patio" />
        {[330, 362].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} className="a-junta-piso" />
        ))}
        <ellipse cx={280} cy={386} rx={150} ry={7} className="a-sombra-piso" />
        {/* Patas traseras (más oscuras) y delanteras */}
        {[198, 336].map((x) => (
          <rect key={x} x={x} y={262} width={10} height={108} className="a-negro a-negro--atras" />
        ))}
        <rect x={164} y={326} width={176} height={6} className="a-negro" />
        {Array.from({ length: 14 }, (_, k) => (
          <circle key={k} cx={172 + k * 12} cy={329} r={1} className="a-perforacion" />
        ))}
        <rect x={168} y={262} width={12} height={120} className="a-negro" />
        <rect x={314} y={262} width={12} height={104} className="a-negro" />
        <circle cx={320} cy={372} r={13} className="a-negro" />
        <circle cx={320} cy={372} r={5} className="a-rueda-centro" />
        {/* Chimenea, barril, caja de fuego */}
        <rect x={160} y={140} width={14} height={66} className="a-negro" />
        <g className="a-humo">
          <Vapor x={167} y={124} n={5} ancho={22} />
        </g>
        <rect x={350} y={206} width={78} height={56} rx={10} fill="url(#a-barril)" className="a-negro" />
        <rect x={420} y={222} width={8} height={18} className="a-ventila" />
        <rect x={428} y={226} width={6} height={10} className="a-ventila-brasa" />
        <path d={`M356 214 L 420 214`} className="a-jaladera-fuego" />
        <rect x={146} y={192} width={214} height={84} rx={40} fill="url(#a-barril)" className="a-negro" />
        <line x1={150} y1={236} x2={356} y2={236} className="a-junta-tapa" />
        <circle cx={250} cy={208} r={8} className="a-termometro" />
        <circle cx={250} cy={208} r={5.6} className="a-termometro-cara a-termometro-cara--rojo" />
        <rect x={214} y={224} width={74} height={5} rx={2.5} fill="url(#ilus-cromo-h)" className="a-acero" />
        {[220, 280].map((x) => (
          <rect key={x} x={x - 1.5} y={226} width={3} height={8} className="a-acero" />
        ))}
        <rect x={120} y={216} width={30} height={5} rx={2} className="a-negro" />
        <rect x={196} y={246} width={180} height={5} className="a-negro a-repisa-frente" />
      </>
    );
  }
  return {
    estados: tipo === "carro-carbon" ? "encender" : "abrir",
    fondo: cuerpo,
    etiquetas: etiquetas[tipo],
    recorte: { x: 70, y: 40, w: 420, h: 350 },
  };
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
          return (
            <>
              {c.el}
              <LuzCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} piso={226} ancho={1.05} fija />
            </>
          );
        })()}
        <Estufa x={x} w={w} tipo={tipo} tapa={tipo === "empotre"} />
        {doors.map((d, k) => (
          <CavidadHorno
            key={k}
            r={{ x: d.x + 2, y: d.y + 2, w: d.w - 4, h: d.h - 4 }}
            // Convección: la de piso y el horno grande de la profesional.
            variante={tipo === "piso" || (tipo === "profesional" && k === 1) ? "conveccion" : "normal"}
            comida={k === 0 ? "pollo" : "pan"}
          />
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
          <PuertaAbajo
            key={k}
            r={d}
            k={k}
            // En la profesional la puerta abierta cae menos para no tapar las patas.
            caida={tipo === "profesional" ? 0.2 : undefined}
            o={
              tipo === "profesional"
                ? { manija: "tubo", ventana: true, bisel: true, insignia: k === 1 }
                : tipo === "empotre"
                  ? { manija: "ninguna", espejo: true }
                  : { manija: "barra-ancha", ventana: true, ventanaBaja: true }
            }
          />
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

/* ——— Hornos de pared por modelo de referencia (Carla, 2026-10-21) ————————————
   thermador: Thermador Professional 30″ (Convección y Sencillo)
   smeg:      Smeg Classic 60 cm (Vapor)
   monogram:  Monogram speed oven 30″ (Multifunción)
   masterpiece: Thermador Masterpiece doble 30″, sin perillas (Doble)
   cafe:      Café French Door 30″ con pantalla a color (French Door)
   Cada uno con sus proporciones: tablero fijo arriba, puerta abatible abajo
   (la jaladera viaja con ella) e interior propio. ———————————————————————————— */

type ModeloHorno = "thermador" | "smeg" | "monogram" | "masterpiece" | "cafe";

/** Cotas en escena: frente completo (y, h), alto del tablero, puerta y zoclo. */
const HORNOS: Record<"thermador" | "smeg" | "monogram", { y: number; h: number; panel: number; puerta: [number, number]; zoclo?: [number, number] }> = {
  thermador: { y: 96, h: 190, panel: 34, puerta: [133, 279], zoclo: [280, 286] },
  smeg: { y: 98, h: 188, panel: 32, puerta: [134, 286] },
  monogram: { y: 124, h: 132, panel: 34, puerta: [160, 245], zoclo: [246, 256] },
};
const HX = 182;
const HW = 196;

/** Perilla de dial (Thermador): bisel cromado, barra de agarre y escala de puntos. */
function PerillaDial({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      {Array.from({ length: 12 }, (_, k) => {
        const a = ((k * 30 - 90) * Math.PI) / 180;
        return <circle key={k} cx={cx + Math.cos(a) * r * 1.42} cy={cy + Math.sin(a) * r * 1.42} r={0.55} className="c-escala-punto" />;
      })}
      {[-150, -110, -60, 60, 110, 150].map((g) => {
        const a = ((g - 90) * Math.PI) / 180;
        const lx = cx + Math.cos(a) * r * 1.85;
        return <rect key={g} x={lx - (lx < cx ? 6 : 0)} y={cy + Math.sin(a) * r * 1.85 - 0.5} width={6} height={1} className="c-leyenda" />;
      })}
      <circle cx={cx + 0.5} cy={cy + 1.4} r={r + 0.6} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ilus-cromo)" className="c-perilla" />
      <circle cx={cx} cy={cy} r={r * 0.8} className="c-moleteado" />
      <rect x={cx - r * 0.26} y={cy - r * 0.9} width={r * 0.52} height={r * 1.8} rx={r * 0.18} fill="url(#ilus-cromo)" className="c-perilla-barra" />
      <line x1={cx} y1={cy - r * 0.8} x2={cx} y2={cy + r * 0.8} className="c-perilla-raya" />
    </g>
  );
}

/** Perilla de palanca (Smeg Classic): disco cromado y palanca hacia arriba. */
function PerillaPalanca({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx + 0.5} cy={cy + 1.2} r={r + 0.8} className="c-sombra" />
      <circle cx={cx} cy={cy} r={r + 0.8} className="c-base-perilla" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ilus-cromo)" className="c-perilla" />
      <rect x={cx - r * 0.24} y={cy - r * 2.2} width={r * 0.48} height={r * 1.9} rx={r * 0.24} fill="url(#ilus-cromo)" className="c-perilla-barra" />
      <circle cx={cx} cy={cy} r={r * 0.42} className="c-centro-vitro" />
      <circle cx={cx} cy={cy} r={r * 0.2} fill="url(#ilus-cromo)" />
    </g>
  );
}

/** Tablero fijo de cada modelo (arriba de la puerta). */
function TableroHorno({ r, modelo }: { r: Rect; modelo: ModeloHorno }) {
  const cy = r.y + r.h / 2;
  if (modelo === "thermador") {
    const lx = r.x + r.w * 0.39;
    const lw = r.w * 0.22;
    const ly = r.y + r.h * 0.2;
    const lh = r.h * 0.38;
    const [ccx, ccy] = [lx + lw / 2, ly + lh / 2];
    return (
      <g>
        <Acero {...r} />
        <line x1={r.x} y1={r.y + 0.6} x2={r.x + r.w} y2={r.y + 0.6} className="c-filo-luz" />
        <line x1={r.x} y1={r.y + r.h - 0.5} x2={r.x + r.w} y2={r.y + r.h - 0.5} className="c-filo-sombra" />
        {[0.2, 0.8].map((f) => (
          <PerillaDial key={f} cx={r.x + r.w * f} cy={cy} r={r.h * 0.27} />
        ))}
        {/* Pantalla: marco rebajado, LCD con reloj y fila de teclas táctiles */}
        <rect x={r.x + r.w * 0.34} y={r.y + r.h * 0.1} width={r.w * 0.32} height={r.h * 0.8} className="c-display-marco" />
        <rect x={lx} y={ly} width={lw} height={lh} className="c-lcd" />
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k * 30 * Math.PI) / 180;
          return <circle key={k} cx={ccx + Math.cos(a) * lh * 0.36} cy={ccy + Math.sin(a) * lh * 0.36} r={0.35} className="c-lcd-tinta" />;
        })}
        <path d={`M${ccx} ${ccy} L${ccx} ${ccy - lh * 0.28} M${ccx} ${ccy} L${ccx + lh * 0.18} ${ccy}`} className="c-lcd-manecilla" />
        {Array.from({ length: 6 }, (_, k) => (
          <rect key={k} x={r.x + r.w * (0.365 + k * 0.047)} y={r.y + r.h * 0.74} width={4} height={0.9} className="c-leyenda" />
        ))}
      </g>
    );
  }
  if (modelo === "smeg") {
    const dx = r.x + r.w * 0.43;
    const dy = r.y + r.h * 0.2;
    return (
      <g>
        <Acero {...r} />
        <line x1={r.x} y1={r.y + r.h - 0.5} x2={r.x + r.w} y2={r.y + r.h - 0.5} className="c-filo-sombra" />
        {[0.21, 0.79].map((f) => (
          <g key={f}>
            <PerillaPalanca cx={r.x + r.w * f} cy={r.y + r.h * 0.52} r={r.h * 0.13} />
            <rect x={r.x + r.w * f - 2} y={r.y + r.h * 0.8} width={4} height={3.4} rx={0.4} className="c-icono" />
          </g>
        ))}
        {/* Display negro con tiempo y temperatura */}
        <rect x={dx} y={dy} width={r.w * 0.15} height={r.h * 0.52} className="c-display" />
        <text x={dx + r.w * 0.085} y={dy + r.h * 0.27} textAnchor="middle" className="c-display-txt c-display-txt--grande">
          00:30
        </text>
        <text x={dx + r.w * 0.075} y={dy + r.h * 0.43} textAnchor="middle" className="c-display-txt">
          160°
        </text>
        {/* Indicador azul del depósito de agua (vapor) */}
        <rect x={r.x + r.w * 0.885} y={r.y + r.h * 0.34} width={3.4} height={5} rx={0.4} className="c-indicador-agua" />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={r.x + r.w * 0.915} y={r.y + r.h * (0.3 + k * 0.1)} width={2.6 - k * 0.3} height={1} className="c-nivel-agua" />
        ))}
      </g>
    );
  }
  if (modelo === "masterpiece") {
    // Sin perillas: franja de acero con LCD chico al centro y teclas táctiles.
    const lx = r.x + r.w * 0.405;
    const lw = r.w * 0.19;
    const ly = r.y + r.h * 0.16;
    const lh = r.h * 0.36;
    return (
      <g>
        <Acero {...r} />
        <line x1={r.x} y1={r.y + 0.6} x2={r.x + r.w} y2={r.y + 0.6} className="c-filo-luz" />
        <line x1={r.x} y1={r.y + r.h - 0.5} x2={r.x + r.w} y2={r.y + r.h - 0.5} className="c-filo-sombra" />
        <rect x={lx} y={ly} width={lw} height={lh} className="c-lcd" />
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k * 30 * Math.PI) / 180;
          return <circle key={k} cx={lx + lw / 2 + Math.cos(a) * lh * 0.34} cy={ly + lh / 2 + Math.sin(a) * lh * 0.34} r={0.3} className="c-lcd-tinta" />;
        })}
        {Array.from({ length: 9 }, (_, k) => (
          <g key={k}>
            <circle cx={r.x + r.w * (0.14 + k * 0.09)} cy={r.y + r.h * 0.64} r={0.5} className="c-escala-punto" />
            <rect x={r.x + r.w * (0.14 + k * 0.09) - 2} y={r.y + r.h * 0.74} width={4} height={0.8} className="c-leyenda" />
          </g>
        ))}
      </g>
    );
  }
  if (modelo === "cafe") {
    // Café: recuadro de vidrio negro con la pantalla táctil a color (fondo claro).
    const sx = r.x + r.w * 0.395;
    const sy = r.y + r.h * 0.16;
    const sw = r.w * 0.21;
    const sh = r.h * 0.56;
    return (
      <g>
        <Acero {...r} />
        <line x1={r.x} y1={r.y + 0.6} x2={r.x + r.w} y2={r.y + 0.6} className="c-filo-luz" />
        <line x1={r.x} y1={r.y + r.h - 0.5} x2={r.x + r.w} y2={r.y + r.h - 0.5} className="c-filo-sombra" />
        <rect x={r.x + r.w * 0.31} y={r.y + r.h * 0.12} width={r.w * 0.38} height={r.h * 0.76} rx={4} className="c-recuadro-negro" />
        <rect x={sx} y={sy} width={sw} height={sh} className="c-pantalla-clara" />
        {[0, 1].map((k) => (
          <g key={k}>
            <rect x={sx + sw * 0.05} y={sy + sh * (0.2 + k * 0.38)} width={sw * 0.38} height={sh * 0.3} className="c-tarjeta-ui" />
            <rect x={sx + sw * 0.08} y={sy + sh * (0.3 + k * 0.38)} width={sw * 0.12} height={sh * 0.14} className="c-foto-ui" />
            <rect x={sx + sw * 0.24} y={sy + sh * (0.26 + k * 0.38)} width={sw * 0.15} height={sh * 0.08} rx={1} className="c-boton-ui" />
          </g>
        ))}
        <rect x={sx + sw * 0.47} y={sy + sh * 0.2} width={sw * 0.3} height={sh * 0.68} className="c-tarjeta-ui" />
        <rect x={sx + sw * 0.8} y={sy + sh * 0.2} width={sw * 0.16} height={sh * 0.68} className="c-foto-ui" />
        <rect x={sx} y={sy + sh * 1.02} width={sw} height={sh * 0.2} className="c-barra-ui" />
        <rect x={r.x + r.w * 0.6} y={r.y + r.h * 0.78} width={6} height={0.8} className="c-ui-texto" />
      </g>
    );
  }
  // Monogram: marco de acero, vidrio negro y pantalla táctil a color al centro.
  const sx = r.x + r.w * 0.37;
  const sy = r.y + r.h * 0.16;
  const sw = r.w * 0.26;
  const sh = r.h * 0.68;
  return (
    <g>
      <Acero {...r} />
      <VidrioNegro x={r.x + 3} y={r.y + 3} w={r.w - 6} h={r.h - 6} />
      <rect x={sx} y={sy} width={sw} height={sh} fill="url(#c-pantalla-color)" className="c-pantalla-color" />
      {[
        [0.2, 0.35, 4.2, "c-fruta-1"],
        [0.72, 0.3, 5, "c-fruta-2"],
        [0.4, 0.8, 3.6, "c-fruta-1"],
        [0.85, 0.75, 3, "c-fruta-3"],
      ].map(([fx, fy, fr, cl]) => (
        <circle key={`${fx}${fy}`} cx={sx + sw * (fx as number)} cy={sy + sh * (fy as number)} r={fr as number} className={cl as string} />
      ))}
      {Array.from({ length: 6 }, (_, k) => (
        <rect key={k} x={sx + sw * (0.06 + k * 0.155)} y={sy + sh * 0.55} width={sw * 0.11} height={0.9} className="c-ui-texto" />
      ))}
      <line x1={sx + 2} y1={sy + sh * 0.42} x2={sx + sw - 2} y2={sy + sh * 0.42} className="c-ui-linea" />
      {/* Rejillas de ventilación bajo el tablero */}
      {[0.08, 0.24, 0.4, 0.56, 0.72, 0.86].map((f, k) => (
        <rect key={f} x={r.x + r.w * f} y={r.y + r.h + 0.8} width={r.w * (k > 2 ? 0.1 : 0.13)} height={2.2} rx={0.6} className="c-ranura-negra" />
      ))}
    </g>
  );
}

/** Frente de la puerta de cada modelo (en un svg de w×h). */
function FrenteHorno({ w, h, modelo, lado }: { w: number; h: number; modelo: ModeloHorno; lado?: "l" | "r" }) {
  if (modelo === "masterpiece") {
    return (
      <g>
        {/* Marco claro de esquinas redondeadas y vidrio que deja ver las parrillas */}
        <rect x={w * 0.08} y={h * 0.16} width={w * 0.84} height={h * 0.7} rx={3} className="c-marco-claro" />
        <rect x={w * 0.15} y={h * 0.21} width={w * 0.7} height={h * 0.53} rx={1.5} className="c-ventana c-ventana-tenue" />
        {[0.38, 0.56].map((f) => (
          <line key={f} x1={w * 0.16} y1={h * f} x2={w * 0.84} y2={h * f} className="c-parrilla-tras-vidrio" />
        ))}
        <polygon points={pts([[w * 0.18, h * 0.21], [w * 0.36, h * 0.21], [w * 0.22, h * 0.74], [w * 0.15, h * 0.74], [w * 0.15, h * 0.5]])} className="c-reflejo" />
        <rect x={w / 2 - 8} y={h * 0.785} width={16} height={1.4} className="c-leyenda" />
        {/* Jaladera tubular con sus soportes */}
        {[w * 0.11, w * 0.89].map((px) => (
          <rect key={px} x={px - 1.6} y={h * 0.045} width={3.2} height={h * 0.07} rx={1} fill="url(#ilus-cromo)" className="i-manija" />
        ))}
        <rect x={w * 0.09} y={h * 0.08 + 4} width={w * 0.82} height={2} className="i-manija-sombra" />
        <rect x={w * 0.09} y={h * 0.08} width={w * 0.82} height={4.4} rx={2.2} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
      </g>
    );
  }
  if (modelo === "cafe") {
    // Ventana de esquinas redondeadas con filo cromado y jaladera vertical junto a la unión.
    const izq = lado !== "r";
    const vx = izq ? w * 0.1 : w * 0.17;
    const jx = izq ? w * 0.86 : w * 0.14;
    return (
      <g>
        <rect x={vx} y={h * 0.2} width={w * 0.73} height={h * 0.6} rx={5} className="c-ventana-cafe" />
        <rect x={vx + w * 0.06} y={h * 0.24} width={w * 0.61} height={h * 0.52} rx={2} className="c-ventana" />
        {[0.05, 0.89].map((f) => (
          <rect key={f} x={jx - 3.6} y={h * f} width={7.2} height={h * 0.06} rx={1.2} fill="url(#ilus-cromo-h)" className="i-manija" />
        ))}
        <rect x={jx - 2.4} y={h * 0.06} width={4.8} height={h * 0.88} rx={2.2} fill="url(#ilus-cromo)" className="i-manija" />
        {!izq && <rect x={jx - 2.6} y={h * 0.16} width={5.2} height={3} className="c-banda-cobre" />}
      </g>
    );
  }
  if (modelo === "thermador") {
    return (
      <g>
        {/* Marco rebajado y vidrio que deja ver un poco el interior */}
        <rect x={w * 0.06} y={h * 0.18} width={w * 0.88} height={h * 0.64} className="c-marco-ventana" />
        <rect x={w * 0.11} y={h * 0.22} width={w * 0.78} height={h * 0.56} className="c-ventana c-ventana-tenue" />
        <polygon points={pts([[w * 0.14, h * 0.22], [w * 0.36, h * 0.22], [w * 0.2, h * 0.78], [w * 0.11, h * 0.78], [w * 0.11, h * 0.5]])} className="c-reflejo" />
        {/* Jaladera tubular con tapas grandes en los extremos */}
        <rect x={w * 0.1} y={h * 0.06 + 6} width={w * 0.8} height={2.5} className="i-manija-sombra" />
        <rect x={w * 0.1} y={h * 0.06} width={w * 0.8} height={6.4} rx={3.2} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
        {[w * 0.06, w * 0.87].map((ex) => (
          <rect key={ex} x={ex} y={h * 0.06 - 1.4} width={w * 0.07} height={9.2} rx={2.4} fill="url(#ilus-cromo-h)" className="i-manija" />
        ))}
        {/* Placa de marca */}
        <rect x={w / 2 - 12} y={h * 0.88} width={24} height={6} rx={0.6} fill="url(#ilus-cromo-h)" className="c-insignia" />
        <rect x={w / 2 - 9} y={h * 0.88 + 2.5} width={18} height={1.1} className="c-insignia-texto c-insignia-texto--oscuro" />
      </g>
    );
  }
  if (modelo === "smeg") {
    return (
      <g>
        <line x1={0} y1={h * 0.17} x2={w} y2={h * 0.17} className="c-filo-sombra" />
        {/* Franja de vidrio negro de lado a lado */}
        <VidrioNegro x={0.5} y={h * 0.17} w={w - 1} h={h * 0.61} />
        {/* Jaladera de barra sobre dos postes */}
        {[w * 0.08, w * 0.92].map((px) => (
          <g key={px}>
            <rect x={px - 1.8} y={h * 0.045} width={3.6} height={h * 0.075} rx={1.6} fill="url(#ilus-cromo)" className="i-manija" />
            <rect x={px - 2.6} y={h * 0.105} width={5.2} height={3} rx={0.8} className="c-base-poste" />
          </g>
        ))}
        <rect x={w * 0.06} y={h * 0.04} width={w * 0.88} height={3.8} rx={1.9} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
        <rect x={w / 2 - 9} y={h * 0.9} width={18} height={2.2} rx={0.8} className="c-logo" />
      </g>
    );
  }
  return (
    <g>
      {/* Marco de acero y ventana negra */}
      <rect x={w * 0.05} y={h * 0.15} width={w * 0.9} height={h * 0.69} className="c-marco-ventana" />
      <VidrioNegro x={w * 0.068} y={h * 0.17} w={w * 0.864} h={h * 0.65} />
      {/* Jaladera tubular con tapas */}
      <rect x={w * 0.07} y={h * 0.035 + 5} width={w * 0.86} height={2.4} className="i-manija-sombra" />
      <rect x={w * 0.07} y={h * 0.035} width={w * 0.86} height={5.6} rx={2.8} fill="url(#ilus-cromo-h)" className="i-manija i-manija-h" />
      {[w * 0.035, w * 0.915].map((ex) => (
        <rect key={ex} x={ex} y={h * 0.035 - 1.2} width={w * 0.05} height={8} rx={2} fill="url(#ilus-cromo-h)" className="i-manija" />
      ))}
      <rect x={w / 2 - 12} y={h * 0.9} width={24} height={1.4} className="c-leyenda" />
    </g>
  );
}

/** Interior de cada modelo, en perspectiva: esmalte gris con rieles de alambre
 *  y ventilador al fondo (Thermador, Smeg) o acero brillante con luces
 *  laterales, rejilla hexagonal y charola con salmón (Monogram). */
function InteriorHorno({ r, modelo, variante, comida = "pollo", parrillas = 1 }: { r: Rect; modelo: ModeloHorno; variante: Variante; comida?: "pollo" | "pan"; parrillas?: number }) {
  const acero = modelo === "monogram";
  const dx = r.w * 0.12;
  const dy = r.h * 0.14;
  const b = { x: r.x + dx, y: r.y + dy, w: r.w - 2 * dx, h: r.h - 2 * dy };
  const pisoY = r.y + r.h * 0.8;
  const atras = (y: number) => b.y + ((y - r.y) / r.h) * b.h; // altura equivalente en el fondo
  const fx = r.x + r.w / 2;
  const fy = b.y + b.h * 0.42;
  const fR = Math.min(b.w, b.h) * 0.3;
  const lado = (izq: boolean) =>
    izq
      ? pts([[r.x, r.y], [b.x, b.y], [b.x, b.y + b.h], [r.x, r.y + r.h]])
      : pts([[r.x + r.w, r.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [r.x + r.w, r.y + r.h]]);
  return (
    <g className={acero ? "c-int c-int--acero" : modelo === "cafe" ? "c-int c-int--negro" : "c-int"}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} className="c-cavidad" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={acero ? "url(#c-fondo-acero)" : "url(#c-fondo-esmalte)"} />
      <polygon points={lado(true)} className="c-int-lado" />
      <polygon points={lado(false)} className="c-int-lado" />
      <polygon points={pts([[r.x, r.y], [r.x + r.w, r.y], [b.x + b.w, b.y], [b.x, b.y]])} className="c-int-techo" />
      <polygon points={pts([[r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]])} className="c-int-piso" />
      {/* Rieles de alambre en los costados (esmaltados) */}
      {!acero &&
        [0.24, 0.38, 0.52, 0.66].flatMap((f) => {
          const y = r.y + r.h * f;
          return [
            <line key={`l${f}`} x1={r.x + 2} y1={y} x2={b.x - 1} y2={atras(y)} className="c-riel-lado" />,
            <line key={`r${f}`} x1={r.x + r.w - 2} y1={y} x2={b.x + b.w + 1} y2={atras(y)} className="c-riel-lado" />,
          ];
        })}
      {/* Ventilador del fondo */}
      {modelo === "cafe" && (
        // Rejilla cuadrada del ventilador con nervios en X
        <g>
          <rect x={fx - fR} y={fy - fR} width={fR * 2} height={fR * 2} rx={2} className="c-reja-aro" />
          <path d={`M${fx - fR} ${fy - fR} L${fx + fR} ${fy + fR} M${fx + fR} ${fy - fR} L${fx - fR} ${fy + fR} M${fx} ${fy - fR} L${fx} ${fy + fR} M${fx - fR} ${fy} L${fx + fR} ${fy}`} className="c-reja-radial" />
          <ellipse cx={r.x + dx * 0.55} cy={r.y + r.h * 0.42} rx={dx * 0.3} ry={r.h * 0.08} className="c-luz-lateral" />
        </g>
      )}
      {(modelo === "thermador" || modelo === "masterpiece") && (
        <g>
          <circle cx={fx} cy={fy} r={fR * 1.25} className="c-tapa-ventilador" />
          {Array.from({ length: 20 }, (_, k) => {
            const a = (k * 18 * Math.PI) / 180;
            return <line key={k} x1={fx + Math.cos(a) * fR * 0.25} y1={fy + Math.sin(a) * fR * 0.25} x2={fx + Math.cos(a) * fR} y2={fy + Math.sin(a) * fR} className="c-reja-radial" />;
          })}
          <circle cx={fx} cy={fy} r={fR} className="c-reja-aro" />
        </g>
      )}
      {modelo === "smeg" && (
        <g>
          <rect x={b.x + b.w * 0.12} y={b.y + 3} width={b.w * 0.76} height={b.h * 0.8} rx={4} className="c-tapa-ventilador" />
          {[1, 0.78, 0.56, 0.36, 0.18].map((f) => (
            <circle key={f} cx={fx} cy={fy} r={fR * f} className="c-reja-aro" />
          ))}
        </g>
      )}
      {acero && (
        <g>
          <polygon
            points={pts(Array.from({ length: 6 }, (_, k) => [fx + Math.cos(((k * 60 + 30) * Math.PI) / 180) * fR, fy + Math.sin(((k * 60 + 30) * Math.PI) / 180) * fR] as [number, number]))}
            className="c-reja-hex"
          />
          {Array.from({ length: 5 }, (_, i) =>
            Array.from({ length: 7 }, (_, j) => (
              <circle key={`${i}-${j}`} cx={fx + (j - 3) * fR * 0.24} cy={fy + (i - 2) * fR * 0.28} r={0.5} className="c-perforado" />
            )),
          )}
          {/* Luces cálidas en los costados */}
          <ellipse cx={r.x + dx * 0.5} cy={r.y + r.h * 0.35} rx={dx * 0.35} ry={r.h * 0.2} className="c-luz-lateral" />
          <ellipse cx={r.x + r.w - dx * 0.5} cy={r.y + r.h * 0.35} rx={dx * 0.35} ry={r.h * 0.2} className="c-luz-lateral" />
        </g>
      )}
      {(variante === "conveccion" || modelo === "smeg") && (
        <g className="c-ventilador" style={{ transformOrigin: `${fx}px ${fy}px` } as CSSProperties}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={`M${fx} ${fy} q 3 -${fR * 0.4} 0 -${fR * 0.8}`} transform={`rotate(${a} ${fx} ${fy})`} className="c-aspa c-aspa-fondo" />
          ))}
        </g>
      )}
      {variante === "conveccion" && <Aire trazos={[`M${b.x + 6} ${b.y + b.h * 0.2} q ${b.w * 0.25} -8 ${b.w * 0.4} 0`, `M${b.x + b.w - 6} ${b.y + b.h * 0.72} q -${b.w * 0.25} 8 -${b.w * 0.4} 0`]} />}
      {variante === "multifuncion" && (
        <path
          d={`M${b.x + 4} ${b.y + 3} ${Array.from({ length: 10 }, (_, k) => `L${b.x + 4 + ((b.w - 8) * (k + 0.5)) / 10} ${b.y + (k % 2 ? 3 : 7)}`).join(" ")} L${b.x + b.w - 4} ${b.y + 3}`}
          className="c-resistencia"
        />
      )}
      {/* Luz interior */}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#c-horno-luz)" className="c-luz-horno" />
      {modelo === "thermador" && (
        // Asador giratorio (rosticero) a media altura
        <g>
          <line x1={b.x - 6} y1={fy + fR * 0.9} x2={b.x + b.w + 6} y2={fy + fR * 0.9} className="c-espeton" />
          <rect x={b.x + b.w + 2} y={fy + fR * 0.9 - 3} width={5} height={6} rx={1} className="c-motor-espeton" />
        </g>
      )}
      {/* Parrillas extra de alambre (doble) */}
      {Array.from({ length: parrillas - 1 }, (_, k) => {
        const y = r.y + r.h * (0.42 + k * 0.18);
        return (
          <g key={k}>
            <line x1={r.x + 3} y1={y} x2={r.x + r.w - 3} y2={y} className="c-riel" />
            {Array.from({ length: 9 }, (_, j) => (
              <line key={j} x1={r.x + r.w * (0.14 + j * 0.09)} y1={y} x2={b.x + b.w * (0.06 + j * 0.11)} y2={atras(y)} className="c-parrilla-alambre" />
            ))}
          </g>
        );
      })}
      {/* Parrilla / charola y comida */}
      {acero ? (
        <g>
          <ellipse cx={fx} cy={pisoY - 2} rx={r.w * 0.36} ry={r.h * 0.1} className="c-plato-giratorio c-plato-negro" />
          <ellipse cx={fx} cy={pisoY - 3} rx={r.w * 0.32} ry={r.h * 0.08} className="c-plato-negro-int" />
          <path d={`M${fx - r.w * 0.2} ${pisoY - 4} q ${r.w * 0.06} -${r.h * 0.12} ${r.w * 0.17} -${r.h * 0.05} q -${r.w * 0.02} ${r.h * 0.08} -${r.w * 0.17} ${r.h * 0.05} Z`} className="c-salmon" />
          <path d={`M${fx - r.w * 0.06} ${pisoY - 3} q ${r.w * 0.07} -${r.h * 0.13} ${r.w * 0.17} -${r.h * 0.05} q -${r.w * 0.02} ${r.h * 0.08} -${r.w * 0.17} ${r.h * 0.05} Z`} className="c-salmon" />
          {Array.from({ length: 14 }, (_, k) => (
            <circle key={k} cx={fx - r.w * 0.16 + ((k * 37) % 100) * r.w * 0.0028} cy={pisoY - 6 - ((k * 13) % 7) * 0.8} r={0.45} className={k % 3 ? "c-ajonjoli" : "c-ajonjoli-claro"} />
          ))}
          <path d={`M${fx + r.w * 0.13} ${pisoY - 6} a 4 3 0 0 1 8 0 Z`} className="i-limon" />
          <circle cx={fx + r.w * 0.11} cy={pisoY - 9} r={2.2} className="i-verde" />
        </g>
      ) : (
        <g>
          <line x1={r.x + 3} y1={pisoY} x2={r.x + r.w - 3} y2={pisoY} className="c-riel" />
          {Array.from({ length: 9 }, (_, k) => (
            <line key={k} x1={r.x + r.w * (0.14 + k * 0.09)} y1={pisoY} x2={b.x + b.w * (0.06 + k * 0.11)} y2={atras(pisoY)} className="c-parrilla-alambre" />
          ))}
          <polygon points={pts([[r.x + r.w * 0.24, pisoY - 1], [r.x + r.w * 0.76, pisoY - 1], [r.x + r.w * 0.72, pisoY - 6], [r.x + r.w * 0.28, pisoY - 6]])} className="c-charola" />
          {variante === "vapor" ? (
            <g>
              {[0.38, 0.45, 0.52, 0.59, 0.66].map((f, k) => (
                <circle key={f} cx={r.x + r.w * f} cy={pisoY - 9 - (k % 2) * 1.5} r={r.h * 0.04} className={k % 2 ? "i-verde" : "c-zanahoria"} />
              ))}
              <Vapor x={fx} y={pisoY - 22} n={5} ancho={r.w * 0.1} />
            </g>
          ) : comida === "pan" ? (
            <g>
              {[0.38, 0.5, 0.62].map((f) => (
                <ellipse key={f} cx={r.x + r.w * f} cy={pisoY - 9} rx={r.w * 0.055} ry={r.h * 0.06} className="c-pan" />
              ))}
            </g>
          ) : (
            <g>
              <ellipse cx={fx} cy={pisoY - 12} rx={r.w * 0.13} ry={r.h * 0.09} className="c-pollo" />
              <ellipse cx={fx - r.w * 0.04} cy={pisoY - 16} rx={r.w * 0.05} ry={r.h * 0.03} className="c-brillo-comida" />
              <circle cx={r.x + r.w * 0.34} cy={pisoY - 9} r={3} className="i-limon" />
              <circle cx={r.x + r.w * 0.66} cy={pisoY - 9} r={3} className="i-verde" />
            </g>
          )}
        </g>
      )}
      <rect x={r.x} y={r.y} width={r.w} height={r.h} className="ilus-apagado" />
    </g>
  );
}

/** Horno de pared de un modelo de referencia, empotrado en la columna. */
function escenaHornoModelo(modelo: keyof typeof HORNOS, variante: Variante, etiquetas: Etiqueta[]): Escena {
  const m = HORNOS[modelo];
  const x1 = 160;
  const x2 = 400;
  const frente: Rect = { x: HX, y: m.y, w: HW, h: m.h };
  const puerta: Rect = { x: HX, y: m.puerta[0], w: HW, h: m.puerta[1] - m.puerta[0] };
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={[frente]} />
        <PuertasColumna x1={x1} x2={x2} y1={24} y2={m.y - 8} arriba />
        <PuertasColumna x1={x1} x2={x2} y1={m.y + m.h + 8} y2={362} />
        {/* Cuerpo detrás de la puerta (se ve en las juntas) */}
        <rect x={HX} y={m.y} width={HW} height={m.h} className="c-cuerpo-horno" />
        <TableroHorno r={{ x: HX, y: m.y, w: HW, h: m.panel }} modelo={modelo} />
        <InteriorHorno r={{ x: puerta.x + 3, y: puerta.y + 2, w: puerta.w - 6, h: puerta.h - 4 }} modelo={modelo} variante={variante} />
        {m.zoclo && (
          <g>
            <Acero x={HX} y={m.zoclo[0]} w={HW} h={m.zoclo[1] - m.zoclo[0]} />
            {modelo === "thermador" &&
              [0.3, 0.4, 0.5, 0.6].map((f) => <rect key={f} x={HX + HW * f} y={m.zoclo![0] + 2} width={HW * 0.09} height={2.2} rx={0.5} className="c-ranura-negra" />)}
            {modelo === "monogram" && <line x1={HX + 2} y1={m.zoclo[0] + 1} x2={HX + HW - 2} y2={m.zoclo[0] + 1} className="c-filo-sombra" />}
          </g>
        )}
      </>
    ),
    capas: <PuertaAbajo r={puerta} o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo }} caida={modelo === "monogram" ? 0.5 : 0.36} />,
    etiquetas,
    recorte: R_COLUMNA,
  };
}

/** Horno doble Thermador Masterpiece (sin perillas): franja de control arriba,
 *  dos puertas abatibles con jaladera tubular y tres parrillas por cavidad. */
function escenaHornoDoble(etiquetas: Etiqueta[]): Escena {
  const x = 190;
  const w = 180;
  const y0 = 34;
  const panel: Rect = { x, y: y0, w, h: 33 };
  const puertas: Rect[] = [
    { x, y: 69, w, h: 134 },
    { x, y: 208, w, h: 134 },
  ];
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={160} x2={400} huecos={[{ x, y: y0, w, h: 314 }]} />
        <rect x={x} y={y0} width={w} height={314} className="c-cuerpo-horno" />
        <TableroHorno r={panel} modelo="masterpiece" />
        {puertas.map((d, k) => (
          <InteriorHorno
            key={k}
            r={{ x: d.x + 3, y: d.y + 2, w: d.w - 6, h: d.h - 4 }}
            modelo="masterpiece"
            variante="conveccion"
            comida={k ? "pan" : "pollo"}
            parrillas={3}
          />
        ))}
        {/* Juntas con ventilación entre los hornos y abajo */}
        {[203, 342].map((y) => (
          <g key={y}>
            <Acero x={x} y={y} w={w} h={y === 203 ? 5 : 6} />
            {[0.3, 0.4, 0.5, 0.6].map((f) => (
              <rect key={f} x={x + w * f} y={y + 1.4} width={w * 0.09} height={2.2} rx={0.5} className="c-ranura-negra" />
            ))}
          </g>
        ))}
      </>
    ),
    capas: (
      <>
        {puertas.map((d, k) => (
          <PuertaAbajo key={k} r={d} k={k} o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo: "masterpiece" }} caida={0.3} />
        ))}
      </>
    ),
    etiquetas,
    recorte: R_COLUMNA,
  };
}

/** Horno French Door tipo Café 30″: tablero con pantalla a color, dos puertas
 *  que abren a los lados con jaladeras verticales junto a la unión. */
function escenaHornoFrench(etiquetas: Etiqueta[]): Escena {
  const frente: Rect = { x: HX, y: 96, w: HW, h: 189 };
  const panel: Rect = { x: HX, y: 96, w: HW, h: 35 };
  const puerta = { y: 133, h: 142 };
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={160} x2={400} huecos={[frente]} />
        <PuertasColumna x1={160} x2={400} y1={24} y2={88} arriba />
        <PuertasColumna x1={160} x2={400} y1={293} y2={362} />
        <rect x={HX} y={frente.y} width={HW} height={frente.h} className="c-cuerpo-horno" />
        <TableroHorno r={panel} modelo="cafe" />
        <InteriorHorno r={{ x: HX + 3, y: puerta.y + 2, w: HW - 6, h: puerta.h - 4 }} modelo="cafe" variante="conveccion" />
        <rect x={HX + 1} y={276} width={HW - 2} height={9} className="c-zoclo-negro" />
      </>
    ),
    capas: (
      <>
        <PuertaLado r={{ x: HX, y: puerta.y, w: HW / 2 - 0.5, h: puerta.h }} lado="l" o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo: "cafe", lado: "l" }} />
        <PuertaLado r={{ x: HX + HW / 2 + 0.5, y: puerta.y, w: HW / 2 - 0.5, h: puerta.h }} lado="r" o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo: "cafe", lado: "r" }} />
      </>
    ),
    etiquetas,
    recorte: R_COLUMNA,
  };
}

/* ——— Microondas por modelo de referencia (Carla, 2026-10-21) ——————————————
   ge:        GE de mesa (vidrio negro, panel negro con display verde)
   thermador: Thermador empotrable 24″ con kit de marco (Empotrable y + Trim)
   whirlpool: Whirlpool sobre la estufa (microcampana)
   El speed oven de Multifunción usa el Monogram de los hornos. ———————————— */

type ModeloMicro = "ge" | "thermador" | "whirlpool";

/** Fracción del ancho que ocupa la puerta (el resto es el panel de control). */
const PUERTA_MICRO: Record<ModeloMicro, number> = { ge: 0.82, thermador: 0.81, whirlpool: 0.8 };

/** Teclado del panel: renglones de etiquetas y la cuadrícula de números. */
function Teclado({ x, y, w, h, claro }: { x: number; y: number; w: number; h: number; claro?: boolean }) {
  const cl = claro ? "c-tecla-micro c-tecla-micro--claro" : "c-tecla-micro";
  return (
    <g>
      {Array.from({ length: 4 }, (_, f) =>
        [0.2, 0.5, 0.8].map((c) => <rect key={`e${f}${c}`} x={x + w * c - w * 0.1} y={y + h * (f * 0.11)} width={w * 0.2} height={0.9} className={cl} />),
      )}
      {Array.from({ length: 4 }, (_, f) =>
        [0.2, 0.5, 0.8].map((c) => <rect key={`n${f}${c}`} x={x + w * c - 0.7} y={y + h * (0.48 + f * 0.11)} width={1.4} height={1.8} className={cl} />),
      )}
    </g>
  );
}

/** Cuerpo fijo del microondas (todo menos la puerta): marco y panel de control. */
function CuerpoMicroModelo({ r, modelo }: { r: Rect; modelo: ModeloMicro }) {
  const px = r.x + r.w * PUERTA_MICRO[modelo];
  const pw = r.x + r.w - px;
  if (modelo === "ge") {
    return (
      <g>
        {[0.14, 0.84].map((f) => (
          <rect key={f} x={r.x + r.w * f - 3} y={r.y + r.h} width={6} height={3} rx={1} className="c-pata-micro" />
        ))}
        <Acero {...r} rx={2} />
        <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} rx={1} className="c-cuerpo-negro" />
        {/* Panel negro con display verde y franja de acero abajo */}
        <rect x={px + 1} y={r.y + r.h * 0.12} width={pw - 6} height={r.h * 0.12} className="c-display-micro" />
        <text x={px + (pw - 4) / 2} y={r.y + r.h * 0.21} textAnchor="middle" className="c-digitos-verdes">
          12:08
        </text>
        <Teclado x={px + 1} y={r.y + r.h * 0.32} w={pw - 6} h={r.h * 0.5} claro />
        <Acero x={px} y={r.y + r.h * 0.86} w={pw - 2} h={r.h * 0.12} />
      </g>
    );
  }
  if (modelo === "thermador") {
    return (
      <g>
        <Acero {...r} />
        <line x1={px} y1={r.y} x2={px} y2={r.y + r.h} className="c-filo-sombra" />
        {/* Panel: banda clara a la altura de la ventana, display, teclas y botón de apertura */}
        <rect x={px + 1} y={r.y + r.h * 0.17} width={pw - 2} height={r.h * 0.66} className="c-banda-clara" />
        <rect x={px + pw * 0.15} y={r.y + r.h * 0.22} width={pw * 0.68} height={r.h * 0.1} className="c-display-micro" />
        <text x={px + pw * 0.49} y={r.y + r.h * 0.295} textAnchor="middle" className="c-digitos-azules">
          12:45
        </text>
        <Teclado x={px + pw * 0.08} y={r.y + r.h * 0.38} w={pw * 0.84} h={r.h * 0.42} />
        <rect x={px + pw * 0.1} y={r.y + r.h * 0.86} width={pw * 0.8} height={r.h * 0.11} rx={0.8} className="c-boton-apertura" />
      </g>
    );
  }
  // Whirlpool sobre la estufa: banda superior de acero con rejilla, panel negro
  // con display azul y la base con su luz.
  return (
    <g>
      <Acero {...r} />
      <rect x={r.x + r.w / 2 - 9} y={r.y + r.h * 0.07} width={18} height={1.8} className="c-leyenda" />
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={r.x + r.w * (0.1 + k * 0.068)} y={r.y + 1.2} width={r.w * 0.05} height={1.4} rx={0.4} className="c-ranura-negra" />
      ))}
      <rect x={px} y={r.y + r.h * 0.17} width={pw - r.w * 0.03} height={r.h * 0.72} className="c-cuerpo-negro" />
      <rect x={px + pw * 0.2} y={r.y + r.h * 0.24} width={pw * 0.5} height={r.h * 0.09} className="c-display-micro" />
      <text x={px + pw * 0.45} y={r.y + r.h * 0.31} textAnchor="middle" className="c-digitos-azules">
        12:20
      </text>
      <Teclado x={px + 1} y={r.y + r.h * 0.38} w={pw - r.w * 0.03 - 2} h={r.h * 0.46} claro />
      <rect x={r.x} y={r.y + r.h * 0.92} width={r.w} height={r.h * 0.08} className="c-base-micro" />
    </g>
  );
}

/** Puerta de microondas (svg w×h) por modelo. */
function PuertaMicro({ w, h, modelo }: { w: number; h: number; modelo: ModeloMicro }) {
  if (modelo === "ge") {
    return (
      <g>
        <rect x={0.5} y={0.5} width={w - 1} height={h * 0.86} className="c-cuerpo-negro" />
        <rect x={w * 0.14} y={h * 0.16} width={w * 0.72} height={h * 0.52} rx={3} fill="url(#c-malla)" className="c-malla" />
        <polygon points={pts([[w * 0.2, 1], [w * 0.38, 1], [w * 0.2, h * 0.86], [w * 0.04, h * 0.86]])} className="c-reflejo" />
        <circle cx={w * 0.075} cy={h * 0.74} r={3.2} className="c-emblema" />
        <Acero x={0.5} y={h * 0.86} w={w - 1} h={h * 0.13} />
      </g>
    );
  }
  if (modelo === "thermador") {
    return (
      <g>
        <rect x={0} y={h * 0.17} width={w} height={h * 0.66} className="c-banda-clara" />
        <rect x={w * 0.12} y={h * 0.22} width={w * 0.76} height={h * 0.5} fill="url(#c-malla)" className="c-malla" />
        <rect x={w / 2 - 10} y={h * 0.76} width={20} height={1.6} className="c-leyenda" />
        <line x1={0} y1={h * 0.83} x2={w} y2={h * 0.83} className="c-filo-luz" />
      </g>
    );
  }
  return (
    <g>
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} className="c-cuerpo-negro" />
      <rect x={w * 0.08} y={h * 0.14} width={w * 0.76} height={h * 0.7} fill="url(#c-malla)" className="c-malla" />
      {/* Jaladera vertical de acero a la derecha de la puerta */}
      <rect x={w * 0.9 - 2.6} y={h * 0.12} width={5.2} height={h * 0.74} rx={1.2} fill="url(#ilus-cromo)" className="i-manija" />
    </g>
  );
}

/** Horno de pared fijo (no se abre en esta ficha) de y a y+190, tipo Thermador. */
function HornoThermadorFijo({ y }: { y: number }) {
  const m = HORNOS.thermador;
  const d = y - m.y;
  const puerta: Rect = { x: HX, y: m.puerta[0] + d, w: HW, h: m.puerta[1] - m.puerta[0] };
  return (
    <g>
      <rect x={HX} y={y} width={HW} height={m.h} className="c-cuerpo-horno" />
      <TableroHorno r={{ x: HX, y, w: HW, h: m.panel }} modelo="thermador" />
      <g transform={`translate(${puerta.x} ${puerta.y})`}>
        <Acero x={0} y={0} w={puerta.w} h={puerta.h} />
        <FrenteHorno w={puerta.w} h={puerta.h} modelo="thermador" />
      </g>
      <Acero x={HX} y={m.zoclo![0] + d} w={HW} h={m.zoclo![1] - m.zoclo![0]} />
      {[0.3, 0.4, 0.5, 0.6].map((f) => (
        <rect key={f} x={HX + HW * f} y={m.zoclo![0] + d + 2} width={HW * 0.09} height={2.2} rx={0.5} className="c-ranura-negra" />
      ))}
    </g>
  );
}

/** Microondas Thermador con su marco (trim) en `t`; devuelve fondo y puerta. */
function MicroConMarco(t: Rect) {
  const micro: Rect = { x: t.x + t.w * 0.09, y: t.y + t.h * 0.19, w: t.w * 0.82, h: t.h * 0.62 };
  const puerta: Rect = { x: micro.x, y: micro.y, w: micro.w * PUERTA_MICRO.thermador, h: micro.h };
  return {
    fondo: (
      <g>
        <Acero {...t} />
        <rect x={micro.x - 2} y={micro.y - 2} width={micro.w + 4} height={micro.h + 4} rx={2} className="c-junta-marco" />
        <CuerpoMicroModelo r={micro} modelo="thermador" />
        <CavidadHorno r={{ x: puerta.x + 4, y: puerta.y + 4, w: puerta.w - 8, h: puerta.h - 8 }} variante="micro" comida="verduras" />
      </g>
    ),
    puerta: <PuertaLado r={puerta} lado="l" o={{ acabado: "acero", ventana: false, manija: "ninguna", micro: "thermador" }} />,
  };
}

function escenaMicro(tipo: "mesa" | "empotrable" | "multifuncion" | "campana" | "cajon" | "trim", etiquetas: Etiqueta[]): Escena {
  if (tipo === "mesa") {
    // GE de mesa sobre la cubierta, bajo las alacenas.
    const r: Rect = { x: 205, y: 155, w: 150, h: 78 };
    const puerta: Rect = { x: r.x + 2, y: r.y + 2, w: r.w * PUERTA_MICRO.ge - 2, h: r.h - 4 };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaBarra x1={r.x} x2={r.x + r.w} />
          <CuerpoMicroModelo r={r} modelo="ge" />
          <CavidadHorno r={{ x: puerta.x + 4, y: puerta.y + 4, w: puerta.w - 8, h: puerta.h - 8 }} variante="micro" comida="verduras" />
        </>
      ),
      capas: <PuertaLado r={puerta} lado="l" o={{ acabado: "negro", ventana: false, manija: "ninguna", micro: "ge" }} />,
      etiquetas,
      recorte: R_BARRA,
    };
  }
  if (tipo === "campana") {
    // Whirlpool sobre la estufa: luz hacia la cocción, el humo entra por la
    // base y sale por la rejilla de arriba.
    const x = 200;
    const w = 160;
    const r: Rect = { x, y: 100, w, h: 84 };
    const puerta: Rect = { x: x + w * 0.03, y: r.y + r.h * 0.17, w: w * (PUERTA_MICRO.whirlpool - 0.03), h: r.h * 0.72 };
    const base = r.y + r.h;
    const desde: [number, number][] = [
      [x + w / 6, 198],
      [x + (w * 5) / 6, 214],
    ];
    return {
      estados: "encender",
      fondo: (
        <>
          <EscenaCocina x1={x - 2} x2={x + w + 2} alacenaCorrida={98} />
          <rect x={x - 2} y={96} width={w + 4} height={4} className="i-nicho" />
          <LuzCampana x1={x + 10} x2={x + w - 10} y={base} piso={228} />
          <Estufa x={x} w={w} tipo="empotre" />
          <CaraEstatica r={puertasEstufa(x, w, "empotre")[0]} espejo />
          <CuerpoMicroModelo r={r} modelo="whirlpool" />
          <g transform={`translate(${puerta.x} ${puerta.y})`}>
            <PuertaMicro w={puerta.w} h={puerta.h} modelo="whirlpool" />
          </g>
          <AireCampana x1={x + 10} x2={x + w - 10} y={base} desde={desde} />
          {/* Salida por la rejilla superior */}
          {[x + w * 0.3, x + w * 0.5, x + w * 0.7].map((dx) => (
            <Ducto key={dx} x={dx} y1={40} y2={104} />
          ))}
        </>
      ),
      etiquetas,
      recorte: R_COCINA,
    };
  }
  if (tipo === "cajon") {
    // Thermador de cajón bajo la cubierta de la isla: panel de control arriba y
    // cajón con frente de vidrio gris que sale con el plato.
    const u: Rect = { x: 210, y: ISLA_Y + 12, w: 140, h: 88 };
    const cajon: Rect = { x: u.x, y: u.y + 16, w: u.w, h: u.h - 16 };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaIsla />
          <rect x={u.x - 3} y={u.y - 3} width={u.w + 6} height={u.h + 6} className="i-nicho" />
          <rect x={u.x} y={u.y} width={u.w} height={15} className="c-panel-cajon" />
          <rect x={u.x + u.w * 0.42} y={u.y + 4} width={u.w * 0.14} height={7} className="c-display-claro" />
          <text x={u.x + u.w * 0.49} y={u.y + 9.4} textAnchor="middle" className="c-digitos-oscuros">
            6:30
          </text>
          {[0.08, 0.15, 0.22, 0.29, 0.36].map((f) => (
            <g key={f}>
              <rect x={u.x + u.w * f} y={u.y + 4} width={5} height={0.8} className="c-tecla-micro" />
              <rect x={u.x + u.w * f} y={u.y + 9} width={5} height={0.8} className="c-tecla-micro" />
            </g>
          ))}
          {[0.62, 0.69, 0.76, 0.83, 0.9].map((f) => (
            <g key={f}>
              <rect x={u.x + u.w * f} y={u.y + 4} width={1.2} height={1.8} className="c-tecla-micro" />
              <rect x={u.x + u.w * f} y={u.y + 9} width={1.2} height={1.8} className="c-tecla-micro" />
            </g>
          ))}
          <rect x={cajon.x} y={cajon.y} width={cajon.w} height={cajon.h} className="c-cavidad" />
          <Olla cx={300} y={ISLA_Y - 14} w={28} h={18} tapa />
          <Tablas x={240} y={ISLA_Y - 14} />
        </>
      ),
      capas: <CajonSale r={cajon} contenido="comida" o={{ acabado: "acero", manija: "ninguna", vidrioGris: true }} />,
      etiquetas,
      recorte: R_ISLA,
    };
  }
  if (tipo === "multifuncion") {
    // Monogram: speed oven arriba y horno de pared Monogram abajo (proporción
    // de un horno sencillo), los dos con tablero de vidrio negro y pantalla.
    const m = HORNOS.monogram;
    const ys = 30;
    const d = ys - m.y;
    const speed: Rect = { x: HX, y: m.puerta[0] + d, w: HW, h: m.puerta[1] - m.puerta[0] };
    const yo = ys + m.h + 6;
    const horno: Rect = { x: HX, y: yo + 37, w: HW, h: 143 };
    return {
      estados: "abrir",
      fondo: (
        <>
          <EscenaColumna x1={160} x2={400} huecos={[{ x: HX, y: ys, w: HW, h: m.h + 6 + 190 }]} />
          <rect x={HX} y={ys} width={HW} height={m.h + 6 + 190} className="c-cuerpo-horno" />
          {/* Speed oven */}
          <TableroHorno r={{ x: HX, y: ys, w: HW, h: m.panel }} modelo="monogram" />
          <InteriorHorno r={{ x: speed.x + 3, y: speed.y + 2, w: speed.w - 6, h: speed.h - 4 }} modelo="monogram" variante="multifuncion" />
          <Acero x={HX} y={m.zoclo![0] + d} w={HW} h={m.zoclo![1] - m.zoclo![0]} />
          {/* Horno de pared */}
          <TableroHorno r={{ x: HX, y: yo, w: HW, h: 34 }} modelo="monogram" />
          <InteriorHorno r={{ x: horno.x + 3, y: horno.y + 2, w: horno.w - 6, h: horno.h - 4 }} modelo="cafe" variante="conveccion" parrillas={2} />
          <Acero x={HX} y={yo + 181} w={HW} h={9} />
          <line x1={HX + 2} y1={yo + 182} x2={HX + HW - 2} y2={yo + 182} className="c-filo-sombra" />
        </>
      ),
      capas: (
        <>
          <PuertaAbajo r={speed} k={0} o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo: "monogram" }} caida={0.42} />
          <PuertaAbajo r={horno} k={1} o={{ acabado: "acero", ventana: false, manija: "ninguna", modelo: "monogram" }} caida={0.3} />
        </>
      ),
      etiquetas,
      recorte: R_COLUMNA,
    };
  }
  // Empotrable (con el horno sencillo abajo) y + Trim (solo): Thermador con marco.
  const trim = tipo === "trim";
  const t: Rect = trim ? { x: HX, y: 110, w: HW, h: 135 } : { x: HX, y: 30, w: HW, h: 135 };
  const mm = MicroConMarco(t);
  return {
    estados: "abrir",
    fondo: (
      <>
        <EscenaColumna x1={160} x2={400} huecos={trim ? [t] : [t, { x: HX, y: 170, w: HW, h: 190 }]} />
        {trim && (
          <>
            <PuertasColumna x1={160} x2={400} y1={24} y2={102} arriba />
            <PuertasColumna x1={160} x2={400} y1={253} y2={362} />
          </>
        )}
        {mm.fondo}
        {!trim && <HornoThermadorFijo y={170} />}
      </>
    ),
    capas: mm.puerta,
    etiquetas,
    recorte: R_COLUMNA,
  };
}

/** Frente fijo (horno que no se anima en esta ficha). */
function CaraEstatica({ r, control, espejo }: { r: Rect; control?: boolean; espejo?: boolean }) {
  if (espejo)
    return (
      <g transform={`translate(${r.x} ${r.y})`}>
        <Acero x={0} y={0} w={r.w} h={r.h} />
        <FrenteEspejo w={r.w} h={r.h} />
      </g>
    );
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
    // Ambiente de la campana tipo Repisa, sin campana: la cafetera al centro,
    // bajo la repisa (Carla, 2026-10-21).
    return {
      estados: "encender",
      fondo: (
        <>
          <FondoRepisa />
          <RepisaDecorada />
          {/* Un poco más grande que la escala real para que se lea en la tarjeta. */}
          <g transform="translate(280 236) scale(1.15) translate(-280 -236)">
            <CafeteraMesa cx={280} y={236} />
          </g>
        </>
      ),
      etiquetas,
      recorte: R_COCINA,
    };
  }
  const x1 = 160;
  const x2 = 400;
  const cafe: Rect = { x: 182, y: 82, w: 196, h: 140 }; // proporción del frente Bosch
  const cajon: Rect = { x: 182, y: 232, w: 196, h: 40 };
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaColumna x1={x1} x2={x2} huecos={[cafe, cajon]} />
        <PuertasColumna x1={x1} x2={x2} y1={24} y2={74} arriba />
        <PuertasColumna x1={x1} x2={x2} y1={280} y2={362} />
        <CafeteraEmpotre r={cafe} />
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
          <EscenaIsla detras={tipo === "retractil" ? <Retractil /> : undefined} oscuro />
          {tipo === "retractil" && <RanuraRetractil />}
          {c && tipo !== "monolith" && <LuzCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} piso={ISLA_Y - 12} ancho={1.05} />}
          {tipo === "monolith" && c?.el}
          {tipo === "retractil" || tipo === "monolith" ? <ParrillaInduccionIsla /> : <ParrillaIsla />}
          {tipo !== "monolith" && c?.el}
          {c?.ducto && <Ducto x={c.ducto[0]} y1={c.ducto[1]} y2={c.ducto[2]} />}
          {tipo === "monolith" ? (
            <Aire trazos={[`M252 ${ISLA_Y - 44} C 250 ${ISLA_Y - 54}, 262 ${ISLA_Y - 60}, 272 ${ISLA_Y - 61}`, `M262 ${ISLA_Y - 38} C 268 ${ISLA_Y - 50}, 284 ${ISLA_Y - 58}, 300 ${ISLA_Y - 60}`]} />
          ) : c ? (
            <AireCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} desde={desde} />
          ) : (
            <Aire trazos={[`M252 ${ISLA_Y - 44} C 252 ${ISLA_Y - 60}, 270 ${ISLA_Y - 72}, 280 ${ISLA_Y - 74}`, `M262 ${ISLA_Y - 36} C 270 ${ISLA_Y - 52}, 290 ${ISLA_Y - 64}, 300 ${ISLA_Y - 74}`]} />
          )}
        </>
      ),
      etiquetas,
      recorte: R_ISLA,
    };
  }
  if (tipo === "gran-formato" || tipo === "repisa") return escenaCampanaCorrida(tipo, etiquetas);
  const w = 170;
  const x = 280 - w / 2;
  const alacena = tipo === "bajo-mueble" || tipo === "slider" ? 132 : undefined;
  const c = CampanaPared({ tipo, cx: 280, ancho: tipo === "airwall" ? w : w + 30 });
  const ollaY = 224;
  const desde: [number, number][] = [
    [x + w * 0.2, ollaY - 34],
    [x + w * 0.8, ollaY - 20],
  ];
  return {
    estados: "encender",
    fondo: (
      <>
        <EscenaCocina x1={x - 2} x2={x + w + 2} alacenaCorrida={alacena} sinAlacenas={tipo === "piramidal" || tipo === "airwall"} />
        {tipo === "airwall" && (
          // Sin alacenas: repisa oscura corrida con luz cálida que baña el muro
          // (referencia de Carla, 2026-10-21).
          <g>
            <rect x={0} y={104} width={W} height={74} fill="url(#c-luz-repisa)" />
            <rect x={0} y={92} width={W} height={12} className="c-repisa-negra" />
            <rect x={0} y={92} width={W} height={1.4} className="c-repisa-canto" />
            <line x1={0} y1={104.6} x2={W} y2={104.6} className="c-led-repisa" />
            <g transform="translate(392 92) scale(0.85)">
              <Planta2 x={0} y={0} />
            </g>
            <rect x={150} y={80} width={11} height={12} rx={2} className="c-repisa-negra c-repisa-cuerpo" />
            <rect x={164} y={84} width={9} height={8} rx={2} className="c-repisa-negra c-repisa-cuerpo" />
          </g>
        )}
        {tipo !== "airwall" && <LuzCampana x1={c.boca[0]} x2={c.boca[1]} y={c.boca[2]} piso={228} />}
        {c.el}
        {c.ducto && <Ducto x={c.ducto[0]} y1={c.ducto[1]} y2={c.ducto[2]} />}
        {tipo === "airwall" ? (
          <>
            {/* Parrilla empotrada en la cubierta y gabinetes abajo. */}
            <rect x={x - 3} y={236} width={w + 6} height={9} className="i-cubierta" />
            <Cajones x1={x} x2={x + w} ys={[245, 290, 335, 366]} />
            <rect x={x + 24} y={231} width={w - 48} height={5} className="c-vidrio-negro" />
            <Olla cx={x + w * 0.3} y={231} w={30} h={22} />
            <Vapor x={x + w * 0.3} y={200} n={3} />
            {/* El vapor se va de lado a la ranura del panel. */}
            <Aire
              trazos={[
                `M${x + w * 0.3} 206 C ${x + w * 0.32} 196, ${c.boca[0] - 4} 204, ${c.boca[0] + 6} ${c.boca[2]}`,
                `M${x + w * 0.36} 212 C ${x + w * 0.42} 204, ${c.boca[0] + 10} 206, ${c.boca[0] + 22} ${c.boca[2]}`,
              ]}
            />
          </>
        ) : (
          <>
            <Estufa x={x} w={w} tipo="empotre" />
            {puertasEstufa(x, w, "empotre").map((d, k) => (
              <CaraEstatica key={k} r={d} espejo />
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

/** Ambiente de la campana tipo Repisa (también lo usa la cafetera de mesa):
 *  muro de mármol claro y gabinetes negros sin jaladeras, solo con sus cortes
 *  (Carla, 2026-10-21). */
function FondoRepisa() {
  return (
    <g className="c-muro-claro c-gabinete-negro">
      <EscenaCocina x1={280} x2={280} sinAlacenas />
    </g>
  );
}

/** Repisa negra corrida con cuadro, cuenco y planta encima. */
function RepisaDecorada() {
  return (
    <g>
      <rect x={156} y={90} width={36} height={38} className="c-marco-cuadro" />
      <rect x={160} y={94} width={28} height={30} className="c-lienzo" />
      <path d="M166 124 L166 104 Q 174 96 182 104 L182 124 Z" className="c-figura-cuadro" />
      <g transform="translate(386 128) scale(0.85)">
        <Planta2 x={0} y={0} />
      </g>
      <rect x={210} y={120} width={14} height={8} rx={2} className="c-cuenco" />
      <rect x={120} y={128} width={320} height={6} className="c-repisa-negra" />
      <rect x={120} y={134} width={320} height={8} className="c-repisa-negra c-repisa-cuerpo" />
    </g>
  );
}

/** Cocina de muro sin alacenas con cubierta corrida (Gran formato y Repisa):
 *  la parrilla va empotrada en la cubierta, debajo de la campana. */
function escenaCampanaCorrida(tipo: "gran-formato" | "repisa", etiquetas: Etiqueta[]): Escena {
  const gran = tipo === "gran-formato";
  // Gran formato (referencia Falmec de Carla, 2026-10-21): barra larga y
  // delgada de 55″ o más —canto superior luminoso, banda de cromo y fondo
  // hundido—, ducto ancho cargado a la izquierda y el otro extremo colgado del
  // techo con dos cables. Debajo, una sola parrilla profesional ancha cargada
  // a la izquierda, bajo el ducto (Carla, 2026-10-21); sin la planta de ese lado.
  const gas = gran ? { x1: 100, x2: 310 } : { x1: 236, x2: 324 };
  const gx = (gas.x1 + gas.x2) / 2;
  const boca: [number, number, number] = gran ? [64, 516, 158] : [200, 360, 146];
  const desde: [number, number][] = [[gx - 18, 196]];
  return {
    estados: "encender",
    fondo: (
      <>
        {gran ? <EscenaCocina x1={280} x2={280} sinAlacenas sinPlanta /> : <FondoRepisa />}
        <LuzCampana x1={boca[0]} x2={boca[1]} y={boca[2]} piso={232} ancho={1.02} />
        {gran ? (
          <g>
            {[494, 506].map((x) => (
              <line key={x} x1={x} y1={20} x2={x} y2={140} className="c-tensor" />
            ))}
            <Acero x={158} y={20} w={68} h={120} />
            {/* Barra: canto luminoso, banda de cromo y fondo hundido con su sensor */}
            <rect x={56} y={140} width={468} height={5} className="c-canto-luminoso" />
            <rect x={56} y={145} width={468} height={8} fill="url(#ilus-cromo-h)" className="i-panel" />
            <polygon points={pts([[56, 153], [524, 153], [516, 158], [64, 158]])} className="c-base-micro" />
            <rect x={270} y={153} width={20} height={3} className="c-sensor-barra" />
            <rect x={66} y={156.6} width={448} height={1.4} className="c-led-barra" />
            {[0, 1, 2, 3, 4].map((k) => (
              <rect key={k} x={170 + k * 5} y={148.3} width={3} height={1.4} rx={0.4} className="c-tecla-control" />
            ))}
          </g>
        ) : (
          <g>
            <RepisaDecorada />
            {/* Módulo de extracción al centro, bajo la repisa */}
            <rect x={200} y={142} width={160} height={4} className="c-base-micro" />
            <rect x={206} y={145} width={148} height={1.2} className="c-led-barra" />
          </g>
        )}
        {/* Parrilla de gas empotrada en la cubierta, bajo el ducto */}
        <rect x={gas.x1} y={233} width={gas.x2 - gas.x1} height={3} className="c-vidrio-negro" />
        {(gran ? [1, 3, 5, 7, 9, 11].map((k) => k / 12) : [0.28, 0.72]).map((f) => gas.x1 + (gas.x2 - gas.x1) * f).map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={233} rx={10} ry={2} className="c-quemador" />
            <FlamaLado cx={x} y={233} w={16} />
          </g>
        ))}
        <rect x={gas.x1 + 2} y={229} width={gas.x2 - gas.x1 - 4} height={2.2} className="c-rejilla-lado" />
        <Olla cx={gx - 18} y={229} w={30} h={24} />
        <Vapor x={gx - 18} y={200} n={3} />
        <AireCampana x1={boca[0]} x2={boca[1]} y={boca[2]} desde={desde} />
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
      { x: 377, y: 248, hasta: 440, texto: "Perillas y tablero\nal frente" },
      { x: 220, y: 300, hasta: 120, texto: "Dos hornos:\nauxiliar y grande" },
      { x: 375, y: 370, hasta: 440, texto: "Patas\nniveladoras" },
    ]),
  "estufa-empotre": () =>
    escenaEstufa("empotre", [
      { x: 206, y: 224, hasta: 120, texto: "Tapa de vidrio\nabatible" },
      { x: 330, y: 253, hasta: 440, texto: "Controles\nal frente" },
      { x: 201, y: 310, hasta: 120, texto: "Se desliza entre\nmuebles, a ras" },
    ]),
  "estufa-de-piso": () =>
    escenaEstufa("piso", [
      { x: 227, y: 227, hasta: 120, texto: "Seis quemadores,\ntres parrillas" },
      { x: 280, y: 253, hasta: 440, texto: "Display digital y\nperillas al frente" },
      { x: 361, y: 305, hasta: 440, texto: "Costados\nterminados" },
    ]),
  // ——— Parrillas ———
  "parrilla-profesional": () =>
    escenaParrilla("profesional", [
      { x: 186, y: 252, hasta: 90, texto: "Quemadores de latón\nde alto BTU" },
      { x: 280, y: 250, hasta: 470, texto: "Plancha al centro" },
      { x: 160, y: 321, hasta: 100, texto: "Perillas al\nfrente" },
    ]),
  "parrilla-tradicional": () =>
    escenaParrilla("tradicional", [
      { x: 150, y: 214, hasta: 120, texto: "Se sobrepone en\nel corte de la cubierta" },
      { x: 410, y: 199, hasta: 440, texto: "Marco visible\nsobre la piedra" },
      { x: 324, y: 276, hasta: 440, texto: "Perillas al frente" },
    ]),
  "parrilla-gas": () =>
    escenaParrilla("gas", [
      { x: 191, y: 249, hasta: 120, texto: "Wok: calor alto para\nsaltear y sellar" },
      { x: 362, y: 210, hasta: 440, texto: "Flama visible: controlas\nel calor al instante" },
      { x: 413, y: 262, hasta: 440, texto: "Sirve con cualquier\nolla o sartén" },
    ]),
  "parrilla-vitroceramica": () =>
    escenaParrilla("vitro", [
      { x: 190, y: 226, hasta: 120, texto: "Calienta sartenes a\ntravés de resistencias\neléctricas" },
      { x: 346, y: 263, hasta: 440, texto: "Mantiene mucho calor\nincluso después\nde apagarla" },
    ]),
  "parrilla-induccion": () =>
    escenaParrilla("induccion", [
      { x: 136, y: 240, hasta: 110, texto: "Zona puente:\nune dos zonas" },
      { x: 304, y: 214, hasta: 440, texto: "Calienta directo\nel recipiente" },
      { x: 318, y: 272, hasta: 440, texto: "Controles\ntáctiles" },
    ]),
  "parrilla-induccion-extraccion": () =>
    escenaParrilla("extraccion", [
      { x: 290, y: 228, hasta: 440, texto: "El vapor baja por\nel extractor central" },
      { x: 160, y: 221, hasta: 120, texto: "Sistema de inducción que\ncalienta el recipiente\nno la placa" },
    ]),
  "parrilla-hibrida": () =>
    escenaParrilla("hibrida", [
      { x: 185, y: 219, hasta: 100, texto: "Gas para\nflama directa" },
      { x: 368, y: 223, hasta: 455, texto: "Inducción para\nprecisión" },
    ]),
  "parrilla-submontar": () =>
    escenaParrilla("submontar", [
      { x: 194, y: 215, hasta: 120, texto: "Quemadores directo\nen la piedra" },
      { x: 420, y: 276, hasta: 450, texto: "Sin placa:\ncubierta continua" },
    ]),
  "parrilla-invisible": () =>
    escenaParrilla("invisible", [
      { x: 222, y: 253, hasta: 120, texto: "Inducción bajo\nla cubierta" },
      { x: 420, y: 214, hasta: 450, texto: "Apagada, solo\nse ve la piedra" },
      { x: 330, y: 286, hasta: 450, texto: "Panel táctil\nnegro" },
    ]),
  "parrilla-modular": () =>
    escenaParrilla("modular", [
      { x: 154, y: 221, hasta: 110, texto: "Inducción" },
      { x: 364, y: 218, hasta: 455, texto: "Quemadores\nde gas" },
      { x: 303, y: 267, hasta: 455, texto: "Extracción" },
      { x: 414, y: 344, hasta: 455, texto: "Perillas con\nanillo de luz" },
    ]),
  // ——— Hornos ———
  "horno-conveccion": () =>
    escenaHornoModelo("thermador", "conveccion", [
      { x: 296, y: 194, hasta: 440, texto: "Ventilador con\nresistencia propia" },
      { x: 196, y: 240, hasta: 110, texto: "Calor parejo en\ntoda la cavidad" },
    ]),
  "horno-vapor": () =>
    escenaHornoModelo("smeg", "vapor", [
      { x: 280, y: 228, hasta: 440, texto: "Cocina con humedad\ncontrolada" },
      { x: 361, y: 109, hasta: 440, texto: "Depósito de agua" },
      { x: 200, y: 250, hasta: 110, texto: "Conserva textura\ny nutrientes" },
    ]),
  "horno-multifuncion": () =>
    escenaHornoModelo("monogram", "multifuncion", [
      { x: 280, y: 175, hasta: 440, texto: "Grill superior" },
      { x: 280, y: 140, hasta: 110, texto: "Pantalla táctil\na color" },
      { x: 220, y: 225, hasta: 110, texto: "Microondas, horno\ny grill en uno" },
    ]),
  "horno-sencillo": () =>
    escenaHornoModelo("thermador", "conveccion", [
      { x: 184, y: 200, hasta: 110, texto: "A la altura\nde trabajo" },
      { x: 392, y: 130, hasta: 440, texto: "Empotrado en\nmueble columna" },
    ]),
  "horno-doble": () =>
    escenaHornoDoble([
      { x: 240, y: 52, hasta: 110, texto: "Sin perillas:\ncontrol táctil" },
      { x: 356, y: 130, hasta: 440, texto: "Dos cavidades\nindependientes" },
      { x: 204, y: 290, hasta: 110, texto: "Cada una con su\ntemperatura" },
    ]),
  "horno-french": () =>
    escenaHornoFrench([
      { x: 262, y: 110, hasta: 110, texto: "Pantalla táctil\na color" },
      { x: 280, y: 200, hasta: 440, texto: "Dos puertas que\nabren a la vez" },
      { x: 190, y: 250, hasta: 110, texto: "Menos espacio\nal frente" },
    ]),
  // ——— Microondas ———
  "micro-mesa": () =>
    escenaMicro("mesa", [
      { x: 236, y: 206, hasta: 150, texto: "Sobre la cubierta,\na 127 V" },
      { x: 342, y: 200, hasta: 440, texto: "Sin instalación" },
    ]),
  "micro-empotrable": () =>
    escenaMicro("empotrable", [
      { x: 186, y: 100, hasta: 110, texto: "Integrado al\nmueble columna" },
      { x: 368, y: 150, hasta: 440, texto: "Frente a ras" },
      { x: 360, y: 280, hasta: 440, texto: "Sobre el horno\nsencillo" },
    ]),
  "micro-multifuncion": () =>
    escenaMicro("multifuncion", [
      { x: 230, y: 110, hasta: 110, texto: "Microondas, convección\ny grill" },
      { x: 360, y: 280, hasta: 440, texto: "Con horno de pared\nabajo" },
    ]),
  "micro-campana": () =>
    escenaMicro("campana", [
      { x: 220, y: 150, hasta: 120, texto: "Sobre la estufa" },
      { x: 300, y: 186, hasta: 440, texto: "Extrae el humo\ny lo ilumina" },
      { x: 232, y: 70, hasta: 120, texto: "Sale por la\nrejilla superior" },
    ]),
  "micro-cajon": () =>
    escenaMicro("cajon", [
      { x: 240, y: 262, hasta: 60, texto: "Bajo la cubierta" },
      { x: 330, y: 262, hasta: 500, texto: "Abre deslizando:\nse carga desde arriba" },
    ]),
  "micro-trim": () =>
    escenaMicro("trim", [
      { x: 186, y: 150, hasta: 110, texto: "Marco de empotre\n(trim)" },
      { x: 374, y: 205, hasta: 440, texto: "Cubre el hueco\ndel mueble" },
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
      { x: 259, y: 162, hasta: 150, texto: "Pantalla táctil" },
      { x: 280, y: 220, hasta: 150, texto: "Molino integrado:\ncafé al momento" },
      { x: 324, y: 178, hasta: 440, texto: "Depósito de agua\nque se rellena" },
    ]),
  "cafe-empotre": () =>
    escenaCafe("empotre", [
      { x: 189, y: 160, hasta: 110, texto: "Integrada al\nmuro de hornos" },
      { x: 280, y: 102, hasta: 440, texto: "Pantalla y\nselector al frente" },
      { x: 286, y: 188, hasta: 440, texto: "Espresso\nal toque" },
    ]),
  // ——— Asadores (Carla, 2026-10-21) ———
  "asador-emp-gas": () => escenaAsador("emp-gas"),
  "asador-emp-mixto": () => escenaAsador("emp-mixto"),
  "asador-carro-gas": () => escenaAsador("carro-gas"),
  "asador-carro-carbon": () => escenaAsador("carro-carbon"),
  // ——— Tarjas y grifería (Carla, 2026-10-21) ———
  "tarja-sobreponer": () => escenaTarja("sobreponer"),
  "tarja-submontar": () => escenaTarja("submontar"),
  "tarja-dual": () => escenaTarja("dual"),
  "tarja-farmhouse": () => escenaTarja("farmhouse"),
  "tarja-1-tina": () => escenaTarjaPlanta(1),
  "tarja-2-tinas": () => escenaTarjaPlanta(2),
  "tarja-3-tinas": () => escenaTarjaPlanta(3),
  "grif-monomando": () => escenaGrifo("monomando"),
  "grif-mezcladora": () => escenaGrifo("mezcladora"),
  "grif-sencillo": () => escenaGrifo("sencillo"),
  "grif-extraible": () => escenaGrifo("extraible"),
  "grif-profesional": () => escenaGrifo("profesional"),
  "grif-inteligente": () => escenaGrifo("inteligente"),
  "grif-potfiller": () => escenaGrifo("potfiller"),
  // ——— Lavavajillas ———
  "lava-piso-frente": () =>
    escenaLavavajillas("piso-frente", [
      { x: 250, y: 270, hasta: 120, texto: "Canasta para\nvasos y tazas" },
      { x: 300, y: 308, hasta: 440, texto: "Canasta\npara platos" },
      { x: 296, y: 372, hasta: 440, texto: "Puerta abatible" },
    ]),
  "lava-piso-ocultos": () =>
    escenaLavavajillas("piso-ocultos", [
      { x: 250, y: 270, hasta: 120, texto: "Canasta para\nvasos y tazas" },
      { x: 300, y: 308, hasta: 440, texto: "Canasta\npara platos" },
      { x: 296, y: 375, hasta: 440, texto: "Botonera\nen el canto" },
    ]),
  "lava-empotre-ocultos": () =>
    escenaLavavajillas("empotre", [
      { x: 250, y: 274, hasta: 120, texto: "Canasta para\nvasos y tazas" },
      { x: 300, y: 312, hasta: 440, texto: "Canasta\npara platos" },
      { x: 296, y: 378, hasta: 440, texto: "Botonera\nen el canto" },
    ]),
  // ——— Campanas ———
  "camp-pared": () => escenaCampana("pared", [{ x: 230, y: 130, hasta: 110, texto: "Anclada al muro\nsobre la estufa" }, { x: 340, y: 190, hasta: 450, texto: "Capta el humo\ny lo saca" }]),
  "camp-isla": () => escenaCampana("isla", [{ x: 250, y: 80, hasta: 120, texto: "Suspendida del\ntecho" }, { x: 360, y: 128, hasta: 470, texto: "Sin muro: más\npotencia de extracción" }]),
  "camp-recta": () => escenaCampana("recta", [{ x: 230, y: 110, hasta: 110, texto: "Un solo prisma\nde líneas rectas" }, { x: 330, y: 190, hasta: 450, texto: "Luz LED sobre\nla cocción" }]),
  "camp-t-invertida": () => escenaCampana("t-invertida", [{ x: 280, y: 128, hasta: 450, texto: "Cubreductos\nangosto" }, { x: 214, y: 150, hasta: 110, texto: "Visera ancha\ny plana" }]),
  "camp-cristal": () => escenaCampana("cristal", [{ x: 214, y: 148, hasta: 110, texto: "Visera de vidrio\ntemplado" }, { x: 296, y: 139, hasta: 450, texto: "Controles al frente" }, { x: 330, y: 190, hasta: 450, texto: "Retiene y guía\nel vapor" }]),
  "camp-piramidal": () => escenaCampana("piramidal", [{ x: 230, y: 120, hasta: 110, texto: "Cuerpo inclinado\nhacia el ducto" }, { x: 330, y: 190, hasta: 450, texto: "Forma clásica\nde campana" }]),
  "camp-cilindrica": () => escenaCampana("cilindrica", [{ x: 252, y: 40, hasta: 120, texto: "Tubo desde\nel techo" }, { x: 250, y: 100, hasta: 120, texto: "Cuerpo exento\nsobre la isla" }, { x: 300, y: 126, hasta: 470, texto: "Luz y extracción\nal centro" }]),
  "camp-inserto": () => escenaCampana("inserto", [{ x: 206, y: 60, hasta: 110, texto: "Mueble a la medida\nque lo oculta" }, { x: 320, y: 116, hasta: 450, texto: "Inserto y ducto\ndentro del mueble" }, { x: 214, y: 162, hasta: 110, texto: "Solo se ven rejillas,\nluces y perillas" }]),
  "camp-bajo-mueble": () => escenaCampana("bajo-mueble", [{ x: 230, y: 140, hasta: 110, texto: "Bajo la alacena" }, { x: 330, y: 190, hasta: 450, texto: "Compacta, con\nsalida al ducto" }]),
  "camp-slider": () => escenaCampana("slider", [{ x: 230, y: 146, hasta: 110, texto: "Visera que se\nextiende al usarla" }, { x: 330, y: 120, hasta: 450, texto: "Integrada bajo\nla alacena" }]),
  "camp-revestir": () => escenaCampana("revestir", [{ x: 240, y: 70, hasta: 110, texto: "Forrada en madera,\npiedra o yeso" }, { x: 300, y: 130, hasta: 450, texto: "Estructura con motor\ndentro del forro" }, { x: 214, y: 150, hasta: 110, texto: "Filtros y focos\nal frente" }]),
  "camp-techo": () => escenaCampana("techo", [{ x: 220, y: 26, hasta: 110, texto: "Al ras del plafón" }, { x: 340, y: 120, hasta: 470, texto: "Sin volumen\ncolgante" }, { x: 405, y: ISLA_Y - 14, hasta: 440, texto: "Incluye un control para\najuste de extracción\ne iluminación" }]),
  "camp-decorativa": () => escenaCampana("decorativa", [{ x: 234, y: 120, hasta: 110, texto: "Forma escultórica,\ntipo lámpara" }, { x: 310, y: 164, hasta: 470, texto: "Luz y extracción\npor abajo" }]),
  "camp-retractil": () => escenaCampana("retractil", [{ x: 230, y: 180, hasta: 110, texto: "Sube desde la\ncubierta al usarla" }, { x: 352, y: 170, hasta: 470, texto: "Controles en\nel costado" }, { x: 300, y: 214, hasta: 470, texto: "Detrás de la parrilla\nde inducción" }]),
  "camp-gran-formato": () => escenaCampana("gran-formato", [{ x: 192, y: 80, hasta: 100, texto: "Ducto a un lado,\nalto caudal" }, { x: 80, y: 149, hasta: 60, texto: "55″ o más" }, { x: 500, y: 100, hasta: 430, texto: "Suspendida\ncon cables" }, { x: 290, y: 234, hasta: 450, texto: "Una parrilla\nprofesional ancha" }]),
  "camp-repisa": () => escenaCampana("repisa", [{ x: 156, y: 110, hasta: 110, texto: "Repisa para cuadro\no plantas" }, { x: 360, y: 138, hasta: 450, texto: "Perfil delgado" }]),
  "camp-monolith": () => escenaCampana("monolith", [{ x: 222, y: ISLA_Y - 60, hasta: 110, texto: "Se abre y extrae\na ras de cubierta" }, { x: 420, y: ISLA_Y - 64, hasta: 470, texto: "Canal para\nutensilios" }]),
  "camp-airwall": () => escenaCampana("airwall", [{ x: 222, y: 186, hasta: 110, texto: "Panel al muro\ndetrás de la parrilla" }, { x: 326, y: 201, hasta: 450, texto: "Extrae el vapor\nde lado" }]),
  "camp-superficie": () =>
    escenaParrilla("superficie", [
      { x: 300, y: 221, hasta: 110, texto: "Módulo de extracción\nen la cubierta" },
      { x: 415, y: 247, hasta: 455, texto: "Entre las parrillas\nmodulares" },
    ]),
  "camp-induccion-extraccion": () =>
    escenaParrilla("extraccion", [
      { x: 290, y: 228, hasta: 440, texto: "La extracción va\nen la placa" },
      { x: 200, y: 236, hasta: 120, texto: "El vapor baja,\nno sube" },
    ]),
};

export function tieneCoccion(tipo: string): boolean {
  return tipo in ESCENAS;
}

/** Escenas con botón "Panelar" (lavavajillas con controles ocultos, Carla
 *  2026-10-21): misma forma que `panelar` de IlustracionTipo. El botón va sobre
 *  la alacena derecha, a la altura libre más cercana a 100 que no tape las
 *  etiquetas de ese lado (arriba de 100 va la lupa). */
const PANELABLES = new Set(["lava-piso-ocultos", "lava-empotre-ocultos"]);
export function panelarCoccion(tipo: string): { right: string; y: string; inicial: boolean; boton: boolean } | null {
  if (!PANELABLES.has(tipo)) return null;
  const derechas = ESCENAS[tipo]().etiquetas.filter((e) => e.hasta > e.x).map((e) => e.y);
  const y = Array.from({ length: 26 }, (_, k) => 100 + k * 10).find((v) => derechas.every((t) => Math.abs(v - t) >= 46)) ?? 100;
  return { right: `${((W - 520) / W) * 100}%`, y: `${(y / H) * 100}%`, inicial: false, boton: true };
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
    <span
      className="ilus ilus--real ilus--coccion"
      style={style}
      data-estados={ESTADOS[e.estados]}
      // Microondas (Carla, 2026-10-21): en el modal las dos vistas van lado a lado.
      data-duo={tipo.startsWith("micro-") ? "lado" : undefined}
    >
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
