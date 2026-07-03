# HANDOFF — estado de la sesión (act. 2026-07-03)

Todo lo de abajo está **en vivo en rerollhobbystore.com**. Cache en **`?v=51`** (index.html y juego.html alineados). Historial completo en [SESSIONS.md](SESSIONS.md).

## En qué estábamos (sesión 2026-07-03) — Catálogo maestro + quick-search + quick-view
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
