/* ============================================================
   REROLL HOBBY STORE — lógica de la tienda
   ============================================================ */

// === CONFIG (cambiá por tus datos reales) ===
const WHATSAPP     = "50687807813";   // WhatsApp con código país, sin + ni espacios
const SINPE_NUMERO = "8780-7813";     // número SINPE Móvil
const SINPE_NOMBRE = "Reroll Hobby Store";

/* ------------------------------------------------------------
   INVENTARIO
   El sitio intenta cargar "productos.json" (lo genera tu panel).
   Si no existe, usa esta lista de ejemplo.
   Campos:
     name, cat(TCG), type:'single'|'sealed', set(expansión),
     color(opcional), price, cond, badge, img|emoji
   ------------------------------------------------------------ */
let PRODUCTS = [
  // Pokémon
  { id:1,  name:"Charizard Holo",        cat:"Pokémon", type:"single", set:"Base Set",        price:85000,  cond:"Near Mint", badge:"Destacada", emoji:"🔥" },
  { id:2,  name:"Pikachu Illustrator",   cat:"Pokémon", type:"single", set:"Promo",           price:240000, cond:"Mint",      badge:"Rara",      emoji:"⚡" },
  { id:3,  name:"Umbreon VMAX Alt Art",  cat:"Pokémon", type:"single", set:"Evolving Skies",  price:135000, cond:"Mint",      badge:"Alt Art",   emoji:"🌙" },
  { id:4,  name:"Mewtwo GX",             cat:"Pokémon", type:"single", set:"Shining Legends", price:28000,  cond:"Near Mint", badge:"",          emoji:"🟣" },
  { id:5,  name:"ETB Surging Sparks",    cat:"Pokémon", type:"sealed", set:"Surging Sparks",  price:42000,  cond:"Sellado",   badge:"Sellado",   emoji:"🎁" },
  { id:6,  name:"Booster Box 151",       cat:"Pokémon", type:"sealed", set:"151",             price:110000, cond:"Sellado",   badge:"Sellado",   emoji:"📦" },
  // Magic
  { id:7,  name:"Black Lotus",           cat:"Magic", type:"single", set:"Alpha",        color:"Incoloro", price:520000, cond:"Excelente", badge:"Vintage", emoji:"🌸" },
  { id:8,  name:"Jace, the Mind Sculptor",cat:"Magic",type:"single", set:"Worldwake",    color:"Azul",     price:64000,  cond:"Near Mint", badge:"",        emoji:"🧠" },
  { id:9,  name:"Liliana of the Veil",   cat:"Magic", type:"single", set:"Innistrad",    color:"Negro",    price:38000,  cond:"Near Mint", badge:"",        emoji:"💀" },
  { id:10, name:"Ragavan",               cat:"Magic", type:"single", set:"Modern Horizons 2", color:"Rojo",price:46000,  cond:"Mint",      badge:"Meta",    emoji:"🐒" },
  { id:11, name:"Bundle Bloomburrow",    cat:"Magic", type:"sealed", set:"Bloomburrow",  price:38000,  cond:"Sellado",   badge:"Sellado",   emoji:"📦" },
  // Yu-Gi-Oh
  { id:12, name:"Blue-Eyes White Dragon",cat:"Yu-Gi-Oh", type:"single", set:"LOB", price:48000, cond:"Near Mint", badge:"", emoji:"🐉" },
  { id:13, name:"Dark Magician",         cat:"Yu-Gi-Oh", type:"single", set:"LOB", price:18000, cond:"Excelente", badge:"", emoji:"🪄" },
  { id:14, name:"Exodia the Forbidden",  cat:"Yu-Gi-Oh", type:"single", set:"LOB", price:72000, cond:"Excelente", badge:"Set", emoji:"👁️" },
  { id:15, name:"Booster Box Age of Overlord", cat:"Yu-Gi-Oh", type:"sealed", set:"Age of Overlord", price:95000, cond:"Sellado", badge:"Sellado", emoji:"📦" },
  // One Piece
  { id:16, name:"Monkey D. Luffy Leader",cat:"One Piece", type:"single", set:"OP-01", price:32000, cond:"Mint", badge:"Nueva", emoji:"🏴‍☠️" },
  { id:17, name:"Roronoa Zoro Parallel", cat:"One Piece", type:"single", set:"OP-05", price:41000, cond:"Mint", badge:"Rara", emoji:"⚔️" },
  { id:18, name:"Booster Box OP-09",     cat:"One Piece", type:"sealed", set:"OP-09", price:95000, cond:"Sellado", badge:"Sellado", emoji:"📦" },
  // Riftbound
  { id:19, name:"Jinx, Loose Cannon",    cat:"Riftbound", type:"single", set:"Origins", price:26000, cond:"Mint", badge:"Nueva", emoji:"💥" },
  { id:20, name:"Ahri, Spirit Champion", cat:"Riftbound", type:"single", set:"Origins", price:34000, cond:"Near Mint", badge:"", emoji:"🦊" },
  { id:21, name:"Booster Box Origins",   cat:"Riftbound", type:"sealed", set:"Origins", price:78000, cond:"Sellado", badge:"Sellado", emoji:"📦" },
  // Weiss Schwarz
  { id:22, name:"Hololive Trial Deck",   cat:"Weiss Schwarz", type:"sealed", set:"Hololive", price:15000, cond:"Sellado", badge:"Sellado", emoji:"📦" },
  // Digimon
  { id:23, name:"Omnimon Alt Art",       cat:"Digimon", type:"single", set:"BT-12", price:30000, cond:"Near Mint", badge:"", emoji:"⬡" },
];

// Juegos que vendemos (orden de la barra).
//  logo: imagen del logo (assets/logos/...). art: imagen de personaje/arte de fondo
//  (assets/games/...). Si el archivo de art no existe, se muestra el degradado de color.
const BRANDS = [
  { cat:"Pokémon",       name:"Pokémon TCG",          glyph:"⚡", color:"#FFCB05", logo:"assets/logos/pokemon.png",   art:"assets/games/pokemon.jpg" },
  { cat:"Riftbound",     name:"Riftbound",            glyph:"◈", color:"#E87722", logo:"assets/logos/riftbound.png", art:"assets/games/riftbound.jpg" },
  { cat:"Yu-Gi-Oh",      name:"Yu-Gi-Oh!",            glyph:"🜲", color:"#E0903C", logo:"assets/logos/yugioh.png",    art:"assets/games/yugioh.jpg" },
  { cat:"Magic",         name:"Magic: The Gathering", glyph:"✶", color:"#F0E6D2", logo:"assets/logos/magic.png",     art:"assets/games/magic.jpg" },
  { cat:"One Piece",     name:"One Piece Card Game",  glyph:"🏴‍☠️", color:"#E0182D", logo:"assets/logos/one-piece.png", art:"assets/games/one-piece.jpg?v=2" },
  { cat:"Weiss Schwarz", name:"Weiss Schwarz",        glyph:"◆", color:"#D8D8E0", logo:"assets/logos/weiss.png",     art:"assets/games/weiss.jpg" },
  { cat:"Digimon",       name:"Digimon",              glyph:"⬡", color:"#2BA8E0",                                    art:"assets/games/digimon.jpg" },
];

const fmt = n => "₡" + Number(n||0).toLocaleString("es-CR");

// ---------- Estado de filtros ----------
let activeCat   = "Todas";
let activeType  = "all";   // all | single | sealed
let activeSet   = "all";
let activeColor = "all";
let sortMode    = "rel";
let query       = "";

// Carrito persistente (sobrevive al navegar entre páginas)
let cart = [];
try{ cart = JSON.parse(localStorage.getItem("reroll_cart")||"[]"); }catch(e){ cart = []; }
function saveCart(){ try{ localStorage.setItem("reroll_cart", JSON.stringify(cart)); }catch(e){} }

// ¿Estamos en la página de un juego? (juego.html tiene #gameBanner)
const GAME_PAGE = typeof document!=="undefined" && !!document.getElementById("gameBanner");
function gameParam(){ return new URLSearchParams(location.search).get("g"); }

// ---------- Helpers DOM ----------
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function media(p, cls){
  if(p.img) return `<img class="${cls}" src="${p.img}" alt="${p.name}" loading="lazy" />`;
  return `<span class="card__emoji">${p.emoji||"🎴"}</span>`;
}

/* ============================================================
   BARRA DE JUEGOS (logos clicables)
   ============================================================ */
function renderGameBar(){
  const bar = $("#gameBar"); if(!bar) return;
  bar.innerHTML = "";
  // botón "Todas"
  const all = document.createElement("button");
  all.className = "gamebtn gamebtn--all" + (activeCat==="Todas"?" active":"");
  all.innerHTML = `<span class="gamebtn__txt">Todos</span>`;
  all.onclick = ()=> selectGame("Todas");
  bar.appendChild(all);

  BRANDS.forEach(b=>{
    const btn = document.createElement("button");
    btn.className = "gamebtn" + (activeCat===b.cat?" active":"");
    btn.title = b.name;
    if(b.logo){
      const img = document.createElement("img");
      img.className = "gamebtn__logo"; img.alt = b.name;
      img.onerror = ()=>{ btn.classList.remove("gamebtn--logo"); btn.innerHTML = `<span class="gamebtn__txt" style="color:${b.color}">${b.cat}</span>`; };
      btn.classList.add("gamebtn--logo");
      if(b.bg) btn.style.background = b.bg;
      btn.appendChild(img);
      img.src = b.logo;
    } else {
      btn.innerHTML = `<span class="gamebtn__txt" style="color:${b.color}">${b.cat}</span>`;
    }
    btn.onclick = ()=> selectGame(b.cat);
    bar.appendChild(btn);
  });
}
function selectGame(cat){
  activeCat = cat;
  activeSet = "all"; activeColor = "all";   // reset sub-filtros al cambiar de juego
  renderGameBar();
  renderFilters();
  renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth", block:"start"});
}

/* ============================================================
   MOSAICOS "EXPLORÁ POR JUEGO"
   ============================================================ */
function renderGameTiles(){
  const wrap = $("#gameTiles"); if(!wrap) return;
  wrap.innerHTML = "";
  BRANDS.forEach(b=>{
    const count = PRODUCTS.filter(p=>p.cat===b.cat).length;
    const tile = document.createElement("button");
    tile.className = "gametile" + (b.art?" gametile--art":"");
    tile.style.setProperty("--g", b.color);
    if(b.art) tile.style.setProperty("--art", `url('${b.art}')`);
    tile.title = `Ver ${b.cat}`;
    const logo = b.logo
      ? `<span class="gametile__plaque"><img src="${b.logo}" alt="${b.name}" onerror="this.parentNode.innerHTML='${b.cat}'"></span>`
      : `<span class="gametile__plaque gametile__plaque--text" style="color:${b.color}">${b.cat}</span>`;
    tile.innerHTML = `
      <span class="gametile__art" aria-hidden="true">${b.glyph}</span>
      ${logo}
      <span class="gametile__name">${b.cat}</span>
      <span class="gametile__count">${count} ${count===1?"carta":"cartas"}</span>`;
    tile.onclick = ()=> { location.href = "juego.html?g=" + encodeURIComponent(b.cat); };
    wrap.appendChild(tile);
  });
}

/* ============================================================
   BANNER DE PÁGINA DE JUEGO (juego.html)
   ============================================================ */
function renderGameBanner(){
  const el = $("#gameBanner"); if(!el) return;
  const b = BRANDS.find(x=>x.cat===activeCat);
  const count = PRODUCTS.filter(p=>p.cat===activeCat).length;
  const color = b ? b.color : "#C9A24B";
  el.style.setProperty("--g", color);
  el.classList.toggle("has-art", !!(b && b.art));
  if(b && b.art) el.style.setProperty("--art", `url('${b.art}')`);
  const logo = b && b.logo
    ? `<span class="gbanner__plaque"><img src="${b.logo}" alt="${b.name}" onerror="this.parentNode.innerHTML='${b.cat}'"></span>`
    : "";
  document.title = (b? b.cat : "Catálogo") + " · Reroll Hobby Store";
  el.innerHTML = `
    <a class="gbanner__back" href="index.html#juegos">← Todos los juegos</a>
    <div class="gbanner__inner">
      ${logo}
      <div class="gbanner__txt">
        <span class="gbanner__glyph" aria-hidden="true">${b?b.glyph:"🎴"}</span>
        <h1>${b? b.cat : "Catálogo"}</h1>
        <p>${count} ${count===1?"producto disponible":"productos disponibles"}</p>
      </div>
    </div>`;
}

/* ============================================================
   FILTROS (tipo, expansión, color, orden)
   ============================================================ */
function uniqueVals(key, base){
  const set = new Set();
  base.forEach(p=>{ if(p[key]) set.add(p[key]); });
  return [...set].sort();
}
function baseForFilters(){
  // productos del juego activo (sin aplicar set/color/tipo) para poblar dropdowns
  return PRODUCTS.filter(p=> activeCat==="Todas" || p.cat===activeCat);
}
function renderFilters(){
  // tipo
  const typeWrap = $("#typeFilter");
  if(typeWrap){
    const opts = [["all","Todo"],["single","Singles"],["sealed","Sellado"]];
    typeWrap.innerHTML = "";
    opts.forEach(([v,l])=>{
      const b = document.createElement("button");
      b.className = "pill" + (activeType===v?" active":"");
      b.textContent = l;
      b.onclick = ()=>{ activeType=v; renderFilters(); renderGrid(); };
      typeWrap.appendChild(b);
    });
  }
  const base = baseForFilters();
  // expansión
  const setSel = $("#setFilter");
  if(setSel){
    const sets = uniqueVals("set", base);
    setSel.innerHTML = `<option value="all">Todas las expansiones</option>` + sets.map(s=>`<option value="${s}">${s}</option>`).join("");
    setSel.value = activeSet;
    setSel.parentElement.style.display = sets.length ? "" : "none";
  }
  // color (solo si hay productos con color en el juego activo)
  const colorSel = $("#colorFilter");
  if(colorSel){
    const colors = uniqueVals("color", base);
    colorSel.innerHTML = `<option value="all">Cualquier color</option>` + colors.map(c=>`<option value="${c}">${c}</option>`).join("");
    colorSel.value = activeColor;
    colorSel.parentElement.style.display = colors.length ? "" : "none";
  }
}

/* ============================================================
   GRID
   ============================================================ */
function getFiltered(){
  let items = PRODUCTS.filter(p=>{
    if(activeCat!=="Todas" && p.cat!==activeCat) return false;
    if(activeType!=="all" && (p.type||"single")!==activeType) return false;
    if(activeSet!=="all" && p.set!==activeSet) return false;
    if(activeColor!=="all" && p.color!==activeColor) return false;
    if(query){
      const q = query.toLowerCase();
      if(!((p.name+" "+p.cat+" "+(p.set||"")).toLowerCase().includes(q))) return false;
    }
    return true;
  });
  if(sortMode==="price-asc")  items.sort((a,b)=>a.price-b.price);
  else if(sortMode==="price-desc") items.sort((a,b)=>b.price-a.price);
  else if(sortMode==="name")  items.sort((a,b)=>a.name.localeCompare(b.name,"es"));
  return items;
}
function renderGrid(){
  const grid = $("#grid");
  const items = getFiltered();
  const cnt = $("#resultCount"); if(cnt) cnt.textContent = `${items.length} resultado${items.length!==1?"s":""}`;
  $("#empty").hidden = items.length>0;
  grid.innerHTML = "";
  items.forEach((p,i)=>{
    const el = document.createElement("article");
    el.className = "card";
    el.style.animationDelay = (i*45)+"ms";
    const metaLine = p.type==="sealed"
      ? `${p.set?p.set+" · ":""}Producto sellado`
      : `${p.set?p.set+" · ":""}${p.cond}`;
    // cantidad disponible (stock)
    const stock = (p.stock===undefined || p.stock===null || p.stock==="") ? null : Number(p.stock);
    const soldOut = stock!==null && stock<=0;
    let stockHtml = "";
    if(stock!==null){
      if(soldOut) stockHtml = `<span class="card__stock card__stock--out">Agotado</span>`;
      else if(stock<=3) stockHtml = `<span class="card__stock card__stock--low">¡Solo ${stock} disponible${stock>1?"s":""}!</span>`;
      else stockHtml = `<span class="card__stock">${stock} disponibles</span>`;
    }
    el.innerHTML = `
      <div class="card__img${p.img?" card__img--photo":""}${soldOut?" card__img--out":""}">
        ${p.badge?`<span class="card__badge">${p.badge}</span>`:""}
        <button class="card__fav" aria-label="Favorito" title="Guardar">♡</button>
        ${media(p,"card__photo")}
      </div>
      <div class="card__body">
        <span class="card__cat">${p.cat}${p.color?" · "+p.color:""}</span>
        <h3 class="card__name">${p.name}</h3>
        <span class="card__meta">${metaLine}</span>
        ${stockHtml}
        <div class="card__foot">
          <span class="card__price">${fmt(p.price)}</span>
          <button class="card__add" data-id="${p.id}"${soldOut?" disabled":""}>${soldOut?"Agotado":"Añadir"}</button>
        </div>
      </div>`;
    if(!soldOut) el.querySelector(".card__add").onclick = ()=> addToCart(p.id);
    el.querySelector(".card__fav").onclick = (e)=>{
      e.currentTarget.textContent = e.currentTarget.textContent==="♡" ? "♥" : "♡";
      e.currentTarget.style.color = e.currentTarget.textContent==="♥" ? "var(--gold-bright)" : "";
    };
    grid.appendChild(el);
  });
}

/* ============================================================
   CARRITO
   ============================================================ */
// consolidar carrito por id y asegurar qty (migración de carritos viejos)
(function normalizeCart(){
  const map = new Map();
  cart.forEach(it=>{
    if(!it || it.id===undefined) return;
    if(map.has(it.id)) map.get(it.id).qty += (it.qty||1);
    else map.set(it.id, { id:it.id, name:it.name, cat:it.cat, price:it.price, emoji:it.emoji, img:it.img, qty: it.qty||1 });
  });
  cart = [...map.values()];
})();

function stockOf(id){ const p=PRODUCTS.find(x=>x.id===id); if(!p) return null; const s=p.stock; return (s===undefined||s===null||s==="")?null:Number(s); }
function cartCount(){ return cart.reduce((s,c)=>s+(c.qty||1),0); }
function cartTotal(){ return cart.reduce((s,c)=>s+Number(c.price||0)*(c.qty||1),0); }

function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
  const st = stockOf(id);
  const line = cart.find(c=>c.id===id);
  if(line){
    if(st!==null && line.qty>=st){ toast(`Solo hay ${st} de ${p.name}`); return; }
    line.qty++;
  } else {
    cart.push({ id:p.id, name:p.name, cat:p.cat, price:p.price, emoji:p.emoji, img:p.img, qty:1 });
  }
  saveCart(); toast(`Añadido: ${p.name}`); renderCart();
}
function changeQty(id, delta){
  const line = cart.find(c=>c.id===id); if(!line) return;
  const st = stockOf(id);
  let q = line.qty + delta;
  if(st!==null && q>st){ q=st; toast(`Solo hay ${st} disponibles`); }
  if(q<=0){ cart = cart.filter(c=>c.id!==id); }
  else line.qty = q;
  saveCart(); renderCart();
}
function removeLine(id){ cart = cart.filter(c=>c.id!==id); saveCart(); renderCart(); }

function renderCart(){
  const cc = $("#cartCount"); if(cc) cc.textContent = cartCount();
  const wrap = $("#drawerItems"); if(!wrap) return;
  if(!cart.length){
    wrap.innerHTML = `<p class="drawer__empty">Tu carrito está vacío.<br>Añade algunas cartas ✨</p>`;
  } else {
    wrap.innerHTML = "";
    cart.forEach(c=>{
      const row = document.createElement("div");
      row.className = "di";
      const thumb = c.img ? `<img class="di__photo" src="${c.img}" alt="">` : `<div class="di__emoji">${c.emoji||"🎴"}</div>`;
      row.innerHTML = `
        ${thumb}
        <div class="di__info">
          <div class="di__name">${c.name}</div>
          <div class="di__price">${fmt(c.price)} c/u · <span style="color:var(--muted)">${c.cat}</span></div>
          <div class="qty">
            <button class="qty__btn" data-act="dec" aria-label="Menos">−</button>
            <span class="qty__n">${c.qty}</span>
            <button class="qty__btn" data-act="inc" aria-label="Más">+</button>
          </div>
        </div>
        <div class="di__right">
          <div class="di__sub">${fmt(c.price*c.qty)}</div>
          <button class="di__rm" aria-label="Quitar">✕</button>
        </div>`;
      row.querySelector('[data-act="dec"]').onclick = ()=> changeQty(c.id,-1);
      row.querySelector('[data-act="inc"]').onclick = ()=> changeQty(c.id,+1);
      row.querySelector(".di__rm").onclick = ()=> removeLine(c.id);
      wrap.appendChild(row);
    });
  }
  $("#drawerTotal").textContent = fmt(cartTotal());
}

/* ============================================================
   CHECKOUT (pago + envío)
   ============================================================ */
function openCheckout(){
  if(!cart.length){ toast("Tu carrito está vacío"); return; }
  $("#coItems").innerHTML = cart.map(c=>`<div class="co__line"><span>${c.name} ×${c.qty}</span><b>${fmt(c.price*c.qty)}</b></div>`).join("");
  $("#coTotal").textContent = fmt(cartTotal());
  $("#sinpeData").textContent = `${SINPE_NOMBRE} · ${SINPE_NUMERO}`;
  $("#checkoutModal").classList.add("open");
  $("#drawer").classList.remove("open");
}
function toggleEnvio(){
  const envio = $("#coEntrega").value === "envio";
  $("#coEnvioFields").style.display = envio ? "" : "none";
}
function togglePago(){
  $("#sinpeBox").style.display = $("#coPago").value === "SINPE Móvil" ? "" : "none";
}
function submitCheckout(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const entrega = f.get("entrega");
  const pago = f.get("pago");
  const nombre = (f.get("nombre")||"").trim();
  const items = cart.map(c=>`• ${c.name} ×${c.qty} (${c.cat}) — ${fmt(c.price*c.qty)}`).join("%0A");
  let msg = `¡Hola Reroll! Quiero hacer un pedido:%0A${items}%0A%0ASubtotal: ${fmt(cartTotal())}`;
  msg += `%0A%0ANombre: ${nombre}`;
  if(entrega==="envio"){
    const prov = (f.get("provincia")||"").trim();
    const dir  = (f.get("direccion")||"").trim();
    msg += `%0AEntrega: Envío por Correos de Costa Rica%0AProvincia: ${prov}%0ADirección: ${dir}%0A(el costo de envío se confirma según destino)`;
  } else {
    msg += `%0AEntrega: Retiro en Cartago`;
  }
  msg += `%0APago: ${pago}`;
  if(pago==="SINPE Móvil") msg += `%0A(SINPE a ${SINPE_NOMBRE} ${SINPE_NUMERO})`;
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank", "noopener");
}

/* ============================================================
   DRAWER / MODALES
   ============================================================ */
function openDrawer(){ $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden","false"); }
function closeAll(){ $("#drawer").classList.remove("open"); $("#checkoutModal").classList.remove("open"); }
$("#cartBtn").onclick = openDrawer;
$$("[data-close]").forEach(el=> el.onclick = closeAll);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeAll(); });

/* ============================================================
   BUSCADOR
   ============================================================ */
// desplegable de resultados en vivo
function renderSearchResults(){
  const box = $("#searchResults"); if(!box) return;
  const q = query.trim().toLowerCase();
  if(!q){ box.hidden = true; box.innerHTML = ""; return; }
  const matches = PRODUCTS.filter(p=> (p.name+" "+p.cat+" "+(p.set||"")).toLowerCase().includes(q)).slice(0,6);
  box.hidden = false;
  if(!matches.length){ box.innerHTML = `<div class="sr__empty">Sin resultados para “${query}”. Probá otro nombre o juego.</div>`; return; }
  box.innerHTML = matches.map(p=>`
    <button type="button" class="sr" data-id="${p.id}">
      <span class="sr__media">${p.img?`<img src="${p.img}" alt="">`:`<span class="sr__emoji">${p.emoji||"🎴"}</span>`}</span>
      <span class="sr__info">
        <span class="sr__name">${p.name}</span>
        <span class="sr__meta">${p.cat}${p.set?" · "+p.set:""} · ${p.type==="sealed"?"Sellado":p.cond}</span>
      </span>
      <span class="sr__price">${fmt(p.price)}</span>
    </button>`).join("");
  box.querySelectorAll(".sr").forEach(el=>{
    el.onclick = ()=>{
      box.hidden = true;
      activeCat = "Todas"; activeType="all"; activeSet="all"; activeColor="all";
      renderGameBar(); renderFilters(); renderGrid();
      document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
    };
  });
}
$("#searchForm").addEventListener("submit", e=>{
  e.preventDefault();
  query = $("#searchInput").value.trim();
  $("#searchResults") && ($("#searchResults").hidden = true);
  renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
});
$("#searchInput").addEventListener("input", e=>{ query = e.target.value.trim(); renderGrid(); renderSearchResults(); });
// cerrar el desplegable al hacer clic fuera o con Escape
document.addEventListener("click", e=>{ const box=$("#searchResults"); if(box && !e.target.closest(".search")) box.hidden = true; });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ const box=$("#searchResults"); if(box) box.hidden = true; } });

// selects de filtro
document.addEventListener("change", e=>{
  if(e.target.id==="setFilter"){ activeSet = e.target.value; renderGrid(); }
  if(e.target.id==="colorFilter"){ activeColor = e.target.value; renderGrid(); }
  if(e.target.id==="sortFilter"){ sortMode = e.target.value; renderGrid(); }
  if(e.target.id==="coEntrega"){ toggleEnvio(); }
  if(e.target.id==="coPago"){ togglePago(); }
});

/* ============================================================
   HERO: abanico de cartas destacadas
   ============================================================ */
function renderHeroFan(){
  const el = $("#herofan"); if(!el) return;
  const N = 5;
  // prioridad: cartas con etiqueta (no sellado), luego el resto del inventario
  const badged = PRODUCTS.filter(p=>p.badge && p.badge!=="Sellado");
  const rest   = PRODUCTS.filter(p=>!(p.badge && p.badge!=="Sellado"));
  const pool   = [...badged, ...rest];
  if(!pool.length){ el.innerHTML=""; return; }
  // siempre 5 cartas: si hay menos, se repiten ciclando
  const pick = [];
  for(let i=0;i<N;i++) pick.push(pool[i % pool.length]);
  el.innerHTML = pick.map((p,i)=>`
    <div class="herofan__card herofan__card--${i}">
      ${p.badge?`<span class="herofan__badge">${p.badge}</span>`:""}
      <div class="herofan__media">${p.img?`<img src="${p.img}" alt="${p.name}">`:`<span class="herofan__emoji">${p.emoji||'🎴'}</span>`}</div>
      <div class="herofan__info">
        <span class="herofan__name">${p.name}</span>
        <span class="herofan__price">${fmt(p.price)}</span>
      </div>
    </div>`).join("");
}

/* ============================================================
   FRANJA "TRABAJAMOS CON" (logos clicables → filtran)
   ============================================================ */
function textBadge(b){
  return `<span class="brandbadge__glyph" style="color:${b.color}">${b.glyph}</span>`+
         `<span class="brandbadge__txt" style="color:${b.color}">${b.name}</span>`;
}
function renderBrands(){
  const track = $("#marqueeTrack");
  if(!track) return;
  track.innerHTML = "";
  const build = ()=> BRANDS.forEach(b=>{
    const d = document.createElement("div");
    d.className = "brandbadge";
    d.title = `Ver ${b.cat}`;
    d.onclick = ()=> selectGame(b.cat);
    if(b.logo){
      const img = document.createElement("img");
      img.className = "brandbadge__logo"; img.alt = b.name;
      img.onerror = ()=>{ d.classList.remove("brandbadge--logo"); d.style.background=""; d.style.borderColor=""; d.innerHTML = textBadge(b); };
      d.classList.add("brandbadge--logo");
      if(b.bg){ d.style.background = b.bg; d.style.borderColor = "rgba(232,199,122,.4)"; }
      d.appendChild(img);
      img.src = b.logo;
    } else {
      d.innerHTML = textBadge(b);
    }
    track.appendChild(d);
  });
  build(); build();
}

/* ============================================================
   DADO MASCOTA: datos curiosos
   ============================================================ */
const TIPS = [
  "Guardá tus cartas en fundas (sleeves): las protegen de roces, polvo y humedad.",
  "“Sellado” = producto sin abrir. Los coleccionistas lo valoran por estar intacto.",
  "El estado (Mint, Near Mint…) puede cambiar muchísimo el precio de una carta.",
  "Una carta “alt art” es una versión con ilustración alternativa, y suele ser más buscada.",
  "“Meta” es el conjunto de mazos más fuertes del momento en los torneos.",
  "En Pokémon, la “reverse holo” tiene el brillo en el borde, no en la ilustración.",
  "Antes de un torneo, revisá tu mazo carta por carta: un descuido puede descalificarte.",
  "Tip de mesa: en los “eurogames”, gana la estrategia más que la suerte.",
  "Reroll = volver a tirar el dado. ¡Tocá el dado para otro dato! 🎲",
  "Mantené tus cartas lejos del sol directo: la luz UV decolora la tinta.",
  "Una carta “1ª edición” es de la primera tirada de impresión de un set.",
];
(function(){
  const wrap = $("#mascot"); if(!wrap) return;
  const bubble = $("#mascotBubble"), textEl = $("#mascotText"), dice = $("#mascotDice");
  let last=-1, timer;
  function pick(){ let i; do{ i=Math.floor(Math.random()*TIPS.length); }while(i===last && TIPS.length>1); last=i; return TIPS[i]; }
  function show(){ bubble.classList.add("swap"); setTimeout(()=>{ textEl.textContent=pick(); bubble.classList.remove("swap"); },320); }
  function reroll(){ dice.classList.remove("roll"); void dice.offsetWidth; dice.classList.add("roll"); show(); restart(); }
  function restart(){ clearInterval(timer); timer=setInterval(show, 9000); }
  textEl.textContent = pick();
  dice.addEventListener("click", reroll);
  restart();
})();

/* ============================================================
   BOTÓN "AVISAME" (juegos de mesa)
   ============================================================ */
(function(){
  const b = $("#notifyBtn");
  if(b){
    const msg = encodeURIComponent("¡Hola Reroll! Avísenme cuando lleguen los juegos de mesa 🎲");
    b.href = `https://wa.me/${WHATSAPP}?text=${msg}`; b.target="_blank"; b.rel="noopener";
  }
})();

/* ============================================================
   NAVBAR + REVEAL + TOAST
   ============================================================ */
const nav = $("#nav");
window.addEventListener("scroll", ()=>{ nav.classList.toggle("scrolled", window.scrollY>10); }, {passive:true});

const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
}, {threshold:0.12});
$$(".reveal").forEach(el=> io.observe(el));

function countUp(el, target){
  if(!el) return;
  let n=0; const step=Math.max(1,Math.ceil(target/40));
  const t=setInterval(()=>{ n+=step; if(n>=target){n=target;clearInterval(t);} el.textContent=n; },28);
}

let toastT;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1900);
}

/* ============================================================
   CARGA DEL INVENTARIO (productos.json)
   ============================================================ */
async function loadCatalog(){
  try{
    const res = await fetch("productos.json?v="+Date.now());
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        PRODUCTS = data.map((p,i)=> ({ id:p.id ?? i+1, type:p.type||"single", ...p }));
      }
    }
  }catch(e){ /* usamos la lista de ejemplo */ }
  renderGameBar(); renderGameBanner(); renderFilters(); renderGrid(); renderHeroFan(); renderGameTiles();
  countUp($("#statCount"), PRODUCTS.length);
}

/* ============================================================
   INIT
   ============================================================ */
// Si estamos en la página de un juego, fijamos ese juego como filtro activo
if(GAME_PAGE){
  const g = gameParam();
  if(g && BRANDS.some(b=>b.cat===g)) activeCat = g;
}
renderGameBar();
renderGameBanner();
renderFilters();
renderGrid();
renderCart();
renderBrands();
renderHeroFan();
renderGameTiles();
loadCatalog();
$("#year").textContent = new Date().getFullYear();
$("#catDice")?.addEventListener("click", ()=> document.getElementById("gameBar").scrollIntoView({behavior:"smooth",block:"center"}));
$("#checkoutOpen")?.addEventListener("click", e=>{ e.preventDefault(); openCheckout(); });
$("#checkoutForm")?.addEventListener("submit", submitCheckout);
