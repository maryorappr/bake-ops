import express from "express";
import cors from "cors";
import { pool } from "./db/index.js";
import { syncGoogleFormsFromCsvUrl } from "./integrations/googleFormsSync.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

const allowedStatuses = new Set(["new", "prep", "ready", "fulfilled", "cancelled"]);
const formsCsvUrl = process.env.GOOGLE_FORMS_CSV_URL || "";

function badRequest(res, error) {
  res.status(400).json({ error });
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "cookie-ops-api", db: "up" });
  } catch {
    res.status(500).json({ ok: false, service: "cookie-ops-api", db: "down" });
  }
});

app.get("/api/dashboard/summary", async (_req, res) => {
  try {
    const [todayResult, atRiskResult, revenueResult, lowStockResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE due_at = CURRENT_DATE"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE due_at = CURRENT_DATE AND status = 'new'"),
      pool.query("SELECT COALESCE(SUM(total_amount_cents), 0)::int AS sum FROM orders WHERE due_at >= CURRENT_DATE - INTERVAL '7 days'"),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM (
          SELECT i.id
          FROM ingredients i
          LEFT JOIN inventory_movements m ON m.ingredient_id = i.id
          GROUP BY i.id, i.reorder_level
          HAVING COALESCE(SUM(CASE WHEN m.movement_type = 'receive' THEN m.qty ELSE -m.qty END), 0) <= i.reorder_level
        ) x
      `)
    ]);

    res.json({
      todayDue: todayResult.rows[0].count,
      weekRevenueCents: revenueResult.rows[0].sum,
      lowStockAlerts: lowStockResult.rows[0].count,
      atRiskOrders: atRiskResult.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard summary", details: error.message });
  }
});

app.get("/api/orders", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.customer_name AS "customerName",
        o.customer_email AS "customerEmail",
        o.due_at::text AS "dueAt",
        o.status,
        o.total_amount_cents AS "totalAmountCents",
        o.notes,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'productName', p.name,
              'quantity', oi.quantity,
              'unitPriceCents', oi.unit_price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.due_at ASC, o.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load orders", details: error.message });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.external_id AS "externalId",
        o.customer_name AS "customerName",
        o.customer_email AS "customerEmail",
        o.due_at::text AS "dueAt",
        o.status,
        o.total_amount_cents AS "totalAmountCents",
        o.notes,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'productName', p.name,
              'quantity', oi.quantity,
              'unitPriceCents', oi.unit_price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id
      `,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to load order", details: error.message });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!allowedStatuses.has(status)) {
    badRequest(res, "Invalid status");
    return;
  }

  try {
    const result = await pool.query(
      `
        UPDATE orders
        SET status = $2
        WHERE id = $1
        RETURNING
          id,
          customer_name AS "customerName",
          customer_email AS "customerEmail",
          due_at::text AS "dueAt",
          status,
          total_amount_cents AS "totalAmountCents",
          notes
      `,
      [id, status]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update order", details: error.message });
  }
});

app.get("/api/inventory/items", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.name,
        i.unit,
        i.reorder_level AS "reorderLevel",
        COALESCE(SUM(CASE WHEN m.movement_type = 'receive' THEN m.qty ELSE -m.qty END), 0) AS qty
      FROM ingredients i
      LEFT JOIN inventory_movements m ON m.ingredient_id = i.id
      GROUP BY i.id
      ORDER BY i.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load inventory", details: error.message });
  }
});

app.post("/api/ingredients", async (req, res) => {
  const { id, name, unit, reorderLevel = 0 } = req.body;
  if (!id || !name || !unit) {
    badRequest(res, "id, name, and unit are required");
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO ingredients (id, name, unit, reorder_level) VALUES ($1, $2, $3, $4)
       RETURNING id, name, unit, reorder_level AS "reorderLevel"`,
      [id, name, unit, reorderLevel]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ingredient", details: error.message });
  }
});

app.post("/api/inventory/movements", async (req, res) => {
  const { id, ingredientId, movementType, qty, unitCostCents = null, reason = null } = req.body;

  if (!id || !ingredientId || !movementType || qty == null) {
    badRequest(res, "id, ingredientId, movementType, and qty are required");
    return;
  }

  const allowedTypes = new Set(["receive", "consume", "adjust", "spoilage"]);
  if (!allowedTypes.has(movementType)) {
    badRequest(res, "Invalid movementType");
    return;
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO inventory_movements (id, ingredient_id, movement_type, qty, unit_cost_cents, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, ingredient_id AS "ingredientId", movement_type AS "movementType", qty, unit_cost_cents AS "unitCostCents", reason
      `,
      [id, ingredientId, movementType, qty, unitCostCents, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create inventory movement", details: error.message });
  }
});

app.get("/api/recipes", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.product_id AS "productId",
        p.name AS "productName",
        r.version,
        r.yield_qty AS "yieldQty",
        COALESCE(
          json_agg(
            json_build_object(
              'id', ri.id,
              'ingredientId', ri.ingredient_id,
              'ingredientName', i.name,
              'qty', ri.qty,
              'unit', ri.unit
            )
          ) FILTER (WHERE ri.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM recipes r
      JOIN products p ON p.id = r.product_id
      LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
      LEFT JOIN ingredients i ON i.id = ri.ingredient_id
      GROUP BY r.id, p.name
      ORDER BY p.name ASC, r.version DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load recipes", details: error.message });
  }
});

app.post("/api/recipes", async (req, res) => {
  const { id, productId, version = 1, yieldQty = 1, items = [] } = req.body;
  if (!id || !productId) {
    badRequest(res, "id and productId are required");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO recipes (id, product_id, version, yield_qty) VALUES ($1, $2, $3, $4)`,
      [id, productId, version, yieldQty]
    );

    for (const item of items) {
      if (!item.id || !item.ingredientId || item.qty == null || !item.unit) continue;
      await client.query(
        `INSERT INTO recipe_items (id, recipe_id, ingredient_id, qty, unit) VALUES ($1, $2, $3, $4, $5)`,
        [item.id, id, item.ingredientId, item.qty, item.unit]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ok: true, id });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create recipe", details: error.message });
  } finally {
    client.release();
  }
});

app.post("/api/integrations/google/forms/sync", async (_req, res) => {
  try {
    const summary = await syncGoogleFormsFromCsvUrl(formsCsvUrl);
    res.json({ ok: true, summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Google Forms sync failed", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Cookie Ops API listening on ${port}`);
});
