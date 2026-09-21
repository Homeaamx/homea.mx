// consultas.ts — documentos GraphQL de la Storefront API.
//
// Sin codegen a propósito: el repo no tiene más tooling que Next y una
// dependencia de generación por 6 consultas no se paga sola. Los tipos de la
// respuesta viven en `respuestas.ts` y se validan contra el esquema al primer
// token real (ver docs/DEPLOY.md §3).

/** Campos del carrito. Lo devuelven TODAS las operaciones → un solo normalizador. */
export const FRAGMENTO_CARRITO = /* GraphQL */ `
  fragment CarritoCampos on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
          amountPerQuantity { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            sku
            title
            availableForSale
            quantityAvailable
            price { amount currencyCode }
            image { url altText width height }
            product { id title handle vendor tags }
          }
        }
      }
    }
  }
`;

export const CONSULTA_CARRITO = /* GraphQL */ `
  ${FRAGMENTO_CARRITO}
  query Carrito($id: ID!) @inContext(country: MX, language: ES) {
    cart(id: $id) { ...CarritoCampos }
  }
`;

export const CREAR_CARRITO = /* GraphQL */ `
  ${FRAGMENTO_CARRITO}
  mutation CrearCarrito($lineas: [CartLineInput!]) @inContext(country: MX, language: ES) {
    cartCreate(input: { lines: $lineas }) {
      cart { ...CarritoCampos }
      userErrors { field message code }
      warnings { code message target }
    }
  }
`;

export const AGREGAR_LINEAS = /* GraphQL */ `
  ${FRAGMENTO_CARRITO}
  mutation AgregarLineas($id: ID!, $lineas: [CartLineInput!]!) @inContext(country: MX, language: ES) {
    cartLinesAdd(cartId: $id, lines: $lineas) {
      cart { ...CarritoCampos }
      userErrors { field message code }
      warnings { code message target }
    }
  }
`;

export const ACTUALIZAR_LINEAS = /* GraphQL */ `
  ${FRAGMENTO_CARRITO}
  mutation ActualizarLineas($id: ID!, $lineas: [CartLineUpdateInput!]!) @inContext(country: MX, language: ES) {
    cartLinesUpdate(cartId: $id, lines: $lineas) {
      cart { ...CarritoCampos }
      userErrors { field message code }
      warnings { code message target }
    }
  }
`;

export const QUITAR_LINEAS = /* GraphQL */ `
  ${FRAGMENTO_CARRITO}
  mutation QuitarLineas($id: ID!, $ids: [ID!]!) @inContext(country: MX, language: ES) {
    cartLinesRemove(cartId: $id, lineIds: $ids) {
      cart { ...CarritoCampos }
      userErrors { field message code }
      warnings { code message target }
    }
  }
`;

/** Campos de variante que necesita tanto el pre-chequeo del carrito como la PDP. */
export const FRAGMENTO_VARIANTE = /* GraphQL */ `
  fragment VarianteCampos on ProductVariant {
    id
    sku
    title
    availableForSale
    quantityAvailable
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
    image { url altText width height }
    product { id title handle vendor tags availableForSale }
  }
`;

/** Pre-chequeo antes de cualquier alta: ¿existe, está publicada, en qué moneda? */
export const CONSULTA_VARIANTE = /* GraphQL */ `
  ${FRAGMENTO_VARIANTE}
  query Variante($id: ID!) @inContext(country: MX, language: ES) {
    node(id: $id) { ...VarianteCampos }
  }
`;

/**
 * Plan B del pre-chequeo: los `data-cart-vid` del HTML son IDs fijos y una
 * reimportación del catálogo los rota. Sin esta consulta, ese día los 5 botones
 * dejarían de funcionar en silencio.
 */
export const CONSULTA_VARIANTE_POR_SKU = /* GraphQL */ `
  ${FRAGMENTO_VARIANTE}
  query VariantePorSku($consulta: String!) @inContext(country: MX, language: ES) {
    products(first: 5, query: $consulta) {
      nodes {
        variants(first: 25) { nodes { ...VarianteCampos } }
      }
    }
  }
`;

/** Producto completo para la ficha (PDP). */
export const CONSULTA_PRODUCTO = /* GraphQL */ `
  ${FRAGMENTO_VARIANTE}
  query Producto($handle: String!) @inContext(country: MX, language: ES) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      availableForSale
      tags
      seo { title description }
      featuredImage { url altText width height }
      variants(first: 10) { nodes { ...VarianteCampos } }
    }
  }
`;

/**
 * Búsqueda del catálogo. Se usa `search`, NO `predictiveSearch`: el overlay
 * pagina ("Página N de M") y predictive topa en 10 resultados sin cursores ni
 * `totalCount`.
 */
export const CONSULTA_BUSQUEDA = /* GraphQL */ `
  query Buscar($consulta: String!, $primeros: Int!) @inContext(country: MX, language: ES) {
    search(query: $consulta, types: PRODUCT, first: $primeros) {
      totalCount
      nodes {
        ... on Product {
          id
          handle
          title
          vendor
          productType
          tags
          featuredImage { url altText }
          variants(first: 1) {
            nodes { sku price { amount currencyCode } }
          }
        }
      }
    }
  }
`;

/** Diagnóstico: responde la pregunta de la moneda de liquidación de la tienda. */
export const CONSULTA_TIENDA = /* GraphQL */ `
  query Tienda {
    shop {
      name
      primaryDomain { url }
      paymentSettings { currencyCode enabledPresentmentCurrencies }
    }
  }
`;
