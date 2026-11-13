// tipoCambio.ts — el tipo de cambio USD→MXN del sitio, en UN solo lugar.
//
// Por qué existe: las listas de proveedor vienen en dólares, pero el cliente
// cotiza y paga en pesos. Hoy el factor está escrito a mano en el HTML del
// preview ("FIX 17.43"), así que la ficha, el carrito y la cotización pueden
// decir tres números distintos y nadie se entera. Aquí se resuelve una vez y
// todos leen lo mismo.
//
// Fuente: el **tipo de cambio del DOF** (Carla, 2026-11-12: es el que usa SAE).
// Banxico determina el FIX (serie **SF43718** del SIE) alrededor del mediodía y
// lo publica en el Diario Oficial el día hábil bancario SIGUIENTE: el DOF del
// jueves trae el FIX del miércoles. El SIE no tiene una serie fechada por día de
// publicación en el DOF (SF60653 va por fecha de liquidación, dos días hábiles
// después), así que aquí se toma SF43718 y se recorre un día hábil. Es el dato
// oficial y auditable, que es lo que hace defendible una cotización.
//
// Orden de precedencia:
//   1. `TIPO_CAMBIO_MANUAL` — lo pone una persona cuando la cotización debe usar
//      el tipo de cambio del banco (el formato de cotización dice "TC Santander a
//      la venta", y Santander no publica API). Gana sobre todo lo demás.
//   2. Banxico FIX × (1 + `TIPO_CAMBIO_SPREAD`) — el FIX es una referencia, no un
//      precio de venta; el diferencial que aplique HOMEA se configura, no se
//      inventa aquí.
//   3. `TC_RESPALDO` — el 17.43 que ya vive en las fichas. Si Banxico no responde
//      o falta el token, el sitio sigue mostrando precios coherentes con el HTML
//      viejo en vez de romperse.

import "server-only";

/** Serie del FIX en el SIE de Banxico. */
const SERIE_FIX = "SF43718";

/** Tag del Data Cache: el cron diario lo revalida (app/api/cron/tipo-cambio). */
export const TAG_TIPO_CAMBIO = "tipo-cambio";

/**
 * Último valor conocido, ya en las fichas del preview. No es un invento: es el
 * mismo factor con el que están calculados los precios que hoy ve el cliente.
 */
export const TC_RESPALDO = 17.43;

export type FuenteTipoCambio = "manual" | "banxico" | "respaldo";

export interface TipoCambio {
  /** Pesos por dólar, ya con el diferencial aplicado. */
  valor: number;
  /** Tipo de cambio publicado en el DOF, sin diferencial (null si no se pudo consultar). */
  fix: number | null;
  /** Día en que el DOF publica ese tipo de cambio (dd/mm/aaaa): el día al que corresponde. */
  fecha: string | null;
  fuente: FuenteTipoCambio;
}

interface RespuestaBanxico {
  bmx: {
    series: { idSerie: string; titulo: string; datos?: { fecha: string; dato: string }[] }[];
  };
}

function numeroDeEnv(nombre: string): number | null {
  const crudo = process.env[nombre];
  if (!crudo) return null;
  const valor = Number.parseFloat(crudo);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/** Diferencial sobre el FIX, en tanto por uno (0.02 = 2%). Por defecto, ninguno. */
function spread(): number {
  const valor = Number.parseFloat(process.env.TIPO_CAMBIO_SPREAD ?? "0");
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

// ── Calendario bancario ────────────────────────────────────────────────────
// Para saber qué día publica el DOF el FIX más reciente hace falta saber cuál es
// el siguiente día hábil bancario. Los pasados se deducen de la propia serie (un
// día entre semana sin FIX fue inhábil); este calendario solo sirve para el que
// todavía no llega. Son los días inhábiles de la CNBV.

const DIA = 86_400_000;

/** "aaaa-mm-dd" de una fecha UTC. */
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** "dd/mm/aaaa" (Banxico) → fecha UTC a medianoche. */
function deBanxico(fecha: string): Date {
  const [d, m, a] = fecha.split("/").map((x) => Number.parseInt(x, 10));
  return new Date(Date.UTC(a, m - 1, d));
}

/** Fecha UTC → "dd/mm/aaaa" (Banxico). */
function aBanxico(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function pascua(a: number): Date {
  const b = Math.floor(a / 100), c = a % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * (a % 19) + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor(((a % 19) + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(Date.UTC(a, Math.floor(n / 31) - 1, (n % 31) + 1));
}

/** n-ésimo lunes del mes (mes 0–11), "aaaa-mm-dd". */
function lunes(a: number, mes: number, n: number): string {
  const primero = new Date(Date.UTC(a, mes, 1));
  return iso(new Date(primero.getTime() + (((8 - primero.getUTCDay()) % 7) + 7 * (n - 1)) * DIA));
}

function inhabiles(a: number): Set<string> {
  const p = pascua(a).getTime();
  const f = (m: number, d: number) => iso(new Date(Date.UTC(a, m - 1, d)));
  return new Set([
    f(1, 1), lunes(a, 1, 1), lunes(a, 2, 3), iso(new Date(p - 3 * DIA)), iso(new Date(p - 2 * DIA)),
    f(5, 1), f(9, 16), f(11, 2), lunes(a, 10, 3), f(12, 12), f(12, 25),
    // Transmisión del Poder Ejecutivo (cada seis años, 1 de octubre).
    ...((a - 2024) % 6 === 0 ? [f(10, 1)] : []),
  ]);
}

function esHabil(d: Date): boolean {
  const dia = d.getUTCDay();
  return dia !== 0 && dia !== 6 && !inhabiles(d.getUTCFullYear()).has(iso(d));
}

function siguienteHabil(d: Date): Date {
  let x = new Date(d.getTime() + DIA);
  while (!esHabil(x)) x = new Date(x.getTime() + DIA);
  return x;
}

/** Hoy en la Ciudad de México, como fecha UTC a medianoche. */
function hoyCdmx(): Date {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
}

/**
 * El tipo de cambio del DOF de los últimos días: cada FIX con el día en que el
 * Diario Oficial lo publica (el siguiente día hábil bancario). Incluye el FIX
 * de hoy si Banxico ya lo determinó, con fecha del siguiente día hábil.
 * Lista vacía ante cualquier fallo: nunca lanza.
 */
async function serieDof(): Promise<{ fecha: string; tc: number }[]> {
  const token = process.env.BANXICO_TOKEN;
  if (!token) return [];
  const hoy = hoyCdmx();
  // 20 días: cubre Semana Santa y cualquier puente con varios FIX de margen.
  const desde = new Date(hoy.getTime() - 20 * DIA);
  try {
    const respuesta = await fetch(
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE_FIX}/datos/${iso(desde)}/${iso(hoy)}`,
      {
        headers: { "Bmx-Token": token, Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
        // La URL cambia cada día; el cron de las 00:05 revalida el tag.
        next: { revalidate: 3600, tags: [TAG_TIPO_CAMBIO] },
      },
    );
    if (!respuesta.ok) {
      console.warn(`[tipo-cambio] Banxico respondió HTTP ${respuesta.status}.`);
      return [];
    }
    const json = (await respuesta.json()) as RespuestaBanxico;
    const datos = (json.bmx?.series?.[0]?.datos ?? [])
      .map((x) => ({ dia: deBanxico(x.fecha), tc: Number.parseFloat(x.dato) }))
      .filter((x) => Number.isFinite(x.tc) && x.tc > 0)
      .sort((a, b) => a.dia.getTime() - b.dia.getTime());
    // El FIX de un día lo publica el DOF el día del siguiente FIX; el último,
    // el siguiente día hábil según el calendario.
    return datos.map((x, i) => ({
      fecha: aBanxico(datos[i + 1]?.dia ?? siguienteHabil(x.dia)),
      tc: x.tc,
    }));
  } catch (error) {
    const causa = error instanceof Error ? error.message : String(error);
    console.warn(`[tipo-cambio] Banxico no respondió (${causa}).`);
    return [];
  }
}

/**
 * El tipo de cambio que publica hoy el DOF (sábado, domingo o día inhábil: el
 * último publicado). Devuelve null ante cualquier fallo: nunca lanza.
 */
export async function consultarTipoCambioDof(): Promise<{ fix: number; fecha: string } | null> {
  const hoy = hoyCdmx().getTime();
  const serie = await serieDof();
  for (let i = serie.length - 1; i >= 0; i--) {
    if (deBanxico(serie[i].fecha).getTime() <= hoy) return { fix: serie[i].tc, fecha: serie[i].fecha };
  }
  return null;
}

/** El tipo de cambio vigente del sitio, con su procedencia. */
export async function obtenerTipoCambio(): Promise<TipoCambio> {
  const manual = numeroDeEnv("TIPO_CAMBIO_MANUAL");
  if (manual) return { valor: manual, fix: null, fecha: null, fuente: "manual" };

  const banxico = await consultarTipoCambioDof();
  if (banxico) {
    return {
      // Se redondea a centavos: un tipo de cambio con 6 decimales en una ficha
      // no aporta nada y estorba al comparar contra la cotización del vendedor.
      valor: Math.round(banxico.fix * (1 + spread()) * 100) / 100,
      fix: banxico.fix,
      fecha: banxico.fecha,
      fuente: "banxico",
    };
  }

  return { valor: TC_RESPALDO, fix: null, fecha: null, fuente: "respaldo" };
}

/**
 * Escribe el tipo de cambio en el slot `#u-fx` de la barra superior, que viene
 * como HTML del preview (lib/preview.ts → getChrome).
 *
 * Antes lo resolvía `public/v2.js` en el navegador, con el token de Banxico
 * escrito en el archivo — es decir, servido a todo visitante. Ahora el valor
 * llega ya renderizado y el token se queda en el servidor. La marca
 * `data-fx-servidor` le dice al script que no vuelva a consultar nada.
 */
export function inyectarTipoCambio(html: string, tc: TipoCambio): string {
  const factor = tc.valor.toFixed(2);
  const titulo =
    tc.fuente === "banxico" && tc.fecha
      ? ` title="Tipo de cambio del DOF del ${tc.fecha}"`
      : "";
  // La etiqueta va en su propio <span>: en móvil se oculta y queda solo la cifra.
  return html.replace(
    /<span class="u-fx" id="u-fx"[^>]*>[\s\S]*?<\/strong>[\s\S]*?<\/span>/,
    `<span class="u-fx" id="u-fx" data-fx-servidor="1"${titulo}><span class="u-fx-lbl">Tipo de cambio · </span>1 USD = <strong>${factor}</strong> MXN</span>`,
  );
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "04/11/2026" (como lo publica Banxico) → "4 de noviembre de 2026". */
export function fechaLarga(fecha: string): string {
  const [d, m, a] = fecha.split("/").map((x) => Number.parseInt(x, 10));
  return MESES[m - 1] ? `${d} de ${MESES[m - 1]} de ${a}` : fecha;
}

/**
 * Diferencia entre dos tipos de cambio que se toma como el mismo FIX. El del
 * carrito se recupera de los pesos de Shopify (redondeados a centavos) y llega
 * con 2 decimales, así que puede bailar un centavo.
 */
const MISMO_TC = 0.015;

/**
 * Fecha (dd/mm/aaaa) del DOF de los últimos días que, con el diferencial del
 * sitio, da `valor`; la más reciente si se repite. null si ninguno coincide.
 */
async function fechaDeFix(valor: number): Promise<string | null> {
  const serie = await serieDof();
  for (let i = serie.length - 1; i >= 0; i--) {
    if (Math.abs(Math.round(serie[i].tc * (1 + spread()) * 100) / 100 - valor) < MISMO_TC) return serie[i].fecha;
  }
  return null;
}

/**
 * ¿El tipo de cambio (fecha del DOF, dd/mm/aaaa) es el que corresponde hoy en la
 * Ciudad de México? Un día hábil, el del DOF de hoy; sábado, domingo o inhábil,
 * el del último día hábil. Como el DOF publica el FIX del día anterior, el de
 * hoy se conoce desde ayer al mediodía y el cron lo escribe a las 00:05.
 */
function esFixDeHoy(fecha: string): boolean {
  let dia = hoyCdmx();
  while (!esHabil(dia)) dia = new Date(dia.getTime() - DIA);
  return fecha === aBanxico(dia);
}

/**
 * ¿De qué día es el tipo de cambio con el que Shopify tiene los pesos de las
 * piezas en dólares de un carrito? (Carla, 2026-11-04). Cada pieza trae el suyo
 * (`tipoCambio`) y su precio unitario en dólares (`usd`, para la tolerancia: en
 * una pieza de centavos los pesos redondeados no dan el tipo de cambio exacto).
 * Si todas tienen el FIX vigente, `vencido` es false y `dia` es su fecha. Si una
 * trae el de un día anterior, `vencido` es true, `tipoCambio` es el suyo y `dia`
 * dice de cuándo es (null si no se encuentra). Sin Banxico no se puede comparar
 * y nunca se bloquea.
 */
export async function diaDelTipoCambio(
  piezas: { tipoCambio: number; usd: number }[],
): Promise<{ dia: string | null; vencido: boolean; tipoCambio: number | null }> {
  const vigente = await obtenerTipoCambio();
  if (vigente.fuente !== "banxico" || !vigente.fecha) return { dia: null, vencido: false, tipoCambio: null };
  const fuera = piezas.find((p) => Math.abs(p.tipoCambio - vigente.valor) >= Math.max(MISMO_TC, 0.006 / p.usd));
  if (!fuera) {
    // Al día con el último tipo de cambio, pero tiene que ser el del DOF de HOY
    // (Carla, 2026-11-05 y 2026-11-12): si Banxico no trae el FIX de ayer, no
    // se paga.
    return { dia: fechaLarga(vigente.fecha), vencido: !esFixDeHoy(vigente.fecha), tipoCambio: null };
  }
  const fecha = await fechaDeFix(fuera.tipoCambio);
  return { dia: fecha ? fechaLarga(fecha) : null, vencido: true, tipoCambio: fuera.tipoCambio };
}

/** Dólares → pesos, redondeado a centavos. */
export function aPesos(usd: number, tc: TipoCambio): number {
  return Math.round(usd * tc.valor * 100) / 100;
}

/**
 * Nota que acompaña a todo precio convertido. Que el cliente vea CON QUÉ tipo de
 * cambio se calculó es lo que hace verificable la cifra — y lo que permite al
 * vendedor defenderla tres días después.
 */
export function notaTipoCambio(tc: TipoCambio): string {
  const factor = tc.valor.toFixed(2);
  switch (tc.fuente) {
    case "banxico":
      return `Equivalencia calculada con el tipo de cambio del DOF ($${factor} del ${tc.fecha}).`;
    case "manual":
      return `Equivalencia calculada con el tipo de cambio de referencia de HOMEA ($${factor}).`;
    default:
      return `Equivalencia calculada con un tipo de cambio de referencia ($${factor}). Tu ejecutivo confirma el tipo de cambio del día.`;
  }
}
