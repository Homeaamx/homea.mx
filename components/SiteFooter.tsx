// SiteFooter — pie del sitio (portado del preview v2). Enlaces internos no construidos
// apuntan a "#"; Guías ya está cableado a /guias/.

import Link from "next/link";
import { whatsappHref } from "@/lib/whatsapp";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="brandcol">
            <img className="mark" src="/assets/homea-premium-19.png" alt="HOMEA" />
            <span className="rule-gold" />
            <p>
              Distribuidor autorizado de electrodomésticos para todo tipo de proyectos. Marcas
              oficiales, asesoría especializada y servicio post-venta. Showroom en Querétaro,
              México. Entregas en todo México.
            </p>
            <div className="f-gap" aria-hidden="true" />
            <div className="f-contact">
              <a href="tel:+524422163552">Tel. Oficina (442) 216 3552</a>
              <a href={whatsappHref()} target="_blank" rel="noopener" data-track="whatsapp_click" data-label="wa_footer">
                WhatsApp +52 446 144 6318
              </a>
              <a href="mailto:carteaga@homea.mx">carteaga@homea.mx</a>
            </div>
            <div className="f-social" aria-label="Síguenos en redes sociales">
              <a href="https://www.instagram.com/homea_mx/" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.facebook.com/homea.mx/" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9V7.2c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.5 3 11 4.7 11 6.9V9H9v3h2v9h3v-9h2.3l.4-3H14z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@homea_mx" target="_blank" rel="noopener" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.3 2 1.6 3.5 3.5 3.8v2.5c-1.3 0-2.5-.4-3.5-1.1v5.7a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.1v2.7a2.7 2.7 0 1 0 1.9 2.6V3h2.6z" /></svg>
              </a>
              <a href="https://www.youtube.com/channel/UC5SHtEFZdDk5UuGfkfIWl1w" target="_blank" rel="noopener" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 8.2a2.6 2.6 0 0 0-1.8-1.8C18.6 6 12 6 12 6s-6.6 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.7 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.8C5.4 18 12 18 12 18s6.6 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.8c.3-1.2.3-3.8.3-3.8s0-2.6-.3-3.8zM10 15V9l5 3-5 3z" /></svg>
              </a>
            </div>
          </div>
          <div className="lnk">
            <div className="f-eyebrow">Recursos</div>
            <a href="#">Productos</a>
            <a href="#">Marcas</a>
            <a href="#">Listas de precio</a>
            <a className="soon" href="#" aria-disabled="true" tabIndex={-1}>Ofertas</a>
            <Link href="/guias/">Guías</Link>
            <a href="#">Herramientas</a>
          </div>
          <div className="lnk">
            <div className="f-eyebrow">HOMEA</div>
            <a href="#">Quiénes somos</a>
            <a href="#">Showroom</a>
            <a href="#">Proyectos</a>
            <a href="#">Blog &amp; Newsletter</a>
            <a href="#">Contacto</a>
          </div>
          <div className="lnk">
            <div className="f-eyebrow">Atención al cliente</div>
            <a href="#">Garantías e instalación</a>
            <a href="#">Fichas técnicas</a>
            <a href="#">Gastos de envío</a>
            <a href="#">Formas de pago</a>
            <a href="#">Contacto Post-Venta</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span className="since figures">Desde · 2004</span>
          <em>Equipamiento que está a la altura de tu hogar.</em>
          <span>
            © 2026 HOMEA · Querétaro · <a href="#">Privacidad</a> · <a href="#">Términos</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
