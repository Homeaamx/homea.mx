// coloresModelo.ts — el mismo modelo en otros colores, cada uno como producto
// propio (Carla, 2026-11-03: en monomandos y tarjas el color es de lo primero que
// se escoge).
//
// Blanco, InSinkErator y Bertazzoni publican un producto por color, con su clave.
// Los grupos viven en data/sugerencias-marca.json ("colores"); la ficha pinta un
// círculo por hermano que lleva a su página. El nombre del color es lo que cambia
// en el título ("Mezcladora Semiprofesional Satin Gold" vs "… Matte Black"), así
// que no hace falta ningún dato extra en Shopify.
//
// Sin imports de servidor.

export interface MuestraColor {
  /** Fondo del círculo: un color o un degradado metálico. */
  fondo: string;
}

const METAL = "linear-gradient(135deg, #f4f4f2 0%, #c9cac7 45%, #eeeeec 60%, #a9aaa7 100%)";
const CROMO = "linear-gradient(135deg, #fbfbfb 0%, #b8bcc0 40%, #f4f6f7 58%, #8e9396 100%)";
const OSCURO = "linear-gradient(135deg, #8a8986 0%, #5d5b57 45%, #7c7a76 60%, #3f3d3a 100%)";
const mitad = (a: string, b: string) => `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 100%)`;

/** Nombre comercial (como viene en el título, sin mayúsculas) → muestra del círculo. */
const MUESTRAS: Record<string, string> = {
  // Metales y acabados de grifería
  "acero inoxidable": METAL,
  "stainless steel": METAL,
  "acero cepillado": METAL,
  "pvd steel": "linear-gradient(135deg, #e6e6e3 0%, #b3b3ae 45%, #dadad6 60%, #8f8f8a 100%)",
  chrome: CROMO,
  cromo: CROMO,
  "cromo cepillado": "linear-gradient(135deg, #e3e4e4 0%, #aeb1b3 45%, #d6d8d9 60%, #8d9193 100%)",
  "satin gold": "linear-gradient(135deg, #e3cc95 0%, #c2a062 50%, #a8864a 100%)",
  gold: "linear-gradient(135deg, #e8cf8a 0%, #c8a24a 50%, #a8842e 100%)",
  "oro francés": "linear-gradient(135deg, #e0c890 0%, #c4a464 50%, #a3854a 100%)",
  "satin platinum": "linear-gradient(135deg, #e2e0da 0%, #b9b7b0 50%, #9a9891 100%)",
  platinum: "linear-gradient(135deg, #e6e4de 0%, #c0beb8 50%, #a09e98 100%)",
  plata: "linear-gradient(135deg, #ececec 0%, #c0c0c0 50%, #a2a2a2 100%)",
  "satin dark steel": OSCURO,
  "dark steel": OSCURO,
  "níquel pulido": "linear-gradient(135deg, #ece8df 0%, #c8c3b8 45%, #e4e0d6 60%, #a49e92 100%)",
  "bronce aceitado": "linear-gradient(135deg, #6a4c38 0%, #4a3426 55%, #2f2018 100%)",
  "bronce moca": "linear-gradient(135deg, #8a705c 0%, #6b5444 55%, #4c3a2e 100%)",
  "matte black": "#1d1d1d",
  "negro mate": "#222222",
  "negro brillante": "#0d0d0d",
  "plástico negro": "#262626",
  "chrome/coal black": mitad("#c9cdd0", "#1f1f1f"),
  "chrome/white": mitad("#c9cdd0", "#f4f4f2"),
  // Silgranit (Blanco) y colores lisos
  anthracite: "#3b3b3b",
  antracita: "#3b3b3b",
  "café": "#5a4636",
  cinder: "#8a8580",
  "coal black": "#1f1f1f",
  "mystic black": "#232323",
  "soft white": "#ece9e1",
  "cloud white": "#f2f1ec",
  white: "#f4f4f2",
  blanco: "#f4f4f2",
  truffle: "#6b5c50",
  "volcano gray": "#6e6e6c",
  biscuit: "#e8dcc4",
  "natural stone": "#d9c9b0",
  "naranja brillante": "#ff6a13",
  // Bertazzoni (nombre italiano en el título)
  arancio: "#e8692c",
  avorio: "#efe6d2",
  bianco: "#f3f1ec",
  "bianco con detalles dorados": mitad("#f3f1ec", "#c8a24a"),
  "bianco detalles dorados": mitad("#f3f1ec", "#c8a24a"),
  carbonio: "#2b2b2b",
  giallo: "#f2c230",
  nero: "#111111",
  "nero con detalles dorados": mitad("#111111", "#c8a24a"),
  "nero detalles dorados": mitad("#111111", "#c8a24a"),
  rosso: "#b3262b",
};

/** Palabras que acompañan al color en el título pero no lo distinguen. */
const RELLENO = new Set(["silgranit", "en", "de", "con"]);

const palabras = (titulo: string) => titulo.split(" — ")[0].split(/\s+/).filter(Boolean);

/** Lo que tiene `a` y no `b`, en el orden de `a` ("Satin Gold"). */
function sobrante(a: string, b: string): string {
  const otras = new Set(palabras(b).map((w) => w.toLowerCase()));
  return palabras(a)
    .filter((w) => !otras.has(w.toLowerCase()))
    .join(" ");
}

function muestra(nombre: string): string | null {
  const k = nombre.toLowerCase();
  if (MUESTRAS[k]) return MUESTRAS[k];
  const sinRelleno = k
    .split(" ")
    .filter((w) => !RELLENO.has(w))
    .join(" ");
  return MUESTRAS[sinRelleno] ?? null;
}

export interface ColorHermano {
  sku: string;
  slug: string;
  nombre: string;
  fondo: string;
  actual: boolean;
}

/**
 * Círculos de color de una ficha. `actual` y `hermanos` son el producto de la
 * página y sus otros colores (título, slug, SKU y acabado de respaldo). Solo
 * entran los hermanos cuya diferencia con la pieza actual es un color conocido:
 * así la versión LP de una estufa (misma estufa, otro gas) o la tarja "Doble"
 * no se cuelan como colores. Sin al menos dos colores, no hay selector.
 */
export function coloresDeModelo(
  actual: { sku: string; slug: string; titulo: string; acabado?: string },
  hermanos: { sku: string; slug: string; titulo: string; acabado?: string }[],
): ColorHermano[] {
  // Respaldo: el color de `filtros.color` cuando el título no lo dice (la versión de acero).
  const nombreRespaldo = (a?: string) => (a === "Inoxidable" ? "Acero inoxidable" : (a ?? ""));
  // 1. Hermanos que de veras son otro color (frente a la pieza actual).
  const validos = hermanos.filter((h) => {
    if (h.sku === actual.sku) return false;
    const suyo = sobrante(h.titulo, actual.titulo) || nombreRespaldo(h.acabado);
    const mio = sobrante(actual.titulo, h.titulo) || nombreRespaldo(actual.acabado);
    return Boolean(muestra(suyo) && muestra(mio));
  });
  if (!validos.length) return [];
  // 2. El nombre de cada color = lo que no comparte con TODO el grupo, para que
  //    "Satin Platinum" no quede en "Platinum" junto a "Satin Gold".
  const grupo = [actual, ...validos];
  const comunes = palabras(grupo[0].titulo)
    .map((w) => w.toLowerCase())
    .filter((w) => grupo.every((g) => palabras(g.titulo).some((x) => x.toLowerCase() === w)));
  const nombreDe = (g: (typeof grupo)[number]) =>
    palabras(g.titulo)
      .filter((w) => !comunes.includes(w.toLowerCase()))
      .join(" ") || nombreRespaldo(g.acabado);
  const opciones: ColorHermano[] = [];
  for (const g of grupo) {
    const nombre = nombreDe(g);
    const fondo = muestra(nombre);
    if (!fondo) continue;
    opciones.push({ sku: g.sku, slug: g.slug, nombre, fondo, actual: g.sku === actual.sku });
  }
  if (opciones.length < 2 || !opciones.some((o) => o.actual)) return [];
  // Mismo orden en todas las fichas del grupo: los círculos no "brincan" al navegar.
  return opciones.sort((a, b) => a.sku.localeCompare(b.sku, "es", { numeric: true }));
}
