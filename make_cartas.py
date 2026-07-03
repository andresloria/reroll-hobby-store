# -*- coding: utf-8 -*-
"""
make_cartas.py — Genera las páginas de detalle por carta (opción B, estático).

Qué hace:
  1. Lee productos.json (fuente de verdad del inventario; NO se modifica).
  2. Cruza con los CSV ricos de Riftbound_Cards/<Set>/<Set>_<CODE>_cards.csv
     por image_url (match exacto) para sumar: número de coleccionista, tipo,
     rareza, dominio (color), energía (costo), power, might, tags (subtipos),
     ilustrador y ability_text (efecto, en inglés tal cual la carta).
  3. Escribe una página estática /carta/<slug>.html por producto, con OG +
     JSON-LD reales (para que WhatsApp/Google vean imagen, precio y stock).
  4. Escribe cartas.json: índice id -> {slug, ...campos ricos} que usa el grid
     (js/app.js) para enlazar cada carta a su detalle y para "relacionadas".

Re-correr cada vez que cambia el inventario:  python make_cartas.py
(mismo flujo que make_art.py / productos.json — los HTML son DERIVADOS).
"""
import csv, json, glob, html, re, os, unicodedata

ROOT      = os.path.dirname(os.path.abspath(__file__))
PROD_JSON = os.path.join(ROOT, "productos.json")
CARDS_GLOB= os.path.join(ROOT, "Riftbound_Cards", "*", "*_cards.csv")
OUT_DIR   = os.path.join(ROOT, "carta")
INDEX_OUT = os.path.join(ROOT, "cartas.json")

# --- Config espejada de js/app.js (mantener en sync) ---
WHATSAPP    = "50687807813"
SITE        = "https://rerollhobbystore.com"
ASSET_V     = 47   # debe coincidir con el ?v= de styles.css en index/juego
CARTA_JS_V  = 2

# Colores por dominio de Riftbound (chips del efecto y del atributo "Dominio")
DOMAIN_HEX = {
    "fury":  "#C13B26", "calm":  "#4FA86B", "mind":  "#4A86C9",
    "body":  "#C98A3E", "chaos": "#9B5BB0", "order": "#D9C56A",
}

# ----------------------------------------------------------------------------
def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "carta"

def fmt_precio(n):
    try: n = int(round(float(n)))
    except (TypeError, ValueError): n = 0
    return "₡" + format(n, ",d").replace(",", ".")   # es-CR: 85.000

def img_opt(url, w):
    """Espeja imgURL() de app.js: pide webp del CDN de Riot al ancho justo."""
    if not url or "cmsassets.rgpub.io" not in url: return url
    if re.search(r"[?&](w|auto)=", url): return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}w={w}&auto=format&q=78"

def esc(s): return html.escape(str(s or ""), quote=True)

# --- Render del efecto: tokens :rb_xxx: -> chips; [Keywords] -> resaltado -----
def chip(bg, border, color, label, dot=None):
    dot_html = (f'<span class="fx-dot" style="background:{dot}"></span>' if dot else "")
    return (f'<span class="fx-chip" style="background:{bg};border-color:{border};color:{color}">'
            f'{dot_html}{esc(label)}</span>')

def render_token(tok):
    m = re.match(r":rb_energy_(\d+):", tok)
    if m:
        return (f'<span class="fx-energy" aria-label="Energía {m.group(1)}">{m.group(1)}</span>')
    if tok == ":rb_might:":
        return chip("rgba(201,162,75,.16)", "var(--gold)", "var(--gold-bright)", "Might")
    if tok == ":rb_exhaust:":
        return chip("rgba(255,255,255,.06)", "var(--line)", "var(--cream)", "↻ Exhaust")
    if tok == ":rb_rune_rainbow:":
        return ('<span class="fx-chip fx-chip--rainbow" aria-label="Runa de cualquier dominio">'
                '<span class="fx-dot fx-dot--rainbow"></span>Any</span>')
    m = re.match(r":rb_rune_(\w+):", tok)
    if m:
        d = m.group(1); hexc = DOMAIN_HEX.get(d, "#C9A24B")
        return chip("rgba(255,255,255,.05)", hexc, "var(--cream)", d.capitalize(), dot=hexc)
    return esc(tok)   # token desconocido: lo dejamos legible

def render_ability(text):
    if not text: return ""
    parts = re.split(r"(:rb_[a-z0-9_]+:)", text)
    out = []
    for part in parts:
        if part.startswith(":rb_") and part.endswith(":"):
            out.append(render_token(part))
        else:
            safe = esc(part)
            # Resalta keywords entre corchetes: [Accelerate], [Action], [Hidden]…
            safe = re.sub(r"\[([^\]]+)\]", r'<b class="fx-kw">[\1]</b>', safe)
            out.append(safe)
    return "".join(out)

# --- Atributos: etiqueta + valor, ocultando vacíos -------------------------
def attr_rows(rich, prod):
    rows = []
    def add(label, val, html_val=None):
        if val not in (None, "", "—"):
            rows.append((label, html_val if html_val is not None else esc(val)))
    add("Tipo", rich.get("type"))
    add("Rareza", rich.get("rarity"))
    dom = (rich.get("domains") or "").strip()
    if dom:
        chips = []
        for d in re.split(r"\s*\|\s*", dom):
            hexc = DOMAIN_HEX.get(d.lower(), "#C9A24B")
            chips.append(f'<span class="dom"><span class="dom__dot" style="background:{hexc}"></span>{esc(d)}</span>')
        add("Dominio", dom, " ".join(chips))
    add("Energía", rich.get("energy"))
    add("Power", rich.get("power"))
    add("Might", rich.get("might"))
    tags = (rich.get("tags") or "").strip()
    if tags: add("Subtipos", tags)
    num = rich.get("collector_number")
    if num:
        total = ""
        code = rich.get("code") or ""
        mt = re.search(r"/(\d+)", code)
        if mt: total = " / " + mt.group(1)
        add("N.º", f"{num}{total}")
    add("Condición", prod.get("cond"))
    add("Ilustrador", rich.get("illustrator"))
    return rows

# ----------------------------------------------------------------------------
def load_rich():
    rich = {}
    files = glob.glob(CARDS_GLOB)
    for fp in files:
        with open(fp, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                u = (row.get("image_url") or "").strip()
                if u: rich[u] = row
    return rich

def build():
    products = json.load(open(PROD_JSON, encoding="utf-8"))
    rich_by_img = load_rich()

    # --- 1ra pasada: calcular slug único por producto ---
    used = {}
    index = {}
    for p in products:
        img = (p.get("img") or "").strip()
        r = rich_by_img.get(img, {})
        setcode = (r.get("set_id") or "").lower()
        num = r.get("collector_number") or ""
        base_parts = [slugify(p.get("name", "carta"))]
        if setcode: base_parts.append(setcode)
        if num: base_parts.append(str(num).zfill(3))
        slug = "-".join(base_parts)
        if slug in used:                       # colisión (misma carta, otra condición)
            used[slug] += 1
            slug = f"{slug}-{used[slug]}"
        else:
            used[slug] = 1
        p["_slug"] = slug
        p["_rich"] = r
        index[str(p["id"])] = {
            "slug": slug,
            "number": num,
            "code": r.get("code", ""),
            "type": r.get("type", ""),
            "rarity": r.get("rarity", ""),
            "domains": r.get("domains", ""),
        }

    json.dump(index, open(INDEX_OUT, "w", encoding="utf-8"),
              ensure_ascii=False, indent=0)

    os.makedirs(OUT_DIR, exist_ok=True)
    # limpiar HTML viejos para no dejar slugs huérfanos
    for old in glob.glob(os.path.join(OUT_DIR, "*.html")):
        os.remove(old)

    by_set = {}
    for p in products:
        by_set.setdefault(p.get("set", ""), []).append(p)

    n = 0
    for p in products:
        write_page(p, by_set)
        n += 1
    write_sitemap(products)
    print(f"OK · {n} páginas en carta/ · cartas.json con {len(index)} entradas · sitemap.xml")

def write_sitemap(products):
    """Genera sitemap.xml: home + juegos con inventario + cada carta. SEO-friendly:
       NO incluye páginas de juego vacías (thin content)."""
    from urllib.parse import quote
    from datetime import date
    today = date.today().isoformat()
    games = sorted({p.get("cat", "").strip() for p in products if p.get("cat", "").strip()})

    rows = [(f"{SITE}/", "1.0")]
    rows += [(f"{SITE}/juego.html?g={quote(g)}", "0.8") for g in games]
    rows += [(f"{SITE}/carta/{p['_slug']}.html", "0.6") for p in products]

    body = "\n".join(
        f"  <url><loc>{esc(loc)}</loc><lastmod>{today}</lastmod>"
        f"<priority>{pri}</priority></url>"
        for loc, pri in rows
    )
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           f"{body}\n</urlset>\n")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)

def stock_val(p):
    s = p.get("stock")
    if s in (None, "", "null"): return None
    try: return int(s)
    except (TypeError, ValueError): return None

def write_page(p, by_set):
    r = p["_rich"]; slug = p["_slug"]
    name = p.get("name", "Carta"); setn = p.get("set", "")
    cat = p.get("cat", "Riftbound"); cond = p.get("cond", "")
    price = p.get("price", 0); img = p.get("img", "")
    st = stock_val(p)
    sold_out = st is not None and st <= 0
    num = r.get("collector_number", "")
    numtxt = f" ({num})" if num else ""
    code = r.get("code", "")

    # --- WhatsApp: comprar / avísame ---
    buy_msg = (f"¡Hola Reroll! Me interesa esta carta: {name} — {setn}{numtxt}, "
               f"condición {cond}, precio {fmt_precio(price)}. ¿Está disponible?")
    notify_msg = (f"¡Hola Reroll! Avísenme cuando llegue: {name} — {setn}{numtxt}. ¡Gracias!")
    from urllib.parse import quote
    buy_url    = f"https://wa.me/{WHATSAPP}?text={quote(buy_msg)}"
    notify_url = f"https://wa.me/{WHATSAPP}?text={quote(notify_msg)}"

    # --- variante FOIL (solo commons/uncommons con precio foil) ---
    foil_raw = p.get("foil")
    try: foil = int(foil_raw) if foil_raw not in (None, "", "null") else None
    except (TypeError, ValueError): foil = None
    if foil is not None:
        buy_msg_foil = (f"¡Hola Reroll! Me interesa esta carta en FOIL: {name} — {setn}{numtxt}, "
                        f"condición {cond}, precio {fmt_precio(foil)}. ¿Está disponible?")
        buy_url_foil = f"https://wa.me/{WHATSAPP}?text={quote(buy_msg_foil)}"
        foil_attr   = f' data-normal="{esc(fmt_precio(price))}" data-foil="{esc(fmt_precio(foil))}"'
        foil_toggle = ('<div class="cd-ftoggle" id="cdFtoggle" role="group" aria-label="Acabado">'
                       '<button type="button" class="cd-ftoggle__btn is-on" data-v="normal">Normal</button>'
                       '<button type="button" class="cd-ftoggle__btn" data-v="foil">Foil ✨</button></div>')
    else:
        buy_url_foil = ""; foil_attr = ""; foil_toggle = ""

    # --- stock badge ---
    if st is None:
        stock_badge = '<span class="cd-stock cd-stock--ok">Disponible</span>'
    elif sold_out:
        stock_badge = '<span class="cd-stock cd-stock--out">Agotado</span>'
    elif st <= 3:
        u = "unidad" if st == 1 else "unidades"
        stock_badge = f'<span class="cd-stock cd-stock--low">¡Solo {st} {u}!</span>'
    else:
        stock_badge = f'<span class="cd-stock cd-stock--ok">{st} disponibles</span>'

    # --- efecto ---
    ability = (r.get("ability_text") or "").strip()
    effect_html = ""
    if ability:
        effect_html = (
            '<div class="cd-effect">'
            '<div class="cd-effect__h"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" '
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" '
            'aria-hidden="true"><path d="M12 3l1.9 4.6L19 9l-4.6 1.9L12 16l-1.9-5.1L5 9l5.1-1.4z"/></svg>'
            'Efecto</div>'
            f'<p class="cd-effect__txt">{render_ability(ability)}</p></div>'
        )

    # --- atributos ---
    rows = attr_rows(r, p)
    attrs_html = "".join(
        f'<div class="cd-attr"><div class="cd-attr__k">{esc(k)}</div>'
        f'<div class="cd-attr__v">{v}</div></div>' for k, v in rows
    )

    # --- botón principal / agotado ---
    if sold_out:
        action_html = (
            f'<a class="cd-btn cd-btn--notify" href="{esc(notify_url)}" target="_blank" rel="noopener">'
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'
            '</svg>Avísame cuando llegue</a>'
        )
    else:
        action_html = (
            f'<a class="cd-btn cd-btn--wa" id="cdBuy" href="{esc(buy_url)}" target="_blank" rel="noopener">'
            '<svg viewBox="0 0 32 32" width="21" height="21" aria-hidden="true"><path fill="currentColor" '
            'd="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 '
            '12-12S22.6 3 16 3zm5.4 14.8c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1'
            '-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0'
            '-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 '
            '3.1c.1.2 2.1 3.2 5 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1'
            '-.2-.3-.2-.6-.4z"/></svg>Comprar por WhatsApp</a>'
        )

    # --- relacionadas (mismo set, disponibles, distintas) ---
    rel = [q for q in by_set.get(setn, [])
           if q is not p and (stock_val(q) is None or stock_val(q) > 0)][:6]
    rel_html = ""
    if rel:
        cards = ""
        for q in rel:
            qimg = img_opt(q.get("img", ""), 240)
            cards += (
                f'<a class="cd-rel__card" href="{esc(q["_slug"])}.html">'
                f'<div class="cd-rel__img"><img src="{esc(qimg)}" alt="{esc(q.get("name",""))}" loading="lazy"></div>'
                f'<div class="cd-rel__body"><span class="cd-rel__name">{esc(q.get("name",""))}</span>'
                f'<span class="cd-rel__price">{fmt_precio(q.get("price",0))}</span></div></a>'
            )
        rel_html = (
            '<section class="cd-section"><h2 class="cd-h2">Más de ' + esc(setn) + '</h2>'
            f'<div class="cd-rel">{cards}</div></section>'
        )

    # --- meta / OG / JSON-LD ---
    canonical = f"{SITE}/carta/{slug}.html"
    og_img = img_opt(img, 744) if img else f"{SITE}/assets/og-image.jpg"
    desc_bits = [cat]
    if setn: desc_bits.append(setn)
    if r.get("rarity"): desc_bits.append(r["rarity"])
    if cond: desc_bits.append(cond)
    meta_desc = (f"{name} — {' · '.join(desc_bits)}. {fmt_precio(price)} en Reroll Hobby Store, "
                 f"tu tienda TCG en Cartago, Costa Rica.")
    page_title = f"{name}{numtxt} — {setn} · {cat} | Reroll Hobby Store"

    availability = "https://schema.org/OutOfStock" if sold_out else "https://schema.org/InStock"
    jsonld = {
        "@context": "https://schema.org", "@type": "Product",
        "name": name, "image": og_img, "category": f"{cat} · {setn}",
        "sku": code or str(p.get("id", "")),
        "brand": {"@type": "Brand", "name": cat},
        "description": (ability or meta_desc)[:300],
        "offers": {
            "@type": "Offer", "url": canonical, "priceCurrency": "CRC",
            "price": str(int(round(float(price or 0)))),
            "availability": availability,
            "itemCondition": "https://schema.org/UsedCondition",
            "seller": {"@type": "Store", "name": "Reroll Hobby Store"},
        },
    }
    jsonld_html = json.dumps(jsonld, ensure_ascii=False)

    breadcrumb_jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Categorías", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": cat, "item": f"{SITE}/juego.html?g={quote(cat)}"},
            {"@type": "ListItem", "position": 3, "name": setn, "item": f"{SITE}/juego.html?g={quote(cat)}"},
            {"@type": "ListItem", "position": 4, "name": name, "item": canonical},
        ],
    }, ensure_ascii=False)

    eyebrow = f"{cat} · {setn}" if setn else cat
    sub = setn + (f" · {code}" if code else (numtxt if num else ""))

    page = TEMPLATE.format(
        title=esc(page_title), desc=esc(meta_desc), canonical=esc(canonical),
        og_img=esc(og_img), v=ASSET_V, jsv=CARTA_JS_V,
        jsonld=jsonld_html, breadcrumb_jsonld=breadcrumb_jsonld,
        cat=esc(cat), cat_q=quote(cat), setn=esc(setn), name=esc(name),
        eyebrow=esc(eyebrow), sub=esc(sub),
        img_big=esc(img_opt(img, 600)), img_full=esc(img_opt(img, 744)),
        price=esc(fmt_precio(price)), cond=esc(cond),
        stock_badge=stock_badge, cond_pill=(f'<span class="cd-cond">{esc(cond)}</span>' if cond else ""),
        action_html=action_html, effect_html=effect_html,
        attrs_html=attrs_html, rel_html=rel_html, pid=esc(p.get("id", "")),
        slug=esc(slug), buy_url=esc(buy_url), notify_url=esc(notify_url),
        buy_url_foil=esc(buy_url_foil), foil_attr=foil_attr, foil_toggle=foil_toggle,
    )
    with open(os.path.join(OUT_DIR, slug + ".html"), "w", encoding="utf-8") as f:
        f.write(page)

# ----------------------------------------------------------------------------
TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Google Analytics (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X6LMX9VR0Y"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-X6LMX9VR0Y');
</script>

<title>{title}</title>
<meta name="description" content="{desc}" />
<meta name="theme-color" content="#6E1423" />
<link rel="canonical" href="{canonical}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Reroll Hobby Store" />
<meta property="og:locale" content="es_CR" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:url" content="{canonical}" />
<meta property="og:image" content="{og_img}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{og_img}" />
<link rel="preload" href="../assets/fonts/archivo-black-v23-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="../assets/fonts/space-grotesk-v22-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="../css/styles.css?v={v}" />
<link rel="icon" type="image/png" href="../assets/favicon.png?v={v}" />
<script type="application/ld+json">{jsonld}</script>
<script type="application/ld+json">{breadcrumb_jsonld}</script>
</head>
<body class="cd-page" data-pid="{pid}" data-slug="{slug}">
<a class="skip-link" href="#cd-main">Saltar al contenido</a>

<header class="nav" id="nav">
  <div class="nav__inner">
    <a class="brand" href="../index.html" aria-label="Reroll Hobby Store — inicio">
      <img class="brand__logo" src="../assets/logo.webp" alt="" width="42" height="42" />
      <span class="brand__lockup"><span class="brand__name">REROLL</span><span class="brand__sub">HOBBY STORE</span></span>
    </a>
    <nav class="nav__links" aria-label="Principal">
      <a href="../index.html#juegos">Juegos</a>
      <a href="../index.html#productos">Singles &amp; Sellado</a>
      <a href="../index.html#como">Cómo comprar</a>
      <a href="../index.html#contacto">Contacto</a>
    </nav>
    <div class="nav__actions">
      <a href="../juego.html?g={cat_q}" class="btn btn--gold">Ver catálogo</a>
    </div>
  </div>
</header>

<main id="cd-main" class="cd-wrap">
  <nav class="cd-crumb" aria-label="Migas de pan">
    <a href="../index.html#juegos">Categorías</a><span aria-hidden="true">›</span>
    <a href="../juego.html?g={cat_q}">{cat}</a><span aria-hidden="true">›</span>
    <a href="../juego.html?g={cat_q}">{setn}</a><span aria-hidden="true">›</span>
    <span aria-current="page">{name}</span>
  </nav>

  <div class="cd-top">
    <div class="cd-media">
      <button class="cd-img" id="cdImg" type="button" aria-label="Ampliar imagen de {name}">
        <img src="{img_big}" alt="{name}" width="744" height="1039" data-full="{img_full}" />
        <span class="cd-img__hint"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> Ampliar</span>
      </button>
    </div>

    <div class="cd-buy">
      <span class="cd-eyebrow">{eyebrow}</span>
      <h1 class="cd-title">{name}</h1>
      <p class="cd-sub">{sub}</p>
      {effect_html}
      <div class="cd-pricerow">
        <span class="cd-price" id="cdPrice"{foil_attr}>{price}</span>
        <span id="cdStock">{stock_badge}</span>
        {cond_pill}
      </div>
      {foil_toggle}
      <div id="cdAction" data-buy="{buy_url}" data-buy-foil="{buy_url_foil}" data-notify="{notify_url}">{action_html}</div>
      <p class="cd-note">Coordinamos pago y entrega por WhatsApp. Sin cargos automáticos.</p>
      <div class="cd-ship">
        <div class="cd-ship__row"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg><span><b>SINPE Móvil</b> — pagás y enviás el comprobante por WhatsApp.</span></div>
        <div class="cd-ship__row"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg><span><b>Correos de Costa Rica</b> — envío nacional; costo según destino. Retiro en Cartago.</span></div>
      </div>
    </div>
  </div>

  <section class="cd-section">
    <h2 class="cd-h2">Detalles de la carta</h2>
    <div class="cd-attrs">{attrs_html}</div>
  </section>

  {rel_html}
</main>

<footer class="footer" id="contacto">
  <div class="cd-foot">
    <div class="cd-foot__brand">
      <span class="brand__name">Re<span class="brand__accent">roll</span> Hobby Store</span>
      <p>Tu tienda TCG en Cartago, CR. Singles, sellado y criterio para ganar.</p>
    </div>
    <div class="cd-social">
      <span class="cd-social__label">Seguinos y escribinos</span>
      <div class="cd-social__links">
        <a class="cd-social__btn" href="https://instagram.com/rerollhobbystore" target="_blank" rel="noopener" aria-label="Instagram de Reroll Hobby Store">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>Instagram</a>
        <a class="cd-social__btn" href="https://www.facebook.com/share/17bhpdoc7Z/" target="_blank" rel="noopener" aria-label="Facebook de Reroll Hobby Store">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>Facebook</a>
        <a class="cd-social__btn cd-social__btn--wa" href="https://wa.me/50687807813" target="_blank" rel="noopener" aria-label="WhatsApp de Reroll Hobby Store">
          <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.3.6.6-3.2-.2-.4c-1-1.6-1.5-3.4-1.5-5.2C6 9.9 10.5 5.5 16 5.5S26 9.9 26 15 21.5 24.8 16 24.8z"/></svg>WhatsApp</a>
      </div>
    </div>
  </div>
  <p class="footer__legal">© <span id="year"></span> Reroll Hobby Store · Cartago, Costa Rica.</p>
  <p class="footer__credit">Diseñado por <a class="rd-mark" href="https://rerolldesign.com/" target="_blank" rel="noopener" aria-label="Reroll Design — diseño web (abre en otra pestaña)"><svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="22" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="32" cy="27" r="6.5"/><circle cx="68" cy="27" r="6.5"/><circle cx="32" cy="50" r="6.5"/><circle cx="68" cy="50" r="6.5"/><circle cx="32" cy="73" r="6.5"/><circle cx="68" cy="73" r="6.5"/></svg><b>Reroll Design</b></a></p>
</footer>

<div class="cd-light" id="cdLight" aria-hidden="true">
  <button class="cd-light__x" id="cdLightX" aria-label="Cerrar">✕</button>
  <img id="cdLightImg" src="" alt="{name} (ampliada)" />
</div>

<script src="../js/carta.js?v={jsv}"></script>
</body>
</html>
"""

if __name__ == "__main__":
    build()
