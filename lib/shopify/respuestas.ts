// respuestas.ts — forma cruda de lo que devuelve la Storefront API.
//
// Solo los campos que piden `consultas.ts`. Se mantienen separados del contrato
// de la UI (`tipos.ts`) para que el esquema de Shopify no se filtre a los
// componentes.

export interface DineroRaw {
  amount: string;
  currencyCode: string;
}

export interface ImagenRaw {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

export interface VarianteRaw {
  id: string;
  sku: string | null;
  title: string;
  availableForSale: boolean;
  /** `null` cuando el token no tiene el permiso de inventario. */
  quantityAvailable: number | null;
  price: DineroRaw;
  compareAtPrice?: DineroRaw | null;
  image: ImagenRaw | null;
  product: {
    id: string;
    title: string;
    handle: string;
    vendor: string;
    tags: string[];
    availableForSale?: boolean;
  };
}

export interface LineaRaw {
  id: string;
  quantity: number;
  cost: {
    totalAmount: DineroRaw;
    amountPerQuantity: DineroRaw;
  };
  merchandise: VarianteRaw;
}

export interface CarritoRaw {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: DineroRaw;
    totalAmount: DineroRaw | null;
    totalTaxAmount: DineroRaw | null;
  };
  lines: { nodes: LineaRaw[] };
}

export interface ErrorUsuario {
  field: string[] | null;
  message: string;
  code: string | null;
}

export interface AvisoRaw {
  code: string;
  message: string;
  target: string | null;
}

/** Envoltorio común de las 4 mutaciones de carrito. */
export interface RespuestaMutacion {
  cart: CarritoRaw | null;
  userErrors: ErrorUsuario[];
  warnings?: AvisoRaw[];
}

export interface ProductoRaw {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  tags: string[];
  seo: { title: string | null; description: string | null } | null;
  featuredImage: ImagenRaw | null;
  variants: { nodes: VarianteRaw[] };
}

export interface ProductoBusquedaRaw {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: ImagenRaw | null;
  variants: { nodes: { sku: string | null; price: DineroRaw }[] };
}
