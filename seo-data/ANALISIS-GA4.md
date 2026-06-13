# Análisis Google Analytics 4 — propiedad "Homea"

Fuente: `Reports_snapshot.csv` (export GA4). Periodo: **2025-01-01 → 2026-06-04** (~17 meses).

## ⚠️ Interpretación CRÍTICA: esta GA4 NO mide todo el sitio
- GA4 reporta **18,038 sesiones** en 17 meses, pero GSC reporta **~56,500 clics orgánicos** en 16 meses.
- La diferencia confirma que **GA4 NO está instalado en el sitio orgánico de OXATIS** (recuerda: OXATIS solo tenía el UA muerto). 
- Esta GA4 mide principalmente tus **landing pages activas (Vercel) + el embudo de anuncios**, no el gigante orgánico de OXATIS.
- **Conclusión:** GSC = mundo orgánico OXATIS; GA4 = mundo landings+ads. Son **complementarios**. En el sitio nuevo Shopify montamos **UN solo GA4 que mida TODO**.

## Totales (17 meses, lo que GA4 sí ve)
- Usuarios activos: 11,142 · Nuevos: 12,587 · Sesiones: 18,038
- Engagement promedio: 61 s/usuario
- **Revenue total: $0** → confirma modelo **lead-gen, no venta online** (las "key events" son leads/contactos, no compras). ✅ Valida la estrategia de landing enfocada en leads.

## De dónde viene el tráfico (sesiones)
| Fuente / medio | Sesiones | Key events |
|---|---|---|
| google / organic | 6,898 (38%) | 129 |
| (direct) | 4,347 (24%) | 86 |
| **google / cpc (Ads)** | 2,254 (12%) | **94** ← el más eficiente |
| **facebook / paid_social** | 2,098 (12%) | **0** ⚠️ |
| bing / organic | 667 | 14 |
| KOMMO (crm referrals) | ~138 | — |
| IA (chatgpt/gemini/perplexity/claude) | ~80 | — emergente |

## 🔎 Hallazgos accionables
1. **Orgánico + directo = 62% de sesiones** y la mayoría de key events → SEO + marca son la columna vertebral. Refuerza la prioridad de no perder posicionamiento.
2. ⚠️ **Facebook paid: 2,098 sesiones y 0 key events.** O el evento de conversión NO está disparando para ese tráfico (fuga de medición) o no convierte. **Dinero potencialmente sin medir.** Hay que arreglar el tracking de FB en el sitio nuevo.
3. **Google Ads (cpc) es tu canal pago más eficiente** (94 key events / 2,254 sesiones ≈ 4.2%). Campaña dominante: `2025_HOMEA_búsqueda-1` (1,580 sesiones). Además Performance Max (Hot Sale, Smeg), Leads PMax y Google Maps.
4. **Tráfico de buscadores IA ya aparece** (ChatGPT, Gemini, Perplexity, Claude). Canal emergente a cuidar en el sitio nuevo.
5. **Ya tienes landings en Vercel** (`homea-hotsale.vercel.app`) → experiencia previa con landings; son parte de "las otras landings activas".
6. **KOMMO está en el embudo** (referrals) → confirma flujo lead→CRM activo.

## Implicaciones para el sitio nuevo (Shopify)
- **UN GA4 único** que mida todo (orgánico + ads + landings), bien etiquetado.
- **Arreglar la medición de conversiones de Facebook** (pixel/CAPI + key event de lead).
- Mantener fuerte el canal **Google Ads de búsqueda** (es el que convierte) y conectarlo a las páginas correctas.
- El **lead (no la venta online)** es la conversión principal → el diseño debe optimizar captura de lead.
