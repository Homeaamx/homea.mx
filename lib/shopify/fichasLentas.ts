// fichasLentas.ts — anota las fichas de producto que tardan más de 5 s en armarse
// (Carla, 2026-11-17: "anota si algún producto se tarda más de 5 segundos").
//
// Desde 2026-11-17 las fichas se arman en su primera visita (ISR). Para saber si
// alguna se pasa del límite, cada armado se mide y, si se pasa, se anota:
//   1. En los registros de Vercel (console.warn "[ficha-lenta] …"; en el plan
//      Hobby solo se guardan una hora).
//   2. En Shopify, en el metafield de la tienda `homea.fichas_lentas` (JSON, las
//      últimas 200), que sí queda: se consulta desde el admin o con la Admin API.
// La anotación corre con `after()`, cuando la página ya se entregó: no le suma
// tiempo al visitante.

import { adminFetch, HAY_ADMIN } from "./admin";

/** Límite pedido por Carla. */
export const LIMITE_FICHA_MS = 5000;
const MAXIMO_ANOTACIONES = 200;

export interface FichaLenta {
  slug: string;
  ms: number;
  /** "ok", "404", "redirect"… lo que terminó pasando con la petición. */
  resultado: string;
  fecha: string;
}

const LEER = /* GraphQL */ `
  query { shop { id metafield(namespace: "homea", key: "fichas_lentas") { value } } }
`;
const ESCRIBIR = /* GraphQL */ `
  mutation($m: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $m) { userErrors { message } }
  }
`;

export async function anotarFichaLenta(slug: string, ms: number, resultado: string): Promise<void> {
  const nota: FichaLenta = { slug, ms: Math.round(ms), resultado, fecha: new Date().toISOString() };
  console.warn(`[ficha-lenta] /producto/${slug} tardó ${(ms / 1000).toFixed(1)} s (${resultado})`);
  if (!HAY_ADMIN) return;
  try {
    const actual = await adminFetch<{ shop: { id: string; metafield: { value: string } | null } }>(LEER, {});
    if (!actual) return;
    let lista: FichaLenta[] = [];
    try {
      lista = JSON.parse(actual.shop.metafield?.value ?? "[]");
    } catch {
      lista = [];
    }
    lista = [nota, ...lista].slice(0, MAXIMO_ANOTACIONES);
    await adminFetch(ESCRIBIR, {
      m: [{ ownerId: actual.shop.id, namespace: "homea", key: "fichas_lentas", type: "json", value: JSON.stringify(lista) }],
    });
  } catch (error) {
    console.warn("[ficha-lenta] no se pudo anotar en Shopify:", (error as Error).message);
  }
}
