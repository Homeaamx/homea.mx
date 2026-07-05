// FiltroDiagrama — biblioteca de diagramas técnicos de línea ("Planos de cocina")
// para las fichas de tipo de producto (FilterShowcase). Un SVG por `ficha.diagrama`.
//
// Anatomía compartida (el hover vive en styles/guias.css, scoped a .tfk-card):
//   .fb   cuerpo del aparato (fill bone, stroke espresso)
//   .dr   puerta (grupo): al hover colapsa hacia su bisagra → .hl (izq) / .hr (der)
//   .dw   cajón (grupo): al hover se desliza hacia abajo
//   .in   interior revelado (zonas oro champagne + repisas)
//   .fl   línea de piso · .cab muebles/entorno (trazo punteado)
//
// Cómo añadir una categoría nueva: docs/PATRON-FICHAS-TIPO.md
// Reglas de dibujo: viewBox 140×130, piso en y=124, trazos 1.5, sin color fuera
// de los tokens (los colores se asignan por clase en CSS, aquí solo estructura).

const DIAGRAMAS: Record<string, JSX.Element> = {
  // ——— Refrigeradores · por instalación ———————————————————————————

  "de-piso": (
    <>
      <line x1="24" y1="124" x2="116" y2="124" className="fl" />
      <rect x="44" y="18" width="52" height="106" className="fb" />
      <g className="in">
        <rect x="46" y="20" width="48" height="60" className="zone" />
        <line x1="52" y1="42" x2="88" y2="42" />
        <line x1="52" y1="62" x2="88" y2="62" />
        <rect x="46" y="84" width="48" height="38" className="zone" />
        <line x1="52" y1="103" x2="88" y2="103" />
      </g>
      <g className="dr hl">
        <rect x="44" y="18" width="52" height="64" />
        <line x1="90" y1="34" x2="90" y2="54" />
      </g>
      <g className="dw">
        <rect x="44" y="82" width="52" height="42" />
        <line x1="60" y1="96" x2="80" y2="96" />
      </g>
    </>
  ),

  empotrado: (
    <>
      <line x1="14" y1="124" x2="126" y2="124" className="fl" />
      <rect x="18" y="18" width="26" height="106" className="cab" />
      <rect x="96" y="18" width="26" height="106" className="cab" />
      <rect x="44" y="6" width="52" height="12" className="cab" />
      <rect x="44" y="18" width="52" height="106" className="fb" />
      <g className="in">
        <rect x="46" y="20" width="48" height="102" className="zone" />
        <line x1="52" y1="46" x2="88" y2="46" />
        <line x1="52" y1="72" x2="88" y2="72" />
        <line x1="52" y1="98" x2="88" y2="98" />
      </g>
      <g className="dr hl">
        <rect x="44" y="18" width="52" height="106" />
        <line x1="90" y1="52" x2="90" y2="78" />
      </g>
    </>
  ),

  columna: (
    <>
      <line x1="34" y1="124" x2="106" y2="124" className="fl" />
      <rect x="48" y="14" width="44" height="110" className="fb" />
      <g className="in">
        <rect x="50" y="16" width="40" height="106" className="zone" />
        <line x1="55" y1="38" x2="85" y2="38" />
        <line x1="55" y1="60" x2="85" y2="60" />
        <line x1="55" y1="82" x2="85" y2="82" />
        <line x1="55" y1="104" x2="85" y2="104" />
      </g>
      <g className="dr hl">
        <rect x="48" y="14" width="44" height="110" />
        <line x1="86" y1="48" x2="86" y2="76" />
      </g>
    </>
  ),

  parejas: (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="24" y="18" width="44" height="106" className="fb" />
      <rect x="72" y="18" width="44" height="106" className="fb" />
      <g className="in">
        <rect x="26" y="20" width="40" height="102" className="zone" />
        <line x1="31" y1="46" x2="61" y2="46" />
        <line x1="31" y1="72" x2="61" y2="72" />
        <line x1="31" y1="98" x2="61" y2="98" />
        <rect x="74" y="20" width="40" height="102" className="zone" />
        <line x1="79" y1="40" x2="109" y2="40" />
        <line x1="79" y1="60" x2="109" y2="60" />
        <line x1="79" y1="80" x2="109" y2="80" />
        <line x1="79" y1="100" x2="109" y2="100" />
      </g>
      <g className="dr hl">
        <rect x="24" y="18" width="44" height="106" />
        <line x1="61" y1="50" x2="61" y2="76" />
      </g>
      <g className="dr hr">
        <rect x="72" y="18" width="44" height="106" />
        <line x1="79" y1="50" x2="79" y2="76" />
      </g>
    </>
  ),

  "bajo-cubierta": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="24" width="108" height="8" className="fb" />
      <rect x="20" y="40" width="24" height="84" className="cab" />
      <rect x="96" y="40" width="24" height="84" className="cab" />
      <rect x="48" y="40" width="44" height="84" className="fb" />
      <g className="in">
        <rect x="50" y="42" width="40" height="80" className="zone" />
        <line x1="55" y1="68" x2="85" y2="68" />
        <line x1="55" y1="94" x2="85" y2="94" />
      </g>
      <g className="dr hl">
        <rect x="48" y="40" width="44" height="84" />
        <line x1="55" y1="48" x2="79" y2="48" />
      </g>
    </>
  ),

  // ——— Refrigeradores · por configuración de puertas ————————————————

  "french-door": (
    <>
      <line x1="24" y1="124" x2="116" y2="124" className="fl" />
      <rect x="34" y="18" width="72" height="106" className="fb" />
      <g className="in">
        <rect x="36" y="20" width="68" height="58" className="zone" />
        <line x1="42" y1="40" x2="98" y2="40" />
        <line x1="42" y1="59" x2="98" y2="59" />
        <rect x="36" y="82" width="68" height="40" className="zone" />
        <line x1="42" y1="102" x2="98" y2="102" />
      </g>
      <g className="dr hl">
        <rect x="34" y="18" width="36" height="62" />
        <line x1="65" y1="34" x2="65" y2="52" />
      </g>
      <g className="dr hr">
        <rect x="70" y="18" width="36" height="62" />
        <line x1="75" y1="34" x2="75" y2="52" />
      </g>
      <g className="dw">
        <rect x="34" y="80" width="72" height="44" />
        <line x1="58" y1="94" x2="82" y2="94" />
      </g>
    </>
  ),

  duplex: (
    <>
      <line x1="24" y1="124" x2="116" y2="124" className="fl" />
      <rect x="34" y="18" width="72" height="106" className="fb" />
      <g className="in">
        <rect x="36" y="20" width="33" height="102" className="zone" />
        <line x1="41" y1="46" x2="64" y2="46" />
        <line x1="41" y1="72" x2="64" y2="72" />
        <line x1="41" y1="98" x2="64" y2="98" />
        <rect x="71" y="20" width="33" height="102" className="zone" />
        <line x1="76" y1="40" x2="99" y2="40" />
        <line x1="76" y1="60" x2="99" y2="60" />
        <line x1="76" y1="80" x2="99" y2="80" />
        <line x1="76" y1="100" x2="99" y2="100" />
      </g>
      <g className="dr hl">
        <rect x="34" y="18" width="36" height="106" />
        <line x1="65" y1="52" x2="65" y2="74" />
      </g>
      <g className="dr hr">
        <rect x="70" y="18" width="36" height="106" />
        <line x1="75" y1="52" x2="75" y2="74" />
      </g>
    </>
  ),

  "bottom-mount": (
    <>
      <line x1="28" y1="124" x2="112" y2="124" className="fl" />
      <rect x="38" y="18" width="64" height="106" className="fb" />
      <g className="in">
        <rect x="40" y="20" width="60" height="60" className="zone" />
        <line x1="46" y1="40" x2="94" y2="40" />
        <line x1="46" y1="60" x2="94" y2="60" />
        <rect x="40" y="84" width="60" height="38" className="zone" />
        <line x1="46" y1="103" x2="94" y2="103" />
      </g>
      <g className="dr hl">
        <rect x="38" y="18" width="64" height="64" />
        <line x1="96" y1="36" x2="96" y2="56" />
      </g>
      <g className="dw">
        <rect x="38" y="82" width="64" height="42" />
        <line x1="58" y1="96" x2="82" y2="96" />
      </g>
    </>
  ),

  "top-mount": (
    <>
      <line x1="28" y1="124" x2="112" y2="124" className="fl" />
      <rect x="38" y="18" width="64" height="106" className="fb" />
      <g className="in">
        <rect x="40" y="20" width="60" height="32" className="zone" />
        <line x1="46" y1="36" x2="94" y2="36" />
        <rect x="40" y="56" width="60" height="66" className="zone" />
        <line x1="46" y1="78" x2="94" y2="78" />
        <line x1="46" y1="100" x2="94" y2="100" />
      </g>
      <g className="dr hl">
        <rect x="38" y="18" width="64" height="36" />
        <line x1="96" y1="27" x2="96" y2="45" />
      </g>
      <g className="dr hl">
        <rect x="38" y="54" width="64" height="70" />
        <line x1="96" y1="64" x2="96" y2="86" />
      </g>
    </>
  ),

  "glass-door": (
    <>
      <line x1="34" y1="124" x2="106" y2="124" className="fl" />
      <rect x="46" y="14" width="48" height="110" className="fb" />
      <g className="in">
        <rect x="48" y="16" width="44" height="106" className="zone" />
        <line x1="53" y1="42" x2="87" y2="42" />
        <line x1="53" y1="64" x2="87" y2="64" />
        <line x1="53" y1="86" x2="87" y2="86" />
        <line x1="53" y1="108" x2="87" y2="108" />
      </g>
      <g className="dr hl">
        <rect x="46" y="14" width="48" height="110" />
        <rect x="52" y="20" width="32" height="98" className="glass" />
        <line x1="58" y1="42" x2="78" y2="42" className="glass-shelf" />
        <line x1="58" y1="64" x2="78" y2="64" className="glass-shelf" />
        <line x1="58" y1="86" x2="78" y2="86" className="glass-shelf" />
        <line x1="89" y1="48" x2="89" y2="76" />
      </g>
    </>
  ),

  "cuatro-puertas": (
    <>
      <line x1="24" y1="124" x2="116" y2="124" className="fl" />
      <rect x="34" y="18" width="72" height="106" className="fb" />
      <g className="in">
        <rect x="36" y="20" width="68" height="52" className="zone" />
        <line x1="42" y1="40" x2="98" y2="40" />
        <line x1="42" y1="58" x2="98" y2="58" />
        <rect x="36" y="76" width="32" height="46" className="zone" />
        <rect x="72" y="76" width="32" height="46" className="zone" />
        <line x1="42" y1="99" x2="62" y2="99" />
        <line x1="78" y1="99" x2="98" y2="99" />
      </g>
      <g className="dr hl">
        <rect x="34" y="18" width="36" height="56" />
        <line x1="65" y1="32" x2="65" y2="50" />
      </g>
      <g className="dr hr">
        <rect x="70" y="18" width="36" height="56" />
        <line x1="75" y1="32" x2="75" y2="50" />
      </g>
      <g className="dw">
        <rect x="34" y="74" width="36" height="50" />
        <line x1="44" y1="88" x2="60" y2="88" />
      </g>
      <g className="dw">
        <rect x="70" y="74" width="36" height="50" />
        <line x1="80" y1="88" x2="96" y2="88" />
      </g>
    </>
  ),

  "cinco-puertas": (
    <>
      <line x1="24" y1="124" x2="116" y2="124" className="fl" />
      <rect x="34" y="18" width="72" height="106" className="fb" />
      <g className="in">
        <rect x="36" y="20" width="68" height="42" className="zone" />
        <line x1="42" y1="42" x2="98" y2="42" />
        <rect x="36" y="66" width="32" height="24" className="zone" />
        <rect x="72" y="66" width="32" height="24" className="zone" />
        <rect x="36" y="94" width="68" height="28" className="zone" />
        <line x1="42" y1="108" x2="98" y2="108" />
      </g>
      <g className="dr hl">
        <rect x="34" y="18" width="36" height="46" />
        <line x1="65" y1="30" x2="65" y2="46" />
      </g>
      <g className="dr hr">
        <rect x="70" y="18" width="36" height="46" />
        <line x1="75" y1="30" x2="75" y2="46" />
      </g>
      <g className="dw">
        <rect x="34" y="64" width="36" height="28" />
        <line x1="44" y1="76" x2="60" y2="76" />
      </g>
      <g className="dw">
        <rect x="70" y="64" width="36" height="28" />
        <line x1="80" y1="76" x2="96" y2="76" />
      </g>
      <g className="dw">
        <rect x="34" y="92" width="72" height="32" />
        <line x1="58" y1="106" x2="82" y2="106" />
      </g>
    </>
  ),

  // ——— Congeladores ————————————————————————————————————————————————

  "cong-horizontal": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="24" y="60" width="92" height="64" className="fb" />
      <g className="in">
        <rect x="26" y="62" width="88" height="60" className="zone" />
        <line x1="54" y1="66" x2="54" y2="118" />
        <line x1="86" y1="66" x2="86" y2="118" />
      </g>
      <g className="lid">
        <rect x="22" y="48" width="96" height="12" className="fb" />
        <line x1="62" y1="54" x2="78" y2="54" className="ln" />
      </g>
    </>
  ),

  // ——— Máquinas de hielo ———————————————————————————————————————————

  "hielo-empotrable": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="24" width="108" height="8" className="fb" />
      <rect x="20" y="40" width="24" height="84" className="cab" />
      <rect x="96" y="40" width="24" height="84" className="cab" />
      <rect x="48" y="40" width="44" height="84" className="fb" />
      <g className="in">
        <rect x="50" y="42" width="40" height="80" className="zone" />
        <circle cx="58" cy="96" r="3" className="ring" />
        <circle cx="70" cy="100" r="3" className="ring" />
        <circle cx="82" cy="96" r="3" className="ring" />
        <circle cx="64" cy="108" r="3" className="ring" />
        <circle cx="76" cy="110" r="3" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="48" y="40" width="44" height="84" />
        <line x1="55" y1="48" x2="79" y2="48" />
      </g>
    </>
  ),

  "hielo-de-piso": (
    <>
      <line x1="30" y1="124" x2="110" y2="124" className="fl" />
      <rect x="44" y="22" width="52" height="102" className="fb" />
      <g className="in">
        <rect x="46" y="24" width="48" height="98" className="zone" />
        <circle cx="58" cy="92" r="3" className="ring" />
        <circle cx="70" cy="98" r="3" className="ring" />
        <circle cx="82" cy="92" r="3" className="ring" />
        <circle cx="64" cy="108" r="3" className="ring" />
        <circle cx="78" cy="110" r="3" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="44" y="22" width="52" height="102" />
        <line x1="90" y1="52" x2="90" y2="76" />
      </g>
    </>
  ),

  "hielo-acero": (
    <>
      <line x1="30" y1="124" x2="110" y2="124" className="fl" />
      <rect x="44" y="30" width="52" height="94" className="fb" />
      <line x1="50" y1="118" x2="60" y2="118" className="glass-shelf" />
      <line x1="64" y1="118" x2="74" y2="118" className="glass-shelf" />
      <line x1="78" y1="118" x2="88" y2="118" className="glass-shelf" />
      <g className="in">
        <rect x="46" y="32" width="48" height="78" className="zone" />
        <circle cx="62" cy="90" r="3" className="ring" />
        <circle cx="76" cy="94" r="3" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="44" y="30" width="52" height="82" />
        <line x1="50" y1="38" x2="90" y2="38" />
      </g>
    </>
  ),

  "hielo-panelable": (
    <>
      <line x1="30" y1="124" x2="110" y2="124" className="fl" />
      <rect x="44" y="30" width="52" height="94" className="fb" />
      <g className="in">
        <rect x="46" y="32" width="48" height="90" className="zone" />
        <circle cx="62" cy="94" r="3" className="ring" />
        <circle cx="76" cy="100" r="3" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="44" y="30" width="52" height="94" />
        <rect x="50" y="38" width="40" height="78" className="cab" />
        <line x1="50" y1="34" x2="90" y2="34" />
      </g>
    </>
  ),

  // ——— Cavas de vino ———————————————————————————————————————————————

  "cava-acero": (
    <>
      <line x1="34" y1="124" x2="106" y2="124" className="fl" />
      <rect x="48" y="14" width="44" height="110" className="fb" />
      <g className="in">
        <rect x="50" y="16" width="40" height="106" className="zone" />
        <circle cx="60" cy="34" r="3.5" className="ring" />
        <circle cx="70" cy="34" r="3.5" className="ring" />
        <circle cx="80" cy="34" r="3.5" className="ring" />
        <circle cx="60" cy="58" r="3.5" className="ring" />
        <circle cx="70" cy="58" r="3.5" className="ring" />
        <circle cx="80" cy="58" r="3.5" className="ring" />
        <circle cx="60" cy="82" r="3.5" className="ring" />
        <circle cx="70" cy="82" r="3.5" className="ring" />
        <circle cx="80" cy="82" r="3.5" className="ring" />
        <circle cx="60" cy="106" r="3.5" className="ring" />
        <circle cx="70" cy="106" r="3.5" className="ring" />
        <circle cx="80" cy="106" r="3.5" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="48" y="14" width="44" height="110" />
        <line x1="86" y1="48" x2="86" y2="76" />
      </g>
    </>
  ),

  "cava-vidrio": (
    <>
      <line x1="34" y1="124" x2="106" y2="124" className="fl" />
      <rect x="48" y="14" width="44" height="110" className="fb" />
      <g className="in">
        <rect x="50" y="16" width="40" height="106" className="zone" />
        <circle cx="63" cy="40" r="3.5" className="ring" />
        <circle cx="77" cy="40" r="3.5" className="ring" />
        <circle cx="63" cy="68" r="3.5" className="ring" />
        <circle cx="77" cy="68" r="3.5" className="ring" />
        <circle cx="63" cy="96" r="3.5" className="ring" />
        <circle cx="77" cy="96" r="3.5" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="48" y="14" width="44" height="110" />
        <rect x="54" y="20" width="32" height="98" className="glass" />
        <circle cx="63" cy="40" r="3.5" className="glass" />
        <circle cx="77" cy="40" r="3.5" className="glass" />
        <circle cx="63" cy="68" r="3.5" className="glass" />
        <circle cx="77" cy="68" r="3.5" className="glass" />
        <circle cx="63" cy="96" r="3.5" className="glass" />
        <circle cx="77" cy="96" r="3.5" className="glass" />
        <line x1="89" y1="48" x2="89" y2="76" />
      </g>
    </>
  ),

  // ——— Cajones fríos ———————————————————————————————————————————————

  "cajones-refrigerantes": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="24" width="108" height="8" className="fb" />
      <rect x="20" y="40" width="20" height="84" className="cab" />
      <rect x="100" y="40" width="20" height="84" className="cab" />
      <g className="in">
        <rect x="46" y="42" width="48" height="38" className="zone" />
        <line x1="52" y1="62" x2="88" y2="62" />
        <rect x="46" y="84" width="48" height="38" className="zone" />
        <line x1="52" y1="104" x2="88" y2="104" />
      </g>
      <g className="dw">
        <rect x="44" y="40" width="52" height="40" />
        <line x1="60" y1="52" x2="80" y2="52" />
      </g>
      <g className="dw">
        <rect x="44" y="82" width="52" height="42" />
        <line x1="60" y1="94" x2="80" y2="94" />
      </g>
    </>
  ),

  "cajones-congeladores": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="24" width="108" height="8" className="fb" />
      <rect x="20" y="40" width="20" height="84" className="cab" />
      <rect x="100" y="40" width="20" height="84" className="cab" />
      <g className="in">
        <rect x="46" y="42" width="48" height="38" className="zone" />
        <circle cx="60" cy="62" r="3" className="ring" />
        <circle cx="72" cy="66" r="3" className="ring" />
        <circle cx="84" cy="62" r="3" className="ring" />
        <rect x="46" y="84" width="48" height="38" className="zone" />
        <circle cx="60" cy="106" r="3" className="ring" />
        <circle cx="72" cy="110" r="3" className="ring" />
        <circle cx="84" cy="106" r="3" className="ring" />
      </g>
      <g className="dw">
        <rect x="44" y="40" width="52" height="40" />
        <line x1="60" y1="52" x2="80" y2="52" />
      </g>
      <g className="dw">
        <rect x="44" y="82" width="52" height="42" />
        <line x1="60" y1="94" x2="80" y2="94" />
      </g>
    </>
  ),

  // ——— Estufas ————————————————————————————————————————————————————

  "estufa-profesional": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="28" y="44" width="84" height="72" className="fb" />
      <line x1="34" y1="116" x2="34" y2="124" className="ln" />
      <line x1="106" y1="116" x2="106" y2="124" className="ln" />
      <circle cx="45" cy="38" r="5" className="fb" />
      <circle cx="70" cy="38" r="5" className="fb" />
      <circle cx="95" cy="38" r="5" className="fb" />
      <circle cx="45" cy="52" r="2" className="glass" />
      <circle cx="58" cy="52" r="2" className="glass" />
      <circle cx="82" cy="52" r="2" className="glass" />
      <circle cx="95" cy="52" r="2" className="glass" />
      <g className="in">
        <rect x="34" y="64" width="72" height="48" className="zone" />
        <line x1="42" y1="84" x2="98" y2="84" />
        <line x1="42" y1="100" x2="98" y2="100" />
        <circle cx="45" cy="38" r="7" className="ring" />
        <circle cx="70" cy="38" r="7" className="ring" />
        <circle cx="95" cy="38" r="7" className="ring" />
      </g>
      <g className="dw">
        <rect x="32" y="62" width="76" height="52" />
        <line x1="44" y1="70" x2="96" y2="70" />
      </g>
    </>
  ),

  "estufa-empotre": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="18" y="48" width="22" height="76" className="cab" />
      <rect x="100" y="48" width="22" height="76" className="cab" />
      <line x1="18" y1="48" x2="40" y2="48" className="ln" />
      <line x1="100" y1="48" x2="122" y2="48" className="ln" />
      <rect x="40" y="48" width="60" height="76" className="fb" />
      <circle cx="56" cy="42" r="5" className="fb" />
      <circle cx="84" cy="42" r="5" className="fb" />
      <g className="in">
        <rect x="44" y="64" width="52" height="56" className="zone" />
        <line x1="50" y1="88" x2="90" y2="88" />
        <circle cx="56" cy="42" r="7" className="ring" />
        <circle cx="84" cy="42" r="7" className="ring" />
      </g>
      <g className="dw">
        <rect x="44" y="62" width="52" height="60" />
        <rect x="52" y="74" width="36" height="34" className="glass" />
        <line x1="52" y1="68" x2="88" y2="68" />
      </g>
    </>
  ),

  "estufa-de-piso": (
    <>
      <line x1="20" y1="124" x2="120" y2="124" className="fl" />
      <rect x="36" y="26" width="68" height="12" className="fb" />
      <rect x="36" y="46" width="68" height="78" className="fb" />
      <circle cx="52" cy="42" r="4" className="glass" />
      <circle cx="88" cy="42" r="4" className="glass" />
      <g className="in">
        <rect x="40" y="64" width="60" height="56" className="zone" />
        <line x1="48" y1="90" x2="92" y2="90" />
        <circle cx="52" cy="42" r="6" className="ring" />
        <circle cx="88" cy="42" r="6" className="ring" />
      </g>
      <g className="dw">
        <rect x="40" y="62" width="60" height="60" />
        <rect x="50" y="76" width="40" height="34" className="glass" />
        <line x1="50" y1="68" x2="90" y2="68" />
      </g>
    </>
  ),

  // ——— Parrillas (vista superior) ——————————————————————————————————

  "parrilla-tradicional": (
    <>
      <rect x="30" y="30" width="80" height="72" className="fb" />
      <circle cx="52" cy="52" r="10" className="fb" />
      <circle cx="88" cy="52" r="10" className="fb" />
      <circle cx="52" cy="82" r="10" className="fb" />
      <circle cx="88" cy="82" r="10" className="fb" />
      <g className="in">
        <circle cx="52" cy="52" r="10" className="ring" />
        <circle cx="88" cy="52" r="10" className="ring" />
        <circle cx="52" cy="82" r="10" className="ring" />
        <circle cx="88" cy="82" r="10" className="ring" />
      </g>
    </>
  ),

  "parrilla-profesional": (
    <>
      <rect x="22" y="26" width="96" height="80" className="fb" />
      <line x1="38" y1="26" x2="38" y2="106" className="glass" />
      <line x1="70" y1="26" x2="70" y2="106" className="glass" />
      <line x1="102" y1="26" x2="102" y2="106" className="glass" />
      <circle cx="46" cy="48" r="9" className="fb" />
      <circle cx="94" cy="48" r="9" className="fb" />
      <circle cx="46" cy="84" r="9" className="fb" />
      <circle cx="94" cy="84" r="9" className="fb" />
      <circle cx="70" cy="66" r="9" className="fb" />
      <g className="in">
        <circle cx="46" cy="48" r="9" className="ring" />
        <circle cx="94" cy="48" r="9" className="ring" />
        <circle cx="46" cy="84" r="9" className="ring" />
        <circle cx="94" cy="84" r="9" className="ring" />
        <circle cx="70" cy="66" r="9" className="ring" />
      </g>
    </>
  ),

  "parrilla-submontar": (
    <>
      <rect x="20" y="26" width="100" height="80" className="cab" />
      <circle cx="45" cy="66" r="12" className="fb" />
      <circle cx="70" cy="66" r="12" className="fb" />
      <circle cx="95" cy="66" r="12" className="fb" />
      <circle cx="45" cy="66" r="5" className="glass" />
      <circle cx="70" cy="66" r="5" className="glass" />
      <circle cx="95" cy="66" r="5" className="glass" />
      <g className="in">
        <circle cx="45" cy="66" r="12" className="ring" />
        <circle cx="70" cy="66" r="12" className="ring" />
        <circle cx="95" cy="66" r="12" className="ring" />
      </g>
    </>
  ),

  "parrilla-bajo-cubierta": (
    <>
      <rect x="24" y="28" width="92" height="76" className="fb" />
      <circle cx="52" cy="66" r="13" className="cab" />
      <circle cx="88" cy="66" r="13" className="cab" />
      <g className="in">
        <circle cx="52" cy="66" r="13" className="zone" />
        <circle cx="88" cy="66" r="13" className="zone" />
        <circle cx="52" cy="66" r="13" className="ring" />
        <circle cx="88" cy="66" r="13" className="ring" />
      </g>
    </>
  ),

  "parrilla-modular": (
    <>
      <rect x="30" y="32" width="36" height="68" className="fb" />
      <rect x="74" y="32" width="36" height="68" className="fb" />
      <circle cx="48" cy="52" r="9" className="fb" />
      <circle cx="48" cy="80" r="9" className="fb" />
      <rect x="82" y="44" width="20" height="18" className="glass" />
      <rect x="82" y="70" width="20" height="18" className="glass" />
      <g className="in">
        <circle cx="48" cy="52" r="9" className="ring" />
        <circle cx="48" cy="80" r="9" className="ring" />
        <rect x="82" y="44" width="20" height="18" className="zone" />
        <rect x="82" y="70" width="20" height="18" className="zone" />
      </g>
    </>
  ),

  "parrilla-hibrida": (
    <>
      <rect x="28" y="30" width="84" height="72" className="fb" />
      <line x1="70" y1="30" x2="70" y2="102" className="glass" />
      <circle cx="49" cy="50" r="9" className="fb" />
      <circle cx="49" cy="82" r="9" className="fb" />
      <rect x="80" y="42" width="20" height="18" className="glass" />
      <rect x="80" y="72" width="20" height="18" className="glass" />
      <g className="in">
        <circle cx="49" cy="50" r="9" className="ring" />
        <circle cx="49" cy="82" r="9" className="ring" />
        <rect x="80" y="42" width="20" height="18" className="zone" />
        <rect x="80" y="72" width="20" height="18" className="zone" />
      </g>
    </>
  ),

  "parrilla-campana": (
    <>
      <rect x="28" y="30" width="84" height="72" className="fb" />
      <rect x="63" y="34" width="14" height="64" className="fb" />
      <line x1="70" y1="40" x2="70" y2="92" className="glass" />
      <circle cx="46" cy="52" r="9" className="fb" />
      <circle cx="46" cy="82" r="9" className="fb" />
      <circle cx="95" cy="52" r="9" className="fb" />
      <circle cx="95" cy="82" r="9" className="fb" />
      <g className="in">
        <circle cx="46" cy="52" r="9" className="ring" />
        <circle cx="46" cy="82" r="9" className="ring" />
        <circle cx="95" cy="52" r="9" className="ring" />
        <circle cx="95" cy="82" r="9" className="ring" />
        <rect x="63" y="34" width="14" height="64" className="zone" />
      </g>
    </>
  ),

  // ——— Hornos —————————————————————————————————————————————————————

  "horno-conveccion": (
    <>
      <rect x="30" y="18" width="80" height="96" className="cab" />
      <rect x="38" y="26" width="64" height="80" className="fb" />
      <g className="in">
        <rect x="42" y="44" width="56" height="58" className="zone" />
        <circle cx="70" cy="72" r="10" className="ring" />
        <line x1="70" y1="62" x2="70" y2="82" />
        <line x1="60" y1="72" x2="80" y2="72" />
      </g>
      <g className="dw">
        <rect x="42" y="42" width="56" height="62" />
        <rect x="50" y="54" width="40" height="42" className="glass" />
        <circle cx="70" cy="75" r="10" className="glass" />
        <line x1="50" y1="48" x2="90" y2="48" />
      </g>
    </>
  ),

  "horno-vapor": (
    <>
      <rect x="30" y="18" width="80" height="96" className="cab" />
      <rect x="38" y="26" width="64" height="80" className="fb" />
      <g className="in">
        <rect x="42" y="44" width="56" height="58" className="zone" />
        <path d="M56 92 Q60 84 56 76 Q52 68 56 60" />
        <path d="M70 92 Q74 84 70 76 Q66 68 70 60" />
        <path d="M84 92 Q88 84 84 76 Q80 68 84 60" />
      </g>
      <g className="dw">
        <rect x="42" y="42" width="56" height="62" />
        <rect x="50" y="54" width="40" height="42" className="glass" />
        <path d="M62 90 Q66 82 62 74 Q58 66 62 58" className="glass" />
        <path d="M78 90 Q82 82 78 74 Q74 66 78 58" className="glass" />
        <line x1="50" y1="48" x2="90" y2="48" />
      </g>
    </>
  ),

  "horno-multifuncion": (
    <>
      <rect x="30" y="18" width="80" height="96" className="cab" />
      <rect x="38" y="26" width="64" height="80" className="fb" />
      <g className="in">
        <rect x="42" y="44" width="56" height="58" className="zone" />
        <circle cx="58" cy="74" r="8" className="ring" />
        <path d="M80 90 Q84 82 80 74 Q76 66 80 58" />
      </g>
      <g className="dw">
        <rect x="42" y="42" width="56" height="62" />
        <rect x="50" y="54" width="40" height="42" className="glass" />
        <circle cx="58" cy="76" r="8" className="glass" />
        <path d="M80 90 Q84 82 80 74 Q76 66 80 58" className="glass" />
        <line x1="50" y1="48" x2="90" y2="48" />
      </g>
    </>
  ),

  "horno-sencillo": (
    <>
      <rect x="30" y="18" width="80" height="96" className="cab" />
      <rect x="38" y="26" width="64" height="80" className="fb" />
      <circle cx="48" cy="34" r="2.5" className="glass" />
      <circle cx="92" cy="34" r="2.5" className="glass" />
      <g className="in">
        <rect x="42" y="46" width="56" height="56" className="zone" />
        <line x1="50" y1="68" x2="90" y2="68" />
        <line x1="50" y1="86" x2="90" y2="86" />
      </g>
      <g className="dw">
        <rect x="42" y="44" width="56" height="60" />
        <rect x="50" y="56" width="40" height="40" className="glass" />
        <line x1="50" y1="50" x2="90" y2="50" />
      </g>
    </>
  ),

  "horno-doble": (
    <>
      <rect x="30" y="10" width="80" height="112" className="cab" />
      <rect x="38" y="16" width="64" height="100" className="fb" />
      <g className="in">
        <rect x="42" y="20" width="56" height="42" className="zone" />
        <line x1="50" y1="42" x2="90" y2="42" />
        <rect x="42" y="70" width="56" height="42" className="zone" />
        <line x1="50" y1="92" x2="90" y2="92" />
      </g>
      <g className="dw">
        <rect x="42" y="18" width="56" height="46" />
        <rect x="50" y="30" width="40" height="28" className="glass" />
        <line x1="50" y1="24" x2="90" y2="24" />
      </g>
      <g className="dw">
        <rect x="42" y="68" width="56" height="46" />
        <rect x="50" y="80" width="40" height="28" className="glass" />
        <line x1="50" y1="74" x2="90" y2="74" />
      </g>
    </>
  ),

  "horno-french": (
    <>
      <rect x="26" y="18" width="88" height="96" className="cab" />
      <rect x="34" y="26" width="72" height="80" className="fb" />
      <g className="in">
        <rect x="38" y="30" width="64" height="72" className="zone" />
        <line x1="46" y1="58" x2="94" y2="58" />
        <line x1="46" y1="82" x2="94" y2="82" />
      </g>
      <g className="dr hl">
        <rect x="34" y="26" width="36" height="80" />
        <rect x="42" y="38" width="22" height="56" className="glass" />
        <line x1="66" y1="54" x2="66" y2="78" />
      </g>
      <g className="dr hr">
        <rect x="70" y="26" width="36" height="80" />
        <rect x="76" y="38" width="22" height="56" className="glass" />
        <line x1="74" y1="54" x2="74" y2="78" />
      </g>
    </>
  ),

  // ——— Microondas —————————————————————————————————————————————————

  "micro-mesa": (
    <>
      <line x1="16" y1="100" x2="124" y2="100" className="fl" />
      <rect x="30" y="56" width="80" height="44" className="fb" />
      <rect x="88" y="62" width="16" height="32" className="glass" />
      <line x1="92" y1="70" x2="100" y2="70" className="glass-shelf" />
      <line x1="92" y1="78" x2="100" y2="78" className="glass-shelf" />
      <circle cx="96" cy="88" r="2.5" className="glass" />
      <g className="in">
        <rect x="38" y="62" width="46" height="32" className="zone" />
        <line x1="44" y1="88" x2="78" y2="88" />
      </g>
      <g className="dr hl">
        <rect x="36" y="60" width="50" height="36" />
        <rect x="42" y="66" width="38" height="24" className="glass" />
        <line x1="82" y1="68" x2="82" y2="88" />
      </g>
    </>
  ),

  "micro-empotrable": (
    <>
      <rect x="22" y="36" width="96" height="60" className="cab" />
      <rect x="30" y="44" width="80" height="44" className="fb" />
      <rect x="90" y="50" width="14" height="32" className="glass" />
      <circle cx="97" cy="76" r="2.5" className="glass" />
      <g className="in">
        <rect x="36" y="50" width="48" height="32" className="zone" />
        <line x1="42" y1="76" x2="78" y2="76" />
      </g>
      <g className="dr hl">
        <rect x="34" y="48" width="52" height="36" />
        <rect x="40" y="54" width="40" height="24" className="glass" />
        <line x1="82" y1="56" x2="82" y2="76" />
      </g>
    </>
  ),

  "micro-multifuncion": (
    <>
      <rect x="22" y="36" width="96" height="60" className="cab" />
      <rect x="30" y="44" width="80" height="44" className="fb" />
      <rect x="90" y="50" width="14" height="32" className="glass" />
      <g className="in">
        <rect x="36" y="50" width="48" height="32" className="zone" />
        <circle cx="60" cy="66" r="8" className="ring" />
      </g>
      <g className="dr hl">
        <rect x="34" y="48" width="52" height="36" />
        <rect x="40" y="54" width="40" height="24" className="glass" />
        <circle cx="60" cy="66" r="8" className="glass" />
        <line x1="82" y1="56" x2="82" y2="76" />
      </g>
    </>
  ),

  "micro-campana": (
    <>
      <line x1="24" y1="112" x2="116" y2="112" className="ln" />
      <circle cx="56" cy="106" r="6" className="glass" />
      <circle cx="84" cy="106" r="6" className="glass" />
      <rect x="30" y="34" width="80" height="38" className="fb" />
      <line x1="38" y1="66" x2="50" y2="66" className="glass-shelf" />
      <line x1="56" y1="66" x2="68" y2="66" className="glass-shelf" />
      <line x1="74" y1="66" x2="86" y2="66" className="glass-shelf" />
      <g className="in">
        <rect x="36" y="40" width="46" height="24" className="zone" />
        <line x1="52" y1="100" x2="52" y2="80" strokeDasharray="3 4" />
        <line x1="70" y1="102" x2="70" y2="80" strokeDasharray="3 4" />
        <line x1="88" y1="100" x2="88" y2="80" strokeDasharray="3 4" />
      </g>
      <g className="dr hl">
        <rect x="34" y="38" width="50" height="28" />
        <rect x="40" y="43" width="38" height="18" className="glass" />
        <line x1="80" y1="44" x2="80" y2="60" />
      </g>
    </>
  ),

  "micro-cajon": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="30" width="108" height="8" className="fb" />
      <rect x="22" y="46" width="18" height="78" className="cab" />
      <rect x="100" y="46" width="18" height="78" className="cab" />
      <g className="in">
        <rect x="46" y="48" width="48" height="32" className="zone" />
        <line x1="52" y1="74" x2="88" y2="74" />
      </g>
      <g className="dw">
        <rect x="44" y="46" width="52" height="36" />
        <line x1="58" y1="58" x2="82" y2="58" />
        <line x1="52" y1="70" x2="88" y2="70" className="glass-shelf" />
      </g>
    </>
  ),

  "micro-trim": (
    <>
      <rect x="24" y="38" width="92" height="56" className="ln" />
      <rect x="32" y="46" width="76" height="40" className="fb" />
      <rect x="88" y="52" width="14" height="28" className="glass" />
      <g className="in">
        <rect x="38" y="52" width="44" height="28" className="zone" />
      </g>
      <g className="dr hl">
        <rect x="36" y="50" width="48" height="32" />
        <rect x="42" y="56" width="36" height="20" className="glass" />
        <line x1="80" y1="58" x2="80" y2="74" />
      </g>
    </>
  ),

  // ——— Campanas ————————————————————————————————————————————————————

  "camp-pared": (
    <>
      <rect x="60" y="14" width="20" height="34" className="fb" />
      <path d="M40 70 L100 70 L86 48 L54 48 Z" className="fb" />
      <line x1="24" y1="106" x2="116" y2="106" className="ln" />
      <circle cx="56" cy="100" r="6" className="glass" />
      <circle cx="84" cy="100" r="6" className="glass" />
      <g className="in">
        <line x1="54" y1="96" x2="58" y2="76" strokeDasharray="3 4" />
        <line x1="70" y1="98" x2="70" y2="76" strokeDasharray="3 4" />
        <line x1="86" y1="96" x2="82" y2="76" strokeDasharray="3 4" />
      </g>
    </>
  ),

  "camp-isla": (
    <>
      <line x1="20" y1="12" x2="120" y2="12" className="fl" />
      <rect x="62" y="12" width="16" height="28" className="fb" />
      <rect x="36" y="40" width="68" height="16" className="fb" />
      <rect x="30" y="100" width="80" height="8" className="fb" />
      <circle cx="58" cy="94" r="6" className="glass" />
      <circle cx="82" cy="94" r="6" className="glass" />
      <g className="in">
        <line x1="56" y1="90" x2="60" y2="62" strokeDasharray="3 4" />
        <line x1="70" y1="92" x2="70" y2="62" strokeDasharray="3 4" />
        <line x1="84" y1="90" x2="80" y2="62" strokeDasharray="3 4" />
      </g>
    </>
  ),

  "camp-bajo-mueble": (
    <>
      <rect x="30" y="14" width="80" height="38" className="cab" />
      <rect x="34" y="54" width="72" height="12" className="fb" />
      <line x1="34" y1="60" x2="106" y2="60" className="glass-shelf" />
      <line x1="24" y1="108" x2="116" y2="108" className="ln" />
      <circle cx="56" cy="102" r="6" className="glass" />
      <circle cx="84" cy="102" r="6" className="glass" />
      <g className="in">
        <line x1="55" y1="98" x2="60" y2="72" strokeDasharray="3 4" />
        <line x1="70" y1="100" x2="70" y2="72" strokeDasharray="3 4" />
        <line x1="85" y1="98" x2="80" y2="72" strokeDasharray="3 4" />
      </g>
    </>
  ),

  "camp-techo": (
    <>
      <rect x="20" y="12" width="100" height="10" className="fb" />
      <rect x="44" y="22" width="52" height="8" className="fb" />
      <line x1="52" y1="26" x2="60" y2="26" className="glass-shelf" />
      <line x1="66" y1="26" x2="74" y2="26" className="glass-shelf" />
      <line x1="80" y1="26" x2="88" y2="26" className="glass-shelf" />
      <rect x="30" y="102" width="80" height="8" className="fb" />
      <circle cx="58" cy="96" r="6" className="glass" />
      <circle cx="82" cy="96" r="6" className="glass" />
      <g className="in">
        <line x1="56" y1="92" x2="62" y2="36" strokeDasharray="3 4" />
        <line x1="70" y1="94" x2="70" y2="36" strokeDasharray="3 4" />
        <line x1="84" y1="92" x2="78" y2="36" strokeDasharray="3 4" />
      </g>
    </>
  ),

  "camp-decorativa": (
    <>
      <line x1="20" y1="12" x2="120" y2="12" className="fl" />
      <line x1="70" y1="12" x2="70" y2="28" className="ln" />
      <rect x="52" y="28" width="36" height="36" className="fb" />
      <line x1="52" y1="56" x2="88" y2="56" className="glass-shelf" />
      <line x1="24" y1="108" x2="116" y2="108" className="ln" />
      <circle cx="58" cy="102" r="6" className="glass" />
      <circle cx="82" cy="102" r="6" className="glass" />
      <g className="in">
        <circle cx="70" cy="46" r="12" className="ring" />
        <line x1="58" y1="98" x2="64" y2="70" strokeDasharray="3 4" />
        <line x1="82" y1="98" x2="76" y2="70" strokeDasharray="3 4" />
      </g>
    </>
  ),

  "camp-retractil": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="24" y="78" width="92" height="8" className="fb" />
      <rect x="28" y="86" width="84" height="38" className="cab" />
      <circle cx="46" cy="72" r="6" className="glass" />
      <circle cx="64" cy="72" r="6" className="glass" />
      <g className="lid">
        <rect x="82" y="46" width="26" height="32" className="fb" />
        <line x1="86" y1="52" x2="104" y2="52" className="glass-shelf" />
        <line x1="86" y1="58" x2="104" y2="58" className="glass-shelf" />
      </g>
      <g className="in">
        <line x1="50" y1="62" x2="78" y2="56" strokeDasharray="3 4" />
        <line x1="56" y1="70" x2="80" y2="66" strokeDasharray="3 4" />
      </g>
    </>
  ),

  // ——— Cafeteras ———————————————————————————————————————————————————

  "cafe-mesa": (
    <>
      <line x1="20" y1="106" x2="120" y2="106" className="fl" />
      <rect x="44" y="42" width="52" height="42" className="fb" />
      <line x1="44" y1="52" x2="96" y2="52" className="glass-shelf" />
      <rect x="62" y="84" width="16" height="8" className="fb" />
      <path d="M62 98 L78 98 L76 106 L64 106 Z" className="ln" />
      <g className="in">
        <rect x="64" y="99" width="12" height="6" className="zone" />
        <path d="M66 94 Q68 90 66 86" />
        <path d="M74 94 Q76 90 74 86" />
      </g>
    </>
  ),

  "cafe-empotre": (
    <>
      <rect x="26" y="24" width="88" height="84" className="cab" />
      <rect x="34" y="32" width="72" height="68" className="fb" />
      <line x1="34" y1="46" x2="106" y2="46" className="glass-shelf" />
      <rect x="60" y="52" width="20" height="10" className="fb" />
      <path d="M60 76 L80 76 L78 86 L62 86 Z" className="ln" />
      <line x1="42" y1="94" x2="98" y2="94" className="glass-shelf" />
      <g className="in">
        <rect x="62" y="77" width="16" height="8" className="zone" />
        <path d="M65 72 Q67 68 65 64" />
        <path d="M75 72 Q77 68 75 64" />
      </g>
    </>
  ),

  // ——— Cajones de cocción ——————————————————————————————————————————

  "cajon-caliente": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="34" width="108" height="8" className="fb" />
      <rect x="22" y="50" width="18" height="74" className="cab" />
      <rect x="100" y="50" width="18" height="74" className="cab" />
      <g className="in">
        <rect x="46" y="52" width="48" height="34" className="zone" />
        <path d="M56 80 Q58 74 56 68 Q54 62 56 58" />
        <path d="M70 80 Q72 74 70 68 Q68 62 70 58" />
        <path d="M84 80 Q86 74 84 68 Q82 62 84 58" />
      </g>
      <g className="dw">
        <rect x="44" y="50" width="52" height="38" />
        <line x1="58" y1="62" x2="82" y2="62" />
      </g>
    </>
  ),

  "cajon-vacio": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="16" y="34" width="108" height="8" className="fb" />
      <rect x="22" y="50" width="18" height="74" className="cab" />
      <rect x="100" y="50" width="18" height="74" className="cab" />
      <g className="in">
        <rect x="46" y="52" width="48" height="34" className="zone" />
        <circle cx="70" cy="68" r="8" className="ring" />
        <line x1="70" y1="68" x2="75" y2="63" />
      </g>
      <g className="dw">
        <rect x="44" y="50" width="52" height="38" />
        <line x1="58" y1="62" x2="82" y2="62" />
        <circle cx="70" cy="76" r="5" className="glass" />
      </g>
    </>
  ),

  // ——— Lavavajillas ————————————————————————————————————————————————

  "lava-controles-frente": (
    <>
      <line x1="26" y1="124" x2="114" y2="124" className="fl" />
      <rect x="40" y="24" width="60" height="100" className="fb" />
      <g className="in">
        <rect x="42" y="44" width="56" height="78" className="zone" />
        <line x1="50" y1="72" x2="90" y2="72" />
        <line x1="50" y1="98" x2="90" y2="98" />
      </g>
      <g className="dw">
        <rect x="40" y="42" width="60" height="82" />
        <line x1="48" y1="52" x2="92" y2="52" />
      </g>
      <rect x="40" y="24" width="60" height="18" className="fb" />
      <rect x="46" y="30" width="14" height="6" className="glass" />
      <circle cx="70" cy="33" r="2" className="glass" />
      <circle cx="78" cy="33" r="2" className="glass" />
      <circle cx="86" cy="33" r="2" className="glass" />
    </>
  ),

  "lava-controles-ocultos": (
    <>
      <line x1="26" y1="124" x2="114" y2="124" className="fl" />
      <rect x="40" y="24" width="60" height="100" className="fb" />
      <line x1="50" y1="28" x2="54" y2="28" className="glass-shelf" />
      <line x1="58" y1="28" x2="62" y2="28" className="glass-shelf" />
      <line x1="66" y1="28" x2="70" y2="28" className="glass-shelf" />
      <g className="in">
        <rect x="42" y="36" width="56" height="86" className="zone" />
        <line x1="50" y1="68" x2="90" y2="68" />
        <line x1="50" y1="96" x2="90" y2="96" />
      </g>
      <g className="dw">
        <rect x="40" y="34" width="60" height="90" />
        <line x1="48" y1="44" x2="92" y2="44" />
      </g>
    </>
  ),

  // ——— Tarjas ——————————————————————————————————————————————————————

  "tarja-sobreponer": (
    <>
      <line x1="16" y1="58" x2="124" y2="58" className="ln" />
      <rect x="44" y="52" width="52" height="6" className="fb" />
      <path d="M50 58 L50 88 Q50 94 56 94 L84 94 Q90 94 90 88 L90 58" className="ln" />
      <path d="M70 26 Q70 18 82 18 Q92 18 92 26" className="ln" />
      <line x1="70" y1="26" x2="70" y2="40" className="ln" />
      <g className="in">
        <rect x="53" y="68" width="34" height="23" className="zone" />
        <line x1="92" y1="28" x2="92" y2="52" strokeDasharray="3 3" />
      </g>
    </>
  ),

  "tarja-submontar": (
    <>
      <line x1="16" y1="58" x2="50" y2="58" className="ln" />
      <line x1="90" y1="58" x2="124" y2="58" className="ln" />
      <path d="M50 58 L50 88 Q50 94 56 94 L84 94 Q90 94 90 88 L90 58" className="ln" />
      <path d="M70 26 Q70 18 82 18 Q92 18 92 26" className="ln" />
      <line x1="70" y1="26" x2="70" y2="40" className="ln" />
      <g className="in">
        <rect x="53" y="68" width="34" height="23" className="zone" />
        <line x1="92" y1="28" x2="92" y2="52" strokeDasharray="3 3" />
      </g>
    </>
  ),

  "tarja-dual": (
    <>
      <line x1="16" y1="58" x2="44" y2="58" className="ln" />
      <line x1="90" y1="58" x2="124" y2="58" className="ln" />
      <rect x="44" y="52" width="26" height="6" className="fb" />
      <path d="M50 58 L50 88 Q50 94 56 94 L84 94 Q90 94 90 88 L90 58" className="ln" />
      <line x1="70" y1="58" x2="70" y2="94" className="cab" />
      <g className="in">
        <rect x="53" y="68" width="34" height="23" className="zone" />
      </g>
    </>
  ),

  "tarja-farmhouse": (
    <>
      <line x1="16" y1="50" x2="40" y2="50" className="ln" />
      <line x1="100" y1="50" x2="124" y2="50" className="ln" />
      <rect x="24" y="56" width="16" height="60" className="cab" />
      <rect x="100" y="56" width="16" height="60" className="cab" />
      <rect x="40" y="50" width="60" height="42" className="fb" />
      <path d="M70 26 Q70 18 82 18 Q92 18 92 26" className="ln" />
      <line x1="70" y1="26" x2="70" y2="42" className="ln" />
      <g className="in">
        <rect x="44" y="54" width="52" height="10" className="zone" />
        <line x1="92" y1="28" x2="92" y2="46" strokeDasharray="3 3" />
      </g>
    </>
  ),

  "tarja-1-tina": (
    <>
      <rect x="35" y="40" width="70" height="52" className="fb" />
      <rect x="41" y="46" width="58" height="40" className="ln" />
      <circle cx="70" cy="78" r="3" className="glass" />
      <g className="in">
        <rect x="43" y="48" width="54" height="36" className="zone" />
      </g>
    </>
  ),

  "tarja-2-tinas": (
    <>
      <rect x="28" y="40" width="84" height="52" className="fb" />
      <rect x="34" y="46" width="34" height="40" className="ln" />
      <rect x="72" y="46" width="34" height="40" className="ln" />
      <circle cx="51" cy="78" r="3" className="glass" />
      <circle cx="89" cy="78" r="3" className="glass" />
      <g className="in">
        <rect x="36" y="48" width="30" height="36" className="zone" />
        <rect x="74" y="48" width="30" height="36" className="zone" />
      </g>
    </>
  ),

  "tarja-3-tinas": (
    <>
      <rect x="22" y="40" width="96" height="52" className="fb" />
      <rect x="28" y="46" width="24" height="40" className="ln" />
      <rect x="58" y="46" width="24" height="40" className="ln" />
      <rect x="88" y="46" width="24" height="40" className="ln" />
      <circle cx="40" cy="78" r="3" className="glass" />
      <circle cx="70" cy="78" r="3" className="glass" />
      <circle cx="100" cy="78" r="3" className="glass" />
      <g className="in">
        <rect x="30" y="48" width="20" height="36" className="zone" />
        <rect x="60" y="48" width="20" height="36" className="zone" />
        <rect x="90" y="48" width="20" height="36" className="zone" />
      </g>
    </>
  ),

  // ——— Grifería ————————————————————————————————————————————————————

  "grif-monomando": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <rect x="58" y="94" width="14" height="10" className="fb" />
      <line x1="65" y1="94" x2="65" y2="60" className="ln" />
      <path d="M65 60 Q65 44 82 44 Q94 44 94 54" className="ln" />
      <line x1="56" y1="56" x2="70" y2="50" className="ln" />
      <g className="in">
        <path d="M94 56 Q92 74 94 92 Q96 98 94 100" />
        <circle cx="90" cy="102" r="1.5" className="ring" />
        <circle cx="98" cy="102" r="1.5" className="ring" />
      </g>
    </>
  ),

  "grif-mezcladora": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <line x1="65" y1="104" x2="65" y2="60" className="ln" />
      <path d="M65 60 Q65 44 82 44 Q94 44 94 54" className="ln" />
      <line x1="42" y1="96" x2="42" y2="104" className="ln" />
      <line x1="36" y1="96" x2="48" y2="96" className="ln" />
      <line x1="88" y1="96" x2="88" y2="104" className="ln" />
      <line x1="82" y1="96" x2="94" y2="96" className="ln" />
      <g className="in">
        <path d="M94 56 Q92 74 94 92 Q96 98 94 100" />
      </g>
    </>
  ),

  "grif-sencillo": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <rect x="58" y="96" width="12" height="8" className="fb" />
      <line x1="64" y1="96" x2="64" y2="44" className="ln" />
      <path d="M64 44 Q64 30 80 30 Q92 30 92 40" className="ln" />
      <g className="in">
        <path d="M92 42 Q90 70 92 96 Q94 100 92 102" />
      </g>
    </>
  ),

  "grif-extraible": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <rect x="58" y="96" width="12" height="8" className="fb" />
      <line x1="64" y1="96" x2="64" y2="44" className="ln" />
      <path d="M64 44 Q64 30 80 30 Q92 30 92 40" className="ln" />
      <rect x="88" y="40" width="8" height="14" className="fb" />
      <path d="M92 54 Q98 72 88 84 Q80 92 72 86" className="cab" />
      <g className="in">
        <path d="M92 56 Q91 74 92 96 Q94 100 92 102" />
      </g>
    </>
  ),

  "grif-profesional": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <rect x="56" y="96" width="14" height="8" className="fb" />
      <line x1="63" y1="96" x2="63" y2="38" className="ln" />
      <circle cx="63" cy="52" r="9" className="glass" />
      <circle cx="63" cy="64" r="9" className="glass" />
      <circle cx="63" cy="76" r="9" className="glass" />
      <path d="M63 38 Q63 28 76 28 Q88 28 90 40 L90 50" className="ln" />
      <g className="in">
        <path d="M90 52 Q89 74 90 96 Q92 100 90 102" />
      </g>
    </>
  ),

  "grif-inteligente": (
    <>
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <rect x="58" y="96" width="12" height="8" className="fb" />
      <line x1="64" y1="96" x2="64" y2="44" className="ln" />
      <path d="M64 44 Q64 30 80 30 Q92 30 92 40" className="ln" />
      <circle cx="64" cy="72" r="3" className="glass" />
      <path d="M52 66 Q48 72 52 78" className="glass" />
      <path d="M76 66 Q80 72 76 78" className="glass" />
      <g className="in">
        <circle cx="64" cy="72" r="6" className="ring" />
        <path d="M92 42 Q90 70 92 96 Q94 100 92 102" />
      </g>
    </>
  ),

  "grif-pared": (
    <>
      <line x1="36" y1="24" x2="36" y2="104" className="ln" />
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <line x1="36" y1="52" x2="78" y2="52" className="ln" />
      <path d="M78 52 Q86 52 86 60" className="ln" />
      <circle cx="52" cy="68" r="5" className="glass" />
      <g className="in">
        <path d="M86 62 Q84 82 86 98 Q88 102 86 103" />
      </g>
    </>
  ),

  "grif-techo": (
    <>
      <line x1="20" y1="14" x2="120" y2="14" className="fl" />
      <line x1="70" y1="14" x2="70" y2="50" className="ln" />
      <rect x="64" y="50" width="12" height="10" className="fb" />
      <line x1="24" y1="104" x2="116" y2="104" className="ln" />
      <g className="in">
        <path d="M70 62 Q68 82 70 98 Q72 102 70 103" />
        <circle cx="65" cy="102" r="1.5" className="ring" />
        <circle cx="75" cy="102" r="1.5" className="ring" />
      </g>
    </>
  ),

  "grif-potfiller": (
    <>
      <line x1="34" y1="20" x2="34" y2="110" className="ln" />
      <line x1="24" y1="110" x2="116" y2="110" className="ln" />
      <line x1="34" y1="48" x2="62" y2="56" className="ln" />
      <circle cx="64" cy="56" r="3" className="glass" />
      <line x1="66" y1="56" x2="94" y2="48" className="ln" />
      <line x1="94" y1="48" x2="94" y2="56" className="ln" />
      <rect x="80" y="94" width="28" height="16" className="ln" />
      <line x1="76" y1="94" x2="112" y2="94" className="ln" />
      <g className="in">
        <path d="M94 58 Q93 74 94 90" />
        <rect x="83" y="99" width="22" height="9" className="zone" />
      </g>
    </>
  ),

  // ——— Filtros de agua —————————————————————————————————————————————

  "filtro-osmosis": (
    <>
      <line x1="16" y1="30" x2="124" y2="30" className="ln" />
      <path d="M58 30 L58 42 Q58 46 62 46 L78 46 Q82 46 82 42 L82 30" className="glass" />
      <rect x="28" y="38" width="84" height="86" className="cab" />
      <rect x="38" y="72" width="42" height="11" className="fb" />
      <rect x="38" y="88" width="42" height="11" className="fb" />
      <rect x="88" y="66" width="18" height="34" className="fb" />
      <line x1="80" y1="77" x2="88" y2="77" className="ln" />
      <line x1="80" y1="93" x2="88" y2="93" className="ln" />
      <g className="in">
        <rect x="90" y="80" width="14" height="18" className="zone" />
        <path d="M97 64 L97 46 Q97 40 88 40" />
        <circle cx="70" cy="36" r="1.5" className="ring" />
      </g>
    </>
  ),

  "filtro-tanque": (
    <>
      <line x1="26" y1="118" x2="114" y2="118" className="fl" />
      <rect x="54" y="34" width="34" height="76" className="fb" />
      <rect x="60" y="26" width="22" height="8" className="fb" />
      <rect x="40" y="66" width="10" height="34" className="fb" />
      <line x1="50" y1="76" x2="54" y2="76" className="ln" />
      <line x1="50" y1="92" x2="54" y2="92" className="ln" />
      <line x1="54" y1="110" x2="54" y2="118" className="ln" />
      <line x1="88" y1="110" x2="88" y2="118" className="ln" />
      <g className="in">
        <rect x="56" y="70" width="30" height="38" className="zone" />
        <path d="M71 46 Q66 56 71 62 Q76 56 71 46" />
      </g>
    </>
  ),

  // ——— Asadores ————————————————————————————————————————————————————

  "asador-emp-gas": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="20" y="66" width="100" height="8" className="fb" />
      <rect x="26" y="74" width="88" height="50" className="cab" />
      <rect x="40" y="42" width="60" height="24" className="fb" />
      <line x1="48" y1="42" x2="48" y2="66" className="glass-shelf" />
      <line x1="60" y1="42" x2="60" y2="66" className="glass-shelf" />
      <line x1="72" y1="42" x2="72" y2="66" className="glass-shelf" />
      <line x1="84" y1="42" x2="84" y2="66" className="glass-shelf" />
      <g className="lid">
        <rect x="38" y="30" width="64" height="12" className="fb" />
        <line x1="62" y1="36" x2="78" y2="36" className="ln" />
      </g>
      <g className="in">
        <path d="M52 62 Q50 56 54 52 Q56 56 58 52 Q60 58 56 62" />
        <path d="M68 62 Q66 56 70 52 Q72 56 74 52 Q76 58 72 62" />
        <path d="M84 62 Q82 56 86 52 Q88 56 90 52 Q92 58 88 62" />
      </g>
    </>
  ),

  "asador-emp-carbon": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="20" y="66" width="100" height="8" className="fb" />
      <rect x="26" y="74" width="88" height="50" className="cab" />
      <rect x="40" y="42" width="60" height="24" className="fb" />
      <line x1="48" y1="42" x2="48" y2="66" className="glass-shelf" />
      <line x1="60" y1="42" x2="60" y2="66" className="glass-shelf" />
      <line x1="72" y1="42" x2="72" y2="66" className="glass-shelf" />
      <line x1="84" y1="42" x2="84" y2="66" className="glass-shelf" />
      <g className="lid">
        <rect x="38" y="30" width="64" height="12" className="fb" />
        <line x1="62" y1="36" x2="78" y2="36" className="ln" />
      </g>
      <g className="in">
        <circle cx="52" cy="60" r="3" className="zone" />
        <circle cx="62" cy="62" r="3" className="zone" />
        <circle cx="72" cy="60" r="3" className="zone" />
        <circle cx="82" cy="62" r="3" className="zone" />
        <circle cx="90" cy="60" r="3" className="zone" />
      </g>
    </>
  ),

  "asador-emp-mixto": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="20" y="66" width="100" height="8" className="fb" />
      <rect x="26" y="74" width="88" height="50" className="cab" />
      <rect x="40" y="42" width="60" height="24" className="fb" />
      <line x1="70" y1="42" x2="70" y2="66" className="ln" />
      <line x1="54" y1="42" x2="54" y2="66" className="glass-shelf" />
      <line x1="86" y1="42" x2="86" y2="66" className="glass-shelf" />
      <g className="lid">
        <rect x="38" y="30" width="64" height="12" className="fb" />
        <line x1="62" y1="36" x2="78" y2="36" className="ln" />
      </g>
      <g className="in">
        <path d="M52 62 Q50 56 54 52 Q56 56 58 52 Q60 58 56 62" />
        <circle cx="78" cy="60" r="3" className="zone" />
        <circle cx="88" cy="62" r="3" className="zone" />
        <circle cx="94" cy="59" r="3" className="zone" />
      </g>
    </>
  ),

  "asador-carro-gas": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="36" y="54" width="68" height="28" className="fb" />
      <line x1="44" y1="82" x2="44" y2="118" className="ln" />
      <line x1="96" y1="82" x2="96" y2="118" className="ln" />
      <circle cx="44" cy="118" r="6" className="fb" />
      <circle cx="96" cy="118" r="6" className="fb" />
      <line x1="104" y1="60" x2="120" y2="60" className="ln" />
      <g className="lid">
        <rect x="34" y="42" width="72" height="12" className="fb" />
        <line x1="60" y1="48" x2="80" y2="48" className="ln" />
      </g>
      <g className="in">
        <path d="M52 76 Q50 70 54 66 Q56 70 58 66 Q60 72 56 76" />
        <path d="M68 76 Q66 70 70 66 Q72 70 74 66 Q76 72 72 76" />
        <path d="M84 76 Q82 70 86 66 Q88 70 90 66 Q92 72 88 76" />
      </g>
    </>
  ),

  "asador-carro-carbon": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="36" y="54" width="68" height="28" className="fb" />
      <line x1="44" y1="82" x2="44" y2="118" className="ln" />
      <line x1="96" y1="82" x2="96" y2="118" className="ln" />
      <circle cx="44" cy="118" r="6" className="fb" />
      <circle cx="96" cy="118" r="6" className="fb" />
      <line x1="104" y1="60" x2="120" y2="60" className="ln" />
      <g className="lid">
        <rect x="34" y="42" width="72" height="12" className="fb" />
        <line x1="60" y1="48" x2="80" y2="48" className="ln" />
      </g>
      <g className="in">
        <circle cx="52" cy="74" r="3" className="zone" />
        <circle cx="62" cy="76" r="3" className="zone" />
        <circle cx="72" cy="74" r="3" className="zone" />
        <circle cx="82" cy="76" r="3" className="zone" />
        <circle cx="90" cy="74" r="3" className="zone" />
      </g>
    </>
  ),

  "asador-carro-mixto": (
    <>
      <line x1="16" y1="124" x2="124" y2="124" className="fl" />
      <rect x="36" y="54" width="68" height="28" className="fb" />
      <line x1="70" y1="54" x2="70" y2="82" className="ln" />
      <line x1="44" y1="82" x2="44" y2="118" className="ln" />
      <line x1="96" y1="82" x2="96" y2="118" className="ln" />
      <circle cx="44" cy="118" r="6" className="fb" />
      <circle cx="96" cy="118" r="6" className="fb" />
      <line x1="104" y1="60" x2="120" y2="60" className="ln" />
      <g className="lid">
        <rect x="34" y="42" width="72" height="12" className="fb" />
        <line x1="60" y1="48" x2="80" y2="48" className="ln" />
      </g>
      <g className="in">
        <path d="M52 76 Q50 70 54 66 Q56 70 58 66 Q60 72 56 76" />
        <circle cx="80" cy="74" r="3" className="zone" />
        <circle cx="90" cy="76" r="3" className="zone" />
      </g>
    </>
  ),

  // ——— Fallback ————————————————————————————————————————————————————

  generic: (
    <>
      <line x1="30" y1="124" x2="110" y2="124" className="fl" />
      <rect x="40" y="18" width="60" height="106" className="fb" />
      <g className="in">
        <rect x="42" y="20" width="56" height="102" className="zone" />
        <line x1="48" y1="52" x2="92" y2="52" />
        <line x1="48" y1="88" x2="92" y2="88" />
      </g>
      <g className="dr hl">
        <rect x="40" y="18" width="60" height="106" />
        <line x1="94" y1="52" x2="94" y2="76" />
      </g>
    </>
  ),
};

export default function FiltroDiagrama({ tipo }: { tipo: string }) {
  return (
    <svg viewBox="0 0 140 130" aria-hidden="true" focusable="false">
      {DIAGRAMAS[tipo] ?? DIAGRAMAS.generic}
    </svg>
  );
}
