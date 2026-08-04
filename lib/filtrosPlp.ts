// Filtros del PLP por tipo de producto (Subcategoría 2).
//
// Fuente: tabla de filtros de Carla (2026-07-28), columnas
// Macrocategoría · Subcategoría 1 · Subcategoría 2 · Orden · Filtro · Tipo de
// control · Valores. El orden del arreglo ES el "Orden de aparición".
//
// Estos filtros son la especificación de lo que después se configura en Shopify
// Search & Discovery (metafields `facetas.*`); aquí viven para poder maquetar y
// validar la experiencia antes de tener el catálogo cargado.

export type ControlFiltro = "multi" | "slider";

export interface FiltroPlp {
  nombre: string;
  control: ControlFiltro;
  /** Valores cerrados del filtro. Vacío = se alimenta del catálogo. */
  valores?: string[];
  /** Nota operativa cuando el valor no es una lista fija. */
  nota?: string;
}

/** Clave: `<macro>/<subcategoria1>/<tipo>` */
export const FILTROS_PLP: Record<string, FiltroPlp[]> = {
  "cocina-y-bar/refrigeracion/refrigeradores": [
    { nombre: "Marca", control: "multi", nota: "Depende del producto — sale del Vendor de Shopify" },
    { nombre: "Precio", control: "slider" },
    {
      nombre: "Acabado",
      control: "multi",
      valores: ["Inoxidable", "Panelable", "Negro", "Blanco", "Crema", "Rojo"],
    },
    {
      nombre: "Tipo de instalación",
      control: "multi",
      valores: ["Piso", "Empotrado", "Counter Depth"],
    },
    {
      nombre: "Diseño",
      control: "multi",
      valores: [
        "Parejas",
        "French Door",
        "Duplex",
        "Bottom Mount",
        "Top Mount",
        "Columna",
        "Glass Door",
        "1 puerta",
        "4 puertas",
        "5 puertas",
        "Bajo cubierta",
      ],
    },
    { nombre: "Fábrica de hielos", control: "multi", valores: ["Con despachador", "Sin despachador"] },
    { nombre: "Despachador de agua", control: "multi", valores: ["Interno", "Externo"] },
    {
      nombre: "Ancho",
      control: "multi",
      valores: ['18"', '24"', '30"', '36"', '42"', '48"', '60"', '62"', '66"', '72"'],
    },
    { nombre: "Voltaje", control: "multi", valores: ["110 V", "220 V"] },
    { nombre: "Disponibilidad", control: "multi", valores: ["En stock", "Bajo pedido"] },
    { nombre: "Garantía", control: "multi", valores: ["1 año", "2 años", "3 años"] },
    {
      nombre: "Promoción",
      control: "multi",
      valores: ["Outlet", "10%", "15%", "20%", "25%", "30%", "35%", "40%", "50%", "60%"],
    },
  ],

  "cocina-y-bar/coccion/parrillas": [
    { nombre: "Marca", control: "multi", nota: "Depende del producto — sale del Vendor de Shopify" },
    { nombre: "Precio", control: "slider" },
    {
      nombre: "Acabado",
      control: "multi",
      valores: ["Inoxidable", "Negro", "Gris", "Blanco"],
    },
    {
      nombre: "Tipo de instalación",
      control: "multi",
      valores: ["Profesional", "Tradicional"],
    },
    {
      nombre: "Tipo de funcionamiento",
      control: "multi",
      valores: [
        "Gas",
        "Vitrocerámica",
        "Inducción",
        "Inducción con sistema de Extracción",
        "Híbrida (Gas + Inducción)",
        "Submontar",
        "Invisible",
        "Modulares",
      ],
    },
    { nombre: "Tipo de gas", control: "multi", valores: ["Natural", "LP"] },
    {
      nombre: "Ancho",
      control: "multi",
      valores: ['11"', '15"', '24"', '30"', '36"', '48"'],
    },
    { nombre: "Voltaje", control: "multi", valores: ["110 V", "220 V"] },
    { nombre: "Disponibilidad", control: "multi", valores: ["En stock", "Bajo pedido"] },
    { nombre: "Garantía", control: "multi", valores: ["1 año", "2 años", "3 años"] },
    {
      nombre: "Promoción",
      control: "multi",
      valores: ["Outlet", "10%", "15%", "20%", "25%", "30%", "35%", "40%", "50%", "60%"],
    },
  ],

  "cocina-y-bar/coccion/campanas": [
    { nombre: "Marca", control: "multi", nota: "Depende del producto — sale del Vendor de Shopify" },
    { nombre: "Precio", control: "slider" },
    {
      nombre: "Acabado",
      control: "multi",
      valores: ["Inoxidable", "Negro", "Gris", "Blanco"],
    },
    {
      nombre: "Tipo de instalación",
      control: "multi",
      valores: ["De pared", "De isla"],
    },
    {
      // Los 16 valores son los ejes del mosaico (TipoGrid, grupo "estilo"): el
      // orden de aquí es el que se ve en la página.
      nombre: "Diseño",
      control: "multi",
      valores: [
        "Rectas",
        "T invertida",
        "De Cristal",
        "Piramidal",
        "Cilíndrica ó Cuadrada",
        "Tipo Inserto",
        "Bajo mueble",
        "Slider",
        "Para revestir",
        "A techo",
        "Decorativas",
        "Retráctiles",
        "Gran formato",
        "Tipo Repisa",
        "Monolith",
        "Inducción con sistema de Extracción",
      ],
    },
    {
      // La hoja lista los anchos desordenados; aquí van de menor a mayor, como
      // en refrigeradores y parrillas.
      nombre: "Ancho",
      control: "multi",
      valores: [
        '21"', '24"', '28"', '29"', '30"', '32"', '35"', '36"',
        '39"', '42"', '44"', '48"', '55"', '60"', '70"', '82"',
      ],
    },
    {
      nombre: "Tipo de Extracción",
      control: "multi",
      valores: ["Recirculante", "Extractora", "Convertible"],
    },
    {
      nombre: "Tipo de Motor",
      control: "multi",
      valores: ["Incluido", "Con costo (Interno, Inline ó Externo)"],
    },
    {
      nombre: "Potencia del Motor (CFM)",
      control: "multi",
      valores: ["300", "355", "360", "400", "600", "1200"],
    },
    { nombre: "Uso", control: "multi", valores: ["Interior", "Exterior"] },
    { nombre: "Voltaje", control: "multi", valores: ["110 V", "220 V"] },
    { nombre: "Disponibilidad", control: "multi", valores: ["En stock", "Bajo pedido"] },
    { nombre: "Garantía", control: "multi", valores: ["1 año", "2 años", "3 años"] },
    {
      nombre: "Promoción",
      control: "multi",
      valores: ["Outlet", "10%", "15%", "20%", "25%", "30%", "35%", "40%", "50%", "60%"],
    },
  ],
};

export function getFiltrosPlp(macro: string, sub1: string, tipo: string): FiltroPlp[] {
  return FILTROS_PLP[`${macro}/${sub1}/${tipo}`] ?? [];
}
