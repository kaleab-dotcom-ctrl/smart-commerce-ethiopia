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
  v_order_user_id UUID;
  v_caller_id UUID;
  v_item_count INTEGER := 0;
  v_valid_item_count INTEGER := 0;
  v_sales_inserted_count INTEGER := 0;
BEGIN
  -- 1. Get calling user ID (Must be authenticated)
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Authentication required');
  END IF;

  -- 2. Fetch order status and user_id owner
  SELECT status, user_id INTO v_order_status, v_order_user_id 
  FROM orders 
  WHERE id = order_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 3. Treat NULL user_id as an invalid/unowned order
  IF v_order_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order has no assigned user owner');
  END IF;

  -- 4. Authorization check: Calling user MUST own the order
  IF v_order_user_id <> v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Order belongs to another user account');
  END IF;

  -- 5. Status checks
  IF v_order_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order is already completed');
  END IF;

  IF v_order_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot complete a cancelled order');
  END IF;

  -- 6. Count total order_items belonging to this order
  SELECT COUNT(*) INTO v_item_count
  FROM order_items
  WHERE order_id = order_id_param;

  IF v_item_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot complete an order with zero line items');
  END IF;

  -- 7. Validate that every order_item has a matching product and user ownership
  SELECT COUNT(*) INTO v_valid_item_count
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = order_id_param
    AND oi.user_id = v_caller_id
    AND p.user_id = v_caller_id;

  IF v_valid_item_count <> v_item_count THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Invalid order items: expected %s valid items matching products and user ownership, but found %s', v_item_count, v_valid_item_count)
    );
  END IF;

  -- 8. Verify product stock availability for all items
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

  -- 9. Deduct inventory stock for each product
  FOR v_item IN 
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = order_id_param
  LOOP
    UPDATE products
    SET quantity = quantity - v_item.quantity
    WHERE id = v_item.product_id AND user_id = v_caller_id;
  END LOOP;

  -- 10. Insert sales records for every order item
  FOR v_item IN 
    SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.subtotal
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = order_id_param
  LOOP
    INSERT INTO sales (product_id, product_name, quantity, total_price, user_id)
    VALUES (v_item.product_id, v_item.product_name, v_item.quantity, v_item.subtotal, v_caller_id);

    v_sales_inserted_count := v_sales_inserted_count + 1;
  END LOOP;

  -- 11. Verify that inserted sales count matches total order_items count
  IF v_sales_inserted_count <> v_item_count THEN
    RAISE EXCEPTION 'Sales generation count mismatch: inserted % sales for % order items', v_sales_inserted_count, v_item_count;
  END IF;

  -- 12. Finally update order status to completed
  UPDATE orders 
  SET status = 'completed' 
  WHERE id = order_id_param AND user_id = v_caller_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
