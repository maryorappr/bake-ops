ALTER TABLE supplier_watch_targets
ADD COLUMN IF NOT EXISTS stock_selector TEXT,
ADD COLUMN IF NOT EXISTS price_selector TEXT,
ADD COLUMN IF NOT EXISTS in_stock_regex TEXT,
ADD COLUMN IF NOT EXISTS out_of_stock_regex TEXT;

UPDATE supplier_watch_targets
SET
  stock_selector = CASE id
    WHEN 'wt_flour_ka' THEN '.product-form__inventory, .product-form__badge, .product__inventory, [data-product-inventory], .stock'
    WHEN 'wt_sugar_web' THEN '.inventory-status, .item__availability, .product-availability, .stock-status'
    WHEN 'wt_butter_us' THEN '.search-results, .product-grid, .availability, .stock-status'
    ELSE stock_selector
  END,
  price_selector = CASE id
    WHEN 'wt_flour_ka' THEN '.price-item--regular, .price__regular, .price'
    WHEN 'wt_sugar_web' THEN '.price, .price__dollars, .product-price'
    WHEN 'wt_butter_us' THEN '.price, .money, .product-price'
    ELSE price_selector
  END,
  in_stock_regex = COALESCE(in_stock_regex, '(in\\s*stock|available|ready\\s*to\\s*ship|ships\\s*(today|now|within))'),
  out_of_stock_regex = COALESCE(out_of_stock_regex, '(out\\s*of\\s*stock|sold\\s*out|unavailable|back\\s*order)')
WHERE id IN ('wt_flour_ka', 'wt_sugar_web', 'wt_butter_us');
