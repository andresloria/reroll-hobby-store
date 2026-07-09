/* ============================================================
   REROLL — página de detalle de carta (/carta/<slug>.html)
   - Lightbox (ampliar imagen)
   - Re-hidrata precio/stock desde productos.json (siempre fresco
     aunque el HTML horneado quede un toque atrás entre rebuilds)
   ============================================================ */
(function () {
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Lightbox ---------- */
  var trigger = document.getElementById("cdImg");
  var light = document.getElementById("cdLight");
  var lightImg = document.getElementById("cdLightImg");
  var lightX = document.getElementById("cdLightX");
  function openLight() {
    if (!trigger || !light) return;
    var im = trigger.querySelector("img");
    lightImg.src = im.getAttribute("data-full") || im.src;
    light.classList.add("open");
    light.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightX && lightX.focus();
  }
  function closeLight() {
    if (!light) return;
    light.classList.remove("open");
    light.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    trigger && trigger.focus();
  }
  trigger && trigger.addEventListener("click", openLight);
  lightX && lightX.addEventListener("click", closeLight);
  light && light.addEventListener("click", function (e) {
    if (e.target === light) closeLight();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && light && light.classList.contains("open")) closeLight();
  });

  /* ---------- Re-hidratar precio + stock ---------- */
  var fmt = function (n) { return "₡" + Number(n || 0).toLocaleString("es-CR"); };
  var pid = document.body.getAttribute("data-pid");
  if (!pid) return;

  /* ---------- Carrito (mismo storage que la tienda) ---------- */
  var CART_KEY = "reroll_cart";
  function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; } }
  function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }
  function lineKey(id, foil) { return foil ? id + "_f" : String(id); }
  function cartCount() { return loadCart().reduce(function (s, l) { return s + (l.qty || 1); }, 0); }
  // agrega la carta actual (respetando Foil + tope de stock); devuelve true/estado
  function addCurrentToCart() {
    if (!prod) return { ok: false, msg: "Cargando…" };
    var foil = isFoil && prod.foil != null;
    var a = variantAvail();
    if (a.count !== null && a.count <= 0) return { ok: false, msg: "Agotado" + (foil ? " en foil" : "") };
    var cart = loadCart();
    var key = lineKey(prod.id, foil);
    var line = cart.find(function (c) { return c.key === key; });
    if (line) {
      if (a.count !== null && line.qty >= a.count) return { ok: false, msg: "Solo hay " + a.count + (foil ? " foil" : "") };
      line.qty++;
    } else {
      var price = foil ? prod.foil : prod.price;
      cart.push({ key: key, id: prod.id, foil: foil, name: prod.name + (foil ? " · Foil" : ""),
        cat: prod.cat, price: price, emoji: prod.emoji, img: prod.img, qty: 1 });
    }
    saveCart(cart);
    return { ok: true, count: cartCount() };
  }

  /* ---------- Toggle Normal / Foil + disponibilidad por variante ---------- */
  var priceEl = document.getElementById("cdPrice");
  var ftoggle = document.getElementById("cdFtoggle");
  var stockEl = document.getElementById("cdStock");
  var isFoil = false;
  var prod = null;
  function normStock(s) { return (s === undefined || s === null || s === "") ? null : Number(s); }
  // stock de la variante elegida: el foil usa su propio stock (stockf) si está definido; si no, sigue el normal
  function variantAvail() {
    var sN = prod ? normStock(prod.stock) : null;
    if (isFoil && prod && prod.foil != null) {
      var sf = normStock(prod.stockf);
      if (sf === null) return { count: sN, out: (sN !== null && sN <= 0) };
      return { count: sf, out: sf <= 0 };
    }
    return { count: sN, out: (sN !== null && sN <= 0) };
  }
  function refreshAvail() {
    var a = variantAvail();
    if (stockEl) {
      var cls, txt;
      if (a.count === null) { cls = "cd-stock cd-stock--ok"; txt = "Disponible"; }
      else if (a.out) { cls = "cd-stock cd-stock--out"; txt = "Agotado" + (isFoil ? " en foil" : ""); }
      else if (a.count <= 3) { cls = "cd-stock cd-stock--low"; txt = "¡Solo " + a.count + (a.count === 1 ? " unidad!" : " unidades!"); }
      else { cls = "cd-stock cd-stock--ok"; txt = a.count + " disponibles"; }
      stockEl.innerHTML = '<span class="' + cls + '">' + txt + "</span>";
    }
    var act = document.getElementById("cdAction");
    if (act && !act.getAttribute("data-added")) {   // no pisar la confirmación "Agregado ✓"
      var hasNotify = !!act.querySelector(".cd-btn--notify");
      if (a.out && !hasNotify) {
        act.innerHTML = soldOutHTML(act);
      } else if (!a.out && (hasNotify || !act.querySelector("#cdAddCart"))) {
        act.innerHTML = buyHTML(act);
        wireCart();
      }
    }
  }
  // markup del botón "Agregar al carrito" + consulta por WhatsApp
  function buyHTML(act) {
    var wa = act.getAttribute("data-buy") || "#";
    var bf = act.getAttribute("data-buy-foil");
    if (isFoil && bf) wa = bf;
    return '<button type="button" class="cd-btn cd-btn--cart" id="cdAddCart">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/>' +
      '<circle cx="18" cy="20" r="1"/><path d="M2 3h2l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H5"/></svg>' +
      'Agregar al carrito</button>' +
      '<a class="cd-ask" id="cdAsk" href="' + wa + '" target="_blank" rel="noopener">o consultar por WhatsApp</a>';
  }
  function soldOutHTML(act) {
    return '<a class="cd-btn cd-btn--notify" href="' + act.getAttribute("data-notify") +
      '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>' +
      'Avísame cuando llegue</a>';
  }
  // confirmación tras agregar: "Agregado ✓" + ir a finalizar / seguir viendo
  function showAdded(count) {
    var act = document.getElementById("cdAction");
    if (!act) return;
    act.setAttribute("data-added", "1");
    var n = count || cartCount();
    var txt = n === 1 ? "Agregado al carrito" : "Agregado al carrito (" + n + " cartas)";
    act.innerHTML =
      '<div class="cd-added"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
      txt + '</div>' +
      '<div class="cd-actrow">' +
      '<a class="cd-btn cd-btn--go" href="../index.html#carrito">' +
      '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
      'Ir a finalizar el pedido</a>' +
      '<button type="button" class="cd-btn cd-btn--ghost" id="cdKeep">Seguir viendo</button>' +
      '</div>';
    var keep = document.getElementById("cdKeep");
    if (keep) keep.addEventListener("click", function () {
      act.removeAttribute("data-added"); act.innerHTML = buyHTML(act); wireCart();
    });
  }
  function wireCart() {
    var btn = document.getElementById("cdAddCart");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var r = addCurrentToCart();
      if (r.ok) { showAdded(r.count); }
      else { btn.textContent = r.msg; setTimeout(function () { var a = document.getElementById("cdAction"); if (a && !a.getAttribute("data-added")) { a.innerHTML = buyHTML(a); wireCart(); } }, 1400); }
    });
  }
  wireCart();   // engancha el botón horneado en el HTML
  function applyVariant() {
    if (priceEl) {
      var pf = priceEl.getAttribute("data-foil");
      if (isFoil && pf) { priceEl.textContent = pf; priceEl.classList.add("cd-price--foil"); }
      else { var pn = priceEl.getAttribute("data-normal"); if (pn) priceEl.textContent = pn; priceEl.classList.remove("cd-price--foil"); }
    }
    var ask = document.getElementById("cdAsk");
    if (ask) {
      var act = document.getElementById("cdAction");
      var bf = act ? act.getAttribute("data-buy-foil") : null;
      ask.href = (isFoil && bf) ? bf : ((act && act.getAttribute("data-buy")) || ask.href);
    }
    refreshAvail();
  }
  if (ftoggle) {
    var fbtns = ftoggle.querySelectorAll(".cd-ftoggle__btn");
    fbtns.forEach(function (b) {
      b.addEventListener("click", function () {
        isFoil = b.getAttribute("data-v") === "foil";
        fbtns.forEach(function (x) { x.classList.toggle("is-on", x === b); });
        applyVariant();
      });
    });
  }

  // productos.json (precio/stock frescos) + api/reservas (pedidos pendientes 48 h;
  // en local la API no existe y se ignora)
  Promise.all([
    fetch("../productos.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("../api/reservas", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ])
    .then(function (rs) {
      var data = rs[0], rj = rs[1];
      if (!Array.isArray(data)) return;
      var p = data.find(function (x) { return String(x.id) === String(pid); });
      if (!p) return;
      // restar unidades reservadas de esta carta (normal y foil)
      var res = (rj && rj.reservas) || {};
      var has = function (v) { return v !== undefined && v !== null && v !== ""; };
      var qN = Number(res[String(p.id)]) || 0, qF = Number(res[p.id + "_f"]) || 0;
      if (qN > 0 && has(p.stock)) p.stock = Math.max(0, Number(p.stock) - qN);
      if (qF > 0) {
        if (has(p.stockf)) p.stockf = Math.max(0, Number(p.stockf) - qF);
        else if (has(p.stock)) p.stock = Math.max(0, Number(p.stock) - qF);
      }
      prod = p;
      // refrescar precios normal/foil desde el JSON y respetar el toggle actual
      if (priceEl) {
        if (p.price != null) priceEl.setAttribute("data-normal", fmt(p.price));
        if (p.foil != null) priceEl.setAttribute("data-foil", fmt(p.foil));
      }
      applyVariant();  // precios + disponibilidad frescos según la variante elegida
    })
    .catch(function () {});
})();
