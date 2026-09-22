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

/** Mensaje de WhatsApp para las marcas que solo se venden por catálogo (canal "pdf"):
 *  lo usan el botón de su página y el flotante mientras se está en ella. */
export function mensajeAsesoria(marca: string): string {
  return `Hola, estaba viendo el catálogo de ${marca} y me interesa una asesoría.`;
}
