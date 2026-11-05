// cotizacion.ts — el formato de cotización preliminar que se envía al vendedor
// (Carla, 2026-10-08; PLAN-DE-FASES §4.5 "Lista de cotización").
//
// 2026-10-12: el modal ya no manda esta liga; guarda cada envío como pedido
// borrador de Shopify y comparte /c/<ref> (lib/cotizacionServidor.ts). Lo de
// abajo sigue vivo para las ligas ya enviadas y como respaldo si Shopify falla.
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

import { tonoDe } from "@/lib/coloresMarca";

export interface PartidaRef {
  sku: string;
  cantidad: number;
  /** Código del tono de Standard Color ("1023", "M9003"), si la pieza lo lleva. */
  tono?: string;
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
 * Proveedores de correo que más usan los clientes. Un dominio a 1 o 2 letras de
 * uno de estos (jotmail.com, gmial.com, gmail.con, outlok.com) casi seguro es un
 * error de dedo y se pide corregirlo. Los que no se parecen a ninguno, como un
 * correo de empresa (homea.mx), pasan sin revisión (Carla, 2026-11-05: no
 * trabar al usuario).
 */
const PROVEEDORES = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com",
  "hotmail.es", "outlook.es", "yahoo.com.mx", "live.com.mx", "hotmail.com.mx", "outlook.com.mx",
  "prodigy.net.mx", "msn.com", "aol.com", "protonmail.com",
];
/** Dominios reales que quedan cerca de un proveedor y no deben marcarse. */
const REALES = new Set([
  ...PROVEEDORES, "mail.com", "gmx.com", "gmx.net", "me.com", "mac.com", "ymail.com", "yahoo.es",
  "live.mx", "proton.me", "zoho.com", "email.com", "hotmail.fr", "outlook.fr", "gmail.es",
]);
/** Terminaciones mal escritas de ".com" (empresa.con, empresa.cmo…). */
const TERMINACIONES_TYPO = new Set(["con", "cmo", "cpm", "vom", "xom", "comm", "coom", "cim", "clm", "ocm", "cm", "om"]);

/** Distancia de edición (con transposición): cuántas letras hay que cambiar. */
function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Dominio correcto si `dominio` parece un error de dedo de un proveedor conocido; null si se ve bien. */
function sugerenciaDominio(dominio: string): string | null {
  if (REALES.has(dominio)) return null;
  if (dominio === "gmail.com.mx") return "gmail.com";
  let mejor: string | null = null;
  let menor = 3;
  for (const p of PROVEEDORES) {
    const dist = distancia(dominio, p);
    if (dist < menor) { menor = dist; mejor = p; }
  }
  if (mejor && menor <= (dominio.length >= 9 ? 2 : 1)) return mejor;
  // Cualquier dominio (también de empresa) con ".com" mal escrito: empresa.con → empresa.com.
  const partes = dominio.split(".");
  if (TERMINACIONES_TYPO.has(partes[partes.length - 1])) return [...partes.slice(0, -1), "com"].join(".");
  return null;
}

/** Solo los dígitos de un teléfono, sin la lada internacional de México (52 / 521). */
function digitosTelefono(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) return d.slice(3);
  if (d.length === 12 && d.startsWith("52")) return d.slice(2);
  return d;
}

/**
 * Errores de los datos del cliente de la pre-cotización (Carla, 2026-11-05: un
 * teléfono completo y un correo real antes de avanzar). Devuelve un mensaje por
 * campo con problema; vacío = todo bien. Nombre y teléfono son obligatorios; los
 * opcionales solo se revisan si traen algo.
 */
export function erroresDeDatos(d: DatosCliente): Partial<Record<keyof DatosCliente, string>> {
  const e: Partial<Record<keyof DatosCliente, string>> = {};

  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = "Escribe tu nombre.";
  else if ((nombre.match(/\p{L}/gu) ?? []).length < 3 || /[\d@_#$%*=<>{}[\]\\|/]/.test(nombre))
    e.nombre = "Escribe tu nombre completo, solo con letras.";

  const tel = d.telefono.trim();
  const digitos = digitosTelefono(tel);
  if (!tel) e.telefono = "Escribe tu teléfono.";
  else if (/[^\d\s()+.-]/.test(tel) || digitos.length !== 10)
    e.telefono = "Escribe un teléfono de 10 dígitos, por ejemplo 442 123 4567.";
  else if (/^(\d)\1+$/.test(digitos) || "01234567890".includes(digitos) || "09876543210".includes(digitos))
    e.telefono = "Revisa tu teléfono: parece incompleto o de prueba.";

  const correo = d.correo.trim().toLowerCase();
  if (correo) {
    const [local = "", dominio = "", ...resto] = correo.split("@");
    const forma =
      !resto.length &&
      /^[a-z0-9._%+-]+$/.test(local) &&
      !/^\.|\.$|\.\./.test(local) &&
      /^([a-z0-9-]+\.)+[a-z]{2,24}$/.test(dominio) &&
      !/(^|\.)-|-(\.|$)/.test(dominio);
    if (!forma) e.correo = "Revisa tu correo, por ejemplo nombre@gmail.com.";
    else {
      const sugerido = sugerenciaDominio(dominio);
      if (sugerido) e.correo = `Revisa tu correo: ¿quisiste decir ${local}@${sugerido}?`;
    }
  }

  const cp = d.cp.trim();
  if (cp && !/^\d{5}$/.test(cp)) e.cp = "El código postal lleva 5 dígitos.";

  const ciudad = d.ciudad.trim();
  if (ciudad && ((ciudad.match(/\p{L}/gu) ?? []).length < 2 || /\d/.test(ciudad))) e.ciudad = "Escribe el nombre de tu ciudad.";

  return e;
}

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
  /** Tono de Standard Color ("1023 Traffic Yellow"), anotado como comentario de la partida. */
  tono?: string;
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

/** Días que la cotización preliminar se considera vigente: 2 semanas desde su emisión (Carla, 2026-10-13). */
export const VIGENCIA_DIAS = 14;

const SKU_VALIDO = /^[A-Z0-9-]{3,40}$/;

/** "RVC467790:1,RB282705:2,ALXE56C-SC:1:1023" ← partidas (el tercer tramo es el tono). */
export function serializarPartidas(partidas: PartidaRef[]): string {
  return partidas
    .filter((p) => SKU_VALIDO.test(p.sku.toUpperCase()) && p.cantidad > 0)
    .map((p) => {
      const tono = tonoDe(p.tono);
      return `${p.sku.toUpperCase()}:${Math.min(99, Math.round(p.cantidad))}${tono ? `:${tono.codigo}` : ""}`;
    })
    .join(",");
}

/** Partidas ← "RVC467790:1,RB282705:2". Ignora lo que no parezca un modelo. */
export function parsearPartidas(p: string | null | undefined): PartidaRef[] {
  if (!p) return [];
  const vistas = new Set<string>();
  const partidas: PartidaRef[] = [];
  for (const tramo of p.split(",").slice(0, 50)) {
    const [skuCrudo, cantCruda, tonoCrudo] = tramo.split(":");
    const sku = (skuCrudo ?? "").trim().toUpperCase();
    // El mismo modelo en dos tonos son dos partidas.
    const tono = tonoDe(tonoCrudo)?.codigo;
    const clave = `${sku}:${tono ?? ""}`;
    if (!SKU_VALIDO.test(sku) || vistas.has(clave)) continue;
    const cantidad = Math.min(99, Math.max(1, Number.parseInt(cantCruda ?? "1", 10) || 1));
    vistas.add(clave);
    partidas.push(tono ? { sku, cantidad, tono } : { sku, cantidad });
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

/**
 * Texto del WhatsApp al vendedor. Es UNO solo para el modal del carrito y para la
 * página /cotizacion. Sencillo a propósito (Carla, 2026-10-12): el saludo y el
 * link; las piezas, los datos del cliente y los totales ya van en el documento.
 */
export function mensajeCotizacion(url: string): string {
  return `¡Hola! Estoy interesado en una cotización formal con los siguientes equipos: ${url}`;
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
