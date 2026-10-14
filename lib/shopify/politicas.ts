// politicas.ts — Aviso de privacidad, Términos y Devoluciones: el texto legal vive en Shopify.
//
// Una sola fuente: Carla los redacta en el admin (Configuración → Políticas) y el
// checkout de Shopify ya los enseña desde ahí. El sitio los lee por Storefront API
// y los pinta con el diseño de HOMEA, así que un cambio en el admin llega solo a
// /aviso-de-privacidad, /terminos y /politica-de-devoluciones (revalidación
// diaria) sin tocar código.

import "server-only";

import { unstable_cache } from "next/cache";

import { adminFetch } from "./admin";
import { shopifyFetchOpcional } from "./cliente";

/** Las de la Storefront API + el Aviso legal, que solo existe en la Admin API. */
export type TipoPolitica = "privacyPolicy" | "termsOfService" | "refundPolicy" | "legalNotice";

export type Politica = {
  titulo: string;
  /** "Última actualización: …" tal como viene en el texto, si lo trae. */
  actualizacion: string | null;
  /** HTML ya limpio: sin el <h1> (lo pone la página) ni estilos del editor. */
  html: string;
};

const CONSULTA = /* GraphQL */ `
  query politica @inContext(country: MX, language: ES) {
    shop {
      privacyPolicy { title body }
      termsOfService { title body }
      refundPolicy { title body }
    }
  }
`;

type Respuesta = {
  shop: Record<Exclude<TipoPolitica, "legalNotice">, { title: string; body: string } | null>;
};

// El Aviso legal (LEGAL_NOTICE) no se expone en la Storefront API: se lee con la
// app de Admin (permiso read/write_legal_policies) y se guarda un día, como las demás.
const CONSULTA_ADMIN = /* GraphQL */ `
  query avisoLegal {
    shop {
      shopPolicies { type title body }
    }
  }
`;

type RespuestaAdmin = {
  shop: { shopPolicies: { type: string; title: string; body: string }[] };
};

// Si Shopify no responde (o falta el permiso) se lanza para que el caché NO
// guarde el vacío un día entero: el siguiente visitante vuelve a intentarlo.
const avisoLegalCacheado = unstable_cache(
  async () => {
    const datos = await adminFetch<RespuestaAdmin>(CONSULTA_ADMIN, {});
    const aviso = datos?.shop.shopPolicies.find((p) => p.type === "LEGAL_NOTICE");
    if (!aviso?.body) throw new Error("aviso-legal-no-disponible");
    return aviso;
  },
  ["politica-aviso-legal"],
  { revalidate: 86400, tags: ["politicas"] },
);

async function avisoLegal() {
  try {
    return await avisoLegalCacheado();
  } catch {
    return null;
  }
}

/**
 * El editor de Shopify pega clases y <span> de Word/Pages (`class="s1"`, `p2`…).
 * Se quitan atributos y envoltorios para que mande la tipografía del sitio.
 */
function limpiar(body: string): { html: string; titulo: string | null; actualizacion: string | null } {
  let html = body
    .replace(/<(script|style|iframe)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(\w+)\s+[^>]*?(\/?)>/g, (m, tag: string, cierre: string) =>
      // Los enlaces conservan su destino; todo lo demás pierde atributos.
      tag.toLowerCase() === "a" ? m : `<${tag}${cierre}>`,
    )
    .replace(/<\/?span>/gi, "");

  // Los encabezados ya van en negrita por CSS: el <b> interno sobra.
  html = html.replace(/<(h[1-6])>\s*<b>([\s\S]*?)<\/b>\s*<\/\1>/gi, "<$1>$2</$1>");

  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  const titulo = h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : null;
  html = html.replace(/<h1>[\s\S]*?<\/h1>/i, "");

  // "Última actualización: …" pasa al encabezado de la página.
  let actualizacion: string | null = null;
  html = html.replace(/<p>\s*(?:<b>)?\s*(Última actualización:[^<]*)(?:<\/b>)?\s*<\/p>/i, (_m, texto: string) => {
    actualizacion = texto.trim();
    return "";
  });

  // Cada sección con id para enlazarla directo. La de cookies lleva siempre
  // #cookies (el footer enlaza /aviso-de-privacidad#cookies), aunque Carla
  // cambie el título en Shopify.
  const usados = new Set<string>();
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_m, interior: string) => {
    const plano = interior.replace(/<[^>]+>/g, "").trim();
    let id = /cookie/i.test(plano)
      ? "cookies"
      : plano
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60);
    if (!id || usados.has(id)) id = `${id || "seccion"}-${usados.size + 1}`;
    usados.add(id);
    return `<h2 id="${id}">${interior}</h2>`;
  });

  return { html: html.trim(), titulo, actualizacion };
}

/** `null` si Shopify no responde o la política no existe: la página tiene plan B. */
export async function obtenerPolitica(tipo: TipoPolitica): Promise<Politica | null> {
  const politica =
    tipo === "legalNotice"
      ? await avisoLegal()
      : (
          await shopifyFetchOpcional<Respuesta>(CONSULTA, {
            revalidate: 86400,
            tags: ["politicas"],
          })
        )?.shop[tipo];
  if (!politica?.body) return null;

  const { html, titulo, actualizacion } = limpiar(politica.body);
  return { titulo: titulo ?? politica.title, actualizacion, html };
}
