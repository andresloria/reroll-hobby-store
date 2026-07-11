/* ============================================================
   POST /api/pedido-accion — solo panel (header x-panel-key).
   Acciones sobre un pedido:
     { id, accion: "quitar", linea: { id, foil } }  → saca una carta del
        pedido (la reserva de esa línea se libera al instante; si el pedido
        queda vacío pasa a "rechazado").
     { id, accion: "rechazar" }                     → libera todo el pedido.
     { id, accion: "confirmar" }                    → VENTA: descuenta el
        stock (normal o foil) en productos.json del repo —dispara deploy—
        y marca el pedido como "confirmado".
   ============================================================ */
"use strict";
const L = require("./_lib.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.json(res, 405, { error: "método no permitido" });
  if (!L.panelOk(req)) return L.json(res, 401, { error: "clave inválida" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || !b.id || !b.accion) return L.json(res, 400, { error: "cuerpo inválido" });

  for (let intento = 0; intento < 3; intento++) {
    const { db, sha } = await L.readPedidos();
    const ped = db.pedidos.find((p) => p.id === b.id);
    if (!ped) return L.json(res, 404, { error: "pedido no encontrado" });

    if (b.accion === "quitar") {
      if (ped.estado !== "pendiente") return L.json(res, 400, { error: "el pedido ya no está pendiente" });
      const li = b.linea || {};
      const antes = ped.items.length;
      ped.items = ped.items.filter((it) => !(it.id === Number(li.id) && !!it.foil === !!li.foil));
      if (ped.items.length === antes) return L.json(res, 404, { error: "línea no encontrada" });
      ped.total = ped.items.reduce((s, i) => s + Number(i.price || 0) * i.qty, 0);
      if (!ped.items.length) ped.estado = "rechazado";
      const ok = await L.writePedidos(db, sha, `Pedido ${ped.id}: línea quitada`);
      if (ok) return L.json(res, 200, { ok: true, pedido: ped });
      continue;
    }

    if (b.accion === "rechazar") {
      if (ped.estado === "confirmado") return L.json(res, 400, { error: "ya estaba confirmado" });
      ped.estado = "rechazado";
      const ok = await L.writePedidos(db, sha, `Pedido ${ped.id}: rechazado`);
      if (ok) return L.json(res, 200, { ok: true, pedido: ped });
      continue;
    }

    if (b.accion === "confirmar") {
      if (ped.estado === "confirmado") return L.json(res, 400, { error: "ya estaba confirmado" });

      // descuenta stock en productos.json (con validación contra reservas AJENAS)
      for (let pi = 0; pi < 3; pi++) {
        const { data: productos, sha: psha } = await L.readJsonFile("productos.json");
        if (!Array.isArray(productos)) return L.json(res, 500, { error: "inventario no disponible" });
        const otros = L.reservasDe(db.pedidos.filter((p) => p.id !== ped.id));
        const faltantes = [];
        for (const it of ped.items) {
          if (it.preorden) continue;   // pre-orden: no valida stock (aún no llega)
          const p = productos.find((x) => x.id === it.id);
          if (!p) { faltantes.push({ name: it.name, disponible: 0 }); continue; }
          const st = L.stockVariante(p, it.foil);
          if (st !== null && st - (otros[L.lineKey(it.id, it.foil)] || 0) < it.qty)
            faltantes.push({ name: it.name, disponible: Math.max(0, st - (otros[L.lineKey(it.id, it.foil)] || 0)) });
        }
        if (faltantes.length) return L.json(res, 409, { error: "stock", faltantes });
        for (const it of ped.items) {
          if (it.preorden) continue;   // pre-orden: no descuenta stock
          const p = productos.find((x) => x.id === it.id);
          if (!p) continue;
          if (it.foil && p.stockf !== undefined && p.stockf !== null && p.stockf !== "")
            p.stockf = Math.max(0, Number(p.stockf) - it.qty);
          else if (p.stock !== undefined && p.stock !== null && p.stock !== "")
            p.stock = Math.max(0, Number(p.stock) - it.qty);
        }
        const wok = await L.writeJsonFile("productos.json", productos, psha,
          `Pedido ${ped.id} confirmado: descuenta stock (${ped.items.length} línea/s)`);
        if (wok) break;
        if (pi === 2) return L.json(res, 503, { error: "no se pudo escribir el inventario" });
      }

      ped.estado = "confirmado";
      ped.confirmadoTs = Date.now();
      const ok = await L.writePedidos(db, sha, `Pedido ${ped.id}: confirmado`);
      if (ok) return L.json(res, 200, { ok: true, pedido: ped });
      // conflicto en pedidos.json: NO volver a descontar stock — solo re-marcar
      for (let mi = 0; mi < 3; mi++) {
        const { db: db2, sha: sha2 } = await L.readPedidos();
        const p2 = db2.pedidos.find((p) => p.id === b.id);
        if (!p2) break;
        p2.estado = "confirmado"; p2.confirmadoTs = ped.confirmadoTs;
        if (await L.writePedidos(db2, sha2, `Pedido ${ped.id}: confirmado`))
          return L.json(res, 200, { ok: true, pedido: p2 });
      }
      return L.json(res, 500, { error: "stock descontado pero no se pudo marcar el pedido; revisá data/pedidos.json" });
    }

    return L.json(res, 400, { error: "acción desconocida" });
  }
  return L.json(res, 503, { error: "mucho tráfico, intentá de nuevo" });
};
