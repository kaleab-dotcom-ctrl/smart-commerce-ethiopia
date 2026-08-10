-- ============================================================
-- Smart Commerce Ethiopia: Orders & Sales Database Schema
-- Multi-User Data Isolation Supported
-- ============================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 4. INDEXES FOR PERFORMANCE & RLS
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own customers" ON customers;
CREATE POLICY "Users access own customers" ON customers
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own orders" ON orders;
CREATE POLICY "Users access own orders" ON orders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own order_items" ON order_items;
CREATE POLICY "Users access own order_items" ON order_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. STORED PROCEDURE FOR SAFE ORDER COMPLETION & INVENTORY DEDUCTION
CREATE OR REPLACE FUNCTION complete_order(order_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_order_status TEXT;
  v_user_id UUID;
BEGIN
  -- Fetch order status and user_id
  SELECT status, user_id INTO v_order_status, v_user_id FROM orders WHERE id = order_id_param;
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

  -- Record in sales table with user_id ownership
  INSERT INTO sales (product_id, product_name, quantity, total_price, user_id)
  SELECT oi.product_id, p.name, oi.quantity, oi.subtotal, COALESCE(oi.user_id, v_user_id)
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = order_id_param;

  -- Update order status to completed
  UPDATE orders SET status = 'completed' WHERE id = order_id_param;

  RETURN jsonb_build_object('success', true);
END;
$$;
