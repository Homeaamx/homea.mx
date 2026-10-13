// dimensiones.ts — qué medidas van en la pestaña "Dimensiones" de la ficha.
//
// Regla de Carla (2026-10-13): en Dimensiones solo van las medidas DEL PRODUCTO
// (alto, ancho, profundidad, peso); lo demás —nicho, hueco, corte de cubierta,
// cable, capacidad, panel…— vive en Características y en las fichas técnicas.
//
// El metafield `homea.dimensiones` trae pares nombre/valor con los nombres que
// usa cada ficha de fabricante ("Fondo del aparato", "Ancho de nicho"…). Aquí se
// clasifican y se normalizan a una etiqueta corta: "Fondo del aparato" →
// "Profundidad", "Alto del aparato (sobrepuesto)" → "Alto (sobrepuesto)".
//
// Sin dependencias a propósito: el mismo archivo lo corre el auditor en Node
// (`node --experimental-strip-types scripts/auditar-dimensiones.mjs`).

export interface Dimension {
  nombre: string;
  valor: string;
}

/** Medidas del producto: empiezan por una de estas palabras… */
const PRODUCTO = /^(alto|altura|ancho|fondo|profundidad|largo|peso|medidas|di[aá]metro)\b/i;

/** …y NO describen el nicho, el mueble, la instalación ni un accesorio ajeno. */
const NO_PRODUCTO =
  /nicho|hueco|corte|mueble|interior|cable|manguera|zoclo|instalaci|panel|marco|puerta|techo|entre soportes|soportes de|fijaci|conexi[oó]n de gas|conexi[oó]n\b|di[aá]metro de ducto|\bde (la )?cubierta\b|gabinete|horno de|m[ií]n\.|m[aá]x\.|ideal|elevaci|[uú]tiles|compatible/i;

/** Orden de presentación de las medidas del producto. */
const ORDEN = ["Alto", "Ancho", "Profundidad", "Largo", "Diámetro", "Medidas", "Peso"];

const CANONICO: [RegExp, string][] = [
  [/^(alto|altura)\b/i, "Alto"],
  [/^ancho\b/i, "Ancho"],
  [/^(fondo|profundidad)\b/i, "Profundidad"],
  [/^largo\b/i, "Largo"],
  [/^di[aá]metro\b/i, "Diámetro"],
  [/^medidas\b/i, "Medidas"],
  [/^peso\b/i, "Peso"],
];

export function esMedidaDelProducto(nombre: string): boolean {
  const n = nombre.trim();
  return PRODUCTO.test(n) && !NO_PRODUCTO.test(n);
}

/**
 * "Fondo del aparato" → "Profundidad"; "Alto del aparato (sobrepuesto)" →
 * "Alto (sobrepuesto)"; "Ancho de la carcasa bajo cubierta" → "Ancho (carcasa
 * bajo cubierta)". El calificativo se conserva entre paréntesis cuando aporta.
 */
export function nombreCanonico(nombre: string): string {
  const n = nombre.trim();
  const regla = CANONICO.find(([re]) => re.test(n));
  if (!regla) return n;
  let resto = n.replace(regla[0], "").trim();
  // "del aparato", "total", "de la", "del", "con" al inicio no aportan.
  resto = resto.replace(/^(del aparato|total)\b/i, "").trim();
  resto = resto.replace(/^\(|\)$/g, "").trim();
  resto = resto.replace(/^(de la|de los|de las|del|de)\s+/i, "").trim();
  return resto ? `${regla[1]} (${resto})` : regla[1];
}

export function clasificarDimensiones(lista: Dimension[]): {
  producto: Dimension[];
  instalacion: Dimension[];
} {
  const producto: Dimension[] = [];
  const instalacion: Dimension[] = [];
  for (const d of lista) {
    if (esMedidaDelProducto(d.nombre)) producto.push({ nombre: nombreCanonico(d.nombre), valor: d.valor });
    else instalacion.push(d);
  }
  const rango = (n: string) => {
    const i = ORDEN.findIndex((o) => n === o || n.startsWith(`${o} (`));
    return i < 0 ? ORDEN.length : i;
  };
  producto.sort((a, b) => rango(a.nombre) - rango(b.nombre));
  return { producto, instalacion };
}
