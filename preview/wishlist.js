/* HOMEA v2 — wishlist.js
   Wishlist en localStorage (sin cuenta): corazones en tarjetas de producto y
   ficha, badge en el corazón del nav y la PÁGINA /wishlist (wishlist.html en el
   preview). Ya no hay cajón lateral (Carla, 2026-10-08): el corazón del nav
   navega a la página.

   La página (Carla, 2026-10-09) se ve IGUAL que una página de producto: es un
   `.plp` con las mismas tarjetas que genera lib/shopify/htmlCatalogo.ts y los
   filtros los aplica public/catalogo.js (casillas data-fk, "Ver N piezas",
   chips, conteos, orden). Aquí solo se PINTA el markup compatible:
     · barra lateral: Disponibilidad y Promoción;
     · arriba, desplegables: Tipo de producto, Marca y Precio (con "Listo");
     · a la derecha, el orden de las páginas de producto.

   Todo con listeners DELEGADOS en document (capture) para sobrevivir la
   navegación SPA de Next (PreviewRouter reemplaza <main> y el nav); un
   MutationObserver re-sincroniza corazones, badges y la página tras cada
   re-render. */
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

  /* Los datos del producto se leen del botón (data-wl-*), que en el catálogo
     vivo declara todos los campos; en las tarjetas estáticas del preview se
     leen de la tarjeta (.pcard) que contiene el corazón. `vid` es la variante
     de Shopify, para que "Agregar a mi proyecto" funcione desde la página;
     `stock`, `was` y `mxn` alimentan los filtros de la página (2026-10-09). */
  function harvest(btn) {
    var item;
    if (btn.hasAttribute("data-wl-name")) {
      item = {
        id: btn.getAttribute("data-wl-id"),
        brand: btn.getAttribute("data-wl-brand") || "",
        name: btn.getAttribute("data-wl-name") || "",
        spec: btn.getAttribute("data-wl-spec") || "",
        price: btn.getAttribute("data-wl-price") || "",
        img: btn.getAttribute("data-wl-img") || "",
        href: btn.getAttribute("data-wl-href") || location.pathname,
        tipo: btn.getAttribute("data-wl-tipo") || "",
        vid: btn.getAttribute("data-wl-vid") || "",
        stock: btn.getAttribute("data-wl-stock") === "1",
        was: btn.getAttribute("data-wl-was") || "",
        mxn: parseFloat(btn.getAttribute("data-wl-mxn")) || 0
      };
    } else {
      var card = btn.closest(".pcard");
      if (!card) return null;
      var img = card.querySelector(".imgw img");
      item = {
        id: btn.getAttribute("data-wl-id"),
        brand: text(card, ".brand"),
        name: text(card, "h3"),
        spec: text(card, ".dotlist"),
        price: text(card, ".price-tag").replace("USD", " USD"),
        img: img ? img.getAttribute("src") : "",
        href: card.getAttribute("href") || "#",
        tipo: "",
        vid: "",
        stock: /en stock/i.test(text(card, ".pcard-tag")),
        was: text(card, ".price-was"),
        mxn: parseFloat(card.getAttribute("data-precio")) || 0
      };
    }
    /* Respaldo: el botón "Agregar a mi proyecto" de la misma página conoce la variante. */
    if (!item.vid && item.id) {
      var add = document.querySelector('.cart-add[data-cart-sku="' + item.id + '"]');
      if (add) item.vid = add.getAttribute("data-cart-vid") || "";
    }
    item.ts = Date.now();
    return item;
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

  /* ---------- Derivados de cada pieza ---------- */
  function serieDe(it) {
    var partes = (it.name || "").split(" — ");
    return partes.length > 1 ? partes.slice(1).join(" — ").trim() : "";
  }
  function nombreCorto(it) { return (it.name || "").split(" — ")[0].trim(); }
  /* Tipo: lo anota el corazón del catálogo vivo; si no, el primer dato de la
     línea corta ("Columna · 24" · Panelable" → "Columna"). */
  function tipoDe(it) {
    if (it.tipo) return it.tipo;
    var primero = (it.spec || "").split(" · ")[0].trim();
    return primero && primero !== it.id ? primero : "";
  }
  /* "$27,044.35 USD IVA incluido" → { monto: 27044.35, moneda: "USD" } */
  function precioDe(it) {
    var m = /\$?\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})?/.exec(it.price || "");
    return {
      monto: m ? parseFloat(m[1].replace(/,/g, "")) : NaN,
      moneda: m && m[2] ? m[2] : ""
    };
  }
  /* Precio en pesos para el filtro de precio y el orden: el que anotó el
     corazón; si la pieza se guardó antes, dólares × tipo de cambio de la barra. */
  function tipoCambioBarra() {
    var el = document.querySelector("#u-fx strong");
    var v = el ? parseFloat(el.textContent.replace(/,/g, "")) : NaN;
    return isNaN(v) ? parseFloat((document.querySelector("#u-fx") || {}).getAttribute ? document.querySelector("#u-fx").getAttribute("data-fx-fallback") : "") || 17.43 : v;
  }
  function pesosDe(it) {
    if (it.mxn) return it.mxn;
    var p = precioDe(it);
    if (isNaN(p.monto)) return 0;
    return p.moneda === "USD" ? p.monto * tipoCambioBarra() : p.monto;
  }
  function fmt(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPesos(n) { return "$" + Math.round(n).toLocaleString("es-MX"); }
  /* Mismo slug que lib/shopify/htmlCatalogo.ts (slugValor). */
  function slug(v) {
    return String(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Página /wishlist ---------- */
  var CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.9 13a4.8 4.8 0 0 1 0-6.8 4.7 4.7 0 0 1 6.7 0l.4.4.4-.4a4.7 4.7 0 0 1 6.7 0 4.8 4.8 0 0 1 0 6.8Z"/></svg>';

  function waHref(items) {
    var lines = items.map(function (it) {
      return "• " + it.brand + " " + nombreCorto(it) +
        (it.id ? " (mod. " + it.id + ")" : "") +
        (it.price ? " — " + it.price : "");
    });
    var msg = "¡Hola! Me interesa cotizar estas piezas de mi wishlist:\n" +
      lines.join("\n");
    return "https://api.whatsapp.com/send/?phone=" + WA_PHONE +
      "&text=" + encodeURIComponent(msg);
  }

  function conteo(items, fn) {
    var m = {};
    items.forEach(function (it) {
      var v = fn(it);
      if (v) m[v] = (m[v] || 0) + 1;
    });
    return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, "es"); })
      .map(function (k) { return { v: k, n: m[k] }; });
  }

  /* "Gaggenau" / "Gaggenau y Miele" / "Gaggenau, Miele y 2 más". */
  function enumerar(valores) {
    if (!valores.length) return "—";
    if (valores.length === 1) return valores[0];
    if (valores.length === 2) return valores[0] + " y " + valores[1];
    return valores[0] + ", " + valores[1] + " y " + (valores.length - 2) + " más";
  }

  /* Rangos de precio proporcionales, como rangosPrecio() del servidor. */
  function redondo(v) {
    var mag = Math.pow(10, Math.max(3, Math.floor(Math.log10(Math.max(v, 1))) - 1));
    return Math.round(v / mag) * mag;
  }
  function rangosPrecio(precios) {
    var v = precios.filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; });
    if (v.length < 2) return [];
    var k = Math.min(4, v.length), cortes = [];
    for (var i = 1; i < k; i++) {
      var c = redondo(v[Math.floor((i * v.length) / k)]);
      if (c > (cortes[cortes.length - 1] || 0) && c < v[v.length - 1]) cortes.push(c);
    }
    if (!cortes.length) return [];
    var tope = Math.floor(v[v.length - 1] / 1000) * 1000 + 1000;
    return [0].concat(cortes).map(function (lo, j) { return { lo: lo, hi: cortes[j] || tope }; });
  }

  /* Una casilla del panel (misma estructura que lib/shopify/htmlCatalogo.ts). */
  function casilla(clave, valor, etiqueta, n, figuras) {
    return '<label><input type="checkbox" data-fk="' + esc(clave) + '" value="' + esc(valor) + '"> ' +
      '<span class="flbl' + (figuras ? " figures" : "") + '">' + esc(etiqueta) + '</span> ' +
      '<span class="count figures">' + n + '</span></label>';
  }
  function grupoLateral(nombre, clave, etiquetas) {
    return '<details class="fgroup fgroup--acc" data-fgroup="' + esc(clave) + '" open>' +
      '<summary class="fgroup-sum"><h6>' + esc(nombre) + ' <span class="fsel figures" data-fsel hidden>0</span></h6><span class="fgroup-caret" aria-hidden="true"></span></summary>' +
      '<div class="fopts">' + etiquetas + '</div></details>';
  }
  function desplegable(nombre, clave, etiquetas, ocultarCero) {
    return '<details class="fgroup fdrop" data-fgroup="' + esc(clave) + '"' + (ocultarCero ? " data-ocultar-cero" : "") + '>' +
      '<summary class="fdrop-sum"><h6>' + esc(nombre) + ' <span class="fsel figures" data-fsel hidden>0</span></h6><span class="fdrop-caret" aria-hidden="true"></span></summary>' +
      '<div class="fdrop-panel"><div class="fopts">' + etiquetas + '</div>' +
      '<button type="button" class="fdrop-done" data-cat-apply data-wl-done>Listo</button></div></details>';
  }

  /* Tarjeta IGUAL a la del catálogo (tarjetaHtml en htmlCatalogo.ts), con los
     data-* que lee catalogo.js: precio en pesos, stock, tipo y valores de filtro. */
  function tarjeta(it, orden) {
    var serie = serieDe(it);
    var precio = precioDe(it);
    var tipo = tipoDe(it);
    var precioHtml = isNaN(precio.monto)
      ? '<div class="pcard-price"><span class="price-note">Precio a consultar</span></div>'
      : '<div class="pcard-price"><span class="price-tag figures">' + fmt(precio.monto) +
        (precio.moneda ? '<span class="currency">' + esc(precio.moneda) + '</span>' : "") + '</span>' +
        (it.was ? '<s class="price-was figures">' + esc(it.was) + '</s>' : "") +
        '<span class="price-note">IVA incluido</span></div>';
    var stock = it.stock
      ? '<span class="pcard-tag is-stock">EN STOCK</span>'
      : '<span class="pcard-tag is-pedido">Bajo pedido</span>';
    return '<a class="pcard" href="' + esc(it.href) + '" data-cat-card data-orden="' + orden + '"' +
      ' data-precio="' + pesosDe(it) + '" data-stock="' + (it.stock ? 1 : 0) + '"' +
      ' data-tipo="' + esc(slug(tipo)) + '" data-fv-marca="' + esc(slug(it.brand)) + '"' +
      ' data-fv-stock="' + (it.stock ? "en-stock" : "bajo-pedido") + '"' +
      ' data-fv-promo="' + (it.was ? "en-promocion" : "precio-regular") + '">' +
      '<div class="imgw cutout">' +
      (it.img ? '<img src="' + esc(it.img) + '" alt="' + esc(nombreCorto(it)) + '" loading="lazy" decoding="async">' : "") +
      '</div>' +
      '<div class="body">' +
      '<div class="pcard-top">' + stock +
      '<button class="wl-heart on" type="button" data-wl-id="' + esc(it.id) + '" aria-label="Quitar de la wishlist" aria-pressed="true">' + CORAZON + '</button></div>' +
      '<div class="pcard-head"><span class="brand">' + esc(it.brand) + '</span>' +
      (serie ? '<span class="pcard-serie">' + esc(serie) + '</span>' : "") + '</div>' +
      '<h3 class="pcard-name">' + esc(nombreCorto(it)) + '</h3>' +
      (it.id ? '<span class="pcard-sku figures">' + esc(it.id) + '</span>' : "") +
      precioHtml +
      '</div></a>';
  }

  /* Qué casillas están marcadas (para conservarlas al repintar). */
  function marcadas(root) {
    var m = {};
    root.querySelectorAll(".filters input[data-fk]:checked").forEach(function (cb) {
      m[cb.getAttribute("data-fk") + "|" + cb.value] = true;
    });
    return m;
  }

  var firma = null;

  function renderPage() {
    var root = document.querySelector("[data-wl-page]");
    if (!root) return;
    var items = read();
    var vacio = root.querySelector("[data-wl-vacio]");
    var lleno = root.querySelector("[data-wl-lleno]");
    var total = root.querySelector("[data-wl-total]");

    if (total) total.textContent = items.length + (items.length === 1 ? " pieza" : " piezas");
    if (vacio) vacio.hidden = items.length > 0;
    if (lleno) lleno.hidden = items.length === 0;
    if (!items.length) { firma = null; return; }

    /* Se repinta solo si cambió la lista: así catalogo.js conserva lo filtrado y
       el orden elegido entre re-renders del nav. */
    var f = items.map(function (it) { return it.id + ":" + (it.stock ? 1 : 0) + ":" + (it.was ? 1 : 0); }).join(",");
    if (f === firma && root.querySelector("[data-cat-card]")) return;
    firma = f;
    var previas = marcadas(root);

    /* Recientes primero: data-orden es el orden por defecto de catalogo.js. */
    var lista = items.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });

    var lateral = root.querySelector("[data-wl-filtros]");
    if (lateral) {
      var nStock = items.filter(function (it) { return it.stock; }).length;
      var nPromo = items.filter(function (it) { return !!it.was; }).length;
      lateral.innerHTML =
        '<div class="fchips fchips--panel" data-cat-chips hidden></div>' +
        '<div class="fhead"><h6>Filtros</h6></div>' +
        grupoLateral("Disponibilidad", "stock",
          casilla("stock", "en-stock", "En stock", nStock) +
          casilla("stock", "bajo-pedido", "Bajo pedido", items.length - nStock)) +
        grupoLateral("Promoción", "promo",
          casilla("promo", "en-promocion", "En promoción", nPromo) +
          casilla("promo", "precio-regular", "Precio regular", items.length - nPromo)) +
        '<div class="fbar" data-cat-bar hidden>' +
        '<button type="button" class="fbar-apply" data-cat-apply hidden>Ver <span data-cat-n>0</span> piezas</button>' +
        '<button type="button" class="fbar-clear" data-cat-clear>Limpiar filtros</button></div>' +
        '<p class="fnote">Precios con IVA. Las piezas en dólares muestran su equivalente en pesos al tipo de cambio del día.</p>';
    }

    var arriba = root.querySelector("[data-wl-top]");
    if (arriba) {
      var tipos = conteo(items, tipoDe);
      var marcas = conteo(items, function (it) { return it.brand; });
      var pesos = items.map(pesosDe);
      var rangos = rangosPrecio(pesos).map(function (r) {
        var n = pesos.filter(function (x) { return x >= r.lo && x < r.hi; }).length;
        var txt = r.lo === 0 ? "Hasta " + fmtPesos(r.hi) : fmtPesos(r.lo) + " – " + fmtPesos(r.hi);
        return casilla("precio-rango", r.lo + "-" + r.hi, txt, n, true);
      }).join("");
      arriba.innerHTML =
        desplegable("Tipo de producto", "tipo-web", tipos.map(function (t) { return casilla("tipo-web", slug(t.v), t.v, t.n); }).join("") || '<p class="fnote fnote--tight">Sin opciones por ahora.</p>') +
        desplegable("Marca", "marca", marcas.map(function (m) { return casilla("marca", slug(m.v), m.v, m.n); }).join(""), true) +
        desplegable("Precio", "precio", rangos || '<p class="fnote fnote--tight">Agrega más piezas para filtrar por precio.</p>');
    }

    var grid = root.querySelector("[data-wl-grid]");
    if (grid) {
      grid.innerHTML = lista.map(tarjeta).join("") +
        '<p class="plp-aviso" data-cat-vacio hidden style="grid-column:1/-1">Ninguna pieza de tu wishlist coincide con esos filtros.</p>';
    }

    /* Casillas que estaban marcadas antes del repintado. */
    Object.keys(previas).forEach(function (k) {
      var p = k.split("|");
      var cb = root.querySelector('.filters input[data-fk="' + p[0] + '"][value="' + p[1] + '"]');
      if (cb) cb.checked = true;
    });

    var cta = root.querySelector("[data-wl-cta]");
    if (cta) {
      var a = cta.querySelector("[data-wl-wa]");
      if (a) a.href = waHref(lista);
      /* "Agregar a mi proyecto" manda todas las piezas; CarritoProvider lee
         data-cart-items y las agrega una por una. */
      var add = cta.querySelector("[data-wl-add-all]");
      if (add) {
        add.setAttribute("data-cart-items", JSON.stringify(lista.filter(function (it) { return it.id; })
          .map(function (it) { return { vid: it.vid || "", sku: it.id }; })));
      }
      var lbl = cta.querySelector("[data-wl-cta-n]");
      if (lbl) lbl.textContent = "las " + lista.length + (lista.length === 1 ? " pieza" : " piezas");
      var mEl = cta.querySelector("[data-wl-marcas]");
      if (mEl) mEl.textContent = enumerar(marcas ? marcas.map(function (x) { return x.v; }) : []);
      var tEl = cta.querySelector("[data-wl-tipos]");
      if (tEl) tEl.textContent = enumerar(tipos ? tipos.map(function (x) { return x.v; }) : []);
    }

    /* catalogo.js aplica lo marcado y recuenta (misma señal que tipos.js). */
    document.dispatchEvent(new CustomEvent("catalogo:aplicar"));
  }

  /* ---------- Sync: badges del nav + estado de corazones + página ---------- */
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
    renderPage();
  }

  /* Desplegables de arriba: uno abierto a la vez; se cierran con "Listo" o al
     hacer clic fuera. */
  function cerrarDesplegables(salvo) {
    document.querySelectorAll("details.fdrop[open]").forEach(function (d) {
      if (d !== salvo) d.open = false;
    });
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
    var rm = ev.target.closest(".wl-remove");
    if (rm) { remove(rm.getAttribute("data-id")); return; }
    var done = ev.target.closest("[data-wl-done]");
    if (done) {
      var det = done.closest("details.fdrop");
      /* catalogo.js aplica (data-cat-apply); aquí solo se pliega el panel. */
      setTimeout(function () { if (det) det.open = false; }, 0);
      return;
    }
    var sum = ev.target.closest("details.fdrop > summary");
    if (sum) { cerrarDesplegables(sum.parentNode); return; }
    if (!ev.target.closest("details.fdrop")) cerrarDesplegables(null);
  }, true);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") cerrarDesplegables(null);
  });

  /* Re-render SPA (nav o <main> reemplazados por React) → re-sincronizar.
     Se ignoran las mutaciones que provoca la propia página de wishlist al
     pintarse (su raíz [data-wl-page]) para no entrar en bucle. */
  var pending = null;
  var mo = new MutationObserver(function (muts) {
    var external = muts.some(function (m) {
      var page = document.querySelector("[data-wl-page]");
      return !(page && page.contains(m.target) && m.target !== page);
    });
    if (!external || pending) return;
    pending = setTimeout(function () { pending = null; sync(); }, 80);
  });

  function init() {
    sync();
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
