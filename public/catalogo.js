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
    var g = plp.querySelector('.filters [data-fgroup="' + clave + '"] h6');
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
      if (l) l.classList.toggle("is-cero", n === 0 && !cb.checked);
    });
  }

  /* Badge "n" en el título de cada grupo (visible aunque esté plegado). */
  function badges(plp) {
    plp.querySelectorAll(".filters [data-fgroup]").forEach(function (g) {
      var n = g.querySelectorAll("input[data-fk]:checked").length;
      if (g.getAttribute("data-fgroup") === "precio") n = rangoPrecio(g.closest(".plp")) ? 1 : 0;
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
        html += '<button type="button" class="fchip" data-cat-chip data-fk="' + k + '" data-v="' + v + '">' +
          (grupo ? '<span class="fchip-g">' + grupo + '</span>' : "") +
          '<span class="fchip-v">' + etiquetaDe(cb) + '</span><span class="fchip-x" aria-hidden="true">×</span>' +
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
      var base = filtrado
        ? visibles + " de " + cards.length + " piezas"
        : visibles + (visibles === 1 ? " pieza en línea" : " piezas en línea");
      r.setAttribute("data-base", base);
      r.textContent = base;
    }
    var vacio = plp.querySelector("[data-cat-vacio]");
    if (vacio) vacio.hidden = visibles > 0;

    recontar(plp, cards, activos);
    badges(plp);
    chips(plp, activos);
    barra(plp, cards);
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
    var nav = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 80;
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

  /* ---------- Orden ---------- */
  function ordenar(select) {
    var plp = select.closest(".plp");
    if (!plp) return;
    var grid = plp.querySelector(".plp-grid");
    var cards = tarjetas(grid);
    if (!cards.length) return;
    var modo = select.value || select.options[select.selectedIndex].text;
    var precio = function (c) { return parseFloat(c.getAttribute("data-precio")) || 0; };
    var orden = function (c) { return parseInt(c.getAttribute("data-orden"), 10) || 0; };
    cards.sort(function (a, b) {
      if (/↑/.test(modo)) return precio(a) - precio(b);
      if (/↓/.test(modo)) return precio(b) - precio(a);
      return orden(a) - orden(b);
    });
    var quote = grid.querySelector("[data-cat-quote]");
    cards.forEach(function (c) { grid.appendChild(c); });
    /* La tarjeta de lead vuelve a quedar después de la quinta pieza VISIBLE. */
    if (quote) {
      var vis = cards.filter(function (c) { return !c.hidden; });
      grid.insertBefore(quote, vis[Math.min(5, vis.length)] || null);
    }
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("input", function (e) {
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
    if (t.matches('.plp .toolbar select[aria-label="Ordenar"]')) ordenar(t);
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

    /* tipos.js / PlpFiltro marcan casillas a mano: aplicar después de su clic. */
    if (t.closest("a.subcat[data-tipo], .tpg-card[data-f]")) aplicarLuego();

    /* Galería de la ficha: miniatura → imagen principal. */
    var mini = t.closest(".pdp-thumb");
    if (mini) {
      var img = document.getElementById("pdp-img");
      if (img) {
        img.src = mini.getAttribute("data-src");
        img.srcset = mini.getAttribute("data-srcset") || "";
        img.alt = mini.getAttribute("data-alt") || img.alt;
      }
      mini.parentNode.querySelectorAll(".pdp-thumb").forEach(function (b) {
        b.classList.toggle("is-active", b === mini);
      });
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

  /* Carga directa y navegaciones SPA: aplicar cuando aparezca un catálogo nuevo. */
  var visto = null;
  function revisar() {
    var grid = document.querySelector("[data-cat-card]");
    if (grid && grid !== visto) {
      visto = grid;
      document.querySelectorAll("[data-cat-precio]").forEach(pintarSlider);
      aplicarLuego();
    }
  }
  new MutationObserver(revisar).observe(document.documentElement, { childList: true, subtree: true });
  revisar();
})();
