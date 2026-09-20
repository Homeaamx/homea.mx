# Pendientes del carrito Shopify — qué falta para que esto sea real

> **Para quien haga el merge (humano o agente).** El código de la rama
> `feat/carrito-shopify-storefront` **funciona sin ninguna de estas piezas**: cuando
> falta algo, degrada a datos locales y lo dice en pantalla. Eso es a propósito — así
> se pudo construir y verificar con la tienda bloqueada. El riesgo está justo ahí:
> **es fácil mergear esto, verlo "funcionar" y creer que ya habla con Shopify.**
> No lo hace hasta que se cierren los puntos de abajo.
>
> Última revisión: 2026-09-19.

---

## 0. Advertencia principal

**Nada de esta rama se ha probado contra un Shopify real.** La lógica del carrito, el
guardia de moneda y la regla USD → ejecutivo están ejercitadas contra el índice local del
catálogo y contra respuestas simuladas, nunca contra la API en vivo, porque no existe
todavía el token. La primera corrida con token merece revisión atenta, con la §5 (moneda)
como primer sospechoso.

**Cómo saber, en 5 segundos, si el sitio está hablando con Shopify:** abrir cualquier
ficha piloto (p. ej. `/producto/bop250612`), agregar al carrito y mirar el cajón.
Si aparece el aviso *"Carrito simulado · Shopify no disponible (…)"*, **no** hay conexión.

---

## 1. `SHOPIFY_STOREFRONT_API_TOKEN` — token del canal Headless

| | |
|---|---|
| **Desbloquea** | Carrito real, precios y existencias vivos, búsqueda contra Shopify |
| **Lo lee** | `lib/shopify/cliente.ts` |
| **Sin él** | Carrito **simulado** en desarrollo; en producción, aviso + salida a WhatsApp |
| **Firma del fallo** | `[shopify] Falta NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN o SHOPIFY_STOREFRONT_API_TOKEN` |

Tiene que salir del **canal Headless** de Shopify (Sales channels → Headless →
Storefront API tokens), no de la tienda en línea. Un token del canal Online Store
devuelve el mismo error de tienda bloqueada que no tener nada.

⚠️ **El acceso *tokenless* de Shopify NO sirve aquí.** Cubre productos, colecciones,
búsqueda y carrito, pero va atado al canal Online Store, que está bloqueado por la
contraseña (§4). Comprobado el 2026-09-19:

```
POST https://homeashop.mx/api/2026-07/graphql.json      (sin token)
→ {"errors":[{"message":"Online Store channel is locked"}]}
```

---

## 2. `BANXICO_TOKEN` — tipo de cambio del día

| | |
|---|---|
| **Desbloquea** | El FIX del día (serie `SF43718` del SIE de Banxico) en barra superior y fichas |
| **Lo lee** | `lib/tipoCambio.ts` |
| **Sin él** | Tipo de cambio de respaldo **17.43**, y la nota del precio lo advierte |
| **Firma del fallo** | La ficha dice `TC 17.43` sin fecha; con token dice `TC 17.24 · 18/09/2026` |

Token gratuito: https://www.banxico.org.mx/SieAPIRest/service/v1/token

Acompañantes opcionales:
- `TIPO_CAMBIO_SPREAD` — diferencial sobre el FIX (`0.02` = 2%). El FIX es referencia,
  no precio de venta. Vacío = sin diferencial. **Decisión de negocio, no de código.**
- `TIPO_CAMBIO_MANUAL` — tipo de cambio fijo que gana sobre Banxico, para cuando la
  cotización deba ir con el del banco ("TC Santander a la venta", que no tiene API).

🔓 **Token viejo quemado:** hasta esta rama había un token de Banxico escrito dentro de
`public/v2.js`, o sea servido a todo visitante. Se quitó de los dos archivos, pero
**sigue siendo legible en el historial desde `23463b9`** y el repo está publicado.
Revocarlo y reemitirlo es decisión de una persona; el equipo ya lo evaluó y lo consideró
de bajo impacto (dato público de solo lectura, el riesgo real es consumo de cuota).

---

## 3. `CRON_SECRET` — cron diario del tipo de cambio

| | |
|---|---|
| **Desbloquea** | Que el tipo de cambio se refresque a una hora conocida |
| **Lo lee** | `app/api/cron/tipo-cambio/route.ts`; el horario vive en `vercel.json` |
| **Sin él** | El endpoint responde **401** cada día hábil; el sitio igual se actualiza, pero a la hora que caiga la primera visita |
| **Cómo verificar** | `curl -s -o /dev/null -w "%{http_code}" https://<dominio>/api/cron/tipo-cambio` → **401** sin cabecera, **200** con `Authorization: Bearer $CRON_SECRET` |

Vercel lo genera al configurar el cron. El 401 es deliberado: es preferible un cron que
falle ruidosamente a un endpoint abierto.

---

## 4. `CHECKOUT_ABIERTO` — quitar la contraseña de la tienda

| | |
|---|---|
| **Desbloquea** | El botón "Finalizar compra" |
| **Vive en** | `lib/flags.ts` (hoy `false`) |
| **Sin ello** | El botón se muestra deshabilitado con su explicación y se promueve WhatsApp |

**No es solo la bandera.** Mientras `homeashop.mx` tenga contraseña, el `checkoutUrl` de
Shopify redirige a `/password` y el cliente llega a un callejón sin salida. Comprobado:

```
GET https://homeashop.mx/cart/45827444211772:1  → 302  Location: /password
```

Orden correcto: (1) quitar la contraseña y redirigir/`noindex` el storefront hacia
`homea.mx` — ver `CLAUDE.md §3`, para no competir en búsqueda —, (2) probar una compra
real de punta a punta, (3) recién entonces poner la bandera en `true`.

---

## 5. Catálogo en Shopify — lo que ningún `.env` arregla

1. **Los productos están en borrador.** Las 310 filas del CSV de import van con
   `Status: draft` y `Variant Inventory Qty: 0`, y **la Storefront API nunca devuelve
   borradores**. Hay que pasarlos a *Active* **y publicarlos al canal Headless**. Con
   token pero sin esto, cada alta responde *"Este modelo aún no está publicado para
   compra en línea"*.

2. **⚠️ Riesgo de cobrar 17 veces menos.** Shopify guarda **la cifra en dólares como
   precio crudo de la variante** (`BOP250612` → `Variant Price = 11107.47`) mientras la
   ficha muestra `$193,603.20 MXN`. Si la tienda liquida en MXN, un checkout real
   cobraría $11,107 **pesos**. El código lo bloquea —`lib/shopify/normalizar.ts` marca
   `bloqueo: "moneda-incoherente"` y deshabilita el pago—, pero **la red de seguridad no
   es el arreglo**: el arreglo es de catálogo (precios en MXN al importar, o un mercado MX
   con conversión de Shopify). Shopify solo convierte **desde** la moneda de la tienda,
   nunca **hacia** ella, y Shopify Payments México exige cobrar en MXN.

3. **Los `data-cart-vid` del HTML son IDs fijos.** Una reimportación del catálogo los
   rota. Hay respaldo por SKU (`buscarVariante` en `lib/shopify/carrito.ts`), así que no
   se rompe en silencio, pero conviene saberlo.

---

## 6. Qué sigue hardcodeado a propósito

- Las tarjetas de **"Relacionados"** al pie de cada ficha siguen con precio fijo en el
  HTML. Salen de Shopify cuando el catálogo esté vivo; convertirlas hoy sería inventar
  cinco números más que mantener a mano.
- El **buscador** sigue leyendo `data/catalogo-index.json`. La migración a la consulta
  `search` de Shopify es trabajo aparte (ver `docs/PLAN-DE-FASES.md` §4.4).
- El **PLP** sigue apagado (`PLP_READY = false`).

---

## 7. Checklist de verificación tras el merge

```bash
npx tsc --noEmit                      # sin errores
npm run build                         # /producto/[slug] debe salir como ● (SSG)
grep -rc "7e566ca526db6444" public/ preview/   # 0 en ambos: el token no se sirve
curl -s localhost:3000/producto/bop250612 | grep -c 'application/ld+json'   # 1, no 2
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/cron/tipo-cambio  # 401
```

En el navegador: agregar al carrito, cambiar cantidad, quitar, **recargar** (el carrito
persiste por cookie `homea_carrito`, no por `localStorage`) y abrir el cajón desde el
ícono de bolsa del nav en escritorio y en móvil.
