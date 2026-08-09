import { supabase } from "@/lib/supabase";
import { Customer } from "@/lib/customers";
import { getProducts, updateProduct, Product } from "@/lib/products";
import { addSale } from "@/lib/sales";

export type OrderStatus = "pending" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
};

export type NewOrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
};

export type Order = {
  id: string;
  customer_id: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  customer?: Customer | null;
  items?: OrderItem[];
};

export type NewOrder = {
  customer_id?: string | null;
  status?: OrderStatus;
  total_amount: number;
};

// Helper: calculate total amount from order items
export function calculateOrderTotal(
  items: { unit_price: number; quantity: number }[]
): number {
  return items.reduce(
    (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
    0
  );
}

// Fetch all orders with customer details and items
export async function getOrders() {
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*)
    `)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return { data: null, error: ordersError };
  }

  if (!ordersData || ordersData.length === 0) {
    return { data: [], error: null };
  }

  // Fetch all order_items for these orders
  const orderIds = ordersData.map((o) => o.id);
  const { data: itemsData } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(name)
    `)
    .in("order_id", orderIds);

  // Map product names into order items
  const itemsByOrder = new Map<string, OrderItem[]>();
  (itemsData || []).forEach((item: any) => {
    const orderId = item.order_id;
    const existing = itemsByOrder.get(orderId) || [];
    existing.push({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      product_name: item.product?.name || "Product",
    });
    itemsByOrder.set(orderId, existing);
  });

  const formattedOrders: Order[] = ordersData.map((order: any) => ({
    id: order.id,
    customer_id: order.customer_id,
    status: order.status as OrderStatus,
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    customer: order.customer ? {
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      created_at: order.customer.created_at,
    } : null,
    items: itemsByOrder.get(order.id) || [],
  }));

  return { data: formattedOrders, error: null };
}

// Fetch single order by ID with details
export async function getOrderById(id: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    return { data: null, error: error || new Error("Order not found") };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(name)
    `)
    .eq("order_id", id);

  const formattedItems: OrderItem[] = (items || []).map((item: any) => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    subtotal: Number(item.subtotal),
    product_name: item.product?.name || "Product",
  }));

  const formattedOrder: Order = {
    id: order.id,
    customer_id: order.customer_id,
    status: order.status as OrderStatus,
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    customer: order.customer ? {
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      created_at: order.customer.created_at,
    } : null,
    items: formattedItems,
  };

  return { data: formattedOrder, error: null };
}

// Create a new order with items
export async function createOrder(
  newOrder: NewOrder,
  items: NewOrderItem[]
) {
  if (!items || items.length === 0) {
    return { data: null, error: new Error("Order must contain at least one item") };
  }

  // 1. Fetch current product inventory to validate stock
  const { data: productsData, error: prodErr } = await getProducts();
  if (prodErr || !productsData) {
    return { data: null, error: new Error("Could not verify product stock") };
  }

  const productMap = new Map<string, Product>(
    productsData.map((p) => [p.id, p])
  );

  // Validate stock for all items
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return { data: null, error: new Error(`Product not found (ID: ${item.product_id})`) };
    }
    if (item.quantity <= 0) {
      return { data: null, error: new Error(`Invalid quantity for "${product.name}"`) };
    }
    if (item.quantity > product.quantity) {
      return {
        data: null,
        error: new Error(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
        ),
      };
    }
  }

  const initialStatus: OrderStatus = newOrder.status || "pending";

  // 2. Insert order row
  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: newOrder.customer_id || null,
      status: initialStatus === "completed" ? "pending" : initialStatus, // create as pending first if completing
      total_amount: newOrder.total_amount,
    })
    .select()
    .single();

  if (orderError || !createdOrder) {
    return { data: null, error: orderError || new Error("Failed to create order") };
  }

  // 3. Insert order items
  const itemsToInsert = items.map((item) => ({
    order_id: createdOrder.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsToInsert);

  if (itemsError) {
    // Cleanup order if items insert failed
    await supabase.from("orders").delete().eq("id", createdOrder.id);
    return { data: null, error: itemsError };
  }

  // 4. If initial status requested was 'completed', complete the order now
  if (initialStatus === "completed") {
    const { error: completeErr } = await updateOrderStatus(
      createdOrder.id,
      "completed"
    );
    if (completeErr) {
      return {
        data: createdOrder,
        error: new Error(`Order created, but could not finalize completion: ${completeErr.message}`),
      };
    }
  }

  return { data: createdOrder, error: null };
}

// Update order status (with safe inventory deduction when marking completed)
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  // If completing an order, perform stock verification and inventory deduction
  if (newStatus === "completed") {
    // Try stored procedure first if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "complete_order",
        { order_id_param: orderId }
      );

      if (!rpcError && rpcData && typeof rpcData === "object") {
        if (rpcData.success) {
          return { data: { success: true }, error: null };
        } else if (rpcData.error) {
          return { data: null, error: new Error(rpcData.error) };
        }
      }
    } catch {
      // Fallback to client-side transactional flow if RPC is not present
    }

    // Client-side Fallback Flow:
    // 1. Fetch order details & items
    const { data: orderRes, error: fetchErr } = await getOrderById(orderId);
    if (fetchErr || !orderRes) {
      return { data: null, error: fetchErr || new Error("Order not found") };
    }

    if (orderRes.status === "completed") {
      return { data: null, error: new Error("Order is already completed") };
    }

    if (orderRes.status === "cancelled") {
      return { data: null, error: new Error("Cannot complete a cancelled order") };
    }

    // 2. Fetch current inventory to verify stock
    const { data: products, error: prodErr } = await getProducts();
    if (prodErr || !products) {
      return { data: null, error: new Error("Could not fetch product inventory") };
    }

    const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    // Check stock for all items
    for (const item of orderRes.items || []) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return {
          data: null,
          error: new Error(`Product not found for item (ID: ${item.product_id})`),
        };
      }
      if (product.quantity < item.quantity) {
        return {
          data: null,
          error: new Error(
            `Insufficient stock for "${product.name}". Available: ${product.quantity}, Required: ${item.quantity}`
          ),
        };
      }
    }

    // 3. Deduct product quantities & record sales
    for (const item of orderRes.items || []) {
      const product = productMap.get(item.product_id)!;
      const newQty = product.quantity - item.quantity;
      await updateProduct(product.id, { quantity: newQty });

      // Record in sales table for backwards compatibility
      await addSale({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        total_price: item.subtotal,
      });
    }

    // 4. Update order status to completed
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId)
      .select()
      .single();

    return { data, error };
  }

  // Standard status update for non-completed statuses (e.g. pending -> cancelled)
  const { data, error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select()
    .single();

  return { data, error };
}
