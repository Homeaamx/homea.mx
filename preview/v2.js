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
    var DUR = 6000;
    var msgs = JSON.parse(hero.querySelector("#hero-data").textContent);
    var N = msgs.length;
    var msgBox = hero.querySelector(".hero-msg");
    var eyebrowEl = msgBox.querySelector(".eyebrow");
    var titleEl = msgBox.querySelector("h1");
    var subEl = msgBox.querySelector(".sub");
    var idxEl = hero.querySelector(".hero-prog .idx");
    var bars = Array.prototype.slice.call(hero.querySelectorAll(".hero-bars button"));
    var imgs = Array.prototype.slice.call(hero.querySelectorAll(".hero-visual .hi"));
    var idx = 0, timer = null;

    function render(i) {
      idx = (i + N) % N;
      var m = msgs[idx];
      /* Replay del rise: quitar clase, forzar reflow, volver a poner */
      msgBox.classList.remove("run");
      void msgBox.offsetWidth;
      eyebrowEl.textContent = m.eyebrow;
      titleEl.innerHTML = m.title;
      subEl.textContent = m.sub;
      msgBox.classList.add("run");

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
    }

    function next() { render(idx + 1); }
    function start() { stop(); timer = setInterval(next, DUR); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    render(0);
    if (!reduced) {
      start();
      hero.addEventListener("mouseenter", function () { hero.classList.add("paused"); stop(); });
      hero.addEventListener("mouseleave", function () { hero.classList.remove("paused"); start(); });
    }
    bars.forEach(function (b, j) {
      b.addEventListener("click", function () { render(j); if (!reduced) start(); });
    });
  }

  /* ---------- Tabs (marcas): visual only ---------- */
  var tabs = document.querySelectorAll(".gama-tabs .t");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.remove("on"); });
      t.classList.add("on");
    });
  });
})();
