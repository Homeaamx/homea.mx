// DiagramaDefs — degradados compartidos por todos los diagramas de tipo.
//
// Se renderiza UNA vez por página (lo montan FilterShowcase y TipoGrid) y los
// diagramas lo referencian con fill="url(#dgm-…)". Así el acero y la cavidad
// iluminada se definen en un solo lugar.
//
// Los colores NO viven aquí: cada <stop> lleva clase y su color se asigna en
// styles/guias.css con variables (--dgm-*), igual que el resto del sistema.
//
//   dgm-acero    puertas y cuerpo — acero inoxidable cepillado (bandas verticales)
//   dgm-cavidad  interior revelado — blanco iluminado arriba, frío abajo
//   dgm-vidrio   repisas de cristal — translúcido con canto brillante

export default function DiagramaDefs() {
  return (
    <svg className="dgm-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {/* Acero cepillado: las bandas alternadas son lo que lee como "inoxidable". */}
        <linearGradient id="dgm-acero" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" className="a1" />
          <stop offset="9%" className="a2" />
          <stop offset="22%" className="a3" />
          <stop offset="38%" className="a2" />
          <stop offset="52%" className="a4" />
          <stop offset="68%" className="a2" />
          <stop offset="84%" className="a3" />
          <stop offset="100%" className="a1" />
        </linearGradient>

        {/* Cavidad iluminada: el blanco de arriba es la luz LED del techo. */}
        <linearGradient id="dgm-cavidad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="c1" />
          <stop offset="18%" className="c2" />
          <stop offset="100%" className="c3" />
        </linearGradient>

        {/* Cristal negro (vitrocerámica / inducción): superficie oscura con un
            reflejo diagonal — es lo que separa una placa de vidrio de una de acero. */}
        <linearGradient id="dgm-negro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" className="n1" />
          <stop offset="42%" className="n1" />
          <stop offset="54%" className="n2" />
          <stop offset="66%" className="n1" />
          <stop offset="100%" className="n3" />
        </linearGradient>

        {/* Vitrina: lo que se ve A TRAVÉS del cristal — interior iluminado con
            tinte frío. Es lo que separa una puerta de cristal de una de acero. */}
        <linearGradient id="dgm-vitrina" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="t1" />
          <stop offset="45%" className="t2" />
          <stop offset="100%" className="t3" />
        </linearGradient>

        {/* Sombra interior: es lo que hace que la cavidad se lea como un hueco
            con paredes y no como un rectángulo blanco pegado encima. */}
        <filter id="dgm-hueco" x="-25%" y="-25%" width="150%" height="150%">
          <feOffset dx="0" dy="1.5" in="SourceAlpha" result="off" />
          <feGaussianBlur stdDeviation="2.2" in="off" result="blur" />
          <feComposite operator="out" in="SourceAlpha" in2="blur" result="hueco" />
          <feFlood className="sombra" result="tinta" />
          <feComposite operator="in" in="tinta" in2="hueco" result="sombra" />
          <feComposite operator="over" in="sombra" in2="SourceGraphic" />
        </filter>

        {/* Canto de cristal de las repisas. */}
        <linearGradient id="dgm-vidrio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="v1" />
          <stop offset="100%" className="v2" />
        </linearGradient>

        {/* ——— Ilustraciones en escena (IlustracionTipo) ——— */}
        {/* Muro espresso: más cálido arriba, donde cae la luz. */}
        <linearGradient id="ilus-pared" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--ilus-pared-2)" }} />
          <stop offset="100%" style={{ stopColor: "var(--ilus-pared-1)" }} />
        </linearGradient>
        {/* Halo de la luminaria sobre la carpintería. */}
        <radialGradient id="ilus-halo">
          <stop offset="0%" style={{ stopColor: "var(--homea-gold)", stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: "var(--homea-gold)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="ilus-sombra">
          <stop offset="0%" style={{ stopColor: "#000", stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: "#000", stopOpacity: 0 }} />
        </radialGradient>
        {/* Paredes laterales de la cavidad: oscurecen hacia el frente. */}
        <linearGradient id="ilus-lado-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--ilus-lado)" }} />
          <stop offset="100%" style={{ stopColor: "var(--dgm-frio)" }} />
        </linearGradient>
        <linearGradient id="ilus-lado-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--ilus-lado)" }} />
          <stop offset="100%" style={{ stopColor: "var(--dgm-frio)" }} />
        </linearGradient>
        <radialGradient id="ilus-led">
          <stop offset="0%" style={{ stopColor: "#fff", stopOpacity: 0.85 }} />
          <stop offset="100%" style={{ stopColor: "#fff", stopOpacity: 0 }} />
        </radialGradient>
        {/* Luz bajo alacena sobre el muro (escena baja). */}
        <linearGradient id="ilus-bajoluz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--homea-gold)", stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: "var(--homea-gold)", stopOpacity: 0 }} />
        </linearGradient>
        {/* ——— Escena realista (Tipo de instalación, Carla 2026-10-19) ——— */}
        {/* Nogal: ruido fractal estirado en vertical (vetas) mapeado a tonos de
            madera. Un solo mosaico del tamaño de la escena: la veta corre continua
            entre frentes, como una carpintería hecha de la misma chapa. */}
        <filter id="ilus-veta" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.11 0.0045" numOctaves="3" seed="11" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.19 0.29 0.37 0.47 0.40" />
            <feFuncG type="table" tableValues="0.10 0.16 0.21 0.28 0.23" />
            <feFuncB type="table" tableValues="0.04 0.07 0.10 0.14 0.11" />
          </feComponentTransfer>
        </filter>
        <pattern id="ilus-madera" patternUnits="userSpaceOnUse" width="560" height="400">
          <rect width="560" height="400" filter="url(#ilus-veta)" />
        </pattern>
        {/* Madera clara y limpia para el muro de listones (escenas de Diseño):
            veta más fina y tono roble/nogal claro, como las fotos Gaggenau. */}
        <filter id="ilus-veta-clara" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.16 0.006" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.33 0.40 0.46 0.52 0.47" />
            <feFuncG type="table" tableValues="0.21 0.26 0.30 0.34 0.31" />
            <feFuncB type="table" tableValues="0.13 0.16 0.19 0.22 0.20" />
          </feComponentTransfer>
        </filter>
        <pattern id="ilus-madera-clara" patternUnits="userSpaceOnUse" width="560" height="400">
          <rect width="560" height="400" filter="url(#ilus-veta-clara)" />
        </pattern>
        {/* Mármol oscuro del salpicadero, con vetas claras. */}
        <pattern id="ilus-marmol" patternUnits="userSpaceOnUse" width="560" height="400">
          <rect width="560" height="400" fill="#2A2420" />
          <g fill="none" stroke="#9C8A74" strokeOpacity="0.38" strokeWidth="0.8">
            <path d="M-10 168 C 60 150, 90 210, 160 196 S 260 160, 330 214 S 470 170, 570 226" />
            <path d="M20 236 C 70 200, 120 222, 180 178 S 300 230, 380 168 S 500 210, 570 160" />
            <path d="M-10 200 C 40 190, 110 160, 150 150" strokeOpacity="0.22" />
            <path d="M400 236 C 430 200, 470 196, 520 152" strokeOpacity="0.25" />
          </g>
          <path d="M-10 172 C 70 156, 96 212, 162 200 S 262 164, 334 218" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="0.5" />
        </pattern>
        {/* Latón cepillado de las jaladeras. */}
        <linearGradient id="ilus-laton" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6E5230" />
          <stop offset="45%" stopColor="#D8B57C" />
          <stop offset="100%" stopColor="#8F6C3F" />
        </linearGradient>
        {/* Cubierta de piedra y piso pulido. */}
        <linearGradient id="ilus-piedra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A5148" />
          <stop offset="100%" stopColor="#2B2520" />
        </linearGradient>
        <linearGradient id="ilus-piso-real" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A423A" />
          <stop offset="100%" stopColor="#1B1714" />
        </linearGradient>
        {/* Reflejo del aparato en el piso pulido. */}
        <linearGradient id="ilus-reflejo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Haz de luz cálida de las luminarias empotradas. */}
        <radialGradient id="ilus-cono" cx="0.5" cy="0" r="1" fx="0.5" fy="0">
          <stop offset="0%" stopColor="#FFD9A0" stopOpacity="0.3" />
          <stop offset="35%" stopColor="#FFD9A0" stopOpacity="0.1" />
          <stop offset="75%" stopColor="#FFD9A0" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FFD9A0" stopOpacity="0" />
        </radialGradient>
        {/* Cinta LED bajo alacena y bajo zoclo. */}
        <linearGradient id="ilus-cinta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC98A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFC98A" stopOpacity="0" />
        </linearGradient>
        {/* Modelado del acero: luz arriba, sombra abajo. */}
        <linearGradient id="ilus-acero-luz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        {/* Bandas oscuras del acero real (se suman a dgm-acero en la escena realista). */}
        <linearGradient id="ilus-acero-bandas" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.14" />
          <stop offset="18%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="36%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="78%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        {/* Jaladera cromada: brillo central que la separa del acero de la puerta. */}
        <linearGradient id="ilus-cromo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3E4449" />
          <stop offset="45%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#5E656B" />
        </linearGradient>
        <linearGradient id="ilus-cromo-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E4449" />
          <stop offset="45%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#5E656B" />
        </linearGradient>
        {/* Modelado de la carpintería: más cálida arriba, sombra al pie. */}
        <linearGradient id="ilus-modelado" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD9A0" stopOpacity="0.08" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        {/* Forro interior de la puerta. */}
        <linearGradient id="ilus-forro" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--ilus-forro-1)" }} />
          <stop offset="100%" style={{ stopColor: "var(--ilus-forro-2)" }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
