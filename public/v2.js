/* HOMEA preview · v2 — interacciones contenidas.
   Nav scroll · hero rotativo · reveals on-scroll · tabs · marquesina · reseñas.

   Reestructurado para navegación SPA (sin recargar):
   - bindChrome(): se ejecuta UNA sola vez. Liga el cromo persistente (nav + footer
     viven en el layout y no se reemplazan al navegar): scroll de nav, tipo de cambio,
     mega-menú y menú móvil.
   - bindPage(): se ejecuta en CADA render de <main>. Liga las interacciones del
     contenido de página (hero, reveals, tabs, parallax, marquesina, reseñas). Cada
     llamada aborta la anterior (AbortController) para que los listeners de scroll,
     los rAF y los setInterval NO se acumulen entre navegaciones.
   El interceptor de enlaces (components/PreviewRouter) llama a window.__homeaInitPage
   después de cada navegación cliente. */
(function () {
  "use strict";

  /* Contexto de ciclo de vida de la fase de página: listeners/loops auto-cancelables. */
  function makePageCtx() {
    var ac = new AbortController();
    return {
      signal: ac.signal,
      abort: function () { try { ac.abort(); } catch (e) {} },
      on: function (t, ev, fn, opts) {
        opts = Object.assign({}, opts, { signal: ac.signal });
        t.addEventListener(ev, fn, opts);
      },
      onAbort: function (fn) { ac.signal.addEventListener("abort", fn); }
    };
  }

  /* =====================================================================
     FASE CROMO — una sola vez (nav + footer persisten entre navegaciones).
     ===================================================================== */
  function bindChrome() {
    if (window.__homeaChromeBound) { return; }
    window.__homeaChromeBound = true;

    /* ---------- Nav: claro → oscuro al hacer scroll ---------- */
    var nav = document.querySelector(".site-nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Tipo de cambio del día (slot de temporada del ubar) ----------
       Valor oficial = FIX que publica el DOF (= Banxico, serie SF43718).
       En producción (Next.js) esto se resuelve en el servidor una vez al día. */
    var BANXICO_TOKEN = "7e566ca526db6444d2bcb4cead157044034797369e5c0dd797be44027321ce00";
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

    /* ---- Mega-menú maestro-detalle: cambiar panel al pasar el cursor ---- */
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
        }
        if (featImg && img) { featImg.src = img; featImg.style.objectPosition = pos || "50% 50%"; }
        if (featLab && label) { featLab.innerHTML = label; }
        if (featEl) { featEl.classList.add("is-on"); }
        mega.classList.add("cat-active");
      };
      cats.forEach(function (c) {
        var go = function () {
          activate(c.dataset.pane, c.dataset.img, c.dataset.label, c.dataset.pos);
          if (featEl && c.dataset.href) { featEl.setAttribute("href", c.dataset.href); }
        };
        c.addEventListener("mouseenter", go);
        c.addEventListener("focus", go);
        /* La navegación vive en la macrocategoría: clic en el riel → su página. */
        if (c.dataset.href) {
          c.style.cursor = "pointer";
          c.addEventListener("click", function () { window.location.href = c.dataset.href; });
        }
      });
      var reset = function () {
        cats.forEach(function (c) { c.classList.remove("is-active"); });
        panes.forEach(function (p) { p.classList.remove("is-active"); });
        if (featEl) { featEl.classList.remove("is-on"); }
        mega.classList.remove("cat-active");
      };
      var wrap = mega.closest(".has-mega");
      if (wrap) { wrap.addEventListener("mouseleave", reset); }
    }

    /* ---- Apertura/cierre de los mega-menús: un solo panel a la vez ----
       El panel se muestra por clase (.is-open) en vez de :hover. Delegación en la
       barra: en CADA movimiento se recalcula sobre qué .has-mega está el cursor
       (título o su panel) y se abre solo ese; el resto se cierra al instante. Así
       nunca queda "pegado" el panel anterior al cambiar de título (p. ej. de
       Marcas a Productos). Al salir de la barra se cierra tras una breve gracia. */
    var siteNav = document.querySelector(".site-nav");
    var megaWraps = document.querySelectorAll(".has-mega");
    if (siteNav && megaWraps.length) {
      var closeTimer = null;
      var closeAllMega = function () {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        megaWraps.forEach(function (w) { w.classList.remove("is-open"); });
      };
      var openMega = function (w) {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        megaWraps.forEach(function (o) { o.classList.toggle("is-open", o === w); });
      };
      var closeSoon = function () {
        if (closeTimer) { clearTimeout(closeTimer); }
        closeTimer = setTimeout(closeAllMega, 140);
      };
      siteNav.addEventListener("mouseover", function (e) {
        var w = e.target.closest(".has-mega");
        if (w) { openMega(w); }
        /* Sobre un elemento interactivo de la barra que NO es mega → cerrar.
           El espacio vacío entre enlaces no dispara nada (evita parpadeo al cruzar). */
        else if (e.target.closest("a, button, .btn, .nav-search")) { closeAllMega(); }
      });
      siteNav.addEventListener("mouseleave", closeSoon);
      /* Al pulsar cualquier enlace de la barra (incluido el título con panel o un
         item del panel) el mega se cierra al instante para dejar ver la página.
         Con clic de ratón (e.detail > 0) se quita el foco del enlace para que no
         quede el recuadro de foco ni un panel "pegado"; el foco de teclado (Enter,
         e.detail === 0) se respeta para no romper la navegación accesible. */
      siteNav.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (a) { closeAllMega(); if (e.detail > 0) { a.blur(); } }
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAllMega(); } });
    }

    /* ---------- Menú móvil (hamburguesa) ---------- */
    var mnav = document.querySelector(".site-nav");
    var toggle = mnav && mnav.querySelector(".nav-toggle");
    if (mnav && toggle) {
      var close = function () { mnav.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); };
      toggle.addEventListener("click", function () {
        var open = mnav.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      mnav.querySelectorAll(".nav-links a, .nav-right a, .btn-ghost").forEach(function (a) {
        a.addEventListener("click", close);
      });
      /* "Productos" NO navega (no existe índice /productos): solo abre el desplegable.
         La navegación ocurre al elegir una macrocategoría del riel. */
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }
  }

  /* =====================================================================
     FASE PÁGINA — en cada render de <main>. Re-ejecutable; aborta la anterior.
     ===================================================================== */
  function bindPage() {
    if (window.__homeaPage) { window.__homeaPage.abort(); }
    var ctx = makePageCtx();
    window.__homeaPage = ctx;
    var on = ctx.on;

    /* ---------- Reveals: una vez, al entrar al viewport ---------- */
    if ("IntersectionObserver" in window) {
      var reveal = function (el, obs) { el.classList.add("in"); obs.unobserve(el); };
      var ioEarly = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target, ioEarly); } });
      }, { threshold: 0, rootMargin: "0px 0px 20% 0px" });
      document.querySelectorAll(".reveal:not(.cat-grid), .reveal-img").forEach(function (el) { ioEarly.observe(el); });
      var ioInView = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target, ioInView); } });
      }, { threshold: 0 });
      document.querySelectorAll(".cat-grid.reveal").forEach(function (el) { ioInView.observe(el); });
      ctx.onAbort(function () { ioEarly.disconnect(); ioInView.disconnect(); });
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

      function setCtaLink(el, url) {
        el.setAttribute("href", url);
        if (/^https?:\/\//i.test(url)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
        else { el.removeAttribute("target"); el.removeAttribute("rel"); }
      }

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
        msgBox.classList.remove("run");
        void msgBox.offsetWidth;
        eyebrowEl.textContent = m.eyebrow;
        titleEl.innerHTML = m.title;
        subEl.innerHTML = m.sub;
        msgBox.classList.add("run");
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
      ctx.onAbort(stop);

      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      render(0);
      on(window, "resize", alignCtaFloat, { passive: true });
      on(window, "load", alignCtaFloat);
      if (!reduced) {
        start();
        var prog = hero.querySelector(".hero-prog");
        if (prog) {
          prog.addEventListener("mouseenter", function () { hero.classList.add("paused"); stop(); });
          prog.addEventListener("mouseleave", function () { hero.classList.remove("paused"); start(); });
        }
      }
      bars.forEach(function (b, j) {
        b.addEventListener("click", function () { render(j); if (!reduced) start(); });
      });
      var nextBtn = hero.querySelector(".hero-next");
      if (nextBtn) {
        nextBtn.addEventListener("click", function () { render(idx + 1); if (!reduced) start(); });
      }
    }

    /* ---------- Tabs de marcas: filtran por gama ---------- */
    var tabs = document.querySelectorAll(".gama-tabs .t");
    var brandTiles = document.querySelectorAll(".brandtiles a[data-gama]");
    var brandGrid = document.querySelector(".brandtiles");
    var gamaNote = document.querySelector(".gama-note");
    var azRail = document.querySelector(".az-rail");
    var costOrder = Array.prototype.slice.call(brandTiles);
    var alphaOrder = costOrder.slice().sort(function (a, b) {
      return a.textContent.trim().localeCompare(b.textContent.trim(), "es");
    });
    var gamaReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    function applyGama(filter, animate) {
      brandTiles.forEach(function (a) {
        var show = filter === "all" ||
          (" " + a.getAttribute("data-gama") + " ").indexOf(" " + filter + " ") >= 0;
        a.classList.toggle("hide", !show);
      });
      var order = filter === "all" ? alphaOrder : costOrder;
      if (brandGrid) {
        order.forEach(function (a) { brandGrid.appendChild(a); });
      }
      if (gamaNote) { gamaNote.classList.toggle("hide", filter === "all"); }
      if (azRail) { azRail.classList.toggle("hide", filter !== "all"); updateAzArrow(); }
      /* Al cambiar de gama, las marcas visibles entran con un fade escalonado.
         WAAPI: se auto-limpia, se re-dispara limpio en cada cambio y respeta
         "reduce motion". `fill:backwards` mantiene opacity 0 durante el retardo
         del escalonado y no deja estado residual al terminar. */
      if (animate && !gamaReduce.matches) {
        var visible = order.filter(function (a) { return !a.classList.contains("hide"); });
        visible.forEach(function (a, i) {
          a.animate(
            [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 420, delay: Math.min(i * 18, 360), easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
          );
        });
      }
    }
    var azTrack = azRail && azRail.querySelector(".az-track");
    var azArrow = azRail && azRail.querySelector(".az-arrow");
    function updateAzArrow() {
      if (!azArrow || !azTrack || !azRail || azRail.classList.contains("hide")) return;
      var tr = azTrack.getBoundingClientRect();
      var ref = window.innerHeight * 0.5;
      var y = Math.max(0, Math.min(tr.height, ref - tr.top));
      azArrow.style.top = y + "px";
    }
    if (azArrow) {
      var azTicking = false;
      var onAzScroll = function () {
        if (!azTicking) { azTicking = true; requestAnimationFrame(function () { updateAzArrow(); azTicking = false; }); }
      };
      on(window, "scroll", onAzScroll, { passive: true });
      on(window, "resize", onAzScroll);
      updateAzArrow();
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("on"); });
        t.classList.add("on");
        if (brandTiles.length) { applyGama(t.getAttribute("data-filter") || "all", true); }
      });
    });
    var activeTab = document.querySelector(".gama-tabs .t.on");
    if (brandTiles.length && activeTab) { applyGama(activeTab.getAttribute("data-filter") || "all", false); }

    /* ---------- Movimiento por scroll (hero + stats) ---------- */
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
      on(window, "scroll", function () { if (!tH) { requestAnimationFrame(updH); tH = true; } }, { passive: true });
      updH();
    }

    /* Stats: cada cifra + su imagen, acopladas al scroll (desktop) o por intervalo (móvil) */
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
        if (!rmotion) {
          var ssi = 0;
          var ssInt = setInterval(function () { ssi = (ssi + 1) % ssN; ssSet(ssi); }, 2400);
          ctx.onAbort(function () { clearInterval(ssInt); });
        }
      } else {
        var tS = false;
        var updS = function () {
          var r = ss.getBoundingClientRect();
          var total = ss.offsetHeight - window.innerHeight;
          var p = Math.min(Math.max(-r.top / total, 0), 0.999);
          ssSet(Math.floor(p * ssN));
          tS = false;
        };
        on(window, "scroll", function () { if (!tS) { requestAnimationFrame(updS); tS = true; } }, { passive: true });
        updS();
      }
    }

    /* ---------- WhatsApp: clicks rastreables (GA4 + Google Ads) ---------- */
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

    /* ----- Presentación de marca: bloque estático ----- */
    var bi = document.getElementById("brandintro");
    if (bi) {
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
          var p = (vh - r.top) / vh;
          bi.style.setProperty("--kt", clamp01((p - 0.05) / 0.35).toFixed(3));
          bi.style.setProperty("--k",  clamp01((p - 0.25) / 0.60).toFixed(3));
          bi.style.setProperty("--kh", clamp01((p - 0.38) / 0.60).toFixed(3));
          for (var i = 0; i < biFlow.length; i++) {
            var f = parseFloat(biFlow[i].getAttribute("data-speed")) || 0.15;
            biFlow[i].style.transform = "translate3d(0," + ((vh - r.top) * f).toFixed(1) + "px,0)";
          }
          if (ctaPill) {
            var cr = ctaPill.getBoundingClientRect();
            var cc = cr.top + cr.height / 2;
            var d = clamp01((vh - cc) / (vh * 0.45));
            ctaPill.style.setProperty("--fill", d.toFixed(3));
            bi.style.setProperty("--kx", (1 - d).toFixed(3));
          }
          biTick = false;
        };
        on(window, "scroll", function () { if (!biTick) { biTick = true; requestAnimationFrame(updBi); } }, { passive: true });
        on(window, "resize", function () { if (!biTick) { biTick = true; requestAnimationFrame(updBi); } }, { passive: true });
        updBi();
      }
    }

    /* ----- Orbes doradas con parallax al scroll (catsec) ----- */
    var orbWraps = Array.prototype.slice.call(document.querySelectorAll(".cat-orbs"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (orbWraps.length && !reduceMotion) {
      var orbGroups = orbWraps.map(function (wrap) {
        return { wrap: wrap, orbs: Array.prototype.slice.call(wrap.querySelectorAll(".orb")) };
      });
      var orbTicking = false;
      var placeOrbs = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        for (var g = 0; g < orbGroups.length; g++) {
          var scrolled = vh - orbGroups[g].wrap.getBoundingClientRect().top;
          var os = orbGroups[g].orbs;
          for (var i = 0; i < os.length; i++) {
            var f = parseFloat(os[i].getAttribute("data-speed")) || 0.12;
            os[i].style.transform = "translate3d(0," + (scrolled * f).toFixed(1) + "px,0)";
          }
        }
        orbTicking = false;
      };
      var onOrbScroll = function () {
        if (!orbTicking) { orbTicking = true; requestAnimationFrame(placeOrbs); }
      };
      on(window, "scroll", onOrbScroll, { passive: true });
      on(window, "resize", onOrbScroll, { passive: true });
      placeOrbs();
    }

    /* ----- Beneficios: las orbes se acentúan conforme bajas a la sección ----- */
    var bene = document.getElementById("beneficios");
    if (bene) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        bene.style.setProperty("--k", "0.6");
      } else {
        var beneTick = false;
        var updBene = function () {
          var vh = window.innerHeight || document.documentElement.clientHeight;
          var r = bene.getBoundingClientRect();
          var k = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7)));
          bene.style.setProperty("--k", k.toFixed(3));
          beneTick = false;
        };
        on(window, "scroll", function () { if (!beneTick) { beneTick = true; requestAnimationFrame(updBene); } }, { passive: true });
        on(window, "resize", function () { if (!beneTick) { beneTick = true; requestAnimationFrame(updBene); } }, { passive: true });
        updBene();
      }
    }

    /* ---------- Marquesina de marcas: arrastrable + auto-scroll ---------- */
    var mq = document.querySelector(".mq");
    if (mq && "requestAnimationFrame" in window) {
      var mqReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mq.classList.add("is-draggable");

      Array.prototype.forEach.call(mq.querySelectorAll(".mq-row"), function (row) {
        var track = row.querySelector(".mq-track");
        var seq = row.querySelector(".mq-seq");
        if (!track || !seq) return;

        Array.prototype.forEach.call(row.querySelectorAll("img, a"), function (el) {
          el.setAttribute("draggable", "false");
        });
        row.addEventListener("dragstart", function (e) { e.preventDefault(); });

        var isRight = row.classList.contains("right");
        var dir = isRight ? 1 : -1;
        var dur = isRight ? 64 : 52;

        var seqW = seq.getBoundingClientRect().width || 1;
        var recalc = function () {
          var w = seq.getBoundingClientRect().width;
          if (w) seqW = w;
        };
        if ("ResizeObserver" in window) {
          var ro = new ResizeObserver(recalc); ro.observe(seq);
          ctx.onAbort(function () { ro.disconnect(); });
        }
        on(window, "resize", recalc);
        on(window, "load", recalc);

        var pos = 0, velocity = 0, hovering = false, dragging = false;
        var downX = 0, startPos = 0, lastX = 0, lastT = 0, moved = false;

        var wrapPos = function (p) { p = p % seqW; if (p > 0) p -= seqW; return p; };
        var apply = function () { track.style.transform = "translate3d(" + pos + "px,0,0)"; };

        var prev = null;
        var frame = function (t) {
          if (ctx.signal.aborted) return;        /* detiene el rAF al navegar */
          if (prev === null) prev = t;
          var dt = Math.min(0.05, (t - prev) / 1000); prev = t;
          if (!dragging) {
            var auto = (hovering || mqReduce) ? 0 : dir * (seqW / dur);
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
          velocity = Math.max(-2600, Math.min(2600, velocity));
        };
        row.addEventListener("pointerup", endDrag);
        row.addEventListener("pointercancel", endDrag);
        row.addEventListener("click", function (e) {
          if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
        }, true);
      });
    }

    /* ---- Reseñas Google — rotador ---- */
    var grev = document.querySelector("[data-greviews]");
    if (grev) {
      var gcards = Array.prototype.slice.call(grev.querySelectorAll(".grev-card"));
      if (gcards.length) {
        var gi = 0, gtimer = null, GDUR = 10000;
        var gdotsWrap = grev.querySelector(".grev-dots"), gdots = [];
        var grender = function (i) {
          gi = (i + gcards.length) % gcards.length;
          gcards.forEach(function (c, j) { c.classList.toggle("on", j === gi); });
          gdots.forEach(function (d, j) { d.classList.toggle("on", j === gi); });
        };
        var gstart = function () { gstop(); gtimer = setInterval(function () { grender(gi + 1); }, GDUR); };
        var gstop = function () { if (gtimer) { clearInterval(gtimer); gtimer = null; } };
        ctx.onAbort(gstop);
        if (gdotsWrap) {
          gdotsWrap.innerHTML = "";   /* idempotente: evita dots duplicados si se re-inicializa */
          gcards.forEach(function (c, j) {
            var b = document.createElement("button");
            b.setAttribute("aria-label", "Reseña " + (j + 1));
            b.addEventListener("click", function () { grender(j); gstart(); });
            gdotsWrap.appendChild(b);
            gdots.push(b);
          });
        }
        grender(0); gstart();
      }
    }
  }

  /* Arranque + API para re-inicializar tras navegación cliente (PreviewRouter). */
  bindChrome();
  bindPage();
  window.__homeaInitPage = bindPage;
})();
