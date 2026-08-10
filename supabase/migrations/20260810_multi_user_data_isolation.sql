-- ============================================================
-- Smart Commerce Ethiopia: Multi-User Data Isolation Migration
-- Timestamp: 20260810_multi_user_data_isolation.sql
-- ============================================================

-- 1. ADD USER_ID COLUMN TO ALL TABLES (DEFAULT auth.uid())
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE order_items 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 2. SAFE EXISTING DATA HANDOVER: ASSIGN ANY PRE-EXISTING UNASSIGNED TEST DATA TO THE PRIMARY REGISTERED USER
UPDATE products SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);
UPDATE customers SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);
UPDATE orders SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);
UPDATE order_items SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);
UPDATE sales SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users);

-- 3. CREATE INDEXES FOR FAST RLS FILTERING BY USER_ID
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);

-- 4. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 5. DROP EXISTING PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all for MVP" ON products;
DROP POLICY IF EXISTS "Authenticated users full access to products" ON products;
DROP POLICY IF EXISTS "Authenticated users full access to customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users full access to orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users full access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all for MVP" ON sales;
DROP POLICY IF EXISTS "Authenticated users full access to sales" ON sales;

DROP POLICY IF EXISTS "Users access own products" ON products;
DROP POLICY IF EXISTS "Users access own customers" ON customers;
DROP POLICY IF EXISTS "Users access own orders" ON orders;
DROP POLICY IF EXISTS "Users access own order_items" ON order_items;
DROP POLICY IF EXISTS "Users access own sales" ON sales;

-- 6. CREATE STRICT PER-USER RLS POLICIES (AUTHENTICATED USER CAN ONLY ACCESS THEIR OWN DATA)
CREATE POLICY "Users access own products" ON products
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own customers" ON customers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own orders" ON orders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own order_items" ON order_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own sales" ON sales
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. UPDATE STORED PROCEDURE COMPLETE_ORDER TO PRESERVE USER_ID SECURITY
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

  -- Authorization check: Ensure calling user owns the order being completed
  IF auth.uid() IS NOT NULL AND v_user_id IS NOT NULL AND auth.uid() <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Order belongs to another user account');
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
