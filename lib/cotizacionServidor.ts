// cotizacionServidor.ts — cada pre-cotización enviada es un PEDIDO BORRADOR de
// Shopify (Carla, 2026-10-12).
//
// Por qué un borrador: el vendedor la encuentra en Shopify (Pedidos → Borradores)
// con los datos del cliente y las piezas a precio congelado; desde ahí ajusta
// descuento/envío, manda liga de pago o la convierte en pedido. Los borradores no
// cuestan nada en el plan Basic.
//
// Las reglas de compra (lib/reglas, "solo cotizar", monto alto) se respetan: el
// borrador tiene liga de pago (`invoiceUrl`), pero el sitio NUNCA la pide ni la
// muestra. Solo el vendedor puede mandarla desde el admin.
//
// El documento que vio el cliente se guarda tal cual en el metafield
// `homea.cotizacion` (JSON) del borrador, y su liga pública es /c/<ref>: el id del
// borrador en base 36 + una firma HMAC, para que no se puedan adivinar las demás.
// Nada personal viaja en la URL.

import { ATRIBUTO_TONO, tonoDe } from "@/lib/coloresMarca";
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { productoPorSku } from "@/lib/catalogo";
import type { DatosCliente, PartidaCotizacion, PartidaRef } from "@/lib/cotizacion";
import { adminFetch } from "@/lib/shopify/admin";
import { productoVivoPorSku } from "@/lib/shopify/catalogoVivo";
import { lineaSpec, nombreYSerie } from "@/lib/shopify/htmlCatalogo";

const c2 = (n: number) => Math.round(n * 100) / 100;

/** Partida + variante de Shopify (sin variante = pieza fuera de Shopify, precio por confirmar). */
export type PartidaArmada = PartidaCotizacion & { variantId: string | null };

/** Una partida en la moneda original y sin IVA, con los precios vivos de Shopify. */
export async function armarPartida(sku: string, cantidad: number, codigoTono?: string): Promise<PartidaArmada | null> {
  const vivo = await productoVivoPorSku(sku);
  // El tono solo vale en la variante Standard Color de una pieza con colores.
  const tono = vivo?.color && /^standard/i.test(vivo.color) ? tonoDe(codigoTono)?.nombre : undefined;
  if (vivo) {
    const { nombre, serie } = nombreYSerie(vivo.titulo);
    const factor = vivo.mxnLista ? vivo.mxn / vivo.mxnLista : 1;
    const usd = vivo.usdLista;
    const lista = usd !== null ? usd : (vivo.mxnLista ?? vivo.mxn);
    const unitario = usd !== null ? c2(usd * factor) : vivo.mxn;
    return {
      sku: vivo.sku,
      cantidad,
      marca: vivo.marca,
      nombre,
      serie,
      descripcion: [...lineaSpec(vivo).filter((s) => s !== vivo.sku), ...(tono ? [tono] : [])].join(" · "),
      ...(tono ? { tono } : {}),
      imagen: vivo.imagenes[0]?.url ?? null,
      ficha: `/producto/${vivo.slug}`,
      moneda: usd !== null ? "USD" : "MXN",
      lista,
      descuento: c2(lista - unitario),
      enStock: vivo.enStock,
      variantId: vivo.variantId,
    };
  }
  const indexado = productoPorSku(sku);
  if (!indexado) return null;
  return {
    sku: indexado.sku,
    cantidad,
    marca: indexado.marca,
    nombre: indexado.nombre,
    serie: indexado.serie,
    descripcion: "",
    imagen: indexado.imagen,
    ficha: indexado.ficha,
    moneda: indexado.moneda,
    lista: indexado.precio,
    descuento: 0,
    enStock: false,
    preliminar: true,
    variantId: null,
  };
}

/* ---------- Liga pública /c/<ref> ---------------------------------------- */

const PREFIJO_GID = "gid://shopify/DraftOrder/";

function firma(id36: string): string {
  const secreto = process.env.SHOPIFY_ADMIN_CLIENT_SECRET ?? "";
  return createHmac("sha256", `precotizacion:${secreto}`).update(id36).digest("hex").slice(0, 10);
}

/** gid del borrador → "k3f9x2q1m-1a2b3c4d5e". */
export function refDe(gid: string): string {
  const id36 = BigInt(gid.replace(PREFIJO_GID, "")).toString(36);
  return `${id36}-${firma(id36)}`;
}

/** "k3f9x2q1m-1a2b3c4d5e" → gid del borrador, solo si la firma es nuestra. */
export function gidDe(ref: string): string | null {
  const m = /^([0-9a-z]{4,14})-([0-9a-f]{10})$/.exec(ref.trim().toLowerCase());
  if (!m || !process.env.SHOPIFY_ADMIN_CLIENT_SECRET) return null;
  const esperada = Buffer.from(firma(m[1]));
  const recibida = Buffer.from(m[2]);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  let numero = 0n;
  for (const ch of m[1]) numero = numero * 36n + BigInt(Number.parseInt(ch, 36));
  return `${PREFIJO_GID}${numero}`;
}

/** "#D12" → "HW-D12": el folio del documento es el número del borrador en Shopify. */
export const folioDeBorrador = (nombre: string) => `HW-${nombre.replace(/^#/, "")}`;

/* ---------- Borrador ------------------------------------------------------ */

/** Lo que se guarda en el metafield: el documento exactamente como lo vio el cliente. */
export interface DocumentoGuardado {
  v: 1;
  fechaIso: string;
  datos: DatosCliente;
  partidas: PartidaCotizacion[];
}

export interface PreCotizacionCreada {
  ref: string;
  folio: string;
  fechaIso: string;
  partidas: PartidaCotizacion[];
}

type UserError = { field: string[] | null; message: string };
type Borrador = { id: string; name: string; createdAt: string };

const CREAR = /* GraphQL */ `
  mutation crearPreCotizacion($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { id name createdAt }
      userErrors { field message }
    }
  }
`;

const ACTUALIZAR = /* GraphQL */ `
  mutation actualizarPreCotizacion($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder { id name createdAt }
      userErrors { field message }
    }
  }
`;

const LEER = /* GraphQL */ `
  query leerPreCotizacion($id: ID!) {
    draftOrder(id: $id) {
      id
      name
      createdAt
      status
      metafield(namespace: "homea", key: "cotizacion") { value }
    }
  }
`;

const CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const n2 = (x: number) =>
  new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);

function entradaBorrador(partidas: PartidaArmada[], datos: DatosCliente, fechaIso: string) {
  const documento: DocumentoGuardado = {
    v: 1,
    fechaIso,
    datos,
    partidas: partidas.map(({ variantId: _v, ...p }) => p),
  };
  const contacto = [
    datos.nombre,
    `Tel. ${datos.telefono}`,
    [datos.ciudad, datos.cp].filter(Boolean).join(" "),
    datos.correo,
  ].filter(Boolean);
  return {
    // El vendedor lo ve en el admin tal cual; el teléfono no va en `phone` porque
    // Shopify rechaza los que no estén en formato internacional.
    note: [
      "Pre-cotización enviada desde homea.mx.",
      contacto.join(" · "),
      datos.proyecto ? `Proyecto: ${datos.proyecto}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    tags: ["pre-cotizacion-web"],
    ...(CORREO.test(datos.correo) ? { email: datos.correo } : {}),
    visibleToCustomer: false,
    customAttributes: [
      { key: "Nombre", value: datos.nombre },
      { key: "Teléfono", value: datos.telefono },
      { key: "Ciudad", value: datos.ciudad },
      { key: "CP", value: datos.cp },
      { key: "Correo", value: datos.correo },
      { key: "Proyecto", value: datos.proyecto },
    ].filter((a) => a.value),
    lineItems: partidas.map((p) => {
      const atributos = [
        { key: "Precio de lista sin IVA", value: `${n2(p.lista)} ${p.moneda}` },
        ...(p.descuento > 0 ? [{ key: "Descuento por pieza", value: `${n2(p.descuento)} ${p.moneda}` }] : []),
        { key: "Disponibilidad", value: p.enStock ? "En stock" : "Bajo pedido" },
        ...(p.tono ? [{ key: ATRIBUTO_TONO, value: p.tono }] : []),
      ];
      return p.variantId
        ? { variantId: p.variantId, quantity: p.cantidad, customAttributes: atributos }
        : {
            // Pieza fuera de Shopify: línea libre en $0 para que el vendedor ponga el precio.
            title: `${p.marca} · ${p.nombre} (${p.sku}) · precio por confirmar`,
            sku: p.sku,
            quantity: p.cantidad,
            originalUnitPriceWithCurrency: { amount: "0", currencyCode: "MXN" },
            customAttributes: atributos,
          };
    }),
    metafields: [{ namespace: "homea", key: "cotizacion", type: "json", value: JSON.stringify(documento) }],
  };
}

/**
 * Crea el borrador (o actualiza el que ya mandó este mismo cliente si cambió algo
 * en el modal, para no dejar borradores duplicados). `null` si Shopify no responde:
 * quien llama cae a la liga sin guardar (/cotizacion?p=…) y el cliente no se atora.
 */
export async function guardarPreCotizacion(
  refs: PartidaRef[],
  datos: DatosCliente,
  refAnterior?: string,
): Promise<PreCotizacionCreada | null> {
  const partidas = (await Promise.all(refs.map((r) => armarPartida(r.sku, r.cantidad, r.tono)))).filter(
    (x): x is PartidaArmada => x !== null,
  );
  if (!partidas.length) return null;

  const fechaIso = new Date().toISOString();
  const input = entradaBorrador(partidas, datos, fechaIso);
  const anterior = refAnterior ? gidDe(refAnterior) : null;

  let borrador: Borrador | null = null;
  if (anterior) {
    const r = await adminFetch<{ draftOrderUpdate: { draftOrder: Borrador | null; userErrors: UserError[] } }>(
      ACTUALIZAR,
      { id: anterior, input },
      10000,
    );
    borrador = r?.draftOrderUpdate.draftOrder ?? null;
  }
  if (!borrador) {
    const r = await adminFetch<{ draftOrderCreate: { draftOrder: Borrador | null; userErrors: UserError[] } }>(
      CREAR,
      { input },
      10000,
    );
    if (r?.draftOrderCreate.userErrors.length) {
      console.warn("[pre-cotizacion] Shopify rechazó el borrador:", r.draftOrderCreate.userErrors.map((e) => e.message).join(" · "));
    }
    borrador = r?.draftOrderCreate.draftOrder ?? null;
  }
  if (!borrador) return null;

  return {
    ref: refDe(borrador.id),
    folio: folioDeBorrador(borrador.name),
    fechaIso,
    partidas: partidas.map(({ variantId: _v, ...p }) => p),
  };
}

/** El documento guardado de /c/<ref>, o null si la liga no es válida o el borrador ya no existe. */
export async function leerPreCotizacion(
  ref: string,
): Promise<(DocumentoGuardado & { folio: string }) | null> {
  const gid = gidDe(ref);
  if (!gid) return null;
  const r = await adminFetch<{
    draftOrder: { id: string; name: string; metafield: { value: string } | null } | null;
  }>(LEER, { id: gid }, 8000);
  const valor = r?.draftOrder?.metafield?.value;
  if (!r?.draftOrder || !valor) return null;
  try {
    const doc = JSON.parse(valor) as DocumentoGuardado;
    if (doc.v !== 1 || !Array.isArray(doc.partidas)) return null;
    return { ...doc, folio: folioDeBorrador(r.draftOrder.name) };
  } catch {
    return null;
  }
}
