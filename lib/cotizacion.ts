// cotizacion.ts — el formato de cotización preliminar que se envía al vendedor
// (Carla, 2026-10-08; PLAN-DE-FASES §4.5 "Lista de cotización").
//
// Es STATELESS a propósito: la cotización vive en su URL (`/cotizacion?p=…`),
// que lleva las partidas (SKU:cantidad) y los datos del cliente. El servidor la
// recompone con los precios de Shopify al abrirla, así no hay documento que
// guardar ni base de datos, y el link funciona igual para el cliente y para el
// ejecutivo. El folio se deriva de las partidas y la fecha, de modo que la misma
// lista en el mismo día da el mismo folio en el cajón y en la página.
//
// Este módulo lo usan el navegador (cajón) y el servidor (página): sin imports
// de servidor.

export interface PartidaRef {
  sku: string;
  cantidad: number;
}

export interface DatosCliente {
  nombre: string;
  telefono: string;
  ciudad: string;
  cp: string;
  /** Opcional. */
  correo: string;
  /** Nombre del proyecto ("Casa Juriquilla", "Torre 80 departamentos"). */
  proyecto: string;
}

export const DATOS_VACIOS: DatosCliente = { nombre: "", telefono: "", ciudad: "", cp: "", correo: "", proyecto: "" };

/**
 * Una partida de la pre-cotización, en la MONEDA ORIGINAL de la pieza y SIN IVA
 * (Carla, 2026-10-08: aquí el dólar no se convierte). `lista` = P/U antes del
 * descuento; `descuento` por unidad; importe = (lista − descuento) × cantidad.
 */
export interface PartidaCotizacion {
  sku: string;
  cantidad: number;
  marca: string;
  nombre: string;
  serie: string | null;
  descripcion: string;
  imagen: string | null;
  ficha: string | null;
  moneda: "USD" | "MXN";
  lista: number;
  descuento: number;
  enStock: boolean;
  /** No está publicada en Shopify: precio del índice local, por confirmar. */
  preliminar?: boolean;
}

export interface TotalesMoneda {
  moneda: "USD" | "MXN";
  ahorro: number;
  /** A precio de venta público (lista), antes del descuento, sin IVA. */
  subtotal: number;
  iva: number;
  total: number;
}

const c2 = (n: number) => Math.round(n * 100) / 100;

export const importeDe = (p: PartidaCotizacion) => c2((p.lista - p.descuento) * p.cantidad);

/**
 * Totales por moneda, pesos primero y luego dólares (solo las monedas presentes).
 * Mismo orden que el cajón (Carla, 2026-10-08): subtotal a precio de venta
 * (lista × cantidad) − ahorro (descuento × cantidad) → IVA sobre la diferencia →
 * total = subtotal − ahorro + IVA.
 */
export function totalesPorMoneda(partidas: PartidaCotizacion[], iva = 0.16): TotalesMoneda[] {
  const monedas: ("MXN" | "USD")[] = ["MXN", "USD"];
  return monedas
    .filter((m) => partidas.some((p) => p.moneda === m))
    .map((moneda) => {
      const mias = partidas.filter((p) => p.moneda === moneda);
      const subtotal = c2(mias.reduce((s, p) => s + p.lista * p.cantidad, 0));
      const ahorro = c2(mias.reduce((s, p) => s + p.descuento * p.cantidad, 0));
      const ivaMonto = c2((subtotal - ahorro) * iva);
      return { moneda, ahorro, subtotal, iva: ivaMonto, total: c2(subtotal - ahorro + ivaMonto) };
    });
}

/** "MXN", "USD" o "MIXTA", según las monedas presentes. */
export function monedaDeCotizacion(partidas: PartidaCotizacion[]): "MXN" | "USD" | "MIXTA" | "—" {
  const set = new Set(partidas.map((p) => p.moneda));
  if (set.size === 0) return "—";
  if (set.size > 1) return "MIXTA";
  return set.has("USD") ? "USD" : "MXN";
}

/** Días que la cotización preliminar se considera vigente (como el formato SAE: 15). */
export const VIGENCIA_DIAS = 15;

const SKU_VALIDO = /^[A-Z0-9-]{3,40}$/;

/** "RVC467790:1,RB282705:2" ← partidas. */
export function serializarPartidas(partidas: PartidaRef[]): string {
  return partidas
    .filter((p) => SKU_VALIDO.test(p.sku.toUpperCase()) && p.cantidad > 0)
    .map((p) => `${p.sku.toUpperCase()}:${Math.min(99, Math.round(p.cantidad))}`)
    .join(",");
}

/** Partidas ← "RVC467790:1,RB282705:2". Ignora lo que no parezca un modelo. */
export function parsearPartidas(p: string | null | undefined): PartidaRef[] {
  if (!p) return [];
  const vistas = new Set<string>();
  const partidas: PartidaRef[] = [];
  for (const tramo of p.split(",").slice(0, 50)) {
    const [skuCrudo, cantCruda] = tramo.split(":");
    const sku = (skuCrudo ?? "").trim().toUpperCase();
    if (!SKU_VALIDO.test(sku) || vistas.has(sku)) continue;
    const cantidad = Math.min(99, Math.max(1, Number.parseInt(cantCruda ?? "1", 10) || 1));
    vistas.add(sku);
    partidas.push({ sku, cantidad });
  }
  return partidas;
}

/** AAMMDD de una fecha en hora de México (la del vendedor y la del cliente). */
export function claveFecha(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const v = (t: string) => partes.find((x) => x.type === t)?.value ?? "00";
  return `${v("year")}${v("month")}${v("day")}`;
}

/** Hash corto y determinista (FNV-1a) → 4 caracteres en base 36, mayúsculas. */
function hash4(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 1679616).toString(36).toUpperCase().padStart(4, "0");
}

/**
 * Folio de la cotización preliminar: "HW-261008-K3F9". HW = homea web; luego la
 * fecha y un hash de las partidas. Nunca choca con los folios de SAE (numéricos)
 * y el ejecutivo lo sustituye por el oficial al formalizar.
 */
export function folioDe(p: string, fecha = new Date()): string {
  const dia = claveFecha(fecha);
  return `HW-${dia}-${hash4(`${dia}|${p}`)}`;
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

export function fechaVigencia(desde = new Date()): Date {
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + VIGENCIA_DIAS);
  return hasta;
}

/** Query string de la cotización: partidas + datos del cliente (solo los que vienen). */
export function queryCotizacion(partidas: PartidaRef[], datos?: Partial<DatosCliente>): string {
  const q = new URLSearchParams();
  q.set("p", serializarPartidas(partidas));
  const campos: [keyof DatosCliente, string][] = [
    ["nombre", "n"],
    ["telefono", "t"],
    ["ciudad", "c"],
    ["cp", "z"],
    ["correo", "e"],
    ["proyecto", "y"],
  ];
  for (const [campo, clave] of campos) {
    const valor = datos?.[campo]?.trim();
    if (valor) q.set(clave, valor.slice(0, 80));
  }
  return q.toString();
}

/** Datos del cliente ← query (`n`, `t`, `c`, `z`, `e`, `y`), recortados y sin basura. */
export function datosDeQuery(get: (clave: string) => string | null | undefined): DatosCliente {
  const limpio = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return {
    nombre: limpio(get("n")),
    telefono: limpio(get("t")),
    ciudad: limpio(get("c")),
    cp: limpio(get("z")).slice(0, 10),
    correo: limpio(get("e")),
    proyecto: limpio(get("y")),
  };
}
