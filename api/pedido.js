/* ============================================================
   POST /api/pedido — crea un pedido (público, lo llama el checkout).
   Valida cada línea contra el stock real MENOS las reservas activas;
   si no alcanza, responde 409 con el detalle para que la tienda ajuste
   el carrito. Si todo está bien, guarda el pedido como "pendiente"
   (reserva por 48 h) y devuelve su número.
   ============================================================ */
"use strict";
const L = require("./_lib.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.json(res, 405, { error: "método no permitido" });
  if (!process.env.GITHUB_TOKEN) return L.json(res, 503, { error: "pedidos no configurados" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== "object") return L.json(res, 400, { error: "cuerpo inválido" });

  // ---- validación básica (anti-basura) ----
  const nombre = String(b.nombre || "").trim().slice(0, 60);
  if (nombre.length < 2) return L.json(res, 400, { error: "falta el nombre" });
  const entrega = b.entrega === "envio" ? "envio" : "retiro";
  const provincia = String(b.provincia || "").trim().slice(0, 40);
  const direccion = String(b.direccion || "").trim().slice(0, 200);
  const pago = String(b.pago || "").trim().slice(0, 40);
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 40)
    return L.json(res, 400, { error: "items inválidos" });
  const lineas = [];
  for (const it of b.items) {
    const id = Number(it && it.id), qty = Math.floor(Number(it && it.qty));
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1 || qty > 20)
      return L.json(res, 400, { error: "línea inválida" });
    lineas.push({ id, foil: !!it.foil, qty });
  }

  // ---- inventario actual (solo lectura) ----
  const { data: productos } = await L.readJsonFile("productos.json");
  if (!Array.isArray(productos)) return L.json(res, 500, { error: "inventario no disponible" });
  const byId = new Map(productos.map((p) => [p.id, p]));

  // hasta 3 intentos por si otro pedido escribe a la vez (conflicto de sha)
  for (let intento = 0; intento < 3; intento++) {
    const { db, sha } = await L.readPedidos();
    const now = Date.now();
    const reservas = L.reservasDe(db.pedidos, now);

    // ---- valida stock disponible = stock − reservado ----
    const faltantes = [];
    const items = [];
    for (const ln of lineas) {
      const p = byId.get(ln.id);
      if (!p || (p.type && p.type !== "single" && p.type !== "sealed")) { faltantes.push({ id: ln.id, foil: ln.foil, name: "?", disponible: 0 }); continue; }
      if (ln.foil && p.foil == null) { faltantes.push({ id: ln.id, foil: true, name: p.name, disponible: 0 }); continue; }
      const st = L.stockVariante(p, ln.foil);
      const disp = st === null ? null : Math.max(0, st - (reservas[L.lineKey(ln.id, ln.foil)] || 0));
      if (disp !== null && ln.qty > disp) { faltantes.push({ id: ln.id, foil: ln.foil, name: p.name, disponible: disp }); continue; }
      items.push({ id: ln.id, foil: ln.foil, qty: ln.qty, name: p.name, price: ln.foil ? p.foil : p.price });
    }
    if (faltantes.length) return L.json(res, 409, { error: "stock", faltantes });

    // ---- crea el pedido ----
    db.seq = (db.seq || 0) + 1;
    const id = "R-" + String(db.seq).padStart(4, "0");
    db.pedidos.push({
      id, ts: now, estado: "pendiente",
      nombre, entrega, provincia, direccion, pago,
      items,
      total: items.reduce((s, i) => s + Number(i.price || 0) * i.qty, 0),
    });
    L.prune(db, now);
    const ok = await L.writePedidos(db, sha, `Pedido ${id} (${nombre})`);
    if (ok) return L.json(res, 200, { ok: true, id, expiraHoras: 48 });
  }
  return L.json(res, 503, { error: "mucho tráfico, intentá de nuevo" });
};
