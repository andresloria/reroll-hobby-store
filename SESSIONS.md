# Bitácora de sesiones — Reroll Hobby Store

Registro histórico de todo lo trabajado, sesión por sesión (backup legible).
Detalle técnico estable en [CLAUDE.md](CLAUDE.md) · estado volátil en [HANDOFF.md](HANDOFF.md).
El respaldo real de datos es el historial de git (`git log`); esto es el resumen humano.

Repo: `github.com/andresloria/reroll-hobby-store` · LIVE en rerollhobbystore.com (Vercel).

---

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
