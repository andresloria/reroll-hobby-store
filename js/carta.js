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

  /* ---------- Toggle Normal / Foil (commons/uncommons con precio foil) ---------- */
  var priceEl = document.getElementById("cdPrice");
  var ftoggle = document.getElementById("cdFtoggle");
  var isFoil = false;
  function applyVariant() {
    if (!priceEl) return;
    var pf = priceEl.getAttribute("data-foil");
    if (isFoil && pf) {
      priceEl.textContent = pf;
      priceEl.classList.add("cd-price--foil");
    } else {
      var pn = priceEl.getAttribute("data-normal");
      if (pn) priceEl.textContent = pn;
      priceEl.classList.remove("cd-price--foil");
    }
    var act = document.getElementById("cdAction");
    var buy = document.getElementById("cdBuy");
    if (act && buy) {
      var bf = act.getAttribute("data-buy-foil");
      buy.href = (isFoil && bf) ? bf : (act.getAttribute("data-buy") || buy.href);
    }
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

  fetch("../productos.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!Array.isArray(data)) return;
      var p = data.find(function (x) { return String(x.id) === String(pid); });
      if (!p) return;

      // refrescar precios normal/foil desde el JSON y respetar el toggle actual
      if (priceEl) {
        if (p.price != null) priceEl.setAttribute("data-normal", fmt(p.price));
        if (p.foil != null) priceEl.setAttribute("data-foil", fmt(p.foil));
      }

      var s = p.stock;
      var st = (s === undefined || s === null || s === "") ? null : Number(s);
      var soldOut = st !== null && st <= 0;
      var stockEl = document.getElementById("cdStock");
      if (stockEl) {
        var cls, txt;
        if (st === null) { cls = "cd-stock cd-stock--ok"; txt = "Disponible"; }
        else if (soldOut) { cls = "cd-stock cd-stock--out"; txt = "Agotado"; }
        else if (st <= 3) { cls = "cd-stock cd-stock--low"; txt = "¡Solo " + st + (st === 1 ? " unidad!" : " unidades!"); }
        else { cls = "cd-stock cd-stock--ok"; txt = st + " disponibles"; }
        stockEl.innerHTML = '<span class="' + cls + '">' + txt + "</span>";
      }

      // Mantener el botón consistente con el stock fresco (por si la carta se
      // agotó/repuso después del último build de make_cartas.py)
      var act = document.getElementById("cdAction");
      if (act) {
        var hasNotify = !!act.querySelector(".cd-btn--notify");
        if (soldOut && !hasNotify) {
          act.innerHTML = '<a class="cd-btn cd-btn--notify" href="' + act.getAttribute("data-notify") +
            '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>' +
            'Avísame cuando llegue</a>';
        } else if (!soldOut && hasNotify) {
          act.innerHTML = '<a class="cd-btn cd-btn--wa" id="cdBuy" href="' + act.getAttribute("data-buy") +
            '" target="_blank" rel="noopener"><svg viewBox="0 0 32 32" width="21" height="21" aria-hidden="true">' +
            '<path fill="currentColor" d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.6 1.4 5.7 1.4 ' +
            '6.6 0 12-5.4 12-12S22.6 3 16 3z"/></svg>Comprar por WhatsApp</a>';
        }
      }
      applyVariant();  // refleja precios frescos + variante elegida en el botón de compra
    })
    .catch(function () {});
})();
