// CorteInstalacion — corte lateral animado para los tiles de "Tipo de
// instalación" del PLP de refrigeración. Al hover de la tarjeta (.tpg-card) la
// foto cede a este diagrama: el mueble se dibuja (trazo) y el refrigerador se
// desliza a su posición, con el remate en oro al final. La coreografía vive en
// styles/guias.css (bloque .tpg-corte / .cin-*).
//
// Doctrina "Planos de cocina" + referencias de spec-sheet aprobadas por Carla
// (2026-08-03): dibujo de línea con lenguaje de plano técnico — cotas doradas
// con rayitas terminales y cifras en cm, plano del mueble punteado, holgura de
// ventilación, rodajas/rejilla según el aparato real de la foto.
//
// Escena compartida (corte visto de lado): muro a la IZQUIERDA, piso abajo.
// El plano del frente del mueble vive en x≈118–122 EN LAS TRES tarjetas, para
// que al comparar de un vistazo se entienda la diferencia:
//   de-piso       → fondo completo (75 cm): rebasa el plano punteado; rodajas
//   counter-depth → fondo reducido (60 cm): aterriza AL RAS del plano
//   empotrado     → entra al nicho con holgura trasera y un panel lo cubre

export type TipoInstalacion =
  | "de-piso"
  | "empotrado"
  | "counter-depth"
  | "profesional"
  | "tradicional";

const TIPOS: TipoInstalacion[] = [
  "de-piso",
  "empotrado",
  "counter-depth",
  "profesional",
  "tradicional",
];

export function esTipoInstalacion(slug: string): slug is TipoInstalacion {
  return (TIPOS as string[]).includes(slug);
}

const STROKE = "var(--fg)";
const MUTED = "var(--fg-muted)";
const GOLD = "var(--homea-gold)";
const GOLD_TEXT = "var(--accent-text)";
const GREIGE = "var(--homea-greige)";
const BLANCO = "var(--surface)";

/** Muro (izquierda) + piso: el marco fijo de la escena. */
function Escena() {
  return (
    <g fill="none" strokeLinecap="round">
      <line className="cin-line" x1="30" y1="12" x2="30" y2="138" stroke={STROKE} strokeWidth="1.5" />
      <line className="cin-line" x1="12" y1="138" x2="208" y2="138" stroke={STROKE} strokeWidth="1.5" />
      {/* achurado de muro y piso — convención de plano */}
      <g stroke={MUTED} strokeWidth="1">
        <line className="cin-line" x1="30" y1="28" x2="22" y2="36" />
        <line className="cin-line" x1="30" y1="62" x2="22" y2="70" />
        <line className="cin-line" x1="30" y1="96" x2="22" y2="104" />
        <line className="cin-line" x1="60" y1="138" x2="52" y2="146" />
        <line className="cin-line" x1="110" y1="138" x2="102" y2="146" />
        <line className="cin-line" x1="160" y1="138" x2="152" y2="146" />
      </g>
    </g>
  );
}

/** Alacena superior (carpintería): su frente define la línea del mueble. */
function Alacena({ frente }: { frente: number }) {
  return (
    <rect
      className="cin-line"
      x="31.5"
      y="12"
      width={frente - 31.5}
      height="22"
      fill={GREIGE}
      stroke={STROKE}
      strokeWidth="1.25"
    />
  );
}

/** Cota horizontal estilo plano: línea con rayitas terminales verticales. */
function Cota({ x1, x2, y, color = GOLD }: { x1: number; x2: number; y: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 3.5} x2={x1} y2={y + 3.5} />
      <line x1={x2} y1={y - 3.5} x2={x2} y2={y + 3.5} />
    </g>
  );
}

function Etiqueta({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-sans)"
      fontSize="9"
      fontWeight="600"
      letterSpacing="0.14em"
      fill={GOLD_TEXT}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </text>
  );
}

/* De piso: instalación libre, fondo completo. El aparato de la foto (PRO con
   rejilla superior, cajones y rodajas) rebasa el plano punteado del mueble. */
function DePiso() {
  return (
    <svg viewBox="0 -14 220 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <Escena />
      <g className="cin-fridge">
        <rect x="32" y="40" width="104" height="94" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
        {/* rejilla superior del frente (compresor arriba, como el PRO) */}
        <g stroke={MUTED} strokeWidth="1">
          <line x1="124" y1="46" x2="134" y2="46" />
          <line x1="124" y1="50" x2="134" y2="50" />
          <line x1="124" y1="54" x2="134" y2="54" />
        </g>
        {/* jaladera + líneas de cajones al frente */}
        <rect x="136" y="62" width="4.5" height="26" rx="2" fill={STROKE} />
        <g stroke={MUTED} strokeWidth="1">
          <line x1="126" y1="98" x2="136" y2="98" />
          <line x1="126" y1="116" x2="136" y2="116" />
        </g>
        {/* rodajas: se instala libre y puede moverse */}
        <g fill="none" stroke={STROKE} strokeWidth="1.25">
          <circle cx="44" cy="136" r="2.4" />
          <circle cx="124" cy="136" r="2.4" />
        </g>
      </g>
      {/* plano del mueble: referencia punteada que atraviesa el aparato — se
          dibuja SOBRE el cuerpo (convención de spec-sheet) para que se lea
          cuánto rebasa el fondo completo */}
      <line
        className="cin-line"
        x1="118"
        y1="30"
        x2="118"
        y2="138"
        stroke={MUTED}
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {/* remate: cota de fondo completo sobre el plano del mueble. Mismo
          acomodo que counter-depth: la cifra sobre la cota y el nombre del
          concepto en el aire superior derecho (dos líneas compactas). */}
      <g className="cin-gold">
        <Cota x1={30} x2={136} y={26} />
        <Etiqueta x={83} y={19}>
          75 cm
        </Etiqueta>
        <Etiqueta x={176} y={2}>
          FONDO
        </Etiqueta>
        <Etiqueta x={176} y={14}>
          COMPLETO
        </Etiqueta>
      </g>
    </svg>
  );
}

/* Counter depth: fondo reducido — el frente de acero aterriza exactamente en
   el plano del mueble (cota 60 cm) y solo las jaladeras sobresalen. */
function CounterDepth() {
  return (
    <svg viewBox="0 -14 220 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <Escena />
      <Alacena frente={122} />
      <g className="cin-fridge">
        <rect x="32" y="40" width="90" height="98" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
        {/* cepillado del frente + línea de cajón; jaladeras que sí sobresalen */}
        <line x1="116" y1="46" x2="116" y2="132" stroke={MUTED} strokeWidth="1" />
        <line x1="112" y1="102" x2="122" y2="102" stroke={MUTED} strokeWidth="1" />
        <rect x="122" y="54" width="4" height="22" rx="2" fill={STROKE} />
        <rect x="122" y="108" width="4" height="14" rx="2" fill={STROKE} />
      </g>
      {/* remate: cota de fondo reducido + plano de alineación */}
      <g className="cin-gold">
        <line x1="122" y1="8" x2="122" y2="138" stroke={GOLD} strokeWidth="1.5" />
        <Cota x1={30} x2={122} y={26} />
        <Etiqueta x={172} y={14}>
          AL RAS
        </Etiqueta>
        {/* la cifra vive dentro del cuerpo de la alacena, libre de sus bordes */}
        <Etiqueta x={76} y={22.5}>
          60 cm
        </Etiqueta>
      </g>
    </svg>
  );
}

/* Empotrado: entra al nicho con holgura de ventilación al fondo y un panel de
   carpintería lo cubre — un solo plano continuo con el mueble. */
function Empotrado() {
  return (
    <svg viewBox="0 -14 220 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <Escena />
      <Alacena frente={122} />
      <g className="cin-fridge">
        <rect x="38" y="40" width="80" height="98" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
        {/* holgura de ventilación contra el muro (flechitas de plano) */}
        <g stroke={MUTED} strokeWidth="1" fill="none">
          <line x1="31.5" y1="64" x2="37" y2="64" />
          <path d="M33.5 62 31.5 64l2 2" />
          <path d="M35 62 37 64l-2 2" />
        </g>
      </g>
      {/* panel de carpintería: llega al final y cubre el frente */}
      <g className="cin-panel">
        <rect x="118" y="40" width="4" height="98" fill={GREIGE} stroke={STROKE} strokeWidth="1.25" />
        <rect x="124" y="56" width="3.5" height="24" rx="1.75" fill={STROKE} />
      </g>
      <g className="cin-gold">
        <line x1="122" y1="8" x2="122" y2="138" stroke={GOLD} strokeWidth="1.5" />
        <Etiqueta x={168} y={26}>
          TRAS PANEL
        </Etiqueta>
      </g>
    </svg>
  );
}

/* --- Parrillas (referencias dimensionales ZLINE aprobadas 2026-08-03) ------
   Aquí el corte es la CUBIERTA: gabinete bajo + losa de cubierta, y la
   parrilla CAE desde arriba a su posición (.cin-drop). La diferencia entre
   tipos es cuánto cuerpo queda sobre el plano de la cubierta. */

/** Gabinete bajo + losa de cubierta + piso: escena de las parrillas.
    `corte` = [x1, x2] parte la losa en dos (el hueco donde cae el empotre). */
function EscenaCubierta({ corte }: { corte?: [number, number] }) {
  return (
    <g fill="none" strokeLinecap="round">
      <line className="cin-line" x1="12" y1="138" x2="208" y2="138" stroke={STROKE} strokeWidth="1.5" />
      <g stroke={MUTED} strokeWidth="1">
        <line className="cin-line" x1="60" y1="138" x2="52" y2="146" />
        <line className="cin-line" x1="110" y1="138" x2="102" y2="146" />
        <line className="cin-line" x1="160" y1="138" x2="152" y2="146" />
      </g>
      <rect className="cin-line" x="40" y="92" width="140" height="46" fill={GREIGE} stroke={STROKE} strokeWidth="1.25" />
      {corte ? (
        <>
          <rect className="cin-line" x="32" y="86" width={corte[0] - 32} height="6" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
          <rect className="cin-line" x={corte[1]} y="86" width={188 - corte[1]} height="6" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
        </>
      ) : (
        <rect className="cin-line" x="32" y="86" width="156" height="6" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
      )}
    </g>
  );
}

/** Cota vertical estilo plano: línea con rayitas terminales horizontales. */
function CotaV({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 3.5} y1={y1} x2={x + 3.5} y2={y1} />
      <line x1={x - 3.5} y1={y2} x2={x + 3.5} y2={y2} />
    </g>
  );
}

/* Profesional (rangetop): EMPOTRADA — el cuerpo cae dentro del corte de la
   cubierta (referencia Wolf) y solo asoman las rejillas y el panel de
   perillas al frente, sobre el gabinete. */
function Profesional() {
  return (
    <svg viewBox="0 -14 220 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <EscenaCubierta corte={[64, 156]} />
      <g className="cin-drop">
        {/* rejillas continuas arriba */}
        <g fill="none" stroke={STROKE} strokeWidth="1.25">
          <rect x="70" y="68" width="16" height="6" />
          <rect x="102" y="68" width="16" height="6" />
          <rect x="134" y="68" width="16" height="6" />
        </g>
        {/* cuerpo en el corte: la mitad asoma, el panel baja frente al gabinete */}
        <rect x="64" y="74" width="92" height="30" fill={BLANCO} stroke={STROKE} strokeWidth="1.5" />
        {/* perillas AL FRENTE — la firma del rangetop profesional */}
        <g fill="none" stroke={STROKE} strokeWidth="1.25">
          <circle cx="78" cy="95" r="2.6" />
          <circle cx="96" cy="95" r="2.6" />
          <circle cx="124" cy="95" r="2.6" />
          <circle cx="142" cy="95" r="2.6" />
        </g>
      </g>
      <g className="cin-gold">
        <CotaV x={172} y1={74} y2={104} />
        <Etiqueta x={110} y={-2}>
          EMPOTRADA
        </Etiqueta>
      </g>
    </svg>
  );
}

/* Tradicional (empotre): cae al corte de la cubierta y queda al ras;
   solo rejillas y perillas asoman sobre el plano. */
function Tradicional() {
  return (
    <svg viewBox="0 -14 220 164" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <EscenaCubierta />
      <g className="cin-drop">
        {/* rejillas sobre el marco */}
        <g fill="none" stroke={STROKE} strokeWidth="1.25">
          <rect x="70" y="74" width="16" height="5" />
          <rect x="102" y="74" width="16" height="5" />
          <rect x="134" y="74" width="16" height="5" />
        </g>
        {/* perillas ARRIBA, sobre el marco */}
        <rect x="126" y="79" width="4" height="2" fill={STROKE} />
        <rect x="146" y="79" width="4" height="2" fill={STROKE} />
        {/* marco al ras + cuerpo de empotre (8 cm) dentro del gabinete */}
        <rect x="62" y="81" width="96" height="5" fill={BLANCO} stroke={STROKE} strokeWidth="1.25" />
        <rect x="68" y="86" width="84" height="12" fill={BLANCO} stroke={STROKE} strokeWidth="1.25" />
      </g>
      <g className="cin-gold">
        {/* plano de la cubierta: el marco aterriza al ras */}
        <line x1="32" y1="86" x2="188" y2="86" stroke={GOLD} strokeWidth="1.5" />
        <CotaV x={168} y1={86} y2={98} />
        <Etiqueta x={110} y={-2}>
          SOBRE CUBIERTA
        </Etiqueta>
      </g>
    </svg>
  );
}

export default function CorteInstalacion({ tipo }: { tipo: TipoInstalacion }) {
  if (tipo === "de-piso") return <DePiso />;
  if (tipo === "counter-depth") return <CounterDepth />;
  if (tipo === "profesional") return <Profesional />;
  if (tipo === "tradicional") return <Tradicional />;
  return <Empotrado />;
}
