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
  var revealEls = document.querySelectorAll(".reveal, .reveal-img");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
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

      /* Botones por slide (texto + link) — mismos estilos, solo cambia contenido */
      if (btnP && m.btnP) { btnP.textContent = m.btnP; if (m.btnPUrl) { btnP.setAttribute("href", m.btnPUrl); } }
      if (btnS && m.btnS) { btnS.textContent = m.btnS; if (m.btnSUrl) { btnS.setAttribute("href", m.btnSUrl); } }

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

  /* ---------- Tabs (marcas): visual only ---------- */
  var tabs = document.querySelectorAll(".gama-tabs .t");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("on"); });
      t.classList.add("on");
    });
  });

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
        }
        if (featImg && img) { featImg.src = img; featImg.style.objectPosition = pos || "50% 50%"; }
        if (featLab && label) { featLab.innerHTML = label; }
        if (featEl) { featEl.classList.add("is-on"); }   /* la foto aparece al pasar el cursor */
        mega.classList.add("cat-active");                 /* oculta la intro de marca y muestra detalle+foto */
      };
      cats.forEach(function (c) {
        var go = function () { activate(c.dataset.pane, c.dataset.img, c.dataset.label, c.dataset.pos); };
        c.addEventListener("mouseenter", go);
        c.addEventListener("focus", go);
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
