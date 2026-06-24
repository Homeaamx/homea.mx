import type { Metadata } from "next";
import "@/styles/tokens-v2.css";
import "@/styles/theme.css";
import "@/styles/guias.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Electrodomésticos premium`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Distribuidor autorizado de electrodomésticos premium y equipamiento de alta gama. Showroom en Querétaro, entregas en todo México.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
