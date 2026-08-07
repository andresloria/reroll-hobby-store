/* ============================================================
   GET /api/pedidos — solo panel (header x-panel-key = PANEL_KEY).
   Lista los pedidos más recientes con su estado calculado
   ("pendiente" pasa a "expirado" pasadas las 48 h sin confirmar).
   ============================================================ */
"use strict";
const L = require("./_lib.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.json(res, 405, { error: "método no permitido" });
  if (!L.panelOk(req)) return L.json(res, 401, { error: "clave inválida" });
  if (!process.env.GITHUB_TOKEN)
    return L.json(res, 503, { error: "falta GITHUB_TOKEN en Vercel" });
  let db;
  try {
    ({ db } = await L.readPedidos());
  } catch (e) {
    // Sin esto la función reventaba con un 500 mudo y el panel se quedaba EN
    // BLANCO, como si no hubiera pedidos. El motivo casi siempre es el token
    // (vencido/revocado = 401), así que se dice en pantalla en vez de callarlo.
    return L.json(res, 503, { error: "no se pudo leer los pedidos: " + e.message });
  }
  const now = Date.now();
  const pedidos = db.pedidos
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 100)
    .map((p) => ({
      ...p,
      estado: p.estado === "pendiente" && !L.isActivo(p, now) ? "expirado" : p.estado,
    }));
  return L.json(res, 200, { pedidos, ts: now });
};
