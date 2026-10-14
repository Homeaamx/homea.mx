import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import MarketingPage from "@/components/MarketingPage";
import { getMain } from "@/lib/preview";

export const revalidate = 86400;

const ARCHIVO = "preguntas-frecuentes.html";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Compras, envíos, instalación, garantías, devoluciones y proyectos: respuestas claras para comprar con confianza en HOMEA.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

/** Texto plano de un fragmento HTML (las respuestas solo traen texto y entidades básicas). */
function texto(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * FAQPage para resultados enriquecidos. Se arma con las mismas preguntas del
 * HTML del preview (una sola fuente: se edita preview/preguntas-frecuentes.html).
 */
function faqJsonLd() {
  const html = getMain(ARCHIVO);
  const preguntas = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(
    ([, q, a]) => ({
      "@type": "Question",
      name: texto(q),
      acceptedAnswer: { "@type": "Answer", text: texto(a) },
    }),
  );
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: preguntas };
}

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <MarketingPage file={ARCHIVO} />
    </>
  );
}
