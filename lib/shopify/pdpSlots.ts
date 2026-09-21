// pdpSlots.ts — los datos vivos de la ficha de producto, en HTML.
//
// La ficha es markup del preview (design system v2) que se inyecta tal cual.
// Para meterle datos frescos sin rehacer el diseño se usa el mecanismo de slots
// que ya existe en `components/MarketingPage.tsx`: marcadores `<!-- slot:x -->`
// que el servidor sustituye. Es el mismo patrón de `lib/listasPrecios.ts` en
// /marcas.
//
// Por qué slots y no un componente de React: el HTML de la ficha se inserta con
// `dangerouslySetInnerHTML`, así que un componente ahí dentro solo podría
// montarse en el cliente — y el precio quedaría FUERA del HTML que ve Google.
// La regla de oro del proyecto (CLAUDE.md §6) no lo permite. Los slots se
// renderizan en el servidor y viajan en la respuesta.
//
// Orden de la verdad para el precio:
//   1. Shopify (Storefront API), cuando el producto ya vive ahí publicado.
//   2. Índice local del catálogo (`data/catalogo-index.json`), que es de donde
//      salen hoy los precios de las 5 fichas piloto.
// En ambos casos la equivalencia en pesos la calcula `lib/tipoCambio.ts` con el
// FIX del día: el "FIX 17.43" escrito a mano en el HTML desaparece.

import "server-only";

import { productoPorSku, type ProductoIndexado } from "@/lib/catalogo";
import { aPesos, notaTipoCambio, obtenerTipoCambio, type TipoCambio } from "@/lib/tipoCambio";

import { buscarVariante } from "./carrito";
import { monedaDeclarada } from "./normalizar";
import type { VarianteRaw } from "./respuestas";

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pesos = (n: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export interface DatosFicha {
  sku: string;
  /** Precio de lista SIN IVA, en su moneda. */
  precio: number;
  moneda: string;
  disponible: boolean;
  /** De dónde salió el precio; se registra para poder auditarlo. */
  fuente: "shopify" | "catalogo";
  variantId: string | null;
}

/**
 * Reúne los datos de la ficha. Shopify manda cuando contesta; si no (catálogo aún
 * en borrador, tienda con contraseña, API caída), el índice local sostiene la
 * página en vez de dejarla sin precio.
 */
export async function datosDeFicha(sku: string, variantId?: string): Promise<DatosFicha | null> {
  const enIndice = productoPorSku(sku);

  try {
    const variante: VarianteRaw | null = await buscarVariante(variantId ?? "", sku);
    if (variante) {
      return {
        sku,
        precio: Number.parseFloat(variante.price.amount),
        moneda: monedaDeclarada(variante),
        disponible: variante.availableForSale,
        fuente: "shopify",
        variantId: variante.id,
      };
    }
  } catch {
    // Silencio deliberado: `buscarVariante` ya avisa una vez por proceso y aquí
    // lo único que importa es que la ficha siga teniendo precio.
  }

  if (!enIndice) return null;
  return {
    sku,
    precio: enIndice.precio,
    moneda: enIndice.moneda,
    // El índice no conoce existencias: el catálogo piloto es "bajo pedido".
    disponible: false,
    fuente: "catalogo",
    variantId: variantId ?? null,
  };
}

/** Bloque de precio: cifra de lista + equivalencia en pesos con su tipo de cambio. */
function precioHtml(datos: DatosFicha, tc: TipoCambio): string {
  const cifra = pesos(datos.precio);
  const principal = `<span class="price-big figures">$${cifra}<span class="currency">${escapar(
    datos.moneda,
  )}</span> <span class="price-note">+ IVA</span></span>`;

  if (datos.moneda !== "USD") return principal;

  // Equivalencia informativa: el precio de lista sigue siendo el dólar. Se
  // muestra con IVA aparte, igual que la cifra principal, para que las dos
  // líneas se comparen sin trampa.
  const enPesos = pesos(aPesos(datos.precio, tc));
  return `${principal}
      <p class="note figures" style="margin-top:-4px" title="${escapar(notaTipoCambio(tc))}">≈ $${enPesos} MXN + IVA · TC ${tc.valor.toFixed(
        2,
      )}${tc.fecha ? ` · ${escapar(tc.fecha)}` : ""}</p>`;
}

/**
 * Todo lo que la ficha necesita del servidor, en UNA pasada: los slots de HTML y
 * los datos con los que se arma el JSON-LD. Se devuelven juntos a propósito —
 * pedirlos por separado significaría consultar Shopify dos veces por visita y,
 * peor, arriesgar que el marcado diga un precio distinto al de la página.
 */
export async function contenidoDeFicha(
  sku: string,
  variantId?: string,
): Promise<{ slots: Record<string, string>; datos: DatosFicha | null }> {
  const datos = await datosDeFicha(sku, variantId);
  if (!datos) return { slots: {}, datos: null };

  const tc = await obtenerTipoCambio();
  return { slots: { precio: precioHtml(datos, tc) }, datos };
}

/** JSON-LD del producto con el precio y la disponibilidad que se están mostrando. */
export function jsonLdProducto(
  datos: DatosFicha,
  indexado: ProductoIndexado,
  url: string,
  descripcion: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: indexado.titulo,
    sku: datos.sku,
    mpn: datos.sku,
    brand: { "@type": "Brand", name: indexado.marca },
    ...(indexado.imagen ? { image: new URL(indexado.imagen, url).toString() } : {}),
    description: descripcion,
    offers: {
      "@type": "Offer",
      priceCurrency: datos.moneda,
      price: datos.precio.toFixed(2),
      // "Bajo pedido" es PreOrder, no OutOfStock: marcar agotado un producto que
      // sí se vende bajo pedido apaga los resultados enriquecidos sin motivo.
      availability: datos.disponible
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      url,
      seller: { "@type": "Organization", name: "HOMEA" },
    },
  };
}
