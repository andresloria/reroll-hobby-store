# Bitácora de sesiones — Reroll Hobby Store

Registro histórico de todo lo trabajado, sesión por sesión (backup legible).
Detalle técnico estable en [CLAUDE.md](CLAUDE.md) · estado volátil en [HANDOFF.md](HANDOFF.md).
El respaldo real de datos es el historial de git (`git log`); esto es el resumen humano.

Repo: `github.com/andresloria/reroll-hobby-store` · LIVE en rerollhobbystore.com (Vercel).

---

## 2026-07-11 (4) — Limpieza de datos: duplicado, precios ON↔Sig y foils (aprobado por Andrés)
- Con OK de Andrés, script Python (backup `productos_backup_fixdatos.json`, gitignored):
  1. **Borrado el duplicado id 3691** "Irelia - Fervent (Overnumbered)" (creado por accidente al probar el +; el real es el id 627 con el arte del ON). 3694 → **3693 items**.
  2. **Precios intercambiados** en las 3 parejas ON↔Signature: 328 ₡63k / 329 ₡1.14M (Kai'Sa) · 336 ₡78k / 337 ₡1M (NTF) · 627 ₡73k / 628 ₡620k (Irelia).
  3. **Foil == precio normal → foil = normal + 100** (pedido de Andrés): 5 cartas — Solari Chief (RB 200→300), DON!! Alt Art (300→400), Streusen (100→200), Brook (200→300), Gecko Moria (200→300). Verificado: 0 foils ≤ normal en toda la base.
- `python make_cartas.py` → 3693 fichas (incluye las 3 cartas nuevas del panel; sin ficha huérfana del 3691 porque nunca se generó).
- **Verificado en panel:** las 3 familias cruzan COMPLETAS — Kai'Sa base 1/ON 1/**Sig 1**/Promo 2, NTF base 1/ON 1/**Sig 1**, Irelia base 1/AltArt 1/ON 1/**Sig 1**; Metal/Prize Wall separadas en 0; ids únicos; consola limpia.

## 2026-07-11 (3) — Catálogo del panel = espejo de la base: cruce de variantes legado (pedido de Andrés)
- Andrés (con captura): la base de abajo muestra en 1 las Overnumbered/Signature viejas (Ahri ₡1.22M, Kai'Sa ₡1.14M…) pero el catálogo NO las reflejaba (0/+) — "el catálogo y lo de abajo deberían ser lo mismo".
- **Causa:** el inventario legado guarda cada versión ultra-rara como carta aparte con **nombre corto sin marcador** ("Ahri, Inquisitive" ₡1.22M = la Signature) e imagen de Riot propia. El invMatch de ayer exigía el marcador en el nombre → no cruzaban.
- **`admin.html` (invMatch + varElim + buildCatMaps):** mapas por juego (`catImgCount`/`catImgSet`, se recalculan en fillSets). Reglas nuevas para entradas-variante: **(3)** imagen EXCLUSIVA de esa variante en el catálogo + un solo item con ella → cruce 1:1 (arregla las Overnumbered legado); **(4a)** item ya renombrado con el marcador → cruce directo (escape manual); **(4b)** eliminación: mismo nombre-base+set, sin marcador, imagen no reclamada por otra entrada; si hay varias, el precio desempata (una sola dentro de ±3×); candado final de precio ±3× (arregla las Signature tipo Ahri 631).
- **Verificado en preview (datos reales):** Ahri ON=1 (id 630) y Sig=1 (id 631) como la base; − del ON baja SOLO el 630 y − de la Sig SOLO el 631 (quirúrgico, restaurado); Kai'Sa base 1 / ON 1 (id 328) / Promo 2 / Metal+Prize Wall separadas en 0; regresión One Piece OK; consola limpia.
- **⚠️ Hallazgos de DATOS (no toqué productos.json, confirmar con Andrés):**
  1. **Duplicado:** id 3691 "Irelia - Fervent (Overnumbered)" (creado al probar el + ayer, stock 1) duplica al id 627 (₡620k) que tiene el ARTE del Overnumbered. Borrar 3691 → el catálogo cruza solo con 627.
  2. **Precios aparentemente cruzados** en 3 parejas (el item con arte de ON lleva precio de Signature y viceversa): 328 ₡1.14M ↔ 329 ₡63k (Kai'Sa) · 336 ₡1M ↔ 337 ₡78k (Nine-Tailed Fox) · 627 ₡620k ↔ 628 ₡73k (Irelia Fervent). Mercado: ON ≈ 85-135k, Sig ≈ 0.7-1.4M. Si se corrigen, las Signature cruzan solas (el candado de precio pasa).
  3. Quedan ~29 items Riftbound con stock sin reflejo en el catálogo (versiones Showcase/legado que TCGplayer no lista como producto): se manejan desde la base de abajo, como siempre.

## 2026-07-10 — 🐛 Fix: cartas "Overnumbered" (y demás variantes) no se reconocían en la base (pedido de Andrés)
- Andrés: "las cartas overnumbered de Riftbound… no me deja quitarlas de mi stock, solo me deja agregar más". Síntoma real: en el catálogo del panel esas cartas salían con **"+"** (no en base) aunque él las tuviera en stock → no aparecía el stepper para bajarlas.
- **Causa raíz (asimetría de nombres):** el inventario base de Riftbound usa **nombres cortos de Riot** ("Bashful Bloom") y el catálogo usa **nombres largos de TCGplayer** ("Lillia - Bashful Bloom"). Las cartas normales cruzan por **imagen** (así el corto liga con el largo), pero las variantes de `CAT_VAR_EXCL` (overnumbered/signature/metal/prize wall/champion/top 8/serialized) exigían **nombre exacto** → el corto nunca igualaba al largo → "+".
- **`admin.html` (`invMatch`):** nueva helper `varMark(name)` (marcador de variante o null). Ahora una entrada-variante del catálogo cruza con una carta del inventario **de la MISMA variante que comparte imagen** — por nombre exacto o, si no, por el mismo marcador (igual que las normales por imagen). Y la carta **base** ya nunca se liga a una variante (`cands.filter(!varMark)`), evitando que editar una overnumbered toque la carta base.
- **Reproducido y verificado en preview:** inyecté "Bashful Bloom (Overnumbered)" (nombre corto, misma arte que la base) → antes salía "+"; con el fix aparece **stepper = 4**, el − baja 4→3→2 (quita stock), y la carta **base se queda en 1** sin tocarse. Regresión OK (cartas normales siguen cruzando por imagen; sin errores de consola). `productos.json` intacto (3689); solo `admin.html`.
- ⚠️ `admin.html` no tiene cache-busting → para ver el fix hay que **recargar fuerte (Ctrl+F5)** una vez.

## 2026-07-10 (4) — Motion/polish del CSS con el skill de Emil Kowalski (Tanda 1)
- Instalé el skill personal **`emil-design-eng`** (filosofía de Emil Kowalski) en `~/.claude/skills/` (venía como `Emil Skill.md` en Downloads; convertí la tabla a frontmatter YAML). Lo usé para auditar `css/styles.css` (~60 transiciones, ~15 animaciones).
- Mostré demo interactiva Antes/Después en el navegador (aprobada por Andrés) → apliqué la **Tanda 1** (alto impacto, solo `css/styles.css`):
  - **Touch (lo #1):** bloque `@media (hover:none),(pointer:coarse)` que neutraliza los lifts/zooms de hover en celular (antes el `:hover` se "quedaba pegado" al tocar). Cubre card/gtile/tpanel/herochip/gamebtn/brandbadge/offer/step/gpbar/fanarrow/cd-rel/cd-social/fsoc/empty/card__fav/hmq/cathead__dice + los hijos (emoji/photo/art). El `:active` sí queda.
  - **Duraciones de hover** (Emil: <300ms): `.card` .35→.2s; `.card__photo` y `.card__emoji` .5→.3s; `.card__img::after` (sheen) .7→.5s; `.tpanel` .45→.25s.
  - **`:active` (feedback de press, clave en cel):** nuevos en `.qty__btn` (scale .86 + destello dorado, +transform en la transición), `.herochip` (.96), `.gtile` (.98), `.gamebtn` (.97), `.pill` (.95, +transform en la transición).
- Cache-busting `?v=62→63` (index/juego). Verificado en preview: estilos computados (card .2s, photo .3s), 8 reglas `:active` presentes (5 nuevas), bloque touch activo, consola sin errores. `productos.json` intacto.
## 2026-07-11 (2) — Página de Términos y Condiciones + fix número en JSON-LD (pedido de Andrés)
- Andrés quería "curarse en salud" con T&C. Redacté el contenido (aclarando que NO es asesoría legal; aplica Ley 7472, conviene revisión de abogado) y lo publiqué como página.
- **`terminos.html` (NUEVA):** 15 secciones con el diseño de Reroll (usa `css/styles.css?v=65` + `<style>` scoped para la prosa legal; nav simplificado + footer real; GA4 incluido; canonical propio). Cubre: precios/volatilidad y **derecho a revisar/ajustar/rechazar dentro de 48h** (alza brusca o error), reservas 48h, **fotos+video del estado de cada carta**, pagos (SINPE por WhatsApp), **envíos** (Cartago en persona · Correos CR · entregas coordinadas sáb/dom en San José Centro/San Pedro/Curridabat · costo a cargo del comprador · tránsito por cuenta y riesgo), **reclamos** solo con **video de apertura sin cortes dentro de 24h**, sellado sin devolución/sin garantía de pulls, autenticidad, cancelaciones, datos personales, menores, marcas (revendedor independiente), cambios y ley CR.
- **Enlace "Términos y condiciones"** en el footer de `index.html` y `juego.html` (dorado, inline style — sin tocar CSS).
- **Fix:** el JSON-LD de `index.html` (`telephone`) tenía el número viejo `+506-8780-7813` (mi cambio anterior no lo agarró por el formato con guiones) → ahora `+506-6038-7738`.
- **Sitemap:** `terminos.html` agregado al `write_sitemap` de `make_cartas.py` (prioridad 0.3) y al `sitemap.xml` actual.
- Verificado en preview: 15 secciones, fuentes reales, WhatsApp nuevo en todos los enlaces, sin overflow, consola limpia. Sin cambios en css/js → sin bump de `?v`.
- ⚠️ **PENDIENTE (financiero, no lo toqué):** `SINPE_NUMERO` en `js/app.js` sigue siendo `8780-7813` (número de PAGO atado a la cuenta bancaria). Preguntarle a Andrés si el SINPE también cambia al 6038-7738 o se queda.

## 2026-07-11 — Botón atrás del cel cierra overlays (no sale del sitio) (pedido de Andrés)
- Andrés: en el cel, mucha gente al abrir una carta (quick-view) por reflejo aprieta el botón de **retroceso** en vez de la X, y eso los **sacaba del sitio**. Pedido: que el back cierre la vista de la carta y los deje en la página.
- **`js/app.js` — guardián de historial (History API):** al abrir cualquier overlay de la tienda (quick-view, drawer del carrito, checkout, sheets de filtro/orden) se hace `history.pushState`; el botón atrás dispara `popstate` → se cierra el overlay abierto **sin abandonar la página**. Cerrar por X/backdrop/Esc llama `overlayConsume()` que hace `history.back()` para consumir el estado (historial limpio, sin “apretar atrás dos veces”). Flags `_ovPushed` / `_ovFromPop` evitan doble-cierre. Cuando no hay overlay abierto, el back navega normal (se puede salir).
- Enganches: `overlayPush()` en `openQuickView`/`openDrawer`/`openCheckout`/`openSheet`; `overlayConsume()` en `closeQV`/`closeAll`/`closeSheet`. No choca con el flujo `#carrito` (replaceScript limpia el hash y abre el drawer 300ms después).
- Cache-busting `?v=64→65`. **Verificado en preview (juego.html?g=Riftbound):** abrir quick-view empuja estado (hist 9→10); `history.back()` lo cierra y queda en `/juego.html?g=Riftbound` (no sale); cerrar por X consume el estado (`_ovPushed=false`); el drawer igual. Sin errores de consola. Solo `js/app.js` (+ `?v`).
- *Nota:* aplica a la tienda. Las fichas `/carta/*.html` son páginas propias (el back vuelve a la grilla, que es lo esperado); su lightbox/drawer podría recibir el mismo patrón en `carta.js` si Andrés lo pide.

## 2026-07-10 (5) — Motion/polish del CSS (Tanda 2, con criterio libre de Andrés)
- Demo interactiva Antes/Después (drawer + stagger + subrayado) aprobada → apliqué la **Tanda 2** (solo `css/styles.css`):
  - **Subrayado del nav:** `width 0→100%` reemplazado por `transform:scaleX(0→1)` con `transform-origin:left` (corre en GPU, no dispara layout; se ve idéntico).
  - **Drawer del carrito + bottom-sheet móvil:** nueva var `--ease-drawer:cubic-bezier(.32,.72,0,1)` (curva iOS). Apertura .42s / **cierre .25s** (drawer) y .4s/.24s (msheet) → salida más rápida que entrada (asimetría enter/exit de Emil).
  - **Stagger de la grilla:** las primeras 10 `.grid .card` entran en cascada (35ms escalonado, tope ~315ms); el resto sin delay. Corto y no bloquea; se re-reproduce en cada render de la grilla.
  - **Logo del hero:** quité el `heroReroll 6s infinite` (giro completo cada 6s para siempre = lo más "constante"); queda el `float` sutil + el giro **solo al hover** (que ya existía). El resto de loops (mascotBob, waPulse, tpfloat, marquee, foilShine, skelshimmer) se conservan a propósito (son sutiles / funcionales / marca juguetona).
- Cache-busting `?v=63→64`. Verificado en preview: CSS servido correcto (scaleX en nav, curva iOS 0.42/0.25s en drawer, 10 reglas de stagger, sin heroReroll infinite), consola sin errores. `productos.json` intacto.

## 2026-07-10 (3) — Nuevo número de WhatsApp de la tienda (pedido de Andrés)
- Andrés adquirió una línea dedicada para la página: **6038-7738** (antes usaba su personal 8780-7813).
- Reemplazo `50687807813 → 50660387738` en las 4 fuentes: `index.html` (botón social + wafloat), `juego.html` (footer + wafloat), `js/app.js` (const `WHATSAPP` — checkout/carrito) y `make_cartas.py` (const + botón social de la plantilla de fichas).
- `python make_cartas.py` → regeneradas las **3690** fichas con el número nuevo; de paso se generó la ficha del "Sett - The Boss (Overnumbered)" agregado ayer por el panel (Regla de Oro ✓) + `cartas.json` + `sitemap.xml`.
- Cache-busting `?v=61→62` (index/juego). Verificado en preview: home y fichas con `wa.me/50660387738`, cero rastros del viejo.

## 2026-07-10 (2) — Catálogo del panel: stepper − / + SIEMPRE, para toda carta de todo TCG (pedido de Andrés)
- Andrés seguía viendo solo el "+" en las overnumbered → pidió que **cualquier carta** del catálogo (todos los TCG) se pueda agregar Y quitar directo: − hasta 0 = agotada y **la tienda no la muestra a los clientes** (eso ya funcionaba: `showSoldOut=false` por defecto en `js/app.js`).
- **`admin.html` (`rowHTML`/`wireRow`):** se eliminó el botón "+" (`catadd`). Ahora TODA carta sin foil muestra el stepper − N + (arranca en 0 si no está en base; el + la crea vía `setQty`, el − en 0 no hace nada). Las foil ya tenían doble stepper siempre.
- **Verificado en preview:** 40/40 overnumbered de RB con stepper; flujo 0→+1 (crea, "✓ en tu base")→2→1→0 ("· agotada")→− en 0 sin efecto; el "Sett - The Boss (Overnumbered)" que Andrés agregó desde el panel cruza y marca 1 (fix de invMatch de hoy); variantes Signature/Metal independientes en 0; regresión Yu-Gi-Oh OK (todo stepper, +/− funcionan); sin errores de consola. Solo `admin.html`.

## 2026-07-09 — Catálogo del panel: steppers Normal y Foil separados (pedido de Andrés)
- Antes, en el modal "Agregar desde el catálogo", una carta con foil disponible tenía UN solo stepper que solo movía `stock` (el foil guardaba el precio pero no dejaba poner cantidad foil aparte).
- **`admin.html`:** para entradas con `e.foil != null` el `rowHTML` ahora muestra **dos steppers apilados** — **Normal** (→ `stock`) y **✨ Foil** (→ `stockf`, con borde dorado). `setQty(e, q, variant)` recibe la variante; al crear una carta nueva inicializa `stock`/`stockf` (el que no se toca queda en 0) + precio foil; al editar toca solo esa variante. Cartas sin foil siguen igual (un stepper, o `+` si no está en base). El badge "· agotada" ahora considera `stock` **y** `stockf`. CSS nuevo: `.catqty2/.catqty2row/.catqty2lab/.catqty--f`.
- **E2E verificado en preview (11 checks):** fija stock/foil conocidos → +/− Normal y Foil son independientes (sin cruce) y marcan cambio sin publicar; carta foil NUEVA (Magic "The One Ring") agregada solo por foil → `stock:0, stockf:1` sin duplicar, luego +Normal → `1/1`, ambos a 0 se conserva; regresión OK (Yu-Gi-Oh sin foil = un solo control). Screenshot: Salvage con "NORMAL − 6 +" y "✨ FOIL − 2 +". `productos.json` intacto; solo `admin.html`.

## 2026-07-08 — Ficha: carrito visible + drawer para ver/quitar/ajustar sin salir (pedido de Andrés)
- Andrés: "el carrito debería verse en todo momento, incluso en las fichas… en caso que se arrepienta y quiera quitarla, que no se tenga que devolver".
- **`make_cartas.py`:** el header de la ficha ahora tiene el **icono de carrito con contador** (`#cdCartBtn`/`#cdCartCount`, badge oculto en 0) y al final del body el **drawer** (mismo markup/CSS que la tienda; ya cargaba `css/styles.css` → cero CSS nuevo). "Finalizar el pedido" → `../index.html#carrito`. `CARTA_JS_V 5→6`.
- **`js/carta.js`:** `renderCart`/`changeQty`/`removeLine`/`cartTotal`/`updateCount` sobre el **mismo** `localStorage.reroll_cart`; open/close del drawer (botón, backdrop, Esc). Tope de stock en `+` vía `lineStock(l)` que calcula el stock de la variante de la línea desde `prod` (no depende del toggle Normal/Foil).
- **🐛 Bug hallado en la prueba con varias cartas y corregido:** el `+` solo capaba el stock si el toggle de la ficha coincidía con la variante de la línea (una foil no se capaba viendo la normal) → ahora `lineStock` capa cualquier variante de la carta actual.
- **Prueba E2E con carrito variado (10/10 + 3 de consistencia):** 4 líneas (normal + foil de la misma carta como líneas separadas con pill, + otra RB, + Pokémon); contador suma cantidades; quitar ✕, −/+ ajustan y recalculan total; − a 0 elimina la línea; `+` respeta el tope de la carta actual; vaciar muestra "vacío" y esconde el badge. **Consistencia ficha↔tienda:** lo agregado en la ficha aparece idéntico en el drawer de la tienda (contador/líneas/total). `productos.json` intacto (3689).

## 2026-07-08 — Ficha: "Agregar al carrito" primero, WhatsApp después (Regla de Oro, pedido de Andrés)
- Antes la ficha `/carta/` tenía como CTA principal "Comprar por WhatsApp" (mandaba una carta suelta sin datos). Andrés lo quería al revés: **primero al carrito** para recibir el pedido completo, y el WhatsApp recién en el checkout.
- **`make_cartas.py`:** el botón principal (carta disponible) pasa a **"🛒 Agregar al carrito"** (`#cdAddCart`) + link secundario chico **"o consultar por WhatsApp"** (`#cdAsk`, conserva el `buy_url`). El caso agotado sigue igual ("Avísame cuando llegue"). `CARTA_JS_V 4→5`, `ASSET_V 47→48`.
- **`js/carta.js`:** agrega al **mismo** `localStorage.reroll_cart` que la tienda (misma estructura/`lineKey`/tope de stock/variante Foil). Tras agregar: confirmación "Agregado (N cartas)" + **"Ir a finalizar el pedido →"** (`../index.html#carrito`) + "Seguir viendo". `refreshAvail` reconstruye al botón de carrito (no al de WA) y respeta la confirmación (`data-added`).
- **`js/app.js`:** al cargar con `#carrito` (y carrito no vacío) abre el drawer y limpia el hash.
- Cache-busting: index/juego `?v=60→61`.
- **E2E verificado en preview (14 checks):** disponible → agrega al carrito + confirmación; **Foil** agrega variante `id_f` con precio foil; **tope de stock** respetado; "Seguir viendo" restaura; ficha→"Ir a finalizar"→`index#carrito` **abre el carrito solo** con la carta y su total; agotada muestra "Avísame". Botón dorado + link verde = igual al mockup aprobado.

## 2026-07-08 — QA profundo de los 3 juegos nuevos + fix de sellado (pedido de Andrés)
- Andrés pidió: loop agregando muchas cartas de los TCG nuevos, simular una compra, y confirmar que el **producto sellado** sale en su sección.
- **Fix real (`admin.html` setQty):** al agregar del catálogo, el sellado ahora queda con `cond:'Sellado'` + `badge:'Sellado'` (antes heredaba 'Near Mint'). El `type` ya se preservaba.
- **Suite E2E (preview):** agregado en masa de Pokémon/Magic/Yu-Gi-Oh (singles + sellados) → cat/precio/img/type correctos, singles con descripción+atributos, sellados con type+cond+badge=Sellado, re-cruce sin duplicar. Click de agregar ~100-200 ms (los "timeouts" del test eran el tope de 30 s del harness al encadenar cambios de juego con cargas de catálogo de 4 s c/u — NO hay bug de rendimiento).
- **Tienda (18 cartas de prueba inyectadas y revertidas):** filtro **Sellado** muestra SOLO sellados (badge + "Producto sellado"), filtro **Singles** ninguno; quick-view y ficha `/carta/` con efecto+atributos por juego (Greninja Stealthy Slash + HP 300/Debilidad).
- **Compra E2E 8/8:** carrito con cantidades, **tope de stock** respetado (sellado no pasa de 2), subtotal correcto, checkout genera el mensaje de WhatsApp con las 3 cartas nuevas + nombre/teléfono/entrega/SINPE; fallback local sin reserva no rompe. (Nota: la firma real es `addToCart(id, foil)` — cada click suma 1; el 2º arg es foil, no cantidad.)
- Inventario intacto (3689); solo se commiteó el fix de `admin.html`.

## 2026-07-08 — Catálogo del panel: Pokémon, Magic y Yu-Gi-Oh (últimos sets)
- Pedido de Andrés: "agregá los últimos sets de yugioh, magic y pokemon… que todo quede en el catálogo para agregar sin ningún problema", igual que OP/RB.
- **`make_catalogo.py` ahora soporta 5 juegos.** Los 3 nuevos van con los **12 sets más nuevos** (por `groupId` desc, piso 2025; `publishedOn` viene contaminado en grupos viejos): **Pokémon 1962** entradas (ME01→ME05, White Flare, 30th Celebration…), **Magic 3028** (Marvel Super Heroes, Strixhaven, The Hobbit, Reality Fracture…), **Yu-Gi-Oh 1670** (Chaos Origins, Rarity Collection 5, Blazing Dominion…).
- Particularidades manejadas: su **sellado SÍ trae extendedData** (single = `Rarity` sin `UPC`); **subtipos de precio** nuevos (base = 1º de Normal/1st Edition/Holofoil/…; foil = Foil MTG / Reverse Holofoil PKM; YGO sin foil); **atributos por juego** vía campo genérico `extra` (HP/Debilidad/Retirada PKM, ATK-DEF/Nivel/Atributo YGO, Fuerza-Resistencia MTG) que `attr_rows` (fichas) y `buildAttrs` (quick-view del panel) renderizan.
- Panel: selector del catálogo con los 5 juegos (⚡🌸🐉).
- **Suite E2E 13/13** en preview: cada juego agrega con cat/set/precio/img correctos + descripción embebida, re-cruza sin duplicar; fichas de detalle generadas con efecto+atributos (Pikachu HP/Debilidad, Sauron 7/6 + oracle text, Black Chaos ATK/DEF+DARK — Regla de Oro ✓); la carta renderiza en `juego.html?g=Magic` con link a su ficha. Cartas de prueba revertidas: inventario intacto (3689).

## 2026-07-07 — QA del panel: suite E2E de 26 pruebas (pedido de Andrés) + 1 bug real corregido
- Andrés pidió un loop de pruebas de TODAS las formas de subir producto ("si le vendo una tienda a un cliente, me pediría reembolso por estos bugs"). Se corrió una suite E2E en el preview contra el panel real (estado en localStorage del navegador de prueba, la tienda nunca se tocó):
  - **Catálogo RB (7):** agregar nueva · re-buscar reconoce y edita sin duplicar · − a 0 = agotada sin borrar · − en 0 se queda · promo edita el existente · set sin CSV (Vendetta) con fallback · carta foil en base cruza.
  - **Catálogo OP (3):** carga/cruce (imgs TCGplayer en ambos lados) · + edita sin duplicar · agrega nueva.
  - **Form manual (5):** sellado sin foto (emoji) · single con foil+stockf · editar con lápiz (abre el details "a mano") · destildar foil limpia foil/stockf · visibilidad en el acordeón.
  - **CSV (1)** · **Steppers/pendientes DB (8):** normal e instantáneo · foil aparte · escrito=pendiente · ✕ cancela · ✓ aplica · "Aplicar todos" · borrar _new no ensucia deletedIds · borrar real→deletedIds y Deshacer restaura.
  - **Persistencia (5):** cartas/dirty/pendientes sobreviven recarga · tag y botón cuentan bien. **Ventas (1):** descuento de stock. **Publish (2):** sube sin _flags conservando `d` · "Descartar" restaura la tienda exacta.
- **🐛 Bug real encontrado y corregido:** un número escrito PENDIENTE sobre una carta NUEVA quedaba apuntando al id viejo cuando el sync re-numera las nuevas → el ✓ podía aplicar el stock a otra carta. Fix: el sync re-mapea los pendientes al id nuevo (guard `viejo!==nuevo`, el primer intento se auto-borraba) y PODA pendientes huérfanos.
- Falsas alarmas del propio test (documentadas): ids ya no son los del import original — los publishes del panel VIEJO corrían `reindex()` y re-numeraron todo (por eso el promo Challenge pasó de 3601→3645); nombres duplicados legítimos = impresión normal + Showcase.

## 2026-07-07 — Catálogo del panel: cruce por imagen arreglado (fix duplicados tipo Kai'Sa)
- **Bug:** el catálogo maestro (`catalogo/riftbound.json`) traía imágenes de TCGplayer mientras el inventario RB usa las de Riot → el panel nunca reconocía cartas ya registradas (`invMatch` cruza por img) → "+" en vez del stepper → **duplicó Kai'Sa - Survivor** (id 3690, borrada; quedan id 42 Showcase ×1 y id 43 base ×3 — revisar conteo físico).
- **`make_catalogo.py`:** Riftbound ahora resuelve la imagen de **Riot** por número+set (misma lógica de denominadores 298/219/221/024 que `make_promos_rb.py`, con desambiguación Showcase/normal y de números reciclados). Grupos promocionales de TCGplayer → set **"Promos"** (igual que el inventario). Rebuild: 1105/1249 con img de Riot; fallback TCGplayer (Vendetta, sin CSV aún).
- **`admin.html` `invMatch`:** desempata cuando base y promo comparten imagen (por set, luego nombre normalizado — cruza "Kai'Sa - Survivor" TCGplayer con "Kai'Sa, Survivor" Riot); variantes de evento `(Metal)/(Prize Wall)/(Champion)/(Top 8)/(Overnumbered)/(Signature)` solo cruzan por nombre exacto (si no → "+").
- **El catálogo es LA forma de agregar** (pedido de Andrés): el formulario manual quedó plegado en "✍️ Agregar a mano (avanzado)". Las cartas en tu base **siempre muestran stepper con su stock real** (0 = "✓ en tu base · agotada"); el − a 0 marca agotada y **ya no borra** la carta.
- Verificado E2E en preview: Kai'Sa Survivor→3, Alt Art→1, promo DV→2, Metal/Signature→"+"; + sobre agotada edita la existente SIN duplicar.

## 2026-07-07 — Panel reorganizado + a prueba de pérdidas (tras perder 1 h de trabajo)
- **Causa raíz de la pérdida:** al abrir el panel, `syncFromStore` pisaba las ediciones locales sin publicar con lo de la tienda, y el merge por NOMBRE descartaba cartas repetidas (así desaparecieron las Body Rune). Además los cambios "pendientes" vivían solo en memoria.
- **Sync seguro:** ahora cada edición local lleva `_dirty:1` (o `_new:1` si es carta nueva; borradas → `deletedIds`), todo persistido en localStorage. El sync usa la tienda como base y **conserva lo tuyo encima, cruzando por ID** (ya no por nombre). Los `_flags` nunca se suben (`SIN_FLAGS` replacer). Al publicar, se limpian. `reindex()` eliminado (ya no se reasignan ids).
- **Contador "sin publicar":** chip 📝 en la barra fija + botón "🚀 Publicar N cambios" + barrita dorada en la DB con "Descartar y cargar la tienda". Puntito dorado en cada fila con cambios. Publicar con números escritos sin confirmar ofrece confirmarlos en el mismo paso.
- **Steppers instantáneos:** los +/− aplican al momento (click deliberado); solo escribir un número a mano pide ✓ Confirmar (ahí pasaban los ceros accidentales). `pending` ahora persiste en localStorage.
- **Acordeón uniforme** en orden de flujo: 📦 Pedidos → 🗄️ Base de datos (abierta al entrar, con botón "🃏 Agregar del catálogo") → ➕ Agregar cartas (catálogo + a mano + CSV fusionados) → 💰 Ventas/Caja (plegada, total en la barrita) → ⚙️ Configuración (token). El panel "🚀 Publicar" duplicado desapareció: se publica SOLO desde la barra fija.
- **Fuera botones-bomba** (pedido de Andrés): "Vaciar toda la base" y "Vaciar ventas" eliminados.
- Bug corregido en el camino: quedaba un `$('#publishBtn').onclick` apuntando a un botón eliminado → rompía todo el init del panel.
- Verificado E2E en preview: stepper aplica y persiste → **reload conserva el cambio** ("✅ cargada — 1 sin publicar") → input escrito pide ✓ → descartar restaura lo de la tienda → acordeón y secciones OK.

## 2026-07-07 — Promos de Riftbound al inventario (`make_promos_rb.py`)
- Nuevo script **`make_promos_rb.py`**: baja los grupos de promo de Riftbound de TCGplayer/TCGCSV (Organized Play, Judge, Promotional) y agrega **115 promos** a `productos.json` como set **"Promos"**, `type` single, **stock 0** (agotados: se ven en la tienda cuando Andrés les ponga stock en el panel).
- **Filtra** sellados (Box Set/Bundle) y ultra-raros de evento `(Metal)/(Prize Wall)/(Champion)/(Top 8)` — solo singles jugables.
- **Precio:** market USD (foil si es foil-only, casi todos) × 520 + redondeo escalonado. Rango ₡200 → ₡385.000 (Teemo Scout GG EZ).
- **Imagen:** el CDN de TCGplayer bloquea hotlinking (verificado: 403/AccessDenied en navegador), así que cada promo se cruza con su carta BASE por **número de coleccionista + set** (campo "Number" tipo `246b/298`; denom 298→Origins, 219→Unleashed, 221→Spiritforged, 024→Proving Grounds) y usa la **imagen de Riot**. Desambigua por nombre cuando un número tiene varias cartas (Unleashed recicla numeración). **0 errores de cruce.**
- Tras `--aplicar` se corrió `python make_cartas.py` → cada promo tiene su ficha `/carta/…` con efecto + atributos (Regla de Oro). 3574 → **3689** productos/páginas.
- **Se saltan** (reportados): 8 sin precio (Jayce, Blue Sentinel, runas R0xc dup) + 3 tokens sin base (Bird//Buff). Agregables a mano luego.
- Verificado en preview: "Challenge" promo renderiza (Promos · ₡400 · Agotado), imagen carga, enlaza a su ficha. No se tocó CSS/JS (sin bump de `?v`).

## 2026-07-07 — Checkout: teléfono del cliente + "recordar mis datos" (pedido de Andrés)
- Andrés no quería buscar en WhatsApp por número. Ahora el checkout pide **Teléfono/WhatsApp** (obligatorio, valida ≥8 dígitos) en index.html y juego.html; el número **viaja en el pedido** y en el mensaje de WhatsApp (`Tel: …`).
- **Panel 📦 Pedidos:** cada pedido muestra `📱 número` + botón verde **💬 WhatsApp** que abre el chat directo (`pedWaLink`: normaliza a `wa.me/506…`, agrega código país a los 8 dígitos ticos). Pedidos viejos sin teléfono muestran "(sin teléfono)".
- **"Recordar mis datos" (localStorage, NO cuenta):** casilla marcada por defecto; guarda nombre/teléfono/entrega/provincia/dirección en `reroll_cliente` y **prellena** el checkout la próxima vez (`prefillCheckout`). Si la destildan, se borra. Se explicó a Andrés por qué NO conviene login con Gmail/cuentas hoy (complejo, backend, fricción) — esto da el 95% sin nada de eso.
- API: `api/pedido.js` valida y guarda `telefono` en el pedido. Harness Node: 12/12 + 2 casos nuevos (sin tel → 400, se guarda solo dígitos).
- Cache `?v=59→60` (app.js + styles.css). carta.js sin cambios. Probado en navegador: campo + validación + recordar + prefill + panel con número/botón WA (`wa.me/50688888888`). 0 errores de consola.

---

## 2026-07-07 — 📦 Sistema de pedidos con reserva 48 h (pedido de Andrés: "como las mejores tiendas")
- **Qué resuelve:** al enviar un pedido por WhatsApp, el stock baja SOLO para todos los visitantes (reserva), a Andrés le llega el pedido al panel, él **confirma la venta** (descuento real + registro en Ventas) o **quita cartas / rechaza** (vuelven al stock al instante). Reservas expiran solas a las **48 h**.
- **Arquitectura elegida (Andrés):** mini-API serverless en Vercel usando **el repo de GitHub como base de datos** (`data/pedidos.json`), cero dependencias/cuentas nuevas. 4 funciones en `api/`: `pedido` (crear, valida stock−reservas, 409 con faltantes), `reservas` (GET público `{id:n,id_f:n}`), `pedidos` (GET admin), `pedido-accion` (quitar/rechazar/confirmar; confirmar descuenta stock/stockf en `productos.json` del repo → deploy). `_lib.js` compartido: Contents API con sha-por-listado + raw (archivos >1MB), reintentos ante conflicto de sha, prune 30 días/300, `PANEL_KEY` por header. **Testeado con harness Node y GitHub simulado: 12/12 escenarios OK** (reserva, 409, foil por stockf, expiración, doble confirmación bloqueada, confirmar sin stock 409).
- **Tienda (`js/app.js` v58→59):** `applyReservas()` resta reservas del stock visible al cargar (foil→stockf o normal); `submitCheckout` ahora es async: `POST api/pedido` → WhatsApp con **Pedido #R-XXXX** + nota de reserva, vacía el carrito y baja stock local; con **409** ajusta el carrito a lo disponible y avisa ("alguien apartó antes"); sin API (local) cae al flujo de siempre. Botón deshabilitado mientras envía (anti doble pedido).
- **Ficha (`js/carta.js` v3→4 + rebuild 3.574):** resta reservas de esa carta al re-hidratar (normal y foil).
- **Panel (`admin.html`):** nueva sección **📦 Pedidos** (barra plegable estilo Base de datos, badge con pendientes): clave `PANEL_KEY` guardada en localStorage (`reroll_pedkey`), lista con líneas quitables (✕), **✓ Confirmar venta** / **Rechazar**, "expira en X h", historial plegado. Al confirmar: espejo local del descuento (para que un publish posterior no lo pise) + ventas auto-registradas canal "Pedido web R-XXXX". En local muestra aviso "funciona en el panel publicado".
- **Verificado en preview:** applyReservas normal/foil/foil-sin-stockf; checkout con API simulada (número en msg, carrito vacío, stock local −2) y 409 (carrito ajustado, no abre WhatsApp); bandeja render + confirmar espeja stock y 2 ventas. 0 errores de consola.
- **CLAUDE.md actualizado** (excepción api/ + doc del sistema). ⚠️ **Pendiente para activarlo:** env vars en Vercel `GITHUB_TOKEN` (fine-grained, contents RW) y `PANEL_KEY` + push. Sin env vars la tienda funciona igual que antes.

---

## 2026-07-07 — Panel: cambios de stock "pendientes" (antipófallo del Aplicar) (pedido de Andrés)
- Problema: el "Aplicar" de la barra masiva aplicaba el valor de la casilla (por defecto **0**) a TODAS las filtradas → Andrés puso cartas en 0 varias veces sin querer.
- **Nuevo flujo (solo `admin.html`):** los +/− de stock y foil **ya no guardan solo**. Cada cambio queda **pendiente**: la fila se marca (borde dorado + badge "cambio") y aparece **✓ Aplicar / ✕ Cancelar** en esa fila. Arriba, barra sticky **"N cambio(s) sin aplicar"** con **Aplicar todos / Descartar**. Estado `pending={id:{stock?,stockf?}}`, helpers `applyPendingToItem/commitOne/commitAllPending/discardPending`, `render()` pinta valores pendientes y `updatePendBar()`. `editItem` limpia el pending de esa carta (el form manda).
- **Barra masiva escondida:** "Stock a los N filtrados / Todo el inventario a 0" ahora dentro de `<details>` **"⚙️ Acciones masivas (avanzado)"** colapsado; la casilla ya no arranca en 0 (placeholder) y el Aplicar bloquea si está vacía. Confirmaciones intactas.
- Probado en navegador: +/− → pendiente sin guardar; Aplicar por fila guarda; Cancelar revierte; Aplicar todos aplica 2/2; foil igual; avanzado colapsado + guard de vacío. 0 errores. Screenshot del estado pendiente. Sin cambios en la tienda ni cache-bump (panel es standalone).

---

## 2026-07-07 — Stock foil por separado (pedido de Andrés)
- Faltaba poder llevar el stock del **foil aparte** del normal. Nuevo campo opcional `stockf` en `productos.json` (solo cartas con `foil`). Si no está definido, el foil sigue el stock normal (compatibilidad: ninguna carta actual cambia hasta ponerle su cantidad foil).
- **Panel (`admin.html`):** al tildar "✨ Disponible en foil" aparece **"Cantidad foil"** junto al precio foil (`foilFields()` togglea ambos; se guarda/edita/borra con el foil). En la **Base de datos**: la línea muestra "✨ Foil ₡X · N en stock" y hay un **stepper de foil aparte** (`.stkf__b/.stkf__i`, dorado) apilado bajo el normal con etiquetas STOCK / ✨ FOIL (`admStockF`, `setFoilTo`).
- **Tienda (`js/app.js`):** helpers `stockValF()` + `foilAvailable()`. El toggle Normal/Foil del card y del quick-view ahora recalcula disponibilidad por variante (`paintAvail`/`qvAvail`): si el foil se agota pero el normal no, solo se deshabilita "Añadir" al elegir Foil (y al revés), con label "Agotado en foil". `addToCart`/`changeQty` topean por la variante correcta. Quick-view ganó línea `qv__stock`.
- **Ficha (`js/carta.js` v2→3):** re-hidrata disponibilidad por variante (`variantAvail`/`refreshAvail`), swap Comprar↔Avísame según la variante. Rebuild de las 3.574 fichas. Cache `app.js`/`styles.css` `?v=57→58`.
- **Probado en navegador (localhost):** Normal 5/Foil 0 → foil "Agotado en foil" + botón off, normal OK; Normal 0/Foil 3 → normal "Agotado", foil "¡Solo 3!"; addToCart foil agrega / normal bloquea; quick-view igual; panel: form crea `stockf`, stepper foil sube/baja. 0 errores de consola. Screenshots del form y de la base con doble stepper.
- Commit del feature + rebase sobre publish del panel (`c30df007`, stock/precio de ~10 cartas) + re-sync de 8 fichas.

---

## 2026-07-07 — Rutina de precios TCGplayer + 386 subidas aplicadas
- **Nueva herramienta `check_precios.py`:** compara `productos.json` contra los precios **frescos** de TCGplayer (vía TCGCSV, sin cache de precios) y reporta qué cambió. Cruce: One Piece por **ID exacto** de la imagen (2.623/2.629; 6 sin img); Riftbound por **nombre+set**, con manejo de campeones (`Nine-Tailed Fox`→`Ahri - Nine-Tailed Fox`) y fallback por nombre único global (31 sin cruce = tokens tipo *Recruit (DE)* y algún campeón de Proving Grounds). Si el cruce es ambiguo NO adivina. Misma conversión USD×₡520 + redondeo escalonado que make_catalogo.
- Genera `reporte_precios.md` (legible) + `reporte_precios.csv` (Excel), ordenados de mayor subida a menor. Ambos + `productos_backup_precios.json` en `.gitignore` (locales).
- Uso: `python check_precios.py` (solo reporta) · `--min N` (ignora cambios chicos) · `--aplicar-subidas` (aplica solo las que subieron, con backup) · `--aplicar` (subidas+bajadas).
- **Corrida de hoy:** 385 subieron · 579 bajaron · 31 sin cruce · 6 sin precio. **Aplicadas solo las 386 subidas** (Andrés: dejar las bajadas para no rematar); 0 bajadas tocadas. Escrito con `indent=2` (mismo formato del inventario). Las fichas re-hidratan precio desde productos.json en vivo (`carta.js`), así que NO hizo falta rebuild ni bump de caché.
- Commit `63546ed`, push a main. **Verificado en producción:** #1854 Marshall.D.Teach ₡860.000→**₡920.000** en vivo.
- **Rutina semanal automática:** tarea de Windows "Reroll - Chequeo de precios TCGplayer", lunes 9:00 AM, `StartWhenAvailable`, solo genera el reporte (no aplica). Probada (LastTaskResult 0x0).
- **Reporte agrupado por juego** (pedido de Andrés): secciones `### One Piece` / `### Riftbound`, cada una de mayor a menor cambio (helper `section()` + `GAME_ORDER`). Lista de cambios en `cambios_aplicados_YYYY-MM-DD.md/.csv`.
- **FIX importante (mismo día):** las cartas **Showcase** (alt-art premium: Signature/Overnumbered/Alt Art) tienen el MISMO nombre que la base en productos.json → el fallback global las cruzaba con la base barata (falsos -₡1M y **7 subidas mal aplicadas**: #42,#225,#409,#440,#544,#575,#802). Corregido: `resolve_pid` lee la **rareza real por el CSV rico** (`Riftbound_Cards/*.csv`, puente por img) y si es `Showcase` NO cruza → van a `revisar_a_mano.csv` (180). Además usa nombre canónico del CSV, **alias de set** (`Proving Grounds`→`Origins: Proving Grounds`) y se quitó el fallback global. Restaurado el inventario original y **re-aplicadas solo las 381 subidas correctas** (215 OP + 166 RB). Commit `ef679e6`. Verificado en vivo: #440 Irelia Fervent revirtió ₡10.000→**₡4.500**.
- Coverage final: OP 2.623/2.629 (por ID); RB base bien cruzadas; 180 Showcase + 19 otras a revisar a mano (en `revisar_a_mano.csv`, gitignored). Todos los reportes/listas locales en `.gitignore`.
- **Foil verificado + marcado (pedido de Andrés):** de 413 RB con campo `foil`, se comparó el foil de **410** (99%); 11 subidas de foil aplicadas (de las 381), 118 foils en las bajadas del reporte. Solo *Calm Rune* y *Mind Rune* sin precio foil fresco en TCGplayer. El reporte/CSV/lista ahora traen columna **tipo** = `Normal` / `**✨ Foil**` (resaltado) para cazar commons foil que se disparan. Sin cambio de sitio (solo el tool).
- **Marcador 🔥 (pedido de Andrés):** cualquier carta (foil o normal) que suba **más de 25%** sale con 🔥 en el reporte y la lista, y `salto_fuerte=SI` + columna `pct` en el CSV (filtrable en Excel). Const `HOT=25` en check_precios. Leyenda en el encabezado. Hoy: 157 de las 381 subidas fueron +25% (muchas cartas baratas). Commits `5e551c9` (foil) + siguiente (🔥).

## 2026-07-04 — Buscador: "Ver los N resultados" (reporte de Andrés)
- El desplegable del buscador del hero se cortaba contra "Trabajamos con" y no dejaba ver todas las coincidencias. Ahora muestra **máx. 5 resultados + botón dorado "Ver los N resultados de "query" ↓"** (`.sr__more`) que lleva al catálogo filtrado con TODAS (mismo flujo `chooseResult`). Con ≤5 coincidencias no aparece el botón. Cache `v56→v57`. Verificado: ahri 5+botón→catálogo 6; sin errores.

## 2026-07-04 — Quick-view: selector Normal/Foil (detalle reportado por Andrés)
- El quick-view mostraba el precio foil pero no dejaba elegirla (siempre agregaba la normal). Ahora, si la carta tiene `foil`, muestra el toggle **"Normal ₡X | Foil ✨ ₡Y"** (reusa `.ftoggle`), el precio cambia con shimmer (`card__price--foil`) y "Agregar al carrito" respeta la variante (`addToCart(p.id, qvFoil)` → línea `id_f`).
- Verificado: flujo completo con Brazen Buccaneer (carrito con 2 líneas separadas `2_f`/`2`) + mini-loop 10/10 cartas foil (precio y línea correctos) + cartas sin foil no muestran toggle. Cache `v55→v56`. 0 errores.

## 2026-07-04 — One Piece completo: OP-01 → OP-15 (2.469 cartas)
- **Los 15 boosters principales que faltaban** (Romance Dawn → Adventure on Kami's Island) agregados a `productos.json` desde el catálogo maestro (TCGCSV): 2.469 singles (incl. DON!!/alt-arts de cada grupo), ids 1106–3574, **stock 1**, precios TCGplayer × ₡520 + redondeo. Tienda total: **3.574 cartas** (945 RB + 2.629 OP). 6 sin imagen (placeholder), 7 con foil.
- Selección por NOMBRE de set (los 16 grupos principales; OP-16 ya estaba); dedup por img y nombre+set. Starter decks / Extra Boosters / promos NO agregados (quedan en el quick-search del panel para sumar luego).
- `make_cartas.py` → 3.574 fichas (3.352 con efecto), cartas.json 2.3MB / productos.json 1.4MB (viajan comprimidos por Vercel).
- **Loop de verificación:** filtros 120/120 a escala (20× por grupo + combos en OP), 17 expansiones con conteos, quick-view 40/40 en muestra de los 15 sets + 40/40 fichas estáticas (HEAD 200), precios verificados (chase Manga ₡2–3M = mercado real; 1.476 commons ₡100), hero pill auto "3 574", panel: base 3574 ✅ + quick-search marca "en tu base" (Zoro RD 4/4) y deja agregar lo no incluido (starters). Rendimiento: renderGrid 3ms, getFiltered 0.3ms. 0 errores de consola.
- Backup previo en scratchpad (`productos_backup_pre_op_full.json`).
- **Sets de One Piece con código (pedido de Andrés):** "OP01: Romance Dawn" … "OP16: The Time of Battle" en TODOS lados — filtro de la tienda (quedan ordenados OP01→OP16 en vez de alfabético), sheet móvil, panel quick-search, fichas y metas. `OP_SET_CODES`/`set_label()` en make_catalogo.py + rename en productos.json (2.628 cartas; el viejo "OP-16 The Time of Battle" unificado a "OP16: …") + rebuild. Bonus: buscar "op01 zoro" funciona en el buscador y en el quick-search.
- **Fix de caché del catálogo en el panel:** los fetch de `catalogo/*.json` usaban `force-cache` (nunca revalidaba → el panel se quedaba con catálogo viejo tras regenerarlo). Ahora `no-cache` (ETag), igual que productos.json.
- **Bug encontrado y corregido al revisar el panel:** el quick-search matcheaba catálogo→base por `img` incluso vacía → productos sin foto (ej. "Set Sail Deck Set", sellado NO agregado) salían "✓ en tu base" apuntando a una carta ajena (Arlong Dash Pack); el stepper habría editado/borrado la carta equivocada. Fix: `invMatch(e)` — por imagen, y si la entrada no tiene imagen, por **nombre+set** (nunca por img vacía). Verificado: "set sail" 0 marcadas; "arlong dash" 1/1 correcta.

## 2026-07-04 — Hero nuevo: desfile de cartas del inventario (marquee)
- **Hero rediseñado** (`hero--marquee` en index.html): pill con el conteo real ("Cartago, CR · 1 105 cartas en stock"), título "Tu próxima carta **ya está acá**.", lead corto, CTA dorado "Ver el catálogo →" + el MISMO buscador (ids intactos). Reemplaza el hero "Encontrá tu carta…" con chips de juego y stats (renderHeroChips/updateHeroStat quedan null-safe, sin uso).
- **Desfile infinito de cartas REALES** (`renderHeroMarquee` en app.js): 12 cartas al azar del inventario (con foto, disponibles, >₡5000; fallback a cualquiera) duplicadas ×2, inclinadas alternado, animación CSS `hmqslide` (translateX -50%, 45s), desvanecido arriba por mask, **pausa al hover** y cada carta clickeable → quick-view (delegate extendido a `a.hmq__card`). Cambian en cada visita.
- Basado en un componente React/framer-motion que pasó Andrés — **reescrito en vanilla CSS/JS** (regla del stack).
- **Loop de clicks pedido:** 24 desfile + 75 grid home (3 págs) + 25 Riftbound + 25 One Piece = **149 clicks, 0 fallos, 0 errores JS**. Móvil OK (24 imgs, sin scroll-H, click abre quick-view). Cache `v54→v55`.
- Nota: las cartas OP-16 muestran marca "SAMPLE" (imágenes preview de TCGplayer/Bandai; las irán reemplazando).

## 2026-07-04 — QA de filtros (220 pasadas) + mejoras móviles (vista 2/4 + tiles Singles/Sellado)
- **QA del filtro avanzado (pedido de Andrés, "20 veces cada cosa"):** 160 pasadas desktop Riftbound (20× por grupo + combos), 20 One Piece, 20 home, 20 sheet móvil — **220/220 OK, 0 errores JS**. Frames verificados (popovers dentro de pantalla, sin scroll-H). Panel: 5 cartas agregadas/quitadas por quick-search real sin errores.
- **Vista móvil 2 o 4 por fila:** toggle de íconos en la `mfilterbar` (`#gv2`/`#gv4`, clase `grid--4`); modo compacto muestra imagen+nombre+precio. Persistente (`localStorage reroll_gridview`).
- **"Singles & sellado" móvil:** de 942px de columnas de texto → **340px** con 2 tiles horizontales tocables (icono + título + mini-línea + flecha), como el mockup aprobado. En móvil se oculta el h2/p de la sección (queda el eyebrow). **Desktop igual que antes.** La tile/CTA ahora aplica el filtro Singles/Sellado (`data-offer` → `activeType`) y scrollea al catálogo.
- Cache `v52→v54`. Todo en la rama `filtros-avanzados` (PR #1); pendiente de merge (= deploy). Próximo: mejorar el hero.

## 2026-07-04 — Filtro avanzado estilo TCGplayer (home + juego.html, desktop + móvil)
- **Barra de chips-dropdown** (`#fbar` en `.filters`, render `renderFilterBar` en `app.js`): Expansión · Rareza · Tipo de carta · **Dominio/Color** (cambia según juego) · Foil ✨ (toggle, solo si hay foils en contexto) · Condición · Precio (min/max) + "Limpiar todo". Dropdowns **multi-selección con conteos contextuales** (estilo TCGplayer: cada dropdown cuenta sobre el resto de filtros aplicados). Chip activo dorado con ✕ para quitar. En la home, Expansión agrupada por juego.
- **Datos de filtro** enriquecidos al cargar (`enrichProducts`): rareza/tipo/dominio-color salen de `cartas.json` (`SLUGS`) o de `p.d.at` (cartas del panel). Orden canónico de rarezas por juego (`RAR_ORDER`).
- **Estado nuevo multi**: `selSets/selRars/selCTs/selDoms/selConds` (Sets), `foilOnly`, `priceMin/priceMax`. Reemplazó `activeSet/activeColor/activeCond`. `getFiltered(except)` para conteos.
- **REGRESIÓN RESUELTA (reporte de Andrés):** en móvil `#catalogo .filters` se oculta y **juego.html no tenía panel móvil** → las subpáginas quedaban SIN filtros (sin expansiones). Se agregó `mfilterbar` + `filterSheet`/`sortSheet` a juego.html, y el sheet (ambas páginas) ahora es completo: Expansión, Rareza, Tipo, Dominio/Color, Acabado, Condición, Precio min/max, "Limpiar" y botón **"Ver N resultados"** en vivo.
- Reemplazó los selects viejos `#setFilter`/`#colorFilter` y el slider único `#mfPrice`. Cache `v51→v52`. Verificado desktop+móvil en Riftbound/One Piece/home, popover cierra al click fuera/Esc, quick-view convive, 0 errores de consola.

## 2026-07-03 — Quick-view (modal de detalle) + stress test 10k
- **Quick-view en la tienda** (`js/app.js` + `css/styles.css`, cache v49): click en cualquier carta → modal con imagen + **descripción** + atributos + precio + "Agregar al carrito" + "Ver ficha completa". La descripción sale de `p.d` (embebida al agregar del catálogo) o de `cartas.json` (`SLUGS[id].d`). Intercepta `a.card__link` (preventDefault); las páginas estáticas siguen para SEO/no-JS.
- **`make_cartas.py`** ahora escribe `d = {fx: efecto renderizado, at: [[label,val]]}` en cada entrada de `cartas.json` (1075/1105 con efecto). El **panel** produce el mismo `d` al agregar (JS `cleanAbility`+`buildAttrs`) y lo embebe en la carta → funciona sin depender de rebuilds.
- **Imágenes sin foto:** `make_catalogo.py` usa `imageCount` de TCGCSV; si 0 → sin URL. Riftbound ~14% sin imagen en TCGplayer (promos/org-play/Vendetta nuevos), One Piece ~2.5%.
- **Placeholder "Imagen no disponible"** (reemplazó el emoji, cache v49→v50): recuadro punteado con icono de imagen tachada en la grilla y el quick-view de la tienda (`.noimg` en `app.js`/`styles.css`), y "Sin imagen" en las filas del catálogo/inventario del panel. En la base de datos, las cartas sin foto muestran badge **"sin imagen"** + botón **"📷 Poner imagen"** que abre el editor con el campo de foto/link enfocado (reusa `editItem`). Verificado en tienda, catálogo e inventario, sin errores.
- **Bonus:** Love-Love Mellow (tu carta manual) ahora tiene efecto — su rich estaba en el catálogo completo de One Piece.
- **Stress test (verificado):** 8305 cartas cargadas (fetch+build 248ms). Integridad: 100% con img válida/nombre/precio, 87% con descripción (resto sellado/vanilla). Imágenes: ~95% cargan; los fallos en ráfaga eran throttling del CDN (cargan solas), y las genuinamente sin foto ya usan emoji. Quick-view: 250 fichas abiertas, 0 errores, 0.15ms c/u. Panel: agregar 8305 (total 9410≈10k) en 57ms + save 117ms, localStorage 3.75MB; quitar/restaurar OK; add/remove REAL end-to-end con `d` embebido OK. Cero errores de consola.

## 2026-07-03 — Catálogo maestro + quick-search en el panel (estilo CardNexus)
- **`make_catalogo.py` (NUEVO):** genera el catálogo maestro desde TCGCSV (Riftbound cat. 89, One Piece cat. 68). Por juego, dos archivos en `catalogo/`: **liviano** (`<juego>.json` — nombre/set/nº/rareza/tipo/img/precio/foil, lo carga el panel) y **rico** (`<juego>_rich.json` — efecto+atributos, solo build local). Precio = market TCGplayer × ₡520 + redondeo escalonado; foil como variante si hay Normal+Foil.
  - Riftbound: 1249 cartas (9 sets: Origins, Spiritforged, Unleashed, Vendetta, Proving Grounds, promos, org play). One Piece: 7056 cartas (77 sets). Cache crudo de TCGCSV en `catalogo/_cache/` (gitignored).
- **Panel: "🃏 Agregar desde el catálogo"** (modal quick-search en `admin.html`): elegís juego → busca (tolerante, por palabras) → filtros Tipo/Expansión/Finish → cada carta con imagen+precio y `+`/`−` para poner cuánto tenés. Se agrega/quita de la base (`items`) matcheando por `img`; en 0 se quita. Imagen/precio/descripción salen del catálogo — cero carga manual.
- **`make_cartas.py`:** ahora también carga `catalogo/*_rich.json` (keyed por img) → toda carta agregada del catálogo tiene ficha con descripción. `render_op_ability` generalizado (limpia HTML de TCGplayer `<em>/<br>/<strong>`); se usa cuando el efecto trae tags `<`.
- **Verificado:** buscar (ahri 13, luffy), agregar (→ base, stock 1), stepper +/− (quita en 0), cambio de juego (77 sets OP), filtros set/foil, sin errores de consola. Pendiente menor: el filtro "foil" solo cuenta cartas con variante normal+foil (las foil-only Showcase/Epic no matchean).
- **SIN pushear** (decisión del usuario: subir todo junto cuando el quick-search esté listo). El catálogo liviano (~1.9MB) se sirve al panel; los `_rich` (~3.5MB) son solo build.

## 2026-07-02 — One Piece OP-16 + fichas ricas + buscador tolerante
- **159 cartas de One Piece OP-16 "The Time of Battle"** agregadas a `productos.json` (ids 947–1105): base + alt-arts/parallels + DON!!/SP/Manga. Juego nuevo "One Piece". Total del catálogo: 1105.
- **Precios reales de TCGplayer** vía **TCGCSV** (espejo de la API de TCGplayer, categoría 68, grupo 24664): marketPrice por carta (subtipo Normal o Foil) × **₡520** + redondeo escalonado. Rango ₡100–₡630.000 (Manga/SP = valor real de mercado). Imágenes del CDN de TCGplayer (`_400w.jpg`). Stock 1.
- **Reconciliación git:** el remoto tenía un publish del panel (Love-Love Mellow, id 946) que el local no; se hizo `git pull` ANTES de reponer One Piece para no perderla.
- **Fichas ricas de One Piece (regla de oro):** `onepiece_rich.json` (NUEVO, derivado de TCGCSV: efecto, color, poder, vida, counter, costo, atributo, subtipos) se cruza en `make_cartas.py`. Nuevo `render_op_ability` limpia el HTML de TCGplayer (`<br>/<strong>`) y resalta los `[keywords]`. `attr_rows` extendido con atributos de One Piece. Ahora cada carta abre su detalle con descripción, como Riftbound.
- **Love-Love Mellow (subida a mano):** ahora tiene ficha y abre al click (el rebuild la generó); imagen bajada de `_in_1000x1000` a `_400w` (quedaba enorme). Sigue sin descripción (se subió a mano sin efecto; su set no se ubicó en TCGCSV).
- **Buscador tolerante** (`js/app.js`, `normSearch`/`matchQuery`): sin tildes, sin puntuación, por palabras sueltas — "luffy"/"monkey luffy" encuentran "Monkey.D.Luffy", "pokemon" → "Pokémon". Tope del buscador rápido 6→10. Cache `v47→v48`.
- **Verificado:** filtro de expansiones ya scopea por juego (no muestra sets de otro juego); Riftbound sin regresión. Sin `foil` en One Piece (cada versión es producto aparte). Sellado NO incluido.
- **Regla de oro nueva:** toda carta que se suba debe abrir su detalle con descripción. Ojo: las cartas subidas por el panel NO generan ficha hasta correr `make_cartas.py` (el panel no corre Python) — hay que rebuild + push tras publicar a mano.

## 2026-07-02 — Panel: base de datos plegable + borrado con aviso
- **Inventario → "🗄️ Base de datos" plegable** (cerrada por defecto): la zona de agregar queda limpia; las 943 cartas ya no estorban. La barra muestra contador + valor + indicador de carga (✅ cargada / ⚠️ no cargó). Toggle "Ver / editar ▾".
- Se movieron adentro de la base los botones peligrosos/secundarios: **"Vaciar toda la base"**, "Cargar de la tienda", "Importar archivo" (antes sueltos en el encabezado).
- **Borrar una carta ahora pide confirmación** ("⚠️ Cuidado: vas a borrar X… desaparecerá de la base de datos") antes de quitarla; se mantiene el "Deshacer".
- Motivación (Andrés): que lo ya subido viva como base de datos sin riesgo de borrado accidental; agregar solo suma. Cambio aislado a `admin.html` (autónomo, sin styles.css/app.js → sin bump de caché).

## 2026-07-02 — Foil de Riftbound (commons/uncommons)
- **Precios foil reales de TCGplayer** para 413 commons/uncommons: extraídos de las 4 Price Guides vía la API interna `mpapi.tcgplayer.com/v2/product/<id>/pricepoints`, convertidos **USD × ₡520** (el mismo tipo de cambio del inventario normal) + el **redondeo escalonado** del proyecto. Escritos como campo `foil` en `productos.json`.
- **Toggle Normal / Foil** en el catálogo y en la ficha de carta: cambia el precio con brillo tornasol; el carrito guarda normal y foil como **líneas separadas** (clave `id`/`id_f`); en la ficha, el botón de WhatsApp arma el mensaje "en FOIL".
- **Panel admin:** casilla "✨ Disponible en foil" + campo Precio foil; badge en el inventario; el editor carga/guarda el foil.
- **Ajuste:** 74 cartas cuyo foil quedó igual al normal (foil ≤ ~$0.19 → ₡100) se subieron **+₡200** para que el foil siempre valga más.
- Hallazgo: en Riftbound los foils de common/uncommon NO salen en la Price Guide (solo en la página de cada producto, filtro Printing). Rare/Epic/Showcase ya son foil-only; su precio actual ya es el foil.
- Cache `v46 → v47`, carta.js `v1 → v2`, 943 cartas regeneradas.

## 2026-06-27 — Marca Reroll Design + Analytics + SEO
- Footer: crédito **"Diseñado por 🎲 Reroll Design"** (dado vectorial del favicon, sin imagen nueva) en las 3 páginas; luego **enlaza a rerolldesign.com** (nueva pestaña) con animación del dado al hover.
- **Google Analytics 4** (gtag.js `G-X6LMX9VR0Y`) en index/juego/404 + cartas; admin excluido.
- **SEO de indexación:** `sitemap.xml` (945 URLs) + `robots.txt`, generados por `make_cartas.py`.
- **Google Search Console:** meta de verificación en index.html. Regla fija: no borrar meta GSC ni gtag.

## 2026-06-23 — Pulido y performance
- Footer con más aire arriba; optimizaciones de Lighthouse (logo webp, width/height en imágenes); se quitó vintage.html.

## 2026-06-22 — Página de detalle por carta + SEO
- **`/carta/<slug>.html`** generada por `make_cartas.py` (efecto, atributos, compra por WhatsApp, OG/JSON-LD). Índice `cartas.json`.
- Dominio canónico sin www (evita redirect 308). Destacadas enlazan al detalle. Redes sociales visibles en la ficha. Home: logos de juego como enlaces reales + buscador rápido.

## 2026-06-21 — Cartas destacadas (abanico)
- Sección "Cartas destacadas": abanico de cartas al azar (>₡5000), CSS puro. **Mano giratoria** para que en móvil se vean las cartas de atrás. Copy sin precio, rotación cada 1 min.

## 2026-06-20 — "Trabajamos con" + banner de juego
- Paneles altos por juego (arte + logo, abanico con perspectiva). Banner de juego.html con arte del personaje fundido en el vino.

## 2026-06-19 — SEO/social, a11y, panel seguro, favicon
- Open Graph + Twitter Card + JSON-LD + banner de marca. Skip link y navegación por teclado en el buscador. Panel: confirmar antes de publicar, deshacer borrado, escapar datos. Favicon = dado mascota.

## 2026-06-18 — Stock real + hero
- Stock real por carta; titular del hero.

## 2026-06-14 a 06-17 — Catálogo real + móvil + panel pro
- **Catálogo Riftbound real: 943 cartas** (4 sets) con imágenes por link del CDN de Riot; reconstruido con Python desde los Excel del dueño.
- Panel: imágenes por link (campo URL + columna CSV), **filtros + paginación en inventario, barra fija, módulo Ventas/Caja** (con rango de fechas).
- **Redondeo de precios:** hacia arriba a la centena (≤1000) y **escalonado** (el paso crece con el precio) para >1000.
- Móvil: catálogo estilo mockup (grilla 2 col + panel deslizable de filtros), hero centrado. Paginación del catálogo (25/pág).

## 2026-06-13 — Tipografía e identidad
- Tipografía auto-hospedada (Archivo Black / Space Grotesk / Space Mono), se eliminó Google Fonts. Lockup REROLL / HOBBY STORE. Grilla "Elegí tu juego" con acento por juego.

## 2026-06-10 a 06-12 — Base de la tienda
- Páginas dedicadas por juego (`juego.html?g=`) + mosaicos "Explora por juego". **Panel admin** con botón Publicar de un clic (commit a GitHub → Vercel auto-deploy) y carga de lo publicado al abrir. Carrito persistente con cantidad y tope de stock. Arte de fondo por juego. FAQ + WhatsApp flotante. Buscador con resultados en vivo. Editar/buscar inventario, valor total. Dominio enlazado.
