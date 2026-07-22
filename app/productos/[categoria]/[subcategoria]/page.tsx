import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { getTitle, subcategoriaFile, subcategoriaParams } from "@/lib/preview";

// ISR — revalidar 1 vez al día (igual que /productos/[categoria]).
export const revalidate = 86400;
// Solo las subcategorías precomputadas (subcategoria-<cat>--<sub>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  categoria: string;
  subcategoria: string;
}

function exists({ categoria, subcategoria }: Params): boolean {
  return subcategoriaParams().some(
    (p) => p.categoria === categoria && p.subcategoria === subcategoria
  );
}

export function generateStaticParams(): Params[] {
  return subcategoriaParams();
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  if (!exists(params)) return {};
  const title = getTitle(subcategoriaFile(params.categoria, params.subcategoria));
  return {
    title,
    alternates: {
      canonical: `/productos/${params.categoria}/${params.subcategoria}`,
    },
  };
}

export default function SubcategoriaPage({ params }: { params: Params }) {
  if (!exists(params)) notFound();
  return (
    <MarketingPage
      file={subcategoriaFile(params.categoria, params.subcategoria)}
    />
  );
}
