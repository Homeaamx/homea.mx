import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  allRouteSegments,
  buildBreadcrumb,
  categoriasDeGuias,
  getTiposDeGuia,
  guiasDeMacro,
  guiasDeSub1,
  leafFiltros,
  nombreTipo,
  resolverRuta,
  type GuiaPublicada,
  type RouteNode,
} from "@/lib/guias";
import { absUrl } from "@/lib/site";
import type { Macrocategoria, Subcategoria1, Subcategoria2 } from "@/types/guias";

import AprendeCampanas from "@/components/AprendeCampanas";
import FiltroDiagrama from "@/components/FiltroDiagrama";
import PageHero from "@/components/PageHero";
import CategoryList from "@/components/CategoryList";
import FilterList from "@/components/FilterList";
import FilterShowcase from "@/components/FilterShowcase";
import GuiaSearch from "@/components/GuiaSearch";
import GuideTypeFilter from "@/components/GuideTypeFilter";
import GuideArticle from "@/components/GuideArticle";
import JsonLd from "@/components/JsonLd";
import { type GuideCardData } from "@/components/GuideCard";

// ISR — revalidar cada hora: los artículos se publican en Shopify (o al momento
// con /api/revalidar-guias).
export const revalidate = 3600;
// Una guía recién publicada en Shopify se sirve sin esperar al siguiente build;
// lo que no exista ni en el JSON ni en el blog → 404 (resolverRuta).
export const dynamicParams = true;

interface Params {
  segments: string[];
}

// ---- Por qué un catch-all en vez de archivos [macro]/[sub1] + [macro]/[tipo] ----
// Next.js NO permite dos slugs distintos en el mismo nivel ([sub1] vs [tipo] bajo [macro]).
// Como la jerarquía es de profundidad mixta (índices de 2 y 3 niveles), un único catch-all
// resuelve todas las rutas del JSON sin colisión. El render se delega a vistas dedicadas.
export async function generateStaticParams(): Promise<Params[]> {
  return (await allRouteSegments()).map((segments) => ({ segments }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const node = await resolverRuta(params.segments);
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
  // guía (artículo del blog "Guías" de Shopify)
  const { guia } = node;
  return {
    title: guia.seo.titulo,
    description: guia.seo.descripcion,
    alternates: { canonical: guia.ruta },
    openGraph: {
      type: "article",
      title: guia.seo.titulo,
      description: guia.seo.descripcion,
      publishedTime: guia.publicada,
      ...(guia.imagen ? { images: [{ url: guia.imagen.url, alt: guia.imagen.alt }] } : {}),
    },
    // La semilla local (solo en desarrollo) nunca se indexa.
    ...(guia.borrador ? { robots: { index: false, follow: false } } : {}),
  };
}

// Foto de fondo del encabezado por macrocategoría (ruta en /public).
const HERO_FOTO_MACRO: Record<string, { src: string; pos?: string; flip?: boolean }> = {
  "cocina-y-bar": { src: "/assets/photos/hero-cocina-bar-smeg.webp", pos: "center 60%" },
  exterior: { src: "/assets/photos/hero-exterior-subzero-wolf-cocina.webp", pos: "center 55%" },
  "electrodomesticos-menores": { src: "/assets/photos/hero-electrodomesticos-menores-smeg.webp", pos: "center 50%", flip: true },
  lavanderia: { src: "/assets/photos/hero-lavanderia-bosch.webp", pos: "center 50%" },
  banos: { src: "/assets/photos/hero-banos-griferia-premium.webp", pos: "center 60%" },
  "aire-acondicionado": { src: "/assets/photos/hero-minisplits.webp", pos: "center 12%" },
  "vapor-y-sauna": { src: "/assets/photos/hero-vapor-sauna-artexa.webp", pos: "center 50%" },
  wellness: { src: "/assets/photos/hero-wellness-artexa-sauna.webp", pos: "center 80%" },
  "recubrimientos-y-superficies": { src: "/assets/photos/hero-recubrimientos-laminam.webp", pos: "center 50%" },
  "chimeneas-y-calentadores": { src: "/assets/photos/hero-chimeneas-hergom.webp", pos: "center 50%", flip: true },
};

// Foto de fondo del encabezado por Subcategoría 1 (ruta en /public), keyed por slug.
const HERO_FOTO_SUB1: Record<string, { src: string; pos?: string; flip?: boolean }> = {
  refrigeracion: { src: "/assets/photos/hero-sub1-refrigeracion-subzero.webp", pos: "center 50%" },
  coccion: { src: "/assets/photos/hero-sub1-coccion-gaggenau.webp", pos: "center 75%" },
  lavavajillas: { src: "/assets/photos/hero-sub1-lavavajillas-bosch.webp", pos: "center 50%" },
  "tarjas-y-griferia": { src: "/assets/photos/hero-sub1-tarjas-griferia-blanco.webp", pos: "center 50%" },
  trituradores: { src: "/assets/photos/hero-sub1-trituradores-insinkerator.webp", pos: "center 100%" },
  "filtros-y-purificadores-de-agua": { src: "/assets/photos/hero-sub1-filtros-purificadores-agua.webp", pos: "center 50%" },
};

// --------------------------------------------------------------------------
// Helpers de presentación.
// --------------------------------------------------------------------------

function guiasToCards(guias: GuiaPublicada[], categoria: string): GuideCardData[] {
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

async function MacroIndex({ macro, node }: { macro: Macrocategoria; node: RouteNode }) {
  const crumbs = buildBreadcrumb(node);
  const heroFoto = HERO_FOTO_MACRO[macro.slug];

  // Rama de 2 niveles: la macro ES la categoría de guías → índice con filtro por tipo.
  if (macro.nivelGuias === "macrocategoria") {
    const guias = await guiasDeMacro(macro);
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
            <CategoryList variant="leaves" leaves={leafFiltros(macro)} railHead="Explora por categoría" />
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
  const conteos: Record<string, number> = {};
  for (const g of await guiasDeMacro(macro)) {
    if (g.sub1) conteos[g.sub1.slug] = (conteos[g.sub1.slug] ?? 0) + 1;
  }
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
          <CategoryList categorias={categorias} variant="cards" conteos={conteos} />
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

async function CategoryIndex({
  macro,
  sub1,
  node,
}: {
  macro: Macrocategoria;
  sub1: Subcategoria1;
  node: RouteNode;
}) {
  const crumbs = buildBreadcrumb(node);
  const guias = await guiasDeSub1(macro, sub1);
  const cards = guiasToCards(guias, sub1.nombre);
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
          <CategoryList variant="leaves" leaves={sub1.subcategorias2 ?? []} railHead="Explora por categoría" />
          <div className="category-main">
            <GuideTypeFilter cards={cards} tipos={getTiposDeGuia()} />
          </div>
        </div>
      </section>
      <JsonLd
        data={itemListLd(
          `Guías de ${sub1.nombre}`,
          guias.map((g) => ({ name: g.titulo, url: absUrl(g.ruta) }))
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
  // Con fichas → patrón "Planos de cocina" (docs/PATRON-FICHAS-TIPO.md);
  // sin fichas (categoría aún sin definir) → chips clásicos.
  const conFichas = filtros.some((f) => f.ficha);

  // Fondo del hero: estas 19 páginas no tienen foto propia, así que el fondo lo
  // pone el dibujo del equipo. Se elige el primer tipo del grupo "tipo" (el que
  // define la categoría; los de grupo "estilo" son acabados) y, si no hay, el
  // primero con ficha. Con aside (Campanas) el hueco derecho ya está ocupado.
  const aside = sub2.slug === "campanas" ? <AprendeCampanas /> : undefined;
  const fichaHero =
    filtros.find((f) => f.ficha?.grupo === "tipo")?.ficha ??
    filtros.find((f) => f.ficha)?.ficha;
  // Sin DiagramaDefs: aquí el dibujo va a puro trazo (theme.css lo repinta en
  // bone/oro), así que no se usan los degradados de acero/cavidad.
  const art = !aside && fichaHero ? <FiltroDiagrama tipo={fichaHero.diagrama} /> : undefined;

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={sub1.nombre}
        title={sub2.nombre}
        sub={
          conFichas
            ? `Cada tipo de ${sub2.nombre.toLowerCase()} resuelve una cocina distinta. Compara y elige el tuyo.`
            : `Elige un filtro para ver los ${sub2.nombre.toLowerCase()} de ${sub1.nombre} que buscas.`
        }
        art={art}
        // Espresso en las 19 subcat.2, con o sin dibujo, para que la sección
        // completa se lea como un solo nivel de la jerarquía.
        plano
        // Guía educativa del sitio viejo (láminas OXATIS) en overlay; por ahora
        // solo Campanas la tiene. Deep-link: #aprende (botón del PLP).
        aside={aside}
      />
      <section className="sec">
        <div className="container">
          {conFichas ? (
            <FilterShowcase
              filtros={filtros}
              contexto={sub2.nombre}
              etiquetas={sub2.etiquetasGrupos}
            />
          ) : (
            <FilterList filtros={filtros} />
          )}
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
  // Fondo del encabezado: la imagen de la entrada en Shopify; si no tiene, la
  // foto de su subcategoría o de su macro.
  const foto = node.guia.imagen
    ? { src: `${node.guia.imagen.url}${node.guia.imagen.url.includes("?") ? "&" : "?"}width=1800` }
    : (node.sub1 && HERO_FOTO_SUB1[node.sub1.slug]) || HERO_FOTO_MACRO[node.macro.slug];
  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={nombreTipo(node.guia.tipo)}
        title={node.guia.titulo}
        sub={node.guia.resumen}
        bgImage={foto?.src}
        bgPosition={foto && "pos" in foto ? foto.pos : undefined}
        bgFlip={foto && "flip" in foto ? foto.flip : undefined}
      />
      <GuideArticle node={node} />
    </>
  );
}

// --------------------------------------------------------------------------
// Dispatcher.
// --------------------------------------------------------------------------

export default async function GuiasCatchAll(props: { params: Promise<Params> }) {
  const params = await props.params;
  const node = await resolverRuta(params.segments);
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
