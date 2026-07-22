#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera las páginas de subcategoría nivel 1 de Cocina y Bar
(subcategoria-cocina-y-bar--<slug>.html) y re-apunta los enlaces existentes
(mega-menú en todos los .html + slider/spotlights de categoria-cocina-y-bar.html).
Re-ejecutable: cirugía de strings sobre el preview."""

import re, glob, os, sys

ROOT = "/Users/carlaarteaga/Desktop/Homea Landing Page Oficial"
PREV = os.path.join(ROOT, "preview")

def P(slug):  # nombre de archivo de página de subcat.1
    return f"subcategoria-cocina-y-bar--{slug}.html"

# ───────────────────────────── 1 · MEGA-MENÚ (todos los .html) ─────────────────────────────
# h5 → link a la página de subcat.1; cada subcat.2 → misma página con ?tipo=<slug>
MEGA = {
    "Refrigeración": ("refrigeracion", [
        ("refrigeradores", "Refrigeradores"), ("congeladores", "Congeladores"),
        ("centros-de-bebida", "Centros de bebida"), ("frigobares", "Frigobares"),
        ("maquinas-de-hielo", "Máquinas de hielo"), ("cavas-de-vino", "Cavas de vino"),
        ("cajones-frios", "Cajones fríos"), ("accesorios-refrigeracion", "Accesorios de refrigeración"),
    ]),
    "Cocción": ("coccion", [
        ("estufas", "Estufas"), ("parrillas", "Parrillas"), ("hornos", "Hornos"),
        ("microondas", "Microondas"), ("campanas", "Campanas"), ("cajones", "Cajones"),
        ("cafeteras-empotrables", "Cafeteras"), ("accesorios-coccion", "Accesorios de cocción"),
    ]),
    "Lavavajillas": ("lavavajillas", [
        ("lavavajillas-empotrable", "Lavavajillas empotrable"),
        ("lavavajillas-de-piso", "Lavavajillas de piso"),
    ]),
    "Tarjas y Grifería": ("tarjas-y-griferia", [
        ("tarjas", "Tarjas"), ("griferia", "Grifería"),
        ("dispensadores-de-agua-tarja", "Dispensadores de Agua"),
        ("accesorios-tarjas-griferia", "Accesorios de Tarjas &amp; Grifería"),
    ]),
    "Trituradores": ("trituradores", [("trituradores", "Trituradores")]),
    "Dispensadores &amp; Filtros de agua": ("dispensadores-y-filtros-de-agua", [
        ("dispensadores-de-agua", "Dispensadores de agua"), ("filtros-de-agua", "Filtros de agua"),
    ]),
}

def mega_block(h5, slug, items):
    links = "".join(f'<a href="{P(slug)}?tipo={s}">{n}</a>' for s, n in items)
    return (f'<div class="mega-subcol"><h5><a href="{P(slug)}">{h5}</a></h5> {links}</div>')

def update_mega():
    n = 0
    for f in glob.glob(os.path.join(PREV, "*.html")):
        html = open(f, encoding="utf-8").read()
        orig = html
        for h5, (slug, items) in MEGA.items():
            pat = re.compile(r'<div class="mega-subcol"><h5>' + re.escape(h5) + r'</h5>.*?</div>', re.S)
            html = pat.sub(lambda m: mega_block(h5, slug, items), html, count=1)
        if html != orig:
            open(f, "w", encoding="utf-8").write(html)
            n += 1
    print(f"mega-menú actualizado en {n} archivos")

# ─────────────────── 2 · categoria-cocina-y-bar.html (slider + spotlights) ───────────────────
TILE_HREFS = {  # alt del tile → destino
    "Refrigeración": P("refrigeracion"),
    "Cocción": P("coccion"),
    "Lavavajillas": P("lavavajillas"),
    "Tarjas y Grifería": P("tarjas-y-griferia"),
    "Trituradores": P("trituradores"),
    "Dispensadores &amp; Filtros de agua": P("dispensadores-y-filtros-de-agua"),
    "Campanas": P("coccion") + "?tipo=campanas",
    "Máquinas de hielo": P("refrigeracion") + "?tipo=maquinas-de-hielo",
}
SPOT_HREFS = {
    "categoria-cocina-y-bar.html?tipo=campanas": P("coccion") + "?tipo=campanas",
    "categoria-cocina-y-bar.html?tipo=estufas": P("coccion") + "?tipo=estufas",
    "categoria-cocina-y-bar.html?tipo=tarjas-y-griferia": P("tarjas-y-griferia"),
    "categoria-cocina-y-bar.html?tipo=lavavajillas": P("lavavajillas"),
    "categoria-cocina-y-bar.html?tipo=refrigeradores": P("refrigeracion") + "?tipo=refrigeradores",
}

def update_macro():
    f = os.path.join(PREV, "categoria-cocina-y-bar.html")
    html = open(f, encoding="utf-8").read()
    for alt, dest in TILE_HREFS.items():
        pat = re.compile(r'(<a class="subcat" href=")categoria-cocina-y-bar\.html("(?:(?!</a>).)*?alt="' + re.escape(alt) + r'")', re.S)
        html, c = pat.subn(r"\1" + dest + r"\2", html, count=1)
        if not c: print(f"  ⚠ tile no encontrado: {alt}")
    for old, new in SPOT_HREFS.items():
        if old not in html: print(f"  ⚠ spot no encontrado: {old}")
        html = html.replace(old, new)
    open(f, "w", encoding="utf-8").write(html)
    print("categoria-cocina-y-bar.html re-apuntada (tiles + spotlights)")

# ───────────────────────────── 3 · PÁGINAS DE SUBCAT.1 ─────────────────────────────
GG = "assets/photos/gaggenau/"
WA = ("https://api.whatsapp.com/send/?phone=524461446318&amp;text="
      "%C2%A1Hola%2C%20visit%C3%A9%20su%20sitio%20web%20y%20me%20interesa%20una%20cotizaci%C3%B3n%21")

PAGES = [
    dict(slug="refrigeracion", nombre="Refrigeración", h1="Refrigeración",
         hero="hero-sub1-refrigeracion-subzero.jpg", pos="center 50%",
         heroalt="Columnas de refrigeración Sub-Zero panelables en cocina premium",
         desc="Refrigeradores, congeladores, cavas de vino, máquinas de hielo y más. Sub-Zero, Gaggenau, Miele y Thermador con asesoría experta de HOMEA.",
         meta='8 tipos <span class="dot">·</span> Sub-Zero <span class="dot">·</span> Gaggenau <span class="dot">·</span> Miele <span class="dot">·</span> Monogram',
         tiles=[("refrigeradores", "Refrigeradores", GG + "gaggenau-rb282705.png", ""),
                ("congeladores", "Congeladores", None, ""),
                ("centros-de-bebida", "Centros de bebida", None, ""),
                ("frigobares", "Frigobares", None, ""),
                ("maquinas-de-hielo", "Máquinas de hielo", "assets/photos/maquina-de-hielo.png", ""),
                ("cavas-de-vino", "Cavas de vino", None, ""),
                ("cajones-frios", "Cajones fríos", None, ""),
                ("accesorios-refrigeracion", "Accesorios de refrigeración", None, "")],
         marcas=["Sub-Zero", "Gaggenau", "Miele", "Thermador", "Monogram", "U-Line", "Scotsman", "Hoshizaki"],
         extras=[("Instalación", ["Empotrado / a ras", "Panelable", "Bajo cubierta", "De piso", "Columna"]),
                 ("Ancho", ["15&quot;", "18&quot;", "24&quot;", "30&quot;", "36&quot;", "42&quot;", "48&quot;", "60&quot;"])],
         color=True, products=["rb282705"], results="1 pieza en línea · 8 tipos"),

    dict(slug="coccion", nombre="Cocción", h1="Cocción",
         hero="hero-sub1-coccion-gaggenau.jpg", pos="center 75%",
         heroalt="Módulos de cocción Gaggenau Vario en isla de cocina premium",
         desc="Estufas, parrillas, hornos, campanas y cafeteras empotrables. Wolf, Gaggenau, Thermador y La Cornue con asesoría experta de HOMEA.",
         meta='8 tipos <span class="dot">·</span> Wolf <span class="dot">·</span> Gaggenau <span class="dot">·</span> Thermador <span class="dot">·</span> La Cornue',
         tiles=[("estufas", "Estufas", None, ""),
                ("parrillas", "Parrillas", GG + "gaggenau-vg295250ca.png", ""),
                ("hornos", "Hornos", GG + "gaggenau-bop250612.png", ""),
                ("microondas", "Microondas", None, ""),
                ("campanas", "Campanas", GG + "gaggenau-aw442720.png", ""),
                ("cajones", "Cajones", None, ""),
                ("cafeteras-empotrables", "Cafeteras", "assets/photos/miele-cafetera.jpg", "photo"),
                ("accesorios-coccion", "Accesorios de cocción", None, "")],
         marcas=["Wolf", "Gaggenau", "Thermador", "Miele", "Bertazzoni", "La Cornue", "Smeg"],
         extras=[("Combustible", ["Gas", "Eléctrico", "Dual", "Inducción"]),
                 ("Instalación", ["Empotrado", "De piso", "Isla", "Pared"]),
                 ("Ancho", ["24&quot;", "30&quot;", "36&quot;", "48&quot;", "60&quot;"])],
         color=True, products=["vg295250ca", "bop250612", "aw442720"], results="3 piezas en línea · 8 tipos"),

    dict(slug="lavavajillas", nombre="Lavavajillas", h1="Lavavajillas",
         hero="hero-sub1-lavavajillas-bosch.webp", pos="center 50%",
         heroalt="Lavavajillas empotrable premium totalmente integrado",
         desc="Lavavajillas empotrables y de piso. Miele, Gaggenau, Bosch y Asko con asesoría experta de HOMEA.",
         meta='2 tipos <span class="dot">·</span> Miele <span class="dot">·</span> Gaggenau <span class="dot">·</span> Bosch <span class="dot">·</span> Asko',
         tiles=[("lavavajillas-empotrable", "Lavavajillas empotrable", GG + "gaggenau-df480701.png", ""),
                ("lavavajillas-de-piso", "Lavavajillas de piso", None, "")],
         marcas=["Miele", "Gaggenau", "Bosch", "Asko", "Thermador", "Smeg"],
         extras=[("Instalación", ["Totalmente integrado", "Panelable", "Semi-integrado", "De piso"]),
                 ("Nivel sonoro", ["≤ 40 dB", "41–45 dB", "46+ dB"]),
                 ("Ancho", ["18&quot;", "24&quot;"])],
         color=True, products=["df480701"], results="1 pieza en línea · 2 tipos"),

    dict(slug="tarjas-y-griferia", nombre="Tarjas y Grifería", h1="Tarjas y <i>Grifería</i>",
         hero="hero-sub1-tarjas-griferia-blanco.jpg", pos="center 50%",
         heroalt="Tarja y grifería premium Blanco en cubierta de cocina",
         desc="Tarjas, grifería, dispensadores y accesorios. Blanco, Franke, Elkay y The Galley con asesoría experta de HOMEA.",
         meta='4 tipos <span class="dot">·</span> Blanco <span class="dot">·</span> Franke <span class="dot">·</span> Elkay <span class="dot">·</span> The Galley',
         tiles=[("tarjas", "Tarjas", "assets/photos/tarjas-y-griferia-blanco.png", ""),
                ("griferia", "Grifería", None, ""),
                ("dispensadores-de-agua-tarja", "Dispensadores de Agua", "assets/photos/dispensadores-filtros-grifo-purificador.webp", ""),
                ("accesorios-tarjas-griferia", "Accesorios de Tarjas &amp; Grifería", None, "")],
         marcas=["Blanco", "Franke", "Elkay", "The Galley", "Gessi", "Schock", "Dawn"],
         extras=[("Material", ["Acero inoxidable", "Granito compuesto", "Fireclay", "Latón"]),
                 ("Instalación", ["Submontar", "Sobre cubierta", "Farmhouse / Apron"])],
         color=True, products=[], results="0 piezas en línea · 4 tipos"),

    dict(slug="trituradores", nombre="Trituradores", h1="Trituradores",
         hero="hero-sub1-trituradores-insinkerator.jpg", pos="center 100%",
         heroalt="Triturador de alimentos InSinkErator instalado bajo tarja",
         desc="Trituradores de alimentos InSinkErator para instalación bajo tarja, con asesoría experta de HOMEA.",
         meta='InSinkErator <span class="dot">·</span> Instalación bajo tarja',
         tiles=[("trituradores", "Trituradores", "assets/photos/trituradores-insinkerator.jpg", "")],
         marcas=["InSinkErator"],
         extras=[("Potencia", ["1/2 HP", "3/4 HP", "1 HP", "1.1+ HP"]),
                 ("Alimentación", ["Continua", "Por lotes"])],
         color=False, products=[], results="0 piezas en línea"),

    dict(slug="dispensadores-y-filtros-de-agua", nombre="Dispensadores & Filtros de agua",
         h1="Dispensadores &amp; <i>Filtros</i> de agua",
         hero="hero-sub1-dispensadores-delta.jpg", pos="center 50%",
         heroalt="Dispensador de agua premium en cubierta de cocina",
         desc="Dispensadores de agua caliente y fría y filtros de agua. InSinkErator, Elkay y Franke con asesoría experta de HOMEA.",
         meta='2 tipos <span class="dot">·</span> InSinkErator <span class="dot">·</span> Elkay <span class="dot">·</span> Franke',
         tiles=[("dispensadores-de-agua", "Dispensadores de agua", "assets/photos/dispensadores-filtros-grifo-purificador.webp", ""),
                ("filtros-de-agua", "Filtros de agua", None, "")],
         marcas=["InSinkErator", "Elkay", "Franke"],
         extras=[("Temperatura", ["Fría", "Caliente", "Ambiente / mixta"]),
                 ("Instalación", ["En tarja", "Bajo cubierta"])],
         color=False, products=[], results="0 piezas en línea · 2 tipos"),
]

CSS = """
/* ── Página de subcategoría nivel 1 (Cocina y Bar) ─────────────────── */

/* Hero compacto: foto de la subcategoría + migas + título → directo al catálogo */
.subhero { position: relative; background: var(--homea-espresso); overflow: hidden; }
.subhero-bg { position: absolute; inset: 0; }
.subhero-bg img { width: 100%; height: 100%; object-fit: cover; display: block; }
.subhero-scrim { position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(10,9,7,.66) 0%, rgba(10,9,7,.34) 26%, rgba(10,9,7,.10) 52%, rgba(10,9,7,.26) 100%); }
.subhero-inner { position: relative; z-index: 2; min-height: clamp(300px, 40vh, 440px);
  display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-align: center;
  padding: clamp(72px, 10vh, 120px) 24px clamp(28px, 4.5vh, 48px); }
.subhero-crumbs { font-family: var(--font-sans); font-size: 11px; letter-spacing: var(--tracking-wider);
  text-transform: uppercase; color: rgba(247,243,236,.68); margin-bottom: clamp(6px, 1.4vh, 14px); display: block; }
.subhero-crumbs a { color: rgba(247,243,236,.68); border-bottom: none; transition: color var(--dur) var(--ease); }
.subhero-crumbs a:hover { color: var(--homea-gold-light); }
.subhero-crumbs .sep { color: var(--homea-gold); padding: 0 .55em; }
.subhero-crumbs [aria-current] { color: rgba(247,243,236,.92); }
.subhero h1 { font-family: var(--font-display); color: var(--homea-bone); font-weight: 400;
  font-size: clamp(34px, 5vw, 68px); line-height: 1.02; letter-spacing: -0.01em; margin: 0;
  text-shadow: 0 2px 30px rgba(0,0,0,.5); }
.subhero h1 i { font-style: italic; }
.subhero-meta { display: inline-block; margin-top: clamp(10px, 1.8vh, 18px); font-family: var(--font-sans);
  font-weight: 500; font-size: 11.5px; letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: rgba(247,243,236,.74); text-shadow: 0 1px 10px rgba(0,0,0,.55); }
.subhero-meta .dot { color: var(--homea-gold); padding: 0 .45em; }
.subhero-meta::before, .subhero-meta::after { content: ""; display: inline-block; width: 24px; height: 1px;
  background: var(--homea-gold); vertical-align: middle; }
.subhero-meta::before { margin-right: 12px; }
.subhero-meta::after { margin-left: 12px; }
@media (max-width: 640px) { .subhero-meta::before, .subhero-meta::after { display: none; } }

/* Slider de tipos (subcategorías nivel 2 · patrón Artexa, superficie greige) */
.subcat-band { background: var(--homea-greige); border-block: 1px solid var(--border); }
.subcat-band .container { padding-top: 34px; padding-bottom: 30px; }
.subcat-carousel { display: flex; align-items: center; gap: clamp(32px, 4vw, 72px); }
.subcat-carousel .subcat-strip { flex: 1 1 auto; min-width: 0; }
.subcat-strip { display: flex; gap: 1px; overflow-x: auto; background: var(--border);
  scrollbar-width: none; cursor: grab; }
.subcat-strip::-webkit-scrollbar { display: none; }
.subcat-strip img { -webkit-user-drag: none; user-select: none; }
.subcat-strip.dragging { cursor: grabbing; scroll-snap-type: none; scroll-behavior: auto; user-select: none; }
.subcat { flex: 1 0 200px; background: var(--homea-greige); /* crece: sin hueco al final en strips cortos */
  padding: 30px 22px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  color: inherit; border-bottom: none; transition: background var(--dur) var(--ease), transform var(--dur) var(--ease); }
.subcat:hover { background: var(--homea-greige-deep); transform: translateY(-4px); }
.subcat .img { height: 172px; width: 100%; display: grid; place-items: center; }
.subcat .img img { max-height: 172px; max-width: 94%; object-fit: contain;
  mix-blend-mode: multiply; filter: saturate(.92); }
.subcat .img img.photo { mix-blend-mode: normal; filter: none; object-fit: cover; height: 172px; width: 100%; max-width: 100%; }
.subcat .lbl { font-family: var(--font-sans); font-weight: 600; font-size: 12px;
  letter-spacing: var(--tracking-wide); text-transform: uppercase; text-align: center; color: var(--fg); }
.subcat.is-active { box-shadow: inset 0 -2px 0 var(--homea-gold); background: var(--homea-greige-deep); }
.subcat .ph { background: var(--homea-n100); color: var(--homea-n600); height: 150px; width: 90%; }
.subcat .ph .ph-inner { font-family: var(--font-sans); font-size: 10px; font-weight: 600;
  letter-spacing: .14em; text-transform: uppercase; padding: 0 12px; text-align: center; }
.subcat-arrow { flex: 0 0 auto; width: 52px; height: 52px; display: grid; place-items: center;
  background: var(--homea-espresso); color: var(--homea-bone); border: none; cursor: pointer;
  box-shadow: 0 10px 30px rgba(30, 25, 20, .16);
  transition: background .35s var(--ease), color .35s var(--ease), box-shadow .35s var(--ease), opacity .35s var(--ease); }
.subcat-arrow svg { width: 22px; height: 22px; fill: none; stroke: currentColor;
  stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; transition: transform .35s var(--ease); }
.subcat-arrow:hover { background: var(--homea-bone); color: var(--homea-espresso); box-shadow: 0 14px 38px rgba(30, 25, 20, .24); }
.subcat-arrow.prev:hover svg { transform: translateX(-3px); }
.subcat-arrow.next:hover svg { transform: translateX(3px); }
.subcat-arrow:disabled { opacity: .28; cursor: default; box-shadow: none; }
.subcat-arrow:disabled:hover { background: var(--homea-espresso); color: var(--homea-bone); }
@media (max-width: 640px) { .subcat-arrow { display: none; } }

/* Tarjeta de producto: recorte PNG sobre greige + tarjetas compactas (3 por fila) */
.pcard .imgw.cutout { display: grid; place-items: center; padding: 18px; }
.pcard .imgw.cutout img { object-fit: contain; max-height: 100%; max-width: 100%; mix-blend-mode: multiply; transition: transform var(--dur-slow) var(--ease-reveal); }
.plp { grid-template-columns: 220px minmax(0, 1fr); gap: 44px; }
.plp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.pcard .imgw { aspect-ratio: 1 / 1; max-height: 240px; width: 100%; }
.pcard .body { padding: 16px 16px 20px; gap: 7px; }
.pcard h3 { font-size: 14.5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pcard .dotlist { font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.pcard .row { margin-top: 4px; flex-wrap: wrap; row-gap: 2px; }
.pcard .arrow-link { font-size: 11px; }
.pcard .avail { font-family: var(--font-sans); font-size: 10.5px; font-weight: 600;
  letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--homea-gold-text); }
.pcard .price-note { font-size: 11px; color: var(--fg-muted); }
.pcard .price-tag { display: inline-flex; align-items: baseline; gap: 6px; white-space: nowrap; font-size: 16px; }
.quote-card { padding: 24px; }
.quote-card h3 { font-size: 18px; }
@media (max-width: 1023px) { .plp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .plp-grid { grid-template-columns: 1fr; } }
.filters .flink { font-size: 12px; color: var(--accent-text); border-bottom: none; display: inline-block; margin-top: 6px; }
.filters .fnote { font-size: 11.5px; color: var(--fg-muted); line-height: 1.5; margin-top: 4px; }
.fgroup .swatches { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.fgroup .sw { width: 22px; height: 22px; border: 1px solid var(--border-strong); cursor: pointer; position: relative; }
.fgroup .sw:hover { outline: 2px solid var(--homea-gold); outline-offset: 1px; }

/* Slider de precio (doble handle, esquinas vivas, oro champagne) */
.price-slider { margin-top: 6px; }
.ps-values { display: flex; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 600;
  letter-spacing: var(--tracking-wide); margin-bottom: 14px; }
.ps-values .ps-cur { font-size: 10px; color: var(--fg-muted); letter-spacing: var(--tracking-wider); }
.ps-values .ps-sep { color: var(--homea-gold); }
.ps-track-wrap { position: relative; height: 18px; }
.ps-track { position: absolute; top: 8px; left: 0; right: 0; height: 2px; background: var(--border); }
.ps-fill { position: absolute; top: 8px; height: 2px; background: var(--homea-gold); }
.ps-track-wrap input[type=range] { position: absolute; inset: 0; width: 100%; margin: 0;
  -webkit-appearance: none; appearance: none; background: none; pointer-events: none; height: 18px; }
.ps-track-wrap input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 0; background: var(--homea-bone);
  border: 1.5px solid var(--homea-gold-deep); cursor: pointer; pointer-events: auto;
  box-shadow: 0 1px 2px rgba(10,10,10,.18); transition: background var(--dur) var(--ease); }
.ps-track-wrap input[type=range]::-webkit-slider-thumb:hover { background: var(--homea-gold-soft); }
.ps-track-wrap input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 0;
  background: var(--homea-bone); border: 1.5px solid var(--homea-gold-deep); cursor: pointer; pointer-events: auto; }

/* Nota de catálogo en migración (subcategorías aún sin piezas en línea) */
.mig-note { border: 1px solid var(--border-strong); background: var(--surface);
  padding: clamp(30px, 5vw, 56px) clamp(22px, 4vw, 48px); display: flex; flex-direction: column;
  align-items: center; text-align: center; gap: 14px; }
.mig-note h3 { font-family: var(--font-display); font-weight: 400; font-size: clamp(22px, 2.6vw, 30px); margin: 0; }
.mig-note h3 i { font-style: italic; }
.mig-note p { max-width: 560px; color: var(--fg-muted); font-size: 14px; line-height: 1.6; margin: 0; }
.mig-cta { display: flex; gap: 26px; align-items: center; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
"""

PRICE_GROUP = """      <div class="fgroup"><h6>Precio <span style="font-weight:400;color:var(--fg-muted);letter-spacing:.08em">· MXN aprox.</span></h6>
        <div class="price-slider" id="priceSlider">
          <div class="ps-values figures"><span id="psMin">$0</span><span class="ps-sep">—</span><span id="psMax">$250,000+</span><span class="ps-cur">MXN</span></div>
          <div class="ps-track-wrap">
            <div class="ps-track"></div>
            <div class="ps-fill" id="psFill"></div>
            <input type="range" min="0" max="250000" step="5000" value="0" id="psLo" aria-label="Precio mínimo">
            <input type="range" min="0" max="250000" step="5000" value="250000" id="psHi" aria-label="Precio máximo">
          </div>
        </div>
        <p class="fnote">Filtra por el equivalente aproximado en pesos (metafield <em>filtros.precio_ref_mxn</em>). Cada pieza muestra su precio en su moneda de lista, sin IVA.</p>
      </div>"""

COLOR_GROUP = """      <div class="fgroup"><h6>Color / Acabado</h6>
        <div class="swatches">
          <span class="sw" title="Acero inoxidable" style="background:linear-gradient(135deg,#d8d8d6,#aeb0b2)"></span>
          <span class="sw" title="Negro" style="background:#1c1c1c"></span>
          <span class="sw" title="Blanco" style="background:#f4f2ee"></span>
          <span class="sw" title="Bronce / Latón" style="background:linear-gradient(135deg,#c9a26a,#8e6f3a)"></span>
          <span class="sw" title="Cromo" style="background:linear-gradient(135deg,#e8eaec,#b9bec4)"></span>
        </div>
        <p class="fnote">Filtra por variantes disponibles (opción Color/Acabado del producto).</p>
      </div>"""

PRICE_JS = """// Slider de precio (doble handle)
(function(){
  var lo = document.getElementById('psLo'), hi = document.getElementById('psHi');
  if (!lo || !hi) return;
  var fill = document.getElementById('psFill'), vMin = document.getElementById('psMin'), vMax = document.getElementById('psMax');
  var MAX = parseInt(hi.max, 10);
  function fmt(n){ return '$' + n.toLocaleString('en-US'); }
  function paint(){
    var a = Math.min(+lo.value, +hi.value), b = Math.max(+lo.value, +hi.value);
    vMin.textContent = fmt(a);
    vMax.textContent = b >= MAX ? fmt(MAX) + '+' : fmt(b);
    fill.style.left = (a / MAX * 100) + '%';
    fill.style.width = ((b - a) / MAX * 100) + '%';
  }
  lo.value = 0; hi.value = MAX; // estado inicial (evita la restauración de formulario del navegador)
  lo.addEventListener('input', paint); hi.addEventListener('input', paint); paint();
})();"""

TIPO_JS = """// ?tipo=<slug>: marca el tile y el checkbox del tipo correspondiente (deep-link desde nav/hero)
(function(){
  var tipo = new URLSearchParams(location.search).get('tipo');
  if (!tipo) return;
  var nombre = null;
  document.querySelectorAll('[data-tipo]').forEach(function(el){
    if (el.getAttribute('data-tipo') !== tipo) return;
    if (el.classList.contains('subcat')) { el.classList.add('is-active'); }
    else { var cb = el.querySelector('input'); if (cb) cb.checked = true; nombre = el.textContent.trim(); }
  });
  var r = document.getElementById('plpResults');
  if (r && nombre) r.textContent += ' · tipo: ' + nombre;
})();"""


def build_tiles(cfg):
    if len(cfg["tiles"]) < 2:
        return ""
    tiles = []
    for slug, label, img, klass in cfg["tiles"]:
        if img:
            cls = ' class="photo"' if klass == "photo" else ""
            inner = f'<span class="img"><img src="{img}"{cls} alt="{label}"></span>'
        else:
            inner = f'<span class="img"><span class="ph"><span class="ph-inner">{label}</span></span></span>'
        tiles.append(f'    <a class="subcat" data-tipo="{slug}" href="?tipo={slug}">\n'
                     f'      {inner}\n      <span class="lbl">{label}</span>\n    </a>')
    tiles = "\n".join(tiles)
    return f"""
<!-- Slider de tipos (subcategorías nivel 2 · patrón Artexa) -->
<section class="subcat-band"><div class="container">
  <div class="subcat-carousel">
    <button type="button" class="subcat-arrow prev" data-scroll="-1" aria-label="Anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="19" y1="12" x2="6" y2="12"/><polyline points="12 6 6 12 12 18"/></svg></button>
    <div class="subcat-strip" id="subcatStrip">
{tiles}
  </div>
    <button type="button" class="subcat-arrow next" data-scroll="1" aria-label="Siguiente"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="18" y2="12"/><polyline points="12 6 18 12 12 18"/></svg></button>
  </div>
</div></section>
"""


def build_filters(cfg):
    g = []
    if len(cfg["tiles"]) > 1:
        labels = "\n".join(
            f'          <label data-tipo="{slug}"><input type="checkbox"> {label}</label>'
            for slug, label, _i, _k in cfg["tiles"])
        g.append('      <div class="fgroup"><h6>Tipo</h6>\n' + labels + "\n      </div>")
    marcas = "\n".join(f'        <label><input type="checkbox"> {m}</label>' for m in cfg["marcas"])
    g.append('      <div class="fgroup"><h6>Marca</h6>\n' + marcas +
             '\n        <a class="flink" href="marcas.html">Ver las 46 marcas →</a>\n      </div>')
    g.append("""      <div class="fgroup"><h6>Gama</h6>
        <label><input type="checkbox"> Premium</label>
        <label><input type="checkbox"> Residencial</label>
        <label><input type="checkbox"> Media</label>
        <label><input type="checkbox"> Económica</label>
      </div>""")
    for title, opts in cfg["extras"]:
        labels = "\n".join(f'        <label><input type="checkbox"> {o}</label>' for o in opts)
        g.append(f'      <div class="fgroup"><h6>{title}</h6>\n{labels}\n      </div>')
    if cfg["color"]:
        g.append(COLOR_GROUP)
    g.append(PRICE_GROUP)
    return "\n".join(g)


def build_grid(cfg, cards):
    if not cfg["products"]:
        wa_lbl = f'plp_{cfg["slug"]}'
        return f"""      <div class="mig-note">
        <div class="eyebrow">Catálogo en migración</div>
        <h3>Las piezas de {cfg["nombre"].replace("&", "&amp;")} <i>están por publicarse</i>.</h3>
        <p>Estamos migrando el catálogo completo (~25,000 piezas) a la nueva plataforma. Mientras tanto, un especialista te comparte hoy mismo modelos, precios y existencias de esta categoría.</p>
        <div class="mig-cta">
          <a class="btn btn-gold" href="contacto.html">Hablar con un especialista</a>
          <a class="arrow-link" href="{WA}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="{wa_lbl}">Cotizar por WhatsApp <span class="ln"></span><span class="ar">→</span></a>
        </div>
      </div>"""
    body = "\n\n".join(cards[p] for p in cfg["products"])
    return f"""      <div class="plp-grid">

{body}

        <!-- Lead embebido: alto ticket → especialista -->
        <div class="quote-card">
          <div class="eyebrow eyebrow-bright">Proyecto de cocina</div>
          <h3>¿Especificando una cocina <i>completa</i>?</h3>
          <p>Un especialista arma contigo el paquete por marca: medidas, cargas eléctricas, ventilación y paneles. Sin costo.</p>
          <a class="arrow-link light" href="contacto.html">Cotizar con especialista <span class="ln"></span><span class="ar">→</span></a>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:14px;margin-top:56px;align-items:baseline">
        <span class="figures" style="font-size:12px;font-weight:600;letter-spacing:var(--tracking-wider)">01 <span style="color:var(--fg-muted)">/ 01</span></span>
        <span class="rule-gold" style="align-self:center"></span>
        <a class="arrow-link" href="#">Siguiente página <span class="ln"></span><span class="ar">→</span></a>
      </div>"""


def jsonld(cfg):
    nombre = cfg["nombre"].replace("&", "&")
    return f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {{"@type":"ListItem","position":1,"name":"Inicio","item":"https://www.homea.mx/"}},
 {{"@type":"ListItem","position":2,"name":"Cocina y Bar","item":"https://www.homea.mx/productos/cocina-y-bar"}},
 {{"@type":"ListItem","position":3,"name":"{nombre}","item":"https://www.homea.mx/productos/cocina-y-bar/{cfg['slug']}"}}
]}}
</script>"""


def main():
    update_mega()
    update_macro()

    # Chrome compartido: nav del home (mismo que usa el front Next) + footer/CTA/wa-float de la macro
    home = open(os.path.join(PREV, "home.html"), encoding="utf-8").read()
    macro = open(os.path.join(PREV, "categoria-cocina-y-bar.html"), encoding="utf-8").read()
    nav = re.search(r'<div class="ubar">[\s\S]*?</nav>', home).group(0)
    footer = re.search(r'<footer class="site-footer">[\s\S]*?</footer>', macro).group(0)
    cta = re.search(r'<section class="sec on-dark cta-band">[\s\S]*?</section>', macro).group(0)
    wafloat = re.search(r'<a class="wa-float"[\s\S]*?</a>', macro).group(0)

    cards = {}
    for m in re.finditer(r'<a class="pcard" href="producto-([a-z0-9]+)\.html">[\s\S]*?</a>', macro):
        cards[m.group(1)] = m.group(0)
    faltan = {p for c in PAGES for p in c["products"]} - set(cards)
    if faltan:
        sys.exit(f"tarjetas de producto no encontradas: {faltan}")

    for cfg in PAGES:
        titulo = f'HOMEA — {cfg["nombre"]} · Cocina y Bar'
        html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{cfg['desc']}">
<link rel="icon" type="image/png" href="assets/favicon-circle.png">
<link rel="stylesheet" href="tokens-v2.css">
<link rel="stylesheet" href="theme.css?v=60">
<link rel="stylesheet" href="placeholders.css">
<style>{CSS}</style>
</head>
<body>

{nav}

<!-- Hero compacto de subcategoría nivel 1 → directo al catálogo filtrable -->
<header class="subhero">
  <div class="subhero-bg"><img src="assets/photos/{cfg['hero']}" alt="{cfg['heroalt']}" style="object-position:{cfg['pos']}" fetchpriority="high"></div>
  <div class="subhero-scrim" aria-hidden="true"></div>
  <div class="subhero-inner">
    <nav class="subhero-crumbs" aria-label="Migas de pan"><a href="home.html">Inicio</a><span class="sep">·</span><a href="categoria-cocina-y-bar.html">Cocina y Bar</a><span class="sep">·</span><span aria-current="page">{cfg['nombre'].replace('&', '&amp;')}</span></nav>
    <h1>{cfg['h1']}</h1>
    <span class="subhero-meta">{cfg['meta']}</span>
  </div>
</header>
{build_tiles(cfg)}
<!-- PLP: filtros específicos de {cfg['nombre'].replace('&', '&amp;')} + grid -->
<section class="sec tight" style="padding-top:48px"><div class="container">
  <div class="plp">
    <!-- Filtros (Shopify Search & Discovery: vendor / type / metafields / opciones de variante) -->
    <aside class="filters">
{build_filters(cfg)}
    </aside>
    <div>
      <div class="toolbar">
        <span class="results figures" id="plpResults">{cfg['results']}</span>
        <select aria-label="Ordenar"><option>Relevancia</option><option>Precio ↑</option><option>Precio ↓</option><option>Novedades</option></select>
      </div>
{build_grid(cfg, cards)}
    </div>
  </div>
</div></section>

{cta}

{footer}

{wafloat}
{jsonld(cfg)}
<script src="v2.js?v=25"></script>
<script src="wishlist.js?v=5"></script>
<script src="cart.js?v=3"></script>
<script>
{PRICE_JS}

{TIPO_JS}
</script>
</body>
</html>
"""
        out = os.path.join(PREV, P(cfg["slug"]))
        open(out, "w", encoding="utf-8").write(html)
        print("generada:", os.path.basename(out))


if __name__ == "__main__":
    main()
