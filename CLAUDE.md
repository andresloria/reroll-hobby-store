# Reroll Hobby Store — guía del proyecto

Tienda TCG (Cartago, Costa Rica) de **Andrés** (`andresloria`). Vende singles + sellado (ÉL vende, no es marketplace). Precios en ₡. Voseo tico cálido. Juegos: One Piece (foco de lanzamiento), Riftbound, Pokémon, Magic, Yu-Gi-Oh, Weiss Schwarz.

## Stack (IMPORTANTE)
- **Sitio estático: HTML + CSS + JavaScript vanilla. SIN build, SIN React/Tailwind/TypeScript, SIN node/npm.**
- No se pueden "integrar componentes shadcn/React" tal cual: hay que **reescribir el efecto en vanilla JS**. Librerías externas solo por `<script>` CDN si hace falta.
- Python disponible solo para: servir local y scripts de assets (Pillow).

## Archivos
- `index.html` — home. `juego.html` — catálogo por juego (`?g=<TCG>`). `admin.html` — panel privado (clave `reroll`). `vintage.html` — muestra aparte.
- `css/styles.css` y `js/app.js` — **mantener SEPARADOS**.
- `productos.json` — inventario real (fuente de verdad). **Reconstruir SIEMPRE con Python**, nunca con merge de líneas de git (rompe/duplica).
- `assets/` — `logo.png` (dado mascota d20), `favicon.png`, `og-image.jpg`, `arts/` (arte por juego, webp optimizados), `logos/`, `fonts/` (woff2 auto-hospedadas).
- `make_art.py` / `make_og.py` / `make_favicon.py` — generadores de assets con Pillow. Fuentes sin optimizar van al `.gitignore`.
- `carta/<slug>.html` — **detalle por carta (estático, pre-generado)**. `cartas.json` — índice `id → {slug,…}` que usa `js/app.js` para enlazar el grid al detalle. `js/carta.js` — lightbox + re-hidrata precio/stock. `404.html` — not-found branded (Vercel lo sirve solo).
- `make_cartas.py` — **build de las páginas de detalle.** Cruza `productos.json` + los CSV ricos de `Riftbound_Cards/<Set>/*_cards.csv` por `image_url` (efecto, rareza, dominio, energía, might, nº de coleccionista, ilustrador). **Re-correr `python make_cartas.py` cada vez que cambia el inventario** (regenera `carta/`, `cartas.json` y `sitemap.xml`; los HTML son DERIVADOS, nunca editar a mano). No toca `productos.json`.
- `sitemap.xml` — DERIVADO por `make_cartas.py` (`write_sitemap`): home + `juego.html?g=<juego con inventario>` + cada carta. No editar a mano. `robots.txt` (estático) lo referencia y bloquea `/admin.html`.
- **Analytics:** Google Analytics 4 (gtag.js, ID `G-X6LMX9VR0Y`) en el `<head>` de index/juego/404 + plantilla de cartas; `admin.html` excluido. En `make_cartas.py` las llaves del snippet van escapadas `{{ }}` (la plantilla usa `.format()`).
- **Google Search Console:** verificación por meta tag en el `<head>` de **index.html**: `<meta name="google-site-verification" content="_6DX60aqNivRzGGvFqaIqbOsWTtpV53mqTG60wBe4U0" />`.
- **Foil (Riftbound commons/uncommons):** campo opcional `foil` (₡) en `productos.json` = precio foil; su presencia habilita el toggle Normal/Foil en catálogo/ficha/carrito (variante de carrito por `key` `id`/`id_f`) y se edita en el panel. Precios foil de TCGplayer (API `mpapi.tcgplayer.com/v2/product/<id>/pricepoints`) × ₡520 + el mismo redondeo escalonado. Rare/Epic/Showcase ya son foil-only (no llevan `foil`).
- **`SESSIONS.md`** — bitácora legible de todas las sesiones (backup histórico). Actualizar al cerrar una tanda de trabajo.

## Build / deploy
- **Local:** `python -m http.server 5500` (o las herramientas de preview).
- **Producción:** Vercel auto-deploy al hacer `git push origin main` (~1 min). Repo: `github.com/andresloria/reroll-hobby-store`. Credenciales de git cacheadas en la PC (push directo funciona).
- **Dominio:** rerollhobbystore.com (registrado en Netlify, hosteado en Vercel; Netlify solo DNS).

## Reglas — SIEMPRE
1. **Preview antes de tocar UI:** mostrar un mockup/preview visual y **esperar OK del usuario** antes de editar código de UI. (El `preview_screenshot` se cuelga con animaciones infinitas → inyectar `*{animation:none!important}` antes de capturar, o verificar por `preview_eval`/datos.)
2. **Cache-busting OBLIGATORIO:** al cambiar `css/styles.css` o `js/app.js`, subir el `?v=N` en **index.html Y juego.html** (`sed -i 's/?v=NN/?v=MM/g' index.html juego.html`). Si se desincronizan, alinear ambos al mismo número.
3. **Nombres de assets en minúscula-con-guion** (`magic.webp`, no `Magic.webp`): Vercel es Linux, sensible a mayúsculas; un mismatch da 404 en producción aunque funcione en Windows.
4. **Push solo con OK explícito del usuario** (dispara deploy a producción).
5. **No recrear arte/logos con copyright** — el usuario provee los archivos; yo los optimizo/cableo.
6. Commits terminan con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
7. **NUNCA borrar los tags de verificación/medición del `<head>`:** el meta `google-site-verification` de index.html (Google revalida; si se quita, se pierde la verificación de Search Console) ni el snippet `gtag.js` (GA `G-X6LMX9VR0Y`). Si hay que reordenar el `<head>`, conservarlos.

## Convenciones técnicas
- **Imágenes externas (rgpub/Sanity CDN):** optimizar con `imgURL(url, w)` → agrega `&w=N&auto=format&q=78` (sirve webp chico). `auto=format` necesita header `Accept` de navegador.
- **`url()` dentro de `var()` en CSS** se resuelve relativo al `.css` (da `css/assets/...`). Para fondos por `--var` setear URL ABSOLUTA desde JS: `new URL(path, location.href).href`.
- **productos.json** se carga con `fetch('productos.json', {cache:'no-cache'})` (revalida ETag, no re-baja todo).
- **Imágenes lazy** (`loading="lazy"`) NO se disparan en el preview automatizado (quedan naturalWidth=0); para arte alto-en-página usar carga eager.
- **Widgets (`show_widget`)** no cargan imágenes de `http://localhost` (mixed-content) → verificar con screenshots del sitio real.

## Diseño
- Brutalist cálido vino/dorado. Tipografía 3 niveles auto-hospedada: `--font-display` Archivo Black (títulos/marca), `--font-body` Space Grotesk (UI), `--font-mono` Space Mono (precios/etiquetas). Vars: `--vino #6E1423 --dorado/--gold-bright --crema --negro --terracota`.
- Logos por juego sin caja blanca (`logoLight` transparente sobre fondo oscuro).

## Memoria extendida
Estado histórico detallado del proyecto en la memoria del usuario: `~/.claude/projects/.../memory/dado-de-oro-tienda.md`.
