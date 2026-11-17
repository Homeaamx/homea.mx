// coloresMarca.ts — tonos de "Standard Color" por marca (Carla, 2026-10-28).
//
// Alfresco vende cada pieza en acero, en uno de sus colores estándar (mismo
// precio para todos: la variante "Standard Color") o en un color a la medida
// ("Custom Color"). No hay fotos por tono: la ficha pinta un círculo por tono y el
// tono elegido viaja como comentario de la línea (atributo "Tono") hasta el
// carrito, la pre-cotización y el pedido.
//
// Nombres y orden de la página oficial de Alfresco (Color Options); los colores
// se tomaron de sus muestras.
//
// Sin imports de servidor: lo usan la ficha, el carrito y la pre-cotización.

export interface Tono {
  /** Código corto que viaja en la liga de la cotización (RAL; "M" = mate). */
  codigo: string;
  /** Nombre tal como lo publica la marca: es el comentario que llega al pedido. */
  nombre: string;
  hex: string;
}

export const TONOS_ESTANDAR: Record<string, Tono[]> = {
  Alfresco: [
    { codigo: "1023", nombre: "1023 Traffic Yellow", hex: "#F7B401" },
    { codigo: "2005", nombre: "2005 Luminous Orange", hex: "#FF4B18" },
    { codigo: "3002", nombre: "3002 Carmine Red", hex: "#9B2322" },
    { codigo: "3027", nombre: "3027 Raspberry Red", hex: "#C61D34" },
    { codigo: "4005", nombre: "4005 Lilac", hex: "#6C4675" },
    { codigo: "5002", nombre: "5002 Ultramarine Blue", hex: "#002C75" },
    { codigo: "6027", nombre: "6027 Light Green", hex: "#85C3BE" },
    { codigo: "7004", nombre: "7004 Signal Grey", hex: "#9FA0A2" },
    { codigo: "9003", nombre: "9003 Signal White", hex: "#EEEEEE" },
    { codigo: "9005", nombre: "9005 Jet Black", hex: "#0A090E" },
    { codigo: "M9003", nombre: "Matte White", hex: "#EBE9EA" },
    { codigo: "M9005", nombre: "Matte Black", hex: "#2A211C" },
  ],
};

/** Clave del atributo de línea (carrito y pedido borrador). */
export const ATRIBUTO_TONO = "Tono";

const TODOS = Object.values(TONOS_ESTANDAR).flat();

/** Tono por su código ("1023") o por su nombre ("1023 Traffic Yellow"); null si no existe. */
export function tonoDe(valor: string | null | undefined): Tono | null {
  const v = (valor ?? "").trim().toUpperCase();
  if (!v) return null;
  return TODOS.find((t) => t.codigo.toUpperCase() === v || t.nombre.toUpperCase() === v) ?? null;
}

/**
 * Colores con nombre propio que llegan como variante "Color" de un mismo producto
 * (Viking, Carla 2026-11-17: un producto por modelo con foto de acero y los colores
 * en círculos, con el nombre de la marca). El tono se tomó de las fotos de
 * vikingrange.com. Las variantes con "Herraje: Latón cepillado" llevan una franja
 * dorada en el círculo.
 */
export const TONOS_VARIANTE: Record<string, string> = {
  "Damascus Gray": "#7D7B78",
  "Cast Black": "#4A4B4D",
  "Slate Blue": "#1F3352",
  "Antique Bronze": "#3A3530",
  "November Sky": "#8FA4B0",
  "Spiced Cider": "#B2442A",
  Eucalyptus: "#7D8B74",
  Splash: "#A8D3CC",
  Martini: "#5E5E3E",
  Blush: "#EBC9C3",
  Ivy: "#1E5A3C",
  "Pure White": "#F1ECE0",
  "Golden Hour": "#A08C6A",
  Nantucket: "#A89E92",
  Squall: "#2F4250",
  Valentine: "#C2283F",
  Onyx: "#1C1C1C",
  Daffodil: "#F2BE1C",
  // Lynx Professional (Carla, 2026-11-17): los 8 "Exclusive Color Finishes", con el
  // color de las muestras de lynxgrills.com.
  "California Poppy": "#FFC117",
  Obsidian: "#282529",
  "Desert Sage": "#939983",
  Limestone: "#9E9C99",
  "Pacific Blue": "#004599",
  Sierra: "#783E29",
  Glacier: "#E1DDD5",
  Surf: "#C2EDDB",
};

/** Sufijo del nombre de una variante con herraje de latón ("Slate Blue · Latón cepillado"). */
export const SUFIJO_LATON = " · Latón cepillado";

const ACERO_CSS = "linear-gradient(135deg, #f4f4f2 0%, #c9cac7 45%, #eeeeec 60%, #a9aaa7 100%)";
const LATON = "#B08D57";

/**
 * Fondo CSS del círculo de una variante de color con nombre (Viking); null si el
 * nombre no es de esos (Alfresco sigue con su lógica de Standard/Custom Color).
 */
export function fondoVariante(nombre: string): string | null {
  const laton = nombre.endsWith(SUFIJO_LATON);
  const base = laton ? nombre.slice(0, -SUFIJO_LATON.length) : nombre;
  const hex = TONOS_VARIANTE[base];
  const acero = /^acero inoxidable$/i.test(base);
  if (!hex && !acero && !laton) return null;
  const fondo = hex ?? (acero ? null : "#9FA0A2");
  if (!laton) return fondo ?? ACERO_CSS;
  return fondo
    ? `linear-gradient(135deg, ${fondo} 0 60%, ${LATON} 60% 100%)`
    : `linear-gradient(135deg, #f4f4f2 0%, #c9cac7 35%, #e2e2df 60%, ${LATON} 60% 100%)`;
}
