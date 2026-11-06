/* HOMEA v2 — catalogo.js
   Filtros, orden y galería del catálogo vivo (tarjetas que genera
   lib/shopify/htmlCatalogo.ts con datos de Shopify).

   · Cada tarjeta trae sus valores en data-fv-<clave> (slugs separados por
     espacio) y su tipo en data-tipo. Cada casilla del panel trae data-fk y value.
   · Dentro de un grupo las casillas suman (O); entre grupos se cruzan (Y).
   · Las casillas NO filtran al marcarse: el usuario despliega grupos, marca
     varias y pulsa "Ver N piezas" (barra al pie del panel). Lo aplicado vive en
     plp.__aplicados; las casillas son el estado pendiente. Solo el riel de tipos
     (?tipo=, tipos.js) y el mosaico de la PLP (?f=, PlpFiltro) aplican al
     instante: marcan su casilla y avisan con el evento "catalogo:aplicar".
   · Los conteos de cada casilla se recalculan con los demás grupos aplicados
     (facetas), y los filtros activos se listan como chips sobre la rejilla.

   Listeners DELEGADOS en document, igual que tipos.js y wishlist.js: <main> se
   reemplaza en cada navegación SPA de Next (components/PreviewRouter). */
(function () {
  "use strict";

  function tarjetas(raiz) {
    return Array.prototype.slice.call(raiz.querySelectorAll("[data-cat-card]"));
  }

  function casillas(plp) {
    return Array.prototype.slice.call(plp.querySelectorAll(".filters input[data-fk]"));
  }

  /* Estado pendiente: lo que está marcado ahora mismo (más el rango de precio,
     que viaja como grupo "precio" con ["min-max"] en pesos con IVA). */
  function pendientes(plp) {
    var activos = {};
    casillas(plp).forEach(function (cb) {
      if (!cb.checked) return;
      var k = cb.getAttribute("data-fk");
      (activos[k] = activos[k] || []).push(cb.value);
    });
    var rango = rangoPrecio(plp);
    if (rango) activos.precio = [rango];
    return activos;
  }

  /* Slider doble ↔ campos numéricos. Los campos (data-fp) son la verdad; el
     slider los escribe al arrastrar y el relleno dorado marca el tramo. */
  function pintarSlider(caja) {
    var max = parseFloat(caja.getAttribute("data-max")) || 0;
    if (!max) return;
    var nMin = caja.querySelector('[data-fp="min"]'), nMax = caja.querySelector('[data-fp="max"]');
    var rMin = caja.querySelector('[data-fr="min"]'), rMax = caja.querySelector('[data-fr="max"]');
    var lo = Math.min(parseFloat(nMin.value) || 0, max);
    var hi = parseFloat(nMax.value) || max;
    if (hi > max) hi = max;
    if (rMin && rMax) {
      if (parseFloat(rMin.value) !== lo) rMin.value = lo;
      if (parseFloat(rMax.value) !== hi) rMax.value = hi;
    }
    var fill = caja.querySelector("[data-fp-fill]");
    if (fill) { fill.style.left = (lo / max * 100) + "%"; fill.style.right = (100 - hi / max * 100) + "%"; }
  }

  function desdeSlider(r) {
    var caja = r.closest("[data-cat-precio]");
    var max = parseFloat(caja.getAttribute("data-max")) || 0;
    var rMin = caja.querySelector('[data-fr="min"]'), rMax = caja.querySelector('[data-fr="max"]');
    var lo = parseFloat(rMin.value) || 0, hi = parseFloat(rMax.value) || max;
    if (lo > hi - 1000) { if (r === rMin) { lo = Math.max(0, hi - 1000); rMin.value = lo; } else { hi = Math.min(max, lo + 1000); rMax.value = hi; } }
    caja.querySelector('[data-fp="min"]').value = lo > 0 ? lo : "";
    caja.querySelector('[data-fp="max"]').value = hi < max ? hi : "";
    pintarSlider(caja);
  }

  function rangoPrecio(plp) {
    var caja = plp.querySelector("[data-cat-precio]");
    if (!caja) return null;
    var min = parseFloat(caja.querySelector('[data-fp="min"]').value) || 0;
    var max = parseFloat(caja.querySelector('[data-fp="max"]').value) || 0;
    if (!min && !max) return null;
    return min + "-" + max;
  }

  function coincide(card, clave, valores) {
    if (clave === "precio") {
      var p = parseFloat(card.getAttribute("data-precio")) || 0;
      var lim = valores[0].split("-");
      var lo = parseFloat(lim[0]) || 0, hi = parseFloat(lim[1]) || 0;
      return p >= lo && (!hi || p <= hi);
    }
    if (clave === "precio-rango") {
      /* Rangos proporcionales del grupo Precio ("lo-hi", hi 0 = sin tope). */
      var pr = parseFloat(card.getAttribute("data-precio")) || 0;
      return valores.some(function (v) {
        var r = v.split("-"), a = parseFloat(r[0]) || 0, b = parseFloat(r[1]) || 0;
        return pr >= a && (!b || pr < b);
      });
    }
    var propios = clave === "tipo-web"
      ? [card.getAttribute("data-tipo") || ""]
      : (card.getAttribute("data-fv-" + clave) || "").split(" ");
    for (var i = 0; i < valores.length; i++) {
      if (propios.indexOf(valores[i]) !== -1) return true;
    }
    return false;
  }

  function pasa(card, activos, omitir) {
    return Object.keys(activos).every(function (k) {
      return k === omitir || coincide(card, k, activos[k]);
    });
  }

  function cuantas(cards, activos) {
    var n = 0;
    cards.forEach(function (c) { if (pasa(c, activos)) n++; });
    return n;
  }

  function iguales(a, b) {
    var ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.join("|") !== kb.join("|")) return false;
    return ka.every(function (k) {
      return a[k].slice().sort().join(" ") === b[k].slice().sort().join(" ");
    });
  }

  function etiquetaDe(cb) {
    var l = cb.closest("label");
    var t = l && l.querySelector(".flbl");
    var texto = t ? t.textContent : (l ? l.textContent.replace(/\s*\d+\s*$/, "") : cb.value);
    return texto.replace(/\s+/g, " ").trim();
  }

  function nombreGrupo(plp, clave) {
    var cb = plp.querySelector('.filters input[data-fk="' + clave + '"]');
    var grupo = cb && cb.closest("[data-fgroup]");
    var g = grupo ? grupo.querySelector("h6") : plp.querySelector('.filters [data-fgroup="' + clave + '"] h6');
    return g ? g.firstChild.textContent.trim() : "";
  }

  /* ---------- Pintado ---------- */

  /* Conteos facetados: cuántas piezas daría cada casilla con el resto de grupos
     aplicados. Las que darían cero se atenúan (siguen marcables). */
  function recontar(plp, cards, activos) {
    casillas(plp).forEach(function (cb) {
      var k = cb.getAttribute("data-fk");
      var n = 0;
      cards.forEach(function (c) {
        if (pasa(c, activos, k) && coincide(c, k, [cb.value])) n++;
      });
      var span = cb.closest("label") && cb.closest("label").querySelector(".count");
      if (span && span.textContent !== String(n)) span.textContent = String(n);
      var l = cb.closest("label");
      if (l) {
        l.classList.toggle("is-cero", n === 0 && !cb.checked);
        /* Grupos con data-ocultar-cero (Marca): solo se listan las que aplican. */
        var g = l.closest("[data-ocultar-cero]");
        if (g) l.classList.toggle("is-oculta", n === 0 && !cb.checked);
      }
    });
  }

  /* Badge "n" en el título de cada grupo (visible aunque esté plegado). */
  function badges(plp) {
    plp.querySelectorAll(".filters [data-fgroup]").forEach(function (g) {
      var n = g.querySelectorAll("input[data-fk]:checked").length;
      if (g.getAttribute("data-fgroup") === "precio") n += rangoPrecio(g.closest(".plp")) ? 1 : 0;
      var b = g.querySelector("[data-fsel]");
      if (!b) return;
      if (b.textContent !== String(n)) b.textContent = String(n);
      if (b.hidden !== (n === 0)) b.hidden = n === 0;
    });
  }

  function chips(plp, activos) {
    var caja = plp.querySelector("[data-cat-chips]");
    if (!caja) {
      var aside = plp.querySelector(".filters");
      if (!aside) return;
      caja = document.createElement("div");
      caja.className = "fchips fchips--panel";
      caja.setAttribute("data-cat-chips", "");
      aside.insertBefore(caja, aside.firstChild);
    }
    var html = "";
    var total = 0;
    Object.keys(activos).forEach(function (k) {
      activos[k].forEach(function (v) {
        if (k === "precio") {
          total++;
          var lim = v.split("-");
          var fmt = function (n) { return "$" + Number(n).toLocaleString("es-MX"); };
          var txt = (lim[0] > 0 ? "desde " + fmt(lim[0]) : "") + (lim[1] > 0 ? (lim[0] > 0 ? " " : "") + "hasta " + fmt(lim[1]) : "");
          html += '<button type="button" class="fchip" data-cat-chip data-fk="precio" data-v="' + v + '">' +
            '<span class="fchip-g">Precio</span><span class="fchip-v">' + txt + '</span><span class="fchip-x" aria-hidden="true">×</span>' +
            '<span class="sr-only"> · quitar</span></button>';
          return;
        }
        var cb = plp.querySelector('.filters input[data-fk="' + k + '"][value="' + v + '"]');
        if (!cb) return;
        total++;
        var grupo = nombreGrupo(plp, k);
        var valor = etiquetaDe(cb);
        /* title: el valor completo, por si la tarjeta lo corta con "…". */
        var titulo = ((grupo ? grupo + ": " : "") + valor).replace(/"/g, "&quot;");
        html += '<button type="button" class="fchip" data-cat-chip data-fk="' + k + '" data-v="' + v + '" title="' + titulo + '">' +
          (grupo ? '<span class="fchip-g">' + grupo + '</span>' : "") +
          '<span class="fchip-v">' + valor + '</span><span class="fchip-x" aria-hidden="true">×</span>' +
          '<span class="sr-only"> · quitar</span></button>';
      });
    });
    if (total) {
      html = '<h6 class="fchips-t">Filtros aplicados</h6>' + html +
        '<button type="button" class="fchip fchip--all" data-cat-clear>Eliminar todo</button>';
    }
    caja.innerHTML = html;
    caja.hidden = total === 0;
  }

  function barra(plp, cards) {
    var bar = plp.querySelector("[data-cat-bar]");
    if (!bar) return;
    var pend = pendientes(plp);
    var apl = plp.__aplicados || {};
    var cambio = !iguales(pend, apl);
    var hayAlgo = Object.keys(pend).length > 0 || Object.keys(apl).length > 0;
    var apply = bar.querySelector("[data-cat-apply]");
    var n = bar.querySelector("[data-cat-n]");
    if (apply) {
      apply.hidden = !cambio;
      if (n) n.textContent = String(cuantas(cards, pend));
      apply.classList.toggle("is-vacio", cambio && cuantas(cards, pend) === 0);
    }
    bar.hidden = !hayAlgo && !cambio;
    bar.classList.toggle("has-cambios", cambio);
  }

  function aplicar(plp, activos) {
    var cards = tarjetas(plp);
    if (!cards.length) return;
    /* Página: vuelve a la 1 solo si los filtros cambiaron (al regresar de una
       ficha el mismo filtro se aplica dos veces y debe quedar la página guardada). */
    var firma = JSON.stringify(activos);
    if (plp.__paginaRestaurada) {
      plp.__pagina = plp.__paginaRestaurada;
      plp.__paginaRestaurada = null;
    } else if (plp.__firmaFiltros !== undefined && plp.__firmaFiltros !== firma) {
      plp.__pagina = 1;
    }
    plp.__firmaFiltros = firma;
    plp.__aplicados = activos;
    var visibles = 0;
    cards.forEach(function (card) {
      var ok = pasa(card, activos);
      card.hidden = !ok;
      if (ok) visibles++;
    });

    var r = plp.querySelector(".toolbar .results");
    if (r) {
      var filtrado = Object.keys(activos).length > 0;
      var unidad = r.getAttribute("data-unidad") || "en línea";
      var base = filtrado
        ? visibles + " de " + cards.length + " piezas"
        : visibles + (visibles === 1 ? " pieza " : " piezas ") + unidad;
      r.setAttribute("data-base", base);
      r.textContent = base;
    }
    /* Botón "Borrar filtros" fuera del panel (wishlist): solo con algo aplicado. */
    plp.querySelectorAll("[data-cat-reset]").forEach(function (b) { b.hidden = Object.keys(activos).length === 0; });
    var vacio = plp.querySelector("[data-cat-vacio]");
    if (vacio) vacio.hidden = visibles > 0;

    recontar(plp, cards, activos);
    badges(plp);
    chips(plp, activos);
    barra(plp, cards);
    paginar(plp);
    guardarFiltros(plp, activos);
  }

  /* Aplica lo marcado ahora mismo (riel, mosaico, botón "Ver N piezas"). */
  function aplicarMarcado(plp) {
    aplicar(plp, pendientes(plp));
  }

  function aplicarTodos() {
    document.querySelectorAll(".plp").forEach(aplicarMarcado);
  }

  var pendiente = null;
  function aplicarLuego() {
    if (pendiente) return;
    pendiente = setTimeout(function () { pendiente = null; aplicarTodos(); }, 0);
  }

  /* Tras aplicar desde el panel: en móvil se pliega la hoja de filtros, y si la
     barra de resultados quedó arriba del viewport se sube hasta ella. */
  function enfocarResultados(plp) {
    var sheet = plp.querySelector("details.filters-sheet");
    if (sheet && sheet.open && window.matchMedia("(max-width: 1080px)").matches) sheet.open = false;
    var toolbar = plp.querySelector(".toolbar");
    if (!toolbar) return;
    var top = toolbar.getBoundingClientRect().top;
    var banda = document.querySelector(".site-nav .nav-main");
    var nav = banda ? Math.round(banda.getBoundingClientRect().height) : 80;
    if (top >= nav && top < window.innerHeight * 0.6) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.__homeaScrollA && !reduce) window.__homeaScrollA(toolbar, 24);
    else toolbar.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function limpiar(plp) {
    casillas(plp).forEach(function (cb) { cb.checked = false; });
    plp.querySelectorAll("[data-cat-precio] input[data-fp]").forEach(function (i) { i.value = ""; });
    plp.querySelectorAll("[data-cat-precio]").forEach(pintarSlider);
    aplicar(plp, {});
    enfocarResultados(plp);
  }

  /* Volver a entrar a ESTA página desde fuera del catálogo (mega-menú, cajón
     móvil, migas…) es empezar de cero: solo queda el tipo que trae el enlace.
     Next no vuelve a pintar <main> cuando solo cambia ?tipo=, así que sin esto
     se quedaban marcados los filtros de la búsqueda anterior. */
  function reiniciar(plp, tipo) {
    casillas(plp).forEach(function (cb) {
      var l = cb.closest("label[data-tipo]");
      cb.checked = !!tipo && !!l && l.getAttribute("data-tipo") === tipo;
    });
    plp.querySelectorAll("[data-cat-precio] input[data-fp]").forEach(function (i) { i.value = ""; });
    plp.querySelectorAll("[data-cat-precio]").forEach(pintarSlider);
    plp.querySelectorAll("[data-fgroup] [data-fbuscar]").forEach(function (i) { i.value = ""; buscarEnGrupo(i); });
    aplicarMarcado(plp);
  }

  function reiniciarSiEsEstaPagina(e, a) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.closest(".plp, .subcat-strip, a.subcat[data-tipo], .tpg-card")) return;
    if (a.target && a.target !== "_self") return;
    var u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
    if (u.origin !== location.origin || u.pathname !== location.pathname) return;
    document.querySelectorAll(".plp").forEach(function (plp) { reiniciar(plp, u.searchParams.get("tipo")); });
  }

  /* ---------- Filtros que sobreviven a la ficha (Carla, 2026-10-22) ----------
     Lo aplicado en cada catálogo (casillas, precio y orden) se guarda en la
     sesión por página. Al volver de una ficha (atrás, migas o cualquier enlace
     dentro de la página) el catálogo reaparece igual. Se borra todo al entrar a
     una página que no es de tienda (inicio, guías, herramientas, nosotros…), y
     se empieza de cero al entrar desde el menú, el cajón o el pie (enlaces fuera
     de <main>), como antes. */
  var CLAVE_F = "homea:filtros:";
  var TIENDA = /^\/(productos|producto|marcas|ofertas|wishlist|mi-proyecto|cotizacion|c)(\/|$)/;
  var restaurando = false;

  function claveFiltros(plp) {
    var i = Array.prototype.indexOf.call(document.querySelectorAll(".plp"), plp);
    return CLAVE_F + location.pathname + "#" + i;
  }

  function selectOrden(plp) {
    return plp.querySelector('.toolbar select[aria-label="Ordenar"]');
  }

  function guardarFiltros(plp, activos) {
    if (restaurando) return;
    var sel = selectOrden(plp);
    try {
      var pag = plp.__pagina || 1;
      var por = plp.__porPagina || POR_PAGINA;
      if (!Object.keys(activos).length && (!sel || sel.selectedIndex <= 0) && pag === 1 && por === POR_PAGINA) {
        sessionStorage.removeItem(claveFiltros(plp));
      } else {
        sessionStorage.setItem(claveFiltros(plp), JSON.stringify({ a: activos, o: sel ? sel.value : "", p: pag, n: por }));
      }
    } catch (e) {}
  }

  /* Sin ruta: todas las páginas. Con ruta: solo esa. */
  function olvidarFiltros(ruta) {
    try {
      var prefijo = CLAVE_F + (ruta ? ruta + "#" : "");
      for (var i = sessionStorage.length - 1; i >= 0; i--) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(prefijo) === 0) sessionStorage.removeItem(k);
      }
    } catch (e) {}
  }

  function restaurarFiltros(plp) {
    var g = null;
    try { g = JSON.parse(sessionStorage.getItem(claveFiltros(plp)) || "null"); } catch (e) {}
    if (!g || !g.a) return;
    restaurando = true;
    if (OPCIONES_PAGINA.indexOf(g.n) !== -1) plp.__porPagina = g.n;
    if (g.p > 1) plp.__paginaRestaurada = g.p;
    casillas(plp).forEach(function (cb) {
      cb.checked = (g.a[cb.getAttribute("data-fk")] || []).indexOf(cb.value) !== -1;
    });
    var caja = plp.querySelector("[data-cat-precio]");
    if (caja) {
      var r = ((g.a.precio || [""])[0] || "").split("-");
      caja.querySelector('[data-fp="min"]').value = parseFloat(r[0]) > 0 ? r[0] : "";
      caja.querySelector('[data-fp="max"]').value = parseFloat(r[1]) > 0 ? r[1] : "";
      pintarSlider(caja);
    }
    var sel = selectOrden(plp);
    if (sel && g.o && sel.value !== g.o) { sel.value = g.o; ordenar(sel); }
    restaurando = false;
    /* tipos.js y PlpFiltro marcan la casilla del tipo según la URL al llegar:
       durante este respiro respetan lo restaurado (window.__homeaFiltrosRestaurados). */
    window.__homeaFiltrosRestaurados = { ruta: location.pathname, hasta: Date.now() + 2000 };
    aplicarMarcado(plp);
  }

  function revisarRuta() {
    if (!TIENDA.test(location.pathname)) olvidarFiltros();
  }

  /* Enlace fuera de <main> (menú, cajón, pie) hacia una página de tienda: se
     entra de cero a esa página. */
  function entradaNueva(e, a) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.closest("main")) return;
    var u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !TIENDA.test(u.pathname)) return;
    olvidarFiltros(u.pathname);
  }

  /* ---------- Páginas (Carla, 2026-11-04) ----------
     50 piezas por página y, hasta abajo, el selector de página (‹ 1 2 3 … ›) y
     "Mostrar 50 · 100 · 200". Solo en las rejillas con data-cat-lista
     (lib/shopify/htmlCatalogo.ts → rejillaHtml): ahí el servidor manda completas
     las primeras 50 y el resto como tarjetas vacías (.pcard-vacia) con sus datos
     de filtro. Los filtros, conteos y orden trabajan sobre todas; aquí solo se
     decide cuáles se ven (data-fuera) y se pide a /api/tarjetas el contenido de
     las vacías que entran en la página. Sin data-cat-lista (/ofertas) no se toca. */
  var POR_PAGINA = 50;
  var OPCIONES_PAGINA = [50, 100, 200];

  function listaDe(grid) {
    var m = grid && grid.querySelector("[data-cat-lista]");
    return m ? m.getAttribute("data-cat-lista") : null;
  }

  /* Llena una tarjeta vacía con la completa, en el mismo elemento: conserva su
     lugar, su estado de filtro y su identidad (otros scripts la tienen a la mano). */
  function llenarTarjeta(card, html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    var nueva = t.content.firstElementChild;
    if (!nueva) return;
    card.innerHTML = nueva.innerHTML;
    card.classList.remove("pcard-vacia", "pcard-ligera");
    card.removeAttribute("aria-hidden");
    card.removeAttribute("tabindex");
    /* Lo que la tarjeta aún no trae (data-accion, href de una hermana suelta) se
       copia; sus datos de filtro y orden se respetan (la wishlist usa los suyos). */
    Array.prototype.forEach.call(nueva.attributes, function (a) {
      if (!card.hasAttribute(a.name)) card.setAttribute(a.name, a.value);
    });
  }

  /* Pide el contenido de tarjetas vacías (en tandas de hasta 200). */
  /* Pide el contenido de tarjetas vacías o ligeras. Las de un listado (en la
     rejilla con data-cat-lista) van por su listado; las demás —la wishlist, una
     hermana de color fuera de la página— como sueltas, por SKU (2026-11-05:
     "todas las tarjetas deben ser iguales en toda la página"). */
  function cargarTarjetas(grid, cards) {
    var lista = listaDe(grid);
    var faltan = cards.filter(function (c) {
      return (c.classList.contains("pcard-vacia") || c.classList.contains("pcard-ligera")) && !c.__cargando && !c.__sinTarjeta;
    });
    if (!faltan.length) return Promise.resolve();
    var tandas = [];
    var deLista = faltan.filter(function (c) { return lista && c.isConnected && grid && grid.contains(c); });
    var sueltas = faltan.filter(function (c) { return deLista.indexOf(c) === -1; });
    for (var i = 0; i < deLista.length; i += 200) tandas.push({ lista: lista, cards: deLista.slice(i, i + 200) });
    for (var j = 0; j < sueltas.length; j += 60) tandas.push({ lista: null, cards: sueltas.slice(j, j + 60) });
    return Promise.all(tandas.map(function (t) {
      var tanda = t.cards;
      tanda.forEach(function (c) { c.__cargando = true; });
      var skus = tanda.map(function (c) { return c.getAttribute("data-sku"); }).join(",");
      return fetch("/api/tarjetas?" + (t.lista ? "lista=" + encodeURIComponent(t.lista) + "&" : "") + "skus=" + encodeURIComponent(skus))
        .then(function (r) { return r.ok ? r.json() : { tarjetas: {} }; })
        .catch(function () { return { tarjetas: {} }; })
        .then(function (d) {
          tanda.forEach(function (c) {
            c.__cargando = false;
            var html = d.tarjetas && d.tarjetas[c.getAttribute("data-sku")];
            if (html) llenarTarjeta(c, html);
            else c.__sinTarjeta = true; // no se vuelve a pedir: se queda como está
          });
        });
    }));
  }

  function numerosDePagina(p, total) {
    if (total <= 7) return Array.from({ length: total }, function (_, i) { return i + 1; });
    var out = [1];
    var desde = Math.max(2, p - 1), hasta = Math.min(total - 1, p + 1);
    if (p <= 3) { desde = 2; hasta = 4; }
    if (p >= total - 2) { desde = total - 3; hasta = total - 1; }
    if (desde > 2) out.push("…");
    for (var i = desde; i <= hasta; i++) out.push(i);
    if (hasta < total - 1) out.push("…");
    out.push(total);
    return out;
  }

  var FLECHA_IZQ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var FLECHA_DER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  function pintarPaginador(plp, grid, p, paginas, por, total) {
    var nav = plp.querySelector(".plp-paginas");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "plp-paginas";
      nav.setAttribute("aria-label", "Páginas del catálogo");
      grid.insertAdjacentElement("afterend", nav);
    }
    nav.hidden = total <= OPCIONES_PAGINA[0];
    if (nav.hidden) return;
    var fmt = function (x) { return x.toLocaleString("es-MX"); };
    var desde = (p - 1) * por + 1, hasta = Math.min(total, p * por);
    var nums = numerosDePagina(p, paginas).map(function (x) {
      if (x === "…") return '<span class="plp-pag-salto" aria-hidden="true">…</span>';
      return '<button type="button" class="plp-pag-num' + (x === p ? ' is-on" aria-current="page' : "") +
        '" data-pag="' + x + '" aria-label="Página ' + x + '">' + x + "</button>";
    }).join("");
    var html =
      '<div class="plp-pag-nums">' +
      '<button type="button" class="plp-pag-flecha" data-pag="' + (p - 1) + '" aria-label="Página anterior"' + (p <= 1 ? " disabled" : "") + ">" + FLECHA_IZQ + "</button>" +
      nums +
      '<button type="button" class="plp-pag-flecha" data-pag="' + (p + 1) + '" aria-label="Página siguiente"' + (p >= paginas ? " disabled" : "") + ">" + FLECHA_DER + "</button>" +
      "</div>" +
      '<p class="plp-pag-rango">' + fmt(desde) + "–" + fmt(hasta) + " de " + fmt(total) + " piezas</p>";
    if (nav.__html !== html) { nav.innerHTML = html; nav.__html = html; }
  }

  /* "Mostrar 50 piezas ↓" en la barra de arriba, a la izquierda del orden y con
     su mismo estilo (Carla, 2026-11-04). Siempre visible, también con menos de 50
     piezas, como en la wishlist (2026-11-05). */
  function selectorPorPagina(plp, por, total) {
    var orden = selectOrden(plp);
    if (!orden) return;
    var sel = plp.querySelector(".toolbar select[data-por-pagina]");
    if (!sel) {
      sel = document.createElement("select");
      sel.setAttribute("aria-label", "Piezas por página");
      sel.setAttribute("data-por-pagina", "");
      sel.className = "plp-por-sel";
      // En la wishlist el selector ya trae su chevrón (CSS): sin "↓" en el texto (2026-11-05).
      var flecha = orden.closest(".wl-toolbar") ? "" : " ↓";
      sel.innerHTML = OPCIONES_PAGINA.map(function (n) {
        return '<option value="' + n + '">Mostrar ' + n + " piezas" + flecha + "</option>";
      }).join("");
      orden.insertAdjacentElement("beforebegin", sel);
    }
    if (sel.value !== String(por)) sel.value = String(por);
  }

  /* Decide qué tarjetas se ven en la página actual y pide las que faltan. */
  function paginar(plp) {
    var grid = plp.querySelector(".plp-grid");
    // Listados con data-cat-lista y la wishlist (data-cat-paginar, 2026-11-05).
    if (!grid || (!listaDe(grid) && !grid.hasAttribute("data-cat-paginar"))) return;
    var por = plp.__porPagina || POR_PAGINA;
    var cards = tarjetas(grid);
    selectorPorPagina(plp, por, cards.length);
    var visibles = cards.filter(function (c) { return !c.hidden; });
    var paginas = Math.max(1, Math.ceil(visibles.length / por));
    var p = Math.min(Math.max(1, plp.__pagina || 1), paginas);
    plp.__pagina = p;
    var desde = (p - 1) * por, hasta = desde + por;
    var enPagina = [];
    var i = 0;
    cards.forEach(function (c) {
      var dentro = !c.hidden && i >= desde && i < hasta;
      if (!c.hidden) i++;
      if (dentro) {
        if (c.hasAttribute("data-fuera")) c.removeAttribute("data-fuera");
        enPagina.push(c);
      } else if (!c.hasAttribute("data-fuera")) {
        c.setAttribute("data-fuera", "");
      }
    });
    cargarTarjetas(grid, enPagina);
    pintarPaginador(plp, grid, p, paginas, por, visibles.length);
  }

  function irAPagina(plp) {
    paginar(plp);
    guardarFiltros(plp, plp.__aplicados || {});
    var toolbar = plp.querySelector(".toolbar") || plp.querySelector(".plp-grid");
    if (!toolbar) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.__homeaScrollA && !reduce) window.__homeaScrollA(toolbar, 24);
    else toolbar.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".plp-paginas [data-pag]");
    if (!b || b.disabled) return;
    var plp = b.closest(".plp");
    if (!plp) return;
    plp.__pagina = parseInt(b.getAttribute("data-pag"), 10) || 1;
    irAPagina(plp);
  });

  /* Cambio de "Mostrar N piezas": página 1, sin mover la vista (la barra ya está a la mano). */
  document.addEventListener("change", function (e) {
    var sel = e.target;
    if (!sel || !sel.matches || !sel.matches(".plp .toolbar select[data-por-pagina]")) return;
    var plp = sel.closest(".plp");
    if (!plp) return;
    plp.__porPagina = parseInt(sel.value, 10) || POR_PAGINA;
    plp.__pagina = 1;
    paginar(plp);
    guardarFiltros(plp, plp.__aplicados || {});
  });

  /* ---------- Orden ---------- */
  function ordenar(select) {
    var plp = select.closest(".plp");
    if (!plp) return;
    var grid = plp.querySelector(".plp-grid");
    var cards = tarjetas(grid);
    if (!cards.length) return;
    /* Opciones (Carla, 2026-10-08): precio mayor→menor (orden inicial del
       servidor), precio menor→mayor, en stock primero, bajo pedido primero.
       Dentro de cada grupo de inventario se conserva el orden por precio. */
    var modo = select.value;
    var precio = function (c) { return parseFloat(c.getAttribute("data-precio")) || 0; };
    var orden = function (c) { return parseInt(c.getAttribute("data-orden"), 10) || 0; };
    var stock = function (c) { return c.getAttribute("data-stock") === "1" ? 1 : 0; };
    cards.sort(function (a, b) {
      if (modo === "precio-asc") return precio(a) - precio(b) || orden(a) - orden(b);
      if (modo === "precio-desc") return precio(b) - precio(a) || orden(a) - orden(b);
      if (modo === "stock-primero") return stock(b) - stock(a) || orden(a) - orden(b);
      if (modo === "pedido-primero") return stock(a) - stock(b) || orden(a) - orden(b);
      return orden(a) - orden(b);
    });
    cards.forEach(function (c) { grid.appendChild(c); });
    plp.__pagina = 1;
    paginar(plp);
  }

  /* Buscador dentro de un grupo ("Busca por marca"): oculta las casillas cuyo
     nombre no contiene lo escrito (sin acentos ni mayúsculas). */
  function sinAcentos(t) { return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function buscarEnGrupo(input) {
    var q = sinAcentos(input.value.trim());
    var grupo = input.closest("[data-fgroup]");
    if (!grupo) return;
    grupo.querySelectorAll(".fopts label:not(.fbuscar)").forEach(function (l) {
      var t = l.querySelector(".flbl");
      l.classList.toggle("no-coincide", !!q && sinAcentos(t ? t.textContent : "").indexOf(q) === -1);
    });
  }

  /* ---------- Ficha: alto del panel de pestañas ----------
     Regla de Carla (2026-10-13): el cuadro greige no se estira hasta donde
     llegan las Características; si la pestaña activa trae poco (dimensiones,
     fichas técnicas), el cuadro termina donde termina "Agregar a mi proyecto"
     de la columna derecha. Se calcula con la geometría real de la página. */
  function ajustarPanelFicha(panel) {
    panel = panel || document.querySelector(".pdp-panel.is-active");
    if (!panel) return;
    var cta = document.querySelector(".pdp .info .pdp-cta");
    panel.style.minHeight = "";
    /* En la ficha v2 las pestañas van a todo lo ancho, debajo de la compra. */
    if (!cta || window.innerWidth <= 1080 || document.querySelector(".pdp--v2")) return;
    var objetivo = cta.getBoundingClientRect().bottom - panel.getBoundingClientRect().top;
    if (objetivo <= 0) return;
    panel.style.minHeight = Math.round(objetivo) + "px";
    /* min-height es de la caja de contenido: se descuenta el relleno que sobró. */
    var sobra = panel.getBoundingClientRect().bottom - cta.getBoundingClientRect().bottom;
    if (sobra > 0 && objetivo - sobra > 0) panel.style.minHeight = Math.round(objetivo - sobra) + "px";
  }
  window.addEventListener("load", function () { ajustarPanelFicha(); });
  window.addEventListener("resize", function () { ajustarPanelFicha(); });
  window.addEventListener("homea:url", function () { setTimeout(function () { ajustarPanelFicha(); }, 0); });
  if (document.readyState === "complete") setTimeout(function () { ajustarPanelFicha(); }, 0);

  /* ---------- Eventos ---------- */
  document.addEventListener("input", function (e) {
    if (e.target && e.target.matches && e.target.matches("[data-fbuscar]")) { buscarEnGrupo(e.target); return; }
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches("[data-cat-precio] input[data-fr]")) desdeSlider(t);
    else if (t.matches("[data-cat-precio] input[data-fp]")) pintarSlider(t.closest("[data-cat-precio]"));
    if (t.matches("[data-cat-precio] input")) {
      var plp = t.closest(".plp");
      if (plp) { badges(plp); barra(plp, tarjetas(plp)); }
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches(".filters input[data-fk], [data-cat-precio] input")) {
      var plp = t.closest(".plp");
      if (plp) { badges(plp); barra(plp, tarjetas(plp)); }
    }
    if (t.matches('.plp .toolbar select[aria-label="Ordenar"]')) {
      ordenar(t);
      var plpO = t.closest(".plp");
      if (plpO) guardarFiltros(plpO, plpO.__aplicados || {});
    }
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var apply = t.closest("[data-cat-apply]");
    if (apply) {
      var plpA = apply.closest(".plp");
      if (plpA) { aplicarMarcado(plpA); enfocarResultados(plpA); }
      return;
    }
    var clear = t.closest("[data-cat-clear]");
    if (clear) {
      var plpC = clear.closest(".plp");
      if (plpC) limpiar(plpC);
      return;
    }
    var chip = t.closest("[data-cat-chip]");
    if (chip) {
      var plpX = chip.closest(".plp");
      if (chip.getAttribute("data-fk") === "precio") {
        plpX.querySelectorAll("[data-cat-precio] input[data-fp]").forEach(function (i) { i.value = ""; });
        plpX.querySelectorAll("[data-cat-precio]").forEach(pintarSlider);
        aplicarMarcado(plpX);
        return;
      }
      var cb = plpX && plpX.querySelector('.filters input[data-fk="' + chip.getAttribute("data-fk") + '"][value="' + chip.getAttribute("data-v") + '"]');
      if (cb) { cb.checked = false; aplicarMarcado(plpX); }
      return;
    }

    var ir = t.closest("a[href]");
    if (ir) { entradaNueva(e, ir); reiniciarSiEsEstaPagina(e, ir); }

    /* tipos.js / PlpFiltro marcan casillas a mano: aplicar después de su clic. */
    if (t.closest("a.subcat[data-tipo], .tpg-card[data-f]")) aplicarLuego();

    /* Ficha: selector de unidades y pestañas. */
    var qb = t.closest("[data-qty-menos], [data-qty-mas]");
    if (qb) {
      var num = qb.parentNode.querySelector("[data-cart-qty]");
      var n = parseInt(num.value, 10) || 1;
      n += qb.hasAttribute("data-qty-mas") ? 1 : -1;
      num.value = Math.min(99, Math.max(1, n));
      return;
    }
    var tab = t.closest(".pdp-tab[data-tab]");
    if (tab) {
      e.preventDefault();
      var caja = tab.closest("[data-pdp-tabs]");
      /* La página no se mueve al cambiar de pestaña (Carla, 2026-10-13): el
         contenedor reserva el alto más grande visto hasta ahora, así el
         documento no se acorta y el scroll no salta; el cuadro greige sí mide
         solo lo de la pestaña activa. */
      if (window.innerWidth > 1080) {
        var reservado = parseFloat(caja.style.minHeight) || 0;
        if (caja.offsetHeight > reservado) caja.style.minHeight = caja.offsetHeight + "px";
      }
      caja.querySelectorAll(".pdp-tab").forEach(function (b) {
        var on = b === tab;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      caja.querySelectorAll(".pdp-panel").forEach(function (pn) {
        var on = pn.id === "panel-" + tab.getAttribute("data-tab");
        pn.classList.toggle("is-active", on);
        pn.hidden = !on;
        if (on) ajustarPanelFicha(pn);
      });
      return;
    }

    /* Galería de la ficha: miniatura → imagen principal. */
    var mini = t.closest(".pdp-thumb");
    if (mini) {
      var img = document.getElementById("pdp-img");
      if (img && img.getAttribute("src") !== mini.getAttribute("data-src")) {
        /* Mientras llega la foto nueva, la actual se atenúa; sin esto parecía
           que el clic no hacía nada hasta que el CDN respondía. */
        img.classList.add("is-loading");
        img.onload = function () { img.classList.remove("is-loading"); };
        img.onerror = img.onload;
        img.src = mini.getAttribute("data-src");
        img.srcset = mini.getAttribute("data-srcset") || "";
        img.alt = mini.getAttribute("data-alt") || img.alt;
        if (img.complete) img.classList.remove("is-loading");
      }
      mini.parentNode.querySelectorAll(".pdp-thumb").forEach(function (b) {
        b.classList.toggle("is-active", b === mini);
      });
      /* Ficha v2: la quinta miniatura ("+N") abre la galería ampliada con todas. */
      /* Después de este clic: si no, el cierre del lightbox (otro listener del
         mismo clic) lo cerraría al instante. */
      if (mini.hasAttribute("data-pdp-mas")) setTimeout(lbAbrir, 0);
      return;
    }

    /* Color de la ficha (acero · SC · CC, Alfresco): cambia el precio visible y
       la variante que se agrega a Mi Proyecto; la foto no cambia (Carla, 2026-10-28). */
    var sw = t.closest(".pdp-swatch");
    if (sw) {
      var info = sw.closest(".info") || document;
      var i = sw.getAttribute("data-color");
      sw.parentNode.querySelectorAll(".pdp-swatch").forEach(function (b) {
        var on = b === sw;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      info.querySelectorAll("[data-color-precio]").forEach(function (pr) {
        pr.hidden = pr.getAttribute("data-color-precio") !== i;
      });
      var nom = info.querySelector("[data-color-nombre]");
      if (nom) nom.textContent = sw.getAttribute("data-nombre");
      var nota = info.querySelector("[data-color-nota]");
      if (nota) nota.textContent = sw.getAttribute("data-nota");
      var add = info.querySelector(".pdp-cta .cart-add");
      if (add) {
        add.setAttribute("data-cart-sku", sw.getAttribute("data-sku"));
        /* Tono de Standard Color: viaja como comentario de la línea del pedido. */
        add.setAttribute("data-cart-tono", sw.getAttribute("data-tono") || "");
        add.setAttribute("data-cart-vid", sw.getAttribute("data-vid"));
        add.setAttribute("data-cart-mxn", sw.getAttribute("data-mxn"));
        add.setAttribute("data-cart-usd", sw.getAttribute("data-usd"));
        var spec = (add.getAttribute("data-cart-spec") || "").split(" · Color: ")[0];
        add.setAttribute("data-cart-spec", spec + (i === "0" ? "" : " · Color: " + sw.getAttribute("data-nombre")));
      }
      var wl = info.querySelector(".pdp-wl");
      if (wl) {
        wl.setAttribute("data-wl-id", sw.getAttribute("data-sku"));
        wl.setAttribute("data-wl-vid", sw.getAttribute("data-vid"));
        wl.setAttribute("data-wl-price", sw.getAttribute("data-usd"));
        wl.setAttribute("data-wl-was", sw.getAttribute("data-was"));
        wl.setAttribute("data-wl-mxn", sw.getAttribute("data-mxn-pub"));
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === "Enter" && t && t.matches && t.matches("[data-cat-precio] input")) {
      e.preventDefault();
      var plp = t.closest(".plp");
      if (plp) { aplicarMarcado(plp); enfocarResultados(plp); }
    }
  });

  /* ---------- Galería de la ficha: flechas y precarga ----------
     Las flechas recorren las miniaturas (clic programático → mismo camino que
     el usuario). Todas las fotos grandes se precargan en cuanto la página
     respira, para que cambiar de foto sea instantáneo (Carla, 2026-10-13). */
  function cambiarFoto(dir) {
    var thumbs = Array.prototype.slice.call(document.querySelectorAll(".pdp-thumb"));
    if (thumbs.length < 2) return;
    var i = thumbs.findIndex(function (b) { return b.classList.contains("is-active"); });
    thumbs[(Math.max(0, i) + dir + thumbs.length) % thumbs.length].click();
  }
  var precargadas = false;
  function precargarGaleria() {
    var thumbs = document.querySelectorAll(".pdp-thumb");
    if (!thumbs.length || precargadas) return;
    precargadas = true;
    var ir = function () {
      thumbs.forEach(function (b) {
        var im = new Image();
        im.sizes = "(max-width: 700px) 100vw, 50vw";
        if (b.getAttribute("data-srcset")) im.srcset = b.getAttribute("data-srcset");
        im.src = b.getAttribute("data-src");
      });
    };
    if (window.requestIdleCallback) requestIdleCallback(ir, { timeout: 1500 }); else setTimeout(ir, 300);
  }
  window.addEventListener("load", precargarGaleria);
  window.addEventListener("homea:url", function () { precargadas = false; setTimeout(precargarGaleria, 0); });
  if (document.readyState === "complete") setTimeout(precargarGaleria, 0);

  /* ---------- Zoom de la ficha: la foto principal abre un lightbox con las miniaturas ---------- */
  var lb = null, lbIdx = 0, lbFotos = [];
  function lbCrear() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox pdp-lightbox";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Imagen ampliada");
    lb.innerHTML = '<button type="button" class="lb-close" data-lb-close aria-label="Cerrar">×</button>' +
      '<button type="button" class="lb-nav lb-prev" data-lb-prev aria-label="Anterior">‹</button>' +
      '<figure class="lb-stage"><img class="lb-img" alt=""><figcaption class="lb-cap"><span class="lb-count figures"></span></figcaption></figure>' +
      '<button type="button" class="lb-nav lb-next" data-lb-next aria-label="Siguiente">›</button>';
    document.body.appendChild(lb);
    return lb;
  }
  function lbPintar() {
    var f = lbFotos[lbIdx];
    if (!f) return;
    var img = lb.querySelector(".lb-img");
    img.src = f.src; img.srcset = f.srcset || ""; img.alt = f.alt || "";
    lb.querySelector(".lb-count").textContent = lbFotos.length > 1 ? (lbIdx + 1) + " / " + lbFotos.length : "";
    lb.querySelector("[data-lb-prev]").hidden = lbFotos.length < 2;
    lb.querySelector("[data-lb-next]").hidden = lbFotos.length < 2;
  }
  function lbAbrir() {
    var main = document.getElementById("pdp-img");
    if (!main) return;
    var thumbs = document.querySelectorAll(".pdp-thumb");
    lbFotos = thumbs.length
      ? Array.prototype.map.call(thumbs, function (b) { return { src: b.getAttribute("data-src"), srcset: b.getAttribute("data-srcset"), alt: b.getAttribute("data-alt") }; })
      : [{ src: main.currentSrc || main.src, srcset: main.srcset, alt: main.alt }];
    lbIdx = Math.max(0, Array.prototype.findIndex.call(thumbs, function (b) { return b.classList.contains("is-active"); }));
    lbCrear();
    lbPintar();
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add("on"); });
    document.documentElement.classList.add("wl-lock");
    lb.querySelector("[data-lb-close]").focus();
  }
  function lbCerrar() {
    if (!lb || lb.hidden) return;
    lb.classList.remove("on");
    document.documentElement.classList.remove("wl-lock");
    setTimeout(function () { lb.hidden = true; }, 260);
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".wl-heart")) return;
    var flecha = t.closest("[data-pdp-prev], [data-pdp-next]");
    if (flecha) { e.preventDefault(); cambiarFoto(flecha.hasAttribute("data-pdp-prev") ? -1 : 1); return; }
    if (t.closest("[data-pdp-zoom]")) { e.preventDefault(); lbAbrir(); return; }
    if (!lb || lb.hidden) return;
    if (t.closest("[data-lb-prev]")) { lbIdx = (lbIdx - 1 + lbFotos.length) % lbFotos.length; lbPintar(); return; }
    if (t.closest("[data-lb-next]")) { lbIdx = (lbIdx + 1) % lbFotos.length; lbPintar(); return; }
    if (t.closest("[data-lb-close]") || !t.closest(".lb-stage")) lbCerrar();
  });
  document.addEventListener("keydown", function (e) {
    var z = e.target && e.target.closest && e.target.closest("[data-pdp-zoom]");
    if (z && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); lbAbrir(); return; }
    if (!lb || lb.hidden) return;
    if (e.key === "Escape") lbCerrar();
    if (e.key === "ArrowLeft" && lbFotos.length > 1) { lbIdx = (lbIdx - 1 + lbFotos.length) % lbFotos.length; lbPintar(); }
    if (e.key === "ArrowRight" && lbFotos.length > 1) { lbIdx = (lbIdx + 1) % lbFotos.length; lbPintar(); }
  });

  document.addEventListener("catalogo:aplicar", aplicarLuego);
  window.addEventListener("popstate", aplicarLuego);

  /* Filtros desde la URL: ?filtro=<clave>:<valor> (repetible). Es el destino del
     botón de las fichas de Guías ("Ver … en catálogo"): la página llega con la
     casilla de ese filtro ya marcada (Carla, 2026-10-19). Una vez por URL. */
  var urlFiltrada = null;
  function filtrosDeUrl() {
    if (location.search.indexOf("filtro=") < 0) return;
    var clave = location.pathname + location.search;
    if (urlFiltrada === clave) return;
    var marcado = false;
    new URLSearchParams(location.search).getAll("filtro").forEach(function (par) {
      var i = par.indexOf(":");
      if (i < 1) return;
      var sel = '.plp .filters input[data-fk="' + par.slice(0, i) + '"][value="' + par.slice(i + 1) + '"]';
      document.querySelectorAll(sel).forEach(function (cb) { cb.checked = true; marcado = true; });
    });
    if (marcado) { urlFiltrada = clave; aplicarLuego(); }
  }

  /* Carga directa y navegaciones SPA: aplicar cuando aparezca un catálogo nuevo. */
  var visto = null;
  function revisar() {
    filtrosDeUrl();
    var grid = document.querySelector("[data-cat-card]");
    if (grid && grid !== visto) {
      visto = grid;
      document.querySelectorAll("[data-cat-precio]").forEach(pintarSlider);
      /* Antes que el scroll guardado (PreviewRouter lo repite a los 80 ms): la
         página vuelve con su altura filtrada y al mismo punto. */
      document.querySelectorAll(".plp").forEach(restaurarFiltros);
      aplicarLuego();
    }
  }
  window.addEventListener("homea:url", revisarRuta);
  window.addEventListener("popstate", revisarRuta);
  revisarRuta();
  new MutationObserver(revisar).observe(document.documentElement, { childList: true, subtree: true });
  revisar();
  /* Colores en la tarjeta (Carla 2026-11-03, todas las marcas; círculos de
     lib/shopify/htmlCatalogo.ts). Cada color es su propia tarjeta en la rejilla.
     · Cursor sobre otro círculo: la foto cambia a la de ese color y vuelve al salir.
     · Clic en el círculo: la tarjeta se queda con ese color (foto, cuerpo y enlace
       de la tarjeta hermana, tal como se pintó), sin salir de la página.
     · Clic en el resto de la tarjeta: abre la ficha del color que muestra.
     El clic va en captura para ganarle al <a> de la tarjeta y a PreviewRouter. */
  function originalDe(card) {
    if (!card.__colorOrig) {
      card.__colorOrig = {
        href: card.getAttribute("href"),
        accion: card.getAttribute("data-accion"),
        imgw: card.querySelector(".imgw").cloneNode(true),
        body: card.querySelector(".body").cloneNode(true)
      };
    }
    return card.__colorOrig;
  }
  /* Hermanas de color que no están en la página (wishlist, relacionados de la
     ficha): una tarjeta fuera del documento que se llena por SKU cuando hace falta. */
  var hermanasSueltas = {};
  function hermanaDe(card, sku) {
    var rejilla = card.closest(".plp-grid") || document;
    var h = rejilla.querySelector('[data-cat-card][data-sku="' + sku + '"]') ||
      document.querySelector('[data-cat-card][data-sku="' + sku + '"]');
    if (h) return h;
    if (!hermanasSueltas[sku]) {
      var a = document.createElement("a");
      a.className = "pcard pcard-vacia";
      a.setAttribute("data-cat-card", "");
      a.setAttribute("data-sku", sku);
      hermanasSueltas[sku] = a;
    }
    return hermanasSueltas[sku];
  }
  function fotoDe(card, sku) {
    var h = hermanaDe(card, sku);
    /* Hermana aún vacía (otra página): se pide su tarjeta; la vista previa sale
       en cuanto llegue si el cursor sigue ahí. */
    if (h && h.classList.contains("pcard-vacia")) {
      cargarTarjetas(card.closest(".plp-grid"), [h]).then(function () {
        var c = card.querySelector('.pcard-color[data-color-sku="' + sku + '"]');
        if (c && c.matches(":hover, :focus-visible")) previa(c);
      });
      return null;
    }
    var img = h && originalDe(h).imgw.querySelector("img");
    if (!img) return null;
    var copia = img.cloneNode(true);
    copia.removeAttribute("loading");
    return copia;
  }
  /* Vista previa: la foto del color sin fijarlo (cursor encima o foco de teclado). */
  function previa(c) {
    if (c.classList.contains("is-active")) return;
    var card = c.closest("[data-cat-card]");
    var actual = card && card.querySelector(".imgw img");
    var nueva = actual && fotoDe(card, c.getAttribute("data-color-sku"));
    if (!nueva) return;
    /* Su estado original se guarda ANTES de cambiarle la foto: si se guardaba
       después (al hacer clic), recordaba la foto de la vista previa y al volver a
       su color se quedaba con la del otro (Carla, 2026-11-05). */
    if (!card.__fotoFija) { originalDe(card); card.__fotoFija = actual; }
    actual.replaceWith(nueva);
  }
  function quitarPrevia(card) {
    if (!card || !card.__fotoFija) return;
    var img = card.querySelector(".imgw img");
    if (img) img.replaceWith(card.__fotoFija);
    card.__fotoFija = null;
  }
  /* La tarjeta se queda con el color del círculo. Con teclado, el foco pasa al
     círculo marcado de la tarjeta nueva (el cuerpo se reemplaza entero). */
  function aplicarColor(c, teclado) {
    if (c.classList.contains("is-active")) return;
    var card = c.closest("[data-cat-card]");
    var sku = c.getAttribute("data-color-sku");
    var h = card && hermanaDe(card, sku);
    if (!h) return;
    // Hermana aún vacía: primero se pide su tarjeta y luego se aplica el color.
    if (h.classList.contains("pcard-vacia")) {
      cargarTarjetas(card.closest(".plp-grid"), [h]).then(function () {
        if (!h.classList.contains("pcard-vacia")) aplicarColor(c, teclado);
      });
      return;
    }
    var o = originalDe(h);
    quitarPrevia(card); // la tarjeta vuelve a su foto antes de guardar su estado
    originalDe(card);
    card.__fotoFija = null;
    card.querySelector(".imgw").replaceWith(o.imgw.cloneNode(true));
    card.querySelector(".body").replaceWith(o.body.cloneNode(true));
    card.setAttribute("href", o.href);
    if (o.accion) card.setAttribute("data-accion", o.accion);
    if (teclado) {
      var marcado = card.querySelector('.pcard-color[data-color-sku="' + sku + '"]');
      if (marcado) marcado.focus();
    }
  }
  function circuloDe(e) {
    return e.target && e.target.closest && e.target.closest(".pcard-color");
  }
  document.addEventListener("mouseover", function (e) {
    var c = circuloDe(e);
    if (c) previa(c);
  });
  document.addEventListener("mouseout", function (e) {
    var fila = e.target && e.target.closest && e.target.closest(".pcard-colores");
    if (!fila || (e.relatedTarget && fila.contains(e.relatedTarget))) return;
    quitarPrevia(fila.closest("[data-cat-card]"));
  });
  document.addEventListener("focusin", function (e) {
    var c = circuloDe(e);
    if (c && c.matches(":focus-visible")) previa(c);
  });
  document.addEventListener("focusout", function (e) {
    var fila = e.target && e.target.closest && e.target.closest(".pcard-colores");
    if (!fila || (e.relatedTarget && fila.contains(e.relatedTarget))) return;
    quitarPrevia(fila.closest("[data-cat-card]"));
  });
  document.addEventListener("click", function (e) {
    var c = circuloDe(e);
    if (!c) return;
    e.preventDefault();
    aplicarColor(c, false);
  }, true);
  /* Cuántos círculos caben (Carla, 2026-11-03): todos los que entren en el ancho
     de la fila sin salirse de los márgenes de la tarjeta; si no caben todos, el
     último lugar es "+N". El de la tarjeta siempre queda a la vista. Se recalcula
     cuando la fila cambia de ancho (ventana, filtros que la muestran, color nuevo). */
  var PASO_COLOR = 28; // círculo de 24px + 4px de separación
  var ANCHO_MAS = 34; // "+N": 4px de separación + 4px de margen + 26px fijos en CSS (.pcard-colores-mas)
  /* Sin leer el layout aquí dentro: el ancho llega de ResizeObserver
     (contentRect). Leer clientWidth/offsetWidth después de esconder círculos de
     la fila anterior obligaba a recalcular la página entera por cada fila: con
     ~650 filas y 1,800 tarjetas, Cocina y Bar se trababa ~45 s (2026-11-04). */
  function ajustarColores(fila, ancho) {
    if (!ancho) return;
    var circ = fila.querySelectorAll(".pcard-color");
    var mas = fila.querySelector(".pcard-colores-mas");
    var n = circ.length;
    if (!mas || !n) return;
    var k = Math.floor((ancho + 4) / PASO_COLOR);
    if (k < n) k = Math.max(1, Math.floor((ancho - ANCHO_MAS + 4) / PASO_COLOR)); // 28k − 4 + 34 ≤ ancho
    k = Math.min(k, n);
    if (fila.__colK === k) return; // ya está así: no se toca el DOM
    fila.__colK = k;
    var activo = -1;
    for (var i = 0; i < n; i++) {
      circ[i].hidden = i >= k;
      if (circ[i].classList.contains("is-active")) activo = i;
    }
    if (activo >= k) { circ[k - 1].hidden = true; circ[activo].hidden = false; }
    mas.hidden = k >= n;
    mas.textContent = "+" + (n - k);
  }
  var filasVistas = typeof WeakSet === "function" ? new WeakSet() : null;
  var medidor = typeof ResizeObserver === "function"
    ? new ResizeObserver(function (entradas) {
        entradas.forEach(function (en) { ajustarColores(en.target, en.contentRect.width); });
      })
    : null;
  var buscarFilas = 0;
  function vigilarFilas() {
    buscarFilas = 0;
    /* Tarjetas ligeras (las pinta wishlist.js con lo guardado en el corazón): se
       cambian por la tarjeta completa del catálogo, con "+" y círculos. */
    var ligeras = Array.prototype.slice.call(document.querySelectorAll(".pcard-ligera:not([data-fuera])"))
      .filter(function (c) { return !c.__cargando && !c.__sinTarjeta; });
    if (ligeras.length) cargarTarjetas(ligeras[0].closest(".plp-grid"), ligeras);
    document.querySelectorAll(".pcard-colores").forEach(function (fila) {
      if (filasVistas && filasVistas.has(fila)) return;
      if (filasVistas) filasVistas.add(fila);
      if (medidor) medidor.observe(fila); else ajustarColores(fila, fila.clientWidth);
    });
  }
  new MutationObserver(function () {
    if (!buscarFilas) buscarFilas = requestAnimationFrame(vigilarFilas);
  }).observe(document.documentElement, { childList: true, subtree: true });
  vigilarFilas();
  document.addEventListener("keydown", function (e) {
    var c = circuloDe(e);
    if (!c || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    e.stopPropagation();
    aplicarColor(c, true);
  }, true);

  /* Título completo al pasar el mouse (Carla, 2026-11-06): el nombre de la
     tarjeta se corta a dos renglones; si está cortado, sale entero en una
     etiqueta blanca como la de "Agregar a mi proyecto". Una sola etiqueta
     flotante en el <body>: el título recorta lo que lleva dentro.
     Vale para TODA tarjeta de producto, vieja o nueva: la del catálogo
     (.pcard), los resultados del buscador (.bsc-nombre), Mi proyecto
     (.proy-peek-name) y la wishlist (.wl-name). Una tarjeta nueva entra sola si
     su título usa una de esas clases o lleva el atributo data-titulo-completo. */
  var TITULOS = ".pcard h3, .pcard .pcard-name, .bsc-nombre, .proy-peek-name, .wl-name, [data-titulo-completo]";
  var cortado = function (h) { return h.scrollHeight > h.clientHeight + 1 || h.scrollWidth > h.clientWidth + 1; };
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    var tipTitulo = null, tipEspera = 0, tipDe = null;
    var quitarTip = function () {
      clearTimeout(tipEspera);
      tipDe = null;
      if (tipTitulo) tipTitulo.classList.remove("is-on");
    };
    document.addEventListener("mouseover", function (e) {
      var h = e.target && e.target.closest && e.target.closest(TITULOS);
      if (h === tipDe) return;
      quitarTip();
      if (!h || !cortado(h)) return;
      tipDe = h;
      tipEspera = setTimeout(function () {
        if (tipDe !== h || !h.isConnected) return;
        if (!tipTitulo) {
          tipTitulo = document.createElement("div");
          tipTitulo.className = "pcard-tip-titulo";
          tipTitulo.setAttribute("role", "tooltip");
          document.body.appendChild(tipTitulo);
        }
        tipTitulo.textContent = (h.getAttribute("data-titulo-completo") || h.textContent).replace(/\s+/g, " ").trim();
        var r = h.getBoundingClientRect();
        tipTitulo.style.maxWidth = Math.max(220, r.width + 24) + "px";
        tipTitulo.style.left = Math.max(8, r.left - 12) + "px";
        tipTitulo.style.top = "0px";
        var alto = tipTitulo.offsetHeight;
        // Arriba del título; si no cabe, abajo.
        var arriba = r.top - alto - 8;
        tipTitulo.style.top = (arriba > 8 ? arriba : r.bottom + 8) + "px";
        tipTitulo.classList.add("is-on");
      }, 250);
    });
    window.addEventListener("scroll", quitarTip, { passive: true });
  }
})();
