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
      </defs>
    </svg>
  );
}
