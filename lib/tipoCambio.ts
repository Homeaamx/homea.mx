// tipoCambio.ts — el tipo de cambio USD→MXN del sitio, en UN solo lugar.
//
// Por qué existe: las listas de proveedor vienen en dólares, pero el cliente
// cotiza y paga en pesos. Hoy el factor está escrito a mano en el HTML del
// preview ("FIX 17.43"), así que la ficha, el carrito y la cotización pueden
// decir tres números distintos y nadie se entera. Aquí se resuelve una vez y
// todos leen lo mismo.
//
// Fuente: serie **SF43718** del SIE de Banxico — el FIX, el tipo de cambio para
// solventar obligaciones en moneda extranjera. Es el dato oficial y auditable,
// que es lo que hace defendible una cotización cuando el peso se mueve.
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
const API_BANXICO = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE_FIX}/datos/oportuno`;

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
  /** FIX publicado por Banxico, sin diferencial (null si no se pudo consultar). */
  fix: number | null;
  /** Fecha de determinación del FIX, tal como la publica Banxico (dd/mm/aaaa). */
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

/** Consulta el FIX del día. Devuelve null ante cualquier fallo: nunca lanza. */
export async function consultarFixBanxico(): Promise<{ fix: number; fecha: string } | null> {
  const token = process.env.BANXICO_TOKEN;
  if (!token) return null;

  try {
    const respuesta = await fetch(API_BANXICO, {
      headers: { "Bmx-Token": token, Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      // Un día de vida; el cron revalida el tag en cuanto Banxico publica.
      next: { revalidate: 86400, tags: [TAG_TIPO_CAMBIO] },
    });
    if (!respuesta.ok) {
      console.warn(`[tipo-cambio] Banxico respondió HTTP ${respuesta.status}.`);
      return null;
    }

    const json = (await respuesta.json()) as RespuestaBanxico;
    const dato = json.bmx?.series?.[0]?.datos?.[0];
    if (!dato) return null;

    const fix = Number.parseFloat(dato.dato);
    if (!Number.isFinite(fix) || fix <= 0) return null;
    return { fix, fecha: dato.fecha };
  } catch (error) {
    const causa = error instanceof Error ? error.message : String(error);
    console.warn(`[tipo-cambio] Banxico no respondió (${causa}).`);
    return null;
  }
}

/** El tipo de cambio vigente del sitio, con su procedencia. */
export async function obtenerTipoCambio(): Promise<TipoCambio> {
  const manual = numeroDeEnv("TIPO_CAMBIO_MANUAL");
  if (manual) return { valor: manual, fix: null, fecha: null, fuente: "manual" };

  const banxico = await consultarFixBanxico();
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
      ? ` title="FIX de Banxico del ${tc.fecha}"`
      : "";
  return html.replace(
    /<span class="u-fx" id="u-fx"[^>]*>[\s\S]*?<\/span>/,
    `<span class="u-fx" id="u-fx" data-fx-servidor="1"${titulo}>Tipo de cambio · 1 USD = <strong>${factor}</strong> MXN</span>`,
  );
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
      return `Equivalencia calculada con el tipo de cambio FIX de Banxico ($${factor} del ${tc.fecha}).`;
    case "manual":
      return `Equivalencia calculada con el tipo de cambio de referencia de HOMEA ($${factor}).`;
    default:
      return `Equivalencia calculada con un tipo de cambio de referencia ($${factor}). Tu ejecutivo confirma el tipo de cambio del día.`;
  }
}
