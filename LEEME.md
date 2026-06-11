# 🎲 Reroll Hobby Shop — Tienda TCG

Tienda web (estilo TCGPlayer) para vender **singles y producto sellado** por web,
Instagram, Facebook, TikTok y WhatsApp. Cartago, CR. Paleta vino · negro · blanco · dorado,
con el logo del d20 sonriente animado.

## 🌐 En vivo
- Tienda: **https://reroll-hobby-shop.netlify.app**
- Panel admin: **https://reroll-hobby-shop.netlify.app/admin.html** (clave: `reroll`)

## Verlo en local
Doble clic en `index.html`, o para que funcione el catálogo y el panel:
```powershell
python -m http.server 5500
```
Luego http://localhost:5500

## 🛠️ Panel de administración (admin.html)
Tu página privada para manejar el inventario. Clave por defecto `reroll`
(cambiala en `admin.html`, variable `CLAVE`).

Flujo:
1. Entrá a `/admin.html` con la clave.
2. Agregá cartas: una por una (con su **foto**, se optimiza sola a 600px) **o**
   importá un **Excel/CSV** (columnas: `nombre, categoria, precio, estado, etiqueta`).
   Hay un botón **Descargar plantilla CSV**.
3. Tocá **Descargar productos.json**.
4. Poné ese `productos.json` en la carpeta del sitio (junto a `index.html`) y volvé a
   publicar — o pasámelo y yo publico. La tienda lo detecta solo y muestra tu inventario.

> El panel guarda tu trabajo en el navegador (localStorage). Para seguir editando otro día,
> volvé a entrar; o cargá un `productos.json` existente con "Cargar productos.json".

## Personalizar
- **WhatsApp**: en `js/app.js` (arriba), `WHATSAPP = "50688888888"` → tu número real
  (código de país, sin `+` ni espacios). Pendiente que lo envíes.
- **Redes**: enlaces de Instagram/Facebook/TikTok en el footer de `index.html`.
- **Clave del panel**: `admin.html`, variable `CLAVE`.

## Publicar cambios (deploy)
El sitio está en Netlify (cuenta del usuario). Para republicar: arrastrar la carpeta a
https://app.netlify.com/projects/reroll-hobby-shop (Deploys → arrastrar), o pasarle los
archivos a Claude para subir por API.

## Estructura
```
index.html       → la tienda
admin.html       → panel privado para cargar inventario
productos.json   → (lo genera el panel) tu inventario real; si no existe, usa ejemplos
css/styles.css   → colores, animaciones, logo animado
js/app.js        → catálogo, búsqueda, carrito, WhatsApp
assets/          → logo.png y brand_board.png
```
