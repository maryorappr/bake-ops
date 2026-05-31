INSERT INTO products (id, sku, name)
VALUES
  ('prd_choc_chip', 'CHOC-CHIP-12', 'Chocolate Chip 12-pack'),
  ('prd_snick', 'SNICK-12', 'Snickerdoodle 12-pack')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, external_id, customer_name, customer_email, due_at, status, total_amount_cents, notes)
VALUES
  ('ord_1', 'GF-1001', 'Alex', 'alex@example.com', '2026-06-01', 'new', 2400, 'Pickup after 3pm'),
  ('ord_2', 'GF-1002', 'Jordan', 'jordan@example.com', '2026-06-01', 'prep', 3600, NULL),
  ('ord_3', 'GF-1003', 'Casey', 'casey@example.com', '2026-06-02', 'ready', 1800, 'Gift wrap')
ON CONFLICT (id) DO NOTHING;
