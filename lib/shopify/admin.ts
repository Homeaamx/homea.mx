// admin.ts — Admin API de Shopify, y solo para una cosa: dar de alta contactos.
//
// Por qué aquí y no en un servicio aparte: la "base de datos de correos" que
// pidió Carla ya está pagada. Los contactos viven como clientes de Shopify, y
// **Shopify Messaging** (antes Shopify Email) les manda campañas desde el admin
// con 10,000 correos gratis al mes en el plan Basic. Cero proveedor nuevo, cero
// factura nueva, y el día que se cambie de herramienta la lista se exporta en un
// CSV desde el propio admin.
//
// Server-only a propósito: el token de Admin puede leer y escribir la tienda
// entera; jamás puede viajar al navegador.
//
// Ojo con el dominio: la Admin API **solo** responde en el `.myshopify.com`
// (0fmwh5-sv.myshopify.com), no en `homeashop.mx`. Por eso lleva variable propia
// y no reusa NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.
//
// Autenticación — client credentials grant. Desde 2026 ya no se pueden crear las
// apps viejas del admin que entregaban un token fijo `shpat_…`. Una app del Dev
// Dashboard que actúa sobre las tiendas de su propia organización usa este flujo:
// el servidor cambia client_id + client_secret por un token **que caduca a las 24 h**
// y se vuelve a pedir cuando hace falta. Por eso aquí no hay un token en el .env,
// hay credenciales.
//
// Doctrina de errores, igual que en cliente.ts: nunca lanza al azar. Devuelve un
// resultado que quien llama pueda ignorar — capturar un correo NUNCA debe romper
// el camino del visitante hacia WhatsApp.

import "server-only";

const DOMINIO = process.env.SHOPIFY_ADMIN_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
/** Shopify sostiene cada versión 12 meses; subirla es un cambio consciente. */
const VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-07";

export const HAY_ADMIN = Boolean(DOMINIO && CLIENT_ID && CLIENT_SECRET);

/** Alta de contacto: no puede colgar la respuesta del formulario. */
const TIMEOUT_MS = 4000;

export type ResultadoAlta =
  /** Contacto nuevo, suscrito a marketing. */
  | { ok: true; estado: "creado" }
  /** Ya existía: se le actualizó el consentimiento. */
  | { ok: true; estado: "actualizado" }
  /** Se guardó el contacto pero sin marketing (no marcó la casilla). */
  | { ok: true; estado: "sin-consentimiento" }
  | { ok: false; motivo: "sin-configurar" | "rechazado" | "red" };

/** Avisos una sola vez por proceso, para no ensuciar el log con cada envío. */
const avisado = new Set<string>();
function avisar(clave: string, mensaje: string): void {
  if (avisado.has(clave)) return;
  avisado.add(clave);
  console.warn(`[shopify-admin] ${mensaje}`);
}

type RespuestaGraphQL<T> = {
  data?: T;
  errors?: { message: string }[];
};

/** Token vivo en memoria del proceso. Caduca a las 24 h; se pide de nuevo solo. */
let token: string | null = null;
let tokenCaduca = 0;

/**
 * Cambia las credenciales de la app por un token de acceso. Se guarda en memoria
 * y se renueva un minuto antes de caducar — en serverless cada instancia pide el
 * suyo, que es barato y no requiere estado compartido.
 */
async function obtenerToken(): Promise<string | null> {
  if (token && Date.now() < tokenCaduca) return token;

  try {
    const respuesta = await fetch(`https://${DOMINIO}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID as string,
        client_secret: CLIENT_SECRET as string,
      }),
      cache: "no-store",
    });

    if (!respuesta.ok) {
      avisar("oauth", `Shopify rechazó las credenciales de la app (HTTP ${respuesta.status}).`);
      return null;
    }

    const json = (await respuesta.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) {
      avisar("oauth-vacio", "Shopify no devolvió token de acceso.");
      return null;
    }

    token = json.access_token;
    // `expires_in` viene en segundos; se renueva un minuto antes por seguridad.
    tokenCaduca = Date.now() + ((json.expires_in ?? 86400) - 60) * 1000;
    return token;
  } catch (error) {
    avisar("oauth-red", error instanceof Error ? error.message : "fallo pidiendo el token");
    return null;
  }
}

async function adminFetch<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!HAY_ADMIN) {
    avisar(
      "sin-credenciales",
      "Faltan SHOPIFY_ADMIN_DOMAIN / SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET: no se guardan contactos.",
    );
    return null;
  }

  const acceso = await obtenerToken();
  if (!acceso) return null;

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(`https://${DOMINIO}/admin/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": acceso,
      },
      body: JSON.stringify({ query, variables }),
      signal: control.signal,
      cache: "no-store",
    });

    if (!respuesta.ok) {
      avisar(`http-${respuesta.status}`, `Shopify respondió HTTP ${respuesta.status}.`);
      return null;
    }

    const json = (await respuesta.json()) as RespuestaGraphQL<T>;
    if (json.errors?.length) {
      avisar("consulta", json.errors.map((e) => e.message).join(" · "));
      return null;
    }
    return json.data ?? null;
  } catch (error) {
    avisar("red", error instanceof Error ? error.message : "fallo de red");
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

type UserError = { field: string[] | null; message: string };

const CREAR = /* GraphQL */ `
  mutation crearContacto($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const BUSCAR = /* GraphQL */ `
  query buscarContacto($consulta: String!) {
    customers(first: 1, query: $consulta) {
      nodes {
        id
      }
    }
  }
`;

const CONSENTIR = /* GraphQL */ `
  mutation consentirContacto($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/** El consentimiento nace de una casilla en el formulario: opt-in simple. */
const CONSENTIMIENTO = {
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
} as const;

export type Contacto = {
  correo: string;
  nombre?: string;
  ciudad?: string;
  /** Marcó la casilla de "quiero recibir novedades". */
  consiente: boolean;
  /** Etiquetas para saber de dónde salió el contacto (campaña, página). */
  etiquetas?: string[];
};

/**
 * Da de alta el contacto en Shopify. Si ya existía, solo actualiza su
 * consentimiento — Shopify rechaza los correos duplicados y eso no es un error.
 */
export async function guardarContacto(contacto: Contacto): Promise<ResultadoAlta> {
  if (!HAY_ADMIN) return { ok: false, motivo: "sin-configurar" };

  const { correo, nombre, ciudad, consiente, etiquetas = [] } = contacto;
  // Un nombre completo en un solo campo: lo que va antes del primer espacio es
  // el nombre y el resto los apellidos. Sin apellido, Shopify lo deja vacío.
  const [pila, ...resto] = (nombre ?? "").trim().split(/\s+/).filter(Boolean);

  const creado = await adminFetch<{
    customerCreate: { customer: { id: string } | null; userErrors: UserError[] };
  }>(CREAR, {
    input: {
      email: correo,
      ...(pila ? { firstName: pila } : {}),
      ...(resto.length ? { lastName: resto.join(" ") } : {}),
      ...(ciudad ? { addresses: [{ city: ciudad, countryCode: "MX" }] } : {}),
      ...(consiente ? { emailMarketingConsent: CONSENTIMIENTO } : {}),
      ...(etiquetas.length ? { tags: etiquetas } : {}),
    },
  });

  if (!creado) return { ok: false, motivo: "red" };

  if (creado.customerCreate.customer) {
    return { ok: true, estado: consiente ? "creado" : "sin-consentimiento" };
  }

  const errores = creado.customerCreate.userErrors;
  const duplicado = errores.some((e) => /taken|already/i.test(e.message));
  if (!duplicado) {
    avisar("rechazado", errores.map((e) => e.message).join(" · ") || "alta rechazada");
    return { ok: false, motivo: "rechazado" };
  }

  // Ya estaba en la lista. Si ahora sí consiente, se actualiza; si no, nada que hacer.
  if (!consiente) return { ok: true, estado: "sin-consentimiento" };

  const encontrado = await adminFetch<{ customers: { nodes: { id: string }[] } }>(BUSCAR, {
    consulta: `email:"${correo.replace(/"/g, "")}"`,
  });
  const id = encontrado?.customers.nodes[0]?.id;
  if (!id) return { ok: false, motivo: "rechazado" };

  const actualizado = await adminFetch<{
    customerEmailMarketingConsentUpdate: { userErrors: UserError[] };
  }>(CONSENTIR, {
    input: { customerId: id, emailMarketingConsent: CONSENTIMIENTO },
  });

  if (!actualizado) return { ok: false, motivo: "red" };
  if (actualizado.customerEmailMarketingConsentUpdate.userErrors.length) {
    avisar(
      "consentimiento",
      actualizado.customerEmailMarketingConsentUpdate.userErrors.map((e) => e.message).join(" · "),
    );
    return { ok: false, motivo: "rechazado" };
  }
  return { ok: true, estado: "actualizado" };
}
