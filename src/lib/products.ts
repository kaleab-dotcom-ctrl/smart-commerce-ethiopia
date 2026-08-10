import { supabase } from "@/lib/supabase";

export type Product = {
  id: string;
  user_id?: string;
  business_id?: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  created_at: string;
};

export type NewProduct = Omit<Product, "id" | "created_at">;
export type UpdateProduct = Partial<Omit<Product, "id" | "business_id" | "created_at">>;

export type StockStatus = "out_of_stock" | "low_stock" | "in_stock";

export function getStockStatus(quantity: number): StockStatus {
  const qty = Number(quantity) || 0;
  if (qty === 0) return "out_of_stock";
  if (qty <= 5) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "out_of_stock":
      return "Out of Stock";
    case "low_stock":
      return "Low Stock";
    case "in_stock":
      return "In Stock";
  }
}

// Fetch products belonging ONLY to the currently logged-in user
export async function getProducts() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  return query;
}

// Add a new product attached to the logged-in user's user_id
export async function addProduct(product: NewProduct) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { data: null, error: new Error("User authentication required to add product.") };
  }

  return supabase
    .from("products")
    .insert({
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: product.quantity,
      user_id: user.id,
      ...(product.business_id ? { business_id: product.business_id } : {}),
    })
    .select()
    .single();
}

// Update a product owned by the logged-in user
export async function updateProduct(id: string, updates: UpdateProduct) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("products")
    .update(updates)
    .eq("id", id);

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  return query.select().single();
}

// Delete a product belonging to the logged-in user
export async function deleteProduct(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("products").delete().eq("id", id);
  if (user?.id) {
    query = query.eq("user_id", user.id);
  }
  return query;
}
