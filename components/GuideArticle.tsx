// GuideArticle — cuerpo editorial de una guía + secciones (cada una con su link a filtro)
// + doble CTA (Cotizar por WhatsApp / Ver todos los productos) + JSON-LD Article.
//
// El contenido editorial es placeholder por ahora (resumen + secciones del JSON);
// la redacción real se suma después sin cambiar la estructura.

import { filtroPrincipal, nombreTipo, taxonomia, type RouteNode } from "@/lib/guias";
import { absUrl, SITE_NAME } from "@/lib/site";
import CtaProducto from "./CtaProducto";
import WhatsAppCta from "./WhatsAppCta";
import JsonLd from "./JsonLd";

type GuiaNode = Extract<RouteNode, { kind: "guia" }>;

export default function GuideArticle({ node }: { node: GuiaNode }) {
  const { guia, macro, sub1 } = node;
  const categoria = sub1?.nombre ?? macro.nombre;
  const waMessage = `¡Hola! Vi la guía "${guia.titulo}" en su sitio y me interesa una cotización.`;
  const principal = filtroPrincipal(node);
  const canonical = absUrl(guia.ruta);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.titulo,
    description: guia.resumen,
    articleSection: nombreTipo(guia.tipo),
    about: categoria,
    inLanguage: "es-MX",
    datePublished: taxonomia.fecha,
    dateModified: taxonomia.fecha,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: SITE_NAME, url: absUrl("/") },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absUrl("/"),
      logo: { "@type": "ImageObject", url: absUrl("/assets/wordmark-black.png") },
    },
  };

  return (
    <article className="sec guide-article">
      <div className="container guide-article-wrap">
        <div className="guide-article-body">
          <p className="lead">{guia.resumen}</p>
          <p className="guide-article-note">
            Estamos preparando el contenido completo de esta guía. Mientras tanto, explora las
            opciones por categoría o habla con un especialista para una recomendación a tu medida.
          </p>

          {guia.secciones.map((s, i) => (
            <section className="guide-section" key={`${s.titulo}-${i}`}>
              <h2 className="guide-section-title">{s.titulo}</h2>
              <CtaProducto
                filtro={s.filtro}
                className="btn btn-ghost btn-sm"
                fallback="soon"
                waMessage={`¡Hola! Me interesa "${s.titulo}" (guía: ${guia.titulo}).`}
              >
                Ver productos
              </CtaProducto>
            </section>
          ))}
        </div>

        <aside className="guide-cta-card">
          <span className="eyebrow">¿Listo para decidir?</span>
          <span className="rule-gold" />
          <p className="guide-cta-copy">
            Un asesor de HOMEA te ayuda a elegir el equipo correcto y te cotiza al momento.
          </p>
          <div className="guide-cta-actions">
            <WhatsAppCta className="btn btn-gold btn-block" message={waMessage} label="wa_guia">
              Cotizar por WhatsApp
            </WhatsAppCta>
            <CtaProducto
              filtro={principal}
              className="btn btn-ghost btn-block"
              fallback="soon"
              waMessage={waMessage}
            >
              Ver todos los productos
            </CtaProducto>
          </div>
        </aside>
      </div>

      <JsonLd data={articleLd} />
    </article>
  );
}
