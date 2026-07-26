# Cómo agregar una expansión nueva — Reroll Hobby Store

Proceso probado con **Vendetta** (Riftbound, 227 singles, 2026-07-24). Seguir en
orden: cada paso depende del anterior. Detalle técnico de cada script en
[CLAUDE.md](CLAUDE.md) · bitácora en [SESSIONS.md](SESSIONS.md).

> **Regla base:** las cartas nuevas entran a **stock 0**. La tienda es espejo de
> lo que Andrés tiene FÍSICO — él sube el stock desde el panel a medida que abre
> sobres. Nada se publica "disponible" sin que exista de verdad.

---

## 0. Antes de empezar — ¿ya salió en TCGplayer?

Todo el pipeline se alimenta de TCGplayer (vía TCGCSV). Si el set no está ahí
todavía, no se puede agregar aún.

```bash
python -c "import json,urllib.request as u; d=json.loads(u.urlopen(u.Request('https://tcgcsv.com/tcgplayer/89/groups',headers={'User-Agent':'reroll/1.0'})).read()); [print(g['groupId'], g['name'], (g.get('publishedOn') or '')[:10]) for g in d['results']]"
```

Categorías TCGCSV: **Riftbound 89 · One Piece 68 · Magic 1 · Yu-Gi-Oh 2 · Pokémon 3**.

Anotar el `groupId` del set nuevo. Si aparece, seguir.

---

## 1. Regenerar el catálogo maestro (el buscador del panel)

El cache guarda los sets viejos, así que **hay que limpiarlo** o el set nuevo no
aparece:

```bash
rm -f catalogo/_cache/riftbound_*
python make_catalogo.py riftbound
```

Genera `catalogo/riftbound.json` (liviano, lo carga el panel) y
`catalogo/riftbound_rich.json` (efecto + atributos para las fichas).

**Verificar** que el set nuevo salga en la lista de sets que imprime el script.

### Imágenes: Riot vs TCGplayer
- Los sets con CSV en `Riftbound_Cards/<Set>/` usan las **imágenes de Riot**
  (cruce por número+set) — así el panel reconoce por `img` las cartas que ya
  están en la base.
- Un set recién salido **no tiene CSV de Riot todavía** → cae automáticamente a
  la imagen de TCGplayer. Funciona igual (Vendetta se hizo así). Si después
  aparece el CSV de Riot, se puede re-correr, pero **ojo: cambiarían los slugs**
  de las fichas ya publicadas.

---

## 2. Agregar los singles a `productos.json` (stock 0)

**Siempre con Python y con backup** — nunca a mano ni con merge de git.

```python
# scripts/agregar_expansion.py (o inline). SET y JUEGO según el caso.
import json, shutil
SET, CATALOGO, CAT = "Vendetta", "catalogo/riftbound.json", "Riftbound"

shutil.copy("productos.json", "productos_backup_expansion.json")   # backup SIEMPRE
prod = json.load(open("productos.json", encoding="utf-8"))
cat  = json.load(open(CATALOGO, encoding="utf-8"))

nuevos = [c for c in cat if c.get("set") == SET and c.get("type") == "single" and c.get("img")]
ya     = {p.get("img") for p in prod}          # dedup por imagen
nid    = max(p.get("id", 0) for p in prod) + 1

add = 0
for c in nuevos:
    if c["img"] in ya:                          # ya existe -> NO duplicar
        continue
    e = {"id": nid, "name": c["name"], "cat": CAT, "type": "single", "set": SET,
         "price": c["price"], "cond": "Near Mint", "stock": 0, "img": c["img"]}
    if c.get("foil") is not None:               # si TCGplayer da precio foil
        e["foil"] = c["foil"]
        e["stockf"] = 0                         # ⚠️ OBLIGATORIO: si no, foil fantasma
    prod.append(e); nid += 1; add += 1

json.dump(prod, open("productos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open("productos.json", "a", encoding="utf-8").write("\n")
print("agregados:", add)
```

**Reglas que NO se negocian:**
- `stock: 0` — Andrés sube el stock desde el panel.
- Si hay `foil`, **siempre** `stockf: 0`. Sin `stockf` el foil quedaría comprable
  sin existir (ver §4).
- Dedup **por `img`**, no por nombre (hay cartas con el mismo nombre).
- `json.dump(..., ensure_ascii=False, indent=2)` + salto de línea final.

---

## 3. Generar las fichas de detalle

```bash
python make_cartas.py
```

Crea `/carta/<slug>.html` de cada carta + `cartas.json` + `sitemap.xml`.
Debe imprimir el total incluyendo las nuevas.

**Regla de oro:** toda carta abre su detalle con **descripción/efecto + atributos**.
Para Riftbound el efecto sale del campo `Description` de TCGplayer.

---

## 4. Chequeo de integridad (SIEMPRE, antes de push)

```python
import json
d = json.load(open("productos.json", encoding="utf-8"))
idx = json.load(open("cartas.json", encoding="utf-8"))
n = lambda p, k: p.get(k) not in (None, "", "null")

print("total:", len(d))
print("sin ficha:",   len([p for p in d if str(p["id"]) not in idx]))
print("foil fantasma:", len([p for p in d if n(p,"foil") and p.get("stockf") in (None,"")]))
print("foil<=normal:",  len([p for p in d if n(p,"foil") and int(p["foil"]) <= int(p["price"])]))
print("stock negativo:", len([p for p in d if n(p,"stock") and int(p["stock"]) < 0]))
```

**Los cuatro contadores tienen que dar 0.** Si `foil<=normal` > 0 → subir el foil
a `precio + 100` (regla del proyecto).

Además, en el preview (`juego.html`), con la consola:
- `PRODUCTS.filter(p=>p.set==='<SET>').length` → todas las nuevas.
- El set aparece en el **filtro de Expansión** con su conteo.
- Buscar una carta del set → sale con tag **Agotado**.
- Abrir una ficha → efecto, atributos e imagen cargan.

---

## 5. Precios

### ⚠️ Set en presale: casi todo cae al piso de ₡100

`make_catalogo.py` solo lee `marketPrice`, y **un set recién anunciado todavía no
tiene mercado** (nadie ha vendido) → esas cartas caen al piso de ₡100, incluidas
las Epic y Rare caras. Pasó con Vendetta: **178 de 228 en ₡100**.

**Siempre revisar cuántas quedaron en el piso:**

```python
import json
v = [p for p in json.load(open("productos.json", encoding="utf-8")) if p.get("set") == "<SET>"]
print("en 100:", len([p for p in v if p["price"] == 100]), "de", len(v))
```

Si son muchas, traer los precios **en vivo** de TCGplayer (no del snapshot de
TCGCSV) — el `productId` sale de la URL de la imagen (`/product/<pid>_400w.jpg`):

```
https://mpapi.tcgplayer.com/v2/product/<pid>/pricepoints   (User-Agent de navegador)
```

Devuelve por acabado `marketPrice` y `listedMedianPrice`. Prioridad:
`marketPrice` → `listedMedianPrice` (la mediana de listados, que es lo que
TCGplayer enseña en presale) → `midPrice` de TCGCSV. Después `round_crc()`.

**Antes de escribir, comprobar que ninguna carta tenga precio Normal Y Foil a la
vez** — si no, se le pondría a la carta normal el precio de la foil. En Riftbound
las Common/Uncommon son solo normal y las Rare/Epic son foil-only (su `price`
ES el precio foil, sin campo `foil`), así que nunca se cruzan.

Las que **no tengan ni un listado** quedan en ₡100: anotarlas y avisarle a Andrés
que les ponga precio a mano antes de subirles stock.

### Mantenimiento normal

Después se mantienen con la rutina de siempre:

```bash
python check_precios.py                    # solo reporta
python check_precios.py --aplicar-subidas  # aplica SOLO las subidas
```

Andrés decide **solo subidas** (no bajar precios). Tras aplicar, **volver a
correr el chequeo de §4**: subir normales suele dejar algún `foil <= normal`.

---

## 6. Commit + push (con OK de Andrés)

```bash
python make_cartas.py     # si algo cambió después
git add -A
git commit -m "…"         # terminar con el Co-Authored-By del proyecto
git push origin main
```

> **Push SOLO con OK explícito de Andrés** — dispara deploy a producción.
> Si el remoto avanzó (Andrés publicó desde el panel): `git fetch && git rebase origin/main`.

---

## 7. Qué hace Andrés después (lo que sí depende de él)

1. Abre sobres del set nuevo.
2. Panel → **Agregar del catálogo** → filtro de expansión = el set nuevo.
3. Le da `+` a cada carta según las unidades que tenga (y el stepper ✨ FOIL si
   tiene foils).
4. **Publicar** desde la barra fija.

Ahí la carta pasa a stock > 0 y aparece comprable en la tienda.

⚠️ Las cartas que Andrés **agrega por el panel** (no por este proceso) **no
generan ficha solas** — el panel no corre Python. Tras un publish suyo hay que
correr `python make_cartas.py` + push.

---

## Cómo se ven las cartas en stock 0 (decidido con Andrés, 2026-07-24)

| El cliente… | Ve |
|---|---|
| Navega el catálogo sin pedir nada | **Solo lo comprable** (conserva "stock 0 no aparece") |
| **Busca** una carta | Todas, agotadas marcadas «Agotado» (disponibles primero) |
| **Filtra** por expansión/rareza/etc. | Todas las que calcen, agotadas marcadas |
| Abre el dropdown de un filtro | Conteos **incluyendo** agotadas (si no, un set entero sin stock desaparecería) |

Implementado con `userNarrowed()` en `js/app.js`.

---

## Checklist rápido

- [ ] El set existe en TCGCSV (§0)
- [ ] `rm catalogo/_cache/<juego>_*` + `python make_catalogo.py <juego>` (§1)
- [ ] Backup + agregar a `productos.json` con **stock 0** y `stockf: 0` si hay foil (§2)
- [ ] `python make_cartas.py` (§3)
- [ ] Integridad: sin ficha / fantasmas / foil≤normal / stock negativo = **0** (§4)
- [ ] Verificado en preview: filtro, buscador, ficha (§4)
- [ ] Precios al día — **contar cuántas quedaron en ₡100**; si el set está en
      presale, traerlos en vivo de `mpapi` (§5)
- [ ] Cache-busting `?v=N` si se tocó `css/styles.css` o `js/app.js` (index **Y** juego)
- [ ] Commit + push **con OK de Andrés** (§6)
- [ ] Avisarle que ya puede subir stock desde el panel (§7)
