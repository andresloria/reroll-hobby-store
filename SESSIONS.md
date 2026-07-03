# Bitácora de sesiones — Reroll Hobby Store

Registro histórico de todo lo trabajado, sesión por sesión (backup legible).
Detalle técnico estable en [CLAUDE.md](CLAUDE.md) · estado volátil en [HANDOFF.md](HANDOFF.md).
El respaldo real de datos es el historial de git (`git log`); esto es el resumen humano.

Repo: `github.com/andresloria/reroll-hobby-store` · LIVE en rerollhobbystore.com (Vercel).

---

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
