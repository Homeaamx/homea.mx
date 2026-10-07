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

  /* Estado pendiente: lo que está marcado ahora mismo. */
  function pendientes(plp) {
    var activos = {};
    casillas(plp).forEach(function (cb) {
      if (!cb.checked) return;
      var k = cb.getAttribute("data-fk");
      (activos[k] = activos[k] || []).push(cb.value);
    });
    return activos;
  }

  function coincide(card, clave, valores) {
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
      var b = g.querySelector("[data-fsel]");
      if (!b) return;
      if (b.textContent !== String(n)) b.textContent = String(n);
      if (b.hidden !== (n === 0)) b.hidden = n === 0;
    });
  }

  function chips(plp, activos) {
    var caja = plp.querySelector("[data-cat-chips]");
    var toolbar = plp.querySelector(".toolbar");
    if (!caja) {
      if (!toolbar) return;
      caja = document.createElement("div");
      caja.className = "fchips";
      caja.setAttribute("data-cat-chips", "");
      toolbar.parentNode.insertBefore(caja, toolbar.nextSibling);
    }
    var html = "";
    var total = 0;
    Object.keys(activos).forEach(function (k) {
      activos[k].forEach(function (v) {
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
    if (total > 1) {
      html += '<button type="button" class="fchip fchip--all" data-cat-clear>Limpiar todo</button>';
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
    bar.classList.toggle("is-pendiente", cambio);
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
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches(".filters input[data-fk]")) {
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

  document.addEventListener("catalogo:aplicar", aplicarLuego);
  window.addEventListener("popstate", aplicarLuego);

  /* Carga directa y navegaciones SPA: aplicar cuando aparezca un catálogo nuevo. */
  var visto = null;
  function revisar() {
    var grid = document.querySelector("[data-cat-card]");
    if (grid && grid !== visto) { visto = grid; aplicarLuego(); }
  }
  new MutationObserver(revisar).observe(document.documentElement, { childList: true, subtree: true });
  revisar();
})();
