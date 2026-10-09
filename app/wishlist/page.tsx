import type { Metadata } from "next";
import MarketingPage from "@/components/MarketingPage";

// /wishlist — la lista guardada vive en localStorage y la pinta public/wishlist.js
// dentro de [data-wl-page] (preview/wishlist.html trae el esqueleto y el estado
// vacío). Es una página personal: no se indexa ni va al sitemap.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Las piezas que guardaste en tu wishlist HOMEA: fíltralas por marca y tipo, agrégalas a tu proyecto o cotízalas por WhatsApp.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/wishlist" },
};

export default function WishlistPage() {
  return <MarketingPage file="wishlist.html" />;
}
