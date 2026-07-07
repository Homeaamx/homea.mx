// MarketingPage — renderiza el contenido principal de una página del preview
// (HTML estático del design system v2) dentro de una ruta Next, en SSG.
// - HTML del <body> → dangerouslySetInnerHTML.
// - CSS de página (<style> del <head>) → se inyecta como <style> (se perdía).
// - JS inline de página → se ejecuta vía next/script (dangerouslySetInnerHTML no
//   ejecuta scripts): spotlights del hero, filtros, sliders, etc.

import Script from "next/script";

import { getMain, getScripts, getStyles } from "@/lib/preview";

export default function MarketingPage({ file }: { file: string }) {
  const html = getMain(file);
  const css = getStyles(file);
  const js = getScripts(file);
  const id = `mp-${file.replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {js ? (
        <Script id={id} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: js }} />
      ) : null}
    </>
  );
}
