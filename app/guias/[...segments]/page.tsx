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
import type { Guia, Macrocategoria, Subcategoria1, Subcategoria2 } from "@/types/guias";

import PageHero from "@/components/PageHero";
import CategoryList from "@/components/CategoryList";
import FilterList from "@/components/FilterList";
import GuiaSearch from "@/components/GuiaSearch";
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
  if (node.kind === "filtros") {
    return {
      title: `${node.sub2.nombre} — ${node.sub1.nombre}`,
      description: `Filtra ${node.sub2.nombre} de ${node.sub1.nombre} por tipo y características. Catálogo premium HOMEA.`,
      alternates: { canonical: node.sub2.rutaFiltros },
    };
  }
  // guía
  return {
    title: node.guia.titulo,
    description: node.guia.resumen,
    alternates: { canonical: node.guia.ruta },
  };
}

// Foto de fondo del encabezado por macrocategoría (ruta en /public).
const HERO_FOTO_MACRO: Record<string, { src: string; pos?: string; flip?: boolean }> = {
  "cocina-y-bar": { src: "/assets/photos/hero-cocina-bar-smeg.jpg", pos: "center 60%" },
  exterior: { src: "/assets/photos/hero-exterior-subzero-wolf-cocina.jpg", pos: "center 55%" },
  "electrodomesticos-menores": { src: "/assets/photos/hero-electrodomesticos-menores-smeg.jpg", pos: "center 50%", flip: true },
  lavanderia: { src: "/assets/photos/hero-lavanderia-bosch.jpg", pos: "center 50%" },
  banos: { src: "/assets/photos/hero-banos-hansgrohe.jpg", pos: "center 35%" },
  minisplits: { src: "/assets/photos/hero-minisplits.jpg", pos: "center 12%" },
  "vapor-y-sauna": { src: "/assets/photos/hero-vapor-sauna-artexa.webp", pos: "center 50%" },
  wellness: { src: "/assets/photos/hero-wellness-artexa-sauna.jpg", pos: "center 80%" },
  "recubrimientos-y-superficies": { src: "/assets/photos/hero-recubrimientos-laminam.jpg", pos: "center 50%" },
  "chimeneas-y-calentadores": { src: "/assets/photos/hero-chimeneas-hergom.jpg", pos: "center 50%", flip: true },
};

// Foto de fondo del encabezado por Subcategoría 1 (ruta en /public), keyed por slug.
const HERO_FOTO_SUB1: Record<string, { src: string; pos?: string; flip?: boolean }> = {
  refrigeracion: { src: "/assets/photos/hero-sub1-refrigeracion-subzero.jpg", pos: "center 50%" },
  coccion: { src: "/assets/photos/hero-sub1-coccion-gaggenau.jpg", pos: "center 75%" },
  lavavajillas: { src: "/assets/photos/hero-sub1-lavavajillas-bosch.webp", pos: "center 50%" },
  "tarjas-y-griferia": { src: "/assets/photos/hero-sub1-tarjas-griferia-blanco.jpg", pos: "center 50%" },
  trituradores: { src: "/assets/photos/hero-sub1-trituradores-insinkerator.jpg", pos: "center 100%" },
  "dispensadores-y-filtros-de-agua": { src: "/assets/photos/hero-sub1-dispensadores-delta.jpg", pos: "center 50%" },
};

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
  const heroFoto = HERO_FOTO_MACRO[macro.slug];

  // Rama de 2 niveles: la macro ES la categoría de guías → índice con filtro por tipo.
  if (macro.nivelGuias === "macrocategoria") {
    const guias = guiasDeMacro(macro);
    const cards = guiasToCards(guias, macro.nombre);
    return (
      <>
        <PageHero
          crumbs={crumbs}
          rule
          title={macro.nombre}
          sub={`Guías de compra y cómo elegir en ${macro.nombre}.`}
          bgImage={heroFoto?.src}
          bgPosition={heroFoto?.pos}
          bgFlip={heroFoto?.flip}
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
        rule
        title={macro.nombre}
        sub={`Elige una categoría para ver sus guías.`}
        bgImage={heroFoto?.src}
        bgPosition={heroFoto?.pos}
        bgFlip={heroFoto?.flip}
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
  const heroFoto = HERO_FOTO_SUB1[sub1.slug];

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={macro.nombre}
        title={sub1.nombre}
        sub={`Guías de ${sub1.nombre}: qué buscar, comparativas y selección experta.`}
        bgImage={heroFoto?.src}
        bgPosition={heroFoto?.pos}
        bgFlip={heroFoto?.flip}
      >
        {/* Buscador ACOTADO a esta subcategoría: temas (Subcategoría 2) + sus guías. */}
        <div style={{ marginTop: 26 }}>
          <GuiaSearch
            guias={cards}
            topics={sub1.subcategorias2 ?? []}
            placeholder={`Busca en ${sub1.nombre}`}
            ariaLabel={`Buscar en ${sub1.nombre}`}
            scopeLabel={sub1.nombre}
          />
        </div>
      </PageHero>
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

function FilterIndex({
  macro,
  sub1,
  sub2,
  node,
}: {
  macro: Macrocategoria;
  sub1: Subcategoria1;
  sub2: Subcategoria2;
  node: RouteNode;
}) {
  const crumbs = buildBreadcrumb(node);
  const filtros = sub2.filtros ?? [];

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={sub1.nombre}
        title={sub2.nombre}
        sub={`Elige un filtro para ver los ${sub2.nombre.toLowerCase()} de ${sub1.nombre} que buscas.`}
      />
      <section className="sec">
        <div className="container">
          <FilterList filtros={filtros} />
        </div>
      </section>
      <JsonLd
        data={itemListLd(
          `Filtros de ${sub2.nombre} · ${sub1.nombre}`,
          filtros.map((f) => ({ name: f.nombre, url: absUrl(f.filtro) }))
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
    case "filtros":
      return <FilterIndex macro={node.macro} sub1={node.sub1} sub2={node.sub2} node={node} />;
    case "guia":
      return <ArticleView node={node} />;
  }
}
