import type { Metadata } from "next";

import PreCotizacion from "@/components/PreCotizacion";
import { productoPorSku } from "@/lib/catalogo";
import {
  datosDeQuery,
  folioDe,
  mensajeCotizacion,
  parsearPartidas,
  serializarPartidas,
  type PartidaCotizacion,
} from "@/lib/cotizacion";
import { productoVivoPorSku } from "@/lib/shopify/catalogoVivo";
import { lineaSpec, nombreYSerie } from "@/lib/shopify/htmlCatalogo";
import { SITE_URL } from "@/lib/site";
import { whatsappHref } from "@/lib/whatsapp";

import BotonImprimir from "./BotonImprimir";

// /cotizacion?p=SKU:cant,…&n=&t=&c=&z=&e=&y= — la pre-cotización (formato SAE
// simplificado, components/PreCotizacion.tsx) tal como la vio el cliente en el
// modal de "Mi proyecto". Se recompone en cada visita con los precios de
// Shopify (en la moneda original de cada pieza, sin tipo de cambio); no se
// guarda nada. Personal y efímera: no se indexa.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pre-cotización",
  robots: { index: false, follow: false },
};

const c2 = (n: number) => Math.round(n * 100) / 100;

async function armarPartida(sku: string, cantidad: number): Promise<PartidaCotizacion | null> {
  const vivo = await productoVivoPorSku(sku);
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
      descripcion: lineaSpec(vivo).filter((s) => s !== vivo.sku).join(" · "),
      imagen: vivo.imagenes[0]?.url ?? null,
      ficha: `/producto/${vivo.slug}`,
      moneda: usd !== null ? "USD" : "MXN",
      lista,
      descuento: c2(lista - unitario),
      enStock: vivo.enStock,
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
  };
}

export default async function CotizacionPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const uno = (clave: string) => {
    const v = sp[clave];
    return Array.isArray(v) ? v[0] : v;
  };
  const refs = parsearPartidas(uno("p"));
  const p = serializarPartidas(refs);
  const datos = datosDeQuery(uno);
  const hoy = new Date();
  const folio = folioDe(p, hoy);
  const url = `${SITE_URL}/cotizacion?${new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : [])),
  ).toString()}`;

  const partidas = (await Promise.all(refs.map((r) => armarPartida(r.sku, r.cantidad)))).filter(
    (x): x is PartidaCotizacion => x !== null,
  );
  // Mismo texto que manda el modal de "Mi proyecto" (lib/cotizacion.ts).
  const wa = whatsappHref(mensajeCotizacion(folio, url, datos, partidas, hoy));

  return (
    <div className="cot-page">
      <div className="cot-hoja">
        <PreCotizacion folio={folio} fechaIso={hoy.toISOString()} partidas={partidas} datos={datos} />
        <footer className="cot-acciones no-print">
          <a className="btn btn-primary" href={wa} target="_blank" rel="noopener" data-track="whatsapp_click" data-label="cotizacion_enviar">
            Enviar a un ejecutivo por WhatsApp <span className="ar">→</span>
          </a>
          <BotonImprimir />
        </footer>
      </div>
    </div>
  );
}
