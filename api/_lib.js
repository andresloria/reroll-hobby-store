/* ============================================================
   REROLL — helpers compartidos de la API de pedidos.
   (El guion bajo evita que Vercel lo exponga como ruta.)

   El "backend" es el propio repo de GitHub: data/pedidos.json guarda los
   pedidos y productos.json es el inventario. Se lee/escribe con la Contents
   API usando el token de la env var GITHUB_TOKEN (configurada en Vercel).
   Sin dependencias: Node 18+ trae fetch global.
   ============================================================ */
"use strict";

const REPO = process.env.PEDIDOS_REPO || "andresloria/reroll-hobby-store";
const BRANCH = process.env.PEDIDOS_BRANCH || "main";
const GH = "https://api.github.com";
const EXP_MS = 48 * 60 * 60 * 1000; // reservas expiran a las 48 h

function gh(path, opts = {}) {
  return fetch(GH + path, {
    ...opts,
    headers: {
      "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
      "User-Agent": "reroll-pedidos/1.0",
      "Accept": "application/vnd.github+json",
      ...(opts.headers || {}),
    },
  });
}

/* Lee un JSON del repo. El sha sale del listado del directorio (la Contents
   API normal no devuelve contenido de archivos >1MB, como productos.json,
   así que el contenido se pide aparte con el media type raw). */
async function readJsonFile(path) {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const lr = await gh(`/repos/${REPO}/contents/${dir}?ref=${BRANCH}`);
  if (!lr.ok) throw new Error("github list " + lr.status);
  const listing = await lr.json();
  const entry = Array.isArray(listing) ? listing.find((e) => e.path === path) : null;
  if (!entry) return { data: null, sha: null };
  const rr = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Accept: "application/vnd.github.raw" },
  });
  if (!rr.ok) throw new Error("github raw " + rr.status);
  return { data: JSON.parse(await rr.text()), sha: entry.sha };
}

/* Escribe un JSON al repo (indent 2, igual que el resto del proyecto).
   Devuelve false si hubo conflicto de sha (otro proceso escribió antes):
   el caller re-lee y reintenta. */
async function writeJsonFile(path, data, sha, message) {
  const body = {
    message,
    branch: BRANCH,
    content: Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64"),
  };
  if (sha) body.sha = sha;
  const r = await gh(`/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (r.status === 409 || r.status === 422) return false; // conflicto → reintentar
  if (!r.ok) throw new Error("github put " + r.status);
  return true;
}

const PEDIDOS_PATH = "data/pedidos.json";
async function readPedidos() {
  const { data, sha } = await readJsonFile(PEDIDOS_PATH);
  return { db: data || { seq: 0, pedidos: [] }, sha };
}
function writePedidos(db, sha, message) {
  return writeJsonFile(PEDIDOS_PATH, db, sha, message);
}

/* ---- reglas de negocio ---- */
function isActivo(p, now) {
  return p.estado === "pendiente" && (now || Date.now()) - p.ts < EXP_MS;
}
function lineKey(id, foil) { return foil ? id + "_f" : String(id); }

/* Conteo de unidades reservadas por los pedidos pendientes no expirados. */
function reservasDe(pedidos, now) {
  const map = {};
  for (const p of pedidos) {
    if (!isActivo(p, now)) continue;
    for (const it of p.items) {
      const k = lineKey(it.id, it.foil);
      map[k] = (map[k] || 0) + it.qty;
    }
  }
  return map;
}

/* Stock efectivo de una variante: foil usa stockf si existe; si no, sigue el
   normal. null = ilimitado (cartas sin campo stock). */
function stockVariante(prod, foil) {
  const norm = (s) => (s === undefined || s === null || s === "" ? null : Number(s));
  if (foil) {
    const sf = norm(prod.stockf);
    if (sf !== null) return sf;
  }
  return norm(prod.stock);
}

/* Mantiene chico data/pedidos.json: conserva pendientes y el resto de los
   últimos 30 días, con tope de 300 registros. */
function prune(db, now) {
  const t = now || Date.now();
  const MES = 30 * 24 * 60 * 60 * 1000;
  db.pedidos = db.pedidos.filter((p) => p.estado === "pendiente" || t - p.ts < MES);
  if (db.pedidos.length > 300) db.pedidos = db.pedidos.slice(-300);
}

/* ---- helpers HTTP ---- */
function panelOk(req) {
  const k = req.headers["x-panel-key"];
  return !!process.env.PANEL_KEY && k === process.env.PANEL_KEY;
}
function json(res, status, obj) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(obj);
}

module.exports = {
  readJsonFile, writeJsonFile, readPedidos, writePedidos,
  isActivo, lineKey, reservasDe, stockVariante, prune, panelOk, json,
  EXP_MS, PEDIDOS_PATH,
};
