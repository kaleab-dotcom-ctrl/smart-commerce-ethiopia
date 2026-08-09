-- ============================================================
-- Smart Commerce Ethiopia: Orders & Sales Database Schema
-- ============================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "Authenticated users full access to customers" ON customers;
CREATE POLICY "Authenticated users full access to customers" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to orders" ON orders;
CREATE POLICY "Authenticated users full access to orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to order_items" ON order_items;
CREATE POLICY "Authenticated users full access to order_items" ON order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. STORED PROCEDURE FOR SAFE ORDER COMPLETION & INVENTORY DEDUCTION
CREATE OR REPLACE FUNCTION complete_order(order_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_order_status TEXT;
BEGIN
  -- Check current order status
  SELECT status INTO v_order_status FROM orders WHERE id = order_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF v_order_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is already completed');
  END IF;

  IF v_order_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot complete a cancelled order');
  END IF;

  -- Verify stock for all items in order
  FOR v_item IN 
    SELECT oi.product_id, oi.quantity, p.name, p.quantity AS stock
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = order_id_param
  LOOP
    IF v_item.stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', format('Insufficient stock for product "%s". Available: %s, Requested: %s', v_item.name, v_item.stock, v_item.quantity)
      );
    END IF;
  END LOOP;

  -- Deduct inventory for all items
  FOR v_item IN 
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = order_id_param
  LOOP
    UPDATE products
    SET quantity = quantity - v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  -- Record in sales table for backwards compatibility
  INSERT INTO sales (product_id, product_name, quantity, total_price)
  SELECT oi.product_id, p.name, oi.quantity, oi.subtotal
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = order_id_param;

  -- Update order status to completed
  UPDATE orders SET status = 'completed' WHERE id = order_id_param;

  RETURN jsonb_build_object('success', true);
END;
$$;
