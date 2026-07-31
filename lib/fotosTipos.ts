// Fotos reales de los tipos (subcat.3) en el mosaico del PLP — decisión Carla
// (2026-07-31): en PRODUCTOS la tarjeta lleva packshot real; el diagrama de
// línea se queda en Guías, donde su función es didáctica.
//
// Reglas del set (ver conversación/PLAN): packshot frontal sobre blanco, misma
// altura visual, sin logos legibles a tamaño de tile, nombre de archivo SEO,
// assets oficiales de marcas que distribuimos. Para tipos "espaciales"
// (empotrado, counter depth, invisible) la foto debe ser en contexto.
//
// Clave exterior: `<macro>/<sub1>/<tipo>` (la misma de FILTROS_PLP);
// clave interior: slug del filtro (?f=…). Tipo sin foto → cae al diagrama.

export interface FotoTipo {
  src: string;
  alt: string;
}

export const FOTOS_TIPOS: Record<string, Record<string, FotoTipo>> = {
  "cocina-y-bar/refrigeracion/refrigeradores": {
    parejas: {
      src: "/assets/photos/tipos/refrigerador-parejas-columnas-acero.jpg",
      alt: "Pareja de columnas de refrigerador y congelador en acero inoxidable",
    },
    columna: {
      src: "/assets/photos/tipos/refrigerador-columna-empotrable-interior.webp",
      alt: "Columna de refrigeración empotrable con puerta abierta e interior iluminado",
    },
    "duplex-side-by-side": {
      src: "/assets/photos/tipos/refrigerador-duplex-side-by-side-acero.jpg",
      alt: "Refrigerador duplex side-by-side de dos puertas verticales en acero",
    },
    "5-puertas": {
      src: "/assets/photos/tipos/refrigerador-5-puertas-acero.webp",
      alt: "Refrigerador French Door de 5 puertas en acero inoxidable",
    },
    "bajo-cubierta": {
      src: "/assets/photos/tipos/refrigerador-bajo-cubierta-acero.webp",
      alt: "Refrigerador bajo cubierta de acero inoxidable para bar o isla",
    },
    "french-door": {
      src: "/assets/photos/tipos/refrigerador-french-door-acero.jpg",
      alt: "Refrigerador French Door de acero con dos puertas y cajón congelador",
    },
    "de-piso": {
      src: "/assets/photos/tipos/refrigerador-de-piso-french-door.jpg",
      alt: "Refrigerador French Door de instalación libre con despachador",
    },
    "counter-depth": {
      src: "/assets/photos/tipos/refrigerador-counter-depth-al-ras.jpg",
      alt: "Refrigerador de fondo reducido al ras de la carpintería en cocina premium",
    },
    empotrado: {
      src: "/assets/photos/tipos/refrigerador-empotrado-panelable.jpg",
      alt: "Refrigerador panelable integrado por completo en la carpintería",
    },
    "1-puerta": {
      src: "/assets/photos/tipos/refrigerador-1-puerta-retro.jpg",
      alt: "Refrigerador retro de una puerta en color claro",
    },
    "glass-door": {
      src: "/assets/photos/tipos/refrigerador-glass-door-cava.png",
      alt: "Refrigerador con puerta de cristal e interior iluminado",
    },
    "top-mount": {
      src: "/assets/photos/tipos/refrigerador-top-mount-acero.jpg",
      alt: "Refrigerador top mount de acero con congelador superior",
    },
  },

  "cocina-y-bar/coccion/parrillas": {
    gas: {
      src: "/assets/photos/tipos/parrilla-gas-quemadores-laton.png",
      alt: "Parrilla de gas empotrable con quemadores de latón y rejillas de hierro",
    },
    submontar: {
      src: "/assets/photos/tipos/parrilla-submontar-quemadores-piedra.jpg",
      alt: "Quemadores individuales submontados directamente en cubierta de piedra",
    },
    invisible: {
      src: "/assets/photos/tipos/parrilla-invisible-induccion-bajo-piedra.jpg",
      alt: "Olla hirviendo directamente sobre cubierta de piedra con inducción invisible",
    },
    "induccion-con-sistema-de-extraccion": {
      src: "/assets/photos/tipos/parrilla-induccion-extraccion-integrada.jpg",
      alt: "Parrilla de inducción con extracción descendente integrada al centro",
    },
    profesional: {
      src: "/assets/photos/tipos/parrilla-profesional-rangetop-perillas.jpg",
      alt: "Rangetop profesional de acero con rejillas continuas y perillas al frente",
    },
    tradicional: {
      src: "/assets/photos/tipos/parrilla-tradicional-empotre-gas.jpg",
      alt: "Parrilla de gas de empotre con marco de acero asentada en la cubierta",
    },
    vitroceramica: {
      src: "/assets/photos/tipos/parrilla-vitroceramica-radiante.jpg",
      alt: "Parrilla vitrocerámica de cristal negro con zonas radiantes",
    },
    induccion: {
      src: "/assets/photos/tipos/parrilla-induccion-cristal-negro.jpg",
      alt: "Parrilla de inducción de cristal negro con sartén y teppanyaki",
    },
    modulares: {
      src: "/assets/photos/tipos/parrilla-modulares-vario.jpg",
      alt: "Módulos dominó combinados en línea: gas, teppan y extracción",
    },
  },
};

export function getFotoTipo(plpKey: string, slug: string): FotoTipo | undefined {
  return FOTOS_TIPOS[plpKey]?.[slug];
}
