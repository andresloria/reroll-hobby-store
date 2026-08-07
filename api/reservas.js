/* ============================================================
   GET /api/reservas — público. Devuelve cuántas unidades están
   reservadas por pedidos pendientes (no expirados), por variante:
   { "123": 1, "123_f": 2 }. La tienda lo resta del stock que muestra.
   ============================================================ */
"use strict";
const L = require("./_lib.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.json(res, 405, { error: "método no permitido" });
  // Siempre 200 con `reservas`: la tienda NO se rompe pase lo que pase. El
  // campo `err` es solo para diagnóstico (un `{}` mudo hacía indistinguible
  // "no hay reservas" de "no pude leerlas"); nunca incluye el token.
  if (!process.env.GITHUB_TOKEN)
    return L.json(res, 200, { reservas: {}, err: "sin GITHUB_TOKEN" });
  try {
    const { db } = await L.readPedidos();
    return L.json(res, 200, { reservas: L.reservasDe(db.pedidos), ts: Date.now() });
  } catch (e) {
    return L.json(res, 200, { reservas: {}, err: String(e.message || e) });
  }
};
