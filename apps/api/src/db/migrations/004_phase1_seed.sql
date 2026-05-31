INSERT INTO ingredients (id, name, unit, reorder_level)
VALUES
  ('ing_flour', 'Flour', 'lb', 10),
  ('ing_sugar', 'Sugar', 'lb', 8),
  ('ing_butter', 'Butter', 'lb', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory_movements (id, ingredient_id, movement_type, qty, unit_cost_cents, reason)
VALUES
  ('mov_1', 'ing_flour', 'receive', 50, 120, 'Initial stock'),
  ('mov_2', 'ing_sugar', 'receive', 30, 110, 'Initial stock'),
  ('mov_3', 'ing_butter', 'receive', 25, 350, 'Initial stock')
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, product_id, version, yield_qty)
VALUES
  ('rcp_choc_v1', 'prd_choc_chip', 1, 12),
  ('rcp_snick_v1', 'prd_snick', 1, 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_items (id, recipe_id, ingredient_id, qty, unit)
VALUES
  ('ri_1', 'rcp_choc_v1', 'ing_flour', 1.50, 'lb'),
  ('ri_2', 'rcp_choc_v1', 'ing_sugar', 0.90, 'lb'),
  ('ri_3', 'rcp_choc_v1', 'ing_butter', 1.10, 'lb'),
  ('ri_4', 'rcp_snick_v1', 'ing_flour', 1.40, 'lb'),
  ('ri_5', 'rcp_snick_v1', 'ing_sugar', 1.00, 'lb'),
  ('ri_6', 'rcp_snick_v1', 'ing_butter', 0.95, 'lb')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents)
VALUES
  ('oi_1', 'ord_1', 'prd_choc_chip', 1, 2400),
  ('oi_2', 'ord_2', 'prd_snick', 1, 3600),
  ('oi_3', 'ord_3', 'prd_choc_chip', 1, 1800)
ON CONFLICT (id) DO NOTHING;
