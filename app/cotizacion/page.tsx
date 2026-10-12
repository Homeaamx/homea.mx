import type { Metadata } from "next";

import PreCotizacion from "@/components/PreCotizacion";
import { armarPartida } from "@/lib/cotizacionServidor";
import {
  datosDeQuery,
  folioDe,
  mensajeCotizacion,
  parsearPartidas,
  serializarPartidas,
  type PartidaCotizacion,
} from "@/lib/cotizacion";
import { origenPublico } from "@/lib/origen";
import { whatsappHref } from "@/lib/whatsapp";

import BotonImprimir from "./BotonImprimir";

// /cotizacion?p=SKU:cant,…&n=&t=&c=&z=&e=&y= — la pre-cotización (formato SAE
// simplificado, components/PreCotizacion.tsx) tal como la vio el cliente en el
// modal de "Mi proyecto". Se recompone en cada visita con los precios de
// Shopify (en la moneda original de cada pieza, sin tipo de cambio); no se
// guarda nada. Personal y efímera: no se indexa.
//
// Desde 2026-10-12 el modal guarda cada envío como pedido borrador y manda la
// liga /c/<ref> (app/c/[ref]). Esta página queda para las ligas ya enviadas y
// como respaldo si Shopify no responde al guardar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pre-cotización",
  robots: { index: false, follow: false },
};

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
  const url = `${await origenPublico()}/cotizacion?${new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : [])),
  ).toString()}`;

  const partidas: PartidaCotizacion[] = (await Promise.all(refs.map((r) => armarPartida(r.sku, r.cantidad)))).filter(
    (x) => x !== null,
  );
  // Mismo texto que manda el modal de "Mi proyecto" (lib/cotizacion.ts).
  const wa = whatsappHref(mensajeCotizacion(url));

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
