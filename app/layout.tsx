import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/tokens-v2.css";
import "@/styles/theme.css";
import "@/styles/guias.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getChrome } from "@/lib/preview";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import NavActive from "@/components/NavActive";
import HomeNavSticky from "@/components/HomeNavSticky";
import PreviewRouter from "@/components/PreviewRouter";

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
  // Nav + footer compartidos: markup exacto del preview v2 (reutilizado en todo el sitio).
  const { nav, footer } = getChrome();

  return (
    <html lang="es">
      <body>
        <div className="site-chrome" dangerouslySetInnerHTML={{ __html: nav }} />
        <main>{children}</main>
        <div dangerouslySetInnerHTML={{ __html: footer }} />
        <WhatsAppFloat />
        <NavActive />
        <HomeNavSticky />
        <PreviewRouter />
        {/* Interacciones del preview (nav scroll, mega flyout, reveals, hero, marquee). */}
        <Script src="/v2.js?v=30" strategy="afterInteractive" />
      </body>
    </html>
  );
}
