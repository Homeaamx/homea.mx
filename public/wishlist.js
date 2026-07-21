/* HOMEA v2 — wishlist.js
   Wishlist en localStorage (sin cuenta): corazones en tarjetas de producto,
   badge en el botón WISHLIST del nav y drawer lateral con CTA de cotización
   por WhatsApp. Todo con listeners DELEGADOS en document (capture) para
   sobrevivir la navegación SPA de Next (PreviewRouter reemplaza <main> y el
   nav); un MutationObserver re-sincroniza corazones y badges tras cada
   re-render. El drawer se inyecta una sola vez en <body>, fuera de React. */
(function () {
  "use strict";

  var KEY = "homea:wishlist:v1";
  var WA_PHONE = "524461446318";

  /* ---------- Store ---------- */
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    sync();
  }
  function has(id) { return read().some(function (it) { return it.id === id; }); }
  function remove(id) {
    write(read().filter(function (it) { return it.id !== id; }));
  }

  function text(root, sel) {
    var el = root.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  /* Los datos del producto se leen de la tarjeta (.pcard) que contiene el
     corazón; el botón sólo declara data-wl-id (el modelo). En la ficha (PDP)
     no hay .pcard: el botón declara todos los campos como data-wl-*. */
  function harvest(btn) {
    if (btn.hasAttribute("data-wl-name")) {
      return {
        id: btn.getAttribute("data-wl-id"),
        brand: btn.getAttribute("data-wl-brand") || "",
        name: btn.getAttribute("data-wl-name") || "",
        spec: btn.getAttribute("data-wl-spec") || "",
        price: btn.getAttribute("data-wl-price") || "",
        img: btn.getAttribute("data-wl-img") || "",
        href: btn.getAttribute("data-wl-href") || location.pathname
      };
    }
    var card = btn.closest(".pcard");
    if (!card) return null;
    var img = card.querySelector(".imgw img");
    return {
      id: btn.getAttribute("data-wl-id"),
      brand: text(card, ".brand"),
      name: text(card, "h3"),
      spec: text(card, ".dotlist"),
      price: text(card, ".price-tag").replace("USD", " USD"),
      img: img ? img.getAttribute("src") : "",
      href: card.getAttribute("href") || "#"
    };
  }

  function toggle(btn) {
    var id = btn.getAttribute("data-wl-id");
    if (!id) return;
    if (has(id)) { remove(id); return; }
    var item = harvest(btn);
    if (!item) return;
    var items = read();
    items.push(item);
    write(items);
    btn.classList.add("pop");
    setTimeout(function () { btn.classList.remove("pop"); }, 450);
  }

  /* ---------- Drawer (una sola vez, fuera de React) ---------- */
  var overlay, drawer;
  function ensureDrawer() {
    if (drawer) return;
    overlay = document.createElement("div");
    overlay.className = "wl-overlay";
    overlay.setAttribute("data-wl-close", "");
    overlay.hidden = true;

    drawer = document.createElement("aside");
    drawer.className = "wl-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Wishlist");
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="wl-head">' +
      '  <div>' +
      '    <div class="eyebrow">Wishlist · <span class="wl-headcount figures">0</span></div>' +
      '    <h3 class="wl-title">Tu <i>selección</i>.</h3>' +
      '  </div>' +
      '  <button class="wl-x" type="button" data-wl-close aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="wl-list" role="list"></div>' +
      '<div class="wl-foot">' +
      '  <a class="wl-wa" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="wa_wishlist">Cotizar esta lista por WhatsApp <span class="ar">→</span></a>' +
      '  <p class="wl-note">Respuesta promedio en 2 horas · Showroom en Querétaro.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  /* Link al catálogo para el estado vacío: se toma del propio DOM (mega-menú),
     así apunta a categoria-*.html en el preview estático y a /productos/* en Next. */
  function catalogHref() {
    var a = document.querySelector(
      'a[href$="categoria-cocina-y-bar.html"], a[href="/productos/cocina-y-bar"]'
    );
    return a ? a.getAttribute("href") : "#";
  }

  function waHref(items) {
    var lines = items.map(function (it) {
      return "• " + it.brand + " " + it.name +
        (it.id ? " (mod. " + it.id + ")" : "") +
        (it.price ? " — " + it.price : "");
    });
    var msg = "¡Hola! Me interesa cotizar estas piezas de mi wishlist:\n" +
      lines.join("\n");
    return "https://api.whatsapp.com/send/?phone=" + WA_PHONE +
      "&text=" + encodeURIComponent(msg);
  }

  function renderList() {
    if (!drawer) return;
    var items = read();
    var list = drawer.querySelector(".wl-list");
    var foot = drawer.querySelector(".wl-foot");
    var head = drawer.querySelector(".wl-headcount");
    head.textContent = items.length;
    list.textContent = "";

    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "wl-empty";
      empty.innerHTML =
        '<p>Aún no guardas piezas.</p>' +
        '<p class="wl-empty-sub">Toca el corazón de un producto para armar tu lista y cotizarla en un solo paso.</p>';
      var go = document.createElement("a");
      go.className = "arrow-link";
      go.href = catalogHref();
      go.innerHTML = 'Explorar Cocina y Bar <span class="ln"></span><span class="ar">→</span>';
      empty.appendChild(go);
      list.appendChild(empty);
      foot.hidden = true;
      return;
    }

    items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "wl-item";
      row.setAttribute("role", "listitem");

      var thumb = document.createElement("a");
      thumb.className = "wl-thumb";
      thumb.href = it.href;
      if (it.img) {
        var img = document.createElement("img");
        img.src = it.img;
        img.alt = it.name;
        img.loading = "lazy";
        thumb.appendChild(img);
      }

      var info = document.createElement("div");
      info.className = "wl-info";
      var brand = document.createElement("span");
      brand.className = "wl-brand";
      brand.textContent = it.brand;
      var name = document.createElement("a");
      name.className = "wl-name";
      name.href = it.href;
      name.textContent = it.name;
      var spec = document.createElement("span");
      spec.className = "wl-spec";
      spec.textContent = it.spec;
      var price = document.createElement("span");
      price.className = "wl-price figures";
      price.textContent = it.price;
      info.appendChild(brand);
      info.appendChild(name);
      info.appendChild(spec);
      info.appendChild(price);

      var rm = document.createElement("button");
      rm.className = "wl-remove";
      rm.type = "button";
      rm.setAttribute("data-id", it.id);
      rm.setAttribute("aria-label", "Quitar " + it.name);
      rm.innerHTML = "&times;";

      row.appendChild(thumb);
      row.appendChild(info);
      row.appendChild(rm);
      list.appendChild(row);
    });

    foot.hidden = false;
    foot.querySelector(".wl-wa").href = waHref(items);
  }

  function openDrawer() {
    ensureDrawer();
    renderList();
    overlay.hidden = false;
    drawer.hidden = false;
    /* setTimeout y no rAF: en pestañas sin foco rAF queda suspendido
       y el drawer se quedaría fuera de pantalla. */
    setTimeout(function () {
      overlay.classList.add("open");
      drawer.classList.add("open");
    }, 20);
    document.documentElement.classList.add("wl-lock");
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    document.documentElement.classList.remove("wl-lock");
    setTimeout(function () { overlay.hidden = true; drawer.hidden = true; }, 260);
  }

  /* ---------- Sync: badges del nav + estado de corazones ---------- */
  function sync() {
    var n = read().length;
    document.querySelectorAll(".wl-count").forEach(function (b) {
      /* Escrituras condicionadas: escribir siempre dispararía al
         MutationObserver y entraría en bucle de re-render. */
      var t = String(n);
      if (b.textContent !== t) b.textContent = t;
      if (b.hidden !== (n === 0)) b.hidden = n === 0;
    });
    document.querySelectorAll(".nav-ic.wl-open").forEach(function (a) {
      a.classList.toggle("has-items", n > 0);
    });
    document.querySelectorAll(".wl-heart").forEach(function (h) {
      var on = has(h.getAttribute("data-wl-id"));
      h.classList.toggle("on", on);
      var pressed = on ? "true" : "false";
      if (h.getAttribute("aria-pressed") !== pressed) h.setAttribute("aria-pressed", pressed);
    });
    if (drawer && !drawer.hidden) renderList();
  }

  /* ---------- Eventos delegados (capture: gana al interceptor SPA) ---------- */
  document.addEventListener("click", function (ev) {
    if (!ev.target || !ev.target.closest) return;
    var heart = ev.target.closest(".wl-heart");
    if (heart) {
      ev.preventDefault();
      ev.stopPropagation();
      toggle(heart);
      return;
    }
    if (ev.target.closest(".wl-open")) {
      ev.preventDefault();
      ev.stopPropagation();
      openDrawer();
      return;
    }
    var rm = ev.target.closest(".wl-remove");
    if (rm) { remove(rm.getAttribute("data-id")); return; }
    if (ev.target.closest("[data-wl-close]")) { closeDrawer(); return; }
    /* Navegar desde un link del drawer: cerrarlo para no taparlo en SPA. */
    if (ev.target.closest(".wl-drawer a")) closeDrawer();
  }, true);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeDrawer();
  });

  /* Re-render SPA (nav o <main> reemplazados por React) → re-sincronizar. */
  var pending = null;
  /* Ignora mutaciones del propio drawer/overlay: re-renderizarse a sí mismo
     dispararía el observer en bucle y los botones internos morirían al instante. */
  var mo = new MutationObserver(function (muts) {
    var external = muts.some(function (m) {
      return !(drawer && drawer.contains(m.target)) &&
             !(overlay && overlay.contains(m.target));
    });
    if (!external || pending) return;
    pending = setTimeout(function () { pending = null; sync(); }, 80);
  });

  function init() {
    ensureDrawer();
    sync();
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
