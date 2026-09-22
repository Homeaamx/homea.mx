import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/tokens-v2.css";
import "@/styles/theme.css";
import "@/styles/guias.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getChrome } from "@/lib/preview";
import { inyectarTipoCambio, obtenerTipoCambio } from "@/lib/tipoCambio";
import BuscadorOverlay from "@/components/BuscadorOverlay";
import CarritoProvider from "@/components/CarritoProvider";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { rutaMarca, todasLasMarcas } from "@/lib/marcas";
import { mensajeAsesoria } from "@/lib/whatsapp";
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

// Flotante de WhatsApp: en las marcas de solo catálogo (canal "pdf") pide asesoría
// sobre esa marca, igual que el botón de su página (components/WhatsAppFloat.tsx).
const MENSAJES_WA = Object.fromEntries(
  todasLasMarcas()
    .filter((m) => m.canal === "pdf")
    .map((m) => [rutaMarca(m), mensajeAsesoria(m.nombre)])
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nav + footer compartidos: markup exacto del preview v2 (reutilizado en todo el sitio).
  const { nav, footer } = getChrome();
  // Tipo de cambio del día: se resuelve en el servidor (consulta cacheada un día
  // y revalidada por el cron) y viaja ya escrito en la barra superior. Antes lo
  // pedía el navegador con el token de Banxico incrustado en /v2.js.
  const navConTipoCambio = inyectarTipoCambio(nav, await obtenerTipoCambio());

  // data-scroll-behavior="smooth": theme.css pone `html { scroll-behavior: smooth }`
  // para las anclas de la misma página. Next 16 ya no lo desactiva al navegar, así
  // que al abrir otra página (p. ej. una marca desde /marcas) subía despacio hasta
  // arriba. Con este atributo Next salta directo al inicio al cambiar de ruta.
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        {/* Las dos fuentes del primer render. Sin preload el navegador solo las
            descubre al parsear el CSS y con internet lento el texto definitivo
            tarda de más. rel="preload" es válido dentro de <body>; un <head>
            manual no lo es en el App Router. Los demás subsets (latin-ext,
            itálicas) se piden solo si la página los usa. */}
        <link rel="preload" href="/fonts/Newsreader-Roman-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Montserrat-Roman-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <noscript>
          {/* Sin JS nadie añade .bg-ready: se pintan todos los fondos de una vez. */}
          <style>{`.mq-chip,.brandtile,.cat-media,.ss-bg{background-image:var(--lazy-bg)}`}</style>
        </noscript>
        <div className="site-chrome" dangerouslySetInnerHTML={{ __html: navConTipoCambio }} />
        <main>{children}</main>
        <div dangerouslySetInnerHTML={{ __html: footer }} />
        {/* Buscador de catálogo: se engancha a la lupa del nav (a.nav-ic-search). */}
        <BuscadorOverlay />
        {/* Carrito real: estado en Shopify (Storefront API), cookie httpOnly y
            checkout hospedado. Sustituye al antiguo /cart.js de localStorage. */}
        <CarritoProvider />
        <WhatsAppFloat porRuta={MENSAJES_WA} />
        <NavActive />
        <HomeNavSticky />
        <PreviewRouter />
        {/* Interacciones del preview (nav scroll, mega flyout, reveals, hero, marquee). */}
        <Script src="/v2.js?v=61" strategy="afterInteractive" />
        {/* Wishlist (localStorage): corazones, badge del nav y drawer de cotización. */}
        <Script src="/wishlist.js?v=5" strategy="afterInteractive" />
        {/* Filtro de tipo del riel de subcat.1 (?tipo=…) y su scroll lento. */}
        <Script src="/tipos.js?v=1" strategy="afterInteractive" />
      </body>
    </html>
  );
}
