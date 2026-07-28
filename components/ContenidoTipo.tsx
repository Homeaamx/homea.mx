// ContenidoTipo — capa extra del mosaico del PLP (solo PRODUCTOS, no Guías),
// dentro del mismo <svg> del diagrama:
//
//   .cnt    Contenido que EXPLICA el tipo: lo que ese formato resuelve —botellas
//           de pie en Columna, charola ancha en French Door, cajón flex en
//           4 puertas, botellas acostadas en Glass Door. Aparece con el interior.
// Colores por clase en styles/guias.css (--dgm-*), como el resto de los diagramas.

/** Charola/repisa ancha con producto encima. */
function Charola({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <>
      <rect className="pieza" x={x} y={y - 5} width={w} height={5} rx="1" />
      <line className="canto" x1={x} y1={y} x2={x + w} y2={y} />
    </>
  );
}

/** Botella de pie (cuerpo + cuello). */
function Botella({ x, y, h = 14 }: { x: number; y: number; h?: number }) {
  return (
    <>
      <rect className="pieza" x={x} y={y - h + 4} width="5" height={h - 4} rx="1.5" />
      <rect className="pieza" x={x + 1.6} y={y - h} width="1.8" height="4" />
    </>
  );
}

/** Botella acostada (cava / centro de bebida). */
function BotellaAcostada({ x, y, w = 26 }: { x: number; y: number; w?: number }) {
  return (
    <>
      <rect className="pieza" x={x} y={y} width={w - 5} height="4" rx="2" />
      <rect className="pieza" x={x + w - 5} y={y + 1} width="5" height="2" />
    </>
  );
}

/** Cajón de frescos: bandeja translúcida. */
function Cajon({ x, y, w, h = 9 }: { x: number; y: number; w: number; h?: number }) {
  return <rect className="bandeja" x={x} y={y} width={w} height={h} rx="1.5" />;
}

const CONTENIDO: Record<string, JSX.Element> = {
  // ——— Instalación ———
  "de-piso": (
    <>
      <Charola x={52} y={44} w={36} />
      <Cajon x={50} y={88} w={40} />
    </>
  ),
  empotrado: (
    <>
      <Charola x={52} y={48} w={36} />
      <Charola x={52} y={74} w={36} />
      <Cajon x={50} y={96} w={40} />
    </>
  ),
  "counter-depth": (
    <>
      <Charola x={52} y={42} w={36} />
      <Cajon x={50} y={90} w={40} />
    </>
  ),

  // ——— Diseño ———
  // Parejas: una torre refrigera (botellas), la otra congela (paquetes apilados).
  parejas: (
    <>
      <Botella x={30} y={52} />
      <Botella x={38} y={52} />
      <rect className="bandeja" x={80} y={44} width={26} height="8" rx="1.5" />
      <rect className="bandeja" x={80} y={58} width={26} height="8" rx="1.5" />
    </>
  ),
  // French Door: la charola completa que cabe de lado a lado es su argumento.
  "french-door": (
    <>
      <Charola x={50} y={46} w={40} />
      <Charola x={50} y={68} w={40} />
      <rect className="bandeja" x={49} y={88} width={42} height="10" rx="1.5" />
    </>
  ),
  // Duplex: congelador de piso a techo a la izquierda, fresco a la derecha.
  duplex: (
    <>
      <rect className="bandeja" x={48} y={40} width={16} height="7" rx="1.5" />
      <rect className="bandeja" x={48} y={54} width={16} height="7" rx="1.5" />
      <rect className="bandeja" x={48} y={68} width={16} height="7" rx="1.5" />
      <Botella x={74} y={50} />
      <Botella x={82} y={50} />
      <Cajon x={72} y={84} w={20} />
    </>
  ),
  // Bottom Mount: lo de diario arriba, a la altura de la mano.
  "bottom-mount": (
    <>
      <Charola x={52} y={44} w={36} />
      <Botella x={56} y={64} />
      <Botella x={64} y={64} />
      <Cajon x={50} y={92} w={40} />
    </>
  ),
  "top-mount": (
    <>
      <rect className="bandeja" x={50} y={30} width={40} height="8" rx="1.5" />
      <Charola x={52} y={68} w={36} />
      <Cajon x={50} y={96} w={40} />
    </>
  ),
  // Columna: torre dedicada — todo el alto para botellas y charolas.
  columna: (
    <>
      <Botella x={56} y={40} />
      <Botella x={64} y={40} />
      <Botella x={72} y={40} />
      <Charola x={54} y={66} w={32} />
      <Cajon x={53} y={88} w={34} />
    </>
  ),
  // Glass Door: se exhibe — botellas acostadas, como una cava.
  "glass-door": (
    <>
      <BotellaAcostada x={54} y={38} />
      <BotellaAcostada x={54} y={50} />
      <BotellaAcostada x={54} y={62} />
      <BotellaAcostada x={54} y={74} />
    </>
  ),
  "una-puerta": (
    <>
      <Charola x={54} y={46} w={32} />
      <Botella x={58} y={68} />
      <Botella x={66} y={68} />
      <Cajon x={53} y={92} w={34} />
    </>
  ),
  // 4 puertas: la zona flex es LO que distingue al tipo → va resaltada.
  "cuatro-puertas": (
    <>
      <Charola x={50} y={44} w={40} />
      <rect className="flex" x={48} y={72} width={44} height="14" rx="1.5" />
      <Cajon x={50} y={96} w={40} />
    </>
  ),
  // 5 puertas: zonas independientes, cada una con su temperatura.
  "cinco-puertas": (
    <>
      <Charola x={50} y={40} w={40} />
      <rect className="flex" x={48} y={62} width={20} height="12" rx="1.5" />
      <rect className="bandeja" x={72} y={62} width={20} height="12" rx="1.5" />
      <Cajon x={50} y={92} w={40} />
    </>
  ),
  // Bajo cubierta: bar — botellas y latas al alcance.
  "bajo-cubierta": (
    <>
      <Botella x={54} y={104} h={12} />
      <Botella x={62} y={104} h={12} />
      <Botella x={70} y={104} h={12} />
    </>
  ),
};

export function ContenidoTipo({ tipo }: { tipo: string }) {
  const c = CONTENIDO[tipo];
  return c ? <g className="cnt">{c}</g> : null;
}
