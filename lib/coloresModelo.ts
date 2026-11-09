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
  inoxidable: METAL,
  "stainless steel": METAL,
  "acero cepillado": METAL,
  // Panelable (Elica, Hoshizaki): lleva el panel de la cocina; chapa de madera.
  panelable: "repeating-linear-gradient(100deg, #c9a585 0 3px, #b8936f 3px 5px, #cfad8e 5px 8px)",
  // Monogram: cajones refrigerantes dobles "Panelables" y parrilla de inducción "Gris".
  panelables: "repeating-linear-gradient(100deg, #c9a585 0 3px, #b8936f 3px 5px, #cfad8e 5px 8px)",
  gris: "#8e8e8b",
  // Kraus: acero inoxidable con PVD negro (gunmetal), "… en Acero Inoxidable Negro".
  "acero inoxidable negro": "linear-gradient(135deg, #5c5c5c 0%, #2e2e2e 50%, #1a1a1a 100%)",
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
  // Café (2026-11-06): equipos en Blanco Mate y kits de herrajes en 6 acabados.
  "blanco mate": "#ecebe6",
  "acero inoxidable cepillado": METAL,
  "latón cepillado": "linear-gradient(135deg, #d9c48e 0%, #b39a5c 50%, #927a40 100%)",
  "bronce cepillado": "linear-gradient(135deg, #b08a5e 0%, #8a6640 50%, #6a4c2e 100%)",
  "cobre cepillado": "linear-gradient(135deg, #e0a27a 0%, #b87348 50%, #8f5532 100%)",
  "negro cepillado": "linear-gradient(135deg, #4a4947 0%, #2b2a28 50%, #1a1918 100%)",
  "matte black": "#1d1d1d",
  negro: "#1d1d1d",
  negra: "#1d1d1d",
  "negro mate": "#222222",
  // GE Profile (2026-11-06): Black Slate (gris muy oscuro mate) y Grafito (centros de lavado).
  "black slate": "linear-gradient(135deg, #5a5856 0%, #3d3b39 50%, #2c2a28 100%)",
  grafito: "#4a4a48",
  // KitchenAid (2026-11-09): Black Ore (negro grafito mate) y Juniper (verde profundo).
  "black ore": "linear-gradient(135deg, #4a4542 0%, #2e2a28 50%, #1f1c1a 100%)",
  juniper: "linear-gradient(135deg, #4a6159 0%, #2f453e 50%, #22342e 100%)",
  // Parrillas KitchenAid: vidrio negro con marco de acero frente a la versión sin marco (Negro).
  "marco acero inoxidable": mitad("#1d1d1d", "#c8c8c4"),
  // Mabe (2026-11-06): nombres comerciales de Mabe tal como van en el título.
  "plata mercury": "linear-gradient(135deg, #e4e5e6 0%, #b9bcbf 50%, #9a9da0 100%)",
  silver: "linear-gradient(135deg, #e8e8e8 0%, #bdbdbd 50%, #9e9e9e 100%)",
  "diamond gray": "linear-gradient(135deg, #a9a9a6 0%, #7f7f7c 50%, #66665f 100%)",
  "dark silver": "linear-gradient(135deg, #8d8f91 0%, #66686a 50%, #4c4e50 100%)",
  "acero inoxidable mate": "linear-gradient(135deg, #d4d4d1 0%, #b4b4b0 50%, #a0a09c 100%)",
  espejo: "linear-gradient(135deg, #f2f2f2 0%, #a9abad 45%, #e6e7e8 60%, #8c8e90 100%)",
  "negro espejo": "linear-gradient(135deg, #4a4a4a 0%, #0f0f0f 45%, #2f2f2f 60%, #050505 100%)",
  "rose gold": "linear-gradient(135deg, #f0c4b0 0%, #d29a82 50%, #b07a62 100%)",
  "black slate y rose gold": mitad("#3d3b39", "#d29a82"),
  "diamond gray y rose gold": mitad("#7f7f7c", "#d29a82"),
  // Elica Seashell (2026-11-06): blanca y negra en mate y en brillante.
  "blanca mate": "#ecebe6",
  "blanca brillante": "linear-gradient(135deg, #ffffff 0%, #e9e9e6 45%, #ffffff 60%, #d6d6d2 100%)",
  "negra mate": "#222222",
  "negro brillante": "#0d0d0d",
  // Benessi: frente de cristal negro (hornos, microondas y cafetera).
  "cristal negro": "linear-gradient(135deg, #3a3a3a 0%, #111111 45%, #262626 60%, #050505 100%)",
  // IO Mabe (2026-11-06): parrillas de gas en vidrio negro frente a las de acero inoxidable.
  "vidrio negro": "linear-gradient(135deg, #3a3a3a 0%, #111111 45%, #262626 60%, #050505 100%)",
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
  blanca: "#f4f4f2",
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

/**
 * Círculo de cada valor del filtro Color (filtros.color, color base; Carla,
 * 2026-11-03): en el panel de filtros de todas las categorías, aunque la pieza no
 * tenga selector de color en su tarjeta o su ficha. Llave = valor sin acentos ni
 * mayúsculas. Un valor nuevo sin círculo se ve sin él hasta sumarlo aquí.
 */
const MUESTRAS_FILTRO: Record<string, string> = {
  "acero inoxidable": METAL,
  "acero oscuro": OSCURO,
  amarillo: "#f2c230",
  azul: "#2b4c7e",
  beige: "#e8dcc4",
  blanco: "#f4f4f2",
  bronce: "linear-gradient(135deg, #b08a5e 0%, #8a6640 50%, #6a4c2e 100%)",
  cafe: "#5a4636",
  cobre: "linear-gradient(135deg, #e0a27a 0%, #b87348 50%, #8f5532 100%)",
  crema: "#efe6d2",
  cristal: "linear-gradient(135deg, rgba(255,255,255,.95) 0%, rgba(196,214,220,.55) 45%, rgba(255,255,255,.9) 60%, rgba(170,192,200,.5) 100%)",
  cromo: CROMO,
  "cromo y blanco": mitad("#c9cdd0", "#f4f4f2"),
  "cromo y negro": mitad("#c9cdd0", "#1f1f1f"),
  dorado: "linear-gradient(135deg, #e8cf8a 0%, #c8a24a 50%, #a8842e 100%)",
  gris: "#8e8e8b",
  "gris oscuro": "#4a4a47",
  marfil: "#efe6d2",
  morado: "#6c4675",
  naranja: "#e8692c",
  negro: "#1d1d1d",
  niquel: "linear-gradient(135deg, #ece8df 0%, #c8c3b8 45%, #e4e0d6 60%, #a49e92 100%)",
  "oro rosa": "linear-gradient(135deg, #f0c4b0 0%, #d29a82 50%, #b07a62 100%)",
  // Panelable: lleva el panel de la cocina; se pinta como chapa de madera.
  panelable: "repeating-linear-gradient(100deg, #c9a585 0 3px, #b8936f 3px 5px, #cfad8e 5px 8px)",
  plata: "linear-gradient(135deg, #ececec 0%, #c0c0c0 50%, #a2a2a2 100%)",
  platino: "linear-gradient(135deg, #e6e4de 0%, #c0beb8 50%, #a09e98 100%)",
  rojo: "#b3262b",
  rosa: "#d9a3a8",
  verde: "#4f6b4a",
};

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Fondo del círculo de un valor del filtro Color; null si aún no tiene. */
export function muestraFiltroColor(valor: string): string | null {
  return MUESTRAS_FILTRO[sinAcentos(valor)] ?? null;
}

/** Palabras que acompañan al color en el título pero no lo distinguen. */
const RELLENO = new Set(["silgranit", "en", "de", "con"]);

const palabras = (titulo: string) => titulo.split(" — ")[0].split(/\s+/).filter(Boolean);

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
 * página y sus otros colores (título, slug, SKU y acabado de respaldo).
 *
 * El nombre de cada color se saca contra TODO el grupo, nunca de dos en dos: de
 * dos en dos, "Cromo Cepillado" frente a "Acero Cepillado" deja "Cromo" vs
 * "Acero" y el círculo se perdía solo en algunas fichas (Carla, 2026-11-03: los
 * colores deben estar estáticos). Las piezas cuyo nombre no es un color conocido
 * (la versión LP de una estufa, la tarja "Doble") salen del grupo y se vuelve a
 * calcular, hasta que todos los que quedan son colores. Sin al menos dos colores,
 * no hay selector.
 */
export function coloresDeModelo(
  actual: { sku: string; slug: string; titulo: string; acabado?: string },
  hermanos: { sku: string; slug: string; titulo: string; acabado?: string }[],
): ColorHermano[] {
  // Respaldo: el color de `filtros.color` cuando el título no lo dice (la versión de acero).
  const nombreRespaldo = (a?: string) => (a === "Inoxidable" ? "Acero inoxidable" : (a ?? ""));
  type Pieza = (typeof hermanos)[number];
  const nombresDe = (grupo: Pieza[]) => {
    // Lo que no comparte con TODO el grupo, para que "Satin Platinum" no quede en
    // "Platinum" junto a "Satin Gold".
    const comunes = palabras(grupo[0].titulo)
      .map((w) => w.toLowerCase())
      .filter((w) => grupo.every((g) => palabras(g.titulo).some((x) => x.toLowerCase() === w)));
    return grupo.map((g) => {
      const propias = palabras(g.titulo).filter((w) => !comunes.includes(w.toLowerCase()));
      // "en Acero Inoxidable Negro" → "Acero Inoxidable Negro": sin conectores al inicio.
      while (propias.length && RELLENO.has(propias[0].toLowerCase()) && propias[0].toLowerCase() !== "silgranit") propias.shift();
      return propias.join(" ") || nombreRespaldo(g.acabado);
    });
  };
  let grupo: Pieza[] = [actual, ...hermanos.filter((h) => h.sku !== actual.sku)];
  let nombres = nombresDe(grupo);
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const quedan = grupo.filter((_, i) => muestra(nombres[i]));
    if (quedan.length === grupo.length || quedan.length < 2) break;
    grupo = quedan;
    nombres = nombresDe(grupo);
  }
  const opciones: ColorHermano[] = [];
  grupo.forEach((g, i) => {
    const fondo = muestra(nombres[i]);
    if (fondo) opciones.push({ sku: g.sku, slug: g.slug, nombre: nombres[i], fondo, actual: g.sku === actual.sku });
  });
  if (opciones.length < 2 || !opciones.some((o) => o.actual)) return [];
  // Mismo orden en todas las fichas del grupo: los círculos no "brincan" al navegar.
  return opciones.sort((a, b) => a.sku.localeCompare(b.sku, "es", { numeric: true }));
}
