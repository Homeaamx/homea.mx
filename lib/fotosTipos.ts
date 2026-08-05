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
      src: "/assets/photos/tipos/refrigerador-columna-congelador-acero.png",
      alt: "Columna de refrigeración empotrable con frente de acero inoxidable",
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
      src: "/assets/photos/tipos/refrigerador-bajo-cubierta-cava-acero.jpg",
      alt: "Cava bajo cubierta de acero inoxidable con puerta de cristal para bar o isla",
    },
    "french-door": {
      src: "/assets/photos/tipos/refrigerador-french-door-empotrable-acero.jpg",
      alt: "Refrigerador French Door empotrable de acero con dos puertas y cajón congelador",
    },
    "bottom-mount": {
      src: "/assets/photos/tipos/refrigerador-bottom-mount-congelador-inferior-acero.jpg",
      alt: "Refrigerador bottom mount de acero con congelador inferior",
    },
    "4-puertas": {
      src: "/assets/photos/tipos/refrigerador-4-puertas-acero.jpg",
      alt: "Refrigerador de 4 puertas en acero inoxidable",
    },
    "de-piso": {
      src: "/assets/photos/tipos/refrigerador-de-piso-ge-profile-acero.jpg",
      alt: "Refrigerador de piso GE Profile en acero inoxidable, dúplex con puerta abierta",
    },
    "counter-depth": {
      src: "/assets/photos/tipos/refrigerador-counter-depth-french-door-al-ras.jpg",
      alt: "Refrigerador French Door de fondo reducido al ras de la carpintería de madera",
    },
    empotrado: {
      src: "/assets/photos/tipos/refrigerador-empotrado-panelable-blanco.jpg",
      alt: "Refrigerador empotrado panelable integrado a la carpintería blanca",
    },
    "1-puerta": {
      src: "/assets/photos/tipos/refrigerador-1-puerta-acero.webp",
      alt: "Refrigerador de una puerta en acero inoxidable",
    },
    "glass-door": {
      src: "/assets/photos/tipos/refrigerador-glass-door-puerta-cristal-acero.png",
      alt: "Refrigerador con puerta de cristal e interior iluminado",
    },
    "top-mount": {
      src: "/assets/photos/tipos/refrigerador-top-mount-congelador-superior-acero.jpg",
      alt: "Refrigerador top mount de acero con congelador superior",
    },
  },

  "cocina-y-bar/coccion/parrillas": {
    gas: {
      src: "/assets/photos/tipos/parrilla-gas-quemadores-laton.png",
      alt: "Parrilla de gas empotrable con quemadores de latón y rejillas de hierro",
    },
    submontar: {
      src: "/assets/photos/tipos/parrilla-submontar-quemadores-en-cubierta.jpg",
      alt: "Quemadores de gas individuales submontados en la cubierta, vistos desde arriba",
    },
    invisible: {
      src: "/assets/photos/tipos/parrilla-invisible-induccion-bajo-cubierta.jpg",
      alt: "Módulo de inducción invisible de cuatro zonas que se instala bajo la cubierta",
    },
    "induccion-con-sistema-de-extraccion": {
      src: "/assets/photos/tipos/parrilla-induccion-extraccion-downdraft-central.jpg",
      alt: "Parrilla de inducción con extracción descendente integrada al centro",
    },
    "hibrida-gas-induccion": {
      src: "/assets/photos/tipos/parrilla-hibrida-gas-induccion-cristal-negro.jpg",
      alt: "Parrilla híbrida de cristal negro con quemadores de gas encendidos y zonas de inducción",
    },
    profesional: {
      src: "/assets/photos/tipos/parrilla-profesional-rangetop-perillas-acero.jpg",
      alt: "Rangetop profesional de acero con rejillas continuas y perillas al frente",
    },
    tradicional: {
      src: "/assets/photos/tipos/parrilla-tradicional-empotre-cubierta.jpg",
      alt: "Parrilla de gas de empotre al ras de la cubierta con perillas arriba",
    },
    vitroceramica: {
      src: "/assets/photos/tipos/parrilla-vitroceramica-cristal-negro-5-zonas.jpg",
      alt: "Parrilla vitrocerámica de cristal negro con cinco zonas radiantes encendidas",
    },
    induccion: {
      src: "/assets/photos/tipos/parrilla-induccion-vista-superior-acero.jpg",
      alt: "Parrilla de inducción vista desde arriba con cinco zonas y controles al frente",
    },
    // Los tres módulos Vario montados a tope, en el mismo orden en que se
    // instalan en la cubierta: gas · grill · inducción.
    modulares: {
      src: "/assets/photos/tipos/parrilla-modulares-vario-gas-grill-induccion.jpg",
      alt: "Tres módulos dominó instalados en línea en la cubierta: gas, grill e inducción",
    },
  },

  // Campanas. Instalación = foto de ambiente en 3:4 (como refrigeradores),
  // porque lo que hay que entender es la relación con el espacio; diseño =
  // packshot sobre blanco. Origen: catálogo Artexa (Elica/Thermador) salvo
  // Bertazzoni, y las tres Falmec que aportó Carla.
  "cocina-y-bar/coccion/campanas": {
    "de-pared": {
      src: "/assets/photos/tipos/campana-de-pared-acero-sobre-parrilla.jpg",
      alt: "Campana de pared en acero inoxidable montada sobre una parrilla de gas",
    },
    "de-isla": {
      src: "/assets/photos/tipos/campana-de-isla-suspendida-piramidal.jpg",
      alt: "Campana de isla piramidal suspendida del techo sobre una isla de cocina",
    },
    rectas: {
      src: "/assets/photos/tipos/campana-recta-isla-acero-kuadra.webp",
      alt: "Campana recta de isla en acero inoxidable, prisma continuo sin quiebres",
    },
    "t-invertida": {
      src: "/assets/photos/tipos/campana-t-invertida-visera-ancha-acero.webp",
      alt: "Campana en T invertida con ducto angosto y visera ancha de acero",
    },
    "de-cristal": {
      src: "/assets/photos/tipos/campana-de-cristal-visera-curva-acero.webp",
      alt: "Campana de pared con visera de cristal curvo y cuerpo de acero",
    },
    piramidal: {
      src: "/assets/photos/tipos/campana-piramidal-acero-faldon-inclinado.webp",
      alt: "Campana piramidal de pared en acero inoxidable con faldón inclinado y barral",
    },
    "cilindrica-o-cuadrada": {
      src: "/assets/photos/tipos/campana-cilindrica-isla-tube-pro-acero.webp",
      alt: "Campana de isla cilíndrica en acero inoxidable, volumen exento",
    },
    "tipo-inserto": {
      src: "/assets/photos/tipos/campana-inserto-profesional-48-thermador.webp",
      alt: "Grupo de extracción tipo inserto de 48 pulgadas para montarse dentro de un mueble",
    },
    "bajo-mueble": {
      src: "/assets/photos/tipos/campana-bajo-mueble-80cm-acero-mabe.webp",
      alt: "Campana de 80 cm en acero inoxidable para instalarse bajo la alacena",
    },
    slider: {
      src: "/assets/photos/tipos/campana-slider-visera-extraible-tecnolam.webp",
      alt: "Campana con visera telescópica extraíble, mostrada con la visera afuera",
    },
    "para-revestir": {
      src: "/assets/photos/tipos/campana-para-revestir-bajo-mueble-tecnolam.webp",
      alt: "Campana de 55 cm para revestirse con el acabado de la carpintería",
    },
    "a-techo": {
      src: "/assets/photos/tipos/campana-a-techo-empotrada-plafon.webp",
      alt: "Campana empotrada al ras del plafón para isla",
    },
    decorativas: {
      src: "/assets/photos/tipos/campana-decorativa-isla-escultural-negra.webp",
      alt: "Campana decorativa de isla, pieza escultural en acabado negro",
    },
    retractiles: {
      src: "/assets/photos/tipos/campana-retractil-downdraft-acero.webp",
      alt: "Campana retráctil downdraft que emerge de la cubierta",
    },
    "gran-formato": {
      src: "/assets/photos/tipos/campana-gran-formato-isla-180cm-acero.webp",
      alt: "Campana de isla de gran formato, 180 cm de ancho en acero",
    },
    "tipo-repisa": {
      src: "/assets/photos/tipos/campana-tipo-repisa-falmec-estante-negro.webp",
      alt: "Campana tipo repisa de 240 cm en negro, con la extracción en el canto",
    },
    monolith: {
      src: "/assets/photos/tipos/campana-monolith-bloque-negro-falmec.webp",
      alt: "Campana monolítica: un solo bloque negro continuo, sin junta entre ducto y campana",
    },
    airwall: {
      src: "/assets/photos/tipos/campana-airwall-panel-mural-blanco-falmec.jpg",
      alt: "Campana Airwall: panel vertical al muro con barra de extracción frontal sobre la placa",
    },
    "induccion-con-sistema-de-extraccion": {
      src: "/assets/photos/tipos/parrilla-induccion-extraccion-integrada-negra.webp",
      alt: "Placa de inducción con extractor integrado en la cubierta, sin campana",
    },
  },
};

export function getFotoTipo(plpKey: string, slug: string): FotoTipo | undefined {
  return FOTOS_TIPOS[plpKey]?.[slug];
}

/** PLPs cuyo mosaico YA es de foto. Un tipo sin packshot no cae al diagrama:
 *  deja el hueco reservado del mismo tamaño (ver TipoGrid → .es-pendiente),
 *  para que el layout sea el definitivo desde ahora y las fotos entren sin
 *  mover nada. El diagrama de línea se queda en Guías. */
const PLP_CON_FOTO = new Set<string>([
  "cocina-y-bar/refrigeracion/refrigeradores",
  "cocina-y-bar/coccion/parrillas",
  "cocina-y-bar/coccion/campanas",
]);

export function usaFotos(plpKey: string): boolean {
  return PLP_CON_FOTO.has(plpKey);
}
