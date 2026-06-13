# HOMEA — Landing Page Oficial

Sitio oficial de **HOMEA**, empresa mexicana que vende y distribuye **electrodomésticos y equipamiento premium de alta gama** para el hogar (Viking, Wolf, Sub-Zero, Miele, Thermador, Monogram). Segmento de **lujo accesible**, con showroom físico en Querétaro y un equipo comercial consultivo.

Este repositorio contiene la documentación, el design system, el preview navegable de alta fidelidad y, próximamente, el front-end en Next.js que reemplazará al sitio actual (OXATIS) sobre el dominio `www.homea.mx`.

---

## 🎯 Objetivos del producto

La landing persigue **dos objetivos simultáneos**:

1. **Capturar leads** para los ejecutivos de ventas — objetivo primario (ticket alto, cierre por WhatsApp / showroom).
2. **Permitir compra directa** de productos de menor ticket — ecommerce secundario, pero que **debe funcionar impecablemente**.

**Principio rector:** la **funcionalidad es prioridad, no solo el diseño**. Búsqueda, filtros, carrito, formularios y velocidad deben funcionar perfecto. *"Bonito pero roto" no es aceptable.*

> **Escala del catálogo:** ~25,000 productos → es una migración de catálogo seria (homologación de datos, imágenes por producto, import masivo a Shopify, filtros precisos), no solo una landing.

---

## 🏗️ Arquitectura — Headless (Next.js en Vercel + Shopify solo ecommerce)

Front-end propio en **Next.js (App Router)**, publicado en **Vercel** sobre `www.homea.mx`. **Shopify se usa únicamente como motor de ecommerce** (catálogo, inventario, carrito y checkout) consumido vía **Storefront API (GraphQL)**. El contenido editorial, el diseño y la captación de leads viven en el front-end propio.

**Por qué headless (regla de oro = no perder SEO):**
- **URLs 100% bajo control** → se conservan/replican rutas limpias, sin forzar `/products/`, `/collections/`.
- **Core Web Vitals de primera** con Next.js + Vercel (edge, `next/image`, SSG/ISR).
- **SEO técnico propio:** metadatos por página, canónicos, JSON-LD (Product, BreadcrumbList, Organization, FAQ), `sitemap.xml`, `robots.txt`, redirects 301.

**Flujo de datos:** productos en Shopify → consumidos por Storefront API en build (SSG/ISR) o request (SSR). Para ~25k productos se usa **ISR / on-demand revalidation**. El **checkout permanece hospedado en Shopify**. La tienda `homeashop.mx` queda `noindex`/password para no competir con `homea.mx`.

---

## 🧰 Stack técnico

| Capa | Tecnología |
|---|---|
| Front-end | **Next.js (App Router)** — SSR/SSG/ISR |
| Hosting | **Vercel** (edge, `next/image`, CD) |
| Ecommerce (backend) | **Shopify** vía **Storefront API (GraphQL)** + checkout hospedado |
| Diseño | Design System v2 (tokens en `preview/tokens-v2.css`) |
| Leads / CRM | Formulario propio → **KOMMO** (API/webhook) |
| Analítica | GA4 + Meta Pixel/CAPI (inyectados desde el front-end, sin GTM heredado) |
| SEO técnico | `sitemap.ts`, `robots.txt`, canónicos, JSON-LD, redirects 301 |
| DNS / Dominio | GoDaddy → `www.homea.mx` apuntando a Vercel |

---

## 🎨 Design System — v2

Sistema visual vigente: **v2** (junio 2026, handoff de claude.ai/design). Tokens en `preview/tokens-v2.css`.

- **Superficies:** bone `#F7F3EC` / greige `#ECEAE3` / espresso `#1E1914` / negro `#0A0A0A`
- **Acento único:** oro champagne `#BD9B5E` (`#76603B` para texto AA)
- **Tipografía:** Newsreader (serif — display/H1/H2) + Montserrat (UI, eyebrows)
- **Estilo:** esquinas vivas (radius 0), doctrina de precisión (cifras tabulares, tablas `.spec`), motion contenido

> ⚠️ No inventar colores, tipografías ni espaciados fuera de los tokens v2.

---

## 📁 Estructura del repositorio

```
.
├── CLAUDE.md                  # Documento maestro del proyecto (lo lee Claude Code al iniciar)
├── docs/                      # Documentación de fases, playbooks y planes
│   ├── PLAN-DE-FASES.md
│   ├── PLAYBOOK-MIGRACION-SEO.md
│   ├── PLAN-REDIRECTS-MIGRACION.md
│   ├── FASE1-CONCEPTO-Y-SECCIONES.md
│   ├── FASE1-ANALISIS-Y-SECCIONES.md
│   └── SKILLS-Y-HERRAMIENTAS.md
├── preview/                   # Diseño navegable de alta fidelidad (7 plantillas) — base del front-end Next.js
│   ├── home.html · coleccion.html · producto.html · b2b.html · marcas.html · nosotros.html · contacto.html
│   ├── tokens-v2.css          # Design tokens v2 (vigente)
│   ├── theme.css · v2.js
│   └── assets/ · fonts/
├── wireframe/                 # Esqueleto vacío (HTML) por plantilla
├── seo-data/                  # Datos reales: inventario de URLs, análisis GSC/GA4, exports
│   ├── INVENTARIO-URLS.md · ANALISIS-GSC.md · ANALISIS-GA4.md
│   └── sitemap-oxatis.xml · urls-oxatis.txt · gsc-export-*
├── auditoria-sitio-actual/    # Auditoría del sitio actual (OXATIS)
└── benchmark-competencia/     # Benchmark de competencia y proveedores
```

---

## 🔴 Regla de oro: NO PERDER SEO

Migramos de OXATIS → Next.js **conservando el dominio `homea.mx`**. El riesgo #1 es perder el posicionamiento orgánico (~56.5k clics en 16 meses de línea base). Toda decisión de URLs, contenido y publicación se valida contra el **[Playbook de Migración SEO](docs/PLAYBOOK-MIGRACION-SEO.md)**.

---

## 📊 Estado actual

- [x] Contexto y arquitectura definidos
- [x] Documentación base creada
- [x] Infra confirmada (GoDaddy DNS + OXATIS conviviendo)
- [🟡] **Fase 0 — Descubrimiento y blindaje SEO** (en curso)
  - [x] Inventario de URLs (3,358) y línea base GSC (16 meses)
  - [x] Análisis GA4 (lead-gen, $0 revenue directo)
- [ ] Fase 1 — Concepto + arquitectura de secciones de la landing
- [ ] Construcción del front-end Next.js

Detalle completo en **[docs/PLAN-DE-FASES.md](docs/PLAN-DE-FASES.md)** y en `CLAUDE.md`.

---

## 👀 Ver el preview

El preview es HTML/CSS estático — basta abrirlo en el navegador:

```bash
open preview/home.html
```

O servirlo localmente:

```bash
cd preview && python3 -m http.server 8080
# http://localhost:8080/home.html
```

---

## 🤝 Trabajar en este repo

```bash
git clone https://github.com/Homeaamx/homea.mx.git
cd homea.mx
```

Cuando se scaffoldee el front-end Next.js, el `.gitignore` ya excluye `node_modules/`, `.next/`, `.vercel/` y archivos `.env`.

---

*Repositorio privado · Homeaamx · proyecto interno HOMEA.*
