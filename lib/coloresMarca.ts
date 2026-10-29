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
