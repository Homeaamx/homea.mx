# Plan de Fases — Landing HOMEA

> **Arquitectura (actualizado 2026-06-10): HEADLESS.** Front-end propio en **Next.js** publicado en **Vercel** (`www.homea.mx`); **Shopify solo como ecommerce** vía Storefront API (catálogo, carrito, checkout hospedado). Ver `CLAUDE.md §3`. Sustituye la ruta previa "TODO EN SHOPIFY".

Estado: 🔵 pendiente · 🟡 en curso · ✅ hecho

---

## ✅ Fase 0 — Descubrimiento y blindaje SEO
*La fase que evita perder posicionamiento. Va primero, sí o sí.*

- [x] **Contexto Homea** documentado (`CLAUDE.md`).
- [x] **Accesos confirmados:** GSC `https://www.homea.mx/` verificado; hoy sirve OXATIS (coexisten `homea.mx` y `homea.oxatis.com`).
- [x] **Línea base SEO:** export GSC 16 meses (~56.5k clics) → `seo-data/ANALISIS-GSC.md`; GA4 → `seo-data/ANALISIS-GA4.md`.
- [x] **Inventario de URLs** (3,358) → `seo-data/INVENTARIO-URLS.md` + borrador del **mapa 301** → `docs/PLAN-REDIRECTS-MIGRACION.md`.
- [ ] Captura competitiva HOMEA vs ARTEXA (opcional, baja prioridad).

**Entregable:** ✅ línea base SEO + inventario + mapa 301 borrador. **(Decisión Carla 2026-06-04: avanzar con lo disponible, no instrumentar OXATIS.)**

---

## ✅ Fase 1 — Estrategia de conversión y arquitectura
- [x] **Análisis** (auditoría + benchmark) → `docs/FASE1-ANALISIS-Y-SECCIONES.md`.
- [x] **Concepto + secciones por plantilla** (7 plantillas), modelo híbrido lead alto-ticket vs. compra directa.
- [x] **Design system v2** definido (bone/greige, Newsreader+Montserrat, oro champagne) → `preview/tokens-v2.css`.
- [x] Lógica **"Cotizar" (Fase 1) vs "Comprar" (Fase 2)** definida en el diseño.

**Entregable:** ✅ mapa de secciones + design system v2 + concepto.

---

## ✅ Fase 2 — Diseño navegable (preview de alta fidelidad)
- [x] **7 plantillas** construidas sobre el design system v2: home, PLP (colección), PDP (producto), B2B/Proyectos, marcas, quiénes-somos/showroom, contacto.
- [x] **Fotografía real** de marcas integrada (Sub-Zero, Wolf, Miele, Thermador, Monogram + proyectos propios) desde OneDrive → `preview/assets/photos/`.
- [x] Interacciones: hero rotativo, nav claro→oscuro, reveals, filtros, tablas de specs.
- [x] **Preview offline autocontenido** (`preview/offline/`) para revisión sin servidor.
- [ ] Ajustes finales de diseño según feedback de Carla (en curso).
- [ ] ⭐ **Rehacer la página de Garantías** (`/garantias-instalacion`) — pendiente marcado por Carla el 2026-07-27. Ya está enlazada desde el nav (botón "Garantías"), pero el contenido/diseño se queda corto: hero con mucho aire vacío, banda "¿Caso abierto o una urgencia?" en gris plano fuera del sistema v2 y formulario de solicitud sin trabajar. Falta definir con Carla el alcance (qué debe comunicar y qué hace el formulario).

> 🔁 **Recordatorio de respaldo (Carla):** aunque el sitio **aún NO está publicado**, **subir `test` → `main` de vez en cuando** (`git push origin test:main`) para mantener `main` como copia segura del avance. Hacerlo después de cada bloque de cambios del preview.

**Entregable:** ✅ preview navegable aprobado = base visual para construir el front-end. ← **AQUÍ ESTAMOS**

---

## 🟡 Fase 3 — Front-end Next.js en Vercel + SEO técnico propio
*Traducir el preview a una app real. El SEO técnico lo construimos nosotros (Shopify ya no lo da).*

### 3.1 Proyecto base
- [ ] Crear proyecto **Next.js (App Router)** partiendo de `/preview`; tokens v2 → CSS Modules/Tailwind.
- [ ] Componentizar: Nav, Hero, mega-menú, PLP, PDP, formularios, footer.
- [ ] Desplegar en **Vercel** (dominio temporal) con **SSR/SSG/ISR** (obligatorio por SEO).
- [ ] **Rendimiento de imágenes** (ver `docs/ESTRATEGIA-IMAGENES.md`): `next/image` con loader a **Shopify CDN** para producto; hero con `priority` (es el LCP); lazy-load en el resto; AVIF/WebP + `srcset`.

### 3.2 Conexión Shopify (headless)
- [ ] Crear **app personalizada / canal Headless** en Shopify → **token privado** Storefront API.
- [ ] **Proteger con contraseña** la tienda `homeashop.mx` (no indexable) — *Opción A, pendiente de activar.*
- [ ] Traer productos vía Storefront API (empezando por los 3 de prueba).
- [ ] ⭐ **Conectar el PLP de Refrigeradores a productos reales** (pendiente Carla, 2026-07-29).
  La página `/productos/cocina-y-bar/refrigeracion/refrigeradores` ya está completa
  de interacción: el mosaico de subcat.3 marca el tipo elegido, refleja el filtro
  en la barra lateral, lleva el estado en la URL (`?f=<tipo>`) y baja solo al
  catálogo. **Lo único que falta son los productos**: hoy la rejilla muestra
  placeholders. Al cargar el catálogo hay que (a) sustituir los placeholders por
  las tarjetas reales de Shopify vía Storefront API, (b) traducir `?f=<tipo>` al
  filtro de Shopify (metafield `facetas.instalacion` / `facetas.diseno` según el
  eje del tipo) y (c) actualizar el contador "N piezas en línea". El resto de los
  filtros de la barra (`lib/filtrosPlp.ts`) se conectan en el mismo paso.

### 3.3 SEO técnico (lo construimos nosotros)
- [ ] **Redirects 301** del mapa → `next.config.js`/`vercel.json`.
- [ ] **`sitemap.xml`** propio + **`robots.txt`** propio.
- [ ] **Canónicos** y metadatos por página (Metadata API).
- [ ] **JSON-LD** (Product, BreadcrumbList, Organization, LocalBusiness/Querétaro, FAQ).

### 3.4 Tracking + leads (limpio desde día 1)
- [ ] **GA4** + **Meta Pixel/CAPI** inyectados desde el front-end (sin GTM heredado).
- [ ] Preservar audiencias de remarketing.
- [~] ~~**Formulario de leads → KOMMO** (API/webhook).~~ **KOMMO descartado (decisión Carla, 2026-09-25): no le funciona.**
- [x] ⭐ **Lista de correos en Shopify, sin costo extra (2026-09-25).** El campo de correo del formulario de Contacto (punto 6, con casilla de consentimiento) publica en `/api/lead` → `lib/shopify/admin.ts` → `customerCreate` con `emailMarketingConsent`. Los contactos quedan como **clientes de Shopify**, que es la lista que usa **Shopify Messaging** (antes Shopify Email): **10,000 correos gratis al mes** en el plan Basic de HOMEA, luego $1 USD por cada 1,000. Verificado en el Help Center, no de memoria. Se descartaron Neon/Supabase/Resend por no añadir proveedor ni factura.
  - [x] ~~**PENDIENTE (Carla):** crear la app en el **Dev Dashboard** (ver 3.4 ter) con permisos `write_customers` y `read_customers`, instalarla en la tienda y poner `SHOPIFY_ADMIN_CLIENT_ID` y `SHOPIFY_ADMIN_CLIENT_SECRET` en `.env.local` y en Vercel (3 entornos). Sin eso, `/api/lead` no guarda nada: solo deja el correo en el log del servidor y avisa.~~ **Hecho 2026-09-25.**
  - [ ] Cuando se migre al CRM definitivo **solo se toca `app/api/lead/route.ts`**: el formulario no cambia. La lista se saca del admin de Shopify en CSV.
- [ ] Botón/flotante **WhatsApp** → `https://api.whatsapp.com/send/?phone=524461446318` (cel. 446 144 6318). **Ya implementado en el preview** en las 7 plantillas.

### 3.4 bis Newsletter: recabar correos y mandarlos ⭐ NUEVO (2026-09-25)
*Sustituye a KOMMO. La lista y el envío ya están pagados con el plan de Shopify.*

**Dónde vive la lista.** Los contactos son **clientes de Shopify con consentimiento
de marketing**, que es exactamente la lista que lee **Shopify Messaging** (antes
Shopify Email): **10,000 correos gratis al mes** en el plan **Basic** de HOMEA,
después $1 USD por cada 1,000 (verificado en el Help Center). Manda correo, SMS y
WhatsApp desde el admin. Hoy la tienda tiene **0 clientes**: la lista arranca limpia.

**Recabación — dónde se pide el correo:**
- [x] **Contacto** — punto 6 del formulario de cotización: correo + casilla de
  consentimiento. Publica en `/api/lead`.
- [ ] **Guías / blog** — bloque de suscripción al final de cada artículo y en el
  índice de `/guias`. Mismo endpoint, `origen: "guias"` (o el slug del artículo)
  para saber **qué contenido trae lista**. Es el complemento natural de la cadencia
  quincenal de la **Fase 6**: se publica un artículo, se capta, se remarca.
- [ ] Evaluar un tercer punto: pie de página del sitio (alcance máximo, contexto mínimo).

**Consentimiento y legal — no es opcional:**
- [x] Casilla de consentimiento **marcada por defecto (decisión Carla, 2026-09-25)**:
  "Quiero recibir novedades, catálogos y ofertas de HOMEA por correo. Puedo darme de
  baja cuando quiera. *Aviso de privacidad*" (enlace). Se guarda como `SUBSCRIBED` /
  `SINGLE_OPT_IN`; si la desmarca, el contacto se guarda **sin** consentimiento de
  marketing y no entra a campañas. La nota bajo el botón dice que los datos se usan
  para la cotización y, si la casilla queda marcada, para novedades.
- [x] **Conexión probada (2026-09-25):** app "HOMEA Sitio Web" del Dev Dashboard
  instalada; credenciales en `.env.local` y en Vercel (Production + Preview). Un
  envío real desde `/contacto` creó el cliente en Shopify con etiquetas
  `contacto` + `homea.mx` y estado `SUBSCRIBED`.
- [x] **Aviso de privacidad** (2026-09-25): el texto vive en **Shopify** (Configuración →
  Políticas; lo usa también el checkout) y el sitio lo pinta en `/aviso-de-privacidad`
  por Storefront API (`lib/shopify/politicas.ts` + `components/PaginaPolitica.tsx`,
  revalidación diaria). Igual con `/terminos`. Enlazado desde la casilla de Contacto
  y el pie de página. **Para cambiarlo se edita en Shopify, no en el código.**
  - [x] Correo de contacto del aviso: se queda `administracion@homea.mx` (Carla, 2026-09-25).
  - [ ] Enlazarlo también en cada punto de captura nuevo (bloque de Guías).
- [ ] Baja funcional: Shopify Messaging mete el enlace de baja, pero hay que
  verificarlo en el primer envío real.
- [ ] Decidir si se sube a **doble opt-in** (`CONFIRMED_OPT_IN`) cuando el volumen
  crezca: mejora entregabilidad a costa de perder parte de las altas.

**Envío — lo que falta para mandar la primera campaña:**
- [ ] Instalar **Shopify Messaging** en el admin y verificar el dominio remitente
  (SPF/DKIM de `homea.mx`) — sin eso, Gmail y Outlook mandan todo a spam.
- [ ] ⭐ **PENDIENTE (Carla, 2026-09-25): correo de bienvenida automático** al suscribirse.
  Se arma en Shopify Messaging → Automatizaciones, disparado por "cliente suscrito a
  marketing por correo". Aplica a los contactos del sitio (`/api/lead`) y del checkout.
- [ ] Activar la casilla de marketing **en el checkout de Shopify** (Configuración →
  Pantalla de pago → Suscripción a marketing → Correo electrónico): hoy está en "No
  mostrar", así que quien compra no entra a la lista. Es independiente del formulario
  del sitio, que ya guarda el consentimiento por API.
- [ ] Segmentar por las etiquetas que ya manda `/api/lead` (`contacto`, `guias`, …).

**Cambio futuro de herramienta:** la lista se exporta en CSV desde el admin de
Shopify y **solo se toca `app/api/lead/route.ts`**. El formulario no se entera.

### 3.4 ter App de Shopify: qué desbloquea y qué NO ⭐ NUEVO (2026-09-25)

**Hay que crearla en el Dev Dashboard, no en el admin.** Desde el 1 de enero de 2026
las apps personalizadas se crean y administran en el **Dev Dashboard**; las que se
creaban dentro del admin ("Develop apps") quedaron como legacy. **Y la diferencia no
es cosmética:** el acceso a datos personales de cliente **Nivel 2** (nombre, correo,
teléfono, dirección) es *"siempre disponible"* para una **custom app del Dev
Dashboard**, pero *"varía según el plan"* para una **admin created custom app** — y
el plan **Basic no tiene Nivel 2**. Creada por el camino equivocado, **el guardado de
correos no funcionaría**.

**Lo que la app SÍ desbloquea:**
- [ ] **Acceso a la Admin API** → guardar correos (`/api/lead`, ya construido) y, en
  Fase 4, subir/actualizar catálogo y precios desde SAE por script. **Ojo con la
  forma de autenticar:** desde 2026 ya no existen las apps del admin que entregaban
  un token fijo `shpat_…`. Una app del Dev Dashboard que actúa sobre la propia
  tienda usa **client credentials grant**: el servidor cambia `client_id` +
  `client_secret` por un token que **caduca a las 24 h** y se renueva solo. Por eso
  en el `.env` hay credenciales, no un token (`lib/shopify/admin.ts`).
- [ ] **Webhooks** → `products/update` y `inventory_levels/update` a un endpoint del
  sitio para **revalidar la ficha en Vercel** (ISR on-demand). Con ~16k productos
  esto deja de ser un lujo: es la única forma de que un cambio de precio o de
  existencia se vea sin reconstruir el sitio. Ya hay `SHOPIFY_REVALIDATION_SECRET`
  reservado en `.env.example`.
- [ ] **Shopify Flow** (triggers/acciones) para automatizar avisos internos.

**Lo que la app NO puede dar, y conviene no perseguir:**
- ❌ **"Productos más clickeados".** El sitio es **headless**: Shopify solo ve lo que
  pasa por el **checkout**. Las visitas y los clics de `homea.mx` **nunca llegan a
  Shopify** (el web pixel solo funciona en el Online Store de Shopify, que aquí no
  se usa). Ese dato sale de **GA4** (Fase 3.5) o de nuestro propio registro de eventos.
- ❌ **Dashboard de ventas dentro de una app.** El admin de Shopify ya trae Analytics;
  rehacerlo en una app embebida es trabajo sin ganancia.
- ⚠️ **`npm init @shopify/app@latest` arma un proyecto de app embebida completo**
  (React Router + OAuth + hosting propio). Para lo que HOMEA necesita hoy —un token y
  webhooks— es desproporcionado y mete una segunda aplicación a mantener. Solo vale
  la pena si algún día se quiere **interfaz dentro del admin de Shopify**.

**Propuesta para los tableros (pendiente de decisión):** un **panel interno en el
propio sitio** (ruta protegida), no una app embebida, porque los números viven en dos
lados y hay que juntarlos: ventas y stock por **Admin API**, comportamiento del sitio
por **GA4**, y leads/suscriptores por la lista de Shopify. Es lo único que hoy no
existe en ninguna herramienta.

### 3.5 Google Ads + rastreo de clicks (conversiones) ⭐ NUEVO
*Cada clic relevante debe ser rastreable a la cuenta de Google de HOMEA.*
- [ ] Crear/instalar **GA4** y vincularlo con **Google Ads** (import de conversiones).
- [ ] Configurar **etiqueta de conversión de Google Ads** (gtag/`AW-XXXX`) en el front-end.
- [ ] **Evento `whatsapp_click` → marcar como CONVERSIÓN** en GA4 e importarlo a Google Ads. *El disparo ya está cableado en el preview (`v2.js`): cada clic de WhatsApp empuja `whatsapp_click` a `dataLayer` y a `gtag` con `data-label` (`wa_float`, `wa_contacto_directo`). Solo falta inyectar GA4/Ads para que registre.*
- [ ] Marcar también como conversión: envío de formulario (lead→KOMMO), clic en "Cotizar"/"Agendar", clic-a-llamar del teléfono de oficina.
- [ ] Verificar con **Tag Assistant / GA4 DebugView** que cada clic llega a la cuenta antes de invertir en campañas.
- [ ] Actualizar **destino de las campañas de Google Ads** a la nueva landing (`www.homea.mx` en Vercel) en el corte de migración (Fase 5).
- [ ] Marcar como conversión la **compra directa** (checkout Shopify, bajo ticket) → alimenta la **campaña de Shopping (Fase 4.6)** con valor de conversión (ROAS).

### 3.6 Adaptación a móvil y tablet ⭐ NUEVO (2026-09-09)
*Subido desde Fase 5: el rendimiento y la usabilidad móvil son LA oportunidad frente a OXATIS (0 URLs "Good" en móvil), y hoy el catálogo era inalcanzable desde la barra en celular.*
**Breakpoints canónicos** (se sustituyen los ~17 dispersos entre 560 y 1279 conforme se toca cada página): **640** móvil · **900** móvil grande / tablet vertical · **1024–1080** tablet. Todo dentro de `max-width`: el escritorio no cambia.
- [x] **Presentación del catálogo en el cajón (decisión Carla, 2026-09-10) — tres niveles:**
  0. La barra en **lista de texto** (Productos, Marcas, Proyectos, Ofertas, Guías, Herramientas, Garantías, Nosotros) más los botones de contacto. Cabe entera en una pantalla.
  1. Al tocar **Productos**, el **mosaico de fotos** de las 10 macrocategorías.
  2. Al tocar una macro, sus subcategorías y tipos otra vez en **lista de texto**.
  Los recortes del menú viven en `assets/photos/menu/` (660×300, 97 KB las 10) y se referencian con `data-menu-img` en cada `.mega-cat`. **No se descargan hasta entrar a Productos:** van en `data-src` y `avanzar()` los suelta al revelar el panel — con `src` puesto, el navegador los pedía al abrir el cajón aunque el panel estuviera fuera de pantalla por `transform`.
  **Pendiente de contenido:** las fotos de **Baños** y **Vapor y Sauna** no funcionan como banda horizontal (quedan casi vacías al recortar, y el recorte automático por contenido no lo salva); pedir dos tomas mejores del OneDrive.
- [x] **Cajón de navegación (móvil y tablet)** — el mega-menú se ocultaba a ≤1080px y "Productos" quedaba muerto: las 10 macrocategorías y sus ~180 enlaces eran inalcanzables desde la barra. Ahora la hamburguesa (visible ≤1080px, al final de la barra) abre un cajón de dos niveles que `v2.js` **construye leyendo el propio mega-menú** (sin lista duplicada que mantener). Incluye velo en tablet, bloqueo de scroll, foco y Escape.
- [x] **Scroll horizontal cerrado** — las 12 rutas miden 0px de desborde a 360, 390, 768, 1024 y 1440. Causas y arreglos: el PLP mantenía la rejilla de 2 columnas (filtros + productos) también en móvil porque el CSS de página se inyecta después de `theme.css` y ganaba sin media query; la fila de botones de garantías era `flex:none` y tomaba el ancho máximo de su contenido; en contacto y marcas un `display:flex` sin `flex-wrap` con dos botones `nowrap` fijaba 450px de contenido mínimo; el buscador de fichas de herramientas no cabía con input y botón en la misma fila; y a 360px el aire de la barra del nav empujaba la hamburguesa 9px fuera.
- [x] **Filtros del PLP en móvil** — apilados sobre la rejilla medían ~2 000px y el primer producto quedaba a ocho pantallas de scroll (y=3036). Ahora `v2.js` los envuelve en un desplegable "Filtrar" y el primer producto aparece a y=935. En escritorio el aside no cambia.
- [ ] **Pantallas de 320px** (iPhone SE 1.ª gen) — quedan desbordes en `/producto/[slug]` (26px), `/garantias-instalacion` (13px) y `/contacto` (8px). Decisión pendiente de Carla: se persiguen o se fija 360px como piso soportado.
- [x] **Pasada móvil de tamaños y densidad (2026-09-28)** — bloque "Fase 3.6 · Pasada móvil" al final de `styles/theme.css` y `preview/theme.css` (+ `styles/guias.css`, `preview/garantias-instalacion.html`, `preview/herramientas.html`). Todo dentro de `max-width`; el escritorio no cambia. Qué se corrigió:
  - **/marcas:** 92 tiles en una sola columna = 25 800px de página. Ahora 2 columnas en móvil (tile 167×89) y 3 en tablet → 13 300px.
  - **Reseñas Google (home):** el `<figure>` traía el margen UA de 40px por lado (tarjeta de 260px en 342, 650px de alto); ahora a todo el ancho (escenario 693 → 455px).
  - **Showroom (home):** etiqueta y dato apilados en el panel de cristal; menos aire.
  - **PDP a una columna (≤1080):** el CTA "Agregar al carrito / Cotizar" pasa **justo debajo del precio** (antes iba dos pantallas abajo, tras la tabla de specs). La equivalencia MXN se queda con el precio. Se agregó `class="pdp-cta"` a las 5 fichas.
  - **Botones:** `.btn` ya puede saltar de línea en móvil (ofertas: "Enviar cotización por WhatsApp" medía 374px en 342).
  - **PLP:** toolbar apilada; `<select>` de orden 17 → 44px; checkboxes 18px con label de 40px; paginador (`class="pager"` en 13 listados) ya no parte "01 / 01".
  - **Cabeceras con enlace (`.sec-head-row`):** apiladas (PDP "Completa la cocina").
  - **Herramientas:** las 3 secciones borrosas de "próximamente" medían ~4 000px; recortadas a 520px c/u con la tarjeta pegada (8 547 → 6 705px).
  - **Garantías:** correos partidos a media palabra en 2 columnas → `overflow-wrap`, tipografía compacta.
  - **Guías:** hero a `100svh` (sin salto por la barra del navegador) y buscador a todo el ancho.
  - **Áreas táctiles:** flecha del hero 30 → 44px, puntos del carrusel de reseñas con 44px invisibles, cierre del wishlist 44px.
  - Verificado: **0 px de desborde en 13 rutas a 390, 768 y 1024**; el cajón de navegación se abre bien.
- [ ] **Decisiones de diseño pendientes de Carla (móvil):**
  - Home "Todos tus espacios": 10 tiles a una columna de 293px = 2 900px de scroll. ¿Dos columnas (tile ≈ 170×200) o se deja el recorrido largo?
  - Barra utilitaria (tipo de cambio · Cuenta): texto de 10px y 38px de alto; es cosmética, pero "Cuenta" tiene 15px de área táctil.
  - PLP: la pista "Pasa el cursor por cada pieza · da clic para explorar" del hero interactivo se lee también en táctil.
  - Riel de subcategorías (PLP): en 390 solo caben 2 tiles de ~280px de alto; se podría compactar.
- [ ] **PDP y home** en móvil: altura del hero, carrusel, galería. *(El CTA de la ficha ya se movió; lo demás se ve bien en la pasada del 28/09.)*
- [~] **Pasada de tablet** (768–1024): sin desbordes en las 13 rutas (2026-09-28); marcas a 3 columnas; PDP con CTA bajo el precio. Falta revisar densidad de rejillas plantilla por plantilla.
- [ ] **QA final:** 375 · 390 · 414 · 768 · 820 · 1024, áreas táctiles ≥44px, `prefers-reduced-motion`, y verificación de que el escritorio quedó idéntico.
> **Cómo se audita:** con el dev server arriba, se cargan las rutas en iframes de ancho fijo y se mide `scrollWidth - clientWidth` por ruta, listando los elementos que sobresalen. Repetir tras cada bloque. Para **ver** una sección en móvil desde el panel del navegador: iframe de 390px de ancho desplazado por dentro (`contentWindow.scrollTo`) y captura; el scroll de la ventana principal sale en blanco.

**Entregable:** front-end en Vercel (dominio temporal), conectado a Shopify, con SEO técnico y **tracking de conversiones (incl. clicks de WhatsApp) verificado en GA4 + Google Ads**.

> La cuenta de Google Ads y el tracking que se montan aquí son el **cimiento** de la **campaña de Google Shopping** descrita en la **Fase 4.6** (esa depende de tener catálogo con datos+imágenes, por eso vive en Fase 4).

---

## 🔵 Fase 4 — Catálogo, ecommerce funcional y filtros
*El ecommerce no es la venta principal, pero **DEBE funcionar bien**. Escala: ~~25,000~~ → **~16,071 productos a Shopify** (68 marcas) + ~1,999 solo PDF, según la asignación por marca del 2026-09-21.*
*4.1 y 4.2 (datos + imágenes) pueden correr **en paralelo** desde ya (skill `homea-operaciones`).*

> ⭐ **DECISIÓN — Alcance de Shopify por macrocategoría (Carla, 2026-09-21).**
> **No todo el catálogo se sube a Shopify.** Solo van a la venta las categorías que son nuestro
> fuerte; el resto se presenta **únicamente como PDF**, por medio de botones en la página de cada
> marca (`/marcas/<slug>`), y se queda en el sitio por SEO.
>
> | Macrocategoría | Shopify (a la venta) | Solo PDF desde la página de marca |
> |---|---|---|
> | Cocina y Bar | ✅ toda | |
> | Exterior | ✅ solo **Asadores & Hornos** | **Alberca** |
> | Electrodomésticos menores | ✅ toda | |
> | Lavandería | ✅ toda | |
> | Aire acondicionado (antes Minisplits) | ✅ toda | |
> | Baños | | ✅ |
> | Vapor y Sauna | | ✅ |
> | Wellness | | ✅ |
> | Recubrimientos y Superficies | | ✅ |
> | Chimeneas & Calentadores | | ✅ |
>
> **Por ahora solo queda anotado; todavía no se cambia nada.** Se aplica en la limpia de marcas.
>
> - [ ] **Limpia de marcas + asignación**: a cada una de las 77 marcas de `data/marcas.json` se le
>   asigna si aparece en Shopify o solo como PDF. Una misma marca puede caer en los dos lados si
>   vende en categorías de ambos grupos (se resuelve marca por marca en la limpia).
> - [ ] **Qué hay que revisar cuando se aplique** (no antes):
>   - La depuración de 4.1 y el import de 4.3 se limitan a las macros de Shopify. El **~25k baja**:
>     hay que recalcularlo.
>   - Las macros que van solo como PDF no tendrán listado de productos ni carrito. Hay que decidir qué muestran su PLP y el
>     mega-menú (¿enlazan a las marcas o a los PDFs?) sin romper las URLs que ya rankean
>     (`docs/PLAYBOOK-MIGRACION-SEO.md`, `docs/PLAN-REDIRECTS-MIGRACION.md`: hoy el mapa de
>     OXATIS manda esos productos a su listado de familia).
>   - Botones de PDF en `/marcas/<slug>`: los PDFs se sirven desde Shopify Files
>     (`data/listas-precios.json`), igual que las listas de precios actuales.
>   - Buscador (lupa) e índice: decidir si los productos que solo van como PDF aparecen en el buscador y a dónde llevan.
>   - Google Shopping (4.6): el feed solo incluye las macros de Shopify.

> ⭐ **ASIGNACIÓN POR MARCA — canal web y descuentos (Carla, 2026-09-21, `MARCAS_HOMEA_SEP26_DESCUENTOS.xlsx`).**
> Detalle marca por marca (proveedor, línea SAE, productos, descuento, página actual y notas):
> **`docs/MARCAS-CANAL-Y-DESCUENTOS.md`**. **Esta lista manda sobre la tabla por macro de arriba.**
> Hay marcas de cocina o asadores que van solo como PDF (Kamado Joe, Masterbuilt, WPPO, La Cornue…). De Brizo,
> Delta y Axcent **solo se trabaja la línea de cocina** (Carla, 2026-09-21).
>
> - **SHOPIFY (68 marcas, ~16,071 productos tras la carga):** catálogo, filtros y carrito en Shopify; su
>   página de marca lleva listado de productos.
> - **SOLO PDF (25 marcas, ~1,999 productos + Jacuzzi, Clearlight, Onix y Firplak):** el botón de marca en `/marcas` abre `/marcas/<slug>` con
>   **el PDF**, sin filtro de productos de Shopify. La página existe por SEO. Son Fontana, Foster, Kalt, Poletti, Sapphire,
>   WPPO, Kamado Joe, La Cornue, Josper, Masterbuilt, Pizarro, Vass, Hergom, Hergom Diseño, Axor,
>   iDrain / iDrain Proyectos, Mr Steam, Nobili, TRES, Valsir, Artexa Bath, **Jacuzzi y Clearlight** (las saunas de
>   Artexa; no venían en el Excel y se agregaron el 2026-09-21), **Onix** (se queda) y **Firplak** (restaurada).
> - **ELIMINADAS (14):** Catalano, Duplash, Hansgrohe, Inda, Kaldewei, Keuco, Laufen, Kindred,
>   Ambiance, American Standard, Moen y **Saunas de Grupo 90** (descatalogadas el 2026-09-21: solo se
>   presentan las saunas de Artexa), más **Fortum y Steamist** (no venían en el Excel; su lista se retiró el 2026-09-21).
>
> **Descuento Shopify (PLATA) asignado. ⚠️ Se queda así por ahora (decisión Carla, 2026-09-21) y se va a
> modificar más adelante: revisarlo antes de cargar precios.** Las 5 marcas que el Excel marca debajo del
> margen mínimo también se quedan en 10%.
>
> | Descuento | Marcas SHOPIFY |
> |---|---|
> | **5%** | Faber, Lynx, Miele, Sedona, Supra, Tradewind, U-Line, Viking |
> | **10%** | Alfa Forni, Alfresco, Artisan, Asko, Bertazzoni, Blanco, Blaze, Bosch, Brizo, Broil King, Café, Cove, Coyote, Dawn, Delta, Dexa, Eclipse, Electrolux / Electrolux Icon, Elica, Falmec, Franke, Frigidaire / Gallery / Pro, Fulgor Milano, Gaggenau, Gessi, Hoshizaki, InSinkErator, Invisacook, Kele, Kraus, Monogram, Mont Alpi, Nantucket, Pitt, Schock, Scotsman, Smeg, Sub-Zero, Summit, Tecnolam, Teka (estufas económicas 5%), Thermador, Thor, Wolf |
> | **15%** | Axcent, Benessi |
> | **30%** | Acros, Easy, GE Profile, Haier, IEM, IO Mabe, KitchenAid, Mabe, Maytag, Whirlpool (validar margen con lista PPS) |
> | **PENDIENTE** | Commodore, Peerless, The Galley (no están en la política de descuentos) |
>
> Marcas SOLO PDF con descuento: 10% para Axor, iDrain, Mr Steam, Nobili, TRES y Valsir (iDrain Proyectos: no
> aplica). Artexa Bath, Jacuzzi, Clearlight y Onix: pendiente. El resto: sin descuento asignado.
>
> 🔒 Los costos de proveedor, el flete y los márgenes están en el Excel y **no se copian al repo**, porque es público.
>
> - [ ] **Revisar los descuentos** con Carla antes de cargar precios a Shopify (por ahora se quedan como están,
>   la mayoría en 10%). Definir los 3 pendientes de SHOPIFY y Artexa Bath, validar los grupos Mabe y Whirlpool con la lista
>   PPS, y confirmar las excepciones (Teka estufas económicas, Viking Serie 3/6/Tuscany, Eclipse Value Line,
>   Sub-Zero/Wolf fuera de línea, Frigidaire parejas Pro) y las 5 marcas bajo el margen mínimo.
> - [x] **Marcas eliminadas fuera de todo el sitio** (2026-09-21): Hansgrohe, Keuco, American Standard y Moen perdieron
>   página, tile, enlace del mega-menú, fotos, logos y listas de precios (también la de Catalano). Las URLs viejas de sus
>   PDFs redirigen (301) a su categoría (`data/redirects/oxatis-manual.json`). La portada de la guía de Baños usaba una
>   foto Hansgrohe y se cambió por la de la categoría.
> - [x] **20 páginas de marca nuevas** (2026-09-21): 6 SHOPIFY (Kraus, Faber, Easy, IEM, Commodore, Nantucket) y
>   14 SOLO PDF (Fontana, Foster, Josper, Pizarro, Vass, Hergom, Hergom Diseño, TRES, Valsir, Artexa Bath, Jacuzzi,
>   Clearlight, Onix, Firplak). Hoy hay 92 páginas de marca (2026-09-22: + Catalano, Kaldewei, Treesse y Sauna Estilo de Grupo 90, SOLO PDF; − AXOR, TRES, Pizarro, Artexa Bath y Hergom Diseño, eliminadas). Las 92 llevan hero con texto propio (`data/marcas-hero.json`).
> - [x] **Plantilla SOLO PDF** (2026-09-21): `canal` en `data/marcas.json` (sale de `data-canal` del tile). Las marcas
>   `pdf` enseñan su PDF y la cotización por WhatsApp, sin listado ni filtros. Sin logo o sin foto, la página cae a
>   hero oscuro con el nombre.
> - [ ] **Arte de las marcas nuevas:** logos para las 18 que no tienen y fotos para las 17 sin foto (detalle en
>   `docs/MARCAS-CANAL-Y-DESCUENTOS.md`, columna *Arte*). Pedírselos a Carla (la carpeta de OneDrive ya no está
>   sincronizada en esta Mac).
> - [ ] **Confirmar categoría y gama de las marcas nuevas** (lista ❓ en `docs/MARCAS-CANAL-Y-DESCUENTOS.md`).
>   Vass (chimeneas, residencial), Onix (residencial) y Firplak (económica) ya las confirmó Carla.
> - [x] **Fortum y Steamist retiradas** (2026-09-21): sus listas salieron de `data/listas-precios.json` y las URLs viejas
>   de sus PDFs redirigen (301) a Baños y a Vapor y Sauna. Onix se quedó como SOLO PDF.
> - [ ] **Siguiente paso tras subir los catálogos — PDFs marca por marca** (decisión Carla, 2026-09-21): pedirle
>   a Carla el PDF vigente de cada marca, subirlo a Shopify Files y darlo de alta en `data/listas-precios.json`
>   (la página lo toma sola con `npm run marcas`). Orden: primero las marcas de **Cocina y Bar, Exterior,
>   Electrodomésticos menores, Lavandería y Aire acondicionado**; lo demás, después. Revisar cada PDF para que se
>   presente sin error.
>   - [x] **Catálogos vigentes cargados** (2026-09-22): 49 PDFs de `CATALOGOS VIGENTES` (OneDrive) limpios de
>     distribuidor y subidos a Shopify Files; **64 de 92 marcas** ya enseñan su PDF (hero "Ver catálogo oficial" →
>     `/listas-de-precios/<slug>.pdf`). Detalle, criterio y script: `docs/PDFS-OXATIS-PENDIENTES.md` §0.
>   - [x] **Bosch, Gaggenau, Thermador, InSinkErator y Coyote** subidos por indicación de Carla (sin leyendas "Dealer"/
>     "Confidential"; InSinkErator conserva "precios a distribuidor tipo A").
>   - [ ] **Faltan 28 marcas sin ningún PDF** (lista en `docs/PDFS-OXATIS-PENDIENTES.md` §0). Buscar el catálogo vigente.
>   - [ ] **Carla borra en Shopify Files 11 PDFs que ya no usa nadie** (lista en el mismo §0).
> - [ ] **Brizo, Delta y Axcent: solo la línea de cocina.** Al cargar su catálogo, excluir baño. Hoy sus páginas
>   todavía enlazan la categoría Baños: quitarla cuando se cargue el catálogo.
> - [ ] Que el buscador y el sitemap respeten `canal` cuando se conecten al catálogo real.
> - [ ] Recalcular la escala de la depuración (4.1) y del import (4.3) con las ~16k filas de las marcas SHOPIFY.
>
> 🔒 **RECORDATORIO — borrar del repo los documentos con información delicada** (Carla, 2026-09-21). El repo
> `Homeaamx/homea.mx` es **público**: cualquier costo, margen o lista de distribuidor que viva en la carpeta
> se puede descargar.
>
> - [ ] **Al terminar la carga de productos a Shopify, eliminar los Excel de trabajo del catálogo**:
>   `catalogo-shopify/01-DIAGNOSTICO-CATALOGO.xlsx` … `08-ARTEXA-REFERENCIA.xlsx`,
>   `catalogo-shopify/import/*.xlsx` y los CSV de import con precios. Traen precios de lista SAE, precios de
>   proveedor y claves SAE.
> - [ ] ⚠️ **Prioridad: `catalogo-shopify/05-CRUCE-COCINAS-RESTO.xlsx` trae la lista de Mabe que el propio
>   archivo marca como COSTO.** Ya está publicada. Conviene sacarla antes, sin esperar a la carga.
> - [ ] **Borrar el archivo no basta:** sigue en el historial de git, y en un repo público eso se puede leer.
>   Opciones: volver el repo **privado** (Vercel sigue desplegando igual) o purgar el historial (`git filter-repo`,
>   reescribe todos los commits). Lo decide Carla.
> - [ ] Regla desde ya: **ningún Excel con costos, márgenes o listas de distribuidor entra al repo.** Trabajarlos en
>   OneDrive. `MARCAS_HOMEA_SEP26_DESCUENTOS.xlsx` nunca entró.

### 4.1 Preparación / homologación de datos

> ⭐ **Estándar de calidad — SAE ≠ Shopify (regla Carla, 2026-07-30).**
> **SAE es solo para cotizar**, así que tolera datos abreviados: claves incompletas, sin acentos
> (`CAFE` en vez de `Café`), mayúsculas inconsistentes, descripciones truncadas. **Eso está bien y
> no se corrige.** **Shopify es cara al cliente y debe estar completo y correcto: descripción,
> precio, imágenes y SKU.** No se publica un producto a medias.
>
> **El SKU es el caso más delicado:** la clave de SAE es interna y **no** es el número de modelo del
> fabricante. La propia plantilla lo ejemplifica — `CLAVE_SAE = SUB-CL3650` mientras que el
> `SKU_MODELO` real es `CL3650SD/S/T`. En el maestro hay además claves con espacios (`EA 64 BZ`,
> `CHEN100X 078`) y con mayúsculas inconsistentes (`Ms150e`, `MAi805-BSS90` vs `MAI805-BSS90BEV`).
> **A Shopify va el SKU completo del fabricante**; la clave SAE se conserva aparte, en el metafield
> `custom.clave_sae`, como puente hacia pedido/facturación.

- [ ] Exportar ~25k productos (SAE/COI/OXATIS); limpiar duplicados, nomenclaturas, categorías, marcas, características, precios.
- [ ] **Completar SKUs**: reconstruir el número de modelo del fabricante donde la clave SAE esté truncada o abreviada (fuente: listas de proveedor y fichas técnicas). Normalizar mayúsculas y quitar espacios internos.
- [ ] **Corregir la columna `MARCA`** ⭐: 871 filas de 47,133 (1.8%) en **50 valores** no empatan con las 77 marcas oficiales de `preview/marcas.html`. Tres causas: (a) marcas de dos palabras cortadas por el extractor —`THE`+`GALLEY`=The Galley, `MONT`=Mont Alpi, `FULGOR`, `BROIL`, `MR`, `ALFA`, `KAMADO`—; (b) tipo de producto en el campo marca —`TARJA`(Schock/Tecnolam), `LLAVE`(Eclipse), `HORNO`, `LAVAVAJILLAS`, `KIT`, `REFACCION`—; (c) marcas reales ausentes de la página de Marcas —KELE 193, PIZARRO 117, KRAUS 81, SEDONA 50, FIRPLAK 30, POLETTI, COMMODORE, HERGOM— (ver pendiente en `catalogo-shopify/TABLA-MARCA-GAMA.md`). Impacto: `MARCA` alimenta el `Vendor` de Shopify = el filtro de marca del sitio; sin corregir, The Galley sale partido en dos filtros.
- [ ] **Definición de "listo para publicar"** (checklist por producto, todo o nada): SKU completo del fabricante · marca normalizada · tipo/taxonomía asignada · título según `GUIA-TITULOS.md` · descripción y specs · precio con moneda · al menos la imagen principal con nombre SEO. Sin los 7, el producto se queda en borrador.

#### ⭐ DECISIÓN ABIERTA — ¿en qué orden se depura? (pendiente Carla, 2026-07-30)
Dos opciones sobre la mesa: **proveedor por proveedor** o **alfabético por marca**.

**Mi recomendación: por proveedor, y dentro de eso por prioridad de negocio — no alfabético.**
Razón: el proveedor es la unidad natural del dato. La lista de precios, el formato, el portal de
imágenes y el contacto para pedir fichas técnicas son **uno por proveedor**; abrir un proveedor
una sola vez y agotarlo evita repetir el mismo trabajo de extracción. Los cruces ya hechos
(`02`–`05`) también están organizados así. El orden alfabético en cambio no agrupa nada que
comparta origen de datos y mezcla marcas de 17,020 SKUs (Delta) con marcas de 2 (Scotsman).

**Arranque sugerido: Sub-Zero / Wolf / Cove** (~1,000 SKUs). Son un solo origen, son la franquicia
SEO real del sitio (`seo-data/ANALISIS-GSC.md`: refrigeración panelable/built-in), son premium, y
su nomenclatura **ya está decodificada** en `catalogo-shopify/CALIBRACION-MARCAS.md`. Gaggenau ya
sirvió de piloto del patrón (5 fichas + import en borrador).

- [ ] **Carla decide el orden** antes de arrancar la depuración masiva.


- [ ] **Outlet: subir los productos obsoletos que tenemos en oferta** ⭐ (pendiente Carla, 2026-10-06). Hay que revisar la sección **OUTLET de OXATIS** (https://www.homea.mx/PBCPPlayer.asp?ID=2397967), que está dividida por tipo de producto (p. ej. *Todos los productos › OFERTAS ESTUFAS*). Son modelos descontinuados de los que todavía hay piezas. Pasos:
  1. **Inventariar el outlet de OXATIS** por sección: SKU, marca, tipo, precio de oferta y piezas. Cruzarlo con el maestro / SAE.
  2. **Confirmar el precio final con descuento** de cada pieza. Se suben solo con el precio ya actualizado.
  3. **No borrarlos en la depuración de obsoletos:** que estén descontinuados no los saca del catálogo si están en el outlet.
  4. **Alta en Shopify:** `filtros.promocion = Outlet`, precio de comparación = precio de lista original, precio = precio final, `filtros.disponibilidad = En stock`. A diferencia del resto del catálogo, aquí **sí se controla inventario** (piezas reales, sin vender de más).
  5. **Cada producto en oferta tiene su sección de outlet**: colección *Outlet* con una subsección por tipo, como en OXATIS (Outlet Estufas, Outlet Refrigeración…). En `/ofertas`, la puerta del Outlet deja de ligar a OXATIS y apunta a esta colección. El producto también aparece en su categoría normal con la etiqueta de oferta.
  6. **Redirects 301** de las URLs del outlet de OXATIS a su ficha nueva (o a la sección Outlet si la pieza ya se vendió). Se agregan al mapa de `docs/PLAN-REDIRECTS-MIGRACION.md`.
  7. **Al agotarse una pieza en oferta** (decisión Carla, 2026-10-06):
     - **Modelo descontinuado → sale del sitio.** Se archiva en Shopify y su URL hace 301 a la sección Outlet de su tipo (nunca un 404).
     - **Modelo vigente → regresa a "Bajo pedido" a precio normal.** Se quita el precio de comparación y `filtros.promocion`, `filtros.disponibilidad = Bajo pedido` y la variante vuelve a "seguir vendiendo sin inventario". Sale de la colección Outlet y se queda en su categoría.
     - Se aplica con cada inventario nuevo que mande Carla y también cuando el inventario de Shopify llegue a 0 (webhook `inventory_levels/update`, ver 3.4 ter).
- [ ] **Marcar la moneda de cada producto (MXN vs USD)** durante la homologación → tag/metafield `moneda:USD` + metafield `precio_usd`. Shopify solo maneja una moneda de tienda (MXN), así que el precio en dólares vive en metafield y el producto USD queda **no comprable** en checkout. Alimenta la regla "USD = solo con ejecutivo" de 4.5.
- [ ] Estructurar para Shopify (CSV/Matrixify): handle, título, tipo, vendor, tags, variantes, precio, **metafields**.
- [ ] Definir la **plantilla de nomenclatura SEO de imágenes** (`marca-producto-categoria-atributo`) como parte de la homologación → alimenta 4.2.

### 4.2 Imágenes de producto ⭐ (subproyecto) — ver `docs/ESTRATEGIA-IMAGENES.md`
- [ ] Inventariar qué productos tienen imagen y cuáles no.
- [ ] Estrategia de obtención (fabricante por SKU, bancos, foto propia); **priorizar** los de mayor tráfico/venta.
- [ ] **Optimización de carga:** comprimir/redimensionar antes de subir (lado mayor ~2000px, calidad ~80); servir vía **Shopify CDN** (no por optimización de Vercel) con **WebP/AVIF**, `srcset`, lazy-load. Producto → Shopify CDN; editoriales → `next/image`.
- [ ] **Nomenclatura SEO de archivos** ⭐: nombres **descriptivos** (`marca-producto-categoria-atributo.webp`), en minúsculas con guiones, sin acentos, alineados a **trends de búsqueda** (validar vocabulario con Google Trends/keyword research) para aparecer en Google Images y búsquedas por tema. Generados **programáticamente** desde los datos homologados (4.1). Acompañar con `alt` descriptivo.
- [ ] Carga y asignación en Shopify.

### 4.3 Import a Shopify + consumo headless
- [ ] Carga masiva (Shopify MCP / Matrixify); validación de integridad.
- [ ] Consumo por **Storefront API** con **ISR / on-demand revalidation** (no se construyen 25k de golpe).
- [ ] ⭐ **REGENERAR EL ÍNDICE DEL BUSCADOR** después de cada carga o cambio de catálogo:

  ```bash
  node scripts/build-search-index.mjs
  ```

  **No es opcional.** El buscador de la lupa no consulta Shopify en vivo: lee `data/catalogo-index.json`, generado desde los CSV de `catalogo-shopify/import/`. Si no se regenera, el sitio seguirá buscando en el catálogo viejo (hoy: 305 Gaggenau) por más productos que haya en Shopify. Ver 4.4 · Buscador.

### 4.4 Filtros / navegación facetada ⭐
- [ ] Taxonomía: **tipo, marca, características** (medidas, color, panelable, combustible, etc.).
- [ ] Implementar con metafields/tags de Shopify + lógica de filtros en el front-end. Filtros **precisos por categoría**.
- [~] **Tabla de filtros v2 (2026-10-05)** ⭐ — definida y revisada; **nada subido a Shopify todavía** (decisión Carla: se sube solo con aprobación, subcategoría por subcategoría). La tabla vive **fuera del repo** (OneDrive `PAGINA WEB/PAGINA NUEVA 2026/FILTROS DE BUSQUEDA SHOPIFY 2026/FILTROS DE BUSQUEDA EN LA WEB_CLAUDE.xlsx` —el original de Carla queda intacto sin sufijo—, con hojas `BITÁCORA DE CAMBIOS` y `METAFIELDS SHOPIFY`). Decisiones:
  - [x] **Refrigeración completa en Shopify (2026-10-07, aprobado por Carla):** las 8 subcategorías 2 tienen colección automática (Tipo = X) publicada al canal Headless: Refrigeradores, Congeladores, Cavas de vino, Accesorios de refrigeración (ya existían) + Centros de bebida, Frigobares, Máquinas de hielo y Cajones refrigerantes (creadas hoy, vacías hasta que entre catálogo). Las 38 definiciones `filtros.*` cubren todas las claves de la tabla. La web muestra TODOS los filtros de la tabla por subcategoría (los sin datos salen "Sin opciones por ahora") y un rango de Precio en MXN con IVA.
    - [x] **Filtros de los 25 Gaggenau de refrigeración llenados (2026-10-07)** con `scripts/shopify-metafield-marca.py`: `garantia = 5 años` en los 306 Gaggenau (fuente: `POLITICA DE DESCUENTOS AUTORIZADOS (Rev 22).xlsx`, columna GARANTÍA; la definición ahora admite 5/7/8/10/15 años, De por vida y "2 años interior / 1 año exterior"); `acabado` (Panelable en columnas y combinados; Inoxidable en cavas con puerta de cristal), `fabrica_hielos = Sin despachador` (congeladores y combinados, lista de precios Gaggenau Q3 2025) y `voltaje = 110 V` (regla de familia: refrigeración Gaggenau NA es 115 V). Sin `despachador_agua` (Gaggenau no lo tiene) ni `promocion` (solo stock, vendrá del Excel de inventario).
    - [x] **Contenido de ficha de los 17 Gaggenau públicos de refrigeración (2026-10-07):** descripción larga en español redactada desde la ficha oficial de Gaggenau (spec sheet + gaggenau.com/us), `homea.dimensiones` (nicho, volumen, capacidad, peso de panel) y `homea.fichas_tecnicas` (spec sheet PDF subida a Shopify Files). Títulos con tallas estándar (35.5" → 36"). Proceso: `scripts/shopify-metafield-marca.py --contenido ficha.json`; los PDF se suben con el MCP de Shopify (`fileCreate`) porque la app "HOMEA Sitio Web" no tiene `write_files`. Las dimensiones de EMPAQUE (`custom.ancho/alto/profundidad`) llegan con el machote de proveedor. Pendiente: medidas exteriores del aparato (alto × ancho × fondo) solo vienen en los dibujos del spec sheet, no en texto.
    - [ ] Garantía del resto de marcas: mismo script `--marca X --clave garantia --valor "N años"` con la columna GARANTÍA de la política de descuentos (Sub-Zero/Wolf 2 años, Miele 2, Thermador 3, Bosch 1, Viking "2 años interior / 1 año exterior", etc.).
  - **Subcat.3 = valores de filtro** que forman el mosaico de tipos (p. ej. Campanas = Tipo de instalación + Diseño).
  - **Un metafield compartido por concepto** (namespace `filtros.*`, lista cerrada de valores); cada producto llena solo los suyos. Los ~19 compartidos van como filtro nativo de Search & Discovery (tope de filtros por tienda); los ~21 de una sola subcategoría los filtra la web leyendo el mismo metafield. **El orden y el nombre visible por subcategoría los pone la web** (Search & Discovery tiene un solo orden para toda la tienda). No usar `custom.ancho` (es el ancho del **embalaje**).
  - **Lavavajillas y Asadores**: una sola subcat.2 en Shopify con filtro *Tipo de instalación*; los botones del dropdown se conservan y filtran (ya funciona vía `tipos.js`).
  - **Disponibilidad** (regla Carla, 2026-10-06): **por defecto todo es "Bajo pedido"** (se vende sin inventario, nunca "agotado"). **"En stock" solo para lo que tenemos en inventario físico, y eso es lo que está en oferta** (outlet): ahí sí se controlan piezas. Ofertas y stock se actualizan juntos.
    - [ ] ⭐ **PENDIENTE (Carla): mandar el inventario** → marcar `filtros.disponibilidad = En stock` en esas piezas y actualizar las ofertas (precio de comparación + `filtros.promocion`). Se repite con cada inventario nuevo: lo que ya no esté vuelve a "Bajo pedido" o sale de ofertas.
    - [x] Qué pasa al agotarse una pieza en oferta: **decidido (Carla, 2026-10-06)** → ver paso 7 del Outlet en 4.1.
  - **Promoción** con %, calculada por script desde el precio de comparación; alimenta `/ofertas`.
  - **Precio USD** (pendiente de aprobar): `homea.precio_usd` es el dato maestro; el cron diario del FIX recalcula el precio MXN de la variante por Admin API y el pedido guarda USD + FIX.
  - Web: *Cajones fríos* → **Cajones refrigerantes**; *Minisplits* → **Aire acondicionado** (`/productos/aire-acondicionado`, `/guias/aire-acondicionado`); Exterior suma **Quemador lateral, Plancha Teppanyaki, Ahumadores, Hieleras y Gabinetes** (tiles con foto oficial Blaze/Broil King/Lynx + dropdown, filtran en la página).
  - ~~Siguiente: ficha de Refrigeradores…~~ **Cambio (Carla, 2026-10-06): el piloto es Gaggenau completo** (los 306 que ya están en Shopify).
  - [x] **38 definiciones `filtros.*` creadas en Shopify** (2026-10-06): `list.single_line_text_field` con lista cerrada (salvo `compatible`, texto libre), visibles en Storefront API. Vacías: ningún producto tocado.
  - **Método de revisión para escalar a ~16k (decisión 2026-10-06):** Carla no revisa producto por producto. Por marca se clasifican los productos con **reglas** (familia de modelo = prefijo del SKU + tipo de accesorio + datos del maestro); Carla aprueba las reglas (~40 por marca) y solo las **excepciones** que la regla no decide; todo valor se valida solo contra la lista cerrada de cada filtro.
  - [ ] ⭐ **PENDIENTE (Carla): revisar `PILOTO GAGGENAU SHOPIFY_CLAUDE.xlsx`** (OneDrive, misma carpeta de filtros): 306 productos en **41 reglas + 44 excepciones** (hoy 172 están como "Electrodoméstico" y varios accesorios en tipos equivocados), filtros sacados del título, precios USD/MXN en fórmula y 8 decisiones (hoja DECISIONES).
  - [x] **Refrigeración Gaggenau en Shopify (2026-10-06, pedido de Carla para probar filtros):** 120 productos (10 refrigeradores, 9 congeladores, 6 cavas, 95 accesorios) con Tipo = subcat.2, `filtros.*` llenos, `homea.precio_usd` (lista USD sin IVA) y `homea.fx_import`, precio MXN sin IVA = lista × 0.9 × FIX 17.967 y tachado = lista × FIX, "seguir vendiendo sin inventario". **109 activos** (solo canal Homea Headless); **11 en borrador** por descontinuados o reemplazados por la Serie Expressive (RC462705, RC472705, RC492705, RF411705, RF461705, RF471705, RF491705, RW414765, RW466765, RA492160, GH045010). `filtros.tipo` ganó 7 tipos de accesorio de refrigeración.
    - [x] Colecciones automáticas (por Tipo) publicadas en Headless: `refrigeradores` (10), `congeladores` (9), `cavas-de-vino` (6), `accesorios-de-refrigeracion` (95). La colección manual vacía "Refrigeración" pasó de handle `refrigeradores` a `refrigeracion`.
    - [x] Verificado por Storefront API: la colección Refrigeradores devuelve 7 productos activos con precio, tachado y metafields.
    - [ ] ⭐ **PENDIENTE (Carla): activar los filtros en Search & Discovery** (a mano; no se puede por API). Hasta entonces la Storefront API solo ofrece Disponibilidad nativa y Precio.
    - [ ] Precios fijos al FIX del 06/10 hasta construir el recálculo diario (cron + Admin API).
    - [x] **Sitio conectado al catálogo vivo (2026-10-06, para visto bueno de Carla):** solo refrigeración Gaggenau (106 activos tras corregir 3 accesorios de campana mal clasificados, que volvieron a borrador) + los 4 Gaggenau del piloto que no son de refrigeración (también con Tipo, filtros, precio sin IVA con tachado y colecciones `parrillas`, `hornos`, `campanas`, `lavavajillas`).
      - **Imágenes:** fotos oficiales del sitio de Gaggenau US (`media3.bsh-group.com`: foto + planos de medidas, máx. 4) subidas al CDN de Shopify con nombre SEO (`gaggenau-<sku>-<descripcion>-N.webp`). 116 productos con foto; 8 accesorios sin foto publicada por Gaggenau (RA250220, RA220010, RA297600, RVA491160, RVA491660, RVA493060, RVA498160, RVA498660).
      - **Código:** `lib/shopify/catalogoVivo.ts` (Storefront API, caché 1 h, tag `catalogo`), `lib/shopify/htmlCatalogo.ts` (tarjeta, panel de filtros y ficha con el markup del preview), `lib/shopify/coleccionesWeb.ts` (tipo → colección → página), `public/catalogo.js` (filtros Y/O, orden, galería), `lib/reglas/reglaMarca.ts` + `data/reglas-compra.json` (regla marca + monto + stock), `data/filtros-web.json` (orden de filtros por subcat.2, generado de la tabla v2). Las páginas de Subcategoría 1 usan slots de rango `<!-- slot:catalogo-* -->…<!-- /slot -->` (si Shopify no contesta, queda el preview).
      - **Fichas:** `/producto/<sku>` para cualquier producto publicado (ISR on-demand, `dynamicParams`); las 5 del piloto conservan su HTML curado con precio y botón vivos (slots `precio` y `cta`). Precio con IVA y tachado; USD con equivalencia en pesos al TC del día; botón según la regla de compra (Gaggenau = Cotizar).
      - ⚠️ La Storefront API **ignora el filtro `sku:`**: la ficha busca el modelo como texto y exige SKU exacto.
    - [ ] Pendientes del front al escalar: paginar la rejilla (hoy pinta todas las piezas de la subcategoría); incluir las fichas en `sitemap.xml`; migrar la acción del carrito (`lib/reglas/compra.ts`) a la regla de marca; regenerar el índice del buscador para que enlace las fichas nuevas; precio en pesos fijo al FIX del 06/10 hasta el cron diario.
  - [ ] Resto de Gaggenau (cocción, lavavajillas, campanas…): mismo proceso tras la prueba de refrigeración.
  - [ ] Llenar después con fichas técnicas lo que el título no trae (voltaje, capacidad, CFM, ruido, servicios, zonas).
- [ ] **Filtros específicos por subcat.2** ⭐ (pendiente desde 2026-07-22): las páginas de subcat.1 de Cocina y Bar (`/productos/cocina-y-bar/<sub>`) ya existen con filtros a nivel subcat.1 y deep-link `?tipo=<subcat.2>`; falta definir e implementar el **set de filtros propio de cada subcat.2** (p. ej. Refrigeradores: estilo French Door/Duplex/Bottom Mount, panelable; Campanas: tipo de instalación y capacidad de extracción; Tarjas: nº de tazones). Se trabaja al conectar Shopify Search & Discovery / Storefront API, subcat.2 por subcat.2, partiendo de las fichas de tipo de `GUIAS/taxonomia-guias.json` (campo `filtros`) y de `docs/PATRON-FICHAS-TIPO.md`. Replicar después en las demás macrocategorías.

#### Buscador del catálogo (lupa del nav) ⭐ — construido, pendiente de reconectar
*Estado (2026-08-04): funcionando en `localhost` con los 305 Gaggenau. Piezas: `components/BuscadorOverlay.tsx` (capa que abre sin salir de la página, con autocompletado en línea) → `app/api/buscar/route.ts` → `lib/catalogo.ts` → `data/catalogo-index.json` ← `scripts/build-search-index.mjs`. Cada fila muestra marca, SKU, nombre corto, precio **con IVA** en su moneda e imagen.*

- [ ] **Regenerar el índice al cerrar el catálogo** (`node scripts/build-search-index.mjs`) — mismo paso que 4.3, aquí queda por si se entra por esta sección.
- [ ] **Revisar los diccionarios del script con el catálogo completo**: `RE_APARATO` (qué sustantivos abren un aparato vs. una refacción) y `CATEGORIAS` (título → categoría, que decide la imagen) se calibraron **solo con Gaggenau**. Con 77 marcas van a aparecer casos nuevos — tarjas, grifería, minisplits, chimeneas.
- [ ] **Decidir si el buscador muestra productos en Draft.** Hoy los muestra (de los 309 de Shopify, 304 están en borrador). Antes de publicar hay que filtrarlo a productos publicados.
- [ ] **Migrar a Storefront API** cuando exista el token y el catálogo esté vivo: sustituir `buscar()` por `predictiveSearch` de Shopify. El contrato `ResultadoBusqueda` es lo que consume el overlay, así que **el componente no se toca**. A ~25k productos el índice en JSON deja de ser la opción cómoda.
- [ ] **Enlazar los resultados a su PDP.** Hoy solo los 5 con ficha publicada abren página propia; el resto cae a WhatsApp con el SKU prellenado. Al existir las PDP masivas, `fichaDeSku()` debe apuntar a la ruta real.
- [ ] Imágenes: hoy el buscador usa packshot por SKU cuando existe y foto de categoría si no. Al cargar las imágenes reales (4.2) **quitar el fallback por categoría** — cada producto con la suya.

### 4.5 Lógica comercial y checkout
- [ ] **"Cotizar" vs "Comprar"** por colección/etiqueta.
- [ ] **Checkout hospedado en Shopify** para bajo ticket (cart → checkout URL).
- [ ] **Definir cómo se cotiza cada caso** ⭐: (a) MXN bajo ticket → compra directa en checkout; (b) MXN alto ticket → CTA "Cotizar" → lead/WhatsApp; (c) **USD → si o sí pasa con un ejecutivo, sin excepción**. Identificar los productos USD viene de la homologación (4.1, tag `moneda:USD`).
- [x] ⭐ **DECISIÓN (Carla, 2026-10-06): precios USD — modelo Artexa + regla de compra por marca.**
  - **En la web** las marcas USD se publican en dólares, como Artexa ("USD $X + IVA" + tipo de cambio). **Shopify guarda el monto en pesos, oculto al público**, solo para que funcionen el filtro de precio y el carrito: precio MXN = USD × FIX del día, recalculado solo por el cron (`/api/cron/tipo-cambio`) con la Admin API. Nadie toca precios a mano. Hoy los borradores USD tienen la cifra en dólares en el campo de pesos (p. ej. USD 8,813.98 → $8,813.98 MXN): se corrige con este proceso.
  - **Regla de compra por marca:** cada una de las 68 marcas SHOPIFY es *Comprar en línea* (checkout al TC del día) o *Solo cotizar* (entra al carrito, pero al pagar se manda como cotización al vendedor: borrador de pedido en Shopify + WhatsApp con folio). **Carrito mixto:** si trae al menos una marca *Solo cotizar*, va a cotización; si todas son *Comprar en línea*, va al checkout.
  - [x] ⭐ **`REGLAS DE COMPRA POR MARCA_CLAUDE.xlsx` llenado por Carla (2026-10-06).** 67 marcas (Elkay eliminada). **Solo cotizar (21):** Asko, Benessi, Bertazzoni, Bosch, Brizo, Cove, Delta, Dexa, Franke, Gaggenau, Gessi, Hoshizaki, Miele, Pitt, Scotsman, Sub-Zero, The Galley, Thermador, U-Line, Viking, Wolf. Las demás: regla general ($100,000 MXN con IVA); stock/oferta comprable en todas. Monedas confirmadas: Dawn, Faber, Fulgor Milano, Mont Alpi, Nantucket y Summit = USD; Supra = MXN.
    - [x] **Regla aplicada en el carrito (2026-10-06):** `lib/shopify/normalizar.ts` evalúa `decidirCompra` por línea con los datos de Shopify y el proyecto queda `checkout` o `cotizacion`; la excepción de los 5 Gaggenau se retiró (`lib/reglas/compra.ts`).
    - **Marcas con "Validar margen con lista PPS"** (grupos Mabe y Whirlpool: Acros, Easy, GE Profile, Haier, IEM, IO Mabe, KitchenAid, Mabe, Maytag, Whirlpool): el proveedor da **costos** y HOMEA calcula el precio; **los precios cambian por temporada, constantemente**. La carga de precios a Shopify de estas marcas tiene que poder repetirse seguido y sin esfuerzo (mismo proceso, re-ejecutable).
  - [ ] Pasar la regla a `data/marcas.json` (campo `compra`), que lee `lib/reglas/compra.ts` por la marca (vendor). Cambiar la regla de una marca = un cambio en ese archivo, sin re-etiquetar productos en Shopify.
  - **Dónde vive el bloqueo:** en el servidor del sitio (`compra.ts` decide antes de mandar al checkout). Shopify no permite bloquear el checkout por marca en el plan Basic: las validaciones de checkout (Shopify Functions) en apps propias son solo de Shopify Plus (verificado en shopify.dev). Respaldo: Shopify Flow etiqueta y avisa si entra un pedido con una marca *Solo cotizar*.
  - [x] Permisos de la app "HOMEA Sitio Web" para que corra solo: `read/write_products` (precio diario), `read/write_draft_orders` (cotización → borrador), `read/write_inventory` (stock del outlet). **Activos y verificados 2026-10-06** (versión `homea-sitio-web-2`; hubo que reinstalar la app desde el Dev Dashboard para que la tienda los aplicara). La app "HOMEA Catalogo" (todos los permisos) **no va a Vercel**: solo en la Mac si algún día se usa.
  - [x] **Precios: Shopify SIN IVA, la web CON IVA, con precio tachado** (Carla, 2026-10-06). Las listas se suben sin IVA; Shopify suma el 16% en el checkout (verificado con un cálculo de borrador: "Todos los precios incluyen impuestos" apagado es lo correcto). En Shopify: precio = lista − descuento PLATA; precio de comparación = lista (MXN al FIX del día). En la web: USD con IVA, tachado = lista + IVA.
  - [x] ⭐ **Regla de compra (Carla, 2026-10-06): marca + monto + stock.** (1) Lo que está en stock/oferta → siempre se compra; (2) marcas de la lista "solo cotizar" → cotizar; (3) precio de venta > $100,000 MXN con IVA → cotizar; (4) lo demás → se compra. Carrito con algo para cotizar → todo a cotización.
- [x] ⭐ **"Mi proyecto" (Carla, 2026-10-06, modelo Artexa):** el carrito se llama *Mi proyecto* (nav, cajón, botón "Agregar a mi proyecto" en fichas). Toda pieza entra; al cerrar: todas comprables → "Pagar en línea" (checkout Shopify); alguna se cotiza → "Solicitar cotización por WhatsApp" con el proyecto completo (modelo, cantidad, precio público con IVA, subtotal/IVA/total estimados). Probado con carrito real.
  - [ ] **Formato de cotización con datos del cliente** ⭐: formulario (nombre, teléfono, ciudad, tipo de proyecto) antes de enviar por WhatsApp, para que el vendedor reciba todo; después, borrador de pedido en Shopify con folio.
- [~] **Productos en USD → SIEMPRE con ejecutivo** (sustituido por la regla marca + monto + stock; las marcas USD están en la lista "solo cotizar") ⭐: en la PDP mostrar la nota *"Este producto se cotiza en dólares (USD). El tipo de cambio y el descuento los confirma tu ejecutivo de ventas"* (cláusula 6 del formato de cotización: TC Santander a la venta). Al intentar agregarlo al carrito se **intercepta** y se manda al usuario **directo a cotizar por WhatsApp** con el modelo prellenado — el vendedor revisa precio, descuento y tipo de cambio manualmente. **Un producto USD nunca llega al checkout de Shopify.**
- [ ] **Lista de cotización (wishlist → vendedor)** ⭐: el usuario arma su lista de productos y la envía directo al vendedor en **formato de cotización simplificado** — solo **modelo + título + imagen principal** por partida (versión sencilla del formato SAE). Flujo: wishlist (localStorage, ya en fase 1 en `preview/wishlist.js`) → route `/api/cotizacion` en Vercel genera el documento (XLSX/PDF con folio y fecha) → URL del documento → se comparte **automáticamente por WhatsApp al ejecutivo** junto con la lista en texto. 100% front-end + serverless: **no toca Shopify** (su carrito/checkout sigue intacto para MXN bajo ticket). Opcional: el mismo envío crea el lead en **KOMMO** vía webhook.

### 4.6 Google Shopping — Merchant Center + feed + campaña ⭐ NUEVO
*Anuncios de Shopping (las fichas con foto/precio del buscador) con **conexión directa al ecommerce**. Depende de catálogo con datos+imágenes (4.1/4.2) y del tracking de la Fase 3.5. Puede arrancar con un **set curado de productos prioritarios** antes de tener los 25k.*

**a) Infraestructura**
- [ ] Crear **Google Merchant Center** de HOMEA y **verificar/reclamar el dominio** `www.homea.mx`.
- [ ] **Vincular Merchant Center ↔ Google Ads** (la cuenta y conversiones ya montadas en Fase 3.5).
- [ ] Activar el **feed de producto desde Shopify** (canal *Google & YouTube* / Content API). ⚠️ **Clave headless:** la **URL de destino (`link`) de cada producto en el feed debe apuntar a la PDP en `www.homea.mx` (Vercel), NO al storefront `homeashop.mx`** (que va `noindex`/password). Confirmar el dominio del feed para no mandar tráfico pagado a la tienda oculta.

**b) Productos "más buscados" publicados y aprobados** (lo que pediste)
- [ ] **Priorizar el feed** con la franquicia SEO real (datos en `seo-data/ANALISIS-GSC.md`): **refrigeración panelable / built-in** (`refrigerador panelable`, `refrigeradores pareja panelables`, counter-depth, 80 cm), **marcas premium + intención de precio** (Sub-Zero, Wolf, Thermador, Monogram, Miele), **exterior** (asadores empotrables, cavas de vino) y **SKUs exactos** que ya rankean.
- [ ] Asegurar **datos de feed completos** por producto prioritario: título optimizado, **precio**, **disponibilidad**, **marca**, **GTIN/MPN**, **imagen de calidad** (de 4.2) y categoría (`google_product_category`).
- [ ] Resolver **diagnósticos/desaprobaciones** en Merchant Center hasta dejar los prioritarios **aprobados** (sin esto no se muestran).

**c) Campaña**
- [ ] Lanzar **campaña de Shopping** (o **Performance Max** con feed) en Google Ads, segmentada al set prioritario; pujas hacia **compra directa** (bajo ticket) y, donde aplique, "Cotizar" como conversión secundaria (alto ticket).
- [ ] Estructurar por **grupos de productos** (marca / categoría) para controlar puja y presupuesto.
- [ ] Loop de optimización: revisar **diagnóstico de feed + términos de búsqueda + ROAS**; ampliar cobertura del feed conforme se completa la migración de los 25k (4.3).

**Entregable:** ~25k productos consumidos por la app, con imágenes (priorizadas), **filtros precisos** y checkout operativo; **feed de Shopping vivo en Merchant Center con los productos más buscados aprobados y una campaña de Shopping/PMax activa apuntando a las PDP de `homea.mx`**.

---

## 🔵 Fase 5 — Función general, QA y lanzamiento
- [ ] **QA FUNCIONAL:** búsqueda, **filtros**, carrito, checkout, formularios→KOMMO, WhatsApp, enlaces. Todo debe funcionar de verdad.
- [ ] **QA del buscador:** que el índice esté regenerado con el catálogo final (`node scripts/build-search-index.mjs`), que busque por SKU y por lenguaje natural, que el precio con IVA cuadre con la PDP y que **no aparezcan productos en borrador**.
- [ ] **QA de la regla USD → solo ejecutivo:** verificar que **ningún producto en dólares** pueda llegar al checkout de Shopify; el intercepto a WhatsApp debe funcionar en PLP, PDP y carrito.
- [ ] Accesibilidad (WCAG) y **Core Web Vitals** móvil (la gran oportunidad vs OXATIS). *El responsive en sí se adelantó a la **Fase 3.6**; aquí solo se verifica el resultado final.*
- [ ] ⭐ **Medir rendimiento en CAMPO, no en local (decisión Carla, 2026-09-25).** Línea base medida sobre el build de producción servido en localhost: home **719 KB** (fuentes 343 · imágenes 199 · JS 145 · CSS 31 · HTML 33), `/contacto` **555 KB**, LCP y FCP **188 ms**, CLS **0.003**. Son el mejor caso y ya están holgadas: **no seguir exprimiendo bytes con esas cifras**. Lo que decide es el dato de campo (CrUX / PageSpeed sobre el dominio en vivo y GSC → Core Web Vitals); volver a ajustar **después** del corte de migración, con usuarios reales, y solo si el campo lo pide.
- [ ] **Corte de migración:** apuntar **DNS de `homea.mx` (GoDaddy) a Vercel**, activar **todos los 301**, subir **sitemap propio** a GSC, validar indexación.
- [ ] **Análisis de comportamiento con Microsoft Clarity** ⭐ NUEVO: instalar **Microsoft Clarity** (gratis) en el front-end **en el corte de lanzamiento** para que capture datos desde el día 1 — **heatmaps** (clics, scroll, áreas muertas) y **grabaciones de sesión**. Complementa GA4/Meta Pixel (que miden *qué* pasa) mostrando *cómo* navegan los usuarios. Durante el **monitoreo post-lanzamiento**, revisar: dónde abandonan, qué CTAs ("Cotizar"/WhatsApp/"Comprar") se ven y cuáles se ignoran, rage-clicks y fricción en filtros/PDP → alimenta iteración de conversión.
- [ ] **No matar OXATIS de golpe**; **monitoreo post-lanzamiento** 2–6 semanas vs. línea base.
- [ ] ⭐ **No engordar `preview/assets` (nota 2026-09-25).** Son **53 MB de los cuales el 100 % son copias byte a byte** de `public/assets` (0 archivos exclusivos; `public/` tiene además 686 archivos propios, 27 MB). **El usuario nunca los descarga** — Next solo sirve `public/` — pero viajan en cada clon y en cada subida a Vercel. No duele hoy; la regla es **no hacerla crecer**: los heros de marca (26 MB) viven solo en `public/` a propósito. Si algún día molesta el peso del repo, se puede dejar de duplicar, a cambio de que el preview estático deje de verse completo al abrirlo suelto.
- [ ] 🔒 **Repo sin información delicada antes de lanzar:** confirmar que ya se borraron los Excel de catálogo con precios y costos, y que se decidió qué hacer con el historial de git (ver el recordatorio en la Fase 4).
- [ ] ⭐ **Cerrar la fuga de precios en `promociones.homea.mx`** (hallazgo 2026-09-04, marcado por Carla como punto a revisar cerca del lanzamiento): la raíz de la carpeta del proyecto (`~/Documents/Landing Pages Homea 2026/Homea Promociones`, repo `Homeaamx/promociones-homea`) contiene archivos de trabajo internos que Vercel sirve públicos — verificado con HTTP 200: `PRECIOS_CLAUDE_2026.xlsx`, `prices.json`, `*_rows.json` por marca, scripts `.py`. Cualquiera con la URL puede descargar las listas de precios. Fix: mover esos archivos a una carpeta fuera del deploy o excluirlos con `.vercelignore`, y redesplegar.

**Entregable:** sitio en producción en `www.homea.mx` (servido por Vercel) sin pérdida de SEO, **con Microsoft Clarity capturando comportamiento desde el lanzamiento**.

---

## 🔵 Fase 6 — Contenido editorial: blogs en Guías (cadencia quincenal) ⭐ NUEVO
*Trabajo continuo: alimentar la sección **Guías** con artículos/blogs publicados de forma **quincenal** (cada 2 semanas). Refuerza la función de "guía de compra" del sitio y construye autoridad SEO orgánica sostenida.*

- [ ] **Cadencia:** publicar **un blog/guía nuevo cada 2 semanas** (quincenal) en la sección Guías (`/guias`).
- [ ] **Calendario editorial:** definir temas por quincena alineados a las macrocategorías (Cocina y Bar, Exterior, Baños, etc.) y a búsquedas reales (GSC / keywords).
- [ ] **SEO por artículo:** title/description, canónico, JSON-LD (Article/FAQ), enlazado interno a productos y otras guías, imágenes con nombres SEO.
- [ ] **Flujo de publicación:** redacción → revisión → publicación en Guías → indexación (sitemap) → difusión (redes/WhatsApp/email).
- [ ] **Medición:** seguir tráfico orgánico y conversiones (lead/WhatsApp) por guía para priorizar próximos temas.

**Entregable:** flujo editorial vivo con **publicación quincenal** en Guías; biblioteca de contenido que crece y suma SEO orgánico mes a mes.

---

## Mapeo de los 9 pasos originales de Carla

| Paso original | Fase |
|---|---|
| 1. Contexto Homea | Fase 0 ✅ |
| 2. Design system para conversión | Fase 1 ✅ |
| 3. Secciones + concepto | Fase 1 ✅ |
| 4. Layout / preview navegable | Fase 2 ✅ |
| 5. COWORK: screenshots Homea + ARTEXA | Fase 0 (opcional) |
| 6. Refinar/borrar secciones | Fase 2 ✅ |
| 7. Conectar Shopify + describir tienda | Fase 3.2 / Fase 4 |
| 8. Integrar tienda | Fase 4 |
| 9. Función general | Fase 5 |

**Alcance añadido:** front-end Next.js + integración Storefront API (Fase 3), tracking de conversiones + Google Ads (Fase 3.5), catálogo ~25k + imágenes + filtros (Fase 4), **Google Shopping: Merchant Center + feed + campaña con conexión directa al ecommerce (Fase 4.6)**, QA funcional (Fase 5). **Funcionalidad = prioridad.**
