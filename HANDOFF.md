# HANDOFF — estado de la sesión (act. 2026-07-11)

Todo lo de abajo está **en vivo en rerollhobbystore.com** (salvo lo marcado). Cache en **`?v=68`** (index.html y juego.html alineados: `styles.css` y `app.js`; `carta.js` en **v6**). Tienda: **3.689 cartas** (One Piece sigue en **stock 0** temporal). Último commit `b9033006`. Historial completo en [SESSIONS.md](SESSIONS.md).

**Novedades 2026-07-11 (todas LIVE):**
- **Checkout — selector de envío de Correos CR** que **suma al total** (🏬 Retiro/entrega coordinada gratis · 📮 Correo ₡1.700 · ✅ Certificado ₡3.300 · ⚡ EMS ₡2.500); resumen Subtotal→Envío→Total; guarda `envioMetodo`/`envioCosto` en el pedido; el panel de Pedidos muestra método + dirección + total con envío. Tarifas investigadas de Correos CR (ARESEP jun-2026, +IVA).
- **Checkout — solo SINPE Móvil** (Tarjeta y Efectivo ocultas; fácil de reactivar agregando las `<option>`).
- **Sellado — imagen completa** (`object-fit:contain` + fondo premium, sin recorte/rotación) y **botón 📦 Pre-ordenar** con nota del 50% en card y quick-view, para **todo `type:sealed`** de los 5 TCG. El catálogo tiene sellado en todos (OP 381·PKM 217·Magic 105·RB 49·YGO 22).
- **Pre-orden = va al CARRITO como "Añadir"** (flag `preorden`, línea `id_pre`, sin tope de stock): pasa por el checkout → pedido en panel + WhatsApp marcado `[PRE-ORDEN·50%]`. La API (`pedido.js`/`_lib.js`/`pedido-accion.js`) **no valida stock ni reserva** las líneas preorden.
- **Panel — nueva sección 🚚 Preórdenes** (`localStorage.reroll_preorders`, entre Pedidos y Base de datos): stats (activas/valor/**abonado**/**saldo**), tarjeta con producto+imagen, cliente+tel+WhatsApp, abonos con **n.º de comprobante SINPE** + barra de progreso; acciones **💰 Registrar abono / ✓ Completada / ✎ Editar / ✕ Cancelar** + alta manual. Las líneas preorden de un pedido web confirmado **se crean solas aquí** y **ya NO van a Ventas** hasta completarse (ahí sí se registra la venta COMPLETA).
- **Base de datos del panel** ordena por **N.º de carta** (default, vía `cartas.json`) + estado "sin resultados" avisa si hay búsqueda activa.
- **`terminos.html`** publicada (T&C) enlazada en footers + sitemap. Nuevo **WhatsApp `6038-7738`** en todo el sitio + JSON-LD.

## En qué estábamos (sesiones 2026-07-10/11) — panel espejo, motion Emil, botón atrás, términos, limpieza de datos
Todo verificado en preview y pusheado:
- **Catálogo del panel = espejo de la base:** las variantes (Overnumbered/Signature/Metal…) y los promos ahora SÍ se reconocen en la base aunque el inventario use nombre corto de Riot. `invMatch` cruza por imagen exclusiva + eliminación por nombre-base/set con candado de precio (±3×). Stepper − / + SIEMPRE (se eliminó el botón "+"); en 0 la tienda no la muestra.
- **Promos distinguidos:** badge **"Promo"** en la tienda (115 cartas) + etiqueta roja **🏷️ PROMO** en el catálogo del panel (comparten arte con la normal — no confundirlos al dar stock).
- **Limpieza de datos (con backups):** borrados 4 zombies Overnumbered legado (3693→**3689**); **18 parejas ON↔Signature** con precios cruzados corregidas; **rutina de precios** aplicada (334: 88↑/246↓, OP+RB) + **157 ajustes premium** por cruce con el catálogo (Showcase/AltArt/ON/Sig); 5 foils que costaban = normal → +₡100; **0 foils ≤ normal** en toda la base.
- **Motion/polish CSS (skill `emil-design-eng` de Emil Kowalski, instalado):** Tanda 1 (hover solo-mouse en touch, duraciones <300ms, `:active` en botones/steppers) + Tanda 2 (drawer curva iOS + cierre rápido, subrayado `scaleX`, stagger en grilla, logo hero sin loop infinito).
- **Botón ATRÁS del cel cierra overlays** (quick-view/drawer/checkout/sheets) en vez de salir del sitio — History API en `app.js`.
- **Nuevo WhatsApp de la tienda `6038-7738`** en index/juego/app.js/fichas + JSON-LD. **`terminos.html`** publicada (T&C: precios/48h, fotos+video, envíos Cartago/Correos/entregas fin de semana SJ, reclamos con video de apertura 24h…) enlazada en footers + sitemap.
- **Skills de Reroll Design:** los 3 (básico/profesional/tienda) ahora exigen la súper-revisión de diseño con ui-ux-pro-max + frontend-design + emil-design-eng antes de entregar.
- **PENDIENTES / OJO:**
  - ✅ **`ASSET_V` alineado (2026-07-11):** subido a **70** en `make_cartas.py` (= `?v=70` de index/juego). Las fichas ya cargan el CSS actual (motion de Emil, fix touch y estilos de sellado). Pendiente viejo RESUELTO.
  - 🔮 **Auto-rebuild de fichas (A FUTURO, cuando haya más volumen):** hoy, agregar un producto NUEVO desde el panel NO genera su ficha `/carta/` sola (el panel no corre Python) → hay que correr `python make_cartas.py` + push. Precios/stock SÍ se leen en vivo, no necesitan rebuild. Decisión con Andrés (2026-07-11): **seguir manual por ahora** (arranque, poco volumen, el inventario se mete en sesiones donde Claude ya corre el rebuild). **Activar la automatización cuando el panel sea su vía principal para productos nuevos, solo, seguido.** Opción recomendada = **GitHub Actions** (robot en la nube que corre `make_cartas.py` al publicar `productos.json`, commitea las fichas solo; no usa la PC, no necesita token nuevo, la tienda no se cae si falla; ~15 min de setup, datos ya están en el repo). Alternativa: build en Vercel (más simple pero si falla, el deploy entero falla). **Claude: recordarle a Andrés cuando note más volumen.**
  - **Preórdenes = solo local** (`localStorage.reroll_preorders` en el navegador del panel). Igual que Ventas: es control personal de Andrés, no se publica ni se sincroniza entre dispositivos. Si cambia de PC, no las ve (aceptable por ahora; migrar a `api/` si algún día hace falta multi-dispositivo).
  - ✅ **SINPE de pagos = `8780-7813` (CONFIRMADO por Andrés, se mantiene).** El WhatsApp cambió a 6038-7738 pero el SINPE se queda en el número personal (atado a la cuenta bancaria). NO cambiar `SINPE_NUMERO` en `js/app.js` — ya lleva comentario de advertencia.
  - Token de GitHub expuesto hace días → **regenerar** y actualizar el Value en Vercel.
  - Cartas subidas por el panel necesitan `python make_cartas.py` + push para su ficha de detalle.
  - One Piece en stock 0 (backup `productos_backup_op_stock0.json`) — restaurar cuando se quiera mostrar.
  - ~29 cartas legado Riftbound (Showcase viejas que TCGplayer no lista) se manejan a mano en la base de abajo.

## (histórico) sesiones 2026-07-08/09 — promos, panel a prueba de pérdidas, catálogo 5 juegos, carrito en fichas, steppers foil
Todo verificado en preview y pusheado (`adcc1a24`):
- **Promos de Riftbound** al inventario (`make_promos_rb.py`, 115 cartas set "Promos", stock 0, imagen de Riot). **One Piece a stock 0** temporal (oculto mientras Andrés carga Riftbound) — backup `productos_backup_op_stock0.json` para restaurar.
- **Panel reorganizado (acordeón) y A PRUEBA DE PÉRDIDAS:** sync ya no pisa cambios locales (cruza por ID, marca `_dirty`/`_new` persistidos, poda pendientes huérfanos); contador "N sin publicar" en la barra fija; steppers +/− aplican al instante, escribir número pide ✓. Quitados los botones "vaciar toda la base"/"vaciar ventas". Publicar SOLO desde la barra fija.
- **Catálogo del panel = 5 juegos:** RB y OP completos; **Pokémon/Magic/Yu-Gi-Oh** con los 12 sets más nuevos (`make_catalogo.py`). Sellado del catálogo queda con `cond:Sellado`+badge. **Steppers Normal y ✨ Foil separados** por carta (→ `stock`/`stockf`).
- **Fichas `/carta/`:** CTA principal **"Agregar al carrito"** (WhatsApp secundario) y **carrito visible** en el header con drawer para ver/quitar/ajustar sin salir (mismo `reroll_cart`). "Finalizar el pedido" → `index.html#carrito` abre el drawer.
- **PENDIENTE / OJO:** (a) el token de GitHub se expuso en el chat hace días — conviene **regenerarlo** y actualizar el Value en Vercel; (b) las cartas subidas por el panel siguen necesitando `python make_cartas.py` + push para su ficha de detalle (avisar a Andrés cuando cargue su 1ª tanda de Pokémon/Magic/YGO); (c) cuando quiera volver a mostrar One Piece, restaurar stock desde el backup.

## (histórico) sesión 2026-07-07 — precios, foil-stock, panel a prueba de fallos, y PEDIDOS
Todo verificado (navegador + harness) y pusheado (`45e843b`, `a255ddf`, `5cb5e67`, `3204631`, `e6d6bc3e` entre otros):
1. **Rutina de precios `check_precios.py`:** compara `productos.json` vs TCGplayer fresco (TCGCSV) → `reporte_precios.md/csv` (gitignored) agrupado por juego, marca **✨ Foil** y **🔥 +25%**. OP por ID exacto; RB por nombre+set con **exclusión de Showcase** (rareza vía CSV; no adivina variantes premium → `revisar_a_mano.csv`). `--aplicar-subidas` aplica solo subidas (backup). Hoy: 381 subidas aplicadas. **Tarea semanal de Windows** (lunes 9am, solo reporta).
2. **Stock foil aparte (`stockf`):** panel tiene "Cantidad foil" + stepper ✨ FOIL en la base; tienda respeta stock por variante (card/quick-view/ficha/carrito); si no está definido, el foil sigue el normal.
3. **Panel anti-fallo:** los +/− de stock/foil ya **no guardan solos** → quedan "pendientes" (fila marcada + ✓ Aplicar/✕) con barra "N sin aplicar / Aplicar todos". La barra masiva peligrosa (Todo a 0) escondida en "⚙️ Acciones masivas (avanzado)".
4. **📦 SISTEMA DE PEDIDOS con reserva 48 h** (mini-API serverless `api/` sobre el repo como base de datos): checkout → `POST api/pedido` reserva stock (baja para todos vía `api/reservas`), WhatsApp con #pedido; panel → sección 📦 Pedidos: **quitar línea / rechazar / ✓ confirmar** (descuenta stock real + registra venta). Expira solo a 48 h. **Env vars en Vercel `GITHUB_TOKEN` + `PANEL_KEY` YA configuradas y probadas en producción** (R-0001/R-0002 creados y rechazados OK).
5. **Checkout con teléfono:** campo Teléfono/WhatsApp obligatorio → queda en el pedido; panel muestra 📱 número + botón 💬 WhatsApp (`wa.me/506…`). Casilla "Recordar mis datos" (localStorage, no cuenta) prellena la próxima compra.
- **PENDIENTE / OJO:** (a) el token de GitHub se expuso en el chat — conviene que Andrés lo **regenere** y actualice el Value en Vercel cuando pueda; (b) cartas subidas por el panel siguen necesitando `python make_cartas.py` + push para su ficha de detalle; (c) Andrés sigue probando agregar cartas a mano y avisa si ve algo.

---
## (histórico) sesión 2026-07-04 — La sesión GRANDE
Todo verificado con loops de QA y pusheado (últimos commits `cb87604..c3075c5` + fix buscador):
1. **Filtro avanzado estilo TCGplayer** (`#fbar` chips multi-selección con conteos contextuales: Expansión/Rareza/Tipo de carta/Dominio-Color/Foil/Condición/Precio) en home + juego.html, desktop y móvil. `enrichProducts()` saca rareza/tipo/dominio de `cartas.json` o `p.d.at`. Fix regresión: juego.html no tenía panel móvil de filtros.
2. **Móvil:** toggle vista 2/4 por fila (`#gv2/#gv4`, persistente) + "Singles & sellado" como tiles compactas tocables (filtran por tipo).
3. **Hero nuevo** (`hero--marquee`): "Tu próxima carta ya está acá" + desfile infinito de 12 cartas reales del inventario (`renderHeroMarquee`, rotan por visita, pausa al hover, click→quick-view, pill con conteo real).
4. **One Piece COMPLETO:** OP-01→OP-16 (2.629 cartas OP; tienda total **3.574**), stock 1, precios TCGplayer×₡520. Sets renombrados con código **"OP01: Romance Dawn"…** en catálogo maestro + productos.json (ordenados y buscables por código). Starters/EB/promos NO agregados (quedan en el quick-search del panel con `+`).
5. **Quick-view:** selector **Normal/Foil** (toggle con precios, shimmer, `addToCart(p.id, qvFoil)` → línea `id_f`).
6. **Buscador:** desplegable máx. 5 resultados + botón "Ver los N resultados ↓" → catálogo filtrado (antes se cortaba contra "Trabajamos con").
7. **Fixes panel:** `invMatch` (matching catálogo→base por nombre+set cuando no hay imagen; antes img vacía emparejaba cartas ajenas) y catálogo con `no-cache` (antes `force-cache` nunca revalidaba).
- **QA de la sesión:** 220 pasadas de filtros + 120 a escala OP + 149 clicks quick-view + 40/40 fichas nuevas + panel end-to-end. 0 errores de consola en todo.
- **PENDIENTE próximo:** imágenes "SAMPLE" de sets OP recientes (TCGplayer las irá reemplazando; se refrescan regenerando `make_catalogo.py` + rebuild). ~14% de Riftbound sin imagen (opción: imágenes de Riot). Starters/EB de One Piece cuando Andrés quiera (por el panel).

## Sesión 2026-07-03 — Catálogo maestro + quick-search + quick-view
Sesión grande, todo verificado en preview y **pusheado**:
1. **One Piece OP-16 "The Time of Battle"** (159 cartas, ids 947–1105) en `productos.json` con fichas ricas (efecto+atributos). Datos de TCGplayer vía **TCGCSV**.
2. **Catálogo maestro** (`make_catalogo.py` → `catalogo/<juego>.json` liviano + `_rich` para build): Riftbound completo (1249, 9 sets incl. promos/Vendetta) + One Piece completo (7056, 77 sets). Precio market×₡520+redondeo, foil, imágenes TCGplayer (`imageCount>0`).
3. **Panel "🃏 Agregar desde el catálogo"** (quick-search estilo CardNexus en `admin.html`): buscar → filtros Tipo/Expansión/Finish → `+`/`−` para poner stock. Embebe la descripción (`d`) en la carta al agregar.
4. **Quick-view en la tienda** (`js/app.js`, modal `.qv`): click en carta → imagen + descripción + atributos + precio + carrito. Lee `p.d` o `cartas.json` (`d`). Intercepta `a.card__link`.
5. **Buscador tolerante** (`normSearch`/`matchQuery`): sin tildes/puntuación, por palabras. **Filtro** ya scopea por juego.
6. **Placeholder "Imagen no disponible"** (`.noimg`) para cartas sin foto; en el panel, badge "sin imagen" + botón "📷 Poner imagen" (abre `editItem`). El `onerror` usa función global (`qvImgFail`/`catImgFail`) — NO HTML embebido (bug corregido: colaba texto).
7. **Bonus:** Love-Love Mellow (subida a mano) ahora tiene imagen 400w + efecto + click-through.
- **Stress test OK:** 8305 cartas, 100% img válida/nombre/precio, 87% con descripción; quick-view 250 aperturas 0 errores; panel add/remove 10k fluido.
- **PENDIENTE futuro:** ~14% de Riftbound sin imagen en TCGplayer (usar imágenes de Riot en otra tanda). Cartas subidas por el panel necesitan rebuild local (`make_cartas.py`) para su ficha estática; el quick-view ya las cubre con `d` embebido.

## Sesión 2026-07-02 — FOIL de Riftbound (en vivo)
Feature foil para commons/uncommons, **construido y verificado en preview**:
1. **Precios foil de TCGplayer** (413 cartas) → campo `foil` en `productos.json`. Extraídos de la API `mpapi.tcgplayer.com/v2/product/<id>/pricepoints`, convertidos **USD × ₡520** + redondeo escalonado. Datos crudos por set en el scratchpad (`foil_Origins.txt`, etc.).
2. **Toggle Normal/Foil** en catálogo (`js/app.js`, clases `.ftoggle`) y ficha de carta (`make_cartas.py` + `js/carta.js`, `.cd-ftoggle`). Carrito con variante por `key` (`id`/`id_f`), pill `.foilpill`. Brillo `.card__price--foil` / `.cd-price--foil` (`@keyframes foilShine`).
3. **Panel admin:** casilla `#foilOn` + campo `#foilPrice`; badge foil en el inventario; editItem carga/guarda `foil`.
4. **Ajuste pedido:** 74 cartas con foil == normal → **+₡200** (foil siempre > normal).
5. Hallazgo: los foils de common/uncommon de Riftbound NO están en la Price Guide, solo en la página de producto (filtro Printing). Rare/Epic/Showcase ya son foil-only (su precio actual es el foil). Proving Grounds no tiene foils.
- **PENDIENTE:** hacer `git push` a producción (el usuario pidió backup + push). Cache ya en v47, cartas regeneradas.

## Sesión anterior (2026-06-27) — Marca + Analytics + SEO (en vivo)
Tanda de marca + analítica + SEO, todo pusheado y verificado:
1. **Footer:** crédito "Diseñado por 🎲 Reroll Design" (dado vectorial del favicon de Reroll Design, `currentColor`; sin imagen nueva) en index/juego/cartas. Clases `.footer__credit` + `.rd-mark`. Opción A (firma sobria) elegida sobre la B (sello con borde). Kit de marca en `C:\Users\Andres\Claude\Projects\Reroll Design logo.zip`. **Enlaza a `https://rerolldesign.com/`** (target=_blank, rel=noopener; hover dorado + subrayado).
2. **Google Analytics 4** (gtag.js, ID `G-X6LMX9VR0Y`) en `<head>` de index/juego/404 + plantilla de cartas; `admin.html` excluido. Translíos usa `G-CVMH80KDPJ`.
3. **SEO indexación:** `sitemap.xml` (945 URLs) + `robots.txt`, generados por `make_cartas.py` (`write_sitemap`).
4. **Google Search Console:** meta de verificación en index.html (`_6DX60aqNivRzGGvFqaIqbOsWTtpV53mqTG60wBe4U0`). **REGLA FIJA: nunca borrar ese meta ni el gtag** (ver CLAUDE.md regla 7).
   - **Pendiente del USUARIO (no lo puedo hacer yo):** en Search Console darle "Verificar", y luego **Sitemaps → enviar `sitemap.xml`**. Verificar dominio puede pedir registro DNS en Netlify.
5. **Pendiente opcional:** banner de consentimiento de cookies (GA pone cookies; no obligatorio en CR, sí si hay tráfico UE).

## Antes (sesión previa)
Cerrando la sección **"Cartas destacadas"** (abanico de cartas tipo cardnexus) después de varias rondas de mejoras de UX/performance/SEO/a11y. El usuario confirmó "ya corre bien" en celular.

## Terminado y verificado (esta sesión, ya pusheado)
- **"Trabajamos con" → paneles altos por juego** (arte + logo, abanico con perspectiva, flotación + hover, clic → juego.html, scroll-snap móvil). `renderTradePanels()`, `#tradePanels`, maps `PANEL_ART/PANEL_FOCUS/PANEL_RY`. (Reemplazó el marquee; `renderBrands`/`textBadge` eliminadas.)
- **Banner de juego.html con arte**: personaje a la derecha fundido en el vino + brillo (`renderGameBanner` + `.gbanner.has-art`, usa `PANEL_ART`).
- **"Cartas destacadas"** (`#featured`, después de "Trabajamos con"): abanico de hasta 7 cartas al azar del catálogo con **precio >₡5000, en stock, solo verticales**. Funciones `featuredPool/renderFanCarousel/layoutHand/fanCycle/reDealFan/startFanRotation`. CSS puro (sin GSAP), fan responsivo via `--cw`.
  - **Mano giratoria (último fix):** flechas giran la mano (cada carta va al centro); tocar una carta de atrás la trae al frente; si ya está al centro, abre su juego. Carta central destacada (borde dorado). Auto-rota cada 1 min, se reinicia con interacción.
- **SEO/social:** Open Graph + Twitter Card + JSON-LD `Store` + canonical (index); `og-image.jpg` (1200×630, dado sobre vino). Favicon = dado mascota (`favicon.png` 180×180) en las 3 páginas + apple-touch-icon.
- **Performance:** `imgURL()` optimiza imágenes rgpub a webp; `productos.json` con `cache:'no-cache'`; skeleton de carga en la grilla.
- **Buscador:** navegación teclado (↑/↓/Enter/Esc) + ARIA combobox + debounce 150ms.
- **a11y:** skip link "Saltar al catálogo" (ambas páginas, `#catalogo` tabindex=-1); foco/aria-hidden en carrito/modal.
- **Checkout:** valida dirección si es envío + estado "¡Pedido enviado!" con respaldo WhatsApp; "Total"→"Subtotal".
- **admin.html:** confirm antes de publicar a producción; "Deshacer" al borrar carta; `esc()` escapa datos en render.
- **Móvil:** la nube del dado mascota ya no tapa la paginación (solo dado, tip al tocar).
- **Gamebar slim** en juego.html; tiles "Elegí tu juego" pasaron a `<a href>` reales (SEO).

## Pendiente / próximos pasos concretos
- **Poblar inventario de otros juegos** (One Piece foco, Pokémon, Magic, Yu-Gi-Oh) + sellado. Hoy solo Riftbound (943 cartas) está en vivo → el abanico y los contadores hoy son todo Riftbound.
- **Contador de visitas / analytics:** RESUELTO con **Google Analytics 4** (gtag.js, ID `G-X6LMX9VR0Y`) en el `<head>` de index/juego/404 + plantilla de cartas. admin.html excluido a propósito. Datos en GA → propiedad "Reroll Hobby Store" → Reports/Realtime. (Translíos usa `G-CVMH80KDPJ`.) Pendiente opcional: banner de consentimiento de cookies (no obligatorio en CR; sí si hay tráfico UE).
- **SEO de indexación:** `robots.txt` + `sitemap.xml` (945 URLs: home + juego.html?g=Riftbound + 943 cartas) generados por `make_cartas.py` (`write_sitemap`). Solo juegos CON inventario (no páginas vacías). Pendiente: dar de alta el sitemap en Google Search Console.
- **"Cartas más agregadas al carrito" (real):** requiere backend para agregar eventos de todos los usuarios (el carrito es localStorage por navegador). Opción futura: Vercel KV + función serverless. Por ahora el abanico usa el **proxy de precio >₡5000** (ver decisión abajo).
- **Limpieza:** CSS muerto del marquee viejo (`.marquee`, `.brandbadge`, `@keyframes marquee`) ya no se usa — se puede borrar.
- **Más arte por juego:** al sumar arte nuevo → optimizar con `make_art.py` + agregar a `PANEL_ART`.
- Foto real `assets/about.jpg` + datos para reconstruir "Quién soy". Confirmar nombre del SINPE.
- Tras cada deploy con OG nuevo: refrescar el Facebook Sharing Debugger (WhatsApp toma ese caché).

## Decisiones de diseño y por qué
- **Cutout de personajes (quita-fondos IA con rembg): PROBADO y RECHAZADO.** Al usuario no le gustó → se usa **arte completo fundido** en el vino. (rembg quedó instalado en la PC pero NO se usa; no rehacer cutouts salvo pedido explícito.)
- **Abanico en CSS puro, sin GSAP/CDN** — más liviano y el preview que se aprobó ya era CSS. El "elástico" lo da un `cubic-bezier` con rebote.
- **Mano giratoria (flechas) en vez de hover** — el hover no existe en touch; girar la mano hace cada carta accesible y visible en celular (fix pedido por el usuario).
- **Abanico filtra precio >₡5000 aunque el texto ya no lo menciona** — para que el showcase muestre cartas llamativas (sin filtro saldrían commons de ₡100). El usuario pidió sacar la mención del precio del copy; la lógica de selección se mantuvo a propósito. (Si pide "cualquier carta al azar", quitar el filtro en `featuredPool()`.)
- **Excluir cartas horizontales** (battlefields, URL `-1039x744`) del abanico — se ven mal en formato vertical.

## Bugs / detalles a no olvidar
- **`preview_screenshot` se cuelga (timeout 30s)** con animaciones CSS infinitas en la página → verificar por `preview_eval`/datos, o inyectar `*{animation:none!important}` antes de capturar.
- **Cache `?v=` se había desincronizado** por lo largo de la conversación; quedó alineado en **v=40**. Siempre subir AMBOS archivos al mismo número al tocar css/js.
- **Vercel = Linux, case-sensitive:** `magic.webp` (no `Magic.webp`). Ya corregido, pero vigilar con assets nuevos.
- Versiones de cache las hace `sed -i 's/?v=NN/?v=MM/g' index.html juego.html`.
