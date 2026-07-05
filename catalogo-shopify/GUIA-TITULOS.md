# Guía de estilo — Títulos y copy de producto (reglas Carla 2026-07-05)

> Rige la generación de títulos y descripciones para Shopify (fase de nombres SEO).
> Base de partida: nombres en español de artexa.com (08-ARTEXA-REFERENCIA) + specs de catálogos PDF.

## Reglas de título

1. **Estructura lógica**: `[Tipo de producto] [Instalación] [con rasgo clave] [Estilo/Configuración] [Medida]`
   - ❌ `Combinación empotrable Congelador Refrigerador Bertazzoni Bottom Mount 24 Pulgadas`
   - ✅ `Refrigerador Empotrable con Congelador Bottom Mount 24"`
2. **Pulgadas siempre con `"`** — nunca "Pulgadas" ni "in": `24"`, `36"`.
3. **SIN marca en el título** — la marca ya vive en el filtro/Vendor (ej. no "Marca Alfresco").
   La marca SÍ se menciona en la descripción.
4. **Apertura izquierda/derecha va priorizada en el título** cuando aplique. El término
   correcto es **"Apertura Izquierda" / "Apertura Derecha"** (NUNCA "Bisagra") — regla Carla 2026-07-05.
4b. **No repetir el modelo/SKU entre paréntesis en el título** — el SKU ya vive en su campo.
5. **Mencionar si requiere algo para instalarse** (kit de unión, panel, kit de instalación) —
   en el título si es determinante, siempre en la descripción.
6. **Title Case natural** (combinación de mayúsculas y minúsculas) — nunca TODO MAYÚSCULAS.
7. **Vocabulario MX**: "Zoclo" (no "zócalo"); revisar términos según el uso de Carla/portafolio.

## Reglas de descripción

- Sí menciona la marca y colección/serie.
- Párrafo comercial + bullets de especificaciones + medidas (formato tipo Artexa PDP).
- Incluir requisitos de instalación (kits, paneles, voltaje) y apertura/bisagra.
- Nutrida para SEO (keywords de la categoría; ver ANALISIS-GSC para términos ya posicionados).
- Usar la "descripción larga" de SAE (CAMPLIB7) como semilla + specs del catálogo PDF de la marca.

## Productos relacionados (regla Carla 2026-07-05)

Cada producto debe ofrecer **productos complementarios con conexión fuerte** (metafield
`complementary_products` de Search & Discovery, se llena post-import vía API con los IDs):
- Si el producto **requiere un KIT** (unión, instalación, panel) → ese kit va como complementario obligado.
- Panelables → sus paneles de puerta y jaladeras compatibles (mismo ancho/serie).
- Columnas de refrigeración → kit de unión para columnas + panel + jaladera.
- Parrillas/módulos Vario → marco de emparejamiento, cubiertas, wok ring.
- Campanas → motores/blowers compatibles y ductos.
- Cafeteras/hornos → cajón calientaplatos / de vacío de la misma serie y ancho.
Las conexiones se derivan de: menciones "requiere/para/compatible con" en specs del PDF,
misma serie + mismo ancho, y las claves de accesorio del decodificador por marca.

## Moneda (decisión Carla 2026-07-05)

Los precios se cargan **en su moneda original** (USD para listas USD, MXN para listas MXN),
como ya lo hace la tienda actual ("USD $X + IVA" en PDP). Cada producto lleva tag/metafield
`Moneda USD|MXN` para que el tema muestre la etiqueta correcta. No se convierte con FIX al
importar; la barra de tipo de cambio del sitio da la referencia. (Ecommerce directo Fase 2:
los productos USD operan como Cotizar; los MXN son comprables.)

## Pipeline

1. Título base = nombre Artexa (si existe match) o CAMPLIB7 → re-estructurar según reglas 1-7.
2. Variantes: el título NO incluye el acabado (va como Opción); la descripción de variante sí.
3. Generación por lotes marca→categoría, empezando por marcas premium vigentes.
