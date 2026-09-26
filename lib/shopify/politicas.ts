// politicas.ts — Aviso de privacidad y Términos: el texto legal vive en Shopify.
//
// Una sola fuente: Carla los redacta en el admin (Configuración → Políticas) y el
// checkout de Shopify ya los enseña desde ahí. El sitio los lee por Storefront API
// y los pinta con el diseño de HOMEA, así que un cambio en el admin llega solo a
// /aviso-de-privacidad y /terminos (revalidación diaria) sin tocar código.

import "server-only";

import { shopifyFetchOpcional } from "./cliente";

export type TipoPolitica = "privacyPolicy" | "termsOfService";

export type Politica = {
  titulo: string;
  /** "Última actualización: …" tal como viene en el texto, si lo trae. */
  actualizacion: string | null;
  /** HTML ya limpio: sin el <h1> (lo pone la página) ni estilos del editor. */
  html: string;
};

const CONSULTA = /* GraphQL */ `
  query politica {
    shop {
      privacyPolicy { title body }
      termsOfService { title body }
    }
  }
`;

type Respuesta = {
  shop: Record<TipoPolitica, { title: string; body: string } | null>;
};

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

  return { html: html.trim(), titulo, actualizacion };
}

/** `null` si Shopify no responde o la política no existe: la página tiene plan B. */
export async function obtenerPolitica(tipo: TipoPolitica): Promise<Politica | null> {
  const datos = await shopifyFetchOpcional<Respuesta>(CONSULTA, {
    revalidate: 86400,
    tags: ["politicas"],
  });
  const politica = datos?.shop[tipo];
  if (!politica?.body) return null;

  const { html, titulo, actualizacion } = limpiar(politica.body);
  return { titulo: titulo ?? politica.title, actualizacion, html };
}
