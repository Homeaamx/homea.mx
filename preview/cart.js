/* HOMEA v2 — cart.js
   Carrito fase piloto (5 Gaggenau): localStorage + drawer lateral. El pago
   real usa CART PERMALINKS de Shopify (homeashop.mx/cart/VID:QTY,...) — no
   requiere Storefront API; Shopify calcula IVA y envío en su checkout.
   Misma arquitectura que wishlist.js: listeners delegados en capture (ganan
   al interceptor SPA) + MutationObserver para re-sincronizar badges tras
   cada re-render de React. El drawer vive en <body>, fuera de React. */
(function () {
  "use strict";

  var KEY = "homea:cart:v1";
  var SHOP = "https://homeashop.mx";
  var WA_PHONE = "524461446318";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    sync();
  }
  function count() {
    return read().reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function mxn(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MXN";
  }

  function addFromBtn(btn) {
    var items = read();
    var sku = btn.getAttribute("data-cart-sku");
    var found = items.filter(function (it) { return it.sku === sku; })[0];
    if (found) { found.qty += 1; }
    else {
      items.push({
        sku: sku,
        vid: btn.getAttribute("data-cart-vid"),
        name: btn.getAttribute("data-cart-name") || "",
        brand: btn.getAttribute("data-cart-brand") || "",
        spec: btn.getAttribute("data-cart-spec") || "",
        mxn: parseFloat(btn.getAttribute("data-cart-mxn")) || 0,
        usd: btn.getAttribute("data-cart-usd") || "",
        img: btn.getAttribute("data-cart-img") || "",
        href: btn.getAttribute("data-cart-href") || location.pathname,
        qty: 1
      });
    }
    write(items);
    openDrawer();
  }

  function setQty(sku, qty) {
    var items = read();
    items = items.map(function (it) {
      if (it.sku === sku) it.qty = qty;
      return it;
    }).filter(function (it) { return it.qty > 0; });
    write(items);
  }

  /* ---------- Drawer ---------- */
  var overlay, drawer;
  function ensureDrawer() {
    if (drawer) return;
    overlay = document.createElement("div");
    overlay.className = "wl-overlay";
    overlay.setAttribute("data-cart-close", "");
    overlay.hidden = true;

    drawer = document.createElement("aside");
    drawer.className = "wl-drawer cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Carrito");
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="wl-head">' +
      '  <div>' +
      '    <div class="eyebrow">Carrito · <span class="cart-headcount figures">0</span></div>' +
      '    <h3 class="wl-title">Tu <i>carrito</i>.</h3>' +
      '  </div>' +
      '  <button class="wl-x" type="button" data-cart-close aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="wl-list" role="list"></div>' +
      '<div class="wl-foot">' +
      '  <div class="cart-subtotal"><span>Subtotal</span><span class="cart-subtotal-num figures"></span></div>' +
      '  <p class="cart-tax-note">El IVA y el envío se calculan en el pago · Precios MXN (FIX 17.43).</p>' +
      '  <a class="wl-wa cart-checkout" target="_blank" rel="noopener">Finalizar compra <span class="ar">→</span></a>' +
      '  <a class="arrow-link cart-wa-alt" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="wa_cart">Prefiero cotizar por WhatsApp <span class="ln"></span><span class="ar">→</span></a>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  function checkoutHref(items) {
    var parts = items.map(function (it) { return it.vid + ":" + it.qty; });
    return SHOP + "/cart/" + parts.join(",");
  }
  function waHref(items) {
    var lines = items.map(function (it) {
      return "• " + (it.qty > 1 ? it.qty + " × " : "") + it.brand + " " + it.name +
        " (mod. " + it.sku + ")" + (it.usd ? " — " + it.usd : "");
    });
    var msg = "¡Hola! Quiero cotizar mi carrito:\n" + lines.join("\n");
    return "https://api.whatsapp.com/send/?phone=" + WA_PHONE + "&text=" + encodeURIComponent(msg);
  }

  function renderList() {
    if (!drawer) return;
    var items = read();
    var list = drawer.querySelector(".wl-list");
    var foot = drawer.querySelector(".wl-foot");
    drawer.querySelector(".cart-headcount").textContent = count();
    list.textContent = "";

    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "wl-empty";
      empty.innerHTML =
        '<p>Tu carrito está vacío.</p>' +
        '<p class="wl-empty-sub">Las piezas del piloto Gaggenau se pueden comprar en línea; el resto del catálogo se cotiza con un especialista.</p>';
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
        img.src = it.img; img.alt = it.name; img.loading = "lazy";
        thumb.appendChild(img);
      }

      var info = document.createElement("div");
      info.className = "wl-info";
      var brand = document.createElement("span");
      brand.className = "wl-brand"; brand.textContent = it.brand;
      var name = document.createElement("a");
      name.className = "wl-name"; name.href = it.href; name.textContent = it.name;
      var price = document.createElement("span");
      price.className = "wl-price figures";
      price.textContent = mxn(it.mxn * it.qty) + (it.qty > 1 ? " · " + it.qty + " pzas" : "");

      var qty = document.createElement("div");
      qty.className = "cart-qty";
      qty.innerHTML =
        '<button type="button" class="cart-q" data-q="-1" data-sku="' + it.sku + '" aria-label="Quitar una">−</button>' +
        '<span class="figures">' + it.qty + '</span>' +
        '<button type="button" class="cart-q" data-q="1" data-sku="' + it.sku + '" aria-label="Agregar una">+</button>';

      info.appendChild(brand);
      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(qty);

      var rm = document.createElement("button");
      rm.className = "wl-remove cart-remove";
      rm.type = "button";
      rm.setAttribute("data-sku", it.sku);
      rm.setAttribute("aria-label", "Quitar " + it.name);
      rm.innerHTML = "&times;";

      row.appendChild(thumb);
      row.appendChild(info);
      row.appendChild(rm);
      list.appendChild(row);
    });

    var subtotal = items.reduce(function (s, it) { return s + it.mxn * it.qty; }, 0);
    foot.hidden = false;
    drawer.querySelector(".cart-subtotal-num").textContent = mxn(subtotal);
    drawer.querySelector(".cart-checkout").href = checkoutHref(items);
    drawer.querySelector(".cart-wa-alt").href = waHref(items);
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

  /* ---------- Sync ---------- */
  function sync() {
    var n = count();
    document.querySelectorAll(".cart-count").forEach(function (b) {
      /* Escrituras condicionadas: escribir siempre dispararía al
         MutationObserver y entraría en bucle de re-render. */
      var t = String(n);
      if (b.textContent !== t) b.textContent = t;
      if (b.hidden !== (n === 0)) b.hidden = n === 0;
    });
    document.querySelectorAll(".nav-ic.cart-open").forEach(function (a) {
      a.classList.toggle("has-items", n > 0);
    });
    if (drawer && !drawer.hidden) renderList();
  }

  /* ---------- Eventos delegados (capture) ---------- */
  document.addEventListener("click", function (ev) {
    if (!ev.target || !ev.target.closest) return;
    var add = ev.target.closest(".cart-add");
    if (add) { ev.preventDefault(); ev.stopPropagation(); addFromBtn(add); return; }
    if (ev.target.closest(".cart-open")) {
      ev.preventDefault(); ev.stopPropagation(); openDrawer(); return;
    }
    var q = ev.target.closest(".cart-q");
    if (q) {
      var sku = q.getAttribute("data-sku");
      var item = read().filter(function (it) { return it.sku === sku; })[0];
      if (item) setQty(sku, item.qty + parseInt(q.getAttribute("data-q"), 10));
      return;
    }
    var rm = ev.target.closest(".cart-remove");
    if (rm) { setQty(rm.getAttribute("data-sku"), 0); return; }
    if (ev.target.closest("[data-cart-close]")) { closeDrawer(); return; }
    if (ev.target.closest(".cart-drawer a.wl-name, .cart-drawer a.wl-thumb")) closeDrawer();
  }, true);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeDrawer();
  });

  var pending = null;
  /* Ignora mutaciones del propio drawer/overlay (evita el bucle de re-render). */
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
