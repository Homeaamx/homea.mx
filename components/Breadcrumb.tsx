// Breadcrumb — migas visibles (.crumbs, estilo page-hero) + JSON-LD BreadcrumbList.

import Link from "next/link";
import type { Crumb } from "@/lib/guias";
import { absUrl } from "@/lib/site";
import JsonLd from "./JsonLd";

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const itemListElement = crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.nombre,
    ...(c.href ? { item: absUrl(c.href) } : {}),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return (
    <>
      <nav className="crumbs" aria-label="Migas de pan">
        {crumbs.map((c, i) => (
          <span key={`${c.nombre}-${i}`}>
            {i > 0 && <span className="sep">·</span>}
            {c.href ? <Link href={c.href}>{c.nombre}</Link> : <span aria-current="page">{c.nombre}</span>}
          </span>
        ))}
      </nav>
      <JsonLd data={jsonLd} />
    </>
  );
}
