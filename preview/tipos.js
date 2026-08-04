/* HOMEA v2 — tipos.js
   Filtro de "tipo" del riel de subcategorías (subcat.1) y su coreografía de
   scroll. Reglas de producto:

   1. Tile que lleva a una subcategoría CON página propia (href = ruta) →
      navegación normal. Tile que sólo filtra (href="?tipo=…") → el usuario se
      queda en la misma página; jamás se recarga.
   2. Elegir un tipo → la página baja despacio al catálogo (antes el href
      relativo provocaba recarga completa y el viewport saltaba al hero).
   3. Quitar el tipo (clic en el que ya está activo) → NO se mueve nada.
   4. Llegar con ?tipo=… (mega-menú o enlace compartido) → la banda entra en
      cuadro y el riel desliza hasta la tarjeta, aunque esté hasta el final.

   Va en un archivo aparte, con listeners DELEGADOS en document, porque el
   markup viene del preview estático y <main> se reemplaza en cada navegación
   SPA de Next (ver components/PreviewRouter). Archivo idéntico en preview/ y
   public/, igual que wishlist.js y cart.js. */
(function () {
  "use strict";

  var DUR = 900; // recorrido lento a propósito: se tiene que VER qué cambió
  var STRIP = "#subcatStrip";

  function reduce() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- Animador de scroll (uno por eje) ----------
     scrollIntoView({behavior:"smooth"}) va a la velocidad del navegador y no se
     puede alargar. Además `html { scroll-behavior: smooth }` (theme.css) haría
     que cada fotograma nuestro se volviera a suavizar, así que el scroll de
     página se escribe con behavior:"instant" y el easing lo ponemos aquí. */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function makeAnim() {
    var raf = null;
    return {
      stop: function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      },
      run: function (get, set, destino, ms) {
        this.stop();
        var desde = get();
        if (!ms || reduce() || Math.abs(destino - desde) < 1) { set(destino); return; }
        var t0 = null;
        var paso = function (now) {
          if (t0 === null) { t0 = now; }
          var p = Math.min(1, (now - t0) / ms);
          set(desde + (destino - desde) * easeInOut(p));
          raf = p < 1 ? requestAnimationFrame(paso) : null;
        };
        raf = requestAnimationFrame(paso);
      }
    };
  }

  var vAnim = makeAnim(); // scroll de página
  var hAnim = makeAnim(); // scroll del riel

  /* El usuario manda: cualquier gesto propio cancela la animación en curso. */
  ["wheel", "touchstart", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function () { vAnim.stop(); }, { passive: true });
  });
  /* Capture: hay que ganarle al drag-to-scroll del riel (v2.js), que escribe
     scrollLeft a mano y pelearía con la animación. */
  document.addEventListener("pointerdown", function (e) {
    if (e.target && e.target.closest && e.target.closest(".subcat-strip")) { hAnim.stop(); }
  }, true);

  /* ---------- DOM ---------- */
  function strip() { return document.querySelector(STRIP); }

  function tiles() {
    return Array.prototype.slice.call(document.querySelectorAll("a.subcat[data-tipo]"));
  }

  /* El nav es sticky: sin descontarlo, la sección queda debajo de la barra. */
  function navH() {
    var n = document.querySelector(".site-nav");
    return n ? Math.round(n.getBoundingClientRect().height) : 0;
  }

  function etiqueta(slug) {
    var el = document.querySelector('a.subcat[data-tipo="' + slug + '"] .lbl');
    return el ? el.textContent.trim() : "";
  }

  /* ---------- Estado visible del filtro ---------- */
  function pintar(slug) {
    tiles().forEach(function (a) {
      var on = a.getAttribute("data-tipo") === slug;
      a.classList.toggle("is-active", on);
      if (on) { a.setAttribute("aria-current", "true"); }
      else { a.removeAttribute("aria-current"); }
    });
    document.querySelectorAll("label[data-tipo]").forEach(function (l) {
      var cb = l.querySelector('input[type="checkbox"]');
      if (cb) { cb.checked = l.getAttribute("data-tipo") === slug; }
    });
    var r = document.getElementById("plpResults");
    if (!r) return;
    /* El conteo base se guarda una vez en el nodo: así al cambiar de tipo no se
       encadenan sufijos " · tipo: …" uno tras otro. */
    if (!r.hasAttribute("data-base")) {
      r.setAttribute("data-base", r.textContent.replace(/\s+·\s+tipo:.*$/, "").trim());
    }
    var base = r.getAttribute("data-base");
    r.textContent = slug ? base + " · tipo: " + etiqueta(slug) : base;
  }

  /* ---------- Revelar la tarjeta dentro del riel ---------- */
  function revelar(slug, ms) {
    var s = strip();
    if (!s) return;
    var a = s.querySelector('a.subcat[data-tipo="' + slug + '"]');
    if (!a) return;
    var max = s.scrollWidth - s.clientWidth;
    if (max <= 1) return; // el riel cabe entero: no hay nada que revelar
    var sr = s.getBoundingClientRect();
    var ar = a.getBoundingClientRect();
    /* Centrada en el riel; en los extremos el clamp la deja pegada al borde. */
    var destino = s.scrollLeft + (ar.left - sr.left) - (sr.width - ar.width) / 2;
    destino = Math.max(0, Math.min(max, destino));
    if (Math.abs(destino - s.scrollLeft) < 2) return;
    hAnim.run(
      function () { return s.scrollLeft; },
      function (v) { s.scrollLeft = v; },
      destino,
      ms
    );
  }

  /* ---------- Scroll vertical a una sección ---------- */
  function bajarA(el, ms, aire) {
    if (!el) return;
    var tope = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var y = window.scrollY + el.getBoundingClientRect().top - navH() - (aire || 0);
    y = Math.max(0, Math.min(tope, y));
    if (Math.abs(y - window.scrollY) < 2) return;
    vAnim.run(
      function () { return window.scrollY; },
      function (v) { window.scrollTo({ top: v, behavior: "instant" }); },
      y,
      ms
    );
  }

  /* ---------- URL, sin navegar ----------
     replaceState y no pushState: cambiar de tipo no debe llenar el historial ni
     pelearse con el estado que guarda el router de Next. La URL sigue siendo
     compartible y "atrás" devuelve a la página anterior, no al filtro previo. */
  var propio = false;

  function urlTipo(slug) {
    var u = new URL(location.href);
    if (slug) { u.searchParams.set("tipo", slug); }
    else { u.searchParams.delete("tipo"); }
    propio = true;
    try { history.replaceState(history.state, "", u.pathname + u.search + u.hash); }
    catch (e) {}
    propio = false;
  }

  function tipoUrl() {
    return new URLSearchParams(location.search).get("tipo");
  }

  /* ---------- Aviso de cambio de URL ----------
     El router de Next navega con history.pushState y no emite ningún evento.
     Sin esto, entrar desde el mega-menú a la MISMA página con otro ?tipo no se
     notaría: <main> no siempre se vuelve a renderizar. */
  function parchar(nombre) {
    var orig = history[nombre];
    if (typeof orig !== "function" || orig.__homea) return;
    var wrap = function () {
      var r = orig.apply(this, arguments);
      if (!propio) { window.dispatchEvent(new Event("homea:url")); }
      return r;
    };
    wrap.__homea = true;
    history[nombre] = wrap;
  }
  parchar("pushState");
  parchar("replaceState");

  /* ---------- Sincronización ----------
     "deep"   → llegada con ?tipo: la banda entra en cuadro y el riel desliza.
     "quieto" → sólo pintar y colocar el riel sin animación (atrás/adelante). */
  var ultimoTipo = null;
  var ultimoStrip = null;

  function sincronizar(modo) {
    var s = strip();
    if (!s || !s.querySelector("a.subcat[data-tipo]")) {
      ultimoStrip = null; ultimoTipo = null;
      return;
    }
    var slug = tipoUrl();
    pintar(slug);
    ultimoStrip = s;
    ultimoTipo = slug;
    if (!slug) return;
    if (modo !== "deep") { revelar(slug, 0); return; }

    var banda = s.closest(".subcat-band") || s;
    /* Un respiro antes de movernos: el router de Next sube al inicio al navegar
       y nuestra animación se pisaría con ese salto. */
    setTimeout(function () {
      if (strip() !== s) return; // la página cambió otra vez mientras esperábamos
      var r = banda.getBoundingClientRect();
      var enCuadro = r.top >= navH() - 1 && r.bottom <= window.innerHeight + 1;
      if (!enCuadro) { bajarA(banda, DUR, 12); }
      /* El riel arranca a media bajada: la tarjeta "aparece" mientras la banda
         termina de acomodarse, en vez de ser dos movimientos separados. */
      setTimeout(function () { revelar(slug, DUR); }, enCuadro ? 120 : DUR * 0.5);
    }, 180);
  }

  /* Un solo disparo aunque lleguen a la vez el cambio de URL y el re-render. */
  var pend = null;
  function agendar(modo) {
    clearTimeout(pend);
    pend = setTimeout(function () { sincronizar(modo); }, 60);
  }

  /* ---------- Clic en una tarjeta del riel ---------- */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    var a = t && t.closest ? t.closest("a.subcat[data-tipo]") : null;
    if (!a) return;
    /* Sólo intercepta el tile que filtra en esta misma página. El que lleva a
       una subcategoría con página propia navega como cualquier enlace. */
    if (!/^\?tipo=/.test(a.getAttribute("href") || "")) return;
    e.preventDefault();
    var slug = a.getAttribute("data-tipo");

    if (a.classList.contains("is-active")) {
      /* Quitar el filtro: NADA se mueve, ni la página ni el riel. */
      pintar(null);
      urlTipo(null);
      ultimoTipo = null;
      return;
    }
    pintar(slug);
    urlTipo(slug);
    ultimoTipo = slug;
    bajarA(document.querySelector(".plp"), DUR, 20);
  });

  /* ---------- Cambios de URL y de DOM ---------- */
  window.addEventListener("homea:url", function () {
    if (tipoUrl() === ultimoTipo && strip() === ultimoStrip) return;
    agendar("deep");
  });
  window.addEventListener("popstate", function () { agendar("quieto"); });

  /* Navegación SPA: React reemplaza los hijos de <main> y con ellos el riel. */
  var mo = new MutationObserver(function () {
    if (strip() === ultimoStrip) return; // el riel no cambió: nada que resincronizar
    agendar(tipoUrl() ? "deep" : "quieto");
  });

  /* Compartido con ScrollAFiltros (mosaico de subcat.3): las dos superficies
     bajan al catálogo con el mismo recorrido, la misma duración y el mismo
     descuento del nav sticky. Sin esto, elegir un tipo en el riel y elegirlo en
     el mosaico se sienten como dos interacciones distintas. */
  window.__homeaScrollA = function (el, aire) { bajarA(el, DUR, aire || 0); };

  function init() {
    mo.observe(document.querySelector("main") || document.body, { childList: true });
    sincronizar(tipoUrl() ? "deep" : "quieto");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
