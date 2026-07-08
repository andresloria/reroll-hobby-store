/* ============================================================
   REROLL HOBBY STORE — lógica de la tienda
   ============================================================ */

// === CONFIG (cambiá por tus datos reales) ===
const WHATSAPP     = "50687807813";   // WhatsApp con código país, sin + ni espacios
const SINPE_NUMERO = "8780-7813";     // número SINPE Móvil
const SINPE_NOMBRE = "Reroll Hobby Store";

// === FASE 4: umbrales de credibilidad en pre-apertura ===
// Mientras el inventario sea chico, el stat "cartas listadas" se OCULTA y el catálogo
// muestra "en preparación". Apenas haya >= estos números, todo vuelve a aparecer solo.
const STAT_MIN    = 8;   // mínimo de productos para mostrar el stat del hero
const CATALOG_MIN = 6;   // por debajo de esto, el catálogo se considera "en preparación"

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
];

// Juegos que vendemos (orden de la barra).
//  logo: imagen del logo (assets/logos/...). art: imagen de personaje/arte de fondo
//  (assets/games/...). Si el archivo de art no existe, se muestra el degradado de color.
//  logo: versión para fondo CLARO (marquee/gamebar con pastilla blanca).
//  logoLight: versión clara/transparente para los tiles sobre fondo oscuro.
//  mono:true  → se pinta en blanco con filtro (logos monocromos opacos).
// lw/lh: dimensiones intrínsecas del logoLight (tile) → se setean como width/height
//        en el <img> para reservar el espacio y evitar layout shift (CLS) + Lighthouse.
const BRANDS = [
  { cat:"Pokémon",       name:"Pokémon TCG",          glyph:"⚡", color:"#FFCB05", logo:"assets/logos/pokemon.png",   logoLight:"assets/logos/pokemon-tile.png", lw:640, lh:327 },
  { cat:"Riftbound",     name:"Riftbound",            glyph:"◈", color:"#E87722", logo:"assets/logos/riftbound.png", logoLight:"assets/logos/riftbound-tile.png", lw:640, lh:281 },
  { cat:"Yu-Gi-Oh",      name:"Yu-Gi-Oh!",            glyph:"🜲", color:"#C13B26", logo:"assets/logos/yugioh.png",    logoLight:"assets/logos/yugioh-tile.webp", lw:1001, lh:369 },
  { cat:"Magic",         name:"Magic: The Gathering", glyph:"✶", color:"#C77B3A", logo:"assets/logos/magic.png",     logoLight:"assets/logos/magic-tile.png", lw:723, lh:276 },
  { cat:"One Piece",     name:"One Piece Card Game",  glyph:"🏴‍☠️", color:"#E0182D", logo:"assets/logos/one-piece.png", logoLight:"assets/logos/one-piece-tile.png", lw:561, lh:145 },
  { cat:"Weiss Schwarz", name:"Weiss Schwarz",        glyph:"◆", color:"#D8D8E0", logo:"assets/logos/weiss.png",     logoLight:"assets/logos/weiss-tile.png", lw:270, lh:148 },
];

const fmt = n => "₡" + Number(n||0).toLocaleString("es-CR");
// estado abreviado para la pill móvil (NM / Mint / EX …)
function condShort(c){ c=(c||"").toLowerCase(); if(c.includes("near")) return "NM"; if(c.includes("mint")||c.includes("gem")) return "Mint"; if(c.includes("excel")) return "EX"; if(c.includes("jug")) return "Jugado"; if(c.includes("sell")) return "Sellado"; return c?c[0].toUpperCase()+c.slice(1):""; }
function condClass(c){ c=(c||"").toLowerCase(); if(c.includes("near")) return "card__cond--nm"; if(c.includes("mint")||c.includes("gem")) return "card__cond--mt"; if(c.includes("excel")) return "card__cond--ex"; return ""; }
// tamaño del nombre de la carta según su largo (ni diminuto ni gigante)
function cardNameSize(name){
  const n = (name||"").length;
  if(n <= 14) return "1.35rem";
  if(n <= 22) return "1.18rem";
  if(n <= 30) return "1.04rem";
  return ".92rem";
}

// ---------- Estado de filtros ----------
let activeCat   = "Todas";
let activeType  = "all";   // all | single | sealed
// Filtros avanzados (multi-selección, estilo TCGplayer). Un Set vacío = sin filtro.
let selSets  = new Set();  // expansiones
let selRars  = new Set();  // rarezas
let selCTs   = new Set();  // tipos de carta (Unit, Leader, Character…)
let selDoms  = new Set();  // dominios (Riftbound) / colores (One Piece)
let selConds = new Set();  // condición (Near Mint, Mint / Gem…)
let foilOnly = false;      // solo cartas con variante foil
let priceMin = null;       // precio mínimo (₡), null = sin límite
let priceMax = null;       // precio máximo (₡), null = sin límite
function clearSubFilters(){ selSets.clear(); selRars.clear(); selCTs.clear(); selDoms.clear(); selConds.clear(); foilOnly=false; priceMin=null; priceMax=null; }
function activeFilterCount(){ return selSets.size+selRars.size+selCTs.size+selDoms.size+selConds.size+(foilOnly?1:0)+((priceMin!=null||priceMax!=null)?1:0); }
let sortMode    = "rel";
let query       = "";
let showSoldOut = false;   // por defecto NO se muestran las cartas agotadas (stock 0)

// stock de un producto: null = ilimitado (sin campo), número = unidades
function stockVal(p){ const s=p.stock; return (s===undefined||s===null||s==="")?null:Number(s); }
function stockValF(p){ const s=p.stockf; return (s===undefined||s===null||s==="")?null:Number(s); }
// disponibilidad de la variante foil: usa su propio stock si está definido; si no, sigue el normal
function foilAvailable(p){ if(p.foil==null) return false; const sf=stockValF(p); return sf===null ? isAvailable(p) : sf>0; }
// resta del stock visible las unidades reservadas por pedidos pendientes (map: {"id":n,"id_f":n})
function applyReservas(map){
  for(const k in map){
    const foil = k.endsWith("_f");
    const id = Number(foil ? k.slice(0,-2) : k);
    const q = Number(map[k])||0;
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p || q<=0) continue;
    const has = (v)=> v!==undefined && v!==null && v!=="";
    if(foil && has(p.stockf))      p.stockf = Math.max(0, Number(p.stockf)-q);
    else if(has(p.stock))          p.stock  = Math.max(0, Number(p.stock)-q);
  }
}
// disponible = sin campo de stock (ilimitado) o con stock > 0
function isAvailable(p){ const s=stockVal(p); return s===null || s>0; }

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

// Optimiza imágenes del CDN de Riot (Sanity): pide webp/avif y el ancho justo.
// 744x1039 PNG (~780KB) → ~30KB webp. Solo toca URLs de cmsassets.rgpub.io; el resto se deja igual.
function imgURL(url, w){
  if(!url || !/cmsassets\.rgpub\.io/.test(url)) return url;
  if(/[?&](w|auto)=/.test(url)) return url;            // ya optimizada
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${w}&auto=format&q=78`;
}

// Ícono SVG de carta (reemplaza el emoji 🎴 como placeholder cuando un producto no tiene imagen)
const SVG_CARD = `<svg class="ph-card" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.2"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/></svg>`;
// Placeholder "Imagen no disponible" (imagen tachada) para cartas sin foto
const IMG_OFF = `<svg class="noimg__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`;
function noImgBox(cls){ return `<div class="${cls||''} noimg" aria-label="Imagen no disponible">${IMG_OFF}<span class="noimg__t">Imagen no disponible</span></div>`; }
// fallback si una imagen que SÍ tenía URL no carga (404/transitorio): recién ahí mostramos el placeholder
function qvImgFail(el){ try{ el.outerHTML = noImgBox("qv__noimg"); }catch(e){} }

function media(p, cls){
  // si la imagen es horizontal (battlefields/locations), se rota para llenar el marco vertical
  if(p.img) return `<img class="${cls}" src="${imgURL(p.img,500)}" alt="${p.name}" loading="lazy" onload="if(this.naturalWidth>this.naturalHeight)this.classList.add('card__photo--wide')" />`;
  return noImgBox("card__noimg");
}

// Índice id → slug (lo genera make_cartas.py). Permite enlazar cada carta del
// grid a su página de detalle /carta/<slug>.html. Si una carta no tiene slug
// (ej. productos de ejemplo sin match), no se enlaza y se comporta como antes.
let SLUGS = {};
function cartaHref(p){
  const e = SLUGS[p.id];
  return e && e.slug ? `carta/${e.slug}.html` : null;
}

// ---- Quick-view: modal de detalle instantáneo (imagen + descripción + precio) ----
// La descripción sale de p.d (embebida al agregar del catálogo) o de cartas.json (SLUGS[id].d).
function cardRich(p){ return (p && p.d) || (SLUGS[p.id] && SLUGS[p.id].d) || null; }
let _qv = null;
function qvEl(){
  if(_qv) return _qv;
  _qv = document.createElement("div");
  _qv.className = "qv"; _qv.hidden = true;
  _qv.innerHTML = `<div class="qv__bg"></div>
    <div class="qv__card" role="dialog" aria-modal="true" aria-label="Detalle de carta">
      <button class="qv__x" aria-label="Cerrar">✕</button>
      <div class="qv__media"><img class="qv__img" alt="" /></div>
      <div class="qv__info">
        <span class="qv__cat"></span>
        <h3 class="qv__name"></h3>
        <div class="qv__price"></div>
        <div class="qv__ftog"></div>
        <div class="qv__stock"></div>
        <div class="qv__effect"></div>
        <div class="qv__attrs"></div>
        <div class="qv__actions">
          <button class="qv__add btn btn--gold" type="button">Agregar al carrito</button>
          <a class="qv__full btn btn--ghost">Ver ficha completa ↗</a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(_qv);
  _qv.querySelector(".qv__x").onclick = closeQV;
  _qv.querySelector(".qv__bg").onclick = closeQV;
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !_qv.hidden) closeQV(); });
  return _qv;
}
function closeQV(){ if(_qv){ _qv.hidden = true; document.body.style.overflow = ""; } }
function openQuickView(p){
  const m = qvEl();
  const mediaBox = m.querySelector(".qv__media");
  mediaBox.innerHTML = p.img
    ? `<img class="qv__img" src="${imgURL(p.img,600)}" alt="" onerror="qvImgFail(this)" />`
    : noImgBox("qv__noimg");
  m.querySelector(".qv__cat").textContent = p.cat + (p.set ? " · "+p.set : "");
  m.querySelector(".qv__name").textContent = p.name;
  // precio + selector Normal/Foil (si la carta tiene variante foil)
  const priceEl = m.querySelector(".qv__price"), ftog = m.querySelector(".qv__ftog");
  const stockEl = m.querySelector(".qv__stock"), addBtn = m.querySelector(".qv__add");
  let qvFoil = false;
  const stockN = stockVal(p);
  const qvAvail = ()=>{
    if(qvFoil){ const sf=stockValF(p); if(sf===null) return {count:stockN, out:(stockN!==null&&stockN<=0)}; return {count:sf, out:sf<=0}; }
    return {count:stockN, out:(stockN!==null&&stockN<=0)};
  };
  const paintPrice = ()=>{
    priceEl.textContent = fmt(qvFoil ? p.foil : p.price);
    priceEl.classList.toggle("card__price--foil", qvFoil);
    ftog.querySelectorAll(".ftoggle__btn").forEach(b=> b.classList.toggle("is-on", (b.dataset.v==="foil")===qvFoil));
    const a = qvAvail();
    if(a.count===null) stockEl.innerHTML = "";
    else if(a.out) stockEl.innerHTML = `<span class="card__stock card__stock--out">Agotado${qvFoil?" en foil":""}</span>`;
    else if(a.count<=3) stockEl.innerHTML = `<span class="card__stock card__stock--low">¡Solo ${a.count} disponible${a.count>1?"s":""}!</span>`;
    else stockEl.innerHTML = `<span class="card__stock">${a.count} disponibles</span>`;
    addBtn.disabled = a.out;
    addBtn.textContent = a.out ? "Agotado" : "Agregar al carrito";
  };
  if(p.foil!=null){
    ftog.innerHTML = `<div class="ftoggle" role="group" aria-label="Acabado de la carta">
      <button type="button" class="ftoggle__btn is-on" data-v="normal">Normal ${fmt(p.price)}</button>
      <button type="button" class="ftoggle__btn" data-v="foil">Foil ✨ ${fmt(p.foil)}</button></div>`;
    ftog.querySelectorAll(".ftoggle__btn").forEach(b=> b.onclick = ()=>{ qvFoil = b.dataset.v==="foil"; paintPrice(); });
  } else { ftog.innerHTML = ""; }
  paintPrice();
  const rich = cardRich(p);
  m.querySelector(".qv__effect").innerHTML = rich && rich.fx ? `<div class="qv__efftitle">✦ Efecto</div>${rich.fx}` : "";
  m.querySelector(".qv__attrs").innerHTML = (rich && rich.at && rich.at.length)
    ? rich.at.map(a=>`<div class="qv__attr"><span>${a[0]}</span><b>${a[1]}</b></div>`).join("")
    : "";
  const full = m.querySelector(".qv__full"); const href = cartaHref(p);
  if(href){ full.href = href; full.style.display=""; } else { full.style.display="none"; }
  addBtn.onclick = ()=>{ if(addBtn.disabled) return; addToCart(p.id, qvFoil); closeQV(); };
  m.hidden = false; document.body.style.overflow = "hidden";
}
document.addEventListener("click", e=>{
  const a = e.target.closest("a.card__link, a.hmq__card"); if(!a) return;
  const pid = a.getAttribute("data-pid"); if(!pid) return;
  const p = PRODUCTS.find(x=> String(x.id)===String(pid)); if(!p) return;
  e.preventDefault(); openQuickView(p);
});

/* ---- HERO marquee: desfile infinito de cartas reales del inventario ---- */
function renderHeroMarquee(){
  const band = $("#hmqBand"); if(!band) return;
  // vitrina: disponibles con foto; primero las llamativas (>₡5000), completa con el resto
  let pool = PRODUCTS.filter(p=> p.img && isAvailable(p) && (p.type||"single")==="single" && Number(p.price||0)>=5000);
  if(pool.length < 12) pool = PRODUCTS.filter(p=> p.img && isAvailable(p) && (p.type||"single")==="single");
  const pick = pool.sort(()=>Math.random()-.5).slice(0,12);
  if(!pick.length){ band.style.display="none"; return; }
  const strip = document.createElement("div");
  strip.className = "hmq__strip";
  [...pick, ...pick].forEach((p,i)=>{           // duplicado = loop perfecto en -50%
    const a = document.createElement("a");
    a.className = "hmq__card";
    a.href = cartaHref(p) || "#";
    a.setAttribute("data-pid", p.id);
    a.setAttribute("aria-label", "Ver "+p.name);
    a.style.transform = `rotate(${i%2 ? 3 : -2.5}deg) translateY(${i%2 ? 8 : 0}px)`;
    a.innerHTML = `<img src="${imgURL(p.img,300)}" alt="${p.name}" loading="eager">`;
    strip.appendChild(a);
  });
  band.innerHTML = ""; band.appendChild(strip);
  const c = $("#hmqCount");
  if(c) c.textContent = PRODUCTS.filter(isAvailable).length.toLocaleString("es-CR");
}

// Skeleton: placeholder con shimmer mientras carga el inventario (evita el parpadeo "ejemplo → real")
function renderSkeleton(){
  const grid = $("#grid"); if(!grid) return;
  grid.innerHTML = Array.from({length:10}, ()=>'<div class="card card--skel" aria-hidden="true"></div>').join("");
}

/* ============================================================
   BARRA DE JUEGOS (logos clicables)
   ============================================================ */
function renderGameBar(){
  const bar = $("#gameBar"); if(!bar) return;
  bar.innerHTML = "";
  // click normal (sin modificadores) = filtra inline acá; ctrl/⌘/medio/«abrir en pestaña
  // nueva» usan el href real y abren el catálogo del juego (no la imagen del logo).
  const onPick = (cat)=> (e)=>{
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button===1) return;
    e.preventDefault();
    selectGame(cat);
  };
  // "Todos"
  const all = document.createElement("a");
  all.className = "gamebtn gamebtn--all" + (activeCat==="Todas"?" active":"");
  all.href = "juego.html";
  all.innerHTML = `<span class="gamebtn__txt">Todos</span>`;
  all.addEventListener("click", onPick("Todas"));
  bar.appendChild(all);

  BRANDS.forEach(b=>{
    const btn = document.createElement("a");
    btn.className = "gamebtn" + (activeCat===b.cat?" active":"");
    btn.title = b.name;
    btn.href = `juego.html?g=${encodeURIComponent(b.cat)}`;
    btn.setAttribute("aria-label", `Ver ${b.name}`);
    const src = b.logoLight || b.logo;   // versión clara/transparente: sin pastilla blanca
    if(src){
      const img = document.createElement("img");
      img.className = "gamebtn__logo"; img.alt = b.name;
      if(b.lw){ img.width = b.lw; img.height = b.lh; }
      img.onerror = ()=>{ btn.classList.remove("gamebtn--logo"); btn.innerHTML = `<span class="gamebtn__txt" style="color:${b.color}">${b.cat}</span>`; };
      btn.classList.add("gamebtn--logo");
      btn.appendChild(img);
      img.src = src;
    } else {
      btn.innerHTML = `<span class="gamebtn__txt" style="color:${b.color}">${b.cat}</span>`;
    }
    btn.addEventListener("click", onPick(b.cat));
    bar.appendChild(btn);
  });
}
function selectGame(cat){
  activeCat = cat;
  clearSubFilters(); fpopOpen = null;   // reset sub-filtros al cambiar de juego
  renderGameBar();
  renderFilters();
  renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth", block:"start"});
}

/* ============================================================
   MOSAICOS "EXPLORÁ POR JUEGO"
   ============================================================ */
// Orden de la grilla "Elegí tu juego" (el 1º es el foco de lanzamiento, va destacado)
const TILE_GAMES = ["One Piece","Riftbound","Pokémon","Magic","Yu-Gi-Oh"];
function renderGameTiles(){
  const wrap = $("#gameTiles"); if(!wrap) return;
  wrap.innerHTML = "";
  TILE_GAMES.forEach((cat,i)=>{
    const b = BRANDS.find(x=>x.cat===cat) || { cat, color:"#C13B26", name:cat };
    const count = PRODUCTS.filter(p=>p.cat===cat && isAvailable(p)).length;   // solo disponibles
    const tile = document.createElement("a");
    tile.href = `juego.html?g=${encodeURIComponent(cat)}`;
    tile.className = "gtile" + (i===0 ? " gtile--featured" : "");
    tile.style.setProperty("--accent", b.color);
    tile.setAttribute("aria-label", `Ver catálogo de ${cat} (${count} producto${count===1?"":"s"})`);

    const glow = document.createElement("span"); glow.className = "gtile__glow"; glow.setAttribute("aria-hidden","true");
    const plate = document.createElement("span"); plate.className = "gtile__plate";
    const src = b.logoLight || b.logo;   // versión clara para fondo oscuro
    if(src){
      const img = document.createElement("img");
      img.className = "gtile__logo" + (b.mono ? " gtile__logo--mono" : "");
      img.alt = b.name || cat; img.loading = "lazy";
      if(b.lw){ img.width = b.lw; img.height = b.lh; }
      img.onerror = ()=>{ const ph=document.createElement("span"); ph.className="gtile__ph"; ph.textContent=cat; plate.replaceChildren(ph); };
      plate.appendChild(img); img.src = src;
    } else {
      const ph=document.createElement("span"); ph.className="gtile__ph"; ph.textContent=cat; plate.appendChild(ph);
    }
    const name = document.createElement("span"); name.className="gtile__name"; name.textContent = cat;
    const cnt  = document.createElement("span"); cnt.className="gtile__count";
    cnt.textContent = count ? `${count} producto${count===1?"":"s"}` : "Catálogo en preparación";
    tile.append(glow, plate, name, cnt);
    if(i===0){ const flag=document.createElement("span"); flag.className="gtile__flag"; flag.textContent="Foco de lanzamiento"; tile.append(flag); }
    // enlace real (crawleable por buscadores) → misma pestaña, back funciona
    wrap.appendChild(tile);
  });
}

/* ============================================================
   HERO · chips de acceso rápido por juego
   NO tocan la grilla "Elegí tu juego" ni su clic (abre pestaña nueva).
   Reusan el MISMO filtro in-page que el #gameBar → selectGame().
   ============================================================ */
function renderHeroChips(){
  const wrap = $("#heroChips"); if(!wrap) return;
  wrap.innerHTML = "";
  TILE_GAMES.forEach(cat=>{
    const b = BRANDS.find(x=>x.cat===cat) || { cat, color:"#C13B26" };
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "herochip";
    chip.style.setProperty("--c", b.color);
    chip.innerHTML = `<span class="herochip__dot" aria-hidden="true"></span>${cat}`;
    chip.onclick = ()=> selectGame(cat);   // mismo mecanismo de filtro que el gameBar
    wrap.appendChild(chip);
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
  const art = (PANEL_ART && PANEL_ART[activeCat]) || (b && b.art) || null;   // arte por juego (mismo de los paneles)
  el.classList.toggle("has-art", !!art);
  // URL absoluta: en CSS, url() dentro de var() se resuelve relativo al .css (daría css/assets/…). Lo evitamos.
  if(art) el.style.setProperty("--art", `url('${new URL(art, location.href).href}')`);
  const bannerLogo = b ? (b.logoLight || b.logo) : null;   // transparente: sin placa blanca
  const logoDim = (b && b.lw) ? ` width="${b.lw}" height="${b.lh}"` : "";
  const logo = bannerLogo
    ? `<span class="gbanner__plaque"><img src="${bannerLogo}" alt="${b.name}"${logoDim} onerror="this.parentNode.innerHTML='${b.cat}'"></span>`
    : "";
  document.title = (b? b.cat : "Catálogo") + " · Reroll Hobby Store";
  el.innerHTML = `
    <a class="gbanner__back" href="index.html#juegos">← Todos los juegos</a>
    <div class="gbanner__inner">
      ${logo}
      <div class="gbanner__txt">
        <h1>${b? b.cat : "Catálogo"}</h1>
        <p>${count} ${count===1?"producto disponible":"productos disponibles"}</p>
      </div>
    </div>`;
}

/* ============================================================
   GAMEBAR SLIM (juego.html) · saltar de juego sin volver atrás
   Enlaces reales a juego.html?g=<cat>; el activo va resaltado.
   ============================================================ */
function renderGamePageBar(){
  const bar = $("#gamePageBar"); if(!bar) return;   // solo existe en juego.html
  bar.innerHTML = "";
  const label = document.createElement("span");
  label.className = "gpbar__label"; label.textContent = "Cambiar:";
  bar.appendChild(label);
  const all = document.createElement("a");
  all.className = "gpbar__btn"; all.href = "index.html#juegos"; all.textContent = "Todos";
  bar.appendChild(all);
  TILE_GAMES.forEach(cat=>{
    const a = document.createElement("a");
    const on = cat===activeCat;
    a.className = "gpbar__btn" + (on ? " is-active" : "");
    a.href = `juego.html?g=${encodeURIComponent(cat)}`;
    a.textContent = cat;
    if(on) a.setAttribute("aria-current","page");
    bar.appendChild(a);
  });
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

// --- Búsqueda tolerante: sin tildes, sin puntuación, por palabras sueltas.
// "luffy" y "monkey luffy" encuentran "Monkey.D.Luffy"; "pokemon" -> "Pokémon".
function normSearch(s){
  return (s||"").toString().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // quita tildes/diacríticos
    .replace(/[^a-z0-9]+/g, " ").trim();                // puntuación -> espacio
}
function searchHay(p){ return normSearch(p.name+" "+p.cat+" "+(p.set||"")); }
function matchQuery(p, q){
  const toks = normSearch(q).split(" ").filter(Boolean);
  if(!toks.length) return true;
  const hay = searchHay(p);
  return toks.every(t => hay.includes(t));   // todas las palabras deben aparecer
}

// ---- Enriquecimiento para filtros: rareza / tipo de carta / dominio-color ----
// Sale de cartas.json (SLUGS) o, si la carta se agregó por el panel, de p.d.at.
function atFrom(p, key){
  const d = p.d || (SLUGS[p.id] && SLUGS[p.id].d) || null;
  if(!d || !d.at) return "";
  const row = d.at.find(a=>a[0]===key);
  return row ? row[1] : "";
}
function enrichProducts(){
  PRODUCTS.forEach(p=>{
    const e = SLUGS[p.id] || {};
    p._rar = e.rarity || atFrom(p,"Rareza") || "";
    p._ct  = e.type   || atFrom(p,"Tipo")   || "";
    const dm = e.domains || atFrom(p,"Dominio") || atFrom(p,"Color") || "";
    p._doms = dm ? dm.split(/\s*\|\s*|;/).map(s=>s.trim()).filter(Boolean) : [];
  });
}
// orden canónico de rarezas por juego (lo demás va al final, alfabético)
const RAR_ORDER = {
  "Riftbound": ["Common","Uncommon","Rare","Epic","Showcase"],
  "One Piece": ["C","UC","R","SR","SEC","L","TR","DON!!"]
};
function sortByOrder(vals, order){
  const idx = v => { const i = (order||[]).indexOf(v); return i<0 ? 999 : i; };
  return vals.sort((a,b)=> idx(a)-idx(b) || a.localeCompare(b,"es"));
}
function renderFilters(){
  // tipo (pills Todo / Singles / Sellado)
  const typeWrap = $("#typeFilter");
  if(typeWrap){
    const opts = [["all","Todo"],["single","Singles"],["sealed","Sellado"]];
    typeWrap.innerHTML = "";
    opts.forEach(([v,l])=>{
      const b = document.createElement("button");
      b.className = "pill" + (activeType===v?" active":"");
      b.textContent = l;
      b.onclick = ()=>{ activeType=v; refreshFilters(); };
      typeWrap.appendChild(b);
    });
  }
  renderFilterBar();
}

/* ---- Barra de filtros avanzados (chips + dropdowns, estilo TCGplayer) ---- */
const escF = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let fpopOpen = null;   // grupo con dropdown abierto ("set"|"rar"|…) o null
function domGroupLabel(){
  if(activeCat==="One Piece") return "Color";
  if(activeCat==="Riftbound") return "Dominio";
  return "Dominio / Color";
}
function filterGroups(){
  return [
    {id:"set",  label:"Expansión",      sel:selSets,  get:p=>p.set?[p.set]:[]},
    {id:"rar",  label:"Rareza",         sel:selRars,  get:p=>p._rar?[p._rar]:[], order:RAR_ORDER[activeCat]},
    {id:"ct",   label:"Tipo de carta",  sel:selCTs,   get:p=>p._ct?[p._ct]:[]},
    {id:"dom",  label:domGroupLabel(),  sel:selDoms,  get:p=>p._doms||[]},
    {id:"cond", label:"Condición",      sel:selConds, get:p=>p.cond?[p.cond]:[]}
  ];
}
function groupOptions(g){
  const counts = new Map();
  getFiltered(g.id).forEach(p=> g.get(p).forEach(v=> counts.set(v,(counts.get(v)||0)+1)));
  let vals = [...counts.keys()];
  vals = g.order ? sortByOrder(vals, g.order) : vals.sort((a,b)=>a.localeCompare(b,"es"));
  return vals.map(v=>({v, n:counts.get(v)}));
}
function chipHTML(g){
  const isPrice = g.id==="price";
  const on = isPrice ? (priceMin!=null||priceMax!=null) : g.sel.size>0;
  let lbl;
  if(isPrice) lbl = on ? `Precio: ${priceMin!=null?fmt(priceMin):"₡0"} – ${priceMax!=null?fmt(priceMax):"∞"}` : "Precio ▾";
  else lbl = on ? `${g.label}: ${escF([...g.sel][0])}${g.sel.size>1?` +${g.sel.size-1}`:""}` : `${g.label} ▾`;
  return `<button type="button" class="fchip${on?" on":""}${fpopOpen===g.id?" open":""}" data-fg="${g.id}" aria-expanded="${fpopOpen===g.id}">${lbl}${on?'<span class="fchip__x" role="button" aria-label="Quitar este filtro">✕</span>':""}</button>`;
}
function renderFilterBar(){
  const bar = $("#fbar"); if(!bar) return;
  const groups = filterGroups();
  let html = "";
  groups.slice(0,4).forEach(g=>{ if(groupOptions(g).length || g.sel.size) html += chipHTML(g); });
  // Foil: chip-toggle (sin dropdown), solo si el juego activo tiene foils
  if(getFiltered("foil").some(p=>p.foil!=null) || foilOnly)
    html += `<button type="button" class="fchip${foilOnly?" on":""}" data-fg="foil">Foil ✨${foilOnly?'<span class="fchip__x" role="button" aria-label="Quitar este filtro">✕</span>':""}</button>`;
  html += chipHTML(groups[4]);                     // condición
  html += chipHTML({id:"price", label:"Precio"});  // precio (min/max)
  if(activeFilterCount()) html += `<button type="button" class="fclear" data-fg="clear">Limpiar todo ✕</button>`;
  bar.innerHTML = html;
  if(fpopOpen) mountFpop(bar);
}
function fpopBodyHTML(id){
  if(id==="price"){
    return `<div class="fpop__t">Precio (₡)</div>
      <div class="fpop__price">
        <input type="number" id="fpMin" min="0" step="100" placeholder="mín" value="${priceMin!=null?priceMin:""}" aria-label="Precio mínimo">
        <span>–</span>
        <input type="number" id="fpMax" min="0" step="100" placeholder="máx" value="${priceMax!=null?priceMax:""}" aria-label="Precio máximo">
      </div>
      <button type="button" class="fpop__apply" id="fpApply">Aplicar</button>`;
  }
  const g = filterGroups().find(x=>x.id===id); if(!g) return "";
  // Expansión en la home: agrupada por juego
  if(id==="set" && activeCat==="Todas"){
    const byGame = new Map();
    getFiltered("set").forEach(p=>{ if(!p.set) return;
      if(!byGame.has(p.cat)) byGame.set(p.cat,new Map());
      const m=byGame.get(p.cat); m.set(p.set,(m.get(p.set)||0)+1); });
    let out = `<div class="fpop__t">${escF(g.label)}</div>`;
    [...byGame.keys()].sort((a,b)=>a.localeCompare(b,"es")).forEach(game=>{
      out += `<div class="fpop__gh">${escF(game)}</div>`;
      [...byGame.get(game).keys()].sort((a,b)=>a.localeCompare(b,"es")).forEach(v=>{
        out += fpopRow(g, v, byGame.get(game).get(v));
      });
    });
    return out;
  }
  const opts = groupOptions(g);
  if(!opts.length) return `<div class="fpop__t">${escF(g.label)}</div><div class="fpop__empty">Sin opciones con los filtros actuales.</div>`;
  return `<div class="fpop__t">${escF(g.label)}</div>` + opts.map(o=>fpopRow(g, o.v, o.n)).join("");
}
function fpopRow(g, v, n){
  const on = g.sel.has(v);
  return `<label class="fopt${on?" on":""}"><input type="checkbox" data-fv="${escF(v)}" ${on?"checked":""}><span class="fopt__box" aria-hidden="true">${on?"✓":""}</span><span class="fopt__l">${escF(v)}</span><span class="fopt__n">${n}</span></label>`;
}
function mountFpop(bar){
  const chip = bar.querySelector(`.fchip[data-fg="${fpopOpen}"]`);
  if(!chip){ fpopOpen=null; return; }
  const pop = document.createElement("div");
  pop.className = "fpop"; pop.id = "fpop";
  pop.innerHTML = fpopBodyHTML(fpopOpen);
  bar.appendChild(pop);
  // posicionar bajo el chip, sin salirse de la barra
  const left = Math.max(0, Math.min(chip.offsetLeft, bar.clientWidth - Math.min(280, bar.clientWidth)));
  pop.style.left = left+"px";
  pop.style.top  = (chip.offsetTop + chip.offsetHeight + 6)+"px";
  // interacciones del popover
  if(fpopOpen==="price"){
    const apply = ()=>{
      const mn = pop.querySelector("#fpMin").value, mx = pop.querySelector("#fpMax").value;
      priceMin = mn==="" ? null : Math.max(0, Number(mn));
      priceMax = mx==="" ? null : Math.max(0, Number(mx));
      if(priceMin!=null && priceMax!=null && priceMin>priceMax){ const t=priceMin; priceMin=priceMax; priceMax=t; }
      fpopOpen = null; refreshFilters();
    };
    pop.querySelector("#fpApply").onclick = apply;
    pop.querySelectorAll("input").forEach(i=> i.addEventListener("keydown", e=>{ if(e.key==="Enter") apply(); }));
    return;
  }
  pop.querySelectorAll("input[type=checkbox]").forEach(cb=>{
    cb.addEventListener("change", ()=>{
      const g = filterGroups().find(x=>x.id===fpopOpen); if(!g) return;
      const v = cb.getAttribute("data-fv");
      if(g.sel.has(v)) g.sel.delete(v); else g.sel.add(v);
      renderFilterBar(); renderGrid(); syncMobileFilters();
    });
  });
}
function clearGroup(id){
  if(id==="foil") foilOnly = false;
  else if(id==="price"){ priceMin=null; priceMax=null; }
  else { const g = filterGroups().find(x=>x.id===id); if(g) g.sel.clear(); }
  if(fpopOpen===id) fpopOpen = null;
  refreshFilters();
}
function refreshFilters(){ renderFilterBar(); renderGrid(); syncMobileFilters(); }
function syncMobileFilters(){ if(typeof renderMobileFilters==="function") renderMobileFilters(); }
// eventos de la barra (delegados) + cerrar al hacer clic fuera / Escape
document.addEventListener("click", e=>{
  const bar = $("#fbar"); if(!bar) return;
  if(!bar.contains(e.target)){ if(fpopOpen){ fpopOpen=null; renderFilterBar(); } return; }
  const x = e.target.closest(".fchip__x");
  if(x){ e.stopPropagation(); clearGroup(x.closest(".fchip").dataset.fg); return; }
  if(e.target.closest(".fclear")){ clearSubFilters(); fpopOpen=null; refreshFilters(); return; }
  const chip = e.target.closest(".fchip");
  if(chip){
    const id = chip.dataset.fg;
    if(id==="foil"){ foilOnly = !foilOnly; refreshFilters(); return; }
    fpopOpen = (fpopOpen===id) ? null : id;
    renderFilterBar();
  }
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && fpopOpen){ fpopOpen=null; renderFilterBar(); } });

/* ============================================================
   GRID
   ============================================================ */
const GRID_PAGE_SIZE = 25;   // cartas por página en la tienda
let gridPage = 1;
let _lastFilterSig = "";     // para detectar cambios de filtro y volver a la página 1
// except: omite UN grupo de filtros ("set"|"rar"|"ct"|"dom"|"foil"|"cond"|"price")
// para calcular los conteos contextuales de ese dropdown (estilo TCGplayer).
function getFiltered(except){
  let items = PRODUCTS.filter(p=>{
    if(!showSoldOut && !isAvailable(p)) return false;   // por defecto, solo disponibles
    if(activeCat!=="Todas" && p.cat!==activeCat) return false;
    if(activeType!=="all" && (p.type||"single")!==activeType) return false;
    if(except!=="set"  && selSets.size  && !selSets.has(p.set)) return false;
    if(except!=="rar"  && selRars.size  && !selRars.has(p._rar)) return false;
    if(except!=="ct"   && selCTs.size   && !selCTs.has(p._ct)) return false;
    if(except!=="dom"  && selDoms.size  && !(p._doms||[]).some(d=>selDoms.has(d))) return false;
    if(except!=="foil" && foilOnly && p.foil==null) return false;
    if(except!=="cond" && selConds.size && !selConds.has(p.cond||"")) return false;
    if(except!=="price"){
      const pr = Number(p.price||0);
      if(priceMin!=null && pr < priceMin) return false;
      if(priceMax!=null && pr > priceMax) return false;
    }
    if(query && !matchQuery(p, query)) return false;
    return true;
  });
  if(except) return items;   // para conteos no hace falta ordenar
  if(sortMode==="price-asc")  items.sort((a,b)=>a.price-b.price);
  else if(sortMode==="price-desc") items.sort((a,b)=>b.price-a.price);
  else if(sortMode==="name")  items.sort((a,b)=>a.name.localeCompare(b.name,"es"));
  return items;
}
// crea el <article> de una carta (factorizado para poder APPEND-ear en "Cargar más")
function makeCard(p, i){
  const el = document.createElement("article");
  el.className = "card";
  el.style.animationDelay = (Math.min(i,16)*40)+"ms";   // tope para que no se acumulen delays gigantes
  const metaLine = p.type==="sealed"
    ? `${p.set?p.set+" · ":""}Producto sellado`
    : `${p.set?p.set+" · ":""}${p.cond}`;
  const stockN = (p.stock===undefined || p.stock===null || p.stock==="") ? null : Number(p.stock);
  // disponibilidad según la variante elegida (normal / foil con su propio stock)
  const availOf = (foil)=>{
    if(foil){ const sf=stockValF(p); if(sf===null) return {count:stockN, out:(stockN!==null&&stockN<=0)}; return {count:sf, out:sf<=0}; }
    return {count:stockN, out:(stockN!==null&&stockN<=0)};
  };
  const stockLineHTML = (a, foil)=>{
    if(a.count===null) return "";
    if(a.out) return `<span class="card__stock card__stock--out">Agotado${foil?" en foil":""}</span>`;
    if(a.count<=3) return `<span class="card__stock card__stock--low">¡Solo ${a.count} disponible${a.count>1?"s":""}!</span>`;
    return `<span class="card__stock">${a.count} disponibles</span>`;
  };
  const a0 = availOf(false);
  const href = cartaHref(p) || "#";
  const mediaHtml = `<a class="card__link" href="${href}" data-pid="${p.id}" aria-label="Ver detalle de ${p.name}">${media(p,"card__photo")}</a>`;
  const nameHtml = `<a class="card__link" href="${href}" data-pid="${p.id}">${p.name}</a>`;
  el.innerHTML = `
    <div class="card__img${p.img?" card__img--photo":""}${a0.out?" card__img--out":""}">
      ${p.badge?`<span class="card__badge">${p.badge}</span>`:""}
      <button class="card__fav" aria-label="Favorito" title="Guardar">♡</button>
      ${mediaHtml}
    </div>
    <div class="card__body">
      <span class="card__cat">${p.cat}${p.color?" · "+p.color:""}</span>
      <h3 class="card__name" style="font-size:${cardNameSize(p.name)}">${nameHtml}</h3>
      <span class="card__meta">${metaLine}</span>
      <div class="card__stockwrap">${stockLineHTML(a0,false)}</div>
      ${p.foil!=null?`<div class="ftoggle" role="group" aria-label="Acabado de la carta">
        <button type="button" class="ftoggle__btn is-on" data-v="normal">Normal</button>
        <button type="button" class="ftoggle__btn" data-v="foil">Foil ✨</button>
      </div>`:""}
      <div class="card__foot">
        <span class="card__price">${fmt(p.price)}</span>
        ${p.cond?`<span class="card__cond ${condClass(p.cond)}">${condShort(p.cond)}</span>`:""}
        <button class="card__add" data-id="${p.id}"${a0.out?" disabled":""}>${a0.out?"Agotado":"Añadir"}</button>
      </div>
    </div>`;
  const addBtn = el.querySelector(".card__add");
  const imgBox = el.querySelector(".card__img");
  const stockWrap = el.querySelector(".card__stockwrap");
  let cardFoil = false;
  const paintAvail = ()=>{
    const a = availOf(cardFoil);
    stockWrap.innerHTML = stockLineHTML(a, cardFoil);
    addBtn.disabled = a.out;
    addBtn.textContent = a.out ? "Agotado" : "Añadir";
    imgBox.classList.toggle("card__img--out", a.out);
  };
  if(p.foil!=null){
    const tgl = el.querySelector(".ftoggle");
    const priceEl = el.querySelector(".card__price");
    tgl.querySelectorAll(".ftoggle__btn").forEach(b=>{
      b.onclick = ()=>{
        cardFoil = b.dataset.v==="foil";
        tgl.querySelectorAll(".ftoggle__btn").forEach(x=>x.classList.toggle("is-on", x===b));
        priceEl.textContent = fmt(cardFoil ? p.foil : p.price);
        priceEl.classList.toggle("card__price--foil", cardFoil);
        paintAvail();
      };
    });
  }
  addBtn.onclick = ()=>{
    if(addBtn.disabled) return;
    addToCart(p.id, cardFoil);
    addBtn.classList.add("card__add--done");
    addBtn.textContent = "✓ Agregado";
    clearTimeout(addBtn._doneT);
    addBtn._doneT = setTimeout(()=>{ addBtn.classList.remove("card__add--done"); paintAvail(); }, 1500);
  };
  el.querySelector(".card__fav").onclick = (e)=>{
    e.currentTarget.textContent = e.currentTarget.textContent==="♡" ? "♥" : "♡";
    e.currentTarget.style.color = e.currentTarget.textContent==="♥" ? "var(--gold-bright)" : "";
  };
  return el;
}
function renderGrid(){
  const grid = $("#grid");
  const items = getFiltered();
  const cnt = $("#resultCount"); if(cnt) cnt.textContent = items.length ? `${items.length} resultado${items.length!==1?"s":""}` : "";
  const empty = $("#empty");
  if(empty){
    empty.hidden = items.length>0;
    if(!items.length){
      empty.innerHTML = (PRODUCTS.length < CATALOG_MIN)
        ? `Catálogo en preparación<br><a href="https://wa.me/${WHATSAPP}?text=%C2%A1Hola%20Reroll!%20%C2%BFTen%C3%A9s%20esto%3A%20" target="_blank" rel="noopener" class="empty__cta">Escribinos por WhatsApp y te conseguimos lo que buscás →</a>`
        : `No encontramos eso en este filtro. <a href="https://wa.me/${WHATSAPP}?text=%C2%A1Hola%20Reroll!%20Busco%3A%20" target="_blank" rel="noopener" class="empty__cta">Pedilo por WhatsApp →</a>`;
    }
  }
  // paginación: 25 por página; vuelve a la pág. 1 si cambió algún filtro/orden/búsqueda
  const sig = [activeCat,activeType,[...selSets],[...selRars],[...selCTs],[...selDoms],[...selConds],foilOnly,priceMin,priceMax,sortMode,query].join("|");
  if(sig !== _lastFilterSig){ gridPage = 1; _lastFilterSig = sig; }
  const totalPages = Math.max(1, Math.ceil(items.length / GRID_PAGE_SIZE));
  if(gridPage > totalPages) gridPage = totalPages;
  const startIdx = (gridPage - 1) * GRID_PAGE_SIZE;
  grid.innerHTML = "";
  items.slice(startIdx, startIdx + GRID_PAGE_SIZE).forEach((p,i)=> grid.appendChild(makeCard(p,i)));
  renderPager(items.length, totalPages);
}
/* ---------- Paginador del catálogo (25 por página) ---------- */
function pageWindow(cur, total){
  const set = new Set([1, total, cur, cur-1, cur+1]);
  const sorted = [...set].filter(p=>p>=1 && p<=total).sort((a,b)=>a-b);
  const out = []; let prev = 0;
  sorted.forEach(p=>{ if(p-prev>1) out.push("…"); out.push(p); prev=p; });
  return out;
}
function renderPager(total, totalPages){
  const wrap = $("#gridPager"); if(!wrap) return;
  if(totalPages <= 1){ wrap.innerHTML = ""; wrap.hidden = true; return; }
  wrap.hidden = false;
  const from = (gridPage-1)*GRID_PAGE_SIZE + 1;
  const to   = Math.min(gridPage*GRID_PAGE_SIZE, total);
  let html = `<button class="gridpager__btn" data-pg="prev"${gridPage<=1?" disabled":""} aria-label="Anterior">‹</button>`;
  pageWindow(gridPage, totalPages).forEach(p=>{
    html += (p==="…")
      ? `<span class="gridpager__dots">…</span>`
      : `<button class="gridpager__btn${p===gridPage?" is-active":""}" data-pg="${p}">${p}</button>`;
  });
  html += `<button class="gridpager__btn" data-pg="next"${gridPage>=totalPages?" disabled":""} aria-label="Siguiente">›</button>`;
  html += `<span class="gridpager__info">${from}–${to} de ${total}</span>`;
  wrap.innerHTML = html;
  wrap.querySelectorAll("[data-pg]").forEach(b=>{
    b.onclick = ()=>{
      const v = b.dataset.pg;
      if(v==="prev") gridPage = Math.max(1, gridPage-1);
      else if(v==="next") gridPage = Math.min(totalPages, gridPage+1);
      else gridPage = Number(v);
      renderGrid();
      (document.getElementById("catalogo") || document.getElementById("grid"))?.scrollIntoView({behavior:"smooth", block:"start"});
    };
  });
}

/* ============================================================
   CARRITO
   ============================================================ */
// clave de línea: distingue variante normal vs foil de una misma carta
function lineKey(id, foil){ return foil ? id+"_f" : String(id); }
// consolidar carrito por clave (id+variante) y asegurar qty (migración de carritos viejos)
(function normalizeCart(){
  const map = new Map();
  cart.forEach(it=>{
    if(!it || it.id===undefined) return;
    const foil = !!it.foil;
    const key = it.key || lineKey(it.id, foil);
    if(map.has(key)) map.get(key).qty += (it.qty||1);
    else map.set(key, { key, id:it.id, foil, name:it.name, cat:it.cat, price:it.price, emoji:it.emoji, img:it.img, qty: it.qty||1 });
  });
  cart = [...map.values()];
})();

function stockOf(id){ const p=PRODUCTS.find(x=>x.id===id); if(!p) return null; const s=p.stock; return (s===undefined||s===null||s==="")?null:Number(s); }
function cartCount(){ return cart.reduce((s,c)=>s+(c.qty||1),0); }
function cartTotal(){ return cart.reduce((s,c)=>s+Number(c.price||0)*(c.qty||1),0); }

function addToCart(id, foil){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
  foil = !!foil && p.foil!=null;                 // solo foil si la carta lo permite
  const key = lineKey(id, foil);
  const price = foil ? p.foil : p.price;
  // tope de stock por variante: el foil usa su propio stock si está definido
  let st = stockOf(id);
  if(foil){ const sf=stockValF(p); if(sf!==null) st=sf; }
  if(st!==null && st<=0){ toast(`Agotado${foil?" en foil":""}: ${p.name}`); return; }
  const line = cart.find(c=>c.key===key);
  if(line){
    if(st!==null && line.qty>=st){ toast(`Solo hay ${st}${foil?" foil":""} de ${p.name}`); return; }
    line.qty++;
  } else {
    cart.push({ key, id:p.id, foil, name:p.name+(foil?" · Foil":""), cat:p.cat, price, emoji:p.emoji, img:p.img, qty:1 });
  }
  saveCart(); toast(`Añadido: ${p.name}${foil?" (Foil)":""}`); renderCart();
}
function changeQty(key, delta){
  const line = cart.find(c=>c.key===key); if(!line) return;
  let st = stockOf(line.id);
  if(line.foil){ const p=PRODUCTS.find(x=>x.id===line.id); const sf=p?stockValF(p):null; if(sf!==null) st=sf; }
  let q = line.qty + delta;
  if(st!==null && q>st){ q=st; toast(`Solo hay ${st}${line.foil?" foil":""} disponibles`); }
  if(q<=0){ cart = cart.filter(c=>c.key!==key); }
  else line.qty = q;
  saveCart(); renderCart();
}
function removeLine(key){ cart = cart.filter(c=>c.key!==key); saveCart(); renderCart(); }

function renderCart(){
  const cc = $("#cartCount"); if(cc) cc.textContent = cartCount();
  const wrap = $("#drawerItems"); if(!wrap) return;
  if(!cart.length){
    wrap.innerHTML = `<p class="drawer__empty">Tu carrito está vacío.<br>Añade algunas cartas para empezar.</p>`;
  } else {
    wrap.innerHTML = "";
    cart.forEach(c=>{
      const row = document.createElement("div");
      row.className = "di";
      const thumb = c.img ? `<img class="di__photo" src="${imgURL(c.img,160)}" alt="" loading="lazy">` : `<div class="di__emoji">${c.emoji||SVG_CARD}</div>`;
      row.innerHTML = `
        ${thumb}
        <div class="di__info">
          <div class="di__name">${c.foil ? c.name.replace(/ · Foil$/,'')+' <span class="foilpill">✨ Foil</span>' : c.name}</div>
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
      row.querySelector('[data-act="dec"]').onclick = ()=> changeQty(c.key,-1);
      row.querySelector('[data-act="inc"]').onclick = ()=> changeQty(c.key,+1);
      row.querySelector(".di__rm").onclick = ()=> removeLine(c.key);
      wrap.appendChild(row);
    });
  }
  $("#drawerTotal").textContent = fmt(cartTotal());
}

/* ============================================================
   CHECKOUT (pago + envío)
   ============================================================ */
function resetCheckoutView(){
  // vuelve el modal al estado "formulario" (oculta la confirmación)
  const s=$("#coSuccess"); if(s) s.hidden = true;
  const summ=$(".co__summary"); if(summ) summ.style.display="";
  const form=$("#checkoutForm"); if(form) form.style.display="";
  const t=$(".co__title"); if(t) t.style.display="";
}
// datos del cliente recordados en su navegador (nombre/teléfono/entrega) — no es cuenta
function loadCliente(){ try{ return JSON.parse(localStorage.getItem("reroll_cliente")||"null"); }catch(e){ return null; } }
function prefillCheckout(){
  const c = loadCliente(); const form = $("#checkoutForm"); if(!c || !form) return;
  ["nombre","telefono","direccion"].forEach(k=>{ if(c[k] && form[k]) form[k].value = c[k]; });
  if(c.entrega && form.entrega){ form.entrega.value = c.entrega; toggleEnvio(); }
  if(c.provincia && form.provincia){ form.provincia.value = c.provincia; }
}
function openCheckout(){
  if(!cart.length){ toast("Tu carrito está vacío"); return; }
  resetCheckoutView();
  $("#coItems").innerHTML = cart.map(c=>`<div class="co__line"><span>${c.name} ×${c.qty}</span><b>${fmt(c.price*c.qty)}</b></div>`).join("");
  $("#coTotal").textContent = fmt(cartTotal());
  $("#sinpeData").textContent = `${SINPE_NOMBRE} · ${SINPE_NUMERO}`;
  prefillCheckout();   // trae nombre/teléfono/datos si el cliente eligió "recordar"
  const m=$("#checkoutModal"); m.classList.add("open"); m.setAttribute("aria-hidden","false");
  $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden","true");
  const nom = $("#checkoutForm")?.querySelector('[name="nombre"]');
  if(nom){ if(nom.value){ $("#checkoutForm").querySelector('[name="telefono"]')?.focus(); } else nom.focus(); }
}
function toggleEnvio(){
  const envio = $("#coEntrega").value === "envio";
  $("#coEnvioFields").style.display = envio ? "" : "none";
}
function togglePago(){
  $("#sinpeBox").style.display = $("#coPago").value === "SINPE Móvil" ? "" : "none";
}
function showFieldError(el, msg){
  if(!el) return;
  el.classList.add("is-error"); el.setAttribute("aria-invalid","true");
  let m = el.parentNode.querySelector(".co__err");
  if(!m){ m=document.createElement("span"); m.className="co__err"; el.parentNode.appendChild(m); }
  m.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/></svg> ${msg}`;
  el.oninput = ()=>{ el.classList.remove("is-error"); el.removeAttribute("aria-invalid"); m.remove(); el.oninput=null; };
}
function showCheckoutSuccess(url){
  $("#coWaLink").href = url;
  const summ=$(".co__summary"); if(summ) summ.style.display="none";
  $("#checkoutForm").style.display="none";
  const t=$(".co__title"); if(t) t.style.display="none";
  const s=$("#coSuccess"); if(s){ s.hidden=false; s.querySelector("#coWaLink")?.focus(); }
}
// si la API avisa que ya no alcanza el stock (alguien reservó antes), ajusta el carrito
function ajustarCarritoPorFaltantes(faltantes){
  const avisos = [];
  (faltantes||[]).forEach(fa=>{
    const key = lineKey(fa.id, fa.foil);
    const line = cart.find(c=>c.key===key); if(!line) return;
    const nm = line.name.replace(/ · Foil$/,"") + (fa.foil ? " (Foil)" : "");
    if(fa.disponible>0){ line.qty = fa.disponible; avisos.push(`${nm}: quedan ${fa.disponible}`); }
    else { cart = cart.filter(c=>c.key!==key); avisos.push(`${nm}: se agotó`); }
  });
  saveCart(); renderCart();
  toast(avisos.length ? ("Uy — alguien apartó antes. Ajustamos tu carrito: " + avisos.join(" · ")) : "Alguna carta se agotó; revisá el carrito");
}
async function submitCheckout(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const entrega = f.get("entrega");
  const pago = f.get("pago");
  const nombre = (f.get("nombre")||"").trim();
  const telefono = (f.get("telefono")||"").trim();
  // Validación: teléfono con al menos 8 dígitos (formato CR)
  if((telefono.match(/\d/g)||[]).length < 8){
    showFieldError(e.target.querySelector('[name="telefono"]'), "Poné un número de teléfono válido (8 dígitos)."); return;
  }
  // Validación: si es envío, la dirección es obligatoria
  if(entrega==="envio"){
    const dir = (f.get("direccion")||"").trim();
    if(!dir){ showFieldError(e.target.querySelector('[name="direccion"]'), "Necesitamos la dirección para el envío."); return; }
  }
  const prov = (f.get("provincia")||"").trim();
  const dir  = (f.get("direccion")||"").trim();
  // recordar / olvidar datos del cliente (solo su navegador)
  if(f.get("recordar")) localStorage.setItem("reroll_cliente", JSON.stringify({ nombre, telefono, entrega, provincia: prov, direccion: dir }));
  else localStorage.removeItem("reroll_cliente");
  // ---- 1) reservar el pedido en la API (si está disponible) ----
  const sbtn = e.target.querySelector('[type="submit"]');
  if(sbtn){ sbtn.disabled = true; }
  let pedidoId = null;
  try{
    const r = await fetch("api/pedido", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono, entrega, provincia: prov, direccion: dir, pago,
        items: cart.map(c=>({ id: c.id, foil: !!c.foil, qty: c.qty||1 })) })
    });
    if(r.status===409){
      const j = await r.json().catch(()=>null);
      ajustarCarritoPorFaltantes(j && j.faltantes);
      if(sbtn) sbtn.disabled = false;
      return;   // el cliente revisa el carrito ajustado y reenvía
    }
    if(r.ok){ const j = await r.json().catch(()=>null); if(j && j.ok) pedidoId = j.id; }
  }catch(err){ /* API no disponible (ej. local): el pedido va solo por WhatsApp, sin reserva */ }
  if(sbtn) sbtn.disabled = false;
  // ---- 2) mensaje de WhatsApp (igual que siempre, + número de pedido si hubo reserva) ----
  const items = cart.map(c=>`• ${c.name} ×${c.qty} (${c.cat}) — ${fmt(c.price*c.qty)}`).join("%0A");
  let msg = pedidoId
    ? `¡Hola Reroll! Pedido *%23${pedidoId}*:%0A${items}%0A%0ASubtotal: ${fmt(cartTotal())}`
    : `¡Hola Reroll! Quiero hacer un pedido:%0A${items}%0A%0ASubtotal: ${fmt(cartTotal())}`;
  msg += `%0A%0ANombre: ${nombre}%0ATel: ${telefono}`;
  if(entrega==="envio"){
    msg += `%0AEntrega: Envío por Correos de Costa Rica%0AProvincia: ${prov}%0ADirección: ${dir}%0A(el costo de envío se confirma según destino)`;
  } else {
    msg += `%0AEntrega: Retiro en Cartago`;
  }
  msg += `%0APago: ${pago}`;
  if(pago==="SINPE Móvil") msg += `%0A(SINPE a ${SINPE_NOMBRE} ${SINPE_NUMERO})`;
  if(pedidoId) msg += `%0A%0A(Cartas reservadas 48 h con el pedido %23${pedidoId})`;
  const url = `https://wa.me/${WHATSAPP}?text=${msg}`;
  window.open(url, "_blank", "noopener");
  showCheckoutSuccess(url);   // confirmación + enlace de respaldo si el pop-up se bloquea
  // ---- 3) con reserva creada: bajar stock local y vaciar el carrito ----
  if(pedidoId){
    const rm = {};
    cart.forEach(c=>{ const k=lineKey(c.id, !!c.foil); rm[k]=(rm[k]||0)+(c.qty||1); });
    applyReservas(rm);
    cart = []; saveCart(); renderCart(); renderGrid();
  }
}

/* ============================================================
   DRAWER / MODALES
   ============================================================ */
let lastFocused = null;
function openDrawer(){
  lastFocused = document.activeElement;
  const d=$("#drawer"); d.classList.add("open"); d.setAttribute("aria-hidden","false");
  d.querySelector(".drawer__x")?.focus();   // mueve el foco dentro del panel
}
function closeAll(){
  ["#drawer","#checkoutModal"].forEach(s=>{ const el=$(s); if(el){ el.classList.remove("open"); el.setAttribute("aria-hidden","true"); } });
  if(lastFocused && lastFocused.focus){ lastFocused.focus(); lastFocused=null; }   // devuelve el foco al disparador
}
$("#cartBtn").onclick = openDrawer;
$$("[data-close]").forEach(el=> el.onclick = closeAll);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeAll(); });

/* ============================================================
   BUSCADOR
   ============================================================ */
// debounce genérico (evita re-renderizar la grilla en cada tecla)
const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

// índice del resultado resaltado por teclado (-1 = ninguno)
let srActive = -1;

// ARIA de combobox: se cablea una vez si existe el desplegable (solo en el hero)
(function initComboAria(){
  const inp = $("#searchInput"), box = $("#searchResults");
  if(!inp || !box) return;
  inp.setAttribute("role", "combobox");
  inp.setAttribute("aria-autocomplete", "list");
  inp.setAttribute("aria-controls", "searchResults");
  inp.setAttribute("aria-expanded", "false");
  box.setAttribute("role", "listbox");
  box.setAttribute("aria-label", "Resultados de búsqueda");
})();

// desplegable de resultados en vivo
function renderSearchResults(){
  const box = $("#searchResults"), inp = $("#searchInput"); if(!box) return;
  srActive = -1; if(inp) inp.removeAttribute("aria-activedescendant");
  const q = query.trim().toLowerCase();
  if(!q){ box.hidden = true; box.innerHTML = ""; inp && inp.setAttribute("aria-expanded","false"); return; }
  const all = PRODUCTS.filter(p=> (showSoldOut || isAvailable(p)) && matchQuery(p, query));
  const matches = all.slice(0,5);   // 5 en el desplegable; el resto via "Ver todos" (evita que lo corte la sección de abajo)
  box.hidden = false; inp && inp.setAttribute("aria-expanded","true");
  if(!matches.length){ box.innerHTML = `<div class="sr__empty">Sin resultados para “${query}”. Probá otro nombre o juego.</div>`; return; }
  box.innerHTML = matches.map((p,i)=>`
    <button type="button" class="sr" id="sr-opt-${i}" role="option" aria-selected="false" data-id="${p.id}">
      <span class="sr__media">${p.img?`<img src="${imgURL(p.img,120)}" alt="" loading="lazy">`:`<span class="sr__emoji">${p.emoji||SVG_CARD}</span>`}</span>
      <span class="sr__info">
        <span class="sr__name">${p.name}</span>
        <span class="sr__meta">${p.cat}${p.set?" · "+p.set:""} · ${p.type==="sealed"?"Sellado":p.cond}</span>
      </span>
      <span class="sr__price">${fmt(p.price)}</span>
    </button>`).join("")
    + (all.length > matches.length
        ? `<button type="button" class="sr__more" id="srMore">Ver los ${all.length} resultados de “${query}” ↓</button>`
        : "");
  box.querySelectorAll(".sr").forEach(el=> el.onclick = ()=> chooseResult());
  const more = box.querySelector("#srMore");
  if(more) more.onclick = ()=> chooseResult();   // mismo flujo: catálogo filtrado con TODAS las coincidencias
}
// confirma la búsqueda y lleva al catálogo (clic o Enter sobre un resultado)
function chooseResult(){
  const box = $("#searchResults"); if(box) box.hidden = true;
  const inp = $("#searchInput"); if(inp) inp.setAttribute("aria-expanded","false");
  activeCat = "Todas"; activeType="all"; clearSubFilters(); fpopOpen=null;
  renderGameBar(); renderFilters(); renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
}
// resalta el resultado i (navegación con flechas)
function setSrActive(i){
  const box = $("#searchResults"), inp = $("#searchInput"); if(!box) return;
  const opts = [...box.querySelectorAll(".sr")]; if(!opts.length) return;
  srActive = (i + opts.length) % opts.length;
  opts.forEach((o,idx)=> o.setAttribute("aria-selected", idx===srActive ? "true" : "false"));
  const cur = opts[srActive];
  if(inp) inp.setAttribute("aria-activedescendant", cur.id);
  cur.scrollIntoView({block:"nearest"});
}

const debouncedGrid = debounce(renderGrid, 150);   // suaviza el tipeo sobre 900+ cartas
$("#searchForm").addEventListener("submit", e=>{
  e.preventDefault();
  query = $("#searchInput").value.trim();
  $("#searchResults") && ($("#searchResults").hidden = true);
  renderGrid();
  document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});
});
$("#searchInput").addEventListener("input", e=>{ query = e.target.value.trim(); const qs=$("#quickSearch"); if(qs) qs.value=e.target.value; renderSearchResults(); debouncedGrid(); });
// buscador rápido de la barra de filtros (home): filtra el grid por nombre, sin desplegable
$("#quickSearch")?.addEventListener("input", e=>{ query = e.target.value.trim(); const hero=$("#searchInput"); if(hero) hero.value=e.target.value; debouncedGrid(); });
// navegación con teclado dentro del desplegable
$("#searchInput").addEventListener("keydown", e=>{
  const box = $("#searchResults"); if(!box || box.hidden) return;
  const has = box.querySelectorAll(".sr").length;
  if(e.key==="ArrowDown"){ e.preventDefault(); if(has) setSrActive(srActive+1); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); if(has) setSrActive(srActive-1); }
  else if(e.key==="Enter"){ if(srActive>=0 && has){ e.preventDefault(); chooseResult(); } }
  else if(e.key==="Escape"){ box.hidden = true; $("#searchInput").setAttribute("aria-expanded","false"); }
});
// cerrar el desplegable al hacer clic fuera
document.addEventListener("click", e=>{ const box=$("#searchResults"); if(box && !e.target.closest(".search")){ box.hidden = true; $("#searchInput")?.setAttribute("aria-expanded","false"); } });

// selects de filtro
// sincroniza el toggle "Mostrar agotadas" (checkbox de escritorio + el del panel móvil)
function setShowSoldOut(val){
  showSoldOut = !!val;
  const a=$("#showSoldOut"), b=$("#mfSoldOut");
  if(a) a.checked = showSoldOut;
  if(b) b.checked = showSoldOut;
  renderGrid();
}
document.addEventListener("change", e=>{
  if(e.target.id==="sortFilter"){ sortMode = e.target.value; renderGrid(); }
  if(e.target.id==="showSoldOut" || e.target.id==="mfSoldOut"){ setShowSoldOut(e.target.checked); }
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
      <div class="herofan__media">${p.img?`<img src="${imgURL(p.img,500)}" alt="${p.name}">`:`<span class="herofan__emoji">${p.emoji||SVG_CARD}</span>`}</div>
      <div class="herofan__info">
        <span class="herofan__name">${p.name}</span>
        <span class="herofan__price">${fmt(p.price)}</span>
      </div>
    </div>`).join("");
}

/* ============================================================
   "TRABAJAMOS CON" · paneles altos por juego (arte + logo)
   Estilo cardnexus en vino/dorado: cada panel abre juego.html.
   ============================================================ */
const TRADE_GAMES = ["One Piece","Riftbound","Pokémon","Magic","Yu-Gi-Oh"];
const PANEL_ART = {
  "One Piece":"assets/arts/one-piece.webp",
  "Riftbound":"assets/arts/riftbound.webp",
  "Pokémon":  "assets/arts/pokemon.webp",
  "Magic":    "assets/arts/magic.webp",
  "Yu-Gi-Oh": "assets/arts/yugioh.webp",
};
// dimensiones intrínsecas de cada arte (width/height en el <img> → reserva espacio, evita CLS)
const PANEL_ART_DIMS = {
  "One Piece":[425,595], "Riftbound":[600,838], "Pokémon":[469,654],
  "Magic":[600,840], "Yu-Gi-Oh":[600,600],
};
const PANEL_FOCUS = { "Yu-Gi-Oh":"center 22%" };   // recorte fino donde haga falta
const PANEL_RY = ["13deg","7deg","0deg","-7deg","-13deg"];   // inclinación tipo abanico
function renderTradePanels(){
  const wrap = $("#tradePanels"); if(!wrap) return;
  wrap.innerHTML = "";
  TRADE_GAMES.forEach((cat,i)=>{
    const b = BRANDS.find(x=>x.cat===cat) || { cat, color:"#C13B26", name:cat };
    const a = document.createElement("a");
    a.className = "tpanel";
    a.href = `juego.html?g=${encodeURIComponent(cat)}`;
    a.setAttribute("aria-label", `Ver catálogo de ${cat}`);
    a.style.setProperty("--c", b.color);
    a.style.setProperty("--ry", PANEL_RY[i] || "0deg");
    a.style.setProperty("--d", (i*0.3)+"s");
    const art = document.createElement("img");
    art.className = "tpanel__art"; art.alt = "";   // eager: pocos webps y van alto en la página
    art.style.objectPosition = PANEL_FOCUS[cat] || "center";
    const ad = PANEL_ART_DIMS[cat]; if(ad){ art.width = ad[0]; art.height = ad[1]; }
    art.src = PANEL_ART[cat];
    const shade = document.createElement("span"); shade.className = "tpanel__shade"; shade.setAttribute("aria-hidden","true");
    const sheen = document.createElement("span"); sheen.className = "tpanel__sheen"; sheen.setAttribute("aria-hidden","true");
    const logo = document.createElement("img");
    logo.className = "tpanel__logo"; logo.alt = b.name; logo.loading = "lazy";
    if(b.lw){ logo.width = b.lw; logo.height = b.lh; }
    logo.onerror = ()=>{ logo.remove(); const s=document.createElement("span"); s.className="tpanel__txt"; s.textContent=cat; a.appendChild(s); };
    logo.src = b.logoLight || b.logo;
    a.append(art, shade, sheen, logo);
    wrap.appendChild(a);
  });
}

/* ============================================================
   SINGLES DESTACADOS · abanico de cartas (las más caras, al azar)
   precio > ₡5000, cualquier juego, en stock, solo verticales.
   Rota a una mano nueva cada 2 min (o con las flechas).
   ============================================================ */
const FEATURED_MIN_PRICE = 5000;
// fracciones del ancho de carta por slot (7 cartas) → fan responsivo via --cw
const FAN_FRACT = [
  {xf:-1.45, yf:0.34, rot:-21, sc:0.776, z:1},
  {xf:-1.00, yf:0.19, rot:-14, sc:0.85,  z:2},
  {xf:-0.52, yf:0.06, rot:-7,  sc:0.935, z:3},
  {xf: 0.00, yf:0.00, rot:0,   sc:1.0,   z:10},
  {xf: 0.52, yf:0.06, rot:7,   sc:0.935, z:3},
  {xf: 1.00, yf:0.19, rot:14,  sc:0.85,  z:2},
  {xf: 1.45, yf:0.34, rot:21,  sc:0.776, z:1},
];
function isVerticalCard(p){ return p.img && !/1039x744/.test(p.img); }   // excluye battlefields horizontales
function featuredPool(){
  return PRODUCTS.filter(p=> isAvailable(p) && Number(p.price) > FEATURED_MIN_PRICE && isVerticalCard(p));
}
function shuffleArr(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function fanSlotConfig(total, i){
  if(total>=7) return FAN_FRACT[i];
  const center=(total-1)/2; const d = total>1 ? (i-center)/Math.max(1,center) : 0; const ad=Math.abs(d);
  return { xf:d*1.45, yf:ad*ad*0.34, rot:d*21, sc:1-0.224*ad*ad, z:10-Math.round(Math.abs(i-center)) };
}
let _fanSlots = [];   // elementos .fan-slot de la mano actual
let _fanN = 0;
let _fanRot = 0;      // rotación de la mano: qué carta está al centro
// posiciona cada carta según la rotación actual (las flechas / el toque animan esto)
function layoutHand(){
  if(!_fanN) return;
  const center = _fanN >> 1;
  _fanSlots.forEach((slot, k)=>{
    const disp = (((k + _fanRot) % _fanN) + _fanN) % _fanN;   // posición visible de esta carta
    const cfg = fanSlotConfig(_fanN, disp);
    slot.style.setProperty("--xf", cfg.xf);
    slot.style.setProperty("--yf", cfg.yf);
    slot.style.setProperty("--rot", cfg.rot+"deg");
    slot.style.setProperty("--scale", cfg.sc);
    slot.style.setProperty("--z", cfg.z);
    slot.classList.toggle("is-center", disp === center);
  });
}
function renderFanCarousel(){
  const stage=$("#fanStage"), section=$("#featured"); if(!stage||!section) return;
  const pool = featuredPool();
  if(pool.length < 3){ section.hidden = true; return; }   // sin suficientes cartas → no mostrar la sección
  section.hidden = false;
  _fanN = Math.min(7, pool.length);
  _fanRot = 0;
  const pick = shuffleArr(pool).slice(0, _fanN);
  stage.innerHTML = "";
  _fanSlots = pick.map((p,i)=>{
    const slot = document.createElement("a");
    slot.className = "fan-slot";
    // la carta destacada lleva a su detalle; si no tuviera slug, cae al catálogo del juego
    slot.href = cartaHref(p) || `juego.html?g=${encodeURIComponent(p.cat)}`;
    slot.setAttribute("aria-label", `Ver ${p.name} · ${p.cat} · ${fmt(p.price)}`);
    const card = document.createElement("span"); card.className = "fan-card";
    const img = document.createElement("img"); img.src = imgURL(p.img,360); img.alt = p.name; img.loading = "lazy";
    const price = document.createElement("span"); price.className = "fan-card__price"; price.textContent = fmt(p.price);
    card.append(img, price); slot.appendChild(card);
    // toque/clic: si NO es la del centro, la trae al frente; si ya está al centro, abre el link
    slot.addEventListener("click", (e)=>{
      const center = _fanN >> 1;
      const disp = (((i + _fanRot) % _fanN) + _fanN) % _fanN;
      if(disp !== center){ e.preventDefault(); _fanRot += (center - disp); layoutHand(); resetFanTimer(); }
    });
    stage.appendChild(slot);
    requestAnimationFrame(()=> setTimeout(()=> card.classList.add("in"), 80 + i*70));   // reparto escalonado
    return slot;
  });
  layoutHand();
}
function reDealFan(){
  const stage=$("#fanStage"); if(!stage || $("#featured")?.hidden) return;
  stage.style.opacity = "0";
  setTimeout(()=>{ renderFanCarousel(); stage.style.opacity = "1"; }, 380);
}
function fanCycle(dir){ if(!_fanN) return; _fanRot += dir; layoutHand(); resetFanTimer(); }
let _fanTimer = null;
// auto-rotación cada 1 min (se reinicia con cada interacción; respeta reduce-motion)
function resetFanTimer(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if(_fanTimer) clearInterval(_fanTimer);
  _fanTimer = setInterval(reDealFan, 60000);
}
let _fanWired = false;
function startFanRotation(){
  if(_fanWired) return; _fanWired = true;
  $("#fanPrev")?.addEventListener("click", ()=> fanCycle(-1));   // carta anterior al centro
  $("#fanNext")?.addEventListener("click", ()=> fanCycle(1));    // carta siguiente al centro
  resetFanTimer();
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
  let last=-1, hideTimer;
  function pick(){ let i; do{ i=Math.floor(Math.random()*TIPS.length); }while(i===last && TIPS.length>1); last=i; return TIPS[i]; }
  function show(){ bubble.classList.add("swap"); setTimeout(()=>{ textEl.textContent=pick(); bubble.classList.remove("swap"); },320); }
  // La nube está oculta por defecto (desktop y móvil): se abre con hover/toque y se esconde sola (no tapa el catálogo)
  function openTip(){ wrap.classList.add("tip-open"); clearTimeout(hideTimer); hideTimer=setTimeout(()=>wrap.classList.remove("tip-open"), 6000); }
  function reroll(){
    dice.classList.remove("roll"); void dice.offsetWidth; dice.classList.add("roll");
    show(); openTip();
  }
  textEl.textContent = pick();
  dice.addEventListener("click", reroll);               // toque/click: nuevo dato + abre
  dice.addEventListener("mouseenter", openTip);         // hover (desktop): solo asoma la nube
  // se asoma una vez al cargar para que no pase desapercibida, luego se esconde sola
  setTimeout(openTip, 3500);
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
const heroGlow = $(".hero__glow");   // solo existe en la home; en juego.html es null
window.addEventListener("scroll", ()=>{
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y>10);
  // resplandor reactivo al scroll: parallax suave + desvanecido al bajar
  if(heroGlow){
    heroGlow.style.transform = `translateY(${y*0.25}px) scale(${1+Math.min(y,600)/3000})`;
    heroGlow.style.opacity   = Math.max(0, 1 - y/650);
  }
}, {passive:true});

const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
}, {threshold:0.12});
$$(".reveal").forEach(el=> io.observe(el));

function countUp(el, target){
  if(!el) return;
  const dur=1100, t0=performance.now(), ease=t=>1-Math.pow(1-t,3);   // easeOutCubic: arranca rápido y desacelera
  function tick(now){ const p=Math.min(1,(now-t0)/dur); el.textContent=Math.round(ease(p)*target); if(p<1) requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}
/* conteo de los stats estáticos del hero (5 juegos, 20 años) al entrar en viewport */
(function(){
  const stats=$(".hero__stats"); if(!stats) return;
  const nums=stats.querySelectorAll("strong[data-count]");
  if(!nums.length) return;
  nums.forEach(el=> el.textContent="0");
  const obs=new IntersectionObserver((ents)=>{
    ents.forEach(e=>{ if(e.isIntersecting){ nums.forEach(el=> countUp(el, +el.getAttribute("data-count"))); obs.disconnect(); } });
  }, {threshold:0.4});
  obs.observe(stats);
})();

let toastT;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1900);
}

/* ============================================================
   CARGA DEL INVENTARIO (productos.json)
   ============================================================ */
async function loadCatalog(){
  // Índice de slugs (id → /carta/<slug>.html) para enlazar el grid al detalle.
  // No bloquea el catálogo: si falla, las cartas simplemente no se enlazan.
  try{
    const sres = await fetch("cartas.json", { cache: "no-cache" });
    if(sres.ok){ const idx = await sres.json(); if(idx && typeof idx==="object") SLUGS = idx; }
  }catch(e){ /* sin enlaces de detalle */ }
  try{
    // 'no-cache': revalida con el servidor (ETag) → 304 diminuto si no cambió el inventario,
    // 324KB solo cuando de verdad cambió. Stock siempre fresco, sin re-bajar todo en cada visita.
    const res = await fetch("productos.json", { cache: "no-cache" });
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        PRODUCTS = data.map((p,i)=> ({ id:p.id ?? i+1, type:p.type||"single", ...p }));
      }
    }
  }catch(e){ /* usamos la lista de ejemplo */ }
  try{
    // reservas de pedidos pendientes (48 h): se restan del stock que ve el cliente.
    // En local no existe /api → se ignora y la tienda funciona igual.
    const rres = await fetch("api/reservas", { cache: "no-store" });
    if(rres.ok){ const rj = await rres.json(); if(rj && rj.reservas) applyReservas(rj.reservas); }
  }catch(e){ /* sin API: sin reservas */ }
  enrichProducts();   // rareza / tipo de carta / dominio-color para los filtros avanzados
  renderGameBar(); renderGameBanner(); renderFilters(); renderGrid(); renderHeroFan(); renderGameTiles(); renderHeroChips();
  renderHeroMarquee();   // desfile de cartas reales en el hero
  renderMobileFilters(); renderSortSheet();
  renderFanCarousel();   // singles destacados (necesita precios reales)
  updateHeroStat();
}
// Fase 4: muestra el conteo real solo si hay inventario suficiente; si no, oculta el stat
function updateHeroStat(){
  const el = $("#statCount"); if(!el) return;
  const box = el.closest("div");
  const avail = PRODUCTS.filter(isAvailable).length;   // solo cartas con stock > 0
  if(avail >= STAT_MIN){ if(box) box.style.display=""; countUp(el, avail); }
  else if(box){ box.style.display = "none"; }
}

/* ============================================================
   MÓVIL · panel deslizable (bottom sheet) de Filtros y Orden
   Reusa el MISMO estado/filtrado del catálogo (getFiltered/renderGrid);
   no duplica lógica, solo cambia la presentación en celular.
   ============================================================ */
const MOBILE_GAMES = TILE_GAMES; // One Piece, Riftbound, Pokémon, Magic, Yu-Gi-Oh
function openSheet(sel){ const s=$(sel); if(!s) return; s.classList.add('open'); s.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeSheet(sel){ const s=$(sel); if(!s) return; s.classList.remove('open'); s.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
// chips multi-selección de un grupo dentro del sheet móvil
function mfChips(wrapId, g){
  const wrap=$(wrapId); if(!wrap) return;
  const opts = groupOptions(g);
  const row = wrap.closest(".msheet__row") || wrap;
  if(!opts.length && !g.sel.size){ row.style.display="none"; wrap.innerHTML=""; return; }
  row.style.display="";
  wrap.innerHTML="";
  opts.forEach(o=>{
    const chip=document.createElement("button");
    chip.type="button"; chip.className="mchip"+(g.sel.has(o.v)?" on":"");
    chip.textContent = `${o.v} (${o.n})`;
    chip.onclick=()=>{ if(g.sel.has(o.v)) g.sel.delete(o.v); else g.sel.add(o.v);
      renderFilterBar(); renderMobileFilters(); renderGrid(); };
    wrap.appendChild(chip);
  });
}
function renderMobileFilters(){
  const sheet=$("#filterSheet"); if(!sheet) return;
  // juego (solo si existe la sección — en la home)
  const gWrap=$("#mfGames");
  if(gWrap){
    gWrap.innerHTML="";
    MOBILE_GAMES.forEach(cat=>{
      const chip=document.createElement("button");
      chip.type="button"; chip.className="mchip"+(activeCat===cat?" on":"");
      chip.textContent = cat==="Yu-Gi-Oh" ? "Yu-Gi-Oh!" : cat;
      chip.onclick=()=>{ activeCat = (activeCat===cat) ? "Todas" : cat; clearSubFilters(); fpopOpen=null;
        renderGameBar(); renderFilters(); renderMobileFilters(); renderGrid(); };
      gWrap.appendChild(chip);
    });
  }
  const G = filterGroups();
  mfChips("#mfSets",  G[0]);
  mfChips("#mfRars",  G[1]);
  mfChips("#mfCTs",   G[2]);
  mfChips("#mfDoms",  G[3]);
  const domLbl=$("#mfDomLabel"); if(domLbl) domLbl.textContent = domGroupLabel();
  mfChips("#mfConds", G[4]);
  // acabado (foil)
  const fWrap=$("#mfFoil");
  if(fWrap){
    const row = fWrap.closest(".msheet__row") || fWrap;
    const hasFoil = getFiltered("foil").some(p=>p.foil!=null);
    row.style.display = (hasFoil||foilOnly) ? "" : "none";
    fWrap.innerHTML="";
    const chip=document.createElement("button");
    chip.type="button"; chip.className="mchip"+(foilOnly?" on":"");
    chip.textContent="Foil ✨";
    chip.onclick=()=>{ foilOnly=!foilOnly; renderFilterBar(); renderMobileFilters(); renderGrid(); };
    fWrap.appendChild(chip);
  }
  // precio min / max
  const mn=$("#mfMin"), mx=$("#mfMax");
  if(mn) mn.value = priceMin!=null ? priceMin : "";
  if(mx) mx.value = priceMax!=null ? priceMax : "";
  // botón aplicar con conteo en vivo
  const ap=$("#filterApply");
  if(ap){ const n=getFiltered().length; ap.textContent = `Ver ${n} resultado${n!==1?"s":""}`; }
}
function mfPriceInput(){
  const mn=$("#mfMin"), mx=$("#mfMax");
  priceMin = (mn && mn.value!=="") ? Math.max(0, Number(mn.value)) : null;
  priceMax = (mx && mx.value!=="") ? Math.max(0, Number(mx.value)) : null;
  renderFilterBar(); renderGrid();
  const ap=$("#filterApply");
  if(ap){ const n=getFiltered().length; ap.textContent = `Ver ${n} resultado${n!==1?"s":""}`; }
}
$("#mfMin")?.addEventListener("input", debounce(mfPriceInput,250));
$("#mfMax")?.addEventListener("input", debounce(mfPriceInput,250));
$("#mfClear")?.addEventListener("click", ()=>{ clearSubFilters(); fpopOpen=null; renderFilters(); renderMobileFilters(); renderGrid(); });
const SORT_OPTS=[["rel","Relevancia"],["price-asc","Precio: menor a mayor"],["price-desc","Precio: mayor a menor"],["name","Nombre A-Z"]];
function renderSortSheet(){ const w=$("#sortOpts"); if(!w) return; w.innerHTML="";
  SORT_OPTS.forEach(([v,l])=>{ const b=document.createElement("button"); b.type="button"; b.className="msortopt"+(sortMode===v?" on":""); b.textContent=l;
    b.onclick=()=>{ sortMode=v; renderSortSheet(); renderGrid(); closeSheet('#sortSheet'); }; w.appendChild(b); });
}
$("#mfFiltersBtn")?.addEventListener("click", ()=>{ renderMobileFilters(); openSheet('#filterSheet'); });
$("#mfSortBtn")?.addEventListener("click", ()=>{ renderSortSheet(); openSheet('#sortSheet'); });

/* ---- Vista móvil: 2 o 4 cartas por fila (persistente) ---- */
function applyGridView(v){
  const grid=$("#grid"); if(!grid) return;
  grid.classList.toggle("grid--4", v==="4");
  $("#gv2")?.classList.toggle("on", v!=="4");
  $("#gv4")?.classList.toggle("on", v==="4");
  try{ localStorage.setItem("reroll_gridview", v); }catch(e){}
}
$("#gv2")?.addEventListener("click", ()=>applyGridView("2"));
$("#gv4")?.addEventListener("click", ()=>applyGridView("4"));
applyGridView(localStorage.getItem("reroll_gridview")||"2");

/* ---- "Singles & sellado": la tarjeta/tile filtra el catálogo por tipo ---- */
document.addEventListener("click", e=>{
  const card = e.target.closest(".offer__card[data-offer]");
  if(!card) return;
  e.preventDefault();
  activeType = card.dataset.offer;          // "single" | "sealed"
  renderFilters(); renderGrid();
  document.getElementById("catalogo")?.scrollIntoView({behavior:"smooth", block:"start"});
});
$("#filterApply")?.addEventListener("click", ()=>{ renderGrid(); closeSheet('#filterSheet'); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'}); });
document.querySelectorAll('[data-msheet-close]').forEach(el=> el.addEventListener('click', ()=>{ const s=el.closest('.msheet'); if(s) closeSheet('#'+s.id); }));
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeSheet('#filterSheet'); closeSheet('#sortSheet'); } });

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
renderGamePageBar();
renderFilters();
renderSkeleton();      // grilla: placeholder mientras carga; loadCatalog() pinta la real (evita parpadeo ejemplos→reales)
renderCart();
renderTradePanels();
renderHeroFan();
renderGameTiles();
renderHeroChips();
renderMobileFilters();
renderSortSheet();
loadCatalog();
startFanRotation();   // flechas + auto-rotación del abanico de destacados
$("#year").textContent = new Date().getFullYear();
$("#catDice")?.addEventListener("click", ()=> document.getElementById("gameBar").scrollIntoView({behavior:"smooth",block:"center"}));
$("#checkoutOpen")?.addEventListener("click", e=>{ e.preventDefault(); openCheckout(); });
$("#checkoutForm")?.addEventListener("submit", submitCheckout);
