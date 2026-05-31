import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { withClient } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function run() {
  await withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await fs.readdir(migrationsDir))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
      if (exists.rowCount > 0) continue;

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied migration: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  });
}

run()
  .then(() => {
    console.log("Migrations complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed", error);
    process.exit(1);
  });
