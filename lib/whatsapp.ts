// Patrón único de WhatsApp del sitio (mismo número/flotante que el preview).
// Número comercial HOMEA para cotización: +52 446 144 6318.

export const WHATSAPP_PHONE = "524461446318";

export const WHATSAPP_DEFAULT_MESSAGE =
  "¡Hola, visité su sitio web y me interesa una cotización!";

/**
 * Construye el href de WhatsApp con un mensaje opcional contextual
 * (p.ej. el título de la guía desde la que cotiza el usuario).
 */
export function whatsappHref(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    message
  )}`;
}
