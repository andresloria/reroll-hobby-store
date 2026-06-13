# Reroll Hobby Store — Contexto del rediseño web

> Documento de traspaso. Dejalo en la raíz del proyecto del sitio.
> Si lo renombrás a `CLAUDE.md`, tanto Cowork como Claude Code lo leen
> automáticamente al iniciar y arrancan con todo este contexto.

---

## 1. Qué es el proyecto

Sitio web de **Reroll Hobby Store** — tienda TCG en Cartago, Costa Rica.
Pre-apertura (aún no publicada). Se trabaja con Claude Code / Cowork.
El sitio es un `index.html` self-contained (sin dependencias de CDN externas).

**Voz de marca:** experto accesible, competitivo pero comunitario, tono tico
cálido (usteo). Se permite jerga del hobby.

**Diferenciador clave:** la persona detrás tiene 20 años de juego, tops de
torneo y conoce a medio scene competitivo de Cartago. Eso es el activo. NO se
debe diluir por parecerse a un marketplace corporativo.

---

## 2. Sistema de marca

**Palette:**
- `#161616` negro
- `#F4F1EA` crema
- `#C13B26` terracota / rojo (color ancla del logo D20)
- `#6B1F2A` vino
- `#F2C230` amarillo

**Tipografía (sistema de 3 niveles, auto-hospedada en `assets/fonts/` como .woff2):**
- Display / titulares: **Archivo Black**
- Cuerpo, párrafos, botones, UI: **Space Grotesk** (pesos 400 y 700)
- Etiquetas, precios, tags, detalles técnicos: **Space Mono** (pesos 400 y 700)

**Logo:** D20 caricaturesco (rojo terracota, cara amigable).
Estilo general: kit brutalist, bordes definidos.

---

## 3. Decisiones tomadas en la conversación

1. **NO copiar CardNexus al pie de la letra.** CardNexus es un marketplace
   global con miles de listings; su estética de "tienda llena" se ve peor si
   se aplica a un sitio sin inventario. Mantener el ángulo local/humano.

2. **Rediseñar la sección "Elegí tu juego":** reemplazar el logo placeholder
   en recuadro blanco por una grilla de 5 juegos con logo propio sobre fondo
   oscuro temático (estilo selector de CardNexus, pero con la marca de Reroll).

3. **Arreglar el "0 cartas listadas":** ese contador en cero mata la
   credibilidad. Opción ideal: subir producto sellado real (booster boxes que
   ya se revenden). Mínimo: ocultar el contador hasta tener inventario.
   *(Pendiente — no incluido en el prompt de abajo todavía.)*

4. **Sistema tipográfico de 3 niveles** (ver sección 2).

5. **Nombre completo en el header:** hoy solo dice "Reroll". Cambiar a lockup
   "REROLL" (Archivo Black) + "HOBBY STORE" debajo (Space Mono, tracking amplio).

---

## 4. Insumos a preparar antes de correr el prompt

### Fuentes (`assets/fonts/`)
Bajarlas como `.woff2` desde **gwfh.mranftl.com** (google-webfonts-helper):
- Archivo Black → estilo regular (único peso que tiene).
- Space Grotesk → pesos 400 y 700.
- Space Mono → pesos 400 y 700.
- Charset: latin (sumar latin-ext si se quieren tildes/ñ garantizadas).
- En "Copy CSS" elegir "Modern Browsers" para que dé solo .woff2.

### Logos de juegos (`assets/games/`)
5 logos en PNG transparente (o SVG), nombrados: `onepiece.png`, `riftbound.png`,
`pokemon.png`, `magic.png`, `yugioh.png`.

Requisitos para que NO se vean mal:
- Resolución alta (SVG ideal, o PNG ~800px+ de ancho).
- Transparencia real (PNG-24 con alfa, nunca JPEG).
- **Versión clara/blanca** del logo: la grilla es de fondo oscuro, los logos
  negros desaparecen sobre `#161616`.
- Peso visual parejo entre los 5.

Fuentes recomendadas: worldvectorlogo.com, seeklogo.com, brandsoftheworld.com,
Wikimedia Commons, o el press/media kit oficial de cada juego.

Plan B si no se consigue versión clara de algún logo: que cada tile tenga un
chip de color de marca (más claro que el negro) o un backing/glow sutil detrás
del logo, para que hasta un logo oscuro se lea.

---

## 5. Prompt listo para Claude Code / Cowork

```
Quiero rediseñar la sección "Elegí tu juego" del index.html (el selector de juegos TCG)
y de paso ajustar el sistema tipográfico y el nombre de la marca en el header.

PROBLEMA ACTUAL:
La sección "Elegí tu juego" usa mi logo (assets/logo.png) repetido como placeholder
dentro de un recuadro blanco que se ve vacío y sin vida. Quiero reemplazarlo por una
grilla de 5 juegos, cada uno con su propio logo sobre un fondo temático, estilo el
selector de juegos de cardnexus.com.

QUÉ CONSTRUIR (grilla de juegos):
Una grilla responsive de 5 tiles, uno por juego. Orden de prioridad (el primero es el
más destacado, es mi foco de lanzamiento):
  1. One Piece TCG
  2. Riftbound
  3. Pokémon
  4. Magic: The Gathering
  5. Yu-Gi-Oh!

Cada tile debe tener:
  - El logo del juego, GRANDE y centrado (no en una cajita blanca chiquita).
    Los logos van en assets/games/ (onepiece.png, riftbound.png, pokemon.png,
    magic.png, yugioh.png). Si el archivo todavía no existe, dejá un placeholder
    con el nombre del juego en texto grande con Archivo Black, para reemplazar después.
  - Fondo oscuro/temático con un color de acento por juego (no blanco). Gradiente sutil
    sobre el negro de mi marca para que el logo "encienda".
  - El nombre del juego debajo del logo.
  - Todo el tile clickeable: lleva al catálogo filtrado por ese juego. Conectalo al
    mecanismo de filtro que ya existe en #catalogo; si usa un parámetro o data-attribute,
    usá el mismo.
  - Hover: el tile sube un poco (translateY) con glow/sombra en su color de acento.
    Transición suave (~200ms). Que se sienta premium.
  - Accesibilidad: alt en imágenes, focus visible por teclado, role de link.

LAYOUT:
  - Desktop: fila de 5, o 3 arriba + 2 abajo centrados. Tiles grandes.
  - Tablet: 2-3 columnas. Móvil: 2 columnas. Buen padding y gaps.

SISTEMA TIPOGRÁFICO (aplicar en todo el sitio, no solo en esta sección):
Quiero un sistema de 3 niveles, con las fuentes auto-hospedadas (NADA de CDN externo,
todo self-contained):
  - Titulares / display: Archivo Black.
  - Cuerpo, párrafos, botones, UI: Space Grotesk (reemplaza el uso actual de Space Mono
    en textos largos, que es monoespaciada y cansa la vista). Pesos 400 y 700.
  - Etiquetas, precios, tags, badges y detalles técnicos: Space Mono (mantener como
    acento). Pesos 400 y 700.
  Las fuentes ya están en assets/fonts/ como archivos .woff2. Leé los nombres reales
  de los archivos que hay en esa carpeta y generá los @font-face usando esos nombres
  exactos (NO inventes nombres ni asumas el formato del nombre). Definí el sistema con
  variables CSS (--font-display, --font-body, --font-mono) y aplicalas de forma
  consistente en todo el sitio.

NOMBRE DE LA MARCA EN EL HEADER:
Hoy el nav solo muestra "Reroll". Cambialo por el nombre completo como un lockup:
  - "REROLL" grande en Archivo Black.
  - "HOBBY STORE" debajo, más chico, en Space Mono con letter-spacing amplio (tracking).
  - Al lado del logo D20 existente. Mantené el link a #top.
  - Revisá que el footer y los meta-tags ya usen "Reroll Hobby Store" (si no, corregilos).

ESTILO (consistencia con mi kit brutalist):
  - Fondo de la sección "Elegí tu juego": mi negro #161616 (para que resalten los logos).
  - Palette: #161616 (negro), #F4F1EA (crema), #C13B26 (terracota/rojo),
    #6B1F2A (vino), #F2C230 (amarillo).
  - Bordes definidos / look brutalist consistente con el resto del sitio.
  - Quitá el recuadro blanco placeholder y el logo.png repetido de la sección de juegos.

IMPORTANTE:
  - Todo self-contained, sin dependencias de CDN externas.
  - No toques otras secciones salvo el header (nombre) y la carga global de fuentes.
  - Mostrame el antes/después de lo que cambiaste.
```

---

## 6. Pendientes / próximos pasos

- [ ] Bajar las 3 fuentes a `assets/fonts/`.
- [ ] Conseguir los 5 logos de juegos (versión clara) en `assets/games/`.
- [ ] Correr el prompt de la sección 5.
- [ ] Arreglar el "0 cartas listadas" (ocultar o poblar con sellado real).
- [ ] Agregar sección "Quién está detrás" (foto, tops, 20 años) — es el mayor
      diferenciador y hoy no existe en el sitio.
- [ ] Reemplazar emojis-ícono (🃏 📦 🏰) por íconos/ilustraciones del kit.
- [ ] Reducir o quitar el bloque "Juegos de mesa Próximamente" (ocupa mucho
      espacio para algo que aún no se vende).
