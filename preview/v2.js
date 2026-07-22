/* HOMEA preview · v2 — interacciones contenidas.
   Nav scroll · hero rotativo · reveals on-scroll · tabs. */
(function () {
  "use strict";

  /* ---------- Nav: claro → oscuro al hacer scroll ---------- */
  var nav = document.querySelector(".site-nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Reveals: una vez, al entrar al viewport ---------- */
  if ("IntersectionObserver" in window) {
    var reveal = function (el, obs) { el.classList.add("in"); obs.unobserve(el); };
    /* General: aparece un poco antes de entrar para no dejar huecos en blanco. */
    var ioEarly = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target, ioEarly); } });
    }, { threshold: 0, rootMargin: "0px 0px 20% 0px" });
    document.querySelectorAll(".reveal:not(.cat-grid), .reveal-img").forEach(function (el) { ioEarly.observe(el); });
    /* Categorías: animan justo al entrar en pantalla para que el reveal se vea al hacer scroll. */
    var ioInView = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target, ioInView); } });
    }, { threshold: 0 });
    document.querySelectorAll(".cat-grid.reveal").forEach(function (el) { ioInView.observe(el); });
  } else {
    document.querySelectorAll(".reveal, .reveal-img").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero rotativo: 5 mensajes sincronizados ---------- */
  var hero = document.querySelector(".hero[data-rotate]");
  if (hero) {
    var DUR = 10000; /* 10 s por slide — debe coincidir con barFill en theme.css */
    var msgs = JSON.parse(hero.querySelector("#hero-data").textContent);
    var N = msgs.length;
    var msgBox = hero.querySelector(".hero-msg");
    var eyebrowEl = msgBox.querySelector(".eyebrow");
    var titleEl = msgBox.querySelector("h1");
    var subEl = msgBox.querySelector(".sub");
    var idxEl = hero.querySelector(".hero-prog .idx");
    var bars = Array.prototype.slice.call(hero.querySelectorAll(".hero-bars button"));
    var imgs = Array.prototype.slice.call(hero.querySelectorAll(".hero-visual .hi"));
    var ctaLinks = hero.querySelectorAll(".hero-ctas a");
    var btnP = ctaLinks[0] || null;
    var btnS = ctaLinks[1] || null;
    var idx = 0, timer = null;

    /* Asigna href y, si el destino es externo (http/https), lo abre en nueva pestaña. */
    function setCtaLink(el, url) {
      el.setAttribute("href", url);
      if (/^https?:\/\//i.test(url)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
      else { el.removeAttribute("target"); el.removeAttribute("rel"); }
    }

    /* Alinea el CTA flotante "Contáctanos" a la MISMA altura que los botones del
       hero. Como el copy está centrado verticalmente y el H1 cambia de líneas por
       slide, se recalcula en cada render y al redimensionar. */
    var ctaFloat = hero.querySelector(".cta-float");
    var heroCtasRow = hero.querySelector(".hero-ctas");
    function alignCtaFloat() {
      if (!ctaFloat || !heroCtasRow) { return; }
      var hb = hero.getBoundingClientRect();
      var cb = heroCtasRow.getBoundingClientRect();
      var centerY = (cb.top - hb.top) + cb.height / 2;
      ctaFloat.style.top = (centerY - ctaFloat.offsetHeight / 2) + "px";
      ctaFloat.style.bottom = "auto";
    }

    function render(i) {
      idx = (i + N) % N;
      var m = msgs[idx];
      /* Replay del rise: quitar clase, forzar reflow, volver a poner */
      msgBox.classList.remove("run");
      void msgBox.offsetWidth;
      eyebrowEl.textContent = m.eyebrow;
      titleEl.innerHTML = m.title;
      subEl.innerHTML = m.sub;
      msgBox.classList.add("run");

      /* Botones por slide (texto + link) — mismos estilos, solo cambia contenido.
         Los enlaces externos (http/https, p. ej. WhatsApp) se abren en nueva pestaña. */
      if (btnP && m.btnP) { btnP.textContent = m.btnP; if (m.btnPUrl) { setCtaLink(btnP, m.btnPUrl); } }
      if (btnS && m.btnS) { btnS.textContent = m.btnS; if (m.btnSUrl) { setCtaLink(btnS, m.btnSUrl); } }

      idxEl.innerHTML = "0" + (idx + 1) + " <span>/ 0" + N + "</span>";
      bars.forEach(function (b, j) {
        b.classList.toggle("on", j === idx);
        b.classList.toggle("done", j < idx);
        var f = b.querySelector(".fill");
        if (f) { f.remove(); }
        if (j === idx) {
          var fill = document.createElement("i");
          fill.className = "fill";
          b.appendChild(fill);
        }
      });
      imgs.forEach(function (im, j) { im.classList.toggle("on", j === idx); });
      alignCtaFloat();
    }

    function next() { render(idx + 1); }
    function start() { stop(); timer = setInterval(next, DUR); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    render(0);
    window.addEventListener("resize", alignCtaFloat, { passive: true });
    window.addEventListener("load", alignCtaFloat);
    if (!reduced) {
      start();
      /* Pausa SOLO al pasar sobre la barra de progreso (para leer un slide),
         no sobre todo el hero — si no, el hero full-bleed se queda "trabado". */
      var prog = hero.querySelector(".hero-prog");
      if (prog) {
        prog.addEventListener("mouseenter", function () { hero.classList.add("paused"); stop(); });
        prog.addEventListener("mouseleave", function () { hero.classList.remove("paused"); start(); });
      }
    }
    bars.forEach(function (b, j) {
      b.addEventListener("click", function () { render(j); if (!reduced) start(); });
    });
    /* Flecha "siguiente" al final de la barra de progreso */
    var nextBtn = hero.querySelector(".hero-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () { render(idx + 1); if (!reduced) start(); });
    }
  }

  /* ---------- Tabs de marcas: filtran por gama (cols C/D del Excel) ---------- */
  var tabs = document.querySelectorAll(".gama-tabs .t");
  var brandGrid = document.querySelector(".brandtiles");
  var brandTiles = brandGrid ? brandGrid.querySelectorAll(":scope > a[data-gama]") : [];
  var brandsWrap = document.querySelector(".brands-wrap");
  var brandsGrouped = document.querySelector("#brandsGrouped");
  var magicBtn = document.querySelector("#magicBtn");
  var gamaNote = document.querySelector(".gama-note");
  var azRail = document.querySelector(".az-rail");
  var pmRail = document.querySelector(".pm-rail");
  /* Macrocategorías (orden + etiqueta) — secciones de las listas de precios de homea.mx.
     Una marca (data-sub) puede pertenecer a varias → se repite en cada macro al agrupar. */
  var MACROS = [
    { key: "cocina", label: "Equipos de Cocina" },
    { key: "menores", label: "Electrodomésticos Menores" },
    { key: "tarjas", label: "Tarjas & Monomandos" },
    { key: "trituradores", label: "Trituradores" },
    { key: "asadores", label: "Asadores, Grills & Hornos de Pizza" },
    { key: "banos", label: "Baños & Regaderas" },
    { key: "vapor", label: "Vapor & Wellness" }
  ];
  /* Orden por costo = orden inicial del sitio (posicionamiento mayor→menor). Se sella en
     data-cost UNA vez por marca para que sobreviva a reordenamientos del DOM y a las
     re-inicializaciones: sin el sello, recapturar el orden del DOM tras el sort A→Z de la
     vista TODAS dejaría el "orden por costo" en alfabético. */
  var tilesArr = Array.prototype.slice.call(brandTiles);
  tilesArr.forEach(function (a, i) {
    if (!a.hasAttribute("data-cost")) { a.setAttribute("data-cost", i); }
  });
  var costOrder = tilesArr.slice().sort(function (a, b) {
    return (+a.getAttribute("data-cost")) - (+b.getAttribute("data-cost"));
  });
  var alphaOrder = tilesArr.slice().sort(function (a, b) {
    return a.textContent.trim().localeCompare(b.textContent.trim(), "es");
  });
  var GAMA_MOTION = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GAMA_TINT = {
    premium: "color-mix(in srgb, var(--homea-gold) 82%, var(--homea-espresso))",
    residencial: "var(--homea-gold)",
    media: "color-mix(in srgb, var(--homea-gold) 56%, var(--homea-bone))",
    economica: "color-mix(in srgb, var(--homea-gold) 30%, var(--homea-bone))"
  };
  /* Descripción breve de cada rango [etiqueta, texto]. El panel .gama-desc toma el
     tono del rango activo (ver theme.css) y v2.js le pone este texto. */
  var GAMA_DESC = {
    all: ["Rangos de marca", "Cuatro gamas, un lugar. Filtra por gama y por categoría, encuentra la que más se acomoda a tus necesidades."],
    premium: ["Premium", "Marcas especializadas en satisfacer los paladares más exigentes, puestas a prueba con herramientas de última tecnología y una manufactura de excepción."],
    residencial: ["Residencial", "Marcas enfocadas en funcionalidad y diseño a un precio accesible, para equipar el hogar sin renunciar al estilo."],
    media: ["Media", "Marcas que ponen la tecnología a tu alcance: una compra inteligente que equilibra calidad y precio."],
    economica: ["Económica", "Marcas al mejor precio, con el rendimiento necesario para el día a día."]
  };
  var gamaToken = 0;   /* invalida timeouts de un filtro anterior si se cambia rápido */
  var activeFilter = "all";
  var magicOn = false;

  function gamaShows(a, filter) {
    return filter === "all" ||
      (" " + a.getAttribute("data-gama") + " ").indexOf(" " + filter + " ") >= 0;
  }
  function inMacro(a, key) {
    return (" " + (a.getAttribute("data-sub") || "") + " ").indexOf(" " + key + " ") >= 0;
  }
  /* Vista MODO MAGIA: agrupa por macrocategoría; una marca se repite (clon) en cada macro
     a la que pertenece. Respeta el filtro de gama activo. */
  function renderGrouped(filter, animate) {
    if (!brandsGrouped) return;
    brandsGrouped.innerHTML = "";
    var reveal = [];
    MACROS.forEach(function (m) {
      var members = costOrder.filter(function (a) { return inMacro(a, m.key) && gamaShows(a, filter); });
      if (!members.length) return;
      var sec = document.createElement("section"); sec.className = "brand-group";
      var h = document.createElement("div"); h.className = "brand-group-h";
      var eb = document.createElement("span"); eb.className = "bg-eyebrow"; eb.textContent = m.label;
      var ct = document.createElement("span"); ct.className = "bg-count"; ct.textContent = members.length;
      h.appendChild(eb); h.appendChild(ct);
      var g = document.createElement("div"); g.className = "brandtiles brandtiles-grp";
      members.forEach(function (a) {
        var c = a.cloneNode(true);
        c.classList.remove("hide", "tin", "tout", "gacc");
        c.removeAttribute("style");
        g.appendChild(c); reveal.push(c);
      });
      sec.appendChild(h); sec.appendChild(g); brandsGrouped.appendChild(sec);
    });
    if (animate) {
      reveal.forEach(function (c, i) {
        c.animate(
          [{ opacity: 0, transform: "scale(.86) translateY(8px)" }, { opacity: 1, transform: "scale(1) translateY(0)" }],
          { duration: 460, delay: Math.min(i * 12, 620), easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
        );
      });
    }
  }
  /* Reordena (TODAS → alfabético; gama → costo) y fija estado de visibilidad/tinte. */
  function gamaCommit(filter) {
    if (brandGrid) {
      (filter === "all" ? alphaOrder : costOrder).forEach(function (a) { brandGrid.appendChild(a); });
    }
    brandTiles.forEach(function (a) {
      var show = gamaShows(a, filter);
      a.classList.remove("tout");
      a.classList.toggle("hide", !show);
      a.classList.toggle("gacc", show && filter !== "all");
    });
  }
  /* Entrada escalonada: arranca cada coincidencia en estado "tin" (sin transición),
     restaura la transición y la quita con un retraso por índice → suben en cascada. */
  function gamaReveal(filter) {
    var vis = (filter === "all" ? alphaOrder : costOrder).filter(function (a) { return gamaShows(a, filter); });
    vis.forEach(function (a) { a.style.transition = "none"; a.classList.add("tin"); });
    if (brandGrid) { void brandGrid.offsetWidth; }
    vis.forEach(function (a) { a.style.transition = ""; });
    if (brandGrid) { void brandGrid.offsetWidth; }
    var my = gamaToken;
    vis.forEach(function (a, i) {
      setTimeout(function () { if (my === gamaToken) { a.classList.remove("tin"); } }, i * 32 + 10);
    });
  }
  function applyGama(filter, animate) {
    activeFilter = filter;
    if (brandGrid) { brandGrid.setAttribute("data-gama-active", filter); }
    /* La nota de orden ("mayor costo a menor") aparece al filtrar por una gama
       (Premium/Residencial/Media/Económica), también en MODO MAGIA: cada grupo de
       categoría se ordena por costo (ver renderGrouped). Solo se oculta en "Todas". */
    if (gamaNote) {
      gamaNote.classList.toggle("hide", filter === "all");
      var ga = gamaNote.querySelector(".arrow");
      if (ga) { ga.style.color = filter === "all" ? "" : (GAMA_TINT[filter] || ""); }
    }
    /* Panel de descripción del rango: cambia de tono (data-gama) y de texto. */
    var gamaDesc = document.querySelector(".gama-desc");
    if (gamaDesc) {
      var d = GAMA_DESC[filter] || GAMA_DESC.all;
      gamaDesc.setAttribute("data-gama", filter);
      var gdl = gamaDesc.querySelector(".gd-label"); if (gdl) { gdl.textContent = d[0]; }
      var gdt = gamaDesc.querySelector(".gd-text"); if (gdt) { gdt.textContent = d[1]; }
    }
    /* Rieles A→Z / + → − : ocultos en MODO MAGIA. */
    if (azRail) { azRail.classList.toggle("hide", magicOn || filter !== "all"); updateAzArrow(); }
    if (pmRail) { pmRail.classList.toggle("hide", magicOn || filter === "all"); updatePmArrow(); }
    /* Alterna entre malla plana (gama) y vista agrupada (MODO MAGIA). */
    if (brandsWrap) { brandsWrap.classList.toggle("hide", magicOn); }
    if (brandsGrouped) { brandsGrouped.classList.toggle("hide", !magicOn); }
    if (magicOn) { renderGrouped(filter, animate && GAMA_MOTION); return; }

    if (!GAMA_MOTION || !animate) { gamaCommit(filter); return; }

    gamaToken++;
    var my = gamaToken;
    /* Salida: desvanece las marcas visibles que ya no coinciden, luego reordena y revela. */
    brandTiles.forEach(function (a) {
      if (!a.classList.contains("hide") && !gamaShows(a, filter)) { a.classList.add("tout"); }
    });
    setTimeout(function () {
      if (my !== gamaToken) { return; }
      gamaCommit(filter);
      gamaReveal(filter);
    }, 150);
  }
  /* El punto del riel visible sigue el scroll del usuario hasta llegar al fondo.
     A→Z en TODAS; + → − (mayor a menor costo) al filtrar por una gama. */
  var azTrack = azRail && azRail.querySelector(".az-track");
  var azArrow = azRail && azRail.querySelector(".az-arrow");
  var pmTrack = pmRail && pmRail.querySelector(".pm-track");
  var pmArrow = pmRail && pmRail.querySelector(".pm-arrow");
  function railFollow(rail, track, arrow) {
    if (!arrow || !track || !rail || rail.classList.contains("hide")) return;
    var tr = track.getBoundingClientRect();
    var ref = window.innerHeight * 0.5;                 // línea de referencia del viewport
    var y = Math.max(0, Math.min(tr.height, ref - tr.top));
    arrow.style.top = y + "px";
  }
  function updateAzArrow() { railFollow(azRail, azTrack, azArrow); }
  function updatePmArrow() { railFollow(pmRail, pmTrack, pmArrow); }
  if (azArrow || pmArrow) {
    var railTicking = false;
    var onRailScroll = function () {
      if (!railTicking) { railTicking = true; requestAnimationFrame(function () { updateAzArrow(); updatePmArrow(); railTicking = false; }); }
    };
    window.addEventListener("scroll", onRailScroll, { passive: true });
    window.addEventListener("resize", onRailScroll);
    updateAzArrow(); updatePmArrow();
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("on"); });
      t.classList.add("on");
      if (brandTiles.length) { applyGama(t.getAttribute("data-filter") || "all", true); }
    });
  });
  /* Ráfaga de destellos oro que se esparcen sobre las marcas al activar MODO MAGIA. */
  function emitSparkles(host) {
    if (!host || !GAMA_MOTION || typeof host.animate === "undefined") return;
    if (getComputedStyle(host).position === "static") { host.style.position = "relative"; }
    var layer = document.createElement("div");
    layer.className = "magic-sparkles";
    host.appendChild(layer);
    var h = host.offsetHeight || 700;
    /* Banda cubierta = zona visible al hacer clic (filtros + descripción + primeras
       filas). Evita dispersar en la malla enorme (miles de px) donde no se verían. */
    var band = Math.min(h, Math.max(1100, (window.innerHeight || 800) * 1.4));
    /* Densidad proporcional a la banda: repartidas (no agrupadas), sutiles (baja
       opacidad) y con retardo aleatorio para que titilen dispersas. */
    var count = Math.max(24, Math.min(60, Math.round(band / 46)));
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "magic-sparkle";
      s.textContent = "✦";
      s.style.left = (Math.random() * 100) + "%";
      s.style.top = (Math.random() * band) + "px";
      s.style.fontSize = (6 + Math.random() * 11) + "px";
      layer.appendChild(s);
      var dx = (Math.random() - 0.5) * 40, dy = (Math.random() - 0.5) * 40, rot = (Math.random() - 0.5) * 140;
      s.animate([
        { opacity: 0, transform: "translate(-50%,-50%) scale(0) rotate(0deg)" },
        { opacity: 0.68, transform: "translate(calc(-50% + " + (dx * 0.35) + "px), calc(-50% + " + (dy * 0.35) + "px)) scale(1) rotate(" + (rot * 0.5) + "deg)", offset: 0.4 },
        { opacity: 0, transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(.15) rotate(" + rot + "deg)" }
      ], { duration: 1000 + Math.random() * 800, delay: Math.random() * 800, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" });
    }
    setTimeout(function () { if (layer.parentNode) { layer.parentNode.removeChild(layer); } }, 3000);
  }
  function setMagic(on) {
    magicOn = on;
    if (magicBtn) { magicBtn.classList.toggle("on", on); magicBtn.setAttribute("aria-pressed", on ? "true" : "false"); }
    applyGama(activeFilter, true);
    if (on) { var sh = brandsGrouped || brandsWrap; emitSparkles((sh && sh.closest(".container")) || sh); }
  }
  if (magicBtn) { magicBtn.addEventListener("click", function () { setMagic(!magicOn); }); }
  var activeTab = document.querySelector(".gama-tabs .t.on");
  if (brandTiles.length && activeTab) { applyGama(activeTab.getAttribute("data-filter") || "all", false); }

  /* ---------- Tipo de cambio del día (slot de temporada del ubar) ----------
     Valor oficial = FIX que publica el DOF (dof.gob.mx/indicadores.php), que es
     el mismo dato de Banxico (serie SF43718). Para empatar AL CENTAVO con el DOF,
     pega abajo un token gratuito de Banxico (https://www.banxico.org.mx/SieAPIRest/
     → "Token"). Jerarquía de fuentes:
       1) Con red + token → FIX oficial de Banxico (= DOF) del día.  ← exacto, consulta el DOF
       2) Con red sin token → tasa de mercado USD→MXN del día (CORS público). ← aprox.
       3) Sin red → respaldo estático del HTML (data-fx-fallback): debe contener
          el TC oficial del DÍA ANTERIOR (último FIX conocido), para que offline
          siempre muestre un valor real y cercano. Se refresca cada día.
     En producción (Next.js) esto se resuelve en el servidor una vez al día. */
  var BANXICO_TOKEN = "7e566ca526db6444d2bcb4cead157044034797369e5c0dd797be44027321ce00"; /* token de consulta Banxico (solo preview; en producción va server-side) */
  var fxEl = document.getElementById("u-fx");
  if (fxEl) {
    var fxNum = fxEl.querySelector("strong");
    var setFx = function (rate) {
      var n = parseFloat(rate);
      if (fxNum && n) { fxNum.textContent = n.toFixed(2); }
    };
    var fromMarket = function () {
      return fetch("https://open.er-api.com/v6/latest/USD")
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) {
          if (d && d.rates && d.rates.MXN) { setFx(d.rates.MXN); }
          else { return Promise.reject(); }
        })
        .catch(function () {
          return fetch("https://api.frankfurter.app/latest?from=USD&to=MXN")
            .then(function (r) { return r.json(); })
            .then(function (d) { if (d && d.rates && d.rates.MXN) { setFx(d.rates.MXN); } });
        });
    };
    if (BANXICO_TOKEN) {
      fetch("https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=" + BANXICO_TOKEN + "&mediaType=json")
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) {
          var s = d && d.bmx && d.bmx.series && d.bmx.series[0];
          var dato = s && s.datos && s.datos[0];
          if (dato && dato.dato) { setFx(dato.dato); }
          else { return Promise.reject(); }
        })
        .catch(fromMarket)
        .catch(function () { /* offline: se conserva el valor estático de respaldo */ });
    } else {
      fromMarket().catch(function () { /* offline: respaldo estático */ });
    }
  }

  /* ---------- Movimiento por scroll (Opción A hero + Opción B stats) ---------- */
  var rmotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth < 768;

  /* Hero cinemático: parallax de imagen + copy y fade al salir (solo desktop) */
  var heroCine = document.querySelector(".hero-cine");
  if (heroCine && !rmotion && !coarse) {
    var pxEls = Array.prototype.slice.call(heroCine.querySelectorAll("[data-px]"));
    var copy = heroCine.querySelector(".hero-copy");
    var tH = false;
    var updH = function () {
      var r = heroCine.getBoundingClientRect();
      var prog = Math.min(Math.max(-r.top / heroCine.offsetHeight, 0), 1);
      pxEls.forEach(function (l) { l.style.transform = "translateY(" + (prog * parseFloat(l.dataset.px)) + "px)"; });
      if (copy) { copy.style.opacity = String(Math.max(0, 1 - prog * 1.35)); }
      tH = false;
    };
    window.addEventListener("scroll", function () { if (!tH) { requestAnimationFrame(updH); tH = true; } }, { passive: true });
    updH();
  }

  /* Stats Opción B: cada cifra + su imagen, acopladas al scroll (desktop) o por intervalo (móvil) */
  var ss = document.getElementById("statscroll");
  if (ss) {
    var ssItems = Array.prototype.slice.call(ss.querySelectorAll(".ss-item"));
    var ssBgs = Array.prototype.slice.call(ss.querySelectorAll(".ss-bg"));
    var ssDots = Array.prototype.slice.call(ss.querySelectorAll(".ss-dots i"));
    var ssN = ssItems.length;
    var ssSet = function (i) {
      i = Math.max(0, Math.min(ssN - 1, i));
      ssItems.forEach(function (el, j) { el.classList.toggle("on", j === i); });
      ssBgs.forEach(function (el, j) { el.classList.toggle("on", j === i); });
      ssDots.forEach(function (el, j) { el.classList.toggle("on", j === i); });
    };
    ssSet(0);
    if (coarse || rmotion) {
      if (!rmotion) { var ssi = 0; setInterval(function () { ssi = (ssi + 1) % ssN; ssSet(ssi); }, 2400); }
    } else {
      var tS = false;
      var updS = function () {
        var r = ss.getBoundingClientRect();
        var total = ss.offsetHeight - window.innerHeight;
        var p = Math.min(Math.max(-r.top / total, 0), 0.999);
        ssSet(Math.floor(p * ssN));
        tS = false;
      };
      window.addEventListener("scroll", function () { if (!tS) { requestAnimationFrame(updS); tS = true; } }, { passive: true });
      updS();
    }
  }

  /* ---------- WhatsApp: clicks rastreables (GA4 + Google Ads) ----------
     Cada clic dispara el evento "whatsapp_click" a GA4 (gtag) y lo empuja al
     dataLayer (para GTM / Google Ads). En Fase 3, al inyectar GA4/Ads, se marca
     "whatsapp_click" como CONVERSIÓN y se importa a Google Ads. En este preview
     no hay analítica cargada, así que los disparos son no-op pero el enlace abre
     WhatsApp normalmente. */
  var waLinks = document.querySelectorAll('[data-track="whatsapp_click"], .wa-track');
  Array.prototype.forEach.call(waLinks, function (a) {
    a.addEventListener("click", function () {
      var label = a.getAttribute("data-label") || "wa_generic";
      if (typeof window.gtag === "function") {
        window.gtag("event", "whatsapp_click", { event_category: "lead", event_label: label, transport_type: "beacon" });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "whatsapp_click", wa_location: label });
    });
  });

  /* ----- Presentación de marca: bloque estático -----
     Sin pin ni scroll-scrub: las frases clave quedan resaltadas de forma fija
     y el riel dorado a la izquierda se muestra lleno. */
  var bi = document.getElementById("brandintro");
  if (bi) {
    /* resaltes siempre encendidos: el realce dorado es parte del texto */
    Array.prototype.slice.call(bi.querySelectorAll(".bi-copy .ph"))
      .forEach(function (p) { p.classList.add("on"); });
    var biFlow = Array.prototype.slice.call(bi.querySelectorAll(".bi-flow-orb"));
    var rmBi = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var clamp01 = function (n) { return n < 0 ? 0 : n > 1 ? 1 : n; };
    if (rmBi) {
      bi.style.setProperty("--k", "1"); bi.style.setProperty("--kh", "1"); bi.style.setProperty("--kt", "1");
    } else {
      var ctaPill = document.querySelector("#distribucion-oficial .cta-pill");
      var biTick = false;
      var updBi = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var r = bi.getBoundingClientRect();
        var p = (vh - r.top) / vh;                  /* 0 al entrar por abajo → 1 cuando el tope llega arriba */
        /* La orbe + H se revelan TEMPRANO: para cuando la sección está ~a la mitad
           del viewport, el círculo dorado y el logo ya están completamente visibles. */
        bi.style.setProperty("--kt", clamp01((p - 0.05) / 0.35).toFixed(3)); /* texto: primero (sin cambios) */
        bi.style.setProperty("--k",  clamp01((p - 0.25) / 0.60).toFixed(3)); /* orbe dorada: aparición lenta, llega a full opacidad ya dentro del viewport */
        bi.style.setProperty("--kh", clamp01((p - 0.38) / 0.60).toFixed(3)); /* H blanca: poco después */
        for (var i = 0; i < biFlow.length; i++) {
          var f = parseFloat(biFlow[i].getAttribute("data-speed")) || 0.15;
          biFlow[i].style.transform = "translate3d(0," + ((vh - r.top) * f).toFixed(1) + "px,0)";
        }
        /* "Drenado" de la orbe al botón: al seguir bajando hacia "Distribución
           oficial", la orbe dorada se vacía (--kx 1→0) y el botón se llena
           (--fill 0→1) con el mismo progreso. d=0 cuando el botón entra por abajo,
           d=1 cuando su centro llega a ~55% del viewport. */
        if (ctaPill) {
          var cr = ctaPill.getBoundingClientRect();
          var cc = cr.top + cr.height / 2;
          var d = clamp01((vh - cc) / (vh * 0.45));
          ctaPill.style.setProperty("--fill", d.toFixed(3));
          bi.style.setProperty("--kx", (1 - d).toFixed(3));
        }
        biTick = false;
      };
      window.addEventListener("scroll", function () { if (!biTick) { biTick = true; requestAnimationFrame(updBi); } }, { passive: true });
      window.addEventListener("resize", function () { if (!biTick) { biTick = true; requestAnimationFrame(updBi); } }, { passive: true });
      updBi();
    }
  }

  /* ----- Orbes doradas con parallax al scroll (catsec) -----
     translateY atado a la posición de scroll: bajan al hacer scroll abajo y
     regresan al subir. Velocidades distintas por orbe = profundidad. Solo
     transform (GPU), throttle con rAF, y respeta prefers-reduced-motion. */
  var orbWraps = Array.prototype.slice.call(document.querySelectorAll(".cat-orbs"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (orbWraps.length && !reduceMotion) {
    /* Cada campo de orbes (catsec y brandintro) usa los mismos data-speed, así el
       parallax se lee como un solo fondo continuo entre ambas secciones. */
    var orbGroups = orbWraps.map(function (wrap) {
      return { wrap: wrap, orbs: Array.prototype.slice.call(wrap.querySelectorAll(".orb")) };
    });
    var orbTicking = false;
    function placeOrbs() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var g = 0; g < orbGroups.length; g++) {
        var scrolled = vh - orbGroups[g].wrap.getBoundingClientRect().top; /* crece al bajar */
        var os = orbGroups[g].orbs;
        for (var i = 0; i < os.length; i++) {
          var f = parseFloat(os[i].getAttribute("data-speed")) || 0.12;
          os[i].style.transform = "translate3d(0," + (scrolled * f).toFixed(1) + "px,0)";
        }
      }
      orbTicking = false;
    }
    function onOrbScroll() {
      if (!orbTicking) { orbTicking = true; requestAnimationFrame(placeOrbs); }
    }
    window.addEventListener("scroll", onOrbScroll, { passive: true });
    window.addEventListener("resize", onOrbScroll, { passive: true });
    placeOrbs();
  }

  /* ----- Beneficios: las orbes se acentúan conforme bajas a la sección -----
     --k (0→1) sube según cuánto ha entrado la sección por abajo; el CSS lo usa
     para opacidad/escala de las orbes. Las tarjetas se revelan con el observer
     general (.reveal). Solo escribe una custom prop, throttle con rAF. */
  var bene = document.getElementById("beneficios");
  if (bene) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      bene.style.setProperty("--k", "0.6");
    } else {
      var beneTick = false;
      var updBene = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var r = bene.getBoundingClientRect();
        /* k=0 cuando la sección apenas asoma por abajo; k=1 cuando ha entrado
           ~70% del viewport (orbes a tope antes de centrar). */
        var k = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7)));
        bene.style.setProperty("--k", k.toFixed(3));
        beneTick = false;
      };
      window.addEventListener("scroll", function () { if (!beneTick) { beneTick = true; requestAnimationFrame(updBene); } }, { passive: true });
      window.addEventListener("resize", function () { if (!beneTick) { beneTick = true; requestAnimationFrame(updBene); } }, { passive: true });
      updBene();
    }
  }

  /* ---- Mega-menú maestro-detalle: cambiar panel al pasar el cursor ---- */
  {
    var mega = document.querySelector("[data-mega]");
    if (mega) {
      var cats = mega.querySelectorAll(".mega-cat");
      var panes = mega.querySelectorAll(".mega-pane");
      var featEl = mega.querySelector(".mega-feature");
      var featImg = mega.querySelector("[data-mega-img]");
      var featLab = mega.querySelector("[data-mega-label]");
      var activate = function (key, img, label, pos) {
        cats.forEach(function (c) { c.classList.toggle("is-active", c.dataset.pane === key); });
        panes.forEach(function (p) { p.classList.toggle("is-active", p.dataset.pane === key); });
        /* Ajusta columnas/ancho del detalle a cuántas subcategorías tiene la categoría:
           así el detalle se encoge a lo que usa y la foto crece a llenar el resto. */
        var ap = mega.querySelector('.mega-pane[data-pane="' + key + '"]');
        if (ap) {
          var subs = ap.querySelector(".mega-subcols");
          if (subs) {
            var COLW = 190, GAP = 26;
            var n = ap.querySelectorAll(".mega-subcol").length;
            var cols = Math.min(3, Math.max(1, n));
            subs.style.columnCount = cols;
            subs.style.width = (cols * COLW + (cols - 1) * GAP) + "px";
          }
          /* Foto de tamaño ESTABLE entre categorías: solo el pane de columnas
             fijas (Cocina y Bar) ensancha el detalle y encoge la foto. */
          mega.classList.toggle("detail-wide", !!(subs && subs.classList.contains("is-fixed")));
        }
        if (featImg && img) { featImg.src = img; featImg.style.objectPosition = pos || "50% 50%"; }
        if (featLab && label) { featLab.innerHTML = label; }
        if (featEl) { featEl.classList.add("is-on"); }   /* la foto aparece al pasar el cursor */
        mega.classList.add("cat-active");                 /* oculta la intro de marca y muestra detalle+foto */
      };
      cats.forEach(function (c) {
        var go = function () {
          activate(c.dataset.pane, c.dataset.img, c.dataset.label, c.dataset.pos);
          /* la foto grande enlaza a la macrocategoría activa */
          if (featEl && c.dataset.href) { featEl.setAttribute("href", c.dataset.href); }
        };
        c.addEventListener("mouseenter", go);
        c.addEventListener("focus", go);
        /* clic en la macrocategoría → su página de catálogo */
        if (c.dataset.href) {
          c.style.cursor = "pointer";
          c.addEventListener("click", function () { window.location.href = c.dataset.href; });
        }
      });
      /* Al cerrar el menú, regresar al estado inicial: solo macro categorías, sin detalle ni foto */
      var reset = function () {
        cats.forEach(function (c) { c.classList.remove("is-active"); });
        panes.forEach(function (p) { p.classList.remove("is-active"); });
        if (featEl) { featEl.classList.remove("is-on"); }
        mega.classList.remove("cat-active");
      };
      var wrap = mega.closest(".has-mega");
      if (wrap) { wrap.addEventListener("mouseleave", reset); }
    }
  }

  /* ---------- Marquesina de marcas: arrastrable + auto-scroll ----------
     El JS toma el control del movimiento (rAF) para poder arrastrar con
     inercia, manteniendo el desplazamiento automático y el loop continuo. */
  var mq = document.querySelector(".mq");
  if (mq && "requestAnimationFrame" in window) {
    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mq.classList.add("is-draggable");

    Array.prototype.forEach.call(mq.querySelectorAll(".mq-row"), function (row) {
      var track = row.querySelector(".mq-track");
      var seq = row.querySelector(".mq-seq");
      if (!track || !seq) return;

      /* Bloquea el arrastre nativo de <img>/<a>: si no, el navegador secuestra el
         gesto al iniciar sobre una imagen y muestra el "fantasma" con su nombre. */
      Array.prototype.forEach.call(row.querySelectorAll("img, a"), function (el) {
        el.setAttribute("draggable", "false");
      });
      row.addEventListener("dragstart", function (e) { e.preventDefault(); });

      var isRight = row.classList.contains("right");
      var dir = isRight ? 1 : -1;          /* sentido del auto-scroll */
      var dur = isRight ? 64 : 52;         /* segundos por un seq (equiv. CSS) */

      var seqW = seq.getBoundingClientRect().width || 1;
      var recalc = function () {
        var w = seq.getBoundingClientRect().width;
        if (w) seqW = w;
      };
      if ("ResizeObserver" in window) { new ResizeObserver(recalc).observe(seq); }
      window.addEventListener("resize", recalc);
      window.addEventListener("load", recalc);

      var pos = 0, velocity = 0, hovering = false, dragging = false;
      var downX = 0, startPos = 0, lastX = 0, lastT = 0, moved = false;

      var wrapPos = function (p) { p = p % seqW; if (p > 0) p -= seqW; return p; };
      var apply = function () { track.style.transform = "translate3d(" + pos + "px,0,0)"; };

      var prev = null;
      var frame = function (t) {
        if (prev === null) prev = t;
        var dt = Math.min(0.05, (t - prev) / 1000); prev = t;
        if (!dragging) {
          var auto = (hovering || reduceMotion) ? 0 : dir * (seqW / dur);
          pos = wrapPos(pos + (auto + velocity) * dt);
          velocity *= Math.pow(0.94, dt * 60);
          if (Math.abs(velocity) < 1) velocity = 0;
          apply();
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);

      row.addEventListener("pointerenter", function () { hovering = true; });
      row.addEventListener("pointerleave", function () { hovering = false; });

      row.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        dragging = true; moved = false;
        downX = lastX = e.clientX; lastT = e.timeStamp || Date.now();
        startPos = pos; velocity = 0;
        row.classList.add("dragging");
        if (row.setPointerCapture) { try { row.setPointerCapture(e.pointerId); } catch (err) {} }
      });
      row.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - downX;
        if (Math.abs(dx) > 4) moved = true;
        pos = wrapPos(startPos + dx); apply();
        var now = e.timeStamp || Date.now();
        var ddt = (now - lastT) / 1000;
        if (ddt > 0) velocity = (e.clientX - lastX) / ddt;
        lastX = e.clientX; lastT = now;
      });
      var endDrag = function () {
        if (!dragging) return;
        dragging = false;
        row.classList.remove("dragging");
        velocity = Math.max(-2600, Math.min(2600, velocity));  /* inercia acotada */
      };
      row.addEventListener("pointerup", endDrag);
      row.addEventListener("pointercancel", endDrag);

      /* Si hubo arrastre, no navegar al soltar sobre un chip */
      row.addEventListener("click", function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }
})();

/* ---- Reseñas Google — rotador ---------------------------------------- */
(function () {
  var grev = document.querySelector("[data-greviews]");
  if (!grev) return;
  var cards = Array.prototype.slice.call(grev.querySelectorAll(".grev-card"));
  if (!cards.length) return;
  var gi = 0, timer = null, DUR = 10000;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Genera un dot por reseña (escala solo con el nº de tarjetas)
  var dotsWrap = grev.querySelector(".grev-dots"), dots = [];
  if (dotsWrap) {
    cards.forEach(function (c, j) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Reseña " + (j + 1));
      b.addEventListener("click", function () { render(j); start(); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }
  function render(i) {
    gi = (i + cards.length) % cards.length;
    cards.forEach(function (c, j) { c.classList.toggle("on", j === gi); });
    dots.forEach(function (d, j) { d.classList.toggle("on", j === gi); });
  }
  function start() { stop(); timer = setInterval(function () { render(gi + 1); }, DUR); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  /* Sigue rotando aunque el cursor esté sobre la sección (sin pausa al hover). */
  render(0); start();
})();

(function () {
  "use strict";
  /* ---------- Menú móvil (hamburguesa) ---------- */
  var nav = document.querySelector(".site-nav");
  var toggle = nav && nav.querySelector(".nav-toggle");
  if (!nav || !toggle) return;

  function close() { nav.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* Cerrar el menú al elegir un enlace */
  nav.querySelectorAll(".nav-links a, .nav-right a, .btn-ghost").forEach(function (a) {
    a.addEventListener("click", close);
  });

  /* "Productos" NO navega: sólo abre el desplegable; la navegación ocurre al elegir
     una macrocategoría del riel (data-href en .mega-cat). En móvil, el propio riel
     lleva a cada macrocategoría. */

  /* Cerrar con Escape */
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
