# Skills y Herramientas — Proyecto Landing HOMEA

## Aclaración importante sobre "instalar skills"

No existe una tienda donde se "descarguen" skills de framework (nextjs, typescript, etc.) bajo demanda. Hay tres realidades:

1. **Conocimiento de framework** (Next.js, React, TypeScript, Tailwind, Zod) → ya es **nativo a nivel experto**. No requiere skill. Se gobierna con `CLAUDE.md`.
2. **Skills ya instaladas** → las usamos tal cual.
3. **Skills nuevas** → se **crean a la medida** con `skill-creator`. Solo valen la pena las que encierran **decisiones propias de HOMEA** (que no se pueden adivinar).

> Conclusión: no "instalamos" nada genérico. Reforzamos con `CLAUDE.md` y **creamos 2–4 skills de proyecto** cuando tengamos los datos de Fase 0.

---

## Ya disponibles (usar directo)

| Recurso | Tipo | Uso en el proyecto |
|---|---|---|
| `frontend-design` | skill | Construcción visual de alto nivel (Fase 3). **El más crítico.** |
| `homea-marketing` | skill | Copy, mensajes, performance, campañas. |
| `homea-sales` | skill | Embudo de leads, objeciones, proceso consultivo (formulario→KOMMO). |
| `homea-operaciones` | skill | SAE, COI, catálogos, precios, KOMMO, OXATIS, Cloudflare. |
| `seo-audit` | skill | Auditoría SEO de base (Fase 0). |
| `competitive-brief` | skill | Brief competitivo HOMEA vs ARTEXA (Fase 0). |
| `design` (suite) | skills | Accesibilidad WCAG, critique, handoff, design system. |
| `skill-creator` | skill | Fabricar las skills de proyecto de abajo. |
| MCP **Shopify** | MCP | Admin API en vivo (productos, inventario, precios, GraphQL). |
| MCP **Meta Ads** | MCP | Campañas, pixel/CAPI, catálogos. |
| MCP **Supermetrics** | MCP | Data de marketing/analytics multi-fuente. |
| MCP **Chrome** | MCP | Scraping/screenshots de homea.mx y ARTEXA (Fase 0). |
| MCP **Canva / Gamma** | MCP | Creatividades y presentaciones. |

## Veredicto sobre la lista que recibió Carla

| Recomendado externamente | Veredicto |
|---|---|
| `frontend-design` | ✅ Sí. Ya instalada. |
| `shopify` | ❌ No descargar. Ya hay MCP en vivo (superior). Storefront se hace nativo. |
| `nextjs` / `react` | ❌ Innecesario. Nativo. Se cubre con `CLAUDE.md`. |
| `typescript` | ❌ Innecesario. Nativo. |
| `tailwindcss` | ❌ Innecesario. Se conecta a los tokens del design system. |
| `forms` / `react-hook-form` | ❌ Innecesario. RHF + Zod nativo. |
| `seo-nextjs` | ❌ No existe como tal. Hay `seo-audit` + SEO técnico nativo. |

## Cambio de arquitectura (2026-06-04): TODO EN SHOPIFY

Se descarta Next.js/headless. Consecuencia para skills/herramientas:
- **Next.js / React / TypeScript / Tailwind / RHF: ya NO aplican** (no se usan en absoluto).
- El **MCP de Shopify** pasa a ser la herramienta central (gestión de tienda, productos, tema vía GraphQL).
- `frontend-design` sigue útil pero aplicado a **personalización del tema** (Liquid/CSS), no a build propio.
- Cobra peso el conocimiento de **Liquid, temas Online Store 2.0, SEO de Shopify y redirects 301**.

## Skills de proyecto a CREAR (con `skill-creator`)

> Solo cuando tengamos los datos que codifican. No crear en vacío.

| Skill propuesta | Qué encierra | Crear en |
|---|---|---|
| `homea-shopify-theme` | Convenciones del tema: secciones, Liquid, tokens del design system, reglas de diseño premium. | Fase 2–3 |
| `homea-shopify-seo` | Mapa 301 en Shopify, JSON-LD, metadatos, paridad de contenido. | Fase 3/5 |
| `homea-tracking` | GA4 + Meta Pixel/CAPI + GTM limpio (depurar los 2 contenedores). | Fase 3 |
| `homea-lead-flow` | Formulario (app) → KOMMO + lógica "Cotizar" vs "Comprar", ligado a `homea-sales`. | Fase 3/4 |
| `homea-catalog-ops` | Homologación + import de ~25k productos a Shopify (CSV/Matrixify), metafields, taxonomía de filtros, flujo de obtención de imágenes. Apoyado en `homea-operaciones`. | Fase 4 |

## Nota sobre el catálogo (~25k productos)
Herramientas clave de Fase 4: **MCP de Shopify** (creación/GraphQL), **app de import masivo** (ej. Matrixify) para 25k SKUs, y skill **`homea-operaciones`** para limpieza/homologación de datos. La **obtención de imágenes** es un subproyecto propio (priorizar por tráfico/venta).

## Nota sobre COWORK (paso 5 de Carla)

La captura de screenshots + descripciones de HOMEA y ARTEXA se hace con el **MCP de Chrome** + skill `competitive-brief`. No requiere instalar nada nuevo.
