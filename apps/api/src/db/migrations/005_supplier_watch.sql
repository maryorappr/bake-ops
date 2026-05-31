CREATE TABLE IF NOT EXISTS supplier_watch_targets (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_availability_snapshots (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL REFERENCES supplier_watch_targets(id) ON DELETE CASCADE,
  in_stock BOOLEAN,
  availability_text TEXT,
  price_text TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO supplier_watch_targets (id, ingredient_id, supplier_name, product_name, url, enabled)
VALUES
  ('wt_flour_ka', 'ing_flour', 'King Arthur Baking', 'All-Purpose Flour', 'https://shop.kingarthurbaking.com/items/unbleached-all-purpose-flour', TRUE),
  ('wt_sugar_web', 'ing_sugar', 'WebstaurantStore', 'Granulated Sugar', 'https://www.webstaurantstore.com/search/granulated-sugar.html', TRUE),
  ('wt_butter_us', 'ing_butter', 'US Foods CHEF''STORE', 'Butter Bulk', 'https://www.chefstore.com/search/full/?q=butter', TRUE)
ON CONFLICT (id) DO NOTHING;
