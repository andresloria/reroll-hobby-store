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

// Juegos que vendemos (orden de la barra). Logo opcional en assets/logos/.
const BRANDS = [
  { cat:"Pokémon",       name:"Pokémon TCG",          glyph:"⚡", color:"#FFCB05", logo:"assets/logos/pokemon.png" },
  { cat:"Riftbound",     name:"Riftbound",            glyph:"◈", color:"#E87722", logo:"assets/logos/riftbound.png" },
  { cat:"Yu-Gi-Oh",      name:"Yu-Gi-Oh!",            glyph:"🜲", color:"#E0903C", logo:"assets/logos/yugioh.png" },
  { cat:"Magic",         name:"Magic: The Gathering", glyph:"✶", color:"#F0E6D2", logo:"assets/logos/magic.png" },
  { cat:"One Piece",     name:"One Piece Card Game",  glyph:"🏴‍☠️", color:"#E0182D", logo:"assets/logos/one-piece.png" },
  { cat:"Weiss Schwarz", name:"Weiss Schwarz",        glyph:"◆", color:"#D8D8E0", logo:"assets/logos/weiss.png" },
  { cat:"Digimon",       name:"Digimon",              glyph:"⬡", color:"#2BA8E0" },
];

const fmt = n => "₡" + Number(n||0).toLocaleString("es-CR");

// ---------- Estado de filtros ----------
let activeCat   = "Todas";
let activeType  = "all";   // all | single | sealed
let activeSet   = "all";
let activeColor = "all";
let sortMode    = "rel";
let query       = "";
const cart = [];

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
    el.innerHTML = `
      <div class="card__img${p.img?" card__img--photo":""}">
        ${p.badge?`<span class="card__badge">${p.badge}</span>`:""}
        <button class="card__fav" aria-label="Favorito" title="Guardar">♡</button>
        ${media(p,"card__photo")}
      </div>
      <div class="card__body">
        <span class="card__cat">${p.cat}${p.color?" · "+p.color:""}</span>
        <h3 class="card__name">${p.name}</h3>
        <span class="card__meta">${metaLine}</span>
        <div class="card__foot">
          <span class="card__price">${fmt(p.price)}</span>
          <button class="card__add" data-id="${p.id}">Añadir</button>
        </div>
      </div>`;
    el.querySelector(".card__add").onclick = ()=> addToCart(p.id);
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
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  cart.push(p);
  $("#cartCount").textContent = cart.length;
  toast(`Añadido: ${p.name}`);
  renderCart();
}
function removeFromCart(idx){
  cart.splice(idx,1);
  $("#cartCount").textContent = cart.length;
  renderCart();
}
function cartTotal(){ return cart.reduce((s,p)=>s+Number(p.price||0),0); }
function renderCart(){
  const wrap = $("#drawerItems");
  if(!cart.length){
    wrap.innerHTML = `<p class="drawer__empty">Tu carrito está vacío.<br>Añade algunas cartas ✨</p>`;
  } else {
    wrap.innerHTML = "";
    cart.forEach((p,idx)=>{
      const row = document.createElement("div");
      row.className = "di";
      const thumb = p.img ? `<img class="di__photo" src="${p.img}" alt="">` : `<div class="di__emoji">${p.emoji||"🎴"}</div>`;
      row.innerHTML = `
        ${thumb}
        <div class="di__info">
          <div class="di__name">${p.name}</div>
          <div class="di__price">${fmt(p.price)} · <span style="color:var(--muted)">${p.cat}</span></div>
        </div>
        <button class="di__rm" aria-label="Quitar">✕</button>`;
      row.querySelector(".di__rm").onclick = ()=> removeFromCart(idx);
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
  $("#coItems").innerHTML = cart.map(p=>`<div class="co__line"><span>${p.name}</span><b>${fmt(p.price)}</b></div>`).join("");
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
  const items = cart.map(p=>`• ${p.name} (${p.cat}) — ${fmt(p.price)}`).join("%0A");
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
$("#searchForm").addEventListener("submit", e=>{
  e.preventDefault();
  query = $("#searchInput").value.trim();
  renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
});
$("#searchInput").addEventListener("input", e=>{ query = e.target.value.trim(); renderGrid(); });

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
  const feat = PRODUCTS.filter(p=>p.badge && p.badge!=="Sellado");
  const pick = (feat.length>=3 ? feat : PRODUCTS).slice(0,3);
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
  renderGameBar(); renderFilters(); renderGrid(); renderHeroFan();
  countUp($("#statCount"), PRODUCTS.length);
}

/* ============================================================
   INIT
   ============================================================ */
renderGameBar();
renderFilters();
renderGrid();
renderCart();
renderBrands();
renderHeroFan();
loadCatalog();
$("#year").textContent = new Date().getFullYear();
$("#catDice")?.addEventListener("click", ()=> document.getElementById("gameBar").scrollIntoView({behavior:"smooth",block:"center"}));
$("#checkoutOpen")?.addEventListener("click", e=>{ e.preventDefault(); openCheckout(); });
$("#checkoutForm")?.addEventListener("submit", submitCheckout);
