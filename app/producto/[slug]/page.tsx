import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { getTitle, productoFile, productoSlugs } from "@/lib/preview";

// ISR — revalidar 1 vez al día (igual que /productos).
export const revalidate = 86400;
// Solo las fichas precomputadas (producto-<slug>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return productoSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  if (!productoSlugs().includes(params.slug)) return {};
  const title = getTitle(productoFile(params.slug));
  return {
    title,
    alternates: { canonical: `/producto/${params.slug}` },
  };
}

export default function ProductoFichaPage({ params }: { params: Params }) {
  if (!productoSlugs().includes(params.slug)) notFound();
  return <MarketingPage file={productoFile(params.slug)} />;
}
