// GuideArticle — cuerpo de una guía del blog "Guías" de Shopify + tarjeta lateral
// con doble CTA (Cotizar por WhatsApp / Ver productos) + JSON-LD Article.
//
// El texto lo escribe Carla en Shopify (Contenido → Entradas de blog → Guías);
// llega ya limpio desde lib/shopify/guias.ts y aquí se le pone la tipografía del
// sitio (.guide-prose en styles/guias.css).

import Link from "next/link";

import { nombreTipo, rutaProductos, type RouteNode } from "@/lib/guias";
import { absUrl, SITE_NAME } from "@/lib/site";
import WhatsAppCta from "./WhatsAppCta";
import JsonLd from "./JsonLd";

type GuiaNode = Extract<RouteNode, { kind: "guia" }>;

export default function GuideArticle({ node }: { node: GuiaNode }) {
  const { guia, macro, sub1 } = node;
  const categoria = sub1?.nombre ?? macro.nombre;
  const waMessage = `¡Hola! Vi la guía "${guia.titulo}" en su sitio y me interesa una cotización.`;
  const productos = rutaProductos(macro, sub1);
  const canonical = absUrl(guia.ruta);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.titulo,
    description: guia.seo.descripcion,
    articleSection: nombreTipo(guia.tipo),
    about: categoria,
    inLanguage: "es-MX",
    datePublished: guia.publicada,
    dateModified: guia.publicada,
    ...(guia.imagen ? { image: guia.imagen.url } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: guia.autor ?? SITE_NAME, url: absUrl("/") },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absUrl("/"),
      logo: { "@type": "ImageObject", url: absUrl("/assets/wordmark-black.webp") },
    },
  };

  const fecha = new Date(guia.publicada).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="sec guide-article">
      <div className="container guide-article-wrap">
        <div className="guide-article-body">
          <p className="guide-article-meta">
            {categoria} · {nombreTipo(guia.tipo)}
            {guia.borrador ? " · Borrador (solo en desarrollo)" : ` · ${fecha}`}
          </p>
          <div className="guide-prose" dangerouslySetInnerHTML={{ __html: guia.html }} />
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
            <Link href={productos} className="btn btn-ghost btn-block" data-cta="ver-productos">
              Ver {categoria}
            </Link>
          </div>
        </aside>
      </div>

      <JsonLd data={articleLd} />
    </article>
  );
}
