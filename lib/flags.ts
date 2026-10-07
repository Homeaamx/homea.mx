// Flags centrales del front-end.

/**
 * PLP_READY — ¿ya existe la sección de listado de productos con filtros (/productos/...)?
 *
 * Hoy es `false`: la PLP/filtros AÚN NO se construye. Mientras esté en false, todos los
 * botones de filtro (`<CtaProducto>`) NO navegan — muestran "Próximamente" o caen al
 * WhatsApp de cotización, para no producir 404.
 *
 * Cuando se construya el PLP, basta con poner esto en `true`: todos los filtros de todas
 * las guías quedan vivos sin tocar ningún componente de guías.
 *
 * // TODO PLP: al activar el PLP, mapear cada `filtro` del JSON → colección/tag de Shopify.
 *   El contrato de URL es `/productos/{leaf}/?{faceta}={valor}` (ver taxonomia-guias.json → meta).
 *   - `{leaf}`  → colección de Shopify (handle = slug del leaf; p.ej. "refrigeradores").
 *   - `tipo`, `caracteristica`, `instalacion`, `combustible`, `ancho`, `gama` → tags/metafields.
 *       Convención sugerida de tag: `{faceta}:{valor}` (p.ej. `instalacion:built-in`, `gama:premium`).
 *   - `marca` → vendor de Shopify (o tag `marca:{valor}`).
 *   Resolver estos filtros vía Storefront API (search/collection + filtros de producto).
 */
export const PLP_READY = false;

/**
 * COMPRA_DIRECTA_ACTIVA — ¿"Mi proyecto" puede cerrarse en el checkout de Shopify?
 *
 * La regla de qué se compra y qué se cotiza vive en `lib/reglas/reglaMarca.ts`
 * (marca + monto + stock, data/reglas-compra.json). Ponerlo en `false` apaga la
 * compra directa en TODO el sitio: cada proyecto sale como cotización por
 * WhatsApp, que es el modelo de venta de la casa para ticket alto.
 */
export const COMPRA_DIRECTA_ACTIVA = true;

/**
 * CHECKOUT_ABIERTO — ¿la tienda `homeashop.mx` ya NO tiene contraseña?
 *
 * Mientras esté en `false`, el botón "Finalizar compra" se muestra deshabilitado con
 * su explicación y se promueve WhatsApp: comprobado que con el candado puesto el
 * `checkoutUrl` responde 302 → /password, así que dejarlo activo sería mandar al
 * cliente a un callejón sin salida.
 *
 * // TODO CHECKOUT: ponerlo en `true` el día que se quite la contraseña de la tienda
 *   (y se redirija/`noindex` el storefront hacia homea.mx, ver CLAUDE.md §3).
 */
export const CHECKOUT_ABIERTO = false;

/**
 * Histórico: los 5 Gaggenau del piloto se podían comprar como excepción para
 * probar el checkout. Con la regla por marca (2026-10-06) Gaggenau es "solo
 * cotizar" y la excepción se retiró; la lista queda solo como referencia de qué
 * fichas son las curadas del preview.
 */
export const SKUS_PILOTO_COMPRABLES = [
  "AW442720",
  "BOP250612",
  "DF480701",
  "RB282705",
  "VG295250CA",
] as const;
