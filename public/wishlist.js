/* HOMEA v2 — wishlist.js
   Wishlist en localStorage (sin cuenta): corazones en tarjetas de producto y
   ficha, badge en el corazón del nav y la PÁGINA /wishlist (wishlist.html en el
   preview), que lista las piezas guardadas con filtros por marca y tipo, orden,
   "Agregar a mi proyecto" y cotización por WhatsApp. Ya no hay cajón lateral
   (Carla, 2026-10-08): el corazón del nav navega a la página.

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
     de Shopify, para que "Agregar a mi proyecto" funcione desde la página. */
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
        vid: btn.getAttribute("data-wl-vid") || ""
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
        vid: ""
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
  function fmt(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- Página /wishlist ---------- */
  var filtros = { marca: "", tipo: "" };
  var orden = "reciente";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

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

  function grupoChips(titulo, clave, valores) {
    if (valores.length < 2) return "";
    return '<div class="wlp-fgroup" role="group" aria-label="' + esc(titulo) + '">' +
      '<span class="wlp-flbl">' + esc(titulo) + '</span>' +
      valores.map(function (x) {
        var on = filtros[clave] === x.v;
        return '<button type="button" class="wlp-chip' + (on ? " is-on" : "") +
          '" data-wl-f="' + esc(clave) + '" data-wl-v="' + esc(x.v) + '" aria-pressed="' + on + '">' +
          esc(x.v) + ' <span class="n figures">' + x.n + '</span></button>';
      }).join("") + '</div>';
  }

  function aplicar(items) {
    var lista = items.filter(function (it) {
      if (filtros.marca && it.brand !== filtros.marca) return false;
      if (filtros.tipo && tipoDe(it) !== filtros.tipo) return false;
      return true;
    });
    var dir = orden === "precio-desc" ? -1 : 1;
    if (orden === "precio-asc" || orden === "precio-desc") {
      lista.sort(function (a, b) {
        var pa = precioDe(a).monto, pb = precioDe(b).monto;
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        return (pa - pb) * dir;
      });
    } else if (orden === "marca") {
      lista.sort(function (a, b) {
        return a.brand.localeCompare(b.brand, "es") || nombreCorto(a).localeCompare(nombreCorto(b), "es");
      });
    } else {
      /* Recientes primero (las piezas sin marca de tiempo se quedan al final, en su orden). */
      lista.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    }
    return lista;
  }

  function tarjeta(it) {
    var serie = serieDe(it);
    var precio = precioDe(it);
    var precioHtml = isNaN(precio.monto)
      ? '<span class="price-note">Precio a consultar</span>'
      : '<span class="price-tag figures">' + fmt(precio.monto) +
        (precio.moneda ? '<span class="currency">' + esc(precio.moneda) + '</span>' : "") +
        '</span><span class="price-note">IVA incluido</span>';
    var agregar = it.id
      ? '<button type="button" class="btn btn-primary btn-sm cart-add" data-cart-sku="' + esc(it.id) +
        '" data-cart-vid="' + esc(it.vid || "") + '">Agregar a mi proyecto</button>'
      : "";
    return '<div class="pcard wlp-card" data-wl-card="' + esc(it.id) + '">' +
      '<a class="imgw cutout" href="' + esc(it.href) + '" aria-label="' + esc(nombreCorto(it)) + '">' +
      (it.img ? '<img src="' + esc(it.img) + '" alt="' + esc(nombreCorto(it)) + '" loading="lazy" decoding="async">' : "") +
      '</a>' +
      '<button type="button" class="wl-remove wlp-x" data-id="' + esc(it.id) + '" aria-label="Quitar ' + esc(nombreCorto(it)) + '">&times;</button>' +
      '<div class="body">' +
      '<div class="pcard-head"><span class="brand">' + esc(it.brand) + '</span>' +
      (serie ? '<span class="pcard-serie">' + esc(serie) + '</span>' : "") + '</div>' +
      '<h3 class="pcard-name"><a href="' + esc(it.href) + '">' + esc(nombreCorto(it)) + '</a></h3>' +
      (it.id ? '<span class="pcard-sku figures"><span class="pcard-sku-lbl">Modelo</span>' + esc(it.id) + '</span>' : "") +
      '<div class="pcard-price">' + precioHtml + '</div>' +
      '<div class="wlp-actions">' + agregar + '</div>' +
      '</div></div>';
  }

  function renderPage() {
    var root = document.querySelector("[data-wl-page]");
    if (!root) return;
    var items = read();
    var vacio = root.querySelector("[data-wl-vacio]");
    var lleno = root.querySelector("[data-wl-lleno]");
    var total = root.querySelector("[data-wl-total]");
    var fbar = root.querySelector("[data-wl-filtros]");
    var grid = root.querySelector("[data-wl-grid]");
    var cta = root.querySelector("[data-wl-cta]");
    var vis = root.querySelector("[data-wl-visibles]");
    var sinRes = root.querySelector("[data-wl-sin-resultados]");

    /* Filtros que ya no aplican (se quitó la última pieza de esa marca) se sueltan. */
    if (filtros.marca && !items.some(function (it) { return it.brand === filtros.marca; })) filtros.marca = "";
    if (filtros.tipo && !items.some(function (it) { return tipoDe(it) === filtros.tipo; })) filtros.tipo = "";

    if (total) total.textContent = items.length + (items.length === 1 ? " pieza" : " piezas");
    if (vacio) vacio.hidden = items.length > 0;
    if (lleno) lleno.hidden = items.length === 0;
    if (!items.length) return;

    var lista = aplicar(items);

    if (fbar) {
      var marcas = conteo(items, function (it) { return it.brand; });
      var tipos = conteo(items, function (it) { return tipoDe(it); });
      var hayFiltros = marcas.length > 1 || tipos.length > 1;
      var activos = (filtros.marca ? 1 : 0) + (filtros.tipo ? 1 : 0);
      fbar.innerHTML =
        '<div class="wlp-fgroups">' +
        grupoChips("Marca", "marca", marcas) +
        grupoChips("Tipo", "tipo", tipos) +
        (activos ? '<button type="button" class="wlp-clear" data-wl-clear>Ver todas</button>' : "") +
        '</div>' +
        (items.length > 1
          ? '<label class="wlp-sort"><span>Ordenar</span><select data-wl-sort>' +
            [["reciente", "Agregadas recientemente"], ["precio-asc", "Precio: menor a mayor"],
             ["precio-desc", "Precio: mayor a menor"], ["marca", "Marca A–Z"]].map(function (o) {
              return '<option value="' + o[0] + '"' + (orden === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
            }).join("") + '</select></label>'
          : "");
      fbar.hidden = !hayFiltros && items.length < 2;
    }

    if (vis) vis.textContent = lista.length === items.length
      ? ""
      : lista.length + " de " + items.length;
    if (grid) grid.innerHTML = lista.map(tarjeta).join("");
    if (sinRes) sinRes.hidden = lista.length > 0;
    if (cta) {
      cta.hidden = lista.length === 0;
      var a = cta.querySelector("[data-wl-wa]");
      if (a) a.href = waHref(lista);
      /* "Agregar" manda al proyecto las piezas visibles (respeta el filtro);
         CarritoProvider lee data-cart-items y las agrega una por una. */
      var add = cta.querySelector("[data-wl-add-all]");
      if (add) {
        add.setAttribute("data-cart-items", JSON.stringify(lista.filter(function (it) { return it.id; })
          .map(function (it) { return { vid: it.vid || "", sku: it.id }; })));
      }
      var lbl = cta.querySelector("[data-wl-cta-n]");
      if (lbl) lbl.textContent = lista.length === items.length
        ? "las " + lista.length + (lista.length === 1 ? " pieza" : " piezas")
        : "estas " + lista.length + (lista.length === 1 ? " pieza" : " piezas");
    }
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
    var chip = ev.target.closest(".wlp-chip");
    if (chip) {
      var f = chip.getAttribute("data-wl-f"), v = chip.getAttribute("data-wl-v");
      filtros[f] = filtros[f] === v ? "" : v;
      renderPage();
      return;
    }
    if (ev.target.closest("[data-wl-clear]")) {
      filtros.marca = ""; filtros.tipo = "";
      renderPage();
    }
  }, true);

  document.addEventListener("change", function (ev) {
    var sel = ev.target && ev.target.closest ? ev.target.closest("[data-wl-sort]") : null;
    if (!sel) return;
    orden = sel.value;
    renderPage();
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
