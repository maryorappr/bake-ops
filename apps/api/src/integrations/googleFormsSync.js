import { parse } from "csv-parse/sync";
import { pool } from "../db/index.js";

// Allowed order statuses for imported rows.
const validStatuses = new Set(["new", "prep", "ready", "fulfilled", "cancelled"]);

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function centsFromCurrency(value) {
  if (value == null) return 0;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const number = Number(cleaned);
  if (Number.isNaN(number)) return 0;
  return Math.round(number * 100);
}

function normalizeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function getValue(row, aliases) {
  for (const key of aliases) {
    if (row[key] != null && String(row[key]).trim() !== "") return row[key];
  }
  return null;
}

function parseOrderItems(rawValue) {
  if (!rawValue) return [];
  const chunks = String(rawValue).split(/[;,\n]+/).map((x) => x.trim()).filter(Boolean);
  return chunks.map((chunk, index) => {
    const match = chunk.match(/(.+?)\s*x\s*(\d+)$/i);
    if (match) {
      return { key: `${index}`, productHint: match[1].trim(), quantity: Number(match[2]) };
    }
    return { key: `${index}`, productHint: chunk, quantity: 1 };
  });
}

// Resolve an item label from forms into an internal product reference.
async function findProductByHint(productHint) {
  const result = await pool.query(
    `
    SELECT id, name
    FROM products
    WHERE LOWER(name) LIKE LOWER($1) OR LOWER(sku) = LOWER($2)
    ORDER BY name ASC
    LIMIT 1
    `,
    [`%${productHint}%`, productHint]
  );
  return result.rows[0] || null;
}

// Pull Google Sheet CSV and upsert orders + order_items.
export async function syncGoogleFormsFromCsvUrl(csvUrl) {
  if (!csvUrl) {
    throw new Error("GOOGLE_FORMS_CSV_URL is not set");
  }

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });

  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const externalId = String(getValue(row, ["Order ID", "OrderId", "External ID", "Response ID", "Timestamp"]) || "").trim();
    if (!externalId) continue;

    const customerName = String(getValue(row, ["Name", "Customer Name", "Full Name"]) || "Walk-in").trim();
    const customerEmail = getValue(row, ["Email", "Customer Email", "Email Address"]);
    const dueAt = normalizeDate(getValue(row, ["Due Date", "Pickup Date", "Fulfillment Date", "Date"])) || new Date().toISOString().slice(0, 10);
    const notes = getValue(row, ["Notes", "Order Notes", "Special Instructions"]);
    const totalAmountCents = centsFromCurrency(getValue(row, ["Total", "Order Total", "Amount"]));

    const statusRaw = String(getValue(row, ["Status", "Order Status"]) || "new").trim().toLowerCase();
    const status = validStatuses.has(statusRaw) ? statusRaw : "new";

    const id = `ord_${slugify(externalId)}`;

    const result = await pool.query(
      `
      INSERT INTO orders (id, external_id, customer_name, customer_email, due_at, status, total_amount_cents, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (external_id)
      DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        due_at = EXCLUDED.due_at,
        status = EXCLUDED.status,
        total_amount_cents = EXCLUDED.total_amount_cents,
        notes = EXCLUDED.notes
      RETURNING (xmax = 0) AS inserted
      `,
      [id, externalId, customerName, customerEmail, dueAt, status, totalAmountCents, notes]
    );

    const persistedOrderId =
      result.rows[0]?.inserted
        ? id
        : (await pool.query("SELECT id FROM orders WHERE external_id = $1", [externalId])).rows[0]?.id || id;

    const rawItems = getValue(row, ["Items", "Order Items", "Products", "Cookies"]);
    const parsedItems = parseOrderItems(rawItems);
    await pool.query("DELETE FROM order_items WHERE order_id = $1", [persistedOrderId]);

    if (parsedItems.length > 0) {
      const safePrice =
        parsedItems.length > 0
          ? Math.max(1, Math.round(totalAmountCents / parsedItems.length))
          : totalAmountCents;
      for (const parsed of parsedItems) {
        const product = await findProductByHint(parsed.productHint);
        if (!product) continue;
        await pool.query(
          `
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [`oi_${slugify(externalId)}_${parsed.key}`, persistedOrderId, product.id, parsed.quantity, safePrice]
        );
      }
    }

    if (result.rows[0]?.inserted) inserted += 1;
    else updated += 1;
  }

  return { processed: rows.length, inserted, updated };
}

if (process.argv[1] && process.argv[1].endsWith("googleFormsSync.js")) {
  const csvUrl = process.env.GOOGLE_FORMS_CSV_URL;
  syncGoogleFormsFromCsvUrl(csvUrl)
    .then((summary) => {
      console.log(JSON.stringify(summary));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
