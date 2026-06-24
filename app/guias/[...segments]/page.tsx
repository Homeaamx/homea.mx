import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  allRouteSegments,
  buildBreadcrumb,
  categoriasDeGuias,
  getRoute,
  getTiposDeGuia,
  guiasDeMacro,
  leafFiltros,
  nombreTipo,
  type RouteNode,
} from "@/lib/guias";
import { absUrl } from "@/lib/site";
import type { Guia, Macrocategoria, Subcategoria1 } from "@/types/guias";

import PageHero from "@/components/PageHero";
import CategoryList from "@/components/CategoryList";
import GuideTypeFilter from "@/components/GuideTypeFilter";
import GuideArticle from "@/components/GuideArticle";
import JsonLd from "@/components/JsonLd";
import { type GuideCardData } from "@/components/GuideCard";

// ISR — revalidar 1 vez al día.
export const revalidate = 86400;
// Cualquier ruta no precomputada que no exista en el JSON → 404 (no se inventa).
export const dynamicParams = false;

interface Params {
  segments: string[];
}

// ---- Por qué un catch-all en vez de archivos [macro]/[sub1] + [macro]/[tipo] ----
// Next.js NO permite dos slugs distintos en el mismo nivel ([sub1] vs [tipo] bajo [macro]).
// Como la jerarquía es de profundidad mixta (índices de 2 y 3 niveles), un único catch-all
// resuelve todas las rutas del JSON sin colisión. El render se delega a vistas dedicadas.
export function generateStaticParams(): Params[] {
  return allRouteSegments().map((segments) => ({ segments }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const node = getRoute(params.segments);
  if (!node) return {};

  if (node.kind === "macro") {
    const canonical = node.macro.ruta;
    return {
      title: `Guías de ${node.macro.nombre}`,
      description: `Guías de compra, comparativas y cómo elegir en ${node.macro.nombre}. Asesoría experta de HOMEA.`,
      alternates: { canonical },
    };
  }
  if (node.kind === "categoria") {
    return {
      title: `Guías de ${node.sub1.nombre}`,
      description: `Guías de ${node.sub1.nombre} (${node.macro.nombre}): qué buscar, comparativas y top picks. Asesoría HOMEA.`,
      alternates: { canonical: node.sub1.rutaGuias },
    };
  }
  // guía
  return {
    title: node.guia.titulo,
    description: node.guia.resumen,
    alternates: { canonical: node.guia.ruta },
  };
}

// --------------------------------------------------------------------------
// Helpers de presentación.
// --------------------------------------------------------------------------

function guiasToCards(guias: Guia[], categoria: string): GuideCardData[] {
  return guias.map((g) => ({
    titulo: g.titulo,
    resumen: g.resumen,
    tipo: g.tipo,
    tipoNombre: nombreTipo(g.tipo),
    href: g.ruta,
    etiqueta: `${categoria} · ${nombreTipo(g.tipo)}`,
  }));
}

function itemListLd(name: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

// --------------------------------------------------------------------------
// Vistas.
// --------------------------------------------------------------------------

function MacroIndex({ macro, node }: { macro: Macrocategoria; node: RouteNode }) {
  const crumbs = buildBreadcrumb(node);

  // Rama de 2 niveles: la macro ES la categoría de guías → índice con filtro por tipo.
  if (macro.nivelGuias === "macrocategoria") {
    const guias = guiasDeMacro(macro);
    const cards = guiasToCards(guias, macro.nombre);
    return (
      <>
        <PageHero
          crumbs={crumbs}
          eyebrow="Guías"
          title={macro.nombre}
          sub={`Guías de compra y cómo elegir en ${macro.nombre}.`}
        />
        <section className="sec">
          <div className="container category-layout">
            <CategoryList variant="leaves" leaves={leafFiltros(macro)} railHead="Categorías" />
            <div className="category-main">
              <GuideTypeFilter cards={cards} tipos={getTiposDeGuia()} />
            </div>
          </div>
        </section>
        <JsonLd
          data={itemListLd(
            `Guías de ${macro.nombre}`,
            guias.map((g) => ({ name: g.titulo, url: absUrl(g.ruta) }))
          )}
        />
      </>
    );
  }

  // Rama de 3 niveles: lista las Subcategorías 1 como categorías de guías.
  const categorias = categoriasDeGuias(macro);
  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow="Macrocategoría"
        title={macro.nombre}
        sub={`Elige una categoría para ver sus guías.`}
      />
      <section className="sec">
        <div className="container">
          <CategoryList categorias={categorias} variant="cards" />
        </div>
      </section>
      <JsonLd
        data={itemListLd(
          `Categorías de guías · ${macro.nombre}`,
          categorias.map((c) => ({ name: c.nombre, url: absUrl(c.rutaGuias ?? macro.ruta) }))
        )}
      />
    </>
  );
}

function CategoryIndex({
  macro,
  sub1,
  node,
}: {
  macro: Macrocategoria;
  sub1: Subcategoria1;
  node: RouteNode;
}) {
  const crumbs = buildBreadcrumb(node);
  const cards = guiasToCards(sub1.guias ?? [], sub1.nombre);

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={macro.nombre}
        title={sub1.nombre}
        sub={`Guías de ${sub1.nombre}: qué buscar, comparativas y selección experta.`}
      />
      <section className="sec">
        <div className="container category-layout">
          <CategoryList variant="leaves" leaves={sub1.subcategorias2 ?? []} railHead="Categorías" />
          <div className="category-main">
            <GuideTypeFilter cards={cards} tipos={getTiposDeGuia()} />
          </div>
        </div>
      </section>
      <JsonLd
        data={itemListLd(
          `Guías de ${sub1.nombre}`,
          (sub1.guias ?? []).map((g) => ({ name: g.titulo, url: absUrl(g.ruta) }))
        )}
      />
    </>
  );
}

function ArticleView({ node }: { node: Extract<RouteNode, { kind: "guia" }> }) {
  const crumbs = buildBreadcrumb(node);
  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={nombreTipo(node.guia.tipo)}
        title={node.guia.titulo}
        sub={node.guia.resumen}
      />
      <GuideArticle node={node} />
    </>
  );
}

// --------------------------------------------------------------------------
// Dispatcher.
// --------------------------------------------------------------------------

export default function GuiasCatchAll({ params }: { params: Params }) {
  const node = getRoute(params.segments);
  if (!node) notFound();

  switch (node.kind) {
    case "macro":
      return <MacroIndex macro={node.macro} node={node} />;
    case "categoria":
      return <CategoryIndex macro={node.macro} sub1={node.sub1} node={node} />;
    case "guia":
      return <ArticleView node={node} />;
  }
}
