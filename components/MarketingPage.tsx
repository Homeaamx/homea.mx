// MarketingPage — renderiza el contenido principal de una página del preview
// (HTML estático del design system v2) dentro de una ruta Next, en SSG.
// - HTML del <body> → dangerouslySetInnerHTML.
// - CSS de página (<style> del <head>) → se inyecta como <style> (se perdía).
// - JS inline de página → va como <script type="text/x-homea-page"> (el navegador
//   no lo ejecuta) y components/PreviewRouter lo ejecuta en cada montaje de la
//   página, también al navegar en cliente. Antes iba por next/script, que solo
//   corre una vez por id: al volver a una página los spotlights del hero no
//   aparecían (Carla, 2026-10-13).
// - `slots`: HTML generado con datos que reemplaza marcadores <!-- slot:nombre -->
//   del preview (p. ej. las listas de precios de /marcas).

import { getMain, getScripts, getStyles } from "@/lib/preview";

export default function MarketingPage({
  file,
  slots = {},
}: {
  file: string;
  slots?: Record<string, string>;
}) {
  let html = getMain(file);
  for (const [nombre, contenido] of Object.entries(slots)) {
    // Slot de rango: `<!-- slot:x -->…<!-- /slot:x -->` envuelve contenido
    // estático de respaldo que se sustituye completo cuando hay datos vivos.
    const inicio = `<!-- slot:${nombre} -->`;
    const fin = `<!-- /slot:${nombre} -->`;
    const i = html.indexOf(inicio);
    const j = i >= 0 ? html.indexOf(fin, i) : -1;
    html =
      j >= 0
        ? html.slice(0, i) + contenido + html.slice(j + fin.length)
        : html.replace(inicio, contenido);
  }
  const css = getStyles(file);
  const js = getScripts(file);
  const id = `mp-${file.replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {js ? (
        <script
          type="text/x-homea-page"
          data-mp-script={id}
          dangerouslySetInnerHTML={{ __html: js }}
        />
      ) : null}
    </>
  );
}
