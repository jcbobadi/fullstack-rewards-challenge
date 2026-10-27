import express from "express";
import cors from "cors";
import { products, users, rewardedActions, POINTS_PER_ADD } from "./store.js";

export const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Paginación, categoría y búsqueda se resuelven en el servidor.
app.get("/api/products", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 8);
  const category = String(req.query.category ?? "").trim();
  const search = String(req.query.search ?? "").trim().toLocaleLowerCase();

  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      error: { code: "INVALID_PAGINATION", message: "page debe ser >= 1 y limit debe estar entre 1 y 50." }
    });
  }

  let result = products;
  if (category) result = result.filter((p) => p.category === category);
  if (search) result = result.filter((p) => p.name.toLocaleLowerCase().includes(search));

  const total = result.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;

  res.json({
    data: result.slice(start, start + limit),
    pagination: { page, limit, total, pages }
  });
});

app.get("/api/categories", (_req, res) => {
  res.json({ data: [...new Set(products.map((p) => p.category))].sort() });
});

app.get("/api/users/:userId/points", (req, res) => {
  const userId = Number(req.params.userId);
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Usuario no encontrado." } });
  res.json({ userId: user.id, points: user.points });
});

// El cliente indica la acción, pero nunca el valor de puntos.
// El servidor aplica la regla y calcula el saldo.
app.post("/api/rewards/actions", (req, res) => {
  const userId = Number(req.body?.userId);
  const productId = Number(req.body?.productId);
  const action = req.body?.action;

  if (!Number.isInteger(userId) || !Number.isInteger(productId) || action !== "ADD_TO_CART") {
    return res.status(400).json({
      error: { code: "INVALID_REWARD_ACTION", message: "Se requiere userId, productId y una acción válida." }
    });
  }

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Usuario no encontrado." } });

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND", message: "Producto no encontrado." } });

  const actionKey = `${userId}:${productId}:${action}`;
  if (rewardedActions.has(actionKey)) {
    return res.json({ userId, points: user.points, awarded: 0, message: "Esta acción ya fue recompensada." });
  }

  user.points += POINTS_PER_ADD;
  rewardedActions.add(actionKey);
  return res.status(201).json({ userId, points: user.points, awarded: POINTS_PER_ADD });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Ocurrió un error inesperado." }
  });
});
