// Listas de precios por marca (/marcas#listas-de-precios).
//
// Fuente: data/listas-precios.json. Cada documento se muestra como descarga
// cuando tiene `url` (PDF re-hospedado en Shopify Files) y como "Próximamente"
// con salida a WhatsApp mientras siga pendiente. El HTML se inserta en el slot
// <!-- slot:listas-precios --> de preview/marcas.html (ver MarketingPage).

import listas from "@/data/listas-precios.json";
import { whatsappHref } from "@/lib/whatsapp";

interface Documento {
  titulo: string;
  url: string | null;
}

interface Marca {
  marca: string;
  documentos: Documento[];
}

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function documentoHtml(marca: string, d: Documento): string {
  const titulo = escapar(d.titulo);
  if (d.url) {
    return `<a href="${escapar(d.url)}" target="_blank" rel="noopener">⬇ ${titulo}</a> <span class="dot-sep">·</span> <span class="caption">PDF</span>`;
  }
  const wa = whatsappHref(`¡Hola! Me interesa la lista de precios de ${marca} (${d.titulo}).`);
  return `${titulo} <span class="dot-sep">·</span> <span class="caption">Próximamente ·</span> <a href="${escapar(wa)}" target="_blank" rel="noopener">solicítala por WhatsApp</a>`;
}

/** Bloque HTML con una fila por marca (etiqueta) y sus documentos. */
export function listasPreciosHtml(): string {
  const marcas = [...(listas.marcas as Marca[])].sort((a, b) => a.marca.localeCompare(b.marca, "es"));
  const filas = marcas
    .map(
      (m) =>
        `<div class="spec-row"><span class="spec-label">${escapar(m.marca)}</span><span class="spec-value">${m.documentos
          .map((d) => documentoHtml(m.marca, d))
          .join("<br>")}</span></div>`
    )
    .join("");
  // En móvil la etiqueta de marca va encima de sus documentos (una sola columna).
  const css = `<style>@media (max-width:640px){#listas-por-marca{grid-template-columns:1fr}#listas-por-marca .spec-label{border-bottom:0;padding-bottom:0}}</style>`;
  return `${css}<div id="listas-por-marca" class="spec" style="margin-top:48px">${filas}</div>`;
}
