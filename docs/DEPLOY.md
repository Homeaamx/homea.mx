# Guía de Deploy — HOMEA Landing Page

> Cómo se construye, configura y publica el sitio. Arquitectura **headless**:
> **Next.js (App Router) en Vercel** + **Shopify solo ecommerce** vía **Storefront API**.
> Dominio de producción: **`www.homea.mx`**.

---

## 1. Resumen de la arquitectura de deploy

```
GoDaddy (DNS)  ──CNAME/A──►  Vercel (Next.js · edge · next/image · SSG/ISR)
                                   │
                                   ├── Storefront API (GraphQL) ──► Shopify (catálogo, inventario, carrito)
                                   ├── Checkout hospedado ─────────► Shopify (homeashop.mx, noindex)
                                   └── Leads (form propio) ────────► KOMMO (API/webhook)
```

- **Front-end:** Vercel hospeda el build de Next.js y lo sirve desde su edge network.
- **Datos de producto:** se consumen en build (SSG/ISR) o request (SSR) desde Shopify Storefront API.
- **Checkout:** permanece en Shopify (`homeashop.mx`), que va `noindex`/password para no competir en búsqueda.
- **Regla de oro:** ninguna decisión de deploy puede romper el SEO. Ver [PLAYBOOK-MIGRACION-SEO.md](PLAYBOOK-MIGRACION-SEO.md).

---

## 2. Requisitos previos

| Requisito | Detalle |
|---|---|
| Cuenta Vercel | Conectada al repo `Homeaamx/homea.mx` |
| Node.js | LTS (≥ 20) localmente para desarrollo |
| Acceso Shopify | App/canal con **Storefront API token** (`homeashop.mx`) |
| Acceso GoDaddy | DNS de `homea.mx` |
| KOMMO | Endpoint/API key para envío de leads |
| GA4 + Meta | Measurement ID y Pixel ID / token CAPI |

---

## 3. Variables de entorno

Definir en **Vercel → Project → Settings → Environment Variables** (y en `.env.local` para desarrollo). **Nunca** commitear valores reales — `.env*` está en `.gitignore`.

```bash
# Shopify Storefront API
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=homeashop.mx
SHOPIFY_STOREFRONT_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_STOREFRONT_API_VERSION=2025-01

# Revalidación on-demand (ISR) — webhook desde Shopify
SHOPIFY_REVALIDATION_SECRET=xxxxxxxx

# Leads
KOMMO_WEBHOOK_URL=https://...
KOMMO_API_TOKEN=xxxxxxxx

# Analítica
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=xxxxxxxxxx
META_CAPI_TOKEN=xxxxxxxx

# Sitio
NEXT_PUBLIC_SITE_URL=https://www.homea.mx
```

> Mantener un `.env.example` (sin secretos) en el repo como plantilla. Está permitido por `.gitignore` (`!.env.example`).

---

## 4. Build & deploy en Vercel

### Configuración del proyecto
- **Framework preset:** Next.js (autodetectado)
- **Build command:** `next build` (default)
- **Output:** `.next` (default, gestionado por Vercel)
- **Install command:** `npm install` (o el package manager elegido)

### Flujo de deploy (Git-driven)
Vercel despliega automáticamente al hacer push:

| Rama | Resultado |
|---|---|
| `main` | **Production** → `www.homea.mx` |
| `test` | **Preview** → URL temporal de Vercel (staging) |
| cualquier otra | **Preview** por rama/PR |

1. Trabajar en `test` (o feature branch).
2. Push → Vercel genera un **Preview Deployment** con URL única.
3. Validar el preview (Core Web Vitals, render SSR, links).
4. Merge a `main` → **Production deploy** automático.

### Comandos locales
```bash
npm install           # instalar deps
npm run dev           # desarrollo local (http://localhost:3000)
npm run build         # build de producción
npm start             # servir el build localmente
```

---

## 5. DNS (GoDaddy → Vercel)

1. En Vercel: **Project → Settings → Domains** → agregar `www.homea.mx` (y `homea.mx`).
2. En GoDaddy (DNS de `homea.mx`):
   - `www` → **CNAME** → `cname.vercel-dns.com`
   - `@` (apex) → **A** → IP que indique Vercel (o redirección apex→www).
3. Definir el **canónico** del sitio en `www.homea.mx` y redirigir el apex a `www` (o viceversa, una sola versión canónica).
4. Esperar propagación y verificar HTTPS (Vercel emite el certificado).

> Coexistencia durante migración: OXATIS y `homea.oxatis.com` siguen vivos hasta el cutover. El switch real es cambiar el DNS de `www` a Vercel.

---

## 6. Checklist SEO de deploy (crítico)

Antes de apuntar el DNS de producción a Vercel, confirmar:

- [ ] **SSR/SSG/ISR activo** — páginas de producto/categoría sirven HTML renderizado (no client-only).
- [ ] **Redirects 301** del mapa de migración cargados (`next.config.js` / `vercel.json` / middleware). Next.js emite 308 con `permanent:true`; forzar 301 si se requiere. Ver [PLAN-REDIRECTS-MIGRACION.md](PLAN-REDIRECTS-MIGRACION.md).
- [ ] **`sitemap.xml`** propio (App Router `sitemap.ts`) accesible.
- [ ] **`robots.txt`** propio correcto.
- [ ] **Canónicos** por página (Metadata API).
- [ ] **JSON-LD** (Product, BreadcrumbList, Organization, FAQ).
- [ ] **Shopify storefront NO indexable** — `homeashop.mx` con password / `noindex`.
- [ ] GA4 + Meta Pixel/CAPI inyectados y disparando.
- [ ] Verificar propiedad en Google Search Console y reenviar sitemap tras el cutover.

---

## 7. Revalidación ISR (~25k productos)

No se buildean los 25k productos de golpe. Se usa **ISR / on-demand revalidation**:

- Páginas de producto con `revalidate` (tiempo) o `revalidatePath`/`revalidateTag` on-demand.
- **Webhook de Shopify** (product update/inventory) → endpoint Next.js (`/api/revalidate`) protegido con `SHOPIFY_REVALIDATION_SECRET` → revalida la ruta afectada.

---

## 8. Rollback

- En **Vercel → Deployments**, cada deploy es inmutable. Para revertir producción: **Promote** un deployment anterior conocido como bueno (instantáneo, sin rebuild).
- A nivel git: `git revert <commit>` en `main` y push (genera un nuevo deploy limpio).

---

## 9. Estrategia de ramas

| Rama | Uso |
|---|---|
| `main` | Producción (`www.homea.mx`). Solo merges validados. |
| `test` | Staging / pruebas. Preview en Vercel. |
| feature branches | Cambios puntuales → PR → `test`/`main`. |

Mantener `main` y `test` sincronizadas salvo durante una prueba activa.

---

*Documento de deploy · actualizar conforme se construya el front-end Next.js.*
