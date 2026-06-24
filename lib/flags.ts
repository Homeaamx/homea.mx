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
