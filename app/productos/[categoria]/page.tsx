import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MarketingPage from "@/components/MarketingPage";
import { categoriaFile, categoriaSlugs, getTitle } from "@/lib/preview";

// ISR — revalidar 1 vez al día (igual que /productos).
export const revalidate = 86400;
// Solo las categorías precomputadas (categoria-<slug>.html) existen → resto 404.
export const dynamicParams = false;

interface Params {
  categoria: string;
}

export function generateStaticParams(): Params[] {
  return categoriaSlugs().map((categoria) => ({ categoria }));
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  if (!categoriaSlugs().includes(params.categoria)) return {};
  const title = getTitle(categoriaFile(params.categoria));
  return {
    title,
    alternates: { canonical: `/productos/${params.categoria}` },
  };
}

export default async function CategoriaPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!categoriaSlugs().includes(params.categoria)) notFound();
  return <MarketingPage file={categoriaFile(params.categoria)} />;
}
