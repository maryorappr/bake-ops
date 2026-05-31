import * as cheerio from "cheerio";
import { pool } from "../db/index.js";

const STOCK_PATTERNS = [
  /in\s*stock/i,
  /available/i,
  /ships\s*(today|now|within)/i,
  /ready\s*to\s*ship/i
];

const OOS_PATTERNS = [
  /out\s*of\s*stock/i,
  /sold\s*out/i,
  /unavailable/i,
  /back\s*order/i
];

function detectAvailability(text) {
  if (!text) return { inStock: null, availabilityText: "No availability text found" };

  for (const p of OOS_PATTERNS) {
    if (p.test(text)) return { inStock: false, availabilityText: "Out of stock signal found" };
  }
  for (const p of STOCK_PATTERNS) {
    if (p.test(text)) return { inStock: true, availabilityText: "In stock signal found" };
  }

  return { inStock: null, availabilityText: "No clear stock signal" };
}

function detectPrice(text) {
  const m = text.match(/\$\s?\d+(?:\.\d{2})?/);
  return m ? m[0] : null;
}

export async function runAvailabilityCheck() {
  const targets = await pool.query(`
    SELECT wt.id, wt.url, wt.supplier_name AS "supplierName", wt.product_name AS "productName", i.name AS "ingredientName"
    FROM supplier_watch_targets wt
    JOIN ingredients i ON i.id = wt.ingredient_id
    WHERE wt.enabled = TRUE
    ORDER BY wt.created_at ASC
  `);

  const results = [];

  for (const target of targets.rows) {
    let inStock = null;
    let availabilityText = "Request failed";
    let priceText = null;

    try {
      const response = await fetch(target.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BakeOpsAvailabilityBot/1.0)",
          Accept: "text/html,application/xhtml+xml"
        }
      });

      const html = await response.text();
      const $ = cheerio.load(html);
      const pageText = $("body").text().replace(/\s+/g, " ").slice(0, 50000);

      const availability = detectAvailability(pageText);
      inStock = availability.inStock;
      availabilityText = availability.availabilityText;
      priceText = detectPrice(pageText);
    } catch (error) {
      availabilityText = `Request error: ${error.message}`;
    }

    const snapId = `snap_${target.id}_${Date.now()}`;
    await pool.query(
      `
      INSERT INTO ingredient_availability_snapshots (id, target_id, in_stock, availability_text, price_text)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [snapId, target.id, inStock, availabilityText, priceText]
    );

    results.push({
      targetId: target.id,
      ingredientName: target.ingredientName,
      supplierName: target.supplierName,
      productName: target.productName,
      inStock,
      availabilityText,
      priceText
    });
  }

  return results;
}
