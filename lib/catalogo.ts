// catalogo.ts — índice de búsqueda del catálogo de Shopify (lado servidor).
//
// El JSON lo genera `node scripts/build-search-index.mjs` a partir de los CSV de
// import de Shopify. Se lee una sola vez por proceso y vive en memoria; el
// navegador nunca lo recibe completo — /api/buscar devuelve como mucho 8 filas.
//
// Migración futura: cuando exista el token de Storefront API, `buscar()` se
// sustituye por una consulta `predictiveSearch` a Shopify. La forma de
// `ResultadoBusqueda` es el contrato que consume el overlay, así que el cambio
// no toca el componente.

// Import estático, NO readFileSync: el file tracing de Next no sigue rutas
// calculadas en runtime, así que un `join(process.cwd(), …)` compila en local y
// revienta en Vercel por archivo ausente. Importado, el JSON viaja en el bundle
// del servidor y además Next lo vigila en dev (regenerar el índice recarga).
import indice_ from "@/data/catalogo-index.json";

export interface ProductoIndexado {
  sku: string;
  handle: string;
  titulo: string;
  /** Nombre corto: el título sin la coletilla de serie. */
  nombre: string;
  serie: string | null;
  marca: string;
  tipo: string;
  categoria: string;
  /** Precio base SIN IVA, tal como vive en Shopify (taxesIncluded: false). */
  precio: number;
  moneda: "USD" | "MXN";
  estado: string;
  /** Refacción o complemento: no debe ganarle al aparato en el ranking. */
  accesorio: boolean;
  imagen: string | null;
  /** Ruta de la PDP si ya existe; null → el resultado se resuelve por WhatsApp. */
  ficha: string | null;
  busca: string;
}

/** Lo que viaja al navegador por resultado: ya formateado, sin campos internos. */
export interface ResultadoBusqueda {
  sku: string;
  nombre: string;
  marca: string;
  serie: string | null;
  imagen: string | null;
  ficha: string | null;
  /** Precio CON IVA ya formateado, p. ej. "$12,884.67". */
  precio: string;
  moneda: "USD" | "MXN";
}

export const IVA = 0.16;

/* ---------- Autocompletado en línea (ghost text) ------------------------- */

interface Frase {
  /** Forma plana (minúsculas, sin acentos) para comparar prefijos. */
  c: string;
  /** Forma que se muestra, con mayúsculas y acentos reales. */
  t: string;
  /** Peso: cuántos productos la respaldan. */
  p: number;
}

/** Minúsculas y sin acentos PRESERVANDO longitud — se corta por índice, así que
 *  no puede colapsar signos como hace `normalizar()`. */
function plano(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Devuelve SOLO el tramo que falta para completar lo tecleado — "gagg" → "enau".
 * Null si no hay una continuación razonable.
 *
 * Dos pasadas:
 *  1. Frase completa del catálogo ("refri" → "Refrigerador").
 *  2. Si la frase no existe, se completa la última palabra ("horno de va" →
 *     "por"): el cliente escribe "horno de vapor" pero el título real es
 *     "Horno Combi-Vapor", así que como frase nunca empataría.
 */
export function sugerir(consulta: string): string | null {
  const escrito = consulta.trimStart();
  if (escrito.trim().length < 2) return null;
  const clave = plano(escrito);

  const frase = (indice_.sugerencias as Frase[]).find(
    (s) => s.c.startsWith(clave) && s.c.length > clave.length,
  );
  if (frase) return frase.t.slice(escrito.length);

  // Última palabra suelta. Se exige que ya lleve 2 letras para no proponer
  // cosas al azar en cuanto el usuario teclea un espacio.
  const corte = escrito.lastIndexOf(" ");
  if (corte < 0) return null;
  const ultima = escrito.slice(corte + 1);
  if (ultima.length < 2) return null;
  const claveUltima = plano(ultima);

  const palabra = (indice_.palabras as Frase[]).find(
    (w) => w.c.startsWith(claveUltima) && w.c.length > claveUltima.length,
  );
  return palabra ? palabra.t.slice(ultima.length) : null;
}

type Entrada = ProductoIndexado & { _sku: string; _nombre: string; _busca: string };

let cache: Entrada[] | null = null;

/** Sin acentos, minúsculas y sin signos: "Horno 24\"" → "horno 24". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function indice(): Entrada[] {
  if (cache) return cache;
  const productos = (indice_ as { productos: ProductoIndexado[] }).productos;
  cache = productos.map((p) => ({
    ...p,
    _sku: normalizar(p.sku),
    _nombre: normalizar(p.nombre),
    _busca: normalizar(p.busca),
  }));
  return cache;
}

/** Precio con IVA, formateado a la mexicana con dos decimales. */
export function precioConIva(base: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(base * (1 + IVA));
}

/**
 * Puntúa cada producto contra la consulta. El SKU manda: quien teclea "BOP250612"
 * quiere ESE modelo, no los 40 hornos que comparten palabras en el título.
 */
function puntuar(p: Entrada, q: string, tokens: string[]): number {
  if (p._sku === q) return 1000;
  if (p._sku.startsWith(q)) return 800;
  if (q.length >= 3 && p._sku.includes(q)) return 600;

  // Todos los tokens deben aparecer: "horno vapor" no debe traer todos los hornos.
  if (!tokens.every((t) => p._busca.includes(t))) return 0;

  let score = 200;
  if (p._nombre.startsWith(q)) score += 160;
  else if (p._nombre.includes(q)) score += 90;
  if (normalizar(p.marca).startsWith(tokens[0])) score += 40;
  // Quien teclea "horno de vapor" quiere el horno, no los cartuchos de limpieza
  // para hornos de vapor. El accesorio sigue apareciendo, pero después.
  if (p.accesorio) score -= 120;
  return score;
}

export interface Pagina {
  resultados: ResultadoBusqueda[];
  /** Coincidencias totales, no las de esta página. */
  total: number;
  /** Página servida, ya acotada al rango válido. */
  pagina: number;
  paginas: number;
}

export const POR_PAGINA = 8;

export function buscar(consulta: string, pagina = 1, limite = POR_PAGINA): Pagina {
  const q = normalizar(consulta);
  if (q.length < 2) return { resultados: [], total: 0, pagina: 1, paginas: 1 };
  const tokens = q.split(" ").filter(Boolean);

  const marcados: { p: Entrada; score: number }[] = [];
  for (const p of indice()) {
    const score = puntuar(p, q, tokens);
    if (score > 0) marcados.push({ p, score });
  }

  marcados.sort((a, b) => b.score - a.score || a.p.nombre.length - b.p.nombre.length);

  // La página se acota aquí y se devuelve: si el cliente pide la 12 de 3
  // (URL manipulada, o cambió la consulta a mitad de vuelo) recibe la última
  // válida en vez de una lista vacía sin explicación.
  const paginas = Math.max(1, Math.ceil(marcados.length / limite));
  const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), paginas);
  const desde = (actual - 1) * limite;

  return {
    total: marcados.length,
    pagina: actual,
    paginas,
    resultados: marcados.slice(desde, desde + limite).map(({ p }) => ({
      sku: p.sku,
      nombre: p.nombre,
      marca: p.marca,
      serie: p.serie,
      imagen: p.imagen,
      ficha: p.ficha,
      precio: precioConIva(p.precio),
      moneda: p.moneda,
    })),
  };
}
