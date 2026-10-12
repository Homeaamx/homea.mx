import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PreCotizacion from "@/components/PreCotizacion";
import { mensajeCotizacion } from "@/lib/cotizacion";
import { leerPreCotizacion } from "@/lib/cotizacionServidor";
import { origenPublico } from "@/lib/origen";
import { whatsappHref } from "@/lib/whatsapp";

import BotonImprimir from "../../cotizacion/BotonImprimir";

// /c/<ref> — la pre-cotización GUARDADA (pedido borrador de Shopify,
// lib/cotizacionServidor.ts): mismo documento, folio, fecha y precios que vio el
// cliente al enviarla, aunque se abra semanas después. La liga va firmada; sin
// firma válida, 404. Personal: no se indexa.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pre-cotización",
  robots: { index: false, follow: false },
};

export default async function PreCotizacionGuardada(props: { params: Promise<{ ref: string }> }) {
  const { ref } = await props.params;
  const doc = await leerPreCotizacion(ref);
  if (!doc) notFound();

  const url = `${await origenPublico()}/c/${ref}`;
  const wa = whatsappHref(mensajeCotizacion(url));

  return (
    <div className="cot-page">
      <div className="cot-hoja">
        <PreCotizacion folio={doc.folio} fechaIso={doc.fechaIso} partidas={doc.partidas} datos={doc.datos} />
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
