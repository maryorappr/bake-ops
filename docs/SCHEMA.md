# Phase 1 Schema (initial)

## Tables
- orders(id, external_id, customer_name, customer_email, due_at, status, total_amount_cents, notes, created_at)
- order_items(id, order_id, product_id, quantity, unit_price_cents)
- products(id, sku, name, active)
- recipes(id, product_id, version, yield_qty)
- recipe_items(id, recipe_id, ingredient_id, qty, unit)
- ingredients(id, name, unit, reorder_level)
- inventory_movements(id, ingredient_id, movement_type, qty, unit_cost_cents, reason, created_at)
- suppliers(id, name)
- ingredient_prices(id, ingredient_id, supplier_id, unit_cost_cents, effective_at)
