/* HOMEA v2 — catalogo.js
   Filtros, orden y galería del catálogo vivo (tarjetas que genera
   lib/shopify/htmlCatalogo.ts con datos de Shopify).

   · Cada tarjeta trae sus valores en data-fv-<clave> (slugs separados por
     espacio) y su tipo en data-tipo. Cada casilla del panel trae data-fk y value.
   · Dentro de un grupo las casillas suman (O); entre grupos se cruzan (Y).
   · El tipo del riel (?tipo=, tipos.js) y el mosaico de la PLP (?f=, PlpFiltro)
     marcan sus casillas sin disparar "change": por eso se recalcula también
     después de esos clics y con el evento "catalogo:aplicar".

   Listeners DELEGADOS en document, igual que tipos.js y wishlist.js: <main> se
   reemplaza en cada navegación SPA de Next (components/PreviewRouter). */
(function () {
  "use strict";

  function tarjetas(raiz) {
    return Array.prototype.slice.call(raiz.querySelectorAll("[data-cat-card]"));
  }

  function grupos(raiz) {
    var activos = {};
    raiz.querySelectorAll(".filters input[data-fk]:checked").forEach(function (cb) {
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

  function aplicar() {
    document.querySelectorAll(".plp").forEach(function (plp) {
      var cards = tarjetas(plp);
      if (!cards.length) return;
      var activos = grupos(plp);
      var visibles = 0;
      cards.forEach(function (card) {
        var ok = Object.keys(activos).every(function (k) { return coincide(card, k, activos[k]); });
        card.hidden = !ok;
        if (ok) visibles++;
      });

      var r = plp.querySelector(".toolbar .results");
      if (r) {
        var base = visibles + (visibles === 1 ? " pieza en línea" : " piezas en línea");
        r.setAttribute("data-base", base);
        var tipo = plp.querySelector('.filters label[data-tipo] input:checked');
        var etiqueta = tipo ? tipo.parentNode.textContent.replace(/\s*\d+\s*$/, "").trim() : "";
        r.textContent = etiqueta ? base + " · tipo: " + etiqueta : base;
      }
      var vacio = plp.querySelector("[data-cat-vacio]");
      if (vacio) vacio.hidden = visibles > 0;
    });
  }

  var pendiente = null;
  function aplicarLuego() {
    if (pendiente) return;
    pendiente = setTimeout(function () { pendiente = null; aplicar(); }, 0);
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
    if (quote) grid.insertBefore(quote, cards[Math.min(5, cards.length)] || null);
  }

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.matches && t.matches(".filters input[data-fk]")) aplicar();
    if (t && t.matches && t.matches('.plp .toolbar select[aria-label="Ordenar"]')) ordenar(t);
  });

  /* tipos.js / PlpFiltro marcan casillas a mano: recalcular después de su clic. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("a.subcat[data-tipo], .tpg-card[data-f], label[data-tipo]")) aplicarLuego();

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
