import type { Metadata } from "next";
import MacroGrid from "@/components/MacroGrid";
import GuideCard, { type GuideCardData } from "@/components/GuideCard";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import { getMacros, guiasDestacadas, nombreTipo, HUB_PATH } from "@/lib/guias";
import { absUrl } from "@/lib/site";

// ISR — el contenido cambia poco; revalidar 1 vez al día.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Guías de compra y asesoría",
  description:
    "Centro de guías HOMEA: guías de compra, comparativas, top picks y cómo elegir tus electrodomésticos premium por categoría.",
  alternates: { canonical: HUB_PATH },
};

export default function GuiasHubPage() {
  const macros = getMacros();
  const destacadas: GuideCardData[] = guiasDestacadas(6).map(({ macro, sub1, guia }) => ({
    titulo: guia.titulo,
    resumen: guia.resumen,
    tipo: guia.tipo,
    tipoNombre: nombreTipo(guia.tipo),
    href: guia.ruta,
    etiqueta: `${sub1?.nombre ?? macro.nombre} · ${nombreTipo(guia.tipo)}`,
  }));

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Categorías de guías HOMEA",
    itemListElement: macros.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      url: absUrl(m.ruta),
    })),
  };

  return (
    <>
      <header className="guias-hero">
        <div className="guias-hero-inner container">
          <div className="eyebrow eyebrow-bright">Centro de guías</div>
          <span className="rule-gold" />
          <h1>
            Te guiamos para <i>elegir bien</i>.
          </h1>
          <p className="sub">
            Guías de compra por categoría, comparativas y consejos de especialista — para que
            equipes tu hogar con confianza.
          </p>
        </div>
        <div className="guias-hero-crumbs container">
          <Breadcrumb crumbs={[{ nombre: "Inicio", href: "/" }, { nombre: "Guías" }]} />
        </div>
      </header>

      <section className="sec catsec">
        <div className="container">
          <div className="sec-head">
            <div className="eyebrow">Explora por categoría</div>
            <span className="rule-gold" />
            <h2>
              Encuentra tu guía <i>por espacio</i>.
            </h2>
          </div>
          <MacroGrid macros={macros} />
        </div>
      </section>

      <section className="sec tight" id="destacadas">
        <div className="container">
          <div className="sec-head">
            <div className="eyebrow">Más leídas</div>
            <span className="rule-gold" />
            <h2>
              Guías <i>destacadas</i>.
            </h2>
          </div>
          <div className="guide-grid" style={{ marginTop: 40 }}>
            {destacadas.map((c) => (
              <GuideCard key={c.href} card={c} />
            ))}
          </div>
        </div>
      </section>

      <JsonLd data={itemListLd} />
    </>
  );
}
