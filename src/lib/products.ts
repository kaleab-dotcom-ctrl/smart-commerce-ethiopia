import { supabase } from "@/lib/supabase";

export type Product = {
  id: string;
  business_id: string;
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

export async function getProducts() {
  return supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function addProduct(product: NewProduct) {
  return supabase.from("products").insert(product).select().single();
}

export async function updateProduct(id: string, updates: UpdateProduct) {
  return supabase.from("products").update(updates).eq("id", id).select().single();
}

export async function deleteProduct(id: string) {
  return supabase.from("products").delete().eq("id", id);
}
