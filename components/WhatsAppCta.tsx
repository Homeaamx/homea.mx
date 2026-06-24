// WhatsAppCta — botón/enlace de cotización por WhatsApp (patrón único del sitio).

import { whatsappHref } from "@/lib/whatsapp";

interface Props {
  children: React.ReactNode;
  message?: string;
  className?: string;
  label?: string; // data-label para tracking GA4/Ads
}

export default function WhatsAppCta({
  children,
  message,
  className = "btn btn-gold",
  label = "wa_cta",
}: Props) {
  return (
    <a
      className={className}
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener"
      data-track="whatsapp_click"
      data-label={label}
    >
      {children}
    </a>
  );
}
