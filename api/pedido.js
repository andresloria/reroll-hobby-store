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
  const telefono = String(b.telefono || "").replace(/[^\d+ ]/g, "").trim().slice(0, 25);
  if ((telefono.match(/\d/g) || []).length < 8) return L.json(res, 400, { error: "teléfono inválido" });
  const entrega = b.entrega === "envio" ? "envio" : "retiro";
  const provincia = String(b.provincia || "").trim().slice(0, 40);
  const direccion = String(b.direccion || "").trim().slice(0, 200);
  // datos extra que pide Correos de Costa Rica (solo llegan en envíos)
  const canton = String(b.canton || "").trim().slice(0, 60);
  const distrito = String(b.distrito || "").trim().slice(0, 60);
  const cedula = String(b.cedula || "").replace(/[^\d\- ]/g, "").trim().slice(0, 25);
  const recibeAlt = String(b.recibeAlt || "").trim().slice(0, 80);
  const pago = String(b.pago || "").trim().slice(0, 40);
  const envioMetodo = String(b.envioMetodo || "").trim().slice(0, 60);
  const envioCosto = Math.max(0, Math.min(50000, Math.floor(Number(b.envioCosto) || 0)));
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 40)
    return L.json(res, 400, { error: "items inválidos" });
  const lineas = [];
  for (const it of b.items) {
    const id = Number(it && it.id), qty = Math.floor(Number(it && it.qty));
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1 || qty > 20)
      return L.json(res, 400, { error: "línea inválida" });
    lineas.push({ id, foil: !!it.foil, qty, preorden: !!(it && it.preorden) });
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
      // PRE-ORDEN: producto que aún no llega → no valida stock ni reserva
      if (ln.preorden) { items.push({ id: ln.id, foil: ln.foil, qty: ln.qty, preorden: true, name: p.name, price: ln.foil ? p.foil : p.price }); continue; }
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
    const total = items.reduce((s, i) => s + Number(i.price || 0) * i.qty, 0);
    const ped = {
      id, ts: now, estado: "pendiente",
      nombre, telefono, entrega, provincia, direccion, pago,
      canton, distrito, cedula, recibeAlt,
      envioMetodo, envioCosto,
      items, total,
    };
    db.pedidos.push(ped);
    L.prune(db, now);
    const ok = await L.writePedidos(db, sha, `Pedido ${id} (${nombre})`);
    if (ok) {
      // aviso por correo (best-effort: no bloquea ni rompe el pedido si falla)
      try { await L.sendMail(mailDePedido(ped)); } catch (_) {}
      return L.json(res, 200, { ok: true, id, expiraHoras: 48 });
    }
  }
  return L.json(res, 503, { error: "mucho tráfico, intentá de nuevo" });
};

/* Arma el correo de aviso de una reserva nueva (HTML simple, seguro para Gmail). */
function mailDePedido(ped) {
  const fmt = (n) => "₡" + Number(n || 0).toLocaleString("es-CR");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hayPre = ped.items.some((i) => i.preorden);
  const granTotal = Number(ped.total || 0) + Number(ped.envioCosto || 0);

  const filas = ped.items.map((i) => {
    const sub = Number(i.price || 0) * i.qty;
    const etq = (i.foil ? " ✨Foil" : "") + (i.preorden ? " 📦PRE-ORDEN" : "");
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(i.name)}${etq}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">×${i.qty}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${fmt(sub)}</td>
    </tr>`;
  }).join("");

  const entregaTxt = ped.entrega === "envio"
    ? `Envío${ped.envioMetodo ? " · " + esc(ped.envioMetodo) : ""}${ped.envioCosto ? " · " + fmt(ped.envioCosto) : ""}`
      + (ped.provincia ? "<br>Provincia: " + esc(ped.provincia) : "")
      + (ped.canton ? "<br>Cantón: " + esc(ped.canton) : "")
      + (ped.distrito ? "<br>Distrito: " + esc(ped.distrito) : "")
      + (ped.direccion ? "<br>Dirección: " + esc(ped.direccion) : "")
      + (ped.cedula ? "<br>Cédula: " + esc(ped.cedula) : "")
      + (ped.recibeAlt ? "<br>Recibe también: " + esc(ped.recibeAlt) : "")
    : "Retiro en Cartago";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <div style="background:#6E1423;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
      <div style="font-size:13px;letter-spacing:.05em;opacity:.85">REROLL HOBBY STORE</div>
      <div style="font-size:20px;font-weight:bold;margin-top:2px">🎴 Nueva reserva ${esc(ped.id)}</div>
      ${hayPre ? '<div style="margin-top:6px;font-size:13px;background:#0f6e56;display:inline-block;padding:3px 9px;border-radius:6px">📦 Incluye PRE-ORDEN (aparta 50%)</div>' : ""}
    </div>
    <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:18px 20px">
      <p style="margin:0 0 4px"><b>Cliente:</b> ${esc(ped.nombre)}</p>
      <p style="margin:0 0 4px"><b>Teléfono:</b> ${esc(ped.telefono)}</p>
      <p style="margin:0 0 4px"><b>Pago:</b> ${esc(ped.pago) || "—"}</p>
      <p style="margin:0 0 12px"><b>Entrega:</b> ${entregaTxt}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:10px">
        <thead><tr>
          <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #6E1423">Producto</th>
          <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #6E1423">Cant.</th>
          <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #6E1423">Subtotal</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
      ${ped.envioCosto ? `<p style="margin:0;text-align:right;font-size:13px;color:#555">Productos: ${fmt(ped.total)} · Envío: ${fmt(ped.envioCosto)}</p>` : ""}
      <p style="margin:8px 0 0;text-align:right;font-size:18px"><b>Total: ${fmt(granTotal)}</b></p>
      <p style="margin:16px 0 0;font-size:13px;color:#666">La reserva aparta el stock por 48 h. Confirmala o rechazala desde el <b>panel</b> (sección 📦 Pedidos). Este es un aviso automático; el cliente también te escribe por WhatsApp.</p>
    </div>
  </div>`;

  const text = `Nueva reserva ${ped.id}\nCliente: ${ped.nombre}\nTel: ${ped.telefono}\n`
    + `Pago: ${ped.pago || "-"}\nEntrega: ${ped.entrega === "envio" ? "Envío" : "Retiro"}\n`
    + ped.items.map((i) => `- ${i.name}${i.foil ? " Foil" : ""}${i.preorden ? " [PRE-ORDEN]" : ""} x${i.qty} = ${fmt(Number(i.price || 0) * i.qty)}`).join("\n")
    + `\nTotal: ${fmt(granTotal)}`;

  return {
    subject: `🎴 Nueva reserva ${ped.id} — ${ped.nombre} (${fmt(granTotal)})`,
    html, text,
  };
}
