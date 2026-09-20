// tipos.ts — contrato propio del carrito, desacoplado del esquema de Shopify.
//
// Misma doctrina que `ResultadoBusqueda` en lib/catalogo.ts: los componentes
// consumen ESTE tipo, no la respuesta cruda de la API. Así, si mañana cambia un
// campo del esquema (o se cambia de motor), el cambio se absorbe en
// `normalizar.ts` y ningún componente se entera.

export interface Dinero {
  /** Monto numérico, sin formato. El formateo vive en `formatearDinero`. */
  monto: number;
  moneda: string;
}

export interface LineaCarrito {
  /** ID de la línea EN EL CARRITO (no de la variante): es lo que se actualiza/borra. */
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  imagen: string | null;
  /** Ruta de la PDP, resuelta por SKU contra el índice del catálogo. */
  ficha: string | null;
  cantidad: number;
  precioUnitario: Dinero;
  total: Dinero;
  disponible: boolean;
  /** Existencias conocidas; `null` = el token no tiene permiso de inventario. */
  maximo: number | null;
}

export type MotivoBloqueo =
  /** La moneda del carrito no cuadra con la del producto → riesgo de cobrar de menos. */
  | "moneda-incoherente"
  /** La tienda sigue con contraseña: el checkout redirige a /password. */
  | "tienda-con-password";

export interface Carrito {
  id: string | null;
  cantidadTotal: number;
  subtotal: Dinero;
  /** IVA y envío los calcula Shopify en el checkout; puede venir vacío antes. */
  impuesto: Dinero | null;
  total: Dinero | null;
  checkoutUrl: string | null;
  lineas: LineaCarrito[];
  /**
   * Cuando está puesto, el carrito se muestra pero **el checkout se deshabilita**.
   * Es la red de seguridad contra cobrar un precio equivocado.
   */
  bloqueo: MotivoBloqueo | null;
  /** True cuando los datos vienen del carrito simulado de desarrollo. */
  simulado: boolean;
}

/** Aviso puntual de una operación (sin existencia, tope de stock, error de Shopify). */
export interface Aviso {
  tipo: "error" | "info";
  mensaje: string;
  /** Salida a WhatsApp cuando la compra directa no procede. */
  whatsapp?: string;
}

export interface ResultadoCarrito {
  carrito: Carrito;
  aviso?: Aviso;
  /** Cuando la regla de moneda intercepta: el cliente abre esta URL de WhatsApp. */
  redireccion?: string;
}

export const CARRITO_VACIO: Carrito = {
  id: null,
  cantidadTotal: 0,
  subtotal: { monto: 0, moneda: "MXN" },
  impuesto: null,
  total: null,
  checkoutUrl: null,
  lineas: [],
  bloqueo: null,
  simulado: false,
};

/** "$193,603.20 MXN" — se conserva el formato exacto que ya usaba cart.js. */
export function formatearDinero({ monto, moneda }: Dinero): string {
  // `currencyDisplay` de Intl pintaría "USD 6,163.52"; el diseño v2 pide el
  // símbolo delante y el código detrás, así que el código se añade a mano.
  const numero = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
  return `$${numero} ${moneda}`;
}
